// « FIL DE L'ESCADRON » : affichage du journal tactique (PC : index.html ; mobile : mobile.html), avec reactions emoji (SQL 158).
// Les donnees restent celles de journal_activite (100 dernieres lignes, temps reel) : ce fichier ne fait que les presenter.
//   - trois niveaux : grandes cartes (titre, rang, distinction, station), cartes courantes, groupes (joueurs croises, missions, directives modifiees)
//   - separateurs de jour, filtres, bandeau « DERNIERE MINUTE » (PC), « charger les plus anciennes »
//   - reactions : 1 seule par pilote et par ligne, lues en UN appel avec la page (journal_reactions_lire), ecrites par journal_reagir ; sans le SQL 158 elles disparaissent
// Usage : EdteamFil.monter(element, { db, escadron, mode: 'pc' | 'mob', estLu(id), marquerLu(id), photo(user_id, nom) -> url ou '' }) puis EdteamFil.donner(lignes) a chaque changement. Pas de fenetre de detail : le texte est affiche en entier.
(function () {
    "use strict";
    if (window.EdteamFil) return;
    var REACTS = [["applaudir", "👏"], ["feu", "🔥"], ["epee", "⚔️"], ["fete", "🎉"], ["coeur", "❤️"], ["pouce", "👍"]], GLY = {};
    REACTS.forEach(function (r) { GLY[r[0]] = r[1]; });
    var PAS = 25, GROUPE_MIN = 3, NOUVEAU_H = 48;
    var st = { el: null, o: {}, data: [], filtre: "tout", nb: PAS, rx: { n: {}, moi: {} }, rxDispo: true, picker: null, ouverts: {}, vue: null, qui: null, noms: {}, statuts: {}, crDispo: true };

    function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
    function sec(s) { return s.replace(/<[^>]+>/g, ""); }

    // ------------------------------------------------------------------------------------------------------------
    // CLASSEMENT DES LIGNES
    // ------------------------------------------------------------------------------------------------------------
    function categorie(l) {
        var t = String(l.type_action || "").toUpperCase(), c = String(l.couleur || "");
        if (t.indexOf("TITRE SPÉCIALISTE") >= 0) return { k: "ti", f: "dist", nom: "TITRE DE SPÉCIALISTE", ic: "★", col: "#C9D1DB", maj: 1 };
        if (t.indexOf("RANG BGS") >= 0) return { k: "rg", f: "dist", nom: "RANG BGS", ic: "▲", col: "#FFD24A", maj: 1 };
        if (t.indexOf("DISTINCTION") >= 0) return { k: "ds", f: "dist", nom: t, ic: "✪", col: "#FFD24A", maj: 1 };
        if (t.indexOf("STATION TERMINÉE") >= 0) return { k: "st", f: "esc", nom: "STATION TERMINÉE", ic: "⌂", col: "#2FE07A", maj: 1 };
        if (t.indexOf("JOUEUR CROISÉ") >= 0) return { k: "cr", f: "cro", nom: "JOUEUR CROISÉ", ic: "◎", col: "#00E5F5", grp: 1 };
        if (t.indexOf("M.A.J") >= 0) return { k: "sy", f: "esc", nom: t.replace(/^M\.A\.J\s*\/*\s*/, "MISE À JOUR · "), ic: "⚙", col: "#B026FF" };
        if (t.indexOf("POWERPLAY") >= 0) return { k: "pp", f: "bgs", nom: t, ic: "✦", col: "#FF7100" };
        if (t.indexOf("NOUVELLE MISSION") >= 0) return { k: "nm", f: "bgs", nom: t, ic: "✦", col: "#FF7100", grp: 1 };
        if (t.indexOf("NOUVELLE CAMPAGNE") >= 0 || t.indexOf("DIRECTIVE BGS") >= 0 || t.indexOf("INITIATIVE") >= 0) return { k: "nc", f: "bgs", nom: t, ic: "✦", col: "#FF7100" };
        if (t.indexOf("DIRECTIVE MODIFIÉE") >= 0) return { k: "dm", f: "bgs", nom: t, ic: "⚑", col: "#00E5F5", grp: 1 };
        if (t.indexOf("ANNULÉE") >= 0 || t.indexOf("SUPPRIMÉE") >= 0) return { k: "ax", f: "bgs", nom: t, ic: "⚑", col: "#FF6A5C" };
        if (t.indexOf("CLÔTURÉE") >= 0) return { k: "cl", f: "bgs", nom: t, ic: "⚑", col: "#2FE07A" };
        if (t.indexOf("DIRECTIVE") >= 0 || t.indexOf("CAMPAGNE") >= 0) return { k: "dr", f: "bgs", nom: t, ic: "⚑", col: "#00E5F5" };
        if (t.indexOf("RECRUE") >= 0 || t.indexOf("NOUVEAU SUR") >= 0 || t.indexOf("RECRUTEMENT") >= 0 || t.indexOf("ROLE") >= 0 || t.indexOf("COMMANDEMENT") >= 0) return { k: "rc", f: "esc", nom: t, ic: "✚", col: "#2FE07A" };
        if (t.indexOf("RENSEIGNEMENT") >= 0 || t.indexOf("ALERTE") >= 0) return { k: "al", f: "esc", nom: t, ic: "◆", col: "#FF6A5C" };
        if (t.indexOf("COMMUNIQUÉ") >= 0 || t.indexOf("ANNONCE") >= 0 || t.indexOf("TRANSMISSION") >= 0) return { k: "an", f: "esc", nom: t, ic: "◈", col: "#FFD24A" };
        if (t.indexOf("BILAN") >= 0 || t.indexOf("EDNEWS") >= 0) return { k: "bi", f: "esc", nom: t, ic: "◈", col: "#00E5F5" };
        return { k: "xx", f: "esc", nom: t || "TRANSMISSION", ic: "◇", col: /^#[0-9a-fA-F]{6}$/.test(c) ? c : "#00E5F5" };
    }
    // TAMPONS des lignes de directives / campagnes (page BGS) : NOUVELLE, MODIFIEE, CLOTUREE, ANNULEE
    function tampon(l, c) {
        if (c.f !== "bgs") return null;
        var t = String(l.type_action || "").toUpperCase();
        if (t.indexOf("ANNULÉE") >= 0 || t.indexOf("SUPPRIMÉE") >= 0) return { t: "ANNULÉE", c: c.col };         // le tampon prend toujours la couleur de la bande verticale de la carte
        if (t.indexOf("CLÔTURÉE") >= 0) return { t: "CLÔTURÉE", c: c.col };
        if (t.indexOf("MODIFIÉE") >= 0) return { t: "MODIFIÉE", c: c.col };
        if (t.indexOf("NOUVELLE") >= 0 || t.indexOf("DIRECTIVE BGS") >= 0) return { t: "NOUVELLE", c: c.col };
        return null;
    }
    function tpHtml(tp, petit) { return tp ? "<span class=\"fil-tp" + (petit ? " pt" : "") + "\" style=\"--t:" + tp.c + "\">" + esc(tp.t) + "</span>" : ""; }
    // CAMP d'un joueur croise : meme regle que la fenetre « Joueurs croises » (statut legal allie, puissance de la fiche du lecteur contre la sienne, recherche ou prime = ennemi)
    var COUL = { v: "#2FE07A", b: "#4DA3FF", r: "#FF6A5C" };
    function campDe(x) {
        var P = window.EdteamPuissances, moi = "", rel = "";
        try { moi = st.o.puissance ? st.o.puissance() || "" : ""; } catch (e) { moi = ""; }
        if (/\b(ami|amie|friend|ally|allie|allié)\b/i.test(x.l || "")) return { k: "v", t: "ALLIÉ", c: COUL.v, why: "statut légal allié" };
        try { rel = P && x.pw && moi ? P.relation(moi, x.pw) : ""; } catch (e) { rel = ""; }
        if (rel === "meme") return { k: "v", t: "ALLIÉ", c: COUL.v, why: "même puissance" };
        if (rel === "bloc") return { k: "v", t: "ALLIÉ", c: COUL.v, why: "même camp : " + P.nomCamp(x.pw) };
        if (rel === "rival") return { k: "r", t: "ENNEMI", c: COUL.r, why: P.independantes(moi, x.pw) ? "puissance rivale" : "camp rival" + (P.nomCamp(x.pw) ? " : " + P.nomCamp(x.pw) : "") };
        if (x.pm > 0 || /wanted|recherch|outlaw|hors.la.loi/i.test(x.l || "")) return { k: "r", t: "ENNEMI", c: COUL.r, why: "recherché" + (x.pm > 0 ? " · prime " + Number(x.pm).toLocaleString("fr-FR") + " CR" : "") };
        return { k: "b", t: "NEUTRE", c: COUL.b, why: x.pw ? "puissance : " + x.pw : "" };
    }
    function holoDe(nom, id, camp) {
        var x = st.statuts[String(nom || "").toLowerCase()], H = window.HoloVaisseau;
        if (!x || x._ || !x.s || !H || typeof SILHOUETTES === "undefined") return "";
        try { var t = camp ? (camp.k === "r" ? true : camp.k) : "c"; return H.mini(x.s, id, t).replace("<svg ", "<svg class=\"v\" "); } catch (e) { return ""; }
    }
    function chargerScript(src) { return new Promise(function (ok) { var s = document.createElement("script"); s.src = src; s.onload = function () { ok(true); }; s.onerror = function () { ok(false); }; document.head.appendChild(s); }); }
    async function assurerHolos() {
        try { if (typeof SILHOUETTES === "undefined") await chargerScript("silhouettes-data.js?v=2"); if (!window.HoloVaisseau) await chargerScript("holo-vaisseau.js?v=2"); } catch (e) { /* sans hologramme : l'icone reste */ }
    }
    function statutDe(nom) { var x = st.statuts[String(nom || "").toLowerCase()]; return x && !x._ ? campDe(x) : null; }
    function ini(n) { var s = String(n || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase(); return s.slice(0, 2) || "?"; }
    // titre / sous-titre d'une ligne (tout est echappe ; seuls les noms sont mis en gras)
    function presenter(l, c) {
        var d = String(l.details || ""), m;
        if (c.k === "ti" && (m = /^Le CMDR (.+?) (ravit|décroche) le titre de (.+?) \((.+?)\)(?: au CMDR (.+?))?\.?$/.exec(d)))
            return { tit: "<b>" + esc(m[1]) + "</b> " + (m[5] ? "ravit" : "décroche") + " le titre « " + esc(m[3]) + " »", sb: "Spécialité <b>" + esc(m[4]) + "</b>" + (m[5] ? " · il le reprend à <b>" + esc(m[5]) + "</b>" : ""), av: ini(m[1]), nom: m[1] };
        if (c.k === "rg" && (m = /^Le CMDR (.+?) atteint le rang BGS (\d+)/.exec(d)))
            return { tit: "<b>" + esc(m[1]) + "</b> atteint le rang BGS " + esc(m[2]), sb: "Un nouveau palier pour la carrière BGS", av: ini(m[1]), nom: m[1] };
        if (c.k === "st" && ((m = /^Construction terminée : (.+?) est opérationnelle dans le système (.+?)\. Architecte : (.+?)\.?$/.exec(d)) || (m = /^Construction terminée : (.+?) est opérationnelle dans le système (.+?)\.?$/.exec(d))))
            return { tit: "<b>" + esc(m[1]) + "</b> est opérationnelle", sb: "Construction terminée dans le système <b>" + esc(m[2]) + "</b>" + (m[3] ? " · architecte <b>" + esc(m[3]) + "</b>" : ""), av: m[3] ? ini(m[3]) : "", nom: m[3] || "" };
        if (c.k === "cr" && (m = /Nouveau joueur croisé : CMDR (.+?) \((.+?)\) à (.+?), relevé par (.+?)\.?$/.exec(d))) {
            var sc = statutDe(m[1]);
            return { tit: "Nouveau joueur croisé : <b>" + esc(m[1]) + "</b>", sb: esc(m[2]) + " · " + esc(m[3]) + " · relevé par <b>" + esc(m[4]) + "</b>" + (sc && sc.why ? " · " + esc(sc.why) : ""), av: "", stamp: sc, cr: m[1] };
        }
        var par = String(l.cmdr_nom || ""), sys = par.toUpperCase() === "SYS.EDTEAM" || !par;
        var av = (c.maj || c.f === "bgs") && !sys;       // lignes de directives et de campagnes : l'avatar du pilote qui les a faites
        return { tit: esc(d), sb: sys ? "" : "par <b>" + esc(par) + "</b>", av: av ? ini(par) : "", nom: av ? par : "" };
    }
    function ligneCroise(l) {
        var m = /Nouveau joueur croisé : CMDR (.+?) \((.+?)\) à (.+?), relevé par (.+?)\.?$/.exec(String(l.details || ""));
        return m ? { nom: m[1], v: m[2], s: m[3] } : null;
    }

    // ------------------------------------------------------------------------------------------------------------
    // TEMPS
    // ------------------------------------------------------------------------------------------------------------
    function jourCle(d) { return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate(); }
    function jourLib(d) {
        var n = new Date(), h = new Date(n.getTime() - 86400000);
        if (jourCle(d) === jourCle(n)) return "AUJOURD’HUI";
        if (jourCle(d) === jourCle(h)) return "HIER";
        return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();
    }
    function heure(d) { return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); }
    function ilYa(d) {
        var m = Math.round((Date.now() - d.getTime()) / 60000);
        if (m < 1) return "à l’instant";
        if (m < 60) return "il y a " + m + " min";
        if (m < 1440) return "il y a " + Math.round(m / 60) + " h";
        return "il y a " + Math.round(m / 1440) + " j";
    }

    // ------------------------------------------------------------------------------------------------------------
    // REACTIONS
    // ------------------------------------------------------------------------------------------------------------
    function inaraHtml(nom) { return nom ? "<a class=\"fil-ina\" href=\"https://inara.cz/elite/search/?search=" + encodeURIComponent(nom) + "\" target=\"_blank\" rel=\"noopener noreferrer\" title=\"Chercher ce commandant sur Inara\">INARA ↗</a>" : ""; }
    function rxHtml(id, compact, extra) {
        if (!st.rxDispo) return extra ? "<div class=\"fil-rx" + (compact ? " c" : "") + "\">" + extra + "</div>" : "";
        var n = st.rx.n[id] || {}, moi = st.rx.moi[id], h = "";
        REACTS.forEach(function (r) { if (n[r[0]] > 0) h += "<button type=\"button\" class=\"fil-p" + (moi === r[0] ? " moi" : "") + "\" data-a=\"rx\" data-id=\"" + id + "\" data-e=\"" + r[0] + "\" title=\"" + (moi === r[0] ? "Retirer ma réaction" : "Réagir") + "\">" + r[1] + "<span>" + n[r[0]] + "</span></button>"; });
        if (String(st.picker) === String(id)) h += "<span class=\"fil-pick\">" + REACTS.map(function (r) { return "<b data-a=\"rx\" data-id=\"" + id + "\" data-e=\"" + r[0] + "\">" + r[1] + "</b>"; }).join("") + "</span>";
        else h += "<button type=\"button\" class=\"fil-p ajt\" data-a=\"pk\" data-id=\"" + id + "\" aria-label=\"Réagir\">☺ +</button>";
        if (REACTS.some(function (r) { return n[r[0]] > 0; })) h += "<button type=\"button\" class=\"fil-qui\" data-a=\"qui\" data-id=\"" + id + "\">" + (String(st.qui) === String(id) ? "▴ QUI ?" : "QUI ?") + "</button>";
        return "<div class=\"fil-rx" + (compact ? " c" : "") + "\">" + h + (extra || "") + "</div>" + (String(st.qui) === String(id) ? quiHtml(id) : "");
    }
    // qui a reagi (noms lus a la demande : SQL 159, jamais avec le chargement du fil)
    function quiHtml(id) {
        var d = st.noms[id], h = "<div class=\"fil-who\">";
        if (!d) return h + "<span class=\"fil-wc\">Chargement…</span></div>";
        var vide = true;
        REACTS.forEach(function (r) { if (d[r[0]] && d[r[0]].length) { vide = false; h += "<div><span>" + r[1] + "</span> " + d[r[0]].map(function (x) { return "<b>" + esc(x) + "</b>"; }).join(", ") + "</div>"; } });
        return h + (vide ? "<span class=\"fil-wc\">Personne pour l’instant.</span>" : "") + "</div>";
    }
    async function chargerQui(id) {
        var db = st.o.db; if (!db) return;
        try {
            var r = await db.rpc("journal_reactions_qui", { p_id: Number(id) });
            st.noms[id] = !r.error && r.data && typeof r.data === "object" ? r.data : {};
        } catch (e) { st.noms[id] = {}; }
        if (String(st.qui) === String(id)) rendre();
    }
    async function chargerRx(ids) {
        var db = st.o.db; if (!db || !ids.length) return;
        try {
            var r = await db.rpc("journal_reactions_lire", { p_ids: ids.slice(0, 200) });
            if (r.error) { st.rxDispo = false; }
            else if (r.data && typeof r.data === "object") { st.rx = { n: r.data.n || {}, moi: r.data.moi || {} }; st.rxDispo = true; }
        } catch (e) { st.rxDispo = false; }
    }
    function assurerPuissances() {
        if (window.EdteamPuissances) return Promise.resolve();
        return new Promise(function (ok) { var s = document.createElement("script"); s.src = "puissances.js?v=2"; s.onload = ok; s.onerror = ok; document.head.appendChild(s); });
    }
    async function chargerStatuts() {
        var db = st.o.db; if (!db || st.crDispo === false) return;
        var noms = [], vu = {};
        st.data.slice(0, 80).forEach(function (l) {
            if (String(l.type_action || "").toUpperCase().indexOf("JOUEUR CROISÉ") < 0) return;
            var x = ligneCroise(l); if (!x) return;
            var k = x.nom.toLowerCase(); if (!vu[k] && !(k in st.statuts)) { vu[k] = 1; noms.push(x.nom); }
        });
        if (!noms.length) { if (Object.keys(st.statuts).length) await assurerHolos(); return; }
        try {
            await assurerPuissances();
            var r = await db.rpc("joueurs_croises_statuts", { p_noms: noms.slice(0, 60) });
            if (r.error) { st.crDispo = false; return; }
            var d = r.data && typeof r.data === "object" ? r.data : {};
            noms.slice(0, 60).forEach(function (n) { var k = n.toLowerCase(); st.statuts[k] = d[k] || { _: 1 }; });
            await assurerHolos();
        } catch (e) { st.crDispo = false; }
    }
    async function reagir(id, code) {
        var db = st.o.db; if (!db) return;
        var avant = { n: JSON.parse(JSON.stringify(st.rx.n[id] || {})), moi: st.rx.moi[id] };
        var n = st.rx.n[id] = st.rx.n[id] || {}, cur = st.rx.moi[id];
        if (cur) { n[cur] = Math.max(0, (n[cur] || 1) - 1); if (!n[cur]) delete n[cur]; }
        if (cur === code) { delete st.rx.moi[id]; } else { n[code] = (n[code] || 0) + 1; st.rx.moi[id] = code; }
        st.picker = null; rendre();
        try {
            var r = await db.rpc("journal_reagir", { p_id: Number(id), p_emoji: cur === code ? null : code });
            if (r.error || !r.data || !r.data.ok) throw new Error("refus");
            st.rx.n[id] = r.data.n || {}; if (r.data.moi) st.rx.moi[id] = r.data.moi; else delete st.rx.moi[id];
        } catch (e) { st.rx.n[id] = avant.n; if (avant.moi) st.rx.moi[id] = avant.moi; else delete st.rx.moi[id]; }
        delete st.noms[id]; if (String(st.qui) === String(id)) chargerQui(id);
        rendre();
    }

    // ------------------------------------------------------------------------------------------------------------
    // RENDU
    // ------------------------------------------------------------------------------------------------------------
    var LOGO = "<svg viewBox=\"0 0 100 100\" aria-hidden=\"true\"><polygon points=\"48,15 15,35 30,50 10,70 48,85 48,65 30,55 48,40\" fill=\"#00F0FF\"/><polygon points=\"52,15 85,35 70,50 90,70 52,85 52,65 70,55 52,40\" fill=\"#FF7100\"/><polygon points=\"50,45 42,55 50,65 58,55\" fill=\"#fff\" opacity=\".9\"/></svg>";
    function carte(l, c, p) {
        var d = new Date(l.created_at), nl = st.o.estLu && !st.o.estLu(l.id) && Date.now() - d.getTime() < NOUVEAU_H * 3600000;
        var bk = !!(st.flashIds && st.flashIds[l.id]);
        var photo = ""; try { if (p.nom && st.o.photo) photo = st.o.photo(l.user_id, p.nom) || ""; } catch (e) { /* initiales */ }      // photo du pilote (EDTEAMPhotos) ; sans photo ou si elle ne charge pas : les initiales restent
        var holo = c.k === "cr" && p.cr ? holoDe(p.cr, "fh" + l.id, p.stamp) : "";        // hologramme du vaisseau croise, teinte par le camp
        var logo = c.k === "bi" && String(c.nom).indexOf("BILAN") >= 0 ? LOGO : "";        // bilan reseau : le logo EDTEAM dans l'hexagone
        var hex = logo ? "<div class=\"fil-hex logo\">" + logo + "</div>" : holo ? "<div class=\"fil-hex holo\">" + holo + "</div>" : "<div class=\"fil-hex\"><span>" + (p.av ? esc(p.av) : c.ic) + "</span>" + (photo ? "<img src=\"" + esc(photo) + "\" alt=\"\" loading=\"lazy\" decoding=\"async\" onerror=\"this.remove()\">" : "") + "</div>";
        var tp = p.stamp ? { t: p.stamp.t, c: p.stamp.c } : tampon(l, c), col = p.stamp ? p.stamp.c : c.col;
        return "<div class=\"fil-it" + (c.maj ? " maj" : "") + (nl ? " nl" : "") + (st.fresh && st.fresh[l.id] ? " arr" : "") + (bk ? " bk" : "") + "\" style=\"--k:" + col + "\" id=\"fil-" + l.id + "\">" + (nl ? "<span class=\"fil-new\">NOUVEAU</span>" : "") + hex
            + "<div class=\"fil-cx\"><div class=\"fil-cat\">" + (bk ? "<b class=\"fil-flash\">⚡ FLASH INFO</b>" : "") + esc(c.nom) + "</div><div class=\"fil-tt\">" + p.tit + "</div>" + (p.sb ? "<div class=\"fil-sb\">" + p.sb + "</div>" : "") + "</div>"
            + "<div class=\"fil-tm\">" + heure(d) + "<i>" + ilYa(d) + "</i>" + tpHtml(tp) + "</div>" + rxHtml(l.id, false, c.k === "cr" ? inaraHtml(p.cr) : "") + "</div>";
    }
    function groupe(g, c) {
        var cle = "g" + g[0].id, ouvert = !!st.ouverts[cle], d = new Date(g[0].created_at), n = g.length, titre, corps = "";
        if (c.k === "cr") titre = "<b>" + n + " nouveaux joueurs</b> croisés par l’escadron";
        else if (c.k === "nm") titre = "<b>" + n + " nouvelles missions</b> BGS";
        else titre = "<b>" + n + " directives</b> modifiées";
        if (!ouvert) {
            var vus = g.slice(0, c.k === "cr" ? 4 : 3);
            corps = "<div class=\"fil-puces\">" + vus.map(function (l) {
                var x = c.k === "cr" ? ligneCroise(l) : null, sc = x ? statutDe(x.nom) : null;
                return x ? "<span" + (sc ? " style=\"border-left:3px solid " + sc.c + "\"" : "") + ">" + esc(x.nom) + "<em>" + esc(x.v) + " · " + esc(x.s) + "</em>" + (sc ? tpHtml({ t: sc.t, c: sc.c }, true) : "") + "</span>" : "<span>" + esc(l.details) + "</span>";
            }).join("") + (n > vus.length ? "<span class=\"fil-cmpt\">+ " + (n - vus.length) + " autres</span>" : "") + "</div>";
        } else {
            corps = "<div class=\"fil-sous\">" + g.map(function (l) {
                var x = c.k === "cr" ? ligneCroise(l) : null, dd = new Date(l.created_at), sc = x ? statutDe(x.nom) : null;
                return "<div class=\"fil-sl\"><div class=\"fil-slt\"><span class=\"fil-slh\">" + heure(dd) + "</span> " + (x ? "<b>" + esc(x.nom) + "</b> <em>" + esc(x.v) + " · " + esc(x.s) + (sc && sc.why ? " · " + esc(sc.why) : "") + "</em>" + (sc ? tpHtml({ t: sc.t, c: sc.c }, true) : "") : esc(l.details)) + "</div>" + rxHtml(l.id, true, x ? inaraHtml(x.nom) : "") + "</div>";
            }).join("") + "</div>";
        }
        var nbEn = c.k === "cr" ? g.filter(function (l) { var x = ligneCroise(l), s = x ? statutDe(x.nom) : null; return s && s.k === "r"; }).length : 0;
        var colg = c.k === "cr" && nbEn ? COUL.r : c.col;       // groupe de joueurs croises : bande rouge s'il compte un ennemi
        var tpg = c.k === "cr" ? (nbEn ? { t: nbEn + " ENNEMI" + (nbEn > 1 ? "S" : ""), c: colg } : null) : c.k === "nm" ? { t: "NOUVELLES", c: colg } : { t: "MODIFIÉES", c: colg };
        var hexg = "<div class=\"fil-hex\"><span>" + c.ic + "</span></div>";
        if (c.k === "cr") { var x0 = ligneCroise(g[0]), h0 = x0 ? holoDe(x0.nom, "fg" + g[0].id, statutDe(x0.nom) || null) : ""; if (h0) hexg = "<div class=\"fil-hex holo\">" + h0 + "</div>"; }
        else {
            var auteurs = {}; g.forEach(function (l) { var a = String(l.cmdr_nom || ""); if (a && a.toUpperCase() !== "SYS.EDTEAM") auteurs[a] = 1; });
            var an = Object.keys(auteurs);
            if (an.length === 1) { var ph = ""; try { ph = st.o.photo ? st.o.photo(g[0].user_id, an[0]) || "" : ""; } catch (e) { ph = ""; } hexg = "<div class=\"fil-hex\"><span>" + esc(ini(an[0])) + "</span>" + (ph ? "<img src=\"" + esc(ph) + "\" alt=\"\" loading=\"lazy\" decoding=\"async\" onerror=\"this.remove()\">" : "") + "</div>"; }
        }
        return "<div class=\"fil-it gr" + (g.some(function (l) { return st.fresh && st.fresh[l.id]; }) ? " arr" : "") + "\" style=\"--k:" + colg + "\">" + hexg + "<div class=\"fil-cx\"><div class=\"fil-cat\">" + esc(c.k === "cr" ? "JOUEURS CROISÉS" : c.k === "nm" ? "NOUVELLES MISSIONS BGS" : "DIRECTIVES MODIFIÉES") + "</div><div class=\"fil-tt\">" + titre + "</div>" + corps
            + "<div class=\"fil-plus\" data-a=\"tg\" data-g=\"" + cle + "\">" + (ouvert ? "▴ RÉDUIRE" : "▾ TOUT VOIR ET RÉAGIR") + "</div></div><div class=\"fil-tm\">" + heure(d) + "<i>" + ilYa(d) + "</i>" + tpHtml(tpg) + "</div></div>";
    }
    function filtrees() {
        return st.data.filter(function (l) { return st.filtre === "tout" || categorie(l).f === st.filtre; });
    }
    function compter() {
        var n = { tout: st.data.length, bgs: 0, dist: 0, esc: 0, cro: 0 };
        st.data.forEach(function (l) { n[categorie(l).f]++; });
        return n;
    }
    function listeHtml() {
        var all = filtrees(), vis = all.slice(0, st.nb), h = "", jour = "", i = 0;
        if (!all.length) return "<div class=\"fil-vide\">> AUCUNE TRANSMISSION</div>";
        while (i < vis.length) {
            var l = vis[i], c = categorie(l), d = new Date(l.created_at), jc = jourCle(d);
            if (jc !== jour) { jour = jc; h += "<div class=\"fil-jour\">" + jourLib(d) + "</div>"; }
            if (c.grp) {
                var g = [l], j = i + 1;
                while (j < vis.length && categorie(vis[j]).k === c.k && jourCle(new Date(vis[j].created_at)) === jc) { g.push(vis[j]); j++; }
                if (g.length >= GROUPE_MIN) { h += groupe(g, c); i = j; continue; }
            }
            h += carte(l, c, presenter(l, c)); i++;
        }
        return h + (all.length > vis.length ? "<button type=\"button\" class=\"fil-mr\" data-a=\"plus\">CHARGER LES PLUS ANCIENNES ▾</button>" : "");
    }
    function bandeau() {
        var l = st.data.filter(function (x) { return categorie(x).maj; }).slice(0, 6).map(function (x) { return sec(presenter(x, categorie(x)).tit); });     // deja echappe : on retire seulement les balises
        if (!l.length) l = st.data.slice(0, 5).map(function (x) { return esc(x.details); });
        if (st.flashOn) {       // flash info : les lignes qui viennent d'arriver passent en tete du bandeau, en blanc
            var f = st.data.filter(function (x) { return st.flashIds && st.flashIds[x.id]; }).map(function (x) { return "<strong>" + sec(presenter(x, categorie(x)).tit) + "</strong>"; });
            l = f.concat(l.slice(0, 4));
        }
        var t = l.join("<span>◆</span>");
        return "<b>" + (st.flashOn ? "⚡ FLASH INFO" : "DERNIÈRE MINUTE") + "</b><div class=\"rl\"><div>" + t + "<span>◆</span>" + t + "<span>◆</span></div></div>";
    }
    function squelette() {
        var m = st.o.mode === "mob";
        st.el.innerHTML = "<div class=\"fil-jr " + (m ? "mob" : "pc") + "\">"
            + (m ? "" : "<div class=\"fil-hd\"><div class=\"fil-ti\">Fil de l’escadron<small>" + esc(String(st.o.escadron || "").toUpperCase()) + " · TRANSMISSIONS</small></div><div class=\"fil-live\"><i></i>EN DIRECT</div></div><div class=\"fil-tk\"></div>")
            + "<div class=\"fil-fl\"></div><div class=\"fil-liste\"></div></div>";
        st.vue = { liste: st.el.querySelector(".fil-liste"), fl: st.el.querySelector(".fil-fl"), tk: st.el.querySelector(".fil-tk") };
    }
    function rendre() {
        if (!st.el) return;
        if (!st.vue || !st.el.contains(st.vue.liste)) squelette();
        var pos = st.vue.liste.scrollTop, n = compter();
        st.vue.fl.innerHTML = [["tout", "Tout"], ["bgs", "BGS"], ["dist", "Distinctions"], ["esc", "Escadron"], ["cro", "Joueurs croisés"]].map(function (f) {
            return "<button type=\"button\" data-a=\"f\" data-f=\"" + f[0] + "\" class=\"" + (st.filtre === f[0] ? "on" : "") + "\">" + f[1] + "<em>" + n[f[0]] + "</em></button>";
        }).join("");
        if (st.vue.tk) { var bh = st.data.length ? bandeau() : ""; if (st.tkHtml !== bh) { st.vue.tk.innerHTML = bh; st.tkHtml = bh; } }
        var rt = st.el.querySelector(".fil-jr"); if (rt) rt.classList.toggle("flash", !!st.flashOn);
        st.vue.liste.innerHTML = listeHtml();
        st.vue.liste.scrollTop = pos;
        surveiller();
    }

    // ------------------------------------------------------------------------------------------------------------
    // INTERACTIONS
    // ------------------------------------------------------------------------------------------------------------
    function clic(ev) {
        var b = ev.target.closest ? ev.target.closest("[data-a]") : null;
        if (!b || !st.el.contains(b)) { if (st.picker != null || st.qui != null) { st.picker = null; st.qui = null; rendre(); } return; }
        var a = b.getAttribute("data-a"), id = b.getAttribute("data-id");
        if (typeof window.sonClic === "function" && a !== "card") { try { window.sonClic(); } catch (e) { /* son indisponible */ } }
        if (a === "f") { st.filtre = b.getAttribute("data-f"); st.nb = PAS; st.picker = null; rendre(); if (st.vue.liste) st.vue.liste.scrollTop = 0; }
        else if (a === "plus") { st.nb += PAS; rendre(); }
        else if (a === "tg") { var g = b.getAttribute("data-g"); st.ouverts[g] = !st.ouverts[g]; rendre(); }
        else if (a === "pk") { st.picker = String(st.picker) === String(id) ? null : id; rendre(); }
        else if (a === "qui") { if (String(st.qui) === String(id)) st.qui = null; else { st.qui = id; st.picker = null; if (!st.noms[id]) chargerQui(id); } rendre(); }
        else if (a === "rx") { reagir(id, b.getAttribute("data-e")); }
    }

    // « NOUVEAU » : une ligne est marquee lue quand elle reste a l'ecran (au moins a moitie visible) pendant 3 secondes ; aucun clic necessaire
    var obs = null, minut = {};
    function surveiller() {
        if (obs) { obs.disconnect(); obs = null; }
        Object.keys(minut).forEach(function (k) { clearTimeout(minut[k]); delete minut[k]; });
        if (!st.o.marquerLu || typeof IntersectionObserver === "undefined" || !st.vue) return;
        var cartes = st.vue.liste.querySelectorAll(".fil-it.nl"); if (!cartes.length) return;
        obs = new IntersectionObserver(function (es) {
            es.forEach(function (e) {
                var id = e.target.id.slice(4);
                if (e.isIntersecting) {
                    if (minut[id]) return;
                    minut[id] = setTimeout(function () {
                        delete minut[id]; if (document.hidden) return;
                        try { st.o.marquerLu(id); } catch (x) { /* lecture non memorisee */ }
                        var el = document.getElementById("fil-" + id);
                        if (el) { el.classList.remove("nl"); var nw = el.querySelector(".fil-new"); if (nw) nw.remove(); }
                        if (obs) obs.unobserve(e.target);
                    }, 3000);
                } else if (minut[id]) { clearTimeout(minut[id]); delete minut[id]; }
            });
        }, { root: st.vue.liste, threshold: [0.5] });
        cartes.forEach(function (c) { obs.observe(c); });
    }

    // ------------------------------------------------------------------------------------------------------------
    // CSS
    // ------------------------------------------------------------------------------------------------------------
    var CSS = ""
        + ".fil-jr{--am:#FF9A1F;--cy:#00E5F5;--ln:rgba(160,190,210,.13);--mu:#7d8c97;position:relative;display:flex;flex-direction:column;min-height:0;font-family:Bahnschrift,'Segoe UI',system-ui,sans-serif;color:#d6e0e6;background:transparent;text-shadow:none;letter-spacing:normal;text-align:left}"
        + ".fil-jr.pc{height:100%}.fil-jr *{box-sizing:border-box}"
        + ".fil-hd{display:flex;align-items:center;gap:18px;padding:14px 26px 12px;border-bottom:1px solid var(--ln);position:relative;flex:none}.fil-hd::after{content:'';position:absolute;left:0;bottom:-1px;width:150px;height:2px;background:var(--am);box-shadow:0 0 12px var(--am)}"
        + ".fil-ti{font-size:21px;letter-spacing:5px;text-transform:uppercase;color:#fff;font-weight:600}.fil-ti small{display:block;font-size:11px;letter-spacing:4px;color:var(--mu);font-weight:400;margin-top:2px}"
        + ".fil-live{margin-left:auto;display:flex;align-items:center;gap:8px;font-size:11px;letter-spacing:3px;color:var(--cy);border:1px solid rgba(0,229,245,.4);padding:5px 11px;background:rgba(0,229,245,.06)}.fil-live i{width:7px;height:7px;border-radius:50%;background:var(--cy);box-shadow:0 0 8px var(--cy);animation:fil-bat 1.6s ease-in-out infinite}@keyframes fil-bat{50%{opacity:.25}}"
        + ".fil-tk{display:flex;align-items:stretch;border-bottom:1px solid var(--ln);background:rgba(255,154,31,.045);font-size:12.5px;overflow:hidden;height:34px;flex:none}.fil-tk:empty{display:none}"
        + ".fil-tk>b{flex:none;background:var(--am);color:#1a0d00;letter-spacing:3px;font-size:11px;padding:0 22px 0 14px;display:flex;align-items:center;clip-path:polygon(0 0,100% 0,calc(100% - 10px) 100%,0 100%)}"
        + ".fil-tk .rl{flex:1;overflow:hidden;display:flex;align-items:center;-webkit-mask:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent);mask:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent)}"
        + ".fil-tk .rl div{white-space:nowrap;animation:fil-def 70s linear infinite;color:#c9d6de;will-change:transform}.fil-tk .rl:hover div{animation-play-state:paused}.fil-tk .rl span{color:var(--am);margin:0 14px}@keyframes fil-def{to{transform:translateX(-50%)}}"
        + ".fil-fl{display:flex;gap:8px;padding:12px 26px;flex-wrap:wrap;flex:none}.fil-fl button{font:inherit;font-size:11.5px;letter-spacing:2.5px;text-transform:uppercase;color:var(--mu);background:transparent;border:1px solid var(--ln);padding:6px 13px;cursor:pointer;clip-path:polygon(0 0,calc(100% - 7px) 0,100% 7px,100% 100%,7px 100%,0 calc(100% - 7px))}"
        + ".fil-fl button.on{color:#1a0d00;background:var(--am);border-color:var(--am)}.fil-fl button:not(.on):hover{color:#fff;border-color:var(--mu)}.fil-fl em{font-style:normal;opacity:.6;margin-left:6px}"
        + ".fil-liste{flex:1;min-height:0;overflow-y:auto;padding:2px 26px 14px;scrollbar-width:thin;scrollbar-color:#3a4a57 transparent}"
        + ".fil-jour{display:flex;align-items:center;gap:14px;font-size:11px;letter-spacing:5px;color:var(--mu);margin:14px 0 10px}.fil-jour::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,var(--ln),transparent)}"
        + ".fil-it{--k:#00E5F5;position:relative;display:grid;grid-template-columns:46px 1fr auto;gap:0 16px;padding:11px 14px;margin-bottom:8px;background:#0b1017;border:1px solid var(--ln);border-left:3px solid var(--k);clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,0 100%);cursor:default}"
        + ".fil-it:hover{background:#0e151d}.fil-it.nl{box-shadow:inset 0 0 26px color-mix(in srgb,var(--k) 14%,transparent)}"
        + ".fil-hex{width:44px;height:48px;display:grid;place-items:center;font-size:20px;color:var(--k);background:color-mix(in srgb,var(--k) 22%,#05080c);clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);position:relative}.fil-hex::before{content:'';position:absolute;inset:1px;background:#070b10;clip-path:inherit}.fil-hex span{position:relative;text-shadow:0 0 10px var(--k)}.fil-hex.holo svg{position:absolute;inset:4px;width:calc(100% - 8px);height:calc(100% - 8px);z-index:1}.fil-hex .tbs-balai{animation:fil-bal 4s linear infinite}@keyframes fil-bal{from{transform:translateY(0)}to{transform:translateY(var(--h))}}.fil-hex.logo svg{position:absolute;inset:7px;width:calc(100% - 14px);height:calc(100% - 14px);z-index:1;filter:drop-shadow(0 0 6px rgba(0,240,255,.45))}.fil-hex.holo::before{background:#04080c}.fil-hex img{position:absolute;inset:3px;width:calc(100% - 6px);height:calc(100% - 6px);object-fit:cover;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)}"
        + ".fil-cat{font-size:10.5px;letter-spacing:3px;color:var(--k);text-transform:uppercase}.fil-tt{font-size:16.5px;line-height:1.3;color:#f1f6f8;margin-top:3px;letter-spacing:.3px;overflow-wrap:anywhere}.fil-tt b{color:var(--k);font-weight:600}"
        + ".fil-sb{font-size:13px;color:#93a3ae;margin-top:3px;line-height:1.45}.fil-sb b{color:#cfdbe2;font-weight:500}"
        + ".fil-tm{font-size:11.5px;color:var(--mu);letter-spacing:1px;white-space:nowrap;text-align:right;font-family:'Share Tech Mono',Consolas,monospace}.fil-tm i{display:block;font-style:normal;opacity:.65;margin-top:3px;font-size:10.5px}"
        + ".fil-it.maj{grid-template-columns:76px 1fr auto;padding:15px 16px;background:linear-gradient(90deg,color-mix(in srgb,var(--k) 11%,#0b1017),#0b1017 62%)}.fil-it.maj .fil-hex{width:70px;height:76px;font-size:28px}.fil-it.maj .fil-tt{font-size:22px;letter-spacing:.5px;font-weight:600}.fil-it.maj .fil-sb{font-size:14px}"
        + ".fil-it.nl .fil-tm{padding-top:14px}.fil-tm .fil-tp{margin-top:9px;float:right}"
        + ".fil-tp{display:inline-block;border:2px solid var(--t);color:var(--t);padding:2px 9px;letter-spacing:3px;font-size:11px;font-weight:700;text-transform:uppercase;background:color-mix(in srgb,var(--t) 10%,transparent);box-shadow:0 0 12px color-mix(in srgb,var(--t) 22%,transparent);white-space:nowrap;font-family:Bahnschrift,'Segoe UI',system-ui,sans-serif}"
        + ".fil-tp.pt{font-size:9px;padding:0 5px;border-width:1px;letter-spacing:2px;margin-left:8px;vertical-align:1px;box-shadow:none}"
        + ".fil-it.arr .fil-tp,.fil-it.bk .fil-tp{animation:fil-cachet .45s cubic-bezier(.2,1.6,.4,1) .35s both}@keyframes fil-cachet{from{transform:scale(2.2);opacity:0}to{transform:none;opacity:1}}.fil-it.arr{animation:fil-arr 1.1s cubic-bezier(.2,.8,.2,1) both}@keyframes fil-arr{0%{opacity:0;transform:translateY(-22px);box-shadow:0 0 0 0 transparent}35%{opacity:1;box-shadow:0 0 34px 2px color-mix(in srgb,var(--k) 55%,transparent),inset 0 0 30px color-mix(in srgb,var(--k) 25%,transparent)}100%{transform:none}}.fil-it.bk{border-left-width:5px;background:linear-gradient(90deg,color-mix(in srgb,var(--k) 22%,#0b1017),#0b1017 70%);animation:fil-arr 1.1s cubic-bezier(.2,.8,.2,1) both,fil-bk 1.6s ease-in-out 1.1s 4}"
        + ".fil-it.bk::after{content:'';position:absolute;top:0;bottom:0;width:90px;left:-120px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent);animation:fil-glisse 1.8s ease-in-out .3s 4;pointer-events:none}"
        + "@keyframes fil-bk{50%{box-shadow:0 0 26px color-mix(in srgb,var(--k) 55%,transparent),inset 0 0 26px color-mix(in srgb,var(--k) 22%,transparent)}}@keyframes fil-glisse{0%{left:-120px}70%,100%{left:calc(100% + 40px)}}"
        + ".fil-flash{display:inline-block;background:#FF9A1F;color:#1a0d00;font-weight:700;letter-spacing:3px;font-size:10px;padding:2px 8px;margin-right:10px;animation:fil-clig 1s steps(1) infinite}@keyframes fil-clig{50%{background:#fff3c4}}"
        + ".fil-jr.flash::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:3;box-shadow:inset 0 0 0 1px rgba(255,154,31,.7),inset 0 0 40px rgba(255,154,31,.25);animation:fil-cadre 1.5s ease-in-out 5}@keyframes fil-cadre{50%{opacity:.25}}"
        + ".fil-jr.flash .fil-tk>b{animation:fil-clig 1s steps(1) infinite}.fil-tk strong{color:#fff;font-weight:700;text-shadow:0 0 10px rgba(255,154,31,.7)}"
        + ".fil-new{position:absolute;right:30px;top:-1px;background:#FF7100;color:#1a0900;font-size:9.5px;letter-spacing:2.5px;padding:2px 8px}"
        + ".fil-puces{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.fil-puces span{font-size:12px;background:#0a1219;border:1px solid var(--ln);padding:3px 9px;color:#b8c7d0;overflow-wrap:anywhere}.fil-puces em{font-style:normal;color:var(--mu);margin-left:6px}.fil-puces .fil-cmpt{opacity:.55}"
        + ".fil-plus{color:var(--cy);font-size:12px;letter-spacing:2px;margin-top:9px;cursor:pointer;display:inline-block}.fil-plus:hover{color:#fff}"
        + ".fil-sous{margin-top:8px;border-top:1px solid var(--ln)}.fil-sl{padding:7px 0;border-bottom:1px solid var(--ln)}.fil-slt{font-size:13.5px;color:#c4d1d8;overflow-wrap:anywhere}.fil-slt b{color:#00E5F5;font-weight:600}.fil-slt em{font-style:normal;color:var(--mu)}.fil-slh{font-family:'Share Tech Mono',Consolas,monospace;font-size:11px;color:var(--mu);margin-right:6px}"
        + ".fil-rx{grid-column:2/4;display:flex;align-items:center;gap:6px;margin-top:9px;flex-wrap:wrap}.fil-rx.c{margin-top:6px}"
        + ".fil-p{font:inherit;font-size:13px;line-height:1;background:rgba(255,255,255,.035);border:1px solid var(--ln);color:#c9d6de;padding:4px 9px;border-radius:14px;cursor:pointer;display:inline-flex;gap:6px;align-items:center}.fil-p:hover{border-color:var(--am)}.fil-p.moi{border-color:var(--am);background:rgba(255,154,31,.13);color:#fff}.fil-p.ajt{color:var(--mu);font-size:12px;letter-spacing:1px;padding:4px 10px;opacity:.75}.fil-it:hover .fil-p.ajt,.fil-p.ajt:focus{opacity:1}"
        + ".fil-qui{font:inherit;font-size:10.5px;letter-spacing:2px;color:var(--cy);background:transparent;border:0;cursor:pointer;padding:4px 6px;opacity:.8}.fil-qui:hover{opacity:1;text-decoration:underline}"
        + ".fil-who{grid-column:2/4;margin-top:8px;padding:8px 12px;background:#0a1219;border:1px solid var(--ln);border-left:2px solid var(--am);font-size:13px;line-height:1.7;color:#b8c7d0}.fil-who div{overflow-wrap:anywhere}.fil-who b{color:#e8f1f6;font-weight:500}.fil-who span:first-child{margin-right:4px}.fil-wc{color:var(--mu);font-style:italic}"
        + ".fil-ina{margin-left:auto;font-size:10.5px;letter-spacing:2px;color:var(--am);text-decoration:none;border:1px solid rgba(255,154,31,.5);padding:3px 9px;white-space:nowrap}.fil-ina:hover{background:rgba(255,154,31,.16);color:#fff}.fil-pick{display:flex;gap:2px;background:#0a1017;border:1px solid var(--am);padding:3px 5px;border-radius:16px;box-shadow:0 6px 22px rgba(0,0,0,.6)}.fil-pick b{font-weight:400;font-size:19px;padding:2px 6px;cursor:pointer;border-radius:10px;transition:transform .12s}.fil-pick b:hover{background:rgba(255,154,31,.25);transform:scale(1.2)}"
        + ".fil-mr{display:block;margin:10px auto 4px;font:inherit;font-size:11.5px;letter-spacing:3px;color:var(--cy);background:transparent;border:1px solid rgba(0,229,245,.4);padding:8px 18px;cursor:pointer}.fil-mr:hover{background:rgba(0,229,245,.1)}"
        + ".fil-vide{color:#667;font-size:13px;letter-spacing:3px;text-align:center;padding:30px}"
        + ".fil-jr.mob{background:transparent}.fil-jr.mob .fil-fl{padding:6px 0 10px}.fil-jr.mob .fil-liste{padding:0}"
        + "@media(max-width:700px){.fil-hd{padding:12px 16px}.fil-ti{font-size:15px;letter-spacing:3px}.fil-live{display:none}.fil-fl{padding:10px 14px}.fil-liste{padding:2px 14px 12px}.fil-it,.fil-it.maj{grid-template-columns:40px 1fr;padding:11px 12px}.fil-it .fil-tm{grid-column:2;text-align:left;margin-top:5px}.fil-it .fil-hex,.fil-it.maj .fil-hex{width:40px;height:44px;font-size:18px}.fil-it.maj .fil-tt{font-size:17px}.fil-rx{grid-column:1/3}.fil-p.ajt{opacity:1}.fil-tk{font-size:11.5px}}"
        + ".fil-jr.mob .fil-it,.fil-jr.mob .fil-it.maj{grid-template-columns:40px 1fr;padding:10px}.fil-jr.mob .fil-it .fil-tm{grid-column:2;text-align:left;margin-top:5px}.fil-jr.mob .fil-it .fil-hex,.fil-jr.mob .fil-it.maj .fil-hex{width:40px;height:44px;font-size:18px}.fil-jr.mob .fil-it.maj .fil-tt{font-size:17px}.fil-jr.mob .fil-rx{grid-column:1/3}.fil-jr.mob .fil-p.ajt{opacity:1}.fil-jr.mob .fil-fl{padding-left:0;padding-right:0}"
        + "@media (prefers-reduced-motion:reduce){.fil-jr *{animation:none!important}}";
    function css() { if (document.getElementById("edteam-fil-css")) return; var s = document.createElement("style"); s.id = "edteam-fil-css"; s.textContent = CSS; document.head.appendChild(s); }

    window.EdteamFil = {
        monter: function (el, opts) {
            css(); st.el = el; st.o = opts || {}; st.vue = null;
            if (!el.getAttribute("data-fil")) { el.setAttribute("data-fil", "1"); el.addEventListener("click", clic); }
            rendre();
        },
        // lignes : tableau de journal_activite, de la plus recente a la plus ancienne ; avecReactions : relit les reactions (une requete)
        donner: async function (lignes, avecReactions) {
            // la page garde le MEME tableau et lui ajoute les nouvelles lignes en place : on compare donc a la liste des identifiants deja affichee, pas a l'ancien tableau
            st.data = Array.isArray(lignes) ? lignes.slice() : [];
            var ids = new Set(st.data.map(function (l) { return String(l.id); }));
            st.fresh = {};          // lignes arrivees depuis le dernier affichage : elles glissent en haut avec un petit eclat
            if (st.ids && st.ids.size) st.data.forEach(function (l) { if (!st.ids.has(String(l.id))) st.fresh[l.id] = 1; });
            st.ids = ids;
            st.flashIds = st.flashIds || {};
            var nbf = 0; Object.keys(st.fresh).forEach(function (id) { var l = st.data.filter(function (x) { return String(x.id) === id; })[0]; if (l && categorie(l).k !== "cr") { st.flashIds[id] = 1; nbf++; } });
            if (nbf) { st.flashOn = true; clearTimeout(st.tFlash); st.tFlash = setTimeout(function () { st.flashOn = false; st.flashIds = {}; rendre(); }, 9000); }
            clearTimeout(st.tFresh); st.tFresh = setTimeout(function () { st.fresh = {}; }, 2500);
            await Promise.all([
                avecReactions !== false ? chargerRx(st.data.map(function (l) { return Number(l.id); }).filter(function (x) { return x > 0; })) : null,
                chargerStatuts()
            ]);
            rendre();
        },
        rendre: rendre
    };
})();
