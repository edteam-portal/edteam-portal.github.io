// Journal des nouveautes de SYS.EDTEAM : UNE entree par changement visible pour les pilotes, en langage simple ("ce qui change pour vous").
// Affichage : bouton "Nouveautes" du pied de page (groupe par cycle : du jeudi 07:00 UTC au jeudi suivant).
// Discord : un resume par semaine (tache GitHub, jeudi 08:00 UTC), voir .github/workflows/nouveautes-discord.yml.
// Champs : id (unique), date (ISO UTC), type (NOUVEAU | AMELIORE | CORRIGE), titre, texte,
//          important (true = petite carte discrete a l'ouverture du QG), action (texte "action requise", facultatif).
window.EDTEAM_NOUVEAUTES = [
    {
        id: '2026-10-croises-ennemi-journal-allege', date: '2026-10-24T20:00:00Z', type: 'AMELIORE',
        titre: 'Joueurs croisés : filtre ENNEMI ; journal tactique allégé',
        texte: 'Dans la fenêtre des joueurs croisés (QG, onglet Combat et mobile), un nouveau filtre « ENNEMI » n’affiche que les joueurs en rouge : camp rival, recherchés et primes. Le journal tactique est aussi plus lisible : plus de ligne quand un pilote espionne un système de la liste (le point BGS et la ligne du journal des exploits restent) et plus de ligne quand le vaisseau scanné est celui d’un membre de l’escadron. Ces scans de membres ne comptent plus non plus dans le journal des exploits, ni pour la distinction L’ESPION.',
        important: false
    },
    {
        id: '2026-10-balayage-zone-ou-vendre', date: '2026-10-24T18:00:00Z', type: 'AMELIORE',
        titre: 'Où vendre ? : toute la zone est examinée, les prix inhabituels sont signalés',
        texte: 'Pour les rayons de 15 et 20 al (20 al est maintenant le rayon proposé par défaut), « Où vendre ? » et « Où vendre à perte ? » lisent maintenant d’un coup les marchés de toutes les stations récentes de la zone et calculent la marge exacte de chaque marchandise, au lieu de ne regarder que les marchandises les mieux payées : de bonnes routes jusque-là manquées apparaissent, et les routes proposées sont mieux classées. Quand un prix est très différent de la médiane de la zone (un état, une pénurie, un relevé ancien), une pastille « PRIX INHABITUEL » le signale : la route reste proposée, à vous de vérifier en jeu. Les rayons plus grands gardent l’ancienne recherche.',
        important: false
    },
    {
        id: '2026-10-aller-retour-type-station', date: '2026-10-24T16:00:00Z', type: 'NOUVEAU',
        titre: 'Où vendre ? : aller-retour rentable et choix orbitale / planétaire',
        texte: 'Les fenêtres « Où vendre ? », « Où vendre à perte ? » et « Route de contrebande » des directives ont deux nouveaux réglages. « STATIONS » : toutes (par défaut), orbitales (stations spatiales) ou planétaires (au sol), pour l’achat comme pour la vente. « ALLER-RETOUR » : ne garde que les routes dont le trajet retour est rentable, et affiche ce qu’il faut acheter à la station de la faction pour le revendre à la station d’achat, avec le bilan de la boucle (pour une vente à perte : le bénéfice du retour moins la perte). Le détail du retour n’existe que pour les stations relevées par Spansh. Dans l’onglet Commerce du tableau de bord : « Vendre ce que je transporte » propose aussi le type de station, et la feuille de route peut admettre les stations planétaires en plus des orbitales (Spansh ne sait pas les exiger seules).',
        important: false
    },
    {
        id: '2026-10-demande-mini-ou-vendre', date: '2026-10-24T14:00:00Z', type: 'AMELIORE',
        titre: 'Où vendre ? : vendre même quand la station n’a plus de demande',
        texte: 'Dans le jeu, tout bénéfice compte en influence, même si la station n’a plus de demande pour la marchandise. Les fenêtres « Où vendre ? » (hausse, élection) et « Où vendre à perte ? » (baisse) ont donc un nouveau réglage, « Demande mini à la vente » : 0 t par défaut (il clignote pour vous rappeler qu’il sert aux directives), puis 100, 500, 1 000 ou 2 000 t pour ne garder que les stations qui ont vraiment de la demande. À 0, la quantité n’est limitée que par votre soute et le stock à l’achat. Même idée dans l’onglet Commerce du tableau de bord : « Vendre ce que je transporte » a un réglage « Demande » (suffisante par défaut, ou 0).',
        important: false
    },
    {
        id: '2026-10-ordre-systemes-campagne', date: '2026-10-24T11:30:00Z', type: 'AMELIORE',
        titre: 'Campagnes : l’Amiral choisit l’ordre des systèmes',
        texte: 'Dans une campagne de la page BGS, les systèmes restent classés par ordre alphabétique par défaut, mais l’Amiral peut maintenant les remettre dans l’ordre qu’il veut : il suffit de glisser une ligne (ou un système regroupé) au-dessus ou au-dessous d’un autre système de la même campagne. Tous les pilotes de l’escadron voient cet ordre, sur PC comme sur mobile. Les bandeaux de début et de fin de guerre ou d’élection sont aussi plus compacts sur téléphone.',
        important: false
    },
    {
        id: '2026-10-sons-du-jeu-partout', date: '2026-10-23T14:48:34Z', type: 'NOUVEAU',
        titre: 'Sons du jeu sur toutes les pages, dans l’application installée',
        texte: 'Quand vous prenez une mission de passagers, chargez ou vendez, sautez, êtes intercepté ou éliminez un vaisseau, les ambiances de cabine, les annonces et les voix se jouent maintenant sur TOUTES les pages du site, sans aucun clic, tant que votre jeu est en ligne, quel que soit l’onglet du tableau de bord affiché. Cela fonctionne dans l’application EDTEAM installée (Chrome ou Edge : icône d’installation à droite de la barre d’adresse) : un simple navigateur garde les sons du tableau de bord seulement. Le bouton « Sons du jeu » du pied de page les active ou les coupe ; les sons du minage restent dans l’onglet Minage.',
        important: false,
        action: 'Installer l’application EDTEAM (Chrome ou Edge) pour entendre les sons sur toutes les pages.'
    },
    {
        id: '2026-10-tick-seconde-source', date: '2026-10-23T13:36:54Z', type: 'CORRIGE',
        titre: 'Tick BGS : une seconde source quand le détecteur habituel se tait',
        texte: 'Le détecteur de tick que nous utilisions (tick.edcd.io) n’a plus rien enregistré depuis le 17 octobre : l’en-tête affichait donc un tick estimé. Le serveur interroge maintenant aussi un second détecteur communautaire toutes les 15 minutes et garde les ticks des deux ; l’en-tête retrouve l’heure exacte du dernier tick dès qu’une des deux sources le détecte. Les ticks des 18 au 21 octobre n’ont été notés par aucune source : ils restent estimés.',
        important: false
    },
    {
        id: '2026-10-ou-vendre-ardent', date: '2026-10-23T13:36:54Z', type: 'AMELIORE',
        titre: '« Où vendre ? » croise maintenant deux sources de prix',
        texte: 'Les fenêtres « Où vendre ? » et « Où vendre à perte ? » interrogent Spansh et Ardent (deux bases communautaires de prix tirées d’EDDN) et gardent, pour chaque station, le relevé le plus récent. Les stations de la faction sont aussi recoupées avec EDSM. Si l’une des sources est en panne, l’autre prend le relais. Le pied de la fenêtre indique les sources utilisées.',
        important: false
    },
    {
        id: '2026-10-trafic-minimum', date: '2026-10-23T12:57:11Z', type: 'AMELIORE',
        titre: 'Trafic d’un système : « minimum », avec une explication',
        texte: 'La carte « Trafic » de la fenêtre d’une directive s’appelle maintenant « Trafic minimum » et porte un bouton « ? » : il ouvre une fenêtre qui explique pourquoi ce chiffre (celui d’EDSM, qui ne compte que les commandants dont l’outil lui envoie le journal de vol) est plus petit que le trafic réel affiché par le jeu dans les stations, et comment lire le repère « calme / habituel / animé ».',
        important: false
    },
    {
        id: '2026-10-passages-escadron', date: '2026-10-23T12:29:16Z', type: 'AMELIORE',
        titre: 'Trafic d’un système : combien de pilotes de l’escadron y sont passés',
        texte: 'Sous le trafic EDSM, la carte « Trafic » de la fenêtre d’une directive indique maintenant combien de pilotes de votre escadron ont été relevés dans ce système ces 24 dernières heures. Seuls les pilotes dont EDMC est allumé sont vus (un pilote qui joue sans EDMC n’apparaît pas), aucun nom n’est affiché, et seul votre escadron est compté. Le comptage a commencé au lancement de cette fonction : il est incomplet pendant les 24 premières heures. Le chiffre EDSM reste un minimum.',
        important: false
    },
    {
        id: '2026-10-election-ou-vendre', date: '2026-10-23T12:12:05Z', type: 'AMELIORE',
        titre: 'Élections : le bouton « Où vendre ? » est là aussi',
        texte: 'Dans une directive d’élection, la ligne « Commerce (bénéfices) » a maintenant son bouton « Où vendre ? », comme dans une directive de hausse : la fenêtre propose où acheter et où vendre, dans une station de la faction, pour le plus gros bénéfice avec votre soute.',
        important: false
    },
    {
        id: '2026-10-ou-vendre-a-perte', date: '2026-10-23T12:01:49Z', type: 'NOUVEAU',
        titre: 'Baisse : une fenêtre « Où vendre à perte ? »',
        texte: 'Dans une directive de baisse, la ligne « Ventes à perte » a maintenant son bouton « Où vendre à perte ? », sur le modèle de « Où vendre ? » et de la route de contrebande. Elle propose où acheter une marchandise plus cher que le prix de reprise d’une station de la faction visée, où la lui vendre, et la PERTE par tonne et pour votre soute (le montant de la vente n’est pas affiché). Vous choisissez le classement : perte la plus faible (la moins coûteuse) ou perte la plus forte. Mêmes réglages que « Où vendre ? » : soute, rayon, stock minimal, grande piste, fraîcheur des relevés. La ligne « Ventes à perte » n’affiche plus que la perte.',
        important: false
    },
    {
        id: '2026-10-conflits-debut-fin', date: '2026-10-23T11:42:31Z', type: 'NOUVEAU',
        titre: 'Guerres et élections : un bandeau annonce le début et la fin',
        texte: 'Quand une guerre ou une élection démarre sur une faction qui fait l’objet d’une directive, quel que soit le type de la directive (une hausse par exemple), un bandeau « LA GUERRE A COMMENCÉ » ou « L’ÉLECTION A COMMENCÉ » s’affiche au-dessus de sa ligne jusqu’au tick suivant, sur PC et sur mobile. L’Amiral et les officiers y trouvent un bouton pour passer la directive en guerre ou en élection. Quand le conflit se termine, le bandeau annonce « GUERRE GAGNÉE », « PERDUE » ou « TERMINÉE » (d’après le dernier score relevé : si aucun vainqueur net n’est connu, le bandeau le dit). L’heure affichée est celle de la détection : le jeu n’est connu que lorsqu’un joueur visite le système ou à chaque relevé EDSM.',
        important: false
    },
    {
        id: '2026-10-commerce-benefices', date: '2026-10-23T11:03:36Z', type: 'AMELIORE',
        titre: 'Commerce : seul le bénéfice compte, et il s’affiche à côté du montant de la vente',
        texte: 'Dans le jeu, seul le bénéfice d’une vente fait monter l’influence d’une faction, pas le chiffre d’affaires. EDTEAM compte donc désormais le BÉNÉFICE (vente moins prix payé) pour l’économie : directives de hausse, titre du Magnat, points de rang. Une cargaison minée ou récupérée, dont le prix payé est nul, compte en entier. Une vente à perte ou à prix coûtant ne compte plus en économie. Le journal des exploits et la fenêtre d’une directive indiquent « BÉNÉFICE » avec le montant de la VENTE à côté. Les anciennes lignes, enregistrées avant, gardent leur ancien montant (marqué « VENTE »).',
        important: false,
        action: 'Plugin 2.46 : il se met à jour tout seul au démarrage d’EDMC, relancez EDMC une fois.'
    },
    {
        id: '2026-10-baisse-vente-a-perte', date: '2026-10-23T10:52:56Z', type: 'NOUVEAU',
        titre: 'Baisse : la vente à perte compte, et la perte s’affiche',
        texte: 'Vendre une marchandise moins cher que vous ne l’avez payée, dans une station contrôlée par la faction visée par une directive de baisse, fait baisser son influence. Cette action compte maintenant : elle rapporte des points de rang BGS (la perte divisée par 2 millions de crédits, comme la contrebande) et une opération pour l’Exécuteur. La fenêtre d’une directive de baisse (PC et mobile) affiche « Ventes à perte » avec le nombre de ventes et la PERTE en crédits, et le journal des exploits montre « PERTE … CR ». Il faut le plugin 2.46 ; les ventes à perte sans directive de baisse restent du commerce normal.',
        important: false,
        action: 'Plugin 2.46 : il se met à jour tout seul au démarrage d’EDMC, relancez EDMC une fois.'
    },
    {
        id: '2026-10-election-commerce-exploration', date: '2026-10-23T10:42:05Z', type: 'AMELIORE',
        titre: 'Élections : le commerce et les ventes de données d’exploration comptent aussi',
        texte: 'Pour gagner une élection dans un système, les missions de la faction ne sont pas la seule voie : vendre de la marchandise (commerce) et vendre des données d’exploration (science) à une station de la faction comptent aussi. La fenêtre d’une directive Élection (PC et mobile) affiche maintenant trois lignes : logistique électorale, commerce et données d’exploration, avec votre total du jour. Comme pour les guerres, il n’y a aucune limite : faites-en le plus possible. Rien à mettre à jour : le plugin envoyait déjà ces ventes.',
        important: false
    },
    {
        id: '2026-10-mobile-reperage-directives', date: '2026-10-23T00:02:59Z', type: 'AMELIORE',
        titre: 'Mobile : repérage, jauges et fenêtres des directives et missions Powerplay comme sur le PC',
        texte: 'Le mobile rattrape le PC. L’onglet CAMPAGNES affiche le bandeau « N systèmes à repérer » : il ouvre la route de repérage en plein écran (chemin le plus court depuis votre position, systèmes déjà repérés par vos camarades avec leur avatar et le tampon « REPÉRÉ », systèmes écartés, votre compteur L’ESPION, règles et message d’EDTEAM). Les lignes de directive perdent leurs barres de progression d’effort, comme sur le PC : fond de résultat net ou pâle et jauge d’influence (gris : inchangé depuis le dernier tick, plein : gain, rayé : perte, trait blanc : valeur d’avant). Les lignes Powerplay reçoivent la barre du jeu à 4 zones avec l’état et le net du cycle. La fenêtre d’une directive reprend « Qui participe et comment » (participants, activités cumulées, ticks joués), le verdict et les trois tuiles du résultat du jeu ; la fenêtre d’une mission Powerplay affiche le même contenu que sur le PC (apport de l’escadron, d’où viennent les mérites, participants, état du système dans le jeu). Le quota du tick et les bilans par tick sont désormais bien chargés sur mobile.',
        important: false
    },
    {
        id: '2026-10-alerte-joueur-verrouille', date: '2026-10-22T23:18:44Z', type: 'NOUVEAU',
        titre: 'Alerte combat : un joueur est verrouillé, sur n’importe quelle page',
        texte: 'Sur le second écran ou la tablette, une nouvelle option du pied de page, « ALERTE COMBAT », affiche un gros bouton clignotant au milieu de la page où vous êtes quand un autre joueur (un CMDR, pas un PNJ) est verrouillé en jeu. Un clic ouvre l’onglet Combat du tableau de bord, dans le même onglet. L’option se règle à chaque session de jeu : elle ne dure que tant que la session en cours continue (EDMC et le jeu lancés, page visible), se met en veille après 3 heures sans joueur verrouillé et se désactive toute seule à la session suivante. Elle ne consomme rien tant qu’elle est désactivée.',
        important: false,
        action: 'Plugin 2.44 : il se met à jour tout seul au démarrage d’EDMC, relancez EDMC une fois.'
    },
    {
        id: '2026-10-espion-distinction', date: '2026-10-22T22:01:19Z', type: 'NOUVEAU',
        titre: 'Nouvelle distinction : L’ESPION (RENSEIGNEMENT)',
        texte: 'Un huitième titre rejoint le mur des spécialistes : L’ESPION, pour le pilote qui renseigne le plus l’escadron. Une action = 1 point BGS = 1 point pour la distinction, et il n’y a que deux façons d’en gagner : arriver dans un système de la liste à repérer, ou scanner un joueur d’un autre escadron (onglet Combat du tableau de bord, scan de stade 2 ou plus, une fois par joueur et par jour). Ce n’est pas une course : le but est que tous les systèmes soient à jour. Une fenêtre plein écran présente la distinction une fois à chaque pilote. Chaque action a sa ligne dans le journal des exploits (PC et mobile).',
        important: false,
        action: 'Plugin 2.43 : il se met à jour tout seul au démarrage d’EDMC, relancez EDMC une fois (nécessaire pour les scans de joueurs et le repérage).'
    },
    {
        id: '2026-10-mission-reperage', date: '2026-10-22T22:01:18Z', type: 'NOUVEAU',
        titre: 'Mission de repérage : les pilotes mettent les données à jour',
        texte: 'Sur la page Engagement, un bouton « N systèmes à repérer » (à droite de CARTE GALACTIQUE) ouvre la route de repérage et le message d’EDTEAM. La liste réunit les systèmes dont la donnée est trop vieille : directives, menaces d’expansion rivale et conquêtes Powerplay ennemies. Il suffit d’y arriver en jeu, sans s’y poser : le plugin envoie ce que voit votre jeu, le système sort de la liste pour tout l’escadron et vous gagnez 1 point BGS. La route est triée pour le temps de vol (chemin le plus court depuis votre position). Le directeur règle les âges limites, le seuil de conquête, le rayon et les modes BGS / Powerplay ; l’Amiral et le directeur peuvent écarter un système de la liste (et le remettre à tout moment).',
        important: false,
        action: 'Plugin 2.43 : il se met à jour tout seul au démarrage d’EDMC, relancez EDMC une fois.'
    },
    {
        id: '2026-10-journal-regroupe', date: '2026-10-22T22:01:17Z', type: 'AMELIORE',
        titre: 'Journal des exploits : les actions rapprochées sont regroupées',
        texte: 'Les actions de même type d’un même pilote faites à moins de 5 minutes l’une de l’autre tiennent sur une seule ligne, valeurs additionnées : cinq ventes de marchandises donnent un seul total en crédits, avec les points correspondants. Les repérages, les scans et les actions répétitives (meurtres, piratages) sont regroupés par 5. Les livraisons de colonisation gardent leur ligne.',
        important: false
    },
    {
        id: '2026-10-score-conflit-par-pilote', date: '2026-10-22T17:00:45Z', type: 'AMELIORE',
        titre: 'Scores de guerre et d’élection : qui les a relevés',
        texte: 'Dans la fenêtre d’une directive de guerre ou d’élection, le score du conflit indique maintenant « relevé par CMDR … il y a … » : le pilote de l’escadron qui l’a envoyé en arrivant dans le système. Aucun changement à faire côté plugin.',
        important: false
    },
    {
        id: '2026-10-releve-pilote-systeme', date: '2026-10-22T16:22:27Z', type: 'AMELIORE',
        titre: 'Directives : le système est relevé par vos camarades quand ils s’y rendent',
        texte: 'EDSM ne met à jour un système que lorsqu’un joueur le visite avec un outil qui envoie ses données, d’où des résultats parfois vieux de plus d’un jour. Désormais, quand un pilote de l’escadron arrive dans un système ciblé par une directive active, le plugin (v2.42) relève l’influence et les états des factions dans le journal du jeu : la fenêtre de la directive affiche « mis à jour par CMDR … il y a … ». La donnée la plus récente est gardée, EDSM ou pilote. Rien n’est envoyé pour les autres systèmes.',
        important: false,
        action: 'Plugin 2.42 : il se met à jour tout seul au démarrage d’EDMC, relancez EDMC une fois.'
    },
    {
        id: '2026-10-carte-galactique', date: '2026-10-22T15:53:33Z', type: 'NOUVEAU',
        titre: 'Carte galactique des campagnes : où agir, et ce qui s’approche',
        texte: 'Troisième affichage de la page Engagement : chaque système de mission est placé sur une carte (vue de dessus ou de côté), coloré selon le résultat, la participation ou la priorité. Survolez pour voir la directive, cliquez pour l’ouvrir, clic droit pour copier le nom dans le jeu. Un filtre « À renforcer » montre où l’aide est utile, et les systèmes de votre faction, vos colonies et la puissance défendue apparaissent en fond. Des alarmes signalent ce qui s’approche : puissance ennemie en place ou en conquête (Powerplay) et expansion d’une faction rivale vers vos systèmes (BGS, avec la route). Le bouton « Aide » de la carte explique tout en 8 pages. Sur PC et tablette.',
        important: true
    },
    {
        id: '2026-10-fenetres-directives', date: '2026-10-22T15:53:32Z', type: 'NOUVEAU',
        titre: 'Fenêtres des directives refaites : participants, ticks et mérites',
        texte: 'La fenêtre d’une directive BGS montre qui participe (avatar, part de l’effort, ticks joués), une barre cumulée par activité et le résultat du jeu. La fenêtre Powerplay montre le portrait de la puissance, l’état du système avec la barre du jeu, ce qui change au prochain tick, d’où viennent les mérites et la part de chaque pilote.',
        important: false
    },
    {
        id: '2026-10-engagement-lifting', date: '2026-10-22T15:53:31Z', type: 'AMELIORE',
        titre: 'Page Engagement : lignes plus lisibles, barres du jeu pour le Powerplay',
        texte: 'Chaque ligne se lit d’un coup d’œil : la couleur donne le résultat du dernier tick, une jauge montre l’influence (gris = inchangé, plein = gain, rayé = perte), et « Tes actions · aujourd’hui » montre ce que vous avez fait. Pour le Powerplay, la ligne reprend la barre du jeu (Inoccupé, Exploité, Consolidé, Défendu) avec la position au dernier tick (▼ blanc) et maintenant (▲ orange). Choisissez l’affichage : lignes, cartes ou carte galactique.',
        important: true
    },
    {
        id: '2026-10-directive-efficacite', date: '2026-10-21T23:50:26Z', type: 'NOUVEAU',
        titre: 'Directives : où votre effort est le plus efficace, participants et bilan',
        texte: 'Le jeu applique des rendements décroissants : au-delà d’un certain volume par tick, une activité fait de moins en moins bouger l’influence. Dans la fenêtre d’une directive de hausse ou de baisse, chaque barre d’activité montre votre quota personnel du tick (« 8 / 15 INF · encore ~7 à plein effet », puis « ✓ plein effet atteint » : le surplus compte toujours pour votre rang BGS) ; elle repart de zéro à chaque tick. C’est un repère, pas une obligation. Les seuils dépendent de la population du système et viennent d’un guide communautaire (non officiel) ; les guerres et les élections n’ont pas de limite d’effet. La fenêtre affiche aussi les avatars des participants (un point vert : a joué aujourd’hui) et un bilan depuis l’émission : total de l’escadron, votre part, votre rythme sur les cinq derniers ticks et classement des pilotes par activité. Sous la courbe d’influence, chaque tick montre combien de pilotes ont agi.',
        important: true
    },
    {
        id: '2026-10-engagement-utile', date: '2026-10-21T23:50:25Z', type: 'AMELIORE',
        titre: 'Page Engagement : couleur des résultats',
        texte: 'Le fond de chaque ligne de directive indique le résultat depuis le dernier tick : vert quand l’objectif est atteint (l’influence a monté pour une hausse, baissé pour une baisse), rouge quand il ne l’est pas — c’est là que votre aide sert le plus —, bleu quand l’influence n’a pas bougé. Le fond est net quand EDSM a mesuré depuis le tick, pâle sinon (variation sur 48 h). Chaque ligne affiche aussi une petite icône par activité, qui se remplit avec votre volume du tick et passe en ✓ quand le plein effet est atteint. Les pourcentages d’avancement d’escadron disparaissent : rien ne permettait de fixer un vrai « 100 % ».',
        important: false
    },
    {
        id: '2026-10-effort-par-tick', date: '2026-10-21T21:17:04Z', type: 'NOUVEAU',
        titre: 'Directives : l’effort de l’escadron, tick par tick',
        texte: 'Dans la fenêtre d’une directive, une petite barre apparaît sous la courbe d’influence pour chaque tick : plus elle est haute, plus l’escadron a fourni d’effort pendant cette période. Au survol, vous voyez la période, la part de l’effort et la variation d’influence autour du tick. La barre d’effort de l’escadron est aussi découpée par tick, avec la date. Une directive récente zoome automatiquement sur ses premiers jours (un bouton permet de revenir à la vue sur 30 jours). Cela aide à comprendre pourquoi l’influence a bougé tel jour. Le jeu et d’autres escadrons agissent aussi : c’est une aide à la lecture, pas une preuve.',
        important: false
    },
    {
        id: '2026-10-tick-en-tete', date: '2026-10-21T21:17:03Z', type: 'NOUVEAU',
        titre: 'Le tick du BGS dans l’en-tête',
        texte: 'Au milieu de l’en-tête, un compte à rebours à la seconde donne le prochain tick, avec une marge d’incertitude. Le détecteur communautaire de ticks (tick.edcd.io) n’avait plus rien enregistré depuis plusieurs jours : dans ce cas l’heure est marquée « estimé » et calculée d’après les derniers jours, puis l’heure exacte revient dès qu’un vrai tick est détecté. La mention « dernier tick » des fenêtres de directives, qui pouvait être fausse, disparaît. Le bloc du nom d’escadron et du grade quitte l’en-tête pour laisser la place.',
        important: false
    },
    {
        id: '2026-10-hangar-edsy', date: '2026-10-21T21:17:02Z', type: 'NOUVEAU',
        titre: 'Hangar : simuler l’ingénierie sur EDSY',
        texte: 'Chaque vaisseau de votre hangar (et ceux des membres de l’escadron) a un bouton « Simuler sur EDSY » : il ouvre EDSY avec la configuration du vaisseau, modules et ingénierie compris, pour tester d’autres plans ou effets sans rien refaire à la main. Les valeurs exactes de vos jets d’ingénierie ne sont pas connues : EDSY part du jet maximal.',
        important: false
    },
    {
        id: '2026-10-menu-lateral', date: '2026-10-21T21:17:01Z', type: 'AMELIORE',
        titre: 'Menu latéral : boutons plus grands, déconnexion toujours visible',
        texte: 'Les boutons du menu latéral sont plus grands et mieux espacés. Nouveautés, gestion du compte et déconnexion restent épinglés en bas du menu : sur une tablette en paysage, où la liste est plus haute que l’écran, le bouton de déconnexion ne disparaît plus (la liste du haut défile).',
        important: false
    },
    {
        id: '2026-10-scores-conflit-couleurs', date: '2026-10-21T21:17:00Z', type: 'AMELIORE',
        titre: 'Guerres et élections : scores en vert, rouge ou bleu',
        texte: 'Dans les barres de guerre et d’élection de la page Engagement (et sur mobile), le score et le cadre sont verts quand votre faction gagne, rouges quand elle perd, bleus en cas d’égalité ou tant qu’aucun score n’est relevé.',
        important: false
    },
    {
        id: '2026-10-croises-journal-signal', date: '2026-10-21T20:15:40Z', type: 'AMELIORE',
        titre: 'Joueurs croisés : journal tactique, signal « nouveau » et couleur du vaisseau',
        texte: 'Quand un joueur est croisé pour la première fois par l’escadron, une ligne « Joueur croisé » apparaît dans le journal tactique, et un signal NOUVEAU clignote sur le bloc du Quartier général jusqu’à ce que vous ouvriez la fenêtre. Autre correction : dans la fenêtre, le vaisseau agrandi d’un joueur ennemi reste maintenant entièrement rouge, au lieu de rester bleu avec un simple contour rouge.',
        important: false
    },
    {
        id: '2026-10-colonisation-valeurs-dodec', date: '2026-10-19T23:04:01Z', type: 'AMELIORE',
        titre: 'Colonisation : valeurs à jour, Dodecahedron et ports principaux',
        texte: 'Le profil d’un système colonisé utilise maintenant les valeurs de la dernière version de la feuille communautaire de CMDR DaftMav, calée sur la mise à jour « Dodec » : une cinquantaine d’installations changent (développement, technologie, richesse, niveau de vie, population). Le Dodecahedron est enfin chiffré. Les recettes des ports principaux (premier site d’un système) étaient incomplètes : elles sont corrigées d’après les chantiers réellement relevés en jeu, ce qui permet de les reconnaître, et un Ocellus ou Orbis principal n’est plus pris pour un Dodecahedron. Les avant-postes ordinaires ne comptent plus d’aluminium en trop. Ces valeurs restent des estimations : seuls trois avant-postes ont été mesurés en jeu.',
        important: false
    },
    {
        id: '2026-10-camps-puissances', date: '2026-10-19T21:37:49Z', type: 'AMELIORE',
        titre: 'Combat et joueurs croisés : les camps des puissances',
        texte: 'Chaque puissance Powerplay appartient à un camp : Fédération, Empire, Alliance ou indépendants. Un joueur de la même puissance ou du même camp que vous s’affiche désormais en vert, un joueur d’un autre camp en rouge (« camp rival »). Les puissances indépendantes ne sont pas alliées entre elles : deux indépendantes différentes sont rivales. La règle s’applique dans l’onglet Combat, dans la fenêtre « Joueurs croisés » et dans l’onglet mobile « Croisés », où la puissance comptait peu jusqu’ici. Avant, deux puissances d’un même camp (par exemple Felicia Winters et Jerome Archer) passaient en rouge dans l’onglet Combat. Sans puissance connue, la couleur reste fondée sur le statut légal et la prime.',
        important: false
    },
    {
        id: '2026-10-ou-vendre-6-mois', date: '2026-10-19T19:59:45Z', type: 'AMELIORE',
        titre: 'Où vendre ? : relevés de 24 h, 7 jours ou 6 mois',
        texte: 'Quand les stations de la faction visée ne sont plus visitées, les relevés de marché de Spansh deviennent très vieux et la fenêtre « Où vendre ? » ne trouvait plus aucune route. Le réglage de fraîcheur propose maintenant trois niveaux : moins de 24 h, moins de 7 jours (par défaut) ou moins de 6 mois. Sans route, le message indique l’âge du dernier relevé connu et un bouton permet d’élargir à 6 mois. Avec des relevés anciens, vérifiez toujours le marché à l’arrivée : les prix peuvent avoir changé.',
        important: false
    },
    {
        id: '2026-10-hangar', date: '2026-10-19T19:46:05Z', type: 'NOUVEAU',
        titre: 'Mon hangar : vos vaisseaux et leur équipement actuel, en hologramme',
        texte: 'Une nouvelle page Mon hangar (menu latéral, sous le Quartier général) liste tous vos vaisseaux avec leur hologramme, coloré selon la taille (vert S, cyan M, ambre L), et l’équipement actuel de chacun : modules, niveau d’ingénierie, plan, effet expérimental, ingénieur. Les membres de votre escadron voient votre hangar depuis votre fiche pilote (bouton HANGAR de la page Escadron) ; il n’affiche ni valeur en crédits ni position. Le menu latéral est aussi plus compact pour tenir sur une tablette en paysage. Le hangar se remplit tout seul avec le plugin 2.41 : relancez EDMC une fois. Une annonce en plein écran présente le module, une seule fois.',
        important: false,
        action: 'Mettre à jour le plugin SYS.EDTEAM (2.41)'
    },
    {
        id: '2026-10-flotte-hologrammes-2', date: '2026-10-19T18:29:30Z', type: 'NOUVEAU',
        titre: 'Tableau de bord : 13 nouveaux vaisseaux en hologramme',
        texte: 'Votre vaisseau s’affiche en hologramme dans l’onglet Missions : modules, passagers dans leurs cabines et soute. Treize vaisseaux s’ajoutent : Imperial Eagle, Eagle, Viper Mk III, Cobra Mk III, Type-6 Transporter, Diamondback Explorer, Keelback, Vulture, Asp Explorer, Federal Dropship, Type-7 Transporter, Krait Mk II et Corsair. 32 vaisseaux sont maintenant disponibles, 14 autres arriveront plus tard. Une annonce en plein écran présente la liste, une seule fois.',
        important: false
    },
    {
        id: '2026-10-joueurs-croises', date: '2026-10-19T11:00:00Z', type: 'NOUVEAU',
        titre: 'Joueurs croisés : l’historique des joueurs verrouillés par l’escadron',
        texte: 'Chaque joueur (pas les PNJ) que l’un de vos pilotes verrouille dans l’onglet Combat est maintenant gardé dans un historique partagé par l’escadron, pendant 30 jours après la dernière fois qu’il est croisé. Le QG affiche à la place de « Quoi faire » le nombre de joueurs croisés : un clic ouvre la liste, avec une recherche, et chaque ligne se déplie pour montrer le vaisseau, le rang, la faction, l’escadron, la puissance, le statut légal, la prime, le dernier système et le pilote qui l’a vu. Le même historique s’ouvre depuis un bouton de l’onglet Combat. « Quoi faire » est retiré du QG, comme il l’avait été du mobile. Si le tableau de bord est ouvert sur votre second écran, verrouiller un joueur en jeu ouvre aussitôt son onglet Combat, quel que soit l’onglet où vous étiez ; l’enregistrement, lui, se fait même sans la page. Les membres de votre escadron n’apparaissent jamais dans la liste.',
        important: false,
        action: 'Mettre à jour le plugin SYS.EDTEAM (2.40)'
    },
    {
        id: '2026-10-combat-fiche-vus', date: '2026-10-19T10:10:00Z', type: 'AMELIORE',
        titre: 'Combat : l’escadron et la prime dans la fiche d’un vaisseau verrouillé',
        texte: 'Dans l’onglet Combat, la fiche qui s’ouvre quand vous touchez un vaisseau verrouillé récemment affiche maintenant son escadron et sa prime, quand le jeu les a donnés (un scan complet est nécessaire pour la prime). Mettez à jour le plugin (version 2.39) pour en profiter.',
        important: false,
        action: 'Mettre à jour le plugin SYS.EDTEAM (2.39)'
    },
    {
        id: '2026-10-mobile-allege', date: '2026-10-18T20:45:00Z', type: 'AMELIORE',
        titre: 'Mobile : plus léger, journal des exploits complet',
        texte: 'Le compagnon mobile est allégé : les blocs « L’escadron en chiffres » et « Rangs de pilote » de l’accueil, la carrière BGS de l’onglet Engagement et l’onglet Quoi faire ont disparu. Les nouveautés passent dans un bouton ✨ de l’en-tête, avec une pastille quand il y en a du non lu. Le réglage des initiatives est maintenant en bas de l’onglet Campagnes. Le journal des exploits reprend celui du PC : lignes Powerplay (mérites et CP estimés), actions des directives clôturées, faction du lieu, et filtres par période, pilote et spécialité. L’onglet Bâtir est refait pour se lire d’un coup d’œil : un bandeau de 3 chiffres, les 3 matériaux à apporter en priorité, puis la liste des chantiers avec leur pourcentage en grand (touchez un chantier pour voir ce qui manque).',
        important: false
    },
    {
        id: '2026-10-onglet-combat', date: '2026-10-18T18:37:00Z', type: 'NOUVEAU',
        titre: 'Tableau de bord : le nouvel onglet Combat',
        texte: 'Un onglet Combat s’ouvre tout seul quand un combat commence. À gauche, votre vaisseau ou votre combinaison à pied, avec son armement et l’état de vos boucliers. À droite, la cible verrouillée en hologramme, dont les informations se déchiffrent pendant le scan, avec une menace estimée et les derniers vaisseaux verrouillés. Le cadre est rouge pour un hostile, vert pour un allié et bleu quand le camp n’est pas connu, pour ne pas tirer sur un allié sans le voir. En dessous : le tableau de chasse (bons de guerre ou primes, vaisseau éliminé, palier), la session de combat et, au sol, un buste d’opérateur par ennemi éliminé. Des sons accompagnent le verrouillage et un capitaine commente les éliminations, avec un interrupteur pour les couper. Le dernier rapport est gardé séparément en vaisseau et à pied. Le plugin n’envoie plus le ciblage des joueurs : la fenêtre COVAS et le registre tactique ont été retirés.',
        important: true, action: 'Redémarrez EDMC (plugin 2.38)'
    },
    {
        id: '2026-10-retrait-covas-registre', date: '2026-10-18T14:37:00Z', type: 'AMELIORE',
        titre: 'Retrait de l’alerte de ciblage COVAS et du registre tactique',
        texte: 'La fenêtre qui s’ouvrait en plein écran quand vous verrouilliez un joueur, et le registre tactique qui la nourrissait (signalements K.O.S., suspects, alliés VIP), sont retirés : plus personne ne les utilisait. La carte « Renseignement » disparaît aussi des chiffres clés de l’escadron. Rien d’autre ne change, et le plugin n’envoie plus le ciblage des joueurs.',
        important: false
    },
    {
        id: '2026-10-commerce-pv-carte', date: '2026-10-18T12:52:00Z', type: 'CORRIGE',
        titre: 'Commerce : tournée depuis un porte-vaisseaux, et carte pour les vaisseaux sans hologramme',
        texte: 'La feuille de route ne trouvait aucune tournée quand vous étiez amarré à un porte-vaisseaux, car la recherche ne sait pas partir d’un porte-vaisseaux. Elle part maintenant de la station la plus proche. D’autre part, si votre vaisseau n’a pas encore d’hologramme, l’onglet Commerce affiche directement la carte du trajet à côté de la feuille de route, sans bouton de bascule.',
        important: false
    },
    {
        id: '2026-10-flotte-hologrammes', date: '2026-10-18T12:36:00Z', type: 'NOUVEAU',
        titre: 'Tableau de bord : 12 nouveaux vaisseaux en hologramme',
        texte: 'Votre vaisseau s’affiche en hologramme dans l’onglet Missions : modules, passagers dans leurs cabines et soute. Douze vaisseaux s’ajoutent : Imperial Courier, Imperial Cutter, Fer-de-Lance, Kestrel Mk II, Type-11 Prospector, Dolphin, Beluga Liner, Diamondback Scout, Cobra Mk V, Federal Gunship, Python et Python Mk II. Ils rejoignent le Panther, le Lynx, le Mandalay, le Type-8, le Caspian, l’Anaconda et la Corvette : 19 vaisseaux au total, 27 autres arriveront plus tard. Une annonce en plein écran présente la liste, une seule fois.',
        important: false
    },
    {
        id: '2026-10-campagnes-par-systeme', date: '2026-10-18T11:12:00Z', type: 'AMELIORE',
        titre: 'Campagnes : les missions classées par système',
        texte: 'Dans chaque campagne, les missions sont maintenant rangées par système, de A à Z, tous types mélangés (BGS, Powerplay, colonisation). Quand un système a plusieurs missions, elles sont regroupées sous un petit en-tête avec le nom du système et leur nombre. Sur PC comme sur mobile.',
        important: false
    },
    {
        id: '2026-10-interception-bug', date: '2026-10-17T19:43:00Z', type: 'CORRIGE',
        titre: 'Tableau de bord : interception avec des passagers sans annonce',
        texte: 'Certaines interceptions par un PNJ ne déclenchaient pas l’annonce du pilote ni les cris des passagers pendant le mini-jeu, car le jeu n’envoie pas toujours de message de début. Le plugin détecte désormais l’interception directement dans l’état du vaisseau : l’annonce et les cris partent à chaque interception avec des passagers à bord, que l’interdicteur soit un PNJ ou un joueur.',
        important: false, action: 'Redémarrez EDMC (plugin 2.37)'
    },
    {
        id: '2026-10-son-vente-marche', date: '2026-10-17T17:32:00Z', type: 'NOUVEAU',
        titre: 'Tableau de bord : annonce à la vente au marché',
        texte: 'Quand vous vendez des marchandises au marché d’une station, avec ou sans mission, une annonce appelle le responsable du marché au hangar (en anglais). Quelques secondes plus tard, le responsable de la soute du vaisseau vous annonce à l’interphone que tout est vendu, avec de temps en temps une petite blague. Un seul son par vente groupée.',
        important: false, action: 'Redémarrez EDMC (plugin 2.36)'
    },
    {
        id: '2026-10-sons-interception', date: '2026-10-17T17:07:00Z', type: 'NOUVEAU',
        titre: 'Tableau de bord : interception avec des passagers à bord',
        texte: 'Quand un PNJ vous intercepte en supercruise avec une mission de passagers ou de tourisme en cours, une annonce du pilote (en anglais) demande aux passagers de rester calmes pendant le mini-jeu, avec leurs cris en fond. Si vous vous échappez, un soupir de soulagement puis une annonce vous confirme que l’on est en sécurité et que l’on peut de nouveau circuler dans le vaisseau. Les interceptions par un joueur ne déclenchent que le son de fin.',
        important: false, action: 'Redémarrez EDMC (plugin 2.35)'
    },
    {
        id: '2026-10-sons-balise-tourisme', date: '2026-10-17T17:06:00Z', type: 'NOUVEAU',
        titre: 'Tableau de bord : balise de tourisme scannée',
        texte: 'Quand vous scannez une balise de tourisme avec des passagers à bord, les appareils photo crépitent et les passagers, tout excités, parlent plus fort que durant le vol. Une annonce de cabine (en anglais) indique que vous êtes arrivés à destination et invite les passagers à observer le site.',
        important: false, action: 'Redémarrez EDMC (plugin 2.35)'
    },
    {
        id: '2026-10-sons-applaudissements-chargement', date: '2026-10-17T17:05:00Z', type: 'NOUVEAU',
        titre: 'Tableau de bord : applaudissements à l’amarrage et chargement de la soute',
        texte: 'Quand vous vous amarrez avec des passagers à bord, ils applaudissent. Le son de chargement, refait avec des dockers qui rangent leurs caisses dans une soute immense, se joue désormais à chaque ajout d’au moins 1 tonne à quai, et aussi quand vous transférez la soute du VRS dans le vaisseau. Parfois, un vieux vétéran de la soute vous lance un « c’est chargé, commandant » suivi d’une blague (en anglais). Rien ne sonne pendant le minage.',
        important: false
    },
    {
        id: '2026-10-annonce-saut', date: '2026-10-17T11:35:00Z', type: 'NOUVEAU',
        titre: 'Tableau de bord : annonce aux passagers au saut hyperespace',
        texte: 'Dès que vous lancez la charge du FSD pour un saut vers un autre système, avec une mission de passagers ou de tourisme en cours, une annonce de cabine prévient les passagers de s’accrocher (et leur rappelle les sacs à leur disposition), avec une alarme légère en fond. Trois annonces en anglais, tirées au hasard. Elle passe avant toutes les autres : l’annonce de cabine en cours est coupée. Les annonces d’embarquement et de débarquement passent elles aussi avant celles de la cabine en vol, et les sons d’embarquement et de débarquement partent désormais dès que la mission est prise ou rendue, sans attendre.',
        important: true, action: 'Redémarrez EDMC (plugin 2.34)'
    },
    {
        id: '2026-10-mobile-engagement', date: '2026-10-16T22:11:50Z', type: 'AMELIORE',
        titre: 'Mobile : campagnes et onglet Engagement refaits',
        texte: 'Sur mobile, les campagnes ont le même langage que sur PC : le type de la campagne en gros, une ligne par mission dont le fond est la barre de progression (votre part en lueur néon), les guerres et élections mises en avant avec leur score, les objectifs de CP des missions Powerplay, et un toucher pour replier une campagne. L’onglet BGS devient Engagement : vos mérites Powerplay à côté de vos points BGS, le podium de l’escadron cette semaine et, d’un toucher, le classement complet. La page de présentation du site est aussi refaite avec de nouveaux visuels.',
        important: false
    },
    {
        id: '2026-10-plafond-glisser', date: '2026-10-16T21:47:12Z', type: 'NOUVEAU',
        titre: 'Campagnes : plafond de CP et glisser-déposer',
        texte: 'L’Amiral et les officiers peuvent fixer un plafond de CP à une mission Powerplay : la barre de la mission se remplit alors jusqu’à cet objectif (CP estimés = mérites ÷ 4) et affiche « objectif atteint ». L’Amiral peut aussi réorganiser ses campagnes d’un glisser-déposer : une mission se glisse dans une autre campagne, et une campagne se glisse plus haut ou plus bas (elle prend la priorité de sa nouvelle place). Dans le journal, les colonnes Vecteur et Rang BGS · CP ne se coupent plus sur deux lignes.',
        important: false
    },
    {
        id: '2026-10-recrues-acces', date: '2026-10-16T20:50:08Z', type: 'AMELIORE',
        titre: 'Les recrues accèdent à tout le site, et le journal est moins chargé',
        texte: 'Les recrues d’un escadron peuvent maintenant ouvrir toutes les pages, y compris Engagement (BGS, Powerplay) et Escadron. Leur fiche indique RECRUE jusqu’à ce que l’Amiral les passe PILOTE dans le jeu. Dans le journal des exploits, les petits gains de mérites en rafale (par exemple 11 mérites à chaque vaisseau croisé dans un système) sont réunis en une seule ligne avec le total et le nombre de gains (×5).',
        important: false
    },
    {
        id: '2026-10-campagnes', date: '2026-10-16T20:00:33Z', type: 'NOUVEAU',
        titre: 'BGS : les campagnes, avec le Powerplay et la colonisation',
        texte: 'La page BGS s’organise autour de campagnes lancées par l’Amiral : attaque, défense, maintien ou conquête, de la plus critique à la plus calme. Chaque campagne réunit ses missions sur une seule ligne chacune : influence d’une faction (BGS), mérites Powerplay d’un système (renforcement, sape, acquisition) et colonisation (terminer des chantiers ou coloniser un système). Un clic ouvre la fenêtre de la mission : effort de l’escadron, votre part, et l’état du jeu. Les initiatives des pilotes restent à part, et peuvent maintenant aussi être Powerplay ou de colonisation. Le journal des exploits mélange tout, avec de nouveaux filtres. Les mérites Powerplay sont rattachés au système où vous étiez ; les CP sont une estimation (mérites ÷ 4). Il faut avoir rejoint une puissance pour participer aux missions Powerplay. Le bouton du menu s’appelle désormais « Engagement » : il garde votre progression BGS et Powerplay sur 8 semaines, et le podium de l’escadron (clic pour le classement complet de la semaine).',
        important: true,
        action: 'Relancez EDMC une fois : le plugin v2.32 se met à jour tout seul.'
    },
    {
        id: '2026-10-onglet-exploration', date: '2026-10-16T12:40:03Z', type: 'NOUVEAU',
        titre: 'Tableau de bord : l’onglet Exploration, avec l’exobiologie',
        texte: 'Un nouvel onglet suit votre exploration en direct : la carte du système avec ses corps (un clic ouvre la fiche : valeur du scan, de la carte DSS, signaux biologiques), votre feuille de route de cibles, et la valeur de ce que vous n’avez pas encore vendu, cartographie et exobiologie séparées. Chaque échantillon d’exobiologie a sa carte : espèce, couleur de la variante, trois fioles qui se remplissent à chaque prélèvement, valeur. « Ce que j’ai découvert » ouvre le journal de vos scans. « Où vendre » trouve les stations les plus proches et montre celles qui rachètent vos scans et vos échantillons. Aussi dans le tableau de bord : une vue carte dans Commerce (le trajet de votre tournée, comme dans Missions) et des bandeaux de chiffres plus compacts en haut de chaque onglet.',
        important: true,
        action: 'Relancez EDMC une fois : le plugin v2.31 se met à jour tout seul.'
    },
    {
        id: '2026-10-fin-ambiance-depot', date: '2026-10-15T20:48:11Z', type: 'AMELIORE',
        titre: 'Tableau de bord : l’ambiance en boucle du dépôt est supprimée',
        texte: 'Les ouvriers et les chariots qui tournaient en boucle quand vous transportiez des caisses étaient trop présents : cette ambiance n’existe plus. Les sons ponctuels de chargement et de déchargement restent, ainsi que l’ambiance de cabine quand vous avez des passagers.',
        important: false
    },
    {
        id: '2026-10-plugin-2-29-colonisation', date: '2026-10-15T20:45:50Z', type: 'AMELIORE',
        titre: 'Colonisation : vos livraisons apparaissent dans la minute',
        texte: 'Avant, la fenêtre d’un système colonisé pouvait mettre plusieurs minutes à montrer ce que vous veniez de livrer. Le plugin envoie maintenant vos livraisons environ vingt secondes après la dernière marchandise déposée : plusieurs marchandises livrées à la suite partent ensemble, et la progression du chantier se met à jour toute seule dans la fenêtre ouverte.',
        important: true,
        action: 'Relancez EDMC une fois : le plugin v2.29 se met à jour tout seul.'
    },
    {
        id: '2026-10-sons-evenements-vaisseau', date: '2026-10-15T20:04:10Z', type: 'NOUVEAU',
        titre: 'Tableau de bord : des sons pour l’embarquement, le débarquement et la soute',
        texte: 'Quand vous prenez une mission de passagers ou de tourisme, vous entendez le signal d’arrivée du quai, les portes qui s’ouvrent, les passagers qui embarquent et une annonce de bienvenue. Quand vous la rendez, c’est l’annonce d’au revoir. Le chargement de marchandises (la soute passe à 1 tonne ou plus) et le déchargement (vente, livraison, soute vidée à quai) ont aussi leur son. Ces sons se jouent une fois, par-dessus les ambiances de cabine et de dépôt, et suivent le bouton « ♪ AMBIANCE » ainsi que le haut-parleur du pied de page. Le bouton devient rouge quand l’ambiance est coupée. Le navigateur n’autorise le son qu’après un clic sur la page : un petit encadré orange vous prévient si un son a été bloqué.',
        important: false
    },
    {
        id: '2026-10-plugin-2-28-missions', date: '2026-10-15T17:58:34Z', type: 'CORRIGE',
        titre: 'Missions en cours : elles ne perdent plus leurs détails quand vous relancez le jeu',
        texte: 'Quand vous quittiez puis relanciez le jeu avec des missions en cours (surtout celles qui durent plusieurs heures), elles revenaient sur le tableau de bord sans titre, sans destination ni récompense, classées « sans destination ». Le plugin retrouve maintenant ces détails dans vos journaux des 14 derniers jours : titre, destination, récompense, passagers, échéance réelle et point de prise.',
        important: true,
        action: 'Relancez EDMC une fois : le plugin v2.28 se met à jour tout seul.'
    },
    {
        id: '2026-10-ambiance-off-visible', date: '2026-10-15T17:41:05Z', type: 'AMELIORE',
        titre: 'Ambiance sonore : le bouton OFF bien visible',
        texte: 'Sur l’hologramme du vaisseau, le bouton « ♪ AMBIANCE » devient rouge et pulse doucement quand l’ambiance est coupée, pour qu’on ne cherche plus pourquoi on n’entend rien. Un clic dessus la réactive. Rappel : ce réglage est mémorisé par navigateur.',
        important: false
    },
    {
        id: '2026-10-missions-tourisme', date: '2026-10-15T17:25:49Z', type: 'CORRIGE',
        titre: 'Missions de tourisme : destinations multiples et passagers à bord',
        texte: 'Les missions de tourisme qui demandent de visiter plusieurs systèmes affichaient un nom illisible du genre « AREXACK$MISSIONUTIL_MULTIPLE… ». Chaque système est maintenant un arrêt du parcours et de la carte. Les passagers touristes sont aussi comptés dans l’hologramme du vaisseau : les places occupées et l’ambiance sonore de la cabine fonctionnent de nouveau quand vous n’avez que des missions de tourisme.',
        important: false
    },
    {
        id: '2026-10-colonisation-refonte-fenetre', date: '2026-10-14T22:45:16Z', type: 'NOUVEAU',
        titre: 'Colonisation : la fenêtre d’un système refaite avec la carte du système',
        texte: 'La fenêtre d’un système colonisé est refaite en quatre onglets : vue d’ensemble, profil, installations et chantiers. La vue d’ensemble montre la carte du système comme dans le jeu (l’étoile, les planètes et les stations sous leur corps, avec l’avancement des chantiers), les indicateurs en un coup d’œil et le résumé des chantiers. Les explications de méthode sont repliées. Les corps et stations de la carte viennent d’EDSM : un système jamais scanné peut avoir une carte incomplète.',
        important: false
    },
    {
        id: '2026-10-colonisation-sans-architecte', date: '2026-10-14T22:14:35Z', type: 'AMELIORE',
        titre: 'Colonisation : déclarer les systèmes sans architecte',
        texte: 'Quand le jeu n’a pas enregistré la revendication d’un système, son architecte reste inconnu et ses chantiers ne lui sont pas rattachés. La page Colonisation affiche maintenant un bandeau « Systèmes sans architecte (à déclarer) », avec une liste filtrable, et une fenêtre à l’arrivée tant qu’il en reste : si vous êtes l’architecte de l’un d’eux, cliquez sur « Je suis l’architecte ». Les confirmations de cette page ont aussi été refaites au style du site.',
        important: false
    },
    {
        id: '2026-10-colonisation-profil-systeme', date: '2026-10-14T20:02:03Z', type: 'NOUVEAU',
        titre: 'Colonisation : le profil de chaque système',
        texte: 'La fenêtre d’un système colonisé affiche maintenant son profil : développement, technologie, sécurité, richesse, niveau de vie, population et points de construction, additionnés d’après les installations, avec un pictogramme et les effets de chacune. Le sélecteur « Avec les chantiers » montre ce que donneraient les constructions en cours. Seules les installations dont le type est connu (reconnu d’après la recette du chantier ou le type de station du jeu) sont additionnées : une installation en orange n’ajoute rien, le site ne devine pas ; l’architecte du système peut en déclarer le type pour qu’elle compte. Ce sont des estimations d’après la feuille communautaire de CMDR DaftMav. Il faut le plugin SYS.EDTEAM 2.27 (version mobile à venir).',
        important: false
    },
    {
        id: '2026-10-equipage-pilote', date: '2026-10-14T18:37:20Z', type: 'NOUVEAU',
        titre: 'Tableau de bord : votre co-pilote et votre chasseur dans l’hologramme',
        texte: 'Dans l’hologramme de votre vaisseau, vous apparaissez maintenant dans le cockpit avec votre nom de commandant, et votre co-pilote PNJ est dessiné à côté de vous avec son nom et son rang (Competent, Expert…). S’il part en chasseur, une petite icône sort du vaisseau ; s’il est mis en inactif dans le salon d’équipage, il disparaît de l’hologramme. Il faut le plugin SYS.EDTEAM 2.25 : au lancement du jeu, le rang est retrouvé dans vos anciens journaux.',
        important: false
    },
    {
        id: '2026-10-hologramme-unifie-ambiances', date: '2026-10-14T18:20:00Z', type: 'AMELIORE',
        titre: 'Tableau de bord : un hologramme unique, des zooms et des ambiances sonores',
        texte: 'L’hologramme de votre vaisseau est maintenant le même dans Commerce, Missions et Minage, à la même taille. Un bouton « MODULES » déplie la liste des modules avec leur niveau d’ingénierie, et survoler une ligne allume le module dans la coque. À droite du vaisseau, un zoom montre la composition de vos passagers et de vos caisses (le Rhino a le sien dans Minage). Vous apparaissez dans le cockpit avec votre nom de commandant. Enfin, des ambiances sonores accompagnent la soute (ouvriers qui rangent des caisses) et les passagers (brouhaha et annonces de bord) : elles démarrent après un clic sur la page et se coupent avec le bouton « ♪ AMBIANCE » ou le haut-parleur du pied de page.',
        important: false
    },
    {
        id: '2026-10-colonisation-declarer-architecte', date: '2026-10-13T22:50:00Z', type: 'NOUVEAU',
        titre: 'Colonisation : se déclarer architecte d’un système',
        texte: 'Le jeu n’a pas toujours enregistré la revendication d’un système dans le journal : l’architecte restait alors « inconnu » et le système n’apparaissait pas à votre nom. Dans la fenêtre d’un système de la page Colonisation (PC et mobile), le bouton « Je suis l’architecte » vous permet de vous déclarer. Il n’existe que pour un système de votre escadron (ou de votre espace personnel) qui n’a pas encore d’architecte, il ne remplace jamais une revendication relevée par le jeu, et le bouton « Retirer » annule votre déclaration.',
        important: false
    },
    {
        id: '2026-10-onglet-minage', date: '2026-10-13T16:38:00Z', type: 'NOUVEAU',
        titre: 'Tableau de bord : l’onglet Minage (Rhino et vaisseau)',
        texte: 'Le tableau de bord a maintenant un onglet Minage (Rhino au sol ou vaisseau), en trois étapes qui suivent votre façon de jouer. 1 · Où se poser : les planètes du système où atterrir (nature, sol, gravité) avec les emplacements d’extraction une fois scannés ; en vaisseau, les anneaux. 2 · Quoi miner : cochez les matériaux affichés dans le jeu après le scan ; le tableau compare leur meilleur prix dans ce système (pour le Powerplay) et ailleurs, avec la valeur d’une soute pleine. 3 · Miner et transférer : rythme, durée, soute du Rhino et du vaisseau en hologramme, et une flèche qui s’anime pendant que le Rhino se remplit, plus vive à partir de 60 minerais pour penser au transfert. Une petite cascade de tintements retentit quand des minerais arrivent dans le Rhino (la page est mise à jour toutes les 30 à 60 secondes pendant le minage) et un petit air quand le transfert vers le vaisseau est terminé (le haut-parleur du site les coupe). Les étapes 1 et 2 se replient toutes seules dès que vous minez. Il faut le plugin SYS.EDTEAM 2.20 ; les prix viennent des relevés des joueurs (Spansh) et peuvent avoir quelques heures de retard.',
        important: true,
        action: 'Mettez à jour le plugin SYS.EDTEAM (2.20) pour voir votre minage.'
    },
    {
        id: '2026-10-bgs-detail-directive', date: '2026-10-13T14:48:00Z', type: 'NOUVEAU',
        titre: 'Directives BGS : activité du système, conseils selon l’état et fenêtre repensée',
        texte: 'Le détail d’une directive s’enrichit. Nouvelle zone « Activité du système » : trafic (vaisseaux) et morts relevés par EDSM, avec un niveau (calme, habituel, animé…) qui apparaît après quelques jours de relevés. L’heure du dernier tick est affichée en haut et chaque faction montre son humeur. Un bloc « Conseils selon l’état » dit ce que l’état de la faction change pour votre action (Boom : le commerce pèse double ; Famine ou Épidémie : le combat n’a plus d’effet ; Confinement : aucune action ne compte), avec une petite étiquette sur les barres d’effort concernées : ce sont des indications tirées des guides de la communauté, à vérifier, qui ne changent ni vos jauges ni vos points. La fenêtre passe en paysage (effort à gauche, résultat du jeu à droite) et toutes les barres d’effort sont sur deux lignes. Enfin, pour une directive de baisse, le vol de régulateurs et le piratage de données ne sont plus une jauge de la directive, car rien ne confirme qu’ils fassent baisser l’influence ; ils comptent toujours pour votre rang BGS.',
        important: true
    },
    {
        id: '2026-10-hologramme-points-discrets', date: '2026-10-13T13:55:00Z', type: 'AMELIORE',
        titre: 'Hologramme des modules : points d’emplacement discrets',
        texte: 'Les points qui marquent l’emplacement des modules sur l’hologramme sont désormais petits, gris et fixes (plus de couleur ni de clignotement). Les passagers et les caisses ressortent mieux quand la soute et les cabines sont pleines.',
        important: false
    },
    {
        id: '2026-10-missions-deux-vues-mandalay', date: '2026-10-12T18:52:00Z', type: 'AMELIORE',
        titre: 'Missions : toujours deux vues, et la Mandalay en hologramme',
        texte: 'Dans l’onglet Missions, les boutons « Vue vaisseau » et « Vue carte » sont maintenant toujours là, même sans mission en cours : la carte montre alors votre position. La Mandalay rejoint les vaisseaux modélisés en hologramme. La petite carte ne recouvre plus les modules sur les vaisseaux larges.',
        important: false
    },
    {
        id: '2026-10-hologrammes-nouveaux-vaisseaux', date: '2026-10-12T18:26:00Z', type: 'NOUVEAU',
        titre: 'Tableau de bord : quatre nouveaux vaisseaux en hologramme',
        texte: 'L’hologramme des modules fonctionne maintenant aussi pour la Federal Corvette, l’Anaconda, le Caspian Explorer et le Type-8 Transporter, en plus du Lynx Highliner et du Panther Clipper Mk II. Vos modules, leur niveau d’ingénierie, vos cabines, vos passagers et votre soute y apparaissent comme sur les deux premiers. D’autres vaisseaux suivront.',
        important: false
    },
    {
        id: '2026-10-page-escadron-refaite', date: '2026-10-12T17:56:15Z', type: 'AMELIORE',
        titre: 'Page Escadron : chiffres, code d’invitation et renseignement réunis',
        texte: 'En haut de la page Escadron, les chiffres clés de l’escadron tiennent sur une ligne, avec à leur droite le code d’invitation (visible des officiers et de l’Amiral). Le registre du renseignement s’ouvre maintenant depuis la carte « Renseignement » de cette page, et on y reste en le fermant. Pour l’Amiral, le réglage des initiatives des pilotes se replie en une ligne qui rappelle le mode choisi.',
        important: false
    },
    {
        id: '2026-10-chiffres-page-escadron', date: '2026-10-12T19:20:00Z', type: 'AMELIORE',
        titre: 'Les chiffres de l’escadron passent sur la page Escadron',
        texte: 'Les cinq blocs de chiffres (effectif, renseignement, BGS, Powerplay, colonisation) ne sont plus en bas du QG : vous les trouvez en haut de la page Escadron, sur une seule ligne. Les cartes des pilotes y sont aussi un peu moins grandes, pour en voir davantage d’un coup d’œil.',
        important: false
    },
    {
        id: '2026-10-entete-pilotes-actifs', date: '2026-10-12T18:40:00Z', type: 'AMELIORE',
        titre: 'En-tête plus léger, noms de commandants en entier',
        texte: 'Dans l’en-tête, un petit bloc indique simplement le nombre de pilotes actifs sur l’application (au moins une action sur les 30 derniers jours). Dans le journal BGS et le journal de la colonisation, les noms de commandants s’affichent en entier.',
        important: false
    },
    {
        id: '2026-10-ecrans-14-pouces', date: '2026-10-12T18:10:00Z', type: 'CORRIGE',
        titre: 'Petits écrans : QG et journal BGS mieux ajustés',
        texte: 'Sur un écran de portable (14 pouces), les cinq blocs de chiffres de l’escadron au bas du QG tiennent maintenant sur une seule ligne, et dans le journal BGS la colonne « Théâtre d’opération » est plus large : le nom de la faction ne se coupe plus.',
        important: false
    },
    {
        id: '2026-10-hologramme-zoom', date: '2026-10-12T17:22:00Z', type: 'AMELIORE',
        titre: 'Tableau de bord : zoom sur le vaisseau en hologramme',
        texte: 'Sur un petit écran, le vaisseau était difficile à lire en entier. Vous pouvez maintenant zoomer avec la molette de la souris ou les boutons + et −, puis faire glisser le vaisseau pour voir de près les soutes, les cabines et les modules. Le bouton ⟲ revient à la vue d’ensemble. Valable dans les onglets Missions et Commerce.',
        important: false
    },
    {
        id: '2026-10-commerce-disposition', date: '2026-10-11T18:09:00Z', type: 'AMELIORE',
        titre: 'Tableau de bord, Commerce : une route plus lisible',
        texte: 'Les réglages de la tournée se replient en une ligne de résumé, les indicateurs tiennent sur une ligne, et un arrêt déplié montre simplement ce qu’il faut acheter et vendre (nom, quantité, prix, stock). Entre deux arrêts, une petite pastille donne la distance, la durée et le gain du trajet. La route est à gauche et le vaisseau reste visible à droite, comme dans l’onglet Missions. Troisième choix à côté de « Tournée de vaisseau » et « Porte-vaisseaux » : « Vendre mes soutes », qui cherche où vendre ce que vous transportez, directement dans la colonne de gauche (plus de fenêtre).',
        important: false
    },
    {
        id: '2026-10-missions-disposition', date: '2026-10-11T17:46:00Z', type: 'AMELIORE',
        titre: 'Tableau de bord, Missions : liste compacte et carte en grand',
        texte: 'Chaque mission tient maintenant sur une seule ligne (type, titre, récompense, échéance) ; un clic ouvre ses détails juste dessous. À droite, un bouton bascule entre la vue vaisseau et la vue carte : la carte des missions est bien plus grande et lisible, et une petite carte reste visible dans un coin du vaisseau (un clic l’agrandit). Le bouton de la carte clignote quand une mission arrive ou que le prochain arrêt change. Votre choix de vue est mémorisé.',
        important: false
    },
    {
        id: '2026-10-initiatives-liste-factions', date: '2026-10-11T17:26:00Z', type: 'CORRIGE',
        titre: 'Initiatives : les factions du système s’affichent en boutons',
        texte: 'Quand vous saisissez un système pour lancer une initiative, les factions trouvées apparaissent sous le champ : un clic ou un toucher sur celle que vous visez suffit, sur PC comme sur mobile. Plus besoin de deviner où cliquer pour ouvrir la liste.',
        important: false
    },
    {
        id: '2026-10-initiatives-guerre-election', date: '2026-10-11T17:10:00Z', type: 'AMELIORE',
        titre: 'Initiatives : guerre et élection aussi',
        texte: 'Les initiatives de pilotes ne se limitent plus à la hausse et à la baisse : vous pouvez aussi lancer une guerre ou une élection. Elles suivent le réglage de votre Amiral : libres (actives tout de suite), sur validation (vous les proposez, un officier ou l’Amiral les accepte) ou désactivées. Une guerre ne peut pas viser la faction de votre propre escadron. L’Amiral et les officiers n’ont plus le bouton d’initiative : ils lancent leurs directives depuis le bouton Commandement.',
        important: false
    },
    {
        id: '2026-10-modules-vaisseau', date: '2026-10-11T15:40:00Z', type: 'NOUVEAU',
        titre: 'Tableau de bord : les modules de votre vaisseau',
        texte: 'Dans l’onglet Missions, l’hologramme de votre vaisseau (Panther Clipper Mk II ou Lynx Highliner) montre maintenant tous vos modules. Sur les côtés, des traits relient les modules primordiaux, les points d’emport et les utilitaires à leur place dans la coque, avec leur niveau d’ingénierie (G1 à G5) ou « STOCK » s’ils ne sont pas ingénierés. Dans la coque, vos modules optionnels forment des compartiments proportionnels à la taille de chaque emplacement, regroupés par type (cabines, racks de soute…) avec un rendu de scanner infrarouge : vous voyez d’un coup d’œil ce que contient votre vaisseau, vos emplacements vides, et par exemple 3 cabines et pas de soute. Les passagers se promènent dans les cabines, les marchandises remplissent les racks. Survolez un compartiment pour son détail : module, places ou capacité, plan d’ingénierie, effet expérimental, ingénieur et modifications. Le même hologramme est dans l’onglet Commerce, à la place de la soute en vue séparée : un pilote qui ne fait que du commerce voit sa coque remplie de racks et de sa cargaison (survolez une caisse pour la marchandise), avec le bouton « Vendre ce que je transporte ». Chaque pilote voit son propre équipement. Les noms des modules sont ceux du jeu (en anglais). La disposition dans la coque est stylisée : le jeu ne donne pas la position des modules.',
        important: false,
        action: 'Relancez EDMC une fois : le plugin v2.18 se met à jour tout seul (nécessaire pour lire vos modules ; il corrige aussi le nombre de places des cabines Mk II du Lynx).'
    },
    {
        id: '2026-10-missions-au-sol', date: '2026-10-11T14:18:00Z', type: 'NOUVEAU',
        titre: 'Tableau de bord : votre combinaison quand vous êtes à pied',
        texte: 'Quand vous descendez de votre vaisseau, l’onglet Missions affiche votre combinaison vue de dos (combinaison de vol, Maverick, Artemis ou Dominator) en hologramme, avec des traits qui partent vers chaque équipement : arme principale (et la deuxième pour la Dominator), arme secondaire, combinaison avec ses modifications, ceinture avec vos consommables, et sac à dos avec la liste de ce qu’il contient (données volées, composants, objets). Ça se met à jour quand vous ramassez ou utilisez quelque chose. Le jeu ne donne pas les outils équipés ni la capacité du sac : ils ne sont pas affichés. Sur un petit écran, vous avez les mêmes informations en listes.',
        important: false,
        action: 'Relancez EDMC une fois : le plugin v2.17 se met à jour tout seul (nécessaire pour suivre votre combinaison et votre sac à dos).'
    },
    {
        id: '2026-10-missions-passagers', date: '2026-10-11T11:00:00Z', type: 'NOUVEAU',
        titre: 'Tableau de bord : vos passagers dans le vaisseau',
        texte: 'Quand vous avez une mission de passagers en cours, l’onglet Missions affiche maintenant votre vaisseau en hologramme à côté de la carte : les passagers se promènent dans la coque sous un balayage radar, avec une couleur par type (orange pour les touristes et hommes d’affaires, jaune pour les VIP et officiels, vert pour la sécurité et l’aide humanitaire, rouge pour les prisonniers, criminels et recherchés). Les personnages importants sont plus grands et entourés d’un halo. Une jauge indique les places occupées sur la capacité de vos cabines, et passe au rouge si vous avez plus de passagers que de places. La soute est à l’arrière, avec les marchandises à bord, de livraison par exemple. Pour une mission de sauvetage, le colis à récupérer apparaît en pointillés avec un « ? » dans la soute, et se remplit dès qu’il est à bord. Disponible pour le Panther Clipper Mk II et le Lynx Highliner (dont la soute s’affiche aussi en hologramme dans l’onglet Commerce), les autres vaisseaux viendront plus tard. La répartition dans la coque est stylisée : le jeu ne donne pas la position des modules.',
        important: false,
        action: 'Relancez EDMC une fois : le plugin v2.18 se met à jour tout seul (nécessaire pour lire vos modules, vos cabines et le type de chaque passager).'
    },
    {
        id: '2026-10-soute-vaisseau', date: '2026-10-11T00:37:00Z', type: 'NOUVEAU',
        titre: 'Tableau de bord : votre soute dans le vaisseau',
        texte: 'Dans l’onglet Commerce, la soute s’affiche maintenant dans une vue holographique de votre vaisseau : les caisses sont réparties dans la coque, comme vues par un capteur infrarouge, et la baie de soute est agrandie à côté avec de grosses caisses carrées. Survolez une caisse ou la légende pour voir la marchandise. Disponible pour le Panther Clipper Mk II ; les autres vaisseaux gardent la grille actuelle, en attendant leur dessin. La soute passe au-dessus de la feuille de route, et « Vendre ce que je transporte » s’ouvre maintenant dans une fenêtre, depuis un bouton de l’hologramme (plus de bloc en bas de page).',
        important: false
    },
    {
        id: '2026-10-tableau-bord-parcours', date: '2026-10-10T23:45:00Z', type: 'AMELIORE',
        titre: 'Tableau de bord : un parcours de missions plus clair',
        texte: 'Dans l’onglet Missions, chaque arrêt du parcours est maintenant une carte qui contient ses propres missions, sans colonne vide. La carte et la liste partagent les mêmes numéros et couleurs : vous voyez où vous êtes, où aller ensuite, les systèmes déjà passés dont la mission n’est pas terminée (en ambre) et ceux qui sont terminés (en gris). Si vous avez des missions à rendre là où vous les avez prises (massacre, minage, collecte…), le parcours finit par ce retour. Chaque mission indique aussi quand et où elle a été prise, sa récompense par heure restante et sa distance depuis votre position. Les effets des missions terminées passent en bas, sur toute la largeur.',
        important: false,
        action: 'Relancez EDMC une fois : le plugin v2.15 se met à jour tout seul (nécessaire pour le retour au point de prise).'
    },
    {
        id: '2026-10-tableau-de-bord', date: '2026-10-10T15:46:22Z', type: 'NOUVEAU',
        titre: 'Le tableau de bord en jeu : votre second écran',
        texte: 'Nouvelle page TABLEAU DE BORD, à garder ouverte sur un second écran ou une tablette pendant que vous jouez : elle suit votre session en direct grâce au plugin. Onglet Commerce : votre soute, vos crédits gagnés depuis le lancement du jeu, le registre de vos achats et ventes, une feuille de route de plusieurs étapes calculée autour de vous (ou la meilleure route pour votre porte-vaisseaux), et un bloc « Vendre ce que je transporte » pour les marchandises dont vous ne savez que faire. Onglet Missions : vos missions en cours, l’ordre de passage le plus court, et l’effet des missions terminées sur la réputation et l’influence de chaque faction. Un clic sur un nom de système ou de station le copie. Visible de vous seul, avec ou sans escadron.',
        important: false,
        action: 'Relancez EDMC une fois : le plugin v2.14 se met à jour tout seul.'
    },
    {
        id: '2026-10-entete-allege', date: '2026-10-10T15:46:22Z', type: 'AMELIORE',
        titre: 'En-tête allégé',
        texte: 'Le statut du pilote (« Casier vierge » / « Recherché ») et la pastille de rang « Auxiliaires » ont été retirés de l’en-tête pour laisser de la place. Les rangs Powerplay, BGS et Fédération restent affichés.',
        important: false
    },
    {
        id: '2026-10-etats-faction', date: '2026-10-10T11:00:00Z', type: 'AMELIORE',
        titre: 'Directives : les états de la faction (Boom, Guerre civile, Famine…) s’affichent',
        texte: 'Sur les cartes de directives et dans leur détail (PC et mobile), des badges montrent maintenant les états de la faction ciblée : actifs en plein, en attente ou en récupération en pointillés, avec l’âge du relevé EDSM. Dans « Où vendre ? », la ligne « États de la faction » apparaît sous la destination, et une route dont la marchandise correspond à l’état (armes en guerre, nourriture en famine, médicaments en épidémie) porte l’étiquette « en phase avec l’état ». Information seulement : le classement des routes reste calculé sur les crédits gagnés.',
        important: false
    },
    {
        id: '2026-10-routes-releves-recents', date: '2026-10-10T02:28:00Z', type: 'AMELIORE',
        titre: 'Routes commerciales : seulement des relevés de moins de 7 jours, ou de moins de 24 h',
        texte: 'Dans « Où vendre ? » et « Route de contrebande », seuls les marchés relevés depuis moins de 7 jours sont désormais proposés, aussi bien pour les stations où acheter que pour les stations de la faction. Une nouvelle case « Relevés de moins de 24 h » (à la place de « moins de 90 jours ») resserre la limite à 24 heures. Les âges des relevés s’affichent en heures (« il y a 4 h ») et la jauge de fraîcheur suit la limite choisie. Corrige aussi les cas où agrandir le rayon faisait disparaître des routes : les porte-vaisseaux de joueurs, aux prix peu fiables, ne remplissent plus les résultats.',
        important: false
    },
    {
        id: '2026-10-routes-stock-rayon', date: '2026-10-10T02:14:00Z', type: 'AMELIORE',
        titre: 'Routes commerciales et de contrebande : rayon jusqu’à 200 al et stock minimal',
        texte: 'Dans les fenêtres « Où vendre ? » (hausse) et « Route de contrebande » (baisse), le rayon d’achat va maintenant jusqu’à 120 et 200 années-lumière, et un nouveau réglage « Stock mini à l’achat » (100, 500, 1 000 ou 2 000 t) ne garde que les stations qui ont assez de marchandise pour remplir votre soute. Changer le rayon ou le stock lance une nouvelle recherche (quelques secondes à une trentaine de secondes la première fois), partagée ensuite avec tout l’escadron pendant 2 heures.',
        important: false
    },
    {
        id: '2026-10-route-contrebande', date: '2026-10-10T01:40:00Z', type: 'NOUVEAU',
        titre: 'Directives de baisse : « Route de contrebande » vers le marché noir de la faction',
        texte: 'Dans le détail d’une directive de baisse, le nouveau bouton « 🏴 ROUTE DE CONTREBANDE » montre où faire baisser la faction en vendant de la contrebande : les stations de la faction qui ont un marché noir dans le système, et les stations proches où acheter de la marchandise généralement illégale (esclaves, narcotiques, armes…) au meilleur prix, avec le coût pour votre soute. Même fenêtre que « Où vendre ? » : réglages de soute, rayon, grande piste et fraîcheur, noms à copier. Attention : le prix de reprise du marché noir n’est relevé par personne, il se découvre en jeu, et la marchandise doit être illégale dans le système. Si la faction n’a aucun marché noir dans le système, la fenêtre le dit. Sur PC.',
        important: false
    },
    {
        id: '2026-10-routes-commerciales', date: '2026-10-10T01:15:00Z', type: 'NOUVEAU',
        titre: 'Directives de hausse : « Où vendre ? », la route commerciale la plus rentable',
        texte: 'Dans le détail d’une directive de hausse, le nouveau bouton « 💰 OÙ VENDRE ? » vous propose la meilleure route pour faire monter la faction : la station de la faction qui achète le plus cher dans le système, et la station proche où acheter la marchandise le moins cher, avec le gain par tonne et le bénéfice total pour votre soute. Réglez votre soute, le rayon d’achat (20, 40 ou 80 al), la grande piste et la fraîcheur des relevés ; cliquez sur un nom de système ou de station pour le copier. Les prix viennent de Spansh (relevés des joueurs) : une pastille indique l’âge de chaque relevé, vérifiez toujours le marché à l’arrivée. La première recherche d’une directive prend une trentaine de secondes, puis le résultat est partagé avec tout l’escadron pendant 2 heures. Sur PC. Astuce : plus vous vous amarrez dans les stations de l’escadron, plus les relevés sont frais.',
        important: false
    },
    {
        id: '2026-10-journal-rafales', date: '2026-10-09T22:05:00Z', type: 'AMELIORE',
        titre: 'Journal des exploits : meurtres, piratages et échecs regroupés par 5',
        texte: 'Quand vous enchaînez des meurtres, des piratages ou des échecs de mission (sous une directive de baisse), le journal n’affiche plus une ligne par action : il en crée une pour 5 (par exemple « 5 MEURTRES »), et une ligne en cours grossit jusqu’à 5. Les points ne changent pas : 1 point de rang BGS par meurtre, par piratage ou par échec sous une directive de baisse, la ligne regroupée en rapporte donc 5. Un enchaînement est regroupé tant que vous restez sur la même directive, la même faction et le même système, et qu’il n’y a pas plus de 30 minutes entre deux actions. Sur PC et sur mobile.',
        important: false
    },
    {
        id: '2026-10-bgs-suite-de-cartes', date: '2026-10-09T18:54:00Z', type: 'AMELIORE',
        titre: 'Page BGS : directives et initiatives à la suite, sans titres ni colonnes',
        texte: 'Les directives de l’Amiral et les initiatives des pilotes forment désormais une seule suite de cartes sur deux colonnes, sans trous : d’abord les directives de l’Amiral, puis les initiatives (reconnaissables à leur cadre rose et à l’étiquette « INITIATIVE »). Les titres « Focus de l’Amiral » et « Initiatives des pilotes » disparaissent, et quand aucune initiative n’est en cours, plus aucun bloc ne lui est consacré : le bouton « Lancer une initiative » en haut de la page suffit. Même chose sur mobile.',
        important: false
    },
    {
        id: '2026-10-initiatives-mode-amiral', date: '2026-10-09T16:54:00Z', type: 'NOUVEAU',
        titre: 'Initiatives : l’Amiral choisit comment elles fonctionnent dans son escadron',
        texte: 'Sur la page Escadron (et dans l’onglet BGS du mobile), l’Amiral règle désormais les initiatives des pilotes. Libre : comme avant, tout pilote lance une initiative, active tout de suite. Sur validation : les pilotes proposent, et rien n’est actif tant que l’Amiral ou un officier n’a pas accepté ; une proposition non traitée expire après 48 h. Désactivé : le bouton disparaît pour les pilotes (l’Amiral et les officiers peuvent toujours en lancer). Quand l’Amiral quitte le mode « sur validation », les propositions en attente sont supprimées. Si l’Amiral n’ouvre pas le site pendant 7 jours, l’escadron repasse automatiquement en mode Libre pour ne rien bloquer ; son réglage revient dès qu’il rouvre le site. Côté pilote, une proposition et son résultat (acceptée, refusée, expirée) s’affichent dans un petit bandeau discret sur la page BGS.',
        important: false
    },
    {
        id: '2026-10-qg-rangee-compacte', date: '2026-10-09T09:59:00Z', type: 'AMELIORE',
        titre: 'QG : la rangée « Ma puissance / Ma faction / Quoi faire » est plus compacte',
        texte: 'Les trois cartes du haut du QG prennent moins de place en hauteur : les quatre chiffres de la faction tiennent sur une ligne, la note sur l’écart avec le jeu tient sur une seule ligne, et la recommandation « Quoi faire » est plus serrée. Le bas de la page remonte d’autant.',
        important: false
    },
    {
        id: '2026-10-revelations-plein-ecran', date: '2026-10-09T09:45:00Z', type: 'NOUVEAU',
        titre: 'Les grands moments s’affichent en plein écran, sur toutes les pages',
        texte: 'Quand quelque chose de marquant arrive, une fenêtre plein écran vous le montre une seule fois, où que vous soyez sur le site (PC et mobile). Pour vous seul : un nouveau rang BGS, Powerplay, Fédération, Empire ou l’un des rangs de votre cercle de pilote (combat, commerce, exploration, exobiologie, mercenaire). Pour tous les pilotes de l’escadron : la distinction d’un nouveau spécialiste, le Pilier de la semaine et l’Élan Powerplay, avec une mise en scène animée. Une nouvelle anecdote apparaît, elle, sous la forme d’une petite carte discrète que vous pouvez lire ou ignorer. Si plusieurs événements arrivent d’un coup, ils s’enchaînent avec un compteur et un bouton « Tout passer ». Les médailles du Pilier et de l’Élan sur le QG ont aussi reçu la même animation.',
        important: false
    },
    {
        id: '2026-10-directives-en-veille', date: '2026-10-08T23:21:00Z', type: 'AMELIORE',
        titre: 'Directives en veille : la place aux missions vivantes',
        texte: 'Une directive de priorité normale pour laquelle aucun effort n’a été enregistré depuis 7 jours est maintenant repliée dans un encadré « Directives en veille » (type, faction, système et influence), sur la page BGS et sur le mobile. Elle n’est pas supprimée : l’Amiral continue de voir l’évolution d’influence, et un clic ouvre son détail. Dès qu’un effort est enregistré, elle revient parmi les directives. Les directives de priorité haute ou critique restent toujours affichées, et « Quoi faire » ne recommande plus une directive en veille.',
        important: false
    },
    {
        id: '2026-10-initiatives-pilotes', date: '2026-10-08T23:20:00Z', type: 'NOUVEAU',
        titre: 'Initiatives : lancez vos propres objectifs BGS',
        texte: 'Tout pilote de l’escadron peut maintenant lancer une initiative : un système, une faction et un objectif de hausse ou de baisse, avec un petit message pour motiver les camarades. Elle s’affiche dans une section à part de la page BGS (et de l’onglet BGS du mobile), avec votre nom, ceux des pilotes qui y participent et le temps restant. Elle fonctionne comme une directive : mêmes jauges, mêmes points, rien à changer côté plugin. Une initiative par pilote ; elle se clôture seule après 7 jours sans aucun effort (chaque effort relance le compteur). L’Amiral et les officiers peuvent la retirer ou la transformer en directive officielle, et chaque lancement ou transformation est annoncé dans le journal de l’escadron. Les directives de guerre et d’élection restent réservées au commandement.',
        important: false
    },
    {
        id: '2026-10-journal-bgs-filtres-une-ligne', date: '2026-10-08T21:28:00Z', type: 'AMELIORE',
        titre: 'Journal des exploits : les filtres tiennent sur une seule ligne',
        texte: 'Dans le journal des exploits du BGS, les filtres (pilote, période, directive, spécialité, recherche) sont maintenant alignés sur une seule ligne au lieu de passer sur deux : plus de place pour la liste des actions.',
        important: false
    },
    {
        id: '2026-10-journal-bgs-filtres', date: '2026-10-08T21:03:55Z', type: 'AMELIORE',
        titre: 'Journal des exploits : de nouveaux filtres pour retrouver une action',
        texte: 'Le journal des exploits du BGS se filtre maintenant par pilote (chaque pilote de l’escadron), par directive (en cours, clôturées, ou une directive précise), par spécialité (Fer de Lance, Maître Logisticien, Magnat, Bâtisseur, Expert scientifique, Exécuteur, Seigneur de guerre, missions échouées) et par texte (système, faction, pilote). Un bandeau vous prévient quand il reste des actions à charger, et les stations et paliers de colonisation ne s’affichent plus avant les actions plus récentes qui n’ont pas encore été chargées.',
        important: false
    },
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
