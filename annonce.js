// ANNONCES MAJEURES : une fenetre plein ecran, montree UNE SEULE FOIS a chaque pilote (sur chaque appareil) quand une grande fonction arrive.
// Partage par index.html (QG) et mobile.html. Comme les medailles : on s'en souvient dans le navigateur, par pilote (cle edteam_annonce_vue_<id du pilote>).
// Pour une prochaine annonce : ajouter une entree dans ANNONCES (id unique) ; les pilotes qui ont deja vu les autres la verront une fois.
// Une annonce est reservee aux membres approuves d'un escadron (les initiatives n'ont aucun sens sans escadron), sauf `escadron: false` ; `mobile: false` la cache sur mobile.html ; `lien` : page ouverte par le bouton principal ; `colonnes`, `avis` : mise en page. Elle ne s'ouvre pas si une autre fenetre plein ecran est deja la.
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
        },
        {
            id: 'tableau-de-bord-2026-10',
            couleur: '#00F0FF',
            etiquette: '★ MISE À JOUR MAJEURE',
            titre: 'LE TABLEAU DE BORD EN JEU',
            sous: 'Votre second écran, alimenté en direct par le plugin',
            intro: 'Pendant que vous jouez, gardez cette page ouverte sur votre second écran ou une tablette : <b>elle suit votre session en direct</b>, sans rien saisir. Votre soute, vos achats et ventes, vos missions, et le meilleur moyen de gagner des crédits.',
            colonnes: 2,
            etapes: [
                { n: '1', t: 'VOTRE SESSION EN DIRECT', d: 'Soute, crédits gagnés depuis le lancement du jeu, registre de vos dernières ventes et achats avec le bénéfice de chacun.' },
                { n: '2', t: 'FEUILLE DE ROUTE', d: 'Une tournée de plusieurs étapes calculée autour de vous, ou la meilleure route pour votre porte-vaisseaux. Un clic sur un nom de système ou de station le copie.' },
                { n: '3', t: 'QUOI VENDRE, OÙ ?', d: 'Des marchandises dont vous ne savez que faire (boîtes noires, capsules…) ? La page cherche où elles se vendent le mieux.' },
                { n: '4', t: 'MISSIONS', d: 'Vos missions en cours, l’ordre de passage le plus court, et l’effet des missions terminées sur la réputation et l’influence de chaque faction.' }
            ],
            avis: '<b>Plugin mis à jour (v2.14)</b> : il se met à jour tout seul au démarrage d’EDMC. <b>Relancez EDMC une fois</b> pour que le tableau de bord se remplisse. Vos données ne sont visibles que de vous.',
            cta: 'OUVRIR LE TABLEAU DE BORD',
            aide: 'Menu du haut : TABLEAU DE BORD · à utiliser sur PC ou tablette',
            lien: 'tableau-de-bord.html',
            escadron: false,
            mobile: false
        },
        {
            id: 'minage-2026-10',
            couleur: '#FF9A1F',
            etiquette: '★ NOUVEAU MODULE',
            titre: 'LE MINAGE ENTRE DANS LE TABLEAU DE BORD',
            sous: 'Rhino au sol ou vaisseau : choisissez, minez, transférez, vendez',
            intro: 'Un nouvel onglet <b>Minage</b> accompagne vos sessions, <b>sans rien saisir</b> sauf les matériaux que le jeu vous affiche. Il vous dit où atterrir, ce qui rapporte le plus, et suit votre Rhino et votre soute <b>en hologramme</b>, avec une flèche qui s’anime quand il est temps de transférer.',
            colonnes: 3,
            etapes: [
                { n: '1', t: 'OÙ SE POSER', d: 'Les planètes du système où atterrir (nature du sol, gravité) avec leurs emplacements d’extraction une fois scannés. En vaisseau : les anneaux et leurs points chauds.' },
                { n: '2', t: 'QUOI MINER ?', d: 'Après le scan, cochez les matériaux affichés dans le jeu : le tableau compare leur prix dans ce système (pour le Powerplay) et ailleurs, avec la valeur d’une soute pleine.' },
                { n: '3', t: 'MINER ET TRANSFÉRER', d: 'Rythme, durée, soute du Rhino et du vaisseau avec leur valeur estimée, tintements à chaque arrivage et petit air quand le transfert est terminé.' }
            ],
            avis: '<b>Plugin mis à jour (v2.20)</b> : il se met à jour tout seul au démarrage d’EDMC, <b>relancez EDMC une fois</b>. Les prix viennent des relevés des joueurs (Spansh) : ils peuvent avoir quelques heures de retard, vérifiez-les en jeu. Vos données ne sont visibles que de vous.',
            cta: 'OUVRIR L’ONGLET MINAGE',
            aide: 'Menu du haut : TABLEAU DE BORD, onglet MINAGE · à utiliser sur PC ou tablette',
            lien: 'tableau-de-bord.html?mode=min',
            escadron: false,
            mobile: false
        },
        {
            id: 'colonisation-2026-10',
            couleur: '#FF7100',
            etiquette: '★ REFONTE COMPLÈTE',
            titre: 'LA COLONISATION FAIT PEAU NEUVE',
            sous: 'Carte du système, profil chiffré, déclaration des architectes',
            intro: 'Chaque système colonisé a maintenant <b>sa fiche complète</b> : la carte du système comme dans le jeu, ce que valent ses installations, ses chantiers et son architecte. <b>Rien à saisir</b> : tout vient de ce que votre plugin relève.',
            colonnes: 2,
            etapes: [
                { n: '1', t: 'LA CARTE DU SYSTÈME', d: 'L’étoile, les planètes et les stations accrochées sous leur corps, comme sur la carte du jeu, avec l’avancement de chaque chantier en cours.' },
                { n: '2', t: 'LE PROFIL DU SYSTÈME', d: 'Développement, technologie, sécurité, richesse, niveau de vie, population : le total estimé du système et l’effet de chaque installation, avec les poids officiels de la mise à jour 4.2.2.0.' },
                { n: '3', t: 'DÉCLARER SON SYSTÈME', d: 'Le jeu n’enregistre pas toujours la revendication d’un système. Une liste des systèmes sans architecte vous permet de vous déclarer, et de préciser le type d’une installation en le comparant avec le jeu.' },
                { n: '4', t: 'UNE FENÊTRE PLUS CLAIRE', d: 'Quatre onglets par système (vue d’ensemble, profil, installations, chantiers), des confirmations au style du site, et le détail des chantiers toujours à portée.' }
            ],
            avis: '<b>Plugin SYS.EDTEAM 2.27</b> : il se met à jour tout seul au démarrage d’EDMC, <b>relancez EDMC une fois</b>. Les totaux sont des <b>estimations</b> d’après la feuille communautaire de CMDR DaftMav : seules les installations dont le type est connu sont comptées, les autres sont à déclarer par l’architecte.',
            cta: 'OUVRIR LA COLONISATION',
            aide: 'Menu du haut : COLONISATION · à utiliser sur PC (la version mobile arrive)',
            lien: 'colonisation.html',
            escadron: false,
            mobile: false
        },
        {
            id: 'exploration-2026-10',
            couleur: '#B388FF',
            etiquette: '★ NOUVEAU MODULE',
            titre: 'L’EXPLORATION ET L’EXOBIOLOGIE ENTRENT DANS LE TABLEAU DE BORD',
            sous: 'Scannez, cartographiez, prélevez : tout est suivi en direct',
            intro: 'Un nouvel onglet <b>Exploration</b> accompagne vos sorties <b>sans rien saisir</b> : il montre le système, ce que valent ses corps, vos échantillons d’exobiologie en cours, et <b>où tout vendre</b>.',
            colonnes: 2,
            etapes: [
                { n: '1', t: 'LA CARTE DU SYSTÈME', d: 'Les corps que vous avez scannés et ceux que d’autres pilotes ont déjà relevés, classés par intérêt. Un clic ouvre la fiche : valeur du scan, de la carte DSS, signaux biologiques.' },
                { n: '2', t: 'MA FEUILLE DE ROUTE', d: 'Ajoutez les corps qui vous intéressent : ils s’alignent dans l’ordre à suivre. Une fois scanné ou cartographié, un corps se grise avec une coche et la cible suivante s’allume.' },
                { n: '3', t: 'MES ÉCHANTILLONS', d: 'Une carte par espèce : couleur de la variante, trois fioles qui se remplissent à chaque prélèvement, valeur estimée. Les espèces en cours d’abord, puis celles à vendre.' },
                { n: '4', t: 'OÙ VENDRE ?', d: 'Un tableau des stations proches qui rachètent vos scans et vos échantillons d’exobiologie : repérez d’un coup d’œil celles qui prennent les deux, et la plus proche.' }
            ],
            avis: '<b>Plugin SYS.EDTEAM 2.31</b> : il se met à jour tout seul au démarrage d’EDMC, <b>relancez EDMC une fois</b>. Les valeurs sont des <b>estimations</b> d’après la formule de la communauté (le jeu paie en général davantage) et <b>les données non vendues sont perdues si votre vaisseau est détruit</b>. Les prix de vente des stations viennent des relevés des joueurs (Spansh).',
            cta: 'OUVRIR L’ONGLET EXPLORATION',
            aide: 'Menu du haut : TABLEAU DE BORD, onglet EXPLORATION · à utiliser sur PC ou tablette',
            lien: 'tableau-de-bord.html?mode=exp',
            escadron: false,
            mobile: false
        },
        {
            id: 'campagnes-2026-10',
            couleur: '#FF3333',
            etiquette: '★ MISE À JOUR MAJEURE',
            titre: 'LES CAMPAGNES DE L’AMIRAL',
            sous: 'BGS, Powerplay et colonisation, réunis dans une seule vue',
            intro: 'La page BGS change : l’Amiral lance des <b>campagnes</b>, et chacune réunit les missions de l’escadron. <b>Un coup d’œil suffit</b> pour savoir quoi faire, de la plus critique à la plus calme.',
            colonnes: 2,
            etapes: [
                { n: '1', t: 'UNE LIGNE PAR MISSION', d: 'Influence d’une faction, mérites Powerplay d’un système, chantiers ou colonisation d’un système : chaque mission a sa ligne et sa barre de progression. Un clic ouvre le détail.' },
                { n: '2', t: 'LE POWERPLAY RELEVÉ POUR VOUS', d: 'Vos mérites sont rattachés au système où vous étiez, et l’état du système vient des journaux des pilotes de l’escadron : rien à saisir.' },
                { n: '3', t: 'LA COLONISATION AUSSI', d: 'Terminer des chantiers, ou coloniser un système étape par étape : l’avancement se met à jour avec vos livraisons.' },
                { n: '4', t: 'VOS INITIATIVES CONTINUENT', d: 'Lancez aussi des initiatives Powerplay ou de colonisation. Elles restent à part, et l’Amiral peut les transformer en missions de campagne.' }
            ],
            avis: '<b>Plugin SYS.EDTEAM 2.32</b> : il se met à jour tout seul au démarrage d’EDMC, <b>relancez EDMC une fois</b>. Il faut avoir rejoint une puissance pour participer aux missions Powerplay ; les <b>CP sont une estimation</b> (mérites ÷ 4).',
            cta: 'DÉCOUVRIR LES CAMPAGNES',
            aide: 'Page BGS',
            lien: 'bgs.html'
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
            '#edteam-annonce{position:fixed;inset:0;z-index:9700;display:flex;align-items:center;justify-content:center;padding:16px;background:radial-gradient(circle at 50% 40%,color-mix(in srgb,var(--anc,#FF4FD8) 16%,transparent),rgba(0,0,0,.94) 62%);backdrop-filter:blur(5px);overflow-y:auto;animation:ancFond .5s ease-out}',
            '#edteam-annonce .anc-boite{position:relative;width:min(96vw,760px);max-height:94vh;overflow-y:auto;box-sizing:border-box;text-align:center;padding:28px 30px 24px;background:rgba(10,4,9,.97);border:1px solid var(--anc,#FF4FD8);box-shadow:0 0 50px color-mix(in srgb,var(--anc,#FF4FD8) 28%,transparent),inset 0 0 40px color-mix(in srgb,var(--anc,#FF4FD8) 5%,transparent);animation:ancEntree .6s cubic-bezier(.2,.8,.2,1)}',
            '#edteam-annonce .anc-eti{display:inline-block;border:1px solid var(--anc);color:var(--anc);background:color-mix(in srgb,var(--anc,#FF4FD8) 10%,transparent);padding:4px 16px;letter-spacing:4px;font-weight:bold;font-size:.8em;text-shadow:0 0 10px color-mix(in srgb,var(--anc,#FF4FD8) 50%,transparent)}',
            '#edteam-annonce .anc-titre{margin:16px 0 6px;color:#fff;font-size:1.65em;font-weight:bold;letter-spacing:3px;line-height:1.25;text-shadow:0 0 18px color-mix(in srgb,var(--anc,#FF4FD8) 55%,transparent)}',
            '#edteam-annonce .anc-sous{color:var(--anc);letter-spacing:2px;font-size:.95em}',
            '#edteam-annonce .anc-intro{margin:16px auto 0;max-width:600px;color:#cfd3d8;line-height:1.6;font-size:.95em}',
            '#edteam-annonce .anc-intro b{color:#fff}',
            '#edteam-annonce .anc-etapes{display:grid;grid-template-columns:repeat(var(--anc-cols,3),minmax(0,1fr));gap:12px;margin:22px 0 0;text-align:left}',
            '#edteam-annonce .anc-etape{border:1px dashed color-mix(in srgb,var(--anc,#FF4FD8) 55%,transparent);background:color-mix(in srgb,var(--anc,#FF4FD8) 5%,transparent);padding:12px 13px;border-radius:3px}',
            '#edteam-annonce .anc-n{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;border:1px solid var(--anc);color:var(--anc);font-weight:bold;font-size:.9em}',
            '#edteam-annonce .anc-et{margin-top:8px;color:#fff;font-weight:bold;letter-spacing:2px;font-size:.82em}',
            '#edteam-annonce .anc-ed{margin-top:6px;color:#aab;font-size:.8em;line-height:1.5}',
            '#edteam-annonce .anc-avis{margin:14px 0 0;padding:10px 14px;border:1px solid var(--anc);background:rgba(255,255,255,.04);color:#cfd3d8;font-size:.82em;line-height:1.55;text-align:left}',
            '#edteam-annonce .anc-avis b{color:#fff}',
            '#edteam-annonce .anc-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:24px}',
            '#edteam-annonce .anc-btn{background:color-mix(in srgb,var(--anc,#FF4FD8) 12%,transparent);border:1px solid var(--anc);color:var(--anc);padding:12px 26px;font-family:inherit;font-size:1em;font-weight:bold;letter-spacing:2px;cursor:pointer;transition:.2s}',
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
        if (a.colonnes) ov.style.setProperty('--anc-cols', a.colonnes);
        ov.innerHTML = '<div class="anc-boite">'
            + '<span class="anc-eti">' + esc(a.etiquette) + '</span>'
            + '<div class="anc-titre">' + esc(a.titre) + '</div>'
            + '<div class="anc-sous">' + esc(a.sous) + '</div>'
            + '<div class="anc-intro">' + a.intro + '</div>'
            + '<div class="anc-etapes">' + a.etapes.map(function (e) { return '<div class="anc-etape"><span class="anc-n">' + esc(e.n) + '</span><div class="anc-et">' + esc(e.t) + '</div><div class="anc-ed">' + esc(e.d) + '</div></div>'; }).join('') + '</div>'
            + (a.avis ? '<div class="anc-avis">' + a.avis + '</div>' : '')
            + '<div class="anc-actions"><button type="button" class="anc-btn" data-a="go">' + esc(a.cta) + '</button><button type="button" class="anc-btn gris" data-a="fermer">J’AI COMPRIS</button></div>'
            + '<div class="anc-aide">' + esc(a.aide) + '</div></div>';
        function fermer(vaVoir) {
            var vues = lire(uid); if (vues.indexOf(a.id) < 0) vues.push(a.id); ecrire(uid, vues);
            document.removeEventListener('keydown', clavier);
            if (ov.parentNode) ov.parentNode.removeChild(ov);
            if (vaVoir) { if (a.lien) window.location.href = a.lien; else if (typeof aller === 'function') aller(); }
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
                var sansEscadron = !esc_ || esc_ === 'INDEPENDANT';
                var vues = lire(profil.user_id);
                var a = ANNONCES.filter(function (x) {
                    if (vues.indexOf(x.id) >= 0) return false;
                    if (x.escadron !== false && sansEscadron) return false;   // par defaut : reservee aux membres d'un escadron
                    if (x.mobile === false && opts.mobile) return false;      // fonction pensee pour le PC : pas annoncee sur le telephone
                    return true;
                })[0];
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
