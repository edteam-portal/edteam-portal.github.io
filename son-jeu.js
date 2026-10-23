// SONS DU JEU SUR TOUTES LES PAGES (application installee) : ambiances et sons d'evenement (passagers, soute, ventes, saut, interception, balise, eliminations), ou que l'on soit sur le site.
// FICHIER GENERE par _captures/construire_son_jeu.js : le moteur sonore est COPIE de modules-vaisseau.js (tableau de bord), qui garde le sien ; ne pas modifier a la main (modifier le moteur ou _captures/son_jeu_*.js, puis regenerer).
//
// COUT : AUCUNE connexion tant que l'option « Sons du jeu » n'est pas active DANS L'APPLICATION INSTALLEE (navigateur simple : pas de son, un message dans le pied de page) ; pas de moteur sur le tableau de bord (il a le sien).
//   Active, la page ecoute UNE seule petite ligne (table signaux_son, SQL 138 : quelques centaines d'octets, ecrite seulement quand elle change) et seulement si le jeu est en ligne
//   (lecture legere de session_live : maj_le seulement, toutes les 2 min hors ligne, 10 min en ligne). Un seul onglet ou une seule fenetre ecoute par navigateur (verrou Web Locks) : pas de son en double.
// Le son d'une page a l'autre : le moteur redemarre a chaque page (les pages sont separees) : l'ambiance reprend en fondu ; l'application installee autorise le son sans clic (a verifier : new AudioContext().state === "running").
(function () {
    "use strict";
    if (window.EdteamSonJeu) return;
    const standalone = () => !!((window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true);
    if (/tableau-de-bord/i.test(location.pathname) || !standalone()) return;      // le tableau de bord garde son moteur ; hors application : pas de son du jeu

    // etat de l'ecoute (le moteur ci-dessous le consulte : ambiance seulement tant qu'on ecoute)
    const ECOUTE = { actif: false, canal: null, uid: null, prevC: null, minuteur: null, verrou: false, premier: true };
    // mission avec des passagers a bord : transport classique, mais aussi tourisme (« Sightseeing », classee Exploration par le jeu)
    const estPassagers = m => Number(m.pas) > 0 && (m.type === "passagers" || m.type === "exploration");


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
        if (!AMB.geste && ambActive()) ambIndice(true);     // son bloque faute de clic : on previent
        if (!AMB.geste || !ambActive()) return null;     // application installee : pas de clic ni d'onglet visible exiges (le contexte audio dit s'il joue)
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
    function ambLit() { try { return AMB.geste && ambActive() && ECOUTE.actif && (AMB.c || AMB.p > 0 || AMB.k); } catch (e) { return false; } }
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
        try { if (!AMB.geste && ambActive() && ECOUTE.actif && (AMB.c || AMB.p > 0 || AMB.k)) ambIndice(true); } catch (e) {}
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


    // =====================================================================================================
    //  ECOUTE DES SIGNAUX (table signaux_son, SQL 138) : une seule ligne par pilote, lue a l'ouverture puis en temps reel
    // =====================================================================================================
    const CLE_ON = "edteam_sons_jeu";
    const prefOn = () => { try { return localStorage.getItem(CLE_ON) !== "off"; } catch (e) { return true; } };
    const db = () => window.supabaseApp || null;
    const EN_LIGNE_MS = 7 * 60 * 1000, CONTROLE_HORS_MS = 2 * 60 * 1000, CONTROLE_EN_MS = 10 * 60 * 1000;

    async function monId() {
        if (ECOUTE.uid) return ECOUTE.uid;
        const p = window.profilCommandant; if (p && p.user_id) return (ECOUTE.uid = p.user_id);
        try { const s = await db().auth.getSession(); const u = s && s.data && s.data.session && s.data.session.user; if (u) ECOUTE.uid = u.id; } catch (e) { /* pas de session */ }
        return ECOUTE.uid;
    }
    // la version reduite (s) devient un « etat de session » comme celui du tableau de bord, pour reutiliser le meme detecteur d'evenements (tbmSonsMissions)
    function etatDepuis(s) {
        s = s || {};
        return {
            missions: s.missions || [], terminees: s.terminees || [], soute: { items: [{ q: Number(s.tonnes) || 0 }] },
            registre: (s.ventes || []).map(v => ({ k: "V", t: v.t, n: v.n, q: v.q })), amarre: !!s.amarre,
            saut: s.saut || null, interception: s.interception || null, chargement: s.chargement || null, tourisme: s.tourisme || null
        };
    }
    function appliquer(row, initial) {
        if (!row) return;
        try {
            const S = etatDepuis(row.s), act = S.missions;
            window.tbmSonsMissions(S);      // premiere lecture : memorise seulement (rien n'est joue a l'ouverture d'une page)
            const nPax = act.filter(estPassagers).reduce((a, m) => a + (Number(m.pas) || 0), 0), combat = act.some(m => m.type === "massacre" || m.type === "assassinat");
            ambMaj(S.soute.items[0].q > 0, nPax, combat);
            // eliminations : meme regle que le combat du tableau de bord (nouvelle elimination, meme combat, recente)
            const c = row.c || {}, avant = ECOUTE.prevC; ECOUTE.prevC = c;
            if (!initial && avant && c.actif && avant.debut === c.debut && (c.nb || 0) > (avant.nb || 0) && (c.nb || 0) - (avant.nb || 0) <= 6 && (Date.now() - Date.parse(row.maj_c || 0)) < 30000) {
                window.tbmSonCombat("elimination", { premiere: !(avant.nb > 0) });
            }
        } catch (e) { /* un son ne doit jamais gener la page */ }
    }
    async function demarrer() {
        if (ECOUTE.canal || !prefOn()) return;
        const c = db(), uid = await monId(); if (!c || !uid) return;
        ECOUTE.actif = true;
        try { const r = await c.from("signaux_son").select("s,c,maj_s,maj_c").maybeSingle(); if (r && r.data) appliquer(r.data, true); } catch (e) { /* ligne absente : rien a jouer */ }
        if (ECOUTE.canal) return;
        try {
            ECOUTE.canal = c.channel("sons-" + uid)
                .on("postgres_changes", { event: "*", schema: "public", table: "signaux_son", filter: "user_id=eq." + uid }, p => { if (p && p.new) appliquer(p.new, false); })
                .subscribe();
        } catch (e) { ECOUTE.canal = null; }
    }
    function arreter() {
        ECOUTE.actif = false;
        try { if (ECOUTE.canal && db()) db().removeChannel(ECOUTE.canal); } catch (e) { /* deja ferme */ }
        ECOUTE.canal = null; ECOUTE.prevC = null;
        try { ambMaj(false, 0, false); } catch (e) { /* moteur non demarre */ }
    }
    // le jeu est-il en ligne ? (session_live : maj_le seulement, jamais l'etat complet)
    async function controle() {
        clearTimeout(ECOUTE.minuteur);
        let delai = CONTROLE_HORS_MS;
        try {
            if (!prefOn()) { arreter(); delai = CONTROLE_EN_MS; }
            else if (db() && await monId()) {
                const r = await db().from("session_live").select("maj_le").maybeSingle();
                const en = !!(r && r.data && Date.now() - Date.parse(r.data.maj_le) < EN_LIGNE_MS);
                if (en) { await demarrer(); delai = CONTROLE_EN_MS; } else if (ECOUTE.canal) { arreter(); }
            }
        } catch (e) { /* reessai plus tard */ }
        ECOUTE.minuteur = setTimeout(controle, delai);
    }
    // un seul onglet / une seule fenetre par navigateur joue les sons (les autres attendent : si le premier se ferme, le suivant prend le relais)
    function demarrerEcoute() {
        const go = () => {
            AMB.geste = true; ECOUTE.verrou = true;
            // au cas ou le navigateur refuserait le son sans geste : le premier clic ou la premiere touche relance le contexte audio
            const relance = () => { try { ambSync(); } catch (e) { /* moteur non demarre */ } };
            document.addEventListener("pointerdown", relance, { once: true }); document.addEventListener("keydown", relance, { once: true });
            controle();
        };      // application installee : le son demarre sans clic (le contexte audio le dira : 'running')
        if (navigator.locks && navigator.locks.request) navigator.locks.request("edteam-sons-jeu", () => { go(); return new Promise(() => { /* garde le verrou jusqu'a la fermeture de la page */ }); });
        else go();
    }
    function attendreSupabase(n) { if (db()) { demarrerEcoute(); return; } if (n > 40) return; setTimeout(() => attendreSupabase(n + 1), 500); }
    window.EdteamSonJeu = {
        actif: () => ECOUTE.actif, demarrer: () => { try { localStorage.setItem(CLE_ON, "on"); } catch (e) {} controle(); }, arreter: () => { try { localStorage.setItem(CLE_ON, "off"); } catch (e) {} arreter(); },
        etat: () => ({ ecoute: ECOUTE.actif, canal: !!ECOUTE.canal, verrou: ECOUTE.verrou, ctx: AMB.ctx ? AMB.ctx.state : null, geste: !!AMB.geste })      // diagnostic : EdteamSonJeu.etat()
    };
    attendreSupabase(0);
})();
