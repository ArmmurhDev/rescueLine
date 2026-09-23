/**
 * RescueLine - Report Details Script
 * Handles incident monitoring, live timers, step actions, and display area rendering.
 */

(function() {
  /* =========================================================
     MOCK REPORTS REPOSITORY
     ========================================================= */
  const INCIDENT_DATABASE = {
    'RL-0025': {
      id: 'RL-0025',
      type: 'Fire',
      location: 'Kaduna South Market',
      state: 'Kaduna South LGA, Kaduna State',
      phone: '08031234219',
      displayPhone: '0803***4219',
      reportedAt: 'Today, 11:42 AM',
      lastUpdate: '2 minutes ago',
      reportedVia: 'USSD *123#',
      priority: 'critical',
      status: 'on-scene',
      elapsed: 863, // seconds (14:23)
      currentStep: 2, // 0: Accepted, 1: Dispatched, 2: On Scene, 3: Resolved
      assignedTo: {
        name: 'Musa Ibrahim',
        role: 'Fire Unit Lead',
        initials: 'MI'
      },
      notes: [
        { isCritical: true, text: 'Market area densely populated. Immediate evacuation required.' },
        { text: 'Fire started ~10 mins before report. Multiple stalls involved. No casualties reported yet.', author: 'Musa Ibrahim', time: '2 min ago' }
      ]
    },
    'RL-0024': {
      id: 'RL-0024',
      type: 'Accident',
      location: 'Zaria City, Katsina Road',
      state: 'Zaria LGA, Kaduna State',
      phone: '08123456789',
      displayPhone: '0812***4455',
      reportedAt: 'Today, 11:34 AM',
      lastUpdate: '5 minutes ago',
      reportedVia: 'USSD *123#',
      priority: 'critical',
      status: 'in-progress',
      elapsed: 1520,
      currentStep: 2,
      assignedTo: {
        name: 'Amina Bello',
        role: 'Medical Team Lead',
        initials: 'AB'
      },
      notes: [
        { isCritical: true, text: 'Multiple vehicle collision involving 2 mini-buses.' },
        { text: 'Medical unit on scene administering first aid to injured passengers.', author: 'Amina Bello', time: '5 min ago' }
      ]
    },
    'RL-0023': {
      id: 'RL-0023',
      type: 'Medical',
      location: 'Chikun LGA, Ganawuri',
      state: 'Chikun LGA, Kaduna State',
      phone: '07055566778',
      displayPhone: '0705***8822',
      reportedAt: 'Today, 11:27 AM',
      lastUpdate: '8 minutes ago',
      reportedVia: 'USSD *123#',
      priority: 'high',
      status: 'dispatched',
      elapsed: 2340,
      currentStep: 1,
      assignedTo: {
        name: 'Yusuf Danladi',
        role: 'Paramedic',
        initials: 'YD'
      },
      notes: [
        { text: 'Patient suffering severe respiratory distress. Ambulance en route.', author: 'Yusuf Danladi', time: '8 min ago' }
      ]
    },
    'RL-0021': {
      id: 'RL-0021',
      type: 'Security',
      location: 'Sabon Tasha, Kaduna',
      state: 'Chikun LGA, Kaduna State',
      phone: '08061112233',
      displayPhone: '0806***3344',
      reportedAt: 'Today, 11:05 AM',
      lastUpdate: '12 minutes ago',
      reportedVia: 'USSD *123#',
      priority: 'high',
      status: 'in-progress',
      elapsed: 3600,
      currentStep: 2,
      assignedTo: {
        name: 'Fatima Ahmed',
        role: 'Security Officer',
        initials: 'FA'
      },
      notes: [
        { text: 'Civil disturbance reported near junction. Local patrol secured perimeter.', author: 'Fatima Ahmed', time: '12 min ago' }
      ]
    },
    'RL-0020': {
      id: 'RL-0020',
      type: 'Flood',
      location: 'Kawo Area, Kaduna',
      state: 'Kaduna North LGA, Kaduna State',
      phone: '09093334455',
      displayPhone: '0909***1177',
      reportedAt: 'Today, 10:52 AM',
      lastUpdate: '18 minutes ago',
      reportedVia: 'USSD *123#',
      priority: 'normal',
      status: 'on-scene',
      elapsed: 4800,
      currentStep: 2,
      assignedTo: {
        name: 'Sani Mohammed',
        role: 'Rescue Team',
        initials: 'SM'
      },
      notes: [
        { text: 'Drainage overflow causing street flooding. Diverting traffic.', author: 'Sani Mohammed', time: '18 min ago' }
      ]
    }
  };

  function getReportData(id) {
    if (INCIDENT_DATABASE[id]) {
      return INCIDENT_DATABASE[id];
    }
    // Dynamic fallback for any unseen ID
    return {
      id: id || 'RL-0025',
      type: 'Fire',
      location: 'Kaduna Central',
      state: 'Kaduna State',
      phone: '08031234219',
      displayPhone: '0803***4219',
      reportedAt: 'Today, 11:42 AM',
      lastUpdate: 'Just now',
      reportedVia: 'USSD *123#',
      priority: 'high',
      status: 'in-progress',
      elapsed: 600,
      currentStep: 2,
      assignedTo: {
        name: 'Musa Ibrahim',
        role: 'Respondent',
        initials: 'MI'
      },
      notes: [
        { text: 'Incident under active investigation by regional responders.', author: 'System', time: 'Just now' }
      ]
    };
  }

  function getIconForType(type) {
    const map = {
      'Fire': 'flame',
      'Accident': 'car',
      'Medical': 'heart-pulse',
      'Flood': 'waves',
      'Security': 'shield-alert'
    };
    return map[type] || 'alert-circle';
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

  /* =========================================================
     HTML TEMPLATE GENERATOR
     ========================================================= */
  window.getReportDetailsHTML = function(id) {
    const r = getReportData(id);
    const typeClass = (r.type || 'fire').toLowerCase();
    const typeIcon = getIconForType(r.type);
    const isUrgent = r.elapsed > 1800 || r.priority === 'critical';

    // Step definitions
    const steps = [
      { name: 'Accepted', icon: 'check', desc: 'Report acknowledged by respondent', time: '11:45 AM' },
      { name: 'Dispatched', icon: 'truck', desc: 'Emergency response team dispatched to location', time: '11:48 AM' },
      { name: 'On Scene', icon: 'map-pin', desc: 'Response team arrived at incident location', time: 'In Progress' },
      { name: 'Resolved', icon: 'flag', desc: 'Emergency situation resolved and closed', time: 'Pending' }
    ];

    const stepsHtml = steps.map((s, idx) => {
      let stateClass = 'pending';
      let iconName = s.icon;
      if (idx < r.currentStep) {
        stateClass = 'completed';
        iconName = 'check';
      } else if (idx === r.currentStep) {
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

    const notesHtml = (r.notes || []).map(n => {
      if (n.isCritical) {
        return `
          <div class="rd-note-critical">
            <i data-lucide="alert-circle"></i>
            <div>
              <strong>Critical:</strong> ${escapeHTML(n.text)}
            </div>
          </div>
        `;
      }
      return `
        <div class="rd-note-item">
          <p>${escapeHTML(n.text)}</p>
          <div class="rd-note-meta">- ${escapeHTML(n.author || 'Respondent')}, ${escapeHTML(n.time || 'recently')}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="rd-container" id="reportDetailsContainer" data-report-id="${escapeHTML(r.id)}">

        <!-- ACTION BAR -->
        <div class="rd-action-bar">
          <button type="button" class="rd-back-btn" id="rdBackBtn">
            <i data-lucide="arrow-left"></i>
            <span>Back to Responses</span>
          </button>

          <div class="rd-action-buttons">
            <button type="button" id="btnDispatch" class="rd-btn rd-btn-dispatch" ${r.currentStep > 1 ? 'disabled' : ''}>
              <i data-lucide="truck"></i>
              <span>Dispatch</span>
            </button>
            <button type="button" id="btnOnScene" class="rd-btn rd-btn-onscene" ${r.currentStep >= 2 ? 'disabled' : ''}>
              <i data-lucide="map-pin"></i>
              <span>On Scene</span>
            </button>
            <button type="button" id="btnResolve" class="rd-btn rd-btn-resolve" ${r.currentStep >= 3 ? 'disabled' : ''}>
              <i data-lucide="check-circle-2"></i>
              <span>Resolve</span>
            </button>
            <button type="button" id="btnEscalate" class="rd-btn rd-btn-escalate">
              <i data-lucide="alert-triangle"></i>
              <span>Escalate</span>
            </button>
          </div>
        </div>

        <!-- INCIDENT HEADER BANNER -->
        <div class="rd-header-card">
          <div class="rd-header-main">
            <div class="rd-id-row">
              <span class="rd-id">${escapeHTML(r.id)}</span>
              <span class="rd-priority-badge ${escapeHTML(r.priority)}">${escapeHTML(capitalize(r.priority))}</span>
            </div>
            <div class="rd-type-badge ${escapeHTML(typeClass)}">
              <i data-lucide="${escapeHTML(typeIcon)}"></i>
              <span>${escapeHTML(r.type)} Emergency</span>
            </div>
          </div>

          <div class="rd-timer-box">
            <div class="rd-timer-label">Elapsed Time</div>
            <div id="rdTimer" class="rd-timer-val ${isUrgent ? 'urgent' : ''}" data-seconds="${r.elapsed}">
              ${formatTimer(r.elapsed)}
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
                  <div class="rd-loc-label">Address</div>
                  <div class="rd-loc-val">${escapeHTML(r.location)}</div>
                </div>
                <div class="rd-loc-item">
                  <div class="rd-loc-label">Region</div>
                  <div class="rd-loc-val" style="font-weight: 500; font-size: 13px; color: var(--text-soft);">${escapeHTML(r.state)}</div>
                </div>
                <button type="button" class="rd-btn-maps" onclick="window.open('https://maps.google.com/?q=${encodeURIComponent(r.location + ', ' + r.state)}', '_blank')">
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
                  <a href="tel:${escapeHTML(r.phone)}" class="rd-phone-num">${escapeHTML(r.displayPhone)}</a>
                  <button type="button" class="rd-copy-btn" id="rdCopyPhone" data-phone="${escapeHTML(r.phone)}" title="Copy phone number">
                    <i data-lucide="copy"></i>
                  </button>
                </div>
                <div class="rd-contact-actions">
                  <a href="tel:${escapeHTML(r.phone)}" class="rd-contact-btn call">
                    <i data-lucide="phone-call"></i>
                    <span>Call</span>
                  </a>
                  <a href="sms:${escapeHTML(r.phone)}" class="rd-contact-btn sms">
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
                  <span class="rd-detail-val">${escapeHTML(r.reportedAt)}</span>
                </div>
                <div class="rd-detail-item">
                  <span class="rd-detail-label">Last Updated</span>
                  <span class="rd-detail-val">${escapeHTML(r.lastUpdate)}</span>
                </div>
                <div class="rd-detail-item">
                  <span class="rd-detail-label">Reported Via</span>
                  <span class="rd-detail-val">${escapeHTML(r.reportedVia)}</span>
                </div>
                <div class="rd-detail-item">
                  <span class="rd-detail-label">Assigned To</span>
                  <div class="rd-assigned-chip">
                    <div class="rd-assigned-avatar">${escapeHTML(r.assignedTo.initials)}</div>
                    <div class="rd-assigned-info">
                      <span class="rd-assigned-name">${escapeHTML(r.assignedTo.name)}</span>
                      <span class="rd-assigned-role">${escapeHTML(r.assignedTo.role)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Incident Notes Card -->
            <div class="rd-card">
              <div class="rd-card-header">
                <div class="rd-card-title">
                  <i data-lucide="file-text"></i>
                  <span>Incident Notes</span>
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
     INTERACTION LOGIC
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

  function initReportDetails(reportId) {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }

    // Live Timer
    if (window._rdTimerInterval) {
      clearInterval(window._rdTimerInterval);
    }
    const timerEl = document.getElementById('rdTimer');
    if (timerEl) {
      let secs = parseInt(timerEl.getAttribute('data-seconds'), 10) || 0;
      window._rdTimerInterval = setInterval(() => {
        secs += 1;
        timerEl.setAttribute('data-seconds', secs);
        timerEl.textContent = formatTimer(secs);
        if (secs > 1800 && !timerEl.classList.contains('urgent')) {
          timerEl.classList.add('urgent');
        }
      }, 1000);
    }

    // Back Button
    const backBtn = document.getElementById('rdBackBtn');
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        if (mode === 'history' && window.RescueNav && typeof window.RescueNav.displayResponseHistoryContent === 'function') {
          window.RescueNav.displayResponseHistoryContent();
        } else if (mode === 'history') {
          window.location.href = 'response-history.php';
        } else if (window.RescueNav && typeof window.RescueNav.displayActiveResponsesContent === 'function') {
          window.RescueNav.displayActiveResponsesContent();
        } else if (document.referrer && document.referrer.includes('incorming-report')) {
          window.location.href = 'incorming-report.php';
        } else {
          window.location.href = 'active-responses.php';
        }
      });
    }

    // Action Buttons
    const btnDispatch = document.getElementById('btnDispatch');
    const btnOnScene = document.getElementById('btnOnScene');
    const btnResolve = document.getElementById('btnResolve');
    const btnEscalate = document.getElementById('btnEscalate');

    if (btnDispatch) {
      btnDispatch.addEventListener('click', () => {
        showToast('Dispatch team notified and in transit');
        btnDispatch.disabled = true;
        if (btnOnScene) btnOnScene.disabled = false;
      });
    }

    if (btnOnScene) {
      btnOnScene.addEventListener('click', () => {
        showToast('Status updated: Responders arrived On Scene');
        btnOnScene.disabled = true;
      });
    }

    if (btnResolve) {
      btnResolve.addEventListener('click', () => {
        if (confirm('Mark this incident as resolved and close active response?')) {
          showToast('Incident marked as Resolved');
          btnResolve.disabled = true;
          if (btnEscalate) btnEscalate.disabled = true;
        }
      });
    }

    if (btnEscalate) {
      btnEscalate.addEventListener('click', () => {
        if (confirm('Escalate this incident to higher emergency command?')) {
          showToast('Incident escalated to Regional Command');
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
    const notesList = document.getElementById('rdNotesList');
    if (addNoteBtn && notesList) {
      addNoteBtn.addEventListener('click', () => {
        const noteText = prompt('Enter a new note for this incident:');
        if (noteText && noteText.trim()) {
          const noteDiv = document.createElement('div');
          noteDiv.className = 'rd-note-item';
          noteDiv.innerHTML = `
            <p>${escapeHTML(noteText.trim())}</p>
            <div class="rd-note-meta">- You, Just now</div>
          `;
          notesList.appendChild(noteDiv);
          showToast('Incident note added');
        }
      });
    }
  }

  /* =========================================================
     GLOBAL VIEW DISPLAY IN CONTENT AREA
     ========================================================= */
  window.displayReportDetails = function(reportId) {
    const target = document.querySelector('.content');
    if (!target) {
      window.location.href = `report-details.php?id=${encodeURIComponent(reportId || 'RL-0025')}`;
      return;
    }

    // 1. Ensure report-details.css is loaded
    if (!document.getElementById('css-report-details')) {
      const link = document.createElement('link');
      link.id = 'css-report-details';
      link.rel = 'stylesheet';
      link.href = '../assets/css/respondant/report-details.css';
      document.head.appendChild(link);
    }

    // 2. Render HTML into display area
    const id = reportId || 'RL-0025';
    target.innerHTML = window.getReportDetailsHTML(id);

    // 3. Update topnav title
    const pageTitleH2 = document.querySelector('.page-title h2');
    const pageTitleP = document.querySelector('.page-title p');
    if (pageTitleH2) pageTitleH2.textContent = `Incident Details: ${id}`;
    if (pageTitleP) pageTitleP.textContent = 'Monitor response progress, reporter info, and actions in real-time';

    // 4. Update URL without full refresh
    try {
      window.history.pushState({ page: 'report_details', id: id }, '', `report-details.php?id=${encodeURIComponent(id)}`);
    } catch (e) {}

    // 5. Initialize interaction logic
    initReportDetails(id);

    // Scroll to top of content
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Export handlers
  window.initReportDetails = initReportDetails;

  // Global override for window.viewReport across the application
  window.viewReport = function(id) {
    window.displayReportDetails(id);
  };

  // Auto-run if already on report-details.php directly
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('reportDetailsContainer');
    if (container) {
      const id = container.getAttribute('data-report-id') || 'RL-0025';
      initReportDetails(id);
    }
  });

  // Immediate check if DOM is already ready
  const container = document.getElementById('reportDetailsContainer');
  if (container) {
    const id = container.getAttribute('data-report-id') || 'RL-0025';
    initReportDetails(id);
  }
})();
