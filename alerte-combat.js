// ALERTE COMBAT : quand le plugin signale qu'un joueur (un CMDR) vient d'etre verrouille, un gros bouton clignotant s'affiche au milieu de la page ou l'on se trouve ;
// un clic ouvre l'onglet Combat du tableau de bord (meme onglet du navigateur). Charge a la demande par footer.js (jamais sur le tableau de bord, qui bascule deja seul sur Combat).
//
// COUT : AUCUNE connexion tant que l'option n'est pas activee. Activee, la page ecoute UNE seule ligne (table alerte_cible, script SQL 130, temps reel) et ne le fait que si :
//   - l'option a ete activee pour la SESSION DE JEU EN COURS (une nouvelle session la desactive : impossible de l'oublier des jours) ;
//   - le jeu est en ligne (la session en direct du plugin a ete mise a jour il y a moins de 7 minutes : une lecture legere, a l'ouverture de la page puis toutes les 10 minutes) ;
//   - l'onglet est visible (onglet cache : la connexion est coupee) ;
//   - un signal est arrive depuis moins de 3 heures (sinon : mise en veille, un clic reactive).
// Pendant l'ecoute, la page demande aussi que l'ecran reste allume (tablette) quand le navigateur le permet.
(function () {
    'use strict';
    if (window.EdteamAlerte) return;
    var CLE = 'edteam_alerte_v1', VEILLE_MS = 3 * 3600 * 1000, CONTROLE_MS = 10 * 60 * 1000, EN_LIGNE_MS = 7 * 60 * 1000, AFFICHAGE_S = 20;
    var etat = { canal: null, minuteur: null, wake: null, msg: '', msgT: null, vue: null };

    function db() { return window.supabaseApp || null; }
    function lire() { try { var o = JSON.parse(localStorage.getItem(CLE) || 'null'); return o && typeof o === 'object' ? o : null; } catch (e) { return null; } }
    function ecrire(o) { try { if (o) localStorage.setItem(CLE, JSON.stringify(o)); else localStorage.removeItem(CLE); } catch (e) { /* stockage indisponible : l'option ne sera pas retenue */ } }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function page() { return /tableau-de-bord/i.test(location.pathname); }

    async function monId() {
        var p = window.profilCommandant; if (p && p.user_id) return p.user_id;
        try { var s = await db().auth.getSession(); return s && s.data && s.data.session && s.data.session.user ? s.data.session.user.id : null; } catch (e) { return null; }
    }
    // lecture legere de la session en direct : { maj_le, debut } (jamais l'etat complet)
    async function session() {
        try { var r = await db().from('session_live').select('maj_le,debut').maybeSingle(); return r && r.data ? r.data : null; } catch (e) { return null; }
    }
    var enLigne = function (s) { return !!s && Date.now() - Date.parse(s.maj_le) < EN_LIGNE_MS; };

    // ---- l'ecran reste allume (tablette) ----
    async function garderEcran() {
        try { if (navigator.wakeLock && !etat.wake && !document.hidden) { etat.wake = await navigator.wakeLock.request('screen'); etat.wake.addEventListener('release', function () { etat.wake = null; }); } } catch (e) { /* non pris en charge ou refuse */ }
    }
    function lacherEcran() { try { if (etat.wake) { etat.wake.release(); etat.wake = null; } } catch (e) { etat.wake = null; } }

    // ---- connexion temps reel ----
    async function ouvrirCanal() {
        if (etat.canal || !db()) return;
        var u = await monId(); if (!u || etat.canal) return;
        etat.canal = db().channel('edteam-alerte-' + u)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'alerte_cible', filter: 'user_id=eq.' + u }, function (p) { if (p && p.new && p.new.nom) afficher(p.new); })
            .subscribe();
        if (!etat.minuteur) etat.minuteur = setInterval(verifier, CONTROLE_MS);
        garderEcran();
    }
    function arreter() {
        if (etat.canal) { try { db().removeChannel(etat.canal); } catch (e) { /* deja ferme */ } etat.canal = null; }
        if (etat.minuteur) { clearInterval(etat.minuteur); etat.minuteur = null; }
        lacherEcran();
    }
    // etat voulu : option activee pour la session en cours, jeu en ligne, onglet visible, pas en veille
    async function verifier() {
        var o = lire();
        if (!o || !o.on) { arreter(); majBouton(); return; }
        if (document.hidden) { arreter(); majBouton(); return; }
        if (Date.now() - (o.derniere || o.depuis || 0) > VEILLE_MS) { o.veille = true; ecrire(o); arreter(); majBouton(); return; }
        if (o.veille) { arreter(); majBouton(); return; }
        var s = await session();
        if (!enLigne(s)) { arreter(); etat.vue = 'attente'; majBouton(); return; }           // jeu hors ligne : l'option est gardee, rien n'ecoute
        if (String(s.debut) !== String(o.debut)) { ecrire(null); arreter(); etat.vue = null; majBouton(); return; }   // nouvelle session de jeu : l'option a expire
        etat.vue = 'actif'; await ouvrirCanal(); majBouton();
    }

    // ---- activation / desactivation (bouton du menu lateral) ----
    async function basculer() {
        var o = lire();
        if (o && o.on && !o.veille) { ecrire(null); arreter(); etat.vue = null; majBouton(); message('Alerte désarmée : vous ne serez plus prévenu quand vous verrouillez un joueur (les scans comptent toujours).', 5000); return; }
        if (!db()) return;
        message('Vérification de votre jeu…', 8000);
        var s = await session();
        if (!enLigne(s)) {
            message('Alerte non armée : EDTEAM ne reçoit aucun signal de votre jeu. Lancez le jeu et EDMC (avec le plugin SYS_EDTEAM à jour), attendez une minute, puis cliquez de nouveau.', 14000);
            return;
        }
        ecrire({ on: true, debut: s.debut == null ? null : String(s.debut), depuis: Date.now(), derniere: Date.now() });
        etat.vue = 'actif'; await ouvrirCanal(); majBouton();
        message('Alerte armée pour cette session de jeu. Jouez normalement : dès que vous verrouillerez un joueur, un cadre clignotant vous préviendra sur cette page.', 7000);
    }
    // message visible a cote du menu (le bouton du pied de page n'existe plus)
    function message(t, ms) {
        var z = document.getElementById('edteam-alerte-msg');
        clearTimeout(etat.msgT);
        if (!t) { if (z) z.remove(); return; }
        if (!z) {
            z = document.createElement('div'); z.id = 'edteam-alerte-msg';
            z.style.cssText = 'position:fixed;left:74px;bottom:96px;z-index:2100;max-width:340px;padding:12px 16px;background:rgba(8,12,14,.97);border:1px solid #00F0FF;border-left:4px solid #00F0FF;color:#dbe7ea;font-size:.82em;line-height:1.5;letter-spacing:.3px;box-shadow:0 0 18px rgba(0,240,255,.25);cursor:pointer';
            z.addEventListener('click', function () { z.remove(); });
            document.body.appendChild(z);
        }
        z.style.borderColor = /non armée/.test(t) ? '#FF9A1F' : '#00F0FF'; z.style.borderLeftColor = z.style.borderColor;
        z.textContent = t;
        etat.msgT = setTimeout(function () { var e = document.getElementById('edteam-alerte-msg'); if (e) e.remove(); }, ms || 6000);
    }
    function etatAlerte() {
        var o = lire();
        if (!o || !o.on) return 'off';
        if (o.veille) return 'veille';
        if (etat.vue === 'attente') return 'attente';
        return 'on';
    }
    var AIDE = { off: 'Alerte à ARMER une fois en début de session de jeu (EDMC et le jeu lancés). Armée, elle vous prévient par un cadre clignotant dès que vous verrouillez un joueur, pour ne pas manquer un scan. Cliquez pour l’armer.',
                 on: 'Alerte armée : quand vous verrouillez un joueur, un cadre clignotant s’affiche sur la page où vous êtes. Cliquez pour la désarmer.',
                 veille: 'Alerte en veille (aucun signal depuis plus de 3 heures) : cliquez pour la réarmer.',
                 attente: 'Alerte armée, mais votre jeu n’envoie plus de signal : lancez EDMC et le jeu. L’alerte repartira toute seule.' };
    function majBouton() {
        var e = etatAlerte();
        [].forEach.call(document.querySelectorAll('[data-alerte-point]'), function (p) { p.className = 'al-pt' + (e === 'on' ? ' on' : e === 'off' ? '' : ' ve'); });
        [].forEach.call(document.querySelectorAll('[data-alerte-menu]'), function (m) { m.classList.toggle('al-off', e === 'off' || e === 'veille'); m.setAttribute('data-alerte-etat', e); m.removeAttribute('title'); });
        [].forEach.call(document.querySelectorAll('[data-alerte-label]'), function (l) { l.textContent = ({ off: 'ALERTE COMBAT · ARMER', on: 'ALERTE COMBAT · ARMÉE', veille: 'ALERTE COMBAT · VEILLE', attente: 'ALERTE · ATTENTE JEU' })[e]; });
    }

    // ---- le bouton d'urgence ----
    function css() {
        if (document.getElementById('alerte-css')) return; var s = document.createElement('style'); s.id = 'alerte-css';
        s.textContent = [
            '.ft-alerte.on { color:#00F0FF; border-color:#00F0FF; box-shadow:0 0 10px rgba(0,240,255,.35); }',
            '#edteam-alerte { position:fixed; left:50%; top:46%; transform:translate(-50%,-50%); z-index:9900; width:min(560px,94vw); cursor:pointer; text-align:center; font-family:inherit; }',
            '#edteam-alerte .al-bt { position:relative; padding:24px 28px 20px; background:linear-gradient(180deg,rgba(0,40,48,.97),rgba(2,10,14,.98)); border:2px solid #00F0FF; color:#cfd8dc;',
            ' clip-path:polygon(0 18px,18px 0,calc(100% - 18px) 0,100% 18px,100% calc(100% - 18px),calc(100% - 18px) 100%,18px 100%,0 calc(100% - 18px)); animation:alPuls 1.1s ease-in-out infinite; overflow:hidden; }',
            '#edteam-alerte .al-bt::after { content:""; position:absolute; inset:0; pointer-events:none; background:linear-gradient(100deg,transparent 35%,rgba(255,255,255,.22) 50%,transparent 65%); background-size:300% 100%; background-position:100% 0; animation:alBalai 2.2s linear infinite; }',
            '@keyframes alPuls { 0%,100% { box-shadow:0 0 18px rgba(0,240,255,.35), inset 0 0 18px rgba(0,240,255,.12); border-color:#00F0FF; } 50% { box-shadow:0 0 46px rgba(255,113,0,.75), inset 0 0 30px rgba(255,113,0,.25); border-color:#FF7100; } }',
            '@keyframes alBalai { 0% { background-position:100% 0; } 100% { background-position:0 0; } }',
            '#edteam-alerte .al-1 { color:#FF7100; letter-spacing:6px; font-size:.85em; } #edteam-alerte .al-2 { color:#fff; font-size:2em; letter-spacing:5px; margin:6px 0 2px; text-shadow:0 0 14px rgba(0,240,255,.7); }',
            '#edteam-alerte .al-3 { color:#7fe9f2; letter-spacing:3px; margin-bottom:8px; overflow-wrap:anywhere; } #edteam-alerte .al-4 { color:#9aa; font-size:.8em; letter-spacing:2px; }',
            '#edteam-alerte .al-cta { margin-top:12px; display:inline-block; border:1px solid #00F0FF; color:#00F0FF; padding:8px 22px; letter-spacing:4px; font-weight:bold; }',
            '#edteam-alerte .al-barre { height:4px; background:#102028; margin-top:14px; } #edteam-alerte .al-barre i { display:block; height:100%; width:100%; background:linear-gradient(90deg,#007a85,#00F0FF); transition:width 1s linear; }',
            '#edteam-alerte .al-x { position:absolute; top:6px; right:10px; z-index:2; background:transparent; border:1px solid #556; color:#9ab; width:28px; height:28px; cursor:pointer; font-family:inherit; clip-path:none; } #edteam-alerte .al-x:hover { color:#fff; border-color:#00F0FF; }',
            '@media (prefers-reduced-motion:reduce) { #edteam-alerte .al-bt, #edteam-alerte .al-bt::after { animation:none; } }'
        ].join('\n');
        document.head.appendChild(s);
    }
    function bip() {
        try {
            var A = window.AudioContext || window.webkitAudioContext; if (!A) return; var c = new A(), t = c.currentTime;
            [[880, 0], [1320, 0.16]].forEach(function (n) { var o = c.createOscillator(), g = c.createGain(); o.type = 'square'; o.frequency.value = n[0]; g.gain.setValueAtTime(0.05, t + n[1]); g.gain.exponentialRampToValueAtTime(0.001, t + n[1] + 0.14); o.connect(g); g.connect(c.destination); o.start(t + n[1]); o.stop(t + n[1] + 0.15); });
            setTimeout(function () { try { c.close(); } catch (e) { /* ferme */ } }, 800);
        } catch (e) { /* le navigateur refuse le son avant un geste de l'utilisateur */ }
    }
    function aller() { location.href = 'tableau-de-bord.html?mode=cmb'; }
    function fermer() { var e = document.getElementById('edteam-alerte'); if (e) { clearInterval(e._tic); e.remove(); } }
    function afficher(l) {
        var o = lire(); if (o && o.on) { o.derniere = Date.now(); o.veille = false; ecrire(o); }
        css(); fermer();
        var detail = [l.vaisseau, l.rang, l.faction].filter(Boolean).map(esc).join(' · '), t0 = Date.now(), restant = AFFICHAGE_S;
        var e = document.createElement('div'); e.id = 'edteam-alerte'; e.setAttribute('role', 'alertdialog'); e.setAttribute('aria-label', 'Joueur verrouillé : ouvrir le combat');
        e.innerHTML = '<div class="al-bt"><button type="button" class="al-x" aria-label="Fermer l’alerte">✕</button><div class="al-1">⚠ ALERTE COMBAT</div><div class="al-2">JOUEUR VERROUILLÉ</div>'
            + '<div class="al-3">CMDR ' + esc(String(l.nom).toUpperCase()) + (l.tag ? ' [' + esc(l.tag) + ']' : '') + (detail ? '<br>' + detail.toUpperCase() : '') + '</div>'
            + '<div class="al-4">il y a <span class="al-s">0</span> s' + (l.stade ? ' · stade de scan ' + esc(l.stade) : '') + '</div><div class="al-cta">OUVRIR LE COMBAT ▸</div><div class="al-barre"><i></i></div></div>';
        e.addEventListener('click', function (ev) { if (ev.target && ev.target.closest && ev.target.closest('.al-x')) { ev.stopPropagation(); fermer(); } else window.EdteamAlerte._aller(); });
        document.body.appendChild(e);
        e._tic = setInterval(function () {
            var s = Math.round((Date.now() - t0) / 1000), r = Math.max(0, AFFICHAGE_S - s), sp = e.querySelector('.al-s'), b = e.querySelector('.al-barre i');
            if (sp) sp.textContent = s; if (b) b.style.width = Math.round(100 * r / AFFICHAGE_S) + '%'; if (r <= 0) fermer();
        }, 1000);
        bip();
    }

    document.addEventListener('visibilitychange', function () { var o = lire(); if (o && o.on && db()) verifier(); });
    window.EdteamAlerte = {
        basculer: basculer, verifier: verifier, majBouton: majBouton, afficher: afficher, fermer: fermer, _aller: aller,
        etat: function () { return { canal: !!etat.canal, vue: etat.vue, option: lire() }; }
    };
    if (!page()) { css(); majBouton(); var essais = 0, att = setInterval(function () { essais++; if (db()) { clearInterval(att); verifier(); } else if (essais > 40) clearInterval(att); }, 250); }
})();
