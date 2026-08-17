let io;

export const setSocketServer = (server) => {
  io = server;
};

export const emitToUser = (userId, event, payload) => {
  io?.to(`user:${userId}`).emit(event, payload);
};

export const emitToChat = (chatId, event, payload) => {
  io?.to(`chat:${chatId}`).emit(event, payload);
};
