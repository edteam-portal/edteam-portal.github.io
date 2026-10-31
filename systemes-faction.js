// =====================================================================================================
//  SYSTEMES DE LA FACTION DEFENDUE (SQL 187) : onglet « SYSTEMES » de la page Escadron.
//    EdteamSystemes.monter(element)
//  Une seule lecture serveur (systemes_controles : ~20 Ko), a l'ouverture de l'onglet, gardee 1 heure sur l'appareil (localStorage).
//  La FICHE d'un systeme (modale) n'ajoute AUCUNE lecture serveur : tout vient de la liste ; seule la situation des factions « en direct » est demandee a EDSM
//  par le navigateur (1 appel de quelques Ko, garde 30 minutes) : rien ne passe par la base.
//  Rien n'est jamais invente : une donnee absente est affichee « inconnue » (influence non relevee, architecte non revele par le plugin...).
// =====================================================================================================
(function () {
    "use strict";
    if (window.EdteamSystemes) return;

    const E = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const VERSION_ATTENDUE = 4, CLE = "edteam_sysfac_v4", DUREE = 3600000, CLE_EDSM = "edteam_sysfac_edsm_v1_", DUREE_EDSM = 1800000;
    // colonnes d'une ligne du serveur
    const C = { nom: 0, ctrl: 1, colo: 2, archi: 3, membre: 4, infl: 5, etats: 6, age: 7, nbf: 8, dir: 9, chant: 10, conf: 11, pui: 12, sp: 13, x: 14, y: 15, z: 16, camp: 17 };
    const FILTRES = [
        ["controles", "CONTRÔLÉS ET CIBLES", r => r[C.ctrl] >= 1],
        ["colonies", "COLONIES", r => r[C.ctrl] === 1 && r[C.colo] === 1],
        ["membres", "COLONIES DE MEMBRES", r => r[C.membre] === 1],
        ["directives", "DIRECTIVE ACTIVE", r => r[C.dir] === 1],
        ["campagnes", "EN CAMPAGNE", r => !!r[C.camp]],
        ["conflits", "EN CONFLIT", r => r[C.conf] === 1],
        ["chantiers", "CHANTIERS EN COURS", r => r[C.chant] > 0],
        ["cibles", "CIBLES", r => r[C.ctrl] === 2],
        ["non", "COLONIES NON CONTRÔLÉES", r => r[C.ctrl] === 0]
    ];
    let DATA = null, etat = { f: "controles", q: "", tri: "nom", sens: 1 };

    const CSS = `
.sf{font-family:'Share Tech Mono',monospace;margin:0 0 14px;--c:#00F0FF}
.sf *{box-sizing:border-box}
.sf-h{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin:0 0 10px}
.sf-h h2{margin:0;color:var(--c);font-size:1.05em;letter-spacing:3px;font-weight:normal;text-transform:uppercase}
.sf-h em{color:#8b97a0;font-size:.74em;font-style:normal;letter-spacing:1px}
.sf-n{margin-left:auto;color:#8b97a0;font-size:.78em;letter-spacing:1px}
.sf-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 10px}
.sf-bar button{background:transparent;border:1px solid #3a474d;color:#aab7bd;font:inherit;font-size:.72em;letter-spacing:1.5px;padding:5px 11px;cursor:pointer}
.sf-bar button.on{border-color:var(--c);color:#fff;background:rgba(0,240,255,.12)}
.sf-bar button i{font-style:normal;color:#7d8a92;margin-left:6px}.sf-bar button.on i{color:#9ee}
.sf-outils{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:0 0 10px}.sf-outils .sf-ref{flex:1 1 360px;margin:0}
.sf-outils input{flex:0 1 340px;min-width:220px;background:#05080c;border:1px solid #3a474d;color:#dfe9ec;font:inherit;font-size:.8em;padding:7px 10px;letter-spacing:1px}
.sf-outils input:focus{outline:none;border-color:var(--c)}
.sf-cadre{border:1px solid rgba(0,240,255,.18)}
.sf-tab{width:100%;border-collapse:collapse;font-size:.88em}
.sf-tab th{background:#071016;text-align:left;color:#7d8a92;font-size:.68em;letter-spacing:2px;font-weight:normal;padding:8px 10px;border-bottom:1px solid rgba(0,240,255,.3);white-space:nowrap}
.sf-tab th[data-t]{cursor:pointer}.sf-tab th[data-t]:hover{color:#fff}.sf-tab th.tri{color:#fff}
.sf-tab td{padding:8px 10px;border-bottom:1px dashed #28343a;vertical-align:middle;color:#dfe9ec}
.sf-tab tbody tr{cursor:pointer}.sf-tab tbody tr:hover td{background:rgba(0,240,255,.06)}
.sf-tab tr.non td:first-child{box-shadow:inset 3px 0 0 #8b97a0}
.sf-tab tr.cib td:first-child{box-shadow:inset 3px 0 0 #00F0FF}
.sf-tab tr.mb td:first-child{box-shadow:inset 3px 0 0 #00FF66}
.sf-nom,.sf-arch{color:#fff;letter-spacing:1px}
.sf-ty{display:inline-block;border:1px solid currentColor;padding:0 7px;font-size:.74em;letter-spacing:1.5px;white-space:nowrap}
.sf-pil{display:flex;align-items:center;gap:8px}.sf-pil .ph{width:var(--t,26px);height:var(--t,26px)}
.sf-pil small{display:block;color:#7d8a92;font-size:.72em;letter-spacing:1px}
.sf-inc{color:#6f7d85}
.sf-leg{display:flex;gap:6px 22px;flex-wrap:wrap;margin:10px 0 0;font-size:.72em;letter-spacing:1px;color:#8b97a0}.sf-leg i{display:inline-block;width:3px;height:12px;margin-right:7px;vertical-align:-2px}.sf-leg .sf-c{margin:0 6px 0 0;cursor:default}
.sf-c{display:inline-block;margin-left:8px;min-width:18px;text-align:center;padding:0 5px;border:1px solid #FF4FD8;color:#FF4FD8;background:rgba(255,79,216,.12);font-size:.72em;letter-spacing:0;font-weight:bold;vertical-align:1px;cursor:help}
.sf-ref{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 10px;font-size:.72em;letter-spacing:1.5px;color:#7d8a92}
.sf-ref button{background:transparent;border:1px solid #3a474d;color:#aab7bd;font:inherit;font-size:1em;letter-spacing:1.5px;padding:5px 11px;cursor:pointer}
.sf-ref button.on{border-color:var(--c);color:#fff;background:rgba(0,240,255,.12)}.sf-ref button:disabled{opacity:.35;cursor:default}
.sf-dist{white-space:nowrap;color:#fff}.sf-dist small{color:#7d8a92}.sf-vieux{color:#8b97a0}
.sf-inf b{color:#fff;font-weight:normal}.sf-inf small{display:block;color:#6f7d85;font-size:.72em;letter-spacing:.5px}
.sf-et{display:inline-block;border:1px solid currentColor;padding:0 6px;font-size:.72em;letter-spacing:1px;margin:0 4px 2px 0;white-space:nowrap}
.sf-not span{display:inline-block;margin:0 4px 2px 0;padding:0 6px;font-size:.7em;letter-spacing:1px;border:1px solid currentColor;white-space:nowrap}
.sf-vide{color:#7d8a92;font-size:.86em;line-height:1.6;letter-spacing:.5px;padding:16px 4px}
.sf-note{margin-top:10px;color:#6f7d85;font-size:.72em;line-height:1.5;letter-spacing:.3px}
#sf-voile{position:fixed;inset:0;z-index:9500;display:flex;align-items:center;justify-content:center;padding:clamp(10px,3vh,30px) clamp(10px,3vw,40px);background:rgba(2,3,5,.88);backdrop-filter:blur(3px);font-family:'Share Tech Mono',monospace}
.sf-mod{width:min(860px,100%);max-height:100%;overflow:auto;background:linear-gradient(180deg,rgba(0,240,255,.08),rgba(4,6,9,.985) 22%);border:1px solid #00F0FF;box-shadow:0 0 40px rgba(0,240,255,.18);color:#cfd8dc;padding:0 0 18px}
.sf-mod *{box-sizing:border-box}
.sf-mh{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:16px 22px 12px;border-bottom:1px solid rgba(0,240,255,.3)}
.sf-mh small{display:block;color:#888;letter-spacing:3px;font-size:.7em}.sf-mh b{display:block;color:#00F0FF;font-size:1.45em;letter-spacing:3px;font-weight:normal;overflow-wrap:anywhere;margin-top:3px}
.sf-mh .sf-bd{margin-top:8px}
.sf-x{background:transparent;border:1px solid #6b7680;color:#aab7bd;font:inherit;font-size:.78em;letter-spacing:2px;padding:7px 16px;cursor:pointer;flex:none}.sf-x:hover{border-color:#fff;color:#fff}
.sf-sec{padding:14px 22px 0}
.sf-sec h4{margin:0 0 8px;color:#7d8a92;font-size:.7em;letter-spacing:3px;font-weight:normal}
.sf-grille{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:10px}   /* toutes les cases sur UNE seule ligne, de largeur egale */
.sf-case{min-width:0;overflow-wrap:anywhere}
.sf-case{border:1px solid #28343a;background:rgba(0,0,0,.25);padding:9px 12px}.sf-case small{display:block;color:#7d8a92;font-size:.68em;letter-spacing:2px;margin-bottom:4px}.sf-case b{color:#fff;font-weight:normal;font-size:1.05em;letter-spacing:1px}
.sf-case.alerte{border-color:#FFB000}.sf-case.alerte b{color:#FFB000}
.sf-fac{width:100%;border-collapse:collapse;font-size:.86em}
.sf-fac th{color:#7d8a92;font-size:.66em;letter-spacing:2px;font-weight:normal;text-align:left;padding:5px 8px;border-bottom:1px solid rgba(0,240,255,.25)}
.sf-fac td{padding:6px 8px;border-bottom:1px dashed #28343a;color:#dfe9ec}
.sf-fac td:last-child{white-space:nowrap}
.sf-fac tr.nous td{color:#fff;background:rgba(0,240,255,.08)}.sf-fac tr.ctrl td:first-child{box-shadow:inset 3px 0 0 #FFB000}
.sf-fac small{color:#7d8a92;letter-spacing:1px}
.sf-fac tr.histsep td{padding:12px 8px 6px;border-bottom:1px solid #3a474d;color:#7d8a92;font-size:.74em;letter-spacing:1.5px;line-height:1.5;white-space:normal}
.sf-fac tr.hist td{color:#5d6a72;opacity:.75;font-style:italic;border-bottom:1px dashed #1d272c}
.sf-fac tr.hist small{color:#5d6a72}.sf-fac tr.hist small.h{display:inline-block;margin-left:6px;padding:0 6px;border:1px solid #3a474d;font-style:normal;font-size:.7em;letter-spacing:1px}
.sf-lien{display:inline-block;margin:0 10px 0 0;color:#00F0FF;border:1px solid #00F0FF;padding:5px 12px;font-size:.74em;letter-spacing:2px;text-decoration:none}.sf-lien:hover{background:rgba(0,240,255,.12)}
@media (max-width:760px){.sf-grille{grid-auto-flow:row;grid-template-columns:repeat(2,minmax(0,1fr))}.sf-tab th:nth-child(n+5),.sf-tab td:nth-child(n+5){display:none}.sf-outils input{flex:1 1 100%}}
`;
    function style() {
        if (document.getElementById("edteam-sf-css")) return;
        const s = document.createElement("style"); s.id = "edteam-sf-css"; s.textContent = CSS; (document.head || document.documentElement).appendChild(s);
    }

    const lieu = n => n ? (window.EdteamCopie ? window.EdteamCopie.lieu(n) : E(n)) : "";
    function ilYaH(h) { if (h == null) return ""; if (h < 0.03) return "à l’instant"; if (h < 1) return "il y a " + Math.round(h * 60) + " min"; if (h < 48) return "il y a " + Math.round(h) + " h"; return "il y a " + Math.round(h / 24) + " j"; }
    function ilYaS(s) { return ilYaH((Date.now() / 1000 - s) / 3600); }
    function coulEtat(e) {
        const x = String(e || "").toLowerCase();
        if (/war|conflict/.test(x)) return "#FF4D4D";
        if (/election/.test(x)) return "#FFB000";
        if (/boom|investment|expansion|pirate attack|civil liberty|public holiday/.test(x)) return /expansion/.test(x) ? "#00F0FF" : "#00FF66";
        if (/bust|famine|blight|outbreak|lockdown|civil unrest|terrorism|retreat|drought|infrastructure|natural disaster|none/.test(x)) return "#e0707c";
        return "#8b97a0";
    }
    const chipsEtats = s => String(s || "").split(",").filter(Boolean).map(e => '<span class="sf-et" style="color:' + coulEtat(e) + '">' + E(e.toUpperCase()) + "</span>").join("");
    function pilote(nom, t) {
        const P = window.EDTEAMPhotos;
        return '<div class="sf-pil">' + (P ? P.avatar({ nom: nom, taille: t || 26, role: "pilote" }) : "") + "<div><b class=\"sf-arch\">CMDR " + E(String(nom).toUpperCase()) + "</b></div></div>";
    }

    // ---- lecture : 1 appel, 1 heure en memoire sur l'appareil ----
    async function moi() { try { const r = await window.supabaseApp.auth.getSession(); return (r && r.data && r.data.session && r.data.session.user && r.data.session.user.id) || ""; } catch (e) { return ""; } }
    async function charger() {
        const uid = await moi();   // la memoire locale est PROPRE AU COMPTE : un autre compte sur le meme navigateur ne voit jamais la liste d'un autre escadron
        // memoire d'une heure ; si le serveur repond avec une ANCIENNE version du script SQL (pas de numero de version), elle n'est gardee que 5 minutes : les nouveautes apparaissent des que le script est relance
        try { const c = JSON.parse(localStorage.getItem(CLE) || "null"); if (c && c.d && c.u === uid && Date.now() - c.ts < (c.d.v === VERSION_ATTENDUE ? DUREE : 300000)) return c.d; } catch (e) { /* pas de memoire */ }
        const r = await window.supabaseApp.rpc("systemes_controles");
        if (r.error) { const e = new Error(r.error.message || "erreur"); e.code = r.error.code; e.status = r.status; throw e; }
        if (r.data != null) { try { localStorage.setItem(CLE, JSON.stringify({ ts: Date.now(), u: uid, d: r.data })); } catch (e) { /* tant pis */ } }
        return r.data;
    }
    const absente = e => e && (e.status === 404 || e.code === "PGRST202" || e.code === "42883");

    // ---- DISTANCE (annees-lumiere, calculee dans le navigateur : les coordonnees sont deja dans la liste, aucun appel pour chaque systeme) ----
    // Deux references possibles : MA POSITION (ma ligne privee de session_live, ~80 octets, comme la carte des campagnes de la page BGS : jamais celle d'un autre pilote)
    // et MON CARRIER (fc_mien, ~150 octets, deja gardee 3 minutes par l'onglet FLEET CARRIERS). Lues une seule fois a l'ouverture de l'onglet.
    const REFS = { pos: null, carrier: null, chargees: false }, REF = { mode: null }, CLE_COORDS = "edteam_coords_v1";
    async function coordsDe(nom) {
        const r = DATA && DATA.s.find(x => String(x[C.nom]).toLowerCase() === String(nom).toLowerCase());
        if (r && r[C.x] != null) return [r[C.x], r[C.y], r[C.z]];
        try { const c = JSON.parse(localStorage.getItem(CLE_COORDS) || "{}"); if (c[nom]) return c[nom]; } catch (e) { /* pas de memoire */ }
        try {                                                  // un systeme absent de la liste (le carrier est ailleurs) : EDSM, directement depuis le navigateur
            const u = await fetch("https://www.edsm.net/api-v1/systems?showCoordinates=1&systemName[]=" + encodeURIComponent(nom)), a = await u.json();
            const f = (Array.isArray(a) ? a : []).find(x => x && String(x.name).toLowerCase() === String(nom).toLowerCase());
            if (f && f.coords) { const p = [Number(f.coords.x), Number(f.coords.y), Number(f.coords.z)]; try { const c = JSON.parse(localStorage.getItem(CLE_COORDS) || "{}"); c[nom] = p; localStorage.setItem(CLE_COORDS, JSON.stringify(c)); } catch (e) { /* tant pis */ } return p; }
        } catch (e) { /* EDSM injoignable : pas de distance depuis ce carrier */ }
        return null;
    }
    async function lirePosition() {
        try {
            const uid = (window.profilCommandant || {}).user_id; if (!uid || !window.supabaseApp) return false;
            const r = await window.supabaseApp.from("session_live").select("pos:etat->pos,systeme:etat->>systeme,maj_le").eq("user_id", uid).maybeSingle();
            const d = r && r.data; if (!d || !Array.isArray(d.pos) || d.pos.length !== 3) return false;
            return { pos: d.pos.map(Number), nom: d.systeme || "", maj: d.maj_le || null };
        } catch (e) { return false; }
    }
    async function lireCarrier() {
        try {
            const K = window.EdteamCarriers; if (!K || !K.mien) return false;
            const c = await K.mien(); if (!c || !c.systeme) return false;
            const p = await coordsDe(c.systeme); return p ? { pos: p, nom: c.systeme, maj: null } : false;
        } catch (e) { return false; }
    }
    const refActive = () => !!(REF.mode && REFS[REF.mode]);
    const distDe = r => { if (!refActive() || r[C.x] == null) return null; const p = REFS[REF.mode].pos; return Math.hypot(r[C.x] - p[0], r[C.y] - p[1], r[C.z] - p[2]); };
    const fmtDist = d => d < 10 ? d.toFixed(1) : String(Math.round(d)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    const celluleDist = r => refActive() ? '<td class="sf-dist">' + (distDe(r) == null ? '<span class="sf-inc">—</span>' : fmtDist(distDe(r)) + " <small>al</small>") + "</td>" : "";
    const distTxt = r => { const d = distDe(r); return d == null ? "" : fmtDist(d) + ' al<small style="display:block;color:#7d8a92;font-size:.7em;margin-top:3px">depuis ' + E(REFS[REF.mode].nom || (REF.mode === "pos" ? "ma position" : "mon carrier")) + "</small>"; };
    function majRef(el) {
        const z = el.querySelector(".sf-ref"); if (!z) return;
        const b = (k, lib) => { const v = REFS[k]; return '<button type="button" data-r="' + k + '"' + (v ? "" : " disabled") + (REF.mode === k && v ? ' class="on"' : "") + ">" + lib + (v && v.nom ? " · " + E(v.nom) : "") + "</button>"; };
        z.innerHTML = !REFS.chargees ? "DISTANCE : lecture de votre position…"
            : "DISTANCE DEPUIS " + b("pos", "MA POSITION") + b("carrier", "MON CARRIER")
              + (!REFS.pos && !REFS.carrier ? "<span>indisponible : aucune position de jeu connue (plugin) et pas de carrier</span>" : (REF.mode === "pos" && REFS.pos && REFS.pos.maj ? "<span>position relevée " + ilYaH((Date.now() - new Date(REFS.pos.maj).getTime()) / 3600000) + "</span>" : ""));
    }
    async function chargerRefs(el) {
        if (REFS.chargees) { majRef(el); return; }
        const r = await Promise.all([lirePosition(), lireCarrier()]);
        REFS.pos = r[0]; REFS.carrier = r[1]; REFS.chargees = true;
        if (!REF.mode) REF.mode = REFS.pos ? "pos" : REFS.carrier ? "carrier" : null;
        majRef(el); dessiner(el);
    }

    // ---- tableau ----
    function lignesVisibles() {
        const f = FILTRES.find(x => x[0] === etat.f) || FILTRES[0], q = etat.q.trim().toLowerCase();
        let l = DATA.s.filter(f[2]);
        if (q) l = l.filter(r => String(r[C.nom]).toLowerCase().indexOf(q) >= 0 || String(r[C.archi] || "").toLowerCase().indexOf(q) >= 0);
        const idx = { nom: C.nom, infl: C.infl, archi: C.archi, nbf: C.nbf }[etat.tri] || C.nom, s = etat.sens, val = r => etat.tri === "dist" ? distDe(r) : r[idx];
        l = l.slice().sort((a, b) => {
            const x = val(a), y = val(b);
            if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1;       // les valeurs absentes en dernier, quel que soit le sens
            return (typeof x === "number" ? x - y : String(x).localeCompare(String(y), "fr")) * s;
        });
        return l;
    }
    function ligne(r, i) {
        const colo = r[C.colo] === 1, archi = r[C.archi], mb = r[C.membre] === 1;
        const type = r[C.ctrl] === 2 ? '<span class="sf-ty" style="color:#00F0FF" title="Système visé par une directive ou une campagne active, que notre faction ne contrôle pas">CIBLE</span>' : r[C.ctrl] === 0 ? '<span class="sf-ty" style="color:#8b97a0">NON CONTRÔLÉE</span>' : colo ? '<span class="sf-ty" style="color:#FFB44D">COLONIE</span>' : '<span class="sf-inc">—</span>';
        const arch = archi ? pilote(archi) + (mb ? "" : '<small style="color:#8b97a0;display:block;margin-left:34px">hors escadron</small>') : colo ? '<span class="sf-inc">inconnu</span>' : '<span class="sf-inc">—</span>';
        const inf = r[C.infl] == null ? '<span class="sf-inc">non relevée</span>' : '<div class="sf-inf"><b>' + r[C.infl].toFixed(1) + ' %</b><small class="' + (r[C.age] > 72 ? "sf-vieux" : "") + '">' + ilYaH(r[C.age]) + "</small></div>";
        const not = (r[C.dir] ? '<span style="color:#FF7100">DIRECTIVE</span>' : "") + (r[C.conf] ? '<span style="color:#FF4D4D">CONFLIT</span>' : "") + (r[C.chant] ? '<span style="color:#FFD700">CHANTIERS ×' + r[C.chant] + "</span>" : "") + (r[C.pui] ? '<span style="color:#b8a0ff">' + "PP · " + E(String(r[C.pui]).toUpperCase()) + "</span>" : "");
        return '<tr data-i="' + i + '" class="' + (r[C.ctrl] === 0 ? "non " : "") + (r[C.ctrl] === 2 ? "cib " : "") + (mb ? "mb" : "") + '"><td><span class="sf-nom">' + lieu(r[C.nom]) + "</span>" + (r[C.camp] ? ' <span class="sf-c" title="Campagne en cours : ' + E(r[C.camp]) + '">C</span>' : "") + "</td>" + celluleDist(r) + "<td>" + type + "</td><td>" + arch + "</td><td>" + inf + "</td><td>" + (chipsEtats(r[C.etats]) || '<span class="sf-inc">—</span>') + "</td><td>" + (r[C.nbf] == null ? "—" : r[C.nbf]) + '</td><td class="sf-not">' + (not || '<span class="sf-inc" style="border:0">—</span>') + "</td></tr>";
    }
    function dessiner(el) {
        const l = lignesVisibles(), th = (t, lib) => '<th data-t="' + t + '" class="' + (etat.tri === t ? "tri" : "") + '">' + lib + (etat.tri === t ? (etat.sens > 0 ? " ▲" : " ▼") : "") + "</th>";
        el.querySelector(".sf-bar").querySelectorAll("[data-f]").forEach(b => b.classList.toggle("on", b.dataset.f === etat.f));
        el.querySelector(".sf-n").textContent = l.length + " système" + (l.length > 1 ? "s" : "");
        el.querySelector(".sf-cadre").innerHTML = l.length
            ? '<table class="sf-tab"><thead><tr>' + th("nom", "SYSTÈME") + (refActive() ? th("dist", "DISTANCE") : "") + "<th>TYPE</th>" + th("archi", "ARCHITECTE") + th("infl", "INFLUENCE") + "<th>ÉTATS</th>" + th("nbf", "FACT.") + "<th>NOTES</th></tr></thead><tbody>" + l.map((r, i) => ligne(r, DATA.s.indexOf(r))).join("") + "</tbody></table>"
            : '<div class="sf-vide">Aucun système ne correspond à ce filtre.</div>';
    }

    // ---- fiche d'un systeme ----
    let voile = null;
    function fermer() { if (voile) { voile.remove(); voile = null; } document.removeEventListener("keydown", surTouche); }
    function surTouche(e) { if (e.key === "Escape") fermer(); }
    async function edsm(nom) {
        const cle = CLE_EDSM + String(nom).toLowerCase();
        try { const c = JSON.parse(sessionStorage.getItem(cle) || "null"); if (c && Date.now() - c.ts < DUREE_EDSM) return c.d; } catch (e) { /* pas de memoire */ }
        const r = await fetch("https://www.edsm.net/api-system-v1/factions?systemName=" + encodeURIComponent(nom));
        const d = await r.json();
        if (d && Array.isArray(d.factions)) { try { sessionStorage.setItem(cle, JSON.stringify({ ts: Date.now(), d: { c: d.controllingFaction && d.controllingFaction.name, f: d.factions } })); } catch (e) { /* tant pis */ } return { c: d.controllingFaction && d.controllingFaction.name, f: d.factions }; }
        return null;
    }
    // Factions PRESENTES (influence > 0) puis, separees et GRISEES, les factions a 0 % : elles ont quitte le systeme, EDSM / Spansh les gardent en historique.
    // EDSM ne donne PAS la date de leur depart (leur historique ne contient qu'un point a 0 %) : on ne l'invente pas. La colonne MAJ n'est donc pas affichee pour elles (c'est la date du systeme, pas la leur).
    function tableauFactions(d) {
        if (!d || !d.f || !d.f.length) return '<div class="sf-vide">EDSM ne connaît pas encore les factions de ce système.</div>';
        const toutes = d.f.slice().sort((a, b) => (b.influence || 0) - (a.influence || 0)), nous = DATA.faction;
        const pres = toutes.filter(x => (x.influence || 0) > 0), anc = toutes.filter(x => !((x.influence || 0) > 0));
        const etats = a => (a || []).map(x => x.state).filter(Boolean).join(", ");
        const ligne = x => '<tr class="' + (x.name === nous ? "nous " : "") + (x.name === d.c ? "ctrl" : "") + '"><td>' + E(x.name) + (x.isPlayer ? " <small>JOUEURS</small>" : "") + (x.name === d.c ? " <small>CONTRÔLE</small>" : "") + "</td><td>" + ((x.influence || 0) * 100).toFixed(1) + " %</td><td>" + E(x.state || "—") + "</td><td>" + (E(etats(x.pendingStates)) || "—") + "</td><td>" + (E(etats(x.recoveringStates)) || "—") + "</td><td>" + (x.lastUpdate ? ilYaS(x.lastUpdate) : "—") + "</td></tr>";
        const ligneHist = x => '<tr class="hist"><td>' + E(x.name) + (x.isPlayer ? " <small>JOUEURS</small>" : "") + ' <small class="h">A QUITTÉ LE SYSTÈME</small></td><td>0 %</td><td colspan="4">historique : plus présente</td></tr>';
        const moi = pres.find(x => x.name === nous), rival = pres.find(x => x.name !== nous);
        const ecart = moi && rival ? ((moi.influence - rival.influence) * 100) : null;
        return '<table class="sf-fac"><thead><tr><th>FACTION</th><th>INFLUENCE</th><th>ÉTAT</th><th>EN ATTENTE</th><th>EN RÉCUPÉRATION</th><th>MAJ</th></tr></thead><tbody>' + pres.map(ligne).join("")
            + (anc.length ? '<tr class="histsep"><td colspan="6">HISTORIQUE · ' + anc.length + " faction" + (anc.length > 1 ? "s" : "") + " à 0 % : elle" + (anc.length > 1 ? "s ne sont" : " n’est") + " plus dans le système, EDSM et Spansh " + (anc.length > 1 ? "les" : "la") + " gardent en mémoire. La date de leur départ n’est pas connue.</td></tr>" + anc.map(ligneHist).join("") : "")
            + "</tbody></table>"
            + (ecart != null ? '<div class="sf-note">Écart entre ' + E(nous) + " et la meilleure faction rivale présente (" + E(rival.name) + ") : <b style=\"color:" + (ecart >= 0 ? "#00FF66" : "#FF4D4D") + "\">" + (ecart >= 0 ? "+" : "") + ecart.toFixed(1) + " points</b>.</div>" : "");
    }
    // Fenetre generique : opts = { petit, titre (HTML), badges (HTML), sections (HTML), liens (HTML), apres (fonction appelee avec l'element) }. Utilisee par la fiche d'un systeme et par la carte galactique.
    function modale(o) {
        fermer(); style();
        voile = document.createElement("div"); voile.id = "sf-voile";
        voile.addEventListener("click", e => { if (e.target === voile || e.target.closest("[data-x]")) fermer(); });
        voile.innerHTML = '<div class="sf-mod" role="dialog" aria-modal="true"><div class="sf-mh"><div><small>' + (o.petit || "") + "</small><b>" + (o.titre || "") + '</b><div class="sf-bd">' + (o.badges || "") + '</div></div><button type="button" class="sf-x" data-x="1">FERMER</button></div>'
            + (o.sections || "") + (o.liens ? '<div class="sf-sec">' + o.liens + "</div>" : "") + "</div>";
        document.body.appendChild(voile); document.addEventListener("keydown", surTouche);
        if (o.apres) { try { o.apres(voile); } catch (e) { /* la fenetre reste utilisable */ } }
        return voile;
    }
    async function ouvrirFiche(r, extra) {
        const colo = r[C.colo] === 1, archi = r[C.archi], mb = r[C.membre] === 1;
        const badges = (r[C.ctrl] === 2 ? '<span class="sf-ty" style="color:#00F0FF">CIBLE</span> ' : "") + (r[C.ctrl] === 0 ? '<span class="sf-ty" style="color:#8b97a0">NON CONTRÔLÉE</span> ' : "") + (colo ? '<span class="sf-ty" style="color:#FFB44D">COLONIE</span> ' : "") + (r[C.dir] ? '<span class="sf-ty" style="color:#FF7100">DIRECTIVE ACTIVE</span> ' : "") + (r[C.camp] ? '<span class="sf-ty" style="color:#FF4FD8">CAMPAGNE · ' + E(String(r[C.camp]).toUpperCase()) + "</span> " : "") + (r[C.conf] ? '<span class="sf-ty" style="color:#FF4D4D">CONFLIT RÉCENT</span> ' : "") + (r[C.pui] ? '<span class="sf-ty" style="color:#b8a0ff">PP · ' + E(String(r[C.pui]).toUpperCase()) + "</span>" : "");
        const case_ = (t, v, al) => '<div class="sf-case' + (al ? " alerte" : "") + '"><small>' + t + "</small><b>" + v + "</b></div>";
        const sections = (extra || "")
            + '<div class="sf-sec"><h4>NOTRE FACTION</h4><div class="sf-grille">'
            + case_("INFLUENCE", r[C.infl] == null ? "non relevée" : r[C.infl].toFixed(1) + " %" + '<small style="display:block;color:#7d8a92;font-size:.7em;margin-top:3px">' + ilYaH(r[C.age]) + "</small>", r[C.age] > 168)
            + case_("ÉTATS", chipsEtats(r[C.etats]) || "—")
            + case_("FACTIONS", r[C.nbf] == null ? "—" : r[C.nbf])
            + case_("DONNÉE SPANSH", r[C.sp] == null ? "—" : ilYaH(r[C.sp] * 24), r[C.sp] > 21) + (distTxt(r) ? case_("DISTANCE", distTxt(r)) : "") + "</div></div>"
            + (colo ? '<div class="sf-sec"><h4>COLONIE</h4><div class="sf-grille">'
                + case_("ARCHITECTE", archi ? pilote(archi, 30) : "inconnu")
                + case_("MEMBRE DE L’ESCADRON", archi ? (mb ? '<span style="color:#00FF66">OUI</span>' : '<span style="color:#8b97a0">NON (ancien membre ou extérieur)</span>') : "—")
                + case_("CHANTIERS EN COURS", r[C.chant] || "0") + "</div>"
                + (archi ? "" : '<div class="sf-note">L’architecte n’est connu que lorsque le plugin d’un pilote a relevé la revendication du système.</div>') + "</div>" : "")
            + '<div class="sf-sec"><h4>SITUATION EN DIRECT (EDSM)</h4><div class="sf-fd"><div class="sf-vide">Chargement des factions…</div></div></div>';
        const v = modale({ petit: "SYSTÈME · " + E(DATA && DATA.faction || "").toUpperCase(), titre: lieu(r[C.nom]), badges: badges, sections: sections,
            liens: '<a class="sf-lien" href="bgs.html">PAGE BGS</a>' + (colo ? '<a class="sf-lien" href="colonisation.html">PAGE COLONISATION</a>' : "") });
        const zone = v.querySelector(".sf-fd");
        try { zone.innerHTML = tableauFactions(await edsm(r[C.nom])); } catch (e) { zone.innerHTML = '<div class="sf-vide">EDSM est injoignable pour le moment. Les chiffres ci-dessus restent ceux du serveur.</div>'; }
    }

    // ---- montage ----
    async function monter(el) {
        style(); if (!el) return;
        el.className = "sf bloc cy"; el.style.padding = "14px 18px";
        el.innerHTML = '<div class="sf-vide">Chargement des systèmes…</div>';
        try {
            if (window.EDTEAMPhotos) { try { await window.EDTEAMPhotos.charger(false); } catch (e) { /* initiales a la place */ } }
            const d = await charger();
            if (!d) { el.style.display = "none"; return; }                   // pas d'escadron : rien a montrer
            DATA = d;
            if (!d.faction || !Array.isArray(d.s) || !d.s.length) { el.innerHTML = '<div class="sf-h"><h2>Systèmes de la faction défendue</h2></div><div class="sf-vide">La faction défendue de votre escadron n’est pas encore suivie : le tableau apparaîtra dès que son suivi sera en place.</div>'; return; }
            const cnt = f => d.s.filter(f[2]).length;
            el.innerHTML = '<div class="sf-h"><h2>Systèmes de ' + E(d.faction) + '</h2><em>où nous sommes, qui a colonisé quoi</em><span class="sf-n"></span></div>'
                + '<div class="sf-bar">' + FILTRES.map(f => '<button type="button" data-f="' + f[0] + '">' + f[1] + "<i>" + cnt(f) + "</i></button>").join("") + "</div>"
                + '<div class="sf-outils"><div class="sf-ref"></div><input type="search" placeholder="Rechercher un système ou un architecte…" aria-label="Rechercher" autocomplete="off" spellcheck="false"></div><div class="sf-cadre"></div>'
                + '<div class="sf-leg"><span><i style="background:#00FF66"></i> colonie dont l’architecte est un membre de l’escadron</span><span><i style="background:#00F0FF"></i> cible (directive ou campagne active, système non contrôlé)</span><span><i style="background:#8b97a0"></i> colonie non contrôlée</span><span><b class="sf-c">C</b> campagne en cours</span></div>'
                + '<div class="sf-note">Clic sur une ligne : la fiche du système. Liste mise à jour chaque jour' + (d.maj ? " (dernière mise à jour " + ilYaH((Date.now() - new Date(d.maj).getTime()) / 3600000) + ")" : "") + ". L’influence n’est connue que pour les systèmes relevés récemment (directives, Boom) : sinon « non relevée ». L’architecte n’est connu que si le plugin d’un pilote a relevé la revendication.</div>";
            el.querySelector(".sf-bar").addEventListener("click", e => { const b = e.target.closest("[data-f]"); if (b) { etat.f = b.dataset.f; dessiner(el); } });
            el.querySelector(".sf-outils input").addEventListener("input", e => { etat.q = e.target.value; dessiner(el); });
            el.addEventListener("click", e => {
                const th = e.target.closest("th[data-t]"); if (th) { const t = th.dataset.t; etat.sens = etat.tri === t ? -etat.sens : 1; etat.tri = t; dessiner(el); return; }
                if (e.target.closest(".edteam-lieu")) return;                  // un clic sur le nom copie le systeme (copier-lieux.js) sans ouvrir la fiche
                const tr = e.target.closest("tr[data-i]"); if (tr) ouvrirFiche(DATA.s[+tr.dataset.i]);
            });
            el.querySelector(".sf-ref").addEventListener("click", e => { const b = e.target.closest("[data-r]"); if (b && !b.disabled) { REF.mode = b.dataset.r; majRef(el); dessiner(el); } });
            dessiner(el); majRef(el); chargerRefs(el);
        } catch (e) {
            console.error("Systemes :", e);
            el.innerHTML = '<div class="sf-h"><h2>Systèmes de la faction défendue</h2></div><div class="sf-vide">' + (absente(e) ? "Le tableau des systèmes n’est pas encore activé sur le serveur." : "Impossible de lire les systèmes pour le moment.") + "</div>";
        }
    }
    window.EdteamSystemes = { monter, fermer };
})();
