// Journal des nouveautes de SYS.EDTEAM : UNE entree par changement visible pour les pilotes, en langage simple ("ce qui change pour vous").
// Affichage : bouton "Nouveautes" du pied de page (groupe par cycle : du jeudi 07:00 UTC au jeudi suivant).
// Discord : un resume par semaine (tache GitHub, jeudi 08:00 UTC), voir .github/workflows/nouveautes-discord.yml.
// Champs : id (unique), date (ISO UTC), type (NOUVEAU | AMELIORE | CORRIGE), titre, texte,
//          important (true = petite carte discrete a l'ouverture du QG), action (texte "action requise", facultatif).
window.EDTEAM_NOUVEAUTES = [
    {
        id: '2026-10-accueil-bgs', date: '2026-10-02T23:30:00Z', type: 'AMELIORE',
        titre: 'BGS : un nouvel accueil centré sur votre engagement',
        texte: 'La page BGS s\'ouvre maintenant sur un onglet ACCUEIL (l\'ancien onglet MISSIONS). À gauche, votre rang BGS, votre progression et vos points de la semaine, avec le rappel que chaque action pour votre faction d\'escadron compte, avec ou sans mission de l\'Amiral, un volet « Ma progression » (vos points des 8 dernières semaines, sans quitter la page), un aperçu de vos médailles de campagne et un lien vers votre fiche pilote où brillent vos plaques d\'états de service. À droite, le Pilier de la semaine est mis à l\'honneur ; en dessous, les chiffres de la semaine de l\'escadron (points, pilotes actifs, votre part, trois premiers). Les directives de l\'Amiral sont regroupées sous « Focus de l\'Amiral » avec leurs jauges habituelles : elles sont facultatives et donnent droit à une distinction à leur clôture. Un encart « Comment ça marche » repliable complète le tout. Par ailleurs, l\'onglet SUIVI D\'INFLUENCE est masqué pour le moment : si vous l\'utilisiez, dites-le à l\'équipe.',
        important: false
    },
    {
        id: '2026-10-colonisation-largeur', date: '2026-10-02T23:00:00Z', type: 'AMELIORE',
        titre: 'Colonisation : blocs plus larges à droite de la carte',
        texte: 'Sur la page Colonisation, la carte est un peu moins large pour laisser plus de place aux blocs « À apporter en priorité » et « Architectes de l\'escadron » : leurs lignes tiennent maintenant sur une seule ligne. Les bulles de la carte tiennent aussi compte de la place de leur texte, ce qui évite qu\'elles se recouvrent.',
        important: false
    },
    {
        id: '2026-10-colonisation-noms', date: '2026-10-02T22:30:00Z', type: 'CORRIGE',
        titre: 'Colonisation : un seul nom par produit partout',
        texte: 'Dans la fenêtre de détail d\'un système, dans le détail des livraisons par pilote et dans le journal, un même produit pouvait s\'afficher sous deux noms (par exemple « Acier » et « Steel ») selon la langue du jeu du pilote qui avait relevé le chantier ou la livraison. Chaque produit porte maintenant le même nom partout, et la recherche du journal trouve les livraisons quelle que soit la langue du jeu.',
        important: false
    },
    {
        id: '2026-10-carte-grappes', date: '2026-10-02T21:00:00Z', type: 'AMELIORE',
        titre: 'Colonisation : une carte galactique lisible, même avec des dizaines de systèmes',
        texte: 'Sur la carte de la page Colonisation, les systèmes très proches ne se chevauchent plus : ils sont regroupés en une bulle qui indique leur nombre, le total de stations terminées et de chantiers, et un anneau orange/vert pour la part de systèmes en chantier. Un clic sur une bulle zoome dessus, et elle se défait au fil du zoom. Les noms ne s\'affichent que là où la place le permet (les autres systèmes restent des points, avec leur détail au survol), et le filtre EN CHANTIER / TERMINÉS ainsi que le repérage des matériaux fonctionnent aussi sur les bulles.',
        important: false
    },
    {
        id: '2026-10-colonisation-priorites', date: '2026-10-02T19:30:00Z', type: 'CORRIGE',
        titre: 'Colonisation : « À apporter en priorité » ne compte plus un produit deux fois',
        texte: 'Dans la liste « À apporter en priorité », un même produit pouvait apparaître deux fois avec deux totaux partiels (par exemple Acier et Steel), selon que le jeu du pilote qui avait relevé le chantier était en français ou en anglais. Ces lignes sont maintenant regroupées : chaque produit n\'apparaît qu\'une fois, avec le total exact à apporter, ce qui corrige aussi l\'ordre des priorités.',
        important: false
    },
    {
        id: '2026-10-journal-bgs-points', date: '2026-10-02T18:30:00Z', type: 'AMELIORE',
        titre: 'BGS : le journal montre les points de rang que chaque action rapporte',
        texte: 'Dans le journal des exploits de la page BGS, une nouvelle colonne « RANG BGS » indique les points de carrière que chaque action rapporte (missions, influence, crédits, livraisons de colonisation…) : ce sont ces points, cumulés, qui font monter votre rang BGS. Un bandeau en haut du journal rappelle la règle et affiche votre rang, vos points et ce qu\'il reste avant le prochain rang, avec un lien vers votre progression détaillée dans le Quartier général.',
        important: false
    },
    {
        id: '2026-10-journal-colonisation', date: '2026-10-02T17:30:00Z', type: 'AMELIORE',
        titre: 'Colonisation : le journal des livraisons se feuillette et se filtre',
        texte: 'Le journal des livraisons de la page Colonisation ne se limite plus aux dernières lignes : le bouton AGRANDIR ouvre tout l\'historique, par pages de 50, avec des filtres par type, par commandant et une recherche (marchandise, station, système). On retrouve ainsi les livraisons de chaque pilote, même quand un autre en a relevé des milliers d\'un coup. L\'année est maintenant affichée dans les dates (aussi dans le journal du BGS), et les livraisons d\'avant le 01/10/2026 (qui ne rapportent pas de points BGS) sont grisées.',
        important: false
    },
    {
        id: '2026-10-recrue', date: '2026-10-01T22:24:00Z', type: 'AMELIORE',
        titre: 'Escadron : les recrues sont signalées dans la liste des membres',
        texte: 'Dans la liste des membres de l\'escadron (PC et mobile), un badge RECRUE apparaît à côté des pilotes dont le rang en jeu est encore « Recrue ». Ils n\'ont pas accès aux pages d\'escadron tant qu\'un officier ne les a pas passés PILOTE dans le jeu : l\'Amiral sait ainsi qui il doit faire basculer. Le badge se met à jour tout seul au prochain lancement du jeu du pilote concerné.',
        important: false
    },
    {
        id: '2026-10-architecte', date: '2026-10-01T21:02:00Z', type: 'AMELIORE',
        titre: 'Colonisation : les systèmes et constructions de chaque architecte',
        texte: 'Sur la page Colonisation, un clic sur un architecte (dans le bloc « Architectes de l\'escadron », ou sur son nom dans la fenêtre d\'un système) ouvre la liste de tous ses systèmes, avec pour chacun ses installations terminées et ses chantiers en cours (avancement et reste à livrer). Chaque système a un bouton COPIER pour son nom, un bouton pour le voir sur la carte et un bouton pour ouvrir son détail. Au survol d\'un architecte, ses systèmes s\'entourent d\'or sur la carte.',
        important: false
    },
    {
        id: '2026-10-espaces', date: '2026-10-01T20:05:00Z', type: 'AMELIORE',
        titre: 'Espacement harmonisé entre les cadres',
        texte: 'L\'espace entre les cadres est maintenant le même sur toutes les pages (Quartier général, BGS, Escadron, Diplomatie, Colonisation, Budget), pour une présentation plus régulière. Rien ne change dans le fonctionnement.',
        important: false
    },
    {
        id: '2026-10-carte-zoom', date: '2026-10-01T19:54:00Z', type: 'AMELIORE',
        titre: 'Colonisation : carte agrandie avec zoom, liste des systèmes et journal repensé',
        texte: 'Sur la carte de la page Colonisation, vous pouvez maintenant zoomer à la molette (ou avec les boutons + et −), déplacer la carte en la faisant glisser, et revenir à la vue d\'ensemble avec le bouton TOUT. Une liste déroulante « SYSTÈME… », à côté des filtres, permet d\'aller directement à un système : la carte se centre dessus, il est repéré, et sa fenêtre de détail s\'ouvre. Pratique quand plusieurs systèmes sont très proches les uns des autres. La carte est aussi plus grande : elle occupe toute la colonne de gauche, avec « À apporter en priorité » puis les architectes à droite. Le journal des livraisons passe en pleine largeur sous les deux colonnes, une ligne par entrée, avec un bouton [ AGRANDIR ] qui l\'ouvre en plein écran, comme le journal de la page BGS. Enfin, en survolant un matériau de « À apporter en priorité », les systèmes qui en ont besoin s\'entourent d\'or sur la carte ; un clic liste les chantiers concernés, avec ce qu\'il reste à livrer et un bouton COPIER pour le nom du système (à coller dans la recherche de la carte galactique du jeu).',
        important: false
    },
    {
        id: '2026-10-beta', date: '2026-10-01T18:49:00Z', type: 'AMELIORE',
        titre: 'Une pastille « BÊTA » dans l\'en-tête',
        texte: 'SYS.EDTEAM est encore en version bêta : de nouvelles pages arrivent régulièrement et des bugs peuvent subsister. Une pastille « BÊTA » est maintenant visible à côté du nom, sur PC comme sur mobile. Si vous rencontrez un souci, cliquez dessus pour rejoindre le Discord et nous le signaler : cela nous aide à corriger plus vite.',
        important: false
    },
    {
        id: '2026-10-colonisation-types', date: '2026-10-01T18:48:00Z', type: 'AMELIORE',
        titre: 'Colonisation : le type de chaque installation',
        texte: 'La page Colonisation (PC et mobile) indique maintenant le type de chaque construction, reconnu d\'après la liste des marchandises qu\'elle demande : par exemple Mining Outpost, Relay Station ou Security Station. Quand plusieurs types demandent exactement les mêmes marchandises (c\'est le cas des avant-postes), seule la famille est affichée, par exemple « Avant-poste orbital ». Quand la liste ne permet pas de savoir, rien n\'est affiché. Rien à faire de votre côté. Un grand merci à CMDR DaftMav, dont la feuille communautaire « Colonization Construction » a fourni les recettes de chaque type d\'installation.',
        important: false
    },
    {
        id: '2026-10-colonisation-points', date: '2026-10-01T18:47:00Z', type: 'AMELIORE',
        titre: 'La colonisation compte pour votre rang BGS',
        texte: 'Vos livraisons de colonisation rapportent désormais des points de carrière : 1 point pour 400 tonnes livrées, comme les autres efforts BGS (elles comptent aussi pour le Pilier de la semaine). Seules les livraisons faites à partir du 1er octobre comptent. Quand une construction de l\'escadron se termine, une ligne verte « STATION TERMINÉE » apparaît dans le journal tactique. Il faut le plugin SYS_EDTEAM 2.5 : la mise à jour se fait toute seule au prochain lancement d\'EDMC.',
        important: false
    },
    {
        id: '2026-10-menu', date: '2026-10-01T18:46:00Z', type: 'AMELIORE',
        titre: 'Menu réorganisé, Communications en haut à droite',
        texte: 'Le menu latéral suit maintenant l\'ordre : Quartier général, Budget, Escadron, Diplomatie, BGS, Colonisation. Communications passe en haut à droite, à côté de l\'interrupteur de son, avec une icône de discussion qui clignote bien visiblement quand un message arrive.',
        important: false
    },
    {
        id: '2026-10-budget', date: '2026-10-01T18:45:00Z', type: 'NOUVEAU',
        titre: 'Nouvelle page Budget',
        texte: 'Une page Budget, dans le menu latéral, montre ce que vous avez gagné et dépensé : revenus, charges et résultat net par cycle (du jeudi au jeudi), la répartition sous forme d\'anneaux, la comparaison avec le cycle d\'avant, et le lien avec votre solde du jeu. Le livre de compte détaille chaque mouvement des 8 derniers cycles, avec filtres, recherche et export CSV. Votre budget est strictement personnel : vous seul le voyez. Il est aussi disponible sur le compagnon mobile. Tout est relevé automatiquement par le plugin SYS_EDTEAM 2.5, rien à saisir.',
        important: false
    },
    {
        id: '2026-10-colonisation', date: '2026-10-01T18:44:00Z', type: 'NOUVEAU',
        titre: 'Nouvelle page Colonisation',
        texte: 'Une page Colonisation, dans le menu latéral, montre les systèmes colonisés par les pilotes de l\'escadron sur une carte (commune à tous ses membres ; un pilote sans escadron a son propre espace personnel, que lui seul voit, et qu\'il peut verser à l\'escadron s\'il en rejoint un), leurs constructions terminées et leurs chantiers en cours (progression de chaque marchandise, qui a livré quoi), le classement des architectes, ce qu\'il faut apporter en priorité et le journal des livraisons. Chaque système indique son architecte et la faction qui le contrôle ; la fiche d\'un pilote architecte affiche aussi ses systèmes, ses stations terminées et ses chantiers en cours. La page est aussi disponible sur le compagnon mobile. Tout est relevé automatiquement par le plugin SYS_EDTEAM 2.5 : rien à saisir. La mise à jour se fait toute seule au prochain lancement d\'EDMC.',
        important: true,
        action: 'Redémarrez EDMC une fois la mise à jour terminée'
    },
    {
        id: '2026-09-30-plugin-2-4', date: '2026-09-30T21:40:00Z', type: 'NOUVEAU',
        titre: 'Plugin SYS_EDTEAM 2.4 : mérites Powerplay à jour',
        texte: 'Le plugin relève vos mérites Powerplay au plus toutes les cinq minutes et retrouve, au démarrage, l\'historique de vos cycles passés à partir de vos journaux de jeu : votre progression par cycle se remplit donc même pour les semaines jouées sans EDMC. Coller une nouvelle clé dans les paramètres du plugin est désormais pris en compte sans relancer EDMC. La mise à jour se fait toute seule au prochain lancement d\'EDMC.',
        important: true,
        action: 'Redémarrez EDMC une fois la mise à jour terminée'
    },
    {
        id: '2026-09-30-mobile', date: '2026-09-30T19:00:00Z', type: 'AMELIORE',
        titre: 'Version mobile remise à niveau',
        texte: 'Le compagnon mobile retrouve les nouveautés du site : votre rang BGS et votre progression Powerplay (avec le classement de l\'escadron), un espace Nouveautés, et un QG réorganisé (identité, carrière, communications, rangs et finances repliables). Les membres d\'un escadron disposent d\'un nouvel onglet Escadron, qui liste les pilotes avec leur rang BGS. La fiche d\'un pilote affiche désormais son rang BGS et son statut Powerplay. Le bas du QG donne accès à l\'Aide / FAQ et à l\'interrupteur de son.',
        important: false
    },
    {
        id: '2026-09-30-performance', date: '2026-09-30T14:12:00Z', type: 'AMELIORE',
        titre: 'QG plus léger pour votre ordinateur',
        texte: 'Les halos lumineux qui pulsent sur l\'accueil (Renseignement tactique, pastille « En ligne ») sont désormais dessinés sans redessin permanent : le QG consomme quasiment rien au repos, là où il occupait une part notable d\'un cœur du processeur.',
        important: false
    },
    {
        id: '2026-09-30-rang-bgs', date: '2026-09-30T13:30:00Z', type: 'NOUVEAU',
        titre: 'Rang BGS de carrière (1 à 100)',
        texte: 'Chaque effort accompli pour l\'escadron rapporte des points qui s\'additionnent pour toute votre carrière et déterminent votre rang BGS, de 1 à 100. Un rang gagné ne se perd jamais. Un nouveau bouton BGS, à côté de Powerplay sur le QG, ouvre votre progression, vos points par semaine et le classement de l\'escadron.',
        important: false
    },
    {
        id: '2026-09-30-powerplay', date: '2026-09-30T10:55:00Z', type: 'AMELIORE',
        titre: 'Powerplay : mérites du cycle et historique',
        texte: 'Le site distingue désormais vos mérites du cycle de votre cumul, garde l\'historique de vos cycles (« Ma progression ») et indique l\'heure du dernier relevé. Le tableau des partisans affiche le cycle et le cumul. Tant qu\'un cycle n\'est pas mesuré, vous verrez « — » : c\'est normal.',
        important: false
    },
    {
        id: '2026-09-30-fiche', date: '2026-09-30T15:40:00Z', type: 'AMELIORE',
        titre: 'Fiche pilote : rangs BGS et Powerplay',
        texte: 'La fiche d\'un pilote affiche son rang BGS avec sa progression et son statut Powerplay, et la liste de l\'escadron montre le rang de chacun. Le patrimoine n\'apparaît plus sur les fiches.',
        important: false
    },
    {
        id: '2026-09-30-confidentialite', date: '2026-09-30T16:20:00Z', type: 'AMELIORE',
        titre: 'Confidentialité renforcée',
        texte: 'Vos soldes, votre clé de liaison et vos données de jeu ne sont lisibles que par vous : les autres membres de votre escadron ne voient plus que votre fiche (rangs, plaques, distinctions).',
        important: false
    },
    {
        id: '2026-09-30-aide', date: '2026-09-30T19:10:00Z', type: 'NOUVEAU',
        titre: 'Aide, Discord et compagnon mobile en bas de page',
        texte: 'Un pied de page présent sur toutes les pages regroupe le Discord, l\'Aide / FAQ (avec recherche) et le compagnon mobile (QR code pour l\'ouvrir sur votre téléphone). Le menu latéral accueille désormais la clé EDMC, la gestion du compte et la déconnexion, qui ont quitté l\'en-tête.',
        important: false
    },
    {
        id: '2026-09-30-son', date: '2026-09-30T20:30:00Z', type: 'NOUVEAU',
        titre: 'Interrupteur de son',
        texte: 'Un bouton haut-parleur, en haut à droite et en bas de page, coupe tous les sons du site. Votre choix est mémorisé.',
        important: false
    },
    {
        id: '2026-09-30-alertes', date: '2026-09-30T00:35:00Z', type: 'AMELIORE',
        titre: 'Alertes de messages sur toutes les pages',
        texte: 'Un message urgent s\'affiche en plein écran, un message privé en fenêtre, et l\'enveloppe du menu clignote, où que vous soyez sur le site. Le compagnon mobile lit aussi les transmissions officielles.',
        important: false
    },
    {
        id: '2026-09-30-journal', date: '2026-09-30T00:50:00Z', type: 'AMELIORE',
        titre: 'Journal tactique plus précis',
        texte: 'Les lignes de directives précisent le système, la faction, le type d\'ordre et la priorité. Les annonces manuelles n\'existent plus dans le journal : pour écrire à vos ailiers, utilisez la page Communications.',
        important: false
    },
    {
        id: '2026-09-29-distinctions', date: '2026-09-29T20:00:00Z', type: 'NOUVEAU',
        titre: 'Pilier de la semaine, plaques et Force de frappe',
        texte: 'Chaque jeudi, le pilote qui a le plus investi dans l\'effort de l\'escadron devient le Pilier de la semaine (première désignation jeudi 1er octobre). Les plaques de campagne récompensent le podium de chaque opération sans aucun seuil, et la Force de frappe montre la part de chacun dans l\'effort de l\'escadron.',
        important: false
    }
];
