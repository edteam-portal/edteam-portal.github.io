// RAPPORT DE L'AMIRAUTE POUR DISCORD (page BGS, Amiral / Directeur) : tout ce qui a ete fait sur chaque systeme sous directive, sur la periode choisie, mis en page en messages Discord prets a coller.
// Donnees : rpc rapport_amiral(p_depuis) (SQL 162 : totaux ANONYMES, nombres de pilotes seulement) + les resultats du jeu deja charges par la page (influence, courbe, score des guerres et elections).
// Mise en page : titres Discord (#, ##, ###), sous-texte (-#), citations (>), listes, gras, horodatages <t:...> (heure locale de chaque lecteur). Messages decoupes a 1 900 caracteres (limite Discord : 2 000).
// L'Amiral peut retirer n'importe quelle ligne (✕), ecarter un systeme (memorise sur son appareil) et copier message par message ou tout d'un coup.
(function () {
    "use strict";
    if (window.EdteamRapport) return;
    var MAX = 1900, CLE_EXC = "edteam_rapport_exclus_";
    var st = { periode: "tick", data: null, memo: {}, lignes: [], ret: {}, exclus: {}, msgs: [], charge: false, erreur: "" };

    function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
    // texte venu de la base (noms de systemes, de factions, de campagnes) : rien ne doit etre lu comme du Discord (gras, mention, lien)
    function dc(s) { return String(s == null ? "" : s).replace(/([\\*_~`|>])/g, "\\$1").replace(/@/g, "@\u200b"); }
    function nb(n, d) { return Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
    function cr(n) {
        n = Number(n || 0);
        if (n >= 1e9) return nb(n / 1e9, 2) + " Md CR";
        if (n >= 1e6) return nb(n / 1e6, 1) + " M CR";
        if (n >= 1e3) return nb(n / 1e3, 0) + " k CR";
        return nb(n) + " CR";
    }
    function uid() { try { return (window.profilCommandant && window.profilCommandant.user_id) || "x"; } catch (e) { return "x"; } }
    function lireExclus() { try { var a = JSON.parse(localStorage.getItem(CLE_EXC + uid()) || "[]"); st.exclus = {}; (Array.isArray(a) ? a : []).forEach(function (s) { st.exclus[String(s)] = 1; }); } catch (e) { st.exclus = {}; } }
    function ecrireExclus() { try { localStorage.setItem(CLE_EXC + uid(), JSON.stringify(Object.keys(st.exclus))); } catch (e) { /* stockage indisponible */ } }

    // ------------------------------------------------------------------------------------------------------------
    // PERIODES
    // ------------------------------------------------------------------------------------------------------------
    var PERIODES = [["tick", "DEPUIS LE DERNIER TICK"], ["24h", "24 HEURES"], ["7j", "7 JOURS"], ["emission", "DEPUIS L’ÉMISSION"]];
    function depuisSec(p) {
        var now = Math.floor(Date.now() / 1000);
        if (p === "24h") return now - 86400;
        if (p === "7j") return now - 7 * 86400;
        if (p === "emission") return null;
        var t = null; try { t = window.EdteamUtile && window.EdteamUtile.dernierTick ? window.EdteamUtile.dernierTick() : null; } catch (e) { t = null; }
        return t ? Math.floor(t / 1000) : now - 86400;
    }
    function libPeriode(p, d) {
        if (p === "emission" || d == null) return "depuis l’émission de chaque directive";
        return (p === "tick" ? "depuis le dernier tick" : p === "24h" ? "sur les dernières 24 h" : "sur les 7 derniers jours") + " (<t:" + d + ":R>)";
    }

    // ------------------------------------------------------------------------------------------------------------
    // CONSTRUCTION DES LIGNES (une ligne = une ligne Discord ; chacune peut etre retiree)
    // ------------------------------------------------------------------------------------------------------------
    var TYPES = { HAUSSE: ["📈", "HAUSSE"], BAISSE: ["📉", "BAISSE"], GUERRE: ["⚔️", "GUERRE"], ELECTION: ["🗳️", "ÉLECTION"] };
    var ACT = {
        HAUSSE: { MISSIONS: ["📝", "Logistique", "inf"], ECONOMIE: ["💰", "Commerce & minage", "cr"], SECURITE: ["💥", "Primes & conflits", "cr"], SCIENCE: ["🔬", "Exploration", "cr"], CZ_VICTOIRES: ["🏆", "Victoires en CZ", "n"], MEURTRES: ["☠️", "Meurtres", "nn"], CONTREBANDE: ["📦", "Contrebande", "cr"], ECHECS: ["❌", "Missions échouées", "nn"], PIRATAGE: ["🏴‍☠️", "Piratage", "nn"], VOLS: ["🎒", "Vols", "nn"] },
        GUERRE: { CZ_VICTOIRES: ["🏆", "Victoires en CZ", "n"], SECURITE: ["⚔️", "Bons de combat", "cr"], MISSIONS: ["🎯", "Missions militaires", "ct"], MEURTRES: ["☠️", "Meurtres", "nn"], ECONOMIE: ["💰", "Commerce & minage", "cr"], SCIENCE: ["🔬", "Exploration", "cr"] },
        ELECTION: { MISSIONS: ["🗳️", "Logistique électorale", "inf"], ECONOMIE: ["💰", "Commerce", "cr"], SCIENCE: ["🔬", "Exploration", "cr"], SECURITE: ["💥", "Primes & conflits", "cr"], CZ_VICTOIRES: ["🏆", "Victoires en CZ", "n"] },
        BAISSE: { MEURTRES: ["☠️", "Meurtres", "nn"], SECURITE: ["💥", "Primes & conflits", "cr"], CONTREBANDE: ["📦", "Contrebande", "cr"], ECHECS: ["❌", "Missions échouées", "nn"], PIRATAGE: ["🏴‍☠️", "Piratage", "nn"], VOLS: ["🎒", "Vols", "nn"], CZ_VICTOIRES: ["🏆", "Victoires en CZ", "n"], MISSIONS: ["📝", "Logistique", "inf"], ECONOMIE: ["💰", "Commerce & minage", "cr"], SCIENCE: ["🔬", "Exploration", "cr"] }
    };
    var ORDRE_ACT = ["MISSIONS", "ECONOMIE", "SECURITE", "SCIENCE", "CZ_VICTOIRES", "MEURTRES", "CONTREBANDE", "ECHECS", "PIRATAGE", "VOLS"];
    function valeur(code, t) {
        if (code === "cr") return "**" + cr(t.total) + "**";
        if (code === "n") return "**" + nb(t.n) + "** victoire" + (t.n > 1 ? "s" : "");
        if (code === "ct") return "**" + nb(t.total) + "** contrat" + (t.total > 1 ? "s" : "");
        if (code === "inf") return "**" + nb(t.total) + "** pt" + (t.total > 1 ? "s" : "") + " d’influence";
        return "**" + nb(t.total) + "**";
    }
    function resultat(id) { try { return ((window.cacheResultatsBgs && window.cacheResultatsBgs.dir) || {})[id] || null; } catch (e) { return null; } }
    // variation d'influence (points) entre la derniere valeur connue AVANT depuis et la valeur actuelle ; depuis = debut de periode (ou emission si plus tardive)
    function deltaDepuis(res, depuis, emission) {
        if (!res || !res.donnees || res.influence == null) return null;
        var cb = res.courbe || [], d = Math.max(depuis || 0, emission || 0); if (cb.length < 1) return null;
        var avant = null; cb.forEach(function (p) { if (Number(p[0]) <= d) avant = p; });
        if (!avant) avant = cb[0];
        return (Number(res.influence) - Number(avant[1])) * 100;
    }
    function pts(v) { return (v > 0 ? "▲ +" : v < 0 ? "▼ −" : "＝ ") + nb(Math.abs(v), 1) + " pts"; }

    function construire() {
        var D = st.data, L = [], n = 0, id = function () { return "l" + (n++); };
        var dir = D.directives || [], pp = D.pp || [], now = D.maintenant, dep = D.depuis;
        function add(grp, txt, o) { var l = { id: id(), grp: grp, txt: txt }; if (o) for (var k in o) l[k] = o[k]; L.push(l); return l; }
        var tot = { ECONOMIE: 0, SECURITE: 0, SCIENCE: 0, MISSIONS: 0, MEURTRES: 0, CZ: 0 };
        dir.forEach(function (d) { var t = d.types || {}; tot.ECONOMIE += (t.ECONOMIE || {}).total || 0; tot.SECURITE += (t.SECURITE || {}).total || 0; tot.SCIENCE += (t.SCIENCE || {}).total || 0; tot.MISSIONS += (t.MISSIONS || {}).total || 0; tot.MEURTRES += (t.MEURTRES || {}).total || 0; tot.CZ += (t.CZ_VICTOIRES || {}).n || 0; });
        var systemes = [], vus = {};
        dir.forEach(function (d) { var k = String(d.systeme || "").toUpperCase(); if (!vus[k]) { vus[k] = { cle: k, nom: d.systeme, dirs: [], pp: [] }; systemes.push(vus[k]); } vus[k].dirs.push(d); });
        pp.forEach(function (m) { var k = String(m.systeme || "").toUpperCase(); if (!vus[k]) { vus[k] = { cle: k, nom: m.systeme, dirs: [], pp: [] }; systemes.push(vus[k]); } vus[k].pp.push(m); });

        // en-tete
        add("ent", "# 📡 RAPPORT DE L’AMIRAUTÉ");
        add("ent", "## " + dc(String(D.escadron || "").toUpperCase()));
        add("ent", "-# Édité le <t:" + now + ":F> · activité " + libPeriode(st.periode, dep));
        add("ent", "**" + dir.length + "** directive" + (dir.length > 1 ? "s" : "") + " actives · **" + systemes.length + "** système" + (systemes.length > 1 ? "s" : "") + " · **" + nb(D.pilotes_total) + "** pilote" + (D.pilotes_total > 1 ? "s" : "") + " engagé" + (D.pilotes_total > 1 ? "s" : ""), { vide: 1 });
        var s1 = [], s2 = [];
        if (tot.ECONOMIE > 0) s1.push("💰 Commerce **" + cr(tot.ECONOMIE) + "**"); if (tot.SECURITE > 0) s1.push("💥 Primes & bons **" + cr(tot.SECURITE) + "**"); if (tot.SCIENCE > 0) s1.push("🔬 Exploration **" + cr(tot.SCIENCE) + "**");
        if (tot.MISSIONS > 0) s2.push("📝 Missions **" + nb(tot.MISSIONS) + "**"); if (tot.MEURTRES > 0) s2.push("☠️ Meurtres **" + nb(tot.MEURTRES) + "**"); if (tot.CZ > 0) s2.push("🏆 Victoires en CZ **" + nb(tot.CZ) + "**");
        if (s1.length) add("ent", "> " + s1.join(" · "));
        if (s2.length) add("ent", "> " + s2.join(" · "));

        // un bloc par systeme
        systemes.forEach(function (sy) {
            var g = "s:" + sy.cle, np = (D.systemes || {})[sy.cle] || 0;
            add(g, "## 🛰️ " + dc(String(sy.nom || "").toUpperCase()), { vide: 1, titre: 1 });
            add(g, "-# " + (sy.dirs.length ? sy.dirs.length + " directive" + (sy.dirs.length > 1 ? "s" : "") : "") + (sy.dirs.length && sy.pp.length ? " + " : "") + (sy.pp.length ? sy.pp.length + " mission" + (sy.pp.length > 1 ? "s" : "") + " Powerplay" : "") + (np ? " · " + np + " pilote" + (np > 1 ? "s" : "") + " engagé" + (np > 1 ? "s" : "") : ""), { colle: 1 });
            sy.dirs.forEach(function (d) {
                var T = TYPES[d.type] || ["📌", String(d.type || "")], res = resultat(d.id);
                add(g, "### " + T[0] + " " + T[1] + " · " + dc(d.faction || ""), { vide: 1, titre: 1 });
                if (res && res.donnees && res.conflit) {
                    var f = String(d.faction || "").trim().toLowerCase(), e1 = String(res.conflit.f1 || "").trim().toLowerCase() === f, moi = e1 ? res.conflit.s1 : res.conflit.s2, adv = e1 ? res.conflit.s2 : res.conflit.s1;
                    add(g, "> ⚔️ Score **" + moi + " – " + adv + "** " + (moi > adv ? "· ✅ en tête" : moi < adv ? "· ⚠️ en retard" : "· ⚖️ égalité"));
                } else if (res && res.donnees && res.influence != null) {
                    var v = deltaDepuis(res, dep, d.emission), bon = v == null ? null : (d.type === "BAISSE" ? v < -0.05 : v > 0.05);
                    add(g, "> 📊 Influence **" + nb(Number(res.influence) * 100, 1) + " %**" + (v == null ? "" : " · " + pts(v) + (Math.abs(v) < 0.05 ? "" : bon ? " ✅" : " ⚠️")));
                }
                var A = ACT[d.type] || ACT.HAUSSE, ty = d.types || {}, any = false;
                ORDRE_ACT.forEach(function (k) {
                    var t = ty[k]; if (!t || !(Number(t.total) > 0)) return;
                    var a = A[k] || ACT.HAUSSE[k] || ["▫️", k, "nn"]; any = true;
                    add(g, "- " + a[0] + " " + a[1] + " : " + valeur(a[2], t));
                });
                if (!any) add(g, "- *Aucune action enregistrée sur la période*");
                add(g, "-# " + d.pilotes + " pilote" + (d.pilotes > 1 ? "s" : "") + " · directive #" + d.id + (d.campagne ? " · campagne « " + dc(d.campagne) + " »" : ""));
            });
            sy.pp.forEach(function (m) {
                add(g, "### 🛡️ POWERPLAY · " + dc(String(m.type || "").toUpperCase()), { vide: 1, titre: 1 });
                add(g, "- 🏅 Mérites : **" + nb(m.merites) + "**" + (m.merites > 0 ? "" : " *(aucun sur la période)*"));
                add(g, "-# " + m.pilotes + " pilote" + (m.pilotes > 1 ? "s" : "") + " · mission Powerplay #" + m.id + (m.campagne ? " · campagne « " + dc(m.campagne) + " »" : ""));
            });
        });
        add("pied", "-# Totaux anonymes · données du jeu (EDSM) et journaux des pilotes · SYS.EDTEAM", { vide: 1 });
        st.lignes = L; st.systemes = systemes;
    }

    // ------------------------------------------------------------------------------------------------------------
    // DECOUPAGE EN MESSAGES DISCORD
    // ------------------------------------------------------------------------------------------------------------
    function visibles() { return st.lignes.filter(function (l) { return !st.ret[l.id] && !(l.grp.indexOf("s:") === 0 && st.exclus[l.grp.slice(2)]); }); }
    function decouper() {
        var V = visibles(), msgs = [], cur = [], len = 0;
        function lg(l) { return (l.vide && cur.length ? 1 : 0) + l.txt.length + 1; }
        function pousser() { if (cur.length) { msgs.push(cur); } cur = []; len = 0; }
        // longueur d'un bloc de systeme (pour ne pas le couper s'il tient dans un message)
        var blocs = {}; V.forEach(function (l) { blocs[l.grp] = (blocs[l.grp] || 0) + l.txt.length + 2; });
        V.forEach(function (l) {
            if (l.titre && l.txt.indexOf("## ") === 0 && cur.length && len + blocs[l.grp] > MAX && blocs[l.grp] <= MAX) pousser();      // un systeme qui tient entier commence un nouveau message
            if (len + lg(l) > MAX && cur.length) {
                var reste = [];      // un titre (et sa ligne de sous-texte) ne reste jamais seul en bas d'un message
                while (cur.length > 1) { var u = cur[cur.length - 1], p = cur[cur.length - 2]; if (u.txt.indexOf("#") === 0) reste.unshift(cur.pop()); else if (u.colle && p.txt.indexOf("#") === 0) { reste.unshift(cur.pop()); reste.unshift(cur.pop()); } else break; }
                pousser(); cur = reste; len = reste.reduce(function (a, x) { return a + x.txt.length + 1; }, 0);
            }
            cur.push(l); len += lg(l);
        });
        pousser();
        st.msgs = msgs.map(function (m) { return m.map(function (l, i) { return (l.vide && i > 0 ? "\n" : "") + l.txt; }).join("\n"); });
        st.msgsLignes = msgs;
    }

    // ------------------------------------------------------------------------------------------------------------
    // APERCU (rendu proche de Discord)
    // ------------------------------------------------------------------------------------------------------------
    function dateFr(sec, f) {
        var d = new Date(Number(sec) * 1000);
        if (f === "R") { var m = Math.round((Date.now() - d.getTime()) / 60000); return m < 1 ? "à l’instant" : m < 60 ? "il y a " + m + " minutes" : m < 1440 ? "il y a " + Math.round(m / 60) + " heures" : "il y a " + Math.round(m / 1440) + " jours"; }
        return d.toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
    }
    function inline(t) {
        t = esc(t);
        t = t.replace(/\\([\\*_~`|>])/g, function (m, c) { return "\u0001" + c.charCodeAt(0) + "\u0002"; });
        t = t.replace(/&lt;t:(\d+):([A-Za-z])&gt;/g, function (m, s, f) { return "<span class=\"rp-t\">" + dateFr(s, f) + "</span>"; });
        t = t.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>");
        return t.replace(/\u0001(\d+)\u0002/g, function (m, c) { return String.fromCharCode(Number(c)); });
    }
    function ligneHtml(l) {
        var t = l.txt, cls = "p", s;
        if (t.indexOf("### ") === 0) { cls = "h3"; s = t.slice(4); } else if (t.indexOf("## ") === 0) { cls = "h2"; s = t.slice(3); } else if (t.indexOf("# ") === 0) { cls = "h1"; s = t.slice(2); }
        else if (t.indexOf("-# ") === 0) { cls = "sm"; s = t.slice(3); } else if (t.indexOf("> ") === 0) { cls = "q"; s = t.slice(2); } else if (t.indexOf("- ") === 0) { cls = "li"; s = t.slice(2); } else s = t;
        return "<div class=\"rp-l " + cls + (l.vide ? " sp" : "") + "\"><span>" + inline(s) + "</span><button type=\"button\" class=\"rp-x\" data-a=\"ret\" data-id=\"" + l.id + "\" title=\"Retirer cette ligne\">✕</button></div>";
    }

    var CSS = ""
        + "#edteam-rapport{position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.88);backdrop-filter:blur(4px);display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:22px 14px;font-family:'Share Tech Mono',Consolas,monospace;color:#dfe8ee}"
        + "#edteam-rapport *{box-sizing:border-box}"
        + ".rp-c{width:min(960px,100%);background:#06090d;border:1px solid rgba(88,101,242,.8);box-shadow:0 0 50px rgba(88,101,242,.25);position:relative}"
        + ".rp-hd{display:flex;align-items:center;gap:14px;padding:16px 22px;border-bottom:1px solid rgba(88,101,242,.4);background:linear-gradient(90deg,rgba(88,101,242,.18),transparent)}"
        + ".rp-hd h2{margin:0;font-size:1.05em;letter-spacing:4px;color:#fff;font-weight:normal}.rp-hd h2 small{display:block;font-size:.62em;letter-spacing:2px;color:#8d9aa3;margin-top:3px}"
        + ".rp-hd .rp-f{margin-left:auto;background:none;border:1px solid #56626c;color:#98a6af;font:inherit;padding:6px 14px;cursor:pointer;letter-spacing:2px}.rp-hd .rp-f:hover{color:#fff;border-color:#98a6af}"
        + ".rp-bar{padding:14px 22px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;border-bottom:1px solid rgba(255,255,255,.07)}"
        + ".rp-bar small{color:#7d8a92;letter-spacing:2px;font-size:.66em;margin-right:6px}"
        + ".rp-bar button,.rp-sy button{font:inherit;font-size:.74em;letter-spacing:2px;background:transparent;border:1px solid #3a4650;color:#98a6af;padding:6px 12px;cursor:pointer}.rp-bar button.on{background:#5865F2;border-color:#5865F2;color:#fff}.rp-bar button:hover{color:#fff;border-color:#98a6af}"
        + ".rp-sy{padding:10px 22px 14px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;border-bottom:1px solid rgba(255,255,255,.07)}.rp-sy small{color:#7d8a92;letter-spacing:2px;font-size:.66em;margin-right:6px}"
        + ".rp-sy button{font-size:.7em;padding:4px 10px}.rp-sy button.on{border-color:#2FE07A;color:#2FE07A;background:rgba(47,224,122,.08)}.rp-sy button.off{opacity:.55;text-decoration:line-through}"
        + ".rp-msgs{padding:18px 22px 8px;display:flex;flex-direction:column;gap:18px}"
        + ".rp-m{background:#313338;border-radius:8px;border:1px solid #1e1f22;overflow:hidden;font-family:'gg sans','Segoe UI',system-ui,sans-serif;font-size:15px;line-height:1.45}"
        + ".rp-mh{display:flex;align-items:center;gap:10px;padding:8px 12px;background:#2b2d31;border-bottom:1px solid #1e1f22;font-size:12px;color:#b5bac1;letter-spacing:1px}.rp-mh b{color:#fff;font-weight:600}.rp-mh .rp-n{margin-left:auto}.rp-mh .rp-n.ko{color:#f23f43}"
        + ".rp-mh button{background:#5865F2;border:0;color:#fff;font:inherit;font-weight:600;font-size:12px;padding:5px 14px;border-radius:4px;cursor:pointer}.rp-mh button:hover{background:#4752c4}.rp-mh button.ok{background:#23a559}"
        + ".rp-mb{padding:10px 14px 12px;color:#dbdee1}"
        + ".rp-l{position:relative;padding:1px 28px 1px 0;border-radius:3px}.rp-l.sp{margin-top:10px}.rp-l:hover{background:rgba(255,255,255,.04)}"
        + ".rp-l.h1{font-size:25px;font-weight:700;color:#fff}.rp-l.h2{font-size:20px;font-weight:700;color:#fff}.rp-l.h3{font-size:17px;font-weight:700;color:#fff}"
        + ".rp-l.sm{font-size:12.5px;color:#949ba4}.rp-l.q{border-left:4px solid #4e5058;padding-left:10px;margin-left:2px}.rp-l.li{padding-left:18px}.rp-l.li:before{content:'•';position:absolute;left:5px;color:#b5bac1}"
        + ".rp-l b{color:#fff;font-weight:700}.rp-t{background:rgba(255,255,255,.08);border-radius:3px;padding:0 3px}"
        + ".rp-x{position:absolute;right:2px;top:0;background:#1e1f22;border:0;color:#f23f43;font-size:12px;cursor:pointer;opacity:0;padding:2px 6px;border-radius:3px}.rp-l:hover .rp-x{opacity:1}"
        + ".rp-pied{padding:12px 22px 20px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;color:#7d8a92;font-size:.72em;letter-spacing:1px}.rp-pied button{font:inherit;font-size:1em;letter-spacing:2px;background:transparent;border:1px solid #3a4650;color:#98a6af;padding:7px 14px;cursor:pointer}.rp-pied button.fort{background:#5865F2;border-color:#5865F2;color:#fff}.rp-pied button:hover{filter:brightness(1.2)}"
        + ".rp-vide{padding:30px 22px;text-align:center;color:#8d9aa3;letter-spacing:2px}"
        + "@media (max-width:640px){.rp-hd{padding:12px 14px}.rp-bar,.rp-sy,.rp-msgs,.rp-pied{padding-left:12px;padding-right:12px}}";
    function css() { if (document.getElementById("edteam-rapport-css")) return; var s = document.createElement("style"); s.id = "edteam-rapport-css"; s.textContent = CSS; document.head.appendChild(s); }

    function racine() {
        var r = document.getElementById("edteam-rapport");
        if (!r) { r = document.createElement("div"); r.id = "edteam-rapport"; r.setAttribute("role", "dialog"); r.setAttribute("aria-modal", "true"); document.body.appendChild(r); r.addEventListener("click", clic); }
        return r;
    }
    function rendre() {
        var r = document.getElementById("edteam-rapport"); if (!r) return;
        var h = "<div class=\"rp-c\"><div class=\"rp-hd\"><h2>RAPPORT DE L’AMIRAUTÉ<small>mis en page pour Discord · totaux anonymes · retire les lignes que tu ne veux pas, puis copie</small></h2><button type=\"button\" class=\"rp-f\" data-a=\"fermer\">FERMER ✕</button></div>"
            + "<div class=\"rp-bar\"><small>PÉRIODE</small>" + PERIODES.map(function (p) { return "<button type=\"button\" data-a=\"per\" data-p=\"" + p[0] + "\" class=\"" + (st.periode === p[0] ? "on" : "") + "\">" + p[1] + "</button>"; }).join("") + "</div>";
        if (st.charge) h += "<div class=\"rp-vide\">CHARGEMENT DU RAPPORT…</div>";
        else if (st.erreur) h += "<div class=\"rp-vide\">" + esc(st.erreur) + "</div>";
        else {
            h += "<div class=\"rp-sy\"><small>SYSTÈMES</small>" + st.systemes.map(function (s) { var off = !!st.exclus[s.cle]; return "<button type=\"button\" data-a=\"sys\" data-s=\"" + esc(s.cle) + "\" class=\"" + (off ? "off" : "on") + "\" title=\"" + (off ? "Remettre ce système dans le rapport" : "Écarter ce système du rapport (mémorisé sur cet appareil)") + "\">" + esc(s.nom) + "</button>"; }).join("") + "</div>";
            decouper();
            if (!st.msgs.length) h += "<div class=\"rp-vide\">RAPPORT VIDE : tout a été retiré.</div>";
            else {
                h += "<div class=\"rp-msgs\">" + st.msgsLignes.map(function (ls, i) {
                    var n = st.msgs[i].length;
                    return "<div class=\"rp-m\"><div class=\"rp-mh\"><b>MESSAGE " + (i + 1) + " / " + st.msgs.length + "</b><span class=\"rp-n" + (n > 2000 ? " ko" : "") + "\">" + nb(n) + " / 2 000 caractères</span><button type=\"button\" data-a=\"copier\" data-i=\"" + i + "\">COPIER</button></div><div class=\"rp-mb\">" + ls.map(ligneHtml).join("") + "</div></div>";
                }).join("") + "</div>";
            }
            h += "<div class=\"rp-pied\"><span>" + st.msgs.length + " message" + (st.msgs.length > 1 ? "s" : "") + " · colle-les dans l’ordre sur Discord</span><span style=\"margin-left:auto\"></span>" + (Object.keys(st.ret).length ? "<button type=\"button\" data-a=\"rest\">RESTAURER LES LIGNES RETIRÉES (" + Object.keys(st.ret).length + ")</button>" : "") + "<button type=\"button\" class=\"fort\" data-a=\"tout\">TOUT COPIER</button></div>";
        }
        r.innerHTML = h + "</div>";
    }
    function copier(txt, btn) {
        var fin = function () { if (btn) { var o = btn.textContent; btn.textContent = "COPIÉ ✓"; btn.classList.add("ok"); setTimeout(function () { btn.textContent = o; btn.classList.remove("ok"); }, 1600); } };
        try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt).then(fin, function () { repli(txt); fin(); }); return; } } catch (e) { /* repli */ }
        repli(txt); fin();
    }
    function repli(txt) { var t = document.createElement("textarea"); t.value = txt; t.style.cssText = "position:fixed;left:-9999px;top:0"; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch (e) { /* rien */ } t.remove(); }

    function clic(ev) {
        var b = ev.target.closest ? ev.target.closest("[data-a]") : null;
        if (!b) { if (ev.target.id === "edteam-rapport") fermer(); return; }
        var a = b.getAttribute("data-a");
        if (typeof window.sonClic === "function" && a !== "ret") { try { window.sonClic(); } catch (e) { /* son indisponible */ } }
        if (a === "fermer") fermer();
        else if (a === "per") { charger(b.getAttribute("data-p")); }
        else if (a === "sys") { var k = b.getAttribute("data-s"); if (st.exclus[k]) delete st.exclus[k]; else st.exclus[k] = 1; ecrireExclus(); rendre(); }
        else if (a === "ret") { st.ret[b.getAttribute("data-id")] = 1; rendre(); }
        else if (a === "rest") { st.ret = {}; rendre(); }
        else if (a === "copier") copier(st.msgs[Number(b.getAttribute("data-i"))], b);
        else if (a === "tout") copier(st.msgs.join("\n\n⸻\n\n"), b);
    }
    function fermer() { var r = document.getElementById("edteam-rapport"); if (r) r.remove(); document.removeEventListener("keydown", touche, true); }
    function touche(ev) { if (ev.key === "Escape") { ev.stopPropagation(); fermer(); } }

    // ------------------------------------------------------------------------------------------------------------
    // CHARGEMENT
    // ------------------------------------------------------------------------------------------------------------
    async function charger(periode) {
        st.periode = periode || st.periode; st.charge = true; st.erreur = ""; st.ret = {}; rendre();
        try {
            var c = window.supabaseApp; if (!c) throw new Error("connexion indisponible");
            var d = depuisSec(st.periode), m = st.memo[st.periode + "|" + d];
            if (!m || Date.now() - m.ts > 120000) {
                var r = await c.rpc("rapport_amiral", { p_depuis: d == null ? null : new Date(d * 1000).toISOString() });
                if (r.error) throw new Error(/function|does not exist|rapport_amiral/i.test(r.error.message || "") ? "Le rapport n’est pas encore activé (script SQL 162 à lancer)." : "Erreur de lecture : " + (r.error.message || ""));
                if (!r.data) throw new Error("Rapport réservé à l’Amiral de l’escadron.");
                m = { ts: Date.now(), data: r.data }; st.memo[st.periode + "|" + d] = m;
            }
            st.data = m.data; construire();
        } catch (e) { st.erreur = e && e.message ? e.message : "Impossible de produire le rapport."; }
        st.charge = false; rendre();
    }
    window.EdteamRapport = {
        ouvrir: function () {
            css(); lireExclus(); st.ret = {}; racine(); document.addEventListener("keydown", touche, true);
            charger(st.periode);
        },
        // pour les tests : construit le rapport a partir de donnees fournies
        _test: function (data, periode, res) { st.data = data; st.periode = periode || "tick"; if (res) window.cacheResultatsBgs = res; construire(); decouper(); return { msgs: st.msgs, lignes: st.lignes }; }
    };
})();
