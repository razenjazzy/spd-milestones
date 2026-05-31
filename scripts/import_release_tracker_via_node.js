#!/usr/bin/env node

/*
Import normalized Excel payload into MongoDB without mongosh.

Usage:
  node scripts/import_release_tracker_via_node.js \
    --mongo-uri "<MONGO_URI>" \
    --data scripts/generated/import_release_tracker.data.json
*/

const fs = require('fs');
const path = require('path');
let mongoose;
try {
  mongoose = require('mongoose');
} catch (_) {
  // Fallback for monorepo layout where this script is outside backend package.
  mongoose = require(path.resolve(process.cwd(), 'node_modules/mongoose'));
}

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  if (i >= 0 && i + 1 < process.argv.length) return process.argv[i + 1];
  return fallback;
}

function readMongoUriFromEnvFile(envFilePath) {
  const abs = path.resolve(envFilePath);
  if (!fs.existsSync(abs)) return null;
  const content = fs.readFileSync(abs, 'utf8');
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (!trimmed.startsWith('MONGO_URI=')) continue;
    const raw = trimmed.slice('MONGO_URI='.length).trim();
    return raw.replace(/^['\"]|['\"]$/g, '');
  }
  return null;
}

function cleanText(v) {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function normalizeRaw(v) {
  const s = cleanText(v);
  if (!s || s === '???' || s.toLowerCase() === 'n/a' || s.toLowerCase() === 'na' || s.toLowerCase() === 'open') {
    return null;
  }
  return v;
}

function excelSerialToDate(serial) {
  const v = normalizeRaw(serial);
  if (v === null) return null;
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  const ms = Math.round((n - 25569) * 86400 * 1000);
  return new Date(ms);
}

function excelTimeFractionToHHMM(fraction) {
  const v = normalizeRaw(fraction);
  if (v === null) return null;
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  const totalMinutes = Math.round(n * 24 * 60);
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const mm = String(totalMinutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

function mapReleaseStatus(v) {
  const s = cleanText(v).toLowerCase();
  if (s.includes('prod') || s.includes('live')) return 'production';
  if (s.includes('stag')) return 'staging';
  if (s.includes('over')) return 'overwritten';
  if (s.includes('halt')) return 'halted';
  if (s.includes('dc2')) return 'dc2';
  return 'staging';
}

function mapReleaseType(v) {
  const s = cleanText(v).toLowerCase();
  if (s.includes('financial')) return 'financial-glitch-hotfix';
  if (s.includes('new feature') || s.includes('changes')) return 'new-feature-changes';
  if (s.includes('security')) return 'security-fix';
  if (s.includes('system enhancement')) return 'system-enhancement';
  if (s.includes('mobile')) return 'mobile-app-glitch';
  if (s.includes('application glitch')) return 'application-glitch';
  return 'application-glitch';
}

function mapActivityType(v) {
  const s = cleanText(v).toLowerCase();
  if (s.includes('release')) return 'release';
  if (s.includes('maintenance')) return 'maintenance';
  if (s.includes('security')) return 'security';
  if (s.includes('fix')) return 'hotfix';
  return 'maintenance';
}

function mapActivityEnvironment(v) {
  const s = cleanText(v).toLowerCase();
  if (s.includes('live') || s.includes('prod')) return 'production';
  return 'staging';
}

function mapActivityStatus(v) {
  const s = cleanText(v).toLowerCase();
  if (s === 'closed' || s === 'completed' || s === 'done') return 'completed';
  if (s === 'open' || s === 'planned') return 'planned';
  if (s.includes('progress')) return 'in-progress';
  if (s.includes('reject')) return 'rejected';
  if (s.includes('reopen')) return 'reopened';
  return 'planned';
}

async function main() {
  const envFile = arg('--env-file', null);
  const mongoUri = arg('--mongo-uri', process.env.MONGO_URI || (envFile ? readMongoUriFromEnvFile(envFile) : null));
  const dataPath = arg('--data', 'scripts/generated/import_release_tracker.data.json');

  if (!mongoUri) {
    throw new Error('Missing --mongo-uri (or MONGO_URI env var, or --env-file with MONGO_URI)');
  }

  const absDataPath = path.resolve(dataPath);
  if (!fs.existsSync(absDataPath)) {
    throw new Error(`Data file not found: ${absDataPath}`);
  }

  const payload = JSON.parse(fs.readFileSync(absDataPath, 'utf8'));
  const releaseRows = payload.releaseRows || [];
  const activityRows = payload.activityRows || [];
  const securityRows = payload.securityRows || [];

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;

  const projects = db.collection('projects');
  const releases = db.collection('releases');
  const activities = db.collection('activities');

  const projectName = 'Nagad Release Tracker';
  let project = await projects.findOne({ name: projectName });
  if (!project) {
    const inserted = await projects.insertOne({
      name: projectName,
      description: 'Imported from Release Tracker Excel',
      createdBy: 'excel-import',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    project = await projects.findOne({ _id: inserted.insertedId });
  }

  let releaseUpserts = 0;
  for (const r of releaseRows) {
    const releasePackage = cleanText(r.releasePackage);
    if (!releasePackage) continue;

    const doc = {
      projectId: project._id,
      releasePackage,
      status: mapReleaseStatus(r.statusRaw),
      type: mapReleaseType(r.typeRaw),
      received: excelSerialToDate(r.receivedRaw),
      staging: excelSerialToDate(r.stagingRaw),
      live: excelSerialToDate(r.liveRaw),
      downloadLink: normalizeRaw(r.downloadLink),
      downloadPassword: normalizeRaw(r.downloadPassword),
      components: normalizeRaw(r.components),
      dbScripts: normalizeRaw(r.dbScripts),
      comments: normalizeRaw(r.comments),
      pipelineStage: 'standalone',
      isDeleted: false,
      updatedAt: new Date(),
    };

    await releases.updateOne(
      { projectId: project._id, releasePackage },
      { $set: doc, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    releaseUpserts += 1;
  }

  let activityUpserts = 0;
  for (const a of activityRows) {
    const title = cleanText(a.title);
    const date = excelSerialToDate(a.dateRaw);
    if (!title || !date) continue;

    const doc = {
      projectId: project._id,
      scope: 'project',
      title,
      date,
      type: mapActivityType(a.fixRaw),
      environment: mapActivityEnvironment(a.platformRaw),
      status: 'planned',
      startTime: excelTimeFractionToHHMM(a.startRaw),
      endTime: excelTimeFractionToHHMM(a.endRaw),
      duration: normalizeRaw(a.durationRaw) ? String(a.durationRaw) : null,
      comments: normalizeRaw(a.comments),
      isDeleted: false,
      updatedAt: new Date(),
    };

    await activities.updateOne(
      { projectId: project._id, title, date },
      { $set: doc, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    activityUpserts += 1;
  }

  let securityUpserts = 0;
  for (const s of securityRows) {
    const title = cleanText(s.title);
    const date = excelSerialToDate(s.dateRaw) || new Date();
    if (!title) continue;

    const comments = [normalizeRaw(s.comments), normalizeRaw(s.api)].filter(Boolean).join(' | API: ') || null;

    const doc = {
      projectId: project._id,
      scope: 'project',
      title,
      date,
      type: 'security',
      environment: 'production',
      status: mapActivityStatus(s.statusRaw),
      comments,
      isDeleted: false,
      updatedAt: new Date(),
    };

    await activities.updateOne(
      { projectId: project._id, title, date },
      { $set: doc, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    securityUpserts += 1;
  }

  console.log(JSON.stringify({
    projectId: String(project._id),
    releaseRowsProcessed: releaseRows.length,
    activityRowsProcessed: activityRows.length,
    securityRowsProcessed: securityRows.length,
    releaseUpserts,
    activityUpserts,
    securityUpserts,
  }, null, 2));

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err && err.stack ? err.stack : err);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
