// Journal des nouveautes de SYS.EDTEAM : UNE entree par changement visible pour les pilotes, en langage simple ("ce qui change pour vous").
// Affichage : bouton "Nouveautes" du pied de page (groupe par cycle : du jeudi 07:00 UTC au jeudi suivant).
// Discord : un resume par semaine (tache GitHub, jeudi 08:00 UTC), voir .github/workflows/nouveautes-discord.yml.
// Champs : id (unique), date (ISO UTC), type (NOUVEAU | AMELIORE | CORRIGE), titre, texte,
//          important (true = petite carte discrete a l'ouverture du QG), action (texte "action requise", facultatif),
//          aide (id de section de l'Aide : demarrer | bgs | powerplay | communications | donnees, facultatif).
window.EDTEAM_NOUVEAUTES = [
    {
        id: '2026-09-30-rang-bgs', date: '2026-09-30T13:30:00Z', type: 'NOUVEAU',
        titre: 'Rang BGS de carrière (1 à 100)',
        texte: 'Chaque effort accompli pour l\'escadron rapporte des points qui s\'additionnent pour toute votre carrière et déterminent votre rang BGS, de 1 à 100. Un rang gagné ne se perd jamais. Un nouveau bouton BGS, à côté de Powerplay sur le QG, ouvre votre progression, vos points par semaine et le classement de l\'escadron.',
        important: false, aide: 'bgs'
    },
    {
        id: '2026-09-30-powerplay', date: '2026-09-30T10:55:00Z', type: 'AMELIORE',
        titre: 'Powerplay : mérites du cycle et historique',
        texte: 'Le site distingue désormais vos mérites du cycle de votre cumul, garde l\'historique de vos cycles (« Ma progression ») et indique l\'heure du dernier relevé. Le tableau des partisans affiche le cycle et le cumul. Tant qu\'un cycle n\'est pas mesuré, vous verrez « — » : c\'est normal.',
        important: false, aide: 'powerplay'
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
        important: false, aide: 'donnees'
    },
    {
        id: '2026-09-30-aide', date: '2026-09-30T19:10:00Z', type: 'NOUVEAU',
        titre: 'Aide, Discord et compagnon mobile en bas de page',
        texte: 'Un pied de page présent sur toutes les pages regroupe le Discord, l\'Aide / FAQ (avec recherche) et le compagnon mobile (QR code pour l\'ouvrir sur votre téléphone). Le menu latéral accueille désormais la clé EDMC, la gestion du compte et la déconnexion, qui ont quitté l\'en-tête.',
        important: false, aide: 'demarrer'
    },
    {
        id: '2026-09-30-son', date: '2026-09-30T20:30:00Z', type: 'NOUVEAU',
        titre: 'Interrupteur de son',
        texte: 'Un bouton haut-parleur, en haut à droite et en bas de page, coupe tous les sons du site. Votre choix est mémorisé.',
        important: false, aide: 'demarrer'
    },
    {
        id: '2026-09-30-alertes', date: '2026-09-30T00:35:00Z', type: 'AMELIORE',
        titre: 'Alertes de messages sur toutes les pages',
        texte: 'Un message urgent s\'affiche en plein écran, un message privé en fenêtre, et l\'enveloppe du menu clignote, où que vous soyez sur le site. Le compagnon mobile lit aussi les transmissions officielles.',
        important: false, aide: 'communications'
    },
    {
        id: '2026-09-30-journal', date: '2026-09-30T00:50:00Z', type: 'AMELIORE',
        titre: 'Journal tactique plus précis',
        texte: 'Les lignes de directives précisent le système, la faction, le type d\'ordre et la priorité. Les annonces manuelles n\'existent plus dans le journal : pour écrire à vos ailiers, utilisez la page Communications.',
        important: false, aide: 'communications'
    },
    {
        id: '2026-09-29-distinctions', date: '2026-09-29T20:00:00Z', type: 'NOUVEAU',
        titre: 'Pilier de la semaine, plaques et Force de frappe',
        texte: 'Chaque jeudi, le pilote qui a le plus investi dans l\'effort de l\'escadron devient le Pilier de la semaine (première désignation jeudi 1er octobre). Les plaques de campagne récompensent le podium de chaque opération sans aucun seuil, et la Force de frappe montre la part de chacun dans l\'effort de l\'escadron.',
        important: false, aide: 'bgs'
    }
];
