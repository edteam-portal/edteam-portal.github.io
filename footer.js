// Pied de page commun SYS.EDTEAM (presentation + pages de l'application) + fenetre "Compagnon mobile" + astuce discrete.
// Autonome : aucune dependance (ni Supabase, ni navigation.js). Une seule source a modifier pour toutes les pages.
// - Pages de l'application (presence de #main-ui) : bandeau fixe dans la bande libre sous le conteneur (5 % de la hauteur),
//   il ne prend donc aucune place sur le contenu. Le corps de ces pages ne defile pas : c'est une coque a hauteur d'ecran.
// - Presentation : pied de page en fin de page, dans le flux.
(function () {
    'use strict';
    if (window.__edteamFooter) return;
    window.__edteamFooter = true;

    var DISCORD_URL = 'https://discord.gg/max5W9FreN';
    var MOBILE_URL = 'mobile.html';
    var SVG_DISCORD = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>';
    var SVG_AIDE = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    var SVG_TEL = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/></svg>';

    var CSS = ''
        + '.ft-edteam{font-family:"Share Tech Mono",monospace;color:#666;text-align:center;letter-spacing:1px;box-sizing:border-box}'
        + '.ft-edteam .ft-ligne{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;font-size:.72rem}'
        + '.ft-edteam .ft-legal{font-size:.6rem;letter-spacing:1px;color:#555;margin-top:2px;line-height:1.3}'
        + '.ft-btn{display:inline-flex;align-items:center;gap:6px;cursor:pointer;text-decoration:none;font-family:inherit;font-size:1em;font-weight:bold;letter-spacing:1.5px;padding:3px 10px;border-radius:3px;transition:.2s;line-height:1.3}'
        + '.ft-discord{color:#fff;background:#5865F2;border:1px solid #5865F2;box-shadow:0 0 10px rgba(88,101,242,.45)}'
        + '.ft-discord:hover{background:#6f7bf7;box-shadow:0 0 16px rgba(88,101,242,.8)}'
        + '.ft-aide{color:var(--ed-orange,#FF7100);background:rgba(255,113,0,.06);border:1px solid rgba(255,113,0,.5)}'
        + '.ft-aide:hover{background:rgba(255,113,0,.18);box-shadow:0 0 12px rgba(255,113,0,.5);color:#fff}'
        + '.ft-son{padding:3px 8px;color:#999;background:transparent;border:1px solid #444}'
        + '.ft-son:hover{color:var(--ed-blue,#00F0FF);border-color:var(--ed-blue,#00F0FF)}'
        + '.ft-nouv{position:relative;color:#FFD700;background:rgba(255,215,0,.05);border:1px solid rgba(255,215,0,.45)}'
        + '.ft-nouv:hover{background:rgba(255,215,0,.16);box-shadow:0 0 12px rgba(255,215,0,.45);color:#fff}'
        + '.ft-point{width:8px;height:8px;border-radius:50%;background:#FF7100;box-shadow:0 0 8px #FF7100;position:absolute;top:-3px;right:-3px}'
        + '.ft-astuce.ft-haut{bottom:170px}'
        + '.ft-mobile{color:var(--ed-blue,#00F0FF);background:rgba(0,240,255,.06);border:1px solid rgba(0,240,255,.5)}'
        + '.ft-mobile:hover{background:rgba(0,240,255,.18);box-shadow:0 0 12px rgba(0,240,255,.5);color:#fff}'
        /* pages de l\'application : bandeau fixe dans la bande libre du bas (le conteneur fait 95vh) */
        + '.ft-fixe{position:fixed;left:60px;right:0;bottom:0;z-index:900;padding:3px 20px 4px;background:linear-gradient(rgba(0,0,0,0),rgba(0,0,0,.9) 35%)}'
        + 'body.menu-open .ft-fixe{left:250px}'
        /* presentation : pied de page en fin de page */
        + '.ft-flux{background:#000;padding:50px 20px}'
        + '.ft-flux .ft-ligne{font-size:.9rem;letter-spacing:3px;gap:16px}'
        + '.ft-flux .ft-legal{font-size:.75rem;margin-top:12px}'
        + '@media (max-width:1100px){.ft-fixe .ft-titre{display:none}}'
        /* fenetre du compagnon mobile */
        + '.ft-overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(4px);display:none;justify-content:center;align-items:center;z-index:6000;padding:15px;box-sizing:border-box}'
        + '.ft-modal{position:relative;max-width:440px;width:100%;background:rgba(5,8,12,.98);border:1px solid var(--ed-blue,#00F0FF);box-shadow:0 0 40px rgba(0,240,255,.2);padding:26px 28px;border-radius:4px;color:#ccc;font-family:"Share Tech Mono",monospace;text-align:center;box-sizing:border-box;max-height:92vh;overflow-y:auto}'
        + '.ft-modal h3{margin:0 0 12px;color:var(--ed-blue,#00F0FF);letter-spacing:3px;font-size:1.15rem}'
        + '.ft-modal p{margin:0 0 14px;line-height:1.6;font-size:.9rem}'
        + '.ft-modal .ft-qr{display:inline-block;background:#fff;padding:8px;border-radius:6px;margin:4px 0 14px}'
        + '.ft-modal .ft-qr img{display:block;width:190px;height:190px}'
        + '.ft-x{position:absolute;top:12px;right:16px;color:var(--ed-blue,#00F0FF);cursor:pointer;font-weight:bold;font-size:1.2rem}'
        + '.ft-x:hover{color:#fff}'
        /* astuce discrete */
        + '.ft-astuce{position:fixed;right:18px;bottom:58px;width:300px;z-index:950;background:rgba(5,8,12,.96);border:1px solid rgba(0,240,255,.45);border-left:3px solid var(--ed-blue,#00F0FF);border-radius:4px;padding:12px 14px;color:#ccc;font-family:"Share Tech Mono",monospace;font-size:.8rem;line-height:1.5;box-shadow:0 6px 24px rgba(0,0,0,.7);opacity:0;transform:translateY(8px);transition:opacity .4s,transform .4s;box-sizing:border-box}'
        + '.ft-astuce.ft-vu{opacity:1;transform:none}'
        + '.ft-astuce b{color:var(--ed-blue,#00F0FF);letter-spacing:1px}'
        + '.ft-astuce .ft-acts{display:flex;gap:8px;margin-top:8px;align-items:center}'
        + '.ft-astuce .ft-acts button{font-family:inherit;font-size:.9em;cursor:pointer;border-radius:3px;padding:3px 10px;letter-spacing:1px;font-weight:bold}'
        + '.ft-astuce .ft-voir{color:var(--ed-blue,#00F0FF);background:rgba(0,240,255,.08);border:1px solid rgba(0,240,255,.5)}'
        + '.ft-astuce .ft-non{color:#888;background:transparent;border:1px solid #444}'
        + '.ft-astuce .ft-non:hover{color:#fff;border-color:#888}';

    function el(tag, attrs, html) {
        var e = document.createElement(tag);
        if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
        if (html) e.innerHTML = html;
        return e;
    }

    function fermerMobile() {
        var o = document.getElementById('ft-mobile-overlay');
        if (o) o.style.display = 'none';
    }
    // L'aide (FAQ) est chargee a la premiere ouverture seulement : aide.js
    window.edteamOuvrirAide = function (section) {
        if (window.edteamAide) { window.edteamAide.ouvrir(section); return; }
        var s = document.createElement('script');
        s.src = 'aide.js?v=2';
        s.onload = function () { if (window.edteamAide) window.edteamAide.ouvrir(section); };
        document.head.appendChild(s);
    };
    // ---- Nouveautes : point discret sur le bouton, panneau charge a la demande (nouveautes.js), carte pour les entrees "importantes" ----
    var CLE_VU = 'edteam_nouv_vu';
    function dansApp() { return !!document.getElementById('main-ui'); }
    function urlDonnees() { return 'nouveautes-data.js?h=' + Math.floor(Date.now() / 3600000); }   // recharge au plus une fois par heure
    function charger(src, cb) {
        var s = document.createElement('script');
        s.src = src;
        s.onload = function () { if (cb) cb(); };
        s.onerror = function () { /* fichier absent (page hors ligne) : on n'affiche simplement rien */ };
        document.head.appendChild(s);
    }
    function entreesNouv() {
        var l = Array.isArray(window.EDTEAM_NOUVEAUTES) ? window.EDTEAM_NOUVEAUTES.slice() : [];
        return l.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
    }
    // Non lues = plus recentes que la derniere lecture ; sans lecture memorisee : celles des 14 derniers jours
    function nonLues() {
        var vu = null;
        try { vu = localStorage.getItem(CLE_VU); } catch (e) { /* stockage indisponible */ }
        var seuil = vu || new Date(Date.now() - 14 * 86400000).toISOString();
        return entreesNouv().filter(function (e) { return e.date > seuil; });
    }
    window.edteamMajPointNouveautes = function () {
        var pt = document.querySelector('.ft-nouv .ft-point');
        if (!pt) return;
        var n = dansApp() ? nonLues().length : 0;
        pt.style.display = n ? 'inline-block' : 'none';
        pt.parentNode.title = n ? n + (n > 1 ? ' nouveautés non lues' : ' nouveauté non lue') : 'Nouveautés';
    };
    window.edteamOuvrirNouveautes = function () {
        function lancer() {
            if (window.edteamNouveautes) { window.edteamNouveautes.ouvrir(); return; }
            charger('nouveautes.js?v=1', function () { if (window.edteamNouveautes) window.edteamNouveautes.ouvrir(); });
        }
        if (window.EDTEAM_NOUVEAUTES) lancer(); else charger(urlDonnees(), lancer);
    };
    // Petite carte discrete, seulement pour une entree marquee "important" et non lue, une seule fois par entree (appelee par l'accueil)
    window.edteamCarteNouveautes = function () {
        function afficher() {
            try {
                var e = nonLues().filter(function (x) { return x.important; })[0];
                if (!e || window.innerWidth < 900) return;
                if (localStorage.getItem('edteam_nouv_carte') === e.id) return;
                localStorage.setItem('edteam_nouv_carte', e.id);
                setTimeout(function () {
                    var c = el('div', { class: 'ft-astuce ft-haut', role: 'status' },
                        '<b>NOUVEAUTÉ IMPORTANTE</b><br>' + String(e.titre).replace(/</g, '&lt;')
                        + (e.action ? '<br><span style="color:#FFD700">▶ ' + String(e.action).replace(/</g, '&lt;') + '</span>' : '')
                        + '<div class="ft-acts"><button type="button" class="ft-voir">VOIR</button><button type="button" class="ft-non">FERMER</button></div>');
                    function retirer() { c.classList.remove('ft-vu'); setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 500); }
                    c.querySelector('.ft-voir').addEventListener('click', function () { retirer(); window.edteamOuvrirNouveautes(); });
                    c.querySelector('.ft-non').addEventListener('click', retirer);
                    document.body.appendChild(c);
                    setTimeout(function () { c.classList.add('ft-vu'); }, 30);
                    setTimeout(retirer, 20000);
                }, 7000);
            } catch (err) { /* rien */ }
        }
        if (window.EDTEAM_NOUVEAUTES) afficher(); else charger(urlDonnees(), afficher);
    };

    window.edteamOuvrirMobile = function () {
        var o = document.getElementById('ft-mobile-overlay');
        if (o) o.style.display = 'flex';
    };

    function monter() {
        var st = el('style', null, ''); st.textContent = CSS; document.head.appendChild(st);

        var enApp = !!document.getElementById('main-ui');
        var pied = document.getElementById('footer-edteam');
        if (!pied) { pied = el('footer', { id: 'footer-edteam' }); document.body.appendChild(pied); }
        pied.className = 'ft-edteam ' + (enApp ? 'ft-fixe' : 'ft-flux');
        pied.innerHTML = ''
            + '<div class="ft-ligne">'
            +   '<span class="ft-titre">SYS.EDTEAM // APPLICATION DE FAN POUR ELITE DANGEROUS</span>'
            +   '<a class="ft-btn ft-discord" href="' + DISCORD_URL + '" target="_blank" rel="noopener">' + SVG_DISCORD + 'REJOINDRE LE DISCORD</a>'
            +   '<button type="button" class="ft-btn ft-aide" onclick="edteamOuvrirAide()">' + SVG_AIDE + 'AIDE / FAQ</button>'
            +   '<button type="button" class="ft-btn ft-nouv" onclick="edteamOuvrirNouveautes()" title="Nouveautés">NOUVEAUTÉS<span class="ft-point" style="display:none"></span></button>'
            +   '<button type="button" class="ft-btn ft-son" data-son-toggle></button>'
            +   '<button type="button" class="ft-btn ft-mobile" onclick="edteamOuvrirMobile()">' + SVG_TEL + 'COMPAGNON MOBILE</button>'
            + '</div>'
            + '<div class="ft-legal">© 2026 EDTEAM — Tous droits réservés. Toute reproduction ou réutilisation du code sans autorisation est interdite.</div>';

        if (window.edteamSon) window.edteamSon.majUI();
        if (dansApp()) charger(urlDonnees(), function () { window.edteamMajPointNouveautes(); });

        // Fenetre du compagnon mobile
        var ov = el('div', { id: 'ft-mobile-overlay', class: 'ft-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Compagnon mobile' });
        ov.innerHTML = ''
            + '<div class="ft-modal">'
            +   '<div class="ft-x" title="Fermer">X</div>'
            +   '<h3>' + SVG_TEL + ' COMPAGNON MOBILE</h3>'
            +   '<p>Le commandement dans la poche : consultez les directives BGS de votre escadron, le statut de votre flotte et vos communications depuis votre téléphone.</p>'
            +   '<div class="ft-qr"><img src="images/qr-mobile.png" alt="QR code pour ouvrir le compagnon mobile" width="190" height="190"></div>'
            +   '<p style="font-size:.8rem;color:#999;">Scannez le code avec votre téléphone, ou ouvrez <strong style="color:#fff;">edteam-portal.github.io/mobile.html</strong>, puis connectez-vous avec le même compte. Vous pouvez l\'ajouter à l\'écran d\'accueil pour l\'ouvrir comme une application.</p>'
            +   '<a class="ft-btn ft-mobile" href="' + MOBILE_URL + '">OUVRIR LA VERSION MOBILE ICI</a>'
            + '</div>';
        ov.addEventListener('click', function (e) { if (e.target === ov) fermerMobile(); });
        ov.querySelector('.ft-x').addEventListener('click', fermerMobile);
        document.body.appendChild(ov);
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fermerMobile(); });
    }

    // Astuce discrete (a appeler une fois le profil charge, sur l'accueil) : une petite carte, pas une fenetre.
    // Ordinateur uniquement ; reapparait au plus une fois tous les 45 jours ; se referme seule apres 20 s.
    window.edteamAstuceMobile = function () {
        try {
            if (window.innerWidth < 900) return;
            var cle = 'edteam_astuce_mobile';
            var derniere = parseInt(localStorage.getItem(cle) || '0', 10);
            if (derniere && Date.now() - derniere < 45 * 86400000) return;
            localStorage.setItem(cle, String(Date.now()));
            setTimeout(function () {
                var c = el('div', { class: 'ft-astuce', role: 'status' },
                    '<b>LE SAVIEZ-VOUS ?</b><br>Retrouvez vos directives, vos messages et votre rang sur votre téléphone avec le compagnon mobile.'
                    + '<div class="ft-acts"><button type="button" class="ft-voir">VOIR</button><button type="button" class="ft-non">FERMER</button></div>');
                function retirer() { c.classList.remove('ft-vu'); setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 500); }
                c.querySelector('.ft-voir').addEventListener('click', function () { retirer(); window.edteamOuvrirMobile(); });
                c.querySelector('.ft-non').addEventListener('click', retirer);
                document.body.appendChild(c);
                setTimeout(function () { c.classList.add('ft-vu'); }, 30);
                setTimeout(retirer, 20000);
            }, 5000);
        } catch (e) { /* stockage indisponible : on n'affiche rien */ }
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', monter);
    else monter();
})();
