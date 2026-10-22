// ETAT D'UN SYSTEME POWERPLAY : la barre du jeu (4 zones) avec ses deux curseurs, partagee par les lignes de campagne et la fenetre d'une mission (campagnes-pp.js).
// Regles MESUREES le 22/10/2026 sur les journaux de jeu du proprietaire (32 paires de releves d'un meme cycle) :
//  - PowerplayStateControlProgress = position DANS LA ZONE de l'etat actuel (0 a 1) ; au-dela de 1 : promotion au tick, sous 0 : retrogradation ;
//  - elle bouge de (variation des points de renforcement - variation des points de sape) / largeur de la zone ; largeurs : Exploite 350 000, Consolide 650 000, Defendu 1 000 000 points de controle ;
//  - triangle BLANC du jeu = etat au dernier tick (jeudi 07:00 UTC) = progression - net / largeur ; triangle ORANGE = progression du cycle actuel = la valeur du journal.
// NON confirme : conversion des merites en points de controle (merites / 4, estimation) ; usure hebdomadaire eventuelle ; systemes inoccupes (le journal n'en donne pas les scores).
(function () {
    "use strict";
    if (window.EdteamPPEtat) return;
    const W = { Exploited: 350000, Fortified: 650000, Stronghold: 1000000 };
    const IDX = { Exploited: 1, Fortified: 2, Stronghold: 3 };
    const FR = { Unoccupied: "Inoccupé", Exploited: "Exploité", Fortified: "Consolidé", Stronghold: "Défendu" };
    const SUIV = { Exploited: "Consolidé", Fortified: "Défendu", Stronghold: null };
    const PREC = { Exploited: "Inoccupé", Fortified: "Exploité", Stronghold: "Consolidé" };
    const BANDES = ["#6b6b6b", "#c0504d", "#4f9d4f", "#9a5fc0"];
    const COUL = { up: "#2fe07a", dn: "#ff4d4d", fl: "#4DA3FF" };
    const PORTRAITS = { "aisling duval": "aisling-duval", "archon delaine": "archon-delaine", "a. lavigny-duval": "a-lavigny-duval", "arissa lavigny-duval": "a-lavigny-duval", "denton patreus": "denton-patreus", "edmund mahon": "edmund-mahon", "felicia winters": "felicia-winters",
        "li yong-rui": "li-yong-rui", "pranav antal": "pranav-antal", "zemina torval": "zemina-torval", "nakato kaine": "nakato-kaine", "yuri grom": "yuri-grom", "jerome archer": "jerome-archer" };
    const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const fm = n => Math.round(Math.abs(n)).toLocaleString("fr-FR").replace(/ /g, " ");
    const sg = n => (n >= 0 ? "+" : "−") + fm(n);
    const pct = x => Math.round(x * 100);

    // dernier tick = jeudi 07:00 UTC
    function dernierTick() {
        const n = new Date(), d = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate(), 7, 0, 0));
        while (d.getUTCDay() !== 4 || d.getTime() > n.getTime()) d.setUTCDate(d.getUTCDate() - 1);
        return d.getTime();
    }

    // lecture d'un systeme : null sans donnee (ou etat sans zone chiffree : inoccupe)
    function calc(m) {
        const e = m && m.etat; if (!e || !W[e.etat] || e.progres == null) return null;
        const w = W[e.etat], p = Number(e.progres), renf = Number(e.renf) || 0, sape = Number(e.sape) || 0;
        const obs = e.observe_le ? new Date(e.observe_le).getTime() : null;
        const perime = obs != null && obs < dernierTick();            // releve d'avant le dernier tick : les compteurs du cycle en cours ne sont pas connus
        const net = perime ? 0 : renf - sape, S = p - net / w;
        const dir = m.type_pp === "SAPE" ? -1 : 1, mv = (p - S) * w * dir;
        return { st: e.etat, w, p, S, renf, sape, net, mv, perime, sens: Math.abs(p - S) * w < 1 ? "fl" : (mv > 0 ? "up" : "dn"),
            manque: Math.max(0, (1 - p) * w), marge: Math.max(0, p * w), prom: p >= 1, retro: p < 0, pale: perime || (obs != null && Date.now() - obs > 24 * 3600e3), obs, sape_m: m.type_pp === "SAPE" };
    }
    const pos = (st, x) => Math.max(0, Math.min(1, (IDX[st] + x) / 4)) * 100;

    // textes des infobulles (la premiere ligne sert de titre)
    function textes(c) {
        const cible = c.prom ? "Seuil dépassé : promotion en " + SUIV[c.st] + " au prochain tick si cela se maintient." : (SUIV[c.st] ? "Il manque ≈ " + fm(c.manque) + " pts pour passer en " + SUIV[c.st] + "." : "État maximal.");
        const bas = c.retro ? "⚠ Sous zéro : rétrogradation en " + PREC[c.st] + " au prochain tick." : "Marge avant rétrogradation en " + PREC[c.st] + " : " + fm(c.marge) + " pts.";
        return {
            blanc: "Début de cycle : " + FR[c.st] + ", " + pct(c.S) + " % de la zone\n" + (c.perime ? "Relevé d'avant le dernier tick : le cycle en cours n'est pas encore connu, la position est celle du dernier relevé." : "Position du système au dernier tick (jeudi 07:00 UTC), recalculée : progression − net ÷ largeur de la zone."),
            orange: "Cycle actuel : " + FR[c.st] + ", " + pct(c.p) + " % de la zone\n" + (c.perime ? "Net du cycle en cours : pas encore relevé.\n" : "Net du cycle : " + sg(c.net) + " pts (renforcement " + fm(c.renf) + ", sape " + fm(c.sape) + ").\n") + cible + " " + bas,
            seg: (c.sens === "up" ? "Mouvement du cycle dans le sens de la mission : " : "Mouvement du cycle à contre-sens de la mission : ") + sg(c.net) + " pts (" + Math.abs(Math.round((c.p - c.S) * 100)) + " points de zone)\npts = points de contrôle ; 1 mérite ≈ 1/4 pt (estimation non confirmée).",
            bande: "Les 4 zones de la barre du jeu : Inoccupé, Exploité, Consolidé, Défendu.\nZone actuelle : " + FR[c.st] + " (largeur " + fm(c.w) + " pts)."
        };
    }
    const tip = (t, col) => " data-pptip=\"" + esc(t) + "\" data-tc=\"" + col + "\"";

    // la barre ; grand = version de la fenetre (noms des zones sous la barre)
    function barre(c, grand) {
        if (!c) return "";
        const T = textes(c), col = COUL[c.sens] || COUL.fl, xs = pos(c.st, c.S), xp = pos(c.st, c.p), lo = Math.min(xs, xp), la = Math.abs(xp - xs);
        return "<span class=\"pp-zb" + (grand ? " grand" : "") + "\" style=\"--s:" + col + ";\">"
            + "<span class=\"b\"" + tip(T.bande, "#8A7CFF") + ">" + BANDES.map(b => "<i style=\"background:" + b + ";\"></i>").join("") + "</span>"
            + (la > 0.05 ? "<span class=\"sg" + (c.mv > 0 ? "" : " h") + "\" style=\"left:" + lo + "%; width:" + la + "%;\"" + tip(T.seg, col) + "></span>" : "")
            + "<span class=\"tb\" style=\"left:" + xs + "%;\"" + tip(T.blanc, "#ffffff") + "></span><span class=\"tn\" style=\"left:" + xp + "%;\"" + tip(T.orange, "#ffb000") + "></span>"
            + (grand ? "<span class=\"nm\">" + ["INOCCUPÉ", "EXPLOITÉ", "CONSOLIDÉ", "DÉFENDU"].map(n => "<em>" + n + "</em>").join("") + "</span>" : "") + "</span>";
    }
    // resume de la ligne : etat (ou changement attendu) puis net du cycle
    function resume(c) {
        if (!c) return "";
        const etat = c.prom && SUIV[c.st] ? "▲ → " + SUIV[c.st] : (c.retro ? "▼ → " + PREC[c.st] : FR[c.st]);
        const col = c.prom ? COUL.up : (c.retro ? COUL.dn : "#9ab");
        return "<span style=\"display:flex; flex-direction:column; align-items:flex-end; line-height:1.3;\"><span style=\"color:" + col + "; font-size:.78em; letter-spacing:1px; text-transform:uppercase;\">" + esc(etat) + "</span>"
            + (c.perime ? "<span style=\"color:#888; font-size:.78em;\">cycle non relevé</span>" : "<b style=\"color:" + (COUL[c.sens] || "#fff") + "; font-size:.85em;\" title=\"\">net " + sg(c.net) + " pts</b>") + "</span>";
    }
    // ---------- FENETRE D'UNE MISSION : phrases simples, chiffres en points de controle ----------
    const COULS = c => COUL[c.sens] || COUL.fl;
    // phrase de synthese : ce qui se passe et ce que cela implique ; { txt, sens }
    function verdict(c, m) {
        const sape = m.type_pp === "SAPE", net = Math.abs(c.net);
        if (m.type_pp === "ACQUISITION") return { sens: "fl", txt: "Mission d'acquisition : le sens du mouvement n'est pas établi pour ce type de mission, la barre montre seulement la position du système." };
        if (c.perime) return { sens: "fl", txt: "Le dernier relevé date d'avant le dernier tick : on ne sait pas encore ce qui s'est passé depuis jeudi 07:00 UTC. Dès qu'un pilote passe dans le système, le site se met à jour." };
        if (c.prom) return { sens: sape ? "dn" : "up", txt: "Le seuil est dépassé : au prochain tick, le système devrait passer en " + SUIV[c.st] + " (si l'équilibre se maintient)." };
        if (c.retro) return { sens: sape ? "up" : "dn", txt: "Le système est passé sous zéro : au prochain tick, il devrait redescendre en " + PREC[c.st] + "." };
        if (c.sens === "fl") return { sens: "fl", txt: "Rien n'a bougé ce cycle : autant de points de renforcement que de sape." };
        const gagne = c.net > 0;   // le systeme gagne des points (renforcement > sape)
        if (!sape) return gagne ? { sens: "up", txt: "Ce cycle, le renforcement l'emporte : le système gagne " + fm(net) + " points." }
            : { sens: "dn", txt: "Ce cycle, la sape l'emporte : le système perd " + fm(net) + " points. Il faut plus de renforcement que de sape pour compenser." };
        return gagne ? { sens: "dn", txt: "Ce cycle, le renforcement l'emporte : le système gagne " + fm(net) + " points, la sape n'avance pas." }
            : { sens: "up", txt: "Ce cycle, la sape l'emporte : le système perd " + fm(net) + " points." };
    }
    const tuile = (titre, val, coul, expl) => "<div style=\"flex:1; min-width:140px; background:linear-gradient(90deg, color-mix(in srgb, " + coul + " 15%, #0a0c10), #0a0c10 72%); border-left:4px solid " + coul + "; box-shadow:inset 0 0 0 1px rgba(255,255,255,.05); padding:10px 12px;\"><div style=\"color:#9ab; font-size:.7em; letter-spacing:2px;\">" + titre + "</div><div style=\"color:" + coul + "; font-size:1.7em; font-weight:bold; line-height:1.15; margin:3px 0;\">" + val + "</div><div style=\"color:#8a949c; font-size:.74em; line-height:1.4;\">" + expl + "</div></div>";
    // tout le bloc d'etat : synthese, barre, lecture de la barre, chiffres du cycle, ce que cela change
    function panneau(c, m, ctx) {
        if (!c) return "";
        ctx = ctx || {};
        const v = verdict(c, m), col = COUL[v.sens] || COUL.fl, pt = x => fm(x) + " pts", nom = ctx.puissance ? esc(ctx.puissance) : "la puissance qui contrôle";
        const ligne = (icone, titre, val) => "<div style=\"display:flex; align-items:baseline; gap:10px; padding:5px 0; border-bottom:1px solid rgba(255,255,255,.05);\"><span style=\"flex:none; width:20px; text-align:center;\">" + icone + "</span><span style=\"flex:1; color:#bbb;\">" + titre + "</span><b style=\"color:#fff; text-align:right;\">" + val + "</b></div>";
        const tBlanc = "<span style=\"display:inline-block; width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:10px solid #fff;\"></span>";
        const tOrange = "<span style=\"display:inline-block; width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-bottom:10px solid #ffb000;\"></span>";
        const enZone = x => pt(x * c.w) + " sur " + fm(c.w) + " (" + pct(x) + " %)";
        let h = "<div style=\"background:linear-gradient(90deg, color-mix(in srgb, " + col + " 15%, #0a0c10), #0a0c10 72%); border-left:4px solid " + col + "; box-shadow:inset 0 0 0 1px rgba(255,255,255,.05); padding:12px 16px; margin:4px 0 16px; font-size:1.02em; line-height:1.55; color:#eee;\">" + esc(v.txt) + "</div>"
            + "<div style=\"margin:8px 0 22px;\">" + barre(c, true) + "</div>"
            + "<div style=\"font-size:.92em; margin-bottom:6px;\">"
            + ligne(tBlanc, "Position jeudi dernier, au tick <span style=\"color:#777; font-size:.85em;\">(▼ blanc)</span>", FR[c.st] + " · " + enZone(c.S))
            + ligne(tOrange, "Position maintenant <span style=\"color:#777; font-size:.85em;\">(▲ orange)</span>", FR[c.st] + " · " + enZone(c.p))
            + "</div>"
            + "<div style=\"color:#777; font-size:.76em; line-height:1.5; margin-bottom:18px;\">C'est la barre de la carte galactique du jeu. Chaque état a sa zone (Exploité : " + fm(W.Exploited) + " pts, Consolidé : " + fm(W.Fortified) + ", Défendu : " + fm(W.Stronghold) + "). Un système change d'état quand il sort de sa zone, vers la droite (il monte) ou vers la gauche (il descend), au tick du jeudi.</div>"
            + "<div class=\"bgs-sec\" style=\"margin-top:0;\">CE CYCLE <span style=\"color:#777; letter-spacing:0;\">· depuis jeudi 07:00 UTC, tous pilotes confondus</span></div>"
            + "<div style=\"display:flex; gap:10px; flex-wrap:wrap; margin:8px 0 18px;\">"
            + (c.perime ? tuile("RENFORCEMENT", "—", "#00c8ff", "points apportés par " + nom) + tuile("SAPE", "—", "#ff6a6a", "points apportés par les puissances adverses") + tuile("BILAN", "—", "#8a949c", "pas encore relevé ce cycle")
                : tuile("RENFORCEMENT", fm(c.renf), "#00c8ff", "points apportés par " + nom) + tuile("SAPE", fm(c.sape), "#ff6a6a", "points apportés par les puissances adverses") + tuile("BILAN", sg(c.net), COULS(c), "renforcement − sape"))
            + "</div>"
            + "<div class=\"bgs-sec\" style=\"margin-top:0;\">CE QUE CELA CHANGE</div><div style=\"font-size:.92em; margin:6px 0 4px;\">"
            + (SUIV[c.st] ? ligne("▲", "Pour monter en " + SUIV[c.st], c.prom ? "<span style=\"color:" + COUL.up + ";\">seuil dépassé</span>" : "il manque " + pt(c.manque)) : ligne("★", "Niveau le plus haut", "rien à gagner de plus"))
            + (c.prom ? "" : ligne("▼", "Avant de redescendre en " + PREC[c.st], c.retro ? "<span style=\"color:" + COUL.dn + ";\">déjà sous zéro</span>" : "marge de " + pt(c.marge)))
            + (ctx.prochain ? ligne("⏱", "Prochain changement d'état possible", esc(ctx.prochain)) : "")
            + "</div>"
            + "<div style=\"color:#777; font-size:.74em; line-height:1.5; margin-top:8px;\">« pts » = points de contrôle, l'unité du jeu. Mesuré sur les journaux de jeu des pilotes ; l'état change seulement au tick du jeudi (07:00 UTC). " + (m.type_pp === "SAPE" ? "Pour une sape, le sens voulu est la baisse du système. " : "") + "</div>";
        return h;
    }

    function css() {
        if (document.getElementById("pp-etat-css")) return;
        const s = document.createElement("style"); s.id = "pp-etat-css";
        s.textContent = [
            ".pp-zb { position:relative; display:block; height:30px; min-width:120px; }",
            ".pp-zb .b { position:absolute; left:0; right:0; top:12px; height:7px; display:flex; gap:2px; cursor:help; } .pp-zb .b i { flex:1; opacity:.55; }",
            ".pp-zb .sg { position:absolute; top:9px; height:13px; min-width:3px; background:var(--s); box-shadow:0 0 8px var(--s); cursor:help; }",
            ".pp-zb .sg.h { background:repeating-linear-gradient(135deg, var(--s) 0 3px, color-mix(in srgb, var(--s) 30%, transparent) 3px 6px); border:1px solid var(--s); box-sizing:border-box; }",
            ".pp-zb .tb, .pp-zb .tn { position:absolute; width:0; height:0; margin-left:-6px; border-left:6px solid transparent; border-right:6px solid transparent; cursor:help; }",
            ".pp-zb .tb { top:1px; border-top:9px solid #fff; } .pp-zb .tn { top:20px; border-bottom:9px solid #ffb000; }",
            ".pp-zb.grand { height:62px; } .pp-zb.grand .b { top:24px; height:12px; } .pp-zb.grand .sg { top:20px; height:20px; } .pp-zb.grand .tb { top:4px; margin-left:-8px; border-left-width:8px; border-right-width:8px; border-top-width:13px; } .pp-zb.grand .tn { top:41px; margin-left:-8px; border-left-width:8px; border-right-width:8px; border-bottom-width:13px; }",
            ".pp-zb .nm { position:absolute; left:0; right:0; bottom:-14px; display:flex; font-size:.62em; letter-spacing:2px; color:#778; } .pp-zb .nm em { flex:1; font-style:normal; }",
            ".pp-zb.grand { margin-bottom:12px; }"
        ].join("\n");
        document.head.appendChild(s);
    }
    css();

    // infobulles EDTEAM au survol (lignes et fenetre) : memes que le reste du site
    const bulle = (t, col) => { const l = String(t).split("\n"); return "<div style=\"white-space:normal; max-width:340px; line-height:1.5; color:#ddd;\"><strong style=\"color:" + col + ";\">" + esc(l[0]) + "</strong><br>" + l.slice(1).map(esc).join("<br>") + "</div>"; };
    const cible = ev => ev.target.closest && ev.target.closest("[data-pptip]");
    document.addEventListener("mouseover", ev => { const e = cible(ev); if (e && typeof window.showHoloTooltip === "function") window.showHoloTooltip(ev, bulle(e.dataset.pptip, e.dataset.tc || "#8A7CFF"), e.dataset.tc || "#8A7CFF"); });
    document.addEventListener("mousemove", ev => { if (cible(ev) && typeof window.moveHoloTooltip === "function") window.moveHoloTooltip(ev); });
    document.addEventListener("mouseout", ev => { if (cible(ev) && typeof window.hideHoloTooltip === "function") window.hideHoloTooltip(); });

    // portrait carre d'une puissance (vide si inconnue) ; col = couleur du cadre
    function portrait(nom, taille, col) {
        const slug = PORTRAITS[String(nom == null ? "" : nom).trim().toLowerCase().replace(/\s+/g, " ")]; if (!slug) return "";
        return "<img src=\"images/powers/" + slug + ".webp\" alt=\"Portrait de " + esc(nom) + "\" title=\"" + esc(nom) + "\" loading=\"lazy\" onerror=\"this.style.display='none'\" style=\"flex:none; width:" + taille + "px; height:" + taille + "px; object-fit:cover; object-position:top center; border:1px solid " + (col || "#8A7CFF") + "; box-shadow:0 0 12px " + (col || "#8A7CFF") + "44; background:#05080a;\">";
    }
    window.EdteamPPEtat = { portrait, calc, barre, resume, panneau, verdict, textes, FR, W, COUL, dernierTick };
})();
