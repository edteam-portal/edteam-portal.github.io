// FENETRE D'UNE DIRECTIVE BGS (PC) : colonne de gauche = qui participe, sa part de l'effort, ses activites sur toute la duree de la directive et les ticks quotidiens ou il a joue.
// Meme principe que la fenetre d'une mission Powerplay : aucun objectif, aucun pourcentage d'avancement d'escadron ; on MONTRE la participation (voir quotas-jour.js, bgs-ticks.js).
// Donnees : bgs_bilan_directive (SQL 111 ; SQL 113 pour les cles `pilotes` et `actifs`) + classement en points de bgs_directives_resume (cacheResumeBgs). Sans le SQL 113, les totaux par type viennent du classement par type (15 pilotes au plus)
// et la rangee des ticks n'est pas affichee.
// Points d'un pilote = meme formule que le serveur (bgs_directives_resume) : economie, securite, science, contrebande = credits / 2 000 000 ; les autres activites = leur valeur.
(function () {
    "use strict";
    if (window.EdteamBgsParticipants) return;
    const E = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const fr = (n, d) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: d == null ? 1 : d }).format(Number(n) || 0);
    const JOUR = 86400000;
    const COUL = { MISSIONS: "#FF7100", ECONOMIE: "#00FF66", SECURITE: "#00F0FF", SCIENCE: "#B026FF", MEURTRES: "#ff4d4d", CONTREBANDE: "#ff9f43", VENTE_PERTE: "#ff9f43", ECHECS: "#8a949c", CZ_VICTOIRES: "#FFD700" };
    const ICO = { MISSIONS: "📝", ECONOMIE: "💰", SECURITE: "💥", SCIENCE: "🔬", MEURTRES: "☠️", CONTREBANDE: "📦", VENTE_PERTE: "📉", ECHECS: "❌", CZ_VICTOIRES: "🏆" };
    const ENCREDITS = { ECONOMIE: 1, SECURITE: 1, SCIENCE: 1, CONTREBANDE: 1, VENTE_PERTE: 1 };
    const pts = (ty, v) => { v = Math.abs(Number(v) || 0); return ENCREDITS[ty] ? v / 2000000 : v; };
    const jj = ms => { const d = new Date(ms); return String(d.getUTCDate()).padStart(2, "0") + "/" + String(d.getUTCMonth() + 1).padStart(2, "0"); };
    const tip = (t, col) => " data-pptip=\"" + E(t) + "\" data-tc=\"" + (col || "#FF7100") + "\"";

    function css() {
        if (document.getElementById("bp-css")) return; const s = document.createElement("style"); s.id = "bp-css";
        s.textContent = [
            ".bp-tuiles { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:6px; }",
            ".bp-t { flex:1; min-width:120px; padding:10px 12px; background:linear-gradient(90deg, color-mix(in srgb, var(--k) 15%, #0a0c10), #0a0c10 72%); border-left:4px solid var(--k); box-shadow:inset 0 0 0 1px rgba(255,255,255,.05); }",
            ".bp-t .t { color:#9ab; font-size:.68em; letter-spacing:2px; } .bp-t .v { color:var(--k); font-size:1.8em; font-weight:bold; line-height:1.15; margin:3px 0; } .bp-t .s { color:#8a949c; font-size:.74em; line-height:1.4; }",
            ".bp-cumul { display:flex; height:24px; border:1px solid #333; background:#111; margin:4px 0 10px; } .bp-cumul > span { min-width:2px; border-right:1px solid #0a0a0a; cursor:help; }",
            ".bp-leg { display:flex; flex-direction:column; gap:5px; font-size:.88em; } .bp-leg > div { display:grid; grid-template-columns:14px minmax(0,1fr) auto auto 52px; gap:10px; align-items:center; color:#ccc; }",
            ".bp-leg i { display:block; width:11px; height:11px; } .bp-leg b { color:#fff; text-align:right; } .bp-leg .m { color:#8a949c; font-size:.82em; text-align:right; } .bp-leg .p { color:#888; text-align:right; }",
            ".bp-liste { border:1px solid rgba(255,122,0,.33); margin-top:6px; }",
            ".bp-row { display:flex; align-items:center; gap:14px; padding:10px 14px; min-height:74px; border-bottom:1px solid rgba(255,255,255,.06); } .bp-row:last-child { border-bottom:0; }",
            ".bp-row .qj-p { margin:0; } .bp-mid { display:block; flex:1; min-width:0; }",
            ".bp-l1 { display:flex; justify-content:space-between; align-items:baseline; gap:10px; }",
            ".bp-nom { color:#fff; font-weight:bold; letter-spacing:1px; font-size:1.02em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; } .bp-row.moi .bp-nom { color:#FFB000; }",
            ".bp-num { flex:none; color:#8a949c; font-size:.8em; white-space:nowrap; } .bp-num b { color:#FF7100; font-size:1.35em; }",
            ".bp-bar { display:flex; height:6px; margin-top:7px; background:#111; border:1px solid #262626; } .bp-bar > span { min-width:2px; opacity:.88; cursor:help; }",
            ".bp-dots { display:flex; align-items:center; gap:3px; margin-top:7px; flex-wrap:wrap; } .bp-dots .l { color:#667; font-size:.62em; letter-spacing:2px; margin-right:6px; }",
            ".bp-dots i { display:block; width:11px; height:11px; border:1px solid #3a3a3a; background:transparent; cursor:help; } .bp-dots i.on { background:#2fe07a; border-color:#2fe07a; box-shadow:0 0 6px #2fe07a66; } .bp-dots i.cur { outline:1px solid #ffffff88; outline-offset:1px; }",
            ".bp-aide { display:flex; flex-wrap:wrap; gap:6px 16px; color:#778; font-size:.7em; margin:2px 0 8px; } .bp-aide i { display:inline-block; width:10px; height:10px; vertical-align:-1px; margin-right:5px; border:1px solid #3a3a3a; } .bp-aide i.on { background:#2fe07a; border-color:#2fe07a; }"
        ].join("\n");
        document.head.appendChild(s);
    }

    // totaux par pilote et par type : { uid: { TYPE: valeur brute } } ; la cle `pilotes` (SQL 113) donne tous les pilotes, sinon le classement par type (15 au plus)
    function totauxPilotes(data) {
        const m = {};
        if (data && Array.isArray(data.pilotes)) data.pilotes.forEach(r => { m[r[0]] = r[2] || {}; });
        else if (data && data.types) Object.keys(data.types).forEach(ty => ((data.types[ty] || {}).rang || []).forEach(r => { (m[r[0]] = m[r[0]] || {})[ty] = r[2]; }));
        return m;
    }

    // o = { ordre, data (bilan ou null), classement [{u, nom, pts}], per (periodes), presence { uid: Set(j) }, labels [texte par periode], moiId, zones: { tuiles, activite, part }, Q (EdteamQuotas) }
    function monter(o) {
        css(); const Q = o.Q || window.EdteamQuotas || {}, data = o.data, ordre = o.ordre, moi = String(o.moiId || "");
        const typeOrdre = String(ordre.type_ordre || "").toUpperCase(), liste = (Q.TYPES_BILAN && Q.TYPES_BILAN[typeOrdre]) || Object.keys(COUL);
        const types = liste.concat(Object.keys((data && data.types) || {}).filter(t => liste.indexOf(t) < 0));
        const brut = totauxPilotes(data);
        const jours = Math.max(1, Math.ceil((Date.now() - new Date(ordre.date_emission || ordre.created_at).getTime()) / JOUR));
        // pilotes : le classement en points fait foi (meme chiffre que partout) ; les autres participants du bilan completent
        const noms = {}, ptsPilote = {};
        (o.classement || []).forEach(p => { noms[p.u] = p.nom; ptsPilote[p.u] = Number(p.pts) || 0; });
        ((data && data.participants) || []).forEach(p => { if (noms[p[0]] == null) noms[p[0]] = p[1]; });
        Object.keys(brut).forEach(u => { if (ptsPilote[u] == null) ptsPilote[u] = Object.keys(brut[u]).reduce((a, ty) => a + pts(ty, brut[u][ty]), 0); });
        const ids = Object.keys(ptsPilote).sort((a, b) => ptsPilote[b] - ptsPilote[a] || String(noms[a] || "").localeCompare(String(noms[b] || "")));
        const total = ids.reduce((a, u) => a + ptsPilote[u], 0), part = u => total > 0 ? 100 * ptsPilote[u] / total : 0;
        const fPart = p => p > 0 && p < 1 ? "< 1 %" : (p >= 10 ? Math.round(p) : fr(p, 1)) + " %";
        const etatJour = {}; ((data && data.participants) || []).forEach(p => { etatJour[p[0]] = Number(p[2]) >= 1; });
        const na = ids.filter(u => etatJour[u]).length, maPart = part(moi);

        // 1. tuiles
        if (o.zones.tuiles) o.zones.tuiles.innerHTML = "<div class=\"bp-tuiles\">"
            + "<div class=\"bp-t\" style=\"--k:#FF7100;\"><div class=\"t\">PARTICIPANTS</div><div class=\"v\">" + ids.length + "</div><div class=\"s\">pilote" + (ids.length > 1 ? "s" : "") + " depuis l’émission, il y a " + jours + " j</div></div>"
            + "<div class=\"bp-t\" style=\"--k:#2fe07a;\"><div class=\"t\">AUJOURD’HUI</div><div class=\"v\">" + na + " / " + ids.length + "</div><div class=\"s\">ont joué depuis le dernier tick</div></div>"
            + "<div class=\"bp-t\" style=\"--k:#FFB000;\"><div class=\"t\">TA PART</div><div class=\"v\">" + (ptsPilote[moi] ? fPart(maPart) : "0 %") + "</div><div class=\"s\">de l’effort de l’escadron · " + fr(ptsPilote[moi] || 0, 1) + " pts</div></div></div>";

        // 2. par activite : une barre cumulee (100 % = l'effort de l'escadron, en points) + legende avec les totaux dans leur unite
        const totType = {}; types.forEach(ty => { totType[ty] = ids.reduce((a, u) => a + pts(ty, (brut[u] || {})[ty]), 0); });
        const sommeT = types.reduce((a, ty) => a + totType[ty], 0), actifs = types.filter(ty => totType[ty] > 0);
        const brutTot = ty => data && data.types && data.types[ty] ? Number(data.types[ty].total) || 0 : 0, brutMoi = ty => data && data.types && data.types[ty] ? Number(data.types[ty].moi) || 0 : 0;
        if (o.zones.activite) o.zones.activite.innerHTML = sommeT > 0 ? "<div class=\"bp-cumul\">" + actifs.map(ty => "<span" + tip((Q.NOMS && Q.NOMS[ty] || ty) + "\n" + (Q.fmtBilan ? Q.fmtBilan(ty, typeOrdre, brutTot(ty)) : fr(brutTot(ty))) + " (" + fPart(100 * totType[ty] / sommeT) + " de l’effort de l’escadron)", COUL[ty]) + " style=\"flex:" + totType[ty] + " 1 0; background:" + (COUL[ty] || "#8a949c") + ";\"></span>").join("") + "</div>"
            + "<div class=\"bp-leg\">" + actifs.map(ty => "<div><i style=\"background:" + (COUL[ty] || "#8a949c") + ";\"></i><span>" + (ICO[ty] || "•") + " " + E(Q.NOMS && Q.NOMS[ty] || ty) + "</span><b>" + (Q.fmtBilan ? Q.fmtBilan(ty, typeOrdre, brutTot(ty)) : fr(brutTot(ty))) + "</b><span class=\"m\">toi : " + (Q.fmtBilan ? Q.fmtBilan(ty, typeOrdre, brutMoi(ty)) : fr(brutMoi(ty))) + "</span><span class=\"p\">" + fPart(100 * totType[ty] / sommeT) + "</span></div>").join("") + "</div>"
            + "<div style=\"color:#777; font-size:.72em; line-height:1.5; margin-top:8px;\">La barre répartit l’effort de l’escadron entre les activités, depuis l’émission de la directive (en points : 2 M CR = 1 pt).</div>"
            : "<div style=\"color:#777; font-size:.85em; font-style:italic; padding:6px 2px;\">Aucun effort enregistré pour l’instant.</div>";

        // 3. participants : avatar, nom, points et part, barre cumulee par activite, ticks quotidiens joues
        const per = o.per || [], a0 = Math.max(0, per.length - 20), vues = per.slice(a0), pres = o.presence || null;
        const aide = pres ? "<div class=\"bp-aide\"><span><i class=\"on\"></i>a joué pendant ce tick</span><span><i></i>n’a pas joué</span><span>de gauche à droite : du plus ancien au tick en cours (" + (vues.length ? jj(vues[0].a) : "") + (a0 > 0 ? ", les " + vues.length + " derniers" : "") + ")</span></div>" : "";
        const ligne = u => {
            const mien = String(u) === moi, nom = "CMDR " + E(String(noms[u] || "INCONNU").toUpperCase()) + (mien ? " (VOUS)" : "");
            const bt = brut[u] || {}, pt = types.map(ty => [ty, pts(ty, bt[ty])]).filter(x => x[1] > 0), sp = pt.reduce((a, x) => a + x[1], 0);
            const barre = sp > 0 ? "<span class=\"bp-bar\">" + pt.map(x => "<span" + tip((Q.NOMS && Q.NOMS[x[0]] || x[0]) + "\n" + (Q.fmtBilan ? Q.fmtBilan(x[0], typeOrdre, bt[x[0]]) : fr(bt[x[0]])) + " (" + fPart(100 * x[1] / sp) + " de son effort)", COUL[x[0]]) + " style=\"flex:" + x[1] + " 1 0; background:" + (COUL[x[0]] || "#8a949c") + ";\"></span>").join("") + "</span>" : "";
            const set = pres && pres[u];
            const dots = pres ? "<div class=\"bp-dots\"><span class=\"l\">TICKS</span>" + vues.map((p, k) => { const j = a0 + k, on = !!(set && set.has(j)); return "<i class=\"" + (on ? "on" : "") + (p.enCours ? " cur" : "") + "\"" + tip((o.labels && o.labels[j] || "") + "\n" + (on ? "a joué pendant cette période" : "n’a pas joué pendant cette période") + (p.enCours ? " (période en cours)" : ""), on ? "#2fe07a" : "#8a949c") + "></i>"; }).join("") + "</div>" : "";
            const av = Q.av ? Q.av(u, noms[u], 44) : "";
            return "<div class=\"bp-row" + (mien ? " moi" : "") + "\"><span class=\"qj-p" + (etatJour[u] ? " on" : "") + "\">" + av + "</span><span class=\"bp-mid\"><div class=\"bp-l1\"><span class=\"bp-nom\">" + nom + "</span><span class=\"bp-num\"><b>" + fr(ptsPilote[u], 1) + "</b> PTS · " + fPart(part(u)) + "</span></div>" + barre + dots + "</span></div>";
        };
        if (o.zones.part) o.zones.part.innerHTML = ids.length ? aide + "<div class=\"bp-liste\">" + ids.map(ligne).join("") + "</div>" : "<div style=\"color:#666; text-align:center; font-size:.9em; padding:16px; font-style:italic;\">Aucun participant pour le moment.</div>";
    }
    window.EdteamBgsParticipants = { monter, pts, css };
})();
