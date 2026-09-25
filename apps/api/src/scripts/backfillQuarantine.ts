import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { Candidate } from "../models/Candidate.js";
import { quarantineCandidate, quarantineReasonFor } from "../services/quarantine.service.js";

async function run() {
  await connectDatabase();
  const apply = process.argv.includes("--apply");
  let found = 0;
  let migrated = 0;
  const candidates = Candidate.find({
    $or: [
      { "analysis.securityStatus": { $in: ["prompt_injection_detected", "not_a_cv", "needs_review"] } },
      { "analysis.isValidCV": false },
    ],
  }).cursor();
  for await (const candidate of candidates) {
    const reason = quarantineReasonFor(candidate.analysis ?? {});
    const requestId = candidate.analysis?.requestId;
    if (!reason || !requestId) {
      console.warn(`Skipped candidate ${candidate._id}: missing reason or requestId`);
      continue;
    }
    found += 1;
    if (!apply) continue;
    await quarantineCandidate(requestId, reason, candidate.analysis?.securityFlags ?? [], candidate.analysis?.error ?? undefined);
    migrated += 1;
  }
  console.log(apply ? `Migrated ${migrated} of ${found} flagged candidates` : `Dry run: ${found} flagged candidates. Rerun with --apply to migrate.`);
  await mongoose.disconnect();
}

run().catch(async (error) => { console.error(error); await mongoose.disconnect(); process.exitCode = 1; });
