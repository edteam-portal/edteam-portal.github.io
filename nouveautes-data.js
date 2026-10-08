// Journal des nouveautes de SYS.EDTEAM : UNE entree par changement visible pour les pilotes, en langage simple ("ce qui change pour vous").
// Affichage : bouton "Nouveautes" du pied de page (groupe par cycle : du jeudi 07:00 UTC au jeudi suivant).
// Discord : un resume par semaine (tache GitHub, jeudi 08:00 UTC), voir .github/workflows/nouveautes-discord.yml.
// Champs : id (unique), date (ISO UTC), type (NOUVEAU | AMELIORE | CORRIGE), titre, texte,
//          important (true = petite carte discrete a l'ouverture du QG), action (texte "action requise", facultatif).
window.EDTEAM_NOUVEAUTES = [
    {
        id: '2026-10-echecs-sous-baisse', date: '2026-10-08T20:41:09Z', type: 'AMELIORE',
        titre: 'Missions échouées sous une directive de baisse : elles comptent',
        texte: 'Faire échouer ou abandonner une mission de la faction visée par une directive de baisse est une action offensive : elle rapporte maintenant 1 point de rang BGS et compte pour le titre de l’Exécuteur, avec une ligne en rouge dans le journal des exploits. Au plus 10 échecs par pilote et par jour sont comptés. Partout ailleurs (hausse, élection, sans directive), un échec ne rapporte toujours rien.',
        important: false
    },
    {
        id: '2026-10-paliers-colonisation', date: '2026-10-08T20:40:09Z', type: 'NOUVEAU',
        titre: 'Journal des exploits : les livraisons de colonisation y sont annoncées',
        texte: 'Une ligne apparaît dans le journal des exploits à chaque tranche de 5 000 tonnes livrées par un pilote pour la colonisation (environ quatre allers-retours d’un Panther Clipper), avec une étoile à chaque 50 000 tonnes. Les étiquettes du journal prennent aussi la couleur de la spécialité, comme les lignes. Ceux qui livrent sont ainsi aussi visibles que ceux qui enchaînent les missions. Le filtre « tout l’historique » du journal remonte aussi maintenant jusqu’au début (il s’arrêtait à 30 jours), y compris pour les directives clôturées.',
        important: false
    },
    {
        id: '2026-10-journal-bgs-couleurs', date: '2026-10-08T20:15:00Z', type: 'AMELIORE',
        titre: 'Journal des exploits : couleurs par spécialité et stations terminées',
        texte: 'Dans le journal des exploits du BGS (sur PC et sur mobile), chaque ligne prend maintenant la couleur de la spécialité qu’elle fait progresser, celle du mur des spécialistes : cyan pour la sécurité (Fer de Lance), orange pour les missions (Maître Logisticien), vert pour l’économie (Magnat), violet pour la science, rouge pour les opérations noires (Exécuteur), orange clair pour les zones de conflit (Seigneur de Guerre) et or pour la colonisation (Bâtisseur). Les stations de colonisation terminées apparaissent aussi dans le journal, une ligne par station.',
        important: false
    },
    {
        id: '2026-10-menu-cloche-pied-de-page', date: '2026-10-07T22:03:56Z', type: 'AMELIORE',
        titre: 'Menu plus pratique : cloche des nouveautés, pied de page en bas, compte sur deux colonnes',
        texte: 'La cloche des nouveautés est maintenant dans le menu de gauche, juste au-dessus de la gestion du compte : un point orange vous prévient quand il y a du nouveau. Le pied de page ne reste plus collé en bas de l’écran, il se trouve tout en bas de chaque page et vous laisse toute la place pour le contenu. La fenêtre de gestion du compte s’affiche sur deux colonnes (une seule sur petit écran), votre clé de liaison EDMC tient sur une ligne, et le bouton « Quitter l’escadron » est rangé dans cette fenêtre, au lieu du bas de la page Escadron. Un petit son accompagne aussi l’ouverture de l’anecdote. Rien à faire de votre côté.'
    },
    {
        id: '2026-10-escadron-cartes', date: '2026-10-07T22:02:56Z', type: 'AMELIORE',
        titre: 'Page Escadron : vos camarades en cartes, et des cadres plus soignés',
        texte: 'Les pilotes de l’escadron sont maintenant présentés en cartes de même taille, avec leur portrait, leur rang BGS, leur activité de la semaine, leurs titres et leurs plus belles plaques. Passez la souris sur une carte : elle se soulève comme si vous la tiriez d’un paquet. Les cartes sont classées par nom de commandant (vous pouvez choisir un autre tri). Les cadres de Ma puissance, Ma faction, Quoi faire et de l’anecdote reprennent aussi la finition lumineuse du Pilier et de l’Élan, et réagissent au survol quand ils ouvrent une fenêtre. Rien à faire de votre côté.'
    },
    {
        id: '2026-10-anecdotes-escadron', date: '2026-10-07T18:36:00Z', type: 'NOUVEAU',
        titre: 'Anecdotes de l’escadron : une petite histoire écrite à partir d’un exploit réel',
        texte: 'Trois à quatre fois par semaine, une IA raconte une courte anecdote de roleplay (drôle, épique, émouvante ou sérieuse) sur un pilote actif de votre escadron, à partir d’un fait réel de ses dernières 48 heures : tonnes livrées, victoires en zone de conflit, missions, primes… Elle apparaît dans une bande du QG et sur l’accueil du mobile ; cliquez dessus pour la lire en entier et retrouver les précédentes. Le fait réel est toujours cité, le reste est de la fiction. Vous ne voulez pas apparaître ? Décochez « Apparaître dans les anecdotes » dans Gestion du compte (PC) ou dans les Réglages (mobile). L’Amiral peut supprimer une anecdote. Rien à faire de votre côté, pas de mise à jour du plugin.',
        important: false
    },
    {
        id: '2026-10-photo-commandant', date: '2026-10-07T17:00:00Z', type: 'NOUVEAU',
        titre: 'Votre photo de commandant, visible par votre escadron',
        texte: 'Ajoutez la photo de votre personnage : depuis « Gestion du compte » (menu latéral, en bas) sur ordinateur, ou depuis les Réglages (la roue crantée) sur mobile. Elle apparaît sur la page Escadron (liste et fiche), dans le mur des spécialistes (en fond du cadre), sur l’onglet Escadron du mobile, dans les classements BGS et Powerplay, et au centre de la médaille du Pilier de la semaine et de l’Élan Powerplay. Elle n’est visible que par les membres de votre escadron et par les pilotes de votre Puissance. Une nouvelle photo remplace l’ancienne ; vous pouvez la retirer quand vous voulez, et l’Amiral peut retirer celle d’un membre de son escadron si besoin. Sans photo, vos initiales s’affichent dans un disque à la couleur de votre rôle. Rien à faire de votre côté, pas de mise à jour du plugin.',
        important: false
    },
    {
        id: '2026-10-soutien-libre', date: '2026-10-06T21:50:00Z', type: 'CORRIGE',
        titre: 'Soutien libre : vos actions pour la faction de l’escadron comptent enfin',
        texte: 'Jusqu’ici, les actions faites pour la faction de votre escadron en dehors des directives de l’Amiral (missions, primes, commerce, exploration, exobiologie…) n’étaient pas enregistrées : elles n’apparaissaient pas dans le journal BGS et ne rapportaient aucun point de rang. C’était un défaut, il est corrigé. Elles sont maintenant notées en « soutien libre » dans le journal et font monter votre rang BGS, comme les actions des directives. Elles ne comptent pas dans la progression des directives, qui ne suivent que leur faction et leur système. Rien à faire de votre côté, pas de mise à jour du plugin : seules les actions à partir de maintenant sont comptées.',
        important: true
    },
    {
        id: '2026-10-quoi-faire-style', date: '2026-10-05T16:20:00Z', type: 'CORRIGE',
        titre: 'Quoi faire : le style de jeu choisi change vraiment les idées',
        texte: 'Quand vous choisissez votre style (combat, marchand, exploration ou logistique) tout en bas de « Quoi faire », les idées proposées s’adaptent maintenant à vos habitudes. Avant, ce choix ne servait qu’à départager des cas à égalité et on ne voyait rien changer. La priorité fixée par le commandement reste toujours en tête, et le mode « automatique » fonctionne comme avant.',
        important: false
    },
    {
        id: '2026-10-code-invitation', date: '2026-10-04T18:20:00Z', type: 'NOUVEAU',
        titre: 'Escadrons : un code d’invitation pour les rejoindre',
        texte: 'Pour protéger votre escadron, on le rejoint désormais avec un code d’invitation que l’Amiral (et les officiers) retrouvent en haut de la page Escadron, et qu’il peut renouveler. Le code se saisit au sas de sécurité, ou depuis le QG pour un pilote déjà inscrit comme indépendant. Votre rôle (Officier, Amiral) reste repris automatiquement de votre grade en jeu. Un escadron est inscrit par son Amiral, à sa première connexion avec le plugin. La page de connexion affiche aussi le même pied de page que la présentation.',
        important: false
    },
    {
        id: '2026-10-plugin-2-8', date: '2026-10-04T16:12:00Z', type: 'CORRIGE',
        titre: 'Plugin 2.8 : l’exobiologie ne compte plus dans les directives',
        texte: 'Dans le jeu, vendre des données d’exobiologie ne change pas l’influence d’une faction (seule la cartographie le fait). Elle ne compte donc plus dans les directives de l’Amiral : la jauge Science devient « Cartographie ». L’exobiologie reste prise en compte pour votre rang BGS, en soutien libre, quand vous la vendez dans une station de la faction de votre escadron, et apparaît dans le journal des exploits.',
        important: true,
        action: 'Mettez à jour le plugin : EDMC le propose au démarrage, puis redémarrez EDMC.'
    },
    {
        id: '2026-10-plugin-2-7', date: '2026-10-04T15:25:00Z', type: 'CORRIGE',
        titre: 'Plugin 2.7 : une vente de marchandises n’est plus comptée comme de la colonisation',
        texte: 'Jusqu’ici, vendre au marché des matériaux de construction (titane, microcontrôleurs…) ou livrer une mission de fret pouvait ajouter à tort des « tonnes de colonisation » à une directive et gonfler le classement. C’est corrigé : la vente reste comptée en commerce, comme avant, et les vraies livraisons aux chantiers de colonisation ne changent pas. Le classement des directives applique aussi le même barème que le rang BGS (400 tonnes de colonisation = 1 point, les échecs ne rapportent rien).',
        important: true,
        action: 'Mettez à jour le plugin : EDMC le propose au démarrage, puis redémarrez EDMC.'
    },
    {
        id: '2026-10-bgs-resultats-directives', date: '2026-10-04T15:10:00Z', type: 'NOUVEAU',
        titre: 'BGS : le résultat du jeu sur chaque directive',
        texte: 'Chaque directive de l’Amiral affiche maintenant ce que le jeu en a fait : l’influence de la faction, sa variation depuis l’émission de la directive, une mini-courbe, et le score du conflit pour une guerre ou une élection. Un clic ouvre le détail : courbe sur 30 jours, factions voisines, états, et l’effort par type d’action. Les chiffres viennent d’EDSM, relevés deux fois par jour : c’est le résultat constaté dans le jeu, pas la preuve que nos actions en sont la cause. Disponible sur PC et sur le compagnon mobile.',
        important: false
    },
    {
        id: '2026-10-colonisation-points-rang', date: '2026-10-04T14:30:00Z', type: 'AMELIORE',
        titre: 'Colonisation : ses points de rang BGS, et plus de doublon dans les exploits',
        texte: 'Les livraisons de colonisation n’apparaissent plus dans le journal des exploits du BGS (PC et mobile) : elles ont leur propre journal, dans la page Colonisation et l’onglet Bâtir du mobile. Chaque livraison y indique maintenant les points de rang BGS qu’elle rapporte (400 tonnes = 1 point).',
        important: false
    },
    {
        id: '2026-10-retrait-diplomatie', date: '2026-10-04T14:00:00Z', type: 'AMELIORE',
        titre: 'Retrait de la page Diplomatie',
        texte: 'La page Diplomatie (traités et alliances) est retirée : personne ne l’utilisait encore, et elle reviendra sous la forme d’un vrai module de coalition, avec des traités signés des deux côtés, quand d’autres escadrons auront rejoint EDTEAM. Le COVAS ne signale donc plus les traités au saut ni sur une cible ; le registre de renseignement (KOS, suspects, alliés VIP) reste en place.',
        important: false
    },
    {
        id: '2026-10-mobile-bgs-chiffres', date: '2026-10-04T12:00:00Z', type: 'AMELIORE',
        titre: 'Compagnon mobile : exploits, chiffres et directives plus clairs',
        texte: 'Le journal des exploits du BGS affiche maintenant aussi les livraisons de colonisation et le soutien libre, avec les points de rang BGS gagnés par chaque action. La fiche d’une directive indique le commandant qui l’a créée. « L’escadron en chiffres » est rangé par thème avec des libellés explicites, « Mes finances » tient sur une ligne, et le statut légal (casier) disparaît de l’accueil et des fiches pilote.',
        important: false
    },
    {
        id: '2026-10-logo-escadron', date: '2026-10-04T08:00:00Z', type: 'NOUVEAU',
        titre: 'Logo d’escadron et nouvelle édition d’EDNews en popup',
        texte: 'L’Amiral de chaque escadron peut désormais déposer le logo de son escadron (bouton « + LOGO » au pied de la carte « Ma faction »). L’image est redimensionnée automatiquement et s’affiche pour tous les membres. Le compagnon mobile affiche désormais aussi « Ma puissance » et « Ma faction » sur son accueil. Chaque semaine, une popup vous présente la nouvelle édition d’EDNews dès l’ouverture du QG (« Lire l’édition » ou « Plus tard »), tant que vous ne l’avez pas lue. Dans l’en-tête, le rang BGS passe aussi en pastille au-dessus du cadre, comme le rang Powerplay, et les cartes du QG retrouvent leurs coins coupés.',
        important: false
    },
    {
        id: '2026-10-puissance-faction', date: '2026-10-03T23:00:00Z', type: 'NOUVEAU',
        titre: 'Au QG : votre puissance et votre faction',
        texte: 'Deux nouvelles cartes en tête du QG. « Ma puissance » montre, avec le portrait de votre puissance (les 12 puissances en ont un), son classement parmi les douze (nombre de systèmes, répartition Stronghold, Fortified et Exploited). « Ma faction » montre la faction de votre escadron : systèmes contrôlés, présence, résidents et stations. Les variations apparaissent après une semaine de relevés. Les données viennent de la base communautaire Spansh, relevée chaque jour (les points par puissance et les systèmes contestés ne sont pas disponibles). EDNews s\'affiche désormais dans la carte de la faction ; les actualités Galnet, déjà visibles en jeu, sont retirées du QG et du compagnon mobile.',
        important: false
    },
    {
        id: '2026-10-entete-escadron', date: '2026-10-03T21:30:00Z', type: 'AMELIORE',
        titre: 'En-tête : escadron, grades et vos rangs partout',
        texte: 'L\'en-tête affiche maintenant votre escadron et vos grades (Amiral, Officier BGS, Diplomate, Pilote ou Recrue), puis vos quatre rangs : Powerplay, BGS, Fédération et Auxiliaires. Un clic sur un rang ouvre sa fenêtre depuis n\'importe quelle page, plus seulement depuis le QG. Les effectifs de la flotte passent à droite, et le bouton son ne se trouve plus que dans le pied de page. À la place du casier judiciaire et des soldes (qui restent dans votre Budget), le statut « Recherché » n\'apparaît que si vous l\'êtes. Au QG, « Quoi faire » prend la place de la carrière militaire, avec Galnet et EDNews sur la même ligne.',
        important: false
    },
    {
        id: '2026-10-quoi-faire', date: '2026-10-03T21:00:00Z', type: 'NOUVEAU',
        titre: 'Quoi faire ? Une idée à chaque connexion',
        texte: 'Vous vous connectez au jeu et vous ne savez pas par quoi commencer ? Une bande « Quoi faire · Recommandation » en haut du QG (et un onglet sur mobile) vous propose ce qui aiderait le plus : d\'abord la directive que le commandement a classée en priorité, à priorité égale l\'activité la plus en retard, puis ce qui correspond à votre style de jeu. Suivent d\'autres opportunités (colonisation, directives) et votre progression (rang BGS, Powerplay). Sans escadron, vous y trouvez votre chantier de colonisation, votre Powerplay et votre budget. Aucune obligation, aucun rouge, aucune alerte : c\'est vous qui ouvrez.',
        important: false
    },
    {
        id: '2026-10-colonisation-fraicheur', date: '2026-10-03T20:30:00Z', type: 'AMELIORE',
        titre: 'Colonisation : pourquoi certains besoins peuvent être dépassés',
        texte: 'Au lancement du module, les chantiers ont été reconstitués à partir des anciens journaux de jeu : leurs quantités restantes ne sont donc pas encore toutes à jour. Un encadré « IMPORTANT » (PC et mobile, au-dessus de « À apporter en priorité ») indique combien de chantiers n\'ont pas encore été relevés à quai depuis. Dès qu\'un pilote dock sur un chantier, ses chiffres sont à jour et le restent : l\'encadré disparaîtra quand tous les chantiers auront été visités une fois.',
        important: false
    },
    {
        id: '2026-10-communications-retirees', date: '2026-10-03T19:00:00Z', type: 'AMELIORE',
        titre: 'Moins de bruit : la page Communications disparaît',
        texte: 'Personne ne s\'en servait et Discord fait déjà ce travail mieux. La page Communications, l\'enveloppe du menu, les alertes plein écran et l\'onglet Comms du mobile sont retirés. Le Pilier de la semaine ne vous envoie plus de message privé : il reste annoncé dans le journal tactique et sur sa plaque. Le site devient plus léger et moins sollicitant.',
        important: false
    },
    {
        id: '2026-10-plafonds-actifs', date: '2026-10-03T16:00:00Z', type: 'AMELIORE',
        titre: 'Jauges des directives : l\'objectif suit les pilotes actifs de la semaine',
        texte: 'Jusqu\'ici, l\'objectif de chaque activité d\'une directive dépendait du nombre de pilotes qui l\'avaient déjà commencée : dès que ces quelques pilotes avaient joué, la jauge affichait 100 % et plus personne n\'avait l\'impression de devoir s\'y mettre. Désormais l\'objectif se base sur le nombre de pilotes actifs de l\'escadron dans le cycle en cours (du jeudi 07:00 UTC au suivant) : la jauge ne se remplit vraiment que si l\'escadron fournit l\'effort attendu. En début de cycle, tant que personne n\'a joué, on reprend les actifs du cycle précédent.',
        important: false
    },
    {
        id: '2026-10-mobile-refait', date: '2026-10-03T13:00:00Z', type: 'AMELIORE',
        titre: 'Compagnon mobile entièrement refait',
        texte: 'Le site mobile reprend toutes les nouveautés du PC dans une présentation moderne. L\'accueil montre votre rang BGS, votre Powerplay, vos finances, le Pilier, l\'Élan, la semaine de l\'escadron et les chiffres clés. L\'onglet BGS regroupe les directives, votre effort sur 8 cycles et les exploits. Le nouvel onglet Bâtir affiche la colonisation en direct, avec le journal des livraisons. L\'onglet Escadron devient des cartes avec recherche, tri et filtre « actifs cette semaine ». Les fiches pilotes montrent les titres de spécialiste (désormais identiques à ceux du PC) et les plaques de campagne. Le budget s\'ouvre depuis votre carte « Mes finances », et les réglages (aide, Discord, sons, déconnexion) sont derrière la roue crantée. Le suivi d\'influence disparaît, comme sur le PC.',
        important: false
    },
    {
        id: '2026-10-plugin-2-6', date: '2026-10-02T23:03:20Z', type: 'NOUVEAU',
        titre: 'Plugin 2.6 : les opérations noires contre les factions rivales comptent',
        texte: 'Le plugin envoie désormais aussi vos meurtres, vols, piratages et opérations de contrebande menés contre une autre faction que celle de votre escadron, même sans directive de l\'Amiral. Ils rapportent des points de rang BGS et alimentent le titre « L\'Exécuteur » du mur des spécialistes.',
        important: true,
        action: 'Mettez à jour le plugin : EDMC le propose au démarrage, puis redémarrez EDMC.'
    },
    {
        id: '2026-10-page-escadron', date: '2026-10-02T23:03:00Z', type: 'AMELIORE',
        titre: 'Page Escadron et fiches pilotes refaites',
        texte: 'La liste des pilotes devient un tableau de cartes : chaque pilote affiche son rang BGS avec sa progression, son rang Powerplay, ses titres de spécialiste, ses meilleures plaques et son activité de la semaine. On peut rechercher un pilote, trier (rôle, points de la semaine, nom) et filtrer (actifs cette semaine, officiers, avec titre). La fiche d\'un pilote est réorganisée : titres et distinctions en haut (Pilier et Élan comptés), cartes BGS, Powerplay et colonisation, barres de progression pour chaque rang de la Fédération, et un bloc unique pour les plaques et les distinctions hebdomadaires.',
        important: false
    },
    {
        id: '2026-10-salle-commandement', date: '2026-10-02T23:02:40Z', type: 'AMELIORE',
        titre: 'Salle de commandement refaite (Amiral et officiers)',
        texte: 'La fenêtre de commandement est plus claire : un formulaire en trois étapes (système, briefing, directives par faction), où le type de mission et la priorité se choisissent d\'un clic sur des pastilles de couleur, et la liste des directives en cours à côté, avec leurs boutons Éditer, Clôturer et Supprimer. Le bouton « Transmettre la campagne » reste toujours visible en bas.',
        important: false
    },
    {
        id: '2026-10-menu-allege', date: '2026-10-02T23:02:20Z', type: 'AMELIORE',
        titre: 'Menu latéral allégé : la clé EDMC est dans « Gestion du compte »',
        texte: 'Le menu latéral ne garde que les pages et le compte. Les boutons Discord et Aide, déjà présents dans le pied de page de toutes les pages, sont retirés du menu. Votre clé de liaison EDMC se trouve désormais en haut de la fenêtre « Gestion du compte » : cliquez dessus pour la copier.',
        important: false
    },
    {
        id: '2026-10-bgs-une-page', date: '2026-10-02T23:02:00Z', type: 'AMELIORE',
        titre: 'BGS : une seule page, et le journal des exploits dans une fenêtre',
        texte: 'La page BGS n\'a plus d\'onglets et prend un titre comme les autres pages : engagement, progression, escadron, mur des spécialistes et focus de l\'Amiral sont réunis sur l\'accueil, les directives en cartes compactes réparties sur deux colonnes. Le journal des exploits s\'ouvre dans une fenêtre avec le bouton « Journal des exploits » du titre : il garde ses filtres (pilote, période, directive) et ne charge ses données qu\'à l\'ouverture. La Force de frappe et le cadre des états de service quittent la page ; vos plaques restent visibles sur votre fiche pilote.',
        important: false
    },
    {
        id: '2026-10-titres-specialistes', date: '2026-10-02T23:01:40Z', type: 'AMELIORE',
        titre: 'Mur des spécialistes : sept titres, au cumul total, visibles sur l\'accueil BGS et sur les fiches',
        texte: 'Les sept titres (Fer de lance, Maître logisticien, Magnat, Bâtisseur, Expert scientifique, Exécuteur, Seigneur de guerre) sont désormais calculés par le serveur sur l\'ensemble de vos relevés, et non plus sur les filtres du journal : tout le monde voit les mêmes titulaires. Chaque titre se mesure dans son unité (crédits, missions, tonnes livrées, opérations) et le mur affiche le cumul du titulaire et son avance sur le second. Un titre se perd quand un autre pilote dépasse le titulaire de plus de 2 %, et un titre sans activité reste vacant. Le mur est sur l\'accueil BGS ; les titres détenus apparaissent sur la fiche du pilote. Quand vous décrochez un titre, il vous est présenté en plein écran à l\'ouverture de la page BGS, comme les plaques, et une petite carte vous prévient au Quartier général. Les médailles gagnent une couronne crantée et un reflet.',
        important: false
    },
    {
        id: '2026-10-qg-refonte', date: '2026-10-02T23:01:20Z', type: 'AMELIORE',
        titre: 'Quartier général : distinctions de la semaine et chiffres clés de l\'escadron',
        texte: 'Le Quartier général est réorganisé. Le Pilier de la semaine (effort BGS) et l\'Élan Powerplay (progression des mérites) sont mis à l\'honneur toute la semaine, à gauche du journal tactique. Dans la ligne « Carrière militaire », deux nouvelles pastilles carrées résument vos rangs de la Fédération des pilotes et vos rangs auxiliaires ; un clic ouvre la fenêtre avec le détail de chaque rang et sa progression. En bas, de nouveaux « Chiffres clés de l\'escadron » remplacent les rapports financiers avancés : pilotes inscrits, renseignement tactique (KOS, suspects, alliés), points BGS cumulés, CR générés pour la BGS, mérites Powerplay et colonisation (systèmes, stations, chantiers, tonnes livrées), chacun cliquable. Votre patrimoine détaillé (liquidités, Fleet Carrier, flotte, coût de rachat) se retrouve dans la page Budget.',
        important: false
    },
    {
        id: '2026-10-elan-powerplay', date: '2026-10-02T23:01:00Z', type: 'NOUVEAU',
        titre: 'Élan Powerplay : une distinction hebdomadaire pour la progression',
        texte: 'En plus du Pilier de la semaine (qui récompense l\'effort BGS), une nouvelle distinction revient chaque jeudi au pilote dont les mérites Powerplay ont le plus progressé en proportion de ses mérites de départ. Ce critère de progression relative donne sa chance à chacun, quel que soit son niveau. Elle apparaît à côté du Pilier sur le Quartier général, dans le journal tactique et sur la fiche du pilote. Première désignation : jeudi 8 octobre.',
        important: false
    },
    {
        id: '2026-10-plaques-revelation', date: '2026-10-02T23:00:40Z', type: 'NOUVEAU',
        titre: 'Vos nouvelles plaques de campagne s\'affichent en plein écran',
        texte: 'Quand l\'Amiral clôture une directive à laquelle vous avez participé, la prochaine fois que vous ouvrez la page BGS, votre plaque s\'affiche en grand, avec son nombre d\'étoiles, votre place dans la campagne et votre score. Si vous en avez gagné plusieurs depuis votre dernière visite, elles défilent l\'une après l\'autre (touche Échap pour passer). Sur le Quartier général, une petite carte vous prévient qu\'une nouvelle plaque vous attend. Toutes vos plaques restent à retrouver sur votre fiche pilote, dans la page Escadron.',
        important: false
    },
    {
        id: '2026-10-accueil-bgs', date: '2026-10-02T23:00:20Z', type: 'AMELIORE',
        titre: 'BGS : un nouvel accueil centré sur votre engagement',
        texte: 'La page BGS s\'ouvre maintenant sur un onglet ACCUEIL (l\'ancien onglet MISSIONS). À gauche, votre rang BGS, votre progression et vos points de la semaine (un « ? » rappelle que chaque action pour votre faction d\'escadron compte, avec ou sans mission de l\'Amiral), puis les chiffres de la semaine de l\'escadron (points, pilotes actifs, votre part, trois premiers). À droite, votre progression sur les 8 dernières semaines. Les directives de l\'Amiral sont regroupées sous « Focus de l\'Amiral » avec leurs jauges habituelles : elles sont facultatives et donnent droit à une distinction à leur clôture. Un encart « Comment ça marche » repliable complète le tout. Par ailleurs, l\'onglet SUIVI D\'INFLUENCE est masqué pour le moment : si vous l\'utilisiez, dites-le à l\'équipe.',
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
