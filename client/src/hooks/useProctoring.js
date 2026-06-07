import { useState, useEffect, useRef } from 'react';

/**
 * Custom React Hook to enforce secure proctoring constraints during live exams.
 * Detects tab switches, clicks outside the active browser window, and full-screen exits.
 * 
 * Tab switch limit: 5 warnings. On 6th switch, exam is locked and teacher must grant unlock.
 * 
 * @param {string} roomCode - Active Socket room code
 * @param {any} socket - Socket.io instance
 * @param {Function} onForceSubmit - Callback to submit answers when user is locked out
 * @param {boolean} isEnabled - Whether proctoring is currently active
 */
export const useProctoring = (roomCode, socket, onForceSubmit, isEnabled = false) => {
    const [anomalyCount, setAnomalyCount] = useState(0);
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [isUnlockRequested, setIsUnlockRequested] = useState(false);
    const [warningMsg, setWarningMsg] = useState('');

    const onForceSubmitRef = useRef(onForceSubmit);
    onForceSubmitRef.current = onForceSubmit;

    const anomalyCountRef = useRef(0);
    const tabSwitchCountRef = useRef(0);
    const isLockedRef = useRef(false);

    const MAX_TAB_SWITCHES = 5;  // Lock on 6th switch (after 5 warnings)
    const MAX_VIOLATIONS = 6;    // Total other violations before force-submit

    const triggerAnomaly = (type, isTabSwitch = false) => {
        if (isLockedRef.current) return; // Don't count while already locked

        // Always log and notify teacher about anomaly
        setAnomalyCount((prev) => {
            const nextVal = prev + 1;
            anomalyCountRef.current = nextVal;
            console.warn(`Proctoring Anomaly detected: ${type}. Total: ${nextVal}`);

            if (socket) {
                socket.emit('anomaly', { roomCode, type });
            }

            return nextVal;
        });

        if (isTabSwitch) {
            setTabSwitchCount((prev) => {
                const nextTabCount = prev + 1;
                tabSwitchCountRef.current = nextTabCount;

                if (nextTabCount >= MAX_TAB_SWITCHES) {
                    // 5th or more tab switch: lock exam, require teacher unlock
                    isLockedRef.current = true;
                    setIsLocked(true);
                    setIsUnlockRequested(false);
                    setWarningMsg(
                        `You have switched tabs ${nextTabCount} time(s). Your exam is now LOCKED. Please request your teacher to unlock your exam to continue.`
                    );

                    if (socket) {
                        socket.emit('student_locked', { roomCode, reason: `Tab switched ${nextTabCount} times — needs teacher unlock` });
                    }
                } else {
                    const remaining = MAX_TAB_SWITCHES - nextTabCount;
                    setWarningMsg(
                        `Tab switch detected! This is warning ${nextTabCount} of ${MAX_TAB_SWITCHES}. You have ${remaining} remaining before your exam is locked.`
                    );
                    setTimeout(() => setWarningMsg(''), 6000);
                }

                return nextTabCount;
            });
        } else {
            // Non-tab violations: show warning. Lock when limit exceeded — do NOT auto-submit.
            // Exam will only auto-submit when the countdown timer runs out.
            const totalNow = anomalyCountRef.current;
            if (totalNow >= MAX_VIOLATIONS) {
                if (!isLockedRef.current) {
                    isLockedRef.current = true;
                    setIsLocked(true);
                    setIsUnlockRequested(false);
                    setWarningMsg('Too many proctoring violations. Your exam is now LOCKED. Request your teacher to unlock to continue.');
                    if (socket) {
                        socket.emit('student_locked', { roomCode, reason: `Max violations reached (${totalNow})` });
                    }
                }
            } else {
                setWarningMsg(`Proctoring violation detected: '${type}'. This has been reported to your teacher.`);
                setTimeout(() => setWarningMsg(''), 5000);
            }
        }
    };

    // Fullscreen toggle
    const enterFullscreen = () => {
        const docEl = document.documentElement;
        try {
            if (docEl.requestFullscreen) docEl.requestFullscreen();
            else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
            else if (docEl.msRequestFullscreen) docEl.msRequestFullscreen();
            setIsFullscreen(true);
        } catch (e) {
            console.error('Fullscreen request rejected:', e);
        }
    };

    // Student requests teacher to unlock their exam
    const requestTeacherUnlock = () => {
        if (!socket || isUnlockRequested) return;
        socket.emit('request_unlock', { roomCode });
        setIsUnlockRequested(true);
        setWarningMsg('Unlock request sent to your teacher. Please wait for them to approve...');
    };

    // 1st useEffect: Track fullscreen changes at all times
    useEffect(() => {
        const updateFullscreen = () => {
            const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
            setIsFullscreen(isFull);
        };

        updateFullscreen();
        document.addEventListener('fullscreenchange', updateFullscreen);
        document.addEventListener('webkitfullscreenchange', updateFullscreen);

        return () => {
            document.removeEventListener('fullscreenchange', updateFullscreen);
            document.removeEventListener('webkitfullscreenchange', updateFullscreen);
        };
    }, []);

    // 2nd useEffect: Listen for teacher unlock grant
    useEffect(() => {
        if (!socket) return;

        const handleTeacherUnlock = () => {
            console.log('[Proctoring] Teacher granted unlock permission.');
            isLockedRef.current = false;
            setIsLocked(false);
            setIsUnlockRequested(false);
            // Reset both tab switch and anomaly counts to give them a fresh start
            setTabSwitchCount(0);
            tabSwitchCountRef.current = 0;
            setAnomalyCount(0);
            anomalyCountRef.current = 0;
            setWarningMsg('Your teacher has unlocked your exam. You may continue. Please stay focused!');
            setTimeout(() => setWarningMsg(''), 6000);
            // Re-enter fullscreen on unlock
            enterFullscreen();
        };

        socket.on('exam_unlocked', handleTeacherUnlock);

        return () => {
            socket.off('exam_unlocked', handleTeacherUnlock);
        };
    }, [socket]);

    // 3rd useEffect: Enforce proctoring rules only when isEnabled
    useEffect(() => {
        if (!roomCode || !isEnabled) return;

        // Tab switches
        const handleVisibilityChange = () => {
            if (document.hidden) {
                triggerAnomaly('Tab Switched', true);
            }
        };

        // Window blur (click outside browser window)
        const handleWindowBlur = () => {
            triggerAnomaly('Window Focus Lost', false);
        };

        // Fullscreen exits
        const handleFullscreenChange = () => {
            const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
            if (!isFull && !isLockedRef.current) {
                triggerAnomaly('Fullscreen Mode Exited', false);
            }
        };

        // Keyboard shortcut restrictions
        const handleKeyDown = (e) => {
            if (
                e.key === 'F5' ||
                (e.ctrlKey && e.key === 'r') ||
                (e.metaKey && e.key === 'r') ||
                e.key === 'F12'
            ) {
                e.preventDefault();
                triggerAnomaly('Shortcut keys pressed (Refresh/Developer tools)', false);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleWindowBlur);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [roomCode, socket, isEnabled]);

    return {
        anomalyCount,
        tabSwitchCount,
        isFullscreen,
        isLocked,
        isUnlockRequested,
        warningMsg,
        enterFullscreen,
        requestTeacherUnlock,
        maxViolations: MAX_VIOLATIONS,
        maxTabSwitches: MAX_TAB_SWITCHES
    };
};
