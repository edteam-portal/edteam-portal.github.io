// MISSION DE REPERAGE : bandeau « RENSEIGNEMENT » (page Engagement, visible de tous les pilotes de l'escadron) + route de reperage en plein ecran.
// Principe : les systemes dont la donnee (EDSM / Spansh / pilote) depasse un AGE LIMITE, reglable par l'Amiral, sont listes (fonction serveur reperage_liste, script SQL 121). Un pilote qui ARRIVE dans l'un d'eux
// l'actualise pour tout l'escadron (plugin 2.43) : le systeme sort de la liste de tous les autres. Aucune extrapolation : age, motif et risque connu (permis, anarchie, guerre Thargoid) seulement.
// Les listes sont gardees 5 minutes en memoire (egress). Chargee a la demande par campagnes.js.
(function () {
    "use strict";
    if (window.EdteamReperage) return;
    const E = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const MOTIFS = { DIRECTIVE: ["DIRECTIVE", "#FF7100"], EXPANSION: ["EXPANSION", "#ff4fd8"], CONQUETE: ["CONQUÊTE", "#ff9a1f"], PLACE_LIBRE: ["PLACE LIBRE", "#00F0FF"], INSTALLATION: ["INSTALLATION", "#FFD23F"] };
    const ORDRE_MOTIFS = ["DIRECTIVE", "EXPANSION", "CONQUETE", "PLACE_LIBRE", "INSTALLATION"];
    const RISQUES = { ANARCHIE: "ANARCHIE", THARGOID: "THARGOÏDES" };
    let memo = null, enCours = null, pos = null;

    function age(h) { return h == null ? "âge inconnu" : h < 48 ? Math.round(h) + " h" : Math.round(h / 24) + " j"; }
    function depuis(epoch) { const h = (Date.now() / 1000 - Number(epoch)) / 3600; return h < 1 ? "il y a " + Math.max(1, Math.round(h * 60)) + " min" : h < 48 ? "il y a " + Math.round(h) + " h" : "il y a " + Math.round(h / 24) + " j"; }
    const nom = s => String(s || "").toUpperCase();
    const COUL_RES = { up: "#2fe07a", dn: "#ff4d4d", fl: "#4DA3FF" };
    // directive : couleur du resultat, comme sur la carte galactique (rouge / bleu / vert) ; les autres motifs gardent leur couleur
    const couleurDir = it => COUL_RES[(window.__edtResDirectives || {})[String(it.s || "").toUpperCase()]] || COUL_RES.fl;
    const couleurMotif = it => { const m = it.m || []; if (m.indexOf("DIRECTIVE") >= 0) return couleurDir(it); return (MOTIFS[ORDRE_MOTIFS.find(k => m.indexOf(k) >= 0)] || ["", "#00F0FF"])[1]; };
    const moi = () => window.profilCommandant || {};
    const db = () => window.supabaseApp || (typeof supabaseApp !== "undefined" ? supabaseApp : null);
    const estAmiral = () => !!(moi().est_amiral || moi().est_directeur);
    const estDirecteur = () => !!moi().est_directeur;      // seul le directeur definit les parametres du reperage (l'Amiral peut ecarter des systemes)

    async function charger(force) {
        if (!force && memo && Date.now() - memo.t < 300000) return memo.d;
        if (enCours) return enCours;
        enCours = (async () => {
            try {
                const r = await db().rpc("reperage_liste");
                if (r.error || !r.data) { return memo ? memo.d : null; }
                memo = { t: Date.now(), d: r.data }; return r.data;
            } catch (e) { return memo ? memo.d : null; }
            finally { enCours = null; }
        })();
        return enCours;
    }
    // ma position (ma propre ligne de session_live : jamais celle d'un autre pilote)
    async function maPosition() {
        if (pos && Date.now() - pos.lu < 60000) return pos.v;
        try {
            const uid = moi().user_id; if (!uid || !db()) return null;
            const r = await db().from("session_live").select("pos:etat->pos,systeme:etat->>systeme").eq("user_id", uid).maybeSingle();
            const d = r && r.data; const v = d && Array.isArray(d.pos) && d.pos.length === 3 ? { x: Number(d.pos[0]), y: Number(d.pos[1]), z: Number(d.pos[2]), systeme: d.systeme || "" } : null;
            pos = { lu: Date.now(), v }; return v;
        } catch (e) { return null; }
    }
    // seuls les systemes a rayon_max_al ou moins de la position du pilote (a defaut : du centre de la zone principale, mediane des coordonnees) sont proposes ; le reste est compte a part
    function filtrer(d, p) {
        const rayon = Number((d.reglages || {}).rayon_max_al) || 500, items = d.items || [], avec = items.filter(i => i.x != null && i.y != null && i.z != null);
        let ref = p ? { x: p.x, y: p.y, z: p.z } : null;
        if (!ref && avec.length) { const med = k => { const a = avec.map(i => Number(i[k])).sort((u, v) => u - v); return a[Math.floor(a.length / 2)]; }; ref = { x: med("x"), y: med("y"), z: med("z") }; }
        const loin = ref ? avec.filter(i => Math.hypot(i.x - ref.x, i.y - ref.y, i.z - ref.z) > rayon) : [];
        const noms = new Set(loin.map(i => i.s));
        return { items: items.filter(i => !noms.has(i.s)), loin: loin.length, rayon, depuisPosition: !!p };
    }
    // route : le CHEMIN LE PLUS COURT (temps de vol). On part de ma position (sinon du plus urgent), on va chaque fois au plus proche, puis on defait les croisements (2-opt : on inverse un troncon
    // tant que cela raccourcit le trajet). L'urgence ne change plus l'ordre ; les systemes sans coordonnees sont a la fin.
    function route(items, depart) {
        const avec = items.filter(i => i.x != null && i.y != null && i.z != null), sans = items.filter(i => i.x == null || i.y == null || i.z == null);
        const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
        const reste = avec.slice(), ordre = [];
        let cur = depart ? { x: depart.x, y: depart.y, z: depart.z } : null;
        if (!cur && reste.length) { let bi = 0; reste.forEach((it, i) => { if ((Number(it.r) || 0) > (Number(reste[bi].r) || 0)) bi = i; }); ordre.push(reste.splice(bi, 1)[0]); cur = ordre[0]; }
        while (reste.length) {
            let bi = 0, bd = Infinity;
            reste.forEach((it, i) => { const dist = d(cur, it); if (dist < bd) { bd = dist; bi = i; } });
            const it = reste.splice(bi, 1)[0]; ordre.push(it); cur = it;
        }
        // 2-opt sur le chemin ouvert (le point de depart reste fixe)
        const P = (depart ? [{ x: depart.x, y: depart.y, z: depart.z, _dep: true }] : []).concat(ordre), n = P.length;
        for (let passe = 0, mieux = true; mieux && passe < 60; passe++) {
            mieux = false;
            for (let i = 1; i < n - 1; i++) for (let j = i + 1; j < n; j++) {
                const apres = j < n - 1;
                const delta = d(P[i - 1], P[j]) + (apres ? d(P[i], P[j + 1]) : 0) - d(P[i - 1], P[i]) - (apres ? d(P[j], P[j + 1]) : 0);
                if (delta < -1e-9) { for (let a = i, b = j; a < b; a++, b--) { const t = P[a]; P[a] = P[b]; P[b] = t; } mieux = true; }
            }
        }
        const res = []; let total = 0, prev = depart ? P[0] : null;
        P.filter(p => !p._dep).forEach(it => { const leg = prev ? d(prev, it) : null; if (leg != null) total += leg; res.push(Object.assign({}, it, { leg })); prev = it; });
        sans.forEach(it => res.push(Object.assign({}, it, { leg: null })));
        return { etapes: res, total };
    }
    function copier(texte, el) {
        const fin = ok => { if (el) { const t = el.textContent; el.textContent = ok ? "COPIÉ ✓" : "COPIE IMPOSSIBLE"; setTimeout(() => { el.textContent = t; }, 1600); } };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texte).then(() => fin(true), () => fin(false));
        else { try { const a = document.createElement("textarea"); a.value = texte; a.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(a); a.select(); const ok = document.execCommand("copy"); a.remove(); fin(ok); } catch (e) { fin(false); } }
    }

    function css() {
        if (document.getElementById("rp-css")) return; const s = document.createElement("style"); s.id = "rp-css";
        s.textContent = [
            ".rp-bande { margin:0 0 14px; } .rp-bande .rp-tete { display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; } .rp-bande .rp-contenu { display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:20px; align-items:center; }",
            ".rp-gros { font-size:2.3em; color:#fff; line-height:1; } .rp-gros small { display:block; font-size:.34em; color:#889; letter-spacing:2px; margin-top:5px; } .rp-gros.ok { color:#2fe07a; }",
            ".rp-chips { display:flex; gap:8px; flex-wrap:wrap; } .rp-chip { border:1px solid #2a3540; background:#0b0f13; padding:6px 11px; display:flex; gap:8px; align-items:center; font-size:.85em; } .rp-chip i { width:9px; height:9px; border-radius:50%; background:var(--c); flex:none; } .rp-chip b { color:#fff; letter-spacing:2px; } .rp-chip span { color:#889; font-size:.9em; }",
            ".rp-barre { height:6px; background:#111; margin-top:8px; position:relative; } .rp-barre i { position:absolute; left:0; top:0; bottom:0; background:linear-gradient(90deg,#007a85,#00F0FF); } .rp-sous { color:#889; font-size:.78em; margin-top:5px; }",
            ".rp-btn { background:rgba(0,240,255,.1); border:1px solid #00F0FF; color:#00F0FF; padding:10px 18px; font-family:inherit; letter-spacing:3px; font-weight:bold; cursor:pointer; white-space:nowrap; } .rp-btn:hover { background:#00F0FF; color:#001418; } .rp-btn.gris { background:transparent; border-color:#555; color:#aaa; } .rp-btn.gris:hover { background:#aaa; color:#000; } .rp-btn.pt { padding:6px 12px; letter-spacing:2px; font-size:.82em; }",
            ".rp-env { position:relative; display:inline-flex; align-items:center; gap:11px; background:rgba(255,51,51,.07); border:1px solid #6a3a3a; padding:4px 16px 4px 6px; margin:0; font-family:inherit; color:#fff; cursor:pointer; text-align:left; letter-spacing:2px; animation:rpHalo 3.4s ease-in-out infinite; } .rp-env:hover { background:rgba(255,51,51,.16); border-color:#ff7b7b; } .rp-env b { display:block; font-weight:normal; font-size:.98em; letter-spacing:2px; } .rp-env small { display:block; color:#9a8a8a; font-size:.72em; letter-spacing:2px; margin-top:2px; } .rp-env.ok { animation:none; border-color:#2a4a36; background:rgba(47,224,122,.06); } .rp-env.ok b { color:#7fe07f; }",
            ".rp-envav { position:relative; display:inline-flex; flex:none; } .rp-mail { position:absolute; right:-7px; bottom:-5px; width:21px; height:21px; border-radius:50%; background:#00F0FF; color:#001418; display:flex; align-items:center; justify-content:center; box-shadow:0 0 0 2px #05080c; animation:rpMail 2.6s ease-in-out infinite; } .rp-mail svg { width:13px; height:13px; display:block; } .rp-env.ok .rp-mail { background:#2fe07a; animation:none; }",
            "@keyframes rpHalo { 0%,100% { box-shadow:0 0 0 rgba(255,120,60,0); } 50% { box-shadow:0 0 14px rgba(255,120,60,.38); } } @keyframes rpMail { 0%,100% { transform:scale(1); opacity:.72; } 50% { transform:scale(1.13); opacity:1; } } @media (prefers-reduced-motion:reduce) { .rp-env, .rp-mail { animation:none; } }",
            ".rp-env { background:linear-gradient(90deg,rgba(0,240,255,.14),rgba(0,240,255,.05)); border-color:#00c8d6; overflow:visible; animation:rpPulse 2.2s ease-in-out infinite; } .rp-env:hover { background:rgba(0,240,255,.24); border-color:#00F0FF; }",
            ".rp-env::after { content:''; position:absolute; inset:0; pointer-events:none; background:linear-gradient(100deg,transparent 40%,rgba(255,255,255,.3) 50%,transparent 60%); background-size:300% 100%; background-position:100% 0; animation:rpBalai 3.6s ease-in-out infinite; } .rp-env b { color:#fff; text-shadow:0 0 10px rgba(0,240,255,.55); animation:rpTexte 2.2s ease-in-out infinite; } .rp-env small { color:#8fd9e0; }",
            ".rp-env .ph { --pc:#00F0FF; --pt:#9be8ff; --pf1:#0a3a40; --pf2:#04151a; } .rp-mail { background:#00F0FF; animation:rpEnveloppe 2.4s ease-in-out infinite; transform-origin:50% 60%; } .rp-mail::before { content:''; position:absolute; inset:-3px; border-radius:50%; border:2px solid #00F0FF; opacity:0; animation:rpOnde 2.4s ease-out infinite; pointer-events:none; }",
            ".rp-env.ok, .rp-env.ok::after, .rp-env.ok b, .rp-env.ok .rp-mail, .rp-env.ok .rp-mail::before { animation:none; } .rp-env.ok { background:rgba(47,224,122,.06); border-color:#2a4a36; } .rp-env.ok::after { display:none; } .rp-env.ok b { text-shadow:none; color:#7fe07f; } .rp-env.ok .ph { --pc:#2fe07a; }",
            "@keyframes rpPulse { 0%,100% { box-shadow:0 0 0 rgba(0,240,255,0); } 50% { box-shadow:0 0 22px rgba(0,240,255,.55), inset 0 0 14px rgba(0,240,255,.14); } } @keyframes rpBalai { 0%,55% { background-position:100% 0; } 100% { background-position:0% 0; } } @keyframes rpTexte { 0%,100% { opacity:.85; } 50% { opacity:1; } }",
            "@keyframes rpEnveloppe { 0%,55%,100% { transform:scale(1) rotate(0); } 62% { transform:scale(1.22) rotate(-14deg); } 70% { transform:scale(1.22) rotate(12deg); } 78% { transform:scale(1.15) rotate(-8deg); } 86% { transform:scale(1.08) rotate(4deg); } } @keyframes rpOnde { 0% { transform:scale(.8); opacity:.9; } 70%,100% { transform:scale(2.3); opacity:0; } }",
            "@media (prefers-reduced-motion:reduce) { .rp-env, .rp-env::after, .rp-env b, .rp-mail, .rp-mail::before { animation:none !important; } }",
            "#rp-modale .rp-mh .rp-btn.msg { border-color:#00F0FF; color:#7fe9f2; background:rgba(0,240,255,.08); } #rp-modale .rp-mh .rp-btn.msg:hover { background:#00F0FF; color:#001418; } #rp-modale .rp-msgbox { flex-basis:100%; } #rp-modale .rp-msgbox .rp-msg { margin-top:2px; }",
            ".rp-off { border:1px solid #ffb000; background:rgba(255,176,0,.1); color:#ffd166; padding:10px 12px; font-size:.85em; line-height:1.6; letter-spacing:.5px; }",
            "#rp-modale .rp-mode { display:flex; align-items:center; gap:8px; margin:6px 0 4px; font-size:.85em; cursor:pointer; } #rp-modale .rp-mode b { color:#fff; letter-spacing:2px; font-weight:normal; } #rp-modale .rp-mode small { color:#889; } #rp-modale .rp-champs input:disabled { opacity:.5; cursor:not-allowed; }",
            ".rp-regles { border:1px solid #1d3a40; background:rgba(0,240,255,.04); padding:9px 12px; font-size:.82em; line-height:1.6; } #rp-modale .rp-rg-t { color:#7fe9f2; letter-spacing:3px; font-size:.78em; margin-bottom:3px; } #rp-modale .rp-rg-l b:first-child { color:#00F0FF; margin-right:4px; } #rp-modale .rp-rg-l b { color:#fff; font-weight:normal; } #rp-modale .rp-rg-m { margin-top:5px; padding-top:5px; border-top:1px dashed #1d3a40; color:#9be8ff; letter-spacing:1px; } #rp-modale .rp-rg-m b { color:#fff; }",
            ".rp-msg { display:grid; grid-template-columns:auto minmax(0,1fr); gap:18px; align-items:start; margin-top:12px; } .rp-logo { display:inline-flex; align-items:center; justify-content:center; box-sizing:border-box; border-radius:50%; border:1px solid #00F0FF; background:radial-gradient(circle at 50% 35%,#0e2a30,#04090c); padding:18%; flex:none; } .rp-logo svg { width:100%; height:100%; display:block; } .rp-msg .rp-logo { box-shadow:0 0 18px rgba(0,240,255,.3); } .rp-msg .rp-grade { text-align:center; color:#7fe9f2; font-size:.68em; letter-spacing:3px; margin-top:6px; }",
            ".rp-parole { border:1px solid #1d3a40; border-left:3px solid #00F0FF; background:linear-gradient(90deg,rgba(0,240,255,.08),rgba(0,0,0,0) 70%); padding:12px 18px; color:#cfd8dc; line-height:1.75; font-size:.92em; } .rp-parole .rp-de { color:#7fe9f2; letter-spacing:3px; font-size:.74em; margin-bottom:6px; } .rp-parole b { color:#fff; font-weight:normal; letter-spacing:.5px; } .rp-parole em { color:#00F0FF; font-style:normal; } .rp-parole .rp-sig { margin-top:8px; color:#889; font-size:.8em; letter-spacing:2px; }",
            ".rp-ops { display:grid; grid-template-columns:auto minmax(0,1fr) auto auto; gap:20px; align-items:center; margin-top:14px; padding-top:14px; border-top:1px dashed #1f2b33; } .rp-agents { display:flex; flex-direction:column; gap:6px; align-items:flex-start; } .rp-agents .rp-pile { display:flex; align-items:center; } .rp-agents .rp-pile .ph { margin-left:-9px; box-shadow:0 0 0 2px #05080c; } .rp-agents .rp-pile .ph:first-child { margin-left:0; } .rp-agents .rp-pile span.plus { margin-left:8px; color:#889; font-size:.8em; } .rp-agents small { color:#889; letter-spacing:2px; font-size:.68em; } .rp-agents .vide { color:#667; font-size:.8em; max-width:190px; line-height:1.4; }",
            "@media (max-width:900px) { .rp-bande .rp-contenu, .rp-ops { grid-template-columns:1fr; } .rp-msg { grid-template-columns:1fr; } .rp-msg .rp-portrait { display:flex; align-items:center; gap:12px; } .rp-msg .rp-grade { margin:0; } }",
            "#rp-modale { position:fixed; inset:0; z-index:9650; display:flex; align-items:center; justify-content:center; padding:14px; background:radial-gradient(circle at 50% 40%,rgba(0,240,255,.12),rgba(0,0,0,.95) 62%); backdrop-filter:blur(5px); font-family:inherit; }",
            "#rp-modale .rp-boite { position:relative; width:min(98vw,1240px); height:min(94vh,860px); display:grid; grid-template-columns:minmax(0,1.15fr) minmax(0,1fr); grid-template-rows:auto minmax(0,1fr); background:rgba(4,8,12,.98); border:1px solid #00F0FF; box-shadow:0 0 50px rgba(0,240,255,.25); color:#cfd3d8; }",
            "#rp-modale .rp-mh { grid-column:1/3; padding:14px 62px 14px 22px; border-bottom:1px solid rgba(0,240,255,.25); display:flex; justify-content:space-between; align-items:center; gap:14px; flex-wrap:wrap; } #rp-modale .rp-mh h3 { margin:0; color:#fff; letter-spacing:4px; font-size:1.25em; } #rp-modale .rp-mh span { color:#00F0FF; letter-spacing:2px; font-size:.8em; }",
            "#rp-modale .rp-liste { padding:14px 18px; overflow-y:auto; border-right:1px solid rgba(0,240,255,.18); display:flex; flex-direction:column; gap:7px; } #rp-modale .rp-droite { padding:14px 18px; overflow-y:auto; display:flex; flex-direction:column; gap:12px; }",
            "#rp-modale .rp-lg { display:grid; grid-template-columns:30px minmax(0,1fr) 70px 62px; gap:10px; align-items:center; border:1px solid #1f2b33; border-left:3px solid var(--c,#00F0FF); background:#0a0e12; padding:8px 10px; cursor:pointer; } #rp-modale .rp-lg:hover { background:#0e141a; }",
            "#rp-modale .rp-lg.rp-ami { grid-template-columns:30px minmax(0,1fr) 70px 62px 34px; } #rp-modale .rp-ign { background:transparent; border:1px solid #5a4a2a; color:#ffd166; width:30px; height:30px; cursor:pointer; font-family:inherit; font-size:1em; } #rp-modale .rp-ign:hover { background:#ffd166; color:#000; }",
            "#rp-modale .rp-ig { display:flex; justify-content:space-between; align-items:center; gap:10px; padding:6px 0; border-top:1px dashed #2a3a44; font-size:.85em; } #rp-modale .rp-ig b { color:#fff; letter-spacing:2px; } #rp-modale .rp-ig small { display:block; color:#889; font-size:.82em; margin-top:2px; }",
            "#rp-modale .rp-n { width:26px; height:26px; border-radius:50%; border:1px solid var(--c,#00F0FF); color:var(--c,#00F0FF); display:flex; align-items:center; justify-content:center; font-size:.8em; } #rp-modale .rp-nm b { color:#fff; letter-spacing:2px; } #rp-modale .rp-nm small { display:block; color:#889; font-size:.78em; margin-top:3px; line-height:1.45; }",
            "#rp-modale .rp-tag { display:inline-block; border:1px solid var(--c); color:var(--c); padding:0 6px; font-size:.7em; letter-spacing:1px; margin-right:5px; } #rp-modale .rp-tag.risque { --c:#ffd166; }",
            "#rp-modale .rp-age { text-align:right; color:#ff8a8a; font-size:.82em; } #rp-modale .rp-dist { color:#9be8ff; text-align:right; font-size:.82em; }",
            "#rp-modale .rp-lg.rp-fait { grid-template-columns:40px minmax(0,1fr) auto; background:#0a0d10; border-left-color:#3a4650; border-style:solid; border-color:#1a2229; cursor:default; } #rp-modale .rp-fait .rp-nm { filter:grayscale(1); opacity:.6; } #rp-modale .rp-fait .rp-nm b { color:#8a949c; } #rp-modale .rp-fait .rp-av { display:flex; }",
            "#rp-modale .rp-tampon { color:#2fe07a; border:2px solid #2fe07a; padding:2px 12px; font-weight:bold; letter-spacing:4px; font-size:.85em; transform:rotate(-6deg); opacity:.88; box-shadow:inset 0 0 0 1px rgba(47,224,122,.35); text-shadow:0 0 6px rgba(47,224,122,.35); white-space:nowrap; } #rp-modale .rp-sep { margin-top:8px; color:#667; letter-spacing:3px; font-size:.7em; }",
            "#rp-modale .rp-prochain { margin-top:6px; border:1px solid #00F0FF; background:rgba(0,240,255,.07); padding:10px 14px; display:flex; justify-content:space-between; align-items:center; gap:10px; } #rp-modale .rp-prochain b { color:#fff; font-size:1.15em; letter-spacing:3px; } #rp-modale .rp-prochain small { display:block; color:#889; letter-spacing:2px; font-size:.7em; }",
            "#rp-modale .rp-svg { width:100%; height:auto; display:block; background:radial-gradient(ellipse at 50% 45%,#0b1722 0%,#05080c 70%); border:1px solid #16303d; } #rp-modale .rp-svg text { font-family:inherit; }",
            "#rp-modale .rp-reg { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; font-size:.78em; color:#9ab; } #rp-modale .rp-reg div { border:1px dashed #2a3a44; padding:7px 9px; } #rp-modale .rp-reg b { display:block; color:#00F0FF; letter-spacing:2px; font-size:.85em; }",
            "#rp-modale .rp-note { color:#778; font-size:.78em; line-height:1.6; } #rp-modale .rp-x { position:absolute; top:10px; right:14px; z-index:2; background:transparent; border:1px solid #555; color:#aaa; width:34px; height:34px; cursor:pointer; font-family:inherit; } #rp-modale .rp-x:hover { color:#00F0FF; border-color:#00F0FF; }",
            "#rp-modale .rp-tout { text-align:center; padding:26px 10px; border:1px dashed #2fe07a; color:#7fe07f; letter-spacing:3px; } #rp-modale .rp-reglages { border:1px solid #3a4a55; padding:10px 12px; } #rp-modale .rp-reglages h4 { margin:0 0 8px; color:#FF7100; letter-spacing:3px; font-size:.78em; font-weight:normal; }",
            "#rp-modale .rp-champs { display:grid; grid-template-columns:1fr 90px; gap:6px 10px; align-items:center; font-size:.82em; } #rp-modale .rp-champs input[type=number] { background:#0a0f14; border:1px solid #3a4a55; color:#fff; font-family:inherit; padding:4px 6px; width:100%; }",
            "@media (max-width:900px) { #rp-modale .rp-boite { grid-template-columns:1fr; grid-template-rows:auto auto minmax(0,1fr); height:96vh; overflow-y:auto; } #rp-modale .rp-mh { grid-column:1; } #rp-modale .rp-liste { border-right:0; overflow:visible; } #rp-modale .rp-reg { grid-template-columns:1fr; } }"
        ].join("\n");
        document.head.appendChild(s);
    }

    // ---- le bandeau ----
    async function monter(el) {
        css(); if (!el || !el.isConnected) return;
        const d = await charger(false); if (!el.isConnected) return;
        if (!d) { el.innerHTML = ""; return; }
        const fl = filtrer(d, await maPosition()); if (!el.isConnected) return;
        const items = fl.items, faits = d.faits || [], actif = !d.reglages || d.reglages.actif !== false, total = items.length + faits.length;
        if (!actif) { el.innerHTML = estAmiral() ? "<button type=\"button\" class=\"rp-env ok\" data-rp=\"ouvrir\" style=\"padding:9px 16px;\"><b style=\"color:#aaa;\">⚙ REPÉRAGE DÉSACTIVÉ</b></button>" : ""; brancher(el); return; }
        await photos(); if (!el.isConnected) return;
        const lib = items.length ? items.length + " SYSTÈME" + (items.length > 1 ? "S" : "") + " À REPÉRER" : "TOUT EST À JOUR";
        el.innerHTML = "<button type=\"button\" class=\"rp-env" + (items.length ? "" : " ok") + "\" data-rp=\"ouvrir\" title=\"Message d’EDTEAM : renseignement et route de repérage\" aria-label=\"Message d’EDTEAM : " + lib + "\">"
            + "<span class=\"rp-envav\">" + logo(38) + "<i class=\"rp-mail\">" + ENVELOPPE + "</i></span><span><b>" + lib + "</b><small>MESSAGE D’EDTEAM · ESPIONNAGE</small></span></button>";
        brancher(el);
    }
    const ENVELOPPE = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"2\"/><path d=\"M3 7l9 6 9-6\"/></svg>";
    let msgOuvert = false, ecartesOuvert = false;
    // le logo d'EDTEAM (celui de l'en-tete du site) dans une pastille ronde : l'expediteur du message
    const logo = t => "<span class=\"rp-logo\" style=\"width:" + t + "px; height:" + t + "px;\"><svg viewBox=\"0 0 100 100\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><polygon points=\"48,15 15,35 30,50 10,70 48,85 48,65 30,55 48,40\" fill=\"#00F0FF\"/><polygon points=\"52,15 85,35 70,50 90,70 52,85 52,65 70,55 52,40\" fill=\"#FF7100\"/><polygon points=\"50,45 42,55 50,65 58,55\" fill=\"#FFFFFF\" opacity=\"0.9\"/></svg></span>";
    async function photos() { const P = window.EDTEAMPhotos; try { if (P && P.charger) await P.charger(false); } catch (e) { /* sans photos : initiales */ } }
    const avatar = (n, t, role) => window.EDTEAMPhotos ? window.EDTEAMPhotos.avatar({ nom: n, role: role || "pilote", taille: t }) : "";
    // le message de l'Amiral (rédigé pour l'espionnage) : replié par défaut dans la fenêtre
    function messageAmiral(d) {
        return "<div class=\"rp-msg\"><div class=\"rp-portrait\">" + logo(74) + "<div class=\"rp-grade\">EDTEAM</div></div><div class=\"rp-parole\"><div class=\"rp-de\">MESSAGE D’EDTEAM · OPÉRATION ESPIONNAGE</div>"
            + "Pilotes, les outils en ligne que l’escadron utilise (EDSM, Spansh) ont <b>des heures, parfois des jours de retard</b> sur ce qui se passe vraiment dans vos systèmes. Une directive mal informée est une directive perdue. "
            + "Alors EDTEAM passe à l’<em>espionnage</em> : <b>chaque pilote peut y prendre part</b>, et il n’y a que <b>deux façons</b> de gagner <b>1 point BGS</b> (et 1 point pour la distinction <em>L’ESPION</em>) :"
            + "<br><b>1.</b> arriver dans un système de la liste : un simple saut suffit, inutile de s’y poser. EDTEAM relève ce que voit votre jeu et le système sort de la liste pour tout l’escadron ;"
            + "<br><b>2.</b> scanner un joueur d’un autre escadron, dans l’onglet Combat du tableau de bord."
            + "<br>Prenez la <em>route de repérage</em> : elle vous mène du plus urgent au plus proche. Ce n’est pas une course : le but est que <b>tous</b> les systèmes soient à jour. La liste repart à zéro à chaque tick.<div class=\"rp-sig\">— L’ÉQUIPE EDTEAM · BONS SAUTS, PILOTES. O7</div></div></div>";
    }
    // les deux façons de gagner des points + le compteur personnel
    function regles(d) {
        const m = d.mes, n = x => Number(x) || 0;
        return "<div class=\"rp-regles\"><div class=\"rp-rg-t\">COMMENT GAGNER DES POINTS</div>"
            + "<div class=\"rp-rg-l\"><b>1.</b> Arriver dans un système de la liste ci-dessous : <b>+1 point BGS</b> · +1 L’ESPION</div>"
            + "<div class=\"rp-rg-l\"><b>2.</b> Scanner un joueur d’un autre escadron (onglet Combat du tableau de bord) : <b>+1 point BGS</b> · +1 L’ESPION</div>"
            + (m ? "<div class=\"rp-rg-m\">TES ACTIONS L’ESPION : <b>" + n(m.actions) + "</b> · " + n(m.reperages) + " système" + (n(m.reperages) > 1 ? "s" : "") + " repéré" + (n(m.reperages) > 1 ? "s" : "") + " · " + n(m.scans) + " joueur" + (n(m.scans) > 1 ? "s" : "") + " scanné" + (n(m.scans) > 1 ? "s" : "") + (n(m.depuis_tick) ? " · " + n(m.depuis_tick) + " depuis le dernier tick" : "") + "</div>" : "")
            + "</div>";
    }
    // avancement : barre de repérage, agents sur le terrain (avatars des pilotes qui ont releve un systeme ces dernieres 24 h)
    function synthese(d, items, faits) {
        const total = items.length + faits.length, pct = total ? Math.round(100 * faits.length / total) : 100, dernier = faits[0];
        const ligneProg = faits.length ? faits.length + " repéré" + (faits.length > 1 ? "s" : "") + " depuis le dernier tick" + (total ? " sur " + total : "") + (dernier ? " · dernier : " + (dernier.par ? "CMDR " + E(nom(dernier.par)) : "un pilote") + " " + depuis(dernier.vu) : "") : "Aucun repérage depuis le dernier tick";
        const agents = []; faits.forEach(f => { if (f.par && agents.indexOf(nom(f.par)) < 0) agents.push(nom(f.par)); });
        const pile = agents.length ? "<div class=\"rp-pile\">" + agents.slice(0, 8).map(n => avatar(n, 34)).join("") + (agents.length > 8 ? "<span class=\"plus\">+" + (agents.length - 8) + "</span>" : "") + "</div><small>" + agents.length + " AGENT" + (agents.length > 1 ? "S" : "") + " SUR LE TERRAIN · DEPUIS LE TICK</small>" : "<div class=\"vide\" style=\"max-width:none;\">Aucun agent sur le terrain depuis le dernier tick. Soyez le premier.</div>";
        return "<div style=\"border:1px solid #1f2b33; background:#0a0e12; padding:10px 12px; display:grid; grid-template-columns:minmax(0,1fr) auto; gap:16px; align-items:center;\"><div><div style=\"display:flex; align-items:baseline; gap:12px;\"><span class=\"rp-gros\" style=\"font-size:1.7em;\">" + items.length + "</span><span style=\"color:#889; letter-spacing:2px; font-size:.72em;\">À REPÉRER</span></div><div class=\"rp-barre\"><i style=\"width:" + pct + "%\"></i></div><div class=\"rp-sous\">" + ligneProg + ((d.ignores || []).length ? " · " + d.ignores.length + " système" + (d.ignores.length > 1 ? "s" : "") + " écarté" + (d.ignores.length > 1 ? "s" : "") + " par l’Amiral" : "") + "</div></div><div class=\"rp-agents\">" + pile + "</div></div>";
    }
    function brancher(el) { el.querySelectorAll("[data-rp=ouvrir]").forEach(b => b.onclick = () => ouvrir()); }

    // ---- la route ----
    async function ouvrir() {
        if (document.getElementById("rp-modale")) return; css();
        const d = await charger(true); let p = await maPosition(); if (!d) return; await photos();
        const ov = document.createElement("div"); ov.id = "rp-modale"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "Route de repérage");
        document.body.appendChild(ov);
        const fermer = () => { document.removeEventListener("keydown", cl); ov.remove(); }; const cl = e => { if (e.key === "Escape") fermer(); };
        document.addEventListener("keydown", cl); ov.addEventListener("click", e => { if (e.target === ov) fermer(); });
        // dd : donnees ; pp : nouvelle position (facultatif) : la position et le defilement sont conserves a chaque redessin
        const dessiner = (dd, pp) => {
            if (pp !== undefined) p = pp;
            const g = ov.querySelector(".rp-liste"), dr = ov.querySelector(".rp-droite"), sg = g ? g.scrollTop : 0, sd = dr ? dr.scrollTop : 0;
            ov.innerHTML = vue(dd, p); brancherModale(ov, dd, p, fermer, dessiner);
            const g2 = ov.querySelector(".rp-liste"), d2 = ov.querySelector(".rp-droite"); if (g2) g2.scrollTop = sg; if (d2) d2.scrollTop = sd;
        };
        dessiner(d);
        // la fenetre suit le pilote : toutes les 45 s la liste et la position sont relues (sauf pendant la saisie d'un champ)
        const iv = setInterval(async () => {
            const m = document.getElementById("rp-modale"); if (!m) { clearInterval(iv); return; }
            if (document.hidden) return;   // onglet cache : aucune lecture (la liste se rafraichit au tour suivant apres le retour)
            const a = document.activeElement; if (a && m.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
            memo = null; pos = null; const n = await charger(true), np = await maPosition();
            if (n && document.getElementById("rp-modale")) dessiner(n, np);
        }, 45000);
    }
    function vue(d, p) {
        const fl = filtrer(d, p), items = fl.items, faits = d.faits || [], rt = route(items, p), r = d.reglages || {};
        const ligne = (it, i) => {
            const c = couleurMotif(it);
            return "<div class=\"rp-lg" + (estAmiral() ? " rp-ami" : "") + "\" style=\"--c:" + c + "\" data-s=\"" + E(it.s) + "\" title=\"Cliquer : copier le nom\"><span class=\"rp-n\">" + (i + 1) + "</span><div class=\"rp-nm\"><b>" + E(it.s) + "</b><small>"
                + ORDRE_MOTIFS.filter(m => (it.m || []).indexOf(m) >= 0).map(m => "<i class=\"rp-tag\" style=\"--c:" + (m === "DIRECTIVE" ? couleurDir(it) : MOTIFS[m][1]) + "\">" + MOTIFS[m][0] + "</i>").join("") + (it.k && RISQUES[it.k] ? "<i class=\"rp-tag risque\">⚠ " + RISQUES[it.k] + "</i>" : "") + E(it.d || "")
                + " · limite " + age(it.t) + "</small></div><span class=\"rp-age\">" + age(it.a) + "</span><span class=\"rp-dist\">" + (it.leg != null ? Math.round(it.leg * 10) / 10 + " al" : "—") + "</span>" + (estAmiral() ? "<button type=\"button\" class=\"rp-ign\" data-ign=\"" + E(it.s) + "\" title=\"Ne plus proposer ce système dans les repérages (Amiral)\">⊘</button>" : "") + "</div>";
        };
        const fait = f => "<div class=\"rp-lg rp-fait\"><span class=\"rp-av\">" + avatar(nom(f.par || "?"), 34) + "</span><div class=\"rp-nm\"><b>" + E(f.s) + "</b><small>repéré par " + (f.par ? "CMDR " + E(nom(f.par)) : "un pilote") + " · " + depuis(f.vu) + "</small></div><span class=\"rp-tampon\">REPÉRÉ</span></div>";
        const suivant = rt.etapes[0];
        const inactif = r.actif === false;
        let gauche = (inactif ? "<div class=\"rp-off\">⚠ REPÉRAGE DÉSACTIVÉ pour l’escadron : la liste est vide et aucun point n’est donné. " + (estDirecteur() ? "Cochez BGS et / ou POWERPLAY dans les réglages (colonne de droite) puis ENREGISTRER pour le réactiver." : "Seul le directeur peut le réactiver.") + "</div>" : "") + synthese(d, items, faits) + regles(d) + (rt.etapes.length ? rt.etapes.map(ligne).join("") + "<div class=\"rp-prochain\"><div><small>PROCHAIN SAUT</small><b>" + E(suivant.s) + "</b></div><button type=\"button\" class=\"rp-btn pt\" data-rp=\"copier\">COPIER LE NOM</button></div>"
            : "<div class=\"rp-tout\">✓ TOUT EST À JOUR</div>");
        if (faits.length) gauche += "<div class=\"rp-sep\">DÉJÀ REPÉRÉS · DEPUIS LE TICK</div>" + faits.slice(0, 10).map(fait).join("");
        if (fl.loin) gauche += "<div class=\"rp-note\">+ " + fl.loin + " système" + (fl.loin > 1 ? "s" : "") + " au-delà de " + fl.rayon + " al " + (fl.depuisPosition ? "de ta position" : "de la zone principale de l’escadron") + " : non proposé" + (fl.loin > 1 ? "s" : "") + " (réglable par l’Amiral).</div>";
        gauche += "<div class=\"rp-note\">Pour l’instant : les systèmes de vos <b>directives</b> et ceux qui sont impliqués dans une <b>menace d’expansion</b> d’une faction rivale vers vos systèmes, ainsi que les <b>conquêtes Powerplay</b> ennemies qui progressent vers vos systèmes (seuil réglable), et les systèmes où la faction d’une <b>directive de hausse</b> est en <b>Boom</b> sans qu’aucune <b>installation</b> n’y ait encore été vue (raids : fenêtre « Où défendre ? »). Clic sur une ligne : le nom est copié, prêt à coller dans la carte du jeu. Une fois le saut fait, le plugin SYS.EDTEAM envoie ce que voit votre jeu : la ligne passe à « repéré par CMDR … » pour tout l’escadron, et vous gagnez 1 point BGS (la page garde ses données 5 minutes). Les repérages disparaissent de la liste à chaque nouveau tick quotidien, et les systèmes y reviennent quand leur donnée est de nouveau trop vieille. Aller dans le système suffit, inutile de s’y poser.</div>";
        return "<div class=\"rp-boite\"><button type=\"button\" class=\"rp-x\" data-rp=\"fermer\" aria-label=\"Fermer\">✕</button><div class=\"rp-mh\"><h3>ROUTE DE REPÉRAGE</h3><button type=\"button\" class=\"rp-btn pt msg\" data-rp=\"msg\" aria-expanded=\"" + msgOuvert + "\">✉ MESSAGE D’EDTEAM " + (msgOuvert ? "▴" : "▾") + "</button>" + (estAmiral() ? "<button type=\"button\" class=\"rp-btn pt\" data-rp=\"ecartes\" style=\"border-color:#5a4a2a; color:#ffd166;\">⊘ SYSTÈMES ÉCARTÉS (" + (d.ignores || []).length + ")</button>" : (d.ignores || []).length ? "<button type=\"button\" class=\"rp-btn pt gris\" data-rp=\"ecartes\">⊘ ÉCARTÉS (" + d.ignores.length + ")</button>" : "") + "<span>" + (p && p.systeme ? "depuis ta position : " + E(nom(p.systeme)) + " · " : "position inconnue (plugin non lancé) · ") + rt.etapes.length + " système" + (rt.etapes.length > 1 ? "s" : "") + (rt.total ? " · " + Math.round(rt.total) + " al au total" : "") + "</span>" + (msgOuvert ? "<div class=\"rp-msgbox\">" + messageAmiral(d) + "</div>" : "") + "</div>"
            + "<div class=\"rp-liste\">" + gauche + "</div><div class=\"rp-droite\">" + carte(rt.etapes, p) + "<div class=\"rp-reg\"><div><b>ORDRE</b>Le chemin le plus court : de proche en proche, trajet optimisé pour réduire le temps de vol.</div><div><b>RISQUES</b>Anarchie, guerre des Thargoïds : signalées. Permis requis : écartés. Rien n’est deviné.</div><div><b>SOLO</b>Le journal donne les mêmes infos en Solo ou en groupe privé.</div></div>"
            + ignores(d)
            + (estDirecteur() ? reglages(r) : "<div class=\"rp-note\">Modes : " + [r.bgs_actif !== false ? "BGS (directive " + r.age_directive_h + " h · expansion " + r.age_expansion_h + " h · systèmes en Boom 7 j)" : "", r.pp_actif !== false ? "POWERPLAY (conquête " + (r.age_conquete_h || 48) + " h dès " + (r.seuil_conquete_pct || 25) + " %)" : ""].filter(Boolean).join(" · ") + ". Rayon : " + (r.rayon_max_al || 500) + " al. Seul le directeur peut modifier ces réglages.</div>")
            + "<div style=\"display:flex; gap:8px;\"><button type=\"button\" class=\"rp-btn gris pt\" data-rp=\"actualiser\">↻ ACTUALISER</button></div></div></div>";
    }
    // systemes ecartes des reperages par l'Amiral : consultables a tout moment, remis en un clic
    function ignores(d) {
        if (d.ignores === undefined) return estAmiral() ? "<div class=\"rp-note\" id=\"rp-ecartes\" style=\"color:#ffb000;\">⚠ La base n’a pas encore la liste des systèmes écartés : relancez le script SQL 121 à jour (le bouton ⊘ ne fonctionnera pas avant).</div>" : "";
        const l = d.ignores || [];
        if (!l.length) return estAmiral() ? "<div class=\"rp-note\" id=\"rp-ecartes\">Aucun système écarté. Le bouton ⊘ d’une ligne écarte un système des repérages (il reste consultable ici, et peut être remis à tout moment).</div>" : "";
        return "<div class=\"rp-reglages\" id=\"rp-ecartes\" style=\"border-color:#5a4a2a\"><h4 style=\"color:#ffd166; margin:0;\"><button type=\"button\" data-rp=\"ecartes-bascule\" aria-expanded=\"" + ecartesOuvert + "\" style=\"all:unset; cursor:pointer; display:flex; justify-content:space-between; align-items:center; width:100%;\"><span>⊘ SYSTÈMES ÉCARTÉS DES REPÉRAGES (" + l.length + ")</span><span style=\"color:#ffd166; letter-spacing:2px; font-size:.9em;\">" + (ecartesOuvert ? "REPLIER ▴" : "DÉPLIER ▾") + "</span></button></h4>"
            + (ecartesOuvert ? l.map(i => "<div class=\"rp-ig\"><div><b>" + E(i.s) + "</b><small>écarté par " + (i.par ? "CMDR " + E(nom(i.par)) : "l’Amiral") + " " + depuis(i.le) + (i.note ? " · " + E(i.note) : "") + (i.m && i.m.length ? " · encore concerné : " + i.m.map(m => (MOTIFS[m] || [m])[0].toLowerCase()).join(", ") : " · plus concerné actuellement") + "</small></div>" + (estAmiral() ? "<button type=\"button\" class=\"rp-btn pt\" data-rein=\"" + E(i.s) + "\">REMETTRE</button>" : "") + "</div>").join("")
                + (estAmiral() ? "" : "<div class=\"rp-note\" style=\"margin-top:6px;\">Seul l’Amiral peut remettre un système dans les repérages.</div>") : "") + "</div>";
    }
    function reglages(r) {
        const DEF = { age_directive_h: 24, age_expansion_h: 24, age_conquete_h: 48, seuil_conquete_pct: 25, rayon_max_al: 500 };
        const bgs = r.bgs_actif !== false, pp = r.pp_actif !== false;
        const ch = (cle, lib, actif) => "<label for=\"rp-" + cle + "\">" + lib + "</label><input type=\"number\" id=\"rp-" + cle + "\" min=\"1\" max=\"100000\" value=\"" + (Number(r[cle]) || DEF[cle] || 24) + "\"" + (actif ? "" : " disabled") + ">";
        const mode = (cle, actif, titre, sous) => "<label class=\"rp-mode\"><input type=\"checkbox\" id=\"rp-mode-" + cle + "\" data-mode=\"" + cle + "\"" + (actif ? " checked" : "") + "> <b>" + titre + "</b> <small>" + sous + "</small></label>";
        return "<div class=\"rp-reglages\"><h4>⚙ RÉGLAGES (DIRECTEUR) · un système entre dans la liste quand sa donnée est plus vieille que l’âge limite</h4>"
            + mode("bgs", bgs, "BGS", "directives et menaces d’expansion rivale") + "<div class=\"rp-champs\" id=\"rp-g-bgs\" style=\"" + (bgs ? "" : "opacity:.4;") + "\">" + ch("age_directive_h", "Directive active : âge limite de la donnée (en heures)", bgs) + ch("age_expansion_h", "Menace d’expansion rivale : âge limite de la donnée (en heures)", bgs) + "</div>"
            + mode("pp", pp, "POWERPLAY", "conquêtes ennemies") + "<div class=\"rp-champs\" id=\"rp-g-pp\" style=\"" + (pp ? "" : "opacity:.4;") + "\">" + ch("age_conquete_h", "Conquête ennemie : âge limite de la donnée (en heures)", pp) + ch("seuil_conquete_pct", "Conquête : progression minimale (en %)", pp) + "</div>"
            + "<div class=\"rp-champs\" style=\"margin-top:8px;\">" + ch("rayon_max_al", "Rayon maximum depuis la position du pilote (en années-lumière)", true) + "</div>"
            + "<div class=\"rp-note\" style=\"margin-top:6px; color:#ffb000;\">Un mode décoché n’apporte aucun système à la liste (les deux décochés = repérage désactivé pour tout l’escadron). Les scans de joueurs ne dépendent pas de ces modes.</div>"
            + "<div style=\"margin-top:9px; display:flex; gap:10px; align-items:center;\"><button type=\"button\" class=\"rp-btn pt\" data-rp=\"enregistrer\">ENREGISTRER</button><span class=\"rp-note\" data-rp=\"msg\"></span></div></div>";
    }
    function carte(etapes, p) {
        const W = 560, H = 330, pad = 34, pts = etapes.filter(e => e.x != null).map(e => [e.x, e.z]); if (p) pts.push([p.x, p.z]);
        if (!pts.length) return "<div class=\"rp-note\" style=\"padding:20px 0;\">Aucun système à placer sur la carte.</div>";
        const xs = pts.map(q => q[0]), zs = pts.map(q => q[1]), x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), z0 = Math.min.apply(null, zs), z1 = Math.max.apply(null, zs);
        const e = Math.min((W - 2 * pad) / Math.max(x1 - x0, 1), (H - 2 * pad) / Math.max(z1 - z0, 1), 40);
        const X = x => (W / 2 + (x - (x0 + x1) / 2) * e).toFixed(1), Y = z => (H / 2 - (z - (z0 + z1) / 2) * e).toFixed(1);
        let h = ""; const trace = []; if (p) trace.push([X(p.x), Y(p.z)]);
        etapes.forEach(it => { if (it.x != null) trace.push([X(it.x), Y(it.z)]); });
        if (trace.length > 1) h += "<polyline points=\"" + trace.map(q => q.join(",")).join(" ") + "\" fill=\"none\" stroke=\"#00F0FF\" stroke-width=\"1.6\" stroke-dasharray=\"5 4\" opacity=\".8\"/>";
        if (p) h += "<g><circle cx=\"" + X(p.x) + "\" cy=\"" + Y(p.z) + "\" r=\"9\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2\"/><circle cx=\"" + X(p.x) + "\" cy=\"" + Y(p.z) + "\" r=\"3\" fill=\"#fff\"/><text x=\"" + (Number(X(p.x)) + 13) + "\" y=\"" + (Number(Y(p.z)) + 4) + "\" fill=\"#fff\" font-size=\"11\">TOI</text></g>";
        etapes.forEach((it, i) => { if (it.x == null) return; const c = couleurMotif(it), x = X(it.x), y = Y(it.z);
            h += "<g><circle cx=\"" + x + "\" cy=\"" + y + "\" r=\"12\" fill=\"#0a0e12\" stroke=\"" + c + "\" stroke-width=\"2\"/><text x=\"" + x + "\" y=\"" + (Number(y) + 4) + "\" text-anchor=\"middle\" fill=\"" + c + "\" font-size=\"12\" font-weight=\"bold\">" + (i + 1) + "</text><text x=\"" + (Number(x) + 16) + "\" y=\"" + (Number(y) + 4) + "\" fill=\"#cfd8dc\" font-size=\"10.5\">" + E(it.s) + "</text></g>"; });
        return "<svg class=\"rp-svg\" viewBox=\"0 0 " + W + " " + H + "\" role=\"img\" aria-label=\"Route de repérage\">" + h + "<text x=\"" + (W - 10) + "\" y=\"16\" text-anchor=\"end\" fill=\"#3d7490\" font-size=\"9\" letter-spacing=\"2\">▲ VERS LE CENTRE GALACTIQUE</text></svg>";
    }
    function brancherModale(ov, d, p, fermer, dessiner) {
        ov.querySelectorAll("[data-rp=fermer]").forEach(b => b.onclick = fermer);
        const rt = route(d.items || [], p);
        ov.querySelectorAll(".rp-lg[data-s]").forEach(l => l.onclick = () => { copier(l.dataset.s, null); const t = l.querySelector("b"); if (t) { const v = t.textContent; t.textContent = "COPIÉ ✓"; setTimeout(() => { t.textContent = v; }, 1200); } });
        ov.querySelectorAll("[data-rp=copier]").forEach(b => b.onclick = () => { if (rt.etapes[0]) copier(rt.etapes[0].s, b); });
        const agir = async (rpc, systeme) => {
            const r = await db().rpc(rpc, { p_systeme: systeme });
            if (r.error) { const m = ov.querySelector(".rp-liste .rp-note:last-child") || ov.querySelector(".rp-liste"); if (m) m.insertAdjacentHTML("afterbegin", "<div class=\"rp-note\" style=\"color:#ff8a8a\">" + E(r.error.message || "refusé") + "</div>"); return; }
            memo = null; const n = await charger(true); const np = await maPosition();
            if (n && document.getElementById("rp-modale")) { p = np; d = n; dessiner(n, np); }
            const bande = document.getElementById("reperage-bande"); if (bande) monter(bande);
        };
        ov.querySelectorAll("[data-ign]").forEach(b => b.onclick = e => { e.stopPropagation(); agir("reperage_ignorer", b.dataset.ign); });
        ov.querySelectorAll("[data-rein]").forEach(b => b.onclick = () => agir("reperage_reintegrer", b.dataset.rein));
        ov.querySelectorAll("[data-rp=ecartes-bascule]").forEach(b => b.onclick = () => { ecartesOuvert = !ecartesOuvert; dessiner(d); const e = ov.querySelector("#rp-ecartes"); if (e && ecartesOuvert) e.scrollIntoView({ behavior: "smooth", block: "nearest" }); });
        ov.querySelectorAll("[data-rp=ecartes]").forEach(b => b.onclick = () => { if (!ecartesOuvert) { ecartesOuvert = true; dessiner(d); } const e = ov.querySelector("#rp-ecartes"); if (e) { e.scrollIntoView({ behavior: "smooth", block: "center" }); e.style.boxShadow = "0 0 0 2px #ffd166"; setTimeout(() => { e.style.boxShadow = ""; }, 1600); } });
        ov.querySelectorAll("[data-mode]").forEach(cb => cb.onchange = () => { const g = ov.querySelector("#rp-g-" + cb.dataset.mode); if (!g) return; g.style.opacity = cb.checked ? "" : ".4"; g.querySelectorAll("input").forEach(i => { i.disabled = !cb.checked; }); });
        ov.querySelectorAll("[data-rp=msg]").forEach(b => b.onclick = () => { msgOuvert = !msgOuvert; dessiner(d); });
        ov.querySelectorAll("[data-rp=actualiser]").forEach(b => b.onclick = async () => { b.textContent = "…"; pos = null; const n = await charger(true); const np = await maPosition(); if (n && document.getElementById("rp-modale")) { p = np; d = n; dessiner(n, np); } });
        ov.querySelectorAll("[data-rp=enregistrer]").forEach(b => b.onclick = async () => {
            const v = k => Number((ov.querySelector("#rp-" + k) || {}).value), msg = ov.querySelector("[data-rp=msg]");
            const r = await db().rpc("reperage_reglages_ecrire", { p_age_directive: v("age_directive_h"), p_age_expansion: v("age_expansion_h"), p_age_place_libre: (d.reglages || {}).age_place_libre_h || 72, p_age_conquete: v("age_conquete_h") || 48, p_age_conquete_forte: (d.reglages || {}).age_conquete_forte_h || 24, p_actif: !!((ov.querySelector("#rp-mode-bgs") || {}).checked || (ov.querySelector("#rp-mode-pp") || {}).checked), p_bgs: !!(ov.querySelector("#rp-mode-bgs") || {}).checked, p_pp: !!(ov.querySelector("#rp-mode-pp") || {}).checked, p_rayon: Number((ov.querySelector("#rp-rayon_max_al") || {}).value) || 500, p_seuil: v("seuil_conquete_pct") || 25 });
            if (r.error) { if (msg) msg.textContent = r.error.message || "refusé"; return; }
            memo = null; const n = await charger(true); if (n && document.getElementById("rp-modale")) dessiner(n);
            const bande = document.getElementById("reperage-bande"); if (bande) monter(bande);
        });
    }
    window.EdteamReperage = { monter, ouvrir, route, invalider: () => { memo = null; pos = null; } };
    // briques reutilisees par la version mobile (reperage-mobile.js)
    window.EdteamReperage._ui = { charger, maPosition, filtrer, route, carte, copier, css, MOTIFS, ORDRE_MOTIFS, RISQUES, couleurMotif, couleurDir, age, depuis, nom, E, estAmiral, estDirecteur, photos, avatar, logo, messageAmiral, db, vider: () => { memo = null; pos = null; } };
})();
