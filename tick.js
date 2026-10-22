// TICK BGS dans l'en-tete : heure du dernier tick + compte a rebours du prochain.
// Source : tick.edcd.io (detecteur communautaire alimente par EDDN). UN petit appel /api/ticks?start=... (une quinzaine de jours, < 1 Ko), directement depuis le navigateur :
//   AUCUNE requete Supabase, donc aucun egress. Resultat garde dans le navigateur (localStorage), partage entre les pages et les onglets.
// Si le detecteur ne repond plus ou ne detecte plus de tick (cas constate le 21/10 : aucun tick enregistre pendant 4 jours alors que le jeu en fait un par jour), on ESTIME :
//   le tick a lieu chaque jour a peu pres a la meme heure : on affiche une FOURCHETTE (jamais une heure unique) calculee sur les derniers jours reels, marquee « estime ».
// Sans aucune donnee (premier chargement et site injoignable), le bloc reste cache.
(function () {
    "use strict";
    if (window.EdteamTick) return;
    const CLE = "edteam_tick_v1", JOUR = 86400000, HEURE = 3600000;
    const E = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

    const CSS = `
#header-tick{flex:1 1 0;display:flex;align-items:center;justify-content:center;min-width:0;padding:0 6px;overflow:hidden}
.hd-tick{--c:#FF7100;position:relative;display:flex;align-items:center;gap:8px;height:48px;padding:0 12px 0 8px;max-width:100%;min-width:0;border:1px solid color-mix(in srgb,var(--c) 55%,transparent);border-radius:4px;background:linear-gradient(135deg,color-mix(in srgb,var(--c) 10%,transparent),rgba(6,4,2,.6));font-family:'Share Tech Mono',monospace;white-space:nowrap;cursor:help;box-sizing:border-box;overflow:hidden}
.hd-tick.est{--c:#8fb7bf}.hd-tick.att{--c:#FFB000}
.hd-tick .ic{width:26px;height:26px;flex:none;stroke:var(--c);fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.hd-tick .tx{display:flex;flex-direction:column;gap:1px;min-width:0}
.hd-tick .l{font-size:.58em;letter-spacing:1.5px;color:var(--c);opacity:.95;overflow:hidden;text-overflow:ellipsis}
.hd-tick .v{font-size:1em;color:#fff;font-weight:bold;letter-spacing:.5px;line-height:1.1;overflow:hidden;text-overflow:ellipsis}
.hd-tick .v small{color:#9a9a9a;font-weight:normal;font-size:.78em;letter-spacing:0}
.hd-tick .p2{display:none}
@media (max-width:1700px){.hd-tick{height:44px;padding:0 9px 0 6px;gap:6px}}
@media (max-width:1280px){.hd-tick .l{display:none}.hd-tick .fin{display:none}.hd-tick .p1{display:none}.hd-tick .p2{display:inline}}
@media (max-width:1050px){.hd-tick .ic{display:none}}`;

    function lire() { try { const c = JSON.parse(localStorage.getItem(CLE) || "null"); return c && Array.isArray(c.l) ? c : null; } catch (e) { return null; } }
    function ecrire(c) { try { localStorage.setItem(CLE, JSON.stringify(c)); } catch (e) { /* stockage indisponible : pas de memoire entre les pages */ } }
    const jour = d => d.toISOString().slice(0, 10);

    // FOURCHETTE habituelle : l'heure du tick varie de quelques dizaines de minutes d'un jour a l'autre, donc on ne donne jamais une heure unique pour un tick estime.
    // Bornes = environ 15 % et 85 % des heures (UTC) des 14 derniers ticks reels : la fourchette contient la grande majorite des jours.
    function habitude(l) {
        const m = l.slice(-14).map(t => { const d = new Date(t); return d.getUTCHours() * 60 + d.getUTCMinutes(); }).filter(x => x >= 8 * 60 && x <= 23 * 60).sort((a, b) => a - b);
        if (m.length < 5) return { lo: 15 * 60, hi: 17 * 60, sur: false };                      // pas assez de releves : large fourchette observee en octobre 2026
        return { lo: m[Math.floor(m.length * 0.15)], hi: m[Math.ceil(m.length * 0.85) - 1], sur: true };
    }
    const creneau = (jourMs, min) => Math.floor(jourMs / JOUR) * JOUR + min * 60000;      // jourMs : n'importe quel instant du jour UTC voulu

    // etat : { estime, debut, fin (ms : fourchette du prochain tick), dernier (ms, exact) ou dernierFen [debut, fin] (estime), etat : 'avant' | 'fenetre' | 'attendu', hab }
    function calculer(l, maintenant) {
        const h = habitude(l), dern = l.length ? Date.parse(l[l.length - 1]) : NaN;
        const fen = jourMs => [creneau(jourMs, h.lo), creneau(jourMs, h.hi)];
        if (!isFinite(dern) || maintenant - dern > 30 * HEURE) {
            // detecteur muet ou injoignable : le tick a eu lieu chaque jour dans la fourchette habituelle
            let f = fen(maintenant); if (f[1] <= maintenant) f = fen(maintenant + JOUR);
            return { estime: true, debut: f[0], fin: f[1], dernierFen: [f[0] - JOUR, f[1] - JOUR], etat: maintenant >= f[0] ? 'fenetre' : 'avant', hab: h };
        }
        let f = fen(dern + JOUR); if (f[1] <= dern) f = fen(dern + 2 * JOUR);
        return { estime: false, debut: f[0], fin: f[1], dernier: dern, etat: maintenant > f[1] ? 'attendu' : maintenant >= f[0] ? 'fenetre' : 'avant', hab: h };
    }

    const hhmm = ms => { const d = new Date(ms); return String(d.getUTCHours()).padStart(2, "0") + ":" + String(d.getUTCMinutes()).padStart(2, "0"); };
    const hmin = m => m < 60 ? m + " min" : Math.floor(m / 60) + " h " + String(m % 60).padStart(2, "0");
    const hms = sec => { sec = Math.max(0, Math.round(sec)); const p = n => String(n).padStart(2, "0"); return Math.floor(sec / 3600) + ":" + p(Math.floor(sec % 3600 / 60)) + ":" + p(sec % 60); };      // 18:57:12
    const ICONE = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"></circle><path d="M12 9v4l2.5 2"></path><path d="M9 2.5h6"></path></svg>';

    function dessiner() {
        const el = document.getElementById("header-tick"); if (!el) return;
        const c = lire(); if (!c || !c.l.length) { el.innerHTML = ""; return; }
        const now = Date.now(), s = calculer(c.l, now), sec = ms => Math.max(0, (ms - now) / 1000);
        const four = hhmm(s.debut) + " et " + hhmm(s.fin) + " UTC", milieu = (s.debut + s.fin) / 2, marge = Math.round((s.fin - s.debut) / 120000);      // marge : demi-largeur de la fourchette, en minutes
        let cls = "hd-tick", lab, val, tip;
        if (s.etat === "attendu") {
            cls += " att"; lab = "TICK BGS · ATTENDU"; val = "pas encore détecté";
            tip = "Le tick du jour n’est pas encore détecté : il a lieu d’habitude entre " + four + ". Le détecteur peut avoir quelques minutes de retard. Dernier tick détecté : " + hhmm(s.dernier) + " UTC.";
        } else {
            if (s.estime) cls += " est";
            lab = (s.etat === "fenetre" ? "TICK IMMINENT" : "PROCHAIN TICK") + (s.estime ? " · ESTIMÉ" : "");
            val = s.etat === "fenetre" ? "<small>d’ici </small>" + hms(sec(s.fin)) + "<small> au plus</small>"
                : '<small class="p1">dans </small><small class="p2">dans ~</small>' + hms(sec(milieu)) + '<small class="fin"> ± ' + marge + " min</small>";
            tip = (s.estime
                ? "Le détecteur communautaire (tick.edcd.io) n’a plus enregistré de tick depuis le " + new Date(c.l[c.l.length - 1]).toLocaleString("fr-FR", { timeZone: "UTC" }) + " UTC : on ne connaît donc pas l’heure exacte. Le tick a lieu chaque jour à peu près à la même heure ; la fourchette de dernier tick estimé est " + hhmm(s.dernierFen[0]) + " à " + hhmm(s.dernierFen[1]) + " UTC. Dès qu’un vrai tick est détecté, l’heure exacte revient."
                : "Dernier tick détecté à " + hhmm(s.dernier) + " UTC (il y a " + hmin(Math.round((now - s.dernier) / 60000)) + ").")
                + " Prochain tick attendu vers " + hhmm(milieu) + " UTC ± " + marge + " min (entre " + four + ") : l’heure varie d’un jour à l’autre, ce n’est pas une heure exacte.";
        }
        // meme structure qu'a la seconde precedente : seul le compteur change (l'infobulle n'est pas reconstruite, elle ne clignote pas au survol)
        const cle = cls + "|" + lab + "|" + tip + "|" + s.etat;
        const v = el.firstChild && el.firstChild.nodeType === 1 ? el.querySelector(".v") : null;
        if (v && el.dataset.cle === cle) { v.innerHTML = val; return; }
        el.dataset.cle = cle;
        el.innerHTML = '<div class="' + cls + '" title="' + E(tip) + '">' + ICONE + '<div class="tx"><span class="l">' + E(lab) + '</span><span class="v">' + val + "</span></div></div>";
    }

    // lecture reseau : jamais plus d'un appel toutes les 10 minutes (et 3 h si le tick du jour est deja la), partage entre onglets via localStorage
    let enCours = false;
    async function rafraichir() {
        if (enCours) return; enCours = true;
        try {
            const c = lire(), now = Date.now();
            const frais = c && c.l.length && (now - Date.parse(c.l[c.l.length - 1]) < 20 * HEURE) ? 3 * HEURE : 10 * 60000;
            if (c && (now - c.ts < frais || now - (c.essai || 0) < 600000)) return;
            ecrire({ ts: c ? c.ts : 0, essai: now, l: c ? c.l : [] });          // note l'essai tout de suite : jamais plus d'un appel toutes les 10 minutes, meme en cas d'echec
            const r = await fetch("https://tick.edcd.io/api/ticks?start=" + jour(new Date(now - 16 * JOUR)), { cache: "no-store" });
            if (!r.ok) throw new Error("HTTP " + r.status);
            const j = await r.json();
            const l = (Array.isArray(j) ? j : []).map(x => x && x.TIME).filter(t => typeof t === "string" && isFinite(Date.parse(t))).sort();
            if (l.length) ecrire({ ts: now, essai: now, l: l.slice(-40) });       // reponse vide : on garde l'ancien releve
        } catch (e) { /* injoignable : le releve garde reste affiche (estime), nouvel essai dans 10 minutes */
        } finally { enCours = false; }
    }

    function demarrer() {
        if (!document.getElementById("header-tick")) return;
        if (!document.getElementById("hd-tick-css")) { const st = document.createElement("style"); st.id = "hd-tick-css"; st.textContent = CSS; document.head.appendChild(st); }
        dessiner();
        rafraichir().then(dessiner);
        let n = 0;
        setInterval(() => { if (document.hidden) return; dessiner(); if (++n % 30 === 0) rafraichir().then(dessiner); }, 1000);      // compteur a la seconde ; test du reseau toutes les 30 s (l'appel reel reste limite a un par 10 min ou 3 h)
    }
    // Ticks passes entre deux instants (ms) pour les graphiques (barres « effort par tick » des directives) : [{ t (ms), est (bool) }].
    // Les ticks reels sont ceux du detecteur ; un jour sans tick reel (detecteur muet) recoit un tick ESTIME au milieu de la fourchette habituelle, jamais dans le futur.
    function liste(debut, fin) {
        const c = lire(), l = c ? c.l : [], h = habitude(l), maintenant = Date.now(), borne = Math.min(fin, maintenant);
        const reels = l.map(t => Date.parse(t)).filter(t => isFinite(t) && t >= debut && t <= borne).sort((a, b) => a - b);
        const jours = new Set(l.map(t => Date.parse(t)).filter(isFinite).map(t => Math.floor(t / JOUR)));
        const out = reels.map(t => ({ t, est: false }));
        for (let d = Math.floor(debut / JOUR); d <= Math.floor(borne / JOUR); d++) {
            if (jours.has(d)) continue;
            const t = d * JOUR + Math.round((h.lo + h.hi) / 2) * 60000;
            if (t >= debut && t <= borne) out.push({ t, est: true });
        }
        return out.sort((a, b) => a.t - b.t);
    }
    // etat pour d'autres blocs (bande « Aujourd'hui » des quotas) : texte du compte a rebours et marge en minutes ; null sans donnee
    function prochain() {
        const c = lire(); if (!c || !c.l.length) return null;
        const now = Date.now(), s = calculer(c.l, now), marge = Math.round((s.fin - s.debut) / 120000);
        if (s.etat === "attendu") return { texte: "en retard", marge: 0, etat: s.etat, estime: s.estime };
        if (s.etat === "fenetre") return { texte: "imminent", marge: 0, etat: s.etat, estime: s.estime };
        return { texte: "dans " + hms((s.debut + s.fin) / 2 / 1000 - now / 1000), marge, etat: s.etat, estime: s.estime };
    }
    window.EdteamTick = { demarrer, calculer, liste, prochain, assurer: () => rafraichir().then(() => true, () => false) };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", demarrer); else demarrer();
})();
