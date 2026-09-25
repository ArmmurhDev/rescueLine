/**
 * RescueLine - Notifications JavaScript (Real-time DB Connection)
 * Manages emergency alerts, interactive list rendering, mark as read against MySQL database.
 */

// Template Generator for Dynamic SPA Content Loading
window.getNotificationsHTML = function() {
  return `
  <div class="notifications-container" id="notificationsContainer">
    <div class="page-header">
      <div class="page-header-left">
        <h1>
          <i data-lucide="bell" style="width: 24px; height: 24px; color: var(--green);"></i>
          Notifications
        </h1>
        <p>Manage emergency notifications and system alerts in real-time</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="markAllReadBtn" type="button" onclick="markAllNotifsRead()">
          <i data-lucide="check-check"></i>
          Mark All Read
        </button>
        <button class="btn btn-primary" id="refreshNotifsBtn" type="button" onclick="loadRealNotifications()">
          <i data-lucide="refresh-cw"></i>
          Refresh
        </button>
      </div>
    </div>

    <div class="notifications-card">
      <div class="notif-list-view" id="notifListView"></div>
    </div>
  </div>
  `;
};

async function loadRealNotifications() {
  const container = document.getElementById('notifListView');
  if (!container) return;

  try {
    const res = await fetch('../api/notifications.php?action=list');
    const json = await res.json();
    if (json.status === 'success' && json.data) {
      const notifs = json.data.notifications || [];
      if (notifs.length === 0) {
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);"><i data-lucide="bell-off" style="width: 36px; height: 36px; margin-bottom: 8px;"></i><p>No new notifications at this time.</p></div>';
      } else {
        container.innerHTML = notifs.map(n => `
          <div class="notif-row-item ${n.is_read ? '' : 'unread'}">
            <div class="notif-dot ${n.type || 'info'}">
              <i data-lucide="${n.icon || 'bell'}"></i>
            </div>
            <div class="notif-body">
              <div class="notif-head">
                <span class="notif-title">${escapeHTML(n.title)}</span>
                <span class="notif-time">${formatTimeAgo(n.created_at)}</span>
              </div>
              <div class="notif-msg">${escapeHTML(n.message)}</div>
            </div>
          </div>
        `).join('');
      }
    }
  } catch (e) {
    console.error('Error fetching notifications:', e);
  }

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

async function markAllNotifsRead() {
  try {
    await fetch('../api/notifications.php?action=mark_all_read', { method: 'POST' });
    loadRealNotifications();
  } catch (e) {
    console.error(e);
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return 'Just now';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('notifListView') || document.getElementById('notificationsContainer')) {
    loadRealNotifications();
  }
});
