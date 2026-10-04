// ==========================================
// MESURE D'AUDIENCE (Google Analytics 4) AVEC CONSENTEMENT
// Rien n'est chargé ni envoyé tant que le visiteur n'a pas cliqué « Accepter ». Le choix est gardé dans ce navigateur (localStorage)
// et peut être changé à tout moment via le bouton « COOKIES » du pied de page.
// Utilisé par : presentation.html (directement), les pages PC (via navigation.js) et mobile.html.
// Options avant chargement : window.EDTEAM_GA_OPTIONS = { send_page_view: false } (mobile : les « pages vues » sont envoyées par onglet).
// Événement émis quand GA est prêt : « edteam-ga-pret ». Envoi d'un événement : tracerAction('nom', { ... }).
// ==========================================
(function () {
    if (window.EdAnalytics) return;
    var GA_ID = 'G-26FQZ7SDX4';
    var CLE = 'edteam_ga_consent';   // 'oui' | 'non' | absent = pas encore choisi
    var charge = false;

    function lire() { try { return localStorage.getItem(CLE); } catch (e) { return null; } }
    function ecrire(v) { try { localStorage.setItem(CLE, v); } catch (e) {} }

    function charger() {
        if (charge) return;
        charge = true;
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        // la racine « / » et « /index.html » sont la même page : on les déclare sous un seul chemin pour qu'Analytics ne les sépare pas
        var emplacement = window.location.href;
        if (window.location.pathname === '/') emplacement = window.location.origin + '/index.html' + window.location.search + window.location.hash;
        var cfg = { anonymize_ip: true, page_title: document.title, page_location: emplacement };
        var opts = window.EDTEAM_GA_OPTIONS || {};
        Object.keys(opts).forEach(function (k) { cfg[k] = opts[k]; });
        // Visiteur aiguillé depuis la racine du site vers la présentation : on garde sa vraie source (Google, Discord...) au lieu de « notre propre site »
        try {
            var ref = sessionStorage.getItem('edteam_ref');
            if (ref !== null) { cfg.page_referrer = ref; sessionStorage.removeItem('edteam_ref'); }
        } catch (e) {}
        window.gtag('config', GA_ID, cfg);
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
        document.head.appendChild(s);
        try { window.dispatchEvent(new Event('edteam-ga-pret')); } catch (e) {}
    }

    function retirerBandeau() { var b = document.getElementById('edteam-cookies'); if (b && b.parentNode) b.parentNode.removeChild(b); }

    function choisir(v) {
        ecrire(v);
        retirerBandeau();
        if (v === 'oui') charger();
        else if (charge) { try { window['ga-disable-' + GA_ID] = true; } catch (e) {} }   // refus après acceptation : on arrête d'envoyer
    }

    function afficherBandeau() {
        if (document.getElementById('edteam-cookies') || !document.body) return;
        var b = document.createElement('div');
        b.id = 'edteam-cookies';
        b.setAttribute('role', 'dialog');
        b.setAttribute('aria-label', "Mesure d'audience");
        b.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:2147483000;background:rgba(10,5,0,.97);border-top:2px solid #FF7100;box-shadow:0 -6px 30px rgba(0,0,0,.7);padding:14px 18px calc(14px + env(safe-area-inset-bottom));display:flex;gap:14px 22px;align-items:center;justify-content:center;flex-wrap:wrap;font-family:"Share Tech Mono",monospace;color:#ddd;font-size:13px;line-height:1.5';
        b.innerHTML = '<span style="max-width:760px;text-align:left"><b style="color:#FF7100;letter-spacing:2px">MESURE D\'AUDIENCE</b><br>Ce site utilise Google Analytics pour compter les visites (cookies, adresse IP anonymisée), sans aucune donnée de votre compte. Acceptez-vous ? Vous pouvez changer d\'avis à tout moment (bouton « COOKIES » en bas de page, ou les réglages sur mobile).</span>'
            + '<span style="display:flex;gap:10px;flex-shrink:0">'
            + '<button type="button" id="edteam-cookies-oui" style="background:#FF7100;color:#000;border:1px solid #FF7100;padding:9px 18px;font:inherit;font-weight:bold;letter-spacing:2px;cursor:pointer">ACCEPTER</button>'
            + '<button type="button" id="edteam-cookies-non" style="background:transparent;color:#bbb;border:1px solid #666;padding:9px 18px;font:inherit;letter-spacing:2px;cursor:pointer">REFUSER</button>'
            + '</span>';
        document.body.appendChild(b);
        document.getElementById('edteam-cookies-oui').onclick = function () { choisir('oui'); };
        document.getElementById('edteam-cookies-non').onclick = function () { choisir('non'); };
    }

    function demarrer() {
        var c = lire();
        if (c === 'oui') charger();
        else if (c !== 'non') afficherBandeau();
    }

    window.EdAnalytics = {
        consentement: lire,
        reouvrir: function () { retirerBandeau(); afficherBandeau(); }
    };
    // Relais pour tracer des événements personnalisés (sans effet tant que GA n'est pas chargé)
    window.tracerAction = function (nom, parametres) {
        if (typeof window.gtag === 'function' && lire() === 'oui') window.gtag('event', nom, parametres || {});
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
    else demarrer();
})();
