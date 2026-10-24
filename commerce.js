// ROUTES COMMERCIALES D'UNE DIRECTIVE DE HAUSSE (« Où vendre ? ») ET ROUTES DE CONTREBANDE D'UNE DIRECTIVE DE BAISSE : fenêtre commune au PC (bgs.html) et au mobile (mobile.html).
// Baisse, vente a perte : rpc routes_perte (script SQL 133) = achat PLUS CHER que le prix de reprise d'une station de la faction ; la PERTE (prix paye - prix de reprise) est le seul montant affiche ; classement au choix du pilote (perte la plus faible / la plus forte).
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
    .ec-perte{color:#ff9f43;font-size:1.9em;text-shadow:0 0 14px rgba(255,159,67,.5);line-height:1}.ec-perte small{font-size:.36em;color:#c99;letter-spacing:2px;display:block;margin-top:3px}
    .ec-rc .l1 span.p{color:#ff9f43}.ec-tri{display:inline-flex;align-items:center;gap:8px}
    .ec-msg{padding:34px 18px;text-align:center;color:#aaa;line-height:1.7}
    .ec-msg b{color:#FFD700;letter-spacing:2px;font-weight:normal;display:block;margin-bottom:6px}
    .ec-msg .ec-elargir{margin-top:6px;background:rgba(0,240,255,.1);border:1px solid #00F0FF;color:#00F0FF;font-family:inherit;font-size:.95em;letter-spacing:1.5px;padding:8px 18px;cursor:pointer}.ec-msg .ec-elargir:hover{background:rgba(0,240,255,.22)}
    .ec-spin{display:inline-block;width:14px;height:14px;border:2px solid #FFD700;border-top-color:transparent;border-radius:50%;animation:ecTourne .9s linear infinite;vertical-align:-2px;margin-right:8px}
    @keyframes ecTourne{to{transform:rotate(360deg)}}
    .ec-clig{animation:ecClig 1.1s ease-in-out infinite}.ec-clig .ec-seg button.on{color:#ffb347;background:rgba(255,159,67,.2);box-shadow:inset 0 0 8px rgba(255,159,67,.4)}
    @keyframes ecClig{0%,100%{opacity:1;text-shadow:0 0 8px rgba(255,159,67,.8)}50%{opacity:.3;text-shadow:none}}
    @media (prefers-reduced-motion:reduce){.ec-clig{animation:none}}
    .ec-ret{margin:12px 0 0;padding:10px 14px;border:1px dashed #00F0FF;background:rgba(0,240,255,.06);font-size:.84em;line-height:1.7;color:#bcd}.ec-ret b{color:#fff;font-weight:normal}.ec-ret u{text-decoration:none;color:#FFD700}
    .ec-ret .e{color:#00F0FF;letter-spacing:2px;font-size:.9em}.ec-ret .bil{margin-top:4px;padding-top:4px;border-top:1px dashed rgba(0,240,255,.25);letter-spacing:1px;color:#8a9}.ec-ret .bil b{font-size:1.15em}
    .ec-double{border:1px solid #00FF66;border-left:4px solid #00FF66;background:linear-gradient(135deg,rgba(0,255,102,.14),rgba(0,0,0,.5));animation:ecDbl 2.2s ease-in-out infinite}
    @keyframes ecDbl{0%,100%{box-shadow:0 0 0 rgba(0,255,102,0)}50%{box-shadow:0 0 18px rgba(0,255,102,.55)}}
    .ec-dbl{margin:8px 0 4px;padding:6px 10px;background:rgba(0,255,102,.16);border:1px solid #00FF66;color:#00FF66;font-size:.74em;letter-spacing:1.5px;line-height:1.5}
    .ec-dbl b{color:#fff;font-weight:normal;animation:ecClig 1.4s ease-in-out infinite}.ec-dbl small{display:block;color:#c9f5da;letter-spacing:.2px;font-size:1em;margin-top:3px}.ec-dbl em{font-style:normal;color:#FFD700}
    @media (prefers-reduced-motion:reduce){.ec-double,.ec-dbl b{animation:none}}
    .ec-jt{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin:16px 0 6px;font-size:.8em;letter-spacing:2px}.ec-jt b{padding:2px 10px;border:1px solid var(--j);color:var(--j);background:rgba(0,0,0,.4);font-weight:normal}.ec-jt .m{color:#fff}.ec-jt .eff{margin-left:auto;color:#999;letter-spacing:.4px;font-size:.95em;text-align:right}.ec-jt .eff em{font-style:normal;color:#FFD700}.ec-jt.a{--j:#00F0FF}.ec-jt.r{--j:#FFB000}.ec-jt.r.ok .eff{color:#00FF66}
    .ec-rt .ec-ach{border-left-color:#FFB000}.ec-rt .ec-ven{border-right-color:#FFB000}
    .ec-vd-double{border-color:#00FF66!important;animation:ecDbl 2.2s ease-in-out infinite}.ec-dbl2{margin:10px 0 0;padding:8px 12px;background:rgba(0,255,102,.16);border:1px solid #00FF66;color:#c9f5da;letter-spacing:1.5px;font-size:.8em;text-align:center}.ec-dbl2 b{color:#00FF66;font-weight:normal;animation:ecClig 1.4s ease-in-out infinite}
    .ec-bil{display:flex;flex-direction:column;gap:2px}.ec-bil small{color:#8a9;letter-spacing:2px;font-size:.7em}.ec-bil b{font-size:1.9em;font-weight:normal;letter-spacing:1px}.ec-bil span{color:#9ab;font-size:.76em}
    .ec-leg{margin:0 0 10px;padding:7px 12px;border-left:3px solid #00FF66;background:rgba(0,255,102,.07);color:#bfe;font-size:.76em;line-height:1.6}.ec-leg u{text-decoration:none;color:#fff}
    .ec-jr{margin:7px 0 0;padding-left:8px;border-left:2px solid var(--j)}.ec-jr.a{--j:#00F0FF}.ec-jr.r{--j:#FFB000}.ec-jr .r1{display:flex;align-items:baseline;gap:8px}.ec-jr .r1 i{font-style:normal;color:var(--j);font-size:.7em;letter-spacing:2px;white-space:nowrap}.ec-jr .r1 b{color:#fff;font-weight:normal;letter-spacing:1.5px;font-size:.92em}.ec-jr .r1 .t{margin-left:auto;color:#FFD700;white-space:nowrap}.ec-jr .r2{font-size:.72em;color:#9aa;margin-top:2px;line-height:1.55}
    .ec-note{margin:3px 0 0 10px;font-size:.7em;color:#777;letter-spacing:.3px}.ec-dbl3{margin:7px 0 2px;padding:3px 8px;background:rgba(0,255,102,.16);border:1px solid #00FF66;color:#c9f5da;font-size:.7em;letter-spacing:1.5px}.ec-dbl3 b{color:#00FF66;font-weight:normal;animation:ecClig 1.4s ease-in-out infinite}.ec-rc .mt{white-space:nowrap}
    @media (prefers-reduced-motion:reduce){.ec-vd-double,.ec-dbl2 b,.ec-dbl3 b{animation:none}}
    .ec-rc .ret{margin-top:5px;padding-top:4px;border-top:1px dashed rgba(0,240,255,.25);display:flex;justify-content:space-between;gap:8px;color:#00F0FF;font-size:.82em}
    .ec-bandeau{border:1px solid rgba(255,215,0,.45);background:rgba(255,215,0,.07);color:#FFD700;padding:7px 12px;font-size:.76em;margin-bottom:14px;letter-spacing:1px}
    .ec-etats{display:flex;align-items:center;gap:10px 14px;flex-wrap:wrap;margin:-8px 0 16px;padding:8px 14px;border:1px solid #2c2c2c;background:rgba(0,0,0,.35)}
    .ec-pied{padding:6px 22px 16px;color:#777;font-size:.72em;line-height:1.6}
    @media (max-width:760px){
      #ec-overlay{padding:8px}.ec-corps{padding:12px 12px 6px}.ec-tete,.ec-regl,.ec-pied{padding-left:12px;padding-right:12px}
      .ec-route{grid-template-columns:1fr}.ec-lien{padding:6px 0}.ec-lien svg{display:none}.ec-gain{font-size:1.6em}
      .ec-ach{border-left:1px solid #333;border-top:4px solid #00F0FF}.ec-ven{border-right:1px solid #333;border-top:4px solid #00FF66}
      .ec-gr{grid-template-columns:1fr}.ec-fr{margin-left:0;text-align:left;min-width:0;width:100%}.ec-tete h2{font-size:1.2em}
    }`;

    const STOCKS = [100, 500, 1000, 2000], RAYONS = [15, 20, 40, 80, 120, 200], DEMANDES = [0, 100, 500, 1000, 2000];
    const etat = { mode: 'commerce', type: 'HAUSSE', ordre: null, systeme: '', faction: '', rayon: 20, heures: (() => { const v = parseInt(lire('edteam_com_h') || '', 10); return [24, 168, 4320].includes(v) ? v : (lire('edteam_com_h24') === '1' ? 24 : 168); })(), stock: (() => { const v = parseInt(lire('edteam_com_stock') || '100', 10); return [100, 500, 1000, 2000].includes(v) ? v : 100; })(), demande: (() => { const v = parseInt(lire('edteam_com_dem') || '0', 10); return DEMANDES.includes(v) ? v : 0; })(), lieu: (() => { const v = lire('edteam_com_lieu'); return v === 'O' || v === 'P' ? v : 'T'; })(), retour: lire('edteam_com_ar') === '1', donnees: null, statut: '', message: '', calc: null, essais: 0, minuteur: null, jeton: 0 };
    const prefs = {
        soute: () => Math.max(10, Math.min(5000, parseInt(lire('edteam_com_soute') || '200', 10) || 200)),
        grande: () => lire('edteam_com_grande') !== '0',
        tri: () => (lire('edteam_perte_tri') === 'forte' ? 'forte' : 'faible')      // vente a perte : perte la plus faible (defaut) ou la plus forte
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
    function libH(h) { return h === 24 ? '24 h' : h === 4320 ? '6 mois' : '7 jours'; }
    function ageTxt(j) { return j === null ? 'date inconnue' : j < 1 ? 'aujourd\'hui' : j === 1 ? 'hier' : j < 60 ? 'il y a ' + j + ' j' : 'il y a ' + Math.round(j / 30) + ' mois'; }
    function pastilleAge(maj) {
        const h = ageHeures(maj), frais = h !== null && h <= 48;
        return '<span class="ec-pill ' + (frais ? 'ec-ok' : 'ec-vx') + '">' + (frais ? 'RELEVÉ FRAIS · ' : 'RELEVÉ ') + E(ageTxtH(h).toUpperCase()) + '</span>';
    }
    // etats de la faction (module etats-faction.js) : information pure, jamais pris en compte dans le classement des routes
    const resEtat = () => (window.edteamEtats ? window.edteamEtats.lecture(etat.ordre) : null);
    function etatsLigne() { const r = resEtat(); return r && r.donnees ? '<div class="ec-etats"><span class="ec-s" style="margin:0">ÉTATS DE LA FACTION</span>' + window.edteamEtats.bloc(r) + '</div>' : ''; }
    const etiquetteRoute = m => (window.edteamEtats && m ? window.edteamEtats.etiquette(resEtat(), m.categorie) : '');
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
    // quantite vendable : a demande mini 0 le benefice compte meme sans demande dans le jeu (soute et stock seulement) ; sinon la demande de la station plafonne aussi
    function quantite(soute, v, s) {
        const dem = Number(v.demande) || 0;
        if (etat.demande > 0 && dem < etat.demande) return 0;
        return etat.demande === 0 ? Math.min(soute, Number(s.stock) || 0) : Math.min(soute, dem, Number(s.stock) || 0);
    }
    function ligneDemande(v, qte) { const dem = Number(v.demande) || 0; return dem >= qte ? 'la station en achète ' + fmt(dem) + ' t · vous en portez ' + fmt(qte) + ' t' : 'demande ' + fmt(dem) + ' t · vous en portez ' + fmt(qte) + ' t<br>' + (etat.mode === 'perte' ? 'la vente à perte compte quand même' : 'le bénéfice compte quand même'); }
    // type de station choisi (toutes, orbitales, planetaires) ; la demande mini ne s'applique pas a la contrebande
    const okL = s => etat.lieu === 'T' || !!s.planetaire === (etat.lieu === 'P');
    const demEff = () => etat.demande;      // contrebande : s'applique a la revente du retour (aucune demande n'est relevee au marche noir)
    // aller-retour : la meilleure marchandise a rapporter de la station B (v) vers la station d'achat A (s) ; rien si le retour n'est pas rentable
    function retourDe(s, v, soute) {
        const e = (s.retour || []).find(x => String(x.st) === String(v.station));
        if (!e) return null;
        let best = null;
        (e.b || []).forEach(b => {
            const gain = (Number(b.v) || 0) - (Number(b.a) || 0);
            if (gain <= 0) return;
            const stock = Number(b.s) || 0, dem = Number(b.d) || 0, de = demEff();
            const qte = de === 0 ? Math.min(soute, stock) : Math.min(soute, stock, dem);
            if (qte <= 0) return;
            const x = { n: b.n, a: b.a, v: b.v, s: stock, d: dem, gain, qte, total: gain * qte };
            if (!best || x.total > best.total) best = x;
        });
        return best;
    }
    function retourBloc(r) {
        if (!etat.retour || !r.ret) return '';
        const x = r.ret, gaucheB = r.v.station, droiteA = r.s.station;
        const bilan = etat.mode === 'perte' ? x.total - r.total : etat.mode === 'contrebande' ? x.total : r.total + x.total;
        const lib = etat.mode === 'perte' ? 'BILAN DE LA BOUCLE (retour moins perte)' : etat.mode === 'contrebande' ? 'BÉNÉFICE DU RETOUR' : 'BILAN DE LA BOUCLE (aller + retour)';
        return routeDouble(r) + '<div class="ec-ret"><div class="e">↩ ALLER-RETOUR · AU RETOUR, ACHETEZ <b>' + E(nomFr(x.n).toUpperCase()) + '</b></div>'
            + 'achat <u>' + fmt(x.a) + ' cr / t</u> à ' + cp(gaucheB) + ' (stock ' + fmt(x.s) + ' t) · revente <u>' + fmt(x.v) + ' cr / t</u> à ' + cp(droiteA) + ' (demande ' + fmt(x.d) + ' t)'
            + '<br>+' + fmt(x.gain) + ' cr / t · ' + fmt(x.qte) + ' t · bénéfice du retour <b>' + mil(x.total) + ' cr</b>'
            + '<div class="bil">' + lib + ' <b style="color:' + (bilan >= 0 ? '#00FF66' : '#ff9f43') + '">' + (bilan >= 0 ? '+' : '−') + mil(Math.abs(bilan)) + ' cr</b></div></div>';
    }
    // prix tres eloigne de la mediane de la zone (etat de la faction, penurie...) : signale, jamais ecarte
    // route double : le trajet retour fait aussi monter la faction d'une AUTRE directive (ou de la meme) : un seul voyage, deux directives
    function routeDouble(r) {
        if (!etat.retour || !r.dir || r.dir.type === 'BAISSE') return '';
        const aller = etat.mode === 'perte' ? 'vous faites baisser ' : 'vous faites monter ';
        return '<div class="ec-dbl"><b>★ ROUTE DOUBLE · 2 DIRECTIVES EN UN SEUL VOYAGE</b><small>Aller : ' + aller + '<em>' + E(String(etat.faction).toUpperCase()) + '</em> (directive #' + E(etat.ordre) + ') à ' + E(r.v.station)
            + '.<br>Retour : en revendant à <em>' + E(r.s.station) + '</em> (' + E(r.s.systeme) + '), vous faites aussi monter <em>' + E(String(r.dir.faction).toUpperCase()) + '</em> (directive #' + E(r.dir.id) + ').</small></div>';
    }
    function inhab(r) {
        const dp = !r.dir ? '' : r.dir.type === 'BAISSE'
            ? '<span class="ec-pill ec-vx" title="La revente de retour se fait dans le système de la directive de BAISSE #' + E(r.dir.id) + ' (' + E(r.dir.faction) + ') : elle renforcerait cette faction, à éviter.">⚠ LE RETOUR RENFORCE LA DIRECTIVE DE BAISSE #' + E(r.dir.id) + '</span>'
            : '';
        const p = (txt, qui) => '<span class="ec-pill ec-vx" title="Ce prix est très différent de la médiane de la zone pour cette marchandise (un état, une pénurie ou un relevé ancien peuvent l’expliquer) : vérifiez-le en jeu avant de partir.">' + txt + ' ' + qui + '</span>';
        return dp + (r.s && r.s.inhab ? p('PRIX D’ACHAT', 'INHABITUEL') : '') + (r.v && r.v.inhab ? p('PRIX DE VENTE', 'INHABITUEL') : '');
    }
    function retourPetit(r) {
        if (!etat.retour || !r.ret) return '';
        return '<div class="ret"><span>↩ ' + E(nomFr(r.ret.n)) + ' · +' + fmt(r.ret.gain) + ' / t</span><span>' + mil(r.ret.total) + ' cr</span></div>';
    }
    // directive de l'escadron concernee par la VENTE faite dans la station s (le retour de l'aller-retour) : meme systeme et meme faction.
    // HAUSSE / ELECTION : la revente de retour fait aussi monter cette faction (route utile) ; BAISSE : elle la renforcerait (a eviter)
    function directiveDe(s) {
        const L = window.cacheOrdresBgs || [], sy = String(s.systeme || '').trim().toLowerCase(), fa = String(s.faction || '').trim().toLowerCase();
        if (!sy || !fa) return null;
        const o = L.find(x => String(x.systeme_cible || '').trim().toLowerCase() === sy && String(x.faction_cible || '').trim().toLowerCase() === fa && ['HAUSSE', 'ELECTION', 'BAISSE'].includes(String(x.type_ordre || '').toUpperCase()));
        return o ? { id: o.id, type: String(o.type_ordre).toUpperCase(), faction: o.faction_cible, systeme: o.systeme_cible } : null;
    }
    const utile = r => !!(r.dir && r.dir.type !== 'BAISSE');
    // routes doubles (le retour sert une directive de l'escadron) EN TETE, classees entre elles par bilan ; ensuite toutes les autres, classees comme avant
    function ordonner(routes) {
        if (!etat.retour) return routes;
        return routes.filter(utile).concat(routes.filter(r => !utile(r)));
    }
    function calculer(donnees) {
        const soute = prefs.soute(), grande = prefs.grande();
        const okStation = s => !(grande && !s.grande) && okL(s);
        const routes = [];
        ((donnees && donnees.marchandises) || []).forEach(m => {
            let meilleure = null, bonus = null;
            (m.ventes || []).filter(okStation).forEach(v => (m.sources || []).filter(okStation).forEach(s => {
                const gain = (Number(v.prix) || 0) - (Number(s.prix) || 0);
                if (gain <= 0) return;
                const qte = quantite(soute, v, s);
                if (qte <= 0) return;
                const ret = etat.retour ? retourDe(s, v, soute) : null;
                if (etat.retour && !ret) return;
                const r = { m, v, s, gain, qte, total: gain * qte, ret, dir: ret ? directiveDe(s) : null, global: gain * qte + (ret ? ret.total : 0) };
                if (!meilleure || r.global > meilleure.global) meilleure = r;
                if (utile(r) && (!bonus || r.global > bonus.global)) bonus = r;
            }));
            if (meilleure) routes.push(meilleure);
            if (bonus && bonus !== meilleure) routes.push(bonus);      // aussi la meilleure route dont le retour sert une directive
        });
        routes.sort((a, b) => b.global - a.global);
        return ordonner(routes);
    }

    // vente a perte : pour chaque marchandise, la paire (source, station de la faction) dont le prix paye depasse le prix de reprise ; perte par tonne = prix paye - prix de reprise
    // (une perte stricte seulement : un prix coutant ne compte pas). Classement : perte totale pour la soute, la plus faible ou la plus forte selon le choix du pilote.
    function calculerPerte(donnees) {
        const soute = prefs.soute(), grande = prefs.grande(), forte = prefs.tri() === 'forte';
        const okStation = s => !(grande && !s.grande) && okL(s);
        const routes = [];
        const mieux = (r, c) => !c || (forte ? r.total > c.total : (etat.retour ? r.net > c.net : r.total < c.total));
        ((donnees && donnees.marchandises) || []).forEach(m => {
            let choix = null, bonus = null;
            (m.ventes || []).filter(okStation).forEach(v => (m.sources || []).filter(okStation).forEach(s => {
                const perte = (Number(s.prix) || 0) - (Number(v.prix) || 0);
                if (perte <= 0) return;
                const qte = quantite(soute, v, s);
                if (qte <= 0) return;
                const ret = etat.retour ? retourDe(s, v, soute) : null;
                if (etat.retour && !ret) return;
                const r = { m, v, s, perte, qte, total: perte * qte, ret, dir: ret ? directiveDe(s) : null, net: (ret ? ret.total : 0) - perte * qte };
                if (mieux(r, choix)) choix = r;
                if (utile(r) && mieux(r, bonus)) bonus = r;
            }));
            if (choix) routes.push(choix);
            if (bonus && bonus !== choix) routes.push(bonus);
        });
        routes.sort((a, b) => (forte ? b.total - a.total : etat.retour ? b.net - a.net : a.total - b.total));
        return ordonner(routes);
    }

    // ----- affichage -----
    function entete() {
        if (etat.mode === 'perte') {
            return '<div class="ec-tete"><div><small>DIRECTIVE #' + E(etat.ordre) + ' · BAISSE · VENTE À PERTE</small>'
                + '<h2>OÙ VENDRE À PERTE ?<span>' + cp(etat.systeme, String(etat.systeme).toUpperCase()) + ' · ' + E(String(etat.faction).toUpperCase()) + '</span></h2>'
                + '<div class="ec-pas"><b>1</b>ACHETEZ CHER<i>›</i><b>2</b>TRANSPORTEZ<i>›</i><b>3</b>VENDEZ MOINS CHER À UNE STATION DE LA FACTION</div></div>'
                + '<span class="ec-x" onclick="edteamCommerce.fermer()">✕</span></div>';
        }
        const c = etat.mode === 'contrebande';
        return '<div class="ec-tete"><div><small>DIRECTIVE #' + E(etat.ordre) + (c ? ' · BAISSE · CONTREBANDE' : etat.type === 'ELECTION' ? ' · ÉLECTION · COMMERCE' : ' · HAUSSE · COMMERCE') + '</small>'
            + '<h2>' + (c ? 'ROUTE DE CONTREBANDE' : 'ROUTE COMMERCIALE') + '<span>' + cp(etat.systeme, String(etat.systeme).toUpperCase()) + ' · ' + E(String(etat.faction).toUpperCase()) + '</span></h2>'
            + '<div class="ec-pas">' + (c ? '<b>1</b>ACHETEZ DE L\'ILLÉGAL<i>›</i><b>2</b>TRANSPORTEZ<i>›</i><b>3</b>VENDEZ AU MARCHÉ NOIR DE LA FACTION' : '<b>1</b>ACHETEZ<i>›</i><b>2</b>TRANSPORTEZ<i>›</i><b>3</b>VENDEZ À UNE STATION DE LA FACTION') + '</div></div>'
            + '<span class="ec-x" onclick="edteamCommerce.fermer()">✕</span></div>';
    }
    function reglages() {
        const s = prefs.soute(), seg = (vals, cur, fn, suf) => '<span class="ec-seg">' + vals.map(v => '<button type="button" class="' + (v === cur ? 'on' : '') + '" onclick="edteamCommerce.' + fn + '(' + v + ')">' + v + suf + '</button>').join('') + '</span>';
        return '<div class="ec-regl"><span>MA SOUTE' + seg([100, 200, 400, 700], s, 'regler', ' t') + ' <input class="ec-soute" type="number" min="10" max="5000" value="' + s + '" onchange="edteamCommerce.regler(this.value)" title="Capacité de votre soute, en tonnes"></span>'
            + '<span>RAYON D\'ACHAT' + seg(RAYONS, etat.rayon, 'rayon', ' al') + '</span>'
            + '<span title="Ne cherche que les stations qui ont au moins ce stock">STOCK MINI À L\'ACHAT' + seg(STOCKS, etat.stock, 'stock', ' t') + '</span>'
            + ('<span class="' + (etat.demande === 0 ? 'ec-clig' : '') + '" title="' + (etat.mode === 'contrebande' ? 'Demande minimale de la station d’achat pour la marchandise rapportée au retour (réglage « Aller-retour »). Le marché noir de la faction n’a pas de demande relevée. À 0 : tout bénéfice compte.' : 'Demande minimale de la station de la faction. À 0 : tout bénéfice compte en influence dans le jeu, même sans demande ; la quantité n’est alors limitée que par votre soute et le stock à l’achat.') + '">DEMANDE MINI À LA VENTE' + seg(DEMANDES, etat.demande, 'demande', ' t') + '</span>')
            + '<span title="Type de station proposé, à l’achat comme à la vente">STATIONS' + [['T', 'TOUTES'], ['O', 'ORBITALES'], ['P', 'PLANÉTAIRES']].reduce((a, x) => a + '<button type="button" class="' + (x[0] === etat.lieu ? 'on' : '') + '" onclick="edteamCommerce.lieu(\'' + x[0] + '\')">' + x[1] + '</button>', '<span class="ec-seg">') + '</span></span>'
            + '<button type="button" class="ec-tg ' + (etat.retour ? 'on' : '') + '" title="Ne garde que les routes dont le trajet retour est rentable : on achète à la station de la faction une marchandise que la station d’achat reprend plus cher" onclick="edteamCommerce.boucle()"><i></i>ALLER-RETOUR</button>'
            + '<button type="button" class="ec-tg ' + (prefs.grande() ? 'on' : '') + '" onclick="edteamCommerce.bascule(\'grande\')"><i></i>GRANDE PISTE</button>'
            + '<span title="Âge maximal du relevé d\'un marché chez Spansh. Par défaut 7 jours ; 6 mois si les stations de la faction ne sont plus visitées.">RELEVÉS DE MOINS DE' + [[24, '24 h'], [168, '7 j'], [4320, '6 mois']].reduce((a, x) => a + '<button type="button" class="' + (x[0] === etat.heures ? 'on' : '') + '" onclick="edteamCommerce.fraicheur(' + x[0] + ')">' + x[1] + '</button>', '<span class="ec-seg">') + '</span></span>' + (etat.mode === 'perte' ? triPerte() : '') + '</div>';
    }
    function triPerte() {
        const t = prefs.tri(), b = (v, lib) => '<button type="button" class="' + (v === t ? 'on' : '') + '" onclick="edteamCommerce.tri(\'' + v + '\')">' + lib + '</button>';
        return '<span class="ec-tri" title="Classe les routes par perte totale pour votre soute">CLASSER PAR<span class="ec-seg">' + b('faible', 'PERTE LA PLUS FAIBLE') + b('forte', 'PERTE LA PLUS FORTE') + '</span></span>';
    }
    function msg(titre, texte, spin) { return '<div class="ec-msg"><b>' + (spin ? '<span class="ec-spin"></span>' : '') + E(titre) + '</b>' + texte + '</div>'; }
    function copier(texte, el, ev) {
        if (ev) ev.stopPropagation();
        if (typeof window.copierNav === 'function') { window.copierNav(texte, el, ev); return; }
        try { navigator.clipboard.writeText(texte); const t = el.textContent; el.textContent = 'COPIÉ'; setTimeout(() => { el.textContent = t; }, 1200); } catch (e) { /* copie impossible */ }
    }
    function cp(nom, affichage) { return '<span class="ec-cp" title="Cliquer pour copier" onclick="edteamCommerce.copie(this, ' + E(JSON.stringify(String(nom))).replace(/&quot;/g, '&#34;') + ', event)">' + E(affichage == null ? nom : affichage) + '</span>'; }
    function boutonCopie(txt) { return '<button type="button" class="ec-bt" onclick="edteamCommerce.copie(this, ' + E(JSON.stringify(txt)).replace(/&quot;/g, '&#34;') + ', event)">COPIER « ' + E(String(txt)) + ' »</button>'; }

    // ===== AFFICHAGE D'UNE ROUTE : ALLER SIMPLE OU ALLER-RETOUR (meme mise en page pour les trois modes) =====
    // c = { mode : 'commerce' | 'perte' | 'contre', sysF : systeme de la directive, faction : faction visee, couleur : couleur de la fleche de l'aller }
    const typeSt = s => (s.planetaire ? 'planétaire' : 'orbitale') + (s.grande ? ' · grande piste' : ' · petite piste');
    const boite = (cls, o) => '<div class="ec-n ' + cls + '"><div class="e">' + o.titre + '</div><div class="st">' + cp(o.station) + '</div><div class="sy">' + o.sy + '</div>'
        + (o.prix == null ? (o.libre || '') : '<div class="px">' + fmt(o.prix) + '<small>CR / t</small></div>') + '<div class="de">' + o.de + '</div></div>';
    const fleche = (coul, centre) => '<div class="ec-lien"><svg viewBox="0 0 210 40"><defs><marker id="ecm' + coul.slice(1) + '" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z" fill="' + coul + '"/></marker></defs>'
        + '<line x1="6" y1="20" x2="198" y2="20" stroke="' + coul + '" stroke-width="2.5" stroke-dasharray="7 6" marker-end="url(#ecm' + coul.slice(1) + ')"/><circle cx="104" cy="20" r="4" fill="#FFD700"/></svg>' + centre + '</div>';
    const arOn = r => !!(etat.retour && r.ret);
    const bilanDe = (r, c) => (c.mode === 'perte' ? r.net : c.mode === 'contre' ? r.ret.total : r.global);
    const montantTxt = v => (v >= 0 ? '+' : '−') + mil(Math.abs(v)) + ' cr';
    const effetAller = c => (c.mode === 'commerce' ? 'fait monter ' : 'fait baisser ') + '<em>' + E(String(c.faction).toUpperCase()) + '</em> (directive #' + E(etat.ordre) + ')';
    const effetRetour = r => !r.dir ? 'crédits seulement : cette revente ne sert aucune de vos directives'
        : r.dir.type === 'BAISSE' ? '⚠ renforcerait <em>' + E(String(r.dir.faction).toUpperCase()) + '</em> (directive de BAISSE #' + E(r.dir.id) + ') : à éviter'
        : 'fait aussi monter <em>' + E(String(r.dir.faction).toUpperCase()) + '</em> (directive #' + E(r.dir.id) + ')';
    // etape ALLER : acheter a la source, vendre a la station de la faction
    function grilleAller(r, c, num) {
        const ach = { titre: (num ? '' : '① ') + 'ACHETER ICI', station: r.s.station, sy: cp(r.s.systeme) + ' · ' + E(r.s.distance) + ' al de ' + E(c.sysF), prix: r.s.prix,
                      de: 'stock ' + fmt(r.s.stock) + ' t · ' + typeSt(r.s) + (r.s.arrivee ? ' · ' + fmt(r.s.arrivee) + ' Ls' : '') };
        const ven = c.mode === 'contre'
            ? { titre: (num ? '' : '③ ') + 'VENDRE ICI', station: r.v.station, sy: cp(c.sysF) + ' · marché noir', prix: null, libre: '<div class="ec-px2">prix de reprise : à voir en jeu</div>', de: 'vendez au marché noir, pas au marché normal' }
            : { titre: (num ? '' : '③ ') + 'VENDRE ICI', station: r.v.station, sy: cp(c.sysF) + ' · destination', prix: r.v.prix, de: ligneDemande(r.v, r.qte) };
        const centre = c.mode === 'perte' ? '<div class="ec-perte">−' + fmt(r.perte) + '<small>CR DE PERTE PAR TONNE</small></div>'
            : c.mode === 'contre' ? '<div class="ec-cout">' + fmt(r.cout) + ' cr<small>COÛT D\'ACHAT POUR ' + fmt(r.qte) + ' t</small></div>'
            : '<div class="ec-gain">+' + fmt(r.gain) + '<small>CR GAGNÉS PAR TONNE</small></div>';
        return '<div class="ec-route">' + boite('ec-ach', ach) + fleche(c.couleur, centre) + boite('ec-ven', ven) + '</div>';
    }
    // etape RETOUR : acheter a la station de la faction, revendre a la station d'achat de l'aller
    function grilleRetour(r, c) {
        const x = r.ret;
        const ach = { titre: 'ACHETER ICI', station: r.v.station, sy: cp(c.sysF) + ' · station de la faction', prix: x.a, de: 'stock ' + fmt(x.s) + ' t' };
        const ven = { titre: 'VENDRE ICI', station: r.s.station, sy: cp(r.s.systeme) + (r.s.faction ? ' · ' + E(String(r.s.faction).toUpperCase()) : ''), prix: x.v, de: 'demande ' + fmt(x.d) + ' t · vous en portez ' + fmt(x.qte) + ' t' };
        return '<div class="ec-route ec-rt">' + boite('ec-ach', ach) + fleche('#FFB000', '<div class="ec-gain" style="color:#FFB000;text-shadow:0 0 14px rgba(255,176,0,.5)">+' + fmt(x.gain) + '<small>CR GAGNÉS PAR TONNE</small></div>') + boite('ec-ven', ven) + '</div>';
    }
    // grande carte : la route mise en avant
    function carteGrande(r, c) {
        const ar = arOn(r), dbl = ar && utile(r);
        const bord = c.mode === 'perte' ? ' style="border-color:#ff9f43"' : '';
        let h = '<div class="ec-vd' + (dbl ? ' ec-vd-double' : '') + '"' + bord + '><div class="ec-vh"><div class="m"><div class="ec-gl">' + E(initiales(r.m.nom)) + '</div><div><b>' + E(nomFr(r.m.nom).toUpperCase()) + '</b><span>' + E(String(r.m.categorie || '').toUpperCase()) + '</span></div></div>'
              + '<span style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">' + etiquetteRoute(r.m) + pastilleAge(r.s.maj) + inhab(r) + '</span></div>';
        if (dbl) h += '<div class="ec-dbl2"><b>★ ROUTE DOUBLE</b> · 2 directives en un seul voyage : #' + E(etat.ordre) + ' + #' + E(r.dir.id) + '</div>';
        if (!ar) {
            h += grilleAller(r, c, false);
            const lib = c.mode === 'perte' ? 'perte estimée<b style="color:#ff9f43">' + mil(r.total) : c.mode === 'contre' ? 'à emporter<b>' + mil(r.cout) : 'bénéfice estimé<b>' + mil(r.total);
            return h + '<div class="ec-bas"><div class="ec-tot">② TRANSPORTEZ ' + fmt(r.qte) + ' t · ' + lib + ' cr</b></div><div style="display:flex;gap:8px;flex-wrap:wrap;">' + boutonCopie(r.s.systeme) + boutonCopie(c.sysF) + '</div></div></div>';
        }
        const aller = c.mode === 'perte' ? '−' + mil(r.total) : c.mode === 'contre' ? mil(r.cout) + ' d\'achat' : '+' + mil(r.total), b = bilanDe(r, c);
        h += '<div class="ec-jt a"><b>1 · ALLER</b><span class="m">' + E(nomFr(r.m.nom).toUpperCase()) + '</span><span class="eff">' + effetAller(c) + '</span></div>' + grilleAller(r, c, true);
        h += '<div class="ec-jt r' + (r.dir && r.dir.type !== 'BAISSE' ? ' ok' : '') + '"><b>2 · RETOUR</b><span class="m">' + E(nomFr(r.ret.n).toUpperCase()) + '</span><span class="eff">' + effetRetour(r) + '</span></div>' + grilleRetour(r, c);
        const detail = c.mode === 'perte' ? 'retour +' + mil(r.ret.total) + ' − perte ' + mil(r.total) : c.mode === 'contre' ? 'bénéfice du retour · coût d\'achat à l\'aller ' + mil(r.cout) : 'aller +' + mil(r.total) + ' · retour +' + mil(r.ret.total);
        return h + '<div class="ec-bas"><div class="ec-bil"><small>BILAN DE L\'ALLER-RETOUR · ' + fmt(r.qte) + ' t</small><b style="color:' + (b >= 0 ? '#00FF66' : '#ff9f43') + '">' + montantTxt(b) + '</b><span>' + detail + '</span></div>'
            + '<div style="display:flex;gap:8px;flex-wrap:wrap;">' + boutonCopie(r.s.systeme) + boutonCopie(c.sysF) + '</div></div></div>';
    }
    // une ligne d'etape dans une petite carte
    const etapeP = (cls, lib, nom, de, vers, prix, gain, qte, tot, col) => '<div class="ec-jr ' + cls + '">' + (lib || tot ? '<div class="r1"><i>' + lib + '</i>' + (nom ? '<b>' + E(nomFr(nom).toUpperCase()) + '</b>' : '') + '<span class="t"' + (col ? ' style="color:' + col + '"' : '') + '>' + tot + '</span></div>' : '')
        + '<div class="r2">' + de + ' ► ' + vers + ' · ' + prix + (gain ? ' · ' + gain : '') + ' · ' + fmt(qte) + ' t</div></div>';
    function cartePetite(r, c, coul, sc, maxT) {
        const ar = arOn(r), dbl = ar && utile(r), b = ar ? bilanDe(r, c) : null;
        const totA = c.mode === 'perte' ? '−' + mil(r.total) + ' cr' : c.mode === 'contre' ? mil(r.cout) + ' cr' : '+' + mil(r.total) + ' cr';
        const colA = c.mode === 'perte' ? '#ff9f43' : c.mode === 'contre' ? '#c9ccd1' : '#00FF66';
        const prixA = c.mode === 'contre' ? fmt(r.s.prix) + ' cr / t (à l\'achat)' : fmt(r.s.prix) + ' → ' + fmt(r.v.prix) + ' cr / t';
        const gainA = c.mode === 'perte' ? '−' + fmt(r.perte) + ' / t' : c.mode === 'contre' ? '' : '+' + fmt(r.gain) + ' / t';
        let h = '<div class="ec-rc' + (dbl ? ' ec-double' : '') + '" style="--c:' + coul + '"><div class="l1"><b>' + E(nomFr(r.m.nom).toUpperCase()) + '</b>'
              + (ar ? '<span class="mt" style="color:' + (b >= 0 ? '#00FF66' : '#ff9f43') + '" title="Bilan estimé de l’aller-retour">BILAN ' + montantTxt(b) + '</span>' : '<span class="mt" style="color:' + colA + '">' + totA + '</span>') + '</div>';
        if (dbl) h += '<div class="ec-dbl3"><b>★ ROUTE DOUBLE</b> · directives #' + E(etat.ordre) + ' + #' + E(r.dir.id) + '</div>';
        h += etapeP('a', ar ? '1 · ALLER' : '', '', cp(r.s.systeme), cp(r.v.station), prixA, gainA, r.qte, ar ? totA : '', colA);
        if (ar) h += etapeP('r', '2 · RETOUR', r.ret.n, cp(r.v.station), cp(r.s.systeme), fmt(r.ret.a) + ' → ' + fmt(r.ret.v) + ' cr / t', '+' + fmt(r.ret.gain) + ' / t', r.ret.qte, '+' + mil(r.ret.total) + ' cr', '#FFB000')
              + (r.dir ? '' : '<div class="ec-note">retour : crédits seulement, aucune de vos directives</div>');
        h += '<div class="l3"><span>' + etiquetteRoute(r.m) + ' ' + pastilleAge(r.s.maj) + ' ' + inhab(r) + ' ' + cp(r.s.station) + ' · ' + E(r.s.distance) + ' al</span></div>';
        if (c.mode === 'commerce') h += '<div class="ba" title="Comparé à la meilleure route"><i style="width:' + Math.max(4, Math.min(100, Math.round(100 * sc(r) / maxT))) + '%"></i></div>';
        return h + '</div>';
    }
    // liste des autres routes (+ legende unique des routes doubles)
    function cartesAutres(autres, c, best, titre, sous) {
        if (!autres.length) return '';
        const sc = x => (etat.retour && x.global ? x.global : x.total), maxT = Math.max(1, sc(best), ...autres.map(sc));
        const coulP = ['#FFD700', '#c9ccd1', '#00F0FF', '#FF7100', '#FF4FD8', '#00FF66'];
        const leg = etat.retour && autres.concat([best]).some(utile) ? '<div class="ec-leg"><b style="color:#00FF66">★ ROUTE DOUBLE</b> : l’aller fait ' + (c.mode === 'commerce' ? 'monter' : 'baisser') + ' la faction de la directive de cette fenêtre, et la revente du retour fait monter <u>une autre directive</u> de l’escadron. Un seul voyage, deux directives. Sans ★, le retour ne rapporte que des crédits.</div>' : '';
        return '<div class="ec-s">' + titre + ' <b style="color:#666;letter-spacing:1px;font-size:.95em">' + sous + '</b></div>' + leg + '<div class="ec-gr">' + autres.map((r, i) => cartePetite(r, c, coulP[i % coulP.length], sc, maxT)).join('') + '</div>';
    }

    // ----- contrebande (directive de baisse) : marché noir de la faction + où acheter de l'illégal, SANS bénéfice calculé -----
    function corpsContre(d) {
        const soute = prefs.soute(), grande = prefs.grande(), faction = d.faction || etat.faction, systeme = d.systeme || etat.systeme;
        const toutes = d.destinations || [];
        if (!toutes.length) return msg('AUCUN MARCHÉ NOIR CHEZ CETTE FACTION', 'Spansh ne connaît aucune station de ' + E(faction) + ' avec un marché noir dans ' + E(systeme) + '.<br>Vendre de la contrebande ailleurs ne ferait pas baisser cette faction : l\'effet touche la faction qui contrôle la station où l\'on vend.');
        const dest = toutes.filter(x => !(grande && !x.grande) && okL(x));
        if (!dest.length) return msg('AUCUN MARCHÉ NOIR À CES RÉGLAGES', 'Les marchés noirs de ' + E(faction) + ' dans ' + E(systeme) + ' n\'ont pas de grande piste ou ne sont pas du type de station choisi.<br>Désactivez « Grande piste » ou choisissez « Toutes » les stations pour les voir.');
        const okS = x => !(grande && !x.grande) && okL(x);
        const routes = [];
        (d.marchandises || []).forEach(m => {
            const c = (m.sources || []).filter(okS).filter(x => (Number(x.stock) || 0) > 0).sort((a, b) => (Number(a.distance) || 0) - (Number(b.distance) || 0));
            for (const x of c) {
                const ret = etat.retour ? retourDe(x, dest[0], soute) : null;
                if (etat.retour && !ret) continue;      // aller-retour : la source la plus proche dont le retour est rentable
                const qte = Math.min(soute, Number(x.stock) || 0);
                routes.push({ m, s: x, v: dest[0], qte, cout: qte * (Number(x.prix) || 0), ret, dir: ret ? directiveDe(x) : null });
                break;
            }
        });
        routes.sort((a, b) => (Number(a.s.distance) || 0) - (Number(b.s.distance) || 0));
        const st = dest[0], autresDest = dest.slice(1, 4);
        let h = '<div class="ec-s">DESTINATION <b>· là où vendre fait baisser ' + E(faction) + '</b></div>'
            + '<div class="ec-dest"><div><div class="lib">MARCHÉ NOIR · STATION DE LA FACTION</div><div class="nom">' + cp(st.station, String(st.station).toUpperCase()) + '</div>'
            + '<div class="sous">' + cp(systeme, String(systeme).toUpperCase()) + ' · ' + (st.planetaire ? 'planétaire' : 'orbitale') + (st.grande ? ' · grande piste' : ' · petite piste') + ' · ' + toutes.length + ' station' + (toutes.length > 1 ? 's' : '') + ' de la faction ' + (toutes.length > 1 ? 'ont' : 'a') + ' un marché noir dans le système'
            + (autresDest.length ? '<br>aussi : ' + autresDest.map(x => cp(x.station)).join(' · ') : '') + '</div></div>'
            + '<div class="ec-fr" style="min-width:0"><span class="ec-pill ec-rouge-pill">VENDRE ICI : L\'INFLUENCE DE LA FACTION BAISSE</span></div></div>'
            + etatsLigne() + '<div class="ec-avert">⚠ Le prix de reprise du marché noir n\'est relevé par personne : vous le verrez à l\'arrivée. Une marchandise n\'est de la contrebande que si elle est <b>illégale dans ce système</b> : dans le jeu, elle doit apparaître comme telle. Vendre expose à une amende ou une prime si vous êtes scanné.</div>';
        if (!routes.length && etat.retour) return h + msg('AUCUNE ROUTE ALLER-RETOUR', 'Aucune marchandise illégale proche ne permet un retour rentable depuis ' + E(st.station) + ' avec ces réglages (stations relevées par Spansh seulement).<br>Désactivez « Aller-retour », élargissez le rayon ou les relevés, ou changez le type de station.');
        if (!routes.length) return h + msg('AUCUNE MARCHANDISE À PROXIMITÉ', 'Aucune marchandise généralement illégale n\'est en vente à moins de ' + etat.rayon + ' années-lumière avec au moins ' + fmt(etat.stock) + ' t en stock.<br>Essayez un rayon plus grand, un stock minimal plus faible, ou élargissez les relevés (7 jours, 6 mois) ou désactivez « Grande piste ».');
        const c = { mode: 'contre', sysF: systeme, faction, couleur: '#FF3333' };
        const best = routes[0], autres = routes.slice(1, 7);
        h += '<div class="ec-s">LA ROUTE LA PLUS PROCHE POUR <b>' + soute + ' t</b></div>' + carteGrande(best, c);
        h += cartesAutres(autres, c, best, 'AUTRES MARCHANDISES', '· la source la plus proche de chacune');
        return h;
    }
    // ----- vente a perte (directive de baisse) : la PERTE seule est affichee, jamais le montant de la vente -----
    function corpsPerte(d) {
        const faction = d.faction || etat.faction, systeme = d.systeme || etat.systeme, dest = d.destinations || [], forte = prefs.tri() === 'forte';
        if (!dest.length) return msg('AUCUNE STATION DE LA FACTION AVEC UN MARCHÉ', 'Spansh ne connaît aucune station contrôlée par ' + E(faction) + ' avec un marché relevé dans ' + E(systeme) + '.<br>Vendre à perte ailleurs ne ferait pas baisser cette faction : l\'effet touche la faction qui contrôle la station où l\'on vend. Cette directive ne peut donc pas utiliser la vente à perte tant qu\'une station de la faction n\'a pas de marché relevé.');
        if (!(d.marchandises || []).length) {
            const ages = dest.map(x => ageHeures(x.maj)).filter(x => x !== null), frais = ages.length ? Math.min.apply(null, ages) : null;
            const aide = etat.heures < 4320 && dest.length ? '<br><br>Chez Spansh, le relevé le plus récent d\'une station de ' + E(faction) + ' date de <strong style="color:#fff">' + E(ageTxtH(frais).replace(/^il y a /, '')) + '</strong> : personne ne s\'y est amarré depuis.<br><button type="button" class="ec-elargir" onclick="edteamCommerce.fraicheur(4320)">ESSAYER AVEC LES RELEVÉS DE MOINS DE 6 MOIS</button>' : '';
            return msg('AUCUNE ROUTE À PERTE', E(faction) + ' n\'a aucune station avec un marché relevé depuis moins de ' + libH(etat.heures) + ' chez Spansh dans ' + E(systeme) + ', ou aucune marchandise n\'y est vendue plus cher à moins de ' + etat.rayon + ' années-lumière avec au moins ' + fmt(etat.stock) + ' t en stock.<br>Essayez un rayon plus grand ou un stock minimal plus faible.' + aide);
        }
        const routes = calculerPerte(d);
        if (!routes.length) return msg('AUCUNE ROUTE À PERTE AVEC CES RÉGLAGES', 'Aucune marchandise ne se vend moins cher dans ' + E(systeme) + ' que son prix d\'achat proche, avec votre soute, la taille de piste, le type de station' + (etat.retour ? ', un retour rentable' : '') + ' et la fraîcheur choisis.<br>Essayez d\'élargir les relevés (7 jours, 6 mois), de désactiver « Grande piste »' + (etat.retour ? ' ou « Aller-retour »' : '') + ' ou d\'agrandir le rayon.');
        const best = routes[0], autres = routes.slice(1, 7);
        const c = { mode: 'perte', sysF: systeme, faction, couleur: '#ff9f43' };
        const jv = ageHeures(best.v.maj), vFrais = jv !== null && jv <= 48;
        let h = '<div class="ec-s">DESTINATION <b>· là où vendre à perte fait baisser ' + E(faction) + '</b></div>'
          + '<div class="ec-dest"><div><div class="lib">STATION DE LA FACTION · LA MIEUX PLACÉE POUR CETTE ROUTE</div><div class="nom">' + cp(best.v.station, String(best.v.station).toUpperCase()) + '</div>'
          + '<div class="sous">' + E(String(systeme).toUpperCase()) + ' · ' + (best.v.planetaire ? 'planétaire' : 'orbitale') + (best.v.grande ? ' · grande piste' : ' · petite piste') + ' · ' + dest.length + ' station' + (dest.length > 1 ? 's' : '') + ' de la faction avec marché dans le système</div></div>'
          + '<div class="ec-fr"><div class="t" title="Barre pleine : relevé à l\'instant. Barre vide : limite de fraîcheur choisie (24 h, 7 jours ou 6 mois).">FRAÎCHEUR DU MARCHÉ</div><div class="b"><i style="width:' + Math.max(4, Math.min(100, jv === null ? 4 : Math.round(100 - jv / etat.heures * 100))) + '%;background:' + (vFrais ? '#00FF66' : 'linear-gradient(90deg,#e8a35a,#c0392b)') + '"></i></div><div class="v" style="color:' + (vFrais ? '#00FF66' : '#e8a35a') + '">' + (vFrais ? '' : '⚠ ') + 'relevé ' + E(ageTxtH(jv)) + (vFrais ? '' : ' — vérifiez à l\'arrivée') + '</div></div></div>'
          + etatsLigne()
          + '<div class="ec-avert">⚠ Vous <b>perdez de l\'argent</b> sur cette vente : c\'est le but. Seule une vente <b>à perte stricte</b> compte (un prix coûtant ne compte pas). Les prix bougent : vérifiez le prix de reprise à l\'arrivée, il doit rester inférieur à ce que vous avez payé.</div>'
          + '<div class="ec-s">' + (forte ? 'LA ROUTE À LA PERTE LA PLUS FORTE POUR ' : 'LA ROUTE LA MOINS COÛTEUSE POUR ') + '<b>' + prefs.soute() + ' t</b></div>'
          + carteGrande(best, c);
        h += cartesAutres(autres, c, best, 'AUTRES ROUTES POSSIBLES', '· classées par perte ' + (forte ? 'décroissante' : 'croissante') + ' pour votre soute');
        return h;
    }
    function corps() {
        const d = etat.donnees;
        let h = '';
        if (etat.statut === 'EN_COURS') h += '<div class="ec-bandeau"><span class="ec-spin"></span>MISE À JOUR EN COURS CHEZ ' + (etat.mode === 'contrebande' ? 'SPANSH' : 'SPANSH ET ARDENT') + '…' + (d ? ' (les résultats ci-dessous datent de la dernière recherche)' : '') + '</div>';
        if (etat.statut === 'ERREUR') h += '<div class="ec-bandeau" style="border-color:#e8a35a;color:#e8a35a;">' + E(etat.message || 'Recherche impossible pour le moment.') + '</div>';
        if (!d) {
            if (etat.statut === 'EN_COURS') return h + msg('RECHERCHE EN COURS', 'La base interroge ' + (etat.mode === 'contrebande' ? 'Spansh' : 'Spansh et Ardent (deux bases de prix, recoupées)') + ' pour la première fois sur cette directive (environ 15 à 45 secondes).<br>Le résultat sera ensuite gardé 2 heures pour tout l\'escadron.', true);
            return h + msg('AUCUN RÉSULTAT', 'La recherche n\'a rien donné pour le moment. Réessayez dans quelques minutes.');
        }
        if (etat.mode === 'contrebande') return h + corpsContre(d);
        if (etat.mode === 'perte') return h + corpsPerte(d);
        const dest = d.destinations || [];
        if (!dest.length || !(d.marchandises || []).length) {
            const ages = dest.map(x => ageHeures(x.maj)).filter(x => x !== null), frais = ages.length ? Math.min.apply(null, ages) : null;
            const aide = etat.heures < 4320 && dest.length ? '<br><br>Chez Spansh, le relevé le plus récent d\'une station de ' + E(d.faction || etat.faction) + ' date de <strong style="color:#fff">' + E(ageTxtH(frais).replace(/^il y a /, '')) + '</strong> : personne ne s\'y est amarré depuis.<br><button type="button" class="ec-elargir" onclick="edteamCommerce.fraicheur(4320)">ESSAYER AVEC LES RELEVÉS DE MOINS DE 6 MOIS</button>' : '';
            return h + msg('AUCUNE ROUTE', E(d.faction || etat.faction) + ' n\'a aucune station avec un marché relevé depuis moins de ' + libH(etat.heures) + ' chez Spansh dans ' + E(d.systeme || etat.systeme) + ', ou rien de rentable à acheter à moins de ' + etat.rayon + ' années-lumière avec au moins ' + fmt(etat.stock) + ' t en stock.<br>Essayez un rayon plus grand ou un stock minimal plus faible.' + aide);
        }
        const routes = calculer(d);
        if (!routes.length) {
            return h + msg('AUCUNE ROUTE AVEC CES RÉGLAGES', 'Aucune marchandise ne rapporte avec votre soute, la taille de piste, le type de station' + (etat.retour ? ', un retour rentable' : '') + ' et la fraîcheur choisis.<br>Essayez d\'élargir les relevés (7 jours, 6 mois), de désactiver « Grande piste »' + (etat.retour ? ' ou « Aller-retour »' : '') + ' ou d\'agrandir le rayon.');
        }
        const best = routes[0], autres = routes.slice(1, 7);
        const jv = ageHeures(best.v.maj), vFrais = jv !== null && jv <= 48;
        const nbDest = dest.length;
        h += '<div class="ec-s">DESTINATION <b>· là où vendre fait monter ' + E(d.faction || etat.faction) + '</b></div>'
          + '<div class="ec-dest"><div><div class="lib">STATION DE LA FACTION · LA MIEUX PLACÉE POUR CETTE ROUTE</div><div class="nom">' + cp(best.v.station, String(best.v.station).toUpperCase()) + '</div>'
          + '<div class="sous">' + E(String(d.systeme || etat.systeme).toUpperCase()) + ' · ' + (best.v.planetaire ? 'planétaire' : 'orbitale') + (best.v.grande ? ' · grande piste' : ' · petite piste') + ' · ' + nbDest + ' station' + (nbDest > 1 ? 's' : '') + ' de la faction avec marché dans le système</div></div>'
          + '<div class="ec-fr"><div class="t" title="Barre pleine : relevé à l\'instant. Barre vide : limite de fraîcheur choisie (24 h, 7 jours ou 6 mois).">FRAÎCHEUR DU MARCHÉ</div><div class="b"><i style="width:' + Math.max(4, Math.min(100, jv === null ? 4 : Math.round(100 - jv / etat.heures * 100))) + '%;background:' + (vFrais ? '#00FF66' : 'linear-gradient(90deg,#e8a35a,#c0392b)') + '"></i></div><div class="v" style="color:' + (vFrais ? '#00FF66' : '#e8a35a') + '">' + (vFrais ? '' : '⚠ ') + 'relevé ' + E(ageTxtH(jv)) + (vFrais ? '' : ' — vérifiez à l\'arrivée') + '</div></div></div>';
        h += etatsLigne();
        const c = { mode: 'commerce', sysF: d.systeme || etat.systeme, faction: d.faction || etat.faction, couleur: '#00FF66' };
        h += '<div class="ec-s">LA MEILLEURE ROUTE POUR <b>' + prefs.soute() + ' t</b></div>' + carteGrande(best, c);
        h += cartesAutres(autres, c, best, 'AUTRES ROUTES POSSIBLES', '· la barre compare chaque bénéfice total à celui de la meilleure route');
        return h;
    }
    // sources des prix : Spansh seul, ou Spansh + Ardent recoupes (SQL 137 : pour une meme station, le releve le plus recent des deux est gardé)
    function sourcesPrix() {
        if (etat.mode === 'contrebande') return 'Spansh';
        if (!etat.donnees) return 'Spansh et Ardent';          // recherche en cours : les deux sont interrogés
        const f = etat.donnees.fusion;
        if (!f) return 'Spansh';                                  // resultat garde d'avant le script 137
        return f.ardent ? 'Spansh et Ardent, recoupés (le relevé le plus récent de chaque station est gardé)' : 'Spansh (Ardent n’a pas répondu)';
    }
    function rendre() {
        const o = assurerDom();
        o.innerHTML = '<div class="ec-m' + (etat.mode === 'contrebande' || etat.mode === 'perte' ? ' ec-rouge' : '') + '">' + entete() + reglages() + '<div class="ec-corps">' + corps() + '</div>'
            + '<div class="ec-pied">ⓘ Prix tirés de ' + sourcesPrix() + ' (relevés des joueurs, via EDDN) : ils bougent, vérifiez le marché à l\'arrivée. Plus l\'escadron s\'amarre dans ces stations, plus les relevés sont frais. ' + (etat.mode === 'contrebande' ? 'Routes classées par distance d\'achat (le prix de reprise du marché noir n\'est pas connu).' : etat.mode === 'perte' ? 'Routes classées par perte ' + (prefs.tri() === 'forte' ? 'décroissante' : 'croissante') + ' pour votre soute. La PERTE est le seul chiffre compté pour la directive : le montant de la vente ne compte pas.' : 'Routes classées par bénéfice total pour votre soute')
            + (etat.calc_le ? ' · recherche faite ' + E(ageTxtH(ageHeures(etat.calc_le))) : '') + ' · marchés relevés depuis moins de ' + libH(etat.heures) + '.</div></div>';
        o.style.display = 'flex';
    }

    // ----- lecture serveur (avec relecture automatique pendant une recherche en tâche de fond) -----
    async function charger() {
        const jeton = ++etat.jeton;
        clearTimeout(etat.minuteur);
        const c = db();
        if (!c) { etat.statut = 'ERREUR'; etat.message = 'Connexion indisponible.'; rendre(); return; }
        let r;
        try { r = await c.rpc(etat.mode === 'perte' ? 'routes_perte' : etat.mode === 'contrebande' ? 'routes_contrebande' : 'routes_commerce', { p_ordre: Number(etat.ordre), p_rayon: etat.rayon, p_stock: etat.stock, p_heures: etat.heures, p_demande: etat.demande }); } catch (e) { r = { error: { message: 'Connexion impossible.' } }; }
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
        ouvrir(ordreId, systeme, faction, mode, type) {
            if (typeof sonClic === 'function') sonClic();
            Object.assign(etat, { type: type === 'ELECTION' ? 'ELECTION' : mode === 'commerce' ? 'HAUSSE' : 'BAISSE', mode: mode === 'contrebande' ? 'contrebande' : mode === 'perte' ? 'perte' : 'commerce', ordre: ordreId, systeme: systeme || '', faction: faction || '', donnees: null, statut: 'EN_COURS', message: '', essais: 0, calc_le: null });
            if (!RAYONS.includes(etat.rayon)) etat.rayon = 20;
            if (!STOCKS.includes(etat.stock)) etat.stock = 100;
            if (!DEMANDES.includes(etat.demande)) etat.demande = 0;
            rendre(); charger();
        },
        fermer() { etat.jeton++; clearTimeout(etat.minuteur); const o = document.getElementById('ec-overlay'); if (o) { o.style.display = 'none'; o.innerHTML = ''; } },
        regler(v) { ecrire('edteam_com_soute', String(Math.max(10, Math.min(5000, parseInt(v, 10) || 200)))); rendre(); },
        rayon(v) { if (v === etat.rayon) return; etat.rayon = v; etat.donnees = null; etat.statut = 'EN_COURS'; etat.essais = 0; rendre(); charger(); },
        stock(v) { if (v === etat.stock) return; etat.stock = v; ecrire('edteam_com_stock', String(v)); etat.donnees = null; etat.statut = 'EN_COURS'; etat.essais = 0; rendre(); charger(); },
        demande(v) { if (!DEMANDES.includes(v) || v === etat.demande) return; etat.demande = v; ecrire('edteam_com_dem', String(v)); etat.donnees = null; etat.statut = 'EN_COURS'; etat.essais = 0; rendre(); charger(); },
        lieu(v) { if (!['T', 'O', 'P'].includes(v) || v === etat.lieu) return; etat.lieu = v; ecrire('edteam_com_lieu', v); rendre(); },
        boucle() { etat.retour = !etat.retour; ecrire('edteam_com_ar', etat.retour ? '1' : '0'); rendre(); },
        fraicheur(h) { if (![24, 168, 4320].includes(h) || h === etat.heures) return; etat.heures = h; ecrire('edteam_com_h', String(h)); etat.donnees = null; etat.statut = 'EN_COURS'; etat.essais = 0; rendre(); charger(); },
        bascule(k) { ecrire('edteam_com_grande', prefs.grande() ? '0' : '1'); rendre(); },
        tri(v) { ecrire('edteam_perte_tri', v === 'forte' ? 'forte' : 'faible'); rendre(); },      // classement des routes a perte (calcule ici, sans nouvel appel)
        copie(el, txt, ev) { copier(String(txt), el, ev); },
        // bouton « Où vendre ? » d'une directive de hausse ou d'election en cours ; vide pour les autres
        // mode 'perte' (directive de baisse) : bouton « Où vendre à perte ? » de la ligne des ventes à perte
        bouton(ordre, classe, modeDemande) {
            const type = ordre ? String(ordre.type_ordre || '').toUpperCase() : '';
            if (!ordre || (type !== 'HAUSSE' && type !== 'BAISSE' && type !== 'ELECTION') || String(ordre.statut || 'ACTIF').toUpperCase() !== 'ACTIF') return '';
            const baisse = type === 'BAISSE', perte = baisse && modeDemande === 'perte';
            const arg = [ordre.id, ordre.systeme_cible || '', ordre.faction_cible || '', perte ? 'perte' : baisse ? 'contrebande' : 'commerce', type].map(x => E(JSON.stringify(x)).replace(/&quot;/g, '&#34;')).join(', ');
            if (perte) {
                const padP = classe === 'compact' ? 'padding: 2px 8px; font-size: 0.85em; letter-spacing: 0;' : 'padding: 7px 14px; font-size: 0.8em; letter-spacing: 2px;';
                return '<button type="button" class="' + (classe || '') + '" onclick="event.stopPropagation(); edteamCommerce.ouvrir(' + arg + ')" style="background: rgba(255,159,67,0.1); border: 1px solid #ff9f43; color: #ff9f43; ' + padP + ' font-family: inherit; cursor: pointer; white-space: nowrap; box-shadow: 0 0 10px rgba(255,159,67,0.2);">📉 OÙ VENDRE À PERTE ?</button>';
            }
            const compact = classe === 'compact';
            const pad = compact ? 'padding: 2px 8px; font-size: 0.85em; letter-spacing: 0;' : 'padding: 7px 14px; font-size: 0.8em; letter-spacing: 2px;';
            return '<button type="button" class="' + (classe || '') + '" onclick="event.stopPropagation(); edteamCommerce.ouvrir(' + arg + ')" style="background: ' + (baisse ? 'rgba(255,51,51,0.1); border: 1px solid #FF3333; color: #FF3333' : 'rgba(255,215,0,0.1); border: 1px solid #FFD700; color: #FFD700') + '; ' + pad + ' font-family: inherit; cursor: pointer; white-space: nowrap; box-shadow: 0 0 10px ' + (baisse ? 'rgba(255,51,51,0.2)' : 'rgba(255,215,0,0.2)') + ';">' + (baisse ? (compact ? '🏴 OÙ VENDRE ?' : '🏴 ROUTE DE CONTREBANDE') : '💰 OÙ VENDRE ?') + '</button>';
        }
    };
    window.edteamCommerce = api;
})();
