// FRERES D'ARMES, cote site : la fenetre de la Carriere (rang, medaille, diplomes) et le diplome lui-meme.
//   window.edteamFreresArmes.ouvrir()        fenetre « Freres d'armes » (ouverte par la pastille de l'en-tete : navigation.js, ouvrirCarriere('fa'))
//   window.edteamFreresArmes.donnees()       { n, etoiles, metal, non_vus, diplomes[] } (SQL 204, mes_freres_armes), en memoire 10 min dans la session
//   window.edteamFreresArmes.diplome(id)     ouvre un diplome
// Charge A LA DEMANDE avec medaille.js (le dessin de la medaille). Aucune image : les logos d'escadron viennent du stockage public existant (bucket logos).
(function () {
    'use strict';
    if (window.edteamFreresArmes) return;
    var TTL = 600000, donnees = null, enCours = null;
    var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
    var client = function () { return window.supabaseApp || (typeof supabaseApp !== 'undefined' ? supabaseApp : null); };
    var uid = function () { var p = window.profilCommandant || {}; return p.user_id || window.__faUid || ''; };
    var cle = function () { return 'edteam_fa_v1_' + uid(); };
    var SEUILS = [1, 3, 5, 10, 20, 30, 50, 100];
    var NOM_PALIER = { 1: 'la 1re étoile', 3: 'la 2e étoile', 5: 'la 3e étoile', 10: 'la 4e étoile', 20: 'la 5e étoile', 30: 'le métal ARGENT', 50: 'le métal OR', 100: 'le métal DIAMANT' };
    var COUL = { bronze: '#e39a52', argent: '#e8f1f8', or: '#ffd24a', diamant: '#8fe6ff' };

    function chargerScript(src) { return new Promise(function (ok, ko) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = ko; document.head.appendChild(s); }); }
    async function assurerMedaille() { if (!window.EdteamMedaille) await chargerScript('medaille.js?v=2'); window.EdteamMedaille.css(); return window.EdteamMedaille; }

    // ---------- donnees ----------
    function lireCache() { try { var c = JSON.parse(sessionStorage.getItem(cle()) || 'null'); if (c && Date.now() - c.ts < TTL) return c.d; } catch (e) { /* memoire illisible */ } return null; }
    function ecrireCache(d) { try { sessionStorage.setItem(cle(), JSON.stringify({ ts: Date.now(), d: d })); } catch (e) { /* stockage plein */ } }
    async function charger(force) {
        if (!force) { if (donnees) return donnees; var c = lireCache(); if (c) { donnees = c; return c; } }
        if (enCours && !force) return enCours;
        var db = client(); if (!db) return null;
        enCours = db.rpc('mes_freres_armes').then(function (r) { enCours = null; if (r.error || !r.data || typeof r.data !== 'object') return null; donnees = r.data; ecrireCache(donnees); return donnees; }, function () { enCours = null; return null; });
        return enCours;
    }
    function invalider() { donnees = null; try { sessionStorage.removeItem(cle()); } catch (e) { /* rien */ } }
    function dateFr(iso) { var d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('fr-FR'); }

    // les campagnes de MA medaille, dans l'ordre : la graduation N = la N-ieme campagne aidee (jusqu'a la 100e : les plus anciennes au-dela ne sont pas relues)
    function campagnesJusqua(d, n) {
        var asc = (d.diplomes || []).slice().reverse(), decal = (d.n || 0) - asc.length, out = [];
        for (var i = 0; i < n; i++) { var x = asc[i - decal]; out.push(x ? { nom: x.campagne, hote: x.hote, date: dateFr(x.le) } : null); }
        return out;
    }

    // ---------- styles ----------
    function css() {
        if (document.getElementById('edteam-fa-css')) return;
        var HEXGRID = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='97' viewBox='0 0 56 97'%3E%3Cpath d='M28 0v32.3L0 48.5M28 32.3l28 16.2M28 64.7V97M0 48.5v32.3L28 97M56 48.5v32.3L28 97' fill='none' stroke='%233ec9ff' stroke-opacity='.07' stroke-width='1'/%3E%3C/svg%3E\")";
        var s = document.createElement('style'); s.id = 'edteam-fa-css';
        s.textContent = ''
            // ---- fenetre : MEME GABARIT que « Joueurs croises » (fond plein ecran, panneau jusqu'a 1120 x 860, coins coupes)
            + '.faw-fond { position:fixed; inset:0; z-index:8000; display:flex; align-items:center; justify-content:center; padding:clamp(10px,3vh,30px) clamp(10px,3vw,40px); background:rgba(2,3,5,.88); backdrop-filter:blur(3px); font-family:"Share Tech Mono",Consolas,monospace; }'
            + '.faw { position:relative; width:min(1120px,100%); height:100%; max-height:860px; display:flex; flex-direction:column; background:linear-gradient(180deg,rgba(62,201,255,.08),rgba(4,6,9,.985) 20%); border:1px solid #3ec9ff; box-shadow:0 0 34px rgba(62,201,255,.22); color:#ccc; clip-path:polygon(0 0,calc(100% - 18px) 0,100% 18px,100% 100%,18px 100%,0 calc(100% - 18px)); }'
            + '.faw-hh { padding:16px 24px 13px; border-bottom:1px solid rgba(62,201,255,.3); position:relative; flex:none; } .faw-hh small { display:block; color:#888; font-size:11px; letter-spacing:2px; margin-bottom:4px; } .faw-hh b { color:#3ec9ff; font-size:21px; letter-spacing:3px; } .faw-x { position:absolute; right:22px; top:16px; color:#3ec9ff; cursor:pointer; }'
            + '.faw-corps { flex:1; min-height:0; display:flex; flex-direction:column; overflow-y:auto; scrollbar-width:thin; scrollbar-color:#3ec9ff #0b0b0b; }'
            // bandeau du rang (horizontal) : la medaille a gauche, le rang a droite
            + '.faw-rang { flex:none; display:flex; align-items:center; gap:34px; padding:22px 32px; border-bottom:1px solid #121b23; background:radial-gradient(60% 140% at 12% 50%,rgba(62,201,255,.07),transparent); }'
            + '.faw-rang .mm { flex:none; }'
            + '.faw-et { display:flex; gap:7px; margin:0 0 9px; } .faw-et svg { width:30px; height:30px; } .faw-et .off { opacity:.22; }'
            + '.faw-t { color:#fff; font-size:21px; letter-spacing:2px; } .faw-s { color:#8b97a0; font-size:13px; line-height:1.6; margin-top:5px; max-width:640px; }'
            + '.faw-prog { margin:14px 0 0; height:7px; background:rgba(255,255,255,.08); border-radius:3px; overflow:hidden; max-width:640px; } .faw-prog i { display:block; height:100%; background:#3ec9ff; box-shadow:0 0 6px #3ec9ff; }'
            + '.faw-pal { display:flex; justify-content:space-between; font-size:10px; color:#566; margin-top:5px; letter-spacing:1px; max-width:640px; } .faw-pal .ok { color:#FFD24A; }'
            // liste des diplomes : une grille qui se remplit (plus de vide, quelle que soit la taille de l'ecran)
            + '.faw-dl { flex:1; padding:18px 32px 28px; } .faw-dl h4 { margin:0 0 12px; color:#9ab; font-size:11px; letter-spacing:3px; font-weight:normal; }'
            + '.faw-grille { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(100%,420px),1fr)); gap:12px; }'
            + '.faw-d { display:flex; align-items:center; gap:14px; padding:12px 14px; background:linear-gradient(90deg,rgba(255,210,74,.07),#0a1017 55%); border:1px solid #1b2730; border-left:3px solid #FFD24A; cursor:pointer; min-width:0; } .faw-d:hover { background:linear-gradient(90deg,rgba(255,210,74,.13),#0e1721 55%); }'
            + '.faw-d .md { flex:none; line-height:0; } .faw-d .tx { min-width:0; flex:1; } .faw-d b { color:#fff; font-size:13px; letter-spacing:1px; display:block; overflow-wrap:anywhere; } .faw-d span { color:#8b97a0; font-size:11px; display:block; } .faw-d .mo { color:#9fd3e0; font-style:italic; margin-top:3px; font-size:11.5px; overflow-wrap:anywhere; }'
            + '.faw-d em { flex:none; color:#667; font-style:normal; font-size:11px; white-space:nowrap; text-align:right; } .faw-d.nv { border-left-color:#FF7100; } .faw-d.nv em { color:#FF7100; } .faw-d .env { display:inline; color:#3ec9ff; margin-left:6px; font-size:11px; }'
            + '.faw-vide { color:#778; font-size:13px; line-height:1.7; padding:6px 0; }'
            + '@media (max-width:760px) { .faw-rang { flex-direction:column; text-align:center; padding:18px 16px; gap:14px; } .faw-et { justify-content:center; } .faw-dl { padding:14px 14px 22px; } .faw-prog, .faw-pal, .faw-s { margin-left:auto; margin-right:auto; } }'

            // ---- DIPLOME : document holographique (paysage, coins coupes, bordure irisee, quadrillage hexagonal, cachet d'authenticite)
            + '.fad-fond { z-index:8500; overflow:auto; }'
            + '.fad { position:relative; width:880px; flex:none; padding:2px; transform-origin:center; clip-path:polygon(0 0,calc(100% - 30px) 0,100% 30px,100% 100%,30px 100%,0 calc(100% - 30px)); }'
            + '.fad-bord { position:absolute; inset:0; background:conic-gradient(from 20deg,#FFD24A,#3ec9ff,#b07cff,#FF7100,#FFD24A); animation:fad-irid 9s linear infinite; }'
            + '@keyframes fad-irid { to { filter:hue-rotate(360deg); } }'
            + '.fad-in { position:relative; overflow:hidden; clip-path:polygon(0 0,calc(100% - 29px) 0,100% 29px,100% 100%,29px 100%,0 calc(100% - 29px)); padding:24px 44px 26px; color:#cfd8de;'
            + ' background:radial-gradient(70% 55% at 50% 0%,rgba(255,210,74,.13),transparent 70%),radial-gradient(60% 60% at 100% 100%,rgba(62,201,255,.10),transparent 70%),' + HEXGRID + ',linear-gradient(180deg,#0a0f16,#05080c); }'
            + '.fad-in::before { content:""; position:absolute; top:0; bottom:0; width:160px; left:-220px; background:linear-gradient(100deg,transparent,rgba(255,236,170,.16),transparent); animation:fad-balai 5.2s ease-in-out infinite; pointer-events:none; } @keyframes fad-balai { 0%,45% { left:-220px; } 100% { left:105%; } }'
            + '.fad-in::after { content:""; position:absolute; inset:0; background:repeating-linear-gradient(0deg,rgba(255,255,255,.018) 0 1px,transparent 1px 3px); pointer-events:none; }'
            + '.fad-fr { position:absolute; left:0; top:0; z-index:3; pointer-events:none; }'
            + '.fad .etin { position:absolute; width:5px; height:5px; background:#fff3c4; border-radius:50%; box-shadow:0 0 8px 2px rgba(255,236,170,.9); animation:fad-sc 2.6s ease-in-out infinite; opacity:0; z-index:1; } @keyframes fad-sc { 0%,100% { opacity:0; transform:scale(.4); } 50% { opacity:1; transform:scale(1.2); } }'
            + '.fad-x { color:#FFD24A; cursor:pointer; font-size:14px; margin-left:18px; padding:0 2px; }'
            + '.fad-top { position:relative; z-index:4; display:flex; justify-content:flex-start; align-items:center; font-size:10px; letter-spacing:3px; color:#6f8190; padding:0 0 10px; border-bottom:1px solid rgba(255,210,74,.22); } .fad-top i { display:inline-block; width:7px; height:7px; background:#3ec9ff; border-radius:50%; margin:0 8px 1px 0; box-shadow:0 0 8px #3ec9ff; animation:fad-pt 1.6s ease-in-out infinite; } @keyframes fad-pt { 50% { opacity:.25; } } .fad-top .no { color:#FFD24A; margin-left:auto; }'
            + '.fad-tete { position:relative; z-index:2; display:flex; align-items:center; justify-content:center; gap:26px; padding:16px 0 4px; }'
            + '.fad-logo { position:relative; flex:none; width:88px; height:88px; display:grid; place-items:center; } .fad-logo .lg { position:relative; width:76px; height:76px; border-radius:50%; background:#0b1118; border:2px solid rgba(255,210,74,.75); display:grid; place-items:center; color:#9fb3c4; font-size:22px; letter-spacing:1px; box-shadow:0 0 22px rgba(255,210,74,.3); overflow:hidden; } .fad-logo .lg img { position:absolute; inset:0; width:100%; height:100%; object-fit:contain; padding:5px; box-sizing:border-box; }'
            + '.fad-logo .or { position:absolute; inset:0; border-radius:50%; border:1px dashed rgba(62,201,255,.55); animation:fad-or 18s linear infinite; } .fad-logo .or::after { content:""; position:absolute; top:-3px; left:50%; width:6px; height:6px; margin-left:-3px; background:#3ec9ff; border-radius:50%; box-shadow:0 0 8px #3ec9ff; } @keyframes fad-or { to { transform:rotate(360deg); } }'
            + '.fad-ti { text-align:left; } .fad-ti .k { color:#b9a45a; font-size:11px; letter-spacing:6px; } .fad-ti .tt { color:#FFD24A; font-size:30px; letter-spacing:7px; margin:5px 0 3px; line-height:1.1; text-shadow:0 0 16px rgba(255,210,74,.4); } .fad-ti .st { color:#3ec9ff; font-size:12px; letter-spacing:8px; }'
            + '.fad-corps { position:relative; z-index:2; display:grid; grid-template-columns:200px minmax(0,1fr) 230px; gap:26px; align-items:center; padding:14px 0 6px; }'
            + '.fad-g { text-align:center; } .fad-hex { position:relative; width:160px; height:176px; margin:0 auto 8px; background:linear-gradient(160deg,#FFD24A,#7a5c10 60%,#FFD24A); clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%); filter:drop-shadow(0 0 16px rgba(255,210,74,.45)); } .fad-hex .hi { position:absolute; inset:4px; clip-path:inherit; background:#0b1118; display:grid; place-items:center; overflow:hidden; color:#9fb3c4; font-size:34px; } .fad-hex .hi * { border-radius:0 !important; max-width:none; } .fad-hex .hi img { width:100% !important; height:100% !important; object-fit:cover; }'
            + '.fad-g .esc { color:#7d8a95; font-size:10px; letter-spacing:3px; }'
            + '.fad-m .dec { color:#7d8a95; font-size:11px; letter-spacing:5px; } .fad-m .qui { color:#fff; font-size:34px; letter-spacing:4px; line-height:1.15; margin:6px 0 4px; overflow-wrap:anywhere; text-shadow:0 0 18px rgba(255,255,255,.18); } .fad-m .de { color:#8b97a0; font-size:12px; letter-spacing:3px; margin-bottom:6px; }'
            + '.fad-m .corps { color:#c8d2d9; font-size:15px; line-height:1.7; } .fad-m .corps b { display:block; color:#3ec9ff; font-weight:normal; font-size:19px; letter-spacing:2px; margin:3px 0; overflow-wrap:anywhere; } .fad-m .corps small { color:#8b97a0; font-size:12px; letter-spacing:2px; }'
            + '.fad-msg { position:relative; margin-top:14px; padding:11px 16px 11px 18px; border:1px solid rgba(62,201,255,.4); border-left:4px solid #3ec9ff; background:linear-gradient(90deg,rgba(62,201,255,.10),rgba(62,201,255,.02)); } .fad-msg .h { color:#3ec9ff; font-size:10px; letter-spacing:4px; margin-bottom:4px; } .fad-msg .q { color:#eef6fa; font-style:italic; font-size:15px; line-height:1.55; overflow-wrap:anywhere; }'
            + '.fad-msg .q.l { font-size:13.5px; line-height:1.5; } .fad-msg .q.xl { font-size:12px; line-height:1.45; }'
            + '.fad-d { text-align:center; } .fad-d .mdl { display:inline-block; cursor:zoom-in; position:relative; } .fad-d .pied-m { margin-top:10px; color:#9aa8b2; font-size:11px; letter-spacing:3px; line-height:1.7; } .fad-d .pied-m b { color:#FFD24A; font-weight:normal; display:block; font-size:13px; }'
            + '.fad-d .halo { position:absolute; left:50%; top:50%; width:230px; height:230px; margin:-115px 0 0 -115px; border-radius:50%; background:radial-gradient(circle,rgba(255,210,74,.2),transparent 65%); pointer-events:none; }'
            + '.fad-pied { position:relative; z-index:2; display:flex; align-items:center; justify-content:space-between; gap:20px; margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,210,74,.22); }'
            + '.fad-sg { display:flex; align-items:center; gap:12px; min-width:0; } .fad-sg .hx { position:relative; width:50px; height:56px; flex:none; background:#3ec9ff; clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%); } .fad-sg .hx .hi { position:absolute; inset:2px; clip-path:inherit; background:#0b1118; display:grid; place-items:center; overflow:hidden; color:#9fb3c4; font-size:14px; } .fad-sg .hx .hi * { border-radius:0 !important; max-width:none; } .fad-sg .hx .hi img { width:100% !important; height:100% !important; object-fit:cover; }'
            + '.fad-sg b { display:block; color:#fff; letter-spacing:3px; font-size:14px; overflow-wrap:anywhere; } .fad-sg i { color:#8b97a0; font-style:normal; font-size:11px; letter-spacing:2px; }'
            + '.fad-au { display:flex; align-items:center; gap:14px; color:#6f8190; font-size:10px; letter-spacing:3px; text-align:right; line-height:1.7; } .fad-au b { display:block; color:#2fe07a; font-weight:normal; letter-spacing:4px; } .fad-au svg { display:block; opacity:.85; }'
            + '.fan { display:flex; flex-direction:column; align-items:center; gap:10px; max-width:100%; } .fan-k { color:#FFD24A; font-size:12px; letter-spacing:8px; } .fan-t { color:#fff; font-size:20px; letter-spacing:5px; text-align:center; text-shadow:0 0 14px rgba(255,210,74,.35); } .fan-t small { color:#8b97a0; font-size:12px; letter-spacing:2px; }'
            + '.fan-bt { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin-top:4px; } .fan-bt button { background:transparent; border:1px solid #555; color:#bbb; font:inherit; font-size:12px; letter-spacing:3px; padding:10px 18px; cursor:pointer; } .fan-bt button:hover { border-color:#FFD24A; color:#FFD24A; } .fan-bt button.ok { border-color:#FFD24A; color:#FFD24A; background:rgba(255,210,74,.08); font-weight:bold; }'
            + '.fan-fond { z-index:8600; }'
            // fenetre « Remercier vos allies ? » (Amiral hote, apres la cloture)
            + '.far-fond { z-index:8700; } .far { position:relative; width:min(560px,100%); background:linear-gradient(180deg,rgba(255,210,74,.08),rgba(4,6,9,.985) 22%); border:1px solid #FFD24A; box-shadow:0 0 34px rgba(255,210,74,.2); padding:22px 26px 20px; color:#ccc; clip-path:polygon(0 0,calc(100% - 18px) 0,100% 18px,100% 100%,18px 100%,0 calc(100% - 18px)); }'
            + '.far h3 { margin:0 0 6px; color:#FFD24A; font-size:17px; letter-spacing:4px; font-weight:normal; } .far .sb { color:#8b97a0; font-size:12.5px; line-height:1.6; margin-bottom:14px; }'
            + '.far .ch { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:14px; max-height:96px; overflow-y:auto; } .far .ch span { border:1px solid rgba(62,201,255,.5); color:#3ec9ff; font-size:11px; padding:3px 9px; letter-spacing:1px; background:rgba(62,201,255,.07); }'
            + '.far textarea { width:100%; height:92px; box-sizing:border-box; background:#05080b; border:1px solid #2a3640; color:#ddd; font:inherit; font-size:13px; padding:10px; resize:none; } .far textarea:focus { outline:0; border-color:#FFD24A; }'
            + '.far .cpt { text-align:right; color:#566; font-size:10px; margin:3px 0 12px; } .far .bt { display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap; } .far .bt button { background:transparent; border:1px solid #555; color:#bbb; font:inherit; font-size:12px; letter-spacing:2px; padding:9px 16px; cursor:pointer; } .far .bt button.ok { border-color:#00FF66; color:#00FF66; background:rgba(0,255,102,.08); font-weight:bold; } .far .bt button:disabled { opacity:.5; cursor:default; }'
            + '.far .msg { min-height:16px; font-size:12px; margin-bottom:6px; color:#ff8a8a; }'
            // onglet « Freres d'armes » de la page Escadron
            + '.fae-h { display:flex; flex-wrap:wrap; gap:10px 28px; align-items:baseline; margin:2px 0 14px; color:#8b97a0; font-size:13px; } .fae-h b { color:#3ec9ff; font-size:15px; letter-spacing:3px; font-weight:normal; } .fae-h em { color:#FFD24A; font-style:normal; }'
            + '.fae-g { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr)); gap:12px; }'
            + '.fae-c { display:flex; align-items:center; gap:14px; padding:12px 14px; background:linear-gradient(90deg,rgba(62,201,255,.07),#0a1017 55%); border:1px solid #1b2730; border-left:3px solid #3ec9ff; min-width:0; }'
            + '.fae-c .av { flex:none; width:46px; height:46px; border-radius:50%; overflow:hidden; display:grid; place-items:center; background:#16202a; border:2px solid #3ec9ff; color:#9fb3c4; font-size:13px; } .fae-c .av.sol { border-color:#ffb347; } .fae-c .tx { min-width:0; flex:1; } .fae-c b { display:block; color:#fff; letter-spacing:1px; font-size:13px; overflow-wrap:anywhere; } .fae-c span { display:block; color:#8b97a0; font-size:11px; overflow-wrap:anywhere; }'
            + '.fae-c .md { flex:none; line-height:0; cursor:zoom-in; } .fae-c .nb { flex:none; text-align:right; color:#FFD24A; font-size:13px; line-height:1.4; } .fae-c .nb small { display:block; color:#7d8a95; font-size:10px; }'
            + '.fae-pc { padding:6px 0 4px; } .fae-carte .eff-nom { font-size:1.02em; } .fae-carte .eff-img { overflow:hidden; } .fae-md { position:absolute; right:8px; bottom:8px; z-index:3; line-height:0; cursor:zoom-in; filter:drop-shadow(0 2px 6px rgba(0,0,0,.8)); }'
            + '.fae-lg { display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:.72em; color:#999; } .fae-lg small { display:block; color:#7d8a95; font-size:.9em; letter-spacing:1px; margin-bottom:2px; } .fae-lg b { color:#fff; font-size:1.2em; font-weight:normal; }'
            + '.fae-vide { color:#778; font-size:13px; line-height:1.7; padding:10px 2px; }'
            + '.fae-m { margin-top:22px; } .fae-m h4 { margin:0 0 10px; color:#9ab; font-size:11px; letter-spacing:3px; font-weight:normal; }'
            + '.fae-r { display:flex; align-items:center; gap:12px; padding:10px 12px; margin-bottom:8px; background:#0a1017; border:1px solid #1b2730; border-left:3px solid #FFD24A; } .fae-r .tx { flex:1; min-width:0; } .fae-r b { display:block; color:#fff; font-size:13px; letter-spacing:1px; overflow-wrap:anywhere; } .fae-r span { color:#8b97a0; font-size:11px; overflow-wrap:anywhere; } .fae-r span.mo { display:block; color:#9fd3e0; font-style:italic; margin-top:2px; }'
            + '.fae-r button { flex:none; background:transparent; border:1px solid #FFD24A; color:#FFD24A; font:inherit; font-size:11px; letter-spacing:2px; padding:7px 12px; cursor:pointer; } .fae-r button:hover { background:rgba(255,210,74,.1); }'
            + '.fad.etroit { width:440px; } .fad.etroit .fad-in { padding:22px 26px 22px; }'
            + '.fad.etroit .fad-top { letter-spacing:1px; font-size:9px; } .fad.etroit .fad-top .no { letter-spacing:1px; }'
            + '.fad.etroit .fad-tete { flex-direction:column; gap:10px; text-align:center; } .fad.etroit .fad-ti { text-align:center; } .fad.etroit .fad-ti .tt { font-size:22px; letter-spacing:4px; } .fad.etroit .fad-ti .k { letter-spacing:4px; }'
            + '.fad.etroit .fad-corps { grid-template-columns:1fr; gap:14px; text-align:center; } .fad.etroit .fad-hex { width:120px; height:132px; } .fad.etroit .fad-m .qui { font-size:26px; letter-spacing:3px; } .fad.etroit .fad-m .corps b { font-size:17px; }'
            + '.fad.etroit .fad-msg { text-align:left; } .fad.etroit .fad-d .halo { width:200px; height:200px; margin:-100px 0 0 -100px; }'
            + '.fad.etroit .fad-pied { flex-direction:column; align-items:flex-start; gap:12px; } .fad.etroit .fad-au { align-self:stretch; justify-content:space-between; text-align:left; }'
            + '@media (prefers-reduced-motion:reduce) { .fad, .fad-in::before, .fad .etin, .fad-logo .or, .fad-top i { animation:none !important; } }';
        document.head.appendChild(s);
    }

    // ---------- avatars et logos (photos du site si disponibles, sinon initiales) ----------
    function ini(n) { var t = String(n || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase(); return t.slice(0, 2) || '?'; }
    function avatar(nom, taille) {
        var h = ''; try { if (window.EDTEAMPhotos && window.EDTEAMPhotos.avatar) h = window.EDTEAMPhotos.avatar({ nom: nom, role: 'pilote', taille: taille }); } catch (e) { h = ''; }
        return h || E(ini(nom));
    }
    function logoHote(dp) {
        var abr = String(dp.hote || '').split(/\s+/).filter(function (w) { return w.length > 1; }).map(function (w) { return w[0]; }).join('').slice(0, 3) || '?';
        // les initiales sont dessous ; le logo (s'il y en a un et s'il charge) les recouvre
        try { var l = dp.logo, db = client(); if (l && l.chemin && db) { var u = db.storage.from('logos').getPublicUrl(l.chemin).data.publicUrl; return '<span>' + E(abr) + '</span><img src="' + E(u + '?v=' + l.version) + '" alt="" onerror="this.remove()">'; } } catch (e) { /* initiales */ }
        return '<span>' + E(abr) + '</span>';
    }
    // code-barres d'authenticite : propre a chaque diplome (graine = numero), purement decoratif
    function codeBarres(id) {
        var x = 0, g = (Number(id) * 2654435761) >>> 0, h = '';
        for (var i = 0; i < 38; i++) { g = (g * 1664525 + 1013904223) >>> 0; var w = 1 + (g >>> 29) % 3; if (i % 2 === 0) h += '<rect x="' + x + '" y="0" width="' + w + '" height="26"/>'; x += w + 1; }
        return '<svg width="' + x + '" height="26" viewBox="0 0 ' + x + ' 26" fill="#3ec9ff">' + h + '</svg>';
    }

    // chemins du cadre fin pour des dimensions donnees (meme trace que tracerCadre) : sert au diplome d'exemple de l'annonce, qui n'est pas mesure a l'ecran
    function cadreChemins(W, H) {
        var i = 14, c = 35.8, a = 24;
        return '<path d="M' + i + ',' + i + ' L' + (W - c) + ',' + i + ' L' + (W - i) + ',' + c + ' L' + (W - i) + ',' + (H - i) + ' L' + c + ',' + (H - i) + ' L' + i + ',' + (H - c) + ' Z" fill="none" stroke="rgba(255,210,74,.30)" stroke-width="1"/>'
            + '<path d="M' + i + ',' + (i + a) + ' L' + i + ',' + i + ' L' + (i + a) + ',' + i + ' M' + (W - c - 10) + ',' + i + ' L' + (W - c) + ',' + i + ' L' + (W - i) + ',' + c + ' L' + (W - i) + ',' + (c + 10)
            + ' M' + (W - i - a) + ',' + (H - i) + ' L' + (W - i) + ',' + (H - i) + ' L' + (W - i) + ',' + (H - i - a) + ' M' + (c + 10) + ',' + (H - i) + ' L' + c + ',' + (H - i) + ' L' + i + ',' + (H - c) + ' L' + i + ',' + (H - c - 10) + '" fill="none" stroke="#FFD24A" stroke-width="2" stroke-linecap="square" opacity=".95"/>';
    }
    // DIPLOME D'EXEMPLE (noms fictifs, aucune donnee reelle), pour l'annonce de la fonction ; medaille.js doit etre charge
    function exemple(nn) {
        css();
        var dp = { id: 2026, pilote: 'EXEMPLE', escadron_pilote: 'ESCADRON ALLIÉ', hote: 'ESCADRON HÔTE', campagne: 'Garde d’hiver', message: 'Merci d’être venu nous prêter main-forte. On ne l’oubliera pas.', n: nn || 12, le: '2026-11-01T12:00:00Z', amiral: 'AMIRAL', logo: null };
        return '<div class="faa-dip">' + diplomeHtml(dp).replace('<svg class="fad-fr" aria-hidden="true"></svg>', '<svg class="fad-fr" aria-hidden="true" width="876" height="586" viewBox="0 0 876 586">' + cadreChemins(876, 586) + '</svg>') + '</div>';
    }

    // ---------- le diplome ----------
    function diplomeHtml(dp) {
        var M = window.EdteamMedaille, nom = dp.pilote || '', no = 'FA-' + String(dp.id).padStart(6, '0'), met = M.METAUX[M.metal(dp.n)].nom;
        var med = '<span class="mdl" data-fa-dip-med="' + dp.id + '" title="Voir ma médaille à ce moment-là"><span class="halo"></span><span class="fa-anim">' + M.html3D(dp.n, 190, { nouveau: true }) + '</span></span>';
        var ev = M.evenement(dp.n), lbl = ev.tier ? '★ MÉTAL ' + ev.tier.toUpperCase() + ' ATTEINT' : ev.etoile ? '★ ÉTOILE ' + ev.etoile + ' SUR 5' : ev.dot ? '+ 1 GRADUATION' : '';
        return '<div class="fad"><span class="fad-bord"></span><div class="fad-in"><svg class="fad-fr" aria-hidden="true"></svg>'
            + '<i class="etin" style="left:7%;top:30%"></i><i class="etin" style="left:92%;top:24%;animation-delay:.9s"></i><i class="etin" style="left:80%;top:70%;animation-delay:1.6s"></i><i class="etin" style="left:14%;top:80%;animation-delay:2.1s"></i>'
            + '<div class="fad-top"><span><i></i>SYS.EDTEAM // DISTINCTION INTER-ESCADRONS</span><span class="no">N° ' + no + '</span><span class="fad-x" data-fa-ferme>X</span></div>'
            + '<div class="fad-tete"><div class="fad-logo"><span class="or"></span><span class="lg">' + logoHote(dp) + '</span></div><div class="fad-ti"><div class="k">' + E(dp.hote) + '</div><div class="tt">DIPLÔME DE REMERCIEMENT</div><div class="st">FRÈRES D’ARMES</div></div></div>'
            + '<div class="fad-corps"><div class="fad-g"><div class="fad-hex"><span class="hi">' + avatar(nom, 160) + '</span></div><div class="esc">' + E(dp.escadron_pilote || 'PILOTE SANS ESCADRON') + '</div></div>'
            + '<div class="fad-m"><div class="dec">DÉCERNÉ À</div><div class="qui">CMDR ' + E(String(nom).toUpperCase()) + '</div><div class="de"></div>'
            + '<div class="corps">pour son soutien à la campagne<b>« ' + E(dp.campagne) + ' »</b><small>CLÔTURÉE LE ' + E(dateFr(dp.le)) + '</small></div>'
            + (dp.message ? '<div class="fad-msg"><div class="h">TRANSMISSION DE L’AMIRAL</div><div class="q' + (dp.message.length > 170 ? ' xl' : dp.message.length > 100 ? ' l' : '') + '">« ' + E(dp.message) + ' »</div></div>' : '') + '</div>'
            + '<div class="fad-d">' + med + '<div class="pied-m"><b>' + dp.n + ' CAMPAGNE' + (dp.n > 1 ? 'S' : '') + ' ALLIÉE' + (dp.n > 1 ? 'S' : '') + '</b>MÉDAILLE ' + E(met) + (lbl ? '<br><span class="fan-lbl">' + lbl + '</span>' : '') + '</div></div></div>'
            + '<div class="fad-pied"><div class="fad-sg"><span class="hx"><span class="hi">' + avatar(dp.amiral, 50) + '</span></span><div><b>CMDR ' + E(String(dp.amiral || '—').toUpperCase()) + '</b><i>AMIRAL · ' + E(dp.hote) + '</i></div></div>'
            + '<div class="fad-au"><div><b>● VALIDÉ</b>SIGNÉ NUMÉRIQUEMENT</div>' + codeBarres(dp.id) + '</div></div></div></div>';
    }
    // cadre fin : meme coupe de coins que le diplome (parallele, a 14 px du bord), accents aux quatre coins ; trace sur les dimensions REELLES
    function tracerCadre(f) {
        var el = f.querySelector('.fad-in'), sv = f.querySelector('.fad-fr'); if (!el || !sv) return;
        var W = el.offsetWidth, H = el.offsetHeight, i = 14, c = 35.8, a = 24;
        sv.setAttribute('width', W); sv.setAttribute('height', H); sv.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        sv.innerHTML = '<path d="M' + i + ',' + i + ' L' + (W - c) + ',' + i + ' L' + (W - i) + ',' + c + ' L' + (W - i) + ',' + (H - i) + ' L' + c + ',' + (H - i) + ' L' + i + ',' + (H - c) + ' Z" fill="none" stroke="rgba(255,210,74,.30)" stroke-width="1"/>'
            + '<path d="M' + i + ',' + (i + a) + ' L' + i + ',' + i + ' L' + (i + a) + ',' + i + ' M' + (W - c - 10) + ',' + i + ' L' + (W - c) + ',' + i + ' L' + (W - i) + ',' + c + ' L' + (W - i) + ',' + (c + 10)
            + ' M' + (W - i - a) + ',' + (H - i) + ' L' + (W - i) + ',' + (H - i) + ' L' + (W - i) + ',' + (H - i - a) + ' M' + (c + 10) + ',' + (H - i) + ' L' + c + ',' + (H - i) + ' L' + i + ',' + (H - c) + ' L' + i + ',' + (H - c - 10) + '" fill="none" stroke="#FFD24A" stroke-width="2" stroke-linecap="square" opacity=".95"/>';
    }
    // le diplome est dessine en 880 px puis ADAPTE a l'ecran (agrandi jusqu'a 1,5 fois, reduit sur tablette et telephone) ; extra = hauteur reservee autour (titre, boutons)
    function ajuster(f, extra) {
        var el = f.querySelector('.fad'); if (!el) return;
        var etroit = innerWidth < 760; el.classList.toggle('etroit', etroit);
        el.style.zoom = 1; tracerCadre(f);
        var h = el.offsetHeight + 4 + (extra || 0), z = Math.max(0.4, Math.min((innerWidth - 24) / (etroit ? 444 : 884), (innerHeight - 24) / h, 1.5));
        el.style.zoom = z;
    }
    async function ouvrirDiplome(id, opts) {
        opts = opts || {};
        var d = await charger(false); if (!d) return;
        var dp = (d.diplomes || []).filter(function (x) { return String(x.id) === String(id); })[0]; if (!dp) return;
        await assurerMedaille(); css();
        var old = document.getElementById('fad-fond'); if (old) old.remove();
        var f = document.createElement('div'); f.id = 'fad-fond'; f.className = 'faw-fond fad-fond';
        f.innerHTML = diplomeHtml(dp);
        document.body.appendChild(f);
        var adapter = function () { ajuster(f, 0); };
        adapter(); window.addEventListener('resize', adapter);
        var fermerFiche = function () { window.removeEventListener('resize', adapter); f.remove(); if (typeof opts.apres === 'function') opts.apres(); };
        f.addEventListener('click', function (e) {
            var m = e.target.closest('[data-fa-dip-med]');
            if (m) { e.stopPropagation(); window.EdteamMedaille.loupe(dp.n, { titre: 'MA MÉDAILLE À CE MOMENT-LÀ', sous: dp.n + ' campagne' + (dp.n > 1 ? 's' : '') + ' alliée' + (dp.n > 1 ? 's' : '') + ' aidée' + (dp.n > 1 ? 's' : ''), camps: campagnesJusqua(d, dp.n) }); return; }
            if (e.target === f || e.target.closest('[data-fa-ferme]')) fermerFiche();
        });
        if (!dp.vu) { var db = client(); if (db) db.rpc('freres_armes_vu', { p_id: dp.id }).then(function () { dp.vu = true; ecrireCache(d); }, function () { /* sera remarque a la prochaine ouverture */ }); }
        return f;
    }

    // ---------- ANNONCE au QG : « Vous avez recu un diplome » (une seule fois par diplome ; plusieurs : ils defilent) ----------
    async function annonce() {
        var d = await charger(false); if (!d) return;
        var liste = (d.diplomes || []).filter(function (x) { return !x.vu; });
        if (!liste.length) return;
        await assurerMedaille(); css();
        var i = 0, total = liste.length;
        var montrer = function () {
            var dp = liste[i], db = client();
            var f = document.createElement('div'); f.id = 'fan-fond'; f.className = 'faw-fond fad-fond fan-fond';
            f.innerHTML = '<div class="fan"><div class="fan-k">★ DISTINCTION ★</div><div class="fan-t">VOUS AVEZ REÇU UN DIPLÔME' + (total > 1 ? ' <small>' + (i + 1) + ' / ' + total + '</small>' : '') + '</div>'
                + diplomeHtml(dp) + '<div class="fan-bt"><button type="button" data-fan-plus>' + (i + 1 < total ? 'SUIVANT' : 'PLUS TARD') + '</button><button type="button" class="ok" data-fan-voir>VOIR MES FRÈRES D’ARMES</button></div></div>';
            document.body.appendChild(f);
            var adapter = function () { ajuster(f, 120); };
            adapter(); window.addEventListener('resize', adapter);
            var fin = function (voir) { window.removeEventListener('resize', adapter); f.remove(); if (voir) { ouvrir(); return; } i++; if (i < total) setTimeout(montrer, 350); };
            f.addEventListener('click', function (e) {
                var m = e.target.closest('[data-fa-dip-med]');
                if (m) { e.stopPropagation(); window.EdteamMedaille.loupe(dp.n, { titre: 'MA MÉDAILLE À CE MOMENT-LÀ', camps: campagnesJusqua(d, dp.n) }); return; }
                if (e.target.closest('[data-fan-voir]')) return fin(true);
                if (e.target.closest('[data-fan-plus]') || e.target.closest('[data-fa-ferme]')) return fin(false);
            });
            // vue : l'annonce ne reviendra pas (meme sur un autre appareil)
            if (db) db.rpc('freres_armes_vu', { p_id: dp.id }).then(function () { dp.vu = true; ecrireCache(d); }, function () { /* reviendra a la prochaine connexion */ });
        };
        montrer();
    }

    // ---------- l'Amiral hote : « Remercier vos allies ? » (propose juste apres la cloture, ou plus tard depuis l'onglet Freres d'armes de la page Escadron) ----------
    async function remercier(idCampagne) {
        var db = client(); if (!db) return;
        var r = await db.rpc('freres_armes_campagne', { p_campagne: Number(idCampagne) });
        var info = r && r.data;
        if (!info || !(Number(info.n) > 0)) return;                 // aucun allie n'a aide cette campagne : aucune fenetre en plus
        css();
        var old = document.getElementById('far-fond'); if (old) old.remove();
        var pil = info.pilotes || [], noms = pil.slice(0, 14).map(function (p) { return '<span>CMDR ' + E(String(p.nom || '?').toUpperCase()) + (p.escadron ? ' · ' + E(p.escadron) : ' · SOLITAIRE') + '</span>'; }).join('') + (pil.length > 14 ? '<span>+ ' + (pil.length - 14) + '</span>' : '');
        var f = document.createElement('div'); f.id = 'far-fond'; f.className = 'faw-fond far-fond';
        f.innerHTML = '<div class="far"><h3>✦ ' + (info.message ? 'MESSAGE À VOS ALLIÉS' : 'REMERCIER VOS ALLIÉS ?') + '</h3><div class="sb">' + pil.length + ' pilote' + (pil.length > 1 ? 's' : '') + ' allié' + (pil.length > 1 ? 's' : '') + ' ' + (pil.length > 1 ? 'ont' : 'a') + ' soutenu « ' + E(info.campagne) + ' ». Un diplôme leur est remis automatiquement. Vous pouvez y ajouter un mot (facultatif).</div>'
            + '<div class="ch">' + noms + '</div><textarea maxlength="240" placeholder="Un mot pour vos alliés…"></textarea><div class="cpt"><span id="far-n">0</span> / 240</div><div class="msg" id="far-msg"></div>'
            + '<div class="bt"><button type="button" data-far-non>PLUS TARD</button><button type="button" class="ok" data-far-oui>ENVOYER</button></div></div>';
        document.body.appendChild(f);
        var ta = f.querySelector('textarea'), cpt = f.querySelector('#far-n'), msg = f.querySelector('#far-msg');
        ta.value = info.message || ''; cpt.textContent = ta.value.length; ta.focus();
        ta.addEventListener('input', function () { cpt.textContent = ta.value.length; msg.textContent = ''; });
        f.addEventListener('click', async function (e) {
            if (e.target === f || e.target.closest('[data-far-non]')) { f.remove(); return; }
            var oui = e.target.closest('[data-far-oui]'); if (!oui) return;
            oui.disabled = true;
            var rr = await db.rpc('freres_armes_message', { p_campagne: Number(idCampagne), p_message: ta.value });
            var code = rr && rr.data;
            if (code === 'OK') { oui.textContent = '✓ ENVOYÉ'; invalider(); setTimeout(function () { f.remove(); }, 900); return; }
            oui.disabled = false;
            msg.textContent = code === 'TROP_LONG' ? 'Le message dépasse 240 caractères.' : 'Le message n’a pas pu être enregistré pour le moment.';
        });
    }

    // ---------- onglet « FRERES D'ARMES » de la page Escadron : les allies qui ont aide NOTRE escadron (tous ses membres) ; l'Amiral y ecrit aussi ses messages de remerciement ----------
    function repN(m, e) { return m !== 'bronze' ? { argent: 30, or: 50, diamant: 100 }[m] : [0, 1, 3, 5, 10, 20][Math.max(0, Math.min(5, e || 0))]; }
    function photoUrl(uid, nom) { try { return window.EDTEAMPhotos && window.EDTEAMPhotos.url ? (window.EDTEAMPhotos.url(uid, nom) || '') : ''; } catch (e) { return ''; } }
    // opts.pc = vrai sur la page Escadron du PC (memes classes .bloc / .eff-carte que l'onglet MEMBRES) ; sinon (mobile) : liste compacte
    async function monterEscadron(el, opts) {
        opts = opts || {};
        if (!el) return; var db = client(); if (!db) return;
        el.innerHTML = '<div class="fae-vide">&gt; CHARGEMENT…</div>';
        await assurerMedaille(); css();
        var r = await db.rpc('freres_armes_escadron'), l = (r && Array.isArray(r.data)) ? r.data : null;
        if (!l) { el.innerHTML = '<div class="fae-vide">Impossible de lire les frères d’armes pour le moment.</div>'; return; }
        var escs = {}, sol = 0; l.forEach(function (x) { if (x.escadron) escs[x.escadron] = 1; else sol++; });
        var M = window.EdteamMedaille, nE = Object.keys(escs).length;
        if (opts.pc) { monterEscadronPc(el, l, lc0 => lc0); return; }
        var h = '<div class="fae-h"><b>NOS FRÈRES D’ARMES</b>' + (l.length ? '<span><em>' + l.length + '</em> pilote' + (l.length > 1 ? 's' : '') + ' · <em>' + nE + '</em> escadron' + (nE > 1 ? 's' : '') + (sol ? ' · <em>' + sol + '</em> solitaire' + (sol > 1 ? 's' : '') : '') + '</span>' : '') + '</div>';
        h += l.length ? '<div class="fae-g">' + l.map(function (x) {
            var n = x.total || repN(x.m, x.e);
            return '<div class="fae-c"><span class="av' + (x.escadron ? '' : ' sol') + '">' + avatar(x.nom, 46) + '</span><div class="tx"><b>CMDR ' + E(String(x.nom || '?').toUpperCase()) + '</b><span>' + E(x.escadron || 'solitaire') + ' · dernière aide le ' + E(dateFr(x.dernier)) + '</span></div>'
                + '<span class="md" data-fa-loupe="' + n + '" data-fa-titre="MÉDAILLE DE CMDR ' + E(String(x.nom || '?').toUpperCase()) + '" data-fa-sous="Le détail des campagnes n’est pas public">' + M.svg(n, 40, true) + '</span>'
                + '<div class="nb">' + x.n + '<small>campagne' + (x.n > 1 ? 's' : '') + '<br>pour nous</small></div></div>'; }).join('') + '</div>'
            : '<div class="fae-vide">Aucun allié ne vous a encore aidés. Quand un pilote d’un autre escadron (ou sans escadron) agit sur une de vos campagnes partagées, il apparaîtra ici à la clôture de la campagne.</div>';
        el.innerHTML = h;
        // l'Amiral : ses campagnes recentes remerciees, pour ecrire ou corriger le message (la liste est vide pour tout autre pilote)
        var rc = await db.rpc('freres_armes_campagnes'), lc = (rc && Array.isArray(rc.data)) ? rc.data : [];
        if (lc.length) {
            var m = document.createElement('div'); m.className = 'fae-m';
            m.innerHTML = '<h4>REMERCIEMENTS DE NOS CAMPAGNES · AMIRAL</h4>' + lc.map(function (c) { return '<div class="fae-r"><div class="tx"><b>« ' + E(c.nom) + ' »</b><span>' + c.n + ' allié' + (c.n > 1 ? 's' : '') + ' remercié' + (c.n > 1 ? 's' : '') + ' · ' + E(dateFr(c.le)) + '</span>' + (c.message ? '<span class="mo">« ' + E(c.message) + ' »</span>' : '') + '</div><button type="button" data-fae-msg="' + c.campagne_id + '">' + (c.message ? 'MODIFIER LE MESSAGE' : 'ÉCRIRE UN MESSAGE') + '</button></div>'; }).join('');
            el.appendChild(m);
            m.addEventListener('click', function (e) { var b = e.target.closest('[data-fae-msg]'); if (b) remercier(b.getAttribute('data-fae-msg')).then(function () { setTimeout(function () { monterEscadron(el); }, 1100); }); });
        }
    }

    // vue PC de l'onglet : un bloc bleu standard, des cartes a grande photo ; la rubrique « remerciements » (Amiral) dans un bloc dore
    async function monterEscadronPc(el, l) {
        var db = client(), M = window.EdteamMedaille;
        var escs = {}, sol = 0; l.forEach(function (x) { if (x.escadron) escs[x.escadron] = 1; else sol++; });
        var nE = Object.keys(escs).length;
        var cartes = l.map(function (x) {
            var n = x.total || repN(x.m, x.e), nom = String(x.nom || '?'), url = photoUrl(x.user_id, nom);
            var img = url ? '<img src="' + E(url) + '" alt="" loading="lazy" onerror="this.remove()">' : '';
            return '<div class="bloc eff-carte ' + (x.escadron ? 'cy' : '') + ' fae-carte"><div class="eff-img">' + (url ? '' : '<span class="eff-ini">' + E(ini(nom)) + '</span>') + img
                + '<span class="eff-tag">' + (x.escadron ? 'ALLIÉ' : 'SOLITAIRE') + '</span>'
                + '<span class="fae-md" data-fa-loupe="' + n + '" data-fa-titre="MÉDAILLE DE CMDR ' + E(nom.toUpperCase()) + '" data-fa-sous="Le détail des campagnes n’est pas public" title="Cliquer pour agrandir la médaille">' + M.svg(n, 54, true) + '</span></div>'
                + '<div class="eff-inf"><div class="eff-nom" title="CMDR ' + E(nom.toUpperCase()) + '">CMDR ' + E(nom.toUpperCase()) + '</div><div class="eff-e">' + E(x.escadron || 'Pilote sans escadron') + '</div>'
                + '<div class="fae-lg"><div><small>Aide pour nous</small><b>' + x.n + '</b> campagne' + (x.n > 1 ? 's' : '') + '</div><div><small>Dernière aide</small><b>' + E(dateFr(x.dernier)) + '</b></div></div></div></div>'; }).join('');
        var h = '<div class="bloc cy"><h2>NOS FRÈRES D’ARMES <em>' + (l.length ? l.length + ' pilote' + (l.length > 1 ? 's' : '') + ' · ' + nE + ' escadron' + (nE > 1 ? 's' : '') + (sol ? ' · ' + sol + ' solitaire' + (sol > 1 ? 's' : '') : '') : 'aucun pour le moment') + '</em></h2>'
            + (l.length ? '<div class="eff-grille fae-pc">' + cartes + '</div>' : '<div class="fae-vide">Aucun allié ne vous a encore aidés. Quand un pilote d’un autre escadron (ou sans escadron) agit sur une de vos campagnes partagées, il apparaît ici à la clôture de la campagne.</div>')
            + '<div class="bloc-note">Les pilotes d’autres escadrons, ou sans escadron, qui ont aidé vos campagnes. Visible de tous les membres de l’escadron. Cliquez sur une médaille pour l’agrandir.</div></div>';
        el.innerHTML = h;
        // l'Amiral : ses campagnes recentes remerciees, pour ecrire ou corriger le message (la liste est vide pour tout autre pilote)
        var rc = await db.rpc('freres_armes_campagnes'), lc = (rc && Array.isArray(rc.data)) ? rc.data : [];
        if (lc.length) {
            var m = document.createElement('div'); m.className = 'bloc or'; m.style.marginTop = '16px';
            m.innerHTML = '<h2>REMERCIEMENTS DE NOS CAMPAGNES <em>réservé à l’Amiral</em></h2>' + lc.map(function (c) { return '<div class="fae-r"><div class="tx"><b>« ' + E(c.nom) + ' »</b><span>' + c.n + ' allié' + (c.n > 1 ? 's' : '') + ' remercié' + (c.n > 1 ? 's' : '') + ' · ' + E(dateFr(c.le)) + '</span>' + (c.message ? '<span class="mo">« ' + E(c.message) + ' »</span>' : '') + '</div><button type="button" data-fae-msg="' + c.campagne_id + '">' + (c.message ? 'MODIFIER LE MESSAGE' : 'ÉCRIRE UN MESSAGE') + '</button></div>'; }).join('')
                + '<div class="bloc-note">Un diplôme est remis automatiquement à chaque allié à la clôture d’une campagne. Vous pouvez y ajouter un mot (240 caractères), qui s’affiche sur le diplôme.</div>';
            el.appendChild(m);
            m.addEventListener('click', function (e) { var b = e.target.closest('[data-fae-msg]'); if (b) remercier(b.getAttribute('data-fae-msg')).then(function () { setTimeout(function () { monterEscadron(el, { pc: true }); }, 1100); }); });
        }
    }

    // ---------- la fenetre « Freres d'armes » ----------
    function etoileSvg(on, couleur) { return '<svg viewBox="-12 -12 24 24" class="' + (on ? '' : 'off') + '"><path d="M0 -10l3 6.4 7 .9-5.1 4.8 1.4 6.9L0 5.6l-6.3 3.4 1.4-6.9-5.1-4.8 7-.9z" fill="' + couleur + '"' + (on ? ' style="filter:drop-shadow(0 0 4px ' + couleur + ')"' : '') + '/></svg>'; }
    function tailleMedaille() { return Math.max(150, Math.min(220, Math.round(innerHeight * 0.26), innerWidth - 90)); }
    function rangHtml(d) {
        var n = d.n || 0, M = window.EdteamMedaille, met = M.metal(n), col = COUL[met], e = M.etoiles(n);
        var prochain = SEUILS.filter(function (s) { return s > n; })[0], prec = SEUILS.filter(function (s) { return s <= n; }).pop() || 0;
        var pct = prochain ? Math.round(100 * (n - prec) / (prochain - prec)) : 100;
        var pal = SEUILS.map(function (s) { return '<span class="' + (n >= s ? 'ok' : '') + '">' + s + '</span>'; }).join('');
        return '<div class="faw-rang"><div class="mm" data-fa-loupe="' + n + '" data-fa-moi="1" title="Cliquer pour agrandir la médaille">' + M.html3D(n, tailleMedaille()) + '</div><div style="flex:1;min-width:0"><div class="faw-et">'
            + [0, 1, 2, 3, 4].map(function (i) { return etoileSvg(i < e, col); }).join('') + '</div>'
            + '<div class="faw-t">' + n + ' CAMPAGNE' + (n > 1 ? 'S' : '') + ' ALLIÉE' + (n > 1 ? 'S' : '') + ' AIDÉE' + (n > 1 ? 'S' : '') + '</div>'
            + '<div class="faw-s">Métal : <b style="color:' + col + '">' + M.METAUX[met].nom + '</b>. Chaque campagne d’un autre escadron où vous avez agi compte une fois, quel que soit l’effort.</div>'
            + '<div class="faw-prog"><i style="width:' + pct + '%"></i></div><div class="faw-pal">' + pal + '</div>'
            + '<div class="faw-s" style="font-size:11.5px;color:#6b7a85">' + (prochain ? 'Prochain palier : ' + NOM_PALIER[prochain] + ', encore ' + (prochain - n) + ' campagne' + (prochain - n > 1 ? 's' : '') : 'Médaille complète : le compteur continue.') + '</div></div></div>';
    }
    function listeHtml(d) {
        var l = d.diplomes || [], M = window.EdteamMedaille;
        return '<div class="faw-dl"><h4>DIPLÔMES DE REMERCIEMENT · ' + (d.n || 0) + '</h4>'
            + (l.length ? '<div class="faw-grille">' + l.map(function (x) {
                return '<div class="faw-d' + (x.vu ? '' : ' nv') + '" data-fa-dip="' + x.id + '"><span class="md">' + M.svg(x.n, 46, true) + '</span><div class="tx"><b>CAMPAGNE « ' + E(x.campagne) + ' »' + (x.message ? '<span class="env" title="Message de l’Amiral">✉</span>' : '') + '</b><span>de ' + E(x.hote) + (x.amiral ? ' · CMDR ' + E(String(x.amiral).toUpperCase()) : '') + '</span>'
                    + (x.message ? '<span class="mo">« ' + E(x.message) + ' »</span>' : '') + '</div><em>' + (x.vu ? '' : 'NOUVEAU<br>') + E(dateFr(x.le)) + '</em></div>'; }).join('') + '</div>'
                : '<div class="faw-vide">Aucun diplôme pour le moment. À la clôture d’une campagne d’un autre escadron où vous avez agi, l’Amiral de cet escadron vous remet un diplôme.</div>')
            + '</div>';
    }
    async function ouvrir() {
        var d = await charger(true); await assurerMedaille(); css();
        var old = document.getElementById('faw-fond'); if (old) old.remove();
        var f = document.createElement('div'); f.id = 'faw-fond'; f.className = 'faw-fond';
        f.innerHTML = '<div class="faw"><div class="faw-hh"><span class="faw-x" data-fa-ferme>X</span><small>CARRIÈRE DE PILOTE</small><b>FRÈRES D’ARMES</b></div><div class="faw-corps">'
            + (d ? rangHtml(d) + listeHtml(d) : '<div class="faw-dl"><div class="faw-vide">Impossible de lire vos diplômes pour le moment. Réessayez dans quelques instants.</div></div>') + '</div></div>';
        document.body.appendChild(f);
        f.addEventListener('click', function (e) {
            if (e.target === f || e.target.closest('[data-fa-ferme]')) { f.remove(); return; }
            var x = e.target.closest('[data-fa-dip]'); if (x) { ouvrirDiplome(x.getAttribute('data-fa-dip')).then(function () { var ligne = f.querySelector('[data-fa-dip="' + x.getAttribute('data-fa-dip') + '"]'); if (ligne) { ligne.classList.remove('nv'); var em = ligne.querySelector('em'); if (em) em.innerHTML = em.innerHTML.replace('NOUVEAU<br>', ''); } }); }
        });
        // la medaille du rang : « MA MEDAILLE » avec le detail de chaque campagne
        if (d) window.EdteamMedaille.fournisseur = function () { return { n: d.n, titre: 'MA MÉDAILLE', camps: campagnesJusqua(d, d.n) }; };
    }

    window.edteamFreresArmes = { exemple: exemple, ouvrir: ouvrir, annonce: annonce, remercier: remercier, monterEscadron: monterEscadron, donnees: function () { return charger(false); }, charger: charger, invalider: invalider, diplome: ouvrirDiplome, couleur: function (metal) { return COUL[metal] || '#3ec9ff'; } };
})();
