// REPERES D'EFFICACITE ET MESURES D'UNE DIRECTIVE (PC : bgs.html ; mobile : mobile.html).
// Modele : voir supabase_sql/110 (quotas par type et par classe de population) et 111 (participation, bilan).
//   - Le jeu applique des rendements decroissants PAR TICK : au-dela d'un certain volume, une activite fait de moins en moins bouger l'influence. Le « quota » est ce volume (source : guide communautaire SINC 2024, non officiel).
//     Dans la fenetre d'une directive, il sert de REPERE D'EFFICACITE : la barre montre la MARGE restante avant que l'effet diminue (pleine = tout l'effort est efficace). Aucune obligation.
//   - DECISION DU 22/10 : AUCUN pourcentage d'avancement de l'escadron (rien ne fonde un « 100 % » d'escadron) ET AUCUN statut personnel « a faire » / « quota non atteint » montre a un pilote
//     (pas de bande de quotas, pas de cases par ligne, pas d'anneau de quota sur les avatars). Mesures neutres : participants, bilan depuis l'emission, pilotes par tick.
//   - GUERRE et ELECTION : aucun quota (pas de rendement decroissant), compteurs du jour.
// Les ticks viennent de tick.js (navigateur) et sont passes au serveur (bgs_quotas_jour : UN appel pour toutes les directives, memoire 2 minutes).
// Sans le SQL 111 (champ agi) ou en cas d'erreur, charger() rend null et les pages gardent leur affichage precedent, EN ENTIER.
(function () {
    "use strict";
    if (window.EdteamQuotas) return;
    const TYPES = { HAUSSE: ["MISSIONS", "ECONOMIE", "SECURITE", "SCIENCE"], BAISSE: ["MEURTRES", "CONTREBANDE", "ECHECS"] };
    const META = {
        MISSIONS: { e: "📝", court: "missions", unite: "INF", titre: "📝 LOGISTIQUE (Missions)", c: "var(--ed-orange)", ch: "#FF7100" },
        ECONOMIE: { e: "💰", court: "économie", unite: "CR", titre: "💰 ÉCONOMIE (Bénéfices du commerce & minage)", c: "#00FF66", ch: "#00FF66" },
        SECURITE: { e: "💥", court: "sécurité", unite: "CR", titre: "💥 SÉCURITÉ (Primes & Conflits)", c: "var(--ed-blue)", ch: "#00F0FF" },
        SCIENCE: { e: "🔬", court: "science", unite: "CR", titre: "🔬 SCIENCE (Cartographie)", c: "#B026FF", ch: "#B026FF" },
        MEURTRES: { e: "☠️", court: "meurtres", unite: "", titre: "☠️ MEURTRES (Vaisseaux & Sol)", c: "var(--ed-red)", ch: "#FF3333" },
        CONTREBANDE: { e: "📦", court: "contrebande", unite: "CR", titre: "📦 CONTREBANDE (Marché Noir)", c: "var(--ed-red)", ch: "#FF3333" },
        ECHECS: { e: "❌", court: "échecs", unite: "", titre: "❌ MISSIONS ÉCHOUÉES", c: "var(--ed-red)", ch: "#FF3333" }
    };
    const E = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const fr = n => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(n);
    const cr = n => new Intl.NumberFormat("fr-FR", { notation: "compact", compactDisplay: "short", maximumFractionDigits: 1 }).format(n) + " CR";
    const val = (ty, n) => META[ty] && META[ty].unite === "CR" ? cr(n) : fr(n) + (META[ty] && META[ty].unite ? " " + META[ty].unite : "");

    // ---- ticks envoyes au serveur (instants en secondes, 60 au plus) ----
    function chargerScript(src) { return new Promise((ok, ko) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = ko; document.head.appendChild(s); }); }
    async function assurerTicks() {
        try { if (!window.EdteamTick) await chargerScript("tick.js?v=6"); await window.EdteamTick.assurer(); } catch (e) { /* ticks du cache */ }
        return !!window.EdteamTick;
    }
    function ticksEnvoi() {
        if (!window.EdteamTick) return [];
        const now = Date.now();
        return window.EdteamTick.liste(now - 32 * 86400000, now).map(k => Math.floor(k.t / 1000)).slice(-59);
    }

    // ---- lecture (une fois pour toutes les directives, memoire 2 minutes) ----
    let memo = null;
    async function charger(force) {
        if (!force && memo && Date.now() - memo.ts < 120000) return memo.data;
        const c = window.supabaseApp; if (!c) return null;
        let map = null;
        try {
            await assurerTicks();
            const r = await c.rpc("bgs_quotas_jour", { p_ticks: ticksEnvoi() });
            if (r && !r.error && Array.isArray(r.data) && (r.data.length === 0 || r.data[0].agi !== undefined)) { map = {}; r.data.forEach(x => { map[x.ordre_id] = x; }); }      // sans le SQL 111 (champ agi) : affichage d'avant, en entier
        } catch (e) { map = null; }
        memo = { ts: Date.now(), data: map }; window.cacheQuotasBgs = map;
        return map;
    }

    // ---- reperes d'efficacite d'un pilote : sa marge avant que l'effet diminue, par type ----
    const types = typeOrdre => TYPES[String(typeOrdre || "").toUpperCase()] || null;
    function lignes(typeOrdre, entree) {
        const t = types(typeOrdre); if (!t || !entree) return null;
        return t.map(ty => {
            const q = Number(entree.quotas && entree.quotas[ty]) || 0, s = Number(entree.moi && entree.moi[ty] && entree.moi[ty].s) || 0;
            return { ty, q, s, reste: Math.max(0, q - s), prog: q > 0 ? Math.min(100, 100 * s / q) : 0, marge: q > 0 ? Math.max(0, 100 * (1 - s / q)) : 0, reduit: q > 0 && s >= q, surplus: q > 0 ? Math.max(0, s - q) : 0 };
        });
    }
    // ventes a perte d'un pilote depuis le dernier tick (directive de BAISSE) : { perte en CR, nombre de ventes } ; pas de quota
    const perte = entree => { const x = (entree && entree.moi && entree.moi.VENTE_PERTE) || {}; return { s: Number(x.s) || 0, n: Math.round(Number(x.n) || 0) }; };
    const compteur = (typeOrdre, entree) => {
        const m = (entree && entree.moi) || {}, T = String(typeOrdre || "").toUpperCase();
        if (T === "GUERRE") return { n: Math.round(Number(m.CZ_VICTOIRES && m.CZ_VICTOIRES.n) || 0), mot: "victoire", suff: "s" };
        if (T === "ELECTION") return { n: Math.round(Number(m.MISSIONS && m.MISSIONS.n) || 0), mot: "mission", suff: "s" };
        return null;
    };
    // texte de la jauge d'un type : plein effet (marge restante) ou effet reduit (le surplus compte pour le rang)
    function texteMarge(ty, l) {
        const sep = " <span style=\"color:#666;margin:0 6px;\">|</span> ";
        const mien = "<strong style=\"color:#fff;\">" + val(ty, l.s) + "</strong><span style=\"color:#aaa;\"> / " + val(ty, l.q) + "</span>";
        if (l.reduit) return mien + sep + "<span style=\"color:#2fe07a;font-weight:bold;\">✓ plein effet atteint</span>" + (l.surplus > 0 ? "<span style=\"color:#aaa;\"> · +" + val(ty, l.surplus) + " compte pour ton rang</span>" : "");
        return mien + sep + "<span style=\"color:#aaa;\">encore ~" + val(ty, l.reste) + " à plein effet</span>";
    }

    // ---------------- ICONES D'ACTIVITES D'UNE LIGNE ----------------
    // une icone par activite de la directive (hausse : missions, economie, securite, science ; baisse : meurtres, contrebande, echecs) ; elle se remplit avec la progression du jour, un ✓ quand le volume efficace du tick est atteint
    function pips(ordre, entree) {
        const L = lignes(ordre.type_ordre, entree); if (!L) return ""; css2();
        return "<span class=\"qj-pips\">" + L.map(l => {
            const M = META[l.ty], ok = l.q > 0 && l.s >= l.q, pc = l.q > 0 ? Math.min(100, Math.round(100 * l.s / l.q)) : 0;
            const tip = M.titre + "\nTon action depuis le dernier tick : " + val(l.ty, l.s) + " sur " + val(l.ty, l.q) + " d'effet plein.\n" + (ok ? "✓ Plein effet atteint : le surplus compte pour ton rang." : "Encore ~" + val(l.ty, l.reste) + " avant que l'effet diminue.");
            return "<span class=\"qj-pip" + (ok ? " ok" : pc > 0 ? " p" : "") + "\" style=\"--c:" + M.ch + "\" data-tip=\"" + E(tip) + "\" data-tc=\"" + M.ch + "\"><s style=\"width:" + pc + "%\"></s><span>" + (ok ? "✓" : M.e) + "</span></span>";
        }).join("") + "</span>";
    }

    // ---------------- MESURES NEUTRES (SQL 111) ----------------
    const CSS2 = `
.qj-pips{display:inline-flex;gap:5px;align-items:center;justify-content:flex-end}
.qj-pip{cursor:help;position:relative;width:34px;height:24px;border:1px solid #3a3a3a;background:#111;font-size:.82em;display:grid;place-items:center;overflow:hidden;opacity:.6}
.qj-pip s{position:absolute;left:0;top:0;bottom:0;background:var(--c);opacity:.7;text-decoration:none}.qj-pip span{position:relative}
.qj-pip.p{border-color:var(--c);opacity:1}.qj-pip.ok{border-color:#2fe07a;opacity:1}.qj-pip.ok s{background:#1c8a4a;opacity:1}.qj-pip.ok span{color:#fff;font-weight:bold}
.qj-p{position:relative;display:inline-flex;margin:0 8px 6px 0;line-height:0}
.qj-p.on::after{content:'';position:absolute;right:-2px;bottom:-2px;width:11px;height:11px;border-radius:50%;background:#2fe07a;border:2px solid #0a0603}
.qj-p.moi::before{content:'TOI';position:absolute;top:-8px;left:50%;transform:translateX(-50%);font-size:9px;line-height:1.2;background:#FF7100;color:#000;padding:0 4px;letter-spacing:1px;font-family:'Share Tech Mono',monospace;z-index:2}
.qj-ini{display:inline-grid;place-items:center;border-radius:50%;background:#2a3038;color:#fff;font-size:11px;font-family:'Share Tech Mono',monospace}
.qj-hero{display:flex;flex-wrap:wrap;margin-top:12px}
.qj-leg{display:flex;gap:14px;color:#8a8a8a;font-size:.66em;margin-top:6px;flex-wrap:wrap}.qj-leg i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;vertical-align:middle;background:#2fe07a}
.qj-bil{font-size:.82em}
.qj-row{display:grid;grid-template-columns:minmax(150px,1.9fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1.1fr) 78px 44px;gap:8px;align-items:center;padding:8px 6px;border-bottom:1px solid rgba(255,255,255,.07);cursor:pointer}
.qj-row.h{cursor:default;color:#666;font-size:.66em;letter-spacing:2px;padding:3px 6px}.qj-row.h span{text-align:right;color:#666!important}.qj-row.h span:first-child{text-align:left}
.qj-row>span{text-align:right;min-width:0}.qj-row>span:first-child{text-align:left;color:#fff}
.qj-row b{color:#fff;font-weight:normal;font-size:1.08em}.qj-row .m b{color:#FF7100}.qj-row small{display:block;color:#777;font-size:.72em}
.qj-row:not(.h):hover{background:rgba(255,255,255,.04)}
.qj-pt{display:inline-block;width:46px;height:6px;background:#222;vertical-align:middle;margin-right:5px}.qj-pt i{display:block;height:100%;background:#FF7100}
.qj-mini{display:inline-flex;align-items:flex-end;gap:2px;height:22px}.qj-mini i{display:block;width:7px;background:#FF7100;opacity:.8}.qj-mini i.a{background:#FFB000;opacity:1}.qj-mini i.e{opacity:.3;height:2px!important}
.qj-rang{padding:6px 8px 10px 30px;display:none;gap:6px;border-bottom:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02)}.qj-rang.ouv{display:grid}
.qj-r{display:grid;grid-template-columns:30px minmax(0,150px) 1fr 110px;gap:10px;align-items:center;font-size:.92em}
.qj-r .bar{height:9px;background:#1c1c1c}.qj-r .bar i{display:block;height:100%;background:#FF7100;opacity:.85}.qj-r.moi{color:#FFB000}.qj-r.moi .bar i{background:#FFB000;opacity:1}
.qj-r b{color:#fff;font-weight:normal}.qj-r .v{text-align:right;color:#cfd8dc}.qj-r .n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@media (max-width:760px){
 .qj-row.h{display:none}
 .qj-row{grid-template-columns:1fr 1fr;gap:4px 10px;padding:10px 6px}.qj-row>span:first-child{grid-column:1/-1}.qj-row>span{text-align:left}
 .qj-row .e::before{content:'ESCADRON ';color:#666;font-size:.7em;letter-spacing:1px}.qj-row .m::before{content:'TOI ';color:#666;font-size:.7em;letter-spacing:1px}.qj-row .p::before{content:'TA PART ';color:#666;font-size:.7em;letter-spacing:1px}
 .qj-r{grid-template-columns:30px 1fr 90px}.qj-r .bar{grid-column:2/-1}
}`;
    function css2() { if (document.getElementById("qj-css2")) return; const st = document.createElement("style"); st.id = "qj-css2"; st.textContent = CSS2; document.head.appendChild(st); }

    // ---- avatars des participants : un point vert = a joue pendant le tick en cours (aucun statut de quota) ----
    const initiales = nom => { const m = String(nom || "?").trim().split(/\s+/); return ((m[0] || "?")[0] + ((m[1] || "")[0] || "")).toUpperCase(); };
    function av(u, nom, t) {
        const P = window.EDTEAMPhotos;
        if (P && P.avatar) { try { return P.avatar({ uid: u, nom: nom, role: "pilote", taille: t }); } catch (e) { /* initiales */ } }
        return "<span class=\"qj-ini\" style=\"width:" + t + "px;height:" + t + "px;\">" + E(initiales(nom)) + "</span>";
    }
    // retourne { n, na, html } : n participants, na ont joue pendant le tick en cours
    function participants(bilan, moiId, taille) {
        css2(); const P = (bilan && bilan.participants) || [], t = taille || 34;
        const na = P.filter(p => Number(p[2]) >= 1).length;
        const html = P.map(p => "<span class=\"qj-p" + (Number(p[2]) >= 1 ? " on" : "") + (String(p[0]) === String(moiId) ? " moi" : "") + "\" title=\"" + E("CMDR " + String(p[1] || "?").toUpperCase() + (Number(p[2]) >= 1 ? " · a joué aujourd’hui" : "")) + "\">" + av(p[0], p[1], t) + "</span>").join("");
        return { n: P.length, na, html: "<div class=\"qj-hero\">" + html + "</div><div class=\"qj-leg\"><span><i></i>a joué aujourd’hui</span></div>" };
    }

    // ---- bilan depuis l'emission de la directive (tableau + classement des pilotes par type) ----
    const TYPES_BILAN = { HAUSSE: ["MISSIONS", "ECONOMIE", "SECURITE", "SCIENCE"], BAISSE: ["MEURTRES", "CONTREBANDE", "VENTE_PERTE", "ECHECS"], GUERRE: ["CZ_VICTOIRES", "SECURITE", "MISSIONS"], ELECTION: ["MISSIONS", "ECONOMIE", "SCIENCE"] };
    const META2 = Object.assign({}, META, { CZ_VICTOIRES: { e: "🏆", court: "victoires en CZ", unite: "pts", c: "#FFD700" }, VENTE_PERTE: { e: "📉", court: "ventes à perte", unite: "CR", c: "#ff9f43" } });
    const NOMS = { MISSIONS: "Logistique (missions)", ECONOMIE: "Économie (bénéfices du commerce et du minage)", SECURITE: "Sécurité (primes et conflits)", SCIENCE: "Science (cartographie)", MEURTRES: "Meurtres", CONTREBANDE: "Contrebande (marché noir)", ECHECS: "Missions échouées", CZ_VICTOIRES: "Victoires en CZ", VENTE_PERTE: "Ventes à perte (perte en CR)" };
    function fmtBilan(ty, typeOrdre, x) {
        x = Number(x) || 0;
        if (ty === "ECONOMIE" || ty === "SECURITE" || ty === "SCIENCE" || ty === "CONTREBANDE" || ty === "VENTE_PERTE") return cr(x);
        if (ty === "MISSIONS") return fr(x) + (String(typeOrdre).toUpperCase() === "GUERRE" ? " contrats" : " INF");
        if (ty === "CZ_VICTOIRES") return fr(x) + " pts";
        return fr(x);
    }
    // « mon rythme » : mes efforts de ce type sur les 5 derniers ticks (le dernier = tick en cours), echelle propre a la ligne
    function rythme(bilan, ty) {
        const cur = Number(bilan.cur) || 0, v = [0, 0, 0, 0, 0];
        (bilan.moi_periodes || []).forEach(r => { if (r[1] === ty) { const k = Number(r[0]) - (cur - 4); if (k >= 0 && k <= 4) v[k] += Number(r[2]) || 0; } });
        const mx = Math.max.apply(null, v);
        return "<span class=\"qj-mini\">" + v.map((x, i) => "<i class=\"" + (i === 4 ? "a" : "") + (x > 0 ? "" : " e") + "\" style=\"height:" + (x > 0 ? Math.max(3, Math.round(22 * x / mx)) : 2) + "px\"></i>").join("") + "</span>";
    }
    function bilan(ordre, b, moiId) {
        const T = TYPES_BILAN[String(ordre.type_ordre || "").toUpperCase()]; if (!T || !b) return ""; css2();
        const O = ordre.type_ordre, types = b.types || {};
        const entete = "<div class=\"qj-row h\"><span>ACTIVITÉ</span><span>ESCADRON</span><span>TOI</span><span>TA PART</span><span>MON RYTHME</span><span>PILOTES</span></div>";
        const rows = T.map(ty => {
            const d = types[ty] || { total: 0, moi: 0, pilotes: 0, rang: [] }, tot = Number(d.total) || 0, moi = Number(d.moi) || 0, part = tot > 0 ? 100 * moi / tot : null, M = META2[ty] || { e: "•" };
            const sous = ty === "CZ_VICTOIRES" ? "<small>" + Math.round(Number(d.n) || 0) + " victoire" + ((Number(d.n) || 0) > 1 ? "s" : "") + "</small>" : "";
            const rang = (d.rang || []), top = rang.length ? Number(rang[0][2]) || 1 : 1;
            const lignes = rang.map(r => { const mien = String(r[0]) === String(moiId), s = Number(r[2]) || 0;
                return "<div class=\"qj-r" + (mien ? " moi" : "") + "\"><span>" + av(r[0], r[1], 26) + "</span><span class=\"n\">" + (mien ? "TOI" : "CMDR " + E(String(r[1] || "?").toUpperCase())) + "</span><span class=\"bar\"><i style=\"width:" + Math.round(100 * s / top) + "%\"></i></span><span class=\"v\"><b>" + fmtBilan(ty, O, s) + "</b>" + (tot > 0 ? " · " + Math.round(100 * s / tot) + " %" : "") + "</span></div>"; }).join("");
            return "<div class=\"qj-row\" onclick=\"EdteamQuotas.bascule(this)\" title=\"Cliquer pour voir le classement des pilotes\"><span>" + M.e + " " + E(NOMS[ty] || ty) + "</span><span class=\"e\"><b>" + fmtBilan(ty, O, tot) + "</b>" + sous + "</span><span class=\"m\"><b>" + fmtBilan(ty, O, moi) + "</b></span>"
                + "<span class=\"p\">" + (part == null ? "—" : "<span class=\"qj-pt\"><i style=\"width:" + Math.round(part) + "%\"></i></span>" + Math.round(part) + " %") + "</span><span>" + rythme(b, ty) + "</span><span>" + (Number(d.pilotes) || 0) + (rang.length ? " ▸" : "") + "</span></div>"
                + "<div class=\"qj-rang\">" + (lignes || "<div style=\"color:#666;\">Aucun effort enregistré pour l’instant.</div>") + "</div>";
        }).join("");
        return "<div class=\"qj-bil\">" + entete + rows + "</div><div style=\"color:#777;font-size:.7em;line-height:1.5;margin-top:8px;\">Totaux depuis l’émission de la directive. Clique sur une ligne pour voir le classement des pilotes.</div>";
    }
    function bascule(ligne) { const n = ligne.nextElementSibling; if (n && n.classList.contains("qj-rang")) { if (typeof sonClic === "function") sonClic(); n.classList.toggle("ouv"); } }

    window.EdteamQuotas = { charger, types, META, lignes, compteur, perte, texteMarge, pips, val, ticksEnvoi, assurerTicks, participants, bilan, bascule, css2, av, fmtBilan, NOMS, TYPES_BILAN };
})();
