// MISSIONS POWERPLAY (page BGS) : lignes dans les campagnes, fenetre d'une mission, cartes des initiatives, formulaires du commandement et des pilotes.
// Donnees : fonction serveur pp_missions_vue() (script SQL 96), missions creees par creer_mission_pp (commandement) ou lancer_initiative_pp / proposer_initiative_pp (pilotes, script SQL 97).
// Regles : un pilote d'un escadron SANS puissance voit les missions grisees (cadenas) et ne peut pas les ouvrir. Les « CP » sont une ESTIMATION (merites / 4) : le taux n'est pas confirme par le jeu.
// L'etat d'un systeme (controle, progression) vient des journaux de jeu des pilotes de l'escadron : « observe il y a X ». Aucun seuil d'etat n'est affiche (non confirmes).
(function () {
    'use strict';
    var PPC = '#8A7CFF';
    var TYPE = { RENFORCEMENT: ['Renforcement', '#00FF66'], SAPE: ['Sape', '#FF3333'], ACQUISITION: ['Acquisition', '#EDEDED'] };
    var ETAT = { Exploited: 'Exploité', Fortified: 'Fortifié', Stronghold: 'Bastion', Unoccupied: 'Inoccupé' };
    var ORIGINE = { PRIMES: 'Primes', COMBAT: 'Combat', MISSIONS: 'Missions', LIVRAISONS: 'Livraisons Powerplay', COMMERCE: 'Commerce', EXPLORATION: 'Exploration', SAUVETAGE: 'Sauvetage', COMMUNAUTE: 'Objectif communautaire', AUTRE: 'Non identifiée' };
    var esc = function (s) { return typeof window.escapeHtml === 'function' ? window.escapeHtml(String(s == null ? '' : s)) : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
    var db = function () { return window.supabaseApp; };
    var moi = function () { return window.profilCommandant || {}; };
    var estCmd = function () { var m = moi(); return !!(m.est_amiral || m.est_officier || m.est_directeur); };
    var fmt = function (n) { return Number(n || 0).toLocaleString('fr-FR'); };
    var cp = function (m) { return Math.round(Number(m || 0) / 4); };
    var vue = null, domCmd = 'BGS', domIni = 'BGS', typeCmd = 'RENFORCEMENT', typeIni = 'RENFORCEMENT';

    function pastille(txt, col) { return '<span class="camp-pastille" style="color:' + col + '; border-color:' + col + '; background:' + col + '1a;">' + txt + '</span>'; }
    function barre(pct, col, txt, h) { pct = Math.max(0, Math.min(100, Number(pct) || 0)); h = h || 16; return '<div style="position:relative; height:' + h + 'px; background:#111; border:1px solid #333; border-radius:2px; overflow:hidden;"><div style="width:' + pct + '%; height:100%; background:linear-gradient(90deg,' + col + '55,' + col + ');"></div><span style="position:absolute; inset:0; font-size:.7em; color:#fff; text-align:center; line-height:' + h + 'px; letter-spacing:1px; text-shadow:0 0 3px #000;">' + txt + '</span></div>'; }
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

    // Plafond de CP fixe par le commandement : la barre = CP estimes de la mission / plafond (sinon : progression du controle observee)
    function plafonne(m, o) {
        var pl = Number(m.plafond_cp) || 0;
        if (!(pl > 0) || o.gris) return o;
        var fait = cp(m.merites_total), mien = cp(m.merites_moi);
        o.pct = Math.min(100, Math.round(100 * fait / pl));
        o.vous = Math.min(o.pct, Math.round(100 * mien / pl));
        o.legendeTitre = 'Objectif de ' + fmt(pl) + ' CP fixé par le commandement : ≈ ' + fmt(fait) + ' CP réalisés par l\'escadron (mérites ÷ 4, estimation). La lueur néon à gauche : votre part.';
        o.info = '<span class="inf" title="CP estimés réalisés / plafond fixé par le commandement">≈ ' + fmt(fait) + ' / ' + fmt(pl) + ' CP</span>' + (fait >= pl ? '<span style="color:#2fe07a;">objectif atteint</span>' : '') + (o.info || '');
        return o;
    }

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
            return ((vue && vue.missions) || []).filter(function (m) { return m.origine === 'AMIRAL' && String(m.campagne_id) === String(campagneId); }).map(function (m) {
                var t = TYPE[m.type_pp] || [m.type_pp, '#aaa'], pc = pctControle(m), gris = !aPuissance();
                return plafonne(m, { sys: String(m.systeme || '').toUpperCase(), tag: 'PP #' + m.id + ' - ' + t[0].toUpperCase(), domaine: 'PP', id: m.id, couleur: PPC, gris: gris, pct: pc, vous: null, avatars: gris ? '' : (window.edteamCampagnes ? window.edteamCampagnes.avatars((m.pilotes || []).map(function (x) { return { u: x.u, nom: x.nom }; })) : ''),
                    legendeTitre: 'Progression du contrôle du système, observée par un pilote de l\'escadron (le jeu ne donne pas d\'objectif : ce n\'est pas un effort)', clic: 'edteamCampagnesPP.ouvrir(' + m.id + ')', titre: 'Rejoignez une puissance (Powerplay) pour participer à cette mission',
                    info: gris ? '' : (m.etat ? '<span class="inf">' + esc(m.etat.controlling || 'sans puissance') + '</span>' + (m.etat.etat ? '<span>' + (ETAT[m.etat.etat] || esc(m.etat.etat)) + '</span>' : '') : '<span style="color:#888;">pas encore observé</span>') + '<span style="color:#aaa;" title="Mérites de l\'escadron sur ce système">' + fmt(m.merites_total) + ' mérites</span>',
                    texte: '<b>' + esc(String(m.systeme).toUpperCase()) + '</b>' });
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
            var maxO = origines.length ? origines[0][1] : 1;
            var lignesOrig = origines.length ? origines.map(function (o) { return '<div style="display:grid; grid-template-columns:150px 1fr 70px; gap:10px; align-items:center; font-size:.82em; color:' + (o[0] === 'AUTRE' ? '#777' : '#aaa') + ';"><span>' + esc(ORIGINE[o[0]] || o[0]) + '</span>' + barre(o[1] * 100 / maxO, o[0] === 'AUTRE' ? '#666' : PPC, '', 8) + '<b style="color:#fff; text-align:right;">' + fmt(o[1]) + '</b></div>'; }).join('')
                : '<div style="color:#777; font-size:.85em; font-style:italic;">Aucun mérite enregistré pour le moment.</div>';
            var pil = (m.pilotes || []).map(function (p) { var estMoi = String(p.u) === String(moi().user_id); return '<div style="display:flex; justify-content:space-between; padding:7px 12px; border-bottom:1px solid rgba(255,255,255,.05); font-size:.9em;"><span style="color:' + (estMoi ? '#fff' : c) + '; font-weight:bold; letter-spacing:1px;">CMDR ' + esc(String(p.nom || 'INCONNU').toUpperCase()) + (estMoi ? ' (VOUS)' : '') + '</span><span><span style="color:#aaa; margin-right:12px;">≈ ' + fmt(cp(p.m)) + ' CP</span><b style="color:' + c + ';">' + fmt(p.m) + ' MÉRITES</b></span></div>'; }).join('')
                || '<div style="color:#666; text-align:center; font-size:.9em; padding:16px; font-style:italic;">Aucun participant pour le moment.</div>';
            var etat = m.etat, hist = m.hist || [], courbe = '';
            if (hist.length >= 2) {
                var vs = hist.map(function (p) { return Number(p[1]) * 100; }), mn = Math.min.apply(null, vs), mx = Math.max.apply(null, vs), marge = Math.max(2, (mx - mn) * .2); mn -= marge; mx += marge;
                var pts = hist.map(function (p, i) { return (5 + i * 290 / (hist.length - 1)).toFixed(1) + ',' + (55 - (vs[i] - mn) / (mx - mn) * 50).toFixed(1); });
                courbe = '<svg viewBox="0 0 300 60" style="width:100%; height:70px; background:rgba(255,255,255,.02); border:1px solid #222;"><polyline fill="none" stroke="' + PPC + '" stroke-width="2" points="' + pts.join(' ') + '"/>' + pts.map(function (p) { var xy = p.split(','); return '<circle cx="' + xy[0] + '" cy="' + xy[1] + '" r="3" fill="' + PPC + '"/>'; }).join('') + '</svg>';
            }
            var blocEtat = etat ? '<div style="color:#aaa; font-size:.85em; margin:6px 0 6px;">' + (etat.controlling ? 'Contrôlé par <b style="color:#fff;">' + esc(etat.controlling) + '</b>' : 'Aucune puissance ne contrôle ce système') + (etat.etat ? ' · état <b style="color:#fff;">' + (ETAT[etat.etat] || esc(etat.etat)) + '</b>' : '') + '</div>'
                    + (pc != null ? barre(pc, PPC, 'progression du contrôle : ' + pc + ' %', 22) : '')
                    + '<div style="display:flex; gap:6px 24px; flex-wrap:wrap; margin-top:12px; font-size:.88em; color:#aaa;">' + (etat.renf != null ? '<span>Points de renforcement <b style="color:#fff;">' + fmt(etat.renf) + '</b></span>' : '') + (etat.sape != null ? '<span>Points de sape <b style="color:#fff;">' + fmt(etat.sape) + '</b></span>' : '') + '</div>'
                    + '<div style="color:#777; font-size:.74em; margin-top:4px;">Totaux du jeu pour tout le système, toutes puissances et tous les pilotes confondus.</div>'
                    + (courbe ? '<div class="bgs-sec" style="margin-top:16px;">ÉVOLUTION OBSERVÉE <span style="color:#777; letter-spacing:0;">· progression du contrôle à chaque passage d\'un pilote de l\'escadron</span></div>' + courbe : '')
                    + ((etat.powers || []).length ? '<div class="bgs-sec" style="margin-top:12px;">PUISSANCES EN PRÉSENCE</div><div style="font-size:.85em; line-height:1.8; color:#bbb;">' + etat.powers.map(function (p) { return (p === etat.controlling ? '★ <b style="color:#fff;">' + esc(p) + '</b>' : esc(p)); }).join(' · ') + '</div>' : '')
                : '<div style="color:#999; font-size:.88em; line-height:1.6; padding:14px 4px;">Ce système n\'a pas encore été observé : son état sera relevé dès qu\'un pilote de l\'escadron y passera.</div>';
            var peutCloturer = estCmd() || (estIni && String(m.auteur_id) === String(moi().user_id));
            var boutons = (peutCloturer ? '<button class="ini-btn gris" onclick="edteamCampagnesPP.cloturer(' + m.id + ', ' + (estIni && !estCmd()) + ')">' + (estIni ? (estCmd() ? 'RETIRER L\'INITIATIVE' : 'CLÔTURER MON INITIATIVE') : 'CLÔTURER LA MISSION') + '</button>' : '')
                + (estIni && estCmd() ? '<button class="ini-btn" onclick="edteamCampagnesPP.adopter(' + m.id + ')">TRANSFORMER EN MISSION DE CAMPAGNE</button>' : '');
            var pl = Number(m.plafond_cp) || 0, cpFait = cp(total), pctObj = pl > 0 ? Math.min(100, Math.round(100 * cpFait / pl)) : 100, myObj = pl > 0 ? Math.min(pctObj, Math.round(100 * cp(mien) / pl)) : part;
            var html = '<div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; padding-right:30px;">' + pastille('POWERPLAY', PPC) + ' ' + pastille(t[0].toUpperCase(), t[1])
                + (estIni ? ' <span style="color:#FF4FD8; border:1px solid #FF4FD8; background:rgba(255,79,216,.1); padding:1px 8px; font-size:.8em; font-weight:bold; letter-spacing:2px;">★ INITIATIVE</span>' : '')
                + ' <b style="color:#fff; letter-spacing:2px; font-size:1.15em;">' + esc(String(m.systeme).toUpperCase()) + '</b>' + (etat && etat.controlling ? '<span style="color:#888;">· ' + esc(etat.controlling.toUpperCase()) + (etat.etat ? ' · ' + (ETAT[etat.etat] || esc(etat.etat)).toUpperCase() : '') + '</span>' : '') + '</div>'
                + '<div style="color:#777; font-size:.8em; margin-top:4px;">' + (estIni ? 'Initiative lancée par CMDR ' + esc(String(m.createur || 'inconnu').toUpperCase()) + ' il y a ' + jours + ' j' : 'Mission' + (camp ? ' de la campagne « ' + esc(camp) + ' »' : '') + (m.createur ? ' · ciblée par CMDR ' + esc(String(m.createur).toUpperCase()) : ''))
                + (m.briefing ? ' · « ' + esc(m.briefing) + ' »' : '') + '</div>'
                + '<div class="bgs-paysage"><div class="bgs-col-effort"><div class="bgs-cadre"><div class="bgs-cadre-t">EFFORT</div>'
                + '<div class="bgs-hero" style="border-color:' + c + '; margin-top:0;"><div class="h1"><span>MÉRITES DE L\'ESCADRON</span><b style="color:#fff;">' + fmt(total) + ' <small style="color:#bbb; font-size:.5em;">· ≈ ' + fmt(cp(total)) + ' CP</small></b></div><div class="h2"><span>TA PART</span><b style="color:' + c + ';">' + part + ' %</b></div>'
                + '<div class="jgh"><i style="width: ' + pctObj + '%; opacity: 0.5; background: ' + c + ';"></i><i style="width: ' + myObj + '%; background: ' + c + '; box-shadow: 0 0 9px ' + c + ', 0 0 2px ' + c + ', inset 0 0 4px #fff9; border-right: 2px solid #fff8;"></i></div></div>'
                + (pl > 0 ? '<div style="margin-top:8px; font-size:.88em; color:#bbb;">OBJECTIF FIXÉ PAR LE COMMANDEMENT : <b style="color:#fff;">' + fmt(pl) + ' CP</b> · réalisé ≈ <b style="color:' + c + ';">' + fmt(cpFait) + ' CP</b> (' + pctObj + ' %)' + (cpFait >= pl ? ' · <b style="color:#2fe07a;">objectif atteint</b>' : '') + '<div style="color:#777; font-size:.85em; margin-top:2px;">Les mérites continuent d\'être enregistrés au-delà. CP = mérites ÷ 4 (estimation).</div></div>' : '')
                + '<div style="color:#999; font-size:.8em; margin-top:8px;">Depuis le dernier relevé (jeudi 07:00 UTC) : <b style="color:#fff;">' + fmt(m.merites_cycle) + ' mérites</b> · ≈ ' + fmt(cp(m.merites_cycle)) + ' CP</div>'
                + '<div class="bgs-sec" style="margin-top:14px;">MÉRITES PAR ORIGINE <span style="color:#777; letter-spacing:0;">· « non identifiée » : gains que le jeu ne rattache à aucune action</span></div><div style="display:flex; flex-direction:column; gap:7px;">' + lignesOrig + '</div>'
                + '<div class="bgs-dossier" style="border-color:' + c + '55; margin-top:14px;"><div class="tete" onclick="bgsToggleDossier(this)"><span style="color:' + c + '; letter-spacing:2px; font-weight:bold;">PARTICIPANTS</span><span style="color:#888; font-size:.85em;">' + (m.nb_pilotes || 0) + ' pilote' + (m.nb_pilotes > 1 ? 's' : '') + ' · tu pèses ' + part + ' %</span><span class="fl" style="color:' + c + ';">▼</span></div><div class="corps" style="display:none;">' + pil + '</div></div>'
                + '</div></div>'
                + '<div class="bgs-col-jeu"><div class="bgs-cadre"><div class="bgs-cadre-t">ÉTAT DU SYSTÈME DANS LE JEU' + (etat ? ' <small>· observé ' + age(etat.observe_le) + (etat.observe_par ? ' par ' + esc(String(etat.observe_par).toUpperCase()) : '') + '</small>' : '') + '</div>' + blocEtat + '</div>'
                + '<div class="bgs-cadre"><div class="bgs-cadre-t">RELEVÉ HEBDOMADAIRE</div><div style="font-size:.88em; color:#bbb; line-height:1.6;">Prochain relevé du jeu : <b style="color:#fff;">' + prochainReleve() + '</b>. Les résultats officiels sont dans le classement Powerplay du jeu ; EDTEAM affiche ce que ses pilotes ont constaté.</div></div>'
                + (boutons ? '<div style="display:flex; gap:8px; flex-wrap:wrap;">' + boutons + '</div>' : '') + '</div></div>'
                + '<div style="color:#777; font-size:.75em; line-height:1.5; margin-top:14px;">ⓘ CP estimés = mérites ÷ 4 (estimation, non confirmée par le jeu). Les mérites sont rattachés au système où se trouvait le pilote ; l\'état du système vient du journal de jeu des pilotes de l\'escadron.</div>';
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
