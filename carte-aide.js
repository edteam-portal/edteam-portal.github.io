// AIDE DE LA CARTE GALACTIQUE : une fenetre plein ecran a plusieurs pages (un « mini site ») qui explique la legende, les couleurs, le territoire, les alarmes et leurs mecaniques de jeu.
// Tous les visuels sont dessines en HTML / SVG (aucune capture, aucune donnee reelle ; noms et chiffres d'exemple). Ouverte par le bouton AIDE de la carte : window.EdteamCarteAide.ouvrir(page).
(function () {
    'use strict';
    if (window.EdteamCarteAide) return;
    var COUL = { up: '#2fe07a', dn: '#ff4d4d', fl: '#4DA3FF', or: '#FFD700', pw: '#8A7CFF', r1: '#ff2d2d', r2: '#ff9a1f', r3: '#ff4fd8', cy: '#00F0FF' };

    // ---------- petits visuels ----------
    function pastille(c, t, cls) { return '<span class="ca-chip ' + (cls || '') + '" style="--c:' + c + '"><i></i>' + t + '</span>'; }
    function noeud(c, txt, opt) {
        opt = opt || {};
        return '<svg class="ca-noeud" viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="' + (opt.r || 17) + '" fill="none" stroke="' + (opt.anneau || '#00F0FF') + '" stroke-width="2.4"' + (opt.tirets ? ' stroke-dasharray="5 3"' : '') + '/><circle cx="30" cy="30" r="' + ((opt.r || 17) - 6) + '" fill="' + c_(c) + '" stroke="' + (opt.contour || '#000') + '"/>'
            + (txt ? '<text x="30" y="35" text-anchor="middle" font-size="13" font-weight="bold" fill="' + (opt.txt || '#04070a') + '">' + txt + '</text>' : '') + (opt.pw ? '<path d="M44 8 l6 7 l-6 7 l-6 -7z" fill="#8A7CFF" stroke="#000"/>' : '') + (opt.col ? '<rect x="42" y="6" width="11" height="11" fill="#FFD700" stroke="#000"/>' : '') + '</svg>';
    }
    function c_(c) { return c; }
    function carte(cartes) { return '<div class="ca-cartes">' + cartes.join('') + '</div>'; }
    function fiche(t, c, html) { return '<div class="ca-fiche" style="--c:' + c + '"><b>' + t + '</b><div>' + html + '</div></div>'; }
    function note(type, html) { var ti = { retenir: 'À RETENIR', attention: 'ATTENTION', exemple: 'EXEMPLE', limite: 'LIMITE' }[type]; return '<div class="ca-note ' + type + '"><b>' + ti + '</b><div>' + html + '</div></div>'; }
    function barreOutils(marques) {
        var b = function (n, t, on) { return '<span class="ca-b' + (on ? ' on' : '') + '">' + t + (marques ? '<em>' + n + '</em>' : '') + '</span>'; };
        return '<div class="ca-ecran"><div class="ca-outils">' + b(1, 'DESSUS', 1) + b(1, 'CÔTÉ') + b(2, 'Couleur : résultat ▾') + b(3, 'Afficher ▾') + b(4, '⚠ À RENFORCER') + b(5, '⚠ Alarmes ▾') + b(6, '⤢ Aller à… ▾') + '</div></div>';
    }
    // une petite carte d'exemple (SVG) : options pour les alarmes, le decor, les bulles
    function carteExemple(o) {
        o = o || {}; var W = 640, H = 250, s = 11, a = function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }, g = '';
        for (var x = 40; x < W; x += 80) g += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="' + H + '" stroke="#0f2330"/>';
        for (var y = 30; y < H; y += 60) g += '<line x1="0" y1="' + y + '" x2="' + W + '" y2="' + y + '" stroke="#0f2330"/>';
        if (o.decor) { for (var i = 0; i < 46; i++) g += '<circle cx="' + (14 + a() * 610).toFixed(0) + '" cy="' + (10 + a() * 228).toFixed(0) + '" r="2.1" fill="#7fb8d0" opacity=".25"/>';
            [[90, 60], [180, 190], [470, 205], [560, 70]].forEach(function (p) { g += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.6" fill="#FFD700" opacity=".75"/>'; });
            [[150, 90], [420, 55], [520, 160]].forEach(function (p) { g += '<path d="M' + p[0] + ' ' + (p[1] - 8) + ' l7 8 l-7 8 l-7 -8z" fill="none" stroke="#8A7CFF" stroke-width="1.4" opacity=".85"/>'; }); }
        g += '<g opacity=".16" fill="#00F0FF"><circle cx="250" cy="120" r="44"/><circle cx="305" cy="150" r="38"/></g><g opacity=".5" fill="none" stroke="#00F0FF" stroke-dasharray="3 4"><circle cx="250" cy="120" r="44"/><circle cx="305" cy="150" r="38"/></g><line x1="250" y1="120" x2="305" y2="150" stroke="#00F0FF" stroke-opacity=".45"/>';
        [[250, 120, '#ff4d4d', 'KORVEN'], [305, 150, '#2fe07a', 'AZURE PRIME']].forEach(function (p) { g += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="14" fill="none" stroke="#00F0FF" stroke-width="2"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="9" fill="' + p[2] + '" stroke="#000"/><text x="' + (p[0] + 19) + '" y="' + (p[1] + 4) + '" fill="#e6eef2" font-size="11" letter-spacing="1">' + p[3] + '</text>'; });
        if (o.r1) [[400, 60], [470, 120], [150, 180]].forEach(function (p) { g += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.4" fill="#ff2d2d" opacity=".6"/>'; });
        if (o.r1c) g += '<g class="ca-al" style="--d:.5s"><circle class="rg" cx="440" cy="190" r="6" fill="none" stroke="#ff2d2d" stroke-width="1.6"/><circle class="pt" cx="440" cy="190" r="5.5" fill="#ff2d2d" stroke="#fff" stroke-width=".8"/></g><text x="452" y="194" fill="#ff8a8a" font-size="9.5">NOUVEAU</text>';
        if (o.r2) { g += '<g class="ca-al" style="--d:.7s"><circle class="rg" cx="395" cy="95" r="6" fill="none" stroke="#ff9a1f" stroke-width="1.6"/><circle class="pt" cx="395" cy="95" r="4.4" fill="#ff9a1f" stroke="#fff" stroke-width=".8"/></g><text x="407" y="99" fill="#ff9a1f" font-size="9.5">46 %</text><circle cx="500" cy="95" r="3.4" fill="#ff9a1f" opacity=".55"/><text x="508" y="99" fill="#ff9a1f" font-size="9.5" opacity=".7">14 %</text>'; }
        if (o.r3) { g += '<line x1="520" y1="215" x2="570" y2="150" stroke="#ff4fd8" stroke-width="1.4" stroke-dasharray="4 4" opacity=".75"/><path d="M520 209 l5 9 h-10 z" fill="#ff4fd8"/><g class="ca-al" style="--d:1.1s"><circle cx="570" cy="150" r="14" fill="none" stroke="#ff4fd8" stroke-width="2" stroke-dasharray="6 3"/><circle class="rg" cx="570" cy="150" r="14" fill="none" stroke="#ff4fd8" stroke-width="1.6"/></g><circle cx="600" cy="60" r="12" fill="none" stroke="#ff4fd8" stroke-width="2" stroke-dasharray="6 3" opacity=".45"/>'; }
        if (o.bulle) g += '<circle cx="540" cy="70" r="22" fill="none" stroke="#cfd8dc" stroke-width="2" stroke-dasharray="5 3"/><circle cx="540" cy="70" r="17" fill="#ff4d4d" stroke="#000"/><text x="540" y="75" text-anchor="middle" font-size="14" font-weight="bold" fill="#04070a">12</text><text x="510" y="106" fill="#e6eef2" font-size="11">12 systèmes · 5 campagnes</text>';
        g += '<line x1="22" y1="' + (H - 14) + '" x2="102" y2="' + (H - 14) + '" stroke="#7fb8d0" stroke-width="2"/><text x="22" y="' + (H - 20) + '" fill="#7fb8d0" font-size="10">20 al</text><text x="' + (W - 12) + '" y="18" text-anchor="end" fill="#3d7490" font-size="10" letter-spacing="2">▲ VERS LE CENTRE GALACTIQUE</text>';
        return '<div class="ca-ecran"><svg class="ca-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Exemple de carte">' + g + '</svg></div>';
    }
    // schema du Powerplay : un systeme inoccupe, une puissance qui progresse, une ancre en portee
    function schemaPP() {
        return '<div class="ca-ecran"><svg class="ca-svg" viewBox="0 0 640 230" role="img" aria-label="Schema de la conquete Powerplay">'
            + '<circle cx="190" cy="115" r="92" fill="#ff9a1f" opacity=".06" stroke="#ff9a1f" stroke-dasharray="4 4"/><text x="190" y="30" text-anchor="middle" fill="#ff9a1f" font-size="10">20 al : Consolidé</text>'
            + '<circle cx="190" cy="115" r="138" fill="none" stroke="#8A7CFF" stroke-dasharray="4 4" opacity=".7"/><text x="190" y="-4" text-anchor="middle" fill="#8A7CFF" font-size="10"></text><text x="300" y="52" fill="#8A7CFF" font-size="10">30 al : Défendu</text>'
            + '<circle cx="190" cy="115" r="12" fill="#4a4f55" stroke="#fff"/><text x="190" y="146" text-anchor="middle" fill="#cfd8dc" font-size="11">Système inoccupé</text>'
            + '<circle cx="120" cy="70" r="8" fill="#4a944a" stroke="#000"/><text x="82" y="58" fill="#7fe07f" font-size="10">Consolidé</text><text x="82" y="85" fill="#9ab" font-size="9">(ancre, 20 al)</text>'
            + '<line x1="120" y1="70" x2="190" y2="115" stroke="#ff9a1f" stroke-width="1.5" stroke-dasharray="4 4"/>'
            + '<rect x="380" y="60" width="230" height="110" fill="#0a0c10" stroke="#2a3540"/><text x="394" y="82" fill="#9ab" font-size="10" letter-spacing="2">PROGRESSION D’ACQUISITION</text>'
            + '<text x="394" y="106" fill="#fff" font-size="11">Puissance A</text><rect x="470" y="97" width="130" height="10" fill="#111"/><rect x="470" y="97" width="60" height="10" fill="#ff9a1f"/><text x="606" y="106" text-anchor="end" fill="#ff9a1f" font-size="10">46 %</text>'
            + '<text x="394" y="130" fill="#fff" font-size="11">Puissance B</text><rect x="470" y="121" width="130" height="10" fill="#111"/><rect x="470" y="121" width="19" height="10" fill="#8a949c"/><text x="606" y="130" text-anchor="end" fill="#9ab" font-size="10">14 %</text>'
            + '<line x1="470" y1="94" x2="470" y2="136" stroke="#fff" stroke-dasharray="2 2"/><text x="478" y="152" fill="#fff" font-size="9">30 % = système contesté</text></svg></div>';
    }
    // schema du BGS : une faction depasse 75 %, entre en Expansion, vise le systeme le plus proche a 20 al ou moins
    function schemaBGS() {
        return '<div class="ca-ecran"><svg class="ca-svg" viewBox="0 0 640 230" role="img" aria-label="Schema de l’expansion BGS">'
            + '<circle cx="130" cy="115" r="16" fill="#ff7a7a" stroke="#fff"/><text x="130" y="150" text-anchor="middle" fill="#cfd8dc" font-size="11">Origine</text><text x="130" y="165" text-anchor="middle" fill="#9ab" font-size="9">faction rivale à plus de 75 %</text>'
            + '<rect x="70" y="26" width="120" height="10" fill="#111"/><rect x="70" y="26" width="96" height="10" fill="#ff7a7a"/><text x="130" y="20" text-anchor="middle" fill="#ff8a8a" font-size="10">Expansion</text>'
            + '<circle cx="130" cy="115" r="140" fill="none" stroke="#ff4fd8" stroke-dasharray="5 4" opacity=".6"/><text x="236" y="52" fill="#ff4fd8" font-size="10">20 al</text>'
            + '<line x1="146" y1="115" x2="330" y2="95" stroke="#ff4fd8" stroke-width="1.6" stroke-dasharray="4 4"/>'
            + '<circle cx="330" cy="95" r="15" fill="#2fe07a" stroke="#000"/><circle cx="330" cy="95" r="22" fill="none" stroke="#ff4fd8" stroke-width="2" stroke-dasharray="6 3"/><text x="330" y="140" text-anchor="middle" fill="#fff" font-size="11">Votre système</text><text x="330" y="155" text-anchor="middle" fill="#9ab" font-size="9">le plus proche avec une place libre</text>'
            + '<circle cx="250" cy="190" r="10" fill="#4a4f55" stroke="#000"/><text x="250" y="212" text-anchor="middle" fill="#778" font-size="9">7 factions : plein</text>'
            + '<circle cx="190" cy="60" r="10" fill="#4a4f55" stroke="#000"/><text x="190" y="82" text-anchor="middle" fill="#778" font-size="9">déjà présente</text>'
            + '<rect x="440" y="52" width="180" height="120" fill="#0a0c10" stroke="#2a3540"/><text x="452" y="72" fill="#9ab" font-size="10" letter-spacing="2">FACTIONS DU SYSTÈME</text>'
            + [['Faction A', 52, '#6f8196'], ['Faction B', 26, '#6f8196'], ['Faction C', 14, '#6f8196'], ['Rivale', 8, '#ff4fd8']].map(function (f, i) { return '<text x="452" y="' + (94 + i * 18) + '" fill="#cfd8dc" font-size="10">' + f[0] + '</text><rect x="520" y="' + (86 + i * 18) + '" width="90" height="8" fill="#111"/><rect x="520" y="' + (86 + i * 18) + '" width="' + f[1] * 0.9 + '" height="8" fill="' + f[2] + '"/>'; }).join('')
            + '<text x="452" y="164" fill="#ff4fd8" font-size="9">5 factions sur 7 : une place libre</text></svg></div>';
    }

    // ---------- les pages ----------
    var PAGES = [
        { id: 'debut', n: 'Bien démarrer', t: 'LA CARTE EN UNE MINUTE', sous: 'Où se jouent vos missions, et ce qui s’en approche',
          html: function () {
              return '<p class="ca-p">Chaque <b>point</b> est un système où l’escadron a une <b>mission active</b> (BGS, Powerplay ou Colonisation). La carte vous montre <b>où agir</b>, et <b>ce qui menace</b> votre territoire.</p>'
                  + barreOutils(true) + carteExemple({ decor: true })
                  + '<div class="ca-liste">'
                  + '<div><em>1</em><b>DESSUS / CÔTÉ</b> : vue de dessus (le haut est le centre galactique) ou de côté (hauteur au-dessus du plan).</div>'
                  + '<div><em>2</em><b>Couleur</b> : ce que dit la couleur d’un point (résultat, participation, priorité).</div>'
                  + '<div><em>3</em><b>Afficher</b> : quelles missions voir, les systèmes de la faction, votre distance à chaque système.</div>'
                  + '<div><em>4</em><b>À RENFORCER</b> : n’éclaire que les systèmes où l’aide est utile.</div>'
                  + '<div><em>5</em><b>Alarmes</b> : les menaces proches de votre territoire (page « Les alarmes »).</div>'
                  + '<div><em>6</em><b>Aller à…</b> : cadre la carte sur une campagne ou un système.</div></div>'
                  + carte([fiche('MOLETTE', COUL.cy, 'Zoom.'), fiche('GLISSER', COUL.cy, 'Déplace la carte.'), fiche('DOUBLE-CLIC', COUL.cy, 'Revient aux cibles.'), fiche('SURVOL', COUL.cy, 'Les infos de la directive.'), fiche('CLIC', COUL.cy, 'Ouvre la fenêtre de la directive.'), fiche('CLIC DROIT', COUL.cy, 'Copie le nom du système (à coller dans le jeu).')])
                  + note('retenir', 'Aucune position de pilote n’est affichée : la carte montre les <b>missions</b>, jamais où vous êtes (sauf pour vous seul, avec « Depuis ma position »).');
          } },
        { id: 'couleurs', n: 'Les couleurs', t: 'LIRE LES COULEURS', sous: 'Un coup d’œil suffit',
          html: function () {
              return '<p class="ca-p">Le <b>menu « Couleur »</b> change ce que raconte le point. Le contour dit toujours à quelle <b>campagne</b> il appartient.</p>'
                  + '<h3 class="ca-h">COULEUR : RÉSULTAT (par défaut)</h3><div class="ca-trio">'
                  + '<div>' + noeud(COUL.up, '') + '<b style="color:' + COUL.up + '">VERT</b><span>L’influence va dans le sens voulu, au dernier tick.</span></div>'
                  + '<div>' + noeud(COUL.dn, '') + '<b style="color:' + COUL.dn + '">ROUGE</b><span>À contre-sens : c’est là que l’aide est utile.</span></div>'
                  + '<div>' + noeud(COUL.fl, '') + '<b style="color:' + COUL.fl + '">BLEU</b><span>Inchangé, ou pas encore mesuré.</span></div></div>'
                  + '<h3 class="ca-h">COULEUR : PARTICIPATION</h3><div class="ca-trio">'
                  + '<div>' + noeud('#9be8ff', '4') + '<b>CLAIR</b><span>3 pilotes ou plus ont joué depuis le dernier tick. Le chiffre est leur nombre.</span></div>'
                  + '<div>' + noeud('#16222c', '0', { tirets: true, txt: '#9ab', contour: '#5a7686' }) + '<b>SOMBRE, POINTILLÉ</b><span>Personne n’a joué : un système délaissé.</span></div>'
                  + '<div>' + noeud('#5a6a76', '–') + '<b>GRIS</b><span>Pas de mesure (Powerplay, Colonisation).</span></div></div>'
                  + '<h3 class="ca-h">COULEUR : PRIORITÉ</h3><div class="ca-trio">'
                  + '<div>' + noeud('#ff4d4d', '1') + '<b>1</b><span>Priorité critique de la campagne.</span></div><div>' + noeud('#ffb000', '2') + '<b>2</b><span>Priorité haute.</span></div><div>' + noeud('#6f8196', '3') + '<b>3</b><span>Priorité normale.</span></div></div>'
                  + '<h3 class="ca-h">LES REPÈRES SUR UN POINT</h3>' + carte([
                      fiche('ANNEAU', COUL.cy, 'À la couleur de la campagne.'), fiche('TAILLE ET CHIFFRE', COUL.cy, 'Plusieurs missions dans le même système : le chiffre dit combien.'),
                      fiche('◆ VIOLET', COUL.pw, 'Une mission Powerplay.'), fiche('■ OR', COUL.or, 'Une mission Colonisation.'), fiche('ANNEAU BLANC', '#fff', 'Avec « À renforcer » : rouge et au plus 1 pilote.'), fiche('POINT PÂLE', '#6f8196', 'Écarté par un filtre.')])
                  + note('exemple', 'Un point <b>rouge</b> au contour <b>cyan</b> et au chiffre <b>2</b> : deux missions de la campagne cyan, à contre-sens au dernier tick.');
          } },
        { id: 'territoire', n: 'Votre territoire', t: 'VOTRE TERRITOIRE', sous: 'Le décor : la faction, les colonies, la puissance défendue',
          html: function () {
              return '<p class="ca-p">Dans le menu <b>Afficher</b>, « Systèmes de la faction » ajoute en fond les systèmes que <b>votre faction contrôle</b>. Ils sont <b>discrets et non cliquables</b> : ils servent à situer vos cibles.</p>'
                  + carteExemple({ decor: true })
                  + carte([fiche('● GRIS', '#7fb8d0', 'Un autre système contrôlé par la faction.'), fiche('● OR', COUL.or, 'Une colonie construite par un membre de l’escadron.'), fiche('◇ VIOLET', COUL.pw, 'Un système sous la puissance que l’escadron défend.')])
                  + note('retenir', 'Un système peut être <b>à la fois</b> une colonie (point or) et sous la puissance défendue (losange). Les colonies d’autres joueurs ne sont pas distinguées.')
                  + '<h3 class="ca-h">LE BLOC « FACTION DE L’ESCADRON »</h3><p class="ca-p">À droite de la carte, il résume : le nombre de systèmes contrôlés, le nombre de colonies de membres, le nombre de systèmes sous la puissance défendue, puis une ligne par niveau d’alarme.</p>'
                  + '<h3 class="ca-h">DEPUIS MA POSITION</h3><p class="ca-p">Cochez-le dans « Afficher » : chaque système affiche sa <b>distance</b> à vous. Votre position vient de votre jeu (plugin) et <b>vous seul</b> la voyez. Si elle est inconnue, la carte vous le dit.</p>'
                  + '<h3 class="ca-h">HORS DE L’ÉCRAN</h3><p class="ca-p">Une cible hors du cadre est listée en haut à gauche de la carte, avec sa distance. Cliquez-la pour l’ouvrir, ou utilisez « Aller à… ».</p>';
          } },
        { id: 'alarmes', n: 'Les alarmes', t: 'LES ALARMES : TROIS NIVEAUX', sous: 'Menu « ⚠ Alarmes » : ce qui s’approche de vos systèmes',
          html: function () {
              return '<p class="ca-p">Une alarme n’est utile que si elle est <b>rare</b>. Ici, trois niveaux, <b>un par type de menace</b>. Seul ce qui est vraiment imminent <b>clignote</b>.</p>'
                  + carteExemple({ decor: true, r1: true, r1c: true, r2: true, r3: true })
                  + '<div class="ca-niveaux">'
                  + '<div class="ca-niv" style="--c:' + COUL.r1 + '"><h4><i></i>POWERPLAY · ENNEMI EN PLACE</h4><p><b>Quoi :</b> un système déjà contrôlé par une puissance ennemie, près de vos systèmes.</p><p><b>Affichage :</b> point rouge <b>fixe</b>. Il clignote seulement s’il vient d’être pris.</p><p><b>Rôle :</b> du contexte : la ligne de front telle qu’elle est.</p></div>'
                  + '<div class="ca-niv" style="--c:' + COUL.r2 + '"><h4><i></i>POWERPLAY · CONQUÊTE ENNEMIE</h4><p><b>Quoi :</b> un système inoccupé où une puissance ennemie progresse (au moins 10 %).</p><p><b>Affichage :</b> point orange avec son %. Il <b>clignote</b> à 30 % ou plus, si la puissance a une ancre en portée.</p><p><b>Rôle :</b> la conquête arrive.</p></div>'
                  + '<div class="ca-niv" style="--c:' + COUL.r3 + '"><h4><i></i>BGS · EXPANSION RIVALE</h4><p><b>Quoi :</b> une faction rivale en Expansion qui devrait choisir <b>un de vos systèmes</b>.</p><p><b>Affichage :</b> anneau rose qui <b>clignote</b>, avec la <b>route</b> jusqu’à son origine. Anneau pâle et fixe : à surveiller.</p><p><b>Rôle :</b> une faction rivale va entrer chez vous.</p></div></div>'
                  + '<h3 class="ca-h">LES RÉGLAGES</h3>' + carte([fiche('CASES', COUL.cy, 'Un niveau se coche ou se décoche. Un niveau sans données n’apparaît pas.'), fiche('DISTANCE', COUL.cy, '10, 15 ou 25 al pour les niveaux Powerplay.'), fiche('NOUVEAU', '#fff', 'Apparu depuis moins de 7 jours. Le tout premier relevé sert de référence.'), fiche('VITESSE', COUL.r2, 'Plus ça clignote vite, plus c’est proche ou récent.')])
                  + note('attention', 'Les données viennent d’un <b>relevé quotidien</b> (Spansh) : elles peuvent avoir quelques jours de retard. L’alarme aide à décider, elle ne remplace pas un coup d’œil dans le jeu.');
          } },
        { id: 'powerplay', n: 'Powerplay : la conquête', t: 'POWERPLAY : COMMENT UNE PUISSANCE CONQUIERT', sous: 'La mécanique derrière l’alarme orange',
          html: function () {
              return '<p class="ca-p">Chaque système est <b>contrôlé</b> par une puissance (Exploité, Consolidé, Défendu) ou <b>inoccupé</b>. Les puissances cherchent à <b>acquérir</b> les systèmes inoccupés proches de leur territoire.</p>'
                  + schemaPP()
                  + '<div class="ca-liste"><div><em>1</em><b>La progression</b> : les actions des pilotes d’une puissance font monter son pourcentage d’acquisition sur un système inoccupé.</div>'
                  + '<div><em>2</em><b>Les 30 %</b> : quand deux puissances ou plus dépassent 30 %, le système devient <b>contesté</b> : une course s’ouvre.</div>'
                  + '<div><em>3</em><b>L’ancre</b> : une puissance ne peut viser que les systèmes proches d’un de ses systèmes forts : un <b>Consolidé à 20 al</b> ou un <b>Défendu à 30 al</b>.</div>'
                  + '<div><em>4</em><b>Le tick</b> : au tick hebdomadaire (jeudi, 07:00 UTC), la première puissance qui atteint le seuil prend le système, qui devient <b>Exploité</b>.</div></div>'
                  + '<h3 class="ca-h">CE QUE FAIT LA CARTE</h3><p class="ca-p">Elle cherche, près de vos systèmes, les inoccupés où une puissance <b>ennemie</b> a au moins 10 %. À partir de 30 %, elle <b>vérifie l’ancre</b> : sans ancre en portée, le point reste fixe et pâle (la puissance ne devrait pas pouvoir le prendre).</p>'
                  + note('limite', 'Les seuils (30 %, 20 al, 30 al) viennent de <b>guides de joueurs</b>, pas de la documentation officielle. Ils peuvent changer avec les mises à jour du jeu.')
                  + note('retenir', 'Une puissance <b>ennemie</b> est une puissance d’un camp différent du vôtre (Empire, Fédération, Alliance, Indépendants). Les indépendants sont rivaux entre eux.');
          } },
        { id: 'bgs', n: 'BGS : l’expansion', t: 'BGS : COMMENT UNE FACTION S’ÉTEND', sous: 'La mécanique derrière l’alarme rose',
          html: function () {
              return '<p class="ca-p">Les systèmes habités accueillent jusqu’à <b>7 factions</b>. Une faction très installée peut <b>s’étendre</b> vers un système voisin : c’est l’<b>expansion</b>. Ce n’est pas du Powerplay : une faction a une <b>allégeance</b> (Fédération, Empire, Alliance, Indépendant), pas une puissance.</p>'
                  + schemaBGS()
                  + '<div class="ca-liste"><div><em>1</em><b>Le déclencheur</b> : une faction dépasse <b>75 %</b> d’influence dans un système : elle entre en état d’<b>Expansion</b>.</div>'
                  + '<div><em>2</em><b>La cible</b> : le jeu choisit le système habité <b>le plus proche</b>, à <b>20 al</b> au plus, qui a <b>moins de 7 factions</b> et où elle n’est pas déjà présente.</div>'
                  + '<div><em>3</em><b>L’arrivée</b> : la faction s’y installe comme la <b>dernière</b> en influence. Elle perd beaucoup d’influence chez elle.</div>'
                  + '<div><em>4</em><b>Une fois en attente</b>, l’expansion va jusqu’au bout même si l’influence retombe sous 75 %.</div></div>'
                  + '<h3 class="ca-h">CE QUE FAIT LA CARTE</h3>' + carte([fiche('ANNEAU ROSE QUI CLIGNOTE', COUL.r3, 'Votre système est <b>le plus proche éligible</b> pour une faction rivale en Expansion : c’est l’alerte. Un trait pointillé montre la route jusqu’à l’origine.'), fiche('ANNEAU PÂLE ET FIXE', '#d9a6d0', 'À surveiller : à portée, mais le jeu devrait plutôt en choisir un autre.'), fiche('RIVALE', COUL.r3, 'Seules les factions d’une allégeance <b>différente</b> de celle de votre puissance sont signalées.')])
                  + note('limite', 'La carte ne voit que les expansions <b>déjà engagées</b> (état « Expansion »). Une expansion seulement « en attente » n’est pas détectable. Les nombres (75 %, 20 al, 7 factions) viennent du wiki et de guides de joueurs : le jeu peut avoir des exclusions que nous ne connaissons pas.');
          } },
        { id: 'zoom', n: 'Zoom et outils', t: 'ZOOMER, REGROUPER, NAVIGUER', sous: 'Rester lisible quand il y a beaucoup de systèmes',
          html: function () {
              return '<p class="ca-p">Quand vous dézoomez, les points proches <b>se regroupent</b> en bulles. Zoomez : elles se séparent.</p>'
                  + carteExemple({ decor: true, bulle: true })
                  + carte([fiche('BULLE POINTILLÉE', '#cfd8dc', 'Plusieurs cibles regroupées. Le chiffre est leur nombre. Clic : zoom sur le groupe. Survol : la liste.'), fiche('NOMS', COUL.cy, 'Un nom qui ne tient pas est omis. Zoomez pour tout lire.'), fiche('DÉCOR EN CHIFFRES', COUL.or, 'À petite échelle, le décor se groupe : nombre de systèmes, de colonies (or) et sous la puissance (violet).')])
                  + '<h3 class="ca-h">ALLER À…</h3><p class="ca-p">Ce menu cadre la carte sur : <b>tout voir</b>, toutes les cibles, les colonies de l’escadron, une <b>campagne</b>, un <b>système</b> ou les <b>alarmes</b>.</p>'
                  + '<h3 class="ca-h">COPIER UN NOM</h3><p class="ca-p"><b>Clic droit</b> sur un système (ou <b>Ctrl+C</b> en le survolant) copie son nom, prêt à être collé dans la carte galactique du jeu. Sur une bulle, tous les noms sont copiés, un par ligne.</p>'
                  + '<h3 class="ca-h">LA LISTE DES CAMPAGNES</h3><p class="ca-p">À droite, cliquer une campagne la <b>masque</b> ou la réaffiche sur la carte.</p>';
          } },
        { id: 'sources', n: 'Sources et limites', t: 'D’OÙ VIENNENT LES DONNÉES', sous: 'Ce qui est exact, ce qui peut être en retard',
          html: function () {
              return '<p class="ca-p">Rien n’est deviné : chaque information vient d’une source précise. Et quand un <b>pilote de l’escadron</b> passe dans un système, ce qu’il voit dans son jeu est <b>plus frais</b> que n’importe quelle base de données.</p>'
                  + '<div class="ca-tableau"><div class="ca-th"><span>CE QUE VOUS VOYEZ</span><span>D’OÙ ÇA VIENT</span><span>FRAÎCHEUR</span></div>'
                  + '<div><span>Résultat des directives (influence, états des factions)</span><span>EDSM, relevé deux fois par jour, <b>ou</b> le journal de jeu d’un pilote de l’escadron arrivé dans le système (plugin 2.42)</span><span>La donnée la plus récente est gardée. L’âge est celui de la dernière visite d’un joueur : « mis à jour par CMDR … » = un pilote</span></div>'
                  + '<div><span>Scores de guerre et d’élection</span><span>Journal de jeu d’un pilote, à son arrivée dans le système</span><span>Gardés 48 h : « relevé par CMDR … »</span></div>'
                  + '<div><span>État Powerplay d’un système (barre du jeu)</span><span>Journal de jeu d’un pilote, à son arrivée dans le système</span><span>Dernière visite d’un pilote</span></div>'
                  + '<div><span>Position d’un système</span><span>EDSM (une seule fois par système, puis gardée)</span><span>Fixe</span></div>'
                  + '<div><span>Systèmes de la faction, colonies, puissance</span><span>Spansh, relevé quotidien</span><span>Quelques jours de retard possibles</span></div>'
                  + '<div><span>Alarmes Powerplay et BGS</span><span>Spansh, relevé quotidien (par lots)</span><span>Quelques jours de retard possibles</span></div>'
                  + '<div><span>Votre position (« Depuis ma position »)</span><span>Plugin SYS.EDTEAM (journal du jeu)</span><span>En direct, pour vous seul</span></div></div>'
                  + '<h3 class="ca-h">CE QUE LA CARTE NE FAIT PAS</h3><div class="ca-liste"><div><em>✕</em>Elle ne montre <b>aucune position de pilote</b> (sauf la vôtre, pour vous).</div><div><em>✕</em>Elle ne détecte pas une expansion BGS <b>seulement en attente</b>.</div><div><em>✕</em>Elle ne prédit pas le tick exact d’une arrivée : elle dit « c’est la cible probable ».</div><div><em>✕</em>Elle ne remplace pas la carte du jeu : en cas de doute, <b>vérifiez en jeu</b>.</div></div>'
                  + '<h3 class="ca-h">« MIS À JOUR PAR CMDR … »</h3><p class="ca-p">EDSM ne se met à jour que lorsqu’un joueur visite le système avec un outil qui envoie ses données : un système que personne ne visite peut afficher « il y a 38 h » alors que notre relevé est bien fait deux fois par jour. Pour y remédier, <b>quand vous arrivez dans un système ciblé par une directive active</b>, votre plugin relève les factions dans votre journal de jeu et les envoie à l’escadron. La fenêtre de la directive affiche alors <b>« mis à jour par CMDR … il y a … »</b> (la page garde ses résultats en mémoire jusqu’à 5 minutes : rechargez ensuite). Rien n’est envoyé pour les systèmes sans directive.</p>'
                  + note('retenir', 'Pour avoir un résultat frais sur une directive, <b>un pilote n’a qu’à se rendre dans son système</b> : EDMC affiche « RELEVÉ DU SYSTÈME … ENVOYÉ ». Penser aussi à renseigner son nom de commandant et sa clé EDSM dans EDMC pour aider tout le monde.')
                  + note('retenir', 'Les ticks : le <b>BGS</b> avance chaque jour, le <b>Powerplay</b> chaque semaine (jeudi, 07:00 UTC). Une alarme du jour peut donc se réaliser (ou non) à l’un de ces moments.')
                  + note('exemple', 'Une alarme rose apparaît sur votre système. Vérifiez dans le jeu que la faction rivale y est bien en Expansion et que votre système a une place libre. Si oui, <b>renforcez l’influence de votre faction</b> : c’est l’objet des directives BGS.');
          } }
    ];

    var CSS = [
        '#ca-aide{position:fixed;inset:0;z-index:9700;display:flex;align-items:center;justify-content:center;padding:14px;background:radial-gradient(circle at 50% 40%,rgba(0,240,255,.14),rgba(0,0,0,.95) 62%);backdrop-filter:blur(5px);animation:caFond .25s ease both;font-family:inherit}',
        '#ca-aide .ca-boite{position:relative;width:min(98vw,1240px);height:min(94vh,900px);display:grid;grid-template-columns:230px minmax(0,1fr);grid-template-rows:minmax(0,1fr) auto;background:rgba(4,8,12,.98);border:1px solid #00F0FF;box-shadow:0 0 50px rgba(0,240,255,.25);animation:caEntree .3s ease both}',
        '#ca-aide .ca-nav{grid-row:1/3;border-right:1px solid rgba(0,240,255,.25);padding:18px 10px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;background:rgba(0,240,255,.03)}',
        '#ca-aide .ca-logo{color:#00F0FF;letter-spacing:4px;font-size:.78em;margin:0 8px 12px;line-height:1.5} #ca-aide .ca-logo b{display:block;color:#fff;font-size:1.25em;letter-spacing:3px}',
        '#ca-aide .ca-nb{display:flex;align-items:center;gap:10px;text-align:left;background:transparent;border:1px solid transparent;color:#9ab;padding:9px 10px;font-family:inherit;font-size:.82em;letter-spacing:1px;cursor:pointer} #ca-aide .ca-nb em{font-style:normal;flex:none;width:22px;height:22px;border-radius:50%;border:1px solid #3a4a55;display:flex;align-items:center;justify-content:center;font-size:.85em} #ca-aide .ca-nb:hover{color:#fff;border-color:#2a4a5a} #ca-aide .ca-nb.on{color:#00F0FF;border-color:#00F0FF;background:rgba(0,240,255,.12)} #ca-aide .ca-nb.on em{border-color:#00F0FF;background:#00F0FF;color:#001418}',
        '#ca-aide .ca-corps{grid-column:2;overflow-y:auto;padding:24px 34px 10px;color:#cfd3d8;line-height:1.6;font-size:.92em;scroll-behavior:smooth}',
        '#ca-aide .ca-x{position:absolute;top:10px;right:14px;z-index:2;background:transparent;border:1px solid #555;color:#aaa;width:34px;height:34px;font-size:1.1em;cursor:pointer;font-family:inherit} #ca-aide .ca-x:hover{border-color:#00F0FF;color:#00F0FF}',
        '#ca-aide .ca-eti{display:inline-block;border:1px solid #00F0FF;color:#00F0FF;background:rgba(0,240,255,.1);padding:3px 14px;letter-spacing:4px;font-weight:bold;font-size:.72em} #ca-aide .ca-titre{margin:12px 0 4px;color:#fff;font-size:1.55em;font-weight:bold;letter-spacing:3px;line-height:1.25;text-shadow:0 0 18px rgba(0,240,255,.45)} #ca-aide .ca-sous{color:#00F0FF;letter-spacing:2px;font-size:.9em;margin-bottom:14px}',
        '#ca-aide .ca-p{margin:12px 0;max-width:860px} #ca-aide .ca-p b,#ca-aide .ca-liste b,#ca-aide .ca-note b{color:#fff} #ca-aide .ca-h{margin:24px 0 8px;color:#00F0FF;letter-spacing:3px;font-size:.78em;font-weight:normal;border-bottom:1px solid rgba(0,240,255,.2);padding-bottom:5px}',
        '#ca-aide .ca-ecran{margin:14px 0;border:1px solid rgba(0,240,255,.3);background:#070a0e;padding:10px} #ca-aide .ca-svg{width:100%;height:auto;display:block;background:radial-gradient(ellipse at 50% 45%,#0b1722 0%,#05080c 70%);border:1px solid #16303d} #ca-aide .ca-svg text{font-family:inherit}',
        '#ca-aide .ca-outils{display:flex;gap:8px;flex-wrap:wrap;padding:4px 2px 12px} #ca-aide .ca-b{position:relative;border:1px solid #3a4a55;color:#9ab;padding:6px 12px;font-size:.78em;letter-spacing:1px} #ca-aide .ca-b.on{border-color:#00F0FF;color:#00F0FF;background:rgba(0,240,255,.16)} #ca-aide .ca-b em{position:absolute;top:-10px;right:-8px;width:19px;height:19px;border-radius:50%;background:#FF7100;color:#000;font-style:normal;font-weight:bold;font-size:.85em;display:flex;align-items:center;justify-content:center}',
        '#ca-aide .ca-liste{margin:14px 0;display:grid;gap:8px} #ca-aide .ca-liste>div{display:flex;gap:12px;align-items:flex-start;border:1px dashed rgba(0,240,255,.3);background:rgba(0,240,255,.04);padding:9px 12px} #ca-aide .ca-liste em{flex:none;width:24px;height:24px;border-radius:50%;border:1px solid #00F0FF;color:#00F0FF;font-style:normal;font-weight:bold;display:flex;align-items:center;justify-content:center;font-size:.85em}',
        '#ca-aide .ca-cartes{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;margin:14px 0} #ca-aide .ca-fiche{border:1px solid color-mix(in srgb,var(--c) 45%,transparent);border-left:4px solid var(--c);background:linear-gradient(135deg,color-mix(in srgb,var(--c) 10%,#0a0c10),#0a0c10 80%);padding:10px 12px} #ca-aide .ca-fiche b{display:block;color:var(--c);letter-spacing:2px;font-size:.78em;margin-bottom:4px} #ca-aide .ca-fiche div{color:#cfd3d8;font-size:.9em}',
        '#ca-aide .ca-trio{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:10px 0} #ca-aide .ca-trio>div{display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.02);padding:12px 10px} #ca-aide .ca-trio span{color:#aab;font-size:.85em} #ca-aide .ca-noeud{width:56px;height:56px}',
        '#ca-aide .ca-note{margin:14px 0;padding:10px 14px;border:1px solid #555;border-left:4px solid #00F0FF;background:rgba(255,255,255,.03);max-width:900px} #ca-aide .ca-note>b{display:block;letter-spacing:3px;font-size:.7em;color:#00F0FF;margin-bottom:3px} #ca-aide .ca-note.attention{border-left-color:#ff9a1f} #ca-aide .ca-note.attention>b{color:#ff9a1f} #ca-aide .ca-note.limite{border-left-color:#ff4fd8} #ca-aide .ca-note.limite>b{color:#ff4fd8} #ca-aide .ca-note.exemple{border-left-color:#2fe07a} #ca-aide .ca-note.exemple>b{color:#2fe07a}',
        '#ca-aide .ca-niveaux{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:14px 0} #ca-aide .ca-niv{border:1px solid color-mix(in srgb,var(--c) 55%,transparent);background:linear-gradient(180deg,color-mix(in srgb,var(--c) 10%,#0a0c10),#0a0c10 70%);padding:12px 14px} #ca-aide .ca-niv h4{margin:0 0 8px;color:var(--c);letter-spacing:2px;font-size:.78em;display:flex;align-items:center;gap:8px} #ca-aide .ca-niv h4 i{width:11px;height:11px;border-radius:50%;background:var(--c);flex:none;animation:caBlink 1.1s ease-in-out infinite} #ca-aide .ca-niv p{margin:6px 0;font-size:.88em}',
        '#ca-aide .ca-tableau{margin:14px 0;border:1px solid rgba(0,240,255,.25)} #ca-aide .ca-tableau>div{display:grid;grid-template-columns:1.2fr 1.4fr 1fr;gap:12px;padding:8px 12px;border-top:1px solid rgba(255,255,255,.06);font-size:.88em} #ca-aide .ca-tableau .ca-th{border-top:0;background:rgba(0,240,255,.08);color:#00F0FF;letter-spacing:2px;font-size:.7em}',
        '#ca-aide .ca-chip{display:inline-flex;align-items:center;gap:6px} #ca-aide .ca-chip i{width:9px;height:9px;border-radius:50%;background:var(--c)}',
        '#ca-aide .ca-pied{grid-column:2;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 24px;border-top:1px solid rgba(0,240,255,.2);background:rgba(0,0,0,.3)} #ca-aide .ca-btn{background:rgba(0,240,255,.1);border:1px solid #00F0FF;color:#00F0FF;padding:9px 20px;font-family:inherit;letter-spacing:2px;font-weight:bold;cursor:pointer} #ca-aide .ca-btn:hover{background:#00F0FF;color:#000} #ca-aide .ca-btn.gris{background:transparent;border-color:#555;color:#aaa} #ca-aide .ca-btn.gris:hover{background:#aaa;color:#000} #ca-aide .ca-pts{color:#778;font-size:.8em;letter-spacing:2px}',
        '#ca-aide .ca-al .pt{animation:caBlink var(--d,1s) ease-in-out infinite} #ca-aide .ca-al .rg{transform-box:fill-box;transform-origin:center;animation:caPulse var(--d,1s) ease-out infinite}',
        '@keyframes caFond{from{opacity:0}to{opacity:1}} @keyframes caEntree{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:none}} @keyframes caBlink{0%,100%{opacity:1}50%{opacity:.25}} @keyframes caPulse{0%{transform:scale(.7);opacity:.9}100%{transform:scale(2.8);opacity:0}}',
        '@media (max-width:900px){#ca-aide .ca-boite{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr) auto;height:96vh}#ca-aide .ca-nav{grid-row:1;flex-direction:row;overflow-x:auto;overflow-y:hidden;border-right:0;border-bottom:1px solid rgba(0,240,255,.25);padding:8px}#ca-aide .ca-logo{display:none}#ca-aide .ca-nb span{display:none}#ca-aide .ca-corps{grid-column:1;padding:16px}#ca-aide .ca-pied{grid-column:1}#ca-aide .ca-niveaux,#ca-aide .ca-trio{grid-template-columns:1fr}#ca-aide .ca-tableau>div{grid-template-columns:1fr}}',
        '@media (prefers-reduced-motion:reduce){#ca-aide,#ca-aide .ca-boite,#ca-aide .ca-al .pt,#ca-aide .ca-al .rg,#ca-aide .ca-niv h4 i{animation:none}}'
    ].join('\n');

    function ouvrir(page) {
        if (document.getElementById('ca-aide')) return;
        if (!document.getElementById('ca-aide-css')) { var st = document.createElement('style'); st.id = 'ca-aide-css'; st.textContent = CSS; document.head.appendChild(st); }
        var idx = 0; PAGES.forEach(function (p, i) { if (p.id === page) idx = i; });
        var ov = document.createElement('div'); ov.id = 'ca-aide'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Aide de la carte galactique');
        ov.innerHTML = '<div class="ca-boite"><button type="button" class="ca-x" aria-label="Fermer">✕</button>'
            + '<nav class="ca-nav"><div class="ca-logo">AIDE<b>CARTE GALACTIQUE</b></div>' + PAGES.map(function (p, i) { return '<button type="button" class="ca-nb" data-i="' + i + '"><em>' + (i + 1) + '</em><span>' + p.n + '</span></button>'; }).join('') + '</nav>'
            + '<div class="ca-corps"></div><div class="ca-pied"><button type="button" class="ca-btn gris" data-a="prec">◀ PRÉCÉDENT</button><span class="ca-pts"></span><button type="button" class="ca-btn" data-a="suiv">SUIVANT ▶</button></div></div>';
        var corps = ov.querySelector('.ca-corps');
        function aller(i) {
            idx = Math.max(0, Math.min(PAGES.length - 1, i)); var p = PAGES[idx];
            corps.innerHTML = '<span class="ca-eti">AIDE · ' + (idx + 1) + ' / ' + PAGES.length + '</span><div class="ca-titre">' + p.t + '</div><div class="ca-sous">' + p.sous + '</div>' + p.html();
            [].forEach.call(corps.querySelectorAll('.ca-liste > div'), function (d) { var em = d.querySelector('em'), sp = document.createElement('span'); while (em && em.nextSibling) sp.appendChild(em.nextSibling); d.appendChild(sp); });      // le texte d'une ligne forme un seul bloc a cote du numero
            corps.scrollTop = 0;
            [].forEach.call(ov.querySelectorAll('.ca-nb'), function (b) { b.classList.toggle('on', Number(b.getAttribute('data-i')) === idx); });
            ov.querySelector('[data-a="prec"]').style.visibility = idx === 0 ? 'hidden' : 'visible';
            var sv = ov.querySelector('[data-a="suiv"]'); sv.textContent = idx === PAGES.length - 1 ? 'FERMER ✓' : 'SUIVANT ▶';
            ov.querySelector('.ca-pts').textContent = PAGES[idx].n.toUpperCase();
        }
        function fermer() { document.removeEventListener('keydown', clavier); if (ov.parentNode) ov.parentNode.removeChild(ov); }
        function clavier(e) { if (e.key === 'Escape') fermer(); else if (e.key === 'ArrowRight') aller(idx + 1); else if (e.key === 'ArrowLeft') aller(idx - 1); }
        ov.querySelector('.ca-x').addEventListener('click', fermer);
        ov.addEventListener('click', function (e) { if (e.target === ov) fermer(); });
        ov.querySelector('[data-a="prec"]').addEventListener('click', function () { aller(idx - 1); });
        ov.querySelector('[data-a="suiv"]').addEventListener('click', function () { if (idx === PAGES.length - 1) fermer(); else aller(idx + 1); });
        [].forEach.call(ov.querySelectorAll('.ca-nb'), function (b) { b.addEventListener('click', function () { aller(Number(b.getAttribute('data-i'))); }); });
        document.addEventListener('keydown', clavier);
        document.body.appendChild(ov); aller(idx);
    }
    window.EdteamCarteAide = { ouvrir: ouvrir, pages: function () { return PAGES.map(function (p) { return p.id; }); } };
})();
