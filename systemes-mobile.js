// SYSTEMES DE LA FACTION DEFENDUE sur le MOBILE : sous-onglet de ESCADRON, en CONSULTATION (l'ajout et le retrait de la surveillance restent sur le PC, reserves a l'etat-major).
// Memes donnees et memes caches que l'onglet PC : systemes_controles (~20 Ko, 1 heure sur l'appareil, cle edteam_sysfac_v4) et surveillance_lire (10 minutes dans la session, cle edteam_surv_v1) : aucune lecture de plus.
// La fiche d'un systeme n'ajoute aucune lecture serveur ; seule la situation « en direct » des factions est demandee a EDSM par l'appareil (garde 30 minutes). Distances calculees sur l'appareil.
// Charge A LA DEMANDE a la premiere ouverture du sous-onglet.
(function () {
    'use strict';
    if (window.systemesMobile) return;
    const M = window.systemesMobile = {};
    const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const client = () => (typeof supabaseApp !== 'undefined' ? supabaseApp : window.supabaseApp || null);
    const VERSION_ATTENDUE = 6, CLE = 'edteam_sysfac_v5', DUREE = 3600000, CLE_SURV = 'edteam_surv_v1', DUREE_SURV = 600000, CLE_EDSM = 'edteam_sysfac_edsm_v1_', DUREE_EDSM = 1800000, PAGE = 40;
    // colonnes d'une ligne du serveur
    const C = { nom: 0, ctrl: 1, colo: 2, archi: 3, membre: 4, infl: 5, etats: 6, age: 7, nbf: 8, dir: 9, chant: 10, conf: 11, pui: 12, sp: 13, x: 14, y: 15, z: 16, camp: 17, vari: 18, pale: 19, src: 20 };
    const survDe = r => ST.sm.get(String(r[C.nom]).toLowerCase());
    const FILTRES = [
        ['controles', 'TOUS', r => r[C.ctrl] >= 1 || !!survDe(r)],
        ['surveilles', '👁 SURVEILLÉS', r => !!survDe(r)],
        ['alertes', '⚠ EN ALERTE', r => { const s = survDe(r); return !!s && alertes(s).niv >= 1; }],
        ['colonies', 'COLONIES', r => r[C.ctrl] === 1 && r[C.colo] === 1],
        ['membres', 'COLONIES DE MEMBRES', r => r[C.membre] === 1],
        ['directives', 'DIRECTIVE', r => r[C.dir] === 1],
        ['campagnes', 'CAMPAGNE', r => !!r[C.camp]],
        ['conflits', 'CONFLIT', r => r[C.conf] === 1],
        ['chantiers', 'CHANTIERS', r => r[C.chant] > 0],
        ['cibles', 'CIBLES', r => r[C.ctrl] === 2],
        ['non', 'NON CONTRÔLÉES', r => r[C.ctrl] === 0]
    ];
    const PRINCIPAUX = ['controles', 'surveilles', 'alertes', 'colonies', 'membres'];
    const ST = { plus: false, d: null, brut: null, surv: null, sm: new Map(), moi: false, t: 0, q: '', f: 'controles', tri: 'alerte', nb: PAGE, enCours: false, erreur: false };

    const CSS = `
#sm-corps{--c:#00F0FF;display:flex;flex-direction:column;gap:12px}
.sm-hero{position:relative;overflow:hidden;padding:16px 16px 14px;border-radius:20px;border:1px solid rgba(0,240,255,.4);background:radial-gradient(circle at 90% 18%,rgba(0,240,255,.2),transparent 55%),linear-gradient(160deg,rgba(0,240,255,.08),rgba(4,8,10,.92))}
.sm-hero:before{content:"";position:absolute;right:-34px;top:-34px;width:150px;height:150px;border-radius:50%;border:1px dashed rgba(0,240,255,.3)}
.sm-hero small{display:block;color:var(--c);letter-spacing:3px;font-size:.62em;position:relative;z-index:2}
.sm-hero .n{position:relative;z-index:2;color:#fff;font-size:1.9em;line-height:1.12;font-family:'Rajdhani','Share Tech Mono',sans-serif;font-weight:700;overflow-wrap:anywhere;text-shadow:0 0 18px rgba(0,240,255,.4)}
.sm-hero .s{position:relative;z-index:2;color:#9aa7ad;font-size:.7em;margin-top:2px}
.sm-tl{position:relative;z-index:2;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:12px}
.sm-tl button{font-family:inherit;border:1px solid rgba(0,240,255,.28);background:rgba(0,0,0,.38);border-radius:12px;padding:8px 6px;text-align:center;color:inherit}
.sm-tl i{display:block;font-style:normal;color:#7d8a92;font-size:.54em;letter-spacing:1.5px}.sm-tl b{display:block;font-weight:normal;color:#fff;font-size:1.25em;margin-top:2px}
.sm-tl .al b{color:#FFB000}.sm-tl .al.r b{color:#FF5C5C}
.sm-fl{display:flex;flex-wrap:wrap;gap:7px;align-items:center}
.sm-fl button{flex:none;font-family:inherit;font-size:.62em;letter-spacing:1px;padding:7px 11px;border-radius:20px;border:1px solid rgba(255,255,255,.14);color:#9aa7ad;background:transparent;cursor:pointer;white-space:nowrap}
.sm-fl button i{font-style:normal;opacity:.65;margin-left:5px}
.sm-fl button.plus{border-style:dashed;color:#9fe9f2}.sm-fl button.on{border-color:rgba(0,240,255,.6);color:#fff;background:rgba(0,240,255,.14)}
.sm-tri{display:flex;align-items:center;justify-content:space-between;gap:10px;color:#7d8a92;font-size:.62em;letter-spacing:1.5px}
.sm-tri button{font-family:inherit;font-size:1em;letter-spacing:1.5px;padding:6px 11px;border-radius:14px;border:1px solid rgba(255,255,255,.14);color:#b9d6dc;background:transparent}
.sm-c{position:relative;display:flex;flex-direction:column;gap:6px;padding:11px 12px 11px 14px;border-radius:16px;border:1px solid rgba(255,255,255,.09);border-left:4px solid var(--k,#00F0FF);background:linear-gradient(90deg,color-mix(in srgb,var(--k,#00F0FF) 9%,transparent),rgba(255,255,255,.025) 60%);cursor:pointer}
.sm-c:active{background:linear-gradient(90deg,color-mix(in srgb,var(--k,#00F0FF) 20%,transparent),rgba(255,255,255,.04) 60%)}
.sm-c.a1{--k:#FFB000}.sm-c.a2{--k:#FF5C5C}.sm-c.mb{--k:#00FF66}.sm-c.cib{--k:#00F0FF}.sm-c.non{--k:#6a7378}.sm-c.sv0{--k:#B07CFF}
.sm-l1{display:flex;align-items:baseline;justify-content:space-between;gap:8px;min-width:0}
.sm-nom{color:#fff;font-size:.98em;letter-spacing:1px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:'Rajdhani','Share Tech Mono',sans-serif;display:flex;align-items:center;gap:6px;min-width:0}
.sm-nom svg{flex:none;width:15px;height:15px;fill:none;stroke:#B07CFF;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.sm-ar{display:block;font-size:.66em;letter-spacing:.5px;white-space:nowrap}.sm-ar.pale{opacity:.6}.sm-ar em{font-style:normal;color:#7d8a92;margin-left:4px}
.sm-inf{flex:none;text-align:right;line-height:1.15}.sm-inf b{color:#fff;font-weight:normal;font-size:.92em}.sm-inf small{display:block;color:#7d8a92;font-size:.56em}.sm-inf small.v{color:#e0a14d}
.sm-l2{display:flex;flex-wrap:wrap;gap:4px;align-items:center}
.sm-p{display:inline-block;padding:1px 7px;border:1px solid currentColor;font-size:.56em;letter-spacing:1px;border-radius:4px;white-space:nowrap}
.sm-p.n0{color:#8b97a0}.sm-p.n1{color:#FFB000;background:rgba(255,176,0,.1)}.sm-p.n2{color:#FF5C5C;background:rgba(255,77,77,.12)}.sm-p.sv{color:#B07CFF;background:rgba(176,124,255,.1)}
.sm-l3{display:flex;align-items:center;justify-content:space-between;gap:8px;color:#8d9aa0;font-size:.64em;min-width:0}
.sm-l3 .ar{display:flex;align-items:center;gap:6px;min-width:0}.sm-l3 .ar .ph{width:20px;height:20px;font-size:7px;flex:none}.sm-l3 .ar span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sm-l3 i{flex:none;font-style:normal;color:#00F0FF}
.sm-vide{color:#7d8a92;text-align:center;padding:26px 10px;font-size:.78em;line-height:1.6}
.sm-plus{font-family:inherit;padding:12px;border-radius:13px;border:1px solid rgba(0,240,255,.4);background:rgba(0,240,255,.08);color:#9fe9f2;font-size:.7em;letter-spacing:2px}
.sm-note{color:#6f7d85;font-size:.62em;line-height:1.55;padding:2px 4px 10px}
#sm-fiche{position:fixed;inset:0;z-index:9300;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.74);backdrop-filter:blur(3px)}
#sm-fiche .sm-sh{width:100%;max-height:92vh;overflow-y:auto;-webkit-overflow-scrolling:touch;background:#05090b;border:1px solid rgba(0,240,255,.45);border-bottom:0;border-radius:22px 22px 0 0;padding:0 0 calc(22px + env(safe-area-inset-bottom));animation:smMonte .22s ease-out}
@keyframes smMonte{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
.sm-sh .top{position:sticky;top:0;z-index:2;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:16px 16px 10px;background:linear-gradient(180deg,#05090b 75%,rgba(5,9,11,0))}
.sm-sh .top small{display:block;color:#00F0FF;letter-spacing:3px;font-size:.6em}.sm-sh .top b{display:block;color:#fff;font-size:1.35em;letter-spacing:1.5px;font-family:'Rajdhani','Share Tech Mono',sans-serif;overflow-wrap:anywhere}
.sm-sh .top .x{flex:none;width:40px;height:40px;border-radius:13px;border:1px solid #3a4a55;color:#9ab;display:grid;place-items:center;font-size:1.1em}
.sm-sh .bd{display:flex;flex-wrap:wrap;gap:5px;margin:0 16px}
.sm-sh h4{margin:16px 16px 6px;color:#00F0FF;font-weight:normal;letter-spacing:3px;font-size:.62em}
.sm-sh .grille{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 16px}
.sm-sh .grille>div{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);border-radius:12px;padding:9px 11px;min-width:0}
.sm-sh .grille small{display:block;color:#7d8a92;font-size:.56em;letter-spacing:2px;margin-bottom:3px}.sm-sh .grille b{display:block;color:#fff;font-weight:normal;font-size:.86em;overflow-wrap:anywhere}
.sm-sh .grille .l{grid-column:1 / -1}.sm-sh .grille .al{border-color:rgba(255,176,0,.5);background:rgba(255,176,0,.06)}
.sm-sh .grille .sub{display:block;color:#7d8a92;font-size:.7em;margin-top:3px;font-weight:normal}
.sm-sh .grille .ph{width:26px;height:26px;font-size:9px}
.sm-sh .fac{margin:0 16px}.sm-sh .fac .f{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 11px;margin-bottom:5px;border-radius:10px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.025)}
.sm-sh .fac .f.nous{border-color:rgba(0,255,102,.45);background:rgba(0,255,102,.06)}.sm-sh .fac .f.hist{opacity:.5}
.sm-sh .fac .f b{color:#fff;font-weight:normal;font-size:.78em;overflow-wrap:anywhere}.sm-sh .fac .f small{display:block;color:#7d8a92;font-size:.62em;margin-top:1px}.sm-sh .fac .f em{flex:none;font-style:normal;color:#00F0FF;font-size:.9em}
.sm-sh .note{margin:8px 16px 0;color:#7d8a92;font-size:.68em;line-height:1.55}
.sm-sh .lien{display:block;margin:16px 16px 0;padding:13px;text-align:center;border-radius:13px;border:1px solid rgba(0,240,255,.45);background:rgba(0,240,255,.08);color:#9fe9f2;font-family:inherit;font-size:.7em;letter-spacing:2px;text-decoration:none;width:calc(100% - 32px);box-sizing:border-box}
`;
    function style() { if (document.getElementById('sm-css')) return; const s = document.createElement('style'); s.id = 'sm-css'; s.textContent = CSS; document.head.appendChild(s); }
    const OEIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></svg>';
    const lieu = n => n ? (window.EdteamCopie ? window.EdteamCopie.lieu(n) : E(n)) : '';
    const ilYaH = h => { if (h == null) return ''; if (h < 0.03) return 'à l’instant'; if (h < 1) return 'il y a ' + Math.round(h * 60) + ' min'; if (h < 48) return 'il y a ' + Math.round(h) + ' h'; return 'il y a ' + Math.round(h / 24) + ' j'; };
    const ilYaS = s => ilYaH((Date.now() / 1000 - s) / 3600);
    const fmtD = d => d < 10 ? d.toFixed(1).replace('.', ',') : String(Math.round(d)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    function coulEtat(e) {
        const x = String(e || '').toLowerCase();
        if (/war|conflict/.test(x)) return '#FF4D4D'; if (/election/.test(x)) return '#FFB000';
        if (/boom|investment|expansion|pirate attack|civil liberty|public holiday/.test(x)) return /expansion/.test(x) ? '#00F0FF' : '#00FF66';
        if (/bust|famine|blight|outbreak|lockdown|civil unrest|terrorism|retreat|drought|infrastructure|natural disaster|none/.test(x)) return '#e0707c';
        return '#8b97a0';
    }
    const chipsEtats = s => String(s || '').split(',').filter(Boolean).map(e => '<span class="sm-p" style="color:' + coulEtat(e) + '">' + E(e.toUpperCase()) + '</span>').join('');
    function avatar(nom, t) { const P = window.EDTEAMPhotos; return P ? P.avatar({ nom: nom, taille: t || 20, role: 'pilote' }) : ''; }

    // alertes d'un systeme surveille : rouge (2) guerre / election / depart imminent / donnee > 2 x limite ; orange (1) baisse d'influence / donnee > limite ; gris (0) pas de releve
    function alertes(s) {
        const reg = (ST.surv && ST.surv.reglages) || {}, lim = Number(reg.age_surv_h) || 12, seuilB = Number(reg.surv_baisse_pts) || 1, l = [], seuilD = Number(reg.surv_depart_pct) || 3, seuilC = Number(reg.surv_depart_clign_pct) || 2.5;
        if (s.g) l.push({ t: 'GUERRE', n: 2 });
        if (s.e) l.push({ t: 'ÉLECTION', n: 2 });
        if (s.dn && Number(s.di) < seuilD) l.push({ t: 'DÉPART IMMINENT · ' + String(s.dn).toUpperCase() + ' ' + s.di + ' %' + (s.dv ? ' (NOUS)' : ''), n: Number(s.di) < seuilC ? 2 : 1 });
        if (s.b != null && Number(s.b) >= seuilB) l.push({ t: '▼ INFLUENCE −' + Number(s.b).toFixed(1) + ' PT / 24 H', n: 1 });
        if (s.d == null) l.push({ t: 'NON RELEVÉ', n: 0 });
        else { const h = (Date.now() / 1000 - s.d) / 3600; if (h > 2 * lim) l.push({ t: 'DONNÉE ' + Math.round(h) + ' H', n: 2 }); else if (h > lim) l.push({ t: 'DONNÉE ' + Math.round(h) + ' H', n: 1 }); }
        return { l: l, niv: l.reduce((m, x) => Math.max(m, x.n), 0) };
    }

    async function uid() { try { const r = await client().auth.getSession(); return (r && r.data && r.data.session && r.data.session.user && r.data.session.user.id) || ''; } catch (e) { return ''; } }
    async function charger() {
        const u = await uid();
        try { const c = JSON.parse(localStorage.getItem(CLE) || 'null'); if (c && c.d && c.u === u && Date.now() - c.ts < (c.d.v === VERSION_ATTENDUE ? DUREE : 300000)) return c.d; } catch (e) { /* pas de memoire */ }
        const r = await client().rpc('systemes_controles');
        if (r.error) { const e = new Error(r.error.message || 'erreur'); e.code = r.error.code; e.status = r.status; throw e; }
        if (r.data != null) { try { localStorage.setItem(CLE, JSON.stringify({ ts: Date.now(), u: u, d: r.data })); } catch (e) { /* tant pis */ } }
        return r.data;
    }
    async function chargerSurv() {
        ST.surv = null;
        try {
            const u = await uid();
            try { const c = JSON.parse(sessionStorage.getItem(CLE_SURV) || 'null'); if (c && c.u === u && Date.now() - c.ts < DUREE_SURV) { ST.surv = c.d; return; } } catch (e) { /* pas de memoire */ }
            const r = await client().rpc('surveillance_lire');
            if (r.error || !r.data || !Array.isArray(r.data.liste)) return;
            ST.surv = r.data;
            try { sessionStorage.setItem(CLE_SURV, JSON.stringify({ ts: Date.now(), u: u, d: ST.surv })); } catch (e) { /* tant pis */ }
        } catch (e) { ST.surv = null; }
    }
    // la liste du serveur + les systemes surveilles qui n'y sont PAS (ajoutes a la main : type 3)
    function preparer(d) {
        ST.sm = new Map(); const liste = (ST.surv && ST.surv.liste) || [];
        liste.forEach(s => ST.sm.set(String(s.s).toLowerCase(), s));
        const connus = new Set(d.s.map(r => String(r[C.nom]).toLowerCase())), extra = [];
        liste.forEach(s => { if (!connus.has(String(s.s).toLowerCase())) extra.push([s.s, 3, 0, null, 0, null, null, null, null, 0, 0, 0, null, null, s.x, s.y, s.z, null]); });
        return Object.assign({}, d, { s: d.s.concat(extra) });
    }
    async function lirePosition() {
        try {
            const u = (window.profilCommandant || {}).user_id; if (!u) return false;
            const r = await client().from('session_live').select('pos:etat->pos,systeme:etat->>systeme,maj_le').eq('user_id', u).maybeSingle();
            const d = r && r.data; if (!d || !Array.isArray(d.pos) || d.pos.length !== 3) return false;
            return { pos: d.pos.map(Number), nom: d.systeme || '', maj: d.maj_le || null };
        } catch (e) { return false; }
    }
    const distDe = r => ST.moi && r[C.x] != null ? Math.hypot(r[C.x] - ST.moi.pos[0], r[C.y] - ST.moi.pos[1], r[C.z] - ST.moi.pos[2]) : null;
    const niv = r => { const s = survDe(r); return s ? alertes(s).niv : -1; };

    function visibles() {
        const f = FILTRES.find(x => x[0] === ST.f) || FILTRES[0], q = ST.q.trim().toLowerCase();
        let l = ST.d.s.filter(f[2]);
        if (q) l = l.filter(r => String(r[C.nom]).toLowerCase().indexOf(q) >= 0 || String(r[C.archi] || '').toLowerCase().indexOf(q) >= 0);
        const cmp = {
            nom: (a, b) => String(a[C.nom]).localeCompare(String(b[C.nom]), 'fr'),
            alerte: (a, b) => (niv(b) - niv(a)) || String(a[C.nom]).localeCompare(String(b[C.nom]), 'fr'),
            infl: (a, b) => (a[C.infl] == null ? 1 : b[C.infl] == null ? -1 : b[C.infl] - a[C.infl]),
            dist: (a, b) => { const x = distDe(a), y = distDe(b); return x == null ? (y == null ? 0 : 1) : y == null ? -1 : x - y; }
        }[ST.tri] || (() => 0);
        return l.map(r => [r, ST.d.s.indexOf(r)]).sort((a, b) => cmp(a[0], b[0]));
    }
    const ORIGINE = r => r[C.src] === 2 ? 'Spansh' : r[C.src] === 1 ? 'relevé d’installations' : 'pilote ou EDSM';
    // evolution de l'influence de notre faction (SQL 199) : fleche verte = gain, rouge = perte ; « 48 h » = aucune mesure depuis le dernier tick
    function fleche(r) {
        const v = r[C.vari]; if (v == null || r[C.infl] == null) return '';
        const col = v > 0 ? '#00FF66' : v < 0 ? '#FF5C5C' : '#8b97a0', pale = r[C.pale] === 1;
        return '<span class="sm-ar' + (pale ? ' pale' : '') + '" style="color:' + col + '">' + (v > 0 ? '▲ +' : v < 0 ? '▼ −' : '= ') + Math.abs(v).toFixed(1).replace('.', ',') + (pale ? '<em>48 h</em>' : '') + '</span>';
    }
    function carte(r, i) {
        const colo = r[C.colo] === 1, mb = r[C.membre] === 1, sv = survDe(r), al = sv ? alertes(sv) : null, d = distDe(r);
        const cls = (al && al.niv >= 1 ? 'a' + al.niv : al && al.niv === 0 ? 'sv0' : mb ? 'mb' : r[C.ctrl] === 2 ? 'cib' : r[C.ctrl] === 0 ? 'non' : '');
        const type = r[C.ctrl] === 3 ? '<span class="sm-p" style="color:#B07CFF">SURVEILLÉ HORS FACTION</span>' : r[C.ctrl] === 2 ? '<span class="sm-p" style="color:#00F0FF">CIBLE</span>' : r[C.ctrl] === 0 ? '<span class="sm-p" style="color:#8b97a0">NON CONTRÔLÉ</span>' : colo ? '<span class="sm-p" style="color:#FFB44D">COLONIE</span>' : '';
        const pastilles = (al ? al.l.map(x => '<span class="sm-p n' + x.n + '">' + E(x.t) + '</span>').join('') : '') + type + (r[C.dir] ? '<span class="sm-p" style="color:#FF7100">DIRECTIVE</span>' : '') + (r[C.conf] ? '<span class="sm-p" style="color:#FF5C5C">CONFLIT</span>' : '')
            + (r[C.chant] ? '<span class="sm-p" style="color:#FFD700">CHANTIERS ×' + r[C.chant] + '</span>' : '') + chipsEtats(r[C.etats]);
        const inf = r[C.infl] == null ? '<div class="sm-inf"><small>influence non relevée</small></div>' : '<div class="sm-inf"><b>' + r[C.infl].toFixed(1).replace('.', ',') + ' %</b>' + fleche(r) + '<small class="' + (r[C.age] > 72 ? 'v' : '') + '">' + ilYaH(r[C.age]) + (r[C.src] === 2 ? ' · Spansh' : '') + '</small></div>';
        const archi = r[C.archi] ? '<span class="ar">' + avatar(r[C.archi]) + '<span>CMDR ' + E(String(r[C.archi]).toUpperCase()) + (mb ? '' : ' · hors escadron') + '</span></span>' : '<span class="ar"><span>' + (colo ? 'architecte inconnu' : (r[C.nbf] != null ? r[C.nbf] + ' faction' + (r[C.nbf] > 1 ? 's' : '') : '')) + '</span></span>';
        return '<div class="sm-c ' + cls + '" onclick="systemesMobile.fiche(' + i + ')"><div class="sm-l1"><span class="sm-nom">' + (sv ? OEIL : '') + '<span style="overflow:hidden;text-overflow:ellipsis">' + lieu(r[C.nom]) + '</span></span>' + inf + '</div>'
            + (pastilles ? '<div class="sm-l2">' + pastilles + '</div>' : '') + '<div class="sm-l3">' + archi + (d != null ? '<i>' + fmtD(d) + ' al</i>' : '') + '</div></div>';
    }
    function corps() {
        const el = document.getElementById('sm-corps'); if (!el) return;
        if (ST.erreur) { el.innerHTML = '<div class="sm-vide">Impossible de lire les systèmes pour le moment.<br><button type="button" class="m-btn" style="margin-top:12px;padding:10px 18px;border-radius:12px" onclick="systemesMobile.ouvrir(true)">RÉESSAYER</button></div>'; return; }
        if (!ST.d) { el.innerHTML = '<div class="sm-vide">Chargement des systèmes…</div>'; return; }
        if (!ST.d.faction || !Array.isArray(ST.d.s) || !ST.d.s.length) { el.innerHTML = '<div class="sm-vide">La faction défendue de votre escadron n’est pas encore suivie : le tableau apparaîtra dès que son suivi sera en place.</div>'; return; }
        const nbF = f => ST.d.s.filter(f[2]).length, tous = ST.d.s.filter(FILTRES[0][2]).length, alertN = nbF(FILTRES[2]), rouge = ST.d.s.some(r => niv(r) === 2), nbSv = nbF(FILTRES[1]);
        const tmp = visibles(), l = tmp.slice(0, ST.nb);
        const dispo = FILTRES.filter(f => !((f[0] === 'surveilles' || f[0] === 'alertes') && !ST.surv)), ouvert = ST.plus || PRINCIPAUX.indexOf(ST.f) < 0;   // un filtre secondaire actif garde la liste ouverte
        const fl = dispo.filter(f => ouvert || PRINCIPAUX.indexOf(f[0]) >= 0).map(f => '<button type="button" class="' + (ST.f === f[0] ? 'on' : '') + '" onclick="systemesMobile.filtre(\'' + f[0] + '\')">' + f[1] + '<i>' + nbF(f) + '</i></button>').join('')
            + '<button type="button" class="plus" onclick="systemesMobile.plusFiltres()">' + (ouvert ? '− MOINS' : '+ FILTRES') + '</button>';
        const triLib = { nom: 'PAR NOM', alerte: 'ALERTES D’ABORD', infl: 'INFLUENCE', dist: 'LES PLUS PROCHES' }[ST.tri];
        el.innerHTML = '<div class="sm-hero"><small>SYSTÈMES DE LA FACTION DÉFENDUE</small><div class="n">' + E(ST.d.faction) + '</div><div class="s">où nous sommes, qui a colonisé quoi</div>'
            + '<div class="sm-tl"><button type="button" onclick="systemesMobile.filtre(\'controles\')"><i>SYSTÈMES</i><b>' + tous + '</b></button>'
            + (ST.surv ? '<button type="button" class="al' + (rouge ? ' r' : '') + '" onclick="systemesMobile.filtre(\'alertes\')"><i>EN ALERTE</i><b>' + alertN + '</b></button><button type="button" onclick="systemesMobile.filtre(\'surveilles\')"><i>SURVEILLÉS</i><b>' + nbSv + '</b></button>'
                : '<button type="button" onclick="systemesMobile.filtre(\'colonies\')"><i>COLONIES</i><b>' + nbF(FILTRES[3]) + '</b></button><button type="button" onclick="systemesMobile.filtre(\'membres\')"><i>DE MEMBRES</i><b>' + nbF(FILTRES[4]) + '</b></button>') + '</div></div>'
            + '<div class="xsearch"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input type="search" id="sm-q" placeholder="Système ou architecte…" value="' + E(ST.q) + '" autocomplete="off" spellcheck="false" oninput="systemesMobile.recherche(this.value)"></div>'
            + '<div class="sm-fl">' + fl + '</div>'
            + '<div class="sm-tri"><span>' + tmp.length + ' SYSTÈME' + (tmp.length > 1 ? 'S' : '') + '</span><button type="button" onclick="systemesMobile.trier()">TRI : ' + triLib + ' ▾</button></div>'
            + '<div style="display:flex;flex-direction:column;gap:9px">' + (l.length ? l.map(x => carte(x[0], x[1])).join('') : '<div class="sm-vide">' + (ST.f === 'surveilles' ? 'Aucun système surveillé pour l’instant. L’Amiral et les officiers choisissent les systèmes à surveiller depuis le PC.' : ST.f === 'alertes' ? 'Aucun système en alerte : tout est sous contrôle.' : 'Aucun système ne correspond à ce filtre.') + '</div>') + '</div>'
            + (tmp.length > l.length ? '<button type="button" class="sm-plus" onclick="systemesMobile.plus()">AFFICHER ' + Math.min(PAGE, tmp.length - l.length) + ' DE PLUS (' + (tmp.length - l.length) + ' RESTANTS)</button>' : '')
            + '<div class="sm-note">Touchez un système pour sa fiche. Liste mise à jour chaque jour' + (ST.d.maj ? ' (dernière mise à jour ' + ilYaH((Date.now() - new Date(ST.d.maj).getTime()) / 3600000) + ')' : '') + '. L’influence n’est connue que pour les systèmes relevés récemment. La surveillance se règle depuis le PC' + (ST.surv ? '' : ' (non activée sur le serveur)') + '.'
            + (ST.moi ? ' Distances depuis ' + E(ST.moi.nom || 'votre position') + '.' : '') + '</div>';
        if (window.EdteamCopie && window.EdteamCopie.scanner) window.EdteamCopie.scanner(el);
        const q = document.getElementById('sm-q'); if (q && ST._focus) { q.focus(); try { q.setSelectionRange(q.value.length, q.value.length); } catch (e) { /* ok */ } }
    }
    M.filtre = v => { ST.f = v; ST.nb = PAGE; ST._focus = false; if (typeof sonClic === 'function') sonClic(); corps(); };
    M.recherche = v => { ST.q = v; ST.nb = PAGE; ST._focus = true; corps(); };
    M.plusFiltres = () => { ST.plus = !(ST.plus || PRINCIPAUX.indexOf(ST.f) < 0); if (!ST.plus && PRINCIPAUX.indexOf(ST.f) < 0) ST.f = 'controles'; ST._focus = false; if (typeof sonClic === 'function') sonClic(); corps(); };
    M.plus = () => { ST.nb += PAGE; ST._focus = false; corps(); };
    M.trier = () => { const o = ['alerte', 'nom', 'infl'].concat(ST.moi ? ['dist'] : []); ST.tri = o[(o.indexOf(ST.tri) + 1) % o.length]; ST.nb = PAGE; ST._focus = false; if (typeof sonClic === 'function') sonClic(); corps(); };

    async function edsm(nom) {
        const cle = CLE_EDSM + String(nom).toLowerCase();
        try { const c = JSON.parse(sessionStorage.getItem(cle) || 'null'); if (c && Date.now() - c.ts < DUREE_EDSM) return c.d; } catch (e) { /* pas de memoire */ }
        const r = await fetch('https://www.edsm.net/api-system-v1/factions?systemName=' + encodeURIComponent(nom)), d = await r.json();
        if (d && Array.isArray(d.factions)) { const o = { c: d.controllingFaction && d.controllingFaction.name, f: d.factions }; try { sessionStorage.setItem(cle, JSON.stringify({ ts: Date.now(), d: o })); } catch (e) { /* tant pis */ } return o; }
        return null;
    }
    function tableauFactions(d) {
        if (!d || !d.f || !d.f.length) return '<div class="note">EDSM ne connaît pas encore les factions de ce système.</div>';
        const toutes = d.f.slice().sort((a, b) => (b.influence || 0) - (a.influence || 0)), nous = ST.d.faction;
        const pres = toutes.filter(x => (x.influence || 0) > 0), anc = toutes.filter(x => !((x.influence || 0) > 0));
        const moiF = pres.find(x => x.name === nous), rival = pres.find(x => x.name !== nous), ecart = moiF && rival ? (moiF.influence - rival.influence) * 100 : null;
        return '<div class="fac">' + pres.map(x => '<div class="f' + (x.name === nous ? ' nous' : '') + '"><div><b>' + E(x.name) + (x.isPlayer ? ' · JOUEURS' : '') + (x.name === d.c ? ' · ★ CONTRÔLE' : '') + '</b><small>' + E(x.state || '—') + '</small></div><em>' + ((x.influence || 0) * 100).toFixed(1).replace('.', ',') + ' %</em></div>').join('')
            + anc.map(x => '<div class="f hist"><div><b>' + E(x.name) + '</b><small>a quitté le système (historique)</small></div><em>0 %</em></div>').join('') + '</div>'
            + (ecart != null ? '<div class="note">Écart entre ' + E(nous) + ' et la meilleure faction rivale (' + E(rival.name) + ') : <b style="color:' + (ecart >= 0 ? '#00FF66' : '#FF5C5C') + '">' + (ecart >= 0 ? '+' : '') + ecart.toFixed(1).replace('.', ',') + ' points</b>.</div>' : '');
    }
    M.fiche = async i => {
        const r = ST.d && ST.d.s[i]; if (!r) return; if (typeof sonClic === 'function') sonClic();
        const colo = r[C.colo] === 1, mb = r[C.membre] === 1, sv = survDe(r), al = sv ? alertes(sv) : null, d = distDe(r);
        let o = document.getElementById('sm-fiche'); if (o) o.remove();
        o = document.createElement('div'); o.id = 'sm-fiche'; o.onclick = e => { if (e.target === o) M.fermer(); };
        const bd = (r[C.ctrl] === 2 ? '<span class="sm-p" style="color:#00F0FF">CIBLE</span>' : '') + (r[C.ctrl] === 0 ? '<span class="sm-p" style="color:#8b97a0">NON CONTRÔLÉE</span>' : '') + (r[C.ctrl] === 3 ? '<span class="sm-p" style="color:#B07CFF">SURVEILLÉ HORS FACTION</span>' : '') + (colo ? '<span class="sm-p" style="color:#FFB44D">COLONIE</span>' : '')
            + (r[C.dir] ? '<span class="sm-p" style="color:#FF7100">DIRECTIVE</span>' : '') + (r[C.conf] ? '<span class="sm-p" style="color:#FF5C5C">CONFLIT</span>' : '') + (r[C.camp] ? '<span class="sm-p" style="color:#00F0FF">EN CAMPAGNE</span>' : '') + (sv ? '<span class="sm-p sv">SURVEILLÉ</span>' : '');
        const cs = (t, v, cl, sub) => '<div' + (cl ? ' class="' + cl + '"' : '') + '><small>' + t + '</small><b>' + v + (sub ? '<span class="sub">' + sub + '</span>' : '') + '</b></div>';
        const surv = sv ? '<h4>SURVEILLANCE</h4><div class="grille">' + cs('SURVEILLÉ PAR', sv.par ? 'CMDR ' + E(String(sv.par).toUpperCase()) : 'l’état-major', '', ilYaS(sv.le))
            + cs('DONNÉE', sv.d == null ? 'non relevée' : ilYaS(sv.d)) + cs('ALERTES', al.l.some(x => x.n > 0 || x.t === 'NON RELEVÉ') ? al.l.map(x => '<span class="sm-p n' + x.n + '">' + E(x.t) + '</span>').join(' ') : '<span style="color:#2fe0a8">AUCUNE</span>', 'l') + '</div>'
            : (ST.surv ? '<div class="note">Ce système n’est pas surveillé. L’état-major le surveille depuis le PC.</div>' : '');
        o.innerHTML = '<div class="sm-sh"><div class="top"><div><small>SYSTÈME · ' + E(String(ST.d.faction || '').toUpperCase()) + '</small><b>' + lieu(r[C.nom]) + '</b></div><span class="x" onclick="systemesMobile.fermer()">✕</span></div>'
            + '<div class="bd">' + bd + '</div>' + surv
            + '<h4>NOTRE FACTION</h4><div class="grille">'
            + cs('INFLUENCE', r[C.infl] == null ? 'non relevée' : r[C.infl].toFixed(1).replace('.', ',') + ' %' + fleche(r), r[C.age] > 168 ? 'al' : '', r[C.infl] == null ? '' : 'relevé ' + ilYaH(r[C.age]) + ' (' + ORIGINE(r) + ')')
            + cs('ÉTATS', chipsEtats(r[C.etats]) || '—') + cs('FACTIONS', r[C.nbf] == null ? '—' : r[C.nbf])
            + cs('DONNÉE SPANSH', r[C.sp] == null ? '—' : ilYaH(r[C.sp] * 24), r[C.sp] > 21 ? 'al' : '') + (d != null ? cs('DISTANCE', fmtD(d) + ' al', '', 'depuis ' + E(ST.moi.nom || 'votre position')) : '') + '</div>'
            + (colo ? '<h4>COLONIE</h4><div class="grille">' + cs('ARCHITECTE', r[C.archi] ? avatar(r[C.archi], 26) + ' CMDR ' + E(String(r[C.archi]).toUpperCase()) : 'inconnu') + cs('MEMBRE DE L’ESCADRON', r[C.archi] ? (mb ? '<span style="color:#00FF66">OUI</span>' : '<span style="color:#8b97a0">NON</span>') : '—') + cs('CHANTIERS EN COURS', r[C.chant] || '0') + '</div>'
                + (r[C.archi] ? '' : '<div class="note">L’architecte n’est connu que lorsque le plugin d’un pilote a relevé la revendication du système.</div>') : '')
            + '<h4>SITUATION EN DIRECT (EDSM)</h4><div id="sm-fd"><div class="note">Chargement des factions…</div></div>'
            + '<a class="lien" href="bgs.html">PAGE BGS</a>' + (colo ? '<a class="lien" href="colonisation.html" style="margin-top:8px">PAGE COLONISATION</a>' : '') + '</div>';
        document.body.appendChild(o); document.documentElement.style.overflow = 'hidden';
        if (window.EdteamCopie && window.EdteamCopie.scanner) window.EdteamCopie.scanner(o);
        const z = o.querySelector('#sm-fd');
        try { z.innerHTML = tableauFactions(await edsm(r[C.nom])); } catch (e) { z.innerHTML = '<div class="note">EDSM est injoignable pour le moment. Les chiffres ci-dessus restent ceux du serveur.</div>'; }
    };
    M.fermer = () => { const o = document.getElementById('sm-fiche'); if (o) o.remove(); document.documentElement.style.overflow = ''; };

    M.ouvrir = async function (force) {
        style();
        if (ST.enCours) return;
        if (ST.d && !force && Date.now() - ST.t < 300000) { corps(); return; }
        ST.enCours = true; ST.erreur = false; if (!ST.d) corps();
        try {
            if (window.EDTEAMPhotos) { try { await window.EDTEAMPhotos.charger(false); } catch (e) { /* initiales */ } }
            const d = await charger();
            if (!d) { ST.d = { faction: null, s: [] }; ST.t = Date.now(); corps(); ST.enCours = false; return; }
            ST.brut = d; await chargerSurv(); ST.d = preparer(d); ST.t = Date.now();
            corps();
            lirePosition().then(p => { ST.moi = p; corps(); });
        } catch (e) { console.error('Systemes (mobile) :', e); ST.erreur = true; corps(); }
        ST.enCours = false;
    };
})();
