// DEBUT ET FIN DE GUERRE / D'ELECTION sur les factions qui font l'objet d'une directive (PC : bgs.html via campagnes.js ; mobile : campagnes-mobile.js).
// Le serveur (SQL 132) compare l'etat des factions a chaque releve (EDSM ou pilote) et enregistre DEBUT / FIN ; bgs_evenements_conflit(p_depuis) rend les evenements
// des dernieres 24 h pour les directives actives de l'escadron.
// PRESENTATION (01/11) : une BANDE BASSE (30 px) soudee a la ligne de la directive (meme bloc, meme couleur, une seule lueur), sans le systeme ni la faction (deja sur la ligne) ;
// le detail (heure, source, directive, adversaire) est dans la bulle au survol. La bande reste 24 h, comme la fenetre plein ecran (conflit-modale.js).
// L'heure affichee est celle de la DETECTION (EDSM n'est mis a jour que quand un joueur visite le systeme). Le resultat vient du dernier score releve : INCONNU si pas de vainqueur net.
// Amiral / officiers : un bouton « PASSER EN GUERRE / ELECTION » ouvre l'edition de la directive (PC seulement ; pas d'edition de directive sur mobile).
// Sans le SQL 132 ou en cas d'erreur : charger() rend null et rien ne s'affiche.
(function () {
    "use strict";
    if (window.EdteamConflitEvt) return;
    var memo = null;
    var DUREE = 86400;      // secondes : la bande reste affichee 24 h
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
            // 24 h en arriere (au moins) : meme duree pour la fenetre plein ecran de conflit-modale.js et pour la bande
            var r = await c.rpc("bgs_evenements_conflit", { p_depuis: new Date(Math.min(dernierTick(), Date.now() - DUREE * 1000)).toISOString() });
            if (r && !r.error && Array.isArray(r.data)) { map = {}; r.data.forEach(function (x) { (map[x.ordre_id] = map[x.ordre_id] || []).push(x); }); }
        } catch (e) { map = null; }
        memo = { ts: Date.now(), data: map }; window.cacheEvtConflits = map;
        return map;
    }

    var CSS = ""
        // le bloc : bande + ligne de la directive, une seule bordure et une seule lueur
        + ".cvb-bloc{--c:#FF7100;position:relative;margin:0 0 6px;border:1px solid color-mix(in srgb,var(--c) 70%,#000);box-shadow:0 0 16px color-mix(in srgb,var(--c) 22%,transparent);grid-column:1/-1}"
        + ".cvb-bloc.war,.cvb.war{--c:#FF7100}.cvb-bloc.vote,.cvb.vote{--c:#00F0FF}.cvb-bloc.win,.cvb.win{--c:#FFD24A}.cvb-bloc.lose,.cvb.lose{--c:#8794a3}"
        + ".cvb-bloc.war{animation:cvb-pulse 2.4s ease-in-out infinite}.cvb-bloc.lose{filter:saturate(.55)}"
        + "@keyframes cvb-pulse{0%,100%{box-shadow:0 0 8px color-mix(in srgb,var(--c) 16%,transparent)}50%{box-shadow:0 0 24px color-mix(in srgb,var(--c) 44%,transparent)}}"
        + ".cvb-bloc>.camp-ligne,.cvb-bloc>.mc-row{margin:0!important}"
        // la bande
        + ".cvb{--c:#FF7100;position:relative;overflow:hidden;display:flex;align-items:center;gap:10px;min-height:30px;padding:3px 14px 3px 18px;background:linear-gradient(90deg,color-mix(in srgb,var(--c) 22%,#05070a),color-mix(in srgb,var(--c) 6%,#05070a) 75%);border-bottom:1px solid color-mix(in srgb,var(--c) 55%,#000);box-shadow:inset 4px 0 0 var(--c);white-space:nowrap;cursor:help;grid-column:1/-1}"
        + ".cvb .ico{font-size:16px;line-height:1;flex:none}.cvb .t{font-family:Orbitron,'Share Tech Mono',monospace;color:#fff;letter-spacing:3px;font-size:13px;font-weight:bold;text-shadow:0 0 8px var(--c);overflow:hidden;text-overflow:ellipsis;min-width:0}"
        + ".cvb .tp{margin-left:auto;flex:none;border:2px solid var(--c);color:var(--c);padding:0 9px;letter-spacing:3px;font-size:11px;font-weight:bold;animation:cvb-cachet .5s cubic-bezier(.2,1.6,.4,1) both}"
        + "@keyframes cvb-cachet{from{transform:scale(2.2);opacity:0}to{transform:scale(1);opacity:1}}"
        + ".cvb .cta{margin-left:auto;flex:none;border:1px solid var(--c);color:var(--c);background:rgba(0,0,0,.35);padding:2px 10px;font:inherit;font-size:10.5px;letter-spacing:2px;cursor:pointer}.cvb .cta:hover{background:color-mix(in srgb,var(--c) 22%,#000);color:#fff}"
        + ".cvb .tp~.cta{margin-left:0}.cvb .fn{flex:none;font-size:9.5px;letter-spacing:1px;color:#667}.cvb .t+.fn{margin-left:auto}"
        // effets : guerre = balayage + icone qui tremble + titre qui saccade ; election = bulletins ; victoire = confettis ; defaite = a-coup
        + ".cvb.war::before{content:'';position:absolute;top:0;bottom:0;width:90px;left:-120px;background:linear-gradient(90deg,transparent,rgba(255,150,60,.35),transparent);animation:cvb-balaye 3.2s linear infinite}"
        + "@keyframes cvb-balaye{to{left:calc(100% + 40px)}}"
        + ".cvb.war .ico{display:inline-block;animation:cvb-tremble 1.6s ease-in-out infinite}@keyframes cvb-tremble{0%,100%{transform:rotate(0)}25%{transform:rotate(-6deg)}75%{transform:rotate(6deg)}}"
        + ".cvb.war .t{animation:cvb-saccade 5s steps(1) infinite}@keyframes cvb-saccade{0%,92%,100%{opacity:1;transform:none}93%{opacity:.35;transform:translateX(2px)}94%{opacity:1;transform:translateX(-2px)}95%{opacity:.5;transform:none}96%{opacity:1}}"
        + ".cvb .bul{position:absolute;top:-10px;width:7px;height:9px;background:linear-gradient(#e8fbff,#9fe9f5);opacity:0;border-radius:1px;animation:cvb-tombe 3.6s linear infinite}"
        + "@keyframes cvb-tombe{0%{transform:translateY(0) rotate(0);opacity:0}10%{opacity:.75}85%{opacity:.5}100%{transform:translateY(34px) rotate(210deg);opacity:0}}"
        + ".cvb .cf{position:absolute;top:-8px;width:5px;height:7px;opacity:0;animation:cvb-conf 3.4s ease-in infinite}"
        + "@keyframes cvb-conf{0%{transform:translateY(0) rotate(0);opacity:0}8%{opacity:1}100%{transform:translateY(40px) rotate(520deg);opacity:0}}"
        + ".cvb.win{animation:cvb-flash 5s ease-out infinite}@keyframes cvb-flash{0%{box-shadow:inset 4px 0 0 var(--c),0 0 40px rgba(255,210,74,.5) inset}18%,100%{box-shadow:inset 4px 0 0 var(--c),0 0 10px rgba(255,210,74,.12) inset}}"
        + ".cvb.perdue{animation:cvb-glitch 7s steps(1) infinite}@keyframes cvb-glitch{0%,95%,100%{transform:none}96%{transform:translateX(-3px)}97%{transform:translateX(3px) skewX(-2deg)}98%{transform:none}}"
        // mobile et petites largeurs
        + ".cvb.m{min-height:28px;padding:2px 10px 2px 14px;gap:8px}.cvb.m .t{font-size:11.5px;letter-spacing:2px}.cvb.m .ico{font-size:15px}.cvb.m .tp{font-size:10px;padding:0 7px;letter-spacing:2px}.cvb.m .fn{display:none}"
        + "@media (max-width:760px){.cvb .fn{display:none}.cvb .t{font-size:11.5px;letter-spacing:2px}}"
        + "@media (prefers-reduced-motion:reduce){.cvb-bloc,.cvb,.cvb *,.cvb::before{animation:none!important}}";
    function css() { if (document.getElementById("cvb-css")) return; var st = document.createElement("style"); st.id = "cvb-css"; st.textContent = CSS; document.head.appendChild(st); }

    function ilYa(sec) {
        var s = Math.max(0, Math.round(Date.now() / 1000 - sec));
        if (s < 90) return "à l’instant";
        if (s < 5400) return "il y a " + Math.round(s / 60) + " min";
        return "il y a " + Math.round(s / 3600) + " h";
    }
    var CONFETTIS = [["12%", "#FFD24A", "0s"], ["25%", "#fff3c4", ".6s"], ["41%", "#FFB000", "1.2s"], ["58%", "#FFD24A", ".3s"], ["73%", "#fff3c4", "1.7s"], ["88%", "#FFB000", ".9s"]];
    var BULLETINS = [["22%", "0s"], ["38%", ".9s"], ["55%", "1.8s"], ["71%", "2.7s"], ["86%", "1.3s"]];

    // evenement a montrer pour une directive : le plus recent parmi ses genres, des dernieres 24 h
    function evenement(o) {
        var m = window.cacheEvtConflits, l = m && o && m[o.id]; if (!l || !l.length) return null;
        var depuis = Date.now() / 1000 - DUREE;
        l = l.filter(function (x) { return Number(x.detecte) >= depuis; });
        if (!l.length) return null;
        return l.slice().sort(function (a, b) { return Number(b.detecte) - Number(a.detecte); })[0];
    }
    // contenu de la bande d'une directive : { cls, ico, titre, tampon, effets, bulle } ou null
    function etat(o) {
        var e = evenement(o); if (!e) return null;
        var guerre = e.genre === "GUERRE", nom = guerre ? "GUERRE" : "ÉLECTION", ico = guerre ? "⚔️" : "🗳️";
        var src = String(e.source || "").toUpperCase() === "PILOTE" && e.par ? "relevé par CMDR " + String(e.par).toUpperCase() : "relevé EDSM";
        var quand = ilYa(Number(e.detecte)), typeFr = o.type_ordre === "ELECTION" ? "ÉLECTION" : String(o.type_ordre || ""), dir = "directive : " + typeFr + " #" + Number(o.id);
        if (e.evenement === "DEBUT") {
            var encours = e.source === "EN_COURS";
            if (encours) src = "d’après le dernier relevé";
            return { e: e, guerre: guerre, cls: guerre ? "war" : "vote", ico: ico, tampon: "",
                titre: encours ? (guerre ? "GUERRE EN COURS" : "ÉLECTION EN COURS") : (guerre ? "GUERRE COMMENCÉE" : "ÉLECTION COMMENCÉE"),
                effets: guerre ? "" : BULLETINS.map(function (b) { return "<span class=\"bul\" style=\"left:" + b[0] + ";animation-delay:" + b[1] + "\"></span>"; }).join(""),
                bulle: [encours ? nom + " DÉJÀ EN COURS" : nom + " DÉTECTÉE", encours ? "conflit déjà en cours (" + src + ")" : quand + " (" + src + ")", dir] };
        }
        var pour = e.pour, contre = e.contre, score = pour != null && contre != null ? Number(pour) + " – " + Number(contre) : "";
        var adv = e.adversaire ? "contre " + String(e.adversaire).toUpperCase() : "";
        var cible = o.type_ordre === "BAISSE";       // faction VISEE par une baisse : sa victoire ou sa defaite n'est pas « la notre »
        var gagnee = e.resultat === "GAGNEE", perdue = e.resultat === "PERDUE", r = { e: e, guerre: guerre, ico: ico, effets: "", tampon: "" };
        var lignes = [adv ? nom + " TERMINÉE " + adv : nom + " TERMINÉE"];
        if (cible) { r.titre = nom + " TERMINÉE"; r.cls = "lose"; r.tampon = gagnee ? "VISÉE : GAGNÉE" : perdue ? "VISÉE : PERDUE" : (score || "NON CONFIRMÉ"); lignes.push("la faction visée " + (gagnee ? "l’a remportée" : perdue ? "l’a perdue" : "— résultat non confirmé")); }
        else if (gagnee) { r.titre = nom + " GAGNÉE"; r.cls = "win"; r.ico = "🏆"; r.tampon = "VICTOIRE" + (score ? " · " + score : ""); r.effets = CONFETTIS.map(function (c) { return "<span class=\"cf\" style=\"left:" + c[0] + ";background:" + c[1] + ";animation-delay:" + c[2] + "\"></span>"; }).join(""); lignes.push("d’après le dernier score relevé"); }
        else if (perdue) { r.titre = nom + " PERDUE"; r.cls = "lose perdue"; r.tampon = "DÉFAITE" + (score ? " · " + score : ""); lignes.push("d’après le dernier score relevé"); }
        else { r.titre = nom + " TERMINÉE"; r.cls = "lose"; r.tampon = score || "NON CONFIRMÉ"; lignes.push("résultat non confirmé" + (score ? " : dernier score relevé " + score : " : aucun score relevé")); }
        lignes.push(quand + " (" + src + ")", dir);
        r.bulle = lignes;
        return r;
    }
    // la bande seule (chaine vide sans evenement). opts : { commande : bool (bouton), mobile : bool, compact : bool }
    function bandeau(o, opts) {
        var s = etat(o); if (!s) return ""; opts = opts || {}; css();
        var cls = "cvb " + s.cls + (opts.mobile || opts.compact ? " m" : "");
        var passer = s.e.evenement === "DEBUT" && o.type_ordre !== (s.guerre ? "GUERRE" : "ELECTION");
        var cta = opts.commande && passer && !opts.mobile ? "<button type=\"button\" class=\"cta\" onclick=\"event.stopPropagation(); EdteamConflitEvt.passer(" + Number(o.id) + ",'" + (s.guerre ? "GUERRE" : "ELECTION") + "')\">PASSER EN " + (s.guerre ? "GUERRE" : "ÉLECTION") + "</button>" : "";
        var tip = s.bulle.join("\n"), couleur = { war: "#FF7100", vote: "#00F0FF", win: "#FFD24A" }[s.cls] || "#8794a3";
        // PC : bulle holographique du site (data-tip, branchee par campagnes.js) ; mobile : pas de survol, attribut title
        var attr = opts.mobile ? " title=\"" + esc(tip) + "\"" : " data-tip=\"" + esc(tip) + "\" data-tc=\"" + couleur + "\"";
        return "<div class=\"" + cls + "\"" + attr + ">" + s.effets + "<span class=\"ico\">" + s.ico + "</span><span class=\"t\">" + s.titre + "</span>"
            + (s.tampon ? "<span class=\"tp\">" + esc(s.tampon) + "</span>" : "") + cta + "<span class=\"fn\">24 h</span></div>";
    }
    // bande + ligne de la directive dans un seul bloc ; sans evenement, la ligne telle quelle
    function envelopper(o, ligneHtml, opts) {
        var s = etat(o); if (!s) return ligneHtml;
        css();
        return "<div class=\"cvb-bloc " + s.cls + "\">" + bandeau(o, opts) + ligneHtml + "</div>";
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

    window.EdteamConflitEvt = { charger: charger, bandeau: bandeau, envelopper: envelopper, evenement: evenement, passer: passer, css: css };
})();
