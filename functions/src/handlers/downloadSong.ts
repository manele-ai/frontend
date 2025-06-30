import axios, { AxiosError } from "axios";
import admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { firebaseStorageBucket } from "../config";
import { COLLECTIONS } from "../constants/collections";
import { Database } from "../types";

interface DownloadSongData {
  songId: string;
}

// interface DownloadSongResponse {
//   storageUrl: string;
//   audioUrl: string;
//   songId: string;
// }

export const downloadSongHandler = onCall<DownloadSongData>(async (request) => {
  const { songId } = request.data;
  const { auth } = request;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Not authenticated.');
  }

  if (!songId) {
    throw new HttpsError('invalid-argument', 'Missing songId parameter');
  }

  try {
    const songDoc = await admin.firestore().collection(COLLECTIONS.SONGS).doc(songId).get();

    if (!songDoc.exists) {
      throw new HttpsError('not-found', `No song found with ID: ${songId}`);
    }

    const songData = songDoc.data() as Database.SongData;

    // Check if the user is authorized to download this song
    if (songData.userId !== auth.uid) {
      throw new HttpsError('permission-denied', 'You are not authorized to download this song.');
    }

    // Verify that the user exists in the database
    const userDoc = await admin.firestore().collection(COLLECTIONS.USERS).doc(auth.uid).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found in database.');
    }

    if (songData.storageUrl) {
      console.info(`Serving stored audio URL for song ID: ${songId} from: ${songData.storageUrl}`);
      return {
        storageUrl: songData.storageUrl,
        audioUrl: songData.audioUrl,
        songId: songDoc.id
      };
    }

    if (!songData.audioUrl) {
      throw new HttpsError('failed-precondition', `No audio URL found for song ID: ${songId}`);
    }

    const audioUrl = songData.audioUrl;
    console.info(`Attempting to save audio for song ID: ${songId} from ${audioUrl}`);
    
    const bucketName = firebaseStorageBucket.value();
    if (!bucketName) {
      throw new HttpsError('internal', 'Storage bucket not configured');
    }

    try {
      // Download file using axios
      const audioResponse = await axios({
        method: 'get',
        url: audioUrl,
        responseType: 'stream'
      });

      const bucket = admin.storage().bucket(bucketName);
      const fileName = `songs/${songId}.mp3`;
      const file = bucket.file(fileName);

      // Create write stream to Firebase Storage
      const writeStream = file.createWriteStream({
        metadata: {
          contentType: 'audio/mpeg'
        },
        resumable: false
      });

      // Pipe the download stream directly to Firebase Storage
      audioResponse.data.pipe(writeStream);

      // Wait for upload to complete
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      // Make the file public and get its URL
      await file.makePublic();
      const storageUrl = file.publicUrl();

      // Update the song document with the storage URL
      await songDoc.ref.update({
        storageUrl,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return {
        storageUrl,
        audioUrl: songData.audioUrl,
        songId: songDoc.id
      };

    } catch (error) {
      console.error(`Error saving audio file for song ID ${songId}:`, error);
      throw new HttpsError('internal', 'Failed to save audio file to storage');
    }

  } catch (error) {
    console.error(`Error in downloadSongHandler for song ID ${songId}:`, error);
    if (error instanceof AxiosError && error.response?.status === 404) {
      throw new HttpsError('not-found', 'Song not found');
    }
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Internal server error while processing song download');
  }
});
