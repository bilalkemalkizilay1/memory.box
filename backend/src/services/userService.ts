import { userRepository } from '../repositories/userRepository';
import { User } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const userService = {
  getOrCreateUserByToken: async (token: string): Promise<User> => {
    let user = await userRepository.findByToken(token);
    if (!user) {
      const id = uuidv4();
      user = await userRepository.create(id, 'Anonim Gezgin', null, token);
    }
    return user;
  },

  syncProfile: async (token: string, name: string, email: string | null): Promise<User> => {
    let user = await userRepository.findByToken(token);
    if (user) {
      user = await userRepository.update(user.id, name, email);
    } else {
      const id = uuidv4();
      user = await userRepository.create(id, name, email, token);
    }
    return user;
  }
};
