// FENETRES « MATERIAU A APPORTER » (clic sur une marchandise de A APPORTER EN PRIORITE) et « ARCHITECTE DE COLONISATION » (clic sur un architecte) :
// meme langage visuel que la fenetre d'un systeme (cadre aux coins coupes, marges, en-tete fixe, defilement interne), pictogrammes des installations au lieu de longues lignes de texte.
// Ce fichier ne fait que fabriquer le HTML ; les actions (copier, voir sur la carte, detail, fermer) restent celles de la page. Aucune lecture de la base.
(function () {
  const O = '#FF7100', B = '#00F0FF', G = '#00FF66', GOLD = '#FFD700';
  const CSS = `
.cx-p{--c:${O};position:relative;width:min(1180px,100%);height:min(90vh,860px);display:flex;flex-direction:column;background:linear-gradient(180deg,rgba(var(--cr,255,113,0),.07),rgba(8,4,0,.985) 22%);border:1px solid var(--c);box-shadow:0 0 36px rgba(var(--cr,255,113,0),.22);
  clip-path:polygon(0 0,calc(100% - 18px) 0,100% 18px,100% 100%,18px 100%,0 calc(100% - 18px));font-family:inherit}
.cx-p.or{--c:${GOLD};--cr:255,215,0}
.cx-h{flex:none;display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;padding:15px 64px 13px 24px;border-bottom:1px solid color-mix(in srgb,var(--c) 40%,transparent)}
.cx-h small{display:block;color:#888;letter-spacing:3px;font-size:.72em}.cx-h .n{display:block;color:var(--c);font-size:1.5em;font-weight:bold;letter-spacing:3px;text-shadow:0 0 14px color-mix(in srgb,var(--c) 45%,transparent);overflow-wrap:anywhere}
.cx-x{position:absolute;top:12px;right:18px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;color:var(--c);border:1px solid color-mix(in srgb,var(--c) 55%,transparent);cursor:pointer;font-weight:bold;background:rgba(0,0,0,.35)}.cx-x:hover{background:var(--c);color:#050403}
.cx-total{text-align:right}.cx-total b{display:block;color:${GOLD};font-size:2em;line-height:1.05;text-shadow:0 0 16px rgba(255,215,0,.4);font-variant-numeric:tabular-nums}.cx-total span{color:#9fb0b8;font-size:.82em}
.cx-tuiles{display:flex;gap:9px;flex-wrap:wrap}
.cx-t{min-width:98px;text-align:center;padding:7px 14px;border:1px solid var(--k);background:linear-gradient(160deg,rgba(0,0,0,.6),rgba(0,0,0,.3));position:relative;overflow:hidden}
.cx-t:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 100% 0,var(--k),transparent 65%);opacity:.15}
.cx-t b{position:relative;display:block;color:#fff;font-size:1.35em;line-height:1.1;font-variant-numeric:tabular-nums}.cx-t span{position:relative;color:#9fb0b8;font-size:.64em;letter-spacing:2px}
.cx-rep{flex:none;padding:12px 24px 4px}.cx-rep .t{color:#7fa5ae;font-size:.68em;letter-spacing:3px;margin-bottom:6px}
.cx-bar{display:flex;height:12px;gap:2px}.cx-bar i{display:block;min-width:3px;background:var(--k);box-shadow:0 0 8px var(--k);opacity:.9}
.cx-leg{display:flex;flex-wrap:wrap;gap:4px 16px;margin-top:6px;color:#9fb0b8;font-size:.74em}.cx-leg span:before{content:"";display:inline-block;width:8px;height:8px;background:var(--k);margin-right:6px}
.cx-q{background:#0b1418;border:1px solid #2c4a54;color:#e6f0f3;font:inherit;font-size:.82em;padding:7px 10px;width:220px;outline:0}.cx-q:focus{border-color:${B}}
.cx-c{flex:1;min-height:0;overflow-y:auto;padding:14px 24px 16px;scrollbar-width:thin;scrollbar-color:var(--c) #0b0b0b}
.cx-l{display:grid;grid-template-columns:repeat(auto-fill,minmax(520px,1fr));gap:10px}
.cx-l.un{grid-template-columns:1fr}
.cx-r{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr) auto;gap:8px 18px;align-items:center;background:rgba(0,0,0,.5);border:1px solid #2c2c2c;border-left:3px solid var(--k,${O});padding:11px 14px}
.cx-n{display:flex;align-items:center;gap:11px;min-width:0}.cx-n .i{flex:none}
.cx-n b{display:flex;align-items:center;gap:7px;color:${B};font-size:1.05em;overflow-wrap:anywhere}.cx-n small{display:flex;align-items:center;gap:7px;color:#cfd8dc;font-size:.82em;margin-top:2px}
.cx-cp{background:transparent;border:1px solid #3a5560;color:#7fa5ae;font:inherit;font-size:.62em;letter-spacing:1px;padding:1px 7px;cursor:pointer;flex:none}.cx-cp:hover{border-color:${B};color:#fff}
.cx-av .reste{color:${GOLD};font-weight:bold;font-size:1.25em;font-variant-numeric:tabular-nums}.cx-av .reste small{color:#9fb0b8;font-weight:normal;font-size:.62em;letter-spacing:1.5px;display:block}
.cx-av .barre{height:6px;background:rgba(255,255,255,.08);margin:5px 0 3px}.cx-av .barre i{display:block;height:100%}.cx-av .lv{color:#8b97a0;font-size:.72em}
.cx-ac{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.cx-ac button{font:inherit;font-size:.72em;letter-spacing:1.2px;padding:6px 11px;cursor:pointer;background:transparent;border:1px solid ${B};color:${B};white-space:nowrap}.cx-ac button:hover{background:rgba(0,240,255,.15);color:#fff}
.cx-ac button.d{border-color:${GOLD};color:${GOLD};background:rgba(255,215,0,.07)}.cx-ac button.d:hover{background:${GOLD};color:#050403}
.cx-s{background:rgba(0,0,0,.5);border:1px solid #2c2c2c;border-left:3px solid ${O};padding:11px 14px;display:flex;flex-direction:column;gap:9px}
.cx-s .top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.cx-s .top b{color:${B};font-size:1.08em;overflow-wrap:anywhere}.cx-s .top small{color:#7d9aa3;font-size:.76em;display:block;margin-top:1px}
.cx-ic{display:flex;flex-wrap:wrap;gap:6px 7px}
.cx-i{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;width:36px;height:36px;border:1px solid var(--k);background:rgba(3,10,14,.92);position:relative}
.cx-i.cha{border-style:dashed;border-color:${O}}.cx-i em{position:absolute;right:-5px;bottom:-6px;font-style:normal;font-size:.58em;color:#FFB44D;background:#050403;border:1px solid ${O};padding:0 3px;border-radius:2px}
.cx-pil{display:flex;gap:6px;flex-wrap:wrap}
.cx-pil span{font-size:.68em;letter-spacing:1.5px;padding:2px 9px;border:1px solid;border-radius:2px}
.cx-vide{color:#8b97a0;text-align:center;padding:30px 12px;line-height:1.6}
.cx-pied{flex:none;color:#7f8b92;font-size:.76em;line-height:1.5;padding:9px 24px 13px;border-top:1px dashed #2a2a2a}
@media (max-width:860px){.cx-r{grid-template-columns:1fr}.cx-ac{justify-content:flex-start}.cx-l{grid-template-columns:1fr}.cx-h{padding:12px 56px 10px 14px}.cx-c{padding:10px 12px}.cx-rep{padding:10px 14px 2px}.cx-pied{padding:8px 14px 12px}}`;
  function css() { if (!document.getElementById('cx-css')) { const st = document.createElement('style'); st.id = 'cx-css'; st.textContent = CSS; document.head.appendChild(st); } }
  const PAL = ['#00F0FF', '#FFB44D', '#3DDC97', '#FF4FD8', '#8fb0ff', '#FFD54A', '#FF6B5E', '#b8a0ff'];
  const col = (k) => PAL[k % PAL.length];

  // p : { nom } ; sites : [{ s, c, i, reste, liv, req }] ; o : { esc, fmt, nomStation, couleurAvancement, jsonAttr, nbSystemes, pill, famille(c) -> { famille, nomType, eco } }
  window.coloMateriauModale = function (p, sites, total, o) {
    css();
    const esc = o.esc, tri = sites.slice().sort((a, b) => b.reste - a.reste), nbSys = new Set(sites.map(x => x.i)).size;
    const rep = tri.length > 1 ? `<div class="cx-rep"><div class="t">OÙ IL MANQUE LE PLUS</div><div class="cx-bar">${tri.map((x, k) => `<i style="--k:${col(k)};flex:${Math.max(1, x.reste)}" title="${esc(x.s.nom)} · ${esc(o.nomStation(x.c.station))} : ${o.fmt(x.reste)} t"></i>`).join('')}</div><div class="cx-leg">${tri.slice(0, 6).map((x, k) => `<span style="--k:${col(k)}">${esc(o.nomStation(x.c.station))} · ${Math.round(100 * x.reste / Math.max(1, total))} %</span>`).join('')}${tri.length > 6 ? `<span style="--k:#555">+ ${tri.length - 6} autres</span>` : ''}</div></div>` : '';
    const lignes = tri.map((x, k) => {
      const sys = x.s.nom, st = o.nomStation(x.c.station), part = Math.round(100 * Math.min(x.liv, x.req) / Math.max(1, x.req)), fi = o.famille(x.c);
      return `<div class="cx-r" style="--k:${col(k)}"><div class="cx-n"><span class="i">${window.EDTEAM_ICONE ? window.EDTEAM_ICONE(fi.famille || 'Avant-poste orbital', fi.nomType || '', { eco: fi.eco, vide: true, taille: 40 }) : ''}</span><div style="min-width:0">
          <b>${esc(sys)}<button class="cx-cp" onclick="copierTexteCarte(${o.jsonAttr(sys)}, this, event)" title="Copier le nom du système pour le coller dans la recherche de la carte galactique du jeu">COPIER</button></b>
          <small>${esc(st)}<button class="cx-cp" onclick="copierTexteCarte(${o.jsonAttr(st)}, this, event)" title="Copier le nom du chantier">COPIER</button></small></div></div>
        <div class="cx-av"><div class="reste"><small>RESTE À APPORTER</small>${o.fmt(x.reste)} t</div><div class="barre"><i style="width:${Math.max(2, part)}%;background:${o.couleurAvancement(part)}"></i></div><div class="lv">${o.fmt(x.liv)} / ${o.fmt(x.req)} t livrées · ${part} %</div></div>
        <div class="cx-ac"><button type="button" onclick="fermerMateriau(); carteCentrer(${x.i});" title="Fermer cette liste et centrer la carte sur ce système">VOIR SUR LA CARTE</button><button type="button" class="d" onclick="fermerMateriau(); ouvrirSysteme(${x.i});" title="Ouvrir la fenêtre de détail du système">DÉTAIL</button></div></div>`;
    }).join('') || `<div class="cx-vide">Plus aucun chantier n'a besoin de ce matériau.</div>`;
    return `<div class="cx-p" onclick="event.stopPropagation()"><div class="cx-x" onclick="fermerMateriau()">X</div>
      <div class="cx-h"><div><small>MATÉRIAU À APPORTER</small><b class="n">${esc(String(p.nom).toUpperCase())}</b></div><div class="cx-total"><b>${o.fmt(total)} t</b><span>à apporter sur ${sites.length} chantier${sites.length > 1 ? 's' : ''} · ${nbSys} système${nbSys > 1 ? 's' : ''}</span></div></div>
      ${rep}<div class="cx-c"><div class="cx-l un">${lignes}</div></div>
      <div class="cx-pied">ⓘ Le nom du système se colle tel quel dans la recherche de la carte galactique du jeu. Les systèmes concernés sont repérés sur la carte tant que le filtre « ${esc(p.nom)} » est actif.</div></div>`;
  };

  // nom : architecte ; a : { tonnes } ou null ; liste : [{ s, i }] ; o : { esc, fmt, nomStation, profilSysteme(s) -> pieces, ... }
  window.coloArchitecteModale = function (nom, a, liste, o) {
    css();
    const esc = o.esc, nbF = liste.reduce((t, x) => t + (x.s.finies || []).length, 0), nbC = liste.reduce((t, x) => t + (x.s.chantiers || []).length, 0);
    const tuile = (val, lib, k) => `<div class="cx-t" style="--k:${k}"><b>${val}</b><span>${lib}</span></div>`;
    window.__cxArchi = { liste, o };
    const carte = x => {
      const { s, i } = x, p = o.pieces(s), nf = (s.finies || []).length, nc = (s.chantiers || []).length;
      const icones = p ? p.tout.map(it => { const c = p.cand(it), eco = c.length === 1 ? c[0].eco : '', cha = it.etat === 'cha'; return `<span class="cx-i ${cha ? 'cha' : ''}" style="--k:${(window.EDTEAM_TEINTE_ECO || {})[eco === 'High Tech' ? 'Hightech' : eco] || B}" title="${esc(it.nom)} · ${esc(it.lib)}${cha ? ' · en construction ' + it.pct + ' %' : ''}">${window.EDTEAM_ICONE(it.famille || 'Avant-poste orbital', c.length === 1 ? c[0].n : '', { eco: c.length === 1 ? c[0].eco : '', vide: cha, taille: 28 })}${cha ? `<em>${it.pct}%</em>` : ''}</span>`; }).join('') : '';
      return `<div class="cx-s" data-nom="${esc(String(s.nom).toLowerCase())}"><div class="top"><div><b>${esc(s.nom)}<button class="cx-cp" style="margin-left:8px" onclick="copierTexteCarte(${o.jsonAttr(s.nom)}, this, event)" title="Copier le nom du système pour le coller dans la recherche de la carte galactique du jeu">COPIER</button></b>${s.faction ? `<small>contrôlé par ${esc(s.faction)}</small>` : ''}</div>
        <div class="cx-pil"><span style="color:${G};border-color:${G}66">${nf} TERMINÉE${nf > 1 ? 'S' : ''}</span><span style="color:${nc ? O : '#777'};border-color:${nc ? O + '88' : '#44444488'}">${nc} CHANTIER${nc > 1 ? 'S' : ''}</span></div></div>
        <div class="cx-ic">${icones || '<span style="color:#777;font-size:.85em">aucune installation relevée</span>'}</div>
        <div class="cx-ac" style="justify-content:flex-start"><button type="button" onclick="fermerArchitecte(); carteCentrer(${i});" title="Fermer cette liste et centrer la carte sur ce système">VOIR SUR LA CARTE</button><button type="button" class="d" onclick="fermerArchitecte(); ouvrirSysteme(${i});" title="Ouvrir la fenêtre de détail du système">DÉTAIL</button></div></div>`;
    };
    return `<div class="cx-p or" onclick="event.stopPropagation()"><div class="cx-x" onclick="fermerArchitecte()">X</div>
      <div class="cx-h"><div style="display:flex;align-items:center;gap:16px;min-width:0"><span id="cx-avatar" style="flex:none">${window.EDTEAMPhotos ? window.EDTEAMPhotos.avatar({ nom, taille: 76, role: 'pilote' }) : ''}</span><div style="min-width:0"><small>ARCHITECTE DE COLONISATION</small><b class="n">CMDR ${esc(String(nom).toUpperCase())}</b></div></div>
        <div class="cx-tuiles">${tuile(liste.length, 'SYSTÈME' + (liste.length > 1 ? 'S' : ''), B)}${tuile(nbF, 'TERMINÉE' + (nbF > 1 ? 'S' : ''), G)}${tuile(nbC, 'CHANTIER' + (nbC > 1 ? 'S' : ''), O)}${a ? tuile(o.fmt(a.tonnes) + ' t', 'LIVRÉES AU TOTAL', GOLD) : ''}</div>
        ${liste.length > 6 ? `<input class="cx-q" type="search" placeholder="Filtrer par nom…" oninput="coloArchiFiltre(this.value)">` : ''}</div>
      <div class="cx-c"><div class="cx-l" id="cx-archi-l">${liste.map(carte).join('') || `<div class="cx-vide">Aucun système relevé pour cet architecte.</div>`}</div></div>
      <div class="cx-pied">ⓘ Ses systèmes sont repérés sur la carte tant que le filtre « CMDR ${esc(String(nom).toUpperCase())} » est actif (croix de la pastille pour l'effacer). L'architecte d'un système est celui qui l'a revendiqué : jamais déduit.</div></div>`;
  };
  window.coloArchitecteApres = function (nom) {
    const P = window.EDTEAMPhotos; if (!P) return;
    P.charger(false).then(() => { const z = document.getElementById('cx-avatar'); if (z) z.innerHTML = P.avatar({ nom, taille: 76, role: 'pilote' }); }).catch(() => {});
  };
  // liste « ARCHITECTES DE L'ESCADRON » : photos (ou initiales) devant chaque nom, une fois les photos visibles chargees
  window.coloAvatarsListe = function () {
    const P = window.EDTEAMPhotos; if (!P) return;
    P.charger(false).then(() => { document.querySelectorAll('.al-av[data-nom]').forEach(z => { z.innerHTML = P.avatar({ nom: z.dataset.nom, taille: 46, role: 'pilote' }); }); }).catch(() => {});
  };
  window.coloArchiFiltre = function (v) { const q = String(v || '').trim().toLowerCase(); document.querySelectorAll('#cx-archi-l .cx-s').forEach(e => { e.style.display = !q || (e.dataset.nom || '').includes(q) ? '' : 'none'; }); };
})();
