// ROUTES COMMERCIALES D'UNE DIRECTIVE DE HAUSSE (« Où vendre ? ») ET ROUTES DE CONTREBANDE D'UNE DIRECTIVE DE BAISSE : fenêtre commune au PC (bgs.html) et au mobile (mobile.html).
// Baisse : rpc routes_contrebande (script SQL 73) = stations de la faction avec marché noir + où acheter de la marchandise généralement illégale ; aucun bénéfice calculé (prix du marché noir inconnus).
// Données : rpc routes_commerce(ordre, rayon) (script SQL 72) = marchandises que les stations de la faction achètent dans le système cible + stations proches où les acheter,
//   tirées de Spansh, gardées 2 h côté serveur pour tout l'escadron. Si rien n'est en mémoire, la base lance la recherche en tâche de fond (EN_COURS) : on relit toutes les 4 s.
// Le calcul des routes (bénéfice par tonne, total pour la soute) et les réglages (soute, grande piste, relevés récents) se font ICI, dans le navigateur : aucun appel de plus.
(function () {
    'use strict';
    const db = () => window.supabaseApp || (typeof supabaseApp !== 'undefined' ? supabaseApp : null);
    const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const fmt = n => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const mil = n => n >= 1e6 ? (n / 1e6).toFixed(2).replace('.', ',') + ' M' : fmt(n);
    const lire = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
    const ecrire = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sans stockage : réglages par défaut à chaque ouverture */ } };

    // noms français des marchandises courantes (le reste reste en anglais, comme dans le jeu en anglais)
    const FR = { 'Slaves': 'Esclaves', 'Imperial Slaves': 'Esclaves impériaux', 'Narcotics': 'Narcotiques', 'Nerve Agents': 'Agents neurotoxiques', 'Gold': 'Or', 'Silver': 'Argent', 'Platinum': 'Platine', 'Palladium': 'Palladium', 'Copper': 'Cuivre', 'Aluminium': 'Aluminium', 'Titanium': 'Titane', 'Steel': 'Acier',
        'Gallium': 'Gallium', 'Indium': 'Indium', 'Lithium': 'Lithium', 'Beryllium': 'Béryllium', 'Cobalt': 'Cobalt', 'Tantalum': 'Tantale', 'Uranium': 'Uranium', 'Bauxite': 'Bauxite',
        'Water': 'Eau', 'Liquid oxygen': 'Oxygène liquide', 'Hydrogen Fuel': 'Carburant hydrogène', 'Polymers': 'Polymères', 'Semiconductors': 'Semi-conducteurs', 'Superconductors': 'Supraconducteurs',
        'Computer Components': 'Composants d\'ordinateur', 'Consumer Technology': 'Technologie grand public', 'Power Generators': 'Générateurs', 'Coffee': 'Café', 'Tea': 'Thé', 'Wine': 'Vin',
        'Beer': 'Bière', 'Liquor': 'Spiritueux', 'Tobacco': 'Tabac', 'Fish': 'Poisson', 'Grain': 'Céréales', 'Fruit and Vegetables': 'Fruits et légumes', 'Animal Meat': 'Viande',
        'Domestic Appliances': 'Appareils ménagers', 'Clothing': 'Vêtements', 'Robotics': 'Robots', 'Biowaste': 'Biodéchets', 'Meta-Alloys': 'Méta-alliages', 'Mineral Oil': 'Huile minérale',
        'Ceramic Composites': 'Composés en céramique', 'CMM Composite': 'Composite MMC', 'Insulating Membrane': 'Membrane isolante', 'Auto-Fabricators': 'Dispositifs d\'autofabrication',
        'Building Fabricators': 'Auto-bâtisseurs', 'Crop Harvesters': 'Moissonneuses', 'Food Cartridges': 'Cartouches alimentaires', 'Basic Medicines': 'Médicaments simples',
        'Agri-Medicines': 'Agri-médicaments', 'Performance Enhancers': 'Stimulants de performance', 'Progenitor Cells': 'Cellules progénitrices', 'Non-Lethal Weapons': 'Armes incapacitantes',
        'Personal Weapons': 'Armes personnelles', 'Battle Weapons': 'Armes militaires', 'Reactive Armour': 'Protection réactive', 'Evacuation Shelter': 'Abri d\'urgence', 'Survival Equipment': 'Équipement de survie' };
    const nomFr = n => FR[n] || n;
    const initiales = n => String(nomFr(n)).replace(/[^A-Za-zÀ-ÿ ]/g, '').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

    const CSS = `
    #ec-overlay{position:fixed;inset:0;z-index:7000;background:rgba(0,0,0,.86);display:none;align-items:flex-start;justify-content:center;padding:18px;overflow-y:auto;font-family:inherit}
    #ec-overlay *{box-sizing:border-box}
    .ec-m{width:100%;max-width:1100px;border:1px solid #FFD700;background:linear-gradient(180deg,rgba(255,215,0,.05),rgba(8,5,2,.98) 140px);box-shadow:0 0 30px rgba(255,215,0,.15);color:#ccc;margin:auto 0}
    .ec-tete{padding:14px 22px 12px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;border-bottom:1px solid rgba(255,215,0,.3)}
    .ec-tete small{color:#8a8a8a;letter-spacing:3px;font-size:.7em}
    .ec-tete h2{margin:4px 0 0;font-weight:normal;color:#FFD700;letter-spacing:3px;font-size:1.5em;text-shadow:0 0 14px rgba(255,215,0,.35);line-height:1.15}
    .ec-tete h2 > span{display:block;color:#00FF66;font-size:.55em;letter-spacing:2px;margin-top:4px;text-shadow:none}
    .ec-x{color:#FFD700;font-weight:bold;cursor:pointer;font-size:1.3em;padding:2px 6px}
    .ec-pas{display:flex;gap:6px;align-items:center;color:#777;font-size:.72em;letter-spacing:2px;margin-top:10px;flex-wrap:wrap}
    .ec-pas b{display:inline-grid;place-items:center;width:19px;height:19px;border:1px solid #FFD700;color:#FFD700;border-radius:50%;font-size:.9em;margin-right:5px}
    .ec-pas i{font-style:normal;color:#444;margin:0 6px}
    .ec-regl{display:flex;gap:14px 24px;align-items:center;padding:10px 22px;background:rgba(0,0,0,.35);border-bottom:1px dashed #2a2a2a;font-size:.76em;color:#8a9;letter-spacing:1px;flex-wrap:wrap}
    .ec-seg{display:inline-flex;border:1px solid #444;border-radius:3px;overflow:hidden;margin-left:8px;vertical-align:middle}
    .ec-seg button{background:transparent;border:0;border-right:1px solid #333;color:#999;font-family:inherit;font-size:1em;padding:3px 10px;cursor:pointer}
    .ec-seg button:last-child{border:0}.ec-seg button.on{background:rgba(0,240,255,.15);color:#00F0FF;box-shadow:inset 0 0 8px rgba(0,240,255,.25)}
    .ec-soute{width:58px;background:#000;border:1px solid #444;color:#00F0FF;font-family:inherit;text-align:center;padding:2px;font-size:1em}
    .ec-tg{display:inline-flex;align-items:center;gap:7px;cursor:pointer;background:none;border:0;color:#999;font-family:inherit;font-size:1em;letter-spacing:1px;padding:0}
    .ec-tg i{width:26px;height:14px;border-radius:8px;background:#333;position:relative;display:inline-block}
    .ec-tg i:after{content:"";position:absolute;top:2px;left:2px;width:10px;height:10px;border-radius:50%;background:#888;transition:.15s}
    .ec-tg.on{color:#00FF66}.ec-tg.on i{background:rgba(0,255,102,.35)}.ec-tg.on i:after{left:14px;background:#00FF66}
    .ec-corps{padding:16px 22px 8px}
    .ec-s{color:#888;letter-spacing:3px;font-size:.7em;margin:0 0 8px}.ec-s b{color:#FFD700;font-weight:normal}
    .ec-dest{display:flex;align-items:center;gap:16px;border:1px solid rgba(0,255,102,.4);border-left:4px solid #00FF66;background:rgba(0,255,102,.05);padding:10px 16px;margin-bottom:18px;flex-wrap:wrap}
    .ec-dest .lib{color:#00FF66;font-size:.64em;letter-spacing:3px;margin-bottom:2px}.ec-dest .nom{color:#fff;font-size:1.2em;letter-spacing:2px}
    .ec-dest .sous{color:#8fb7bf;font-size:.76em;margin-top:3px;letter-spacing:1px}
    .ec-fr{margin-left:auto;text-align:right;min-width:230px}.ec-fr .t{font-size:.66em;letter-spacing:2px;color:#888}
    .ec-fr .b{height:7px;margin:5px 0 4px;background:#222;position:relative}.ec-fr .b i{position:absolute;left:0;top:0;bottom:0}
    .ec-fr .v{font-size:.78em}
    .ec-vd{position:relative;border:1px solid #FFD700;background:linear-gradient(135deg,rgba(255,215,0,.09),rgba(8,5,2,.9) 60%);padding:16px 20px 14px;margin-bottom:20px;box-shadow:0 0 22px rgba(255,215,0,.12)}
    .ec-vd:before{content:"MEILLEURE ROUTE";position:absolute;top:0;left:0;background:#FFD700;color:#000;font-size:.62em;letter-spacing:3px;padding:2px 12px;font-weight:bold}
    .ec-vh{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:10px 0 12px;flex-wrap:wrap}
    .ec-vh .m{display:flex;align-items:center;gap:12px}
    .ec-gl{width:48px;height:54px;display:grid;place-items:center;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);background:linear-gradient(160deg,#c9ccd1,#7d838c);color:#111;font-weight:bold;font-size:.85em;flex:none}
    .ec-vh b{color:#fff;font-size:1.7em;font-weight:normal;letter-spacing:3px;display:block;line-height:1.05}.ec-vh .m span{color:#6f9aa3;font-size:.75em;letter-spacing:2px}
    .ec-pill{display:inline-block;border:1px solid;border-radius:3px;padding:2px 9px;font-size:.68em;letter-spacing:2px;white-space:nowrap}
    .ec-ok{color:#00FF66;border-color:#00FF66;background:rgba(0,255,102,.08)}.ec-vx{color:#e8a35a;border-color:#e8a35a;background:rgba(232,163,90,.08)}
    .ec-route{display:grid;grid-template-columns:1fr 210px 1fr;align-items:center}
    .ec-n{border:1px solid #333;background:rgba(0,0,0,.5);padding:11px 14px;min-height:122px;min-width:0}
    .ec-n .e{font-size:.64em;letter-spacing:3px;margin-bottom:5px}.ec-n .st{color:#fff;font-size:1.05em;line-height:1.25;overflow-wrap:anywhere}
    .ec-n .sy{color:#00F0FF;font-size:.88em;margin:2px 0 7px;letter-spacing:1px;overflow-wrap:anywhere}
    .ec-n .px{color:#FFD700;font-size:1.4em}.ec-n .px small{color:#888;font-size:.5em;letter-spacing:1px;margin-left:4px}
    .ec-n .de{color:#8a9;font-size:.72em;margin-top:5px;line-height:1.5}
    .ec-ach{border-left:4px solid #00F0FF}.ec-ach .e{color:#00F0FF}.ec-ven{border-right:4px solid #00FF66}.ec-ven .e{color:#00FF66}
    .ec-lien{text-align:center}.ec-lien svg{display:block;width:100%;height:40px}
    .ec-gain{color:#00FF66;font-size:1.9em;text-shadow:0 0 14px rgba(0,255,102,.5);line-height:1}.ec-gain small{font-size:.36em;color:#8a9;letter-spacing:2px;display:block;margin-top:3px}
    .ec-bas{display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:11px;border-top:1px dashed rgba(255,215,0,.25);gap:10px;flex-wrap:wrap}
    .ec-tot{color:#aaa;font-size:.8em}.ec-tot b{color:#FFD700;font-size:1.6em;font-weight:normal;margin:0 6px;text-shadow:0 0 12px rgba(255,215,0,.4)}
    .ec-bt{border:1px solid #00F0FF;color:#00F0FF;padding:5px 12px;font-size:.7em;letter-spacing:2px;background:rgba(0,240,255,.07);cursor:pointer;font-family:inherit}
    .ec-bt:hover{background:rgba(0,240,255,.2)}
    .ec-gr{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:12px}
    .ec-rc{border:1px solid #2c2c2c;border-left:3px solid var(--c,#888);background:rgba(0,0,0,.45);padding:10px 14px;min-width:0}
    .ec-rc .l1{display:flex;justify-content:space-between;align-items:baseline;gap:8px}.ec-rc .l1 b{color:#fff;font-size:1.05em;font-weight:normal;letter-spacing:2px}.ec-rc .l1 span{color:#00FF66;font-size:1.05em;white-space:nowrap}
    .ec-rc .tr{display:flex;align-items:center;gap:8px;margin:7px 0 6px;font-size:.78em;color:#aaa;flex-wrap:wrap}
    .ec-rc .tr em{font-style:normal;color:#00F0FF}.ec-rc .tr u{text-decoration:none;color:#00FF66}.ec-rc .tr .f{color:#555}
    .ec-rc .l3{display:flex;justify-content:space-between;align-items:center;font-size:.72em;color:#8a9;gap:8px;flex-wrap:wrap}.ec-rc .l3 .tt{color:#FFD700;white-space:nowrap}
    .ec-rc .ba{height:5px;background:#1c1c1c;margin-top:8px}.ec-rc .ba i{display:block;height:100%;background:var(--c);box-shadow:0 0 6px var(--c)}
    .ec-cp{cursor:copy;border-bottom:1px dotted currentColor;transition:.12s}.ec-cp:hover{filter:brightness(1.35);text-shadow:0 0 8px currentColor}
    .ec-rouge{border-color:#FF3333;box-shadow:0 0 30px rgba(255,51,51,.16);background:linear-gradient(180deg,rgba(255,51,51,.07),rgba(8,5,2,.98) 140px)}
    .ec-rouge .ec-tete{border-bottom-color:rgba(255,51,51,.35)}.ec-rouge .ec-tete h2{color:#FF3333;text-shadow:0 0 14px rgba(255,51,51,.4)}.ec-rouge .ec-tete h2 > span{color:#fff}
    .ec-rouge .ec-x{color:#FF3333}.ec-rouge .ec-pas b{border-color:#FF3333;color:#FF3333}.ec-rouge .ec-s b{color:#FF3333}
    .ec-rouge .ec-vd{border-color:#FF3333;background:linear-gradient(135deg,rgba(255,51,51,.1),rgba(8,5,2,.9) 60%);box-shadow:0 0 22px rgba(255,51,51,.14)}
    .ec-rouge .ec-vd:before{background:#FF3333;content:"ROUTE LA PLUS PROCHE"}
    .ec-rouge .ec-dest{border-color:rgba(255,51,51,.45);border-left-color:#FF3333;background:rgba(255,51,51,.06)}.ec-rouge .ec-dest .lib{color:#FF3333}
    .ec-rouge .ec-ven{border-right-color:#FF3333}.ec-rouge .ec-ven .e{color:#FF3333}.ec-rouge .ec-bas{border-top-color:rgba(255,51,51,.3)}
    .ec-rouge .ec-gl{background:linear-gradient(160deg,#ff8a8a,#a82727)}
    .ec-rouge .ec-rouge-pill{color:#FF3333;border-color:#FF3333;background:rgba(255,51,51,.1)}
    .ec-avert{border:1px solid rgba(232,163,90,.5);background:rgba(232,163,90,.07);color:#e8a35a;padding:8px 14px;font-size:.76em;line-height:1.55;margin-bottom:16px}
    .ec-cout{color:#FFD700;font-size:1.5em;line-height:1}.ec-cout small{font-size:.42em;color:#8a9;letter-spacing:2px;display:block;margin-top:3px}
    .ec-px2{color:#e8a35a;font-size:1.02em;line-height:1.4}
    .ec-msg{padding:34px 18px;text-align:center;color:#aaa;line-height:1.7}
    .ec-msg b{color:#FFD700;letter-spacing:2px;font-weight:normal;display:block;margin-bottom:6px}
    .ec-spin{display:inline-block;width:14px;height:14px;border:2px solid #FFD700;border-top-color:transparent;border-radius:50%;animation:ecTourne .9s linear infinite;vertical-align:-2px;margin-right:8px}
    @keyframes ecTourne{to{transform:rotate(360deg)}}
    .ec-bandeau{border:1px solid rgba(255,215,0,.45);background:rgba(255,215,0,.07);color:#FFD700;padding:7px 12px;font-size:.76em;margin-bottom:14px;letter-spacing:1px}
    .ec-pied{padding:6px 22px 16px;color:#777;font-size:.72em;line-height:1.6}
    @media (max-width:760px){
      #ec-overlay{padding:8px}.ec-corps{padding:12px 12px 6px}.ec-tete,.ec-regl,.ec-pied{padding-left:12px;padding-right:12px}
      .ec-route{grid-template-columns:1fr}.ec-lien{padding:6px 0}.ec-lien svg{display:none}.ec-gain{font-size:1.6em}
      .ec-ach{border-left:1px solid #333;border-top:4px solid #00F0FF}.ec-ven{border-right:1px solid #333;border-top:4px solid #00FF66}
      .ec-gr{grid-template-columns:1fr}.ec-fr{margin-left:0;text-align:left;min-width:0;width:100%}.ec-tete h2{font-size:1.2em}
    }`;

    const STOCKS = [100, 500, 1000, 2000], RAYONS = [20, 40, 80, 120, 200];
    const etat = { mode: 'commerce', ordre: null, systeme: '', faction: '', rayon: 40, heures: lire('edteam_com_h24') === '1' ? 24 : 168, stock: (() => { const v = parseInt(lire('edteam_com_stock') || '100', 10); return [100, 500, 1000, 2000].includes(v) ? v : 100; })(), donnees: null, statut: '', message: '', calc: null, essais: 0, minuteur: null, jeton: 0 };
    const prefs = {
        soute: () => Math.max(10, Math.min(5000, parseInt(lire('edteam_com_soute') || '200', 10) || 200)),
        grande: () => lire('edteam_com_grande') !== '0'
    };

    function jours(maj) { const t = Date.parse(maj || ''); return isNaN(t) ? null : Math.max(0, Math.floor((Date.now() - t) / 86400000)); }
    function ageHeures(maj) { const t = Date.parse(maj || ''); return isNaN(t) ? null : Math.max(0, (Date.now() - t) / 3600000); }
    function ageTxtH(h) {
        if (h === null) return 'date inconnue';
        if (h < 1) return 'il y a moins d\'1 h';
        if (h < 24) return 'il y a ' + Math.round(h) + ' h';
        const j = Math.floor(h / 24);
        return j === 1 ? 'hier' : j < 60 ? 'il y a ' + j + ' j' : 'il y a ' + Math.round(j / 30) + ' mois';
    }
    function ageTxt(j) { return j === null ? 'date inconnue' : j < 1 ? 'aujourd\'hui' : j === 1 ? 'hier' : j < 60 ? 'il y a ' + j + ' j' : 'il y a ' + Math.round(j / 30) + ' mois'; }
    function pastilleAge(maj) {
        const h = ageHeures(maj), frais = h !== null && h <= 48;
        return '<span class="ec-pill ' + (frais ? 'ec-ok' : 'ec-vx') + '">' + (frais ? 'RELEVÉ FRAIS · ' : 'RELEVÉ ') + E(ageTxtH(h).toUpperCase()) + '</span>';
    }
    function ouvert() { const o = document.getElementById('ec-overlay'); return !!o && o.style.display !== 'none'; }

    function assurerDom() {
        if (!document.getElementById('ec-style')) { const s = document.createElement('style'); s.id = 'ec-style'; s.textContent = CSS; document.head.appendChild(s); }
        let o = document.getElementById('ec-overlay');
        if (!o) {
            o = document.createElement('div'); o.id = 'ec-overlay';
            o.addEventListener('click', ev => { if (ev.target === o) api.fermer(); });
            document.body.appendChild(o);
            document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && ouvert()) api.fermer(); });
        }
        return o;
    }

    // ----- calcul des routes (navigateur) -----
    function calculer(donnees) {
        const soute = prefs.soute(), grande = prefs.grande();
        const okStation = s => !(grande && !s.grande);
        const routes = [];
        ((donnees && donnees.marchandises) || []).forEach(m => {
            let meilleure = null;
            (m.ventes || []).filter(okStation).forEach(v => (m.sources || []).filter(okStation).forEach(s => {
                const gain = (Number(v.prix) || 0) - (Number(s.prix) || 0);
                if (gain <= 0) return;
                const qte = Math.min(soute, Number(v.demande) || 0, Number(s.stock) || 0);
                if (qte <= 0) return;
                const r = { m, v, s, gain, qte, total: gain * qte };
                if (!meilleure || r.total > meilleure.total) meilleure = r;
            }));
            if (meilleure) routes.push(meilleure);
        });
        routes.sort((a, b) => b.total - a.total);
        return routes;
    }

    // ----- affichage -----
    function entete() {
        const c = etat.mode === 'contrebande';
        return '<div class="ec-tete"><div><small>DIRECTIVE #' + E(etat.ordre) + (c ? ' · BAISSE · CONTREBANDE' : ' · HAUSSE · COMMERCE') + '</small>'
            + '<h2>' + (c ? 'ROUTE DE CONTREBANDE' : 'ROUTE COMMERCIALE') + '<span>' + cp(etat.systeme, String(etat.systeme).toUpperCase()) + ' · ' + E(String(etat.faction).toUpperCase()) + '</span></h2>'
            + '<div class="ec-pas">' + (c ? '<b>1</b>ACHETEZ DE L\'ILLÉGAL<i>›</i><b>2</b>TRANSPORTEZ<i>›</i><b>3</b>VENDEZ AU MARCHÉ NOIR DE LA FACTION' : '<b>1</b>ACHETEZ<i>›</i><b>2</b>TRANSPORTEZ<i>›</i><b>3</b>VENDEZ À UNE STATION DE LA FACTION') + '</div></div>'
            + '<span class="ec-x" onclick="edteamCommerce.fermer()">✕</span></div>';
    }
    function reglages() {
        const s = prefs.soute(), seg = (vals, cur, fn, suf) => '<span class="ec-seg">' + vals.map(v => '<button type="button" class="' + (v === cur ? 'on' : '') + '" onclick="edteamCommerce.' + fn + '(' + v + ')">' + v + suf + '</button>').join('') + '</span>';
        return '<div class="ec-regl"><span>MA SOUTE' + seg([100, 200, 400, 700], s, 'regler', ' t') + ' <input class="ec-soute" type="number" min="10" max="5000" value="' + s + '" onchange="edteamCommerce.regler(this.value)" title="Capacité de votre soute, en tonnes"></span>'
            + '<span>RAYON D\'ACHAT' + seg(RAYONS, etat.rayon, 'rayon', ' al') + '</span>'
            + '<span title="Ne cherche que les stations qui ont au moins ce stock">STOCK MINI À L\'ACHAT' + seg(STOCKS, etat.stock, 'stock', ' t') + '</span>'
            + '<button type="button" class="ec-tg ' + (prefs.grande() ? 'on' : '') + '" onclick="edteamCommerce.bascule(\'grande\')"><i></i>GRANDE PISTE</button>'
            + '<button type="button" class="ec-tg ' + (etat.heures === 24 ? 'on' : '') + '" onclick="edteamCommerce.h24()" title="Par défaut, seuls les marchés relevés depuis moins de 7 jours sont proposés"><i></i>RELEVÉS DE MOINS DE 24 H</button></div>';
    }
    function msg(titre, texte, spin) { return '<div class="ec-msg"><b>' + (spin ? '<span class="ec-spin"></span>' : '') + E(titre) + '</b>' + texte + '</div>'; }
    function copier(texte, el, ev) {
        if (ev) ev.stopPropagation();
        if (typeof window.copierNav === 'function') { window.copierNav(texte, el, ev); return; }
        try { navigator.clipboard.writeText(texte); const t = el.textContent; el.textContent = 'COPIÉ'; setTimeout(() => { el.textContent = t; }, 1200); } catch (e) { /* copie impossible */ }
    }
    function cp(nom, affichage) { return '<span class="ec-cp" title="Cliquer pour copier" onclick="edteamCommerce.copie(this, ' + E(JSON.stringify(String(nom))).replace(/&quot;/g, '&#34;') + ', event)">' + E(affichage == null ? nom : affichage) + '</span>'; }
    function boutonCopie(txt) { return '<button type="button" class="ec-bt" onclick="edteamCommerce.copie(this, ' + E(JSON.stringify(txt)).replace(/&quot;/g, '&#34;') + ', event)">COPIER « ' + E(String(txt)) + ' »</button>'; }

    // ----- contrebande (directive de baisse) : marché noir de la faction + où acheter de l'illégal, SANS bénéfice calculé -----
    function corpsContre(d) {
        const soute = prefs.soute(), grande = prefs.grande(), faction = d.faction || etat.faction, systeme = d.systeme || etat.systeme;
        const toutes = d.destinations || [];
        if (!toutes.length) return msg('AUCUN MARCHÉ NOIR CHEZ CETTE FACTION', 'Spansh ne connaît aucune station de ' + E(faction) + ' avec un marché noir dans ' + E(systeme) + '.<br>Vendre de la contrebande ailleurs ne ferait pas baisser cette faction : l\'effet touche la faction qui contrôle la station où l\'on vend.');
        const dest = toutes.filter(x => !(grande && !x.grande));
        if (!dest.length) return msg('AUCUN MARCHÉ NOIR À GRANDE PISTE', 'Les marchés noirs de ' + E(faction) + ' dans ' + E(systeme) + ' n\'ont pas de grande piste.<br>Désactivez « Grande piste » pour les voir.');
        const okS = x => !(grande && !x.grande);
        const routes = [];
        (d.marchandises || []).forEach(m => {
            const c = (m.sources || []).filter(okS).filter(x => (Number(x.stock) || 0) > 0).sort((a, b) => (Number(a.distance) || 0) - (Number(b.distance) || 0));
            if (!c.length) return;
            const x = c[0], qte = Math.min(soute, Number(x.stock) || 0);
            routes.push({ m, s: x, qte, cout: qte * (Number(x.prix) || 0) });
        });
        routes.sort((a, b) => (Number(a.s.distance) || 0) - (Number(b.s.distance) || 0));
        const st = dest[0], autresDest = dest.slice(1, 4);
        let h = '<div class="ec-s">DESTINATION <b>· là où vendre fait baisser ' + E(faction) + '</b></div>'
            + '<div class="ec-dest"><div><div class="lib">MARCHÉ NOIR · STATION DE LA FACTION</div><div class="nom">' + cp(st.station, String(st.station).toUpperCase()) + '</div>'
            + '<div class="sous">' + cp(systeme, String(systeme).toUpperCase()) + ' · ' + (st.planetaire ? 'planétaire' : 'orbitale') + (st.grande ? ' · grande piste' : ' · petite piste') + ' · ' + toutes.length + ' station' + (toutes.length > 1 ? 's' : '') + ' de la faction ' + (toutes.length > 1 ? 'ont' : 'a') + ' un marché noir dans le système'
            + (autresDest.length ? '<br>aussi : ' + autresDest.map(x => cp(x.station)).join(' · ') : '') + '</div></div>'
            + '<div class="ec-fr" style="min-width:0"><span class="ec-pill ec-rouge-pill">VENDRE ICI : L\'INFLUENCE DE LA FACTION BAISSE</span></div></div>'
            + '<div class="ec-avert">⚠ Le prix de reprise du marché noir n\'est relevé par personne : vous le verrez à l\'arrivée. Une marchandise n\'est de la contrebande que si elle est <b>illégale dans ce système</b> : dans le jeu, elle doit apparaître comme telle. Vendre expose à une amende ou une prime si vous êtes scanné.</div>';
        if (!routes.length) return h + msg('AUCUNE MARCHANDISE À PROXIMITÉ', 'Aucune marchandise généralement illégale n\'est en vente à moins de ' + etat.rayon + ' années-lumière avec au moins ' + fmt(etat.stock) + ' t en stock.<br>Essayez un rayon plus grand, un stock minimal plus faible, ou désactivez « Relevés de moins de 24 h » ou « Grande piste ».');
        const best = routes[0], autres = routes.slice(1, 7), coul = ['#FF7100', '#FF3333', '#FFD700', '#00F0FF', '#FF4FD8', '#c9ccd1'];
        h += '<div class="ec-s">LA ROUTE LA PLUS PROCHE POUR <b>' + soute + ' t</b></div>'
          + '<div class="ec-vd"><div class="ec-vh"><div class="m"><div class="ec-gl">' + E(initiales(best.m.nom)) + '</div><div><b>' + E(nomFr(best.m.nom).toUpperCase()) + '</b><span>' + E(String(best.m.categorie || '').toUpperCase()) + '</span></div></div>' + pastilleAge(best.s.maj) + '</div>'
          + '<div class="ec-route"><div class="ec-n ec-ach"><div class="e">① ACHETER ICI</div><div class="st">' + cp(best.s.station) + '</div><div class="sy">' + cp(best.s.systeme) + ' · ' + E(best.s.distance) + ' al de ' + E(systeme) + '</div>'
          + '<div class="px">' + fmt(best.s.prix) + '<small>CR / t</small></div><div class="de">stock ' + fmt(best.s.stock) + ' t · ' + (best.s.planetaire ? 'planétaire' : 'orbitale') + (best.s.grande ? ' · grande piste' : ' · petite piste') + (best.s.arrivee ? ' · ' + fmt(best.s.arrivee) + ' Ls' : '') + '</div></div>'
          + '<div class="ec-lien"><svg viewBox="0 0 210 40"><defs><marker id="ecr" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z" fill="#FF3333"/></marker></defs><line x1="6" y1="20" x2="198" y2="20" stroke="#FF3333" stroke-width="2.5" stroke-dasharray="7 6" marker-end="url(#ecr)"/><circle cx="104" cy="20" r="4" fill="#FFD700"/></svg>'
          + '<div class="ec-cout">' + fmt(best.cout) + ' cr<small>COÛT D\'ACHAT POUR ' + fmt(best.qte) + ' t</small></div></div>'
          + '<div class="ec-n ec-ven"><div class="e">③ VENDRE ICI</div><div class="st">' + cp(st.station) + '</div><div class="sy">' + cp(systeme) + ' · marché noir</div>'
          + '<div class="ec-px2">prix de reprise : à voir en jeu</div><div class="de">vendez la marchandise au marché noir, pas au marché normal</div></div></div>'
          + '<div class="ec-bas"><div class="ec-tot">② TRANSPORTEZ ' + fmt(best.qte) + ' t · à emporter<b>' + mil(best.cout) + ' cr</b></div><div style="display:flex;gap:8px;flex-wrap:wrap;">' + boutonCopie(best.s.systeme) + boutonCopie(systeme) + '</div></div></div>';
        if (autres.length) {
            h += '<div class="ec-s">AUTRES MARCHANDISES <b style="color:#666;letter-spacing:1px;font-size:.95em">· la source la plus proche de chacune</b></div><div class="ec-gr">' + autres.map((r, i) => '<div class="ec-rc" style="--c:' + coul[i % coul.length] + '"><div class="l1"><b>' + E(nomFr(r.m.nom).toUpperCase()) + '</b><span style="color:#FFD700">' + fmt(r.s.prix) + ' cr / t</span></div>'
                + '<div class="tr"><em>' + cp(r.s.systeme) + '</em><span class="f">─────►</span><u style="color:#FF3333">' + cp(st.station) + '</u> <span style="color:#666">' + E(r.s.distance) + ' al</span></div>'
                + '<div class="l3"><span>' + pastilleAge(r.s.maj) + ' ' + cp(r.s.station) + ' · stock ' + fmt(r.s.stock) + ' t' + (r.s.grande ? '' : ' · petite piste') + '</span><span class="tt">' + mil(r.cout) + ' cr · ' + fmt(r.qte) + ' t</span></div></div>').join('') + '</div>';
        }
        return h;
    }
    function corps() {
        const d = etat.donnees;
        let h = '';
        if (etat.statut === 'EN_COURS') h += '<div class="ec-bandeau"><span class="ec-spin"></span>MISE À JOUR EN COURS CHEZ SPANSH…' + (d ? ' (les résultats ci-dessous datent de la dernière recherche)' : '') + '</div>';
        if (etat.statut === 'ERREUR') h += '<div class="ec-bandeau" style="border-color:#e8a35a;color:#e8a35a;">' + E(etat.message || 'Recherche impossible pour le moment.') + '</div>';
        if (!d) {
            if (etat.statut === 'EN_COURS') return h + msg('RECHERCHE EN COURS', 'La base interroge Spansh pour la première fois sur cette directive (environ 15 à 30 secondes).<br>Le résultat sera ensuite gardé 2 heures pour tout l\'escadron.', true);
            return h + msg('AUCUN RÉSULTAT', 'La recherche n\'a rien donné pour le moment. Réessayez dans quelques minutes.');
        }
        if (etat.mode === 'contrebande') return h + corpsContre(d);
        const dest = d.destinations || [];
        if (!dest.length || !(d.marchandises || []).length) {
            return h + msg('AUCUNE ROUTE', E(d.faction || etat.faction) + ' n\'a aucune station avec un marché relevé depuis moins de ' + (etat.heures === 24 ? '24 h' : '7 jours') + ' chez Spansh dans ' + E(d.systeme || etat.systeme) + ', ou rien de rentable à acheter à moins de ' + etat.rayon + ' années-lumière avec au moins ' + fmt(etat.stock) + ' t en stock.<br>Essayez un rayon plus grand ou un stock minimal plus faible.');
        }
        const routes = calculer(d);
        if (!routes.length) {
            return h + msg('AUCUNE ROUTE AVEC CES RÉGLAGES', 'Aucune marchandise ne rapporte avec votre soute, la taille de piste et la fraîcheur choisies.<br>Essayez de désactiver « Relevés de moins de 24 h » ou « Grande piste », ou d\'agrandir le rayon.');
        }
        const best = routes[0], autres = routes.slice(1, 7);
        const jv = ageHeures(best.v.maj), vFrais = jv !== null && jv <= 48;
        const nbDest = dest.length;
        h += '<div class="ec-s">DESTINATION <b>· là où vendre fait monter ' + E(d.faction || etat.faction) + '</b></div>'
          + '<div class="ec-dest"><div><div class="lib">STATION DE LA FACTION · LA MIEUX PLACÉE POUR CETTE ROUTE</div><div class="nom">' + cp(best.v.station, String(best.v.station).toUpperCase()) + '</div>'
          + '<div class="sous">' + E(String(d.systeme || etat.systeme).toUpperCase()) + ' · ' + (best.v.planetaire ? 'planétaire' : 'orbitale') + (best.v.grande ? ' · grande piste' : ' · petite piste') + ' · ' + nbDest + ' station' + (nbDest > 1 ? 's' : '') + ' de la faction avec marché dans le système</div></div>'
          + '<div class="ec-fr"><div class="t" title="Barre pleine : relevé à l\'instant. Barre vide : limite de fraîcheur choisie (7 jours, ou 24 h).">FRAÎCHEUR DU MARCHÉ</div><div class="b"><i style="width:' + Math.max(4, Math.min(100, jv === null ? 4 : Math.round(100 - jv / etat.heures * 100))) + '%;background:' + (vFrais ? '#00FF66' : 'linear-gradient(90deg,#e8a35a,#c0392b)') + '"></i></div><div class="v" style="color:' + (vFrais ? '#00FF66' : '#e8a35a') + '">' + (vFrais ? '' : '⚠ ') + 'relevé ' + E(ageTxtH(jv)) + (vFrais ? '' : ' — vérifiez à l\'arrivée') + '</div></div></div>';
        h += '<div class="ec-s">LA MEILLEURE ROUTE POUR <b>' + prefs.soute() + ' t</b></div>';
        h += '<div class="ec-vd"><div class="ec-vh"><div class="m"><div class="ec-gl">' + E(initiales(best.m.nom)) + '</div><div><b>' + E(nomFr(best.m.nom).toUpperCase()) + '</b><span>' + E(String(best.m.categorie || '').toUpperCase()) + '</span></div></div>' + pastilleAge(best.s.maj) + '</div>'
          + '<div class="ec-route"><div class="ec-n ec-ach"><div class="e">① ACHETER ICI</div><div class="st">' + cp(best.s.station) + '</div><div class="sy">' + cp(best.s.systeme) + ' · ' + E(best.s.distance) + ' al de ' + E(d.systeme || etat.systeme) + '</div>'
          + '<div class="px">' + fmt(best.s.prix) + '<small>CR / t</small></div><div class="de">stock ' + fmt(best.s.stock) + ' t · ' + (best.s.planetaire ? 'planétaire' : 'orbitale') + (best.s.grande ? ' · grande piste' : ' · petite piste') + (best.s.arrivee ? ' · ' + fmt(best.s.arrivee) + ' Ls' : '') + '</div></div>'
          + '<div class="ec-lien"><svg viewBox="0 0 210 40"><defs><marker id="ecf" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z" fill="#00FF66"/></marker></defs><line x1="6" y1="20" x2="198" y2="20" stroke="#00FF66" stroke-width="2.5" stroke-dasharray="7 6" marker-end="url(#ecf)"/><circle cx="104" cy="20" r="4" fill="#FFD700"/></svg>'
          + '<div class="ec-gain">+' + fmt(best.gain) + '<small>CR GAGNÉS PAR TONNE</small></div></div>'
          + '<div class="ec-n ec-ven"><div class="e">③ VENDRE ICI</div><div class="st">' + cp(best.v.station) + '</div><div class="sy">' + cp(d.systeme || etat.systeme) + ' · destination</div>'
          + '<div class="px">' + fmt(best.v.prix) + '<small>CR / t</small></div><div class="de">la station en achète ' + fmt(best.v.demande) + ' t · vous en portez ' + fmt(best.qte) + ' t</div></div></div>'
          + '<div class="ec-bas"><div class="ec-tot">② TRANSPORTEZ ' + fmt(best.qte) + ' t · bénéfice estimé<b>' + mil(best.total) + ' cr</b></div><div style="display:flex;gap:8px;flex-wrap:wrap;">' + boutonCopie(best.s.systeme) + boutonCopie(d.systeme || etat.systeme) + '</div></div></div>';
        if (autres.length) {
            const maxT = best.total || 1, coul = ['#FFD700', '#c9ccd1', '#00F0FF', '#FF7100', '#FF4FD8', '#00FF66'];
            h += '<div class="ec-s">AUTRES ROUTES POSSIBLES <b style="color:#666;letter-spacing:1px;font-size:.95em">· la barre compare chaque bénéfice total à celui de la meilleure route</b></div><div class="ec-gr">' + autres.map((r, i) => '<div class="ec-rc" style="--c:' + coul[i % coul.length] + '"><div class="l1"><b>' + E(nomFr(r.m.nom).toUpperCase()) + '</b><span>+' + fmt(r.gain) + ' / t</span></div>'
                + '<div class="tr"><em>' + cp(r.s.systeme) + '</em><span class="f">─────►</span><u>' + cp(r.v.station) + '</u> <span style="color:#666">' + E(r.s.distance) + ' al</span></div>'
                + '<div class="l3"><span>' + pastilleAge(r.s.maj) + ' ' + cp(r.s.station) + ' · ' + fmt(r.s.prix) + ' cr' + (r.s.grande ? '' : ' · petite piste') + '</span><span class="tt">' + mil(r.total) + ' cr · ' + fmt(r.qte) + ' t</span></div>'
                + '<div class="ba" title="Bénéfice total comparé à la meilleure route"><i style="width:' + Math.max(4, Math.round(100 * r.total / maxT)) + '%"></i></div></div>').join('') + '</div>';
        }
        return h;
    }
    function rendre() {
        const o = assurerDom();
        o.innerHTML = '<div class="ec-m' + (etat.mode === 'contrebande' ? ' ec-rouge' : '') + '">' + entete() + reglages() + '<div class="ec-corps">' + corps() + '</div>'
            + '<div class="ec-pied">ⓘ Prix tirés de Spansh (relevés des joueurs, via EDDN) : ils bougent, vérifiez le marché à l\'arrivée. Plus l\'escadron s\'amarre dans ces stations, plus les relevés sont frais. ' + (etat.mode === 'contrebande' ? 'Routes classées par distance d\'achat (le prix de reprise du marché noir n\'est pas connu).' : 'Routes classées par bénéfice total pour votre soute')
            + (etat.calc_le ? ' · recherche faite ' + E(ageTxtH(ageHeures(etat.calc_le))) : '') + ' · marchés relevés depuis moins de ' + (etat.heures === 24 ? '24 h' : '7 jours') + '.</div></div>';
        o.style.display = 'flex';
    }

    // ----- lecture serveur (avec relecture automatique pendant une recherche en tâche de fond) -----
    async function charger() {
        const jeton = ++etat.jeton;
        clearTimeout(etat.minuteur);
        const c = db();
        if (!c) { etat.statut = 'ERREUR'; etat.message = 'Connexion indisponible.'; rendre(); return; }
        let r;
        try { r = await c.rpc(etat.mode === 'contrebande' ? 'routes_contrebande' : 'routes_commerce', { p_ordre: Number(etat.ordre), p_rayon: etat.rayon, p_stock: etat.stock, p_heures: etat.heures }); } catch (e) { r = { error: { message: 'Connexion impossible.' } }; }
        if (jeton !== etat.jeton || !ouvert()) return;
        if (r.error || !r.data) { etat.statut = 'ERREUR'; etat.message = (r.error && r.error.message) || 'Réponse vide.'; etat.donnees = null; rendre(); return; }
        const j = r.data;
        etat.statut = j.statut; etat.message = j.message || ''; etat.donnees = j.donnees || null; etat.calc_le = j.calcule_le || null;
        if (j.statut === 'EN_COURS') {
            if (etat.essais < 45) { etat.essais++; etat.minuteur = setTimeout(charger, 4000); }
            else { etat.statut = 'ERREUR'; etat.message = 'La recherche prend trop de temps chez Spansh : réessayez dans quelques minutes.'; }
        }
        rendre();
    }

    const api = {
        ouvrir(ordreId, systeme, faction, mode) {
            if (typeof sonClic === 'function') sonClic();
            Object.assign(etat, { mode: mode === 'contrebande' ? 'contrebande' : 'commerce', ordre: ordreId, systeme: systeme || '', faction: faction || '', donnees: null, statut: 'EN_COURS', message: '', essais: 0, calc_le: null });
            if (!RAYONS.includes(etat.rayon)) etat.rayon = 40;
            if (!STOCKS.includes(etat.stock)) etat.stock = 100;
            rendre(); charger();
        },
        fermer() { etat.jeton++; clearTimeout(etat.minuteur); const o = document.getElementById('ec-overlay'); if (o) { o.style.display = 'none'; o.innerHTML = ''; } },
        regler(v) { ecrire('edteam_com_soute', String(Math.max(10, Math.min(5000, parseInt(v, 10) || 200)))); rendre(); },
        rayon(v) { if (v === etat.rayon) return; etat.rayon = v; etat.donnees = null; etat.statut = 'EN_COURS'; etat.essais = 0; rendre(); charger(); },
        stock(v) { if (v === etat.stock) return; etat.stock = v; ecrire('edteam_com_stock', String(v)); etat.donnees = null; etat.statut = 'EN_COURS'; etat.essais = 0; rendre(); charger(); },
        h24() { etat.heures = etat.heures === 24 ? 168 : 24; ecrire('edteam_com_h24', etat.heures === 24 ? '1' : '0'); etat.donnees = null; etat.statut = 'EN_COURS'; etat.essais = 0; rendre(); charger(); },
        bascule(k) { ecrire('edteam_com_grande', prefs.grande() ? '0' : '1'); rendre(); },
        copie(el, txt, ev) { copier(String(txt), el, ev); },
        // bouton « Où vendre ? » d'une directive de hausse en cours ; vide pour les autres
        bouton(ordre, classe) {
            const type = ordre ? String(ordre.type_ordre || '').toUpperCase() : '';
            if (!ordre || (type !== 'HAUSSE' && type !== 'BAISSE') || String(ordre.statut || 'ACTIF').toUpperCase() !== 'ACTIF') return '';
            const baisse = type === 'BAISSE';
            const arg = [ordre.id, ordre.systeme_cible || '', ordre.faction_cible || '', baisse ? 'contrebande' : 'commerce'].map(x => E(JSON.stringify(x)).replace(/&quot;/g, '&#34;')).join(', ');
            const compact = classe === 'compact';
            const pad = compact ? 'padding: 2px 8px; font-size: 0.85em; letter-spacing: 0;' : 'padding: 7px 14px; font-size: 0.8em; letter-spacing: 2px;';
            return '<button type="button" class="' + (classe || '') + '" onclick="event.stopPropagation(); edteamCommerce.ouvrir(' + arg + ')" style="background: ' + (baisse ? 'rgba(255,51,51,0.1); border: 1px solid #FF3333; color: #FF3333' : 'rgba(255,215,0,0.1); border: 1px solid #FFD700; color: #FFD700') + '; ' + pad + ' font-family: inherit; cursor: pointer; white-space: nowrap; box-shadow: 0 0 10px ' + (baisse ? 'rgba(255,51,51,0.2)' : 'rgba(255,215,0,0.2)') + ';">' + (baisse ? (compact ? '🏴 OÙ VENDRE ?' : '🏴 ROUTE DE CONTREBANDE') : '💰 OÙ VENDRE ?') + '</button>';
        }
    };
    window.edteamCommerce = api;
})();
