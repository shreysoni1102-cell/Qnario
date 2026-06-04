import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { token, user } = useAuth();

    useEffect(() => {
        if (token && user) {
            console.log(`🔌 [Socket] Initializing websocket channel to ${SOCKET_URL}`);
            const socketInstance = io(SOCKET_URL, {
                auth: { token },
                transports: ['websocket'],
                reconnection: true,
                reconnectionDelay: 2000
            });

            socketInstance.on('connect', () => {
                console.log(`🔌 [Socket] Connected successfully: ${socketInstance.id}`);
            });

            socketInstance.on('disconnect', (reason) => {
                console.warn('🔌 [Socket] Disconnected:', reason);
            });

            setSocket(socketInstance);

            return () => {
                console.log('🔌 [Socket] Terminating active websocket connections.');
                socketInstance.disconnect();
            };
        } else {
            setSocket(null);
        }
    }, [token, user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
