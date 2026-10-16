// TTS Trump Technik — site.js. Every page works without it; this adds the stage, the finder and motion.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wide = () => matchMedia('(min-width: 900px)').matches;

  /* ---------- reveal once, never leave content hidden ---------- */
  const reveal = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    reveal.forEach((el) => io.observe(el));
    addEventListener('load', () => setTimeout(() => reveal.forEach((el) => {
      const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in');
    }), 2500));
  } else reveal.forEach((el) => el.classList.add('is-in'));

  /* ---------- menu on phones ---------- */
  const setMenu = (btn, open) => {
    btn.closest('.bar').classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open);
    btn.textContent = open ? 'Schließen' : 'Menü';
  };
  $$('.bar__menu').forEach((btn) => {
    btn.addEventListener('click', () => setMenu(btn, !btn.closest('.bar').classList.contains('is-open')));
    $$('.bar__nav a', btn.closest('.bar')).forEach((a) => a.addEventListener('click', () => setMenu(btn, false)));
  });
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    $$('.bar.is-open .bar__menu').forEach((btn) => { setMenu(btn, false); btn.focus(); });
  });

  /* ---------- the stage: one photograph that changes with what you read ---------- */
  const stage = $('.stage');
  const frame = stage && $('.stage__frame', stage);
  const caption = stage && $('.stage__caption', stage);
  let current = frame && $('.stage__img.is-on', frame);
  const setStage = (src, srcset, alt, cap) => {
    if (!frame || !src) return;
    if (current && current.getAttribute('src') === src) { if (caption && cap) caption.innerHTML = cap; return; }
    const img = new Image();
    img.className = 'stage__img';
    img.alt = alt || '';
    if (srcset) { img.srcset = srcset; img.sizes = '47vw'; }
    img.src = src;
    const show = () => {
      frame.insertBefore(img, caption || null);
      requestAnimationFrame(() => requestAnimationFrame(() => img.classList.add('is-on')));
      const old = current; current = img;
      if (old) { old.classList.remove('is-on'); setTimeout(() => old.remove(), 700); }
      if (caption) caption.innerHTML = cap || '';
    };
    img.decode ? img.decode().then(show, show) : (img.onload = show);
  };
  window.ttsStage = setStage;

  // Sections that bring their own picture to the stage as they pass the middle of the screen.
  const scenes = $$('[data-stage-src], [data-stage-lock]');
  if (scenes.length && 'IntersectionObserver' in window) {
    const so = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting || !wide()) continue;
        const d = e.target.dataset;
        window.ttsScene = d.stageLock ? 'finder' : 'other';
        if (d.stageLock && window.ttsFinderPick) { window.ttsFinderPick(); continue; }
        setStage(d.stageSrc, d.stageSrcset, d.stageAlt, d.stageCap);
      }
    }, { rootMargin: '-45% 0px -45% 0px' });
    scenes.forEach((s) => so.observe(s));
  }

  /* ---------- gallery on machine pages: a photo goes up on the stage ---------- */
  $$('.gallery__item').forEach((b) => b.addEventListener('click', () => {
    const d = b.dataset;
    if (wide()) setStage(d.src, d.srcset, d.alt, caption ? caption.innerHTML : '');
  }));

  /* ---------- gallery thumbnails ---------- */
  $$('.thumbs button').forEach((b) => b.addEventListener('click', () => {
    $$('.thumbs button').forEach((o) => o.setAttribute('aria-pressed', o === b));
    const d = b.dataset;
    if (wide()) setStage(d.src, d.srcset, d.alt, caption ? caption.innerHTML : '');
    else { const top = $('.stage .stage__img.is-on'); if (top) { top.srcset = d.srcset || ''; top.src = d.src; } }
  }));

  /* ---------- catalogue rows: hovering a machine puts it on the stage ---------- */
  const catRows = $$('.cat__row');
  const pickRow = (r) => {
    catRows.forEach((o) => o.classList.toggle('is-active', o === r));
    const d = r.dataset; setStage(d.src, d.srcset, d.alt, d.cap);
  };
  catRows.forEach((r) => {
    r.addEventListener('mouseenter', () => wide() && pickRow(r));
    r.addEventListener('focus', () => wide() && pickRow(r));
  });
  const typeTabs = $$('.types .tab');
  if (typeTabs.length) {
    const groups = $$('.cat__group');
    const apply = (t) => {
      typeTabs.forEach((b) => b.setAttribute('aria-pressed', b.dataset.type === t));
      groups.forEach((g) => { g.hidden = t !== 'alle' && g.dataset.type !== t; });
      const first = groups.find((g) => !g.hidden); const row = first && $('.cat__row', first);
      if (row && wide()) pickRow(row);
    };
    typeTabs.forEach((b) => b.addEventListener('click', () => {
      apply(b.dataset.type);
      history.replaceState(null, '', b.dataset.type === 'alle' ? location.pathname : '#' + b.dataset.type);
    }));
    const h = decodeURIComponent(location.hash.slice(1));
    if (h && typeTabs.some((b) => b.dataset.type === h)) apply(h);
  }

  /* ---------- news list: the row in the middle of the screen is the active one ---------- */
  const newsRows = $$('.news__row');
  if (newsRows.length) {
    const frameImgs = $$('.news__frame img');
    const activate = (row) => {
      newsRows.forEach((r) => { const on = r === row; r.classList.toggle('is-active', on); const b = $('button', r); if (b) b.setAttribute('aria-expanded', on); });
      frameImgs.forEach((im) => im.classList.toggle('is-on', im.dataset.for === row.dataset.id));
    };
    newsRows.forEach((r) => {
      const b = $('button', r);
      b.addEventListener('click', () => activate(r));
      b.addEventListener('mouseenter', () => matchMedia('(hover: hover)').matches && activate(r));
      b.addEventListener('focus', () => activate(r));
    });
    if ('IntersectionObserver' in window && !matchMedia('(hover: hover)').matches) {
      const no = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && activate(e.target)), { rootMargin: '-50% 0px -45% 0px' });
      newsRows.forEach((r) => no.observe(r));
    }
  }

  /* ---------- the finder: which machine reaches the output you need ---------- */
  const finder = $('#finder');
  if (finder && window.TTS_MACHINES) {
    const all = window.TTS_MACHINES;
    const list = $('.finder__list', finder);
    const count = $('.finder__count', finder);
    const range = $('input[type=range]', finder);
    const out = $('output', finder);
    const state = { mode: 'kaufen', group: 'brecher', tph: Number(range.value), pick: null };
    const fmt = (n) => n.toLocaleString('de-DE');
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    const capOf = (m) => `<strong>${esc(m.name)}</strong>${esc(m.type)}${m.tph ? ' · max. ' + fmt(m.tph) + ' t/h' : ''}${m.tonnes ? ' · ' + fmt(m.tonnes) + ' t' : ''}`;
    const toStage = (m) => m && setStage(m.img.src, m.img.srcset, m.name, capOf(m));
    window.ttsFinderPick = () => toStage(all.find((m) => m.slug === state.pick));

    const render = () => {
      const pool = all.filter((m) => m.mode === state.mode && (state.group === 'alle' || m.group === state.group));
      const hits = pool.filter((m) => state.tph === 0 || (m.tph || 0) >= state.tph);
      out.textContent = state.tph === 0 ? 'jede Leistung' : `ab ${fmt(state.tph)} t/h`;
      $$('.finder__modes .tab', finder).forEach((b) => b.setAttribute('aria-pressed', b.dataset.mode === state.mode));
      $$('.finder__groups .tab', finder).forEach((b) => b.setAttribute('aria-pressed', b.dataset.group === state.group));
      const groupWord = state.group === 'sieb' ? (pool.length === 1 ? 'Siebanlage' : 'Siebanlagen') : state.group === 'brecher' ? 'Brecher' : (pool.length === 1 ? 'Anlage' : 'Anlagen');
      const modeWord = { kaufen: 'zum Kauf', gebraucht: 'gebraucht', mieten: 'im Mietpark' }[state.mode];
      count.textContent = !hits.length ? '' : state.tph
        ? `${hits.length} von ${pool.length} ${groupWord === 'Brecher' ? 'Brechern' : groupWord} ${modeWord} ${hits.length === 1 ? 'schafft' : 'schaffen'} ${fmt(state.tph)} t/h oder mehr.`
        : `${pool.length} ${groupWord} ${modeWord}.`;
      if (!hits.find((m) => m.slug === state.pick)) state.pick = hits[0] ? hits[0].slug : null;
      list.innerHTML = hits.length ? hits.map((m) => row(m)).join('') : empty(pool);
      $$('.row__head', list).forEach((b) => b.addEventListener('click', () => {
        state.pick = b.dataset.slug;
        $$('.row', list).forEach((r) => { const on = r.dataset.slug === state.pick; r.classList.toggle('is-active', on); $('.row__head', r).setAttribute('aria-expanded', on); });
        if (wide()) { window.ttsScene = 'finder'; toStage(all.find((m) => m.slug === state.pick)); }
      }));
      if (wide() && window.ttsScene === 'finder') toStage(all.find((m) => m.slug === state.pick));
    };
    const typo = (v = '') => String(v).replace(/(\d) x (\d)/g, '$1\u00a0×\u00a0$2').replace(/(\d) (mm|t\/h|Tonnen|t)\b/g, '$1\u00a0$2');
    const fig = (k, v) => (v ? `<div><dt>${k}</dt><dd class="nums">${esc(typo(v))}</dd></div>` : '');
    const row = (m) => {
      const on = m.slug === state.pick;
      const value = m.tph ? `max. ${fmt(m.tph)} t/h` : (m.year ? `Baujahr ${m.year}` : m.tonnes ? `${fmt(m.tonnes)} t` : '');
      return `<li class="row${on ? ' is-active' : ''}" data-slug="${m.slug}">
        <button class="row__head" type="button" data-slug="${m.slug}" aria-expanded="${on}">
          <span class="row__name">${esc(m.name)}<small>${esc(m.type)}${m.year ? ' · Baujahr ' + m.year : ''}</small></span>
          <span class="row__value nums">${value}</span>
        </button>
        <div class="row__body"><div><div class="row__pad">
          <img class="row__photo" src="${m.img.small}" alt="${esc(m.name)}" loading="lazy" width="800" height="600">
          <p class="small">${esc(m.blurb)}</p>
          <dl class="figs">${fig(m.tphFromModel ? 'Leistung (Modell)' : 'Leistung', m.tph ? 'max. ' + fmt(m.tph) + ' t/h' : '')}${fig(m.feed ? 'Aufgabeöffnung' : 'Siebfläche', m.feed || m.screen)}${fig('Gewicht', m.tonnes ? fmt(m.tonnes) + ' t' : '')}${m.hours ? fig('Betriebsstunden', m.hours) : ''}</dl>
          <div class="cells">
            <a class="button button--quiet" href="${m.href}">Datenblatt <svg class="arrow" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7"/></svg></a>
            <a class="button" href="kontakt.html?m=${encodeURIComponent(m.slug)}&amp;art=${m.mode}">Anfragen <svg class="arrow" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7"/></svg></a>
          </div>
        </div></div></div>
      </li>`;
    };
    const empty = (pool) => {
      const best = pool.reduce((a, m) => Math.max(a, m.tph || 0), 0);
      const where = { kaufen: 'bei den Neumaschinen', gebraucht: 'bei den Gebrauchtmaschinen', mieten: 'im Mietpark' }[state.mode];
      return `<li class="finder__empty"><p>${where[0].toUpperCase() + where.slice(1)} schafft keine Anlage dieser Art ${fmt(state.tph)} t/h${best ? ` – die stärkste kommt auf ${fmt(best)} t/h` : ''}. Rufen Sie uns an, oft gibt es trotzdem eine Lösung: <a class="link" href="tel:+4920538498222">+49 2053 8498-222</a>.</p></li>`;
    };

    $$('.finder__modes .tab', finder).forEach((b) => b.addEventListener('click', () => { state.mode = b.dataset.mode; render(); }));
    $$('.finder__groups .tab', finder).forEach((b) => b.addEventListener('click', () => { state.group = b.dataset.group; render(); }));
    range.addEventListener('input', () => { state.tph = Number(range.value); render(); });
    render();
  }

  /* ---------- contact form: prefill from the machine, send as an e-mail ---------- */
  const form = $('#anfrage');
  if (form) {
    const q = new URLSearchParams(location.search);
    const ref = q.get('m'); const art = q.get('art');
    const sel = form.elements.machine;
    if (ref && [...sel.options].some((o) => o.value === ref)) sel.value = ref;
    const topic = form.elements.topic;
    if (art) topic.value = { kaufen: 'Verkauf', gebraucht: 'Verkauf', mieten: 'Vermietung', service: 'Service und Ersatzteile' }[art] || topic.value;
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      if (!form.reportValidity()) return;
      const f = form.elements;
      const to = { Verkauf: 'verkauf@trump-technik.de', Vermietung: 'vermietung@trump-technik.de', 'Service und Ersatzteile': 'technik@trump-technik.de' }[f.topic.value] || 'info@trump-technik.de';
      const machine = f.machine.value ? f.machine.options[f.machine.selectedIndex].text : '';
      const subject = `Anfrage ${f.topic.value}${machine ? ': ' + machine : ''}`;
      const lines = [
        `${f.salutation.value} ${f.first_name.value} ${f.name.value}`.trim(),
        f.company.value, `Telefon: ${f.phone.value}`, `E-Mail: ${f.email.value}`, '',
        machine ? `Maschine: ${machine}` : '', f.appointment.value ? `Termin: ${f.appointment.value}` : '', '',
        f.message.value,
      ].filter((l, i, a) => l || (a[i - 1] && a[i - 1] !== ''));
      location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
      $('.form__sent', form).hidden = false;
    });
  }
})();
