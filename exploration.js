// ONGLET EXPLORATION du tableau de bord (tableau-de-bord.html) : exploration scientifique, DEUX MODES dans le meme onglet (EXPLORATION / EXOBIOLOGIE).
//   EXPLORATION : bandeau fin (rang, donnees non vendues, expedition, derniere vente) ; CARTE DU SYSTEME « hologramme » (planetes ombrees selon la lumiere de l'etoile, anneaux, halos,
//                 zoom/deplacement) avec les corps decouverts relies par un trait a leur fiche ; corps a cartographier ; OU VENDRE ; trajet de l'expedition ; fenetre « ce que j'ai decouvert »
//                 (bouton dans la carte, comme le registre de Commerce). Pas d'hologramme du vaisseau (decision du proprietaire).
//   EXOBIOLOGIE : meme principe : carte hologramme des corps a signaux biologiques (genres, potentiel de valeur), « echantillons de la session » (avancement des 3 prelevements, valeur non vendue,
//                 nouveau dans le codex du pilote), OU VENDRE (genetique), vue combinaison a pied. Valeurs : table exobio-valeurs.js (EDDiscovery, apres la mise a jour 14). Pas de « collection » (le jeu ne donne pas le codex du pilote).
// Donnees : S.explo (plugin >= 2.30) ; rangs : S.rang / S.prog ; ou vendre : fonction SQL explo_ou_vendre (script 93) ; fenetre : modale commune de la page (VENTE.vue = "explo").
// Valeurs en credits : formule publiee par la communaute, verifiee sur les ventes du proprietaire (exacte pour les etoiles, borne basse pour les planetes, non verifiee pour les cartographies).
// Noms de la page utilises : S, esc, fmtN, fmtM, cp, duree, lire, ecrire, rendre, sonClic, supabaseApp, VENTE, majModale, REGL, auSolHtml.
(function () {
    "use strict";
    const RANGS_EXPLO = ["AIMLESS", "MOSTLY AIMLESS", "SCOUT", "SURVEYOR", "TRAILBLAZER", "PATHFINDER", "RANGER", "PIONEER", "ELITE", "ELITE I", "ELITE II", "ELITE III", "ELITE IV", "ELITE V"];
    const RANGS_EXOBIO = ["DIRECTIONLESS", "MOSTLY DIRECTIONLESS", "COMPILER", "COLLECTOR", "CATALOGER", "TAXONOMIST", "ECOLOGIST", "GENETICIST", "ELITE", "ELITE I", "ELITE II", "ELITE III", "ELITE IV", "ELITE V"];
    const NATURE = {
        "earthlike body": "Monde semblable à la Terre", "water world": "Monde aquatique", "ammonia world": "Monde d’ammoniac", "high metal content body": "Monde riche en métaux",
        "metal rich body": "Corps métallique", "rocky body": "Corps rocheux", "rocky ice body": "Corps rocheux et glacé", "icy body": "Corps glacé",
        "sudarsky class i gas giant": "Géante gazeuse I", "sudarsky class ii gas giant": "Géante gazeuse II", "sudarsky class iii gas giant": "Géante gazeuse III",
        "sudarsky class iv gas giant": "Géante gazeuse IV", "sudarsky class v gas giant": "Géante gazeuse V", "water giant": "Géante d’eau", "helium rich gas giant": "Géante riche en hélium",
        "gas giant with water based life": "Géante gazeuse (vie aquatique)", "gas giant with ammonia based life": "Géante gazeuse (vie ammoniacale)", "helium gas giant": "Géante d’hélium"
    };
    // couleur de base des planetes : [couleur, bandes (geantes gazeuses)]
    const PAL = {
        "earthlike body": ["#2e7bd6"], "water world": ["#1c5cc2"], "ammonia world": ["#b9b35a"], "high metal content body": ["#8f6f57"], "metal rich body": ["#c8814a"],
        "rocky body": ["#8d8a86"], "rocky ice body": ["#b9c2c9"], "icy body": ["#dcecf5"],
        "sudarsky class i gas giant": ["#d9c8a5", 1], "sudarsky class ii gas giant": ["#e4c8a8", 1], "sudarsky class iii gas giant": ["#4f9fd8", 1], "sudarsky class iv gas giant": ["#a46bd6", 1],
        "sudarsky class v gas giant": ["#e8e8ee", 1], "water giant": ["#68c4e6", 1], "helium rich gas giant": ["#bfe2ff", 1], "gas giant with water based life": ["#8fcf8f", 1], "gas giant with ammonia based life": ["#c9cf7f", 1], "helium gas giant": ["#cfe8ff", 1]
    };
    const ETOILES = { O: "#9bb0ff", B: "#aabfff", A: "#cad7ff", F: "#f8f7ff", G: "#fff4ea", K: "#ffd2a1", M: "#ffcc6f", L: "#d98f6a", T: "#b86aa8", Y: "#8a5a8a", N: "#c9e4ff", H: "#c8a0ff", D: "#e6f0ff", W: "#bcd8ff", C: "#ff9a6a" };
    const MX = 550, MY = 240, FRX = 268, FRY = 226;       // cadre « hologramme » ; la carte occupe [MX-FRX, MX+FRX] x [MY-FRY, MY+FRY]
    const EX = window.__EX = { mode: null, sel: null, filtre: null, trj: null, z: {}, moved: false, vente: {}, modale: "dec", rayon: null, grande: null };
    EX.z.sys = { k: 1, cx: 0, cy: 0 };                                            // zoom de la carte du systeme : echelle et decalage (coordonnees du monde)

    const D = () => (S && S.explo) || null;

    // =============================================================================================
    //  CORPS CONNUS D'EDSM : dans un systeme deja explore, le jeu montre tout au pilote mais n'ecrit dans le journal que ce qu'il scanne LUI-MEME.
    //  Le navigateur lit les corps chez EDSM (une demande par systeme, memoire 24 h) : la carte s'affiche des le balayage, les corps non scannes sont en grise.
    // =============================================================================================
    const CLS_EDSM = { "high metal content world": "High metal content body", "earth-like world": "Earthlike body", "water world": "Water world", "ammonia world": "Ammonia world",
        "rocky body": "Rocky body", "rocky ice world": "Rocky ice body", "icy body": "Icy body", "metal-rich body": "Metal rich body", "class i gas giant": "Sudarsky class I gas giant",
        "class ii gas giant": "Sudarsky class II gas giant", "class iii gas giant": "Sudarsky class III gas giant", "class iv gas giant": "Sudarsky class IV gas giant", "class v gas giant": "Sudarsky class V gas giant",
        "water giant": "Water giant", "helium-rich gas giant": "Helium rich gas giant", "gas giant with water-based life": "Gas giant with water based life", "gas giant with ammonia-based life": "Gas giant with ammonia based life", "helium gas giant": "Helium gas giant" };
    function classeEdsm(x) {
        const t = String(x.t || "");
        if (x.k !== "Star") return CLS_EDSM[t.toLowerCase()] || t;
        const sc = String(x.sc || "").charAt(0).toUpperCase(); if ("OBAFGKMLTY".indexOf(sc) >= 0 && sc) return sc;
        if (/neutron/i.test(t)) return "N"; if (/black hole/i.test(t)) return "H"; if (/white dwarf/i.test(t)) return "D"; if (/wolf/i.test(t)) return "W"; if (/carbon/i.test(t)) return "C"; if (/tauri/i.test(t)) return "T"; if (/herbig/i.test(t)) return "A";
        return "";
    }
    // meme formule que le plugin (explo_valeurs) : valeur d'un scan FSS et valeur potentielle avec cartographie efficace
    function kEtoile(t) { t = String(t || ""); return (t === "N" || t === "H") ? 22628 : t.charAt(0) === "D" ? 14057 : 1200; }
    function kPlanete(classe, tf) {
        const c = String(classe || "").toLowerCase(), t = tf ? 1 : 0;
        if (c === "metal rich body") return 21790 + t * 65631; if (c === "ammonia world") return 96932; if (c === "sudarsky class i gas giant") return 1656;
        if (c === "sudarsky class ii gas giant" || c === "high metal content body") return 9654 + t * 100677; if (c === "water world") return 64831 + t * 116295; if (c === "earthlike body") return 64831 + 116295;
        return 300 + t * 93328;
    }
    function valeursEdsm(etoile, cls, masse, tf, wasdisc) {
        const pd = wasdisc ? 1 : 2.6, m = Math.max(Number(masse) || 0, 0), ody = v => v + Math.max(v * 0.3, 555);
        if (etoile) { const k = kEtoile(cls), v = (k + m * k / 66.25) * pd; return { v: Math.round(v), pot: Math.round(v) }; }
        const base = Math.max(kPlanete(cls, tf) * (1 + Math.pow(m, 0.2) * 0.56591828), 500);
        const carto = (!wasdisc) ? ody(base * 3.699622554) * 2.6 * 1.25 : ody(base * 8.0956) * 1.25;       // cartographie efficace, corps pas encore cartographie
        return { v: Math.round(base * pd), pot: Math.round(Math.max(carto, base * pd)) };
    }
    const nomCourt = (n, sys) => { n = String(n || ""); const s0 = String(sys || ""); if (n === s0) return "A"; if (s0 && n.indexOf(s0) === 0) n = n.slice(s0.length).trim(); return n || String(n); };
    function corpsFantome(x, sys) {
        const etoile = x.k === "Star", cls = classeEdsm(x), tf = x.tf ? 1 : 0, wd = x.dc ? 1 : 0, val = valeursEdsm(etoile, cls, x.m, tf, wd);
        const b = { i: x.i, n: nomCourt(x.n, sys), c: cls, e: etoile ? 1 : 0, m: Number(x.m) || 0, d: Number(x.d) || 0, p: x.p == null ? null : x.p, a: 0, wd, wm: 0, wf: 1, tf, l: x.l ? 1 : 0, g: Number(x.g) || 0, v: val.v, pot: val.pot, cm: 0, x: 1 };
        if (etoile) b.sp = String(x.sc || cls); else { if (x.rg) b.rg = x.rg; if (x.at && x.at !== "no atmosphere") b.at = String(x.at).slice(0, 30); }
        return b;
    }
    const CLE_EDSM = "edteam_tb_exp_edsm";
    function edsmCorps(nom) {                   // liste (ou null tant qu'elle n'est pas arrivee) ; au plus une demande par systeme, memoire 24 h dans ce navigateur
        const E = EX.edsm || (EX.edsm = { nom: "", st: "", corps: null, ts: 0 }); nom = String(nom || ""); if (!nom) return null;
        if (E.nom === nom.toLowerCase() && (E.st === "PRET" || E.st === "EN_COURS" || (E.st === "ERREUR" && Date.now() - E.ts < 120000))) return E.corps;
        try { const o = JSON.parse(lire(CLE_EDSM) || "null"); if (o && o.nom === nom.toLowerCase() && Date.now() - o.t < 24 * 3600e3 && Array.isArray(o.corps)) { E.nom = o.nom; E.st = "PRET"; E.corps = o.corps; E.ts = Date.now(); return E.corps; } } catch (e) { /* memoire illisible */ }
        E.nom = nom.toLowerCase(); E.st = "EN_COURS"; E.corps = null; E.ts = Date.now();
        // EDSM accepte les appels directs depuis le navigateur : rien ne passe par notre base (aucun egress Supabase)
        fetch("https://www.edsm.net/api-system-v1/bodies?systemName=" + encodeURIComponent(nom)).then(r => r.ok ? r.json() : Promise.reject(new Error("http"))).then(j => {
            if (E.nom !== nom.toLowerCase()) return;
            const L = j && Array.isArray(j.bodies) ? j.bodies : [];
            E.st = "PRET"; E.ts = Date.now();
            E.corps = L.filter(b => b && b.bodyId != null).slice(0, 120).map(b => {
                const par = Array.isArray(b.parents) && b.parents[0] && b.parents[0].Planet != null ? b.parents[0].Planet : null;
                return { i: b.bodyId, n: b.name, k: b.type, t: b.subType, sc: b.spectralClass, d: Math.round((Number(b.distanceToArrival) || 0) * 10) / 10, m: Math.round((Number(b.earthMasses != null ? b.earthMasses : b.solarMasses) || 0) * 1e4) / 1e4,
                    g: Math.round((Number(b.gravity) || 0) * 100) / 100, l: b.isLandable ? 1 : 0, tf: /^candidate/i.test(String(b.terraformingState || "")) ? 1 : 0, at: String(b.atmosphereType || "").toLowerCase(),
                    p: par, rg: Array.isArray(b.rings) ? b.rings.length : 0, dc: b.discovery ? 1 : 0 };
            }).sort((a, b) => a.d - b.d || a.i - b.i);
            if (E.corps.length) ecrire(CLE_EDSM, JSON.stringify({ nom: E.nom, corps: E.corps, t: Date.now() }));
            rendre();
        }).catch(() => { if (E.nom !== nom.toLowerCase()) return; E.st = "ERREUR"; E.ts = Date.now(); E.corps = null; rendre(); });
        return null;
    }
    // le systeme affiche = ce que le pilote a scanne + les corps connus d'EDSM qu'il n'a pas encore scannes (marques x:1)
    function sysFusion(d) {
        const j = d && d.sys, nom = (S && S.systeme) || (j && j.nom) || ""; if (!nom) return j;
        const meme = j && String(j.nom || "").toLowerCase() === nom.toLowerCase(), jb = meme ? (j.b || []) : [], E = edsmCorps(nom);
        if (!E || !E.length) return meme ? j : (nom ? { nom, nb: null, prog: 0, tous: false, ceint: 0, b: [] } : null);
        const dejaScannes = new Set(jb.map(b => b.i));
        const fant = E.filter(x => !dejaScannes.has(x.i)).map(x => corpsFantome(x, nom));
        return Object.assign({}, meme ? j : { prog: 0, tous: false, ceint: 0 }, { nom: meme ? j.nom : nom, nb: (meme && j.nb) || E.length, b: jb.concat(fant), edsm: fant.length });
    }
    window.explorationCorps = id => { if (EX.moved) return; if (typeof sonClic === "function") sonClic(); EX.sel = EX.sel === id ? null : id; rendre(); };
    window.explorationOuVendre = () => { if (typeof sonClic === "function") sonClic(); EX.mod = "vendre"; VENTE.vue = "explo"; VENTE.ouverte = true; majModale(); };
    window.explorationDecouvertes = () => { if (typeof sonClic === "function") sonClic(); EX.mod = "dec"; VENTE.vue = "explo"; VENTE.ouverte = true; majModale(); };

    // valeurs des echantillons d'exobiologie (exobio-valeurs.js)
    const EXO = () => window.EDTEAM_EXOBIO || { especes: {}, genres: {} };
    function valeurEsp(sc) { const E = EXO().especes; sc = String(sc || ""); if (E[sc]) return E[sc][1]; const k = Object.keys(E).find(x => sc.indexOf(x) === 0 || x.indexOf(sc) === 0); return k ? E[k][1] : 0; }
    function potentielCorps(b) {
        const G = EXO().genres, ks = (b.gk || []).filter(k => G[k]);
        return ks.length ? { connu: true, max: Math.max(...ks.map(k => G[k].max)), min: Math.min(...ks.map(k => G[k].min)), ks } : { connu: false, max: 0, min: 0, ks: [] };
    }
    const interet = b => { const bio = b.bio ? potentielCorps(b).max : 0, dss = b.pot || 0; return bio > dss ? { val: bio, src: "exobio" } : { val: dss, src: "carte DSS" }; };
    // =============================================================================================
    //  FEUILLE DE ROUTE : les corps que le pilote etiquette (« ca m'interesse »), dans l'ordre a suivre ; memoire dans ce navigateur (aucune donnee envoyee)
    // =============================================================================================
    const CLE_ROUTE = "edteam_tb_exp_route";
    function routeLire() { try { const r = JSON.parse(lire(CLE_ROUTE) || "[]"); return Array.isArray(r) ? r : []; } catch (e) { return []; } }
    const routeEcrire = r => ecrire(CLE_ROUTE, JSON.stringify(r.slice(0, 60)));
    const cleRoute = (sysnom, i) => String(sysnom || "").toLowerCase() + "|" + i;
    const taggue = (sysnom, i) => routeLire().some(x => x.k === cleRoute(sysnom, i));
    const etatCorps = b => b.cm ? "c" : (!b.x ? "s" : "a");
    const snapRoute = (b, sys) => ({ k: cleRoute(sys.nom, b.i), s: sys.nom, i: b.i, n: b.n, c: b.c, tf: b.tf ? 1 : 0, d: b.d || 0, pot: b.pot || 0, l: b.l ? 1 : 0, bio: b.bio || 0, gk: b.gk || [], at: b.at || "", st: etatCorps(b), cm: b.cm ? 1 : 0, x: b.x ? 1 : 0 });
    window.explorationTag = id => {
        if (typeof sonClic === "function") sonClic();
        const sys = EX.sysCourant, b = sys && (sys.b || []).find(x => x.i === id); if (!b || b.e) return;
        let r = routeLire(); const k = cleRoute(sys.nom, id);
        r = r.some(x => x.k === k) ? r.filter(x => x.k !== k) : r.concat([snapRoute(b, sys)]);
        routeEcrire(r); rendre();
    };
    window.explorationRoute = (action, k) => {
        if (typeof sonClic === "function") sonClic();
        let r = routeLire(); const i = r.findIndex(x => x.k === k);
        if (action === "retirer" && i >= 0) r.splice(i, 1);
        else if (action === "haut" && i > 0) [r[i - 1], r[i]] = [r[i], r[i - 1]];
        else if (action === "bas" && i >= 0 && i < r.length - 1) [r[i + 1], r[i]] = [r[i], r[i + 1]];
        else if (action === "trier") { const ordre = []; r.forEach(x => { if (ordre.indexOf(x.s) < 0) ordre.push(x.s); }); r.sort((a, b) => ordre.indexOf(a.s) - ordre.indexOf(b.s) || (a.d || 0) - (b.d || 0)); }
        else if (action === "vider") r = [];
        routeEcrire(r); rendre();
    };
    const nature = c => NATURE[String(c || "").toLowerCase()] || (c ? String(c) : "Corps");
    function natureEtoile(t) {
        t = String(t || "");
        if (t === "N") return "Étoile à neutrons";
        if (t === "H" || t === "SupermassiveBlackHole") return "Trou noir";
        if (t.charAt(0) === "D") return "Naine blanche";
        if (t === "L" || t === "T" || t === "Y") return "Naine brune";
        if (t === "TTS") return "Étoile T Tauri";
        if (t.charAt(0) === "W") return "Étoile de Wolf-Rayet";
        if (t.charAt(0) === "C" || t === "MS" || t === "S") return "Étoile de carbone";
        return t ? "Étoile de type " + t.charAt(0) : "Étoile";
    }
    const natureLongue = (t, e, tf) => e ? natureEtoile(t) : nature(t) + (tf ? " (terraformable)" : "");
    const OR = 400000, CY = 60000;                                   // seuils d'interet (valeur avec cartographie efficace)
    // signes (carte, fiche, feuille de route, legende) : scanne par moi / pas encore, atterrissable, exobiologie (certaine : plein ; possible : pointille), dans ma feuille de route
    const SIGNE = {
        scan: (ok, x, y) => ok ? `<g transform="translate(${x} ${y})"><circle r="4.6" fill="#0b3b2c" stroke="#00FF66" stroke-width="1.2"/><path d="M-2.4 .2L-.6 2.2L2.6 -2" fill="none" stroke="#00FF66" stroke-width="1.5"/></g>`
            : `<g transform="translate(${x} ${y})"><circle r="4.4" fill="none" stroke="#8b97a0" stroke-width="1.1" stroke-dasharray="2 2"/></g>`,
        pose: (x, y) => `<g transform="translate(${x} ${y})"><path d="M-3.6 3.6L-1.6 -3H1.6L3.6 3.6M-4.8 4.8H4.8" fill="none" stroke="#FFD700" stroke-width="1.5" stroke-linecap="round"/></g>`,
        bio: (plein, x, y) => `<g transform="translate(${x} ${y})"><path d="M0 -4.6C4.6 -3 4.6 3 0 4.6C-4.6 3 -4.6 -3 0 -4.6ZM0 4.6V-1.5" fill="${plein ? "#00FF66" : "none"}" fill-opacity=".85" stroke="#00FF66" stroke-width="1.2"${plein ? "" : ' stroke-dasharray="2 1.6" stroke-opacity=".7"'}/></g>`,
        tag: (x, y) => `<g transform="translate(${x} ${y})"><path d="M0 -5L1.5 -1.6L5 -1.4L2.3 .9L3.2 4.5L0 2.5L-3.2 4.5L-2.3 .9L-5 -1.4L-1.5 -1.6Z" fill="#FF9A1F" stroke="#fff" stroke-opacity=".6" stroke-width=".6"/></g>`
    };
    const ico = (svg) => `<svg viewBox="-6 -6 12 12" width="14" height="14" class="tbx-ico">${svg}</svg>`;
    const bioPossible = b => !b.bio && !b.x && b.l && b.at && b.at !== "no atmosphere";       // atterrissable avec atmosphere : de l'exobiologie est possible (a confirmer au FSS)
    const signesCorps = (b, sysnom) => b.e ? [] : [{ m: "scan", s: SIGNE.scan(!b.x, 0, 0) }, b.l ? { m: "pose", s: SIGNE.pose(0, 0) } : null, b.bio ? { m: "bio", s: SIGNE.bio(true, 0, 0) } : (bioPossible(b) ? { m: "bioP", s: SIGNE.bio(false, 0, 0) } : null), taggue(sysnom, b.i) ? { m: "tag", s: SIGNE.tag(0, 0) } : null].filter(Boolean);
    // conditions de la legende (cliquables) : plusieurs conditions = les corps qui les remplissent TOUTES
    const TESTS = {
        tres: b => !b.e && palier(b).lib === "TRÈS INTÉRESSANT", int: b => !b.e && palier(b).lib === "INTÉRESSANT", faible: b => !b.e && palier(b).lib === "FAIBLE", carto: b => !b.e && !!b.cm,
        pd: b => !b.e && !b.wd, scan: b => !b.e && !b.x, pasScan: b => !b.e && !!b.x, pose: b => !b.e && !!b.l, bio: b => !b.e && !!b.bio, bioP: b => !b.e && bioPossible(b), tag: (b, nom) => !b.e && taggue(nom, b.i)
    };
    // style graphique de la carte : realiste (textures, lumiere, lueurs), holographique (traits lumineux), aplat (formes simples aux couleurs de priorite)
    const STYLES = [["real", "RÉALISTE"], ["holo", "HOLOGRAPHIQUE"], ["flat", "APLAT"]];
    const styleCarte = () => EX.style || (EX.style = STYLES.some(x => x[0] === lire("edteam_tb_exp_style")) ? lire("edteam_tb_exp_style") : "real");
    window.explorationStyle = k => { if (typeof sonClic === "function") sonClic(); EX.style = k; ecrire("edteam_tb_exp_style", k); rendre(); };
    const filtresActifs = () => EX.filtres || (EX.filtres = []);
    const correspond = (b, nom) => filtresActifs().every(k => TESTS[k] && TESTS[k](b, nom));
    window.explorationFiltre = k => { if (typeof sonClic === "function") sonClic(); const f = filtresActifs(); if (k === "raz") EX.filtres = []; else { const i = f.indexOf(k); if (i >= 0) f.splice(i, 1); else f.push(k); } rendre(); };
    // palier de priorite d'un corps : etiquette, couleur du contour, fond teinte de la fiche
    const palier = b => { const val = Math.max(b.pot || 0, b.bio ? potentielCorps(b).max : 0); return b.cm ? { lib: "CARTOGRAPHIÉ", col: "#00FF66", fond: "rgba(8,72,38,.95)", txt: "#021a0b" }
        : val >= OR ? { lib: "TRÈS INTÉRESSANT", col: "#FFD700", fond: "rgba(92,72,4,.95)", txt: "#1a1300" }
        : val >= CY ? { lib: "INTÉRESSANT", col: "#00F0FF", fond: "rgba(4,60,76,.95)", txt: "#001a20" }
        : { lib: "FAIBLE", col: "#8b97a0", fond: "rgba(14,20,26,.8)", txt: "#0b0f12" }; };
    const coulInteret = b => b.e ? (ETOILES[String(b.c || "").charAt(0)] || "#ffe2b0") : b.cm ? "#00FF66" : b.pot >= OR ? "#FFD700" : b.pot >= CY ? "#00F0FF" : "#8b97a0";
    const ago = iso => { const t = Date.parse(iso); if (!t) return ""; return "il y a " + duree((Date.now() - t) / 1000); };
    const km = v => { v = Number(v) || 0; return v >= 1e6 ? (v / 1e6).toFixed(2).replace(".", ",") + " M" : v >= 1e3 ? Math.round(v / 1e3) + " k" : String(Math.round(v)); };
    const cut = (s, n) => { s = String(s || ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
    const tint = (hex, a) => { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; const f = c => Math.max(0, Math.min(255, Math.round(a >= 0 ? c + (255 - c) * a : c * (1 + a)))); return "#" + [f(r), f(g), f(b)].map(c => ("0" + c.toString(16)).slice(-2)).join(""); };
    const hash = s => { let h = 7; String(s || "x").split("").forEach(c => { h = (h * 31 + c.charCodeAt(0)) % 2147483647; }); return h || 7; };

    // ---------------------------------------------------------------------------------------------
    //  BANDEAU FIN : quatre pastilles sur une ligne
    // ---------------------------------------------------------------------------------------------
    const chip = (couleurCss, label, valeur, sous, tip) => `<div class="tbx-chip" style="--c:${couleurCss}" ${tip ? `title="${esc(tip)}"` : ""}><small>${label}</small><b>${valeur}</b><span>${sous}</span></div>`;
    function chipRang(cle, titre, noms) {
        const r = (S && S.rang) || {}, p = (S && S.prog) || {}, n = r[cle];
        if (n == null) return chip("#00FF66", titre, "—", "rang relevé à la prochaine connexion", "");
        const nom = noms[n] || ("RANG " + n), max = n >= noms.length - 1, pr = Math.max(0, Math.min(100, Number(p[cle]) || 0));
        return `<div class="tbx-chip" style="--c:#00FF66" title="Valeur du jeu : la progression n'est mise à jour qu'à la connexion ou à la promotion"><small>${titre} · CERCLE DES PILOTES</small><b style="color:#00FF66">${esc(nom)}</b><i class="bar"><i style="width:${max ? 100 : pr}%"></i></i><span>${max ? "rang maximum" : pr + " % vers " + esc(noms[n + 1] || "le suivant")}</span></div>`;
    }
    function bandeau(d) {
        const nv = (d && d.nv) || {}, tot = (d && d.tot) || {}, v = d && d.vente;
        const xb = sommeBio(d), non = chip("#FF3B30", "CARTOGRAPHIE NON VENDUE", nv.n ? "≥ " + fmtM(nv.v || 0) : "—", nv.n ? `${fmtN(nv.n)} corps · ${fmtN(nv.sys || 0)} système${nv.sys > 1 ? "s" : ""}${nv.pd ? " · " + fmtM(nv.pd) + " de 1res découvertes" : ""}` : "rien en attente de vente",
            "Estimation MINIMALE (formule de la communauté, sans les ceintures d'astéroïdes). Perdues si le vaisseau est détruit."),
            bio = chip("#B388FF", "EXOBIOLOGIE NON VENDUE", xb.nA ? "≈ " + fmtM(xb.analyse) : "—", xb.n ? `${fmtN(xb.nA)} espèce${xb.nA > 1 ? "s" : ""} analysée${xb.nA > 1 ? "s" : ""}${xb.nC ? " · " + fmtN(xb.nC) + " en cours" : ""}` : "aucun prélèvement",
            "Seules les espèces analysées (3 prélèvements) se vendent : un échantillon en cours n'a pas de valeur tant qu'il n'est pas analysé. Perdus si le vaisseau est détruit.");
        const exp = chip("#00F0FF", "EXPÉDITION", `${fmtN(tot.sauts || 0)} <em>sauts</em>`, `${fmtN(tot.dist || 0)} al${tot.debut ? " · " + ago(tot.debut) : ""}`, "Depuis la dernière vente de toutes vos données.");
        const ven = v && v.reel ? chip("#FFD700", "DERNIÈRE VENTE", fmtM(v.reel), `estimé ${fmtM(v.est)} · ${v.est ? Math.round(v.est / v.reel * 100) : 0} % du payé · ${ago(v.t)}`, "L'estimation est une borne basse : le jeu paie en général davantage.")
            : chip("#FFD700", "DERNIÈRE VENTE", "—", "estimé / payé après la prochaine vente", "");
        return `<div class="tbx-strip c5">${chipRang("Explore", "RANG EXPLORATION", RANGS_EXPLO)}${non}${bio}${exp}${ven}</div>`;
    }

    // ---------------------------------------------------------------------------------------------
    //  CARTE DU SYSTEME « hologramme » : orbites circulaires (distance au point d'arrivee, echelle logarithmique), lunes autour de leur planete,
    //  corps ombres selon la direction de l'etoile, anneaux, halos d'atmosphere, couronne des etoiles ; les corps decouverts sont relies a leur fiche
    // ---------------------------------------------------------------------------------------------
    function disposition(bs) {
        const par = new Map(bs.map(b => [b.i, b])), enfants = new Map();
        bs.forEach(b => { if (b.p != null && par.has(b.p)) { if (!enfants.has(b.p)) enfants.set(b.p, []); enfants.get(b.p).push(b); } });
        const hauts = bs.filter(b => !(b.p != null && par.has(b.p)));
        const centre = hauts.find(b => b.e && !b.d) || hauts.find(b => b.e) || null;
        const autres = hauts.filter(b => b !== centre).sort((a, b) => (a.d || 0) - (b.d || 0));
        const dmax = Math.max(1, ...autres.map(b => b.d || 0)), dref = 2, R0 = 56, R1 = 214, nA = autres.length, lmax = Math.log(1 + dmax / dref);
        const pos = new Map();
        if (centre) pos.set(centre.i, { x: 0, y: 0, o: 0 });
        autres.forEach((b, k) => {
            const fr = nA > 1 ? k / (nA - 1) : .5, lf = Math.log(1 + (b.d || 0) / dref) / lmax, r = R0 + (R1 - R0) * (0.7 * fr + 0.3 * lf), a = ((k * 137.508 + 20) % 360) * Math.PI / 180;      // 70 % rang, 30 % distance reelle
            pos.set(b.i, { x: r * Math.cos(a), y: r * Math.sin(a), o: r });
        });
        const rayon = b => b.e ? Math.max(11, Math.min(22, 10 + Math.log10(1 + (b.m || 1) * 4) * 6)) : b.p != null ? Math.max(4.2, Math.min(8.5, 4.2 + Math.log10(1 + (b.m || 0) * 10) * 2.8)) : Math.max(7, Math.min(17, 7 + Math.log10(1 + (b.m || 0) * 10) * 4.2));
        const placeLunes = id => (enfants.get(id) || []).forEach((m, k) => {
            const p = pos.get(id); if (!p) return;
            const rp = rayon(par.get(id)) * (par.get(id).rg ? 1.9 : 1), r = rp + 9 + k * 6.5, a = (k * 83 + 40) * Math.PI / 180;
            pos.set(m.i, { x: p.x + r * Math.cos(a), y: p.y + r * Math.sin(a), o: r, parent: id });
            placeLunes(m.i);
        });
        Array.from(pos.keys()).forEach(placeLunes);
        return { pos, rayon, centre, hauts };
    }
    const proj = (z, x, y) => [MX + (x - z.cx) * z.k, MY + (y - z.cy) * z.k];

    // sprite d'un corps : renvoie le dessin ; les degrades sont ajoutes a defs
    function spriteHolo(b, p, r, col) {
        if (b.e) return `<circle r="${(r * 2.6).toFixed(1)}" fill="none" stroke="${col}" stroke-opacity=".16"/><circle r="${(r * 1.7).toFixed(1)}" fill="none" stroke="${col}" stroke-opacity=".32"/><circle r="${r.toFixed(1)}" fill="${col}" fill-opacity=".38" stroke="${col}" stroke-width="1.8" filter="url(#tbxGlow)"/><path d="M${-r * 3} 0H${r * 3}M0 ${-r * 3}V${r * 3}" stroke="${col}" stroke-opacity=".3"/>`;
        const anneau = b.rg ? `<ellipse rx="${(r * 1.95).toFixed(1)}" ry="${(r * .5).toFixed(1)}" fill="none" stroke="${col}" stroke-opacity=".75" stroke-width="1.3" transform="rotate(-18)"/>` : "";
        return `${anneau}<circle r="${r.toFixed(1)}" fill="${col}" fill-opacity=".17" stroke="${col}" stroke-width="1.7" filter="url(#tbxGlow)"/><ellipse rx="${(r * .42).toFixed(1)}" ry="${r.toFixed(1)}" fill="none" stroke="${col}" stroke-opacity=".5" stroke-width=".9"/><ellipse rx="${r.toFixed(1)}" ry="${(r * .36).toFixed(1)}" fill="none" stroke="${col}" stroke-opacity=".5" stroke-width=".9"/>`;
    }
    function spriteAplat(b, p, r, col) {
        const L = Math.hypot(p.x, p.y) || 1, ang = Math.atan2(p.y, p.x) * 180 / Math.PI;            // l'ombre est du cote oppose a l'etoile
        if (b.e) return `<circle r="${(r * 2).toFixed(1)}" fill="${col}" fill-opacity=".2"/><circle r="${r.toFixed(1)}" fill="${col}" stroke="#02080c" stroke-width="1.5"/>`;
        const anneau = b.rg ? `<ellipse rx="${(r * 1.95).toFixed(1)}" ry="${(r * .5).toFixed(1)}" fill="none" stroke="#02080c" stroke-width="${Math.max(3, r * .3).toFixed(1)}" transform="rotate(-18)"/><ellipse rx="${(r * 1.95).toFixed(1)}" ry="${(r * .5).toFixed(1)}" fill="none" stroke="${col}" stroke-width="${Math.max(1.6, r * .16).toFixed(1)}" transform="rotate(-18)"/>` : "";
        return `${anneau}<circle r="${r.toFixed(1)}" fill="${col}" stroke="#02080c" stroke-width="1.5"/><g transform="rotate(${ang.toFixed(0)})"><path d="M0 ${-r}A${r} ${r} 0 0 1 0 ${r}A${(r * .55).toFixed(1)} ${r} 0 0 0 0 ${-r}Z" fill="#000" fill-opacity=".3"/></g>`;
    }
    function sprite(b, p, r, defs) {
        const id = "c" + b.i, L = Math.hypot(p.x, p.y) || 1, ux = -p.x / L, uy = -p.y / L;          // direction de l'etoile (l'eclairage vient du centre)
        if (b.e) {
            const t = String(b.c || "").charAt(0), c = ETOILES[t] || "#ffe2b0", f = b.i === 0 || !p.x && !p.y ? 1 : .75;
            defs.push(`<radialGradient id="${id}k"><stop offset="0" stop-color="${c}" stop-opacity=".55"/><stop offset=".45" stop-color="${c}" stop-opacity=".16"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient><radialGradient id="${id}s"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="${tint(c, .35)}"/><stop offset="1" stop-color="${c}"/></radialGradient>`);
            return `<circle r="${(r * 3.6 * f).toFixed(1)}" fill="url(#${id}k)" class="tbx-corona"/><g class="tbx-rayons" stroke="${c}" stroke-opacity=".28" stroke-width="1.2">${[0, 45, 90, 135].map(a => `<line x1="${(-r * 3 * f).toFixed(1)}" y1="0" x2="${(r * 3 * f).toFixed(1)}" y2="0" transform="rotate(${a})"/>`).join("")}</g><circle r="${r.toFixed(1)}" fill="url(#${id}s)"/>`;
        }
        const pal = PAL[String(b.c || "").toLowerCase()] || ["#8d8a86"], base = pal[0], fx = (0.5 + 0.3 * ux).toFixed(2), fy = (0.5 + 0.3 * uy).toFixed(2);
        defs.push(`<radialGradient id="${id}o" cx=".5" cy=".5" r=".62" fx="${fx}" fy="${fy}"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".78"/></radialGradient>`);
        let fond;
        if (pal[1]) {         // geante gazeuse : bandes
            const st = []; for (let k = 0; k <= 8; k++) st.push(`<stop offset="${(k / 8).toFixed(2)}" stop-color="${tint(base, k % 2 ? -0.2 : 0.16)}"/>`);
            defs.push(`<linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1">${st.join("")}</linearGradient>`);
            fond = `<circle r="${r.toFixed(1)}" fill="url(#${id}b)"/>`;
        } else fond = `<circle r="${r.toFixed(1)}" fill="${base}"/>`;
        let extra = "";
        const cl = String(b.c || "").toLowerCase();
        if (cl === "earthlike body" || cl === "water world") {          // continents / nuages, tailles deduites de l'identifiant (stable)
            const h = hash(b.i + b.n), col = cl === "earthlike body" ? "#4fae52" : "#9fd3ff";
            defs.push(`<clipPath id="${id}c"><circle r="${r.toFixed(1)}"/></clipPath>`);
            extra = `<g clip-path="url(#${id}c)" opacity="${cl === "earthlike body" ? .8 : .35}"><ellipse cx="${((h % 7) - 3) * r / 6}" cy="${(((h >> 3) % 7) - 3) * r / 6}" rx="${r * .55}" ry="${r * .3}" fill="${col}" transform="rotate(${h % 60 - 30})"/><ellipse cx="${(((h >> 5) % 7) - 3) * r / 5}" cy="${(((h >> 7) % 5) - 2) * r / 5}" rx="${r * .35}" ry="${r * .22}" fill="${col}"/></g>`;
        }
        const anneau = b.rg ? `<ellipse rx="${(r * 1.95).toFixed(1)}" ry="${(r * .5).toFixed(1)}" fill="none" stroke="#d8cfbf" stroke-opacity=".55" stroke-width="${Math.max(1.4, r * .16).toFixed(1)}" transform="rotate(-18)"/>` : "";
        const anneauAvant = b.rg ? `<path d="M${(-r * 1.95).toFixed(1)} 0 A${(r * 1.95).toFixed(1)} ${(r * .5).toFixed(1)} 0 0 0 ${(r * 1.95).toFixed(1)} 0" fill="none" stroke="#efe6d6" stroke-opacity=".7" stroke-width="${Math.max(1.4, r * .16).toFixed(1)}" transform="rotate(-18)"/>` : "";
        const halo = b.at ? `<circle r="${(r + 2.6).toFixed(1)}" fill="none" stroke="${tint(base, .35)}" stroke-opacity=".22" stroke-width="4"/><circle r="${(r + 1.4).toFixed(1)}" fill="none" stroke="${tint(base, .35)}" stroke-opacity=".6" stroke-width="1.4"/>` : "";
        const hh = hash(b.i + b.n), tex = styleCarte() === "real" ? `<circle r="${r.toFixed(1)}" fill="#888" filter="url(#${pal[1] ? "tbxG" + (hh % 2) : "tbxR" + (hh % 3)})" opacity="${pal[1] ? .55 : .5}"/>` : "";
        return `${anneau}${fond}${extra}${tex}<circle r="${r.toFixed(1)}" fill="url(#${id}o)"/>${halo}${anneauAvant}`;
    }

    // fiches des corps decouverts : jusqu'a 4 de chaque cote, les plus interessants d'abord
    const echIci = (b, sys) => (((D() || {}).bio || {}).ech || []).filter(c => c.bi === b.i && (!c.sy || c.sy === sys.nom));
    function carteSysteme(sys) {
        const bs = sys.b || [];
        if (!bs.length) return `<div class="tbx-vide">Aucun corps scanné dans ce système pour l'instant.<br><span>${sys.nb ? sys.nb + " corps détectés par le scanner de découverte : " : ""}lancez l'analyse FSS, les corps apparaissent ici au fur et à mesure.</span></div>`;
        const L = disposition(bs), z = EX.z.sys, defs = [], monde = [], filtres = filtresActifs(), actif = filtres.length > 0, st = styleCarte();
        let g = hash(sys.nom); const al = () => (g = (g * 16807) % 2147483647) / 2147483647, fond = [];
        for (let i = 0; i < (st === "real" ? 90 : 45); i++) fond.push(`<circle cx="${(MX - FRX + al() * 2 * FRX).toFixed(0)}" cy="${(MY - FRY + al() * 2 * FRY).toFixed(0)}" r="${(0.4 + al() * (st === "real" ? 1.1 : 0.7)).toFixed(1)}" fill="#cfeaff" fill-opacity="${(0.1 + al() * (st === "real" ? 0.5 : 0.28)).toFixed(2)}"/>`);
        if (st === "real") fond.unshift(`<ellipse cx="${MX - 120}" cy="${MY - 90}" rx="210" ry="120" fill="url(#tbxNeb1)"/><ellipse cx="${MX + 140}" cy="${MY + 110}" rx="230" ry="130" fill="url(#tbxNeb2)"/>`);
        if (st === "holo") { for (let r = 40; r <= 280; r += 40) fond.unshift(`<circle cx="${MX}" cy="${MY}" r="${r}" fill="none" stroke="rgba(0,240,255,.07)"/>`); for (let a = 0; a < 360; a += 30) fond.unshift(`<line x1="${MX}" y1="${MY}" x2="${(MX + 300 * Math.cos(a * Math.PI / 180)).toFixed(0)}" y2="${(MY + 300 * Math.sin(a * Math.PI / 180)).toFixed(0)}" stroke="rgba(0,240,255,.05)"/>`); }
        // orbites : cercles fins, une par planete ; lunes autour de leur planete
        Array.from(new Set(L.hauts.filter(b => b !== L.centre).map(b => Math.round(L.pos.get(b.i).o)))).forEach(r => monde.push(`<circle r="${r}" fill="none" stroke="${st === "holo" ? "rgba(0,240,255,.26)" : "rgba(130,200,220,.14)"}"${st === "real" ? ' stroke-dasharray="1 5"' : ""}/>`));
        L.pos.forEach(p => { if (p.parent != null) { const q = L.pos.get(p.parent); if (q) monde.push(`<circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="${p.o.toFixed(1)}" fill="none" stroke="rgba(130,200,220,.16)"/>`); } });
        bs.slice().sort((a, b) => (b.e ? 1 : 0) - (a.e ? 1 : 0)).forEach(b => {
            const p = L.pos.get(b.i); if (!p) return;
            const r = L.rayon(b), taille = r * (b.rg ? 1.9 : 1), pa = palier(b), fort = !b.e && pa.lib !== "FAIBLE", corr = !actif || correspond(b, sys.nom), moon = p.parent != null, selec = EX.sel === b.i;
            const opa = actif ? (corr ? 1 : .14) : (b.e ? 1 : b.x ? .66 : 1);
            let tete = "", teinte = "", sel = "";
            if (!b.e) {                                  // le corps prend la couleur de son palier
                if (st === "real") {                      // lueur de la couleur de priorite autour de la planete + voile leger
                    if (fort) tete += `<circle r="${(taille + 5).toFixed(1)}" fill="none" stroke="${pa.col}" stroke-width="4" stroke-opacity=".55" filter="url(#tbxGlow)"/>`;
                    tete += `<circle r="${(taille + 5).toFixed(1)}" fill="none" stroke="${pa.col}" stroke-opacity="${fort ? .95 : .4}" stroke-width="${fort ? 1.8 : 1}"/>`;
                    if (fort) teinte = `<circle r="${r.toFixed(1)}" fill="${pa.col}" fill-opacity=".3" pointer-events="none"/>`;
                } else if (st === "holo") { if (fort) tete += `<circle r="${(taille + 7).toFixed(1)}" fill="none" stroke="${pa.col}" stroke-opacity=".4" stroke-dasharray="2 3"/>`; }
                else if (fort) tete += `<circle r="${(taille + 4).toFixed(1)}" fill="none" stroke="${pa.col}" stroke-opacity=".55" stroke-width="1.4"/>`;
                if (!b.wd) tete += `<circle r="${(taille + 10).toFixed(1)}" fill="none" stroke="#FF4FD8" stroke-width="1.5" stroke-dasharray="4 4"/>`;
                if (actif && corr) tete += `<circle r="${(taille + 13).toFixed(1)}" fill="none" stroke="#fff" stroke-width="1.6" stroke-opacity=".9"/>`;
            }
            if (selec) { const q = taille + 14; sel = `<path d="M${-q} ${-q + 6}V${-q}H${-q + 6} M${q - 6} ${-q}H${q}V${-q + 6} M${-q} ${q - 6}V${q}H${-q + 6} M${q - 6} ${q}H${q}V${q - 6}" fill="none" stroke="#fff" stroke-width="1.8"/>`; }
            const reduit = pa.lib === "FAIBLE" && !actif && !selec, sg = signesCorps(b, sys.nom).filter(x => !reduit || (x.m === "scan" && !b.x) || x.m === "bio" || x.m === "tag");
            const gauche = p.x < 0, nom = esc(b.n), dist = !moon && !b.e && b.d ? fmtN(b.d) + " Ls" : "", w = Math.max(nom.length * 6.9, dist.length * 5.6) + 12, h = dist ? 27 : 16, lx = gauche ? -(taille + 9 + w) : taille + 9;
            const lab = `<g class="${moon ? "lm" + (selec ? " v" : "") : "lp"}" pointer-events="none"><rect x="${lx.toFixed(1)}" y="${(-h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h}" rx="3" fill="rgba(2,12,18,.82)" stroke="rgba(130,200,220,.3)" stroke-width=".6"/><text x="${(lx + 6).toFixed(1)}" y="${(dist ? -h / 2 + 11.5 : 4).toFixed(1)}" font-size="11.5" fill="${b.e ? "#ffe9c0" : "#eaffff"}">${nom}</text>${dist ? `<text x="${(lx + 6).toFixed(1)}" y="${(-h / 2 + 22.5).toFixed(1)}" font-size="9.5" fill="#86aab5">${dist}</text>` : ""}</g>`;
            monde.push(`<g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})" class="tbx-c" style="opacity:${opa}" onclick="explorationCorps(${b.i})"><circle r="${Math.max(taille + 8, 12).toFixed(1)}" fill="rgba(0,0,0,0)"/>${tete}${st === "holo" ? spriteHolo(b, p, r, b.e ? (ETOILES[String(b.c || "").charAt(0)] || "#ffe2b0") : (b.cm ? "#00FF66" : fort ? pa.col : "#7fb6c4")) : st === "flat" ? spriteAplat(b, p, r, b.e ? (ETOILES[String(b.c || "").charAt(0)] || "#ffe2b0") : (b.cm ? "#00FF66" : fort ? pa.col : "#66737d")) : sprite(b, p, r, defs)}${teinte}${b.cm && st !== "flat" ?  `<text y="3.5" font-size="${Math.max(8, r * 1.05).toFixed(0)}" text-anchor="middle" fill="#00220f" font-weight="bold" pointer-events="none">✔</text>` : ""}${sel}${lab}</g>`
                + (sg.length ? `<g transform="translate(${p.x.toFixed(1)} ${(p.y + taille + 15).toFixed(1)})" pointer-events="none" style="opacity:${opa}">${sg.map((x, n) => `<g transform="translate(${((n - (sg.length - 1) / 2) * 12).toFixed(1)} 0)">${x.s}</g>`).join("")}</g>` : ""));
        });
        const hud = `<svg viewBox="${MX - FRX - 6} ${MY - FRY - 6} ${2 * FRX + 12} ${2 * FRY + 12}" class="tbx-hud${z.k >= 2.2 ? " zl" : ""}" data-tbxhud="1" role="img" aria-label="Carte du système ${esc(sys.nom)}"><defs>
            <radialGradient id="tbxfond" cx=".5" cy=".5" r=".65"><stop offset="0" stop-color="${st === "real" ? "#0b1a2b" : st === "holo" ? "#041a24" : "#070d12"}"/><stop offset="1" stop-color="${st === "real" ? "#01040a" : "#02080c"}"/></radialGradient>
            <radialGradient id="tbxNeb1"><stop offset="0" stop-color="#4b2a8a" stop-opacity=".32"/><stop offset="1" stop-color="#4b2a8a" stop-opacity="0"/></radialGradient><radialGradient id="tbxNeb2"><stop offset="0" stop-color="#0f6a86" stop-opacity=".3"/><stop offset="1" stop-color="#0f6a86" stop-opacity="0"/></radialGradient>
            <filter id="tbxGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            ${st === "real" ? [3, 8, 14].map((sd, k) => `<filter id="tbxR${k}" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".13" numOctaves="3" seed="${sd}" result="t"/><feColorMatrix in="t" type="matrix" values="1.9 0 0 0 -.45  1.9 0 0 0 -.45  1.9 0 0 0 -.45  0 0 0 0 .6" result="g"/><feComposite in="g" in2="SourceAlpha" operator="in"/></filter>`).join("") + [5, 11].map((sd, k) => `<filter id="tbxG${k}" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".012 .11" numOctaves="3" seed="${sd}" result="t"/><feColorMatrix in="t" type="matrix" values="1.7 0 0 0 -.35  1.7 0 0 0 -.35  1.7 0 0 0 -.35  0 0 0 0 .65" result="g"/><feComposite in="g" in2="SourceAlpha" operator="in"/></filter>`).join("") : ""}
            <clipPath id="tbxcadre"><rect x="${MX - FRX}" y="${MY - FRY}" width="${2 * FRX}" height="${2 * FRY}"/></clipPath>${defs.join("")}</defs>
            <rect x="${MX - FRX}" y="${MY - FRY}" width="${2 * FRX}" height="${2 * FRY}" fill="url(#tbxfond)" stroke="#0b4350"/>
            <g clip-path="url(#tbxcadre)">${fond.join("")}<g id="tbx-monde" transform="translate(${(MX - z.cx * z.k).toFixed(1)} ${(MY - z.cy * z.k).toFixed(1)}) scale(${z.k.toFixed(3)})">${monde.join("")}</g></g>
            <path d="M${MX - FRX} ${MY - FRY + 22}V${MY - FRY}H${MX - FRX + 22} M${MX + FRX - 22} ${MY - FRY}H${MX + FRX}V${MY - FRY + 22} M${MX - FRX} ${MY + FRY - 22}V${MY + FRY}H${MX - FRX + 22} M${MX + FRX - 22} ${MY + FRY}H${MX + FRX}V${MY + FRY - 22}" fill="none" stroke="#00F0FF" stroke-width="2"/>
            </svg>`;
        const non = sys.nb != null ? Math.max(0, sys.nb - bs.length) : null;
        const choixStyle = `<div class="tbx-sty"><span class="tb-seg">${STYLES.map(x => `<button type="button" class="${st === x[0] ? "on" : ""}" onclick="explorationStyle('${x[0]}')">${x[1]}</button>`).join("")}</span></div>`;
        return `<div class="tbx-carte">${hud}${choixStyle}${zoomBtns("sys")}</div>
            <div class="tb-sub">${non ? `<b style="color:#e8a35a">${non} corps pas encore scannés</b> (analyse FSS à terminer) · ` : sys.tous ? "Tous les corps sont scannés · " : ""}${sys.ceint ? sys.ceint + " amas de ceinture · " : ""}molette = zoom, glisser = déplacer</div>`;
    }
    const R1x = () => 232;
    const zoomBtns = id => `<div class="tbx-zb"><button type="button" data-tbxz="${id}:in" title="Zoomer">+</button><button type="button" data-tbxz="${id}:out" title="Dézoomer">−</button><button type="button" data-tbxz="${id}:reset" title="Vue d'ensemble">⟲</button></div>`;

    function blocGenres(b) {
        const G = EXO().genres, ks = (b.gk || []).filter(k => G[k]); if (!ks.length) return "";
        const max = Math.max(...ks.map(k => G[k].max));
        return ks.map((k, i) => `<div class="tbx-gn"><span class="nm">${esc((b.gen || [])[i] || G[k].ex)}</span><span class="br"><i style="left:${(G[k].min / max * 100).toFixed(1)}%;width:${Math.max(3, (G[k].max - G[k].min) / max * 100).toFixed(1)}%"></i></span><span class="va">${km(G[k].min)}${G[k].max > G[k].min ? " – " + km(G[k].max) : ""}</span></div>`).join("");
    }
    function blocEchDe(b, sys) {
        const e = echIci(b, sys); if (!e.length) return "";
        return e.map(c => `<div class="tbx-sm"><span class="pt" style="background:${c.k >= 3 ? "#00FF66" : "#FFD700"}"></span><span class="nm">${esc(c.s)}</span><span class="et">${c.k >= 3 ? "analysé · à vendre" : "prélèvement " + c.k + " / 3"}</span><span class="va">${km(valeurEsp(c.sc))}</span></div>`).join("");
    }
    // ---------------------------------------------------------------------------------------------
    //  SITES DE PRELEVEMENT : ou chaque echantillon a ete pris (position relevee par le plugin au moment du prelevement), distance minimale entre deux sites d'une meme espece.
    //  Aucune donnee en plus a envoyer : les positions voyagent avec l'envoi normal (toutes les 30 s au plus). Le jeu affiche deja sa propre jauge : ceci montre l'ensemble.
    // ---------------------------------------------------------------------------------------------
    // distance minimale entre deux prelevements d'un meme genre (m). sur = recoupee par plusieurs sources ; sinon valeur de la communaute, a confirmer en jeu.
    const DIST = { Bacterial: [500, 1], Stratum: [500, 1], Tubus: [800, 1], Osseus: [800, 1], Shrubs: [150, 1], Electricae: [1000, 1],
        Tussocks: [200, 0], Clypeus: [150, 0], Fonticulus: [500, 0], Aleoids: [150, 0], Cactoid: [300, 0], Conchas: [150, 0], Fumerolas: [100, 0], Fungoids: [300, 0], Recepta: [150, 0] };
    const COUL_SITES = ["#00FF66", "#FFD700", "#00F0FF", "#FF4FD8", "#FF9A1F", "#9fb0b8"];
    function metres(la, lo, la0, lo0, r) { const d = Math.PI / 180; return [(lo - lo0) * d * r * Math.cos(la0 * d), (la - la0) * d * r]; }
    const dist2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    function carteSites(b, sys) {
        const ech = echIci(b, sys).filter(c => (c.pts || []).some(Boolean) && c.r > 0); if (!ech.length) return "";
        const R0 = ech[0].r, pts0 = ech.flatMap(c => c.pts.filter(Boolean)), la0 = pts0.reduce((t, p) => t + p[0], 0) / pts0.length, lo0 = pts0.reduce((t, p) => t + p[1], 0) / pts0.length;
        const bio = (D() || {}).bio || {}, ici = bio.ici && ech.some(c => c.bf && c.bf === bio.ici.bn) ? bio.ici : null;
        const me = ici ? metres(ici.la, ici.lo, la0, lo0, R0) : null;
        const sp = ech.map((c, i) => ({ c, i, col: COUL_SITES[i % COUL_SITES.length], m: c.pts.map(p => p ? metres(p[0], p[1], la0, lo0, R0) : null), min: (DIST[c.gk] || [0, 0]) }));
        let ext = 60; sp.forEach(o => { o.m.forEach(m => { if (m) ext = Math.max(ext, Math.abs(m[0]), Math.abs(m[1])); }); if (o.c.k < 3 && o.min[0]) ext = Math.max(ext, o.min[0] * 1.15); }); if (me) ext = Math.max(ext, Math.abs(me[0]), Math.abs(me[1]));
        ext *= 1.15; const W = 380, H = 270, k = 120 / ext, X = m => W / 2 + m[0] * k, Y = m => H / 2 - m[1] * k;
        const lignes = [];
        const svg = sp.map(o => {
            const pl = o.m.map((m, j) => m ? { m, j } : null).filter(Boolean); let g = "";
            for (let a = 1; a < pl.length; a++) { const d = dist2(pl[a - 1].m, pl[a].m), ok = !o.min[0] || d >= o.min[0]; g += `<line x1="${X(pl[a - 1].m)}" y1="${Y(pl[a - 1].m)}" x2="${X(pl[a].m)}" y2="${Y(pl[a].m)}" stroke="${o.col}" stroke-dasharray="4 4" opacity=".7"/><text x="${(X(pl[a - 1].m) + X(pl[a].m)) / 2 + 5}" y="${(Y(pl[a - 1].m) + Y(pl[a].m)) / 2 - 4}" font-size="9" fill="${ok ? o.col : "#FF3B30"}">${Math.round(d)} m${ok ? "" : " ✖"}</text>`; lignes.push([o, "site " + (pl[a - 1].j + 1) + " → " + (pl[a].j + 1), d, ok]); }
            if (o.c.k < 3 && o.min[0] && pl.length) { const l = pl[pl.length - 1].m; g += `<circle cx="${X(l)}" cy="${Y(l)}" r="${(o.min[0] * k).toFixed(1)}" fill="${o.col}" fill-opacity=".05" stroke="${o.col}" stroke-dasharray="3 5" opacity=".8"/>`; }
            g += pl.map(q => `<circle cx="${X(q.m)}" cy="${Y(q.m)}" r="6" fill="#04090c" stroke="${o.col}" stroke-width="2"/><text x="${X(q.m)}" y="${Y(q.m) + 3.5}" font-size="9" fill="${o.col}" text-anchor="middle">${q.j + 1}</text>`).join("");
            return g;
        }).join("");
        const cap = me ? (() => { const o = sp.filter(x => x.c.k < 3).pop() || sp[sp.length - 1], l = o.m.filter(Boolean).pop(), d = l ? dist2(me, l) : 0; return { o, d, reste: o.min[0] && l ? Math.max(0, o.min[0] - d) : 0 }; })() : null;
        const moi = me ? `<g transform="translate(${X(me)} ${Y(me)}) rotate(${ici.h || 0})"><path d="M0 -9 L6 7 L0 3 L-6 7 Z" fill="#fff" stroke="#00F0FF"/></g>` : "";
        const ageIci = ici && ici.t ? ago(ici.t) : "";
        const rows = lignes.map(([o, t, d, ok]) => `<div class="r"><span style="color:${o.col}">${esc(o.c.s)}</span><div>${t} : <b style="color:${ok ? "#00FF66" : "#FF3B30"}">${Math.round(d)} m</b>${o.min[0] ? " / minimum " + o.min[0] + " m" + (o.min[1] ? "" : " (à confirmer)") : ""}${ok ? " ✔" : " — trop proches"}</div></div>`).join("");
        return `<div class="tbx-sites"><div class="tbx-sh">SITES DE PRÉLÈVEMENT <em>nord en haut · le cercle pointillé est la distance minimale à respecter pour le prochain site</em></div>
            <div class="tbx-sb"><svg viewBox="0 0 ${W} ${H}" class="tbx-sv"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="rgba(0,20,30,.6)" stroke="#1f4f5a"/>${svg}${moi}<text x="${W - 8}" y="16" font-size="9" fill="#8b97a0" text-anchor="end">échelle : 100 m = ${(100 * k).toFixed(0)} px</text></svg>
            <div class="tbx-st">${rows || `<div class="tb-sub">Premier site relevé : le suivant doit en être éloigné de la distance minimale de son genre (cercle pointillé).</div>`}
            ${cap ? `<div class="r"><span>VOUS</span><div>à <b style="color:#fff">${Math.round(cap.d)} m</b> du dernier site de ${esc(cap.o.c.s)}${cap.reste ? " · encore <b style=\"color:#FFD700\">" + Math.round(cap.reste) + " m</b> à parcourir" : (cap.o.min[0] ? " · <b style=\"color:#00FF66\">distance suffisante</b>" : "")}<br><small style="color:#8b97a0">position relevée ${ageIci || "récemment"} (mise à jour toutes les 30 s environ : le jeu affiche sa propre jauge en direct)</small></div></div>` : ""}</div></div></div>`;
    }
    function apercuCorps(b, col) {
        const defs = [], p = { x: 50, y: 35 }, r = b.e ? 17 : 15, st = styleCarte();
        const corps = st === "holo" ? spriteHolo(b, p, r, col) : st === "flat" ? spriteAplat(b, p, r, col) : sprite(b, p, r, defs);
        return `<svg viewBox="-40 -40 80 80" class="ap" aria-hidden="true"><defs>${defs.join("")}</defs>${corps}</svg>`;
    }
    function fiche(sys) {
        const b = EX.sel != null && (sys.b || []).find(x => x.i === EX.sel); if (!b) return "";
        const pa = palier(b), dans = !b.e && taggue(sys.nom, b.i), col = b.e ? (ETOILES[String(b.c || "").charAt(0)] || "#ffe2b0") : pa.col;
        const tuile = (l, v, sous) => v ? `<div class="tbx-tu"><small>${l}</small><b>${v}</b>${sous ? `<em>${sous}</em>` : ""}</div>` : "";
        const masse = b.e ? (b.m || 0).toFixed(2).replace(".", ",") + " soleil" : (b.m || 0) >= 0.01 ? b.m.toFixed(2).replace(".", ",") + " Terre" : (b.m * 1000).toFixed(2).replace(".", ",") + " milli-Terre";
        const puces = b.e ? "" : `<div class="tbx-fc"><span class="ch" style="background:${pa.col};color:${pa.txt}">${pa.lib}</span><span class="ch ln">${b.x ? "PAS ENCORE SCANNÉ" : "SCANNÉ PAR VOUS"}</span>${b.l ? `<span class="ch ln" style="color:#FFD700;border-color:#FFD700">ATTERRISSABLE</span>` : ""}${b.bio ? `<span class="ch ln" style="color:#00FF66;border-color:#00FF66">EXOBIO ×${b.bio}</span>` : (bioPossible(b) ? `<span class="ch ln" style="color:#00FF66;border-color:#00FF66;border-style:dashed">EXOBIO POSSIBLE</span>` : "")}</div>
            <button type="button" class="tb-btn tbx-tagbtn${dans ? " on" : ""}" onclick="explorationTag(${b.i})">${dans ? "★ DANS MA FEUILLE DE ROUTE · RETIRER" : "☆ AJOUTER À MA FEUILLE DE ROUTE"}</button>`;
        const tuiles = tuile("DISTANCE", b.d ? fmtN(b.d) + " Ls" : "arrivée", "du point d'arrivée") + tuile("GRAVITÉ", !b.e && b.g ? b.g.toFixed(2).replace(".", ",") + " g" : "") + tuile("MASSE", masse) + tuile("ATMOSPHÈRE", !b.e ? (b.at ? esc(b.at) : "aucune") : "") + tuile("ANNEAUX", b.rg ? b.rg + (b.rg > 1 ? " anneaux" : " anneau") : "") + tuile("SURFACE", b.l ? "atterrissable" : "", b.l && !b.wf ? "personne n'y a posé le pied" : "");
        const rapporte = b.e ? `<div class="vc"><small>VALEUR DU SCAN</small><b>≈ ${fmtM(b.v)}</b></div>` : `<div class="vc${b.x && b.wd ? " no" : ""}"><small>SCAN SIMPLE (FSS)</small><b>${b.x && b.wd ? "impossible" : "≈ " + fmtM(b.v)}</b><em>${b.x && b.wd ? "déjà découvert par un autre pilote" : b.x ? "première découverte comprise" : "relevé"}</em></div>
            <div class="vc dss" style="--c:${pa.col}"><small>CARTE AU SCANNER DE SURFACE (DSS)</small><b>${b.cm ? "fait · " : "≈ "}${fmtM(b.cm ? b.v : b.pot)}</b><em>${b.cm ? "vous l'avez cartographié" : "carte efficace" + (b.wd ? " · si personne ne l'a déjà cartographiée (sinon beaucoup moins)" : " · première découverte comprise")}</em></div>`;
        const statut = [!b.wd ? `<span class="pl" style="color:#FF4FD8;border-color:#FF4FD8">JAMAIS DÉCOUVERT</span>` : `<span class="pl">découvert par un autre pilote</span>`, b.e ? "" : (b.wm ? `<span class="pl">déjà cartographié par un autre pilote</span>` : `<span class="pl" style="color:#00F0FF;border-color:#00F0FF">jamais cartographié</span>`)].join("");
        const genres = blocGenres(b), ech = blocEchDe(b, sys);
        const exo = b.bio ? `<div class="tbx-sec">EXOBIOLOGIE <em>${b.bio} signal${b.bio > 1 ? "aux" : ""} biologique${b.bio > 1 ? "s" : ""}</em></div>
            ${b.gen && b.gen.length ? `<div class="tbx-gh">Genres : ${esc(b.gen.join(", "))}<small>valeur par espèce (minimum – maximum)</small></div>${genres}` : `<div class="tbx-gh">Genres connus après la cartographie DSS de la planète.</div>`}
            ${ech ? `<div class="tbx-gh" style="margin-top:8px">Vos échantillons ici</div>${ech}` : ""}${carteSites(b, sys)}` : "";
        return `<div class="tbx-fd" style="--c:${col};background:linear-gradient(180deg,${b.e ? "rgba(40,30,10,.8)" : pa.fond} 0,rgba(0,0,0,.28) 150px)">
            <div class="hd"><div class="tx"><div class="nm">${esc(b.n)}</div><div class="nt">${esc(natureLongue(b.c, b.e, b.tf))}</div><div class="sy">${esc(sys.nom || "")}${b.d ? " · " + fmtN(b.d) + " Ls" : ""}</div></div>${apercuCorps(b, col)}<span class="x" onclick="explorationCorps(${b.i})" title="Fermer">✕</span></div>
            ${puces}<div class="vcs">${rapporte}</div><div class="tbx-tls">${tuiles}</div><div class="tbx-sts">${statut}</div>${exo}${b.geo ? `<div class="tbx-sec">SIGNAUX GÉOLOGIQUES <em>${b.geo}</em></div>` : ""}</div>`;
    }

    // ---------------------------------------------------------------------------------------------
    //  OU VENDRE : stations avec la cartographie universelle (et la genetique) autour de la position, d'apres Spansh (fonction SQL explo_ou_vendre)
    // ---------------------------------------------------------------------------------------------
    const CLE_VT = "edteam_tb_exp_vente_";
    const vt = svc => EX.vente[svc] || (EX.vente[svc] = { st: "vide", donnees: null, calcule: null, msg: "", jeton: 0, cle: "" });
    const rayonVt = () => EX.rayon || (EX.rayon = [40, 80, 150, 300].indexOf(Number(lire("edteam_tb_exp_rayon"))) >= 0 ? Number(lire("edteam_tb_exp_rayon")) : 80);
    const grandeVt = () => { if (EX.grande == null) { const v = lire("edteam_tb_exp_grande"); EX.grande = v === "0" ? false : v === "1" ? true : (typeof REGL !== "undefined" && REGL && REGL.grande != null ? !!REGL.grande : true); } return EX.grande; };
    const cleVt = svc => String((S && S.systeme) || "").toLowerCase() + "|" + rayonVt() + "|" + (grandeVt() ? 1 : 0) + "|" + svc;
    function memoireVt(svc) {                   // un resultat deja obtenu (3 h) pour ce systeme et ces reglages : affiche sans rien demander
        const T = vt(svc);
        if (T.st === "EN_COURS" || (T.cle === cleVt(svc) && T.st !== "vide")) return T;
        try { const o = JSON.parse(lire(CLE_VT + svc) || "null"); if (o && o.cle === cleVt(svc) && o.donnees && Date.now() - Date.parse(o.calcule) < 3 * 3600e3) { T.st = "PRET"; T.donnees = o.donnees; T.calcule = o.calcule; T.cle = o.cle; return T; } } catch (e) { /* memoire illisible : on repart */ }
        if (T.cle !== cleVt(svc)) { T.st = "vide"; T.donnees = null; T.msg = ""; }
        return T;
    }
    window.explorationReglerVente = (cle, v) => { if (typeof sonClic === "function") sonClic(); if (cle === "rayon") { EX.rayon = v; ecrire("edteam_tb_exp_rayon", String(v)); } else { EX.grande = !!v; ecrire("edteam_tb_exp_grande", v ? "1" : "0"); } ["cartographie", "genetique"].forEach(k => { const T = vt(k); T.st = "vide"; T.donnees = null; T.cle = ""; }); rendre(); };
    window.explorationChercherVente = async svc => {
        svc = svc === "genetique" ? "genetique" : "cartographie"; const T = vt(svc);
        if (!S || !S.systeme || T.st === "EN_COURS") return;
        if (typeof sonClic === "function") sonClic();
        const jeton = ++T.jeton, cle = cleVt(svc); T.st = "EN_COURS"; T.cle = cle; rendre();
        let r; try { r = await supabaseApp.rpc("explo_ou_vendre", { p_systeme: S.systeme, p_rayon: rayonVt(), p_grande: grandeVt(), p_service: svc }); } catch (e) { r = { error: { message: "Connexion impossible." } }; }
        if (jeton !== T.jeton) return;
        if (r.error || !r.data) { T.st = "ERREUR"; const m = (r.error && r.error.message) || ""; T.msg = /could not find|function/i.test(m) ? "La recherche n'est pas encore installée sur le serveur (script SQL 93)." : (m || "Réponse vide."); rendre(); return; }
        const j = r.data;
        if (j.statut === "PRET") { T.st = "PRET"; T.donnees = j.donnees; T.calcule = j.calcule_le; ecrire(CLE_VT + svc, JSON.stringify({ cle, donnees: j.donnees, calcule: j.calcule_le })); } else { T.st = "ERREUR"; T.msg = j.message || "Recherche impossible pour le moment."; }
        rendre();
    };
    const TYPE_STATION = [["orbis", "Orbis"], ["coriolis", "Coriolis"], ["ocellus", "Ocellus"], ["asteroid", "Base astéroïde"], ["planetary port", "Port planétaire"], ["planetary outpost", "Avant-poste planétaire"], ["outpost", "Avant-poste"], ["settlement", "Colonie de surface"], ["carrier", "Porte-vaisseaux"]];
    const typeStation = t => { const k = String(t || "").toLowerCase(); const m = TYPE_STATION.find(x => k.indexOf(x[0]) >= 0); return m ? m[1] : (t || "Station"); };
    // ce que contient chaque service : les corps scannes (cartographie) ou les echantillons (genetique), du plus precieux au moins precieux
    function contenuVente(svc) {
        const d = D() || {}, gen = svc === "genetique";
        if (gen) {
            const ech = echTries(((d.bio && d.bio.ech) || []).slice()), b = sommeBio(d);
            if (!ech.length) return `<div class="tb-sub" style="margin:2px 0 8px">Aucun échantillon : rien à vendre ici pour l'instant.</div>`;
            return `<div class="tb-sub" style="margin:2px 0 4px">VOS ÉCHANTILLONS · ${b.nA ? "analysés ≈ " + fmtM(b.analyse) : "aucun analysé"}${b.nC ? " · " + b.nC + " en cours (vendables après les 3 prélèvements)" : ""}</div><div class="tbx-jb tbx-jv">${ech.map(ligneBio).join("")}</div>`;
        }
        const corps = ((d.dec) || []).slice().sort((a, b) => (Number(b.v) || 0) - (Number(a.v) || 0)), nv = d.nv || {};
        if (!corps.length) return `<div class="tb-sub" style="margin:2px 0 8px">Aucun corps scanné en attente de vente.</div>`;
        return `<div class="tb-sub" style="margin:2px 0 4px">VOS SCANS · ${nv.n ? "≥ " + fmtM(nv.v || 0) : ""} · du plus précieux au moins précieux</div><div class="tbx-jb tbx-jv">${corps.map(ligneJournal).join("")}</div>${(nv.n || 0) > corps.length ? `<div class="tb-sub">${corps.length} corps listés (les plus récents), sur ${fmtN(nv.n)} non vendus.</div>` : ""}`;
    }
    // UN SEUL BLOC : une recherche lance les deux services (cartographie universelle + genetique) et les fusionne en un tableau : station, distance,
    // ce que vous y vendez en cartographie, ce que vous y vendez en exobiologie. Une station qui rachete les deux ressort en tete (meme vol, tout vendu).
    window.explorationChercherTout = () => {
        if (!S || !S.systeme) return;
        if (typeof sonClic === "function") sonClic();
        const f = window.explorationChercherVente, sv = window.sonClic; window.sonClic = null;
        try { f("cartographie"); f("genetique"); } finally { window.sonClic = sv; }
    };
    const cleSt = x => (String(x.n || "") + "|" + String(x.s || "")).toLowerCase();
    // stations des deux recherches, fusionnees. Chaque recherche est triee par distance et limitee a 10 : une station absente de la liste
    // « cartographie » mais plus proche que sa derniere entree n'a pas le service ; plus loin, on ne peut pas savoir (« ? »).
    function fusionVente(C, G) {
        const m = new Map(), dernier = L => L.length >= 10 ? Math.max(...L.map(x => Number(x.d) || 0)) : Infinity;
        const dC = dernier(C), dG = dernier(G);
        const exact = x => typeof x.cu === "boolean";      // script 94 : le serveur dit lui-meme si la station a les deux services
        C.forEach(x => m.set(cleSt(x), Object.assign({}, x, exact(x) ? { cu: x.cu, vg: !!x.v } : { cu: true, vg: x.v ? true : (Number(x.d) || 0) <= dG ? (G.some(y => cleSt(y) === cleSt(x)) ? true : false) : null })));
        G.forEach(x => { const k = cleSt(x), e = m.get(k); if (e) { if (!exact(x)) e.vg = true; } else m.set(k, Object.assign({}, x, exact(x) ? { cu: x.cu, vg: !!x.v } : { cu: (Number(x.d) || 0) <= dC ? false : null, vg: true })); });
        return [...m.values()].sort((a, b) => (a.d || 0) - (b.d || 0) || (b.cu === true ? 1 : 0) - (a.cu === true ? 1 : 0));
    }
    function blocVendreUnique() {
        const sys = (S && S.systeme) || "", d = D() || {}, nv = d.nv || {}, b = sommeBio(d), TC = memoireVt("cartographie"), TG = memoireVt("genetique");
        const reg = `<div class="tbx-reg"><span class="tb-seg">${[40, 80, 150, 300].map(r => `<button type="button" class="${rayonVt() === r ? "on" : ""}" onclick="explorationReglerVente('rayon',${r})">${r} al</button>`).join("")}</span><span class="tb-seg"><button type="button" class="${grandeVt() ? "on" : ""}" onclick="explorationReglerVente('grande',${grandeVt() ? 0 : 1})" title="Seulement les stations avec une grande piste d'atterrissage">GRANDE PISTE</button></span></div>`;
        const bouton = lib => `<button type="button" class="tb-btn" onclick="explorationChercherTout()">${lib}</button>`;
        const vC = nv.n ? Number(nv.v) || 0 : 0, vG = b.analyse || 0;
        const resume = `<div class="tbx-vr"><span><small>CARTOGRAPHIE</small><b>${nv.n ? "≥ " + fmtM(vC) : "rien"}</b><em>${nv.n ? fmtN(nv.n) + " corps" : "à vendre"}</em></span><span><small>EXOBIOLOGIE <i class="bd" style="color:#B388FF;border-color:#B388FF">EXOBIO</i></small><b>${b.nA ? "≈ " + fmtM(vG) : "rien"}</b><em>${b.nA ? fmtN(b.nA) + " espèce" + (b.nA > 1 ? "s" : "") + " analysée" + (b.nA > 1 ? "s" : "") : "analysé"}${b.nC ? " · " + b.nC + " en cours" : ""}</em></span></div>`;
        const okC = TC.st === "PRET" && !!TC.donnees, okG = TG.st === "PRET" && !!TG.donnees;
        let corps;
        if (!sys) corps = `<div class="tbx-vide" style="padding:12px">Position inconnue : le jeu doit d'abord donner votre système.</div>`;
        else if (TC.st === "EN_COURS" || TG.st === "EN_COURS") corps = `<div class="tb-attente"><span class="tb-spin"></span><div><b>Recherche chez Spansh…</b><span>quelques secondes</span></div></div>`;
        else if (okC || okG) {
            const C = (okC && TC.donnees.stations) || [], G = (okG && TG.donnees.stations) || [], lignes = fusionVente(C, G).slice(0, 20);
            const cell = ok => ok === true ? `<b class="oui">✔</b>` : ok === false ? `<span class="non">—</span>` : `<span class="mut" title="Pas assez de stations relevées à cette distance pour le savoir">?</span>`;
            const tout = lignes.find(x => x.cu === true && x.vg === true);
            const reco = tout ? `<div class="tbx-reco">Tout vendre à <b>${cp(tout.n)}</b> · ${cp(tout.s)} · ${tout.d ? fmtN(tout.d) + " al" : "dans votre système"}${tout.ls ? " · " + fmtN(tout.ls) + " Ls" : ""}<small>Cette station rachète la cartographie ET l'exobiologie${vC || vG ? " : " + [vC ? "cartographie ≥ " + fmtM(vC) : "", vG ? "exobiologie ≈ " + fmtM(vG) : ""].filter(Boolean).join(" · ") : ""}. Les prix sont les mêmes partout : seule la distance compte.</small></div>`
                : lignes.length ? `<div class="tbx-reco">Aucune station relevée ne rachète les deux dans ce rayon : <b>${cp(lignes[0].n)}</b> · ${cp(lignes[0].s)} est la plus proche${lignes[0].d ? " (" + fmtN(lignes[0].d) + " al)" : ""}.<small>Élargissez le rayon pour en trouver une qui prenne tout.</small></div>` : "";
            const tete = `<div class="tbx-vt tete"><span></span><span>SYSTÈME</span><span>STATION</span><span class="c">DISTANCE</span><span class="c">ARRIVÉE</span><span class="c">GRANDE PISTE</span><span class="c">SCANS</span><span class="c">ÉCHANTILLONS <i class="bd" style="color:#B388FF;border-color:#B388FF">EXOBIO</i></span></div>`;
            const lst = lignes.length ? lignes.map(x => `<div class="tbx-vt${x.cu === true && x.vg === true ? " tout" : ""}"><span class="pt" style="background:${x.cu === true && x.vg === true ? "#00FF66" : "#00F0FF"}"></span>
                <span class="sy">${cp(x.s)}</span><div class="n">${cp(x.n)}<small>${esc(typeStation(x.t))}${x.p ? " · planétaire" : ""}${x.c ? " · accès ouvert à tous, peut avoir bougé" : ""}</small></div>
                <span class="c">${x.d ? fmtN(x.d) + "<small>al</small>" : "<small>ici</small>"}</span><span class="c">${x.ls != null ? fmtN(x.ls) + "<small>Ls</small>" : "<small>?</small>"}</span><span class="c">${x.g ? "Oui" : "Non"}</span><span class="c">${cell(x.cu)}</span><span class="c">${cell(x.vg)}</span></div>`).join("")
                : `<div class="tbx-vide" style="padding:12px">Aucune station avec la cartographie ou la génétique à ${rayonVt()} al${grandeVt() ? " et grande piste" : ""} : élargissez le rayon.</div>`;
            const quand = TC.calcule || TG.calcule;
            corps = reco + `<div class="tbx-lst">${tete}${lst}</div><div class="tb-sub">${okC && okG ? "" : "Une des deux recherches a échoué : les colonnes concernées sont incomplètes. "}${quand ? "Relevé " + ago(quand) + " · " : ""}d'après les données des joueurs (Spansh) : le service peut avoir changé. Distances depuis ${esc(sys)}. « ? » : trop loin dans la liste pour savoir si la station a ce service.</div>
                <div style="margin-top:8px">${bouton("↻ RECHERCHER À NOUVEAU")}</div>`;
        }
        else if (TC.st === "ERREUR" || TG.st === "ERREUR") corps = `<div class="tb-banner">${esc(TC.msg || TG.msg)}</div>${bouton("↻ RÉESSAYER")}`;
        else corps = `<div class="tb-sub" style="margin:2px 0 8px">Trouvez les stations les plus proches de <b>${esc(sys)}</b> qui rachètent vos scans (cartographie universelle) et vos échantillons d'exobiologie (Vista Genomics), et repérez celles qui prennent les deux.</div>${bouton("▶ CHERCHER OÙ VENDRE")}`;
        const detail = `<details class="tbx-det2"><summary>VOIR LE DÉTAIL DE CE QUE JE VENDS</summary>${contenuVente("cartographie")}${contenuVente("genetique")}</details>`;
        return `<div class="bloc"><h2>OÙ VENDRE <em>cartographie universelle · génétique (Vista Genomics)</em></h2>${resume}${reg}${corps}${detail}</div>`;
    }

    // ---------------------------------------------------------------------------------------------
    //  OU VENDRE : fenetre (modale commune de la page) ; le prix est le meme dans toutes les stations d'un meme service, seule la distance compte
    // ---------------------------------------------------------------------------------------------
    window.explorationModaleHtml = function () {
        if (!document.getElementById("tbx-css")) document.head.insertAdjacentHTML("beforeend", CSS);
        const d = D(), B = "#00F0FF", nv = (d && d.nv) || {}, b = sommeBio(d);
        if (EX.mod === "dec") return `<div style="border-bottom:1px dashed ${B};padding-bottom:15px;margin-bottom:20px;flex-shrink:0;"><span style="color:${B};font-weight:bold;letter-spacing:3px;font-size:1.3em;">&gt; CE QUE J'AI DÉCOUVERT</span><span style="color:#778;font-size:.8em;margin-left:14px;">depuis votre dernière vente${d && d.tot && d.tot.debut ? " · " + ago(d.tot.debut) : ""}</span></div>
            <div style="overflow-y:auto;flex-grow:1;padding-right:10px;" class="tbx-md-dec">${blocDecouvertes(d)}</div>`;
        return `<div style="border-bottom:1px dashed ${B};padding-bottom:15px;margin-bottom:20px;flex-shrink:0;"><span style="color:${B};font-weight:bold;letter-spacing:3px;font-size:1.3em;">&gt; OÙ VENDRE MES DONNÉES</span></div>
            <div style="flex-shrink:0;color:#777;font-size:.78em;line-height:1.5;margin-bottom:8px;">ⓘ Universal Cartographics rachète la cartographie, Vista Genomics les échantillons d'exobiologie. Dans chaque service le prix est le même partout : choisissez la station la plus proche. Vous avez ${nv.n ? "au moins " + fmtM(nv.v) + " de cartographie" : "rien en cartographie"} et ${b.nA ? "environ " + fmtM(b.analyse) + " d'exobiologie analysée" : "aucun échantillon analysé"}.</div>
            <div style="overflow-y:auto;flex-grow:1;padding-right:10px;">${blocVendreUnique()}</div>`;
    };

    // ---------------------------------------------------------------------------------------------
    //  ECHANTILLONS DE LA SESSION (exobiologie) : une carte par espece, avec l'avancement des trois prelevements, la valeur et « nouveau dans le codex »
    // ---------------------------------------------------------------------------------------------
    const GLYPHES = {
        Stratum: c => `<g stroke="${c}" fill="none" stroke-width="2"><path d="M4 30 Q12 14 22 22 T40 18 M6 36 Q16 24 26 30 T44 26"/><circle cx="22" cy="22" r="2.6" fill="${c}"/></g>`,
        Tussocks: c => `<g stroke="${c}" fill="none" stroke-width="2"><path d="M10 38V20 M18 38V12 M26 38V18 M34 38V10 M42 38V22"/></g>`,
        Bacterial: c => `<g fill="${c}" fill-opacity=".8"><circle cx="14" cy="14" r="5"/><circle cx="30" cy="12" r="4"/><circle cx="24" cy="26" r="6"/><circle cx="40" cy="28" r="4"/><circle cx="12" cy="34" r="3.5"/></g>`,
        Fungoids: c => `<g stroke="${c}" fill="none" stroke-width="2"><path d="M6 20 Q22 4 38 20 Z M22 20V38"/><path d="M30 28 Q40 20 48 28 Z M40 28V38"/></g>`,
        Osseus: c => `<g stroke="${c}" fill="none" stroke-width="2.4"><path d="M10 38 L16 10 M22 38 L24 6 M34 38 L30 14 M44 38 L38 22"/></g>`,
        Shrubs: c => `<g stroke="${c}" fill="none" stroke-width="2"><path d="M26 40V20 M26 28 L14 16 M26 24 L38 12 M26 34 L16 28 M26 32 L38 26"/></g>`,
        Aleoids: c => `<g stroke="${c}" fill="none" stroke-width="2"><circle cx="26" cy="22" r="6"/><circle cx="26" cy="22" r="13" stroke-dasharray="3 4"/></g>`,
        Cactoid: c => `<g stroke="${c}" fill="none" stroke-width="2.6"><path d="M26 40V10 M26 26 H16 V18 M26 22 H36 V14"/></g>`,
        Conchas: c => `<g stroke="${c}" fill="none" stroke-width="2"><path d="M8 36 Q26 2 44 36 Z M26 36 V14 M16 36 L20 20 M36 36 L32 20"/></g>`,
        Tubus: c => `<g stroke="${c}" fill="none" stroke-width="3.4"><path d="M12 38V16 M26 38V8 M40 38V20"/></g>`,
        Fumerolas: c => `<g stroke="${c}" fill="none" stroke-width="2"><path d="M20 40 L22 22 H30 L32 40 Z M26 18 Q20 12 26 7 Q32 2 26 -2"/></g>`,
        Electricae: c => `<g stroke="${c}" fill="none" stroke-width="2.4"><path d="M30 6 L18 24 H28 L22 40 L36 20 H26 Z"/></g>`,
        Fonticulus: c => `<g fill="${c}" fill-opacity=".75"><path d="M14 8 Q22 20 14 28 Q6 20 14 8Z M34 14 Q42 26 34 34 Q26 26 34 14Z"/></g>`
    };
    const glyphe = (gk, c) => (GLYPHES[gk] || (k => `<g stroke="${k}" fill="none" stroke-width="2"><path d="M26 40 C10 30 10 14 26 6 C42 14 42 30 26 40 Z M26 40V14"/></g>`))(c);
    const echTries = ech => ech.slice().sort((a, b) => ((a.k < 3 ? 1 : 0) - (b.k < 3 ? 1 : 0)) || (b.k < 3 ? (a.t < b.t ? 1 : -1) : valeurEsp(b.sc) - valeurEsp(a.sc)));
    // Couleur de la variante (le jeu la donne dans le nom : « Stratum Tectonicas - Vert ») : le specimen, le liquide des fioles et le faisceau la prennent
    const VAR_COUL = { rouge: "#FF4D4D", red: "#FF4D4D", vert: "#4DFF7A", green: "#4DFF7A", jaune: "#FFE14D", yellow: "#FFE14D", bleu: "#4DA6FF", blue: "#4DA6FF", orange: "#FF9A3D", violet: "#B36BFF", purple: "#B36BFF", mauve: "#C98BFF", rose: "#FF8AD0", pink: "#FF8AD0", magenta: "#FF3DBE",
        blanc: "#F2F6FF", white: "#F2F6FF", gris: "#A9B4BC", grey: "#A9B4BC", gray: "#A9B4BC", noir: "#7b8a96", black: "#7b8a96", brun: "#C58B5A", marron: "#C58B5A", brown: "#C58B5A", turquoise: "#3DF2E0", cyan: "#3DE7FF", indigo: "#7A7AFF", lime: "#B6FF3D", ambre: "#FFB000", amber: "#FFB000",
        citron: "#F5FF5A", emeraude: "#2EE6A0", emerald: "#2EE6A0", sarcelle: "#2EC4C4", teal: "#2EC4C4", or: "#FFD700", gold: "#FFD700", argent: "#D5DCE3", silver: "#D5DCE3", cuivre: "#D8844A", bronze: "#CD7F32", vermillon: "#FF5A36", chartreuse: "#9BFF4A", azur: "#4DB8FF", rouille: "#C2552B" };
    const couleurVar = va => {
        const t = String(va || "").split(/\s-\s/).pop().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const k = Object.keys(VAR_COUL).find(x => t === x) || Object.keys(VAR_COUL).find(x => t.indexOf(x) >= 0);
        return k ? VAR_COUL[k] : null;
    };
    const idc = col => String(col || "").replace(/[^0-9a-f]/gi, "").toLowerCase();
    // fiole du scanner genetique : verre, bouchon, liquide a la couleur de la variante (plein = prelevement fait)
    function fiole(i, plein, col, lib) {
        const id = "tbxfl" + idc(col);
        return `<div class="fl${plein ? " p" : ""}"><svg viewBox="0 0 26 54"><defs><clipPath id="${id}"><path d="M7 8 V40 Q7 49 13 49 Q19 49 19 40 V8 Z"/></clipPath><linearGradient id="${id}g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".15"/></linearGradient></defs>
            ${plein ? `<g clip-path="url(#${id})"><rect x="6" y="16" width="14" height="36" fill="${col}" fill-opacity=".85"/><rect x="6" y="16" width="14" height="3" fill="#fff" fill-opacity=".45"/><circle cx="11" cy="34" r="1.3" fill="#fff" fill-opacity=".6"/><circle cx="15" cy="28" r=".9" fill="#fff" fill-opacity=".5"/></g>` : ""}
            <path d="M7 8 V40 Q7 49 13 49 Q19 49 19 40 V8 Z" fill="url(#${id}g)" stroke="${plein ? col : "#3b5560"}" stroke-width="1.4" ${plein ? "" : 'stroke-dasharray="3 3"'}/>
            <rect x="5" y="3" width="16" height="6" rx="1.5" fill="${plein ? "#1a2a30" : "#10181c"}" stroke="${plein ? col : "#3b5560"}" stroke-width="1.2"/></svg><span>${lib}</span></div>`;
    }
    function carteEch(c) {
        const fait = c.k >= 3, etat = fait ? "#00FF66" : "#FFD700", val = valeurEsp(c.sc);
        const va = String(c.va || "").replace(String(c.s || ""), "").replace(/^\s*-\s*/, "").trim() || String(c.g || "");
        const cv = couleurVar(c.va) || etat;
        const noms = ["LOG", "ÉCHANTILLON", "ANALYSE"];
        const particules = [[44, 96, 1.6, 0], [196, 84, 1.3, .7], [70, 52, 1.2, 1.3], [170, 44, 1.5, 2], [128, 28, 1.1, .4], [100, 108, 1.2, 1.7]].map(p => `<circle class="pa" cx="${p[0]}" cy="${p[1]}" r="${p[2]}" fill="${cv}" style="animation-delay:${p[3]}s"/>`).join("");
        const scene = `<svg viewBox="0 0 240 150" class="sc"><defs><radialGradient id="tbxrg${idc(cv)}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${cv}" stop-opacity=".35"/><stop offset="1" stop-color="${cv}" stop-opacity="0"/></radialGradient>
                <linearGradient id="tbxfa${idc(cv)}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${cv}" stop-opacity=".30"/><stop offset="1" stop-color="${cv}" stop-opacity="0"/></linearGradient></defs>
            <rect x="0" y="0" width="240" height="150" fill="rgba(0,12,18,.55)"/>
            <polygon points="68,120 172,120 150,10 90,10" fill="url(#tbxfa${idc(cv)})"/>
            <ellipse cx="120" cy="120" rx="92" ry="15" fill="url(#tbxrg${idc(cv)})"/>
            <ellipse cx="120" cy="120" rx="88" ry="13" fill="none" stroke="${cv}" stroke-opacity=".55" stroke-width="1"/><ellipse class="tr" cx="120" cy="120" rx="66" ry="9.5" fill="none" stroke="${cv}" stroke-opacity=".8" stroke-width="1.4" stroke-dasharray="10 8"/><ellipse cx="120" cy="120" rx="42" ry="6" fill="none" stroke="${cv}" stroke-opacity=".5" stroke-width="1"/>
            <g class="spec" style="--c:${cv}"><g transform="translate(120 66) scale(2.05) translate(-26 -22)">${glyphe(c.gk, cv)}</g></g>
            ${particules}<rect class="bal" x="40" y="0" width="160" height="2" fill="${cv}" fill-opacity=".9"/>
            <path d="M6 22 V6 H22 M218 6 H234 V22 M234 128 V144 H218 M22 144 H6 V128" fill="none" stroke="${cv}" stroke-opacity=".7" stroke-width="1.4"/>
            <text x="12" y="141" fill="${cv}" fill-opacity=".8" font-size="7.5" letter-spacing="1.5">${esc(String(c.sc || c.gk || "").toUpperCase().slice(0, 22))}</text>
            <text x="228" y="141" fill="${etat}" font-size="7.5" letter-spacing="1.5" text-anchor="end">${fait ? "ANALYSÉ" : "PRÉLÈVEMENT " + c.k + "/3"}</text></svg>`;
        const fioles = [0, 1, 2].map(i => fiole(i, i < c.k, cv, noms[i])).join("");
        return `<div class="tbx-sp2${fait ? " fait" : " cours"}" style="--c:${etat};--v:${cv}">${c.nv ? `<span class="nv">NOUVEAU CODEX</span>` : ""}
            <div class="hd"><small>${esc(c.g || "EXOBIOLOGIE")}</small><b>${esc(c.s)}</b><em>${esc(va)}${c.bn ? " · " + esc(c.bn) : ""}</em></div>${scene}
            <div class="fls">${fioles}</div>
            <div class="bas"><div class="val"${val ? "" : ` title="Valeur inconnue pour cette espèce"`}>${val ? km(val) : "?"} <small>cr</small></div><div class="pie">${fait ? "analysé · à vendre" : "prochain : " + noms[Math.min(c.k, 2)].toLowerCase()}<br>${c.sy ? esc(cut(c.sy, 26)) + " · " : ""}${c.t ? heureJournal(c.t) : "date inconnue"}</div></div></div>`;
    }
    function blocEchantillons(d, modal) {
        const ech = echTries(((d && d.bio && d.bio.ech) || []).slice()), liste = modal ? ech : ech.slice(0, 8);
        const corps = liste.length ? `<div class="tbx-spg">${liste.map(carteEch).join("")}</div>` : `<div class="tbx-vide">Aucun prélèvement d'exobiologie pour l'instant.<br><span>Posez-vous sur une planète à signaux biologiques et prélevez : l'avancement des trois prélèvements et la valeur apparaissent ici.</span></div>`;
        const plus = !modal && ech.length > 8 ? `<div class="tb-sub">+ ${ech.length - 8} autre${ech.length - 8 > 1 ? "s" : ""} dans la fenêtre « Échantillons de la session ».</div>` : "";
        if (modal) return corps;
        return `<div class="bloc or"><h2>ÉCHANTILLONS DE LA SESSION <em>trois prélèvements pour analyser une espèce · valeur par espèce</em></h2>${corps}${plus}</div>`;
    }
    const sommeBio = d => { const e = (d && d.bio && d.bio.ech) || []; return { analyse: e.filter(c => c.k >= 3).reduce((t, c) => t + valeurEsp(c.sc), 0), nA: e.filter(c => c.k >= 3).length, nC: e.filter(c => c.k < 3).length, nNouv: e.filter(c => c.nv).length, n: e.length }; };

    // vue combinaison : seulement quand on est a pied
    const vuePied = () => (S && S.pied && S.pied.on && typeof auSolHtml === "function") ? auSolHtml() : "";

    // ---------------------------------------------------------------------------------------------
    //  CSS + PAGE
    // ---------------------------------------------------------------------------------------------
    const CSS = `<style id="tbx-css">
        .tbx-bar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin:0 0 10px}.tbx-bar .tt{color:#fff;letter-spacing:3px;font-size:1.05em}.tbx-bar .tt em{font-style:normal;color:#8a9;font-size:.78em;letter-spacing:1px;margin-left:10px}
        .tbx-duo2{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:12px;margin:14px 0 12px;align-items:start}.tbx-duo{display:grid;grid-template-columns:minmax(0,2.1fr) minmax(0,1fr);gap:10px;margin-bottom:10px;align-items:start}.tbx-col{min-width:0}.tbx-col>.bloc{margin-bottom:10px}
        .tbx-entete{display:flex;justify-content:flex-end;margin:-4px 0 6px}
        .tbx-carte{position:relative}.tbx-svg,.tbx-hud{width:100%;height:auto;display:block;touch-action:none;user-select:none}.tbx-svg{background:radial-gradient(ellipse at 50% 50%,rgba(0,240,255,.06),rgba(0,0,0,0) 70%)}
        .tbx-zb{position:absolute;left:50%;transform:translateX(-50%);bottom:12px;display:flex;gap:4px;z-index:2}.tbx-carte:has(.tbx-svg) .tbx-zb{left:auto;right:6px;top:6px;bottom:auto;transform:none;flex-direction:column}
        .tbx-zb button{width:28px;height:28px;border:1px solid #00F0FF;background:rgba(0,0,0,.7);color:#00F0FF;font:inherit;cursor:pointer}.tbx-zb button:hover{background:rgba(0,240,255,.22)}
        .tbx-c{cursor:pointer}.tbx-c:hover{filter:drop-shadow(0 0 5px #fff)}.tbx-fiche-s:hover rect:first-child{fill:rgba(0,40,60,.92)}
        .tbx-corona{animation:tbxCor 4s ease-in-out infinite}@keyframes tbxCor{0%,100%{opacity:.75}50%{opacity:1}}
        .tbx-rayons{animation:tbxTourne 60s linear infinite}.tbx-balai{transform-origin:0 0;animation:tbxTourne 14s linear infinite}.tbx-tourne{animation:tbxTourne 18s linear infinite}@keyframes tbxTourne{to{transform:rotate(360deg)}}
        .tbx-pouls{animation:tbxPouls 1.8s ease-in-out infinite}@keyframes tbxPouls{0%,100%{opacity:.25}50%{opacity:.9}}
        @media (prefers-reduced-motion:reduce){.tbx-pouls,.tbx-corona,.tbx-rayons,.tbx-balai,.tbx-tourne{animation:none}}
        .tbx-leg{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:.78em;color:#aab;margin:6px 0 3px}.tbx-leg i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:-1px}.tbx-leg i.an{background:transparent;border:2px solid}
        .tbx-vide{color:#8b97a0;text-align:center;padding:30px 12px;border:1px dashed #333;line-height:1.7;font-size:.9em}.tbx-vide span{color:#667}
        .tbx-l{display:grid;grid-template-columns:14px minmax(0,1fr) auto;gap:8px;align-items:center;padding:6px 0;border-top:1px dashed #2c3338;cursor:pointer}.tbx-l:first-of-type{border-top:0}.tbx-l:hover{background:rgba(0,240,255,.05)}
        .tbx-l .pt{width:11px;height:11px;border-radius:50%}.tbx-l .n{color:#fff;font-size:.86em;line-height:1.35}.tbx-l .n small{display:block;color:#8b97a0;font-size:.82em}.tbx-l .v{text-align:right;color:#FFD700;white-space:nowrap;font-size:.92em}.tbx-l .v small{display:block;color:#8b97a0;font-size:.72em}
        .tbx-st2{cursor:default}.tbx-st2:hover{background:none}.tbx-st2.premier .n{color:#00F0FF}.tbx-reg{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 8px}
        .bd{display:inline-block;border:1px solid;font-size:.64em;letter-spacing:1px;padding:0 4px;margin-left:5px;vertical-align:1px}
        .tbx-parc{margin-top:8px;padding:6px 8px;border:1px dashed #1f4f5a;font-size:.8em;color:#9fb0b8;line-height:1.7}.tbx-parc span{color:#778;letter-spacing:2px;font-size:.78em;margin-right:8px}.tbx-parc b{font-weight:normal;color:#00F0FF;cursor:pointer}
        .tbx-fichel{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:24px;border:1px solid #2c3338;border-left:4px solid #00F0FF;background:rgba(0,240,255,.05);padding:8px 12px;margin-top:8px}.tbx-fh{color:#fff;margin-bottom:4px;grid-column:1/-1}.tbx-fh .x{float:right;cursor:pointer;color:#8b97a0}.tbx-fichel .r{display:grid;grid-template-columns:130px 1fr;gap:8px;font-size:.84em;padding:2px 0}.tbx-fichel .r span{color:#8b97a0;letter-spacing:1px;font-size:.85em}
        .tbx-stl{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 6px}.tbx-st{border:1px solid #2c3338;padding:3px 10px;background:rgba(0,0,0,.35)}.tbx-st small{color:#8b97a0;font-size:.62em;letter-spacing:2px;margin-right:8px}.tbx-st b{color:#fff;font-weight:normal;font-size:.95em}
        .tbx-fil{margin:0 0 10px}.tbx-fil .tb-seg{flex-wrap:wrap}
        .tbx-sg{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:8px}.tbx-sc{border:1px solid #2c3338;border-top:2px solid #FFD700;background:rgba(0,0,0,.4);padding:7px 10px;min-width:0}.tbx-sc.pd{border-top-color:#FF4FD8}.tbx-sc.etoiles{border-top-color:#8b97a0;grid-column:1/-1}.tbx-sc.etoiles .l{display:block;line-height:1.6}
        .tbx-sc .h{display:flex;justify-content:space-between;gap:8px;align-items:baseline;margin-bottom:4px;padding-bottom:4px;border-bottom:1px solid #2c3338}.tbx-sc .h b{font-weight:normal;color:#fff;font-size:.92em;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tbx-sc .h span{color:#FFD700;font-size:.86em;white-space:nowrap}
        .tbx-sc .l{display:grid;grid-template-columns:12px minmax(0,1fr) auto;gap:7px;align-items:center;padding:2px 0;font-size:.82em}.tbx-sc .l .pt{width:9px;height:9px;border-radius:50%}.tbx-sc .l .t{color:#ddd;min-width:0}.tbx-sc .l small{color:#8b97a0;font-size:.85em;margin-left:5px}.tbx-sc .l .v{color:#FFD700}.tbx-sc .l.mut{color:#8b97a0;font-size:.78em}
        .tbx-bal{display:flex;flex-wrap:wrap;gap:6px 18px;align-items:center;font-size:.86em;color:#9fb0b8;margin:0 0 8px;padding:6px 10px;border:1px solid #1f4f5a;background:rgba(0,240,255,.04)}.tbx-bal b{color:#fff;font-size:1.1em}.tbx-bal .bar{flex:1;min-width:120px;height:6px;background:rgba(255,255,255,.08);display:block}.tbx-bal .bar i{display:block;height:100%;background:#00FF66;box-shadow:0 0 6px #00FF66}.tbx-bal em{font-style:normal;color:#8b97a0;font-size:.9em;flex-basis:100%}
        .tbx-sty{position:absolute;left:12px;top:12px;z-index:3;font-size:.72em}.tbx-sty .tb-seg button{background:rgba(2,12,18,.82);padding:3px 9px}.tbx-det .tbx-bal{flex-direction:column;align-items:stretch;gap:6px;margin:0 0 10px}.tbx-det .tbx-bal .bar{flex:none;width:100%}.tbx-md{margin-bottom:14px}
        .tbx-hud .lm{display:none}.tbx-hud.zl .lm,.tbx-hud .lm.v{display:inline}
        .tbx-lg{padding:2px 2px 8px}.tbx-lgh{color:#00F0FF;letter-spacing:3px;font-size:.8em;margin:0 0 8px}.tbx-lgh em{display:block;font-style:normal;color:#6b7780;letter-spacing:0;font-size:.9em;margin-top:3px}
        .tbx-lgt{color:#778;letter-spacing:2px;font-size:.66em;margin:12px 0 4px}.tbx-lgb{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:8px;align-items:center;width:100%;text-align:left;background:rgba(0,0,0,.3);border:1px solid #2c3338;color:#dde;font:inherit;font-size:.86em;padding:5px 8px;margin:0 0 4px;cursor:pointer}
        .tbx-lgb:hover{border-color:#00F0FF;background:rgba(0,240,255,.07)}.tbx-lgb.on{border-color:#fff;background:rgba(255,255,255,.13);box-shadow:0 0 0 1px rgba(255,255,255,.4) inset}.tbx-lgb .t small{display:block;color:#8b97a0;font-size:.82em}.tbx-lgb b{color:#9fb0b8;font-weight:normal}.tbx-lgb.on b{color:#fff}
        .tbx-lgf{margin-top:10px;padding:8px;border:1px solid #fff;background:rgba(255,255,255,.06);font-size:.86em;display:flex;gap:10px;align-items:center;flex-wrap:wrap}.tbx-lgf b{color:#fff;font-size:1.2em}.tbx-lgn{margin-top:12px;color:#8b97a0;font-size:.78em;line-height:1.5}
        .tbx-fbar{display:flex;gap:10px;align-items:center;justify-content:space-between;margin:0 0 8px;padding:5px 8px;border:1px solid #fff;background:rgba(255,255,255,.06);font-size:.8em}
        .tbx-fd{border:1px solid #2c3338;border-top:3px solid var(--c);padding:12px 14px 14px;position:relative}
        .tbx-fd .hd{display:grid;grid-template-columns:minmax(0,1fr) 92px;gap:10px;align-items:center;margin:0 22px 8px 0}.tbx-fd .nm{color:#fff;font-size:1.9em;letter-spacing:2px;line-height:1.1}.tbx-fd .nt{color:var(--c);font-size:.9em;margin-top:2px}.tbx-fd .sy{color:#8b97a0;font-size:.74em;margin-top:3px}
        .tbx-fd .ap{width:92px;height:92px;filter:drop-shadow(0 0 10px rgba(255,255,255,.12))}.tbx-fd .x{position:absolute;right:10px;top:8px;cursor:pointer;color:#8b97a0;font-size:1.1em}.tbx-fd .x:hover{color:#fff}
        .tbx-fd .vcs{display:grid;grid-template-columns:1fr;gap:6px;margin:4px 0 10px}.tbx-fd .vc{border:1px solid #2c3338;background:rgba(0,0,0,.35);padding:7px 10px}.tbx-fd .vc small{display:block;color:#8b97a0;letter-spacing:1.5px;font-size:.62em}.tbx-fd .vc b{display:block;color:#fff;font-size:1.45em;font-weight:normal;letter-spacing:.5px;margin-top:1px}.tbx-fd .vc em{display:block;font-style:normal;color:#8b97a0;font-size:.74em;line-height:1.4}
        .tbx-fd .vc.dss{border-color:var(--c);background:rgba(255,255,255,.05)}.tbx-fd .vc.dss b{color:var(--c);font-size:1.7em}.tbx-fd .vc.no b{color:#8b97a0;font-size:1.1em}
        .tbx-tls{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px}.tbx-tu{border:1px solid #2c3338;background:rgba(0,0,0,.3);padding:5px 9px;min-width:0}.tbx-tu small{display:block;color:#778;letter-spacing:1.5px;font-size:.6em}.tbx-tu b{display:block;color:#e8fbff;font-weight:normal;font-size:.95em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tbx-tu em{display:block;font-style:normal;color:#8b97a0;font-size:.68em;white-space:normal}
        .tbx-sts{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px}.tbx-sts .pl{font-size:.66em;border:1px solid #556;color:#aab;padding:2px 7px;letter-spacing:.5px}
        .tbx-sec{margin:12px 0 6px;padding-top:8px;border-top:1px solid #2c3338;color:#00FF66;letter-spacing:3px;font-size:.72em}.tbx-sec em{font-style:normal;color:#8b97a0;letter-spacing:0;margin-left:8px}.tbx-gh{color:#9fb0b8;font-size:.8em;margin-bottom:5px}.tbx-gh small{display:block;color:#667;font-size:.82em}
        .tbx-gn{display:grid;grid-template-columns:96px minmax(0,1fr) 108px;gap:8px;align-items:center;font-size:.8em;padding:2px 0}.tbx-gn .nm{color:#e8fbff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tbx-gn .br{position:relative;height:8px;background:rgba(255,255,255,.07)}.tbx-gn .br i{position:absolute;top:0;height:100%;background:linear-gradient(90deg,#0a7a3a,#00FF66);box-shadow:0 0 6px #00FF66}.tbx-gn .va{color:#FFD700;text-align:right;white-space:nowrap}
        .tbx-sm{display:grid;grid-template-columns:10px minmax(0,1fr) auto auto;gap:8px;align-items:center;font-size:.8em;padding:3px 0;border-bottom:1px dashed #2c3338}.tbx-sm .pt{width:8px;height:8px;border-radius:50%}.tbx-sm .nm{color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tbx-sm .et{color:#8b97a0;font-size:.9em}.tbx-sm .va{color:#FFD700}
        .tbx-md{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(300px,1fr);gap:14px;align-items:stretch}.tbx-mc{min-width:0}.tbx-det{position:relative;min-height:420px}.tbx-det>.in{position:absolute;inset:0;overflow-y:auto;padding-right:4px}
        .tbx-det .tbx-fichel{grid-template-columns:1fr;margin-top:0;border-left-width:4px}.tbx-det .tbx-fichel .r{grid-template-columns:110px 1fr}.tbx-det .tbx-sb{grid-template-columns:1fr}
        .tbx-fc{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:5px;margin:2px 0 8px}.tbx-fc .ch{font-size:.66em;letter-spacing:1px;padding:2px 7px;font-weight:bold}.tbx-fc .ch.ln{border:1px solid #8b97a0;color:#aab;font-weight:normal;background:rgba(0,0,0,.3)}
        .tbx-tagbtn{grid-column:1/-1;margin:0 0 8px;width:100%}.tbx-tagbtn.on{background:rgba(255,154,31,.18);border-color:#FF9A1F;color:#FFB44D}
        .tbx-resume{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;font-size:.86em;color:#9fb0b8}.tbx-resume b{font-size:1.3em;margin-right:6px}
        .tbx-ico{vertical-align:-3px;margin:0 2px}.tbx-leg .tbx-ico{margin:0 3px 0 0}
        .tbx-rs{display:flex;flex-wrap:wrap;gap:8px 22px;align-items:center;margin:0 0 10px;padding:8px 10px;border:1px solid #1f4f5a;background:rgba(0,240,255,.04);font-size:.86em;color:#9fb0b8}.tbx-rs b{color:#fff}.tbx-rs .pg{display:flex;align-items:center;gap:10px;min-width:240px}.tbx-rs .bar{width:130px;height:7px;background:rgba(255,255,255,.1)}.tbx-rs .bar i{display:block;height:100%;background:#00FF66;box-shadow:0 0 6px #00FF66}.tbx-rs .outils{margin-left:auto;display:flex;gap:6px}
        .tbx-rb2{display:flex;flex-direction:column;gap:6px}.tbx-rg{display:flex;align-items:center;gap:12px;margin:8px 0 2px;padding-bottom:4px;border-bottom:1px solid #2c3338;color:#fff;letter-spacing:1px}.tbx-rg .ici{font-size:.62em;letter-spacing:2px;border:1px solid #00F0FF;color:#00F0FF;padding:1px 7px}.tbx-rg .gs{margin-left:auto;color:#8b97a0;font-size:.8em;letter-spacing:0}
        .tbx-rl2{display:grid;grid-template-columns:44px minmax(0,1fr) 210px 124px 92px;gap:12px;align-items:center;min-height:52px;padding:6px 10px 6px 0;border:1px solid #2c3338;border-left:5px solid var(--c);background:rgba(0,0,0,.3)}
        .tbx-rl2[onclick]{cursor:pointer}.tbx-rl2[onclick]:hover{background:rgba(255,255,255,.05)}.tbx-rl2.next{border-color:#00F0FF;background:rgba(0,240,255,.07);box-shadow:0 0 12px rgba(0,240,255,.18)}.tbx-rl2.fait{opacity:.5;filter:grayscale(.85)}.tbx-rl2.fait .num{color:#00FF66;border-color:#2f6b47}.tbx-rl2.fait .stt{border-color:#2f6b47;color:#6fae88}
        .tbx-rl2 .num{font-size:1.5em;color:var(--c);text-align:center;font-weight:bold}.tbx-rl2 .l1 b{color:#fff;font-size:1.05em;font-weight:normal}.tbx-rl2 .l1 small{color:#8b97a0;margin-left:8px}.tbx-rl2 .nx{margin-left:10px;font-size:.6em;letter-spacing:2px;background:#00F0FF;color:#001015;padding:1px 6px;font-weight:bold}
        .tbx-rl2 .l2{color:#8b97a0;font-size:.78em;margin-top:3px}.tbx-rl2 .l2 .pl{letter-spacing:1px;font-size:.9em}.tbx-rl2 .sg{margin-left:10px}.tbx-rl2 .stt{font-size:.7em;letter-spacing:1px;text-align:center;border:1px solid #556;color:#aab;padding:3px 6px}.tbx-rl2 .stt.s{border-color:#00F0FF;color:#00F0FF}.tbx-rl2 .stt.c{border-color:#00FF66;color:#00FF66}
        .tbx-rl2 .v{color:#FFD700;text-align:right;font-size:1.1em}.tbx-rl2 .v small{display:block;color:#8b97a0;font-size:.6em}.tbx-rl2 .ac{display:flex;gap:4px;justify-content:flex-end}.tbx-rl2 .ac button{background:transparent;border:1px solid #2c3338;color:#8b97a0;font:inherit;width:24px;height:26px;cursor:pointer}.tbx-rl2 .ac button:hover{border-color:#00F0FF;color:#00F0FF}
        .tbx-rb{border-top:1px solid #2c3338}.tbx-rl{display:grid;grid-template-columns:26px 12px minmax(160px,1.6fr) minmax(140px,1.3fr) 64px minmax(130px,1fr) 78px 90px;gap:10px;align-items:center;min-height:36px;padding:3px 4px;border-bottom:1px dashed #2c3338;font-size:.86em}
        .tbx-rl:hover{background:rgba(0,255,102,.05)}.tbx-rl .num{color:#00F0FF;font-weight:bold;text-align:center}.tbx-rl .pt{width:10px;height:10px;border-radius:50%}.tbx-rl .n{color:#fff;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tbx-rl .n small{color:#8b97a0;margin-left:6px}
        .tbx-rl .sy{color:#9fb0b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tbx-rl .st{color:#9fb0b8;font-size:.9em}.tbx-rl.fait .st{color:#00FF66}.tbx-rl.fait .n{opacity:.6}.tbx-rl .v{color:#FFD700;text-align:right;white-space:nowrap}.tbx-rl .v small{color:#8b97a0;font-size:.7em;margin-left:3px}
        .tbx-rl .ac{display:flex;gap:4px;justify-content:flex-end}.tbx-rl .ac button{background:transparent;border:1px solid #2c3338;color:#8b97a0;font:inherit;width:24px;height:24px;cursor:pointer}.tbx-rl .ac button:hover{border-color:#00F0FF;color:#00F0FF}
        .tbx-duo2.fixe{height:600px;align-items:stretch}.tbx-duo2.fixe>.tbx-col{display:flex;flex-direction:column;min-height:0}.tbx-duo2.fixe>.tbx-col>.bloc{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;margin-bottom:0}
        .tbx-duo2.fixe .tbx-jb,.tbx-duo2.fixe .tbx-lst{flex:1;min-height:0;max-height:none;overflow-y:auto}.tbx-lst{padding-right:4px}
        .tbx-strip.c5{grid-template-columns:repeat(5,minmax(0,1fr))}@media (max-width:1100px){.tbx-strip.c5{grid-template-columns:repeat(2,minmax(0,1fr))}}.tbx-jb.tbx-jv{max-height:240px;margin-bottom:10px}.tbx-vr{display:flex;gap:10px;margin:0 0 10px;flex-wrap:wrap}.tbx-vr span{flex:1;min-width:200px;border:1px solid #2c3338;padding:6px 10px}.tbx-vr small{display:block;color:#8b97a0;font-size:.66em;letter-spacing:2px}.tbx-vr b{color:#FFD700;font-size:1.25em;margin-right:8px}.tbx-vr em{font-style:normal;color:#8b97a0;font-size:.78em}
        .tbx-vt{display:grid;grid-template-columns:14px minmax(0,1.3fr) minmax(0,1.7fr) 64px 72px 74px 62px 92px;gap:8px;align-items:center;padding:7px 4px;border-top:1px dashed #2c3338;font-size:.86em}.tbx-vt.tete{color:#8b97a0;font-size:.62em;letter-spacing:1px;border-top:0;align-items:end}.tbx-vt .c{text-align:right}.tbx-vt .c small{color:#8b97a0;margin-left:3px}
        .tbx-vt.tout{background:rgba(0,255,102,.06);border-left:2px solid #00FF66}.tbx-vt .pt{width:10px;height:10px;border-radius:50%}.tbx-vt .n small{display:block;color:#8b97a0;font-size:.8em}.tbx-vt .oui{color:#00FF66;font-size:1.15em}.tbx-vt .sy{color:#9fb0b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tbx-vt .mut{color:#667;font-size:.8em}.tbx-vt .non{color:#445}
        .tbx-det2{margin-top:12px;border-top:1px dashed #2c3338;padding-top:8px}.tbx-det2 summary{cursor:pointer;color:#00F0FF;letter-spacing:2px;font-size:.74em}.tbx-det2[open] summary{margin-bottom:8px}.tbx-jb{max-height:430px;overflow-y:auto;border-top:1px solid #2c3338;padding-right:4px}.tbx-jl{display:grid;grid-template-columns:70px 12px minmax(110px,1.1fr) minmax(0,2fr) 70px;gap:10px;align-items:center;min-height:30px;padding:3px 4px;border-bottom:1px dashed #2c3338;font-size:.84em}
        .tbx-jl:hover{background:rgba(255,215,0,.05)}.tbx-jl .h{color:#778;font-size:.88em}.tbx-jl .pt{width:9px;height:9px;border-radius:50%}.tbx-jl .sy{color:#9fb0b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tbx-jl .co{color:#fff;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tbx-jl .co small{color:#8b97a0;margin-left:6px}.tbx-jl .v{color:#FFD700;text-align:right;white-space:nowrap}.tbx-jl .v small{color:#8b97a0;font-size:.7em;margin-left:3px}
        .tbx-reco{border:1px solid #1f4f5a;border-left:3px solid #00F0FF;background:rgba(0,240,255,.06);padding:8px 12px;margin:0 0 8px;font-size:.9em;color:#cfe}.tbx-reco b{color:#fff}.tbx-reco small{display:block;color:#8b97a0;margin-top:3px;font-size:.82em}
        .tbx-sites{grid-column:1/-1;margin-top:8px;border-top:1px dashed #2c3338;padding-top:8px}.tbx-sh{color:#00F0FF;letter-spacing:2px;font-size:.78em;margin-bottom:6px}.tbx-sh em{color:#6b7780;font-style:normal;letter-spacing:.3px;margin-left:8px}
        .tbx-sb{display:grid;grid-template-columns:minmax(260px,380px) 1fr;gap:16px;align-items:start}.tbx-sv{width:100%;height:auto;display:block}.tbx-st .r{display:grid;grid-template-columns:130px 1fr;gap:8px;font-size:.84em;padding:2px 0}.tbx-st .r span{letter-spacing:.5px}
        @media (max-width:900px){.tbx-sb{grid-template-columns:1fr}}
        .tbx-spg{display:grid;grid-template-columns:repeat(auto-fill,minmax(236px,1fr));gap:12px;align-items:stretch}.tbx-eg{display:flex;align-items:center;gap:10px;margin:14px 0 8px;color:#9fb0b8;font-size:.72em;letter-spacing:3px}.tbx-eg:first-child{margin-top:2px}.tbx-eg i{flex:1;height:1px;background:linear-gradient(90deg,#2c3338,transparent)}.tbx-eg .tot{color:#FFD700;letter-spacing:1px;font-size:1.15em}
        .tbx-bts{display:flex;gap:8px;flex-wrap:wrap}.tbx-md-dec .tbx-jb{max-height:none;overflow:visible}.tbx-md-dec .bloc>h2{display:none}.tbx-md-dec .bloc{border:0;background:none;padding:0;margin:0}
        .tbx-sp2{display:flex;flex-direction:column;content-visibility:auto;contain-intrinsic-size:auto 400px;position:relative;border:1px solid #20323a;border-top:2px solid var(--c);background:linear-gradient(180deg,rgba(2,14,20,.9),rgba(0,0,0,.6));padding:9px 10px 10px;min-width:0;box-shadow:0 0 18px color-mix(in srgb,var(--v) 14%,transparent)}
        .tbx-sp2.fait{border-color:#1c4a30}.tbx-sp2 .nv{position:absolute;right:8px;top:8px;border:1px solid #FF4FD8;color:#FF4FD8;font-size:.55em;letter-spacing:1px;padding:1px 5px;background:rgba(0,0,0,.7);z-index:2}
        .tbx-sp2 .hd small{display:block;color:var(--v);font-size:.62em;letter-spacing:3px;opacity:.85}.tbx-sp2 .hd{min-height:4.6em}.tbx-sp2 .hd b{display:block;color:#fff;font-size:.95em;letter-spacing:.5px;line-height:1.25;padding-right:84px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}.tbx-sp2 .hd em{display:block;font-style:normal;color:#9fb0b8;font-size:.72em;margin:1px 0 7px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .tbx-sp2 .sc{display:block;width:100%;height:auto;border:1px solid color-mix(in srgb,var(--v) 40%,#0a1418);overflow:hidden}.tbx-sp2 .spec{animation:tbxFlotte 5s ease-in-out infinite;filter:drop-shadow(0 0 7px var(--c)) drop-shadow(0 0 16px color-mix(in srgb,var(--c) 55%,transparent))}
        .tbx-sp2 .spec *{vector-effect:non-scaling-stroke}.tbx-sp2 .tr{animation:tbxDash 2.4s linear infinite}@keyframes tbxDash{to{stroke-dashoffset:-36}}.tbx-sp2 .bal{animation:tbxBalaye 4.5s linear infinite}.tbx-sp2 .pa{animation:tbxPart 3.2s ease-in-out infinite}
        @keyframes tbxFlotte{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}@keyframes tbxBalaye{0%{transform:translateY(8px);opacity:0}15%{opacity:1}85%{opacity:1}100%{transform:translateY(128px);opacity:0}}@keyframes tbxPart{0%,100%{opacity:.1;transform:translateY(0)}50%{opacity:.9;transform:translateY(-6px)}}
        .tbx-sp2 .fls{display:flex;justify-content:space-around;gap:6px;margin:8px 0 2px}.tbx-sp2 .fl{text-align:center;flex:1}.tbx-sp2 .fl svg{width:24px;height:50px;display:block;margin:0 auto}.tbx-sp2 .fl.p svg{filter:drop-shadow(0 0 5px var(--v))}.tbx-sp2 .fl span{display:block;font-size:.5em;letter-spacing:1.5px;color:#556a74;margin-top:1px}.tbx-sp2 .fl.p span{color:var(--v)}
        .tbx-sp2 .bas{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;gap:8px;border-top:1px dashed #243842;padding-top:6px;margin-top:6px}.tbx-sp2 .val{color:#FFD700;font-size:1.25em;letter-spacing:.5px}.tbx-sp2 .val small{color:#8b97a0;font-size:.55em}.tbx-sp2 .pie{font-size:.66em;color:#8b97a0;line-height:1.45;text-align:right}
        .tbx-sp2.fait .spec,.tbx-sp2.fait .tr,.tbx-sp2.fait .bal,.tbx-sp2.fait .pa{animation:none}.tbx-sp2.fait:hover .spec{animation:tbxFlotte 5s ease-in-out infinite}.tbx-sp2.fait .bal{opacity:0}
        @media (prefers-reduced-motion:reduce){.tbx-sp2 .spec,.tbx-sp2 .tr,.tbx-sp2 .bal,.tbx-sp2 .pa,.tbx-sp2.fait:hover .spec{animation:none}}.tbx-sp{border:1px solid #2c3338;border-top:2px solid var(--c);background:rgba(0,0,0,.45);padding:8px 10px;position:relative;min-width:0}.tbx-sp.cours{box-shadow:0 0 14px rgba(255,215,0,.14)}
        .tbx-sp .gl{width:46px;float:left;margin:0 8px 2px 0}.tbx-sp .nom{color:#fff;font-size:.88em;line-height:1.25}.tbx-sp .va{color:#9fb0b8;font-size:.74em;margin:1px 0 4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tbx-sp .val{clear:both;color:#FFD700;font-size:1.15em;letter-spacing:.5px;padding-top:2px}.tbx-sp .val small{color:#8b97a0;font-size:.62em}
        .tbx-sp .pips{display:flex;gap:5px;margin:5px 0 4px}.tbx-sp .pips i{flex:1;max-width:34px;height:8px;border:1px solid #1f4f5a;display:block}.tbx-sp .pips i.f{background:var(--c);border-color:var(--c);box-shadow:0 0 7px var(--c)}.tbx-sp .pie{font-size:.68em;color:#8b97a0;line-height:1.4}
        .tbx-sp .nv~.nom{padding-right:56px}.tbx-sp .nv{position:absolute;right:6px;top:6px;border:1px solid #FF4FD8;color:#FF4FD8;font-size:.56em;letter-spacing:1px;padding:0 4px;background:rgba(0,0,0,.6)}
        @media (max-width:1100px){.tbx-rl2{grid-template-columns:36px minmax(0,1fr) 92px}.tbx-rl2 .stt,.tbx-rl2 .ac{display:none}.tbx-md{grid-template-columns:minmax(0,1fr)}.tbx-det{min-height:0}.tbx-det>.in{position:static}.tbx-rl{grid-template-columns:24px 12px minmax(0,1fr) 78px 70px}.tbx-rl .sy,.tbx-rl .st,.tbx-rl .sg{display:none}.tbx-duo2.fixe{height:auto}.tbx-duo2.fixe .tbx-jb,.tbx-duo2.fixe .tbx-lst{max-height:420px}.tbx-rayons,.tbx-balai,.tbx-tourne{animation:none}.tbx-duo,.tbx-duo2{grid-template-columns:minmax(0,1fr)}.tbx-strip{grid-template-columns:repeat(2,minmax(0,1fr))}}
    </style>`;
    function entete(d) {
        return `<div class="tbx-bar"><div class="tt">EXPLORATION<em>${(S && S.systeme) || (d && d.sys && d.sys.nom) ? "système " + esc((S && S.systeme) || d.sys.nom) : "aucun système relevé"}</em></div>
            <span class="tbx-bts"><button type="button" class="tb-btn" onclick="explorationDecouvertes()">◷ CE QUE J'AI DÉCOUVERT</button><button type="button" class="tb-btn" onclick="explorationOuVendre()">▤ OÙ VENDRE</button></span></div>`;
    }
    window.explorationHtml = function () {
        if (!document.getElementById("tbx-css")) document.head.insertAdjacentHTML("beforeend", CSS);
        const d = D(), sys = d && d.sys;
        const sans = !d ? `<div class="bloc-note" style="margin-bottom:12px;">Aucune exploration lue pour l'instant. Si vous explorez déjà, mettez à jour le plugin SYS.EDTEAM (version 2.30 ou plus récente) et relancez EDMC : les corps scannés, les échantillons et la valeur de vos données apparaissent ici tout seuls.</div>` : "";
        return entete(d) + sans + pageExploration(d) + vuePied();
    };
    window.explorationApres = function () { liens(); };

    // ---- la page : rangs et donnees non vendues en haut, la carte du systeme, ce que j'ai decouvert (avec « ou vendre »), le trajet en bas
    function balayage(sys, nScan) {
        const n = sys.nb || (sys.b || []).length, pc = n ? Math.min(100, Math.round(nScan / n * 100)) : 0;
        return `<div class="tbx-bal"><span><b>${fmtN(n)}</b> corps dans le système</span><span><b style="color:#00FF66">${fmtN(nScan)}</b> scanné${nScan > 1 ? "s" : ""} par vous</span><i class="bar"><i style="width:${pc}%"></i></i>${Number(sys.prog) >= 1 ? `<em style="color:#FFD700">Système déjà découvert à 100 % par d'autres pilotes : pas de première découverte possible, et les corps ne se scannent quasiment plus. Seule la cartographie au scanner de surface (DSS) rapporte encore, moins si un autre pilote l'a déjà faite.</em>` : ""}${sys.edsm ? `<em>carte d'après EDSM : les corps en grisé ne sont pas encore scannés par vous</em>` : ""}</div>`;
    }
    function heureJournal(ts) {
        const t = new Date(ts); if (!ts || isNaN(t)) return "—";
        const hh = String(t.getHours()).padStart(2, "0") + ":" + String(t.getMinutes()).padStart(2, "0"), auj = new Date();
        return t.toDateString() === auj.toDateString() ? hh : String(t.getDate()).padStart(2, "0") + "/" + String(t.getMonth() + 1).padStart(2, "0") + " " + hh;
    }
    function ligneJournal(x) {
        const col = x.c ? "#00FF66" : x.pot >= OR ? "#FFD700" : x.pot >= CY ? "#00F0FF" : "#8b97a0";
        const badges = (x.pd ? `<span class="bd" style="color:#FF4FD8;border-color:#FF4FD8">1ʳᵉ DÉCOUV.</span>` : "") + (x.c ? `<span class="bd" style="color:#00FF66;border-color:#00FF66">CARTO</span>` : "") + (x.bio ? `<span class="bd" style="color:#00FF66;border-color:#00FF66">BIO ×${x.bio}</span>` : "");
        return `<div class="tbx-jl"><span class="h">${heureJournal(x.ts)}</span><span class="pt" style="background:${col}"></span><span class="sy">${cp(x.s)}</span><span class="co">${esc(x.n)} <small>${esc(natureLongue(x.t, x.e, x.tf))}</small>${badges}</span><span class="v">${km(x.v)}<small>cr</small></span></div>`;
    }
    function legende(sys) {
        const pl = (sys.b || []).filter(b => !b.e), nom = sys.nom, act = filtresActifs();
        const pt = (col, ring) => ico(ring ? `<circle r="4.2" fill="none" stroke="${col}" stroke-width="1.5" stroke-dasharray="2.4 2"/>` : `<circle r="4.6" fill="${col}"/>`);
        const G = [["PRIORITÉ DE SCAN", [["tres", pt("#FFD700"), "Très intéressant", "carte DSS ou exobio ≥ 400 k"], ["int", pt("#00F0FF"), "Intéressant", "carte DSS ou exobio ≥ 60 k"], ["faible", pt("#8b97a0"), "Faible valeur", ""], ["carto", pt("#00FF66"), "Cartographié", "vous l'avez fait"]]],
            ["SCAN", [["scan", ico(SIGNE.scan(true, 0, 0)), "Scanné par vous", ""], ["pasScan", ico(SIGNE.scan(false, 0, 0)), "Pas encore scanné", ""], ["pd", pt("#FF4FD8", true), "Première découverte", "personne ne l'a découvert"]]],
            ["SURFACE ET VIE", [["pose", ico(SIGNE.pose(0, 0)), "Atterrissable", ""], ["bio", ico(SIGNE.bio(true, 0, 0)), "Exobiologie détectée", "signaux relevés au FSS"], ["bioP", ico(SIGNE.bio(false, 0, 0)), "Exobiologie possible", "atmosphère + atterrissable, à confirmer"]]],
            ["MA FEUILLE DE ROUTE", [["tag", ico(SIGNE.tag(0, 0)), "Dans ma feuille de route", ""]]]];
        const nb = k => pl.filter(b => TESTS[k](b, nom)).length;
        const bloc = G.map(([t, l]) => `<div class="tbx-lgt">${t}</div>${l.map(([k, ic, lib, sous]) => `<button type="button" class="tbx-lgb${act.indexOf(k) >= 0 ? " on" : ""}" onclick="explorationFiltre('${k}')">${ic}<span class="t">${lib}${sous ? `<small>${sous}</small>` : ""}</span><b>${nb(k)}</b></button>`).join("")}`).join("");
        const corr = act.length ? pl.filter(b => correspond(b, nom)).length : 0;
        return `<div class="tbx-lg"><div class="tbx-lgh">LÉGENDE <em>cliquez une étiquette pour mettre en valeur les corps concernés</em></div>${bloc}
            ${act.length ? `<div class="tbx-lgf"><b>${corr}</b> corps correspondent à ${act.length > 1 ? "toutes ces conditions" : "cette condition"} <button type="button" class="tb-btn" onclick="explorationFiltre('raz')">TOUT AFFICHER</button></div>` : `<div class="tbx-lgn">Cliquez ensuite un corps sur la carte pour ses détails et pour l'ajouter à votre feuille de route. Les orbites sont schématiques : leur ordre est celui des distances, l'éclairage vient de l'étoile.</div>`}</div>`;
    }
    function detail(sys) {
        const f = fiche(sys), act = filtresActifs();
        if (!f) return legende(sys);
        return (act.length ? `<div class="tbx-fbar">Filtre actif : ${act.length} condition${act.length > 1 ? "s" : ""} <button type="button" class="tb-btn" onclick="explorationFiltre('raz')">RETIRER</button></div>` : "") + f;
    }
    function zoneCarte(sys, nScan) { return `<div class="tbx-md"><div class="tbx-mc">${carteSysteme(sys)}</div><div class="tbx-det"><div class="in">${balayage(sys, nScan)}${detail(sys)}</div></div></div>`; }
    function feuilleDeRoute(sys) {
        const r = routeLire(), cur = sys ? String(sys.nom || "").toLowerCase() : "";
        let change = false;
        r.forEach(x => {                      // les corps du systeme affiche prennent leur etat du moment (scanne, cartographie, valeur)
            if (String(x.s).toLowerCase() !== cur) return; const b = ((sys && sys.b) || []).find(y => y.i === x.i); if (!b) return;
            const m = snapRoute(b, sys); ["st", "pot", "bio", "l", "n", "d", "cm", "x"].forEach(k => { if (m[k] !== x[k]) { x[k] = m[k]; change = true; } });
        });
        if (change) routeEcrire(r);
        const nF = r.filter(x => x.st !== "a").length, reste = r.filter(x => x.st === "a").reduce((t, x) => t + interet(x).val, 0), prochaine = r.findIndex(x => x.st === "a"), pc = r.length ? Math.round(nF / r.length * 100) : 0;
        const icones = x => (x.st === "a" ? ico(SIGNE.scan(false, 0, 0)) : ico(SIGNE.scan(true, 0, 0))) + (x.l ? ico(SIGNE.pose(0, 0)) : "") + (x.bio ? ico(SIGNE.bio(true, 0, 0)) : "");
        const STATUT = { a: ["À SCANNER", "a"], s: ["SCANNÉ ✓", "s"], c: ["CARTOGRAPHIÉ ✓", "c"] };
        let corps = "", dernier = null;
        r.forEach((x, i) => {
            const ici = String(x.s).toLowerCase() === cur;
            if (x.s !== dernier) {
                dernier = x.s; const groupe = []; for (let k = i; k < r.length && r[k].s === x.s; k++) groupe.push(r[k]);
                corps += `<div class="tbx-rg"><b>${cp(x.s)}</b>${ici ? `<span class="ici">VOUS ÊTES ICI</span>` : ""}<span class="gs">${groupe.length} cible${groupe.length > 1 ? "s" : ""} · ≈ ${fmtM(groupe.filter(y => y.st === "a").reduce((t, y) => t + interet(y).val, 0))} à gagner</span></div>`;
            }
            const pa = palier(x), st = STATUT[x.st] || STATUT.a;
            corps += `<div class="tbx-rl2 ${x.st !== "a" ? "fait" : ""}${i === prochaine ? " next" : ""}" style="--c:${pa.col}"${ici ? ` onclick="explorationCorps(${x.i})" title="Voir sur la carte"` : ""}><span class="num">${x.st !== "a" ? "✔" : i + 1}</span>
                <div class="mid"><div class="l1"><b>${esc(x.n)}</b><small>${esc(natureLongue(x.c, 0, x.tf))}</small>${i === prochaine ? `<span class="nx">PROCHAINE CIBLE</span>` : ""}</div>
                <div class="l2"><span class="pl" style="color:${pa.col}">${pa.lib}</span>${x.d ? " · " + fmtN(x.d) + " Ls" : ""}<span class="sg">${icones(x)}</span></div></div>
                <span class="stt ${st[1]}">${st[0]}</span><span class="v" title="Valeur la plus haute entre la carte DSS et le potentiel exobiologique (maximum)">${km(interet(x).val)}<small>cr · ${interet(x).src}</small></span>
                <span class="ac" onclick="event.stopPropagation()"><button type="button" title="Monter" onclick="explorationRoute('haut','${x.k}')">↑</button><button type="button" title="Descendre" onclick="explorationRoute('bas','${x.k}')">↓</button><button type="button" title="Retirer de la feuille de route" onclick="explorationRoute('retirer','${x.k}')">✕</button></span></div>`;
        });
        const resume = r.length ? `<div class="tbx-rs"><div class="pg"><div class="bar"><i style="width:${pc}%"></i></div><span><b>${nF}</b> / ${r.length} scanné${nF > 1 ? "s" : ""} ou cartographié${nF > 1 ? "s" : ""}</span></div><span>Gain potentiel <b>≈ ${fmtM(reste)}</b> <small>(carte DSS ou exobio)</small></span>${prochaine >= 0 ? `<span>Prochaine cible <b>${esc(r[prochaine].n)}</b> · ${cp(r[prochaine].s)}</span>` : `<span style="color:#00FF66">Feuille de route terminée</span>`}<span class="outils"><button type="button" class="tb-btn" onclick="explorationRoute('trier')">TRIER PAR DISTANCE</button><button type="button" class="tb-btn" onclick="explorationRoute('vider')">TOUT RETIRER</button></span></div>` : "";
        const vide = `<div class="tbx-vide">Votre feuille de route est vide.<br><span>Cliquez un corps sur la carte puis « ajouter à ma feuille de route » : vos cibles apparaissent ici, dans l'ordre à suivre, avec leur état et leur valeur.</span></div>`;
        return `<div class="bloc vert" style="margin-bottom:16px"><h2>MA FEUILLE DE ROUTE <em>${r.length ? r.length + " cible" + (r.length > 1 ? "s" : "") + " · dans l'ordre à suivre" : "les corps qui vous intéressent"}</em></h2>${resume}${r.length ? `<div class="tbx-rb2">${corps}</div>` : vide}</div>`;
    }
    function ligneBio(c) {
        const fait = c.k >= 3, col = fait ? "#00FF66" : "#FFD700", val = valeurEsp(c.sc);
        return `<div class="tbx-jl"><span class="h">${heureJournal(c.t)}</span><span class="pt" style="background:${col}"></span><span class="sy">${cp(c.sy || "")}</span><span class="co">🧬 ${esc(c.s)} <small>${fait ? "analysé · à vendre" : "prélèvement " + c.k + " / 3"}${c.bn ? " · " + esc(c.bn) : ""}</small>${c.nv ? `<span class="bd" style="color:#FF4FD8;border-color:#FF4FD8">NOUVEAU</span>` : ""}</span><span class="v">${val ? km(val) : "?"}<small>cr</small></span></div>`;
    }
    function blocDecouvertes(d) {
        const nv = (d && d.nv) || {}, tot = (d && d.tot) || {}, corps = (d && d.dec) || [], ech = (d && d.bio && d.bio.ech) || [], xb = sommeBio(d);
        const st = (c, n) => `<span class="tbx-st"><small>${c}</small><b>${n}</b></span>`;
        const stats = d ? `<div class="tbx-stl">${st("SAUTS", fmtN(tot.sauts || 0))}${st("DISTANCE", fmtN(tot.dist || 0) + " al")}${st("SYSTÈMES", fmtN(nv.sys || 0))}${st("CORPS", fmtN(nv.n || 0))}${st("CARTOGRAPHIÉS", fmtN(nv.cartos || 0))}${st("1ʳᵉˢ DÉCOUVERTES", nv.pd ? "+ " + fmtM(nv.pd) : "aucune")}${st("ÉCHANTILLONS", fmtN(xb.n))}${st("VALEUR", nv.n || xb.nA ? "≥ " + fmtM((nv.v || 0) + xb.analyse) : "—")}</div>` : "";
        // corps sans date (scannés avant le plugin 2.30, état repris du fichier du plugin) : le plugin les envoie du plus récent au plus ancien, ils viennent sous les scans datés
                const lignes = corps.map((x, i) => ({ t: Date.parse(x.ts) || 0, o: i, h: ligneJournal(x) })).concat(ech.map((c, i) => ({ t: Date.parse(c.t) || 0, o: i, h: ligneBio(c) })));
        lignes.sort((a, b) => b.t - a.t || a.o - b.o);
        const liste = lignes.length ? `<div class="tbx-jb">${lignes.map(l => l.h).join("")}</div>${(nv.n || 0) > corps.length ? `<div class="tb-sub">Les ${corps.length} corps les plus récents sont listés, sur ${fmtN(nv.n)} non vendus.</div>` : ""}`
            : `<div class="tbx-vide">Rien depuis votre dernière vente : corps scannés et échantillons apparaissent ici au fil de vos scans.</div>`;
        return `<div class="bloc or"><h2>CE QUE J'AI DÉCOUVERT <em>depuis votre dernière vente${tot.debut ? " · " + ago(tot.debut) : ""}</em></h2>${stats}${liste}</div>`;
    }
    // ECHANTILLONS, pleine largeur : d'abord ce qui est en cours, puis ce qui est analyse (a vendre) ; filtre quand il y en a beaucoup
    window.explorationFiltreEch = f => { if (typeof sonClic === "function") sonClic(); EX.fEch = f; rendre(); };
    function blocCartouches(d) {
        const b = sommeBio(d), tous = echTries(((d && d.bio && d.bio.ech) || []).slice()), enCours = tous.filter(c => c.k < 3), faits = tous.filter(c => c.k >= 3), f = EX.fEch || "tous";
        const seg = tous.length > 6 ? `<span class="tbm-btns"><span class="tb-seg">${[["tous", "TOUS · " + tous.length], ["cours", "EN COURS · " + enCours.length], ["fait", "ANALYSÉS · " + faits.length]].map(x => `<button type="button" class="${f === x[0] ? "on" : ""}" onclick="explorationFiltreEch('${x[0]}')">${x[1]}</button>`).join("")}</span></span>`
            : ``;
        const groupe = (titre, liste, extra) => liste.length ? `<div class="tbx-eg"><span>${titre} · ${liste.length}</span><i></i>${extra || ""}</div><div class="tbx-spg">${liste.map(carteEch).join("")}</div>` : "";
        let corps;
        if (!tous.length) corps = `<div class="tbx-vide">Aucun prélèvement d'exobiologie pour l'instant.<br><span>Posez-vous sur une planète à signaux biologiques et prélevez : l'avancement des trois prélèvements et la valeur apparaissent ici.</span></div>`;
        else corps = (f !== "fait" ? groupe("EN COURS · à finir (3 prélèvements)", enCours) : "") + (f !== "cours" ? groupe("ANALYSÉS · à vendre", faits, b.analyse ? `<b class="tot">≈ ${fmtM(b.analyse)}</b>` : "") : "");
        return `<div class="bloc or" style="margin:14px 0 12px"><h2>ÉCHANTILLONS <em>trois prélèvements pour analyser une espèce${b.n ? " · " + b.nA + " analysé" + (b.nA > 1 ? "s" : "") + ", " + b.nC + " en cours" : ""}</em>${seg}</h2>${corps}</div>`;
    }
    function pageExploration(d) {
        const sys = sysFusion(d), bs = (sys && sys.b) || [], nScan = bs.filter(b => !b.x).length;
        EX.sysCourant = sys;
        const sous = sys ? `${esc(sys.nom || "")} · ${sys.nb || bs.length} corps · ${nScan} scanné${nScan > 1 ? "s" : ""} par vous · molette = zoom` : "";
        const contenu = sys && bs.length ? zoneCarte(sys, nScan) : sys ? `<div class="tbx-vide"><b style="color:#00F0FF">${esc(sys.nom || "Système")}</b> : ${sys.nb ? fmtN(sys.nb) + " corps détectés par le balayage du système, " : ""}aucun n'est encore scanné.<br><span>${EX.edsm && EX.edsm.st === "EN_COURS" ? "Lecture des corps connus du système…" : EX.edsm && EX.edsm.st === "ERREUR" ? "Les corps connus du système n'ont pas pu être lus pour le moment. Ils apparaîtront un à un au fil de vos scans." : "Ce système n'est pas encore connu d'EDSM : ouvrez le FSS (scanner spectral) et scannez les signaux, chaque corps apparaît ici au moment où il est scanné, avec sa valeur."}</span></div>` : `<div class="tbx-vide">Aucun système relevé pour l'instant.</div>`;
        return bandeau(d) + `<div class="bloc cy" style="margin-bottom:16px"><h2>CARTE DU SYSTÈME <em>${sous}</em></h2>${contenu}</div>`
            + feuilleDeRoute(sys) + blocCartouches(d);
    }

    // ---------------------------------------------------------------------------------------------
    //  TRAITS entre les corps et leurs fiches : recalcules apres chaque affichage et chaque zoom / deplacement
    // ---------------------------------------------------------------------------------------------
    function liens() {
        const svg = document.querySelector("svg.tbx-hud"); if (!svg) return;
        const z = EX.z.sys;
        svg.querySelectorAll(".tbx-lien").forEach(g => {
            const wx = +g.dataset.wx, wy = +g.dataset.wy, ex = +g.dataset.ex, ey = +g.dataset.ey, c = +g.dataset.c, [px, py] = proj(z, wx, wy);
            const dedans = Math.abs(px - MX) <= FRX - 4 && Math.abs(py - MY) <= FRY - 4;
            g.style.display = dedans ? "" : "none";
            if (!dedans) return;
            g.firstElementChild.setAttribute("d", `M${ex} ${ey}H${ex + c * 18}L${px.toFixed(1)} ${py.toFixed(1)}`);
            g.querySelectorAll("circle").forEach(k => { k.setAttribute("cx", px.toFixed(1)); k.setAttribute("cy", py.toFixed(1)); });
        });
    }
    function appliquerZoomSysteme(svg) {
        const z = EX.z.sys, m = svg.querySelector("#tbx-monde");
        if (m) m.setAttribute("transform", `translate(${(MX - z.cx * z.k).toFixed(1)} ${(MY - z.cy * z.k).toFixed(1)}) scale(${z.k.toFixed(3)})`);
        svg.classList.toggle("zl", z.k >= 2.2);                   // etiquettes des lunes : visibles a partir d'un certain zoom
        liens();
    }

    // ---------------------------------------------------------------------------------------------
    //  ZOOM / DEPLACEMENT : carte du systeme (transformation du monde) et carte du trajet (viewBox) ; molette, boutons, glisser
    // ---------------------------------------------------------------------------------------------
    if (!window.__tbxZoomInit) {
        window.__tbxZoomInit = true;
        const maj = svg => { const id = svg.dataset.tbxid, W = +svg.dataset.w, H = +svg.dataset.h; if (id) svg.setAttribute("viewBox", viewBox(id, W, H)); };
        const zoomer = (svg, f, px, py) => {
            const id = svg.dataset.tbxid, W = +svg.dataset.w, H = +svg.dataset.h, z = EX.z[id] || (EX.z[id] = { k: 1, cx: W / 2, cy: H / 2 });
            if (px == null) { px = z.cx; py = z.cy; }
            const ancien = z.k; z.k = Math.max(1, Math.min(8, z.k * f)); const r = ancien / z.k;
            z.cx = px + (z.cx - px) * r; z.cy = py + (z.cy - py) * r;
            if (z.k === 1) { z.cx = W / 2; z.cy = H / 2; }
            maj(svg);
        };
        const pt = (svg, e) => { const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, s = Math.min(r.width / vb.width, r.height / vb.height), ox = (r.width - vb.width * s) / 2, oy = (r.height - vb.height * s) / 2; return [vb.x + (e.clientX - r.left - ox) / s, vb.y + (e.clientY - r.top - oy) / s, s]; };
        const zoomerSysteme = (svg, f, p) => {       // p = point (coordonnees du cadre) autour duquel on zoome ; par defaut le centre
            const z = EX.z.sys, qx = p ? p[0] : MX, qy = p ? p[1] : MY, wx = (qx - MX) / z.k + z.cx, wy = (qy - MY) / z.k + z.cy;
            z.k = Math.max(1, Math.min(8, z.k * f));
            z.cx = wx - (qx - MX) / z.k; z.cy = wy - (qy - MY) / z.k;
            if (z.k === 1) { z.cx = 0; z.cy = 0; }
            const lim = 235 * (1 - 1 / z.k) + 40; z.cx = Math.max(-lim, Math.min(lim, z.cx)); z.cy = Math.max(-lim, Math.min(lim, z.cy));
            appliquerZoomSysteme(svg);
        };
        const dansCarte = (svg, p) => Math.abs(p[0] - MX) <= FRX && Math.abs(p[1] - MY) <= FRY;
        document.addEventListener("wheel", e => {
            const hud = e.target.closest && e.target.closest("svg.tbx-hud");
            if (hud) { const p = pt(hud, e); if (dansCarte(hud, p)) { e.preventDefault(); zoomerSysteme(hud, e.deltaY < 0 ? 1.2 : 1 / 1.2, p); } return; }
            const svg = e.target.closest && e.target.closest("svg.tbx-svg"); if (!svg) return; e.preventDefault(); const p = pt(svg, e); zoomer(svg, e.deltaY < 0 ? 1.2 : 1 / 1.2, p[0], p[1]);
        }, { passive: false });
        document.addEventListener("click", e => {
            const b = e.target.closest && e.target.closest("[data-tbxz]"); if (!b) return;
            const [id, a] = b.dataset.tbxz.split(":");
            if (id === "sys") { const hud = document.querySelector("svg.tbx-hud"); if (!hud) return; if (a === "reset") { EX.z.sys = { k: 1, cx: 0, cy: 0 }; appliquerZoomSysteme(hud); } else zoomerSysteme(hud, a === "in" ? 1.4 : 1 / 1.4); return; }
            const svg = document.querySelector('svg.tbx-svg[data-tbxid="' + id + '"]'); if (!svg) return;
            if (a === "reset") { const W = +svg.dataset.w, H = +svg.dataset.h; EX.z[id] = { k: 1, cx: W / 2, cy: H / 2 }; maj(svg); } else zoomer(svg, a === "in" ? 1.4 : 1 / 1.4);
        });
        let drag = null;
        document.addEventListener("pointerdown", e => {
            if (e.button !== 0) return;
            const hud = e.target.closest && e.target.closest("svg.tbx-hud");
            if (hud) { const p = pt(hud, e), z = EX.z.sys; if (z.k <= 1 || !dansCarte(hud, p) || e.target.closest(".tbx-fiche-s")) return; drag = { hud, x: e.clientX, y: e.clientY, cx: z.cx, cy: z.cy, s: pt(hud, e)[2] }; return; }
            const svg = e.target.closest && e.target.closest("svg.tbx-svg"); if (!svg) return; const z = EX.z[svg.dataset.tbxid]; if (!z || z.k <= 1) return; drag = { svg, x: e.clientX, y: e.clientY, cx: z.cx, cy: z.cy };
        });
        document.addEventListener("pointermove", e => {
            if (!drag) return;
            if (drag.hud) { const z = EX.z.sys, k = z.k; if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 4) EX.moved = true; const lim = 235 * (1 - 1 / k) + 40; z.cx = Math.max(-lim, Math.min(lim, drag.cx - (e.clientX - drag.x) / (drag.s * k))); z.cy = Math.max(-lim, Math.min(lim, drag.cy - (e.clientY - drag.y) / (drag.s * k))); appliquerZoomSysteme(drag.hud); return; }
            const z = EX.z[drag.svg.dataset.tbxid], s = pt(drag.svg, e)[2]; z.cx = drag.cx - (e.clientX - drag.x) / s; z.cy = drag.cy - (e.clientY - drag.y) / s; maj(drag.svg);
        });
        const fin = () => { if (drag && EX.moved) setTimeout(() => { EX.moved = false; }, 60); drag = null; };
        document.addEventListener("pointerup", fin); document.addEventListener("pointercancel", fin);
    }
})();
