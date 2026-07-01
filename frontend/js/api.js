/**
 * PrimeTrade API Client
 * Handles all HTTP requests with JWT token management
 */

const API_BASE = '/api/v1';

/**
 * Get stored JWT token
 */
function getToken() {
  return localStorage.getItem('pt_token');
}

/**
 * Store JWT token
 */
function setToken(token) {
  localStorage.setItem('pt_token', token);
}

/**
 * Remove stored JWT token
 */
function removeToken() {
  localStorage.removeItem('pt_token');
  localStorage.removeItem('pt_user');
}

/**
 * Store user data
 */
function setUser(user) {
  localStorage.setItem('pt_user', JSON.stringify(user));
}

/**
 * Get stored user data
 */
function getUser() {
  const data = localStorage.getItem('pt_user');
  return data ? JSON.parse(data) : null;
}

/**
 * Core API fetch wrapper with JWT handling
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    // Handle 401 - redirect to login
    if (response.status === 401) {
      removeToken();
      showView('auth');
      showToast('Session expired. Please log in again.', 'warning');
      return { success: false, message: 'Session expired' };
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    showToast('Network error. Please check your connection.', 'error');
    return { success: false, message: 'Network error' };
  }
}

/**
 * Show loading overlay
 */
function showLoading() {
  document.getElementById('loading-overlay').classList.remove('hidden');
}

/**
 * Hide loading overlay
 */
function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };

  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || '💬'}</span><span>${message}</span>`;
  container.appendChild(toast);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
