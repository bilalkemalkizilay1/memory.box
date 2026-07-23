export const musicService = {
  searchSongs: async (query: string): Promise<any[]> => {
    if (!query) return [];
    
    const response = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Deezer API search request failed');
    
    const data = await response.json();
    return (data.data || []).slice(0, 10).map((track: any) => ({
      id: track.id.toString(),
      title: track.title,
      artist: track.artist.name,
      album: track.album.title,
      cover: track.album.cover_medium,
      preview: track.preview
    }));
  },

  getSongDetails: async (id: string): Promise<any> => {
    const response = await fetch(`https://api.deezer.com/track/${id}`);
    if (!response.ok) throw new Error('Deezer API track request failed');
    
    const track = await response.json();
    if (track.error) {
      const error: any = new Error('Track not found on Deezer');
      error.status = 404;
      throw error;
    }
    
    return {
      id: track.id.toString(),
      title: track.title,
      artist: track.artist.name,
      album: track.album.title,
      cover: track.album.cover_medium,
      preview: track.preview
    };
  }
};
