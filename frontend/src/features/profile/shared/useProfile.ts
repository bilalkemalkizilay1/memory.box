import { useState, useEffect } from 'react';
import * as api from '@/shared/api/api';

export function useProfile() {
  const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(() => {
    const val = localStorage.getItem('mb_profile');
    return val ? JSON.parse(val) : null;
  });

  useEffect(() => {
    localStorage.setItem('mb_profile', JSON.stringify(userProfile));
    if (userProfile) {
      api.syncProfile(userProfile.name, userProfile.email)
        .catch(err => console.error("Failed to sync profile with server:", err));
    }
  }, [userProfile]);

  // Warm up backend cold start on mount
  useEffect(() => {
    fetch('/api/profile/sync', {
      headers: {
        'X-Author-Token': localStorage.getItem('mb_author_token') || 'warmup-token'
      }
    }).then(() => {
      console.log('Backend server warmed up successfully.');
    }).catch(err => {
      console.warn('Backend warm up failed:', err);
    });
  }, []);

  return {
    userProfile,
    setUserProfile
  };
}
