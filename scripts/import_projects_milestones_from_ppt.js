#!/usr/bin/env node

/*
Create project + milestone records from "Project_Milestones Gantt.pptx" timeline.

Usage:
  cd backend
  node ../scripts/import_projects_milestones_from_ppt.js --env-file .env

Notes:
- Upserts by project name and milestone title (safe to re-run).
- Dates are normalized to year 2025 unless a year is provided in the string.
*/

const fs = require('fs');
const path = require('path');
let mongoose;
try {
  mongoose = require('mongoose');
} catch (_) {
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
  for (const line of content.split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    if (!s.startsWith('MONGO_URI=')) continue;
    return s.slice('MONGO_URI='.length).trim().replace(/^['\"]|['\"]$/g, '');
  }
  return null;
}

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function parseDateLike(input, defaultYear = 2025) {
  if (!input) return null;
  const s = String(input).trim();

  // dd-MMM or dd-MMM-yyyy
  const m1 = s.match(/^(\d{1,2})[-\s]([A-Za-z]{3})(?:[-\s](\d{4}))?$/);
  if (m1) {
    const day = Number(m1[1]);
    const mon = MONTHS[m1[2].toLowerCase()];
    const year = m1[3] ? Number(m1[3]) : defaultYear;
    if (Number.isInteger(mon)) return new Date(Date.UTC(year, mon, day));
  }

  // dd Month yyyy
  const m2 = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (m2) {
    const day = Number(m2[1]);
    const mon = MONTHS[m2[2].slice(0, 3).toLowerCase()];
    const year = Number(m2[3]);
    if (Number.isInteger(mon)) return new Date(Date.UTC(year, mon, day));
  }

  return null;
}

function timelineDate(label, fallbackDayOffset = 0) {
  const parsed = parseDateLike(label, 2025);
  if (parsed) return parsed;
  const base = new Date(Date.UTC(2025, 0, 1));
  base.setUTCDate(base.getUTCDate() + fallbackDayOffset);
  return base;
}

const PROJECT_TIMELINES = [
  {
    name: 'UNIFIED TOLL PAYMENT SYSTEM (Initiation and Planning)',
    description: 'Imported from PPT Gantt slide 1',
    milestones: [
      ['Kickoff Meeting', '14-Sep'],
      ['Finalization of the Modality', '21-Sep'],
      ['Network Connectivity Discussion and Finalization', '21-Sep'],
      ['UI/UX Discussion', '22-Sep'],
      ['Wallet Management and Settlement Process Finalization', '24-Sep'],
      ['Concept Note Finalization and Vetting', '28-Sep'],
      ['BRD Finalization and Approval', '02-Oct'],
      ['UI/UX Finalization and Approval', '02-Oct'],
      ['Preview', '05-Oct'],
    ],
  },
  {
    name: 'UNIFIED TOLL PAYMENT SYSTEM (Execution & Go-Live)',
    description: 'Imported from PPT Gantt slide 2',
    milestones: [
      ['Development Completion', '05-Oct'],
      ['Staging Deployment and Demo', '09-Oct'],
      ['QA', '12-Oct'],
      ['Bug Fix and Re-Test', '14-Oct'],
      ['Application Security Testing', '16-Oct'],
      ['UAT and Approval', '19-Oct'],
      ['Network Connectivity Establishment', '21-Oct'],
      ['MOP and NFA Completion', '23-Oct'],
      ['Production Readiness & Deployment', '26-Oct'],
      ['SOP preparation & Ops handover', '28-Oct'],
      ['Go-Live & UVT', '30-Oct'],
      ['Commercial Launch', '31-Oct'],
    ],
  },
  {
    name: 'BI PORTAL MIGRATION',
    description: 'Imported from PPT Gantt slide 3',
    milestones: [
      ['Demo & Sanity Check on Phase-2', '31-Aug'],
      ['Disbursement & Cashback Report on staging', '02-Sep'],
      ['QC, Bugfix & Re-test', '07-Sep'],
      ['Vulnerability Assessment', '09-Sep'],
      ['Preprod Deployment of Phase-2 Reports', '16-Sep'],
      ['Preprod final UAT on all Reports', '22-Sep'],
      ['Load Testing on Staging server', '08-Oct'],
      ['Market & Stakeholder Communication', '13-Oct'],
      ['Go Live', '16-Oct'],
      ['Operation Handover', '19-Oct'],
    ],
  },
  {
    name: 'MW DC1 BILLERS TO DC2 MIGRATION',
    description: 'Imported from PPT Gantt slide 4',
    milestones: [
      ['Maestro aggregator routed to DC1 Service (10.210.2.82)', '31-Aug'],
      ['Softify aggregator routed to DC1 Service (10.210.2.82)', '09-Sep'],
      ['Over the Internet billers routed to DC1 Service', '16-Sep'],
      ['Tunnel billers routed to DC1 NAT of DC1 Service', '25-Sep'],
      ['ETL verification and migration completion', '15-Oct'],
    ],
  },
  {
    name: 'Reporting DB – Data sync & point to Elastic Search',
    description: 'Imported from PPT Gantt slide 5',
    milestones: [
      ['Data Sync via Curl from 1st August', '01-Aug'],
      ['Manual Data sync Mechanism QA & Approval', '10-Aug'],
      ['Pointer change to Elastic from ADG', '15-Aug'],
      ['Go-Live deployment of Retry Mechanism', '24-Aug'],
      ['Handover to KONALS', '28-Aug'],
    ],
  },
  {
    name: 'Latest Build and Jar Deployment (DFS DB 12c to 19c Upgradation)',
    description: 'Imported from PPT Gantt slide 6',
    milestones: [
      ['DC2 Preprod Apps release', '30-Sep'],
      ['QA on 12c DB', '06-Oct'],
      ['QA on 19c DB', '08-Oct'],
      ['DC1 Production DB Upgradation', '12-Oct'],
      ['DC2 DFS DB Upgrade to 19c', '16-Oct'],
      ['Production Preparation', '23-Oct'],
      ['Sanity Check & Confirmation', '30-Oct'],
      ['Go Live', '01-Nov'],
    ],
  },
  {
    name: 'PRISM DC2 Staging Environment Readiness & Go Live',
    description: 'Imported from PPT Gantt slide 7',
    milestones: [
      ['DC2 Infra Readiness (IT Infrastructure)', '23-Jul'],
      ['Provide overview & define scope for QA testing', '06-Aug'],
      ['Database installation & user creation', '20-Aug'],
      ['Arrange user access', '25-Aug'],
      ['Network connectivity and configuration', '03-Sep'],
      ['QA completion', '10-Sep'],
      ['UAT (QA & SD, Business)', '17-Sep'],
      ['Go-Live planning & approval', '17-Sep'],
      ['Final deployment', '17-Sep'],
    ],
  },
  {
    name: 'Nagad.com.bd Website Migration AWS to DC-2 | Singularity',
    description: 'Imported from PPT Gantt slide 8',
    milestones: [
      ['Requirement (Infra and Application package)', '03-Aug'],
      ['Infrastructure Setup (Stg)', '04-Aug'],
      ['Data & Application Migration Stg', '14-Aug'],
      ['Load Testing', '18-Sep'],
      ['QA completion', '29-Sep'],
      ['UAT (Marketing and Vendor)', '30-Sep'],
      ['PROD Environment Readiness', '05-Oct'],
      ['Sanity and UVT testing in prod environment', '07-Oct'],
      ['Go-Live & Cut-over to new Prod', '12-Oct'],
      ['Security testing at Nagad end & STG access removal', '14-Oct'],
    ],
  },
  {
    name: 'ERP Procurement Project Roadmap',
    description: 'Imported from PPT Gantt slide 9',
    milestones: [
      ['RFI Float to vendor by SCM', '20-Jul-2025'],
      ['Demo Session, Technical & Functional Evaluation', '31-Aug-2025'],
      ['Final SOW, BOQ, SLA finalization by user for RFQ', '16-Sep-2025'],
      ['Commercial Finalization', '22-Sep-2025'],
      ['Project Plan Submission from Vendor', '25-Sep-2025'],
      ['NFM Approval', '07-Oct-2025'],
      ['Vendor Awarding (PO / LOI Issuance)', '15-Oct-2025'],
      ['SOW finalized for HRMS, SCM, FIN & W/H solution', '30-Oct-2025'],
      ['SOW & BOQ approval by STEERCO', '06-Nov-2025'],
      ['Phase wise SOW confirmation (SCM, FIN & W/H)', '10-Nov-2025'],
      ['Implementation planning ready', '17-Nov-2025'],
    ],
  },
];

async function main() {
  const envFile = arg('--env-file', null);
  const mongoUri = arg('--mongo-uri', process.env.MONGO_URI || (envFile ? readMongoUriFromEnvFile(envFile) : null));
  if (!mongoUri) throw new Error('Missing --mongo-uri (or --env-file with MONGO_URI)');

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  const projects = db.collection('projects');
  const milestones = db.collection('milestones');

  let projectUpserts = 0;
  let milestoneUpserts = 0;

  for (const projectDef of PROJECT_TIMELINES) {
    const pDoc = {
      name: projectDef.name,
      description: projectDef.description,
      createdBy: 'ppt-import',
      updatedAt: new Date(),
    };

    await projects.updateOne(
      { name: projectDef.name },
      { $set: pDoc, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    projectUpserts += 1;

    const project = await projects.findOne({ name: projectDef.name });
    if (!project) continue;

    for (let i = 0; i < projectDef.milestones.length; i += 1) {
      const [title, d] = projectDef.milestones[i];
      const start = timelineDate(d, i);
      const end = new Date(start.getTime());

      const mDoc = {
        projectId: project._id,
        title,
        plannedStart: start,
        plannedEnd: end,
        status: 'pending',
        order: i + 1,
        color: '#6b8cff',
        teamName: null,
        responsible: null,
        subtitle: null,
        note: null,
        delayReason: null,
        isDeleted: false,
        updatedAt: new Date(),
      };

      await milestones.updateOne(
        { projectId: project._id, title },
        { $set: mDoc, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
      milestoneUpserts += 1;
    }
  }

  const projectCount = await projects.countDocuments({});
  const milestoneCount = await milestones.countDocuments({ isDeleted: { $ne: true } });

  console.log(
    JSON.stringify(
      {
        projectUpserts,
        milestoneUpserts,
        projectCount,
        milestoneCount,
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err && err.stack ? err.stack : err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
