import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebase';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Se verifică plata...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyPaymentAndProceed = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      if (!sessionId) {
        navigate('/');
        return;
      }

      // We rely on the backend webhook to already have added credits.
      // We'll poll the user document to ensure credits > 0.
      try {
        const pendingDataRaw = localStorage.getItem('pendingGenerationData');
        const generationData = pendingDataRaw ? JSON.parse(pendingDataRaw) : null;
        if (!generationData) {
          navigate('/');
          return;
        }

        // simple check to see if credits are available - try 5 times
        for (let i = 0; i < 5; i++) {
          const userId = auth.currentUser?.uid;
          if (!userId) break;
          const userRef = doc(db, 'users', userId);
          const userSnap = await getDoc(userRef);
          const credits = userSnap.data()?.credits || 0;
          if (credits > 0) {
            // redirect to loading page which will consume credits
            localStorage.removeItem('pendingGenerationData');
            navigate('/loading', { state: generationData });
            return;
          }
          await new Promise(r => setTimeout(r, 1000));
        }
        setError('Plata nu a fost confirmată încă. Încearcă reîncărcarea paginii.');
      } catch (err) {
        console.error(err);
        setError('A apărut o eroare după plată.');
      }
    };

    verifyPaymentAndProceed();
  }, [navigate]);

  if (error) {
    return (
      <div className="payment-success-page">
        <h1>Eroare</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="payment-success-page">
      <h1>Plată confirmată!</h1>
      <p>{status}</p>
    </div>
  );
} 