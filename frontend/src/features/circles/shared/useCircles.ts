import { useState, useEffect } from 'react';
import { Circle } from '@/shared/types/types';

const DEFAULT_CIRCLES: Circle[] = [
  { id: 'bogazici-cimler', name: 'Boğaziçi Çimleri 🍀', created_at: new Date().toISOString() },
  { id: 'bebek-sahili', name: 'Bebek Sahil Yolu 🌊', created_at: new Date().toISOString() },
  { id: 'hisarustu-kahve', name: 'Hisarüstü Kahve Sohbetleri ☕', created_at: new Date().toISOString() }
];

export function useCircles() {
  const [joinedCircles, setJoinedCircles] = useState<Circle[]>(() => {
    const val = localStorage.getItem('mb_circles');
    return val ? JSON.parse(val) : DEFAULT_CIRCLES;
  });

  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('mb_circles', JSON.stringify(joinedCircles));
  }, [joinedCircles]);

  return {
    joinedCircles,
    setJoinedCircles,
    selectedCircleId,
    setSelectedCircleId
  };
}
