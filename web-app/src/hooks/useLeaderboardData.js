import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
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
            allTimeField: 'sumDonationsTotal', // Changed back to match backend
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
              const count = statDoc.data().count || 0;
              
              console.log(`Daily ${bucketName} - User ${userData.displayName || 'Anonymous'}: count = ${count}`);
              
              return {
                id: userId,
                displayName: userData.displayName || 'Anonymous User',
                photoURL: userData.photoURL || null,
                count: count
              };
            })
          );

          const filteredResults = statsWithUserDetails.filter(user => user.count > 0);
          console.log(`Daily ${bucketName} results:`, filteredResults);
          return filteredResults;
        };

        // Helper function to fetch all-time stats from usersPublic
        const fetchAllTimeStats = async (fieldName) => {
          const usersRef = collection(db, 'usersPublic');
          const q = query(
            usersRef,
            where('stats.creditsBalance', '<', 500),
            orderBy('stats.creditsBalance', 'asc'),
            orderBy(`stats.${fieldName}`, 'desc'), 
            limit(10)
          );
          console.log('Fetching all-time stats for:', fieldName);
          const snapshot = await getDocs(q);
          
          const results = snapshot.docs
            .map(doc => {
              const data = doc.data();
              const count = data.stats?.[fieldName] || 0;
              console.log(`User ${data.displayName || 'Anonymous'}: ${fieldName} = ${count}`);
              return {
                id: doc.id,
                displayName: data.displayName || 'Anonymous User',
                photoURL: data.photoURL || null,
                count: count
              };
            })
            .filter(user => user.count > 0); // Filtrează doar utilizatorii cu count > 0
          
          console.log(`All-time ${fieldName} results:`, results);
          return results;
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
          console.log(`Fetching stats for ${key}: allTimeField=${allTimeField}, dailyCollection=${dailyCollection}`);
          
          // Fetch all-time stats from usersPublic
          results.allTime[key] = await fetchAllTimeStats(allTimeField);
          
          // Fetch today's stats from stats collection
          results.today[key] = await fetchDailyStats(todayKey, dailyCollection);
        }

        console.log('Final results:', results);
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