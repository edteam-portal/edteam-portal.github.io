// MISSIONS POWERPLAY (page BGS) : lignes dans les campagnes, fenetre d'une mission, cartes des initiatives, formulaires du commandement et des pilotes.
// Donnees : fonction serveur pp_missions_vue() (script SQL 96), missions creees par creer_mission_pp (commandement) ou lancer_initiative_pp / proposer_initiative_pp (pilotes, script SQL 97).
// Regles : un pilote d'un escadron SANS puissance voit les missions grisees (cadenas) et ne peut pas les ouvrir. Les « CP » sont une ESTIMATION (merites / 4) : le taux n'est pas confirme par le jeu.
// L'etat d'un systeme (controle, progression) vient des journaux de jeu des pilotes de l'escadron : « observe il y a X ». La barre a 4 zones et ses deux curseurs : voir pp-etat.js (regles mesurees le 22/10).
(function () {
    'use strict';
    var PPC = '#8A7CFF';
    var TYPE = { RENFORCEMENT: ['Renforcement', '#00FF66'], SAPE: ['Sape', '#FF3333'], ACQUISITION: ['Acquisition', '#EDEDED'] };
    var ETAT = { Exploited: 'Exploité', Fortified: 'Consolidé', Stronghold: 'Défendu', Unoccupied: 'Inoccupé' };
    var ORIGINE = { PRIMES: 'Primes', COMBAT: 'Combat', MISSIONS: 'Missions', LIVRAISONS: 'Livraisons Powerplay', COMMERCE: 'Commerce', EXPLORATION: 'Exploration', SAUVETAGE: 'Sauvetage', COMMUNAUTE: 'Objectif communautaire', AUTRE: 'Non identifiée' };
    var esc = function (s) { return typeof window.escapeHtml === 'function' ? window.escapeHtml(String(s == null ? '' : s)) : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
    var db = function () { return window.supabaseApp; };
    var moi = function () { return window.profilCommandant || {}; };
    var estCmd = function () { var m = moi(); return !!(m.est_amiral || m.est_officier || m.est_directeur); };
    var fmt = function (n) { return Number(n || 0).toLocaleString('fr-FR'); };
    var cp = function (m) { return Math.round(Number(m || 0) / 4); };
    var vue = null, domCmd = 'BGS', domIni = 'BGS', typeCmd = 'RENFORCEMENT', typeIni = 'RENFORCEMENT';

    function pastille(txt, col) { return '<span class="camp-pastille" style="color:' + col + '; border-color:' + col + '; background:' + col + '1a;">' + txt + '</span>'; }
    function barre(pct, col, txt, h) { pct = Math.max(0, Math.min(100, Number(pct) || 0)); h = h || 16; if (/^#[0-9a-f]{3}$/i.test(col)) col = '#' + col.charAt(1) + col.charAt(1) + col.charAt(2) + col.charAt(2) + col.charAt(3) + col.charAt(3); return '<div style="position:relative; height:' + h + 'px; background:#111; border:1px solid #333; border-radius:2px; overflow:hidden;"><div style="width:' + pct + '%; height:100%; background:linear-gradient(90deg,' + col + '55,' + col + ');"></div><span style="position:absolute; inset:0; font-size:.7em; color:#fff; text-align:center; line-height:' + h + 'px; letter-spacing:1px; text-shadow:0 0 3px #000;">' + txt + '</span></div>'; }
    function age(iso) { if (!iso) return ''; var h = (Date.now() - new Date(iso).getTime()) / 3600000; if (h < 1) return 'il y a ' + Math.max(1, Math.round(h * 60)) + ' min'; if (h < 48) return 'il y a ' + Math.round(h) + ' h'; return 'il y a ' + Math.round(h / 24) + ' j'; }
    function prochainReleve() {
        var n = new Date(), d = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate(), 7, 0, 0));
        while (d.getUTCDay() !== 4 || d.getTime() <= n.getTime()) d.setUTCDate(d.getUTCDate() + 1);
        var ms = d.getTime() - n.getTime(), j = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000);
        return 'jeudi 07:00 UTC (dans ' + j + ' j ' + h + ' h)';
    }
    function aPuissance() { return !!(vue && vue.puissance); }
    function pctControle(m) { return m.etat && m.etat.progres != null ? Math.round(Number(m.etat.progres) * 100) : null; }
    function trouver(id) { return ((vue && vue.missions) || []).filter(function (m) { return String(m.id) === String(id); })[0] || null; }
    function nomCampagne(id) { var c = (window.cacheCampagnes || []).filter(function (x) { return String(x.id) === String(id); })[0]; return c ? c.nom : null; }

    var API = {
        // une lecture, partagee par toute la page (un seul appel serveur)
        lire: async function () {
            try {
                var r = await db().rpc('pp_missions_vue');
                if (r.error) { console.error('Erreur missions Powerplay :', r.error.message); vue = null; }
                else vue = r.data || null;
            } catch (e) { console.error(e); vue = null; }
            window.cachePP = vue;
            return vue;
        },
        vue: function () { return vue; },

        // lignes d'une campagne (format de campagnes.js)
        lignes: function (campagneId) {
            var E = window.EdteamPPEtat;
            return ((vue && vue.missions) || []).filter(function (m) { return m.origine === 'AMIRAL' && String(m.campagne_id) === String(campagneId); }).map(function (m) {
                var t = TYPE[m.type_pp] || [m.type_pp, '#aaa'], gris = !aPuissance();
                // acquisition : le sens du mouvement n'est pas etabli (systeme sans controle) ; pas de couleur de resultat
                var c = E && !gris && m.type_pp !== 'ACQUISITION' ? E.calc(m) : null;
                var observe = m.etat ? '<span style="color:#9ab; font-size:.78em; letter-spacing:1px; text-transform:uppercase;">' + (ETAT[m.etat.etat] || esc(m.etat.etat || 'sans état')) + '</span>' : '<span style="color:#888; font-size:.78em;">pas encore observé</span>';
                var merites = gris ? '' : '<span class="qj-c2" style="justify-content:flex-end; color:#aaa; font-size:.85em;" title="Mérites de l\'escadron sur ce système">' + fmt(m.merites_total) + ' mérites</span>';
                var ligne = { sys: String(m.systeme || '').toUpperCase(), tag: 'PP #' + m.id + ' - ' + t[0].toUpperCase(), domaine: 'PP', id: m.id, couleur: PPC, gris: gris, pct: null, vous: null,
                    avatars: gris ? '' : (window.edteamCampagnes ? window.edteamCampagnes.avatars((m.pilotes || []).map(function (x) { return { u: x.u, nom: x.nom }; })) : ''),
                    legendeTitre: 'État du système observé par un pilote de l\'escadron (journal de jeu)', clic: 'edteamCampagnesPP.ouvrir(' + m.id + ')', titre: 'Rejoignez une puissance (Powerplay) pour participer à cette mission',
                    infoE: gris ? '' : (c ? E.resume(c) : observe), infoM: merites,
                    texte: '<b>' + esc(String(m.systeme).toUpperCase()) + '</b>' + (m.etat && m.etat.controlling ? ' <em>· ' + esc(m.etat.controlling.toUpperCase()) + '</em>' : '') };
                ligne.info = ligne.infoE + ligne.infoM;
                if (c) { ligne.sig = { sens: c.sens, pale: c.pale }; ligne.jauge = E.barre(c, false); }
                return ligne;
            });
        },

        // cartes des initiatives Powerplay (style des initiatives, a ajouter dans la grille des initiatives) ; chaine vide s'il n'y en a pas
        cartesInitiatives: function () {
            var gris = !aPuissance(), cmd = estCmd(), m0 = moi();
            return ((vue && vue.missions) || []).filter(function (m) { return m.origine === 'PILOTE'; }).map(function (m) {
                var t = TYPE[m.type_pp] || [m.type_pp, '#aaa'], pc = pctControle(m), estCrea = String(m.auteur_id) === String(m0.user_id);
                var restant = m.expire_le ? Math.ceil((new Date(m.expire_le).getTime() - Date.now()) / 86400000) : null;
                var actions = (cmd ? '<button class="ini-btn" onclick="event.stopPropagation(); edteamCampagnesPP.adopter(' + m.id + ')">TRANSFORMER EN MISSION</button><button class="ini-btn gris" onclick="event.stopPropagation(); edteamCampagnesPP.cloturer(' + m.id + ', false)">RETIRER</button>'
                    : (estCrea ? '<button class="ini-btn gris" onclick="event.stopPropagation(); edteamCampagnesPP.cloturer(' + m.id + ', true)">CLÔTURER</button>' : ''));
                return '<div class="data-row bloc init" style="padding:14px 18px; display:flex; flex-direction:column; gap:9px; cursor:' + (gris ? 'not-allowed' : 'pointer') + ';' + (gris ? ' opacity:.45; filter:grayscale(1);' : '') + '"'
                    + (gris ? ' title="Rejoignez une puissance (Powerplay) pour participer à cette initiative"' : ' onclick="edteamCampagnesPP.ouvrir(' + m.id + ')"') + '>'
                    + '<div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">' + pastille('POWERPLAY', PPC) + pastille(t[0].toUpperCase(), t[1]) + '<span style="flex:1;"></span>'
                    + '<span style="color:#FF4FD8; font-size:.78em; letter-spacing:1px;">' + (gris ? '🔒 ' : '') + '★ INITIATIVE · CMDR ' + esc(String(m.createur || 'inconnu').toUpperCase()) + '</span></div>'
                    + '<div style="font-size:1.05em; color:#fff; font-weight:bold; letter-spacing:1px;">' + esc(String(m.systeme).toUpperCase()) + (m.etat && m.etat.controlling ? ' <span style="color:#888; font-weight:normal; font-size:.8em;">· ' + esc(m.etat.controlling) + (m.etat.etat ? ' · ' + (ETAT[m.etat.etat] || esc(m.etat.etat)) : '') + '</span>' : '') + '</div>'
                    + barre(pc || 0, PPC, pc == null ? 'système pas encore observé' : 'contrôle ' + pc + ' %')
                    + (gris ? '' : '<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; text-align:center;">'
                        + '<div style="border:1px dashed #333; padding:6px;"><div style="color:#888; font-size:.7em;">MÉRITES ÉQUIPE</div><b style="color:#fff;">' + fmt(m.merites_total) + '</b></div>'
                        + '<div style="border:1px dashed #333; padding:6px;"><div style="color:#888; font-size:.7em;">CP ESTIMÉS</div><b style="color:' + PPC + ';">≈ ' + fmt(cp(m.merites_total)) + '</b></div>'
                        + '<div style="border:1px dashed #333; padding:6px;"><div style="color:#888; font-size:.7em;">PILOTES</div><b style="color:#fff;">' + (m.nb_pilotes || 0) + '</b></div></div>')
                    + '<div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; color:#888; font-size:.78em;">' + (gris ? 'Il faut avoir rejoint une puissance pour participer.' : 'Mon apport : <b style="color:#fff;">' + fmt(m.merites_moi) + ' mérites</b> (≈ ' + fmt(cp(m.merites_moi)) + ' CP)')
                    + (restant == null ? '' : '<span style="margin-left:auto;">⏳ ' + (restant <= 0 ? 'clôture imminente sans mérite' : 'clôture dans ' + restant + ' j sans mérite') + '</span>') + '</div>'
                    + (actions ? '<div style="display:flex; gap:8px; flex-wrap:wrap;">' + actions + '</div>' : '') + '</div>';
            }).join('');
        },

        nbInitiatives: function () { return ((vue && vue.missions) || []).filter(function (m) { return m.origine === 'PILOTE'; }).length; },

        // lignes pour la salle de commandement (liste des missions en cours)
        lignesCommandement: function (campagneId) {
            return ((vue && vue.missions) || []).filter(function (m) { return campagneId === 'initiatives' ? m.origine === 'PILOTE' : (m.origine === 'AMIRAL' && String(m.campagne_id) === String(campagneId)); }).map(function (m) {
                var t = TYPE[m.type_pp] || [m.type_pp, '#aaa'];
                return '<div class="cmd-ordre" style="--oc:' + PPC + ';"><div style="min-width:0;"><div class="cmd-ordre-nom">' + esc(String(m.systeme).toUpperCase()) + '</div><div class="cmd-ordre-tags">'
                    + '<span class="cmd-tag" style="color:' + PPC + ';">POWERPLAY</span><span class="cmd-tag" style="color:' + t[1] + ';">' + t[0].toUpperCase() + '</span>' + (m.origine === 'PILOTE' ? '<span class="cmd-tag" style="color:#FF4FD8;">★ INITIATIVE</span>' : '') + '</div></div>'
                    + '<div class="cmd-ordre-actions"><button class="cmd-btn" onclick="edteamCampagnesPP.cloturer(' + m.id + ', false)">CLÔTURER</button></div></div>';
            }).join('');
        },

        // ===== FENETRE D'UNE MISSION POWERPLAY =====
        ouvrir: function (id) {
            if (typeof sonClic === 'function') sonClic();
            var m = trouver(id); if (!m) return;
            if (!aPuissance()) return;
            var t = TYPE[m.type_pp] || [m.type_pp, '#aaa'], estIni = m.origine === 'PILOTE', c = PPC, pc = pctControle(m);
            var total = Number(m.merites_total) || 0, mien = Number(m.merites_moi) || 0, part = total > 0 ? Math.round(mien * 100 / total) : 0;
            var jours = Math.max(1, Math.ceil((Date.now() - new Date(m.date_emission).getTime()) / 86400000));
            var camp = !estIni ? nomCampagne(m.campagne_id) : null;
            var origines = Object.keys(m.origines || {}).map(function (k) { return [k, Number(m.origines[k]) || 0]; }).sort(function (a, b) { return b[1] - a[1]; });
            var COUL_ORIG = { PRIMES: '#ff6a6a', COMBAT: '#ff9f43', MISSIONS: '#8A7CFF', LIVRAISONS: '#00c8ff', COMMERCE: '#2fe07a', EXPLORATION: '#ffd166', SAUVETAGE: '#4DA3FF', COMMUNAUTE: '#ff4fd8', AUTRE: '#8a949c' };
            var totO = origines.reduce(function (acc, o) { return acc + o[1]; }, 0);
            var partO = function (v) { var p = totO > 0 ? 100 * v / totO : 0; return p > 0 && p < 1 ? '< 1 %' : Math.round(p) + ' %'; };
            var lignesOrig = origines.length && totO > 0 ? '<div style="display:flex; height:24px; border:1px solid #333; background:#111; margin:2px 0 10px;">' + origines.map(function (o) {
                    var col = COUL_ORIG[o[0]] || '#8a949c', nom = ORIGINE[o[0]] || o[0];
                    return '<span data-pptip="' + esc(nom + '\n' + fmt(o[1]) + ' mérites (' + partO(o[1]) + ' des mérites de l\'escadron sur ce système)') + '" data-tc="' + col + '" style="flex:' + o[1] + ' 1 0; min-width:2px; background:' + col + '; border-right:1px solid #0a0a0a; cursor:help;"></span>';
                }).join('') + '</div><div style="display:flex; flex-direction:column; gap:5px;">' + origines.map(function (o) {
                    var col = COUL_ORIG[o[0]] || '#8a949c';
                    return '<div style="display:grid; grid-template-columns:14px 1fr auto 56px; gap:10px; align-items:center; font-size:.88em; color:' + (o[0] === 'AUTRE' ? '#9aa' : '#ccc') + ';"><i style="display:block; width:11px; height:11px; background:' + col + ';"></i><span>' + esc(ORIGINE[o[0]] || o[0]) + '</span><b style="color:#fff; text-align:right;">' + fmt(o[1]) + '</b><span style="color:#888; text-align:right;">' + partO(o[1]) + '</span></div>';
                }).join('') + '</div>'
                : '<div style="color:#777; font-size:.85em; font-style:italic;">Aucun mérite enregistré pour le moment.</div>';
            var totP = (m.pilotes || []).reduce(function (acc, p) { return acc + (Number(p.m) || 0); }, 0);
            var pil = (m.pilotes || []).map(function (p) {
                var estMoi = String(p.u) === String(moi().user_id), part = totP > 0 ? 100 * (Number(p.m) || 0) / totP : 0;
                var av = window.EDTEAMPhotos ? window.EDTEAMPhotos.avatar({ uid: p.u, nom: p.nom, role: 'pilote', taille: 44 }) : '';
                // repartition de SES merites par origine (script SQL 112) : une fine barre cumulee, memes couleurs que celle de l'escadron
                var po = p.o && typeof p.o === 'object' ? Object.keys(p.o).map(function (k) { return [k, Number(p.o[k]) || 0]; }).filter(function (x) { return x[1] > 0; }).sort(function (x, y) { return y[1] - x[1]; }) : [];
                var totPo = po.reduce(function (acc, x) { return acc + x[1]; }, 0);
                var barP = totPo > 0 ? '<span style="display:flex; height:6px; margin-top:7px; background:#111; border:1px solid #262626;">' + po.map(function (x) {
                    var col = COUL_ORIG[x[0]] || '#8a949c', pp = 100 * x[1] / totPo;
                    return '<span data-pptip="' + esc((ORIGINE[x[0]] || x[0]) + '\n' + fmt(x[1]) + ' mérites (' + (pp < 1 ? '< 1' : Math.round(pp)) + ' % de ses mérites)') + '" data-tc="' + col + '" style="flex:' + x[1] + ' 1 0; min-width:2px; background:' + col + '; opacity:.85; cursor:help;"></span>';
                }).join('') + '</span>' : '';
                return '<div style="display:flex; align-items:center; gap:14px; padding:9px 14px; min-height:62px; border-bottom:1px solid rgba(255,255,255,.06);">' + av
                    + '<span style="flex:1; min-width:0;"><span style="display:block; color:' + (estMoi ? '#fff' : c) + '; font-weight:bold; letter-spacing:1px; font-size:1.02em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">CMDR ' + esc(String(p.nom || 'INCONNU').toUpperCase()) + (estMoi ? ' (VOUS)' : '') + '</span>'
                    + '<span style="color:#8a949c; font-size:.8em;">≈ ' + fmt(cp(p.m)) + ' pts de contrôle</span>' + barP + '</span>'
                    + '<span style="text-align:right; flex:none; min-width:150px;"><b style="color:' + c + '; font-size:1.25em;">' + fmt(p.m) + '</b> <span style="color:#9ab; font-size:.72em; letter-spacing:1px;">MÉRITES</span><span style="display:block; color:#8a949c; font-size:.8em;">' + (part > 0 && part < 1 ? '< 1' : Math.round(part)) + ' % des participants</span></span></div>';
            }).join('')
                || '<div style="color:#666; text-align:center; font-size:.9em; padding:16px; font-style:italic;">Aucun participant pour le moment.</div>';
            var etat = m.etat, hist = m.hist || [], courbe = '';
            if (hist.length >= 2) {
                var vs = hist.map(function (p) { return Number(p[1]) * 100; }), mn = Math.min.apply(null, vs), mx = Math.max.apply(null, vs), marge = Math.max(2, (mx - mn) * .2); mn -= marge; mx += marge;
                var pts = hist.map(function (p, i) { return (5 + i * 290 / (hist.length - 1)).toFixed(1) + ',' + (55 - (vs[i] - mn) / (mx - mn) * 50).toFixed(1); });
                courbe = '<svg viewBox="0 0 300 60" style="width:100%; height:70px; background:rgba(255,255,255,.02); border:1px solid #222;"><polyline fill="none" stroke="' + PPC + '" stroke-width="2" points="' + pts.join(' ') + '"/>' + pts.map(function (p) { var xy = p.split(','); return '<circle cx="' + xy[0] + '" cy="' + xy[1] + '" r="3" fill="' + PPC + '"/>'; }).join('') + '</svg>';
            }
            var E = window.EdteamPPEtat, calc = E && etat ? E.calc(m) : null;
            var ctx = { puissance: etat && etat.controlling, prochain: prochainReleve() };
            var coulEtat = { Exploited: '#c0504d', Fortified: '#4f9d4f', Stronghold: '#9a5fc0', Unoccupied: '#8a8a8a' };
            var ce = etat ? (coulEtat[etat.etat] || '#8a8a8a') : '#8a8a8a';
            var vieux = etat && etat.observe_le ? (Date.now() - new Date(etat.observe_le).getTime()) / 3600000 > 24 : false;
            var portrait = etat && etat.controlling && E ? E.portrait(etat.controlling, 76, ce) : '';
            var entete = etat ? '<div style="display:flex; align-items:center; gap:16px; margin:2px 0 16px;">' + portrait + '<div style="flex:1; min-width:0;"><div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap;"><span style="border:1px solid ' + ce + '; background:' + ce + '33; color:#fff; padding:4px 14px; font-size:1.15em; letter-spacing:3px; font-weight:bold;">' + esc((ETAT[etat.etat] || etat.etat || 'SANS ÉTAT').toUpperCase()) + '</span>'
                + '<span style="color:#bbb;">' + (etat.controlling ? 'Contrôlé par <b style="color:#fff;">' + esc(etat.controlling) + '</b>' : 'Aucune puissance ne contrôle ce système') + '</span></div>'
                + '<div style="color:' + (vieux ? '#ffb000' : '#9ab') + '; font-size:.8em; margin-top:8px;">Relevé ' + age(etat.observe_le) + (etat.observe_par ? ' par CMDR ' + esc(String(etat.observe_par).toUpperCase()) : '') + (vieux ? ' · ancien' : '') + '</div></div></div>' : '';
            var blocEtat = etat ? entete
                    + (calc ? E.panneau(calc, m, ctx) : '<div style="color:#aaa; font-size:.92em; line-height:1.6; margin-bottom:6px;">' + (pc != null ? 'Progression observée : ' + pc + ' %. ' : 'Ce système n\'a pas de position chiffrée dans les journaux de jeu (un système inoccupé n\'en a pas). ')
                        + (etat.renf != null ? 'Renforcement du cycle : <b style="color:#fff;">' + fmt(etat.renf) + '</b> pts · sape : <b style="color:#fff;">' + fmt(etat.sape) + '</b> pts.' : '') + '</div>')
                    + (courbe ? '<div class="bgs-sec" style="margin-top:18px;">ÉVOLUTION OBSERVÉE <span style="color:#777; letter-spacing:0;">· position dans la zone d\'état à chaque passage d\'un pilote de l\'escadron</span></div>' + courbe : '')
                    + ((etat.powers || []).length ? '<div class="bgs-sec" style="margin-top:14px;">PUISSANCES EN PRÉSENCE</div><div style="font-size:.88em; line-height:1.6; color:#bbb; margin-top:6px;">' + etat.powers.map(function (p) { var ctl = p === etat.controlling; return '<span style="display:inline-flex; align-items:center; gap:7px; margin:0 14px 6px 0; white-space:nowrap;">' + (E ? E.portrait(p, 28, ctl ? ce : '#444') : '') + (ctl ? '★ <b style="color:#fff;">' + esc(p) + '</b>' : esc(p)) + '</span>'; }).join('') + '</div>' : '')
                : '<div style="color:#999; font-size:.92em; line-height:1.6; padding:14px 4px;">Ce système n\'a pas encore été observé : son état sera relevé dès qu\'un pilote de l\'escadron y passera.</div>';
            var peutCloturer = estCmd() || (estIni && String(m.auteur_id) === String(moi().user_id));
            var boutons = (peutCloturer ? '<button class="ini-btn gris" onclick="edteamCampagnesPP.cloturer(' + m.id + ', ' + (estIni && !estCmd()) + ')">' + (estIni ? (estCmd() ? 'RETIRER L\'INITIATIVE' : 'CLÔTURER MON INITIATIVE') : 'CLÔTURER LA MISSION') + '</button>' : '')
                + (estIni && estCmd() ? '<button class="ini-btn" onclick="edteamCampagnesPP.adopter(' + m.id + ')">TRANSFORMER EN MISSION DE CAMPAGNE</button>' : '');
            var tuileG = function (titre, val, sous, coul) { return '<div style="flex:1; min-width:130px; background:linear-gradient(90deg, color-mix(in srgb, ' + c + ' 15%, #0a0c10), #0a0c10 72%); border-left:4px solid ' + c + '; box-shadow:inset 0 0 0 1px rgba(255,255,255,.05); padding:10px 12px;"><div style="color:#9ab; font-size:.68em; letter-spacing:2px;">' + titre + '</div><div style="color:' + (coul || '#fff') + '; font-size:1.8em; font-weight:bold; line-height:1.15; margin:3px 0;">' + val + '</div><div style="color:#8a949c; font-size:.74em; line-height:1.4;">' + sous + '</div></div>'; };
            var html = '<div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; padding-right:30px;">' + pastille('POWERPLAY', PPC) + ' ' + pastille(t[0].toUpperCase(), t[1])
                + (estIni ? ' <span style="color:#FF4FD8; border:1px solid #FF4FD8; background:rgba(255,79,216,.1); padding:1px 8px; font-size:.8em; font-weight:bold; letter-spacing:2px;">★ INITIATIVE</span>' : '')
                + ' <b style="color:#fff; letter-spacing:2px; font-size:1.15em;">' + esc(String(m.systeme).toUpperCase()) + '</b>' + (etat && etat.controlling ? '<span style="color:#888;">· ' + esc(etat.controlling.toUpperCase()) + (etat.etat ? ' · ' + (ETAT[etat.etat] || esc(etat.etat)).toUpperCase() : '') + '</span>' : '') + '</div>'
                + '<div style="color:#777; font-size:.8em; margin-top:4px;">' + (estIni ? 'Initiative lancée par CMDR ' + esc(String(m.createur || 'inconnu').toUpperCase()) + ' il y a ' + jours + ' j' : 'Mission' + (camp ? ' de la campagne « ' + esc(camp) + ' »' : '') + (m.createur ? ' · ciblée par CMDR ' + esc(String(m.createur).toUpperCase()) : ''))
                + (m.briefing ? ' · « ' + esc(m.briefing) + ' »' : '') + '</div>'
                + '<div class="bgs-paysage"><div class="bgs-col-effort"><div class="bgs-cadre"><div class="bgs-cadre-t">CE QUE L\'ESCADRON A APPORTÉ</div>'
                + '<div style="display:flex; gap:10px; flex-wrap:wrap;">' + tuileG('DEPUIS LE DÉBUT', fmt(total), 'mérites · ≈ ' + fmt(cp(total)) + ' pts de contrôle') + tuileG('CE CYCLE', fmt(m.merites_cycle), 'mérites depuis jeudi 07:00 UTC · ≈ ' + fmt(cp(m.merites_cycle)) + ' pts') + tuileG('TA PART', part + ' %', 'de l\'effort de l\'escadron', c) + '</div>'
                + '<div class="bgs-sec" style="margin-top:16px;">D\'OÙ VIENNENT LES MÉRITES <span style="color:#777; letter-spacing:0;">· répartition des mérites de l\'escadron sur ce système (« non identifiée » : gains que le jeu ne rattache à aucune action)</span></div><div style="display:flex; flex-direction:column; gap:7px;">' + lignesOrig + '</div>'
                + '<div class="bgs-sec" style="margin-top:16px;">PARTICIPANTS <span style="color:#777; letter-spacing:0;">· ' + (m.nb_pilotes || 0) + ' pilote' + (m.nb_pilotes > 1 ? 's' : '') + ' · tu pèses ' + part + ' %</span></div><div style="border:1px solid ' + c + '55; margin-top:6px;">' + pil + '</div>'
                + '</div></div>'
                + '<div class="bgs-col-jeu"><div class="bgs-cadre"><div class="bgs-cadre-t">OÙ EN EST CE SYSTÈME DANS LE JEU ?</div>' + blocEtat + '</div>'
                + (boutons ? '<div style="display:flex; gap:8px; flex-wrap:wrap;">' + boutons + '</div>' : '') + '</div></div>'
                + '<div style="color:#777; font-size:.75em; line-height:1.5; margin-top:14px;">ⓘ 1 mérite ≈ 1/4 point de contrôle (estimation, non confirmée par le jeu). Les mérites sont rattachés au système où se trouvait le pilote. L\'état du système vient du journal de jeu des pilotes de l\'escadron : les résultats officiels sont dans le classement Powerplay du jeu.</div>';
            var mo = document.getElementById('modal-ordre-resultat'); if (!mo) return;
            mo.querySelector('.modal-content').style.borderColor = c;
            mo.querySelector('.modal-content').style.boxShadow = '0 0 40px ' + c + '30';
            document.getElementById('ordre-resultat-corps').innerHTML = html;
            mo.style.display = 'flex';
        },

        // modifier une mission Powerplay (commandement) : type et consigne
        editer: function (id) {
            var m = trouver(id); if (!m) return;
            window.edteamCampagnes.ouvrirEditionMission({ titre: 'MODIFIER LA MISSION POWERPLAY · ' + String(m.systeme).toUpperCase(), sous: 'Le système ne change pas : pour un autre système, créez une nouvelle mission.', types: TYPE, type: m.type_pp, briefing: m.briefing, plafondActif: true, plafond: m.plafond_cp,
                enregistrer: async function (type, briefing, plafond) { var args = { p_id: Number(id), p_type: type, p_briefing: briefing || null }; if (plafond != null || m.plafond_cp != null) args.p_plafond_cp = plafond; var r = await db().rpc('modifier_mission_pp', args); return r.error ? (r.error.message || 'Échec.') : null; } });
        },
        // supprimer une mission Powerplay (commandement) : les merites deja releves restent en soutien libre
        supprimer: async function (id) {
            var m = trouver(id); if (!m) return;
            var ok = await demanderConfirmation('🗑 SUPPRIMER CETTE MISSION POWERPLAY ?', 'La mission disparaît. Les <strong>mérites déjà relevés restent</strong> dans le journal, en soutien libre. Pour la garder dans l\'historique, <strong>clôturez-la</strong> plutôt.', '#FF3333');
            if (!ok) return;
            var r = await db().rpc('supprimer_mission_pp', { p_id: Number(id) });
            if (r.error) { console.error(r.error); alert(r.error.message || 'Échec de la suppression.'); return; }
            if (typeof sonSucces === 'function') sonSucces();
            var mo = document.getElementById('modal-ordre-resultat'); if (mo) mo.style.display = 'none';
            if (window.edteamCampagnes) await window.edteamCampagnes.rafraichir();
        },
        cloturer: async function (id, parCreateur) {
            var m = trouver(id); if (!m) return;
            var ok = await demanderConfirmation(m.origine === 'PILOTE' ? (parCreateur ? 'CLÔTURER VOTRE INITIATIVE ?' : 'RETIRER CETTE INITIATIVE ?') : 'CLÔTURER CETTE MISSION POWERPLAY ?', 'La mission disparaît des terminaux des pilotes ; les mérites déjà enregistrés restent dans le journal.', m.origine === 'PILOTE' ? '#FF4FD8' : '#00F0FF');
            if (!ok) return;
            var r = await db().rpc('cloturer_mission_pp', { p_id: Number(id) });
            if (r.error) { console.error(r.error); alert(r.error.message || 'Échec de la clôture.'); return; }
            if (typeof sonSucces === 'function') sonSucces();
            var mo = document.getElementById('modal-ordre-resultat'); if (mo) mo.style.display = 'none';
            if (window.edteamCampagnes) await window.edteamCampagnes.rafraichir();
        },
        adopter: async function (id) {
            var campagne = await window.edteamCampagnes.choisirCampagne('TRANSFORMER EN MISSION : QUELLE CAMPAGNE ?', 'L\'initiative devient une mission officielle de la campagne choisie (elle en prend la priorité) ; l\'annonce figure dans le journal de l\'escadron.');
            if (!campagne) return;
            var r = await db().rpc('adopter_initiative_pp', { p_id: Number(id), p_campagne_id: Number(campagne) });
            if (r.error) { console.error(r.error); alert(r.error.message || 'Échec de la transformation.'); return; }
            var mo = document.getElementById('modal-ordre-resultat'); if (mo) mo.style.display = 'none';
            if (window.edteamCampagnes) await window.edteamCampagnes.rafraichir();
        },

        // ===== SALLE DE COMMANDEMENT : choix du domaine (BGS / Powerplay) et envoi d'une mission Powerplay =====
        domaine: function () { return domCmd; },
        choisirDomaine: function (d) {
            if (typeof sonClic === 'function') sonClic();
            domCmd = d;
            ['BGS', 'PP', 'COL'].forEach(function (x) {
                var b = document.getElementById('cmd-dom-' + x); if (b) b.classList.toggle('actif', x === d);
                var z = document.getElementById('cmd-bloc-' + x.toLowerCase()); if (z) z.style.display = x === d ? '' : 'none';
            });
            var bt = document.getElementById('btn-transmettre'); if (bt) bt.innerText = d === 'PP' ? 'TRANSMETTRE LA MISSION POWERPLAY' : d === 'COL' ? 'TRANSMETTRE LA MISSION DE COLONISATION' : 'TRANSMETTRE LES DIRECTIVES';
            API.dessinerTypes();
            if (window.edteamCampagnesCOL) window.edteamCampagnesCOL.dessiner();
        },
        choisirTypeCmd: function (t) { if (typeof sonClic === 'function') sonClic(); typeCmd = t; API.dessinerTypes(); },
        dessinerTypes: function () {
            var z = document.getElementById('cmd-pp-types');
            if (z) z.innerHTML = Object.keys(TYPE).map(function (k) { return '<button type="button" class="cmd-pill' + (k === typeCmd ? ' actif' : '') + '" style="--pc:' + TYPE[k][1] + ';" onclick="edteamCampagnesPP.choisirTypeCmd(\'' + k + '\')">' + TYPE[k][0].toUpperCase() + '</button>'; }).join('');
            var i = document.getElementById('ini-pp-types');
            if (i) i.innerHTML = Object.keys(TYPE).map(function (k) { return '<button type="button" class="cmd-pill' + (k === typeIni ? ' actif' : '') + '" style="--pc:' + TYPE[k][1] + ';" onclick="edteamCampagnesPP.choisirTypeIni(\'' + k + '\')">' + TYPE[k][0].toUpperCase() + '</button>'; }).join('');
        },
        transmettre: async function () {
            if (typeof sonClic === 'function') sonClic();
            var btn = document.getElementById('btn-transmettre');
            var camp = parseInt((document.getElementById('cmd-campagne') || {}).value || '0', 10) || 0;
            var sys = (document.getElementById('cmd-pp-systeme') || {}).value || '';
            var brief = ((document.getElementById('cmd-pp-briefing') || {}).value || '').trim();
            var plafondTxt = ((document.getElementById('cmd-pp-plafond') || {}).value || '').trim(), plafond = plafondTxt === '' ? null : Math.round(Number(plafondTxt));
            var libelle = 'TRANSMETTRE LA MISSION POWERPLAY';
            if (!camp) { btn.innerText = 'ERREUR : CHOISISSEZ UNE CAMPAGNE'; setTimeout(function () { btn.innerText = libelle; }, 2000); return; }
            if (sys.trim().length < 2) { btn.innerText = 'ERREUR : SYSTÈME REQUIS'; setTimeout(function () { btn.innerText = libelle; }, 2000); return; }
            if (plafond !== null && (!(plafond >= 1) || plafond > 10000000)) { btn.innerText = 'ERREUR : PLAFOND DE 1 À 10 000 000'; setTimeout(function () { btn.innerText = libelle; }, 2400); return; }
            btn.innerText = 'TRANSMISSION…'; btn.style.pointerEvents = 'none';
            var argsC = { p_campagne_id: camp, p_systeme: sys.trim().toUpperCase(), p_type: typeCmd, p_briefing: brief || null }; if (plafond !== null) argsC.p_plafond_cp = plafond;
            var r = await db().rpc('creer_mission_pp', argsC);
            btn.style.pointerEvents = 'auto';
            if (r.error) { console.error(r.error); var msg = String(r.error.message || 'Refusé.'); btn.innerText = msg.length > 60 ? 'REFUSÉ : VOIR LA CONSOLE' : 'REFUSÉ : ' + msg.toUpperCase(); setTimeout(function () { btn.innerText = libelle; }, 3200); return; }
            if (typeof sonSucces === 'function') sonSucces();
            btn.innerText = 'MISSION DÉPLOYÉE';
            setTimeout(function () {
                document.getElementById('cmd-pp-systeme').value = ''; document.getElementById('cmd-pp-briefing').value = ''; var pfe = document.getElementById('cmd-pp-plafond'); if (pfe) pfe.value = '';
                btn.innerText = libelle;
                if (typeof fermerModal === 'function') fermerModal('modal-commandement');
                window.edteamCampagnes.rafraichir();
            }, 1200);
        },

        // ===== FENETRE DES INITIATIVES (pilote) : BGS / Powerplay =====
        domaineIni: function () { return domIni; },
        choisirDomaineIni: function (d) {
            if (typeof sonClic === 'function') sonClic();
            if (d === 'PP' && !aPuissance()) return;
            domIni = d;
            ['BGS', 'PP', 'COL'].forEach(function (x) {
                var b = document.getElementById('ini-dom-' + x); if (b) b.classList.toggle('actif', x === d);
                var z = document.getElementById('ini-bloc-' + x.toLowerCase()); if (z) z.style.display = x === d ? '' : 'none';
            });
            API.dessinerTypes();
            if (window.edteamCampagnesCOL) window.edteamCampagnesCOL.dessiner();
        },
        choisirTypeIni: function (t) { if (typeof sonClic === 'function') sonClic(); typeIni = t; API.dessinerTypes(); },
        preparerFenetreIni: function () {
            var b = document.getElementById('ini-dom-PP');
            if (b) { b.style.opacity = aPuissance() ? '' : '.4'; b.title = aPuissance() ? '' : 'Il faut avoir rejoint une puissance pour lancer une initiative Powerplay'; }
            API.choisirDomaineIni(aPuissance() ? domIni : 'BGS');
            if (!aPuissance()) { domIni = 'BGS'; API.dessinerTypes(); }
        },
        lancerIni: async function (propose) {
            var btn = document.getElementById('btn-lancer-initiative');
            var sys = (document.getElementById('ini-pp-systeme') || {}).value || '';
            var msg = ((document.getElementById('ini-message') || {}).value || '').trim();
            var libelle = propose ? "PROPOSER L'INITIATIVE" : "LANCER L'INITIATIVE";
            if (sys.trim().length < 2) { btn.innerText = 'ERREUR : SYSTÈME REQUIS'; setTimeout(function () { btn.innerText = libelle; }, 2200); return; }
            btn.innerText = 'TRANSMISSION…'; btn.style.pointerEvents = 'none';
            var r = await db().rpc(propose ? 'proposer_initiative_pp' : 'lancer_initiative_pp', { p_systeme: sys.trim().toUpperCase(), p_type: typeIni, p_message: msg || null });
            if (r.error) {
                console.error(r.error);
                var m = String(r.error.message || 'Échec du lancement.');
                btn.innerText = m.length > 60 ? 'REFUSÉ : VOIR LE MESSAGE CI-DESSUS' : 'REFUSÉ : ' + m.toUpperCase();
                var aide = document.getElementById('ini-aide'); if (aide) { aide.textContent = m; aide.style.color = '#FF4FD8'; }
                setTimeout(function () { btn.innerText = libelle; btn.style.pointerEvents = 'auto'; }, 3200);
                return;
            }
            if (typeof sonSucces === 'function') sonSucces();
            btn.innerText = propose ? 'PROPOSITION ENVOYÉE' : 'INITIATIVE LANCÉE';
            setTimeout(function () {
                if (typeof fermerModal === 'function') fermerModal('modal-initiative');
                document.getElementById('ini-pp-systeme').value = ''; document.getElementById('ini-message').value = '';
                var aide = document.getElementById('ini-aide'); if (aide) { aide.style.color = ''; }
                btn.innerText = libelle; btn.style.pointerEvents = 'auto';
                if (typeof window.rafraichirModeIni === 'function') window.rafraichirModeIni(true);
                window.edteamCampagnes.rafraichir();
            }, 1200);
        }
    };
    window.edteamCampagnesPP = API;
})();
