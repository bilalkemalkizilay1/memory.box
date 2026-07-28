export interface Media {
  id: string;
  url: string;
  type: string;
  display_order: number;
}

export interface Memory {
  id: string;
  lat: number;
  lng: number;
  content: string;
  media: Media[];
  privacy_mode: 'public' | 'circle' | 'private';
  circle_id: string | null;
  created_at: string;
  memory_date: string;
  likes_count: number;
  hugs_count: number;
  music_provider: string | null;
  music_track_id: string | null;
  tagged_people: string | null;
  author_name?: string;
}
export interface Circle {
  id: string;
  name: string;
  created_at: string;
}
