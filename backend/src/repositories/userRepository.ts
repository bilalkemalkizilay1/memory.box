import { getDb } from '../config/db';
import { User } from '../types';

export const userRepository = {
  findByToken: async (token: string): Promise<User | null> => {
    const db = await getDb();
    return db.get<User>('SELECT * FROM users WHERE author_token = ?', token);
  },

  findById: async (id: string): Promise<User | null> => {
    const db = await getDb();
    return db.get<User>('SELECT * FROM users WHERE id = ?', id);
  },

  create: async (id: string, name: string, email: string | null, token: string): Promise<User> => {
    const db = await getDb();
    await db.run(
      'INSERT INTO users (id, name, email, author_token) VALUES (?, ?, ?, ?)',
      id,
      name,
      email,
      token
    );
    const user = await db.get<User>('SELECT * FROM users WHERE id = ?', id);
    if (!user) throw new Error('Failed to create user');
    return user;
  },

  update: async (id: string, name: string, email: string | null): Promise<User> => {
    const db = await getDb();
    await db.run(
      'UPDATE users SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      name,
      email,
      id
    );
    const user = await db.get<User>('SELECT * FROM users WHERE id = ?', id);
    if (!user) throw new Error('Failed to update user');
    return user;
  }
};
