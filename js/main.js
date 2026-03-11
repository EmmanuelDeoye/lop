// js/main.js
document.addEventListener('DOMContentLoaded', function() {
  console.log('Main.js loaded');
  
  // Check if Firebase is initialized
  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded!');
    return;
  }

  // Get Firebase instances
  const database = firebase.database();
  
  // ----- DOM elements -----
  const songContainer = document.getElementById('songList');
  const emptyMessage = document.getElementById('emptyMessage');
  const searchInput = document.getElementById('searchInput');
  const typeFilter = document.getElementById('typeFilter');
  const categoryFilter = document.getElementById('categoryFilter');
  const creatorFilter = document.getElementById('creatorFilter');
  const themeToggle = document.getElementById('themeToggle');
  const htmlElement = document.documentElement;

  // Create loading element
  const loadingElement = document.createElement('div');
  loadingElement.className = 'loading-state';
  loadingElement.innerHTML = `
    <div class="loading-spinner"></div>
    <p>Loading songs...</p>
  `;

  // Check if elements exist
  if (!songContainer || !emptyMessage || !searchInput || !typeFilter || !categoryFilter || !creatorFilter || !themeToggle) {
    console.error('Some DOM elements are missing!');
    return;
  }

  // State
  let allSongs = [];
  let creators = [];

  // Show loading state
  function showLoading() {
    songContainer.innerHTML = '';
    songContainer.appendChild(loadingElement);
    emptyMessage.classList.add('hidden');
  }

  // Hide loading state
  function hideLoading() {
    if (loadingElement.parentNode === songContainer) {
      songContainer.removeChild(loadingElement);
    }
  }

  // ----- populate creator dropdown dynamically -----
  function populateCreatorFilter() {
    creatorFilter.innerHTML = '<option value="all">all</option>';
    creators.sort().forEach(creator => {
      const option = document.createElement('option');
      option.value = creator;
      option.textContent = creator;
      creatorFilter.appendChild(option);
    });
  }

  // ----- extract unique creators from songs -----
  function updateCreators(songs) {
    creators = [...new Set(songs.map(s => s.creator))];
    populateCreatorFilter();
  }

  // ----- render cards based on filters -----
  function renderSongs() {
    if (allSongs.length === 0) {
      hideLoading();
      songContainer.innerHTML = '';
      emptyMessage.classList.remove('hidden');
      return;
    }

    const searchTerm = searchInput.value.trim().toLowerCase();
    const typeVal = typeFilter.value;
    const catVal = categoryFilter.value;
    const creatorVal = creatorFilter.value;

    const filtered = allSongs.filter(song => {
      const matchesSearch = searchTerm === '' ||
        song.title.toLowerCase().includes(searchTerm) ||
        (song.lyrics && song.lyrics.toLowerCase().includes(searchTerm)) ||
        song.creator.toLowerCase().includes(searchTerm);
      
      const matchesType = typeVal === 'all' || song.type === typeVal;
      const matchesCategory = catVal === 'all' || song.category === catVal;
      const matchesCreator = creatorVal === 'all' || song.creator === creatorVal;

      return matchesSearch && matchesType && matchesCategory && matchesCreator;
    });

    hideLoading();

    if (filtered.length === 0) {
      songContainer.innerHTML = '';
      emptyMessage.classList.remove('hidden');
    } else {
      emptyMessage.classList.add('hidden');
      songContainer.innerHTML = filtered.map(song => {
        const lyricsShort = song.lyrics ? 
          song.lyrics.split('\n').slice(0,2).join(' ').substring(0,70) + '…' : 
          'No lyrics available';
        
        return `
          <article class="song-card" data-id="${song.id}" data-creator="${song.creatorId || ''}">
            <div class="card-header">
              <h3 class="card-title">${song.title}</h3>
              <div class="card-badges">
                <span class="badge-key">${song.key}</span>
                <span class="badge-type">${song.type}</span>
                <span class="badge-cat">${song.category}</span>
              </div>
            </div>
            <div class="card-lyrics-preview">${lyricsShort}</div>
            <div class="card-footer">
              <span>✍️ ${song.creator} · ${song.date || 'Unknown date'}</span>
              <div class="meta-icons">
                ${song.hasVoice ? '<span>🎤</span>' : ''}
                ${song.hasLink ? '<span>🔗</span>' : ''}
              </div>
            </div>
          </article>
        `;
      }).join('');
    }
  }

  // ----- Load songs from Firebase -----
  function loadSongsFromDatabase() {
    showLoading();
    
    database.ref('songs').once('value', (snapshot) => {
      const songs = snapshot.val();
      
      if (songs) {
        // Convert object to array and ensure each song has an id
        allSongs = Object.entries(songs).map(([id, song]) => ({
          id: id,
          ...song
        }));
        
        // Update creators list
        updateCreators(allSongs);
        
        // Render songs
        renderSongs();
      } else {
        allSongs = [];
        creators = [];
        populateCreatorFilter();
        hideLoading();
        songContainer.innerHTML = '';
        emptyMessage.classList.remove('hidden');
      }
    }).catch((error) => {
      console.error('Error loading songs:', error);
      hideLoading();
      songContainer.innerHTML = `
        <div class="error-state">
          <p>Error loading songs. Please try again.</p>
          <button class="retry-btn" onclick="location.reload()">Retry</button>
        </div>
      `;
    });
  }

  // ----- Set up real-time listener for updates -----
  function setupRealtimeListener() {
    database.ref('songs').on('value', (snapshot) => {
      const songs = snapshot.val();
      
      if (songs) {
        allSongs = Object.entries(songs).map(([id, song]) => ({
          id: id,
          ...song
        }));
        
        // Update creators list (only if they've changed)
        const newCreators = [...new Set(allSongs.map(s => s.creator))];
        if (JSON.stringify(creators) !== JSON.stringify(newCreators)) {
          creators = newCreators;
          populateCreatorFilter();
        }
        
        // Re-render with current filters
        renderSongs();
      } else {
        allSongs = [];
        creators = [];
        populateCreatorFilter();
        renderSongs();
      }
    }, (error) => {
      console.error('Realtime listener error:', error);
    });
  }

  // ----- Event delegation for song card clicks -----
  songContainer.addEventListener('click', (e) => {
    const card = e.target.closest('.song-card');
    if (!card) return;
    
    const songId = card.dataset.id;
    const song = allSongs.find(s => s.id === songId);
    if (song) {
      // Dispatch custom event with song data for songs.js to handle
      const event = new CustomEvent('viewSong', { detail: { song } });
      document.dispatchEvent(event);
    }
  });

  // ----- THEME LOGIC -----
  function initTheme() {
    const stored = localStorage.getItem('lop-theme');
    if (stored === 'dark' || stored === 'light') {
      htmlElement.setAttribute('data-theme', stored);
    } else {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      htmlElement.setAttribute('data-theme', systemDark ? 'dark' : 'light');
      localStorage.setItem('lop-theme', 'system');
    }
  }

  function cycleTheme() {
    const current = htmlElement.getAttribute('data-theme');
    let newTheme = 'light';
    if (current === 'light') newTheme = 'dark';
    else if (current === 'dark') newTheme = 'system';
    else newTheme = 'light';

    if (newTheme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      htmlElement.setAttribute('data-theme', systemDark ? 'dark' : 'light');
      localStorage.setItem('lop-theme', 'system');
    } else {
      htmlElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('lop-theme', newTheme);
    }
  }

  // Event listeners
  searchInput.addEventListener('input', renderSongs);
  typeFilter.addEventListener('change', renderSongs);
  categoryFilter.addEventListener('change', renderSongs);
  creatorFilter.addEventListener('change', renderSongs);
  themeToggle.addEventListener('click', cycleTheme);

  document.getElementById('searchToggle').addEventListener('click', () => {
    searchInput.focus();
  });

  // System theme change listener
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (localStorage.getItem('lop-theme') === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      htmlElement.setAttribute('data-theme', systemDark ? 'dark' : 'light');
    }
  });

  // Initialize
  initTheme();
  
  // Load songs from Firebase
  loadSongsFromDatabase();
  
  // Set up real-time listener for updates
  setupRealtimeListener();
  
  console.log('Main.js initialization complete');
});