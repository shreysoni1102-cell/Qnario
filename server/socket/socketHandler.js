const { examRooms } = require('../controllers/examController');

/**
 * Attaches real-time Socket.io handlers to the HTTP server.
 * Handles cheat proctoring anomalies, room synchs, and doubt streams.
 * @param {import('socket.io').Server} io - Socket.io Server instance
 */
const registerSocketHandlers = (io) => {
    // Bind to global namespace so exam controllers can dispatch submit broadcasts
    global.io = io;

    io.on('connection', (socket) => {
        console.log(`🔌 [Socket] Client connected: ${socket.id}`);

        // 1. Teacher joins monitoring room
        socket.on('teacher_join', ({ roomCode }) => {
            if (!roomCode) return;
            const targetRoom = `teacher_${roomCode}`;
            socket.join(targetRoom);
            console.log(`👨‍🏫 [Socket] Teacher monitoring room: ${roomCode}`);
        });

        // 2. Student joins exam room
        socket.on('student_join', ({ roomCode, studentName, studentEmail }) => {
            if (!roomCode) return;
            
            const room = examRooms[roomCode];
            if (!room) {
                socket.emit('error', { message: 'Invalid or non-existent room code.' });
                return;
            }

            socket.join(`exam_${roomCode}`);
            
            // Register student in-memory
            room.students[socket.id] = {
                name: studentName,
                email: studentEmail,
                progress: 0,
                answered: 0,
                status: 'active',
                joinedAt: new Date()
            };

            // Alert teacher monitor
            io.to(`teacher_${roomCode}`).emit('student_joined', {
                socketId: socket.id,
                name: studentName,
                email: studentEmail,
                count: Object.keys(room.students).length
            });

            // Confirm join status back to student
            socket.emit('joined_ok', {
                duration: room.duration,
                started: room.started,
                startTime: room.startTime
            });

            console.log(`🎓 [Socket] Student '${studentName}' joined room code: ${roomCode}`);
        });

        // 3. Student updates answering progress
        socket.on('student_progress', ({ roomCode, answered, total }) => {
            if (!roomCode) return;
            
            const room = examRooms[roomCode];
            if (room && room.students[socket.id]) {
                const student = room.students[socket.id];
                student.answered = answered;
                student.progress = total > 0 ? Math.round((answered / total) * 100) : 0;

                // Sync with teacher screen
                io.to(`teacher_${roomCode}`).emit('progress_update', {
                    socketId: socket.id,
                    name: student.name,
                    answered,
                    total,
                    progress: student.progress
                });
            }
        });

        // 4. Student broadcasts a doubt question
        socket.on('student_doubt', ({ roomCode, studentName, message }) => {
            if (!roomCode) return;
            io.to(`teacher_${roomCode}`).emit('doubt_received', {
                studentName,
                message,
                time: new Date().toLocaleTimeString()
            });
        });

        // 5. Teacher broadcasts replies to questions
        socket.on('teacher_reply', ({ roomCode, message }) => {
            if (!roomCode) return;
            io.to(`exam_${roomCode}`).emit('teacher_reply', {
                message,
                time: new Date().toLocaleTimeString()
            });
        });

        // 6. Teacher triggers official exam launch
        socket.on('start_exam', ({ roomCode }) => {
            if (!roomCode) return;

            const room = examRooms[roomCode];
            if (!room) return;

            room.started = true;
            room.startTime = new Date();

            // Broad-scale signals to students and monitors
            io.to(`exam_${roomCode}`).emit('exam_started', {
                startTime: room.startTime,
                duration: room.duration
            });
            io.to(`teacher_${roomCode}`).emit('exam_started', {
                startTime: room.startTime
            });

            console.log(`🏁 [Socket] Exam started in room code: ${roomCode}`);
        });

        // 7. Teacher triggers forced premature end of exam
        socket.on('end_exam', ({ roomCode }) => {
            if (!roomCode) return;

            const room = examRooms[roomCode];
            if (!room) return;

            io.to(`exam_${roomCode}`).emit('force_end_exam');
            console.log(`⏹️ [Socket] Exam force-ended in room code: ${roomCode}`);
        });

        // 8. Proctoring: Alert teacher of anomalous events (blur, window tab change, etc.)
        socket.on('anomaly', ({ roomCode, type }) => {
            if (!roomCode) return;

            const room = examRooms[roomCode];
            const name = room?.students[socket.id]?.name || 'Unknown student';

            io.to(`teacher_${roomCode}`).emit('anomaly_alert', {
                studentName: name,
                type,
                time: new Date().toLocaleTimeString()
            });
            console.warn(`[Anomaly Alert] '${name}' triggered '${type}' in room: ${roomCode}`);
        });

        // 9. Student exam is auto-locked due to too many tab switches
        socket.on('student_locked', ({ roomCode, reason }) => {
            if (!roomCode) return;

            const room = examRooms[roomCode];
            const name = room?.students[socket.id]?.name || 'Unknown student';

            // Update student status in room memory
            if (room && room.students[socket.id]) {
                room.students[socket.id].status = 'locked';
            }

            console.warn(`[Proctor] Student '${name}' is now locked in room ${roomCode}: ${reason}`);

            // Alert teacher so they can see the locked student
            io.to(`teacher_${roomCode}`).emit('anomaly_alert', {
                studentName: name,
                type: `EXAM LOCKED — ${reason}`,
                time: new Date().toLocaleTimeString()
            });
        });

        // 10. Student requests teacher to unlock their locked exam
        socket.on('request_unlock', ({ roomCode }) => {
            if (!roomCode) return;

            const room = examRooms[roomCode];
            const name = room?.students[socket.id]?.name || 'Unknown student';
            const reason = room?.students[socket.id]?.status === 'locked'
                ? 'Too many tab switches'
                : 'Proctor violation';

            // Store unlock request in room memory so teacher knows who to unlock
            if (room && room.students[socket.id]) {
                room.students[socket.id].unlockRequested = true;
                room.students[socket.id].unlockSocketId = socket.id;
            }

            console.log(`[Proctor] '${name}' requested teacher unlock in room ${roomCode}`);

            io.to(`teacher_${roomCode}`).emit('unlock_request', {
                socketId: socket.id,
                studentName: name,
                reason,
                time: new Date().toLocaleTimeString()
            });
        });

        // 11. Teacher unlocks a specific locked student
        socket.on('unlock_student', ({ roomCode, targetSocketId }) => {
            if (!roomCode || !targetSocketId) return;

            const room = examRooms[roomCode];
            if (room && room.students[targetSocketId]) {
                room.students[targetSocketId].status = 'active';
                room.students[targetSocketId].unlockRequested = false;
            }

            // Send unlock confirmation directly to the student
            io.to(targetSocketId).emit('exam_unlocked');
            console.log(`[Proctor] Teacher unlocked student ${targetSocketId} in room ${roomCode}`);
        });

        // 12. Clean up student registration upon connection drops
        socket.on('disconnect', () => {
            for (const code of Object.keys(examRooms)) {
                const room = examRooms[code];
                if (room.students[socket.id]) {
                    const name = room.students[socket.id].name;
                    delete room.students[socket.id];

                    // Inform teacher monitor
                    io.to(`teacher_${code}`).emit('student_left', {
                        socketId: socket.id,
                        name,
                        count: Object.keys(room.students).length
                    });
                    console.log(`🔌 [Socket] Student '${name}' disconnected.`);
                }
            }
        });
    });
};

module.exports = registerSocketHandlers;
