// CARTE GALACTIQUE DES CAMPAGNES (page BGS, 3e vue a cote de « Lignes » et « Cartes ») : les systemes des MISSIONS ACTIVES, regroupes par campagne.
// Regles : missions actives seulement ; AUCUNE position de pilote ; positions des systemes = fonction serveur carte_coords (script SQL 114 : colonisation ou EDSM, une seule fois par systeme) puis memoire du navigateur
// (les coordonnees ne changent jamais : un systeme deja connu ne redemande rien au serveur). Vue de dessus (x, z ; le haut = vers le centre galactique) ou de cote (x, y).
// Trois lectures : RESULTAT (vert / rouge / bleu du dernier tick), PARTICIPATION (pilotes ayant agi depuis le dernier tick : on voit ou l'effort se concentre et ou il manque), PRIORITE (celle de la campagne).
// Filtre « A RENFORCER » : resultat rouge ET au plus un pilote ayant agi depuis le dernier tick (les autres systemes s'estompent). Filtres par domaine. « DISTANCE DEPUIS MOI » : propre position du pilote, lue dans SA ligne privee
// session_live (jamais celle d'un autre pilote).
// Clic sur un systeme : fiche complete dans le panneau de droite (carte-fiche.js). Donnees fournies par campagnes.js : { campagnes: [{ id, nom, type, couleur, prio, lignes: [{ sys, domaine, id, tag, res ('up' | 'dn' | 'fl'), clic }] }] }.
(function () {
    "use strict";
    if (window.EdteamCarteCampagnes) return;
    const E = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const COUL = { up: "#2fe07a", dn: "#ff4d4d", fl: "#4DA3FF" }, PRIO = { 1: ["CRITIQUE", "#ff4d4d"], 2: ["HAUTE", "#ffb000"], 3: ["NORMALE", "#6f8196"] };
    const CLE = "edteam_coords_v1", W = 960, PAD = 70, LIM_CADRE = 120;
    let H = 600;      // hauteur de la carte (unites du dessin) : suit la hauteur reelle du cadre, voir ajuster()
    const RES = { up: "#2fe07a", dn: "#ff4d4d", fl: "#4DA3FF" }, RES_LIB = { up: "dans le sens voulu", dn: "à contre-sens", fl: "inchangé / pas mesuré" };
    const etat = { vue: "dessus", zoom: 1, cx: null, cy: null, hors: new Set(), doms: new Set(), choisi: null, mode: "resultat", renforcer: false, dist: false, ctxOn: true, ctx: null, fac: "", pw: "", enn: null, ennPw: "", ennMaj: "", rayon: 15, lv: {}, al: { 1: true, 2: true, 3: true }, maPos: null, off: null };
    let jeton = 0;

    function lireCache() { try { const v = JSON.parse(localStorage.getItem(CLE) || "{}"); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; } }
    function ecrireCache(c) { try { localStorage.setItem(CLE, JSON.stringify(c)); } catch (e) { /* stockage indisponible : les positions seront redemandees */ } }

    function css() {
        if (document.getElementById("cc-css")) return; const s = document.createElement("style"); s.id = "cc-css";
        s.textContent = [
            ".cc { display:grid; grid-template-columns:minmax(0,1fr) 450px; gap:14px; color:#cfd8dc; }",
            "@media (max-width:1250px) { .cc { grid-template-columns:1fr; } }",
            ".cc-carte { position:relative; min-width:0; display:flex; flex-direction:column; } .cc-svg { width:100%; height:0; flex:1 1 0; min-height:480px; display:block; background:radial-gradient(ellipse at 50% 45%, #0b1722 0%, #05080c 70%); border:1px solid #16303d; cursor:grab; user-select:none; } .cc-svg.glisse { cursor:grabbing; }",
            ".cc-svg text { font-family:'Share Tech Mono', monospace; }",
            ".cc-bar { display:flex; gap:8px; align-items:center; margin-bottom:8px; flex-wrap:wrap; font-size:.72em; color:#889; letter-spacing:1px; } .cc-bar .sp { flex:1; } .cc-bar .lib { color:#667; letter-spacing:2px; margin:0 2px 0 8px; }",
            ".cc-bt { background:transparent; border:1px solid #3a4a55; color:#9ab; padding:5px 14px; font-family:inherit; font-size:1em; letter-spacing:2px; cursor:pointer; } .cc-bt:hover { color:#fff; } .cc-bt.on { border-color:#00F0FF; color:#00F0FF; background:rgba(0,240,255,.16); box-shadow:0 0 12px rgba(0,240,255,.3); }",
            ".cc-bar { flex-wrap:nowrap; overflow:visible; } .cc-bar .cc-bt { padding:5px 9px; letter-spacing:1px; white-space:nowrap; font-size:.95em; } @media (max-width:1500px) { .cc-bar { flex-wrap:wrap; } } .cc-msg { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; }",
            ".cc-sel { background:#0a0f14; color:#9ab; border:1px solid #3a4a55; font-family:inherit; font-size:1em; padding:5px 6px; letter-spacing:1px; max-width:190px; } .cc-sel:focus { outline:none; border-color:#00F0FF; }",
            ".cc-dom { position:relative; } .cc-dom summary { list-style:none; cursor:pointer; border:1px solid #3a4a55; color:#9ab; padding:5px 9px; letter-spacing:1px; white-space:nowrap; } .cc-dom summary::-webkit-details-marker { display:none; } .cc-dom summary::after { content:' ▾'; } .cc-dom[open] summary { border-color:#00F0FF; color:#00F0FF; }",
            ".cc-dom-l { position:absolute; z-index:20; top:100%; left:0; background:#0a0f14; border:1px solid #00F0FF; padding:6px 10px; display:flex; flex-direction:column; gap:6px; min-width:210px; } .cc-dl-t { color:#667; letter-spacing:2px; font-size:.85em; margin-top:2px; } .cc-dom-l label { cursor:pointer; color:#cfd8dc; white-space:nowrap; }",
            ".cc-bt.ren.on { border-color:#ff4d4d; color:#ff8a8a; background:rgba(255,77,77,.16); box-shadow:0 0 12px rgba(255,77,77,.3); } .cc-bt.pt { padding:5px 10px; }",
            ".cc-lat { display:flex; flex-direction:column; gap:12px; min-width:0; }",
            ".cc-tipw { width:330px; white-space:normal; } .cc-tipw .camp-cd { margin-top:8px; pointer-events:none; } .cc-tipw .camp-ics, .cc-tipw .cd-nm { display:none; } .cc-tipw .cd-info { margin-top:12px; }",
            "#cc-choix { position:fixed; inset:0; z-index:9000; background:rgba(0,0,0,.55); display:flex; align-items:center; justify-content:center; } .cc-ch { width:min(460px,92vw); background:#080b10; border:1px solid #00F0FF; box-shadow:0 0 30px rgba(0,240,255,.25); padding:14px; display:flex; flex-direction:column; gap:8px; font-family:inherit; }",
            ".cc-ch-t { display:flex; align-items:baseline; gap:10px; margin-bottom:4px; } .cc-ch-t b { letter-spacing:2px; font-size:1.15em; } .cc-ch-t span { color:#889; font-size:.8em; flex:1; } .cc-ch-x { background:transparent; border:0; color:#889; cursor:pointer; font-size:1.1em; }",
            ".cc-ch-m { display:flex; align-items:center; gap:12px; text-align:left; cursor:pointer; font-family:inherit; color:#fff; padding:10px 12px; border:1px solid color-mix(in srgb, var(--k) 55%, transparent); border-left:4px solid var(--k); background:linear-gradient(90deg, color-mix(in srgb, var(--k) 15%, #0a0c10), #0a0c10 75%); } .cc-ch-m:hover { box-shadow:0 0 14px color-mix(in srgb, var(--k) 40%, transparent); } .cc-ch-m .t { letter-spacing:1px; } .cc-ch-m .r { flex:1; color:var(--k); font-size:.78em; } .cc-ch-m .g { color:#00F0FF; font-size:.75em; letter-spacing:2px; }",
            ".cc-fiche { max-height:78vh; overflow-y:auto; padding-right:4px; } .cc-fiche::-webkit-scrollbar { width:6px; } .cc-fiche::-webkit-scrollbar-thumb { background:rgba(0,240,255,.4); border-radius:3px; }",
            ".cc-camp { display:flex; align-items:center; gap:9px; padding:5px 4px; cursor:pointer; font-size:.82em; border-bottom:1px solid rgba(255,255,255,.05); } .cc-camp:last-child { border:0; } .cc-camp.off { opacity:.35; } .cc-camp i { width:11px; height:11px; border-radius:50%; flex:none; }",
            ".cc-camp .n { margin-left:auto; color:#889; font-size:.85em; white-space:nowrap; } .cc-camp small { display:block; color:#889; font-size:.78em; }",
            ".cc-leg { font-size:.76em; color:#9ab; line-height:1.9; } .cc-leg i { display:inline-block; width:11px; height:11px; border-radius:50%; margin-right:7px; vertical-align:-1px; }",
            ".cc-fac { color:#9ab; font-size:.85em; letter-spacing:1px; }  .cc-fac b { color:#fff; font-size:1.8em; font-weight:normal; margin-right:6px; vertical-align:middle; } .cc-fac span { color:#00F0FF; } .cc-fl { margin-top:7px; font-size:.95em; color:#9ab; letter-spacing:0; } .cc-fl b { font-size:1.15em; margin-right:5px; } .cc-fl i { display:inline-block; width:9px; height:9px; border-radius:50%; margin-right:8px; } .cc-or { background:#FFD700; } .cc-cl { background:#7fb8d0; opacity:.7; } .cc-pw { background:transparent; border:1.5px solid #8A7CFF; border-radius:0 !important; transform:rotate(45deg) scale(.8); }",
            ".cc-tipb { min-width:260px; } .cc-tl { display:flex; align-items:center; gap:8px; margin-top:4px; } .cc-tl i { width:9px; height:9px; border-radius:50%; flex:none; } .cc-tl small { margin-left:auto; color:#889; font-size:.85em; }",
            ".cc-alm summary { border-color:#7a2a2a; color:#ff9a9a; } .cc-alm .cc-dom-l label { display:flex; align-items:center; gap:6px; } .cc-lg2 { margin-top:8px; color:#9ab; font-size:.92em; } .cc-lgt { display:inline-block; min-width:92px; color:#667; letter-spacing:2px; font-size:.78em; } .cc-aide { margin-top:12px; width:100%; background:rgba(0,240,255,.08); border:1px solid #00F0FF; color:#00F0FF; font-family:inherit; letter-spacing:2px; padding:8px 10px; cursor:pointer; } .cc-aide:hover { background:#00F0FF; color:#001418; } .cc-aide.haut { width:auto; margin:0 0 0 auto; padding:3px 12px; font-size:.8em; flex:none; } .cc-fx .rg { display:none; } .cc-fx .pt { opacity:.55; } .cc-pa { display:inline-block; width:9px; height:9px; border-radius:50%; margin-right:4px; } .cc-fl .cc-alr.or { background:#ff9a1f; } .cc-fl .cc-alr.pk { background:#ff4fd8; }",
            ".cc-rouge { border-color:#7a2a2a; color:#ff9a9a; } .cc-fl .cc-alr { display:inline-block; width:9px; height:9px; border-radius:50%; background:#ff2d2d; margin-right:8px; animation:ccBlink 1s ease-in-out infinite; } .cc-fl .cc-alr.ok { background:#2fe07a; animation:none; }",
            "@keyframes ccBlink { 0%,100% { opacity:1; } 50% { opacity:.22; } } @keyframes ccPulse { 0% { transform:scale(.7); opacity:.9; } 100% { transform:scale(2.8); opacity:0; } }",
            ".cc-al .pt { animation:ccBlink var(--d,1s) ease-in-out infinite; } .cc-al .rg { transform-box:fill-box; transform-origin:center; animation:ccPulse var(--d,1s) ease-out infinite; }",
            "@media (prefers-reduced-motion: reduce) { .cc-al .pt, .cc-al .rg, .cc-fl .cc-alr { animation:none; } }",
            ".cc-note { color:#778; font-size:.74em; line-height:1.5; margin-top:8px; }"
        ].join("\n");
        document.head.appendChild(s);
    }

    // coordonnees : memoire du navigateur, puis serveur pour ce qui manque (6 au plus par appel : on repete tant que ca avance)
    async function coordonnees(noms, jt) {
        const cache = lireCache(), manque = () => noms.filter(n => !cache[n]); let erreur = null, tours = 0, prec = -1;
        while (manque().length && tours < 6 && manque().length !== prec) {
            prec = manque().length; tours++;
            let r; try { r = await window.supabaseApp.rpc("carte_coords", { p_noms: manque().slice(0, 60) }); } catch (e) { r = { error: e }; }
            if (jt !== jeton) return null;
            if (!r || r.error || !r.data) { erreur = r && r.error ? (r.error.message || "erreur") : "indisponible"; break; }
            (r.data.coords || []).forEach(c => { cache[c.n] = [Number(c.x), Number(c.y), Number(c.z)]; });
            ecrireCache(cache);
            if (!(r.data.inconnus || []).length) break;
        }
        return { cache, erreur };
    }

    // decor : systemes controles par la faction de l'escadron (SQL 115) ; un appel par jour au plus et par navigateur, rien n'est bloquant (sans le script SQL, pas de decor)
    async function contexte() {
        if (etat.ctx) return etat.ctx;
        if (etat.ctxEchec && Date.now() - etat.ctxEchec < 600000) return [];
        const CK = "edteam_ctx_v1";
        try { const v = JSON.parse(localStorage.getItem(CK) || "null"); if (v && Array.isArray(v.s) && v.v === 2 && v.f && Date.now() - v.t < 24 * 3600 * 1000) { etat.ctx = v.s; etat.fac = v.f || ""; etat.pw = v.pw || ""; return etat.ctx; } } catch (e) { /* memoire indisponible */ }
        try {
            const r = await window.supabaseApp.rpc("carte_contexte");
            if (!r || r.error || !r.data || !Array.isArray(r.data.s)) { etat.ctxEchec = Date.now(); return []; }
            etat.ctx = r.data.s; etat.fac = r.data.faction || ""; etat.pw = r.data.puissance || ""; try { localStorage.setItem(CK, JSON.stringify({ v: 2, t: Date.now(), s: etat.ctx, f: etat.fac, pw: etat.pw })); } catch (e) { /* tant pis */ }
            return etat.ctx;
        } catch (e) { return []; }
    }

    // alarme : systemes des puissances ennemies proches de la faction (SQL 116) ; memoire du navigateur 24 h ; null si le script SQL n'est pas lance
    async function ennemis() {
        if (etat.enn) return etat.enn;
        if (etat.ennEchec && Date.now() - etat.ennEchec < 600000) return null;      // script SQL absent ou erreur : pas de nouvel essai avant 10 minutes
        const CK = "edteam_enn_v1";
        try { const v = JSON.parse(localStorage.getItem(CK) || "null"); if (v && v.v === 1 && Array.isArray(v.s) && Date.now() - v.t < 24 * 3600 * 1000) { etat.enn = v.s; etat.ennPw = v.pw || ""; etat.ennMaj = v.maj || ""; return etat.enn; } } catch (e) { /* memoire indisponible */ }
        try {
            const r = await window.supabaseApp.rpc("carte_ennemis");
            if (!r || r.error || !r.data || !Array.isArray(r.data.s)) { etat.ennEchec = Date.now(); return null; }
            etat.enn = r.data.s; etat.ennPw = r.data.puissance || ""; etat.ennMaj = r.data.maj || ""; try { localStorage.setItem(CK, JSON.stringify({ v: 1, t: Date.now(), s: etat.enn, pw: etat.ennPw, maj: etat.ennMaj })); } catch (e) { /* tant pis */ }
            return etat.enn;
        } catch (e) { etat.ennEchec = Date.now(); return null; }
    }
    // niveaux 2 (conquete Powerplay, SQL 117) et 3 (expansion de faction rivale, SQL 118) : meme principe, un niveau absent (script SQL non lance) est simplement ignore
    async function niveau(nom, rpc, ck) {
        const l = etat.lv[nom] = etat.lv[nom] || { s: null, maj: "", pw: "", echec: 0 };
        if (l.s) return l.s;
        if (l.echec && Date.now() - l.echec < 600000) return null;
        try { const v = JSON.parse(localStorage.getItem(ck) || "null"); if (v && v.v === 1 && Array.isArray(v.s) && Date.now() - v.t < 24 * 3600 * 1000) { l.s = v.s; l.maj = v.maj || ""; l.pw = v.pw || ""; return l.s; } } catch (e) { /* memoire indisponible */ }
        try {
            const r = await window.supabaseApp.rpc(rpc);
            if (!r || r.error || !r.data || !Array.isArray(r.data.s)) { l.echec = Date.now(); return null; }
            l.s = r.data.s; l.maj = r.data.maj || ""; l.pw = r.data.puissance || ""; try { localStorage.setItem(ck, JSON.stringify({ v: 1, t: Date.now(), s: l.s, pw: l.pw, maj: l.maj })); } catch (e) { /* tant pis */ }
            return l.s;
        } catch (e) { l.echec = Date.now(); return null; }
    }
    const lvS = n => (etat.lv[n] && etat.lv[n].s) || null;
    const ETATS_FR = { Stronghold: "Défendu", Fortified: "Consolidé", Exploited: "Exploité" };

    // ma position (SA ligne privee de session_live : jamais celle d'un autre pilote) ; null si le jeu n'a jamais envoye de session
    async function maPosition() {
        if (etat.maPos && Date.now() - etat.maPos.lu < 60000) return etat.maPos;
        try {
            const uid = (window.profilCommandant || {}).user_id; if (!uid || !window.supabaseApp) return null;
            const r = await window.supabaseApp.from("session_live").select("pos:etat->pos,systeme:etat->>systeme,maj_le").eq("user_id", uid).maybeSingle();
            const d = r && r.data; if (!d || !Array.isArray(d.pos) || d.pos.length !== 3) return null;
            etat.maPos = { pos: d.pos.map(Number), systeme: d.systeme || "", maj: d.maj_le || null, lu: Date.now() }; return etat.maPos;
        } catch (e) { return null; }
    }

    // mesures de participation d'une mission, d'apres ce que la page a deja en memoire
    const agiDe = m => { if (m.dom !== "BGS") return null; const q = (window.cacheQuotasBgs || {})[m.id]; return q && q.agi != null ? Number(q.agi) : null; };

    function monter(zone, donnees) {
        css(); const jt = ++jeton;
        const camps = (donnees.campagnes || []).filter(c => (c.lignes || []).some(l => l.sys));
        // systemes : une entree par nom, avec ses missions et sa campagne
        const S = {}; camps.forEach(c => c.lignes.forEach(l => { if (!l.sys) return; const s = S[l.sys] = S[l.sys] || { n: l.sys, k: c.id, m: [] }; s.m.push({ dom: l.domaine, id: l.id, tag: l.tag, res: l.res || "fl", clic: l.clic, carte: l.carte, k: c.id, prio: c.prio || 3 }); }));
        const noms = Object.keys(S);
        zone.innerHTML = "<div class=\"cc-note\" style=\"padding:30px 6px; text-align:center;\">Positions des systèmes en cours de récupération…</div>";
        if (!noms.length) { zone.innerHTML = "<div class=\"cc-note\" style=\"padding:30px 6px; text-align:center;\">Aucune mission active avec un système à placer sur la carte.</div>"; return; }
        Promise.all([coordonnees(noms, jt), contexte().catch(() => []), ennemis().catch(() => null), niveau("acq", "carte_acquisition", "edteam_acq_v1").catch(() => null), niveau("exp", "carte_expansion", "edteam_exp_v3").catch(() => null)]).then(([res]) => {
            if (!res || jt !== jeton || !zone.isConnected) return;
            const cache = res.cache; noms.forEach(n => { if (cache[n]) { S[n].x = cache[n][0]; S[n].y = cache[n][1]; S[n].z = cache[n][2]; } });
            const connus = noms.map(n => S[n]).filter(s => s.x != null), inconnus = noms.filter(n => S[n].x == null);
            if (!connus.length) { zone.innerHTML = "<div class=\"cc-note\" style=\"padding:30px 6px; text-align:center;\">Positions indisponibles" + (res.erreur ? " (" + E(res.erreur) + ")" : "") + ". Le script SQL 114 est-il lancé ?</div>"; return; }
            construire(zone, camps, S, connus, inconnus);
        });
    }

    // details du bloc « faction » : colonies de l'escadron, systemes colonises, systemes de la puissance defendue
    function detailsFac() {
        const c = etat.ctx || [], esc = c.filter(x => x[5] === 1).length, sous = etat.pw ? c.filter(x => x[6] === etat.pw).length : 0;
        return "<div class=\"cc-fl\"><i class=\"cc-or\"></i><b>" + esc + "</b> colonie" + (esc > 1 ? "s" : "") + " de membres de l’escadron</div>"
            + (etat.pw ? "<div class=\"cc-fl\"><i class=\"cc-pw\"></i><b>" + sous + "</b> système" + (sous > 1 ? "s" : "") + " sous <span style=\"color:#b6adff;\">" + E(etat.pw) + "</span>, la puissance défendue</div>" : "");
    }

    const nomCourtL = (t, n) => String(t).length > n ? String(t).slice(0, n - 1) + "…" : String(t);
    function construire(zone, camps, S, connus, inconnus) {
        const med = a => { const b = a.slice().sort((p, q) => p - q); return b[Math.floor(b.length / 2)]; };
        const mx = med(connus.map(s => s.x)), my = med(connus.map(s => s.y)), mz = med(connus.map(s => s.z));
        const distCentre = s => Math.hypot(s.x - mx, s.y - my, s.z - mz);
        const cadre = connus.filter(s => distCentre(s) < LIM_CADRE), hors = connus.filter(s => distCentre(s) >= LIM_CADRE);
        const par = camps.map(c => ({ c, n: new Set(c.lignes.map(l => l.sys).filter(n => S[n] && S[n].x != null)).size }));
        const bt = (v, txt, att, cls, titre) => "<button class=\"cc-bt " + (cls || "") + "\" " + att + "=\"" + v + "\"" + (titre ? " title=\"" + E(titre) + "\"" : "") + ">" + txt + "</button>";
        const optAller = "<option value=\"\">⤢ Aller à…</option><option value=\"tout\">Tout voir (cibles et faction)</option><option value=\"cibles\">Toutes les cibles</option>" + ((etat.enn && etat.enn.length) || lvS("acq") || lvS("exp") ? "<option value=\"ennemis\">⚠ Alarmes (systèmes concernés)</option>" : "") + ((etat.ctx || []).some(c => c[5] === 1) ? "<option value=\"colonies\">Colonies de l’escadron</option>" : "")
            + "<optgroup label=\"Campagnes\">" + par.filter(o => o.n).map(o => "<option value=\"c:" + E(o.c.id) + "\">" + E(nomCourtL(o.c.nom, 34)) + " (" + o.n + ")</option>").join("") + "</optgroup>"
            + "<optgroup label=\"Systèmes ciblés\">" + connus.map(x => x.n).sort().map(n => "<option value=\"s:" + E(n) + "\">" + E(n) + "</option>").join("") + "</optgroup>";
        zone.innerHTML = "<div class=\"cc\"><div class=\"cc-carte bloc holo\"><h2>CARTE GALACTIQUE <em>missions actives · molette : zoom · glisser : déplacer · double-clic : recentrer</em></h2><div class=\"cc-bar\" title=\"molette : zoom · glisser : déplacer · double-clic : recentrer\">" + bt("dessus", "DESSUS", "data-v") + bt("cote", "CÔTÉ", "data-v")
            + "<select class=\"cc-sel\" data-modesel title=\"Lecture des couleurs\"><option value=\"resultat\">Couleur : résultat</option><option value=\"participation\">Couleur : participation</option><option value=\"priorite\">Couleur : priorité</option></select>"
            + "<details class=\"cc-dom\"><summary>Afficher</summary><div class=\"cc-dom-l\"><div class=\"cc-dl-t\">MISSIONS</div><label><input type=\"checkbox\" data-d=\"BGS\"> BGS</label><label><input type=\"checkbox\" data-d=\"PP\"> Powerplay</label><label><input type=\"checkbox\" data-d=\"COL\"> Colonisation</label><div class=\"cc-dl-t\">SUR LA CARTE</div><label title=\"Montre en fondu (non cliquables) les systèmes contrôlés par la faction de l’escadron, pour situer les systèmes ciblés\"><input type=\"checkbox\" data-f=\"ctx\"> Systèmes de la faction</label><label title=\"Distance de ta position actuelle (visible de toi seul) à chaque système\"><input type=\"checkbox\" data-f=\"dist\"> Depuis ma position</label></div></details>"
            + bt("ren", "⚠ À RENFORCER", "data-f", "ren", "Résultat rouge et au plus un pilote ayant agi depuis le dernier tick : les autres systèmes s’estompent")
            + ((etat.enn || lvS("acq") || lvS("exp")) ? "<details class=\"cc-dom cc-alm\"><summary>⚠ Alarmes</summary><div class=\"cc-dom-l\"><div class=\"cc-dl-t\">NIVEAUX D’ALERTE</div>"
                + (etat.enn ? "<label title=\"Systèmes contrôlés par une puissance ennemie près de nos systèmes\"><input type=\"checkbox\" data-al=\"1\"> <i class=\"cc-pa\" style=\"background:#ff2d2d\"></i>Powerplay : puissance ennemie en place</label>" : "")
                + (lvS("acq") ? "<label title=\"Systèmes inoccupés où une puissance ennemie progresse (au moins 10 %)\"><input type=\"checkbox\" data-al=\"2\"> <i class=\"cc-pa\" style=\"background:#ff9a1f\"></i>Powerplay : conquête ennemie</label>" : "")
                + (lvS("exp") ? "<label title=\"Une faction rivale en Expansion à 20 al ou moins d’un de nos systèmes qui a une place libre\"><input type=\"checkbox\" data-al=\"3\"> <i class=\"cc-pa\" style=\"background:#ff4fd8\"></i>BGS : expansion d’une faction rivale</label>" : "")
                + "<div class=\"cc-dl-t\">DISTANCE (POWERPLAY)</div><select class=\"cc-sel\" data-rayon><option value=\"10\">≤ 10 al</option><option value=\"15\">≤ 15 al</option><option value=\"25\">≤ 25 al</option></select></div></details>" : "")
            + "<select class=\"cc-sel\" data-aller title=\"Recadre la carte\">" + optAller + "</select>"  + "<span class=\"cc-msg\" style=\"color:#ffb000;\"></span></div>"
            + "<svg class=\"cc-svg\" viewBox=\"0 0 " + W + " " + H + "\"></svg>"
            + (inconnus.length ? "<div class=\"cc-note\">Position inconnue (système absent d'EDSM ou pas encore récupéré) : " + inconnus.map(n => "<span style=\"color:#9ab;\">" + E(n) + "</span>").join(" · ") + "</div>" : "") + "</div>"
            + "<div class=\"cc-lat\">"
            + (etat.ctx && etat.ctx.length ? "<div class=\"bloc cy cc-fac\"><h2>FACTION DE L’ESCADRON</h2><b>" + etat.ctx.length + "</b> système" + (etat.ctx.length > 1 ? "s" : "") + " contrôlé" + (etat.ctx.length > 1 ? "s" : "") + " par <span>" + E(String(etat.fac || "la faction").toUpperCase()) + "</span>" + detailsFac() + "<div class=\"cc-fl cc-enn\" style=\"display:none\"></div><div class=\"cc-fl cc-acq\" style=\"display:none\"></div><div class=\"cc-fl cc-exp\" style=\"display:none\"></div></div>" : "")
            + "<div class=\"bloc\"><h2>CAMPAGNES</h2><div class=\"cc-camps\"></div></div><div class=\"bloc\"><h2>LÉGENDE</h2><div class=\"cc-leg\"></div><div class=\"cc-note\">Missions actives seulement. Aucune position de pilote.</div></div></div></div>";
        const svg = zone.querySelector(".cc-svg"), el = zone.querySelector(".cc-camps"), leg = zone.querySelector(".cc-leg"), msg = zone.querySelector(".cc-msg");
        // la carte prend toute la hauteur du cadre : la hauteur du dessin suit celle de l'element (meme proportions, rien n'est deforme)
        function ajuster() {
            const b = svg.getBoundingClientRect(); if (b.width < 50 || b.height < 50) return false;
            const h = Math.max(300, Math.min(1600, Math.round(W * b.height / b.width)));
            if (h === H && svg.getAttribute("viewBox") === "0 0 " + W + " " + H) return false;
            H = h; svg.setAttribute("viewBox", "0 0 " + W + " " + H); return true;
        }
        const ax = s => etat.vue === "dessus" ? [s.x, s.z] : [s.x, s.y];
        const camp = id => camps.find(c => c.id === id) || { couleur: "#8a949c", nom: "?", type: "" };
        const mVis = s => s.m.filter(x => !etat.hors.has(x.k) && !etat.doms.has(x.dom));
        const pire = s => { const v = mVis(s); return v.some(x => x.res === "dn") ? "dn" : (v.some(x => x.res === "fl") ? "fl" : "up"); };
        const totalAgi = s => { let n = 0, connu = false; mVis(s).forEach(x => { const a = agiDe(x); if (a != null) { n += a; connu = true; } }); return connu ? n : null; };
        const prioDe = s => Math.min.apply(null, mVis(s).map(x => x.prio || 3));
        const aRenforcer = s => mVis(s).some(x => { if (x.res !== "dn") return false; const a = agiDe(x); return a == null || a <= 1; });
        const distA = s => etat.dist && etat.maPos ? Math.hypot(s.x - etat.maPos.pos[0], s.y - etat.maPos.pos[1], s.z - etat.maPos.pos[2]) : null;

        const projection = () => {
            const base = cadre.length ? cadre : connus, a = base.map(ax), xs = a.map(p => p[0]), ys = a.map(p => p[1]);
            const x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
            const e0 = Math.min(40, Math.min((W - 2 * PAD - 120) / Math.max(x1 - x0, 1), (H - 2 * PAD) / Math.max(y1 - y0, 1)));
            const cx = etat.cx != null ? etat.cx : (x0 + x1) / 2, cy = etat.cy != null ? etat.cy : (y0 + y1) / 2, e = e0 * etat.zoom;
            return { e, cx, cy, X0: W / 2, Y0: H / 2, e0 };
        };
        // cadrage sur une liste de points (coordonnees de la vue) ; ePlaf = echelle maximale (evite un zoom excessif sur un seul point)
        const cadrer = (pts, ePlaf) => {
            const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]), x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys), P = projection();
            const e = Math.min((W - 2 * PAD - 120) / Math.max(x1 - x0, 1), (H - 2 * PAD) / Math.max(y1 - y0, 1), ePlaf || 1e9);
            return { z: Math.max(0.002, Math.min(60, e / P.e0)), cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
        };
        // cadrage sur l'ensemble : cibles, et decor de la faction s'il est affiche
        const ensemble = () => { const pts = connus.map(ax); if (etat.ctxOn && etat.ctx) etat.ctx.forEach(c => pts.push(ax({ x: c[1], y: c[2], z: c[3] }))); if (etat.al[1] && etat.enn) etat.enn.forEach(c => { if (c[6] <= etat.rayon) pts.push(ax({ x: c[1], y: c[2], z: c[3] })); }); if (etat.al[2] && lvS("acq")) lvS("acq").forEach(c => { if (c[7] <= etat.rayon) pts.push(ax({ x: c[1], y: c[2], z: c[3] })); }); if (etat.al[3] && lvS("exp")) lvS("exp").forEach(c => { pts.push(ax({ x: c[1], y: c[2], z: c[3] })); pts.push(ax({ x: c[6], y: c[7], z: c[8] })); }); return cadrer(pts); };
        // aspect d'une liste de systemes (un point ou une bulle) selon la lecture choisie
        function aspectL(list, bulle) {
            const mvs = [].concat.apply([], list.map(s => mVis(s)));
            if (etat.mode === "participation") { let n = 0, connu = false; list.forEach(s => { const a = totalAgi(s); if (a != null) { n += a; connu = true; } }); return !connu ? { f: "#5a6a76", t: bulle ? String(list.length) : "–" } : { f: n === 0 ? "#16222c" : (n <= 2 ? "#5aa9c9" : "#9be8ff"), t: bulle ? String(list.length) : String(n), vide: n === 0 }; }
            if (etat.mode === "priorite") { const p = Math.min.apply(null, mvs.map(x => x.prio || 3)); return { f: PRIO[p][1], t: bulle ? String(list.length) : String(p) }; }
            const f = mvs.some(x => x.res === "dn") ? "dn" : (mvs.some(x => x.res === "fl") ? "fl" : "up");
            return { f: COUL[f], t: bulle ? String(list.length) : (mvs.length > 1 ? String(mvs.length) : "") };
        }
        const aspect = s => aspectL([s], false);
        const rangRes = s => { const v = mVis(s); return v.some(x => x.res === "dn") ? 0 : (v.some(x => x.res === "fl") ? 1 : 2); };
        const nomCourt = (t, n) => t.length > n ? t.slice(0, n - 1) + "…" : t;
        let drag = null, bouge = false, dernierPos = [], tipCle = null, bulles = [], decorPos = [], alarmes = [], survol = null;
        function masquerBulle() { survol = null; if (tipCle !== null) { tipCle = null; if (typeof window.hideHoloTooltip === "function") window.hideHoloTooltip(); } }
        // seuil d'echelle (unites de la carte par annee-lumiere) a partir duquel les cibles ne sont plus regroupees
        const E_DETAIL = 3;

        function dessiner() {
            masquerBulle(); decorPos = []; alarmes = [];
            const P = projection(), p = s => { const a = ax(s); return [P.X0 + (a[0] - P.cx) * P.e, P.Y0 - (a[1] - P.cy) * P.e]; };
            const dedans = q => q[0] > -20 && q[0] < W + 20 && q[1] > -20 && q[1] < H + 20;
            let h = "";
            const pas = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000].find(v => v * P.e >= 70) || 5000;
            for (let k = Math.floor((P.cx - W / 2 / P.e) / pas); k <= Math.ceil((P.cx + W / 2 / P.e) / pas); k++) { const gx = P.X0 + (k * pas - P.cx) * P.e; h += "<line x1=\"" + gx + "\" y1=\"0\" x2=\"" + gx + "\" y2=\"" + H + "\" stroke=\"#0f2330\"/>"; }
            for (let k = Math.floor((P.cy - H / 2 / P.e) / pas); k <= Math.ceil((P.cy + H / 2 / P.e) / pas); k++) { const gy = P.Y0 - (k * pas - P.cy) * P.e; h += "<line x1=\"0\" y1=\"" + gy + "\" x2=\"" + W + "\" y2=\"" + gy + "\" stroke=\"#0f2330\"/>"; }
            // decor : systemes de la faction (estompes, non cliquables : ni classe .cc-n, ni evenements) ; a petite echelle, regroupes par case avec un compteur
            if (etat.ctxOn && etat.ctx && etat.ctx.length) {
                const deja = new Set(Object.keys(S).map(n => n.toUpperCase())), vis = [];
                etat.ctx.forEach(c => { if (deja.has(c[0])) return; const q = p({ x: c[1], y: c[2], z: c[3] }); if (dedans(q)) vis.push({ n: c[0], q, esc: c[5] === 1, pw: !!etat.pw && c[6] === etat.pw }); });
                if (P.e < 1.2 || vis.length > 140) {
                    const cases = {}; vis.forEach(v => { const k = Math.floor(v.q[0] / 26) + "_" + Math.floor(v.q[1] / 26), c = cases[k] = cases[k] || { x: 0, y: 0, n: 0, esc: 0, pw: 0 }; c.x += v.q[0]; c.y += v.q[1]; c.n++; if (v.esc) c.esc++; if (v.pw) c.pw++; });
                    h += "<g style=\"pointer-events:none\" font-size=\"8.5\">" + Object.keys(cases).map(k => { const c = cases[k], x = c.x / c.n, y = c.y / c.n, r = 2.5 + 1.4 * Math.sqrt(c.n); let o = "<circle cx=\"" + x.toFixed(1) + "\" cy=\"" + y.toFixed(1) + "\" r=\"" + r.toFixed(1) + "\" fill=\"#7fb8d0\" opacity=\".2\"/>";
                        if (c.n > 1) o += "<text x=\"" + x.toFixed(1) + "\" y=\"" + (y + 3).toFixed(1) + "\" text-anchor=\"middle\" fill=\"#9ab\" opacity=\".5\">" + c.n + "</text>";
                        if (c.esc) o += "<circle cx=\"" + (x + r + 5).toFixed(1) + "\" cy=\"" + (y - 3).toFixed(1) + "\" r=\"3.2\" fill=\"#FFD700\" opacity=\".7\"/><text x=\"" + (x + r + 10).toFixed(1) + "\" y=\"" + y.toFixed(1) + "\" fill=\"#FFD700\" opacity=\".7\">" + c.esc + "</text>";
                        if (c.pw) o += "<path d=\"M" + (x + r + 5).toFixed(1) + " " + (y + 5).toFixed(1) + " l4 5 l-4 5 l-4 -5z\" fill=\"none\" stroke=\"#8A7CFF\" stroke-width=\"1.2\" opacity=\".8\"/><text x=\"" + (x + r + 11).toFixed(1) + "\" y=\"" + (y + 14).toFixed(1) + "\" fill=\"#b6adff\" opacity=\".8\">" + c.pw + "</text>";
                        return o; }).join("") + "</g>";
                } else {
                    decorPos = vis.map(v => ({ kind: "d", n: v.n, x: v.q[0], y: v.q[1], r: 6, esc: v.esc, pw: v.pw }));
                    vis.sort((u, v) => u.esc - v.esc);
                    h += "<g style=\"pointer-events:none\">" + vis.map(v => { const x = v.q[0].toFixed(1), y = v.q[1].toFixed(1), c = v.esc ? "#FFD700" : "#7fb8d0", r = v.esc ? 3.2 : 2.2, o = v.esc ? .6 : .22;
                        return "<circle cx=\"" + x + "\" cy=\"" + y + "\" r=\"" + r + "\" fill=\"" + c + "\" opacity=\"" + o + "\"/>" + (v.pw ? "<path d=\"M" + x + " " + (v.q[1] - 8).toFixed(1) + " l7 8 l-7 8 l-7 -8z\" fill=\"none\" stroke=\"#8A7CFF\" stroke-width=\"1.4\" opacity=\".75\"/>" : ""); }).join("")
                        + (vis.length <= 90 ? vis.map(v => "<text x=\"" + (v.q[0] + 9).toFixed(1) + "\" y=\"" + (v.q[1] + 3).toFixed(1) + "\" font-size=\"9\" letter-spacing=\".5\" fill=\"" + (v.esc ? "#FFD700" : v.pw ? "#b6adff" : "#7fb8d0") + "\" opacity=\"" + (v.esc || v.pw ? .45 : .28) + "\">" + E(v.n) + "</text>").join("") : "") + "</g>";
                }
            }
            // niveaux 2 et 3 de l'alarme : conquete Powerplay (orange) et expansion d'une faction rivale vers un de nos systemes a place libre (rose)
            const alarmeGen = (ev, col, kind, vit, op, ligne, urg) => {
                urg = urg || (() => true);
                let o = "";
                if (P.e < 1.2 && ev.length > 6) {
                    const cases = {}; ev.forEach(v => { const k = Math.floor(v.x / 30) + "_" + Math.floor(v.y / 30), c = cases[k] = cases[k] || { kind: "c", niv: kind, col, x: 0, y: 0, mem: [], nv: 0, d: 1e9 }; c.x += v.x; c.y += v.y; c.mem.push(v); if (v.nv) c.nv++; c.d = Math.min(c.d, v.d); });
                    Object.keys(cases).forEach(k => { const c = cases[k]; c.x /= c.mem.length; c.y /= c.mem.length; c.n = c.mem.length; c.r = 8 + 1.8 * Math.sqrt(c.n); alarmes.push(c);
                        o += "<g class=\"" + (c.mem.some(urg) ? "cc-al" : "cc-fx") + "\" style=\"--d:" + (c.nv ? .5 : 1) + "s; pointer-events:none\"><circle class=\"rg\" cx=\"" + c.x.toFixed(1) + "\" cy=\"" + c.y.toFixed(1) + "\" r=\"" + c.r.toFixed(1) + "\" fill=\"none\" stroke=\"" + col + "\" stroke-width=\"1.6\"/><circle class=\"pt\" cx=\"" + c.x.toFixed(1) + "\" cy=\"" + c.y.toFixed(1) + "\" r=\"" + c.r.toFixed(1) + "\" fill=\"" + col + "\" stroke=\"#fff\" stroke-width=\".8\"/><text x=\"" + c.x.toFixed(1) + "\" y=\"" + (c.y + 4).toFixed(1) + "\" text-anchor=\"middle\" font-size=\"11\" font-weight=\"bold\" fill=\"#04070a\">" + c.n + "</text></g>"; });
                    return o;
                }
                if (ligne) ev.filter(urg).forEach(v => { o += "<g style=\"pointer-events:none\"><line x1=\"" + v.ox.toFixed(1) + "\" y1=\"" + v.oy.toFixed(1) + "\" x2=\"" + v.x.toFixed(1) + "\" y2=\"" + v.y.toFixed(1) + "\" stroke=\"" + col + "\" stroke-width=\"1.4\" stroke-dasharray=\"4 4\" opacity=\".75\"/><path d=\"M" + v.ox.toFixed(1) + " " + (v.oy - 6).toFixed(1) + " l5 9 h-10 z\" fill=\"" + col + "\" opacity=\".9\"/></g>"; });
                ev.forEach(v => { alarmes.push(Object.assign({ kind, col, r: kind === "x" ? 16 : 8 }, v)); const x = v.x.toFixed(1), y = v.y.toFixed(1);
                    o += "<g class=\"" + (urg(v) ? "cc-al" : "cc-fx") + "\" style=\"--d:" + vit(v) + "s; pointer-events:none; opacity:" + op(v) + "\">";
                    if (kind === "x") o += "<circle cx=\"" + x + "\" cy=\"" + y + "\" r=\"16\" fill=\"none\" stroke=\"" + col + "\" stroke-width=\"2\" stroke-dasharray=\"6 3\" opacity=\".9\"/><circle class=\"rg\" cx=\"" + x + "\" cy=\"" + y + "\" r=\"16\" fill=\"none\" stroke=\"" + col + "\" stroke-width=\"1.6\"/>";
                    else o += "<circle class=\"rg\" cx=\"" + x + "\" cy=\"" + y + "\" r=\"6\" fill=\"none\" stroke=\"" + col + "\" stroke-width=\"1.6\"/>" + (v.nv ? "<circle cx=\"" + x + "\" cy=\"" + y + "\" r=\"11\" fill=\"none\" stroke=\"" + col + "\" stroke-dasharray=\"3 3\" opacity=\".8\"/>" : "") + "<circle class=\"pt\" cx=\"" + x + "\" cy=\"" + y + "\" r=\"" + (v.nv ? 5.5 : 4.2) + "\" fill=\"" + col + "\" stroke=\"#fff\" stroke-width=\".8\"/>";
                    o += "</g>"; });
                if (ev.filter(urg).length <= 40) o += "<g style=\"pointer-events:none\" font-size=\"9.5\" fill=\"" + col + "\">" + ev.filter(urg).map(v => "<text x=\"" + (v.x + (kind === "x" ? 20 : 10)).toFixed(1) + "\" y=\"" + (v.y + 3).toFixed(1) + "\" opacity=\".9\">" + E(v.n) + (kind === "a" ? " · " + Math.round(v.pg * 100) + " % " + E(v.pu) : kind === "e" ? "" : " ← " + E(v.fa)) + (v.nv ? " · NOUVEAU" : "") + "</text>").join("") + "</g>";
                return o;
            };
            if (etat.al[1] && etat.rayon > 0 && etat.enn && etat.enn.length) {
                const ev = []; etat.enn.forEach(c => { if (c[6] > etat.rayon) return; const q = p({ x: c[1], y: c[2], z: c[3] }); if (dedans(q)) ev.push({ n: c[0], x: q[0], y: q[1], pu: c[4], et: c[5], d: c[6], pr: c[7], nv: c[8] === 1 }); });
                h += alarmeGen(ev, "#ff2d2d", "e", v => v.nv ? .5 : 1, () => 1, false, v => v.nv);      // contexte : fixe, sauf un systeme venu d'etre pris par l'ennemi
            }
            if (etat.al[2] && lvS("acq")) {
                const ev = []; lvS("acq").forEach(c => { if (c[7] > etat.rayon) return; const q = p({ x: c[1], y: c[2], z: c[3] }); if (dedans(q)) ev.push({ n: c[0], x: q[0], y: q[1], pu: c[4], pg: c[5], an: c[6], d: c[7], pr: c[8], nv: c[9] === 1 }); });
                h += alarmeGen(ev, "#ff9a1f", "a", v => v.nv ? .5 : (v.pg >= 0.3 ? .7 : 1.4), v => v.an === 0 ? .5 : 1, false, v => v.nv || (v.pg >= 0.3 && v.an !== 0));      // clignote : au moins 30 % et une ancre en portee (ou nouveau)
            }
            if (etat.al[3] && lvS("exp")) {
                const ev = []; lvS("exp").forEach(c => { const q = p({ x: c[1], y: c[2], z: c[3] }), o = p({ x: c[6], y: c[7], z: c[8] }); if (dedans(q) || dedans(o)) ev.push({ n: c[0], x: q[0], y: q[1], nb: c[4], on: c[5], ox: o[0], oy: o[1], fa: c[9], al: c[10], d: c[11], nv: c[12] === 1, st: c[13] !== 0 }); });
                h += alarmeGen(ev, "#ff4fd8", "x", v => v.nv ? .5 : 1.1, v => v.st ? 1 : .5, true, v => v.st);      // la cible que le jeu choisirait : toujours une vraie menace
            }
            // cibles : tous les systemes ayant une mission visible ; ceux qui sont hors de l'ecran ET loin du groupe vont dans la liste « hors cadre »
            const tous = connus.filter(s => mVis(s).length).map(s => { const q = p(s); return { s, x: q[0], y: q[1], r: 8 + 2.2 * mVis(s).length }; });
            const visibles = tous.filter(o => dedans([o.x, o.y])), exterieurs = tous.filter(o => !dedans([o.x, o.y]) && distCentre(o.s) >= LIM_CADRE).map(o => o.s);
            // regroupement par proximite d'ecran quand l'echelle est petite : une bulle (nombre de systemes) au lieu d'un tas de points et de noms
            const groupes = [], pris = new Set(), ordre = visibles.slice().sort((a, b) => rangRes(a.s) - rangRes(b.s) || a.s.n.localeCompare(b.s.n));
            ordre.forEach(o => { if (pris.has(o)) return; const g = [o]; pris.add(o);
                if (P.e < E_DETAIL) ordre.forEach(o2 => { if (!pris.has(o2) && Math.hypot(o2.x - o.x, o2.y - o.y) < 24) { g.push(o2); pris.add(o2); } });
                groupes.push(g); });
            bulles = []; const feuilles = [];
            groupes.forEach(g => { if (g.length === 1) { feuilles.push(g[0]); return; }
                const ks = new Set(); g.forEach(o => mVis(o.s).forEach(x => ks.add(x.k)));
                bulles.push({ id: bulles.length, mem: g.map(o => o.s), x: g.reduce((a, o) => a + o.x, 0) / g.length, y: g.reduce((a, o) => a + o.y, 0) / g.length, r: 11 + 3 * Math.sqrt(g.length), ks: Array.from(ks) }); });
            // halos de campagne et liens (seulement a grande echelle, entre les points isoles)
            if (P.e >= E_DETAIL) camps.forEach(c => { if (etat.hors.has(c.id)) return; const m = feuilles.map(o => o.s).filter(s => mVis(s).some(x => x.k === c.id)); if (!m.length) return;
                h += "<g opacity=\".16\" fill=\"" + c.couleur + "\">" + m.map(s => { const q = p(s); return "<circle cx=\"" + q[0] + "\" cy=\"" + q[1] + "\" r=\"" + Math.max(18, 2.7 * P.e) + "\"/>"; }).join("") + "</g>";
                h += "<g opacity=\".5\" fill=\"none\" stroke=\"" + c.couleur + "\" stroke-dasharray=\"3 4\">" + m.map(s => { const q = p(s); return "<circle cx=\"" + q[0] + "\" cy=\"" + q[1] + "\" r=\"" + Math.max(18, 2.7 * P.e) + "\"/>"; }).join("") + "</g>";
                if (m.length > 1) { const dans = [0], liens = []; while (dans.length < m.length) { let b = null; dans.forEach(i => m.forEach((s, j) => { if (!dans.includes(j)) { const a = p(m[i]), d = p(s), dd = Math.hypot(a[0] - d[0], a[1] - d[1]); if (!b || dd < b.d) b = { i, j, d: dd }; } })); dans.push(b.j); liens.push([b.i, b.j]); }
                    h += "<g stroke=\"" + c.couleur + "\" stroke-opacity=\".45\" stroke-width=\"1.2\">" + liens.map(l => { const a = p(m[l[0]]), d = p(m[l[1]]); return "<line x1=\"" + a[0] + "\" y1=\"" + a[1] + "\" x2=\"" + d[0] + "\" y2=\"" + d[1] + "\"/>"; }).join("") + "</g>"; } });
            const pos = feuilles.slice().sort((a, b) => b.r - a.r);
            dernierPos = bulles.map(b => ({ kind: "b", b, x: b.x, y: b.y, r: b.r })).concat(pos.map(o => ({ kind: "s", s: o.s, x: o.x, y: o.y, r: o.r }))).concat(alarmes).concat(decorPos);
            // etiquettes : on essaie plusieurs emplacements pour eviter qu'elles se chevauchent (les bulles d'abord, puis les points isoles)
            const prisL = [], lab = [], txtDe = s => s.n + (distA(s) != null ? " · " + Math.round(distA(s)) + " al" : "");
            const libre = (r, o) => !prisL.some(q => r.a < q.c && r.c > q.a && r.b < q.d && r.d > q.b);
            bulles.forEach(b => { const un = b.ks.length === 1, t = un ? nomCourt(camp(b.ks[0]).nom, 28) + " · " + b.mem.length + " sys." : b.mem.length + " systèmes · " + b.ks.length + " campagnes", w = t.length * 6.2 + 6;
                const cand = [[b.x - w / 2, b.y + b.r + 15], [b.x - w / 2, b.y - b.r - 9], [b.x + b.r + 6, b.y + 4], [b.x - b.r - 6 - w, b.y + 4]]; let ch = cand[0];
                for (const c of cand) { if (libre({ a: c[0], b: c[1] - 12, c: c[0] + w, d: c[1] + 3 })) { ch = c; break; } }
                prisL.push({ a: ch[0], b: ch[1] - 12, c: ch[0] + w, d: ch[1] + 3 }); lab.push({ x: ch[0], y: ch[1], t, bulle: true, b }); });
            pos.forEach(o => { const w = txtDe(o.s).length * 6.4 + 6, hh = 13, cand = [[o.x + o.r + 5, o.y + 4], [o.x - o.r - 5 - w, o.y + 4], [o.x - w / 2, o.y - o.r - 7], [o.x - w / 2, o.y + o.r + 14], [o.x + o.r + 5, o.y - 12], [o.x + o.r + 5, o.y + 18]]; let ch = null;
                for (const c of cand) { const r = { a: c[0], b: c[1] - hh, c: c[0] + w, d: c[1] + 3 }; if (libre(r) && !pos.some(p2 => p2 !== o && Math.hypot(p2.x - (c[0] + w / 2), p2.y - c[1]) < p2.r + 6) && !bulles.some(b => Math.hypot(b.x - (c[0] + w / 2), b.y - c[1]) < b.r + 6)) { ch = c; break; } }
                if (!ch) { if (P.e < E_DETAIL) return; ch = cand[0]; }      // a grande echelle un nom est toujours affiche ; a petite echelle, un nom qui ne tient pas est omis
                prisL.push({ a: ch[0], b: ch[1] - hh, c: ch[0] + w, d: ch[1] + 3 }); lab.push({ x: ch[0], y: ch[1], t: txtDe(o.s), s: o.s }); });
            // bulles
            bulles.forEach(b => { const a = aspectL(b.mem, true), att = etat.renforcer && !b.mem.some(aRenforcer), un = b.ks.length === 1, ring = etat.renforcer && b.mem.some(aRenforcer) ? "#fff" : (un ? camp(b.ks[0]).couleur : "#cfd8dc");
                h += "<g class=\"cc-n cc-b\" data-b=\"" + b.id + "\" style=\"cursor:zoom-in\" opacity=\"" + (att ? .22 : 1) + "\"><circle cx=\"" + b.x + "\" cy=\"" + b.y + "\" r=\"" + (b.r + 5) + "\" fill=\"none\" stroke=\"" + ring + "\" stroke-width=\"2\" stroke-dasharray=\"" + (un ? "none" : "5 3") + "\" opacity=\".9\"/>"
                    + "<circle cx=\"" + b.x + "\" cy=\"" + b.y + "\" r=\"" + b.r + "\" fill=\"" + a.f + "\" fill-opacity=\".88\" stroke=\"#000\"/><text x=\"" + b.x + "\" y=\"" + (b.y + 5) + "\" text-anchor=\"middle\" fill=\"" + (a.vide ? "#9ab" : "#04070a") + "\" font-size=\"14\" font-weight=\"bold\">" + E(a.t) + "</text></g>"; });
            // points isoles
            pos.forEach(o => { const s = o.s, c = camp(s.k).couleur, a = aspect(s), sel = etat.choisi === s.n, att = etat.renforcer && !aRenforcer(s), vm = mVis(s);
                h += "<g class=\"cc-n\" data-n=\"" + E(s.n) + "\" style=\"cursor:pointer\" opacity=\"" + (att ? .22 : 1) + "\"><circle cx=\"" + o.x + "\" cy=\"" + o.y + "\" r=\"" + (o.r + 5) + "\" fill=\"none\" stroke=\"" + (etat.renforcer && aRenforcer(s) ? "#fff" : c) + "\" stroke-width=\"" + (sel ? 3 : 2) + "\" opacity=\"" + (sel ? 1 : .85) + "\"" + (a.vide ? " stroke-dasharray=\"4 3\"" : "") + "/>"
                    + "<circle cx=\"" + o.x + "\" cy=\"" + o.y + "\" r=\"" + o.r + "\" fill=\"" + a.f + "\" fill-opacity=\".88\" stroke=\"" + (a.vide ? "#5a7686" : "#000") + "\"/><text x=\"" + o.x + "\" y=\"" + (o.y + 4) + "\" text-anchor=\"middle\" fill=\"" + (a.vide ? "#9ab" : "#04070a") + "\" font-size=\"11\" font-weight=\"bold\">" + E(a.t) + "</text>";
                if (vm.some(x => x.dom === "PP")) h += "<path d=\"M" + (o.x + o.r + 2) + " " + (o.y - o.r - 9) + " l6 7 l-6 7 l-6 -7z\" fill=\"#8A7CFF\" stroke=\"#000\"/>";
                if (vm.some(x => x.dom === "COL")) h += "<rect x=\"" + (o.x + o.r - 2) + "\" y=\"" + (o.y - o.r - 10) + "\" width=\"11\" height=\"11\" fill=\"#FFD700\" stroke=\"#000\"/>";
                h += "</g>"; });
            lab.forEach(l => { h += l.bulle ? "<text x=\"" + l.x + "\" y=\"" + l.y + "\" fill=\"#e6eef2\" font-size=\"11.5\" letter-spacing=\".5\" opacity=\"" + (etat.renforcer && !l.b.mem.some(aRenforcer) ? .25 : 1) + "\" style=\"pointer-events:none\">" + E(l.t) + "</text>"
                : "<text x=\"" + l.x + "\" y=\"" + l.y + "\" fill=\"" + (etat.choisi === l.s.n ? "#fff" : "#cfd8dc") + "\" font-size=\"11.5\" letter-spacing=\"1\" opacity=\"" + (etat.renforcer && !aRenforcer(l.s) ? .25 : 1) + "\" style=\"pointer-events:none\">" + E(l.t) + "</text>"; });
            // ma position (visible de moi seul)
            if (etat.dist && etat.maPos) { const q = p({ x: etat.maPos.pos[0], y: etat.maPos.pos[1], z: etat.maPos.pos[2] }); if (q[0] > 14 && q[0] < W - 14 && q[1] > 14 && q[1] < H - 14) h += "<g style=\"pointer-events:none\"><path d=\"M" + q[0] + " " + (q[1] - 11) + " l11 11 l-11 11 l-11 -11z\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2\"/><circle cx=\"" + q[0] + "\" cy=\"" + q[1] + "\" r=\"3\" fill=\"#fff\"/><text x=\"" + (q[0] + 16) + "\" y=\"" + (q[1] + 4) + "\" fill=\"#fff\" font-size=\"11\" letter-spacing=\"2\">TOI</text></g>"; }
            h += "<text x=\"" + (W - 12) + "\" y=\"22\" text-anchor=\"end\" fill=\"#3d7490\" font-size=\"10\" letter-spacing=\"2\">" + (etat.vue === "dessus" ? "▲ VERS LE CENTRE GALACTIQUE" : "▲ AU-DESSUS DU PLAN GALACTIQUE") + "</text>";
            h += "<g><line x1=\"30\" y1=\"" + (H - 26) + "\" x2=\"" + (30 + pas * P.e) + "\" y2=\"" + (H - 26) + "\" stroke=\"#7fb8d0\" stroke-width=\"2\"/><text x=\"30\" y=\"" + (H - 32) + "\" fill=\"#7fb8d0\" font-size=\"10\">" + pas + " al</text></g>";
            const hh = exterieurs;
            if (hh.length) h += "<g><rect x=\"14\" y=\"40\" width=\"276\" height=\"" + (24 + hh.length * 18) + "\" fill=\"rgba(0,0,0,.55)\" stroke=\"#2a4a5a\"/><text x=\"24\" y=\"56\" fill=\"#7fb8d0\" font-size=\"10\" letter-spacing=\"2\">HORS DE L’ÉCRAN</text>"
                + hh.map((s, i) => "<g class=\"cc-n\" data-n=\"" + E(s.n) + "\" style=\"cursor:pointer\"><circle cx=\"28\" cy=\"" + (76 + i * 18) + "\" r=\"4.5\" fill=\"" + aspect(s).f + "\" stroke=\"" + camp(s.k).couleur + "\" stroke-width=\"1.5\"/><text x=\"38\" y=\"" + (80 + i * 18) + "\" fill=\"#cfd8dc\" font-size=\"10.5\">" + E(nomCourt(s.n, 22)) + " · " + Math.round(distCentre(s)) + " al</text></g>").join("") + "</g>";
            svg.innerHTML = h;
            majBarre();
        }
        function majEnn() {
            const sr = zone.querySelector("[data-rayon]"); if (sr) sr.value = String(etat.rayon);
            zone.querySelectorAll("[data-al]").forEach(b => { b.checked = !!etat.al[b.dataset.al]; });
            const fq = (iso) => iso ? new Date(iso).toLocaleDateString("fr-FR") : "", pl = n => n > 1 ? "s" : "";
            const ligne = (sel, on, html) => { const l = zone.querySelector(sel); if (!l) return; if (!on) { l.style.display = "none"; return; } l.style.display = "block"; l.innerHTML = html; };
            // niveau 1 : puissance ennemie en place
            { const v = etat.enn ? etat.enn.filter(c => c[6] <= etat.rayon) : [], nv = v.filter(c => c[8] === 1).length, qd = fq(etat.ennMaj);
              ligne(".cc-enn", !!etat.enn && etat.al[1], v.length ? "<i class=\"cc-alr\"></i><b style=\"color:#ff5c5c;\">" + v.length + "</b> système" + pl(v.length) + " de puissance" + pl(v.length) + " ennemie" + pl(v.length) + " (Powerplay) à ≤ " + etat.rayon + " al · le plus proche : <span style=\"color:#ff8a8a;\">" + E(v[0][0]) + "</span> (" + E(v[0][4]) + ") à " + String(v[0][6]).replace(".", ",") + " al de " + E(v[0][7]) + (nv ? " · <b style=\"color:#fff; background:#c01818; padding:0 5px;\">" + nv + " nouveau" + (nv > 1 ? "x" : "") + "</b>" : "") + (qd ? "<div style=\"color:#667; font-size:.85em; margin-top:2px;\">relevé du " + qd + " (retard possible : les données de Spansh se mettent à jour quand un joueur visite un système)</div>" : "")
                  : "<i class=\"cc-alr ok\"></i>aucun système de puissance ennemie à moins de " + etat.rayon + " al" + (qd ? " <span style=\"color:#667;\">(relevé du " + qd + ")</span>" : "")); }
            // niveau 2 : conquete Powerplay
            { const a = lvS("acq"), v = a ? a.filter(c => c[7] <= etat.rayon) : [], nv = v.filter(c => c[9] === 1).length, fort = v.filter(c => c[5] >= 0.3 && c[6] !== 0).length, qd = fq((etat.lv.acq || {}).maj);
              ligne(".cc-acq", !!a && etat.al[2], v.length ? "<i class=\"cc-alr or\"></i><b style=\"color:#ffae4a;\">" + v.length + "</b> conquête" + pl(v.length) + " ennemie" + pl(v.length) + " (Powerplay) en cours à ≤ " + etat.rayon + " al" + (fort ? " dont <b>" + fort + "</b> à 30 % ou plus" : "") + " · la plus avancée : <span style=\"color:#ffc27a;\">" + E(v.slice().sort((x, y) => y[5] - x[5])[0][0]) + "</span> (" + E(v.slice().sort((x, y) => y[5] - x[5])[0][4]) + ", " + Math.round(v.slice().sort((x, y) => y[5] - x[5])[0][5] * 100) + " %)" + (nv ? " · <b style=\"color:#fff; background:#c06a10; padding:0 5px;\">" + nv + " nouvelle" + (nv > 1 ? "s" : "") + "</b>" : "") + (qd ? "<div style=\"color:#667; font-size:.85em; margin-top:2px;\">relevé du " + qd + " · systèmes inoccupés où une puissance ennemie a au moins 10 % de progression</div>" : "")
                  : "<i class=\"cc-alr ok\"></i>aucune conquête ennemie à moins de " + etat.rayon + " al" + (qd ? " <span style=\"color:#667;\">(relevé du " + qd + ")</span>" : "")); }
            // niveau 3 : expansion BGS d'une faction rivale
            { const a = lvS("exp"), v = (a || []).filter(c => c[13] !== 0), watch = new Set((a || []).filter(c => c[13] === 0).map(c => c[0])).size, nv = v.filter(c => c[12] === 1).length, cibles = new Set(v.map(c => c[0])).size, qd = fq((etat.lv.exp || {}).maj);
              ligne(".cc-exp", !!a && etat.al[3], v.length ? "<i class=\"cc-alr pk\"></i><b style=\"color:#ff7be5;\">" + cibles + "</b> système" + pl(cibles) + " de la faction menacé" + pl(cibles) + " par une expansion rivale (BGS) · le plus proche : <span style=\"color:#ffa6ee;\">" + E(v[0][0]) + "</span> ← " + E(v[0][9]) + " (" + E(v[0][10]) + ") à " + String(v[0][11]).replace(".", ",") + " al" + (nv ? " · <b style=\"color:#fff; background:#a8208f; padding:0 5px;\">" + nv + " nouveau" + (nv > 1 ? "x" : "") + "</b>" : "") + (watch ? "<div style=\"color:#d9a6d0; font-size:.9em; margin-top:2px;\">+ " + watch + " autre" + pl(watch) + " système" + pl(watch) + " à surveiller (faction rivale en Expansion à portée, sans être la cible exacte du jeu)</div>" : "") + (qd ? "<div style=\"color:#667; font-size:.85em; margin-top:2px;\">relevé du " + qd + " · faction rivale en Expansion à ≤ 20 al, système à place libre (moins de 7 factions)</div>" : "")
                  : "<i class=\"cc-alr ok\"></i>aucune alerte d’expansion rivale vers vos systèmes" + (watch ? " <span style=\"color:#d9a6d0;\">(" + watch + " à surveiller)</span>" : "") + (qd ? " <span style=\"color:#667;\">(relevé du " + qd + ")</span>" : "")); }
        }
        function majBarre() {
            majEnn();
            zone.querySelectorAll("[data-v]").forEach(b => b.classList.toggle("on", b.dataset.v === etat.vue));
            const sm = zone.querySelector("[data-modesel]"); if (sm) sm.value = etat.mode;
            zone.querySelectorAll("[data-d]").forEach(b => { b.checked = !etat.doms.has(b.dataset.d); });
            zone.querySelectorAll("[data-f]").forEach(b => { const v = b.dataset.f === "ren" ? etat.renforcer : b.dataset.f === "ctx" ? etat.ctxOn : b.dataset.f === "tout" ? false : etat.dist; if (b.tagName === "INPUT") b.checked = v; else b.classList.toggle("on", v); });
            legende();
        }
        function legende() {
            const pt = (c, t) => "<div><i style=\"background:" + c + "\"></i>" + t + "</div>";
            const h = etat.mode === "participation" ? pt("#9be8ff", "3 pilotes ou plus") + pt("#5aa9c9", "1 ou 2 pilotes") + "<div><i style=\"background:#16222c; border:1px dashed #5a7686;\"></i>personne n’a joué</div>" + pt("#5a6a76", "pas de mesure")
                : etat.mode === "priorite" ? Object.keys(PRIO).map(k => pt(PRIO[k][1], "priorité " + PRIO[k][0].toLowerCase())).join("")
                : pt(COUL.up, "objectif atteint") + pt(COUL.dn, "à renforcer") + pt(COUL.fl, "inchangé");
            leg.innerHTML = h + "<div class=\"cc-lg2\"><span class=\"cc-lgt\">TYPE</span>◯ BGS · <span style=\"color:#8A7CFF\">◆</span> Powerplay · <span style=\"color:#FFD700\">■</span> Colonisation</div>"
                + "<div class=\"cc-lg2\"><span class=\"cc-lgt\">TERRITOIRE</span><span style=\"color:#FFD700\">●</span> colonie · <span style=\"color:#8A7CFF\">◇</span> puissance défendue</div>"
                + "<div class=\"cc-lg2\"><span class=\"cc-lgt\">ALARMES</span><span style=\"color:#ff2d2d\">●</span> ennemi en place · <span style=\"color:#ff9a1f\">●</span> conquête · <span style=\"color:#ff4fd8\">◯</span> expansion</div>"
                + "<div class=\"cc-lg2\"><span class=\"cc-lgt\">BULLE</span>pointillée = groupe de cibles</div>"
                + "";
        }
        function listeCamps() {
            el.innerHTML = par.map(o => "<div class=\"cc-camp" + (etat.hors.has(o.c.id) ? " off" : "") + "\" data-k=\"" + o.c.id + "\"><i style=\"background:" + o.c.couleur + "; box-shadow:0 0 8px " + o.c.couleur + "\"></i><div>" + E(o.c.nom) + "<small>" + E(o.c.type) + " · priorité " + E((PRIO[o.c.prio || 3] || PRIO[3])[0].toLowerCase()) + "</small></div><span class=\"n\">" + o.n + " sys.</span></div>").join("");
            el.querySelectorAll(".cc-camp").forEach(d => d.onclick = () => { const k = d.dataset.k; const c = camps.find(x => String(x.id) === k); if (!c) return; etat.hors.has(c.id) ? etat.hors.delete(c.id) : etat.hors.add(c.id); listeCamps(); dessiner(); });
        }
        // clic sur un point : une seule directive -> sa fenetre ; plusieurs -> petite fenetre de choix
        function fermerChoix() { const o = document.getElementById("cc-choix"); if (o) o.remove(); document.removeEventListener("keydown", toucheChoix); }
        function toucheChoix(e) { if (e.key === "Escape") fermerChoix(); }
        function ouvrirM(m) { fermerChoix(); if (typeof window.hideHoloTooltip === "function") window.hideHoloTooltip(); if (m && m.clic) { try { (new Function(m.clic))(); } catch (e) { console.error(e); } } }
        function choisir(s) {
            const ms = mVis(s); fermerChoix(); if (typeof window.hideHoloTooltip === "function") window.hideHoloTooltip(); if (!ms.length) return; if (ms.length === 1) { ouvrirM(ms[0]); return; }
            const c = camp(s.k), o = document.createElement("div"); o.id = "cc-choix";
            o.innerHTML = "<div class=\"cc-ch\"><div class=\"cc-ch-t\"><b style=\"color:" + c.couleur + ";\">" + E(s.n) + "</b><span>" + ms.length + " directives actives : laquelle ouvrir ?</span><button type=\"button\" class=\"cc-ch-x\">✕</button></div>"
                + ms.map((m, i) => { const k = RES[m.res] || RES.fl; return "<button type=\"button\" class=\"cc-ch-m\" data-i=\"" + i + "\" style=\"--k:" + k + ";\"><span class=\"t\">" + E(m.tag) + "</span><span class=\"r\">" + E(RES_LIB[m.res] || RES_LIB.fl) + "</span><span class=\"g\">OUVRIR ↗</span></button>"; }).join("") + "</div>";
            document.body.appendChild(o); document.addEventListener("keydown", toucheChoix);
            o.onclick = e => { if (e.target === o) fermerChoix(); };
            o.querySelector(".cc-ch-x").onclick = fermerChoix;
            o.querySelectorAll(".cc-ch-m").forEach(b => b.onclick = () => ouvrirM(ms[Number(b.dataset.i)]));
        }
        // cible sous la souris : le centre le plus proche (deux systemes superposes en vue de dessus), sinon l'element dessine
        const cible = e => { const r = svg.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * W, py = (e.clientY - r.top) / r.height * H; let b = null;
            dernierPos.forEach(o => { const d = Math.hypot(o.x - px, o.y - py); if (d <= o.r + 7 && (!b || d < b.d)) b = { o, d }; });
            if (b) return b.o;
            const n = e.target.closest && e.target.closest(".cc-n[data-n]"); return n && S[n.dataset.n] ? { kind: "s", s: S[n.dataset.n] } : null; };
        const htmlBulle = t => {
            if (t.kind === "s") { const s = t.s, c = camp(s.k), d = distA(s);
                return "<div class=\"cc-tipw\"><strong style=\"color:" + c.couleur + ";\">" + E(s.n) + "</strong> <span style=\"color:#889;\">" + E(c.nom) + "</span>" + (d != null ? " <span style=\"color:#bfe3f2;\">· à " + Math.round(d) + " al de toi</span>" : "")
                    + mVis(s).map(x => x.carte || "<div style=\"color:" + (RES[x.res] || RES.fl) + ";\">" + E(x.tag) + "</div>").join("") + "<div style=\"color:#778; font-size:.82em; margin-top:6px;\">Clic : ouvrir la fenêtre" + (mVis(s).length > 1 ? " (choix entre " + mVis(s).length + " directives)" : "") + " · clic droit : copier le nom</div></div>"; }
            if (t.kind === "e") return "<div class=\"cc-tipw\"><strong style=\"color:#ff5c5c;\">⚠ " + E(t.n) + "</strong>" + (t.nv ? " <span style=\"color:#fff; background:#c01818; padding:0 6px;\">NOUVEAU</span>" : "") + "<div style=\"color:#ff8a8a; font-size:.8em; letter-spacing:1px;\">POWERPLAY · SYSTÈME CONTRÔLÉ PAR UNE PUISSANCE ENNEMIE</div><div style=\"color:#ffb3b3;\">" + E(t.pu) + (ETATS_FR[t.et] ? " · " + ETATS_FR[t.et] : "") + "</div><div style=\"color:#cfd8dc;\">à <b>" + String(t.d).replace(".", ",") + " al</b> de " + E(t.pr || "nos systèmes") + "</div><div style=\"color:#778; font-size:.82em; margin-top:6px;\">déjà acquis : du contexte, pas une menace imminente · clic droit : copier le nom</div></div>";
            if (t.kind === "a") return "<div class=\"cc-tipw\"><strong style=\"color:#ffae4a;\">⚠ POWERPLAY · CONQUÊTE · " + E(t.n) + "</strong>" + (t.nv ? " <span style=\"color:#fff; background:#c06a10; padding:0 6px;\">NOUVEAU</span>" : "") + "<div style=\"color:#ffd1a0;\">" + E(t.pu) + " · <b>" + Math.round(t.pg * 100) + " %</b> de progression" + (t.pg >= 0.3 ? " (au-dessus du seuil de contestation de 30 %)" : "") + "</div><div style=\"color:#cfd8dc;\">" + (t.an === 1 ? "ancre en portée : un système Consolidé à 20 al ou Défendu à 30 al" : t.an === 0 ? "pas d’ancre en portée : elle ne devrait pas pouvoir le prendre" : "ancre non vérifiée (progression sous 30 %)") + "</div><div style=\"color:#cfd8dc;\">système inoccupé, à <b>" + String(t.d).replace(".", ",") + " al</b> de " + E(t.pr || "nos systèmes") + "</div><div style=\"color:#778; font-size:.82em; margin-top:6px;\">clic droit : copier le nom</div></div>";
            if (t.kind === "x") return "<div class=\"cc-tipw\"><strong style=\"color:#ff7be5;\">⚠ BGS · EXPANSION RIVALE · " + E(t.n) + "</strong>" + (t.nv ? " <span style=\"color:#fff; background:#a8208f; padding:0 6px;\">NOUVEAU</span>" : "") + "<div style=\"color:#ffc2f4;\">" + E(t.fa) + (t.al ? " (" + E(t.al) + ")" : "") + " est en Expansion</div><div style=\"color:" + (t.st ? "#ff7be5" : "#d9a6d0") + ";\">" + (t.st ? "ALERTE : c’est le système que le jeu devrait choisir" : "À SURVEILLER : à portée, mais le jeu devrait plutôt en choisir un autre") + "</div><div style=\"color:#cfd8dc;\">depuis <b>" + E(t.on) + "</b>, à " + String(t.d).replace(".", ",") + " al de ce système</div><div style=\"color:#cfd8dc;\">place libre chez nous : " + t.nb + " factions sur 7</div><div style=\"color:#778; font-size:.82em; margin-top:6px;\">clic droit : copier le nom</div></div>";
            if (t.kind === "c") { const tri = t.mem.slice().sort((u, v) => u.d - v.d); return "<div class=\"cc-tipw cc-tipb\"><strong style=\"color:" + (t.col || "#ff5c5c") + ";\">⚠ " + t.n + (t.niv === "a" ? " conquêtes ennemies" : t.niv === "x" ? " systèmes menacés d’expansion" : " systèmes ennemis") + "</strong>" + tri.slice(0, 8).map(v => "<div class=\"cc-tl\"><i style=\"background:" + (t.col || "#ff2d2d") + "\"></i><span>" + E(v.n) + "</span><small>" + E(v.pu || v.fa || "") + " · " + String(v.d).replace(".", ",") + " al</small></div>").join("") + (tri.length > 8 ? "<div style=\"color:#889;\">… et " + (tri.length - 8) + " autres</div>" : "") + "<div style=\"color:#778; font-size:.82em; margin-top:6px;\">zoomez pour les voir un par un · clic droit : copier les noms</div></div>"; }
            if (t.kind === "d") return "<div class=\"cc-tipw\"><strong style=\"color:#cfd8dc;\">" + E(t.n) + "</strong><div style=\"color:#889;\">système de la faction" + (t.esc ? " · <span style=\"color:#FFD700;\">colonie de membres de l’escadron</span>" : "") + (t.pw ? " · <span style=\"color:#b6adff;\">sous " + E(etat.pw) + "</span>" : "") + "</div><div style=\"color:#778; font-size:.82em; margin-top:6px;\">clic droit : copier le nom</div></div>";
            const b = t.b, tri = b.mem.slice().sort((u, v) => rangRes(u) - rangRes(v) || u.n.localeCompare(v.n));
            return "<div class=\"cc-tipw cc-tipb\"><strong>" + b.mem.length + " systèmes ciblés</strong>" + tri.slice(0, 14).map(s => "<div class=\"cc-tl\"><i style=\"background:" + COUL[["dn", "fl", "up"][rangRes(s)]] + "\"></i><span>" + E(s.n) + "</span><small>" + E(nomCourt(camp(s.k).nom, 26)) + "</small></div>").join("")
                + (tri.length > 14 ? "<div style=\"color:#889;\">… et " + (tri.length - 14) + " autres</div>" : "") + "<div style=\"color:#778; font-size:.82em; margin-top:6px;\">Clic : zoomer sur ce groupe · clic droit : copier tous les noms</div></div>";
        };
        // la bulle d'information suit la souris dans la carte ; elle disparait des que la souris n'est plus sur une cible (ou quitte la carte, ou que la carte est redessinee)
        svg.addEventListener("mousemove", e => {
            if (drag && bouge) { masquerBulle(); return; }
            if (document.getElementById("cc-choix") || typeof window.showHoloTooltip !== "function") { masquerBulle(); return; }
            const t = cible(e); if (!t) { masquerBulle(); return; }
            const cle = t.kind === "b" ? "b" + t.b.id : t.kind === "c" ? "c" + Math.round(t.x) + "_" + Math.round(t.y) : (t.kind === "d" || t.kind === "e" || t.kind === "a" || t.kind === "x") ? t.kind + t.n : "s" + t.s.n; survol = t;
            if (cle !== tipCle) { tipCle = cle; window.showHoloTooltip(e, htmlBulle(t), t.kind === "b" ? "#00F0FF" : t.kind === "d" ? "#7fb8d0" : (t.kind === "e" || t.kind === "c" || t.kind === "a" || t.kind === "x") ? (t.col || "#ff2d2d") : camp(t.s.k).couleur); } else if (typeof window.moveHoloTooltip === "function") window.moveHoloTooltip(e);
        });
        // copier le nom d'un systeme (a coller dans la carte du jeu) : clic droit, ou Ctrl+C pendant le survol ; sur une bulle, tous les noms (un par ligne)
        const noms = t => t.kind === "b" ? t.b.mem.map(s => s.n).sort().join("\n") : t.kind === "c" ? t.mem.map(v => v.n).sort().join("\n") : (t.kind === "d" || t.kind === "e" || t.kind === "a" || t.kind === "x") ? t.n : t.s.n;
        function copier(texte) {
            const fin = ok => { msg.textContent = ok ? "copié : " + texte.split("\n").slice(0, 3).join(", ") + (texte.split("\n").length > 3 ? "…" : "") : "copie impossible (autorisation du navigateur)"; const m = msg.textContent; setTimeout(() => { if (msg.textContent === m) msg.textContent = ""; }, 2500); };
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texte).then(() => fin(true), () => fin(false));
            else { try { const a = document.createElement("textarea"); a.value = texte; a.style.position = "fixed"; a.style.opacity = "0"; document.body.appendChild(a); a.select(); const ok = document.execCommand("copy"); a.remove(); fin(ok); } catch (x) { fin(false); } }
        }
        svg.addEventListener("contextmenu", e => { const t = cible(e); if (!t) return; e.preventDefault(); copier(noms(t)); });
        const surCtrlC = e => { if (!svg.isConnected || !survol || !(e.ctrlKey || e.metaKey) || String(e.key).toLowerCase() !== "c") return; const sel = window.getSelection && String(window.getSelection()); if (sel) return; copier(noms(survol)); };
        window.addEventListener("keydown", surCtrlC);
        svg.addEventListener("mouseleave", masquerBulle);
        svg.addEventListener("mousedown", masquerBulle);
        if (etat.off) { window.removeEventListener("mousemove", etat.off[0]); window.removeEventListener("mouseup", etat.off[1]); window.removeEventListener("blur", etat.off[2]); window.removeEventListener("scroll", etat.off[2], true); window.removeEventListener("keydown", etat.off[3]); }
        // clic : une bulle = zoom sur son groupe ; un point = fenetre de la directive (ou choix)
        svg.addEventListener("click", e => { if (bouge) { bouge = false; return; } const t = cible(e); if (!t || t.kind === "d" || t.kind === "e" || t.kind === "c" || t.kind === "a" || t.kind === "x") return;
            if (t.kind === "b") { masquerBulle(); const c = cadrer(t.b.mem.map(s => ax(s)), 24); etat.zoom = c.z; etat.cx = c.cx; etat.cy = c.cy; dessiner(); return; }
            etat.choisi = t.s.n; dessiner(); choisir(t.s); });
        svg.addEventListener("wheel", e => { e.preventDefault(); const P = projection(), r = svg.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * W, py = (e.clientY - r.top) / r.height * H;
            const f = e.deltaY < 0 ? 1.25 : 0.8, z = Math.max(Math.min(0.4, ensemble().z * 0.8), Math.min(60, etat.zoom * f)); if (z === etat.zoom) return;
            const wx = P.cx + (px - P.X0) / P.e, wy = P.cy - (py - P.Y0) / P.e; etat.zoom = z; const e2 = P.e0 * z; etat.cx = wx - (px - P.X0) / e2; etat.cy = wy + (py - P.Y0) / e2; dessiner(); }, { passive: false });
        svg.addEventListener("mousedown", e => { const P = projection(); drag = { x: e.clientX, y: e.clientY, cx: P.cx, cy: P.cy, e: P.e }; bouge = false; svg.classList.add("glisse"); });
        const surMove = e => { if (!drag || !svg.isConnected) return; const r = svg.getBoundingClientRect(), k = W / r.width, dx = (e.clientX - drag.x) * k, dy = (e.clientY - drag.y) * k; if (Math.abs(dx) + Math.abs(dy) > 4) bouge = true; if (!bouge) return; etat.cx = drag.cx - dx / drag.e; etat.cy = drag.cy + dy / drag.e; dessiner(); };
        const surUp = () => { drag = null; svg.classList.remove("glisse"); };
        window.addEventListener("mousemove", surMove); window.addEventListener("mouseup", surUp); window.addEventListener("blur", masquerBulle); window.addEventListener("scroll", masquerBulle, true); etat.off = [surMove, surUp, masquerBulle, surCtrlC];
        svg.addEventListener("dblclick", () => { etat.zoom = 1; etat.cx = null; etat.cy = null; dessiner(); });
        // « aller a… » : tout, les colonies de l'escadron, une campagne ou un systeme
        const selAller = zone.querySelector("[data-aller]");
        if (selAller) selAller.onchange = () => {
            const v = selAller.value; selAller.value = ""; if (!v) return; let pts = [], zmax = 24;
            if (v === "tout") { const t = ensemble(); etat.zoom = t.z; etat.cx = t.cx; etat.cy = t.cy; dessiner(); return; }
            if (v === "cibles") pts = connus.map(s => ax(s));
            else if (v === "ennemis") { pts = (etat.enn || []).filter(c => c[6] <= etat.rayon).map(c => ax({ x: c[1], y: c[2], z: c[3] })).concat((lvS("acq") || []).filter(c => c[7] <= etat.rayon).map(c => ax({ x: c[1], y: c[2], z: c[3] })), (lvS("exp") || []).map(c => ax({ x: c[1], y: c[2], z: c[3] })), connus.map(s => ax(s))); }
            else if (v === "colonies") pts = (etat.ctx || []).filter(c => c[5] === 1).map(c => ax({ x: c[1], y: c[2], z: c[3] }));
            else if (v.indexOf("c:") === 0) { const c = camps.find(x => String(x.id) === v.slice(2)); if (c) pts = c.lignes.map(l => S[l.sys]).filter(s => s && s.x != null).map(s => ax(s)); }
            else if (v.indexOf("s:") === 0) { const s = S[v.slice(2)]; if (s && s.x != null) { pts = [ax(s)]; zmax = 14; etat.choisi = s.n; } }
            if (!pts.length) { msg.textContent = "rien à afficher pour ce choix"; setTimeout(() => { if (msg.textContent === "rien à afficher pour ce choix") msg.textContent = ""; }, 3000); return; }
            const c = cadrer(pts, zmax); etat.zoom = c.z; etat.cx = c.cx; etat.cy = c.cy; dessiner();
        };
        zone.querySelectorAll("[data-v]").forEach(b => b.onclick = () => { etat.vue = b.dataset.v; etat.zoom = 1; etat.cx = null; etat.cy = null; dessiner(); });
        zone.querySelectorAll("[data-al]").forEach(b => b.onchange = () => { etat.al[b.dataset.al] = b.checked; dessiner(); });
        const selRayon = zone.querySelector("[data-rayon]"); if (selRayon) selRayon.onchange = () => { etat.rayon = Number(selRayon.value) || 15; dessiner(); };
        const selMode = zone.querySelector("[data-modesel]"); if (selMode) selMode.onchange = () => { etat.mode = selMode.value; dessiner(); };
        zone.querySelectorAll("[data-d]").forEach(b => b.onchange = () => { const d = b.dataset.d; etat.doms.has(d) ? etat.doms.delete(d) : etat.doms.add(d); dessiner(); });
        zone.querySelectorAll("[data-f]").forEach(b => b.onclick = async () => {
            if (b.dataset.f === "ren") { etat.renforcer = !etat.renforcer; dessiner(); return; }
            if (b.dataset.f === "ctx") { etat.ctxOn = !etat.ctxOn; dessiner(); return; }
            if (b.dataset.f === "tout") { const t = ensemble(); etat.zoom = t.z; etat.cx = t.cx; etat.cy = t.cy; dessiner(); return; }
            if (etat.dist) { etat.dist = false; msg.textContent = ""; dessiner(); return; }
            msg.textContent = "lecture de ta position…"; const mp = await maPosition();
            if (!mp) { msg.textContent = "position inconnue : lance le jeu avec le plugin SYS.EDTEAM"; majBarre(); return; }
            etat.dist = true; msg.textContent = ""; dessiner();
        });
        ajuster(); listeCamps(); dessiner();
        if (etat.ro) { try { etat.ro.disconnect(); } catch (e) { /* rien */ } }
        if (typeof ResizeObserver === "function") { let att = 0; etat.ro = new ResizeObserver(() => { if (!svg.isConnected) { etat.ro.disconnect(); return; } cancelAnimationFrame(att); att = requestAnimationFrame(() => { if (ajuster()) dessiner(); }); }); etat.ro.observe(svg); }
    }
    window.EdteamCarteCampagnes = { monter };
})();
