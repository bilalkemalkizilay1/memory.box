import { Memory, Circle } from '@/shared/types/types';
import { ImageUtils } from '@/shared/utils/ImageUtils';

const API_BASE = '/api';

export function getAuthorToken(): string {
  let token = localStorage.getItem('mb_author_token');
  if (!token) {
    token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('mb_author_token', token);
  }
  return token;
}

function formatMemoryResponse(m: any): Memory {
  return {
    id: m.id,
    lat: Number(m.lat),
    lng: Number(m.lng),
    content: m.content,
    privacy_mode: m.privacy_mode as 'public' | 'circle' | 'private',
    circle_id: m.circle_id || null,
    memory_date: m.memory_date,
    likes_count: Number(m.likes_count || 0),
    hugs_count: Number(m.hugs_count || 0),
    music_provider: m.music_provider || null,
    music_track_id: m.music_track_id || null,
    media: m.media || [],
    tagged_people: m.tagged_people 
      ? (typeof m.tagged_people === 'string' ? m.tagged_people : JSON.stringify(m.tagged_people))
      : null,
    created_at: m.created_at || new Date().toISOString(),
    author_name: m.author_name
  };
}

export async function fetchMemories(circleIds: string[]): Promise<Memory[]> {
  const params = new URLSearchParams();
  if (circleIds.length > 0) {
    params.append('circle_ids', circleIds.join(','));
  }
  const res = await fetch(`${API_BASE}/memories?${params.toString()}`, {
    headers: { 'X-Author-Token': getAuthorToken() }
  });
  if (!res.ok) throw new Error('Failed to fetch memories');
  const memories = await res.json();
  return memories.map(formatMemoryResponse);
}

export async function createMemory(data: {
  lat: number;
  lng: number;
  content: string;
  privacy_mode: 'public' | 'circle' | 'private';
  circle_id: string | null;
  memory_date: string;
  music_track_id: string | null;
  tagged_people: string | null;
  images: File[];
}): Promise<Memory> {
  const mediaUrls: { url: string, type: string }[] = [];

  for (const image of data.images) {
    const compressedImage = await ImageUtils.compressImage(image);
    const uploadFormData = new FormData();
    uploadFormData.append('file', compressedImage);

    const uploadRes = await fetch(`${API_BASE}/media/upload`, {
      method: 'POST',
      headers: { 'X-Author-Token': getAuthorToken() },
      body: uploadFormData
    });

    if (!uploadRes.ok) throw new Error('Failed to upload memory image');
    const uploadData = await uploadRes.json();
    mediaUrls.push({ url: uploadData.url, type: 'image' });
  }

  const res = await fetch(`${API_BASE}/memories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Author-Token': getAuthorToken()
    },
    body: JSON.stringify({
      lat: data.lat,
      lng: data.lng,
      content: data.content,
      privacy_mode: data.privacy_mode,
      circle_id: data.circle_id,
      memory_date: data.memory_date,
      music_provider: data.music_track_id ? 'deezer' : null,
      music_track_id: data.music_track_id,
      tagged_people: data.tagged_people ? JSON.parse(data.tagged_people) : [],
      media: mediaUrls
    })
  });

  if (!res.ok) throw new Error('Failed to create memory');
  const memory = await res.json();
  return formatMemoryResponse(memory);
}

export async function updateMemory(id: string, data: {
  content: string;
  privacy_mode: 'public' | 'circle' | 'private';
  circle_id: string | null;
  memory_date: string;
  music_track_id: string | null;
  tagged_people?: string | null;
  images?: File[];
}): Promise<Memory> {
  const mediaUrls: { url: string, type: string }[] = [];

  if (data.images && data.images.length > 0) {
    for (const image of data.images) {
      const uploadFormData = new FormData();
      uploadFormData.append('file', image);

      const uploadRes = await fetch(`${API_BASE}/media/upload`, {
        method: 'POST',
        headers: { 'X-Author-Token': getAuthorToken() },
        body: uploadFormData
      });

      if (!uploadRes.ok) throw new Error('Failed to upload memory image');
      const uploadData = await uploadRes.json();
      mediaUrls.push({ url: uploadData.url, type: 'image' });
    }
  }

  const res = await fetch(`${API_BASE}/memories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Author-Token': getAuthorToken()
    },
    body: JSON.stringify({
      content: data.content,
      privacy_mode: data.privacy_mode,
      circle_id: data.circle_id,
      memory_date: data.memory_date,
      music_provider: data.music_track_id ? 'deezer' : null,
      music_track_id: data.music_track_id,
      tagged_people: data.tagged_people ? JSON.parse(data.tagged_people) : [],
      ...(data.images && data.images.length > 0 && { media: mediaUrls })
    })
  });

  if (!res.ok) throw new Error('Failed to update memory');
  const memory = await res.json();
  return formatMemoryResponse(memory);
}

export async function deleteMemory(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/memories/${id}`, {
    method: 'DELETE',
    headers: { 'X-Author-Token': getAuthorToken() }
  });
  if (!res.ok) throw new Error('Failed to delete memory');
  return res.json();
}

export async function likeMemory(id: string): Promise<{ likes_count: number }> {
  const res = await fetch(`${API_BASE}/memories/${id}/reactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Author-Token': getAuthorToken()
    },
    body: JSON.stringify({ type: 'like' })
  });
  if (!res.ok) throw new Error('Failed to like memory');
  const data = await res.json();
  return { likes_count: data.reactionCounts.likes };
}

export async function hugMemory(id: string): Promise<{ hugs_count: number }> {
  const res = await fetch(`${API_BASE}/memories/${id}/reactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Author-Token': getAuthorToken()
    },
    body: JSON.stringify({ type: 'hug' })
  });
  if (!res.ok) throw new Error('Failed to hug memory');
  const data = await res.json();
  return { hugs_count: data.reactionCounts.hugs };
}

export async function fetchCircle(id: string): Promise<Circle> {
  const res = await fetch(`${API_BASE}/circles/${id}`, {
    headers: { 'X-Author-Token': getAuthorToken() }
  });
  if (!res.ok) throw new Error('Circle not found');
  return res.json();
}

export async function createCircle(name: string): Promise<Circle> {
  const res = await fetch(`${API_BASE}/circles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Author-Token': getAuthorToken()
    },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error('Failed to create circle');
  return res.json();
}

export async function syncProfile(name: string, email: string | null): Promise<any> {
  const res = await fetch(`${API_BASE}/profile/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Author-Token': getAuthorToken()
    },
    body: JSON.stringify({ name, email })
  });
  if (!res.ok) throw new Error('Failed to sync profile');
  return res.json();
}

export async function fetchSongDetails(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/songs/${id}`);
  if (!res.ok) throw new Error('Failed to fetch song details');
  return res.json();
}
