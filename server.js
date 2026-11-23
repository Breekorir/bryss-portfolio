// ==============================================================================
// BRYSS PORTFOLIO - ZERO-DEPENDENCY LOCAL NODE SERVER
// ==============================================================================
// No npm install needed! Runs directly with: node server.js
// ==============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const UPLOADS_DIR = path.join(ROOT_DIR, 'assets', 'uploads');
const DB_FILE = path.join(DATA_DIR, 'artworks.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Initial seed artworks
const DEFAULT_ARTWORKS = [
  {
    id: "art-1",
    title: "The Commander",
    category: "murals",
    description: "Expressive mixed-media portrait featuring newspaper collage, burnt distressing, military insignia, and bold painted contours.",
    image_url: "assets/portrait-general-mixed-media.jpg",
    video_url: null,
    published: true,
    created_at: new Date().toISOString()
  },
  {
    id: "art-2",
    title: "Character in denim",
    category: "sculpture",
    description: "Hand-crafted custom painted denim artwork featuring custom One Piece anime iconography, blending fashion with wearable pop-art expression.",
    image_url: "assets/one-piece-denim-art.jpeg",
    video_url: null,
    published: true,
    created_at: new Date().toISOString()
  },
  {
    id: "art-3",
    title: "Studio Practice — Behind the Canvas",
    category: "photography",
    description: "Bryss captured in the studio during the initial hand-drawn sketch and compositional phase of the Marley canvas.",
    image_url: "assets/bryss-in-studio-sketching.jpg",
    video_url: null,
    published: true,
    created_at: new Date().toISOString()
  },
  {
    id: "art-4",
    title: "CHUNGAA — Music Video",
    category: "film",
    description: "Official music video direction, cinematography and editing for Mr Dope's 'Chungaa' - captured and directed by SHOTSBYBRYSS.",
    image_url: "assets/chungaa-video.png",
    video_url: "https://www.youtube.com/results?search_query=Mr+Dope+Chungaa+Bryss",
    published: true,
    created_at: new Date().toISOString()
  }
];

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_ARTWORKS, null, 2), 'utf-8');
}

function getArtworks() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveArtworks(items) {
  fs.writeFileSync(DB_FILE, JSON.stringify(items, null, 2), 'utf-8');
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = reqUrl.pathname;

  // JSON Body Parser helper
  const readJson = callback => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        callback(null, parsed);
      } catch (err) {
        callback(err, null);
      }
    });
  };

  // ================= API ROUTES =================

  // 1. Artist Login
  if (pathname === '/api/login' && req.method === 'POST') {
    return readJson((err, data) => {
      if (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Invalid JSON request' }));
      }
      // Simple default password: "bryss" or any password provided
      const email = data.email || 'artist@bryss.studio';
      const password = data.password || '';

      if (password.length < 3) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Password must be at least 3 characters' }));
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        user: { email: email, name: 'Bryss' },
        token: 'token-' + crypto.randomUUID()
      }));
    });
  }

  // 2. Image Upload (Base64)
  if (pathname === '/api/upload' && req.method === 'POST') {
    return readJson((err, data) => {
      if (err || !data.image || !data.filename) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Invalid upload payload' }));
      }

      try {
        const matches = data.image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        const ext = matches ? (matches[1] === 'jpeg' ? 'jpg' : matches[1]) : (path.extname(data.filename).slice(1) || 'jpg');
        const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(data.image, 'base64');
        const filename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
        const filePath = path.join(UPLOADS_DIR, filename);

        fs.writeFileSync(filePath, buffer);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ url: `assets/uploads/${filename}` }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Failed to save image' }));
      }
    });
  }

  // 3. Get Artworks
  if (pathname === '/api/artworks' && req.method === 'GET') {
    const list = getArtworks();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(list));
  }

  // 4. Create Artwork
  if (pathname === '/api/artworks' && req.method === 'POST') {
    return readJson((err, data) => {
      if (err || !data.title || !data.image_url) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Title and image are required' }));
      }

      const list = getArtworks();
      const newArtwork = {
        id: 'art-' + Date.now(),
        title: data.title.trim(),
        category: data.category || 'murals',
        description: data.description || '',
        image_url: data.image_url,
        video_url: data.video_url || null,
        published: typeof data.published === 'boolean' ? data.published : true,
        created_at: new Date().toISOString()
      };

      list.unshift(newArtwork);
      saveArtworks(list);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(newArtwork));
    });
  }

  // 5. Update Artwork
  if (pathname === '/api/artworks' && req.method === 'PUT') {
    return readJson((err, data) => {
      if (err || !data.id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Artwork ID is required' }));
      }

      const list = getArtworks();
      const index = list.findIndex(x => x.id === data.id);
      if (index === -1) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Artwork not found' }));
      }

      list[index] = {
        ...list[index],
        title: data.title ? data.title.trim() : list[index].title,
        category: data.category || list[index].category,
        description: data.description !== undefined ? data.description : list[index].description,
        image_url: data.image_url || list[index].image_url,
        video_url: data.video_url !== undefined ? data.video_url : list[index].video_url,
        published: typeof data.published === 'boolean' ? data.published : list[index].published
      };

      saveArtworks(list);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(list[index]));
    });
  }

  // 6. Delete Artwork
  if (pathname.startsWith('/api/artworks/') && req.method === 'DELETE') {
    const id = pathname.split('/')[3];
    let list = getArtworks();
    const initialLen = list.length;
    list = list.filter(x => x.id !== id);

    if (list.length === initialLen) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Artwork not found' }));
    }

    saveArtworks(list);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true }));
  }

  // ================= STATIC FILE SERVING =================
  let safePath = pathname === '/' ? '/index.html' : pathname;
  let filePath = path.join(ROOT_DIR, safePath);

  // Security check: prevent directory traversal
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 BRYSS PORTFOLIO SERVER RUNNING`);
  console.log(`👉 Public Website:  http://localhost:${PORT}`);
  console.log(`👉 Artist Dashboard: http://localhost:${PORT}/admin.html`);
  console.log(`======================================================\n`);
});
