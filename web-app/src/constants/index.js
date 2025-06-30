// Application constants
export const STYLES = [
  'Jale ( Guta/Salam Vechi)',
  'De Petrecere ( Bem 7 zile )',
  'Comerciale ( BDLP )',
  'Lautaresti',
  'Muzica Populara',
  'Manele live',
  'De Opulenta',
  'Orientale'
];

export const COLORS = {
  primary: '#eab111',
  secondary: '#23242b',
  background: '#181A20',
  text: '#ffffff',
  textSecondary: '#a2a5bd',
  error: '#ff3b30',
  success: '#34c759',
  warning: '#ff9500'
};

export const STORAGE_KEYS = {
  PENDING_GENERATE_REQUEST: 'pendingGenerateRequest',
  MANELE_LIST: 'maneleList',
  USER_PREFERENCES: 'userPreferences'
};

export const API_ENDPOINTS = {
  GENERATE_SONG: 'generateSong',
  GET_STATUS: 'getGenerationStatus',
  DOWNLOAD_SONG: 'downloadSong'
};

export const POLLING_INTERVAL = 2000; // 2 seconds

export const ANIMATION_DURATION = {
  fast: 100,
  normal: 200,
  slow: 300
}; 