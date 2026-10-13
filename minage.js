// ONGLET MINAGE du tableau de bord (tableau-de-bord.html) : minage au sol avec le Rhino et minage en vaisseau, en TROIS ETAPES.
//   1. OU SE POSER (Rhino) / OU TROUVER UN ANNEAU (vaisseau) : corps du systeme (EDSM, fonction minage_corps) + emplacements d'extraction scannes (plugin).
//   2. QUOI MINER ? : le pilote coche les materiaux affiches dans le jeu apres le scan ; tableau « dans ce systeme » (fonction minage_prix) / « ailleurs » (fonction vente_soute de Commerce) / valeur d'une soute pleine.
//   3. MINER ET TRANSFERER : chiffres de session, hologrammes du Rhino et du vaisseau, fleche de transit, bilan par minerai (S.minage, plugin >= 2.20).
// Les etapes 1 et 2 se replient (automatiquement des qu'on mine ; le choix du pilote est memorise). Rien a saisir hormis la liste des materiaux.
// Noms de la page utilises : S, esc, fmtN, fmtM, cp, duree, lire, ecrire, rendre, supabaseApp, sonClic, modulesHtml, souteHtml, COUL_MARCH.
(function () {
    "use strict";
    const SEUIL = 60;                                   // la fleche passe a l'etat « a transferer » (plus vive) a partir de ce nombre de minerais dans le Rhino
    const CAP_DEF = 72, IMG = "images/vaisseaux/rhino-dessus.webp", IW = 375, IH = 626;
    const BENNE = { x: 141.3, y: 322, w: 91.8, h: 244.8 };              // benne arriere du Rhino dans l'image (coordonnees de l'image)
    // materiaux a cocher : [nom francais du jeu, nom Spansh]. La liste ne dit PAS ce qu'il y a sur une planete (le jeu ne le donne pas) : c'est le pilote qui coche ce qu'il voit apres le scan.
    const CAT = {
        rhino: [["MÉTAUX", [["Or", "Gold"], ["Argent", "Silver"], ["Platine", "Platinum"], ["Palladium", "Palladium"], ["Lithium", "Lithium"], ["Thorium", "Thorium"], ["Osmium", "Osmium"], ["Iridium", "Iridium"], ["Cobalt", "Cobalt"], ["Cuivre", "Copper"], ["Indium", "Indium"], ["Béryllium", "Beryllium"], ["Tantale", "Tantalum"], ["Gallium", "Gallium"], ["Lanthane", "Lanthanum"], ["Titane", "Titanium"], ["Aluminium", "Aluminium"], ["Bismuth", "Bismuth"]]],
            ["MINÉRAUX ET GEMMES", [["Saphir", "Sapphire"], ["Rubis", "Ruby"], ["Diamant", "Diamond"], ["Diamants basse température", "Low Temperature Diamonds"], ["Alexandrite", "Alexandrite"], ["Grandidiérite", "Grandidierite"], ["Monazite", "Monazite"], ["Rhodplumsite", "Rhodplumsite"], ["Serendibite", "Serendibite"], ["Olivine", "Olivine"], ["Magnésite", "Magnesite"], ["Quartz pyroxénite", "Quartz Pyroxenite"], ["Périclase dunite", "Periclase Dunite"], ["Thortveitite", "Thortveitite"], ["Bastnasite", "Bastnasite"]]],
            ["GAZ", [["Hélium", "Helium"], ["Hélium-3", "Helium-3"], ["Deutérium", "Deuterium"], ["Tritium", "Tritium"]]]],
        vaisseau: [["MÉTAUX ET MINERAIS", [["Platine", "Platinum"], ["Osmium", "Osmium"], ["Or", "Gold"], ["Argent", "Silver"], ["Palladium", "Palladium"], ["Praséodyme", "Praseodymium"], ["Samarium", "Samarium"], ["Lanthane", "Lanthanum"], ["Bertrandite", "Bertrandite"], ["Indite", "Indite"], ["Gallite", "Gallite"], ["Lépidolite", "Lepidolite"], ["Uraninite", "Uraninite"], ["Cobalt", "Cobalt"], ["Rutile", "Rutile"], ["Cryolite", "Cryolite"], ["Coltan", "Coltan"], ["Bauxite", "Bauxite"]]],
            ["GEMMES", [["Painite", "Painite"], ["Opale du vide", "Void Opal"], ["Diamants basse température", "Low Temperature Diamonds"], ["Monazite", "Monazite"], ["Musgravite", "Musgravite"], ["Grandidiérite", "Grandidierite"], ["Bénitoïte", "Benitoite"], ["Serendibite", "Serendibite"], ["Alexandrite", "Alexandrite"], ["Rhodplumsite", "Rhodplumsite"], ["Bromellite", "Bromellite"]]]]
    };
    const FR = {}; Object.keys(CAT).forEach(v => CAT[v].forEach(g => g[1].forEach(m => { FR[m[1].toLowerCase()] = m[1]; })));      // noms affiches en ANGLAIS (comme RhinoSpotter et les marches du jeu en anglais)
    const NATURE = { "high metal content world": "Monde riche en métaux", "metal-rich body": "Corps métallique", "rocky body": "Corps rocheux", "rocky ice world": "Monde rocheux et glacé", "icy body": "Corps glacé", "gas giant": "Géante gazeuse", "earth-like world": "Monde terrestre", "water world": "Monde aquatique" };
    const ANNEAU = { "metallic": "métallique", "metal rich": "riche en métaux", "icy": "glacé", "rocky": "rocheux" };
    const MIN = window.__MIN = { vue: null, sel: null, rayon: null, heures: null, lieu: "", rhino: [], custom: "",
        prix: { cle: "", statut: "", donnees: null, calcule: null, msg: "", jeton: 0, essais: 0, ts: 0, minuteur: null },
        corps: { sys: "", statut: "", donnees: null, msg: "", ts: 0 },
        ail: { sig: "", statut: "", donnees: null, calcule: null, msg: "", jeton: 0, essais: 0, minuteur: null } };

    const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const M = () => (S && S.minage) || null;
    const somme = o => Object.keys(o || {}).reduce((t, k) => t + (Number(o[k]) || 0), 0);
    const nomMinerai = k => FR[String(k).toLowerCase()] || (k ? k.charAt(0).toUpperCase() + k.slice(1) : "");
    const nomFr = en => FR[String(en).toLowerCase()] || en;
    const age = iso => { const t = Date.parse(iso); if (!t) return ""; const h = (Date.now() - t) / 3600000; return h < 1 ? "il y a " + Math.max(1, Math.round(h * 60)) + " min" : h < 48 ? "il y a " + Math.round(h) + " h" : "il y a " + Math.round(h / 24) + " j"; };
    const ancien = iso => { const t = Date.parse(iso); return !t || Date.now() - t > 86400000; };          // releve de plus de 24 h (ou sans date) : prix a verifier en jeu
    const json = (k, def) => { try { const v = JSON.parse(lire(k)); return v == null ? def : v; } catch (e) { return def; } };
    const cap = () => { const v = vue(); return v === "rhino" ? ((M() && M().rhino && M().rhino.cap) || CAP_DEF) : Math.max(1, Number(S && S.soute && S.soute.cap) || 100); };

    // ---- vue : Rhino ou vaisseau (choix memorise ; au premier affichage, celle dans laquelle on a mine en dernier)
    function vue() {
        if (MIN.vue) return MIN.vue;
        const mem = lire("edteam_tb_minage");
        if (mem === "rhino" || mem === "vaisseau") return (MIN.vue = mem);
        const m = M();
        return (MIN.vue = m && !m.srv && m.fin && m.fin.vaisseau && (!m.fin.rhino || m.fin.vaisseau > m.fin.rhino) ? "vaisseau" : "rhino");
    }
    window.minageChoisir = v => { if (typeof sonClic === "function") sonClic(); MIN.vue = v; MIN.sel = null; ecrire("edteam_tb_minage", v); rendre(); };

    // ---- selection des materiaux (par vue, memorisee), rayon et fraicheur de « ailleurs »
    const sel = () => { if (!MIN.sel) MIN.sel = (json("edteam_tb_minage_sel_" + vue(), []) || []).filter(x => typeof x === "string").slice(0, 12); return MIN.sel; };
    const sauverSel = () => ecrire("edteam_tb_minage_sel_" + vue(), JSON.stringify(sel()));
    const rayon = () => { if (!MIN.rayon) MIN.rayon = [20, 40, 80, 120].indexOf(Number(lire("edteam_tb_minage_ray"))) >= 0 ? Number(lire("edteam_tb_minage_ray")) : 40; return MIN.rayon; };
    const heures = () => { if (!MIN.heures) MIN.heures = [24, 72, 168].indexOf(Number(lire("edteam_tb_minage_h"))) >= 0 ? Number(lire("edteam_tb_minage_h")) : 72; return MIN.heures; };
    window.minageBasculer = en => { if (typeof sonClic === "function") sonClic(); const s = sel(), i = s.findIndex(x => norm(x) === norm(en)); if (i >= 0) s.splice(i, 1); else if (s.length < 12) s.push(en); sauverSel(); rendre(); };
    window.minageEffacer = () => { MIN.sel = []; sauverSel(); MIN.ail.sig = ""; rendre(); };
    window.minageAjouter = txt => { const t = String(txt || "").trim().slice(0, 40); if (!t) return; const s = sel(); if (!s.some(x => norm(x) === norm(t)) && s.length < 12) { s.push(t); sauverSel(); } MIN.custom = ""; rendre(); };
    window.minageRayon = v => { MIN.rayon = v; ecrire("edteam_tb_minage_ray", String(v)); rendre(); };
    window.minageHeures = v => { MIN.heures = v; ecrire("edteam_tb_minage_h", String(v)); rendre(); };

    // ---- replier / deplier les etapes 1 et 2 : automatique (repliees des qu'on mine), puis le choix du pilote est memorise
    const mine = () => { const m = M(); return !!(m && (m.srv || somme(m.tot && m.tot.rhino) + somme(m.tot && m.tot.vaisseau) > 0)); };
    const plie = n => { const v = lire("edteam_tb_minage_p" + n); return v === "1" ? true : v === "0" ? false : mine(); };
    window.minagePlier = n => { if (typeof sonClic === "function") sonClic(); ecrire("edteam_tb_minage_p" + n, plie(n) ? "0" : "1"); rendre(); };

    // ---- couleurs : meme couleur pour un minerai dans le Rhino et dans la soute du vaisseau (ordre de la soute, puis les suivants)
    function couleurs(cles) {
        const items = ((S && S.soute && S.soute.items) || []).filter(x => (Number(x.q) || 0) > 0), out = {};
        items.forEach((x, i) => { out[norm(x.k || x.n)] = COUL_MARCH[i % COUL_MARCH.length]; });
        let n = items.length;
        cles.forEach(k => { if (!out[norm(k)]) { out[norm(k)] = COUL_MARCH[n % COUL_MARCH.length]; n++; } });
        return out;
    }

    // =================================================================================================
    //  DONNEES : corps du systeme, prix du systeme, prix ailleurs
    // =================================================================================================
    async function chercherCorps() {
        const C = MIN.corps;
        if (!S || !S.systeme || typeof supabaseApp === "undefined") return;
        const k = S.systeme.toLowerCase();
        if (C.sys === k && (C.statut === "EN_COURS" || C.statut === "PRET" || (C.statut === "ERREUR" && Date.now() - C.ts < 120000))) return;
        C.sys = k; C.statut = "EN_COURS"; C.donnees = null; C.ts = Date.now();
        let r; try { r = await supabaseApp.rpc("minage_corps", { p_systeme: S.systeme }); } catch (e) { r = { error: { message: "Connexion impossible." } }; }
        if (C.sys !== k) return;
        C.ts = Date.now();
        if (r.error || !r.data) { C.statut = "ERREUR"; C.msg = "Corps du système indisponibles pour le moment."; }
        else if (r.data.statut === "ERREUR") { C.statut = "ERREUR"; C.msg = r.data.message || "Corps du système indisponibles."; }
        else { C.statut = "PRET"; C.donnees = r.data.corps || []; }
        rendre();
    }
    const nomsPrix = () => {
        const base = []; CAT[vue()].forEach(g => g[1].forEach(m => base.push(m[1])));
        const tot = Object.keys((M() && M().tot && (M().tot.rhino || {})) || {}).concat(Object.keys((M() && M().tot && M().tot.vaisseau) || {}));
        const soute = ((S && S.soute && S.soute.items) || []).filter(x => (Number(x.q) || 0) > 0 && x.k && !x.m).map(x => x.k);
        return sel().concat(tot, soute, base).filter((x, i, a) => a.findIndex(y => norm(y) === norm(x)) === i).slice(0, 40);
    };
    function chercherPrix() {
        const P = MIN.prix;
        if (!S || !S.systeme || typeof supabaseApp === "undefined") return;
        const liste = nomsPrix(), cle = S.systeme.toLowerCase() + "|" + vue();      // une recherche par systeme et par vue, pas par selection : cocher ne rappelle pas le serveur
        const nouveau = sel().some(x => !(P.noms || []).some(y => norm(y) === norm(x)));      // un materiau saisi a la main, pas encore demande : on rappelle le serveur
        if (cle === P.cle && !nouveau && (P.statut === "EN_COURS" || Date.now() - P.ts < 1800000)) return;
        P.cle = cle; P.noms = liste; P.statut = "EN_COURS"; P.essais = 0; const jeton = ++P.jeton; interroger(jeton, liste);
    }
    async function interroger(jeton, liste) {
        const P = MIN.prix; if (jeton !== P.jeton || !S) return;
        let r;
        try { r = await supabaseApp.rpc("minage_prix", { p_systeme: S.systeme, p_noms: liste }); } catch (e) { r = { error: { message: "Connexion impossible." } }; }
        if (jeton !== P.jeton) return;
        if (r.error || !r.data) { P.statut = "ERREUR"; P.msg = "Prix indisponibles pour le moment."; P.ts = Date.now(); rendre(); return; }
        const j = r.data;
        if (j.items && j.items.length) { P.donnees = j.items; P.calcule = j.calcule_le; }
        if (j.statut === "PRET") { P.statut = "PRET"; P.ts = Date.now(); rendre(); return; }
        if (j.statut === "ERREUR") { P.statut = "ERREUR"; P.msg = j.message || "Prix indisponibles pour le moment."; P.ts = Date.now(); rendre(); return; }
        if (++P.essais > 25) { P.statut = "ERREUR"; P.msg = "La recherche des prix prend trop de temps : réessayez dans quelques minutes."; P.ts = Date.now(); rendre(); return; }
        rendre();
        P.minuteur = setTimeout(() => interroger(jeton, liste), Math.min(3000 + P.essais * 400, 8000));
    }
    const sigAil = () => (S ? S.systeme : "") + "|" + rayon() + "|" + heures() + "|" + cap() + "|" + sel().map(norm).sort().join(",");
    window.minageChercherAilleurs = () => {
        const A = MIN.ail; if (!S || !S.systeme || !sel().length || A.statut === "EN_COURS" || typeof supabaseApp === "undefined") return;
        if (typeof sonClic === "function") sonClic();
        A.sig = sigAil(); A.statut = "EN_COURS"; A.essais = 0; A.msg = ""; const jeton = ++A.jeton; interrogerAil(jeton); rendre();
    };
    async function interrogerAil(jeton) {
        const A = MIN.ail; if (jeton !== A.jeton || !S) return;
        const items = sel().map(en => ({ k: en, q: cap() }));
        let r;
        try { r = await supabaseApp.rpc("vente_soute", { p_systeme: S.systeme, p_items: items, p_rayon: rayon(), p_grande: true, p_heures: heures() }); } catch (e) { r = { error: { message: "Connexion impossible." } }; }
        if (jeton !== A.jeton) return;
        if (r.error || !r.data) { A.statut = "ERREUR"; A.msg = (r.error && r.error.message) || "Réponse vide."; rendre(); return; }
        const j = r.data;
        if (j.statut === "PRET") { A.statut = "PRET"; A.donnees = j.donnees; A.calcule = j.calcule_le; rendre(); return; }
        if (j.statut === "ERREUR") { A.statut = "ERREUR"; A.msg = j.message || "Recherche impossible pour le moment."; rendre(); return; }
        if (++A.essais > 30) { A.statut = "ERREUR"; A.msg = "La recherche prend trop de temps : réessayez dans quelques minutes."; rendre(); return; }
        A.minuteur = setTimeout(() => interrogerAil(jeton), Math.min(4000 + A.essais * 400, 10000));
    }

    // meilleur prix dans CE systeme : on prefere les releves de moins de 24 h ; sinon le meilleur ancien (signale)
    const vendable = (x, c0) => x.prix * Math.min(Number(x.demande) || 0, c0);          // ce qu'une station paierait pour une soute pleine (limite par sa demande)
    function ici(en) {
        const c0 = cap(), d = (MIN.prix.donnees || []).find(i => i.cle === norm(en)), c = ((d && d.candidats) || []).slice().sort((x, y) => vendable(y, c0) - vendable(x, c0)), frais = c.filter(x => !ancien(x.maj)), b = frais[0] || c[0];
        return b ? Object.assign({ ancien: ancien(b.maj) }, b) : null;
    }
    function valeurDe(contenu) {
        let val = 0, sans = 0;
        Object.keys(contenu || {}).forEach(k => { const q = Number(contenu[k]) || 0; if (q <= 0) return; const b = ici(k); if (b) val += q * b.prix; else sans += q; });
        return { val, sans };
    }
    function ailleurs(en) {
        const A = MIN.ail; if (!A.donnees) return null;
        const d = ((A.donnees.items) || []).find(i => norm(i.k) === norm(en) || norm(i.nom) === norm(en));
        const c0 = cap(), c = ((d && d.candidats) || []).filter(x => String(x.systeme || "").toLowerCase() !== String(S.systeme || "").toLowerCase()).sort((x, y) => vendable(y, c0) - vendable(x, c0));
        return { inconnue: !!(d && d.inconnue), best: c[0] || null };
    }

    // =================================================================================================
    //  AFFICHAGE
    // =================================================================================================
    const selecteur = v => `<div class="tb-modes"><span class="tb-seg grand"><button type="button" class="${v === "rhino" ? "on" : ""}" onclick="minageChoisir('rhino')">🚙 RHINO · MINAGE AU SOL</button><button type="button" class="${v === "vaisseau" ? "on" : ""}" onclick="minageChoisir('vaisseau')">🚀 VAISSEAU · LASERS ET CHARGES</button></span></div>`;
    const entete = (n, titre, resume, repli) => `<div class="tbn-h" onclick="minagePlier(${n})" role="button" tabindex="0" onkeydown="if(event.key==='Enter')minagePlier(${n})"><span class="tbn-n">${n}</span><span class="tt">${titre}</span><span class="rs">${resume}</span><span class="fl">${repli ? "▼" : "▲"}</span></div>`;

    // ---- ETAPE 1 : OU SE POSER / OU TROUVER UN ANNEAU
    function etape1(v) {
        const C = MIN.corps, rhino = v === "rhino", sig = (M() && M().sig) || {}, hot = (M() && M().hot) || {};
        const hotDe = c => Object.keys(hot).filter(k => k.indexOf(c.n + " ") === 0).reduce((t, k) => t.concat(hot[k]), []);
        const tous = C.donnees || [], corps = tous.filter(c => rhino ? c.l : (c.r && c.r.length));
        const nSig = rhino ? corps.filter(c => sig[c.n]).length : 0, nbEmpl = rhino ? corps.reduce((t, c) => t + (Number(sig[c.n]) || 0), 0) : 0, nHot = rhino ? 0 : corps.filter(c => hotDe(c).length).length;
        const resume = !S || !S.systeme ? "position non relevée" : C.statut === "EN_COURS" ? "lecture des corps de " + esc(S.systeme) + "…" : C.statut === "ERREUR" ? esc(C.msg)
            : rhino ? `${corps.length} corps où atterrir` + (nSig ? ` · ${nSig} scanné${nSig > 1 ? "s" : ""} (${nbEmpl} emplacements d'extraction)` : " · aucun scanné pour l'instant") : `${corps.length} corps avec anneaux` + (nHot ? ` · ${nHot} scanné${nHot > 1 ? "s" : ""} (points chauds relevés)` : " · aucun scanné pour l'instant");
        const repli = plie(1);
        let corpsHtml;
        if (!S || !S.systeme) corpsHtml = `<div class="tb-vide">Position non encore relevée : elle arrive au prochain saut ou à la prochaine connexion.</div>`;
        else if (C.statut === "EN_COURS" && !C.donnees) corpsHtml = `<div class="tb-attente"><span class="tb-spin"></span><div><b>Lecture des corps de ${cp(S.systeme)}…</b><span>quelques secondes</span></div></div>`;
        else if (C.statut === "ERREUR") corpsHtml = `<div class="tb-banner">${esc(C.msg)}</div>`;
        else if (!corps.length) corpsHtml = `<div class="tb-vide">${rhino ? "Aucun corps où se poser connu dans ce système d'après EDSM." : "Aucun anneau connu dans ce système d'après EDSM."}</div>`;
        else if (rhino) {
            const tri = corps.slice().sort((a, b) => ((b.c && b.c.Metal) || 0) - ((a.c && a.c.Metal) || 0) || a.d - b.d);
            corpsHtml = `<table class="tbn-tab"><tr class="tbn-th"><td>CORPS</td><td>NATURE</td><td>SOL</td><td class="d">GRAVITÉ</td><td class="d">DISTANCE</td><td class="d">EMPLACEMENTS D'EXTRACTION</td></tr>${tri.map(c => {
                const co = c.c || {}, g = Number(c.g) || 0, n = Number(sig[c.n]) || 0;
                return `<tr><td>${cp(c.n)}</td><td>${esc(NATURE[String(c.t).toLowerCase()] || c.t || "—")}</td><td>${co.Metal != null ? `<span class="tbn-sol" title="métal ${co.Metal} % · roche ${co.Rock} % · glace ${co.Ice} %"><i style="width:${co.Metal}%;background:#FFD54A"></i><i style="width:${co.Rock}%;background:#8a96a0"></i><i style="width:${co.Ice}%;background:#7fe9ff"></i></span><span class="tb-mut" style="font-size:.85em;">${Math.round(co.Metal)} % métal</span>` : '<span class="tb-mut">—</span>'}</td><td class="d ${g > 1.2 ? "vx" : ""}">${String(g.toFixed(2)).replace(".", ",")} g${g > 1.2 ? " ⚠" : ""}</td><td class="d">${fmtN(c.d)} Ls</td><td class="d">${n ? `<b style="color:#00F0FF">${n}</b> · scannés` : '<span class="tb-mut">à scanner</span>'}</td></tr>`;
            }).join("")}</table><div class="tb-mut" style="font-size:.75em;margin-top:8px;">Nature des corps d'après EDSM. Les emplacements d'extraction apparaissent ici une fois la planète scannée avec le scanner de surface (relevé par le plugin).</div>`;
        } else {
            corpsHtml = `<table class="tbn-tab"><tr class="tbn-th"><td>CORPS</td><td>ANNEAUX</td><td>POINTS CHAUDS <span class="tb-mut">(après scan de l'anneau)</span></td><td class="d">DISTANCE</td></tr>${corps.map(c => { const h = hotDe(c), s = sel(); return `<tr><td>${cp(c.n)}<div class="tb-mut" style="font-size:.8em;">${esc(NATURE[String(c.t).toLowerCase()] || c.t || "")}</div></td><td>${c.r.map(t => esc(ANNEAU[String(t).toLowerCase()] || t)).join(" · ")}</td><td>${h.length ? h.slice().sort((a, b) => b[1] - a[1]).map(x => `<span class="tbn-hs ${s.some(y => norm(y) === norm(x[0])) ? "on" : ""}">${esc(nomFr(x[0]))} ×${x[1]}</span>`).join("") : '<span class="tb-mut">à scanner</span>'}</td><td class="d">${fmtN(c.d)} Ls</td></tr>`; }).join("")}</table><div class="tb-mut" style="font-size:.75em;margin-top:8px;">Anneaux d'après EDSM ; points chauds relevés par le plugin quand vous scannez l'anneau avec le scanner de surface (en bleu : ceux que vous avez cochés à l'étape 2). Les anneaux métalliques et riches en métaux sont les plus intéressants pour les minerais précieux.</div>`;
        }
        return `<div class="bloc cy tbn-etape ${repli ? "plie" : ""}" style="margin-bottom:12px;">${entete(1, rhino ? "OÙ SE POSER" : "OÙ TROUVER UN ANNEAU", resume, repli)}<div class="tbn-corps">${corpsHtml}</div></div>`;
    }

    // ---- ETAPE 2 : QUOI MINER ?
    function lignes() {
        const s = sel(), en = s.length ? s : (() => { const tous = []; CAT[vue()].forEach(g => g[1].forEach(m => tous.push(m[1]))); return tous.filter(x => ici(x)).sort((a, b) => ici(b).prix - ici(a).prix).slice(0, 5); })();
        const c = cap();
        return { apercu: !s.length, rows: en.map(x => { const i = ici(x), a = ailleurs(x), vi = i ? vendable(i, c) : 0, va = a && a.best ? vendable(a.best, c) : 0; return { en: x, i, a, vi, va, best: Math.max(vi, va) }; }).sort((x, y) => y.best - x.best) };
    }
    function etape2(v) {
        const rhino = v === "rhino", repli = plie(2), P = MIN.prix, A = MIN.ail, c = cap(), s = sel();
        const { apercu, rows } = lignes();
        const top = rows.find(r => r.best > 0);
        const resume = s.length ? s.map(x => esc(nomFr(x))).join(" · ") + (top ? ` — meilleur : <b style="color:#FFD54A">${esc(nomFr(top.en))}</b> ≈ ${fmtM(top.best)} la soute` : "") : "aucun matériau coché : cochez ceux affichés dans le jeu après le scan";
        const pastilles = CAT[v].map(g => `<div class="tbn-g"><span class="tbn-gt">${g[0]}</span><div class="tbn-gp">${g[1].slice().sort((a, b) => a[1].localeCompare(b[1])).map(m => `<button type="button" class="tbn-p ${s.some(x => norm(x) === norm(m[1])) ? "on" : ""}" onclick="minageBasculer('${m[1]}')">${esc(m[1])}</button>`).join("")}</div></div>`).join("");
        const perso = s.filter(x => !FR[String(x).toLowerCase()]).map(x => `<button type="button" class="tbn-p on" onclick="minageBasculer('${esc(x).replace(/'/g, "")}')">${esc(x)} ✕</button>`).join("");
        const seg = (vals, cur, fn, lab) => `<span class="tb-seg">${vals.map(x => `<button type="button" class="${x === cur ? "on" : ""}" onclick="${fn}(${x})">${lab(x)}</button>`).join("")}</span>`;
        const perime = A.statut === "PRET" && A.sig !== sigAil();
        let corps = "";
        const cellDem = (b, c0) => { if (!b) return '<span class="tb-mut">—</span>'; const dem = Number(b.demande) || 0, peu = dem < c0; return `<b class="${peu ? "vx" : ""}">${fmtN(dem)} t</b>${peu ? '<div class="sm vx">⚠ n\'absorbe que ' + fmtN(dem) + ' t</div>' : ""}`; };
        const cellIci = r => P.statut === "EN_COURS" && !P.donnees ? '<span class="tb-mut">…</span>' : r.i ? `<b>${fmtN(r.i.prix)} cr/t</b><div class="tb-mut sm">${esc(r.i.station)} · ${esc(age(r.i.maj))}${r.i.ancien ? " ⚠" : ""}</div>` : '<span class="tb-mut">aucune station du système ne l\'achète</span>';
        const cellAil = r => { if (A.statut === "EN_COURS") return '<span class="tb-mut"><span class="tb-spin" style="width:10px;height:10px;border-width:2px;vertical-align:-1px;margin-right:6px;"></span>recherche…</span>'; if (!A.donnees || apercu) return '<span class="tb-mut">—</span>'; if (r.a && r.a.inconnue) return '<span class="tb-mut">matériau inconnu de Spansh</span>'; return r.a && r.a.best ? `<b>${fmtN(r.a.best.prix)} cr/t</b><div class="tb-mut sm">${esc(r.a.best.station)} · ${esc(r.a.best.systeme)} · ${fmtN(r.a.best.distance)} al · ${esc(age(r.a.best.maj))}</div>` : '<span class="tb-mut">rien dans ce rayon</span>'; };
        if (!rows.length) corps = `<div class="tb-vide">${P.statut === "EN_COURS" ? "Recherche des prix du système…" : "Cochez les matériaux affichés dans le jeu pour voir ce qu'ils rapportent."}</div>`;
        else corps = `<table class="tbn-tab"><tr class="tbn-th"><td>MATÉRIAU${apercu ? ' <span class="tb-mut">· aperçu : les plus chers ici</span>' : ""}</td><td class="s">DANS CE SYSTÈME <span class="tb-mut">pour le Powerplay</span></td><td class="d">DEMANDE <span class="tb-mut">(t vendables)</span></td><td class="s">AILLEURS <span class="tb-mut">≤ ${rayon()} al · relevés de moins de ${heures() === 24 ? "1 j" : heures() / 24 + " j"}</span></td><td class="d">DEMANDE <span class="tb-mut">(t vendables)</span></td><td class="d">UNE SOUTE PLEINE <span class="tb-mut">(${fmtN(c)} t)</span></td></tr>${rows.map((r, i) => `<tr class="${i === 0 && r.best > 0 ? "top" : ""}"><td>${i === 0 && r.best > 0 ? "★ " : ""}<b>${esc(nomFr(r.en))}</b></td><td class="${r.vi && r.vi >= r.va ? "win" : ""}">${cellIci(r)}</td><td class="d ${r.vi && r.vi >= r.va ? "win" : ""}">${cellDem(r.i, c)}</td><td class="${r.va > r.vi ? "win" : ""}">${cellAil(r)}</td><td class="d ${r.va > r.vi ? "win" : ""}">${cellDem(r.a && r.a.best, c)}</td><td class="d">${r.best ? `<b>≈ ${fmtM(r.best)}</b><div class="tb-mut sm">${r.va > r.vi ? "ailleurs" : "ici"}${r.vi && r.va ? " · " + (r.va > r.vi ? "+" : "−") + fmtM(Math.abs(r.va - r.vi)) : ""}</div>` : '<span class="tb-mut">—</span>'}</td></tr>`).join("")}</table>`;
        const corpsHtml = `<div class="tbn-aide">Dans le jeu : scannez la planète, sélectionnez un signal d'extraction, puis <b>cochez ci-dessous les matériaux affichés en bas à gauche</b>. Le tableau classe ces matériaux par ce qu'ils rapportent.${rhino ? "" : " (En vaisseau : cochez ceux de l'anneau visé.)"}</div>
            <div class="tbn-sel">${pastilles}<div class="tbn-g"><span class="tbn-gt">UN AUTRE ?</span>${perso}<input id="tbn-autre" class="tbn-in" placeholder="nom en anglais…" value="${esc(MIN.custom)}" oninput="window.__MIN.custom=this.value" onkeydown="if(event.key==='Enter')minageAjouter(this.value)"><button type="button" class="tbn-p" onclick="minageAjouter(document.getElementById('tbn-autre').value)">+ AJOUTER</button>${s.length ? '<button type="button" class="tbn-p" style="margin-left:auto;" onclick="minageEffacer()">effacer la sélection</button>' : ""}</div></div>
            <div style="margin-top:12px;">${corps}</div>
            <div class="tbn-ctl"><span class="tb-mut">AILLEURS :</span>${seg([20, 40, 80, 120], rayon(), "minageRayon", x => x + " al")}${seg([24, 72, 168], heures(), "minageHeures", x => x === 24 ? "1 j" : x / 24 + " j")}<button type="button" class="tb-btn" ${s.length && A.statut !== "EN_COURS" ? "" : "disabled"} onclick="minageChercherAilleurs()">${A.statut === "PRET" ? "↻ CHERCHER À NOUVEAU" : "▶ CHERCHER AILLEURS"}</button>${perime ? '<span class="tb-mut sm" style="color:#FFB000;">sélection ou réglages modifiés : relancez la recherche</span>' : ""}</div>
            ${A.statut === "ERREUR" ? `<div class="tb-banner" style="margin-top:8px;">${esc(A.msg)}</div>` : ""}${P.statut === "ERREUR" && !P.donnees ? `<div class="tb-banner" style="margin-top:8px;">${esc(P.msg)}</div>` : ""}
            <div class="tb-mut" style="font-size:.75em;margin-top:8px;line-height:1.5;">Prix de relevés de joueurs (Spansh), avec leur âge : ⚠ = relevé de plus de 24 h, le prix a pu baisser (surtout si beaucoup de joueurs ont vendu) ; vérifiez-le en jeu. « Ailleurs » = meilleure station du rayon choisi, hors de ce système, pour ${fmtN(c)} t. <b>La demande</b> est la quantité que la station peut encore acheter : une soute pleine est comptée dans cette limite, un matériau dont la demande est faible ne vaut pas la peine d'être miné en quantité.</div>`;
        return `<div class="bloc or tbn-etape ${repli ? "plie" : ""}" style="margin-bottom:12px;">${entete(2, "QUOI MINER ?", resume, repli)}<div class="tbn-corps">${corpsHtml}</div></div>`;
    }

    // ---- ETAPE 3 : cartes de chiffres (memes cartes que Commerce)
    function chiffres(v) {
        const m = M() || {}, tot = (m.tot && m.tot[v]) || {}, n = somme(tot), deb = m.deb && m.deb[v] ? Date.parse(m.deb[v]) : 0, fin = m.fin && m.fin[v] ? Date.parse(m.fin[v]) : 0;
        const actif = fin && Date.now() - fin < 15 * 60000, sec = deb ? ((actif ? Date.now() : fin) - deb) / 1000 : 0, rythme = sec >= 120 ? Math.round(n / (sec / 3600)) : null;
        const detail = Object.keys(tot).sort((a, b) => tot[b] - tot[a]).map(k => nomMinerai(k).toLowerCase() + " " + fmtN(tot[k])).join(" · ");
        let val = 0, connu = 0;
        Object.keys(tot).forEach(k => { const b = ici(k); if (b) { val += tot[k] * b.prix; connu += tot[k]; } });
        return `<div class="tb-grid4">
            <div class="bloc vert"><h2>MINERAIS RAFFINÉS <em>session en cours</em></h2><div class="tb-big ${n ? "tb-up" : ""}">${fmtN(n)}</div><div class="tb-jauge"><i style="width:${n ? 100 : 0}%"></i></div><div class="tb-sub">${detail ? esc(detail) : "rien raffiné pour l'instant"}</div></div>
            <div class="bloc or"><h2>RYTHME</h2><div class="tb-big">${rythme == null ? "—" : fmtN(rythme) + " /h"}</div><div class="tb-sub">${rythme == null ? "il faut quelques minutes de minage" : "minerais par heure" + (actif ? "" : " (session terminée)")}</div></div>
            <div class="bloc cy"><h2>DURÉE</h2><div class="tb-big">${sec ? duree(sec) : "—"}</div><div class="tb-sub">${v === "rhino" ? "depuis le premier minerai du Rhino" : "depuis le premier minerai raffiné"}</div></div>
            <div class="bloc"><h2>VALEUR ESTIMÉE</h2><div class="tb-big">${connu ? "≈ " + fmtM(val) : "—"}</div><div class="tb-sub">${connu ? "aux meilleurs prix de ce système" : "prix du système non relevés"}</div></div></div>`;
    }

    // encadre « valeur estimee » a droite de la benne, relie par une fleche aux caisses
    function boiteValeur(b, VW, vr) {
        const bw = 240, bh = 84, bx = VW - bw - 6, by = b.y + b.h / 2 - bh / 2, x0 = b.x + b.w + 4, y0 = b.y + b.h / 2;
        const txt = vr && vr.val > 0 ? "≈ " + fmtM(vr.val) : "—", sub = !vr ? "" : vr.val > 0 ? (vr.sans ? vr.sans + " t sans prix" : "aux prix du système") : "prix du système non relevés";
        return `<defs><marker id="tbnval" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#FFD54A"/></marker></defs>
            <circle cx="${x0 - 4}" cy="${y0}" r="3.2" fill="#FFD54A"/><line x1="${x0 - 4}" y1="${y0}" x2="${bx - 2}" y2="${y0}" stroke="#FFD54A" stroke-width="1.6" stroke-dasharray="5 4" marker-end="url(#tbnval)"/>
            <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="rgba(3,8,12,.92)" stroke="#FFD54A" stroke-width="1.4"/>
            <text x="${bx + bw / 2}" y="${by + 21}" text-anchor="middle" fill="#FFD54A" font-size="14" letter-spacing="2">VALEUR ESTIMÉE</text>
            <text x="${bx + bw / 2}" y="${by + 54}" text-anchor="middle" fill="#fff" font-size="32" font-weight="bold">${esc(txt)}</text>
            <text x="${bx + bw / 2}" y="${by + 74}" text-anchor="middle" fill="#8b97a0" font-size="12">${esc(sub)}</text>`;
    }
    // ---- hologramme du Rhino : image teintee, caisses directement dans la benne arriere (une caisse = un minerai), survol = minerai
    function scene(det, capacite, coul, vr) {
        const cles = Object.keys(det).sort((a, b) => det[b] - det[a]), liste = []; cles.forEach(k => { for (let i = 0; i < det[k]; i++) liste.push(k); });
        MIN.rhino = liste;
        const K = 0.74, VW = 560, VH = IH * K + 60, X0 = 24, Y0 = 20, b = { x: X0 + BENNE.x * K, y: Y0 + BENNE.y * K, w: BENNE.w * K, h: BENNE.h * K };
        const C = 6, R = Math.max(1, Math.ceil(capacite / C)), cw = b.w / C, ch = b.h / R; let cases = "";
        for (let i = 0; i < capacite; i++) {
            const r = Math.floor(i / C), c = i % C, ry = R - 1 - r, k = liste[i], cl = k ? coul[norm(k)] : null;
            cases += `<rect class="tbn-c" data-i="${i}" x="${(b.x + c * cw + 0.8).toFixed(1)}" y="${(b.y + ry * ch + 0.8).toFixed(1)}" width="${(cw - 1.6).toFixed(1)}" height="${(ch - 1.6).toFixed(1)}" fill="${cl || "none"}" fill-opacity="${cl ? 0.75 : 0}" stroke="${cl || "#1c6a78"}" stroke-opacity="${cl ? 1 : 0.4}" stroke-width="1"/>`;
        }
        return `<svg viewBox="0 0 ${VW} ${VH.toFixed(0)}" class="tbn-svg" id="tbn-scene" role="img" aria-label="Soute du Rhino">
            <defs><filter id="tbnh" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0  0.28 0.55 0.1 0 0  0.36 0.72 0.14 0 0  0 0 0 1 0"/><feComponentTransfer><feFuncG type="gamma" amplitude="1.25" exponent="1.45" offset="0"/><feFuncB type="gamma" amplitude="1.25" exponent="1.45" offset="0"/></feComponentTransfer></filter>
            <filter id="tbnl"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <pattern id="tbns" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1.4" fill="#000" opacity=".28"/></pattern></defs>
            <g filter="url(#tbnl)"><image href="${IMG}" x="${X0.toFixed(1)}" y="${Y0}" width="${(IW * K).toFixed(1)}" height="${(IH * K).toFixed(1)}" filter="url(#tbnh)"/></g>
            <rect x="${X0.toFixed(1)}" y="${Y0}" width="${(IW * K).toFixed(1)}" height="${(IH * K).toFixed(1)}" fill="url(#tbns)" opacity=".45"/>
            <rect x="${(b.x - 3).toFixed(1)}" y="${(b.y - 3).toFixed(1)}" width="${(b.w + 6).toFixed(1)}" height="${(b.h + 6).toFixed(1)}" fill="rgba(0,20,28,.55)" stroke="#00F0FF" stroke-opacity=".85"/>${cases}${boiteValeur(b, VW, vr)}</svg>`;
    }
    function cadreRhino() {
        const m = M(), det = (m && m.rhino && m.rhino.det) || {}, capR = (m && m.rhino && m.rhino.cap) || CAP_DEF, total = Math.min(somme(det), capR), pct = Math.round(total / capR * 100);
        const cles = Object.keys(det).sort((a, b) => det[b] - det[a]), coul = couleurs(cles), vr = valeurDe(det);
        const leg = cles.map(k => { const b = ici(k); return `<span style="--cl:${coul[norm(k)]}"><i></i>${esc(nomMinerai(k))} · ${fmtN(det[k])} t${b ? " · ≈ " + fmtM(det[k] * b.prix) : ""}</span>`; }).join("");
        return `<div class="bloc holo tbp-bloc tbm-bloc tbn-cadre"><div class="holo-balayage"></div><h2>MON RHINO <em>${m && m.srv ? "VRS Rhino · en route" : "VRS Rhino · soute de minage"}</em></h2>
            <div class="tbp-jauge"><span>SOUTE</span><div class="bar"><i style="width:${pct}%"></i></div><b style="color:#FFB44D">${total}/${capR}</b></div>${scene(det, capR, coul, vr)}
            <div class="tb-leg">${leg || '<span style="cursor:default;color:#778;">soute vide : sortez le Rhino et minez, elle se remplit toute seule</span>'}</div></div>`;
    }
    // ---- prospecteur (vaisseau)
    function cadreProspecteur() {
        const m = M(), p = m && m.pros, dr = (m && m.dr) || {}, nd = somme(dr);
        let corps;
        if (!p) corps = `<div class="tb-vide" style="margin:auto;">Lancez un drone prospecteur sur un astéroïde : sa composition s'affiche ici toute seule.</div>`;
        else {
            const coul = couleurs((p.mat || []).map(x => x[0])), max = Math.max.apply(null, (p.mat || []).map(x => x[1]).concat([1]));
            corps = `<div class="tb-sub" style="margin:2px 0 10px;">${esc(p.ct || "Astéroïde prospecté")} · reste <b style="color:#fff;">${fmtN(p.reste)} %</b>${p.coeur ? ` · noyau : <b style="color:#FFD54A;">${esc(p.coeur)}</b>` : ""}</div>
                ${(p.mat || []).map(x => `<div class="tbn-bar"><span>${esc(x[0])}</span><div><i style="width:${Math.min(100, x[1] / max * 100)}%;background:${coul[norm(x[0])]};"></i></div><b>${String(x[1]).replace(".", ",")} %</b></div>`).join("")}`;
        }
        return `<div class="bloc holo tbp-bloc tbm-bloc tbn-cadre"><div class="holo-balayage"></div><h2>MON PROSPECTEUR <em>${p ? "dernier astéroïde · " + esc(age(p.t)) : "aucun astéroïde prospecté"}</em></h2>
            <div class="tbp-jauge"><span>DRONES</span><div class="bar"><i style="width:${nd ? 100 : 0}%"></i></div><b style="color:#FFB44D">${fmtN(nd)}</b></div><div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:6px 4px;">${corps}</div>
            <div class="tb-leg">${Object.keys(dr).map(k => `<span style="cursor:default;">${esc(k)} · ${fmtN(dr[k])}</span>`).join("") || '<span style="cursor:default;color:#778;">aucun drone lancé</span>'}</div></div>`;
    }
    // ---- vaisseau : le meme hologramme que Commerce et Missions, sans les cartes de modules ; jauge de SOUTE
    function valeurSoute(items) {
        const c = {}; items.forEach(x => { if (!x.m) c[x.k || x.n] = (c[x.k || x.n] || 0) + (Number(x.q) || 0); });
        const r = valeurDe(c);
        return { titre: "VALEUR ESTIMÉE", txt: r.val > 0 ? "≈ " + fmtM(r.val) : "—", sub: r.val > 0 ? (r.sans ? r.sans + " t sans prix" : "aux prix du système") : "soute vide ou prix non relevés" };
    }
    function cadreVaisseau() {
        const so = (S && S.soute) || {}, items = (so.items || []).filter(x => (Number(x.q) || 0) > 0), tonnes = items.reduce((a, x) => a + (Number(x.q) || 0), 0), capV = Number(so.cap) || 0;
        const html = typeof modulesHtml === "function" ? modulesHtml([], { etiquettes: false, titre: "MON VAISSEAU", jauge: { titre: "SOUTE", n: tonnes, cap: capV, unite: " t" }, sansNote: true, valeur: valeurSoute(items) }) : "";
        return html || `<div class="bloc holo tbn-cadre"><div class="holo-balayage"></div>${typeof souteHtml === "function" ? souteHtml() : ""}</div>`;
    }
    // ---- fleche de transit : fixe et discrete tant que le Rhino est vide ; defile des la 1re tonne ; plus vive a partir de SEUIL ; vive a fond quand il est plein
    function fleche() {
        const m = M(), capR = (m && m.rhino && m.rhino.cap) || CAP_DEF, n = Math.min(somme(m && m.rhino && m.rhino.det), capR);
        const etat = n >= capR ? "max" : n >= SEUIL ? "haut" : n >= 1 ? "on" : "off";
        return `<div class="tbn-fl ${etat}" title="${etat === "off" ? "Le Rhino est vide" : etat === "on" ? "Le Rhino se remplit" : "Pensez à transférer la soute du Rhino dans le vaisseau"}"><svg viewBox="0 0 120 150" width="100%">${[0, 1, 2].map(i => `<polyline class="c${i}" points="${18 + i * 30},46 ${46 + i * 30},75 ${18 + i * 30},104" fill="none" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`).join("")}</svg>
            <div class="tx">${etat === "off" ? "RHINO VIDE" : etat === "on" ? "SE REMPLIT" : "À TRANSFÉRER"}</div><div class="nb">${n} / ${capR}</div></div>`;
    }
    // ---- bilan par minerai
    function bilan(v) {
        const m = M() || {}, tot = (m.tot && m.tot[v]) || {}, cles = Object.keys(tot).sort((a, b) => tot[b] - tot[a]);
        if (!cles.length) return `<div class="bloc" style="margin-bottom:12px;"><h2>CE QUE J'AI MINÉ</h2><div class="tb-vide">Rien de raffiné pour l'instant : le bilan apparaît dès le premier minerai.</div></div>`;
        const deb = m.deb && m.deb[v] ? Date.parse(m.deb[v]) : 0, fin = m.fin && m.fin[v] ? Date.parse(m.fin[v]) : 0, actif = fin && Date.now() - fin < 15 * 60000, h = deb ? ((actif ? Date.now() : fin) - deb) / 3600000 : 0;
        const coul = couleurs(cles), dansRhino = (m.rhino && m.rhino.det) || {}, soute = {}; ((S.soute && S.soute.items) || []).forEach(x => { soute[norm(x.k || x.n)] = Number(x.q) || 0; });
        return `<div class="bloc" style="margin-bottom:12px;"><h2>CE QUE J'AI MINÉ <em>session en cours</em></h2><table class="tbn-tab"><tr class="tbn-th"><td>MINERAI</td><td class="d">MINÉ</td><td class="d">PAR HEURE</td>${v === "rhino" ? '<td class="d">DANS LE RHINO</td>' : ""}<td class="d">DANS LE VAISSEAU</td></tr>
            ${cles.map(k => `<tr><td><i class="tbn-pt" style="background:${coul[norm(k)]}"></i>${esc(nomMinerai(k))}</td><td class="d"><b>${fmtN(tot[k])}</b></td><td class="d">${h >= 0.03 ? fmtN(tot[k] / h) + " /h" : "—"}</td>${v === "rhino" ? `<td class="d">${fmtN(dansRhino[k] || 0)}</td>` : ""}<td class="d">${fmtN(soute[norm(k)] || 0)} t</td></tr>`).join("")}</table></div>`;
    }

    const CSS = `<style id="tbn-css">
        .tbn-etape{padding-top:10px}.tbn-h{display:flex;align-items:center;cursor:pointer;margin:0 0 8px;padding:2px 0 8px;border-bottom:1px solid rgba(255,255,255,.1);user-select:none}
        .tbn-h .tt{color:#fff;font-size:1.3em;letter-spacing:4px;font-weight:bold;text-shadow:0 0 12px rgba(0,240,255,.35)}.tbn-h .rs{margin-left:16px;color:#9fb0b8;font-size:.82em;letter-spacing:0;flex:1;min-width:0}.tbn-h .fl{color:#00F0FF;font-size:1.1em;margin-left:10px}
        .tbn-n{display:inline-block;width:32px;height:32px;line-height:32px;text-align:center;border-radius:50%;background:#00F0FF;color:#001015;font-weight:bold;margin-right:14px;box-shadow:0 0 10px rgba(0,240,255,.5);flex-shrink:0}
        .tbn-etape.plie .tbn-corps{display:none}.tbn-etape.plie .tbn-h{border-bottom:0;margin:0;padding:0}
        .tbn-bande{display:flex;align-items:center;margin:4px 0 10px;padding:8px 2px;border-bottom:1px solid rgba(0,240,255,.35);color:#fff;letter-spacing:4px;font-size:1.15em;font-weight:bold}.tbn-bande em{font-style:normal;color:#778;letter-spacing:0;margin-left:14px;font-size:.7em;font-weight:normal}
        .tbn-aide{color:#889;font-size:.8em;line-height:1.5;margin:0 0 6px}.tbn-aide b{color:#ddd}.tbn-sel{margin-top:4px}.tbn-g{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:6px 0}.tbn-gt{color:#778;letter-spacing:2px;font-size:.7em;width:130px;flex-shrink:0;align-self:flex-start;padding-top:7px}.tbn-gp{display:grid;grid-template-columns:repeat(auto-fill,minmax(172px,1fr));gap:6px;flex:1;min-width:0}.tbn-gp .tbn-p{width:100%;text-align:center;white-space:nowrap}
        .tbn-p{background:transparent;border:1px solid #1f4f5a;color:#8fd;font:inherit;font-size:.82em;padding:4px 11px;cursor:pointer}.tbn-p:hover{background:rgba(0,240,255,.14)}.tbn-p.on{background:#00F0FF;color:#001015;font-weight:bold;box-shadow:0 0 10px rgba(0,240,255,.45)}
        .tbn-in{background:#0b1418;border:1px solid #1f3a44;color:#ddd;font:inherit;font-size:.85em;padding:4px 8px;width:190px}.tbn-ctl{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin-top:12px}
        .tbn-hs{display:inline-block;border:1px solid #1f4f5a;color:#8fd;font-size:.85em;padding:1px 8px;margin:0 5px 3px 0;white-space:nowrap}.tbn-hs.on{background:#00F0FF;color:#001015;font-weight:bold}
        .tbn-sol{display:inline-flex;width:100px;height:10px;background:#0b1418;border:1px solid #1f3a44;vertical-align:middle;margin-right:8px}.tbn-sol i{display:block;height:100%}
        .tbn-duo{display:grid;grid-template-columns:minmax(0,1fr) 110px minmax(0,1fr);gap:8px;margin-bottom:12px;align-items:stretch}.tbn-duo.deux{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}
        .tbn-col{min-width:0;display:flex;flex-direction:column}.tbn-col>.bloc,.tbn-cadre{flex:1;margin-bottom:0!important;box-sizing:border-box;display:flex;flex-direction:column}
        .tbn-col .tbm-bloc>svg,.tbn-col .tbm-bloc .tb-scene>svg{max-height:470px;min-height:0;margin:auto}.tbn-col .tbm-bloc .tb-scene{flex:0 1 auto;margin:auto 0}
        .tbn-svg{width:100%;flex:0 1 auto;max-height:470px;margin:auto;display:block}.tbn-c{cursor:pointer}.tbn-c:hover{stroke-width:2.4;fill-opacity:1;filter:drop-shadow(0 0 5px #fff)}
        .tbn-fl{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;height:100%}.tbn-fl .tx{font-size:.62em;letter-spacing:3px;color:#778;text-align:center}.tbn-fl .nb{font-size:1.05em;color:#aab}
        .tbn-fl polyline{stroke:#1f6c7a;opacity:.35}
        .tbn-fl.on polyline{stroke:#FF9A1F;filter:drop-shadow(0 0 9px #FF7100);animation:tbnFlux 1.8s ease-in-out infinite}.tbn-fl.haut polyline{stroke:#FF7100;filter:drop-shadow(0 0 12px #FF5A00);animation:tbnFlux 1.2s ease-in-out infinite}.tbn-fl.max polyline{stroke:#ff4d1a;filter:drop-shadow(0 0 14px #ff3b00);animation:tbnFlux .8s ease-in-out infinite}
        .tbn-fl .c1{animation-delay:.2s!important}.tbn-fl .c2{animation-delay:.4s!important}.tbn-fl.on .tx,.tbn-fl.haut .tx,.tbn-fl.max .tx{color:#FF9A1F}.tbn-fl.on .nb,.tbn-fl.haut .nb,.tbn-fl.max .nb{color:#fff}
        @keyframes tbnFlux{0%,100%{opacity:.3;transform:translateX(-10px)}50%{opacity:1;transform:translateX(10px)}}@media (prefers-reduced-motion:reduce){.tbn-fl polyline{animation:none!important;opacity:1}}
        @media (max-width:1000px){.tbn-duo,.tbn-duo.deux{grid-template-columns:minmax(0,1fr)}.tbn-fl{flex-direction:row;height:90px;gap:14px}.tbn-fl svg{width:90px;transform:rotate(90deg)}.tbn-h .rs{display:none}}
        .tbn-tab{width:100%;border-collapse:collapse;font-size:.86em}.tbn-tab td{padding:7px 6px;border-top:1px solid #1d2a30;vertical-align:top}.tbn-tab td.d{text-align:right;white-space:nowrap}.tbn-th td{border-top:0;color:#778;letter-spacing:2px;font-size:.78em;padding:3px 6px}.tbn-th .tb-mut{letter-spacing:0}
        .tbn-tab td.s{width:25%}.tbn-tab .sm.vx,.tbn-tab b.vx{color:#FFB000}.tbn-tab tr.top{background:rgba(255,215,0,.06)}.tbn-tab tr.top td:first-child{color:#FFD54A}.tbn-tab td.win{background:rgba(47,224,122,.06)}.tbn-tab td.win b{color:#2fe07a}.tbn-tab .vx{color:#FFB000}.tbn-pt{display:inline-block;width:9px;height:9px;margin-right:7px}.tb-mut.sm{font-size:.82em;margin-top:2px}
        .tbn-bar{display:grid;grid-template-columns:120px 1fr 56px;gap:10px;align-items:center;margin:5px 0;font-size:.85em}.tbn-bar>div{height:12px;background:#0b1418;border:1px solid #1f3a44}.tbn-bar i{display:block;height:100%}.tbn-bar b{text-align:right;color:#fff;font-weight:normal}
    </style>`;

    // =================================================================================================
    //  SONS : un tintement par minerai qui entre dans le Rhino ; un petit air montant quand un transfert vers le vaisseau est termine.
    //  Joues sur TOUS les onglets du tableau de bord (appel depuis appliquer()), jamais au chargement de la page ; le haut-parleur du site les coupe (son.js).
    // =================================================================================================
    const SON = { prev: null, dt: null, ctx: null };
    function audio() {
        if (!SON.ctx) { try { SON.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
        try { if (SON.ctx.state === "suspended") SON.ctx.resume(); } catch (e) {}
        return SON.ctx.state === "running" ? SON.ctx : null;
    }
    function note(c, t, f, dur, vol, type) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = type || "sine"; o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
    }
    function sonMinerai(n) {                                    // n minerais arrives d'un coup : une petite cascade (8 au plus), un peu plus aigue a chaque fois
        const c = audio(); if (!c) return; const t0 = c.currentTime + 0.01;
        for (let i = 0; i < Math.min(n, 8); i++) { const f = 1180 + i * 70; note(c, t0 + i * 0.075, f, 0.16, 0.06, "sine"); note(c, t0 + i * 0.075, f * 1.5, 0.1, 0.025, "triangle"); }
    }
    function sonTransfert() {                                   // trois notes montantes : transfert termine
        const c = audio(); if (!c) return; const t0 = c.currentTime + 0.01;
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => { note(c, t0 + i * 0.11, f, 0.34, 0.07, "sine"); note(c, t0 + i * 0.11, f * 2, 0.2, 0.02, "triangle"); });
    }
    window.minageSons = function (st) {
        const mi = st && st.minage;
        if (!mi || !mi.rhino) { SON.prev = null; SON.dt = null; return; }
        const total = somme(mi.rhino.det), dt = mi.rhino.dt || null;
        if (SON.prev === null) { SON.prev = total; SON.dt = dt; return; }   // premier etat recu : on ne joue rien
        const prev = SON.prev, pdt = SON.dt; SON.prev = total; SON.dt = dt;
        if (total > prev) sonMinerai(total - prev);
        else if (total < prev && dt && dt !== pdt) sonTransfert();
    };

    window.minageHtml = function () {
        const v = vue(), rhino = v === "rhino";
        chercherCorps(); chercherPrix();
        const duo = rhino
            ? `<div class="tbn-duo"><div class="tbn-col">${cadreRhino()}</div>${fleche()}<div class="tbn-col">${cadreVaisseau()}</div></div>`
            : `<div class="tbn-duo deux"><div class="tbn-col">${cadreProspecteur()}</div><div class="tbn-col">${cadreVaisseau()}</div></div>`;
        const sans = !M() ? `<div class="bloc-note" style="margin-bottom:12px;">Aucun minage lu pour l'instant. Si vous minez déjà, mettez à jour le plugin SYS.EDTEAM (version 2.20 ou plus récente) et relancez EDMC : le minage apparaît ici tout seul.</div>` : "";
        if (!document.getElementById("tbn-css")) document.head.insertAdjacentHTML("beforeend", CSS);
        return selecteur(v) + sans + etape1(v) + etape2(v) + `<div class="tbn-bande"><span class="tbn-n">3</span>MINER ET TRANSFÉRER<em>suivi de session, soute du ${rhino ? "Rhino et du " : ""}vaisseau</em></div>` + chiffres(v) + duo + bilan(v);
    };
    // survol des caisses du Rhino (infobulle commune de la page) ; appele apres chaque affichage
    window.minageApres = function () {
        const sc = document.getElementById("tbn-scene"), tip = document.getElementById("tb-tip"); if (!sc || !tip) return;
        sc.addEventListener("mouseover", e => { const r = e.target.closest(".tbn-c"); if (!r) { tip.style.display = "none"; return; } const k = MIN.rhino[Number(r.dataset.i)]; tip.innerHTML = k ? `<b>${esc(nomMinerai(k))}</b> · 1 t` : "emplacement libre"; tip.style.display = "block"; });
        sc.addEventListener("mousemove", e => { tip.style.left = (e.clientX + 14) + "px"; tip.style.top = (e.clientY + 14) + "px"; });
        sc.addEventListener("mouseleave", () => { tip.style.display = "none"; });
        const a = document.getElementById("tbn-autre"); if (a && MIN.custom) { try { a.focus(); a.setSelectionRange(a.value.length, a.value.length); } catch (e) {} }
    };
})();
