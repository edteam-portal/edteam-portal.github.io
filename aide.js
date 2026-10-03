// Aide / FAQ de SYS.EDTEAM : fenetre autonome (aucune dependance), chargee a la demande par footer.js.
// Pour ajouter une question : ajouter une ligne { q: '...', r: '...' } dans la bonne section de CONTENU (r accepte du HTML simple).
(function () {
    'use strict';
    if (window.edteamAide) return;

    var CONTENU = [
        { id: 'demarrer', titre: 'DÉMARRER', questions: [
            { q: 'Comment démarrer avec SYS.EDTEAM ?',
              r: 'Quatre étapes, environ deux minutes :<br>1. Créez votre compte sur le site.<br>2. Installez <strong>EDMC</strong> (Elite Dangerous Market Connector) sur votre PC.<br>3. Téléchargez le plugin <strong>SYS.EDTEAM</strong> depuis le site et placez-le dans le dossier des plugins d\'EDMC.<br>4. Copiez votre <strong>clé</strong> dans les réglages du plugin (voir la question suivante), puis lancez le jeu.' },
            { q: 'Où trouver ma clé, et où la coller ?',
              r: 'Dans le menu latéral, en bas, ouvrez <strong>Gestion du compte</strong> : la clé de liaison EDMC est affichée en haut de la fenêtre. Cliquez dessus pour la copier.<br>Dans EDMC, ouvrez les <strong>Paramètres</strong>, onglet <strong>SYS.EDTEAM</strong>, et collez-la dans le champ « Clé d\'Accès ».' },
            { q: 'Je n\'ai pas d\'escadron : que puis-je utiliser ?',
              r: 'Le QG, le Powerplay, les communications, le journal tactique, le Budget et la Colonisation (dans un espace personnel que vous seul voyez). Le suivi BGS, la diplomatie et la page Escadron sont réservés aux membres d\'un escadron.' },
            { q: 'Comment couper le son du site ?',
              r: 'Cliquez sur l\'icône <strong>haut-parleur</strong> en haut à droite de l\'écran, ou celle du pied de page. Elle coupe <strong>tous</strong> les sons (survol, clics, alertes de messages, assistant COVAS, musique d\'ambiance). Elle devient rouge quand le son est coupé, et votre choix est mémorisé sur cet appareil.' },
            { q: 'Rien ne se met à jour sur le site, pourquoi ?',
              r: 'Vérifiez dans l\'ordre :<br>• <strong>EDMC est lancé</strong> pendant que vous jouez (le plugin ne tourne que dans EDMC) ;<br>• la clé collée dans le plugin est la bonne ;<br>• EDMC affiche « SYS_EDTEAM » avec un numéro de version : si une mise à jour est annoncée, <strong>redémarrez EDMC</strong>.<br>Certaines informations n\'arrivent qu\'au lancement du jeu : relancez le jeu avec EDMC allumé.' }
        ] },
        { id: 'bgs', titre: 'LE BGS ET LES RANGS', questions: [
            { q: 'Comment fonctionne le BGS dans l\'application ?',
              r: 'Les officiers et l\'Amiral publient des <strong>directives</strong> (système visé, faction, type d\'ordre, priorité). Vos actions en jeu (missions, commerce, sécurité, science, colonisation, zones de combat) sont envoyées par le plugin et comptées automatiquement. Vous les suivez dans la page BGS et dans le journal tactique.' },
            { q: 'Comment gagne-t-on des points et un rang BGS ?',
              r: 'Chaque effort, qu\'il réponde à une directive ou non, rapporte des <strong>points</strong> : 1 point pour 2 millions de crédits (économie, sécurité, science), 1 point pour 400 tonnes de colonisation, et des points selon l\'importance de l\'action pour les missions et les zones de combat. Les échecs ne rapportent rien.<br>Vos points s\'additionnent pour toute votre carrière et donnent un <strong>rang BGS de 1 à 100</strong>. Un rang gagné ne se perd jamais. La fenêtre « BGS » du QG montre votre progression.' },
            { q: 'Quelle différence entre rang BGS, rang Powerplay et rôle dans l\'escadron ?',
              r: '• Le <strong>rang BGS</strong> (orange) récompense vos efforts pour l\'escadron.<br>• Le <strong>rang Powerplay</strong> (bleu) vient de votre puissance, en jeu.<br>• Le <strong>rôle</strong> (Amiral, Officier, Diplomate, Pilote) définit ce que vous pouvez administrer.' },
            { q: 'À quoi servent les plaques de mon dossier ?',
              r: 'Quand l\'Amirauté clôture une opération BGS, chaque pilote qui y a participé reçoit une <strong>plaque de campagne</strong>, conservée sur sa fiche. Aucun seuil : une seule soirée d\'effort suffit. La couleur indique le type d\'opération, les barrettes les jours de présence, les étoiles l\'effort fourni, et un cadre distingue le podium de l\'escadron. Survolez le « ? » de la fiche pour la légende.' },
            { q: 'Qu\'est-ce que le Pilier de la semaine ?',
              r: 'Chaque jeudi, à la fin du cycle, le pilote qui a le plus investi dans l\'effort de l\'escadron (directives et actions libres confondues) reçoit la distinction <strong>Pilier de la semaine</strong>, visible sur sa fiche et dans le journal tactique. Il n\'y a aucun seuil minimum.' },
            { q: 'Qu\'est-ce que l\'Élan Powerplay ?',
              r: 'Chaque jeudi, en plus du Pilier de la semaine (qui récompense l\'effort BGS), la distinction <strong>Élan Powerplay</strong> revient au pilote dont les mérites Powerplay ont le plus <strong>progressé en proportion</strong> de ses mérites de départ. Les mérites s\'affichent en millions pour certains pilotes : en regardant le progrès relatif, chacun a sa chance, quel que soit son niveau. Pour qu\'un débutant ne gagne pas grâce à un tout petit gain, le calcul suppose que chacun avait au moins 100 000 mérites au départ (par exemple, +5 000 mérites partis de presque rien comptent comme +5 %, et non +500 %).' }
        ] },
        { id: 'powerplay', titre: 'POWERPLAY', questions: [
            { q: 'Que montre la salle Powerplay ?',
              r: 'Votre puissance, votre rang, vos <strong>mérites du cycle</strong> et votre cumul, l\'historique de vos cycles (« Ma progression ») et le tableau des partisans de votre puissance. Vous ne voyez que les pilotes de la même puissance que vous.' },
            { q: 'Pourquoi mes mérites du cycle affichent « — » ?',
              r: 'Le jeu n\'envoie que votre total de mérites. Le site en déduit ceux du cycle en comparant avec le total du cycle précédent : tant qu\'il n\'a pas de point de comparaison, il affiche « — ». Les mérites du cycle apparaissent dès votre premier relevé après le début d\'un nouveau cycle.' },
            { q: 'Pourquoi mes mérites ne sont-ils pas à jour ?',
              r: 'Le site ne connaît vos mérites que lorsqu\'EDMC est allumé. Si vous avez joué sans EDMC, ils seront mis à jour au prochain lancement du jeu avec EDMC. Le « Dernier relevé » indique l\'ancienneté du chiffre affiché.' },
            { q: 'Quand change le cycle ?',
              r: 'Chaque <strong>jeudi à 07:00 UTC</strong> (09:00 en heure d\'été en France, 08:00 en hiver). C\'est aussi le moment où les communications sont purgées et où le bilan et le Pilier de la semaine sont publiés.' }
        ] },
        { id: 'colonisation', titre: 'COLONISATION', questions: [
            { q: 'Où voir mes chantiers de colonisation, ou ceux de l\'escadron ?',
              r: 'Dans le menu latéral, cliquez sur <strong>Colonisation</strong>. Dans un escadron, la carte est commune : elle montre les systèmes colonisés par tous les pilotes de l\'escadron. Sans escadron, vous avez votre <strong>espace personnel</strong>, que vous seul voyez Si vous rejoignez un escadron, vous voyez celui de l\'escadron, et un bouton <strong>Verser à l\'escadron</strong> vous permet, si vous le souhaitez, de lui apporter ce que vous aviez relevé seul (rien n\'est partagé sans votre accord). Un clic sur un système affiche ses constructions terminées et ses chantiers en cours, avec la progression de chaque marchandise et qui a livré quoi.' },
            { q: 'Mes livraisons de colonisation comptent-elles pour mon rang ?',
              r: 'Oui, depuis le 1<sup>er</sup> octobre 2026 : chaque livraison relevée par le plugin rapporte <strong>1 point de carrière BGS pour 400 tonnes</strong>, comme les autres efforts, et compte aussi pour le Pilier de la semaine. Les livraisons faites avant cette date ne rapportent rien. Quand une construction de votre escadron se termine, une ligne verte <strong>STATION TERMINÉE</strong> s\'ajoute au journal tactique.' },
            { q: 'D\'où viennent ces informations ? Dois-je faire quelque chose ?',
              r: 'Rien à saisir : le plugin <strong>SYS.EDTEAM</strong> (version 2.5 ou plus) relève dans vos journaux de jeu les chantiers que vous consultez, vos livraisons et les systèmes que vous revendiquez. Quand vous vous amarrez à une station terminée de la faction de l\'escadron, située dans un système déjà reconnu comme colonisé, elle est ajoutée aux constructions terminées (les systèmes de BGS classiques ne sont jamais retenus). Il n\'envoie que ce qui change, au plus toutes les quelques minutes. Après la mise à jour, <strong>redémarrez EDMC</strong> une fois.' },
            { q: 'Pourquoi « architecte inconnu », un système absent, ou des tonnes « non attribuées » ?',
              r: 'L\'architecte d\'un système est le pilote qui l\'a revendiqué : il apparaît quand son plugin a relevé cette revendication, et sa fiche affiche alors ses systèmes, ses stations terminées et ses chantiers en cours. Le jeu n\'a pas toujours écrit cet événement (certains systèmes revendiqués au début de la colonisation n\'en ont pas) : l\'architecte reste alors inconnu, il n\'est jamais déduit des livraisons. Un système où le plugin n\'a vu ni revendication ni chantier n\'est pas listé. Les livraisons ne sont attribuées qu\'aux pilotes dont le plugin est à jour ; le reste est indiqué comme non attribué. Le jeu ne donne l\'état d\'un chantier que lorsqu\'un pilote le consulte ou y livre : un chantier que personne n\'a encore consulté avec le plugin n\'est pas visible, et la date du dernier relevé est affichée. Il ne fournit pas non plus le nombre d\'emplacements encore libres.<br><br><strong>Pour qu\'une construction apparaisse :</strong> un chantier est relevé quand un pilote s\'y amarre ou y livre ; une installation terminée, quand un pilote de l\'escadron s\'y amarre (dans un système déjà reconnu comme colonisé, et seulement s\'il fait partie d\'un escadron). <strong>Faction inconnue ?</strong> Elle est relevée quand un pilote de l\'escadron arrive dans le système avec le plugin à jour, puis consulte ou alimente une construction. <strong>Architecte inconnu ?</strong> S\'amarrer ne le change pas : seule la revendication du système l\'enregistre.' }
        ] },
        { id: 'budget', titre: 'BUDGET', questions: [
            { q: 'Où voir mon budget, et qui peut le voir ?',
              r: 'Dans le menu latéral, cliquez sur <strong>Budget</strong>. Il est <strong>strictement personnel</strong> : seul vous le voyez sur le site, ni votre escadron, ni l\'Amiral, ni le Directeur. Rien à saisir : le plugin <strong>SYS.EDTEAM</strong> (version 2.5 ou plus) relève tout seul vos gains et vos dépenses dans vos journaux de jeu. Après la mise à jour, <strong>redémarrez EDMC</strong> une fois.' },
            { q: 'Comment lire la page ?',
              r: 'Les <strong>revenus</strong> sont l\'argent que vous avez gagné (ventes, missions, primes, exploration…), les <strong>charges</strong> sont l\'argent que vous avez dépensé. Elles se séparent en <strong>dépenses courantes</strong> (achats de marchandises, carburant, réparations, munitions…) et <strong>équipement</strong> (modules et vaisseaux). Le <strong>résultat avant équipement</strong> montre ce que rapportent vos activités ; le <strong>résultat net</strong> est ce qu\'il vous reste une fois l\'équipement payé : revenus moins toutes les charges. Les deux anneaux montrent d\'où vient l\'argent et où il part ; un clic sur une part ouvre le <strong>livre de compte</strong>, la liste de chaque mouvement, que vous pouvez filtrer, rechercher et exporter en CSV. Les onglets choisissent la période : un cycle va d\'un jeudi 07:00 UTC au jeudi suivant.' },
            { q: 'Pourquoi mon résultat net n\'est pas égal à la variation de mon solde ?',
              r: 'Le résultat net ne compte que ce que vous avez gagné et dépensé. Votre solde, lui, bouge aussi à cause de mouvements qui ne sont ni un gain ni une dépense : l\'achat de votre porte-flotte et les virements vers elle, ou des mouvements que le jeu n\'écrit pas dans le journal. Le bloc <strong>« Rapprochement avec le solde du jeu »</strong>, sous le tableau, fait le lien étape par étape : solde de début, plus le résultat net, plus ces mouvements, égale solde de fin.' },
            { q: 'Que veut dire « écart non catégorisé » ?',
              r: 'C\'est la différence entre votre solde réel dans le jeu et ce que le plugin a pu compter : un mouvement que le jeu n\'écrit pas dans le journal (par exemple un dépôt à la banque d\'escadron) ou que le plugin ne sait pas encore classer. Il est affiché tel quel, jamais caché dans une catégorie.' },
            { q: 'Le budget compte-t-il ma porte-flotte ?',
              r: 'Non. Les frais de la porte-flotte (comme l\'entretien hebdomadaire) sont payés par le solde de la porte-flotte, pas par votre compte : ils ne figurent donc pas dans votre budget. Seuls les virements entre votre compte et votre porte-flotte apparaissent, hors budget, dans le rapprochement.' },
            { q: 'Jusqu\'où remonte le détail ?',
              r: 'Le livre de compte garde le détail des <strong>8 derniers cycles</strong>. Les totaux de chaque cycle sont conservés plus longtemps, ce qui permet de comparer avec les cycles précédents.' }
        ] },
        { id: 'communications', titre: 'COMMUNICATIONS ET MOBILE', questions: [
            { q: 'Comment fonctionnent les communications ?',
              r: 'Trois canaux : le réseau entier, votre escadron, ou un message privé à un pilote. Un message <strong>urgent</strong> s\'affiche en plein écran, un message privé en fenêtre, et l\'icône de discussion, en haut à droite à côté du son, clignote. Pour prévenir toute interception, tout le registre est <strong>purgé chaque semaine, le jeudi</strong>.' },
            { q: 'Puis-je utiliser SYS.EDTEAM sur mon téléphone ?',
              r: 'Oui, avec le <strong>compagnon mobile</strong> : accueil (rang BGS, Powerplay, finances, Pilier, Élan, chiffres de l\'escadron), directives et effort BGS, colonisation, escadron et communications. Cliquez sur « Compagnon mobile » en bas de page pour obtenir le QR code, ou ouvrez <em>edteam-portal.github.io/mobile.html</em> sur votre téléphone et connectez-vous avec le même compte. Vous pouvez l\'ajouter à l\'écran d\'accueil.' }
        ] },
        { id: 'donnees', titre: 'MES DONNÉES', questions: [
            { q: 'Qui voit quoi ?',
              r: 'Vos données de jeu (position, soldes, flotte) ne sont lisibles que par vous. Les membres de votre escadron voient votre fiche (rangs, plaques, distinctions, rang BGS et Powerplay). Dans le tableau Powerplay, les pilotes de la même puissance voient votre nom, votre rang et vos mérites. Sur la page Colonisation, les membres de votre escadron voient les chantiers de l\'escadron, avec le nom et le tonnage des pilotes qui y ont livré ; les autres escadrons n\'en voient rien. Votre budget n\'est visible que par vous. Le Directeur peut consulter les fiches pour administrer l\'application.' },
            { q: 'Comment changer mon e-mail, mon mot de passe ou supprimer mon compte ?',
              r: 'Dans le menu latéral, en bas, ouvrez « Gestion du compte » (vous y trouvez aussi votre clé EDMC). La suppression du compte efface vos données.' },
            { q: 'Ma question n\'est pas ici.',
              r: 'Demandez sur le <strong>Discord</strong> (bouton violet en bas de page) : les questions posées enrichissent cette aide.' }
        ] }
    ];

    var CSS = ''
        + '#ft-aide-overlay{position:fixed;inset:0;background:rgba(0,0,0,.86);backdrop-filter:blur(4px);display:none;justify-content:center;align-items:center;z-index:6100;padding:15px;box-sizing:border-box}'
        + '#ft-aide{position:relative;width:100%;max-width:780px;max-height:90vh;display:flex;flex-direction:column;background:rgba(5,8,12,.98);border:1px solid var(--ed-blue,#00F0FF);box-shadow:0 0 40px rgba(0,240,255,.2);border-radius:4px;font-family:"Share Tech Mono",monospace;color:#ccc;box-sizing:border-box}'
        + '#ft-aide .ah-tete{padding:18px 24px 12px;border-bottom:1px solid rgba(0,240,255,.3);background:rgba(0,240,255,.05)}'
        + '#ft-aide .ah-titre{color:var(--ed-blue,#00F0FF);font-weight:bold;letter-spacing:3px;font-size:1.15rem;margin-bottom:10px}'
        + '#ft-aide input{width:100%;box-sizing:border-box;background:rgba(0,0,0,.6);border:1px solid rgba(0,240,255,.4);color:#fff;padding:8px 12px;font-family:inherit;font-size:.9rem;outline:none;border-radius:3px}'
        + '#ft-aide input:focus{border-color:var(--ed-blue,#00F0FF)}'
        + '#ft-aide .ah-corps{padding:14px 24px 20px;overflow-y:auto;flex-grow:1}'
        + '#ft-aide .ah-section{color:var(--ed-orange,#FF7100);font-weight:bold;letter-spacing:2px;font-size:.85rem;margin:16px 0 8px;padding-bottom:5px;border-bottom:1px dashed rgba(255,113,0,.35)}'
        + '#ft-aide details{border:1px solid #2a2a2a;background:rgba(0,0,0,.4);border-radius:3px;margin-bottom:6px}'
        + '#ft-aide details[open]{border-color:rgba(0,240,255,.4);background:rgba(0,240,255,.03)}'
        + '#ft-aide summary{cursor:pointer;padding:10px 14px;color:#fff;font-size:.9rem;list-style:none;display:flex;gap:10px;align-items:baseline}'
        + '#ft-aide summary::-webkit-details-marker{display:none}'
        + '#ft-aide summary::before{content:"+";color:var(--ed-blue,#00F0FF);font-weight:bold;width:12px;flex-shrink:0}'
        + '#ft-aide details[open] summary::before{content:"−"}'
        + '#ft-aide summary:hover{color:var(--ed-blue,#00F0FF)}'
        + '#ft-aide .ah-rep{padding:0 14px 12px 36px;font-size:.85rem;line-height:1.65;color:#bbb}'
        + '#ft-aide .ah-rep strong{color:#fff}'
        + '#ft-aide .ah-vide{color:#888;text-align:center;font-style:italic;padding:30px 0;display:none}'
        + '#ft-aide .ah-x{position:absolute;top:14px;right:18px;color:var(--ed-blue,#00F0FF);cursor:pointer;font-weight:bold;font-size:1.2rem}'
        + '#ft-aide .ah-x:hover{color:#fff}';

    function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    // Recherche insensible aux accents et a la casse : "merites" trouve "mérites"
    function norm(t) { return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
    function texteBrut(html) { return html.replace(/<[^>]+>/g, ' '); }

    function construire() {
        var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
        var corps = '';
        CONTENU.forEach(function (s) {
            corps += '<div class="ah-groupe" data-section="' + s.id + '"><div class="ah-section">' + esc(s.titre) + '</div>';
            s.questions.forEach(function (x) {
                corps += '<details data-txt="' + esc(norm(x.q + ' ' + texteBrut(x.r))) + '"><summary>' + esc(x.q) + '</summary><div class="ah-rep">' + x.r + '</div></details>';
            });
            corps += '</div>';
        });
        var ov = document.createElement('div');
        ov.id = 'ft-aide-overlay'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Aide et questions fréquentes');
        ov.innerHTML = '<div id="ft-aide">'
            + '<div class="ah-x" title="Fermer">X</div>'
            + '<div class="ah-tete"><div class="ah-titre">AIDE // QUESTIONS FRÉQUENTES</div>'
            + '<input type="search" id="ft-aide-recherche" placeholder="Rechercher une question…" autocomplete="off"></div>'
            + '<div class="ah-corps">' + corps + '<div class="ah-vide">Aucune question ne correspond. Essayez un autre mot, ou demandez sur le Discord.</div></div>'
            + '</div>';
        document.body.appendChild(ov);

        ov.addEventListener('click', function (e) { if (e.target === ov) fermer(); });
        ov.querySelector('.ah-x').addEventListener('click', fermer);
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fermer(); });
        ov.querySelector('#ft-aide-recherche').addEventListener('input', function () {
            var mot = norm(this.value.trim()), visibles = 0;
            ov.querySelectorAll('details').forEach(function (d) {
                var ok = !mot || d.getAttribute('data-txt').indexOf(mot) !== -1;
                d.style.display = ok ? '' : 'none';
                if (mot && ok) d.open = true; else if (!mot) d.open = false;
                if (ok) visibles++;
            });
            ov.querySelectorAll('.ah-groupe').forEach(function (g) {
                g.style.display = g.querySelectorAll('details:not([style*="none"])').length ? '' : 'none';
            });
            ov.querySelector('.ah-vide').style.display = visibles ? 'none' : 'block';
        });
        return ov;
    }

    function fermer() {
        var ov = document.getElementById('ft-aide-overlay');
        if (ov) ov.style.display = 'none';
    }

    // section : id d'une section (ex. 'powerplay') ou d'une question deja ouverte ; sans argument : tout replie
    function ouvrir(section) {
        var ov = document.getElementById('ft-aide-overlay') || construire();
        var champ = ov.querySelector('#ft-aide-recherche');
        champ.value = ''; champ.dispatchEvent(new Event('input'));
        ov.style.display = 'flex';
        if (section) {
            var g = ov.querySelector('.ah-groupe[data-section="' + section + '"]');
            if (g) { var d = g.querySelector('details'); if (d) d.open = true; g.scrollIntoView({ block: 'start' }); }
        } else { champ.focus(); }
    }

    window.edteamAide = { ouvrir: ouvrir, fermer: fermer, contenu: CONTENU };
})();
