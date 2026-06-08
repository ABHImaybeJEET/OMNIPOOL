const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const ChatMessage = require('./models/ChatMessage');
const HardwareRequest = require('./models/HardwareRequest');
const path = require('path');
const fs = require('fs');

// Load environment variables in order of precedence:
// 1. Existing process.env variables (e.g. injected by Render, Docker, etc.)
// 2. server/.env (local server environment file)
// 3. ../../.env (workspace root environment file)
const serverEnvPath = path.join(__dirname, '../.env');
const rootEnvPath = path.join(__dirname, '../../.env');

if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
}
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}
dotenv.config(); // Fallback for standard .env in CWD

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// CORS Configuration
const clientUrls = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, postman, curl)
    if (!origin) return callback(null, true);
    
    const isAllowed = clientUrls.some((url) => url === origin || url.replace(/\/$/, '') === origin);
    
    if (isAllowed || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Security & Configuration checks for production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev-secret') {
    console.warn('⚠️  WARNING: JWT_SECRET is not set or using default value in production! Please set a secure JWT_SECRET in environment variables.');
  }
}

// Socket.IO setup
const io = new Server(server, {
  cors: corsOptions,
});

// Make io accessible to routes
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // User joins their personal notification room
  socket.on('join_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} joined room user_${userId}`);
  });

  // Join a request-specific chat room
  socket.on('join_chat', (requestId) => {
    socket.join(`chat_${requestId}`);
    console.log(`💬 Socket ${socket.id} joined chat_${requestId}`);
  });

  // Handle sending messages
  socket.on('send_message', async (data) => {
    try {
      const { request_id, sender_id, receiver_id, message } = data;

      // Verify the request exists and user is involved
      const request = await HardwareRequest.findById(request_id);
      if (!request) return;

      const chatMessage = await ChatMessage.create({
        request_id,
        sender_id,
        receiver_id,
        message,
      });

      const populated = await ChatMessage.findById(chatMessage._id)
        .populate('sender_id', 'name email avatar_url')
        .populate('receiver_id', 'name email avatar_url');

      // Emit to chat room
      io.to(`chat_${request_id}`).emit('new_message', populated);
      // Also notify receiver
      io.to(`user_${receiver_id}`).emit('message_notification', {
        request_id,
        sender: populated.sender_id,
        preview: message.substring(0, 50),
      });
    } catch (error) {
      console.error('Socket send_message error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// Routes
app.use('/api/ai', require('./routes/ai.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/hardware', require('./routes/hardware.routes'));
app.use('/api/projects', require('./routes/project.routes'));
app.use('/api/requests', require('./routes/request.routes'));
app.use('/api/chat', require('./routes/chat.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 OmniPool server running on port ${PORT}`);
});

module.exports = app;
