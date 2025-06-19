// API functions for the web app

// 1. Trimite request de generare și primește un id
export async function generateManeaSong({ style, from, to, dedication }) {
  try {
    const response = await fetch('https://api.maneagenerator.com/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ style, from, to, dedication }),
    });
    if (!response.ok) {
      throw new Error('Eroare la generarea piesei');
    }
    // Presupunem că răspunsul conține un id
    const data = await response.json();
    // { id: '...' }
    return data;
  } catch (e) {
    throw e;
  }
}

// 2. Polling pentru statusul piesei generate
export async function pollManeaSongResult(id) {
  try {
    const response = await fetch(`https://api.maneagenerator.com/status/${id}`);
    if (!response.ok) {
      throw new Error('Eroare la verificarea statusului');
    }
    // Presupunem că răspunsul conține status și eventual url audio
    const data = await response.json();
    // { status: 'pending' | 'done' | 'error', audioUrl?: '...' }
    return data;
  } catch (e) {
    throw e;
  }
}

export async function fetchFirebaseToken() {
  try {
    const response = await fetch('https://us-central1-maneagenerator.cloudfunctions.net/generateToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Poți adăuga date suplimentare dacă e nevoie, de ex: device info
      body: JSON.stringify({ timestamp: Date.now() }),
    });
    if (!response.ok) {
      throw new Error('Eroare la generarea tokenului');
    }
    const data = await response.json();
    // Presupunem că răspunsul conține { token: '...' }
    return data;
  } catch (e) {
    throw e;
  }
}

// 3. Trigger la finalizarea generării piesei
export async function triggerManeaSongComplete(id) {
  try {
    const response = await fetch('https://api.maneagenerator.com/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      throw new Error('Eroare la trigger completare piesă');
    }
    return await response.json();
  } catch (e) {
    throw e;
  }
}

// Storage functions for web (using localStorage)
export function saveItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getItem(key) {
  const value = localStorage.getItem(key);
  return value ? JSON.parse(value) : null;
}

export function removeItem(key) {
  localStorage.removeItem(key);
}

export function saveToList(key, item) {
  const list = getItem(key) || [];
  list.push(item);
  saveItem(key, list);
} 