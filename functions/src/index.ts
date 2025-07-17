// Export functions to be deployed
export { generateSong } from "./handlers/generateSong";
export { mirrorSongsPublic } from './handlers/mirrorSongsPublic';
export { mirrorUsersPublic } from './handlers/mirrorUsersPublic';
export { onAuthUserCreated } from './handlers/onAuthUserCreated';
export { onSongAudioUrlCreated } from './handlers/onSongAudioUrlCreated';
export { updateLeaderboardOnSongCreated } from './handlers/updateLeaderboardOnSongCreated';

// Export tasks
export { downloadSongTask } from "./handlers/tasks/downloadSong";
export { pollGenerationStatusTask } from "./handlers/tasks/pollGenerationStatus";

