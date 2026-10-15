// dashboard.js — Prodigy Solvex v4.0 Live Dashboard (CSP-safe external script)

// ===== JSONBin config (same as extension) =====
    const BIN_ID = "6ac914e8ac6210605a232126";
    const MASTER_KEY = "$2a$10$y8kwp82VOzzUoXp8KHEjS.maUVcodls6W4RbhfSYJjfuD26PQ2N/6";
    const API_BASE = "https://api.jsonbin.io/v3/b";

    let _lastData = null;

    // ===== Theme switching =====
    const savedTheme = localStorage.getItem("ps_dashboard_theme") || "pixel-gamer";
    setTheme(savedTheme);

    function setTheme(theme) {
      if (theme !== "pixel-gamer" && theme !== "kawaii-teddy") theme = "pixel-gamer";
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("ps_dashboard_theme", theme);
      document.querySelectorAll(".theme-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.theme === theme);
      });
    }

    document.querySelectorAll(".theme-btn").forEach(btn => {
      btn.addEventListener("click", () => setTheme(btn.dataset.theme));
    });

    // ===== Fetch data =====
    async function fetchData() {
      try {
        const res = await fetch(`${API_BASE}/${BIN_ID}/latest`, {
          method: "GET",
          headers: { "X-Master-Key": MASTER_KEY }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        const record = body && body.record ? body.record : null;
        if (!record) throw new Error("Empty record");
        _lastData = record;
        renderData(record);
      } catch (err) {
        const lbContainer = document.getElementById("leaderboard-container");
        const usersContainer = document.getElementById("users-container");
        lbContainer.innerHTML = `<div class="empty">❌ Could not load data: ${err.message}<br><br>Try refreshing the page.</div>`;
        usersContainer.innerHTML = `<div class="empty">❌ Could not load users.</div>`;
      }
    }

    function renderData(record) {
      const totals = record.totals || { users: 0, sessions: 0, solves: 0, activeMinutes: 0 };
      const users = record.users || {};

      // Update stat cards
      document.getElementById("stat-users").textContent = totals.users || 0;
      document.getElementById("stat-solves").textContent = totals.solves || 0;
      document.getElementById("stat-minutes").textContent = formatMinutes(totals.activeMinutes || 0);
      document.getElementById("stat-sessions").textContent = totals.sessions || 0;

      // Sort users by solves (then by activeMinutes)
      const sortedUsers = Object.values(users)
        .map(u => ({
          username: u.username || "Anonymous",
          theme: u.theme || "pixel-gamer",
          solves: u.solves || 0,
          activeMinutes: u.activeMinutes || 0,
          sessions: u.sessions || 0,
          firstSeen: u.firstSeen || 0,
          lastSeen: u.lastSeen || 0
        }))
        .sort((a, b) => (b.solves - a.solves) || (b.activeMinutes - a.activeMinutes));

      // Render leaderboard (top 10)
      const lbContainer = document.getElementById("leaderboard-container");
      if (sortedUsers.length === 0) {
        lbContainer.innerHTML = `<div class="empty">No solvers yet. Be the first to solve a question!</div>`;
      } else {
        let html = `<table><thead><tr>
          <th>Rank</th><th>Username</th><th>Theme</th><th>Solves</th><th>Active</th><th>Sessions</th><th>Last Seen</th>
        </tr></thead><tbody>`;
        sortedUsers.slice(0, 10).forEach((u, idx) => {
          const themeTag = u.theme === "kawaii-teddy"
            ? `<span class="theme-tag kawaii">🧸 Kawaii</span>`
            : `<span class="theme-tag pixel">🎮 Pixel</span>`;
          html += `<tr>
            <td><span class="rank-badge">${idx + 1}</span></td>
            <td class="username">${escapeHtml(u.username)}</td>
            <td>${themeTag}</td>
            <td class="stat-num">${u.solves}</td>
            <td class="stat-num">${formatMinutes(u.activeMinutes)}</td>
            <td>${u.sessions}</td>
            <td style="font-size:11px;color:var(--text-dim);">${formatTimeAgo(u.lastSeen)}</td>
          </tr>`;
        });
        html += `</tbody></table>`;
        lbContainer.innerHTML = html;
      }

      // Render all users table
      const usersContainer = document.getElementById("users-container");
      document.getElementById("user-count-sub").textContent = `${sortedUsers.length} users total`;
      if (sortedUsers.length === 0) {
        usersContainer.innerHTML = `<div class="empty">No users yet.</div>`;
      } else {
        let html = `<table><thead><tr>
          <th>#</th><th>Username</th><th>Theme</th><th>Solves</th><th>Active</th><th>Sessions</th><th>Member Since</th><th>Last Seen</th>
        </tr></thead><tbody>`;
        sortedUsers.forEach((u, idx) => {
          const themeTag = u.theme === "kawaii-teddy"
            ? `<span class="theme-tag kawaii">🧸</span>`
            : `<span class="theme-tag pixel">🎮</span>`;
          html += `<tr>
            <td style="color:var(--text-dim);">${idx + 1}</td>
            <td class="username">${escapeHtml(u.username)}</td>
            <td>${themeTag}</td>
            <td class="stat-num">${u.solves}</td>
            <td class="stat-num">${formatMinutes(u.activeMinutes)}</td>
            <td>${u.sessions}</td>
            <td style="font-size:11px;color:var(--text-dim);">${formatDate(u.firstSeen)}</td>
            <td style="font-size:11px;color:var(--text-dim);">${formatTimeAgo(u.lastSeen)}</td>
          </tr>`;
        });
        html += `</tbody></table>`;
        usersContainer.innerHTML = html;
      }

      // Update last-updated stamp
      const now = new Date();
      document.getElementById("last-updated").textContent =
        `Last updated: ${now.toLocaleString()}`;
    }

    // ===== Helpers =====
    function formatMinutes(m) {
      if (m < 60) return m + "m";
      const h = Math.floor(m / 60);
      const rem = m % 60;
      if (h < 24) return h + "h " + rem + "m";
      const d = Math.floor(h / 24);
      return d + "d " + (h % 24) + "h";
    }

    function formatTimeAgo(ts) {
      if (!ts) return "—";
      const diff = Date.now() - ts;
      const s = Math.floor(diff / 1000);
      if (s < 60) return s + "s ago";
      if (s < 3600) return Math.floor(s / 60) + "m ago";
      if (s < 86400) return Math.floor(s / 3600) + "h ago";
      return Math.floor(s / 86400) + "d ago";
    }

    function formatDate(ts) {
      if (!ts) return "—";
      const d = new Date(ts);
      return d.toLocaleDateString();
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
      })[c]);
    }

    // ===== Auto refresh =====
    let _refreshTimer = null;
    function setupAutoRefresh() {
      const cb = document.getElementById("auto-refresh");
      function apply() {
        if (_refreshTimer) { clearInterval(_refreshTimer); _refreshTimer = null; }
        if (cb.checked) {
          _refreshTimer = setInterval(fetchData, 30000);
        }
      }
      cb.addEventListener("change", apply);
      apply();
    }

    document.getElementById("btn-refresh").addEventListener("click", fetchData);

    // ===== Initial load =====
    fetchData();
    setupAutoRefresh();