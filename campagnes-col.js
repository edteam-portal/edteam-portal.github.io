// MISSIONS DE COLONISATION (page BGS) : lignes dans les campagnes, fenetre d'une mission, cartes des initiatives, formulaires du commandement et des pilotes.
// Donnees : fonction serveur col_missions_vue() (script SQL 98), missions creees par creer_mission_col (commandement) ou lancer_initiative_col / proposer_initiative_col (pilotes, script SQL 99).
// Deux types : CHANTIERS (terminer un ou des chantiers deja releves par le plugin : avancement en tonnes) et SYSTEME (coloniser un systeme : 4 etapes). Aucune saisie des pilotes : tout vient des releves du plugin.
(function () {
    'use strict';
    var OR = '#FFD700';
    var ETAPES = ['Système revendiqué dans le jeu', 'Premier chantier ouvert', 'Chantier livré à 100 %', 'Station construite · système colonisé'];
    var ETAPE_COURT = ['en attente de revendication', 'système revendiqué', 'chantier ouvert', 'chantier livré', 'station construite'];
    var esc = function (s) { return typeof window.escapeHtml === 'function' ? window.escapeHtml(String(s == null ? '' : s)) : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
    var db = function () { return window.supabaseApp; };
    var moi = function () { return window.profilCommandant || {}; };
    var estCmd = function () { var m = moi(); return !!(m.est_amiral || m.est_officier || m.est_directeur); };
    var fmt = function (n) { return Number(n || 0).toLocaleString('fr-FR'); };
    var vue = null, typeCmd = 'CHANTIERS', typeIni = 'CHANTIERS';

    function pastille(txt, col) { return '<span class="camp-pastille" style="color:' + col + '; border-color:' + col + '; background:' + col + '1a;">' + txt + '</span>'; }
    function barre(pct, col, txt, h) { pct = Math.max(0, Math.min(100, Number(pct) || 0)); h = h || 16; return '<div style="position:relative; height:' + h + 'px; background:#111; border:1px solid #333; border-radius:2px; overflow:hidden;"><div style="width:' + pct + '%; height:100%; background:linear-gradient(90deg,' + col + '55,' + col + ');"></div><span style="position:absolute; inset:0; font-size:.7em; color:#fff; text-align:center; line-height:' + h + 'px; letter-spacing:1px; text-shadow:0 0 3px #000;">' + txt + '</span></div>'; }
    function nomStation(s) { var brut = String(s || ''), n = brut.replace(/^(Orbital|Planetary|Surface) Construction Site: /i, '').replace(/^\$EXT_PANEL_ColonisationShip[;:]\s*(?:#index=\d+;?\s*)?/, '').trim(); return n || (/ColonisationShip/i.test(brut) ? 'Premier site (navire de colonisation)' : 'Chantier'); }
    function trouver(id) { return ((vue && vue.missions) || []).filter(function (m) { return String(m.id) === String(id); })[0] || null; }
    function nomCampagne(id) { var c = (window.cacheCampagnes || []).filter(function (x) { return String(x.id) === String(id); })[0]; return c ? c.nom : null; }
    function titreType(m) { return m.type_col === 'CHANTIERS' ? 'TERMINER DES CHANTIERS' : 'COLONISER UN SYSTÈME'; }
    function resume(m) { return m.type_col === 'CHANTIERS' ? 'terminer ' + (m.chantiers || []).length + ' chantier' + ((m.chantiers || []).length > 1 ? 's' : '') : 'coloniser le système'; }
    function libelleBarre(m) { return m.type_col === 'CHANTIERS' ? fmt(m.tonnes_livrees) + ' / ' + fmt(m.tonnes_requises) + ' t' : ETAPE_COURT[m.etape_fait] || ''; }

    var API = {
        lire: async function () {
            try {
                var r = await db().rpc('col_missions_vue');
                if (r.error) { console.error('Erreur missions de colonisation :', r.error.message); vue = null; }
                else vue = r.data || null;
            } catch (e) { console.error(e); vue = null; }
            window.cacheCOL = vue;
            return vue;
        },

        lignes: function (campagneId) {
            return ((vue && vue.missions) || []).filter(function (m) { return m.origine === 'AMIRAL' && String(m.campagne_id) === String(campagneId); }).map(function (m) {
                var nb = Number(m.nb_livreurs) || 0;
                var totL = (m.livreurs || []).reduce(function (s, p) { return s + (Number(p.t) || 0); }, 0), partL = totL > 0 ? Math.round((Number(m.tonnes_moi) || 0) * 100 / totL) : 0;
                return { tag: 'COL #' + m.id + ' - ' + (m.type_col === 'CHANTIERS' ? 'CHANTIERS' : 'SYSTÈME'), domaine: 'COL', id: m.id, couleur: OR, pct: m.pct, vous: m.type_col === 'CHANTIERS' ? Math.round(m.pct * partL / 100) : null,
                    avatars: window.edteamCampagnes ? window.edteamCampagnes.avatars((m.livreurs || []).map(function (x) { return { u: x.u, nom: x.nom }; })) : '',
                    legendeTitre: m.type_col === 'CHANTIERS' ? 'Tonnes livrées sur les chantiers visés. La lueur néon à gauche : votre part des livraisons depuis la mission (' + partL + ' %).' : 'Étape de la colonisation du système : ' + (ETAPE_COURT[m.etape_fait] || ''),
                    clic: 'edteamCampagnesCOL.ouvrir(' + m.id + ')',
                    info: '<span class="inf">' + libelleBarre(m) + '</span>' + (m.terminee ? '<span style="color:#2fe07a;">TERMINÉE ✓</span>' : ''),
                    texte: '<b>' + esc(String(m.systeme).toUpperCase()) + '</b>' + (m.type_col === 'CHANTIERS' ? ' <em>· ' + (m.chantiers || []).length + ' chantier' + ((m.chantiers || []).length > 1 ? 's' : '') + '</em>' : '') };
            });
        },

        cartesInitiatives: function () {
            var cmd = estCmd(), m0 = moi();
            return ((vue && vue.missions) || []).filter(function (m) { return m.origine === 'PILOTE'; }).map(function (m) {
                var estCrea = String(m.auteur_id) === String(m0.user_id);
                var restant = m.expire_le ? Math.ceil((new Date(m.expire_le).getTime() - Date.now()) / 86400000) : null;
                var actions = (cmd ? '<button class="ini-btn" onclick="event.stopPropagation(); edteamCampagnesCOL.adopter(' + m.id + ')">TRANSFORMER EN MISSION</button><button class="ini-btn gris" onclick="event.stopPropagation(); edteamCampagnesCOL.cloturer(' + m.id + ', false)">RETIRER</button>'
                    : (estCrea ? '<button class="ini-btn gris" onclick="event.stopPropagation(); edteamCampagnesCOL.cloturer(' + m.id + ', true)">CLÔTURER</button>' : ''));
                return '<div class="data-row bloc init" style="padding:14px 18px; display:flex; flex-direction:column; gap:9px; cursor:pointer;" onclick="edteamCampagnesCOL.ouvrir(' + m.id + ')">'
                    + '<div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">' + pastille('COLONISATION', OR) + pastille(titreType(m), OR) + '<span style="flex:1;"></span>'
                    + '<span style="color:#FF4FD8; font-size:.78em; letter-spacing:1px;">★ INITIATIVE · CMDR ' + esc(String(m.createur || 'inconnu').toUpperCase()) + '</span></div>'
                    + '<div style="font-size:1.05em; color:#fff; font-weight:bold; letter-spacing:1px;">' + esc(String(m.systeme).toUpperCase()) + '</div>'
                    + barre(m.pct, OR, libelleBarre(m))
                    + (m.type_col === 'CHANTIERS' ? '<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; text-align:center;">'
                        + '<div style="border:1px dashed #333; padding:6px;"><div style="color:#888; font-size:.7em;">TONNES LIVRÉES</div><b style="color:#fff;">' + fmt(m.tonnes_livrees) + ' t</b></div>'
                        + '<div style="border:1px dashed #333; padding:6px;"><div style="color:#888; font-size:.7em;">RESTANTES</div><b style="color:' + OR + ';">' + fmt(Math.max(0, m.tonnes_requises - m.tonnes_livrees)) + ' t</b></div>'
                        + '<div style="border:1px dashed #333; padding:6px;"><div style="color:#888; font-size:.7em;">LIVREURS</div><b style="color:#fff;">' + (m.nb_livreurs || 0) + '</b></div></div>' : '')
                    + '<div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; color:#888; font-size:.78em;">Mon apport : <b style="color:#fff;">' + fmt(m.tonnes_moi) + ' t</b>'
                    + (restant == null ? '' : '<span style="margin-left:auto;">⏳ ' + (restant <= 0 ? 'clôture imminente sans livraison' : 'clôture dans ' + restant + ' j sans livraison') + '</span>') + '</div>'
                    + (actions ? '<div style="display:flex; gap:8px; flex-wrap:wrap;">' + actions + '</div>' : '') + '</div>';
            }).join('');
        },
        nbInitiatives: function () { return ((vue && vue.missions) || []).filter(function (m) { return m.origine === 'PILOTE'; }).length; },

        lignesCommandement: function (campagneId) {
            return ((vue && vue.missions) || []).filter(function (m) { return campagneId === 'initiatives' ? m.origine === 'PILOTE' : (m.origine === 'AMIRAL' && String(m.campagne_id) === String(campagneId)); }).map(function (m) {
                return '<div class="cmd-ordre" style="--oc:' + OR + ';"><div style="min-width:0;"><div class="cmd-ordre-nom">' + esc(String(m.systeme).toUpperCase()) + '</div><div class="cmd-ordre-tags">'
                    + '<span class="cmd-tag" style="color:' + OR + ';">COLONISATION</span><span class="cmd-tag" style="color:' + OR + ';">' + titreType(m) + '</span>' + (m.origine === 'PILOTE' ? '<span class="cmd-tag" style="color:#FF4FD8;">★ INITIATIVE</span>' : '') + '</div></div>'
                    + '<div class="cmd-ordre-actions"><button class="cmd-btn" onclick="edteamCampagnesCOL.cloturer(' + m.id + ', false)">CLÔTURER</button></div></div>';
            }).join('');
        },

        // ===== FENETRE D'UNE MISSION DE COLONISATION =====
        ouvrir: function (id) {
            if (typeof sonClic === 'function') sonClic();
            var m = trouver(id); if (!m) return;
            var estIni = m.origine === 'PILOTE', c = OR;
            var jours = Math.max(1, Math.ceil((Date.now() - new Date(m.date_emission).getTime()) / 86400000));
            var camp = !estIni ? nomCampagne(m.campagne_id) : null;
            var tot = (m.livreurs || []).reduce(function (s, p) { return s + (Number(p.t) || 0); }, 0), mien = Number(m.tonnes_moi) || 0, part = tot > 0 ? Math.round(mien * 100 / tot) : 0;
            var liv = (m.livreurs || []).map(function (p) { var estMoi = String(p.u) === String(moi().user_id); return '<div style="display:flex; justify-content:space-between; padding:7px 12px; border-bottom:1px solid rgba(255,255,255,.05); font-size:.9em;"><span style="color:' + (estMoi ? '#fff' : OR) + '; font-weight:bold; letter-spacing:1px;">CMDR ' + esc(String(p.nom || 'INCONNU').toUpperCase()) + (estMoi ? ' (VOUS)' : '') + '</span><b style="color:' + OR + ';">' + fmt(p.t) + ' t</b></div>'; }).join('')
                || '<div style="color:#666; text-align:center; font-size:.9em; padding:16px; font-style:italic;">Aucune livraison depuis le début de la mission.</div>';
            var dossier = '<div class="bgs-dossier" style="border-color:' + OR + '55; margin-top:14px;"><div class="tete" onclick="bgsToggleDossier(this)"><span style="color:' + OR + '; letter-spacing:2px; font-weight:bold;">LIVREURS</span><span style="color:#888; font-size:.85em;">' + (m.nb_livreurs || 0) + ' pilote' + (m.nb_livreurs > 1 ? 's' : '') + ' · tonnes livrées depuis la mission</span><span class="fl" style="color:' + OR + ';">▼</span></div><div class="corps" style="display:none;">' + liv + '</div></div>';
            var chantier = function (ch) { return '<div style="display:grid; grid-template-columns:minmax(0,1fr) 140px 110px; gap:10px; align-items:center; padding:7px 0; border-bottom:1px dashed #2a2a2a; font-size:.88em;"><span style="color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="' + esc(ch.station) + '">' + esc(nomStation(ch.station)) + (ch.termine ? ' ✓' : '') + '</span>' + barre(ch.complet ? 100 : Math.round(Number(ch.progression) * 100), OR, (ch.complet ? 100 : Math.round(Number(ch.progression) * 100)) + ' %', 12) + '<span style="color:#aaa; text-align:right;">' + (ch.complet ? 'livré' : fmt(Math.max(0, ch.requis - ch.livre)) + ' t restantes') + '</span></div>'; };
            var manq = (m.manquantes || []).length ? '<div class="bgs-sec" style="margin-top:14px;">MARCHANDISES LES PLUS MANQUANTES</div><div style="font-size:.85em; color:#bbb; line-height:1.8;">' + m.manquantes.map(function (x) { return esc(x.nom) + ' ' + fmt(x.reste) + ' t'; }).join(' · ') + '</div>' : '';
            var gauche, droite;
            if (m.type_col === 'CHANTIERS') {
                gauche = '<div class="bgs-cadre"><div class="bgs-cadre-t">EFFORT</div><div class="bgs-hero" style="border-color:' + c + '; margin-top:0;"><div class="h1"><span>TONNES LIVRÉES</span><b style="color:#fff;">' + fmt(m.tonnes_livrees) + ' / ' + fmt(m.tonnes_requises) + ' t</b></div><div class="h2"><span>TA PART</span><b style="color:' + c + ';">' + part + ' %</b></div>'
                    + '<div class="jgh"><i style="width: ' + m.pct + '%; opacity: 0.5; background: ' + c + ';"></i><i style="width: ' + Math.round(m.pct * part / 100) + '%; background: ' + c + '; box-shadow: 0 0 9px ' + c + ', 0 0 2px ' + c + ', inset 0 0 4px #fff9; border-right: 2px solid #fff8;"></i></div></div>' + dossier + '</div>';
                droite = '<div class="bgs-cadre"><div class="bgs-cadre-t">CHANTIERS CIBLÉS</div>' + (m.chantiers || []).map(chantier).join('') + manq + '</div>';
            } else {
                var etapes = ETAPES.map(function (t, i) { var etat = i < m.etape_fait ? 'fait' : (i === m.etape_fait ? 'cours' : 'attente'); return '<div style="display:flex; align-items:center; gap:10px; padding:6px 0; color:' + (etat === 'fait' ? '#fff' : etat === 'cours' ? OR : '#666') + ';"><span style="width:22px; height:22px; border-radius:50%; border:2px solid ' + (etat === 'attente' ? '#444' : OR) + '; background:' + (etat === 'fait' ? OR : 'transparent') + '; color:' + (etat === 'fait' ? '#000' : OR) + '; text-align:center; line-height:18px; font-size:.75em; font-weight:bold;">' + (etat === 'fait' ? '✓' : (i + 1)) + '</span><span>' + t + '</span></div>'; }).join('');
                gauche = '<div class="bgs-cadre"><div class="bgs-cadre-t">AVANCEMENT</div><div class="bgs-hero" style="border-color:' + c + '; margin-top:0;"><div class="h1"><span>' + (m.terminee ? 'MISSION ACCOMPLIE' : 'ÉTAPE ' + Math.min(4, m.etape_fait + 1) + ' SUR 4') + '</span><b style="color:#fff;">' + (ETAPE_COURT[m.etape_fait] || '') + '</b></div><div class="h2"><span>TA PART</span><b style="color:' + c + ';">' + fmt(mien) + ' t</b></div>'
                    + '<div class="jgh"><i style="width:' + m.pct + '%; opacity:.5; background:' + c + ';"></i></div></div><div style="margin-top:12px;">' + etapes + '</div>' + dossier + '</div>';
                droite = '<div class="bgs-cadre"><div class="bgs-cadre-t">' + ((m.chantiers || []).length ? 'CHANTIER' + (m.chantiers.length > 1 ? 'S' : '') + ' EN COURS' : 'CHANTIER') + '</div>'
                    + ((m.chantiers || []).length ? m.chantiers.map(chantier).join('') + manq : '<div style="color:#999; font-size:.88em; line-height:1.6; padding:10px 4px;">Aucun chantier relevé pour l\'instant : il apparaîtra dès qu\'un pilote de l\'escadron aura ouvert la construction et accosté.</div>') + '</div>';
            }
            var peutCloturer = estCmd() || (estIni && String(m.auteur_id) === String(moi().user_id));
            var boutons = (peutCloturer ? '<button class="ini-btn gris" onclick="edteamCampagnesCOL.cloturer(' + m.id + ', ' + (estIni && !estCmd()) + ')">' + (estIni ? (estCmd() ? 'RETIRER L\'INITIATIVE' : 'CLÔTURER MON INITIATIVE') : 'CLÔTURER LA MISSION') + '</button>' : '')
                + (estIni && estCmd() ? '<button class="ini-btn" onclick="edteamCampagnesCOL.adopter(' + m.id + ')">TRANSFORMER EN MISSION DE CAMPAGNE</button>' : '');
            var html = '<div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; padding-right:30px;">' + pastille('COLONISATION', OR) + ' ' + pastille(titreType(m), OR)
                + (estIni ? ' <span style="color:#FF4FD8; border:1px solid #FF4FD8; background:rgba(255,79,216,.1); padding:1px 8px; font-size:.8em; font-weight:bold; letter-spacing:2px;">★ INITIATIVE</span>' : '')
                + ' <b style="color:#fff; letter-spacing:2px; font-size:1.15em;">' + esc(String(m.systeme).toUpperCase()) + '</b><span style="color:#888;">· ' + (m.type_col === 'CHANTIERS' ? (m.chantiers || []).length + ' chantier' + ((m.chantiers || []).length > 1 ? 's à terminer' : ' à terminer') : 'système à coloniser') + '</span></div>'
                + '<div style="color:#777; font-size:.8em; margin-top:4px;">' + (estIni ? 'Initiative lancée par CMDR ' + esc(String(m.createur || 'inconnu').toUpperCase()) + ' il y a ' + jours + ' j' : 'Mission' + (camp ? ' de la campagne « ' + esc(camp) + ' »' : '') + (m.createur ? ' · ciblée par CMDR ' + esc(String(m.createur).toUpperCase()) : '')) + (m.briefing ? ' · « ' + esc(m.briefing) + ' »' : '') + '</div>'
                + '<div class="bgs-paysage"><div class="bgs-col-effort">' + gauche + '</div><div class="bgs-col-jeu">' + droite + (boutons ? '<div style="display:flex; gap:8px; flex-wrap:wrap;">' + boutons + '</div>' : '') + '</div></div>'
                + '<div style="color:#777; font-size:.75em; line-height:1.5; margin-top:14px;">ⓘ Tout vient des relevés du plugin des pilotes de l\'escadron (chantiers, livraisons). Un chantier n\'apparaît qu\'après le relevé d\'un pilote.</div>';
            var mo = document.getElementById('modal-ordre-resultat'); if (!mo) return;
            mo.querySelector('.modal-content').style.borderColor = c;
            mo.querySelector('.modal-content').style.boxShadow = '0 0 40px ' + c + '30';
            document.getElementById('ordre-resultat-corps').innerHTML = html;
            mo.style.display = 'flex';
        },

        // modifier une mission de colonisation (commandement) : la consigne seulement (les chantiers visés ne changent pas)
        editer: function (id) {
            var m = trouver(id); if (!m) return;
            window.edteamCampagnes.ouvrirEditionMission({ titre: 'MODIFIER LA MISSION DE COLONISATION · ' + String(m.systeme).toUpperCase(), sous: 'Les chantiers visés ne changent pas : pour d\'autres chantiers, créez une nouvelle mission.', types: null, type: null, briefing: m.briefing,
                enregistrer: async function (type, briefing) { var r = await db().rpc('modifier_mission_col', { p_id: Number(id), p_briefing: briefing || null }); return r.error ? (r.error.message || 'Échec.') : null; } });
        },
        supprimer: async function (id) {
            var m = trouver(id); if (!m) return;
            var ok = await demanderConfirmation('🗑 SUPPRIMER CETTE MISSION DE COLONISATION ?', 'La mission disparaît ; les chantiers et les livraisons ne sont pas touchés. Pour la garder dans l\'historique, <strong>clôturez-la</strong> plutôt.', '#FF3333');
            if (!ok) return;
            var r = await db().rpc('supprimer_mission_col', { p_id: Number(id) });
            if (r.error) { console.error(r.error); alert(r.error.message || 'Échec de la suppression.'); return; }
            if (typeof sonSucces === 'function') sonSucces();
            var mo = document.getElementById('modal-ordre-resultat'); if (mo) mo.style.display = 'none';
            if (window.edteamCampagnes) await window.edteamCampagnes.rafraichir();
        },
        cloturer: async function (id, parCreateur) {
            var m = trouver(id); if (!m) return;
            var ok = await demanderConfirmation(m.origine === 'PILOTE' ? (parCreateur ? 'CLÔTURER VOTRE INITIATIVE ?' : 'RETIRER CETTE INITIATIVE ?') : 'CLÔTURER CETTE MISSION DE COLONISATION ?', 'La mission disparaît des terminaux des pilotes ; les chantiers et les livraisons ne sont pas touchés.', m.origine === 'PILOTE' ? '#FF4FD8' : '#00F0FF');
            if (!ok) return;
            var r = await db().rpc('cloturer_mission_col', { p_id: Number(id) });
            if (r.error) { console.error(r.error); alert(r.error.message || 'Échec de la clôture.'); return; }
            if (typeof sonSucces === 'function') sonSucces();
            var mo = document.getElementById('modal-ordre-resultat'); if (mo) mo.style.display = 'none';
            if (window.edteamCampagnes) await window.edteamCampagnes.rafraichir();
        },
        adopter: async function (id) {
            var campagne = await window.edteamCampagnes.choisirCampagne('TRANSFORMER EN MISSION : QUELLE CAMPAGNE ?', 'L\'initiative devient une mission officielle de la campagne choisie (elle en prend la priorité) ; l\'annonce figure dans le journal de l\'escadron.');
            if (!campagne) return;
            var r = await db().rpc('adopter_initiative_col', { p_id: Number(id), p_campagne_id: Number(campagne) });
            if (r.error) { console.error(r.error); alert(r.error.message || 'Échec de la transformation.'); return; }
            var mo = document.getElementById('modal-ordre-resultat'); if (mo) mo.style.display = 'none';
            if (window.edteamCampagnes) await window.edteamCampagnes.rafraichir();
        },

        // ===== FORMULAIRES (commandement : prefixe « cmd-col », pilote : prefixe « ini-col ») =====
        dessiner: function () {
            [['cmd', typeCmd], ['ini', typeIni]].forEach(function (x) {
                var z = document.getElementById(x[0] + '-col-types');
                if (z) z.innerHTML = ['CHANTIERS', 'SYSTEME'].map(function (k) { return '<button type="button" class="cmd-pill' + (k === x[1] ? ' actif' : '') + '" style="--pc:' + OR + ';" onclick="edteamCampagnesCOL.choisirType(\'' + x[0] + '\', \'' + k + '\')">' + (k === 'CHANTIERS' ? 'TERMINER DES CHANTIERS' : 'COLONISER UN SYSTÈME') + '</button>'; }).join('');
                var ch = document.getElementById(x[0] + '-col-bloc-chantiers'); if (ch) ch.style.display = x[1] === 'CHANTIERS' ? '' : 'none';
            });
        },
        choisirType: function (qui, t) { if (typeof sonClic === 'function') sonClic(); if (qui === 'cmd') typeCmd = t; else typeIni = t; API.dessiner(); },
        // liste des chantiers ciblables d'un systeme (a la sortie du champ « systeme »)
        chargerChantiers: async function (qui) {
            var champ = document.getElementById(qui + '-col-systeme'), zone = document.getElementById(qui + '-col-liste');
            if (!champ || !zone) return;
            var sys = champ.value.trim();
            if (sys.length < 2) { zone.innerHTML = ''; return; }
            zone.innerHTML = '<div class="cmd-aide">Lecture des chantiers…</div>';
            var r = await db().rpc('col_chantiers_cibles', { p_systeme: sys });
            var liste = r.error ? [] : (r.data || []);
            if (!liste.length) { zone.innerHTML = '<div class="cmd-aide">Aucun chantier en cours relevé dans ce système. Un chantier n\'apparaît qu\'après le relevé d\'un pilote de l\'escadron.</div>'; return; }
            zone.innerHTML = liste.map(function (ch) {
                var reste = Math.max(0, ch.requis - ch.livre);
                return '<label style="display:flex; align-items:center; gap:10px; padding:7px 8px; border:1px solid #333; margin-top:6px; cursor:' + (ch.deja_cible ? 'not-allowed' : 'pointer') + '; ' + (ch.deja_cible ? 'opacity:.45;' : '') + '"><input type="checkbox" class="' + qui + '-col-chk" value="' + ch.market_id + '"' + (ch.deja_cible ? ' disabled' : '') + '><span style="flex:1; color:#fff; font-size:.88em;">' + esc(nomStation(ch.station)) + (ch.deja_cible ? ' <em style="color:#888;">(déjà ciblé)</em>' : '') + '</span><span style="color:#aaa; font-size:.8em;">' + Math.round(Number(ch.progression) * 100) + ' % · ' + fmt(reste) + ' t restantes</span></label>';
            }).join('');
        },
        choisis: function (qui) { return [].slice.call(document.querySelectorAll('.' + qui + '-col-chk:checked')).map(function (e) { return Number(e.value); }); },

        // commandement : envoi
        transmettre: async function () {
            if (typeof sonClic === 'function') sonClic();
            var btn = document.getElementById('btn-transmettre'), libelle = 'TRANSMETTRE LA MISSION DE COLONISATION';
            var camp = parseInt((document.getElementById('cmd-campagne') || {}).value || '0', 10) || 0;
            var sys = ((document.getElementById('cmd-col-systeme') || {}).value || '').trim().toUpperCase(), brief = ((document.getElementById('cmd-col-briefing') || {}).value || '').trim();
            var ids = typeCmd === 'CHANTIERS' ? API.choisis('cmd') : null;
            var erreur = !camp ? 'CHOISISSEZ UNE CAMPAGNE' : (typeCmd === 'CHANTIERS' ? (!ids.length ? 'CHOISISSEZ AU MOINS UN CHANTIER' : '') : (sys.length < 2 ? 'SYSTÈME REQUIS' : ''));
            if (erreur) { btn.innerText = 'ERREUR : ' + erreur; setTimeout(function () { btn.innerText = libelle; }, 2200); return; }
            btn.innerText = 'TRANSMISSION…'; btn.style.pointerEvents = 'none';
            var r = await db().rpc('creer_mission_col', { p_campagne_id: camp, p_type: typeCmd, p_systeme: sys, p_market_ids: ids, p_briefing: brief || null });
            btn.style.pointerEvents = 'auto';
            if (r.error) { console.error(r.error); var msg = String(r.error.message || 'Refusé.'); btn.innerText = msg.length > 60 ? 'REFUSÉ : VOIR LA CONSOLE' : 'REFUSÉ : ' + msg.toUpperCase(); setTimeout(function () { btn.innerText = libelle; }, 3200); return; }
            if (typeof sonSucces === 'function') sonSucces();
            btn.innerText = 'MISSION DÉPLOYÉE';
            setTimeout(function () {
                document.getElementById('cmd-col-systeme').value = ''; document.getElementById('cmd-col-briefing').value = ''; document.getElementById('cmd-col-liste').innerHTML = '';
                btn.innerText = libelle;
                if (typeof fermerModal === 'function') fermerModal('modal-commandement');
                window.edteamCampagnes.rafraichir();
            }, 1200);
        },
        // pilote : envoi d'une initiative
        lancerIni: async function (propose) {
            var btn = document.getElementById('btn-lancer-initiative'), libelle = propose ? "PROPOSER L'INITIATIVE" : "LANCER L'INITIATIVE";
            var sys = ((document.getElementById('ini-col-systeme') || {}).value || '').trim().toUpperCase(), msg = ((document.getElementById('ini-message') || {}).value || '').trim();
            var ids = typeIni === 'CHANTIERS' ? API.choisis('ini') : null;
            var erreur = typeIni === 'CHANTIERS' ? (!ids.length ? 'CHOISISSEZ AU MOINS UN CHANTIER' : '') : (sys.length < 2 ? 'SYSTÈME REQUIS' : '');
            if (erreur) { btn.innerText = 'ERREUR : ' + erreur; setTimeout(function () { btn.innerText = libelle; }, 2200); return; }
            btn.innerText = 'TRANSMISSION…'; btn.style.pointerEvents = 'none';
            var r = await db().rpc(propose ? 'proposer_initiative_col' : 'lancer_initiative_col', { p_type: typeIni, p_systeme: sys, p_market_ids: ids, p_message: msg || null });
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
                document.getElementById('ini-col-systeme').value = ''; document.getElementById('ini-col-liste').innerHTML = ''; document.getElementById('ini-message').value = '';
                var aide = document.getElementById('ini-aide'); if (aide) aide.style.color = '';
                btn.innerText = libelle; btn.style.pointerEvents = 'auto';
                if (typeof window.rafraichirModeIni === 'function') window.rafraichirModeIni(true);
                window.edteamCampagnes.rafraichir();
            }, 1200);
        }
    };
    window.edteamCampagnesCOL = API;
})();
