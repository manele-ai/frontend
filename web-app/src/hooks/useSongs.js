import { collection, getDocs, limit, orderBy, query, startAfter, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuth } from '../components/auth/AuthContext';
import { db } from '../services/firebase';
import { syncGenerationStatusForUser } from '../services/firebase/functions';

export function useSongs() {
  const { user } = useAuth();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);

  const SONGS_PER_PAGE = 5;

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
        
        const fetchedSongs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setSongs(fetchedSongs);
        setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
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
    setLastDoc(null);
    setHasMore(true);
    fetchSongs();
  }, [user]);

  const loadMoreSongs = async () => {
    if (!user || !hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const songsRef = collection(db, 'songsPublic');
      const q = query(
        songsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(SONGS_PER_PAGE)
      );
      const querySnapshot = await getDocs(q);
      
      const newSongs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setSongs(prev => [...prev, ...newSongs]);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === SONGS_PER_PAGE);
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