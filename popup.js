// popup.js — Prodigy Solvex v2.1
// Wires onboarding flow, theme switching, stats dashboard, leaderboard,
// history log, API key pool, and all extension settings.
// No auth, no payment, no trial. Free for everyone.

(function () {
  "use strict";

  // ----- Helpers -----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const STORAGE_KEYS = {
    theme: "ps_theme",
    enabled: "extensionEnabled",
    answerPopup: "answerPopupEnabled",
    autoSubmit: "autoSubmitEnabled",
    waitAnswer: "waitAnswerEnabled",
    waitSeconds: "waitAnswerSeconds",
    autoPlay: "autoPlayVideoEnabled",
    autoLoop: "autoLoopVideoEnabled",
    antiTab: "antiTabSwitchEnabled",
    keepActive: "keepWebsiteActiveEnabled",
    typingDelay: "typingDelayMs",
    apiKeys: "geminiApiKeys",
    activeKeyIndex: "activeKeyIndex",
    geminiApiKey: "geminiApiKey",
    geminiModel: "geminiModel"
  };

  const MASCOT_PRESETS = {
    "pixel-gamer": {
      avatar: "🎮",
      names: ["Pixel Falcon", "Neon Tiger", "Cyber Wolf", "Turbo Phoenix", "Mega Dragon"],
      messages: {
        idle: ["Ready to dominate this test. Press Alt+S or click Solve.", "Booting arcade mode. Let's clear this level.", "Pixel power online. Awaiting your command."],
        working: ["Crunching pixels...", "Computing the perfect answer...", "Loading next move..."],
        success: ["LEVEL CLEARED! Perfect answer!", "GG! Another one solved.", "Achievement unlocked: Correct answer!"],
        error: ["Game over. Check the API key.", "Connection lost. Try refreshing.", "Pixel glitch — try again."]
      }
    },
    "kawaii-teddy": {
      avatar: "🧸",
      names: ["Teddy Cloud", "Bunny Mochi", "Panda Berry", "Coco Bear", "Lulu Honey"],
      messages: {
        idle: ["Hi friend! I'm ready to help you solve questions~ 🌸", "Teddy is here! Click Solve whenever you're ready 💕", "Yay! Let's tackle these questions together! ✨"],
        working: ["Teddy is thinking hard... 🤔", "Working on it, please wait~ 🌷", "Munching through the problem... 🍯"],
        success: ["Yay! We did it! 🎉", "Teddy is so proud of you! 💖", "Sparkly success! ✨"],
        error: ["Aww, something went wrong 🙁", "Teddy needs an API key to help 🧸", "Don't worry, let's try again~ 💕"]
      }
    }
  };

  function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function setMascotState(state) {
    const theme = document.documentElement.getAttribute("data-theme") || "pixel-gamer";
    const preset = MASCOT_PRESETS[theme];
    const avatar = $("#ps-mascot-avatar");
    const msgEl = $("#ps-mascot-message");
    if (!avatar || !msgEl || !preset) return;
    avatar.textContent = preset.avatar;
    msgEl.textContent = pickRandom(preset.messages[state] || preset.messages.idle);

    if (state === "success") {
      const mascot = $("#ps-mascot");
      mascot.classList.add("celebrating");
      setTimeout(() => mascot.classList.remove("celebrating"), 2500);
      if (theme === "kawaii-teddy") sprinkleSparkles();
    }
  }

  function sprinkleSparkles() {
    const sparkles = ["✨", "🌸", "💖", "⭐", "🎀"];
    for (let i = 0; i < 8; i++) {
      const s = document.createElement("div");
      s.className = "ps-sparkle";
      s.textContent = pickRandom(sparkles);
      s.style.left = (Math.random() * 380) + "px";
      s.style.top = (Math.random() * 100) + "px";
      s.style.animationDelay = (Math.random() * 0.6) + "s";
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 3600);
    }
  }

  function setTheme(theme) {
    if (theme !== "pixel-gamer" && theme !== "kawaii-teddy") theme = "pixel-gamer";
    document.documentElement.setAttribute("data-theme", theme);
    chrome.storage.local.set({ [STORAGE_KEYS.theme]: theme });

    $$(".ps-theme-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.id === (theme === "pixel-gamer" ? "theme-pixel" : "theme-kawaii"));
    });

    // Persist theme choice on device profile (syncs to JSONBin later).
    chrome.runtime.sendMessage({ action: "UPDATE_DEVICE_PROFILE", patch: { theme } }, () => {
      // Refresh mascot to match new theme.
      setMascotState("idle");
    });

    // Sync to content script if active tab is steptest.in
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "THEME_CHANGED", theme }).catch(() => {});
      }
    });

    // Update mascot avatar immediately.
    const preset = MASCOT_PRESETS[theme];
    $("#ps-mascot-avatar").textContent = preset.avatar;
  }

  // ----- Load & apply theme -----
  chrome.storage.local.get([STORAGE_KEYS.theme], (res) => {
    setTheme(res[STORAGE_KEYS.theme] || "pixel-gamer");
  });

  $("#theme-pixel").addEventListener("click", () => setTheme("pixel-gamer"));
  $("#theme-kawaii").addEventListener("click", () => setTheme("kawaii-teddy"));

  // ============================================================
  // ONBOARDING — first-launch username picker
  // Modal is hidden by default in HTML. We show it here ONLY if
  // the background confirms the user hasn't onboarded yet.
  // If the background SW isn't ready, we retry. After 3 retries
  // (≈4.5s), we give up and keep the modal hidden so the user
  // can still use the extension.
  // ============================================================
  let onbSelectedTheme = "pixel-gamer";

  function setOnbTheme(theme) {
    onbSelectedTheme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    const pBtn = $("#ps-onb-theme-pixel");
    const kBtn = $("#ps-onb-theme-kawaii");
    if (pBtn) pBtn.classList.toggle("active", theme === "pixel-gamer");
    if (kBtn) kBtn.classList.toggle("active", theme === "kawaii-teddy");
    const mascots = { "pixel-gamer": "🎮", "kawaii-teddy": "🧸" };
    const m = $("#ps-onb-mascot");
    if (m) m.textContent = mascots[theme];
  }

  $("#ps-onb-theme-pixel")?.addEventListener("click", () => setOnbTheme("pixel-gamer"));
  $("#ps-onb-theme-kawaii")?.addEventListener("click", () => setOnbTheme("kawaii-teddy"));

  const onbUsernameInput = $("#ps-onb-username");
  const onbSubmitBtn = $("#ps-onb-submit");

  if (onbUsernameInput) {
    onbUsernameInput.addEventListener("input", () => {
      const v = onbUsernameInput.value.trim();
      if (onbSubmitBtn) onbSubmitBtn.disabled = v.length < 2;
    });
    onbUsernameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && onbSubmitBtn && !onbSubmitBtn.disabled) onbSubmitBtn.click();
    });
  }

  if (onbSubmitBtn) {
    onbSubmitBtn.addEventListener("click", () => {
      const username = onbUsernameInput.value.trim().slice(0, 24);
      if (username.length < 2) return;

      onbSubmitBtn.disabled = true;
      onbSubmitBtn.innerHTML = "⏳ Saving...";

      chrome.runtime.sendMessage(
        { action: "COMPLETE_ONBOARDING", username, theme: onbSelectedTheme },
        (res) => {
          if (chrome.runtime.lastError || !res || !res.success) {
            // Even on error, hide the modal so the user isn't stuck.
            hideOnboarding();
            // Still save locally so the user isn't asked again.
            chrome.storage.local.set({ [STORAGE_KEYS.theme]: onbSelectedTheme });
            setTheme(onbSelectedTheme);
            const mn = $("#ps-mascot-name");
            if (mn) mn.textContent = username;
            return;
          }
          // Success
          chrome.storage.local.set({ [STORAGE_KEYS.theme]: onbSelectedTheme });
          setTheme(onbSelectedTheme);
          const mn = $("#ps-mascot-name");
          if (mn) mn.textContent = username;
          hideOnboarding();
          setMascotState("success");
          refreshStats();
          refreshLeaderboard();
        }
      );
    });
  }

  // Mandatory login/onboarding: skip option removed.

  function showOnboarding() {
    const modal = $("#ps-onboarding");
    if (!modal) return;
    modal.style.display = "flex";
    const theme = document.documentElement.getAttribute("data-theme") || "pixel-gamer";
    setOnbTheme(theme);
    const preset = MASCOT_PRESETS[theme];
    if (preset && preset.names && onbUsernameInput) {
      onbUsernameInput.value =
        preset.names[Math.floor(Math.random() * preset.names.length)] +
        " " +
        Math.floor(1000 + Math.random() * 9000);
      if (onbSubmitBtn) onbSubmitBtn.disabled = false;
    }
    setTimeout(() => {
      if (onbUsernameInput) {
        onbUsernameInput.focus();
        onbUsernameInput.select();
      }
    }, 100);
  }

  function hideOnboarding() {
    const modal = $("#ps-onboarding");
    if (modal) modal.style.display = "none";
  }

  // Check if onboarding is needed. Retry up to 3 times if SW isn't ready.
  let _onbRetries = 0;
  function checkOnboarding() {
    try {
      chrome.runtime.sendMessage({ action: "IS_ONBOARDED" }, (res) => {
        if (chrome.runtime.lastError) {
          _onbRetries++;
          if (_onbRetries < 3) {
            setTimeout(checkOnboarding, 800);
          }
          // After 3 retries, keep modal hidden — user can still use the extension.
          return;
        }
        if (res && res.success && res.onboarded) {
          hideOnboarding();
        } else if (res && res.success && !res.onboarded) {
          showOnboarding();
        }
        // If res is null/undefined, treat as not-yet-ready and retry.
        if (!res) {
          _onbRetries++;
          if (_onbRetries < 3) setTimeout(checkOnboarding, 800);
        }
      });
    } catch (_) {
      _onbRetries++;
      if (_onbRetries < 3) setTimeout(checkOnboarding, 800);
    }
  }

  checkOnboarding();

  // ============================================================
  // LEADERBOARD
  // ============================================================
  function refreshLeaderboard() {
    const list = $("#ps-leaderboard-list");
    if (!list) return;
    list.innerHTML = `<div class="ps-history-empty">Loading top solvers...</div>`;
    chrome.runtime.sendMessage({ action: "GET_LEADERBOARD", limit: 10 }, (res) => {
      if (!res?.success || !Array.isArray(res.rows) || res.rows.length === 0) {
        list.innerHTML = `<div class="ps-history-empty">No solvers yet. Be the first to solve a question!</div>`;
        return;
      }
      list.innerHTML = "";
      res.rows.forEach((row, idx) => {
        const item = document.createElement("div");
        item.className = "ps-leaderboard-row";
        item.innerHTML = `
          <span class="ps-lb-rank">${idx + 1}</span>
          <span class="ps-lb-name">${escapeHtml(row.username || "Anonymous")} ${row.theme === "kawaii-teddy" ? "🧸" : "🎮"}</span>
          <span class="ps-lb-stats">
            <strong>${row.solves || 0}</strong>
            ${row.activeMinutes || 0}m
          </span>
        `;
        list.appendChild(item);
      });
    });
  }

  $("#ps-refresh-leaderboard").addEventListener("click", refreshLeaderboard);

  // ----- Tabs -----
  $$(".ps-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".ps-tab").forEach((t) => t.classList.remove("active"));
      $$(".ps-tab-content").forEach((c) => c.classList.remove("active"));
      tab.classList.add("active");
      $(`[data-tab-content="${tab.dataset.tab}"]`).classList.add("active");
      if (tab.dataset.tab === "stats") {
        refreshStats();
        refreshLeaderboard();
      }
      if (tab.dataset.tab === "history") refreshHistory();
    });
  });

  // ----- Toggle helpers -----
  function bindToggle(checkboxId, badgeId, storageKey, action) {
    const cb = $(checkboxId);
    const badge = $(badgeId);
    if (!cb) return;

    chrome.storage.local.get([storageKey], (res) => {
      const on = res[storageKey] !== undefined ? res[storageKey] : false;
      cb.checked = on;
      updateBadge(badge, on);
    });

    cb.addEventListener("change", () => {
      const on = cb.checked;
      chrome.storage.local.set({ [storageKey]: on });
      updateBadge(badge, on);
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, { action, enabled: on }).catch(() => {});
        });
      });
    });
  }

  function updateBadge(badge, on) {
    if (!badge) return;
    badge.textContent = on ? "On" : "Off";
    badge.classList.toggle("on", on);
    badge.classList.toggle("off", !on);
  }

  // ----- Master power toggle -----
  const powerToggle = $("#ps-power-toggle");
  const powerStatus = $("#ps-power-status");
  chrome.storage.local.get([STORAGE_KEYS.enabled], (res) => {
    const on = res[STORAGE_KEYS.enabled] !== false; // default ON
    powerToggle.checked = on;
    powerStatus.textContent = on ? "Active" : "Paused";
    powerStatus.classList.toggle("on", on);
    powerStatus.classList.toggle("off", !on);
  });
  powerToggle.addEventListener("change", () => {
    const on = powerToggle.checked;
    chrome.storage.local.set({ [STORAGE_KEYS.enabled]: on });
    powerStatus.textContent = on ? "Active" : "Paused";
    powerStatus.classList.toggle("on", on);
    powerStatus.classList.toggle("off", !on);
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => chrome.tabs.sendMessage(tab.id, { action: "EXTENSION_POWER_TOGGLED", enabled: on }).catch(() => {}));
    });
  });

  // ----- Quick action buttons (alternative to keyboard shortcuts) -----
  $("#ps-quick-solve")?.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.id) {
        alert("No active tab found.");
        return;
      }
      if (!tab.url || !tab.url.toLowerCase().includes("steptest.in/")) {
        alert("Open https://english.steptest.in/ first, then click Solve.");
        return;
      }
      chrome.tabs.sendMessage(tab.id, { action: "TRIGGER_SOLVE" }, (res) => {
        if (chrome.runtime.lastError) {
          alert("Could not reach the page. Try refreshing the steptest.in tab, then click Solve again.");
          return;
        }
        // Close popup so user can see the solving in action.
        window.close();
      });
    });
  });

  $("#ps-quick-toggle-hud")?.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.id) return;
      if (!tab.url || !tab.url.toLowerCase().includes("steptest.in/")) {
        alert("Open https://english.steptest.in/ first.");
        return;
      }
      chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_HUD" }, () => {
        if (chrome.runtime.lastError) {
          alert("Refresh the steptest.in tab, then try again.");
        }
      });
    });
  });

  // ----- Open the live dashboard in a new tab -----
  $("#ps-open-dashboard")?.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
  });

  bindToggle("#ps-toggle-answer",   "#ps-badge-answer",    STORAGE_KEYS.answerPopup, "ANSWER_POPUP_TOGGLED");
  bindToggle("#ps-toggle-autosubmit","#ps-badge-autosubmit",STORAGE_KEYS.autoSubmit, "AUTO_SUBMIT_TOGGLED");
  bindToggle("#ps-toggle-waitanswer","#ps-badge-waitanswer",STORAGE_KEYS.waitAnswer, "WAIT_ANSWER_TOGGLED");
  bindToggle("#ps-toggle-autoplay", "#ps-badge-autoplay",   STORAGE_KEYS.autoPlay,   "AUTO_PLAY_VIDEO_TOGGLED");
  bindToggle("#ps-toggle-autoloop", "#ps-badge-autoloop",   STORAGE_KEYS.autoLoop,   "AUTO_LOOP_VIDEO_TOGGLED");
  bindToggle("#ps-toggle-antitab",  "#ps-badge-antitab",    STORAGE_KEYS.antiTab,    "ANTI_TAB_SWITCH_TOGGLED");
  bindToggle("#ps-toggle-keepactive","#ps-badge-keepactive",STORAGE_KEYS.keepActive, "KEEP_ACTIVE_TOGGLED");

  // ----- Wait and Answer Custom Duration (Default 200s) -----
  const waitSecondsInput = $("#ps-wait-seconds-input");
  const waitSecondsTitle = $("#ps-wait-seconds-title");
  const waitSecondsDesc = $("#ps-wait-seconds-desc");
  const waitPresetChips = $$(".ps-preset-chip");

  function applyWaitSecondsUI(sec) {
    const cleanSec = Math.max(5, Math.min(3600, parseInt(sec, 10) || 200));
    if (waitSecondsInput && document.activeElement !== waitSecondsInput) {
      waitSecondsInput.value = cleanSec;
    }
    if (waitSecondsTitle) waitSecondsTitle.textContent = cleanSec;
    if (waitSecondsDesc) waitSecondsDesc.textContent = cleanSec;
    waitPresetChips.forEach((chip) => {
      chip.classList.toggle("active", parseInt(chip.dataset.waitPreset, 10) === cleanSec);
    });
  }

  function saveWaitSeconds(sec) {
    const cleanSec = Math.max(5, Math.min(3600, parseInt(sec, 10) || 200));
    applyWaitSecondsUI(cleanSec);
    chrome.storage.local.set({ [STORAGE_KEYS.waitSeconds]: cleanSec });
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, { action: "WAIT_DURATION_CHANGED", seconds: cleanSec }).catch(() => {});
      });
    });
  }

  chrome.storage.local.get([STORAGE_KEYS.waitSeconds], (res) => {
    const initialSec = res[STORAGE_KEYS.waitSeconds] !== undefined ? res[STORAGE_KEYS.waitSeconds] : 200;
    applyWaitSecondsUI(initialSec);
    if (res[STORAGE_KEYS.waitSeconds] === undefined) {
      chrome.storage.local.set({ [STORAGE_KEYS.waitSeconds]: 200 });
    }
  });

  if (waitSecondsInput) {
    waitSecondsInput.addEventListener("change", () => saveWaitSeconds(waitSecondsInput.value));
    waitSecondsInput.addEventListener("input", () => {
      const val = parseInt(waitSecondsInput.value, 10);
      if (val >= 5 && val <= 3600) {
        if (waitSecondsTitle) waitSecondsTitle.textContent = val;
        if (waitSecondsDesc) waitSecondsDesc.textContent = val;
        waitPresetChips.forEach((chip) => {
          chip.classList.toggle("active", parseInt(chip.dataset.waitPreset, 10) === val);
        });
        chrome.storage.local.set({ [STORAGE_KEYS.waitSeconds]: val });
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, { action: "WAIT_DURATION_CHANGED", seconds: val }).catch(() => {});
          });
        });
      }
    });
  }

  waitPresetChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const preset = parseInt(chip.dataset.waitPreset, 10) || 200;
      if (waitSecondsInput) waitSecondsInput.value = preset;
      saveWaitSeconds(preset);
    });
  });

  // Listen for storage changes from on-screen HUD
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local") {
      if (changes[STORAGE_KEYS.waitSeconds] !== undefined) {
        applyWaitSecondsUI(changes[STORAGE_KEYS.waitSeconds].newValue);
      }
      if (changes[STORAGE_KEYS.autoSubmit] !== undefined) {
        const cb = $("#ps-toggle-autosubmit");
        if (cb) cb.checked = !!changes[STORAGE_KEYS.autoSubmit].newValue;
        updateBadge($("#ps-badge-autosubmit"), !!changes[STORAGE_KEYS.autoSubmit].newValue);
      }
      if (changes[STORAGE_KEYS.waitAnswer] !== undefined) {
        const cb = $("#ps-toggle-waitanswer");
        if (cb) cb.checked = !!changes[STORAGE_KEYS.waitAnswer].newValue;
        updateBadge($("#ps-badge-waitanswer"), !!changes[STORAGE_KEYS.waitAnswer].newValue);
      }
    }
  });

  // ----- Speed slider -----
  const speedSlider = $("#ps-speed-slider");
  const speedValue = $("#ps-speed-value");
  chrome.storage.local.get([STORAGE_KEYS.typingDelay], (res) => {
    const v = res[STORAGE_KEYS.typingDelay] !== undefined ? res[STORAGE_KEYS.typingDelay] : 250;
    speedSlider.value = v;
    speedValue.textContent = v + " ms";
  });
  speedSlider.addEventListener("input", () => {
    const v = parseInt(speedSlider.value, 10);
    speedValue.textContent = v + " ms";
    chrome.storage.local.set({ [STORAGE_KEYS.typingDelay]: v });
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => chrome.tabs.sendMessage(tab.id, { action: "PACING_CHANGED", delayMs: v }).catch(() => {}));
    });
  });

  // ----- API Key Pool -----
  const newKeyInput = $("#ps-new-key");
  const addKeyBtn = $("#ps-add-key");
  const toggleKeyVis = $("#ps-toggle-key-vis");
  const keysList = $("#ps-keys-list");
  const keyFeedback = $("#ps-key-feedback");
  const keyCount = $("#ps-key-count");

  function showKeyFeedback(msg, type) {
    keyFeedback.textContent = msg;
    keyFeedback.className = "ps-feedback " + (type || "info") + " visible";
    if (type === "success") setMascotState("success");
    if (type === "error") setMascotState("error");
    setTimeout(() => keyFeedback.classList.remove("visible"), 4000);
  }

  toggleKeyVis.addEventListener("click", () => {
    newKeyInput.type = newKeyInput.type === "password" ? "text" : "password";
  });

  function renderKeys() {
    chrome.storage.local.get([STORAGE_KEYS.apiKeys, STORAGE_KEYS.activeKeyIndex, STORAGE_KEYS.geminiModel], (res) => {
      const keys = Array.isArray(res[STORAGE_KEYS.apiKeys]) ? res[STORAGE_KEYS.apiKeys] : [];
      const activeIdx = typeof res[STORAGE_KEYS.activeKeyIndex] === "number" ? res[STORAGE_KEYS.activeKeyIndex] : 0;

      keyCount.textContent = `${keys.length} / 10`;
      const activeKeyObj = keys[activeIdx];
      const activeModelName = (typeof activeKeyObj === "object" && activeKeyObj?.model) || res[STORAGE_KEYS.geminiModel] || "Auto-Selected";
      const activeModelEl = $("#ps-active-model");
      const modelBadgeEl = $("#ps-model-badge");
      if (activeModelEl) activeModelEl.textContent = activeModelName;
      if (modelBadgeEl) {
        modelBadgeEl.textContent = keys.length > 0 ? "Ready" : "Auto";
        modelBadgeEl.classList.toggle("on", keys.length > 0);
        modelBadgeEl.classList.toggle("off", keys.length === 0);
      }
      keyCount.classList.toggle("on", keys.length > 0);
      keyCount.classList.toggle("off", keys.length === 0);

      keysList.innerHTML = "";
      if (keys.length === 0) {
        keysList.innerHTML = `<div class="ps-history-empty">No API keys yet. Get a free one at <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--accent)">aistudio.google.com</a>.</div>`;
        return;
      }

      keys.forEach((k, idx) => {
        const keyStr = typeof k === "string" ? k : k?.key || "";
        const status = (typeof k === "object" && k.status) ? k.status : (idx === activeIdx ? "active" : "standby");
        const model = (typeof k === "object" && k.model) ? k.model : "Auto";
        const masked = keyStr.slice(0, 6) + "••••••" + keyStr.slice(-4);

        const row = document.createElement("div");
        row.className = "ps-key-item";
        row.innerHTML = `
          <span class="ps-key-status ${status}"></span>
          <div class="ps-key-text">
            ${masked}<br><span style="font-size:9px;color:var(--text-dim)">${model}</span>
          </div>
          <div class="ps-key-actions">
            <button class="ps-key-mini-btn" data-act="refresh" data-idx="${idx}" title="Refresh limit">🔄</button>
            <button class="ps-key-mini-btn" data-act="delete" data-idx="${idx}" title="Delete">🗑</button>
          </div>
        `;
        keysList.appendChild(row);
      });

      $$(".ps-key-mini-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.dataset.idx, 10);
          if (btn.dataset.act === "delete") deleteKey(idx);
          else if (btn.dataset.act === "refresh") refreshSingleKey(idx);
        });
      });
    });
  }

  function deleteKey(idx) {
    chrome.storage.local.get([STORAGE_KEYS.apiKeys, STORAGE_KEYS.activeKeyIndex], (res) => {
      let keys = Array.isArray(res[STORAGE_KEYS.apiKeys]) ? [...res[STORAGE_KEYS.apiKeys]] : [];
      let activeIdx = res[STORAGE_KEYS.activeKeyIndex] || 0;
      keys.splice(idx, 1);
      if (activeIdx >= keys.length) activeIdx = 0;
      chrome.storage.local.set({
        [STORAGE_KEYS.apiKeys]: keys,
        [STORAGE_KEYS.activeKeyIndex]: activeIdx,
        [STORAGE_KEYS.geminiApiKey]: keys[activeIdx]?.key || "",
        [STORAGE_KEYS.geminiModel]: keys[activeIdx]?.model || ""
      }, renderKeys);
    });
  }

  function refreshSingleKey(idx) {
    showKeyFeedback("Refreshing key...", "info");
    chrome.runtime.sendMessage({ action: "REFRESH_SINGLE_KEY", keyIndex: idx }, (res) => {
      if (res?.success) {
        showKeyFeedback(`Key #${idx + 1}: ${res.status}${res.wasRestored ? " (restored!)" : ""}`, "success");
        renderKeys();
      } else {
        showKeyFeedback(res?.error || "Refresh failed", "error");
      }
    });
  }

  addKeyBtn.addEventListener("click", () => {
    const key = newKeyInput.value.trim();
    if (!key) { showKeyFeedback("Paste a Gemini API key first.", "error"); return; }

    chrome.storage.local.get([STORAGE_KEYS.apiKeys], (res) => {
      const keys = Array.isArray(res[STORAGE_KEYS.apiKeys]) ? [...res[STORAGE_KEYS.apiKeys]] : [];
      if (keys.length >= 10) { showKeyFeedback("Pool limit reached (10 keys max).", "error"); return; }
      if (keys.some((k) => (typeof k === "string" ? k : k?.key) === key)) {
        showKeyFeedback("This key is already in the pool.", "error");
        return;
      }

      showKeyFeedback("Verifying key with Google AI Studio...", "info");
      setMascotState("working");

      chrome.runtime.sendMessage({ action: "TEST_API_KEY", apiKey: key, model: "auto" }, (res) => {
        if (res?.success) {
          keys.push({ key, model: res.detectedModel || "Auto-Selected", status: "active", addedAt: Date.now() });
          // Demote previous active to standby
          keys.forEach((k, i) => { if (i < keys.length - 1 && k.status === "active") k.status = "standby"; });
          chrome.storage.local.set({
            [STORAGE_KEYS.apiKeys]: keys,
            [STORAGE_KEYS.activeKeyIndex]: keys.length - 1,
            [STORAGE_KEYS.geminiApiKey]: key,
            [STORAGE_KEYS.geminiModel]: res.detectedModel
          }, () => {
            newKeyInput.value = "";
            showKeyFeedback(`Connected! Model: ${res.detectedModel}`, "success");
            $("#ps-active-model").textContent = res.detectedModelName || res.detectedModel;
            renderKeys();
          });
        } else {
          showKeyFeedback(res?.error || "Key verification failed.", "error");
        }
      });
    });
  });

  $("#ps-refresh-keys").addEventListener("click", () => {
    showKeyFeedback("Refreshing all keys...", "info");
    chrome.runtime.sendMessage({ action: "REFRESH_ALL_KEYS" }, (res) => {
      if (res?.success) {
        const s = res.stats;
        showKeyFeedback(`Done. ${s.ready} ready, ${s.exhausted} exhausted, ${s.invalid} invalid.`, "success");
        renderKeys();
      } else {
        showKeyFeedback(res?.error || "Refresh failed.", "error");
      }
    });
  });

  // ----- Stats tab -----
  function refreshStats() {
    chrome.runtime.sendMessage({ action: "GET_DEVICE_PROFILE" }, (res) => {
      if (!res?.success || !res.profile) return;
      const p = res.profile;
      $("#ps-username").textContent = p.username || "Anonymous";
      $("#ps-stat-solves").textContent = p.solves || 0;
      $("#ps-stat-minutes").textContent = (p.activeMinutes || 0) + "m";
      $("#ps-stat-sessions").textContent = p.sessions || 0;
      const days = p.firstSeen ? Math.max(0, Math.floor((Date.now() - p.firstSeen) / 86400000)) : 0;
      $("#ps-stat-since").textContent = days;
    });

    // Global stats from JSONBin (cached for 5 min in storage)
    chrome.runtime.sendMessage({ action: "GET_GLOBAL_STATS" }, (res) => {
      if (res?.success && res.totals) {
        $("#ps-global-users").textContent = res.totals.users ?? "—";
        $("#ps-global-solves").textContent = res.totals.solves ?? "—";
        $("#ps-global-minutes").textContent = res.totals.activeMinutes ?? "—";
      } else {
        $("#ps-global-users").textContent = "—";
        $("#ps-global-solves").textContent = "—";
        $("#ps-global-minutes").textContent = "—";
      }
    });
  }

  $("#ps-sync-btn").addEventListener("click", () => {
    const fb = $("#ps-sync-feedback");
    fb.textContent = "Uploading your stats to the cloud...";
    fb.className = "ps-feedback info visible";
    chrome.runtime.sendMessage({ action: "FLUSH_ANALYTICS" }, (res) => {
      if (res?.success) {
        fb.textContent = "Synced! You're now counted in global stats.";
        fb.className = "ps-feedback success visible";
        refreshStats();
      } else {
        fb.textContent = res?.error || "Sync failed. Will retry automatically.";
        fb.className = "ps-feedback error visible";
      }
      setTimeout(() => fb.classList.remove("visible"), 4000);
    });
  });

  $("#ps-username-pill").addEventListener("click", () => {
    const newName = prompt("Pick a new display name (max 24 chars):", $("#ps-username").textContent);
    if (!newName || !newName.trim()) return;
    const clean = newName.trim().slice(0, 24);
    chrome.runtime.sendMessage({ action: "UPDATE_DEVICE_PROFILE", patch: { username: clean } }, () => {
      $("#ps-username").textContent = clean;
      // Update mascot name too
      $("#ps-mascot-name").textContent = clean;
    });
  });

  // ----- History tab -----
  function refreshHistory() {
    chrome.storage.local.get(["__prodigy_profile__"], (res) => {
      const profile = res.__prodigy_profile__;
      const list = $("#ps-history-list");
      if (!profile?.history || profile.history.length === 0) {
        list.innerHTML = `<div class="ps-history-empty">No questions solved yet. Open a StepTest page and hit Alt+S.</div>`;
        return;
      }
      list.innerHTML = "";
      profile.history.forEach((h) => {
        const item = document.createElement("div");
        item.className = "ps-history-item";
        const when = new Date(h.at);
        const timeAgo = formatTimeAgo(when);
        item.innerHTML = `
          <div class="ps-history-type">${escapeHtml(h.type || "Q")}</div>
          <div class="ps-history-body">
            <div class="ps-history-snippet">${escapeHtml(h.snippet || "(no snippet)")}</div>
            <div class="ps-history-time">${timeAgo}</div>
          </div>
        `;
        list.appendChild(item);
      });
    });
  }

  function formatTimeAgo(d) {
    const diff = Date.now() - d.getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return s + "s ago";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    return Math.floor(s / 86400) + "d ago";
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  $("#ps-clear-history").addEventListener("click", () => {
    if (!confirm("Clear all question history? This cannot be undone.")) return;
    chrome.runtime.sendMessage({ action: "UPDATE_DEVICE_PROFILE", patch: { history: [] } }, refreshHistory);
  });

  // ----- Listen for solve events from content script (refresh history & celebrate) -----
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "SOLVE_EVENT_LOCAL") {
      setMascotState("success");
      // Refresh history if we're on that tab
      const historyTab = document.querySelector('.ps-tab[data-tab="history"]');
      if (historyTab?.classList.contains("active")) refreshHistory();
      // Refresh stats if active
      const statsTab = document.querySelector('.ps-tab[data-tab="stats"]');
      if (statsTab?.classList.contains("active")) refreshStats();
    }
  });

  // ----- Initial render -----
  renderKeys();
  setMascotState("idle");
  refreshLeaderboard();

  // Fetch latest global stats from cloud once on popup open (non-blocking)
  chrome.runtime.sendMessage({ action: "GET_GLOBAL_STATS" }, () => {});

})();
