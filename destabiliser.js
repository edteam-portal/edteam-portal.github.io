// « OU DESTABILISER ? » : fenetre d'une directive de BAISSE (ligne des meurtres) : les installations tenues par la faction ciblee dans le systeme
// + le contexte du systeme. Donnees : routes_destabiliser() (SQL 154 : Spansh, memoire 2 h). Le niveau de menace d'une installation n'est pas publie par le jeu : il n'est pas affiche.
// Ne dit PAS ou apparaissent les vaisseaux de la faction : le bandeau le precise.
(function () {
    'use strict';
    const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const lire = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
    const ecrire = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* stockage indisponible : sans effet */ } };
    const db = () => window.supabaseApp || null;
    const fr = (n, d) => Number(n).toLocaleString('fr-FR', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });

    const TYPE = { 'Settlement': 'COLONIE AU SOL', 'Planetary Outpost': 'AVANT-POSTE PLANÉTAIRE', 'Planetary Port': 'PORT PLANÉTAIRE', 'Outpost': 'AVANT-POSTE ORBITAL', 'Coriolis Starport': 'STATION CORIOLIS',
        'Orbis Starport': 'STATION ORBIS', 'Ocellus Starport': 'STATION OCELLUS', 'Asteroid base': 'BASE ASTÉROÏDE', 'Mega ship': 'MÉGA-VAISSEAU', 'Dockable Planetary Station': 'STATION PLANÉTAIRE' };
    const ECO = { 'Military': 'Militaire', 'Tourism': 'Tourisme', 'Industrial': 'Industrie', 'Agriculture': 'Agriculture', 'Extraction': 'Extraction', 'Refinery': 'Raffinerie', 'High Tech': 'Haute technologie',
        'Terraforming': 'Terraformation', 'Service': 'Services', 'Colony': 'Colonie', 'Rescue': 'Sauvetage', 'Repair': 'Réparation', 'Damaged': 'Endommagé', 'Prison': 'Prison', 'Carrier': 'Porte-vaisseaux' };
    const SERV = { 'Market': 'marché', 'Missions': 'missions', 'Restock': 'réarmement', 'Refuel': 'ravitaillement', 'Repair': 'réparations', 'Workshop': 'atelier', 'Crew Lounge': 'salle d\'attente',
        'Outfitting': 'équipement', 'Shipyard': 'chantier naval', 'Black Market': 'marché noir', 'Universal Cartographics': 'cartographie', 'Interstellar Factors': 'facteurs interstellaires',
        'Material Trader': 'négociant de matériaux', 'Technology Broker': 'courtier technologique', 'Search and Rescue': 'sauvetage', 'Engineer': 'ingénieur', 'Tuning': 'réglages', 'Livery': 'peintures',
        'Vista Genomics': 'génomique', 'Pioneer Supplies': 'vivres de pionnier', 'Apex Interstellar': 'Apex', 'Frontline Solutions': 'Frontline', 'Bartender': 'barman', 'Social Space': 'espace social', 'Shop': 'boutique',
        'Powerplay': 'Powerplay', 'Exploration': 'exploration', 'Commodities': 'marchandises' };
    const SERV_IGNORES = ['Dock', 'Autodock', 'Station Menu', 'Missions Generated', 'Station Operations', 'Flight Controller', 'Contacts', 'Registering Colonisation'];
    const SEC = { 'High': ['HAUTE', '#FFB000', 'Forces de l\'ordre nombreuses.'], 'Medium': ['MOYENNE', '#00F0FF', 'Forces de l\'ordre en nombre modéré.'], 'Low': ['BASSE', '#00FF66', 'Peu de forces de l\'ordre.'],
        'Anarchy': ['ANARCHIE', '#FF3333', 'Pas de forces de l\'ordre.'] };
    const PUIS = { 'Stronghold': 'Forteresse', 'Fortified': 'Fortifié', 'Exploited': 'Exploité', 'Contested': 'Disputé', 'Unoccupied': 'Libre', 'Prepared': 'Préparé', 'Expansion': 'Expansion' };
    const ETAT = { 'None': 'Aucun', 'Boom': 'Boom', 'Bust': 'Récession', 'Famine': 'Famine', 'Outbreak': 'Épidémie', 'Lockdown': 'Confinement', 'Investment': 'Investissement', 'Retreat': 'Retraite',
        'Expansion': 'Expansion', 'Civil Unrest': 'Troubles civils', 'Civil Liberty': 'Libertés civiles', 'Pirate Attack': 'Attaque de pirates', 'Terrorist Attack': 'Attaque terroriste', 'Natural Disaster': 'Catastrophe naturelle',
        'Public Holiday': 'Jour férié', 'Infrastructure Failure': 'Panne d\'infrastructure', 'Drought': 'Sécheresse', 'Blight': 'Fléau', 'Civil War': 'Guerre civile', 'War': 'Guerre', 'Election': 'Élection',
        'Recovery': 'Récupération', 'Historic Event': 'Événement historique' };
    const CONFLIT = ['War', 'Civil War', 'Election'];

    const CSS = `
    #ds-overlay{position:fixed;inset:0;z-index:7000;background:rgba(0,0,0,.86);display:none;align-items:flex-start;justify-content:center;padding:18px;overflow-y:auto;font-family:inherit}
    #ds-overlay *{box-sizing:border-box}
    .ds-m{width:100%;max-width:1100px;border:1px solid #FF3333;background:linear-gradient(180deg,rgba(255,51,51,.07),rgba(8,5,2,.98) 140px);box-shadow:0 0 30px rgba(255,51,51,.16);color:#ccc;margin:auto 0}
    .ds-tete{padding:14px 22px 12px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;border-bottom:1px solid rgba(255,51,51,.35)}
    .ds-tete small{color:#8a8a8a;letter-spacing:3px;font-size:.7em}
    .ds-tete h2{margin:4px 0 0;font-weight:normal;color:#FF3333;letter-spacing:3px;font-size:1.5em;text-shadow:0 0 14px rgba(255,51,51,.4);line-height:1.15}
    .ds-tete h2 span{display:block;color:#fff;font-size:.55em;letter-spacing:2px;margin-top:4px;text-shadow:none}
    .ds-x{color:#FF3333;font-weight:bold;cursor:pointer;font-size:1.3em;padding:2px 6px}
    .ds-corps{padding:16px 22px 8px}
    .ds-s{color:#888;letter-spacing:3px;font-size:.7em;margin:0 0 8px}.ds-s b{color:#FF3333;font-weight:normal}
    .ds-cible{display:flex;align-items:center;gap:16px;border:1px solid rgba(255,51,51,.45);border-left:4px solid #FF3333;background:rgba(255,51,51,.06);padding:10px 16px;margin-bottom:14px;flex-wrap:wrap}
    .ds-cible .lib{color:#FF3333;font-size:.64em;letter-spacing:3px;margin-bottom:2px}.ds-cible .nom{color:#fff;font-size:1.2em;letter-spacing:2px}.ds-cible .sous{color:#8fb7bf;font-size:.76em;margin-top:3px}
    .ds-inf{margin-left:auto;min-width:230px;text-align:right}.ds-inf .t{font-size:.66em;letter-spacing:2px;color:#888}.ds-inf .b{height:7px;margin:5px 0 4px;background:#222;position:relative}.ds-inf .b i{position:absolute;left:0;top:0;bottom:0;background:#FF3333}.ds-inf .v{font-size:.78em}
    .ds-ctx{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}
    .ds-tu{border:1px solid #2c2c2c;border-top:2px solid var(--c,#00F0FF);background:rgba(0,0,0,.45);padding:9px 12px;min-width:0}
    .ds-tu .t{font-size:.64em;letter-spacing:3px;color:#888}.ds-tu .v{color:#fff;font-size:1.25em;margin:3px 0 2px;letter-spacing:1px}.ds-tu .d{font-size:.72em;color:#8a9;line-height:1.45}
    .ds-obj{border:1px dashed #FF3333;background:rgba(255,51,51,.05);padding:8px 14px;font-size:.78em;line-height:1.7;margin-bottom:16px;color:#cba}.ds-obj b{color:#fff;font-weight:normal}
    .ds-pill{display:inline-block;border:1px solid;border-radius:3px;padding:2px 9px;font-size:.68em;letter-spacing:2px;white-space:nowrap}
    .ds-ok{color:#00FF66;border-color:#00FF66;background:rgba(0,255,102,.08)}.ds-vx{color:#e8a35a;border-color:#e8a35a;background:rgba(232,163,90,.08)}
    .ds-tri{display:flex;align-items:center;gap:10px;font-size:.74em;color:#999;letter-spacing:1px;margin-bottom:10px;flex-wrap:wrap}
    .ds-seg{display:inline-flex;border:1px solid #444;border-radius:3px;overflow:hidden}.ds-seg button{background:transparent;border:0;border-right:1px solid #333;color:#999;font-family:inherit;font-size:1em;padding:3px 10px;cursor:pointer}.ds-seg button:last-child{border:0}.ds-seg button.on{background:rgba(0,240,255,.15);color:#00F0FF}
    .ds-col{border:1px solid #2c2c2c;border-left:4px solid var(--c);background:rgba(0,0,0,.5);padding:12px 16px;margin-bottom:12px;display:grid;grid-template-columns:44px minmax(0,1.3fr) minmax(0,1fr);gap:6px 18px}
    .ds-rang{width:36px;height:36px;border-radius:50%;border:1px solid var(--c);color:var(--c);display:grid;place-items:center;font-size:1.05em}
    .ds-nm b{color:#fff;font-weight:normal;font-size:1.15em;letter-spacing:2px;cursor:copy;border-bottom:1px dotted #666}.ds-nm .sy{color:#00F0FF;font-size:.8em;margin:3px 0 7px;overflow-wrap:anywhere}.ds-nm .tags{display:flex;gap:6px;flex-wrap:wrap}
    .ds-tg{border:1px solid #3a4650;color:#9ab;padding:1px 8px;font-size:.68em;letter-spacing:1px}
    .ds-srv{margin-top:8px;color:#778;font-size:.72em;line-height:1.7}.ds-srv u{text-decoration:none;color:#9ab}
    .ds-dt{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;font-size:.78em;align-content:start}
    .ds-dt div small{display:block;color:#777;letter-spacing:2px;font-size:.78em}.ds-dt div b{color:#fff;font-weight:normal}
    .ds-ba{grid-column:2/4;height:5px;background:#1c1c1c;margin-top:4px}.ds-ba i{display:block;height:100%;background:var(--c);box-shadow:0 0 6px var(--c)}
    .ds-msg{padding:34px 18px;text-align:center;color:#aaa;line-height:1.7}.ds-msg b{color:#FF3333;letter-spacing:2px;font-weight:normal;display:block;margin-bottom:6px}
    .ds-spin{display:inline-block;width:14px;height:14px;border:2px solid #FF3333;border-top-color:transparent;border-radius:50%;animation:dsTourne .9s linear infinite;vertical-align:-2px;margin-right:8px}
    @keyframes dsTourne{to{transform:rotate(360deg)}}
    .ds-pied{padding:6px 22px 16px;color:#777;font-size:.72em;line-height:1.7}.ds-pied b{color:#bbb;font-weight:normal}
    @media (prefers-reduced-motion:reduce){.ds-spin{animation:none}}
    @media (max-width:760px){#ds-overlay{padding:8px}.ds-corps{padding:12px 12px 6px}.ds-tete,.ds-pied{padding-left:12px;padding-right:12px}.ds-ctx{grid-template-columns:1fr 1fr}.ds-col{grid-template-columns:1fr}.ds-ba{grid-column:1}.ds-inf{margin-left:0;text-align:left;min-width:0;width:100%}.ds-tete h2{font-size:1.2em}}`;

    const etat = { ordre: null, systeme: '', faction: '', statut: 'EN_COURS', message: '', donnees: null, calc_le: null, jeton: 0 };
    const tri = () => (lire('edteam_destab_tri') === 'loin' ? 'loin' : 'proche');

    function ageH(maj) { const t = Date.parse(maj || ''); return isNaN(t) ? null : Math.max(0, (Date.now() - t) / 3600000); }
    function ageTxt(h) {
        if (h === null) return 'date inconnue';
        if (h < 1) return 'il y a moins d\'1 h';
        if (h < 24) return 'il y a ' + Math.round(h) + ' h';
        const j = Math.floor(h / 24);
        return j === 1 ? 'hier' : j < 60 ? 'il y a ' + j + ' j' : 'il y a ' + Math.round(j / 30) + ' mois';
    }
    const ouvert = () => { const o = document.getElementById('ds-overlay'); return !!o && o.style.display !== 'none'; };
    function assurerDom() {
        if (!document.getElementById('ds-style')) { const s = document.createElement('style'); s.id = 'ds-style'; s.textContent = CSS; document.head.appendChild(s); }
        let o = document.getElementById('ds-overlay');
        if (!o) {
            o = document.createElement('div'); o.id = 'ds-overlay';
            o.addEventListener('click', ev => { if (ev.target === o) api.fermer(); });
            document.body.appendChild(o);
            document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && ouvert()) api.fermer(); });
        }
        return o;
    }

    // ----- morceaux de la fenetre -----
    function blocCible(d) {
        const res = ((window.cacheResultatsBgs || {}).dir || {})[etat.ordre] || null, s = d ? d.systeme : null;
        const fn = String(etat.faction).trim().toLowerCase();
        const pres = s ? (s.factions || []).find(f => String(f.nom || '').trim().toLowerCase() === fn) : null;
        const inf = res && res.influence != null ? Number(res.influence) : (pres && pres.influence != null ? Number(pres.influence) : null);
        const gouv = s ? [s.allegeance, s.gouvernement].filter(Boolean).join(' · ') : '';
        let sousInf = inf !== null ? '<b style="color:#fff">' + fr(inf * 100, 1) + ' %</b>' : '';
        if (res && res.variation != null && Math.abs(res.variation) >= 0.05) { const v = Number(res.variation); sousInf += ' · ' + (v < 0 ? '<span style="color:#2fe07a">▼ −' : '<span style="color:#ff8a8a">▲ +') + fr(Math.abs(v), 1) + '</span> pts depuis l\'émission de la directive'; }
        return '<div class="ds-cible"><div><div class="lib">FACTION VISÉE</div><div class="nom">' + E(String(etat.faction).toUpperCase()) + '</div><div class="sous">' + E(String(etat.systeme).toUpperCase()) + (gouv ? ' · ' + E(gouv) : '')
            + (s && s.population != null ? ' · ' + E(fr(s.population)) + ' habitants' : '') + '</div></div>'
            + (inf !== null ? '<div class="ds-inf"><div class="t">INFLUENCE DANS LE SYSTÈME</div><div class="b"><i style="width:' + Math.min(100, inf * 100).toFixed(1) + '%"></i></div><div class="v">' + sousInf + '</div></div>' : '') + '</div>';
    }
    function tuiles(d) {
        const s = d.systeme || {}, fn = String(etat.faction).trim().toLowerCase(), fs = s.factions || [];
        const ma = fs.find(f => String(f.nom || '').trim().toLowerCase() === fn), rang = ma ? fs.indexOf(ma) + 1 : null;
        const etatTxt = ma ? (ETAT[ma.etat] || ma.etat || 'Aucun') : '—';
        const enConf = fs.filter(f => CONFLIT.includes(f.etat));
        let confV = 'Aucun', confD = 'Ni guerre ni élection relevée dans le système.', confC = '#00F0FF';
        if (enConf.length) {
            const types = [...new Set(enConf.map(f => ETAT[f.etat] || f.etat))];
            confV = types.join(' · '); confC = '#FFB000';
            confD = enConf.map(f => E(f.nom)).join(' · ') + (ma && CONFLIT.includes(ma.etat) ? ' · <b style="color:#fff;font-weight:normal">la faction visée y participe</b>' : ' · la faction visée n\'y participe pas');
        }
        const sec = SEC[s.securite] || [s.securite ? String(s.securite).toUpperCase() : '—', '#888', 'Niveau de sécurité du système (pas des installations).'];
        const pw = s.puissance ? (PUIS[s.etat_puissance] || s.etat_puissance || '—') : 'Aucune';
        const pwD = s.puissance ? 'Contrôlé par ' + E(s.puissance) : 'Système sans Puissance';
        const tu = (c, t, v, dd) => '<div class="ds-tu" style="--c:' + c + '"><div class="t">' + t + '</div><div class="v">' + E(v) + '</div><div class="d">' + dd + '</div></div>';
        return '<div class="ds-ctx">'
            + tu(ma && ma.etat && ma.etat !== 'None' ? '#FFB000' : '#FF3333', 'ÉTATS DE LA FACTION', etatTxt, 'Rang ' + (rang || '?') + ' sur ' + fs.length + ' faction' + (fs.length > 1 ? 's' : '') + ' dans le système')
            + tu(confC, 'CONFLIT DANS LE SYSTÈME', confV, confD)
            + tu(sec[1], 'SÉCURITÉ DU SYSTÈME', sec[0], E(sec[2]) + ' Niveau du système, pas des installations.')
            + tu('#B026FF', 'POWERPLAY', pw, pwD) + '</div>';
    }
    function objectif() {
        const QJ = window.EdteamQuotas, Qd = (window.cacheQuotasBgs || {})[etat.ordre];
        const l = QJ && Qd ? (QJ.lignes('BAISSE', Qd) || []).find(x => x.ty === 'MEURTRES') : null;
        return '<div class="ds-obj"><b>TON OBJECTIF DU TICK :</b> ' + (l && l.q ? fr(l.s) + ' / ' + fr(l.q) + ' meurtres' + (l.reduit ? ' · <b style="color:#2fe07a">✓ plein effet atteint</b>' : '') : 'meurtres de la faction ciblée')
            + '. <b>Ce que la fenêtre ne dit pas :</b> où apparaissent les vaisseaux de la faction. Les installations ci-dessous servent à se repérer dans le système ; le niveau de menace de chaque installation s\'affiche en jeu, dans le panneau de la station.</div>';
    }
    function fiche(i, k, max) {
        const type = TYPE[i.type] || String(i.type || 'INSTALLATION').toUpperCase();
        const eco = i.economie && i.economie !== 'None' ? (ECO[i.economie] || i.economie) : null;
        const plat = (i.grandes ? 'L' : i.moyennes ? 'M' : i.petites ? 'S' : null);
        const services = (i.services || []).filter(x => !SERV_IGNORES.includes(x)).map(x => SERV[x] || String(x).toLowerCase());
        const c = k === 0 ? '#FF3333' : '#FFB000';
        const part = max > 0 ? Math.max(4, Math.round(100 * (Number(i.arrivee) || 0) / max)) : 4;
        const mh = ageH(i.marche_maj), fh = ageH(i.maj);
        const eco2 = (i.economies || []).filter(x => x && x.name && x.name !== 'None').map(x => (ECO[x.name] || x.name) + (Number(x.share) < 100 ? ' ' + fr(x.share) + ' %' : '')).join(' · ');
        return '<div class="ds-col" style="--c:' + c + '"><div class="ds-rang">' + (k + 1) + '</div>'
            + '<div class="ds-nm"><b title="Cliquer pour copier le nom" onclick="edteamDestab.copie(this, ' + E(JSON.stringify(String(i.nom || ''))).replace(/&quot;/g, '&#34;') + ')">' + E(String(i.nom || '?').toUpperCase()) + '</b>'
            + '<div class="sy">' + E(String(etat.systeme).toUpperCase()) + (i.corps ? ' · ' + E(i.corps) : '') + (i.corps_type ? ' · ' + E(i.corps_type) : '') + '</div>'
            + '<div class="tags"><span class="ds-tg">' + E(type) + '</span>' + (eco ? '<span class="ds-tg">ÉCONOMIE ' + E(String(eco).toUpperCase()) + '</span>' : '') + (plat ? '<span class="ds-tg">PLATEFORME ' + plat + '</span>' : '') + '</div>'
            + (services.length ? '<div class="ds-srv"><u>Services :</u> ' + E(services.join(' · ')) + '</div>' : '') + '</div>'
            + '<div class="ds-dt">'
            + '<div><small>DISTANCE D\'ARRIVÉE</small><b>' + (i.arrivee != null ? fr(i.arrivee) + ' al' : '?') + '</b></div>'
            + '<div><small>PLATEFORMES</small><b>' + fr(i.moyennes || 0) + ' M · ' + fr(i.grandes || 0) + ' L · ' + fr(i.petites || 0) + ' S</b></div>'
            + '<div><small>GOUVERNEMENT</small><b>' + E(i.gouvernement || '—') + '</b></div><div><small>ALLÉGEANCE</small><b>' + E(i.allegeance || '—') + '</b></div>'
            + (eco2 ? '<div style="grid-column:1/3"><small>ÉCONOMIES</small><b>' + E(eco2) + '</b></div>' : '')
            + '<div><small>MARCHÉ RELEVÉ</small><b>' + E(ageTxt(mh)) + '</b></div><div><small>FICHE MISE À JOUR</small><b>' + E(ageTxt(fh)) + '</b></div></div>'
            + '<div class="ds-ba"><i style="width:' + part + '%"></i></div></div>';
    }
    function corps() {
        if (etat.statut === 'ERREUR' && !etat.donnees) return '<div class="ds-msg"><b>RECHERCHE IMPOSSIBLE</b>' + E(etat.message || 'Réessayez dans quelques minutes.') + '</div>';
        if (!etat.donnees) return '<div class="ds-msg"><span class="ds-spin"></span>Lecture des installations chez Spansh… quelques secondes.</div>';
        const d = etat.donnees, inst = (d.installations || []).slice().sort((a, b) => (tri() === 'loin' ? -1 : 1) * ((Number(a.arrivee) || 0) - (Number(b.arrivee) || 0)));
        const max = inst.reduce((m, x) => Math.max(m, Number(x.arrivee) || 0), 0);
        const frais = inst.map(x => ageH(x.maj)).filter(h => h !== null).sort((a, b) => a - b)[0];
        const seg = (v, lib) => '<button type="button" class="' + (tri() === v ? 'on' : '') + '" onclick="edteamDestab.tri(\'' + v + '\')">' + lib + '</button>';
        return blocCible(d) + '<div class="ds-s"><b>CONTEXTE</b> DU SYSTÈME</div>' + tuiles(d) + objectif()
            + '<div class="ds-tri"><span>' + inst.length + ' INSTALLATION' + (inst.length > 1 ? 'S' : '') + ' TENUE' + (inst.length > 1 ? 'S' : '') + ' PAR LA FACTION</span><span class="ds-seg">' + seg('proche', 'PLUS PROCHE D\'ABORD') + seg('loin', 'PLUS ÉLOIGNÉE D\'ABORD') + '</span>'
            + (frais != null ? '<span style="margin-left:auto" class="ds-pill ' + (frais <= 48 ? 'ds-ok' : 'ds-vx') + '">FICHE MISE À JOUR ' + E(ageTxt(frais).toUpperCase()) + '</span>' : '') + '</div>'
            + (inst.length ? inst.map((x, k) => fiche(x, k, max)).join('') : '<div class="ds-msg"><b>AUCUNE INSTALLATION CONNUE</b>Spansh ne connaît aucune installation de ' + E(etat.faction) + ' dans ' + E(etat.systeme) + ' : la faction peut n\'avoir qu\'une influence sans station, ou ses installations n\'ont pas encore été relevées par les joueurs.</div>')
            + (etat.message ? '<div class="ds-pied" style="padding-left:0"><b>' + E(etat.message) + '</b></div>' : '');
    }
    function rendre() {
        const o = assurerDom();
        o.innerHTML = '<div class="ds-m"><div class="ds-tete"><div><small>DIRECTIVE #' + E(etat.ordre) + ' · BAISSE · MEURTRES</small><h2>&gt; OÙ DÉSTABILISER ?<span>Installations de ' + E(String(etat.faction).toUpperCase()) + ' dans ' + E(String(etat.systeme).toUpperCase()) + '</span></h2></div>'
            + '<span class="ds-x" onclick="edteamDestab.fermer()">✕</span></div><div class="ds-corps">' + corps() + '</div>'
            + '<div class="ds-pied">ⓘ <b>Source :</b> Spansh (installations, services, plateformes, relevés des joueurs via EDDN) et fiche du système' + (etat.calc_le ? ' · recherche faite ' + E(ageTxt(ageH(etat.calc_le))) : '') + '. Le niveau de menace n\'est pas publié par le jeu. La barre sous chaque fiche montre la distance relative depuis l\'étoile d\'arrivée (la plus longue = pleine).</div></div>';
        o.style.display = 'flex';
    }
    async function charger() {
        const jeton = ++etat.jeton, c = db();
        if (!c) { etat.statut = 'ERREUR'; etat.message = 'Connexion indisponible.'; rendre(); return; }
        let r;
        try { r = await c.rpc('routes_destabiliser', { p_ordre: Number(etat.ordre) }); } catch (e) { r = { error: { message: 'Connexion impossible.' } }; }
        if (jeton !== etat.jeton || !ouvert()) return;
        if (r.error || !r.data) { etat.statut = 'ERREUR'; etat.message = (r.error && r.error.message) || 'Réponse vide.'; etat.donnees = null; rendre(); return; }
        const j = r.data;
        etat.statut = j.statut; etat.message = j.message || ''; etat.donnees = j.donnees || null; etat.calc_le = j.calcule_le || null;
        rendre();
    }

    const api = {
        ouvrir(ordreId, systeme, faction) {
            if (typeof sonClic === 'function') sonClic();
            Object.assign(etat, { ordre: ordreId, systeme: systeme || '', faction: faction || '', statut: 'EN_COURS', message: '', donnees: null, calc_le: null });
            rendre(); charger();
        },
        fermer() { etat.jeton++; const o = document.getElementById('ds-overlay'); if (o) { o.style.display = 'none'; o.innerHTML = ''; } },
        tri(v) { ecrire('edteam_destab_tri', v === 'loin' ? 'loin' : 'proche'); rendre(); },
        copie(el, txt) {
            const fait = () => { const old = el.textContent; el.textContent = 'COPIÉ'; setTimeout(() => { el.textContent = old; }, 900); };
            try { navigator.clipboard.writeText(String(txt)).then(fait, () => { }); } catch (e) { /* presse-papiers indisponible */ }
        },
        // bouton « Où déstabiliser ? » de la ligne des meurtres d'une directive de baisse en cours ; vide pour les autres
        bouton(ordre, classe) {
            if (!ordre || String(ordre.type_ordre || '').toUpperCase() !== 'BAISSE' || String(ordre.statut || 'ACTIF').toUpperCase() !== 'ACTIF' || !ordre.systeme_cible || !ordre.faction_cible) return '';
            const arg = [ordre.id, ordre.systeme_cible, ordre.faction_cible].map(x => E(JSON.stringify(x)).replace(/&quot;/g, '&#34;')).join(', ');
            const pad = classe === 'compact' ? 'padding: 2px 8px; font-size: 0.85em; letter-spacing: 0;' : 'padding: 7px 14px; font-size: 0.8em; letter-spacing: 2px;';
            return '<button type="button" class="' + (classe || '') + '" onclick="event.stopPropagation(); edteamDestab.ouvrir(' + arg + ')" style="background: rgba(255,51,51,0.1); border: 1px solid #FF3333; color: #FF3333; ' + pad + ' font-family: inherit; cursor: pointer; white-space: nowrap; box-shadow: 0 0 10px rgba(255,51,51,0.2);">🎯 OÙ DÉSTABILISER ?</button>';
        }
    };
    window.edteamDestab = api;
})();
