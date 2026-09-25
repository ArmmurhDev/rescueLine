/**
 * RescueLine - Report Details Script (Real-time DB Connection)
 * Handles incident monitoring, live timers, database status mutations, timeline notes, and display area rendering.
 */

(function() {
  'use strict';

  function getIconForType(type) {
    const map = {
      'Fire': 'flame',
      'Accident': 'car',
      'Medical': 'heart-pulse',
      'Flood': 'waves',
      'Security': 'shield-alert'
    };
    if (!type) return 'alert-circle';
    for (const key in map) {
      if (type.toLowerCase().includes(key.toLowerCase())) return map[key];
    }
    return 'alert-circle';
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

  function formatTimer(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return String(hrs).padStart(2, '0') + ':' +
           String(mins).padStart(2, '0') + ':' +
           String(secs).padStart(2, '0');
  }

  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function formatDateTime(d) {
    if (!d) return '—';
    const date = new Date(d);
    return isNaN(date.getTime()) ? d : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function formatTimeOnly(d) {
    if (!d) return '—';
    const date = new Date(d);
    return isNaN(date.getTime()) ? d : date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  /* =========================================================
     HTML TEMPLATE GENERATOR FROM DB RECORD
     ========================================================= */
  window.getReportDetailsHTML = function(reportData, timelineData) {
    const r = reportData || {};
    const timeline = timelineData || [];

    const dbId = r.id || 1;
    const reportCode = r.report_code || r.reportCode || ('RL-' + dbId);
    const categoryName = r.category_name || r.type || 'Emergency';
    const typeClass = getTypeClass(categoryName);
    const typeIcon = getIconForType(categoryName);
    const priority = (r.priority || 'medium').toLowerCase();
    const status = (r.status || 'pending').toLowerCase();

    // Calculate Step
    let currentStep = 0;
    if (status === 'assigned') {
      currentStep = 1;
    } else if (status === 'responding' || status === 'in-progress' || status === 'on-scene') {
      currentStep = 2;
    } else if (status === 'resolved' || status === 'closed') {
      currentStep = 3;
    }

    // Elapsed Time calculation
    let elapsed = 0;
    if (r.created_at) {
      const start = new Date(r.created_at).getTime();
      const end = r.resolved_at ? new Date(r.resolved_at).getTime() : Date.now();
      elapsed = Math.max(0, Math.floor((end - start) / 1000));
    }
    const isUrgent = (elapsed > 1800 || priority === 'critical');

    const phone = r.reporter_phone || r.reporter || '08000000000';
    const displayPhone = phone.length > 7 ? phone.substring(0, 4) + '***' + phone.substring(phone.length - 4) : phone;
    const locationStr = r.address_landmark || r.landmark || 'Incident Location';
    const regionStr = [r.lga, r.state].filter(Boolean).join(', ') || 'Nigeria';

    const respName = r.respondent_name || r.assignedRespondent || 'Responder Team';
    const respRole = r.respondent_unit || 'Emergency Unit';
    const respInitials = respName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'RT';

    // Step definitions
    const steps = [
      { name: 'Accepted', icon: 'check', desc: 'Report logged and acknowledged', time: r.created_at ? formatTimeOnly(r.created_at) : '—' },
      { name: 'Dispatched', icon: 'truck', desc: 'Emergency response unit assigned', time: r.assigned_at ? formatTimeOnly(r.assigned_at) : (currentStep >= 1 ? 'Dispatched' : 'Pending') },
      { name: 'On Scene', icon: 'map-pin', desc: 'Response team arrived at location', time: r.responding_at ? formatTimeOnly(r.responding_at) : (currentStep >= 2 ? 'In Progress' : 'Pending') },
      { name: 'Resolved', icon: 'flag', desc: 'Emergency situation contained and resolved', time: r.resolved_at ? formatTimeOnly(r.resolved_at) : (currentStep >= 3 ? 'Completed' : 'Pending') }
    ];

    const stepsHtml = steps.map((s, idx) => {
      let stateClass = 'pending';
      let iconName = s.icon;
      if (idx < currentStep) {
        stateClass = 'completed';
        iconName = 'check';
      } else if (idx === currentStep) {
        stateClass = 'current';
      }

      return `
        <div class="rd-step ${stateClass}">
          <div class="rd-step-indicator">
            <i data-lucide="${iconName}"></i>
          </div>
          <div class="rd-step-content">
            <div class="rd-step-top">
              <span class="rd-step-name">${s.name}</span>
              <span class="rd-step-time">${s.time}</span>
            </div>
            <p class="rd-step-desc">${s.desc}</p>
          </div>
        </div>
      `;
    }).join('');

    // Timeline / Notes list
    let notesHtml = '';
    if (timeline && timeline.length > 0) {
      notesHtml = timeline.map(t => `
        <div class="rd-note-item">
          <p><strong>${escapeHTML(t.action)}:</strong> ${escapeHTML(t.note || 'No description.')}</p>
          <div class="rd-note-meta">- ${escapeHTML(t.user_name || 'System')}, ${formatDateTime(t.created_at)}</div>
        </div>
      `).join('');
    } else {
      notesHtml = `
        <div class="rd-note-item">
          <p>Report initiated and waiting for responder actions.</p>
          <div class="rd-note-meta">- System, Just now</div>
        </div>
      `;
    }

    return `
      <div class="rd-container" id="reportDetailsContainer" data-report-id="${dbId}" data-report-code="${escapeHTML(reportCode)}">

        <!-- ACTION BAR -->
        <div class="rd-action-bar">
          <button type="button" class="rd-back-btn" id="rdBackBtn">
            <i data-lucide="arrow-left"></i>
            <span>Back to Responses</span>
          </button>

          <div class="rd-action-buttons">
            <button type="button" id="btnDispatch" class="rd-btn rd-btn-dispatch" ${currentStep >= 1 ? 'disabled' : ''}>
              <i data-lucide="truck"></i>
              <span>Dispatch</span>
            </button>
            <button type="button" id="btnOnScene" class="rd-btn rd-btn-onscene" ${currentStep >= 2 ? 'disabled' : ''}>
              <i data-lucide="map-pin"></i>
              <span>On Scene</span>
            </button>
            <button type="button" id="btnResolve" class="rd-btn rd-btn-resolve" ${currentStep >= 3 ? 'disabled' : ''}>
              <i data-lucide="check-circle-2"></i>
              <span>Resolve</span>
            </button>
            <button type="button" id="btnEscalate" class="rd-btn rd-btn-escalate" ${currentStep >= 3 ? 'disabled' : ''}>
              <i data-lucide="alert-triangle"></i>
              <span>Escalate</span>
            </button>
          </div>
        </div>

        <!-- INCIDENT HEADER BANNER -->
        <div class="rd-header-card">
          <div class="rd-header-main">
            <div class="rd-id-row">
              <span class="rd-id">${escapeHTML(reportCode)}</span>
              <span class="rd-priority-badge ${escapeHTML(priority)}">${escapeHTML(capitalize(priority))}</span>
            </div>
            <div class="rd-type-badge ${escapeHTML(typeClass)}">
              <i data-lucide="${escapeHTML(typeIcon)}"></i>
              <span>${escapeHTML(categoryName)}</span>
            </div>
          </div>

          <div class="rd-timer-box">
            <div class="rd-timer-label">${currentStep >= 3 ? 'Total Response Duration' : 'Elapsed Time'}</div>
            <div id="rdTimer" class="rd-timer-val ${isUrgent ? 'urgent' : ''}" data-seconds="${elapsed}" data-status="${escapeHTML(status)}">
              ${formatTimer(elapsed)}
            </div>
          </div>
        </div>

        <!-- TWO-COLUMN CONTENT GRID -->
        <div class="rd-grid">

          <!-- Left Column (Progress & Location) -->
          <div class="rd-col">

            <!-- Response Progress Card -->
            <div class="rd-card">
              <div class="rd-card-header">
                <div class="rd-card-title">
                  <i data-lucide="activity"></i>
                  <span>Response Progress</span>
                </div>
              </div>
              <div class="rd-timeline">
                ${stepsHtml}
              </div>
            </div>

            <!-- Incident Location Card -->
            <div class="rd-card">
              <div class="rd-card-header">
                <div class="rd-card-title">
                  <i data-lucide="map-pin"></i>
                  <span>Incident Location</span>
                </div>
              </div>
              <div class="rd-location-body">
                <div class="rd-loc-item">
                  <div class="rd-loc-label">Address / Landmark</div>
                  <div class="rd-loc-val">${escapeHTML(locationStr)}</div>
                </div>
                <div class="rd-loc-item">
                  <div class="rd-loc-label">State & LGA</div>
                  <div class="rd-loc-val" style="font-weight: 500; font-size: 13px; color: var(--text-soft);">${escapeHTML(regionStr)}</div>
                </div>
                <button type="button" class="rd-btn-maps" onclick="window.open('https://maps.google.com/?q=${encodeURIComponent(locationStr + ', ' + regionStr)}', '_blank')">
                  <i data-lucide="navigation"></i>
                  <span>Open in Maps</span>
                </button>
              </div>
            </div>

          </div>

          <!-- Right Column (Reporter, Details, Notes) -->
          <div class="rd-col">

            <!-- Reporter Contact Card -->
            <div class="rd-card">
              <div class="rd-card-header">
                <div class="rd-card-title">
                  <i data-lucide="phone"></i>
                  <span>Reporter Contact</span>
                </div>
              </div>
              <div class="rd-contact-box">
                <div class="rd-phone-row">
                  <a href="tel:${escapeHTML(phone)}" class="rd-phone-num">${escapeHTML(displayPhone)}</a>
                  <button type="button" class="rd-copy-btn" id="rdCopyPhone" data-phone="${escapeHTML(phone)}" title="Copy phone number">
                    <i data-lucide="copy"></i>
                  </button>
                </div>
                <div class="rd-contact-actions">
                  <a href="tel:${escapeHTML(phone)}" class="rd-contact-btn call">
                    <i data-lucide="phone-call"></i>
                    <span>Call</span>
                  </a>
                  <a href="sms:${escapeHTML(phone)}" class="rd-contact-btn sms">
                    <i data-lucide="message-square"></i>
                    <span>SMS</span>
                  </a>
                </div>
              </div>
            </div>

            <!-- Incident Details Card -->
            <div class="rd-card">
              <div class="rd-card-header">
                <div class="rd-card-title">
                  <i data-lucide="info"></i>
                  <span>Incident Details</span>
                </div>
              </div>
              <div class="rd-detail-list">
                <div class="rd-detail-item">
                  <span class="rd-detail-label">Reported At</span>
                  <span class="rd-detail-val">${formatDateTime(r.created_at)}</span>
                </div>
                <div class="rd-detail-item">
                  <span class="rd-detail-label">Reported Via</span>
                  <span class="rd-detail-val">${escapeHTML((r.source || 'ussd').toUpperCase())} Gateway</span>
                </div>
                <div class="rd-detail-item">
                  <span class="rd-detail-label">Assigned Responder</span>
                  <div class="rd-assigned-chip">
                    <div class="rd-assigned-avatar">${escapeHTML(respInitials)}</div>
                    <div class="rd-assigned-info">
                      <span class="rd-assigned-name">${escapeHTML(respName)}</span>
                      <span class="rd-assigned-role">${escapeHTML(respRole)}</span>
                    </div>
                  </div>
                </div>
                <div class="rd-detail-item" style="flex-direction: column; align-items: flex-start; gap: 4px;">
                  <span class="rd-detail-label">Description / Situation</span>
                  <p style="font-size: 13px; color: var(--text-main); margin: 0; line-height: 1.5;">${escapeHTML(r.description || 'No additional details provided.')}</p>
                </div>
              </div>
            </div>

            <!-- Incident Notes Card -->
            <div class="rd-card">
              <div class="rd-card-header">
                <div class="rd-card-title">
                  <i data-lucide="file-text"></i>
                  <span>Incident Timeline & Notes</span>
                </div>
              </div>
              <div class="rd-notes-list" id="rdNotesList">
                ${notesHtml}
              </div>
              <button type="button" class="rd-add-note-btn" id="rdAddNoteBtn">
                <i data-lucide="plus"></i>
                <span>Add Note</span>
              </button>
            </div>

          </div>

        </div>

        <!-- Toast Notification Popup -->
        <div class="rd-toast" id="rdToast">
          <i data-lucide="check-circle-2"></i>
          <span id="rdToastMsg">Action completed successfully</span>
        </div>

      </div>
    `;
  };

  /* =========================================================
     INTERACTION LOGIC & DATABASE MUTATIONS
     ========================================================= */
  function showToast(msg) {
    const toast = document.getElementById('rdToast');
    const toastMsg = document.getElementById('rdToastMsg');
    if (!toast) return;

    if (toastMsg) toastMsg.textContent = msg;
    toast.classList.add('active');

    if (window._rdToastTimeout) clearTimeout(window._rdToastTimeout);
    window._rdToastTimeout = setTimeout(() => {
      toast.classList.remove('active');
    }, 3000);
  }

  function initReportDetails(reportDbId) {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }

    const container = document.getElementById('reportDetailsContainer');
    const numericId = reportDbId || (container ? container.getAttribute('data-report-id') : 1);

    // Live Timer
    if (window._rdTimerInterval) {
      clearInterval(window._rdTimerInterval);
    }
    const timerEl = document.getElementById('rdTimer');
    if (timerEl) {
      const currentStatus = (timerEl.getAttribute('data-status') || '').toLowerCase();
      let secs = parseInt(timerEl.getAttribute('data-seconds'), 10) || 0;

      // Only increment timer if not resolved
      if (currentStatus !== 'resolved' && currentStatus !== 'closed') {
        window._rdTimerInterval = setInterval(() => {
          secs += 1;
          timerEl.setAttribute('data-seconds', secs);
          timerEl.textContent = formatTimer(secs);
          if (secs > 1800 && !timerEl.classList.contains('urgent')) {
            timerEl.classList.add('urgent');
          }
        }, 1000);
      }
    }

    // Back Button
    const backBtn = document.getElementById('rdBackBtn');
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        if (mode === 'history') {
          window.location.href = 'response-history.php';
        } else if (document.referrer && document.referrer.includes('incorming-report')) {
          window.location.href = 'incorming-report.php';
        } else if (document.referrer && document.referrer.includes('response-history')) {
          window.location.href = 'response-history.php';
        } else if (document.referrer && document.referrer.includes('dashboard')) {
          window.location.href = 'dashboard.php';
        } else {
          window.location.href = 'active-responses.php';
        }
      });
    }

    // Action Buttons (dispatch, on-scene, resolve, escalate)
    const btnDispatch = document.getElementById('btnDispatch');
    const btnOnScene = document.getElementById('btnOnScene');
    const btnResolve = document.getElementById('btnResolve');
    const btnEscalate = document.getElementById('btnEscalate');

    if (btnDispatch) {
      btnDispatch.addEventListener('click', async () => {
        const formData = new FormData();
        formData.append('action', 'update_status');
        formData.append('report_id', numericId);
        formData.append('status', 'responding');
        formData.append('notes', 'Dispatch team notified and actively en route to scene.');

        try {
          const res = await fetch('../api/reports.php', { method: 'POST', body: formData });
          const json = await res.json();
          if (json.status === 'success') {
            showToast('Dispatch team notified and in transit');
            btnDispatch.disabled = true;
            if (btnOnScene) btnOnScene.disabled = false;
            setTimeout(() => window.location.reload(), 1000);
          } else {
            showToast(json.message || 'Error updating status');
          }
        } catch (err) {
          showToast('Network error updating dispatch.');
        }
      });
    }

    if (btnOnScene) {
      btnOnScene.addEventListener('click', async () => {
        const formData = new FormData();
        formData.append('action', 'add_note');
        formData.append('report_id', numericId);
        formData.append('action_name', 'Arrived On Scene');
        formData.append('note', 'Responders arrived at the emergency scene and started intervention.');

        try {
          const res = await fetch('../api/reports.php', { method: 'POST', body: formData });
          const json = await res.json();
          if (json.status === 'success') {
            showToast('Status updated: Responders arrived On Scene');
            btnOnScene.disabled = true;
            setTimeout(() => window.location.reload(), 1000);
          } else {
            showToast(json.message || 'Error updating status');
          }
        } catch (err) {
          showToast('Network error.');
        }
      });
    }

    if (btnResolve) {
      btnResolve.addEventListener('click', async () => {
        const note = prompt('Enter resolution summary for this incident:');
        if (note === null) return;

        const formData = new FormData();
        formData.append('action', 'update_status');
        formData.append('report_id', numericId);
        formData.append('status', 'resolved');
        formData.append('notes', note || 'Incident successfully contained and resolved on scene.');

        try {
          const res = await fetch('../api/reports.php', { method: 'POST', body: formData });
          const json = await res.json();
          if (json.status === 'success') {
            showToast('Incident marked as Resolved');
            btnResolve.disabled = true;
            if (btnEscalate) btnEscalate.disabled = true;
            setTimeout(() => window.location.reload(), 1000);
          } else {
            showToast(json.message || 'Error resolving incident');
          }
        } catch (err) {
          showToast('Network error.');
        }
      });
    }

    if (btnEscalate) {
      btnEscalate.addEventListener('click', async () => {
        const reason = prompt('Enter reason for escalating this emergency:');
        if (reason === null) return;

        const formData = new FormData();
        formData.append('action', 'add_note');
        formData.append('report_id', numericId);
        formData.append('action_name', 'Emergency Escalated');
        formData.append('note', 'Escalated to Regional Command Center: ' + (reason || 'Immediate reinforcements requested'));

        try {
          const res = await fetch('../api/reports.php', { method: 'POST', body: formData });
          const json = await res.json();
          if (json.status === 'success') {
            showToast('Incident escalated to Regional Command');
            setTimeout(() => window.location.reload(), 1000);
          } else {
            showToast(json.message || 'Error escalating incident');
          }
        } catch (err) {
          showToast('Network error.');
        }
      });
    }

    // Copy Phone
    const copyBtn = document.getElementById('rdCopyPhone');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const phone = copyBtn.getAttribute('data-phone') || '08031234219';
        navigator.clipboard.writeText(phone).then(() => {
          showToast('Phone number copied to clipboard');
        }).catch(() => {
          showToast('Phone: ' + phone);
        });
      });
    }

    // Add Note
    const addNoteBtn = document.getElementById('rdAddNoteBtn');
    if (addNoteBtn) {
      addNoteBtn.addEventListener('click', async () => {
        const noteText = prompt('Enter a new note for this incident:');
        if (!noteText || !noteText.trim()) return;

        const formData = new FormData();
        formData.append('action', 'add_note');
        formData.append('report_id', numericId);
        formData.append('action_name', 'Field Note');
        formData.append('note', noteText.trim());

        try {
          const res = await fetch('../api/reports.php', { method: 'POST', body: formData });
          const json = await res.json();
          if (json.status === 'success') {
            showToast('Incident note recorded');
            const notesList = document.getElementById('rdNotesList');
            if (notesList) {
              const noteDiv = document.createElement('div');
              noteDiv.className = 'rd-note-item';
              noteDiv.innerHTML = `
                <p><strong>Field Note:</strong> ${escapeHTML(noteText.trim())}</p>
                <div class="rd-note-meta">- You, Just now</div>
              `;
              notesList.appendChild(noteDiv);
            }
          } else {
            showToast(json.message || 'Error recording note');
          }
        } catch (err) {
          showToast('Network error.');
        }
      });
    }
  }

  /* =========================================================
     GLOBAL VIEW DISPLAY IN CONTENT AREA (AJAX/SPA Support)
     ========================================================= */
  window.displayReportDetails = async function(reportId) {
    const target = document.querySelector('.content');
    if (!target) {
      window.location.href = `report-details.php?id=${encodeURIComponent(reportId || '')}`;
      return;
    }

    try {
      const res = await fetch(`../api/reports.php?action=get&id=${encodeURIComponent(reportId || '')}`);
      const json = await res.json();
      if (json.status === 'success' && json.data && json.data.report) {
        const report = json.data.report;
        const timeline = json.data.timeline || [];

        target.innerHTML = window.getReportDetailsHTML(report, timeline);

        // Update Topnav Title
        const pageTitleH2 = document.querySelector('.page-title h2');
        if (pageTitleH2) pageTitleH2.textContent = `Incident Details: ${report.report_code || ('RL-' + report.id)}`;

        initReportDetails(report.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    } catch (e) {
      console.warn('Fallback to full page navigation:', e);
    }

    window.location.href = `report-details.php?id=${encodeURIComponent(reportId || '')}`;
  };

  // Export handlers
  window.initReportDetails = initReportDetails;
  window.viewReport = function(id) {
    window.displayReportDetails(id);
  };
})();
