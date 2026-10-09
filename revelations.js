// REVELATIONS : les fenetres plein ecran (et la petite carte d'anecdote) qui saluent un evenement, MONTREES UNE SEULE FOIS par pilote et par appareil.
// Partage par toutes les pages connectees (charge par navigation.js sur PC, appele par mobile.html).
//   Personnelles (le pilote concerne seul) : plaque de campagne (directive cloturee), nouveau rang BGS, Powerplay, Federation, Empire, rangs du cercle des pilotes (combat, commerce, exploration, exobiologie, mercenaire).
//   Pour tous les pilotes de l'escadron     : distinction de specialiste, Pilier de la semaine, Elan Powerplay (plein ecran) ; nouvelle anecdote (petite carte discrete).
// Memoire : localStorage, par pilote (edteam_revel_vu_<id>). Un rang ne se celebre que s'il depasse le plus haut deja vu ; le premier passage sur un appareil ne rejoue pas l'historique.
// Egress : les rangs viennent du profil deja lu par la page (aucune requete). Pilier, Elan, titres et anecdote reutilisent les memes caches de session que le QG et le mur des titres
// (cles edteam_qg_dist_, edteam_titres_, edteam_anecdote_v1) ; une verification reseau de fond au plus toutes les heures.
(function () {
    'use strict';
    var PREFIXE = 'edteam_revel_vu_';
    var JOURS_TITRES = 7, JOURS_ANECDOTE = 2;
    var PAUSE_FOND = 3600000;
    var BLOQUANTS = ['edteam-annonce', 'an-voile', 'gz-popup'];

    // Rangs personnels. `table` = nom dans window.EDTEAM_RANGS (ou opts.rangs sur mobile).
    var CERCLE = '#DDE6F0';
    var DEFS = [
        { k: 'bgs', champ: 'rang_bgs', couleur: '#FF7100', eti: 'NOUVEAU RANG BGS', ico: '&#9650;', escadron: true },
        { k: 'pp', champ: 'puissance_rang', couleur: '#00F0FF', eti: 'NOUVEAU RANG POWERPLAY', ico: '&#9670;' },
        { k: 'fed', champ: 'rang_fed', table: 'fed', couleur: '#FF7100', eti: 'NOUVEAU RANG FÉDÉRATION', ico: '&#9733;', sous: 'MARINE FÉDÉRALE', phrase: 'La Fédération vous promeut au rang de' },
        { k: 'emp', champ: 'rang_emp', table: 'emp', couleur: '#4D8DFF', eti: 'NOUVEAU RANG EMPIRE', ico: '&#9733;', sous: 'NOBLESSE IMPÉRIALE', phrase: 'L’Empire vous élève au rang de' },
        { k: 'combat', champ: 'rang_combat', table: 'combat', couleur: CERCLE, eti: 'NOUVEAU RANG · COMBAT', ico: '&#9678;', lib: 'de combat' },
        { k: 'commerce', champ: 'rang_commerce', table: 'trade', couleur: CERCLE, eti: 'NOUVEAU RANG · COMMERCE', ico: '&#9678;', lib: 'de commerce' },
        { k: 'explo', champ: 'rang_explo', table: 'explore', couleur: CERCLE, eti: 'NOUVEAU RANG · EXPLORATION', ico: '&#9678;', lib: 'd’exploration' },
        { k: 'exobio', champ: 'rang_exobio', table: 'exobio', couleur: CERCLE, eti: 'NOUVEAU RANG · EXOBIOLOGIE', ico: '&#9678;', lib: 'd’exobiologie' },
        { k: 'merc', champ: 'rang_mercenary', table: 'mercenary', couleur: CERCLE, eti: 'NOUVEAU RANG · MERCENAIRE', ico: '&#9678;', lib: 'de mercenaire' }
    ];
    var PRIO = { rang: 1, plaque: 2, dist: 3, pilier: 4, elan: 5 };

    var etat = { profil: null, opts: {}, file: [], ids: {}, enCours: false, minuteur: null, derniereGlobale: 0, anecdote: null, carte: null };

    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function db() { return etat.opts.db || window.supabaseApp || null; }
    function lire(uid) { try { var v = JSON.parse(localStorage.getItem(PREFIXE + uid) || 'null'); return v && typeof v === 'object' ? v : null; } catch (e) { return null; } }
    function ecrire(uid, m) { try { localStorage.setItem(PREFIXE + uid, JSON.stringify(m)); } catch (e) { /* stockage indisponible : la fenetre pourra se rejouer, sans consequence */ } }
    function muter(uid, fn) { var m = lire(uid) || { r: {} }; if (!m.r) m.r = {}; fn(m); ecrire(uid, m); }
    function aEscadron(p) { var e = String(p && p.escadron_id || '').trim().toUpperCase(); return !!e && e !== 'INDEPENDANT'; }
    function cacheLire(cle, ttl) { try { var c = JSON.parse(sessionStorage.getItem(cle) || 'null'); if (c && Date.now() - c.ts < ttl) return c; } catch (e) { /* rien */ } return null; }
    function cacheEcrire(cle, obj) { try { obj.ts = Date.now(); sessionStorage.setItem(cle, JSON.stringify(obj)); } catch (e) { /* rien */ } }
    function portrait(uid, nom) {
        var P = window.EDTEAMPhotos;
        try { return { u: P ? P.url(uid, nom) : '', ini: P ? P.initiales(nom) : String(nom || '?').charAt(0).toUpperCase() }; } catch (e) { return { u: '', ini: '?' }; }
    }
    function chargerScript(src) {
        return new Promise(function (ok) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = ok; document.head.appendChild(s); });
    }

    // ---------------------------------------------------------------------------------------------------------------
    // DETECTION
    // ---------------------------------------------------------------------------------------------------------------
    function nomRang(d, n) {
        var T = (etat.opts.rangs || window.EDTEAM_RANGS || {})[d.table];
        return T && T[n] ? String(T[n]).toUpperCase() : 'RANG ' + n;
    }
    function detecterRangs(p, items) {
        var uid = p.user_id, m = lire(uid) || { r: {} }, change = false;
        if (!m.r) m.r = {};
        DEFS.forEach(function (d) {
            if (d.escadron && !aEscadron(p)) return;
            var brut = p[d.champ]; if (brut === null || brut === undefined) return;
            var n = Number(brut); if (isNaN(n)) return;
            var vu = m.r[d.k];
            if (vu === undefined) { m.r[d.k] = n; change = true; return; }   // premier passage : point de depart, on ne rejoue rien
            if (n > vu) items.push({ type: 'rang', id: 'r:' + d.k + ':' + n, d: d, ancien: vu, nouveau: n, p: p });
        });
        if (change) ecrire(uid, m);
    }

    async function lireDistinctions(p) {
        var cle = 'edteam_qg_dist_' + p.user_id, c = cacheLire(cle, 900000);
        if (c) return c.d;
        var d;
        try {
            var r = await Promise.all([
                db().from('distinctions_hebdo').select('user_id, cmdr_nom, attribut, part_pct, semaine').eq('escadron_id', p.escadron_id).order('semaine', { ascending: false }).limit(1),
                db().from('distinctions_pp').select('user_id, cmdr_nom, progres_pct, puissance, semaine').eq('escadron_id', p.escadron_id).order('semaine', { ascending: false }).limit(1)
            ]);
            d = { pilier: (r[0].data && r[0].data[0]) || null, elan: r[1].error ? undefined : ((r[1].data && r[1].data[0]) || null) };
            cacheEcrire(cle, { d: d });
        } catch (e) { d = { pilier: null, elan: undefined }; }
        return d;
    }
    async function lireTitres(p) {
        var cle = 'edteam_titres_' + (p.escadron_id || 'x'), c = cacheLire(cle, 900000);
        if (c) return c.data;
        try {
            var r = await db().from('titres_specialistes').select('code, user_id, cmdr_nom, valeur, second_nom, second_valeur, depuis');
            if (r.error) throw r.error;
            var data = {}; (r.data || []).forEach(function (x) { data[x.code] = x; });
            cacheEcrire(cle, { data: data });
            return data;
        } catch (e) { return null; }
    }
    // plaques de campagne = profils.palmares_bgs (SES plaques seulement) ; une plaque est identifiee par l'identifiant de son ordre, a defaut systeme + date de cloture + type
    function clePlaque(m) { return m && m.ordre_id !== undefined && m.ordre_id !== null ? 'o' + m.ordre_id : [m && m.systeme, m && m.date_cloture, m && m.type_ordre].join('|'); }
    async function lirePalmares(p) {
        var cle = 'edteam_revel_palm_' + p.user_id, c = cacheLire(cle, 1800000);
        if (c) return c.d;
        try {
            var r = await db().from('profils').select('palmares_bgs').eq('user_id', p.user_id).single();
            if (r.error) throw r.error;
            var d = Array.isArray(r.data && r.data.palmares_bgs) ? r.data.palmares_bgs : [];
            cacheEcrire(cle, { d: d });
            return d;
        } catch (e) { return null; }
    }
    function detecterPlaques(p, palmares, m, items) {
        var vus = m.pq, liste = Array.isArray(palmares) ? palmares : [];
        if (!Array.isArray(vus)) {
            // premier passage sur cet appareil : on reprend la memoire de l'ancien systeme (plaques-vues.js) s'il y en a une ; sinon seules les plaques cloturees depuis 14 jours sont proposees
            var ancien = null;
            try { var v = JSON.parse(localStorage.getItem('edteam_plaques_vues_' + p.user_id) || 'null'); if (Array.isArray(v)) ancien = v; } catch (e) { /* rien */ }
            vus = ancien || [];
            if (!ancien) { var limite = Date.now() - 14 * 86400000; liste.forEach(function (q) { var t = Date.parse(q.date_cloture); if (isNaN(t) || t < limite) vus.push(clePlaque(q)); }); }
            muter(p.user_id, function (mm) { if (!Array.isArray(mm.pq)) mm.pq = vus.slice(-300); });
        }
        liste.filter(function (q) { return vus.indexOf(clePlaque(q)) < 0; })
            .sort(function (a, b) { return String(a.date_cloture || '').localeCompare(String(b.date_cloture || '')) || (Number(a.rang) || 99) - (Number(b.rang) || 99); })
            .forEach(function (q) { items.push({ type: 'plaque', id: 'q:' + clePlaque(q), cle: clePlaque(q), x: q, p: p }); });
    }
    async function lireAnecdote() {
        var c = cacheLire('edteam_anecdote_v1', 1800000);
        if (c) return c.d;
        try {
            var r = await db().rpc('anecdote_du_jour');
            if (r.error) throw r.error;
            cacheEcrire('edteam_anecdote_v1', { d: r.data || null });
            return r.data || null;
        } catch (e) { return null; }
    }

    async function globales(p, force) {
        if (!aEscadron(p) || !db()) return;
        if (!force && Date.now() - etat.derniereGlobale < PAUSE_FOND) return;
        etat.derniereGlobale = Date.now();
        try {
            var uid = p.user_id;
            var res = await Promise.all([lireDistinctions(p), lireTitres(p), lireAnecdote(), lirePalmares(p)]);
            var dist = res[0] || {}, titres = res[1], an = res[2], palmares = res[3];
            var m = lire(uid) || { r: {} }, items = [];
            if (palmares) detecterPlaques(p, palmares, m, items);

            if (dist.pilier) {
                var kp = dist.pilier.semaine + '|' + dist.pilier.user_id;
                if (m.pil !== kp) items.push({ type: 'pilier', id: 'p:' + kp, cle: kp, x: dist.pilier, p: p });
            }
            if (dist.elan) {
                var ke = dist.elan.semaine + '|' + dist.elan.user_id;
                if (m.elan !== ke) items.push({ type: 'elan', id: 'e:' + ke, cle: ke, x: dist.elan, p: p });
            }
            if (titres) {
                var detenus = Object.keys(titres).map(function (code) { return titres[code]; }).filter(Boolean);
                var cleT = function (t) { return t.code + '|' + t.depuis; };
                if (!Array.isArray(m.ti)) {
                    // premier passage : seuls les titres pris cette semaine sont celebres
                    var limite = Date.now() - JOURS_TITRES * 86400000, anciens = [];
                    detenus.forEach(function (t) { var dt = Date.parse(t.depuis); if (isNaN(dt) || dt < limite) anciens.push(cleT(t)); else items.push({ type: 'dist', id: 't:' + cleT(t), cle: cleT(t), x: t, p: p }); });
                    muter(uid, function (mm) { if (!Array.isArray(mm.ti)) mm.ti = anciens; });
                } else {
                    detenus.forEach(function (t) { if (m.ti.indexOf(cleT(t)) < 0) items.push({ type: 'dist', id: 't:' + cleT(t), cle: cleT(t), x: t, p: p }); });
                }
            }
            if (an && an.id !== undefined && m.an !== an.id) {
                var recent = Date.now() - Date.parse(an.created_at) < JOURS_ANECDOTE * 86400000;
                if (m.an === undefined && !recent) muter(uid, function (mm) { mm.an = an.id; });   // premier passage : une vieille anecdote ne se rejoue pas
                else etat.anecdote = { x: an, p: p };
            }
            if (window.EDTEAMPhotos) { try { await window.EDTEAMPhotos.charger(false); } catch (e) { /* les initiales suffisent */ } }
            ajouter(items);
            jouer();
        } catch (e) { etat.derniereGlobale = 0; }
    }

    function ajouter(items) {
        items.forEach(function (it) { if (!etat.ids[it.id]) { etat.ids[it.id] = true; etat.file.push(it); } });
    }

    // ---------------------------------------------------------------------------------------------------------------
    // MEMOIRE : un element est « vu » des qu'il est montre
    // ---------------------------------------------------------------------------------------------------------------
    function marquer(it) {
        var uid = it.p.user_id;
        muter(uid, function (m) {
            if (it.type === 'rang') m.r[it.d.k] = Math.max(m.r[it.d.k] === undefined ? 0 : m.r[it.d.k], it.nouveau);
            else if (it.type === 'plaque') { if (!Array.isArray(m.pq)) m.pq = []; if (m.pq.indexOf(it.cle) < 0) m.pq.push(it.cle); m.pq = m.pq.slice(-300); }
            else if (it.type === 'pilier') m.pil = it.cle;
            else if (it.type === 'elan') m.elan = it.cle;
            else if (it.type === 'dist') { if (!Array.isArray(m.ti)) m.ti = []; if (m.ti.indexOf(it.cle) < 0) m.ti.push(it.cle); m.ti = m.ti.slice(-100); }
            else if (it.type === 'anecdote') m.an = it.x.id;
        });
    }

    // ---------------------------------------------------------------------------------------------------------------
    // STYLE
    // ---------------------------------------------------------------------------------------------------------------
    function css() {
        if (document.getElementById('edteam-revel-css')) return;
        var st = document.createElement('style');
        st.id = 'edteam-revel-css';
        st.textContent = [
            '#edteam-revel{position:fixed;inset:0;z-index:9650;display:flex;align-items:center;justify-content:center;padding:16px;overflow:hidden auto;box-sizing:border-box;background:radial-gradient(circle at 50% 42%,color-mix(in srgb,var(--c) 22%,transparent),rgba(0,0,0,.95) 62%);backdrop-filter:blur(5px);animation:erFond .5s ease-out;font-family:inherit}',
            '#edteam-revel.spec{background:radial-gradient(circle at 50% 46%,color-mix(in srgb,var(--c) 26%,#000) 0,rgba(0,0,0,.97) 60%)}',
            '#edteam-revel .er-b{position:relative;width:min(94vw,560px);max-height:94vh;overflow-y:auto;box-sizing:border-box;text-align:center;padding:30px 28px 22px;background:rgba(8,6,8,.97);border:1px solid var(--c);box-shadow:0 0 50px color-mix(in srgb,var(--c) 35%,transparent);animation:erEntree .6s cubic-bezier(.2,.8,.2,1)}',
            '#edteam-revel .er-eti{display:inline-block;border:1px solid var(--c);color:var(--c);padding:4px 16px;letter-spacing:4px;font-weight:bold;font-size:.78em}',
            '#edteam-revel .er-ico{font-size:3.4em;margin:16px 0 4px;color:var(--c);text-shadow:0 0 24px var(--c);line-height:1}',
            '#edteam-revel .er-med{width:150px;height:150px;margin:14px auto 2px;display:flex;align-items:center;justify-content:center}',
            '#edteam-revel .er-med svg{width:100%;height:100%}',
            '#edteam-revel .er-t{color:#fff;font-size:1.5em;font-weight:bold;letter-spacing:3px;margin:8px 0 4px;text-shadow:0 0 16px var(--c);overflow-wrap:anywhere}',
            '#edteam-revel .er-s{color:var(--c);letter-spacing:2px;font-size:.9em}',
            '#edteam-revel .er-d{margin:14px auto 0;max-width:430px;color:#bbb;font-size:.88em;line-height:1.6}',
            '#edteam-revel .er-d b{color:#fff}',
            '#edteam-revel .er-cpt{margin-top:14px;color:#777;font-size:.72em;letter-spacing:2px}',
            '#edteam-revel .er-act{display:flex;gap:10px;justify-content:center;margin-top:20px;flex-wrap:wrap}',
            '#edteam-revel .er-btn{background:color-mix(in srgb,var(--c) 14%,transparent);border:1px solid var(--c);color:var(--c);padding:11px 26px;font-family:inherit;font-weight:bold;letter-spacing:2px;cursor:pointer;transition:.2s}',
            '#edteam-revel .er-btn:hover{background:var(--c);color:#000}',
            '#edteam-revel .er-btn.g{background:transparent;border-color:#555;color:#999}',
            '#edteam-revel .er-moi{display:inline-block;margin-top:14px;background:var(--c);color:#000;font-weight:bold;letter-spacing:3px;padding:4px 18px;font-size:.85em;animation:erPopM .6s ease-out .4s both}',
            /* plaque de campagne : ruban en plein ecran */
            '#edteam-revel .plq-contenu{position:relative;text-align:center;width:min(94vw,780px);max-height:96vh;overflow-y:auto;display:flex;flex-direction:column;align-items:center;gap:10px;animation:erEntree .6s cubic-bezier(.2,.8,.2,1)}',
            '#edteam-revel .plq-legende{letter-spacing:6px;color:#FFD700;font-size:.95em;text-shadow:0 0 10px rgba(255,215,0,.5)}',
            '#edteam-revel .plq-titre{font-size:2em;color:#fff;letter-spacing:3px;text-shadow:0 0 18px var(--c);overflow-wrap:anywhere}',
            '#edteam-revel .plq-faction{color:#9aa;letter-spacing:1px}',
            '#edteam-revel .plq-ruban{position:relative;width:min(88vw,660px);margin:16px 0;pointer-events:none;overflow:hidden;filter:drop-shadow(0 0 26px var(--c))}',
            '#edteam-revel .plq-ruban svg{width:100%!important;height:auto!important}',
            '#edteam-revel .plq-reflet{position:absolute;inset:0;background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.5) 50%,transparent 65%);transform:translateX(-120%);animation:erPlqReflet 2.6s ease-in-out .7s infinite;pointer-events:none}',
            '#edteam-revel .plq-distinction{font-size:1.7em;color:var(--c);letter-spacing:3px;font-weight:bold;text-shadow:0 0 16px var(--c)}',
            '#edteam-revel .plq-place{color:#fff;letter-spacing:2px}',
            '#edteam-revel .plq-stats{color:#aaa;font-size:.9em}#edteam-revel .plq-stats b{color:#fff}',
            '#edteam-revel .plq-fiche{color:var(--ed-blue,#00F0FF);font-size:.8em;text-decoration:none;margin-top:6px;letter-spacing:1px}',
            '@keyframes erPlqReflet{0%{transform:translateX(-120%)}60%,100%{transform:translateX(120%)}}',
            '@media (max-width:640px){#edteam-revel .plq-titre{font-size:1.2em;letter-spacing:2px}#edteam-revel .plq-legende{letter-spacing:3px;font-size:.8em}#edteam-revel .plq-distinction{font-size:1.2em;letter-spacing:2px}}',
            /* spectaculaire : Pilier et Elan */
            '#edteam-revel .sp-rayons{position:absolute;left:50%;top:46%;width:190vmax;height:190vmax;margin:-95vmax 0 0 -95vmax;pointer-events:none;opacity:.5;background:repeating-conic-gradient(from 0deg,color-mix(in srgb,var(--c) 28%,transparent) 0 4deg,transparent 4deg 15deg);-webkit-mask:radial-gradient(circle,#000 0,transparent 38%);mask:radial-gradient(circle,#000 0,transparent 38%);animation:erTourne 70s linear infinite}',
            '#edteam-revel .sp-part{position:absolute;bottom:-12px;width:4px;height:4px;border-radius:50%;background:var(--c);box-shadow:0 0 10px var(--c);opacity:0;animation:erMonte linear infinite}',
            '#edteam-revel .sp-b{position:relative;overflow:hidden;z-index:2;width:min(94vw,600px);max-height:96vh;overflow-y:auto;text-align:center;padding:26px 26px 22px;box-sizing:border-box;background:rgba(6,5,3,.78);border:1px solid var(--c);box-shadow:0 0 70px color-mix(in srgb,var(--c) 40%,transparent),inset 0 0 50px color-mix(in srgb,var(--c) 7%,transparent);animation:erEntree .9s cubic-bezier(.2,.8,.2,1)}',
            '#edteam-revel .sp-b:after{content:"";position:absolute;top:0;bottom:0;left:-45%;width:30%;pointer-events:none;background:linear-gradient(105deg,transparent 20%,rgba(255,255,255,.12) 50%,transparent 80%);animation:erReflet 4.5s ease-in-out 1.2s infinite}',
            '#edteam-revel .sp-ban{display:flex;align-items:center;gap:12px}',
            '#edteam-revel .sp-tr{flex:1;height:1px;background:linear-gradient(90deg,transparent,var(--c))}#edteam-revel .sp-tr.d{transform:scaleX(-1)}',
            '#edteam-revel .sp-ban b{color:var(--c);letter-spacing:6px;font-size:.92em;text-shadow:0 0 14px var(--c);white-space:nowrap;animation:erPulse 2.6s ease-in-out infinite}',
            '#edteam-revel .sp-med{position:relative;width:190px;height:190px;margin:34px auto 26px;animation:erMed 1s cubic-bezier(.2,1.2,.3,1) .35s both}',
            '#edteam-revel .sp-med .r1{position:absolute;inset:-18px;border-radius:50%;border:1px dashed var(--c);opacity:.6;animation:erTourne 30s linear infinite}',
            '#edteam-revel .sp-med .r2{position:absolute;inset:-34px;border-radius:50%;border:1px dotted var(--c);opacity:.35;animation:erTourne 50s linear infinite reverse}',
            '#edteam-revel .sp-med .r3{position:absolute;inset:-6px;border-radius:50%;border:2px solid transparent;border-top-color:var(--c);border-bottom-color:var(--c);filter:drop-shadow(0 0 8px var(--c));animation:erTourne 6s linear infinite}',
            '#edteam-revel .sp-med .halo{position:absolute;inset:-46px;border-radius:50%;background:radial-gradient(circle,var(--c) 0,transparent 66%);opacity:.35;animation:erHalo 3s ease-in-out infinite}',
            '#edteam-revel .sp-med .prog{position:absolute;inset:0;border-radius:50%;--p:var(--v,0);background:conic-gradient(var(--c) calc(var(--p)*1%),rgba(255,255,255,.08) 0);animation:erRempli 2s ease-out .6s both}',
            '#edteam-revel .sp-med .dq{position:absolute;inset:9px;border-radius:50%;overflow:hidden;background:#070400;display:flex;align-items:center;justify-content:center;font-size:4em;font-weight:bold;color:var(--c);text-shadow:0 0 22px var(--c);box-shadow:inset 0 0 28px #000}',
            '#edteam-revel .sp-med .dq img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}',
            '#edteam-revel .sp-med .pa{position:absolute;left:50%;bottom:-12px;transform:translateX(-50%);background:#000;border:1px solid var(--c);color:#fff;font-weight:bold;padding:2px 14px;letter-spacing:1px;white-space:nowrap;animation:erPop .6s ease-out 1.6s both}',
            '#edteam-revel .sp-nom{color:#fff;font-size:2em;font-weight:bold;letter-spacing:4px;text-shadow:0 0 22px var(--c);animation:erNom 1s ease-out .9s both;overflow-wrap:anywhere}',
            '#edteam-revel .sp-s{margin-top:6px;color:var(--c);letter-spacing:3px;font-size:.9em;animation:erNom 1s ease-out 1.15s both}',
            '#edteam-revel .sp-d{margin:14px auto 0;max-width:430px;color:#bbb;line-height:1.6;font-size:.9em;animation:erNom 1s ease-out 1.4s both}',
            '#edteam-revel .sp-d b{color:#fff}',
            '#edteam-revel .sp-b .er-moi{animation:erPopM .6s ease-out 1.9s both,erPulse 1.8s ease-in-out 2.5s infinite}',
            '#edteam-revel .sp-act{margin-top:22px;animation:erNom 1s ease-out 2s both}',
            '@property --p{syntax:"<number>";inherits:false;initial-value:0}',
            '@keyframes erRempli{from{--p:0}to{--p:var(--v)}}',
            '@keyframes erFond{from{opacity:0}to{opacity:1}}',
            '@keyframes erEntree{from{opacity:0;transform:translateY(18px) scale(.94)}to{opacity:1;transform:none}}',
            '@keyframes erTourne{to{transform:rotate(360deg)}}',
            '@keyframes erHalo{0%,100%{opacity:.2;transform:scale(.95)}50%{opacity:.5;transform:scale(1.05)}}',
            '@keyframes erPulse{50%{opacity:.6}}',
            '@keyframes erMed{from{opacity:0;transform:scale(.2) rotate(-120deg)}to{opacity:1;transform:none}}',
            '@keyframes erNom{from{opacity:0;transform:translateY(14px);letter-spacing:12px}to{opacity:1;transform:none}}',
            '@keyframes erPop{from{opacity:0;transform:translateX(-50%) scale(.3)}to{opacity:1;transform:translateX(-50%) scale(1)}}',
            '@keyframes erPopM{from{opacity:0;transform:scale(.3)}to{opacity:1;transform:scale(1)}}',
            '@keyframes erReflet{0%,70%,100%{transform:translateX(0)}90%{transform:translateX(520%)}}',
            '@keyframes erMonte{0%{transform:translateY(0);opacity:0}15%{opacity:.9}100%{transform:translateY(-105vh);opacity:0}}',
            '@media (max-width:640px){#edteam-revel .er-b{padding:22px 16px 16px}#edteam-revel .er-t{font-size:1.2em;letter-spacing:2px}#edteam-revel .er-eti{letter-spacing:2px;font-size:.7em;padding:3px 10px}#edteam-revel .sp-med{width:150px;height:150px;margin:28px auto 22px}#edteam-revel .sp-nom{font-size:1.4em;letter-spacing:2px}#edteam-revel .sp-ban b{letter-spacing:3px;font-size:.78em}#edteam-revel .er-btn{padding:11px 18px}}',
            '@media (prefers-reduced-motion:reduce){#edteam-revel,#edteam-revel *{animation-duration:.01s!important;animation-delay:0s!important}}',
            /* carte d'anecdote : discrete, sans voile */
            '#edteam-anec{position:fixed;right:18px;bottom:20px;z-index:9400;width:min(92vw,360px);box-sizing:border-box;background:rgba(10,5,0,.97);border:1px solid #FF7100;box-shadow:0 0 22px rgba(255,113,0,.3);display:flex;cursor:pointer;font-family:inherit;animation:erGlisse .5s cubic-bezier(.2,.8,.2,1);transition:opacity .5s}',
            '#edteam-anec.sort{opacity:0}',
            '#edteam-anec .a-p{flex:none;width:70px;position:relative;overflow:hidden;background:#3a1d06;display:flex;align-items:center;justify-content:center;font-size:1.6em;font-weight:bold;color:#ffab66}',
            '#edteam-anec .a-p img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}',
            '#edteam-anec .a-c{padding:10px 30px 10px 12px;min-width:0}',
            '#edteam-anec .a-k{font-size:.66em;letter-spacing:3px;color:#FF7100}',
            '#edteam-anec .a-ti{color:#fff;font-weight:bold;font-size:.9em;margin:3px 0;overflow-wrap:anywhere}',
            '#edteam-anec .a-x{font-size:.74em;color:#aaa;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
            '#edteam-anec .a-l{font-size:.68em;color:#FF7100;margin-top:4px;letter-spacing:1px}',
            '#edteam-anec .a-f{position:absolute;top:4px;right:9px;color:#888;cursor:pointer;padding:2px 4px}',
            '@keyframes erGlisse{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:none}}',
            '@media (max-width:760px){#edteam-anec{right:auto;left:50%;transform:translateX(-50%);bottom:calc(88px + env(safe-area-inset-bottom));animation:erMonteCarte .5s ease-out}}',
            '@keyframes erMonteCarte{from{opacity:0;transform:translate(-50%,20px)}to{opacity:1;transform:translateX(-50%)}}'
        ].join('\n');
        document.head.appendChild(st);
    }

    // ---------------------------------------------------------------------------------------------------------------
    // FENETRES PLEIN ECRAN
    // ---------------------------------------------------------------------------------------------------------------
    function boutons(i, n) {
        return '<div class="er-act"><button type="button" class="er-btn" data-a="suite">' + (i < n - 1 ? 'SUIVANT' : 'FERMER') + '</button>'
            + (n > 1 && i < n - 1 ? '<button type="button" class="er-btn g" data-a="tout">TOUT PASSER</button>' : '') + '</div>';
    }
    function compteur(i, n) { return n > 1 ? '<div class="er-cpt">' + (i + 1) + ' / ' + n + '</div>' : ''; }

    function htmlRang(it, i, n) {
        var d = it.d, p = it.p, titre, sous, desc;
        if (d.k === 'bgs') {
            titre = 'RANG ' + it.nouveau; sous = 'COMMANDEMENT BGS';
            var pts = Math.floor(Number(p.points_bgs) || 0);
            desc = 'Vos efforts BGS pour l’escadron vous font passer du <b>rang ' + it.ancien + '</b> au <b>rang ' + it.nouveau + '</b>.' + (pts ? ' Vous totalisez <b>' + pts.toLocaleString('fr-FR') + ' points</b>.' : '');
        } else if (d.k === 'pp') {
            titre = 'RANG ' + it.nouveau + ' ATTEINT'; sous = p.puissance_nom ? 'ALLÉGEANCE : ' + String(p.puissance_nom).toUpperCase() : 'POWERPLAY';
            desc = 'Vos mérites vous élèvent du <b>rang ' + it.ancien + '</b> au <b>rang ' + it.nouveau + '</b>.';
        } else if (d.phrase) {
            titre = nomRang(d, it.nouveau); sous = d.sous;
            desc = d.phrase + ' <b>' + esc(titre) + '</b>.';
        } else {
            titre = nomRang(d, it.nouveau); sous = 'RANG ' + d.lib.toUpperCase();
            desc = 'Votre rang ' + d.lib + ' passe de <b>' + esc(nomRang(d, it.ancien)) + '</b> à <b>' + esc(titre) + '</b>.';
        }
        return '<div class="er-b"><span class="er-eti">' + esc(d.eti) + '</span><div class="er-ico">' + d.ico + '</div>'
            + '<div class="er-t">' + esc(titre) + '</div><div class="er-s">' + esc(sous) + '</div><div class="er-d">' + desc + '</div>' + compteur(i, n) + boutons(i, n) + '</div>';
    }

    function libellePlaque(m) {
        var sc = Number(m.score) || 0, distinction = 'RUBAN DE CAMPAGNE';
        if (sc >= 200) distinction = '3 ÉTOILES DE DIAMANT'; else if (sc >= 150) distinction = '2 ÉTOILES DE DIAMANT'; else if (sc >= 100) distinction = '1 ÉTOILE DE DIAMANT';
        else if (sc >= 90) distinction = '3 ÉTOILES D’OR'; else if (sc >= 80) distinction = '2 ÉTOILES D’OR'; else if (sc >= 70) distinction = '1 ÉTOILE D’OR';
        else if (sc >= 60) distinction = '3 ÉTOILES D’ARGENT'; else if (sc >= 50) distinction = '2 ÉTOILES D’ARGENT'; else if (sc >= 40) distinction = '1 ÉTOILE D’ARGENT';
        else if (sc >= 30) distinction = '3 ÉTOILES DE BRONZE'; else if (sc >= 20) distinction = '2 ÉTOILES DE BRONZE'; else if (sc >= 10) distinction = '1 ÉTOILE DE BRONZE';
        var rang = Number(m.rang) || 0;
        var place = rang === 1 ? { txt: '1ÈRE PLACE DE LA CAMPAGNE', col: '#00FFFF' } : rang === 2 ? { txt: '2E PLACE DE LA CAMPAGNE', col: '#FFD700' } : rang === 3 ? { txt: '3E PLACE DE LA CAMPAGNE', col: '#C0C0C0' } : { txt: 'PARTICIPATION À LA CAMPAGNE', col: '#FF7100' };
        return { distinction: distinction, place: place };
    }
    function htmlPlaque(it, i, n) {
        var m = it.x, info = libellePlaque(m);
        var d = String(m.date_cloture || '').match(/^(\d{4})-(\d{2})-(\d{2})/), cloture = d ? d[3] + '/' + d[2] + '/' + d[1] : '';
        var ruban = typeof window.forgerRubanSVG === 'function' ? window.forgerRubanSVG(m.type_ordre, Number(m.jours) || 0, Number(m.score) || 0, Number(m.rang) || 0, '') : '';
        return '<div class="plq-contenu"><div class="plq-legende">NOUVELLE DISTINCTION' + (n > 1 ? ' <span style="color:#888;">· ' + (i + 1) + ' / ' + n + '</span>' : '') + '</div>'
            + '<div class="plq-titre">' + esc(String(m.type_ordre || '').toUpperCase()) + ' · ' + esc(String(m.systeme || '').toUpperCase()) + '</div>'
            + '<div class="plq-faction">' + esc(m.faction || '') + '</div>'
            + '<div class="plq-ruban">' + ruban + '<div class="plq-reflet"></div></div>'
            + '<div class="plq-distinction">' + esc(info.distinction) + '</div><div class="plq-place">' + esc(info.place.txt) + '</div>'
            + '<div class="plq-stats">Score <b>' + Math.floor(Number(m.score) || 0).toLocaleString('fr-FR') + '</b> · <b>' + esc(m.jours || '?') + '</b> jour(s) d’engagement' + (cloture ? ' · clôturée le ' + cloture : '') + '</div>'
            + boutons(i, n) + '<a class="plq-fiche" href="escadron.html?fiche=moi">Voir toutes mes plaques sur ma fiche pilote →</a></div>';
    }

    function htmlDist(it, i, n) {
        var t = it.x, meta = (typeof window.titreMeta === 'function' && window.titreMeta(t.code)) || { nom: t.code, sous: '', couleur: '#FF4FD8', desc: '' };
        var valeur = typeof window.formaterTitre === 'function' ? window.formaterTitre(t.code, t.valeur) : String(t.valeur);
        var moi = String(t.user_id) === String(it.p.user_id);
        var avance = t.second_nom ? ' · en tête de <b>' + esc(String(t.second_nom).toUpperCase()) + '</b>' : ' · seul en lice pour l’instant';
        var medaille = typeof window.forgerMedailleSVG === 'function' ? window.forgerMedailleSVG(t.code, meta.couleur) : '<div class="er-ico">&#10022;</div>';
        return '<div class="er-b"><span class="er-eti">DISTINCTION DE SPÉCIALISTE</span><div class="er-med">' + medaille + '</div>'
            + '<div class="er-t">' + esc(meta.nom) + '</div><div class="er-s">CMDR ' + esc(String(t.cmdr_nom || '').toUpperCase()) + '</div>'
            + '<div class="er-d"><b>CMDR ' + esc(String(t.cmdr_nom || '').toUpperCase()) + '</b> prend le titre de spécialiste <b>' + esc(String(meta.sous || '').toLowerCase()) + '</b> pour l’escadron.<br>' + esc(valeur) + avance + '</div>'
            + (moi ? '<div class="er-moi">C’EST TOI ! BRAVO</div>' : '') + compteur(i, n) + boutons(i, n) + '</div>';
    }

    function htmlSpectacle(it, i, n) {
        var x = it.x, pilier = it.type === 'pilier', moi = String(x.user_id) === String(it.p.user_id), po = portrait(x.user_id, x.cmdr_nom);
        var glyphe = pilier ? '&#9733;' : '&#9670;', eti, pct, pastille, sous, desc;
        if (pilier) {
            pct = Math.max(0, Math.min(100, Number(x.part_pct) || 0));
            var act = String(x.attribut || '').split('·').pop().trim();
            eti = 'PILIER DE LA SEMAINE'; pastille = glyphe + ' ' + Math.round(pct) + ' %';
            sous = (act && !/%/.test(act) ? esc(act.toUpperCase()) + ' · ' : '') + Math.round(pct) + ' % DE L’EFFORT BGS';
            desc = 'Le pilote qui a le plus rapporté à l’escadron cette semaine. <b>Désigné automatiquement chaque jeudi.</b>';
        } else {
            var g = Math.round((Number(x.progres_pct) || 0) * 10) / 10;
            pct = Math.max(8, Math.min(100, g * 3));
            eti = 'ÉLAN POWERPLAY'; pastille = glyphe + ' +' + g.toLocaleString('fr-FR') + ' %';
            sous = (x.puissance ? esc(String(x.puissance).toUpperCase()) + ' · ' : '') + 'DE MÉRITES EN PLUS';
            desc = 'La plus forte progression Powerplay de la semaine, <b>en proportion de son niveau</b>.';
        }
        var particules = '', nb = window.innerWidth < 640 ? 12 : 24;
        for (var k = 0; k < nb; k++) particules += '<i class="sp-part" style="left:' + (Math.random() * 100).toFixed(1) + '%;animation-duration:' + (5 + Math.random() * 7).toFixed(1) + 's;animation-delay:' + (Math.random() * 6).toFixed(1) + 's;transform:scale(' + (0.6 + Math.random() * 1.6).toFixed(2) + ')"></i>';
        return '<div class="sp-rayons"></div>' + particules + '<div class="sp-b"><div class="sp-ban"><span class="sp-tr"></span><b>' + glyphe + ' ' + eti + ' ' + glyphe + '</b><span class="sp-tr d"></span></div>'
            + '<div class="sp-med" style="--v:' + pct.toFixed(1) + '"><div class="halo"></div><div class="r2"></div><div class="r1"></div><div class="r3"></div><div class="prog"></div>'
            + '<div class="dq">' + esc(po.ini) + (po.u ? '<img src="' + esc(po.u) + '" alt="" decoding="async" onerror="this.remove()">' : '') + '</div><span class="pa">' + pastille + '</span></div>'
            + '<div class="sp-nom">CMDR ' + esc(String(x.cmdr_nom || '').toUpperCase()) + '</div><div class="sp-s">' + sous + '</div><div class="sp-d">' + desc + '</div>'
            + (moi ? '<div class="er-moi">C’EST TOI ! BRAVO</div>' : '') + compteur(i, n)
            + '<div class="sp-act">' + boutons(i, n).replace('er-act', 'er-act" style="margin-top:0') + '</div></div>';
    }

    function racine() {
        var ov = document.getElementById('edteam-revel');
        if (!ov) {
            ov = document.createElement('div'); ov.id = 'edteam-revel';
            ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Nouveauté');
            document.body.appendChild(ov);
        }
        return ov;
    }
    function fermerRacine() { var ov = document.getElementById('edteam-revel'); if (ov) ov.remove(); }

    function couleurDe(it) { return it.type === 'rang' ? it.d.couleur : it.type === 'plaque' ? libellePlaque(it.x).place.col : it.type === 'dist' ? '#FF4FD8' : it.type === 'pilier' ? '#FFD700' : '#00F0FF'; }

    // joue une chaine d'elements, un par un ; rend la main quand elle est finie
    function chaine(liste) {
        return new Promise(function (fini) {
            var i = 0, n = liste.length, ov = racine();
            function clavier(e) {
                if (e.key === 'Escape') { e.preventDefault(); sortir(true); }
                else if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); sortir(false); }
            }
            function sortir(tout) {
                if (tout) { for (var k = i; k < n; k++) marquer(liste[k]); i = n; } else i++;
                montrer();
            }
            function montrer() {
                if (i >= n) { document.removeEventListener('keydown', clavier); fermerRacine(); fini(); return; }
                var it = liste[i];
                marquer(it);   // vu des qu'il est montre
                ov.className = it.type === 'pilier' || it.type === 'elan' ? 'spec' : '';
                ov.style.setProperty('--c', couleurDe(it));
                ov.innerHTML = it.type === 'rang' ? htmlRang(it, i, n) : it.type === 'plaque' ? htmlPlaque(it, i, n) : it.type === 'dist' ? htmlDist(it, i, n) : htmlSpectacle(it, i, n);
                var s = ov.querySelector('[data-a="suite"]'), t = ov.querySelector('[data-a="tout"]');
                if (s) s.addEventListener('click', function () { sortir(false); });
                if (t) t.addEventListener('click', function () { sortir(true); });
                if (typeof window.sonSucces === 'function') { try { window.sonSucces(); } catch (e) { /* le son est un plus */ } }
            }
            document.addEventListener('keydown', clavier);
            montrer();
        });
    }

    // ---------------------------------------------------------------------------------------------------------------
    // CARTE D'ANECDOTE (discrete)
    // ---------------------------------------------------------------------------------------------------------------
    var TONS = { humour: ['HUMOUR', '#FFD700'], epique: ['ÉPIQUE', '#FF7100'], emotion: ['ÉMOTION', '#ff8fb0'], serieux: ['SÉRIEUX', '#00F0FF'] };
    function montrerAnecdote(a) {
        var x = a.x, t = TONS[x.ton] || ['ANECDOTE', '#FF7100'], po = portrait(x.user_id, x.cmdr_nom);
        marquer({ type: 'anecdote', x: x, p: a.p });
        var c = document.createElement('div');
        c.id = 'edteam-anec'; c.setAttribute('role', 'status');
        c.innerHTML = '<div class="a-p">' + esc(po.ini) + (po.u ? '<img src="' + esc(po.u) + '" alt="" decoding="async" onerror="this.remove()">' : '') + '</div>'
            + '<div class="a-c"><div class="a-k">NOUVELLE ANECDOTE · <span style="color:' + t[1] + '">' + t[0] + '</span></div><div class="a-ti">' + esc(x.titre) + '</div>'
            + '<div class="a-x">' + esc(String(x.texte || '').replace(/\n+/g, ' ')) + '</div><div class="a-l">LIRE LA SUITE ›</div></div><span class="a-f" aria-label="Fermer">✕</span>';
        function retirer() { clearTimeout(tm); c.classList.add('sort'); setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 500); }
        var tm = setTimeout(retirer, 25000);
        c.addEventListener('click', function (e) {
            if (e.target.className === 'a-f') { retirer(); return; }
            retirer();
            var ouvrir = function () { if (window.EDTEAMAnecdotes) window.EDTEAMAnecdotes.ouvrir(); };
            if (window.EDTEAMAnecdotes) ouvrir(); else chargerScript('anecdotes.js?v=3').then(ouvrir);
        });
        // en bas à droite ; si une carte du pied de page (« Le saviez-vous ? », nouveauté importante) occupe déjà ce coin, on se pose juste au-dessus
        try {
            var haut = window.innerHeight;
            Array.prototype.forEach.call(document.querySelectorAll('.ft-astuce'), function (f) { var r = f.getBoundingClientRect(); if (r.height && r.top < haut) haut = r.top; });
            if (haut < window.innerHeight && window.innerWidth > 760) c.style.bottom = (window.innerHeight - haut + 10) + 'px';
        } catch (e) { /* position par defaut */ }
        document.body.appendChild(c);
        etat.carte = c;
    }

    // ---------------------------------------------------------------------------------------------------------------
    // ORDONNANCEMENT
    // ---------------------------------------------------------------------------------------------------------------
    function bloque() {
        return BLOQUANTS.some(function (id) { var e = document.getElementById(id); return e && getComputedStyle(e).display !== 'none'; });
    }
    async function jouer() {
        if (etat.enCours || (!etat.file.length && !etat.anecdote)) return;
        if (bloque()) { clearTimeout(etat.minuteur); etat.minuteur = setTimeout(jouer, 3000); return; }
        etat.enCours = true;
        try {
            css();
            if (etat.file.length) {
                var liste = etat.file.splice(0).sort(function (a, b) { return PRIO[a.type] - PRIO[b.type]; });
                if (liste.some(function (it) { return it.type === 'dist'; }) && typeof window.titreMeta !== 'function') await chargerScript('medailles.js?v=7');
                if (liste.some(function (it) { return it.type === 'plaque'; }) && typeof window.forgerRubanSVG !== 'function') await chargerScript('rubans.js?v=1');
                await chaine(liste);
            }
            if (etat.anecdote) { var a = etat.anecdote; etat.anecdote = null; if (!document.getElementById('edteam-anec')) montrerAnecdote(a); }
        } catch (e) { console.error('Révélations :', e); fermerRacine(); }
        etat.enCours = false;
        if (etat.file.length || etat.anecdote) jouer();
    }

    window.edteamRevelations = {
        // profil : la ligne du pilote connecte (user_id, escadron_id, est_approuve, rangs...). opts.rangs : tables de noms de rangs (mobile) ; defaut window.EDTEAM_RANGS. opts.db : le client Supabase (mobile : il n'est pas sur window) ; defaut window.supabaseApp.
        verifier: function (profil, opts) {
            try {
                if (!profil || !profil.user_id || profil.est_approuve === false) return;
                etat.profil = profil;
                if (opts && opts.rangs) etat.opts.rangs = opts.rangs;
                if (opts && opts.db) etat.opts.db = opts.db;
                var items = [];
                detecterRangs(profil, items);
                ajouter(items);
                globales(profil, false);
                if (etat.file.length) { clearTimeout(etat.minuteur); etat.minuteur = setTimeout(jouer, 1800); }
            } catch (e) { /* une revelation ne doit jamais gener la page */ }
        },
        // pour les tests : oublie ce que ce pilote a vu
        oublier: function (uid) { try { localStorage.removeItem(PREFIXE + uid); } catch (e) { /* rien */ } }
    };

    // retour sur l'onglet (mobile surtout) : une verification de fond, au plus toutes les heures
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden && etat.profil) window.edteamRevelations.verifier(etat.profil);
    });
})();
