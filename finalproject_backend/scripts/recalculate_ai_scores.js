require('dotenv').config();
const mongoose = require('mongoose');

const Application = require('../models/Application');
const Job = require('../models/Job');
const { computeResumeScoreDetailed } = require('../lib/resumeScoring');

async function run() {
  const dryRun = process.argv.includes('--dry-run');

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set.');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const jobs = await Job.find({}).lean();
  const jobById = new Map(jobs.map(function(job) {
    return [String(job._id), job];
  }));

  const applications = await Application.find({}).lean();

  let processed = 0;
  let updated = 0;
  let missingJobs = 0;
  let geminiUsed = 0;
  let lexicalOnly = 0;
  const dryRunSamples = [];

  for (const app of applications) {
    processed += 1;
    const job = jobById.get(String(app.job));
    if (!job) {
      missingJobs += 1;
      continue;
    }

    const computed = await computeResumeScoreDetailed(app.resumeText || '', job);
    if (computed.geminiUsed) geminiUsed += 1;
    else lexicalOnly += 1;

    const oldScore = Number(app.aiScore || 0);
    const newScore = Number(computed.score || 0);
    const oldExplanation = String(app.aiExplanation || '');
    const newExplanation = String(computed.aiExplanation || '');
    const oldMatchLevel = String(app.aiMatchLevel || 'unknown');
    const newMatchLevel = String(computed.aiMatchLevel || computed.matchLevel || 'unknown');
    const oldMatched = JSON.stringify(Array.isArray(app.aiMatchedSkills) ? app.aiMatchedSkills : []);
    const newMatched = JSON.stringify(Array.isArray(computed.aiMatchedSkills) ? computed.aiMatchedSkills : []);
    const oldMissing = JSON.stringify(Array.isArray(app.aiMissingSkills) ? app.aiMissingSkills : []);
    const newMissing = JSON.stringify(Array.isArray(computed.aiMissingSkills) ? computed.aiMissingSkills : []);
    const oldRecommendation = String(app.aiRecommendation || '');
    const newRecommendation = String(computed.aiRecommendation || '');
    const explanationChanged =
      oldExplanation !== newExplanation ||
      oldMatchLevel !== newMatchLevel ||
      oldMatched !== newMatched ||
      oldMissing !== newMissing ||
      oldRecommendation !== newRecommendation;

    if (oldScore !== newScore || explanationChanged) {
      updated += 1;
    }

    if (!dryRun && (oldScore !== newScore || explanationChanged)) {
      await Application.updateOne(
        { _id: app._id },
        {
          $set: {
            aiScore: newScore,
            aiExplanation: computed.aiExplanation || '',
            aiMatchLevel: computed.aiMatchLevel || computed.matchLevel || 'unknown',
            aiMatchedSkills: Array.isArray(computed.aiMatchedSkills) ? computed.aiMatchedSkills : [],
            aiMissingSkills: Array.isArray(computed.aiMissingSkills) ? computed.aiMissingSkills : [],
            aiRecommendation: computed.aiRecommendation || ''
          }
        }
      );
    }

    if (dryRun && dryRunSamples.length < 12) {
      dryRunSamples.push({
        applicationId: String(app._id),
        jobId: String(app.job),
        oldScore: oldScore,
        newScore: newScore,
        changed: oldScore !== newScore || explanationChanged,
        geminiUsed: computed.geminiUsed,
        matchLevel: computed.matchLevel,
        reason: computed.reason,
        recommendation: computed.aiRecommendation || ''
      });
    }
  }

  if (dryRun && dryRunSamples.length > 0) {
    console.log('--- Dry-run scoring samples (old vs new) ---');
    dryRunSamples.forEach(function(sample, index) {
      console.log(
        [
          `${index + 1}. app=${sample.applicationId}`,
          `job=${sample.jobId}`,
          `old=${sample.oldScore}`,
          `new=${sample.newScore}`,
          `changed=${sample.changed}`,
          `gemini=${sample.geminiUsed}`,
          `level=${sample.matchLevel}`,
          `reason=${sample.reason || 'n/a'}`,
          `recommendation=${sample.recommendation || 'n/a'}`
        ].join(' | ')
      );
    });
    console.log('--- End dry-run samples ---');
  }

  console.log(JSON.stringify({
    dryRun: dryRun,
    processed: processed,
    updated: updated,
    missingJobs: missingJobs,
    geminiUsed: geminiUsed,
    lexicalOnly: lexicalOnly
  }, null, 2));

  await mongoose.disconnect();
}

run().catch(async function(err) {
  console.error('recalculate_ai_scores failed:', err.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors
  }
  process.exit(1);
});
