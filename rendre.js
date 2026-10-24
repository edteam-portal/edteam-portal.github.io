// « OU VENDRE L'EXPLORATION ? » (ligne Science) et « OU RENDRE LES BONS ? » (ligne Securite) d'une directive de HAUSSE.
// Donnees : routes_rendre() (SQL 155 : Spansh, memoire 2 h). Regles de comptage de SYS.EDTEAM :
//   exploration -> faction qui controle la station de vente + systeme ; bons de securite -> faction qui a emis le bon + systeme ou on le rend.
// Ne dit PAS ou gagner les donnees ni les bons : les fenetres le precisent.
(function () {
    'use strict';
    const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const lire = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
    const ecrire = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* stockage indisponible : sans effet */ } };
    const db = () => window.supabaseApp || null;
    const fr = (n, d) => Number(n).toLocaleString('fr-FR', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });

    const TYPE = { 'Settlement': 'COLONIE AU SOL', 'Planetary Outpost': 'AVANT-POSTE PLANÉTAIRE', 'Planetary Port': 'PORT PLANÉTAIRE', 'Outpost': 'AVANT-POSTE ORBITAL', 'Coriolis Starport': 'STATION CORIOLIS',
        'Orbis Starport': 'STATION ORBIS', 'Ocellus Starport': 'STATION OCELLUS', 'Asteroid base': 'BASE ASTÉROÏDE', 'Mega ship': 'MÉGA-VAISSEAU', 'Dockable Planetary Station': 'STATION PLANÉTAIRE' };
    const SERV = { 'Market': 'marché', 'Missions': 'missions', 'Restock': 'réarmement', 'Refuel': 'ravitaillement', 'Repair': 'réparations', 'Workshop': 'atelier', 'Crew Lounge': 'salle d\'attente',
        'Outfitting': 'équipement', 'Shipyard': 'chantier naval', 'Black Market': 'marché noir', 'Search and Rescue': 'sauvetage', 'Engineer': 'ingénieur', 'Bartender': 'barman', 'Contacts': 'contacts',
        'Interstellar Factors': 'facteurs interstellaires', 'Material Trader': 'négociant de matériaux', 'Technology Broker': 'courtier technologique', 'Vista Genomics': 'génomique' };
    const SERV_IGNORES = ['Dock', 'Autodock', 'Station Menu', 'Missions Generated', 'Station Operations', 'Flight Controller', 'Universal Cartographics', 'Registering Colonisation'];
    const CONFLIT = ['War', 'Civil War', 'Election'];
    const ETAT = { 'Civil War': 'Guerre civile', 'War': 'Guerre', 'Election': 'Élection', 'None': 'Aucun' };
    const THEME = { explo: { c: '#B026FF', b: 'rgba(176,38,255,.08)', c2: '#8a6ad6' }, bons: { c: '#00F0FF', b: 'rgba(0,240,255,.07)', c2: '#00F0FF' } };

    const CSS = `
    #rd-overlay{position:fixed;inset:0;z-index:7000;background:rgba(0,0,0,.86);display:none;align-items:flex-start;justify-content:center;padding:18px;overflow-y:auto;font-family:inherit}
    #rd-overlay *{box-sizing:border-box}
    .rd-m{width:100%;max-width:1100px;border:1px solid var(--th);background:linear-gradient(180deg,var(--thb),rgba(8,5,2,.98) 140px);box-shadow:0 0 30px var(--thb);color:#ccc;margin:auto 0}
    .rd-tete{padding:14px 22px 12px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;border-bottom:1px solid var(--th)}
    .rd-tete small{color:#8a8a8a;letter-spacing:3px;font-size:.7em}
    .rd-tete h2{margin:4px 0 0;font-weight:normal;color:var(--th);letter-spacing:3px;font-size:1.5em;text-shadow:0 0 14px var(--thb);line-height:1.15}
    .rd-tete h2 span{display:block;color:#fff;font-size:.55em;letter-spacing:2px;margin-top:4px;text-shadow:none}
    .rd-x{color:var(--th);font-weight:bold;cursor:pointer;font-size:1.3em;padding:2px 6px}
    .rd-corps{padding:16px 22px 8px}
    .rd-cible{display:flex;align-items:center;gap:16px;border:1px solid var(--th);border-left:4px solid var(--th);background:var(--thb);padding:10px 16px;margin-bottom:14px;flex-wrap:wrap}
    .rd-cible .lib{color:var(--th);font-size:.64em;letter-spacing:3px;margin-bottom:2px}.rd-cible .nom{color:#fff;font-size:1.2em;letter-spacing:2px}.rd-cible .sous{color:#8fb7bf;font-size:.76em;margin-top:3px}
    .rd-inf{margin-left:auto;min-width:230px;text-align:right}.rd-inf .t{font-size:.66em;letter-spacing:2px;color:#888}.rd-inf .b{height:7px;margin:5px 0 4px;background:#222;position:relative}.rd-inf .b i{position:absolute;left:0;top:0;bottom:0;background:var(--th)}.rd-inf .v{font-size:.78em}
    .rd-ctx{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
    .rd-tu{border:1px solid #2c2c2c;border-top:2px solid var(--c,var(--th));background:rgba(0,0,0,.45);padding:9px 12px;min-width:0}
    .rd-tu .t{font-size:.64em;letter-spacing:3px;color:#888}.rd-tu .v{color:#fff;font-size:1.25em;margin:3px 0 2px;letter-spacing:1px}.rd-tu .d{font-size:.72em;color:#8a9;line-height:1.45}
    .rd-obj{border:1px dashed var(--th);background:var(--thb);padding:8px 14px;font-size:.78em;line-height:1.7;margin-bottom:16px;color:#bcc}.rd-obj b{color:#fff;font-weight:normal}
    .rd-pill{display:inline-block;border:1px solid;border-radius:3px;padding:2px 9px;font-size:.68em;letter-spacing:2px;white-space:nowrap}
    .rd-ok{color:#00FF66;border-color:#00FF66;background:rgba(0,255,102,.08)}.rd-vx{color:#e8a35a;border-color:#e8a35a;background:rgba(232,163,90,.08)}
    .rd-tri{display:flex;align-items:center;gap:10px;font-size:.74em;color:#999;letter-spacing:1px;margin-bottom:10px;flex-wrap:wrap}
    .rd-seg{display:inline-flex;border:1px solid #444;border-radius:3px;overflow:hidden}.rd-seg button{background:transparent;border:0;border-right:1px solid #333;color:#999;font-family:inherit;font-size:1em;padding:3px 10px;cursor:pointer}.rd-seg button:last-child{border:0}.rd-seg button.on{background:rgba(0,240,255,.15);color:#00F0FF}
    .rd-col{border:1px solid #2c2c2c;border-left:4px solid var(--c);background:rgba(0,0,0,.5);padding:12px 16px;margin-bottom:12px;display:grid;grid-template-columns:44px minmax(0,1.3fr) minmax(0,1fr);gap:6px 18px}
    .rd-rang{width:36px;height:36px;border-radius:50%;border:1px solid var(--c);color:var(--c);display:grid;place-items:center;font-size:1.05em}
    .rd-nm b{color:#fff;font-weight:normal;font-size:1.15em;letter-spacing:2px;cursor:copy;border-bottom:1px dotted #666}.rd-nm .sy{color:#00F0FF;font-size:.8em;margin:3px 0 7px;overflow-wrap:anywhere}.rd-nm .tags{display:flex;gap:6px;flex-wrap:wrap}
    .rd-tg{border:1px solid #3a4650;color:#9ab;padding:1px 8px;font-size:.68em;letter-spacing:1px}.rd-tg.v{border-color:var(--th);color:var(--th)}
    .rd-srv{margin-top:8px;color:#778;font-size:.72em;line-height:1.7}.rd-srv u{text-decoration:none;color:#9ab}
    .rd-dt{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;font-size:.78em;align-content:start}
    .rd-dt div small{display:block;color:#777;letter-spacing:2px;font-size:.78em}.rd-dt div b{color:#fff;font-weight:normal}
    .rd-ba{grid-column:2/4;height:5px;background:#1c1c1c;margin-top:4px}.rd-ba i{display:block;height:100%;background:var(--c);box-shadow:0 0 6px var(--c)}
    .rd-grp{margin:18px 0 8px;color:#aaa;letter-spacing:3px;font-size:.72em;display:flex;gap:10px;align-items:center;flex-wrap:wrap}.rd-grp b{color:var(--th);font-weight:normal}.rd-grp span{letter-spacing:.5px;color:#888}
    .rd-rep{border:1px dashed #556;background:rgba(0,0,0,.35);padding:9px 14px;font-size:.76em;color:#99a;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
    .rd-rep button{background:transparent;color:#FFB000;border:1px solid #FFB000;padding:2px 10px;letter-spacing:2px;font-size:.9em;font-family:inherit;cursor:pointer}
    .rd-msg{padding:30px 18px;text-align:center;color:#aaa;line-height:1.7}.rd-msg b{color:var(--th);letter-spacing:2px;font-weight:normal;display:block;margin-bottom:6px}
    .rd-spin{display:inline-block;width:14px;height:14px;border:2px solid var(--th);border-top-color:transparent;border-radius:50%;animation:rdTourne .9s linear infinite;vertical-align:-2px;margin-right:8px}
    @keyframes rdTourne{to{transform:rotate(360deg)}}
    .rd-pied{padding:6px 22px 16px;color:#777;font-size:.72em;line-height:1.7}.rd-pied b{color:#bbb;font-weight:normal}
    @media (prefers-reduced-motion:reduce){.rd-spin{animation:none}}
    @media (max-width:760px){#rd-overlay{padding:8px}.rd-corps{padding:12px 12px 6px}.rd-tete,.rd-pied{padding-left:12px;padding-right:12px}.rd-ctx{grid-template-columns:1fr}.rd-col{grid-template-columns:1fr}.rd-ba{grid-column:1}.rd-inf{margin-left:0;text-align:left;min-width:0;width:100%}.rd-tete h2{font-size:1.2em}}`;

    const etat = { mode: 'explo', ordre: null, systeme: '', faction: '', statut: 'EN_COURS', message: '', donnees: null, calc_le: null, jeton: 0, plus: {} };
    const tri = () => (lire('edteam_rendre_tri') === 'loin' ? 'loin' : 'proche');
    const th = () => THEME[etat.mode];

    function ageH(maj) { const t = Date.parse(maj || ''); return isNaN(t) ? null : Math.max(0, (Date.now() - t) / 3600000); }
    function ageTxt(h) {
        if (h === null) return 'date inconnue';
        if (h < 1) return 'il y a moins d\'1 h';
        if (h < 24) return 'il y a ' + Math.round(h) + ' h';
        const j = Math.floor(h / 24);
        return j === 1 ? 'hier' : j < 14 ? 'il y a ' + j + ' j' : j < 60 ? 'il y a ' + Math.round(j / 7) + ' semaines' : 'il y a ' + Math.round(j / 30) + ' mois';
    }
    const ouvert = () => { const o = document.getElementById('rd-overlay'); return !!o && o.style.display !== 'none'; };
    function assurerDom() {
        if (!document.getElementById('rd-style')) { const s = document.createElement('style'); s.id = 'rd-style'; s.textContent = CSS; document.head.appendChild(s); }
        let o = document.getElementById('rd-overlay');
        if (!o) {
            o = document.createElement('div'); o.id = 'rd-overlay';
            o.addEventListener('click', ev => { if (ev.target === o) api.fermer(); });
            document.body.appendChild(o);
            document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && ouvert()) api.fermer(); });
        }
        return o;
    }

    // ----- morceaux communs -----
    const nomFaction = () => String(etat.faction).trim().toLowerCase();
    function infl(d) {
        const res = ((window.cacheResultatsBgs || {}).dir || {})[etat.ordre] || null, fs = (d.systeme || {}).factions || [];
        const ma = fs.find(f => String(f.nom || '').trim().toLowerCase() === nomFaction());
        const inf = res && res.influence != null ? Number(res.influence) : (ma && ma.influence != null ? Number(ma.influence) : null);
        return { inf, rang: ma ? fs.indexOf(ma) + 1 : null, n: fs.length };
    }
    function blocCible(d) {
        const s = d.systeme || {}, I = infl(d), gouv = [s.allegeance, s.gouvernement].filter(Boolean).join(' · ');
        return '<div class="rd-cible"><div><div class="lib">FACTION À SOUTENIR</div><div class="nom">' + E(String(etat.faction).toUpperCase()) + '</div><div class="sous">' + E(String(etat.systeme).toUpperCase()) + (gouv ? ' · ' + E(gouv) : '')
            + (s.population != null ? ' · ' + E(fr(s.population)) + ' habitants' : '') + '</div></div>'
            + (I.inf !== null ? '<div class="rd-inf"><div class="t">INFLUENCE DANS LE SYSTÈME</div><div class="b"><i style="width:' + Math.min(100, I.inf * 100).toFixed(1) + '%"></i></div><div class="v"><b style="color:#fff">' + fr(I.inf * 100, 1) + ' %</b>'
                + (I.rang ? ' · faction n°' + I.rang + ' sur ' + I.n : '') + '</div></div>' : '') + '</div>';
    }
    function tuileObjectif(ty, lib, texte) {
        const QJ = window.EdteamQuotas, Qd = (window.cacheQuotasBgs || {})[etat.ordre];
        const l = QJ && Qd ? (QJ.lignes('HAUSSE', Qd) || []).find(x => x.ty === ty) : null;
        return l && l.q ? '<div class="rd-tu" style="--c:' + th().c + '"><div class="t">TON OBJECTIF DU TICK</div><div class="v">' + E(QJ.val(ty, l.s)) + ' / ' + E(QJ.val(ty, l.q)) + '</div><div class="d">' + E(lib) + (l.reduit ? ' · <b style="color:#2fe07a;font-weight:normal">✓ plein effet atteint</b>' : '') + '</div></div>'
            : '<div class="rd-tu" style="--c:' + th().c + '"><div class="t">TON OBJECTIF DU TICK</div><div class="v">—</div><div class="d">' + E(texte) + '</div></div>';
    }
    function tuileConflit(d) {
        const fs = (d.systeme || {}).factions || [], ma = fs.find(f => String(f.nom || '').trim().toLowerCase() === nomFaction());
        const enConf = fs.filter(f => CONFLIT.includes(f.etat));
        if (!enConf.length) return '<div class="rd-tu" style="--c:#00F0FF"><div class="t">CONFLIT DANS LE SYSTÈME</div><div class="v">Aucun</div><div class="d">Ni guerre ni élection relevée dans le système.</div></div>';
        const types = [...new Set(enConf.map(f => ETAT[f.etat] || f.etat))];
        return '<div class="rd-tu" style="--c:#FFB000"><div class="t">CONFLIT DANS LE SYSTÈME</div><div class="v">' + E(types.join(' · ')) + '</div><div class="d">' + enConf.map(f => E(f.nom)).join(' · ')
            + (ma && CONFLIT.includes(ma.etat) ? ' · <b style="color:#fff;font-weight:normal">la faction soutenue y participe</b>' : ' · la faction soutenue n\'y participe pas') + '</div></div>';
    }
    function plateformes(s) { return fr(s.moyennes || 0) + ' M · ' + fr(s.grandes || 0) + ' L · ' + fr(s.petites || 0) + ' S'; }
    function nomCopie(nom) { return '<b title="Cliquer pour copier le nom" onclick="edteamRendre.copie(this, ' + E(JSON.stringify(String(nom || ''))).replace(/&quot;/g, '&#34;') + ')">' + E(String(nom || '?').toUpperCase()) + '</b>'; }
    function fiche(s, k, max, tags, extra) {
        const T = th(), c = k === 0 ? T.c : T.c2, type = TYPE[s.type] || String(s.type || 'STATION').toUpperCase();
        const part = max > 0 ? Math.max(1, Math.round(100 * (Number(s.arrivee) || 0) / max)) : 1;
        const autres = (s.services || []).filter(x => !SERV_IGNORES.includes(x) && x !== 'Contacts').map(x => SERV[x] || String(x).toLowerCase());
        return '<div class="rd-col" style="--c:' + c + '"><div class="rd-rang">' + (k + 1) + '</div>'
            + '<div class="rd-nm">' + nomCopie(s.nom) + '<div class="sy">' + E(String(etat.systeme).toUpperCase()) + (s.corps ? ' · ' + E(s.corps) : ' · en orbite') + '</div>'
            + '<div class="tags"><span class="rd-tg">' + E(type) + '</span>' + tags + '</div>' + (autres.length ? '<div class="rd-srv"><u>Autres services :</u> ' + E(autres.join(' · ')) + '</div>' : '') + '</div>'
            + '<div class="rd-dt"><div><small>DISTANCE D\'ARRIVÉE</small><b>' + (s.arrivee != null ? fr(s.arrivee) + ' al' : '?') + '</b></div><div><small>PLATEFORMES</small><b>' + plateformes(s) + '</b></div>'
            + '<div><small>FICHE MISE À JOUR</small><b>' + E(ageTxt(ageH(s.maj))) + '</b></div>' + (extra || '') + '</div>'
            + '<div class="rd-ba"><i style="width:' + part + '%"></i></div></div>';
    }
    const tri2 = liste => liste.slice().sort((a, b) => (tri() === 'loin' ? -1 : 1) * ((Number(a.arrivee) || 0) - (Number(b.arrivee) || 0)));
    function barreTri(n, lib) {
        const seg = (v, l) => '<button type="button" class="' + (tri() === v ? 'on' : '') + '" onclick="edteamRendre.tri(\'' + v + '\')">' + l + '</button>';
        return '<div class="rd-tri"><span>' + n + ' ' + lib + '</span><span class="rd-seg">' + seg('proche', 'PLUS PROCHE D\'ABORD') + seg('loin', 'PLUS ÉLOIGNÉE D\'ABORD') + '</span></div>';
    }
    function liste(cle, stations, nbVisibles, fn) {
        const tous = !!etat.plus[cle], vis = tous ? stations : stations.slice(0, nbVisibles), max = stations.reduce((m, x) => Math.max(m, Number(x.arrivee) || 0), 0);
        let h = vis.map((s, k) => fn(s, k, max)).join('');
        if (stations.length > nbVisibles) {
            const noms = stations.slice(nbVisibles, nbVisibles + 3).map(s => E(s.nom) + ' ' + fr(s.arrivee) + ' al').join(' · ');
            h += '<div class="rd-rep"><span>' + (tous ? 'Toutes les stations sont affichées.' : '… ' + (stations.length - nbVisibles) + ' autre' + (stations.length - nbVisibles > 1 ? 's' : '') + ' plus éloignée' + (stations.length - nbVisibles > 1 ? 's' : '') + ' (' + noms + (stations.length - nbVisibles > 3 ? '…' : '') + ')') + '</span>'
                + '<button type="button" onclick="edteamRendre.plus(\'' + cle + '\')">' + (tous ? 'RÉDUIRE' : 'VOIR TOUT') + '</button></div>';
        }
        return h;
    }

    // ----- exploration -----
    function corpsExplo(d) {
        const st = tri2(d.exploration || []), I = infl(d);
        const tuiles = tuileObjectif('SCIENCE', 'de données d\'exploration vendues, quota quotidien du système', 'données d\'exploration vendues')
            + '<div class="rd-tu" style="--c:' + (st.length ? '#00FF66' : '#FF3333') + '"><div class="t">STATIONS UTILES</div><div class="v">' + st.length + '</div><div class="d">stations de la faction avec le service « cartographie universelle »</div></div>' + tuileConflit(d);
        const vide = '<div class="rd-msg"><b>AUCUNE STATION UTILE</b>Aucune station de ' + E(etat.faction) + ' ne propose la cartographie dans ' + E(etat.systeme) + ' d\'après Spansh : l\'exploration ne pourra pas la soutenir ici. (Spansh ne connaît que les stations relevées par les joueurs.)</div>';
        return blocCible(d) + '<div class="rd-ctx">' + tuiles + '</div>'
            + '<div class="rd-obj"><b>RÈGLE :</b> les données d\'exploration comptent pour la faction qui <b>contrôle la station où tu les vends</b>, dans le système où tu te trouves. Vends-les dans l\'une des stations ci-dessous. <b>Ce que la fenêtre ne dit pas :</b> où explorer.</div>'
            + (st.length ? barreTri(st.length, 'STATION' + (st.length > 1 ? 'S' : '')) + liste('expl', st, 5, (s, k, max) => fiche(s, k, max, '<span class="rd-tg v">CARTOGRAPHIE</span>' + (s.grandes ? '<span class="rd-tg">PLATEFORME L</span>' : s.moyennes ? '<span class="rd-tg">PLATEFORME M</span>' : s.petites ? '<span class="rd-tg">PLATEFORME S</span>' : ''))) : vide);
    }

    // ----- bons de securite -----
    function corpsBons(d) {
        const sec = d.securite || {}, ports = tri2(sec.ports || []), cols = tri2(sec.colonies || []), nbc = Number(sec.nb_colonies) || cols.length;
        const mienne = s => String(s.faction || '').trim().toLowerCase() === nomFaction();
        const tags = s => '<span class="rd-tg v">CONTACTS</span>' + (mienne(s) ? '<span class="rd-tg v">' + E(String(s.faction).toUpperCase()) + '</span>' : (s.faction ? '<span class="rd-tg">' + E(String(s.faction).toUpperCase()) + '</span>' : ''));
        const tuiles = tuileObjectif('SECURITE', 'de bons rendus (primes et bons de combat), quota du système', 'bons rendus')
            + '<div class="rd-tu" style="--c:#00FF66"><div class="t">STATIONS AVEC « CONTACTS »</div><div class="v">' + (ports.length + nbc) + (sec.tronque ? '+' : '') + '</div><div class="d">dont ' + ports.length + ' port' + (ports.length > 1 ? 's' : '') + ' et avant-poste' + (ports.length > 1 ? 's' : '') + ' · ' + nbc + ' colonie' + (nbc > 1 ? 's' : '') + ' au sol (porte-vaisseaux écartés)</div></div>'
            + tuileConflit(d);
        let h = blocCible(d) + '<div class="rd-ctx">' + tuiles + '</div>'
            + '<div class="rd-obj"><b>RÈGLE (celle de SYS.EDTEAM) :</b> un bon compte pour la faction qui l\'a <b>émis</b>, dans le <b>système où tu le rends</b>. Peu importe quelle faction tient la station. Rends donc, dans ' + E(etat.systeme) + ', des bons <b>émis par ' + E(etat.faction) + '</b>. <b>Ce que la fenêtre ne dit pas :</b> où gagner ces bons. Tu les reconnais dans l\'écran des contacts de la station.</div>'
            + barreTri(ports.length + cols.length, 'STATIONS')
            + '<div class="rd-grp"><b>PORTS ET AVANT-POSTES</b><span>' + ports.length + ' · retraits de bons déjà constatés dans ce type de station</span></div>'
            + (ports.length ? liste('ports', ports, 5, (s, k, max) => fiche(s, k, max, tags(s))) : '<div class="rd-rep"><span>Aucun port ni avant-poste avec « contacts » connu dans ce système.</span></div>');
        if (nbc) {
            h += '<div class="rd-grp"><b>COLONIES AU SOL</b><span>' + nbc + ' · avec « contacts », mais aucun retrait de bons constaté dans une colonie au sol : à confirmer sur place</span></div>';
            const tous = !!etat.plus.col;
            if (!tous) h += '<div class="rd-rep"><span>Repliée par défaut (' + cols.length + (nbc > cols.length ? ' sur ' + nbc : '') + ' plus proches au dépliage).</span><button type="button" onclick="edteamRendre.plus(\'col\')">DÉPLIER</button></div>';
            else h += cols.map((s, k) => fiche(s, k, cols.reduce((m, x) => Math.max(m, Number(x.arrivee) || 0), 0), tags(s))).join('') + '<div class="rd-rep"><span>' + cols.length + (nbc > cols.length ? ' sur ' + nbc : '') + ' colonie' + (cols.length > 1 ? 's' : '') + ' affichée' + (cols.length > 1 ? 's' : '') + ', les plus proches d\'abord.</span><button type="button" onclick="edteamRendre.plus(\'col\')">REPLIER</button></div>';
        }
        return h;
    }

    function corps() {
        if (etat.statut === 'ERREUR' && !etat.donnees) return '<div class="rd-msg"><b>RECHERCHE IMPOSSIBLE</b>' + E(etat.message || 'Réessayez dans quelques minutes.') + '</div>';
        if (!etat.donnees) return '<div class="rd-msg"><span class="rd-spin"></span>Lecture des stations chez Spansh… quelques secondes.</div>';
        return (etat.mode === 'explo' ? corpsExplo(etat.donnees) : corpsBons(etat.donnees)) + (etat.message ? '<div class="rd-pied" style="padding-left:0"><b>' + E(etat.message) + '</b></div>' : '');
    }
    function rendre() {
        const o = assurerDom(), T = th(), explo = etat.mode === 'explo';
        o.innerHTML = '<div class="rd-m" style="--th:' + T.c + ';--thb:' + T.b + '"><div class="rd-tete"><div><small>DIRECTIVE #' + E(etat.ordre) + ' · HAUSSE · ' + (explo ? 'SCIENCE' : 'SÉCURITÉ') + '</small>'
            + '<h2>&gt; ' + (explo ? 'OÙ VENDRE L\'EXPLORATION ?' : 'OÙ RENDRE LES BONS ?') + '<span>' + (explo ? 'Stations de ' + E(String(etat.faction).toUpperCase()) + ' avec cartographie, dans ' + E(String(etat.systeme).toUpperCase())
                : 'Stations avec « contacts » dans ' + E(String(etat.systeme).toUpperCase()) + ' · bons émis par ' + E(String(etat.faction).toUpperCase())) + '</span></h2></div>'
            + '<span class="rd-x" onclick="edteamRendre.fermer()">✕</span></div><div class="rd-corps">' + corps() + '</div>'
            + '<div class="rd-pied">ⓘ <b>Source :</b> Spansh (stations, services, plateformes, relevés des joueurs via EDDN)' + (etat.calc_le ? ' · recherche faite ' + E(ageTxt(ageH(etat.calc_le))) : '') + '. Le niveau de menace d\'une installation n\'est pas publié par le jeu. La barre sous chaque fiche montre la distance relative depuis l\'étoile d\'arrivée (la plus longue = pleine).</div></div>';
        o.style.display = 'flex';
    }
    async function charger() {
        const jeton = ++etat.jeton, c = db();
        if (!c) { etat.statut = 'ERREUR'; etat.message = 'Connexion indisponible.'; rendre(); return; }
        let r;
        try { r = await c.rpc('routes_rendre', { p_ordre: Number(etat.ordre) }); } catch (e) { r = { error: { message: 'Connexion impossible.' } }; }
        if (jeton !== etat.jeton || !ouvert()) return;
        if (r.error || !r.data) { etat.statut = 'ERREUR'; etat.message = (r.error && r.error.message) || 'Réponse vide.'; etat.donnees = null; rendre(); return; }
        const j = r.data;
        etat.statut = j.statut; etat.message = j.message || ''; etat.donnees = j.donnees || null; etat.calc_le = j.calcule_le || null;
        rendre();
    }

    const api = {
        ouvrir(mode, ordreId, systeme, faction) {
            if (typeof sonClic === 'function') sonClic();
            Object.assign(etat, { mode: mode === 'bons' ? 'bons' : 'explo', ordre: ordreId, systeme: systeme || '', faction: faction || '', statut: 'EN_COURS', message: '', donnees: null, calc_le: null, plus: {} });
            rendre(); charger();
        },
        fermer() { etat.jeton++; const o = document.getElementById('rd-overlay'); if (o) { o.style.display = 'none'; o.innerHTML = ''; } },
        tri(v) { ecrire('edteam_rendre_tri', v === 'loin' ? 'loin' : 'proche'); rendre(); },
        plus(cle) { etat.plus[cle] = !etat.plus[cle]; rendre(); },
        copie(el, txt) {
            const fait = () => { const old = el.textContent; el.textContent = 'COPIÉ'; setTimeout(() => { el.textContent = old; }, 900); };
            try { navigator.clipboard.writeText(String(txt)).then(fait, () => { }); } catch (e) { /* presse-papiers indisponible */ }
        },
        // bouton de la ligne Science (mode 'explo') ou Securite (mode 'bons') d'une directive de hausse en cours ; vide pour les autres
        bouton(ordre, mode, classe) {
            if (!ordre || String(ordre.type_ordre || '').toUpperCase() !== 'HAUSSE' || String(ordre.statut || 'ACTIF').toUpperCase() !== 'ACTIF' || !ordre.systeme_cible || !ordre.faction_cible) return '';
            const explo = mode !== 'bons', c = explo ? '176,38,255' : '0,240,255', col = explo ? '#B026FF' : '#00F0FF';
            const arg = [explo ? 'explo' : 'bons', ordre.id, ordre.systeme_cible, ordre.faction_cible].map(x => E(JSON.stringify(x)).replace(/&quot;/g, '&#34;')).join(', ');
            const pad = classe === 'compact' ? 'padding: 2px 8px; font-size: 0.85em; letter-spacing: 0;' : 'padding: 7px 14px; font-size: 0.8em; letter-spacing: 2px;';
            return '<button type="button" class="' + (classe || '') + '" onclick="event.stopPropagation(); edteamRendre.ouvrir(' + arg + ')" style="background: rgba(' + c + ',0.1); border: 1px solid ' + col + '; color: ' + col + '; ' + pad + ' font-family: inherit; cursor: pointer; white-space: nowrap; box-shadow: 0 0 10px rgba(' + c + ',0.2);">'
                + (explo ? '🔭 OÙ VENDRE L\'EXPLORATION ?' : '🛡️ OÙ RENDRE LES BONS ?') + '</button>';
        }
    };
    window.edteamRendre = api;
})();
