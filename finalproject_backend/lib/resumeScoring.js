const fetch = require('node-fetch');

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Recruiter-driven weighting model.
const SCORE_WEIGHTS = {
  requiredSkills: 45,
  stackAlignment: 20,
  experienceProjects: 15,
  education: 10,
  resumeQuality: 10
};

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'while', 'with', 'without', 'to', 'of', 'in', 'on', 'for', 'at', 'by', 'from',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'as', 'it', 'this', 'that', 'these', 'those', 'you', 'your', 'we', 'our', 'they', 'their',
  'i', 'me', 'my', 'he', 'she', 'his', 'her', 'them', 'us', 'can', 'could', 'should', 'would', 'will', 'may', 'might', 'must', 'do', 'does', 'did',
  'required', 'preferred', 'plus', 'etc'
]);

const SKILL_ALIASES = {
  node: ['node', 'nodejs', 'node.js'],
  express: ['express', 'express.js'],
  python: ['python'],
  django: ['django'],
  flask: ['flask'],
  fastapi: ['fastapi'],
  react: ['react', 'reactjs'],
  nextjs: ['next', 'nextjs', 'next.js'],
  vue: ['vue', 'vuejs', 'vue.js'],
  javascript: ['javascript', 'js'],
  typescript: ['typescript', 'ts'],
  postgresql: ['postgresql', 'postgres', 'postgre sql', 'postre sql'],
  mysql: ['mysql'],
  mongodb: ['mongodb', 'mongo', 'mongo db'],
  sqlite: ['sqlite'],
  database: ['database', 'db', 'rdbms', 'sql', 'nosql'],
  rest_api: ['api', 'apis', 'rest', 'restful', 'rest api'],
  backend: ['backend', 'server', 'controller', 'authentication', 'auth'],
  frontend: ['frontend', 'ui', 'ux', 'client side'],
  fullstack: ['fullstack', 'full stack'],
  ai_ml: ['ai', 'machine learning', 'ml', 'llm', 'nlp'],
  dashboard: ['dashboard', 'analytics panel'],
  deployed: ['deployed', 'deployment', 'production', 'live app', 'hosted']
};

const RELATED_DEGREE_TERMS = [
  'computer science',
  'software engineering',
  'information technology',
  'software development',
  'computer engineering',
  'information systems',
  'it'
];

const STRONG_BACKEND_TERMS = [
  'backend',
  'api',
  'controller',
  'authentication',
  'database',
  'node',
  'express',
  'fastapi',
  'django',
  'flask',
  'laravel'
];

const MODERN_FRONTEND_TERMS = ['react', 'nextjs', 'vue'];
const PYTHON_BACKEND_TERMS = ['python', 'fastapi', 'django', 'flask'];

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeText(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9+.#\s/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(str) {
  return normalizeText(str)
    .split(' ')
    .filter(Boolean)
    .filter(function(token) {
      return token.length > 1 && !STOP_WORDS.has(token);
    });
}

function containsPhrase(normalizedText, phrase) {
  const normalizedPhrase = normalizeText(phrase);
  if (!normalizedPhrase) return false;
  const paddedText = ` ${normalizedText} `;
  const paddedPhrase = ` ${normalizedPhrase} `;
  return paddedText.includes(paddedPhrase);
}

function detectCanonicalSkills(text) {
  const normalized = normalizeText(text);
  const detected = new Set();
  Object.keys(SKILL_ALIASES).forEach(function(canonical) {
    const aliases = SKILL_ALIASES[canonical];
    const found = aliases.some(function(alias) {
      return containsPhrase(normalized, alias);
    });
    if (found) {
      detected.add(canonical);
    }
  });
  return detected;
}

function mapPhraseToCanonical(phrase) {
  const normalizedPhrase = normalizeText(phrase);
  if (!normalizedPhrase) return '';
  for (const canonical of Object.keys(SKILL_ALIASES)) {
    const aliases = SKILL_ALIASES[canonical];
    if (aliases.some(function(alias) { return normalizedPhrase.includes(normalizeText(alias)); })) {
      return canonical;
    }
  }
  return normalizedPhrase;
}

function getJobText(job) {
  return [
    job && job.title,
    job && job.description,
    job && Array.isArray(job.skills) ? job.skills.join(' ') : '',
    job && job.company,
    job && job.location
  ].filter(Boolean).join('\n');
}

function inferRoleFlags(jobText, jobTitle) {
  const combined = normalizeText(`${jobTitle || ''} ${jobText || ''}`);
  const seniorityYearsMatch = combined.match(/(\d{1,2})\+?\s*(?:years?|yrs?)/i);
  const minYears = seniorityYearsMatch ? Number(seniorityYearsMatch[1]) : 0;

  const isEntryLevel = /fresh graduate|freshgrad|entry level|junior|new grad|graduate trainee|internship|intern\b/.test(combined);
  const isSeniorRole = /senior|lead|principal|staff|architect/.test(combined) || minYears >= 4;
  return {
    isEntryLevel,
    isSeniorRole,
    minYears
  };
}

function extractYearsFromResume(resumeText) {
  const normalized = normalizeText(resumeText);
  const matches = normalized.match(/(\d{1,2})\+?\s*(?:years?|yrs?)\s*(?:of)?\s*experience/g) || [];
  const values = matches.map(function(entry) {
    const m = entry.match(/(\d{1,2})/);
    return m ? Number(m[1]) : 0;
  }).filter(Boolean);
  return values.length > 0 ? Math.max.apply(null, values) : 0;
}

function buildJobRequirements(job, jobText, canonicalJobSkills) {
  const requirements = [];
  const normalizedJobText = normalizeText(jobText);

  (Array.isArray(job && job.skills) ? job.skills : []).forEach(function(skill) {
    const canonical = mapPhraseToCanonical(skill);
    if (canonical) {
      requirements.push({
        id: `skill:${canonical}`,
        label: skill,
        canonicalTokens: [canonical],
        strict: true
      });
    }
  });

  // Broad requirement mapping.
  if (containsPhrase(normalizedJobText, 'python backend framework')) {
    requirements.push({
      id: 'broad:python_backend',
      label: 'Python backend framework',
      canonicalTokens: PYTHON_BACKEND_TERMS,
      strict: false
    });
  }

  if (containsPhrase(normalizedJobText, 'modern web framework')) {
    requirements.push({
      id: 'broad:modern_frontend',
      label: 'Modern web framework',
      canonicalTokens: MODERN_FRONTEND_TERMS,
      strict: false
    });
  }

  if (containsPhrase(normalizedJobText, 'strong backend foundation') || containsPhrase(normalizedJobText, 'backend foundation')) {
    requirements.push({
      id: 'broad:backend_foundation',
      label: 'Strong backend foundation',
      canonicalTokens: STRONG_BACKEND_TERMS,
      strict: false
    });
  }

  if (containsPhrase(normalizedJobText, 'computer science related degree') || containsPhrase(normalizedJobText, 'related degree')) {
    requirements.push({
      id: 'broad:cs_degree',
      label: 'Computer science related degree',
      canonicalTokens: ['degree_related'],
      strict: false
    });
  }

  // Auto-add prominent inferred core requirements if explicit skills are sparse.
  if (requirements.length < 3) {
    ['node', 'python', 'react', 'nextjs', 'vue', 'rest_api', 'database', 'postgresql', 'typescript', 'javascript']
      .forEach(function(core) {
        if (canonicalJobSkills.has(core)) {
          requirements.push({
            id: `inferred:${core}`,
            label: core.replace('_', ' '),
            canonicalTokens: [core],
            strict: false
          });
        }
      });
  }

  const unique = new Map();
  requirements.forEach(function(req) {
    if (!unique.has(req.id)) {
      unique.set(req.id, req);
    }
  });

  return Array.from(unique.values()).slice(0, 10);
}

function evaluateRequiredSkills(requirements, resumeSkills, resumeText) {
  if (requirements.length === 0) {
    return {
      score: 70,
      matchedRequirements: [],
      missingRequirements: []
    };
  }

  const normalizedResume = normalizeText(resumeText);
  let matchedWeight = 0;
  let totalWeight = 0;
  const matchedRequirements = [];
  const missingRequirements = [];

  requirements.forEach(function(req) {
    const isBroad = req.id.startsWith('broad:');
    const weight = req.strict ? 1.15 : (isBroad ? 0.9 : 1);
    totalWeight += weight;

    let matched = false;
    if (req.id === 'broad:cs_degree') {
      matched = RELATED_DEGREE_TERMS.some(function(term) { return containsPhrase(normalizedResume, term); });
    } else {
      matched = req.canonicalTokens.some(function(token) {
        return resumeSkills.has(token) || containsPhrase(normalizedResume, token.replace('_', ' '));
      });
    }

    if (matched) {
      matchedWeight += weight;
      matchedRequirements.push(req.label);
    } else {
      missingRequirements.push(req.label);
    }
  });

  const coverage = totalWeight > 0 ? matchedWeight / totalWeight : 0;
  // Gentle curve: avoid punishing strong candidates too hard for one missing requirement.
  const curvedCoverage = Math.pow(coverage, 0.78);
  return {
    score: Math.round(clampNumber(curvedCoverage * 100, 0, 100)),
    matchedRequirements,
    missingRequirements,
    coverage
  };
}

function evaluateStackAlignment(jobSkills, resumeSkills, jobText, resumeText) {
  const normalizedJob = normalizeText(jobText);
  const normalizedResume = normalizeText(resumeText);
  const stacks = [
    { key: 'backend', expects: STRONG_BACKEND_TERMS, resume: ['backend', 'node', 'express', 'python', 'fastapi', 'django', 'flask', 'rest_api', 'database'] },
    { key: 'frontend', expects: ['frontend', 'react', 'nextjs', 'vue', 'javascript', 'typescript'], resume: ['frontend', 'react', 'nextjs', 'vue', 'javascript', 'typescript'] },
    { key: 'database', expects: ['database', 'postgresql', 'mysql', 'mongodb', 'sqlite'], resume: ['database', 'postgresql', 'mysql', 'mongodb', 'sqlite'] },
    { key: 'api', expects: ['rest_api', 'api'], resume: ['rest_api', 'backend', 'node', 'express', 'fastapi', 'django', 'flask'] }
  ];

  const expectedStacks = stacks.filter(function(stack) {
    return stack.expects.some(function(token) {
      return jobSkills.has(token) || containsPhrase(normalizedJob, token.replace('_', ' '));
    });
  });

  if (expectedStacks.length === 0) {
    return { score: 68, matched: [], missing: [] };
  }

  const matched = [];
  const missing = [];
  expectedStacks.forEach(function(stack) {
    const hasStack = stack.resume.some(function(token) {
      return resumeSkills.has(token) || containsPhrase(normalizedResume, token.replace('_', ' '));
    });
    if (hasStack) matched.push(stack.key);
    else missing.push(stack.key);
  });

  const ratio = matched.length / expectedStacks.length;
  return {
    score: Math.round(clampNumber(Math.pow(ratio, 0.82) * 100, 0, 100)),
    matched,
    missing
  };
}

function evaluateExperienceAndProjects(resumeText, flags, resumeSkills, jobText) {
  const normalizedResume = normalizeText(resumeText);
  const projectSignals = [
    'project', 'capstone', 'freelance', 'intern', 'internship', 'fullstack', 'full stack',
    'rest api', 'dashboard', 'authentication', 'database', 'deployed', 'production'
  ];
  const positiveSignals = projectSignals.filter(function(signal) {
    return containsPhrase(normalizedResume, signal);
  });
  const years = extractYearsFromResume(normalizedResume);
  const hasWork = /experience|worked|employment|freelance|internship|intern/.test(normalizedResume);

  const relevantSignals = positiveSignals.length;
  const baseSignalScore = clampNumber(35 + (relevantSignals * 8), 0, 92);

  let experienceFit = 0;
  if (flags.isEntryLevel) {
    if (years >= 1 || hasWork || relevantSignals >= 2) experienceFit = 90;
    else if (relevantSignals >= 1) experienceFit = 78;
    else experienceFit = 65;
  } else if (flags.isSeniorRole) {
    if (years >= Math.max(4, flags.minYears)) experienceFit = 92;
    else if (years >= Math.max(2, flags.minYears - 2)) experienceFit = 70;
    else if (relevantSignals >= 3) experienceFit = 58;
    else experienceFit = 40;
  } else {
    if (years >= Math.max(2, flags.minYears)) experienceFit = 86;
    else if (years >= 1 || relevantSignals >= 2) experienceFit = 72;
    else experienceFit = 55;
  }

  // Reward AI/ML only when job hints it is relevant.
  if (/ai|machine learning|ml|nlp|data/.test(normalizeText(jobText)) && resumeSkills.has('ai_ml')) {
    experienceFit += 6;
  }

  const score = Math.round(clampNumber((experienceFit * 0.7) + (baseSignalScore * 0.3), 0, 100));
  return {
    score,
    years,
    signals: positiveSignals
  };
}

function evaluateEducation(jobText, resumeText) {
  const normalizedJob = normalizeText(jobText);
  const normalizedResume = normalizeText(resumeText);
  const jobMentionsDegree = /degree|bachelor|master|phd|computer science|software engineering|information technology|it\b/.test(normalizedJob);

  const matchedRelatedDegree = RELATED_DEGREE_TERMS.some(function(term) {
    return containsPhrase(normalizedResume, term);
  });
  const hasAnyDegree = /bachelor|master|phd|degree|diploma/.test(normalizedResume);

  if (!jobMentionsDegree) {
    return { score: hasAnyDegree ? 78 : 65, matched: hasAnyDegree };
  }
  if (matchedRelatedDegree) {
    return { score: 92, matched: true };
  }
  if (hasAnyDegree) {
    return { score: 70, matched: true };
  }
  return { score: 45, matched: false };
}

function evaluateResumeQuality(resumeText) {
  const normalized = normalizeText(resumeText);
  const tokenCount = tokenize(normalized).length;
  const hasStructure = /(experience|education|project|skill|summary|profile)/.test(normalized);
  const hasActionSignals = /(built|developed|implemented|designed|led|improved|optimized|deployed)/.test(normalized);

  let score = 45;
  if (tokenCount >= 120) score += 20;
  if (tokenCount >= 240) score += 10;
  if (tokenCount >= 500) score -= 8;
  if (hasStructure) score += 12;
  if (hasActionSignals) score += 10;

  return {
    score: Math.round(clampNumber(score, 0, 100)),
    tokenCount
  };
}

function getMatchLevel(score) {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'strong';
  if (score >= 65) return 'good';
  if (score >= 45) return 'partial';
  return 'weak';
}

function formatMatchLevelLabel(level) {
  switch (String(level || '').toLowerCase()) {
    case 'excellent': return 'Excellent';
    case 'strong': return 'Strong';
    case 'good': return 'Good';
    case 'partial': return 'Partial';
    default: return 'Weak';
  }
}

function summarizeReason(result) {
  const matchedPreview = result.matchedRequirements.slice(0, 4);
  const missingPreview = result.missingRequirements.slice(0, 3);

  const lead = matchedPreview.length > 0
    ? `Matched ${matchedPreview.join(', ')}.`
    : 'No strong requirement matches were detected.';

  const gap = missingPreview.length > 0
    ? ` Missing or weak evidence for ${missingPreview.join(', ')}.`
    : '';

  return `${lead}${gap}`.trim();
}

function cleanListItems(list, limit) {
  if (!Array.isArray(list)) return [];
  return Array.from(new Set(list.map(String).map(function(item) {
    return item.trim();
  }).filter(Boolean))).slice(0, limit || 10);
}

function parseGeminiExplanationResult(rawText) {
  const cleaned = String(rawText || '').replace(/```json|```/gi, '').trim();
  let parsed = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }

  const summary = parsed && typeof parsed.summary === 'string' ? parsed.summary.trim() : '';
  const recommendation = parsed && typeof parsed.recommendation === 'string' ? parsed.recommendation.trim() : '';
  const normalizedLevel = parsed && typeof parsed.matchLevel === 'string'
    ? normalizeText(parsed.matchLevel).replace(/\s+/g, '')
    : '';

  if (!summary) return null;

  const aiMatchLevel = ['excellent', 'strong', 'good', 'partial', 'weak'].includes(normalizedLevel)
    ? normalizedLevel
    : 'good';

  return {
    aiMatchLevel,
    aiExplanation: summary,
    aiMatchedSkills: cleanListItems(parsed.matchedSkills, 10),
    aiMissingSkills: cleanListItems(parsed.missingSkills, 10),
    aiRecommendation: recommendation
  };
}

function buildFallbackAiAssessment(finalResult, lexical, resumeText) {
  const matched = cleanListItems(finalResult.matchedRequirements || lexical.matchedRequirements, 8);
  const missing = cleanListItems(finalResult.missingRequirements || lexical.missingRequirements, 6);
  const signals = (lexical && lexical.breakdown && lexical.breakdown.signals) ? lexical.breakdown.signals : [];
  const levelLabel = formatMatchLevelLabel(finalResult.matchLevel);

  const matchedText = matched.length > 0
    ? `Matched skills and requirements include ${matched.join(', ')}.`
    : 'The resume shows limited explicit keyword overlap with the listed core requirements.';

  const signalText = signals.length > 0
    ? `Relevant practical signals include ${signals.slice(0, 5).join(', ')}.`
    : 'Project and work signals are present but should be discussed further in screening.';

  const missingText = missing.length > 0
    ? `Missing or unclear requirements: ${missing.join(', ')}.`
    : 'No major requirement gaps were detected from the available resume text.';

  let recommendation = 'Proceed with a short technical screening to validate depth.';
  if (finalResult.matchLevel === 'excellent' || finalResult.matchLevel === 'strong') {
    recommendation = 'Shortlist for technical interview.';
  } else if (finalResult.matchLevel === 'good') {
    recommendation = 'Consider shortlist and verify missing areas during interview.';
  } else if (finalResult.matchLevel === 'partial') {
    recommendation = 'Keep as a backup candidate unless role flexibility is high.';
  } else if (finalResult.matchLevel === 'weak') {
    recommendation = 'Do not prioritize unless the candidate pool is limited.';
  }

  const summary = `${levelLabel} Match for this role.\n\n${matchedText} ${signalText}\n\n${missingText}\n\nRecommended next step: ${recommendation}`;

  return {
    aiMatchLevel: finalResult.matchLevel || 'unknown',
    aiExplanation: summary.trim(),
    aiMatchedSkills: matched,
    aiMissingSkills: missing,
    aiRecommendation: recommendation
  };
}

async function computeGeminiExplanationDetailed(resumeText, job, finalResult, lexical, options) {
  if (!GEMINI_API_KEY || !resumeText || !job) {
    return null;
  }

  const requirements = Array.isArray(job.skills) ? job.skills : [];
  const prompt = [
    'You are an expert technical recruiter.',
    '',
    'Analyze the candidate resume against the job posting.',
    '',
    'Write a concise professional recruiter explanation (120-220 words max).',
    '',
    'Focus on:',
    '- relevant matching skills',
    '- project/work experience relevance',
    '- strengths',
    '- missing skills or unclear areas',
    '- hiring recommendation',
    '',
    'Tone:',
    'Professional, objective, concise.',
    '',
    'Do NOT mention that you are AI.',
    '',
    'Return ONLY JSON:',
    '{',
    '  "matchLevel": "Excellent | Strong | Good | Partial | Weak",',
    '  "summary": "...",',
    '  "matchedSkills": ["..."],',
    '  "missingSkills": ["..."],',
    '  "recommendation": "..."',
    '}',
    '',
    `JOB TITLE: ${job.title || ''}`,
    `JOB DESCRIPTION: ${job.description || ''}`,
    `JOB REQUIREMENTS: ${requirements.join(' | ')}`,
    `AI SCORE: ${finalResult.score}`,
    `MATCH LEVEL: ${formatMatchLevelLabel(finalResult.matchLevel)}`,
    `MATCHED REQUIREMENTS: ${(finalResult.matchedRequirements || []).join(', ')}`,
    `MISSING REQUIREMENTS: ${(finalResult.missingRequirements || []).join(', ')}`,
    `EXTRACTED PROJECT/EXPERIENCE SIGNALS: ${((lexical.breakdown && lexical.breakdown.signals) || []).join(', ')}`,
    '',
    `RESUME TEXT: ${String(resumeText || '').slice(0, 12000)}`
  ].join('\n');

  const models = [];
  [
    options && options.model ? options.model : DEFAULT_GEMINI_MODEL,
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash'
  ].forEach(function(model) {
    if (model && !models.includes(model)) {
      models.push(model);
    }
  });

  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationConfig: {
            temperature: 0.2,
            topP: 0.85,
            maxOutputTokens: 380
          },
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!resp.ok) {
        continue;
      }

      const data = await resp.json();
      const text = (((data || {}).candidates || [])[0] || {}).content;
      const raw = (((text || {}).parts || [])[0] || {}).text || '';
      const parsed = parseGeminiExplanationResult(raw);
      if (parsed) {
        return parsed;
      }
    } catch {
      // Try next fallback model.
    }
  }

  return null;
}

function computeLexicalResumeScoreDetailed(resumeText, job) {
  if (!job) {
    return {
      score: 0,
      matchLevel: 'weak',
      matchedRequirements: [],
      missingRequirements: ['Job details unavailable'],
      reason: 'Job details unavailable.',
      breakdown: {
        weights: SCORE_WEIGHTS
      }
    };
  }

  const cleanResumeText = normalizeText(resumeText);
  if (!cleanResumeText) {
    return {
      score: 18,
      matchLevel: 'weak',
      matchedRequirements: [],
      missingRequirements: ['Resume text unavailable'],
      reason: 'Resume text is empty after extraction.',
      breakdown: {
        weights: SCORE_WEIGHTS
      }
    };
  }

  const jobText = getJobText(job);
  const roleFlags = inferRoleFlags(jobText, job.title || '');
  const canonicalJobSkills = detectCanonicalSkills(jobText);
  const canonicalResumeSkills = detectCanonicalSkills(cleanResumeText);
  const requirements = buildJobRequirements(job, jobText, canonicalJobSkills);

  const required = evaluateRequiredSkills(requirements, canonicalResumeSkills, cleanResumeText);
  const stack = evaluateStackAlignment(canonicalJobSkills, canonicalResumeSkills, jobText, cleanResumeText);
  const expProj = evaluateExperienceAndProjects(cleanResumeText, roleFlags, canonicalResumeSkills, jobText);
  const education = evaluateEducation(jobText, cleanResumeText);
  const quality = evaluateResumeQuality(cleanResumeText);

  const weightedScore =
    (required.score * SCORE_WEIGHTS.requiredSkills / 100) +
    (stack.score * SCORE_WEIGHTS.stackAlignment / 100) +
    (expProj.score * SCORE_WEIGHTS.experienceProjects / 100) +
    (education.score * SCORE_WEIGHTS.education / 100) +
    (quality.score * SCORE_WEIGHTS.resumeQuality / 100);

  let bonus = 0;
  if (canonicalResumeSkills.has('fullstack')) bonus += 2;
  if (canonicalResumeSkills.has('rest_api')) bonus += 2;
  if (canonicalResumeSkills.has('dashboard')) bonus += 1;
  if (canonicalResumeSkills.has('deployed')) bonus += 2;

  let penalty = 0;
  // Light penalty for individual misses.
  if (required.missingRequirements.length > 0) {
    penalty += Math.min(6, required.missingRequirements.length * 1.8);
  }
  // PostgreSQL-only miss should be moderate if candidate has other DB evidence.
  const missingPostgres = required.missingRequirements.some(function(item) {
    return normalizeText(item).includes('postgres');
  });
  const hasOtherDatabase = canonicalResumeSkills.has('database') || canonicalResumeSkills.has('mysql') || canonicalResumeSkills.has('mongodb') || canonicalResumeSkills.has('sqlite');
  if (missingPostgres && hasOtherDatabase) {
    penalty = Math.max(0, penalty - 2.5);
  }

  let score = Math.round(clampNumber(weightedScore + bonus - penalty, 0, 100));

  // Recruiter-like calibration floors.
  if (required.coverage >= 1 && stack.score >= 75) {
    score = Math.max(score, 86);
  } else if (required.coverage >= 0.75) {
    score = Math.max(score, 70);
  } else if (required.coverage >= 0.5) {
    score = Math.max(score, 55);
  } else if (required.coverage >= 0.35) {
    score = Math.max(score, 45);
  }

  const result = {
    score: clampNumber(score, 0, 100),
    matchLevel: getMatchLevel(score),
    matchedRequirements: required.matchedRequirements,
    missingRequirements: required.missingRequirements,
    reason: '',
    breakdown: {
      weights: SCORE_WEIGHTS,
      categories: {
        requiredSkills: required.score,
        stackAlignment: stack.score,
        experienceProjects: expProj.score,
        education: education.score,
        resumeQuality: quality.score
      },
      bonuses: {
        value: bonus
      },
      penalties: {
        value: penalty
      },
      roleFlags: roleFlags,
      signals: expProj.signals
    }
  };
  result.reason = summarizeReason(result);
  return result;
}

function parseGeminiResult(rawText) {
  const cleaned = String(rawText || '').replace(/```json|```/gi, '').trim();
  let parsed = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // fallback regex parse
  }

  const scoreFromParsed = parsed ? Number(parsed.score) : NaN;
  const scoreRegex = cleaned.match(/"?score"?\s*:\s*(\d{1,3})/i) || cleaned.match(/\b(\d{1,3})\b/);
  const score = Number.isFinite(scoreFromParsed)
    ? scoreFromParsed
    : (scoreRegex ? Number(scoreRegex[1]) : NaN);

  if (!Number.isFinite(score)) {
    return null;
  }

  const normalizedScore = Math.round(clampNumber(score, 0, 100));
  const matchLevel = parsed && typeof parsed.matchLevel === 'string'
    ? normalizeText(parsed.matchLevel).replace(/\s+/g, '')
    : getMatchLevel(normalizedScore);

  const matchedRequirements = parsed && Array.isArray(parsed.matchedRequirements)
    ? parsed.matchedRequirements.map(String).slice(0, 12)
    : [];
  const missingRequirements = parsed && Array.isArray(parsed.missingRequirements)
    ? parsed.missingRequirements.map(String).slice(0, 12)
    : [];
  const reason = parsed && typeof parsed.reason === 'string' ? parsed.reason : '';

  return {
    score: normalizedScore,
    matchLevel: ['excellent', 'strong', 'good', 'partial', 'weak'].includes(matchLevel) ? matchLevel : getMatchLevel(normalizedScore),
    matchedRequirements,
    missingRequirements,
    reason
  };
}

async function computeGeminiResumeScoreDetailed(resumeText, job, options) {
  if (!GEMINI_API_KEY || !resumeText || !job) {
    return null;
  }

  const lexical = computeLexicalResumeScoreDetailed(resumeText, job);
  const requirements = Array.isArray(job.skills) ? job.skills : [];
  const prompt = [
    'You are a senior technical recruiter scoring resume-to-job fit.',
    'Return ONLY valid JSON in this exact structure:',
    '{"score":0-100,"matchLevel":"excellent|strong|good|partial|weak","matchedRequirements":[],"missingRequirements":[],"reason":""}',
    '',
    'Scoring policy:',
    '- Prioritize technical fit over exact wording.',
    '- Treat equivalent technologies as valid matches.',
    '- Treat projects as valid experience for fresh graduate and entry-level roles.',
    '- Do not over-penalize missing boilerplate words.',
    '- If 3 out of 4 core requirements match, score is usually 70+ unless clear red flags.',
    '- If all core requirements match, score is usually 80+.',
    '- Missing PostgreSQL alone should not push score below 70 when backend/database fit exists.',
    '',
    `JOB TITLE: ${job.title || ''}`,
    `JOB DESCRIPTION: ${job.description || ''}`,
    `JOB REQUIREMENTS: ${requirements.join(' | ')}`,
    `BASELINE LEXICAL ANALYSIS SCORE: ${lexical.score}`,
    `BASELINE MATCHED REQUIREMENTS: ${lexical.matchedRequirements.join(', ')}`,
    `BASELINE MISSING REQUIREMENTS: ${lexical.missingRequirements.join(', ')}`,
    '',
    `RESUME TEXT: ${String(resumeText || '').slice(0, 14000)}`
  ].join('\n');

  const models = [];
  [
    options && options.model ? options.model : DEFAULT_GEMINI_MODEL,
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash'
  ].forEach(function(model) {
    if (model && !models.includes(model)) {
      models.push(model);
    }
  });

  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationConfig: {
            temperature: 0.1,
            topP: 0.85,
            maxOutputTokens: 320
          },
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!resp.ok) {
        continue;
      }

      const data = await resp.json();
      const text = (((data || {}).candidates || [])[0] || {}).content;
      const raw = (((text || {}).parts || [])[0] || {}).text || '';
      const parsed = parseGeminiResult(raw);
      if (parsed) {
        return {
          model: model,
          ...parsed
        };
      }
    } catch {
      // Try the next fallback model.
    }
  }

  return null;
}

async function computeResumeScoreDetailed(resumeText, job, options) {
  const lexical = computeLexicalResumeScoreDetailed(resumeText, job);
  const gemini = await computeGeminiResumeScoreDetailed(resumeText, job, options);

  if (!gemini) {
    const baseResult = {
      score: lexical.score,
      geminiUsed: false,
      matchLevel: lexical.matchLevel,
      matchedRequirements: lexical.matchedRequirements,
      missingRequirements: lexical.missingRequirements,
      reason: lexical.reason,
      breakdown: {
        lexical: lexical
      }
    };
    const aiAssessment = await computeGeminiExplanationDetailed(resumeText, job, baseResult, lexical, options)
      || buildFallbackAiAssessment(baseResult, lexical, resumeText);
    return {
      ...baseResult,
      ...aiAssessment
    };
  }

  let finalScore = Math.round((lexical.score * 0.2) + (gemini.score * 0.8));
  finalScore = clampNumber(finalScore, 0, 100);

  const mergedMatched = Array.from(new Set([].concat(gemini.matchedRequirements || [], lexical.matchedRequirements || []))).slice(0, 12);
  const mergedMissing = Array.from(new Set([].concat(gemini.missingRequirements || [], lexical.missingRequirements || []))).slice(0, 12);
  const matchLevel = getMatchLevel(finalScore);

  const baseResult = {
    score: finalScore,
    geminiUsed: true,
    matchLevel,
    matchedRequirements: mergedMatched,
    missingRequirements: mergedMissing,
    reason: gemini.reason || lexical.reason,
    breakdown: {
      lexical: lexical,
      gemini: gemini,
      blend: {
        lexicalWeight: 0.2,
        geminiWeight: 0.8
      }
    }
  };
  const aiAssessment = await computeGeminiExplanationDetailed(resumeText, job, baseResult, lexical, options)
    || buildFallbackAiAssessment(baseResult, lexical, resumeText);
  return {
    ...baseResult,
    ...aiAssessment
  };
}

module.exports = {
  normalizeText,
  tokenize,
  computeLexicalResumeScoreDetailed,
  computeGeminiResumeScoreDetailed,
  computeResumeScoreDetailed,
  getMatchLevel
};
