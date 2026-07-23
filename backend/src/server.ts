import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import { initDb, getDb } from './db';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Ensure local uploads directory exists (backward compatibility/fallback)
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded images statically
app.use('/uploads', express.static(uploadsDir));

// Configure multer for memory storage (direct to Supabase)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Endpoints

// 1. Fetch pins (public + joined circles)
app.get('/api/pins', async (req: Request, res: Response) => {
  try {
    const circleIdsParam = req.query.circle_ids as string | undefined;
    const circleIds = circleIdsParam ? circleIdsParam.split(',') : [];

    const db = await getDb();
    
    let query = "SELECT * FROM pins WHERE privacy_mode = 'public'";
    const params: any[] = [];

    if (circleIds.length > 0) {
      const placeholders = circleIds.map(() => '?').join(',');
      query += ` OR (privacy_mode = 'circle' AND circle_id IN (${placeholders}))`;
      params.push(...circleIds);
    }

    const pins = await db.all(query, ...params);
    res.json(pins);
  } catch (error) {
    console.error('Error fetching pins:', error);
    res.status(500).json({ error: 'Server error fetching pins' });
  }
});

// 2. Create a new pin
app.post('/api/pins', upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng, content, privacy_mode, circle_id, memory_date, spotify_track_id, people } = req.body;
    
    if (!lat || !lng || !content || !privacy_mode || !memory_date) {
       res.status(400).json({ error: 'Missing required fields' });
       return;
    }

    let imageUrl: string | null = null;

    if (req.file) {
      const file = req.file;
      const ext = path.extname(file.originalname);
      const fileName = `${uuidv4()}${ext}`;

      // Upload to Supabase Storage bucket 'memory-images'
      const { data, error: uploadError } = await supabase.storage
        .from('memory-images')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (uploadError) {
        console.error('Supabase image upload error:', uploadError);
        res.status(500).json({ error: 'Failed to upload image to Supabase Storage' });
        return;
      }

      // Get public URL of the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('memory-images')
        .getPublicUrl(fileName);

      imageUrl = publicUrl;
    }

    const authorToken = req.headers['x-author-token'] as string || req.body.author_token as string || null;
    const pinId = uuidv4();
    const db = await getDb();
    await db.run(
      `INSERT INTO pins (id, lat, lng, content, image_url, privacy_mode, circle_id, memory_date, spotify_track_id, people, author_token) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      pinId,
      parseFloat(lat),
      parseFloat(lng),
      content,
      imageUrl,
      privacy_mode,
      circle_id || null,
      memory_date,
      spotify_track_id || null,
      people || null,
      authorToken
    );

    const newPin = await db.get('SELECT * FROM pins WHERE id = ?', pinId);
    res.status(201).json(newPin);
  } catch (error) {
    console.error('Error creating pin:', error);
    res.status(500).json({ error: 'Server error creating pin' });
  }
});

// 3. Like a pin
app.post('/api/pins/:id/like', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();
    
    await db.run('UPDATE pins SET likes_count = likes_count + 1 WHERE id = ?', id);
    const updated = await db.get('SELECT likes_count FROM pins WHERE id = ?', id);
    
    if (!updated) {
       res.status(404).json({ error: 'Pin not found' });
       return;
    }
    res.json(updated);
  } catch (error) {
    console.error('Error liking pin:', error);
    res.status(500).json({ error: 'Server error updating likes' });
  }
});

// 4. Hug a pin
app.post('/api/pins/:id/hug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();
    
    await db.run('UPDATE pins SET hugs_count = hugs_count + 1 WHERE id = ?', id);
    const updated = await db.get('SELECT hugs_count FROM pins WHERE id = ?', id);
    
    if (!updated) {
       res.status(404).json({ error: 'Pin not found' });
       return;
    }
    res.json(updated);
  } catch (error) {
    console.error('Error hugging pin:', error);
    res.status(500).json({ error: 'Server error updating hugs' });
  }
});

// 5. Create a circle
app.post('/api/circles', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name) {
       res.status(400).json({ error: 'Circle name is required' });
       return;
    }
    
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    const db = await getDb();
    
    await db.run('INSERT INTO circles (id, name) VALUES (?, ?)', id, name);
    const newCircle = await db.get('SELECT * FROM circles WHERE id = ?', id);
    res.status(201).json(newCircle);
  } catch (error) {
    console.error('Error creating circle:', error);
    res.status(500).json({ error: 'Server error creating circle' });
  }
});

// 6. Get a circle by ID (join validation)
app.get('/api/circles/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();
    
    const circle = await db.get('SELECT * FROM circles WHERE id = ?', id.toUpperCase());
    if (!circle) {
       res.status(404).json({ error: 'Circle not found with this code' });
       return;
    }
    res.json(circle);
  } catch (error) {
    console.error('Error fetching circle:', error);
    res.status(500).json({ error: 'Server error fetching circle' });
  }
});

// 7. Search songs using Deezer public API
app.get('/api/songs/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    if (!query) {
      res.json([]);
      return;
    }
    const response = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    const tracks = (data.data || []).slice(0, 10).map((track: any) => ({
      id: track.id.toString(),
      title: track.title,
      artist: track.artist.name,
      album: track.album.title,
      cover: track.album.cover_medium,
      preview: track.preview
    }));
    res.json(tracks);
  } catch (error) {
    console.error('Error searching songs:', error);
    res.status(500).json({ error: 'Failed to search songs' });
  }
});

// 7.5 Get track details by ID using Deezer public API
app.get('/api/songs/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const response = await fetch(`https://api.deezer.com/track/${id}`);
    const track = await response.json();
    if (track.error) {
       res.status(404).json({ error: 'Track not found' });
       return;
    }
    res.json({
      id: track.id.toString(),
      title: track.title,
      artist: track.artist.name,
      album: track.album.title,
      cover: track.album.cover_medium,
      preview: track.preview
    });
  } catch (error) {
    console.error('Error fetching track details:', error);
    res.status(500).json({ error: 'Failed to fetch track details' });
  }
});

// 8. Update an existing pin
app.put('/api/pins/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content, memory_date, privacy_mode, circle_id, spotify_track_id, people } = req.body;
    const authorToken = req.headers['x-author-token'] as string || req.body.author_token as string || null;

    if (!content || !privacy_mode || !memory_date) {
       res.status(400).json({ error: 'Missing required fields' });
       return;
    }

    const db = await getDb();
    
    const pin = await db.get('SELECT * FROM pins WHERE id = ?', id);
    if (!pin) {
       res.status(404).json({ error: 'Pin not found' });
       return;
    }

    // Authorization check: allow if pin has no token (legacy data),
    // or if client token matches pin author_token, or if it matches ADMIN_TOKEN
    const adminToken = process.env.ADMIN_TOKEN || 'admin-super-secret-token';
    if (pin.author_token && authorToken !== pin.author_token && authorToken !== adminToken) {
       res.status(403).json({ error: 'Unauthorized: You are not the author of this memory.' });
       return;
    }

    await db.run(
      `UPDATE pins 
       SET content = ?, memory_date = ?, privacy_mode = ?, circle_id = ?, spotify_track_id = ?, people = ? 
       WHERE id = ?`,
      content,
      memory_date,
      privacy_mode,
      circle_id || null,
      spotify_track_id || null,
      people || null,
      id
    );

    const updatedPin = await db.get('SELECT * FROM pins WHERE id = ?', id);
    res.json(updatedPin);
  } catch (error) {
    console.error('Error updating pin:', error);
    res.status(500).json({ error: 'Server error updating pin' });
  }
});

// 9. Delete a pin (Secured)
app.delete('/api/pins/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const authorToken = req.headers['x-author-token'] as string || req.query.author_token as string || null;
    const db = await getDb();

    const pin = await db.get('SELECT * FROM pins WHERE id = ?', id);
    if (!pin) {
       res.status(404).json({ error: 'Pin not found' });
       return;
    }

    const adminToken = process.env.ADMIN_TOKEN || 'admin-super-secret-token';
    if (pin.author_token && authorToken !== pin.author_token && authorToken !== adminToken) {
       res.status(403).json({ error: 'Unauthorized: You are not the author of this memory.' });
       return;
    }

    await db.run('DELETE FROM pins WHERE id = ?', id);
    res.json({ success: true, message: 'Memory deleted successfully' });
  } catch (error) {
    console.error('Error deleting pin:', error);
    res.status(500).json({ error: 'Server error deleting pin' });
  }
});

// Start server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
