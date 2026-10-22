// MESURES D'UNE DIRECTIVE dans sa fenetre (PC : bgs.html, mobile : mobile.html) : participants, bilan depuis l'emission, barres par tick sous la courbe d'influence.
// Decision du 22/10 : AUCUN pourcentage d'avancement ni objectif d'escadron ; on MESURE la participation (voir quotas-jour.js).
//  - sous la courbe : une barre par periode entre deux ticks = pilotes ayant AGI pendant la periode (partie verte : dont quota atteint) ; traits de tick discrets ;
//  - cadre « EFFORT » : avatars des participants (anneau = etat du jour) ; bilan : total de l'escadron, ma part, classement par type.
// Donnees : bgs_bilan_directive(p_ordre, p_ticks) (SQL 111 ; UN appel a l'ouverture de la fenetre, memoire 5 min) ; ticks : tick.js (cache du navigateur), passes au serveur.
// Sans le SQL 111 (fonction absente) ou sans donnees, la fenetre garde son affichage habituel.
(function () {
    "use strict";
    if (window.EdteamBgsTicks) return;
    const JOUR = 86400000;
    const E = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const jj = ms => { const d = new Date(ms); return String(d.getUTCDate()).padStart(2, "0") + "/" + String(d.getUTCMonth() + 1).padStart(2, "0"); };

    const CSS = `
.bt-bar{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 6px;font-size:.68em;color:#8a8a8a;letter-spacing:1px}
.bt-bar button{background:transparent;border:1px solid #3a3a3a;color:#9fb4bd;font:inherit;font-size:.95em;letter-spacing:1px;padding:3px 9px;cursor:pointer}.bt-bar button:hover{border-color:#9fb4bd;color:#fff}
.bt-cap{min-height:1.4em;margin-top:6px;font-size:.78em;color:#b9c8ce;line-height:1.45}`;
    function css() { if (document.getElementById("bt-css")) return; const st = document.createElement("style"); st.id = "bt-css"; st.textContent = CSS; document.head.appendChild(st); }

    // ---- lecture serveur (une fois par directive et par 5 minutes) ----
    const memo = {};
    async function charger(id, ticksSec) {
        const m = memo[id]; if (m && Date.now() - m.ts < 300000) return m.data;
        const c = window.supabaseApp; if (!c) return null;
        let d = null;
        try { const r = await c.rpc("bgs_bilan_directive", { p_ordre: Number(id), p_ticks: ticksSec }); d = (r && !r.error && r.data && r.data.types) ? r.data : null; } catch (e) { d = null; }
        memo[id] = { ts: Date.now(), data: d }; return d;
    }

    // ---- periodes entre deux ticks, depuis l'emission de la directive jusqu'a maintenant : pilotes ayant agi (agi) dont quota atteint (qt) ----
    // ticksSec : les ticks ENVOYES au serveur (le numero de periode renvoye = nombre de ticks envoyes deja passes) ; ticks : memes ticks avec le drapeau « estime »
    function periodes(data, ticks, ticksSec, now) {
        const debut = data.depuis * 1000, base = ticksSec.filter(t => t * 1000 <= debut).length, fins = ticks.filter(k => k.t > debut && k.t <= now);
        const bornes = [debut].concat(fins.map(k => k.t), [now]), per = [];
        for (let i = 0; i < bornes.length - 1; i++) per.push({ a: bornes[i], b: bornes[i + 1], tick: i < fins.length ? fins[i] : null, enCours: i === fins.length, agi: 0, qt: 0 });
        (data.periodes || []).forEach(r => { const j = Math.min(per.length - 1, Math.max(0, Number(r[0]) - base)); per[j].agi += Number(r[1]) || 0; per[j].qt += Number(r[2]) || 0; });
        return per;
    }
    const titre = p => (p.premiere ? "émission" : jj(p.a)) + " → " + (p.tick ? jj(p.tick.t) + (p.tick.est ? " (tick estimé)" : "") : "maintenant");
    function texte(p, avecQuota) {
        return "<b>" + titre(p) + "</b><br>" + (p.agi > 0 ? p.agi + " pilote" + (p.agi > 1 ? "s ont agi" : " a agi") : "aucun pilote n’a agi")
            + (avecQuota && p.agi > 0 ? "<br>" + p.qt + " ont atteint un quota" : "") + (p.enCours ? "<br>période en cours" : "");
    }

    // ---- courbe + bandeau de participation ----
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
        // bandeau : une barre par periode = pilotes ayant agi (vert : dont quota atteint) ; echelle = la periode la plus active affichee, aucun objectif
        const maxA = Math.max(1, ...o.periodes.map(p => p.agi)), top = Hc + 4, hmax = Hb - 14;
        const barres = o.periodes.map((p, i) => {
            const a = X(Math.max(p.a / 1000, tA)), b = X(Math.min(p.b / 1000, tB)); if (b <= a) return "";
            const w = Math.max(3, b - a - 3), x = a + 1.5, h = p.agi > 0 ? Math.max(3, p.agi / maxA * hmax) : 1.5, hq = o.avecQuota && p.agi > 0 ? h * p.qt / p.agi : 0, y0 = top + hmax + 4;
            return `<rect x="${x.toFixed(1)}" y="${(y0 - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="#FF7100" opacity="${p.enCours ? 0.4 : 0.72}"${p.enCours ? ' stroke="#FF7100" stroke-dasharray="2 2"' : ""}/>`
                + (hq > 0 ? `<rect x="${x.toFixed(1)}" y="${(y0 - hq).toFixed(1)}" width="${w.toFixed(1)}" height="${hq.toFixed(1)}" fill="#2fe07a" opacity="${p.enCours ? 0.5 : 0.85}"/>` : "")
                + `<rect class="bt-hit" data-tip="${E(texte(p, o.avecQuota))}" x="${a.toFixed(1)}" y="0" width="${Math.max(3, b - a).toFixed(1)}" height="${Hc + Hb}" fill="transparent" style="cursor:help"/>`;
        }).join("");
        const dc = s => new Date(s * 1000).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
        const dernier = vis[vis.length - 1];
        return `<div class="bt-bar"><span><span style="color:#FF7100">■</span> pilotes ayant agi à chaque tick${o.avecQuota ? ' · <span style="color:#2fe07a">■</span> quota atteint' : ""} · <span style="color:#777">┆ tick</span></span><button type="button" data-bt="zoom">${o.zoom ? "VUE 30 JOURS" : "ZOOM SUR LA DIRECTIVE"}</button></div>`
            + `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:${H}px;background:rgba(255,255,255,0.02);border:1px solid #222;${mob ? "border-radius:8px;" : ""}display:block;">${grille}${traits}${repere}${barres}<polyline fill="none" stroke="${o.couleur}" stroke-width="${mob ? 2.2 : 2.4}" points="${pts}"/><circle cx="${X(Number(dernier[0])).toFixed(1)}" cy="${Y(Number(dernier[1]) * 100).toFixed(1)}" r="4" fill="${o.couleur}"/>`
            + `<text x="4" y="${top + 8}" fill="#666" font-size="${mob ? 7 : 8}" letter-spacing="1">PILOTES PAR TICK</text><text x="4" y="${H - 3}" fill="#666" font-size="${mob ? 8 : 9}">${dc(tA)}</text><text x="${W - (mob ? 26 : 30)}" y="${H - 3}" fill="#666" font-size="${mob ? 8 : 9}">${dc(tB)}</text></svg>`
            + `<div class="bt-cap"></div>`;
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
            n.addEventListener("click", () => { const cap = racine.querySelector(".bt-cap"); if (cap) cap.innerHTML = n.dataset.tip; });
        });
    }

    function chargerScript(src) { return new Promise((ok, ko) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = ko; document.head.appendChild(s); }); }

    // ---- point d'entree : o = { ordre, res, couleur, zone (courbe), zoneBilan, zoneHero, zoneResume, moiId, mobile } ----
    // Charge le bilan (un appel), puis remplit : le cadre « participants » (avatars), le bilan et, si la courbe existe, les barres par tick.
    async function monter(o) {
        try {
            if (!window.EdteamQuotas) return;
            if (!window.EdteamTick) { try { await chargerScript("tick.js?v=6"); } catch (e) { return; } }
            try { await window.EdteamTick.assurer(); } catch (e) { /* ticks du cache */ }
            const racine = o.zone || o.zoneBilan || o.zoneHero; if (!racine || !racine.isConnected) return;
            const now = Date.now(), ticks = window.EdteamTick.liste(now - 32 * JOUR, now).slice(-59), ticksSec = ticks.map(k => Math.floor(k.t / 1000));
            const data = await charger(o.ordre.id, ticksSec); if (!racine.isConnected) return;
            if (!data && !o.v2) return;
            css();
            const Q = window.EdteamQuotas, avecQuota = false;      // aucun statut de quota montre aux pilotes : les barres par tick comptent seulement les pilotes ayant agi
            if (o.v2 && window.EdteamBgsParticipants) {
                // fenetre PC : participants, activites cumulees et ticks joues (bgs-participants.js)
                let per = [], presence = null, labels = [];
                if (data) {
                    per = periodes(data, ticks, ticksSec, now); if (per.length) per[0].premiere = true; labels = per.map(titre);
                    if (Array.isArray(data.actifs)) {
                        const base = ticksSec.filter(t => t * 1000 <= data.depuis * 1000).length; presence = {};
                        data.actifs.forEach(r => { const j = Math.min(per.length - 1, Math.max(0, Number(r[0]) - base)); (presence[r[1]] = presence[r[1]] || new Set()).add(j); });
                    }
                }
                window.EdteamBgsParticipants.monter({ ordre: o.ordre, data, classement: o.classement || [], per, presence, labels, moiId: o.moiId, zones: { tuiles: o.zoneHero, activite: o.zoneBilan, part: o.zonePart }, Q });
            } else {
                if (o.zoneHero) {
                    const p = Q.participants(data, o.moiId, o.mobile ? 30 : 34); o.zoneHero.innerHTML = p.html;
                    if (o.zoneResume) o.zoneResume.innerHTML = "<b style=\"color:#2fe07a;font-weight:normal;\">" + p.na + "</b> / " + p.n + " <span style=\"font-size:.5em;color:#8a8a8a;letter-spacing:1px;\">ont joué aujourd’hui</span>";
                }
                if (o.zoneBilan) o.zoneBilan.innerHTML = Q.bilan(o.ordre, data, o.moiId);
            }
            if (data && o.zone && o.res && o.res.courbe && o.res.courbe.length >= 2) {
                const per = periodes(data, ticks, ticksSec, now); if (per.length) per[0].premiere = true;
                const emisSec = data.depuis, jeune = (now / 1000 - emisSec) < 10 * 86400;
                const etat = { courbe: o.res.courbe, emisSec, couleur: o.couleur, periodes: per, ticks, mobile: !!o.mobile, zoom: jeune, avecQuota };
                const dessiner = () => { o.zone.innerHTML = courbeHtml(etat); lier(o.zone, !!o.mobile); };
                o.zone.addEventListener("click", e => { const b = e.target.closest("[data-bt='zoom']"); if (b) { etat.zoom = !etat.zoom; dessiner(); } });
                dessiner();
            }
        } catch (e) { console.error("Mesures de la directive :", e); }
    }
    window.EdteamBgsTicks = { monter, periodes, charger };
})();
