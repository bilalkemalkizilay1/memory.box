import { getDb } from '../config/db';
import { Memory, Media } from '../types';

export const memoryRepository = {
  create: async (
    id: string,
    userId: string,
    lat: number,
    lng: number,
    content: string,
    privacyMode: string,
    circleId: string | null,
    memoryDate: string,
    musicProvider: string | null,
    musicTrackId: string | null,
    taggedPeople: string
  ): Promise<Memory> => {
    const db = await getDb();
    await db.run(
      `INSERT INTO memories (id, user_id, lat, lng, content, privacy_mode, circle_id, memory_date, music_provider, music_track_id, tagged_people) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      userId,
      lat,
      lng,
      content,
      privacyMode,
      circleId,
      memoryDate,
      musicProvider,
      musicTrackId,
      taggedPeople
    );
    const memory = await db.get<Memory>('SELECT * FROM memories WHERE id = ?', id);
    if (!memory) throw new Error('Failed to create memory');
    return memory;
  },

  findById: async (id: string): Promise<Memory | null> => {
    const db = await getDb();
    return db.get<Memory>('SELECT * FROM memories WHERE id = ? AND deleted_at IS NULL', id);
  },

  findAllVisible: async (userId: string, circleIds: string[]): Promise<any[]> => {
    const db = await getDb();
    
    // Base SQL selecting memories, authors, and aggregating associated media in display order
    let query = `
      SELECT m.*, u.name as author_name,
             (SELECT COUNT(*) FROM memory_reactions mr WHERE mr.memory_id = m.id AND mr.reaction_type = 'like') as likes_count,
             (SELECT COUNT(*) FROM memory_reactions mr WHERE mr.memory_id = m.id AND mr.reaction_type = 'hug') as hugs_count,
             COALESCE(
               (SELECT json_agg(json_build_object('id', med.id, 'url', med.url, 'type', med.type, 'display_order', med.display_order) ORDER BY med.display_order)
                FROM media med WHERE med.memory_id = m.id), '[]'::json
             ) as media
      FROM memories m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.deleted_at IS NULL AND (
        m.privacy_mode = 'public'
        OR (m.privacy_mode = 'private' AND m.user_id = ?)
    `;
    const params: any[] = [userId];

    if (circleIds.length > 0) {
      query += ` OR (m.privacy_mode = 'circle' AND m.circle_id = ANY(?))`;
      params.push(circleIds);
    } else {
      // If user joined no circles, include a dummy condition to keep query structure
      query += ` OR (m.privacy_mode = 'circle' AND m.circle_id = 'non-existent-circle')`;
    }

    query += ` ) ORDER BY m.memory_date DESC, m.created_at DESC`;
    const rows = await db.all(query, ...params);
    return rows;
  },

  update: async (
    id: string,
    content: string,
    memoryDate: string,
    privacyMode: string,
    circleId: string | null,
    musicProvider: string | null,
    musicTrackId: string | null,
    taggedPeople: string
  ): Promise<Memory> => {
    const db = await getDb();
    await db.run(
      `UPDATE memories 
       SET content = ?, memory_date = ?, privacy_mode = ?, circle_id = ?, music_provider = ?, music_track_id = ?, tagged_people = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      content,
      memoryDate,
      privacyMode,
      circleId,
      musicProvider,
      musicTrackId,
      taggedPeople,
      id
    );
    const memory = await db.get<Memory>('SELECT * FROM memories WHERE id = ?', id);
    if (!memory) throw new Error('Failed to update memory');
    return memory;
  },

  softDelete: async (id: string): Promise<void> => {
    const db = await getDb();
    await db.run('UPDATE memories SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', id);
  },

  addMedia: async (
    id: string,
    memoryId: string,
    url: string,
    type: string,
    displayOrder: number
  ): Promise<Media> => {
    const db = await getDb();
    await db.run(
      'INSERT INTO media (id, memory_id, url, type, display_order) VALUES (?, ?, ?, ?, ?)',
      id,
      memoryId,
      url,
      type,
      displayOrder
    );
    const mediaItem = await db.get<Media>('SELECT * FROM media WHERE id = ?', id);
    if (!mediaItem) throw new Error('Failed to add media');
    return mediaItem;
  },

  findMediaByMemoryId: async (memoryId: string): Promise<Media[]> => {
    const db = await getDb();
    return db.all('SELECT * FROM media WHERE memory_id = ? ORDER BY display_order ASC', memoryId);
  },

  deleteMediaByMemoryId: async (memoryId: string): Promise<void> => {
    const db = await getDb();
    await db.run('DELETE FROM media WHERE memory_id = ?', memoryId);
  }
};
