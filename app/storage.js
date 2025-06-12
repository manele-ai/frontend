import { Platform } from 'react-native';
let SecureStore;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

// Salvează o valoare (stringificat)
export async function saveItem(key, value) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, JSON.stringify(value));
  } else {
    await SecureStore.setItemAsync(key, JSON.stringify(value));
  }
}

// Ia o valoare (parsată)
export async function getItem(key) {
  if (Platform.OS === 'web') {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } else {
    const value = await SecureStore.getItemAsync(key);
    return value ? JSON.parse(value) : null;
  }
}

// Șterge o valoare
export async function removeItem(key) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

// Adaugă un element într-o listă stocată (ex: lista de manele)
export async function saveToList(key, item) {
  const list = (await getItem(key)) || [];
  list.push(item);
  await saveItem(key, list);
} 