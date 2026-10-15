// analytics.js — Prodigy Solvex telemetry via JSONBin.io
// Tracks: total users, per-device usernames, sessions, time-spent, solves.
// No PII beyond the username the user types in on first launch.

const PRODIGY_ANALYTICS = {
  BIN_ID: "6ac914e8ac6210605a232126",
  MASTER_KEY: "$2a$10$y8kwp82VOzzUoXp8KHEjS.maUVcodls6W4RbhfSYJjfuD26PQ2N/6",
  API_BASE: "https://api.jsonbin.io/v3/b",
  HEARTBEAT_INTERVAL_MS: 60 * 1000,        // 1 min heartbeats (activeMinutes++ each)
  FLUSH_INTERVAL_MS: 5 * 60 * 1000,        // 5 min writes to JSONBin
  LAST_FLUSH_KEY: "__prodigy_last_flush__",
  SESSION_START_KEY: "__prodigy_session_start__",
  ONBOARDED_KEY: "__prodigy_onboarded__"    // true after user picked a username
};

// In-memory cache of this device's profile so we don't hit storage on every heartbeat.
let _deviceProfileCache = null;

function _anonDeviceId() {
  // Stable per-browser identifier (kept in storage.local so it survives reloads).
  return new Promise((resolve) => {
    chrome.storage.local.get(["__prodigy_device_id__"], (res) => {
      if (res && res.__prodigy_device_id__) {
        resolve(res.__prodigy_device_id__);
        return;
      }
      const id = "dev_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
      chrome.storage.local.set({ "__prodigy_device_id__": id }, () => resolve(id));
    });
  });
}

function _generateUsername() {
  // Friendly display name like "Pixel Falcon 4271" or "Teddy Cloud 8829"
  const adj = ["Pixel", "Neon", "Cyber", "Turbo", "Mega", "Hyper", "Lunar", "Solar", "Cosmic", "Quantum"];
  const noun = ["Falcon", "Tiger", "Phoenix", "Falcon", "Wolf", "Dragon", "Panda", "Bunny", "Teddy", "Cloud"];
  const n = Math.floor(1000 + Math.random() * 9000);
  return adj[Math.floor(Math.random() * adj.length)] + " " + noun[Math.floor(Math.random() * noun.length)] + " " + n;
}

async function getDeviceProfile() {
  if (_deviceProfileCache) return _deviceProfileCache;
  const deviceId = await _anonDeviceId();

  const stored = await chrome.storage.local.get([
    "__prodigy_profile__",
    "__prodigy_session_start__"
  ]);

  let profile = stored.__prodigy_profile__;
  const now = Date.now();

  if (!profile) {
    profile = {
      deviceId,
      username: _generateUsername(),
      theme: "pixel-gamer",
      firstSeen: now,
      lastSeen: now,
      sessions: 0,
      solves: 0,
      activeMinutes: 0,
      history: []   // recent solved questions, capped at 50
    };
  }

  // Bump session count on each new browser-session start
  const sessionStart = stored.__prodigy_session_start__;
  if (!sessionStart) {
    profile.sessions = (profile.sessions || 0) + 1;
    await chrome.storage.local.set({ "__prodigy_session_start__": now });
  }

  profile.lastSeen = now;
  await chrome.storage.local.set({ "__prodigy_profile__": profile });
  _deviceProfileCache = profile;
  return profile;
}

async function updateDeviceProfile(patch) {
  const profile = await getDeviceProfile();
  const updated = { ...profile, ...patch, lastSeen: Date.now() };
  _deviceProfileCache = updated;
  await chrome.storage.local.set({ "__prodigy_profile__": updated });
  return updated;
}

async function recordSolve(questionType, snippet) {
  const profile = await getDeviceProfile();
  profile.solves = (profile.solves || 0) + 1;
  profile.history = profile.history || [];
  profile.history.unshift({
    type: questionType || "unknown",
    snippet: (snippet || "").slice(0, 140),
    at: Date.now()
  });
  if (profile.history.length > 50) profile.history = profile.history.slice(0, 50);
  await updateDeviceProfile({
    solves: profile.solves,
    history: profile.history
  });
}

// ---- Network sync (fire-and-forget; failures are silent) ----

async function _readBin() {
  try {
    const res = await fetch(`${PRODIGY_ANALYTICS.API_BASE}/${PRODIGY_ANALYTICS.BIN_ID}/latest`, {
      method: "GET",
      headers: { "X-Master-Key": PRODIGY_ANALYTICS.MASTER_KEY }
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body && body.record ? body.record : null;
  } catch (_) {
    return null;
  }
}

async function _writeBin(record) {
  try {
    const res = await fetch(`${PRODIGY_ANALYTICS.API_BASE}/${PRODIGY_ANALYTICS.BIN_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": PRODIGY_ANALYTICS.MASTER_KEY
      },
      body: JSON.stringify(record)
    });
    return res.ok;
  } catch (_) {
    return false;
  }
}

// Push this device's profile into the central bin.
// Schema:
//   {
//     "users": { "<deviceId>": { username, theme, firstSeen, lastSeen, sessions, solves, activeMinutes } },
//     "totals": { users, sessions, solves, activeMinutes }
//   }
async function flushToBin() {
  const profile = await getDeviceProfile();
  const remote = await _readBin() || { users: {}, totals: { users: 0, sessions: 0, solves: 0, activeMinutes: 0 } };

  if (!remote.users || typeof remote.users !== "object") remote.users = {};
  if (!remote.totals) remote.totals = { users: 0, sessions: 0, solves: 0, activeMinutes: 0 };

  const prev = remote.users[profile.deviceId];
  const deltaSolves = profile.solves - (prev?.solves || 0);
  const deltaSessions = profile.sessions - (prev?.sessions || 0);
  const deltaActiveMinutes = profile.activeMinutes - (prev?.activeMinutes || 0);

  remote.users[profile.deviceId] = {
    username: profile.username,
    theme: profile.theme || "pixel-gamer",
    firstSeen: profile.firstSeen,
    lastSeen: Date.now(),
    sessions: profile.sessions,
    solves: profile.solves,
    activeMinutes: profile.activeMinutes || 0
  };

  // Recompute totals from scratch (cheap & accurate).
  const userIds = Object.keys(remote.users);
  remote.totals = {
    users: userIds.length,
    sessions: userIds.reduce((s, k) => s + (remote.users[k].sessions || 0), 0),
    solves: userIds.reduce((s, k) => s + (remote.users[k].solves || 0), 0),
    activeMinutes: userIds.reduce((s, k) => s + (remote.users[k].activeMinutes || 0), 0)
  };

  await _writeBin(remote);
  await chrome.storage.local.set({ [PRODIGY_ANALYTICS.LAST_FLUSH_KEY]: Date.now() });
  return remote.totals;
}

async function getGlobalStats() {
  const remote = await _readBin();
  if (!remote || !remote.totals) return null;
  return remote.totals;
}

// Top-N leaderboard sorted by solves (then by activeMinutes as tiebreaker).
async function getLeaderboard(limit = 10) {
  const remote = await _readBin();
  if (!remote || !remote.users) return [];
  return Object.values(remote.users)
    .map((u) => ({
      username: u.username || "Anonymous",
      theme: u.theme || "pixel-gamer",
      solves: u.solves || 0,
      activeMinutes: u.activeMinutes || 0,
      sessions: u.sessions || 0,
      lastSeen: u.lastSeen || 0
    }))
    .sort((a, b) => (b.solves - a.solves) || (b.activeMinutes - a.activeMinutes))
    .slice(0, limit);
}

// Has this device completed onboarding (i.e. picked a username)?
// IMPORTANT: Only the explicit ONBOARDED_KEY flag counts. We deliberately
// do NOT treat an auto-generated profile as onboarded — otherwise the
// welcome modal would never show because getDeviceProfile() auto-seeds a
// profile on install with a random name.
async function isOnboarded() {
  const stored = await chrome.storage.local.get([PRODIGY_ANALYTICS.ONBOARDED_KEY]);
  return stored[PRODIGY_ANALYTICS.ONBOARDED_KEY] === true;
}

async function setOnboarded() {
  await chrome.storage.local.set({ [PRODIGY_ANALYTICS.ONBOARDED_KEY]: true });
}

// Called every minute by the background heartbeat.
async function heartbeat() {
  try {
    // Don't count active time if the user hasn't completed onboarding yet.
    const onboarded = await isOnboarded();
    if (!onboarded) return;

    const profile = await getDeviceProfile();
    profile.activeMinutes = (profile.activeMinutes || 0) + 1;
    await updateDeviceProfile({ activeMinutes: profile.activeMinutes });

    const lastFlush = (await chrome.storage.local.get([PRODIGY_ANALYTICS.LAST_FLUSH_KEY]))[PRODIGY_ANALYTICS.LAST_FLUSH_KEY] || 0;
    if (Date.now() - lastFlush > PRODIGY_ANALYTICS.FLUSH_INTERVAL_MS) {
      // Avoid blocking the heartbeat on slow networks.
      flushToBin().catch(() => {});
    }
  } catch (_) {}
}

// Export via globalThis so background.js can `importScripts` this file.
globalThis.ProdigyAnalytics = {
  getDeviceProfile,
  updateDeviceProfile,
  recordSolve,
  flushToBin,
  getGlobalStats,
  getLeaderboard,
  isOnboarded,
  setOnboarded,
  heartbeat,
  CONFIG: PRODIGY_ANALYTICS
};
