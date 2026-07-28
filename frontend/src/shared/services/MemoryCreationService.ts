import * as api from '@api/api';
import { Memory } from '@shared/types/types';

export interface MemoryCreationData {
  lat: number;
  lng: number;
  content: string;
  privacy_mode: 'public' | 'circle' | 'private';
  circle_id: string | null;
  memory_date: string;
  images: File[];
  music_track_id: string | null;
  tagged_people: string | null;
}

export class MemoryCreationService {
  /**
   * Helper to convert base64 image strings back to File objects.
   */
  static dataURLtoFile(dataurl: string, filename: string): File {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  /**
   * Creates an offline memory structure to be added to the sync queue.
   */
  static createOfflineMemoryData(data: MemoryCreationData): Memory {
    return {
      id: `offline-${Date.now()}`,
      lat: data.lat,
      lng: data.lng,
      content: data.content,
      privacy_mode: data.privacy_mode,
      circle_id: data.circle_id,
      created_at: new Date().toISOString(),
      memory_date: data.memory_date,
      likes_count: 0,
      hugs_count: 0,
      music_provider: null,
      music_track_id: null,
      tagged_people: data.tagged_people || null,
      media: [] // Offline media not fully implemented yet
    };
  }

  /**
   * Processes private memory creation entirely offline.
   */
  static async processPrivateMemory(data: MemoryCreationData): Promise<Memory> {
    const newPrivateMemory: Memory = {
      id: `local-${Date.now()}`,
      lat: data.lat,
      lng: data.lng,
      content: data.content,
      privacy_mode: 'private',
      circle_id: null,
      created_at: new Date().toISOString(),
      memory_date: data.memory_date,
      likes_count: 0,
      hugs_count: 0,
      music_provider: data.music_track_id ? 'deezer' : null,
      music_track_id: data.music_track_id,
      tagged_people: data.tagged_people || null,
      media: []
    };

    if (data.images && data.images.length > 0) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPrivateMemory.media = [{ id: 'temp', url: reader.result as string, type: 'image', display_order: 0 }];
          resolve(newPrivateMemory);
        };
        reader.readAsDataURL(data.images[0]);
      });
    }

    return newPrivateMemory;
  }

  /**
   * Submits a public/circle memory to the server or queues it offline if network is unavailable.
   */
  static async submitMemory(data: MemoryCreationData, isOnline: boolean): Promise<{ savedPin: Memory, isOfflineQueued: boolean }> {
    if (!isOnline) {
      return { savedPin: this.createOfflineMemoryData(data), isOfflineQueued: true };
    }

    try {
      const savedPin = await api.createMemory(data);
      return { savedPin, isOfflineQueued: false };
    } catch (err) {
      console.warn("MemoryCreationService: API submission failed, queuing offline:", err);
      return { savedPin: this.createOfflineMemoryData(data), isOfflineQueued: true };
    }
  }
}
