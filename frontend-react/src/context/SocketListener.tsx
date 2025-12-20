import React, { useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAppContext } from './AppContext';
import toast from 'react-hot-toast';

export const SocketListener: React.FC = () => {
    const { socket } = useSocket();
    const { refreshCurrentGroupData } = useAppContext();

    useEffect(() => {
        if (!socket) return;

        socket.on('scheduleCreated', (newSchedule) => {
            refreshCurrentGroupData();
            toast.success(`New schedule created: ${newSchedule.name}`, { icon: '📅' });
        });

        socket.on('scheduleUpdated', () => {
            refreshCurrentGroupData();
        });

        socket.on('scheduleDeleted', () => {
            refreshCurrentGroupData();
            toast.error('A schedule was deleted', { icon: '🗑️' });
        });

        socket.on('playerUpdated', () => {
            refreshCurrentGroupData();
        });

        socket.on('playerDeleted', () => {
            refreshCurrentGroupData();
        });

        socket.on('courtCreated', () => {
            refreshCurrentGroupData();
        });

        socket.on('courtUpdated', () => {
            refreshCurrentGroupData();
        });

        socket.on('courtDeleted', () => {
            refreshCurrentGroupData();
        });

        return () => {
            socket.off('scheduleCreated');
            socket.off('scheduleUpdated');
            socket.off('scheduleDeleted');
            socket.off('playerUpdated');
            socket.off('playerDeleted');
            socket.off('courtCreated');
            socket.off('courtUpdated');
            socket.off('courtDeleted');
        };
    }, [socket, refreshCurrentGroupData]);

    return null;
};
