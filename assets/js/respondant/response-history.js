/**
 * RescueLine - Response History JavaScript (Real-time DB Connection)
 * Provides archive data for resolved emergency reports, real-time filtering, search, and dynamic view navigation.
 */

(function() {
  'use strict';

  function formatDateTime(d) {
    if (!d) return '—';
    const date = new Date(d);
    return isNaN(date.getTime()) ? d : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function formatDuration(start, end, minutesCol) {
    if (minutesCol && parseInt(minutesCol, 10) > 0) {
      const m = parseInt(minutesCol, 10);
      if (m >= 60) {
        return Math.floor(m / 60) + 'h ' + (m % 60) + 'm';
      }
      return m + ' mins';
    }
    if (!start || !end) return '—';
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (isNaN(s) || isNaN(e) || e <= s) return '—';
    const diffMins = Math.max(1, Math.round((e - s) / 60000));
    if (diffMins >= 60) {
      return Math.floor(diffMins / 60) + 'h ' + (diffMins % 60) + 'm';
    }
    return diffMins + ' mins';
  }

  function maskPhoneNumber(phone) {
    if (!phone) return '—';
    const str = String(phone).trim();
    if (str.length <= 5) return '*****';
    if (str.startsWith('+')) {
      const prefix = str.slice(0, 4);
      const suffix = str.slice(-4);
      return `${prefix}*****${suffix}`;
    } else if (str.length >= 10) {
      const prefix = str.slice(0, 3);
      const suffix = str.slice(-4);
      return `${prefix}*****${suffix}`;
    } else {
      const prefix = str.slice(0, 2);
      const suffix = str.slice(-2);
      return `${prefix}*****${suffix}`;
    }
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getTypeClass(type) {
    if (!type) return 'other';
    const t = type.toLowerCase();
    if (t.includes('fire')) return 'fire';
    if (t.includes('accident')) return 'accident';
    if (t.includes('medical')) return 'medical';
    if (t.includes('flood')) return 'flood';
    if (t.includes('security')) return 'security';
    return 'other';
  }

  function refreshIcons() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }

  // Template Generator for dynamic loading
  window.getResponseHistoryHTML = function() {
    return `
      <div class="page-container" id="responseHistoryContainer">
        <div class="page-header">
          <div class="page-header-left">
            <h1>
              <i data-lucide="history" style="width: 24px; height: 24px; color: var(--green);"></i>
              Response History & Archives
            </h1>
            <p>Archive of all resolved emergency responses</p>
          </div>
          <div class="page-header-actions">
            <button type="button" class="btn btn-secondary" onclick="window.location.href='../api/reports.php?action=export'">
              <i data-lucide="download"></i>
              Export Archive
            </button>
            <button type="button" class="btn btn-primary" onclick="initResponseHistory()">
              <i data-lucide="refresh-cw"></i>
              Refresh
            </button>
          </div>
        </div>

        <!-- STATS ROW -->
        <div class="stats-row">
          <div class="stat-mini green">
            <div class="stat-mini-icon green"><i data-lucide="check-circle-2"></i></div>
            <div class="stat-mini-info">
              <div class="value" id="historyStatTotal">0</div>
              <div class="label">Total Resolved</div>
            </div>
          </div>
          <div class="stat-mini blue">
            <div class="stat-mini-icon blue"><i data-lucide="clock"></i></div>
            <div class="stat-mini-info">
              <div class="value" id="historyStatAvg">18m</div>
              <div class="label">Avg Resolution Time</div>
            </div>
          </div>
          <div class="stat-mini orange">
            <div class="stat-mini-icon orange"><i data-lucide="trending-up"></i></div>
            <div class="stat-mini-info">
              <div class="value">100%</div>
              <div class="label">Resolution Rate</div>
            </div>
          </div>
          <div class="stat-mini purple">
            <div class="stat-mini-icon purple"><i data-lucide="users"></i></div>
            <div class="stat-mini-info">
              <div class="value" id="historyStatResp">1</div>
              <div class="label">Active Units</div>
            </div>
          </div>
        </div>

        <div class="filter-card">
          <div class="filter-bar">
            <div class="search-box">
              <i data-lucide="search"></i>
              <input type="text" placeholder="Search resolved reports by ID, location, or type..." id="historySearch" autocomplete="off" />
            </div>
          </div>
        </div>

        <div class="history-card">
          <div class="table-wrap">
            <table class="history-table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Receive</th>
                  <th>Resolved</th>
                  <th>Duration</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="historyBody"></tbody>
            </table>
          </div>
          <div class="history-cards" id="historyCards"></div>
        </div>
      </div>
    `;
  };

  let resolvedList = [];

  async function initResponseHistory() {
    const historyBody = document.getElementById('historyBody');
    const historyCards = document.getElementById('historyCards');
    if (!historyBody && !historyCards) return;

    try {
      // ONLY load reports with status=resolved
      const res = await fetch('../api/reports.php?action=list&status=resolved');
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        resolvedList = json.data.reports || [];
        renderHistoryTable(resolvedList);
        updateHistoryStats(resolvedList, json.data.respondents || []);
      }
    } catch (e) {
      console.error('Error fetching response history:', e);
    }

    refreshIcons();
  }

  function updateHistoryStats(list, respondents) {
    const totalEl = document.getElementById('historyStatTotal');
    const avgEl = document.getElementById('historyStatAvg');
    const respEl = document.getElementById('historyStatResp');

    if (totalEl) totalEl.textContent = list.length;
    if (respEl) respEl.textContent = respondents.length || 1;

    if (avgEl && list.length > 0) {
      let totalMins = 0;
      let count = 0;
      list.forEach(r => {
        if (r.response_time_minutes) {
          totalMins += parseInt(r.response_time_minutes, 10);
          count++;
        } else if (r.receivedAt && r.resolved_at) {
          const s = new Date(r.receivedAt).getTime();
          const e = new Date(r.resolved_at).getTime();
          if (e > s) {
            totalMins += Math.round((e - s) / 60000);
            count++;
          }
        }
      });
      if (count > 0) {
        const avg = Math.round(totalMins / count);
        avgEl.textContent = avg >= 60 ? Math.floor(avg / 60) + 'h ' + (avg % 60) + 'm' : avg + 'm';
      }
    }
  }

  function renderHistoryTable(list) {
    const historyBody = document.getElementById('historyBody');
    const historyCards = document.getElementById('historyCards');

    if (historyBody) {
      if (!list || list.length === 0) {
        historyBody.innerHTML = `
          <tr>
            <td colspan="7">
              <div class="empty-state" style="padding: 36px 20px; text-align: center; color: var(--text-muted);">
                <i data-lucide="check-circle-2" style="width: 40px; height: 40px; margin-bottom: 10px; color: var(--green); display: block; margin: 0 auto;"></i>
                <h3 style="font-size: 16px; margin: 8px 0; color: var(--text-main);">No Resolved Reports Found</h3>
                <p style="font-size: 13px;">Archived emergency reports that have reached resolution will appear here.</p>
              </div>
            </td>
          </tr>
        `;
      } else {
        historyBody.innerHTML = list.map(r => `
          <tr>
            <td><span class="report-id">${escapeHTML(r.reportCode || ('RL-' + r.id))}</span></td>
            <td>
              <span class="emergency-type ${escapeHTML(getTypeClass(r.type))}">
                ${escapeHTML(r.type || 'Emergency')}
              </span>
            </td>
            <td>
              <div class="location-text">
                <span class="primary">${escapeHTML(r.landmark || r.lga)}</span>
                <span class="secondary">${escapeHTML(r.state)}</span>
              </div>
            </td>
            <td>
              <span class="phone-masked" style="font-family: 'SF Mono', Monaco, monospace; font-size: 12px; font-weight: 500; color: var(--text-soft);">
                ${escapeHTML(maskPhoneNumber(r.reporter || r.reporter_phone))}
              </span>
            </td>
            <td><span class="time-text" style="color: var(--green); font-weight: 500;">${formatDateTime(r.resolved_at || r.receivedAt)}</span></td>
            <td><span class="duration-badge" style="font-size: 12px; font-weight: 600; color: var(--text-main);">${formatDuration(r.receivedAt, r.resolved_at, r.response_time_minutes)}</span></td>
            <td>
              <a href="report-details.php?id=${r.id}&mode=history" class="btn btn-secondary btn-sm">
                <i data-lucide="eye"></i> View
              </a>
            </td>
          </tr>
        `).join('');
      }
    }

    if (historyCards) {
      if (!list || list.length === 0) {
        historyCards.innerHTML = '<p style="padding: 24px; color: var(--text-muted); text-align: center;">No resolved reports.</p>';
      } else {
        historyCards.innerHTML = list.map(r => `
          <div class="report-card-item">
            <div class="report-card-top">
              <span class="report-card-id">${escapeHTML(r.reportCode || ('RL-' + r.id))}</span>
              <span class="status-badge resolved">Resolved</span>
            </div>
            <div class="report-card-body">
              <div class="report-card-field">
                <div class="label">Type</div>
                <div class="value">${escapeHTML(r.type || 'Emergency')}</div>
              </div>
              <div class="report-card-field">
                <div class="label">Location</div>
                <div class="value">${escapeHTML(r.landmark || r.lga)}, ${escapeHTML(r.state)}</div>
              </div>
              <div class="report-card-field">
                <div class="label">Receive</div>
                <div class="value" style="font-family: 'SF Mono', Monaco, monospace;">${escapeHTML(maskPhoneNumber(r.reporter || r.reporter_phone))}</div>
              </div>
              <div class="report-card-field">
                <div class="label">Resolved At</div>
                <div class="value">${formatDateTime(r.resolved_at || r.receivedAt)}</div>
              </div>
              <div class="report-card-field">
                <div class="label">Duration</div>
                <div class="value">${formatDuration(r.receivedAt, r.resolved_at, r.response_time_minutes)}</div>
              </div>
            </div>
            <div class="report-card-actions">
              <a href="report-details.php?id=${r.id}&mode=history" class="btn btn-secondary" style="width: 100%; justify-content: center;">
                <i data-lucide="eye"></i> View Report Details
              </a>
            </div>
          </div>
        `).join('');
      }
    }

    refreshIcons();
  }

  function filterHistory() {
    const searchInput = document.getElementById('historySearch') || document.getElementById('searchInput');
    const q = (searchInput ? searchInput.value : '').toLowerCase().trim();

    const filtered = resolvedList.filter(r => {
      if (!q) return true;
      return (r.reportCode && r.reportCode.toLowerCase().includes(q)) ||
             (r.type && r.type.toLowerCase().includes(q)) ||
             (r.landmark && r.landmark.toLowerCase().includes(q)) ||
             (r.state && r.state.toLowerCase().includes(q)) ||
             (r.lga && r.lga.toLowerCase().includes(q));
    });

    renderHistoryTable(filtered);
  }

  window.initResponseHistory = initResponseHistory;

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('historyBody') || document.getElementById('responseHistoryContainer')) {
      initResponseHistory();
    }
    const searchInput = document.getElementById('historySearch') || document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', filterHistory);
    }
  });
})();
