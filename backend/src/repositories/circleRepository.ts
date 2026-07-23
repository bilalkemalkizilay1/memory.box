import { getDb } from '../config/db';
import { Circle, CircleMembership } from '../types';

export const circleRepository = {
  findById: async (id: string): Promise<Circle | null> => {
    const db = await getDb();
    return db.get<Circle>('SELECT * FROM circles WHERE id = ?', id.toUpperCase());
  },

  create: async (id: string, name: string): Promise<Circle> => {
    const db = await getDb();
    await db.run('INSERT INTO circles (id, name) VALUES (?, ?)', id.toUpperCase(), name);
    const circle = await db.get<Circle>('SELECT * FROM circles WHERE id = ?', id.toUpperCase());
    if (!circle) throw new Error('Failed to create circle');
    return circle;
  },

  addMember: async (circleId: string, userId: string, role: string): Promise<CircleMembership> => {
    const db = await getDb();
    await db.run(
      'INSERT INTO circle_memberships (circle_id, user_id, role) VALUES (?, ?, ?) ON CONFLICT (circle_id, user_id) DO NOTHING',
      circleId.toUpperCase(),
      userId,
      role
    );
    const membership = await db.get<CircleMembership>(
      'SELECT * FROM circle_memberships WHERE circle_id = ? AND user_id = ?',
      circleId.toUpperCase(),
      userId
    );
    if (!membership) throw new Error('Failed to create circle membership');
    return membership;
  },

  findMembership: async (circleId: string, userId: string): Promise<CircleMembership | null> => {
    const db = await getDb();
    return db.get<CircleMembership>(
      'SELECT * FROM circle_memberships WHERE circle_id = ? AND user_id = ?',
      circleId.toUpperCase(),
      userId
    );
  },

  findUserMemberships: async (userId: string): Promise<Circle[]> => {
    const db = await getDb();
    const rows = await db.all(
      `SELECT c.* FROM circles c
       JOIN circle_memberships cm ON c.id = cm.circle_id
       WHERE cm.user_id = ?`,
      userId
    );
    return rows;
  }
};
