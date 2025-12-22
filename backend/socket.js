import { Server } from 'socket.io';

let io;

export const initSocket = (server, allowedOrigins) => {
    io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {

        socket.on('joinGroup', (groupId) => {
            socket.join(`group:${groupId}`);
        });

        socket.on('leaveGroup', (groupId) => {
            socket.leave(`group:${groupId}`);
        });

        socket.on('disconnect', () => {
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

export const emitToGroup = (groupId, event, data) => {
    if (io) {
        io.to(`group:${groupId}`).emit(event, data);
    }
};
