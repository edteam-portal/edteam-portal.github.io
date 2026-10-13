// =====================================================================================================
//  HOLOGRAMME DES MODULES DU VAISSEAU (tableau de bord, onglet Missions) — plugin 2.18 (S.vaisseau.mods)
//  Coque au centre ; modules primordiaux (a droite), points d'emport et utilitaires (a gauche) : une ligne avec traits (niveau d'ingenierie G1-G5 ou STOCK) ;
//  modules OPTIONNELS = compartiments dans la coque, proportionnels a la taille de l'emplacement (rendu « scanner infrarouge », decoupes par la coque),
//  types regroupes (divers au nez, cabines, racks de soute a l'arriere), petits modules par paires sur les flancs ; passagers qui se baladent dans les cabines,
//  caisses dans les racks ; infobulle (detail + ingenierie) au survol d'un compartiment. Noms de modules en anglais (donnees Coriolis : modules-data.js).
//  Depend des variables de la page : S, SILHOUETTES, silhouetteActive, esc, fmtN, COUL_MARCH, nomVaisseau, PAS_FAM, famPassagers (resolues a l'appel).
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
    function tip() { let t = document.getElementById("tbm-tip"); if (!t) { t = document.createElement("div"); t.id = "tbm-tip"; document.body.appendChild(t); } return t; }
    if (!window.__tbmInit) {
        window.__tbmInit = true;
        document.addEventListener("mouseover", e => { const h = e.target.closest && e.target.closest(".tbm-hit"); const t = tip(); if (!h) { t.style.display = "none"; return; } t.innerHTML = window.__tbmDet[+h.dataset.d] || ""; t.style.display = "block"; });
        document.addEventListener("mousemove", e => { const t = tip(); if (t.style.display === "block") { t.style.left = Math.min(e.clientX + 16, innerWidth - 350) + "px"; t.style.top = Math.min(e.clientY + 16, innerHeight - 60) + "px"; } });
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
        const nbF = {}; act.filter(m => m.type === "passagers" && Number(m.pas) > 0).forEach(m => { const f = famPassagers(m); nbF[f] = (nbF[f] || 0) + Number(m.pas); });
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
        const BW = W > 400 ? 190 : 226, SC = Math.min((936 - 2 * BW - 24) / W, 780 / H, 1.25), HX = 468 - AXE * SC, HY = 24, P = a => [+(HX + a[0] * SC).toFixed(1), +(HY + a[1] * SC).toFixed(1)];
        const fsL = +(10 / SC).toFixed(1), cw = fsL * 0.6, fsT = +(8.6 / SC).toFixed(1);
        const court = (t, w) => { const cap = Math.floor(w / cw); if (t.length <= cap) return t; return t.slice(0, Math.max(3, cap - 1)) + "…"; };
        let bandes = "", gens = "", hits = "", trous = "", dets = [], caisses = ""; const celRack = [];
        // ---- un compartiment
        const bande = (m, x0, y, w, h) => {
            let nAb = 0; const cab = m.places > 0, rack = m.rack, vide = m.vide, coul = vide ? "#6b7680" : cab ? "#FF9A1F" : rack ? "#00F0FF" : "#B28DFF";
            const lab = vide ? (w < 56 ? "∅" : "EMPTY · size " + m.taille) : w < 56 ? (cab ? "×" + m.places : ini(m.nom)) : court(m.nom + (cab ? " · " + m.places : ""), w - 6);
            bandes += `<rect x="${x0.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${vide ? "rgba(4,9,12,.28)" : cab ? "url(#tbmA)" : rack ? "url(#tbmC)" : "url(#tbmV)"}" filter="url(#tbmf)" stroke="${coul}" stroke-width="1.2" stroke-opacity="${vide ? 0.55 : 0.95}"${vide ? ' stroke-dasharray="4 3"' : ""}/>`
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
            trous += `<rect x="${x0.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="#000"/>`;
            hits += `<rect class="tbm-hit" data-d="${dets.length}" x="${x0.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="#fff" fill-opacity="0"/>`;
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
        const ligne = m => m.vide ? { nom: etiqSlot(m.slot) + " · empty", badge: "", eng: false, vide: true } : { nom: m.nom, badge: m.eng ? "G" + m.eng.niv : "STOCK", eng: !!m.eng };
        const gauche = [], droite = [];
        armes.forEach((m, i) => gauche.push({ cote: "g", anc: P(ancArme(m, i)), coul: "#FF9A1F", L: ligne(m) }));
        utils.forEach((m, i) => gauche.push({ cote: "g", anc: P(ancUtil(m, i)), coul: "#FFD54A", L: ligne(m) }));
        mods.filter(m => m.cat === "core").forEach(m => droite.push({ cote: "d", anc: P(ancCore(m)), coul: "#00F0FF", L: ligne(m) }));
        const BH = 22;
        const boite = (b, y, X) => {
            const bx = b.cote === "g" ? X + BW : X, my = y + BH / 2, pv = b.cote === "g" ? b.anc[0] - 30 : b.anc[0] + 30, vd = b.L.vide;
            return { t: `<polyline points="${b.anc[0]},${b.anc[1]} ${pv},${my} ${bx},${my}" fill="none" stroke="${b.coul}" stroke-width="1.4" stroke-opacity="${vd ? 0.45 : 0.9}"/>`,
                d: `<circle cx="${b.anc[0]}" cy="${b.anc[1]}" r="2" fill="${vd ? "#6b7680" : "#9fb0b8"}" fill-opacity=".8"/>`,
                c: `<rect x="${X}" y="${y}" width="${BW}" height="${BH}" fill="rgba(3,8,12,.9)" stroke="${vd ? "#6b7680" : b.coul}" stroke-opacity="${b.L.eng ? 0.95 : 0.5}"${vd ? ' stroke-dasharray="4 3"' : ""}/>`
                    + `<text x="${X + 7}" y="${y + 15}" fill="${vd ? "#8b97a0" : "#fff"}" font-size="11">${E(solCoupeM(b.L.nom, Math.floor((BW - 38) / 5.5)))}</text><text x="${X + BW - 7}" y="${y + 15}" text-anchor="end" fill="${b.L.eng ? b.coul : "#6f808a"}" font-size="11" font-weight="bold">${b.L.badge}</text>` };
        };
        const solCoupeM = (t, n) => { t = String(t || ""); return t.length > n ? t.slice(0, n - 1) + "…" : t; };
        const empile = (Lb, X, VH) => { Lb.sort((a, b) => a.anc[1] - b.anc[1]); let fin = 6; const o = { t: "", d: "", c: "" }; Lb.forEach(b => { let y = Math.max(fin, b.anc[1] - BH / 2); y = Math.min(y, VH - BH - 6); y = Math.max(y, fin); const r = boite(b, y, X); o.t += r.t; o.d += r.d; o.c += r.c; fin = y + BH + 5; }); o.fin = fin; return o; };
        let VH = Math.round(H * SC) + 60; VH = Math.max(VH, empile(gauche, 6, 99999).fin + 4, empile(droite, 936 - 6 - BW, 99999).fin + 4 + (opts.mini ? 135 : 0));     // mini-carte : place reservee sous les cartes de droite
        const GE = empile(gauche, 6, VH), DE = empile(droite, 936 - 6 - BW, VH);
        window.__tbmDet = dets;
        if (typeof SOUTE !== "undefined") { SOUTE.items = items; SOUTE.large = true; }
        const tr = `translate(${HX.toFixed(1)} ${HY}) scale(${SC.toFixed(3)})`, T = "0 0 0 0 0   0.28 0.55 0.1 0 0   0.36 0.72 0.14 0 0   0 0 0 1 0";
        if (Z.cy == null || Z.k <= 1) { Z.cx = 468; Z.cy = VH / 2; }
        Z.k = Math.max(1, Math.min(4, Z.k)); const zw = 936 / Z.k, zh = VH / Z.k; Z.cx = Math.max(zw / 2, Math.min(936 - zw / 2, Z.cx)); Z.cy = Math.max(zh / 2, Math.min(VH - zh / 2, Z.cy));
        const svg = `<svg class="tb-svgv tbm-zoomable" data-w="936" data-h="${VH}" style="${Z.k > 1 ? "cursor:grab;" : ""}touch-action:none" viewBox="${(Z.cx - zw / 2).toFixed(1)} ${(Z.cy - zh / 2).toFixed(1)} ${zw.toFixed(1)} ${zh.toFixed(1)}" role="img" aria-label="Modules de votre vaisseau"><defs>
            <mask id="tbmL" maskUnits="userSpaceOnUse" x="0" y="0" width="936" height="${VH}"><rect width="936" height="${VH}" fill="#fff"/><g transform="${tr}">${trous}</g></mask>
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
            <g mask="url(#tbmL)">${GE.t}${DE.t}</g>
            <g transform="${tr}"><g clip-path="url(#tbmq)">${bandes}${gens}${hits}${caisses}</g></g>
            ${GE.d}${DE.d}${GE.c}${DE.c}</svg>`;
        // ---- jauge de places, synthese et legendes
        const pleine = places > 0 && nPax > places, pct = places ? Math.min(100, Math.round(nPax / places * 100)) : 0;
        const jauge = nPax || places ? `<div class="tbp-jauge"><span>PLACES</span>${places ? `<div class="bar"><i class="${pleine ? "pleine" : ""}" style="width:${pct}%"></i></div><b style="color:${pleine ? "#FF3B30" : "#FFB44D"}">${nPax}/${places}</b>` : `<b style="color:#FFB44D">${nPax}</b>`}</div>` : "";
        const legI = items.map((x, i) => `<span data-i="${i}" style="--cl:${COUL_MARCH[i % COUL_MARCH.length]}"><i></i>${E(x.n)} · ${fmtN(x.q)} t${x.m ? " (mission)" : ""}</span>`).join(""), leg = Object.keys(PAS_FAM).filter(f => nbF[f]).map(f => `<span style="--cl:${PAS_FAM[f].c}"><i></i>${nbF[f]} ${PAS_FAM[f].l}${PAS_FAM[f].imp ? " (cercle)" : ""}</span>`).join("")
            + attente.map((b, k) => `<span style="--cl:${COUL_MARCH[(items.length + k) % COUL_MARCH.length]}"><i class="sq vide"></i>${E(b.n)} · ${fmtN(b.q)} t à récupérer (sauvetage)</span>`).join("")

        const v = S.vaisseau, note = (items.length && !celRack.length ? "Cargaison à bord sans rack de soute : " + fmtN(tonnes) + " t. " : "") + "Compartiments proportionnels à la taille de chaque emplacement ; disposition stylisée (le jeu ne donne pas la position des modules). Survolez un compartiment pour son détail. Molette ou boutons + / − pour zoomer, glisser pour se déplacer." + (attente.length ? " « ? » = colis de sauvetage à récupérer." : "");
        return `<div class="bloc holo tbp-bloc tbm-bloc"><div class="holo-balayage"></div><h2>MODULES DU VAISSEAU <em>${E(nomVaisseau(v.modele))} · ${mods.filter(m => !m.vide).length} modules${nPax ? " · " + nPax + " passager" + (nPax > 1 ? "s" : "") : ""}${tonnes ? " · " + fmtN(tonnes) + " t à bord" : ""}</em></h2>${jauge}<div class="tb-scene" id="tb-scene" style="position:relative"><div class="tbm-zb"><button type="button" data-tbmz="out" title="Dézoomer">−</button><span class="tbm-zl">${Math.round(Z.k * 100)} %</span><button type="button" data-tbmz="in" title="Zoomer">+</button><button type="button" data-tbmz="reset" title="Vue d'ensemble">⟲</button></div>${svg}${opts.mini || ""}</div>
            <div class="tbp-leg">${leg}</div>${legI ? `<div class="tb-leg" id="tb-leg">${legI}</div>` : ""}${pleine ? `<div class="tb-sub" style="color:#FF3B30;">⚠ ${nPax - places} passager${nPax - places > 1 ? "s" : ""} de plus que de places.</div>` : ""}<div class="tb-sub">${note}</div>${opts.pied || ""}</div>`;
    };
})();
