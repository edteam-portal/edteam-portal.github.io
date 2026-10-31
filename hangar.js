// =====================================================================================================
//  HANGAR DU PILOTE : liste des vaisseaux et equipement actuel de chacun (plugin 2.41, SQL 106).
//  Un seul composant, deux usages :
//    EdteamHangar.ouvrir(userId, nom)    : fenetre plein ecran (fiche pilote de la page Escadron) ; userId vide = son propre hangar
//    EdteamHangar.monter(element)        : affichage dans la page (page « Mon hangar »)
//  Une seule lecture serveur (hangar_lire), a l'ouverture, gardee 3 minutes dans la session. Les hologrammes et les noms de modules (fichiers statiques) ne sont charges qu'a l'ouverture.
//  Couleur par taille de plateforme : S vert, M cyan, L ambre (donnees Coriolis). Aucune valeur en credits, aucune position de vaisseau.
// =====================================================================================================
(function () {
    "use strict";
    if (window.EdteamHangar) return;

    const NOMS = {"sidewinder":"Sidewinder","eagle":"Eagle","hauler":"Hauler","adder":"Adder","viper":"Viper Mk III","viper_mkiv":"Viper Mk IV","cobramkiii":"Cobra Mk III","cobramkiv":"Cobra Mk IV","cobramkv":"Cobra Mk V","type6":"Type-6 Transporter","type7":"Type-7 Transporter","type9":"Type-9 Heavy","type9_military":"Type-10 Defender","type8":"Type-8 Transporter","mediumtransport01":"Lynx Highliner","asp":"Asp Explorer","asp_scout":"Asp Scout","python":"Python","python_nx":"Python Mk II","diamondback":"Diamondback Scout","diamondbackxl":"Diamondback Explorer","empire_courier":"Imperial Courier","smallcombat01_nx":"Kestrel Mk II","lakonminer":"Type-11 Prospector","empire_eagle":"Imperial Eagle","empire_trader":"Imperial Clipper","federation_dropship":"Federal Dropship","federation_dropship_mkii":"Federal Assault Ship","federation_gunship":"Federal Gunship","federation_corvette":"Federal Corvette","independant_trader":"Keelback","ferdelance":"Fer-de-Lance","mamba":"Mamba","krait_mkii":"Krait Mk II","krait_light":"Krait Phantom","anaconda":"Anaconda","cutter":"Imperial Cutter","belugaliner":"Beluga Liner","orca":"Orca","dolphin":"Dolphin","typex":"Alliance Chieftain","typex_2":"Alliance Crusader","typex_3":"Alliance Challenger","panthermkii":"Panther Clipper Mk II","explorer_nx":"Caspian Explorer","mandalay":"Mandalay","corsair":"Corsair","empire_corsair":"Imperial Corsair","alliance_chieftain":"Alliance Chieftain"};
    const TAILLE = {"cobramkiii":1,"cobramkiv":1,"cobramkv":1,"viper":1,"viper_mkiv":1,"empire_eagle":1,"empire_courier":1,"empire_trader":3,"cutter":3,"federation_dropship":2,"federation_dropship_mkii":2,"federation_gunship":2,"federation_corvette":3,"ferdelance":2,"independant_trader":2,"diamondbackxl":1,"diamondback":1,"belugaliner":3,"type6":2,"type7":3,"type8":2,"type9":3,"type9_military":3,"lakonminer":2,"smallcombat01_nx":1,"krait_light":2,"krait_mkii":2,"empire_corsair":2,"corsair":2,"explorer_nx":3,"panthermkii":3,"python":2,"python_nx":2,"mandalay":2,"anaconda":3,"asp":2,"asp_scout":2,"vulture":1,"dolphin":1,"orca":3,"mamba":2,"eagle":1,"sidewinder":1,"hauler":1,"adder":1,"typex":2,"typex_2":2,"typex_3":2,"mediumtransport01":2};
    const ARMURES = { grade1: "Lightweight Alloy", grade2: "Reinforced Alloy", grade3: "Military Grade Composite", mirrored: "Mirrored Surface Composite", reactive: "Reactive Surface Composite" };
    const CLASSE = { 1: "Economy", 2: "Business", 3: "First Class", 4: "Luxury" };
    const LET = { 1: "E", 2: "D", 3: "C", 4: "B", 5: "A" };
    const CORE = ["PowerPlant", "MainEngines", "FrameShiftDrive", "LifeSupport", "PowerDistributor", "Radar", "FuelTank", "Armour"];
    const TAI = { Tiny: 0, Small: 1, Medium: 2, Large: 3, Huge: 4 };
    const LZ = { 1: "S", 2: "M", 3: "L" }, TON = { 1: "v", 2: "c", 3: "o" }, NZ = { 1: "PETIT", 2: "MOYEN", 3: "GRAND" };
    const CLE_CACHE = "edteam_hangar_v1_";

    const CSS = `
#hg-voile{position:fixed;inset:0;z-index:9500;display:flex;align-items:center;justify-content:center;padding:clamp(10px,3vh,30px) clamp(10px,3vw,40px);background:rgba(2,3,5,.88);backdrop-filter:blur(3px);font-family:'Share Tech Mono',monospace}
.hg{--t:#00F0FF;--tr:0,240,255;width:min(1180px,100%);height:100%;max-height:860px;display:flex;flex-direction:column;background:linear-gradient(180deg,rgba(0,240,255,.08),rgba(4,6,9,.985) 20%);border:1px solid #00F0FF;box-shadow:0 0 40px rgba(0,240,255,.18);color:#e6f0f3;font-family:'Share Tech Mono',monospace;box-sizing:border-box;text-align:left}
.hg *{box-sizing:border-box}
.hg.inl{width:100%;height:calc(100vh - 175px);min-height:520px;max-height:none}
.hg-h{flex:none;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:14px 22px 12px;border-bottom:1px solid rgba(0,240,255,.3)}
.hg-h small{display:block;color:#888;letter-spacing:3px;font-size:.72em}.hg-h b{display:block;color:#00F0FF;font-size:1.4em;letter-spacing:3px;font-weight:normal;text-shadow:0 0 12px rgba(0,240,255,.35);overflow-wrap:anywhere}
.hg-x{background:transparent;border:1px solid #6b7680;color:#aab7bd;font:inherit;font-size:.78em;letter-spacing:2px;padding:7px 16px;cursor:pointer}.hg-x:hover{border-color:#fff;color:#fff}
.hg-st{flex:none;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:12px 22px 6px}
.hg-st div{border:1px solid #1d3a44;border-left:3px solid #00F0FF;background:rgba(0,240,255,.05);padding:7px 12px}
.hg-st small{display:block;color:#7d8a92;font-size:.64em;letter-spacing:2px}.hg-st b{display:block;color:#fff;font-weight:normal;font-size:1.3em}
.hg-b{flex:none;display:flex;gap:10px;flex-wrap:wrap;align-items:center;padding:8px 22px 10px;border-bottom:1px solid rgba(255,255,255,.07)}
.hg-q{background:#0b1418;border:1px solid #2c4a54;color:#e6f0f3;font:inherit;font-size:.82em;padding:7px 10px;flex:0 1 240px;min-width:0;outline:0}.hg-q:focus{border-color:#00F0FF}
.hg-f{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.hg-f button{background:transparent;border:1px solid #2c4a54;color:#8fb7bf;font:inherit;font-size:.72em;letter-spacing:1.5px;padding:6px 11px;cursor:pointer}.hg-f button:hover{border-color:#8fb7bf;color:#fff}
.hg-f button.on{border-color:#00F0FF;color:#00F0FF;background:rgba(0,240,255,.08)}
.hg-f .z.t1{border-color:#1c6b3d;color:#00FF66;--tr:0,255,102;--t:#00FF66}.hg-f .z.t2{border-color:#1c5f69;color:#00F0FF;--tr:0,240,255;--t:#00F0FF}.hg-f .z.t3{border-color:#7a5a12;color:#FFB000;--tr:255,176,0;--t:#FFB000}
.hg-f .z.on{background:rgba(var(--tr),.14);border-color:var(--t)}
.hg-leg{color:#7d8a92;font-size:.68em;letter-spacing:1px}
.hg-n{color:#8b97a0;font-size:.74em;letter-spacing:1px;margin-left:auto}
.hg-m{flex:1;min-height:0;display:grid;grid-template-columns:minmax(300px,380px) 1fr}
.hg-l{overflow-y:auto;border-right:1px solid rgba(255,255,255,.07);padding:6px 10px 10px 22px;scrollbar-width:thin;scrollbar-color:#00F0FF #0b0b0b}
.t1{--t:#00FF66;--tr:0,255,102}.t2{--t:#00F0FF;--tr:0,240,255}.t3{--t:#FFB000;--tr:255,176,0}
.hg-r{display:grid;grid-template-columns:70px minmax(0,1fr) auto;gap:10px;align-items:center;padding:6px 8px;margin-top:5px;border:1px solid transparent;border-left:3px solid var(--t);cursor:pointer}
.hg-r:hover{background:rgba(var(--tr),.05)}.hg-r.on{border-color:var(--t);background:rgba(var(--tr),.08)}
.hg-th{height:46px;background:radial-gradient(circle,rgba(var(--tr),.16),rgba(0,0,0,.45));border:1px solid rgba(var(--tr),.4);padding:2px}.hg-th svg{display:block;width:100%;height:100%}
.hg-th .tbs-balai,.hg-g .tbs-balai{animation:none}.hg-r.on .hg-th .tbs-balai{animation:hgBal 5s linear infinite}
@keyframes hgBal{from{transform:translateY(0)}to{transform:translateY(var(--h))}}@media (prefers-reduced-motion:reduce){.hg-r.on .hg-th .tbs-balai{animation:none}}
.hg-r .nm{color:#fff;font-size:.92em;letter-spacing:1px;overflow-wrap:anywhere}.hg-r .nm small{display:block;color:#8fb7bf;font-size:.76em;letter-spacing:.5px}
.hg-r .gs{font-size:.7em;color:#FFD54A;letter-spacing:1px;text-align:right}.hg-r .gs i{font-style:normal;color:#6f7c84}
.hg-sz{display:inline-block;border:1px solid var(--t);color:var(--t);font-size:.72em;letter-spacing:2px;padding:0 6px;margin-right:6px;vertical-align:middle}
.hg-d{overflow-y:auto;padding:14px 22px;display:grid;grid-template-columns:minmax(0,250px) minmax(0,1fr);gap:0 24px;align-content:start;scrollbar-width:thin;scrollbar-color:#00F0FF #0b0b0b}
.hg-c{position:sticky;top:0;align-self:start}
.hg-g{background:radial-gradient(circle,rgba(var(--tr),.16),rgba(0,0,0,.5));border:1px solid rgba(var(--tr),.5);padding:8px}.hg-g svg{display:block;width:100%;height:230px}
.hg-g .tbs-balai{animation:hgBal 5s linear infinite}
.hg-t b{display:block;color:#fff;font-weight:normal;font-size:1.3em;letter-spacing:2px;overflow-wrap:anywhere}.hg-t small{display:block;color:var(--t);letter-spacing:2px;font-size:.78em;margin-top:8px}
.hg-t .rs{margin-top:10px;display:flex;gap:8px;flex-wrap:wrap}.hg-t .rs span{border:1px solid #1d3a44;background:rgba(0,240,255,.05);padding:3px 10px;font-size:.74em;letter-spacing:1px;color:#b9c8ce}.hg-t .rs span b{display:inline;font-size:1em;color:#FFD54A;letter-spacing:0}
.hg-edsy{display:inline-block;margin-top:12px;background:rgba(var(--tr),.1);border:1px solid var(--t);color:#fff;font:inherit;font-size:.74em;letter-spacing:2px;padding:7px 12px;cursor:pointer;text-align:left}.hg-edsy:hover{background:rgba(var(--tr),.25)}.hg-edsy[disabled]{opacity:.6;cursor:wait}
.hg-sim{display:flex;flex-wrap:wrap;gap:8px}.hg-sim .hg-edsy{margin-top:12px}
.hg-edsy-n{display:block;margin-top:6px;color:#7d8a92;font-size:.66em;line-height:1.5;letter-spacing:.5px}
.hg-mod{min-width:0}
.hg-mod h4{margin:12px 0 4px;color:var(--t);font-weight:normal;font-size:.74em;letter-spacing:3px;border-bottom:1px solid rgba(var(--tr),.3);padding-bottom:3px}.hg-mod h4:first-child{margin-top:0}
.hg-li{display:grid;grid-template-columns:44px minmax(0,1.3fr) 54px minmax(0,1.4fr);gap:10px;align-items:baseline;padding:3px 0;font-size:.84em;border-bottom:1px dotted rgba(255,255,255,.06)}
.hg-li .sz{color:#7d8a92;font-size:.8em;letter-spacing:1px}.hg-li .g{color:#6f7c84;font-size:.82em;letter-spacing:1px}.hg-li .g.e{color:#FFD54A}.hg-li .de{color:#b9c8ce;font-size:.84em}.hg-li .de u{color:#8fb7bf;text-decoration:none}
.hg-li .off{color:#FF6B5F;font-size:.8em}
.hg-inc{grid-column:2;color:#9aa7ad;font-size:.86em;line-height:1.6;padding:14px 0}
.hg-vide{grid-column:1/-1;color:#9aa7ad;text-align:center;padding:36px 20px;font-size:.9em;line-height:1.7}
.hg-note{flex:none;padding:9px 22px;border-top:1px solid rgba(255,255,255,.07);color:#7d8a92;font-size:.7em;line-height:1.5}
@media (max-width:1180px){
 .hg-m{grid-template-columns:minmax(260px,320px) 1fr}
 .hg-d{grid-template-columns:1fr;gap:0}.hg-c{position:static;display:grid;grid-template-columns:150px minmax(0,1fr);gap:0 14px;align-items:start;margin-bottom:6px}.hg-g svg{height:150px}.hg-t small{margin-top:0}
 .hg-inc{grid-column:1}
}
@media (max-width:900px){
 .hg{max-height:none}.hg.inl{height:auto;min-height:0}
 .hg-st{grid-template-columns:repeat(2,minmax(0,1fr));padding:10px 14px 4px}.hg-h,.hg-b,.hg-note{padding-left:14px;padding-right:14px}.hg-n{margin-left:0;width:100%}
 .hg-m{grid-template-columns:1fr;grid-template-rows:minmax(0,38%) minmax(0,1fr)}.hg.inl .hg-m{grid-template-rows:none}.hg.inl .hg-l{max-height:300px}
 .hg-l{border-right:0;border-bottom:1px solid rgba(255,255,255,.07);padding:4px 10px 8px 14px}
 .hg-d{grid-template-columns:1fr;padding:12px 14px}
 .hg-li{grid-template-columns:36px minmax(0,1fr) 48px;gap:4px 8px}.hg-li .de{grid-column:2/-1}
 .hg-inc{grid-column:1}
}`;

    const E = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const cap1 = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    const D = () => window.EDTEAM_MODULES || { n: {}, bp: {}, sp: {} };

    function charger(src) {
        return new Promise((ok, ko) => {
            const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => ko(new Error("chargement impossible : " + src));
            document.head.appendChild(s);
        });
    }
    async function assets() {
        if (!document.getElementById("hg-css")) { const st = document.createElement("style"); st.id = "hg-css"; st.textContent = CSS; document.head.appendChild(st); }
        if (typeof SILHOUETTES === "undefined") await charger("silhouettes-data.js?v=3");
        if (!window.HoloVaisseau) await charger("holo-vaisseau.js?v=2");
        if (!window.EDTEAM_MODULES) await charger("modules-data.js?v=1");
    }

    // ---- noms ----
    const nomVaisseau = k => { k = String(k || "").toLowerCase(); return NOMS[k] || cap1(k.replace(/_/g, " ")); };
    const tailleDe = v => TAILLE[String(v.t || "").toLowerCase()] || 2;
    function nomModule(item) {
        const k = String(item || "").toLowerCase(), t = D().n[k], ms = k.match(/_size(\d)/), mc = k.match(/_class(\d)/), size = ms ? +ms[1] : 0, cls = mc ? +mc[1] : 0;
        let m = k.match(/^int_(mkii_)?passengercabin_size(\d)_class(\d)$/);
        if (m) return (CLASSE[+m[3]] || "Passenger") + " Passenger Cabin" + (m[1] ? " Mk II" : "") + " " + m[2] + (LET[+m[3]] || "");
        m = k.match(/^int_engine_size(\d)_class(\d)(_fast)?$/); if (m) return (m[3] ? "Enhanced Performance " : "") + "Thrusters " + m[1] + (LET[+m[2]] || "");
        if (/fighterbay/.test(k)) return "Fighter Hangar " + size + (LET[cls] || "");
        if (/cargorack/.test(k)) return (/large/.test(k) ? "Large " : /corrosion/.test(k) ? "Corrosion Resistant " : "") + "Cargo Rack " + size + (LET[cls] || "E");
        m = k.match(/_armour_(\w+)$/); if (m && ARMURES[m[1]]) return ARMURES[m[1]];
        if (t) { const sz = t[1] > 0 ? t[1] : "", r = t[1] > 0 || /^[A-E]$/.test(t[2]) ? (t[2] || "") : ""; return (t[0] + " " + sz + r).replace(/\s+$/, ""); }
        return cap1(k.replace(/^(int|hpt)_/, "").replace(/_size\d.*$/, "").replace(/_class\d.*$/, "").replace(/_/g, " ")) + (size ? " " + size + (LET[cls] || "") : "");
    }
    const bpNom = b => D().bp[b] || cap1(String(b || "").split("_").slice(1).join(" ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase());
    const spNom = x => !x ? "" : D().sp[x] || cap1(String(x).replace(/^special_/, "").replace(/_/g, " "));

    // ---- modules ----
    const cat = s => CORE.indexOf(s) >= 0 ? "c" : /^TinyHardpoint/.test(s) ? "u" : /^(Small|Medium|Large|Huge)Hardpoint/.test(s) ? "a" : "o";
    const gabarit = s => { let m = s.match(/^(Tiny|Small|Medium|Large|Huge)Hardpoint(\d+)/); if (m) return [m[1][0], +m[2]]; m = s.match(/Size(\d)/); return m ? ["", +m[1]] : ["", 0]; };
    const numSlot = s => { const m = s.match(/(\d+)/); return m ? +m[1] : 0; };
    function groupes(v) {
        const g = { a: [], u: [], c: [], o: [] }; (v.m || []).forEach(x => g[cat(x.s)].push(x));
        const rang = s => { const m = s.match(/^[A-Z][a-z]+/); return m ? (TAI[m[0]] || 0) : 0; };
        g.a.sort((x, y) => rang(y.s) - rang(x.s) || numSlot(x.s) - numSlot(y.s));
        g.o.sort((x, y) => gabarit(y.s)[1] - gabarit(x.s)[1] || numSlot(x.s) - numSlot(y.s));
        g.c.sort((x, y) => CORE.indexOf(x.s) - CORE.indexOf(y.s));
        return g;
    }
    function ligne(m) {
        const t = gabarit(m.s), c = cat(m.s), tag = c === "c" ? "" : c === "u" ? "UTIL" : (t[0] ? t[0] + t[1] : "C" + t[1]);
        const g = m.g ? '<span class="g e">G' + (+m.g) + "</span>" : '<span class="g">STOCK</span>';
        const de = m.g ? [m.b ? bpNom(m.b) : "", m.x ? spNom(m.x) : ""].filter(Boolean).map(E).join(" · ") + (m.e ? ' · <u>' + E(m.e) + "</u>" : "") : "";
        return '<div class="hg-li"><span class="sz">' + tag + '</span><span class="nmm">' + E(nomModule(m.i)) + (m.o === 0 ? ' <span class="off">OFF</span>' : "") + "</span>" + g + '<span class="de">' + de + "</span></div>";
    }
    const stats = v => { const l = (v.m || []).filter(x => x.i), e = l.filter(x => x.g); return { n: l.length, g: e.length, g5: e.filter(x => +x.g === 5).length }; };

    // ---- lien EDSY : la configuration du vaisseau au format SLEF (celui du Loadout du journal), compressee (zlib) puis en base64 URL-safe, dans #/I= (le format d'import d'EDSY)
    function slef(v) {
        const mods = (v.m || []).filter(m => m.i).map(m => {
            const o = { Slot: m.s, Item: m.i, On: m.o !== 0, Priority: 0 };
            if (m.g) { o.Engineering = { BlueprintName: m.b || "", Level: +m.g, Quality: 1 }; if (m.e) o.Engineering.Engineer = m.e; if (m.x) o.Engineering.ExperimentalEffect = m.x; }
            return o;
        });
        return JSON.stringify([{ header: { appName: "SYS.EDTEAM", appVersion: "1" }, data: { event: "Loadout", Ship: v.t, ShipName: v.n || "", ShipIdent: "", Modules: mods } }]);
    }
    async function slefCompresse(v) {
        if (typeof CompressionStream === "undefined") throw new Error("navigateur trop ancien");
        const cs = new Blob([new TextEncoder().encode(slef(v))]).stream().pipeThrough(new CompressionStream("deflate"));
        const buf = new Uint8Array(await new Response(cs).arrayBuffer());
        let bin = ""; for (let i = 0; i < buf.length; i += 8192) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 8192));
        return btoa(bin);   // base64 classique
    }
    async function lienEdsy(v) { return "https://edsy.org/#/I=" + (await slefCompresse(v)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
    // Coriolis (coriolis.io) lit le meme SLEF, compresse en zlib puis en base64, dans /import?data= (comme son propre bouton d'import)
    async function lienCoriolis(v) { return "https://coriolis.io/import?data=" + encodeURIComponent(await slefCompresse(v)); }
    async function ouvrirSimu(v, bouton, nom, faire) {
        const w = window.open("about:blank", "_blank");   // ouverte tout de suite (un onglet ouvert apres un calcul asynchrone serait bloque)
        bouton.disabled = true;
        try { const u = await faire(v); if (w) { w.opener = null; w.location.href = u; } else window.location.href = u; }
        catch (e) { if (w) w.close(); console.error(nom + " :", e); alert("Impossible de préparer le lien " + nom + "."); }
        bouton.disabled = false;
    }
    const ouvrirEdsy = (v, bouton) => ouvrirSimu(v, bouton, "EDSY", lienEdsy);
    const ouvrirCoriolis = (v, bouton) => ouvrirSimu(v, bouton, "Coriolis", lienCoriolis);

    // ---- lecture ----
    async function lire(userId) {
        const cle = CLE_CACHE + (userId || "moi");
        try { const c = JSON.parse(sessionStorage.getItem(cle) || "null"); if (c && Date.now() - c.ts < 180000) return c.d; } catch (e) {}
        const r = userId ? await window.supabaseApp.rpc("hangar_lire", { p_pilote: userId }) : await window.supabaseApp.rpc("hangar_lire");
        if (r.error) { const e = new Error(r.error.message || "erreur"); e.code = r.error.code; e.status = r.status; throw e; }
        try { sessionStorage.setItem(cle, JSON.stringify({ ts: Date.now(), d: r.data })); } catch (e) {}
        return r.data;
    }

    // ---- rendu ----
    const holoDe = (v, id, tz) => { const sil = HoloVaisseau.silDe(v.t); return sil ? HoloVaisseau.vaisseau(sil, id, "", TON[tz]) : HoloVaisseau.generique(id, TON[tz]); };
    function ilYa(s) {
        const d = Math.max(0, Math.floor(Date.now() / 1000 - s));
        if (d < 90) return "à l’instant"; if (d < 5400) return "il y a " + Math.round(d / 60) + " min"; if (d < 129600) return "il y a " + Math.round(d / 3600) + " h"; return "il y a " + Math.round(d / 86400) + " j";
    }
    function detail(v) {
        const tz = tailleDe(v), st = stats(v), sil = HoloVaisseau.silDe(v.t);
        const tete = '<div class="hg-c"><div class="hg-g">' + holoDe(v, "hd" + v.i, tz) + '</div><div class="hg-t"><small><span class="hg-sz">' + LZ[tz] + "</span>" + E(nomVaisseau(v.t).toUpperCase()) + " · " + NZ[tz] + (sil ? "" : " · HOLOGRAMME GÉNÉRIQUE") + "</small><b>" + E(v.n || nomVaisseau(v.t)) + "</b>";
        if (!Array.isArray(v.m)) return '<div class="hg-d t' + tz + '">' + tete + (v.c ? '<div class="rs"><span>VAISSEAU PILOTÉ</span></div>' : "") + '</div></div><div class="hg-inc">Équipement inconnu pour l’instant. Il apparaît dès que le pilote a piloté ce vaisseau avec le plugin lancé, ou a modifié son équipement.</div></div>';
        const g = groupes(v), bloc = (t, a) => a.length ? "<h4>" + t + "</h4>" + a.map(ligne).join("") : "";
        return '<div class="hg-d t' + tz + '">' + tete + '<div class="rs"><span><b>' + st.n + "</b> modules</span><span><b>" + st.g + "</b> ingénierés</span><span><b>" + st.g5 + "</b> en G5</span>" + (v.c ? "<span>PILOTÉ</span>" : "") + '</div>' + (st.n ? '<div class="hg-sim"><button type="button" class="hg-edsy" data-edsy="' + v.i + '">SIMULER SUR EDSY ↗</button><button type="button" class="hg-edsy" data-coriolis="' + v.i + '">VOIR SUR CORIOLIS ↗</button></div><span class="hg-edsy-n">Ouvre cette configuration dans EDSY ou dans Coriolis pour tester l’ingénierie. Les valeurs exactes des jets ne sont pas connues : EDSY part du jet maximal.</span>' : "") + "</div></div>"
            + '<div class="hg-mod">' + bloc("ARMEMENT", g.a) + bloc("UTILITAIRES", g.u) + bloc("MODULES DE BASE", g.c) + bloc("MODULES OPTIONNELS", g.o) + "</div></div>";
    }

    function monterPanneau(cont, data, opts) {
        const tous = (data.vaisseaux || []).slice().sort((a, b) => (b.c ? 1 : 0) - (a.c ? 1 : 0) || nomVaisseau(a.t).localeCompare(nomVaisseau(b.t)) || (a.n || "").localeCompare(b.n || ""));
        const ET = { f: "tous", z: 0, q: "", sel: tous.length ? tous[0].i : null };
        const nIng = tous.reduce((s, v) => s + stats(v).g, 0), nHolo = tous.filter(v => HoloVaisseau.silDe(v.t)).length, nEq = tous.filter(v => Array.isArray(v.m)).length;
        const titre = data.moi ? "MON HANGAR" : "HANGAR · CMDR " + E(String(data.pilote || "").toUpperCase());
        cont.classList.add("hg"); if (opts.inline) cont.classList.add("inl");
        cont.innerHTML = '<div class="hg-h"><div><small>' + (opts.inline ? "VOS VAISSEAUX ET LEUR ÉQUIPEMENT" : "ESCADRON · DOSSIER DU PILOTE") + "</small><b>" + titre + "</b></div>" + (opts.inline ? "" : '<button class="hg-x" data-x="1">FERMER</button>') + "</div>"
            + '<div class="hg-st"><div><small>VAISSEAUX</small><b>' + tous.length + "</b></div><div><small>ÉQUIPEMENT CONNU</small><b>" + nEq + "</b></div><div><small>MODULES INGÉNIÉRÉS</small><b>" + nIng + "</b></div><div><small>AVEC HOLOGRAMME</small><b>" + nHolo + "</b></div></div>"
            + '<div class="hg-b"><input class="hg-q" type="search" placeholder="Rechercher un vaisseau…" aria-label="Rechercher un vaisseau"><div class="hg-f" data-g="f"><button data-f="tous">TOUS</button><button data-f="eng">INGÉNIÉRÉS</button><button data-f="g5">AVEC DU G5</button></div>'
            + '<div class="hg-f" data-g="z"><button class="z t1" data-z="1">S</button><button class="z t2" data-z="2">M</button><button class="z t3" data-z="3">L</button><span class="hg-leg">taille de plateforme</span></div><span class="hg-n"></span></div>'
            + '<div class="hg-m"></div><div class="hg-note">Équipement tel que le plugin l’a vu la dernière fois que le pilote a piloté le vaisseau ou modifié son équipement' + (data.maj ? " · dernière transmission " + ilYa(data.maj) : "") + ". Aucune valeur en crédits ni position de vaisseau n’est affichée.</div>";
        const zone = cont.querySelector(".hg-m"), compte = cont.querySelector(".hg-n");
        function vue() {
            const q = ET.q.trim().toLowerCase();
            return tous.filter(v => (ET.f === "g5" ? stats(v).g5 > 0 : ET.f === "eng" ? stats(v).g > 0 : true) && (!ET.z || tailleDe(v) === ET.z) && (!q || (nomVaisseau(v.t) + " " + (v.n || "")).toLowerCase().indexOf(q) >= 0));
        }
        function dessiner() {
            const aff = vue(); if (!aff.some(v => v.i === ET.sel)) ET.sel = aff.length ? aff[0].i : null;
            cont.querySelectorAll("[data-f]").forEach(b => b.classList.toggle("on", b.dataset.f === ET.f));
            cont.querySelectorAll("[data-z]").forEach(b => b.classList.toggle("on", +b.dataset.z === ET.z));
            compte.textContent = aff.length + " vaisseau" + (aff.length > 1 ? "x" : "");
            if (!aff.length) { zone.innerHTML = '<div class="hg-vide">Aucun vaisseau ne correspond à ces filtres.</div>'; return; }
            const lst = aff.map(v => { const s = stats(v), tz = tailleDe(v); return '<div class="hg-r t' + tz + (v.i === ET.sel ? " on" : "") + '" data-v="' + v.i + '"><div class="hg-th">' + holoDe(v, "ht" + v.i, tz) + '</div><div class="nm"><span class="hg-sz">' + LZ[tz] + "</span>" + E(nomVaisseau(v.t)) + "<small>" + E(v.n || "") + (v.c ? (v.n ? " · " : "") + "piloté" : "") + '</small></div><div class="gs">' + (s.g ? s.g + " ING." : "<i>" + (Array.isArray(v.m) ? "STOCK" : "?") + "</i>") + (s.g5 ? "<br>" + s.g5 + " × G5" : "") + "</div></div>"; }).join("");
            const sel = aff.find(v => v.i === ET.sel);
            const ancien = zone.querySelector(".hg-l"), top = ancien ? ancien.scrollTop : 0;
            zone.innerHTML = '<div class="hg-l">' + lst + "</div>" + detail(sel);
            const l = zone.querySelector(".hg-l"); if (l) l.scrollTop = top;
        }
        cont.addEventListener("click", e => {
            const x = e.target.closest("[data-x]"), r = e.target.closest("[data-v]"), f = e.target.closest("[data-f]"), z = e.target.closest("[data-z]");
            if (x && opts.fermer) { opts.fermer(); return; }
            const ed = e.target.closest("[data-edsy]"); if (ed) { const v = tous.find(y => y.i === +ed.dataset.edsy); if (v) ouvrirEdsy(v, ed); return; }
            const co = e.target.closest("[data-coriolis]"); if (co) { const v = tous.find(y => y.i === +co.dataset.coriolis); if (v) ouvrirCoriolis(v, co); return; }
            if (r) { ET.sel = +r.dataset.v; dessiner(); } else if (f) { ET.f = f.dataset.f; dessiner(); } else if (z) { ET.z = ET.z === +z.dataset.z ? 0 : +z.dataset.z; dessiner(); }
        });
        cont.querySelector(".hg-q").addEventListener("input", e => { ET.q = e.target.value; dessiner(); });
        if (!tous.length) { zone.innerHTML = '<div class="hg-vide">' + (data.moi
            ? "Votre hangar n’a pas encore été transmis.<br>Il se remplit tout seul avec le plugin <b>SYS.EDTEAM 2.41</b> : relancez EDMC une fois, puis revenez ici."
            : "Ce pilote n’a pas encore transmis son hangar.<br>Il apparaîtra dès qu’il aura mis à jour son plugin (2.41).") + "</div>"; compte.textContent = "0 vaisseau"; return; }
        dessiner();
    }

    function message(cont, opts, texte) {
        cont.classList.add("hg"); if (opts.inline) cont.classList.add("inl");
        cont.innerHTML = '<div class="hg-h"><div><small>HANGAR</small><b>HANGAR</b></div>' + (opts.inline ? "" : '<button class="hg-x" data-x="1">FERMER</button>') + '</div><div class="hg-vide" style="flex:1">' + texte + "</div>";
        cont.addEventListener("click", e => { if (opts.fermer && e.target.closest("[data-x]")) opts.fermer(); });
    }
    async function remplir(cont, userId, opts) {
        message(cont, opts, "Chargement du hangar…");
        try {
            await assets();
            const data = await lire(userId);
            if (!data) return message(cont, opts, "Ce hangar n’est pas accessible : il n’est visible que par le pilote lui-même et les membres de son escadron.");
            monterPanneau(cont, data, opts);
        } catch (e) {
            console.error("Hangar :", e);
            const absent = e && (e.status === 404 || e.code === "PGRST202" || e.code === "42883");
            message(cont, opts, absent ? "Le hangar n’est pas encore activé sur le serveur." : "Impossible de lire le hangar pour le moment.<br>Réessayez dans quelques instants.");
        }
    }

    let voile = null;
    function fermer() { if (voile) { voile.remove(); voile = null; } document.removeEventListener("keydown", surTouche); }
    function surTouche(e) { if (e.key === "Escape") fermer(); }
    function ouvrir(userId) {
        fermer();
        voile = document.createElement("div"); voile.id = "hg-voile";
        voile.addEventListener("click", e => { if (e.target === voile) fermer(); });
        let panneau = document.createElement("div"); voile.appendChild(panneau); document.body.appendChild(voile);
        document.addEventListener("keydown", surTouche);
        remplir(panneau, userId || "", { fermer });
    }
    function monter(el) {
        const p = document.createElement("div"); el.innerHTML = ""; el.appendChild(p);
        return remplir(p, "", { inline: true });
    }
    window.EdteamHangar = { ouvrir, monter, fermer };
})();
