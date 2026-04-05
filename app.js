/* ═══════════════════════════════════════════════════════════
   ResearchPulse — app.js
   Fetches top 15 AI/ML papers from arXiv and renders them.
   ═══════════════════════════════════════════════════════════ */

'use strict';

// ── Config ──────────────────────────────────────────────────
const CONFIG = {
  maxResults: 15,
  apiBase: 'https://export.arxiv.org/api/query',
  proxyBase: 'https://api.allorigins.win/raw?url=', // CORS proxy fallback
  categories: {
    all: 'cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CV+OR+cat:cs.CL+OR+cat:stat.ML',
    'cs.AI': 'cat:cs.AI',
    'cs.LG': 'cat:cs.LG',
    'cs.CV': 'cat:cs.CV',
    'cs.CL': 'cat:cs.CL',
    'stat.ML': 'cat:stat.ML',
  },
  tagColors: {
    'cs.AI':   'tag-ai',
    'cs.LG':   'tag-lg',
    'cs.CV':   'tag-cv',
    'cs.CL':   'tag-cl',
    'stat.ML': 'tag-stat',
  },
  tagLabels: {
    'cs.AI':   'AI',
    'cs.LG':   'ML',
    'cs.CV':   'CV',
    'cs.CL':   'NLP',
    'stat.ML': 'Stats·ML',
    'cs.RO':   'Robotics',
    'cs.NE':   'Neural Evol',
    'cs.IR':   'Info Retrieval',
  },
};

// ── State ────────────────────────────────────────────────────
let state = {
  papers: [],
  filtered: [],
  currentCategory: 'all',
  searchQuery: '',
  sortOrder: 'date',
  loading: false,
};

// ── DOM Refs ─────────────────────────────────────────────────
const dom = {
  loadingState: document.getElementById('loadingState'),
  errorState:   document.getElementById('errorState'),
  errorMsg:     document.getElementById('errorMsg'),
  papersGrid:   document.getElementById('papersGrid'),
  emptyState:   document.getElementById('emptyState'),
  paperCount:   document.getElementById('paperCount'),
  statCount:    document.getElementById('statCount'),
  statDate:     document.getElementById('statDate'),
  searchInput:  document.getElementById('searchInput'),
  sortSelect:   document.getElementById('sortSelect'),
  refreshBtn:   document.getElementById('refreshBtn'),
  retryBtn:     document.getElementById('retryBtn'),
  navTabs:      document.getElementById('navTabs'),
  modalOverlay: document.getElementById('modalOverlay'),
  modal:        document.getElementById('modal'),
  modalClose:   document.getElementById('modalClose'),
  modalContent: document.getElementById('modalContent'),
};

// ── ArXiv API ────────────────────────────────────────────────
async function fetchPapers(category = 'all') {
  const query = CONFIG.categories[category] || CONFIG.categories.all;
  const sortBy = state.sortOrder === 'relevance' ? 'relevance' : 'submittedDate';
  const url = `${CONFIG.apiBase}?search_query=${query}&start=0&max_results=${CONFIG.maxResults}&sortBy=${sortBy}&sortOrder=descending`;

  // Try direct first, then proxy
  const urls = [url, `${CONFIG.proxyBase}${encodeURIComponent(url)}`];

  for (const endpoint of urls) {
    try {
      const res = await fetch(endpoint, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      return parseArxivXML(xml);
    } catch (err) {
      if (endpoint === urls[urls.length - 1]) throw err;
    }
  }
}

function parseArxivXML(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  const entries = [...doc.querySelectorAll('entry')];

  return entries.map((entry, idx) => {
    const id      = entry.querySelector('id')?.textContent?.trim() || '';
    const title   = entry.querySelector('title')?.textContent?.replace(/\s+/g, ' ').trim() || 'Untitled';
    const summary = entry.querySelector('summary')?.textContent?.replace(/\s+/g, ' ').trim() || '';
    const published = entry.querySelector('published')?.textContent?.trim() || '';
    const updated  = entry.querySelector('updated')?.textContent?.trim() || '';
    const authors  = [...entry.querySelectorAll('author name')].map(n => n.textContent.trim());
    const categories = [...entry.querySelectorAll('category')].map(c => c.getAttribute('term'));

    // Build links
    const links = [...entry.querySelectorAll('link')];
    const absLink = links.find(l => l.getAttribute('rel') === 'alternate')?.getAttribute('href') || id;
    const pdfLink = links.find(l => l.getAttribute('title') === 'pdf')?.getAttribute('href') ||
                    id.replace('abs', 'pdf');

    // Extract arXiv ID short form
    const arxivId = id.split('/abs/').pop() || id.split('/').pop() || '';

    return {
      index: idx + 1,
      id,
      arxivId,
      title,
      summary,
      abstract: summary,
      published: published ? new Date(published) : null,
      updated:   updated   ? new Date(updated)   : null,
      authors,
      categories: categories.filter(c =>
        Object.keys(CONFIG.categories).includes(c) ||
        Object.keys(CONFIG.tagLabels).includes(c)
      ).slice(0, 5),
      absLink,
      pdfLink: pdfLink.startsWith('http') ? pdfLink : `https://arxiv.org/pdf/${arxivId}`,
    };
  });
}

// ── Summarization (smart excerpt) ────────────────────────────
function generateSummary(abstract) {
  // Extract first 2-3 meaningful sentences as summary
  const sentences = abstract
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 30 && s.length < 400);

  return sentences.slice(0, 3).join(' ');
}

function extractKeyPoints(abstract) {
  // Pull out sentences that contain key research signals
  const signals = [
    /we propose|we present|we introduce|we develop/i,
    /outperform|surpass|state.of.the.art|sota|benchmark/i,
    /novel|new approach|first|significant/i,
    /result|achieve|demonstrate|show that/i,
    /dataset|experiment|evaluat/i,
  ];

  const sentences = abstract
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 40);

  const keyPoints = [];
  for (const sig of signals) {
    const match = sentences.find(s => sig.test(s) && !keyPoints.includes(s));
    if (match && keyPoints.length < 4) keyPoints.push(match);
  }

  // Fallback: just first N sentences
  if (keyPoints.length < 2) {
    return sentences.slice(0, 3);
  }

  return keyPoints.slice(0, 4);
}

// ── Rendering ─────────────────────────────────────────────────
function formatDate(date) {
  if (!date) return 'Unknown';
  return date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatDateShort(date) {
  if (!date) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function buildCategoryTags(categories) {
  if (!categories.length) {
    return `<span class="category-tag tag-other">Research</span>`;
  }
  return categories.slice(0, 3).map(cat => {
    const colorClass = CONFIG.tagColors[cat] || 'tag-other';
    const label = CONFIG.tagLabels[cat] || cat.split('.').pop().toUpperCase();
    return `<span class="category-tag ${colorClass}">${label}</span>`;
  }).join('');
}

function buildPaperCard(paper) {
  const summary = generateSummary(paper.abstract);
  const authorsDisplay = paper.authors.length > 3
    ? `<strong>${paper.authors[0]}</strong>, ${paper.authors[1]}, +${paper.authors.length - 2} more`
    : paper.authors.map((a, i) => i === 0 ? `<strong>${a}</strong>` : a).join(', ');

  return `
    <article class="paper-card" data-id="${paper.arxivId}" id="card-${paper.arxivId}" role="button" tabindex="0"
             aria-label="Open paper: ${paper.title.replace(/"/g, '&quot;')}">
      <div class="card-header">
        <div class="card-index">#${String(paper.index).padStart(2, '0')}</div>
        <div class="card-meta">
          <span class="card-date">${formatDateShort(paper.published)}</span>
        </div>
        <div class="card-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 17 17 7M17 7H7M17 7v10"/>
          </svg>
        </div>
      </div>

      <div class="category-tags">${buildCategoryTags(paper.categories)}</div>

      <h2 class="card-title">${escapeHtml(paper.title)}</h2>

      <div class="card-authors">${authorsDisplay}</div>

      <div>
        <div class="summary-label">
          <div class="summary-label-dot"></div>
          Summary
        </div>
        <p class="card-summary">${escapeHtml(summary)}</p>
      </div>

      <div class="card-footer">
        <div class="card-links">
          <a class="card-link card-link-arxiv" href="${paper.absLink}" target="_blank" rel="noopener"
             onclick="event.stopPropagation()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            arXiv
          </a>
          <a class="card-link card-link-pdf" href="${paper.pdfLink}" target="_blank" rel="noopener"
             onclick="event.stopPropagation()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            PDF
          </a>
        </div>
        <span class="card-read-more">
          Read more
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </span>
      </div>
    </article>
  `;
}

function buildModalContent(paper) {
  const keyPoints = extractKeyPoints(paper.abstract);
  const authorsDisplay = paper.authors.join(', ');

  return `
    <div class="modal-badge-row">
      ${buildCategoryTags(paper.categories)}
      <span class="category-tag tag-other" style="font-family:var(--font-mono)">#${String(paper.index).padStart(2,'0')} · ${paper.arxivId}</span>
    </div>

    <h2 class="modal-title">${escapeHtml(paper.title)}</h2>

    <p class="modal-authors">
      <strong>Authors:</strong> ${escapeHtml(authorsDisplay)}
    </p>

    <p class="modal-date">
      Published: ${formatDate(paper.published)}
      ${paper.updated && paper.updated.getTime() !== paper.published?.getTime()
        ? ` · Updated: ${formatDate(paper.updated)}` : ''}
    </p>

    ${keyPoints.length > 0 ? `
    <div class="modal-section-title">Key Insights</div>
    <div class="modal-key-points">
      <ul>
        ${keyPoints.map(p => `
          <li>
            <span class="key-bullet"></span>
            <span>${escapeHtml(p)}</span>
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    <div class="modal-section-title">Full Abstract</div>
    <p class="modal-abstract">${escapeHtml(paper.abstract)}</p>

    <div class="modal-section-title">Access Paper</div>
    <div class="modal-links-row">
      <a class="modal-action-btn modal-action-btn-primary" href="${paper.absLink}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        View on arXiv
      </a>
      <a class="modal-action-btn modal-action-btn-secondary" href="${paper.pdfLink}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
        </svg>
        Download PDF
      </a>
    </div>
  `;
}

function renderPapers(papers) {
  if (!papers.length) {
    show(dom.emptyState);
    hide(dom.papersGrid);
    dom.paperCount.textContent = '0 papers';
    return;
  }

  hide(dom.emptyState);
  show(dom.papersGrid);
  dom.paperCount.textContent = `${papers.length} paper${papers.length !== 1 ? 's' : ''}`;

  dom.papersGrid.innerHTML = papers.map(buildPaperCard).join('');

  // Stagger animation
  const cards = dom.papersGrid.querySelectorAll('.paper-card');
  cards.forEach((card, i) => {
    card.style.animationDelay = `${i * 0.06}s`;
  });

  // Attach click listeners
  cards.forEach(card => {
    card.addEventListener('click', () => openModal(card.dataset.id));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') openModal(card.dataset.id);
    });
  });
}

// ── Modal ─────────────────────────────────────────────────────
function openModal(arxivId) {
  const paper = state.papers.find(p => p.arxivId === arxivId);
  if (!paper) return;

  dom.modalContent.innerHTML = buildModalContent(paper);
  dom.modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  dom.modalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

// ── Filtering & Search ────────────────────────────────────────
function applyFilters() {
  let papers = [...state.papers];

  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    papers = papers.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.abstract.toLowerCase().includes(q) ||
      p.authors.some(a => a.toLowerCase().includes(q)) ||
      p.arxivId.toLowerCase().includes(q)
    );
  }

  state.filtered = papers;
  renderPapers(papers);
}

// ── State Management ──────────────────────────────────────────
function setLoading(yes) {
  state.loading = yes;
  if (yes) {
    show(dom.loadingState);
    hide(dom.errorState);
    hide(dom.papersGrid);
    hide(dom.emptyState);
    dom.refreshBtn.classList.add('spinning');
    dom.paperCount.textContent = 'loading…';
    dom.statCount.textContent = '—';
    dom.statDate.textContent = '—';
  } else {
    hide(dom.loadingState);
    dom.refreshBtn.classList.remove('spinning');
  }
}

function setError(msg) {
  hide(dom.loadingState);
  hide(dom.papersGrid);
  show(dom.errorState);
  dom.errorMsg.textContent = msg;
  dom.statCount.textContent = '!';
  dom.statDate.textContent = 'Error';
}

function setSuccess(papers) {
  state.papers = papers.map((p, i) => ({ ...p, index: i + 1 }));
  dom.statCount.textContent = String(papers.length);
  dom.statDate.textContent = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });
  applyFilters();
}

// ── Main Fetch ─────────────────────────────────────────────────
async function loadPapers() {
  if (state.loading) return;
  setLoading(true);

  try {
    const papers = await fetchPapers(state.currentCategory);
    setLoading(false);
    setSuccess(papers);
  } catch (err) {
    setLoading(false);
    console.error('arXiv fetch failed:', err);
    setError(`Could not load papers: ${err.message}. The arXiv API may be temporarily unavailable or your network may be blocking the request.`);
  }
}

// ── Event Listeners ───────────────────────────────────────────
dom.navTabs.addEventListener('click', (e) => {
  const tab = e.target.closest('.nav-tab');
  if (!tab) return;

  [...dom.navTabs.querySelectorAll('.nav-tab')].forEach(t => t.classList.remove('active'));
  tab.classList.add('active');

  state.currentCategory = tab.dataset.category;
  loadPapers();
});

dom.searchInput.addEventListener('input', (e) => {
  state.searchQuery = e.target.value.trim();
  applyFilters();
});

dom.sortSelect.addEventListener('change', (e) => {
  state.sortOrder = e.target.value;
  loadPapers();
});

dom.refreshBtn.addEventListener('click', loadPapers);
dom.retryBtn.addEventListener('click', loadPapers);

dom.modalClose.addEventListener('click', closeModal);
dom.modalOverlay.addEventListener('click', (e) => {
  if (e.target === dom.modalOverlay) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    dom.searchInput.focus();
  }
});

// ── Helpers ────────────────────────────────────────────────────
function show(el) { if (el) el.classList.remove('hidden'); }
function hide(el) { if (el) el.classList.add('hidden');    }

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Init ───────────────────────────────────────────────────────
loadPapers();
