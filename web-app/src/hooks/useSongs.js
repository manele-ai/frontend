import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuth } from '../components/auth/AuthContext';
import { db } from '../services/firebase';

export function useSongs() {
  const { user } = useAuth();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSongs() {
      if (!user) {
        setSongs([]);
        setLoading(false);
        return;
      }

      try {
        const songsRef = collection(db, 'songs');
        const q = query(songsRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        const fetchedSongs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setSongs(fetchedSongs);
        setError(null);
      } catch (err) {
        console.error('Error fetching songs:', err);
        setError('Failed to load songs. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    setLoading(true);
    fetchSongs();
  }, [user]);

  return { songs, loading, error };
} 