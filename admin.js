(() => {
  const cfg = window.BRYSS_SUPABASE || {};
  const $ = id => document.getElementById(id);

  const isSupabaseConfigured = 
    window.supabase && 
    cfg.url && 
    cfg.anonKey && 
    !cfg.url.includes("YOUR-PROJECT") && 
    !cfg.anonKey.includes("YOUR_SUPABASE");

  let client = null;
  let currentUser = null;
  let backendMode = 'local'; // 'local' (server.js), 'supabase', or 'demo' (localStorage)

  if (isSupabaseConfigured) {
    try {
      client = window.supabase.createClient(cfg.url, cfg.anonKey);
    } catch (e) {
      console.warn("Supabase client init error:", e);
    }
  }

  const message = (id, text, error = false) => {
    const el = $(id);
    if (!el) return;
    el.textContent = text;
    el.style.color = error ? "#e5a18b" : "#d7a36f";
  };

  // Switch to Dashboard View
  const showDashboard = async (user, mode = 'local') => {
    currentUser = user;
    backendMode = mode;

    const badge = $('backend-status-badge');
    if (mode === 'supabase') {
      badge.textContent = "CONNECTED TO SUPABASE CLOUD";
      badge.className = "mode-badge mode-badge-live";
    } else if (mode === 'local') {
      badge.textContent = "CONNECTED TO LOCAL NODE BACKEND";
      badge.className = "mode-badge mode-badge-live";
    } else {
      badge.textContent = "BROWSER LOCAL STORAGE (DEMO)";
      badge.className = "mode-badge mode-badge-demo";
    }

    $('login-panel').hidden = true;
    $('dashboard-panel').hidden = false;
    await loadArtworks();
  };

  // Detect available backend on load
  async function checkBackend() {
    if (isSupabaseConfigured && client) {
      const { data } = await client.auth.getSession();
      if (data && data.session) {
        return showDashboard(data.session.user, 'supabase');
      }
    }

    // Check if local Node API is reachable
    try {
      const test = await fetch('/api/artworks', { method: 'GET' });
      if (test.ok) {
        backendMode = 'local';
        // Auto-check stored local session
        const savedUser = sessionStorage.getItem('bryss_user');
        if (savedUser) {
          return showDashboard(JSON.parse(savedUser), 'local');
        }
        message('login-message', 'Local backend ready. Enter your password to sign in.');
        return;
      }
    } catch (e) {
      // Server not running, pure file:// open
      backendMode = 'demo';
      message('login-message', 'File preview detected. You can use Demo Mode below.');
    }
  }
  checkBackend();

  if (cfg.adminEmail && $('login-email') && !$('login-email').value) {
    $('login-email').value = cfg.adminEmail;
  }

  // 1. Sign In Form
  $('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    message('login-message', 'Signing in...');

    const email = $('login-email').value.trim();
    const password = $('login-password').value;

    if (backendMode === 'supabase' && isSupabaseConfigured && client) {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) return message('login-message', error.message, true);
      return showDashboard(data.user, 'supabase');
    }

    // Try Local Server Login
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      sessionStorage.setItem('bryss_user', JSON.stringify(data.user));
      return showDashboard(data.user, 'local');
    } catch (err) {
      // Fallback to demo mode if server isn't running
      if (backendMode === 'demo') {
        const demoUser = { email: email || 'artist@bryss.studio', name: 'Bryss' };
        sessionStorage.setItem('bryss_user', JSON.stringify(demoUser));
        return showDashboard(demoUser, 'demo');
      }
      message('login-message', err.message || 'Login failed', true);
    }
  });

  // 2. Demo Mode Launcher Button
  $('start-demo-btn').addEventListener('click', () => {
    const demoUser = { email: 'demo@bryss.studio', name: 'Bryss' };
    sessionStorage.setItem('bryss_user', JSON.stringify(demoUser));
    showDashboard(demoUser, 'demo');
  });

  // 3. Logout
  $('logout-button').addEventListener('click', async () => {
    sessionStorage.removeItem('bryss_user');
    if (client && backendMode === 'supabase') {
      await client.auth.signOut();
    }
    location.reload();
  });

  $('refresh-button').addEventListener('click', loadArtworks);
  $('cancel-edit').addEventListener('click', resetForm);

  // 4. Live Image Preview
  const artImageInput = $('art-image');
  const previewWrap = $('image-preview-wrap');
  const previewThumb = $('image-preview-thumb');

  artImageInput.addEventListener('change', () => {
    const file = artImageInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        previewThumb.src = e.target.result;
        previewWrap.classList.add('has-image');
      };
      reader.readAsDataURL(file);
    } else {
      previewWrap.classList.remove('has-image');
      previewThumb.src = '';
    }
  });

  // 5. Load Artworks
  async function loadArtworks() {
    $('artwork-list').innerHTML = '<p class="admin-muted">Loading artworks...</p>';
    let items = [];

    try {
      if (backendMode === 'supabase' && client) {
        const { data, error } = await client.from('artworks').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        items = data || [];
      } else if (backendMode === 'local') {
        const res = await fetch('/api/artworks');
        if (!res.ok) throw new Error('Failed to load from server');
        items = await res.json();
      } else {
        items = JSON.parse(localStorage.getItem('bryss_demo_artworks') || '[]');
      }
    } catch (err) {
      $('artwork-list').innerHTML = `<p class="admin-message" style="color:#e5a18b">Error: ${err.message}</p>`;
      return;
    }

    if (!items.length) {
      $('artwork-list').innerHTML = '<p class="admin-muted">No artworks found. Add your first project using the form on the left.</p>';
      return;
    }

    $('artwork-list').innerHTML = '';
    items.forEach(item => {
      const row = document.createElement('article');
      row.className = 'artwork-item';

      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.title;

      const info = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = item.title;
      const meta = document.createElement('p');
      meta.textContent = `${(item.category || '').toUpperCase()} · ${item.published ? 'PUBLISHED' : 'DRAFT'}`;
      meta.className = item.published ? 'status-published' : 'status-draft';
      info.append(title, meta);

      const actions = document.createElement('div');
      actions.className = 'item-actions';

      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => editArtwork(item));

      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.className = 'delete';
      delBtn.addEventListener('click', () => deleteArtwork(item));

      actions.append(editBtn, delBtn);
      row.append(img, info, actions);
      $('artwork-list').append(row);
    });
  }

  // 6. Save Artwork (Create / Update)
  $('artwork-form').addEventListener('submit', async e => {
    e.preventDefault();
    const id = $('artwork-id').value;
    const file = $('art-image').files[0];
    const save = $('save-artwork');

    save.disabled = true;
    message('form-message', 'Saving artwork...');

    try {
      let imageUrl = null;

      // Handle image upload if a file was selected
      if (file) {
        if (file.size > 10 * 1024 * 1024) throw new Error('Please choose an image smaller than 10 MB.');

        if (backendMode === 'supabase' && client) {
          const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
          const path = `${currentUser.id}/${crypto.randomUUID()}.${ext}`;
          const upload = await client.storage.from('artwork-images').upload(path, file, {
            upsert: false,
            contentType: file.type
          });
          if (upload.error) throw upload.error;
          imageUrl = client.storage.from('artwork-images').getPublicUrl(path).data.publicUrl;
        } else if (backendMode === 'local') {
          // Read base64 and upload to server
          const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = ev => resolve(ev.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Data, filename: file.name })
          });
          const uploadData = await uploadRes.json();
          if (!uploadRes.ok) throw new Error(uploadData.error || 'Image upload failed');
          imageUrl = uploadData.url;
        } else {
          // Demo mode: base64 direct
          imageUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = ev => resolve(ev.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }
      }

      const record = {
        title: $('art-title').value.trim(),
        category: $('art-category').value,
        description: $('art-description').value.trim(),
        video_url: $('art-video').value.trim() || null,
        published: $('art-published').checked
      };

      if (imageUrl) record.image_url = imageUrl;

      if (backendMode === 'supabase' && client) {
        if (id) {
          const result = await client.from('artworks').update(record).eq('id', id);
          if (result.error) throw result.error;
        } else {
          if (!imageUrl) throw new Error('Please choose an artwork image.');
          const result = await client.from('artworks').insert(record);
          if (result.error) throw result.error;
        }
      } else if (backendMode === 'local') {
        const method = id ? 'PUT' : 'POST';
        if (id) record.id = id;
        else if (!imageUrl) throw new Error('Please choose an artwork image.');

        const res = await fetch('/api/artworks', {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record)
        });
        const saved = await res.json();
        if (!res.ok) throw new Error(saved.error || 'Failed to save artwork');
      } else {
        // Demo Mode (localStorage)
        let items = JSON.parse(localStorage.getItem('bryss_demo_artworks') || '[]');
        if (id) {
          const idx = items.findIndex(x => x.id === id);
          if (idx !== -1) items[idx] = { ...items[idx], ...record };
        } else {
          if (!imageUrl) throw new Error('Please choose an artwork image.');
          record.id = 'demo-' + Date.now();
          record.created_at = new Date().toISOString();
          items.unshift(record);
        }
        localStorage.setItem('bryss_demo_artworks', JSON.stringify(items));
      }

      resetForm();
      message('form-message', 'Artwork saved successfully!');
      await loadArtworks();
    } catch (err) {
      message('form-message', err.message || 'Something went wrong.', true);
    } finally {
      save.disabled = false;
    }
  });

  // 7. Edit Artwork
  function editArtwork(item) {
    $('artwork-id').value = item.id;
    $('art-title').value = item.title;
    $('art-category').value = item.category;
    $('art-description').value = item.description || '';
    $('art-video').value = item.video_url || '';
    $('art-published').checked = item.published;

    $('art-image').required = false;
    if (item.image_url) {
      previewThumb.src = item.image_url;
      previewWrap.classList.add('has-image');
    }

    $('editor-heading').textContent = 'EDIT ARTWORK';
    $('save-artwork').innerHTML = 'Update artwork <span>↗</span>';
    $('cancel-edit').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 8. Reset Form
  function resetForm() {
    $('artwork-form').reset();
    $('artwork-id').value = '';
    $('art-image').required = false;
    previewWrap.classList.remove('has-image');
    previewThumb.src = '';
    $('editor-heading').textContent = 'ADD NEW ARTWORK';
    $('save-artwork').innerHTML = 'Save artwork <span>↗</span>';
    $('cancel-edit').hidden = true;
    message('form-message', '');
  }

  // 9. Delete Artwork
  async function deleteArtwork(item) {
    if (!confirm(`Delete “${item.title}”? This cannot be undone.`)) return;

    try {
      if (backendMode === 'supabase' && client) {
        const { error } = await client.from('artworks').delete().eq('id', item.id);
        if (error) throw error;
      } else if (backendMode === 'local') {
        const res = await fetch(`/api/artworks/${item.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete artwork');
      } else {
        let items = JSON.parse(localStorage.getItem('bryss_demo_artworks') || '[]');
        items = items.filter(x => x.id !== item.id);
        localStorage.setItem('bryss_demo_artworks', JSON.stringify(items));
      }

      message('form-message', 'Artwork deleted.');
      await loadArtworks();
    } catch (err) {
      message('form-message', err.message || 'Could not delete artwork.', true);
    }
  }
})();
