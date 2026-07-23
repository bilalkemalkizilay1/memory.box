import { getDb } from '../config/db';
import { MemoryReaction } from '../types';

export const reactionRepository = {
  findReaction: async (memoryId: string, userId: string, type: string): Promise<MemoryReaction | null> => {
    const db = await getDb();
    return db.get<MemoryReaction>(
      'SELECT * FROM memory_reactions WHERE memory_id = ? AND user_id = ? AND reaction_type = ?',
      memoryId,
      userId,
      type
    );
  },

  addReaction: async (id: string, memoryId: string, userId: string, type: string): Promise<MemoryReaction> => {
    const db = await getDb();
    await db.run(
      'INSERT INTO memory_reactions (id, memory_id, user_id, reaction_type) VALUES (?, ?, ?, ?)',
      id,
      memoryId,
      userId,
      type
    );
    const reaction = await db.get<MemoryReaction>('SELECT * FROM memory_reactions WHERE id = ?', id);
    if (!reaction) throw new Error('Failed to create reaction');
    return reaction;
  },

  removeReaction: async (memoryId: string, userId: string, type: string): Promise<void> => {
    const db = await getDb();
    await db.run(
      'DELETE FROM memory_reactions WHERE memory_id = ? AND user_id = ? AND reaction_type = ?',
      memoryId,
      userId,
      type
    );
  },

  getReactionCounts: async (memoryId: string): Promise<{ likes: number; hugs: number }> => {
    const db = await getDb();
    const likes = await db.get('SELECT COUNT(*) as count FROM memory_reactions WHERE memory_id = ? AND reaction_type = $2', memoryId, 'like');
    const hugs = await db.get('SELECT COUNT(*) as count FROM memory_reactions WHERE memory_id = ? AND reaction_type = $2', memoryId, 'hug');
    return {
      likes: parseInt(likes?.count || '0', 10),
      hugs: parseInt(hugs?.count || '0', 10)
    };
  }
};
