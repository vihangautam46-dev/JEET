import http from 'http';
import { Server } from 'socket.io';
import { app } from './app';
import { env } from './config/env';

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  socket.on('doubt:new', (payload) => io.emit('doubt:created', payload));
  socket.on('doubt:reply', (payload) => io.emit('doubt:replied', payload));
  socket.on('doubt:upvote', (payload) => io.emit('doubt:upvoted', payload));
});

server.listen(env.port, () => {
  console.log(`Backend running on ${env.port}`);
});
