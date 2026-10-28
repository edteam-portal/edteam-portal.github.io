// SAS DE SECURITE : navigation entre les 4 etapes (EDMC, plugin, cle, jeu). Les etapes 1 a 3 sont confirmees par le pilote (le site ne peut pas les verifier) ;
// l'etape 4 se valide toute seule quand le nom de commandant arrive (sasLoop, dans qg.html). Progression memorisee dans le navigateur, par pilote.
(function () {
    'use strict';
    var CLE = 'edteam_sas_etapes_', uid = 'anonyme', faites = [], courante = 1;

    function lire() { try { var v = JSON.parse(localStorage.getItem(CLE + uid) || 'null'); if (v && Array.isArray(v.f)) faites = v.f.filter(function (n) { return n >= 1 && n <= 3; }); } catch (e) { /* stockage indisponible */ } }
    function ecrire() { try { localStorage.setItem(CLE + uid, JSON.stringify({ f: faites })); } catch (e) { /* stockage indisponible */ } }

    function maj() {
        var etapes = document.querySelectorAll('.sas-etape'), pts = document.querySelectorAll('.sas-pt');
        Array.prototype.forEach.call(etapes, function (e) { e.style.display = Number(e.getAttribute('data-n')) === courante ? 'grid' : 'none'; });
        Array.prototype.forEach.call(pts, function (p) {
            var n = Number(p.getAttribute('data-n'));
            p.className = 'sas-pt' + (faites.indexOf(n) >= 0 ? ' fait' : '') + (n === courante ? ' cour' : '');
            var rond = p.querySelector('.sas-rond'); if (rond) rond.textContent = faites.indexOf(n) >= 0 ? '✓' : String(n);
        });
    }

    window.sasInitEtapes = function (u) {
        uid = u || 'anonyme'; faites = []; lire();
        courante = 1; for (var n = 1; n <= 3; n++) { if (faites.indexOf(n) < 0) { courante = n; break; } courante = n + 1; }
        maj();
    };
    window.sasEtape = function (n) { if (typeof sonClic === 'function') sonClic(); courante = Math.max(1, Math.min(4, Number(n) || 1)); maj(); };
    window.sasFait = function (n) {
        if (typeof sonClic === 'function') sonClic();
        if (faites.indexOf(n) < 0) faites.push(n); ecrire();
        courante = Math.min(4, n + 1); maj();
    };
})();
