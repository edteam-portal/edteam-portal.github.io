// MEDAILLE « FRERES D'ARMES » : UNE seule fonction qui dessine la medaille a partir du nombre de campagnes d'autres escadrons aidees (n), partout sur le site.
//   metal : bronze (1-29), argent (30-49), or (50-99), diamant (100+) ; une graduation par campagne ; 5 etoiles a 1 / 3 / 5 / 10 / 20 ; logo EDTEAM sculpte en relief au centre.
//   svg(n, taille, petit, opt)  : dessin 2D (petit = sans graduations, pour l'en-tete, les bulles et les listes) ; opt.tips = bulles d'explication ; opt.camps = [{nom, hote, date}] (SA medaille seulement)
//   html3D(n, taille, opt)      : meme dessin en 3D (disque avec de l'epaisseur, dos grave, oscille doucement ; coupe si « reduire les animations »)
//   loupe(n, opt)               : fenetre qui l'agrandit ; survol = bulle qui explique chaque element ; opt = { titre, sous, camps }
//   Tout element portant data-fa-loupe="N" ouvre la loupe au clic (data-fa-moi="1" : la medaille du pilote connecte, avec le detail de ses campagnes).
// Charge A LA DEMANDE (carriere / diplomes / listes). Aucune requete, aucune image : tout est dessine en SVG.
(function () {
    'use strict';
    if (window.EdteamMedaille) return;

    var METAUX = {
      bronze:  { nom: 'BRONZE',  clair: '#ffe0b0', moyen: '#d98a45', fonce: '#4a2511', champ: ['#e0a266', '#8a4a1c'], accent: '#ffb870', etoile: '#ffd9a0', ombre: '#5a3a20' },
      argent:  { nom: 'ARGENT',  clair: '#ffffff', moyen: '#aab4be', fonce: '#4b5562', champ: ['#e6ebf0', '#8d98a4'], accent: '#eef6fc', etoile: '#ffffff', ombre: '#3a4552' },
      or:      { nom: 'OR',      clair: '#fff7c9', moyen: '#e6b422', fonce: '#6b4a05', champ: ['#ffdf6b', '#a87408'], accent: '#ffe58a', etoile: '#fff3b0', ombre: '#4a3410' },
      diamant: { nom: 'DIAMANT', clair: '#ffffff', moyen: '#6fdcff', fonce: '#1f6f93', champ: ['#d4f8ff', '#4aa9cf'], accent: '#bff4ff', etoile: '#ffffff', ombre: '#1a4a63' }
    };
    function metalDe(n) { return n >= 100 ? 'diamant' : n >= 50 ? 'or' : n >= 30 ? 'argent' : 'bronze'; }
    function mixHex(a, b, t) { var p = function (h) { return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }, x = p(a), y = p(b); return '#' + x.map(function (v, i) { var c = Math.round(v + (y[i] - v) * t); return (c < 16 ? '0' : '') + c.toString(16); }).join(''); }
    // ce que la medaille gagne a la n-ieme campagne : { dot, etoile (1..5 ou 0), tier (nom du nouveau metal ou '') }
    function evenement(n) {
      var e = [1, 3, 5, 10, 20].indexOf(n);
      return { dot: n >= 1 && n <= 100, etoile: e + 1, tier: (n === 30 || n === 50 || n === 100) ? METAUX[metalDe(n)].nom : '' };
    }
    function svg(n, taille, petit, opt) {
      taille = taille || 150; n = Math.max(0, Math.floor(n));
      var id = 'md' + (window.__mdId = (window.__mdId || 0) + 1), M = METAUX[metalDe(n)], dia = metalDe(n) === 'diamant';
      var cx = 60, cy = 60, h = '', f1 = function (v) { return v.toFixed(1); };
      var pt = function (r, i, tot, dec) { var a = -Math.PI / 2 + (dec || 0) + 2 * Math.PI * i / tot; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
      var rp = petit ? 19 : 17;
      var T = !!(opt && opt.tips), esc2 = function (t) { return String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); };
      var ta = function (t, c) { return T ? ' data-tip="' + esc2(t) + '" data-tc="' + (c || M.accent) + '"' : ''; };
      var SEUIL = { bronze: 1, argent: 30, or: 50, diamant: 100 }, SUIV = { bronze: ['ARGENT', 30], argent: ['OR', 50], or: ['DIAMANT', 100] }, mk = metalDe(n);
      var tipMetal = 'MÉTAL : ' + M.nom + '\nAtteint à la ' + SEUIL[mk] + (SEUIL[mk] === 1 ? 're' : 'e') + ' campagne\n' + (SUIV[mk] ? 'Prochain métal : ' + SUIV[mk][0] + ' à ' + SUIV[mk][1] + ' campagnes (encore ' + (SUIV[mk][1] - n) + ')' : 'Dernier métal atteint : le compteur continue');
      h += '<defs><linearGradient id="' + id + 'g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + mixHex('#2a343f', M.moyen, .12) + '"/><stop offset=".55" stop-color="' + mixHex('#10161c', M.moyen, .08) + '"/><stop offset="1" stop-color="' + mixHex('#070a0e', M.fonce, .18) + '"/></linearGradient>'
        + '<linearGradient id="' + id + 'l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + M.clair + '"/><stop offset=".5" stop-color="' + M.moyen + '"/><stop offset="1" stop-color="' + M.fonce + '"/></linearGradient>'
        + '<clipPath id="' + id + 'c"><circle cx="60" cy="60" r="53"/></clipPath><clipPath id="' + id + 'p"><circle cx="60" cy="60" r="' + rp + '"/></clipPath>'
        + '<filter id="' + id + 'n" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency="0.015 0.85" numOctaves="2" seed="7"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1.3 0 0 0 -.45"/></filter></defs>';
      // anneau : metal « conique » (48 secteurs dont l\'eclat varie comme sur un metal poli) ; diamant : 16 facettes taillees
      var nb = dia ? 16 : 48;
      for (var i = 0; i < nb; i++) {
        var a0 = pt(54, i, nb), a1 = pt(54, i + 1, nb), b0 = pt(47, i, nb), b1 = pt(47, i + 1, nb);
        var t = dia ? (i % 2 ? 0.15 : 0.9) * (0.75 + 0.25 * Math.sin(i * 1.7)) : (Math.sin(i * 2 * Math.PI / 48 * 2 + 0.7) + 1) / 2 * (0.65 + 0.35 * Math.sin(i * 0.9 + 1));
        h += '<polygon points="' + f1(a0[0]) + ',' + f1(a0[1]) + ' ' + f1(a1[0]) + ',' + f1(a1[1]) + ' ' + f1(b1[0]) + ',' + f1(b1[1]) + ' ' + f1(b0[0]) + ',' + f1(b0[1]) + '" fill="' + mixHex(M.fonce, M.clair, t) + '"' + (dia ? ' stroke="rgba(255,255,255,.55)" stroke-width=".35"' : '') + ta(tipMetal + '\n(anneau extérieur)') + '/>';
      }
      h += '<circle cx="60" cy="60" r="54" fill="none" stroke="#000" stroke-opacity=".55" stroke-width=".8"/><circle cx="60" cy="60" r="47" fill="none" stroke="#000" stroke-opacity=".5" stroke-width=".9"/>';
      // champ de la medaille : metal poli, gravures concentriques
      h += '<circle cx="60" cy="60" r="46.5" fill="url(#' + id + 'g)"' + ta('CHAMP DE LA MÉDAILLE\n' + M.nom + ', poli et gravé.\nChaque graduation = une campagne aidée') + '/><circle cx="60" cy="60" r="45" fill="none" stroke="#000" stroke-opacity=".22" stroke-width=".6"/><circle cx="60" cy="60" r="43.6" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width=".5"/>';
      for (var q = 0; q < 3; q++) h += '<circle cx="60" cy="60" r="' + (22 + q * 7.5) + '" fill="none" stroke="#000" stroke-opacity=".08" stroke-width=".4"/>';
      if (!petit) { for (var sr = 10; sr < 46; sr += 0.85) h += '<circle cx="60" cy="60" r="' + sr.toFixed(2) + '" fill="none" stroke="' + (Math.round(sr * 10) % 2 ? '#fff' : '#000') + '" stroke-opacity="' + (Math.round(sr * 10) % 2 ? .05 : .12) + '" stroke-width=".32"/>'; }
      for (var w = 0; w < 72; w++) { var th0 = 2 * Math.PI * w / 72, th1 = 2 * Math.PI * (w + 1) / 72, tm = (th0 + th1) / 2, lob = Math.pow(Math.max(0, Math.cos(2 * (tm - 0.55))), 7), lob2 = Math.pow(Math.max(0, Math.cos(2 * (tm - 0.55) + 0.9)), 14);
        var p0 = [60 + 46 * Math.cos(th0 - Math.PI / 2), 60 + 46 * Math.sin(th0 - Math.PI / 2)], p1 = [60 + 46 * Math.cos(th1 - Math.PI / 2), 60 + 46 * Math.sin(th1 - Math.PI / 2)], q0 = [60 + 10 * Math.cos(th0 - Math.PI / 2), 60 + 10 * Math.sin(th0 - Math.PI / 2)], q1 = [60 + 10 * Math.cos(th1 - Math.PI / 2), 60 + 10 * Math.sin(th1 - Math.PI / 2)];
        var op = 0.30 * lob + 0.12 * lob2; if (op > 0.01) h += '<polygon points="' + f1(p0[0]) + ',' + f1(p0[1]) + ' ' + f1(p1[0]) + ',' + f1(p1[1]) + ' ' + f1(q1[0]) + ',' + f1(q1[1]) + ' ' + f1(q0[0]) + ',' + f1(q0[1]) + '" fill="' + mixHex('#ffffff', M.clair, .35) + '" opacity="' + op.toFixed(3) + '"/>'; }
      // graduations en relief (une par campagne) : anneau bronze (30), argent (20), or (50)
      var tier = ['bronze', 'argent', 'or', 'diamant'].indexOf(metalDe(n)), nbAn = Math.max(1, Math.min(tier + 1, 3));
      var rayons = nbAn === 1 ? [37] : nbAn === 2 ? [32, 38.5] : [30.5, 36, 41.5], rs = nbAn === 1 ? 28 : 25.5;
      var cfg = [[30, 0, 'bronze', 1.55], [20, 30, 'argent', 1.45], [50, 50, 'or', 1.05]];
      if (!petit) for (var r = 0; r < nbAn; r++) {
        var tot = cfg[r][0], deb = cfg[r][1], co = METAUX[cfg[r][2]];
        for (var k = 0; k < tot; k++) { var p = pt(rayons[r], k, tot), on = n - deb > k;
          var num = deb + k + 1, cp = opt && opt.camps && opt.camps[num - 1], tdot = 'CAMPAGNE N°' + num + '\n' + (on ? (cp ? cp.nom + '\n' + cp.hote + ' · ' + cp.date : 'Aidée') : 'Pas encore aidée' + (num === 30 && n < 30 ? '\nA cette graduation, la médaille devient ARGENT' : num === 50 && n < 50 ? '\nA cette graduation, la médaille devient OR' : ''));
          h += '<circle cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="' + (cfg[r][3] + .6) + '" fill="#000" opacity="' + (on ? .45 : .12) + '"/><circle cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="' + cfg[r][3] + '" fill="' + (on ? co.accent : mixHex(M.moyen, '#000000', .62)) + '"' + (on ? ' style="filter:drop-shadow(0 0 1.2px ' + co.accent + ')"' : '') + '/>' + (T ? '<circle cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="' + (cfg[r][3] + 1.7) + '" fill="transparent"' + ta(tdot, co.accent) + '/>' : ''); }
      }
      // etoiles (1, 3, 5, 10, 20)
      var seuils = [1, 3, 5, 10, 20], rsP = petit ? 34 : rs, sc = petit ? 0.6 : (nbAn > 1 ? 0.4 : 0.48);
      seuils.forEach(function (sv, i) { var p = pt(rsP, i, 5), on = n >= sv; h += '<g transform="translate(' + f1(p[0]) + ' ' + f1(p[1]) + ') scale(' + sc + ')"' + ta('ÉTOILE ' + (i + 1) + ' SUR 5\n' + (on ? 'Gagnée à la ' + sv + (sv === 1 ? 're' : 'e') + ' campagne' : 'À gagner à la ' + sv + 'e campagne (encore ' + (sv - n) + ')'), M.etoile) + '><circle r="17" fill="transparent"/><path d="M0 -10l3 6.4 7 .9-5.1 4.8 1.4 6.9L0 5.6l-6.3 3.4 1.4-6.9-5.1-4.8 7-.9z" fill="' + (on ? M.etoile : mixHex(M.moyen, '#000000', .6)) + '" stroke="' + (on ? M.fonce : 'none') + '" stroke-width=".9"' + (on ? ' style="filter:drop-shadow(0 0 2px ' + M.accent + ')"' : '') + '/></g>'; });
      // centre : le logo EDTEAM SCULPTE dans le metal, en relief (cuvette creusee, logo en bas-relief eclaire par la gauche, ombre portee)
      var rd = nbAn > 1 ? 19.5 : 21, lsc = nbAn > 1 ? 0.37 : 0.42, lx = 60 - 50 * lsc, ly = 60 - 50 * lsc;
      var logoPaths = '<polygon points="48,15 15,35 30,50 10,70 48,85 48,65 30,55 48,40"/><polygon points="52,15 85,35 70,50 90,70 52,85 52,65 70,55 52,40"/><polygon points="50,45 42,55 50,65 58,55"/>';
      h += '<defs><radialGradient id="' + id + 'k" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="' + mixHex(M.champ[1], '#000000', .55) + '"/><stop offset="1" stop-color="' + mixHex(M.champ[0], '#000000', .35) + '"/></radialGradient>'
        + '<filter id="' + id + 'e" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur in="SourceAlpha" stdDeviation="0.9" result="b"/>'
        + '<feDiffuseLighting in="b" surfaceScale="2.6" diffuseConstant="1.0" lighting-color="' + mixHex(M.moyen, M.clair, .35) + '" result="d"><feDistantLight azimuth="225" elevation="48"/></feDiffuseLighting><feComposite in="d" in2="SourceAlpha" operator="in" result="dd"/>'
        + '<feSpecularLighting in="b" surfaceScale="2.6" specularConstant="1.1" specularExponent="26" lighting-color="#ffffff" result="sp0"><feDistantLight azimuth="225" elevation="55"/></feSpecularLighting><feComposite in="sp0" in2="SourceAlpha" operator="in" result="sp"/>'
        + '<feMerge><feMergeNode in="dd"/><feMergeNode in="sp"/></feMerge></filter></defs>';
      // cuvette : le champ est creuse, avec un liseré et une ombre interieure
      h += '<circle cx="60" cy="60" r="' + (rd + 1.3) + '" fill="#fff" opacity=".35"' + ta('EMBLÈME EDTEAM\nSculpté en relief dans le métal de la médaille') + '/><circle cx="60" cy="60" r="' + rd + '" fill="url(#' + id + 'k)"/><circle cx="60" cy="60" r="' + rd + '" fill="none" stroke="#000" stroke-opacity=".6" stroke-width="1.2"/>';
      // ombre portee du relief (decalee en bas a droite), puis le logo eclaire
      h += '<g transform="translate(' + f1(lx + 0.9) + ' ' + f1(ly + 1.2) + ') scale(' + lsc + ')" fill="#000" opacity=".55">' + logoPaths + '</g>';
      h += '<g transform="translate(' + f1(lx) + ' ' + f1(ly) + ') scale(' + lsc + ')" fill="' + M.moyen + '"' + (petit ? '' : ' filter="url(#' + id + 'e)"') + ta('EMBLÈME EDTEAM\nSculpté en relief dans le métal de la médaille') + '>' + logoPaths + '</g>';
      if (petit) h += '<g transform="translate(' + f1(lx - 0.5) + ' ' + f1(ly - 0.6) + ') scale(' + lsc + ')" fill="none" stroke="' + M.clair + '" stroke-width="2.2" opacity=".7">' + logoPaths + '</g>';
      // reliefs : croissant de lumiere en haut a gauche, ombre en bas a droite
      h += '<path d="M' + f1(60 - 50) + ',' + f1(60 - 12) + ' A51,51 0 0 1 ' + f1(60 + 12) + ',' + f1(60 - 50) + '" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.8" stroke-linecap="round"/><path d="M' + f1(60 + 50) + ',' + f1(60 + 12) + ' A51,51 0 0 1 ' + f1(60 - 12) + ',' + f1(60 + 50) + '" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="1.8" stroke-linecap="round"/>';
      // reflet qui balaie la face
      h += '<g clip-path="url(#' + id + 'c)"><rect class="famsh" x="-40" y="-10" width="20" height="140" fill="#fff" opacity=".38" transform="rotate(20 60 60)"/></g>';
      // diamant : eclats qui scintillent
      if (dia && !petit) [[22, 24, 0], [96, 30, .7], [88, 92, 1.4], [28, 94, 2.1], [60, 8, 1.0]].forEach(function (e) { h += '<g class="fatw" style="animation-delay:' + e[2] + 's" transform="translate(' + e[0] + ' ' + e[1] + ')"><path d="M0 -6 L1.3 -1.3 L6 0 L1.3 1.3 L0 6 L-1.3 1.3 L-6 0 L-1.3 -1.3 Z" fill="#fff"/></g>'; });
      if (opt && opt.nouveau && !petit) {
        var D = 2.3, ev = evenement(n), ov = '', ring = n <= 30 ? 0 : n <= 50 ? 1 : 2, kk = n - cfg[ring][1] - 1;
        var burst = function (x, y, col, dist, nb2) {
          var o = '<circle class="fan-boom" cx="' + f1(x) + '" cy="' + f1(y) + '" r="2" fill="none" stroke="' + col + '" stroke-width="1.4" style="animation-delay:' + D + 's"/><circle class="fan-boom" cx="' + f1(x) + '" cy="' + f1(y) + '" r="2" fill="none" stroke="#fff" stroke-width="1" style="animation-delay:' + (D + .18) + 's"/>';
          for (var j = 0; j < nb2; j++) { var an = 2 * Math.PI * j / nb2 + .3, ds = dist * (.7 + .3 * ((j * 7) % 3) / 2); o += '<circle class="fan-p" cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + (j % 2 ? 1 : 1.5) + '" fill="' + (j % 2 ? '#fff' : col) + '" style="--dx:' + f1(ds * Math.cos(an)) + 'px;--dy:' + f1(ds * Math.sin(an)) + 'px;animation-delay:' + D + 's"/>'; }
          return o;
        };
        if (ev.tier) ov += '<circle class="fan-flash" cx="60" cy="60" r="54" fill="#fff" style="animation-delay:' + D + 's"/>';
        if (n <= 100 && kk >= 0 && kk < cfg[ring][0]) {
          var pd = pt(rayons[ring], kk, cfg[ring][0]), cd = METAUX[cfg[ring][2]].accent;
          ov += '<circle class="fan-new" cx="' + f1(pd[0]) + '" cy="' + f1(pd[1]) + '" r="' + (cfg[ring][3] + .4) + '" fill="#fff" style="animation-delay:' + D + 's;--c:' + cd + '"/>' + burst(pd[0], pd[1], cd, 15, 10);
        }
        var si = seuils.indexOf(n);
        if (si >= 0) {
          var ps = pt(rsP, si, 5);
          ov += '<g transform="translate(' + f1(ps[0]) + ' ' + f1(ps[1]) + ')"><g class="fan-star" style="animation-delay:' + (D + .35) + 's"><path transform="scale(' + sc + ')" d="M0 -10l3 6.4 7 .9-5.1 4.8 1.4 6.9L0 5.6l-6.3 3.4 1.4-6.9-5.1-4.8 7-.9z" fill="#fff" stroke="' + M.etoile + '" stroke-width="1.4"/></g></g>' + burst(ps[0], ps[1], M.etoile, 17, 12).replace(/animation-delay:' + D + 's/g, '');
        }
        h += ov;
      }
      return '<svg viewBox="0 0 120 120" width="' + taille + '" height="' + taille + '" style="display:block">' + h + '</svg>';
    }
    function html3D(n, taille, opt) {
      var T = taille || 140, ep = Math.max(5, Math.round(T / 16)), M = METAUX[metalDe(n)], cs = '';
      for (var i = -ep; i <= ep; i++) cs += '<i style="transform:translateZ(' + i + 'px)"></i>';
      var lueur = metalDe(n) === 'diamant' ? 'drop-shadow(0 0 14px rgba(150,235,255,.85))' : metalDe(n) === 'or' ? 'drop-shadow(0 0 10px rgba(255,210,74,.55))' : 'drop-shadow(0 6px 10px rgba(0,0,0,.6))';
      return '<div class="fam3" style="width:' + T + 'px;height:' + T + 'px;filter:' + lueur + '"><div class="fam3d" style="--e1:' + M.clair + ';--e2:' + M.moyen + ';--e3:' + M.fonce + '">' + cs
        + (opt && opt.nouveau ? '<div class="fam3f fan-av" style="transform:translateZ(' + (ep + 1) + 'px)">' + svg(Math.max(0, n - 1), T, false, { tips: opt.tips }) + '</div><div class="fam3f fan-ap" style="transform:translateZ(' + (ep + 1) + 'px)">' + svg(n, T, false, opt) + '</div>'
          : '<div class="fam3f" style="transform:translateZ(' + (ep + 1) + 'px)">' + svg(n, T, false, opt) + '</div>')
        + '<div class="fam3b" style="transform:rotateY(180deg) translateZ(' + (ep + 1) + 'px);--e1:' + M.clair + ';--e2:' + M.moyen + ';--e3:' + M.fonce + '"><span>FRÈRES<br>D’ARMES<br><b>' + n + '</b><br><em>' + M.nom + '</em></span></div></div></div>';
    }

    var nbEtoiles = function (n) { return (n >= 1 ? 1 : 0) + (n >= 3 ? 1 : 0) + (n >= 5 ? 1 : 0) + (n >= 10 ? 1 : 0) + (n >= 20 ? 1 : 0); };
    var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

    // ---------- styles (noms prefixes fa- : aucun conflit avec les pages) ----------
    var CSS = ''
        + '.fam3 { perspective:1800px; margin:0 auto; } .fam3d { position:relative; width:100%; height:100%; transform-style:preserve-3d; animation:fam3tourne 7s ease-in-out infinite; }'
        + '.fam3d i { position:absolute; inset:2.5%; border-radius:50%; background:conic-gradient(from 30deg,var(--e1),var(--e3),var(--e2),var(--e1),var(--e3),var(--e2),var(--e1)); }'
        + '.fam3f, .fam3b { position:absolute; inset:0; backface-visibility:hidden; -webkit-backface-visibility:hidden; border-radius:50%; }'
        + '.fam3b { background:conic-gradient(from 30deg,var(--e1),var(--e2),var(--e3),var(--e1),var(--e2),var(--e3),var(--e1)); display:grid; place-items:center; text-align:center; color:#2a1a00; font-size:11px; letter-spacing:2px; line-height:1.5; font-weight:bold; box-shadow:inset 0 0 0 6px rgba(255,255,255,.2),inset 0 0 22px rgba(0,0,0,.35); text-shadow:0 1px 0 rgba(255,255,255,.35); }'
        + '.fam3b em { font-style:normal; font-size:9px; letter-spacing:3px; opacity:.8; } .fam3b b { font-size:22px; letter-spacing:1px; }'
        + '@keyframes fam3tourne { 0%,100% { transform:rotateY(-26deg) rotateX(7deg); } 50% { transform:rotateY(26deg) rotateX(-5deg); } }'
        + '.famsh { animation:famsh 4.2s ease-in-out infinite; } @keyframes famsh { 0%,55% { transform:translateX(0) rotate(20deg); } 100% { transform:translateX(190px) rotate(20deg); } }'
        + '.fatw { animation:fatw 2.2s ease-in-out infinite; transform-box:fill-box; transform-origin:center; opacity:0; } @keyframes fatw { 0%,100% { opacity:0; transform:scale(.3) rotate(0); } 50% { opacity:1; transform:scale(1) rotate(45deg); } }'
        + '@media (prefers-reduced-motion:reduce) { .fam3d { animation:none; transform:rotateY(-14deg) rotateX(5deg); } .famsh { animation:none; opacity:0; } .fatw { animation:none; opacity:.8; } }'
        + '.fa-anim { display:inline-block; transform-origin:50% 50%; animation:faGrossit 1.5s .6s cubic-bezier(.2,.8,.2,1) both; }'
        + '@keyframes faGrossit { 0% { transform:scale(1); } 100% { transform:scale(1.3); } }'
        + '.fa-anim .fam3d { animation:fam3tourneb 7s ease-in-out 4.6s infinite; }'
        + '@keyframes fam3tourneb { 0%,100% { transform:rotateY(0) rotateX(0); } 25% { transform:rotateY(26deg) rotateX(-5deg); } 75% { transform:rotateY(-26deg) rotateX(7deg); } }'
        + '.fan-av { animation:fanAv .3s 2.25s both; } .fan-ap { animation:fanAp .3s 2.25s both; } @keyframes fanAv { to { opacity:0; } } @keyframes fanAp { from { opacity:0; } to { opacity:1; } }'
        + '.fan-new, .fan-star, .fan-boom, .fan-p, .fan-flash { transform-box:fill-box; transform-origin:center; opacity:0; animation-fill-mode:both; }'
        + '.fan-new { animation:fanNew 1.3s ease-out both, fanPulse 1.1s ease-in-out 3.7s 3; }'
        + '@keyframes fanNew { 0% { opacity:1; transform:scale(.2); fill:#fff; } 25% { opacity:1; transform:scale(3.4); fill:#fff; } 60% { opacity:1; transform:scale(1.8); fill:var(--c); } 100% { opacity:1; transform:scale(1.5); fill:var(--c); } }'
        + '@keyframes fanPulse { 0%,100% { transform:scale(1.5); } 50% { transform:scale(2.1); } }'
        + '.fan-star { animation:fanStar 1.5s ease-out both; } @keyframes fanStar { 0% { opacity:1; transform:scale(.1) rotate(-90deg); } 35% { opacity:1; transform:scale(2.6) rotate(0); } 70% { opacity:1; transform:scale(1.5); } 100% { opacity:.0; transform:scale(1.3); } }'
        + '.fan-boom { animation:fanBoom 1.1s ease-out both; } @keyframes fanBoom { 0% { opacity:.95; transform:scale(.6); } 100% { opacity:0; transform:scale(8); } }'
        + '.fan-p { animation:fanP 1.2s ease-out both; } @keyframes fanP { 0% { opacity:1; transform:translate(0,0) scale(1); } 100% { opacity:0; transform:translate(var(--dx),var(--dy)) scale(.2); } }'
        + '.fan-flash { animation:fanFlash 1.2s ease-out both; } @keyframes fanFlash { 0% { opacity:.95; } 100% { opacity:0; } }'
        + '.fan-lbl { opacity:0; animation:fanLbl .7s 2.7s ease-out both; margin-top:6px; padding:5px 12px; display:inline-block; border:1px solid #FFD24A; background:rgba(255,210,74,.12); color:#FFD24A; font-size:12px; font-weight:bold; letter-spacing:2px; white-space:nowrap; box-shadow:0 0 18px rgba(255,210,74,.4); } @keyframes fanLbl { from { opacity:0; transform:translateY(8px) scale(.9); } to { opacity:1; transform:none; } }'
        + '@media (prefers-reduced-motion:reduce) { .fa-anim, .fa-anim .fam3d, .fan-av, .fan-ap, .fan-lbl { animation:none; } .fa-anim { transform:scale(1.15); } .fan-av { opacity:0; } .fan-lbl { opacity:1; } .fan-new, .fan-star, .fan-boom, .fan-p, .fan-flash { display:none; } }'
        + '[data-fa-loupe] { cursor:zoom-in; }'
        // loupe
        + '.fal-fond { position:fixed; inset:0; background:rgba(0,0,0,.82); display:flex; align-items:center; justify-content:center; z-index:9000; padding:14px; font-family:"Share Tech Mono",Consolas,monospace; }'
        + '.fal { position:relative; background:rgba(6,9,13,.98); border:1px solid #FFD24A; box-shadow:0 0 44px rgba(255,210,74,.18); padding:20px 22px 18px; text-align:center; color:#ccc; max-width:100%; }'
        + '.fal-x { position:absolute; right:16px; top:12px; color:#FFD24A; cursor:pointer; font-size:14px; } .fal-k { color:#9a8a55; font-size:10px; letter-spacing:5px; } .fal h3 { margin:6px 0 4px; color:#fff; font-size:17px; letter-spacing:3px; font-weight:normal; } .fal-s { color:#8b97a0; font-size:12px; margin-bottom:6px; }'
        + '.fal-scene { position:relative; margin:14px auto 22px; } .fal-scene .fam3 { perspective:1800px; } .fal-scene .fam3d { animation:fal-oscille 8s ease-in-out infinite; } .fal-scene:hover .fam3d { animation-play-state:paused; }'
        + '@keyframes fal-oscille { 0%,100% { transform:rotateY(-18deg) rotateX(5deg); } 50% { transform:rotateY(18deg) rotateX(-4deg); } }'
        + '.fal.retourne .fam3d { animation:none; transform:rotateY(168deg) rotateX(4deg); transition:transform .8s; }'
        + '.fal svg * { pointer-events:none; } .fal svg [data-tip], .fal svg [data-tip] * { pointer-events:all; } .fal svg [data-tip] { cursor:help; }'
        + '.fal-barre { display:flex; gap:8px; justify-content:center; margin:10px 0 4px; } .fal-barre button { background:transparent; border:1px solid #555; color:#bbb; font:inherit; font-size:11px; letter-spacing:2px; padding:7px 12px; cursor:pointer; } .fal-barre button:hover { border-color:#FFD24A; color:#FFD24A; }'
        + '.fal-info { display:none; border:1px solid #1d2a33; background:#0a1017; padding:9px 12px; font-size:12px; color:#9aa8b2; line-height:1.55; text-align:left; height:104px; overflow:auto; } .fal-info b { display:block; letter-spacing:2px; margin-bottom:3px; }'
        + '@media (pointer:coarse) { .fal-info { display:block; } }'
        + '#fal-tip { position:fixed; z-index:9100; pointer-events:none; display:none; max-width:300px; background:rgba(6,10,14,.97); border:1px solid var(--c,#FFD24A); padding:9px 12px; font-size:12px; color:#ddd; line-height:1.5; box-shadow:0 0 16px rgba(0,0,0,.7); white-space:pre-line; font-family:"Share Tech Mono",Consolas,monospace; } #fal-tip b { display:block; color:var(--c,#FFD24A); letter-spacing:2px; margin-bottom:3px; }';
    function css() { if (document.getElementById('edteam-medaille-css')) return; var s = document.createElement('style'); s.id = 'edteam-medaille-css'; s.textContent = CSS; document.head.appendChild(s); }

    // ---------- la loupe ----------
    var LP = null, tipT = null, ecoute = false;
    function tailleLoupe() { return Math.max(230, Math.min(440, innerHeight - 330, innerWidth - 130)); }
    function lignes(t) { var l = String(t).split('\n'); return { titre: l[0], reste: l.slice(1) }; }
    function masquerTip(vite) {
        var t = document.getElementById('fal-tip'); if (!t) return;
        if (vite) { clearTimeout(tipT); tipT = null; t.style.display = 'none'; if (LP) LP.dernier = null; return; }
        if (tipT) return;
        tipT = setTimeout(function () { tipT = null; t.style.display = 'none'; if (LP) LP.dernier = null; }, 250);
    }
    function placerTip(e) { var t = document.getElementById('fal-tip'); if (!t) return; t.style.left = Math.max(8, Math.min(e.clientX + 16, innerWidth - t.offsetWidth - 8)) + 'px'; t.style.top = Math.min(e.clientY + 16, innerHeight - t.offsetHeight - 8) + 'px'; }
    function montrerTip(e, el) {
        var t = document.getElementById('fal-tip'); if (!t) return; clearTimeout(tipT); tipT = null;
        var c = el.getAttribute('data-tc') || '#FFD24A', l = lignes(el.getAttribute('data-tip'));
        t.style.setProperty('--c', c); t.innerHTML = '<b>' + esc(l.titre) + '</b>' + esc(l.reste.join('\n')); t.style.display = 'block'; placerTip(e);
        var info = document.querySelector('#fal .fal-info'); if (info) info.innerHTML = '<b style="color:' + c + '">' + esc(l.titre) + '</b>' + l.reste.map(esc).join('<br>');
    }
    function dessiner() {
        if (!LP) return;
        var o = LP.o, n = LP.n, M = METAUX[metalDe(n)], T = tailleLoupe(), f = document.getElementById('fal'), sc = document.querySelector('#fal .fal-scene');
        f.style.width = Math.min(T + 90, innerWidth - 24) + 'px';
        sc.style.width = T + 'px'; sc.style.height = T + 'px';
        sc.innerHTML = html3D(n, T, { tips: true, camps: o.camps || null });
        f.querySelector('h3').textContent = (o.titre || 'MA MÉDAILLE') + ' · ' + M.nom;
        f.querySelector('.fal-s').textContent = o.sous || (n + ' campagne' + (n > 1 ? 's' : '') + ' alliée' + (n > 1 ? 's' : '') + ' aidée' + (n > 1 ? 's' : ''));
    }
    function fermerLoupe() {
        masquerTip(true);
        var f = document.getElementById('fal-fond'); if (f) f.remove();
        var t = document.getElementById('fal-tip'); if (t) t.remove();
        LP = null;
    }
    function ouvrirLoupe(n, o) {
        css(); fermerLoupe();
        n = Math.max(0, Math.floor(Number(n) || 0)); o = o || {};
        var fond = document.createElement('div'); fond.id = 'fal-fond'; fond.className = 'fal-fond';
        fond.innerHTML = '<div class="fal" id="fal"><span class="fal-x" data-fal-x>X</span><div class="fal-k">FRÈRES D’ARMES</div><h3></h3><div class="fal-s"></div><div class="fal-scene"></div>'
            + '<div class="fal-barre"><button type="button" data-fal-ret>↻ RETOURNER</button></div><div class="fal-info"><b>TOUCHEZ UN ÉLÉMENT</b>Une graduation, une étoile, l’anneau, le champ ou le logo.</div></div>';
        document.body.appendChild(fond);
        var tip = document.createElement('div'); tip.id = 'fal-tip'; document.body.appendChild(tip);
        LP = { n: n, o: o, dernier: null };
        fond.addEventListener('click', function (e) {
            if (e.target === fond || e.target.closest('[data-fal-x]')) return fermerLoupe();
            if (e.target.closest('[data-fal-ret]')) { document.getElementById('fal').classList.toggle('retourne'); return; }
            var el = e.target.closest && e.target.closest('[data-tip]'); if (el) montrerTip(e, el);       // toucher (pas de survol)
        });
        fond.addEventListener('mousemove', function (e) {
            var el = e.target.closest && e.target.closest('[data-tip]');
            if (el) { if (el !== LP.dernier) { LP.dernier = el; montrerTip(e, el); } else { clearTimeout(tipT); tipT = null; placerTip(e); } }
            else masquerTip(!(e.target.closest && e.target.closest('.fal-scene')));
        });
        fond.addEventListener('mouseleave', function () { masquerTip(true); });
        if (!ecoute) {
            ecoute = true;
            document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && LP) fermerLoupe(); });
            var rz = null; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (LP) dessiner(); }, 150); });
        }
        dessiner();
    }

    // ---------- clic sur n'importe quelle medaille du site ----------
    // window.EdteamMedaille.fournisseur(moi) peut etre fourni par freres-armes.js : rend { n, titre, sous, camps } pour la medaille du pilote connecte
    document.addEventListener('click', function (e) {
        var m = e.target.closest && e.target.closest('[data-fa-loupe]'); if (!m || m.closest('#fal-fond')) return;
        e.stopPropagation();
        var n = Number(m.getAttribute('data-fa-loupe')) || 0, opt = { titre: m.getAttribute('data-fa-titre') || undefined, sous: m.getAttribute('data-fa-sous') || undefined };
        if (m.getAttribute('data-fa-moi') === '1' && typeof window.EdteamMedaille.fournisseur === 'function') { try { var r = window.EdteamMedaille.fournisseur(true); if (r) { n = r.n; opt = r; } } catch (x) { /* detail indisponible : structure seulement */ } }
        ouvrirLoupe(n, opt);
    }, true);

    // petite medaille 2D cliquable (en-tete, listes, bulles)
    function petite(n, taille, attrs) { css(); return '<span class="fa-pt" ' + (attrs || '') + ' data-fa-loupe="' + n + '" style="display:inline-block;line-height:0;" title="Frères d’armes : ' + n + ' campagne' + (n > 1 ? 's' : '') + '">' + svg(n, taille || 28, true) + '</span>'; }

    window.EdteamMedaille = { evenement: evenement, svg: function (n, t, p, o) { css(); return svg(n, t, p, o); }, html3D: function (n, t, o) { css(); return html3D(n, t, o); }, petite: petite, loupe: ouvrirLoupe, fermer: fermerLoupe, metal: metalDe, etoiles: nbEtoiles, METAUX: METAUX, css: css, fournisseur: null };
})();
