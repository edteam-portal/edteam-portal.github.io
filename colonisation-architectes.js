// SYSTEMES SANS ARCHITECTE (page Colonisation) : bandeau visible + liste a declarer + fenetre d'accueil tant qu'il en reste.
// Le jeu n'ecrit pas toujours la revendication d'un systeme : l'architecte est alors « inconnu » et le pilote peut se declarer (SQL 87, fonction declarerArchitecte de la page).
// La fenetre tient dans l'ecran (marges, defilement INTERNE, en-tete fixe) : lisible sur un portable de 14 pouces. Deux colonnes quand la largeur le permet.
// Depend de : window.__colo (systemes), declarerArchitecte(adresse, retirer, silencieux), ouvrirSysteme(i), window.edInfo. Aucune lecture de la base.
(function () {
  const O = '#FF7100', G = '#00FF66', B = '#00F0FF', GOLD = '#FFD700';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CSS = `
#ca-plein{position:fixed;inset:0;z-index:99990;background:rgba(2,1,0,.88);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:clamp(10px,3.5vh,34px) clamp(10px,3.5vw,48px);animation:caF .16s ease-out}
@keyframes caF{from{opacity:0}to{opacity:1}}
.ca-p{width:min(1180px,100%);height:100%;max-height:860px;display:flex;flex-direction:column;background:linear-gradient(180deg,rgba(255,113,0,.07),rgba(8,4,0,.985) 22%);border:1px solid ${O};box-shadow:0 0 36px rgba(255,113,0,.22);
  clip-path:polygon(0 0,calc(100% - 18px) 0,100% 18px,100% 100%,18px 100%,0 calc(100% - 18px))}
.ca-h{flex:none;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:14px 22px 12px;border-bottom:1px solid rgba(255,113,0,.35)}
.ca-h small{color:#888;letter-spacing:3px;font-size:.72em;display:block}.ca-h b{display:block;color:${O};font-size:1.45em;letter-spacing:3px;text-shadow:0 0 12px rgba(255,113,0,.4)}
.ca-h .ca-nb{color:${GOLD};font-size:.78em;letter-spacing:1px;margin-left:10px;font-weight:normal}
.ca-hd{display:flex;align-items:center;gap:10px}
.ca-q{background:#0b1418;border:1px solid #2c4a54;color:#e6f0f3;font:inherit;font-size:.82em;padding:7px 10px;width:210px;outline:0}.ca-q:focus{border-color:${B}}
.ca-fermer{background:transparent;border:1px solid #6b7680;color:#aab7bd;font:inherit;font-size:.78em;letter-spacing:2px;padding:7px 16px;cursor:pointer;white-space:nowrap}.ca-fermer:hover{border-color:#fff;color:#fff}
.ca-note{flex:none;padding:10px 22px;border-bottom:1px solid rgba(255,255,255,.07);color:#b9c8ce;font-size:.84em;line-height:1.55}
.ca-note b{color:#fff;font-weight:normal;border-bottom:1px dotted ${GOLD}}.ca-note .att{display:block;margin-top:6px;color:#ffb3ad}.ca-note .att b{color:#fff;font-weight:bold;border:0}
.ca-c{flex:1;min-height:0;overflow-y:auto;padding:14px 22px 18px;scrollbar-width:thin;scrollbar-color:#FF7100 #0b0b0b}
.ca-l{display:grid;grid-template-columns:repeat(auto-fill,minmax(470px,1fr));gap:9px}
.ca-r{display:flex;align-items:center;justify-content:space-between;gap:10px 12px;flex-wrap:wrap;background:rgba(0,0,0,.5);border:1px solid #2c2c2c;border-left:3px solid ${GOLD};padding:10px 12px}
.ca-n{flex:1 1 170px;min-width:0}.ca-n b{display:block;color:#fff;font-size:.98em;letter-spacing:1.2px;overflow-wrap:anywhere}.ca-n span{color:#8fb7bf;font-size:.76em}
.ca-b{display:flex;gap:7px;flex-wrap:wrap}
.ca-b button{font:inherit;font-size:.72em;letter-spacing:1.2px;padding:7px 11px;cursor:pointer;background:transparent;border:1px solid ${B};color:${B};white-space:nowrap}.ca-b button:hover{background:rgba(0,240,255,.15);color:#fff}
.ca-b button.d{border-color:${GOLD};color:${GOLD};background:rgba(255,215,0,.08);font-weight:bold}.ca-b button.d:hover{background:${GOLD};color:#050403}
.ca-vide{border:1px solid rgba(0,255,102,.4);background:rgba(0,255,102,.06);color:${G};padding:18px;text-align:center;letter-spacing:1px}
.ca-none{color:#8b97a0;text-align:center;padding:22px;font-size:.9em}
.ca-ban{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;border:1px solid ${GOLD};background:rgba(255,215,0,.07);box-shadow:0 0 14px rgba(255,215,0,.12);padding:10px 16px;margin:0 0 12px}
.ca-ban span{color:${GOLD};letter-spacing:1.5px;font-size:.95em}.ca-ban b{color:#fff}
.ca-ban button{background:rgba(255,215,0,.12);border:1px solid ${GOLD};color:${GOLD};font:inherit;font-size:.82em;letter-spacing:2px;font-weight:bold;padding:7px 16px;cursor:pointer}.ca-ban button:hover{background:${GOLD};color:#050403}
@media (max-width:760px){.ca-l{grid-template-columns:1fr}.ca-q{width:100%}.ca-hd{width:100%;flex-wrap:wrap}}
@media (max-height:700px){.ca-note{font-size:.78em;padding:7px 18px}.ca-h{padding:10px 18px 8px}.ca-h b{font-size:1.2em}}`;
  function css() { if (!document.getElementById('ca-css')) { const st = document.createElement('style'); st.id = 'ca-css'; st.textContent = CSS; document.head.appendChild(st); } }
  const tous = () => ((window.__colo && window.__colo.systemes) || []).filter(s => !s.architecte);
  const nbInst = s => (s.finies || []).length, nbCh = s => (s.chantiers || []).length;
  const ST = { filtre: '' };

  window.coloBanniereArchi = function () {
    const L = tous(); if (!L.length) return '';
    return `<div class="ca-ban"><span>⚠ <b>${L.length}</b> SYSTÈME${L.length > 1 ? 'S' : ''} SANS ARCHITECTE <small style="color:#c9b15a;letter-spacing:1px">(à déclarer)</small></span><button type="button" onclick="coloListeArchi(false)">VOIR LA LISTE</button></div>`;
  };

  function lignes() {
    const q = ST.filtre.trim().toLowerCase();
    const L = tous().filter(s => !q || String(s.nom).toLowerCase().includes(q)).sort((a, b) => String(a.nom).localeCompare(String(b.nom), 'fr'));
    if (!tous().length) return `<div class="ca-vide">✔ TOUS LES SYSTÈMES ONT UN ARCHITECTE</div>`;
    if (!L.length) return `<div class="ca-none">Aucun système ne correspond à « ${esc(ST.filtre)} ».</div>`;
    return `<div class="ca-l">${L.map(s => `<div class="ca-r"><div class="ca-n"><b>${esc(String(s.nom).toUpperCase())}</b><span>${nbInst(s)} installation${nbInst(s) > 1 ? 's' : ''} terminée${nbInst(s) > 1 ? 's' : ''} · ${nbCh(s)} chantier${nbCh(s) > 1 ? 's' : ''}</span></div>
      <div class="ca-b"><button type="button" onclick="coloArchiVoir('${esc(s.adresse)}')">VOIR</button><button type="button" class="d" onclick="coloArchiDeclarer('${esc(s.adresse)}')">JE SUIS L'ARCHITECTE</button></div></div>`).join('')}</div>`;
  }
  function monter(intro) {
    css();
    let m = document.getElementById('ca-plein');
    const ancienDefil = m && m.querySelector('.ca-c') ? m.querySelector('.ca-c').scrollTop : 0;
    if (!m) { m = document.createElement('div'); m.id = 'ca-plein'; m.onclick = e => { if (e.target === m) window.coloFermerArchi(); }; document.body.appendChild(m); document.addEventListener('keydown', cle, true); }
    m.dataset.intro = intro ? '1' : '';
    const n = tous().length;
    m.innerHTML = `<div class="ca-p" role="dialog" aria-modal="true"><div class="ca-h"><div><small>COLONISATION</small><b>SYSTÈMES SANS ARCHITECTE<span class="ca-nb">${n}</span></b></div>
      <div class="ca-hd">${n > 6 ? `<input id="ca-q" class="ca-q" type="search" placeholder="Filtrer par nom…" value="${esc(ST.filtre)}" oninput="coloFiltreArchi(this.value)">` : ''}<button type="button" class="ca-fermer" onclick="coloFermerArchi()">${intro ? 'PLUS TARD' : 'FERMER'}</button></div></div>
      <div class="ca-note">${intro ? `Le jeu n'enregistre pas toujours la revendication d'un système : <b>l'architecte reste alors inconnu</b>, et ses chantiers et installations ne lui sont pas rattachés. Si vous êtes l'architecte d'un système de cette liste, <b>déclarez-vous</b> : c'est visible de l'escadron et vous pourrez le retirer.` : ''}<span class="att" ${intro ? '' : 'style="margin-top:0"'}>Ne déclarez que les systèmes <b>que vous avez revendiqués vous-même</b> en jeu (écran « Mes colonies »).</span></div>
      <div class="ca-c" id="ca-c">${lignes()}</div></div>`;
    const c = m.querySelector('.ca-c'); if (c) c.scrollTop = ancienDefil;
  }
  function cle(e) { if (e.key === 'Escape' && document.getElementById('ca-plein') && !document.getElementById('ed-dlg')) { e.stopPropagation(); window.coloFermerArchi(); } }
  window.coloFiltreArchi = function (v) { ST.filtre = String(v || ''); const c = document.getElementById('ca-c'); if (c) c.innerHTML = lignes(); };
  window.coloListeArchi = function (intro) {
    if (!tous().length) { if (window.edInfo) window.edInfo({ titre: 'SYSTÈMES SANS ARCHITECTE', texte: 'Tous les systèmes ont un architecte.', ok: 'OK' }); return; }
    ST.filtre = ''; monter(!!intro);
  };
  window.coloFermerArchi = function () { const m = document.getElementById('ca-plein'); if (m) m.remove(); document.removeEventListener('keydown', cle, true); };
  // rafraichit la liste si elle est ouverte (apres une declaration ou une actualisation)
  window.coloMajListeArchi = function () { const m = document.getElementById('ca-plein'); if (m) monter(m.dataset.intro === '1'); };
  window.coloArchiVoir = function (adresse) {
    const i = ((window.__colo && window.__colo.systemes) || []).findIndex(s => String(s.adresse) === String(adresse)); if (i < 0) return;
    window.coloFermerArchi(); window.ouvrirSysteme(i);
  };
  window.coloArchiDeclarer = async function (adresse) {
    const ok = await window.declarerArchitecte(adresse, false, true);
    if (ok) window.coloMajListeArchi();
  };
  // fenetre d'accueil : une seule fois par chargement de la page, tant qu'il reste des systemes sans architecte
  window.coloAccueilArchi = function () {
    if (window.__caVu || !tous().length) return; window.__caVu = true;
    setTimeout(() => { const mc = document.getElementById('modal-colo'); if (tous().length && !(mc && mc.style.display === 'flex')) { ST.filtre = ''; monter(true); } }, 500);
  };
})();
