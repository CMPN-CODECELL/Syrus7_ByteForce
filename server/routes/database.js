import express from 'express';
import { getDB } from '../db.js';

const router = express.Router();

// Security middleware: Protect database internal endpoints from unauthorized inspection
router.use((req, res, next) => {
  const adminSecret = process.env.CAMPUSLY_ADMIN_SECRET || 'campusly-admin-secure-key';
  const providedSecret = req.headers['x-admin-secret'] || req.query.admin_secret;
  
  if (!providedSecret || providedSecret !== adminSecret) {
    return res.status(403).json({ 
      error: 'Access denied: Database explorer requires administrator authorization. Pass x-admin-secret header.' 
    });
  }
  
  next();
});

// GET /api/database/overview - returns database stats and all collection counts
router.get('/overview', async (req, res) => {
  try {
    const db = getDB();
    const collectionsList = await db.listCollections().toArray();
    const stats = [];

    for (const c of collectionsList) {
      const count = await db.collection(c.name).countDocuments();
      stats.push({ name: c.name, count });
    }

    res.json({
      database: db.databaseName,
      status: 'Connected & Active',
      collections: stats,
    });
  } catch (error) {
    console.error('Error fetching database overview:', error);
    res.status(500).json({ error: 'Failed to inspect MongoDB' });
  }
});

// GET /api/database/collections/:name - returns documents from a collection
router.get('/collections/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const limit = parseInt(req.query.limit || '50', 10);
    const db = getDB();

    const docs = await db.collection(name)
      .find({})
      .sort({ _id: -1 })
      .limit(limit)
      .toArray();

    const total = await db.collection(name).countDocuments();

    res.json({
      collection: name,
      total,
      limit,
      documents: docs,
    });
  } catch (error) {
    console.error(`Error querying collection ${req.params.name}:`, error);
    res.status(500).json({ error: 'Failed to retrieve documents' });
  }
});

// GET /api/database/view - Built-in interactive Web GUI for MongoDB
router.get('/view', async (req, res) => {
  try {
    const db = getDB();
    const collectionsList = await db.listCollections().toArray();
    const collectionsWithCounts = [];

    for (const c of collectionsList) {
      const count = await db.collection(c.name).countDocuments();
      collectionsWithCounts.push({ name: c.name, count });
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Campusly - MongoDB Database Explorer</title>
  <link rel="icon" href="/campusly-logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;600&family=Manrope:wght@700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --surface: #101726;
      --surface-2: #172238;
      --border: #233352;
      --text: #f0f4fc;
      --muted: #8ea1c1;
      --accent: #ff5a00;
      --green: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'DM Sans', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand img {
      width: 32px;
      height: 32px;
      object-fit: contain;
    }
    .brand h1 {
      font-family: 'Manrope', sans-serif;
      font-size: 19px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .brand span {
      color: var(--accent);
    }
    .uri-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      padding: 6px 12px;
      border-radius: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #93c5fd;
    }
    .copy-btn {
      background: var(--accent);
      color: white;
      border: 0;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
    }
    .layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      flex: 1;
    }
    aside {
      background: var(--surface);
      border-right: 1px solid var(--border);
      padding: 20px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .sidebar-title {
      font-size: 11px;
      font-weight: 700;
      color: var(--muted);
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 10px;
      padding-left: 8px;
    }
    .col-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 8px;
      padding: 10px 12px;
      color: var(--text);
      font-size: 13px;
      font-weight: 600;
      text-align: left;
      cursor: pointer;
      transition: all 0.15s;
    }
    .col-btn:hover {
      background: var(--surface-2);
    }
    .col-btn.active {
      background: var(--surface-2);
      border-color: var(--accent);
      color: #fff;
    }
    .count-tag {
      background: rgba(255, 90, 0, 0.15);
      color: var(--accent);
      font-size: 11px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 10px;
    }
    main {
      padding: 24px 30px;
      overflow-y: auto;
    }
    .main-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }
    .main-header h2 {
      font-family: 'Manrope', sans-serif;
      font-size: 22px;
      font-weight: 800;
    }
    .doc-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 14px;
    }
    .doc-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 11px;
      color: var(--muted);
      font-family: 'JetBrains Mono', monospace;
    }
    pre {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      background: #080c14;
      padding: 14px;
      border-radius: 8px;
      overflow-x: auto;
      color: #e2e8f0;
      line-height: 1.5;
    }
    .empty-banner {
      padding: 60px 20px;
      text-align: center;
      color: var(--muted);
      background: var(--surface);
      border: 1px dashed var(--border);
      border-radius: 14px;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--green);
      display: inline-block;
      margin-right: 6px;
    }
    @media (max-width: 768px) {
      .layout { grid-template-columns: 1fr; }
      aside { border-right: 0; border-bottom: 1px solid var(--border); }
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <img src="/campusly-logo.png" alt="Campusly Logo">
      <h1>CAMPUSLY <span>Database Explorer</span></h1>
    </div>
    <div class="uri-badge">
      <span class="status-dot"></span>
      <span>Connected to ${db.databaseName}</span>
    </div>
  </header>

  <div class="layout">
    <aside>
      <div class="sidebar-title">MongoDB Collections</div>
      <div id="collectionsList">
        ${collectionsWithCounts.map((c, i) => `
          <button class="col-btn ${i === 0 ? 'active' : ''}" onclick="selectCollection('${c.name}', this)">
            <span>${c.name}</span>
            <span class="count-tag" id="tag-${c.name}">${c.count}</span>
          </button>
        `).join('')}
      </div>
    </aside>

    <main>
      <div class="main-header">
        <div>
          <h2 id="activeColName">Select Collection</h2>
          <p id="activeColMeta" style="color: var(--muted); font-size: 12px; margin-top: 4px;">Loading data...</p>
        </div>
        <button class="copy-btn" onclick="refreshCurrent()" style="padding: 7px 14px; font-size: 12px;">Refresh</button>
      </div>

      <div id="docsContainer"></div>
    </main>
  </div>

  <script>
    let activeCollection = '${collectionsWithCounts[0]?.name || 'posts'}';

    async function selectCollection(name, btn) {
      activeCollection = name;
      document.querySelectorAll('.col-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      document.getElementById('activeColName').innerText = name;
      await loadCollectionDocs(name);
    }

    async function loadCollectionDocs(name) {
      const container = document.getElementById('docsContainer');
      const meta = document.getElementById('activeColMeta');
      container.innerHTML = '<p style=\"color: var(--muted);\">Loading records from MongoDB...</p>';

      try {
        const res = await fetch('/api/database/collections/' + encodeURIComponent(name));
        const data = await res.json();
        meta.innerText = data.total + ' total document(s) in collection';
        const tag = document.getElementById('tag-' + name);
        if (tag) tag.innerText = data.total;

        if (!data.documents || data.documents.length === 0) {
          container.innerHTML = '<div class=\"empty-banner\"><h3>Collection is empty</h3><p style=\"margin-top: 6px; font-size: 12px;\">No documents yet. Items created in Campusly will show up here live.</p></div>';
          return;
        }

        container.innerHTML = data.documents.map((doc, idx) => {
          return '<div class=\"doc-card\">' +
            '<div class=\"doc-meta\"><span>#' + (idx + 1) + ' · ID: ' + (doc._id || 'N/A') + '</span><span>' + (doc.createdAt ? new Date(doc.createdAt).toLocaleString() : '') + '</span></div>' +
            '<pre>' + JSON.stringify(doc, null, 2) + '</pre>' +
          '</div>';
        }).join('');
      } catch (err) {
        container.innerHTML = '<p style=\"color: #ef4444;\">Error loading records: ' + err.message + '</p>';
      }
    }

    function refreshCurrent() {
      if (activeCollection) loadCollectionDocs(activeCollection);
    }

    // Initial load
    if (activeCollection) {
      document.getElementById('activeColName').innerText = activeCollection;
      loadCollectionDocs(activeCollection);
    }
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Error rendering database view:', error);
    res.status(500).send('Failed to render database viewer');
  }
});

export default router;
