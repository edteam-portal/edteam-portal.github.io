// PLAQUES MÉTALLIQUES DE CAMPAGNE (dessin vectoriel, aucune image, aucune requête, AUCUNE animation). Partagée par bgs.html, escadron.html et revelations.js (fenêtre plein écran d'une nouvelle plaque).
//   forgerRubanSVG(typeOrdre, jours, points, rang, tooltipText, onclickAction)
// Une plaque = un rectangle de métal biseauté, rivetée, avec un champ d'émail à la couleur de la directive (guerre, hausse, baisse, élection),
//   des barrettes de métal incrustées (une par jour de campagne, 10 au plus) et des étoiles en relief ; le métal est celui des médailles FRÈRES D'ARMES :
//   acier (moins de 10 points), bronze (10), argent (40), or (70), diamant (100). Le podium (rang 1, 2, 3) ajoute une bordure diamant / or / argent et un médaillon numéroté.
(function () {
    'use strict';
    

    // mêmes teintes que les médailles (medaille.js), plus un acier neutre pour les plaques débutantes
    var METAUX = {
        acier:   { clair: '#d5dde5', moyen: '#7f8b98', fonce: '#2a323c', etoile: '#e8eef4' },
        bronze:  { clair: '#ffe0b0', moyen: '#d98a45', fonce: '#4a2511', etoile: '#ffd9a0' },
        argent:  { clair: '#ffffff', moyen: '#aab4be', fonce: '#4b5562', etoile: '#ffffff' },
        or:      { clair: '#fff7c9', moyen: '#e6b422', fonce: '#6b4a05', etoile: '#fff3b0' },
        diamant: { clair: '#ffffff', moyen: '#6fdcff', fonce: '#1f6f93', etoile: '#ffffff' }
    };
    var EMAIL = {
        GUERRE:   ['#9a1a1a', '#2c0505', '#ff5a5a'],
        HAUSSE:   ['#0f6b1c', '#021a07', '#5dff7a'],
        BAISSE:   ['#b3550f', '#3a1a02', '#ffa04d'],
        ELECTION: ['#1646a8', '#030c26', '#5ce1ff'],
        AUTRE:    ['#4a5058', '#14171b', '#d0d6dc']
    };
    function mix(a, b, t) { var p = function (h) { return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }, x = p(a), y = p(b); return '#' + x.map(function (v, i) { var c = Math.round(v + (y[i] - v) * t); return (c < 16 ? '0' : '') + c.toString(16); }).join(''); }
    function metalDe(points) { return points >= 100 ? 'diamant' : points >= 70 ? 'or' : points >= 40 ? 'argent' : points >= 10 ? 'bronze' : 'acier'; }
    function nbEtoiles(points) { return points >= 200 ? 3 : points >= 150 ? 2 : points >= 100 ? 1 : points >= 90 ? 3 : points >= 80 ? 2 : points >= 70 ? 1 : points >= 60 ? 3 : points >= 50 ? 2 : points >= 40 ? 1 : points >= 30 ? 3 : points >= 20 ? 2 : points >= 10 ? 1 : 0; }

    // le dessin seul (sans conteneur) : sert aussi à la fenêtre plein écran et à la maquette
    window.dessinPlaque = function (typeOrdre, jours, points, rang) {
        var t = String(typeOrdre || '').toUpperCase(), em = EMAIL[t.indexOf('GUERRE') >= 0 ? 'GUERRE' : t.indexOf('HAUSSE') >= 0 ? 'HAUSSE' : t.indexOf('BAISSE') >= 0 ? 'BAISSE' : t.indexOf('ELECTION') >= 0 ? 'ELECTION' : 'AUTRE'];
        var M = METAUX[metalDe(points)], id = 'pq' + Math.random().toString(36).substring(2, 8), podium = rang >= 1 && rang <= 3;
        var MP = podium ? METAUX[rang === 1 ? 'diamant' : rang === 2 ? 'or' : 'argent'] : null;
        var h = '<defs>'
            + '<linearGradient id="' + id + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + M.clair + '"/><stop offset=".3" stop-color="' + M.moyen + '"/><stop offset=".72" stop-color="' + mix(M.moyen, M.fonce, .55) + '"/><stop offset="1" stop-color="' + M.fonce + '"/></linearGradient>'
            + '<linearGradient id="' + id + 'e" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + em[0] + '"/><stop offset="1" stop-color="' + em[1] + '"/></linearGradient>'
            + '<linearGradient id="' + id + 's" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + M.clair + '"/><stop offset=".5" stop-color="' + M.moyen + '"/><stop offset="1" stop-color="' + M.fonce + '"/></linearGradient>'
            + '<linearGradient id="' + id + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".30"/><stop offset=".5" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>'
            + '<linearGradient id="' + id + 'x" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + M.etoile + '"/><stop offset=".5" stop-color="' + M.moyen + '"/><stop offset="1" stop-color="' + M.fonce + '"/></linearGradient>'
            + '<radialGradient id="' + id + 'r" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="' + M.clair + '"/><stop offset="1" stop-color="' + M.fonce + '"/></radialGradient>'
            + (podium ? '<linearGradient id="' + id + 'p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + MP.clair + '"/><stop offset=".5" stop-color="' + MP.moyen + '"/><stop offset="1" stop-color="' + MP.fonce + '"/></linearGradient>' : '')
            + '<pattern id="' + id + 'h" width="100" height="1.1" patternUnits="userSpaceOnUse"><rect width="100" height=".38" fill="#fff" opacity=".10"/><rect y=".6" width="100" height=".25" fill="#000" opacity=".10"/></pattern>'
            + '</defs>';
        // corps de la plaque : métal brossé, bords coupés, biseau clair en haut à gauche et sombre en bas à droite
        var corps = 'M2,0H98L100,2V26L98,28H2L0,26V2Z';
        h += '<path d="' + corps + '" fill="url(#' + id + 'b)"/><path d="' + corps + '" fill="url(#' + id + 'h)"/>'
            + '<path d="M2,.5H98L99.6,2" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width=".7"/><path d="M99.5,2V26L98,27.5H2" fill="none" stroke="#000" stroke-opacity=".5" stroke-width=".7"/>'
            + '<path d="M.5,2.2V25.8" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width=".5"/>';
        // bordure de podium
        if (podium) h += '<path d="M2.6,1.3H97.4L98.7,2.6V25.4L97.4,26.7H2.6L1.3,25.4V2.6Z" fill="none" stroke="url(#' + id + 'p)" stroke-width="1.5"/>';
        // champ d'émail (couleur de la directive) : creusé dans le métal
        h += '<rect x="5.2" y="4.2" width="89.6" height="19.6" rx=".8" fill="#000" opacity=".55"/>'
            + '<rect x="5.6" y="4.6" width="88.8" height="18.8" rx=".6" fill="url(#' + id + 'e)"/>'
            + '<rect x="5.6" y="4.6" width="88.8" height="18.8" rx=".6" fill="url(#' + id + 'g)"/>'
            + '<rect x="5.6" y="4.6" width="88.8" height="18.8" rx=".6" fill="none" stroke="#000" stroke-opacity=".7" stroke-width=".5"/>'
            + '<path d="M5.8,23.6H94.2" stroke="' + M.clair + '" stroke-opacity=".5" stroke-width=".4"/>';
        // barrettes de métal incrustées : une par jour (10 au plus)
        var nb = Math.min(Math.max(0, Math.floor(jours)), 10);
        if (nb > 0) {
            var x0 = podium ? 17 : 8, x1 = 92, esp = (x1 - x0) / (nb + 1);
            for (var i = 1; i <= nb; i++) {
                var x = x0 + esp * i - 1.1;
                h += '<rect x="' + (x + .5).toFixed(2) + '" y="5.3" width="2.2" height="17.6" fill="#000" opacity=".5"/><rect x="' + x.toFixed(2) + '" y="4.9" width="2.2" height="17.6" fill="url(#' + id + 's)" stroke="#000" stroke-opacity=".55" stroke-width=".3"/><rect x="' + (x + .35).toFixed(2) + '" y="5.1" width=".5" height="17" fill="#fff" opacity=".55"/>';
            }
        }
        // étoiles en relief (même métal que la médaille)
        var ne = nbEtoiles(points), sc = ne === 1 ? 0.66 : ne === 2 ? 0.6 : 0.52, xs = ne === 1 ? [50] : ne === 2 ? [40, 62] : [31, 50, 69];
        for (var k = 0; k < ne; k++) {
            h += '<g transform="translate(' + xs[k] + ' 14) scale(' + sc + ')"><polygon points="0,-14 4,-4 15,-4 6,3 9,14 0,7 -9,14 -6,3 -15,-4 -4,-4" transform="translate(1.3 1.6)" fill="#000" opacity=".6"/>'
                + '<polygon points="0,-14 4,-4 15,-4 6,3 9,14 0,7 -9,14 -6,3 -15,-4 -4,-4" fill="url(#' + id + 'x)" stroke="' + M.fonce + '" stroke-width="1.3" stroke-linejoin="round"/>'
                + '<polygon points="0,-10 2.6,-3.5 -2.2,-3.2" fill="#fff" opacity=".6"/></g>';
        }
        // rivets aux quatre coins (le médaillon du podium prend la place du rivet en haut à gauche)
        [[3, 3], [97, 3], [3, 25], [97, 25]].forEach(function (p, j) { if (podium && j === 0) return; h += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.25" fill="#000" opacity=".5" transform="translate(.25 .35)"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.2" fill="url(#' + id + 'r)" stroke="#000" stroke-opacity=".55" stroke-width=".3"/><path d="M' + (p[0] - .7) + ',' + (p[1] + .15) + 'H' + (p[0] + .7) + '" stroke="#000" stroke-opacity=".55" stroke-width=".3"/>'; });
        // médaillon du podium
        if (podium) h += '<circle cx="8.2" cy="8.7" r="6.4" fill="#000" opacity=".45" transform="translate(.4 .6)"/><circle cx="8.2" cy="8.7" r="6.2" fill="url(#' + id + 'p)" stroke="#000" stroke-opacity=".6" stroke-width=".4"/><circle cx="8.2" cy="8.7" r="4.5" fill="#06090d" stroke="#000" stroke-width=".4"/>'
            + '<text x="8.2" y="12.1" text-anchor="middle" font-family="\'Share Tech Mono\', monospace" font-size="8.6" font-weight="bold" fill="' + MP.clair + '">' + rang + '</text>';
        return h;
    };

    window.forgerRubanSVG = function (typeOrdre, jours, points, rang, tooltipText, onclickAction) {
        var clic = onclickAction ? 'onclick="' + onclickAction + '; if(typeof hideHoloTooltip === \'function\') hideHoloTooltip();"' : '';
        return '<div style="position: relative; cursor: help; transition: 0.1s;" ' + clic
            + ' onmouseenter="if(typeof showHoloTooltip === \'function\') showHoloTooltip(event, \'' + (tooltipText || '') + '\', \'#fff\')" onmouseleave="if(typeof hideHoloTooltip === \'function\') hideHoloTooltip()" onmousemove="if(typeof moveHoloTooltip === \'function\') moveHoloTooltip(event)"'
            + ' onmouseover="this.style.transform=\'scale(1.15)\'; this.style.zIndex=\'50\';" onmouseout="this.style.transform=\'scale(1)\'; this.style.zIndex=\'1\';">'
            + '<svg viewBox="0 0 100 28" style="width: 120px; height: 33px; display: block; filter: drop-shadow(1px 2px 2px rgba(0,0,0,0.8));">' + window.dessinPlaque(typeOrdre, jours, points, rang) + '</svg></div>';
    };
})();
