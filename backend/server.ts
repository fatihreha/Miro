import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';

dotenv.config();

connectDB();

const app = express();
const httpServer = createServer(app);

// Socket.io Setup
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Vite default port
    methods: ["GET", "POST"]
  }
});

app.use(cors() as express.RequestHandler);
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.send('SportPulse API is running');
});

// Socket.io Logic
io.on('connection', (socket) => {
  console.log('User Connected:', socket.id);

  socket.on('join_room', (userId) => {
    socket.join(userId);
    console.log(`User with ID: ${socket.id} joined room: ${userId}`);
  });

  socket.on('send_message', (data) => {
    // Broadcast to recipient room
    socket.to(data.recipientId).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});