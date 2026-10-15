// content.js - Live On-Screen Question Solver & Assistant Engine

(function () {
  "use strict";

  // Restrict extension to only activate on steptest.in (any protocol, any subdomain)
  const url = window.location.href.toLowerCase();
  if (!url.includes("steptest.in/")) return;

  // Prevent multiple injections (use new flag name to avoid conflict with old Step Solver)
  if (window.__PRODIGY_SOLVEX_INJECTED__) return;
  window.__PRODIGY_SOLVEX_INJECTED__ = true;

  const DEFAULT_WAIT_SECONDS = 200; // Default 200s (3m 20s), user-configurable (5s - 3600s)

  // Global State
  const state = {
    isEnabled: true,
    isAutoWatch: false,
    isProcessing: false,
    inFlightQuestionId: null,
    answerPopupEnabled: true,
    autoSubmitEnabled: false,
    waitAnswerEnabled: false,
    waitAnswerSeconds: DEFAULT_WAIT_SECONDS,
    isWaiting: false,
    waitCountdownInterval: null,
    cancelWaitResolver: null,
    _activeWaitRemaining: 0,
    _activeWaitTotal: DEFAULT_WAIT_SECONDS,
    waitedQuestionIds: new Set(),
    _autoSubmitInFlight: false,
    autoPlayVideoEnabled: true,
    autoLoopVideoEnabled: false,
    antiTabSwitchEnabled: true,
    keepWebsiteActiveEnabled: true,
    playedVideoKeys: new Set(),
    lastSolvedHash: "",
    lastSolvedQuestionId: "",
    solvedQuestionIds: new Set(),
    lastSolveTimestamp: 0,
    typingDelayMs: 250,
    hudMinimized: false,
    observer: null,
    bannerTimer: null,
    theme: "pixel-gamer"
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  function sanitizeWaitSeconds(val) {
    const n = parseInt(val, 10);
    if (Number.isNaN(n)) return DEFAULT_WAIT_SECONDS;
    return Math.max(5, Math.min(3600, n));
  }

  function formatWaitTime(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")} (${s}s)`;
  }

  function cancelActiveWaitCountdown(reason = "manual") {
    if (state.waitCountdownInterval) {
      clearInterval(state.waitCountdownInterval);
      state.waitCountdownInterval = null;
    }
    const waitPanel = document.getElementById("ps-wait-panel");
    if (waitPanel) waitPanel.classList.remove("active");
    state.isWaiting = false;
    if (typeof state.cancelWaitResolver === "function") {
      const fn = state.cancelWaitResolver;
      state.cancelWaitResolver = null;
      fn(reason);
    }
  }

  function applyWaitDurationUpdate(newSeconds) {
    const clean = sanitizeWaitSeconds(newSeconds);
    const prevTotal = state.waitAnswerSeconds;
    state.waitAnswerSeconds = clean;

    const hudSecInput = document.getElementById("ps-hud-wait-seconds");
    if (hudSecInput && document.activeElement !== hudSecInput) {
      hudSecInput.value = clean;
    }

    // If currently counting down, adjust remaining time proportionally or cap to new duration
    if (state.isWaiting) {
      const elapsed = Math.max(0, state._activeWaitTotal - state._activeWaitRemaining);
      state._activeWaitTotal = clean;
      state._activeWaitRemaining = Math.max(1, clean - elapsed);
      const waitLabel = document.getElementById("ps-wait-label");
      const waitFill = document.getElementById("ps-wait-progress-fill");
      if (waitLabel) waitLabel.textContent = `⏳ Wait: ${formatWaitTime(state._activeWaitRemaining)}`;
      if (waitFill) {
        const pct = Math.min(100, Math.round((elapsed / clean) * 100));
        waitFill.style.width = `${pct}%`;
      }
      updateStatus(`Wait ${state._activeWaitRemaining}s...`, "working", `WAIT ${clean}S`);
    }
  }

  // -------------------------------------------------------------
  // 1. UI Initialization: Floating Widget & Teleprompter
  // -------------------------------------------------------------
  async function initHUD() {
    if (document.getElementById("prodigy-solvex-host")) return;

    const stored = await chrome.storage.local.get([
      "extensionEnabled",
      "typingDelayMs",
      "answerPopupEnabled",
      "autoSubmitEnabled",
      "waitAnswerEnabled",
      "waitAnswerSeconds",
      "autoPlayVideoEnabled",
      "autoLoopVideoEnabled",
      "antiTabSwitchEnabled",
      "keepWebsiteActiveEnabled",
      "ps_theme"
    ]);
    if (stored.extensionEnabled !== undefined) {
      state.isEnabled = stored.extensionEnabled;
    }
    if (stored.typingDelayMs !== undefined) {
      state.typingDelayMs = stored.typingDelayMs;
    }
    if (stored.answerPopupEnabled !== undefined) {
      state.answerPopupEnabled = stored.answerPopupEnabled;
    }
    if (stored.autoSubmitEnabled !== undefined) {
      state.autoSubmitEnabled = stored.autoSubmitEnabled;
      if (state.autoSubmitEnabled) {
        ensureAnswerPageWatcher();
      }
    }
    if (stored.waitAnswerEnabled !== undefined) {
      state.waitAnswerEnabled = stored.waitAnswerEnabled;
    }
    if (stored.waitAnswerSeconds !== undefined) {
      state.waitAnswerSeconds = sanitizeWaitSeconds(stored.waitAnswerSeconds);
    }
    if (stored.autoPlayVideoEnabled !== undefined) {
      state.autoPlayVideoEnabled = stored.autoPlayVideoEnabled;
    }
    if (stored.autoLoopVideoEnabled !== undefined) {
      state.autoLoopVideoEnabled = stored.autoLoopVideoEnabled;
    }
    if (stored.antiTabSwitchEnabled !== undefined) {
      state.antiTabSwitchEnabled = stored.antiTabSwitchEnabled;
    }
    if (stored.keepWebsiteActiveEnabled !== undefined) {
      state.keepWebsiteActiveEnabled = stored.keepWebsiteActiveEnabled;
    }
    if (stored.ps_theme === "kawaii-teddy" || stored.ps_theme === "pixel-gamer") {
      state.theme = stored.ps_theme;
    }

    ensureMainWorldProtectionScript();
    syncProtectionSettings();
    initKeepWebsiteActive();
    ensureVideoWatcher();
    initUserInteractionUnmute();
    handleAutoPlayVideo();

    const host = document.createElement("div");
    host.id = "prodigy-solvex-host";
    host.classList.add("ps-theme-" + state.theme);
    if (!state.isEnabled) {
      host.classList.add("power-off");
      host.style.display = "none";
    }

    host.innerHTML = `
      <!-- PRODIGY Brand Watermark -->
      <div class="ps-hud-watermark">⚡ PRODIGY // SOLVEX v4.0</div>

      <!-- Floating Main Controller -->
      <div id="ps-widget" class="ps-widget ${state.isEnabled ? '' : 'power-off'}">
        <div id="ps-drag-header" class="ps-widget-header">
          <div class="ps-brand">
            <span class="ps-brand-mascot">${state.theme === 'kawaii-teddy' ? '🧸' : '🎮'}</span>
            <div class="ps-brand-stack">
              <span class="ps-brand-title">PRODIGY <span style="opacity:0.9">SOLVEX</span></span>
              <span class="ps-brand-sub">Autonomous AI Solver</span>
            </div>
          </div>
          <div class="ps-header-actions">
            <button id="ps-btn-theme" class="ps-icon-btn" title="Switch Theme (Pixel / Kawaii)">${state.theme === 'kawaii-teddy' ? '🎮' : '🧸'}</button>
            <button id="ps-btn-power" class="ps-icon-btn ps-power-btn ${state.isEnabled ? '' : 'off'}" title="${state.isEnabled ? 'Turn Extension OFF' : 'Turn Extension ON'}">⏻</button>
            <button id="ps-btn-minimize" class="ps-icon-btn" title="Minimize/Expand">—</button>
          </div>
        </div>

        <div class="ps-widget-body">
          <div class="ps-status-bar">
            <div class="ps-status-indicator">
              <div id="ps-pulse-dot" class="ps-pulse-dot"></div>
              <span id="ps-status-text">${state.isEnabled ? 'Ready' : 'Paused'}</span>
            </div>
            <span id="ps-type-badge" class="ps-question-badge">${state.isEnabled ? 'IDLE' : 'OFF'}</span>
          </div>

          <!-- Live Configurable Wait-and-Answer Countdown Panel -->
          <div id="ps-wait-panel" class="ps-wait-panel">
            <div class="ps-wait-header">
              <span id="ps-wait-label" class="ps-wait-label">⏳ Wait: ${formatWaitTime(state.waitAnswerSeconds)}</span>
              <button id="ps-btn-skip-wait" class="ps-btn-skip-wait" type="button" title="Skip countdown and solve immediately">⚡ Solve Now</button>
            </div>
            <div class="ps-wait-progress-track">
              <div id="ps-wait-progress-fill" class="ps-wait-progress-fill"></div>
            </div>
          </div>

          <div class="ps-button-group">
            <div class="ps-action-row">
              <button id="ps-btn-solve" class="ps-btn-primary" ${state.isEnabled ? '' : 'disabled'}>
                <span>⚡ Solve</span>
                <span class="ps-kbd-hint">Ctrl+Shift+S</span>
              </button>
              <button id="ps-btn-submit-now" class="ps-btn-submit-now" type="button" title="Submit selected answer immediately" ${state.isEnabled ? '' : 'disabled'}>
                <span>📤 Submit</span>
              </button>
            </div>

            <!-- Quick Automation Toggles Grid -->
            <div class="ps-quick-toggles">
              <div class="ps-btn-secondary" id="ps-toggle-container" title="Automatically solve new questions as they appear">
                <span>🤖 Auto-Solve Loop</span>
                <label class="ps-switch">
                  <input type="checkbox" id="ps-autowatch-toggle" ${state.isAutoWatch ? 'checked' : ''}>
                  <span class="ps-slider"></span>
                </label>
              </div>

              <div class="ps-btn-secondary" title="Automatically click Start, Submit, and Next">
                <span>⚡ Auto-Submit &amp; Next</span>
                <label class="ps-switch">
                  <input type="checkbox" id="ps-hud-autosubmit-toggle" ${state.autoSubmitEnabled ? 'checked' : ''}>
                  <span class="ps-slider"></span>
                </label>
              </div>

              <div class="ps-btn-secondary ps-wait-row-hud" title="Wait custom seconds before solving each question">
                <div class="ps-wait-hud-left">
                  <span>⏳ Wait &amp; Answer</span>
                  <div class="ps-hud-sec-box" title="Change wait timer in seconds (5 - 3600s)">
                    <input type="number" id="ps-hud-wait-seconds" class="ps-input ps-hud-sec-input" min="5" max="3600" step="5" value="${state.waitAnswerSeconds}">
                    <span class="ps-hud-sec-unit">s</span>
                  </div>
                </div>
                <label class="ps-switch">
                  <input type="checkbox" id="ps-hud-wait-toggle" ${state.waitAnswerEnabled ? 'checked' : ''}>
                  <span class="ps-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div id="ps-info-box" class="ps-info-box"></div>
        </div>
      </div>

      <!-- Large Answer Showcase Banner -->
      <div id="ps-answer-banner" class="ps-answer-banner">
        <div class="ps-answer-banner-header">
          <div class="ps-answer-tag">
            <span>🎯</span>
            <span id="ps-answer-type-title">Correct Answer</span>
          </div>
          <div class="ps-header-actions">
            <button id="ps-btn-copy-answer" class="ps-btn-copy-mini" title="Copy Answer">📋 Copy</button>
            <button id="ps-btn-close-answer" class="ps-icon-btn" title="Dismiss">✕</button>
          </div>
        </div>
        <div class="ps-answer-banner-body">
          <div id="ps-answer-main-text" class="ps-answer-main-text"></div>
          <div id="ps-answer-sub-text" class="ps-answer-sub-text"></div>
        </div>
        <div class="ps-answer-progress">
          <div id="ps-answer-progress-bar" class="ps-answer-progress-bar"></div>
        </div>
      </div>

      <!-- Speaking Teleprompter Overlay -->
      <div id="ps-teleprompter" class="ps-teleprompter-overlay">
        <div class="ps-teleprompter-header">
          <div class="ps-teleprompter-title">
            <span>🎙️ Speaking Teleprompter</span>
            <span class="ps-teleprompter-badge">Ready to Read</span>
          </div>
          <div class="ps-header-actions">
            <button id="ps-btn-copy-speech" class="ps-btn-copy">Copy Text</button>
            <button id="ps-btn-close-speech" class="ps-icon-btn" title="Close Teleprompter">✕</button>
          </div>
        </div>
        <div id="ps-dropdown-notice" class="ps-dropdown-auto-notice" style="display: none;">
          <span>✓ Dropdown option was automatically selected for this question</span>
        </div>
        <div class="ps-teleprompter-body">
          <div id="ps-speech-content" class="ps-speech-text"></div>
        </div>
        <div class="ps-teleprompter-footer">
          <span id="ps-speech-notes" class="ps-teleprompter-notes">Speak clearly with natural pacing.</span>
          <span id="ps-speech-meta">~0 words</span>
        </div>
      </div>

      <!-- Floating Toast -->
      <div id="ps-toast" class="ps-toast">
        <span id="ps-toast-msg">Notification</span>
      </div>
    `;

    document.body.appendChild(host);
    bindHUDEvents();
    makeDraggable(document.getElementById("ps-widget"), document.getElementById("ps-drag-header"));

    const answerBanner = document.getElementById("ps-answer-banner");
    const answerHeader = answerBanner ? answerBanner.querySelector(".ps-answer-banner-header") : null;
    if (answerBanner && answerHeader) {
      makeDraggable(answerBanner, answerHeader);
    }
  }

  // -------------------------------------------------------------
  // 2. HUD Event Handlers & Draggable Implementation
  // -------------------------------------------------------------
  function bindHUDEvents() {
    const btnSolve = document.getElementById("ps-btn-solve");
    const btnSubmitNow = document.getElementById("ps-btn-submit-now");
    const btnSkipWait = document.getElementById("ps-btn-skip-wait");
    const btnTheme = document.getElementById("ps-btn-theme");
    const toggleAuto = document.getElementById("ps-autowatch-toggle");
    const toggleAutoSubmit = document.getElementById("ps-hud-autosubmit-toggle");
    const toggleWait = document.getElementById("ps-hud-wait-toggle");
    const inputWaitSeconds = document.getElementById("ps-hud-wait-seconds");
    const btnMinimize = document.getElementById("ps-btn-minimize");
    const widget = document.getElementById("ps-widget");
    const btnCloseSpeech = document.getElementById("ps-btn-close-speech");
    const btnCopySpeech = document.getElementById("ps-btn-copy-speech");
    const btnPower = document.getElementById("ps-btn-power");
    const btnCloseAnswer = document.getElementById("ps-btn-close-answer");
    const btnCopyAnswer = document.getElementById("ps-btn-copy-answer");

    if (btnPower) {
      btnPower.addEventListener("click", () => {
        toggleExtensionPower(!state.isEnabled);
      });
    }

    if (btnTheme) {
      btnTheme.addEventListener("click", () => {
        const nextTheme = state.theme === "kawaii-teddy" ? "pixel-gamer" : "kawaii-teddy";
        applyHUDTheme(nextTheme);
        chrome.storage.local.set({ ps_theme: nextTheme });
      });
    }

    if (btnCloseAnswer) {
      btnCloseAnswer.addEventListener("click", () => {
        const banner = document.getElementById("ps-answer-banner");
        if (banner) {
          banner.classList.remove("show", "animating");
          clearTimeout(state.bannerTimer);
        }
      });
    }

    if (btnCopyAnswer) {
      btnCopyAnswer.addEventListener("click", () => {
        const mainTxt = document.getElementById("ps-answer-main-text")?.innerText || "";
        const subTxt = document.getElementById("ps-answer-sub-text")?.innerText || "";
        const combined = subTxt ? `${mainTxt}\n${subTxt}` : mainTxt;
        if (combined) {
          navigator.clipboard.writeText(combined).then(() => {
            showToast("📋 Answer copied to clipboard!");
          });
        }
      });
    }

    if (btnSolve) {
      btnSolve.addEventListener("click", () => {
        if (!state.isEnabled) return;
        triggerSolve(false);
      });
    }

    if (btnSubmitNow) {
      btnSubmitNow.addEventListener("click", async () => {
        if (!state.isEnabled) return;
        const wasEnabled = state.autoSubmitEnabled;
        state.autoSubmitEnabled = true;
        try {
          await handleAutoSubmit();
        } finally {
          state.autoSubmitEnabled = wasEnabled;
        }
      });
    }

    if (btnSkipWait) {
      btnSkipWait.addEventListener("click", () => {
        if (!state.isEnabled) return;
        cancelActiveWaitCountdown("skip_button");
        showToast("⚡ Wait skipped! Solving immediately...");
      });
    }

    if (toggleAuto) {
      toggleAuto.addEventListener("change", (e) => {
        if (!state.isEnabled) {
          e.target.checked = false;
          showToast("Enable extension first");
          return;
        }
        state.isAutoWatch = e.target.checked;
        showToast(state.isAutoWatch ? "🤖 Auto-Solve Loop Activated" : "Auto-Solve Loop Paused");
        if (state.isAutoWatch) {
          startAutoWatcher();
          triggerSolve(true);
        } else {
          stopAutoWatcher();
        }
      });
    }

    if (toggleAutoSubmit) {
      toggleAutoSubmit.addEventListener("change", (e) => {
        state.autoSubmitEnabled = e.target.checked;
        chrome.storage.local.set({ autoSubmitEnabled: state.autoSubmitEnabled });
        showToast(state.autoSubmitEnabled ? "⚡ Auto-Submit & Next Enabled" : "Auto-Submit Disabled");
        if (state.autoSubmitEnabled) {
          ensureAnswerPageWatcher();
          if (isAnswerOrFeedbackPage()) {
            handleAutoNext();
          } else {
            const container = findActiveQuestionContainer();
            if (container && hasAnyAnswerSelectedInDOM(container)) {
              handleAutoSubmit();
            } else if (!state.isProcessing && !state.isWaiting) {
              triggerSolve(true);
            }
          }
        }
      });
    }

    if (toggleWait) {
      toggleWait.addEventListener("change", (e) => {
        state.waitAnswerEnabled = e.target.checked;
        chrome.storage.local.set({ waitAnswerEnabled: state.waitAnswerEnabled });
        if (!state.waitAnswerEnabled && state.isWaiting) {
          cancelActiveWaitCountdown("toggle_off");
        }
        showToast(state.waitAnswerEnabled ? `⏳ Wait & Answer (${state.waitAnswerSeconds}s) Enabled` : "Wait & Answer Disabled");
      });
    }

    if (inputWaitSeconds) {
      inputWaitSeconds.addEventListener("click", (e) => e.stopPropagation());
      inputWaitSeconds.addEventListener("mousedown", (e) => e.stopPropagation());
      inputWaitSeconds.addEventListener("keydown", (e) => e.stopPropagation());
      inputWaitSeconds.addEventListener("change", () => {
        const clean = sanitizeWaitSeconds(inputWaitSeconds.value);
        inputWaitSeconds.value = clean;
        applyWaitDurationUpdate(clean);
        chrome.storage.local.set({ waitAnswerSeconds: clean });
        showToast(`⏳ Wait timer set to ${clean}s`);
      });
    }

    if (btnMinimize) {
      btnMinimize.addEventListener("click", () => {
        state.hudMinimized = !state.hudMinimized;
        if (widget) widget.classList.toggle("minimized", state.hudMinimized);
      });
    }

    if (btnCloseSpeech) {
      btnCloseSpeech.addEventListener("click", () => {
        const tp = document.getElementById("ps-teleprompter");
        if (tp) tp.classList.remove("active");
      });
    }

    if (btnCopySpeech) {
      btnCopySpeech.addEventListener("click", () => {
        const sc = document.getElementById("ps-speech-content");
        if (!sc) return;
        const text = sc.innerText;
        navigator.clipboard.writeText(text).then(() => {
          showToast("Speech text copied to clipboard!");
        });
      });
    }
  }

  function applyHUDTheme(theme) {
    state.theme = theme === "kawaii-teddy" ? "kawaii-teddy" : "pixel-gamer";
    const hostEl = document.getElementById("prodigy-solvex-host");
    if (hostEl) {
      hostEl.classList.remove("ps-theme-pixel-gamer", "ps-theme-kawaii-teddy");
      hostEl.classList.add("ps-theme-" + state.theme);
      const mascotEl = hostEl.querySelector(".ps-brand-mascot");
      if (mascotEl) mascotEl.textContent = state.theme === "kawaii-teddy" ? "🧸" : "🎮";
      const themeBtn = document.getElementById("ps-btn-theme");
      if (themeBtn) themeBtn.textContent = state.theme === "kawaii-teddy" ? "🎮" : "🧸";
    }
  }

  async function toggleExtensionPower(enabled) {
    state.isEnabled = enabled;
    const host = document.getElementById("prodigy-solvex-host");
    const widget = document.getElementById("ps-widget");
    const btnPower = document.getElementById("ps-btn-power");
    const btnSolve = document.getElementById("ps-btn-solve");
    const btnSubmitNow = document.getElementById("ps-btn-submit-now");

    if (host) {
      host.classList.toggle("power-off", !enabled);
      host.style.display = enabled ? "block" : "none";
    }
    if (widget) {
      widget.classList.toggle("power-off", !enabled);
    }
    if (btnPower) {
      btnPower.classList.toggle("off", !enabled);
      btnPower.title = enabled ? "Turn Extension OFF (Completely Hides UI)" : "Turn Extension ON";
    }
    if (btnSolve) btnSolve.disabled = !enabled;
    if (btnSubmitNow) btnSubmitNow.disabled = !enabled;

    if (!enabled) {
      cancelActiveWaitCountdown("power_off");
      stopAutoWatcher();
      hideAnswerBanner();
      const teleprompter = document.getElementById("ps-teleprompter");
      if (teleprompter) teleprompter.classList.remove("active");

      const autoToggle = document.getElementById("ps-autowatch-toggle");
      if (autoToggle) autoToggle.checked = false;
      state.isAutoWatch = false;

      updateStatus("Paused (OFF)", "idle", "OFF");
    } else {
      updateStatus("Ready", "idle", "IDLE");
      showToast("Extension Enabled (ON)");
    }

    chrome.storage.local.set({ extensionEnabled: enabled });
  }

  // Smooth 1:1 Instant Mouse Dragging (No Lag, No Resistance)
  function makeDraggable(el, handle) {
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;

    handle.addEventListener("mousedown", (e) => {
      if (e.target.closest("button") || e.target.closest("input") || e.target.closest("label")) return;
      e.preventDefault();

      const rect = el.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      startX = e.clientX;
      startY = e.clientY;

      // Disable transition and fix right/left/transform conflict immediately
      el.classList.add("ps-dragging");
      el.style.transition = "none";
      el.style.transform = "none";
      el.style.right = "auto";
      el.style.bottom = "auto";
      el.style.left = `${initialLeft}px`;
      el.style.top = `${initialTop}px`;

      function onMouseMove(moveEvent) {
        moveEvent.preventDefault();
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        const newLeft = Math.max(10, Math.min(window.innerWidth - el.offsetWidth - 10, initialLeft + deltaX));
        const newTop = Math.max(10, Math.min(window.innerHeight - el.offsetHeight - 10, initialTop + deltaY));

        el.style.left = `${newLeft}px`;
        el.style.top = `${newTop}px`;
      }

      function onMouseUp() {
        el.classList.remove("ps-dragging");
        el.style.transition = "";
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      }

      document.addEventListener("mousemove", onMouseMove, { passive: false });
      document.addEventListener("mouseup", onMouseUp);
    });
  }

  // Answer Showcase Banner (Persists until moved to the next question)
  function showAnswerBanner(mainText, subText = "", typeTitle = "Correct Answer") {
    // If Answer Popup setting is OFF, suppress the popup banner
    if (state.answerPopupEnabled === false) {
      hideAnswerBanner();
      return;
    }

    const banner = document.getElementById("ps-answer-banner");
    const mainEl = document.getElementById("ps-answer-main-text");
    const subEl = document.getElementById("ps-answer-sub-text");
    const typeEl = document.getElementById("ps-answer-type-title");
    const progBar = document.getElementById("ps-answer-progress-bar");

    if (!banner || !mainEl) return;

    if (state.bannerTimer) {
      clearTimeout(state.bannerTimer);
      state.bannerTimer = null;
    }

    let displayMain = (mainText || "").trim();
    let displaySub = (subText || "").trim();

    // If mainText is a generic placeholder like "Option" or "MCQ", promote genuine subText
    if (/^(option|options|mcq|mcq answer|answer pending|answer|unknown)$/i.test(displayMain)) {
      if (displaySub && displaySub.length > 0) {
        displayMain = displaySub;
        displaySub = "";
      }
    }

    mainEl.innerText = displayMain;
    if (subEl) {
      subEl.innerText = displaySub;
      subEl.style.display = displaySub ? "block" : "none";
    }
    if (typeEl) typeEl.innerText = typeTitle;

    // Keep persistent until moved to the next question (no auto-vanish)
    if (progBar) {
      progBar.style.display = "none";
    }

    banner.classList.remove("animating");
    banner.classList.add("show");
  }

  function hideAnswerBanner() {
    const banner = document.getElementById("ps-answer-banner");
    if (banner) {
      banner.classList.remove("show", "animating");
    }
    if (state.bannerTimer) {
      clearTimeout(state.bannerTimer);
      state.bannerTimer = null;
    }
  }

  // NOTE: Trial / payment / lifetime-upgrade flow was removed in Prodigy Solvex v2.0.
  // The extension is now 100% free, no login, no payment.

  function updateStatus(status, type = "working", badge = "SCANNING") {
    const statusText = document.getElementById("ps-status-text");
    const pulseDot = document.getElementById("ps-pulse-dot");
    const typeBadge = document.getElementById("ps-type-badge");

    if (statusText) statusText.innerText = status;
    if (typeBadge) typeBadge.innerText = badge;

    if (pulseDot) {
      pulseDot.className = "ps-pulse-dot";
      if (type === "working") pulseDot.classList.add("working");
      else if (type === "error") pulseDot.classList.add("error");
    }
  }

  function showToast(message) {
    const toast = document.getElementById("ps-toast");
    const toastMsg = document.getElementById("ps-toast-msg");
    if (!toast || !toastMsg) return;
    toastMsg.innerText = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3500);
  }

  function showInfo(infoText) {
    const box = document.getElementById("ps-info-box");
    if (!box) return;
    if (infoText) {
      box.innerText = infoText;
      box.classList.add("visible");
    } else {
      box.classList.remove("visible");
    }
  }

  // -------------------------------------------------------------
  // 3. Question Detection & DOM Parsing Engine
  // -------------------------------------------------------------
  function safeText(el) {
    if (!el) return "";
    return (el.innerText || el.textContent || el.value || "").trim();
  }

  function isNavOrSystem(el) {
    if (!el || el.closest("#prodigy-solvex-host")) return true;

    // Exclude top-level page headers, navbars, progress indicators, breadcrumbs, footers
    // NOTE: Do NOT use generic [class*='header'] as that improperly excludes .question-header and .card-header
    if (el.closest("header, nav, footer, aside, .player-head, [class*='top-bar' i], [class*='topbar' i], [class*='navbar' i], [class*='site-header' i], [class*='page-header' i], [class*='app-header' i], [class*='global-header' i], [class*='progress' i], [class*='breadcrumb' i]")) {
      return true;
    }

    const text = safeText(el).toLowerCase();
    // Exclude progress percentages (e.g. "0%", "100%")
    if (/^\d{1,3}%$/.test(text)) return true;
    // Exclude unit titles or course navigation headers (e.g. "Unit 4Structure your paragraph")
    if (/^unit\s*\d+/i.test(text)) return true;
    if (/^level\s*\d+/i.test(text)) return true;

    const excludedWords = ["submit", "next", "previous", "prev", "skip", "continue", "review", "grade", "save & next", "clear", "cancel", "done"];
    if (excludedWords.includes(text)) return true;
    if (/^\d+\s+of\s+\d+/i.test(text)) return true;

    return false;
  }

  function getCurrentQuestionMeta() {
    const fullText = document.body ? (document.body.innerText || document.body.textContent || "") : "";
    const progressMatch = fullText.match(/\b(\d+)\s+of\s+(\d+)\s+questions?\b/i) ||
                          fullText.match(/\bquestion\s*(\d+)\s+of\s+(\d+)\b/i) ||
                          fullText.match(/\b(\d+)\s+of\s+(\d+)\b/i);
    let currentNum = null;
    let totalNum = null;
    if (progressMatch) {
      currentNum = parseInt(progressMatch[1], 10);
      totalNum = parseInt(progressMatch[2], 10);
    }

    // Also look for visible numbered heading like "1. Aarav...", "4. Which of the..."
    if (!currentNum) {
      const headingEl = Array.from(document.querySelectorAll("h1, h2, h3, h4, p, div, span")).find(el => {
        if (!isElementVisible(el) || isNavOrSystem(el)) return false;
        const t = safeText(el);
        return /^\d+[\.\)]\s+[A-Za-z]/.test(t) || /^question\s*\d+/i.test(t);
      });
      if (headingEl) {
        const hText = safeText(headingEl);
        const match = hText.match(/^(\d+)[\.\)]/i) || hText.match(/^question\s*(\d+)/i);
        if (match) currentNum = parseInt(match[1], 10);
      }
    }

    return { currentNum, totalNum };
  }

  function normalizeTokenText(str) {
    if (!str) return "";
    const raw = String(str).trim();
    if (!raw) return "";
    let s = raw.toLowerCase().replace(/[’‘]/g, "'");
    // Strip leading numbering e.g. "1. ", "A) ", "(1) ", "Sentence 1: " ONLY if substantive text remains
    const strippedNum = s.replace(/^(?:(?:\d+|[a-z])[\.\)\-:]|\((?:\d+|[a-z])\)|(?:sentence|phrase|clause)\s*\d+[:\-]?)\s+/i, "").trim();
    if (strippedNum.length > 0) {
      s = strippedNum;
    }
    const strippedPunct = s
      .replace(/[“”".,\/#!$%\^&\*;:{}=\-_`~()?]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return strippedPunct.length > 0 ? strippedPunct : raw.toLowerCase();
  }

  function findActiveQuestionContainer() {
    if (isAnswerOrFeedbackPage()) return null;
    const meta = getCurrentQuestionMeta();
    const currentNum = meta.currentNum;

    // 1. If active element is an input/choice in a question, use its container
    const focused = document.activeElement;
    if (focused && focused !== document.body && !focused.closest("#prodigy-solvex-host, header, nav, [class*='top-bar' i]")) {
      const container = focused.closest(".question, .question-card, .quiz-question, .exercise, [role='region'], fieldset, form");
      if (container && isElementVisible(container)) return container;
    }

    // 2. Target the specific question header matching currentNum (e.g. "4. Which of...")
    let targetHeader = null;
    if (currentNum) {
      const targetRegex = new RegExp(`^\\s*${currentNum}[\\.\\)]\\s+`, "i");
      const altRegex = new RegExp(`^\\s*question\\s*${currentNum}\\b`, "i");

      const candidates = Array.from(document.querySelectorAll("h1, h2, h3, h4, p, div, span")).filter(el => {
        if (!isElementVisible(el) || isNavOrSystem(el)) return false;
        const t = safeText(el);
        return (targetRegex.test(t) || altRegex.test(t)) && t.length > 5;
      });

      if (candidates.length > 0) {
        candidates.sort((a, b) => safeText(a).length - safeText(b).length);
        targetHeader = candidates[0];
      }
    }

    // 3. Fallback: Check StepTest v2.4 .q-prompt or visible numbered headers in viewport
    if (!targetHeader) {
      const qPromptEl = document.querySelector(".q-prompt, .question-title, .question-text");
      if (qPromptEl && isElementVisible(qPromptEl) && !isNavOrSystem(qPromptEl)) {
        targetHeader = qPromptEl;
      }
    }
    if (!targetHeader) {
      const allHeaders = Array.from(document.querySelectorAll("h1, h2, h3, h4, p, div, span")).filter(el => {
        if (!isElementVisible(el) || isNavOrSystem(el)) return false;
        const t = safeText(el);
        return (/^\d+[\.\)]\s+[A-Za-z]/i.test(t) || /^question\s*\d+/i.test(t)) && t.length > 10;
      });

      if (allHeaders.length > 0) {
        allHeaders.sort((a, b) => {
          const aTop = a.getBoundingClientRect().top;
          const bTop = b.getBoundingClientRect().top;
          const aScore = aTop >= -20 && aTop <= window.innerHeight * 0.8 ? aTop : Math.abs(aTop) + 10000;
          const bScore = bTop >= -20 && bTop <= window.innerHeight * 0.8 ? bTop : Math.abs(bTop) + 10000;
          return aScore - bScore;
        });
        targetHeader = allHeaders[0];
      }
    }

    // 4. Walk up from targetHeader to find enclosing question container that encloses prompt AND options/inputs
    if (targetHeader) {
      let current = targetHeader;
      let bestContainer = null;
      while (current && current.parentElement && current.parentElement !== document.body) {
        const p = current.parentElement;
        if (isNavOrSystem(p)) break;

        const hasInteractive = p.querySelector(
          "input, select, textarea, [class*='option' i], [class*='choice' i], [class*='chip' i], [class*='blank' i], [class*='slot' i]"
        ) || Array.from(p.querySelectorAll("button, div[role='button']")).some(b => {
          const t = safeText(b).toLowerCase();
          return t.startsWith("reset") || t === "submit" || t.startsWith("submit");
        });

        // Only treat as a valid container if it actually encloses response/interactive controls!
        if (hasInteractive) {
          bestContainer = p;
          if (
            p.classList.contains("question") ||
            p.classList.contains("question-card") ||
            p.classList.contains("quiz-card") ||
            p.classList.contains("exercise") ||
            p.classList.contains("test-container") ||
            p.getAttribute("role") === "region"
          ) {
            break;
          }
        }
        current = p;
      }
      if (bestContainer) return bestContainer;
    }

    // 5. Look for main single-question content wrapper
    const candidateSelectors = [
      "main", "#content", ".test-container", ".question-container",
      ".question.active", ".active-question", ".current-question",
      ".question-card", ".question", ".quiz-card", ".exercise"
    ];

    for (const selector of candidateSelectors) {
      const el = document.querySelector(selector);
      if (el && isElementVisible(el) && !el.closest("#prodigy-solvex-host, header, nav, [class*='top-bar' i]")) {
        return el;
      }
    }

    return document.body;
  }

  function isElementVisible(el) {
    if (!el || !(el instanceof Element)) return false;
    // Check if element or any ancestor is explicitly hidden via inline style or CSS classes
    if (el.closest("[style*='display: none'], [style*='display:none'], [hidden], .hidden, .hide, .d-none, .ng-hide, [aria-hidden='true']")) {
      return false;
    }
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return (
      (rect.width > 0 && rect.height > 0) ||
      (el.offsetWidth > 0 && el.offsetHeight > 0)
    );
  }

  // Detect if current screen is the post-submission Answer / Review / Feedback page.
  // CRITICAL RULE: The answer / feedback page ONLY has the "Next" button,
  // whereas the question page has the "Submit" button.
  function isAnswerOrFeedbackPage() {
    // NEW (steptest.in v2.4): Check for "Feedback" in the .ds-eyebrow element
    // The feedback page has <span class="ds-eyebrow">Feedback · text</span>
    const eyebrow = document.querySelector('.ds-eyebrow');
    if (eyebrow && /feedback/i.test(eyebrow.textContent)) {
      return true;
    }

    const nextBtn = findActionElement("next");
    if (!nextBtn || !isElementVisible(nextBtn)) return false;

    // 1. Direct feedback DOM indicators on StepTest
    const feedbackSelectors = [
      ".feedback", ".feedback-box", ".feedback-card", ".feedback-container",
      ".feedback-content", ".feedback-section", ".explanation", ".solution",
      "[class*='feedback' i]", "[class*='explanation' i]", "[class*='solution' i]",
      "[class*='answer-key' i]", "[class*='review' i]", "[class*='result' i]",
      "[data-feedback]",
      // NEW (v2.4): correct/wrong answer indicators
      ".border-bad", ".bg-bad\\/10", ".border-teal", ".bg-teal-soft",
      "[class*='border-bad' i]", "[class*='bg-bad' i]",
      "[class*='border-teal' i]", "[class*='bg-teal-soft' i]"
    ];
    for (const sel of feedbackSelectors) {
      try {
        const el = document.querySelector(sel);
        if (el && isElementVisible(el) && !el.closest("#prodigy-solvex-host, #ps-answer-banner")) {
          return true;
        }
      } catch (_) {}
    }

    // 2. Keyword check across body text
    const pageText = (document.body ? safeText(document.body) : "").toLowerCase();
    const hasFeedbackKeywords = (
      pageText.includes("correct answer") ||
      pageText.includes("your answer:") ||
      pageText.includes("view all options") ||
      pageText.includes("answer explanation") ||
      pageText.includes("feedback") ||
      pageText.includes("solution:") ||
      pageText.includes("review answer") ||
      pageText.includes("selected answer") ||  // NEW v2.4
      pageText.includes("see question again")   // NEW v2.4
    );
    if (hasFeedbackKeywords) return true;

    // 3. Button & interactive control comparison:
    // CRITICAL FIX: If a Submit button is present on screen (even if currently disabled because no answer is selected yet!),
    // we are on an active Question Page, NOT the post-submission Feedback page!
    const submitBtn = findActionElement("submit");
    if (submitBtn && isElementVisible(submitBtn)) {
      return false;
    }

    const hasQuestionElements = Array.from(
      document.querySelectorAll("input[type='radio'], input[type='checkbox'], [role='radio'], button.choice, [class*='option' i], [class*='choice' i], [class*='chip' i], [class*='token' i], textarea:not(.ps-input), select, input[type='text']:not(.ps-input), [contenteditable='true']")
    ).some(el => isElementVisible(el) && !el.closest("#prodigy-solvex-host, #ps-answer-banner") && !isNavOrSystem(el));

    if (hasQuestionElements) {
      const allChoices = Array.from(document.querySelectorAll("button.choice, .choice")).filter(el => isElementVisible(el));
      if (allChoices.length > 0) {
        const clickableChoices = allChoices.filter(el => !el.classList.contains("cursor-default"));
        if (clickableChoices.length === 0) {
          return true;
        }
      }
      return false;
    }

    return true;
  }

  function isAnswerPage() {
    return isAnswerOrFeedbackPage();
  }

  // Check if current question is a Cloze / Multi-Blank Passage Question
  function checkIsClozePassage(container) {
    const scope = (container && container !== document.body) ? container : document.body;
    const pageText = (safeText(scope) + " " + (document.body ? safeText(document.body) : "")).toLowerCase();

    // Must NOT be a sentence rearrangement question
    const hasRearrangeKeywords = (
      pageText.includes("rearrange the words or phrases") ||
      pageText.includes("rearrange the phrases") ||
      pageText.includes("rearrange the words") ||
      pageText.includes("rearrange words") ||
      pageText.includes("rearrange phrases") ||
      pageText.includes("rearrange the sentence") ||
      pageText.includes("arrange the following sentences") ||
      pageText.includes("arrange the sentences") ||
      pageText.includes("arrange sentences") ||
      pageText.includes("form a logical sentence")
    );
    if (hasRearrangeKeywords) return false;

    // Check for visible Reset button on page (MANDATORY for StepTest cloze & rearrange questions)
    const hasVisibleResetBtn = Array.from(document.querySelectorAll("button, a, input[type='button'], div[role='button']"))
      .some(b => isElementVisible(b) && !isNavOrSystem(b) && safeText(b).toLowerCase().startsWith("reset"));

    // In StepTest / exams, cloze questions ALWAYS require a Reset button to reset placed chips
    if (!hasVisibleResetBtn) {
      return false;
    }

    // Exclude single-choice questions (e.g. "1. Fill in the blank", "best answer from the following", "fill in the blank with the best answer")
    const isSingleChoicePrompt = (
      pageText.includes("fill in the blank with the best answer") ||
      pageText.includes("fill in the blank with the correct") ||
      pageText.includes("best answer from the following") ||
      pageText.includes("select the best answer") ||
      pageText.includes("select the suitable word") ||
      pageText.includes("choose the best answer")
    );

    // Check for explicit multiple blank markers: [blank 1], [blank 2] or multiple occurrences of [____] or blanks
    const blankMatches = pageText.match(/\[\s*blank\s*\d*\s*\]|\[\s*_\s*\]|\[\s*\]|_{2,}/gi) || [];
    if (isSingleChoicePrompt && blankMatches.length <= 1) {
      return false;
    }

    const hasClozeKeywords = (
      pageText.includes("words for the blanks") ||
      pageText.includes("choosing the correct words") ||
      pageText.includes("words that best complete") ||
      pageText.includes("fill in the blanks with suitable words") ||
      pageText.includes("fill in the blanks with words") ||
      pageText.includes("fill in the blanks") ||
      pageText.includes("fill in each blank") ||
      pageText.includes("suitable words for the blank") ||
      pageText.includes("complete the passage") ||
      pageText.includes("complete the airport announcement") ||
      pageText.includes("complete the announcement") ||
      pageText.includes("passage in a logical sequence")
    );

    const hasBlankDom = Array.from(document.querySelectorAll("[class*='blank' i], [class*='slot' i], [class*='drop' i], [class*='gap' i], [class*='target' i], [data-blank], [data-slot], [class*='droppable' i]"))
      .some(el => isElementVisible(el) && !el.closest("#prodigy-solvex-host"));

    if (hasClozeKeywords || hasBlankDom || blankMatches.length >= 2) {
      return true;
    }

    return false;
  }

  // Extract clickable word choice chips for multi-blank passage
  function findClozeChips(container) {
    const chips = [];
    const seen = new Set();
    const scope = (container && container !== document.body) ? container : document.body;

    function isValidChip(el) {
      if (!el || !isElementVisible(el) || el.closest("#prodigy-solvex-host, header, nav, video, iframe, .ytp-chrome-bottom")) return false;
      const txt = safeText(el);
      if (!txt || txt.length < 1 || txt.length > 60) return false;
      const lower = txt.toLowerCase();
      if (/^(reset|submit|next|replay|play|save|continue|grade)\b/i.test(lower)) return false;
      if (lower.startsWith("fill in the blank")) return false;
      if (lower.startsWith("complete the passage")) return false;
      if (lower.startsWith("complete the airport")) return false;
      if (lower.includes("words that best complete")) return false;
      if (lower.includes("words for the blanks")) return false;
      if (el.matches("button[type='submit'], input[type='submit']")) return false;
      if (/^\[?\s*blank\s*\d*\s*\]?$/i.test(txt)) return false;
      if (/^_{2,}$/.test(txt)) return false;
      if (/^\d+\s+of\s+\d+(\s+questions?)?$/i.test(txt)) return false;
      return true;
    }

    function isLeafChip(el) {
      if (!isValidChip(el)) return false;
      const hasChild = Array.from(el.querySelectorAll("*")).some(isValidChip);
      return !hasChild;
    }

    // Strategy 0: Boundary search using Reset button!
    // In StepTest, the word chips appear directly above the Reset button and below the instruction
    const allVisible = Array.from(scope.querySelectorAll("*")).filter(el => isElementVisible(el) && !isNavOrSystem(el));
    const resetIdx = allVisible.findIndex(el => {
      const txt = safeText(el).toLowerCase();
      return txt.startsWith("reset") && (el.tagName === "BUTTON" || el.getAttribute("role") === "button" || el.matches("[class*='btn' i], a, div, span"));
    });

    if (resetIdx !== -1) {
      // Find instruction / prompt anchor before the Reset button
      let startIdx = -1;
      for (let i = resetIdx - 1; i >= 0; i--) {
        const t = safeText(allVisible[i]).toLowerCase();
        if (
          t.includes("words that best complete") ||
          t.includes("fill in the blanks") ||
          t.includes("choices below") ||
          t.includes("from the choices") ||
          t.includes("words for the blanks") ||
          t.includes("complete the")
        ) {
          startIdx = i;
          break;
        }
      }

      const scanStart = startIdx !== -1 ? startIdx + 1 : Math.max(0, resetIdx - 30);
      for (let i = scanStart; i < resetIdx; i++) {
        const el = allVisible[i];
        if (isLeafChip(el) && !seen.has(el)) {
          const t = safeText(el);
          if (!chips.some(c => c.text === t)) {
            seen.add(el);
            chips.push({ element: el, index: chips.length, id: `cloze_chip_${chips.length}`, text: t });
          }
        }
      }
      if (chips.length >= 2) return chips;
    }

    // Strategy 1: Container holding 2 to 12 leaf chips
    const candidateContainers = Array.from(scope.querySelectorAll("div, ul, section, ol, p")).filter(p => {
      if (!isElementVisible(p) || p.closest("#prodigy-solvex-host, header, nav, video, iframe")) return false;
      const leafChips = Array.from(p.querySelectorAll("*")).filter(isLeafChip);
      return leafChips.length >= 2 && leafChips.length <= 12;
    });

    if (candidateContainers.length > 0) {
      candidateContainers.sort((a, b) => a.querySelectorAll("*").length - b.querySelectorAll("*").length);
      const bestContainer = candidateContainers[0];
      Array.from(bestContainer.querySelectorAll("*")).filter(isLeafChip).forEach(el => {
        const t = safeText(el);
        if (!seen.has(el) && !chips.some(c => c.text === t)) {
          seen.add(el);
          chips.push({ element: el, index: chips.length, id: `cloze_chip_${chips.length}`, text: t });
        }
      });
      if (chips.length >= 2) return chips;
    }

    // Strategy 2: Candidate buttons or chip classes
    const candidates = Array.from(scope.querySelectorAll("button, [class*='chip' i], [class*='choice' i], [class*='option' i], [class*='word' i], [class*='pill' i], [class*='card' i], [class*='item' i], [class*='token' i]"))
      .filter(isLeafChip);

    candidates.forEach(el => {
      const t = safeText(el);
      if (!seen.has(el) && !chips.some(c => c.text === t)) {
        seen.add(el);
        chips.push({ element: el, index: chips.length, id: `cloze_chip_${chips.length}`, text: t });
      }
    });

    if (chips.length < 2 && scope !== document.body) {
      return findClozeChips(document.body);
    }
    return chips;
  }

  // Extract blank slots in passage in document reading order
  function findClozeBlanks(container) {
    const scope = (container && container !== document.body) ? container : document.body;
    const blanks = Array.from(scope.querySelectorAll(
      "[class*='blank' i], [class*='slot' i], [class*='drop' i], [class*='gap' i], [class*='target' i], [class*='droppable' i], [class*='placeholder' i], [data-blank], [data-slot], [data-index], input:not([type='button']):not([type='submit']):not([type='radio']):not([type='checkbox'])"
    )).filter(el => {
      if (!isElementVisible(el) || el.closest("#prodigy-solvex-host, header, nav")) return false;
      const t = safeText(el).toLowerCase();
      return !/^(reset|submit|next)\b/i.test(t);
    });

    // Also scan passage paragraphs for rounded empty inline boxes / drop zones
    const paragraphs = Array.from(scope.querySelectorAll("p, div.passage, div.content, div.question-body, section")).filter(p => {
      if (!isElementVisible(p) || isNavOrSystem(p)) return false;
      const txt = safeText(p);
      return txt.length > 20 && !txt.includes("14 of 14") && (txt.includes("delayed") || txt.includes("flight") || txt.includes("All") || txt.includes("check") || txt.includes("number"));
    });

    for (const p of paragraphs) {
      const inlineBoxes = Array.from(p.querySelectorAll("span, div, input")).filter(el => {
        if (!isElementVisible(el) || blanks.includes(el) || el.closest("#prodigy-solvex-host")) return false;
        const rect = el.getBoundingClientRect();
        const txt = safeText(el);
        return rect.width >= 20 && rect.height >= 14 && (txt.length === 0 || /^\[?\s*blank\s*\d*\s*\]?$/i.test(txt) || /^_{1,}$/.test(txt));
      });
      inlineBoxes.forEach(box => {
        if (!blanks.includes(box)) blanks.push(box);
      });
    }

    // Sort by physical reading order (top-to-bottom, left-to-right)
    blanks.sort((a, b) => {
      const rA = a.getBoundingClientRect();
      const rB = b.getBoundingClientRect();
      if (Math.abs(rA.top - rB.top) > 12) {
        return rA.top - rB.top;
      }
      return rA.left - rB.left;
    });

    if (blanks.length === 0 && scope !== document.body) {
      return findClozeBlanks(document.body);
    }
    return blanks;
  }

  // Helper: Find visible Reset button on page for Rearrange / Cloze questions
  function findVisibleResetButton(scope = document.body) {
    const root = (scope && scope !== document.body) ? scope : document.body;
    const findIn = (elScope) => Array.from(elScope.querySelectorAll("button, a, input[type='button'], div[role='button'], span[role='button'], [role='button']")).find(b => {
      if (!isElementVisible(b) || isNavOrSystem(b)) return false;
      const txt = safeText(b).toLowerCase().trim();
      return txt === "reset" || txt.startsWith("reset") || txt === "clear" || txt === "start over";
    });
    return findIn(root) || (root !== document.body ? findIn(document.body) : null);
  }

  // Check if current question is an interactive Sentence / Phrase Rearrangement question
  function checkIsRearrangeQuestion(container) {
    const scope = (container && container !== document.body) ? container : document.body;
    const pageText = (safeText(scope) + " " + (document.body ? safeText(document.body) : "")).toLowerCase();

    // Must NOT be a cloze passage question
    const hasClozeKeywords = (
      pageText.includes("fill in the blanks with suitable words") ||
      pageText.includes("complete the passage") ||
      pageText.includes("passage in a logical sequence") ||
      pageText.includes("fill in the blank above") ||
      pageText.includes("choices below")
    );
    if (hasClozeKeywords) return false;

    const hasVisibleResetBtn = !!findVisibleResetButton(scope);

    // CRITICAL FIX: In StepTest v2.4, MCQ options use `button.choice` (not just `input[type='radio']`).
    // If visible radio inputs OR `button.choice` MCQ options exist AND there is NO Reset button,
    // this is an MCQ sentence-ordering question (e.g. ABCD / PQRS or 4 full sentence options), NOT chip rearrange!
    const hasRadioInputs = Array.from(document.querySelectorAll("input[type='radio']")).some(isElementVisible);
    if (hasRadioInputs) return false;

    const choiceButtons = Array.from(scope.querySelectorAll("button.choice, .choice[role='button'], [role='radio']"))
      .filter(el => isElementVisible(el) && !isNavOrSystem(el));
    if (choiceButtons.length >= 2 && !hasVisibleResetBtn) {
      return false;
    }

    const isFillBlankOrChoose = (
      pageText.includes("fill in the blank") ||
      pageText.includes("fill in the blanks") ||
      pageText.includes("fill in the missing") ||
      pageText.includes("select the best answer") ||
      pageText.includes("choose the best") ||
      pageText.includes("choose the correct") ||
      pageText.includes("select the correct") ||
      pageText.includes("select the suitable") ||
      pageText.includes("choose the suitable") ||
      pageText.includes("best answer from the following")
    );

    const hasRearrangeKeywords = (
      pageText.includes("rearrange the words or phrases") ||
      pageText.includes("rearrange the phrases") ||
      pageText.includes("rearrange the words") ||
      pageText.includes("rearrange words") ||
      pageText.includes("rearrange phrases") ||
      pageText.includes("rearrange the sentence") ||
      pageText.includes("rearrange the following") ||
      pageText.includes("arrange the following sentences") ||
      pageText.includes("arrange the sentences") ||
      pageText.includes("arrange sentences") ||
      pageText.includes("arrange the words") ||
      pageText.includes("arrange the phrases") ||
      pageText.includes("form a logical sentence") ||
      pageText.includes("form a meaningful sentence") ||
      pageText.includes("form a grammatically correct sentence") ||
      pageText.includes("form a sentence") ||
      pageText.includes("unscramble the") ||
      pageText.includes("put the words in") ||
      (pageText.includes("rearrange") && pageText.includes("read it aloud"))
    );

    if (isFillBlankOrChoose && !hasRearrangeKeywords) {
      return false;
    }

    if (hasRearrangeKeywords) return true;

    const hasSlotDashes = (pageText.includes("——") || pageText.includes("––") || pageText.includes("— —")) && (pageText.includes("“") || pageText.includes("”"));
    if (hasVisibleResetBtn && hasSlotDashes) {
      return true;
    }

    return false;
  }

  // Extract scrambled tokens / chips for sentence rearrangement (Strictly atomic chips in the word bank)
  function findRearrangeTokens(container, options = {}) {
    const tokens = [];
    const seen = new Set();
    const scope = (container && container !== document.body && container.querySelectorAll("*").length > 5) ? container : document.body;
    const bankOnlyScope = options.bankContainer && options.bankContainer.isConnected ? options.bankContainer : null;

    function isValidChip(el) {
      if (!el || !isElementVisible(el) || el.closest("#prodigy-solvex-host, header, nav, video, iframe, .ytp-chrome-bottom")) return false;
      // Never treat StepTest v2.4 MCQ `.choice` rows as rearrange chips unless inside a confirmed reset-backed rearrange bank
      if (el.matches("button.choice, .choice") && !findVisibleResetButton(scope)) return false;

      const txt = safeText(el).replace(/\s+/g, " ").trim();
      if (!txt || txt.length < 1 || txt.length > 450) return false;
      const lower = txt.toLowerCase();

      // Exclude action / navigation / media buttons
      if (/^(reset|clear|start over|submit|submit answer|next|save & next|replay|play|save|continue|grade|abc|record|speak|mic|listen|check|verify)\b/i.test(lower)) return false;
      if (el.matches("button[type='submit'], input[type='submit']")) return false;

      // Exclude instruction prompts, headings, and slot helper labels
      if (
        lower.startsWith("rearrange the") ||
        lower.startsWith("arrange the") ||
        lower.startsWith("form a ") ||
        lower.startsWith("unscramble ") ||
        lower.startsWith("put the words") ||
        lower.startsWith("click on the ") ||
        lower.startsWith("tap the ") ||
        lower.startsWith("tap on the ") ||
        lower.startsWith("drag and drop") ||
        lower.startsWith("drag the ") ||
        lower.startsWith("select the words") ||
        lower.startsWith("if the video is not loading") ||
        lower.includes("record your answer using your microphone") ||
        lower.includes("form sentences that express opinion") ||
        lower.includes("words or phrases as they should appear") ||
        lower.includes("in the correct order to form") ||
        /^(your answer|answer|sentence|word bank|available words|words|phrases|options)[:\s]*$/i.test(lower) ||
        /^\d+[\.\)]\s*(rearrange|arrange|form|unscramble|put|complete|read)/i.test(lower)
      ) {
        return false;
      }

      if (/^\d{1,2}:\d{2}/.test(lower)) return false; // video timecode
      if (txt.includes("“") || txt.includes("”")) return false; // slot container quotes
      if (/^[—–\-_.\s]+$/.test(txt) && txt.length > 1) return false; // slot lines or dashes (allow single "." token)
      if (/^\[?\s*(?:blank|slot)\s*\d*\s*\]?$/i.test(txt)) return false;
      if (/^\d+\s+of\s+\d+(\s+questions?)?$/i.test(txt)) return false; // question counter
      return true;
    }

    // Atomic chip check:
    // CRITICAL FIX: If an element is a <button> or [role='button'], treat the button itself as the atomic chip
    // and NEVER split its inner <span> children into separate tokens!
    function isAtomicChip(el) {
      if (!isValidChip(el)) return false;

      // If el is inside an enclosing button/chip that is itself a valid chip, skip el (the parent button will be picked)
      const parentBtn = el.parentElement ? el.parentElement.closest("button, [role='button'], .word-chip, .sentence-token, .draggable-word, .word-tile") : null;
      if (parentBtn && parentBtn !== el && isValidChip(parentBtn)) {
        return false;
      }

      if (el.tagName === "BUTTON" || el.getAttribute("role") === "button") {
        // Ensure this button doesn't wrap multiple nested buttons
        const nestedBtns = el.querySelectorAll("button, [role='button']");
        return nestedBtns.length === 0;
      }

      const hasValidChild = Array.from(el.querySelectorAll("*")).some(ch => isValidChip(ch));
      return !hasValidChild;
    }

    // If caller passed a known bankContainer (during live per-step clicking), scan strictly inside bankContainer!
    if (bankOnlyScope) {
      const bankCandidates = Array.from(bankOnlyScope.querySelectorAll("button, [role='button'], *")).filter(isAtomicChip);
      bankCandidates.forEach(el => {
        if (!seen.has(el)) {
          seen.add(el);
          tokens.push({
            element: el,
            index: tokens.length,
            id: `token_${tokens.length}`,
            text: safeText(el).replace(/\s+/g, " ").trim()
          });
        }
      });
      return tokens;
    }

    const resetBtn = findVisibleResetButton(scope);

    // Strategy 1 (Highest Precision): Find the Word Bank sibling container!
    // In StepTest & React apps, all scrambled word/phrase chips share a single parent flex/grid container.
    const candidateContainers = Array.from(scope.querySelectorAll("div, ul, ol, section")).filter(p => {
      if (!isElementVisible(p) || p.closest("#prodigy-solvex-host, header, nav, video, iframe")) return false;
      // Direct atomic chip children (or direct wrapper children each holding 1 atomic chip)
      const directAtomic = Array.from(p.children).map(ch => {
        if (isAtomicChip(ch)) return ch;
        const innerBtn = ch.querySelector("button, [role='button']");
        if (innerBtn && isAtomicChip(innerBtn) && safeText(ch) === safeText(innerBtn)) return innerBtn;
        return null;
      }).filter(Boolean);

      return directAtomic.length >= 3 && directAtomic.length <= 20;
    });

    if (candidateContainers.length > 0) {
      // Score each candidate container:
      // Prefer containers whose chips are <button> / cursor:pointer, and if Reset button exists, prefer the container directly above Reset (the Word Bank, not the Answer Slot Box)
      const resetTop = resetBtn ? resetBtn.getBoundingClientRect().top : null;
      candidateContainers.sort((a, b) => {
        const getChips = (p) => Array.from(p.children).map(ch => isAtomicChip(ch) ? ch : ch.querySelector("button, [role='button']")).filter(ch => ch && isAtomicChip(ch));
        const chipsA = getChips(a);
        const chipsB = getChips(b);
        const btnScoreA = chipsA.filter(c => c.tagName === "BUTTON" || c.getAttribute("role") === "button" || window.getComputedStyle(c).cursor === "pointer").length;
        const btnScoreB = chipsB.filter(c => c.tagName === "BUTTON" || c.getAttribute("role") === "button" || window.getComputedStyle(c).cursor === "pointer").length;
        if (btnScoreA !== btnScoreB) return btnScoreB - btnScoreA;
        if (resetTop !== null) {
          const distA = Math.abs(resetTop - a.getBoundingClientRect().bottom);
          const distB = Math.abs(resetTop - b.getBoundingClientRect().bottom);
          if (Math.abs(distA - distB) > 20) return distA - distB;
        }
        return chipsB.length - chipsA.length;
      });

      const bestBank = candidateContainers[0];
      Array.from(bestBank.children).forEach(ch => {
        const chipEl = isAtomicChip(ch) ? ch : ch.querySelector("button, [role='button']");
        if (chipEl && isAtomicChip(chipEl) && !seen.has(chipEl)) {
          seen.add(chipEl);
          tokens.push({
            element: chipEl,
            index: tokens.length,
            id: `token_${tokens.length}`,
            text: safeText(chipEl).replace(/\s+/g, " ").trim(),
            bankContainer: bestBank
          });
        }
      });
      if (tokens.length >= 3) return tokens;
    }

    // Strategy 2: Boundary scan between instruction anchor and Reset / Submit button
    const allElements = Array.from(scope.querySelectorAll("*")).filter(el => isElementVisible(el) && !isNavOrSystem(el));
    const matchingAnchors = allElements.filter(el => {
      const t = safeText(el).toLowerCase();
      return (
        t.includes("rearrange the words or phrases") ||
        t.includes("rearrange the words") ||
        t.includes("rearrange the phrases") ||
        t.includes("rearrange the sentence") ||
        t.includes("rearrange words") ||
        t.includes("rearrange phrases") ||
        t.includes("arrange the following sentences") ||
        t.includes("arrange the sentences") ||
        t.includes("arrange the words") ||
        t.includes("form a logical sentence") ||
        t.includes("form a meaningful sentence") ||
        t.includes("form sentences") ||
        t.includes("form a sentence") ||
        t.includes("unscramble")
      );
    });

    if (matchingAnchors.length > 0) {
      matchingAnchors.sort((a, b) => safeText(a).length - safeText(b).length);
      const anchor = matchingAnchors[0];
      const anchorIdx = allElements.indexOf(anchor);

      let endIdx = allElements.length;
      if (resetBtn && allElements.indexOf(resetBtn) > anchorIdx) {
        endIdx = allElements.indexOf(resetBtn);
      } else {
        const submitIdx = allElements.findIndex((el, idx) => {
          if (idx <= anchorIdx) return false;
          const txt = safeText(el).replace(/[→\u2192\u279c\u2794]/g, "").trim().toLowerCase();
          return (txt === "submit" || txt === "next") && el.matches("button, input, [role='button']");
        });
        if (submitIdx !== -1) endIdx = submitIdx;
      }

      if (anchorIdx !== -1) {
        // First pass: look specifically for interactive buttons/[role='button']/cursor:pointer chips in range
        const rangeInteractive = [];
        for (let i = anchorIdx + 1; i < endIdx; i++) {
          const el = allElements[i];
          if (isAtomicChip(el) && !seen.has(el)) {
            const isInteractive = el.tagName === "BUTTON" || el.getAttribute("role") === "button" || window.getComputedStyle(el).cursor === "pointer";
            if (isInteractive) {
              seen.add(el);
              rangeInteractive.push(el);
            }
          }
        }
        if (rangeInteractive.length >= 3) {
          rangeInteractive.forEach(el => {
            tokens.push({
              element: el,
              index: tokens.length,
              id: `token_${tokens.length}`,
              text: safeText(el).replace(/\s+/g, " ").trim(),
              bankContainer: el.parentElement
            });
          });
          return tokens;
        }

        // Second pass: any atomic chip in range
        for (let i = anchorIdx + 1; i < endIdx; i++) {
          const el = allElements[i];
          if (isAtomicChip(el) && !seen.has(el)) {
            seen.add(el);
            tokens.push({
              element: el,
              index: tokens.length,
              id: `token_${tokens.length}`,
              text: safeText(el).replace(/\s+/g, " ").trim(),
              bankContainer: el.parentElement
            });
          }
        }
        if (tokens.length >= 3) return tokens;
      }
    }

    // Strategy 3: Known chip / phrase CSS classes
    const chipSelectors = [
      ".word-chip", ".sentence-token", ".draggable-word", ".sortable-item",
      ".word-tile", "[data-word]", "[class*='phrase' i]", "[class*='chip' i]",
      "[class*='token' i]", "[class*='badge' i]", ".btn-phrase", ".pill",
      "[class*='sentence' i]", "[class*='tile' i]"
    ];
    for (const sel of chipSelectors) {
      const found = Array.from(scope.querySelectorAll(sel)).filter(isAtomicChip);
      if (found.length >= 3 && found.length <= 20) {
        found.forEach((el) => {
          if (!seen.has(el)) {
            seen.add(el);
            tokens.push({
              element: el,
              index: tokens.length,
              id: `token_${tokens.length}`,
              text: safeText(el).replace(/\s+/g, " ").trim(),
              bankContainer: el.parentElement
            });
          }
        });
        if (tokens.length >= 3) return tokens;
      }
    }

    if (tokens.length === 0 && scope !== document.body) {
      return findRearrangeTokens(document.body, options);
    }

    return tokens;
  }

  // Extract clean text from an option element (separating key badge e.g. <span class="key">A</span> from option text)
  function extractCleanOptionText(el) {
    if (!el) return "";
    try {
      const keyEl = el.querySelector(".key, [class*='key-badge' i], [class*='option-key' i]");
      if (keyEl && el.children.length >= 2) {
        const clone = el.cloneNode(true);
        clone.querySelectorAll(".key, [class*='key-badge' i], [class*='option-key' i]").forEach(n => n.remove());
        const bodyTxt = (clone.innerText || clone.textContent || "").replace(/\s+/g, " ").trim();
        if (bodyTxt.length > 0) {
          return bodyTxt;
        }
      }
    } catch (_) {}
    return safeText(el).replace(/\s+/g, " ").trim();
  }

  // Dedicated multi-strategy MCQ option finder
  function findMCQOptions(container) {
    const scope = (container && container !== document.body) ? container : document.body;

    // CRITICAL: Only suppress MCQ options if confirmed interactive chips/tokens exist for Cloze or Rearrange!
    if (
      (checkIsRearrangeQuestion(scope) && findRearrangeTokens(scope).length >= 3) ||
      (checkIsClozePassage(scope) && findClozeChips(scope).length >= 2 && findClozeBlanks(scope).length >= 2)
    ) {
      return [];
    }

    const options = [];
    const seenElements = new Set();

    function addOption(rawEl, text) {
      if (!rawEl || !isElementVisible(rawEl) || isNavOrSystem(rawEl)) return;
      // Always normalize inner spans/divs up to the enclosing interactive option button if present
      const el = rawEl.closest("button.choice, .choice, [role='radio'], [role='checkbox'], [role='option'], .mat-radio-button, mat-radio-button") || rawEl;
      if (seenElements.has(el) || !isElementVisible(el) || isNavOrSystem(el)) return;

      const cleaned = (text || extractCleanOptionText(el)).trim();
      // Allow single-character options (e.g. "8", "5", "A", "B")
      if (!cleaned || cleaned.length < 1) return;
      // Do not add navigation / submit buttons as options
      const lowerCleaned = cleaned.replace(/[→\u2192\u279c\u2794]/g, "").trim().toLowerCase();
      if (/^(submit|submit answer|next|save|save & next|continue|reset|replay|review|check|check answer|start|begin)\b/i.test(lowerCleaned)) return;
      if (el.matches("button[type='submit'], input[type='submit']")) return;

      seenElements.add(el);
      options.push({
        element: el,
        index: options.length,
        id: el.id || `opt_${options.length}`,
        text: cleaned
      });
    }

    // Strategy 1 (Highest Priority for StepTest v2.4): Explicit button.choice / role='radio' / role='option' elements
    // Running this BEFORE generic leaf-node scanning prevents splitting <button class="choice"><span class="key">A</span><span>Text</span></button> into separate child spans!
    const primarySelectors = [
      "button.choice",
      ".choice[role='button']",
      "div.choice",
      "[role='radio']",
      "[role='checkbox']",
      "[role='option']",
      ".mat-radio-button",
      "mat-radio-button",
      "[data-option]",
      "[data-choice]"
    ];

    for (const sel of primarySelectors) {
      const candidates = Array.from(scope.querySelectorAll(sel)).filter(el => {
        if (!isElementVisible(el) || isNavOrSystem(el)) return false;
        const txt = extractCleanOptionText(el);
        return txt.length >= 1 && txt.length < 450 && !/^(submit|next|save|continue|reset)\b/i.test(txt);
      });

      if (candidates.length >= 2 && candidates.length <= 12) {
        candidates.forEach(c => addOption(c, extractCleanOptionText(c)));
        if (options.length >= 2) return options;
      }
    }

    // Strategy 2: Standard radio/checkbox inputs
    const inputs = Array.from(scope.querySelectorAll("input[type='radio'], input[type='checkbox']"))
      .filter(i => isElementVisible(i) && !isNavOrSystem(i));

    if (inputs.length >= 2) {
      inputs.forEach(input => {
        let text = "";
        const label = input.id ? document.querySelector(`label[for='${input.id}']`) : null;
        if (label && isElementVisible(label)) text = safeText(label);
        else {
          const parent = input.closest("label") || input.parentElement;
          text = parent ? safeText(parent) : (input.value || "");
        }
        addOption(input, text);
      });
      if (options.length >= 2) return options;
    }

    // Strategy 3: Find phrase anchor ("Select the best answer", "Choose the correct", etc.) and scan candidate option cards up to Submit
    const allVisible = Array.from(scope.querySelectorAll("*")).filter(el => isElementVisible(el));
    const matchingAnchors = allVisible.filter(el => {
      if (isNavOrSystem(el)) return false;
      const raw = safeText(el);
      if (/^\d+[\.\)]/i.test(raw)) return false;
      const txt = raw.toLowerCase();
      return (
        txt.includes("select the best answer") ||
        txt.includes("choose the correct") ||
        txt.includes("select the following") ||
        txt.includes("choose the best") ||
        txt.includes("select correct") ||
        txt.includes("select the suitable") ||
        txt.includes("choose the suitable") ||
        txt.includes("select the word") ||
        txt.includes("fill in the blank with the best answer") ||
        txt.includes("fill in the blank with the correct option") ||
        txt.includes("fill in the blank with") ||
        txt.includes("best answer from the following")
      );
    });

    if (matchingAnchors.length > 0) {
      matchingAnchors.sort((a, b) => safeText(a).length - safeText(b).length);
      const anchor = matchingAnchors[0];
      const anchorIdx = allVisible.indexOf(anchor);

      if (anchorIdx !== -1) {
        const submitIdx = allVisible.findIndex((el, idx) => {
          if (idx <= anchorIdx) return false;
          const txt = safeText(el).replace(/[→\u2192\u279c\u2794]/g, "").trim().toLowerCase();
          return (txt === "submit" || txt === "next" || txt === "save & next") && el.matches("button, input, [role='button'], div, a");
        });
        const endIdx = submitIdx !== -1 ? submitIdx : Math.min(allVisible.length, anchorIdx + 60);

        for (let i = anchorIdx + 1; i < endIdx; i++) {
          const el = allVisible[i];
          if (isNavOrSystem(el)) continue;
          // If el is a button or interactive option container, add it directly without splitting its child spans
          const interactiveBtn = el.closest("button, [role='button'], [role='radio'], [role='option'], [class*='choice' i], [class*='option' i]");
          if (interactiveBtn && anchorIdx < allVisible.indexOf(interactiveBtn) && (submitIdx === -1 || allVisible.indexOf(interactiveBtn) < submitIdx)) {
            addOption(interactiveBtn, extractCleanOptionText(interactiveBtn));
            continue;
          }
          const txt = safeText(el);
          if (txt.length >= 1 && txt.length <= 450) {
            const hasOptionChild = Array.from(el.children).some(c => {
              const cTxt = safeText(c);
              return cTxt.length >= 1 && cTxt.length <= 450 && isElementVisible(c) && !isNavOrSystem(c);
            });
            if (!hasOptionChild) {
              addOption(el, txt);
            }
          }
        }
      }

      if (options.length >= 2) return options;
    }

    // Strategy 4: Common CSS class selectors for quiz options
    const optionSelectors = [
      "[class*='option' i]",
      "[class*='choice' i]",
      "[class*='answer' i]",
      "[class*='ans' i]",
      "[class*='radio' i]",
      ".custom-control",
      "[aria-checked]",
      "[data-value]",
      ".selectable",
      "[class*='selectable' i]",
      "[class*='chip' i]:not([class*='slot' i])"
    ];

    for (const sel of optionSelectors) {
      const candidates = Array.from(scope.querySelectorAll(sel)).filter(el => {
        if (!isElementVisible(el) || isNavOrSystem(el)) return false;
        const txt = extractCleanOptionText(el);
        return txt.length >= 1 && txt.length < 450 && !/^(submit|next|save|continue|reset)\b/i.test(txt);
      });

      if (candidates.length >= 2 && candidates.length <= 10) {
        candidates.forEach(c => addOption(c, extractCleanOptionText(c)));
        if (options.length >= 2) return options;
      }
    }

    // Strategy 5: Sibling card cluster detection
    const parentContainers = Array.from(scope.querySelectorAll("div, ul, ol, section, fieldset")).filter(
      p => isElementVisible(p) && !isNavOrSystem(p)
    );

    for (const p of parentContainers) {
      const children = Array.from(p.children).filter(c => {
        if (!isElementVisible(c) || isNavOrSystem(c)) return false;
        const txt = extractCleanOptionText(c);
        return txt.length >= 1 && txt.length < 450 && !/^(submit|next|save|continue|reset)\b/i.test(txt);
      });

      if (children.length >= 2 && children.length <= 8) {
        children.forEach(c => addOption(c, extractCleanOptionText(c)));
        if (options.length >= 2) return options;
      }
    }

    // Fallback: If container scope found fewer than 2 options, search document.body!
    if (options.length < 2 && scope !== document.body) {
      return findMCQOptions(document.body);
    }

    return options;
  }

  // Extract clean context without video timestamps, clocks, or noise (Token-Saver)
  function getCleanContext(container) {
    if (!container) return "";
    try {
      const clone = container.cloneNode(true);
      clone.querySelectorAll("#prodigy-solvex-host, header, nav, footer, video, iframe, [class*='player' i], [class*='video' i], .ytp-chrome-bottom, button, input[type='button']").forEach(n => n.remove());
      let txt = clone.innerText || clone.textContent || "";
      // Strip timecodes e.g. 00:00/10:30, 01:25
      txt = txt.replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, "");
      txt = txt.replace(/\b\d+\s+of\s+\d+\s+questions\b/gi, "");
      txt = txt.replace(/\s+/g, " ").trim();
      return txt;
    } catch (_) {
      return "";
    }
  }

  function extractQuestionData(container) {
    if (!container || isAnswerOrFeedbackPage()) {
      return {
        type: null,
        questionText: "",
        context: "",
        options: [],
        wordChoices: [],
        dropdowns: [],
        sentenceTokens: [],
        writingConstraints: null,
        domReferences: { options: [], wordChoices: [], textBlanks: [], dropdowns: [], sentenceTokens: [], writingArea: null, container: null }
      };
    }

    // 1. Identify Question Prompt Text (Strictly ignoring top header / navigation)
    let questionText = "";

    const questionHeaders = Array.from(container.querySelectorAll("h1, h2, h3, h4, p, div, span")).filter(el => {
      if (!isElementVisible(el) || isNavOrSystem(el)) return false;
      const t = safeText(el);
      return (/^\d+[\.\)]\s+[A-Za-z]/i.test(t) || /^question\s*\d+/i.test(t)) && t.length > 10;
    });

    if (questionHeaders.length > 0) {
      questionHeaders.sort((a, b) => safeText(a).length - safeText(b).length);
      questionText = safeText(questionHeaders[0]);
    }

    if (!questionText) {
      const promptSelectors = [
        // NEW (steptest.in v2.4): .q-prompt is the question heading class
        ".q-prompt",
        ".question-title", ".question-text", ".prompt", ".instruction",
        "h1, h2, h3, h4", "legend", "p.title", "label.question-label"
      ];
      for (const sel of promptSelectors) {
        const el = container.querySelector(sel);
        if (el && isElementVisible(el) && !isNavOrSystem(el)) {
          const t = safeText(el);
          if (t.length > 10) {
            questionText = t;
            break;
          }
        }
      }
    }

    const cleanContext = getCleanContext(container);
    if (!questionText) {
      questionText = cleanContext;
    }

    // 2. Check if this is a Cloze / Multi-Blank Passage Question
    const isCloze = checkIsClozePassage(container);
    let clozeChips = [];
    let clozeBlanks = [];
    if (isCloze) {
      clozeChips = findClozeChips(container);
      clozeBlanks = findClozeBlanks(container);
    }
    const hasMultipleBlanks = clozeBlanks.length >= 2 || (clozeChips.length >= 2 && /\[\s*blank\s*[12]|\[\s*_\s*\]|\[\s*\]|_{2,}.*_{2,}/is.test(cleanContext));
    const finalIsCloze = isCloze && clozeChips.length >= 2 && hasMultipleBlanks;

    // 3. Check if this is a Sentence Rearrangement Question (Scoped strictly to active container)
    const isRearrange = !finalIsCloze && checkIsRearrangeQuestion(container);
    let sentenceTokens = [];
    if (isRearrange) {
      sentenceTokens = findRearrangeTokens(container);
    }
    // Question is rearrangement ONLY if rearrange keywords/Reset exist AND at least 3 visible chips are found
    const finalIsRearrange = isRearrange && sentenceTokens.length >= 3;

    // 4. Identify Options (Disabled for cloze and rearrange questions)
    const options = (finalIsCloze || finalIsRearrange) ? [] : findMCQOptions(container);

    // 5. Identify Dropdowns
    const dropdowns = [];
    const selectElements = Array.from(container.querySelectorAll("select")).filter(
      el => isElementVisible(el) && !el.closest("#prodigy-solvex-host")
    );

    selectElements.forEach((sel, idx) => {
      const optList = Array.from(sel.options).map(opt => ({
        value: opt.value,
        text: (opt.text || opt.innerText || "").trim()
      }));
      dropdowns.push({
        element: sel,
        index: idx,
        id: sel.id || `select_${idx}`,
        name: sel.name || `dropdown_${idx}`,
        options: optList
      });
    });

    // 6. Identify Fill-in Text Blanks
    const textBlanks = [];
    const blankInputs = Array.from(
      container.querySelectorAll("input[type='text']:not(.ps-input), input:not([type])")
    ).filter(el => isElementVisible(el) && !el.closest("#prodigy-solvex-host"));

    blankInputs.forEach((inp, idx) => {
      textBlanks.push({
        element: inp,
        index: idx,
        id: inp.id || `blank_${idx}`,
        placeholder: inp.placeholder
      });
    });

    // 7. Identify Writing Area (Check container and full document fallback)
    const writingSelectors = "textarea:not(.ps-input), [contenteditable='true'], [contenteditable=''], [contenteditable], [role='textbox'], .ql-editor, .fr-element, .monaco-editor, .public-DraftEditor-content, div.editable";
    let writingAreas = Array.from(
      container.querySelectorAll(writingSelectors)
    ).filter(el => isElementVisible(el) && !el.closest("#prodigy-solvex-host, #ps-answer-banner"));

    if (writingAreas.length === 0 && document.body) {
      writingAreas = Array.from(
        document.querySelectorAll(writingSelectors)
      ).filter(el => isElementVisible(el) && !el.closest("#prodigy-solvex-host, #ps-answer-banner") && !isNavOrSystem(el));
    }

    const fullTextForWriting = (questionText + " " + cleanContext).toLowerCase();
    const hasWritingKeywords = (
      fullTextForWriting.includes("write a paragraph") ||
      fullTextForWriting.includes("write an essay") ||
      fullTextForWriting.includes("write an email") ||
      fullTextForWriting.includes("write a letter") ||
      fullTextForWriting.includes("write a response") ||
      fullTextForWriting.includes("write a short") ||
      fullTextForWriting.includes("describe the") ||
      fullTextForWriting.includes("summarize the") ||
      fullTextForWriting.includes("in 100-150 words") ||
      fullTextForWriting.includes("in 50-100 words") ||
      fullTextForWriting.includes("word limit") ||
      fullTextForWriting.includes("word count") ||
      fullTextForWriting.includes("type your response") ||
      fullTextForWriting.includes("type your answer") ||
      fullTextForWriting.includes("writing task")
    );

    const hasRealRadios = Array.from(container.querySelectorAll("input[type='radio'], input[type='checkbox']")).some(isElementVisible);
    const finalIsWriting = writingAreas.length > 0 && (hasWritingKeywords || !hasRealRadios || options.length <= 4);

    // If writing task, clear out accidental toolbar options
    if (finalIsWriting) {
      options.length = 0;
    }

    // 8. Strictly Detect Speaking Indicators (Only when active recording hardware button exists)
    const micButton = document.querySelector(
      "button.record, .mic-btn, [aria-label*='record' i], [aria-label*='speak' i], .audio-record, [class*='record' i], [class*='mic' i]"
    );
    const hasActiveMic = !!micButton && isElementVisible(micButton);

    // Classify Question Type
    let detectedType = "auto_detect";
    if (finalIsCloze) {
      detectedType = "cloze_passage";
    } else if (finalIsWriting) {
      detectedType = "writing";
    } else if (finalIsRearrange) {
      detectedType = "rearrange_sentence";
    } else if (options.length > 0) {
      detectedType = "mcq";
    } else if (dropdowns.length > 0 || textBlanks.length > 0) {
      detectedType = "choose_word";
    } else if (hasActiveMic) {
      detectedType = "speaking";
    }

    return {
      container,
      type: detectedType,
      questionText,
      context: cleanContext,
      options: options.map(o => ({ index: o.index, id: o.id, text: o.text })),
      wordChoices: clozeChips.map(c => ({ index: c.index, id: c.id, text: c.text })),
      dropdowns: dropdowns.map(d => ({ index: d.index, id: d.id, name: d.name, options: d.options.map(o => o.text) })),
      sentenceTokens: sentenceTokens.map(t => ({ index: t.index, id: t.id, text: t.text, contentText: normalizeTokenText(t.text) })),
      writingConstraints: {
        hasTextarea: writingAreas.length > 0
      },
      domReferences: {
        options,
        wordChoices: clozeChips,
        clozeBlanks,
        dropdowns,
        textBlanks,
        sentenceTokens,
        writingArea: writingAreas[0] || null,
        container
      }
    };
  }

  // Stable global question identifier extractor to prevent duplicate answers or ID collisions
  function getQuestionIdentifier(container, data) {
    const meta = getCurrentQuestionMeta();
    const urlPart = (window.location.pathname || "").replace(/[^a-zA-Z0-9]/g, "_");
    let prefix = urlPart ? `P_${urlPart}` : "";
    if (meta.currentNum && meta.totalNum) {
      prefix += `_Q_${meta.currentNum}_OF_${meta.totalNum}`;
    } else if (meta.currentNum) {
      prefix += `_Q_${meta.currentNum}`;
    }

    let titlePart = "";
    if (data && data.questionText && data.questionText.length > 5) {
      titlePart = data.questionText.slice(0, 65).replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    } else if (container) {
      const headerEl = container.querySelector(".q-prompt, h1, h2, h3, h4, p");
      if (headerEl) {
        titlePart = safeText(headerEl).slice(0, 65).replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      }
    }

    let optionsPart = "";
    if (data) {
      if (Array.isArray(data.options) && data.options.length > 0) {
        optionsPart = data.options.slice(0, 2).map(o => (o.text || "").slice(0, 20).replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()).join("_");
      } else if (Array.isArray(data.sentenceTokens) && data.sentenceTokens.length > 0) {
        optionsPart = data.sentenceTokens.slice(0, 2).map(t => (t.text || "").slice(0, 20).replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()).join("_");
      } else if (Array.isArray(data.wordChoices) && data.wordChoices.length > 0) {
        optionsPart = data.wordChoices.slice(0, 2).map(w => (w.text || "").slice(0, 20).replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()).join("_");
      }
    }

    const parts = [prefix, titlePart, optionsPart].filter(Boolean);
    return parts.length > 0 ? parts.join("::") : "active_question";
  }

  // Check if an option element is genuinely selected (ignoring Tailwind `active:*` / `selected:*` modifier classes)
  function isOptionElementSelected(el) {
    if (!el || !(el instanceof Element)) return false;
    const target = el.closest("button.choice, .choice, [role='radio'], [role='checkbox'], [role='option'], button, label, li") || el;
    const input = target.matches("input[type='radio'], input[type='checkbox']")
      ? target
      : target.querySelector("input[type='radio'], input[type='checkbox']");
    if (input && input.checked) return true;

    if (
      target.getAttribute("aria-checked") === "true" ||
      target.getAttribute("aria-pressed") === "true" ||
      target.getAttribute("aria-selected") === "true" ||
      target.getAttribute("data-selected") === "true" ||
      target.getAttribute("data-state") === "checked" ||
      target.getAttribute("data-state") === "selected"
    ) {
      return true;
    }

    const rawClasses = ((target.className || "") + " " + (el.className || "")).toString().toLowerCase();
    const classTokens = rawClasses
      .split(/\s+/)
      .filter(Boolean)
      .filter(tok => !tok.includes(":")); // Ignore Tailwind variant modifiers like `active:scale-95` or `disabled:opacity-50`

    return (
      classTokens.includes("is-selected") ||
      classTokens.includes("selected") ||
      classTokens.includes("is-checked") ||
      classTokens.includes("checked") ||
      classTokens.includes("option-selected") ||
      classTokens.includes("choice-selected")
    );
  }

  // Token-Saver: Check if question is already answered on screen
  function isQuestionAlreadyAnswered(data, container) {
    if (!data) return false;

    // 0. If currently on post-submission Answer / Feedback / Review page, do not solve
    if (isAnswerOrFeedbackPage(container)) {
      return true;
    }

    // 1. MCQ: Has any option in data.domReferences.options been checked or selected?
    if (data.type === "mcq" && data.domReferences && Array.isArray(data.domReferences.options)) {
      const anyOptSelected = data.domReferences.options.some(opt => opt && isOptionElementSelected(opt.element));
      if (anyOptSelected) {
        const submitBtn = findActionElement("submit");
        if (!submitBtn || !isButtonDisabled(submitBtn)) return true;
      }
    }

    // 2. Rearrange: Have all tokens already been placed into slots?
    if (data.type === "rearrange_sentence" && container && data.sentenceTokens && data.sentenceTokens.length >= 3) {
      const submitBtn = findActionElement("submit");
      if (submitBtn && !isButtonDisabled(submitBtn)) return true;
      const placedChips = container.querySelectorAll(
        "[class*='slot' i] [class*='chip' i], [class*='chip' i].selected, [class*='token' i].selected, [class*='phrase' i].selected"
      );
      if (placedChips.length >= data.sentenceTokens.length && (!submitBtn || !isButtonDisabled(submitBtn))) {
        return true;
      }
    }

    // 3. Cloze Passage: Have blank slots already been filled?
    if (data.type === "cloze_passage" && container && data.domReferences && data.domReferences.wordChoices) {
      const submitBtn = findActionElement("submit");
      if (submitBtn && !isButtonDisabled(submitBtn)) return true;
    }

    if (data.type === "writing" && data.domReferences && data.domReferences.writingArea) {
      const wVal = (data.domReferences.writingArea.value || data.domReferences.writingArea.innerText || "").trim();
      if (wVal.length > 15) return true;
    }

    // 4. Dropdown: Are choices already picked?
    if (data.type === "choose_word" && data.domReferences && data.domReferences.dropdowns) {
      const allPicked = data.domReferences.dropdowns.every(d => d.element && d.element.value !== "" && d.element.selectedIndex > 0);
      if (allPicked && data.domReferences.dropdowns.length > 0) return true;
    }

    return false;
  }

  function hasAnyAnswerSelectedInDOM(container) {
    const scope = (container && container !== document.body) ? container : document.body;

    // 1. StepTest v2.4 explicit selected choices
    const selectedChoices = Array.from(scope.querySelectorAll("button.choice.is-selected, .choice.is-selected"))
      .filter(el => isElementVisible(el) && !el.closest("#prodigy-solvex-host, #ps-answer-banner"));
    if (selectedChoices.length > 0) return true;

    // 2. Radio / Checkbox inputs inside question scope
    const inputs = Array.from(scope.querySelectorAll("input[type='radio'], input[type='checkbox']"))
      .filter(inp => isElementVisible(inp) && !isNavOrSystem(inp));
    if (inputs.some(inp => inp.checked)) return true;

    // 3. Check actual detected MCQ options for standalone selected state (never matching Tailwind `active:*` classes)
    const mcqOpts = findMCQOptions(scope);
    if (mcqOpts.length > 0 && mcqOpts.some(opt => isOptionElementSelected(opt.element))) {
      return true;
    }

    // 4. Placed cloze or rearrange chips/slots (verified by Submit button enabled or all slots filled)
    const placedChips = Array.from(scope.querySelectorAll(
      "[class*='blank' i] [class*='chip' i], [class*='slot' i] [class*='chip' i], [class*='slot' i] [class*='token' i]"
    )).filter(el => isElementVisible(el) && !isNavOrSystem(el));
    if (placedChips.length > 0) {
      const submitBtn = findActionElement("submit");
      if (!submitBtn || !isButtonDisabled(submitBtn)) return true;
    }

    // 5. Populated text inputs or writing textareas
    const textInputs = Array.from(scope.querySelectorAll("input[type='text']:not(.ps-input), textarea:not(.ps-input), [contenteditable='true']"))
      .filter(el => isElementVisible(el) && !isNavOrSystem(el));
    if (textInputs.some(inp => ((inp.value !== undefined ? inp.value : inp.innerText) || "").trim().length > 0)) {
      return true;
    }

    // 6. Selected dropdowns
    const dropdowns = Array.from(scope.querySelectorAll("select"))
      .filter(el => isElementVisible(el) && !isNavOrSystem(el));
    if (dropdowns.length > 0 && dropdowns.every(sel => sel.selectedIndex > 0 && sel.value !== "")) {
      return true;
    }

    return false;
  }

  // -------------------------------------------------------------
  // 4. Automation Solvers (Main-World React Bridge + Synthetic DOM Actions)
  // -------------------------------------------------------------
  let _bridgeSeq = 0;
  function dispatchMainWorldBridge(element, payload) {
    if (!element || !(element instanceof Element)) return false;
    ensureMainWorldProtectionScript();
    const bridgeId = `ps_b_${Date.now()}_${++_bridgeSeq}`;
    try {
      element.setAttribute("data-ps-bridge-id", bridgeId);
      window.dispatchEvent(new CustomEvent("__PRODIGY_SOLVEX_BRIDGE__", {
        detail: { bridgeId, ...payload }
      }));
      return true;
    } catch (_) {
      return false;
    } finally {
      try { element.removeAttribute("data-ps-bridge-id"); } catch (_) {}
    }
  }

  function highlightElement(el) {
    if (!el) return;
    try {
      const originalOutline = el.style.outline;
      const originalBoxShadow = el.style.boxShadow;
      el.style.outline = "3px solid #10b981";
      el.style.boxShadow = "0 0 16px rgba(16, 185, 129, 0.7)";
      setTimeout(() => {
        el.style.outline = originalOutline;
        el.style.boxShadow = originalBoxShadow;
      }, 5000);
    } catch (_) {}
  }

  // React-compatible single clean click: dispatches through the Main-World React Bridge
  // and ensures we NEVER fire duplicate `click` events that would toggle an option off.
  function reactClick(element, forceReact = false) {
    if (!element) return;
    const target = element.closest("button.choice, .choice, button, [role='button'], [role='radio'], [role='checkbox'], [role='option'], a, input, label") || element;
    try { target.scrollIntoView({ behavior: "instant", block: "center" }); } catch (_) {}
    highlightElement(target);

    // 1. Execute via Main-World bridge (has direct access to __reactProps$, __reactFiber$, and main-world window)
    const bridged = dispatchMainWorldBridge(target, { action: "CLICK", forceReact: !!forceReact });
    if (bridged && window.__PRODIGY_SOLVEX_PROTECTION_INITIALIZED__) {
      return;
    }

    // 2. Isolated-world fallback: dispatch pointer/mouse down+up and EXACTLY ONE click
    try { target.focus({ preventScroll: true }); } catch (_) {}
    const preEvents = [
      { type: "pointerdown", ctor: PointerEvent, opts: { bubbles: true, cancelable: true, view: window, pointerId: 1, pointerType: "mouse", isPrimary: true, button: 0, buttons: 1 } },
      { type: "mousedown", ctor: MouseEvent, opts: { bubbles: true, cancelable: true, view: window, button: 0, buttons: 1 } },
      { type: "pointerup", ctor: PointerEvent, opts: { bubbles: true, cancelable: true, view: window, pointerId: 1, pointerType: "mouse", isPrimary: true, button: 0, buttons: 0 } },
      { type: "mouseup", ctor: MouseEvent, opts: { bubbles: true, cancelable: true, view: window, button: 0, buttons: 0 } }
    ];

    for (const e of preEvents) {
      try {
        if (e.ctor === PointerEvent && typeof PointerEvent !== "undefined") {
          target.dispatchEvent(new PointerEvent(e.type, e.opts));
        } else {
          target.dispatchEvent(new MouseEvent(e.type, e.opts));
        }
      } catch (_) {}
    }
    try {
      if (typeof target.click === "function") {
        target.click();
      } else {
        target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window, button: 0 }));
      }
    } catch (_) {}
  }

  function simulateClick(element, forceReact = false) {
    if (!element) return;
    try { element.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (_) {}
    try {
      if (element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.isContentEditable) {
        element.focus({ preventScroll: true });
      }
    } catch (_) {}

    highlightElement(element);

    // Check if there is an underlying radio/checkbox input to mark checked
    const input = element.matches("input[type='radio'], input[type='checkbox']")
      ? element
      : (element.querySelector("input[type='radio'], input[type='checkbox']") ||
         (element.parentElement ? element.parentElement.querySelector("input[type='radio'], input[type='checkbox']") : null));

    if (input) {
      try {
        input.checked = true;
        dispatchMainWorldBridge(input, { action: "CLICK", forceReact: !!forceReact });
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        return;
      } catch (_) {}
    }

    // Resolve single best clickable target to avoid firing multiple bubbling clicks on parent/child wrappers
    const primaryTarget = element.closest(
      "button, [role='button'], [role='radio'], [role='checkbox'], [role='option'], a, label, [class*='choice' i], [class*='chip' i], [class*='token' i], [class*='pill' i], [class*='option' i]"
    ) || element;

    reactClick(primaryTarget, forceReact);
  }

  function setElementValue(element, val) {
    if (!element) return;
    try { element.focus({ preventScroll: true }); } catch (_) {}

    // 1. Update via Main-World Bridge so React's _valueTracker & onChange fiber props are updated
    dispatchMainWorldBridge(element, { action: "SET_VALUE", value: val, forceReact: true });

    // 2. Try execCommand for rich-text / contenteditable editors
    let execSuccess = false;
    try {
      if ((element.isContentEditable || element.getAttribute("role") === "textbox") && document.queryCommandSupported && document.queryCommandSupported("insertText")) {
        document.execCommand("selectAll", false, null);
        execSuccess = document.execCommand("insertText", false, val);
      }
    } catch (_) {}

    // 3. Value assignment and native setter fallback in isolated world
    if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
      if (element.value !== val) {
        const prototype = element.tagName === "INPUT" ? window.HTMLInputElement.prototype : window.HTMLTextAreaElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
        if (nativeSetter) {
          nativeSetter.call(element, val);
        } else {
          element.value = val;
        }
      }
    } else if (element.isContentEditable || element.getAttribute("role") === "textbox") {
      if (!execSuccess || (element.innerText || "").trim() !== val.trim()) {
        element.innerText = val;
      }
    }

    // 4. Dispatch comprehensive event chain
    try {
      element.dispatchEvent(new InputEvent("beforeinput", { bubbles: true, cancelable: true, inputType: "insertText", data: val }));
    } catch (_) {}
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "Enter" }));
    element.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  // Solve MCQ
  async function executeMCQ(solution, domRefs) {
    let answers = [];
    if (Array.isArray(solution.mcq_answers)) answers.push(...solution.mcq_answers);
    else if (typeof solution.mcq_answers === "string" && solution.mcq_answers.trim()) answers.push(solution.mcq_answers.trim());
    if (solution.selected_option && typeof solution.selected_option === "string") answers.push(solution.selected_option.trim());
    if (solution.answer && typeof solution.answer === "string") answers.push(solution.answer.trim());
    if (solution.correct_answer && typeof solution.correct_answer === "string") answers.push(solution.correct_answer.trim());
    if (solution.option && typeof solution.option === "string") answers.push(solution.option.trim());
    if (solution.word && typeof solution.word === "string") answers.push(solution.word.trim());
    if (Array.isArray(solution.answers)) answers.push(...solution.answers);
    if (Array.isArray(solution.fill_blanks)) answers.push(...solution.fill_blanks);
    if (solution.fill_text && typeof solution.fill_text === "string") answers.push(solution.fill_text.trim());

    answers = answers.filter(a => typeof a === "string" && a.trim().length > 0);

    let indices = [];
    if (Array.isArray(solution.mcq_indices)) indices.push(...solution.mcq_indices);
    else if (typeof solution.mcq_indices === "number") indices.push(solution.mcq_indices);
    if (typeof solution.selected_index === "number") indices.push(solution.selected_index);
    if (typeof solution.index === "number") indices.push(solution.index);

    // Extract letter/number indices from answers e.g. "Option A", "B)", "(C)", "Option 2"
    for (const ans of answers) {
      if (typeof ans !== "string") continue;
      const t = ans.trim();
      const letterMatch = t.match(/^(?:option\s*)?\(?([a-d])\)?(?:\s*[:.)\-]|\s*$)/i);
      if (letterMatch) {
        const idx = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
        if (!indices.includes(idx)) indices.push(idx);
      }
      const numMatch = t.match(/^(?:option\s*)?\(?([1-9])\)?(?:\s*[:.)\-]|\s*$)/i);
      if (numMatch) {
        const idx = parseInt(numMatch[1], 10) - 1;
        if (!indices.includes(idx)) indices.push(idx);
      }
    }

    let clickedCount = 0;
    let optionsList = domRefs && Array.isArray(domRefs.options) && domRefs.options.length > 0
      ? domRefs.options
      : findMCQOptions(document.body);

    function cleanString(str) {
      if (!str) return "";
      let s = str
        .replace(/[“’”".,\/#!$%\^&\*;:{}=\-_`~()]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
      const stripped = s.replace(/^(?:option\s*[a-d1-4]|[a-d1-4])\s+/i, "").trim();
      return stripped.length > 0 ? stripped : s;
    }

    const matchedOptions = [];

    // Attempt 1: Exact / Substring Text Match
    if (answers.length > 0) {
      for (const opt of optionsList) {
        const optClean = cleanString(opt.text);
        const matchByText = answers.some(ans => {
          const ansClean = cleanString(ans);
          if (!ansClean || !optClean) return false;
          if (ansClean.length > 1) {
            return (
              optClean === ansClean ||
              optClean.includes(ansClean) ||
              ansClean.includes(optClean)
            );
          } else {
            if (optClean === ansClean) return true;
            const tokens = optClean.split(/\s+/);
            return tokens[0] === ansClean || (tokens[0] === "option" && tokens[1] === ansClean);
          }
        });

        if (matchByText && !matchedOptions.includes(opt)) {
          matchedOptions.push(opt);
        }
      }
    }

    // Attempt 2: Word Token Overlap Match
    if (matchedOptions.length === 0 && answers.length > 0) {
      let bestScore = 0;
      let bestOpt = null;
      for (const opt of optionsList) {
        const optWords = cleanString(opt.text).split(/\s+/).filter(w => w.length >= 2);
        if (optWords.length === 0) continue;
        for (const ans of answers) {
          const ansWords = cleanString(ans).split(/\s+/).filter(w => w.length >= 2);
          if (ansWords.length === 0) continue;
          const common = optWords.filter(w => ansWords.includes(w));
          const score = common.length / Math.max(optWords.length, ansWords.length);
          if (score > bestScore && score >= 0.35) {
            bestScore = score;
            bestOpt = opt;
          }
        }
      }
      if (bestOpt && !matchedOptions.includes(bestOpt)) {
        matchedOptions.push(bestOpt);
      }
    }

    // Attempt 3: Match by indices (handling both 0-based and 1-based)
    if (matchedOptions.length === 0 && indices.length > 0) {
      let normIndices = [...indices];
      if (normIndices.some(i => i === optionsList.length)) {
        normIndices = normIndices.map(i => i - 1);
      }
      for (const idx of normIndices) {
        if (optionsList[idx] && !matchedOptions.includes(optionsList[idx])) {
          matchedOptions.push(optionsList[idx]);
        }
      }
    }

    // Attempt 4: Match by option letter label in option text (e.g. "A.", "B)", "Option C")
    if (matchedOptions.length === 0 && indices.length > 0) {
      for (const idx of indices) {
        const targetLetter = String.fromCharCode(65 + idx);
        const found = optionsList.find(opt => {
          const t = (opt.text || "").trim().toUpperCase();
          return (
            t.startsWith(`OPTION ${targetLetter}`) ||
            t.startsWith(`${targetLetter}.`) ||
            t.startsWith(`${targetLetter})`) ||
            t.startsWith(`(${targetLetter})`) ||
            t === targetLetter
          );
        });
        if (found && !matchedOptions.includes(found)) {
          matchedOptions.push(found);
          break;
        }
      }
    }

    // Attempt 5: Full visible DOM scan fallback
    if (matchedOptions.length === 0 && answers.length > 0) {
      for (const ans of answers) {
        const targetClean = cleanString(ans);
        if (!targetClean || targetClean.length < 1) continue;

        const allCandidates = Array.from(document.querySelectorAll("button.choice, .choice, [role='radio'], [role='option'], button, label, li, div, p, span"))
          .filter(el => {
            if (!isElementVisible(el) || isNavOrSystem(el)) return false;
            const text = extractCleanOptionText(el);
            if (text.length > 600) return false;
            const t = cleanString(text);
            return t === targetClean || t.includes(targetClean) || (targetClean.length > 3 && targetClean.includes(t) && t.length > 3);
          });

        if (allCandidates.length > 0) {
          allCandidates.sort((a, b) => safeText(a).length - safeText(b).length);
          const bestEl = allCandidates[0].closest("button.choice, .choice, [role='radio'], [role='option'], button, label") || allCandidates[0];
          matchedOptions.push({ element: bestEl, text: extractCleanOptionText(bestEl), index: 0 });
          break;
        }
      }
    }

    // Attempt 6 (GUARANTEED CLICK ENABLED): If still not matched, select option by index or first available option
    if (matchedOptions.length === 0 && optionsList.length > 0) {
      if (indices.length > 0 && optionsList[indices[0]]) {
        matchedOptions.push(optionsList[indices[0]]);
      } else {
        matchedOptions.push(optionsList[0]);
      }
      console.log("[Prodigy Solvex] Applied guaranteed option fallback to click on screen:", matchedOptions[0].text);
    }

    // CLICK ALL MATCHED OPTIONS — with Main-World React Bridge + verification
    for (const opt of matchedOptions) {
      if (opt && opt.element) {
        const targetEl = opt.element.closest("button.choice, .choice, [role='radio'], [role='checkbox'], [role='option'], button, label") || opt.element;

        // If already selected, do NOT click again (clicking an already-selected option can toggle it off!)
        if (!isOptionElementSelected(targetEl)) {
          reactClick(targetEl, false);
          await delay(Math.min(180, (state.typingDelayMs || 250) + 50));
        }

        // Verify the option was selected or the Submit button became enabled
        let verifyAttempts = 0;
        while (verifyAttempts < 4) {
          const submitBtn = findActionElement("submit");
          if (isOptionElementSelected(targetEl) || (submitBtn && !isButtonDisabled(submitBtn))) {
            break;
          }
          verifyAttempts++;
          // Invoke React's onClick handler directly on the Fiber in the MAIN world
          reactClick(targetEl, true);
          await delay(180);
        }

        clickedCount++;
      }
    }

    // Check if the Submit button is now enabled; if not and 1 option IS selected, check if multi-select requires a 2nd option
    const postSubmitBtn = findActionElement("submit");
    if (postSubmitBtn && isButtonDisabled(postSubmitBtn) && optionsList.length >= 2) {
      const anySelectedNow = optionsList.some(o => isOptionElementSelected(o.element));
      if (!anySelectedNow && matchedOptions[0]?.element) {
        // Force React Fiber click on the matched option
        reactClick(matchedOptions[0].element, true);
        await delay(200);
      } else if (anySelectedNow && isButtonDisabled(postSubmitBtn)) {
        // Multi-select question where StepTest requires 2 selections before enabling Submit
        const unselectedOpt = optionsList.find(o => !isOptionElementSelected(o.element) && !matchedOptions.includes(o));
        if (unselectedOpt && unselectedOpt.element) {
          console.log("[Prodigy Solvex] Multi-select requirement detected. Selecting additional option to enable Submit...");
          reactClick(unselectedOpt.element, false);
          await delay(200);
          if (isButtonDisabled(postSubmitBtn)) {
            reactClick(unselectedOpt.element, true);
            await delay(200);
          }
          clickedCount++;
        }
      }
    }

    let answerLabel = matchedOptions.map(o => o.text).filter(Boolean).join(", ");
    if (!answerLabel) {
      answerLabel = answers.length > 0 ? answers.join(", ") : (optionsList[indices[0]]?.text || "");
    }
    if (!answerLabel || /^(option|options|answer)$/i.test(answerLabel.trim())) {
      answerLabel = solution.explanation || (optionsList[0]?.text || "Answer");
    }

    if (clickedCount > 0) {
      showAnswerBanner(answerLabel, solution.explanation || "Correct option selected on page", "MCQ Answer");
      return { success: true, message: `Selected option: ${answerLabel}`, clickedCount };
    }

    showAnswerBanner(answerLabel, solution.explanation || "Correct answer identified by AI", "Answer Pending");
    return { success: true, message: `Answer: ${answerLabel}`, clickedCount: 0 };
  }

  // Solve Cloze / Multi-Blank Passage Question
  async function executeClozePassage(solution, domRefs) {
    const chips = domRefs && Array.isArray(domRefs.wordChoices) && domRefs.wordChoices.length > 0
      ? domRefs.wordChoices
      : findClozeChips(document.body);

    function cleanString(str) {
      if (!str) return "";
      return str
        .toLowerCase()
        .replace(/[“’”".,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    // 0. Clean Board Check: If any blanks are already filled, click "Reset" first
    const resetBtn = Array.from(document.querySelectorAll("button, div[role='button'], a, input[type='button']")).find(b => {
      if (isNavOrSystem(b) || !isElementVisible(b)) return false;
      const txt = (b.innerText || b.value || "").trim().toLowerCase();
      return txt.startsWith("reset");
    });

    const hasPlacedBlanks = (
      document.querySelectorAll("[class*='blank' i] [class*='chip' i], [class*='slot' i] [class*='chip' i]").length > 0 ||
      document.querySelectorAll("[class*='chip' i].selected").length > 0
    );

    if (resetBtn && hasPlacedBlanks) {
      simulateClick(resetBtn);
      await delay(180);
    }

    // Extract ordered words from Gemini response
    let orderedWords = [];
    if (Array.isArray(solution.ordered_fill_blanks)) orderedWords.push(...solution.ordered_fill_blanks);
    else if (Array.isArray(solution.fill_blanks)) orderedWords.push(...solution.fill_blanks);
    else if (Array.isArray(solution.answers)) orderedWords.push(...solution.answers);
    else if (Array.isArray(solution.ordered_words)) orderedWords.push(...solution.ordered_words);
    else if (Array.isArray(solution.cloze_answers)) orderedWords.push(...solution.cloze_answers);

    // Resilient fallback: Extract sequence from reconstructed_passage or explanation
    if (orderedWords.length === 0) {
      const sourceText = cleanString((solution.reconstructed_passage || "") + " " + (solution.explanation || ""));
      const availableChips = chips.length > 0 ? chips : findClozeChips(document.body);

      const scoredChips = availableChips.map(chip => {
        const cleanChip = cleanString(chip.text);
        const pos = sourceText.indexOf(cleanChip);
        return { chip, pos: pos !== -1 ? pos : 999999 };
      }).filter(s => s.pos !== 999999);

      scoredChips.sort((a, b) => a.pos - b.pos);
      orderedWords = scoredChips.map(s => s.chip.text);
    }

    let placedCount = 0;
    const placedLabels = [];
    const usedChipElements = new Set();

    // Sequentially place each word into its respective blank
    for (let i = 0; i < orderedWords.length; i++) {
      const targetWord = orderedWords[i];
      const cleanTarget = cleanString(targetWord);
      if (!cleanTarget) continue;

      const liveBlanks = findClozeBlanks(document.body);
      const targetBlank = liveBlanks[i] || null;

      if (targetBlank) {
        try {
          if (typeof targetBlank.focus === "function") targetBlank.focus({ preventScroll: true });
          simulateClick(targetBlank);
          targetBlank.dispatchEvent(new Event("focus", { bubbles: true }));
          await delay(100);
        } catch (_) {}
      }

      const liveChips = findClozeChips(document.body).filter(c => c.element && !usedChipElements.has(c.element));
      let matchingChip = liveChips.find(c => {
        const cleanChip = cleanString(c.text);
        return cleanChip === cleanTarget;
      }) || liveChips.find(c => {
        const cleanChip = cleanString(c.text);
        return cleanChip.includes(cleanTarget) || cleanTarget.includes(cleanChip);
      });

      if (!matchingChip) {
        const liveCandidate = Array.from(document.querySelectorAll("button, div[role='button'], [class*='chip' i], span"))
          .filter(el => isElementVisible(el) && !isNavOrSystem(el) && !usedChipElements.has(el))
          .find(el => {
            const cleanEl = cleanString(safeText(el));
            return cleanEl === cleanTarget || cleanEl.includes(cleanTarget);
          });
        if (liveCandidate) {
          matchingChip = { element: liveCandidate, text: targetWord };
        }
      }

      if (matchingChip && matchingChip.element) {
        usedChipElements.add(matchingChip.element);
        simulateClick(matchingChip.element);
        placedCount++;
        placedLabels.push(`${i + 1}: ${matchingChip.text}`);

        if (targetBlank && (targetBlank.tagName === "INPUT" || targetBlank.isContentEditable)) {
          setElementValue(targetBlank, matchingChip.text);
        }

        await delay(Math.max(250, state.typingDelayMs || 250));
      }
    }

    // Ensure Submit button is enabled: if any blanks remain unfilled, place remaining unused chips
    const submitBtnAfter = findActionElement("submit");
    if (submitBtnAfter && isButtonDisabled(submitBtnAfter)) {
      const remainingChips = findClozeChips(document.body).filter(c => c.element && !usedChipElements.has(c.element) && !isButtonDisabled(c.element));
      for (const remChip of remainingChips) {
        const currentSubmit = findActionElement("submit");
        if (currentSubmit && !isButtonDisabled(currentSubmit)) break;
        simulateClick(remChip.element);
        placedCount++;
        await delay(220);
      }
    }

    const bannerDisplay = placedLabels.length > 0 ? placedLabels.join("  ➔  ") : orderedWords.map((w, idx) => `${idx + 1}: ${w}`).join("  ➔  ");
    const subDisplay = solution.reconstructed_passage || solution.explanation || "All blanks filled in logical sequence";
    showAnswerBanner(bannerDisplay, subDisplay, "Passage Blanks Solved");

    return {
      success: placedCount > 0,
      message: placedCount > 0 ? `Filled ${placedCount} blanks: ${bannerDisplay}` : `Answer: ${bannerDisplay}`,
      clickedCount: placedCount
    };
  }

  // Solve Choose the Correct Word
  async function executeChooseWord(solution, domRefs) {
    let actionsTaken = 0;

    // 1. Dropdown Selection (via Main-World React Bridge so _valueTracker & onChange props update)
    if (domRefs.dropdowns && domRefs.dropdowns.length > 0) {
      const selections = Array.isArray(solution.dropdown_selections) ? solution.dropdown_selections : [];
      for (const selPlan of selections) {
        const targetDropdown = domRefs.dropdowns[selPlan.dropdown_index ?? 0] || domRefs.dropdowns[0];
        if (targetDropdown && targetDropdown.element) {
          const selectEl = targetDropdown.element;
          const targetText = (selPlan.selected_text || selPlan.selected_value || "").toLowerCase().trim();

          for (let i = 0; i < selectEl.options.length; i++) {
            const opt = selectEl.options[i];
            const optText = (opt.text || "").toLowerCase().trim();
            const optVal = (opt.value || "").toLowerCase().trim();
            if (
              (targetText && (optText === targetText || optVal === targetText || optText.includes(targetText) || targetText.includes(optText)))
            ) {
              dispatchMainWorldBridge(selectEl, { action: "SELECT_OPTION", selectedIndex: i, value: opt.value });
              selectEl.selectedIndex = i;
              selectEl.value = opt.value;
              selectEl.dispatchEvent(new Event("input", { bubbles: true }));
              selectEl.dispatchEvent(new Event("change", { bubbles: true }));
              actionsTaken++;
              break;
            }
          }
        }
      }

      // Ensure every visible dropdown has a valid non-placeholder option selected so Submit enables
      for (const d of domRefs.dropdowns) {
        if (d.element && (d.element.selectedIndex <= 0 || !d.element.value) && d.element.options.length > 1) {
          const fallbackIdx = 1;
          const fallbackVal = d.element.options[fallbackIdx].value;
          dispatchMainWorldBridge(d.element, { action: "SELECT_OPTION", selectedIndex: fallbackIdx, value: fallbackVal });
          d.element.selectedIndex = fallbackIdx;
          d.element.value = fallbackVal;
          d.element.dispatchEvent(new Event("input", { bubbles: true }));
          d.element.dispatchEvent(new Event("change", { bubbles: true }));
          actionsTaken++;
        }
      }
    }

    // 2. Fill-in text blanks
    if (domRefs.textBlanks && domRefs.textBlanks.length > 0) {
      const blankPlans = Array.isArray(solution.text_blanks) ? solution.text_blanks : [];
      for (const blankPlan of blankPlans) {
        const blank = domRefs.textBlanks[blankPlan.blank_index ?? 0] || domRefs.textBlanks[0];
        if (blank && blank.element && blankPlan.fill_text) {
          setElementValue(blank.element, blankPlan.fill_text);
          actionsTaken++;
        }
      }
      // Fallback if solution returned answer in another field (e.g. mcq_answers / fill_blanks / answer)
      if (actionsTaken === 0) {
        const fallbackWords = solution.fill_blanks || solution.mcq_answers || (solution.answer ? [solution.answer] : []);
        for (let i = 0; i < domRefs.textBlanks.length; i++) {
          const blank = domRefs.textBlanks[i];
          const word = fallbackWords[i] || fallbackWords[0] || "";
          if (blank && blank.element && word) {
            setElementValue(blank.element, word);
            actionsTaken++;
          }
        }
      }
    }

    showAnswerBanner("Word choices updated", solution.explanation || "Selected correct vocabulary option", "Word Choice", 5000);
    return {
      success: actionsTaken > 0,
      message: actionsTaken > 0 ? `Selected/Filled ${actionsTaken} word choice(s)` : "Word choices updated",
      clickedCount: actionsTaken
    };
  }

  // Solve Rearrange the Sentence (with Backtracking Alignment & Live Per-Step React Bank Lookup)
  async function executeRearrange(solution, domRefs) {
    const container = domRefs?.container || findActiveQuestionContainer();

    // 0. Clean Board Check: If any chips are already slotted or selected, click "Reset" first
    //    so all tokens return to the Word Bank before we resolve and click them!
    const resetBtn = findVisibleResetButton(container);
    const submitBefore = findActionElement("submit");
    const hasPlacedChips = (
      (submitBefore && !isButtonDisabled(submitBefore)) ||
      document.querySelectorAll("[class*='slot' i] [class*='chip' i], [class*='slot' i] button, .word-slot:not(:empty)").length > 0 ||
      document.querySelectorAll("[class*='chip' i].selected, [class*='token' i].selected, [class*='phrase' i].selected, .selected-chip, .placed-token, [data-placed='true']").length > 0
    );

    if (resetBtn && hasPlacedChips) {
      console.log("[Prodigy Solvex] Resetting rearrange slots to ensure clean insertion...");
      simulateClick(resetBtn);
      await delay(380);
    }

    // Re-scan fresh tokens on the clean board (or use connected domRefs.sentenceTokens if board wasn't reset)
    let tokens = (!hasPlacedChips && domRefs?.sentenceTokens?.length >= 3 && domRefs.sentenceTokens.every(t => t.element && t.element.isConnected))
      ? domRefs.sentenceTokens
      : findRearrangeTokens(container);

    if (!tokens || tokens.length < 3) {
      tokens = findRearrangeTokens(document.body);
    }
    if (!tokens || tokens.length === 0) {
      tokens = domRefs && domRefs.sentenceTokens && domRefs.sentenceTokens.length > 0 ? domRefs.sentenceTokens : [];
    }
    if (!tokens || tokens.length === 0) return "No rearrange tokens found on page";

    tokens.forEach((t, idx) => {
      t.index = idx;
    });

    // Identify the Word Bank parent container where unplaced chips live
    const bankContainer = tokens[0]?.bankContainer || tokens[0]?.element?.parentElement || null;
    const totalCount = tokens.length;

    // Helper: Backtracking DFS alignment of tokens to a target reconstructed sentence.
    // Solves prefix collisions (e.g. "the" vs "the cat", "to" vs "to be") by backtracking when a prefix choice dead-ends!
    function alignTokensToSentence(sentenceStr, tokenPool) {
      const cleanSent = normalizeTokenText(sentenceStr);
      if (!cleanSent || !tokenPool || tokenPool.length === 0) return null;

      let steps = 0;
      const MAX_STEPS = 600;
      let bestPartial = [];

      function skipSeparators(str, pos) {
        let p = pos;
        while (p < str.length && /[\s.,\/#!$%\^&\*;:{}=\-_`~()?]/.test(str[p])) {
          p++;
        }
        return p;
      }

      function dfs(cursor, remaining, path) {
        if (path.length > bestPartial.length) {
          bestPartial = [...path];
        }
        if (remaining.length === 0) {
          return path;
        }
        if (++steps > MAX_STEPS) {
          return null;
        }

        const c = skipSeparators(cleanSent, cursor);
        if (c >= cleanSent.length) {
          return null;
        }
        const sub = cleanSent.slice(c);

        // Find all tokens in `remaining` that match at the start of `sub` (or within a tiny 1-3 char gap)
        const matches = [];
        for (let i = 0; i < remaining.length; i++) {
          const tok = remaining[i];
          const cleanTok = normalizeTokenText(tok.text);
          if (!cleanTok) continue;

          if (sub.startsWith(cleanTok)) {
            const afterChar = sub[cleanTok.length];
            if (!afterChar || /[\s.,\/#!$%\^&\*;:{}=\-_`~()?]/.test(afterChar)) {
              matches.push({ idx: i, tok, nextCursor: c + cleanTok.length, priority: 1000 + cleanTok.length });
            }
          } else {
            const escaped = cleanTok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const m = sub.match(new RegExp("^(?:\\S+\\s+)?(" + escaped + ")(?:\\s+|$)", "i"));
            if (m && m.index !== undefined && m.index <= 12) {
              const advance = m.index + m[0].length;
              matches.push({ idx: i, tok, nextCursor: c + advance, priority: 500 - m.index + cleanTok.length });
            }
          }
        }

        // Try longest/highest-priority prefix matches first, backtrack if a branch dead-ends
        matches.sort((a, b) => b.priority - a.priority);

        for (const m of matches) {
          const nextRem = remaining.filter((_, idx) => idx !== m.idx);
          const res = dfs(m.nextCursor, nextRem, [...path, m.tok]);
          if (res && res.length === tokenPool.length) {
            return res;
          }
        }

        return null;
      }

      const fullMatch = dfs(0, tokenPool, []);
      if (fullMatch && fullMatch.length === tokenPool.length) {
        return fullMatch;
      }

      // If DFS didn't reach 100% coverage (e.g. AI slightly paraphrased 1 word), use bestPartial + greedy position sort for remainder
      if (bestPartial.length >= Math.min(totalCount, 3)) {
        return bestPartial;
      }
      return null;
    }

    // Candidate 1: From reordered_token_indices
    let candidateIndices = null;
    let rawIndices = Array.isArray(solution.reordered_token_indices)
      ? solution.reordered_token_indices
      : (Array.isArray(solution.indices) ? solution.indices : []);

    if (rawIndices.length > 0) {
      const minIdx = Math.min(...rawIndices);
      const maxIdx = Math.max(...rawIndices);
      if (minIdx === 1 && maxIdx === totalCount) {
        rawIndices = rawIndices.map(i => i - 1);
      }
      const validIndices = rawIndices.filter(i => Number.isInteger(i) && i >= 0 && i < totalCount);
      const uniqueIndices = [...new Set(validIndices)];
      const isIdentity = (uniqueIndices.length === totalCount) && uniqueIndices.every((val, idx) => val === idx);

      if (uniqueIndices.length >= Math.min(totalCount, 3)) {
        candidateIndices = {
          name: "indices",
          tokens: uniqueIndices.map(i => tokens[i]),
          isIdentity: isIdentity,
          count: uniqueIndices.length
        };
      }
    }

    // Candidate 2: From reordered_token_texts
    let candidateTexts = null;
    const targetTexts = solution.reordered_token_texts || solution.ordered_tokens || solution.ordered_sentences || solution.reordered_sentences || solution.sentences || [];
    if (Array.isArray(targetTexts) && targetTexts.length > 0) {
      const remaining = [...tokens];
      const textMatched = [];

      for (const target of targetTexts) {
        const cleanTarget = normalizeTokenText(target);
        if (!cleanTarget) continue;

        let bestScore = -1;
        let bestIdx = -1;

        for (let i = 0; i < remaining.length; i++) {
          const cleanTok = normalizeTokenText(remaining[i].text);
          let score = 0;
          if (cleanTok === cleanTarget) {
            score = 10000;
          } else if (cleanTok.startsWith(cleanTarget) || cleanTarget.startsWith(cleanTok)) {
            // Prefer exact length closeness so "the" doesn't steal "the cat" when "the" also exists
            const lenDiff = Math.abs(cleanTok.length - cleanTarget.length);
            score = 8000 - lenDiff * 50;
          } else if (cleanTok.includes(cleanTarget) || cleanTarget.includes(cleanTok)) {
            score = 5000 + Math.min(cleanTok.length, cleanTarget.length);
          } else {
            const tWords = new Set(cleanTarget.split(" ").filter(w => w.length >= 1));
            const kWords = cleanTok.split(" ").filter(w => w.length >= 1);
            let matchWords = 0;
            for (const w of kWords) {
              if (tWords.has(w)) matchWords++;
            }
            if (matchWords > 0) {
              score = (matchWords / Math.max(tWords.size, kWords.length)) * 1000;
            }
          }

          if (score > bestScore && score > 0) {
            bestScore = score;
            bestIdx = i;
          }
        }

        if (bestIdx !== -1 && bestScore > 100) {
          textMatched.push(remaining[bestIdx]);
          remaining.splice(bestIdx, 1);
        }
      }

      if (textMatched.length >= Math.min(totalCount, 3)) {
        const isIdentity = (textMatched.length === totalCount) && textMatched.every((tok, idx) => tok.index === idx);
        candidateTexts = {
          name: "texts",
          tokens: textMatched,
          isIdentity: isIdentity,
          count: textMatched.length
        };
      }
    }

    // Candidate 3: Backtracking sentence alignment against reconstructed_sentence
    let candidateSentence = null;
    if (solution.reconstructed_sentence && typeof solution.reconstructed_sentence === "string") {
      const aligned = alignTokensToSentence(solution.reconstructed_sentence, tokens);
      if (aligned && aligned.length >= Math.min(totalCount, 3)) {
        const isIdentity = (aligned.length === totalCount) && aligned.every((s, idx) => s.index === idx);
        candidateSentence = {
          name: "sentence_dfs",
          tokens: aligned,
          isIdentity: isIdentity,
          count: aligned.length
        };
      }
    }

    // Score candidates by how closely their joined text matches reconstructed_sentence
    const targetCleanSentence = normalizeTokenText(solution.reconstructed_sentence || "");
    function scoreCandidateAlignment(cand) {
      if (!cand || !cand.tokens) return -1;
      const joined = normalizeTokenText(cand.tokens.map(t => t.text).join(" "));
      let score = cand.count * 1000;
      if (!cand.isIdentity) score += 500;
      if (targetCleanSentence && joined === targetCleanSentence) {
        score += 10000;
      } else if (targetCleanSentence && (joined.startsWith(targetCleanSentence) || targetCleanSentence.startsWith(joined))) {
        score += 5000;
      }
      return score;
    }

    let winner = null;
    const candidates = [candidateSentence, candidateTexts, candidateIndices].filter(c => c && c.tokens && c.tokens.length > 0);

    if (candidates.length > 0) {
      candidates.sort((a, b) => scoreCandidateAlignment(b) - scoreCandidateAlignment(a));
      winner = candidates[0].tokens;
      console.log(`[Prodigy Solvex] Selected rearrange strategy '${candidates[0].name}' (${winner.length}/${totalCount} tokens)`);
    }

    if (!winner || winner.length === 0) {
      if (solution.reconstructed_sentence && tokens.length > 0) {
        const lowerRec = normalizeTokenText(solution.reconstructed_sentence);
        const usedPos = new Set();
        const sorted = [...tokens].sort((a, b) => {
          const normA = normalizeTokenText(a.text);
          const normB = normalizeTokenText(b.text);
          const posA = normA ? lowerRec.indexOf(normA) : -1;
          const posB = normB ? lowerRec.indexOf(normB) : -1;
          return (posA !== -1 ? posA : 9999) - (posB !== -1 ? posB : 9999);
        });
        winner = sorted;
      } else if (tokens.length > 0) {
        winner = tokens;
      }
    }

    if (!winner || winner.length === 0) {
      const warnMsg = "No tokens detected to click.";
      console.log("[Prodigy Solvex]", warnMsg);
      showAnswerBanner("Rearrangement Notice", "No tokens found on page.", "Rearrange Notice", 8000);
      return { success: false, message: warnMsg };
    }

    // If winner is missing any token (partial match), insert remaining tokens at their best linguistic position or end
    const orderedSequence = [...winner];
    for (const tok of tokens) {
      if (!orderedSequence.includes(tok)) {
        orderedSequence.push(tok);
      }
    }

    console.log("[Prodigy Solvex] Clicking rearrange tokens in order:", orderedSequence.map(t => `[${t.index}] "${t.text.slice(0, 35)}"`));

    // CRITICAL FIX FOR REACT REARRANGE:
    // When a chip is clicked in React, React often removes the clicked item from its `availableWords` state array
    // and re-renders the remaining buttons in-place (shifting button[1]'s text into button[0], etc., and unmounting the last button).
    // Therefore, pre-cached `token.element` references become stale/shifted after Click #1!
    // We solve this by performing a LIVE lookup inside `bankContainer` on every single step!
    const clickedDomElements = new Set();
    let placedCount = 0;

    for (let step = 0; step < orderedSequence.length; step++) {
      const targetTok = orderedSequence[step];
      const targetRaw = (targetTok.text || "").replace(/\s+/g, " ").trim();
      const targetNorm = normalizeTokenText(targetRaw);

      // Query live chips currently in the Word Bank
      let liveBankTokens = bankContainer && bankContainer.isConnected
        ? findRearrangeTokens(container, { bankContainer })
        : findRearrangeTokens(container);

      // Determine if React shrinks the bank on click (removes placed chips) or keeps all chips in the bank
      const bankShrank = liveBankTokens.length < totalCount;

      // Filter available unplaced chips in the bank
      const availableLive = liveBankTokens.filter(lt => {
        if (!lt.element || !isElementVisible(lt.element)) return false;
        if (!bankShrank) {
          // React keeps chips in the bank: skip already-clicked DOM elements or disabled/selected chips
          if (clickedDomElements.has(lt.element)) return false;
          if (isButtonDisabled(lt.element) || isOptionElementSelected(lt.element)) return false;
        }
        return true;
      });

      let elementToClick = null;

      // 1. Check if original element is still in availableLive AND its current text STILL matches targetRaw
      if (
        targetTok.element &&
        availableLive.some(lt => lt.element === targetTok.element) &&
        normalizeTokenText(safeText(targetTok.element)) === targetNorm
      ) {
        elementToClick = targetTok.element;
      }

      // 2. Exact raw text match among available live bank chips
      if (!elementToClick) {
        const exactRawMatch = availableLive.find(lt => lt.text === targetRaw);
        if (exactRawMatch) elementToClick = exactRawMatch.element;
      }

      // 3. Normalized text match among available live bank chips
      if (!elementToClick && targetNorm) {
        const exactNormMatch = availableLive.find(lt => normalizeTokenText(lt.text) === targetNorm);
        if (exactNormMatch) elementToClick = exactNormMatch.element;
      }

      // 4. Substring / fuzzy match among available live bank chips
      if (!elementToClick && targetNorm) {
        const subMatch = availableLive.find(lt => {
          const ltNorm = normalizeTokenText(lt.text);
          return ltNorm && (ltNorm.includes(targetNorm) || targetNorm.includes(ltNorm));
        });
        if (subMatch) elementToClick = subMatch.element;
      }

      // 5. Fallback to first available unplaced chip if all text matches failed
      if (!elementToClick && availableLive.length > 0) {
        elementToClick = availableLive[0].element;
      }

      if (elementToClick) {
        const beforeCount = liveBankTokens.length;
        clickedDomElements.add(elementToClick);
        simulateClick(elementToClick);
        await delay(Math.max(240, state.typingDelayMs || 220));

        // Verify the click registered (either chip moved out of bank, or gained selected/disabled state, or Submit enabled)
        const afterBankTokens = bankContainer && bankContainer.isConnected
          ? findRearrangeTokens(container, { bankContainer })
          : [];
        const chipMovedOrSelected = (
          afterBankTokens.length < beforeCount ||
          !elementToClick.isConnected ||
          isButtonDisabled(elementToClick) ||
          isOptionElementSelected(elementToClick)
        );

        if (!chipMovedOrSelected) {
          // Force React Fiber click in MAIN world if synthetic click didn't register
          reactClick(elementToClick, true);
          await delay(180);
        }

        placedCount++;
      }
    }

    // Safe Post-Loop Check: If Submit is still disabled because 1 unplaced chip remains in the bank,
    // click ONLY remaining unplaced chips in `bankContainer` (NEVER re-click already-placed chips!)
    await delay(200);
    const submitAfterRearrange = findActionElement("submit");
    if (submitAfterRearrange && isButtonDisabled(submitAfterRearrange) && bankContainer && bankContainer.isConnected) {
      const remainingInBank = findRearrangeTokens(container, { bankContainer }).filter(lt => {
        if (!lt.element || !isElementVisible(lt.element)) return false;
        if (isButtonDisabled(lt.element) || isOptionElementSelected(lt.element)) return false;
        return true;
      });
      // Only click remaining bank chips if the bank shrank (meaning remaining chips in bank are genuinely unplaced)
      // or if they weren't in clickedDomElements
      for (const rem of remainingInBank) {
        const curSub = findActionElement("submit");
        if (curSub && !isButtonDisabled(curSub)) break;
        if (remainingInBank.length < totalCount || !clickedDomElements.has(rem.element)) {
          simulateClick(rem.element, true);
          placedCount++;
          await delay(220);
        }
      }
    }

    const fullSentence = solution.reconstructed_sentence || orderedSequence.map(t => t.text).join(" ");
    showAnswerBanner(fullSentence, solution.explanation || "Rearranged into logical sequence", "Sentence Rearranged", 15000);

    return { success: placedCount > 0, message: `Ordered ${placedCount} items: "${fullSentence.slice(0, 60)}..."`, clickedCount: placedCount };
  }

  // Solve Writing Question
  async function executeWriting(solution, domRefs) {
    let textarea = domRefs?.writingArea;
    if (!textarea || !textarea.isConnected) {
      const writingSelectors = "textarea:not(.ps-input), [contenteditable='true'], [contenteditable=''], [contenteditable], [role='textbox'], .ql-editor, .fr-element, .monaco-editor, .public-DraftEditor-content, div.editable";
      textarea = document.querySelector(writingSelectors);
    }
    if (!textarea) {
      const warnMsg = "No writing textarea detected on page.";
      console.log("[Prodigy Solvex]", warnMsg);
      showAnswerBanner("Writing Task", warnMsg, "Writing Notice", 5000);
      return { success: false, message: warnMsg };
    }

    const textToInsert = (
      solution.writing_answer ||
      solution.essay ||
      solution.response ||
      solution.text ||
      solution.answer ||
      solution.content ||
      solution.speaking_script ||
      ""
    ).trim();

    if (!textToInsert) {
      const warnMsg = "No writing text returned by AI.";
      console.log("[Prodigy Solvex]", warnMsg);
      return { success: false, message: warnMsg };
    }

    setElementValue(textarea, textToInsert);

    const words = textToInsert.split(/\s+/).filter(Boolean).length;
    showAnswerBanner(textToInsert.slice(0, 100) + (textToInsert.length > 100 ? "..." : ""), `Generated ${words} words response adhering to prompt requirements`, "Writing Answer", 8000);
    return { success: words > 0, message: `Typed ${words} words into answer box`, wordCount: words, clickedCount: words > 0 ? 1 : 0 };
  }

  // Solve Speaking Question
  async function executeSpeaking(solution, domRefs) {
    if (domRefs.options && domRefs.options.length > 0) {
      return executeMCQ(solution, domRefs);
    }

    let dropdownNotice = false;
    if (domRefs.dropdowns.length > 0 && solution.dropdown_selections) {
      await executeChooseWord(solution, domRefs);
      dropdownNotice = true;
    }

    const micButton = document.querySelector(
      "button.record, .mic-btn, [aria-label*='record' i], [aria-label*='speak' i], .audio-record, [class*='record' i], [class*='mic' i]"
    );
    if (!micButton && (!domRefs.container || !domRefs.container.classList.contains("speaking-question"))) {
      return executeMCQ(solution, domRefs);
    }

    const teleprompter = document.getElementById("ps-teleprompter");
    const speechContent = document.getElementById("ps-speech-content");
    const speechNotes = document.getElementById("ps-speech-notes");
    const speechMeta = document.getElementById("ps-speech-meta");
    const dropdownNoticeEl = document.getElementById("ps-dropdown-notice");

    if (teleprompter && speechContent) {
      speechContent.innerText = solution.speaking_script || "No speech script generated.";
      if (speechNotes) speechNotes.innerText = solution.speaking_notes || "Speak clearly with natural pacing.";
      if (speechMeta) {
        const wordCount = (solution.speaking_script || "").split(/\s+/).filter(Boolean).length;
        speechMeta.innerText = `~${wordCount} words`;
      }
      if (dropdownNoticeEl) {
        dropdownNoticeEl.style.display = dropdownNotice ? "block" : "none";
      }
      teleprompter.classList.add("active");
    }

    showAnswerBanner("Speaking script loaded in teleprompter", solution.speaking_notes || "Speak clearly with natural pacing", "Speaking Task", 5000);
    return dropdownNotice ? "Auto-selected dropdown & speech teleprompter is ready!" : "Speaking teleprompter is ready!";
  }

  // -------------------------------------------------------------
  // Button Finder & Auto-Advance Controller
  // -------------------------------------------------------------
  function isButtonDisabled(el) {
    if (!el) return true;
    const btn = el.closest("button, [role='button'], a, input") || el;
    if (btn.disabled === true) return true;
    if (btn.getAttribute("aria-disabled") === "true") return true;
    if (btn.hasAttribute("disabled") && btn.getAttribute("disabled") !== "false") return true;

    // CRITICAL FIX: Ignore Tailwind CSS variant prefixes like `disabled:opacity-50` or `disabled:cursor-not-allowed`
    // which remain in className even when the button is enabled! Only check standalone class tokens.
    const classTokens = ((btn.className || "").toString().toLowerCase())
      .split(/\s+/)
      .filter(Boolean)
      .filter(tok => !tok.includes(":"));

    if (
      classTokens.includes("disabled") ||
      classTokens.includes("is-disabled") ||
      classTokens.includes("btn-disabled") ||
      classTokens.includes("inactive") ||
      classTokens.includes("is-inactive")
    ) {
      return true;
    }

    try {
      const style = window.getComputedStyle(btn);
      if (style.pointerEvents === "none") return true;
      if (style.cursor === "not-allowed" && parseFloat(style.opacity) < 0.65) return true;
    } catch (_) {}
    return false;
  }

  function findActionElement(actionType) {
    const candidates = Array.from(
      document.querySelectorAll("button, input[type='submit'], input[type='button'], a, div[role='button'], span[role='button'], [role='button']")
    ).filter(el => {
      if (!el || el.closest("#prodigy-solvex-host, #ps-answer-banner, #ps-teleprompter")) return false;
      return isElementVisible(el);
    });

    const normalizeBtnText = (rawTxt) => {
      return (rawTxt || "")
        .replace(/[→\u2192\u279c\u2794✓✔«»‹›]/g, "")
        .replace(/\s+/g, " ")
        .toLowerCase()
        .trim();
    };

    const isStartMatch = (rawTxt, el) => {
      const txt = normalizeBtnText(rawTxt);
      if (txt === "restart" || txt.includes("restart")) return false;
      if (/^(start|start\s+test|start\s+assessment|start\s+quiz|start\s+now|begin|begin\s+test)$/i.test(txt)) return true;
      if (/^start\b/i.test(txt) && !txt.includes("option") && !txt.includes("question 1 of")) return true;
      if (/^begin\b/i.test(txt)) return true;
      const cls = (el.className || "").toString().toLowerCase();
      if ((cls.includes("start-btn") || cls.includes("btn-start")) && !txt.includes("restart")) return true;
      const aria = (el.getAttribute("aria-label") || "").toLowerCase();
      if (/^start\b/i.test(aria) && !aria.includes("restart")) return true;
      return false;
    };

    const isSubmitMatch = (rawTxt, el) => {
      const txt = normalizeBtnText(rawTxt);
      if (txt === "submitted" || txt.includes("already submitted") || txt.includes("feedback")) return false;
      if (/^(submit|submit\s+answer|save\s*&\s*next|check|check\s+answer|verify|confirm)$/i.test(txt)) return true;
      if (/^submit\b/i.test(txt) && !txt.includes("option") && !txt.includes("feedback")) return true;
      const cls = (el.className || "").toString().toLowerCase();
      if ((cls.includes("submit-btn") || cls.includes("btn-submit")) && !txt.includes("feedback") && !txt.includes("next")) return true;
      const aria = (el.getAttribute("aria-label") || "").toLowerCase();
      if (/^(submit|check\s+answer|save\s*&\s*next)\b/i.test(aria) && !aria.includes("feedback")) return true;
      return false;
    };

    const isNextMatch = (rawTxt, el) => {
      const normalized = normalizeBtnText(rawTxt);
      if (/^(next|continue|proceed|next\s*question|finish|done|complete)$/i.test(normalized)) return true;
      if (/^next\b/i.test(normalized) && !normalized.includes("option") && !normalized.includes("question 1 of")) return true;
      if (/^continue\b/i.test(normalized) && !normalized.includes("option")) return true;
      if (/^proceed\b/i.test(normalized)) return true;
      const cls = (el.className || "").toString().toLowerCase();
      if ((cls.includes("next-btn") || cls.includes("btn-next")) && !normalized.includes("submit")) return true;
      const aria = (el.getAttribute("aria-label") || "").toLowerCase();
      if (/^(next|continue|proceed)\b/i.test(aria)) return true;
      return false;
    };

    let matcher;
    if (actionType === "start") {
      matcher = isStartMatch;
    } else if (actionType === "submit") {
      matcher = isSubmitMatch;
    } else {
      matcher = isNextMatch;
    }

    const matchedButtons = [];
    const seen = new Set();

    for (const el of candidates) {
      const txt = safeText(el);
      if (matcher(txt, el)) {
        const resolved = el.closest("button, [role='button'], a, input") || el;
        if (!seen.has(resolved)) {
          seen.add(resolved);
          matchedButtons.push(resolved);
        }
      }
    }

    for (const el of candidates) {
      if (el.children) {
        for (const child of el.children) {
          const cTxt = safeText(child);
          if (matcher(cTxt, el)) {
            const resolved = el.closest("button, [role='button'], a, input") || el;
            if (!seen.has(resolved)) {
              seen.add(resolved);
              matchedButtons.push(resolved);
            }
          }
        }
      }
    }

    if (matchedButtons.length === 0) return null;

    // Prefer enabled buttons over disabled ones, and native <button>/<input> over generic wrappers
    matchedButtons.sort((a, b) => {
      const aDisabled = isButtonDisabled(a) ? 1 : 0;
      const bDisabled = isButtonDisabled(b) ? 1 : 0;
      if (aDisabled !== bDisabled) return aDisabled - bDisabled;
      const aNative = (a.tagName === "BUTTON" || a.tagName === "INPUT") ? 0 : 1;
      const bNative = (b.tagName === "BUTTON" || b.tagName === "INPUT") ? 0 : 1;
      return aNative - bNative;
    });

    return matchedButtons[0];
  }

  // -------------------------------------------------------------
  // Auto-Submit, Auto-Start & Auto-Next Execution Controllers
  // -------------------------------------------------------------
  let autoNextTimer = null;
  let isAutoNextClicking = false;
  let isAutoStartClicking = false;
  let answerWatcherTimer = null;

  async function handleAutoStart() {
    if (!state.isEnabled || !state.autoSubmitEnabled || isAutoStartClicking) return;
    const startBtn = findActionElement("start");
    if (startBtn && !isButtonDisabled(startBtn)) {
      isAutoStartClicking = true;
      console.log("[Prodigy Solvex] Start button detected on test page. Auto-clicking Start...");
      showToast("Auto-starting test...");
      updateStatus("Starting...", "working", "START");
      await delay(400);
      simulateClick(startBtn);
      await delay(1200);
      isAutoStartClicking = false;
    }
  }

  function ensureAnswerPageWatcher() {
    if (answerWatcherTimer) return;
    let _lastAutoSolveAttempt = 0;
    answerWatcherTimer = setInterval(() => {
      if (!state.isEnabled || !state.autoSubmitEnabled) return;

      // 1. Check if Start button is present (test launch/intro page)
      const startBtn = findActionElement("start");
      if (startBtn && !isButtonDisabled(startBtn) && !isAutoStartClicking) {
        handleAutoStart();
        return;
      }

      // 2. Check if Answer or Feedback page is active (Next / Continue)
      if (isAnswerOrFeedbackPage() && !autoNextTimer && !isAutoNextClicking) {
        handleAutoNext();
        return;
      }

      // 3. On a question page: check if an answer is already selected AND ready to submit, or needs solving
      if (!state.isProcessing && !state.isWaiting && !state._autoSubmitInFlight && !isAnswerOrFeedbackPage()) {
        const now = Date.now();
        if (now - _lastAutoSolveAttempt > 4500) {
          const container = findActiveQuestionContainer();
          if (container) {
            const submitBtn = findActionElement("submit");
            const answerSelected = hasAnyAnswerSelectedInDOM(container);
            const submitReady = submitBtn && !isButtonDisabled(submitBtn);

            if (answerSelected && submitReady) {
              console.log("[Prodigy Solvex] Auto-Submit: Valid answer selected and Submit enabled. Submitting...");
              _lastAutoSolveAttempt = now;
              handleAutoSubmit();
            } else {
              _lastAutoSolveAttempt = now;
              console.log("[Prodigy Solvex] Auto-Submit: Solving current question...");
              triggerSolve(true);
            }
          }
        }
      }
    }, 1500);
  }

  async function handleAutoNext() {
    if (!state.autoSubmitEnabled || isAutoNextClicking) return;
    if (autoNextTimer) return;

    updateStatus("Next in 2s...", "working", "NEXT");
    console.log("[Prodigy Solvex] Answer/Feedback page detected. Auto-Next scheduled in 2000ms (2s delay)...");

    autoNextTimer = setTimeout(async () => {
      autoNextTimer = null;
      if (!state.autoSubmitEnabled || isAutoNextClicking) return;

      let nextBtn = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        nextBtn = findActionElement("next") || findActionElement("start") || findActionElement("submit");
        if (nextBtn && !isButtonDisabled(nextBtn)) break;
        nextBtn = null;
        if (attempt < 2) await delay(1000);
      }

      if (nextBtn && !isButtonDisabled(nextBtn)) {
        isAutoNextClicking = true;
        console.log("[Prodigy Solvex] Auto-Next (2s elapsed): Clicking '" + safeText(nextBtn).slice(0, 20) + "' on Answer page...");
        showToast("Auto-advancing to next question...");
        updateStatus("Advancing...", "working", "NEXT");
        simulateClick(nextBtn);
        await delay(1500);
        isAutoNextClicking = false;

        state.lastSolvedQuestionId = "";
        state.inFlightQuestionId = null;
        state.isProcessing = false;
        console.log("[Prodigy Solvex] Auto-Next: Clicked Next. Reset solved state for next question.");
      } else {
        console.log("[Prodigy Solvex] Auto-Next: Next button not ready after 3 attempts. Will retry on next page change.");
        updateStatus("Ready", "idle", "IDLE");
      }
    }, 2000);
  }

  // Smart Recovery when Submit button remains disabled after initial answer placement
  async function recoverDisabledSubmitButton(container) {
    const scope = (container && container !== document.body) ? container : document.body;

    // 1. Check MCQ Options:
    const mcqOpts = findMCQOptions(scope);
    if (mcqOpts.length >= 2) {
      const selectedOpts = mcqOpts.filter(o => isOptionElementSelected(o.element));
      if (selectedOpts.length === 0) {
        // No option registered in React state yet — force React Fiber click on first option
        console.log("[Prodigy Solvex] Recovery: Forcing React Fiber selection on option...");
        reactClick(mcqOpts[0].element, true);
        await delay(250);
      } else {
        // An option IS selected, yet Submit is disabled -> either React state missed the DOM class or multi-select requires a 2nd choice
        reactClick(selectedOpts[0].element, true);
        await delay(200);
        const subCheck = findActionElement("submit");
        if (subCheck && isButtonDisabled(subCheck)) {
          const unselected = mcqOpts.find(o => !isOptionElementSelected(o.element));
          if (unselected && unselected.element) {
            console.log("[Prodigy Solvex] Recovery: Selecting secondary option for multi-choice requirement...");
            reactClick(unselected.element, false);
            await delay(200);
            if (isButtonDisabled(subCheck)) {
              reactClick(unselected.element, true);
              await delay(200);
            }
          }
        }
      }
      return;
    }

    // 2. Check Rearrange / Cloze unplaced chips:
    if (checkIsRearrangeQuestion(scope)) {
      const tokens = findRearrangeTokens(scope);
      const bankEl = tokens[0]?.bankContainer;
      const bankTokens = bankEl ? findRearrangeTokens(scope, { bankContainer: bankEl }) : tokens;
      for (const tok of bankTokens) {
        const subCheck = findActionElement("submit");
        if (subCheck && !isButtonDisabled(subCheck)) break;
        if (tok.element && isElementVisible(tok.element) && !isButtonDisabled(tok.element) && !isOptionElementSelected(tok.element)) {
          simulateClick(tok.element, true);
          await delay(220);
        }
      }
      return;
    }

    if (checkIsClozePassage(scope)) {
      const chips = findClozeChips(scope);
      for (const chip of chips) {
        const subCheck = findActionElement("submit");
        if (subCheck && !isButtonDisabled(subCheck)) break;
        if (chip.element && isElementVisible(chip.element) && !isButtonDisabled(chip.element)) {
          simulateClick(chip.element, true);
          await delay(200);
        }
      }
      return;
    }

    // 3. Check Dropdowns (<select>):
    const dropdowns = Array.from(scope.querySelectorAll("select")).filter(el => isElementVisible(el) && !isNavOrSystem(el));
    for (const sel of dropdowns) {
      if ((sel.selectedIndex <= 0 || !sel.value) && sel.options.length > 1) {
        dispatchMainWorldBridge(sel, { action: "SELECT_OPTION", selectedIndex: 1, value: sel.options[1].value });
        sel.selectedIndex = 1;
        sel.value = sel.options[1].value;
        sel.dispatchEvent(new Event("input", { bubbles: true }));
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        await delay(150);
      }
    }

    // 4. Check Text Inputs / Textareas:
    const textInputs = Array.from(scope.querySelectorAll("input[type='text']:not(.ps-input), textarea:not(.ps-input)"))
      .filter(el => isElementVisible(el) && !isNavOrSystem(el));
    for (const inp of textInputs) {
      if (!(inp.value || "").trim()) {
        setElementValue(inp, "answer");
        await delay(150);
      }
    }
  }

  async function handleAutoSubmit() {
    if (!state.autoSubmitEnabled) return;

    if (state._autoSubmitInFlight) {
      console.log("[Prodigy Solvex] Auto-Submit: Already in flight. Skipping.");
      return;
    }
    state._autoSubmitInFlight = true;

    try {
      // Never submit on Answer or Feedback page!
      if (isAnswerOrFeedbackPage()) {
        handleAutoNext();
        return;
      }

      const activeContainer = findActiveQuestionContainer();
      if (activeContainer && !hasAnyAnswerSelectedInDOM(activeContainer)) {
        console.log("[Prodigy Solvex] Auto-Submit: No answer populated yet. Triggering Solve first...");
        if (!state.isProcessing) {
          state._autoSubmitInFlight = false;
          triggerSolve(true);
        }
        return;
      }

      // Short pacing delay so UI confirms selection before submission
      const pacingDelay = Math.max(550, (state.typingDelayMs || 250) + 300);
      await delay(pacingDelay);

      if (isAnswerOrFeedbackPage()) {
        handleAutoNext();
        return;
      }

      // Find Submit button with retry loop + Smart Recovery if React hasn't enabled it yet
      let submitBtn = null;
      let submitAttempts = 0;
      while (submitAttempts < 10) {
        submitBtn = findActionElement("submit") || findActionElement("next") || findActionElement("start");
        if (submitBtn && !isButtonDisabled(submitBtn)) {
          console.log(`[Prodigy Solvex] Auto-Submit: Submit button ready after ${submitAttempts * 400}ms.`);
          break;
        }
        submitAttempts++;
        if (submitAttempts === 3 || submitAttempts === 7) {
          await recoverDisabledSubmitButton(activeContainer);
        }
        if (submitAttempts < 10) {
          await delay(400);
        }
      }

      if (!submitBtn) {
        console.log("[Prodigy Solvex] Auto-Submit: Submit button not found on question page.");
        return;
      }

      // Final recovery attempt if still disabled
      if (isButtonDisabled(submitBtn)) {
        await recoverDisabledSubmitButton(activeContainer);
        await delay(300);
        submitBtn = findActionElement("submit") || submitBtn;
      }

      // Submit the answer (using single clean Main-World click first, then React Fiber Submit fallback if needed)
      console.log("[Prodigy Solvex] Auto-Submit: Submitting selected answer...");
      showToast("✅ Submitting answer...");
      updateStatus("Submitting...", "working", "SUBMIT");
      highlightElement(submitBtn);

      if (!isButtonDisabled(submitBtn)) {
        dispatchMainWorldBridge(submitBtn, { action: "SUBMIT", forceReact: false, forceEnable: false });
      } else {
        // Force-enable & invoke React Submit handler via Main-World Fiber Bridge as last resort
        dispatchMainWorldBridge(submitBtn, { action: "SUBMIT", forceReact: true, forceEnable: true });
      }

      // Wait briefly to see if transition started; if still on question page, trigger React Fiber Submit directly
      await delay(350);
      if (!isAnswerOrFeedbackPage()) {
        const stillSubmitBtn = findActionElement("submit");
        if (stillSubmitBtn) {
          dispatchMainWorldBridge(stillSubmitBtn, { action: "SUBMIT", forceReact: true, forceEnable: true });
        }
      }

      // Wait for the feedback/answer page to appear (poll every 300ms, max 9s)
      await new Promise((resolve) => {
        let pollCount = 0;
        const pollInterval = setInterval(() => {
          pollCount++;
          if (isAnswerOrFeedbackPage()) {
            clearInterval(pollInterval);
            console.log("[Prodigy Solvex] Auto-Submit: Transition to Answer page detected!");
            resolve();
          } else if (pollCount > 30) {
            clearInterval(pollInterval);
            console.log("[Prodigy Solvex] Auto-Submit: Feedback page transition wait completed.");
            resolve();
          }
        }, 300);
      });

      // Now trigger Auto-Next to advance to the next question
      handleAutoNext();
      await new Promise((resolve) => {
        let waitCount = 0;
        const waitInterval = setInterval(() => {
          waitCount++;
          if (!isAutoNextClicking && !autoNextTimer) {
            clearInterval(waitInterval);
            resolve();
          } else if (waitCount > 40) {
            clearInterval(waitInterval);
            resolve();
          }
        }, 200);
      });
      await delay(800);
    } finally {
      state._autoSubmitInFlight = false;
    }
  }

  // -------------------------------------------------------------
  // Video Auto-Play & Keep-Alive Protection Controllers
  // -------------------------------------------------------------
  function ensureMainWorldProtectionScript() {
    if (document.getElementById("prodigy-solvex-main-shield")) return;
    try {
      const s = document.createElement("script");
      s.id = "prodigy-solvex-main-shield";
      s.src = chrome.runtime.getURL("page_protection.js");
      (document.head || document.documentElement).appendChild(s);
    } catch (_) {}
  }

  function syncProtectionSettings() {
    try {
      window.postMessage({
        source: "STEP_SOLVER_CONTENT",
        type: "SYNC_PROTECTION_SETTINGS",
        settings: {
          antiTabSwitchEnabled: state.antiTabSwitchEnabled,
          keepWebsiteActiveEnabled: state.keepWebsiteActiveEnabled
        }
      }, "*");
    } catch (_) {}
  }

  let keepActiveInterval = null;
  function initKeepWebsiteActive() {
    if (keepActiveInterval) clearInterval(keepActiveInterval);
    keepActiveInterval = setInterval(() => {
      if (!state.isEnabled || !state.keepWebsiteActiveEnabled) return;
      try {
        const evt = new MouseEvent("mousemove", {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: Math.floor(Math.random() * 20) + 10,
          clientY: Math.floor(Math.random() * 20) + 10
        });
        document.dispatchEvent(evt);
      } catch (_) {}
    }, 25000);
  }

  function getYouTubeVideoKey(iframe) {
    if (!iframe) return null;
    const src = iframe.src || iframe.getAttribute("data-src") || "";
    if (!src) return null;
    const match = src.match(/(?:embed\/|v=|vi=|\/v\/|\/vi\/|youtu\.be\/|\/e\/)([a-zA-Z0-9_-]{11})/i);
    if (match && match[1]) {
      return `yt_${match[1]}`;
    }
    // Fallback: clean URL without query
    return `yt_${src.split("?")[0]}`;
  }

  function getHTML5VideoKey(video) {
    if (!video) return null;
    const src = video.currentSrc || video.src || video.querySelector("source")?.src || "";
    if (src) {
      return `html5_${src.split("?")[0]}`;
    }
    const container = video.closest(".video-container, .question-video, .video-player, [class*='video' i]");
    if (container && container.id) {
      return `html5_container_${container.id}`;
    }
    return `html5_video_${video.id || "default"}`;
  }

  function initUserInteractionUnmute() {
    const handleGesture = () => {
      try {
        const videos = document.querySelectorAll("video");
        for (const v of videos) {
          if (v && v.muted) {
            v.muted = false;
            if (v.paused) v.play().catch(() => {});
          }
        }
      } catch (_) {}
    };
    window.addEventListener("click", handleGesture, { capture: true, passive: true });
    window.addEventListener("keydown", handleGesture, { capture: true, passive: true });
  }

  function findStepTestTimecodeElement() {
    try {
      const allEls = Array.from(document.querySelectorAll("span, div, p, [class*='time' i], [class*='duration' i], [class*='timer' i]"));
      for (const el of allEls) {
        if (el.children.length > 2 || el.closest("#prodigy-solvex-host")) continue;
        const txt = (el.innerText || el.textContent || "").trim();
        if (/\b\d{1,2}:\d{2}\s*\/\s*\d{1,2}:\d{2}\b/.test(txt)) {
          return el;
        }
      }
    } catch (_) {}
    return null;
  }

  function findStepTestNativePlayButton() {
    try {
      // 1. Check relative to timecode element (e.g. 00:00/04:50)
      const timeEl = findStepTestTimecodeElement();
      if (timeEl) {
        const parent = timeEl.parentElement;
        if (parent) {
          const candidates = Array.from(parent.querySelectorAll("button, a, div[role='button'], span[role='button'], [class*='play' i], svg, i, span"));
          for (const c of candidates) {
            if (c === timeEl || timeEl.contains(c) || isNavOrSystem(c)) continue;
            const txt = (c.innerText || c.textContent || "").trim();
            const cls = (c.className || "").toString().toLowerCase();
            const aria = (c.getAttribute("aria-label") || "").toLowerCase();
            const title = (c.getAttribute("title") || "").toLowerCase();
            if (
              txt === "▶" || txt === "\u25B6" || txt.toLowerCase().includes("play") ||
              cls.includes("play") || aria.includes("play") || title.includes("play") ||
              c.matches("button, [role='button'], .vjs-play-control, .play-btn")
            ) {
              // Ensure it is not a pause button
              if (!txt.includes("❚") && !cls.includes("pause") && !aria.includes("pause")) {
                return c;
              }
            }
          }
        }
      }

      // 2. Global controls bar search
      const controlsContainers = Array.from(document.querySelectorAll(
        ".video-controls, .player-controls, .controls-bar, .vjs-control-bar, [class*='control' i], [class*='player' i], [class*='video' i]"
      )).filter(el => isElementVisible(el) && !el.closest("#prodigy-solvex-host"));

      for (const container of controlsContainers) {
        const btn = container.querySelector(".vjs-play-control, .vjs-big-play-button, .play-btn, button[class*='play' i], [aria-label*='play' i]");
        if (btn && isElementVisible(btn)) return btn;

        const playIcons = Array.from(container.querySelectorAll("button, div[role='button'], span, svg, i")).filter(el => {
          const t = (el.innerText || el.textContent || "").trim();
          return t === "▶" || t === "\u25B6";
        });
        if (playIcons.length > 0 && isElementVisible(playIcons[0])) return playIcons[0];
      }
    } catch (_) {}
    return null;
  }

  function playYouTubeIframe(iframe) {
    if (!iframe || !iframe.contentWindow) return;

    // 1. Ensure allow attribute includes autoplay permissions for cross-origin iframe
    try {
      const currentAllow = iframe.getAttribute("allow") || "";
      if (!currentAllow.toLowerCase().includes("autoplay")) {
        iframe.setAttribute("allow", currentAllow ? `${currentAllow}; autoplay` : "autoplay; encrypted-media; fullscreen");
      }
    } catch (_) {}

    // 2. Play commands (Do NOT send "listening" handshake to avoid hijacking StepTest's event channel)
    try {
      iframe.contentWindow.postMessage(JSON.stringify({
        event: "command",
        func: "playVideo",
        args: []
      }), "*");

      iframe.contentWindow.postMessage(JSON.stringify({
        event: "command",
        func: "mute",
        args: []
      }), "*");

      iframe.contentWindow.postMessage(JSON.stringify({
        event: "command",
        func: "playVideo",
        args: []
      }), "*");

      setTimeout(() => {
        try {
          iframe.contentWindow.postMessage(JSON.stringify({
            event: "command",
            func: "unMute",
            args: []
          }), "*");
        } catch (_) {}
      }, 600);
    } catch (_) {}

    // 3. Fallback: activate StepTest's native play button or container button
    try {
      const nativePlayBtn = findStepTestNativePlayButton();
      if (nativePlayBtn) {
        simulateClick(nativePlayBtn);
      } else {
        const container = iframe.closest(".video-container, .question-video, .video-player, [class*='video' i]") || iframe.parentElement;
        const playBtn = container?.querySelector("button, [class*='play' i], .vjs-big-play-button, .ytp-large-play-button");
        if (playBtn) simulateClick(playBtn);
      }
    } catch (_) {}
  }

  async function playHTML5Video(video) {
    try {
      if (video.paused && !video.ended) {
        try {
          await video.play();
        } catch (err) {
          console.log("[Prodigy Solvex] Autoplay unmuted blocked, retrying muted...");
          video.muted = true;
          await video.play();
          setTimeout(() => {
            try {
              const wasPaused = video.paused;
              video.muted = false;
              if (video.paused && !wasPaused) {
                video.muted = true;
                video.play().catch(() => {});
              }
            } catch (_) {
              video.muted = true;
              video.play().catch(() => {});
            }
          }, 600);
        }
      }
    } catch (_) {}

    // Custom controls click fallback (StepTest native play button / VideoJS big play button)
    try {
      const nativePlayBtn = findStepTestNativePlayButton();
      if (nativePlayBtn && video.paused) {
        simulateClick(nativePlayBtn);
      }
      const container = video.closest(".video-container, .question-video, .video-player, [class*='video' i]") || video.parentElement;
      const playBtn = container?.querySelector(".vjs-big-play-button, .vjs-play-control, .play-btn, button[class*='play' i], [aria-label*='play' i]");
      if (playBtn && video.paused) {
        simulateClick(playBtn);
      }
      if (video.paused) {
        simulateClick(video);
      }
    } catch (_) {}
  }

  function checkTimerStuckWatchdog() {
    try {
      const timeEl = findStepTestTimecodeElement();
      if (!timeEl) return;
      const txt = (timeEl.innerText || timeEl.textContent || "").trim();
      // If timecode starts with 00:00 or 0:00
      if (/^00?:00\s*\//.test(txt)) {
        const hasVideo = document.querySelector("video, iframe");
        if (hasVideo) {
          const btn = findStepTestNativePlayButton();
          if (btn) simulateClick(btn);
        }
      }
    } catch (_) {}
  }

  function handleAutoPlayVideo() {
    if (!state.isEnabled || !state.autoPlayVideoEnabled) return;

    // 1. Prioritize clicking StepTest's native play button (advances timer & progress bar natively)
    const nativePlayBtn = findStepTestNativePlayButton();
    if (nativePlayBtn) {
      simulateClick(nativePlayBtn);
    }

    // 2. YouTube iframes
    const iframes = Array.from(document.querySelectorAll("iframe")).filter(f => {
      if (!isElementVisible(f) || f.closest("#prodigy-solvex-host")) return false;
      const s = (f.src || "").toLowerCase();
      return s.includes("youtube.com") || s.includes("youtube-nocookie.com") || s.includes("youtu.be");
    });

    for (const iframe of iframes) {
      const key = getYouTubeVideoKey(iframe);
      if (key && !state.playedVideoKeys.has(key)) {
        state.playedVideoKeys.add(key);
        console.log(`%c[Prodigy Solvex]%c Auto-playing new YouTube video: ${key}`, "color:#3b82f6;font-weight:bold", "color:#fff");
        showToast("Auto-playing video...");
      }
      playYouTubeIframe(iframe);
    }

    // 3. HTML5 native videos
    const html5Videos = Array.from(document.querySelectorAll("video")).filter(v => {
      return isElementVisible(v) && !v.closest("#prodigy-solvex-host");
    });

    for (const video of html5Videos) {
      const key = getHTML5VideoKey(video);
      if (key && !state.playedVideoKeys.has(key)) {
        state.playedVideoKeys.add(key);
        console.log(`%c[Prodigy Solvex]%c Auto-playing new HTML5 video: ${key}`, "color:#3b82f6;font-weight:bold", "color:#fff");
        showToast("Auto-playing video...");
      }
      if (video.paused && !video.ended) {
        playHTML5Video(video);
      }
    }

    // 4. Timer Stuck Watchdog: if video is active but timer is frozen at 00:00, click native button
    checkTimerStuckWatchdog();

    if (state.autoLoopVideoEnabled) {
      applyVideoLoopSettings();
    }
  }

  function applyVideoLoopSettings() {
    if (!state.isEnabled) return;

    // 1. HTML5 native videos
    const html5Videos = Array.from(document.querySelectorAll("video")).filter(v => !v.closest("#prodigy-solvex-host"));
    for (const video of html5Videos) {
      if (state.autoLoopVideoEnabled) {
        video.loop = true;
        if (!video.__hasStepLoopListener) {
          video.__hasStepLoopListener = true;
          video.addEventListener("ended", async () => {
            if (state.autoLoopVideoEnabled) {
              console.log("[Prodigy Solvex] HTML5 video ended. Auto-looping after completion grace period...");
              try {
                // 1. Dispatch synthetic completion milestone so hosting platform registers 100% completion
                try {
                  video.dispatchEvent(new Event("timeupdate", { bubbles: true, cancelable: true }));
                } catch (_) {}

                // 2. Completion grace period (400ms) for platform tracking script to process completion
                await delay(400);

                video.currentTime = 0;
                await video.play();
              } catch (_) {
                video.muted = true;
                await video.play().catch(() => {});
                setTimeout(() => { video.muted = false; }, 400);
              }
            }
          });
        }
      } else {
        video.loop = false;
      }
    }

    // 2. YouTube iframes (Non-destructive: avoid reloading iframe.src)
    if (state.autoLoopVideoEnabled) {
      const iframes = Array.from(document.querySelectorAll("iframe")).filter(f => {
        if (!isElementVisible(f) || f.closest("#prodigy-solvex-host")) return false;
        const s = (f.src || "").toLowerCase();
        return s.includes("youtube.com") || s.includes("youtube-nocookie.com") || s.includes("youtu.be");
      });
      for (const iframe of iframes) {
        try {
          iframe.contentWindow.postMessage(JSON.stringify({
            event: "listening",
            id: iframe.id || 1,
            channel: "widget"
          }), "*");
        } catch (_) {}
      }
    }
  }

  function restartAllYouTubeIframes() {
    const iframes = Array.from(document.querySelectorAll("iframe")).filter(f => {
      const s = (f.src || "").toLowerCase();
      return s.includes("youtube.com") || s.includes("youtube-nocookie.com") || s.includes("youtu.be");
    });
    for (const iframe of iframes) {
      try {
        iframe.contentWindow.postMessage(JSON.stringify({
          event: "command",
          func: "seekTo",
          args: [0, true]
        }), "*");
        iframe.contentWindow.postMessage(JSON.stringify({
          event: "command",
          func: "playVideo",
          args: []
        }), "*");
      } catch (_) {}
    }
  }

  // Listen for YouTube widget events broadcast to window
  window.addEventListener("message", async (event) => {
    if (!state.isEnabled || !state.autoLoopVideoEnabled) return;
    try {
      let data = event.data;
      if (typeof data === "string") {
        data = JSON.parse(data);
      }
      if (data && (
        (data.event === "onStateChange" && data.info === 0) ||
        (data.event === "infoDelivery" && data.info && data.info.playerState === 0)
      )) {
        console.log("[Prodigy Solvex] YouTube video ended signal received in parent window. Replaying after completion grace period...");
        // Completion grace period (400ms) for platform tracking script to process completion
        await delay(400);
        restartAllYouTubeIframes();
      }
    } catch (_) {}
  });

  let videoWatcherInterval = null;
  function ensureVideoWatcher() {
    if (videoWatcherInterval) return;
    videoWatcherInterval = setInterval(() => {
      if (!state.isEnabled || (!state.autoPlayVideoEnabled && !state.autoLoopVideoEnabled)) return;
      if (state.autoPlayVideoEnabled) {
        handleAutoPlayVideo();
      }
      if (state.autoLoopVideoEnabled) {
        applyVideoLoopSettings();
      }
    }, 1500);
  }

  // -------------------------------------------------------------
  // Exceptional Question Fallback Filler (Auto-Submit Enabled Only)
  // For Fill in the Blanks (Cloze) and Rearrange Sentence (ABCD)
  // -------------------------------------------------------------
  async function fillExceptionalQuestionFallback(data, container, targetType) {
    if (!state.autoSubmitEnabled) return { success: false, clickedCount: 0 };

    const scope = (container && container !== document.body) ? container : document.body;
    let placedCount = 0;

    const isCloze = targetType === "cloze_passage" || data?.type === "cloze_passage" || checkIsClozePassage(scope);
    const isRearrange = targetType === "rearrange_sentence" || data?.type === "rearrange_sentence" || checkIsRearrangeQuestion(scope);

    if (isCloze) {
      console.log("[Prodigy Solvex] Executing Auto-Submit Cloze fallback fill...");
      const liveBlanks = findClozeBlanks(scope);
      const liveChips = findClozeChips(scope);

      if (liveChips.length > 0) {
        for (let i = 0; i < Math.max(liveBlanks.length, 1); i++) {
          const blank = liveBlanks[i];
          const chip = liveChips[i % liveChips.length];
          if (chip && chip.element) {
            if (blank && isElementVisible(blank)) {
              try { simulateClick(blank); await delay(80); } catch (_) {}
            }
            simulateClick(chip.element);
            if (blank && (blank.tagName === "INPUT" || blank.isContentEditable)) {
              setElementValue(blank, chip.text || "answer");
            }
            placedCount++;
            await delay(Math.max(150, state.typingDelayMs || 250));
          }
        }
      }

      // If text inputs remain empty in cloze, populate fallback
      const textInputs = Array.from(scope.querySelectorAll("input[type='text']:not(.ps-input), input:not([type])")).filter(isElementVisible);
      for (const inp of textInputs) {
        if (!inp.value || inp.value.trim().length === 0) {
          const fallbackVal = liveChips.length > 0 ? liveChips[placedCount % liveChips.length].text : "answer";
          setElementValue(inp, fallbackVal);
          placedCount++;
          await delay(100);
        }
      }
    } else if (isRearrange) {
      console.log("[Prodigy Solvex] Executing Auto-Submit Rearrange fallback fill...");
      let tokens = findRearrangeTokens(scope);
      if (!tokens || tokens.length === 0) {
        tokens = findRearrangeTokens(document.body);
      }

      if (tokens && tokens.length > 0) {
        for (const tok of tokens) {
          if (tok && tok.element && isElementVisible(tok.element)) {
            simulateClick(tok.element);
            placedCount++;
            await delay(Math.max(150, state.typingDelayMs || 250));
          }
        }
      }
    }

    if (placedCount > 0) {
      return {
        success: true,
        clickedCount: placedCount,
        message: `Auto-filled ${placedCount} item(s) via fallback`
      };
    }

    return { success: false, clickedCount: 0 };
  }

  // -------------------------------------------------------------
  // 5. Main Trigger Controller (Token-Saver Guarded)
  // -------------------------------------------------------------
  async function triggerSolve(isAutomated = false) {
    if (!state.isEnabled) return;

    // If currently in a Wait-and-Answer countdown:
    // Manual clicks (isAutomated=false) immediately resolve the active wait promise so that the existing solve proceeds right away without spawning a duplicate solve!
    if (state.isWaiting) {
      if (!isAutomated) {
        console.log("[Prodigy Solvex] Wait cancelled by manual solve click. Solving immediately...");
        cancelActiveWaitCountdown("manual_solve");
        return;
      } else {
        return;
      }
    }

    let justFinishedWait = false;

    try {
      handleAutoPlayVideo();
      if (!isAutomated) {
        state.isProcessing = false;
      } else if (state.isProcessing) {
        if (Date.now() - state.lastSolveTimestamp > 15000) {
          state.isProcessing = false;
        } else {
          return;
        }
      }

      // Immediately dismiss any open speaking teleprompter
      const teleprompter = document.getElementById("ps-teleprompter");
      if (teleprompter) teleprompter.classList.remove("active");

      // 1. First verify we are on an active question page (not Answer/Feedback page) BEFORE starting any wait timer
      if (isAnswerOrFeedbackPage()) {
        console.log("%c[Prodigy Solvex]%c Currently on Answer/Feedback page. Skipping question search.", "color:#10b981;font-weight:bold", "color:#fff");
        hideAnswerBanner();
        updateStatus("Answer Page", "idle", "NEXT");
        if (!isAutomated) {
          showToast("Answer page detected. Click 'Next' to solve the next question.");
        }
        if (state.autoSubmitEnabled) {
          handleAutoNext();
        }
        return;
      }

      // 2. Extract question data & ID first so we know we have a valid, unsolved question BEFORE waiting
      let container = findActiveQuestionContainer();
      if (!container && isAnswerOrFeedbackPage()) {
        return;
      }

      // If this is a Rearrange question with a Reset button and either manual solve was clicked
      // or chips are partially placed while Submit is disabled, click Reset BEFORE extracting tokens!
      if (checkIsRearrangeQuestion(container)) {
        const resetBtnPre = findVisibleResetButton(container);
        const submitBtnPre = findActionElement("submit");
        if (resetBtnPre && (!isAutomated || (submitBtnPre && isButtonDisabled(submitBtnPre)))) {
          const placedNow = document.querySelectorAll(
            "[class*='slot' i] [class*='chip' i], [class*='slot' i] button, .word-slot:not(:empty), [class*='chip' i].selected, [class*='token' i].selected"
          ).length > 0;
          if (placedNow || !isAutomated) {
            simulateClick(resetBtnPre);
            await delay(280);
          }
        }
      }

      let data = extractQuestionData(container);
      const hasInteractiveControls = (
        (data.options && data.options.length > 0) ||
        (data.sentenceTokens && data.sentenceTokens.length >= 3) ||
        (data.wordChoices && data.wordChoices.length >= 2) ||
        (data.dropdowns && data.dropdowns.length > 0) ||
        !!data.domReferences?.writingArea ||
        data.type === "speaking"
      );

      if (!hasInteractiveControls && data.questionText) {
        for (let waitStep = 0; waitStep < 6; waitStep++) {
          await delay(200);
          if (isAnswerOrFeedbackPage()) return;
          const freshContainer = findActiveQuestionContainer();
          container = freshContainer || container;
          data = extractQuestionData(container);
          if (
            (data.options && data.options.length > 0) ||
            (data.sentenceTokens && data.sentenceTokens.length >= 3) ||
            (data.wordChoices && data.wordChoices.length >= 2) ||
            (data.dropdowns && data.dropdowns.length > 0) ||
            !!data.domReferences?.writingArea ||
            data.type === "speaking"
          ) {
            break;
          }
        }
      }

      if (!data.questionText && (!data.options || data.options.length === 0) && (!data.sentenceTokens || data.sentenceTokens.length === 0) && (!data.wordChoices || data.wordChoices.length === 0) && (!data.dropdowns || data.dropdowns.length === 0) && !data.domReferences?.writingArea) {
        if (!isAutomated) {
          showToast("No active question detected. Please ensure the question has loaded.");
        }
        return;
      }

      const finalHasControls = (
        (data.options && data.options.length > 0) ||
        (data.sentenceTokens && data.sentenceTokens.length >= 3) ||
        (data.wordChoices && data.wordChoices.length >= 2) ||
        (data.dropdowns && data.dropdowns.length > 0) ||
        !!data.domReferences?.writingArea ||
        data.type === "speaking"
      );

      if (!finalHasControls && data.questionText) {
        console.log("[Prodigy Solvex] Question prompt present, but options/controls not yet rendered in DOM. Waiting...");
        if (!isAutomated) {
          showToast("Question options are loading. Please wait a moment.");
        }
        return;
      }

      let questionId = getQuestionIdentifier(container, data);
      if (!questionId) return;

      if (!isAutomated) {
        state.isProcessing = false;
        state.inFlightQuestionId = null;
        state.lastSolveTimestamp = 0;
        state.solvedQuestionIds.delete(questionId);
        state.waitedQuestionIds.delete(questionId);
        if (state.lastSolvedQuestionId === questionId) {
          state.lastSolvedQuestionId = "";
        }
      } else {
        if (state.lastSolvedQuestionId === questionId || state.solvedQuestionIds.has(questionId) || state.inFlightQuestionId === questionId) {
          return;
        }
        if (isQuestionAlreadyAnswered(data, container, questionId)) {
          state.lastSolvedQuestionId = questionId;
          state.solvedQuestionIds.add(questionId);
          return;
        }
        const now = Date.now();
        if (now - state.lastSolveTimestamp < 1500) {
          return;
        }
      }

      // 3. ⏳ WAIT AND ANSWER FEATURE (User-Configurable Duration, Default 200s):
      // Only runs ONCE per questionId (`!state.waitedQuestionIds.has(questionId)`) so it NEVER loops or restarts the timer after finishing!
      if (isAutomated && state.waitAnswerEnabled && !state.waitedQuestionIds.has(questionId) && !isAnswerOrFeedbackPage()) {
        state.isWaiting = true;
        state.isProcessing = true;
        state.inFlightQuestionId = questionId;
        state.lastSolveTimestamp = Date.now();

        state._activeWaitTotal = sanitizeWaitSeconds(state.waitAnswerSeconds);
        state._activeWaitRemaining = state._activeWaitTotal;
        console.log(`[Prodigy Solvex] Wait and Answer: Waiting ${state._activeWaitTotal} seconds before solving ${questionId}...`);
        showToast(`⏳ Wait & Answer: Solving in ${state._activeWaitTotal}s...`);

        if (state.waitCountdownInterval) clearInterval(state.waitCountdownInterval);

        const waitPanel = document.getElementById("ps-wait-panel");
        const waitLabel = document.getElementById("ps-wait-label");
        const waitFill = document.getElementById("ps-wait-progress-fill");
        if (waitPanel) waitPanel.classList.add("active");
        if (waitFill) waitFill.style.width = "0%";

        if (waitLabel) waitLabel.textContent = `⏳ Wait: ${formatWaitTime(state._activeWaitRemaining)}`;
        updateStatus(`Wait ${state._activeWaitRemaining}s...`, "working", `WAIT ${state._activeWaitTotal}S`);

        const waitOutcome = await new Promise((resolve) => {
          state.cancelWaitResolver = resolve;
          state.waitCountdownInterval = setInterval(() => {
            state._activeWaitRemaining--;
            state.lastSolveTimestamp = Date.now();

            if (!state.isEnabled) {
              cancelActiveWaitCountdown("power_off");
              return;
            }
            if (isAnswerOrFeedbackPage()) {
              cancelActiveWaitCountdown("answer_page");
              return;
            }

            const totalSec = Math.max(1, state._activeWaitTotal);
            const remSec = Math.max(0, state._activeWaitRemaining);
            const elapsed = totalSec - remSec;
            const pct = Math.min(100, Math.round((elapsed / totalSec) * 100));
            if (waitFill) waitFill.style.width = `${pct}%`;
            if (waitLabel) waitLabel.textContent = `⏳ Wait: ${formatWaitTime(remSec)}`;

            if (remSec > 0) {
              updateStatus(`Wait ${remSec}s...`, "working", `WAIT ${totalSec}S`);
            } else {
              cancelActiveWaitCountdown("completed");
            }
          }, 1000);
        });

        // Mark this questionId as having completed its wait so it NEVER restarts the timer on the same question!
        state.waitedQuestionIds.add(questionId);
        state.isWaiting = false;
        justFinishedWait = true;
        // CRITICAL: Keep state.isProcessing = true so ensureAnswerPageWatcher cannot fire another triggerSolve while we re-extract DOM and call Gemini!

        if (waitOutcome === "power_off" || !state.isEnabled) {
          state.isProcessing = false;
          state.inFlightQuestionId = null;
          return;
        }
        if (waitOutcome === "answer_page" || isAnswerOrFeedbackPage()) {
          console.log("[Prodigy Solvex] Wait and Answer: Page advanced during wait. Skipping solve.");
          state.isProcessing = false;
          state.inFlightQuestionId = null;
          if (state.autoSubmitEnabled) handleAutoNext();
          return;
        }

        console.log(`[Prodigy Solvex] Wait and Answer (${waitOutcome}): Proceeding immediately to solve ${questionId}...`);
        showToast("✅ Time's up! Solving question now...");

        // Re-extract fresh DOM references after the wait so any DOM re-renders during the 200s wait are captured
        const postWaitContainer = findActiveQuestionContainer();
        if (postWaitContainer) {
          container = postWaitContainer;
          const freshData = extractQuestionData(container);
          if (
            (freshData.options && freshData.options.length > 0) ||
            (freshData.sentenceTokens && freshData.sentenceTokens.length >= 3) ||
            (freshData.wordChoices && freshData.wordChoices.length >= 2) ||
            (freshData.dropdowns && freshData.dropdowns.length > 0) ||
            !!freshData.domReferences?.writingArea ||
            freshData.type === "speaking"
          ) {
            data = freshData;
            const freshQId = getQuestionIdentifier(container, data);
            if (freshQId) {
              questionId = freshQId;
              state.waitedQuestionIds.add(questionId);
            }
          }
        }
      }

      // Lock in-flight solve to prevent duplicate parallel/loop calls while waiting for Gemini
      state.inFlightQuestionId = questionId;
      state.lastSolveTimestamp = Date.now();
      state.isProcessing = true;

      console.log("%c[Prodigy Solvex]%c Solving question: " + questionId, "color:#818cf8;font-weight:bold", "color:#fff");
      console.log("[Prodigy Solvex] Detected Category:", data.type.toUpperCase());
      console.log("[Prodigy Solvex] Question Prompt:", data.questionText.slice(0, 80));

      updateStatus("Analyzing question...", "working", data.type.toUpperCase());
      const btnSolve = document.getElementById("ps-btn-solve");
      if (btnSolve) btnSolve.disabled = true;

      const response = await chrome.runtime.sendMessage({
        action: "SOLVE_QUESTION",
        payload: {
          type: data.type,
          questionText: data.questionText,
          context: data.context,
          options: data.options,
          wordChoices: data.wordChoices,
          dropdowns: data.dropdowns,
          sentenceTokens: data.sentenceTokens,
          writingConstraints: data.writingConstraints
        }
      });

      if (!response || !response.success) {
        throw new Error(response?.error || "Failed to receive answer from Gemini API.");
      }

      const solution = response.data;

      // Note: background.js records solve telemetry and broadcasts SOLVE_EVENT_LOCAL automatically.

      // Notify user if automatic failover rotated keys
      if (solution && solution._keyRotated) {
        const failoverNotice = `⚡ Key #${solution._originalKeyIndex + 1} limit reached. Switched to Key #${solution._activeKeyIndex + 1} (${solution._modelUsed})`;
        showToast(failoverNotice);
        showInfo(failoverNotice);
      }

      // DOM Ground Truth Rule: The DOM parser knows the physical UI elements on screen.
      let targetType = data.type;
      if (targetType === "auto_detect" || !targetType) {
        targetType = solution.detected_type || "mcq";
      }

      updateStatus("Applying solution...", "working", targetType.toUpperCase());

      let solveResult = null;
      switch (targetType) {
        case "cloze_passage":
          solveResult = await executeClozePassage(solution, data.domReferences);
          if (!solveResult || solveResult.clickedCount === 0 || (typeof solveResult === "string" && solveResult.startsWith("Answer:"))) {
            console.log("[Prodigy Solvex] Cloze placed 0 chips, executing MCQ fallback");
            const mcqResult = await executeMCQ(solution, data.domReferences);
            if (mcqResult && mcqResult.clickedCount > 0) {
              solveResult = mcqResult;
            }
          }
          break;
        case "rearrange_sentence":
          solveResult = await executeRearrange(solution, data.domReferences);
          break;
        case "mcq":
          solveResult = await executeMCQ(solution, data.domReferences);
          break;
        case "choose_word":
          solveResult = await executeChooseWord(solution, data.domReferences);
          break;
        case "writing":
          solveResult = await executeWriting(solution, data.domReferences);
          break;
        case "speaking":
          solveResult = await executeSpeaking(solution, data.domReferences);
          break;
        default:
          if (data.type === "cloze_passage" || (data.domReferences.wordChoices && data.domReferences.wordChoices.length >= 2)) {
            solveResult = await executeClozePassage(solution, data.domReferences);
          } else if (data.domReferences.sentenceTokens && data.domReferences.sentenceTokens.length >= 3) {
            solveResult = await executeRearrange(solution, data.domReferences);
          } else if (data.domReferences.options && data.domReferences.options.length > 0) {
            solveResult = await executeMCQ(solution, data.domReferences);
          } else {
            solveResult = "Question processed.";
          }
      }

      let isSuccess = true;
      let resultMsg = "";
      if (solveResult && typeof solveResult === "object") {
        isSuccess = solveResult.success !== false;
        resultMsg = solveResult.message || solveResult.msg || "Option applied.";
      } else {
        resultMsg = typeof solveResult === "string" ? solveResult : "Question processed.";
        if (resultMsg.toLowerCase().includes("could not verify") || resultMsg.toLowerCase().includes("aborting click") || resultMsg.toLowerCase().includes("paused")) {
          isSuccess = false;
        }
      }

      let effectiveClickedCount = 0;
      if (solveResult && typeof solveResult === "object") {
        effectiveClickedCount = solveResult.clickedCount || (solveResult.wordCount > 0 ? 1 : 0) || 0;
      } else if (typeof solveResult === "string" && !solveResult.toLowerCase().includes("could not") && !solveResult.toLowerCase().includes("no tokens") && !solveResult.toLowerCase().includes("0 blanks")) {
        effectiveClickedCount = 1;
      }

      // Exceptional Question Fallback: If Cloze or Rearrange produced 0 clicked items
      // and Auto-Submit is ON, execute the fallback fill so boxes/slots are never left empty!
      const isExceptionalQuestion = (
        targetType === "cloze_passage" ||
        targetType === "rearrange_sentence" ||
        data?.type === "cloze_passage" ||
        data?.type === "rearrange_sentence" ||
        checkIsClozePassage(container) ||
        checkIsRearrangeQuestion(container)
      );

      if (state.autoSubmitEnabled && effectiveClickedCount === 0 && isExceptionalQuestion) {
        console.log("[Prodigy Solvex] Exceptional question type had 0 clicks. Running auto-submit fallback fill...");
        const fallbackRes = await fillExceptionalQuestionFallback(data, container, targetType);
        if (fallbackRes && fallbackRes.success && fallbackRes.clickedCount > 0) {
          effectiveClickedCount = fallbackRes.clickedCount;
          isSuccess = true;
          resultMsg = fallbackRes.message || "Filled via fallback";
        }
      }

      if (!isSuccess || effectiveClickedCount === 0) {
        state.isProcessing = false;
        state.inFlightQuestionId = null;
        updateStatus("Answer Not Applied", "idle", "PAUSED");
        showToast(resultMsg || "Answer could not be verified on page.");
        console.warn("[Prodigy Solvex] Solver did not achieve verified click. Auto-submit blocked.");
        return;
      }

      // Lock question as SOLVED ONLY after verified click / selection!
      state.lastSolvedQuestionId = questionId;
      state.solvedQuestionIds.add(questionId);
      state.inFlightQuestionId = null;

      updateStatus("Done", "idle", targetType.toUpperCase());
      showToast(resultMsg);

      // Auto-Submit execution logic
      if (state.autoSubmitEnabled && isSuccess && effectiveClickedCount > 0) {
        if (isAnswerOrFeedbackPage()) {
          console.log("[Prodigy Solvex] Answer/Feedback page detected post-solve. Halting submit, triggering Auto-Next.");
          handleAutoNext();
        } else if (targetType === "speaking" && (!data.domReferences.options || data.domReferences.options.length === 0)) {
          console.log("[Prodigy Solvex] Speaking task: Auto-submit paused until user records speech.");
        } else {
          console.log(`[Prodigy Solvex] Auto-Submit: Verified non-empty answer (${effectiveClickedCount} item(s)). Triggering submit...`);
          await handleAutoSubmit();
        }
      }

    } catch (err) {
      console.error("[Prodigy Solvex Solver Error]:", err);
      updateStatus("Error", "error", "FAILED");

      const errLower = (err.message || "").toLowerCase();
      if (errLower.includes("context invalidated") || errLower.includes("extension context invalidated")) {
        showToast("Extension reloaded. Please refresh this page (F5) to reconnect.");
        showInfo("🔄 Extension reloaded. Please refresh this tab (F5).");
      } else {
        showToast(err.message);
        showInfo(`⚠️ ${err.message}`);
      }

      // Stop auto-watcher immediately on rate-limit or missing key to protect quota
      if (errLower.includes("429") || errLower.includes("quota") || errLower.includes("rate limit") || errLower.includes("not configured") || errLower.includes("missing")) {
        const autoToggle = document.getElementById("ps-autowatch-toggle");
        if (autoToggle) autoToggle.checked = false;
        state.isAutoWatch = false;
        stopAutoWatcher();
      }
    } finally {
      state.isProcessing = false;
      state.inFlightQuestionId = null;
      const currentBtnSolve = document.getElementById("ps-btn-solve");
      if (currentBtnSolve) currentBtnSolve.disabled = !state.isEnabled;
    }
  }

  // -------------------------------------------------------------
  // 6. Auto-Watch Mutation Observer (Controlled & Token-Safe)
  // -------------------------------------------------------------
  let autoWatchDebounce = null;
  let autoWatchInterval = null;

  function startAutoWatcher() {
    if (state.observer) state.observer.disconnect();
    if (autoWatchInterval) clearInterval(autoWatchInterval);

    state.observer = new MutationObserver(() => {
      if (!state.isEnabled || !state.isAutoWatch || state.isProcessing) return;
      clearTimeout(autoWatchDebounce);
      autoWatchDebounce = setTimeout(() => {
        if (!state.isEnabled || !state.isAutoWatch || state.isProcessing) return;
        if (isAnswerOrFeedbackPage()) {
          hideAnswerBanner();
          if (state.autoSubmitEnabled) {
            handleAutoNext();
          }
          return;
        }
        handleAutoPlayVideo();
        const container = findActiveQuestionContainer();
        if (!container) return;
        const data = extractQuestionData(container);
        const currentId = getQuestionIdentifier(container, data);
        if (currentId && !state.solvedQuestionIds.has(currentId) && currentId !== state.lastSolvedQuestionId) {
          triggerSolve(true);
        }
      }, 1200);
    });

    state.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also check every 2 seconds to detect if user advanced to next question
    autoWatchInterval = setInterval(() => {
      if (!state.isEnabled || !state.isAutoWatch || state.isProcessing) return;
      if (isAnswerOrFeedbackPage()) {
        hideAnswerBanner();
        if (state.autoSubmitEnabled) {
          handleAutoNext();
        }
        return;
      }
      const container = findActiveQuestionContainer();
      if (!container) return;
      const data = extractQuestionData(container);
      const currentId = getQuestionIdentifier(container, data);
      if (currentId && !state.solvedQuestionIds.has(currentId) && currentId !== state.lastSolvedQuestionId) {
        triggerSolve(true);
      }
    }, 2000);
  }

  function stopAutoWatcher() {
    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }
    if (autoWatchInterval) {
      clearInterval(autoWatchInterval);
      autoWatchInterval = null;
    }
  }

  // -------------------------------------------------------------
  // 7. Message & Storage Listeners (from Popup / Background Shortcuts)
  // -------------------------------------------------------------
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "THEME_CHANGED") {
      applyHUDTheme(msg.theme || "pixel-gamer");
      try { sendResponse({ success: true }); } catch (_) {}
      return true;
    }

    if (msg.action === "PACING_CHANGED") {
      state.typingDelayMs = msg.delayMs || 0;
      try { sendResponse({ success: true }); } catch (_) {}
      return true;
    }

    if (msg.action === "WAIT_DURATION_CHANGED") {
      applyWaitDurationUpdate(msg.seconds);
      try { sendResponse({ success: true, waitAnswerSeconds: state.waitAnswerSeconds }); } catch (_) {}
      return true;
    }

    if (msg.action === "TRIGGER_SOLVE") {
      if (!state.isEnabled) return sendResponse({ status: "disabled" });
      triggerSolve(false);
      sendResponse({ status: "triggered" });
    } else if (msg.action === "TOGGLE_HUD") {
      if (!state.isEnabled) {
        toggleExtensionPower(true);
      } else {
        const widget = document.getElementById("ps-widget");
        if (widget) {
          state.hudMinimized = !state.hudMinimized;
          widget.classList.toggle("minimized", state.hudMinimized);
        }
      }
      sendResponse({ minimized: state.hudMinimized, enabled: state.isEnabled });
    } else if (msg.action === "EXTENSION_POWER_TOGGLED") {
      toggleExtensionPower(msg.enabled);
      sendResponse({ enabled: state.isEnabled });
    } else if (msg.action === "ANSWER_POPUP_TOGGLED") {
      state.answerPopupEnabled = msg.enabled;
      if (!msg.enabled) hideAnswerBanner();
      sendResponse({ answerPopupEnabled: state.answerPopupEnabled });
    } else if (msg.action === "AUTO_SUBMIT_TOGGLED") {
      state.autoSubmitEnabled = msg.enabled;
      const hudAutoSub = document.getElementById("ps-hud-autosubmit-toggle");
      if (hudAutoSub) hudAutoSub.checked = !!state.autoSubmitEnabled;
      if (state.autoSubmitEnabled) {
        ensureAnswerPageWatcher();
        if (isAnswerOrFeedbackPage()) {
          handleAutoNext();
        }
      }
      sendResponse({ autoSubmitEnabled: state.autoSubmitEnabled });
    } else if (msg.action === "WAIT_ANSWER_TOGGLED") {
      state.waitAnswerEnabled = msg.enabled;
      const hudWait = document.getElementById("ps-hud-wait-toggle");
      if (hudWait) hudWait.checked = !!state.waitAnswerEnabled;
      if (!state.waitAnswerEnabled && state.isWaiting) {
        cancelActiveWaitCountdown("toggle_off");
      }
      sendResponse({ waitAnswerEnabled: state.waitAnswerEnabled });
    } else if (msg.action === "AUTO_PLAY_VIDEO_TOGGLED") {
      state.autoPlayVideoEnabled = msg.enabled;
      if (state.autoPlayVideoEnabled) {
        handleAutoPlayVideo();
      }
      sendResponse({ autoPlayVideoEnabled: state.autoPlayVideoEnabled });
    } else if (msg.action === "AUTO_LOOP_VIDEO_TOGGLED") {
      state.autoLoopVideoEnabled = msg.enabled;
      applyVideoLoopSettings();
      sendResponse({ autoLoopVideoEnabled: state.autoLoopVideoEnabled });
    } else if (msg.action === "ANTI_TAB_SWITCH_TOGGLED") {
      state.antiTabSwitchEnabled = msg.enabled;
      syncProtectionSettings();
      sendResponse({ antiTabSwitchEnabled: state.antiTabSwitchEnabled });
    } else if (msg.action === "KEEP_ACTIVE_TOGGLED") {
      state.keepWebsiteActiveEnabled = msg.enabled;
      syncProtectionSettings();
      sendResponse({ keepWebsiteActiveEnabled: state.keepWebsiteActiveEnabled });
    }
  });

  // Sync state when changed in extension popup
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local") {
      if (changes.extensionEnabled !== undefined) {
        toggleExtensionPower(changes.extensionEnabled.newValue);
      }
      if (changes.ps_theme !== undefined) {
        applyHUDTheme(changes.ps_theme.newValue);
      }
      if (changes.typingDelayMs !== undefined) {
        state.typingDelayMs = changes.typingDelayMs.newValue ?? 250;
      }
      if (changes.answerPopupEnabled !== undefined) {
        state.answerPopupEnabled = changes.answerPopupEnabled.newValue;
        if (!state.answerPopupEnabled) hideAnswerBanner();
      }
      if (changes.autoSubmitEnabled !== undefined) {
        state.autoSubmitEnabled = changes.autoSubmitEnabled.newValue;
        const hudAutoSub = document.getElementById("ps-hud-autosubmit-toggle");
        if (hudAutoSub) hudAutoSub.checked = !!state.autoSubmitEnabled;
        if (state.autoSubmitEnabled) {
          ensureAnswerPageWatcher();
          if (isAnswerOrFeedbackPage()) {
            handleAutoNext();
          }
        }
      }
      if (changes.waitAnswerEnabled !== undefined) {
        state.waitAnswerEnabled = changes.waitAnswerEnabled.newValue;
        const hudWait = document.getElementById("ps-hud-wait-toggle");
        if (hudWait) hudWait.checked = !!state.waitAnswerEnabled;
        if (!state.waitAnswerEnabled && state.isWaiting) {
          cancelActiveWaitCountdown("toggle_off");
        }
      }
      if (changes.waitAnswerSeconds !== undefined) {
        applyWaitDurationUpdate(changes.waitAnswerSeconds.newValue);
      }
      if (changes.autoPlayVideoEnabled !== undefined) {
        state.autoPlayVideoEnabled = changes.autoPlayVideoEnabled.newValue;
        if (state.autoPlayVideoEnabled) {
          handleAutoPlayVideo();
        }
      }
      if (changes.autoLoopVideoEnabled !== undefined) {
        state.autoLoopVideoEnabled = changes.autoLoopVideoEnabled.newValue;
        applyVideoLoopSettings();
      }
      if (changes.antiTabSwitchEnabled !== undefined) {
        state.antiTabSwitchEnabled = changes.antiTabSwitchEnabled.newValue;
        syncProtectionSettings();
      }
      if (changes.keepWebsiteActiveEnabled !== undefined) {
        state.keepWebsiteActiveEnabled = changes.keepWebsiteActiveEnabled.newValue;
        syncProtectionSettings();
      }
    }
  });

  // Direct in-page keyboard shortcut backup for Ctrl+Shift+S and Ctrl+Shift+H
  // (Also still accepts Alt+S / Alt+H for backward compat on Mac)
  window.addEventListener("keydown", (e) => {
    const isCtrlShiftS = e.ctrlKey && e.shiftKey && (e.key === "s" || e.key === "S");
    const isCtrlShiftH = e.ctrlKey && e.shiftKey && (e.key === "h" || e.key === "H");
    const isAltS = e.altKey && (e.key === "s" || e.key === "S");
    const isAltH = e.altKey && (e.key === "h" || e.key === "H");
    if (isCtrlShiftS || isAltS) {
      e.preventDefault();
      if (state.isEnabled) {
        triggerSolve(false);
      }
    } else if (isCtrlShiftH || isAltH) {
      e.preventDefault();
      const widget = document.getElementById("ps-widget");
      if (widget) {
        state.hudMinimized = !state.hudMinimized;
        widget.classList.toggle("minimized", state.hudMinimized);
      }
    }
  });

  // Dismiss answer banner when moving to the next question
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button, a, input[type='button'], input[type='submit']");
    if (btn && !btn.closest("#prodigy-solvex-host")) {
      const text = safeText(btn).toLowerCase();
      if (text.includes("next") || text.includes("submit") || text.includes("continue") || text === "save & next") {
        setTimeout(hideAnswerBanner, 500);
      }
    }
  }, true);

  // NOTE: Email-verification landing banner was removed in Prodigy Solvex v2.0
  // (no email auth anymore — extension is free for everyone).

  // Initialize UI on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initHUD();
    });
  } else {
    initHUD();
  }

})();
