// background.js — Prodigy Solvex service worker
// v2.0: Stripped all auth / payment / Supabase / trial logic.
//       Free for everyone. Tracks anonymized usage via JSONBin.io.

importScripts("analytics.js");

const DEFAULT_MODEL = "gemini-3.1-flash-lite-preview";
const BURNT_KEY = "AQ.Ab8RN6I1C1o7hEEyqfwMJUFw1TdSg-kRieVIS06703505QTCrQ";

// Heartbeat timer (kept alive by chrome.alarms so it survives SW idle).
const HEARTBEAT_ALARM = "prodigy-heartbeat";

chrome.runtime.onInstalled.addListener(async () => {
  // NOTE: Do NOT auto-seed the device profile here — let the onboarding modal
  // handle profile creation when the user picks their name. Auto-seeding would
  // create a profile with a random username, which would then make isOnboarded()
  // return true and the welcome modal would never show.

  // Schedule recurring heartbeats (activeMinutes++).
  try {
    await chrome.alarms.create(HEARTBEAT_ALARM, { periodInMinutes: 1 });
  } catch (_) {}
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm && alarm.name === HEARTBEAT_ALARM) {
    ProdigyAnalytics.heartbeat().catch(() => {});
  }
});

// Run a heartbeat immediately on SW startup (covers manual reloads / browser start).
ProdigyAnalytics.heartbeat().catch(() => {});

// -------------------------------------------------------------
// Message router (popup + content scripts)
// -------------------------------------------------------------
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SOLVE_QUESTION") {
    handleSolveQuestion(request.payload)
      .then(async (data) => {
        // Record telemetry (non-blocking).
        try {
          const snippet = data?.mcq_answers?.[0] || data?.writing_answer || data?.reconstructed_sentence || "";
          const type = data?.detected_type || request.payload?.type || "unknown";
          await ProdigyAnalytics.recordSolve(type, snippet);
          chrome.runtime.sendMessage({ action: "SOLVE_EVENT_LOCAL", type, snippet }).catch(() => {});
        } catch (_) {}
        sendResponse({ success: true, data });
      })
      .catch((err) => sendResponse({ success: false, error: err.message, code: err.code }));
    return true;
  }

  if (request.action === "TEST_API_KEY") {
    testApiKey(request.apiKey, request.model)
      .then((res) => sendResponse({ success: true, ...res }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === "GET_AVAILABLE_MODELS") {
    autoDetectBestModel(request.apiKey)
      .then((res) => sendResponse({ success: true, ...res }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === "REFRESH_ALL_KEYS") {
    handleRefreshAllKeys()
      .then((res) => sendResponse({ success: true, ...res }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === "REFRESH_SINGLE_KEY") {
    handleRefreshSingleKey(request.keyIndex)
      .then((res) => sendResponse({ success: true, ...res }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === "GET_DEVICE_PROFILE") {
    ProdigyAnalytics.getDeviceProfile()
      .then((p) => sendResponse({ success: true, profile: p }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === "UPDATE_DEVICE_PROFILE") {
    ProdigyAnalytics.updateDeviceProfile(request.patch || {})
      .then((p) => sendResponse({ success: true, profile: p }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === "FLUSH_ANALYTICS") {
    ProdigyAnalytics.flushToBin()
      .then((totals) => sendResponse({ success: true, totals }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === "GET_GLOBAL_STATS") {
    ProdigyAnalytics.getGlobalStats()
      .then((totals) => sendResponse({ success: true, totals }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === "GET_LEADERBOARD") {
    ProdigyAnalytics.getLeaderboard(request.limit || 10)
      .then((rows) => sendResponse({ success: true, rows }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === "IS_ONBOARDED") {
    ProdigyAnalytics.isOnboarded()
      .then((onboarded) => sendResponse({ success: true, onboarded }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === "COMPLETE_ONBOARDING") {
    (async () => {
      try {
        const username = (request.username || "").trim().slice(0, 24);
        const theme = request.theme === "kawaii-teddy" ? "kawaii-teddy" : "pixel-gamer";
        if (!username) {
          sendResponse({ success: false, error: "Username cannot be empty." });
          return;
        }
        // Mark first session start so the heartbeat counts this browser session.
        await chrome.storage.local.set({ "__prodigy_session_start__": Date.now() });
        await ProdigyAnalytics.updateDeviceProfile({ username, theme });
        await ProdigyAnalytics.setOnboarded();

        // Respond immediately so the popup can close the modal —
        // the cloud sync continues in the background.
        sendResponse({ success: true, username });

        // Fire-and-forget cloud push.
        ProdigyAnalytics.flushToBin().catch(() => {});
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (request.action === "RECORD_SOLVE_EVENT") {
    ProdigyAnalytics.recordSolve(request.type, request.snippet)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

// Keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;
  if (command === "solve_current_question") {
    chrome.tabs.sendMessage(tab.id, { action: "TRIGGER_SOLVE" }).catch(() => {});
  } else if (command === "toggle_hud") {
    chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_HUD" }).catch(() => {});
  }
});

// -------------------------------------------------------------
// AI Solving (Gemini) — full logic preserved from v1.0.4,
// minus auth/trial/ban checks. Free for everyone now.
// -------------------------------------------------------------

async function autoDetectBestModel(apiKey) {
  if (!apiKey) throw new Error("Please enter your Gemini API key.");
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url);
  if (!response.ok) {
    let errorMsg = `API Key Verification Failed (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson.error?.message) errorMsg = errorJson.error.message;
    } catch (_) {}
    throw new Error(errorMsg);
  }
  const data = await response.json();
  const rawModels = data.models || [];
  const validModels = rawModels
    .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes("generateContent"))
    .filter(m => !/2\.5-flash/i.test(m.name))
    .map(m => {
      const id = m.name.replace(/^models\//, "");
      return { id, displayName: m.displayName || id, description: m.description || "" };
    });
  if (validModels.length === 0) throw new Error("No active text generation models found for this API key.");

  const priorityPatterns = [
    /^gemini-3\.1-flash-lite-preview/i,
    /^gemini-3\.1-flash-lite/i,
    /^gemini-3\.\d+-flash-lite/i,
    /flash-lite/i,
    /^gemini-3\.6-flash/i,
    /^gemini-3\.\d+-flash/i,
    /^gemini-2\.0-flash/i,
    /^gemini-1\.5-flash/i,
    /flash/i,
    /^gemini-3/i,
    /^gemini-2/i,
    /^gemini-1\.5-pro/i,
    /^gemini/i
  ];

  const sortedModels = [...validModels].sort((a, b) => {
    let idxA = priorityPatterns.findIndex(p => p.test(a.id));
    let idxB = priorityPatterns.findIndex(p => p.test(b.id));
    if (idxA === -1) idxA = 999;
    if (idxB === -1) idxB = 999;
    return idxA - idxB;
  });

  return { bestModel: sortedModels[0].id, bestModelName: sortedModels[0].displayName, models: validModels, sortedModels };
}

const keyModelCache = new Map();

async function getOrDetectModel(apiKey) {
  if (keyModelCache.has(apiKey)) {
    const cached = keyModelCache.get(apiKey);
    if (Date.now() - cached.time < 3600000) return cached.model;
  }
  try {
    const detection = await autoDetectBestModel(apiKey);
    keyModelCache.set(apiKey, { model: detection.bestModel, time: Date.now() });
    return detection.bestModel;
  } catch (err) {
    console.warn("[Prodigy Solvex] Model detection fallback to default:", err.message);
    return DEFAULT_MODEL;
  }
}

async function handleSolveQuestion(payload) {
  const settings = await chrome.storage.local.get([
    "geminiApiKeys", "activeKeyIndex", "geminiApiKey", "geminiModel"
  ]);

  let keys = Array.isArray(settings.geminiApiKeys) ? [...settings.geminiApiKeys] : [];
  let activeIndex = typeof settings.activeKeyIndex === "number" ? settings.activeKeyIndex : 0;

  keys = keys.filter(k => {
    const kStr = typeof k === "string" ? k : k?.key;
    return kStr && typeof kStr === "string" && kStr.trim() !== BURNT_KEY;
  });

  if (keys.length === 0 && settings.geminiApiKey && typeof settings.geminiApiKey === "string" && settings.geminiApiKey.trim() !== BURNT_KEY) {
    keys.push({
      key: settings.geminiApiKey.trim(),
      model: settings.geminiModel || "Auto-Selected",
      status: "active",
      addedAt: Date.now()
    });
    activeIndex = 0;
  }

  if (keys.length === 0) {
    const error = new Error("No Gemini API key configured. Open Prodigy Solvex popup and add your free API key.");
    error.code = "API_KEY_MISSING";
    throw error;
  }
  if (keys.length > 10) keys = keys.slice(0, 10);
  if (activeIndex >= keys.length) activeIndex = 0;

  const originalIndex = activeIndex;
  let currentIndex = activeIndex;
  let attempts = 0;
  let rotated = false;
  let lastError = null;

  while (attempts < keys.length) {
    const keyObj = keys[currentIndex];
    const apiKey = (typeof keyObj === "string" ? keyObj : keyObj?.key || "").trim();
    if (!apiKey) {
      currentIndex = (currentIndex + 1) % keys.length;
      attempts++;
      continue;
    }

    let model = keyObj.model;
    if (!model || model === "Auto-Selected" || model === "auto") {
      model = await getOrDetectModel(apiKey);
      keyObj.model = model;
    }

    try {
      const prompt = buildGeminiPrompt(payload);
      const responseData = await callGeminiAPI(apiKey, model, prompt);

      if (rotated) {
        keys.forEach((k, idx) => {
          if (idx === currentIndex) k.status = "active";
          else if (k.status === "active") k.status = "standby";
        });
        await chrome.storage.local.set({
          geminiApiKeys: keys,
          activeKeyIndex: currentIndex,
          geminiApiKey: apiKey,
          geminiModel: model
        });
      }

      return {
        ...responseData,
        _keyRotated: rotated,
        _originalKeyIndex: originalIndex,
        _activeKeyIndex: currentIndex,
        _totalKeys: keys.length,
        _modelUsed: model
      };
    } catch (err) {
      const isQuotaOrRateLimit =
        err.code === "RATE_LIMITED" ||
        err.message.toLowerCase().includes("429") ||
        err.message.toLowerCase().includes("quota") ||
        err.message.toLowerCase().includes("rate limit") ||
        err.message.toLowerCase().includes("exhausted") ||
        err.message.toLowerCase().includes("resource_exhausted");

      if (isQuotaOrRateLimit && keys.length > 1) {
        console.warn(`[Prodigy Solvex] Key #${currentIndex + 1} quota drained. Rotating...`);
        keyObj.status = "exhausted";
        currentIndex = (currentIndex + 1) % keys.length;
        rotated = true;
        attempts++;
        lastError = err;
        continue;
      } else {
        throw err;
      }
    }
  }

  await chrome.storage.local.set({ geminiApiKeys: keys });
  throw new Error(`All ${keys.length} API keys exhausted their rate limit. Wait a minute or add a fresh key in Prodigy Solvex settings.`);
}

function buildGeminiPrompt(payload) {
  return `You are an expert exam, test, and assessment solver. Your job is to analyze the provided on-screen question and return the 100% accurate, high-scoring answer in a strictly structured JSON format.

QUESTION DETAILS:
Question Category / Intended Type: ${payload.type || "Auto-detect"}
Question Prompt:
"""
${payload.questionText || "No explicit text, see options and context below"}
"""

Surrounding Context / Instructions:
"""
${payload.context || "None"}
"""

Extracted Options (for MCQ / Word Choice):
${JSON.stringify(payload.options || [], null, 2)}

Extracted Dropdowns (for Choose the Correct Word or Speaking dropdowns):
${JSON.stringify(payload.dropdowns || [], null, 2)}

Extracted Scrambled Tokens (for Rearrange Sentence):
${JSON.stringify(payload.sentenceTokens || [], null, 2)}

Extracted Word Choice Chips (for Multi-Blank Cloze Passage):
${JSON.stringify(payload.wordChoices || [], null, 2)}

Writing Criteria / Constraints:
${JSON.stringify(payload.writingConstraints || {}, null, 2)}

CRITICAL CLASSIFICATION & SOLVING RULES:
- If Question Category is 'writing' OR if a writing textarea/box is present OR if the prompt asks to "write a paragraph", "write an essay", "write an email", "write a letter", "write a response", "describe", "summarize", or specifies a word limit: THIS IS A WRITING QUESTION!
  * Set "detected_type": "writing".
  * In "writing_answer", write a comprehensive, articulate, grammatically flawless, high-scoring response.
  * Strictly adhere to any stated word limit or paragraph structure.
  * DO NOT classify as MCQ even if format buttons or toolbars are present!
- If the question asks to arrange sentences/paragraphs and provides multiple-choice permutation options like "ADCB", "DCAB", "CADB": THIS IS MCQ.
  * Set "detected_type": "mcq" and return the chosen permutation in "mcq_answers" and its index in "mcq_indices".
- If Question Category is 'cloze_passage' OR if the question asks to "complete the ... by choosing the correct words for the blanks", or if the passage contains multiple blank slots: THIS IS A MULTI-BLANK CLOZE PASSAGE QUESTION!
  * Set "detected_type": "cloze_passage".
  * Provide the matching word from the available choices for EVERY blank in sequential order in "ordered_fill_blanks".
  * Return the complete reconstructed passage in "reconstructed_passage".
- If Question Category is 'rearrange_sentence' OR if 'Extracted Scrambled Tokens' is non-empty and the question asks to rearrange words/phrases/sentences: THIS IS A REARRANGE SENTENCE QUESTION!
  * Set "detected_type": "rearrange_sentence".
  * CRITICAL: You MUST use EVERY SINGLE token from 'Extracted Scrambled Tokens' exactly once! If there are N tokens (indices 0 to N-1), "reordered_token_indices" MUST contain a valid permutation of all N indices [0..N-1], and "reordered_token_texts" MUST contain all N token "text" strings in that exact rearranged order without altering, merging, or omitting any token.
  * Carefully check grammar, subject-verb-object structure, modifiers, prepositions, articles, and punctuation (e.g. a token with a capital letter usually starts the sentence, and a token ending with a period/question mark ends the sentence).
  * Return the full properly ordered sentence or paragraph in "reconstructed_sentence".
- If 'Extracted Options' is not empty and NOT cloze/rearrange, OR if the question asks to "fill in the blank", "select the best answer", "choose the correct": THIS IS MCQ!
  * Set "detected_type": "mcq" and specify the exact single correct option text in "mcq_answers" and its 0-based index in "mcq_indices".

RESPONSE FORMAT:
Reply ONLY with a single valid RFC 8259 JSON object without markdown code blocks, backticks, or comments.
All keys and strings MUST be enclosed in standard double quotes ("").

Return ONLY the fields relevant to the question:
- If Cloze Passage: {"detected_type": "cloze_passage", "ordered_fill_blanks": ["Word1", "Word2"], "reconstructed_passage": "Complete passage.", "explanation": "Brief explanation"}
- If MCQ: {"detected_type": "mcq", "mcq_answers": ["exact option text"], "mcq_indices": [0], "explanation": "Short reason."}
- If Sentence Rearrangement: {"detected_type": "rearrange_sentence", "clause_flow_analysis": "Narrative", "reconstructed_sentence": "Full ordered sentence.", "reordered_token_texts": ["Token1", "Token2"], "reordered_token_indices": [2, 0, 3, 1], "explanation": "Reasoning"}
- If Choose the Correct Word: {"detected_type": "choose_word", "dropdown_selections": [{"dropdown_index": 0, "selected_text": "chosen text"}]}
- If Writing: {"detected_type": "writing", "writing_answer": "Complete articulate essay response."}
- If Speaking: {"detected_type": "speaking", "speaking_script": "Natural spoken text for reading aloud."}`;
}

async function callGeminiAPI(apiKey, model, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, response_mime_type: "application/json" }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    let errorMsg = `Gemini API error (Status ${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson.error?.message) errorMsg = errorJson.error.message;
    } catch (_) {}

    if (response.status === 429 || errorMsg.toLowerCase().includes("quota") || errorMsg.toLowerCase().includes("rate limit") || errorMsg.toLowerCase().includes("exhausted")) {
      errorMsg = "Gemini API Limit Exhausted (HTTP 429): Your API key quota or per-minute rate limit was exceeded. Wait 60 seconds or use a newly generated API key.";
    }

    const isModelUnavailable = errorMsg.includes("is no longer available") ||
      errorMsg.includes("not found") ||
      errorMsg.includes("not supported") ||
      errorMsg.includes("unsupported") ||
      response.status === 404 ||
      (response.status === 400 && (errorMsg.includes("models/") || errorMsg.includes("model")));

    if (isModelUnavailable) {
      try {
        const detection = await autoDetectBestModel(apiKey);
        const candidates = detection.sortedModels || detection.models;
        const alternative = candidates.find(m => m.id !== model)?.id || "gemini-2.0-flash";
        if (alternative && alternative !== model) {
          await chrome.storage.local.set({ geminiModel: alternative });
          return callGeminiAPI(apiKey, alternative, prompt);
        }
      } catch (_) {}
    }

    const err = new Error(errorMsg);
    err.code = response.status === 400 ? "BAD_REQUEST" : response.status === 429 ? "RATE_LIMITED" : response.status === 403 ? "FORBIDDEN" : "API_ERROR";
    throw err;
  }

  const result = await response.json();
  const textOutput = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) throw new Error("Gemini returned an empty response or candidate was blocked.");
  return robustJSONParse(textOutput);
}

function robustJSONParse(rawText) {
  if (!rawText || typeof rawText !== "string") throw new Error("Empty response received from Gemini.");
  let text = rawText.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const firstBrace = text.indexOf("{");
  if (firstBrace !== -1) {
    const lastBrace = text.lastIndexOf("}");
    if (lastBrace !== -1 && lastBrace > firstBrace) text = text.slice(firstBrace, lastBrace + 1);
    else text = text.slice(firstBrace);
  }
  try { return JSON.parse(text); } catch (_) {}
  let repaired = text.replace(/\/\/[^\r\n]*(\r?\n|$)/g, "$1").replace(/\/\*[\s\S]*?\*\//g, "");
  repaired = repaired.replace(/,\s*([}\]])/g, "$1");
  repaired = repaired.replace(/(['"])?([a-zA-Z0-9_]+)\1\s*:/g, '"$2":');
  repaired = repaired.replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, ': "$1"');
  repaired = repaired.replace(/\[\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, '["$1"');
  repaired = repaired.replace(/,\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, ', "$1"');
  try { return JSON.parse(repaired); } catch (_) {}
  try {
    const fn = new Function('"use strict"; return (' + text + ');');
    const res = fn();
    if (res && typeof res === "object") return res;
  } catch (_) {}
  try {
    const fn = new Function('"use strict"; return (' + repaired + ');');
    const res = fn();
    if (res && typeof res === "object") return res;
  } catch (_) {}
  const salvaged = salvageTruncatedJSON(repaired) || salvageTruncatedJSON(text);
  if (salvaged) {
    try { return JSON.parse(salvaged); } catch (_) {}
    try {
      const fn = new Function('"use strict"; return (' + salvaged + ');');
      const res = fn();
      if (res && typeof res === "object") return res;
    } catch (_) {}
  }
  throw new Error(`Unable to parse structured response from Gemini: ${rawText.slice(0, 90)}...`);
}

function salvageTruncatedJSON(str) {
  if (!str || typeof str !== "string") return null;
  const firstBrace = str.indexOf("{");
  if (firstBrace === -1) return null;
  let s = str.slice(firstBrace);
  let inString = false, escaped = false, openBrackets = 0, openBraces = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "\\" && inString) { escaped = !escaped; continue; }
    if (c === '"' && !escaped) inString = !inString;
    else if (!inString) {
      if (c === "[") openBrackets++;
      else if (c === "]") openBrackets = Math.max(0, openBrackets - 1);
      else if (c === "{") openBraces++;
      else if (c === "}") openBraces = Math.max(0, openBraces - 1);
    }
    escaped = false;
  }
  if (inString) s += '"';
  s = s.replace(/,\s*$/g, "");
  s = s.replace(/,\s*"[^"]*"\s*$/g, "");
  s = s.replace(/,\s*"[^"]*"\s*:\s*$/g, "");
  while (openBrackets > 0) { s += "]"; openBrackets--; }
  while (openBraces > 0) { s += "}"; openBraces--; }
  return s;
}

async function testApiKey(apiKey, requestedModel = "auto") {
  if (!apiKey) throw new Error("API key cannot be empty.");
  const detection = await autoDetectBestModel(apiKey);
  const candidates = detection.sortedModels || detection.models;
  let verifiedModel = null, lastError = null;
  for (const candidate of candidates) {
    const candidateId = candidate.id;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(candidateId)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const body = { contents: [{ parts: [{ text: "Respond only with OK." }] }], generationConfig: { maxOutputTokens: 5, temperature: 0.0 } };
    try {
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) {
        let errorMsg = `Ping test failed (${response.status})`;
        try { const errorJson = await response.json(); if (errorJson.error?.message) errorMsg = errorJson.error.message; } catch (_) {}
        lastError = new Error(errorMsg);
        continue;
      }
      verifiedModel = candidate;
      break;
    } catch (netErr) { lastError = netErr; }
  }
  if (!verifiedModel) throw new Error(lastError?.message || "Could not verify any active text generation model with this API key.");
  const targetModel = verifiedModel.id;
  keyModelCache.set(apiKey, { model: targetModel, time: Date.now() });
  await chrome.storage.local.set({ geminiApiKey: apiKey, geminiModel: targetModel, availableModels: detection.models });
  return {
    message: `Connected successfully! Auto-selected: ${targetModel}`,
    detectedModel: targetModel,
    detectedModelName: verifiedModel.displayName || targetModel,
    availableModels: detection.models
  };
}

async function pingCheckKey(apiKey, currentModel) {
  if (!apiKey || typeof apiKey !== "string") return { ok: false, status: "invalid", error: "Missing API Key" };
  const trimmedKey = apiKey.trim();
  if (trimmedKey === BURNT_KEY) return { ok: false, status: "invalid", error: "Burnt or revoked API key" };
  const candidateModels = [];
  if (currentModel && currentModel !== "Auto-Selected" && currentModel !== "auto") candidateModels.push(currentModel);
  candidateModels.push("gemini-3.1-flash-lite-preview", "gemini-2.0-flash", "gemini-1.5-flash");
  const uniqueCandidates = [...new Set(candidateModels)];
  let isRateLimited = false, isInvalid = false, lastError = null;
  for (const modelId of uniqueCandidates) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(trimmedKey)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "OK" }] }], generationConfig: { maxOutputTokens: 2, temperature: 0.0 } })
      });
      if (response.ok) return { ok: true, status: "ready", model: modelId };
      let errorMsg = `HTTP ${response.status}`;
      try { const errJson = await response.json(); if (errJson.error?.message) errorMsg = errJson.error.message; } catch (_) {}
      const errLower = errorMsg.toLowerCase();
      if (response.status === 429 || errLower.includes("quota") || errLower.includes("rate limit") || errLower.includes("resource_exhausted") || errLower.includes("exhausted")) {
        isRateLimited = true; lastError = "Rate limit / quota exceeded (HTTP 429)"; break;
      } else if (response.status === 400 || response.status === 403 || errLower.includes("api_key_invalid") || errLower.includes("not valid") || errLower.includes("forbidden")) {
        isInvalid = true; lastError = errorMsg || "Invalid or unauthorized API key"; break;
      } else if (response.status === 404 || errLower.includes("not found")) continue;
      else lastError = errorMsg;
    } catch (netErr) { lastError = netErr.message; }
  }
  if (!isRateLimited && !isInvalid) {
    try {
      const detection = await autoDetectBestModel(trimmedKey);
      if (detection.bestModel) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(detection.bestModel)}:generateContent?key=${encodeURIComponent(trimmedKey)}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: "OK" }] }], generationConfig: { maxOutputTokens: 2, temperature: 0.0 } })
        });
        if (response.ok) return { ok: true, status: "ready", model: detection.bestModel };
        let errorMsg = `HTTP ${response.status}`;
        try { const errJson = await response.json(); if (errJson.error?.message) errorMsg = errJson.error.message; } catch (_) {}
        const errLower = errorMsg.toLowerCase();
        if (response.status === 429 || errLower.includes("quota") || errLower.includes("rate limit") || errLower.includes("exhausted")) return { ok: false, status: "exhausted", error: "Rate limit / quota exceeded (HTTP 429)" };
        if (response.status === 400 || response.status === 403) return { ok: false, status: "invalid", error: errorMsg };
      }
    } catch (detectErr) {
      const detectErrLower = detectErr.message.toLowerCase();
      if (detectErrLower.includes("quota") || detectErrLower.includes("429")) return { ok: false, status: "exhausted", error: detectErr.message };
      if (detectErrLower.includes("invalid") || detectErrLower.includes("not valid") || detectErrLower.includes("400") || detectErrLower.includes("403")) return { ok: false, status: "invalid", error: detectErr.message };
    }
  }
  if (isRateLimited) return { ok: false, status: "exhausted", error: lastError };
  if (isInvalid) return { ok: false, status: "invalid", error: lastError };
  return { ok: false, status: "exhausted", error: lastError || "Ping verification failed" };
}

async function handleRefreshAllKeys() {
  const settings = await chrome.storage.local.get(["geminiApiKeys", "activeKeyIndex", "geminiApiKey", "geminiModel"]);
  let keys = Array.isArray(settings.geminiApiKeys) ? [...settings.geminiApiKeys] : [];
  let activeIndex = typeof settings.activeKeyIndex === "number" ? settings.activeKeyIndex : 0;
  keys = keys.filter(k => { const kStr = typeof k === "string" ? k : k?.key; return kStr && typeof kStr === "string" && kStr.trim() !== BURNT_KEY; });
  if (keys.length === 0 && settings.geminiApiKey && typeof settings.geminiApiKey === "string" && settings.geminiApiKey.trim() !== BURNT_KEY) {
    keys.push({ key: settings.geminiApiKey.trim(), model: settings.geminiModel || "Auto-Selected", status: "active", addedAt: Date.now() });
    activeIndex = 0;
  }
  if (keys.length === 0) throw new Error("No API keys found in pool to refresh. Please add an API key first.");
  keys = keys.map((k, idx) => {
    if (typeof k === "string") return { key: k, model: "Auto-Selected", status: (idx === activeIndex ? "active" : "standby"), addedAt: Date.now() };
    return { ...k };
  });
  if (activeIndex >= keys.length) activeIndex = 0;
  let restoredCount = 0, readyCount = 0, exhaustedCount = 0, invalidCount = 0;
  const checkResults = await Promise.all(keys.map(async (keyObj, idx) => {
    const apiKey = keyObj.key.trim();
    const prevStatus = keyObj.status;
    const res = await pingCheckKey(apiKey, keyObj.model);
    return { idx, prevStatus, res };
  }));
  checkResults.forEach(({ idx, prevStatus, res }) => {
    const keyObj = keys[idx];
    keyObj.lastChecked = Date.now();
    if (res.ok) {
      if (res.model) keyObj.model = res.model;
      if (prevStatus === "exhausted" || prevStatus === "invalid") restoredCount++;
      keyObj.status = "ready";
      delete keyObj.lastError;
      readyCount++;
    } else {
      if (res.status === "invalid") { keyObj.status = "invalid"; invalidCount++; }
      else { keyObj.status = "exhausted"; exhaustedCount++; }
      keyObj.lastError = res.error;
    }
  });
  if (keys[activeIndex]?.status !== "ready") {
    const firstReadyIdx = keys.findIndex(k => k.status === "ready");
    if (firstReadyIdx !== -1) activeIndex = firstReadyIdx;
  }
  keys.forEach((k, idx) => { if (k.status === "ready") k.status = (idx === activeIndex) ? "active" : "standby"; });
  await chrome.storage.local.set({
    geminiApiKeys: keys,
    activeKeyIndex: activeIndex,
    geminiApiKey: keys[activeIndex] ? keys[activeIndex].key : "",
    geminiModel: keys[activeIndex] ? keys[activeIndex].model : ""
  });
  return {
    keys, activeKeyIndex: activeIndex,
    stats: { total: keys.length, restored: restoredCount, ready: readyCount, exhausted: exhaustedCount, invalid: invalidCount }
  };
}

async function handleRefreshSingleKey(keyIndex) {
  const settings = await chrome.storage.local.get(["geminiApiKeys", "activeKeyIndex", "geminiApiKey", "geminiModel"]);
  let keys = Array.isArray(settings.geminiApiKeys) ? [...settings.geminiApiKeys] : [];
  let activeIndex = typeof settings.activeKeyIndex === "number" ? settings.activeKeyIndex : 0;
  if (keyIndex < 0 || keyIndex >= keys.length) throw new Error("Invalid API key index.");
  const keyObj = typeof keys[keyIndex] === "string"
    ? { key: keys[keyIndex], model: "Auto-Selected", status: "standby", addedAt: Date.now() }
    : { ...keys[keyIndex] };
  keys[keyIndex] = keyObj;
  const prevStatus = keyObj.status;
  const apiKey = (keyObj.key || "").trim();
  const res = await pingCheckKey(apiKey, keyObj.model);
  let wasRestored = false;
  keyObj.lastChecked = Date.now();
  if (res.ok) {
    if (res.model) keyObj.model = res.model;
    if (prevStatus === "exhausted" || prevStatus === "invalid") wasRestored = true;
    keyObj.status = (keyIndex === activeIndex) ? "active" : "standby";
    delete keyObj.lastError;
    if (keys[activeIndex]?.status === "exhausted" || keys[activeIndex]?.status === "invalid") {
      activeIndex = keyIndex; keyObj.status = "active";
    }
  } else if (res.status === "invalid") { keyObj.status = "invalid"; keyObj.lastError = res.error; }
  else { keyObj.status = "exhausted"; keyObj.lastError = res.error; }
  await chrome.storage.local.set({
    geminiApiKeys: keys,
    activeKeyIndex: activeIndex,
    geminiApiKey: keys[activeIndex] ? keys[activeIndex].key : "",
    geminiModel: keys[activeIndex] ? keys[activeIndex].model : ""
  });
  return { keys, activeKeyIndex, keyIndex, wasRestored, status: keyObj.status, model: keyObj.model, error: res.error };
}
