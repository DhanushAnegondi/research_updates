'use strict';

const CONFIG = {
  maxResults: 30,
  storageKey: 'researchpulse:saved-items:v1',
  themeStorageKey: 'researchpulse:theme:v1',
  apiBase: '/api',
  sections: {
    papers: {
      title: 'Research Papers',
      subtitle: 'Live from arXiv',
      defaultFilter: 'all',
      mode: 'stack',
    },
    topics: {
      title: 'Hot Topics',
      subtitle: 'Live Reddit discussions',
      defaultFilter: 'MachineLearning',
      mode: 'stack',
    },
    releases: {
      title: 'New Releases',
      subtitle: 'Live web release tracking',
      defaultFilter: 'all',
      mode: 'feed',
    },
    dataeng: {
      title: 'Data Engineering',
      subtitle: 'Live systems, tools, and infra updates',
      defaultFilter: 'papers',
      mode: 'stack',
    },
  },
  filterLabels: {
    papers: {
      all: 'All Fields',
      'cs.AI': 'Artificial Intelligence',
      'cs.LG': 'Machine Learning',
      'cs.CV': 'Computer Vision',
      'cs.CL': 'NLP & Language',
      'cs.RO': 'Robotics',
      'cs.NE': 'Neural Computation',
      'stat.ML': 'Statistical ML',
    },
    topics: {
      MachineLearning: 'r/MachineLearning',
      LocalLLaMA: 'r/LocalLLaMA',
      artificial: 'r/artificial',
      singularity: 'r/singularity',
      datascience: 'r/datascience',
    },
    releases: {
      all: 'All Companies',
      openai: 'OpenAI',
      anthropic: 'Anthropic / Claude',
      google: 'Google DeepMind',
      mistral: 'Mistral',
      meta: 'Meta AI',
      huggingface: 'HuggingFace',
      xai: 'xAI / Grok',
      kimi: 'Kimi / Moonshot',
      minimax: 'MiniMax',
      glm: 'GLM / Zhipu',
      nvidia: 'NVIDIA Research',
      microsoft: 'Microsoft Research',
    },
    dataeng: {
      papers: 'Research Papers',
      tools: 'Tools & Stack',
      sysdesign: 'System Design',
      news: 'News & Trends',
    },
  },
  tagLabels: {
    'cs.AI': 'AI',
    'cs.LG': 'ML',
    'cs.CV': 'CV',
    'cs.CL': 'NLP',
    'cs.RO': 'Robotics',
    'cs.NE': 'Neural',
    'stat.ML': 'Stats ML',
  },
};

const state = {
  activeSection: 'papers',
  activeFilters: {
    papers: 'all',
    topics: 'MachineLearning',
    releases: 'all',
    dataeng: 'papers',
  },
  searchQuery: '',
  currentItems: [],
  stackIndex: 0,
  currentDetailId: null,
  savedIds: new Set(loadSavedIds()),
  requestToken: 0,
  itemCache: new Map(),
};

const dom = {
  navSections: [...document.querySelectorAll('.nav-section-item')],
  searchToggle: document.getElementById('searchToggle'),
  searchBarWrapper: document.getElementById('searchBarWrapper'),
  searchInput: document.getElementById('searchInput'),
  savedBtn: document.getElementById('savedBtn'),
  savedCount: document.getElementById('savedCount'),
  themeToggle: document.getElementById('themeToggle'),
  themeToggleLabel: document.getElementById('themeToggleLabel'),
  sectionTitle: document.getElementById('sectionTitle'),
  sectionSubtitle: document.getElementById('sectionSubtitle'),
  itemCounter: document.getElementById('itemCounter'),
  stateLoading: document.getElementById('stateLoading'),
  loaderLabel: document.getElementById('loaderLabel'),
  stateError: document.getElementById('stateError'),
  errorMsg: document.getElementById('errorMsg'),
  errorSub: document.getElementById('errorSub'),
  retryBtn: document.getElementById('retryBtn'),
  stackStage: document.getElementById('stackStage'),
  stackContainer: document.getElementById('stackContainer'),
  ctrlSkip: document.getElementById('ctrlSkip'),
  ctrlSave: document.getElementById('ctrlSave'),
  progressFill: document.getElementById('progressFill'),
  progressLabel: document.getElementById('progressLabel'),
  releasesFeed: document.getElementById('releasesFeed'),
  stateEmpty: document.getElementById('stateEmpty'),
  emptyRetry: document.getElementById('emptyRetry'),
  detailOverlay: document.getElementById('detailOverlay'),
  detailContent: document.getElementById('detailContent'),
  detailClose: document.getElementById('detailClose'),
  detailSaveBtn: document.getElementById('detailSaveBtn'),
  detailExtLink: document.getElementById('detailExtLink'),
  savedOverlay: document.getElementById('savedOverlay'),
  savedClose: document.getElementById('savedClose'),
  savedList: document.getElementById('savedList'),
};

function loadSavedIds() {
  try {
    const raw = localStorage.getItem(CONFIG.storageKey);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

function persistSavedIds() {
  localStorage.setItem(CONFIG.storageKey, JSON.stringify([...state.savedIds]));
}

function getStoredTheme() {
  const stored = localStorage.getItem(CONFIG.themeStorageKey);
  return stored === 'light' || stored === 'dark' ? stored : 'dark';
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  localStorage.setItem(CONFIG.themeStorageKey, theme);
  dom.themeToggleLabel.textContent = theme === 'light' ? 'Dark' : 'Light';
}

function toggleTheme() {
  applyTheme(document.body.dataset.theme === 'light' ? 'dark' : 'light');
}

function show(el) {
  if (el) el.classList.remove('hidden');
}

function hide(el) {
  if (el) el.classList.add('hidden');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatShortDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function splitSentences(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(part => part.trim())
    .filter(Boolean);
}

function generateSummary(text, sentenceCount = 3) {
  return splitSentences(text).slice(0, sentenceCount).join(' ') || String(text || '');
}

function extractHighlights(text, fallback = []) {
  const sentences = splitSentences(text).filter(sentence => sentence.length >= 40);
  return sentences.slice(0, 4).length ? sentences.slice(0, 4) : fallback.slice(0, 4);
}

function normalizeParagraphs(text) {
  return String(text || '')
    .split(/\n{2,}/)
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => `<p>${escapeHtml(part)}</p>`)
    .join('');
}

function labelForTag(tag) {
  return CONFIG.tagLabels[tag] || tag;
}

function getFilterLabel(section, filter) {
  return CONFIG.filterLabels[section]?.[filter] || filter;
}

function buildNarrative(item) {
  if (item.abstract && item.abstract.trim().length > 220) return item.abstract;
  const summary = item.summary || '';
  const highlights = (item.highlights || []).join(' ');
  const tags = (item.tags || []).length ? `Tracked themes: ${(item.tags || []).map(labelForTag).join(', ')}.` : '';
  return [summary, highlights, tags].filter(Boolean).join('\n\n');
}

function getCardSummary(item) {
  const sentenceCount = item.section === 'papers' ? 4 : 3;
  return generateSummary(buildNarrative(item), sentenceCount);
}

function cacheItems(items) {
  items.forEach(item => {
    state.itemCache.set(item.id, item);
  });
}

function getAllKnownItems() {
  return [...state.itemCache.values(), ...state.currentItems];
}

function findItemById(id) {
  return getAllKnownItems().find(item => item.id === id) || null;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function fetchSectionItems(section, filter) {
  const params = new URLSearchParams({
    filter,
    limit: String(CONFIG.maxResults),
  });
  const { items } = await fetchJson(`${CONFIG.apiBase}/${section}?${params.toString()}`);
  return Array.isArray(items) ? items : [];
}

function getFilteredItems(items) {
  const query = state.searchQuery.trim().toLowerCase();
  if (!query) return items;

  return items.filter(item => {
    const haystack = [
      item.title,
      item.summary,
      item.abstract,
      item.company,
      item.source,
      buildNarrative(item),
      ...(item.authors || []),
      ...(item.tags || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });
}

function setLoading(label) {
  show(dom.stateLoading);
  hide(dom.stateError);
  hide(dom.stateEmpty);
  hide(dom.stackStage);
  hide(dom.releasesFeed);
  dom.loaderLabel.textContent = label;
}

function setError(message, submessage) {
  hide(dom.stateLoading);
  hide(dom.stackStage);
  hide(dom.releasesFeed);
  hide(dom.stateEmpty);
  show(dom.stateError);
  dom.errorMsg.textContent = message;
  dom.errorSub.textContent = submessage;
  dom.itemCounter.textContent = 'Error';
}

function clearStates() {
  hide(dom.stateLoading);
  hide(dom.stateError);
  hide(dom.stateEmpty);
}

function updateHeader() {
  const section = state.activeSection;
  const filter = state.activeFilters[section];
  dom.sectionTitle.textContent = CONFIG.sections[section].title;
  dom.sectionSubtitle.textContent = `${CONFIG.sections[section].subtitle} · ${getFilterLabel(section, filter)}`;
}

function updateCounter() {
  if (CONFIG.sections[state.activeSection].mode === 'feed') {
    dom.itemCounter.textContent = `${state.currentItems.length} items`;
    return;
  }
  const total = state.currentItems.length;
  const current = Math.min(state.stackIndex + 1, total);
  dom.itemCounter.textContent = total ? `${current} of ${total}` : '0 items';
}

function renderProgress() {
  const total = state.currentItems.length;
  if (!total) {
    dom.progressFill.style.width = '0%';
    dom.progressLabel.textContent = '0 / 0';
    return;
  }
  const completed = Math.min(state.stackIndex, total);
  const current = Math.min(state.stackIndex + 1, total);
  dom.progressFill.style.width = `${(completed / total) * 100}%`;
  dom.progressLabel.textContent = `${current} / ${total}`;
}

function buildTag(label, accent = false) {
  return `<span class="${accent ? 'card-tag card-tag-accent' : 'card-tag'}">${escapeHtml(label)}</span>`;
}

function buildStackCardMarkup(item) {
  const tags = (item.tags || []).slice(0, 3).map(tag => buildTag(labelForTag(tag), true)).join('');
  const byline = (item.authors || []).length ? item.authors.join(', ') : (item.source || item.company || 'ResearchPulse');
  const savedLabel = state.savedIds.has(item.id) ? 'Saved' : 'Ready to save';

  return `
    <div class="swipe-indicators">
      <div class="swipe-label-skip">Skip</div>
      <div class="swipe-label-save">Save</div>
    </div>
    <div class="card-meta-row">
      <div class="card-tags">
        ${buildTag(item.source || item.company || CONFIG.sections[item.section].title)}
        ${tags}
      </div>
      <div class="card-number">${escapeHtml(formatShortDate(item.published))}</div>
    </div>
    <h2 class="card-title">${escapeHtml(item.title)}</h2>
    <div class="card-authors">${escapeHtml(byline)}</div>
    <div class="card-divider"></div>
    <div class="card-teaser-label">Summary</div>
    <p class="card-teaser">${escapeHtml(getCardSummary(item))}</p>
    <div class="card-footer">
      <div class="card-date">${escapeHtml(savedLabel)}</div>
      <div class="card-expand-hint">Press Enter to expand</div>
    </div>
  `;
}

function attachCardInteractions(card, item) {
  let pointerId = null;
  let startX = 0;
  let currentX = 0;
  const indicators = card.querySelector('.swipe-indicators');

  const updateTransform = deltaX => {
    card.style.transform = `translateX(${deltaX}px) rotate(${deltaX / 18}deg)`;
    indicators.style.opacity = String(Math.min(Math.abs(deltaX) / 90, 1));
  };

  const resetCard = () => {
    card.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
    card.style.transform = 'translateX(0) rotate(0deg)';
    indicators.style.opacity = '0';
    window.setTimeout(() => { card.style.transition = ''; }, 220);
  };

  card.addEventListener('pointerdown', event => {
    pointerId = event.pointerId;
    startX = event.clientX;
    currentX = 0;
    card.setPointerCapture(pointerId);
  });

  card.addEventListener('pointermove', event => {
    if (pointerId !== event.pointerId) return;
    currentX = event.clientX - startX;
    updateTransform(currentX);
  });

  card.addEventListener('pointerup', event => {
    if (pointerId !== event.pointerId) return;
    card.releasePointerCapture(pointerId);
    pointerId = null;
    if (Math.abs(currentX) > 120) {
      handleStackAction(currentX > 0 ? 'save' : 'skip');
      return;
    }
    resetCard();
  });

  card.addEventListener('pointercancel', resetCard);
  card.addEventListener('click', event => {
    if (Math.abs(currentX) > 6) return;
    if (event.target.closest('a, button')) return;
    openDetail(item.id);
  });
  card.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openDetail(item.id);
    }
  });
  card.tabIndex = 0;
}

function renderStack() {
  const items = state.currentItems.slice(state.stackIndex);
  dom.stackContainer.innerHTML = '';

  if (!items.length) {
    hide(dom.stackStage);
    show(dom.stateEmpty);
    updateCounter();
    renderProgress();
    return;
  }

  hide(dom.stateEmpty);
  show(dom.stackStage);
  items.slice(0, 3).reverse().forEach((item, reverseIndex, subset) => {
    const depth = subset.length - 1 - reverseIndex;
    const card = document.createElement('article');
    card.className = 'swipe-card';
    card.dataset.id = item.id;
    card.dataset.depth = String(depth);
    card.style.transform = `scale(${1 - depth * 0.03}) translateY(${depth * 12}px)`;
    card.style.zIndex = String(20 - depth);
    card.style.animation = `cardAppear 0.25s ${depth * 0.03}s both`;
    card.style.touchAction = 'pan-y';
    card.innerHTML = buildStackCardMarkup(item);
    dom.stackContainer.appendChild(card);
    if (depth === 0) attachCardInteractions(card, item);
  });

  updateCounter();
  renderProgress();
}

function colorForCompany(company) {
  const map = {
    OpenAI: '#00D9FF',
    'Anthropic / Claude': '#FF9F1C',
    'Google DeepMind': '#4ADE80',
    Mistral: '#F97316',
    'Meta AI': '#60A5FA',
    HuggingFace: '#FACC15',
    'xAI / Grok': '#F87171',
    'Microsoft Research': '#38BDF8',
    'NVIDIA Research': '#A3E635',
  };
  return map[company] || '#888888';
}

function buildReleaseMarkup(groups) {
  return groups.map(group => `
    <section class="company-group">
      <div class="company-header">
        <div class="company-header-dot" style="background:${escapeHtml(colorForCompany(group.company))}"></div>
        <div class="company-header-name">${escapeHtml(group.company)}</div>
        <div class="company-header-count">${group.items.length} items</div>
      </div>
      ${group.items.map(item => `
        <article class="release-item" data-id="${escapeHtml(item.id)}">
          <div class="release-date-col">
            <div class="release-date">${escapeHtml(formatDate(item.published))}</div>
          </div>
          <div class="release-content">
            <h3 class="release-title">${escapeHtml(item.title)}</h3>
            <p class="release-excerpt">${escapeHtml(item.summary)}</p>
          </div>
          <div class="release-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M7 17 17 7M17 7H7M17 7v10"/>
            </svg>
          </div>
        </article>
      `).join('')}
    </section>
  `).join('');
}

function renderFeed() {
  if (!state.currentItems.length) {
    hide(dom.releasesFeed);
    show(dom.stateEmpty);
    updateCounter();
    return;
  }

  const groupsMap = new Map();
  state.currentItems.forEach(item => {
    const key = item.company || item.source || 'ResearchPulse';
    if (!groupsMap.has(key)) groupsMap.set(key, []);
    groupsMap.get(key).push(item);
  });

  const groups = [...groupsMap.entries()].map(([company, items]) => ({ company, items }));
  dom.releasesFeed.innerHTML = buildReleaseMarkup(groups);
  dom.releasesFeed.querySelectorAll('.release-item').forEach(node => {
    node.addEventListener('click', () => openDetail(node.dataset.id));
  });
  hide(dom.stateEmpty);
  show(dom.releasesFeed);
  updateCounter();
}

async function loadSection() {
  const section = state.activeSection;
  const filter = state.activeFilters[section];
  const requestToken = ++state.requestToken;
  updateHeader();
  closeAllDropdowns();
  setLoading(section === 'papers' ? 'Fetching live research papers…' : 'Loading live updates…');

  try {
    const items = await fetchSectionItems(section, filter);
    if (requestToken !== state.requestToken) return;
    cacheItems(items);
    state.currentItems = getFilteredItems(items);
    state.stackIndex = 0;
    clearStates();

    if (CONFIG.sections[section].mode === 'feed') {
      hide(dom.stackStage);
      renderFeed();
    } else {
      hide(dom.releasesFeed);
      renderStack();
    }
  } catch (error) {
    console.error(error);
    setError(
      `Could not load ${CONFIG.sections[section].title.toLowerCase()}`,
      `${error.message}. Start the local server with \`npm start\` so the live proxy endpoints are available.`
    );
  }
}

function buildDetailMarkup(item) {
  const detailBody = buildNarrative(item);
  const highlights = extractHighlights(detailBody, item.highlights || []);
  const tags = (item.tags || []).map(tag => `<span class="detail-tag">${escapeHtml(labelForTag(tag))}</span>`).join('');
  const meta = item.section === 'papers'
    ? escapeHtml(item.itemId || item.id)
    : escapeHtml(item.source || item.company || item.section);

  return `
    <div class="detail-source-bar">
      <span class="detail-tag">${escapeHtml(CONFIG.sections[item.section].title)}</span>
      ${item.company ? `<span class="detail-tag">${escapeHtml(item.company)}</span>` : ''}
      ${tags}
      <span class="detail-id">${meta}</span>
    </div>
    <h1 class="detail-title">${escapeHtml(item.title)}</h1>
    <p class="detail-authors"><strong>Source:</strong> ${escapeHtml((item.authors || []).join(', ') || item.source || item.company || 'ResearchPulse')}</p>
    <p class="detail-date">Published ${escapeHtml(formatDate(item.published))}${item.updated ? ` · Updated ${escapeHtml(formatDate(item.updated))}` : ''}</p>
    <section class="detail-section">
      <div class="detail-section-label accent">What Matters</div>
      <ul class="detail-contributions">
        ${highlights.map((highlight, index) => `
          <li>
            <span class="contrib-marker">${index + 1}</span>
            <span>${escapeHtml(highlight)}</span>
          </li>
        `).join('')}
      </ul>
    </section>
    <div class="detail-callout">${escapeHtml(item.summary || detailBody)}</div>
    <section class="detail-section">
      <div class="detail-section-label">Full Context</div>
      <div class="detail-body">${normalizeParagraphs(detailBody)}</div>
    </section>
  `;
}

function updateDetailActions(item) {
  const saved = state.savedIds.has(item.id);
  dom.detailSaveBtn.classList.toggle('saved', saved);
  dom.detailSaveBtn.innerHTML = `
    <svg viewBox="0 0 20 20" fill="none"><path d="M5 3h10a1 1 0 0 1 1 1v13l-6-3-6 3V4a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.5"/></svg>
    ${saved ? 'Saved' : 'Save item'}
  `;
  dom.detailExtLink.href = item.link || item.pdfLink || '#';
  dom.detailExtLink.textContent = item.link && item.link !== '#' ? 'Open Source ↗' : 'Reference';
}

function openDetail(itemId) {
  const item = findItemById(itemId);
  if (!item) return;
  state.currentDetailId = itemId;
  dom.detailContent.innerHTML = buildDetailMarkup(item);
  updateDetailActions(item);
  show(dom.detailOverlay);
  document.body.style.overflow = 'hidden';
}

function closeDetail() {
  hide(dom.detailOverlay);
  state.currentDetailId = null;
  document.body.style.overflow = '';
}

function toggleSave(itemId) {
  if (!itemId) return;
  if (state.savedIds.has(itemId)) state.savedIds.delete(itemId);
  else state.savedIds.add(itemId);

  persistSavedIds();
  dom.savedCount.textContent = String(state.savedIds.size);
  renderSavedList();

  if (state.currentDetailId === itemId) {
    const item = findItemById(itemId);
    if (item) updateDetailActions(item);
  }
  if (CONFIG.sections[state.activeSection].mode === 'stack') renderStack();
}

function renderSavedList() {
  const items = [...state.savedIds]
    .map(id => findItemById(id))
    .filter(Boolean)
    .sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());

  if (!items.length) {
    dom.savedList.innerHTML = `
      <div class="saved-empty">
        <p>No saved items yet.</p>
        <p>Use Save on any live card to keep it here.</p>
      </div>
    `;
    return;
  }

  dom.savedList.innerHTML = items.map(item => `
    <article class="saved-item" data-id="${escapeHtml(item.id)}">
      <div class="saved-item-title">${escapeHtml(item.title)}</div>
      <div class="saved-item-meta">${escapeHtml(CONFIG.sections[item.section].title)} · ${escapeHtml(formatDate(item.published))}</div>
    </article>
  `).join('');

  dom.savedList.querySelectorAll('.saved-item').forEach(node => {
    node.addEventListener('click', () => {
      openDetail(node.dataset.id);
      hide(dom.savedOverlay);
    });
  });
}

function openSavedPanel() {
  renderSavedList();
  show(dom.savedOverlay);
}

function closeSavedPanel() {
  hide(dom.savedOverlay);
}

function handleStackAction(action) {
  const item = state.currentItems[state.stackIndex];
  if (!item) return;
  if (action === 'save') toggleSave(item.id);
  state.stackIndex += 1;
  renderStack();
}

function closeAllDropdowns() {
  dom.navSections.forEach(node => node.classList.remove('dropdown-open'));
}

function setActiveSection(section) {
  state.activeSection = section;
  dom.navSections.forEach(node => {
    node.classList.toggle('active', node.dataset.section === section);
  });
  loadSection();
}

function setActiveFilter(section, filter, button) {
  state.activeFilters[section] = filter;
  const dropdown = button.closest('.section-dropdown');
  dropdown.querySelectorAll('.dropdown-item').forEach(node => {
    node.classList.toggle('active', node === button);
  });
  if (state.activeSection === section) loadSection();
}

function toggleSearch() {
  const hidden = dom.searchBarWrapper.classList.contains('hidden');
  dom.searchBarWrapper.classList.toggle('hidden', !hidden);
  if (hidden) dom.searchInput.focus();
}

function attachNavEvents() {
  dom.navSections.forEach(sectionNode => {
    sectionNode.addEventListener('click', event => {
      const filterButton = event.target.closest('.dropdown-item');
      if (filterButton) {
        event.stopPropagation();
        setActiveFilter(sectionNode.dataset.section, filterButton.dataset.filter, filterButton);
        sectionNode.classList.remove('dropdown-open');
        return;
      }

      const isActive = state.activeSection === sectionNode.dataset.section;
      const shouldOpen = !sectionNode.classList.contains('dropdown-open');
      closeAllDropdowns();
      sectionNode.classList.toggle('dropdown-open', shouldOpen);
      if (!isActive) setActiveSection(sectionNode.dataset.section);
    });
  });

  document.addEventListener('click', event => {
    if (!event.target.closest('.nav-section-item')) closeAllDropdowns();
  });
}

function attachGlobalEvents() {
  dom.themeToggle.addEventListener('click', toggleTheme);
  dom.searchToggle.addEventListener('click', toggleSearch);
  dom.searchInput.addEventListener('input', event => {
    state.searchQuery = event.target.value.trim();
    loadSection();
  });
  dom.savedBtn.addEventListener('click', openSavedPanel);
  dom.savedClose.addEventListener('click', closeSavedPanel);
  dom.savedOverlay.addEventListener('click', event => {
    if (event.target === dom.savedOverlay) closeSavedPanel();
  });
  dom.detailClose.addEventListener('click', closeDetail);
  dom.detailOverlay.addEventListener('click', event => {
    if (event.target === dom.detailOverlay) closeDetail();
  });
  dom.detailSaveBtn.addEventListener('click', () => toggleSave(state.currentDetailId));
  dom.ctrlSkip.addEventListener('click', () => handleStackAction('skip'));
  dom.ctrlSave.addEventListener('click', () => handleStackAction('save'));
  dom.retryBtn.addEventListener('click', loadSection);
  dom.emptyRetry.addEventListener('click', loadSection);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeDetail();
      closeSavedPanel();
      dom.searchBarWrapper.classList.add('hidden');
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      show(dom.searchBarWrapper);
      dom.searchInput.focus();
      return;
    }
    if (document.activeElement === dom.searchInput) return;
    if (dom.detailOverlay.classList.contains('hidden') && dom.savedOverlay.classList.contains('hidden')) {
      if (event.key === 'ArrowLeft') handleStackAction('skip');
      if (event.key === 'ArrowRight') handleStackAction('save');
      if (event.key === 'Enter') {
        const item = state.currentItems[state.stackIndex];
        if (item) openDetail(item.id);
      }
    }
  });
}

function init() {
  applyTheme(getStoredTheme());
  dom.savedCount.textContent = String(state.savedIds.size);
  renderSavedList();
  attachNavEvents();
  attachGlobalEvents();
  setActiveSection(state.activeSection);
}

init();
