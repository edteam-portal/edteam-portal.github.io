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
        },
        {
            id: 'combat-2026-10',
            couleur: '#FF3B30',
            etiquette: '★ NOUVEAU MODULE',
            titre: 'LE COMBAT ENTRE DANS LE TABLEAU DE BORD',
            sous: 'Vos cibles, vos éliminations et un capitaine à bord',
            intro: 'Un nouvel onglet <b>Combat</b> s’ouvre tout seul quand un combat commence, <b>sans rien saisir</b>. Il montre ce que vous verrouillez, ce que vous éliminez, et vous prévient <b>avant de tirer sur un allié</b>.',
            colonnes: 2,
            etapes: [
                { n: '1', t: 'LA CIBLE VERROUILLÉE', d: 'Son hologramme, son pilote, sa faction et son rang se déchiffrent à l’écran pendant le scan, avec une menace estimée et les derniers vaisseaux verrouillés autour de vous.' },
                { n: '2', t: 'ROUGE, VERT OU BLEU', d: 'Tout le cadre devient rouge pour un hostile, vert pour un allié (même pouvoir Powerplay, réputation amie, faction soutenue) et bleu quand le camp n’est pas connu. Prudence sur le vert et le bleu.' },
                { n: '3', t: 'LE TABLEAU DE CHASSE', d: 'Chaque ennemi éliminé avec son vaisseau, sa prime ou son bon de guerre et son palier. Au sol, un buste d’opérateur par ennemi, et les bons de guerre répartis par palier.' },
                { n: '4', t: 'UN CAPITAINE À BORD', d: 'Des sons accompagnent le verrouillage et le déchiffrage, et un capitaine commente les éliminations avec humour. Tout se coupe d’un clic avec l’interrupteur de l’onglet.' }
            ],
            avis: '<b>Plugin SYS.EDTEAM 2.38</b> : il se met à jour tout seul au démarrage d’EDMC, <b>relancez EDMC une fois</b>. Le camp d’une cible, la menace et les vaisseaux « ≈ » sont des <b>estimations</b> : le jeu ne signale ni vos tirs ni qui vous attaque.',
            cta: 'OUVRIR L’ONGLET COMBAT',
            aide: 'Menu du haut : TABLEAU DE BORD, onglet COMBAT · à utiliser sur PC ou tablette',
            lien: 'tableau-de-bord.html?mode=cmb',
            escadron: false,
            mobile: false
        },
        {
            id: 'joueurs-croises-2026-10',
            couleur: '#00F0FF',
            plein: true,
            etiquette: '★ NOUVELLE FONCTION',
            titre: 'LES JOUEURS QUE VOUS CROISEZ, L’ESCADRON S’EN SOUVIENT',
            sous: 'Joueurs croisés : l’historique partagé de vos verrouillages',
            intro: 'Chaque <b>joueur</b> que vous verrouillez en jeu est désormais gardé dans un historique <b>partagé par l’escadron</b>, pendant 30 jours. Un joueur recherché croisé à l’autre bout de la galaxie ? Vos camarades le retrouvent, avec son vaisseau, sa prime et l’endroit où il a été vu.',
            visuel: function () { return window.JCroises ? JCroises.visuelAnnonce() : Promise.resolve(''); },
            visuelApres: function () { if (window.JCroises) JCroises.visuelApres(); },
            etapes: [
                { n: '1', t: 'VERROUILLEZ', d: 'Gardez le <b>tableau de bord</b> ouvert sur votre second écran, <b>sur n’importe quel onglet</b> : quand vous verrouillez un joueur en jeu, il passe tout seul sur Combat et montre son hologramme. Rien à saisir.' },
                { n: '2', t: 'L’ESCADRON SE SOUVIENT', d: 'Sa fiche rejoint l’historique : vaisseau, rang, faction, escadron, puissance, et statut légal et prime après un scan assez long. Une fiche par joueur, gardée 30 jours.' },
                { n: '3', t: 'RETROUVEZ-LES', d: 'Le QG affiche le nombre de joueurs croisés et les derniers. Un clic ouvre la liste : recherche, filtres (recherchés, revus…) et le détail de chacun.' }
            ],
            avis: '<b>Plugin SYS.EDTEAM 2.40</b> : il se met à jour tout seul au démarrage d’EDMC, <b>relancez EDMC une fois</b>. Le plugin enregistre les joueurs verrouillés <b>même si le tableau de bord est fermé</b> ; il ne sert qu’à les voir en direct. Les membres de l’escadron n’y figurent pas.',
            cta: 'OUVRIR LES JOUEURS CROISÉS',
            aide: 'QG : carte « Joueurs croisés » · Combat : bouton « JOUEURS CROISÉS »',
            action: function () { if (window.JCroises) JCroises.ouvrir(); },
            mobile: false
        },
        {
            id: 'flotte-2026-10-b',
            couleur: '#00F0FF',
            etiquette: '★ MISE À JOUR',
            titre: 'TREIZE NOUVEAUX VAISSEAUX EN HOLOGRAMME',
            sous: 'Eagle, Viper, Cobra Mk III, Asp, Krait, Corsair et sept autres',
            intro: 'Dans l’onglet Missions du tableau de bord, <b>votre vaisseau s’affiche en hologramme</b> : chaque module, vos passagers dans leurs cabines, votre soute qui se remplit. <b>Treize vaisseaux s’ajoutent aujourd’hui</b> à ceux déjà disponibles.',
            etapes: [],
            plein: true,
            aVenir: 14,
            galerie: [["Anaconda","images/vaisseaux/anaconda-dessus.webp"],["Asp Explorer","images/vaisseaux/asp-dessus.webp"],["Beluga Liner","images/vaisseaux/beluga-dessus.webp"],["Caspian Explorer","images/vaisseaux/caspian-dessus.webp"],["Cobra Mk III","images/vaisseaux/cobramkiii-dessus.webp"],["Cobra Mk V","images/vaisseaux/cobramkv-dessus.webp"],["Corsair","images/vaisseaux/corsair-dessus.webp"],["Diamondback Explorer","images/vaisseaux/dbx-dessus.webp"],["Diamondback Scout","images/vaisseaux/diamondback-dessus.webp"],["Dolphin","images/vaisseaux/dolphin-dessus.webp"],["Eagle","images/vaisseaux/eaglemk1-dessus.webp"],["Federal Corvette","images/vaisseaux/corvette-dessus.webp"],["Federal Dropship","images/vaisseaux/dropship-dessus.webp"],["Federal Gunship","images/vaisseaux/gunship-dessus.webp"],["Fer-de-Lance","images/vaisseaux/fdl-dessus.webp"],["Imperial Courier","images/vaisseaux/courrier-dessus.webp"],["Imperial Cutter","images/vaisseaux/cutter-dessus.webp"],["Imperial Eagle","images/vaisseaux/eagle-dessus.webp"],["Keelback","images/vaisseaux/keelback-dessus.webp"],["Kestrel Mk II","images/vaisseaux/kestrel-dessus.webp"],["Krait Mk II","images/vaisseaux/krait2-dessus.webp"],["Lynx Highliner","images/vaisseaux/lynx-dessus.webp"],["Mandalay","images/vaisseaux/mandalay-dessus.webp"],["Panther Clipper Mk II","images/vaisseaux/panther-dessus.webp"],["Python","images/vaisseaux/python-dessus.webp"],["Python Mk II","images/vaisseaux/pythonmk2-dessus.webp"],["Type-11 Prospector","images/vaisseaux/t11-dessus.webp"],["Type-6 Transporter","images/vaisseaux/type6-dessus.webp"],["Type-7 Transporter","images/vaisseaux/type7t-dessus.webp"],["Type-8 Transporter","images/vaisseaux/type8-dessus.webp"],["Viper Mk III","images/vaisseaux/viper-dessus.webp"],["Vulture","images/vaisseaux/vulture-dessus.webp"]],
            avis: '<b>Rien à faire de votre côté</b> : si votre vaisseau est dans la liste, l’hologramme apparaît tout seul. Sinon, vous gardez l’affichage habituel, avec les mêmes informations.',
            cta: 'OUVRIR LE TABLEAU DE BORD',
            aide: 'Menu du haut : TABLEAU DE BORD, onglet MISSIONS · à utiliser sur PC ou tablette',
            lien: 'tableau-de-bord.html?mode=mis',
            escadron: false,
            mobile: false
        },
        {
            id: 'hangar-2026-10',
            couleur: '#00F0FF',
            etiquette: '★ NOUVEAU MODULE',
            titre: 'VOTRE HANGAR, VAISSEAU PAR VAISSEAU',
            sous: 'Vos vaisseaux et leur équipement, en hologramme',
            intro: 'Une nouvelle page <b>Mon hangar</b> (menu latéral, sous le Quartier général) liste <b>tous vos vaisseaux</b> avec leur hologramme et l’équipement actuel de chacun, <b>sans rien saisir</b>. Les membres de votre escadron peuvent aussi voir le vôtre depuis votre fiche.',
            colonnes: 2,
            etapes: [
                { n: '1', t: 'LA FLOTTE D’UN COUP D’ŒIL', d: 'Chaque vaisseau avec son hologramme, coloré selon sa taille : vert pour les petits (S), cyan pour les moyens (M), ambre pour les grands (L). Recherche et filtres S, M, L pour retrouver un vaisseau.' },
                { n: '2', t: 'L’ÉQUIPEMENT ACTUEL', d: 'Armement, utilitaires, modules de base et optionnels. Pour chaque module modifié : son niveau d’ingénierie (G1 à G5), son plan, son effet expérimental et l’ingénieur.' },
                { n: '3', t: 'LE HANGAR DES AUTRES', d: 'Sur la page Escadron, ouvrez la fiche d’un pilote de votre escadron et cliquez sur HANGAR. Personne d’autre que vous et votre escadron ne peut le voir, et il n’affiche ni valeur en crédits ni position.' },
                { n: '4', t: 'RIEN À SAISIR', d: 'Le hangar se remplit tout seul à partir de vos journaux de jeu. Un vaisseau que vous n’avez jamais piloté avec le plugin s’affiche sans équipement, et se complète dès que vous le pilotez.' }
            ],
            avis: '<b>Plugin SYS.EDTEAM 2.41</b> : il se met à jour tout seul au démarrage d’EDMC, <b>relancez EDMC une fois</b> : il relit alors vos journaux et envoie votre hangar. Le menu latéral est aussi plus compact, pour tenir sur une tablette en paysage.',
            cta: 'OUVRIR MON HANGAR',
            aide: 'Menu latéral : MON HANGAR · à utiliser sur PC ou tablette',
            lien: 'hangar.html',
            escadron: false,
            mobile: false
        },
        {
            id: 'bgs-pp-lifting-2026-10',
            couleur: '#FF7100',
            etiquette: '★ MISE À JOUR EXCEPTIONNELLE',
            titre: 'LE MODULE BGS / POWERPLAY FAIT PEAU NEUVE',
            pages: [
                {
                    titre: 'UN NOUVEAU REGARD SUR VOS MISSIONS',
                    sous: 'BGS et Powerplay : lifting complet de la page Engagement',
                    intro: 'Les directives de votre escadron se lisent maintenant <b>d’un coup d’œil</b>. Plus d’objectif ni de pourcentage d’avancement : <b>la couleur dit le résultat</b> du dernier tick du jeu, et pour le Powerplay vous retrouvez <b>les barres que le jeu affiche lui-même</b>.',
                    visuelHtml: anvVisuel1,
                    colonnes: 2,
                    etapes: [
                        { n: '1', t: 'LE RÉSULTAT EN COULEUR', d: '<b style="color:#2fe07a">Vert</b> : l’influence va dans le sens de la directive. <b style="color:#ff4d4d">Rouge</b> : à contre-sens, c’est là que l’aide est utile. <b style="color:#4DA3FF">Bleu</b> : inchangé ou pas encore mesuré. Une couleur pâle signifie « pas de mesure depuis le tick ».' },
                        { n: '2', t: 'LA JAUGE D’INFLUENCE', d: 'Gris : la part qui n’a pas bougé depuis le dernier tick. Plein : un gain. Rayé : une perte. Le trait blanc marque la valeur d’avant le tick. Survolez la jauge pour l’explication.' },
                        { n: '3', t: 'LES BARRES DU JEU, POUR LE POWERPLAY', d: 'La même barre que la carte galactique du jeu : Inoccupé, Exploité, Consolidé, Défendu. <b>▼ blanc</b> : position au dernier tick, <b style="color:#ffb000">▲ orange</b> : position maintenant. On voit si le système monte ou descend d’état.' },
                        { n: '4', t: 'TES ACTIONS, AUJOURD’HUI', d: 'Quatre pastilles par directive : ce que vous avez déjà fait aujourd’hui et ce qui reste utile. Les avatars montrent qui joue sur la directive.' }
                    ],
                    avis: '<b>Les mesures Powerplay viennent des journaux de jeu des pilotes de l’escadron</b> : plus vous êtes nombreux à jouer, plus elles sont à jour. Le jeu change l’état d’un système chaque jeudi à 07:00 UTC.'
                },
                {
                    titre: 'DES FENÊTRES REFAITES',
                    sous: 'Qui joue, qui apporte quoi, tick après tick',
                    intro: 'Cliquez sur une directive : <b>la fenêtre a été entièrement repensée</b>, pour le BGS comme pour le Powerplay, avec le même style que le reste du site.',
                    visuelHtml: anvVisuel2,
                    colonnes: 4,
                    etapes: [
                        { n: '1', t: 'QUI PARTICIPE', d: 'Chaque pilote avec son avatar, sa part de l’effort, et les ticks où il a joué (un carré vert par tick).' },
                        { n: '2', t: 'L’EFFORT PAR ACTIVITÉ', d: 'Une barre cumulée par pilote sur toute la durée de la directive : missions, commerce, primes, science.' },
                        { n: '3', t: 'POWERPLAY : OÙ EN EST LE SYSTÈME', d: 'Le portrait de la puissance, l’état, la barre du jeu, et ce qui change au prochain tick.' },
                        { n: '4', t: 'D’OÙ VIENNENT LES MÉRITES', d: 'La répartition des mérites par origine (primes, missions, livraisons…), pour l’escadron puis pilote par pilote.' }
                    ],
                    avis: 'Les fenêtres affichent aussi le résultat du jeu sur 30 jours et les états de la faction (guerre, expansion…).'
                },
                {
                    titre: 'LA CARTE GALACTIQUE STRATÉGIQUE',
                    sous: 'Trois affichages : lignes, cartes et carte galactique',
                    intro: 'Choisissez l’affichage de vos missions : <b>lignes</b> pour agir vite, <b>cartes</b> pour un survol visuel, ou la toute nouvelle <b>carte galactique</b> pour voir <b>où</b> se joue la campagne et <b>ce qui s’en approche</b>.',
                    visuelHtml: anvVisuel3,
                    colonnes: 3,
                    etapes: [
                        { n: '1', t: 'VOS CIBLES SUR LA CARTE', d: 'Chaque système de mission est placé (vue de dessus ou de côté). La couleur donne le résultat, la participation ou la priorité. Survolez : les infos de la directive. Cliquez : sa fenêtre.' },
                        { n: '2', t: 'OÙ RENFORCER', d: 'Un filtre « À renforcer » éclaire les systèmes rouges où presque personne n’a joué depuis le dernier tick.' },
                        { n: '3', t: 'VOTRE TERRITOIRE', d: 'Les systèmes de la faction apparaissent en fond. Vos colonies sont en or, et un losange violet marque les systèmes sous la puissance que vous défendez.' },
                        { n: '4', t: 'TROIS NIVEAUX D’ALARME', d: '<b style="color:#ff2d2d">Powerplay</b> : les systèmes pris par une puissance ennemie (points fixes) et ses conquêtes en cours (orange). <b style="color:#ff4fd8">BGS</b> : une faction rivale en Expansion vers l’un de vos systèmes (rose, avec la route). Seul ce qui est imminent clignote.' },
                        { n: '5', t: 'ZOOM ET REPÈRES', d: 'En dézoomant, les cibles se regroupent en bulles. Le menu « Aller à… » cadre une campagne ou un système, et « Depuis ma position » donne vos distances.' },
                        { n: '6', t: 'COPIER UN NOM, ET UNE AIDE', d: 'Clic droit sur un système (ou Ctrl+C en le survolant) : son nom est copié, prêt à coller dans le jeu. Le bouton ❓ AIDE de la carte explique tout, en 8 pages.' }
                    ],
                    avis: '<b>Rien à installer.</b> Les positions viennent d’EDSM et les systèmes de la faction et des puissances de Spansh, relevés chaque jour : ils peuvent avoir quelques jours de retard.'
                }
            ],
            cta: 'OUVRIR LA CARTE GALACTIQUE',
            aide: 'Page Engagement (menu BGS) : bouton AFFICHAGE · à utiliser sur PC ou tablette',
            action: function () { try { localStorage.setItem('edteam_camp_vue', 'carte'); } catch (e) { /* tant pis */ } window.location.href = 'bgs.html'; },
            mobile: false
        }
        ,{
            id: 'route-double-2026-10',
            couleur: '#00FF66',
            etiquette: '★ NOUVELLE FONCTION',
            titre: 'LA ROUTE DOUBLE : UN VOYAGE, DEUX DIRECTIVES',
            pages: [
                {
                    titre: 'UN SEUL VOYAGE, DEUX DIRECTIVES',
                    sous: 'Aller-retour : l’aller et le retour font chacun monter une faction',
                    intro: 'Quand vous <b>vendez avec bénéfice</b> dans une station, la faction qui la contrôle gagne de l’influence. Avec le nouveau réglage <b>ALLER-RETOUR</b> de la fenêtre « Où vendre ? », EDTEAM cherche les trajets où <b>l’aller sert une directive et le retour en sert une autre</b> : vous ne rentrez plus jamais à vide.',
                    visuelHtml: anvDouble1,
                    colonnes: 3,
                    etapes: [
                        { n: '1', t: 'L’ALLER', d: 'Vous achetez une marchandise à la station A et vous la vendez avec bénéfice à la station de la faction visée : <b style="color:#00F0FF">la directive #178 avance</b>.' },
                        { n: '2', t: 'LE RETOUR', d: 'Vous rachetez une autre marchandise à cette station et vous la revendez à A : si A est dans le système d’une autre directive, <b style="color:#FFB000">la #175 avance aussi</b>.' },
                        { n: '3', t: 'LE BILAN', d: 'EDTEAM calcule le bénéfice de la boucle entière et met <b style="color:#00FF66">en tête les routes doubles</b>, avec un cadre vert qui clignote.' }
                    ],
                    avis: 'Exemple dessiné avec des noms et des chiffres fictifs.'
                },
                {
                    titre: 'COMMENT L’UTILISER',
                    sous: 'Trois gestes dans la fenêtre « Où vendre ? »',
                    intro: 'Ouvrez une <b>directive de hausse</b> (ou d’élection) sur la page BGS, puis le bouton <b>« OÙ VENDRE ? »</b>.',
                    visuelHtml: anvDouble2,
                    colonnes: 3,
                    etapes: [
                        { n: '1', t: 'ACTIVEZ « ALLER-RETOUR »', d: 'Le réglage est dans la barre du haut de la fenêtre. Il ne garde que les routes dont le retour est rentable.' },
                        { n: '2', t: 'REPÉREZ LE CADRE VERT', d: 'Les routes doubles passent <b>avant toutes les autres</b>, avec le bandeau <b style="color:#00FF66">★ ROUTE DOUBLE</b> qui clignote.' },
                        { n: '3', t: 'SUIVEZ LES DEUX ÉTAPES', d: '<b style="color:#00F0FF">1 · ALLER</b> en cyan, <b style="color:#FFB000">2 · RETOUR</b> en orange : stations, prix, quantités et effet sur chaque directive. Le bilan de la boucle est en gros en bas.' }
                    ]
                },
                {
                    titre: 'BON À SAVOIR',
                    sous: 'Pour ne pas se tromper',
                    intro: 'Quelques règles du jeu, que la fenêtre respecte pour vous.',
                    colonnes: 2,
                    etapes: [
                        { n: '1', t: 'SEULE LA VENTE COMPTE', d: 'Acheter ne fait pas monter une faction ; <b>vendre avec bénéfice</b> dans une de ses stations, oui. Un retour qui ne rapporte rien n’est pas proposé.' },
                        { n: '2', t: 'MÊME SYSTÈME, MÊME FACTION', d: 'Le retour sert une directive seulement si la station d’achat est <b>dans le système de cette directive et contrôlée par sa faction</b>. Sinon la fenêtre écrit « crédits seulement ».' },
                        { n: '3', t: 'ATTENTION AUX BAISSES', d: 'Si votre retour renforçait une faction visée par une directive de <b style="color:#ff9f43">BAISSE</b>, la route est signalée en orange « ⚠ à éviter ».' },
                        { n: '4', t: 'LES PRIX BOUGENT', d: 'Prix et stocks viennent des relevés des joueurs (Spansh) : vérifiez-les en arrivant. Une route double peut rapporter un peu moins de crédits qu’une autre : c’est voulu, <b>deux directives avancent</b>.' }
                    ],
                    avis: '<b>Rien à installer.</b> Fonction disponible sur PC et tablette, dans les fenêtres « Où vendre ? », « Où vendre à perte ? » et « Route de contrebande ».'
                }
            ],
            cta: 'OUVRIR LA PAGE BGS',
            aide: 'Page BGS · une directive de hausse · bouton « OÙ VENDRE ? » · réglage ALLER-RETOUR · à utiliser sur PC ou tablette',
            lien: 'bgs.html',
            mobile: false
        }
    ];

    // ---- visuels de l'annonce « lifting BGS / Powerplay » : dessines en HTML / SVG (aucune capture d'ecran, aucune donnee reelle ; noms et chiffres fictifs) ----
    function anvPips(f) {
        var ic = ['📝', '💰', '✴', '🔬'];
        return '<span class="anv-pips">' + ic.map(function (x, i) { return '<i class="' + (f[i] ? 'ok' : '') + '">' + (f[i] ? '✓' : x) + '</i>'; }).join('') + '</span>';
    }
    // jauge d'influence : base = part inchangee (gris), gain ou perte = segment plein ou raye, trait blanc = valeur avant le tick
    function anvJauge(base, gain, perte) {
        return '<span class="anv-jg"><i style="width:' + base + '%"></i>' + (gain ? '<b class="g" style="left:' + base + '%;width:' + gain + '%"></b>' : '') + (perte ? '<b class="p" style="left:' + base + '%;width:' + perte + '%"></b>' : '') + '<u style="left:' + (base + (perte || 0)) + '%"></u></span>';
    }
    function anvLigne(k, tag, nom, jauge, val, pips) {
        return '<div class="anv-lg" style="--k:' + k + '"><span class="anv-tag">' + tag + '</span><span class="anv-nm">' + nom + '</span>' + jauge + '<span class="anv-val">' + val + '</span>' + pips + '</div>';
    }
    // barre du jeu a 4 zones (Inoccupe / Exploite / Consolide / Defendu) ; triangle blanc = position au dernier tick, orange = maintenant
    function anvZones(blanc, orange) {
        return '<span class="anv-zb"><span class="z" style="--c:#4a4f55"></span><span class="z" style="--c:#b04a47"></span><span class="z" style="--c:#4a944a"></span><span class="z" style="--c:#8f5ab5"></span><em class="b" style="left:' + blanc + '%">▼</em><em class="o" style="left:' + orange + '%">▲</em></span>';
    }
    function anvPart(ini, nom, pts, segs, ticks) {
        return '<div class="anv-pa"><span class="anv-av">' + ini + '</span><div class="anv-pm"><div class="anv-l1"><b>CMDR ' + nom + '</b><span>' + pts + '</span></div><span class="anv-bar">' + segs.map(function (s) { return '<i style="flex:' + s[1] + ';background:' + s[0] + '"></i>'; }).join('') + '</span>'
            + (ticks ? '<span class="anv-tk">' + ticks.map(function (t) { return '<i class="' + (t ? 'ok' : '') + '"></i>'; }).join('') + '</span>' : '') + '</div></div>';
    }
    function anvTuile(k, t, v, s) { return '<div class="anv-ti" style="--k:' + k + '"><small>' + t + '</small><b>' + v + '</b><span>' + s + '</span></div>'; }
    // ---- visuels de l'annonce « route double » : dessines en HTML / SVG (noms et chiffres fictifs) ----
    function anvDouble1() {
        var t = function (x, y, s, c, txt, extra) { return '<text x="' + x + '" y="' + y + '" text-anchor="middle" fill="' + c + '" font-size="' + s + '" letter-spacing="1.5"' + (extra || '') + '>' + txt + '</text>'; };
        var noeud = function (x, nom, sous, dir, coul) {
            return '<rect x="' + x + '" y="95" width="280" height="135" rx="6" fill="#071218" stroke="' + coul + '" stroke-width="2"/>'
                + t(x + 140, 128, 16, '#fff', nom) + t(x + 140, 150, 12, '#8fd6e3', sous)
                + '<rect x="' + (x + 30) + '" y="170" width="220" height="30" rx="3" fill="rgba(0,255,102,.16)" stroke="#00FF66"/>' + t(x + 140, 190, 13, '#00FF66', dir)
                + t(x + 140, 218, 11, '#9ab', 'faction qui monte ▲');
        };
        return '<div class="anvd"><svg class="anvd-svg" viewBox="0 0 1000 340" role="img" aria-label="Schéma d’une route double : un aller et un retour qui servent chacun une directive">'
            + '<defs><marker id="anvdA" markerWidth="10" markerHeight="10" refX="7" refY="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#00F0FF"/></marker><marker id="anvdR" markerWidth="10" markerHeight="10" refX="7" refY="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#FFB000"/></marker></defs>'
            + noeud(20, 'SCHWEICKART ENTERPRISE', 'KAYIMALI · station d’achat', 'DIRECTIVE #175 · HAUSSE', '#00F0FF')
            + noeud(700, 'MALKENDORF', 'CARINI · faction visée', 'DIRECTIVE #178 · HAUSSE', '#FFB000')
            + '<path class="anvd-fl" d="M305 130 C420 56,580 56,692 130" fill="none" stroke="#00F0FF" stroke-width="3" marker-end="url(#anvdA)"/>'
            + t(500, 24, 14, '#00F0FF', '1 · ALLER : INDITE', ' font-weight="bold"') + t(500, 44, 12, '#bfeaf2', 'vendue avec bénéfice à Carini : +2,80 M cr · la #178 monte ▲')
            + '<path class="anvd-fl" d="M695 196 C580 280,420 280,308 196" fill="none" stroke="#FFB000" stroke-width="3" marker-end="url(#anvdR)"/>'
            + t(500, 306, 14, '#FFB000', '2 · RETOUR : ARGENT', ' font-weight="bold"') + t(500, 326, 12, '#ffe2a8', 'revendue avec bénéfice à Kayimali : +1,25 M cr · la #175 monte ▲')
            + '<circle class="anvd-pl" cx="500" cy="165" r="76" fill="rgba(0,255,102,.10)" stroke="#00FF66" stroke-width="2"/>'
            + t(500, 142, 12, '#c9f5da', '★ UN VOYAGE') + t(500, 172, 20, '#00FF66', '+4,05 M cr', ' font-weight="bold"') + t(500, 196, 12, '#c9f5da', '2 DIRECTIVES')
            + '</svg>'
            + '<div class="anvd-cmp"><div class="non"><b>SANS ALLER-RETOUR</b><span>L’aller fait avancer <u>une</u> directive, puis vous rentrez à vide ou pour des crédits seulement.</span></div>'
            + '<div class="oui"><b>AVEC LA ROUTE DOUBLE</b><span>Le même trajet fait avancer <u>deux</u> directives : l’efficacité de l’escadron double, sans effort de plus.</span></div></div></div>';
    }
    function anvDouble2() {
        return '<div class="anvd"><div class="anvd-ui"><div class="anvd-tg"><i></i><b>ALLER-RETOUR</b><span>← activez-le</span></div>'
            + '<div class="anvd-rt"><div class="b"><b>★ ROUTE DOUBLE</b> · 2 directives en un seul voyage : #178 + #175</div>'
            + '<div class="l a"><i>1 · ALLER</i><b>INDITE</b><span>fait monter <em>ICE STORM SQUADRON</em> (directive #178)</span></div>'
            + '<div class="l r"><i>2 · RETOUR</i><b>ARGENT</b><span>fait aussi monter <em>ICE STORM SQUADRON</em> (directive #175)</span></div>'
            + '<div class="bil"><small>BILAN DE L’ALLER-RETOUR · 704 t</small><b>+4,05 M cr</b></div></div></div></div>';
    }

    function anvVisuel1() {
        return '<div class="anv-ecran"><div class="anv-cap">VOS MISSIONS · EXEMPLE</div><div class="anv-tete"><span>TES ACTIONS · AUJOURD’HUI</span></div>'
            + anvLigne('#2fe07a', 'BGS #1 · HAUSSE', '<b>AZURE PRIME</b> · FACTION ALPHA', anvJauge(46, 9, 0), '34,2 % <em style="color:#2fe07a">▲ +1,4</em>', anvPips([true, true, false, false]))
            + anvLigne('#ff4d4d', 'BGS #2 · HAUSSE', '<b>KORVEN</b> · FACTION ALPHA', anvJauge(33, 0, 9), '28,7 % <em style="color:#ff4d4d">▼ −2,1</em>', anvPips([true, false, false, false]))
            + anvLigne('#4DA3FF', 'BGS #3 · BAISSE', '<b>HELIOS 12</b> · FACTION BÊTA', '<span class="anv-jg"><i style="width:52%"></i><u style="left:52%"></u></span>', '41,0 % <em style="color:#4DA3FF">= inchangé</em>', anvPips([false, false, true, false]))
            + '<div class="anv-lg pp" style="--k:#8A7CFF"><span class="anv-tag">PP · RENFORCEMENT</span><span class="anv-nm"><b>NYX 7</b> · Puissance exemple</span>' + anvZones(58, 66) + '<span class="anv-val">Consolidé <em style="color:#b6adff">▲ monte</em></span><span class="anv-pips"><i class="ok">✓</i></span></div>'
            + '</div>';
    }
    function anvVisuel2() {
        var bgs = '<div class="anv-fen"><div class="anv-cap">FENÊTRE BGS · EXEMPLE</div><div class="anv-tuiles">' + anvTuile('#FF7100', 'PARTICIPANTS', '4', 'pilotes') + anvTuile('#2fe07a', 'AUJOURD’HUI', '3 / 4', 'ont joué') + anvTuile('#FFB000', 'TA PART', '18 %', 'de l’effort') + '</div>'
            + '<div class="anv-t">PAR ACTIVITÉ</div><span class="anv-bar big"><i style="flex:52;background:#FF7100"></i><i style="flex:18;background:#2fe07a"></i><i style="flex:26;background:#00F0FF"></i><i style="flex:4;background:#a855f7"></i></span>'
            + '<div class="anv-t">PARTICIPANTS</div>'
            + anvPart('OR', 'ORION', '412 PTS · 58 %', [['#FF7100', 60], ['#2fe07a', 20], ['#00F0FF', 20]], [true, true, false, true, true, true, true])
            + anvPart('VE', 'VEGA', '176 PTS · 25 %', [['#FF7100', 30], ['#00F0FF', 70]], [false, true, true, false, true, false, true])
            + anvPart('LY', 'LYRA', '98 PTS · 14 %', [['#2fe07a', 100]], [false, false, true, false, false, true, true]) + '</div>';
        var pp = '<div class="anv-fen pp"><div class="anv-cap">FENÊTRE POWERPLAY · EXEMPLE</div><div class="anv-ent"><span class="anv-por">◈</span><div><span class="anv-badge">DÉFENDU</span><div class="anv-sm">Contrôlé par Puissance exemple</div></div></div>'
            + '<div class="anv-ph">Au prochain tick, le système devrait rester Défendu.</div>' + anvZones(70, 78)
            + '<div class="anv-t">D’OÙ VIENNENT LES MÉRITES</div><span class="anv-bar big"><i style="flex:46;background:#8a949c"></i><i style="flex:30;background:#8A7CFF"></i><i style="flex:24;background:#ff6a6a"></i></span>'
            + '<div class="anv-t">PARTICIPANTS</div>'
            + anvPart('OR', 'ORION', '9 400 MÉRITES · 61 %', [['#8a949c', 50], ['#8A7CFF', 30], ['#ff6a6a', 20]], null)
            + anvPart('VE', 'VEGA', '4 150 MÉRITES · 27 %', [['#8A7CFF', 70], ['#ff6a6a', 30]], null) + '</div>';
        return '<div class="anv-duo">' + bgs + pp + '</div>';
    }
    function anvVisuel3() {
        var s = 7, a = function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }, W = 760, H = 290, o = '';
        for (var x = 40; x < W; x += 80) o += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="' + H + '" stroke="#0f2330"/>';
        for (var y = 30; y < H; y += 60) o += '<line x1="0" y1="' + y + '" x2="' + W + '" y2="' + y + '" stroke="#0f2330"/>';
        for (var i = 0; i < 70; i++) o += '<circle cx="' + (20 + a() * 720).toFixed(0) + '" cy="' + (12 + a() * 266).toFixed(0) + '" r="2.2" fill="#7fb8d0" opacity=".22"/>';
        [[110, 70], [150, 215], [300, 40], [440, 235], [640, 190], [690, 60], [500, 40]].forEach(function (p) { o += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.6" fill="#FFD700" opacity=".7"/>'; });
        [[205, 245], [380, 100], [612, 245], [60, 150], [470, 160]].forEach(function (p) { o += '<path d="M' + p[0] + ' ' + (p[1] - 8) + ' l7 8 l-7 8 l-7 -8z" fill="none" stroke="#8A7CFF" stroke-width="1.4" opacity=".8"/>'; });
        o += '<g opacity=".16" fill="#00F0FF"><circle cx="250" cy="130" r="48"/><circle cx="300" cy="160" r="40"/></g><g opacity=".5" fill="none" stroke="#00F0FF" stroke-dasharray="3 4"><circle cx="250" cy="130" r="48"/><circle cx="300" cy="160" r="40"/></g>'
            + '<line x1="250" y1="130" x2="300" y2="160" stroke="#00F0FF" stroke-opacity=".45"/>';
        [[250, 130, '#ff4d4d', 'KORVEN'], [300, 160, '#2fe07a', 'AZURE PRIME'], [425, 118, '#4DA3FF', 'HELIOS 12']].forEach(function (p) { o += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="14" fill="none" stroke="' + (p[3] === 'HELIOS 12' ? '#cfd8dc' : '#00F0FF') + '" stroke-width="2"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="9" fill="' + p[2] + '" stroke="#000"/><text x="' + (p[0] + 20) + '" y="' + (p[1] + 4) + '" fill="#e6eef2" font-size="11.5" letter-spacing="1">' + p[3] + '</text>'; });
        o += '<circle cx="590" cy="95" r="22" fill="none" stroke="#cfd8dc" stroke-width="2" stroke-dasharray="5 3"/><circle cx="590" cy="95" r="17" fill="#ff4d4d" stroke="#000"/><text x="590" y="100" text-anchor="middle" font-size="14" font-weight="bold" fill="#04070a">12</text><text x="540" y="136" fill="#e6eef2" font-size="11">12 systèmes · 5 campagnes</text>';
        [[330, 205, 0.7], [375, 188, 1], [210, 170, 1.4]].forEach(function (p) { o += '<g class="anv-al" style="--d:' + p[2] + 's"><circle class="rg" cx="' + p[0] + '" cy="' + p[1] + '" r="6" fill="none" stroke="#ff2d2d" stroke-width="1.6"/><circle class="pt" cx="' + p[0] + '" cy="' + p[1] + '" r="4.4" fill="#ff2d2d" stroke="#fff" stroke-width=".8"/></g>'; });
        o += '<text x="345" y="224" fill="#ff8a8a" font-size="9.5">SYSTÈME ENNEMI · NOUVEAU</text><text x="30" y="276" fill="#7fb8d0" font-size="10">20 al</text><line x1="30" y1="282" x2="110" y2="282" stroke="#7fb8d0" stroke-width="2"/><text x="740" y="22" text-anchor="end" fill="#3d7490" font-size="10" letter-spacing="2">▲ VERS LE CENTRE GALACTIQUE</text>';
        return '<div class="anv-ecran"><div class="anv-vues"><span>☰ LIGNES</span><span>▦ CARTES</span><span class="on">◉ CARTE GALACTIQUE</span></div>'
            + '<svg class="anv-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Exemple de carte galactique des campagnes">' + o + '</svg>'
            + '<div class="anv-leg"><span><i style="background:#2fe07a"></i>va dans le sens voulu</span><span><i style="background:#ff4d4d"></i>à contre-sens : à renforcer</span><span><i style="background:#4DA3FF"></i>inchangé</span><span><i style="background:#FFD700"></i>colonies de l’escadron</span><span><i class="lz"></i>puissance défendue</span><span><i style="background:#ff2d2d" class="clig"></i>puissance ennemie proche</span></div></div>';
    }

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
            '#edteam-annonce .anc-boite.plein{width:min(96vw,1180px)}',
            '#edteam-annonce .anc-gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:20px 0 0}',
            '#edteam-annonce .anc-nef{position:relative;overflow:hidden;border:1px solid color-mix(in srgb,var(--anc) 35%,transparent);background:linear-gradient(180deg,color-mix(in srgb,var(--anc) 6%,transparent),rgba(0,0,0,.35));padding:8px 6px 9px;display:flex;flex-direction:column;align-items:center;gap:6px}',
            '#edteam-annonce .anc-nef:after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.28) 0 1px,transparent 1px 4px)}',
            '#edteam-annonce .anc-nef img{height:150px;max-width:100%;object-fit:contain;transform:rotate(180deg);filter:grayscale(1) sepia(1) hue-rotate(150deg) saturate(4) brightness(1.05) contrast(1.05) drop-shadow(0 0 6px rgba(0,240,255,.55));opacity:.9}',
            '#edteam-annonce .anc-nef span{color:#fff;font-size:.66em;letter-spacing:1.5px;text-align:center;line-height:1.3}',
            '#edteam-annonce .anc-aven{margin:16px 0 0;border:1px dashed rgba(139,151,160,.55);padding:14px 18px;display:flex;align-items:center;gap:18px;flex-wrap:wrap;text-align:left;background:rgba(255,255,255,.02)}',
            '#edteam-annonce .anc-aven b{font-size:2.1em;color:#FF9A1F;letter-spacing:2px;line-height:1}',
            '#edteam-annonce .anc-aven p{margin:0;flex:1;min-width:220px;color:#aab4bb;font-size:.84em;line-height:1.55} #edteam-annonce .anc-aven p strong{color:#fff;font-weight:normal}',
            '#edteam-annonce .anc-barre{height:8px;flex-basis:100%;background:#0a1418;border:1px solid #1f2d33;position:relative} #edteam-annonce .anc-barre i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#007a85,var(--anc));box-shadow:0 0 10px color-mix(in srgb,var(--anc) 60%,transparent)}',
            '@media (max-width:640px){#edteam-annonce .anc-gal{grid-template-columns:repeat(2,1fr)}#edteam-annonce .anc-nef img{height:110px}}',
            '@keyframes ancFond{from{opacity:0}to{opacity:1}}',
            '@keyframes ancEntree{from{opacity:0;transform:translateY(18px) scale(.94)}to{opacity:1;transform:none}}',
            '@media (max-width:640px){#edteam-annonce{align-items:flex-start}#edteam-annonce .anc-boite{padding:16px 14px 14px}#edteam-annonce .anc-eti{letter-spacing:2px;font-size:.7em;padding:3px 10px}#edteam-annonce .anc-titre{font-size:1.1em;letter-spacing:1.5px;margin:12px 0 4px}#edteam-annonce .anc-sous{font-size:.8em;letter-spacing:1px}#edteam-annonce .anc-intro{font-size:.82em;margin-top:10px;line-height:1.5}#edteam-annonce .anc-etapes{grid-template-columns:minmax(0,1fr);gap:8px;margin-top:14px}#edteam-annonce .anc-etape{display:grid;grid-template-columns:28px minmax(0,1fr);column-gap:10px;padding:8px 10px}#edteam-annonce .anc-n{grid-row:1/3}#edteam-annonce .anc-et{margin-top:0;font-size:.76em}#edteam-annonce .anc-ed{margin-top:3px;font-size:.74em;line-height:1.4}#edteam-annonce .anc-actions{margin-top:14px;gap:8px}#edteam-annonce .anc-btn{width:100%;padding:11px 10px;font-size:.9em}#edteam-annonce .anc-aide{margin-top:8px;font-size:.68em}}',
            '#edteam-annonce .anc-nav{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:22px;flex-wrap:wrap}',
            '#edteam-annonce .anc-pts{display:flex;gap:8px} #edteam-annonce .anc-pts i{width:10px;height:10px;border-radius:50%;border:1px solid var(--anc);background:transparent;transition:.2s} #edteam-annonce .anc-pts i.on{background:var(--anc);box-shadow:0 0 10px var(--anc)}',
            '#edteam-annonce .anc-page{animation:ancEntree .35s ease both} #edteam-annonce .anc-page[hidden]{display:none}',
            '#edteam-annonce .anv-ecran{margin-top:18px;border:1px solid color-mix(in srgb,var(--anc) 35%,transparent);background:#070a0e;padding:12px 14px;text-align:left;font-size:.8em}',
            '#edteam-annonce .anv-cap{color:#667;letter-spacing:3px;font-size:.72em;margin-bottom:8px} #edteam-annonce .anv-t{color:#00F0FF;letter-spacing:3px;font-size:.7em;margin:10px 0 5px}',
            '#edteam-annonce .anv-tete{text-align:right;color:#889;font-size:.68em;letter-spacing:2px;margin:-6px 4px 4px}',
            '#edteam-annonce .anv-lg{display:grid;grid-template-columns:150px minmax(0,1fr) 150px 120px 110px;gap:12px;align-items:center;padding:9px 12px;margin-top:5px;border-left:4px solid var(--k);background:linear-gradient(90deg,color-mix(in srgb,var(--k) 15%,#0a0c10),#0a0c10 72%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.04)}',
            '#edteam-annonce .anv-tag{border:1px solid var(--k);color:var(--k);padding:2px 8px;font-size:.78em;letter-spacing:1px;white-space:nowrap;text-align:center} #edteam-annonce .anv-nm{color:#8a949c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis} #edteam-annonce .anv-nm b{color:#fff;letter-spacing:2px}',
            '#edteam-annonce .anv-val{color:#fff;white-space:nowrap} #edteam-annonce .anv-val em{font-style:normal}',
            '#edteam-annonce .anv-jg{position:relative;display:block;height:10px;background:#0c1116;border:1px solid #1f2a31} #edteam-annonce .anv-jg i{position:absolute;left:0;top:0;bottom:0;background:#6f8196;opacity:.75} #edteam-annonce .anv-jg b{position:absolute;top:0;bottom:0} #edteam-annonce .anv-jg b.g{background:#2fe07a;box-shadow:0 0 8px #2fe07a} #edteam-annonce .anv-jg b.p{background:repeating-linear-gradient(45deg,#ff4d4d 0 3px,#7a2020 3px 6px)} #edteam-annonce .anv-jg u{position:absolute;top:-3px;bottom:-3px;width:2px;background:#fff;text-decoration:none}',
            '#edteam-annonce .anv-zb{position:relative;display:flex;height:10px;margin:4px 0} #edteam-annonce .anv-zb .z{flex:1;background:var(--c);opacity:.8;margin-right:2px} #edteam-annonce .anv-zb em{position:absolute;font-style:normal;font-size:12px;line-height:1;transform:translateX(-50%)} #edteam-annonce .anv-zb em.b{top:-13px;color:#fff} #edteam-annonce .anv-zb em.o{top:10px;color:#ffb000}',
            '#edteam-annonce .anv-lg.pp .anv-zb{margin:10px 0 12px}',
            '#edteam-annonce .anv-pips{display:flex;gap:4px;justify-content:flex-end} #edteam-annonce .anv-pips i{width:22px;height:22px;display:flex;align-items:center;justify-content:center;border:1px solid #2a3540;background:#0c1116;font-style:normal;font-size:.8em;color:#778} #edteam-annonce .anv-pips i.ok{background:#1f9d55;border-color:#2fe07a;color:#fff}',
            '#edteam-annonce .anv-duo{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:18px;text-align:left} #edteam-annonce .anv-fen{border:1px solid #FF7100;background:#0b0907;padding:12px 14px;font-size:.8em} #edteam-annonce .anv-fen.pp{border-color:#8A7CFF}',
            '#edteam-annonce .anv-tuiles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px} #edteam-annonce .anv-ti{padding:8px 10px;border-left:4px solid var(--k);background:linear-gradient(135deg,color-mix(in srgb,var(--k) 16%,#0a0c10),#0a0c10 80%)} #edteam-annonce .anv-ti small{display:block;color:#889;letter-spacing:2px;font-size:.66em} #edteam-annonce .anv-ti b{display:block;color:var(--k);font-size:1.5em;margin:2px 0} #edteam-annonce .anv-ti span{color:#889;font-size:.72em}',
            '#edteam-annonce .anv-bar{display:flex;height:5px;gap:0;margin-top:5px;background:#111} #edteam-annonce .anv-bar.big{height:14px;margin:0 0 4px} #edteam-annonce .anv-bar i{display:block}',
            '#edteam-annonce .anv-pa{display:flex;align-items:center;gap:10px;padding:8px 10px;margin-top:6px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.02)} #edteam-annonce .anv-av{flex:none;width:34px;height:34px;border-radius:50%;border:1px solid #FF7100;background:radial-gradient(circle,#2a1608,#0a0603);color:#FF9A1F;display:flex;align-items:center;justify-content:center;font-weight:bold;letter-spacing:1px} #edteam-annonce .anv-fen.pp .anv-av{border-color:#8A7CFF;color:#b6adff;background:radial-gradient(circle,#1a1330,#08060f)}',
            '#edteam-annonce .anv-pm{flex:1;min-width:0} #edteam-annonce .anv-l1{display:flex;justify-content:space-between;gap:8px;color:#8a949c;font-size:.9em} #edteam-annonce .anv-l1 b{color:#fff;letter-spacing:1px}',
            '#edteam-annonce .anv-tk{display:flex;gap:3px;margin-top:5px} #edteam-annonce .anv-tk i{width:9px;height:9px;border:1px solid #3a4650;background:#0a0f13} #edteam-annonce .anv-tk i.ok{background:#2fe07a;border-color:#2fe07a}',
            '#edteam-annonce .anv-ent{display:flex;align-items:center;gap:12px;margin-bottom:6px} #edteam-annonce .anv-por{flex:none;width:46px;height:46px;border-radius:50%;border:1px solid #9a5fc0;background:radial-gradient(circle,#241338,#08060f);color:#b6adff;display:flex;align-items:center;justify-content:center;font-size:1.4em} #edteam-annonce .anv-badge{border:1px solid #9a5fc0;background:#9a5fc033;color:#fff;padding:2px 12px;letter-spacing:3px;font-weight:bold} #edteam-annonce .anv-sm{color:#aab;margin-top:5px;font-size:.9em}',
            '#edteam-annonce .anv-ph{padding:8px 12px;margin:8px 0 14px;border-left:4px solid #2fe07a;background:linear-gradient(90deg,#2fe07a22,#0a0c10 72%);color:#e6eef2}',
            '#edteam-annonce .anv-vues{display:flex;justify-content:center;gap:0;margin-bottom:10px} #edteam-annonce .anv-vues span{border:1px solid #3a4a55;color:#9ab;padding:6px 16px;letter-spacing:2px;font-size:.78em;margin-left:-1px} #edteam-annonce .anv-vues span.on{border-color:#00F0FF;color:#00F0FF;background:rgba(0,240,255,.16);box-shadow:0 0 14px rgba(0,240,255,.35);position:relative}',
            '#edteam-annonce .anv-svg{width:100%;height:auto;display:block;background:radial-gradient(ellipse at 50% 45%,#0b1722 0%,#05080c 70%);border:1px solid #16303d} #edteam-annonce .anv-svg text{font-family:inherit}',
            '#edteam-annonce .anv-leg{display:flex;flex-wrap:wrap;gap:6px 18px;justify-content:center;margin-top:10px;color:#9ab;font-size:.74em} #edteam-annonce .anv-leg i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px} #edteam-annonce .anv-leg i.lz{background:transparent;border:1.5px solid #8A7CFF;border-radius:0;transform:rotate(45deg) scale(.8)} #edteam-annonce .anv-leg i.clig{animation:anvBlink 1s ease-in-out infinite}',
            '@keyframes anvBlink{0%,100%{opacity:1}50%{opacity:.22}} @keyframes anvPulse{0%{transform:scale(.7);opacity:.9}100%{transform:scale(2.8);opacity:0}}',
            '#edteam-annonce .anv-al .pt{animation:anvBlink var(--d,1s) ease-in-out infinite} #edteam-annonce .anv-al .rg{transform-box:fill-box;transform-origin:center;animation:anvPulse var(--d,1s) ease-out infinite}',
            '@media (max-width:900px){#edteam-annonce .anv-lg{grid-template-columns:110px minmax(0,1fr) 90px}#edteam-annonce .anv-lg .anv-jg,#edteam-annonce .anv-lg .anv-zb,#edteam-annonce .anv-lg .anv-pips{display:none}#edteam-annonce .anv-duo{grid-template-columns:1fr}}',
            '@media (prefers-reduced-motion:reduce){#edteam-annonce .anv-al .pt,#edteam-annonce .anv-al .rg,#edteam-annonce .anv-leg i.clig,#edteam-annonce .anc-page{animation:none}}',
            '#edteam-annonce .anvd-svg{width:100%;height:auto;display:block;background:radial-gradient(ellipse at 50% 50%,#08161a 0%,#04080a 75%);border:1px solid #14343a} #edteam-annonce .anvd-svg text{font-family:inherit}',
            '#edteam-annonce .anvd-fl{stroke-dasharray:10 8;animation:anvdFl 1.1s linear infinite} @keyframes anvdFl{to{stroke-dashoffset:-18}}',
            '#edteam-annonce .anvd-pl{transform-box:fill-box;transform-origin:center;animation:anvdPl 2.2s ease-in-out infinite} @keyframes anvdPl{0%,100%{opacity:.7;transform:scale(1)}50%{opacity:1;transform:scale(1.07)}}',
            '#edteam-annonce .anvd-cmp{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px;text-align:left;font-size:.82em} #edteam-annonce .anvd-cmp>div{padding:10px 14px;border:1px solid #2a3540;background:#0a0e12} #edteam-annonce .anvd-cmp b{display:block;letter-spacing:2px;font-size:.9em;margin-bottom:4px} #edteam-annonce .anvd-cmp .non b{color:#8a949c} #edteam-annonce .anvd-cmp .oui{border-color:#00FF66;background:rgba(0,255,102,.10)} #edteam-annonce .anvd-cmp .oui b{color:#00FF66} #edteam-annonce .anvd-cmp u{text-decoration:none;color:#fff;font-weight:bold}',
            '#edteam-annonce .anvd-ui{max-width:760px;margin:0 auto;text-align:left;font-size:.84em} #edteam-annonce .anvd-tg{display:flex;align-items:center;gap:10px;margin-bottom:12px;color:#9ab} #edteam-annonce .anvd-tg i{width:30px;height:16px;border-radius:9px;background:rgba(0,255,102,.35);position:relative;display:inline-block} #edteam-annonce .anvd-tg i:after{content:"";position:absolute;top:2px;left:16px;width:12px;height:12px;border-radius:50%;background:#00FF66} #edteam-annonce .anvd-tg b{color:#00FF66;letter-spacing:2px;font-weight:normal} #edteam-annonce .anvd-tg span{color:#FFD700}',
            '#edteam-annonce .anvd-rt{border:2px solid #00FF66;background:linear-gradient(135deg,rgba(0,255,102,.14),#050806 70%);padding:12px 14px;animation:anvdGlow 2.2s ease-in-out infinite} @keyframes anvdGlow{0%,100%{box-shadow:0 0 0 rgba(0,255,102,0)}50%{box-shadow:0 0 22px rgba(0,255,102,.55)}}',
            '#edteam-annonce .anvd-rt .b{padding:7px 10px;background:rgba(0,255,102,.16);border:1px solid #00FF66;color:#c9f5da;letter-spacing:1px;text-align:center} #edteam-annonce .anvd-rt .b b{color:#00FF66;font-weight:normal;animation:anvBlink 1.4s ease-in-out infinite}',
            '#edteam-annonce .anvd-rt .l{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-top:10px;padding-left:10px;border-left:3px solid var(--j)} #edteam-annonce .anvd-rt .l.a{--j:#00F0FF} #edteam-annonce .anvd-rt .l.r{--j:#FFB000} #edteam-annonce .anvd-rt .l i{font-style:normal;color:var(--j);border:1px solid var(--j);padding:1px 8px;letter-spacing:2px;font-size:.85em} #edteam-annonce .anvd-rt .l b{color:#fff;font-weight:normal;letter-spacing:2px} #edteam-annonce .anvd-rt .l span{margin-left:auto;color:#00FF66} #edteam-annonce .anvd-rt .l em{font-style:normal;color:#FFD700}',
            '#edteam-annonce .anvd-rt .bil{margin-top:12px;padding-top:8px;border-top:1px dashed rgba(0,255,102,.35)} #edteam-annonce .anvd-rt .bil small{display:block;color:#8a9;letter-spacing:2px;font-size:.8em} #edteam-annonce .anvd-rt .bil b{color:#00FF66;font-size:1.9em;font-weight:normal;letter-spacing:1px}',
            '@media (max-width:900px){#edteam-annonce .anvd-cmp{grid-template-columns:1fr}} @media (prefers-reduced-motion:reduce){#edteam-annonce .anvd-fl,#edteam-annonce .anvd-pl,#edteam-annonce .anvd-rt,#edteam-annonce .anvd-rt .b b{animation:none}}',
            '@media (prefers-reduced-motion:reduce){#edteam-annonce,#edteam-annonce .anc-boite{animation:none}}'
        ].join('\n');
        document.head.appendChild(st);
    }

    // annonce a plusieurs pages : une page visible a la fois, boutons PRECEDENT / SUIVANT, points de progression ; le bouton principal et « J'AI COMPRIS » sont a la derniere page
    function monterPages(ov, a, uid, aller) {
        var n = a.pages.length, cur = 0;
        var pages = a.pages.map(function (p, i) {
            return '<div class="anc-page" data-p="' + i + '"' + (i ? ' hidden' : '') + '>'
                + '<span class="anc-eti">' + esc(a.etiquette) + ' · ' + (i + 1) + ' / ' + n + '</span>'
                + '<div class="anc-titre">' + esc(p.titre) + '</div><div class="anc-sous">' + esc(p.sous) + '</div><div class="anc-intro">' + p.intro + '</div>'
                + (p.visuelHtml ? '<div class="anc-visuel">' + (typeof p.visuelHtml === 'function' ? p.visuelHtml() : p.visuelHtml) + '</div>' : '')
                + '<div class="anc-etapes" style="--anc-cols:' + (p.colonnes || 3) + '">' + p.etapes.map(function (e) { return '<div class="anc-etape"><span class="anc-n">' + esc(e.n) + '</span><div class="anc-et">' + esc(e.t) + '</div><div class="anc-ed">' + e.d + '</div></div>'; }).join('') + '</div>'
                + (p.avis ? '<div class="anc-avis">' + p.avis + '</div>' : '') + '</div>';
        }).join('');
        ov.innerHTML = '<div class="anc-boite plein">' + pages
            + '<div class="anc-nav"><button type="button" class="anc-btn gris" data-a="prec">◀ PRÉCÉDENT</button><span class="anc-pts">' + a.pages.map(function (p, i) { return '<i data-i="' + i + '"></i>'; }).join('') + '</span><button type="button" class="anc-btn" data-a="suiv">SUIVANT ▶</button><button type="button" class="anc-btn" data-a="go">' + esc(a.cta) + '</button></div>'
            + '<div class="anc-actions" style="margin-top:12px"><button type="button" class="anc-btn gris" data-a="fermer">J’AI COMPRIS</button></div><div class="anc-aide">' + esc(a.aide) + '</div></div>';
        var boite = ov.querySelector('.anc-boite');
        function afficher(i) {
            cur = Math.max(0, Math.min(n - 1, i));
            [].forEach.call(ov.querySelectorAll('.anc-page'), function (e) { e.hidden = Number(e.getAttribute('data-p')) !== cur; });
            [].forEach.call(ov.querySelectorAll('.anc-pts i'), function (e) { e.className = Number(e.getAttribute('data-i')) === cur ? 'on' : ''; });
            ov.querySelector('[data-a="prec"]').style.visibility = cur === 0 ? 'hidden' : 'visible';
            ov.querySelector('[data-a="suiv"]').style.display = cur === n - 1 ? 'none' : '';
            ov.querySelector('[data-a="go"]').style.display = cur === n - 1 ? '' : 'none';
            boite.scrollTop = 0;
        }
        function fermer(vaVoir) {
            var vues = lire(uid); if (vues.indexOf(a.id) < 0) vues.push(a.id); ecrire(uid, vues);
            document.removeEventListener('keydown', clavier);
            if (ov.parentNode) ov.parentNode.removeChild(ov);
            if (vaVoir) { if (typeof a.action === 'function') a.action(); else if (a.lien) window.location.href = a.lien; else if (typeof aller === 'function') aller(); }
        }
        function clavier(e) { if (e.key === 'Escape') fermer(false); else if (e.key === 'ArrowRight') afficher(cur + 1); else if (e.key === 'ArrowLeft') afficher(cur - 1); }
        ov.querySelector('[data-a="prec"]').addEventListener('click', function () { afficher(cur - 1); });
        ov.querySelector('[data-a="suiv"]').addEventListener('click', function () { afficher(cur + 1); });
        ov.querySelector('[data-a="go"]').addEventListener('click', function () { fermer(true); });
        ov.querySelector('[data-a="fermer"]').addEventListener('click', function () { fermer(false); });
        [].forEach.call(ov.querySelectorAll('.anc-pts i'), function (e) { e.style.cursor = 'pointer'; e.addEventListener('click', function () { afficher(Number(e.getAttribute('data-i'))); }); });
        document.addEventListener('keydown', clavier);
        afficher(0);
        document.body.appendChild(ov);
    }

    function monter(a, uid, aller) {
        css();
        var ov = document.createElement('div');
        ov.id = 'edteam-annonce';
        ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', a.titre);
        ov.style.setProperty('--anc', a.couleur);
        if (a.colonnes) ov.style.setProperty('--anc-cols', a.colonnes);
        if (a.pages) { monterPages(ov, a, uid, aller); return; }
        ov.innerHTML = '<div class="anc-boite' + (a.plein ? ' plein' : '') + '">'
            + '<span class="anc-eti">' + esc(a.etiquette) + '</span>'
            + '<div class="anc-titre">' + esc(a.titre) + '</div>'
            + '<div class="anc-sous">' + esc(a.sous) + '</div>'
            + '<div class="anc-intro">' + a.intro + '</div>'
            + '<div class="anc-visuel"></div>'
            + '<div class="anc-etapes">' + a.etapes.map(function (e) { return '<div class="anc-etape"><span class="anc-n">' + esc(e.n) + '</span><div class="anc-et">' + esc(e.t) + '</div><div class="anc-ed">' + e.d + '</div></div>'; }).join('') + '</div>'
            + (a.galerie ? '<div class="anc-gal">' + a.galerie.map(function (g) { return '<div class="anc-nef"><img src="' + esc(g[1]) + '" alt="' + esc(g[0]) + '" loading="lazy"><span>' + esc(g[0]).toUpperCase() + '</span></div>'; }).join('') + '</div>'
                + '<div class="anc-aven"><b>' + a.aVenir + '</b><p><strong>vaisseaux encore à faire.</strong> Ils arriveront plus tard. ' + a.galerie.length + ' vaisseaux sont déjà modélisés, sur ' + (a.galerie.length + a.aVenir) + ' au total.</p><div class="anc-barre"><i style="width:' + (100 * a.galerie.length / (a.galerie.length + a.aVenir)).toFixed(1) + '%"></i></div></div>' : '')
            + (a.avis ? '<div class="anc-avis">' + a.avis + '</div>' : '')
            + '<div class="anc-actions"><button type="button" class="anc-btn" data-a="go">' + esc(a.cta) + '</button><button type="button" class="anc-btn gris" data-a="fermer">J’AI COMPRIS</button></div>'
            + '<div class="anc-aide">' + esc(a.aide) + '</div></div>';
        if (typeof a.visuel === 'function') {          // visuel construit a la demande (hologrammes charges a l\'ouverture) : l\'annonce s\'affiche sans l\'attendre
            a.visuel().then(function (h) { var z = ov.querySelector('.anc-visuel'); if (z && h) { z.innerHTML = h; if (typeof a.visuelApres === 'function') a.visuelApres(); } }).catch(function () { /* sans visuel */ });
        }
        function fermer(vaVoir) {
            var vues = lire(uid); if (vues.indexOf(a.id) < 0) vues.push(a.id); ecrire(uid, vues);
            document.removeEventListener('keydown', clavier);
            if (ov.parentNode) ov.parentNode.removeChild(ov);
            if (vaVoir) { if (typeof a.action === 'function') a.action(); else if (a.lien) window.location.href = a.lien; else if (typeof aller === 'function') aller(); }
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
