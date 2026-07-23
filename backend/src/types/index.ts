export interface User {
  id: string;
  name: string;
  email: string | null;
  author_token: string;
  created_at: string;
  updated_at: string;
}

export interface Circle {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CircleMembership {
  circle_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  updated_at: string;
}

export interface Memory {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
  content: string;
  privacy_mode: 'public' | 'circle' | 'private';
  circle_id: string | null;
  memory_date: string;
  music_provider: string | null;
  music_track_id: string | null;
  tagged_people: string; // JSON string on database, parsed as string[] in app
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Media {
  id: string;
  memory_id: string;
  url: string;
  type: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface MemoryReaction {
  id: string;
  memory_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}
