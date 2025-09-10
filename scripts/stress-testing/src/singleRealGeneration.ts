import { config as loadEnv } from 'dotenv';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { firebaseConfig, localConfig, testConfig } from './config';
import { TestDataGenerator } from './testDataGenerator';
import { logWithTimestamp, sleep } from './utils';

// Load environment variables (prefer staging, then local, then default)
loadEnv({ path: '.env_staging' });
loadEnv({ path: '.env_local' });
loadEnv();

// Environment detection - prioritize TEST_ENVIRONMENT
const isStaging = process.env.TEST_ENVIRONMENT === 'staging';
const isLocal = process.env.TEST_ENVIRONMENT === 'local' || (!isStaging && process.env.USE_EMULATOR === 'true');

// Debug logging
console.log('🔍 Environment Detection:');
console.log(`   TEST_ENVIRONMENT: ${process.env.TEST_ENVIRONMENT}`);
console.log(`   USE_EMULATOR: ${process.env.USE_EMULATOR}`);
console.log(`   isLocal: ${isLocal}`);
console.log(`   isStaging: ${isStaging}`);

// Set defaults based on environment
if (isLocal) {
  if (!process.env.USE_EMULATOR) process.env.USE_EMULATOR = 'true';
  if (!process.env.EMULATOR_HOST) process.env.EMULATOR_HOST = '127.0.0.1';
  if (!process.env.EMULATOR_FIRESTORE_PORT) process.env.EMULATOR_FIRESTORE_PORT = '8081';
  if (!process.env.EMULATOR_AUTH_PORT) process.env.EMULATOR_AUTH_PORT = '9099';
} else if (isStaging) {
  process.env.USE_EMULATOR = 'false';
}

type GenerationCheckpoints = {
  createdAt: number;
  taskIdAt?: number;
  generationStartedAt?: number;
  completedAt?: number;
  firstPartialAt?: number;
};

async function initializeFirebase(): Promise<void> {
  if (admin.apps.length > 0) return;

  if (isLocal) {
    process.env.FIRESTORE_EMULATOR_HOST = `${process.env.EMULATOR_HOST}:${process.env.EMULATOR_FIRESTORE_PORT}`;
    process.env.FIREBASE_AUTH_EMULATOR_HOST = `${process.env.EMULATOR_HOST}:${process.env.EMULATOR_AUTH_PORT}`;
    logWithTimestamp(`🔧 Connecting to LOCAL emulator:`);
    logWithTimestamp(`   - Firestore: ${process.env.FIRESTORE_EMULATOR_HOST}`);
    logWithTimestamp(`   - Auth: ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
  } else if (isStaging) {
    logWithTimestamp(`🌐 Connecting to STAGING environment:`);
    logWithTimestamp(`   - Project: ${firebaseConfig.projectId}`);
    logWithTimestamp(`   - Functions: https://europe-central2-manele-io-test.cloudfunctions.net`);
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: firebaseConfig.projectId,
      privateKey: firebaseConfig.privateKey,
      clientEmail: firebaseConfig.clientEmail,
    }),
    projectId: firebaseConfig.projectId,
  });
  logWithTimestamp('✅ Firebase Admin SDK initialized');
}

async function ensureSingleTestUser(): Promise<{ uid: string; email: string; displayName: string }> {
  const email = 'stress.real1@gmail.com';
  const displayName = 'Real Flow Test User';

  try {
    const user = await admin.auth().getUserByEmail(email);
    logWithTimestamp(`✅ Using existing Auth user: ${email}`);
    return { uid: user.uid, email, displayName };
  } catch {
    const user = await admin.auth().createUser({ email, password: 'StressTest123!', displayName, emailVerified: true });
    logWithTimestamp(`✅ Created Auth user: ${email}`);
    return { uid: user.uid, email, displayName };
  }
}

async function ensureUserDocument(uid: string, email: string, displayName: string): Promise<void> {
  const db = admin.firestore();
  const userRef = db.collection('users').doc(uid);
  const snap = await userRef.get();
  if (snap.exists) {
    logWithTimestamp('✅ Firestore user document exists');
    return;
  }
  await userRef.set({
    uid,
    email,
    displayName,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    // Provide a credit so future requests can be success if using callable path
    creditsBalance: 1,
    dedicationBalance: 0,
    aruncaCuBaniBalance: 0,
    stats: {
      numSongsGenerated: 0,
      numDedicationsGiven: 0,
      sumDonationsTotal: 0,
    },
    subscription: { status: 'none' },
  });
  logWithTimestamp('✅ Created Firestore user document');
}

async function createSuccessPaymentGenerationRequest(uid: string): Promise<{ requestId: string; checkpoints: GenerationCheckpoints }> {
  const db = admin.firestore();
  const generationRef = db.collection(testConfig.testCollection).doc();

  const generator = new TestDataGenerator();
  const req = generator.generateSpecificRequest({
    title: 'Test Real Generation 1',
    style: 'jale',
    wantsDedication: false,
  });

  const nowMs = Date.now();
  // Build userGenerationInput with explicit defaults to avoid undefined in backend writes
  const userGenerationInput: any = {
    style: req.style,
    title: req.title,
    lyricsDetails: req.lyricsDetails || '',
    from: req.from || '',
    to: req.to || '',
    dedication: req.dedication || '',
    wantsDedication: !!req.wantsDedication,
    wantsDonation: false,
    donorName: '',
    donationAmount: 0,
  };

  const payload: any = {
    userId: uid,
    paymentStatus: 'success',
    songPaymentType: 'balance',
    dedicationPaymentType: req.wantsDedication ? 'onetime' : 'no_payment',
    aruncaCuBaniPaymentType: 'no_payment',
    aruncaCuBaniAmountToPay: 0,
    shouldFulfillDedication: req.wantsDedication,
    shouldFulfillAruncaCuBani: false,
    aruncaCuBaniAmountToFulfill: 0,
    userGenerationInput,
    testMode: true,
    generationStarted: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    // Mark for easy identification of this run
    testLabel: 'single-real-generation',
  };

  await generationRef.set(payload);
  logWithTimestamp(`📝 Created generation request with paymentStatus=success: ${generationRef.id}`);

  const checkpoints: GenerationCheckpoints = { createdAt: nowMs };
  return { requestId: generationRef.id, checkpoints };
}

async function waitForTaskIdAndStart(requestId: string, checkpoints: GenerationCheckpoints): Promise<string> {
  const db = admin.firestore();
  const ref = db.collection(testConfig.testCollection).doc(requestId);

  logWithTimestamp('⏳ Waiting for task enqueue and generation start...');
  let taskId = '';

  for (;;) {
    const snap = await ref.get();
    const data = snap.data() as any;
    if (data?.taskId && !taskId) {
      taskId = data.taskId;
      checkpoints.taskIdAt = Date.now();
      logWithTimestamp(`✅ Task enqueued: taskId=${taskId}`);
    }
    if (data?.generationStarted && data?.generationStartedAt && checkpoints.generationStartedAt === undefined) {
      checkpoints.generationStartedAt = Date.now();
      logWithTimestamp('✅ Generation started');
    }
    // Proceed only when we have both taskId and generation has started
    if (taskId && checkpoints.generationStartedAt) break;
    await sleep(1000);
  }

  return taskId;
}

async function waitForCompletion(taskId: string, checkpoints: GenerationCheckpoints): Promise<'completed' | 'failed' | 'timeout'> {
  const db = admin.firestore();
  const statusRef = db.collection('taskStatuses').doc(taskId);
  const deadline = Date.now() + 1000 * 60 * 5; // 5 minutes

  for (;;) {
    const now = Date.now();
    if (now > deadline) {
      logWithTimestamp('⏰ Timeout waiting for completion', 'WARN');
      return 'timeout';
    }
    const snap = await statusRef.get();
    if (!snap.exists) {
      await sleep(1500);
      continue;
    }
    const data = snap.data() as any;
    const status = data?.status as string | undefined;
    if (status === 'completed') {
      checkpoints.completedAt = Date.now();
      logWithTimestamp('🎉 Generation completed');
      return 'completed';
    }
    if (status === 'failed') {
      checkpoints.completedAt = Date.now();
      logWithTimestamp('💥 Generation failed', 'ERROR');
      return 'failed';
    }
    if (status === 'partial' && !checkpoints.firstPartialAt) {
      checkpoints.firstPartialAt = Date.now();
    }
    logWithTimestamp(`📊 Current status: ${status || 'unknown'}`);
    await sleep(3000);
  }
}

async function collectAndSaveReport(requestId: string, taskId: string, checkpoints: GenerationCheckpoints): Promise<void> {
  try {
    const db = admin.firestore();
    const folder = path.join(__dirname, '..', 'output', 'real-single-test');
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

    // Load server-side docs for authoritative timestamps and IDs
    const reqSnap = await db.collection(testConfig.testCollection).doc(requestId).get();
    const reqData = reqSnap.data() as any;
    const requestServerCreatedAt = reqData?.createdAt?.toDate?.() as Date | undefined;
    const requestServerGenerationStartedAt = reqData?.generationStartedAt?.toDate?.() as Date | undefined;

    const taskSnap = await db.collection('tasks').doc(taskId).get();
    const taskData = taskSnap.data() as any;
    const externalTaskId = taskData?.externalId as string | undefined;
    const taskServerCreatedAt = taskData?.createdAt?.toDate?.() as Date | undefined;

    const taskStatusSnap = await db.collection('taskStatuses').doc(taskId).get();
    const taskStatusData = taskStatusSnap.data() as any;
    const taskStatusCreatedAt = taskStatusData?.createdAt?.toDate?.() as Date | undefined;
    const taskStatusUpdatedAt = taskStatusData?.updatedAt?.toDate?.() as Date | undefined;
    const finalStatus = taskStatusData?.status as string | undefined;

    const songIds: string[] = Array.isArray(taskData?.songIds) ? taskData.songIds : [];
    const songs: any[] = [];
    for (const sid of songIds) {
      const songSnap = await db.collection('songs').doc(sid).get();
      const sdata = songSnap.data() as any;
      songs.push({
        id: sid,
        createdAt: sdata?.createdAt?.toDate?.()?.toISOString?.(),
        updatedAt: sdata?.updatedAt?.toDate?.()?.toISOString?.(),
        externalId: sdata?.externalId,
        externalTaskId: sdata?.externalTaskId,
        userId: sdata?.userId,
        apiData: {
          title: sdata?.apiData?.title,
          duration: sdata?.apiData?.duration,
          audioUrl: sdata?.apiData?.audioUrl,
          streamAudioUrl: sdata?.apiData?.streamAudioUrl,
          imageUrl: sdata?.apiData?.imageUrl,
        },
        storage: sdata?.storage ? {
          url: sdata.storage.url,
          sizeBytes: sdata.storage.sizeBytes,
          contentType: sdata.storage.contentType,
        } : null,
      });
    }

    // Durations (client-based)
    const durationsClient = {
      enqueueLatencyMs: checkpoints.taskIdAt && (checkpoints.taskIdAt - checkpoints.createdAt),
      timeToGenerationStartMs: checkpoints.generationStartedAt && (checkpoints.generationStartedAt - checkpoints.createdAt),
      timeToFirstPartialMs: checkpoints.firstPartialAt && (checkpoints.firstPartialAt - checkpoints.createdAt),
      totalToCompleteMs: checkpoints.completedAt && (checkpoints.completedAt - checkpoints.createdAt),
    };

    // Durations (server-based where possible)
    const durationsServer = {
      createdToGenerationStartMs: (requestServerCreatedAt && requestServerGenerationStartedAt) ? (requestServerGenerationStartedAt.getTime() - requestServerCreatedAt.getTime()) : undefined,
      generationStartToTaskStatusCreatedMs: (requestServerGenerationStartedAt && taskStatusCreatedAt) ? (taskStatusCreatedAt.getTime() - requestServerGenerationStartedAt.getTime()) : undefined,
      taskStatusCreatedToFinalUpdateMs: (taskStatusCreatedAt && taskStatusUpdatedAt) ? (taskStatusUpdatedAt.getTime() - taskStatusCreatedAt.getTime()) : undefined,
      createdToTaskCreatedMs: (requestServerCreatedAt && taskServerCreatedAt) ? (taskServerCreatedAt.getTime() - requestServerCreatedAt.getTime()) : undefined,
    };

    const report = {
      ids: {
        requestId,
        taskId,
        externalTaskId,
        songIds,
      },
      timestampsClientMs: {
        requestCreatedAt: checkpoints.createdAt,
        taskIdAt: checkpoints.taskIdAt,
        generationStartedAt: checkpoints.generationStartedAt,
        firstPartialAt: checkpoints.firstPartialAt,
        completedAt: checkpoints.completedAt,
      },
      timestampsServer: {
        requestCreatedAt: requestServerCreatedAt?.toISOString?.(),
        requestGenerationStartedAt: requestServerGenerationStartedAt?.toISOString?.(),
        taskCreatedAt: taskServerCreatedAt?.toISOString?.(),
        taskStatusCreatedAt: taskStatusCreatedAt?.toISOString?.(),
        taskStatusUpdatedAt: taskStatusUpdatedAt?.toISOString?.(),
      },
      durationsClientMs: durationsClient,
      durationsServerMs: durationsServer,
      finalStatus,
      requestSummary: {
        paymentStatus: reqData?.paymentStatus,
        songPaymentType: reqData?.songPaymentType,
        dedicationPaymentType: reqData?.dedicationPaymentType,
        aruncaCuBaniPaymentType: reqData?.aruncaCuBaniPaymentType,
        userGenerationInput: reqData?.userGenerationInput,
      },
      taskSummary: {
        externalStatus: taskData?.externalStatus,
        songIdsCount: songIds.length,
      },
      songs,
      backend: {
        emulator: localConfig.useEmulator,
        firestore: process.env.FIRESTORE_EMULATOR_HOST,
        auth: process.env.FIREBASE_AUTH_EMULATOR_HOST,
      }
    };
    const file = path.join(folder, `single-real-generation-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(file, JSON.stringify(report, null, 2));
    logWithTimestamp(`💾 Saved report: ${file}`);
  } catch (e) {
    logWithTimestamp(`❌ Failed to save report: ${e instanceof Error ? e.message : 'Unknown error'}`, 'ERROR');
  }
}

async function main(): Promise<void> {
  logWithTimestamp('🚀 Single Real Generation (Local Backend, No Mocks)');
  logWithTimestamp('============================================================');
  logWithTimestamp(`🔧 Emulator mode: ${localConfig.useEmulator ? 'ON' : 'OFF'}`);
  logWithTimestamp(`📁 Collection: ${testConfig.testCollection}`);
  logWithTimestamp('============================================================');

  await initializeFirebase();
  const { uid, email, displayName } = await ensureSingleTestUser();
  await ensureUserDocument(uid, email, displayName);

  const { requestId, checkpoints } = await createSuccessPaymentGenerationRequest(uid);
  const taskId = await waitForTaskIdAndStart(requestId, checkpoints);
  const outcome = await waitForCompletion(taskId, checkpoints);

  await collectAndSaveReport(requestId, taskId, checkpoints);

  if (outcome !== 'completed') {
    logWithTimestamp('⚠️ Test finished without successful completion. Check emulator logs.', 'WARN');
    process.exit(1);
  }

  logWithTimestamp('🎯 Single real generation test completed successfully!');
}

if (require.main === module) {
  main().catch((err) => {
    logWithTimestamp(`💥 Unhandled error: ${err instanceof Error ? err.message : 'Unknown error'}`, 'ERROR');
    process.exit(1);
  });
}


