// JOUEURS CROISES : l'historique des JOUEURS que les pilotes de l'escadron ont verrouilles dans l'onglet Combat (plugin 2.40, script SQL 105).
// Partage par index.html (carte du QG) et tableau-de-bord.html (bouton de l'onglet Combat). Une fenetre unique : bande de chiffres, filtres, liste avec hologramme du vaisseau, detail sous la ligne.
// Lecture serveur : joueurs_croises_resume() (quelques octets, memoire 5 min) pour le compteur ; joueurs_croises_lire() (300 fiches au plus) seulement a l'ouverture de la fenetre.
// Hologrammes : holo-vaisseau.js + silhouettes-data.js, charges a l'ouverture de la fenetre seulement (le QG ne les charge pas avant).
// Tant que le script SQL 105 n'est pas lance, ou sans escadron, le resume vaut null : la carte et le bouton restent caches.
(function () {
    'use strict';
    const JC = window.JCroises = {};
    const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const FR = n => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const client = () => window.supabaseApp || (typeof supabaseApp !== 'undefined' ? supabaseApp : null);
    const il = t => { if (!t) return '—'; const s = Math.max(0, Math.round(Date.now() / 1000 - t)); if (s < 90) return 'à l’instant'; const m = Math.round(s / 60); if (m < 90) return 'il y a ' + m + ' min'; const h = Math.round(m / 60); if (h < 36) return 'il y a ' + h + ' h'; return 'il y a ' + Math.round(h / 24) + ' j'; };
    const date = t => t ? new Date(t * 1000).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
    const COUL = { r: '#FF3B30', v: '#00FF66', b: '#3D8BFF' }, LIB = { r: 'RECHERCHÉ', v: 'ALLIÉ', b: 'NEUTRE' };
    const PAGE = 30;
    const CSS = `
#jc-plein{position:fixed;inset:0;z-index:9500;display:flex;align-items:center;justify-content:center;padding:clamp(10px,3vh,30px) clamp(10px,3vw,40px);background:rgba(2,3,5,.88);backdrop-filter:blur(3px);font-family:'Share Tech Mono',Consolas,monospace}
.jc-p{width:min(1120px,100%);height:100%;max-height:860px;display:flex;flex-direction:column;background:linear-gradient(180deg,rgba(0,240,255,.08),rgba(4,6,9,.985) 20%);border:1px solid #00F0FF;box-shadow:0 0 34px rgba(0,240,255,.22);clip-path:polygon(0 0,calc(100% - 18px) 0,100% 18px,100% 100%,18px 100%,0 calc(100% - 18px))}
.jc-h{flex:none;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:14px 22px 12px;border-bottom:1px solid rgba(0,240,255,.3)}
.jc-h small{display:block;color:#888;letter-spacing:3px;font-size:.72em}.jc-h b{display:block;color:#00F0FF;font-size:1.4em;letter-spacing:3px;font-weight:normal;text-shadow:0 0 12px rgba(0,240,255,.35)}
.jc-x{background:transparent;border:1px solid #6b7680;color:#aab7bd;font:inherit;font-size:.78em;letter-spacing:2px;padding:7px 16px;cursor:pointer}.jc-x:hover{border-color:#fff;color:#fff}
.jc-st{flex:none;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:12px 22px 4px}
.jc-st div{border:1px solid #1d3a44;border-left:3px solid #00F0FF;background:rgba(0,240,255,.05);padding:7px 12px}.jc-st div.r{border-color:#4a1d1a;border-left-color:#FF3B30;background:rgba(255,59,48,.06)}
.jc-st small{display:block;color:#7d8a92;font-size:.64em;letter-spacing:2px}.jc-st b{display:block;color:#fff;font-weight:normal;font-size:1.35em;line-height:1.25}.jc-st div.r b{color:#FF6B5F}.jc-st b.p{font-size:.95em;padding-top:5px}
.jc-b{flex:none;display:flex;gap:10px;flex-wrap:wrap;align-items:center;padding:10px 22px;border-bottom:1px solid rgba(255,255,255,.07)}
.jc-q,.jc-s{background:#0b1418;border:1px solid #2c4a54;color:#e6f0f3;font:inherit;font-size:.82em;padding:7px 10px;outline:0}.jc-q{flex:1 1 220px;min-width:0}.jc-q:focus,.jc-s:focus{border-color:#00F0FF}
.jc-f{display:flex;gap:6px;flex-wrap:wrap}.jc-f button{background:transparent;border:1px solid #2c4a54;color:#8fb7bf;font:inherit;font-size:.72em;letter-spacing:1.5px;padding:6px 11px;cursor:pointer}.jc-f button:hover{color:#fff;border-color:#00F0FF}.jc-f button.on{background:rgba(0,240,255,.16);border-color:#00F0FF;color:#fff}
.jc-n{color:#8b97a0;font-size:.74em;letter-spacing:1px;margin-left:auto}
.jc-c{flex:1;min-height:0;overflow-y:auto;padding:6px 22px 14px;scrollbar-width:thin;scrollbar-color:#00F0FF #0b0b0b}
.jc-r{--t:#3D8BFF;border-bottom:1px solid rgba(255,255,255,.07);border-left:3px solid var(--t);margin-top:6px;background:linear-gradient(90deg,color-mix(in srgb,var(--t) 7%,transparent),transparent 40%)}
.jc-l{display:grid;grid-template-columns:96px minmax(0,1.4fr) minmax(0,1.1fr) minmax(0,.9fr) 92px 40px;gap:4px 14px;align-items:center;padding:7px 10px 7px 8px;cursor:pointer}.jc-l:hover{background:rgba(255,255,255,.04)}
.jc-th{height:56px;background:radial-gradient(circle at 50% 50%,color-mix(in srgb,var(--t) 16%,transparent),rgba(0,0,0,.45));border:1px solid color-mix(in srgb,var(--t) 40%,transparent);padding:3px;box-sizing:border-box}.jc-th svg{display:block;width:100%;height:100%}
.jc-th .tbs-balai,.jc-g .tbs-balai{animation:none}.jc-r.ouv .jc-g .tbs-balai{animation:jcBal 5s linear infinite}
@keyframes jcBal{from{transform:translateY(0)}to{transform:translateY(var(--h))}}@media (prefers-reduced-motion:reduce){.jc-r.ouv .jc-g .tbs-balai{animation:none}}
.jc-l .nm{color:#fff;font-size:.98em;letter-spacing:1px;overflow-wrap:anywhere}.jc-l .nm small{display:block;color:#8fb7bf;font-size:.74em;letter-spacing:.5px}
.jc-l .fa{color:#b9c8ce;font-size:.8em;overflow-wrap:anywhere}.jc-l .fa i{font-style:normal;color:#FFD700;letter-spacing:1px}.jc-l .fa .pw{color:#8fd3ff}.jc-l .fa .pw0{color:#6f7c84;font-style:italic}
.jc-l .vu{color:#9aa7ad;font-size:.76em}.jc-l .nm .mt{display:none}.jc-l .nb{color:#00F0FF;text-align:right;font-size:.9em}
.jc-chip{display:inline-block;border:1px solid var(--t);color:var(--t);font-size:.66em;letter-spacing:2px;padding:2px 8px;white-space:nowrap}
.jc-d{display:none;padding:6px 14px 16px 14px;gap:16px 22px;grid-template-columns:minmax(0,290px) minmax(0,1fr);align-items:center}.jc-r.ouv .jc-d{display:grid}.jc-r.ouv .jc-l{background:color-mix(in srgb,var(--t) 9%,transparent)}
.jc-g{background:radial-gradient(circle at 50% 50%,color-mix(in srgb,var(--t) 16%,transparent),rgba(0,0,0,.5));border:1px solid color-mix(in srgb,var(--t) 40%,transparent);padding:8px}.jc-g svg{display:block;width:100%;height:auto;max-height:230px}
.jc-dt{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px 18px}.jc-dt .tt{grid-column:1/-1}
.jc-dt div small{display:block;color:#7d8a92;font-size:.66em;letter-spacing:2px}.jc-dt div b{font-weight:normal;color:#e6f0f3;font-size:.88em;overflow-wrap:anywhere}.jc-dt .pr b{color:#FF6B5F}
.jc-plus{display:block;margin:12px auto 4px;background:transparent;border:1px solid #00F0FF;color:#00F0FF;font:inherit;font-size:.78em;letter-spacing:2px;padding:8px 22px;cursor:pointer}.jc-plus:hover{background:rgba(0,240,255,.15);color:#fff}
.jc-note{flex:none;padding:9px 22px;border-top:1px solid rgba(255,255,255,.07);color:#7d8a92;font-size:.7em;line-height:1.5}
.jc-vide{color:#8b97a0;text-align:center;padding:28px 10px;font-size:.9em}
@media (max-width:900px){.jc-st{grid-template-columns:repeat(2,minmax(0,1fr))}.jc-l{grid-template-columns:70px minmax(0,1fr) 34px;gap:4px 10px}.jc-l .fa,.jc-l .pc,.jc-l .vu{display:none}.jc-l .nm .mt{display:inline}.jc-d{grid-template-columns:1fr}.jc-g svg{max-height:170px}}
.jc-carte{--c:#00F0FF;--bdc:color-mix(in srgb,var(--c) 75%,transparent);transition:filter .2s;position:relative;flex:1 1 auto;min-width:0;box-sizing:border-box;border:1px solid var(--bdc);padding:0;display:grid;grid-template-columns:138px minmax(0,1fr);cursor:pointer;font-family:'Share Tech Mono',monospace;overflow:hidden;
  background:radial-gradient(circle at 12% 40%,color-mix(in srgb,var(--c) 14%,transparent),transparent 50%),linear-gradient(180deg,color-mix(in srgb,var(--c) 8%,transparent),rgba(4,8,10,.9) 90px);clip-path:polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)}
.jc-carte:after{content:"";position:absolute;inset:0;pointer-events:none;z-index:4;box-shadow:inset 0 0 22px color-mix(in srgb,var(--c) 26%,transparent),inset 0 0 0 1px color-mix(in srgb,var(--c) 24%,transparent);background:linear-gradient(to bottom right,transparent calc(50% - 1px),var(--bdc) calc(50% - 1px),var(--bdc) calc(50% + 1px),transparent calc(50% + 1px)) left top/14px 14px no-repeat,linear-gradient(to bottom right,transparent calc(50% - 1px),var(--bdc) calc(50% - 1px),var(--bdc) calc(50% + 1px),transparent calc(50% + 1px)) right bottom/14px 14px no-repeat}
.jc-carte:before{content:"";position:absolute;top:0;left:14px;width:46px;height:3px;background:var(--c);box-shadow:0 0 10px var(--c);z-index:5}.jc-carte:hover{filter:brightness(1.22)}
.jc-carte .hl{position:relative;margin:16px 0 14px 16px;border:1px solid color-mix(in srgb,var(--t,#00F0FF) 45%,transparent);background:radial-gradient(circle at 50% 50%,color-mix(in srgb,var(--t,#00F0FF) 20%,transparent),rgba(0,0,0,.5) 75%);display:flex;align-items:center;justify-content:center;overflow:hidden}
.jc-carte .hl svg.v{display:block;width:100%;height:100%;padding:6px;box-sizing:border-box}.jc-carte .hl .tbs-balai{animation:jcBal 5s linear infinite}
.jc-carte .hl:before,.jc-carte .hl:after{content:"";position:absolute;width:9px;height:9px;border:solid var(--t,#00F0FF);z-index:2}.jc-carte .hl:before{top:3px;left:3px;border-width:1px 0 0 1px}.jc-carte .hl:after{bottom:3px;right:3px;border-width:0 1px 1px 0}
.jc-carte .hl .lab{position:absolute;left:0;right:0;bottom:0;text-align:center;font-size:.54em;letter-spacing:2px;color:var(--t,#00F0FF);background:linear-gradient(transparent,rgba(0,0,0,.75));padding:8px 2px 3px;z-index:3}
.jc-carte .hl .ret{width:60px;height:60px;opacity:.4}.jc-carte .hl .ret *{fill:none;stroke:#00F0FF;stroke-width:1.2}
.jc-carte .co{position:relative;z-index:2;min-width:0;padding:11px 16px 9px 14px;display:flex;flex-direction:column;gap:7px}
.jc-carte .e{font-size:.68em;letter-spacing:3px;color:var(--c)}
.jc-carte .row{display:flex;gap:12px;align-items:center}.jc-carte .big{flex:1 1 0;min-width:0}
.jc-carte .big b{display:block;font-weight:normal;color:#fff;font-size:2.4em;line-height:1;text-shadow:0 0 16px color-mix(in srgb,var(--c) 55%,transparent)}.jc-carte .big span{display:block;color:#9aa7ad;font-size:.68em;line-height:1.35;margin-top:3px}
.jc-carte .tl{display:flex;flex-direction:column;gap:5px;min-width:104px}.jc-carte .tl div{border:1px solid color-mix(in srgb,var(--c) 38%,transparent);background:rgba(0,0,0,.35);padding:3px 9px}
.jc-carte .tl small{display:block;color:#7d8a92;font-size:.56em;letter-spacing:2px}.jc-carte .tl b{display:block;font-weight:normal;color:#e6f0f3;font-size:.88em}
.jc-carte .fl{display:flex;flex-direction:column;gap:3px;border-top:1px dashed #1d3a44;padding-top:6px}
.jc-carte .fl div{display:flex;align-items:center;gap:8px;font-size:.7em;color:#b9c8ce;min-width:0}.jc-carte .fl i{flex:none;width:6px;height:6px;border-radius:50%;background:var(--t);box-shadow:0 0 6px var(--t)}
.jc-carte .fl b{font-weight:normal;color:#fff;flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.jc-carte .fl em{font-style:normal;color:#8fb7bf;flex:0 1 auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:36%}.jc-carte .fl u{text-decoration:none;color:#7d8a92;flex:none}
.jc-carte .p{margin-top:auto;color:var(--c);font-size:.68em;letter-spacing:2px;display:flex;justify-content:space-between;gap:8px}
.jc-carte .vide{color:#9aa7ad;font-size:.76em;line-height:1.45;margin:auto 0}
@media (prefers-reduced-motion:reduce){.jc-carte .hl .tbs-balai{animation:none}}
.jv{display:grid;grid-template-columns:minmax(0,1.05fr) 54px minmax(0,1.2fr);gap:6px;align-items:stretch;margin:18px 0 0;text-align:left}
.jv-lock{--t:#FF3B30;position:relative;border:1px solid color-mix(in srgb,var(--t) 60%,transparent);background:radial-gradient(circle at 50% 45%,color-mix(in srgb,var(--t) 16%,transparent),rgba(0,0,0,.6) 70%);padding:10px 12px 12px;overflow:hidden;box-shadow:0 0 26px color-mix(in srgb,var(--t) 22%,transparent)}
.jv-lock:before,.jv-lock:after{content:"";position:absolute;width:14px;height:14px;border:solid var(--t);z-index:3}.jv-lock:before{top:4px;left:4px;border-width:2px 0 0 2px}.jv-lock:after{bottom:4px;right:4px;border-width:0 2px 2px 0}
.jv-tete{font-size:.66em;letter-spacing:3px;color:var(--t);display:flex;align-items:center;gap:8px}.jv-pt{width:7px;height:7px;border-radius:50%;background:var(--t);box-shadow:0 0 8px var(--t);animation:jvClig 1.2s infinite}
@keyframes jvClig{50%{opacity:.25}}
.jv-corps{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:6px;align-items:center;margin-top:4px}
.jv-holo{position:relative;height:224px}.jv-holo>svg:first-child{display:block;width:100%;height:100%;padding:12px 24px;box-sizing:border-box}
.jv-ret{position:absolute;inset:0;margin:auto;height:100%;width:auto;pointer-events:none;animation:jvTourne 24s linear infinite}.jv-ret *{fill:none;stroke:var(--t);stroke-width:1.2;opacity:.75}.jv-ret .r{opacity:1}
@keyframes jvTourne{to{transform:rotate(360deg)}}
.jv-scan{font-size:.78em;line-height:1.7;color:#cfd3d8;min-width:0;overflow-wrap:anywhere}.jv-scan>div{opacity:0;animation:jvDecr .5s forwards}.jv-scan>div:nth-child(1){color:#fff;font-size:1.15em;letter-spacing:2px;animation-delay:.3s}.jv-scan>div:nth-child(2){animation-delay:.55s}.jv-scan>div:nth-child(3){animation-delay:.8s}.jv-scan>div:nth-child(4){animation-delay:1.05s}
.jv-scan .s{color:#9aa7ad}.jv-scan .p{color:var(--t);letter-spacing:1px;font-weight:bold}
@keyframes jvDecr{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
.jv-fl{display:flex;flex-direction:column;align-items:center;gap:4px;color:#00F0FF}.jv-fl svg{width:46px;height:70px;fill:none;stroke:#00F0FF;stroke-width:2.4;filter:drop-shadow(0 0 6px #00F0FF);animation:jvPousse 1.6s ease-in-out infinite}.jv-fl span{font-size:.5em;letter-spacing:1.5px;text-align:center;color:#7d8a92;line-height:1.4}
@keyframes jvPousse{50%{transform:translateX(5px)}}
.jv-qg{min-width:0}.jv-cap{font-size:.62em;letter-spacing:3px;color:#7d8a92;margin:0 0 6px}
.jv-carte .jc-carte{cursor:default;min-height:188px}.jv-carte{pointer-events:none}
.jv-liste{margin-top:8px;border:1px solid rgba(0,240,255,.25);background:rgba(0,0,0,.35)}
.jv-l{--t:#3D8BFF;display:flex;align-items:center;gap:10px;padding:6px 10px;font-size:.72em;color:#b9c8ce;border-left:3px solid var(--t);border-bottom:1px solid rgba(255,255,255,.06);opacity:0;animation:jvDecr .5s forwards;min-width:0}
.jv-l:last-child{border-bottom:0}.jv-l i{flex:none;width:6px;height:6px;border-radius:50%;background:var(--t);box-shadow:0 0 6px var(--t)}.jv-l b{font-weight:normal;color:#fff;flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.jv-l em{font-style:normal;color:#8fb7bf;flex:none}.jv-l span{flex:none;color:#FF6B5F;font-size:.9em;letter-spacing:1px}.jv-l span.g{color:#8b97a0;letter-spacing:0;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.jv-l u{flex:none;text-decoration:none;color:#7d8a92}
@media (max-width:900px){.jv{grid-template-columns:1fr}.jv-corps{grid-template-columns:1fr}.jv-holo{height:190px}.jv-fl{flex-direction:row;justify-content:center}.jv-fl svg{transform:rotate(90deg);width:40px;height:50px;animation:none}}
@media (prefers-reduced-motion:reduce){.jv *{animation:none!important}.jv-scan>div,.jv-l{opacity:1}}
#cmb-croises-btn{display:inline-flex;align-items:center;gap:9px;background:rgba(0,240,255,.14);border:1px solid #00F0FF;color:#fff;font-size:12px;letter-spacing:2px;padding:6px 14px;cursor:pointer;box-shadow:0 0 12px rgba(0,240,255,.3)}
#cmb-croises-btn:hover{background:rgba(0,240,255,.3);box-shadow:0 0 18px rgba(0,240,255,.55)}#cmb-croises-btn svg{width:18px;height:18px;flex:none;fill:none;stroke:#00F0FF;stroke-width:1.8}
#cmb-croises-btn b{background:#00F0FF;color:#001418;font-weight:bold;letter-spacing:0;padding:1px 8px;min-width:12px;text-align:center}`;
    function style() { if (!document.getElementById('jc-css')) { const s = document.createElement('style'); s.id = 'jc-css'; s.textContent = CSS; document.head.appendChild(s); } }
    const charger = src => new Promise(ok => { const s = document.createElement('script'); s.src = src; s.onload = () => ok(true); s.onerror = () => ok(false); document.head.appendChild(s); });
    // hologrammes : charges a la demande (sans eux, la fenetre reste utilisable, sans le dessin du vaisseau)
    async function holos() {
        try { if (typeof SILHOUETTES === 'undefined') await charger('silhouettes-data.js?v=2'); if (!window.HoloVaisseau) await charger('holo-vaisseau.js?v=1'); } catch (e) { /* sans hologramme */ }
        return !!window.HoloVaisseau && typeof SILHOUETTES !== 'undefined';
    }

    // ---- compteur (memoire 5 min) : null = fonction absente, pas d'escadron ou pas connecte
    let memo = null, memoT = 0, enCours = null;
    JC.resume = function (force) {
        if (!force && memoT && Date.now() - memoT < 300000) return Promise.resolve(memo);
        if (enCours) return enCours;
        const c = client(); if (!c) return Promise.resolve(null);
        enCours = c.rpc('joueurs_croises_resume').then(r => { memo = (r && !r.error && r.data && typeof r.data === 'object') ? r.data : null; memoT = Date.now(); return memo; })
            .catch(() => { memo = null; memoT = Date.now(); return null; }).then(x => { enCours = null; return x; });
        return enCours;
    };

    // ---- carte du QG : compteur (resume) + les 3 derniers joueurs croises (joueurs_croises_lire(3), quelques centaines d'octets) ; hologramme du dernier vaisseau charge ensuite
    let apMemo = null, apT = 0;
    async function apercu() {
        if (apT && Date.now() - apT < 300000) return apMemo;
        const c = client(); let L = [];
        try { const r = c ? await c.rpc('joueurs_croises_lire', { p_limite: 3 }) : null; if (r && !r.error && r.data) L = (r.data.liste || []).filter(x => x && x.n); } catch (e) { /* sans les derniers */ }
        apMemo = L; apT = Date.now(); return L;
    }
    // HTML de la carte (QG) : partage avec le visuel de l'annonce ; clic = ouvre la fenetre (sauf apercu)
    function carteHtml(r, L, id, apercu) {
        const t = Number(r.total) || 0, s = Number(r.semaine) || 0, d = L[0];
        const reticule = '<svg class="ret" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="20"/><circle cx="32" cy="32" r="9"/><path d="M32 2v14M32 48v14M2 32h14M48 32h14"/></svg>';
        const flux = L.map(x => '<div style="--t:' + COUL[ton(x)] + '"><i></i><b>CMD ' + E(String(x.n).toUpperCase()) + '</b><em>' + E(String(nomV(x))) + '</em><u>' + il(x.d).replace('il y a ', '') + '</u></div>').join('');
        return '<div class="jc-carte"' + (apercu ? '' : ' onclick="JCroises.ouvrir()" onmouseenter="if(typeof sonHover===\'function\') sonHover()"')
            + (d ? ' style="--t:' + COUL[ton(d)] + '"' : '') + '><div class="hl" id="' + id + '-hl">' + reticule + (d ? '<span class="lab">' + E(String(nomV(d) || 'VAISSEAU').toUpperCase()) + '</span>' : '') + '</div>'
            + '<div class="co"><div class="e">JOUEURS CROISÉS · COMBAT</div>'
            + (t ? '<div class="row"><div class="big"><b>' + FR(t) + '</b><span>joueur' + (t > 1 ? 's' : '') + ' verrouillé' + (t > 1 ? 's' : '') + ' par l’escadron</span></div>'
                + '<div class="tl"><div><small>CETTE SEMAINE</small><b>' + FR(s) + '</b></div><div><small>DERNIER</small><b>' + il(r.dernier) + '</b></div></div></div>'
                + '<div class="fl">' + flux + '</div>'
                : '<div class="vide">Aucun joueur croisé pour l’instant : ils s’enregistrent quand un pilote en verrouille un dans l’onglet Combat.</div>')
            + '<div class="p"><span>VOIR LA LISTE ET LES DÉTAILS</span><span>›</span></div></div></div>';
    }
    // le dessin du vaisseau arrive apres la carte (fichiers charges une fois, puis en cache)
    async function holoCarte(id, d) {
        if (!d || !(await holos())) return;
        const h = document.getElementById(id + '-hl'); if (!h) return;
        try { const tn = ton(d); h.insertAdjacentHTML('afterbegin', window.HoloVaisseau.mini(d.s, 'jq' + id.replace(/\W/g, ''), tn === 'r' ? true : tn).replace('<svg ', '<svg class="v" ')); const rt = h.querySelector('.ret'); if (rt) rt.remove(); } catch (e) { /* garde le reticule */ }
    }
    JC.monterCarte = async function (id) {
        const el = document.getElementById(id); if (!el) return;
        const [r, L] = await Promise.all([JC.resume(), apercu()]); if (!r) { el.style.display = 'none'; return; }
        style();
        el.innerHTML = carteHtml(r, L, id, false);
        el.style.display = el.dataset.display || 'flex';
        holoCarte(id, L[0]);
    };

    // ---- visuel de l'ANNONCE (annonce.js) : a gauche un verrouillage en cours (hologramme, reticule, fiche qui se decrypte), a droite la vraie carte du QG et deux lignes de la liste.
    // Donnees d'exemple fictives : aucun pilote reel, aucun effectif.
    JC.visuelAnnonce = async function () {
        style(); const ok = await holos(); const now = Math.floor(Date.now() / 1000);
        const L = [
            { n: 'Vesper Kade', s: 'python', sl: 'Python', rg: 'Deadly', f: 'Obsidian Vanguard', l: 'Wanted', e: 'OBVC', pw: 'Archon Delaine', pm: 185000, sys: 'Sedna', d: now - 540, p: now - 86400, nb: 2, par: 'Nova' },
            { n: 'Ilya Marsk', s: 'anaconda', sl: 'Anaconda', rg: 'Elite', f: 'Brewer Corporation', l: 'Clean', e: 'NOVA', pw: '', pm: null, sys: 'Potamoi', d: now - 5400, p: now - 86400 * 5, nb: 4, par: 'Kairo' },
            { n: 'Tess Orlan', s: 'cobramkv', sl: 'Cobra Mk V', rg: 'Expert', f: 'Ice Storm Squadron', l: 'Friend', e: 'ISS', pw: '', pm: null, sys: 'Karnarki', d: now - 86400, p: now - 86400 * 3, nb: 1, par: 'Nova' }
        ];
        const t = ton(L[0]), col = COUL[t];
        const lock = ok ? window.HoloVaisseau.mini('python', 'jvl', true) : '';
        const ligne = (x, i) => '<div class="jv-l" style="--t:' + COUL[ton(x)] + ';animation-delay:' + (1.1 + i * 0.25) + 's"><i></i><b>CMD ' + E(x.n.toUpperCase()) + '</b><em>' + E(x.sl) + '</em>' + (x.pm > 0 ? '<span>PRIME ' + FR(x.pm) + ' CR</span>' : '<span class="g">' + E(x.f) + '</span>') + '<u>' + il(x.d).replace('il y a ', '') + '</u></div>';
        return '<div class="jv">'
            + '<div class="jv-lock" style="--t:' + col + '"><div class="jv-tete"><span class="jv-pt"></span>VERROUILLAGE EN COURS</div>'
            + '<div class="jv-corps"><div class="jv-holo">' + lock + '<svg class="jv-ret" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="86"/><circle cx="100" cy="100" r="58" stroke-dasharray="4 8"/><path d="M100 4v34M100 162v34M4 100h34M162 100h34"/><path class="r" d="M100 14a86 86 0 0 1 74 43" stroke-width="3"/></svg></div>'
            + '<div class="jv-scan"><div>CMD ' + E(L[0].n.toUpperCase()) + '</div><div class="s">' + E(L[0].sl.toUpperCase()) + ' · ' + E(L[0].rg.toUpperCase()) + '</div><div class="s">' + E(L[0].f) + ' [' + E(L[0].e) + ']</div><div class="p">PRIME ' + FR(L[0].pm) + ' CR · RECHERCHÉ</div></div></div></div>'
            + '<div class="jv-fl" aria-hidden="true"><svg viewBox="0 0 60 120"><path d="M6 60h40M34 44l16 16-16 16"/></svg><span>ENREGISTRÉ<br>POUR 30 JOURS</span></div>'
            + '<div class="jv-qg"><div class="jv-cap">AU QG ET DANS L’ONGLET COMBAT</div><div id="jv-carte" class="jv-carte">' + carteHtml({ total: 27, semaine: 9, dernier: now - 540 }, L, 'jv-carte', true) + '</div>'
            + '<div class="jv-liste">' + L.map(ligne).join('') + '</div></div></div>'
            ;
    };
    // a appeler une fois le visuel insere dans la page : dessine le vaisseau de la carte d'apercu
    JC.visuelApres = function () { const L = [{ s: 'python', l: 'Wanted', pm: 1 }]; holoCarte('jv-carte', L[0]); };

    // ---- bouton de l'onglet Combat (cache tant que la fonction n'est pas disponible)
    JC.monterBouton = async function (id) {
        const b = document.getElementById(id); if (!b) return;
        const r = await JC.resume(); if (!r) { b.style.display = 'none'; return; }
        style();
        b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.6 2.7-6 6-6s6 2.4 6 6"/><circle cx="17.5" cy="9" r="2.4"/><path d="M16.5 14.2c3 .2 5 2.2 5 5.3"/></svg>JOUEURS CROISÉS<b>' + FR(r.total) + '</b>';
        b.style.display = '';
    };

    // ---- la fenetre
    const ST = { liste: [], q: '', tri: 'recent', filtre: 'tous', ouvert: null, nb: PAGE, holo: false };
    function ton(x) { return tonDe(x); }
    const tonDe = x => /\b(ami|amie|friend|ally|allie|allié)\b/i.test(x.l || '') ? 'v' : (x.pm > 0 || /wanted|recherch|outlaw|hors.la.loi/i.test(x.l || '')) ? 'r' : 'b';
    function nomV(x) { return nomDe(x); }
    const joli = k => String(k || '').replace(/_nx$/i, '').replace(/_/g, ' ').replace(/\b[a-z]/g, c => c.toUpperCase());
    const nomBrut = (n, k) => n && String(n).toLowerCase() !== String(k || '').toLowerCase() ? n : '';
    const nomDe = x => nomBrut(typeof nomVaisseau === 'function' && x.s ? nomVaisseau(x.s) : '', x.s) || nomBrut(x.sl, x.s) || (typeof SILHOUETTES !== 'undefined' && x.s && SILHOUETTES[String(x.s).toLowerCase()] && SILHOUETTES[String(x.s).toLowerCase()].nom) || joli(x.s);
    function filtrer() {
        const q = ST.q.trim().toLowerCase();
        let L = ST.liste.filter(x => (!q || [x.n, x.sl, x.s, x.rg, x.f, x.e, x.pw, x.sys, x.par].some(v => String(v || '').toLowerCase().includes(q)))
            && (ST.filtre === 'tous' || (ST.filtre === 'recherches' && ton(x) === 'r') || (ST.filtre === 'revus' && x.nb > 1) || (ST.filtre === 'escadron' && x.e)));
        return L.slice().sort(ST.tri === 'nb' ? (a, b) => (b.nb - a.nb) || (b.d - a.d) : (a, b) => b.d - a.d);
    }
    function holo(x, i, grand) {
        if (!ST.holo) return '';
        const t = ton(x), H = window.HoloVaisseau, id = (grand ? 'jg' : 'jt') + i, rouge = t === 'r' ? true : t;
        try { return H.mini(x.s, id, rouge); } catch (e) { return ''; }
    }
    function bande() {
        const L = ST.liste, rech = L.filter(x => ton(x) === 'r').length, revus = L.filter(x => x.nb > 1).length, der = L.reduce((m, x) => Math.max(m, x.d || 0), 0);
        return '<div><small>JOUEURS CROISÉS</small><b>' + FR(L.length) + '</b></div><div class="r"><small>RECHERCHÉS</small><b>' + FR(rech) + '</b></div><div><small>REVUS PLUSIEURS FOIS</small><b>' + FR(revus) + '</b></div><div><small>DERNIER CROISÉ</small><b class="p">' + (der ? il(der).toUpperCase() : '—') + '</b></div>';
    }
    // puissance : le jeu ne la donne qu'apres un scan complet (comme le statut legal) ; sans elle, statut connu = aucune puissance soutenue, statut inconnu = scan incomplet
    const pwHtml = x => x.pw ? '<span class="pw">' + E(x.pw) + '</span>' : '<span class="pw0">' + (x.l ? 'Aucune puissance soutenue' : 'Puissance non relevée') + '</span>';
    function ligne(x, i) {
        const t = ton(x), nom = nomV(x), ouv = ST.ouvert === x.n.toLowerCase();
        const det = (c, v, cls) => v ? '<div' + (cls ? ' class="' + cls + '"' : '') + '><small>' + c + '</small><b>' + v + '</b></div>' : '';
        const pc = x.pm > 0 ? '<span class="jc-chip" style="--t:#FF3B30">PRIME ' + FR(x.pm) + ' CR</span>' : (t === 'r' ? '<span class="jc-chip" style="--t:#FF3B30">RECHERCHÉ</span>' : '');
        return '<div class="jc-r' + (ouv ? ' ouv' : '') + '" style="--t:' + COUL[t] + '"><div class="jc-l" onclick="JCroises.basculer(this.parentNode)" data-k="' + E(x.n.toLowerCase()) + '" tabindex="0" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();this.click();}">'
            + '<div class="jc-th">' + holo(x, i, false) + '</div>'
            + '<div class="nm">CMD ' + E(x.n.toUpperCase()) + '<small>' + E(String(nom)) + (x.rg ? ' · ' + E(String(x.rg).toUpperCase()) : '') + '<span class="mt"> · ' + il(x.d) + (x.pm > 0 ? ' · PRIME ' + FR(x.pm) + ' CR' : '') + '</span></small></div>'
            + '<div class="fa">' + (x.f ? '<div>' + E(x.f) + '</div>' : '') + '<div>' + pwHtml(x) + '</div>' + (x.e ? '<div><i>[' + E(x.e) + ']</i></div>' : '') + '</div><div class="pc">' + pc + '</div>'
            + '<div class="vu">' + il(x.d) + '</div><div class="nb" title="Croisements : un verrouillage séparé du précédent d’au moins 10 minutes">×' + x.nb + '</div></div>'
            + '<div class="jc-d"><div class="jc-g">' + (ouv ? holo(x, i, true) : '') + '</div><div class="jc-dt"><div class="tt"><span class="jc-chip">' + LIB[t] + '</span></div>'
            + det('PREMIÈRE VUE', date(x.p)) + det('DERNIÈRE VUE', date(x.d)) + det('DERNIER SYSTÈME', E(x.sys)) + det('VU PAR', x.par ? 'CMDR ' + E(String(x.par).toUpperCase()) : '')
            + det('VAISSEAU', E(String(nom))) + det('RANG', E(x.rg)) + det('FACTION', E(x.f)) + det('ESCADRON DU JOUEUR', E(x.e)) + det('PUISSANCE', x.pw ? E(x.pw) : (x.l ? 'Aucune puissance soutenue' : 'Non relevée (scan incomplet)')) + det('STATUT LÉGAL', E(x.l))
            + det('PRIME', x.pm > 0 ? FR(x.pm) + ' cr' : '', 'pr') + det('CROISEMENTS', x.nb) + '</div></div></div>';
    }
    function lignes() {
        const L = filtrer();
        const n = document.getElementById('jc-n'); if (n) n.textContent = L.length === ST.liste.length ? FR(ST.liste.length) + ' joueur' + (ST.liste.length > 1 ? 's' : '') : FR(L.length) + ' sur ' + FR(ST.liste.length);
        if (!ST.liste.length) return '<div class="jc-vide">Aucun joueur croisé pour l’instant.<br>Ils s’enregistrent quand un pilote de l’escadron en verrouille un dans l’onglet Combat (plugin à jour).</div>';
        if (!L.length) return '<div class="jc-vide">Aucun joueur ne correspond à cette recherche ou à ce filtre.</div>';
        const vus = L.slice(0, ST.nb);
        return vus.map((x, i) => ligne(x, i)).join('') + (L.length > vus.length ? '<button type="button" class="jc-plus" onclick="JCroises.plus()">AFFICHER LES SUIVANTS (' + FR(L.length - vus.length) + ')</button>' : '');
    }
    function maj() { const c = document.getElementById('jc-c'); if (c) c.innerHTML = lignes(); }
    JC.plus = function () { ST.nb += PAGE; maj(); };
    JC.basculer = function (r) {
        if (typeof sonClic === 'function') sonClic();
        const k = r.firstChild.getAttribute('data-k'), ouvre = ST.ouvert !== k; ST.ouvert = ouvre ? k : null;
        document.querySelectorAll('#jc-plein .jc-r.ouv').forEach(o => { if (o !== r) o.classList.remove('ouv'); });
        r.classList.toggle('ouv', ouvre);
        if (ouvre) { const x = ST.liste.find(y => y.n.toLowerCase() === k), g = r.querySelector('.jc-g'); if (x && g && !g.firstChild) g.innerHTML = holo(x, 'x', true); }
    };
    JC.filtre = function (v) { ST.q = String(v || ''); ST.nb = PAGE; maj(); };
    JC.tri = function (v) { ST.tri = v === 'nb' ? 'nb' : 'recent'; ST.nb = PAGE; maj(); };
    JC.cat = function (f, b) { ST.filtre = f; ST.nb = PAGE; document.querySelectorAll('#jc-plein .jc-f button').forEach(x => x.classList.toggle('on', x === b)); maj(); };
    JC.fermer = function () { const m = document.getElementById('jc-plein'); if (m) m.remove(); document.removeEventListener('keydown', cle, true); };
    function cle(e) { if (e.key === 'Escape' && document.getElementById('jc-plein')) { e.stopPropagation(); JC.fermer(); } }
    JC.ouvrir = async function () {
        style(); if (typeof sonClic === 'function') sonClic();
        JC.fermer();
        const m = document.createElement('div'); m.id = 'jc-plein'; m.onclick = e => { if (e.target === m) JC.fermer(); };
        m.innerHTML = '<div class="jc-p" role="dialog" aria-modal="true"><div class="jc-h"><div><small>COMBAT · ESCADRON</small><b>JOUEURS CROISÉS</b></div><button type="button" class="jc-x" onclick="JCroises.fermer()">FERMER</button></div>'
            + '<div class="jc-st" id="jc-st"></div>'
            + '<div class="jc-b"><input id="jc-q" class="jc-q" type="search" placeholder="Filtrer : nom, vaisseau, faction, escadron, système…" oninput="JCroises.filtre(this.value)">'
            + '<div class="jc-f"><button type="button" class="on" onclick="JCroises.cat(\'tous\',this)">TOUS</button><button type="button" onclick="JCroises.cat(\'recherches\',this)">RECHERCHÉS</button><button type="button" onclick="JCroises.cat(\'revus\',this)">REVUS</button><button type="button" onclick="JCroises.cat(\'escadron\',this)">AVEC ESCADRON</button></div>'
            + '<select class="jc-s" onchange="JCroises.tri(this.value)"><option value="recent">Les plus récents</option><option value="nb">Les plus croisés</option></select><span class="jc-n" id="jc-n"></span></div>'
            + '<div class="jc-c" id="jc-c"><div class="jc-vide">Chargement…</div></div>'
            + '<div class="jc-note">Joueurs que les pilotes de l’escadron ont verrouillés dans l’onglet Combat. Une fiche par joueur, conservée 30 jours après la dernière fois qu’il est croisé. Les membres de l’escadron n’y figurent pas. Statut légal et prime n’apparaissent qu’après un scan assez long. Rouge : recherché ou prime · vert : allié · bleu : neutre.</div></div>';
        document.body.appendChild(m); document.addEventListener('keydown', cle, true);
        ST.q = ''; ST.ouvert = null; ST.filtre = 'tous'; ST.nb = PAGE; ST.tri = 'recent';
        try {
            const c = client(); const [r] = await Promise.all([c ? c.rpc('joueurs_croises_lire', { p_limite: 300 }) : null, holos().then(ok => { ST.holo = ok; })]);
            if (!r || r.error || !r.data) throw new Error(r && r.error ? r.error.message : 'indisponible');
            ST.liste = (r.data.liste || []).filter(x => x && x.n);
            const st = document.getElementById('jc-st'); if (st) st.innerHTML = bande();
            maj();
            const q = document.getElementById('jc-q'); if (q) q.focus();
        } catch (e) { const cc = document.getElementById('jc-c'); if (cc) cc.innerHTML = '<div class="jc-vide">Impossible de charger la liste pour le moment.</div>'; console.error('Joueurs croisés :', e); }
    };
})();
