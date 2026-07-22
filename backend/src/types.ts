export interface Pin {
  id: string;
  lat: number;
  lng: number;
  content: string;
  image_url: string | null;
  privacy_mode: 'public' | 'circle' | 'private';
  circle_id: string | null;
  created_at: string;
  memory_date: string;
  likes_count: number;
  hugs_count: number;
  spotify_track_id: string | null;
  people: string | null;
}

export interface Circle {
  id: string;
  name: string;
  created_at: string;
}
