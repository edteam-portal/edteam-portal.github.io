// ANTI-ROBOT (Cloudflare Turnstile) : verification quasi invisible a l'inscription, a la connexion et au « mot de passe oublie ».
// TANT QUE `CLE_SITE` EST VIDE, RIEN NE CHANGE : aucun script charge, aucun jeton envoye. Voici l'ordre a respecter pour l'activer sans bloquer personne :
//   1) creer le widget chez Cloudflare (Turnstile, gratuit), recopier ici la « cle de site » (la cle PUBLIQUE), publier le site ;
//   2) SEULEMENT ENSUITE, dans Supabase > Authentication > Attack Protection : activer « Enable CAPTCHA protection », fournisseur Turnstile, coller la « cle secrete ».
//   Activer Supabase avant que le site envoie les jetons rend toute connexion impossible.
// Sans reseau vers Cloudflare (bloqueur de publicite, pare-feu), le site continue d'essayer sans jeton : Supabase refuse alors, et `message(erreur)` explique quoi faire.
(function () {
    'use strict';
    var CLE_SITE = '';
    var A = window.edteamAntiRobot = { actif: !!CLE_SITE };
    var chargement = null, idWidget = null, zone = null, attente = null;   // attente = la demande de jeton en cours (le widget est reutilise, ses fonctions de retour doivent viser la demande COURANTE)

    function charger() {
        if (chargement) return chargement;
        chargement = new Promise(function (ok, ko) {
            var s = document.createElement('script');
            s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
            s.async = true; s.onload = ok; s.onerror = function () { chargement = null; ko(new Error('script')); };
            document.head.appendChild(s);
            setTimeout(function () { ko(new Error('delai')); }, 10000);
        });
        return chargement;
    }
    function creerZone() {
        if (zone && document.body.contains(zone)) return zone;
        zone = document.createElement('div');
        zone.id = 'antirobot-zone';
        zone.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:20000;';
        document.body.appendChild(zone);
        return zone;
    }

    // Un jeton neuf (a usage unique) ; null si l'anti-robot est inactif ou injoignable.
    A.jeton = function () {
        if (!CLE_SITE) return Promise.resolve(null);
        return charger().then(function () {
            return new Promise(function (resolve) {
                var fini = false;
                function fin(v) { if (!fini) { fini = true; if (attente === fin) attente = null; resolve(v); } }
                attente = fin;
                setTimeout(function () { fin(null); }, 25000);
                var rendre = function (v) { if (attente) attente(v); };
                var options = {
                    sitekey: CLE_SITE, appearance: 'interaction-only', theme: 'dark', language: 'fr',
                    callback: function (t) { rendre(t); },
                    'error-callback': function () { rendre(null); },
                    'timeout-callback': function () { rendre(null); }
                };
                try {
                    if (idWidget === null) idWidget = window.turnstile.render(creerZone(), options);
                    else window.turnstile.reset(idWidget);
                } catch (e) { fin(null); }
            });
        }).catch(function () { return null; });
    };
    // Les options a donner a supabase.auth (signUp, signInWithPassword, resetPasswordForEmail) : { captchaToken } ou rien.
    A.options = function (base) {
        return A.jeton().then(function (t) { var o = Object.assign({}, base || {}); if (t) o.captchaToken = t; return o; });
    };
    // Phrase claire quand Supabase refuse a cause de la verification.
    A.message = function (erreur) {
        var m = String((erreur && erreur.message) || '').toLowerCase();
        if (m.indexOf('captcha') >= 0) return 'Vérification anti-robot impossible. Désactivez votre bloqueur de publicité pour ce site, ou réessayez dans un instant.';
        return null;
    };
})();
