import { memoryRepository } from '../repositories/memoryRepository';
import { reactionRepository } from '../repositories/reactionRepository';
import { Memory } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const memoryService = {
  createMemory: async (
    userId: string,
    data: {
      lat: number;
      lng: number;
      content: string;
      privacy_mode: 'public' | 'circle' | 'private';
      circle_id: string | null;
      memory_date: string;
      music_provider: string | null;
      music_track_id: string | null;
      tagged_people: string[];
      image_url: string | null;
    }
  ): Promise<any> => {
    const memoryId = uuidv4();
    const taggedPeopleJson = JSON.stringify(data.tagged_people || []);

    const memory = await memoryRepository.create(
      memoryId,
      userId,
      data.lat,
      data.lng,
      data.content,
      data.privacy_mode,
      data.circle_id,
      data.memory_date,
      data.music_provider,
      data.music_track_id,
      taggedPeopleJson
    );

    let mediaItems: any[] = [];
    if (data.image_url) {
      const mediaId = uuidv4();
      const media = await memoryRepository.addMedia(mediaId, memoryId, data.image_url, 'image', 0);
      mediaItems.push(media);
    }

    return {
      ...memory,
      media: mediaItems
    };
  },

  listMemories: async (userId: string, circleIds: string[]): Promise<any[]> => {
    return memoryRepository.findAllVisible(userId, circleIds);
  },

  updateMemory: async (
    id: string,
    userId: string,
    data: {
      content: string;
      memory_date: string;
      privacy_mode: 'public' | 'circle' | 'private';
      circle_id: string | null;
      music_provider: string | null;
      music_track_id: string | null;
      tagged_people: string[];
    }
  ): Promise<Memory> => {
    const memory = await memoryRepository.findById(id);
    if (!memory) {
      const error: any = new Error('Memory not found');
      error.status = 404;
      throw error;
    }

    // Authorization check
    if (memory.user_id !== userId) {
      const error: any = new Error('Unauthorized: You are not the author of this memory');
      error.status = 403;
      throw error;
    }

    const taggedPeopleJson = JSON.stringify(data.tagged_people || []);
    return memoryRepository.update(
      id,
      data.content,
      data.memory_date,
      data.privacy_mode,
      data.circle_id,
      data.music_provider,
      data.music_track_id,
      taggedPeopleJson
    );
  },

  deleteMemory: async (id: string, userId: string): Promise<void> => {
    const memory = await memoryRepository.findById(id);
    if (!memory) {
      const error: any = new Error('Memory not found');
      error.status = 404;
      throw error;
    }

    if (memory.user_id !== userId) {
      const error: any = new Error('Unauthorized: You are not the author of this memory');
      error.status = 403;
      throw error;
    }

    await memoryRepository.softDelete(id);
  },

  toggleReaction: async (
    memoryId: string,
    userId: string,
    reactionType: 'like' | 'hug'
  ): Promise<{ reacted: boolean; reactionCounts: { likes: number; hugs: number } }> => {
    const memory = await memoryRepository.findById(memoryId);
    if (!memory) {
      const error: any = new Error('Memory not found');
      error.status = 404;
      throw error;
    }

    const existing = await reactionRepository.findReaction(memoryId, userId, reactionType);
    let reacted = false;

    if (existing) {
      await reactionRepository.removeReaction(memoryId, userId, reactionType);
      reacted = false;
    } else {
      const reactionId = uuidv4();
      await reactionRepository.addReaction(reactionId, memoryId, userId, reactionType);
      reacted = true;
    }

    const counts = await reactionRepository.getReactionCounts(memoryId);
    return {
      reacted,
      reactionCounts: counts
    };
  }
};
