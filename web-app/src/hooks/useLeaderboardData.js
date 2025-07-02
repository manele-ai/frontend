import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../services/firebase';

export function useLeaderboardData() {
  const [data, setData] = useState({
    songs: [],
    dedications: [],
    donations: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchLeaderboardData() {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Starting leaderboard data fetch...');
        const usersRef = collection(db, 'publicUsers');
        
        // Fetch top 10 for each category
        const songsQuery = query(usersRef, orderBy('numSongsGenerated', 'desc'), limit(10));
        const dedicationsQuery = query(usersRef, orderBy('numDedicationsGiven', 'desc'), limit(10));
        const donationsQuery = query(usersRef, orderBy('sumDonationsTotal', 'desc'), limit(10));

        console.log('Queries created, fetching data...');
        
        try {
          const songsSnapshot = await getDocs(songsQuery);
          console.log('Songs data:', songsSnapshot.docs.length, 'results');
          const dedicationsSnapshot = await getDocs(dedicationsQuery);
          console.log('Dedications data:', dedicationsSnapshot.docs.length, 'results');
          const donationsSnapshot = await getDocs(donationsQuery);
          console.log('Donations data:', donationsSnapshot.docs.length, 'results');

          const mapUserData = (doc) => {
            const data = doc.data();
            console.log('Processing user data:', {
              id: doc.id,
              numSongsGenerated: data.numSongsGenerated,
              numDedicationsGiven: data.numDedicationsGiven,
              sumDonationsTotal: data.sumDonationsTotal
            });
            return {
              id: doc.id,
              ...data,
              displayName: data.displayName || 'Anonymous User',
              photoURL: data.photoURL || null
            };
          };

          setData({
            songs: songsSnapshot.docs.map(mapUserData),
            dedications: dedicationsSnapshot.docs.map(mapUserData),
            donations: donationsSnapshot.docs.map(mapUserData)
          });
        } catch (queryError) {
          console.error('Error during individual query:', queryError);
          throw queryError;
        }
      } catch (err) {
        console.error('Error fetching leaderboard data:', {
          error: err,
          message: err.message,
          code: err.code,
          stack: err.stack
        });
        setError(`Failed to load leaderboard data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboardData();
  }, []);

  return { data, loading, error };
} 