import { config as loadEnv } from 'dotenv';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { firebaseConfig, localConfig, testConfig } from './config';
import { TestDataGenerator } from './testDataGenerator';
import { logWithTimestamp, sleep } from './utils';

// Load env (prefer staging, then local, then default)
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

type ConcurrentResult = {
  uid: string;
  email: string;
  requestId?: string;
  success: boolean;
  error?: string;
  enqueueMs?: number;
  taskId?: string;
  externalTaskId?: string;
  finalStatus?: string;
  totalMs?: number;
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
  logWithTimestamp('✅ Firebase Admin initialized');
}

async function ensureUser(uidEmailIndex: number): Promise<{ uid: string; email: string; displayName: string }> {
  const email = `${testConfig.emailPrefix}${uidEmailIndex}@${testConfig.emailDomain}`;
  const displayName = `Concurrent User ${uidEmailIndex}`;
  try {
    const user = await admin.auth().getUserByEmail(email);
    return { uid: user.uid, email, displayName };
  } catch {
    const user = await admin.auth().createUser({ email, password: testConfig.password, displayName, emailVerified: true });
    return { uid: user.uid, email, displayName };
  }
}

async function ensureUserDoc(uid: string, email: string, displayName: string): Promise<void> {
  const db = admin.firestore();
  const ref = db.collection('users').doc(uid);
  const snap = await ref.get();
  if (snap.exists) return;
  await ref.set({
    uid,
    email,
    displayName,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    creditsBalance: 1,
    dedicationBalance: 0,
    aruncaCuBaniBalance: 0,
    stats: { numSongsGenerated: 0, numDedicationsGiven: 0, sumDonationsTotal: 0 },
    subscription: { status: 'none' },
  });
}

function buildUserGenerationInput(generator: TestDataGenerator) {
  const req = generator.generateRandomRequest();
  return {
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
}

async function createGenerationForUser(uid: string): Promise<{ requestId: string; enqueueMs: number }> {
  const db = admin.firestore();
  const generator = new TestDataGenerator();
  const input = buildUserGenerationInput(generator);
  const collection = testConfig.testCollection;
  const ref = db.collection(collection).doc();
  const start = Date.now();
  await ref.set({
    userId: uid,
    paymentStatus: 'success',
    songPaymentType: 'balance',
    dedicationPaymentType: input.wantsDedication ? 'onetime' : 'no_payment',
    aruncaCuBaniPaymentType: 'no_payment',
    aruncaCuBaniAmountToPay: 0,
    shouldFulfillDedication: input.wantsDedication,
    shouldFulfillAruncaCuBani: false,
    aruncaCuBaniAmountToFulfill: 0,
    userGenerationInput: input,
    testMode: true,
    generationStarted: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  const enqueueMs = Date.now() - start;
  return { requestId: ref.id, enqueueMs };
}

async function waitForTaskId(requestId: string): Promise<string> {
  const db = admin.firestore();
  const ref = db.collection(testConfig.testCollection).doc(requestId);
  for (;;) {
    const snap = await ref.get();
    const data = snap.data() as any;
    if (data?.taskId) return data.taskId as string;
    await sleep(500);
  }
}

async function waitForCompletion(taskId: string, timeoutMs: number): Promise<{ finalStatus: string; totalMs: number; externalTaskId?: string }> {
  const db = admin.firestore();
  const statusRef = db.collection('taskStatuses').doc(taskId);
  const taskRef = db.collection('tasks').doc(taskId);
  const start = Date.now();
  for (;;) {
    if (Date.now() - start > timeoutMs) {
      return { finalStatus: 'timeout', totalMs: Date.now() - start };
    }
    const [statusSnap, taskSnap] = await Promise.all([statusRef.get(), taskRef.get()]);
    const statusData = statusSnap.data() as any;
    const taskData = taskSnap.data() as any;
    const status = statusData?.status as string | undefined;
    if (status === 'completed' || status === 'failed') {
      return { finalStatus: status, totalMs: Date.now() - start, externalTaskId: taskData?.externalId };
    }
    await sleep(1000);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const count = args[0] ? parseInt(args[0], 10) : 10;
  if (!Number.isFinite(count) || count < 1) {
    logWithTimestamp('❌ Invalid count argument. Usage: ts-node src/concurrentRealGeneration.ts <count>', 'ERROR');
    process.exit(1);
  }
  // Allow override via 2nd CLI arg: timeoutMs
  const timeoutMs = args[1] ? parseInt(args[1], 10) : parseInt(process.env.CONCURRENT_TIMEOUT_MS || '60000', 10);

  logWithTimestamp('🚀 Concurrent Real Generation Stress Test');
  logWithTimestamp('============================================================');
  logWithTimestamp(`👥 Users/Requests: ${count}`);
  logWithTimestamp(`🔧 Emulator mode: ${localConfig.useEmulator ? 'ON' : 'OFF'}`);
  logWithTimestamp('============================================================');

  await initializeFirebase();

  // Prepare users
  const users: { uid: string; email: string; displayName: string }[] = [];
  for (let i = 1; i <= count; i++) {
    const u = await ensureUser(i);
    await ensureUserDoc(u.uid, u.email, u.displayName);
    users.push(u);
  }

  // Fire concurrent generation requests
  const startAll = Date.now();
  const promises: Promise<ConcurrentResult>[] = users.map(async (u) => {
    try {
      const { requestId, enqueueMs } = await createGenerationForUser(u.uid);
      return { uid: u.uid, email: u.email, requestId, success: true, enqueueMs };
    } catch (e) {
      return { uid: u.uid, email: u.email, success: false, error: (e as Error).message };
    }
  });

  const settled = await Promise.allSettled(promises);
  const endAll = Date.now();

  const enqueueResults: ConcurrentResult[] = settled.map((r) => r.status === 'fulfilled' ? r.value : ({ uid: 'unknown', email: 'unknown', success: false, error: String(r.reason) }));
  const total = enqueueResults.length;
  const ok = enqueueResults.filter(r => r.success).length;
  const fail = total - ok;
  const avgEnqueue = Math.round(enqueueResults.filter(r => r.enqueueMs !== undefined).reduce((s, r) => s + (r.enqueueMs || 0), 0) / Math.max(1, ok));
  const durationMs = endAll - startAll;

  logWithTimestamp('📊 CONCURRENT ENQUEUE SUMMARY');
  logWithTimestamp(`✅ Successful: ${ok}`);
  logWithTimestamp(`❌ Failed: ${fail}`);
  logWithTimestamp(`⏱️  Avg enqueue time: ${isFinite(avgEnqueue) ? avgEnqueue : 0}ms`);
  logWithTimestamp(`🕐 Enqueue window: ${durationMs}ms`);

  // Prepare output folder
  const folder = path.join(__dirname, '..', 'output', 'real-single-test');
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

  // Compute enqueue KPIs for output
  function calcPercentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
  }
  const enqueueTimes = enqueueResults.filter(r => r.success && typeof r.enqueueMs === 'number').map(r => r.enqueueMs as number).sort((a,b)=>a-b);
  const enqueueP50 = calcPercentile(enqueueTimes, 50);
  const enqueueP90 = calcPercentile(enqueueTimes, 90);
  const enqueueP99 = calcPercentile(enqueueTimes, 99);

  // Save enqueue summary with KPIs at top
  const fileEnqueue = path.join(folder, `concurrent-enqueue-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  const enqueueOutput = {
    kpis: {
      totalRequests: total,
      successfulEnqueues: ok,
      failedEnqueues: fail,
      enqueueWindowMs: durationMs,
      enqueueLatencyMs: {
        p50: enqueueP50,
        p90: enqueueP90,
        p99: enqueueP99,
        average: isFinite(avgEnqueue) ? avgEnqueue : 0,
      },
    },
    count,
    durationMs,
    results: enqueueResults,
  };
  fs.writeFileSync(fileEnqueue, JSON.stringify(enqueueOutput, null, 2));
  logWithTimestamp(`💾 Saved enqueue summary: ${fileEnqueue}`);

  // Wait for taskId and completion for each enqueued item
  logWithTimestamp('⏳ Waiting for all requests to complete...');
  const completionPromises: Promise<ConcurrentResult>[] = enqueueResults.map(async (r) => {
    if (!r.success || !r.requestId) return { ...r, success: false, error: r.error || 'enqueue failed' };
    try {
      const taskId = await waitForTaskId(r.requestId);
      const { finalStatus, totalMs, externalTaskId } = await waitForCompletion(taskId, timeoutMs);
      return { ...r, taskId, externalTaskId, finalStatus, totalMs, success: finalStatus === 'completed' };
    } catch (e) {
      return { ...r, success: false, error: (e as Error).message };
    }
  });
  // Progress logger while waiting for completion
  let completedSoFar = 0;
  completionPromises.forEach(p => p.then(() => { completedSoFar++; }).catch(() => { completedSoFar++; }));
  const t0 = Date.now();
  const progressTimer = setInterval(() => {
    const elapsed = Math.round((Date.now() - t0) / 1000);
    logWithTimestamp(`⏳ Progress: ${completedSoFar}/${enqueueResults.length} completed | elapsed ${elapsed}s`);
  }, 3000);

  const completedSettled = await Promise.allSettled(completionPromises);
  clearInterval(progressTimer);
  const completedResults: ConcurrentResult[] = completedSettled.map((r, i) => r.status === 'fulfilled' ? r.value : ({ ...enqueueResults[i], success: false, error: String(r.reason) }));

  const completedOk = completedResults.filter(r => r.success).length;
  const completedFail = completedResults.length - completedOk;
  const avgTotal = Math.round(completedResults.filter(r => typeof r.totalMs === 'number').reduce((s, r) => s + (r.totalMs || 0), 0) / Math.max(1, completedOk));

  // Compute completion KPIs (before writing output)
  const completionTimes = completedResults.filter(r => r.success && typeof r.totalMs === 'number').map(r => r.totalMs as number).sort((a,b)=>a-b);
  const compP50 = calcPercentile(completionTimes, 50);
  const compP90 = calcPercentile(completionTimes, 90);
  const compP95 = calcPercentile(completionTimes, 95);
  const compP99 = calcPercentile(completionTimes, 99);
  const compMin = completionTimes[0] || 0;
  const compMax = completionTimes[completionTimes.length - 1] || 0;

  const timeoutCount = completedResults.filter(r => r.finalStatus === 'timeout').length;
  const failedCount = completedResults.filter(r => r.finalStatus === 'failed').length;
  const totalCount = completedResults.length;
  const successRate = Math.round((completedOk / Math.max(1, totalCount)) * 10000) / 100; // % with 2 decimals
  const errorRate = Math.round(((failedCount + timeoutCount) / Math.max(1, totalCount)) * 10000) / 100;

  // Approx throughput: completed per second during completion wait window
  const completionStart = endAll; // start measuring from after enqueue window
  const completionEnd = Date.now();
  const completionWindowSec = Math.max(1, (completionEnd - completionStart) / 1000);
  const throughputRps = Math.round((completedOk / completionWindowSec) * 100) / 100;

  logWithTimestamp('📊 COMPLETION SUMMARY');
  logWithTimestamp(`✅ Completed: ${completedOk}`);
  logWithTimestamp(`❌ Failed/Timeout: ${completedFail}`);
  logWithTimestamp(`⏱️  Avg total time: ${isFinite(avgTotal) ? avgTotal : 0}ms`);

  const fileComplete = path.join(folder, `concurrent-complete-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  const completionOutput = {
    kpis: {
      totalRequests: totalCount,
      success: completedOk,
      failures: failedCount,
      timeouts: timeoutCount,
      successRatePct: successRate,
      errorRatePct: errorRate,
      throughputCompletedPerSec: throughputRps,
      endToEndLatencyMs: {
        min: compMin,
        p50: compP50,
        p90: compP90,
        p95: compP95,
        p99: compP99,
        max: compMax,
        average: isFinite(avgTotal) ? avgTotal : 0,
      }
    },
    count,
    timeoutMs,
    results: completedResults,
  };
  fs.writeFileSync(fileComplete, JSON.stringify(completionOutput, null, 2));
  logWithTimestamp(`💾 Saved completion summary: ${fileComplete}`);

  // Final terminal KPIs
  logWithTimestamp('============================================================');
  logWithTimestamp('🏁 STRESS TEST KPIs');
  logWithTimestamp('============================================================');
  logWithTimestamp(`📦 Total requests: ${totalCount}`);
  logWithTimestamp(`✅ Success: ${completedOk} (${successRate}%)`);
  logWithTimestamp(`❌ Failures: ${failedCount}`);
  logWithTimestamp(`⏰ Timeouts: ${timeoutCount}`);
  logWithTimestamp(`⚡ Throughput (completed/sec): ${throughputRps}`);
  logWithTimestamp('— Enqueue latency (ms) —');
  logWithTimestamp(`  p50=${enqueueP50}  p90=${enqueueP90}  p99=${enqueueP99}`);
  logWithTimestamp('— End-to-end latency (ms) —');
  logWithTimestamp(`  min=${compMin}  p50=${compP50}  p90=${compP90}  p95=${compP95}  p99=${compP99}  max=${compMax}`);

  // ─────────────────────────────────────────────────────────────────────────────
  // Cleanup: delete created generation requests and users
  // ─────────────────────────────────────────────────────────────────────────────
  async function deleteGenerationRequestsByIds(ids: string[]): Promise<number> {
    const db = admin.firestore();
    let deleted = 0;
    const chunkSize = 450; // keep under 500 writes per batch
    for (let i = 0; i < ids.length; i += chunkSize) {
      const batch = db.batch();
      const slice = ids.slice(i, i + chunkSize);
      slice.forEach((id) => {
        const ref = db.collection(testConfig.testCollection).doc(id);
        batch.delete(ref);
      });
      await batch.commit();
      deleted += slice.length;
      // tiny delay to be nice with emulator
      if (i + chunkSize < ids.length) await sleep(50);
    }
    return deleted;
  }

  async function deleteUsersAndDocs(list: { uid: string }[]): Promise<{ authDeleted: number; userDocsDeleted: number }> {
    let authDeleted = 0;
    let userDocsDeleted = 0;
    const db = admin.firestore();
    // Delete user docs in batches first
    const chunk = 450;
    for (let i = 0; i < list.length; i += chunk) {
      const batch = db.batch();
      const slice = list.slice(i, i + chunk);
      slice.forEach(u => batch.delete(db.collection('users').doc(u.uid)));
      await batch.commit();
      userDocsDeleted += slice.length;
      if (i + chunk < list.length) await sleep(50);
    }
    // Delete auth users individually (API has its own limits)
    for (const u of list) {
      try {
        await admin.auth().deleteUser(u.uid);
        authDeleted++;
      } catch {
        // ignore if not found
      }
      await sleep(10);
    }
    return { authDeleted, userDocsDeleted };
  }

  async function getSongIdsForTasks(taskIds: string[]): Promise<string[]> {
    const db = admin.firestore();
    const songIds: string[] = [];
    for (const taskId of taskIds) {
      const snap = await db.collection('songs').where('taskId', '==', taskId).get();
      snap.docs.forEach(d => songIds.push(d.id));
      await sleep(10);
    }
    return songIds;
  }

  async function deleteTasksAndStatuses(taskIds: string[]): Promise<{ tasksDeleted: number; statusesDeleted: number }> {
    const db = admin.firestore();
    let tasksDeleted = 0;
    let statusesDeleted = 0;
    const chunk = 450;
    for (let i = 0; i < taskIds.length; i += chunk) {
      const slice = taskIds.slice(i, i + chunk);
      const batch = db.batch();
      slice.forEach(id => {
        batch.delete(db.collection('tasks').doc(id));
        batch.delete(db.collection('taskStatuses').doc(id));
      });
      await batch.commit();
      tasksDeleted += slice.length;
      statusesDeleted += slice.length;
      if (i + chunk < taskIds.length) await sleep(50);
    }
    return { tasksDeleted, statusesDeleted };
  }

  async function deleteSongsAndPublic(songIds: string[]): Promise<{ songsDeleted: number; songsPublicDeleted: number }> {
    const db = admin.firestore();
    let songsDeleted = 0;
    let publicDeleted = 0;
    const chunk = 450;
    for (let i = 0; i < songIds.length; i += chunk) {
      const slice = songIds.slice(i, i + chunk);
      const batch = db.batch();
      slice.forEach(id => {
        batch.delete(db.collection('songs').doc(id));
        batch.delete(db.collection('songsPublic').doc(id));
      });
      await batch.commit();
      songsDeleted += slice.length;
      publicDeleted += slice.length;
      if (i + chunk < songIds.length) await sleep(50);
    }
    return { songsDeleted, songsPublicDeleted: publicDeleted };
  }

  async function deleteStatsForUsers(userIds: string[]): Promise<number> {
    const db = admin.firestore();
    const statBuckets = ['numSongsGenerated', 'numDedicationsGiven', 'donationValue'];
    const userIdSet = new Set(userIds);
    let deleted = 0;
    for (const bucket of statBuckets) {
      // Fetch all docs across the collection group and filter by doc.id in-memory
      const q = await db.collectionGroup(bucket).get();
      if (q.empty) continue;
      const toDelete = q.docs.filter(d => userIdSet.has(d.id));
      const chunk = 450;
      for (let i = 0; i < toDelete.length; i += chunk) {
        const batch = db.batch();
        toDelete.slice(i, i + chunk).forEach(d => batch.delete(d.ref));
        await batch.commit();
        deleted += Math.min(chunk, toDelete.length - i);
        if (i + chunk < toDelete.length) await sleep(50);
      }
    }
    return deleted;
  }

  logWithTimestamp('🧹 Starting cleanup (users and generation requests)...');
  const idsToDelete = enqueueResults.filter(r => r.requestId).map(r => r.requestId!) ;
  const reqDeleted = await deleteGenerationRequestsByIds(idsToDelete);
  // Also cleanup tasks/statuses/songs created by these requests
  const taskIds = completedResults.filter(r => r.taskId).map(r => r.taskId!);
  const songIds = await getSongIdsForTasks(taskIds);
  const { tasksDeleted, statusesDeleted } = await deleteTasksAndStatuses(taskIds);
  const { songsDeleted, songsPublicDeleted } = await deleteSongsAndPublic(songIds);
  const statsDeleted = await deleteStatsForUsers(users.map(u => u.uid));
  const { authDeleted, userDocsDeleted } = await deleteUsersAndDocs(users);
  logWithTimestamp(`🧹 Cleanup done: requests=${reqDeleted}, tasks=${tasksDeleted}, statuses=${statusesDeleted}, songs=${songsDeleted}, songsPublic=${songsPublicDeleted}, statsDocs=${statsDeleted}, authUsers=${authDeleted}, userDocs=${userDocsDeleted}`);

  const fileCleanup = path.join(folder, `concurrent-cleanup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(fileCleanup, JSON.stringify({
    requestsDeleted: reqDeleted,
    tasksDeleted,
    taskStatusesDeleted: statusesDeleted,
    songsDeleted,
    songsPublicDeleted,
    statsDocsDeleted: statsDeleted,
    authUsersDeleted: authDeleted,
    userDocsDeleted,
    requestIds: idsToDelete,
    taskIds,
    songIds,
    userIds: users.map(u => u.uid),
  }, null, 2));
  logWithTimestamp(`💾 Saved cleanup summary: ${fileCleanup}`);
}

if (require.main === module) {
  main().catch(err => {
    logWithTimestamp(`💥 Unhandled error: ${err instanceof Error ? err.message : 'Unknown error'}`, 'ERROR');
    process.exit(1);
  });
}


