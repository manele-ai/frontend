import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Înlocuiește cu publishable key-ul tău Stripe
const STRIPE_PUBLISHABLE_KEY = 'pk_test_XXXXXXXXXXXXXXXXXXXXXXXX';
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

function PaymentForm({ style, from, to, dedication }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePay = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // TODO: Fetch clientSecret de la backend
    const clientSecret = 'pi_test_secret_xxx'; // mock
    const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) }
    });
    setLoading(false);
    if (stripeError) {
      setError(stripeError.message);
    } else {
      router.replace({ pathname: '/song', params: { style, from, to, dedication, payment: 'success' } });
    }
  };

  return (
    <form onSubmit={handlePay} style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}>
      <CardElement
        options={{
          style: {
            base: {
              fontSize: '18px',
              color: '#FFD700',
              backgroundColor: '#23242b',
              border: '2px solid #FFD700',
              borderRadius: '8px',
              padding: '18px 16px',
              minHeight: '64px',
              lineHeight: '44px',
              '::placeholder': { color: '#FFD700' },
            },
            invalid: {
              color: '#ff3b30',
            },
          },
        }}
      />
      <button type="submit" disabled={loading} style={{ marginTop: 24, padding: 12, fontSize: 18, background: '#FFD700', border: 'none', borderRadius: 8, color: '#23242b', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>
        Plătește cu cardul
      </button>
      {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
    </form>
  );
}

export default function PayScreen() {
  const { style, from, to, dedication } = useLocalSearchParams();
  const router = useRouter();
  return (
    <Elements stripe={stripePromise}>
      <View style={styles.container}>
        <button
          onClick={() => router.back()}
          style={{
            position: 'absolute',
            top: 24,
            left: 24,
            background: 'none',
            border: 'none',
            color: '#FFD700',
            fontSize: 28,
            cursor: 'pointer',
            fontWeight: 'bold',
            zIndex: 10,
          }}
        >
          ←
        </button>
        <Text style={styles.title}>Plată cu cardul</Text>
        <Text style={styles.subtitle}>Completează plata pentru a genera piesa</Text>
        <PaymentForm style={style} from={from} to={to} dedication={dedication} />
      </View>
    </Elements>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A20',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: '100vh',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 28,
    textAlign: 'center',
  },
}); 