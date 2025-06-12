import { Audio } from 'expo-av';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const STYLES = [
  'Clasică',
  'Modernă',
  'Lăutărească',
  'Trapanele',
  'Orientală',
  'Romantică',
];

export default function App() {
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUri, setAudioUri] = useState(null);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [showWave, setShowWave] = useState(false);
  const buttonAnim = useRef(new Animated.Value(1)).current;

  // Cleanup audio on unmount
  React.useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const handleStyleSelect = (style) => {
    setSelectedStyle(style);
    setAudioUri(null);
    setError(null);
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setAudioUri(null);
    // Animatie la apasare
    Animated.sequence([
      Animated.timing(buttonAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    try {
      // Simulam delay si raspuns API
      await new Promise((res) => setTimeout(res, 1800));
      // Simulam URL audio (un mp3 demo public)
      const fakeAudioUrl =
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
      setAudioUri(fakeAudioUrl);
    } catch (e) {
      setError('A apărut o eroare. Încearcă din nou!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleGenerate();
  };

  const handlePlayPause = async () => {
    if (!audioUri) return;
    if (sound && isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
      setShowWave(false);
    } else if (sound) {
      await sound.playAsync();
      setIsPlaying(true);
      setShowWave(true);
    } else {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true },
        (status) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
            setShowWave(false);
          }
        }
      );
      setSound(newSound);
      setIsPlaying(true);
      setShowWave(true);
    }
  };

  // UI
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manea Generator</Text>
      <Text style={styles.subtitle}>Alege stilul preferat:</Text>
      <View style={styles.stylesList}>
        {STYLES.map((style) => (
          <TouchableOpacity
            key={style}
            style={[
              styles.styleButton,
              selectedStyle === style && styles.styleButtonSelected,
            ]}
            activeOpacity={0.7}
            onPress={() => handleStyleSelect(style)}
            disabled={isLoading}
          >
            <Text
              style={[
                styles.styleButtonText,
                selectedStyle === style && styles.styleButtonTextSelected,
              ]}
            >
              {style}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Animated.View style={{ transform: [{ scale: buttonAnim }], width: '100%' }}>
        <TouchableOpacity
          style={[
            styles.generateButton,
            (!selectedStyle || isLoading) && styles.generateButtonDisabled,
          ]}
          activeOpacity={0.8}
          onPress={handleGenerate}
          disabled={!selectedStyle || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>Generează piesă</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Reîncearcă</Text>
          </TouchableOpacity>
        </View>
      )}
      {audioUri && !error && (
        <View style={styles.playerBox}>
          <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
            <Text style={styles.playButtonText}>{isPlaying ? '⏸️ Pauză' : '▶️ Redă'}</Text>
          </TouchableOpacity>
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
    paddingTop: 70,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 18,
  },
  stylesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 30,
  },
  styleButton: {
    backgroundColor: '#23242b',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 18,
    margin: 4,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  styleButtonSelected: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  styleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  styleButtonTextSelected: {
    color: '#23242b',
    fontWeight: 'bold',
  },
  generateButton: {
    backgroundColor: '#FFD700',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 18,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  generateButtonDisabled: {
    backgroundColor: '#b5a642',
    opacity: 0.7,
  },
  generateButtonText: {
    color: '#23242b',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  errorBox: {
    backgroundColor: '#ffeded',
    borderRadius: 10,
    padding: 14,
    marginTop: 10,
    alignItems: 'center',
  },
  errorText: {
    color: '#b00020',
    fontSize: 15,
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#FFD700',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: '#23242b',
    fontWeight: 'bold',
    fontSize: 15,
  },
  playerBox: {
    marginTop: 30,
    alignItems: 'center',
    width: '100%',
  },
  playButton: {
    backgroundColor: '#23242b',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 28,
    marginBottom: 10,
  },
  playButtonText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  waveform: {
    width: 180,
    height: 60,
  },
}); 