import { logger } from "firebase-functions/v2";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { db } from "../../../config";
import { COLLECTIONS } from "../../../constants/collections";
import { Database } from "../../../types";

export const aggregateViewFromGenerationRequest = onDocumentWritten(
    `${COLLECTIONS.GENERATION_REQUESTS}/{requestId}`,
    async (event) => {
        if (!event.data) return;
        const viewId = event.params.requestId;
        const after = event.data.after.data() as Database.GenerationRequest | undefined;

        if (!after) return; // Generation request deleted, do nothing

        try {
            const generationViewRef = db.collection(COLLECTIONS.GENERATION_VIEWS).doc(viewId);
            // Update the generation view
            await generationViewRef.update({
                paymentStatus: after.paymentStatus,
                generationStarted: after.generationStarted,
                ...(after.generationStarted && { generationStartedAt: after.generationStartedAt }),
                ...(after.error && { error: after.error }),
                userGenerationInput: after.userGenerationInput,
            });
        } catch (error) {
            logger.error("[aggregateFromGenerationRequest] Error for viewId: ${viewId}", error);
            throw new HttpsError('internal', 'Internal server error while aggregating generation view.');
        }
    }
);

export const aggregateViewFromTaskStatus = onDocumentWritten(
    `${COLLECTIONS.TASK_STATUSES}/{taskId}`,
    async (event) => {
        if (!event.data) return;

        const after = event.data.after.data() as Database.TaskStatus | undefined;
        if (!after) return; // Task status deleted, do nothing

        const viewId = after.requestId;
        if (!viewId) return; // Task status does not have a requestId, do nothing

        try {
            const generationViewRef = db.collection(COLLECTIONS.GENERATION_VIEWS).doc(viewId);
            // Update the generation view
            const updates = {
                ...(after.status && { status: after.status }),
                ...(after.songIds && { songIds: after.songIds }),
                ...(after.lyrics && { lyrics: after.lyrics }),
            };
            if (Object.keys(updates).length > 0) {
                await generationViewRef.update(updates);
            }
        } catch (error) {
            logger.error("[aggregateViewFromTaskStatus] Error for viewId: ${viewId}", error);
            throw new HttpsError('internal', 'Internal server error while aggregating generation view.');
        }
    }
);

export const aggregateViewFromSong = onDocumentWritten(
    `${COLLECTIONS.SONGS}/{songId}`,
    async (event) => {
        if (!event.data) return;
        const songId = event.params.songId;

        const after = event.data.after.data() as Database.SongData | undefined;
        if (!after) return; // Song deleted, do nothing

        const viewId = after.requestId;
        if (!viewId) return; // Song does not have a requestId, do nothing. Should not happen.

        try {
            const generationViewRef = db.collection(COLLECTIONS.GENERATION_VIEWS).doc(viewId);
            const songView = {
                id: songId,
                streamAudioUrl: after.apiData.streamAudioUrl,
                imageUrl: after.apiData.imageUrl,
                title: after.apiData.title,
                ...(after.apiData.audioUrl && { audioUrl: after.apiData.audioUrl }),
                ...(after.apiData.duration && { duration: after.apiData.duration }),
                ...(after.storage && { storage: after.storage }),
            };
            // Update only this song
            await generationViewRef.update({
                [`songById.${songId}`]: songView,
            });
        } catch (error) {
            logger.error("[aggregateViewFromSong] Error for viewId: ${viewId}", error);
            throw new HttpsError('internal', 'Internal server error while aggregating generation view.');
        }
    }
);