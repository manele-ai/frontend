import { FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { songsBucket } from "../../config";

/**
 * Performs a mock download by creating a small placeholder file in Storage
 * and updating the song document with the storage path metadata.
 */
export async function performMockDownload(params: {
  songId: string;
  userId: string;
  songDocRef: FirebaseFirestore.DocumentReference;
  audioUrl: string;
}): Promise<void> {
  const { songId, userId, songDocRef, audioUrl } = params;

  logger.info(`downloadSong(MOCK): skipping network fetch for ${audioUrl}`);

  const fileName = `${songId}.mp3`;
  const destination = `songs/${userId}/${fileName}`;
  const file = songsBucket.file(destination);

  // Write a tiny placeholder payload to simulate an MP3
  const payload = Buffer.from("MOCK AUDIO DATA");
  await file.save(payload, { contentType: "audio/mpeg" });

  const [metadata] = await file.getMetadata();

  await songDocRef.update({
    updatedAt: FieldValue.serverTimestamp(),
    storage: {
      url: `gs://${songsBucket.name}/${destination}`,
      path: destination,
      sizeBytes: Number(metadata?.size || 0),
      contentType: metadata?.contentType || "audio/mpeg",
    },
  });
}


