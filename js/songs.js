// js/songs.js
document.addEventListener('DOMContentLoaded', function() {
  console.log('Songs.js loaded');
  
  // Check if Firebase is initialized
  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded!');
    return;
  }

  // Get Firebase instances
  const auth = firebase.auth();
  const database = firebase.database();

  // DOM Elements
  const addSongBtn = document.getElementById('addSongBtn');
  const addSongModal = document.getElementById('addSongModal');
  const closeAddModal = document.getElementById('closeAddModal');
  const cancelAddSong = document.getElementById('cancelAddSong');
  const addSongForm = document.getElementById('addSongForm');
  const addSongError = document.getElementById('addSongError');
  
  const viewSongModal = document.getElementById('viewSongModal');
  const closeViewModal = document.getElementById('closeViewModal');
  
  const editSongModal = document.getElementById('editSongModal');
  const closeEditModal = document.getElementById('closeEditModal');
  const cancelEditSong = document.getElementById('cancelEditSong');
  const editSongForm = document.getElementById('editSongForm');
  const editSongError = document.getElementById('editSongError');
  
  const hasVoice = document.getElementById('hasVoice');
  const hasLink = document.getElementById('hasLink');
  const linkField = document.getElementById('linkField');
  const voiceField = document.getElementById('voiceField');
  
  const editHasVoice = document.getElementById('editHasVoice');
  const editHasLink = document.getElementById('editHasLink');
  const editLinkField = document.getElementById('editLinkField');
  
  const toast = document.getElementById('toast');

  let currentUser = null;
  let currentSong = null;

  // FAB scroll behavior
  const fab = document.getElementById('addSongBtn');
  let lastScrollTop = 0;
  const scrollThreshold = 10;

  function handleFabScroll() {
    if (!fab) return;
    
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    
    if (Math.abs(lastScrollTop - currentScroll) > scrollThreshold) {
      if (currentScroll > lastScrollTop && currentScroll > 50) {
        // Scrolling down - show text
        fab.classList.remove('scrolled-up');
      } else if (currentScroll < lastScrollTop) {
        // Scrolling up - hide text
        fab.classList.add('scrolled-up');
      }
    }
    
    // If at the very top, always show text
    if (currentScroll < 10) {
      fab.classList.remove('scrolled-up');
    }
    
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  }

  // Throttle scroll events for better performance
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleFabScroll();
        ticking = false;
      });
      ticking = true;
    }
  });

  // Initial check
  handleFabScroll();

  // Listen for auth state
  auth.onAuthStateChanged((user) => {
    currentUser = user;
  });

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

  // Toggle link/voice fields based on checkboxes
  if (hasVoice) {
    hasVoice.addEventListener('change', () => {
      voiceField.style.display = hasVoice.checked ? 'block' : 'none';
    });
  }

  if (hasLink) {
    hasLink.addEventListener('change', () => {
      linkField.style.display = hasLink.checked ? 'block' : 'none';
    });
  }

  if (editHasLink) {
    editHasLink.addEventListener('change', () => {
      editLinkField.style.display = editHasLink.checked ? 'block' : 'none';
    });
  }

  // Open add song modal
  if (addSongBtn) {
    addSongBtn.addEventListener('click', () => {
      if (!currentUser) {
        showToast('Please login to add songs', 3000, true);
        document.getElementById('loginBtn').click();
        return;
      }
      addSongModal.classList.add('show');
      document.body.style.overflow = 'hidden';
    });
  }

  // Close add song modal
  function closeAddModalFn() {
    addSongModal.classList.remove('show');
    document.body.style.overflow = '';
    addSongForm.reset();
    addSongError.textContent = '';
    linkField.style.display = 'none';
    voiceField.style.display = 'none';
  }

  if (closeAddModal) closeAddModal.addEventListener('click', closeAddModalFn);
  if (cancelAddSong) cancelAddSong.addEventListener('click', closeAddModalFn);

  // Close view modal
  function closeViewModalFn() {
    viewSongModal.classList.remove('show');
    document.body.style.overflow = '';
  }

  if (closeViewModal) closeViewModal.addEventListener('click', closeViewModalFn);

  // Close edit modal
  function closeEditModalFn() {
    editSongModal.classList.remove('show');
    document.body.style.overflow = '';
    editSongForm.reset();
    editSongError.textContent = '';
    editLinkField.style.display = 'none';
  }

  if (closeEditModal) closeEditModal.addEventListener('click', closeEditModalFn);
  if (cancelEditSong) cancelEditSong.addEventListener('click', closeEditModalFn);

  // Listen for custom viewSong event from main.js
  document.addEventListener('viewSong', (e) => {
    const song = e.detail.song;
    openViewModal(song);
  });

  // Open view modal with song details
  function openViewModal(song) {
    currentSong = song;
    
    document.getElementById('viewSongTitle').textContent = song.title;
    document.getElementById('viewSongKey').textContent = song.key;
    document.getElementById('viewSongType').textContent = song.type;
    document.getElementById('viewSongCategory').textContent = song.category;
    document.getElementById('viewSongCreator').textContent = song.creator;
    document.getElementById('viewSongDate').textContent = song.date;
    document.getElementById('viewSongLyrics').textContent = song.lyrics;
    
    const songActions = document.getElementById('songActions');
    if (currentUser && song.creatorId === currentUser.uid) {
      songActions.style.display = 'flex';
    } else {
      songActions.style.display = 'none';
    }
    
    const mediaDiv = document.getElementById('viewSongMedia');
    mediaDiv.innerHTML = '';
    
    if (song.hasVoice) {
      mediaDiv.innerHTML += '<div class="media-icon">🎤 Voice recording available</div>';
    }
    
    if (song.hasLink && song.link) {
      mediaDiv.innerHTML += `<div class="media-icon">🔗 <a href="${song.link}" target="_blank">External Link</a></div>`;
    } else if (song.hasLink) {
      mediaDiv.innerHTML += '<div class="media-icon">🔗 External link available</div>';
    }
    
    viewSongModal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  // Add song form submission
  if (addSongForm) {
    addSongForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!currentUser) {
        showToast('You must be logged in', 3000, true);
        return;
      }

      const title = document.getElementById('songTitle').value;
      const key = document.getElementById('songKey').value;
      const type = document.getElementById('songType').value;
      const category = document.getElementById('songCategory').value;
      const lyrics = document.getElementById('songLyrics').value;
      const hasVoiceChecked = hasVoice.checked;
      const hasLinkChecked = hasLink.checked;
      const link = document.getElementById('songLink').value;

      try {
        const songId = database.ref().child('songs').push().key;
        
        const songData = {
          id: songId,
          title: title,
          key: key,
          type: type,
          category: category,
          lyrics: lyrics,
          creator: currentUser.displayName || currentUser.email.split('@')[0],
          creatorId: currentUser.uid,
          date: new Date().toLocaleString(),
          hasVoice: hasVoiceChecked,
          hasLink: hasLinkChecked
        };

        if (hasLinkChecked && link) {
          songData.link = link;
        }

        await database.ref('songs/' + songId).set(songData);
        
        closeAddModalFn();
        showToast('✅ Song added successfully!');
        
      } catch (error) {
        console.error('Error adding song:', error);
        addSongError.textContent = 'Error adding song: ' + error.message;
      }
    });
  }

  // Edit song button
  const editSongBtn = document.getElementById('editSongBtn');
  if (editSongBtn) {
    editSongBtn.addEventListener('click', () => {
      if (!currentSong) return;
      
      document.getElementById('editSongId').value = currentSong.id;
      document.getElementById('editSongTitle').value = currentSong.title;
      document.getElementById('editSongKey').value = currentSong.key;
      document.getElementById('editSongType').value = currentSong.type;
      document.getElementById('editSongCategory').value = currentSong.category;
      document.getElementById('editSongLyrics').value = currentSong.lyrics;
      editHasVoice.checked = currentSong.hasVoice || false;
      editHasLink.checked = currentSong.hasLink || false;
      
      if (currentSong.hasLink && currentSong.link) {
        document.getElementById('editSongLink').value = currentSong.link;
        editLinkField.style.display = 'block';
      }
      
      closeViewModalFn();
      editSongModal.classList.add('show');
    });
  }

  // Delete song button
  const deleteSongBtn = document.getElementById('deleteSongBtn');
  if (deleteSongBtn) {
    deleteSongBtn.addEventListener('click', async () => {
      if (!currentSong || !currentUser || currentSong.creatorId !== currentUser.uid) {
        showToast('You can only delete your own songs', 3000, true);
        return;
      }
      
      if (confirm('Are you sure you want to delete this song?')) {
        try {
          await database.ref('songs/' + currentSong.id).remove();
          closeViewModalFn();
          showToast('✅ Song deleted successfully');
        } catch (error) {
          console.error('Error deleting song:', error);
          showToast('Error deleting song', 3000, true);
        }
      }
    });
  }

  // Edit song form submission
  if (editSongForm) {
    editSongForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!currentUser || !currentSong || currentSong.creatorId !== currentUser.uid) {
        showToast('You can only edit your own songs', 3000, true);
        return;
      }

      const songId = document.getElementById('editSongId').value;
      const title = document.getElementById('editSongTitle').value;
      const key = document.getElementById('editSongKey').value;
      const type = document.getElementById('editSongType').value;
      const category = document.getElementById('editSongCategory').value;
      const lyrics = document.getElementById('editSongLyrics').value;
      const hasVoiceChecked = editHasVoice.checked;
      const hasLinkChecked = editHasLink.checked;
      const link = document.getElementById('editSongLink').value;

      try {
        const songData = {
          id: songId,
          title: title,
          key: key,
          type: type,
          category: category,
          lyrics: lyrics,
          creator: currentSong.creator,
          creatorId: currentUser.uid,
          date: currentSong.date,
          hasVoice: hasVoiceChecked,
          hasLink: hasLinkChecked
        };

        if (hasLinkChecked && link) {
          songData.link = link;
        }

        await database.ref('songs/' + songId).update(songData);
        
        closeEditModalFn();
        showToast('✅ Song updated successfully!');
        
      } catch (error) {
        console.error('Error updating song:', error);
        editSongError.textContent = 'Error updating song: ' + error.message;
      }
    });
  }

  // Click outside to close modals
  [addSongModal, viewSongModal, editSongModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          if (modal === addSongModal) closeAddModalFn();
          if (modal === viewSongModal) closeViewModalFn();
          if (modal === editSongModal) closeEditModalFn();
        }
      });
    }
  });

  // Escape key to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (addSongModal && addSongModal.classList.contains('show')) closeAddModalFn();
      if (viewSongModal && viewSongModal.classList.contains('show')) closeViewModalFn();
      if (editSongModal && editSongModal.classList.contains('show')) closeEditModalFn();
    }
  });

  console.log('Songs.js initialization complete');
});