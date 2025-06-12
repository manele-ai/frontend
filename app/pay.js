import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function PayScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Plata este disponibilă doar pe web momentan.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#181A20' },
  text: { color: '#FFD700', fontSize: 18, fontWeight: 'bold', textAlign: 'center', padding: 24 }
}); 