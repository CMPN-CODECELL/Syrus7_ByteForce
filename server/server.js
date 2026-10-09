import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import { setupWebSocket } from './ws.js';

import filesRouter from './routes/files.js';
import postsRouter from './routes/posts.js';
import communitiesRouter from './routes/communities.js';
import marketplaceRouter from './routes/marketplace.js';
import opportunitiesRouter from './routes/opportunities.js';
import chatsRouter from './routes/chats.js';
import usersRouter from './routes/users.js';
import databaseRouter from './routes/database.js';
import aiRouter from './routes/ai.js';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Campusly Backend API', timestamp: new Date() });
});

// API Routes
app.use('/api/files', filesRouter);
app.use('/api/posts', postsRouter);
app.use('/api/communities', communitiesRouter);
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/opportunities', opportunitiesRouter);
app.use('/api/chats', chatsRouter);
app.use('/api/users', usersRouter);
app.use('/api/database', databaseRouter);
app.use('/api/ai', aiRouter);

const server = http.createServer(app);

// Setup WebSocket server for real-time multi-device sync
setupWebSocket(server);

// Start server after connecting to MongoDB
async function startServer() {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Campusly Backend Server running on http://localhost:${PORT}`);
    console.log(`WebSocket server active on ws://localhost:${PORT}/ws`);
  });

  try {
    await connectDB();
  } catch (err) {
    console.warn('\n⚠️ MongoDB Atlas Connection Alert:');
    console.warn('Failed to connect to MongoDB Atlas cluster (campusly.8nmz0rh.mongodb.net).');
    console.warn('Common cause: Your current IP is not whitelisted in MongoDB Atlas.');
    console.warn('Action: Go to cloud.mongodb.com -> Network Access -> Add IP Address -> Allow Access From Anywhere (0.0.0.0/0).');
    console.warn('Server remains active; retrying connection in background every 10 seconds...\n');

    const retryInterval = setInterval(async () => {
      try {
        await connectDB();
        console.log('✅ Successfully connected to MongoDB Atlas database!');
        clearInterval(retryInterval);
      } catch {
        // Keep retrying quietly until connection succeeds
      }
    }, 10000);
  }
}

startServer();
