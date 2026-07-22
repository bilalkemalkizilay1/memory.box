import { Pin, Circle } from '../types';

const API_BASE = '/api';

export async function fetchPins(circleIds: string[]): Promise<Pin[]> {
  const params = new URLSearchParams();
  if (circleIds.length > 0) {
    params.append('circle_ids', circleIds.join(','));
  }
  const res = await fetch(`${API_BASE}/pins?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch pins');
  return res.json();
}

export async function createPin(formData: FormData): Promise<Pin> {
  const res = await fetch(`${API_BASE}/pins`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to create pin');
  return res.json();
}

export async function likePin(id: string): Promise<{ likes_count: number }> {
  const res = await fetch(`${API_BASE}/pins/${id}/like`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to like pin');
  return res.json();
}

export async function hugPin(id: string): Promise<{ hugs_count: number }> {
  const res = await fetch(`${API_BASE}/pins/${id}/hug`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to hug pin');
  return res.json();
}

export async function fetchCircle(id: string): Promise<Circle> {
  const res = await fetch(`${API_BASE}/circles/${id}`);
  if (!res.ok) throw new Error('Circle not found');
  return res.json();
}

export async function createCircle(name: string): Promise<Circle> {
  const res = await fetch(`${API_BASE}/circles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error('Failed to create circle');
  return res.json();
}

export async function updatePin(id: string, data: {
  content: string;
  privacy_mode: 'public' | 'circle' | 'private';
  circle_id: string | null;
  memory_date: string;
  spotify_track_id: string | null;
}): Promise<Pin> {
  const res = await fetch(`${API_BASE}/pins/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update pin');
  return res.json();
}

export async function fetchSongDetails(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/songs/${id}`);
  if (!res.ok) throw new Error('Failed to fetch song details');
  return res.json();
}
