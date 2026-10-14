// PROFIL D'UN SYSTEME COLONISE (fenetre de detail d'un systeme) : totaux des indicateurs (developpement, technologie, securite, richesse, niveau de vie,
// population, points de construction) additionnes sur les installations dont le TYPE est reconnu d'apres la recette du chantier (colonisation-types.js),
// avec les effets par type de colonisation-effets.js (feuille communautaire DaftMav : ESTIMATIONS) et les pictogrammes de colonisation-visuels.js.
// Depend de : window.EDTEAM_EFFETS, window.EDTEAM_ICONE, window.typeDepuisRecette. Aucune lecture de la base.
(function () {
  const ORDRE = [['NIVEAUX DU SYSTÈME', ['dev', 'tec', 'sec', 'ric', 'niv']], ['POPULATION', ['pi', 'pm']]];
  const ICO = { dev: ['⚙', '#FFB44D'], tec: ['⌬', '#00F0FF'], sec: ['⛨', '#7fb0ff'], ric: ['◈', '#FFD700'], niv: ['♥', '#FF8fb0'], pi: ['☺', '#3DDC97'], pm: ['⌂', '#3DDC97'], t2: ['2', '#b8a0ff'], t3: ['3', '#b8a0ff'] };
  const COURT = { dev: 'Dév.', tec: 'Tech.', sec: 'Séc.', ric: 'Rich.', niv: 'Vie', pi: 'Pop.', pm: 'Pop. max', t2: 'T2', t3: 'T3' };
  const AIDE = { dev: 'Niveau de développement', tec: 'Niveau de technologie', sec: 'Niveau de sécurité', ric: 'Niveau de richesse', niv: 'Niveau de vie', pi: 'Augmentation initiale de la population', pm: 'Augmentation maximale de la population', t2: 'Points de construction T2', t3: 'Points de construction T3' };
  const f = v => v > 0 ? '+' + v : String(v), cl = v => v > 0 ? 'pf-pos' : v < 0 ? 'pf-neg' : 'pf-zer';
  const CSS = `
.pf-seg{display:inline-flex}.pf-seg button{background:none;border:1px solid rgba(0,240,255,.45);color:#8fb7bf;font:inherit;font-size:.78em;letter-spacing:1px;padding:4px 12px;cursor:pointer}.pf-seg button+button{border-left:0}.pf-seg button.on{background:rgba(0,240,255,.16);color:#fff;border-color:#00F0FF}
.pf-profil{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);border:1px solid rgba(0,240,255,.35);background:linear-gradient(180deg,rgba(0,40,50,.35),rgba(3,10,14,.6));clip-path:polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,16px 100%,0 calc(100% - 16px))}
.pf-band{grid-column:1/3;padding:12px 18px 6px;border-bottom:1px solid rgba(0,240,255,.2)}.pf-pg{padding:14px 18px 12px;border-right:1px solid rgba(0,240,255,.2)}.pf-pd{padding:14px 18px 12px}
.pf-grp{color:#7fa5ae;font-size:10px;letter-spacing:3px;margin:10px 0 2px;display:flex;align-items:center;gap:8px}.pf-grp:after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(0,240,255,.3),transparent)}.pf-grp.f{margin-top:0}
.pf-ind{display:grid;grid-template-columns:22px 118px minmax(0,1fr) 74px;gap:8px;align-items:center;padding:4px 0}
.pf-ic{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;border:1px solid}.pf-lb{color:#d8e6ea;font-size:.95em}
.pf-jau{position:relative;height:16px;background:rgba(0,0,0,.45);border:1px solid #1f3a44;overflow:hidden}.pf-jau:before{content:"";position:absolute;left:50%;top:0;bottom:0;width:1px;background:#6b8a94;z-index:3}
.pf-jau .tk{position:absolute;top:0;bottom:0;width:1px;background:rgba(255,255,255,.07)}.pf-jau i{position:absolute;top:2px;bottom:2px;border-radius:1px}
.pf-jau .ext{background:repeating-linear-gradient(135deg,rgba(255,255,255,.45) 0 3px,transparent 3px 6px)}.pf-jau .pre{opacity:.38;top:5px;bottom:5px;background:#fff}
.pf-val{text-align:right;font-weight:bold;font-size:1.15em;font-variant-numeric:tabular-nums;white-space:nowrap}
.pf-pos{color:#3DDC97}.pf-neg{color:#FF6B5E}.pf-zer{color:#8b97a0}
.pf-tags{display:flex;gap:6px;flex-wrap:wrap}.pf-tags span{border:1px solid #456;padding:3px 10px;font-size:.8em;letter-spacing:1px;border-radius:2px;color:#cfe9dd}
.pf-cartes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:2px;max-height:470px;overflow-y:auto;padding-right:4px;scrollbar-width:thin}
.pf-car{background:rgba(0,0,0,.45);border:1px solid #2c2c2c;border-left:3px solid #00FF66;padding:7px 10px;border-radius:3px}.pf-car.cha{border-left-color:#FF7100;opacity:.92}.pf-car.dec{border-left-color:#FFB44D;background:rgba(255,180,77,.06)}.pf-car.off{opacity:.28;filter:grayscale(.6)}
.pf-cw{display:flex;gap:9px;align-items:flex-start}.pf-cb{flex:1;min-width:0}
.pf-t{display:flex;flex-wrap:wrap;justify-content:space-between;gap:1px 8px;align-items:baseline}.pf-t b{flex:1 1 130px;min-width:0;color:#fff;font-weight:normal;font-size:.95em;word-break:break-word}.pf-t span{font-size:.62em;letter-spacing:1.5px;white-space:nowrap}
.pf-ty{color:#8fb7bf;font-size:.74em;letter-spacing:1px;margin:1px 0 4px}
.pf-poss{color:#FFB44D;font-size:.7em;line-height:1.35;margin:-1px 0 4px}
.pf-sel{background:#0b1418;border:1px solid #FFB44D;color:#FFB44D;font:inherit;font-size:.74em;padding:3px 4px;max-width:100%;margin-top:5px;cursor:pointer}
.pf-btn{background:none;border:1px solid #6b7680;color:#9fb0b8;font:inherit;font-size:.7em;letter-spacing:1px;padding:2px 8px;margin-top:5px;cursor:pointer}.pf-btn:hover{border-color:#fff;color:#fff}
.pf-pil{display:flex;flex-wrap:wrap;gap:4px}.pf-pil span{font-size:.72em;padding:1px 6px;border:1px solid;border-radius:2px;white-space:nowrap}
.pf-pil .p{color:#3DDC97;border-color:#3DDC9760;background:rgba(61,220,151,.07)}.pf-pil .m{color:#FF6B5E;border-color:#FF6B5E60;background:rgba(255,107,94,.07)}.pf-pil .u{color:#8b97a0;border-color:#4a5a62;border-style:dashed}
.pf-bdr{display:flex;align-items:center;overflow-x:auto;padding:6px 0 2px}.pf-bd{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:78px}.pf-bd span{font-size:10px;color:#8fb7bf;max-width:84px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pf-lien{flex:1;min-width:14px;height:1px;background:linear-gradient(90deg,rgba(0,240,255,.15),rgba(0,240,255,.5),rgba(0,240,255,.15));margin-bottom:14px}
.pf-fiab{display:flex;gap:14px;flex-wrap:wrap;font-size:.8em;color:#9fb0b8;margin-top:10px;padding-top:8px;border-top:1px dashed rgba(255,255,255,.12)}.pf-fiab b{color:#fff;font-weight:normal}.pf-pt{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px}
.pf-pied{margin-top:8px;color:#8b97a0;font-size:.78em;line-height:1.5}
#pf-choix{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:14px}
.pf-cm{background:rgba(10,5,0,.98);border:1px solid #FF7100;box-shadow:0 0 30px rgba(255,113,0,.25);width:min(1100px,100%);max-height:92vh;overflow-y:auto}
.pf-cm-h{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-bottom:1px solid rgba(255,113,0,.3);background:rgba(255,113,0,.05)}.pf-cm-h small{color:#888;letter-spacing:2px;font-size:.75em;display:block}.pf-cm-n{color:#FF7100;font-size:1.35em;font-weight:bold;letter-spacing:2px}
.pf-cm-a{padding:12px 20px;color:#c9d6db;font-size:.88em;line-height:1.5;border-bottom:1px dashed #2a2a2a}.pf-cm-a b{color:#fff;font-weight:normal;border-bottom:1px dotted #FFB44D}
.pf-cm-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;padding:14px 20px 20px}
.pf-cc{background:rgba(0,0,0,.5);border:1px solid #2c3a40;border-left:3px solid #00F0FF;padding:10px 12px;display:flex;flex-direction:column;gap:5px}
.pf-cc-t{display:flex;gap:10px;align-items:center;margin-bottom:3px}.pf-cc-t b{color:#fff;font-weight:normal;font-size:1.02em}.pf-cc-t small{display:block;color:#7fa5ae;font-size:.7em;letter-spacing:1px}
.pf-cl{display:grid;grid-template-columns:minmax(0,1fr) auto 30px;gap:8px;align-items:center;font-size:.8em;color:#d8e6ea}.pf-cl b{text-align:right}
.pf-chv{display:inline-flex;align-items:center;font-size:12px;line-height:1;font-weight:bold}.pf-chv i{font-style:normal;color:#35424b;width:6px;text-align:center}.pf-chv i.p{color:#1E90FF}.pf-chv i.n{color:#FF3B30}.pf-chv u{width:6px}
.pf-ok{margin-top:6px;background:rgba(0,240,255,.1);border:1px solid #00F0FF;color:#00F0FF;font:inherit;font-size:.8em;letter-spacing:1px;padding:5px 8px;cursor:pointer}.pf-ok:hover{background:rgba(0,240,255,.25);color:#fff}
@media (max-width:900px){.pf-profil{grid-template-columns:1fr}.pf-band{grid-column:1}.pf-pg{border-right:0;border-bottom:1px solid rgba(0,240,255,.2)}.pf-cartes{grid-template-columns:1fr}}`;
  if (!document.getElementById('pf-css')) { const st = document.createElement('style'); st.id = 'pf-css'; st.textContent = CSS; document.head.appendChild(st); }


  // ---- AIDE A LA DECLARATION : fenetre de comparaison (l'architecte compare avec le panneau « Effets de l'installation » du jeu, puis choisit)
  const EFFETS_JEU = [['dev', 'Développement'], ['pi', 'Population initiale'], ['pm', 'Population max'], ['tec', 'Technologie'], ['sec', 'Sécurité'], ['niv', 'Niveau de vie'], ['ric', 'Richesse']];   // ordre d'affichage du jeu
  const chevrons = v => {
    const g = [0, 0, 0, 0], d = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (v < 0) for (let k = 0; k < -v && k < 4; k++) g[3 - k] = 1; else for (let k = 0; k < v && k < 9; k++) d[k] = 1;
    return '<span class="pf-chv">' + g.map(x => `<i class="${x ? 'n' : ''}">‹</i>`).join('') + '<u></u>' + d.map(x => `<i class="${x ? 'p' : ''}">›</i>`).join('') + '</span>';
  };
  window.coloChoixType = function (mid) {
    const c = (window.__pfChoix || {})[mid]; if (!c) return;
    const esc = c.esc, E = window.EDTEAM_EFFETS;
    const carte = r => {
      const lignes = EFFETS_JEU.filter(([k]) => r[k]).map(([k, lb]) => `<div class="pf-cl"><span>${lb}</span>${chevrons(r[k])}<b class="${r[k] > 0 ? 'pf-pos' : 'pf-neg'}">${f(r[k])}</b></div>`).join('') || '<div class="pf-cl"><span style="color:#8b97a0">aucun effet de ce type</span></div>';
      return `<div class="pf-cc"><div class="pf-cc-t">${window.EDTEAM_ICONE(r.f, r.n, { eco: r.eco, taille: 38 })}<div><b>${esc(r.n)}</b><small>${esc(r.f)}</small></div></div>${lignes}<button type="button" class="pf-ok" onclick="document.getElementById('pf-choix').remove();${c.declarer}('${mid}','${esc(r.f)}|${esc(r.n)}')">C'EST CELUI-CI</button></div>`;
    };
    const fam = [...new Set(c.choix.map(r => r.f))];
    const corps = fam.map(F => (fam.length > 1 ? `<div class="pf-grp f" style="grid-column:1/-1">${esc(F.toUpperCase())}</div>` : '') + c.choix.filter(r => r.f === F).map(carte).join('')).join('');
    const old = document.getElementById('pf-choix'); if (old) old.remove();
    const m = document.createElement('div'); m.id = 'pf-choix';
    m.onclick = ev => { if (ev.target === m) m.remove(); };
    m.innerHTML = `<div class="pf-cm"><div class="pf-cm-h"><div><small>DÉCLARER LE TYPE</small><div class="pf-cm-n">${esc(c.nom)}</div></div><span onclick="document.getElementById('pf-choix').remove()" style="cursor:pointer;color:#FF7100;font-weight:bold">X</span></div>
      <div class="pf-cm-a">Dans le jeu : ouvrez la carte de colonisation, cliquez sur cette installation et regardez le panneau <b>« Effets de l'installation »</b>. Comparez <b>quelles lignes sont présentes, et si elles montent (bleu) ou baissent (rouge)</b> avec les cartes ci-dessous, puis choisissez. Les lignes de population peuvent s'ajouter dans le jeu : ne les prenez pas en compte.</div>
      <div class="pf-cm-g">${corps}</div></div>`;
    document.body.appendChild(m);
  };

  // o = { esc, nomStation(station), pct(chantier) -> %, mode : 'actuel' | 'prevu', onMode : nom de la fonction globale appelee par le selecteur }
  window.coloProfilHtml = function (s, o) {
    const E = window.EDTEAM_EFFETS, esc = o.esc; if (!E || !window.EDTEAM_ICONE) return '';
    const mode = o.mode === 'prevu' ? 'prevu' : 'actuel';
    const inst = (c, etat) => {
      let t = typeof window.typeDepuisRecette === 'function' ? window.typeDepuisRecette(c.marchandises) : null;
      // le journal du jeu donne le TYPE EXACT d'un port orbital (StationType) : il tranche entre Coriolis / base asteroide, et complete une recette absente
      const PORTS = { Coriolis: 'Coriolis', AsteroidBase: 'Asteroid Base', Ocellus: 'Ocellus', Orbis: 'Orbis', Dodec: 'Dodecahedron' };
      // sans recette relevee (station constatee a l'amarrage), le type de station du journal donne au moins la FAMILLE ; l'economie departage ensuite
      const FAMILLES = { Outpost: ['Avant-poste orbital', ['Commercial', 'Industrial', 'Criminal', 'Civilian', 'Scientific', 'Military']], CraterOutpost: ['Port planétaire', ['Outpost Civilian', 'Outpost Industrial', 'Outpost Scientific']] };
      if (!t && etat === 'fin' && FAMILLES[c.type]) t = { libelle: FAMILLES[c.type][0], famille: FAMILLES[c.type][0], precis: false, noms: FAMILLES[c.type][1], premier: false };
      if (etat === 'fin' && PORTS[c.type]) t = { libelle: PORTS[c.type], famille: 'Port orbital', precis: true, noms: [PORTS[c.type]], premier: !!(t && t.premier) };
      if (c.declare && /\|/.test(String(c.declare))) { const d = String(c.declare).split('|'); t = { libelle: d[1], famille: d[0], precis: true, noms: [d[1]], premier: false, declare: true }; }
      return { mid: String(c.market_id || ''), declare: !!(t && t.declare), nom: /ColonisationShip/i.test(String(c.station || "")) ? "Premier site (navire de colonisation)" : o.nomStation(c.station), noms: t ? t.noms : [], famille: t ? t.famille : '', premier: !!(t && t.premier), eco: (c.economies && c.economies[0] && c.economies[0][0]) || '', ecoPart: (c.economies && c.economies[0] && Number(c.economies[0][1])) || 0, ecoSecond: (c.economies && c.economies[1] && Number(c.economies[1][1])) || 0, etat, pct: etat === 'cha' ? o.pct(c) : 100,
        lib: t ? (t.precis ? t.libelle : t.famille).toUpperCase() : 'TYPE NON RELEVÉ' };
    };
    const tout = (s.finies || []).map(c => inst(c, 'fin')).concat((s.chantiers || []).map(c => inst(c, 'cha')));
    if (!tout.length) return '';
    const actifs = tout.filter(i => mode === 'prevu' || i.etat === 'fin');
    const P = E.profilSysteme(actifs), Pa = E.profilSysteme(tout.filter(i => i.etat === 'fin'));
    const mx = Math.max(10, ...E.CLES.map(k => Math.max(Math.abs(P.indic[k].min), Math.abs(P.indic[k].max)))), ech = Math.ceil(mx / 5) * 5, w = v => Math.min(50, Math.abs(v) / ech * 50);
    const jauge = k => {
      const r = P.indic[k], base = Math.abs(r.min) <= Math.abs(r.max) ? r.min : r.max, far = base === r.min ? r.max : r.min, c = ICO[k][1];
      let h = [-ech, -ech / 2, ech / 2, ech].map(t => `<span class="tk" style="left:${50 + t / ech * 50}%"></span>`).join('');
      if (mode === 'prevu') { const a = Pa.indic[k].min; h += `<i class="pre" style="left:${a >= 0 ? 50 : 50 - w(a)}%;width:${w(a)}%"></i>`; }
      h += `<i style="left:${base >= 0 ? 50 : 50 - w(base)}%;width:${w(base)}%;background:linear-gradient(${base >= 0 ? '90deg' : '270deg'},${base >= 0 ? '#1f8f63,#3DDC97' : '#a63f35,#FF6B5E'});box-shadow:0 0 8px ${base >= 0 ? '#3DDC9788' : '#FF6B5E88'}"></i>`;
      if (base !== far) h += `<i class="ext" style="left:${far >= 0 ? 50 + (base >= 0 ? w(base) : 0) : 50 - w(far)}%;width:${w(far) - (Math.sign(base) === Math.sign(far) ? w(base) : 0)}%"></i>`;
      return `<div class="pf-ind" title="${AIDE[k]}"><span class="pf-ic" style="color:${c};border-color:${c}66;background:${c}14">${ICO[k][0]}</span><span class="pf-lb">${E.LIBELLES[k]}</span><div class="pf-jau">${h}</div><span class="pf-val ${cl(r.min + r.max)}">${r.min === r.max ? f(r.min) : f(r.min) + ' à ' + f(r.max)}</span></div>`;
    };
    const pic = (i, c, px) => window.EDTEAM_ICONE(i.famille || 'Avant-poste orbital', c.length === 1 ? c[0].n : '', { eco: c.length === 1 ? c[0].eco : '', vide: i.etat === 'cha', taille: px });
    const cand = i => i.noms.length ? E.candidats(i) : [];
    const affine = i => i.noms.length && i.eco && E.candidats(i).length < E.candidats(Object.assign({}, i, { eco: '' })).length;
    const bandeau = tout.map(i => `<div class="pf-bd" style="${mode === 'prevu' || i.etat === 'fin' ? '' : 'opacity:.25'}" title="${esc(i.nom)} · ${esc(i.lib)}">${pic(i, cand(i), 46)}<span>${esc(i.nom)}</span></div>`).join('<i class="pf-lien"></i>');
    const cartes = tout.map(i => {
      const c = cand(i); let pil = '';
      if (!c.length) pil = `<span class="u">${i.noms.length ? 'pas dans la feuille' : 'type non relevé'}</span>`;
      else if (c.length > 1) pil = '';
      else E.CLES.filter(k => k !== 't2' && k !== 't3').forEach(k => { const v = c.map(r => r[k] + (i.premier ? (E.BONUS_PREMIER[k] || 0) : 0)), a = Math.min(...v), b = Math.max(...v); if (a || b) pil += `<span class="${(a + b) >= 0 ? 'p' : 'm'}">${COURT[k]} ${a === b ? f(a) : f(a) + '…' + f(b)}</span>`; });
      const st = i.etat === 'fin' ? '<span style="color:#00FF66">✔ TERMINÉE</span>' : `<span style="color:#FF7100">EN CONSTRUCTION · ${i.pct} %</span>`;
      const inc = c.length > 1 ? ' <span style="color:#FFB44D;border-bottom:1px dotted #FFB44D;cursor:help" title="Type à déclarer par l\'architecte du système">≈</span>' : '';
      const ind = affine(i) ? ` <span style="color:#7fe9ff;border-bottom:1px dotted #7fe9ff;cursor:help;font-size:.8em" title="Type affiné d'après l'économie de la station relevée à l'amarrage (indice : les liens de marché du système peuvent la modifier).">éco.</span>` : '';
      let ctl = '';
      if (o.estArchitecte && i.mid && o.declarer) {
        if (i.declare) ctl = `<button type="button" class="pf-btn" onclick="${o.declarer}('${i.mid}','')" title="Retirer le type que vous avez déclaré">RETIRER LE TYPE DÉCLARÉ</button>`;
        else if (c.length !== 1) {
          (window.__pfChoix = window.__pfChoix || {})[i.mid] = { nom: i.nom, choix: c.length > 1 ? c : E.ROWS, declarer: o.declarer, esc };
          ctl = `<button type="button" class="pf-sel" onclick="coloChoixType('${i.mid}')" title="Vous êtes l\'architecte : comparez avec le jeu puis déclarez le type (visible de l\'escadron, retirable)">DÉCLARER LE TYPE…</button>`;
        }
      }
      return `<div class="pf-car ${i.etat === 'cha' ? 'cha' : ''} ${c.length > 1 ? 'dec' : ''} ${mode === 'prevu' || i.etat === 'fin' ? '' : 'off'}"><div class="pf-cw">${pic(i, c, 44)}<div class="pf-cb"><div class="pf-t"><b>${esc(i.nom)}${inc}${ind}</b>${st}</div><div class="pf-ty">${esc(i.lib)}${i.premier ? ' · PREMIER SITE' : ''}${i.declare ? ' · DÉCLARÉ PAR L\'ARCHITECTE' : ''}</div>${c.length > 1 ? `<div class="pf-poss" title="Types possibles : l'architecte du système peut déclarer le bon">≈ ${esc(c.slice(0, 4).map(r => r.n).join(' · '))}${c.length > 4 ? ' · +' + (c.length - 4) : ''}</div>` : ''}<div class="pf-pil">${pil}</div>${ctl}</div></div></div>`;
    }).join('');
    const groupes = ORDRE.map(([t, ks]) => `<div class="pf-grp ${t === ORDRE[0][0] ? 'f' : ''}">${t}</div>${ks.map(jauge).join('')}`).join('');
    const eco = Object.keys(P.eco).sort((a, b) => P.eco[b] - P.eco[a]).map(k => `<span>${esc(k)} × ${P.eco[k]}</span>`).join('') || '<span style="color:#777">—</span>';
    const n = actifs.length, nul = P.surs + P.incertains === 0;
    return `<div><div style="color:#00F0FF;letter-spacing:2px;font-size:1em;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;"><span>&gt; PROFIL DU SYSTÈME <span style="color:#8b97a0;font-size:.8em;letter-spacing:0;">d'après ${n} installation${n > 1 ? 's' : ''} relevée${n > 1 ? 's' : ''}</span></span>
        <span class="pf-seg"><button class="${mode === 'actuel' ? 'on' : ''}" onclick="${o.onMode}('actuel')">ACTUEL</button><button class="${mode === 'prevu' ? 'on' : ''}" onclick="${o.onMode}('prevu')">AVEC LES CHANTIERS</button></span></div>
        <div class="pf-profil"><div class="pf-band"><div class="pf-grp f">VUE D'ENSEMBLE</div><div class="pf-bdr">${bandeau}</div></div>
        <div class="pf-pg">${nul ? '<div style="color:#8b97a0;font-size:.85em;margin-bottom:8px;">Aucun type d\'installation reconnu pour l\'instant : le profil se remplit quand la liste des marchandises d\'un chantier est relevée.</div>' : ''}${groupes}<div class="pf-grp">ÉCONOMIES</div><div class="pf-tags">${eco}</div></div>
        <div class="pf-pd"><div class="pf-grp f">EFFET DE CHAQUE INSTALLATION</div><div class="pf-cartes">${cartes}</div></div></div>
        <div class="pf-fiab"><span><i class="pf-pt" style="background:#3DDC97"></i><b>${P.surs}</b> de type sûr</span><span><i class="pf-pt" style="background:#FFB44D"></i><b>${P.incertains}</b> en orange : à déclarer par l'architecte (non comptées)</span><span><i class="pf-pt" style="background:#6b7680"></i><b>${P.inconnus}</b> sans type ou hors feuille (non comptées)</span>${P.ports > 1 ? `<span style="color:#FFB44D">⚠ ${P.ports} ports comptés : le jeu applique un bonus au premier et un malus aux suivants, non chiffrés ici (total à vérifier)</span>` : ''}${mode === 'prevu' ? '<span><i class="pf-pt" style="background:#fff;opacity:.5"></i>trait clair = valeur actuelle</span>' : ''}</div>
        <div class="pf-pied">Estimations d'après la feuille communautaire de CMDR DaftMav : le jeu n'affiche pas de total de système pour les vérifier. Seules les installations dont le <b>type est connu</b> sont additionnées ; une installation en <b>orange</b> n'ajoute rien tant que l'architecte n'a pas déclaré son type (on ne devine pas). Les valeurs de la feuille sont corrigées d'après le jeu pour les avant-postes industriel, civil et militaire. Seules les installations vues par le plugin sont comptées ; celles qui existaient déjà ne le sont pas. Les points de construction ne sont pas affichés : leur coût dépend de ce qui a été construit avant. Le premier site (port principal) peut recevoir des effets calculés différemment par le jeu.</div></div>`;
  };
})();
