import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

let latestData = null;

app.get('/', (req, res) => {
  res.send('Real-time Server is Live');
});

app.post('/send', (req, res) => {
  const data = req.body;

  if (!data) {
    return res.status(400).json({ error: 'No data provided' });
  }

  latestData = data;
  io.emit('get', data);
  console.log('Broadcasted:', data);

  res.status(200).json({ message: 'Data broadcasted' });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  if (latestData) {
    socket.emit('get', latestData);
  }

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
