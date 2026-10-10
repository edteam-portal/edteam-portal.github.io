// ETATS DE FACTION (Boom, Famine, Guerre civile...) : badges et etiquette « en phase avec l'etat », partages par le PC (bgs.html), le mobile (mobile.html)
// et la fenetre « Ou vendre ? » (commerce.js). Les etats viennent de bgs_resultats() (EDSM, releve 08:10 et 19:10 UTC) : aucune requete de plus.
// REGLE : information pure. Le classement des routes (en CR) n'en tient JAMAIS compte ; l'etiquette « en phase » ne s'ajoute qu'a une route dont la marchandise
// correspond a l'etat (armes en guerre, nourriture en famine, medicaments en epidemie), jamais comme conseil general.
(function () {
    'use strict';
    const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    // [libelle francais, ton]  ton : b = favorable (vert), d = defavorable ou conflit (rouge), n = neutre (gris)
    const ETATS = {
        'boom': ['BOOM', 'b'], 'investment': ['INVESTISSEMENT', 'b'], 'expansion': ['EXPANSION', 'b'], 'public holiday': ['JOUR FÉRIÉ', 'b'], 'civil liberty': ['LIBERTÉS CIVILES', 'b'],
        'technological boom': ['BOOM TECHNOLOGIQUE', 'b'], 'election': ['ÉLECTION', 'n'], 'none': null,
        'war': ['GUERRE', 'd'], 'civil war': ['GUERRE CIVILE', 'd'], 'civil unrest': ['TROUBLES CIVILS', 'd'], 'famine': ['FAMINE', 'd'], 'outbreak': ['ÉPIDÉMIE', 'd'],
        'infrastructure failure': ['PANNE D\'INFRASTRUCTURE', 'd'], 'bust': ['RÉCESSION', 'd'], 'lockdown': ['CONFINEMENT', 'd'], 'retreat': ['RETRAITE', 'd'],
        'blight': ['FLÉAU AGRICOLE', 'd'], 'drought': ['SÉCHERESSE', 'd'], 'natural disaster': ['CATASTROPHE NATURELLE', 'd'], 'terrorist attack': ['ATTAQUE TERRORISTE', 'd'],
        'terrorism': ['TERRORISME', 'd'], 'pirate attack': ['ATTAQUE DE PIRATES', 'd'], 'blockade': ['BLOCUS', 'd'], 'cold war': ['GUERRE FROIDE', 'd'], 'colonisation': ['COLONISATION', 'b']
    };
    const COUL = { b: '#00FF66', d: '#FF3333', n: '#999' }, FOND = { b: 'rgba(0,255,102,.08)', d: 'rgba(255,51,51,.08)', n: 'rgba(150,150,150,.08)' }, ICONE = { b: '▲ ', d: '', n: '' };
    const info = nom => { const k = String(nom || '').trim().toLowerCase(); if (k in ETATS) return ETATS[k]; return [String(nom || '').toUpperCase(), 'n']; };

    function pastille(nom, ton, suffixe, pointille) {
        return '<span style="display:inline-block;font-size:.72em;letter-spacing:1px;padding:2px 8px;border:1px ' + (pointille ? 'dashed' : 'solid') + ' ' + COUL[ton] + ';color:' + COUL[ton]
            + ';background:' + FOND[ton] + ';border-radius:2px;white-space:nowrap;' + (pointille ? 'opacity:.8;' : '') + '">' + ICONE[ton] + E(nom) + (suffixe ? ' · ' + E(suffixe) : '') + '</span>';
    }
    function age(epoch) {
        if (!epoch) return '';
        const h = (Date.now() / 1000 - epoch) / 3600;
        return h < 1 ? 'il y a ' + Math.max(1, Math.round(h * 60)) + ' min' : h < 48 ? 'il y a ' + Math.round(h) + ' h' : 'il y a ' + Math.round(h / 24) + ' j';
    }
    function lecture(ordreId) { const r = window.cacheResultatsBgs; return (r && r.dir && r.dir[ordreId]) || null; }
    const liste = a => (Array.isArray(a) ? a : []).filter(x => x && String(x).toLowerCase() !== 'none');

    // Rangee de badges : etats actifs (pleins), en attente et en recuperation (pointilles). compact = actifs seulement (carte en liste).
    function badges(res, compact) {
        if (!res || !res.donnees) return '';
        const out = [];
        liste(res.actifs).forEach(n => { const i = info(n); if (i) out.push(pastille(i[0], i[1])); });
        if (!compact) {
            liste(res.attente).forEach(n => { const i = info(n); if (i) out.push(pastille(i[0], i[1], 'en attente', true)); });
            liste(res.recuperation).forEach(n => { const i = info(n); if (i) out.push(pastille(i[0], i[1], 'récupération', true)); });
        }
        if (!out.length) return compact ? '' : '<span style="color:#777;font-size:.78em;">Aucun état actif</span>';
        return '<span style="display:inline-flex;flex-wrap:wrap;gap:5px;align-items:center;">' + out.join('') + '</span>';
    }
    // Ligne complete (titre + badges + age du releve) pour une fenetre de detail
    function bloc(res) {
        if (!res || !res.donnees) return '';
        return '<div style="display:flex;flex-direction:column;gap:5px;">' + badges(res, false)
            + '<span style="color:#777;font-size:.68em;">Relevé EDSM ' + E(age(res.maj_edsm)) + ' · information, sans effet sur le classement des routes</span></div>';
    }
    // Etat qui « colle » a une marchandise (categorie Spansh) : seulement armes/guerre, nourriture/famine, medicaments/epidemie
    function enPhase(res, categorie) {
        if (!res || !res.donnees) return null;
        const cat = String(categorie || '').toLowerCase(), actifs = liste(res.actifs).map(x => String(x).toLowerCase());
        const lien = [['weapons', ['war', 'civil war'], 'ARMES'], ['foods', ['famine'], 'NOURRITURE'], ['medicines', ['outbreak'], 'MÉDICAMENTS']];
        for (const l of lien) if (cat === l[0]) { const e = actifs.find(a => l[1].includes(a)); if (e) return info(e)[0]; }
        return null;
    }
    function etiquette(res, categorie) {
        const e = enPhase(res, categorie);
        return e ? '<span style="display:inline-block;font-size:.68em;letter-spacing:1px;padding:2px 8px;border:1px solid #FFD700;color:#FFD700;background:rgba(255,215,0,.08);border-radius:2px;white-space:nowrap;" title="La marchandise correspond à l\'état de la faction (relevé EDSM). Le classement des routes n\'en tient pas compte.">★ EN PHASE AVEC L\'ÉTAT · ' + E(e) + '</span>' : '';
    }
    window.edteamEtats = { badges, bloc, etiquette, lecture, enPhase };
})();
