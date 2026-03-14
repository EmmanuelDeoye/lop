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
  const sortFilter = document.getElementById('sortFilter');
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
  if (!songContainer || !emptyMessage || !searchInput || !typeFilter || !categoryFilter || !creatorFilter || !sortFilter || !themeToggle) {
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

  // ----- Helper function to escape HTML and prevent XSS -----
  function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ----- Format date for display -----
  function formatDate(dateValue, timestamp) {
    if (timestamp) {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      }
    }
    return dateValue || 'Unknown date';
  }

  // ----- Sort helper function -----
  function sortSongs(songs, sortBy) {
    const sortedSongs = [...songs];
    
    switch(sortBy) {
      case 'latest':
        // Sort by date (newest first)
        return sortedSongs.sort((a, b) => {
          // If no timestamp, put at the end
          if (!a.timestamp && !b.timestamp) return 0;
          if (!a.timestamp) return 1;
          if (!b.timestamp) return -1;
          
          return b.timestamp - a.timestamp; // Descending (newest first)
        });
      
      case 'oldest':
        // Sort by date (oldest first)
        return sortedSongs.sort((a, b) => {
          if (!a.timestamp && !b.timestamp) return 0;
          if (!a.timestamp) return 1;
          if (!b.timestamp) return -1;
          
          return a.timestamp - b.timestamp; // Ascending (oldest first)
        });
      
      case 'az':
        // Sort by title A-Z
        return sortedSongs.sort((a, b) => {
          const titleA = (a.title || '').toLowerCase();
          const titleB = (b.title || '').toLowerCase();
          return titleA.localeCompare(titleB);
        });
      
      case 'za':
        // Sort by title Z-A
        return sortedSongs.sort((a, b) => {
          const titleA = (a.title || '').toLowerCase();
          const titleB = (b.title || '').toLowerCase();
          return titleB.localeCompare(titleA);
        });
      
      default:
        return sortedSongs;
    }
  }

  // ----- Update sort indicator on grid -----
  function updateSortIndicator(sortBy) {
    songContainer.setAttribute('data-sort', sortBy);
  }

  // ----- render cards based on filters and sort -----
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
    const sortVal = sortFilter.value;

    // First filter the songs
    let filtered = allSongs.filter(song => {
      const matchesSearch = searchTerm === '' ||
        song.title.toLowerCase().includes(searchTerm) ||
        (song.lyrics && song.lyrics.toLowerCase().includes(searchTerm)) ||
        (song.creator && song.creator.toLowerCase().includes(searchTerm));
      
      const matchesType = typeVal === 'all' || song.type === typeVal;
      const matchesCategory = catVal === 'all' || song.category === catVal;
      const matchesCreator = creatorVal === 'all' || (song.creator && song.creator === creatorVal);

      return matchesSearch && matchesType && matchesCategory && matchesCreator;
    });

    // Then sort the filtered songs
    filtered = sortSongs(filtered, sortVal);
    
    // Update sort indicator
    updateSortIndicator(sortVal);

    hideLoading();

    if (filtered.length === 0) {
      songContainer.innerHTML = '';
      emptyMessage.classList.remove('hidden');
      
      // Add a more helpful empty message based on filters
      if (searchTerm || typeVal !== 'all' || catVal !== 'all' || creatorVal !== 'all') {
        emptyMessage.innerHTML = `
          <p>No songs match your filters</p>
          <p class="empty-sub">Try adjusting your search or filter criteria</p>
        `;
      } else {
        emptyMessage.innerHTML = `
          <p>No songs added yet</p>
          <p class="empty-sub">Be the first to contribute!</p>
        `;
      }
    } else {
      emptyMessage.classList.add('hidden');
      songContainer.innerHTML = filtered.map(song => {
        const lyricsShort = song.lyrics ? 
          song.lyrics.split('\n').slice(0,2).join(' ').substring(0,70) + '…' : 
          'No lyrics available';
        
        // Format date for display
        const displayDate = formatDate(song.date, song.timestamp);
        
        // Escape all user-generated content
        const escapedTitle = escapeHtml(song.title);
        const escapedKey = escapeHtml(song.key);
        const escapedType = escapeHtml(song.type);
        const escapedCategory = escapeHtml(song.category);
        const escapedLyrics = escapeHtml(lyricsShort);
        const escapedCreator = escapeHtml(song.creator);
        const escapedDate = escapeHtml(displayDate);
        
        return `
          <article class="song-card" data-id="${song.id}" data-creator="${song.creatorId || ''}" data-date="${song.timestamp || ''}">
            <div class="card-header">
              <h3 class="card-title">${escapedTitle}</h3>
              <div class="card-badges">
                <span class="badge-key">${escapedKey}</span>
                <span class="badge-type">${escapedType}</span>
                <span class="badge-cat">${escapedCategory}</span>
              </div>
            </div>
            <div class="card-lyrics-preview">${escapedLyrics}</div>
            <div class="card-footer">
              <span>✍️ ${escapedCreator} · ${escapedDate}</span>
              <div class="meta-icons">
                ${song.hasVoice ? '<span title="Has voice recording">🎤</span>' : ''}
                ${song.hasLink ? '<span title="Has external link">🔗</span>' : ''}
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
        // Convert object to array and ensure each song has an id and timestamp
        allSongs = Object.entries(songs).map(([id, song]) => {
          // Ensure we have a timestamp for sorting
          let timestamp = song.timestamp;
          if (!timestamp && song.date) {
            // Try to convert date string to timestamp
            const parsedDate = new Date(song.date).getTime();
            timestamp = isNaN(parsedDate) ? Date.now() : parsedDate;
          } else if (!timestamp) {
            timestamp = Date.now(); // Default to current time if no date
          }
          
          return {
            id: id,
            ...song,
            timestamp: timestamp // Add normalized timestamp for sorting
          };
        });
        
        // Update creators list
        updateCreators(allSongs);
        
        // Set default sort to 'latest'
        sortFilter.value = 'latest';
        
        // Render songs
        renderSongs();
      } else {
        allSongs = [];
        creators = [];
        populateCreatorFilter();
        hideLoading();
        songContainer.innerHTML = '';
        emptyMessage.classList.remove('hidden');
        emptyMessage.innerHTML = `
          <p>No songs added yet</p>
          <p class="empty-sub">Be the first to contribute!</p>
        `;
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
        // Store current sort value
        const currentSort = sortFilter.value;
        
        allSongs = Object.entries(songs).map(([id, song]) => {
          // Ensure timestamp exists
          let timestamp = song.timestamp;
          if (!timestamp && song.date) {
            const parsedDate = new Date(song.date).getTime();
            timestamp = isNaN(parsedDate) ? Date.now() : parsedDate;
          } else if (!timestamp) {
            timestamp = Date.now();
          }
          
          return {
            id: id,
            ...song,
            timestamp: timestamp
          };
        });
        
        // Update creators list (only if they've changed)
        const newCreators = [...new Set(allSongs.map(s => s.creator))];
        if (JSON.stringify(creators) !== JSON.stringify(newCreators)) {
          creators = newCreators;
          populateCreatorFilter();
        }
        
        // Restore sort value (in case it was changed)
        sortFilter.value = currentSort;
        
        // Re-render with current filters and sort
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

  // ----- Event Listeners -----
  searchInput.addEventListener('input', renderSongs);
  typeFilter.addEventListener('change', renderSongs);
  categoryFilter.addEventListener('change', renderSongs);
  creatorFilter.addEventListener('change', renderSongs);
  sortFilter.addEventListener('change', renderSongs);

  // Search toggle button
  document.getElementById('searchToggle').addEventListener('click', () => {
    searchInput.focus();
  });

  // Theme toggle
  themeToggle.addEventListener('click', cycleTheme);

  // System theme change listener
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (localStorage.getItem('lop-theme') === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      htmlElement.setAttribute('data-theme', systemDark ? 'dark' : 'light');
    }
  });

  // Keyboard shortcut for sort (press 's' to focus sort dropdown)
  document.addEventListener('keydown', (e) => {
    // Check if not typing in an input
    if (e.key === 's' && !e.ctrlKey && !e.metaKey && !e.target.matches('input, textarea, select')) {
      e.preventDefault();
      sortFilter.focus();
    }
    
    // Keyboard shortcut for search (press '/' to focus search)
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.target.matches('input, textarea, select')) {
      e.preventDefault();
      searchInput.focus();
    }
  });

  // Add tooltip for sort filter (optional)
  sortFilter.addEventListener('focus', () => {
    console.log('Sort by: ' + sortFilter.options[sortFilter.selectedIndex].text);
  });

  // Log when sort changes (useful for debugging)
  sortFilter.addEventListener('change', () => {
    const selectedOption = sortFilter.options[sortFilter.selectedIndex];
    console.log(`Sorting by: ${selectedOption.text}`);
  });

  // Initialize theme
  initTheme();
  
  // Load songs from Firebase
  loadSongsFromDatabase();
  
  // Set up real-time listener for updates
  setupRealtimeListener();
  
  console.log('Main.js initialization complete');
});

// Export for use in other modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { escapeHtml, formatDate, sortSongs };
}
