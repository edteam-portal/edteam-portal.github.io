// ENGAGEMENT (mobile) : ma progression Powerplay (a cote de la progression BGS), podium de l'escadron cette semaine, classement complet de la semaine.
// Donnees : accueil_semaine() (SQL 101, repli : bgs_semaine_escadron), merites_cycles (mes merites releves par cycle), memes regles que la bande d'accueil du PC (accueil-pp.js).
// La part d'un pilote = moyenne de sa part des points BGS et de sa part des merites Powerplay de l'escadron ; les CP sont une ESTIMATION (merites / 4).
(function () {
    'use strict';
    var OR = '#FF7100', PP = '#8A7CFF', JOUR = 86400000;
    var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
    var f0 = function (n) { return Math.floor(Number(n) || 0).toLocaleString('fr-FR'); };
    var f1 = function (n) { return (Math.round((Number(n) || 0) * 10) / 10).toLocaleString('fr-FR'); };
    var db = function () { return window.supabaseApp || (typeof supabaseApp !== 'undefined' ? supabaseApp : null); };
    var cle = function (t) { return new Date(t).toISOString().slice(0, 10); };
    var memo = { ts: 0, data: null }, pil = [], tB = 0, tP = 0, domaines = 0, maxScore = 0.0001, moiId = null, profilNom = '';

    function clotureCourante() {
        var d = new Date(Date.now() - 7 * 3600000), ajout = (4 - d.getUTCDay() + 7) % 7; if (ajout === 0) ajout = 7;
        return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) + ajout * JOUR;
    }
    // merites gagnes par cycle (differences des totaux releves) ; le cycle en cours = les merites du cycle du profil
    async function seriePP(courant) {
        try {
            var r = await db().from('merites_cycles').select('semaine, puissance, merites_total').order('semaine', { ascending: false }).limit(10);
            if (r.error) throw r.error;
            var lignes = (r.data || []).slice().reverse(), fin = clotureCourante(), cycles = [], par = {};
            lignes.forEach(function (l) { par[l.semaine] = l; });
            if (lignes.length) {
                var prev = lignes[0], finT = Math.max(Date.parse(lignes[lignes.length - 1].semaine + 'T00:00:00Z'), fin);
                for (var t = Date.parse(lignes[0].semaine + 'T00:00:00Z') + 7 * JOUR; t <= finT; t += 7 * JOUR) {
                    var k = cle(t), l = par[k];
                    if (l) { cycles.push({ semaine: k, gain: l.puissance === prev.puissance ? Math.max(0, l.merites_total - prev.merites_total) : null }); prev = l; }
                    else cycles.push({ semaine: k, gain: 0 });
                }
            }
            var out = [];
            for (var i = 7; i >= 0; i--) { var kk = cle(fin - i * 7 * JOUR), c = cycles.filter(function (x) { return x.semaine === kk; })[0]; out.push({ semaine: kk, gain: c ? c.gain : 0 }); }
            out[7].gain = Number(courant) || 0;
            return out;
        } catch (e) { return null; }
    }
    async function lireSemaine(profil, force) {
        if (!force && memo.data && Date.now() - memo.ts < 120000) return memo.data;
        var acc = null;
        try { var r = await db().rpc('accueil_semaine'); if (!r.error && r.data && r.data.escadron && r.data.bgs && r.data.pp) acc = r.data; } catch (e) { /* SQL 101 absent */ }
        if (!acc) {   // repli : points BGS de la semaine + ma puissance (le classement n'a alors que le BGS)
            try {
                var rs = await db().rpc('bgs_semaine_escadron');
                if (!rs.error && rs.data && rs.data.escadron) {
                    var s = rs.data;
                    acc = { escadron: s.escadron, bgs: { points: s.points, actifs: s.actifs, membres: s.membres, mes_points: s.mes_points, mes_points_24h: s.mes_points_24h },
                        pp: { puissance: profil.puissance_nom || null, rang: profil.puissance_rang || 0, mes_merites: profil.puissance_merites_cycle || 0, merites_total: profil.puissance_merites_total || 0, total: 0, actifs: 0, membres: 0 },
                        pilotes: (s.top || []).map(function (t) { return { u: null, nom: t.nom, bgs: t.points, pp: 0 }; }) };
                }
            } catch (e) { acc = null; }
        }
        memo = { ts: Date.now(), data: acc };
        return acc;
    }
    function avatar(u, nom, t) { var P = window.EDTEAMPhotos; return (P && u) ? P.avatar({ uid: u, nom: nom, role: 'pilote', taille: t || 24 }) : ''; }
    var pctTxt = function (v) { var x = v * 100; return (x >= 10 ? Math.round(x) : Math.round(x * 10) / 10).toLocaleString('fr-FR') + ' %'; };
    function estMoi(p) { return p.u ? String(p.u) === String(moiId) : (!!profilNom && String(p.nom).toLowerCase() === String(profilNom).toLowerCase()); }
    function barreDuo(p, h) {
        var wb = domaines ? 100 * (p.sb / domaines) / maxScore : 0, wp = domaines ? 100 * (p.sp / domaines) / maxScore : 0;
        return '<div style="display:flex; height:' + h + 'px; background:rgba(255,255,255,.07); border-radius:3px; overflow:hidden;"><i style="width:' + wb + '%; background:' + OR + '; box-shadow:0 0 8px ' + OR + ';"></i><i style="width:' + wp + '%; background:' + PP + '; box-shadow:0 0 8px ' + PP + ';"></i></div>';
    }
    function preparer(acc, profil) {
        moiId = profil.user_id; profilNom = profil.cmdr_nom || '';
        var bg = acc.bgs || {}, ppd = acc.pp || {};
        tB = Number(bg.points) || 0; tP = Number(ppd.total) || 0; domaines = (tB > 0 ? 1 : 0) + (tP > 0 ? 1 : 0);
        pil = (acc.pilotes || []).map(function (p) {
            var b = Number(p.bgs) || 0, m = Number(p.pp) || 0, sb = tB > 0 ? b / tB : 0, sp = tP > 0 ? m / tP : 0;
            return { u: p.u, nom: p.nom, b: b, m: m, sb: sb, sp: sp, score: domaines ? (sb + sp) / domaines : 0 };
        }).sort(function (x, y) { return y.score - x.score; });
        maxScore = Math.max.apply(null, pil.map(function (p) { return p.score; }).concat([0.0001]));
    }

    // carte Powerplay : meme patron que « Points ce cycle » du BGS, en violet
    function cartePP(acc, serie) {
        var ppd = acc.pp || {};
        if (!ppd.puissance) return '<div class="xc" style="opacity:.6; border-style:dashed;"><div class="xk" style="color:' + PP + ';">Mérites Powerplay</div><div class="xmut" style="margin-top:8px; line-height:1.6;">Rejoignez une puissance en jeu pour suivre vos mérites ici.</div></div>';
        var cur = Number(ppd.mes_merites) || 0, prec = serie ? (serie[6].gain || 0) : 0, gains = serie ? serie.map(function (c) { return c.gain || 0; }) : [], best = gains.length ? Math.max.apply(null, gains) : 0;
        var moy = gains.length ? gains.reduce(function (a, b) { return a + b; }, 0) / gains.length : 0, mx = Math.max(1, best);
        var barres = serie ? serie.map(function (c, i) {
            var h = c.gain ? Math.max(3, Math.round(70 * c.gain / mx)) : 2, cls = i === 7 ? 'cur' : (c.gain && c.gain === best ? 'best' : '');
            return '<div><em>' + (c.gain > 0 ? f0(c.gain) : '') + '</em><div class="bar ' + cls + '" style="height:' + h + 'px;"></div></div>';
        }).join('') : '';
        var etiq = serie ? serie.map(function (c, i) { return '<span' + (i === 7 ? ' style="color:' + PP + ';"' : '') + '>' + (i === 7 ? 'ICI' : c.semaine.slice(8, 10) + '/' + c.semaine.slice(5, 7)) + '</span>'; }).join('') : '';
        return '<div class="xc" style="border-color:' + PP + '55;"><div class="xrow"><div class="xk" style="color:' + PP + ';">Mérites ce cycle</div><div class="xsp"></div><span class="xpill" style="color:' + PP + ';">RANG PP ' + esc(ppd.rang || '—') + '</span></div>'
            + '<div class="xrow" style="margin-top:7px; align-items:flex-end;"><div class="xbig" style="font-size:3em; color:' + PP + '; text-shadow:0 0 22px ' + PP + '66;">' + f0(cur) + '</div><div class="xsp"></div><div style="text-align:right;"><div class="xmut">≈ CP</div><div class="xbig" style="font-size:1.35em;">' + f0(cur / 4) + '</div></div></div>'
            + (serie ? '<div class="xwk pp">' + barres + '</div><div class="xwkl">' + etiq + '</div>' : '')
            + '<div class="xtwo" style="margin-top:10px;"><div class="xmini"><div class="xk">Meilleur cycle</div><div class="v">' + f0(best) + '</div></div><div class="xmini"><div class="xk">Moyenne</div><div class="v">' + f0(moy) + '</div></div></div>'
            + '<div class="xmut" style="font-size:.62em; margin-top:8px;">Cycle précédent ' + f0(prec) + ' · total ' + f0(ppd.merites_total) + ' · CP = mérites ÷ 4 (estimation)</div></div>';
    }
    // podium des 3 premiers ; un toucher ouvre le classement complet
    function carteEscadron() {
        var cr = ['#00FFFF', '#FFD700', '#C0C0C0'];
        if (!pil.length) return '<div class="xc"><div class="xk" style="color:var(--ed-orange);">L\'escadron cette semaine</div><div class="xmut" style="margin-top:8px;">Pas encore d\'activité cette semaine.</div></div>';
        var cartes = pil.slice(0, 3).map(function (p, i) {
            var c = cr[i], moi = estMoi(p);
            return '<div style="flex:1; min-width:0; text-align:center; padding:11px 5px 10px; border:1px solid ' + c + '66; border-top:3px solid ' + c + '; border-radius:12px; background:linear-gradient(180deg,' + c + '1a,transparent 70%);' + (moi ? ' box-shadow:0 0 12px ' + c + '55;' : '') + '">'
                + '<div style="color:' + c + '; font-size:.58em; letter-spacing:2px; margin-bottom:6px;">' + (i + 1) + (i === 0 ? 'ER' : 'E') + '</div>'
                + '<div style="display:flex; justify-content:center; margin-bottom:6px; min-height:40px;">' + avatar(p.u, p.nom, 40) + '</div>'
                + '<div style="color:#fff; font-size:.7em; font-weight:bold; letter-spacing:.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + esc(String(p.nom || '?').toUpperCase()) + '</div>'
                + '<div style="color:' + c + '; font-size:1.35em; font-weight:bold; text-shadow:0 0 10px ' + c + '; margin:4px 0 6px; font-family:\'Rajdhani\',sans-serif;">' + pctTxt(p.score) + '</div>' + barreDuo(p, 5) + '</div>';
        }).join('');
        return '<div class="xc click" onclick="edteamEngagementMob.ouvrirClassement()"><div class="xrow"><span class="xk" style="color:var(--ed-orange);">L\'escadron cette semaine</span><span class="xsp"></span><span class="xmut" style="font-size:.66em;">classement complet ›</span></div>'
            + '<div style="display:flex; gap:7px; margin-top:10px;">' + cartes + '</div></div>';
    }

    var API = {
        // renvoie { pp, podium } (chaines HTML) ; null si l'escadron n'est pas lisible
        blocs: async function (profil, force) {
            var acc = await lireSemaine(profil, force);
            if (!acc) return null;
            preparer(acc, profil);
            var serie = (acc.pp && acc.pp.puissance) ? await seriePP(acc.pp.mes_merites) : null;
            return { pp: cartePP(acc, serie), podium: carteEscadron() };
        },
        ouvrirClassement: function () {
            if (typeof sonClic === 'function') sonClic();
            var ancien = document.getElementById('mc-classement'); if (ancien) ancien.remove();
            var cr = ['#00FFFF', '#FFD700', '#C0C0C0'];
            var lignes = pil.map(function (p, i) {
                var c = cr[i] || '#777', moi = estMoi(p);
                return '<div style="padding:10px 12px; border-bottom:1px solid rgba(255,255,255,.06);' + (moi ? ' background:rgba(255,255,255,.08); outline:1px solid rgba(255,255,255,.4); outline-offset:-1px; border-radius:8px;' : '') + '">'
                    + '<div style="display:flex; align-items:center; gap:10px;"><span style="display:inline-flex; width:22px; height:22px; border-radius:50%; border:1px solid ' + c + '; color:' + c + '; font-size:.7em; align-items:center; justify-content:center; flex:none;">' + (i + 1) + '</span>'
                    + '<span style="width:30px; height:30px; display:inline-flex; flex:none;">' + avatar(p.u, p.nom, 30) + '</span>'
                    + '<span style="flex:1; min-width:0; color:' + (moi ? '#fff' : '#ddd') + '; font-size:.82em; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + esc(String(p.nom || '?').toUpperCase()) + (moi ? ' <b>(MOI)</b>' : '') + '</span>'
                    + '<b style="color:#fff; font-size:.95em;">' + pctTxt(p.score) + '</b></div>'
                    + '<div style="margin:7px 0 4px;">' + barreDuo(p, 6) + '</div>'
                    + '<div style="display:flex; justify-content:space-between; font-size:.66em;"><span style="color:' + OR + ';">' + f1(p.b) + ' pts BGS</span>' + (tP > 0 ? '<span style="color:' + PP + ';">' + f0(p.m) + ' mérites</span>' : '') + '</div></div>';
            }).join('');
            var d = document.createElement('div');
            d.id = 'mc-classement';
            d.style.cssText = 'position:fixed; inset:0; z-index:9000; background:rgba(0,0,0,.82); display:flex; align-items:flex-end; justify-content:center; backdrop-filter:blur(4px);';
            d.onclick = function (e) { if (e.target === d) d.remove(); };
            d.innerHTML = '<div style="width:100%; max-height:88vh; overflow-y:auto; background:#0b0b10; border:1px solid var(--ed-orange); border-bottom:0; border-radius:22px 22px 0 0; padding:16px 12px 24px;">'
                + '<div style="display:flex; align-items:center; justify-content:space-between; padding:0 4px;"><b style="color:var(--ed-orange); letter-spacing:3px; font-size:.85em;">CLASSEMENT DE LA SEMAINE</b><span onclick="document.getElementById(\'mc-classement\').remove()" style="color:var(--ed-orange); font-size:1.3em; padding:4px 10px;">✕</span></div>'
                + '<div class="xmut" style="font-size:.66em; line-height:1.55; padding:6px 4px 10px;">Depuis jeudi 07:00 · ' + pil.length + ' pilote' + (pil.length > 1 ? 's' : '') + ' ayant participé. La part d\'un pilote est la moyenne de sa <b style="color:' + OR + ';">part des points BGS</b> et de sa <b style="color:' + PP + ';">part des mérites Powerplay</b> de l\'escadron : les deux comptent à égalité (orange = BGS, violet = Powerplay).</div>'
                + (lignes || '<div class="xmut" style="text-align:center; padding:20px;">Aucune participation cette semaine.</div>') + '</div>';
            document.body.appendChild(d);
        }
    };
    var st = document.createElement('style');
    st.textContent = '.xwk.pp .bar { background: linear-gradient(180deg, rgba(138,124,255,0.85), rgba(138,124,255,0.22)); } .xwk.pp .bar.cur { background: linear-gradient(180deg, #b3a9ff, #8A7CFF); box-shadow: 0 0 14px rgba(138,124,255,0.6); } .xwk.pp .bar.best { background: linear-gradient(180deg, #ffe08a, var(--x-gold)); }';
    document.head.appendChild(st);
    window.edteamEngagementMob = API;
})();
