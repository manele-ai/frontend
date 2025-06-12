import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { pollManeaSongResult, triggerManeaSongComplete } from './api';
import { saveToList } from './storage';

export default function SongScreen() {
  const { style, id } = useLocalSearchParams();
  const [audioUrl, setAudioUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [showWave, setShowWave] = useState(false);
  const [saved, setSaved] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const router = useRouter();
  const buttonAnim = useRef(new Animated.Value(1)).current;
  const { width } = useWindowDimensions();

  useEffect(() => {
    let polling;
    let isMounted = true;
    setError(null);
    setAudioUrl(null);
    setIsLoading(true);
    setShowWave(false);
    setIsPlaying(false);
    setSound(null);
    setSaved(false);
    setTriggered(false);

    async function poll() {
      try {
        const data = await pollManeaSongResult(id);
        if (!isMounted) return;
        if (data.status === 'completed' && data.audioUrl) {
          setAudioUrl(data.audioUrl);
          setIsLoading(false);
          if (!triggered) {
            setTriggered(true);
            triggerManeaSongComplete(id).catch(() => {});
          }
        } else if (data.status === 'failed') {
          setError('A apărut o eroare la generare.');
          setIsLoading(false);
        } else {
          polling = setTimeout(poll, 2000);
        }
      } catch (e) {
        setError('Eroare la verificarea statusului.');
        setIsLoading(false);
      }
    }
    if (id) poll();
    return () => {
      isMounted = false;
      if (polling) clearTimeout(polling);
      if (sound) sound.unloadAsync();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Salvează piesa în storage când audioUrl e gata (doar o dată)
  useEffect(() => {
    if (audioUrl && id && style && !saved) {
      saveToList('maneleList', { id, style, audioUrl });
      setSaved(true);
    }
  }, [audioUrl, id, style, saved]);

  const handlePlayPause = async () => {
    Animated.sequence([
      Animated.timing(buttonAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    if (!audioUrl) {
      setError('Nu există url audio!');
      return;
    }
    if (sound && isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
      setShowWave(false);
    } else if (sound) {
      await sound.playAsync();
      setIsPlaying(true);
      setShowWave(true);
    } else {
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true },
          (status) => {
            if ('didJustFinish' in status && status.didJustFinish) {
              setIsPlaying(false);
              setShowWave(false);
            }
          }
        );
        setSound(newSound);
        setIsPlaying(true);
        setShowWave(true);
      } catch (e) {
        setError('Nu s-a putut reda piesa.');
        setShowWave(false);
      }
    }
  };

  return (
    <View style={[styles.container, { paddingTop: width > 600 ? 100 : 50 }] }>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Înapoi</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Generează piesă</Text>
      <Text style={styles.subtitle}>Stil: <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>{style}</Text></Text>
      {isLoading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Se generează piesa ta...</Text>
        </View>
      )}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {audioUrl && !isLoading && !error && (
        <View style={styles.playerBox}>
          <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
            <TouchableOpacity style={styles.modernPlayButton} onPress={handlePlayPause} activeOpacity={0.8}>
              <Text style={styles.modernPlayIcon}>{isPlaying ? '⏸️' : '▶️'}</Text>
            </TouchableOpacity>
          </Animated.View>
          {showWave && (
            <Image
              source={{ uri: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif' }}
              style={styles.waveform}
              resizeMode="contain"
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A20',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    backgroundColor: '#23242b',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  backButtonText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
    letterSpacing: 1,
    marginTop: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 28,
    textAlign: 'center',
  },
  loadingBox: {
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    color: '#FFD700',
    fontSize: 18,
    marginTop: 18,
    fontWeight: 'bold',
  },
  errorBox: {
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerBox: {
    marginTop: 40,
    alignItems: 'center',
    width: '100%',
  },
  modernPlayButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#23242b',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  modernPlayIcon: {
    fontSize: 44,
    color: '#fff',
    textAlign: 'center',
  },
  waveform: {
    width: 180,
    height: 60,
  },
}); 