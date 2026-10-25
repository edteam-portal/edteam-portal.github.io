// DEBUT ET FIN DE GUERRE / D'ELECTION sur les factions qui font l'objet d'une directive (PC : bgs.html via campagnes.js ; mobile : campagnes-mobile.js).
// Le serveur (SQL 132) compare l'etat des factions a chaque releve (EDSM ou pilote) et enregistre DEBUT / FIN ; bgs_evenements_conflit(p_depuis) rend les evenements
// depuis le DERNIER TICK (calcule ici par tick.js) pour les directives actives de l'escadron. Le bandeau reste donc jusqu'au tick suivant.
// L'heure affichee est celle de la DETECTION (EDSM n'est mis a jour que quand un joueur visite le systeme). Le resultat vient du dernier score releve : INCONNU si pas de vainqueur net.
// Amiral / officiers : un bouton « PASSER EN GUERRE / ELECTION » ouvre l'edition de la directive (PC seulement ; pas d'edition de directive sur mobile).
// Sans le SQL 132 ou en cas d'erreur : charger() rend null et rien ne s'affiche.
(function () {
    "use strict";
    if (window.EdteamConflitEvt) return;
    var memo = null;
    function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

    // dernier tick connu (ms) ; a defaut, hier
    function dernierTick() {
        var T = window.EdteamTick, now = Date.now();
        try { if (T && T.liste) { var l = T.liste(now - 3 * 86400000, now); if (l.length) return l[l.length - 1].t; } } catch (e) { /* repli */ }
        return now - 86400000;
    }
    function chargerScript(src) { return new Promise(function (ok, ko) { var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = ko; document.head.appendChild(s); }); }

    // lecture (une fois pour toutes les directives, memoire 2 minutes) ; rend { ordre_id : [evenements] } ou null
    async function charger(force) {
        if (!force && memo && Date.now() - memo.ts < 120000) return memo.data;
        var c = window.supabaseApp; if (!c) return null;
        var map = null;
        try {
            if (!window.EdteamTick) { try { await chargerScript("tick.js?v=8"); } catch (e) { /* tick du cache */ } }
            if (window.EdteamTick && window.EdteamTick.assurer) { try { await window.EdteamTick.assurer(); } catch (e) { /* tick du cache */ } }
            var r = await c.rpc("bgs_evenements_conflit", { p_depuis: new Date(dernierTick()).toISOString() });
            if (r && !r.error && Array.isArray(r.data)) { map = {}; r.data.forEach(function (x) { (map[x.ordre_id] = map[x.ordre_id] || []).push(x); }); }
        } catch (e) { map = null; }
        memo = { ts: Date.now(), data: map }; window.cacheEvtConflits = map;
        return map;
    }

    var CSS = ""
        + ".cev{position:relative;overflow:hidden;display:flex;align-items:center;gap:14px;padding:10px 14px;margin:0 0 6px;border:1px solid var(--c);background:linear-gradient(90deg,color-mix(in srgb,var(--c) 14%,#05070a),#05070a 80%);box-shadow:0 0 0 1px rgba(255,255,255,.03),0 0 22px color-mix(in srgb,var(--c) 22%,transparent) inset;white-space:normal;cursor:default;grid-column:1/-1}"
        + ".cev .ico{font-size:24px;line-height:1;flex:none}.cev .tx{min-width:0;flex:1}"
        + ".cev .t{font-family:Orbitron,'Share Tech Mono',monospace;color:#fff;letter-spacing:3px;font-size:15px;font-weight:bold;text-shadow:0 0 10px var(--c)}"
        + ".cev .s{color:#9fb0ba;font-size:11.5px;margin-top:3px;line-height:1.45}.cev .s b{color:var(--c);font-weight:normal}"
        + ".cev .cta{flex:none;border:1px solid var(--c);color:var(--c);background:rgba(0,0,0,.35);padding:7px 12px;font:inherit;font-size:11px;letter-spacing:2px;cursor:pointer}.cev .cta:hover{background:color-mix(in srgb,var(--c) 22%,#000);color:#fff}"
        + ".cev .score{font-family:Orbitron,'Share Tech Mono',monospace;font-size:20px;color:#fff;letter-spacing:4px;flex:none;text-shadow:0 0 10px var(--c)}"
        + ".cev .fin{position:absolute;right:10px;top:5px;font-size:9.5px;letter-spacing:1px;color:#667}"
        + ".cev.war{--c:#FF7100;animation:cev-pulse 2.4s ease-in-out infinite}.cev.vote{--c:#00F0FF;animation:cev-pulsec 3s ease-in-out infinite}.cev.win{--c:#FFD24A;animation:cev-flash 5s ease-out infinite}.cev.lose{--c:#8794a3}"
        + "@keyframes cev-pulse{0%,100%{box-shadow:0 0 0 1px rgba(255,255,255,.03),0 0 14px color-mix(in srgb,var(--c) 18%,transparent) inset,0 0 0 0 rgba(255,113,0,0)}50%{box-shadow:0 0 0 1px rgba(255,255,255,.03),0 0 30px color-mix(in srgb,var(--c) 38%,transparent) inset,0 0 16px 0 rgba(255,113,0,.28)}}"
        + ".cev.war::before{content:'';position:absolute;top:0;bottom:0;width:90px;left:-120px;background:linear-gradient(90deg,transparent,rgba(255,150,60,.35),transparent);animation:cev-balaye 3.2s linear infinite}"
        + "@keyframes cev-balaye{to{left:calc(100% + 40px)}}"
        + ".cev.war .t{animation:cev-saccade 5s steps(1) infinite}@keyframes cev-saccade{0%,92%,100%{opacity:1;transform:none}93%{opacity:.35;transform:translateX(2px)}94%{opacity:1;transform:translateX(-2px)}95%{opacity:.5;transform:none}96%{opacity:1}}"
        + ".cev.war .ico{animation:cev-tremble 1.6s ease-in-out infinite}@keyframes cev-tremble{0%,100%{transform:rotate(0)}25%{transform:rotate(-6deg)}75%{transform:rotate(6deg)}}"
        + "@keyframes cev-pulsec{0%,100%{box-shadow:0 0 14px color-mix(in srgb,var(--c) 16%,transparent) inset}50%{box-shadow:0 0 28px color-mix(in srgb,var(--c) 34%,transparent) inset}}"
        + ".cev .bul{position:absolute;top:-14px;width:9px;height:12px;background:linear-gradient(#e8fbff,#9fe9f5);opacity:0;border-radius:1px;animation:cev-tombe 3.6s linear infinite}"
        + "@keyframes cev-tombe{0%{transform:translateY(0) rotate(0);opacity:0}10%{opacity:.75}85%{opacity:.55}100%{transform:translateY(78px) rotate(210deg);opacity:0}}"
        + ".cev .cf{position:absolute;top:-10px;width:6px;height:9px;opacity:0;animation:cev-conf 3.4s ease-in infinite}"
        + "@keyframes cev-conf{0%{transform:translateY(0) rotate(0);opacity:0}8%{opacity:1}100%{transform:translateY(90px) rotate(520deg);opacity:0}}"
        + "@keyframes cev-flash{0%{box-shadow:0 0 60px rgba(255,210,74,.55) inset}18%,100%{box-shadow:0 0 18px rgba(255,210,74,.14) inset}}"
        + ".cev .tampon{border:2px solid var(--c);color:var(--c);padding:3px 10px;letter-spacing:3px;font-size:13px;font-weight:bold;transform:rotate(-4deg);animation:cev-cachet .5s cubic-bezier(.2,1.6,.4,1) both;flex:none}"
        + "@keyframes cev-cachet{from{transform:rotate(-4deg) scale(2.3);opacity:0}to{transform:rotate(-4deg) scale(1);opacity:1}}"
        + ".cev.lose.perdue{filter:saturate(.35);animation:cev-glitch 7s steps(1) infinite}@keyframes cev-glitch{0%,95%,100%{transform:none}96%{transform:translateX(-3px)}97%{transform:translateX(3px) skewX(-2deg)}98%{transform:none}}"
        + ".cev .aside{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex:none}.cev .s .l{display:block}.cev.m{padding:8px 10px;gap:9px}.cev.m .aside{gap:4px}.cev.m .s{margin-top:2px;line-height:1.35}.cev.m .s .l{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cev.m .src{display:none}.cev.m .t{font-size:12.5px;letter-spacing:2px}.cev.m .ico{font-size:20px}.cev.m .s{font-size:10.5px}.cev.m .score{font-size:16px}.cev.m .tampon{font-size:11px;padding:2px 8px}.cev.m .fin{display:none}"
        + "@media (max-width:760px){.cev:has(.cta){flex-wrap:wrap}.cev .cta{width:100%}}"
        + "@media (prefers-reduced-motion:reduce){.cev,.cev *,.cev::before{animation:none!important}}";
    function css() { if (document.getElementById("cev-css")) return; var st = document.createElement("style"); st.id = "cev-css"; st.textContent = CSS; document.head.appendChild(st); }

    function ilYa(sec) {
        var s = Math.max(0, Math.round(Date.now() / 1000 - sec));
        if (s < 90) return "à l’instant";
        if (s < 5400) return "il y a " + Math.round(s / 60) + " min";
        return "il y a " + Math.round(s / 3600) + " h";
    }
    var CONFETTIS = [["12%", "#FFD24A", "0s"], ["25%", "#fff3c4", ".6s"], ["41%", "#FFB000", "1.2s"], ["58%", "#FFD24A", ".3s"], ["73%", "#fff3c4", "1.7s"], ["88%", "#FFB000", ".9s"]];
    var BULLETINS = [["22%", "0s"], ["38%", ".9s"], ["55%", "1.8s"], ["71%", "2.7s"], ["86%", "1.3s"]];

    // evenement a montrer pour une directive : le plus recent parmi ses genres
    function evenement(o) {
        var m = window.cacheEvtConflits, l = m && o && m[o.id]; if (!l || !l.length) return null;
        return l.slice().sort(function (a, b) { return Number(b.detecte) - Number(a.detecte); })[0];
    }
    // bandeau d'une directive (chaine vide sans evenement). opts : { commande : bool (bouton), mobile : bool }
    function bandeau(o, opts) {
        var e = evenement(o); if (!e) return ""; opts = opts || {}; css();
        var guerre = e.genre === "GUERRE", nom = guerre ? "GUERRE" : "ÉLECTION", ico = guerre ? "⚔️" : "🗳️";
        var lieu = esc(String(e.systeme || "").toUpperCase()), fac = esc(String(e.faction || "").toUpperCase());
        var src = String(e.source || "").toUpperCase() === "PILOTE" && e.par ? "relevé par CMDR " + esc(String(e.par).toUpperCase()) : "relevé EDSM";
        var quand = ilYa(Number(e.detecte)), typeFr = o.type_ordre === "ELECTION" ? "ÉLECTION" : esc(String(o.type_ordre || ""));
        var cls = "cev" + (opts.mobile || opts.compact ? " m" : ""), h, haut = "";
        if (e.evenement === "DEBUT") {
            var encours = e.source === "EN_COURS", titre = encours ? (guerre ? "GUERRE EN COURS" : "ÉLECTION EN COURS") : (guerre ? "LA GUERRE A COMMENCÉ" : "L’ÉLECTION A COMMENCÉ");
            if (encours) { src = "d’après le dernier relevé"; quand = ilYa(Number(e.detecte)); }
            var passer = o.type_ordre !== (guerre ? "GUERRE" : "ELECTION");
            var cta = opts.commande && passer && !opts.mobile ? "<button type=\"button\" class=\"cta\" onclick=\"event.stopPropagation(); EdteamConflitEvt.passer(" + Number(o.id) + ",'" + (guerre ? "GUERRE" : "ELECTION") + "')\">PASSER EN " + (guerre ? "GUERRE" : "ÉLECTION") + "</button>" : "";
            if (!guerre) haut = BULLETINS.map(function (b) { return "<span class=\"bul\" style=\"left:" + b[0] + ";animation-delay:" + b[1] + "\"></span>"; }).join("");
            h = "<div class=\"" + cls + " " + (guerre ? "war" : "vote") + "\">" + haut + "<span class=\"ico\">" + ico + "</span><div class=\"tx\"><div class=\"t\">" + titre + "</div>"
                + "<div class=\"s\"><span class=\"l\">" + lieu + " · <b>" + fac + "</b></span><span class=\"l\">" + (encours ? "directive posée " : "détectée ") + quand + "<span class=\"src\"> (" + src + ")</span> · directive : <b>" + typeFr + " #" + Number(o.id) + "</b></span></div></div>" + cta + "<span class=\"fin\">jusqu’au tick</span></div>";
            return h;
        }
        // FIN : resultat d'apres le dernier score releve
        var pour = e.pour, contre = e.contre, score = pour != null && contre != null ? "<span class=\"score\">" + Number(pour) + " – " + Number(contre) + "</span>" : "";
        var adv = e.adversaire ? " contre " + esc(String(e.adversaire).toUpperCase()) : "";
        var cible = o.type_ordre === "BAISSE";       // faction VISEE par une baisse : sa victoire ou sa defaite n'est pas « la notre »
        var gagnee = e.resultat === "GAGNEE", perdue = e.resultat === "PERDUE", t, cl, tampon = "", sousRes;
        if (cible) { t = nom + " TERMINÉE"; cl = "lose"; sousRes = "la faction visée " + (gagnee ? "l’a <b>remportée</b>" : perdue ? "l’a <b>perdue</b>" : "— résultat non confirmé"); }
        else if (gagnee) { t = nom + (guerre ? " GAGNÉE" : " GAGNÉE"); cl = "win"; tampon = "<span class=\"tampon\">VICTOIRE</span>"; sousRes = "d’après le dernier score relevé"; haut = CONFETTIS.map(function (c) { return "<span class=\"cf\" style=\"left:" + c[0] + ";background:" + c[1] + ";animation-delay:" + c[2] + "\"></span>"; }).join(""); }
        else if (perdue) { t = nom + (guerre ? " PERDUE" : " PERDUE"); cl = "lose perdue"; tampon = "<span class=\"tampon\">DÉFAITE</span>"; sousRes = "d’après le dernier score relevé"; }
        else { t = nom + " TERMINÉE"; cl = "lose"; sousRes = "résultat non confirmé" + (pour != null ? " : dernier score relevé " + Number(pour) + " – " + Number(contre) : " : aucun score relevé"); }
        return "<div class=\"" + cls + " " + cl + "\">" + haut + "<span class=\"ico\">" + (gagnee && !cible ? "🏆" : ico) + "</span><div class=\"tx\"><div class=\"t\">" + t + "</div>"
            + "<div class=\"s\"><span class=\"l\">" + lieu + " · <b>" + fac + "</b>" + adv + "</span><span class=\"l\">" + sousRes + " · " + quand + "<span class=\"src\"> (" + src + ")</span></span></div></div>" + (score || tampon ? "<div class=\"aside\">" + (cible ? "" : score) + tampon + "</div>" : "") + "<span class=\"fin\">jusqu’au tick</span></div>";
    }

    // bouton du commandement : ouvre l'edition de la directive avec le type propose
    async function passer(id, genre) {
        try {
            if (typeof window.ouvrirEditionOrdre === "function") {
                await window.ouvrirEditionOrdre(id);
                var sel = document.getElementById("edit-ordre-type"); if (sel) sel.value = genre;
            }
        } catch (e) { /* edition indisponible */ }
    }

    window.EdteamConflitEvt = { charger: charger, bandeau: bandeau, evenement: evenement, passer: passer, css: css };
})();
