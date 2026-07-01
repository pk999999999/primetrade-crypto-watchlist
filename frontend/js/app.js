/**
 * PrimeTrade App Router
 * Manages view switching and initial auth state
 */

/**
 * Switch between Auth and Dashboard views
 */
function showView(viewName) {
  const authView = document.getElementById('auth-view');
  const dashboardView = document.getElementById('dashboard-view');

  if (viewName === 'dashboard') {
    authView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    setupDashboard();
  } else {
    authView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
  }
}

/**
 * Check auth state on page load
 */
function initApp() {
  const token = getToken();
  const user = getUser();

  if (token && user) {
    // Verify token is still valid by calling /me
    apiFetch('/auth/me').then(result => {
      if (result.success) {
        setUser(result.data);
        showView('dashboard');
      } else {
        removeToken();
        showView('auth');
      }
    });
  } else {
    showView('auth');
  }
}

// Initialize app on DOM ready
document.addEventListener('DOMContentLoaded', initApp);
