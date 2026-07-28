import { useState, useEffect, useMemo, useCallback } from 'react';
import { Memory, Circle } from '@/shared/types/types';
import toast from 'react-hot-toast';
import * as api from '@/shared/api/api';

import { MemoryCreationService, MemoryCreationData } from '@services/MemoryCreationService';

export function useMemories(joinedCircles: Circle[], selectedCircleId: string | null) {
  const [privatePins, setPrivatePins] = useState<Memory[]>(() => {
    const val = localStorage.getItem('mb_private_pins');
    return val ? JSON.parse(val) : [];
  });

  const [likesAndHugs, setLikesAndHugs] = useState<Record<string, { liked: boolean; hugged: boolean }>>(() => {
    const val = localStorage.getItem('mb_likes_hugs');
    return val ? JSON.parse(val) : {};
  });

  const [myCreatedPinIds, setMyCreatedPinIds] = useState<string[]>(() => {
    const val = localStorage.getItem('mb_my_created_pin_ids');
    return val ? JSON.parse(val) : [];
  });

  const [serverPins, setServerPins] = useState<Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagged_peopleFilter, setPeopleFilter] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('mb_private_pins', JSON.stringify(privatePins));
  }, [privatePins]);

  useEffect(() => {
    localStorage.setItem('mb_likes_hugs', JSON.stringify(likesAndHugs));
  }, [likesAndHugs]);

  useEffect(() => {
    localStorage.setItem('mb_my_created_pin_ids', JSON.stringify(myCreatedPinIds));
  }, [myCreatedPinIds]);

  const loadServerPins = useCallback(async () => {
    try {
      const circleIds = joinedCircles.map(c => c.id);
      const memories = await api.fetchMemories(circleIds);
      setServerPins(memories);

      const savedCreatedIds = localStorage.getItem('mb_my_created_pin_ids');
      const parsedIds = savedCreatedIds ? JSON.parse(savedCreatedIds) : [];
      if (parsedIds.length === 0 && memories.length > 0) {
        const allIds = memories.map(p => p.id);
        setMyCreatedPinIds(allIds);
        localStorage.setItem('mb_my_created_pin_ids', JSON.stringify(allIds));
      }
    } catch (err) {
      console.error('Error fetching server memories:', err);
    }
  }, [joinedCircles]);

  useEffect(() => {
    loadServerPins();
  }, [joinedCircles, loadServerPins]);

  useEffect(() => {
    const handleOnlineSync = async () => {
      const queue = localStorage.getItem('mb_pending_sync_queue');
      if (!queue) return;
      const pendingPins = JSON.parse(queue);
      if (pendingPins.length === 0) return;

      console.log(`Syncing ${pendingPins.length} offline memories...`);
      const remaining: any[] = [];

      for (const memory of pendingPins) {
        try {
          await api.createMemory({
            lat: memory.lat,
            lng: memory.lng,
            content: memory.content,
            privacy_mode: memory.privacy_mode,
            circle_id: memory.circle_id,
            memory_date: memory.memory_date,
            music_track_id: memory.music_track_id,
            tagged_people: memory.tagged_people,
            images: []
          });
        } catch (err) {
          console.error("Failed to sync offline memory, keeping in queue:", err);
          remaining.push(memory);
        }
      }

      localStorage.setItem('mb_pending_sync_queue', JSON.stringify(remaining));
      loadServerPins();
      
      if (remaining.length === 0) {
        toast.success("✅ Çevrimdışı kaydedilen tüm anılarınız başarıyla sunucuya yüklendi!");
      }
    };

    window.addEventListener('online', handleOnlineSync);
    if (navigator.onLine) {
      handleOnlineSync();
    }
    return () => window.removeEventListener('online', handleOnlineSync);
  }, [loadServerPins]);

  const handlePinSubmit = async (data: MemoryCreationData): Promise<Memory> => {
    if (data.privacy_mode === 'private') {
      const newPrivateMemory = await MemoryCreationService.processPrivateMemory(data);
      setPrivatePins(prev => [newPrivateMemory, ...prev]);
      return newPrivateMemory;
    } else {
      const { savedPin, isOfflineQueued } = await MemoryCreationService.submitMemory(data, navigator.onLine);
      
      setServerPins(prev => [savedPin, ...prev]);
      setMyCreatedPinIds(prev => [...prev, savedPin.id]);
      
      if (isOfflineQueued) {
        const currentQueue = localStorage.getItem('mb_pending_sync_queue');
        const queueList = currentQueue ? JSON.parse(currentQueue) : [];
        queueList.push({ ...data, images: [] });
        localStorage.setItem('mb_pending_sync_queue', JSON.stringify(queueList));
        toast("📶 İnternet bağlantısı yok. Anınız yerel olarak kaydedildi ve bağlandığınızda yüklenecektir.", { icon: '🔄' });
      }
      
      return savedPin;
    }
  };

  const handlePinUpdate = async (id: string, updatedData: {
    content: string;
    privacy_mode: 'public' | 'circle' | 'private';
    circle_id: string | null;
    memory_date: string;
    music_track_id: string | null;
    tagged_people: string | null;
    image: File | null;
  }) => {
    const isPrivateBefore = privatePins.some(p => p.id === id);
    
    if (updatedData.privacy_mode === 'private') {
      if (isPrivateBefore) {
        const updateLocalPin = (base64Image?: string) => {
          const updated = privatePins.map(p => {
            if (p.id === id) {
              return {
                ...p,
                content: updatedData.content,
                memory_date: updatedData.memory_date,
                music_track_id: updatedData.music_track_id,
                tagged_people: updatedData.tagged_people || null,
                ...(base64Image !== undefined && { media: [{ id: 'temp', url: base64Image, type: 'image', display_order: 0 }] })
              };
            }
            return p;
          });
          setPrivatePins(updated);
        };

        if (updatedData.image) {
          const reader = new FileReader();
          reader.onloadend = () => {
            updateLocalPin(reader.result as string);
          };
          reader.readAsDataURL(updatedData.image);
        } else {
          updateLocalPin();
        }
      } else {
        const updatedPin = await api.updateMemory(id, updatedData);
        setServerPins(prev => prev.filter(p => p.id !== id));
        const newPrivatePin: Memory = { ...updatedPin, privacy_mode: 'private', circle_id: null };
        setPrivatePins(prev => [newPrivatePin, ...prev]);
      }
    } else {
      if (isPrivateBefore) {
        const privatePin = privatePins.find(p => p.id === id);
        if (privatePin) {
          let finalImage: File | null = updatedData.image;
          if (!finalImage && privatePin.media?.[0]?.url && privatePin.media?.[0]?.url.startsWith('data:')) {
            try {
              finalImage = MemoryCreationService.dataURLtoFile(privatePin.media?.[0]?.url, 'published-photo.jpg');
            } catch (e) {
              console.error("Error converting base64 image during publish:", e);
            }
          }

          const savedPin = await api.createMemory({
            lat: privatePin.lat,
            lng: privatePin.lng,
            content: updatedData.content,
            privacy_mode: updatedData.privacy_mode,
            circle_id: updatedData.circle_id,
            memory_date: updatedData.memory_date,
            music_track_id: updatedData.music_track_id,
            tagged_people: updatedData.tagged_people,
            images: finalImage ? [finalImage] : []
          });
          setServerPins(prev => [savedPin, ...prev]);
          setPrivatePins(prev => prev.filter(p => p.id !== id));
          setMyCreatedPinIds(prev => [...prev, savedPin.id]);
        }
      } else {
        const updatedPin = await api.updateMemory(id, updatedData);
        setServerPins(prev => prev.map(p => p.id === id ? updatedPin : p));
      }
    }
  };

  const handleLike = async (id: string) => {
    const interaction = likesAndHugs[id] || { liked: false, hugged: false };
    if (interaction.liked) return;

    setLikesAndHugs(prev => ({ ...prev, [id]: { ...interaction, liked: true } }));
    if (id.startsWith('local-')) {
      setPrivatePins(prev => prev.map(p => p.id === id ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));
      return;
    }

    setServerPins(prev => prev.map(p => p.id === id ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));

    try {
      const res = await api.likeMemory(id);
      setServerPins(prev => prev.map(p => p.id === id ? { ...p, likes_count: res.likes_count } : p));
    } catch (err) {
      console.warn("Optimistic Like failed, rolling back:", err);
      setLikesAndHugs(prev => ({ ...prev, [id]: { ...interaction, liked: false } }));
      setServerPins(prev => prev.map(p => p.id === id ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) - 1) } : p));
    }
  };

  const handleHug = async (id: string) => {
    const interaction = likesAndHugs[id] || { liked: false, hugged: false };
    if (interaction.hugged) return;

    setLikesAndHugs(prev => ({ ...prev, [id]: { ...interaction, hugged: true } }));
    if (id.startsWith('local-')) {
      setPrivatePins(prev => prev.map(p => p.id === id ? { ...p, hugs_count: (p.hugs_count || 0) + 1 } : p));
      return;
    }

    setServerPins(prev => prev.map(p => p.id === id ? { ...p, hugs_count: (p.hugs_count || 0) + 1 } : p));

    try {
      const res = await api.hugMemory(id);
      setServerPins(prev => prev.map(p => p.id === id ? { ...p, hugs_count: res.hugs_count } : p));
    } catch (err) {
      console.warn("Optimistic Hug failed, rolling back:", err);
      setLikesAndHugs(prev => ({ ...prev, [id]: { ...interaction, hugged: false } }));
      setServerPins(prev => prev.map(p => p.id === id ? { ...p, hugs_count: Math.max(0, (p.hugs_count || 0) - 1) } : p));
    }
  };

  const allUniquePeople = useMemo(() => {
    const tagged_peopleSet = new Set<string>();
    [...serverPins, ...privatePins].forEach(p => {
      if (p.tagged_people) {
        try {
          const parsed: string[] = JSON.parse(p.tagged_people);
          parsed.forEach(person => tagged_peopleSet.add(person));
        } catch (err) {
          console.error("Error parsing tagged_people:", err);
        }
      }
    });
    return Array.from(tagged_peopleSet);
  }, [serverPins, privatePins]);

  const visiblePins = useMemo(() => {
    let all = [...serverPins, ...privatePins];

    if (selectedCircleId) {
      all = all.filter(p => p.privacy_mode === 'circle' && p.circle_id === selectedCircleId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      all = all.filter(p => p.content.toLowerCase().includes(q));
    }

    if (tagged_peopleFilter) {
      all = all.filter(p => {
        if (!p.tagged_people) return false;
        try {
          const parsed: string[] = JSON.parse(p.tagged_people);
          return parsed.includes(tagged_peopleFilter);
        } catch {
          return false;
        }
      });
    }

    return all;
  }, [serverPins, privatePins, selectedCircleId, searchQuery, tagged_peopleFilter]);

  return {
    privatePins,
    serverPins,
    myCreatedPinIds,
    likesAndHugs,
    searchQuery,
    setSearchQuery,
    tagged_peopleFilter,
    setPeopleFilter,
    allUniquePeople,
    visiblePins,
    handlePinSubmit,
    handlePinUpdate,
    handleLike,
    handleHug
  };
}
