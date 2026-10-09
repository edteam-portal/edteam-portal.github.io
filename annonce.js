// ANNONCES MAJEURES : une fenetre plein ecran, montree UNE SEULE FOIS a chaque pilote (sur chaque appareil) quand une grande fonction arrive.
// Partage par index.html (QG) et mobile.html. Comme les medailles : on s'en souvient dans le navigateur, par pilote (cle edteam_annonce_vue_<id du pilote>).
// Pour une prochaine annonce : ajouter une entree dans ANNONCES (id unique) ; les pilotes qui ont deja vu les autres la verront une fois.
// Une annonce est reservee aux membres approuves d'un escadron (les initiatives n'ont aucun sens sans escadron). Elle ne s'ouvre pas si une autre fenetre plein ecran est deja la.
(function () {
    'use strict';
    var PREFIXE = 'edteam_annonce_vue_';
    var ANNONCES = [
        {
            id: 'initiatives-2026-10',
            couleur: '#FF4FD8',
            etiquette: '★ NOUVEAUTÉ MAJEURE',
            titre: 'CHAQUE PILOTE DEVIENT ACTEUR DE LA STRATÉGIE',
            sous: 'Les initiatives : lancez vos propres objectifs BGS',
            intro: 'Jusqu’ici, seuls l’Amiral et les officiers choisissaient les cibles de l’escadron. <b>Désormais, vous aussi.</b> Un objectif vous tient à cœur ? Lancez-le : l’escadron le voit et vous rejoint.',
            etapes: [
                { n: '1', t: 'VOUS LANCEZ', d: 'Un système, une faction, hausse ou baisse, et un petit mot pour motiver vos camarades.' },
                { n: '2', t: 'L’ESCADRON SUIT', d: 'Votre initiative s’affiche à côté des directives de l’Amiral, avec votre nom et celui des pilotes qui y participent.' },
                { n: '3', t: 'VOUS ÊTES RECONNU', d: 'Chaque effort rapporte comme pour une directive, l’annonce est faite dans le journal de l’escadron, et l’Amiral peut la transformer en directive officielle.' }
            ],
            cta: 'DÉCOUVRIR LES INITIATIVES',
            aide: 'Page BGS, bouton « + Lancer une initiative »'
        }
    ];

    function lire(uid) { try { var v = JSON.parse(localStorage.getItem(PREFIXE + uid) || 'null'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
    function ecrire(uid, liste) { try { localStorage.setItem(PREFIXE + uid, JSON.stringify(liste.slice(-50))); } catch (e) { /* stockage indisponible : elle pourra se rejouer, sans consequence */ } }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

    function css() {
        if (document.getElementById('edteam-annonce-css')) return;
        var st = document.createElement('style');
        st.id = 'edteam-annonce-css';
        st.textContent = [
            '#edteam-annonce{position:fixed;inset:0;z-index:9700;display:flex;align-items:center;justify-content:center;padding:16px;background:radial-gradient(circle at 50% 40%,rgba(255,79,216,.16),rgba(0,0,0,.94) 62%);backdrop-filter:blur(5px);overflow-y:auto;animation:ancFond .5s ease-out}',
            '#edteam-annonce .anc-boite{position:relative;width:min(96vw,760px);max-height:94vh;overflow-y:auto;box-sizing:border-box;text-align:center;padding:28px 30px 24px;background:rgba(10,4,9,.97);border:1px solid var(--anc,#FF4FD8);box-shadow:0 0 50px rgba(255,79,216,.28),inset 0 0 40px rgba(255,79,216,.05);animation:ancEntree .6s cubic-bezier(.2,.8,.2,1)}',
            '#edteam-annonce .anc-eti{display:inline-block;border:1px solid var(--anc);color:var(--anc);background:rgba(255,79,216,.1);padding:4px 16px;letter-spacing:4px;font-weight:bold;font-size:.8em;text-shadow:0 0 10px rgba(255,79,216,.5)}',
            '#edteam-annonce .anc-titre{margin:16px 0 6px;color:#fff;font-size:1.65em;font-weight:bold;letter-spacing:3px;line-height:1.25;text-shadow:0 0 18px rgba(255,79,216,.55)}',
            '#edteam-annonce .anc-sous{color:var(--anc);letter-spacing:2px;font-size:.95em}',
            '#edteam-annonce .anc-intro{margin:16px auto 0;max-width:600px;color:#cfd3d8;line-height:1.6;font-size:.95em}',
            '#edteam-annonce .anc-intro b{color:#fff}',
            '#edteam-annonce .anc-etapes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:22px 0 0;text-align:left}',
            '#edteam-annonce .anc-etape{border:1px dashed rgba(255,79,216,.55);background:rgba(255,79,216,.05);padding:12px 13px;border-radius:3px}',
            '#edteam-annonce .anc-n{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;border:1px solid var(--anc);color:var(--anc);font-weight:bold;font-size:.9em}',
            '#edteam-annonce .anc-et{margin-top:8px;color:#fff;font-weight:bold;letter-spacing:2px;font-size:.82em}',
            '#edteam-annonce .anc-ed{margin-top:6px;color:#aab;font-size:.8em;line-height:1.5}',
            '#edteam-annonce .anc-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:24px}',
            '#edteam-annonce .anc-btn{background:rgba(255,79,216,.12);border:1px solid var(--anc);color:var(--anc);padding:12px 26px;font-family:inherit;font-size:1em;font-weight:bold;letter-spacing:2px;cursor:pointer;transition:.2s}',
            '#edteam-annonce .anc-btn:hover{background:var(--anc);color:#000;box-shadow:0 0 22px var(--anc)}',
            '#edteam-annonce .anc-btn.gris{background:transparent;border-color:#555;color:#aaa}',
            '#edteam-annonce .anc-btn.gris:hover{background:#aaa;color:#000;box-shadow:none}',
            '#edteam-annonce .anc-aide{margin-top:12px;color:#777;font-size:.75em;letter-spacing:1px}',
            '@keyframes ancFond{from{opacity:0}to{opacity:1}}',
            '@keyframes ancEntree{from{opacity:0;transform:translateY(18px) scale(.94)}to{opacity:1;transform:none}}',
            '@media (max-width:640px){#edteam-annonce{align-items:flex-start}#edteam-annonce .anc-boite{padding:16px 14px 14px}#edteam-annonce .anc-eti{letter-spacing:2px;font-size:.7em;padding:3px 10px}#edteam-annonce .anc-titre{font-size:1.1em;letter-spacing:1.5px;margin:12px 0 4px}#edteam-annonce .anc-sous{font-size:.8em;letter-spacing:1px}#edteam-annonce .anc-intro{font-size:.82em;margin-top:10px;line-height:1.5}#edteam-annonce .anc-etapes{grid-template-columns:minmax(0,1fr);gap:8px;margin-top:14px}#edteam-annonce .anc-etape{display:grid;grid-template-columns:28px minmax(0,1fr);column-gap:10px;padding:8px 10px}#edteam-annonce .anc-n{grid-row:1/3}#edteam-annonce .anc-et{margin-top:0;font-size:.76em}#edteam-annonce .anc-ed{margin-top:3px;font-size:.74em;line-height:1.4}#edteam-annonce .anc-actions{margin-top:14px;gap:8px}#edteam-annonce .anc-btn{width:100%;padding:11px 10px;font-size:.9em}#edteam-annonce .anc-aide{margin-top:8px;font-size:.68em}}',
            '@media (prefers-reduced-motion:reduce){#edteam-annonce,#edteam-annonce .anc-boite{animation:none}}'
        ].join('\n');
        document.head.appendChild(st);
    }

    function monter(a, uid, aller) {
        css();
        var ov = document.createElement('div');
        ov.id = 'edteam-annonce';
        ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', a.titre);
        ov.style.setProperty('--anc', a.couleur);
        ov.innerHTML = '<div class="anc-boite">'
            + '<span class="anc-eti">' + esc(a.etiquette) + '</span>'
            + '<div class="anc-titre">' + esc(a.titre) + '</div>'
            + '<div class="anc-sous">' + esc(a.sous) + '</div>'
            + '<div class="anc-intro">' + a.intro + '</div>'
            + '<div class="anc-etapes">' + a.etapes.map(function (e) { return '<div class="anc-etape"><span class="anc-n">' + esc(e.n) + '</span><div class="anc-et">' + esc(e.t) + '</div><div class="anc-ed">' + esc(e.d) + '</div></div>'; }).join('') + '</div>'
            + '<div class="anc-actions"><button type="button" class="anc-btn" data-a="go">' + esc(a.cta) + '</button><button type="button" class="anc-btn gris" data-a="fermer">J’AI COMPRIS</button></div>'
            + '<div class="anc-aide">' + esc(a.aide) + '</div></div>';
        function fermer(vaVoir) {
            var vues = lire(uid); if (vues.indexOf(a.id) < 0) vues.push(a.id); ecrire(uid, vues);
            document.removeEventListener('keydown', clavier);
            if (ov.parentNode) ov.parentNode.removeChild(ov);
            if (vaVoir && typeof aller === 'function') aller();
        }
        function clavier(e) { if (e.key === 'Escape') fermer(false); }
        ov.querySelector('[data-a="go"]').addEventListener('click', function () { fermer(true); });
        ov.querySelector('[data-a="fermer"]').addEventListener('click', function () { fermer(false); });
        document.addEventListener('keydown', clavier);
        document.body.appendChild(ov);
    }

    window.edteamAnnonce = {
        // profil : la ligne du pilote connecte (user_id, escadron_id, est_approuve) ; opts.aller : que faire au clic sur le bouton principal ; opts.delai : attente avant l'affichage (ms)
        proposer: function (profil, opts) {
            try {
                opts = opts || {};
                if (!profil || !profil.user_id || profil.est_approuve === false) return;
                var esc_ = String(profil.escadron_id || '').trim().toUpperCase();
                if (!esc_ || esc_ === 'INDEPENDANT') return;
                var vues = lire(profil.user_id);
                var a = ANNONCES.filter(function (x) { return vues.indexOf(x.id) < 0; })[0];
                if (!a) return;
                setTimeout(function () {
                    if (document.getElementById('edteam-annonce') || document.getElementById('edteam-revel')) return;
                    monter(a, profil.user_id, opts.aller);
                }, typeof opts.delai === 'number' ? opts.delai : 1800);
            } catch (e) { /* une annonce ne doit jamais gener la page */ }
        },
        // pour les tests : oublie ce que ce pilote a vu
        oublier: function (uid) { try { localStorage.removeItem(PREFIXE + uid); } catch (e) { /* rien */ } }
    };
})();
