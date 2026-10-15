// page_protection.js - Main World Anti-Tab-Switching, Active Session Shield & React Fiber Bridge
// Executes directly in the web page execution context (world: "MAIN")

(function () {
  "use strict";

  if (window.__PRODIGY_SOLVEX_PROTECTION_INITIALIZED__) return;
  window.__PRODIGY_SOLVEX_PROTECTION_INITIALIZED__ = true;

  // Active Protection Settings (Synchronized from extension storage via postMessage)
  const protectionState = {
    antiTabSwitchEnabled: true,
    keepWebsiteActiveEnabled: true
  };

  // Try to restore last known settings from sessionStorage if available
  try {
    const cached = sessionStorage.getItem("__prodigy_solvex_protection_state__");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (typeof parsed.antiTabSwitchEnabled === "boolean") protectionState.antiTabSwitchEnabled = parsed.antiTabSwitchEnabled;
      if (typeof parsed.keepWebsiteActiveEnabled === "boolean") protectionState.keepWebsiteActiveEnabled = parsed.keepWebsiteActiveEnabled;
    }
  } catch (_) {}

  // -------------------------------------------------------------
  // 1. Anti-Tab-Switching: Override Document Visibility & Focus APIs
  // -------------------------------------------------------------
  try {
    const docProto = Document.prototype;
    const origVisState = Object.getOwnPropertyDescriptor(docProto, "visibilityState") ||
                         Object.getOwnPropertyDescriptor(document, "visibilityState");

    Object.defineProperty(document, "visibilityState", {
      get: function () {
        if (protectionState.antiTabSwitchEnabled) {
          return "visible";
        }
        return origVisState && origVisState.get ? origVisState.get.call(this) : "visible";
      },
      configurable: true,
      enumerable: true
    });

    const origHidden = Object.getOwnPropertyDescriptor(docProto, "hidden") ||
                       Object.getOwnPropertyDescriptor(document, "hidden");

    Object.defineProperty(document, "hidden", {
      get: function () {
        if (protectionState.antiTabSwitchEnabled) {
          return false;
        }
        return origHidden && origHidden.get ? origHidden.get.call(this) : false;
      },
      configurable: true,
      enumerable: true
    });

    const origHasFocus = docProto.hasFocus || document.hasFocus;
    document.hasFocus = function () {
      if (protectionState.antiTabSwitchEnabled) {
        return true;
      }
      return origHasFocus ? origHasFocus.call(this) : true;
    };
  } catch (err) {
    console.log("[Prodigy Solvex Shield] Visibility property patch notice:", err);
  }

  // -------------------------------------------------------------
  // 2. Intercept & Suppress Tab-Switching and Window Blur Events
  // -------------------------------------------------------------
  const guardedEvents = [
    "visibilitychange",
    "webkitvisibilitychange",
    "mozvisibilitychange",
    "msvisibilitychange",
    "blur",
    "focusout",
    "pagehide"
  ];

  guardedEvents.forEach(evtName => {
    window.addEventListener(evtName, (e) => {
      if (protectionState.antiTabSwitchEnabled) {
        e.stopImmediatePropagation && e.stopImmediatePropagation();
        e.stopPropagation && e.stopPropagation();
      }
    }, true);

    document.addEventListener(evtName, (e) => {
      if (protectionState.antiTabSwitchEnabled) {
        e.stopImmediatePropagation && e.stopImmediatePropagation();
        e.stopPropagation && e.stopPropagation();
      }
    }, true);
  });

  try {
    let internalOnBlur = null;
    Object.defineProperty(window, "onblur", {
      get: () => internalOnBlur,
      set: (fn) => {
        if (typeof fn === "function") {
          internalOnBlur = function (e) {
            if (protectionState.antiTabSwitchEnabled) return;
            return fn.apply(this, arguments);
          };
        } else {
          internalOnBlur = null;
        }
      },
      configurable: true
    });

    let internalOnVisChange = null;
    Object.defineProperty(document, "onvisibilitychange", {
      get: () => internalOnVisChange,
      set: (fn) => {
        if (typeof fn === "function") {
          internalOnVisChange = function (e) {
            if (protectionState.antiTabSwitchEnabled) return;
            return fn.apply(this, arguments);
          };
        } else {
          internalOnVisChange = null;
        }
      },
      configurable: true
    });
  } catch (_) {}

  // -------------------------------------------------------------
  // 3. Keep Website Active: Anti-Idle Heartbeat & Background Audio Keep-Alive
  // -------------------------------------------------------------
  let audioContext = null;

  function ensureBackgroundKeepAlive() {
    if (!protectionState.keepWebsiteActiveEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx && !audioContext) {
        audioContext = new AudioCtx();
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        gain.gain.value = 0.00001;
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start();
      }
      if (audioContext && audioContext.state === "suspended") {
        audioContext.resume().catch(() => {});
      }
    } catch (_) {}
  }

  let activePulseTimer = null;
  function startActivePulse() {
    if (activePulseTimer) clearInterval(activePulseTimer);
    activePulseTimer = setInterval(() => {
      if (!protectionState.keepWebsiteActiveEnabled) return;

      try {
        const evt = new MouseEvent("mousemove", {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: Math.floor(Math.random() * 20) + 5,
          clientY: Math.floor(Math.random() * 20) + 5
        });
        document.dispatchEvent(evt);
      } catch (_) {}

      ensureBackgroundKeepAlive();
    }, 20000);
  }

  // -------------------------------------------------------------
  // 4. Main-World React 17/18/19 Fiber & DOM Automation Bridge
  // -------------------------------------------------------------
  function getReactPropsFromNode(node) {
    if (!node || typeof node !== "object") return null;
    try {
      const keys = Object.keys(node);
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (k.startsWith("__reactProps$") || k.startsWith("__reactEventHandlers$")) {
          if (node[k] && typeof node[k] === "object") return node[k];
        }
      }
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$")) {
          let fiber = node[k];
          let depth = 0;
          while (fiber && depth < 10) {
            const p = fiber.memoizedProps || fiber.pendingProps;
            if (p && (typeof p.onClick === "function" || typeof p.onChange === "function" || typeof p.onSubmit === "function" || typeof p.onPointerDown === "function" || typeof p.onMouseDown === "function")) {
              return p;
            }
            fiber = fiber.return;
            depth++;
          }
        }
      }
    } catch (_) {}
    return null;
  }

  function findReactHandlerTarget(startEl, handlerNames) {
    if (!startEl) return null;
    const names = Array.isArray(handlerNames) ? handlerNames : [handlerNames];
    let curr = startEl;
    let depth = 0;
    while (curr && curr !== document.body && depth < 8) {
      const props = getReactPropsFromNode(curr);
      if (props) {
        for (const name of names) {
          if (typeof props[name] === "function") {
            return { element: curr, props, handlerName: name, fn: props[name] };
          }
        }
      }
      curr = curr.parentElement;
      depth++;
    }
    // Also check immediate interactive children if startEl is a container
    try {
      const children = startEl.querySelectorAll("button, input, a, [role='button'], [role='radio'], [role='option'], span");
      for (const ch of children) {
        const props = getReactPropsFromNode(ch);
        if (props) {
          for (const name of names) {
            if (typeof props[name] === "function") {
              return { element: ch, props, handlerName: name, fn: props[name] };
            }
          }
        }
      }
    } catch (_) {}
    return null;
  }

  function makeSyntheticEvent(type, targetEl, extra = {}) {
    let nativeEvt;
    try {
      if (type.startsWith("pointer") && typeof PointerEvent !== "undefined") {
        nativeEvt = new PointerEvent(type, { bubbles: true, cancelable: true, view: window, pointerId: 1, pointerType: "mouse", isPrimary: true, button: 0, buttons: 1 });
      } else if (type.startsWith("mouse") || type === "click") {
        nativeEvt = new MouseEvent(type, { bubbles: true, cancelable: true, view: window, button: 0, buttons: 1 });
      } else {
        nativeEvt = new Event(type, { bubbles: true, cancelable: true });
      }
    } catch (_) {
      nativeEvt = { type };
    }
    return {
      type,
      target: targetEl,
      currentTarget: targetEl,
      nativeEvent: nativeEvt,
      bubbles: true,
      cancelable: true,
      defaultPrevented: false,
      isTrusted: true,
      button: 0,
      buttons: 1,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      timeStamp: Date.now(),
      preventDefault() { this.defaultPrevented = true; },
      stopPropagation() {},
      stopImmediatePropagation() {},
      persist() {},
      isDefaultPrevented() { return this.defaultPrevented; },
      isPropagationStopped() { return false; },
      ...extra
    };
  }

  function dispatchSingleCleanClick(el) {
    if (!el) return;
    try {
      const rect = el.getBoundingClientRect();
      const clientX = rect.left + Math.max(2, Math.floor(rect.width / 2));
      const clientY = rect.top + Math.max(2, Math.floor(rect.height / 2));
      const mouseOpts = { bubbles: true, cancelable: true, view: window, button: 0, buttons: 1, clientX, clientY };
      const ptrOpts = { ...mouseOpts, pointerId: 1, pointerType: "mouse", isPrimary: true };

      if (typeof PointerEvent !== "undefined") {
        el.dispatchEvent(new PointerEvent("pointerover", ptrOpts));
        el.dispatchEvent(new PointerEvent("pointerenter", { ...ptrOpts, bubbles: false }));
      }
      el.dispatchEvent(new MouseEvent("mouseover", mouseOpts));
      el.dispatchEvent(new MouseEvent("mouseenter", { ...mouseOpts, bubbles: false }));

      if (typeof PointerEvent !== "undefined") {
        el.dispatchEvent(new PointerEvent("pointerdown", ptrOpts));
      }
      el.dispatchEvent(new MouseEvent("mousedown", mouseOpts));

      try {
        if (typeof el.focus === "function") el.focus({ preventScroll: true });
      } catch (_) {}

      if (typeof PointerEvent !== "undefined") {
        el.dispatchEvent(new PointerEvent("pointerup", { ...ptrOpts, buttons: 0 }));
      }
      el.dispatchEvent(new MouseEvent("mouseup", { ...mouseOpts, buttons: 0 }));

      // Fire EXACTLY ONE click event so toggleable options/chips are never double-toggled off!
      if (typeof el.click === "function") {
        el.click();
      } else {
        el.dispatchEvent(new MouseEvent("click", { ...mouseOpts, buttons: 0 }));
      }
    } catch (_) {
      try { el.click(); } catch (__) {}
    }
  }

  window.addEventListener("__PRODIGY_SOLVEX_BRIDGE__", (e) => {
    if (!e || !e.detail) return;
    const { bridgeId, action, value, selectedIndex, forceReact, forceEnable } = e.detail;
    if (!bridgeId) return;

    const el = document.querySelector(`[data-ps-bridge-id="${bridgeId}"]`);
    if (!el) return;

    try {
      if (action === "CLICK") {
        if (!forceReact) {
          dispatchSingleCleanClick(el);
        } else {
          // Direct React Fiber invocation fallback when native click did not update state
          const found = findReactHandlerTarget(el, ["onClick", "onChange", "onPointerDown", "onMouseDown"]);
          if (found && typeof found.fn === "function") {
            const synEvt = makeSyntheticEvent(
              found.handlerName === "onChange" ? "change" : "click",
              found.element
            );
            found.fn(synEvt);
          } else {
            dispatchSingleCleanClick(el);
          }
        }
      } else if (action === "SET_VALUE") {
        const strVal = value !== undefined && value !== null ? String(value) : "";
        try { el.focus({ preventScroll: true }); } catch (_) {}

        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
          const prevVal = el.value;
          const proto = el.tagName === "INPUT" ? window.HTMLInputElement.prototype : window.HTMLTextAreaElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
          if (setter) {
            setter.call(el, strVal);
          } else {
            el.value = strVal;
          }
          // Update React's Main-World _valueTracker so React recognizes the controlled input transition
          if (el._valueTracker && typeof el._valueTracker.setValue === "function") {
            el._valueTracker.setValue(prevVal === strVal ? "" : prevVal);
          }
        } else if (el.isContentEditable || el.getAttribute("role") === "textbox") {
          el.innerText = strVal;
        }

        try {
          el.dispatchEvent(new InputEvent("beforeinput", { bubbles: true, cancelable: true, inputType: "insertText", data: strVal }));
        } catch (_) {}
        el.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
        el.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));

        if (forceReact) {
          const found = findReactHandlerTarget(el, ["onChange", "onInput"]);
          if (found && typeof found.fn === "function") {
            found.fn(makeSyntheticEvent("change", found.element));
          }
        }

        el.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "Enter" }));
        el.dispatchEvent(new Event("blur", { bubbles: true }));
      } else if (action === "SELECT_OPTION") {
        const prevVal = el.value;
        if (typeof selectedIndex === "number" && selectedIndex >= 0) {
          el.selectedIndex = selectedIndex;
        }
        const newVal = value !== undefined ? String(value) : (el.options?.[el.selectedIndex]?.value ?? "");
        const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value")?.set;
        if (setter) {
          setter.call(el, newVal);
        } else {
          el.value = newVal;
        }
        if (el._valueTracker && typeof el._valueTracker.setValue === "function") {
          el._valueTracker.setValue(prevVal === newVal ? "" : prevVal);
        }
        el.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
        el.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));

        const found = findReactHandlerTarget(el, ["onChange", "onInput"]);
        if (found && typeof found.fn === "function") {
          found.fn(makeSyntheticEvent("change", found.element));
        }
      } else if (action === "SUBMIT") {
        if (forceEnable) {
          try {
            el.disabled = false;
            el.removeAttribute("disabled");
            if (el.getAttribute("aria-disabled") === "true") {
              el.setAttribute("aria-disabled", "false");
            }
            el.classList.remove("disabled", "is-disabled", "btn-disabled", "inactive");
          } catch (_) {}
        }

        if (!forceReact) {
          dispatchSingleCleanClick(el);
        } else {
          const foundClick = findReactHandlerTarget(el, ["onClick", "onPointerUp", "onMouseUp", "onPointerDown", "onMouseDown"]);
          if (foundClick && typeof foundClick.fn === "function") {
            foundClick.fn(makeSyntheticEvent("click", foundClick.element));
          }
          const form = el.closest("form");
          if (form) {
            const foundSubmit = findReactHandlerTarget(form, ["onSubmit"]);
            if (foundSubmit && typeof foundSubmit.fn === "function") {
              foundSubmit.fn(makeSyntheticEvent("submit", form));
            }
          }
          dispatchSingleCleanClick(el);
        }
      }
    } catch (_) {}
  });

  // -------------------------------------------------------------
  // 5. Communication Channel with Extension Content Script
  // -------------------------------------------------------------
  window.addEventListener("message", (e) => {
    if (!e || !e.data || e.data.source !== "STEP_SOLVER_CONTENT") return;

    if (e.data.type === "SYNC_PROTECTION_SETTINGS") {
      const s = e.data.settings;
      if (s) {
        if (typeof s.antiTabSwitchEnabled === "boolean") {
          protectionState.antiTabSwitchEnabled = s.antiTabSwitchEnabled;
        }
        if (typeof s.keepWebsiteActiveEnabled === "boolean") {
          protectionState.keepWebsiteActiveEnabled = s.keepWebsiteActiveEnabled;
          if (protectionState.keepWebsiteActiveEnabled) {
            ensureBackgroundKeepAlive();
          }
        }
        try {
          sessionStorage.setItem("__prodigy_solvex_protection_state__", JSON.stringify(protectionState));
        } catch (_) {}
      }
    }
  });

  // Start active heartbeat
  startActivePulse();

  // Listen for user gesture to enable AudioContext if suspended by browser
  window.addEventListener("click", ensureBackgroundKeepAlive, { once: true });
  window.addEventListener("keydown", ensureBackgroundKeepAlive, { once: true });

  console.log("%c[Prodigy Solvex Shield]%c Anti-Tab-Switching, Active Keep-Alive & React Fiber Bridge active.", "color:#10b981;font-weight:bold", "color:#fff");
})();
