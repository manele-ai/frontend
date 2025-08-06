import { collection, doc, getDoc, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../services/firebase';

export function useLeaderboardData() {
  const [data, setData] = useState({
    allTime: {
      songs: [],
      dedications: [],
      donations: []
    },
    today: {
      songs: [],
      dedications: [],
      donations: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchLeaderboardData() {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Starting leaderboard data fetch...');
        
        // Get current date for today's stats
        const now = new Date();
        const todayKey = now.toISOString().split('T')[0].replace(/-/g, '');

        // Define the stat types and their field/collection names
        const statTypes = {
          songs: {
            allTimeField: 'numSongsGenerated',
            dailyCollection: 'numSongsGenerated'
          },
          dedications: {
            allTimeField: 'numDedicationsGiven',
            dailyCollection: 'numDedicationsGiven'
          },
          donations: {
            allTimeField: 'sumDonationsTotal',
            dailyCollection: 'donationValue'
          }
        };

        // Helper function to fetch daily stats
        const fetchDailyStats = async (periodKey, bucketName) => {
          const statsRef = collection(db, 'stats', 'day', periodKey, 'buckets', bucketName);
          const q = query(statsRef, orderBy('count', 'desc'), limit(10));
          console.log('Fetching daily stats for:', periodKey, bucketName);
          const snapshot = await getDocs(q);
          
          // Get user details for each stat entry
          const statsWithUserDetails = await Promise.all(
            snapshot.docs.map(async (statDoc) => {
              const userId = statDoc.id;
              const userRef = doc(db, 'usersPublic', userId);
              const userDoc = await getDoc(userRef);
              const userData = userDoc.data() || {};
              
              return {
                id: userId,
                displayName: userData.displayName || 'Anonymous User',
                photoURL: userData.photoURL || null,
                count: statDoc.data().count || 0
              };
            })
          );

          return statsWithUserDetails.filter(user => user.count > 0); // Filtrează doar utilizatorii cu count > 0
        };

        // Helper function to fetch all-time stats from usersPublic
        const fetchAllTimeStats = async (fieldName) => {
          const usersRef = collection(db, 'usersPublic');
          const q = query(
            usersRef, 
            orderBy(`stats.${fieldName}`, 'desc'), 
            limit(10)
          );
          console.log('Fetching all-time stats for:', fieldName);
          const snapshot = await getDocs(q);
          
          return snapshot.docs
            .map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                displayName: data.displayName || 'Anonymous User',
                photoURL: data.photoURL || null,
                count: data.stats?.[fieldName] || 0
              };
            })
            .filter(user => user.count > 0); // Filtrează doar utilizatorii cu count > 0
        };

        // Initialize results with empty arrays
        const results = {
          allTime: {
            songs: [],
            dedications: [],
            donations: []
          },
          today: {
            songs: [],
            dedications: [],
            donations: []
          }
        };

        // Fetch stats for each type
        for (const [key, { allTimeField, dailyCollection }] of Object.entries(statTypes)) {
          // Fetch all-time stats from usersPublic
          results.allTime[key] = await fetchAllTimeStats(allTimeField);
          
          // Fetch today's stats from stats collection
          results.today[key] = await fetchDailyStats(todayKey, dailyCollection);
        }

        setData(results);
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