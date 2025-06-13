import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../components/auth/AuthContext';
import { generateSong } from '../services/firebase/functions';

const STYLES = [
  'Jale ( Guta/Salam Vechi)',
  'De Petrecere ( Bem 7 zile )',
  'Comerciale ( BDLP )',
  'Lautaresti',
  'Muzica Populara',
  'Manele live',
  'De Opulenta',
  'Orientale'
];

export default function HomeScreen() {
  const { user, loading: authLoading } = useAuth();
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [fromName, setFromName] = useState('');
  const [toName, setToName] = useState('');
  const [dedication, setDedication] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const buttonAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();
  const [songName, setSongName] = useState('');
  const [songDetails, setSongDetails] = useState('');
  const [wantsDedication, setWantsDedication] = useState(false);
  const [wantsDonation, setWantsDonation] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [mode, setMode] = useState('hard'); // 'hard' sau 'easy'

  const handleStyleSelect = (style) => {
    setSelectedStyle(style);
    setError(null);
  };

  const handleGoToPay = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create the prompt from the form data
      const prompt = mode === 'hard' 
        ? `Generate a manele song named "${songName}" in style "${selectedStyle}" with the following details: ${songDetails}${
            wantsDedication 
              ? ` Include a dedication from ${fromName} to ${toName}${dedication ? ` saying: ${dedication}` : ''}.` 
              : ''
          }${
            wantsDonation 
              ? ` Mention throwing money amount: ${donationAmount} RON.` 
              : ''
          }`
        : `Generate a manele song named "${songName}" in style "${selectedStyle}"`;

      // Call the cloud function
      const result = await generateSong({ prompt });

      // Animate button
      Animated.sequence([
        Animated.timing(buttonAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
        Animated.timing(buttonAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();

      // TODO: cu plata va trebui sa salvam cu saveItem requestul de generare (momentat bypassing plata)
      // // Save request data and task IDs
      // const generateRequest = {
      //   style: selectedStyle,
      //   songName,
      //   songDetails,
      //   from: fromName,
      //   to: toName,
      //   dedication,
      //   wantsDedication,
      //   wantsDonation,
      //   donationAmount,
      //   taskId: result.taskId,
      //   externalTaskId: result.externalTaskId,
      // };
      // await saveItem('pendingGenerateRequest', generateRequest);
      // router.push({ 
      //   pathname: '/pay', 
      //   params: generateRequest 
      // });
    } catch (err) {
      console.error('Error generating song:', err);
      setError(err.message || 'Failed to generate song. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Manele IO</Text>
      <View style={{ width: '100%', alignItems: 'center', marginBottom: 18, flexDirection: 'row', justifyContent: 'center', gap: 18 }}>
      
        <Text style={[styles.modeButtonText, mode === 'easy' && styles.modeButtonTextActive, {marginRight: 10}]}>Easy</Text>
        <View style={styles.switchContainer}>
          <TouchableOpacity
            style={[
              styles.switchTrack,
              mode === 'hard' && { backgroundColor: '#FFD700' },
            ]}
            activeOpacity={1}
            onPress={() => setMode(mode === 'easy' ? 'hard' : 'easy')}
          >
            <View
              style={[
                styles.switchThumb,
                mode === 'hard' ? { left: 28, backgroundColor: '#23242b' } : { left: 2, backgroundColor: '#FFD700' },
              ]}
            />
          </TouchableOpacity>
        </View>
        <Text style={[styles.modeButtonText, mode === 'hard' && styles.modeButtonTextActive, {marginLeft: 10}]}>Complex</Text>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Nume piesă</Text>
        <TextInput
          style={styles.input}
          placeholder="Nume piesă"
          placeholderTextColor="#aaa"
          value={songName}
          onChangeText={setSongName}
          editable={!isLoading}
        />
      </View>
      {mode === 'hard' && (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Detalii versuri</Text>
            <TextInput
              style={styles.input}
              placeholder="Detalii versuri (ex: temă, atmosferă, poveste)"
              placeholderTextColor="#aaa"
              value={songDetails}
              onChangeText={setSongDetails}
              editable={!isLoading}
            />
          </View>
        </>
      )}
      <View style={styles.stylesListContainer}>
        <Text style={styles.inputLabel}>Alege stilul</Text>
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
      </View>
      {mode === 'hard' && (
        <>
          <View style={[styles.inputGroup, { flexDirection: 'row', alignItems: 'center', marginBottom: 10 }]}> 
            <input
              type="checkbox"
              checked={wantsDedication}
              onChange={e => setWantsDedication(e.target.checked)}
              style={{ width: 20, height: 20, marginRight: 10 }}
              disabled={isLoading}
            />
            <Text style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 16 }}>Vrei dedicație?</Text>
          </View>
          {wantsDedication && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>De la cine?</Text>
                <TextInput
                  style={styles.input}
                  placeholder="De la cine?"
                  placeholderTextColor="#aaa"
                  value={fromName}
                  onChangeText={setFromName}
                  editable={!isLoading}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Pentru cine?</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Pentru cine?"
                  placeholderTextColor="#aaa"
                  value={toName}
                  onChangeText={setToName}
                  editable={!isLoading}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Dedicatie</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Dedicatie (opțional)"
                  placeholderTextColor="#aaa"
                  value={dedication}
                  onChangeText={setDedication}
                  editable={!isLoading}
                />
              </View>
            </>
          )}
          <View style={[styles.inputGroup, { flexDirection: 'row', alignItems: 'center', marginBottom: 10 }]}> 
            <input
              type="checkbox"
              checked={wantsDonation}
              onChange={e => setWantsDonation(e.target.checked)}
              style={{ width: 20, height: 20, marginRight: 10 }}
              disabled={isLoading}
            />
            <Text style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 16 }}>Vrei să arunci cu bani?</Text>
          </View>
          {wantsDonation && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Alege suma pe care vrei sa o arunci la manele si se va specifica in piesa (RON)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 100 RON"
                placeholderTextColor="#aaa"
                value={donationAmount}
                onChangeText={setDonationAmount}
                keyboardType="numeric"
                editable={!isLoading}
              />
            </View>
          )}
        </>
      )}
      <Animated.View style={{ transform: [{ scale: buttonAnim }], width: '100%' }}>
        <TouchableOpacity
          style={[
            styles.generateButton,
            (!selectedStyle || isLoading) && styles.generateButtonDisabled,
          ]}
          activeOpacity={0.8}
          onPress={handleGoToPay}
          disabled={!selectedStyle || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>Plateste</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#181A20',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 70,
    paddingHorizontal: '10%',
    minHeight: '100vh',
    gap: 10,
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
  stylesListContainer: {
    width: '100%',
    flexDirection: 'column',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
    marginBottom: 30,
  },
  stylesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
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
    textTransform: 'uppercase',
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
  inputGroup: {
    width: '100%',
    marginBottom: 8,
  },
  inputLabel: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
    marginLeft: 2,
  },
  input: {
    width: '100%',
    backgroundColor: '#23242b',
    color: '#fff',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 2,
    borderWidth: 1.5,
    borderColor: '#333',
  },
  modeButtonText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modeButtonTextActive: {
    color: '#a2a5bd',
  },
  switchContainer: {
    width: 56,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchTrack: {
    width: 56,
    height: 28,
    borderRadius: 16,
    backgroundColor: '#23242b',
    justifyContent: 'center',
    position: 'relative',
  },
  switchThumb: {
    position: 'absolute',
    top: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    transitionProperty: Platform.OS === 'web' ? 'left, background-color' : undefined,
    transitionDuration: Platform.OS === 'web' ? '0.2s' : undefined,
  },
});
