import { Pin, Circle } from '../types';

const API_BASE = '/api';

// Generate or retrieve device-specific author signature
export function getAuthorToken(): string {
  let token = localStorage.getItem('mb_author_token');
  if (!token) {
    token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('mb_author_token', token);
  }
  return token;
}

// Map PostgreSQL backend memory format to the Pin format expected by frontend UI
function mapMemoryToPin(m: any): Pin {
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
    spotify_track_id: m.music_track_id || null,
    image_url: m.media && m.media[0] ? m.media[0].url : null,
    people: m.tagged_people 
      ? (typeof m.tagged_people === 'string' ? m.tagged_people : JSON.stringify(m.tagged_people))
      : '[]',
    created_at: m.created_at || new Date().toISOString()
  };
}

export async function fetchPins(circleIds: string[]): Promise<Pin[]> {
  const params = new URLSearchParams();
  if (circleIds.length > 0) {
    params.append('circle_ids', circleIds.join(','));
  }
  const res = await fetch(`${API_BASE}/pins?${params.toString()}`, {
    headers: {
      'X-Author-Token': getAuthorToken()
    }
  });
  if (!res.ok) throw new Error('Failed to fetch pins');
  const memories = await res.json();
  return memories.map(mapMemoryToPin);
}

export async function createPin(data: {
  lat: number;
  lng: number;
  content: string;
  privacy_mode: 'public' | 'circle' | 'private';
  circle_id: string | null;
  memory_date: string;
  spotify_track_id: string | null;
  people: string | null;
  image: File | null;
}): Promise<Pin> {
  let imageUrl: string | null = null;

  // 1. Upload image to the media upload endpoint if present
  if (data.image) {
    const uploadFormData = new FormData();
    uploadFormData.append('file', data.image);

    const uploadRes = await fetch(`${API_BASE}/media/upload`, {
      method: 'POST',
      headers: {
        'X-Author-Token': getAuthorToken()
      },
      body: uploadFormData
    });

    if (!uploadRes.ok) throw new Error('Failed to upload memory image');
    const uploadData = await uploadRes.json();
    imageUrl = uploadData.url;
  }

  // 2. Submit memory JSON data
  const res = await fetch(`${API_BASE}/pins`, {
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
      music_provider: data.spotify_track_id ? 'deezer' : null,
      music_track_id: data.spotify_track_id,
      tagged_people: data.people ? JSON.parse(data.people) : [],
      image_url: imageUrl
    })
  });

  if (!res.ok) throw new Error('Failed to create memory');
  const memory = await res.json();
  return mapMemoryToPin(memory);
}

export async function updatePin(id: string, data: {
  content: string;
  privacy_mode: 'public' | 'circle' | 'private';
  circle_id: string | null;
  memory_date: string;
  spotify_track_id: string | null;
  people?: string | null;
}): Promise<Pin> {
  const res = await fetch(`${API_BASE}/pins/${id}`, {
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
      music_provider: data.spotify_track_id ? 'deezer' : null,
      music_track_id: data.spotify_track_id,
      tagged_people: data.people ? JSON.parse(data.people) : []
    })
  });

  if (!res.ok) throw new Error('Failed to update pin');
  const memory = await res.json();
  return mapMemoryToPin(memory);
}

export async function deletePin(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/pins/${id}`, {
    method: 'DELETE',
    headers: {
      'X-Author-Token': getAuthorToken()
    }
  });
  if (!res.ok) throw new Error('Failed to delete pin');
  return res.json();
}

export async function likePin(id: string): Promise<{ likes_count: number }> {
  const res = await fetch(`${API_BASE}/pins/${id}/reactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Author-Token': getAuthorToken()
    },
    body: JSON.stringify({ type: 'like' })
  });
  if (!res.ok) throw new Error('Failed to like pin');
  const data = await res.json();
  return { likes_count: data.reactionCounts.likes };
}

export async function hugPin(id: string): Promise<{ hugs_count: number }> {
  const res = await fetch(`${API_BASE}/pins/${id}/reactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Author-Token': getAuthorToken()
    },
    body: JSON.stringify({ type: 'hug' })
  });
  if (!res.ok) throw new Error('Failed to hug pin');
  const data = await res.json();
  return { hugs_count: data.reactionCounts.hugs };
}

export async function fetchCircle(id: string): Promise<Circle> {
  const res = await fetch(`${API_BASE}/circles/${id}`, {
    headers: {
      'X-Author-Token': getAuthorToken()
    }
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
