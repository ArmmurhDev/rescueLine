/**
 * RescueLine - Notifications JavaScript
 * Manages emergency alerts, interactive list rendering, mark as read, and SPA integration.
 */

// Mock Notifications Dataset
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    reportId: 'RL-0025',
    type: 'Fire',
    priority: 'critical',
    location: 'Kaduna South Market Area',
    statement: 'Large fire reported at Kaduna South Market. Multiple stalls engulfed in flames. Smoke visible from several kilometers away. Market traders evacuating.',
    time: '2 minutes ago',
    unread: true
  },
  {
    id: 2,
    reportId: 'RL-0024',
    type: 'Accident',
    priority: 'critical',
    location: 'Zaria City, Katsina Road',
    statement: 'Multi-vehicle accident on Katsina Road. 3 vehicles involved. Injuries reported. Traffic completely blocked. Ambulance needed urgently.',
    time: '8 minutes ago',
    unread: true
  },
  {
    id: 3,
    reportId: 'RL-0023',
    type: 'Medical',
    priority: 'high',
    location: 'Chikun LGA, Ganawuri',
    statement: 'Elderly person collapsed at home. Difficulty breathing. Needs immediate medical attention. Address: 12 Ganawuri Street.',
    time: '15 minutes ago',
    unread: true
  },
  {
    id: 4,
    reportId: 'RL-0022',
    type: 'Flood',
    priority: 'normal',
    location: 'Kawo Area, Kaduna',
    statement: 'Heavy rainfall causing flooding in Kawo area. Water level rising. Several houses affected. Need rescue boats.',
    time: '25 minutes ago',
    unread: false
  },
  {
    id: 5,
    reportId: 'RL-0021',
    type: 'Security',
    priority: 'high',
    location: 'Sabon Tasha, Kaduna',
    statement: 'Armed robbery in progress at Sabon Tasha market. Gunshots heard. People running. Police response needed immediately.',
    time: '32 minutes ago',
    unread: true
  }
];

let activeNotificationFilter = 'all';

// Icon mapper helper
function getNotifIconForType(type) {
  const map = {
    'Fire': 'flame',
    'Accident': 'car',
    'Medical': 'heart-pulse',
    'Flood': 'waves',
    'Security': 'shield-alert'
  };
  return map[type] || 'alert-circle';
}

// Template Generator for Dynamic SPA Content Loading
window.getNotificationsHTML = function() {
  return `
  <div class="notifications-container" id="notificationsContainer">

    <!-- PAGE HEADER -->
    <div class="page-header">
      <div class="page-header-left">
        <h1>
          <i data-lucide="bell" style="width: 24px; height: 24px; color: var(--green);"></i>
          Notifications
        </h1>
        <p>Manage emergency notifications and alerts</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="markAllReadBtn" type="button">
          <i data-lucide="check-check"></i>
          Mark All Read
        </button>
        <button class="btn btn-primary" id="refreshNotifsBtn" type="button">
          <i data-lucide="refresh-cw"></i>
          Refresh
        </button>
      </div>
    </div>

    <!-- NOTIFICATIONS CARD -->
    <div class="notifications-card">
      <div class="notifications-card-header">
        <div class="notifications-card-title">
          <i data-lucide="inbox"></i>
          Recent Emergency Notifications
        </div>
        <div class="notifications-card-actions">
          <span class="unread-badge" id="unreadBadge">0 unread</span>
        </div>
      </div>

      <div class="notifications-card-body">
        <!-- Filter Pills -->
        <div class="notif-filter-bar">
          <button class="notif-filter-btn active" data-filter="all" type="button">All Alerts</button>
          <button class="notif-filter-btn" data-filter="unread" type="button">Unread Only</button>
          <button class="notif-filter-btn" data-filter="critical" type="button">Critical</button>
          <button class="notif-filter-btn" data-filter="high" type="button">High Priority</button>
          <button class="notif-filter-btn" data-filter="normal" type="button">Normal</button>
        </div>

        <!-- Notification List -->
        <div class="notification-list" id="notificationList"></div>
      </div>
    </div>

  </div>

  <!-- Toast Notification -->
  <div class="toast" id="toast">
    <i data-lucide="check-circle"></i>
    <span id="toastMessage">Action completed successfully</span>
  </div>
  `;
};

// Render Notifications
function renderNotifications() {
  const list = document.getElementById('notificationList');
  const badge = document.getElementById('unreadBadge');
  if (!list) return;

  const unreadCount = MOCK_NOTIFICATIONS.filter(n => n.unread).length;
  if (badge) {
    badge.textContent = `${unreadCount} unread`;
  }

  // Update topnav badge if exists
  const topnavBadge = document.querySelector('.topnav #notifBtn .badge');
  if (topnavBadge) {
    topnavBadge.textContent = unreadCount;
    topnavBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
  }

  // Apply active filter
  const filtered = MOCK_NOTIFICATIONS.filter(n => {
    if (activeNotificationFilter === 'unread') return n.unread;
    if (activeNotificationFilter === 'critical') return n.priority === 'critical';
    if (activeNotificationFilter === 'high') return n.priority === 'high';
    if (activeNotificationFilter === 'normal') return n.priority === 'normal';
    return true;
  });

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <i data-lucide="bell-off"></i>
        <h3>No notifications found</h3>
        <p>No emergency notifications match the selected filter.</p>
      </div>
    `;
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
    return;
  }

  list.innerHTML = filtered.map(n => `
    <div class="notification-item ${n.priority} ${n.unread ? 'unread' : ''}" onclick="window.toggleNotificationRead(${n.id}, true)">
      <div class="notification-header">
        <div class="notification-type ${n.type.toLowerCase()}">
          <i data-lucide="${getNotifIconForType(n.type)}"></i>
          ${n.type}
        </div>
        <div class="notification-time">
          <i data-lucide="clock"></i>
          ${n.time}
        </div>
      </div>

      <div class="notification-report-id" onclick="event.stopPropagation(); window.viewNotificationReport('${n.reportId}')">
        ${n.reportId}
      </div>

      <div class="notification-location">
        <i data-lucide="map-pin"></i>
        ${n.location}
      </div>

      <div class="notification-statement">
        ${n.statement}
      </div>

      <div class="notification-actions">
        <button class="notification-btn notification-btn-view" type="button" onclick="event.stopPropagation(); window.viewNotificationReport('${n.reportId}')">
          <i data-lucide="eye"></i>
          View Report
        </button>
        <button class="notification-btn notification-btn-read" type="button" onclick="event.stopPropagation(); window.toggleNotificationRead(${n.id})">
          <i data-lucide="${n.unread ? 'check' : 'mail'}"></i>
          ${n.unread ? 'Mark as Read' : 'Mark as Unread'}
        </button>
      </div>
    </div>
  `).join('');

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

// Global Actions
window.toggleNotificationRead = function(id, keepStateIfRead = false) {
  const item = MOCK_NOTIFICATIONS.find(n => n.id === id);
  if (!item) return;

  if (keepStateIfRead && !item.unread) {
    return; // Already read
  }

  item.unread = !item.unread;
  renderNotifications();
  showNotificationToast(item.unread ? `Marked ${item.reportId} as unread` : `Marked ${item.reportId} as read`);
};

window.viewNotificationReport = function(reportId) {
  if (window.RescueNav && typeof window.RescueNav.displayReportDetails === 'function') {
    window.RescueNav.displayReportDetails(reportId);
  } else {
    window.location.href = `report-details.php?id=${encodeURIComponent(reportId)}`;
  }
};

function showNotificationToast(message) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  if (!toast) return;

  if (toastMessage) toastMessage.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// Initializer Function for Notifications
function initNotifications() {
  const markAllReadBtn = document.getElementById('markAllReadBtn') || document.getElementById('markAllRead');
  const refreshNotifsBtn = document.getElementById('refreshNotifsBtn');
  const filterBtns = document.querySelectorAll('.notif-filter-btn');

  // Mark all read listener
  if (markAllReadBtn) {
    markAllReadBtn.onclick = function() {
      MOCK_NOTIFICATIONS.forEach(n => { n.unread = false; });
      renderNotifications();
      showNotificationToast('All notifications marked as read');
    };
  }

  // Refresh listener
  if (refreshNotifsBtn) {
    refreshNotifsBtn.onclick = function() {
      renderNotifications();
      showNotificationToast('Notifications refreshed');
    };
  }

  // Filter pills listeners
  filterBtns.forEach(btn => {
    btn.onclick = function() {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeNotificationFilter = btn.dataset.filter || 'all';
      renderNotifications();
    };
  });

  // Initial render
  renderNotifications();

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

// Global exports
window.initNotifications = initNotifications;
window.renderNotifications = renderNotifications;

// Auto-run if container is present on load
if (document.getElementById('notificationList') || document.getElementById('notificationsContainer')) {
  initNotifications();
}
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('notificationList') || document.getElementById('notificationsContainer')) {
    initNotifications();
  }
});
