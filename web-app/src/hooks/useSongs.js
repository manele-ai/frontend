import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuth } from '../components/auth/AuthContext';
import { db } from '../services/firebase';
import { syncGenerationStatusForUser } from '../services/firebase/functions';

// Type for song data from Firestore
const mapSongData = (doc) => ({
  id: doc.id,
  createdAt: doc.data().createdAt,
  ...doc.data()
});

export function useSongs() {
  const { user } = useAuth();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [oldestCreatedAt, setOldestCreatedAt] = useState(null);

  const SONGS_PER_PAGE = 20;

  useEffect(() => {
    async function fetchSongs() {
      if (!user) {
        setSongs([]);
        setLoading(false);
        return;
      }

      try {
        // Run sync in background
        // TODO: do we need to disable if user currently has a song in progress? Probably not
        syncGenerationStatusForUser().catch(console.error);

        const songsRef = collection(db, 'songsPublic');
        const q = query(
          songsRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(SONGS_PER_PAGE)
        );
        const querySnapshot = await getDocs(q);
        
        const fetchedSongs = querySnapshot.docs.map(mapSongData);

        setSongs(fetchedSongs);
        // Store the oldest createdAt from the fetched songs
        if (fetchedSongs.length > 0) {
          const oldest = fetchedSongs[fetchedSongs.length - 1].createdAt;
          setOldestCreatedAt(oldest);
        }
        setHasMore(querySnapshot.docs.length === SONGS_PER_PAGE);
        setError(null);
      } catch (err) {
        console.error('Error fetching songs:', err);
        setError('Failed to load songs. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    setLoading(true);
    setSongs([]);
    setOldestCreatedAt(null);
    setHasMore(true);
    fetchSongs();
  }, [user]);

  const loadMoreSongs = async () => {
    if (!user || !hasMore || loadingMore || !oldestCreatedAt) return;

    setLoadingMore(true);
    try {
      const songsRef = collection(db, 'songsPublic');
      const q = query(
        songsRef,
        where('userId', '==', user.uid),
        where('createdAt', '<=', oldestCreatedAt),
        orderBy('createdAt', 'desc'),
        limit(SONGS_PER_PAGE)
      );
      const querySnapshot = await getDocs(q);
      
      const newSongs = querySnapshot.docs.map(mapSongData);

      // Filter out any potential duplicates
      const existingSongIds = new Set(songs.map(song => song.id));
      const uniqueNewSongs = newSongs.filter(song => !existingSongIds.has(song.id));

      // Update hasMore based on the raw query results, not filtered results
      setHasMore(newSongs.length === SONGS_PER_PAGE);

      if (uniqueNewSongs.length > 0) {
        setSongs(prev => [...prev, ...uniqueNewSongs]);
        const oldest = uniqueNewSongs[uniqueNewSongs.length - 1].createdAt;
        setOldestCreatedAt(oldest);
      }
    } catch (err) {
      console.error('Error loading more songs:', err);
      setError('Failed to load more songs. Please try again later.');
    } finally {
      setLoadingMore(false);
    }
  };

  return { 
    songs, 
    loading, 
    loadingMore,
    error, 
    hasMore, 
    loadMoreSongs 
  };
} 