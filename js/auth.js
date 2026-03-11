// js/auth.js
document.addEventListener('DOMContentLoaded', function() {
  console.log('Auth.js loaded with Firebase Realtime Database');
  
  // Check if Firebase is initialized
  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded!');
    return;
  }
  if (firebase.apps.length === 0) {
    console.error('Firebase not initialized. Make sure firebase-config.js is loaded and calls initializeApp().');
    return;
  }

  // DOM Elements
  const modal = document.getElementById('authModal');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const closeBtn = document.getElementById('closeModal');
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const toast = document.getElementById('toast');
  const welcomeOverlay = document.getElementById('welcomeOverlay');
  const loginError = document.getElementById('loginError');
  const registerError = document.getElementById('registerError');
  const heroTitle = document.getElementById('heroTitle');
  const forgotPassword = document.getElementById('forgotPassword');

  // Get Firebase instances
  const auth = firebase.auth();
  const database = firebase.database();

  // Check if elements exist
  if (!modal || !loginBtn || !logoutBtn || !closeBtn || !loginTab || !registerTab || !loginForm || !registerForm || !toast || !welcomeOverlay || !heroTitle) {
    console.error('Some auth elements are missing!');
    return;
  }

  // Show toast message
  function showToast(message, duration = 3000, isError = false) {
    toast.textContent = message;
    toast.classList.remove('hidden');
    if (isError) {
      toast.style.background = '#dc2626';
    } else {
      toast.style.background = 'var(--accent)';
    }
    
    setTimeout(() => {
      toast.classList.add('hidden');
    }, duration);
  }

  // Show welcome animation
  function showWelcomeAnimation() {
    welcomeOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
      welcomeOverlay.classList.add('hidden');
      document.body.style.overflow = '';
    }, 4000);
  }

  // Update hero title based on auth state
  function updateHeroTitle(user) {
    if (user) {
      // Get display name from Realtime Database
      const userId = user.uid;
      database.ref('users/' + userId).once('value').then((snapshot) => {
        const userData = snapshot.val();
        const displayName = userData && userData.name ? userData.name : user.displayName || user.email.split('@')[0];
        heroTitle.innerHTML = `Welcome <span class="hero-accent">${displayName}</span>`;
      }).catch((error) => {
        console.error('Error fetching user data:', error);
        heroTitle.innerHTML = `Welcome <span class="hero-accent">${user.email.split('@')[0]}</span>`;
      });
    } else {
      heroTitle.innerHTML = `Light of Praise <span class="hero-accent">Song Bank</span>`;
    }
  }

  // Update UI based on auth state
  function updateAuthUI(user) {
    if (user) {
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'inline-block';
      updateHeroTitle(user);
    } else {
      loginBtn.style.display = 'inline-block';
      logoutBtn.style.display = 'none';
      updateHeroTitle(null);
    }
  }

  // Listen for auth state changes
  auth.onAuthStateChanged((user) => {
    updateAuthUI(user);
    if (user) {
      console.log('User logged in:', user.email);
    } else {
      console.log('User logged out');
    }
  });

  // Open modal
  loginBtn.addEventListener('click', () => {
    console.log('Login button clicked');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    loginError.textContent = '';
    registerError.textContent = '';
  });

  // Close modal
  function closeModal() {
    modal.classList.remove('show');
    document.body.style.overflow = '';
    loginForm.reset();
    registerForm.reset();
    loginError.textContent = '';
    registerError.textContent = '';
  }

  closeBtn.addEventListener('click', closeModal);
  
  // Click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Tab switching
  loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
    loginError.textContent = '';
    registerError.textContent = '';
  });

  registerTab.addEventListener('click', () => {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
    loginError.textContent = '';
    registerError.textContent = '';
  });

  // Login form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Login form submitted');
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = document.getElementById('loginSubmitBtn');
    
    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Logging in...';
      loginError.textContent = '';
      
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      closeModal();
      showToast(`👋 Welcome back, ${user.email.split('@')[0]}!`);
      
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. ';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage += 'User not found.';
          break;
        case 'auth/wrong-password':
          errorMessage += 'Incorrect password.';
          break;
        case 'auth/invalid-email':
          errorMessage += 'Invalid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage += 'This account has been disabled.';
          break;
        case 'auth/too-many-requests':
          errorMessage += 'Too many failed attempts. Try again later.';
          break;
        default:
          errorMessage += error.message;
      }
      loginError.textContent = errorMessage;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Login';
    }
  });

  // Register form submission
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Register form submitted');
    
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const repeatPassword = document.getElementById('regRepeatPassword').value;
    const voiceRange = document.getElementById('voiceRange').value;
    const terms = document.getElementById('terms').checked;
    const submitBtn = document.getElementById('registerSubmitBtn');
    
    // Validate passwords match
    if (password !== repeatPassword) {
      registerError.textContent = 'Passwords do not match!';
      return;
    }
    
    // Validate password strength
    if (password.length < 6) {
      registerError.textContent = 'Password must be at least 6 characters long.';
      return;
    }
    
    if (!terms) {
      registerError.textContent = 'Please agree to the terms and conditions';
      return;
    }
    
    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';
      registerError.textContent = '';
      
      // Create user in Firebase Auth
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Update user profile with display name
      await user.updateProfile({
        displayName: name
      });
      
      // Store additional user data in Realtime Database
      await database.ref('users/' + user.uid).set({
        name: name,
        email: email,
        voiceRange: voiceRange,
        createdAt: new Date().toISOString(),
        termsAgreed: true,
        userId: user.uid
      });
      
      closeModal();
      showWelcomeAnimation();
      
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed. ';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage += 'Email already registered.';
          break;
        case 'auth/invalid-email':
          errorMessage += 'Invalid email address.';
          break;
        case 'auth/weak-password':
          errorMessage += 'Password is too weak.';
          break;
        default:
          errorMessage += error.message;
      }
      registerError.textContent = errorMessage;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    }
  });

  // Logout functionality
  logoutBtn.addEventListener('click', async () => {
    try {
      await auth.signOut();
      showToast('👋 Logged out successfully!');
    } catch (error) {
      console.error('Logout error:', error);
      showToast('Error logging out. Please try again.', 3000, true);
    }
  });

  // Forgot password
  forgotPassword.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    
    if (!email) {
      loginError.textContent = 'Please enter your email address first.';
      return;
    }
    
    try {
      await auth.sendPasswordResetEmail(email);
      showToast('📧 Password reset email sent! Check your inbox.');
      closeModal();
    } catch (error) {
      console.error('Password reset error:', error);
      let errorMessage = 'Error sending reset email. ';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage += 'User not found.';
          break;
        case 'auth/invalid-email':
          errorMessage += 'Invalid email address.';
          break;
        default:
          errorMessage += error.message;
      }
      loginError.textContent = errorMessage;
    }
  });

  // Escape key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      closeModal();
    }
  });

  // Click handlers for links
  const termsLink = document.querySelector('.form-group.checkbox a');
  if (termsLink) {
    termsLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Terms and conditions would open here.');
    });
  }

  // Close welcome overlay on click
  welcomeOverlay.addEventListener('click', () => {
    welcomeOverlay.classList.add('hidden');
    document.body.style.overflow = '';
  });

  console.log('Auth.js initialization complete');
});