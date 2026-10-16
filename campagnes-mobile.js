// MISSIONS POWERPLAY ET DE COLONISATION (mobile) : lignes dans les campagnes, cartes des initiatives. Details en depliant la ligne (pas de fenetre).
// Donnees : pp_missions_vue (SQL 96) et col_missions_vue (SQL 98). Un pilote SANS puissance voit les missions Powerplay grisees (cadenas). Les formulaires de creation restent sur PC.
(function () {
    'use strict';
    var PPC = '#8A7CFF', OR = '#FFD700';
    var TYPE_PP = { RENFORCEMENT: ['Renforcement', '#00FF66'], SAPE: ['Sape', '#FF3333'], ACQUISITION: ['Acquisition', '#EDEDED'] };
    var ETAT = { Exploited: 'Exploité', Fortified: 'Fortifié', Stronghold: 'Bastion', Unoccupied: 'Inoccupé' };
    var ORIGINE = { PRIMES: 'Primes', COMBAT: 'Combat', MISSIONS: 'Missions', LIVRAISONS: 'Livraisons', COMMERCE: 'Commerce', EXPLORATION: 'Exploration', SAUVETAGE: 'Sauvetage', COMMUNAUTE: 'Communauté', AUTRE: 'Non identifiée' };
    var ETAPE_COURT = ['en attente de revendication', 'système revendiqué', 'chantier ouvert', 'chantier livré', 'station construite'];
    var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
    var fmt = function (n) { return Number(n || 0).toLocaleString('fr-FR'); };
    var cp = function (m) { return Math.round(Number(m || 0) / 4); };
    var db = function () { return window.supabaseApp || (typeof supabaseApp !== 'undefined' ? supabaseApp : null); };
    var moi = function () { return window.profilCommandant || {}; };
    var estCmd = function () { var m = moi(); return !!(m.est_amiral || m.est_officier || m.est_directeur); };
    var pp = null, col = null, ts = 0;

    function barre(pct, col2, txt) { pct = Math.max(0, Math.min(100, Number(pct) || 0)); return '<div style="position:relative; height:14px; background:#111; border:1px solid #333; border-radius:3px; overflow:hidden;"><div style="width:' + pct + '%; height:100%; background:linear-gradient(90deg,' + col2 + '55,' + col2 + ');"></div><span style="position:absolute; inset:0; font-size:.62em; color:#fff; text-align:center; line-height:14px; letter-spacing:1px; text-shadow:0 0 3px #000;">' + txt + '</span></div>'; }
    function pastille(txt, c) { return '<span style="border:1px solid ' + c + '; color:' + c + '; background:' + c + '1a; padding:1px 7px; border-radius:3px; font-weight:bold; letter-spacing:1px; font-size:.62em; white-space:nowrap;">' + txt + '</span>'; }
    function aPuissance() { return !!(pp && pp.puissance); }
    function nomStation(s) { var brut = String(s || ''), n = brut.replace(/^(Orbital|Planetary|Surface) Construction Site: /i, '').replace(/^\$EXT_PANEL_ColonisationShip[;:]\s*(?:#index=\d+;?\s*)?/, '').trim(); return n || (/ColonisationShip/i.test(brut) ? 'Premier site (navire de colonisation)' : 'Chantier'); }
    function age(iso) { if (!iso) return ''; var h = (Date.now() - new Date(iso).getTime()) / 3600000; if (h < 1) return 'il y a ' + Math.max(1, Math.round(h * 60)) + ' min'; if (h < 48) return 'il y a ' + Math.round(h) + ' h'; return 'il y a ' + Math.round(h / 24) + ' j'; }
    function ligneDetail(titre, v) { return '<div style="display:flex; justify-content:space-between; gap:10px; padding:4px 0; border-bottom:1px solid rgba(255,255,255,.05); font-size:.78em;"><span style="color:#888;">' + titre + '</span><b style="color:#fff; font-weight:normal; text-align:right;">' + v + '</b></div>'; }

    function detailPP(m) {
        var e = m.etat, pc = e && e.progres != null ? Math.round(Number(e.progres) * 100) : null;
        var orig = Object.keys(m.origines || {}).map(function (k) { return [k, Number(m.origines[k]) || 0]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 3).map(function (o) { return (ORIGINE[o[0]] || o[0]) + ' ' + fmt(o[1]); }).join(' · ');
        var pil = (m.pilotes || []).slice(0, 5).map(function (p) { return 'CMDR ' + esc(String(p.nom || '?').toUpperCase()) + ' ' + fmt(p.m); }).join(' · ');
        return ligneDetail('Mérites de l\'escadron', fmt(m.merites_total) + ' · ≈ ' + fmt(cp(m.merites_total)) + ' CP')
            + ligneDetail('Depuis jeudi 07:00 UTC', fmt(m.merites_cycle) + ' · ≈ ' + fmt(cp(m.merites_cycle)) + ' CP')
            + ligneDetail('Mon apport', fmt(m.merites_moi) + ' · ≈ ' + fmt(cp(m.merites_moi)) + ' CP')
            + (orig ? ligneDetail('Origines', esc(orig)) : '')
            + (pil ? ligneDetail('Participants', pil) : '')
            + (e ? ligneDetail('Système', (e.controlling ? esc(e.controlling) : 'aucune puissance') + (e.etat ? ' · ' + (ETAT[e.etat] || esc(e.etat)) : '') + (pc != null ? ' · contrôle ' + pc + ' %' : ''))
                  + ligneDetail('Observé', age(e.observe_le) + (e.observe_par ? ' par ' + esc(String(e.observe_par).toUpperCase()) : '')) : '<div style="color:#999; font-size:.76em; padding:6px 0;">Système pas encore observé : relevé au prochain passage d\'un pilote de l\'escadron.</div>')
            + '<div style="color:#666; font-size:.66em; margin-top:6px; line-height:1.5;">CP estimés = mérites ÷ 4 (estimation). Résultats officiels : classement Powerplay du jeu (jeudi 07:00 UTC).</div>';
    }
    function detailCOL(m) {
        var ch = (m.chantiers || []).map(function (c) { var pc = c.complet ? 100 : Math.round(Number(c.progression) * 100); return ligneDetail(esc(nomStation(c.station)) + (c.termine ? ' ✓' : ''), pc + ' % · ' + (c.complet ? 'livré' : fmt(Math.max(0, c.requis - c.livre)) + ' t restantes')); }).join('');
        var manq = (m.manquantes || []).map(function (x) { return esc(x.nom) + ' ' + fmt(x.reste) + ' t'; }).join(' · ');
        var liv = (m.livreurs || []).slice(0, 5).map(function (p) { return 'CMDR ' + esc(String(p.nom || '?').toUpperCase()) + ' ' + fmt(p.t) + ' t'; }).join(' · ');
        return (m.type_col === 'SYSTEME' ? ligneDetail('Étape', Math.min(4, m.etape_fait + 1) + ' sur 4 · ' + ETAPE_COURT[m.etape_fait]) : ligneDetail('Tonnes', fmt(m.tonnes_livrees) + ' / ' + fmt(m.tonnes_requises) + ' t'))
            + ligneDetail('Mon apport', fmt(m.tonnes_moi) + ' t') + (manq ? ligneDetail('Manquant', manq) : '') + (liv ? ligneDetail('Livreurs', liv) : '') + (ch || '<div style="color:#999; font-size:.76em; padding:6px 0;">Aucun chantier relevé pour l\'instant.</div>');
    }

    function carteLigne(clef, tag, c, titre, sous, pct, libBarre, detail, gris) {
        var id = 'mcp-' + clef;
        return '<div style="border-top:1px dashed #2a2a2a; padding:8px 0; ' + (gris ? 'opacity:.4; filter:grayscale(1);' : '') + '">'
            + '<div ' + (gris ? '' : 'onclick="var d=document.getElementById(\'' + id + '\'); d.style.display = d.style.display === \'none\' ? \'block\' : \'none\'; if (typeof sonClic === \'function\') sonClic();"') + ' style="cursor:' + (gris ? 'not-allowed' : 'pointer') + ';">'
            + '<div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">' + pastille(tag, c) + '<b style="color:#fff; font-size:.85em; overflow-wrap:anywhere;">' + esc(titre) + '</b><span style="flex:1;"></span><span style="color:#666;">' + (gris ? '🔒' : '▾') + '</span></div>'
            + '<div style="color:#888; font-size:.7em; margin:3px 0 5px;">' + sous + '</div>' + barre(pct, c, libBarre) + '</div>'
            + (gris ? '' : '<div id="' + id + '" style="display:none; margin-top:8px;">' + detail + '</div>') + '</div>';
    }

    var API = {
        lire: async function (force) {
            if (!force && ts && Date.now() - ts < 120000) return;
            ts = Date.now();
            try {
                var r = await Promise.all([db().rpc('pp_missions_vue'), db().rpc('col_missions_vue')]);
                pp = r[0].error ? null : (r[0].data || null);
                col = r[1].error ? null : (r[1].data || null);
            } catch (e) { pp = null; col = null; }
        },
        total: function () { return ((pp && pp.missions) || []).filter(function (m) { return m.origine === 'AMIRAL'; }).length + ((col && col.missions) || []).filter(function (m) { return m.origine === 'AMIRAL'; }).length; },
        nb: function (campagneId) {
            return ((pp && pp.missions) || []).concat((col && col.missions) || []).filter(function (m) { return m.origine === 'AMIRAL' && String(m.campagne_id) === String(campagneId); }).length;
        },
        // lignes d'une campagne
        lignes: function (campagneId) {
            var html = '';
            ((pp && pp.missions) || []).filter(function (m) { return m.origine === 'AMIRAL' && String(m.campagne_id) === String(campagneId); }).forEach(function (m) {
                var t = TYPE_PP[m.type_pp] || [m.type_pp, '#aaa'], pc = m.etat && m.etat.progres != null ? Math.round(Number(m.etat.progres) * 100) : null, gris = !aPuissance();
                html += carteLigne('pp' + m.id, 'POWERPLAY', PPC, String(m.systeme).toUpperCase(), t[0] + ' · ' + (m.nb_pilotes || 0) + ' pilote' + (m.nb_pilotes > 1 ? 's' : '') + (gris ? '' : ' · ' + fmt(m.merites_total) + ' mérites'), pc == null ? 0 : pc, pc == null ? 'pas encore observé' : 'contrôle ' + pc + ' %', detailPP(m), gris);
            });
            ((col && col.missions) || []).filter(function (m) { return m.origine === 'AMIRAL' && String(m.campagne_id) === String(campagneId); }).forEach(function (m) {
                var lib = m.type_col === 'CHANTIERS' ? fmt(m.tonnes_livrees) + ' / ' + fmt(m.tonnes_requises) + ' t' : ETAPE_COURT[m.etape_fait];
                html += carteLigne('col' + m.id, 'COLONISATION', OR, String(m.systeme).toUpperCase(), (m.type_col === 'CHANTIERS' ? 'terminer ' + (m.chantiers || []).length + ' chantier' + ((m.chantiers || []).length > 1 ? 's' : '') : 'coloniser le système') + ' · ' + (m.nb_livreurs || 0) + ' livreur' + (m.nb_livreurs > 1 ? 's' : '') + (m.terminee ? ' · TERMINÉE ✓' : ''), m.pct, lib, detailCOL(m), false);
            });
            return html;
        },
        // cartes des initiatives Powerplay et de colonisation
        initiatives: function () {
            var h = '', moi0 = moi(), cmd = estCmd();
            var boutons = function (m, domaine) {
                var estCrea = String(m.auteur_id) === String(moi0.user_id);
                return (cmd ? '<button class="mcp-btn" onclick="event.stopPropagation(); edteamCampagnesMob.adopter(\'' + domaine + '\', ' + m.id + ')">TRANSFORMER EN MISSION</button><button class="mcp-btn gris" onclick="event.stopPropagation(); edteamCampagnesMob.cloturer(\'' + domaine + '\', ' + m.id + ')">RETIRER</button>'
                    : (estCrea ? '<button class="mcp-btn gris" onclick="event.stopPropagation(); edteamCampagnesMob.cloturer(\'' + domaine + '\', ' + m.id + ')">CLÔTURER</button>' : ''));
            };
            ((pp && pp.missions) || []).filter(function (m) { return m.origine === 'PILOTE'; }).forEach(function (m) {
                var t = TYPE_PP[m.type_pp] || [m.type_pp, '#aaa'], pc = m.etat && m.etat.progres != null ? Math.round(Number(m.etat.progres) * 100) : null, gris = !aPuissance();
                h += '<div class="xc init"><div style="color:#FF4FD8; font-size:.62em; letter-spacing:1px; margin-bottom:4px;">★ INITIATIVE · CMDR ' + esc(String(m.createur || 'inconnu').toUpperCase()) + '</div>'
                    + carteLigne('ini-pp' + m.id, 'POWERPLAY', PPC, String(m.systeme).toUpperCase(), t[0] + ' · ' + (m.nb_pilotes || 0) + ' pilote' + (m.nb_pilotes > 1 ? 's' : ''), pc == null ? 0 : pc, pc == null ? 'pas encore observé' : 'contrôle ' + pc + ' %', detailPP(m), gris)
                    + (gris ? '' : '<div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:6px;">' + boutons(m, 'pp') + '</div>') + '</div>';
            });
            ((col && col.missions) || []).filter(function (m) { return m.origine === 'PILOTE'; }).forEach(function (m) {
                var lib = m.type_col === 'CHANTIERS' ? fmt(m.tonnes_livrees) + ' / ' + fmt(m.tonnes_requises) + ' t' : ETAPE_COURT[m.etape_fait];
                h += '<div class="xc init"><div style="color:#FF4FD8; font-size:.62em; letter-spacing:1px; margin-bottom:4px;">★ INITIATIVE · CMDR ' + esc(String(m.createur || 'inconnu').toUpperCase()) + '</div>'
                    + carteLigne('ini-col' + m.id, 'COLONISATION', OR, String(m.systeme).toUpperCase(), (m.type_col === 'CHANTIERS' ? 'terminer des chantiers' : 'coloniser le système') + ' · ' + (m.nb_livreurs || 0) + ' livreur' + (m.nb_livreurs > 1 ? 's' : ''), m.pct, lib, detailCOL(m), false)
                    + '<div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:6px;">' + boutons(m, 'col') + '</div></div>';
            });
            return h;
        },
        cloturer: async function (domaine, id) {
            if (!confirm('Clôturer cette initiative ? Les efforts déjà enregistrés sont conservés.')) return;
            var r = await db().rpc(domaine === 'pp' ? 'cloturer_mission_pp' : 'cloturer_mission_col', { p_id: Number(id) });
            if (r.error) { alert(r.error.message || 'Échec de la clôture.'); return; }
            await API.lire(true);
            if (typeof window.chargerDirectivesMobile === 'function') window.chargerDirectivesMobile(true);
        },
        adopter: async function (domaine, id) {
            var camps = ((window.cacheCampagnesMob) || []).slice().sort(function (a, b) { return (a.priorite - b.priorite) || String(a.nom).localeCompare(String(b.nom)); });
            if (!camps.length) { alert('Aucune campagne active : l\'Amiral doit en créer une avant de transformer une initiative en mission.'); return; }
            var rep = prompt('Dans quelle campagne ?\n' + camps.map(function (c, i) { return (i + 1) + ' · ' + c.nom; }).join('\n') + '\n\nTapez le numéro :');
            var n = parseInt(rep || '0', 10); if (!n || n < 1 || n > camps.length) return;
            var r = await db().rpc(domaine === 'pp' ? 'adopter_initiative_pp' : 'adopter_initiative_col', { p_id: Number(id), p_campagne_id: Number(camps[n - 1].id) });
            if (r.error) { alert(r.error.message || 'Échec de la transformation.'); return; }
            await API.lire(true);
            if (typeof window.chargerDirectivesMobile === 'function') window.chargerDirectivesMobile(true);
        }
    };
    var st = document.createElement('style');
    st.textContent = '.mcp-btn { background: rgba(255,79,216,.1); border: 1px solid #FF4FD8; color: #FF4FD8; padding: 7px 10px; font-family: inherit; font-size: .68em; letter-spacing: 1px; border-radius: 3px; } .mcp-btn.gris { border-color: #666; color: #aaa; background: transparent; }';
    document.head.appendChild(st);
    window.edteamCampagnesMob = API;
})();
