// =====================================================================================================
//  HOLOGRAMME DES MODULES DU VAISSEAU (tableau de bord, onglet Missions) — plugin 2.18 (S.vaisseau.mods)
//  Meme rendu compact partout (Missions, Commerce, Minage) : coque seule ; la liste des modules (niveau d'ingenierie G1-G5 ou STOCK, plan, ingenieur) se deplie avec le bouton MODULES
//  et le survol d'une ligne allume le module dans la coque (anneau pour les modules hors compartiments) ;
//  modules OPTIONNELS = compartiments dans la coque, proportionnels a la taille de l'emplacement (rendu « scanner infrarouge », decoupes par la coque),
//  types regroupes (divers au nez, cabines, racks de soute a l'arriere), petits modules par paires sur les flancs ; passagers qui se baladent dans les cabines,
//  caisses dans les racks ; infobulle (detail + ingenierie) au survol d'un compartiment. Noms de modules en anglais (donnees Coriolis : modules-data.js).
//  Depend des variables de la page : S, SILHOUETTES, silhouetteActive, esc, fmtN, COUL_MARCH, nomVaisseau, PAS_FAM, famPassagers, estPassagers (resolues a l'appel).
//  Les positions des modules dans la coque sont STYLISEES : le jeu ne les donne pas.
// =====================================================================================================
(function () {
    "use strict";
    const D = () => window.EDTEAM_MODULES || { n: {}, bp: {}, sp: {} };
    const LET = { 1: "E", 2: "D", 3: "C", 4: "B", 5: "A" };
    const CLASSE = { 1: "Economy", 2: "Business", 3: "First Class", 4: "Luxury" };
    // places d'une cabine standard (taille-classe) ; Mk II = 1,5 x (arrondi a l'inferieur)
    const STD = { "2-1": 2, "3-1": 4, "4-1": 8, "5-1": 16, "6-1": 32, "3-2": 3, "4-2": 6, "5-2": 10, "6-2": 16, "4-3": 3, "5-3": 6, "6-3": 12, "5-4": 4, "6-4": 8 };
    const ARMURES = { grade1: "Lightweight Alloy", grade2: "Reinforced Alloy", grade3: "Military Grade Composite", mirrored: "Mirrored Surface Composite", reactive: "Reactive Surface Composite" };
    const CAP_RACK = { 1: 2, 2: 4, 3: 8, 4: 16, 5: 32, 6: 64, 7: 128, 8: 256 };
    const CORE = ["PowerPlant", "MainEngines", "FrameShiftDrive", "LifeSupport", "PowerDistributor", "Radar", "FuelTank", "Armour"];
    const IGNORE = /^(Decal|ShipName|ShipID|PaintJob|VesselVoice|Bobble|Nameplate|WeaponColour|EngineColour|ShipKit|ShipCockpit|CargoHatch|Hologram)/;
    const categorie = slot => CORE.indexOf(slot) >= 0 ? "core" : /^TinyHardpoint/.test(slot) ? "util" : /^(Small|Medium|Large|Huge)Hardpoint/.test(slot) ? "arme"
        : /^(Slot\d+_Size\d+|Military\d+|Passenger\d+|Cargo\d+|PlanetaryApproachSuite)$/.test(slot) ? "opt" : "autre";
    const cap1 = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    const humain = l => String(l || "").replace(/^DefenceModifier/, "").replace(/([a-z])([A-Z])/g, "$1 $2").trim();
    const bpNom = b => (D().bp[b]) || cap1(String(b || "").split("_").slice(1).join(" ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase());
    const spNom = x => !x ? "" : (D().sp[x]) || cap1(String(x).replace(/^special_/, "").replace(/_/g, " "));
    const ini = n => String(n).split(" ").filter(w => /^[A-Za-z]{2,}/.test(w)).map(w => w.charAt(0).toUpperCase()).join("").slice(0, 4);

    function tailleSlot(slot, item) {
        let m = String(slot).match(/_Size(\d)/); if (m) return +m[1];
        if (/^(Passenger|Cargo|Military)\d+$/.test(slot)) { m = String(item).match(/_size(\d)/); return m ? +m[1] : 0; }
        if (slot === "PlanetaryApproachSuite") return 1;
        m = String(slot).match(/^(Small|Medium|Large|Huge)Hardpoint/); if (m) return { Small: 1, Medium: 2, Large: 3, Huge: 4 }[m[1]];
        return 0;
    }
    function placesCabine(item) {
        const m = String(item).toLowerCase().match(/^int_(mkii_)?passengercabin_size(\d)_class(\d)$/); if (!m) return 0;
        const b = STD[m[2] + "-" + m[3]] || 0; return m[1] ? Math.floor(b * 1.5) : b;
    }
    // nom anglais d'un module (identifiant du journal -> libelle) ; module inconnu = identifiant humanise
    function nomModule(item) {
        const k = String(item || "").toLowerCase(), t = D().n[k], ms = k.match(/_size(\d)/), mc = k.match(/_class(\d)/), size = ms ? +ms[1] : 0, cls = mc ? +mc[1] : 0;
        let m = k.match(/^int_(mkii_)?passengercabin_size(\d)_class(\d)$/);
        if (m) return (CLASSE[+m[3]] || "Passenger") + " Passenger Cabin" + (m[1] ? " Mk II" : "") + " " + m[2] + (LET[+m[3]] || "");
        m = k.match(/^int_engine_size(\d)_class(\d)(_fast)?$/); if (m) return (m[3] ? "Enhanced Performance " : "") + "Thrusters " + m[1] + (LET[+m[2]] || "");
        if (/fighterbay/.test(k)) return "Fighter Hangar " + size + (LET[cls] || "");
        if (/cargorack/.test(k)) return (/large/.test(k) ? "Large " : /corrosion/.test(k) ? "Corrosion Resistant " : "") + "Cargo Rack " + size + (LET[cls] || "E");
        m = k.match(/_armour_(\w+)$/); if (m && ARMURES[m[1]]) return ARMURES[m[1]];
        if (t) { const sz = t[1] > 0 ? t[1] : "", r = t[1] > 0 || /^[A-E]$/.test(t[2]) ? (t[2] || "") : ""; return (t[0] + " " + sz + r).replace(/\s+$/, ""); }
        const base = cap1(k.replace(/^(int|hpt)_/, "").replace(/_size\d.*$/, "").replace(/_class\d.*$/, "").replace(/_/g, " "));
        return base + (size ? " " + size + (LET[cls] || "") : "");
    }

    // ---- liste des modules a afficher (plugin 2.18) + emplacements VIDES d'apres la liste de reference du vaisseau (sil.ref)
    function preparer(v, sil) {
        const L = [];
        (v.mods || []).forEach(m => {
            const c = categorie(m.s); if (c === "autre" || IGNORE.test(m.s)) return;
            const item = String(m.i || ""), o = { slot: m.s, item, nom: nomModule(item), cat: c, taille: tailleSlot(m.s, item), places: placesCabine(item), rack: /cargorack/.test(item) ? 1 : 0, on: m.o !== 0 };
            if (m.g) o.eng = { niv: m.g, bp: bpNom(m.b), exp: spNom(m.x), par: m.e || "", mods: (m.m || []).map(x => ({ l: humain(x[0]), o: x[1], v: x[2], moins: !!x[3] })) };
            L.push(o);
        });
        (sil.ref || []).forEach(r => { if (!L.some(m => m.slot === r[0])) L.push({ slot: r[0], item: "", nom: "Empty", cat: r[1], taille: r[2], places: 0, rack: 0, on: false, vide: true }); });
        return L;
    }

    const etiqSlot = s => String(s).replace(/([a-z])(\d)/, "$1 $2").replace(/Hardpoint/, /^Tiny/.test(s) ? " utility mount" : " hardpoint").replace(/^Tiny /, "").replace(/_Size(\d)/, " (size $1)");
    const fmt = x => { const n = Number(x); return Math.abs(n) >= 100 ? n.toFixed(0) : Math.abs(n) >= 10 ? n.toFixed(1) : String(+n.toFixed(2)); };
    function detail(m, nAb, E) {
        let h = `<b style="color:#fff;font-size:13px">${E(m.nom)}</b><div style="color:#8b97a0">${E(etiqSlot(m.slot))}${/_Size/.test(m.slot) ? "" : " · size " + m.taille}${m.on ? "" : " · OFF"}</div>`;
        if (m.vide) return h + `<div style="margin-top:6px;color:#8b97a0">Empty slot</div>`;
        if (m.places) h += `<div style="margin-top:6px;color:#FFB44D">${m.places} seats · ${nAb} passengers aboard</div>`;
        if (m.rack) h += `<div style="margin-top:6px;color:#7fe9ff">Capacity ${CAP_RACK[m.taille] || "?"} t</div>`;
        if (m.eng) {
            const e = m.eng; h += `<div style="margin-top:6px;color:#FFD54A"><b>Engineered G${e.niv}</b> · ${E(e.bp)}</div>` + (e.exp ? `<div style="color:#FFB44D">${E(e.exp)}</div>` : "") + (e.par ? `<div style="color:#8b97a0">by ${E(e.par)}</div>` : "");
            h += `<div style="margin-top:5px">` + e.mods.map(x => { const up = Number(x.v) > Number(x.o), dn = Number(x.v) < Number(x.o), bon = (up && !x.moins) || (dn && x.moins); return `<div style="color:${up || dn ? (bon ? "#3DDC97" : "#FF6B5E") : "#9fb0b8"}">${E(x.l)} ${fmt(x.o)} → ${fmt(x.v)}</div>`; }).join("") + `</div>`;
        } else h += `<div style="margin-top:6px;color:#9fb0b8">Stock module (not engineered)</div>`;
        return h;
    }

    // infobulle : un seul ecouteur pour toute la page (la zone est recreee a chaque affichage)
    window.__tbmDet = [];
    window.tbmNomModule = nomModule;     // nom anglais d'un module (identifiant du journal -> libelle) : sert aussi a l'onglet Combat (armement)
    function tip() { let t = document.getElementById("tbm-tip"); if (!t) { t = document.createElement("div"); t.id = "tbm-tip"; document.body.appendChild(t); } return t; }
    if (!window.__tbmInit) {
        window.__tbmInit = true;
        document.addEventListener("mouseover", e => { const h = e.target.closest && e.target.closest(".tbm-hit"); const t = tip(); if (!h) { t.style.display = "none"; return; } t.innerHTML = window.__tbmDet[+h.dataset.d] || ""; t.style.display = "block"; });
        document.addEventListener("mousemove", e => { const t = tip(); if (t.style.display === "block") { t.style.left = Math.min(e.clientX + 16, innerWidth - 350) + "px"; t.style.top = Math.min(e.clientY + 16, innerHeight - 60) + "px"; } });
    }

    // bouton MODULES (replie / deplie, memorise) et survol : une ligne de la liste (ou un compartiment) allume le module correspondant
    if (!window.__tbmLgInit) {
        window.__tbmLgInit = true;
        document.addEventListener("click", e => {
            const b = e.target.closest && e.target.closest("[data-tbmlg]"); if (!b) return;
            const bloc = b.closest(".tbm-bloc"), lg = bloc && bloc.querySelector(".tbm-lg"); if (!lg) return;
            const ouvre = lg.hidden; lg.hidden = !ouvre; b.classList.toggle("on", ouvre); b.textContent = "MODULES " + (ouvre ? "▴" : "▾");
            try { localStorage.setItem("tbm_liste", ouvre ? "1" : "0"); } catch (x) {}
        });
        let cur = null;
        const eteint = () => { if (cur) { cur.bloc.querySelectorAll(".tbm-on").forEach(el => el.classList.remove("tbm-on")); cur = null; } };
        document.addEventListener("mouseover", e => {
            const h = e.target.closest && e.target.closest(".tbm-r, .tbm-hit"), bloc = h && h.closest(".tbm-bloc"), s = h && h.dataset.s;
            if (!bloc || !s) { eteint(); return; }
            if (cur && cur.bloc === bloc && cur.s === s) return;
            eteint(); cur = { bloc, s };
            bloc.querySelectorAll("[data-s]").forEach(el => { if (el.dataset.s === s) el.classList.add("tbm-on"); });
        });
    }

    // ---- AMBIANCE SONORE : ouvriers d'un depot quand il y a des caisses, brouhaha et rires de cabine quand il y a des passagers
    // Tout est synthetise (WebAudio) : aucun fichier, aucune requete. Passe par la sortie generale (son.js) : le haut-parleur du pied de page la coupe aussi.
    // Ne demarre qu'apres un clic sur la page (regle des navigateurs), s'arrete si l'onglet est cache ou si l'hologramme n'est plus affiche.
    const AMB = window.__tbmAmb = window.__tbmAmb || { ctx: null, c: false, p: 0, geste: false, timer: null, out: null };
    const ambActive = () => { try { return localStorage.getItem("tbm_ambiance") !== "0"; } catch (e) { return true; } };
    const rnd = (a, b) => a + Math.random() * (b - a);
    // les navigateurs interdisent tout son avant un premier clic (ou une touche) dans la page : un petit indice previent quand un son est BLOQUE pour cette raison
    function ambIndice(afficher) {
        try {
            let el = document.getElementById("tbm-indice");
            if (!afficher) { if (el) el.remove(); return; }
            if (el || Date.now() - (AMB.indiceT || 0) < 45000) return;      // deja visible, ou montre il y a moins de 45 s
            AMB.indiceT = Date.now();
            el = document.createElement("div"); el.id = "tbm-indice"; el.textContent = "🔇 Sons en attente · cliquez une fois sur la page pour les activer";
            el.style.cssText = "position:fixed;right:18px;bottom:18px;z-index:9999;max-width:320px;padding:9px 14px;background:rgba(3,8,12,.95);border:1px solid #FF9A1F;color:#FFB44D;font:12px/1.4 inherit;letter-spacing:1px;cursor:pointer;box-shadow:0 0 14px rgba(255,154,31,.35)";
            el.onclick = () => el.remove();
            document.body.appendChild(el); setTimeout(() => { if (el.parentNode) el.remove(); }, 15000);
        } catch (e) { /* un indice ne doit jamais gener la page */ }
    }
    function ambEnv(g, t, a, d, pk) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(pk, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
    function ambBruit() { const c = AMB.ctx; if (!AMB.buf) { const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; AMB.buf = b; } const n = c.createBufferSource(); n.buffer = AMB.buf; n.loop = true; return n; }
    function ambPan(c, dest) { const g = c.createGain(); let nd = g; if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = rnd(-0.8, 0.8); g.connect(p); nd = p; } nd.connect(dest); return g; }
    function ambClang() { const c = AMB.ctx, t = c.currentTime + 0.02, f0 = rnd(380, 1300), g = ambPan(c, AMB.out); ambEnv(g, t, 0.003, rnd(0.25, 0.7), rnd(0.03, 0.07)); [1, 2.76, 5.4, 8.9].forEach((m, i) => { const o = c.createOscillator(), gi = c.createGain(); o.type = "sine"; o.frequency.value = f0 * m * (1 + rnd(-0.01, 0.01)); gi.gain.value = 1 / (i + 1); o.connect(gi); gi.connect(g); o.start(t); o.stop(t + 1); }); }
    function ambCoup() { const c = AMB.ctx, t = c.currentTime + 0.02, g = ambPan(c, AMB.out), n = ambBruit(), lp = c.createBiquadFilter(), o = c.createOscillator(); lp.type = "lowpass"; lp.frequency.value = rnd(200, 600); ambEnv(g, t, 0.004, 0.12, rnd(0.06, 0.1)); n.connect(lp); lp.connect(g); n.start(t); n.stop(t + 0.2); o.frequency.setValueAtTime(rnd(110, 160), t); o.frequency.exponentialRampToValueAtTime(45, t + 0.15); o.connect(g); o.start(t); o.stop(t + 0.2); }
    function ambBip() { const c = AMB.ctx, t = c.currentTime + 0.02, g = ambPan(c, AMB.out); g.gain.setValueAtTime(0.0001, t); for (let i = 0; i < 4; i++) { g.gain.setValueAtTime(0.03, t + i * 0.28); g.gain.setValueAtTime(0.0001, t + i * 0.28 + 0.14); } const o = c.createOscillator(); o.type = "square"; o.frequency.value = 1000; o.connect(g); o.start(t); o.stop(t + 1.2); }
    const VOY = [[800, 1200], [500, 1800], [300, 2300], [500, 900], [320, 800]];
    function ambVoix(g, t, f0, fo, dur, pk) { const c = AMB.ctx, o = c.createOscillator(), a = c.createBiquadFilter(), b = c.createBiquadFilter(), ga = c.createGain(), gb = c.createGain(); o.type = "sawtooth"; o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f0 * rnd(0.88, 1.12), t + dur); a.type = b.type = "bandpass"; a.frequency.value = fo[0]; b.frequency.value = fo[1]; a.Q.value = b.Q.value = 7; ga.gain.value = 1; gb.gain.value = 0.6; o.connect(a); o.connect(b); a.connect(ga); b.connect(gb); const e = c.createGain(); ga.connect(e); gb.connect(e); ambEnv(e, t, 0.02, dur, pk); e.connect(g); o.start(t); o.stop(t + dur + 0.1); }
    function ambPhrase() { const c = AMB.ctx, g = ambPan(c, AMB.out), f0 = Math.random() < 0.5 ? rnd(105, 145) : rnd(190, 260); let t = c.currentTime + 0.02; for (let i = 0, n = 3 + Math.floor(Math.random() * 5); i < n; i++) { const d = rnd(0.08, 0.17); ambVoix(g, t, f0 * rnd(0.9, 1.15), VOY[Math.floor(Math.random() * VOY.length)], d, rnd(0.02, 0.04)); t += d + rnd(0.03, 0.09); } }
    function ambRire() { const c = AMB.ctx, g = ambPan(c, AMB.out), f0 = rnd(230, 330); let t = c.currentTime + 0.02; for (let i = 0, n = 4 + Math.floor(Math.random() * 4); i < n; i++) { ambVoix(g, t, f0 * (1 - i * 0.04), VOY[0], 0.09, 0.05 * (1 - i * 0.1)); t += 0.14 + rnd(0, 0.03); } }
    // vraies ambiances enregistrees (fichiers du dossier sons/, lus en BOUCLE sans coupure) ; a defaut de fichier, repli sur la synthese ci-dessus
    const AMB_FICHIERS = { depot: "sons/ambiance-depot", cabine: "sons/ambiance-cabine", combat: "sons/ambiance-combat" };
    const AMB_NIVEAU = { depot: 0.45, cabine: 0.7, combat: 0.8, annonce: 0.5 };
    // dosage quand plusieurs ambiances jouent : les passagers passent devant, les caisses restent en fond
    const ambNiv = k => AMB_NIVEAU[k] * (k === "depot" && AMB.p > 0 ? 0.45 : k === "cabine" && AMB.c ? 1.15 : 1);
    const AMB_COUPE = { cabine: 300 };   // filtre passe-haut (Hz) : retire le grondement de fond (moteur) des enregistrements de cabine
    function ambCharge(k) {
        const L = AMB.fich = AMB.fich || {}; if (k in L) return;
        L[k] = null;   // chargement en cours
        const essai = ext => fetch(AMB_FICHIERS[k] + "." + ext).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); });
        essai("ogg").catch(() => essai("mp3")).then(ab => new Promise((ok, ko) => AMB.ctx.decodeAudioData(ab, ok, ko))).then(buf => { L[k] = buf; ambSync(); }).catch(() => { L[k] = false; });
    }
    // annonces de la cabine (sons/annonce-1 ... annonce-6, voix de synthese claires) : une au hasard toutes les 50 a 110 s par-dessus la boucle
    function ambChargeAnnonces() {
        if (AMB.ann) return; AMB.ann = [];
        for (let i = 1; i <= 6; i++) {
            const essai = ext => fetch("sons/annonce-" + i + "." + ext).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); });
            essai("ogg").catch(() => essai("mp3")).then(ab => new Promise((ok, ko) => AMB.ctx.decodeAudioData(ab, ok, ko))).then(b => { AMB.ann.push(b); }).catch(() => {});
        }
    }
    // une annonce passee par l'« interphone de vaisseau » (utilisee par les annonces de cabine ET par les annonces d'embarquement / de debarquement) : t0 = instant de depart, dest = sortie
    // annonces en cours ou programmees, avec PRIORITE : 1 = annonce de la cabine en vol, 2 = embarquement / debarquement, 3 = saut hyperespace. Une annonce coupe (fondu tres court) toutes celles de priorite
    // INFERIEURE ; chaque annonce a son propre « bus » pour pouvoir etre coupee d'un bloc. annoncesCoupe renvoie l'instant (horloge audio) ou se termine la derniere annonce restante.
    const ANN_ACTIVES = [];
    function annoncesCoupe(c, prio) {
        const t = c.currentTime; let reste = 0;
        ANN_ACTIVES.splice(0).forEach(a => {
            if (a.fin < t) return;
            if (a.prio >= prio) { ANN_ACTIVES.push(a); reste = Math.max(reste, a.fin); return; }
            try { a.bus.gain.cancelScheduledValues(t); a.bus.gain.setValueAtTime(a.bus.gain.value, t); a.bus.gain.linearRampToValueAtTime(0, t + 0.12); a.src.stop(t + 0.2); } catch (e) {}
        });
        return reste;
    }
    function ambAnnonceJoue(c, b, t0, niveau, destSortie, fondu, prio) {
        const bus = c.createGain(), dest = bus; bus.connect(destSortie); ANN_ACTIVES.push({ bus, src: null, fin: t0 + b.duration + 0.5, prio: prio || 1 });
        const src = c.createBufferSource(), g = c.createGain(); ANN_ACTIVES[ANN_ACTIVES.length - 1].src = src;
        src.buffer = b; g.gain.value = niveau;
        // effet « interphone de vaisseau » : bande telephonique, legere saturation, souffle de fond, claquements de debut et de fin
        const hp = c.createBiquadFilter(), lp = c.createBiquadFilter(), ws = c.createWaveShaper(), cv = new Float32Array(257); hp.type = "highpass"; hp.frequency.value = 380; lp.type = "lowpass"; lp.frequency.value = 3300; hp.Q.value = 0.9;
        for (let i = 0; i < 257; i++) { const x = i / 128 - 1; cv[i] = Math.tanh(x * 2.2) / Math.tanh(2.2); } ws.curve = cv;
        // un peu de salle (reverbe) et un son plus lointain : l'annonce vient du plafond, elle ne parle pas dans la tete
        if (!AMB.ir) { const n = Math.floor(c.sampleRate * 1.4), ir = c.createBuffer(2, n, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); } AMB.ir = ir; }
        const cv2 = c.createConvolver(), sec = c.createGain(), hum = c.createGain(); cv2.buffer = AMB.ir; sec.gain.value = 0.7; hum.gain.value = 0.55;
        lp.frequency.value = 2900;
        src.connect(hp); hp.connect(ws); ws.connect(lp); lp.connect(sec); sec.connect(g); lp.connect(cv2); cv2.connect(hum); hum.connect(g); g.connect(dest);
        const d = b.duration;
        const bruit = (t, dur, f, pk) => { const n = ambBruit(), bp = c.createBiquadFilter(), e = c.createGain(); bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = 0.8; n.connect(bp); bp.connect(e); e.connect(dest); e.gain.setValueAtTime(0.0001, t); e.gain.linearRampToValueAtTime(pk, t + 0.008); e.gain.setValueAtTime(pk, t + Math.max(dur - 0.02, 0.01)); e.gain.exponentialRampToValueAtTime(0.0001, t + dur); n.start(t); n.stop(t + dur + 0.05); };
        bruit(t0 - 0.1, 0.07, 2200, 0.04);               // clic d'ouverture du micro
        bruit(t0 - 0.03, d + 0.1, 3800, 0.008);          // souffle de la ligne pendant l'annonce
        if (fondu) { g.gain.setValueAtTime(niveau, t0 + Math.max(d - fondu, 0)); g.gain.linearRampToValueAtTime(0.0001, t0 + d + 0.25); }     // fin douce (annonces d'embarquement), sans clic de fermeture
        else bruit(t0 + d + 0.05, 0.09, 1800, 0.035);          // clic de fermeture
        src.start(t0);
        return b.duration;
    }
    function ambAnnonce() {
        if (!AMB.ann || !AMB.ann.length || AMB.p <= 0 || AMB.k) return;
        const maintenant = Date.now(); if (!AMB.annT) AMB.annT = maintenant + rnd(12, 25) * 1000;
        if (maintenant < AMB.annT) return;
        const c = AMB.ctx, b = AMB.ann[Math.floor(Math.random() * AMB.ann.length)];
        const d = ambAnnonceJoue(c, b, c.currentTime + 0.12, AMB_NIVEAU.annonce, AMB.out);
        AMB.annFin = c.currentTime + 0.12 + d;     // instant (horloge audio) ou cette annonce de la boucle se termine
        AMB.annT = maintenant + d * 1000 + rnd(50, 110) * 1000;
    }
    // ---- SONS D'EVENEMENTS, joues UNE fois : embarquement / debarquement de passagers (mission de transport ou de tourisme), chargement / dechargement de la soute.
    // Fichiers du dossier sons/ (un fichier absent est simplement ignore). Detectes en comparant deux etats successifs de la session : rien n'est joue a l'ouverture de la page.
    // Embarquement ET debarquement : signal de quai, portes, pas, puis une annonce au hasard (voix-bienvenue-N a l'embarquement, voix-aurevoir-N au debarquement).
    const EVT = { p: {}, out: null, der: {}, prev: null, vus: new Set(), log: window.tbmSonsLog = window.tbmSonsLog || [] };     // vus = missions deja annoncees (jamais deux fois la meme) ; log = trace des declenchements
    // facteurs RELATIFS : 1 = meme volume que la boucle de reference (cabine pour le signal, les portes et les pas ; annonces de cabine pour les voix ; depot pour les caisses)
    const EVT_NIVEAU = window.tbmNiveaux = window.tbmNiveaux || { signal: 1, portes: 0.8, pas: 0.5, voix: 1, soute: 1, applaudissements: 1, cris: 1.2, echappe: 1, photos: 1.3 };     // reglable a chaud dans la console : tbmNiveaux.signal = 0.7
    function evtCtx() {
        if (!AMB.geste && ambActive() && !document.hidden) ambIndice(true);     // son bloque faute de clic : on previent
        if (!AMB.geste || !ambActive() || document.hidden) return null;     // meme regles que l'ambiance : apres un clic, onglet visible, bouton ON
        if (!AMB.ctx) { try { AMB.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
        const c = AMB.ctx; if (c.state === "suspended") c.resume();
        if (!EVT.out) { EVT.out = c.createGain(); EVT.out.gain.value = 0.8; EVT.out.connect(c.destination); }
        return c;
    }
    function evtCharge(nom, c) {
        if (!(nom in EVT.p)) {
            const essai = ext => fetch("sons/" + nom + "." + ext).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); });
            EVT.p[nom] = essai("mp3").catch(() => essai("ogg")).then(ab => new Promise((ok, ko) => c.decodeAudioData(ab, ok, ko))).catch(() => null);
        }
        return EVT.p[nom];
    }
    function evtVoix(prefixe, c) { return Promise.all([1, 2, 3, 4].map(i => evtCharge(prefixe + "-" + i, c))).then(L => L.filter(Boolean)); }
    // volume « actif » d'un son (moyenne quadratique des parties non silencieuses) : sert a ramener chaque fichier au meme volume percu que la boucle de reference
    function rmsActif(buf) {
        if (buf._rms) return buf._rms;
        const d = buf.getChannelData(0); let somme = 0, n = 0;
        for (let i = 0; i < d.length; i++) { const x = d[i]; if (x > 0.01 || x < -0.01) { somme += x * x; n++; } }
        return buf._rms = n ? Math.sqrt(somme / n) : 0.1;
    }
    // niveau a appliquer a 'buf' pour qu'il sonne aussi fort que 'ref' lu au niveau 'cible' ; sans reference chargee, on garde le niveau brut
    function evtNiveau(buf, ref, cible, facteur) {
        if (!buf || !ref) return cible * facteur;
        return Math.max(0.05, Math.min(2.5, cible * facteur * rmsActif(ref) / rmsActif(buf)));
    }
    function evtDoux(c, buf, t, niveau, fin) {     // joue le son en entier, debut et fin en fondu ; renvoie sa duree
        const src = c.createBufferSource(), g = c.createGain(), d = buf.duration, f = Math.max(0.1, Math.min(fin, d - 0.4));
        src.buffer = buf; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(niveau, t + 0.15);
        const courbe = new Float32Array(48); for (let i = 0; i < 48; i++) courbe[i] = Math.max(0.0001, niveau * (0.5 + 0.5 * Math.cos(Math.PI * i / 47)));     // decroissance douce, sans coupure audible
        g.gain.setValueCurveAtTime(courbe, t + d - f, f);
        src.connect(g); g.connect(EVT.out); src.start(t); return d;
    }
    function evtJouer(type, force) {
        const maintenant = Date.now(), soute = type === "chargement" || type === "dechargement";
        if (!force && EVT.der[type] && maintenant - EVT.der[type] < (soute ? 45000 : type === "applaudissements" || type === "vente" || type === "interception" ? 60000 : 15000)) return;     // pas deux fois de suite
        const c = evtCtx(); if (!c) return;
        EVT.der[type] = maintenant;
        if (type === "interception") {     // debut de l'interception (mini-jeu) : annonce du pilote en anglais (voix-interception-N), cris des passagers en dessous
            annoncesCoupe(c, 3);     // prioritaire sur toute annonce en cours
            AMB.annT = Math.max(AMB.annT || 0, maintenant + 60000);
            Promise.all([evtVoix("voix-interception", c), evtCharge("interception-capture-1", c), evtCharge("ambiance-cabine", c), evtCharge("annonce-1", c)]).then(([vx, cr, refC, refA]) => {
                const t0 = c.currentTime + 0.2;
                if (cr) evtDoux(c, cr, t0, evtNiveau(cr, refC, AMB_NIVEAU.cabine, EVT_NIVEAU.cris), 2.5);
                if (vx.length) {
                    const v = vx[Math.floor(Math.random() * vx.length)];
                    ambAnnonceJoue(c, v, t0 + 0.3, evtNiveau(v, refA, AMB_NIVEAU.annonce, EVT_NIVEAU.voix), EVT.out, 0.7, 3);
                    AMB.annFin = t0 + 0.3 + v.duration;
                    AMB.annT = Math.max(AMB.annT, Date.now() + (v.duration + 25) * 1000);
                }
            });
            return;
        }
        if (type === "vente") {     // vente au marche de la station : appel du responsable du marche (voix-marche-N), puis le responsable de la soute a l'interphone (voix-vendu-N, ou voix-vendu-blague-N une fois sur quatre)
            Promise.all([evtVoix("voix-marche", c), evtVoix("voix-vendu", c), evtVoix("voix-vendu-blague", c), evtCharge("annonce-1", c)]).then(([mq, vd, bl, refA]) => {
                const niv = v => evtNiveau(v, refA, AMB_NIVEAU.annonce, EVT_NIVEAU.voix), choix = L => L[Math.floor(Math.random() * L.length)];
                let t = c.currentTime + 0.4;
                if (mq.length) { const m = choix(mq), reste = annoncesCoupe(c, 2); t = Math.max(t, reste + 0.5); ambAnnonceJoue(c, m, t, niv(m), EVT.out, 0.7, 2); t += m.duration + rnd(3, 5); }
                const L = bl.length && (!vd.length || Math.random() < 0.25) ? bl : vd;
                if (L.length) { const v = choix(L); ambAnnonceJoue(c, v, t, niv(v), EVT.out, 0.7, 2); t += v.duration; }
                AMB.annT = Math.max(AMB.annT || 0, Date.now() + (t - c.currentTime + 20) * 1000);
            });
            return;
        }
        if (type === "balise") {     // balise de tourisme scannee : appareils photo et passagers excites (balise-photos-N, plus forts que l'ambiance de vol), puis annonce d'arrivee (voix-balise-N)
            annoncesCoupe(c, 3);
            AMB.annT = Math.max(AMB.annT || 0, maintenant + 60000);
            Promise.all([evtVoix("balise-photos", c), evtVoix("voix-balise", c), evtCharge("ambiance-cabine", c), evtCharge("annonce-1", c)]).then(([ph, vx, refC, refA]) => {
                const t0 = c.currentTime + 0.2;
                if (ph.length) { const b = ph[Math.floor(Math.random() * ph.length)]; evtDoux(c, b, t0, evtNiveau(b, refC, AMB_NIVEAU.cabine, EVT_NIVEAU.photos), 3); }
                if (vx.length) {
                    const v = vx[Math.floor(Math.random() * vx.length)], tv = t0 + 1.5;
                    ambAnnonceJoue(c, v, tv, evtNiveau(v, refA, AMB_NIVEAU.annonce, EVT_NIVEAU.voix), EVT.out, 0.7, 3);
                    AMB.annFin = tv + v.duration;
                    AMB.annT = Math.max(AMB.annT || 0, Date.now() + (tv - c.currentTime + v.duration + 25) * 1000);
                }
            });
            return;
        }
        if (type === "echappe") {     // interception reussie : soulagement des passagers
            annoncesCoupe(c, 3);     // l'annonce du debut (si elle dure encore) laisse la place a celle-ci
            AMB.annT = Math.max(AMB.annT || 0, maintenant + 60000);
            Promise.all([evtCharge("interception-echappe-1", c), evtVoix("voix-securite", c), evtCharge("ambiance-cabine", c), evtCharge("annonce-1", c)]).then(([b, vx, refC, refA]) => {
                const t0 = c.currentTime + 0.2;
                if (b) evtDoux(c, b, t0, evtNiveau(b, refC, AMB_NIVEAU.cabine, EVT_NIVEAU.echappe), 2.5);
                if (vx.length) {     // annonce « nous sommes en securite, vous pouvez circuler » (voix-securite-N), apres le soulagement
                    const v = vx[Math.floor(Math.random() * vx.length)], tv = t0 + (b ? Math.min(b.duration * 0.5, 2.5) : 0.3);
                    ambAnnonceJoue(c, v, tv, evtNiveau(v, refA, AMB_NIVEAU.annonce, EVT_NIVEAU.voix), EVT.out, 0.7, 3);
                    AMB.annFin = tv + v.duration;
                    AMB.annT = Math.max(AMB.annT, Date.now() + (tv - c.currentTime + v.duration + 25) * 1000);
                }
            });
            return;
        }
        if (type === "applaudissements") {     // le vaisseau vient de se poser avec des passagers a bord : un des deux enregistrements au hasard
            Promise.all([evtCharge("applaudissements-1", c), evtCharge("applaudissements-2", c), evtCharge("ambiance-cabine", c)]).then(([a1, a2, ref]) => {
                const L = [a1, a2].filter(Boolean); if (!L.length) return;
                const b = L[Math.floor(Math.random() * L.length)];
                evtDoux(c, b, c.currentTime + 0.3, evtNiveau(b, ref, AMB_NIVEAU.cabine, EVT_NIVEAU.applaudissements), 2.5);
            });
            return;
        }
        if (soute) {
            Promise.all([evtCharge(type, c), evtCharge("ambiance-depot", c), type === "chargement" ? evtVoix("voix-soute", c) : [], evtCharge("annonce-1", c)]).then(([b, ref, vx, refA]) => {
                const t0 = c.currentTime + 0.1;
                if (b) evtDoux(c, b, t0, evtNiveau(b, ref, AMB_NIVEAU.depot, EVT_NIVEAU.soute), 3.5);
                // le vieux veteran de la soute (voix-soute-N, en anglais) : « c'est charge, commandant » + une blague, une fois sur deux, quand les caisses sont rangees
                if (vx.length && (force || Math.random() < 0.5)) {
                    const v = vx[Math.floor(Math.random() * vx.length)], reste = annoncesCoupe(c, 2), tv = Math.max(t0 + (b ? Math.max(b.duration - 2, 1.5) : 0.5), reste + 0.6);
                    ambAnnonceJoue(c, v, tv, evtNiveau(v, refA, AMB_NIVEAU.annonce, EVT_NIVEAU.voix), EVT.out, 0.7, 2);
                    AMB.annT = Math.max(AMB.annT || 0, Date.now() + (tv - c.currentTime + v.duration + 20) * 1000);
                }
            });
            return;
        }
        const voix = type === "embarquement" ? "voix-bienvenue" : "voix-aurevoir";
        AMB.annT = Math.max(AMB.annT || 0, maintenant + 40000);     // l'annonce de la boucle de cabine ne se declenche pas pendant la sequence (affine plus bas, quand la duree de l'annonce est connue)
        Promise.all([evtCharge("embarquement-signal", c), evtCharge("embarquement-portes", c), evtCharge("embarquement-pas", c), evtVoix(voix, c), evtCharge("ambiance-cabine", c), evtCharge("annonce-1", c)]).then(([sg, po, pa, vx, refC, refA]) => {
            const nv = (b, f) => evtNiveau(b, refC, AMB_NIVEAU.cabine, f);
            const t0 = c.currentTime + 0.1; let tPortes = t0, tPas;
            if (sg) { evtDoux(c, sg, t0, nv(sg, EVT_NIVEAU.signal), 1.8); tPortes = t0 + Math.max(sg.duration - 1.0, 1.2); }     // les portes s'ouvrent quand le signal se termine
            if (po) { evtDoux(c, po, tPortes, nv(po, EVT_NIVEAU.portes), 1.8); tPas = tPortes + Math.min(po.duration * 0.5, 2.5); } else tPas = tPortes;     // les gens avancent pendant l'ouverture
            if (pa) evtDoux(c, pa, tPas, nv(pa, EVT_NIVEAU.pas), 5);
            if (vx.length) {
                const reste = annoncesCoupe(c, 2);     // prioritaire sur les annonces de la cabine en vol (coupees) ; une annonce de saut hyperespace en cours, elle, passe avant : on attend sa fin
                AMB.annFin = reste;
                const v = vx[Math.floor(Math.random() * vx.length)], tVoix = Math.max(tPas + 1.5, reste + 0.6);
                ambAnnonceJoue(c, v, tVoix, evtNiveau(v, refA, AMB_NIVEAU.annonce, EVT_NIVEAU.voix), EVT.out, 0.7, 2);
                AMB.annT = Math.max(AMB.annT || 0, Date.now() + (tVoix - c.currentTime + v.duration + 20) * 1000);     // la boucle reprend ses annonces 20 s apres la fin de celle-ci
            }
        });
    }
    // ---- ANNONCE DE SAUT HYPERESPACE (missions de passagers / tourisme seulement) : l'interphone previent les passagers pendant les ~18 s du saut, avec une alarme legere en fond.
    // Fichiers optionnels : sons/voix-saut-1 ... 4 (annonce) et sons/saut-alarme (boucle). Sans voix enregistree : voix du navigateur (francais) ; sans alarme : alarme synthetisee.
    EVT_NIVEAU.alarme = EVT_NIVEAU.alarme || 0.22;     // reglable : tbmNiveaux.alarme = 0.15
    const SAUT_TEXTE = "Mesdames et messieurs, le vaisseau va entrer en saut hyperespace. Veuillez vous accrocher. Si vous avez envie de vomir, des sacs sont à votre disposition devant vous.";
    function evtSaut(force) {
        const maintenant = Date.now();
        const ignore = raison => { EVT.log.push({ t: new Date().toISOString(), type: "saut-ignore", raison }); try { console.info("[sons] saut ignore :", raison); } catch (e) {} };
        if (!force && EVT.der.saut && maintenant - EVT.der.saut < 25000) { ignore("moins de 25 s apres la precedente"); return; }
        const c = evtCtx(); if (!c) { ignore("son indisponible (pas de clic sur la page, ambiance coupee ou onglet masque)"); return; }
        if (c.state !== "running") ignore("contexte audio " + c.state + " (reprise demandee)");
        EVT.der.saut = maintenant;
        annoncesCoupe(c, 3);     // PRIORITAIRE : toute annonce en cours (cabine, embarquement, debarquement) est coupee
        try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
        AMB.annFin = 0;
        AMB.annT = Math.max(AMB.annT || 0, maintenant + 40000);     // pas d'annonce de la boucle de cabine pendant celle-ci
        Promise.all([evtVoix("voix-saut", c), evtCharge("saut-alarme", c), evtCharge("ambiance-cabine", c), evtCharge("annonce-1", c)]).then(([vx, al, refC, refA]) => {
            const t0 = c.currentTime + 0.1; let duree = 12;
            if (vx.length) {
                const v = vx[Math.floor(Math.random() * vx.length)], tVoix = t0 + 0.3;     // immediat : aucune attente derriere une autre annonce
                ambAnnonceJoue(c, v, tVoix, evtNiveau(v, refA, AMB_NIVEAU.annonce, EVT_NIVEAU.voix), EVT.out, 0.7, 3);
                duree = tVoix - t0 + v.duration; AMB.annFin = tVoix + v.duration;
            } else if (window.speechSynthesis) {
                try { const u = new SpeechSynthesisUtterance(SAUT_TEXTE); u.lang = "fr-FR"; u.rate = 0.95; u.volume = 0.85; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); duree = 14; } catch (e) {}
            }
            AMB.annT = Math.max(AMB.annT || 0, Date.now() + (duree + 20) * 1000);
            // alarme legere sous toute l'annonce : fondu a l'entree et a la sortie
            const fin = t0 + duree + 0.8, g = c.createGain(); g.connect(EVT.out);
            const niveau = al ? evtNiveau(al, refC, AMB_NIVEAU.cabine, EVT_NIVEAU.alarme) : 0.045 * (EVT_NIVEAU.alarme / 0.22);
            g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(niveau, t0 + 0.6); g.gain.setValueAtTime(niveau, fin - 1.2); g.gain.linearRampToValueAtTime(0.0001, fin);
            if (al) { const s = c.createBufferSource(); s.buffer = al; s.loop = true; s.connect(g); s.start(t0); s.stop(fin + 0.1); }
            else {     // pulsation douce (deux notes alternees, 0,9 s), sans bord dur
                const o = c.createOscillator(), m = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
                o.type = "sine"; o.frequency.setValueAtTime(520, t0);
                for (let t = t0; t < fin; t += 1.8) { o.frequency.setValueAtTime(520, t); o.frequency.setValueAtTime(390, t + 0.9); }
                m.gain.value = 0.5; lfo.frequency.value = 1.1; lfo.type = "sine"; lg.gain.value = 0.5; lfo.connect(lg); lg.connect(m.gain);
                o.connect(m); m.connect(g); o.start(t0); lfo.start(t0); o.stop(fin + 0.1); lfo.stop(fin + 0.1);
            }
        });
    }
    window.tbmSonSaut = evtSaut;     // essai a la main depuis la console : tbmSonSaut(true)
    window.tbmSonEvenement = evtJouer;     // essai a la main depuis la console : tbmSonEvenement("embarquement", true)
    // ---- SONS DU COMBAT (onglet Combat) : fichiers sons/combat-decryptage, combat-dechiffre, combat-acquisition, voix-elimination-1..N (un fichier absent est ignore).
    // Memes regles que l'ambiance (clic dans la page, onglet visible, bouton ♪ ON) + interrupteur propre au combat (localStorage edteam_cmb_sons). Essai : tbmSonCombat("acquisition"), tbmSonCombat("elimination", { premiere: true })
    const CMBS = { boucle: null, jeton: 0, der: {}, voixFin: 0, voixDer: 0, derniere: -1 };
    window.__tbmCmbs = CMBS;     // etat des sons du combat (diagnostic)
    EVT_NIVEAU.cdecr = EVT_NIVEAU.cdecr || 0.55; EVT_NIVEAU.cdech = EVT_NIVEAU.cdech || 0.8; EVT_NIVEAU.cacq = EVT_NIVEAU.cacq || 0.55; EVT_NIVEAU.cacqDuree = EVT_NIVEAU.cacqDuree || 0.8; EVT_NIVEAU.cvoix = EVT_NIVEAU.cvoix || 1;
    const CMB_VOIX_PROBA = 0.5, CMB_VOIX_DELAI = 10000;     // une elimination sur deux, 10 s mini entre deux voix
    const cmbSonOn = () => { try { return localStorage.getItem("edteam_cmb_sons") !== "0"; } catch (e) { return true; } };
    const cmbTrace = type => { try { EVT.log.push({ t: new Date().toISOString(), type: "combat-" + type }); } catch (e) {} };
    function cmbArret(fondu) {
        const b = CMBS.boucle; CMBS.boucle = null; CMBS.jeton++;
        if (!b) return;
        try { const t = b.c.currentTime; b.g.gain.cancelScheduledValues(t); b.g.gain.setValueAtTime(b.g.gain.value, t); b.g.gain.linearRampToValueAtTime(0.0001, t + (fondu || 0.2)); b.src.stop(t + (fondu || 0.2) + 0.05); } catch (e) {}
        clearTimeout(b.garde);
    }
    window.tbmSonCombat = function (type, opt) {
        try {
            const arret = opt === false; opt = opt || {};     // (opt = false : arret du decryptage)
            if (type === "decryptage" && arret) { const d = CMBS.dec; CMBS.dec = null; if (d) { try { const t = d.c.currentTime; d.g.gain.cancelScheduledValues(t); d.g.gain.setValueAtTime(d.g.gain.value, t); d.g.gain.linearRampToValueAtTime(0.0001, t + 0.18); d.src.stop(t + 0.22); } catch (e) {} } return; }
            if (!cmbSonOn()) { if (CMBS.boucle) cmbArret(0.1); return; }
            const maintenant = Date.now(), c = evtCtx(); if (!c) return;
            if (type === "prechauffe") { ["combat-decryptage", "combat-dechiffre", "combat-acquisition", "ambiance-cabine", "annonce-1"].forEach(n => evtCharge(n, c)); for (let i = 1; i <= 16; i++) evtCharge("voix-elimination-" + i, c); return; }
            if (type === "decryptage" || type === "dechiffre" || type === "acquisition") {     // une seule fois par evenement (decryptage : par revelation de champs ; dechiffre : a la fin de la revelation)
                if (type === "decryptage" && CMBS.dec) return;     // brouillage deja accompagne
                if (CMBS.der[type] && maintenant - CMBS.der[type] < (type === "decryptage" ? 1500 : type === "dechiffre" ? 1000 : 1200)) return;
                CMBS.der[type] = maintenant;
                const nom = "combat-" + type;
                Promise.all([evtCharge(nom, c), evtCharge("ambiance-cabine", c)]).then(([buf, refC]) => {
                    if (!buf) return;
                    const src = c.createBufferSource(), g = c.createGain();
                    src.buffer = buf; g.gain.value = evtNiveau(buf, refC, AMB_NIVEAU.cabine, type === "decryptage" ? EVT_NIVEAU.cdecr : type === "dechiffre" ? EVT_NIVEAU.cdech : EVT_NIVEAU.cacq);
                    src.connect(g); g.connect(EVT.out); const t = c.currentTime + 0.02; src.start(t); cmbTrace(type);
                    if (type === "decryptage") {     // le son dure autant que le brouillage : boucle du fichier, coupee par window.tbmSonCombat("decryptage", false), 10 s au plus
                        src.loop = true; CMBS.dec = { c, src, g }; src.onended = () => { if (CMBS.dec && CMBS.dec.src === src) CMBS.dec = null; };
                        setTimeout(() => { if (CMBS.dec && CMBS.dec.src === src) window.tbmSonCombat("decryptage", false); }, 10000);
                    }
                    if (type === "acquisition") {     // discret : court, fondu de sortie (le fichier entier ne joue pas)
                        const d = Math.min(buf.duration, EVT_NIVEAU.cacqDuree), v = g.gain.value; g.gain.setValueAtTime(v, t + Math.max(0, d - 0.3)); g.gain.linearRampToValueAtTime(0.0001, t + d); src.stop(t + d + 0.05);
                    }
                });
                return;
            }
            if (type === "elimination") {     // voix du capitaine : une elimination sur deux (toujours la premiere de la session), 10 s mini, jamais deux fois la meme, jamais par-dessus une autre voix
                if (!opt.force) {
                    if (maintenant - CMBS.voixDer < CMB_VOIX_DELAI || c.currentTime < CMBS.voixFin) return;
                    if (!opt.premiere && Math.random() >= CMB_VOIX_PROBA) return;
                }
                CMBS.voixDer = maintenant;
                const L = []; for (let i = 1; i <= 16; i++) L.push(evtCharge("voix-elimination-" + i, c));
                Promise.all([Promise.all(L), evtCharge("annonce-1", c)]).then(([vx, refA]) => {
                    const dispo = vx.map((b, i) => b ? i : -1).filter(i => i >= 0); if (!dispo.length) return;
                    let ch = dispo[Math.floor(Math.random() * dispo.length)]; if (dispo.length > 1 && ch === CMBS.derniere) ch = dispo[(dispo.indexOf(ch) + 1) % dispo.length];
                    CMBS.derniere = ch; const v = vx[ch], t0 = c.currentTime + 0.15;
                    ambAnnonceJoue(c, v, t0, evtNiveau(v, refA, AMB_NIVEAU.annonce, EVT_NIVEAU.cvoix), EVT.out, 0.5, 2);
                    CMBS.voixFin = t0 + v.duration + 0.3; AMB.annT = Math.max(AMB.annT || 0, Date.now() + (v.duration + 8) * 1000); cmbTrace("voix-" + (ch + 1));
                });
            }
        } catch (e) { /* un son ne doit jamais gener le combat */ }
    };
    // appelee a chaque nouvel etat de la session (S) : embarquement = une mission avec passagers vient d'etre PRISE ; debarquement = une mission avec passagers vient d'etre TERMINEE ;
    // chargement = la soute passe de 0 a 1 t ou plus, dechargement = elle perd au moins 1 t, les deux seulement a quai (en vol, minage ou largage ne sonnent pas)
    window.tbmSonsMissions = function (S) {
        try {
            const act = (S && S.missions) || [], fin = (S && S.terminees) || [];
            const pax = new Set(act.filter(estPassagers).map(m => String(m.id)));
            const tonnes = ((S && S.soute && S.soute.items) || []).reduce((a, x) => a + (Number(x.q) || 0), 0);
            const termines = new Set(fin.map(x => String(x.id)));
            // ventes au marche : lignes 'V' du registre pas encore vues (a la premiere lecture, on memorise seulement)
            const reg = (S && S.registre) || [], clefReg = x => x.t + "|" + x.n + "|" + x.q, vus = EVT.regVus = EVT.regVus || new Set();
            const ventes = reg.filter(x => x && x.k === "V" && !vus.has(clefReg(x))); reg.forEach(x => { if (x) vus.add(clefReg(x)); });
            const prev = EVT.prev; EVT.prev = { pax, tonnes, termines, amarre: !!(S && S.amarre) };
            const sautT = (S && S.saut && S.saut.t) || "", sautVu = EVT.sautVu; EVT.sautVu = sautT;
            if (!prev) return;     // premiere lecture : on memorise seulement
            // saut hyperespace en cours avec des passagers a bord (le plugin ne renseigne 'saut' que dans ce cas) : nouvel horodatage ET recent (tolerance si l'horloge de la page differe un peu)
            if (sautT && sautT !== sautVu) {
                const age = Date.now() - Date.parse(sautT);
                if (pax.size && age > -20000 && age < 40000) { EVT.log.push({ t: new Date().toISOString(), type: "saut", raison: S.saut.sys || "" }); evtSaut(); }
                else EVT.log.push({ t: new Date().toISOString(), type: "saut-ignore", raison: pax.size ? "etat recu trop ancien ou horloge decalee (age " + Math.round(age / 1000) + " s)" : "aucune mission de passagers dans l'etat recu" });
            }
            // interception en supercruise avec des passagers a bord : 'debut' (mini-jeu) = annonce + cris ; 'echappe' = soulagement ; 'capture' = rien de plus (les cris ont deja sonne au debut)
            const itT = (S && S.interception && S.interception.t) || "", itVu = EVT.interVu; EVT.interVu = itT;
            if (itT && itT !== itVu) {
                const age = Date.now() - Date.parse(itT), e = S.interception.e;
                if (age > -20000 && age < 60000 && (e === "debut" || e === "echappe")) { EVT.log.push({ t: new Date().toISOString(), type: "interception-" + e, raison: itT }); evtJouer(e === "debut" ? "interception" : "echappe"); }
            }
            // marchandises transferees VERS le vaisseau (soute du Rhino : on est pose, pas amarre) : meme son de chargement que l'ajout a quai (le delai de 45 s evite le doublon)
            const chT = (S && S.chargement && S.chargement.t) || "", chVu = EVT.chargVu; EVT.chargVu = chT;
            if (chT && chT !== chVu) { const age = Date.now() - Date.parse(chT); if (age > -20000 && age < 60000) { EVT.log.push({ t: new Date().toISOString(), type: "chargement", raison: "transfert " + (S.chargement.n || "") + " t" }); evtJouer("chargement"); } }
            const trace = (type, raison) => { const l = { t: new Date().toISOString(), type, raison }; EVT.log.push(l); if (EVT.log.length > 50) EVT.log.shift(); try { console.info("[sons]", type, raison); } catch (e) {} };
            if (ventes.some(x => { const a = Date.now() - Date.parse(x.t); return a > -20000 && a < 120000; })) { trace("vente", ventes.length + " ligne(s) de vente"); evtJouer("vente"); }
            // balise de tourisme scannee avec des passagers a bord : appareils photo + annonce d'arrivee
            const toT = (S && S.tourisme && S.tourisme.t) || "", toVu = EVT.tourVu; EVT.tourVu = toT;
            if (toT && toT !== toVu) { const age = Date.now() - Date.parse(toT); if (age > -20000 && age < 60000) { EVT.log.push({ t: new Date().toISOString(), type: "balise", raison: S.tourisme.sys || "" }); evtJouer("balise"); } }
            const recent = ts => { const t = Date.parse(ts); return !isNaN(t) && Date.now() - t < 240000; };     // une mission retrouvee dans d'anciens journaux n'est pas une nouvelle prise
            const prises = act.filter(m => estPassagers(m) && !prev.pax.has(String(m.id)) && recent(m.t) && !EVT.vus.has("e" + m.id));
            if (prises.length) { prises.forEach(m => EVT.vus.add("e" + m.id)); trace("embarquement", "mission " + prises.map(m => m.id).join(",")); evtJouer("embarquement"); }
            const rendues = fin.filter(x => !prev.termines.has(String(x.id)) && prev.pax.has(String(x.id)) && recent(x.t) && !EVT.vus.has("d" + x.id));
            if (rendues.length) { rendues.forEach(x => EVT.vus.add("d" + x.id)); trace("debarquement", "mission " + rendues.map(x => x.id).join(",")); evtJouer("debarquement"); }
            // applaudissements : le vaisseau vient de s'amarrer a un pad avec une mission de passagers / tourisme a bord (ou rendue a cet instant)
            if (S && S.amarre && !prev.amarre && (prev.pax.size || pax.size)) { trace("applaudissements", "amarrage avec passagers"); evtJouer("applaudissements"); }
            if (S && S.amarre) {
                if (tonnes - prev.tonnes >= 1) { trace("chargement", "soute " + prev.tonnes + " -> " + tonnes + " t"); evtJouer("chargement"); }
                else if (prev.tonnes - tonnes >= 1) { trace("dechargement", "soute " + prev.tonnes + " -> " + tonnes + " t"); evtJouer("dechargement"); }
            }
        } catch (e) { /* le son ne doit jamais gener la page */ }
    };
    // une boucle par ambiance : demarre quand il y a des caisses / des passagers, fondu a l'arret
    function ambBoucle(k, veut) {
        const B = AMB.bou = AMB.bou || {}, c = AMB.ctx, buf = AMB.fich && AMB.fich[k];
        if (!buf) return false;
        let l = B[k];
        if (veut && !l) { const src = c.createBufferSource(), g = c.createGain(); src.buffer = buf; src.loop = true; g.gain.value = 0; if (AMB_COUPE[k]) { const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = AMB_COUPE[k]; src.connect(hp); hp.connect(g); } else src.connect(g); g.connect(AMB.out); src.start(0, Math.random() * buf.duration); l = B[k] = { src, g }; }
        if (l) {
            l.g.gain.setTargetAtTime(veut ? ambNiv(k) : 0, c.currentTime, 0.8);
            clearTimeout(l.arret);
            if (!veut) l.arret = setTimeout(() => { if (B[k] === l) { try { l.src.stop(); } catch (e) {} delete B[k]; } }, 4000);
        }
        return true;
    }
    function ambLit() { try { return AMB.geste && ambActive() && !document.hidden && document.querySelector(".tbm-bloc") && (AMB.c || AMB.p > 0 || AMB.k); } catch (e) { return false; } }
    function ambStop() {
        if (AMB.timer) { clearInterval(AMB.timer); AMB.timer = null; }
        if (AMB.ctx) { const t = AMB.ctx.currentTime; if (AMB.hum) { AMB.hum.gain.setTargetAtTime(0, t, 0.2); AMB.mur.gain.setTargetAtTime(0, t, 0.2); } ambBoucle("depot", false); ambBoucle("cabine", false); ambBoucle("combat", false); }
    }
    function ambTick() {
        if (!ambLit()) { ambStop(); return; }
        const t = AMB.ctx.currentTime, k = !!AMB.k, rD = ambBoucle("depot", !!AMB.c && !k), rC = ambBoucle("cabine", AMB.p > 0 && !k), rK = ambBoucle("combat", k);
        if (rD || k) AMB.hum.gain.setTargetAtTime(0, t, 0.3); else AMB.hum.gain.setTargetAtTime(AMB.c ? 0.012 : 0, t, 0.3);
        if (rC || k) AMB.mur.gain.setTargetAtTime(0, t, 0.3); else AMB.mur.gain.setTargetAtTime(AMB.p > 0 ? rnd(0.006, 0.014) * Math.min(2, 0.6 + Math.sqrt(AMB.p) / 4) : 0, t, 0.35);
        ambAnnonce();
        if (AMB.c && !rD && !k) { if (Math.random() < 0.35) ambClang(); if (Math.random() < 0.35) ambCoup(); if (Math.random() < 0.04) ambBip(); }
        if (AMB.p > 0 && !rC && !k) { if (Math.random() < Math.min(0.55, 0.12 + 0.035 * Math.sqrt(AMB.p))) ambPhrase(); if (Math.random() < 0.03 + 0.004 * Math.min(AMB.p, 20)) ambRire(); }
    }
    function ambSync() {
        try { if (!AMB.geste && ambActive() && !document.hidden && document.querySelector(".tbm-bloc") && (AMB.c || AMB.p > 0 || AMB.k)) ambIndice(true); } catch (e) {}
        if (!ambLit()) { ambStop(); return; }
        if (!AMB.ctx) { try { AMB.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; } }
        const c = AMB.ctx; if (c.state === "suspended") c.resume();
        if (!AMB.out) {
            AMB.out = c.createGain(); AMB.out.gain.value = 0.8; AMB.out.connect(c.destination);
            const h = c.createOscillator(), hl = c.createBiquadFilter(); AMB.hum = c.createGain(); AMB.hum.gain.value = 0; h.type = "sawtooth"; h.frequency.value = 52; hl.type = "lowpass"; hl.frequency.value = 170; h.connect(hl); hl.connect(AMB.hum); AMB.hum.connect(AMB.out); h.start();
            const n = ambBruit(), bp = c.createBiquadFilter(); AMB.mur = c.createGain(); AMB.mur.gain.value = 0; bp.type = "bandpass"; bp.frequency.value = 600; bp.Q.value = 0.7; n.connect(bp); bp.connect(AMB.mur); AMB.mur.connect(AMB.out); n.start();
        }
        if (AMB.k) ambCharge("combat"); else { if (AMB.c) ambCharge("depot"); if (AMB.p > 0) { ambCharge("cabine"); ambChargeAnnonces(); } }
        if (!AMB.timer) { AMB.timer = setInterval(ambTick, 450); ambTick(); }
    }
    // Ambiance de DEPOT en boucle (ouvriers, chariots) : desactivee a la demande du proprietaire (trop presente). Les sons ponctuels de chargement / dechargement restent. Pour la remettre : AMB_DEPOT = true.
    const AMB_DEPOT = false;
    function ambMaj(caisses, passagers, combat) { AMB.c = AMB_DEPOT && !!caisses; AMB.p = passagers || 0; AMB.k = !!combat; ambSync(); }
    if (!window.__tbmAmbInit) {
        window.__tbmAmbInit = true;
        // application installee : le navigateur autorise le son sans geste, donc pas de clic exige (le contexte audio relance le son s'il est quand meme refuse)
        try { if ((window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true) AMB.geste = true; } catch (e) { /* navigateur ancien : clic exige comme avant */ }
        const geste = () => { AMB.geste = true; ambIndice(false); ambSync(); };
        document.addEventListener("pointerdown", geste, { once: true }); document.addEventListener("keydown", geste, { once: true });
        document.addEventListener("visibilitychange", ambSync);
        document.addEventListener("click", e => {
            const b = e.target.closest && e.target.closest("[data-tbmamb]"); if (!b) return;
            const on = !ambActive(); try { localStorage.setItem("tbm_ambiance", on ? "1" : "0"); } catch (x) {}
            document.querySelectorAll("[data-tbmamb]").forEach(x => { x.classList.toggle("on", on); x.textContent = "♪ AMBIANCE " + (on ? "ON" : "OFF"); });
            AMB.geste = true; ambSync();
        });
    }

    // ---- ajustement de la largeur de la vue : si la scene est plus large que la vue (limitee en hauteur), la vue s'elargit et le panneau de zoom prend la place libre
    window.__tbmAjuste = function () {
        const d = window.__tbmDerniers; if (!d || !d.zoomOn) return;
        const svg = document.querySelector(".tbm-bloc svg.tbm-zoomable"), sc = svg && svg.parentNode; if (!svg) return;
        const cw = sc.clientWidth, hp = svg.getBoundingClientRect().height, h0 = +svg.dataset.h, w0 = +svg.dataset.w; if (!cw || !hp || !h0) return;
        const need = Math.min(1800, Math.round(cw * h0 / hp));
        if (need <= w0 + 24 || w0 >= d.cap - 2) return;
        (window.__tbmVwK = window.__tbmVwK || {})[d.opts.titre || ""] = need;
        svg.outerHTML = window.modulesHtml(d.act, Object.assign({}, d.opts, { vw: need, _svgSeul: true }));
    };
    if (!window.__tbmResizeInit) {
        window.__tbmResizeInit = true; let tm;
        window.addEventListener("resize", () => { clearTimeout(tm); tm = setTimeout(() => { const d = window.__tbmDerniers, svg = document.querySelector(".tbm-bloc svg.tbm-zoomable"); if (!d || !d.zoomOn || !svg) return; window.__tbmVwK = {}; svg.outerHTML = window.modulesHtml(d.act, Object.assign({}, d.opts, { vw: 0, _svgSeul: true })); setTimeout(window.__tbmAjuste, 80); }, 250); });
    }

    // ---- zoom (molette, boutons, glisser) : on modifie le viewBox du SVG ; l'etat survit aux rafraichissements (la zone est recreee a chaque affichage)
    const Z = window.__tbmZoom = window.__tbmZoom || { k: 1, cx: 468, cy: null };
    function vue(svg) {
        const w0 = +svg.dataset.w, h0 = +svg.dataset.h; if (!w0 || !h0) return;
        Z.k = Math.max(1, Math.min(4, Z.k));
        const w = w0 / Z.k, h = h0 / Z.k; if (Z.cy == null) Z.cy = h0 / 2;
        Z.cx = Math.max(w / 2, Math.min(w0 - w / 2, Z.cx)); Z.cy = Math.max(h / 2, Math.min(h0 - h / 2, Z.cy));
        svg.setAttribute("viewBox", (Z.cx - w / 2).toFixed(1) + " " + (Z.cy - h / 2).toFixed(1) + " " + w.toFixed(1) + " " + h.toFixed(1));
        const p = svg.parentNode, l = p && p.querySelector(".tbm-zl"); if (l) l.textContent = Math.round(Z.k * 100) + " %";
        svg.style.cursor = Z.k > 1 ? "grab" : "";
    }
    function zoomer(svg, f, px, py) {   // px, py : point fixe (coordonnees du viewBox) ; par defaut le centre
        const w0 = +svg.dataset.w, h0 = +svg.dataset.h; if (Z.cy == null) Z.cy = h0 / 2;
        if (px == null) { px = Z.cx; py = Z.cy; }
        const ancien = Z.k; Z.k = Math.max(1, Math.min(4, Z.k * f)); const r = ancien / Z.k;
        Z.cx = px + (Z.cx - px) * r; Z.cy = py + (Z.cy - py) * r;
        if (Z.k === 1) { Z.cx = w0 / 2; Z.cy = h0 / 2; }
        vue(svg);
    }
    if (!window.__tbmZoomInit) {
        window.__tbmZoomInit = true;
        const pt = (svg, e) => { const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, s = Math.min(r.width / vb.width, r.height / vb.height), ox = (r.width - vb.width * s) / 2, oy = (r.height - vb.height * s) / 2; return [vb.x + (e.clientX - r.left - ox) / s, vb.y + (e.clientY - r.top - oy) / s, s]; };
        document.addEventListener("wheel", e => {
            const svg = e.target.closest && e.target.closest("svg.tbm-zoomable"); if (!svg) return;
            e.preventDefault(); const p = pt(svg, e); zoomer(svg, e.deltaY < 0 ? 1.2 : 1 / 1.2, p[0], p[1]);
        }, { passive: false });
        document.addEventListener("click", e => {
            const b = e.target.closest && e.target.closest("[data-tbmz]"); if (!b) return;
            const svg = b.closest(".tbm-bloc").querySelector("svg.tbm-zoomable"); if (!svg) return;
            const a = b.dataset.tbmz; if (a === "reset") { Z.k = 1; Z.cx = +svg.dataset.w / 2; Z.cy = +svg.dataset.h / 2; vue(svg); } else zoomer(svg, a === "in" ? 1.3 : 1 / 1.3);
        });
        let drag = null;
        document.addEventListener("pointerdown", e => { const svg = e.target.closest && e.target.closest("svg.tbm-zoomable"); if (!svg || Z.k <= 1 || e.button !== 0) return; drag = { svg, x: e.clientX, y: e.clientY, cx: Z.cx, cy: Z.cy }; svg.style.cursor = "grabbing"; });
        document.addEventListener("pointermove", e => { if (!drag) return; const p = pt(drag.svg, e), s = p[2]; Z.cx = drag.cx - (e.clientX - drag.x) / s; Z.cy = drag.cy - (e.clientY - drag.y) / s; vue(drag.svg); });
        const fin = () => { if (drag) { drag.svg.style.cursor = Z.k > 1 ? "grab" : ""; drag = null; } };
        document.addEventListener("pointerup", fin); document.addEventListener("pointercancel", fin);
    }

    // ------------------------------------------------------------------------------------------------
    window.modulesHtml = function (act, opts) {
        opts = opts || {};
        const sil = silhouetteActive(); if (!sil || !S || !S.vaisseau || !(S.vaisseau.mods || []).length) return "";
        const E = esc, mods = preparer(S.vaisseau, sil), opt = mods.filter(m => m.cat === "opt");
        // ---- passagers (famille par type), cargaison et colis de sauvetage
        const nbF = {}; act.filter(estPassagers).forEach(m => { const f = famPassagers(m); nbF[f] = (nbF[f] || 0) + Number(m.pas); });
        const so = S.soute || {}, items = (so.items || []).filter(x => (Number(x.q) || 0) > 0), tonnes = items.reduce((a, x) => a + (Number(x.q) || 0), 0);
        const nm = x => String(x || "").trim().toLowerCase(), besoin = {};
        act.filter(m => m.type === "sauvetage" && Number(m.q) > 0 && m.march).forEach(m => { const k = nm(m.march); besoin[k] = besoin[k] || { n: m.march, q: 0 }; besoin[k].q += Number(m.q); });
        const attente = Object.values(besoin).map(b => ({ n: b.n, q: Math.max(0, b.q - items.filter(x => nm(x.n) === nm(b.n)).reduce((a, x) => a + (Number(x.q) || 0), 0)) })).filter(b => b.q > 0);
        const places = opt.reduce((t, m) => t + m.places, 0), compo = [];
        Object.keys(nbF).forEach(f => { for (let i = 0; i < nbF[f]; i++) compo.push(f); });
        let graine = 7; const alea = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
        for (let i = compo.length - 1; i > 0; i--) { const j = Math.floor(alea() * (i + 1)); const t = compo[i]; compo[i] = compo[j]; compo[j] = t; }
        const nPax = compo.length; let reste = compo.slice();
        // ---- geometrie (repere « affichage » : nez en haut ; l'image enregistree est tournee de 180 degres, comme la soute)
        const W = sil.W, H = sil.H, AXE = W - sil.axe, zm = sil.zmod || [sil.arriere, sil.nez], YTOP = H - zm[1], YBOT = H - zm[0], Ltot = YBOT - YTOP;
        const demi = yd => { const ys = H - yd; for (let i = 0; i < sil.coque.length - 1; i++) { const a = sil.coque[i], b = sil.coque[i + 1], lo = Math.min(a[1], b[1]), hi = Math.max(a[1], b[1]); if (ys >= lo && ys <= hi && hi > lo) return (a[0] + (b[0] - a[0]) * (ys - a[1]) / (b[1] - a[1])) * 0.9; } return 0; };
        const pcm = window.profilCommandant, nomCmdr = pcm && pcm.cmdr_nom ? "CMDR " + pcm.cmdr_nom : "COMMANDANT", LW0 = Math.max(110, Math.round(nomCmdr.length * 8.6 + 22)), eq = (Array.isArray(S.equipage) ? S.equipage : []).filter(m => !/shoreleave|inactive/i.test(m.r || "")).slice(0, 4);   // « OnShoreLeave » = reste dans la salle d'attente du salon d'equipage, pas a bord
        const RANGS = ["Harmless", "Mostly Harmless", "Novice", "Competent", "Expert", "Master", "Dangerous", "Deadly", "Elite"], ROLES = { active: "co-pilot", idle: "idle", firecon: "gunner", fightercon: "fighter pilot" };
        const chas = S.chasseur && S.chasseur.n ? S.chasseur : null, enVol = !!(chas && chas.e === "vol" && !chas.pc), idFC = enVol ? eq.findIndex(m => /fightercon/i.test(m.r || "")) : -1;
        const crewL = eq.map(m => ({ a: m.n || "Crew", b: RANGS[Number(m.g)] || "" }));
        const CW = crewL.length ? Math.round(Math.max.apply(null, crewL.map(l => Math.max(l.a.length * 7.6, l.b.length * 6.5))) + 20) : 0;
        const LW = LW0, SHW = 600, zoomOn = !opts.sansZoom && (nPax > 0 || items.length > 0 || attente.length > 0), SC = Math.min((SHW - 24) / W, 1.35), hb = (() => { let a = 1e9, b = -1e9; sil.formes.forEach(d => (String(d).match(/-?\d+(\.\d+)?/g) || []).forEach((v, i) => { if (i % 2 === 0) { a = Math.min(a, +v); b = Math.max(b, +v); } })); return a < b ? [a, b] : [0, W]; })(), hullW = Math.round((hb[1] - hb[0]) * SC), pyh = sil.cockpit ? sil.cockpit[1] : YTOP + 0.06 * Ltot, ybC = pyh + (24 + 8 + crewL.length * 32) / SC, offMin = Math.max(10, Math.round(LW + 62 + 8 - ((sil.cockpit ? sil.cockpit[0] : AXE) - (W - hb[1])) * SC), crewL.length ? Math.round(CW + 18 - (AXE - demi(ybC) - (W - hb[1])) * SC) : 0), GAP = 84, vwReq = opts.vw || (window.__tbmVwK || {})[opts.titre || ""] || 0, VWd = zoomOn ? Math.min(2400, Math.max(SHW, offMin + hullW + GAP + 440 + 50, vwReq)) : SHW, PWd = Math.min(620, VWd - hullW - GAP - 50 - offMin), off = Math.max(offMin, Math.round((VWd - hullW - GAP - PWd) / 2)), PX = off + hullW + GAP, HX = zoomOn ? off - (W - hb[1]) * SC : SHW / 2 - AXE * SC, HY = 24, P = a => [+(HX + a[0] * SC).toFixed(1), +(HY + a[1] * SC).toFixed(1)];
        const fsL = +(10 / SC).toFixed(1), cw = fsL * 0.6, fsT = +(8.6 / SC).toFixed(1);
        const court = (t, w) => { const cap = Math.floor(w / cw); if (t.length <= cap) return t; return t.slice(0, Math.max(3, cap - 1)) + "…"; };
        let bandes = "", gens = "", hits = "", dets = [], caisses = ""; const cabB = { x1: -1e9, y0: 1e9, y1: -1e9 }, rackB = { x1: -1e9, y0: 1e9, y1: -1e9 }; const celRack = [];
        // ---- un compartiment
        const bande = (m, x0, y, w, h) => {
            let nAb = 0; const cab = m.places > 0, rack = m.rack, vide = m.vide, coul = vide ? "#6b7680" : cab ? "#FF9A1F" : rack ? "#00F0FF" : "#B28DFF";
            { const bb = vide ? null : m.places > 0 ? cabB : m.rack ? rackB : null; if (bb) { bb.x1 = Math.max(bb.x1, x0 + w); bb.y0 = Math.min(bb.y0, y); bb.y1 = Math.max(bb.y1, y + h); } }
            const lab = vide ? (w < 56 ? "∅" : "EMPTY · size " + m.taille) : w < 56 ? (cab ? "×" + m.places : ini(m.nom)) : court(m.nom + (cab ? " · " + m.places : ""), w - 6);
            bandes += `<rect data-s="${m.slot}" x="${x0.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${vide ? "rgba(4,9,12,.28)" : cab ? "url(#tbmA)" : rack ? "url(#tbmC)" : "url(#tbmV)"}" filter="url(#tbmf)" stroke="${coul}" stroke-width="1.2" stroke-opacity="${vide ? 0.55 : 0.95}"${vide ? ' stroke-dasharray="4 3"' : ""}/>`
                + `<text x="${(x0 + 4).toFixed(1)}" y="${(y + fsL * 1.05).toFixed(1)}" fill="${vide ? "#8b97a0" : cab ? "#FFB44D" : rack ? "#7fe9ff" : "#cdb6ff"}" font-size="${fsL}" stroke="#04090c" stroke-width="2.2" paint-order="stroke">${E(lab)}</text>`;
            if (window.__TBM_TEST) window.__TBM_TEST.push({ slot: m.slot, x0, y, w, h, lab, vide, cw });
            if (cab) {
                const k = nAb = Math.min(reste.length, Math.round(nPax * m.places / Math.max(places, 1))), sc0 = Math.max(0.5, Math.min(0.85, Math.sqrt(w * (h - 12) / Math.max(k, 1)) / 18));
                for (let q = 0; q < k; q++) {
                    const f = reste.shift(), e = sc0 * (f === "ord" || f === "sec" ? 1 : 1.2), z = { x0: x0 + 8, x1: x0 + w - 8, y0: y + 14 + 9 * e, y1: Math.max(y + 14 + 9 * e, y + h - 3 - 9 * e) }, R = (u, v) => u + alea() * (v - u);
                    const px = R(z.x0, z.x1), py = R(z.y0, z.y1), v = []; for (let i = 0; i < 4; i++) v.push([R(z.x0, z.x1) - px, R(z.y0, z.y1) - py]);
                    const c = PAS_FAM[f].c, imp = PAS_FAM[f].imp > 0;
                    gens += `<g class="tbm-p" style="--a0:${v[0][0].toFixed(1)}px;--b0:${v[0][1].toFixed(1)}px;--a1:${v[1][0].toFixed(1)}px;--b1:${v[1][1].toFixed(1)}px;--a2:${v[2][0].toFixed(1)}px;--b2:${v[2][1].toFixed(1)}px;--a3:${v[3][0].toFixed(1)}px;--b3:${v[3][1].toFixed(1)}px;--d:${R(38, 62).toFixed(1)}s;animation-delay:-${R(0, 40).toFixed(1)}s"><g transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) scale(${e.toFixed(2)})" fill="${c}"><circle cx="0" cy="-8" r="3.4"/><path d="M-5.5 -3.5 Q0 -6 5.5 -3.5 L5 5 L2 5 L1.2 11 L-1.2 11 L-2 5 L-5 5 Z"/>${imp ? `<circle r="11" cy="-1" fill="${c}" fill-opacity=".25" stroke="${c}" stroke-opacity=".8"/>` : ""}</g></g>`;
                }
            }
            if (rack) { const p = 11, cols = Math.max(1, Math.floor((w - 6) / p)), rows = Math.max(1, Math.floor((h - 13) / p)); for (let q = 0; q < cols * rows; q++) celRack.push({ x: x0 + 3 + (q % cols) * p + (w - 6 - cols * p) / 2, y: y + 12 + Math.floor(q / cols) * p, p: p - 1.5 }); }
            if (!vide) gens += `<text x="${(x0 + w - 3).toFixed(1)}" y="${(y + h - 3).toFixed(1)}" text-anchor="end" fill="${m.eng ? "#FFD54A" : "#9fb0b8"}" font-size="${fsT}" font-weight="bold" stroke="#04090c" stroke-width="2.2" paint-order="stroke">${m.eng ? "G" + m.eng.niv : "STOCK"}</text>`;
            hits += `<rect class="tbm-hit" data-s="${m.slot}" data-d="${dets.length}" x="${x0.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="#fff" fill-opacity="0"/>`;
            dets.push(detail(m, nAb, E));
        };
        // ---- lignes : types regroupes (divers au nez, cabines, racks a l'arriere), gros d'abord ; petits modules par PAIRES sur les flancs la ou la coque est large
        const grp = m => m.places > 0 ? 1 : m.rack ? 2 : 0, gap = 3, minH = 26, SP = 46, LANE_MIN = 30;
        const ordre = [0, 1, 2].reduce((a, g) => a.concat(opt.filter(m => grp(m) === g).sort((x, y) => y.taille - x.taille || x.slot.localeCompare(y.slot))), []);
        const plan = L => { const sw = L.reduce((t, m) => t + m.taille * m.taille, 0) || 1, extra = Ltot - gap * Math.max(L.length - 1, 0) - L.length * minH; let y = YTOP; return L.map(m => { const h = Math.max(18, minH + extra * m.taille * m.taille / sw), r = { m, y, h }; y += h + gap; return r; }); };
        const larg = yc => Math.max(14, demi(yc) - 10), largB = (y, h) => Math.min(larg(y), larg(y + h), larg(y + h / 2));
        const fallback = new Set(); let C = [], F = [];
        if (sil.paires) {
            // coque courte et large (Panther) : DEUX colonnes de compartiments cote a cote -> deux fois plus de hauteur pour chacun (passagers et caisses plus visibles)
            const rowsP = [], MINP = 36; [0, 1, 2].forEach(g => { const Lg = ordre.filter(m => grp(m) === g); for (let i = 0; i < Lg.length; i += 2) rowsP.push(Lg.slice(i, i + 2)); });
            const pw = r => Math.max.apply(null, r.map(m => m.taille * m.taille)), geo = () => { const sw = rowsP.reduce((t, r) => t + pw(r), 0) || 1, extra = Ltot - gap * Math.max(rowsP.length - 1, 0) - rowsP.length * minH; let yy = YTOP; return rowsP.map(r => { const h = Math.max(18, minH + extra * pw(r) / sw), o = { r, y: yy, h, hw: largB(yy, h) }; yy += h + gap; return o; }); };
            // une paire dont les compartiments seraient trop etroits (coque qui se resserre vers l'arriere) est separee en deux lignes pleine largeur
            let G = geo(); for (let it = 0; it < 14; it++) { const k = G.findIndex(o => o.r.length === 2 && o.hw - 1.5 < MINP); if (k < 0) break; const r = rowsP[k]; rowsP.splice(k, 1, [r[0]], [r[1]]); G = geo(); }
            G.forEach(o => { if (o.r.length === 2) { bande(o.r[0], AXE - o.hw, o.y, o.hw - 1.5, o.h); bande(o.r[1], AXE + 1.5, o.y, o.hw - 1.5, o.h); } else bande(o.r[0], AXE - o.hw, o.y, 2 * o.hw, o.h); });
        } else {
        for (let it = 0; it < 12; it++) {
            const petits = ordre.filter(m => m.taille <= 4 && !fallback.has(m));
            C = plan(ordre.filter(m => petits.indexOf(m) < 0)); F = []; let ok = true; const flanquees = new Set(), reste2 = [];
            const large = r => largB(r.y, r.h) - SP - 3 >= LANE_MIN, paire = (r, x, y) => { F.push({ m: x, y: r.y, h: r.h, lane: "L" }, { m: y, y: r.y, h: r.h, lane: "R" }); flanquees.add(r); };
            // 1) par paires a cote d'une ligne centrale du MEME type, la ou la coque est large
            [0, 1, 2].forEach(g => {
                const sm = petits.filter(m => grp(m) === g), cand = C.filter(r => grp(r.m) === g && large(r)).sort((x, y) => y.h - x.h); let i = 0;
                while (i + 1 < sm.length && cand.length) { paire(cand.shift(), sm[i], sm[i + 1]); i += 2; }
                for (; i < sm.length; i++) reste2.push(sm[i]);
            });
            // 2) les petits modules restants (leur type n'a pas de ligne assez large) se placent a cote d'une ligne d'un AUTRE type
            const cand2 = C.filter(r => !flanquees.has(r) && large(r)).sort((x, y) => y.h - x.h); let j = 0;
            while (j + 1 < reste2.length && cand2.length) { paire(cand2.shift(), reste2[j], reste2[j + 1]); j += 2; }
            for (; j < reste2.length; j++) { fallback.add(reste2[j]); ok = false; }
            C.forEach(r => { r.flanquee = flanquees.has(r); });
            if (ok) break;
        }
        C.forEach(r => { const hw = largB(r.y, r.h), w2 = r.flanquee ? Math.min(hw, SP) : hw; bande(r.m, AXE - w2, r.y, 2 * w2, r.h); });
        F.forEach(f => { const hw = largB(f.y, f.h), lw = hw - SP - 3; bande(f.m, f.lane === "L" ? AXE - hw : AXE + SP + 3, f.y, lw, f.h); });
        }
        // ---- caisses dans les racks (depuis l'arriere) : cargaison reelle, puis colis de sauvetage en pointilles
        const capS = Number(so.cap) || 0, capR = opt.filter(m => m.rack).reduce((t, m) => t + (CAP_RACK[m.taille] || 0), 0), capT = capS || capR, U = celRack.length && capT ? capT / celRack.length : 1;
        const prop = []; items.forEach((x, i) => { const k = Math.max(1, Math.round((Number(x.q) || 0) / U)); for (let j = 0; j < k && prop.length < celRack.length; j++) prop.push(i); });
        const fant = []; attente.forEach((b, k) => { const c = COUL_MARCH[(items.length + k) % COUL_MARCH.length], n = Math.max(1, Math.round(b.q / U)); for (let j = 0; j < n; j++) fant.push(c); });
        const rangRack = celRack.slice().reverse();
        rangRack.forEach((q, i) => {
            if (i < prop.length) { const cl = COUL_MARCH[prop[i] % COUL_MARCH.length], mis = !!items[prop[i]].m; caisses += `<g class="tb-c" data-l="${prop[i]}" style="color:${cl}"><rect x="${(q.x - 0.75).toFixed(1)}" y="${(q.y - 0.75).toFixed(1)}" width="${q.p + 1.5}" height="${q.p + 1.5}" fill="rgba(0,0,0,0)"/><rect x="${q.x.toFixed(1)}" y="${q.y.toFixed(1)}" width="${q.p}" height="${q.p}" fill="${cl}" fill-opacity=".5" stroke="${cl}" stroke-width="1.4"${mis ? ' stroke-dasharray="3 2"' : ""}/></g>`; }
            else if (i < prop.length + fant.length) { const cl = fant[i - prop.length]; gens += `<rect x="${q.x.toFixed(1)}" y="${q.y.toFixed(1)}" width="${q.p}" height="${q.p}" fill="none" stroke="${cl}" stroke-width="1.2" stroke-dasharray="3 2"/><text x="${(q.x + q.p / 2).toFixed(1)}" y="${(q.y + q.p / 2 + 4).toFixed(1)}" fill="${cl}" font-size="10" font-weight="bold" text-anchor="middle" stroke="#04090c" stroke-width="2" paint-order="stroke">?</text>`; }
        });
        // ---- cartes de gauche (points d'emport, utilitaires) et de droite (modules primordiaux) : ancres stylisees (ou celles du vaisseau : sil.anc)
        const A = sil.anc || {}, Y = f => YTOP + f * Ltot;
        const CF = { Radar: 0.06, LifeSupport: 0.2, FrameShiftDrive: 0.34, Armour: 0.46, PowerPlant: 0.5, PowerDistributor: 0.62, FuelTank: 0.74, MainEngines: 0.97 };
        const ancCore = m => { if (A.core && A.core[m.slot]) return A.core[m.slot]; const y = Y(CF[m.slot] || 0.5); return [AXE + (m.slot === "Armour" ? demi(y) * 0.85 : m.slot === "MainEngines" ? demi(y) * 0.3 : 0), y]; };
        const armes = mods.filter(m => m.cat === "arme").sort((a, b) => b.taille - a.taille || a.slot.localeCompare(b.slot)), utils = mods.filter(m => m.cat === "util").sort((a, b) => a.slot.localeCompare(b.slot));
        const ancArme = (m, i) => { if (A.hard && A.hard[m.slot]) return A.hard[m.slot]; const y = Y(0.12 + 0.5 * i / Math.max(armes.length - 1, 1)); return [AXE + (i % 2 ? 1 : -1) * demi(y) * 0.8, y]; };
        const ancUtil = (m, i) => { if (A.tiny && A.tiny[m.slot]) return A.tiny[m.slot]; const y = Y(0.3 + 0.5 * i / Math.max(utils.length - 1, 1)); return [AXE + (i % 2 ? 1 : -1) * demi(y) * 0.6, y]; };
        // anneaux de survol (modules hors compartiments) : caches tant que la ligne correspondante de la liste n'est pas survolee
        const mk = [];
        armes.forEach((m, i) => mk.push([m.slot, P(ancArme(m, i)), "#FF9A1F"]));
        utils.forEach((m, i) => mk.push([m.slot, P(ancUtil(m, i)), "#FFD54A"]));
        mods.filter(m => m.cat === "core").forEach(m => mk.push([m.slot, P(ancCore(m)), "#00F0FF"]));
        const marqueurs = mk.map(q => `<g class="tbm-mk" data-s="${q[0]}"><circle cx="${q[1][0]}" cy="${q[1][1]}" r="15" fill="${q[2]}" fill-opacity=".15" stroke="${q[2]}" stroke-width="2"/><circle cx="${q[1][0]}" cy="${q[1][1]}" r="4" fill="#fff"/></g>`).join("");
        const VH = Math.round(H * SC) + 40 + (opts.valeur ? 126 : 0);
        // ---- zoom a droite de la coque : composition (passagers par famille, caisses de la soute), relie aux cabines et aux racks par des pointilles
        let zoomSvg = "";
        if (zoomOn) {
            const y0 = 46, y1 = VH - 14 - (opts.mini ? 130 : 0), fam = Object.keys(PAS_FAM).filter(f => nbF[f]);
            const aSoute = items.length > 0 || attente.length > 0, avail = y1 - y0, TT = 26;
            let hp = 0, hs = 0;
            if (nPax && aSoute) { hp = Math.round((avail - 2 * TT - 8) * 0.42); hs = avail - 2 * TT - 8 - hp; } else if (nPax) hp = avail - TT; else hs = avail - TT;
            const cadre = (y, h, titre) => `<text x="${PX}" y="${y - 9}" fill="#99a" font-size="12" letter-spacing="3">${E(titre)}</text><rect x="${PX}" y="${y}" width="${PWd}" height="${h}" fill="rgba(0,10,14,.7)" stroke="#00F0FF" stroke-opacity=".6"/><path d="M${PX} ${y}h22M${PX} ${y}v22M${PX + PWd} ${y + h}h-22M${PX + PWd} ${y + h}v-22" stroke="#00F0FF" stroke-width="2.5" fill="none"/>`;
            const lien = (b, y, h) => b.x1 > -1e8 ? `<path d="M${(HX + b.x1 * SC + 3).toFixed(1)} ${(HY + b.y0 * SC).toFixed(1)}L${PX} ${y}M${(HX + b.x1 * SC + 3).toFixed(1)} ${(HY + b.y1 * SC).toFixed(1)}L${PX} ${y + h}" stroke="#00F0FF" stroke-opacity=".5" stroke-dasharray="4 5" fill="none"/>` : "";
            let yc = y0 + TT;
            if (nPax) {
                zoomSvg += lien(cabB, yc, hp) + cadre(yc, hp, "PASSAGERS · " + nPax);
                const need = e => { const cell = 24 * e, cols = Math.max(1, Math.floor((PWd - 16) / cell)); return fam.reduce((t, f) => t + 15 + Math.ceil(nbF[f] / cols) * cell + 4, 0); };
                let e = 1.5; while (e > 0.4 && need(e) > hp - 12) e -= 0.05;
                const cell = 24 * e, cols = Math.max(1, Math.floor((PWd - 16) / cell)); let yy = yc + 8;
                fam.forEach(f => {
                    const c = PAS_FAM[f].c, imp = PAS_FAM[f].imp > 0;
                    zoomSvg += `<text x="${PX + 8}" y="${yy + 10}" fill="${c}" font-size="10.5">${E(nbF[f] + " " + PAS_FAM[f].l)}</text>`; yy += 15;
                    for (let i = 0; i < nbF[f]; i++) {
                        const px = PX + 8 + (i % cols) * cell + cell / 2, py = yy + Math.floor(i / cols) * cell + cell * 0.55;
                        zoomSvg += `<g transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) scale(${e.toFixed(2)})" fill="${c}"><circle cx="0" cy="-8" r="3.4"/><path d="M-5.5 -3.5 Q0 -6 5.5 -3.5 L5 5 L2 5 L1.2 11 L-1.2 11 L-2 5 L-5 5 Z"/>${imp ? `<circle r="11" cy="-1" fill="${c}" fill-opacity=".25" stroke="${c}" stroke-opacity=".8"/>` : ""}</g>`;
                    }
                    yy += Math.ceil(nbF[f] / cols) * cell + 4;
                });
                yc += hp + TT + 8;
            }
            if (aSoute) {
                const tAtt = attente.reduce((t, b) => t + b.q, 0), cT = Math.max(capT, tonnes + tAtt, 1), U2 = [1, 2, 5, 10, 20, 50, 100, 200].find(u => cT / u <= 200) || 200, N2 = Math.max(1, Math.ceil(cT / U2));
                zoomSvg += lien(rackB, yc, hs) + cadre(yc, hs, "SOUTE · 1 CASE = " + U2 + " t");
                const prop2 = []; items.forEach((x, i) => { const k = Math.max(1, Math.round((Number(x.q) || 0) / U2)); for (let j = 0; j < k && prop2.length < N2; j++) prop2.push(i); });
                const fant2 = []; attente.forEach((b, k) => { const n = Math.max(1, Math.round(b.q / U2)); for (let j = 0; j < n; j++) fant2.push(COUL_MARCH[(items.length + k) % COUL_MARCH.length]); });
                const iw = PWd - 16, ih = hs - 16; let best = null;
                for (let cols = 3; cols <= 40; cols++) { const rows = Math.ceil(N2 / cols), c = Math.min(iw / cols, ih / rows); if (!best || c > best.c + 0.01) best = { cols, rows, c }; }
                const ox = PX + 8 + (iw - best.c * best.cols) / 2, oy = yc + 8 + (ih - best.c * best.rows) / 2, c = best.c, r1 = n => n.toFixed(1);
                for (let i = 0; i < N2; i++) {
                    const x = ox + (i % best.cols) * c, y = oy + (best.rows - 1 - Math.floor(i / best.cols)) * c;
                    if (i < prop2.length) {
                        const k = prop2[i], cl = COUL_MARCH[k % COUL_MARCH.length], mis = !!items[k].m;
                        zoomSvg += `<g class="tb-c" data-l="${k}" style="color:${cl}"><rect x="${r1(x)}" y="${r1(y)}" width="${r1(c)}" height="${r1(c)}" fill="rgba(0,0,0,0)"/><rect x="${r1(x + 1.5)}" y="${r1(y + 1.5)}" width="${r1(c - 3)}" height="${r1(c - 3)}" fill="${cl}" fill-opacity=".45" stroke="${cl}" stroke-width="1.4"${mis ? ' stroke-dasharray="4 3"' : ""}/><path d="M${r1(x + 4)} ${r1(y + c / 2)}H${r1(x + c - 4)}" stroke="${cl}" stroke-opacity=".5"/></g>`;
                    } else if (i < prop2.length + fant2.length) {
                        const cl = fant2[i - prop2.length];
                        zoomSvg += `<rect x="${r1(x + 1.5)}" y="${r1(y + 1.5)}" width="${r1(c - 3)}" height="${r1(c - 3)}" fill="none" stroke="${cl}" stroke-width="1.3" stroke-dasharray="4 3"/><text x="${r1(x + c / 2)}" y="${r1(y + c / 2 + 4)}" fill="${cl}" font-size="12" font-weight="bold" text-anchor="middle">?</text>`;
                    } else zoomSvg += `<rect x="${r1(x + 1.5)}" y="${r1(y + 1.5)}" width="${r1(c - 3)}" height="${r1(c - 3)}" fill="rgba(0,240,255,.03)" stroke="rgba(0,240,255,.25)" stroke-dasharray="3 3"/>`;
                }
            }
        }
        // ---- le commandant dans le cockpit (halo, cadre au nom, trait) et son equipage : S.equipage = [{ n, g (rang de combat 0-8), r (role) }], S.chasseur = { n, pc, e : "vol" | "hangar" | "detruit" } (plugin >= 2.24)
        const fig = (x, y, sc, c) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${sc})" fill="${c}"><circle cx="0" cy="-8" r="3.4"/><path d="M-5.5 -3.5 Q0 -6 5.5 -3.5 L5 5 L2 5 L1.2 11 L-1.2 11 L-2 5 L-5 5 Z"/></g>`;
        const pil = P(sil.cockpit || [AXE, YTOP + 0.06 * Ltot]), px = pil[0], py = pil[1], bR = px - 46, bL = bR - LW, pilote = eq.findIndex(m => /fightercon/i.test(m.r || "")) >= 0 && enVol ? eq.findIndex(m => /fightercon/i.test(m.r || "")) : -1;     // le membre parti en chasseur n'est plus dans le cockpit
        let equipSvg = `<g class="tbm-pilote"><circle class="tbs-pouls" cx="${px}" cy="${py}" r="27" fill="#00F0FF" fill-opacity=".07" stroke="#00F0FF" stroke-opacity=".45"/><circle cx="${px}" cy="${py}" r="16" fill="rgba(0,240,255,.22)" stroke="#00F0FF" stroke-width="1.8" filter="url(#tbml)"/>${fig(px, py + 2, 1.35, "#aef6ff")}`
            + `<path d="M${px - 17} ${py}H${bR}" stroke="#00F0FF" stroke-width="1.6" fill="none"/><rect x="${bL}" y="${py - 12}" width="${LW}" height="24" fill="rgba(3,8,12,.92)" stroke="#00F0FF" stroke-width="1.4"/><text x="${bL + LW / 2}" y="${py + 5}" text-anchor="middle" fill="#fff" font-size="13" font-weight="bold" letter-spacing="1">${E(nomCmdr)}</text><text x="${bL + 4}" y="${py - 16}" fill="#00F0FF" font-size="8" letter-spacing="2">COMMANDANT</text>`;
        let k = 0;
        eq.forEach((m, i) => { if (i !== pilote) { const x = px + 40 + 28 * k++; equipSvg += `<circle cx="${x}" cy="${py + 2}" r="12" fill="#3DDC97" fill-opacity=".18" stroke="#3DDC97" stroke-opacity=".85"/>${fig(x, py + 4, 0.95, "#8dffc8")}`; } });
        if (enVol) { const x = px + 78, y = py - 4; equipSvg += `<path d="M${px + 20} ${py}Q${px + 50} ${py - 12} ${x - 12} ${y}" stroke="#3DDC97" stroke-opacity=".6" stroke-dasharray="3 4" fill="none"/><g transform="translate(${x} ${y}) rotate(25) scale(1.5)" fill="#8dffc8" stroke="#3DDC97"><path d="M0 -9 L7 8 L0 4 L-7 8 Z"/></g>`; }
        // fiche de l'equipage (nom, rang) sous le nom du commandant : a gauche du bord de la coque a cette hauteur, jamais sur les modules
        if (crewL.length) {
            const hC = 8 + crewL.length * 32, yC = py + 20, R = Math.min(bR, HX + (AXE - demi(ybC)) * SC - 10), xC = R - CW;
            equipSvg += `<rect x="${xC.toFixed(1)}" y="${yC}" width="${CW}" height="${hC}" fill="rgba(3,8,12,.92)" stroke="#3DDC97" stroke-opacity=".7"/>`;
            crewL.forEach((l, i) => { equipSvg += `<text x="${(xC + 8).toFixed(1)}" y="${yC + 18 + i * 32}" fill="#5ff0aa" font-size="12.5" font-weight="bold">${E(l.a)}</text>${l.b ? `<text x="${(xC + 8).toFixed(1)}" y="${yC + 32 + i * 32}" fill="#cfe9dd" font-size="11">${E(l.b)}</text>` : ""}`; });
        }
        equipSvg += "</g>";
        window.__tbmDet = dets;
        const combat = act.some(m => m.type === "massacre" || m.type === "assassinat");
        ambMaj(items.length > 0, nPax, combat);
        if (typeof SOUTE !== "undefined") { SOUTE.items = items; SOUTE.large = true; }
        const tr = `translate(${HX.toFixed(1)} ${HY}) scale(${SC.toFixed(3)})`, T = "0 0 0 0 0   0.28 0.55 0.1 0 0   0.36 0.72 0.14 0 0   0 0 0 1 0";
        if (Z.cy == null || Z.k <= 1) { Z.cx = VWd / 2; Z.cy = VH / 2; }
        Z.k = Math.max(1, Math.min(4, Z.k)); const zw = VWd / Z.k, zh = VH / Z.k; Z.cx = Math.max(zw / 2, Math.min(VWd - zw / 2, Z.cx)); Z.cy = Math.max(zh / 2, Math.min(VH - zh / 2, Z.cy));
        // encadre de valeur (option opts.valeur = { titre, txt, sub }) : fleche depuis le centre des racks de soute vers un cadre sous la coque
        let valeurSvg = "";
        const vcx = zoomOn ? Math.max(6 + 200, Math.min(HX + AXE * SC, PX - 10 - 200)) : SHW / 2;   // encadre de valeur centre sous la coque (calee a gauche quand le zoom est affiche)
        if (opts.valeur && celRack.length) {
            const cx = HX + celRack.reduce((t, q) => t + q.x + q.p / 2, 0) / celRack.length * SC, cy = HY + celRack.reduce((t, q) => t + q.y + q.p / 2, 0) / celRack.length * SC;
            const bw = 400, bh = 112, bx = vcx - bw / 2, by = VH - bh - 8;
            valeurSvg = `<g class="tbm-val"><defs><marker id="tbmval" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#FFD54A"/></marker></defs>
                <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3.2" fill="#FFD54A"/><line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${(vcx).toFixed(1)}" y2="${by - 2}" stroke="#FFD54A" stroke-width="1.6" stroke-dasharray="5 4" marker-end="url(#tbmval)"/>
                <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="rgba(3,8,12,.92)" stroke="#FFD54A" stroke-width="1.4"/>
                <text x="${vcx}" y="${by + 28}" text-anchor="middle" fill="#FFD54A" font-size="19" letter-spacing="2" stroke="none">${E(opts.valeur.titre || "VALEUR ESTIMÉE")}</text>
                <text x="${vcx}" y="${by + 72}" text-anchor="middle" fill="#fff" font-size="48" font-weight="bold" stroke="none">${E(opts.valeur.txt || "—")}</text>
                <text x="${vcx}" y="${by + 98}" text-anchor="middle" fill="#8b97a0" font-size="16" stroke="none">${E(opts.valeur.sub || "")}</text></g>`;
        }
        const svg = `<svg class="tb-svgv tbm-zoomable" data-w="${VWd}" data-h="${VH}" style="${Z.k > 1 ? "cursor:grab;" : ""}touch-action:none" viewBox="${(Z.cx - zw / 2).toFixed(1)} ${(Z.cy - zh / 2).toFixed(1)} ${zw.toFixed(1)} ${zh.toFixed(1)}" role="img" aria-label="Modules de votre vaisseau"><defs>
            <radialGradient id="tbmA" cx=".5" cy=".5" r=".8"><stop offset="0" stop-color="#FF9A1F" stop-opacity=".4"/><stop offset=".7" stop-color="#FF5A00" stop-opacity=".16"/><stop offset="1" stop-color="#FF3B00" stop-opacity=".05"/></radialGradient>
            <radialGradient id="tbmC" cx=".5" cy=".5" r=".8"><stop offset="0" stop-color="#00F0FF" stop-opacity=".3"/><stop offset="1" stop-color="#0090FF" stop-opacity=".05"/></radialGradient>
            <radialGradient id="tbmV" cx=".5" cy=".5" r=".8"><stop offset="0" stop-color="#B28DFF" stop-opacity=".3"/><stop offset="1" stop-color="#6040C0" stop-opacity=".05"/></radialGradient>
            <filter id="tbmf" x="-8%" y="-8%" width="116%" height="116%"><feGaussianBlur stdDeviation="1.3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <clipPath id="tbmq"><path transform="rotate(180 ${W / 2} ${H / 2})" d="${sil.formes[0]}"/></clipPath>
            <filter id="tbmh" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${T}"/><feComponentTransfer><feFuncG type="gamma" amplitude="1.25" exponent="1.45" offset="0"/><feFuncB type="gamma" amplitude="1.25" exponent="1.45" offset="0"/></feComponentTransfer></filter>
            <filter id="tbml"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <pattern id="tbmg" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1.4" fill="#000" opacity=".28"/></pattern>
            <linearGradient id="tbmb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#00F0FF" stop-opacity="0"/><stop offset="1" stop-color="#00F0FF" stop-opacity=".3"/></linearGradient></defs>
            <g transform="${tr}"><g transform="rotate(180 ${W / 2} ${H / 2})"><image href="${sil.img}" width="${W}" height="${H}" filter="url(#tbmh)" opacity=".5"/><rect width="${W}" height="${H}" fill="url(#tbmg)"/>
                <g filter="url(#tbml)" stroke="#00F0FF" stroke-width="1.6" fill="none" stroke-linejoin="round">${sil.formes.map(d => `<path d="${d}"/>`).join("")}</g></g>
                <g clip-path="url(#tbmq)"><g class="tbs-balai" style="--h:${Ltot}px"><rect x="${AXE - 160}" y="${YTOP - 24}" width="320" height="24" fill="url(#tbmb)"/><rect x="${AXE - 160}" y="${YTOP}" width="320" height="1.4" fill="#00F0FF" opacity=".8"/></g></g></g>
            <g transform="${tr}"><g clip-path="url(#tbmq)">${bandes}${gens}${hits}${caisses}</g></g>
            ${marqueurs}${zoomSvg}${equipSvg}${valeurSvg}</svg>`;
        if (opts._svgSeul) return svg;
        window.__tbmDerniers = { act, opts, zoomOn, cap: 1e9 };
        clearTimeout(window.__tbmT); window.__tbmT = setTimeout(() => window.__tbmAjuste && window.__tbmAjuste(), 80);
        // ---- jauge de places, synthese et legendes
        const pleine = places > 0 && nPax > places, pct = places ? Math.min(100, Math.round(nPax / places * 100)) : 0;
        const jauge = opts.jauge ? `<div class="tbp-jauge"><span>${E(opts.jauge.titre)}</span><div class="bar"><i class="${opts.jauge.n > opts.jauge.cap ? "pleine" : ""}" style="width:${opts.jauge.cap ? Math.min(100, Math.round(opts.jauge.n / opts.jauge.cap * 100)) : 0}%"></i></div><b style="color:#FFB44D">${fmtN(opts.jauge.n)}/${fmtN(opts.jauge.cap)}${opts.jauge.unite || ""}</b></div>` : nPax || places ? `<div class="tbp-jauge"><span>PLACES</span>${places ? `<div class="bar"><i class="${pleine ? "pleine" : ""}" style="width:${pct}%"></i></div><b style="color:${pleine ? "#FF3B30" : "#FFB44D"}">${nPax}/${places}</b>` : `<b style="color:#FFB44D">${nPax}</b>`}</div>` : "";
        const legI = items.map((x, i) => `<span data-i="${i}" style="--cl:${COUL_MARCH[i % COUL_MARCH.length]}"><i></i>${E(x.n)} · ${fmtN(x.q)} t${x.m ? " (mission)" : ""}</span>`).join(""), leg = Object.keys(PAS_FAM).filter(f => nbF[f]).map(f => `<span style="--cl:${PAS_FAM[f].c}"><i></i>${nbF[f]} ${PAS_FAM[f].l}${PAS_FAM[f].imp ? " (cercle)" : ""}</span>`).join("")
            + attente.map((b, k) => `<span style="--cl:${COUL_MARCH[(items.length + k) % COUL_MARCH.length]}"><i class="sq vide"></i>${E(b.n)} · ${fmtN(b.q)} t à récupérer (sauvetage)</span>`).join("")

        // ---- liste des modules et de leur ingenierie (repliee par defaut ; le survol d'une ligne allume le module dans la coque)
        const GRP = [["core", "PRIMORDIAUX"], ["arme", "POINTS D'EMPORT"], ["util", "UTILITAIRES"], ["opt", "OPTIONNELS"]];
        const rang = m => CORE.indexOf(m.slot);
        const ligneL = m => {
            const g = m.vide ? "—" : m.eng ? "G" + m.eng.niv : "STOCK", det = m.eng ? [m.eng.bp, m.eng.exp].filter(Boolean).map(E).join(" · ") + (m.eng.par ? (m.eng.bp || m.eng.exp ? " · " : "") + "<u>" + E(m.eng.par) + "</u>" : "") : "";
            const nom = m.vide ? etiqSlot(m.slot) + " · empty" : m.nom + (m.places ? " · " + m.places + " seats" : "") + (m.on ? "" : " · OFF");
            return `<div class="tbm-r${m.vide ? " vide" : ""}" data-s="${m.slot}"><b>${E(nom)}</b><span class="g${m.eng ? "" : " s"}">${g}</span>${det ? "<small>" + det + "</small>" : ""}</div>`;
        };
        const ouvert = (() => { try { return localStorage.getItem("tbm_liste") === "1"; } catch (e) { return false; } })();
        const listeHtml = GRP.map(([c, t]) => { const L = mods.filter(m => m.cat === c).sort((a, b) => c === "core" ? rang(a) - rang(b) : b.taille - a.taille || a.slot.localeCompare(b.slot)); return L.length ? `<div class="tbm-gt">${t}</div>` + L.map(ligneL).join("") : ""; }).join("");
        const v = S.vaisseau, note = (items.length && !celRack.length ? "Cargaison à bord sans rack de soute : " + fmtN(tonnes) + " t. " : "") + (attente.length ? "« ? » = colis de sauvetage à récupérer." : "");
        return `<div class="bloc holo tbp-bloc tbm-bloc"><div class="holo-balayage"></div><h2>${E(opts.titre || "MODULES DU VAISSEAU")} <em>${E(nomVaisseau(v.modele))} · ${mods.filter(m => !m.vide).length} modules${nPax ? " · " + nPax + " passager" + (nPax > 1 ? "s" : "") : ""}${tonnes ? " · " + fmtN(tonnes) + " t à bord" : ""}</em><span class="tbm-btns">${nPax || items.length || act.some(m => m.type === "massacre" || m.type === "assassinat") ? `<button type="button" class="tbm-tg${ambActive() ? " on" : ""}" data-tbmamb title="Ambiance sonore : ouvriers du dépôt, passagers (le haut-parleur du pied de page coupe tout)">♪ AMBIANCE ${ambActive() ? "ON" : "OFF"}</button>` : ""}<button type="button" class="tbm-tg${ouvert ? " on" : ""}" data-tbmlg title="Afficher les modules et leur ingénierie">MODULES ${ouvert ? "▴" : "▾"}</button></span></h2>${jauge}<div class="tb-scene" id="tb-scene" style="position:relative"><div class="tbm-zb"><button type="button" data-tbmz="out" title="Dézoomer">−</button><span class="tbm-zl">${Math.round(Z.k * 100)} %</span><button type="button" data-tbmz="in" title="Zoomer">+</button><button type="button" data-tbmz="reset" title="Vue d'ensemble">⟲</button></div>${svg}${opts.mini || ""}</div>
            <div class="tbp-leg">${leg}</div>${legI ? `<div class="tb-leg" id="tb-leg">${legI}</div>` : ""}${pleine ? `<div class="tb-sub" style="color:#FF3B30;">⚠ ${nPax - places} passager${nPax - places > 1 ? "s" : ""} de plus que de places.</div>` : ""}${note ? `<div class="tb-sub">${note}</div>` : ""}<div class="tbm-lg"${ouvert ? "" : " hidden"}>${listeHtml}</div>${opts.pied || ""}</div>`;
    };
})();
