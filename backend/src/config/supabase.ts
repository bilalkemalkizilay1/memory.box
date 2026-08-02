import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

let supabaseClient: any = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("WARNING: SUPABASE_URL or SUPABASE_ANON_KEY is missing from environment variables!");
  // Provide a dummy client to prevent crashing
  supabaseClient = {
    storage: {
      from: () => ({
        upload: async () => ({ error: new Error('Supabase not configured') }),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    }
  };
} else {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseClient;
