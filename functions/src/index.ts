// Export functions to be deployed
export { createGenerationRequest } from './handlers/createGenerationRequest';
export { createUserIfNotExists } from './handlers/createUserIfNotExists';
export { submitFeedback } from './handlers/submitFeedback';
export { syncGenerationStatusForUser } from './handlers/syncGenerationStatus';
export { updateUserProfile } from './handlers/updateUserProfile';

// Triggers
export { onGenerationRequestPaymentSuccess } from "./handlers/triggers/onGenerationRequestPaymentSuccess";
export { mirrorSongsPublic } from './handlers/triggers/song/mirrorSongsPublic';
export { onSongAudioUrlCreated } from './handlers/triggers/song/onSongAudioUrlCreated';
export { updateStatsAndLeaderboardOnTaskSuccess } from './handlers/triggers/updateStatsAndLeaderboardOnTaskSuccess';
export { mirrorUsersPublic } from './handlers/triggers/user/mirrorUsersPublic';
export { onSubPeriodStartChange } from './handlers/triggers/user/onSubPeriodStartChange';

// Export tasks
export { downloadSongTask } from "./handlers/tasks/downloadSong";
export { generateSongTask } from "./handlers/tasks/generateSong";
export { pollGenerationStatusTask } from "./handlers/tasks/pollGenerationStatus";

// Stripe payments
export { createSubscriptionCheckoutSession } from './handlers/createSubscriptionCheckoutSession';
export { stripeWebhook } from './handlers/stripeWebhook';

