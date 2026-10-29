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
        return (Number(m.plafond_cp) > 0 ? ligneDetail('Objectif du commandement', fmt(m.plafond_cp) + ' CP · réalisé ≈ ' + fmt(cp(m.merites_total)) + ' (' + Math.min(100, Math.round(100 * cp(m.merites_total) / Number(m.plafond_cp))) + ' %)') : '')
            + ligneDetail('Mérites de l\'escadron', fmt(m.merites_total) + ' · ≈ ' + fmt(cp(m.merites_total)) + ' CP')
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

    // ===== CAMPAGNES (mobile) : meme langage que le PC, pense pour le pouce =====
    // Une campagne = un bloc a sa couleur (type en gros, priorite, avancement moyen) ; une mission = une ligne dont le FOND est la barre
    // (remplissage = effort de l'escadron, lueur neon = ma part) ; guerre et election ressortent avec leur score ; un toucher ouvre le detail.
    var K_CONFLIT = { GUERRE: '#FF3B3B', ELECTION: '#4DA3FF' };
    var COUL_CAMP = { ATTAQUE: '#FF3333', DEFENSE: '#00F0FF', MAINTIEN: '#00FF66', CONQUETE: '#EDEDED' };
    var LIB_CAMP = { ATTAQUE: 'ATTAQUE', DEFENSE: 'DÉFENSE', MAINTIEN: 'MAINTIEN', CONQUETE: 'CONQUÊTE' };
    var COUL_BGS = '#FF7100';
    function clefPli() { return 'edteam_camp_repliees_' + (moi().user_id || ''); }
    function lirePli() { try { var v = JSON.parse(localStorage.getItem(clefPli()) || '[]'); return Array.isArray(v) ? v.map(String) : []; } catch (e) { return []; } }
    function ecrirePli(l) { try { localStorage.setItem(clefPli(), JSON.stringify(l)); } catch (e) { /* stockage indisponible */ } }
    function avatarsMob(liste) {
        var P = window.EDTEAMPhotos;
        if (!P || !liste || !liste.length) return '';
        // 5 emplacements au plus : au-dela, 4 avatars et une pastille « +N »
        var tous = liste.length <= 5, vus = tous ? liste : liste.slice(0, 4), reste = tous ? [] : liste.slice(4);
        return '<span class="mc-avs">' + vus.map(function (x) { return P.avatar({ uid: x.u, nom: x.nom, role: 'pilote', taille: 22 }); }).join('')
            + (reste.length ? '<span style="width:22px;height:22px;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:#1a1a1a;border:1px solid #555;color:#ccc;font-size:.62em;font-weight:bold;box-shadow:0 0 0 2px #0a0a0a;">+' + reste.length + '</span>' : '') + '</span>';
    }
    // jauge d'influence (comme sur le PC) : gris = influence qui n'a pas bouge depuis le dernier tick (ou sur 48 h), plein = gain, raye = perte ; couleur = resultat de la directive ; trait blanc = valeur avant le tick
    function jaugeMob(o, res) {
        var U = window.EdteamUtile;
        if (!U || !res || !res.donnees || res.conflit || res.influence == null) return '';
        var cur = Math.max(0, Math.min(100, Number(res.influence) * 100)), vt = U.variation ? U.variation(o, res) : null;
        if (!vt) return '';
        var d = vt.v, prev = Math.max(0, Math.min(100, cur - d)), bas = Math.min(cur, prev), col = U.COUL[vt.sens] || '#6f8196';
        var h = '<span class="mc-jg" style="--s:' + col + ';"><i style="width:' + bas + '%;"></i>';
        if (Math.abs(d) >= 0.05) h += '<b class="' + (d > 0 ? 'm' : 'h') + '" style="left:' + bas + '%; width:' + Math.abs(cur - prev) + '%;"></b><u style="left:' + prev + '%;"></u>';
        return h + '</span>';
    }
    function ligneMob(o) {
        var c = o.c, fond = o.fondRes || 'none';      // plus de barre de progression ni de pourcentage d'effort (supprimes sur le PC) : seul le fond de resultat reste
        var l3 = (o.avs || '') + (o.etats ? '<span class="mc-et">' + o.etats + '</span>' : '') + (o.pips ? '<span style="margin-left:auto;">' + o.pips + '</span>' : '');
        return '<div class="mc-row' + (o.k ? ' conf' : '') + (o.gris ? ' gris' : '') + '" style="--c:' + c + ';' + (o.k ? ' --k:' + o.k + ';' : '') + ' background:' + fond + ';"' + (o.clic ? ' onclick="' + o.clic + '"' : '') + '>'
            + '<div class="l1"><span class="mc-tag" style="color:' + c + '; border-color:' + c + ';">' + o.tag + '</span><b class="mc-sys">' + o.sys + '</b></div>'
            + '<div class="l2"><span class="mc-g">' + (o.g || '') + '</span><span class="mc-d">' + (o.d || '') + '</span></div>' + (o.jg || '')
            + (l3 ? '<div class="l3">' + l3 + '</div>' : '') + '</div>';
    }
    function ligneBgsMob(o, index, ctx) {
        var rs = ctx.resume[o.id] || { nb_participants: 0, types: {}, pilotes: [] }, av = ctx.avanc(o, rs), res = ctx.resultats.dir[o.id] || null;
        var vous = Math.round(av.pct * av.part / 100), k = K_CONFLIT[o.type_ordre] || null, donnees = !!(res && res.donnees);
        var sens = ctx.sens(o, res), cs = ctx.SENS[sens || 'att'], d, kk = null;
        if (donnees && res.conflit && k) {
            var f = String(o.faction_cible || '').trim().toLowerCase(), e1 = String(res.conflit.f1 || '').trim().toLowerCase() === f;
            var sm = Number(e1 ? res.conflit.s1 : res.conflit.s2), sa = Number(e1 ? res.conflit.s2 : res.conflit.s1);
            k = sm > sa ? '#2fe07a' : sm < sa ? '#FF3B3B' : '#4DA3FF';      // vert : on gagne, rouge : on perd, bleu : egalite
            d = '<span class="mc-score" style="--k:' + k + ';">' + sm + ' – ' + sa + '</span>'; kk = k;
        } else if (donnees) {
            var vt = window.EdteamUtile && window.EdteamUtile.variation ? window.EdteamUtile.variation(o, res) : null, vv = vt ? vt.v : res.variation;
            if (vt) cs = ctx.SENS[vt.sens] || cs;
            var fl = vv === null || vv === undefined ? '' : (Math.abs(vv) < 0.05 ? '=' : vv > 0 ? '▲' : '▼');
            d = '<b style="color:#fff;">' + ctx.pct(res.influence) + ' %</b>' + (fl ? ' <span style="color:' + cs + ';" title="' + (vt ? 'Évolution ' + vt.fen : 'Évolution depuis la directive') + '">' + fl + (fl === '=' ? '' : ' ' + ctx.pts(vv)) + '</span>' : '');
        } else d = '<span style="color:#666;">—</span>';
        var typeFr = o.type_ordre === 'ELECTION' ? 'ÉLECTION' : String(o.type_ordre || '');
        return (window.EdteamConflitEvt ? window.EdteamConflitEvt.bandeau(o, { mobile: true }) : '') + ligneMob({ c: COUL_BGS, k: kk, tag: '#' + o.id + ' · ' + typeFr, sys: esc(String(o.systeme_cible || '').toUpperCase()), pct: (window.cacheQuotasBgs && window.cacheQuotasBgs[o.id]) ? null : av.pct, vous: (window.cacheQuotasBgs && window.cacheQuotasBgs[o.id]) ? 0 : vous, g: esc(String(o.faction_cible || '').toUpperCase()), d: d,
            jg: donnees ? jaugeMob(o, res) : '', avs: avatarsMob(rs.pilotes), etats: window.edteamEtats && donnees ? window.edteamEtats.badges(res, true) : '', fondRes: window.EdteamUtile ? window.EdteamUtile.fondLigne(o, res, ctx.sens) : '',
            pips: window.EdteamQuotas && window.cacheQuotasBgs && window.cacheQuotasBgs[o.id] ? window.EdteamQuotas.pips(o, window.cacheQuotasBgs[o.id]) : '', clic: 'ouvrirModalOrdre(' + index + ', \'' + COUL_BGS + '\')' });
    }
    // ligne Powerplay comme sur le PC : barre du jeu (4 zones, triangle blanc = au dernier tick, orange = maintenant), etat et net du cycle, fond de resultat (net / pale) ; un appui ouvre la feuille de la mission
    function lignePPMob(m) {
        var t = TYPE_PP[m.type_pp] || [m.type_pp, '#aaa'], gris = !aPuissance(), E = window.EdteamPPEtat;
        var c = E && !gris && m.type_pp !== 'ACQUISITION' ? E.calc(m) : null, pc = m.etat && m.etat.progres != null ? Math.round(Number(m.etat.progres) * 100) : null, d;
        if (c) d = E.resume(c);
        else d = m.etat ? '<span style="color:#9ab; letter-spacing:1px; text-transform:uppercase;">' + (ETAT[m.etat.etat] || esc(m.etat.etat || 'sans état')) + (pc != null ? ' · ' + pc + ' %' : '') + '</span>' : '<span style="color:#888;">pas encore observé</span>';
        var pl = Number(m.plafond_cp) || 0;
        return '<div class="mc-w">' + ligneMob({ c: PPC, tag: 'PP #' + m.id + ' · ' + t[0].toUpperCase(), sys: esc(String(m.systeme).toUpperCase()), gris: gris,
            g: t[0] + ' · ' + fmt(m.merites_total) + ' mérites' + (pl > 0 ? ' · objectif ≈ ' + fmt(cp(m.merites_total)) + ' / ' + fmt(pl) + ' CP' : ''), d: d,
            jg: c ? '<div style="margin-top:6px;">' + E.barre(c, false) + '</div>' : '', fondRes: c && window.EdteamUtile ? window.EdteamUtile.fond(c.sens, c.pale) : '',
            avs: gris ? '' : avatarsMob((m.pilotes || []).map(function (x) { return { u: x.u, nom: x.nom }; })),
            clic: gris ? '' : 'edteamCampagnesMob.ouvrirPP(' + m.id + ')' }) + '</div>';
    }
    function ligneCOLMob(m) {
        var lib = m.type_col === 'CHANTIERS' ? fmt(m.tonnes_livrees) + ' / ' + fmt(m.tonnes_requises) + ' t' : ETAPE_COURT[m.etape_fait];
        var vous = m.type_col === 'CHANTIERS' && Number(m.tonnes_requises) > 0 ? Math.round(100 * (Number(m.tonnes_moi) || 0) / Number(m.tonnes_requises)) : null, id = 'mcd-col' + m.id;
        return '<div class="mc-w">' + ligneMob({ c: OR, tag: 'COL · ' + (m.type_col === 'CHANTIERS' ? 'CHANTIERS' : 'SYSTÈME'), sys: esc(String(m.systeme).toUpperCase()), pct: m.pct, vous: vous,
            g: (m.type_col === 'CHANTIERS' ? 'terminer ' + (m.chantiers || []).length + ' chantier' + ((m.chantiers || []).length > 1 ? 's' : '') : 'coloniser') + ' · ' + (m.nb_livreurs || 0) + ' livreur' + (m.nb_livreurs > 1 ? 's' : ''),
            d: '<b style="color:#fff;">' + lib + '</b>' + (m.terminee ? ' <span style="color:#2fe07a;">✓</span>' : ''), clic: 'edteamCampagnesMob.deplier(\'' + id + '\')' })
            + '<div class="mc-det" id="' + id + '" style="display:none;">' + detailCOL(m) + '</div></div>';
    }
    // tri alphabétique par système ; un système qui a plusieurs missions est regroupé sous un en-tête « ◈ SYSTÈME · n missions »
    function groupesSys(l, ordre) {
        var ord = (ordre || []).map(function (x) { return String(x).toUpperCase(); }), rg = function (x) { var k = ord.indexOf(x.s); return k < 0 ? 1e9 : k; };   // ordre choisi par l'Amiral sur PC, puis alphabetique
        l = l.map(function (x, i) { x.o = i; return x; }).sort(function (a, b) { return (rg(a) - rg(b)) || a.s.localeCompare(b.s, 'fr') || (a.o - b.o); });
        var out = [], i = 0;
        while (i < l.length) {
            var j = i; while (j < l.length && l[j].s === l[i].s) j++;
            var lot = l.slice(i, j).map(function (x) { return x.h; }).join('');
            out.push(j - i > 1 && l[i].s ? '<div class="mc-sys"><div class="mc-sys-t">◈ ' + esc(l[i].s) + ' <span>· ' + (j - i) + ' missions</span></div>' + lot + '</div>' : lot);
            i = j;
        }
        return out;
    }
    // campagne d'un AUTRE escadron (invitation) : pastille ALLIÉE · TAG, lecture seule
    function tagAllie(c) {
        var e = String(moi().escadron_id || '').trim().toUpperCase(), h = String(c.escadron_id || '').trim();
        if (!h || c.synthetique || (e && e !== 'INDEPENDANT' && h.toUpperCase() === e)) return '';
        var I = window.edteamInvitations;
        return I ? I.htmlPastille('ALLIE', h) : '';
    }
    function blocCampagne(g, ctx) {
        var c = g.c, cc = COUL_CAMP[c.type_campagne] || '#aaa', prio = c.priorite || 3, pk = prio === 1 ? 'c' : prio === 2 ? 'h' : 'n';
        var lignes = [], pcts = [];
        // mesure sans objectif (SQL 111) : directives de la campagne ou au moins un pilote a agi depuis le dernier tick (a la place du pourcentage d'avancement)
        var qm = window.cacheQuotasBgs, actif = (qm && g.items.length && g.items.every(function (x) { return qm[x.o.id] && qm[x.o.id].agi !== undefined; })) ? { total: g.items.length, n: g.items.filter(function (x) { return Number(qm[x.o.id].agi) > 0; }).length } : null;
        g.items.forEach(function (x) { lignes.push({ s: String(x.o.systeme_cible || '').toUpperCase(), h: ligneBgsMob(x.o, x.index, ctx) }); if (!actif) pcts.push(ctx.avanc(x.o, ctx.resume[x.o.id] || { nb_participants: 0, types: {}, pilotes: [] }).pct); });
        ((pp && pp.missions) || []).filter(function (m) { return m.origine === 'AMIRAL' && String(m.campagne_id) === String(c.id); }).forEach(function (m) {
            lignes.push({ s: String(m.systeme || '').toUpperCase(), h: lignePPMob(m) });
            var pl = Number(m.plafond_cp) || 0, pc = pl > 0 ? Math.min(100, 100 * cp(m.merites_total) / pl) : (m.etat && m.etat.progres != null ? Number(m.etat.progres) * 100 : null); if (pc != null) pcts.push(pc);
        });
        ((col && col.missions) || []).filter(function (m) { return m.origine === 'AMIRAL' && String(m.campagne_id) === String(c.id); }).forEach(function (m) { lignes.push({ s: String(m.systeme || '').toUpperCase(), h: ligneCOLMob(m) }); if (m.pct != null) pcts.push(Number(m.pct)); });
        lignes = groupesSys(lignes, c.ordre_systemes);
        var moy = pcts.length ? Math.round(pcts.reduce(function (s, v) { return s + v; }, 0) / pcts.length) : 0;
        var replie = lirePli().indexOf(String(c.id)) >= 0;
        var info = c.echeance ? '⏳ jusqu\'au ' + String(c.echeance).slice(8, 10) + '/' + String(c.echeance).slice(5, 7) : '';
        return '<div class="mc-camp' + (replie ? ' rep' : '') + '" id="mcc-' + c.id + '" style="--cc:' + cc + ';">'
            + '<div class="mc-head" style="--c:' + cc + '; background:linear-gradient(90deg,' + cc + '22 0, rgba(0,0,0,0) 70%);" onclick="edteamCampagnesMob.basculer(\'' + c.id + '\')">'
            + '<div class="r1"><span class="mc-type">' + (LIB_CAMP[c.type_campagne] || esc(c.type_campagne)) + '</span>' + tagAllie(c) + '<span class="pa ' + pk + '">' + (prio === 1 ? '▲ CRITIQUE' : prio === 2 ? '▲ HAUTE' : 'NORMALE') + '</span></div>'
            + '<div class="r2"><span class="mc-nom">' + esc(c.nom) + '</span><span class="mc-fl">▾</span></div>'
            + (info ? '<div class="r3">' + info + '</div>' : '') + '</div>'
            + '<div class="mc-lignes">' + (lignes.join('') || '<div class="mc-vide">Aucune mission dans cette campagne.</div>') + '</div></div>';
    }
    (function () {
        var s = document.createElement('style');
        s.textContent = [
            '.mc-camp { border: 1px solid; border-color: color-mix(in srgb, var(--cc) 60%, transparent); border-radius: 18px; background: var(--x-card, #0e0e12); overflow: hidden; box-shadow: inset 4px 0 0 var(--cc), 0 0 18px color-mix(in srgb, var(--cc) 14%, transparent); }',
            '.mc-head { position: relative; padding: 12px 14px 11px 16px; cursor: pointer; }',
            '.mc-head .r1, .mc-head .r2, .mc-head .r3 { position: relative; z-index: 1; }',
            '.mc-head .r1 { display: flex; align-items: center; justify-content: space-between; gap: 8px; }',
            '.mc-head .r2 { display: flex; align-items: baseline; gap: 10px; margin-top: 5px; }',
            '.mc-head .r3 { color: #888; font-size: .66em; margin-top: 3px; }',
            ".mc-type { font-family: 'Rajdhani', 'Share Tech Mono', sans-serif; font-weight: 700; font-size: 1.55em; letter-spacing: 3px; color: var(--cc); text-shadow: 0 0 12px var(--cc); line-height: 1; }",
            '.mc-nom { flex: 1; min-width: 0; color: #cfd8dc; letter-spacing: 1.5px; font-size: .8em; overflow-wrap: anywhere; }',
            ".mc-pc { font-family: 'Rajdhani', 'Share Tech Mono', sans-serif; font-weight: 700; font-size: 1.3em; letter-spacing: 1px; text-shadow: 0 0 10px currentColor; white-space: nowrap; }",
            '.mc-fl { color: #8a8a8a; transition: transform .2s; } .mc-camp.rep .mc-fl { transform: rotate(-90deg); } .mc-camp.rep .mc-lignes { display: none; }',
            '.mc-row { position: relative; overflow: hidden; padding: 10px 14px 10px 16px; border-top: 1px solid rgba(255,255,255,.14); -webkit-tap-highlight-color: transparent; }',
            '.mc-row:active { filter: brightness(1.25); }',
            '.mc-row > *:not(.mc-neon) { position: relative; z-index: 1; }',
            '.mc-neon { position: absolute; z-index: 0; left: 0; top: 0; bottom: 0; pointer-events: none; background: linear-gradient(90deg, color-mix(in srgb, var(--c) 34%, transparent), color-mix(in srgb, var(--c) 14%, transparent)); border-right: 2px solid var(--c); box-shadow: inset 0 0 14px color-mix(in srgb, var(--c) 55%, transparent), 0 0 10px var(--c); }',
            '.mc-head > .mc-neon { z-index: 0; }',
            '.mc-row .l1 { display: flex; align-items: center; gap: 8px; }',
            '.mc-tag { font-size: .56em; letter-spacing: 1.2px; padding: 2px 6px; border: 1px solid; border-radius: 4px; background: rgba(0,0,0,.55); white-space: nowrap; }',
            '.mc-sys { flex: 1; min-width: 0; color: #fff; font-size: .92em; letter-spacing: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
            '.mc-row .l2 { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-top: 4px; font-size: .7em; }',
            '.mc-g { color: #8d8d8d; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; letter-spacing: .5px; }',
            '.mc-d { white-space: nowrap; flex: none; }',
            '.mc-row .l3 { display: flex; align-items: center; gap: 8px; margin-top: 7px; flex-wrap: wrap; }',
            '.mc-avs { display: inline-flex; } .mc-avs > * { margin-left: -7px; } .mc-avs > *:first-child { margin-left: 0; }',
            '.mc-et { display: inline-flex; flex-wrap: wrap; gap: 3px; }',
            '#mc-pp { position: fixed; inset: 0; z-index: 9300; display: flex; flex-direction: column; background: #07060d; color: #cfd8dc; font-family: inherit; animation: rmMonte .22s ease-out; } @keyframes rmMonte { from { transform: translateY(24px); opacity: 0; } to { transform: none; opacity: 1; } }',
            '#mc-pp .mc-pp-tete { flex: none; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: calc(12px + env(safe-area-inset-top)) 14px 12px; border-bottom: 1px solid var(--c); background: linear-gradient(180deg, color-mix(in srgb, var(--c) 22%, #07060d), #07060d); letter-spacing: 4px; color: #fff; }',
            '#mc-pp .mc-pp-tete button { width: 42px; height: 42px; border-radius: 14px; border: 1px solid #3a4a55; background: transparent; color: #9ab; font-size: 1.2em; font-family: inherit; }',
            '#mc-pp .mc-pp-corps { flex: 1 1 auto; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 12px 12px calc(30px + env(safe-area-inset-bottom)); }',
            '#mc-pp .bgs-cadre { border: 1px solid color-mix(in srgb, var(--c) 45%, transparent); background: rgba(255,255,255,.02); border-radius: 14px; padding: 12px; margin-top: 14px; } #mc-pp .bgs-cadre-t { color: var(--c); letter-spacing: 3px; font-size: .74em; margin-bottom: 10px; }',
            '#mc-pp .bgs-sec { color: #00F0FF; letter-spacing: 2px; font-size: .7em; } #mc-pp .bgs-paysage { display: block; } #mc-pp [style*="min-width:150px"] { min-width: 0 !important; } #mc-pp [style*="min-width:130px"], #mc-pp [style*="min-width:140px"] { min-width: calc(50% - 6px) !important; }',
            '#mc-pp .mc-pp-act { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; } #mc-pp .mcp-btn { padding: 12px; border-radius: 12px; border: 1px solid var(--c); background: color-mix(in srgb, var(--c) 14%, transparent); color: #fff; font-family: inherit; letter-spacing: 2px; font-size: .78em; } #mc-pp .mcp-btn.gris { border-color: #555; background: transparent; color: #aaa; }',
            '.mc-w .pp-zb { display: block; }',
            '.mc-jg { position: relative; display: block; height: 12px; margin-top: 7px; background: #12151b; border-radius: 3px; overflow: hidden; } .mc-jg > * { position: absolute; top: 2px; bottom: 2px; display: block; }',
            '.mc-jg i { left: 0; background: #6f8196; } .mc-jg b { min-width: 3px; } .mc-jg b.h { background: repeating-linear-gradient(135deg, var(--s) 0 3px, color-mix(in srgb, var(--s) 30%, transparent) 3px 6px); border: 1px solid var(--s); box-sizing: border-box; } .mc-jg b.m { background: var(--s); box-shadow: 0 0 8px var(--s); }',
            '.mc-jg u { top: 1px; bottom: 1px; width: 4px; background: #fff; opacity: .85; }',
            '.mc-row.gris { opacity: .4; filter: grayscale(1); }',
            ".mc-row.conf { padding-top: 13px; padding-bottom: 13px; }",
            ".mc-score { font-family: 'Rajdhani', 'Share Tech Mono', sans-serif; font-weight: 700; font-size: 1.9em; letter-spacing: 2px; color: var(--k); text-shadow: 0 0 12px var(--k); line-height: 1; }",
            '.mc-det { padding: 10px 14px 12px; background: rgba(0,0,0,.4); border-top: 1px dashed #2a2a2a; }',
            '.mc-sys-t { padding: 7px 14px 4px 16px; border-top: 1px solid rgba(255,255,255,.14); font-size: .62em; letter-spacing: 2.5px; color: #cfe; background: rgba(255,255,255,.04); } .mc-sys-t span { color: #778; letter-spacing: 1px; } .mc-sys > .mc-row:first-of-type, .mc-sys > .mc-w:first-of-type > .mc-row { border-top: 0; }',
            '.mc-vide { padding: 14px; color: #777; font-size: .75em; font-style: italic; }'
        ].join('\n');
        document.head.appendChild(s);
    })();

    var API = {
        lire: async function (force) {
            if (!force && ts && Date.now() - ts < 120000) return;
            ts = Date.now();
            try {
                var r = await Promise.all([db().rpc('pp_missions_vue'), db().rpc('col_missions_vue')]);
                pp = r[0].error ? null : (r[0].data || null);
                if (window.edteamCampagnesPP && window.edteamCampagnesPP.definir) window.edteamCampagnesPP.definir(pp);
                col = r[1].error ? null : (r[1].data || null);
            } catch (e) { pp = null; col = null; }
        },
        total: function () { return ((pp && pp.missions) || []).filter(function (m) { return m.origine === 'AMIRAL'; }).length + ((col && col.missions) || []).filter(function (m) { return m.origine === 'AMIRAL'; }).length; },
        nb: function (campagneId) {
            return ((pp && pp.missions) || []).concat((col && col.missions) || []).filter(function (m) { return m.origine === 'AMIRAL' && String(m.campagne_id) === String(campagneId); }).length;
        },
        // rendu complet des blocs de campagne (ctx fourni par mobile.html)
        rendreCampagnes: function (ctx) {
            // bande « Ou etes-vous le plus utile ? » (utile-bgs.js) : situation des directives, jamais l'activite personnelle
            var ordres = [], camps = {}; API.idx = {};
            ctx.groupes.forEach(function (g) { camps[g.c.id] = g.c; g.items.forEach(function (x) { ordres.push(x.o); API.idx[x.o.id] = x.index; }); });
            var bande = window.EdteamUtile && window.cacheQuotasBgs ? window.EdteamUtile.legende() : '';
            return bande + ctx.groupes.filter(function (g) { return g.items.length || API.nb(g.c.id); }).map(function (g) { return blocCampagne(g, ctx); }).join('');
        },
        ouvrirOrdre: function (id) { if (API.idx && API.idx[id] != null && typeof window.ouvrirModalOrdre === 'function') window.ouvrirModalOrdre(API.idx[id], COUL_BGS); },
        basculer: function (id) {
            if (typeof sonClic === 'function') sonClic();
            var e = document.getElementById('mcc-' + id); if (!e) return;
            var l = lirePli(), i = l.indexOf(String(id));
            if (i >= 0) l.splice(i, 1); else l.push(String(id));
            e.classList.toggle('rep', i < 0); ecrirePli(l);
        },
        // feuille plein ecran d'une mission Powerplay : le MEME contenu que la fenetre du PC (campagnes-pp.js : apport de l'escadron, d'ou viennent les merites, participants, etat du systeme dans le jeu)
        ouvrirPP: function (id) {
            var API_PP = window.edteamCampagnesPP; if (!API_PP || !API_PP.ouvrir) return;
            var r = API_PP.ouvrir(id, true); if (!r) return;
            if (typeof sonClic === 'function') sonClic();
            var f = document.getElementById('mc-pp'); if (f) f.remove();
            f = document.createElement('div'); f.id = 'mc-pp'; f.style.setProperty('--c', r.couleur);
            var cmd = r.peutCloturer ? '<div class="mc-pp-act">' + '<button type="button" class="mcp-btn gris" onclick="edteamCampagnesMob.cloturer(\'pp\',' + id + '); edteamCampagnesMob.fermerPP();">' + (r.estIni ? (r.estCmd ? 'RETIRER L’INITIATIVE' : 'CLÔTURER MON INITIATIVE') : 'CLÔTURER LA MISSION') + '</button>'
                + (r.estIni && r.estCmd ? '<button type="button" class="mcp-btn" onclick="edteamCampagnesMob.adopter(\'pp\',' + id + ');">TRANSFORMER EN MISSION DE CAMPAGNE</button>' : '') + '</div>' : '';
            f.innerHTML = '<div class="mc-pp-tete"><span>MISSION POWERPLAY</span><button type="button" aria-label="Fermer" onclick="edteamCampagnesMob.fermerPP()">✕</button></div><div class="mc-pp-corps">' + r.html + cmd + '</div>';
            document.body.appendChild(f); document.documentElement.style.overflow = 'hidden';
        },
        fermerPP: function () { var f = document.getElementById('mc-pp'); if (f) f.remove(); document.documentElement.style.overflow = ''; },
        deplier: function (id) { var d = document.getElementById(id); if (!d) return; if (typeof sonClic === 'function') sonClic(); d.style.display = d.style.display === 'none' ? 'block' : 'none'; },
        // lignes d'une campagne (ancien rendu, gardé en repli)
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
