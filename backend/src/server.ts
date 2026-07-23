import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './config/db';

// Import Route modules
import userRoutes from './routes/userRoutes';
import memoryRoutes from './routes/memoryRoutes';
import circleRoutes from './routes/circleRoutes';
import musicRoutes from './routes/musicRoutes';
import mediaRoutes from './routes/mediaRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend calls
app.use(cors({
  origin: '*', // Allows all origins, Vercel edge proxy handles actual security
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Author-Token', 'Authorization']
}));

app.use(express.json());

// Mount Modular Routes
app.use('/api/profile', userRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/pins', memoryRoutes); // Backwards-compatibility alias for frontend transition
app.use('/api/circles', circleRoutes);
app.use('/api/songs', musicRoutes); // Kept on /api/songs for Deezer player backwards-compatibility
app.use('/api/media', mediaRoutes);

// Database Initialization & Startup
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Production-ready Backend server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
