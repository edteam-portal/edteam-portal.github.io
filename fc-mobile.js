// FLEET CARRIERS sur le MOBILE : sous-onglet de ESCADRON, en CONSULTATION (la gestion de son carrier reste sur « Mon hangar », page PC).
// Memes donnees et memes caches que l'onglet PC (fc_escadron + fc_sc_lire, 3 minutes dans la session, cle edteam_fc_v1_*) : aucune lecture de plus.
// Charge A LA DEMANDE a la premiere ouverture du sous-onglet. Distances calculees sur l'appareil (aucun appel par carrier).
(function () {
    'use strict';
    if (window.fcMobile) return;
    const M = window.fcMobile = {};
    const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const client = () => (typeof supabaseApp !== 'undefined' ? supabaseApp : window.supabaseApp || null);
    const CLE = 'edteam_fc_v1_', TTL = 180000;
    const ACCES = { all: ['TOUS LES PILOTES', '#00FF66'], squadronfriends: ['ESCADRON ET AMIS', '#00F0FF'], squadron: ['ESCADRON', '#00F0FF'], friends: ['AMIS', '#FFB000'], none: ['FERMÉ', '#8b97a0'] };
    const OUVERT = new Set(['all', 'squadronfriends', 'squadron']);
    const SERVICES = [
        ['Repair', 'RÉPARATION', 'Répare les vaisseaux'], ['Refuel', 'RAVITAILLEMENT', 'Carburant des vaisseaux'], ['Rearm', 'RÉARMEMENT', 'Munitions et armement'],
        ['Shipyard', 'CHANTIER NAVAL', 'Achat, stockage et transfert de vaisseaux'], ['Outfitting', 'ÉQUIPEMENT', 'Achat de modules'], ['CarrierFuel', 'TRITIUM', 'Dépôt de tritium'],
        ['Commodities', 'MARCHÉ', 'Achat et vente de marchandises'], ['VoucherRedemption', 'BONS', 'Encaissement des bons'], ['Exploration', 'CARTOGRAPHIE', 'Universal Cartographics'],
        ['BlackMarket', 'MARCHÉ NOIR', 'Marché noir'], ['VistaGenomics', 'VISTA GENOMICS', 'Vista Genomics'], ['PioneerSupplies', 'PIONEER', 'Pioneer Supplies'], ['Bartender', 'BAR', 'Bar du carrier']
    ];
    const FAMILLES = [['Logistique', ['Repair', 'Refuel', 'Rearm', 'CarrierFuel']], ['Commerce et vaisseaux', ['Commodities', 'BlackMarket', 'VoucherRedemption', 'Shipyard', 'Outfitting']], ['Exploration et vie à bord', ['Exploration', 'VistaGenomics', 'PioneerSupplies', 'Bartender']]];
    const FILTRES_SERVICES = ['Repair', 'Refuel', 'Rearm', 'Shipyard', 'Outfitting'];
    const CLASSES = ['drake', 'victory', 'fortune', 'nautilus'];
    const imgDe = c => 'images/carriers/carrier-' + (c && c.sc ? 'escadron' : (CLASSES.indexOf(c && c.holo) >= 0 ? c.holo : 'drake')) + '.webp';
    const ST = { d: null, liste: [], dirs: [], moi: false, t: 0, q: '', f: 'tous', sv: new Set(), tri: 'recent', enCours: false, erreur: false, coords: {} };

    const CSS = `
#fm-corps{--c:#FFB000;display:flex;flex-direction:column;gap:12px}
.fm-hero{position:relative;overflow:hidden;padding:16px 16px 14px;border-radius:20px;border:1px solid rgba(255,176,0,.42);background:radial-gradient(circle at 90% 18%,rgba(255,176,0,.22),transparent 55%),linear-gradient(160deg,rgba(255,176,0,.09),rgba(8,6,3,.92))}
.fm-hero:before{content:"";position:absolute;right:-34px;top:-34px;width:150px;height:150px;border-radius:50%;border:1px dashed rgba(255,176,0,.3)}
.fm-hero small{display:block;color:var(--c);letter-spacing:3px;font-size:.62em;position:relative;z-index:2}
.fm-hero .n{position:relative;z-index:2;color:#fff;font-size:2.5em;line-height:1.1;font-family:'Rajdhani','Share Tech Mono',sans-serif;font-weight:700;text-shadow:0 0 18px rgba(255,176,0,.4)}
.fm-hero .s{position:relative;z-index:2;color:#a8a08a;font-size:.72em;margin-top:2px}
.fm-tl{position:relative;z-index:2;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:12px}
.fm-tl div{border:1px solid rgba(255,176,0,.28);background:rgba(0,0,0,.38);border-radius:12px;padding:8px 6px;text-align:center}
.fm-tl i{display:block;font-style:normal;color:#8a8168;font-size:.54em;letter-spacing:1.5px}.fm-tl b{display:block;font-weight:normal;color:#fff;font-size:1.25em;margin-top:2px}
.fm-fl{display:flex;flex-wrap:wrap;gap:7px;align-items:center}.fm-fl .lib{flex:none;width:100%;color:#8a8168;font-size:.56em;letter-spacing:2px;margin-top:2px}
.fm-fl button{flex:none;font-family:inherit;font-size:.62em;letter-spacing:1px;padding:7px 11px;border-radius:20px;border:1px solid rgba(255,255,255,.14);color:#a8a08a;background:transparent;cursor:pointer;white-space:nowrap}
.fm-fl button.on{border-color:rgba(255,176,0,.65);color:#fff;background:rgba(255,176,0,.16)}
.fm-tri{display:flex;align-items:center;justify-content:space-between;gap:10px;color:#8a8168;font-size:.62em;letter-spacing:1.5px}
.fm-tri button{font-family:inherit;font-size:1em;letter-spacing:1.5px;padding:6px 11px;border-radius:14px;border:1px solid rgba(255,255,255,.14);color:#cdbf99;background:transparent}
.fm-c{position:relative;display:grid;grid-template-columns:84px minmax(0,1fr);gap:4px 12px;padding:11px 12px 11px 10px;border-radius:16px;border:1px solid rgba(255,255,255,.09);border-left:4px solid var(--k,#FFB000);background:linear-gradient(90deg,color-mix(in srgb,var(--k,#FFB000) 9%,transparent),rgba(255,255,255,.025) 60%);cursor:pointer}
.fm-c:active{background:linear-gradient(90deg,color-mix(in srgb,var(--k,#FFB000) 20%,transparent),rgba(255,255,255,.04) 60%)}
.fm-c.moi{box-shadow:inset 0 0 0 1px rgba(0,240,255,.45)}.fm-c.sc{--k:#00F0FF}
.fm-th{grid-row:1 / span 3;align-self:center;height:66px;border-radius:12px;border:1px solid color-mix(in srgb,var(--k,#FFB000) 40%,transparent);background:radial-gradient(circle,color-mix(in srgb,var(--k,#FFB000) 22%,transparent),rgba(0,0,0,.55) 72%);display:flex;align-items:center;justify-content:center;overflow:hidden}
.fm-th img{max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 0 8px color-mix(in srgb,var(--k,#FFB000) 55%,transparent))}
.fm-l1{display:flex;align-items:baseline;justify-content:space-between;gap:8px;min-width:0}
.fm-nom{color:#fff;font-size:.98em;letter-spacing:1.5px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:'Rajdhani','Share Tech Mono',sans-serif}
.fm-vu{flex:none;color:#7d8a92;font-size:.6em;white-space:nowrap}
.fm-l2{display:flex;flex-wrap:wrap;align-items:center;gap:3px 7px;min-width:0;color:#bfb7a0;font-size:.7em}
.fm-l2 .ph{width:20px;height:20px;font-size:7px;flex:none}.fm-l2 .t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fm-tag{flex:none;border:1px solid currentColor;padding:0 6px;font-size:.78em;letter-spacing:1.5px;border-radius:4px}
.fm-sys{display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0;font-size:.74em}
.fm-sys b{color:#fff;font-weight:normal;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:.5px}.fm-sys i{flex:none;font-style:normal;color:#FFB000;font-size:.92em}
.fm-sv{grid-column:2;display:flex;flex-wrap:wrap;gap:4px;margin-top:3px}
.fm-sv span{padding:1px 7px;border:1px solid #2fe0a8;color:#9ff3d6;background:rgba(47,224,168,.07);font-size:.56em;letter-spacing:1px;border-radius:4px;white-space:nowrap}.fm-sv span.p{border-color:#FFB000;color:#ffd98a;background:rgba(255,176,0,.07)}.fm-sv span.m{border-color:#3a474d;color:#8b97a0;background:transparent}
.fm-msg{grid-column:1 / -1;margin-top:5px;padding:7px 10px;border-left:3px solid #FFB000;background:rgba(255,176,0,.07);color:#ffe2a8;font-size:.72em;line-height:1.45;border-radius:0 8px 8px 0;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.fm-saut{grid-column:1 / -1;margin-top:5px;padding:6px 10px;border-radius:8px;background:rgba(255,77,77,.1);border:1px solid rgba(255,77,77,.35);color:#ffb3b3;font-size:.66em;line-height:1.4}
.fm-vide{color:#8a8168;text-align:center;padding:26px 10px;font-size:.78em;line-height:1.6}
.fm-note{color:#6f7d85;font-size:.62em;line-height:1.55;padding:2px 4px 10px}
#fm-fiche{position:fixed;inset:0;z-index:9300;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.74);backdrop-filter:blur(3px)}
#fm-fiche .fm-sh{width:100%;max-height:92vh;overflow-y:auto;-webkit-overflow-scrolling:touch;background:#0b0905;border:1px solid rgba(255,176,0,.45);border-bottom:0;border-radius:22px 22px 0 0;padding:0 0 calc(22px + env(safe-area-inset-bottom));animation:fmMonte .22s ease-out}
@keyframes fmMonte{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
.fm-sh .top{position:sticky;top:0;z-index:2;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:16px 16px 10px;background:linear-gradient(180deg,#0b0905 75%,rgba(11,9,5,0))}
.fm-sh .top small{display:block;color:var(--k,#FFB000);letter-spacing:3px;font-size:.6em}.fm-sh .top b{display:block;color:#fff;font-size:1.35em;letter-spacing:2px;font-family:'Rajdhani','Share Tech Mono',sans-serif;overflow-wrap:anywhere}
.fm-sh .top .x{flex:none;width:40px;height:40px;border-radius:13px;border:1px solid #3a4a55;color:#9ab;display:grid;place-items:center;font-size:1.1em}
.fm-sh .holo{margin:0 16px;height:150px;border-radius:16px;border:1px solid color-mix(in srgb,var(--k,#FFB000) 40%,transparent);background:radial-gradient(circle at 50% 55%,color-mix(in srgb,var(--k,#FFB000) 24%,transparent),rgba(0,0,0,.6) 72%);display:flex;align-items:center;justify-content:center;overflow:hidden}
.fm-sh .holo img{max-width:92%;max-height:92%;object-fit:contain;filter:drop-shadow(0 0 14px color-mix(in srgb,var(--k,#FFB000) 60%,transparent))}
.fm-sh .grille{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 16px 0}
.fm-sh .grille div{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);border-radius:12px;padding:9px 11px;min-width:0}
.fm-sh .grille small{display:block;color:#7d8a92;font-size:.56em;letter-spacing:2px;margin-bottom:3px}.fm-sh .grille b{display:block;color:#fff;font-weight:normal;font-size:.86em;overflow-wrap:anywhere}
.fm-sh .grille .l{grid-column:1 / -1}
.fm-sh h4{margin:16px 16px 6px;color:#FFB000;font-weight:normal;letter-spacing:3px;font-size:.62em}
.fm-sh .fam{margin:0 16px 8px}.fm-sh .fam h5{margin:8px 0 5px;color:#a8a08a;font-weight:normal;font-size:.62em;letter-spacing:2px;display:flex;justify-content:space-between}
.fm-sh .srv{display:flex;align-items:center;gap:9px;padding:7px 10px;margin-bottom:4px;border-radius:10px;border:1px solid rgba(47,224,168,.3);background:rgba(47,224,168,.05)}
.fm-sh .srv u{flex:none;width:8px;height:8px;border-radius:50%;background:#2fe0a8;box-shadow:0 0 8px #2fe0a8}.fm-sh .srv div{flex:1;min-width:0}.fm-sh .srv b{display:block;color:#fff;font-weight:normal;font-size:.76em;letter-spacing:1px}.fm-sh .srv small{display:block;color:#7d8a92;font-size:.6em}.fm-sh .srv em{flex:none;font-style:normal;color:#9ff3d6;font-size:.56em;letter-spacing:1.5px}
.fm-sh .srv.p{border-color:rgba(255,176,0,.35);background:rgba(255,176,0,.05)}.fm-sh .srv.p u{background:#FFB000;box-shadow:0 0 8px #FFB000}.fm-sh .srv.p em{color:#ffd98a}
.fm-sh .srv.o{border-color:rgba(255,255,255,.08);background:transparent;opacity:.55}.fm-sh .srv.o u{background:#555;box-shadow:none}.fm-sh .srv.o em{color:#8b97a0}
.fm-sh .msg{margin:0 16px;padding:11px 13px;border-left:3px solid #FFB000;background:rgba(255,176,0,.08);color:#ffe2a8;font-size:.82em;line-height:1.55;border-radius:0 10px 10px 0;overflow-wrap:anywhere}
.fm-sh .msg small{display:block;color:#a8a08a;font-size:.72em;margin-top:6px}
.fm-sh .btn{display:block;margin:16px 16px 0;padding:13px;text-align:center;border-radius:13px;border:1px solid rgba(255,176,0,.5);background:rgba(255,176,0,.1);color:#ffd98a;font-family:inherit;font-size:.72em;letter-spacing:2px;width:calc(100% - 32px)}
`;
    function style() {
        if (document.getElementById('fm-css')) return;
        const s = document.createElement('style'); s.id = 'fm-css'; s.textContent = CSS; document.head.appendChild(s);
    }
    const ilYa = s => { if (!s) return '—'; const d = Math.max(0, Math.floor(Date.now() / 1000 - s)); if (d < 90) return 'à l’instant'; if (d < 5400) return 'il y a ' + Math.round(d / 60) + ' min'; if (d < 129600) return 'il y a ' + Math.round(d / 3600) + ' h'; return 'il y a ' + Math.round(d / 86400) + ' j'; };
    const heure = s => { const d = new Date(s * 1000), a = new Date(), hh = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); return d.toDateString() === a.toDateString() ? hh : d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + ' ' + hh; };
    const fmtD = d => d < 10 ? d.toFixed(1).replace('.', ',') : String(Math.round(d)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    const lieu = n => n ? (window.EdteamCopie ? window.EdteamCopie.lieu(n) : E(n)) : '';
    function avatar(c, t) { const P = window.EDTEAMPhotos; return P ? P.avatar({ nom: c.pilote, taille: t || 20, role: c.amiral ? 'amiral' : c.officier ? 'officier' : 'pilote' }) : ''; }
    const etatSrv = (srv, k) => srv && srv[k] === 1 ? 1 : srv && srv[k] === 2 ? 2 : 0;

    async function uid() { try { const r = await client().auth.getSession(); return (r && r.data && r.data.session && r.data.session.user && r.data.session.user.id) || ''; } catch (e) { return ''; } }
    async function lire(nom, cle) {
        const u = await uid();
        try { const c = JSON.parse(sessionStorage.getItem(CLE + cle) || 'null'); if (c && c.u === u && Date.now() - c.ts < TTL) return c.d; } catch (e) { /* pas de memoire */ }
        const r = await client().rpc(nom, {});
        if (r.error) { const e = new Error(r.error.message || 'erreur'); e.code = r.error.code; e.status = r.status; throw e; }
        if (r.data != null) { try { sessionStorage.setItem(CLE + cle, JSON.stringify({ ts: Date.now(), u: u, d: r.data })); } catch (e) { /* tant pis */ } }
        return r.data;
    }
    async function lirePosition() {
        try {
            const u = (window.profilCommandant || {}).user_id; if (!u) return false;
            const r = await client().from('session_live').select('pos:etat->pos,systeme:etat->>systeme,maj_le').eq('user_id', u).maybeSingle();
            const d = r && r.data; if (!d || !Array.isArray(d.pos) || d.pos.length !== 3) return false;
            return { pos: d.pos.map(Number), nom: d.systeme || '', maj: d.maj_le || null };
        } catch (e) { return false; }
    }
    const posC = c => c.x != null ? [c.x, c.y, c.z] : null;
    const dirDe = c => c.dir || ((c.systeme && ST.dirs.find(r => String(r[0]).toLowerCase() === String(c.systeme).toLowerCase())) || [])[1] || null;
    const distMoi = c => { const p = posC(c); return ST.moi && p ? dist3(p, ST.moi.pos) : null; };
    const saut = c => {
        if (!c.destination || !c.depart) return '';
        const reste = c.depart - Date.now() / 1000;
        return reste > 0 ? 'Saut annoncé vers <b>' + E(c.destination) + '</b> · départ ' + E(heure(c.depart)) + ' (dans ' + (reste < 5400 ? Math.max(1, Math.round(reste / 60)) + ' min' : Math.round(reste / 3600) + ' h') + ')'
            : 'Saut annoncé vers <b>' + E(c.destination) + '</b> · <b>arrivée non confirmée</b>';
    };
    const nomC = c => c.nom || c.indicatif || 'Carrier';

    function visibles() {
        const q = ST.q.trim().toLowerCase();
        let l = ST.liste.filter(c => (ST.f !== 'ouverts' || OUVERT.has(c.acces)) && (ST.f !== 'directive' || dirDe(c)) && (ST.f !== 'message' || c.message)
            && Array.from(ST.sv).every(k => c.services && c.services[k] === 1)
            && (!q || [c.nom, c.indicatif, c.pilote, c.systeme].some(x => String(x || '').toLowerCase().indexOf(q) >= 0)));
        const val = c => ST.tri === 'dist' ? distMoi(c) : ST.tri === 'nom' ? String(nomC(c)).toLowerCase() : -(c.vu || 0);
        return l.slice().sort((a, b) => { const x = val(a), y = val(b); if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'fr'); });
    }
    function carte(c, i) {
        const k = c.sc ? '#00F0FF' : (OUVERT.has(c.acces) ? '#FFB000' : '#8b97a0'), acc = ACCES[c.acces], dm = distMoi(c), dt = dirDe(c), sv = c.services && typeof c.services === 'object' ? c.services : null, s = saut(c);
        const chips = !sv ? '<span class="m">services non transmis</span>' : (() => {
            const act = SERVICES.filter(x => etatSrv(sv, x[0]) === 1), pau = SERVICES.filter(x => etatSrv(sv, x[0]) === 2), tous = act.map(x => [x, ''] ).concat(pau.map(x => [x, 'p']));
            if (!tous.length) return '<span class="m">aucun service actif</span>';
            return tous.slice(0, 5).map(([x, cl]) => '<span class="' + cl + '">' + x[1] + '</span>').join('') + (tous.length > 5 ? '<span class="m">+' + (tous.length - 5) + '</span>' : '');
        })();
        return '<div class="fm-c' + (c.moi ? ' moi' : '') + (c.sc ? ' sc' : '') + '" style="--k:' + k + '" onclick="fcMobile.fiche(' + i + ')">'
            + '<div class="fm-th"><img src="' + imgDe(c) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'"></div>'
            + '<div class="fm-l1"><span class="fm-nom">' + E(nomC(c)) + '</span><span class="fm-vu">' + ilYa(c.vu) + '</span></div>'
            + '<div class="fm-l2">' + (c.sc ? '<span class="fm-tag" style="color:#00F0FF">CARRIER D’ESCADRON</span>' : avatar(c) + '<span class="t">CMDR ' + E(String(c.pilote || '?').toUpperCase()) + (c.moi ? ' · vous' : '') + '</span>')
            + (acc ? '<span class="fm-tag" style="color:' + acc[1] + '">' + acc[0] + '</span>' : '') + '</div>'
            + '<div class="fm-sys"><b>' + (c.systeme ? lieu(c.systeme) : '<span style="color:#7d8a92">position inconnue</span>') + '</b>' + (dm != null ? '<i>' + fmtD(dm) + ' al</i>' : '') + '</div>'
            + (dt ? '<div class="fm-sv" style="grid-column:2"><span style="border-color:#FF7100;color:#FF9A4D;background:rgba(255,113,0,.1)">◆ DIRECTIVE · ' + E(String(dt).toUpperCase()) + '</span></div>' : '')
            + '<div class="fm-sv">' + chips + '</div>'
            + (s ? '<div class="fm-saut">' + s + '</div>' : '') + (c.message ? '<div class="fm-msg">💬 ' + E(c.message) + '</div>' : '') + '</div>';
    }
    function corps() {
        const el = document.getElementById('fm-corps'); if (!el) return;
        if (ST.erreur) { el.innerHTML = '<div class="fm-vide">Impossible de lire les carriers pour le moment.<br><button type="button" class="m-btn" style="margin-top:12px;padding:10px 18px;border-radius:12px" onclick="fcMobile.ouvrir(true)">RÉESSAYER</button></div>'; return; }
        if (!ST.d) { el.innerHTML = '<div class="fm-vide">Chargement des carriers…</div>'; return; }
        const l = visibles(), n = ST.liste.length, ouv = ST.liste.filter(c => OUVERT.has(c.acces)).length, msg = ST.liste.filter(c => c.message).length;
        const f = (v, lib) => '<button type="button" class="' + (ST.f === v ? 'on' : '') + '" onclick="fcMobile.filtre(\'' + v + '\')">' + lib + '</button>';
        const sv = FILTRES_SERVICES.map(k => '<button type="button" class="' + (ST.sv.has(k) ? 'on' : '') + '" onclick="fcMobile.service(\'' + k + '\')">' + SERVICES.find(x => x[0] === k)[1] + '</button>').join('');
        const triLib = { recent: 'LES PLUS RÉCENTS', dist: 'LES PLUS PROCHES', nom: 'PAR NOM' }[ST.tri];
        el.innerHTML = '<div class="fm-hero"><small>FLEET CARRIERS DE L’ESCADRON</small><div class="n">' + n + ' carrier' + (n > 1 ? 's' : '') + '</div><div class="s">où se poser, chez qui, avec quoi</div>'
            + '<div class="fm-tl"><div><i>OUVERTS</i><b>' + ouv + '</b></div><div><i>MESSAGES</i><b>' + msg + '</b></div><div><i>DIRECTIVES</i><b>' + ST.liste.filter(c => dirDe(c)).length + '</b></div></div></div>'
            + '<div class="xsearch"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input type="search" id="fm-q" placeholder="Carrier, pilote ou système…" value="' + E(ST.q) + '" autocomplete="off" spellcheck="false" oninput="fcMobile.recherche(this.value)"></div>'
            + '<div class="fm-fl">' + f('tous', 'TOUS') + f('ouverts', 'OUVERTS') + f('message', '💬 MESSAGE') + (ST.liste.some(c => dirDe(c)) ? f('directive', '◆ DIRECTIVE') : '') + '<span class="lib">SERVICES ACTIFS</span>' + sv + '</div>'
            + '<div class="fm-tri"><span>' + l.length + ' / ' + n + ' AFFICHÉS</span><button type="button" onclick="fcMobile.trier()">TRI : ' + triLib + ' ▾</button></div>'
            + '<div id="fm-liste" style="display:flex;flex-direction:column;gap:9px">' + (l.length ? l.map(c => carte(c, ST.liste.indexOf(c))).join('') : '<div class="fm-vide">' + (n ? 'Aucun carrier ne correspond à ces filtres.' : 'Aucun carrier partagé pour l’instant. Les carriers des pilotes apparaissent tout seuls avec le plugin SYS.EDTEAM (relancer EDMC une fois).') + '</div>') + '</div>'
            + '<div class="fm-note">Position et services lus dans le journal de jeu de chaque propriétaire : ils datent de sa dernière session. Distances en années-lumière' + (ST.moi ? ' depuis ' + E(ST.moi.nom || 'votre position') : ' (indisponibles : aucune position de jeu connue)') + '. Chaque pilote choisit s’il partage son carrier.</div>';
        if (window.EdteamCopie && window.EdteamCopie.scanner) window.EdteamCopie.scanner(el);
        const q = document.getElementById('fm-q'); if (q && ST._focus) { q.focus(); try { q.setSelectionRange(q.value.length, q.value.length); } catch (e) { /* ok */ } }
    }
    M.filtre = v => { ST.f = ST.f === v && v !== 'tous' ? 'tous' : v; ST._focus = false; if (typeof sonClic === 'function') sonClic(); corps(); };
    M.service = k => { if (ST.sv.has(k)) ST.sv.delete(k); else ST.sv.add(k); ST._focus = false; if (typeof sonClic === 'function') sonClic(); corps(); };
    M.recherche = v => { ST.q = v; ST._focus = true; corps(); };
    M.trier = () => { const o = ST.moi ? ['recent', 'dist', 'nom'] : ['recent', 'nom']; ST.tri = o[(o.indexOf(ST.tri) + 1) % o.length]; ST._focus = false; if (typeof sonClic === 'function') sonClic(); corps(); };

    M.fiche = i => {
        const c = ST.liste[i]; if (!c) return; if (typeof sonClic === 'function') sonClic();
        let o = document.getElementById('fm-fiche'); if (o) o.remove();
        o = document.createElement('div'); o.id = 'fm-fiche'; o.onclick = e => { if (e.target === o) M.fermer(); };
        const k = c.sc ? '#00F0FF' : '#FFB000', acc = ACCES[c.acces], dm = distMoi(c), sv = c.services && typeof c.services === 'object' ? c.services : null, s = saut(c);
        const fam = !sv ? '<div class="msg" style="border-color:#3a474d;background:transparent;color:#8b97a0">Les services sont transmis par le plugin SYS.EDTEAM : ils apparaîtront ' + (c.sc ? 'à l’appontage d’un membre au carrier.' : 'après la prochaine session du propriétaire.') + '</div>'
            : FAMILLES.map(f => {
                const l = f[1].map(k2 => SERVICES.find(x => x[0] === k2)).filter(Boolean).sort((a, b) => [0, 1, 2][[1, 2, 0].indexOf(etatSrv(sv, a[0]))] - [0, 1, 2][[1, 2, 0].indexOf(etatSrv(sv, b[0]))]);
                const na = l.filter(x => etatSrv(sv, x[0]) === 1).length;
                return '<div class="fam"><h5><span>' + f[0].toUpperCase() + '</span><span>' + na + ' / ' + l.length + ' ACTIFS</span></h5>' + l.map(x => { const e = etatSrv(sv, x[0]); return '<div class="srv' + (e === 2 ? ' p' : e === 0 ? ' o' : '') + '"><u></u><div><b>' + x[1] + '</b><small>' + E(x[2]) + '</small></div><em>' + (e === 1 ? 'ACTIF' : e === 2 ? 'EN PAUSE' : 'DÉSACTIVÉ') + '</em></div>'; }).join('') + '</div>';
            }).join('');
        o.innerHTML = '<div class="fm-sh" style="--k:' + k + '"><div class="top"><div><small>' + (c.sc ? 'CARRIER D’ESCADRON' : 'FLEET CARRIER') + (c.indicatif ? ' · ' + E(c.indicatif) : '') + '</small><b>' + E(nomC(c)) + '</b></div><span class="x" onclick="fcMobile.fermer()">✕</span></div>'
            + '<div class="holo"><img src="' + imgDe(c) + '" alt=""></div>'
            + '<div class="grille"><div><small>' + (c.sc ? 'ESCADRON' : 'PROPRIÉTAIRE') + '</small><b>' + (c.sc ? E(c.escadron || '—') : 'CMDR ' + E(String(c.pilote || '?').toUpperCase())) + '</b></div><div><small>ACCÈS AUX DOCKS</small><b style="color:' + (acc ? acc[1] : '#fff') + '">' + (acc ? acc[0] : 'inconnu') + '</b></div>'
            + '<div class="l"><small>SYSTÈME</small><b>' + (c.systeme ? lieu(c.systeme) : 'position inconnue') + '</b></div><div><small>VU</small><b>' + ilYa(c.vu) + '</b></div><div><small>DISTANCE</small><b>' + (dm != null ? fmtD(dm) + ' al' : '—') + '</b></div></div>'
            + (s ? '<div class="fm-saut" style="margin:12px 16px 0">' + s + '</div>' : '')
            + (c.message ? '<h4>MESSAGE DU PROPRIÉTAIRE</h4><div class="msg">' + E(c.message) + '<small>écrit ' + ilYa(c.message_vu) + (c.message_sys ? ' à ' + E(c.message_sys) : '') + (c.message_sys && c.systeme && String(c.message_sys).toLowerCase() !== String(c.systeme).toLowerCase() ? ' · le carrier a bougé depuis' : '') + '</small></div>' : '')
            + '<h4>SERVICES' + (c.sc && c.services_vu ? ' · relevés ' + ilYa(c.services_vu) + ' à l’appontage' : '') + '</h4>' + fam
            + (c.systeme ? '<button type="button" class="btn" onclick="fcMobile.copier(' + i + ')">COPIER LE SYSTÈME (POUR LA CARTE DU JEU)</button>' : '') + '</div>';
        document.body.appendChild(o); document.documentElement.style.overflow = 'hidden';
        if (window.EdteamCopie && window.EdteamCopie.scanner) window.EdteamCopie.scanner(o);
    };
    M.fermer = () => { const o = document.getElementById('fm-fiche'); if (o) o.remove(); document.documentElement.style.overflow = ''; };
    M.copier = async i => {
        const c = ST.liste[i]; if (!c || !c.systeme) return;
        try { await navigator.clipboard.writeText(c.systeme); } catch (e) { /* ancien navigateur */ }
        const b = document.querySelector('#fm-fiche .btn'); if (b) { b.textContent = 'COPIÉ : ' + c.systeme; setTimeout(() => { if (b.isConnected) b.textContent = 'COPIER LE SYSTÈME (POUR LA CARTE DU JEU)'; }, 2200); }
    };

    M.ouvrir = async function (force) {
        style();
        if (ST.enCours) return;
        if (ST.d && !force && Date.now() - ST.t < TTL) { corps(); return; }
        ST.enCours = true; ST.erreur = false; if (!ST.d) corps();
        try {
            const [d, sc] = await Promise.all([lire('fc_escadron', 'esc'), lire('fc_sc_lire', 'sc').catch(() => null)]);
            if (window.EDTEAMPhotos) { try { await window.EDTEAMPhotos.charger(false); } catch (e) { /* initiales */ } }
            const liste = d && Array.isArray(d.liste) ? d.liste.slice() : [];
            if (sc && sc.systeme) liste.unshift(Object.assign({}, sc, { sc: true, nom: sc.nom || 'Carrier d’escadron', indicatif: sc.indicatif || '', services: sc.services && typeof sc.services === 'object' ? sc.services : null }));
            ST.d = d || { liste: [] }; ST.liste = liste; ST.dirs = d && Array.isArray(d.directives) ? d.directives : []; ST.t = Date.now();
            corps();
            lirePosition().then(p => { ST.moi = p; corps(); });
        } catch (e) { console.error('Carriers (mobile) :', e); ST.erreur = true; corps(); }
        ST.enCours = false;
    };
})();
