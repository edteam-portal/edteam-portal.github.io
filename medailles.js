// =====================================================================
// TITRES DE SPECIALISTE : medailles + mur + pastilles de fiche (partage par bgs.html et escadron.html)
// Les titres sont calcules cote serveur (table titres_specialistes, script SQL 37), au cumul total, identiques pour tous.
// Ce fichier ne fait qu'UNE lecture legere (8 lignes au plus), gardee 5 minutes en memoire de session.
// =====================================================================
(function () {
    'use strict';

    // Les 7 titres : chacun mesure dans SON unite (voir supabase_sql/37)
    const TITRES = [
        { code: 'SEC', nom: 'LE FER DE LANCE',     sous: 'SÉCURITÉ',     couleur: '#00F0FF', unite: 'cr',  mesure: 'primes et sécurisation, en crédits cumulés',               desc: "Le pilote qui a rapporté le plus de crédits en primes et en actions de sécurité pour l'escadron." },
        { code: 'LOG', nom: 'MAÎTRE LOGISTICIEN',  sous: 'MISSIONS',     couleur: '#FF7100', unite: 'pts', mesure: "missions accomplies pour la faction", desc: "Le pilote qui a accompli le plus de missions pour la faction de l'escadron." },
        { code: 'ECO', nom: 'LE MAGNAT',           sous: 'ÉCONOMIE',     couleur: '#00FF66', unite: 'cr',  mesure: 'commerce et minage, en crédits cumulés',                   desc: "Le négociant qui a généré le plus de richesse par le commerce et le minage." },
        { code: 'BAT', nom: 'LE BÂTISSEUR',        sous: 'COLONISATION', couleur: '#FFD700', unite: 't',   mesure: 'tonnes livrées sur les chantiers de colonisation',          desc: "Le maître d'œuvre qui a livré le plus gros tonnage de matériaux sur les chantiers de colonisation." },
        { code: 'SCI', nom: "L'EXPERT SCIENTIFIQUE",         sous: 'SCIENCE',      couleur: '#B026FF', unite: 'cr',  mesure: 'cartographie et exobiologie, en crédits cumulés',          desc: "Le pilote qui a rapporté les données de cartographie et d'exobiologie les plus précieuses pour la faction de l'escadron." },
        { code: 'EXE', nom: "L'EXÉCUTEUR",         sous: 'OP. NOIRES',   couleur: '#FF3333', unite: 'ops', mesure: "meurtres, vols, piratages et contrebande contre une autre faction que celle de l'escadron, et missions échouées sous une directive de baisse",    desc: "L'agent des ombres le plus actif contre les factions rivales : meurtres, vols, piratages, contrebande, et missions échouées sous une directive de baisse (10 par jour au plus). Les autres échecs ne comptent pas." },
        { code: 'GUE', nom: 'SEIGNEUR DE GUERRE',  sous: 'CONFLITS',     couleur: '#FF9A3C', unite: 'vict', mesure: 'victoires en zone de conflit',        desc: "Le vétéran qui a remporté le plus de victoires en zone de conflit pour la faction de l'escadron." },
        { code: 'ESP', nom: "L'ESPION",            sous: 'RENSEIGNEMENT', couleur: '#C9D1DB', unite: 'sys', mesure: 'actions de renseignement : systèmes de la liste à repérer actualisés en y sautant, et joueurs scannés (1 action = 1 point BGS)', desc: "L'agent de renseignement de l'escadron : le pilote qui a le plus renseigné l'escadron, en actualisant les systèmes de la liste par ses sauts et en scannant des joueurs. Aucune course : le but est que tous les systèmes soient à jour." },
    ];
    const PAR_CODE = {}; TITRES.forEach(t => { PAR_CODE[t.code] = t; });

    const esc = s => (typeof escapeHtml === 'function') ? escapeHtml(String(s == null ? '' : s)) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    function formater(unite, v) {
        v = Number(v) || 0;
        if (unite === 'cr') {
            if (v >= 1e9) return (v / 1e9).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' Md CR';
            return (v / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' M CR';
        }
        const n = Math.round(v).toLocaleString('fr-FR');
        return unite === 'sys' ? n + (v > 1 ? ' actions' : ' action') : unite === 't' ? n + ' t' : unite === 'vict' ? n + (v > 1 ? ' victoires' : ' victoire') : unite === 'ops' ? n + (v > 1 ? ' opérations' : ' opération') : n + (v > 1 ? ' pts' : ' pt');
    }

    // ---------- MEDAILLE VECTORIELLE (aucune image, aucune requete) ----------
    // Les degrades sont definis UNE SEULE FOIS par page (un <svg> cache), les medailles s'y referent : moins d'octets, aucun appel reseau.
    function assurerDefs() {
        if (document.getElementById('medailles-defs')) return;
        const d = document.createElement('div');
        d.id = 'medailles-defs';
        d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
        d.innerHTML = `<svg width="0" height="0" aria-hidden="true"><defs>
            <linearGradient id="gradOr" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFF1A8"/><stop offset="35%" stop-color="#E6B422"/><stop offset="70%" stop-color="#9A6B05"/><stop offset="100%" stop-color="#5C4305"/></linearGradient>
            <linearGradient id="gradTitane" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F4F7FA"/><stop offset="40%" stop-color="#9fb0bf"/><stop offset="100%" stop-color="#3f4c6b"/></linearGradient>
            <linearGradient id="gradBronze" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffc56b"/><stop offset="45%" stop-color="#cd7f32"/><stop offset="100%" stop-color="#4a2511"/></linearGradient>
            <linearGradient id="gradPlatine" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="45%" stop-color="#B0C4DE"/><stop offset="100%" stop-color="#6a7a8c"/></linearGradient>
            <linearGradient id="gradNoir" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4b4e57"/><stop offset="45%" stop-color="#14151a"/><stop offset="100%" stop-color="#000000"/></linearGradient>
            <linearGradient id="gradSombre" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6a6a6a"/><stop offset="50%" stop-color="#262626"/><stop offset="100%" stop-color="#050505"/></linearGradient>
            <linearGradient id="gradAcier" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#C8CED3"/><stop offset="50%" stop-color="#6f7479"/><stop offset="100%" stop-color="#2F4F4F"/></linearGradient>
            <linearGradient id="gradRim" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="45%" stop-color="#8a8a8a"/><stop offset="100%" stop-color="#000000"/></linearGradient>
            <linearGradient id="gradRimInv" x1="100%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/><stop offset="55%" stop-color="#2a2a2a"/><stop offset="100%" stop-color="#000000"/></linearGradient>
            <radialGradient id="gradDish" cx="38%" cy="32%" r="85%"><stop offset="0%" stop-color="#3a3f47"/><stop offset="55%" stop-color="#14171c"/><stop offset="100%" stop-color="#050607"/></radialGradient>
            <radialGradient id="gradShine" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
            <linearGradient id="gradRubanOmbre" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#000" stop-opacity="0.45"/><stop offset="35%" stop-color="#fff" stop-opacity="0.18"/><stop offset="65%" stop-color="#000" stop-opacity="0.05"/><stop offset="100%" stop-color="#000" stop-opacity="0.5"/></linearGradient>
            ${Object.keys(TONS).concat(['V']).map(k => { const t = k === 'V' ? TON_VACANT : TONS[k]; return '<linearGradient id="gT_' + k + '" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="' + t[0] + '"/><stop offset="45%" stop-color="' + t[1] + '"/><stop offset="100%" stop-color="' + t[2] + '"/></linearGradient><radialGradient id="gT_' + k + 'i" cx="38%" cy="32%" r="85%"><stop offset="0%" stop-color="' + mixHex(t[0], t[1], .35) + '"/><stop offset="100%" stop-color="' + mixHex(t[1], t[2], .55) + '"/></radialGradient>'; }).join('')}
            <pattern id="medTissu" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height=".9" fill="#fff" opacity=".16"/><rect y="1.5" width="3" height=".7" fill="#000" opacity=".22"/></pattern>
            <filter id="medRelief" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur in="SourceAlpha" stdDeviation=".55" result="b"/><feDiffuseLighting in="b" surfaceScale="2.2" diffuseConstant="1.1" lighting-color="#ffffff" result="d"><feDistantLight azimuth="225" elevation="48"/></feDiffuseLighting><feComposite in="SourceGraphic" in2="d" operator="arithmetic" k1="1.35" k2="0" k3="0" k4="0" result="m"/><feComposite in="m" in2="SourceAlpha" operator="in"/></filter>
            <filter id="glowMedal"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs></svg>`;
        document.body.appendChild(d);
    }

    // Couronne de lauriers : 2 x 7 feuilles calculees (aucune image)
    function lauriers(couleur) {
        let f = '';
        for (let i = 0; i < 7; i++) {
            const th = (28 + i * 17) * Math.PI / 180;           // 0 = bas de la medaille, on monte sur les cotes
            [-1, 1].forEach(sens => {
                const x = 50 + sens * 27 * Math.sin(th), y = 60 + 27 * Math.cos(th);
                const tang = Math.atan2(-Math.sin(th), sens * Math.cos(th)) * 180 / Math.PI + sens * 28;
                f += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="4.4" ry="1.9" transform="rotate(${tang.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${couleur}" opacity="0.85"/>`;
            });
        }
        return f;
    }

    // teintes du métal de chaque titre : [clair, moyen, foncé] (mêmes familles que les médailles FRÈRES D'ARMES)
    const TONS = {
        SEC: ['#F4F7FA', '#9fb0bf', '#3f4c6b'], LOG: ['#ffc56b', '#cd7f32', '#4a2511'], ECO: ['#FFF1A8', '#E6B422', '#5C4305'], SCI: ['#FFFFFF', '#B0C4DE', '#6a7a8c'],
        EXE: ['#8a8a8a', '#3a3a3a', '#050505'], GUE: ['#C8CED3', '#6f7479', '#2F4F4F'], BAT: ['#FFF1A8', '#E6B422', '#5C4305'], ESP: ['#7a7e88', '#2a2c33', '#000000']
    };
    const TON_VACANT = ['#8a8a8a', '#555555', '#222222'];
    function mixHex(a, b, t) { const p = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)), x = p(a), y = p(b); return '#' + x.map((v, i) => { const c = Math.round(v + (y[i] - v) * t); return (c < 16 ? '0' : '') + c.toString(16); }).join(''); }

    // vacant = true : version grisee, sans aura
    window.forgerMedailleSVG = function (type, couleurAura, vacant) {
        assurerDefs();
        let grad = '', ribbon = '', icone = '';
        if (type === 'SEC') { grad = 'gradTitane'; ribbon = '#00B8D4'; icone = '<path d="M35,45 L65,45 L65,65 C65,75 50,85 50,85 C50,85 35,75 35,65 Z" fill="url(#gradTitane)" stroke="#111" stroke-width="2"/><path d="M50,48 L50,80 C42,75 38,69 38,64 L38,48 Z" fill="#fff" opacity="0.18"/>'; }
        else if (type === 'LOG') { grad = 'gradBronze'; ribbon = '#E65C00'; icone = '<polygon points="50,45 65,52 65,68 50,75 35,68 35,52" fill="none" stroke="url(#gradBronze)" stroke-width="4"/><polyline points="35,52 50,60 65,52" stroke="url(#gradBronze)" stroke-width="4" fill="none"/><line x1="50" y1="60" x2="50" y2="75" stroke="url(#gradBronze)" stroke-width="4"/>'; }
        else if (type === 'ECO') { grad = 'gradOr'; ribbon = '#00B84A'; icone = '<circle cx="50" cy="60" r="14" fill="none" stroke="url(#gradOr)" stroke-width="4"/><path d="M50,42 L50,78 M45,60 L55,60" stroke="url(#gradOr)" stroke-width="3"/>'; }
        else if (type === 'SCI') { grad = 'gradPlatine'; ribbon = '#8E1FD6'; icone = '<ellipse cx="50" cy="60" rx="18" ry="6" transform="rotate(45 50 60)" fill="none" stroke="url(#gradPlatine)" stroke-width="3"/><ellipse cx="50" cy="60" rx="18" ry="6" transform="rotate(-45 50 60)" fill="none" stroke="url(#gradPlatine)" stroke-width="3"/><circle cx="50" cy="60" r="4" fill="#B026FF" filter="url(#glowMedal)"/>'; }
        else if (type === 'EXE') { grad = 'gradSombre'; ribbon = '#C41E1E'; icone = '<circle cx="50" cy="60" r="14" fill="none" stroke="#FF3333" stroke-width="3"/><line x1="50" y1="38" x2="50" y2="46" stroke="#FF3333" stroke-width="3"/><line x1="50" y1="74" x2="50" y2="82" stroke="#FF3333" stroke-width="3"/><line x1="28" y1="60" x2="36" y2="60" stroke="#FF3333" stroke-width="3"/><line x1="64" y1="60" x2="72" y2="60" stroke="#FF3333" stroke-width="3"/>'; }
        else if (type === 'GUE') { grad = 'gradAcier'; ribbon = '#E8740C'; icone = '<line x1="38" y1="48" x2="62" y2="72" stroke="url(#gradAcier)" stroke-width="5" stroke-linecap="round"/><line x1="62" y1="48" x2="38" y2="72" stroke="url(#gradAcier)" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="60" r="4" fill="#FF7100" filter="url(#glowMedal)"/>'; }
        else if (type === 'BAT') { grad = 'gradOr'; ribbon = '#D9A800'; icone = '<polygon points="50,40 68,50 68,70 50,80 32,70 32,50" fill="none" stroke="url(#gradOr)" stroke-width="3"/><path d="M50,40 L50,80 M32,50 L68,70 M32,70 L68,50" stroke="url(#gradOr)" stroke-width="2"/>'; }
        else if (type === 'ESP') { grad = 'gradNoir'; ribbon = '#2a2b33'; icone = '<path d="M28,60 Q50,41 72,60 Q50,79 28,60 Z" fill="none" stroke="#E6EAF0" stroke-width="3"/><circle cx="50" cy="60" r="7.5" fill="#E6EAF0"/><circle cx="50" cy="60" r="3" fill="#000"/><line x1="50" y1="40" x2="50" y2="46" stroke="#E6EAF0" stroke-width="2.2" stroke-linecap="round"/>'; }
        // ----- NOUVEAU RENDU (statique : aucune animation) : bord crénelé, couronne de métal facetté gravée du nom du titre, lauriers sculptés, cuvette sous dôme de verre, icône en relief, bélière à cabochon -----
        const T = vacant ? TON_VACANT : (TONS[type] || TON_VACANT), K = vacant ? 'V' : type, fx = v => v.toFixed(1);
        const uid = 'mt' + Math.random().toString(36).substring(2, 7), tit = PAR_CODE[type];
        const col = vacant ? '#555555' : couleurAura;
        let dents = '';
        for (let i = 0; i < 56; i++) { const a = -Math.PI / 2 + 2 * Math.PI * i / 56, r = i % 2 ? 37.4 : 39.7; dents += `${fx(50 + r * Math.cos(a))},${fx(60 + r * Math.sin(a))} `; }
        let couronne = '';
        for (let i = 0; i < 36; i++) {
            const a0 = -Math.PI / 2 + 2 * Math.PI * i / 36, a1 = -Math.PI / 2 + 2 * Math.PI * (i + 1) / 36;
            const tt = (Math.sin(i * 2 * Math.PI / 36 * 2 + 0.7) + 1) / 2 * (0.65 + 0.35 * Math.sin(i * 0.9 + 1));
            couronne += `<polygon points="${fx(50 + 37.6 * Math.cos(a0))},${fx(60 + 37.6 * Math.sin(a0))} ${fx(50 + 37.6 * Math.cos(a1))},${fx(60 + 37.6 * Math.sin(a1))} ${fx(50 + 31.5 * Math.cos(a1))},${fx(60 + 31.5 * Math.sin(a1))} ${fx(50 + 31.5 * Math.cos(a0))},${fx(60 + 31.5 * Math.sin(a0))}" fill="${mixHex(T[2], T[0], tt)}"/>`;
        }
        // lauriers de métal : 2 x 7 feuilles avec nervure
        let lau = '';
        for (let i = 0; i < 7; i++) {
            const th = (28 + i * 17) * Math.PI / 180;
            [-1, 1].forEach(sens => {
                const x = 50 + sens * 26.4 * Math.sin(th), y = 60 + 26.4 * Math.cos(th);
                const tang = Math.atan2(-Math.sin(th), sens * Math.cos(th)) * 180 / Math.PI + sens * 28;
                lau += `<g transform="rotate(${tang.toFixed(0)} ${fx(x)} ${fx(y)})"><ellipse cx="${fx(x + .35)}" cy="${fx(y + .5)}" rx="4.6" ry="2" fill="#000" opacity=".5"/><ellipse cx="${fx(x)}" cy="${fx(y)}" rx="4.6" ry="2" fill="url(#gT_${K})" stroke="#000" stroke-opacity=".55" stroke-width=".35"/><line x1="${fx(x - 3.6)}" y1="${fx(y)}" x2="${fx(x + 3.6)}" y2="${fx(y)}" stroke="#000" stroke-opacity=".45" stroke-width=".3"/></g>`;
            });
        }
        const sombre = type === 'EXE' || type === 'ESP';
        const nomHaut = vacant ? 'TITRE VACANT' : (tit ? tit.nom : ''), nomBas = vacant ? '' : (tit ? tit.sous : '');
        const gravure = (chemin, texte) => `<text font-family="'Share Tech Mono', monospace" font-size="3.7" font-weight="bold" letter-spacing="1.1" text-anchor="middle"><textPath href="#${chemin}" startOffset="50%" fill="${sombre ? '#000' : '#fff'}" fill-opacity="${sombre ? .9 : .55}" dy=".28">${esc(texte)}</textPath></text><text font-family="'Share Tech Mono', monospace" font-size="3.7" font-weight="bold" letter-spacing="1.1" text-anchor="middle"><textPath href="#${chemin}" startOffset="50%" fill="${sombre ? '#fff' : '#000'}" fill-opacity="${sombre ? .8 : .72}">${esc(texte)}</textPath></text>`;
        const aura = vacant ? '' : `<circle cx="50" cy="60" r="21" fill="none" stroke="${couleurAura}" stroke-width="1.4" opacity="0.7" filter="url(#glowMedal)"/>`;
        const style = vacant ? 'opacity: 0.32; filter: grayscale(1) drop-shadow(0 3px 4px rgba(0,0,0,0.8));' : 'filter: drop-shadow(0 5px 6px rgba(0,0,0,0.85));';
        const rub = vacant ? '#3a3a3a' : ribbon;
        return `
        <svg viewBox="0 0 100 100" style="width: 100%; height: 100%; ${style}">
            <defs><path id="${uid}h" d="M17.2,60 A32.8,32.8 0 0 1 82.8,60"/><path id="${uid}b" d="M14.6,60 A35.4,35.4 0 0 0 85.4,60"/></defs>
            <path d="M30,0 L52,0 L52,34 L41,41 L30,34 Z" fill="${rub}"/>
            <path d="M48,0 L70,0 L70,34 L59,41 L48,34 Z" fill="${rub}"/>
            <path d="M30,0 L70,0 L70,34 L59,41 L48,34 L41,41 L30,34 Z" fill="url(#medTissu)"/>
            <path d="M30,0 L70,0 L70,34 L59,41 L48,34 L41,41 L30,34 Z" fill="url(#gradRubanOmbre)"/>
            <line x1="41" y1="0" x2="41" y2="38" stroke="#000" stroke-width="0.6" opacity="0.35"/><line x1="59" y1="0" x2="59" y2="38" stroke="#000" stroke-width="0.6" opacity="0.35"/>
            <path d="M32,0V32M68,0V32" stroke="#fff" stroke-width=".5" stroke-dasharray="1.6 1.4" opacity=".28"/>
            <path d="M25,15.2 L28,11.4 H72 L75,15.2 L72,19.4 H28 Z" fill="#000" opacity=".5" transform="translate(.5 1)"/><path d="M25,15.2 L28,11.4 H72 L75,15.2 L72,19.4 H28 Z" fill="url(#gT_${K})" stroke="#000" stroke-opacity=".65" stroke-width=".6"/><path d="M28,12.3 H72" stroke="#fff" stroke-opacity=".6" stroke-width=".7"/>
            <circle cx="29.2" cy="15.4" r="1" fill="#000" opacity=".55"/><circle cx="70.8" cy="15.4" r="1" fill="#000" opacity=".55"/>
            <polygon points="50,9.4 56.4,15.4 50,21.4 43.6,15.4" fill="#000" opacity=".5" transform="translate(.4 .7)"/><polygon points="50,9.4 56.4,15.4 50,21.4 43.6,15.4" fill="${col}" stroke="#000" stroke-opacity=".7" stroke-width=".6"/><polygon points="50,9.4 56.4,15.4 50,15.4" fill="#fff" opacity=".42"/><polygon points="50,21.4 43.6,15.4 50,15.4" fill="#000" opacity=".28"/>
            <polygon points="${dents}" fill="#000" opacity=".45" transform="translate(.5 1)"/>
            <polygon points="${dents}" fill="url(#gT_${K})" stroke="#000" stroke-opacity=".6" stroke-width=".5" stroke-linejoin="round"/>
            ${couronne}
            <circle cx="50" cy="60" r="37.5" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".6"/>
            ${gravure(uid + 'h', nomHaut)}${gravure(uid + 'b', nomBas)}
            <circle cx="50" cy="60" r="31.5" fill="none" stroke="#000" stroke-opacity=".75" stroke-width=".9"/>
            <circle cx="50" cy="60" r="30.6" fill="url(#gT_${K}i)"/>
            <circle cx="50" cy="60" r="30.6" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width=".5"/>
            <circle cx="50" cy="60" r="29.1" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="1.6"/><circle cx="50" cy="60" r="29.1" fill="none" stroke="${col}" stroke-width="1" opacity=".9"/>
            ${lau}
            <circle cx="50" cy="60" r="24.4" fill="#000" opacity=".5"/>
            <circle cx="50" cy="60" r="23.4" fill="url(#gT_${K})"/>
            <circle cx="50" cy="60" r="21.6" fill="url(#gradDish)"/>
            <circle cx="50" cy="60" r="21.6" fill="none" stroke="#000" stroke-opacity=".8" stroke-width="1"/>
            ${aura}
            <g opacity=".6" transform="translate(.9 1.3)" style="filter: brightness(0);">${icone}</g>
            <g filter="url(#medRelief)">${icone}</g>
            <ellipse cx="42" cy="48" rx="14" ry="6.4" transform="rotate(-28 42 48)" fill="url(#gradShine)" opacity="${vacant ? 0 : .5}"/>
            <path d="M21.5,54 A30.6,30.6 0 0 1 46,29.8" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="${vacant ? 0 : .4}"/><path d="M83,68 A35,35 0 0 1 55,94" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" opacity="${vacant ? 0 : .3}"/>
            ${vacant ? '' : '<path d="M20,34 l1.1,3.3 3.3,1.1 -3.3,1.1 -1.1,3.3 -1.1,-3.3 -3.3,-1.1 3.3,-1.1z" fill="#fff" opacity=".9"/>'}
        </svg>`;
    };

    // ---------- LECTURE (une requete legere, 15 minutes de memoire de session) ----------
    window.chargerTitresSpecialistes = async function (escadronId, force) {
        const cle = 'edteam_titres2_' + (escadronId || 'x');
        try {
            const c = JSON.parse(sessionStorage.getItem(cle) || 'null');
            if (!force && c && Date.now() - c.ts < 900000) return c.data;
        } catch (e) { /* memoire de session indisponible : on lit simplement */ }
        const data = {};
        try {
            if (!escadronId) return null;
            // le Directeur peut lire les titres de TOUS les escadrons : on ne garde que ceux de l'escadron affiche
            const { data: rows, error } = await supabaseApp.from('titres_specialistes').select('code, user_id, cmdr_nom, valeur, second_nom, second_valeur, depuis').eq('escadron_id', escadronId);
            if (error) throw error;
            (rows || []).forEach(r => { data[r.code] = r; });
            try { sessionStorage.setItem(cle, JSON.stringify({ ts: Date.now(), data })); } catch (e) { /* ignore */ }
        } catch (e) {
            // table absente (script SQL 37 pas encore lance) ou refus : le mur est simplement masque
            return null;
        }
        return data;
    };

    // ---------- INFO-BULLE ----------
    function infoBulle(t, r) {
        const l = [];
        l.push(`<strong style='color:${t.couleur}; font-size:1.1em; letter-spacing:1px;'>${esc(t.nom)}</strong>`);
        l.push(`<span style='color:#ccc; font-size:0.9em; display:block; width:290px; white-space:normal; margin-top:6px; line-height:1.4; text-transform:none;'>${esc(t.desc)}`);
        l.push(`<br><span style='color:#888;'>Mesuré en : ${esc(t.mesure)}. Cumul total depuis le début des relevés.</span>`);
        if (r) {
            l.push(`<br><b style='color:${t.couleur};'>${esc(r.cmdr_nom)}</b> : ${esc(formater(t.unite, r.valeur))}`);
            if (r.second_nom) l.push(`<br><span style='color:#aaa;'>Suit : ${esc(r.second_nom)}, ${esc(formater(t.unite, r.second_valeur))} (retard de ${esc(formater(t.unite, Math.max(0, r.valeur - r.second_valeur)))})</span>`);
            l.push(`<br><span style='color:#777;'>Le titre change de main dès qu'un autre pilote dépasse le titulaire de plus de 2 %.</span>`);
        } else {
            l.push(`<br><b style='color:#aaa;'>Titre vacant</b> : personne n'a encore d'activité dans cette catégorie.`);
        }
        l.push('</span>');
        return l.join('');
    }

    function brancherBulles(racine) {
        racine.querySelectorAll('[data-titre-tip]').forEach(el => {
            if (el.dataset.bulleOk) return;
            el.dataset.bulleOk = '1';
            const html = el.getAttribute('data-titre-tip'), col = el.getAttribute('data-titre-col');
            el.addEventListener('mouseenter', ev => { if (typeof showHoloTooltip === 'function') showHoloTooltip(ev, html, col); });
            el.addEventListener('mousemove', ev => { if (typeof moveHoloTooltip === 'function') moveHoloTooltip(ev); });
            el.addEventListener('mouseleave', () => { if (typeof hideHoloTooltip === 'function') hideHoloTooltip(); });
        });
    }

    // ---------- LE MUR (accueil BGS) : 8 cartes, titulaire + cumul + avance sur le second ----------
    window.htmlMurTitres = function (data, monId) {
        memoriser(data);
        const P = window.EDTEAMPhotos;
        // adresse sure dans un url('...') : ni apostrophe ni parenthese
        const photoDe = r => { const u = (P && r) ? P.url(r.user_id, r.cmdr_nom) : ''; return u ? u.replace(/'/g, '%27').split('(').join('%28').split(')').join('%29') : ''; };
        const unePhoto = !!P;   // photos.js charge : le mur est toujours en mode photo ; sans photo, les initiales du titulaire montrent qu'il en manque une
        const ini = n => P ? P.initiales(n) : '?';
        const cartes = TITRES.map(t => {
            const r = data[t.code];
            const ph = photoDe(r);
            const tip = esc(infoBulle(t, r));
            const moi = r && monId && r.user_id === monId;
            const base = `<div class="titre-carte${r ? '' : ' vacant'}${moi ? ' moi' : ''}" style="--tc: ${t.couleur};" data-titre-tip="${tip}" data-titre-col="${t.couleur}" data-titre-code="${t.code}">`;
            if (!r) {
                return `${base}
                    ${unePhoto ? '<div class="titre-fantome">' + window.forgerMedailleSVG(t.code, t.couleur, true) + '</div>' : ''}
                    <div class="titre-medaille">${window.forgerMedailleSVG(t.code, t.couleur, true)}</div>
                    <div class="titre-nom">${esc(t.nom)}</div><div class="titre-sous">${esc(t.sous)}</div>
                    <div class="titre-pilote vide">VACANT</div></div>`;
            }
            const avance = r.second_nom ? `+${esc(formater(t.unite, Math.max(0, r.valeur - r.second_valeur)))} <span>sur ${esc(String(r.second_nom).toUpperCase())}</span>` : '<span>seul en lice</span>';
            return `${base}
                ${ph ? '<div class="titre-fond" style="background-image:url(\'' + esc(ph) + '\')"></div><div class="titre-voile"></div>' : (unePhoto ? '<div class="titre-fond sans"><span class="titre-ini">' + esc(ini(r.cmdr_nom)) + '</span></div><div class="titre-voile"></div>' : '')}
                <div class="titre-medaille">${window.forgerMedailleSVG(t.code, t.couleur)}</div>
                <div class="titre-nom">${esc(t.nom)}</div><div class="titre-sous">${esc(t.sous)}</div>
                <div class="titre-pilote" style="border-bottom-color: ${t.couleur};">${esc(String(r.cmdr_nom).toUpperCase())}</div>
                <div class="titre-total">${esc(formater(t.unite, r.valeur))}</div>
                <div class="titre-avance">${avance}</div></div>`;
        }).join('');
        return `<div class="titres-grille${unePhoto ? ' avec-photos' : ''}">${cartes}</div>`;
    };

    // BANDEAU « LES TITRES DE L'ESCADRON » (QG et accueil mobile) : les 8 médailles, avec le visage du titulaire dessous ; chaque cellule ouvre la loupe
    window.htmlBandeauTitres = function (data, monId) {
        memoriser(data);
        const P = window.EDTEAMPhotos;
        const cellules = TITRES.map(t => {
            const r = data && data[t.code];
            const url = (P && r) ? String(P.url(r.user_id, r.cmdr_nom) || '').replace(/'/g, '%27').split('(').join('%28').split(')').join('%29') : '';
            const av = r ? '<span class="tb-av" style="' + (url ? "background-image:url('" + esc(url) + "')" : '') + '">' + (url ? '' : esc(P ? P.initiales(r.cmdr_nom) : '?')) + '</span>' : '<span class="tb-av vide"></span>';
            const moi = r && monId && r.user_id === monId;
            return '<div class="tb-cell' + (r ? '' : ' vacant') + (moi ? ' moi' : '') + '" style="--tc: ' + t.couleur + ';" data-titre-tip="' + esc(infoBulle(t, r)) + '" data-titre-col="' + t.couleur + '" data-titre-code="' + t.code + '">'
                + '<div class="tb-med">' + window.forgerMedailleSVG(t.code, t.couleur, !r) + '</div>'
                + '<div class="tb-pil">' + av + '<b>' + (r ? esc(String(r.cmdr_nom).toUpperCase()) : 'VACANT') + '</b></div></div>';
        }).join('');
        return '<div class="tb-cap">&gt; LES TITRES DE L\u2019ESCADRON <small>cliquez sur une médaille</small></div><div class="tb-grille">' + cellules + '</div>';
    };

    // couleurs des titres détenus par un pilote (premier = le plus récent dans l'ordre du mur)
    window.couleursTitresPilote = function (data, userId) { return TITRES.filter(t => data && data[t.code] && String(data[t.code].user_id) === String(userId)).map(t => t.couleur); };

    // ---------- PASTILLES DE FICHE PILOTE : les titres que CE pilote detient ----------
    window.htmlTitresPilote = function (data, userId, taille) {
        memoriser(data);
        taille = taille || 45;
        return TITRES.filter(t => data[t.code] && String(data[t.code].user_id) === String(userId)).map(t => {
            const tip = esc(infoBulle(t, data[t.code]));
            return `<div class="titre-pastille" style="width: ${taille}px; height: ${taille}px; cursor: help; transition: 0.2s;" data-titre-tip="${tip}" data-titre-col="${t.couleur}" data-titre-code="${t.code}" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">${window.forgerMedailleSVG(t.code, t.couleur)}</div>`;
        }).join('');
    };

    // Titres detenus par un pilote, avec leur nom, la duree de detention et la valeur (bandeau de la fiche pilote)
    window.htmlTitresPiloteDetail = function (data, userId) {
        memoriser(data);
        return TITRES.filter(t => data[t.code] && String(data[t.code].user_id) === String(userId)).map(t => {
            const r = data[t.code];
            const jours = Math.max(0, Math.floor((Date.now() - Date.parse(r.depuis)) / 86400000));
            const depuis = isNaN(jours) ? '' : 'titulaire depuis ' + jours + ' j · ';
            return `<div class="titre-detail" data-titre-tip="${esc(infoBulle(t, r))}" data-titre-col="${t.couleur}" data-titre-code="${t.code}">
                <div class="titre-detail-med">${window.forgerMedailleSVG(t.code, t.couleur)}</div>
                <div><b style="color: ${t.couleur};">${esc(t.nom)}</b><small>${depuis}${esc(formater(t.unite, r.valeur))}</small></div>
            </div>`;
        }).join('');
    };

    // Journal des exploits : les actions de MEME TYPE d'un meme pilote faites a moins de 5 minutes l'une de l'autre sont presentees sur UNE ligne, valeurs additionnees
    // (ex. 5 ventes de marchandises = la somme des CR). Seul l'affichage change : la valeur de la ligne regroupee est la SOMME, donc les points de la colonne RANG BGS sont ceux de la somme.
    //  - actions repetitives (MEURTRES, PIRATAGE, ECHECS : 1 point chacune) : meme regle que les autres (5 minutes entre deux actions) mais lignes comptees en nombre d'actions, sans limite (avant 25/10 : 5 par ligne, pause de 30 min) ;
    //  - renseignement (RENSEIGNEMENT, SCAN_JOUEUR, MAJ_DONNEE) : 5 par ligne, 5 minutes entre deux actions, systemes differents reunis (la ligne indique « N systemes ») ;
    //  - autres actions (economie, securite, science, missions, victoires, vols, contrebande) : meme directive (ou soutien libre), meme faction et meme systeme, 5 minutes entre deux actions, sans limite de nombre.
    // La colonisation (une ligne par livraison, details propres) et les lignes du Powerplay ne sont pas regroupees. Champ ajoute : regroupe (nombre d'actions reunies).
    // Entree et sortie : lignes du journal triees de la plus recente a la plus ancienne.
    window.regrouperRafalesJournal = function (lignes, taille) {
        const N = taille || 5, PAUSE = 5 * 60000;
        const RAFALE = { MEURTRES: 1, PIRATAGE: 1, ECHECS: 1 }, ESPION = { RENSEIGNEMENT: 1, SCAN_JOUEUR: 1, MAJ_DONNEE: 1 },
              GENERAL = { ECONOMIE: 1, SECURITE: 1, SCIENCE: 1, CONTREBANDE: 1, VENTE_PERTE: 1, MISSIONS: 1, ELECTION_MISSIONS: 1, GUERRE_MISSIONS: 1, CZ_VICTOIRES: 1, VOLS: 1 };
        const ts = e => { const t = new Date(String(e.date_action || '').replace(' ', 'T')).getTime(); return isNaN(t) ? 0 : t; };
        const sortie = [], ouverts = {}, venteDe = e => { const m = /Vente\s*:\s*(\d+)/.exec(String(e.details || '')); return m ? Number(m[1]) : 0; };
        const fermer = c => {
            const r = Object.assign({}, c.derniere, { valeur: c.somme, regroupe: c.n, date_action: c.derniere.date_action });
            if (c.espion && c.n > 1) {
                const sys = Object.keys(c.systemes);
                if (sys.length > 1) r.systeme = sys.length + ' SYSTÈMES';
                if (c.derniere.type_action === 'MAJ_DONNEE') r.details = Object.keys(c.kinds).join(' · ');
                else if (c.derniere.type_action === 'SCAN_JOUEUR') { const j = Object.keys(c.noms); r.details = j.slice(0, 3).join(', ') + (j.length > 3 ? ' +' + (j.length - 3) : ''); }
            }
            if (c.derniere.type_action === 'ECONOMIE' && c.vente > 0) r.details = 'Vente : ' + Math.round(c.vente) + ' CR';   // total des ventes reunies (le benefice est dans valeur)
            sortie.push(r);
        };
        lignes.slice().sort((a, b) => ts(a) - ts(b)).forEach(e => {
            const T = e.type_action, rafale = !!RAFALE[T], espion = !!ESPION[T];
            if (!rafale && !espion && !GENERAL[T]) { sortie.push(e); return; }
            const cle = (espion ? [e.user_id, T] : [e.user_id, T, e.ordre_id || '', e.faction || '', e.systeme || '']).join('|'), t = ts(e), v = Number(e.valeur) || (rafale ? 1 : 0);
            let c = ouverts[cle];
            if (c && t - c.t > PAUSE) { fermer(c); c = null; }
            if (!c) c = ouverts[cle] = { somme: 0, n: 0, t: t, derniere: e, espion: espion, systemes: {}, kinds: {}, noms: {}, vente: 0 };
            c.somme += v; c.vente += venteDe(e); c.n += 1; c.t = t; c.derniere = e;
            if (espion) {
                c.systemes[String(e.systeme || '')] = 1;
                String(e.details || '').split(' · ').forEach(k => { if (k) c.kinds[k] = 1; });
                if (T === 'SCAN_JOUEUR') c.noms[String(e.details || '').split(' · ')[0].replace(/^CMDR /i, '')] = 1;
            }
            if (espion && c.n >= N) { fermer(c); delete ouverts[cle]; }
        });
        Object.keys(ouverts).forEach(k => fermer(ouverts[k]));
        return sortie.sort((a, b) => ts(b) - ts(a));
    };

    // Specialite d'une action BGS = le titre que cette action fait progresser (meme correspondance que le calcul serveur des titres) ;
    // sert a colorer le journal des exploits (PC et mobile). Un echec ne fait progresser aucun titre : gris neutre.
    const SPEC_DE_ACTION = { SECURITE: 'SEC', MISSIONS: 'LOG', ELECTION_MISSIONS: 'LOG', GUERRE_MISSIONS: 'LOG', ECONOMIE: 'ECO', COLONISATION: 'BAT', SCIENCE: 'SCI',
                             MEURTRES: 'EXE', VOLS: 'EXE', PIRATAGE: 'EXE', CONTREBANDE: 'EXE', VENTE_PERTE: 'EXE', CZ_VICTOIRES: 'GUE', RENSEIGNEMENT: 'ESP', SCAN_JOUEUR: 'ESP', MAJ_DONNEE: 'ESP' };
    window.specialiteAction = function (type, typeOrdre) {
        const T = String(type || '').toUpperCase();
        // un echec n'a pas de specialite, SAUF sous une directive de BAISSE (action offensive : script SQL 66)
        const code = (T === 'ECHECS' && String(typeOrdre || '').toUpperCase() === 'BAISSE') ? 'EXE' : SPEC_DE_ACTION[T];
        const t = PAR_CODE[code];
        return t ? { code: t.code, nom: t.sous, couleur: t.couleur } : { code: '', nom: '', couleur: '#8a8f98' };
    };
    window.titreMeta = function (code) { return PAR_CODE[code] || null; };
    window.formaterTitre = function (code, v) { return PAR_CODE[code] ? formater(PAR_CODE[code].unite, v) : String(v); };

    window.brancherTitresSpecialistes = brancherBulles;

    // ---------- LOUPE : une médaille de titre en grand, avec son titulaire (clic sur le mur, sur une pastille de fiche ou sur un titre du détail) ----------
    const MEMO = {};
    function memoriser(data) { Object.keys(data || {}).forEach(k => { MEMO[k] = data[k]; }); }
    function fermerTitre() { const o = document.getElementById('mt-fond'); if (o) o.remove(); document.removeEventListener('keydown', toucheTitre, true); }
    function toucheTitre(e) { if (e.key === 'Escape') { e.stopPropagation(); fermerTitre(); } }
    function ouvrirMedailleTitre(code) {
        const t = PAR_CODE[code]; if (!t) return;
        fermerTitre();
        const r = MEMO[code] || null, P = window.EDTEAMPhotos;
        const taille = Math.max(190, Math.min(360, window.innerHeight - 300, window.innerWidth - 90));
        let titulaire = '<div class="mt-vac">TITRE VACANT<small>Personne n’a encore d’activité dans cette catégorie.</small></div>';
        if (r) {
            const url = P ? String(P.url(r.user_id, r.cmdr_nom) || '').replace(/'/g, '%27').split('(').join('%28').split(')').join('%29') : '';
            const ini = P ? P.initiales(r.cmdr_nom) : '?';
            const jours = Math.max(0, Math.floor((Date.now() - Date.parse(r.depuis)) / 86400000));
            titulaire = '<div class="mt-tit"><div class="mt-av" style="' + (url ? "background-image:url('" + esc(url) + "')" : '') + '">' + (url ? '' : esc(ini)) + '</div>'
                + '<div><div class="mt-pil">' + esc(String(r.cmdr_nom).toUpperCase()) + '</div><div class="mt-val">' + esc(formater(t.unite, r.valeur)) + '</div>'
                + (isNaN(jours) ? '' : '<div class="mt-dep">titulaire depuis ' + jours + ' jour' + (jours > 1 ? 's' : '') + '</div>') + '</div></div>'
                + (r.second_nom ? '<div class="mt-sec">Suit : <b>' + esc(String(r.second_nom).toUpperCase()) + '</b>, ' + esc(formater(t.unite, r.second_valeur)) + ' (retard de ' + esc(formater(t.unite, Math.max(0, r.valeur - r.second_valeur))) + ')</div>' : '');
        }
        const f = document.createElement('div'); f.id = 'mt-fond';
        f.innerHTML = '<div class="mt-cadre" style="--tc:' + t.couleur + ';"><span class="mt-x" data-mt-x>X</span><div class="mt-boite">'
            + '<div class="mt-sc" style="width:' + taille + 'px;height:' + taille + 'px;"><div class="mt-med">' + window.forgerMedailleSVG(t.code, t.couleur, !r) + '</div></div>'
            + '<div class="mt-txt"><div class="mt-nom">' + esc(t.nom) + '</div><div class="mt-sous">' + esc(t.sous) + '</div>'
            + '<div class="mt-desc">' + esc(t.desc) + '</div><div class="mt-mes">Mesuré en : ' + esc(t.mesure) + '. Cumul total depuis le début des relevés.</div>'
            + titulaire + '<div class="mt-reg">Le titre change de main dès qu’un autre pilote dépasse le titulaire de plus de 2 %.</div></div></div></div>';
        f.addEventListener('click', ev => { if (ev.target === f || ev.target.closest('[data-mt-x]')) fermerTitre(); });
        document.body.appendChild(f);
        document.addEventListener('keydown', toucheTitre, true);
    }
    window.ouvrirMedailleTitre = ouvrirMedailleTitre;
    if (!window.__mtClic) {
        window.__mtClic = true;
        document.addEventListener('click', ev => {
            const el = ev.target && ev.target.closest ? ev.target.closest('[data-titre-code]') : null; if (!el) return;
            ev.stopPropagation(); ev.preventDefault();
            if (typeof hideHoloTooltip === 'function') hideHoloTooltip();
            if (typeof sonClic === 'function') sonClic();
            ouvrirMedailleTitre(el.getAttribute('data-titre-code'));
        }, true);
    }

    // ---------- STYLE (injecte une fois) ----------
    if (!document.getElementById('titres-style')) {
        const st = document.createElement('style');
        st.id = 'titres-style';
        st.textContent = `
        .titres-grille { display: grid; grid-template-columns: repeat(auto-fit, minmax(122px, 1fr)); gap: 12px; }
        .titre-carte { position: relative; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 12px 8px 10px; background: linear-gradient(180deg, rgba(255,255,255,0.035), rgba(0,0,0,0.35)); border: 1px solid color-mix(in srgb, var(--tc) 30%, #222); border-top: 2px solid var(--tc); cursor: help; transition: transform 0.2s, box-shadow 0.2s; clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px)); }
        .titre-carte:hover { transform: translateY(-3px); box-shadow: 0 6px 18px color-mix(in srgb, var(--tc) 25%, transparent); }
        .titre-carte.moi { background: linear-gradient(180deg, color-mix(in srgb, var(--tc) 14%, transparent), rgba(0,0,0,0.35)); }
        .titre-carte.vacant { border-color: #2a2a2a; border-top-color: #444; background: rgba(255,255,255,0.015); }
        .titre-medaille { width: 78px; height: 78px; margin-bottom: 4px; transition: filter 0.25s; }
        .titre-carte:hover .titre-medaille { filter: drop-shadow(0 0 9px var(--tc)); }
        .titre-nom { font-size: 0.68em; font-weight: bold; letter-spacing: 1px; color: var(--tc); text-align: center; line-height: 1.15; }
        .titre-sous { font-size: 0.58em; letter-spacing: 1.5px; color: #777; margin-bottom: 5px; }
        .titre-pilote { width: 100%; font-size: 0.74em; font-weight: bold; color: #fff; text-align: center; padding: 3px 4px; background: rgba(0,0,0,0.55); border-bottom: 2px solid var(--tc); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .titre-pilote.vide { color: #555; border-bottom-color: #333; font-weight: normal; letter-spacing: 2px; }
        .titre-total { margin-top: 5px; font-size: 0.8em; color: var(--tc); font-weight: bold; }
        .titre-avance { font-size: 0.62em; color: #9a9a9a; text-align: center; line-height: 1.3; }
        .titre-avance span { color: #666; }
        .titres-grille.avec-photos .titre-carte { min-height: 292px; overflow: hidden; }
        .titres-grille.avec-photos .titre-medaille { position: absolute; top: 9px; right: 9px; width: 52px; height: 52px; margin: 0; z-index: 2; transform-origin: 100% 0; transition: transform .28s cubic-bezier(.2, .8, .3, 1.15), filter .25s; }
        .titres-grille.avec-photos .titre-carte:hover .titre-medaille { transform: scale(1.85); }
        .titres-grille.avec-photos .titre-nom { margin-top: auto; position: relative; z-index: 1; text-shadow: 0 1px 4px #000; }
        .titres-grille.avec-photos .titre-sous, .titres-grille.avec-photos .titre-pilote, .titres-grille.avec-photos .titre-total, .titres-grille.avec-photos .titre-avance { position: relative; z-index: 1; }
        .titres-grille.avec-photos .titre-total, .titres-grille.avec-photos .titre-avance { text-shadow: 0 1px 4px #000; }
        .titre-fond { position: absolute; inset: 0; background-size: cover; background-position: center 12%; z-index: 0; }
        .titre-voile { position: absolute; inset: 0; z-index: 0; background: linear-gradient(180deg, rgba(5,3,0,0.12) 0%, rgba(5,3,0,0.04) 40%, rgba(5,3,0,0.78) 62%, rgba(5,3,0,0.96) 80%); }
        .titre-fond.sans { background: radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--tc) 30%, #0a0604), #07090b 78%); display: flex; align-items: flex-start; justify-content: center; }
        .titre-ini { margin-top: 74px; font-size: 2.6em; font-weight: bold; letter-spacing: 1px; color: color-mix(in srgb, var(--tc) 85%, #fff); text-shadow: 0 0 16px color-mix(in srgb, var(--tc) 60%, transparent); }
        .titre-fantome { position: absolute; left: 50%; top: 92px; transform: translateX(-50%); width: 96px; height: 96px; opacity: 0.2; z-index: 0; pointer-events: none; }
        [data-titre-code] { cursor: zoom-in !important; }
        .tb-cap { color: #FFD24A; letter-spacing: 3px; font-size: .78em; font-weight: bold; margin-bottom: 10px; } .tb-cap small { display: block; color: #6e7882; letter-spacing: 1px; font-weight: normal; margin-top: 3px; font-size: .85em; }
        .tb-grille { display: grid; grid-template-columns: repeat(auto-fit, minmax(92px, 1fr)); gap: 12px 6px; }
        .tb-cell { display: flex; flex-direction: column; align-items: center; gap: 3px; min-width: 0; padding: 6px 2px 8px; border: 1px solid transparent; transition: background .2s, border-color .2s; }
        .tb-cell:hover { background: color-mix(in srgb, var(--tc) 9%, transparent); border-color: color-mix(in srgb, var(--tc) 40%, transparent); }
        .tb-cell.moi { border-color: color-mix(in srgb, var(--tc) 55%, transparent); background: color-mix(in srgb, var(--tc) 7%, transparent); }
        .tb-med { width: 86px; height: 86px; } .tb-cell:hover .tb-med { filter: drop-shadow(0 0 9px var(--tc)); }
        .tb-nom { font-size: .6em; letter-spacing: 1px; color: var(--tc); font-weight: bold; text-align: center; line-height: 1.25; min-height: 2.5em; display: flex; align-items: center; }
        .tb-pil { display: flex; align-items: center; gap: 5px; max-width: 100%; min-width: 0; } .tb-pil b { font-size: .64em; color: #e6ecf1; letter-spacing: .5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .tb-av { width: 26px; height: 26px; flex: none; border-radius: 50%; background: #1a222b center / cover; border: 2px solid var(--tc); display: flex; align-items: center; justify-content: center; font-size: .6em; font-weight: bold; color: var(--tc); }
        .tb-av.vide { border-style: dashed; border-color: #444; background: transparent; } .tb-cell.vacant .tb-pil b { color: #667; font-weight: normal; } .tb-cell.vacant .tb-nom { color: #667; }
        .titres-grille.avec-photos .titre-fantome { display: none; }
        #mt-fond { position: fixed; inset: 0; z-index: 99990; background: rgba(2,3,5,.9); display: flex; align-items: center; justify-content: center; padding: clamp(8px, 2.5vw, 28px); backdrop-filter: blur(3px); }
        #mt-fond .mt-cadre { --tc: #FFD24A; position: relative; display: flex; width: min(980px, 100%); max-height: 100%; padding: 1px; box-sizing: border-box; background: linear-gradient(135deg, var(--tc), color-mix(in srgb, var(--tc) 35%, #05070a) 55%, var(--tc)); clip-path: polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px)); filter: drop-shadow(0 0 28px color-mix(in srgb, var(--tc) 30%, transparent)); }
        #mt-fond .mt-boite { position: relative; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 22px 36px; width: 100%; min-height: 0; overflow-y: auto; padding: clamp(18px, 3vw, 34px); box-sizing: border-box; background: radial-gradient(ellipse at 28% 30%, color-mix(in srgb, var(--tc) 16%, #0b0f14), #05070a 72%); clip-path: polygon(0 0, calc(100% - 23px) 0, 100% 23px, 100% 100%, 23px 100%, 0 calc(100% - 23px)); color: #d5dce2; }
        #mt-fond .mt-x { position: absolute; z-index: 5; top: 4px; right: 26px; cursor: pointer; color: var(--tc); font-weight: bold; letter-spacing: 2px; padding: 12px 16px; font-size: 1.1em; touch-action: manipulation; }
        #mt-fond .mt-sc { perspective: 1400px; flex: none; display: flex; align-items: center; justify-content: center; }
        #mt-fond .mt-med { width: 100%; height: 100%; animation: mtTourne 7s ease-in-out infinite; filter: drop-shadow(0 0 22px color-mix(in srgb, var(--tc) 40%, transparent)); }
        #mt-fond .mt-sc:hover .mt-med { animation-play-state: paused; }
        @keyframes mtTourne { 0%, 100% { transform: rotateY(-18deg) rotateX(4deg); } 50% { transform: rotateY(18deg) rotateX(-3deg); } }
        #mt-fond .mt-txt { flex: 1 1 300px; min-width: min(300px, 100%); max-width: 460px; }
        #mt-fond .mt-nom { font-size: clamp(1.3em, 3.2vw, 2em); font-weight: bold; letter-spacing: 3px; color: var(--tc); text-shadow: 0 0 18px color-mix(in srgb, var(--tc) 45%, transparent); }
        #mt-fond .mt-sous { letter-spacing: 5px; font-size: .75em; color: #8b97a2; margin: 2px 0 14px; }
        #mt-fond .mt-desc { line-height: 1.55; font-size: .9em; } #mt-fond .mt-mes { color: #7d8791; font-size: .75em; margin-top: 8px; line-height: 1.5; }
        #mt-fond .mt-tit { display: flex; align-items: center; gap: 14px; margin-top: 18px; padding: 12px; border: 1px solid color-mix(in srgb, var(--tc) 40%, transparent); background: rgba(255,255,255,.03); }
        #mt-fond .mt-av { width: 64px; height: 64px; flex: none; border-radius: 50%; background: #1a222b center / cover; border: 2px solid var(--tc); display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--tc); }
        #mt-fond .mt-pil { font-weight: bold; letter-spacing: 2px; color: #fff; font-size: 1.05em; } #mt-fond .mt-val { color: var(--tc); font-weight: bold; margin-top: 2px; } #mt-fond .mt-dep { color: #8b97a2; font-size: .75em; margin-top: 2px; }
        #mt-fond .mt-sec { margin-top: 8px; font-size: .78em; color: #9aa6b0; } #mt-fond .mt-reg { margin-top: 12px; font-size: .7em; color: #6e7882; line-height: 1.5; }
        #mt-fond .mt-vac { margin-top: 18px; padding: 12px; border: 1px dashed #4a5560; color: #aab4be; letter-spacing: 3px; font-weight: bold; } #mt-fond .mt-vac small { display: block; letter-spacing: 0; font-weight: normal; margin-top: 4px; color: #7d8791; }
        @media (prefers-reduced-motion: reduce) { #mt-fond .mt-med { animation: none; } }
        .titre-detail { display: flex; align-items: center; gap: 12px; cursor: help; }
        .titre-detail-med { width: 56px; height: 56px; flex: none; }
        .titre-detail b { display: block; font-size: 0.8em; letter-spacing: 1px; }
        .titre-detail small { color: #888; font-size: 0.7em; }
        `;
        document.head.appendChild(st);
    }
})();
