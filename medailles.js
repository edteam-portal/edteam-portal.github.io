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
        { code: 'EXE', nom: "L'EXÉCUTEUR",         sous: 'OP. NOIRES',   couleur: '#FF3333', unite: 'ops', mesure: "meurtres, vols, piratages et contrebande contre une autre faction que celle de l'escadron",    desc: "L'agent des ombres le plus actif contre les factions rivales : meurtres, vols, piratages et contrebande. Les échecs ne comptent pas." },
        { code: 'GUE', nom: 'SEIGNEUR DE GUERRE',  sous: 'CONFLITS',     couleur: '#FF9A3C', unite: 'vict', mesure: 'victoires en zone de conflit',        desc: "Le vétéran qui a remporté le plus de victoires en zone de conflit pour la faction de l'escadron." },
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
        return unite === 't' ? n + ' t' : unite === 'vict' ? n + (v > 1 ? ' victoires' : ' victoire') : unite === 'ops' ? n + (v > 1 ? ' opérations' : ' opération') : n + (v > 1 ? ' pts' : ' pt');
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
            <linearGradient id="gradSombre" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6a6a6a"/><stop offset="50%" stop-color="#262626"/><stop offset="100%" stop-color="#050505"/></linearGradient>
            <linearGradient id="gradAcier" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#C8CED3"/><stop offset="50%" stop-color="#6f7479"/><stop offset="100%" stop-color="#2F4F4F"/></linearGradient>
            <linearGradient id="gradRim" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="45%" stop-color="#8a8a8a"/><stop offset="100%" stop-color="#000000"/></linearGradient>
            <linearGradient id="gradRimInv" x1="100%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/><stop offset="55%" stop-color="#2a2a2a"/><stop offset="100%" stop-color="#000000"/></linearGradient>
            <radialGradient id="gradDish" cx="38%" cy="32%" r="85%"><stop offset="0%" stop-color="#3a3f47"/><stop offset="55%" stop-color="#14171c"/><stop offset="100%" stop-color="#050607"/></radialGradient>
            <radialGradient id="gradShine" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
            <linearGradient id="gradRubanOmbre" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#000" stop-opacity="0.45"/><stop offset="35%" stop-color="#fff" stop-opacity="0.18"/><stop offset="65%" stop-color="#000" stop-opacity="0.05"/><stop offset="100%" stop-color="#000" stop-opacity="0.5"/></linearGradient>
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
        const aura = vacant ? '' : `<circle cx="50" cy="60" r="21" fill="none" stroke="${couleurAura}" stroke-width="1.4" opacity="0.7" filter="url(#glowMedal)"/>`;
        const lau = lauriers(vacant ? '#555' : ribbon);
        const reflet = vacant ? '' : '<ellipse cx="37" cy="43" rx="15" ry="7" transform="rotate(-38 37 43)" fill="url(#gradShine)"/><path d="M22,56 A29,29 0 0 1 46,31" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.35"/>';
        const style = vacant ? 'opacity: 0.32; filter: grayscale(1) drop-shadow(0 3px 4px rgba(0,0,0,0.8));' : 'filter: drop-shadow(0 5px 6px rgba(0,0,0,0.85));';
        return `
        <svg viewBox="0 0 100 100" style="width: 100%; height: 100%; ${style}">
            <path d="M30,0 L52,0 L52,34 L41,41 L30,34 Z" fill="${ribbon}"/>
            <path d="M48,0 L70,0 L70,34 L59,41 L48,34 Z" fill="${ribbon}"/>
            <path d="M30,0 L70,0 L70,34 L59,41 L48,34 L41,41 L30,34 Z" fill="url(#gradRubanOmbre)"/>
            <line x1="41" y1="0" x2="41" y2="38" stroke="#000" stroke-width="0.6" opacity="0.35"/><line x1="59" y1="0" x2="59" y2="38" stroke="#000" stroke-width="0.6" opacity="0.35"/>
            <circle cx="50" cy="60" r="37" fill="url(#gradRim)"/>
            <circle cx="50" cy="60" r="35" fill="url(#${grad})"/>
            <circle cx="50" cy="60" r="35" fill="none" stroke="url(#gradRimInv)" stroke-width="1.2"/>
            <circle cx="50" cy="60" r="32.5" fill="none" stroke="${vacant ? '#555' : '#000'}" stroke-width="0.8" stroke-dasharray="1.4 2.6" opacity="0.55"/>
            ${lau}
            <circle cx="50" cy="60" r="23" fill="url(#gradDish)" stroke="url(#${grad})" stroke-width="2"/>
            ${aura}
            ${icone}
            ${reflet}
        </svg>`;
    };

    // ---------- LECTURE (une requete legere, 15 minutes de memoire de session) ----------
    window.chargerTitresSpecialistes = async function (escadronId, force) {
        const cle = 'edteam_titres_' + (escadronId || 'x');
        try {
            const c = JSON.parse(sessionStorage.getItem(cle) || 'null');
            if (!force && c && Date.now() - c.ts < 900000) return c.data;
        } catch (e) { /* memoire de session indisponible : on lit simplement */ }
        const data = {};
        try {
            const { data: rows, error } = await supabaseApp.from('titres_specialistes').select('code, user_id, cmdr_nom, valeur, second_nom, second_valeur, depuis');
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
            const base = `<div class="titre-carte${r ? '' : ' vacant'}${moi ? ' moi' : ''}" style="--tc: ${t.couleur};" data-titre-tip="${tip}" data-titre-col="${t.couleur}">`;
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

    // ---------- PASTILLES DE FICHE PILOTE : les titres que CE pilote detient ----------
    window.htmlTitresPilote = function (data, userId, taille) {
        taille = taille || 45;
        return TITRES.filter(t => data[t.code] && String(data[t.code].user_id) === String(userId)).map(t => {
            const tip = esc(infoBulle(t, data[t.code]));
            return `<div class="titre-pastille" style="width: ${taille}px; height: ${taille}px; cursor: help; transition: 0.2s;" data-titre-tip="${tip}" data-titre-col="${t.couleur}" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">${window.forgerMedailleSVG(t.code, t.couleur)}</div>`;
        }).join('');
    };

    // Titres detenus par un pilote, avec leur nom, la duree de detention et la valeur (bandeau de la fiche pilote)
    window.htmlTitresPiloteDetail = function (data, userId) {
        return TITRES.filter(t => data[t.code] && String(data[t.code].user_id) === String(userId)).map(t => {
            const r = data[t.code];
            const jours = Math.max(0, Math.floor((Date.now() - Date.parse(r.depuis)) / 86400000));
            const depuis = isNaN(jours) ? '' : 'titulaire depuis ' + jours + ' j · ';
            return `<div class="titre-detail" data-titre-tip="${esc(infoBulle(t, r))}" data-titre-col="${t.couleur}">
                <div class="titre-detail-med">${window.forgerMedailleSVG(t.code, t.couleur)}</div>
                <div><b style="color: ${t.couleur};">${esc(t.nom)}</b><small>${depuis}${esc(formater(t.unite, r.valeur))}</small></div>
            </div>`;
        }).join('');
    };

    window.titreMeta = function (code) { return PAR_CODE[code] || null; };
    window.formaterTitre = function (code, v) { return PAR_CODE[code] ? formater(PAR_CODE[code].unite, v) : String(v); };

    window.brancherTitresSpecialistes = brancherBulles;

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
        .titres-grille.avec-photos .titre-medaille { position: absolute; top: 9px; right: 9px; width: 52px; height: 52px; margin: 0; z-index: 2; }
        .titres-grille.avec-photos .titre-nom { margin-top: auto; position: relative; z-index: 1; text-shadow: 0 1px 4px #000; }
        .titres-grille.avec-photos .titre-sous, .titres-grille.avec-photos .titre-pilote, .titres-grille.avec-photos .titre-total, .titres-grille.avec-photos .titre-avance { position: relative; z-index: 1; }
        .titres-grille.avec-photos .titre-total, .titres-grille.avec-photos .titre-avance { text-shadow: 0 1px 4px #000; }
        .titre-fond { position: absolute; inset: 0; background-size: cover; background-position: center 12%; z-index: 0; }
        .titre-voile { position: absolute; inset: 0; z-index: 0; background: linear-gradient(180deg, rgba(5,3,0,0.12) 0%, rgba(5,3,0,0.04) 40%, rgba(5,3,0,0.78) 62%, rgba(5,3,0,0.96) 80%); }
        .titre-fond.sans { background: radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--tc) 30%, #0a0604), #07090b 78%); display: flex; align-items: flex-start; justify-content: center; }
        .titre-ini { margin-top: 74px; font-size: 2.6em; font-weight: bold; letter-spacing: 1px; color: color-mix(in srgb, var(--tc) 85%, #fff); text-shadow: 0 0 16px color-mix(in srgb, var(--tc) 60%, transparent); }
        .titre-fantome { position: absolute; left: 50%; top: 92px; transform: translateX(-50%); width: 96px; height: 96px; opacity: 0.2; z-index: 0; pointer-events: none; }
        .titre-detail { display: flex; align-items: center; gap: 12px; cursor: help; }
        .titre-detail-med { width: 56px; height: 56px; flex: none; }
        .titre-detail b { display: block; font-size: 0.8em; letter-spacing: 1px; }
        .titre-detail small { color: #888; font-size: 0.7em; }
        `;
        document.head.appendChild(st);
    }
})();
