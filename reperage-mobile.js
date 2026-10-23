// MISSION DE REPERAGE sur le MOBILE : un bandeau « N systemes a reperer » en tete de l'onglet CAMPAGNES (BGS) ouvre une feuille plein ecran :
// route de repérage (chemin le plus court depuis la position du pilote), systemes deja reperes par les camarades (avatar + tampon), systemes ecartes, compteur personnel, regles, message d'EDTEAM.
// Les donnees et le calcul de la route viennent de reperage.js (memes fonctions que le PC : window.EdteamReperage._ui) ; ici, seulement l'affichage tactile.
// Cout : les memes que le PC (une lecture de la liste, memorisee 5 minutes) ; relecture toutes les 45 s UNIQUEMENT pendant que la feuille est ouverte.
(function () {
    'use strict';
    if (window.EdteamReperageMobile) return;
    var U = null, S = { onglet: 'rep', msg: false, carte: false, regles: false, ouvert: false, iv: null };

    function ui() { U = U || (window.EdteamReperage && window.EdteamReperage._ui) || null; return U; }
    function F(n) { return Number(n || 0); }

    function css() {
        if (document.getElementById('rm-css')) return;
        var s = document.createElement('style'); s.id = 'rm-css';
        s.textContent = [
            '.rm-chip { position:relative; display:flex; align-items:center; gap:14px; width:100%; box-sizing:border-box; text-align:left; font-family:inherit; color:#fff; cursor:pointer; padding:12px 16px 12px 12px; border-radius:18px; border:1px solid #00c8d6; background:linear-gradient(90deg,rgba(0,240,255,.16),rgba(0,240,255,.05)); overflow:hidden; animation:rmPulse 2.2s ease-in-out infinite; -webkit-tap-highlight-color:transparent; }',
            '.rm-chip::after { content:""; position:absolute; inset:0; pointer-events:none; background:linear-gradient(100deg,transparent 40%,rgba(255,255,255,.3) 50%,transparent 60%); background-size:300% 100%; background-position:100% 0; animation:rmBalai 3.6s ease-in-out infinite; }',
            '.rm-chip b { display:block; font-weight:normal; letter-spacing:2px; font-size:1.02em; text-shadow:0 0 10px rgba(0,240,255,.5); } .rm-chip small { display:block; color:#8fd9e0; letter-spacing:2px; font-size:.68em; margin-top:3px; } .rm-chip .rm-chev { margin-left:auto; color:#00F0FF; font-size:1.8em; line-height:1; }',
            '.rm-chip.ok { animation:none; border-color:#2a4a36; background:rgba(47,224,122,.07); } .rm-chip.ok::after { display:none; } .rm-chip.ok b { color:#7fe09f; text-shadow:none; } .rm-chip.ok .rm-chev { color:#7fe09f; }',
            '.rm-logo-w { position:relative; flex:none; display:inline-flex; } .rm-mail { position:absolute; right:-6px; bottom:-5px; width:22px; height:22px; border-radius:50%; background:#00F0FF; color:#001418; display:flex; align-items:center; justify-content:center; box-shadow:0 0 0 2px #05080c; animation:rmEnv 2.4s ease-in-out infinite; transform-origin:50% 60%; }',
            '.rm-chip.ok .rm-mail { background:#2fe07a; animation:none; } .rm-mail svg { width:13px; height:13px; display:block; }',
            '@keyframes rmPulse { 0%,100% { box-shadow:0 0 0 rgba(0,240,255,0); } 50% { box-shadow:0 0 22px rgba(0,240,255,.5), inset 0 0 14px rgba(0,240,255,.14); } } @keyframes rmBalai { 0%,55% { background-position:100% 0; } 100% { background-position:0% 0; } }',
            '@keyframes rmEnv { 0%,55%,100% { transform:scale(1) rotate(0); } 62% { transform:scale(1.22) rotate(-14deg); } 70% { transform:scale(1.22) rotate(12deg); } 78% { transform:scale(1.15) rotate(-8deg); } 86% { transform:scale(1.08) rotate(4deg); } }',
            '@media (prefers-reduced-motion:reduce) { .rm-chip, .rm-chip::after, .rm-mail { animation:none !important; } }',
            // feuille plein ecran
            '#rm-feuille { position:fixed; inset:0; z-index:9300; display:flex; flex-direction:column; background:#05080c; color:#cfd8dc; font-family:inherit; animation:rmMonte .22s ease-out; } @keyframes rmMonte { from { transform:translateY(24px); opacity:0; } to { transform:none; opacity:1; } }',
            '#rm-feuille .rm-tete { flex:none; display:flex; align-items:center; gap:12px; padding:calc(12px + env(safe-area-inset-top)) 14px 12px; border-bottom:1px solid rgba(0,240,255,.25); background:linear-gradient(180deg,rgba(0,40,48,.9),rgba(5,8,12,.98)); }',
            '#rm-feuille .rm-tete h3 { margin:0; font-size:1.02em; letter-spacing:4px; color:#fff; font-weight:normal; } #rm-feuille .rm-tete small { display:block; color:#7fe9f2; letter-spacing:1.5px; font-size:.68em; margin-top:3px; overflow-wrap:anywhere; }',
            '#rm-feuille .rm-x { margin-left:auto; flex:none; width:42px; height:42px; border-radius:14px; border:1px solid #3a4a55; background:transparent; color:#9ab; font-size:1.2em; font-family:inherit; }',
            '#rm-feuille .rm-corps { flex:1 1 auto; overflow-y:auto; -webkit-overflow-scrolling:touch; padding:12px 12px calc(96px + env(safe-area-inset-bottom)); display:flex; flex-direction:column; gap:10px; }',
            '#rm-feuille .rm-carte { border:1px solid #1d3a40; background:rgba(0,240,255,.04); border-radius:16px; padding:12px 14px; } #rm-feuille .rm-gros { font-size:2.4em; color:#fff; line-height:1; } #rm-feuille .rm-gros.ok { color:#2fe07a; }',
            '#rm-feuille .rm-leg { color:#889; letter-spacing:2px; font-size:.68em; } #rm-feuille .rm-barre { height:6px; border-radius:3px; background:#111; margin:9px 0 6px; overflow:hidden; } #rm-feuille .rm-barre i { display:block; height:100%; background:linear-gradient(90deg,#007a85,#00F0FF); }',
            '#rm-feuille .rm-agents { display:flex; align-items:center; gap:0; margin-top:8px; } #rm-feuille .rm-agents .ph { margin-left:-8px; box-shadow:0 0 0 2px #05080c; } #rm-feuille .rm-agents .ph:first-child { margin-left:0; }',
            '#rm-feuille .rm-mon { margin-top:8px; padding-top:8px; border-top:1px dashed #1d3a40; color:#9be8ff; letter-spacing:1px; font-size:.8em; } #rm-feuille .rm-mon b { color:#fff; font-weight:normal; }',
            '#rm-feuille .rm-regles { font-size:.82em; line-height:1.6; } #rm-feuille .rm-regles b { color:#fff; font-weight:normal; } #rm-feuille .rm-regles .n { color:#00F0FF; margin-right:4px; }',
            '#rm-feuille .rm-pli { width:100%; display:flex; justify-content:space-between; align-items:center; background:transparent; border:1px solid #1d3a40; border-radius:14px; color:#7fe9f2; letter-spacing:2px; padding:12px 14px; font-family:inherit; font-size:.8em; }',
            '#rm-feuille .rm-seg { display:flex; gap:6px; } #rm-feuille .rm-seg button { flex:1; padding:11px 6px; border-radius:12px; border:1px solid #2a3a44; background:#0a0f14; color:#889; font-family:inherit; letter-spacing:1px; font-size:.72em; } #rm-feuille .rm-seg button.on { color:#00F0FF; border-color:#00F0FF; background:rgba(0,240,255,.12); }',
            '#rm-feuille .rm-lg { display:grid; grid-template-columns:30px minmax(0,1fr) auto auto; gap:10px; align-items:center; border:1px solid #1f2b33; border-left:4px solid var(--c,#00F0FF); border-radius:14px; background:#0a0e12; padding:11px 10px; -webkit-tap-highlight-color:transparent; }',
            '#rm-feuille .rm-lg:active { background:#10171d; } #rm-feuille .rm-n { width:28px; height:28px; border-radius:50%; border:1px solid var(--c,#00F0FF); color:var(--c,#00F0FF); display:flex; align-items:center; justify-content:center; font-size:.78em; }',
            '#rm-feuille .rm-nm b { color:#fff; letter-spacing:1.5px; font-weight:normal; overflow-wrap:anywhere; } #rm-feuille .rm-nm small { display:block; color:#889; font-size:.74em; line-height:1.45; margin-top:3px; } #rm-feuille .rm-tag { display:inline-block; border:1px solid var(--c); color:var(--c); padding:0 6px; font-size:.78em; letter-spacing:1px; margin:3px 5px 0 0; border-radius:3px; } #rm-feuille .rm-tag.risque { --c:#ffd166; }',
            '#rm-feuille .rm-dr { text-align:right; display:flex; flex-direction:column; gap:3px; font-size:.82em; } #rm-feuille .rm-age { color:#ff8a8a; } #rm-feuille .rm-dist { color:#9be8ff; }',
            '#rm-feuille .rm-ign { width:40px; height:40px; border-radius:12px; border:1px solid #5a4a2a; background:transparent; color:#ffd166; font-size:1.1em; font-family:inherit; }',
            '#rm-feuille .rm-lg.fait { grid-template-columns:42px minmax(0,1fr) auto; background:#0a0d10; border-left-color:#3a4650; } #rm-feuille .rm-fait-nm { filter:grayscale(1); opacity:.6; }',
            '#rm-feuille .rm-tampon { color:#2fe07a; border:2px solid #2fe07a; padding:2px 9px; font-weight:bold; letter-spacing:3px; font-size:.74em; transform:rotate(-6deg); opacity:.9; text-shadow:0 0 6px rgba(47,224,122,.35); white-space:nowrap; }',
            '#rm-feuille .rm-btn { background:rgba(0,240,255,.1); border:1px solid #00F0FF; color:#00F0FF; padding:10px 14px; border-radius:12px; font-family:inherit; letter-spacing:2px; font-weight:bold; font-size:.78em; }',
            '#rm-feuille .rm-prochain { position:absolute; left:0; right:0; bottom:0; padding:10px 12px calc(10px + env(safe-area-inset-bottom)); background:linear-gradient(180deg,rgba(5,8,12,0),#05080c 30%); } #rm-feuille .rm-prochain > div { display:flex; align-items:center; justify-content:space-between; gap:10px; border:1px solid #00F0FF; border-radius:16px; background:rgba(0,40,48,.96); padding:10px 12px 10px 16px; box-shadow:0 0 18px rgba(0,240,255,.25); }',
            '#rm-feuille .rm-prochain small { display:block; color:#7fe9f2; letter-spacing:3px; font-size:.62em; } #rm-feuille .rm-prochain b { color:#fff; letter-spacing:2px; font-weight:normal; overflow-wrap:anywhere; }',
            '#rm-feuille .rm-note { color:#778; font-size:.74em; line-height:1.6; } #rm-feuille .rm-off { border:1px solid #ffb000; background:rgba(255,176,0,.1); color:#ffd166; border-radius:14px; padding:10px 12px; font-size:.82em; line-height:1.6; }',
            '#rm-feuille .rm-vide { text-align:center; padding:24px 10px; border:1px dashed #2fe07a; border-radius:14px; color:#7fe09f; letter-spacing:3px; }',
            '#rm-feuille .rm-parole { border-left:3px solid #00F0FF; background:linear-gradient(90deg,rgba(0,240,255,.08),transparent 70%); border-radius:0 14px 14px 0; padding:12px 14px; font-size:.84em; line-height:1.7; } #rm-feuille .rm-parole .de { color:#7fe9f2; letter-spacing:2px; font-size:.78em; margin-bottom:6px; } #rm-feuille .rm-parole b { color:#fff; font-weight:normal; } #rm-feuille .rm-parole em { color:#00F0FF; font-style:normal; } #rm-feuille .rm-parole .sig { margin-top:8px; color:#889; font-size:.82em; letter-spacing:1.5px; }'
        ].join('\n');
        document.head.appendChild(s);
    }
    var ENV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>';

    // ---- le bandeau de l'onglet CAMPAGNES ----
    async function monter(el) {
        if (!ui() || !el) return;
        css(); U.css();
        var D = await donnees(false); if (!el.isConnected) return;
        if (!D) { el.innerHTML = ''; return; }
        var actif = D.r.actif !== false, n = D.fl.items.length;
        if (!actif) { el.innerHTML = U.estDirecteur() ? '<button type="button" class="rm-chip ok" data-rm="ouvrir"><span><b style="color:#aaa;">⚠ REPÉRAGE DÉSACTIVÉ</b><small>réglage du directeur · voir le détail</small></span><span class="rm-chev">›</span></button>' : ''; brancher(el); return; }
        await U.photos(); if (!el.isConnected) return;
        el.innerHTML = '<button type="button" class="rm-chip' + (n ? '' : ' ok') + '" data-rm="ouvrir" aria-label="Mission de repérage"><span class="rm-logo-w">' + U.logo(46) + '<i class="rm-mail">' + ENV + '</i></span>'
            + '<span><b>' + (n ? n + ' SYSTÈME' + (n > 1 ? 'S' : '') + ' À REPÉRER' : 'TOUT EST À JOUR') + '</b><small>OPÉRATION ESPIONNAGE · MESSAGE D’EDTEAM</small></span><span class="rm-chev">›</span></button>';
        brancher(el);
    }
    function brancher(el) { el.querySelectorAll('[data-rm=ouvrir]').forEach(function (b) { b.onclick = function () { ouvrir(); }; }); }

    async function donnees(force) {
        var d = await U.charger(!!force); if (!d) return null;
        var p = await U.maPosition(), fl = U.filtrer(d, p), rt = U.route(fl.items, p);
        return { d: d, p: p, fl: fl, rt: rt, faits: d.faits || [], ignores: d.ignores || [], r: d.reglages || {} };
    }

    // ---- la feuille ----
    async function ouvrir() {
        if (!ui() || document.getElementById('rm-feuille')) return;
        css(); U.css();
        var D = await donnees(true); if (!D) return; await U.photos();
        var f = document.createElement('div'); f.id = 'rm-feuille'; f.setAttribute('role', 'dialog'); f.setAttribute('aria-label', 'Route de repérage');
        document.body.appendChild(f); S.ouvert = true;
        document.documentElement.style.overflow = 'hidden';
        dessiner(f, D);
        S.iv = setInterval(async function () {
            var m = document.getElementById('rm-feuille'); if (!m) { clearInterval(S.iv); return; }
            U.vider(); var n = await donnees(true); if (n && document.getElementById('rm-feuille')) dessiner(m, n);
        }, 45000);
    }
    function fermer() {
        var f = document.getElementById('rm-feuille'); if (f) f.remove();
        clearInterval(S.iv); S.ouvert = false; document.documentElement.style.overflow = '';
        var el = document.getElementById('m-reperage'); if (el) monter(el);
    }

    function dessiner(f, D) {
        var corps = f.querySelector('.rm-corps'), sc = corps ? corps.scrollTop : 0;
        f.innerHTML = vue(D);
        var c2 = f.querySelector('.rm-corps'); if (c2) c2.scrollTop = sc;
        f.querySelector('.rm-x').onclick = fermer;
        f.querySelectorAll('[data-rm-seg]').forEach(function (b) { b.onclick = function () { S.onglet = b.dataset.rmSeg; dessiner(f, D); }; });
        f.querySelectorAll('[data-rm-pli]').forEach(function (b) { b.onclick = function () { S[b.dataset.rmPli] = !S[b.dataset.rmPli]; dessiner(f, D); }; });
        f.querySelectorAll('.rm-lg[data-s]').forEach(function (l) { l.onclick = function (e) { if (e.target.closest && e.target.closest('.rm-ign')) return; copier(l.dataset.s, l); }; });
        f.querySelectorAll('[data-rm-copie]').forEach(function (b) { b.onclick = function () { U.copier(b.dataset.rmCopie, b); }; });
        f.querySelectorAll('[data-rm-ign]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); agir('reperage_ignorer', b.dataset.rmIgn, f); }; });
        f.querySelectorAll('[data-rm-rein]').forEach(function (b) { b.onclick = function () { agir('reperage_reintegrer', b.dataset.rmRein, f); }; });
    }
    function copier(nom, ligne) {
        U.copier(nom, null);
        var b = ligne.querySelector('.rm-nm b'); if (b) { var v = b.textContent; b.textContent = 'COPIÉ ✓'; setTimeout(function () { b.textContent = v; }, 1200); }
    }
    async function agir(rpc, systeme, f) {
        var r = await U.db().rpc(rpc, { p_systeme: systeme });
        if (r && r.error) { alert(r.error.message || 'refusé'); return; }
        U.vider(); var n = await donnees(true); if (n && document.getElementById('rm-feuille')) dessiner(f, n);
    }

    function vue(D) {
        var items = D.fl.items, rt = D.rt, faits = D.faits, ign = D.ignores, r = D.r, p = D.p, total = items.length + faits.length, pct = total ? Math.round(100 * faits.length / total) : 100;
        var amiral = U.estAmiral(), dir = U.estDirecteur(), mes = D.d.mes;
        var agents = []; faits.forEach(function (x) { if (x.par && agents.indexOf(U.nom(x.par)) < 0) agents.push(U.nom(x.par)); });
        var inactif = r.actif === false;
        var h = '<div class="rm-tete"><div><h3>ROUTE DE REPÉRAGE</h3><small>' + (p && p.systeme ? 'depuis ta position : ' + U.E(U.nom(p.systeme)) : 'position inconnue (plugin non lancé)') + ' · ' + rt.etapes.length + ' système' + (rt.etapes.length > 1 ? 's' : '') + (rt.total ? ' · ' + Math.round(rt.total) + ' al' : '') + '</small></div><button type="button" class="rm-x" aria-label="Fermer">✕</button></div>';
        h += '<div class="rm-corps">';
        if (inactif) h += '<div class="rm-off">⚠ REPÉRAGE DÉSACTIVÉ pour l’escadron : la liste est vide et aucun point n’est donné. ' + (dir ? 'Réactivez-le depuis la version PC (réglages du directeur).' : 'Seul le directeur peut le réactiver.') + '</div>';
        // avancement + compteur personnel
        h += '<div class="rm-carte"><div style="display:flex; align-items:baseline; gap:12px;"><span class="rm-gros' + (items.length ? '' : ' ok') + '">' + (items.length ? items.length : '✓') + '</span><span class="rm-leg">' + (items.length ? 'À REPÉRER' : 'TOUT EST À JOUR') + '</span></div>'
            + '<div class="rm-barre"><i style="width:' + pct + '%"></i></div><div class="rm-note">' + (faits.length ? faits.length + ' repéré' + (faits.length > 1 ? 's' : '') + ' depuis le dernier tick sur ' + total : 'Aucun repérage depuis le dernier tick') + (ign.length ? ' · ' + ign.length + ' écarté' + (ign.length > 1 ? 's' : '') + ' par l’Amiral' : '') + '</div>'
            + '<div class="rm-agents">' + agents.slice(0, 7).map(function (n) { return U.avatar(n, 32); }).join('') + (agents.length > 7 ? '<span class="rm-note" style="margin-left:8px;">+' + (agents.length - 7) + '</span>' : '') + (agents.length ? '<span class="rm-leg" style="margin-left:10px;">' + agents.length + ' AGENT' + (agents.length > 1 ? 'S' : '') + ' SUR LE TERRAIN</span>' : '<span class="rm-note">Aucun agent sur le terrain depuis le dernier tick. Soyez le premier.</span>') + '</div>'
            + (mes ? '<div class="rm-mon">TES ACTIONS L’ESPION : <b>' + F(mes.actions) + '</b> · ' + F(mes.reperages) + ' système' + (F(mes.reperages) > 1 ? 's' : '') + ' repéré' + (F(mes.reperages) > 1 ? 's' : '') + ' · ' + F(mes.scans) + ' joueur' + (F(mes.scans) > 1 ? 's' : '') + ' scanné' + (F(mes.scans) > 1 ? 's' : '') + '</div>' : '') + '</div>';
        // regles + message
        h += '<button type="button" class="rm-pli" data-rm-pli="regles"><span>COMMENT GAGNER DES POINTS</span><span>' + (S.regles ? '▴' : '▾') + '</span></button>';
        if (S.regles) h += '<div class="rm-carte rm-regles"><div><span class="n">1.</span>Arriver dans un système de la liste : <b>+1 point BGS</b> · +1 L’ESPION</div><div><span class="n">2.</span>Scanner un joueur d’un autre escadron (onglet Combat du tableau de bord) : <b>+1 point BGS</b> · +1 L’ESPION</div></div>';
        h += '<button type="button" class="rm-pli" data-rm-pli="msg" style="color:#7fe9f2;"><span>✉ MESSAGE D’EDTEAM</span><span>' + (S.msg ? '▴' : '▾') + '</span></button>';
        if (S.msg) h += '<div class="rm-carte" style="padding:6px;">' + U.messageAmiral(D.d) + '</div>';
        h += '<button type="button" class="rm-pli" data-rm-pli="carte"><span>CARTE DE LA ROUTE</span><span>' + (S.carte ? '▴' : '▾') + '</span></button>';
        if (S.carte) h += '<div class="rm-carte" style="padding:6px;">' + U.carte(rt.etapes, p) + '</div>';
        // onglets
        var nIgn = ign.length;
        h += '<div class="rm-seg"><button type="button" data-rm-seg="rep" class="' + (S.onglet === 'rep' ? 'on' : '') + '">À REPÉRER (' + items.length + ')</button><button type="button" data-rm-seg="fait" class="' + (S.onglet === 'fait' ? 'on' : '') + '">REPÉRÉS (' + faits.length + ')</button>' + (nIgn || amiral ? '<button type="button" data-rm-seg="ecarte" class="' + (S.onglet === 'ecarte' ? 'on' : '') + '">ÉCARTÉS (' + nIgn + ')</button>' : '') + '</div>';
        if (S.onglet === 'rep') {
            if (!rt.etapes.length) h += '<div class="rm-vide">✓ TOUT EST À JOUR</div>';
            rt.etapes.forEach(function (it, i) {
                var c = U.couleurMotif(it), tags = U.ORDRE_MOTIFS.filter(function (m) { return (it.m || []).indexOf(m) >= 0; }).map(function (m) { return '<i class="rm-tag" style="--c:' + (m === 'DIRECTIVE' ? U.couleurDir(it) : U.MOTIFS[m][1]) + '">' + U.MOTIFS[m][0] + '</i>'; }).join('') + (it.k && U.RISQUES[it.k] ? '<i class="rm-tag risque">⚠ ' + U.RISQUES[it.k] + '</i>' : '');
                h += '<div class="rm-lg" data-s="' + U.E(it.s) + '" style="--c:' + c + '"><span class="rm-n">' + (i + 1) + '</span><div class="rm-nm"><b>' + U.E(it.s) + '</b><div>' + tags + '</div><small>' + U.E(it.d || '') + ' · limite ' + U.age(it.t) + '</small></div>'
                    + '<div class="rm-dr"><span class="rm-age">' + U.age(it.a) + '</span><span class="rm-dist">' + (it.leg != null ? Math.round(it.leg * 10) / 10 + ' al' : '—') + '</span></div>' + (amiral ? '<button type="button" class="rm-ign" data-rm-ign="' + U.E(it.s) + '" aria-label="Écarter ce système">⊘</button>' : '<span></span>') + '</div>';
            });
            if (D.fl.loin) h += '<div class="rm-note">+ ' + D.fl.loin + ' système' + (D.fl.loin > 1 ? 's' : '') + ' au-delà de ' + D.fl.rayon + ' al ' + (D.fl.depuisPosition ? 'de ta position' : 'de la zone principale de l’escadron') + ' : non proposé' + (D.fl.loin > 1 ? 's' : '') + '.</div>';
        } else if (S.onglet === 'fait') {
            if (!faits.length) h += '<div class="rm-note" style="text-align:center; padding:18px 0;">Aucun système repéré depuis le dernier tick. Les repérages disparaissent de la liste à chaque tick quotidien.</div>';
            faits.forEach(function (x) {
                h += '<div class="rm-lg fait"><span>' + U.avatar(U.nom(x.par || '?'), 36) + '</span><div class="rm-nm rm-fait-nm"><b>' + U.E(x.s) + '</b><small>repéré par ' + (x.par ? 'CMDR ' + U.E(U.nom(x.par)) : 'un pilote') + ' · ' + U.depuis(x.vu) + '</small></div><span class="rm-tampon">REPÉRÉ</span></div>';
            });
        } else {
            if (!nIgn) h += '<div class="rm-note" style="text-align:center; padding:18px 0;">Aucun système écarté. Le bouton ⊘ d’une ligne (Amiral et directeur) écarte un système des repérages ; il reste consultable ici.</div>';
            ign.forEach(function (i) {
                h += '<div class="rm-lg" style="--c:#5a4a2a; grid-template-columns:minmax(0,1fr) auto;"><div class="rm-nm"><b>' + U.E(i.s) + '</b><small>écarté par ' + (i.par ? 'CMDR ' + U.E(U.nom(i.par)) : 'l’Amiral') + ' ' + U.depuis(i.le) + (i.note ? ' · ' + U.E(i.note) : '') + (i.m && i.m.length ? ' · encore concerné : ' + i.m.map(function (m) { return (U.MOTIFS[m] || [m])[0].toLowerCase(); }).join(', ') : ' · plus concerné actuellement') + '</small></div>' + (amiral ? '<button type="button" class="rm-btn" data-rm-rein="' + U.E(i.s) + '">REMETTRE</button>' : '') + '</div>';
            });
        }
        // reglages (lecture seule)
        h += '<div class="rm-note">Modes : ' + [r.bgs_actif !== false ? 'BGS (directive ' + (r.age_directive_h || 24) + ' h · expansion ' + (r.age_expansion_h || 24) + ' h)' : '', r.pp_actif !== false ? 'POWERPLAY (conquête ' + (r.age_conquete_h || 48) + ' h dès ' + (r.seuil_conquete_pct || 25) + ' %)' : ''].filter(Boolean).join(' · ') + '. Rayon : ' + (r.rayon_max_al || 500) + ' al. ' + (dir ? 'Réglages : version PC.' : 'Seul le directeur modifie ces réglages.') + ' Un clic sur une ligne copie le nom du système ; arrivez-y en jeu, un saut suffit.</div>';
        h += '</div>';
        if (S.onglet === 'rep' && rt.etapes[0]) h += '<div class="rm-prochain"><div><span><small>PROCHAIN SAUT</small><b>' + U.E(rt.etapes[0].s) + '</b></span><button type="button" class="rm-btn" data-rm-copie="' + U.E(rt.etapes[0].s) + '">COPIER</button></div></div>';
        return h;
    }

    window.EdteamReperageMobile = { monter: monter, ouvrir: ouvrir, fermer: fermer };
})();
