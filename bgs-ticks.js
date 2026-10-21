// EFFORT PAR TICK dans la modale de directive (PC : bgs.html, mobile : mobile.html).
// - sous la courbe d'influence : une barre par periode entre deux ticks (hauteur = part de l'effort general fournie pendant la periode), traits de tick discrets ;
// - sur la barre « effort de l'escadron » : un separateur par tick avec la date, l'infobulle donne la part de chaque periode.
// Donnees : bgs_effort_serie(p_ordre) (SQL 109 : efforts par tranche de 15 min et par type, UN appel a l'ouverture de la modale, memoire 5 min) ; ticks : tick.js (cache du navigateur, aucun appel serveur).
// Le calcul de l'effort general est REJOUE ici avec les memes formules et les memes plafonds que les jauges de la modale : chaque periode vaut la hausse du pourcentage general pendant la periode.
// Sans le SQL 109 (fonction absente) ou sans donnees, la modale garde son affichage habituel.
(function () {
    "use strict";
    if (window.EdteamBgsTicks) return;
    const JOUR = 86400000, MID = 450000;     // MID : milieu d'une tranche de 15 minutes
    const E = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const fr1 = x => (Math.round(x * 10) / 10).toFixed(1).replace(".", ",");
    const jj = ms => { const d = new Date(ms); return String(d.getUTCDate()).padStart(2, "0") + "/" + String(d.getUTCMonth() + 1).padStart(2, "0"); };
    const hh = ms => { const d = new Date(ms); return String(d.getUTCHours()).padStart(2, "0") + ":" + String(d.getUTCMinutes()).padStart(2, "0"); };

    const CSS = `
.bt-bar{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 6px;font-size:.68em;color:#8a8a8a;letter-spacing:1px}
.bt-bar button{background:transparent;border:1px solid #3a3a3a;color:#9fb4bd;font:inherit;font-size:.95em;letter-spacing:1px;padding:3px 9px;cursor:pointer}.bt-bar button:hover{border-color:#9fb4bd;color:#fff}
.bt-cap{min-height:1.4em;margin-top:6px;font-size:.78em;color:#b9c8ce;line-height:1.45}
.bt-seg{position:absolute;top:0;bottom:0;z-index:2;cursor:help}.bt-seg:hover{background:rgba(255,255,255,.14)}
.bt-sep{position:absolute;top:-4px;bottom:-4px;width:0;border-left:2px solid #e9f3f7;z-index:3;pointer-events:none;box-shadow:0 0 6px rgba(127,216,255,.7)}.bt-sep.est{border-left-style:dashed;box-shadow:none;opacity:.85}
.bt-lab{position:relative;height:14px;margin-top:3px;font-size:.62em;color:#cfe3ea;letter-spacing:0}.bt-lab span{position:absolute;top:0;transform:translateX(-50%);white-space:nowrap}.bt-lab span.est{color:#8fa6ae}`;
    function css() { if (document.getElementById("bt-css")) return; const st = document.createElement("style"); st.id = "bt-css"; st.textContent = CSS; document.head.appendChild(st); }

    // ---- lecture serveur (une fois par directive et par 5 minutes) ----
    const memo = {};
    async function charger(id) {
        const m = memo[id]; if (m && Date.now() - m.ts < 300000) return m.data;
        const c = window.supabaseApp; if (!c) return null;
        let d = null;
        try { const r = await c.rpc("bgs_effort_serie", { p_ordre: Number(id) }); d = (r && !r.error && r.data && Array.isArray(r.data.serie)) ? r.data : null; } catch (e) { d = null; }
        memo[id] = { ts: Date.now(), data: d }; return d;
    }

    // ---- effort general (0 a 100) depuis les totaux cumules par type : memes formules que les jauges de la modale ----
    function globalDe(type, T, cap, nb) {
        const S = t => Number(T[t] && T[t].s) || 0, R = (x, c) => c > 0 ? Math.min(100, 100 * x / c) : 0;
        let somme = 0, div = 1;
        if (type === "HAUSSE") { somme = R(S("MISSIONS"), cap.MISSIONS) + R(S("ECONOMIE"), cap.ECONOMIE) + R(S("SECURITE"), cap.SECURITE) + R(S("SCIENCE"), cap.SCIENCE); div = 4; }
        else if (type === "BAISSE") { somme = R(S("MEURTRES"), cap.MEURTRES) + R(S("CONTREBANDE"), cap.CONTREBANDE) + R(S("ECHECS"), cap.ECHECS); div = 3; }
        else if (type === "GUERRE") {
            const capB = cap.GUERRE_BONDS || cap.SECURITE, capM = cap.GUERRE_MISSIONS || cap.MISSIONS, capC = cap.CZ_VICTOIRES || (5 * nb), nbCz = Number(T.CZ_VICTOIRES && T.CZ_VICTOIRES.n) || 0;
            somme = R(S("SECURITE"), capB) + R(S("MISSIONS"), capM) + R(nbCz, capC); div = 3;
        } else if (type === "ELECTION") { somme = R(S("MISSIONS"), cap.ELECTION_MISSIONS || cap.MISSIONS); div = 1; }
        return Math.min(100, somme / div);
    }

    // ---- periodes entre deux ticks, depuis l'emission de la directive jusqu'a maintenant ----
    function periodes(ordre, data, cap, nb, ticks, now) {
        const debut = data.depuis * 1000, fins = ticks.filter(k => k.t > debut && k.t <= now);
        const bornes = [debut].concat(fins.map(k => k.t), [now]), per = [];
        for (let i = 0; i < bornes.length - 1; i++) per.push({ a: bornes[i], b: bornes[i + 1], tick: i < fins.length ? fins[i] : null, enCours: i === fins.length, tot: {}, pct: 0 });
        data.serie.forEach(r => {
            const ms = Number(r[0]) * 1000 + MID; let idx = per.findIndex(p => ms < p.b); if (idx < 0) idx = per.length - 1;
            const t = per[idx].tot, ty = String(r[1]); t[ty] = t[ty] || { s: 0, n: 0 }; t[ty].s += Number(r[2]) || 0; t[ty].n += Number(r[3]) || 0;
        });
        const cum = {}; let prec = 0;
        per.forEach(p => {
            Object.keys(p.tot).forEach(ty => { cum[ty] = cum[ty] || { s: 0, n: 0 }; cum[ty].s += p.tot[ty].s; cum[ty].n += p.tot[ty].n; });
            const g = globalDe(ordre.type_ordre, cum, cap, nb); p.pct = Math.max(0, g - prec); prec = g;
        });
        return per;
    }
    const titre = p => (p.a === undefined ? "" : (p.premiere ? "émission" : jj(p.a)) + " → " + (p.tick ? jj(p.tick.t) + (p.tick.est ? " (tick estimé)" : "") : "maintenant"));
    function delta(courbe, tickMs) {
        let av = null, ap = null;
        (courbe || []).forEach(p => { const t = Number(p[0]) * 1000; if (t <= tickMs) av = p; else if (!ap) ap = p; });
        if (!av || !ap || Number(ap[0]) - Number(av[0]) > 48 * 3600) return null;
        return (Number(ap[1]) - Number(av[1])) * 100;
    }
    function texte(p, courbe, sens) {
        let t = "<b>" + titre(p) + "</b><br>effort : " + (p.pct > 0 ? "+" + fr1(p.pct) + " %" : "aucun") + (p.enCours ? " · période en cours" : "");
        if (p.tick) { const d = delta(courbe, p.tick.t); if (d !== null) t += "<br>influence autour du tick : " + (d > 0.04 ? "▲ +" : d < -0.04 ? "▼ −" : "= ") + fr1(Math.abs(d)) + " pt" + (Math.abs(d) >= 1.05 ? "s" : ""); }
        return t;
    }

    // ---- courbe + bandeau d'effort ----
    function courbeHtml(o) {
        const mob = !!o.mobile, W = mob ? 340 : 460, Hc = mob ? 120 : 150, Hb = mob ? 40 : 48, H = Hc + Hb + 14, fs = mob ? 9 : 10;
        const cb = o.courbe, now = Date.now() / 1000, emis = o.emisSec, bas = Hc - (mob ? 16 : 18), haut = Hc - (mob ? 30 : 36);
        let tA = Number(cb[0][0]), tB = Math.max(Number(cb[cb.length - 1][0]), now);
        if (o.zoom) tA = Math.max(tA, emis - Math.max(36 * 3600, (now - emis) * 0.25));
        const dt = (tB - tA) || 1, X = s => ((s - tA) / dt) * (W - 10) + 5;
        let vis = cb.filter(p => Number(p[0]) >= tA); const avant = cb.filter(p => Number(p[0]) < tA); if (avant.length) vis = [avant[avant.length - 1]].concat(vis);
        if (vis.length < 2) vis = cb.slice(-2);
        const v = vis.map(p => Number(p[1]) * 100); let mn = Math.min(...v), mx = Math.max(...v); const marge = Math.max(0.5, (mx - mn) * 0.15); mn -= marge; mx += marge;
        const Y = y => bas - ((y - mn) / (mx - mn)) * haut;
        const pts = vis.map((p, i) => X(Number(p[0])).toFixed(1) + "," + Y(v[i]).toFixed(1)).join(" ");
        const grille = [0.25, 0.5, 0.75].map(k => `<line x1="0" y1="${(bas - k * haut).toFixed(1)}" x2="${W}" y2="${(bas - k * haut).toFixed(1)}" stroke="#222"/>`).join("");
        // traits de tick discrets (tirets : tick reel ; pointilles : tick estime)
        const traits = o.ticks.filter(k => k.t / 1000 >= tA && k.t / 1000 <= tB).map(k => `<line x1="${X(k.t / 1000).toFixed(1)}" y1="0" x2="${X(k.t / 1000).toFixed(1)}" y2="${Hc + Hb}" stroke="${k.est ? "#ffffff30" : "#ffffff22"}" stroke-dasharray="${k.est ? "1 3" : "3 3"}"/>`).join("");
        let repere = ""; if (emis > tA && emis < tB) { const x = X(emis).toFixed(1); repere = `<line x1="${x}" y1="0" x2="${x}" y2="${Hc + Hb}" stroke="#FF7100" stroke-dasharray="${mob ? "3 3" : "4 4"}"/><text x="${Math.min(Number(x) + 5, W - (mob ? 70 : 85))}" y="${mob ? 11 : 12}" fill="#FF7100" font-size="${fs}">directive émise</text>`; }
        // bandeau d'effort : une barre par periode, la plus forte en ambre, la periode en cours plus pale
        const maxP = Math.max(0.0001, ...o.periodes.map(p => p.pct)), top = Hc + 4, hmax = Hb - 14;
        const barres = o.periodes.map((p, i) => {
            const a = X(Math.max(p.a / 1000, tA)), b = X(Math.min(p.b / 1000, tB)); if (b <= a) return "";
            const h = p.pct > 0 ? Math.max(3, p.pct / maxP * hmax) : 1.5, fort = p.pct === maxP && p.pct > 0;
            return `<rect x="${(a + 1.5).toFixed(1)}" y="${(top + hmax + 4 - h).toFixed(1)}" width="${Math.max(3, b - a - 3).toFixed(1)}" height="${h.toFixed(1)}" fill="${fort ? "#FFB000" : "#FF7100"}" opacity="${p.enCours ? 0.4 : fort ? 0.95 : 0.72}"${p.enCours ? ' stroke="#FF7100" stroke-dasharray="2 2"' : ""}/>`
                + `<rect class="bt-hit" data-tip="${E(texte(p, cb, o.sens))}" data-i="${i}" x="${a.toFixed(1)}" y="0" width="${Math.max(3, b - a).toFixed(1)}" height="${Hc + Hb}" fill="transparent" style="cursor:help"/>`;
        }).join("");
        const dc = s => new Date(s * 1000).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
        const dernier = vis[vis.length - 1];
        return `<div class="bt-bar"><span><span style="color:#FF7100">■</span> effort entre deux ticks · <span style="color:#777">┆ tick</span></span><button type="button" data-bt="zoom">${o.zoom ? "VUE 30 JOURS" : "ZOOM SUR LA DIRECTIVE"}</button></div>`
            + `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:${mob ? 120 + Hb + 14 : H}px;background:rgba(255,255,255,0.02);border:1px solid #222;${mob ? "border-radius:8px;" : ""}display:block;">${grille}${traits}${repere}${barres}<polyline fill="none" stroke="${o.couleur}" stroke-width="${mob ? 2.2 : 2.4}" points="${pts}"/><circle cx="${X(Number(dernier[0])).toFixed(1)}" cy="${Y(Number(dernier[1]) * 100).toFixed(1)}" r="4" fill="${o.couleur}"/>`
            + `<text x="${mob ? 4 : 4}" y="${top + 8}" fill="#666" font-size="${mob ? 7 : 8}" letter-spacing="1">EFFORT PAR TICK</text><text x="4" y="${H - 3}" fill="#666" font-size="${mob ? 8 : 9}">${dc(tA)}</text><text x="${W - (mob ? 26 : 30)}" y="${H - 3}" fill="#666" font-size="${mob ? 8 : 9}">${dc(tB)}</text></svg>`
            + `<div class="bt-cap"></div>`;
    }

    // ---- barre « effort de l'escadron » : separateurs, dates, infobulles ----
    function barre(el, per, courbe, globalAffiche) {
        if (!el) return;
        el.querySelectorAll(".bt-seg,.bt-sep").forEach(x => x.remove());
        const next = el.nextElementSibling; if (next && next.classList.contains("bt-lab")) next.remove();
        const tot = per.reduce((s, p) => s + p.pct, 0), k = tot > 0 ? globalAffiche / tot : 0, larg = el.getBoundingClientRect().width || 400;
        let x = 0, dernierPx = -1e9; const lab = document.createElement("div"); lab.className = "bt-lab";
        per.forEach(p => {
            const w = p.pct * k, a = x; x += w;
            if (w > 0.15) { const s = document.createElement("div"); s.className = "bt-seg"; s.style.left = a + "%"; s.style.width = w + "%"; s.dataset.tip = texte(p, courbe); el.appendChild(s); }
            if (p.tick && x > 0.3 && x < 99.7) {
                const sp = document.createElement("div"); sp.className = "bt-sep" + (p.tick.est ? " est" : ""); sp.style.left = x + "%"; el.appendChild(sp);
                const px = x / 100 * larg; if (px - dernierPx >= 38) { const l = document.createElement("span"); l.textContent = jj(p.tick.t); l.style.left = x + "%"; if (p.tick.est) l.className = "est"; lab.appendChild(l); dernierPx = px; }
            }
        });
        if (lab.childNodes.length) el.insertAdjacentElement("afterend", lab);
    }

    // ---- liaison des infobulles (survol sur PC, toucher sur mobile : le texte s'affiche sous la courbe) ----
    function lier(racine, mobile) {
        racine.querySelectorAll("[data-tip]").forEach(n => {
            if (n.dataset.bt) return; n.dataset.bt = "1";
            if (!mobile && window.showHoloTooltip) {
                n.addEventListener("mouseenter", e => window.showHoloTooltip(e, n.dataset.tip, "#FF7100", true));
                n.addEventListener("mousemove", e => window.moveHoloTooltip && window.moveHoloTooltip(e));
                n.addEventListener("mouseleave", () => window.hideHoloTooltip && window.hideHoloTooltip());
            }
            n.addEventListener("click", () => { const cap = racine.querySelector(".bt-cap") || document.querySelector(".bt-cap"); if (cap) cap.innerHTML = n.dataset.tip; });
        });
    }

    function chargerScript(src) { return new Promise((ok, ko) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = ko; document.head.appendChild(s); }); }

    // ---- point d'entree : o = { ordre, res, couleur, cap, nb, zone (conteneur de la courbe), barre (element de la barre d'effort), globalAffiche, mobile } ----
    async function monter(o) {
        try {
            if (!o.zone || !o.res || !o.res.courbe || o.res.courbe.length < 2) return;
            const data = await charger(o.ordre.id); if (!data || !o.zone.isConnected) return;
            if (!window.EdteamTick) { try { await chargerScript("tick.js?v=5"); } catch (e) { return; } }
            try { await window.EdteamTick.assurer(); } catch (e) { /* ticks du cache */ }
            if (!o.zone.isConnected) return;
            css();
            const now = Date.now(), ticks = window.EdteamTick.liste(now - 32 * JOUR, now);
            const per = periodes(o.ordre, data, o.cap || {}, o.nb || 1, ticks, now); if (per.length) per[0].premiere = true;
            const emisSec = data.depuis, jeune = (now / 1000 - emisSec) < 10 * 86400;
            const etat = { courbe: o.res.courbe, emisSec, couleur: o.couleur, periodes: per, ticks, mobile: !!o.mobile, zoom: jeune };
            const dessiner = () => { o.zone.innerHTML = courbeHtml(etat); lier(o.zone, !!o.mobile); };
            o.zone.addEventListener("click", e => { const b = e.target.closest("[data-bt='zoom']"); if (b) { etat.zoom = !etat.zoom; dessiner(); } });
            dessiner();
            barre(o.barre, per, o.res.courbe, o.globalAffiche); if (o.barre) lier(o.barre, !!o.mobile);
        } catch (e) { console.error("Effort par tick :", e); }
    }
    window.EdteamBgsTicks = { monter, periodes, globalDe, charger };
})();
