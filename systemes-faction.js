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
    const VERSION_ATTENDUE = 6, CLE = "edteam_sysfac_v5", DUREE = 3600000, CLE_EDSM = "edteam_sysfac_edsm_v1_", DUREE_EDSM = 1800000;
    // colonnes d'une ligne du serveur
    const C = { nom: 0, ctrl: 1, colo: 2, archi: 3, membre: 4, infl: 5, etats: 6, age: 7, nbf: 8, dir: 9, chant: 10, conf: 11, pui: 12, sp: 13, x: 14, y: 15, z: 16, camp: 17, vari: 18, pale: 19, src: 20 };   // src : origine de l'influence (0 pilote ou EDSM, 1 releve d'installations, 2 Spansh)
    const FILTRES = [
        ["controles", "TOUS LES SYSTÈMES SUIVIS", r => r[C.ctrl] >= 1 || !!survDe(r)],
        ["surveilles", "SURVEILLÉS", r => !!survDe(r)],
        ["alertes", "EN ALERTE", r => { const v = survDe(r); return !!v && alertes(v).niv >= 1; }],
        ["colonies", "COLONIES", r => r[C.ctrl] === 1 && r[C.colo] === 1],
        ["membres", "COLONIES DE MEMBRES", r => r[C.membre] === 1],
        ["directives", "DIRECTIVE ACTIVE", r => r[C.dir] === 1],
        ["campagnes", "EN CAMPAGNE", r => !!r[C.camp]],
        ["conflits", "EN CONFLIT", r => r[C.conf] === 1],
        ["chantiers", "CHANTIERS EN COURS", r => r[C.chant] > 0],
        ["cibles", "CIBLES", r => r[C.ctrl] === 2],
        ["non", "COLONIES NON CONTRÔLÉES", r => r[C.ctrl] === 0]
    ];
    const PRINCIPAUX = ["controles", "surveilles", "alertes", "colonies", "membres"];   // les autres filtres sont derriere « + FILTRES »
    let DATA = null, BRUT = null, EL = null, SURV = null, SM = new Map(), etat = { f: "controles", q: "", tri: "nom", sens: 1, plus: false, add: false, nb: 48 };
    // MODE CARTES : le tableau est remplace par une grille de CARTES (lisible au toucher, pas de colonnes ecrasees), avec un selecteur de tri et la suite a la demande
    // AFFICHAGE : « auto » = cartes jusqu'a 1600 px de large (tablettes, portables), tableau au-dela ; le pilote peut forcer l'un ou l'autre (memoire sur l'appareil, commune a Systemes et Fleet Carriers)
    const CLE_VUE = "edteam_vue_esc";
    const vuePref = () => { try { const v = localStorage.getItem(CLE_VUE); return v === "cartes" || v === "tableau" ? v : "auto"; } catch (e) { return "auto"; } };
    const tablette = () => { const p = vuePref(); return p === "cartes" ? true : p === "tableau" ? false : !!(window.matchMedia && window.matchMedia("(max-width: 1600px)").matches); };
    const boutonsVue = () => '<span class="vue-sel" role="group" aria-label="Affichage"><button type="button" data-vue="tableau" class="' + (!tablette() ? "on" : "") + '" title="Afficher en tableau">☰ TABLEAU</button><button type="button" data-vue="cartes" class="' + (tablette() ? "on" : "") + '" title="Afficher en cartes">▦ CARTES</button></span>';
    const choisirVue = v => { try { localStorage.setItem(CLE_VUE, v); } catch (e) { /* tant pis */ } window.dispatchEvent(new Event("edteam-vue")); };


    const CSS = `
.sf{font-family:'Share Tech Mono',monospace;margin:0 0 14px;--c:#00F0FF}
.sf *{box-sizing:border-box}
.sf-h{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin:0 0 10px}
.sf-h h2{margin:0;color:var(--c);font-size:1.05em;letter-spacing:3px;font-weight:normal;text-transform:uppercase}
.sf-h em{color:#8b97a0;font-size:.74em;font-style:normal;letter-spacing:1px}
.sf-n{margin-left:auto;color:#8b97a0;font-size:.78em;letter-spacing:1px}
.sf-bar{margin:0 0 10px;display:flex;flex-direction:column;gap:7px}.sf-bar1,.sf-bar2{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.sf-bar2{padding:8px 10px;border:1px dashed #2a3a40;background:rgba(0,240,255,.03)}
.sf-bar button{background:transparent;border:1px solid #3a474d;color:#aab7bd;font:inherit;font-size:.72em;letter-spacing:1.5px;padding:6px 13px;cursor:pointer}
.sf-bar button.on{border-color:var(--c);color:#fff;background:rgba(0,240,255,.12)}
.sf-bar button i{font-style:normal;color:#7d8a92;margin-left:6px}.sf-bar button.on i{color:#9ee}
.sf-bar button.rouge i{color:#FF5C5C}.sf-grille-c{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:10px}
.sf-cd{display:flex;flex-direction:column;gap:7px;padding:11px 14px 11px 12px;border:1px solid #1d2a30;border-left:4px solid var(--k,#00F0FF);background:linear-gradient(90deg,color-mix(in srgb,var(--k,#00F0FF) 8%,transparent),rgba(255,255,255,.02) 60%);cursor:pointer;min-width:0}
.sf-cd:active{background:linear-gradient(90deg,color-mix(in srgb,var(--k,#00F0FF) 20%,transparent),rgba(255,255,255,.04) 60%)}
.sf-cd.a1{--k:#FFB000}.sf-cd.a2{--k:#FF4D4D}.sf-cd.sv0{--k:#B07CFF}.sf-cd.mb{--k:#00FF66}.sf-cd.cib{--k:#00F0FF}.sf-cd.non{--k:#6a7378}
.sf-cd.sv1{animation:sfPulse1 2.2s ease-in-out infinite}.sf-cd.sv2{animation:sfPulse2 1.2s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.sf-cd.sv1,.sf-cd.sv2{animation:none}}
.sf-cd1{display:flex;align-items:center;gap:8px;min-width:0}.sf-cd1 .sf-nom{font-size:1.02em;flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis}.sf-cd1 .sf-oeil{flex:none}.sf-cd1 .sf-inf{flex:none;text-align:right;margin-left:auto}
.sf-cd2{display:flex;flex-wrap:wrap;gap:5px;align-items:center;font-size:.72em;letter-spacing:1px}
.sf-cd3{display:flex;align-items:center;justify-content:space-between;gap:10px;color:#8b97a0;font-size:.78em;min-width:0}.sf-cd3 .sf-pil{min-width:0}.sf-cdd{flex:none;color:#00F0FF;letter-spacing:1px}
.sf-plus{display:block;width:100%;margin:12px 0 0;padding:14px;background:rgba(0,240,255,.08);border:1px solid rgba(0,240,255,.4);color:#9fe9f2;font:inherit;font-size:.8em;letter-spacing:2px;cursor:pointer}
.sf-vue{margin-left:auto}.vue-sel{display:inline-flex;gap:0}.vue-sel button{background:transparent;border:1px solid #3a474d;color:#aab7bd;font:inherit;font-size:.7em;letter-spacing:1.5px;padding:7px 12px;cursor:pointer}.vue-sel button+button{border-left:0}.vue-sel button.on{border-color:var(--c,#00F0FF);color:#fff;background:rgba(0,240,255,.14)}
.sf-tri{background:#05080c;border:1px solid #3a474d;color:#dfe9ec;font:inherit;font-size:.74em;letter-spacing:1px;padding:8px 10px}
.sf-fl{display:inline-block;margin-left:8px;font-size:.82em;letter-spacing:.5px;white-space:nowrap}.sf-fl.pale{opacity:.6}.sf-fl em{font-style:normal;color:#7d8a92;font-size:.78em;margin-left:5px}.sf-bar button.plus{border-style:dashed;color:#9fe9f2;margin-left:auto}
.sf-outils{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:0 0 10px;padding:8px 0;border-top:1px solid #1d2a30;border-bottom:1px solid #1d2a30}.sf-outils .sf-ref{flex:1 1 360px;margin:0}
.sf-addbtn{margin-left:0;background:rgba(176,124,255,.08);border:1px solid #6b4fb0;color:#d9c7ff;font:inherit;font-size:.72em;letter-spacing:2px;padding:7px 14px;cursor:pointer}.sf-addbtn.on{border-color:#B07CFF;background:rgba(176,124,255,.18);color:#fff}
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
.sf-bar button.reg{margin-left:auto;border-color:#FFB000;color:#FFB000}.sf-bar button.reg:hover{background:rgba(255,176,0,.12);color:#fff}.sf-regl{background:transparent;border:1px solid #3a474d;color:#aab7bd;font:inherit;font-size:1em;letter-spacing:1.5px;padding:2px 10px;cursor:pointer}.sf-regl:hover,.sf-regl.on{border-color:#FFB000;color:#fff}.sf-rgs{display:flex;flex-direction:column;gap:12px}.sf-rg{display:flex;align-items:center;justify-content:space-between;gap:16px;color:#cfd8dc;font-size:.9em}.sf-rg small{display:block;color:#7d8a92;font-size:.8em;margin-top:2px}.sf-rg input{width:90px;flex:none;background:#0b1013;border:1px solid #3a474d;color:#fff;padding:6px 8px;font:inherit}.sf-rgb{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:16px}.sf-rgm{color:#ffb000;font-size:.82em}
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
/* SURVEILLANCE (SQL 193) : l'oeil, les alertes clignotantes (orange / rouge), l'ajout a la main */
.sf-tab th.sf-oeil-th{width:36px;padding:0}
.sf-tab td.sf-oeil{width:36px;padding:0 0 0 10px;text-align:center}
.sf-oeil button,.sf-oeil span{background:transparent;border:0;padding:3px;margin:0;cursor:pointer;color:#55606a;line-height:0;display:inline-block}
.sf-oeil span{cursor:default}
.sf-oeil svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.sf-oeil:not(.on) button svg{opacity:.4}.sf-oeil button:hover{color:#B07CFF}.sf-oeil:not(.on) button:hover svg{opacity:1}
.sf-oeil.on button,.sf-oeil.on span{color:#B07CFF}
.sf-tab tr.sv td:first-child{box-shadow:inset 3px 0 0 #B07CFF}
.sf-tab tr.sv1 td:first-child{box-shadow:inset 3px 0 0 #FFB000}.sf-tab tr.sv2 td:first-child{box-shadow:inset 3px 0 0 #FF4D4D}
.sf-tab tr.sv1 td{animation:sfPulse1 2.2s ease-in-out infinite}.sf-tab tr.sv2 td{animation:sfPulse2 1.2s ease-in-out infinite}
@keyframes sfPulse1{0%,100%{background:rgba(255,176,0,.03)}50%{background:rgba(255,176,0,.17)}}
@keyframes sfPulse2{0%,100%{background:rgba(255,77,77,.04)}50%{background:rgba(255,77,77,.22)}}
@media (prefers-reduced-motion:reduce){.sf-tab tr.sv1 td{animation:none;background:rgba(255,176,0,.08)}.sf-tab tr.sv2 td{animation:none;background:rgba(255,77,77,.1)}.sf-al.n1,.sf-al.n2{animation:none!important}}
.sf-al{display:inline-block;margin:0 4px 2px 0;padding:0 6px;font-size:.7em;letter-spacing:1px;border:1px solid currentColor;white-space:nowrap}
.sf-al.sv{color:#B07CFF}.sf-al.n0{color:#8b97a0}.sf-al.n1{color:#FFB000;animation:sfClin 2.2s ease-in-out infinite}.sf-al.n2{color:#FF4D4D;animation:sfClin 1.2s ease-in-out infinite}
@keyframes sfClin{0%,100%{opacity:1}50%{opacity:.45}}
.sf-add{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 10px;font-size:.72em;letter-spacing:1.5px;color:#9a86d6}
.sf-add input{flex:0 1 420px;min-width:300px;background:#05080c;border:1px solid #4a3f6b;color:#dfe9ec;font:inherit;font-size:1.05em;padding:6px 10px;letter-spacing:1px}.sf-add input:focus{outline:none;border-color:#B07CFF}
.sf-add button{background:rgba(176,124,255,.1);border:1px solid #B07CFF;color:#d9c7ff;font:inherit;letter-spacing:2px;padding:6px 14px;cursor:pointer}.sf-add button:disabled{opacity:.5;cursor:default}
.sf-add .sf-msg{color:#d9c7ff}.sf-add .sf-nb{margin-left:auto;color:#7d8a92}
@media (max-width:760px){.sf-grille{grid-auto-flow:row;grid-template-columns:repeat(2,minmax(0,1fr))}.sf-tab th:nth-child(n+5),.sf-tab td:nth-child(n+5){display:none}.sf-tab.sf-av th:nth-child(n+6),.sf-tab.sf-av td:nth-child(n+6){display:none}.sf-tab.sf-av th:nth-child(5),.sf-tab.sf-av td:nth-child(5){display:table-cell}.sf-outils input{flex:1 1 100%}}
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

    // ---- SURVEILLANCE (SQL 193) : l'etat-major (Amiral, officiers, Directeur) surveille des systemes ; TOUS les membres voient l'oeil et les alertes ----
    // Une lecture serveur (surveillance_lire, quelques Ko), gardee 10 minutes dans l'onglet, relue apres chaque ajout / retrait. Sans le SQL 193 : aucune surveillance, le tableau marche comme avant.
    const CLE_SURV = "edteam_surv_v1", DUREE_SURV = 600000;
    const OEIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></svg>';
    const REFUS = { droits: "Réservé à l’Amiral, aux officiers et au Directeur.", plafond: "40 systèmes surveillés au maximum : retirez-en un d’abord.", nom: "Nom de système invalide.", acces: "Action impossible pour ce compte.", connexion: "Reconnectez-vous." };
    async function chargerSurv(force) {
        SURV = null;
        try {
            const uid = await moi();
            if (!force) { try { const c = JSON.parse(sessionStorage.getItem(CLE_SURV) || "null"); if (c && c.u === uid && Date.now() - c.ts < DUREE_SURV) { SURV = c.d; return; } } catch (e) { /* pas de memoire */ } }
            const r = await window.supabaseApp.rpc("surveillance_lire");
            if (r.error || !r.data || !Array.isArray(r.data.liste)) return;
            SURV = r.data;
            try { sessionStorage.setItem(CLE_SURV, JSON.stringify({ ts: Date.now(), u: uid, d: SURV })); } catch (e) { /* tant pis */ }
        } catch (e) { SURV = null; }
    }
    const survDe = r => SM.get(String(r[C.nom]).toLowerCase());
    // la liste du serveur + les systemes surveilles qui n'y sont PAS (ajoutes a la main : type 3 « SURVEILLE »)
    function preparer(d) {
        SM = new Map(); const liste = (SURV && SURV.liste) || [];
        liste.forEach(s => SM.set(String(s.s).toLowerCase(), s));
        const connus = new Set(d.s.map(r => String(r[C.nom]).toLowerCase())), extra = [];
        liste.forEach(s => { if (!connus.has(String(s.s).toLowerCase())) extra.push([s.s, 3, 0, null, 0, null, null, null, null, 0, 0, 0, null, null, s.x, s.y, s.z, null]); });
        return Object.assign({}, d, { s: d.s.concat(extra) });
    }
    // les alertes d'un systeme surveille : rouge (n 2) = guerre, election, donnee de plus de 2 x la limite ; orange (n 1) = baisse d'influence, donnee de plus de la limite ;
    // FACTION SUR LE DEPART (SQL 198) : ORANGE qui clignote sous le seuil de depart (3 %), ROUGE qui clignote sous le seuil rouge (2,5 %), les deux reglables par le Directeur ; gris (n 0) = pas de releve
    function alertes(s) {
        const reg = (SURV && SURV.reglages) || {}, lim = Number(reg.age_surv_h) || 12, seuilB = Number(reg.surv_baisse_pts) || 1, l = [];
        const seuilD = Number(reg.surv_depart_pct) || 3, seuilC = Number(reg.surv_depart_clign_pct) || 2.5;
        if (s.g) l.push({ t: "GUERRE", n: 2 });
        if (s.e) l.push({ t: "ÉLECTION", n: 2 });
        if (s.dn && Number(s.di) < seuilD) l.push({ t: "DÉPART IMMINENT · " + String(s.dn).toUpperCase() + " " + s.di + " %" + (s.dv ? " (NOUS)" : ""), n: Number(s.di) < seuilC ? 2 : 1 });
        if (s.b != null && Number(s.b) >= seuilB) l.push({ t: "▼ INFLUENCE −" + Number(s.b).toFixed(1) + " PT / 24 H", n: 1 });
        if (s.d == null) l.push({ t: "NON RELEVÉ", n: 0 });
        else { const h = (Date.now() / 1000 - s.d) / 3600; if (h > 2 * lim) l.push({ t: "DONNÉE " + Math.round(h) + " H", n: 2 }); else if (h > lim) l.push({ t: "DONNÉE " + Math.round(h) + " H", n: 1 }); }
        return { l: l, niv: l.reduce((m, x) => Math.max(m, x.n), 0) };
    }
    const clsAl = x => 'sf-al n' + x.n;
    const chipsSurv = al => '<span class="sf-al sv" title="Système surveillé par l’état-major de l’escadron">SURVEILLÉ</span>' + al.l.map(x => '<span class="' + clsAl(x) + '">' + E(x.t) + "</span>").join("");
    const ORIGINE = r => r[C.src] === 2 ? "Spansh" : r[C.src] === 1 ? "relevé d’installations" : "pilote ou EDSM";
    // evolution de l'influence de notre faction (SQL 199) : fleche verte = gain, rouge = perte, grise = inchangee ; fond net = depuis le dernier tick, pale (« 48 h ») = aucune mesure depuis le tick
    function fleche(r) {
        const v = r[C.vari]; if (v == null || r[C.infl] == null) return "";
        const col = v > 0 ? "#00FF66" : v < 0 ? "#FF5C5C" : "#8b97a0", pale = r[C.pale] === 1;
        return '<span class="sf-fl' + (pale ? " pale" : "") + '" style="color:' + col + '" title="' + (pale ? "Variation de notre influence sur 48 h (aucune mesure depuis le dernier tick)" : "Variation de notre influence depuis le dernier tick") + '">' + (v > 0 ? "▲ +" : v < 0 ? "▼ −" : "= ") + Math.abs(v).toFixed(1).replace(".", ",") + (pale ? "<em>48 h</em>" : "") + "</span>";
    }
    function celluleOeil(i, sv) {
        if (!SURV) return "";
        if (SURV.peut) return '<td class="sf-oeil' + (sv ? " on" : "") + '"><button type="button" data-oeil="' + i + '" title="' + (sv ? "Surveillé par l’état-major : cliquer pour arrêter" : "Surveiller ce système") + '" aria-label="' + (sv ? "Arrêter la surveillance" : "Surveiller ce système") + '">' + OEIL + "</button></td>";
        return '<td class="sf-oeil' + (sv ? " on" : "") + '">' + (sv ? '<span title="Système surveillé par l’état-major de l’escadron">' + OEIL + "</span>" : "") + "</td>";
    }
    function msgSurv(el, t) { const m = el && el.querySelector(".sf-add .sf-msg"); if (m) m.textContent = t || ""; }
    async function rafraichirSurv(el) {
        try { sessionStorage.removeItem(CLE_SURV); } catch (e) { /* rien */ }
        await chargerSurv(true); DATA = preparer(BRUT); dessiner(el); majAjout(el);
    }
    async function envoyerSurv(el, nom, actif, p) {
        try {
            const a = { p_systeme: nom, p_actif: actif }; if (actif && p) { a.p_x = p[0]; a.p_y = p[1]; a.p_z = p[2]; }
            const res = await window.supabaseApp.rpc("surveillance_basculer", a);
            if (res.error) throw new Error(res.error.message || "erreur");
            const j = res.data || {};
            if (!j.ok) { msgSurv(el, REFUS[j.raison] || "Refusé."); return false; }
            await rafraichirSurv(el); msgSurv(el, actif ? "Système surveillé." : "Surveillance arrêtée.");
            return true;
        } catch (e) { console.error("Surveillance :", e); msgSurv(el, absente(e) ? "La surveillance n’est pas encore activée sur le serveur." : "Impossible pour le moment."); return false; }
    }
    async function basculer(r, el) {
        if (!SURV || !SURV.peut) return;
        const sv = survDe(r);
        msgSurv(el, sv ? "Arrêt de la surveillance…" : "Ajout…");
        return envoyerSurv(el, String(r[C.nom]), !sv, r[C.x] != null ? [r[C.x], r[C.y], r[C.z]] : null);
    }
    // ajout A LA MAIN d'un systeme (controle ou non par la faction defendue) : le nom est verifie dans la liste, sinon dans EDSM, directement depuis le navigateur
    async function ajouterManuel(el, texte) {
        const nom = String(texte || "").trim(); if (!nom) return;
        if (SM.has(nom.toLowerCase())) { msgSurv(el, "Ce système est déjà surveillé."); return; }
        msgSurv(el, "Vérification du nom…");
        let canon = nom, p = null;
        const local = BRUT && BRUT.s.find(x => String(x[C.nom]).toLowerCase() === nom.toLowerCase());
        if (local) { canon = local[C.nom]; if (local[C.x] != null) p = [local[C.x], local[C.y], local[C.z]]; }
        else {
            try {
                const u = await fetch("https://www.edsm.net/api-v1/systems?showCoordinates=1&systemName[]=" + encodeURIComponent(nom)), a = await u.json();
                const t = (Array.isArray(a) ? a : []).find(x => x && String(x.name).toLowerCase() === nom.toLowerCase());
                if (!t) { msgSurv(el, "Système introuvable dans EDSM : vérifiez l’orthographe."); return; }
                canon = t.name; if (t.coords) p = [Number(t.coords.x), Number(t.coords.y), Number(t.coords.z)];
            } catch (e) { msgSurv(el, "EDSM est injoignable : réessayez dans un instant."); return; }
        }
        msgSurv(el, "Ajout…");
        const ok = await envoyerSurv(el, canon, true, p);
        if (ok) { const i = el.querySelector(".sf-add input"); if (i) i.value = ""; }
    }
    function majAjout(el) {
        const z = el.querySelector(".sf-add"); if (!z) return;
        const bb = el.querySelector(".sf-addbtn");
        if (!SURV || !SURV.peut) { z.style.display = "none"; z.innerHTML = ""; delete z.dataset.pret; if (bb) bb.style.display = "none"; return; }
        if (bb) { bb.style.display = ""; bb.textContent = "◉ SURVEILLER UN SYSTÈME · " + ((SURV.liste || []).length) + " / 40"; bb.classList.toggle("on", !!etat.add); }
        if (!z.dataset.pret) {
            z.dataset.pret = "1";
            z.innerHTML = '<span>◉ SURVEILLER UN SYSTÈME</span><input type="text" maxlength="80" placeholder="Nom du système (même hors de notre faction)" aria-label="Système à surveiller" autocomplete="off" spellcheck="false"><button type="button" data-aj="1">AJOUTER</button><span class="sf-msg"></span><span class="sf-nb"></span>';
            const go = async () => { const b = z.querySelector("button"), i = z.querySelector("input"); b.disabled = true; await ajouterManuel(el, i.value); b.disabled = false; };
            z.querySelector("button").addEventListener("click", go);
            z.querySelector("input").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); go(); } });
        }
        z.style.display = etat.add ? "" : "none"; z.querySelector(".sf-nb").textContent = ((SURV.liste || []).length) + " / 40";
    }
    // section « SURVEILLANCE » de la fiche d'un systeme
    function sectionSurv(r) {
        if (!SURV) return "";
        const sv = survDe(r), peut = SURV.peut; if (!sv && !peut) return "";
        const cs = (t, v) => '<div class="sf-case"><small>' + t + "</small><b>" + v + "</b></div>";
        let h = '<div class="sf-sec"><h4>SURVEILLANCE</h4>';
        if (sv) {
            const al = alertes(sv);
            h += '<div class="sf-grille">' + cs("SURVEILLÉ PAR", sv.par ? "CMDR " + E(String(sv.par).toUpperCase()) + '<small style="display:block;color:#7d8a92;font-size:.7em;margin-top:3px">' + ilYaS(sv.le) + "</small>" : "l’état-major")
                + cs("DERNIER RELEVÉ (SERVEUR)", sv.d == null ? "non relevé" : ilYaS(sv.d)) + cs("ALERTES", al.l.filter(x => x.n > 0 || x.t === "NON RELEVÉ").length ? al.l.map(x => '<span class="' + clsAl(x) + '">' + E(x.t) + "</span>").join("") : '<span style="color:#2fe0a8">AUCUNE</span>') + "</div>";
        } else h += '<div class="sf-note" style="margin:0 0 8px">Ce système n’est pas surveillé.</div>';
        if (peut) h += '<div style="margin-top:10px"><button type="button" class="sf-lien" data-sv-bascule="1" style="background:transparent;cursor:pointer;font:inherit;letter-spacing:2px">' + (sv ? "ARRÊTER LA SURVEILLANCE" : "SURVEILLER CE SYSTÈME") + '</button><span class="sf-note" data-sv-msg="1" style="margin-left:6px"></span></div>';
        return h + "</div>";
    }
    function brancherFicheSurv(v, r) {
        const b = v.querySelector("[data-sv-bascule]"); if (!b) return;
        b.onclick = async () => { b.disabled = true; await basculer(r, EL); fermer(); };
    }

    // ---- tableau ----
    function lignesVisibles() {
        const f = FILTRES.find(x => x[0] === etat.f) || FILTRES[0], q = etat.q.trim().toLowerCase();
        let l = DATA.s.filter(f[2]);
        if (q) l = l.filter(r => String(r[C.nom]).toLowerCase().indexOf(q) >= 0 || String(r[C.archi] || "").toLowerCase().indexOf(q) >= 0);
        const idx = { nom: C.nom, infl: C.infl, archi: C.archi, nbf: C.nbf }[etat.tri] || C.nom, s = etat.sens, val = r => etat.tri === "dist" ? distDe(r) : r[idx];
        if (etat.tri === "alerte") return l.slice().sort((a, b) => (alertes(survDe(b) || { d: 1 }).niv * (survDe(b) ? 1 : 0) - alertes(survDe(a) || { d: 1 }).niv * (survDe(a) ? 1 : 0)) || String(a[C.nom]).localeCompare(String(b[C.nom]), "fr"));
        l = l.slice().sort((a, b) => {
            const x = val(a), y = val(b);
            if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1;       // les valeurs absentes en dernier, quel que soit le sens
            return (typeof x === "number" ? x - y : String(x).localeCompare(String(y), "fr")) * s;
        });
        if (etat.f === "surveilles" && etat.tri === "nom" && etat.sens > 0) l = l.slice().sort((a, b) => (alertes(survDe(b)).niv - alertes(survDe(a)).niv) || String(a[C.nom]).localeCompare(String(b[C.nom]), "fr"));
        return l;
    }
    function ligne(r, i) {
        const colo = r[C.colo] === 1, archi = r[C.archi], mb = r[C.membre] === 1;
        const type = r[C.ctrl] === 3 ? '<span class="sf-ty" style="color:#B07CFF" title="Système ajouté à la main par l’état-major : hors de la liste de la faction défendue">SURVEILLÉ</span>' : r[C.ctrl] === 2 ? '<span class="sf-ty" style="color:#00F0FF" title="Système visé par une directive ou une campagne active, que notre faction ne contrôle pas">CIBLE</span>' : r[C.ctrl] === 0 ? '<span class="sf-ty" style="color:#8b97a0">NON CONTRÔLÉE</span>' : colo ? '<span class="sf-ty" style="color:#FFB44D">COLONIE</span>' : '<span class="sf-inc">—</span>';
        const arch = archi ? pilote(archi) + (mb ? "" : '<small style="color:#8b97a0;display:block;margin-left:34px">hors escadron</small>') : colo ? '<span class="sf-inc">inconnu</span>' : '<span class="sf-inc">—</span>';
        const inf = r[C.infl] == null ? '<span class="sf-inc">non relevée</span>' : '<div class="sf-inf"><b>' + r[C.infl].toFixed(1) + ' %</b>' + fleche(r) + '<small class="' + (r[C.age] > 72 ? "sf-vieux" : "") + '" title="Origine : ' + ORIGINE(r) + '">' + ilYaH(r[C.age]) + (r[C.src] === 2 ? " · Spansh" : "") + "</small></div>";
        const sv = survDe(r), al = sv ? alertes(sv) : null, not = (sv ? chipsSurv(al) : "") + (r[C.dir] ? '<span style="color:#FF7100">DIRECTIVE</span>' : "") + (r[C.conf] ? '<span style="color:#FF4D4D">CONFLIT</span>' : "") + (r[C.chant] ? '<span style="color:#FFD700">CHANTIERS ×' + r[C.chant] + "</span>" : "") + (r[C.pui] ? '<span style="color:#b8a0ff">' + "PP · " + E(String(r[C.pui]).toUpperCase()) + "</span>" : "");
        return '<tr data-i="' + i + '" class="' + (sv ? "sv sv" + al.niv + " " : "") + (r[C.ctrl] === 0 ? "non " : "") + (r[C.ctrl] === 2 ? "cib " : "") + (mb ? "mb" : "") + '">' + celluleOeil(i, sv) + '<td><span class="sf-nom">' + lieu(r[C.nom]) + "</span>" + (r[C.camp] ? ' <span class="sf-c" title="Campagne en cours : ' + E(r[C.camp]) + '">C</span>' : "") + "</td>" + celluleDist(r) + "<td>" + type + "</td><td>" + arch + "</td><td>" + inf + "</td><td>" + (chipsEtats(r[C.etats]) || '<span class="sf-inc">—</span>') + "</td><td>" + (r[C.nbf] == null ? "—" : r[C.nbf]) + '</td><td class="sf-not">' + (not || '<span class="sf-inc" style="border:0">—</span>') + "</td></tr>";
    }
    // CARTE (mode tablette) : meme contenu qu'une ligne du tableau, mis en page pour le toucher
    function carte(r, i) {
        const colo = r[C.colo] === 1, archi = r[C.archi], mb = r[C.membre] === 1, sv = survDe(r), al = sv ? alertes(sv) : null;
        const type = r[C.ctrl] === 3 ? '<span class="sf-ty" style="color:#B07CFF">SURVEILLÉ HORS FACTION</span>' : r[C.ctrl] === 2 ? '<span class="sf-ty" style="color:#00F0FF">CIBLE</span>' : r[C.ctrl] === 0 ? '<span class="sf-ty" style="color:#8b97a0">NON CONTRÔLÉE</span>' : colo ? '<span class="sf-ty" style="color:#FFB44D">COLONIE</span>' : "";
        const inf = r[C.infl] == null ? '<div class="sf-inf"><small>influence non relevée</small></div>' : '<div class="sf-inf"><b>' + r[C.infl].toFixed(1).replace(".", ",") + ' %</b>' + fleche(r) + '<small class="' + (r[C.age] > 72 ? "sf-vieux" : "") + '" title="Origine : ' + ORIGINE(r) + '">' + ilYaH(r[C.age]) + (r[C.src] === 2 ? " · Spansh" : "") + "</small></div>";
        const puces = (sv ? chipsSurv(al) : "") + type + (r[C.dir] ? '<span style="color:#FF7100">DIRECTIVE</span>' : "") + (r[C.conf] ? '<span style="color:#FF4D4D">CONFLIT</span>' : "") + (r[C.chant] ? '<span style="color:#FFD700">CHANTIERS ×' + r[C.chant] + "</span>" : "")
            + (r[C.pui] ? '<span style="color:#b8a0ff">PP · ' + E(String(r[C.pui]).toUpperCase()) + "</span>" : "") + chipsEtats(r[C.etats]);
        const cls = (al && al.niv >= 1 ? "a" + al.niv : al && al.niv === 0 ? "sv0" : mb ? "mb" : r[C.ctrl] === 2 ? "cib" : r[C.ctrl] === 0 ? "non" : "");
        const oeil = celluleOeil(i, sv).replace(/^<td/, "<div").replace(/<\/td>$/, "</div>"), d = distDe(r);
        return '<div class="sf-cd ' + cls + '" data-i="' + i + '"><div class="sf-cd1">' + oeil + '<span class="sf-nom">' + lieu(r[C.nom]) + "</span>" + (r[C.camp] ? ' <span class="sf-c" title="Campagne en cours : ' + E(r[C.camp]) + '">C</span>' : "") + inf + "</div>"
            + (puces ? '<div class="sf-cd2">' + puces + "</div>" : "")
            + '<div class="sf-cd3">' + (archi ? pilote(archi, 24) + (mb ? "" : '<small style="color:#8b97a0;margin-left:8px">hors escadron</small>') : '<span class="sf-inc">' + (colo ? "architecte inconnu" : (r[C.nbf] != null ? r[C.nbf] + " faction" + (r[C.nbf] > 1 ? "s" : "") : "")) + "</span>") + (d != null ? '<span class="sf-cdd">' + fmtDist(d) + " al</span>" : "") + "</div></div>";
    }
    function dessiner(el) {
        const l = lignesVisibles(), th = (t, lib) => '<th data-t="' + t + '" class="' + (etat.tri === t ? "tri" : "") + '">' + lib + (etat.tri === t ? (etat.sens > 0 ? " ▲" : " ▼") : "") + "</th>";
        { // bandeau de filtres : les principaux sur une ligne, les autres derriere « + FILTRES » (reste ouvert si l'un d'eux est actif)
            const dispo = FILTRES.filter(f => !((f[0] === "surveilles" || f[0] === "alertes") && !SURV)), ouvert = etat.plus || PRINCIPAUX.indexOf(etat.f) < 0;
            const bt = f => '<button type="button" data-f="' + f[0] + '" class="' + (etat.f === f[0] ? "on" : "") + (f[0] === "alertes" && DATA.s.some(r => { const v = survDe(r); return v && alertes(v).niv === 2; }) ? " rouge" : "") + '">' + f[1] + "<i>" + DATA.s.filter(f[2]).length + "</i></button>";
            el.querySelector(".sf-bar").innerHTML = '<div class="sf-bar1">' + dispo.filter(f => PRINCIPAUX.indexOf(f[0]) >= 0).map(bt).join("") + '<button type="button" class="plus" data-plus="1">' + (ouvert ? "− MOINS DE FILTRES" : "+ FILTRES") + "</button>" + (SURV && peutRegler() ? '<button type="button" class="reg" data-regl="1" title="Choisir les seuils des alertes de l’escadron">⚙ RÉGLER LES ALERTES</button>' : "") + "</div>"
                + (ouvert ? '<div class="sf-bar2">' + dispo.filter(f => PRINCIPAUX.indexOf(f[0]) < 0).map(bt).join("") + "</div>" : "");
        }
        el.querySelector(".sf-n").textContent = l.length + " système" + (l.length > 1 ? "s" : "");
        const modeT = tablette();
        { const vz = el.querySelector(".sf-vue"); if (vz) vz.innerHTML = boutonsVue(); }
        const selT = el.querySelector(".sf-tri"); if (selT) { selT.style.display = modeT ? "" : "none"; selT.value = etat.tri === "dist" && !refActive() ? "nom" : etat.tri; const od = selT.querySelector('option[value="dist"]'); if (od) od.style.display = refActive() ? "" : "none"; }
        if (modeT) {
            el.querySelector(".sf-cadre").innerHTML = l.length ? '<div class="sf-grille-c">' + l.slice(0, etat.nb).map(r => carte(r, DATA.s.indexOf(r))).join("") + "</div>" + (l.length > etat.nb ? '<button type="button" class="sf-plus" data-plus-c="1">AFFICHER ' + Math.min(48, l.length - etat.nb) + " DE PLUS (" + (l.length - etat.nb) + " RESTANTS)</button>" : "")
                : '<div class="sf-vide">' + (etat.f === "surveilles" ? "Aucun système surveillé pour l’instant." : "Aucun système ne correspond à ce filtre.") + "</div>";
            if (window.EdteamCopie && window.EdteamCopie.scanner) window.EdteamCopie.scanner(el.querySelector(".sf-cadre"));
            return;
        }
        el.querySelector(".sf-cadre").innerHTML = l.length
            ? '<table class="sf-tab' + (SURV ? " sf-av" : "") + '"><thead><tr>' + (SURV ? '<th class="sf-oeil-th"></th>' : "") + th("nom", "SYSTÈME") + (refActive() ? th("dist", "DISTANCE") : "") + "<th>TYPE</th>" + th("archi", "ARCHITECTE") + th("infl", "INFLUENCE") + "<th>ÉTATS</th>" + th("nbf", "FACT.") + "<th>NOTES</th></tr></thead><tbody>" + l.map((r, i) => ligne(r, DATA.s.indexOf(r))).join("") + "</tbody></table>"
            : '<div class="sf-vide">' + (etat.f === "surveilles" ? "Aucun système surveillé pour l’instant." + (SURV && SURV.peut ? " Cliquez sur l’œil d’une ligne, ou ajoutez un système par son nom." : " L’Amiral et les officiers choisissent les systèmes à surveiller.") : "Aucun système ne correspond à ce filtre.") + "</div>";
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
    // nosTs : heure (secondes) du releve de NOTRE serveur pour ce systeme, ou null ; sert a signaler quand EDSM est en retard sur les pilotes
    function noteFraicheur(d, nosTs) {
        const t = (d.f || []).reduce((m, x) => Math.max(m, Number(x.lastUpdate) || 0), 0);
        if (!nosTs || !t) return "";
        const ecart = nosTs - t;
        if (ecart > 3600) return '<div class="sf-note" style="border-left:3px solid #00F0FF;padding-left:10px">Notre serveur a un relevé <b>plus récent</b> (' + ilYaS(nosTs) + ') que celui d’EDSM (' + ilYaS(t) + ') : EDSM n’a pas encore reçu la visite d’un joueur dans ce système. Pour notre faction, les chiffres du serveur (en haut de la fiche) font foi.</div>';
        if (ecart < -3600) return '<div class="sf-note" style="border-left:3px solid #FFB000;padding-left:10px">EDSM a un relevé <b>plus récent</b> (' + ilYaS(t) + ') que notre serveur (' + ilYaS(nosTs) + ') : le prochain passage d’un pilote ou la prochaine mise à jour du matin / du soir le rattrapera.</div>';
        return "";
    }
    function tableauFactions(d, nosTs) {
        if (!d || !d.f || !d.f.length) return '<div class="sf-vide">EDSM ne connaît pas encore les factions de ce système.</div>';
        const toutes = d.f.slice().sort((a, b) => (b.influence || 0) - (a.influence || 0)), nous = DATA.faction;
        const pres = toutes.filter(x => (x.influence || 0) > 0), anc = toutes.filter(x => !((x.influence || 0) > 0));
        const etats = a => (a || []).map(x => x.state).filter(Boolean).join(", ");
        const ligne = x => '<tr class="' + (x.name === nous ? "nous " : "") + (x.name === d.c ? "ctrl" : "") + '"><td>' + E(x.name) + (x.isPlayer ? " <small>JOUEURS</small>" : "") + (x.name === d.c ? " <small>CONTRÔLE</small>" : "") + "</td><td>" + ((x.influence || 0) * 100).toFixed(1) + " %</td><td>" + E(x.state || "—") + "</td><td>" + (E(etats(x.pendingStates)) || "—") + "</td><td>" + (E(etats(x.recoveringStates)) || "—") + "</td><td>" + (x.lastUpdate ? ilYaS(x.lastUpdate) : "—") + "</td></tr>";
        const ligneHist = x => '<tr class="hist"><td>' + E(x.name) + (x.isPlayer ? " <small>JOUEURS</small>" : "") + ' <small class="h">A QUITTÉ LE SYSTÈME</small></td><td>0 %</td><td colspan="4">historique : plus présente</td></tr>';
        const moi = pres.find(x => x.name === nous), rival = pres.find(x => x.name !== nous);
        const ecart = moi && rival ? ((moi.influence - rival.influence) * 100) : null;
        const frais = noteFraicheur(d, nosTs);
        return frais + '<table class="sf-fac"><thead><tr><th>FACTION</th><th>INFLUENCE</th><th>ÉTAT</th><th>EN ATTENTE</th><th>EN RÉCUPÉRATION</th><th title="Dernière mise à jour chez EDSM (dernier joueur passé dans le système) : ce n’est pas la date de notre relevé">MAJ EDSM</th></tr></thead><tbody>' + pres.map(ligne).join("")
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
        const sections = (extra || "") + sectionSurv(r)
            + '<div class="sf-sec"><h4>NOTRE FACTION</h4><div class="sf-grille">'
            + case_("INFLUENCE", r[C.infl] == null ? "non relevée" : r[C.infl].toFixed(1) + " %" + fleche(r) + '<small style="display:block;color:#7d8a92;font-size:.7em;margin-top:3px">relevé ' + ilYaH(r[C.age]) + " (" + ORIGINE(r) + ")</small>", r[C.age] > 168)
            + case_("ÉTATS", chipsEtats(r[C.etats]) || "—")
            + case_("FACTIONS", r[C.nbf] == null ? "—" : r[C.nbf])
            + case_("DONNÉE SPANSH", r[C.sp] == null ? "—" : ilYaH(r[C.sp] * 24), r[C.sp] > 21) + (distTxt(r) ? case_("DISTANCE", distTxt(r)) : "") + "</div></div>"
            + (colo ? '<div class="sf-sec"><h4>COLONIE</h4><div class="sf-grille">'
                + case_("ARCHITECTE", archi ? pilote(archi, 30) : "inconnu")
                + case_("MEMBRE DE L’ESCADRON", archi ? (mb ? '<span style="color:#00FF66">OUI</span>' : '<span style="color:#8b97a0">NON (ancien membre ou extérieur)</span>') : "—")
                + case_("CHANTIERS EN COURS", r[C.chant] || "0") + "</div>"
                + (archi ? "" : '<div class="sf-note">L’architecte n’est connu que lorsque le plugin d’un pilote a relevé la revendication du système.</div>') + "</div>" : "")
            + '<div class="sf-sec"><h4>SITUATION EN DIRECT (EDSM)</h4><div class="sf-fd"><div class="sf-vide">Chargement des factions…</div></div></div>';
        const v = modale({ petit: "SYSTÈME · " + E(DATA && DATA.faction || "").toUpperCase(), titre: lieu(r[C.nom]), badges: badges, sections: sections, apres: v2 => brancherFicheSurv(v2, r),
            liens: '<a class="sf-lien" href="bgs.html">PAGE BGS</a>' + (colo ? '<a class="sf-lien" href="colonisation.html">PAGE COLONISATION</a>' : "") });
        const zone = v.querySelector(".sf-fd");
        try { zone.innerHTML = tableauFactions(await edsm(r[C.nom]), (survDe(r) && survDe(r).d) || (r[C.infl] != null && r[C.age] != null ? Date.now() / 1000 - r[C.age] * 3600 : null)); } catch (e) { zone.innerHTML = '<div class="sf-vide">EDSM est injoignable pour le moment. Les chiffres ci-dessus restent ceux du serveur.</div>'; }
    }

    // ---- montage ----
    // ---- LEGENDE + REGLAGE DES ALERTES (SQL 210) : l'Amiral et le Directeur choisissent les seuils de leur escadron ----
    const peutRegler = () => { const p = window.profilCommandant || {}; return !!(p.est_amiral || p.est_directeur); };
    function legende() { return '<div class="sf-leg"><span><i style="background:#00FF66"></i> colonie dont l’architecte est un membre de l’escadron</span><span><i style="background:#00F0FF"></i> cible (directive ou campagne active, système non contrôlé)</span><span><i style="background:#8b97a0"></i> colonie non contrôlée</span><span><b class="sf-c">C</b> campagne en cours</span>' + (SURV ? '<span><b style="color:#B07CFF">◉</b> surveillé par l’état-major</span><span><i style="background:#FF4D4D"></i> clignote : guerre, élection, faction à moins de ' + String(Number((SURV.reglages || {}).surv_depart_clign_pct) || 2.5).replace('.', ',') + ' %, donnée de plus de ' + 2 * (Number((SURV.reglages || {}).age_surv_h) || 12) + ' h</span><span><i style="background:#FFB000"></i> clignote : baisse d’influence, faction à moins de ' + String(Number((SURV.reglages || {}).surv_depart_pct) || 3).replace('.', ',') + ' %, donnée de plus de ' + (Number((SURV.reglages || {}).age_surv_h) || 12) + ' h</span>' : '') + '</div>'; }
    const REG_DEF = { age_surv_h: 12, age_surv_alerte_h: 6, surv_baisse_pts: 1, surv_depart_pct: 3, surv_depart_clign_pct: 2.5 };
    function ouvrirReglages(el) {
        const reg = (SURV && SURV.reglages) || {}, val = k => (Number(reg[k]) || REG_DEF[k]);
        const ch = (k, lib, aide, min, max, pas) => '<label class="sf-rg" for="sf-rg-' + k + '"><span>' + lib + '<small>' + aide + '</small></span><input type="number" id="sf-rg-' + k + '" min="' + min + '" max="' + max + '" step="' + pas + '" value="' + val(k) + '"></label>';
        const html = '<div class="sf-sec"><div class="sf-rgs">'
            + ch("age_surv_h", "Donnée trop ancienne (heures)", "ORANGE qui clignote au-delà de cette limite, ROUGE à 2 fois cette limite.", 1, 720, 1)
            + ch("age_surv_alerte_h", "Donnée trop ancienne si le système est en alerte (heures)", "Pour un système en guerre, en élection, en baisse ou dont la faction part. Pas plus que la limite ci-dessus.", 1, 720, 1)
            + ch("surv_baisse_pts", "Baisse d’influence à signaler (points en 24 h)", "ORANGE quand notre faction perd au moins ce nombre de points.", 0.1, 50, "any")
            + ch("surv_depart_pct", "Faction sur le départ : ORANGE sous (%)", "Influence d’une faction en baisse ou en retraite.", 0.5, 50, "any")
            + ch("surv_depart_clign_pct", "Faction sur le départ : ROUGE sous (%)", "Doit rester inférieur ou égal au seuil orange.", 0.1, 50, "any")
            + '</div><div class="sf-rgb"><button type="button" class="sf-regl on" data-rg-ok="1">ENREGISTRER</button><button type="button" class="sf-regl" data-rg-def="1">VALEURS PAR DÉFAUT</button><span class="sf-rgm" data-rg-msg="1"></span></div></div>';
        modale({ petit: "SURVEILLANCE · ESCADRON", titre: "Seuils des alertes", sections: html, apres: v => {
            const nb = k => Number((v.querySelector("#sf-rg-" + k) || {}).value), msg = v.querySelector("[data-rg-msg]");
            v.querySelector("[data-rg-def]").onclick = () => { Object.keys(REG_DEF).forEach(k => { const i = v.querySelector("#sf-rg-" + k); if (i) i.value = REG_DEF[k]; }); if (msg) msg.textContent = "Valeurs par défaut remises : enregistrez pour les appliquer."; };
            v.querySelector("[data-rg-ok]").onclick = async () => {
                const a = nb("age_surv_h"), ar = nb("age_surv_alerte_h"), b = nb("surv_baisse_pts"), d = nb("surv_depart_pct"), dc = nb("surv_depart_clign_pct"), non = t => { if (msg) msg.textContent = t; };
                if (!(a >= 1 && a <= 720) || !(ar >= 1 && ar <= 720)) return non("Les âges doivent être compris entre 1 et 720 heures.");
                if (ar > a) return non("L’âge en alerte ne peut pas dépasser l’âge limite normal.");
                if (!(b >= 0.1 && b <= 50)) return non("La baisse d’influence doit être comprise entre 0,1 et 50 points.");
                if (!(d >= 0.5 && d <= 50)) return non("Le seuil orange doit être compris entre 0,5 et 50 %.");
                if (!(dc >= 0.1 && dc <= d)) return non("Le seuil rouge doit être compris entre 0,1 et le seuil orange.");
                non("Enregistrement…");
                const res = await window.supabaseApp.rpc("surveillance_reglages_ecrire", { p_actif: reg.surv_actif !== false, p_age: a, p_age_alerte: ar, p_baisse: b, p_depart: d, p_depart_clign: dc });
                if (res.error) return non(res.error.message || "Refusé.");
                if (typeof sonSucces === "function") sonSucces();
                await chargerSurv(true); DATA = preparer(BRUT); dessiner(el);
                const l = el.querySelector(".sf-leg"); if (l) l.outerHTML = legende();
                fermer();
            };
        } });
    }
    async function monter(el) {
        style(); if (!el) return;
        el.className = "sf bloc cy"; el.style.padding = "14px 18px";
        el.innerHTML = '<div class="sf-vide">Chargement des systèmes…</div>';
        try {
            if (window.EDTEAMPhotos) { try { await window.EDTEAMPhotos.charger(false); } catch (e) { /* initiales a la place */ } }
            const d = await charger();
            if (!d) { el.style.display = "none"; return; }                   // pas d'escadron : rien a montrer
            BRUT = d; EL = el; await chargerSurv(false); DATA = preparer(d);
            if (!d.faction || !Array.isArray(d.s) || !d.s.length) { el.innerHTML = '<div class="sf-h"><h2>Systèmes de la faction défendue</h2></div><div class="sf-vide">La faction défendue de votre escadron n’est pas encore suivie : le tableau apparaîtra dès que son suivi sera en place.</div>'; return; }
            el.innerHTML = '<div class="sf-h"><h2>Systèmes de ' + E(d.faction) + '</h2><em>où nous sommes, qui a colonisé quoi</em><span class="sf-n"></span></div>'
                + '<div class="sf-bar"></div>'
                + '<div class="sf-outils"><input type="search" placeholder="Rechercher un système ou un architecte…" aria-label="Rechercher" autocomplete="off" spellcheck="false"><div class="sf-ref"></div><span class="sf-vue"></span><select class="sf-tri" aria-label="Trier" style="display:none"><option value="nom">TRI : NOM</option><option value="alerte">TRI : ALERTES D’ABORD</option><option value="infl">TRI : INFLUENCE</option><option value="dist">TRI : DISTANCE</option><option value="nbf">TRI : FACTIONS</option></select><button type="button" class="sf-addbtn" data-addbtn="1" style="display:none">◉ SURVEILLER UN SYSTÈME</button></div><div class="sf-add" style="display:none"></div><div class="sf-cadre"></div>'
                + legende()
                + '<div class="sf-note">Clic sur une ligne : la fiche du système. <b>D’où viennent les chiffres ?</b> La liste des systèmes, le nombre de factions et la puissance : <b>Spansh</b>, chaque nuit' + (d.maj ? " (dernière mise à jour " + ilYaH((Date.now() - new Date(d.maj).getTime()) / 3600000) + ")" : "") + '. L’influence et les états de notre faction : les <b>relevés des pilotes</b> (le plugin les envoie à l’arrivée dans un système surveillé ou visé par une directive : le plus frais), <b>EDSM</b> (deux fois par jour pour ces mêmes systèmes) et, pour tous les autres systèmes, <b>Spansh</b> (mention « Spansh », environ 24 h de retard) ; la valeur la plus récente gagne. La fiche interroge aussi EDSM en direct. <b>Flèche</b> : évolution de notre influence depuis le dernier tick (fond pâle « 48 h » : aucune mesure depuis le tick). L’architecte n’est connu que si le plugin d’un pilote a relevé la revendication.</div>';
            el.querySelector(".sf-bar").addEventListener("click", e => {
                if (e.target.closest("[data-plus]")) { etat.plus = !(etat.plus || PRINCIPAUX.indexOf(etat.f) < 0); if (!etat.plus && PRINCIPAUX.indexOf(etat.f) < 0) etat.f = "controles"; dessiner(el); return; }
                const b = e.target.closest("[data-f]"); if (b) { etat.f = b.dataset.f; etat.nb = 48; dessiner(el); }
            });
            el.querySelector(".sf-outils input").addEventListener("input", e => { etat.q = e.target.value; etat.nb = 48; dessiner(el); });
            el.querySelector(".sf-tri").addEventListener("change", e => { etat.tri = e.target.value; etat.sens = etat.tri === "infl" ? -1 : 1; etat.nb = 48; dessiner(el); });
            { const re = () => { if (DATA) dessiner(el); }; window.addEventListener("edteam-vue", re); if (window.matchMedia) { const mq = window.matchMedia("(max-width: 1600px)"); if (mq.addEventListener) mq.addEventListener("change", re); else if (mq.addListener) mq.addListener(re); } }
            el.addEventListener("click", e => {
                if (e.target.closest("[data-regl]")) { ouvrirReglages(el); return; }
                const ab = e.target.closest("[data-addbtn]"); if (ab) { etat.add = !etat.add; majAjout(el); const i = el.querySelector(".sf-add input"); if (etat.add && i) i.focus(); return; }
                const oe = e.target.closest("[data-oeil]"); if (oe) { e.stopPropagation(); basculer(DATA.s[+oe.dataset.oeil], el); return; }
                const th = e.target.closest("th[data-t]"); if (th) { const t = th.dataset.t; etat.sens = etat.tri === t ? -etat.sens : 1; etat.tri = t; dessiner(el); return; }
                if (e.target.closest(".edteam-lieu")) return;                  // un clic sur le nom copie le systeme (copier-lieux.js) sans ouvrir la fiche
                const bv = e.target.closest("[data-vue]"); if (bv) { choisirVue(bv.dataset.vue); return; }
                const pc = e.target.closest("[data-plus-c]"); if (pc) { etat.nb += 48; dessiner(el); return; }
                const tr = e.target.closest("tr[data-i], .sf-cd[data-i]"); if (tr) ouvrirFiche(DATA.s[+tr.dataset.i]);
            });
            el.querySelector(".sf-ref").addEventListener("click", e => { const b = e.target.closest("[data-r]"); if (b && !b.disabled) { REF.mode = b.dataset.r; majRef(el); dessiner(el); } });
            dessiner(el); majRef(el); majAjout(el); chargerRefs(el);
        } catch (e) {
            console.error("Systemes :", e);
            el.innerHTML = '<div class="sf-h"><h2>Systèmes de la faction défendue</h2></div><div class="sf-vide">' + (absente(e) ? "Le tableau des systèmes n’est pas encore activé sur le serveur." : "Impossible de lire les systèmes pour le moment.") + "</div>";
        }
    }
    window.EdteamSystemes = { monter, fermer };
})();
