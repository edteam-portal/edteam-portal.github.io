// CARTE D'UN SYSTEME COLONISE (fenetre de detail) : le systeme comme sur la carte du jeu — l'etoile a gauche, les corps le long d'un axe (par ordre de distance), les stations accrochees
// sous leur corps. Donnees : EDSM (corps et stations, API publique, CORS ouvert) lues UNE fois par systeme et gardees 6 h dans le navigateur ; les installations viennent de la base du site.
// Une installation sans station connue d'EDSM (satellite, relais, mine : on ne peut pas s'y amarrer) n'a pas d'emplacement : elle est rangee sous la carte, jamais placee au hasard.
// window.EDTEAM_CARTE_SYS = { charger(nomSysteme) -> Promise<{corps, stations} | null>, svg({ corps, stations, items, esc }) -> html }
(function () {
  const TTL = 12 * 3600 * 1000, TTL_ABSENT = 20 * 60 * 1000, enCours = {};
  const stock = (() => { try { localStorage.setItem('edsm_test', '1'); localStorage.removeItem('edsm_test'); return localStorage; } catch (e) { return sessionStorage; } })();
  const norm = s => String(s || '').replace(/^(Orbital|Planetary|Surface) Construction Site: /i, '').replace(/^\$EXT_PANEL_ColonisationShip;\s*/, '').trim().toLowerCase();
  async function charger(nom) {
    const cle = 'edsm_sys:' + nom;
    try { const c = JSON.parse(stock.getItem(cle) || 'null'); if (c && Date.now() - c.ts < (c.data ? TTL : TTL_ABSENT)) return c.data; } catch (e) {}
    if (enCours[nom]) return enCours[nom];
    enCours[nom] = (async () => {
      try {
        const q = encodeURIComponent(nom), [rb, rs] = await Promise.all([fetch('https://www.edsm.net/api-system-v1/bodies?systemName=' + q), fetch('https://www.edsm.net/api-system-v1/stations?systemName=' + q)]);
        if (!rb.ok || !rs.ok) return null;
        const b = await rb.json(), s = await rs.json();
        if (!b || !Array.isArray(b.bodies) || !b.bodies.length) { try { stock.setItem(cle, JSON.stringify({ ts: Date.now(), data: null })); } catch (e) {} return null; }
        const data = {
            total: Number(b.bodyCount) || 0,
            corps: b.bodies.map(x => ({ id: x.bodyId, n: String(x.name || '').replace(b.name || nom, '').trim() || '', t: x.type, st: x.subType || '', d: Number(x.distanceToArrival) || 0, r: Number(x.radius) || (Number(x.solarRadius) ? Number(x.solarRadius) * 695700 : 0), par: x.parents || null, ring: !!(x.rings && x.rings.length) })),
            stations: ((s && s.stations) || []).map(x => ({ n: x.name, t: x.type, d: Number(x.distanceToArrival) || 0, e: x.economy || '', m: x.marketId }))
        };
        try { stock.setItem(cle, JSON.stringify({ ts: Date.now(), data })); } catch (e) {}
        return data;
      } catch (e) { return null; } finally { delete enCours[nom]; }
    })();
    return enCours[nom];
  }
  const COUL = c => /gas giant/i.test(c.st) ? ['#e8c98a', '#a8793a'] : /earth-like/i.test(c.st) ? ['#7fd0ff', '#2f7a4a'] : /water world/i.test(c.st) ? ['#6fb6ff', '#1e5aa8'] : /ammonia/i.test(c.st) ? ['#d8c38a', '#8a7a3a'] : /high metal/i.test(c.st) ? ['#d9b08a', '#7a5638'] : /metal.rich/i.test(c.st) ? ['#c9b8a8', '#6a5a4a'] : /rocky ice/i.test(c.st) ? ['#cfd2dc', '#6a6f80'] : /icy/i.test(c.st) ? ['#e8f1f8', '#7f9bb0'] : /rocky/i.test(c.st) ? ['#c2a888', '#6a5440'] : ['#c9cfd6', '#606a74'];
  const rayon = c => /gas giant/i.test(c.st) ? 28 : Math.max(11, Math.min(23, 7 + Math.sqrt(Math.max(c.r, 1500)) / 7.5));
  const ECO = { Industrial: '#FF9A1F', Extraction: '#F0524A', Military: '#D040E0', Colony: '#B8C7CF', 'High Tech': '#00D2E0', Hightech: '#00D2E0', Agriculture: '#66D960', Refinery: '#E09A50', Tourism: '#FFD54A' };

  // items : [{ nom, famille, nomType, eco, etat : 'fin' | 'cha', pct, lib }]
  function svg(o) {
    const esc = o.esc || (s => String(s)), corps = (o.corps || []).filter(c => c.t === 'Star' || c.t === 'Planet').sort((a, b) => a.d - b.d), stations = o.stations || [], items = o.items || [];
    if (!corps.length) return '';
    const AXE = 96;
    // lunes (parent = planete) : dessinees pres de leur planete ; le reste est sur l'axe
    const surAxe = corps.filter(c => !(c.par && c.par[0] && c.par[0].Planet !== undefined));
    const lunes = corps.filter(c => c.par && c.par[0] && c.par[0].Planet !== undefined);
    const etoilePrincipale = surAxe.find(c => c.t === 'Star' && c.d === 0);
    // 1) rattacher chaque installation a une station EDSM (par le nom) puis au corps le plus proche (par la distance a l'etoile)
    const parNom = new Map(stations.map(s => [norm(s.n), s]));
    const colonnes = new Map(), sansPlace = [];
    items.forEach(it => {
      const st = parNom.get(norm(it.nom));
      if (!st) { sansPlace.push(it); return; }
      let best = null;
      surAxe.forEach(c => { const dd = Math.abs(c.d - st.d); if (!best || dd < best.dd) best = { c, dd }; });
      if (!best || best.dd > Math.max(40, st.d * 0.08)) { sansPlace.push(it); return; }
      (colonnes.get(best.c.id) || colonnes.set(best.c.id, []).get(best.c.id)).push(Object.assign({ st }, it));
    });
    // 2) abscisses : une colonne de stations prend la place de ses etiquettes
    const largeur = pile => pile ? 22 + Math.max(...pile.map(it => Math.min(String(it.nom).length, 26) * 7.6 + (it.etat === 'cha' ? 30 : 0))) : 0;
    const xDe = new Map(); let x = 0, precLarg = 0;
    if (etoilePrincipale) { const pe = colonnes.get(etoilePrincipale.id); xDe.set(etoilePrincipale.id, 124); x = pe ? 124 + largeur(pe) + 46 : 150; precLarg = 0; }
    else x = 150;
    surAxe.filter(c => c !== etoilePrincipale).forEach((c, i) => {
      if (i > 0) x += Math.max(80, precLarg ? precLarg + 44 : 0);
      xDe.set(c.id, x); precLarg = largeur(colonnes.get(c.id));
    });
    const dernier = surAxe.filter(c => c !== etoilePrincipale).slice(-1)[0];
    const W = Math.max(760, Math.round((dernier ? xDe.get(dernier.id) + Math.max(40, largeur(colonnes.get(dernier.id)) + 20) : 300) + 30));
    const maxPile = Math.max(1, ...[...colonnes.values()].map(a => a.length));
    const ligne = 42, hCarte = AXE + 60 + maxPile * ligne, parRangee = Math.max(1, Math.floor((W - 30) / 175)), rangees = Math.ceil(sansPlace.length / parRangee), hSans = sansPlace.length ? 34 + rangees * 52 : 0, H = hCarte + hSans;
    let defs = `<defs><radialGradient id="cs-etoile" cx="35%" cy="50%" r="75%"><stop offset="0" stop-color="#fff2c8"/><stop offset=".35" stop-color="#ffb347"/><stop offset=".75" stop-color="#e0560f"/><stop offset="1" stop-color="#7a1f00"/></radialGradient>
      <radialGradient id="cs-halo" cx="0" cy="50%" r="70%"><stop offset="0" stop-color="#ff9a3c" stop-opacity=".55"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient>
      <pattern id="cs-grille" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="rgba(0,240,255,.05)"/></pattern>
      <filter id="cs-lueur"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
    corps.forEach(c => { if (c.t === 'Planet') { const [a, b] = COUL(c); defs += `<radialGradient id="cs-p${c.id}" cx="34%" cy="32%" r="78%"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`; } });
    defs += '</defs>';
    const icone = (it, px, defaut) => window.EDTEAM_ICONE ? window.EDTEAM_ICONE(it.famille || defaut, it.nomType || '', { eco: it.eco === 'High Tech' ? 'Hightech' : it.eco, vide: it.etat === 'cha', taille: px }) : '';
    let s = `<svg class="cs-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Carte du système" style="width:100%;height:auto;display:block">${defs}<rect width="${W}" height="${hCarte}" fill="url(#cs-grille)"/>
      <circle cx="0" cy="${AXE}" r="190" fill="url(#cs-halo)"/><circle cx="14" cy="${AXE}" r="86" fill="url(#cs-etoile)" filter="url(#cs-lueur)"/>
      <path d="M96 ${AXE}H${W - 8}" stroke="#6b7a82" stroke-width="1.4" opacity=".75"/>`;
    // corps sur l'axe
    surAxe.forEach(c => {
      if (c === etoilePrincipale) return;
      const cx = xDe.get(c.id), r = c.t === 'Star' ? 15 : rayon(c), occ = colonnes.has(c.id);
      s += `<g><title>${esc(c.n || 'Étoile')} · ${esc(c.st)} · ${Math.round(c.d)} ls</title>${occ ? `<circle cx="${cx}" cy="${AXE}" r="${r + 7}" fill="none" stroke="#2f8fc7" stroke-opacity=".75" stroke-width="3"/>` : ''}
        <circle cx="${cx}" cy="${AXE}" r="${r}" fill="${c.t === 'Star' ? '#ffb347' : `url(#cs-p${c.id})`}"/>${c.ring ? `<ellipse cx="${cx}" cy="${AXE}" rx="${r * 1.7}" ry="${r * .38}" fill="none" stroke="#b9c3cc" stroke-opacity=".7" transform="rotate(-18 ${cx} ${AXE})"/>` : ''}
        <text x="${cx}" y="${AXE - r - 12}" text-anchor="middle" font-size="12.5" fill="#8fa6af" stroke="#050403" stroke-width="2.4" paint-order="stroke">${esc(c.n || '')}</text></g>`;
      lunes.filter(l => l.par[0].Planet === c.id).forEach((l, k) => { s += `<circle cx="${cx + r + 9 + k * 11}" cy="${AXE - r + 2}" r="${Math.max(3, rayon(l) * .38)}" fill="url(#cs-p${l.id})"/>`; });
    });
    // corps doubles (meme barycentre « Null ») : un crochet les relie, comme sur la carte du jeu
    const bary = {}; surAxe.forEach(c => { const p = c.par && c.par[0]; if (p && p.Null !== undefined) (bary[p.Null] = bary[p.Null] || []).push(c); });
    Object.values(bary).filter(g => g.length > 1).forEach(g => { const xs = g.map(c => xDe.get(c.id)), ra = g.map(c => rayon(c)), top = AXE - Math.max(...ra) - 40; s += `<path d="M${xs[0]} ${AXE - ra[0] - 22}V${top}H${xs[xs.length - 1]}V${AXE - ra[ra.length - 1] - 22}" fill="none" stroke="#7a8a92" stroke-width="1.4" opacity=".85"/>`; });
    // stations accrochees sous leur corps
    colonnes.forEach((pile, id) => {
      const c = corps.find(k => k.id === id), etoile = c === etoilePrincipale, cx = xDe.get(id), r = etoile ? 0 : rayon(c);
      s += `<path d="M${cx} ${AXE + r + (etoile ? 0 : 8)}V${AXE + 60 + (pile.length - 1) * ligne}" stroke="#4d6b78" stroke-width="1.4" stroke-dasharray="3 3"/>`;
      pile.forEach((it, k) => {
        const y = AXE + 60 + k * ligne, cha = it.etat === 'cha', col = ECO[it.eco] || '#00F0FF';
        s += `<g><title>${esc(it.nom)}${it.lib ? ' · ' + esc(it.lib) : ''}</title><rect x="${cx - 15}" y="${y - 15}" width="30" height="30" rx="3" fill="rgba(3,10,14,.92)" stroke="${cha ? '#FF7100' : col}" stroke-width="1.5" ${cha ? 'stroke-dasharray="3 2.5"' : ''}/>
          <g transform="translate(${cx - 13} ${y - 13})">${icone(it, 26, 'Avant-poste orbital')}</g>
          <text x="${cx + 22}" y="${y - 2}" font-size="13.5" fill="#fff" stroke="#050403" stroke-width="2.6" paint-order="stroke">${esc(String(it.nom).length > 26 ? String(it.nom).slice(0, 25) + '…' : it.nom)}</text>
          <text x="${cx + 22}" y="${y + 12}" font-size="11.5" fill="${cha ? '#FFB44D' : '#7fa5ae'}" stroke="#050403" stroke-width="2.2" paint-order="stroke">${cha ? 'EN CONSTRUCTION · ' + (it.pct || 0) + ' %' : esc(String(it.lib || '').toLowerCase())}</text></g>`;
      });
    });
    // installations sans emplacement connu (satellites, relais, mines : EDSM ne les liste pas)
    if (sansPlace.length) {
      s += `<text x="14" y="${hCarte + 18}" font-size="10" letter-spacing="3" fill="#7fa5ae">EMPLACEMENT NON RELEVÉ</text><path d="M14 ${hCarte + 25}H${W - 14}" stroke="rgba(0,240,255,.25)"/>`;
      sansPlace.forEach((it, k) => {
        const px = 20 + (k % parRangee) * 175, y = hCarte + 52 + Math.floor(k / parRangee) * 52, cha = it.etat === 'cha', col = ECO[it.eco] || '#00F0FF';
        s += `<g><title>${esc(it.nom)}${it.lib ? ' · ' + esc(it.lib) : ''}</title><rect x="${px}" y="${y - 16}" width="32" height="32" rx="3" fill="rgba(3,10,14,.92)" stroke="${cha ? '#FF7100' : col}" stroke-width="1.5" ${cha ? 'stroke-dasharray="3 2.5"' : ''}/>
          <g transform="translate(${px + 3} ${y - 13})">${icone(it, 26, 'Installation orbitale')}</g>
          <text x="${px + 40}" y="${y - 2}" font-size="13" fill="#fff" stroke="#050403" stroke-width="2.6" paint-order="stroke">${esc(String(it.nom).length > 17 ? String(it.nom).slice(0, 16) + '…' : it.nom)}</text>
          <text x="${px + 40}" y="${y + 11}" font-size="11" fill="${cha ? '#FFB44D' : '#7fa5ae'}" stroke="#050403" stroke-width="2.2" paint-order="stroke">${cha ? (it.pct || 0) + ' %' : esc(String(it.lib || '').toLowerCase().slice(0, 20))}</text></g>`;
      });
    }
    const connus = corps.length, total = Number(o.total) || 0;
    if (total && connus < total) s += `<text x="${W - 12}" y="20" text-anchor="end" font-size="11.5" fill="#FFB44D" stroke="#050403" stroke-width="2.4" paint-order="stroke">carte incomplète : ${connus} corps sur ${total} connus</text>`;
    return s + '</svg>';
  }
  // ZOOM de la carte (apres svg()) : boutons + / − / 1:1 / tout voir, glisser pour deplacer, molette (sur la carte) ou double-clic pour zoomer. Le zoom change la fenetre de lecture (viewBox) :
  // le dessin reste net, aucune donnee supplementaire. L'echelle « 1:1 » ramene les textes a leur taille reelle (lisible), « tout voir » revient a la vue d'ensemble.
  function activerZoom(zone) {
    const svgEl = zone && zone.querySelector('svg.cs-svg'); if (!svgEl || zone.querySelector('.cs-vue')) return;
    if (!document.getElementById('cs-zoom-css')) {
      const st = document.createElement('style'); st.id = 'cs-zoom-css';
      st.textContent = '.cs-vue{position:relative;overflow:hidden;touch-action:none;user-select:none}.cs-vue.pan{cursor:grab}.cs-vue.pan.drag{cursor:grabbing}.cs-vue svg{width:100%;height:100%;display:block}'
        + '.cs-zb{display:flex;gap:4px;justify-content:flex-end;margin-bottom:6px}.cs-zb button{min-width:28px;height:28px;padding:0 6px;border:1px solid #00F0FF;background:rgba(0,0,0,.72);color:#00F0FF;font:inherit;font-size:.78em;cursor:pointer}.cs-zb button:hover{background:rgba(0,240,255,.22)}'
        + '.cs-ind{margin-top:6px;color:#FFB44D;font-size:.72em;letter-spacing:1px}.cs-ind.cache{display:none}';
      document.head.appendChild(st);
    }
    const vb = (svgEl.getAttribute('viewBox') || '0 0 760 300').split(/\s+/).map(Number), W = vb[2], H = vb[3];
    const vue = document.createElement('div'); vue.className = 'cs-vue';
    svgEl.parentNode.insertBefore(vue, svgEl); vue.appendChild(svgEl);
    svgEl.removeAttribute('style'); svgEl.setAttribute('preserveAspectRatio', 'xMinYMin meet');
    vue.insertAdjacentHTML('beforebegin', '<div class="cs-zb"><button type="button" data-z="+" title="Zoom avant" aria-label="Zoom avant">+</button><button type="button" data-z="-" title="Zoom arrière" aria-label="Zoom arrière">−</button><button type="button" data-z="1" title="Taille réelle : textes lisibles" aria-label="Taille réelle">1:1</button><button type="button" data-z="0" title="Tout voir" aria-label="Tout voir">⤢</button></div>');
    const ind = document.createElement('div'); ind.className = 'cs-ind'; ind.textContent = 'La carte est réduite : zoomez (molette sur la carte, boutons ou double-clic) pour lire les noms, puis glissez pour vous déplacer.'; vue.parentNode.insertBefore(ind, vue.nextSibling);
    // sc = echelle en pixels par unite du dessin (1 = taille reelle, textes lisibles) ; la fenetre grandit en hauteur avec le zoom pour montrer les stations sous l'axe
    let cw = vue.clientWidth || 1, scFit = cw / W, sc = scFit, vx = 0, vy = 0, hVue = Math.round(H * scFit);
    const scMax = () => Math.max(2.2, scFit * 3);
    const hauteur = x => Math.max(Math.round(H * scFit), Math.min(Math.round(H * x), 520));
    function appliquer() {
      cw = vue.clientWidth || 1; scFit = cw / W;
      sc = Math.max(scFit, Math.min(scMax(), sc)); hVue = hauteur(sc); vue.style.height = hVue + 'px';
      const vw = cw / sc, vh = hVue / sc;
      vx = Math.max(0, Math.min(W - vw, vx)); vy = Math.max(0, Math.min(H - vh, vy));
      svgEl.setAttribute('viewBox', vx.toFixed(1) + ' ' + vy.toFixed(1) + ' ' + vw.toFixed(1) + ' ' + vh.toFixed(1));
      vue.classList.toggle('pan', sc > scFit * 1.001);
      ind.classList.toggle('cache', !(scFit < 0.8 && sc < 0.75));
    }
    function zoomer(f, mx, my) {            // mx, my : point vise en pixels dans la fenetre (centre par defaut) ; ce point reste sous le curseur
      const cx = mx == null ? cw / 2 : mx, cy = my == null ? hVue / 2 : my, wx = vx + cx / sc, wy = vy + cy / sc;
      sc = Math.max(scFit, Math.min(scMax(), sc * f)); const h2 = hauteur(sc);
      vx = wx - cx / sc; vy = wy - Math.min(cy, h2) / sc; appliquer();
    }
    vue.previousElementSibling.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return; const z = b.getAttribute('data-z');
      if (z === '+') zoomer(1.6); else if (z === '-') zoomer(1 / 1.6);
      else if (z === '0') { sc = scFit; vx = 0; vy = 0; appliquer(); }
      else { const ancre = vx + cw / sc / 2; sc = Math.max(1, scFit); vx = ancre - cw / sc / 2; vy = 0; appliquer(); }
    });
    vue.addEventListener('wheel', e => { if (e.deltaY > 0 && sc <= scFit * 1.001) return;      // deja a la vue d'ensemble : la molette fait defiler la fenetre comme d'habitude
      e.preventDefault(); const r = vue.getBoundingClientRect(); zoomer(e.deltaY < 0 ? 1.25 : 1 / 1.25, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    vue.addEventListener('dblclick', e => { if (e.target.closest('.cs-zb')) return; const r = vue.getBoundingClientRect(); zoomer(1.8, e.clientX - r.left, e.clientY - r.top); });
    let drag = null;
    vue.addEventListener('pointerdown', e => { if (sc <= scFit * 1.001 || e.button !== 0 || e.target.closest('.cs-zb')) return; drag = { x: e.clientX, y: e.clientY, vx, vy }; vue.classList.add('drag'); try { vue.setPointerCapture(e.pointerId); } catch (x) { /* rien */ } });
    vue.addEventListener('pointermove', e => { if (!drag) return; vx = drag.vx - (e.clientX - drag.x) / sc; vy = drag.vy - (e.clientY - drag.y) / sc; appliquer(); });
    const fin = () => { drag = null; vue.classList.remove('drag'); };
    vue.addEventListener('pointerup', fin); vue.addEventListener('pointercancel', fin);
    if (window.ResizeObserver) new ResizeObserver(() => { if (vue.clientWidth !== cw) { const rapport = sc / scFit; cw = vue.clientWidth || 1; scFit = cw / W; sc = scFit * rapport; appliquer(); } }).observe(vue);
    appliquer();
  }
  window.EDTEAM_CARTE_SYS = { charger, svg, norm, activerZoom };
})();
