import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;
const SELF_URL = "https://mrterpyydata.onrender.com/leaderboard/top14";
const API_KEY = "xhFenbgci0WVJKvzOopZs8bhz5EopJrp";

let cachedData = [];

// ✅ CORS headers manually
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

function maskUsername(username) {
  if (username.length <= 4) return username;
  return username.slice(0, 2) + "***" + username.slice(-2);
}

function getDynamicApiUrl() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0-indexed

  // Current month start and end
  const start = new Date(Date.UTC(year, month, 1)); // 1st of current month
  const end = new Date(Date.UTC(year, month + 1, 0)); // last day of current month

  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  return `https://services.rainbet.com/v1/external/affiliates?start_at=${startStr}&end_at=${endStr}&key=${API_KEY}`;
}

app.get("/leaderboard/prev", async (req, res) => {
  try {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();

    // Previous month start and end
    const prevStart = new Date(Date.UTC(year, month - 1, 1));
    const prevEnd = new Date(Date.UTC(year, month, 0));

    const startStr = prevStart.toISOString().slice(0, 10);
    const endStr = prevEnd.toISOString().slice(0, 10);

    const url = `https://services.rainbet.com/v1/external/affiliates?start_at=${startStr}&end_at=${endStr}&key=${API_KEY}`;
    const response = await fetch(url);
    const json = await response.json();

    if (!json.affiliates) throw new Error("No previous data");

    const sorted = json.affiliates.sort(
      (a, b) => parseFloat(b.wagered_amount) - parseFloat(a.wagered_amount)
    );

    const top10 = sorted.slice(0, 10);
    if (top10.length >= 2) [top10[0], top10[1]] = [top10[1], top10[0]];

    const processed = top10.map(entry => ({
      username: maskUsername(entry.username),
      wagered: Math.round(parseFloat(entry.wagered_amount)),
      weightedWager: Math.round(parseFloat(entry.wagered_amount)),
    }));

    res.json(processed);
  } catch (err) {
    console.error("[❌] Failed to fetch previous leaderboard:", err.message);
    res.status(500).json({ error: "Failed to fetch previous leaderboard data." });
  }
});

setInterval(() => {
  fetch(SELF_URL)
    .then(() => console.log(`[🔁] Self-pinged ${SELF_URL}`))
    .catch(err => console.error("[⚠️] Self-ping failed:", err.message));
}, 270000); // every 4.5 mins

app.listen(PORT, () => console.log(`🚀 Running on port ${PORT}`));
