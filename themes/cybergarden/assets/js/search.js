(() => {
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  const meta = document.getElementById('search-meta');
  if (!input || !results) return;

  let index = [];

  const normalize = (value) => String(value || '')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  const escapeHTML = (value) => String(value || '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  const scoreField = (text, query, weight) => {
    const value = normalize(text);
    if (!value || !query) return 0;
    let score = 0;
    if (value === query) score += 100 * weight;
    if (value.startsWith(query)) score += 55 * weight;
    if (value.includes(query)) score += 35 * weight;

    const tokens = query.split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      if (value.includes(token)) score += 12 * weight;
    }
    return score;
  };

  const search = (query) => {
    const q = normalize(query);
    if (!q) {
      meta.textContent = '';
      results.innerHTML = '';
      return;
    }

    const hits = index
      .map(item => ({
        item,
        score:
          scoreField(item.title, q, 5) +
          scoreField((item.tags || []).join(' '), q, 3) +
          scoreField(item.content, q, 1)
      }))
      .filter(hit => hit.score > 0)
      .sort((a, b) => b.score - a.score || String(b.item.date).localeCompare(String(a.item.date)))
      .slice(0, 50);

    meta.textContent = hits.length ? `找到 ${hits.length} 条结果` : '没有找到匹配内容';

    results.replaceChildren(...hits.map(({ item }) => {
      const wrapper = document.createElement('article');
      wrapper.className = 'search-item';

      const link = document.createElement('a');
      link.className = 'post-title';
      link.href = item.url;
      link.textContent = item.title;

      const metaLine = document.createElement('div');
      metaLine.className = 'post-meta';
      metaLine.textContent = `${item.date} · ${item.section || ''}`;

      const snippet = document.createElement('p');
      snippet.className = 'search-snippet';
      snippet.textContent = makeSnippet(item.content, q);

      wrapper.append(link, metaLine, snippet);
      return wrapper;
    }));
  };

  const makeSnippet = (content, query) => {
    const text = String(content || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    const lower = text.toLocaleLowerCase();
    const idx = lower.indexOf(query.toLocaleLowerCase());
    if (idx === -1) return text.slice(0, 100) + (text.length > 100 ? '…' : '');
    const start = Math.max(0, idx - 40);
    const end = Math.min(text.length, idx + query.length + 70);
    return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
  };

  fetch(input.dataset.searchIndex || '/searchindex.json')
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data => {
      index = Array.isArray(data) ? data : [];
      if (input.value.trim()) search(input.value);
    })
    .catch(() => {
      meta.textContent = '搜索索引加载失败，请稍后再试。';
    });

  let timer;
  input.addEventListener('input', event => {
    clearTimeout(timer);
    timer = setTimeout(() => search(event.target.value), 100);
  });
})();