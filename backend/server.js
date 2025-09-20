const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const natural = require("natural");

const FEEDBACK_FILE = path.join(__dirname, "feedback.json");
const FEEDBACK_STATS_FILE = path.join(__dirname, "feedbackStats.json");
const MAX_FEEDBACK_BOOST = 10;



function loadAllFeedback() {
  try {
    const raw = fs.readFileSync(FEEDBACK_FILE, "utf8");
    return JSON.parse(raw || "[]");
  } catch (e) {
    return [];
  }
}

function saveAllFeedback(arr) {
  fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(arr, null, 2));
}

function computeFeedbackStats() {
  const all = loadAllFeedback();
  const stats = {};

  all.forEach((entry) => {
    const id = entry.internshipId;
    if (!id) return;
    if (!stats[id])
      stats[id] = { helpful: 0, not_helpful: 0, applied: 0, total: 0 };
    const f = entry.feedback;
    stats[id].total += 1;
    if (f === "useful") stats[id].helpful += 1;
    else if (f === "not_useful") stats[id].not_helpful += 1;
    else if (f === "applied") stats[id].applied += 1;
  });

  for (const id in stats) {
    const s = stats[id];
    const weightedPos = s.helpful + 2 * s.applied;
    const weightedNeg = s.not_helpful;
    const net = weightedPos - weightedNeg;
    const total = s.total || 1;

    const normalized = Math.max(-1, Math.min(1, net / total));
    const boost = Math.round(normalized * MAX_FEEDBACK_BOOST * 100) / 100;
    s.scoreBoost = boost;
  }

  try {
    fs.writeFileSync(FEEDBACK_STATS_FILE, JSON.stringify(stats, null, 2));
  } catch (e) {}

  return stats;
}

let feedbackStatsCache = computeFeedbackStats();
setInterval(() => {
  feedbackStatsCache = computeFeedbackStats();
}, 60 * 1000);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../public")));

//Replaced by real dataset currently its for MVP
const internships = JSON.parse(
  fs.readFileSync(path.join(__dirname, "internship.json"), "utf8")
);

function cosineSimilarityTfIdf(tfidf, idxA, idxB) {
  const termsA = tfidf.listTerms(idxA);
  const termsB = tfidf.listTerms(idxB);
  const mapA = {},
    mapB = {};
  termsA.forEach((t) => (mapA[t.term] = t.tfidf || 0));
  termsB.forEach((t) => (mapB[t.term] = t.tfidf || 0));

  let dot = 0,
    magA = 0,
    magB = 0;
  for (const t in mapA) {
    dot += mapA[t] * (mapB[t] || 0);
    magA += mapA[t] * mapA[t];
  }
  for (const t in mapB) {
    magB += mapB[t] * mapB[t];
  }
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

function scoreInternship(internship, userProfile) {
  const userSkillsText =
    (userProfile.skills || [])
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" ") || "";
  const jobSkillsText = (internship.skills_required || []).join(" ");

  const tfidf = new natural.TfIdf();
  tfidf.addDocument(userSkillsText);
  tfidf.addDocument(jobSkillsText);
  const skillSim = cosineSimilarityTfIdf(tfidf, 0, 1);

  const WEIGHTS = {
    skills: 50,
    sector: 20,
    location: 20,
    education: 10,
  };

  const skillScore = skillSim * WEIGHTS.skills;

  const sectorMatch =
    (userProfile.sector || "").toLowerCase() ===
    (internship.sector || "").toLowerCase();
  const sectorScore = sectorMatch ? WEIGHTS.sector : 0;

  const userLoc = (userProfile.location || "").toLowerCase();
  const jobLoc = (internship.location || "").toLowerCase();

  let locationScore = 0;
  if (!userLoc || userLoc === "any") {
    locationScore = 0;
  } else if (userLoc === jobLoc) {
    locationScore = WEIGHTS.location;
  } else if (userLoc === "remote" && jobLoc === "remote") {
    locationScore = WEIGHTS.location;
  } else {
    locationScore = 0;
  }

  let educationScore = 0;
  const userEdu = (userProfile.education || "").toLowerCase();
  const jobEdu = (internship.education_required || "").toLowerCase();
  if (userEdu && jobEdu && userEdu.includes(jobEdu)) {
    educationScore = WEIGHTS.education;
  } else if (jobEdu === "any graduate" || jobEdu === "any") {
    educationScore = WEIGHTS.education * 0.8;
  }

  const totalScore = skillScore + sectorScore + locationScore + educationScore; // up to 100

  return {
    totalScore: Math.round(totalScore * 100) / 100,
    breakdown: {
      skillScore: Math.round(skillScore * 100) / 100,
      sectorScore,
      locationScore,
      educationScore,
    },
  };
}

app.get("/meta", (req, res) => {
  const sectors = Array.from(new Set(internships.map((i) => i.sector))).sort();
  const locations = Array.from(
    new Set(internships.map((i) => i.location))
  ).sort();
  const educations = Array.from(
    new Set(internships.map((i) => i.education_required))
  ).sort();
  res.json({ sectors, locations, educations });
});

//Recommend file to recommend three-five internships based on user input also get the feedback states from feedbackStates
app.post("/recommend", (req, res) => {
  const userProfile = req.body || {};
  if (typeof userProfile.skills === "string") {
    userProfile.skills = userProfile.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const ranked = internships
    .map((intn) => {
      const scored = scoreInternship(intn, userProfile);
      const baseScore = scored.totalScore;

      // lookup feedback boost
      const stats = feedbackStatsCache[intn.id] || {};
      const boost = typeof stats.scoreBoost === "number" ? stats.scoreBoost : 0;

      let finalScore = Math.max(
        0,
        Math.min(100, Number(baseScore) + Number(boost))
      );

      return {
        ...intn,
        originalScore: baseScore,
        feedbackBoost: boost,
        matchScore: Math.round(finalScore * 100) / 100,
        breakdown: scored.breakdown,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  res.json({ results: ranked });
});

//Get the feedback from frontend and append it to the feedback.json file
app.post("/feedback", (req, res) => {
  const payload = req.body || {};
  const { internshipId, feedback } = payload;

  if (!feedback) {
    return res.status(400).json({ ok: false, error: "feedback required" });
  }
  if (!internshipId) {
    console.warn("⚠️ Missing internshipId, saving with 'unknown'");
  }

  const all = loadAllFeedback();
  all.push({
    internshipId: internshipId || "unknown",
    feedback,
    ts: new Date().toISOString(),
  });
  saveAllFeedback(all);

  feedbackStatsCache = computeFeedbackStats();
  res.json({ ok: true });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server listening on http://localhost:${PORT}`)
);
