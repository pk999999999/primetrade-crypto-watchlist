/**
 * PrimeTrade Dashboard Module
 * Handles CRUD operations for watchlist items
 */

let deleteItemId = null;

/**
 * Load and render the watchlist
 */
async function loadWatchlist() {
  const viewAll = document.getElementById('view-all-toggle')?.checked ? 'true' : 'false';
  const result = await apiFetch(`/watchlist?viewAll=${viewAll}`);

  if (result.success) {
    renderWatchlist(result.data, viewAll === 'true');
    updateStats(result.data);
  }
}

/**
 * Render watchlist items in the table
 */
function renderWatchlist(items, showUserColumn = false) {
  const tbody = document.getElementById('watchlist-body');

  if (!items || items.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="${showUserColumn ? 8 : 7}">
          <div class="empty-state">
            <span class="empty-icon">🔍</span>
            <p>Your watchlist is empty</p>
            <p class="empty-hint">Click "Add Crypto" to start tracking</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = items.map(item => `
    <tr data-id="${item.id}">
      <td>
        <div class="symbol-cell">
          <span class="symbol-badge">${escapeHtml(item.symbol)}</span>
        </div>
      </td>
      <td>${escapeHtml(item.name)}</td>
      <td class="price-cell">${item.target_price ? '$' + Number(item.target_price).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}</td>
      <td>
        <span class="alert-badge ${item.alert_type === 'above' ? 'alert-above' : 'alert-below'}">
          ${item.alert_type === 'above' ? '↑ Above' : '↓ Below'}
        </span>
      </td>
      <td class="notes-cell" title="${escapeHtml(item.notes || '')}">${escapeHtml(item.notes || '—')}</td>
      <td class="date-cell">${formatDate(item.created_at)}</td>
      ${showUserColumn ? `<td class="user-email-cell">${escapeHtml(item.user_email || '')}</td>` : ''}
      <td>
        <div class="actions-cell">
          <button class="btn-icon edit" onclick="openEditModal(${item.id})" title="Edit">✏️</button>
          <button class="btn-icon delete" onclick="openDeleteModal(${item.id}, '${escapeHtml(item.symbol)}')" title="Delete">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Update table header if showing admin view
  updateTableHeaders(showUserColumn);
}

/**
 * Update table headers to show/hide user column
 */
function updateTableHeaders(showUserColumn) {
  const thead = document.querySelector('#watchlist-table thead tr');
  const hasUserCol = thead.querySelector('.user-col');

  if (showUserColumn && !hasUserCol) {
    const th = document.createElement('th');
    th.className = 'user-col';
    th.textContent = 'User';
    thead.insertBefore(th, thead.lastElementChild);
  } else if (!showUserColumn && hasUserCol) {
    hasUserCol.remove();
  }
}

/**
 * Update stats cards
 */
function updateStats(items) {
  const total = items.length;
  const uniqueSymbols = new Set(items.map(i => i.symbol)).size;
  const alerts = items.filter(i => i.target_price).length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-symbols').textContent = uniqueSymbols;
  document.getElementById('stat-alerts').textContent = alerts;
}

/**
 * Open Add modal
 */
function openAddModal() {
  document.getElementById('modal-title').textContent = 'Add to Watchlist';
  document.getElementById('modal-submit-btn').textContent = 'Add to Watchlist';
  document.getElementById('item-form').reset();
  document.getElementById('item-id').value = '';
  document.getElementById('item-modal').classList.remove('hidden');
}

/**
 * Open Edit modal with pre-filled data
 */
async function openEditModal(id) {
  showLoading();
  const result = await apiFetch(`/watchlist/${id}`);
  hideLoading();

  if (!result.success) {
    showToast(result.message || 'Failed to load item.', 'error');
    return;
  }

  const item = result.data;
  document.getElementById('modal-title').textContent = `Edit ${item.symbol}`;
  document.getElementById('modal-submit-btn').textContent = 'Save Changes';
  document.getElementById('item-id').value = item.id;
  document.getElementById('item-symbol').value = item.symbol;
  document.getElementById('item-name').value = item.name;
  document.getElementById('item-target-price').value = item.target_price || '';
  document.getElementById('item-alert-type').value = item.alert_type || 'above';
  document.getElementById('item-notes').value = item.notes || '';

  document.getElementById('item-modal').classList.remove('hidden');
}

/**
 * Close Add/Edit modal
 */
function closeModal() {
  document.getElementById('item-modal').classList.add('hidden');
}

/**
 * Handle Add/Edit form submission
 */
async function handleItemSubmit(event) {
  event.preventDefault();

  const itemId = document.getElementById('item-id').value;
  const isEdit = !!itemId;

  const body = {
    symbol: document.getElementById('item-symbol').value.trim(),
    name: document.getElementById('item-name').value.trim(),
    targetPrice: parseFloat(document.getElementById('item-target-price').value) || null,
    alertType: document.getElementById('item-alert-type').value,
    notes: document.getElementById('item-notes').value.trim()
  };

  showLoading();
  const result = await apiFetch(
    isEdit ? `/watchlist/${itemId}` : '/watchlist',
    {
      method: isEdit ? 'PUT' : 'POST',
      body
    }
  );
  hideLoading();

  if (result.success) {
    showToast(result.message || (isEdit ? 'Updated!' : 'Added!'), 'success');
    closeModal();
    loadWatchlist();
  } else {
    showToast(result.message || 'Operation failed.', 'error');
    if (result.errors) {
      result.errors.forEach(err => showToast(`${err.field}: ${err.message}`, 'error'));
    }
  }
}

/**
 * Open delete confirmation modal
 */
function openDeleteModal(id, symbol) {
  deleteItemId = id;
  document.getElementById('delete-item-name').textContent = symbol;
  document.getElementById('delete-modal').classList.remove('hidden');
}

/**
 * Close delete modal
 */
function closeDeleteModal() {
  document.getElementById('delete-modal').classList.add('hidden');
  deleteItemId = null;
}

/**
 * Confirm and execute delete
 */
async function confirmDelete() {
  if (!deleteItemId) return;

  showLoading();
  const result = await apiFetch(`/watchlist/${deleteItemId}`, {
    method: 'DELETE'
  });
  hideLoading();

  if (result.success) {
    showToast(result.message || 'Deleted!', 'success');
    closeDeleteModal();
    loadWatchlist();
  } else {
    showToast(result.message || 'Delete failed.', 'error');
  }
}

/**
 * Setup dashboard for current user
 */
function setupDashboard() {
  const user = getUser();
  if (!user) return;

  document.getElementById('user-name').textContent = user.fullName;

  const badge = document.getElementById('user-role-badge');
  badge.textContent = user.role;
  badge.className = `role-badge role-${user.role}`;

  // Show admin controls if admin
  const adminControls = document.getElementById('admin-controls');
  if (user.role === 'admin') {
    adminControls.classList.remove('hidden');
  } else {
    adminControls.classList.add('hidden');
  }

  loadWatchlist();
}

/* ─── Utility Functions ─── */

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
