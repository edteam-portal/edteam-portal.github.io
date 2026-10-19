// JOUEURS CROISES sur le MOBILE : dernier onglet de la barre du bas (membres d'un escadron). Meme historique que le PC (plugin 2.40, script SQL 105).
// Charge A LA DEMANDE (premiere ouverture de l'onglet) : aucune requete de plus au demarrage du mobile.
// Egress : UN seul appel, joueurs_croises_lire(100), a l'ouverture de l'onglet puis au plus toutes les 5 minutes (bouton ACTUALISER : 1 minute d'ecart) ; recherche, filtres, pages et fiche detail = donnees deja en memoire.
// Hologrammes : silhouettes-data.js + holo-vaisseau.js (fichiers statiques, charges une fois puis en cache) ; dessines pour les 20 premieres lignes, puis 20 de plus a chaque « suite ».
(function () {
    'use strict';
    const M = window.croisesMobile = {};
    const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const FR = n => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const client = () => (typeof supabaseApp !== 'undefined' ? supabaseApp : window.supabaseApp || null);
    const il = t => { if (!t) return '—'; const s = Math.max(0, Math.round(Date.now() / 1000 - t)); if (s < 90) return 'à l’instant'; const m = Math.round(s / 60); if (m < 90) return 'il y a ' + m + ' min'; const h = Math.round(m / 60); if (h < 36) return 'il y a ' + h + ' h'; return 'il y a ' + Math.round(h / 24) + ' j'; };
    const date = t => t ? new Date(t * 1000).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
    const COUL = { r: '#FF3B30', v: '#00FF66', b: '#3D8BFF' }, LIB = { r: 'RECHERCHÉ', v: 'ALLIÉ', b: 'NEUTRE' };
    const PAGE = 20, LIMITE = 100, TTL = 300000, ECART = 60000;
    const ST = { liste: null, total: 0, t: 0, q: '', f: 'tous', nb: PAGE, holo: false, enCours: false, erreur: false, ouvert: null, minuteur: null };

    const CSS = `
#tab-croises{--cm:#00F0FF}
.cm-hero{position:relative;overflow:hidden;padding:16px 16px 14px;border-radius:20px;border:1px solid rgba(0,240,255,.4);background:radial-gradient(circle at 88% 20%,rgba(0,240,255,.2),transparent 55%),linear-gradient(160deg,rgba(0,240,255,.09),rgba(8,12,14,.94) 70%)}
.cm-hero:before{content:"";position:absolute;right:-30px;top:-30px;width:150px;height:150px;border-radius:50%;border:1px dashed rgba(0,240,255,.3)}.cm-hero:after{content:"";position:absolute;right:6px;top:6px;width:90px;height:90px;border-radius:50%;border:1px solid rgba(0,240,255,.35)}
.cm-hero small{display:block;color:var(--cm);letter-spacing:3px;font-size:.62em;position:relative;z-index:2}.cm-hero .n{position:relative;z-index:2;color:#fff;font-size:2.7em;line-height:1.1;text-shadow:0 0 18px rgba(0,240,255,.5);margin-top:4px}
.cm-hero .s{position:relative;z-index:2;color:#9aa7ad;font-size:.72em;margin-top:2px}
.cm-tl{position:relative;z-index:2;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:12px}.cm-tl div{border:1px solid rgba(0,240,255,.28);background:rgba(0,0,0,.35);border-radius:12px;padding:7px 9px}.cm-tl div.r{border-color:rgba(255,59,48,.4)}
.cm-tl i{display:block;font-style:normal;color:#7d8a92;font-size:.54em;letter-spacing:1.5px}.cm-tl b{display:block;font-weight:normal;color:#fff;font-size:1.2em;margin-top:2px}.cm-tl .r b{color:#FF6B5F}
.cm-fl{display:flex;gap:7px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}.cm-fl::-webkit-scrollbar{display:none}
.cm-fl button{flex:none;font-family:inherit;font-size:.62em;letter-spacing:1px;padding:8px 12px;border-radius:20px;border:1px solid rgba(255,255,255,.14);color:#9aa7ad;background:transparent;cursor:pointer}
.cm-fl button.on{border-color:rgba(0,240,255,.6);color:#fff;background:rgba(0,240,255,.14)}
.cm-c{--t:#3D8BFF;display:grid;grid-template-columns:68px minmax(0,1fr) auto;gap:4px 12px;align-items:center;padding:10px 12px 10px 10px;border-radius:16px;border:1px solid rgba(255,255,255,.09);border-left:3px solid var(--t);background:linear-gradient(90deg,color-mix(in srgb,var(--t) 10%,transparent),rgba(255,255,255,.02) 55%);cursor:pointer;-webkit-tap-highlight-color:transparent}
.cm-c:active{background:linear-gradient(90deg,color-mix(in srgb,var(--t) 20%,transparent),rgba(255,255,255,.04) 55%)}
.cm-th{height:52px;border-radius:10px;border:1px solid color-mix(in srgb,var(--t) 42%,transparent);background:radial-gradient(circle,color-mix(in srgb,var(--t) 18%,transparent),rgba(0,0,0,.5));padding:3px;box-sizing:border-box}.cm-th svg{display:block;width:100%;height:100%}.cm-th .tbs-balai,.cm-g .tbs-balai{animation:none}
.cm-nm{min-width:0}.cm-nm b{display:block;color:#fff;font-weight:normal;letter-spacing:1px;font-size:.95em;overflow-wrap:anywhere;line-height:1.25}.cm-nm span{display:block;color:#8fb7bf;font-size:.68em;letter-spacing:.4px;margin-top:2px}
.cm-nm .fa{color:#b9c8ce;font-size:.66em;margin-top:3px;line-height:1.4}.cm-nm .fa span{display:inline;font-size:1em;margin:0;letter-spacing:0}.cm-nm .pw{color:#8fd3ff}.cm-nm .pw0{color:#6f7c84;font-style:italic}.cm-nm .tg{color:#FFD700;letter-spacing:1px}
.cm-ri{text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px;align-self:start}.cm-ri u{text-decoration:none;color:#7d8a92;font-size:.62em;white-space:nowrap}.cm-ri em{font-style:normal;color:#00F0FF;font-size:.8em}
.cm-sy{color:#9fd3e0;font-size:.62em;letter-spacing:.5px;max-width:130px;overflow-wrap:anywhere}
.cm-pm{display:inline-block;border:1px solid #FF3B30;color:#FF6B5F;border-radius:6px;font-size:.54em;letter-spacing:1px;padding:2px 6px;white-space:nowrap}
.cm-plus{display:block;width:100%;background:rgba(0,240,255,.08);border:1px solid rgba(0,240,255,.45);color:#00F0FF;font-family:inherit;font-size:.72em;letter-spacing:2px;padding:13px;border-radius:14px;cursor:pointer}
.cm-vide{color:#8b97a0;text-align:center;padding:26px 14px;font-size:.82em;line-height:1.55}
.cm-bas{display:flex;justify-content:space-between;align-items:center;gap:10px;color:#6f7c84;font-size:.62em}.cm-bas button{font-family:inherit;font-size:1em;letter-spacing:1.5px;background:transparent;border:1px solid rgba(255,255,255,.16);color:#9aa7ad;border-radius:12px;padding:8px 12px;cursor:pointer}
.cm-note{color:#5f6a71;font-size:.58em;line-height:1.5;text-align:center;padding:0 6px}
#modal-croise > .card{padding:0;overflow:hidden;display:flex;flex-direction:column}
.cm-sh{padding:6px 16px 12px;border-bottom:1px solid rgba(255,255,255,.1);flex:none;display:flex;gap:10px;align-items:flex-start}.cm-sh .xsp{flex:1;min-width:0}
.cm-sh b{display:block;color:#fff;font-weight:normal;font-size:1.25em;letter-spacing:1px;overflow-wrap:anywhere}.cm-sh span.k{display:inline-block;margin-top:7px;border:1px solid var(--t);color:var(--t);font-size:.6em;letter-spacing:2px;padding:2px 9px;border-radius:6px}
.cm-sh .x{color:#888;font-size:1.2em;padding:4px 6px;cursor:pointer}
.cm-sb{overflow-y:auto;padding:12px 16px 18px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.cm-g{border:1px solid color-mix(in srgb,var(--t) 42%,transparent);border-radius:16px;background:radial-gradient(circle,color-mix(in srgb,var(--t) 20%,transparent),rgba(0,0,0,.55) 75%);padding:8px;margin-bottom:12px}.cm-g svg{display:block;width:100%;height:auto;max-height:190px}
.cm-dt{display:grid;grid-template-columns:1fr 1fr;gap:11px 14px}.cm-dt div small{display:block;color:#7d8a92;font-size:.56em;letter-spacing:2px}.cm-dt div b{display:block;font-weight:normal;color:#e6f0f3;font-size:.86em;overflow-wrap:anywhere;margin-top:1px}.cm-dt .l{grid-column:1/-1}.cm-dt .pr b{color:#FF6B5F}
@media (prefers-reduced-motion:reduce){.cm-c,.cm-c *{transition:none}}`;
    function style() { if (!document.getElementById('cm-css')) { const s = document.createElement('style'); s.id = 'cm-css'; s.textContent = CSS; document.head.appendChild(s); } }
    const charger = src => new Promise(ok => { const s = document.createElement('script'); s.src = src; s.onload = () => ok(true); s.onerror = () => ok(false); document.head.appendChild(s); });
    async function holos() {
        try { if (typeof SILHOUETTES === 'undefined') await charger('silhouettes-data.js?v=2'); if (!window.HoloVaisseau) await charger('holo-vaisseau.js?v=2'); } catch (e) { /* sans hologramme */ }
        return !!window.HoloVaisseau && typeof SILHOUETTES !== 'undefined';
    }

    // CAMP d'un joueur croise : [ton, libelle]. Ordre : statut legal allie ; puissance (la votre, celle de la fiche pilote, contre la sienne : meme puissance ou meme camp = vert, camp rival = rouge ;
    // camps : Federation, Empire, Alliance, Independants, voir puissances.js) ; recherche ou prime = rouge ; sinon neutre (bleu)
    const estRecherche = x => x.pm > 0 || /wanted|recherch|outlaw|hors.la.loi/i.test(x.l || '');
    const miennePw = () => { try { const p = (typeof profilCommandant !== 'undefined' && profilCommandant) || window.profilCommandant; return (p && p.puissance_nom) || ''; } catch (e) { return ''; } };
    const campDe = x => {
        if (/\b(ami|amie|friend|ally|allie|allié)\b/i.test(x.l || '')) return ['v', 'ALLIÉ'];
        const P = window.EdteamPuissances, moi = miennePw(), rel = P && x.pw && moi ? P.relation(moi, x.pw) : '';
        if (rel === 'meme') return ['v', 'MÊME PUISSANCE'];
        if (rel === 'bloc') return ['v', 'MÊME CAMP : ' + P.nomCamp(x.pw).toUpperCase()];
        if (rel === 'rival') return ['r', P.independantes(moi, x.pw) ? 'PUISSANCE RIVALE' : 'CAMP RIVAL' + (P.nomCamp(x.pw) ? ' : ' + P.nomCamp(x.pw).toUpperCase() : '')];
        return estRecherche(x) ? ['r', 'RECHERCHÉ'] : ['b', 'NEUTRE'];
    };
    const ton = x => campDe(x)[0];
    const joli = k => String(k || '').replace(/_nx$/i, '').replace(/_/g, ' ').replace(/\b[a-z]/g, c => c.toUpperCase());
    const nomDe = x => (x.sl && String(x.sl).toLowerCase() !== String(x.s || '').toLowerCase() ? x.sl : '') || (typeof SILHOUETTES !== 'undefined' && x.s && SILHOUETTES[String(x.s).toLowerCase()] && SILHOUETTES[String(x.s).toLowerCase()].nom) || joli(x.s);
    const pwTxt = x => x.pw ? '<span class="pw">' + E(x.pw) + '</span>' : '<span class="pw0">' + (x.l ? 'Aucune puissance soutenue' : 'Puissance non relevée') + '</span>';
    const holo = (x, id) => { if (!ST.holo) return ''; const t = ton(x); try { return window.HoloVaisseau.mini(x.s, id, t === 'r' ? true : t); } catch (e) { return ''; } };

    function filtrer() {
        const q = ST.q.trim().toLowerCase();
        return (ST.liste || []).filter(x => (!q || [x.n, x.sl, x.s, x.rg, x.f, x.e, x.pw, x.sys, x.par].some(v => String(v || '').toLowerCase().includes(q)))
            && (ST.f === 'tous' || (ST.f === 'recherches' && estRecherche(x)) || (ST.f === 'revus' && x.nb > 1) || (ST.f === 'escadron' && x.e)));
    }
    function carte(x, i) {
        const t = ton(x);
        return '<div class="cm-c" style="--t:' + COUL[t] + '" onclick="croisesMobile.fiche(' + i + ')"><div class="cm-th">' + holo(x, 'cmt' + i) + '</div>'
            + '<div class="cm-nm"><b>CMD ' + E(String(x.n).toUpperCase()) + '</b><span>' + E(nomDe(x)) + (x.rg ? ' · ' + E(String(x.rg).toUpperCase()) : '') + '</span>'
            + '<div class="fa">' + (x.f ? '<div>' + E(x.f) + '</div>' : '') + '<div>' + pwTxt(x) + '</div>' + (x.e ? '<div class="tg">[' + E(x.e) + ']</div>' : '') + '</div></div>'
            + '<div class="cm-ri">' + (x.pm > 0 ? '<span class="cm-pm">PRIME ' + FR(x.pm) + ' CR</span>' : (estRecherche(x) ? '<span class="cm-pm">RECHERCHÉ</span>' : '')) + (x.sys ? '<span class="cm-sy">' + E(x.sys) + '</span>' : '') + '<u>' + il(x.d) + '</u><em>×' + x.nb + '</em></div></div>';
    }
    function corps() {
        const L = ST.liste, el = document.getElementById('cm-corps'); if (!el) return;
        if (!L) { el.innerHTML = '<div class="cm-vide">' + (ST.erreur ? 'Impossible de charger la liste pour le moment.<br><br><button class="cm-plus" onclick="croisesMobile.ouvrir(true)">RÉESSAYER</button>' : 'Chargement des joueurs croisés…') + '</div>'; return; }
        const rech = L.filter(estRecherche).length, revus = L.filter(x => x.nb > 1).length, sem = L.filter(x => x.d > Date.now() / 1000 - 604800).length, semPlus = L.length >= LIMITE && sem === L.length ? '+' : '';
        const A = filtrer(), vus = A.slice(0, ST.nb);
        el.innerHTML = '<div class="cm-hero"><small>COMBAT · ESCADRON</small><div class="n">' + FR(ST.total) + '</div><div class="s">joueur' + (ST.total > 1 ? 's' : '') + ' verrouillé' + (ST.total > 1 ? 's' : '') + ' par l’escadron' + (L.length ? ' · dernier ' + il(L[0].d) : '') + '</div>'
            + '<div class="cm-tl"><div><i>7 JOURS</i><b>' + FR(sem) + semPlus + '</b></div><div class="r"><i>RECHERCHÉS</i><b>' + FR(rech) + '</b></div><div><i>REVUS</i><b>' + FR(revus) + '</b></div></div></div>'
            + '<div class="xsearch" style="margin-top:12px"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input type="text" id="cm-q" maxlength="60" placeholder="Nom, vaisseau, faction, escadron…" value="' + E(ST.q) + '" oninput="croisesMobile.filtre(this.value)"></div>'
            + '<div class="cm-fl" id="cm-fl" style="margin-top:10px">' + [['tous', 'TOUS'], ['recherches', 'RECHERCHÉS'], ['revus', 'REVUS'], ['escadron', 'AVEC ESCADRON']].map(f => '<button data-f="' + f[0] + '" class="' + (ST.f === f[0] ? 'on' : '') + '" onclick="croisesMobile.cat(\'' + f[0] + '\')">' + f[1] + '</button>').join('') + '</div>'
            + '<div id="cm-liste" style="display:flex;flex-direction:column;gap:9px;margin-top:12px"></div>'
            + '<div class="cm-bas" style="margin-top:12px"><span id="cm-maj"></span><button type="button" onclick="croisesMobile.ouvrir(true)">ACTUALISER</button></div>'
            + '<div class="cm-note" style="margin-top:10px">Joueurs que les pilotes de l’escadron ont verrouillés dans l’onglet Combat, conservés 30 jours. Les ' + LIMITE + ' derniers sont affichés. Statut légal, prime et puissance n’apparaissent qu’après un scan complet.</div>';
        liste(); majHeure();
    }
    function liste() {
        const A = filtrer(), vus = A.slice(0, ST.nb), el = document.getElementById('cm-liste'); if (!el) return;
        el.innerHTML = !ST.liste.length ? '<div class="cm-vide">Aucun joueur croisé pour l’instant.<br>Ils s’enregistrent quand un pilote en verrouille un dans l’onglet Combat du tableau de bord (plugin 2.40).</div>'
            : !A.length ? '<div class="cm-vide">Aucun joueur ne correspond à cette recherche ou à ce filtre.</div>'
            : vus.map((x, i) => carte(x, ST.liste.indexOf(x))).join('') + (A.length > vus.length ? '<button type="button" class="cm-plus" onclick="croisesMobile.plus()">AFFICHER LA SUITE (' + FR(A.length - vus.length) + ')</button>' : '');
    }
    function majHeure() { const e = document.getElementById('cm-maj'); if (e) e.textContent = 'Mis à jour ' + il(Math.floor(ST.t / 1000)); }
    M.plus = function () { ST.nb += PAGE; liste(); };
    M.filtre = function (v) { clearTimeout(ST.minuteur); ST.minuteur = setTimeout(() => { ST.q = String(v || ''); ST.nb = PAGE; liste(); }, 180); };
    M.cat = function (f) { ST.f = f; ST.nb = PAGE; document.querySelectorAll('#cm-fl button').forEach(b => b.classList.toggle('on', b.getAttribute('data-f') === f)); liste(); if (typeof sonClic === 'function') sonClic(); };

    // fiche detail : feuille qui monte du bas (donnees deja en memoire : aucune requete)
    M.fiche = function (i) {
        const x = (ST.liste || [])[i]; if (!x) return; if (typeof sonClic === 'function') sonClic();
        let m = document.getElementById('modal-croise');
        if (!m) { m = document.createElement('div'); m.id = 'modal-croise'; m.className = 'modal-overlay'; m.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;display:none;justify-content:center;align-items:flex-end;z-index:6000'; m.onclick = () => { m.style.display = 'none'; }; document.body.appendChild(m); }
        const t = ton(x), det = (k, v, cls) => v ? '<div' + (cls ? ' class="' + cls + '"' : '') + '><small>' + k + '</small><b>' + v + '</b></div>' : '';
        m.innerHTML = '<div class="card" style="--t:' + COUL[t] + '" onclick="event.stopPropagation()"><div class="cm-sh"><div class="xsp"><b>CMD ' + E(String(x.n).toUpperCase()) + '</b><span class="k">' + campDe(x)[1] + '</span></div><span class="x" onclick="document.getElementById(\'modal-croise\').style.display=\'none\'">✕</span></div>'
            + '<div class="cm-sb"><div class="cm-g">' + holo(x, 'cmg') + '</div><div class="cm-dt">'
            + det('VAISSEAU', E(nomDe(x))) + det('RANG', E(x.rg)) + det('FACTION', E(x.f)) + det('ESCADRON DU JOUEUR', E(x.e))
            + det('PUISSANCE', x.pw ? E(x.pw) : (x.l ? 'Aucune puissance soutenue' : 'Non relevée (scan incomplet)'), 'l') + det('STATUT LÉGAL', E(x.l)) + det('PRIME', x.pm > 0 ? FR(x.pm) + ' cr' : '', 'pr')
            + det('PREMIÈRE VUE', date(x.p)) + det('DERNIÈRE VUE', date(x.d)) + det('DERNIER SYSTÈME', E(x.sys)) + det('VU PAR', x.par ? 'CMDR ' + E(String(x.par).toUpperCase()) : '') + det('CROISEMENTS', x.nb) + '</div></div></div>';
        m.style.display = 'flex';
    };

    // ouverture de l'onglet : une lecture si les donnees ont plus de 5 minutes (ou sur demande, 1 minute d'ecart)
    M.ouvrir = async function (force) {
        style();
        if (ST.enCours) return;
        const age = Date.now() - ST.t;
        if (ST.liste && (force ? age < ECART : age < TTL)) { corps(); return; }
        ST.enCours = true; ST.erreur = false; if (!ST.liste) corps();
        try {
            const c = client(); if (!c) throw new Error('client indisponible');
            const [r] = await Promise.all([c.rpc('joueurs_croises_lire', { p_limite: LIMITE }), holos().then(ok => { ST.holo = ok; }), window.EdteamPuissances ? true : charger('puissances.js?v=2')]);
            if (!r || r.error || !r.data) throw new Error(r && r.error ? r.error.message : 'indisponible');
            ST.liste = (r.data.liste || []).filter(x => x && x.n); ST.total = r.data.total || ST.liste.length; ST.t = Date.now(); ST.nb = PAGE;
        } catch (e) { ST.erreur = !ST.liste; console.error('Joueurs croisés :', e); }
        ST.enCours = false; corps();
    };
})();
