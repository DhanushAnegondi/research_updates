'use strict';

const CONFIG = {
  maxResults: 15,
  apiBase: 'https://export.arxiv.org/api/query',
  proxyBase: 'https://api.allorigins.win/raw?url=',
  storageKey: 'researchpulse:saved-items:v1',
  sections: {
    papers: {
      title: 'Research Papers',
      subtitle: 'Latest from arXiv',
      defaultFilter: 'all',
      mode: 'stack',
    },
    topics: {
      title: 'Hot Topics',
      subtitle: 'Community discussions worth tracking',
      defaultFilter: 'MachineLearning',
      mode: 'stack',
    },
    releases: {
      title: 'New Releases',
      subtitle: 'Model launches and product updates',
      defaultFilter: 'all',
      mode: 'feed',
    },
    dataeng: {
      title: 'Data Engineering',
      subtitle: 'Systems, tools, and delivery patterns',
      defaultFilter: 'papers',
      mode: 'stack',
    },
  },
  paperCategories: {
    all: 'cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CV+OR+cat:cs.CL+OR+cat:cs.RO+OR+cat:cs.NE+OR+cat:stat.ML',
    'cs.AI': 'cat:cs.AI',
    'cs.LG': 'cat:cs.LG',
    'cs.CV': 'cat:cs.CV',
    'cs.CL': 'cat:cs.CL',
    'cs.RO': 'cat:cs.RO',
    'cs.NE': 'cat:cs.NE',
    'stat.ML': 'cat:stat.ML',
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

const HOT_TOPICS = [
  {
    id: 'topic-ml-mcp',
    section: 'topics',
    filter: 'MachineLearning',
    source: 'r/MachineLearning',
    title: 'Model Context Protocol tooling is becoming standard infra',
    summary: 'Builders are converging on MCP as the coordination layer between models, IDEs, and backend tools. The discussion centers on authentication, tool schemas, and how to keep agents predictable.',
    published: '2026-04-03',
    tags: ['Agents', 'Tooling', 'MCP'],
    authors: ['Community thread'],
    highlights: [
      'Shift from prompt-only workflows to tool-backed systems.',
      'Strong interest in standard tool contracts and observability.',
      'Practical focus on local development and controlled execution.',
    ],
    link: 'https://www.reddit.com/r/MachineLearning/',
  },
  {
    id: 'topic-llama-inference',
    section: 'topics',
    filter: 'LocalLLaMA',
    source: 'r/LocalLLaMA',
    title: 'Local inference stacks are prioritizing memory bandwidth over raw parameter count',
    summary: 'Operators are comparing quantization quality, KV-cache strategies, and batching tradeoffs rather than only chasing larger checkpoints.',
    published: '2026-04-02',
    tags: ['Inference', 'Quantization', 'Serving'],
    authors: ['Community thread'],
    highlights: [
      'VRAM pressure is still the main deployment bottleneck.',
      'Smaller tuned models keep winning on cost-to-latency ratio.',
      'Operational benchmarks matter more than leaderboard screenshots.',
    ],
    link: 'https://www.reddit.com/r/LocalLLaMA/',
  },
  {
    id: 'topic-artificial-agents',
    section: 'topics',
    filter: 'artificial',
    source: 'r/artificial',
    title: 'AI agents are moving from demo loops to constrained production jobs',
    summary: 'The strongest sentiment is that useful agents are narrow, observable, and reversible. Teams are more cautious about autonomy claims and more focused on workflow design.',
    published: '2026-04-01',
    tags: ['Agents', 'Reliability', 'Ops'],
    authors: ['Community thread'],
    highlights: [
      'Human approval remains common around writes and side effects.',
      'Execution logs and replayability are becoming baseline requirements.',
      'Most wins come from replacing repetitive review work, not fully autonomous apps.',
    ],
    link: 'https://www.reddit.com/r/artificial/',
  },
  {
    id: 'topic-singularity-robotics',
    section: 'topics',
    filter: 'singularity',
    source: 'r/singularity',
    title: 'Embodied AI discussion is back around simulation-to-real progress',
    summary: 'Posts are clustering around robot foundation models, multimodal planning, and whether synthetic training is closing enough of the real-world gap.',
    published: '2026-03-31',
    tags: ['Embodied AI', 'Robotics', 'Simulation'],
    authors: ['Community thread'],
    highlights: [
      'Perception-to-action latency is still a recurring concern.',
      'Teams want clearer evidence of generalization outside controlled demos.',
      'Benchmark storytelling is not enough without task reliability numbers.',
    ],
    link: 'https://www.reddit.com/r/singularity/',
  },
  {
    id: 'topic-ds-evals',
    section: 'topics',
    filter: 'datascience',
    source: 'r/datascience',
    title: 'Evaluation design is replacing raw model accuracy as the real differentiator',
    summary: 'Data teams are comparing rubric quality, offline replay datasets, and reviewer workflows to make LLM features dependable at scale.',
    published: '2026-03-30',
    tags: ['Evaluation', 'LLMOps', 'Data Science'],
    authors: ['Community thread'],
    highlights: [
      'Weak evals create false confidence and regressions.',
      'Business metrics still need linkage to model outputs.',
      'Teams want faster iteration loops on prompts and retrieval changes.',
    ],
    link: 'https://www.reddit.com/r/datascience/',
  },
];

const RELEASES = [
  {
    id: 'release-openai-api',
    section: 'releases',
    filter: 'openai',
    company: 'OpenAI',
    title: 'API platform update with stronger realtime and tool-calling workflows',
    summary: 'The release focuses on lower-latency application patterns, structured tool use, and cleaner orchestration for production agent systems.',
    published: '2026-04-03',
    tags: ['Realtime', 'API', 'Agents'],
    link: 'https://platform.openai.com/',
  },
  {
    id: 'release-anthropic-control',
    section: 'releases',
    filter: 'anthropic',
    company: 'Anthropic / Claude',
    title: 'Claude workflow update emphasizes controllable long-running tasks',
    summary: 'Messaging centers on safer delegation, better state handling, and enterprise controls for assistants embedded into operational systems.',
    published: '2026-04-02',
    tags: ['Control', 'Enterprise', 'Agents'],
    link: 'https://www.anthropic.com/news',
  },
  {
    id: 'release-google-multimodal',
    section: 'releases',
    filter: 'google',
    company: 'Google DeepMind',
    title: 'New multimodal release targets longer-context reasoning and media understanding',
    summary: 'The positioning highlights broader modality support, scalable context windows, and stronger system integration for developers.',
    published: '2026-04-01',
    tags: ['Multimodal', 'Context', 'Platform'],
    link: 'https://deepmind.google/discover/blog/',
  },
  {
    id: 'release-mistral-enterprise',
    section: 'releases',
    filter: 'mistral',
    company: 'Mistral',
    title: 'Enterprise-serving release adds simpler deployment and governance hooks',
    summary: 'The update is aimed at teams that need on-prem or tightly controlled model operations without losing developer ergonomics.',
    published: '2026-03-29',
    tags: ['Enterprise', 'Deployment', 'Serving'],
    link: 'https://mistral.ai/news/',
  },
  {
    id: 'release-meta-open',
    section: 'releases',
    filter: 'meta',
    company: 'Meta AI',
    title: 'Meta expands open model tooling around inference and fine-tuning',
    summary: 'The story is less about a single checkpoint and more about the supporting ecosystem needed for real deployment.',
    published: '2026-03-28',
    tags: ['Open Models', 'Fine-tuning', 'Infra'],
    link: 'https://ai.meta.com/blog/',
  },
  {
    id: 'release-hf-stack',
    section: 'releases',
    filter: 'huggingface',
    company: 'HuggingFace',
    title: 'Hugging Face update sharpens the path from model discovery to hosted inference',
    summary: 'Workflows now tie together evaluation, packaging, and serving more cleanly for teams operating mixed open-source stacks.',
    published: '2026-03-27',
    tags: ['Open Source', 'Inference', 'Hub'],
    link: 'https://huggingface.co/blog',
  },
];

const DATA_ENGINEERING_ITEMS = [
  {
    id: 'data-papers-observability',
    section: 'dataeng',
    filter: 'papers',
    source: 'Research',
    title: 'Data observability is shifting from dashboards to active guardrails',
    summary: 'Teams increasingly expect anomaly detection, freshness policies, and lineage-aware incident triage to be built into their pipelines instead of layered on afterwards.',
    published: '2026-04-03',
    tags: ['Observability', 'Data Quality', 'Pipelines'],
    authors: ['Research synthesis'],
    highlights: [
      'Passive monitoring creates too much reaction delay.',
      'Freshness, completeness, and schema drift need first-class checks.',
      'Lineage shortens time to isolate blast radius.',
    ],
    link: '#',
  },
  {
    id: 'data-tools-catalog',
    section: 'dataeng',
    filter: 'tools',
    source: 'Tooling',
    title: 'Modern data stacks are consolidating around fewer orchestration surfaces',
    summary: 'Platform teams want catalog, quality, and orchestration primitives that share metadata instead of stitching together disconnected admin consoles.',
    published: '2026-04-02',
    tags: ['Catalog', 'Orchestration', 'Platform'],
    authors: ['Market scan'],
    highlights: [
      'Metadata reuse reduces operational drag.',
      'Teams prefer opinionated workflows over infinite customization.',
      'Governance and developer experience are being evaluated together.',
    ],
    link: '#',
  },
  {
    id: 'data-sysdesign-lakehouse',
    section: 'dataeng',
    filter: 'sysdesign',
    source: 'System Design',
    title: 'Lakehouse architectures are being judged on mutation handling, not just storage cost',
    summary: 'The harder design questions now involve CDC correctness, backfills, and how quickly downstream consumers can trust updates after schema evolution.',
    published: '2026-04-01',
    tags: ['Lakehouse', 'CDC', 'Schema'],
    authors: ['Architecture note'],
    highlights: [
      'Backfill strategy is a design decision, not an afterthought.',
      'Consumers need explicit contracts around delay and correction windows.',
      'Storage format choice only matters if operational semantics are clear.',
    ],
    link: '#',
  },
  {
    id: 'data-news-cost',
    section: 'dataeng',
    filter: 'news',
    source: 'Industry',
    title: 'Cost pressure is forcing stricter workload classification across analytics and ML',
    summary: 'Organizations are separating interactive BI, scheduled reporting, and experimental ML compute to stop one workload class from silently subsidizing another.',
    published: '2026-03-31',
    tags: ['Cost', 'Workload Mgmt', 'Warehouses'],
    authors: ['Industry note'],
    highlights: [
      'Shared compute pools hide expensive habits.',
      'Chargeback and query governance are becoming normal again.',
      'Reliability targets should vary by workload criticality.',
    ],
    link: '#',
  },
];

const state = {
  activeSection: 'papers',
  activeFilters: {
    papers: 'all',
    topics: 'MachineLearning',
    releases: 'all',
    dataeng: 'papers',
  },
  searchQuery: '',
  loading: false,
  currentItems: [],
  stackIndex: 0,
  currentDetailId: null,
  savedIds: new Set(loadSavedIds()),
  paperCache: new Map(),
  requestToken: 0,
};

const dom = {
  topNav: document.getElementById('topNav'),
  navSections: [...document.querySelectorAll('.nav-section-item')],
  searchToggle: document.getElementById('searchToggle'),
  searchBarWrapper: document.getElementById('searchBarWrapper'),
  searchInput: document.getElementById('searchInput'),
  savedBtn: document.getElementById('savedBtn'),
  savedCount: document.getElementById('savedCount'),
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

function getStaticItems(section) {
  if (section === 'topics') return HOT_TOPICS;
  if (section === 'releases') return RELEASES;
  if (section === 'dataeng') return DATA_ENGINEERING_ITEMS;
  return [];
}

function getAllKnownItems() {
  return [
    ...HOT_TOPICS,
    ...RELEASES,
    ...DATA_ENGINEERING_ITEMS,
    ...[...state.paperCache.values()].flat(),
    ...state.currentItems,
  ];
}

function formatDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatShortDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function show(el) {
  if (el) el.classList.remove('hidden');
}

function hide(el) {
  if (el) el.classList.add('hidden');
}

function normalizeParagraphs(text) {
  return text
    .split(/\n{2,}/)
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => `<p>${escapeHtml(part)}</p>`)
    .join('');
}

function generateSummary(abstract) {
  const sentences = abstract
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length >= 40);
  return sentences.slice(0, 2).join(' ') || abstract;
}

function extractHighlights(text, fallback = []) {
  const signals = [
    /we propose|we present|we introduce|we develop/i,
    /outperform|surpass|benchmark|sota|state.of.the.art/i,
    /show|demonstrate|result|finding/i,
    /system|pipeline|workflow|architecture/i,
  ];
  const sentences = text
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length >= 45);
  const picks = [];
  for (const signal of signals) {
    const match = sentences.find(sentence => signal.test(sentence) && !picks.includes(sentence));
    if (match) picks.push(match);
  }
  return picks.slice(0, 4).length ? picks.slice(0, 4) : fallback.slice(0, 4);
}

async function fetchPapers(category = 'all') {
  if (state.paperCache.has(category)) return state.paperCache.get(category);

  const query = CONFIG.paperCategories[category] || CONFIG.paperCategories.all;
  const url = `${CONFIG.apiBase}?search_query=${query}&start=0&max_results=${CONFIG.maxResults}&sortBy=submittedDate&sortOrder=descending`;
  const endpoints = [url, `${CONFIG.proxyBase}${encodeURIComponent(url)}`];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const xml = await response.text();
      const items = parseArxivXML(xml);
      state.paperCache.set(category, items);
      return items;
    } catch (error) {
      if (endpoint === endpoints[endpoints.length - 1]) throw error;
    }
  }

  return [];
}

function parseArxivXML(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  const entries = [...doc.querySelectorAll('entry')];

  return entries.map((entry, index) => {
    const id = entry.querySelector('id')?.textContent?.trim() || `paper-${index}`;
    const title = entry.querySelector('title')?.textContent?.replace(/\s+/g, ' ').trim() || 'Untitled paper';
    const abstract = entry.querySelector('summary')?.textContent?.replace(/\s+/g, ' ').trim() || '';
    const authors = [...entry.querySelectorAll('author name')].map(node => node.textContent.trim());
    const categories = [...entry.querySelectorAll('category')]
      .map(node => node.getAttribute('term'))
      .filter(Boolean)
      .slice(0, 4);
    const links = [...entry.querySelectorAll('link')];
    const absLink = links.find(node => node.getAttribute('rel') === 'alternate')?.getAttribute('href') || id;
    const pdfLink = links.find(node => node.getAttribute('title') === 'pdf')?.getAttribute('href') || absLink.replace('/abs/', '/pdf/');
    const published = entry.querySelector('published')?.textContent?.trim() || '';
    const updated = entry.querySelector('updated')?.textContent?.trim() || '';
    const arxivId = id.split('/abs/').pop() || id.split('/').pop() || id;

    return {
      id: `paper-${arxivId}`,
      itemId: arxivId,
      section: 'papers',
      filter: categories[0] || 'all',
      source: 'arXiv',
      title,
      summary: generateSummary(abstract),
      abstract,
      published,
      updated,
      authors,
      tags: categories,
      highlights: extractHighlights(abstract),
      link: absLink,
      pdfLink,
    };
  });
}

function buildTag(label, accent = false) {
  const className = accent ? 'card-tag card-tag-accent' : 'card-tag';
  return `<span class="${className}">${escapeHtml(label)}</span>`;
}

function labelForTag(tag) {
  return CONFIG.tagLabels[tag] || tag;
}

function getFilteredItems(items) {
  const section = state.activeSection;
  const activeFilter = state.activeFilters[section];
  const query = state.searchQuery.trim().toLowerCase();

  let nextItems = items.filter(item => activeFilter === 'all' || item.filter === activeFilter);
  if (!query) return nextItems;

  return nextItems.filter(item => {
    const haystack = [
      item.title,
      item.summary,
      item.abstract,
      item.company,
      item.source,
      ...(item.authors || []),
      ...(item.tags || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });
}

function getVisibleStackItems() {
  return state.currentItems.slice(state.stackIndex);
}

function topStackItem() {
  return state.currentItems[state.stackIndex] || null;
}

function updateHeader() {
  const sectionConfig = CONFIG.sections[state.activeSection];
  const filterButton = document.querySelector(`.nav-section-item[data-section="${state.activeSection}"] .dropdown-item.active`);
  const filterLabel = filterButton ? filterButton.textContent.trim() : '';
  dom.sectionTitle.textContent = sectionConfig.title;
  dom.sectionSubtitle.textContent = filterLabel ? `${sectionConfig.subtitle} · ${filterLabel}` : sectionConfig.subtitle;
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
  const remainingPointer = Math.min(state.stackIndex + 1, total);
  dom.progressFill.style.width = `${(completed / total) * 100}%`;
  dom.progressLabel.textContent = `${remainingPointer} / ${total}`;
}

function renderStack() {
  const items = getVisibleStackItems();
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

    if (depth === 0) {
      attachCardInteractions(card, item);
    }
  });

  updateCounter();
  renderProgress();
}

function buildStackCardMarkup(item) {
  const tags = (item.tags || []).slice(0, 3).map(tag => buildTag(labelForTag(tag), true)).join('');
  const authors = (item.authors || []).length ? escapeHtml(item.authors.join(', ')) : escapeHtml(item.source || item.company || 'ResearchPulse');
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
    <div class="card-authors">${authors}</div>
    <div class="card-divider"></div>
    <div class="card-teaser-label">Summary</div>
    <p class="card-teaser">${escapeHtml(item.summary || item.abstract || '')}</p>
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
    const rotation = deltaX / 18;
    card.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;
    if (indicators) indicators.style.opacity = String(Math.min(Math.abs(deltaX) / 90, 1));
  };

  const resetCard = () => {
    card.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
    card.style.transform = 'translateX(0) rotate(0deg)';
    if (indicators) indicators.style.opacity = '0';
    window.setTimeout(() => {
      card.style.transition = '';
    }, 220);
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

  card.addEventListener('pointercancel', () => {
    pointerId = null;
    resetCard();
  });

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

function colorForCompany(company) {
  const map = {
    OpenAI: '#00D9FF',
    'Anthropic / Claude': '#FF9F1C',
    'Google DeepMind': '#4ADE80',
    Mistral: '#F97316',
    'Meta AI': '#60A5FA',
    HuggingFace: '#FACC15',
  };
  return map[company] || '#888888';
}

function renderFeed() {
  if (!state.currentItems.length) {
    hide(dom.releasesFeed);
    show(dom.stateEmpty);
    updateCounter();
    return;
  }

  hide(dom.stateEmpty);
  show(dom.releasesFeed);

  const groupsMap = new Map();
  state.currentItems.forEach(item => {
    const key = item.company || item.source || 'ResearchPulse';
    if (!groupsMap.has(key)) groupsMap.set(key, []);
    groupsMap.get(key).push(item);
  });

  const groups = [...groupsMap.entries()].map(([company, items]) => ({
    company,
    items,
  }));

  dom.releasesFeed.innerHTML = buildReleaseMarkup(groups);
  dom.releasesFeed.querySelectorAll('.release-item').forEach(node => {
    node.addEventListener('click', () => openDetail(node.dataset.id));
  });
  updateCounter();
}

function setLoading(label = 'Fetching data…') {
  state.loading = true;
  dom.loaderLabel.textContent = label;
  show(dom.stateLoading);
  hide(dom.stateError);
  hide(dom.stateEmpty);
  hide(dom.stackStage);
  hide(dom.releasesFeed);
}

function setError(message, submessage = 'Check your connection or try again.') {
  state.loading = false;
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
  state.loading = false;
  hide(dom.stateLoading);
  hide(dom.stateError);
  hide(dom.stateEmpty);
}

async function loadSection() {
  const section = state.activeSection;
  const requestToken = ++state.requestToken;
  updateHeader();
  closeAllDropdowns();

  try {
    setLoading(section === 'papers' ? 'Fetching latest papers…' : 'Loading section…');
    const items = section === 'papers'
      ? await fetchPapers(state.activeFilters.papers)
      : getStaticItems(section);
    if (requestToken !== state.requestToken) return;
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
    console.error('ResearchPulse load failed:', error);
    setError(
      `Could not load ${CONFIG.sections[section].title.toLowerCase()}`,
      `${error.message}. The upstream source may be unavailable, or browser network access may be blocked.`
    );
  }
}

function findItemById(id) {
  const allItems = getAllKnownItems();
  return allItems.find(item => item.id === id) || null;
}

function buildDetailMarkup(item) {
  const detailBody = item.abstract || item.summary || '';
  const highlights = extractHighlights(detailBody, item.highlights || []);
  const tags = (item.tags || []).map(tag => `<span class="detail-tag">${escapeHtml(labelForTag(tag))}</span>`).join('');
  const meta = item.section === 'papers'
    ? `${escapeHtml(item.itemId || item.id)}`
    : `${escapeHtml(item.source || item.company || item.section)}`;

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
  dom.detailExtLink.setAttribute('aria-disabled', item.link ? 'false' : 'true');
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
  if (state.savedIds.has(itemId)) {
    state.savedIds.delete(itemId);
  } else {
    state.savedIds.add(itemId);
  }
  persistSavedIds();
  renderSavedList();
  dom.savedCount.textContent = String(state.savedIds.size);

  if (state.currentDetailId === itemId) {
    const item = findItemById(itemId);
    if (item) updateDetailActions(item);
  }

  if (CONFIG.sections[state.activeSection].mode === 'stack') {
    renderStack();
  }
}

function renderSavedList() {
  const savedItems = [...state.savedIds]
    .map(id => findItemById(id))
    .filter(Boolean)
    .sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());

  if (!savedItems.length) {
    dom.savedList.innerHTML = `
      <div class="saved-empty">
        <p>No saved items yet.</p>
        <p>Use Save on any card to keep it here.</p>
      </div>
    `;
    return;
  }

  dom.savedList.innerHTML = savedItems.map(item => `
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
  const item = topStackItem();
  if (!item) return;

  if (action === 'save') toggleSave(item.id);
  state.stackIndex += 1;
  renderStack();
}

function closeAllDropdowns() {
  dom.navSections.forEach(sectionNode => sectionNode.classList.remove('dropdown-open'));
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
  dom.searchToggle.addEventListener('click', toggleSearch);
  dom.searchInput.addEventListener('input', event => {
    state.searchQuery = event.target.value;
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
        const item = topStackItem();
        if (item) openDetail(item.id);
      }
    }
  });
}

function init() {
  dom.savedCount.textContent = String(state.savedIds.size);
  renderSavedList();
  attachNavEvents();
  attachGlobalEvents();
  setActiveSection(state.activeSection);
}

init();
