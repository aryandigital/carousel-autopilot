// ============================================
// Dashboard Frontend Logic
// ============================================

// ── State ──
let polling = null;

// ── On Load ──
document.addEventListener('DOMContentLoaded', () => {
    refreshStatus();
    loadOutputs();
    setInterval(refreshStatus, 5000);
});

// ── API Helpers ──
async function api(method, url, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    return res.json();
}

// ── Refresh Status ──
async function refreshStatus() {
    try {
        const data = await api('GET', '/api/status');
        updateStatusBadge(data);
        updateStats(data);
        updateHistory(data.history || []);

        if (data.running) {
            disableButtons(true);
        } else {
            disableButtons(false);
        }
    } catch (err) {
        console.error('Status refresh failed:', err);
    }
}

function updateStatusBadge(data) {
    const badge = document.getElementById('status-badge');
    const text = document.getElementById('status-text');

    badge.className = 'badge';
    if (data.running) {
        badge.classList.add('badge-running');
        text.innerHTML = '<span class="spinner"></span> Running...';
    } else if (data.lastResult?.status === 'completed') {
        badge.classList.add('badge-success');
        text.textContent = 'Completed';
    } else if (data.lastResult?.status === 'failed') {
        badge.classList.add('badge-failed');
        text.textContent = 'Failed';
    } else {
        badge.classList.add('badge-idle');
        text.textContent = 'Idle';
    }
}

function updateStats(data) {
    const history = data.history || [];
    document.getElementById('stat-total').textContent = history.length;
    document.getElementById('stat-success').textContent = history.filter(h => h.status === 'completed').length;
    document.getElementById('stat-slides').textContent = history.reduce((sum, h) => sum + (h.slideCount || 0), 0);
    document.getElementById('stat-last').textContent = data.lastRun
        ? new Date(data.lastRun).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
        : 'Never';
}

function updateHistory(history) {
    const tbody = document.getElementById('history-body');
    if (!history.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="dim" style="text-align:center;padding:2rem">No runs yet</td></tr>';
        return;
    }

    tbody.innerHTML = history.map(h => `
    <tr>
      <td>${new Date(h.timestamp?.replace(/-/g, (m, i) => i > 9 ? ':' : m) || '').toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) || h.timestamp}</td>
      <td>${escHtml(h.topic || '—')}</td>
      <td style="max-width: 250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">${escHtml(h.hook || '—')}</td>
      <td>${h.slideCount || '—'}</td>
      <td class="status-${h.status}">${h.status === 'completed' ? '✅ Done' : '❌ Failed'}</td>
      <td>${h.outputDir ? '<a href="/output/' + h.timestamp + '/carousel.pdf" target="_blank" class="btn btn-sm btn-ghost">📄 PDF</a>' : '—'}</td>
    </tr>
  `).join('');
}

// ── Trigger Generate (Dry Run) ──
async function triggerGenerate() {
    if (confirm('Start generating a carousel? (Dry run — will NOT post to LinkedIn)')) {
        addLog('🚀 Starting carousel generation (dry run)...', 'step');
        disableButtons(true);

        try {
            await api('POST', '/api/generate');
            startPolling();
        } catch (err) {
            addLog('❌ Failed to start: ' + err.message, 'error');
            disableButtons(false);
        }
    }
}

// ── Trigger Publish (Live) ──
async function triggerPublish() {
    if (confirm('⚠️ This will generate AND post a carousel to your LinkedIn profile. Continue?')) {
        addLog('🔴 Starting LIVE pipeline — will post to LinkedIn...', 'step');
        disableButtons(true);

        try {
            await api('POST', '/api/publish');
            startPolling();
        } catch (err) {
            addLog('❌ Failed to start: ' + err.message, 'error');
            disableButtons(false);
        }
    }
}

// ── Preview Trends ──
async function previewTrends() {
    switchTab(document.querySelector('[data-tab="trends"]'), 'trends');
    const list = document.getElementById('trends-list');
    list.innerHTML = '<div class="empty-state"><div class="spinner"></div><p>Scanning Reddit & Medium...</p></div>';

    try {
        const data = await api('GET', '/api/trends');
        const trends = data.trends || [];

        if (!trends.length) {
            list.innerHTML = '<div class="empty-state"><p>No trends found — check internet connection</p></div>';
            return;
        }

        list.innerHTML = trends.map((t, i) => `
      <div class="trend-item">
        <div class="trend-rank">${i + 1}</div>
        <div>
          <div class="trend-title">${escHtml(t.title)}</div>
          <div class="trend-meta">${escHtml(t.meta || t.source)} · Score: ${t.engagement || '—'}</div>
        </div>
      </div>
    `).join('');
    } catch (err) {
        list.innerHTML = `<div class="empty-state"><p style="color:var(--red)">Error: ${escHtml(err.message)}</p></div>`;
    }
}

// ── Load Outputs ──
async function loadOutputs() {
    try {
        const data = await api('GET', '/api/outputs');
        const gallery = document.getElementById('gallery');
        const outputs = data.outputs || [];

        if (!outputs.length) {
            gallery.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><p>No carousels yet</p></div>';
            return;
        }

        gallery.innerHTML = outputs.slice(0, 6).map(o => {
            const thumb = o.slides?.[0] || '';
            const topic = o.copy?.topic || 'Untitled';
            const slideCount = o.copy?.slides?.length || 0;

            return `
        <div class="gallery-card" onclick="window.open('${o.pdfUrl}', '_blank')">
          ${thumb ? `<img src="${thumb}" alt="${escHtml(topic)}" loading="lazy">` : '<div style="width:100%;height:100%;background:var(--bg-secondary)"></div>'}
          <div class="overlay">
            <div class="topic">${escHtml(topic)}</div>
            <div class="meta">${slideCount} slides</div>
            <div class="gallery-actions">
              <a href="${o.pdfUrl}" target="_blank" onclick="event.stopPropagation()">📄 PDF</a>
            </div>
          </div>
        </div>
      `;
        }).join('');
    } catch (err) {
        console.error('Failed to load outputs:', err);
    }
}

// ── Polling ──
function startPolling() {
    if (polling) clearInterval(polling);
    polling = setInterval(async () => {
        const data = await api('GET', '/api/status');
        if (!data.running) {
            clearInterval(polling);
            polling = null;
            disableButtons(false);
            loadOutputs();

            if (data.lastResult?.status === 'completed') {
                addLog('✅ Pipeline completed!', 'success');
                addLog(`   Output: ${data.lastResult?.outputDir || 'check output folder'}`, 'info');
            } else {
                addLog('❌ Pipeline failed: ' + (data.lastResult?.error || 'Unknown error'), 'error');
            }
        }
        refreshStatus();
    }, 3000);
}

// ── UI Helpers ──
function addLog(message, type = '') {
    const log = document.getElementById('pipeline-log');
    // Clear empty state
    const emptyState = log.querySelector('.empty-state');
    if (emptyState) log.innerHTML = '';

    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
}

function disableButtons(disabled) {
    document.getElementById('btn-generate').disabled = disabled;
    document.getElementById('btn-publish').disabled = disabled;
}

function switchTab(el, tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => { t.style.display = 'none'; t.classList.remove('active'); });

    el.classList.add('active');
    const content = document.getElementById(`tab-${tabId}`);
    if (content) { content.style.display = 'block'; content.classList.add('active'); }
}

function escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}
