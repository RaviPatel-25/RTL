import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

// 🔐 Dynamic token → group mapping
const tokenGroupMap = {};        // token => groupId
const groupLatestData = {};      // groupId => last data

app.get('/', (req, res) => {
  res.send('🔐 Real-time server is live with dynamic tokens');
});

// ✅ Receive data + token + group and emit to group
app.post('/send', (req, res) => {
  const { token, group, data } = req.body;

  if (!token || !group || !data) {
    return res.status(400).json({ error: 'Token, group, and data required' });
  }

  tokenGroupMap[token] = group; // Store or update group

  const room = `group:${group}`;
  groupLatestData[group] = data;

  io.to(room).emit('get', data);
  console.log(`Broadcasted to ${room} from token ${token}:`, data);

  res.status(200).json({ message: `Data sent to ${group}` });
});

// ✅ Socket.IO connection
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('auth', ({ token, group }) => {
    if (!token || !group) {
      return socket.disconnect();
    }

    tokenGroupMap[token] = group;
    const room = `group:${group}`;
    socket.join(room);
    console.log(`✅ Socket ${socket.id} joined ${room} with token ${token}`);

    if (groupLatestData[group]) {
      socket.emit('get', groupLatestData[group]);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
