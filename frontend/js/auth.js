/**
 * PrimeTrade Authentication Module
 * Handles login, registration, and tab switching
 */

/**
 * Switch between Login and Register tabs
 */
function switchAuthTab(tab) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
  }
}

/**
 * Handle login form submission
 */
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');

  btn.disabled = true;
  btn.querySelector('span').textContent = 'Signing in...';
  showLoading();

  const result = await apiFetch('/auth/login', {
    method: 'POST',
    body: { email, password }
  });

  hideLoading();
  btn.disabled = false;
  btn.querySelector('span').textContent = 'Sign In';

  if (result.success) {
    setToken(result.data.token);
    setUser(result.data.user);
    showToast(`Welcome back, ${result.data.user.fullName}!`, 'success');
    showView('dashboard');
  } else {
    showToast(result.message || 'Login failed.', 'error');

    // Show validation errors if any
    if (result.errors) {
      result.errors.forEach(err => {
        showToast(`${err.field}: ${err.message}`, 'error');
      });
    }
  }
}

/**
 * Handle registration form submission
 */
async function handleRegister(event) {
  event.preventDefault();

  const fullName = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const btn = document.getElementById('register-btn');

  btn.disabled = true;
  btn.querySelector('span').textContent = 'Creating account...';
  showLoading();

  const result = await apiFetch('/auth/register', {
    method: 'POST',
    body: { fullName, email, password }
  });

  hideLoading();
  btn.disabled = false;
  btn.querySelector('span').textContent = 'Create Account';

  if (result.success) {
    setToken(result.data.token);
    setUser(result.data.user);
    showToast('Account created! Welcome to PrimeTrade.', 'success');
    showView('dashboard');
  } else {
    showToast(result.message || 'Registration failed.', 'error');

    if (result.errors) {
      result.errors.forEach(err => {
        showToast(`${err.field}: ${err.message}`, 'error');
      });
    }
  }
}

/**
 * Handle logout
 */
function handleLogout() {
  removeToken();
  showToast('Signed out successfully.', 'success');
  showView('auth');

  // Reset forms
  document.getElementById('login-form').reset();
  document.getElementById('register-form').reset();
  switchAuthTab('login');
}
