// TTS Trump Technik — site.js. Alle Seiten funktionieren auch ohne Script.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* Kopfzeile: Schatten beim Scrollen, Menü auf dem Handy */
  const header = $('.header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 8);
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    const btn = $('.menu-btn', header);
    const set = (open) => {
      header.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open);
      btn.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
      btn.innerHTML = open ? window.TTS_ICONS.x : window.TTS_ICONS.menu;
    };
    btn.addEventListener('click', () => set(!header.classList.contains('is-open')));
    $$('.nav a', header).forEach((a) => a.addEventListener('click', () => set(false)));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && header.classList.contains('is-open')) { set(false); btn.focus(); } });
  }

  /* Einblenden beim Scrollen, nie dauerhaft versteckt */
  const reveal = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveal.forEach((el) => io.observe(el));
    addEventListener('load', () => setTimeout(() => reveal.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in'); }), 2000));
  } else reveal.forEach((el) => el.classList.add('is-in'));

  /* Filter-Chips auf den Katalogseiten */
  const chips = $$('.chips .chip');
  if (chips.length) {
    const groups = $$('.group');
    const apply = (t) => {
      chips.forEach((c) => c.setAttribute('aria-pressed', c.dataset.type === t));
      groups.forEach((g) => { g.hidden = t !== 'alle' && g.dataset.type !== t; });
      groups.forEach((g) => !g.hidden && $$('[data-reveal]', g).forEach((el) => el.classList.add('is-in')));
    };
    chips.forEach((c) => c.addEventListener('click', () => { apply(c.dataset.type); history.replaceState(null, '', c.dataset.type === 'alle' ? location.pathname : '#' + c.dataset.type); }));
    const h = decodeURIComponent(location.hash.slice(1));
    if (h && chips.some((c) => c.dataset.type === h)) apply(h);
  }

  /* Galerie auf den Maschinenseiten */
  const main = $('.gallery__main img');
  $$('.gallery__thumbs button').forEach((b) => b.addEventListener('click', () => {
    $$('.gallery__thumbs button').forEach((o) => o.setAttribute('aria-pressed', o === b));
    main.srcset = b.dataset.srcset; main.src = b.dataset.src;
  }));

  /* Maschinenfinder */
  const finder = $('#finder');
  if (finder && window.TTS_MACHINES) {
    const all = window.TTS_MACHINES;
    const grid = $('#finder-grid');
    const count = $('.finder__count', finder);
    const range = $('input[type=range]', finder);
    const out = $('output', finder);
    const more = $('#finder-more');
    const state = { mode: 'kaufen', group: 'alle', tph: Number(range.value) };
    const LIMIT = matchMedia('(max-width: 620px)').matches ? 3 : 6;
    const fmt = (n) => n.toLocaleString('de-DE');
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const typo = (v = '') => String(v).replace(/(\d) x (\d)/g, '$1 × $2').replace(/(\d) (mm|t\/h|Tonnen|t)\b/g, '$1 $2');
    const pages = { kaufen: ['verkauf.html', 'Alle Neumaschinen'], gebraucht: ['gebrauchtmaschinen.html', 'Alle Gebrauchtmaschinen'], mieten: ['mietpark.html', 'Zum Mietpark'] };
    const badge = { kaufen: ['Neu', 'badge--blue'], gebraucht: ['Gebraucht', 'badge--dark'], mieten: ['Mietpark', ''] };
    const spec = (k, v) => (v ? `<div><dt>${k}</dt><dd>${esc(typo(v))}</dd></div>` : '');
    const card = (m) => `
      <li class="mcard">
        <a class="mcard__img" href="${m.href}" tabindex="-1" aria-hidden="true"><img src="${m.img.small}" alt="" width="${m.img.w}" height="${m.img.h}" loading="lazy"><span class="badge ${badge[m.mode][1]}">${badge[m.mode][0]}</span></a>
        <div class="mcard__body">
          <span class="mcard__type">${esc(m.type)}</span>
          <h3><a href="${m.href}">${esc(m.name)}</a></h3>
          <dl class="specs">${spec(m.tphFromModel ? 'Leistung (Modell)' : 'Leistung', m.tph ? 'max. ' + fmt(m.tph) + ' t/h' : '')}${spec(m.feed ? 'Aufgabeöffnung' : 'Siebfläche', m.feed || m.screen)}${spec('Gewicht', m.tonnes ? fmt(m.tonnes) + ' t' : '')}${m.year ? spec('Baujahr', String(m.year)) : ''}</dl>
          <div class="mcard__actions"><a class="btn btn--ghost btn--sm" href="${m.href}">Details</a><a class="btn btn--primary btn--sm" href="kontakt.html?m=${encodeURIComponent(m.slug)}&amp;art=${m.mode}">Anfragen</a></div>
        </div>
      </li>`;
    const render = () => {
      const pool = all.filter((m) => m.mode === state.mode && (state.group === 'alle' || m.group === state.group));
      const hits = pool.filter((m) => state.tph === 0 || (m.tph || 0) >= state.tph);
      out.textContent = state.tph === 0 ? 'beliebig' : `ab ${fmt(state.tph)} t/h`;
      range.style.setProperty('--fill', (state.tph / Number(range.max)) * 100 + '%');
      $$('[data-mode]', finder).forEach((b) => b.setAttribute('aria-pressed', b.dataset.mode === state.mode));
      $$('[data-group]', finder).forEach((b) => b.setAttribute('aria-pressed', b.dataset.group === state.group));
      count.innerHTML = hits.length
        ? `<b>${hits.length} ${hits.length === 1 ? 'Anlage' : 'Anlagen'}</b> passen${hits.length > LIMIT ? ` – die ersten ${LIMIT} sehen Sie hier` : ''}.`
        : '';
      if (!hits.length) {
        const best = pool.reduce((a, m) => Math.max(a, m.tph || 0), 0);
        grid.innerHTML = `<li class="empty"><strong>Keine passende Anlage in dieser Auswahl</strong>${best ? `Die stärkste Anlage hier schafft ${fmt(best)} t/h. ` : ''}Rufen Sie uns an – oft gibt es trotzdem eine Lösung: <a class="link" href="tel:+4920538498222">+49 2053 8498-222</a></li>`;
      } else grid.innerHTML = hits.slice(0, LIMIT).map(card).join('');
      const [href, label] = pages[state.mode];
      more.innerHTML = `<a class="btn btn--ghost" href="${href}">${label} ansehen ${window.TTS_ICONS.arrow}</a>`;
    };
    $$('[data-mode]', finder).forEach((b) => b.addEventListener('click', () => { state.mode = b.dataset.mode; render(); }));
    $$('[data-group]', finder).forEach((b) => b.addEventListener('click', () => { state.group = b.dataset.group; render(); }));
    range.addEventListener('input', () => { state.tph = Number(range.value); render(); });
    render();
  }

  /* Kontaktformular: Maschine vorauswählen, als E-Mail senden */
  const form = $('#anfrage');
  if (form) {
    const q = new URLSearchParams(location.search);
    const sel = form.elements.machine;
    const ref = q.get('m');
    if (ref && [...sel.options].some((o) => o.value === ref)) sel.value = ref;
    const art = q.get('art');
    if (art) form.elements.topic.value = { kaufen: 'Verkauf', gebraucht: 'Verkauf', mieten: 'Vermietung', service: 'Service und Ersatzteile' }[art] || form.elements.topic.value;
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      if (!form.reportValidity()) return;
      const f = form.elements;
      const to = { Verkauf: 'verkauf@trump-technik.de', Vermietung: 'vermietung@trump-technik.de', 'Service und Ersatzteile': 'technik@trump-technik.de' }[f.topic.value] || 'info@trump-technik.de';
      const machine = f.machine.value ? f.machine.options[f.machine.selectedIndex].text : '';
      const subject = `Anfrage ${f.topic.value}${machine ? ': ' + machine : ''}`;
      const lines = [`${f.salutation.value} ${f.first_name.value} ${f.name.value}`.trim(), f.company.value, `Telefon: ${f.phone.value}`, `E-Mail: ${f.email.value}`, '',
        machine ? `Maschine: ${machine}` : '', f.appointment.value ? `Termin: ${f.appointment.value}` : '', '', f.message.value]
        .filter((l, i, a) => l || (a[i - 1] && a[i - 1] !== ''));
      location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
      $('.form__sent', form).hidden = false;
    });
  }
})();
