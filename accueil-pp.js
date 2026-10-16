// BANDE D'ACCUEIL DE LA PAGE BGS (engagement, progression, escadron cette semaine) : BGS et POWERPLAY cote a cote.
// Donnees : accueil_semaine() (script SQL 101), progression_bgs_hebdo (points BGS par cycle), merites_cycles (merites Powerplay par cycle, chaque pilote ne lit que les siens).
// Retour en arriere : si la fonction serveur est absente, ou si localStorage 'edteam_accueil_classique' vaut '1', la page garde l'ancienne bande (BGS seul).
// Honnetete : les CP sont une ESTIMATION (merites / 4) ; la barre Powerplay se compare a MA meilleure semaine (aucun seuil de rang n'est connu).
(function () {
    'use strict';
    var OR = '#FF7100', PP = '#8A7CFF', JOUR = 86400000;
    var esc = function (s) { return typeof window.escapeHtml === 'function' ? window.escapeHtml(String(s == null ? '' : s)) : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
    var f0 = function (n) { return Math.floor(Number(n) || 0).toLocaleString('fr-FR'); };
    var f1 = function (n) { return (Math.round((Number(n) || 0) * 10) / 10).toLocaleString('fr-FR'); };
    var db = function () { return window.supabaseApp; };

    // jeudi (UTC) qui cloture le cycle en cours (le cycle change le jeudi 07:00 UTC)
    function clotureCourante() {
        var d = new Date(Date.now() - 7 * 3600000), ajout = (4 - d.getUTCDay() + 7) % 7; if (ajout === 0) ajout = 7;
        return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) + ajout * JOUR;
    }
    var cle = function (t) { return new Date(t).toISOString().slice(0, 10); };

    async function serieBGS() {
        try {
            var r = await db().rpc('progression_bgs_hebdo', { p_cycles: 8 });
            if (r.error) throw r.error;
            var par = {}; (r.data || []).forEach(function (l) { par[l.semaine] = Number(l.points) || 0; });
            var fin = clotureCourante(), out = [];
            for (var i = 7; i >= 0; i--) { var k = cle(fin - i * 7 * JOUR); out.push({ semaine: k, gain: par[k] || 0, courant: i === 0 }); }
            return out;
        } catch (e) { return null; }
    }
    // merites gagnes par cycle : difference des totaux relevés (un cycle sans relevé = aucun gain) ; le cycle en cours = les merites du cycle du profil
    async function seriePP(meritesCycleCourant) {
        try {
            var r = await db().from('merites_cycles').select('semaine, puissance, merites_total').order('semaine', { ascending: false }).limit(10);
            if (r.error) throw r.error;
            var lignes = (r.data || []).slice().reverse(), fin = clotureCourante(), cycles = [];
            var par = {}; lignes.forEach(function (l) { par[l.semaine] = l; });
            if (lignes.length) {
                var prev = lignes[0], finT = Math.max(Date.parse(lignes[lignes.length - 1].semaine + 'T00:00:00Z'), fin);
                for (var t = Date.parse(lignes[0].semaine + 'T00:00:00Z') + 7 * JOUR; t <= finT; t += 7 * JOUR) {
                    var k = cle(t), l = par[k];
                    if (l) { cycles.push({ semaine: k, gain: l.puissance === prev.puissance ? Math.max(0, l.merites_total - prev.merites_total) : null }); prev = l; }
                    else cycles.push({ semaine: k, gain: 0 });
                }
            }
            var out = [];
            for (var i = 7; i >= 0; i--) { var kk = cle(fin - i * 7 * JOUR), c = cycles.filter(function (x) { return x.semaine === kk; })[0]; out.push({ semaine: kk, gain: c ? c.gain : 0, courant: i === 0 }); }
            out[out.length - 1].gain = Number(meritesCycleCourant) || 0;
            return out;
        } catch (e) { return null; }
    }

    function barres(col, cycles) {
        var gains = cycles.map(function (c) { return c.gain || 0; }), mx = Math.max.apply(null, gains.concat([1]));
        return '<div style="display:flex; align-items:flex-end; gap:5px; height:130px;">' + cycles.map(function (c) {
            var g = c.gain, h = g > 0 ? Math.max(3, Math.round(100 * g / mx)) : 2;
            return '<div style="flex:1; min-width:0; display:flex; flex-direction:column; align-items:center; justify-content:flex-end;" title="' + esc(c.semaine.slice(8, 10) + '/' + c.semaine.slice(5, 7)) + '">'
                + '<span style="font-size:.62em; color:' + (c.courant ? '#fff' : '#999') + '; margin-bottom:2px;">' + (g === null ? '?' : (g > 0 ? '+' + f0(g) : '0')) + '</span>'
                + '<div style="width:100%; max-width:38px; height:' + h + 'px; background:' + (c.courant ? col : col + '77') + '; border-radius:2px 2px 0 0;' + (c.courant ? ' box-shadow:0 0 10px ' + col + ';' : '') + '"></div></div>';
        }).join('') + '</div>';
    }
    function legendeDates(cycles) {
        return '<div style="display:flex; gap:5px; color:#666; font-size:.58em;">' + cycles.map(function (c) { return '<span style="flex:1; text-align:center; white-space:nowrap; ' + (c.courant ? 'color:#ccc;' : '') + '">' + (c.courant ? 'EN COURS' : c.semaine.slice(8, 10) + '/' + c.semaine.slice(5, 7)) + '</span>'; }).join('') + '</div>';
    }
    function moyenne(cycles) { var g = cycles.map(function (c) { return c.gain; }).filter(function (x) { return x !== null; }); return g.length ? Math.round(g.reduce(function (a, b) { return a + b; }, 0) / g.length) : 0; }
    function meilleur(cycles) { var g = cycles.map(function (c) { return c.gain; }).filter(function (x) { return x !== null; }); return g.length ? Math.max.apply(null, g) : 0; }

    function piste(col, badgeTitre, badge, ligne1, ligne2, pct, sous) {
        return '<div style="display:flex; gap:16px; align-items:center;">'
            + '<div style="display:inline-flex; flex-direction:column; align-items:center; border:2px solid ' + col + '; color:' + col + '; padding:5px 14px; border-radius:4px; line-height:1.1; box-shadow:0 0 12px ' + col + '4d; min-width:64px; flex:none;"><span style="font-size:.55em; letter-spacing:2px;">' + badgeTitre + '</span><span style="font-size:2em; font-weight:bold;">' + badge + '</span></div>'
            + '<div style="flex:1; min-width:0;"><div style="display:flex; justify-content:space-between; gap:8px; margin-bottom:5px; white-space:nowrap;"><b style="color:#fff;">' + ligne1 + '</b><span style="color:#888; font-size:.85em;">' + ligne2 + '</span></div>'
            + '<div style="height:9px; background:rgba(255,255,255,.08); border-radius:4px; overflow:hidden;"><div style="width:' + Math.max(0, Math.min(100, pct)).toFixed(1) + '%; height:100%; background:' + col + '; box-shadow:0 0 8px ' + col + ';"></div></div>'
            + (sous ? '<div style="color:#888; margin-top:7px; font-size:.8em; white-space:nowrap;">' + sous + '</div>' : '') + '</div></div>';
    }

    function avatar(u, nom, t) { var P = window.EDTEAMPhotos; return (P && u) ? P.avatar({ uid: u, nom: nom, role: 'pilote', taille: t || 24 }) : ''; }

    async function rendre(haut, ctx) {
        var acc = ctx.acc, pp = acc.pp || {}, bg = acc.bgs || {}, aPP = !!pp.puissance;
        var series = await Promise.all([serieBGS(), aPP ? seriePP(pp.mes_merites) : Promise.resolve(null)]);
        var sB = series[0], sP = series[1];

        // ===== 1. MA PROGRESSION : les deux graphiques cote a cote, avec les chiffres et les dates =====
        var enTete = function (col, titre, cycles, unite) {
            var cur = cycles[cycles.length - 1].gain || 0, best = meilleur(cycles);
            return '<div style="display:flex; justify-content:space-between; align-items:baseline; gap:8px; white-space:nowrap; margin-bottom:8px;"><span style="color:' + col + '; font-size:.72em; letter-spacing:2px;">' + titre + '</span>'
                + '<span style="font-size:.78em; color:#999;">en cours <b style="color:#fff; font-size:1.25em;">+' + f0(cur) + '</b></span></div>';
        };
        var pied = function (cycles, unite) {
            return '<div style="display:flex; justify-content:space-between; color:#777; font-size:.72em; margin-top:8px; white-space:nowrap; gap:8px;"><span>moyenne <b style="color:#ccc;">+' + f0(moyenne(cycles)) + '</b> / sem.</span><span>meilleure <b style="color:#FFD700;">+' + f0(meilleur(cycles)) + '</b></span></div>';
        };
        var graphe = function (col, titre, cycles, unite) {
            return '<div style="flex:1; min-width:0;">' + enTete(col, titre, cycles, unite) + barres(col, cycles) + legendeDates(cycles) + pied(cycles, unite) + '</div>';
        };
        var blocProg = '<div class="bloc cy" style="padding:16px 22px; display:flex; flex-direction:column; gap:12px;">'
            + '<div style="display:flex; justify-content:space-between; align-items:baseline; gap:10px;"><h4 style="margin:0; color:var(--ed-blue); letter-spacing:2px;">&gt; MA PROGRESSION</h4><span style="color:#777; font-size:.78em;">8 dernières semaines</span></div>'
            + '<div style="display:flex; gap:26px; align-items:stretch; flex:1;">' + (sB ? graphe(OR, 'BGS · POINTS', sB, 'pts') : '<div style="color:#888; font-size:.85em;">Progression indisponible pour le moment.</div>')
            + (aPP && sP ? graphe(PP, 'POWERPLAY · MÉRITES', sP, 'mérites') : '') + '</div>'
            + (aPP ? '' : '<div style="color:#666; font-size:.78em;">Le graphique Powerplay apparaît dès que vous avez rejoint une puissance.</div>') + '</div>';

        // ===== 2. L'ESCADRON CETTE SEMAINE : podium des 3 premiers ; un clic ouvre le classement complet =====
        // Part d'un pilote = moyenne de sa part des points BGS et de sa part des merites Powerplay de l'escadron (BGS et Powerplay comptent a egalite, meme si les merites sont des milliers de fois plus nombreux que les points).
        var tB = Number(bg.points) || 0, tP = Number(pp.total) || 0;
        var domaines = (tB > 0 ? 1 : 0) + (tP > 0 ? 1 : 0);
        var pil = (acc.pilotes || []).map(function (p) {
            var b = Number(p.bgs) || 0, m = Number(p.pp) || 0, sb = tB > 0 ? b / tB : 0, sp = tP > 0 ? m / tP : 0;
            return { u: p.u, nom: p.nom, b: b, m: m, sb: sb, sp: sp, score: domaines ? (sb + sp) / domaines : 0 };
        }).sort(function (x, y) { return y.score - x.score; });
        var maxScore = Math.max.apply(null, pil.map(function (p) { return p.score; }).concat([0.0001]));
        var moiId = ctx.profil.user_id;
        var estMoiP = function (p) { return p.u ? String(p.u) === String(moiId) : (!!ctx.profil.cmdr_nom && String(p.nom).toLowerCase() === String(ctx.profil.cmdr_nom).toLowerCase()); };
        var idxMoi = pil.findIndex(estMoiP);
        var couleursRang = ['#00FFFF', '#FFD700', '#C0C0C0'];
        var pctTxt = function (v) { var x = v * 100; return (x >= 10 ? Math.round(x) : Math.round(x * 10) / 10).toLocaleString('fr-FR') + ' %'; };
        // barre en deux segments : orange = ce que le pilote apporte en BGS, violet = en Powerplay (longueur relative au 1er)
        var barreDuo = function (p, h) {
            var wb = domaines ? 100 * (p.sb / domaines) / maxScore : 0, wp = domaines ? 100 * (p.sp / domaines) / maxScore : 0;
            return '<div style="display:flex; height:' + h + 'px; background:rgba(255,255,255,.07); border-radius:3px; overflow:hidden;"><i style="width:' + wb + '%; background:' + OR + '; box-shadow:0 0 8px ' + OR + ';"></i><i style="width:' + wp + '%; background:' + PP + '; box-shadow:0 0 8px ' + PP + ';"></i></div>';
        };
        var carte = function (p, rg) {
            var cr = couleursRang[rg], moi = estMoiP(p);
            return '<div style="flex:1; min-width:0; text-align:center; padding:14px 8px 12px; border:1px solid ' + cr + '66; border-top:3px solid ' + cr + '; border-radius:4px; background:linear-gradient(180deg,' + cr + '1a,transparent 70%);' + (moi ? ' box-shadow:0 0 14px ' + cr + '55;' : '') + '">'
                + '<div style="color:' + cr + '; font-size:.7em; letter-spacing:3px; margin-bottom:8px;">' + (rg + 1) + (rg === 0 ? 'ER' : 'E') + '</div>'
                + '<div style="display:flex; justify-content:center; margin-bottom:8px;">' + avatar(p.u, p.nom, 54) + '</div>'
                + '<div style="color:#fff; font-size:.88em; font-weight:bold; letter-spacing:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + esc(String(p.nom || '?').toUpperCase()) + (moi ? ' <span style="color:' + cr + ';">(MOI)</span>' : '') + '</div>'
                + '<div style="color:' + cr + '; font-size:1.7em; font-weight:bold; text-shadow:0 0 12px ' + cr + '; margin:6px 0 8px;">' + pctTxt(p.score) + '</div>'
                + barreDuo(p, 6)
                + '<div style="display:flex; justify-content:center; gap:10px; margin-top:8px; font-size:.7em; white-space:nowrap;"><span style="color:' + OR + ';">' + f1(p.b) + ' pts</span>' + (tP > 0 ? '<span style="color:' + PP + ';">' + f0(p.m) + '</span>' : '') + '</div></div>';
        };
        var blocEsc = '<div id="accueil-esc" class="bloc" style="padding:16px 22px; display:flex; flex-direction:column; gap:12px; cursor:pointer;" title="Cliquer pour voir le classement complet de la semaine">'
            + '<div style="display:flex; justify-content:space-between; align-items:baseline; gap:10px; flex-wrap:wrap;"><h4 style="margin:0; color:var(--ed-orange); letter-spacing:2px;">&gt; L\'ESCADRON CETTE SEMAINE</h4><span style="color:#777; font-size:.78em;">depuis jeudi 07:00 · <span style="color:#ccc;">classement complet ›</span></span></div>'
            + (pil.length ? '<div style="display:flex; gap:10px;">' + pil.slice(0, 3).map(carte).join('') + '</div>' : '<div style="color:#777; font-style:italic; font-size:.85em; padding:20px 0; text-align:center;">Pas encore d\'activité cette semaine.</div>')
            + '</div></div>';

        // classement complet (fenetre) : tous les pilotes qui ont participe cette semaine
        var ouvrirClassement = function () {
            var ancien = document.getElementById('modal-accueil-classement'); if (ancien) ancien.remove();
            var cols = 'grid-template-columns:30px 30px minmax(0,1.1fr) minmax(90px,1fr) 64px' + (tP > 0 ? ' 90px' : '') + ';';
            var lignes = pil.map(function (p, i) {
                var cr = couleursRang[i] || '#777', moi = estMoiP(p);
                return '<div style="display:grid; ' + cols + ' gap:12px; align-items:center; padding:8px 10px; border-bottom:1px solid rgba(255,255,255,.06);' + (moi ? ' background:rgba(255,255,255,.08); outline:1px solid rgba(255,255,255,.4); outline-offset:-1px;' : '') + '">'
                    + '<span style="display:inline-flex; width:24px; height:24px; border-radius:50%; border:1px solid ' + cr + '; color:' + cr + '; font-size:.78em; align-items:center; justify-content:center;">' + (i + 1) + '</span>'
                    + '<span style="width:28px; height:28px; display:inline-flex;">' + avatar(p.u, p.nom, 28) + '</span>'
                    + '<span style="min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:' + (moi ? '#fff' : '#ddd') + ';">' + esc(String(p.nom || '?').toUpperCase()) + (moi ? ' <b>(MOI)</b>' : '') + '</span>'
                    + '<span style="display:flex; align-items:center; gap:8px;"><span style="flex:1;">' + barreDuo(p, 7) + '</span><b style="color:#fff; min-width:44px; text-align:right;">' + pctTxt(p.score) + '</b></span>'
                    + '<b style="text-align:right; color:' + OR + ';">' + f1(p.b) + '</b>' + (tP > 0 ? '<b style="text-align:right; color:' + PP + ';">' + f0(p.m) + '</b>' : '') + '</div>';
            }).join('');
            var d = document.createElement('div');
            d.className = 'modal-overlay'; d.id = 'modal-accueil-classement'; d.style.zIndex = '5600'; d.setAttribute('onclick', "fermerModal('modal-accueil-classement', event)");
            d.innerHTML = '<div class="modal-content" onclick="event.stopPropagation()" style="max-width:860px; width:96%; max-height:90vh; overflow-y:auto;">'
                + '<div class="modal-close" onclick="fermerModal(\'modal-accueil-classement\')">X</div>'
                + '<div style="color:var(--ed-orange); letter-spacing:3px; font-weight:bold; font-size:1.1em;">&gt; CLASSEMENT DE LA SEMAINE</div>'
                + '<div style="color:#777; font-size:.8em; margin:4px 0 14px; line-height:1.5;">Depuis jeudi 07:00 · ' + pil.length + ' pilote' + (pil.length > 1 ? 's' : '') + ' ayant participé. La part d\'un pilote est la moyenne de sa <b style="color:' + OR + ';">part des points BGS</b> et de sa <b style="color:' + PP + ';">part des mérites Powerplay</b> de l\'escadron : les deux comptent à égalité. Sur la barre, l\'orange vient du BGS et le violet du Powerplay.</div>'
                + '<div style="display:grid; ' + cols + ' gap:12px; color:#777; font-size:.66em; letter-spacing:1px; padding:0 10px 6px;"><span></span><span></span><span>PILOTE</span><span>PART DE L\'ESCADRON</span><span style="text-align:right; color:' + OR + ';">POINTS BGS</span>' + (tP > 0 ? '<span style="text-align:right; color:' + PP + ';">MÉRITES</span>' : '') + '</div>'
                + (lignes || '<div style="color:#777; text-align:center; padding:20px;">Aucune participation cette semaine.</div>') + '</div>';
            document.body.appendChild(d); d.style.display = 'flex';
        };

        haut.style.gridTemplateColumns = 'minmax(0, 1fr) minmax(0, 1fr)';
        haut.innerHTML = blocProg + blocEsc;
        var be = document.getElementById('accueil-esc'); if (be) be.addEventListener('click', ouvrirClassement);
    }

    window.edteamAccueil = { rendre: rendre, basculer: function (classique) { try { if (classique) localStorage.setItem('edteam_accueil_classique', '1'); else localStorage.removeItem('edteam_accueil_classique'); } catch (e) {} location.reload(); return false; }, actif: function () { try { return localStorage.getItem('edteam_accueil_classique') !== '1'; } catch (e) { return true; } } };
})();
