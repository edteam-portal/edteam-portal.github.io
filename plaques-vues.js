// Plaques de campagne déjà montrées au pilote (sur CET appareil). Partagé par bgs.html (révélation plein écran) et index.html (carte d'avertissement du QG).
// Les plaques viennent de profils.palmares_bgs ; une plaque est identifiée par l'identifiant de son ordre (à défaut : système + date de clôture + type).
// Sans souvenir (premier passage, nouvel appareil, navigateur nettoyé), on ne rejoue PAS tout l'historique : seules les plaques clôturées dans les 14 derniers jours sont proposées.
(function () {
    'use strict';
    var PREFIXE = 'edteam_plaques_vues_';
    var JOURS_SANS_SOUVENIR = 14;

    function cle(m) {
        if (!m) return '';
        return m.ordre_id !== undefined && m.ordre_id !== null ? 'o' + m.ordre_id : [m.systeme, m.date_cloture, m.type_ordre].join('|');
    }
    function lire(uid) {
        try { var v = JSON.parse(localStorage.getItem(PREFIXE + uid) || 'null'); return Array.isArray(v) ? v : null; } catch (e) { return null; }
    }
    function ecrire(uid, liste) {
        try { localStorage.setItem(PREFIXE + uid, JSON.stringify(liste.slice(-300))); } catch (e) { /* stockage indisponible : la révélation pourra se rejouer, sans conséquence */ }
    }

    window.edteamPlaques = {
        cle: cle,
        // plaques pas encore montrées à ce pilote, de la plus ancienne à la plus récente
        nouvelles: function (uid, palmares) {
            var liste = Array.isArray(palmares) ? palmares : [];
            var vues = lire(uid);
            var nouvelles;
            if (vues === null) {
                var limite = Date.now() - JOURS_SANS_SOUVENIR * 86400000, anciennes = [];
                nouvelles = [];
                liste.forEach(function (m) {
                    var t = Date.parse(m.date_cloture);
                    if (isNaN(t) || t < limite) anciennes.push(cle(m)); else nouvelles.push(m);
                });
                ecrire(uid, anciennes);   // les plus anciennes sont considérées comme déjà vues
            } else {
                nouvelles = liste.filter(function (m) { return vues.indexOf(cle(m)) < 0; });
            }
            return nouvelles.sort(function (a, b) { return String(a.date_cloture || '').localeCompare(String(b.date_cloture || '')) || (Number(a.rang) || 99) - (Number(b.rang) || 99); });
        },
        marquerVues: function (uid, plaques) {
            var vues = lire(uid) || [];
            (plaques || []).forEach(function (m) { var k = cle(m); if (vues.indexOf(k) < 0) vues.push(k); });
            ecrire(uid, vues);
        }
    };

    // ---------------------------------------------------------------------------------------------------------------
    // Titres de spécialiste déjà montrés au pilote (sur CET appareil). Même principe que les plaques.
    // Un titre est identifié par son code ET sa date de prise (depuis) : le perdre puis le reprendre le fait réapparaître.
    // Sans souvenir (premier passage, nouvel appareil), seuls les titres pris dans les 14 derniers jours sont proposés.
    // ---------------------------------------------------------------------------------------------------------------
    var PREFIXE_T = 'edteam_titres_vus_';
    function cleT(code, r) { return code + '|' + (r && r.depuis ? r.depuis : ''); }
    function lireT(uid) {
        try { var v = JSON.parse(localStorage.getItem(PREFIXE_T + uid) || 'null'); return Array.isArray(v) ? v : null; } catch (e) { return null; }
    }
    function ecrireT(uid, liste) {
        try { localStorage.setItem(PREFIXE_T + uid, JSON.stringify(liste.slice(-100))); } catch (e) { /* stockage indisponible : la révélation pourra se rejouer, sans conséquence */ }
    }

    window.edteamTitres = {
        // titres détenus par ce pilote et pas encore montrés : [{ code, depuis, ... }], du plus ancien au plus récent. `titres` : { CODE: ligne de titres_specialistes }
        nouveaux: function (uid, titres) {
            var detenus = [];
            Object.keys(titres || {}).forEach(function (code) {
                var r = titres[code];
                if (r && String(r.user_id) === String(uid)) detenus.push(Object.assign({ code: code }, r));
            });
            var vus = lireT(uid), nouveaux;
            if (vus === null) {
                var limite = Date.now() - JOURS_SANS_SOUVENIR * 86400000, anciens = [];
                nouveaux = [];
                detenus.forEach(function (t) {
                    var d = Date.parse(t.depuis);
                    if (isNaN(d) || d < limite) anciens.push(cleT(t.code, t)); else nouveaux.push(t);
                });
                ecrireT(uid, anciens);
            } else {
                nouveaux = detenus.filter(function (t) { return vus.indexOf(cleT(t.code, t)) < 0; });
            }
            return nouveaux.sort(function (a, b) { return String(a.depuis || '').localeCompare(String(b.depuis || '')); });
        },
        marquerVus: function (uid, liste) {
            var vus = lireT(uid) || [];
            (liste || []).forEach(function (t) { var k = cleT(t.code, t); if (vus.indexOf(k) < 0) vus.push(k); });
            ecrireT(uid, vus);
        }
    };
})();
