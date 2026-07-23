import { circleRepository } from '../repositories/circleRepository';
import { Circle } from '../types';

export const circleService = {
  createCircle: async (name: string, userId: string): Promise<Circle> => {
    // Generate a 6-character random uppercase alphanumeric code (e.g. X8J9KL)
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    const circle = await circleRepository.create(id, name);
    await circleRepository.addMember(id, userId, 'owner');
    return circle;
  },

  joinCircle: async (circleId: string, userId: string): Promise<Circle> => {
    const circle = await circleRepository.findById(circleId);
    if (!circle) {
      const error: any = new Error('Circle not found with this code');
      error.status = 404;
      throw error;
    }
    await circleRepository.addMember(circleId, userId, 'member');
    return circle;
  },

  getUserCircles: async (userId: string): Promise<Circle[]> => {
    return circleRepository.findUserMemberships(userId);
  }
};
