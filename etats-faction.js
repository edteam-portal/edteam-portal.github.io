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
            + '<span style="color:#777;font-size:.68em;">' + (res.par ? 'Relevé par CMDR ' + E(String(res.par).toUpperCase()) + ' (dans le jeu) ' : 'Relevé EDSM ') + E(age(res.maj_edsm)) + ' · information, sans effet sur le classement des routes</span></div>';
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
    // CONSEILS SELON L'ETAT (information pure, jamais de calcul) : ce que disent les guides de la communaute sur l'effet des etats sur l'influence
    // (Boom : commerce x2 ; Famine : combat sans effet, nourriture x2 ; Epidemie : combat sans effet, medicaments x2 ; troubles civils : primes x2 ; confinement : sans effet).
    // Sources anciennes, non confirmees pour 2026 : toujours presentes comme « a verifier ». N'agit NI sur les jauges, NI sur les points de rang.
    // Retourne { notes : [{ ton, titre, texte }], barres : { CLE_DE_BARRE : { ton : 'ok' | 'no', txt } } } ; cles de barre : MISSIONS, ECONOMIE, SECURITE, SCIENCE, MEURTRES, CONTREBANDE, ECHECS.
    function conseils(typeOrdre, res) {
        const out = { notes: [], barres: {} };
        if (!res || !res.donnees) return out;
        const actifs = liste(res.actifs).map(x => String(x).toLowerCase()), a = n => actifs.includes(n);
        const hausse = typeOrdre === 'HAUSSE', baisse = typeOrdre === 'BAISSE';
        const note = (ton, titre, texte) => out.notes.push({ ton, titre, texte });
        if (a('lockdown')) note('neg', 'CONFINEMENT : LES ACTIONS N\'ONT AUCUN EFFET', 'Tant que l\'état dure, vos efforts sur cette faction ne font pas bouger l\'influence. Mieux vaut attendre sa fin, ou aider à l\'écourter en tuant des cibles hors-la-loi.');
        if (a('boom') || a('technological boom')) {
            if (hausse) { note('pos', 'BOOM : LE COMMERCE PÈSE DOUBLE', 'Ventes, livraisons et missions de transport sont les plus efficaces pour faire monter cette faction tant que l\'état dure.'); out.barres.ECONOMIE = { ton: 'ok', txt: '▲ BOOM · EFFET ×2' }; }
            if (baisse) { note('neg', 'BOOM : LA CONTREBANDE PÈSE DOUBLE', 'Le marché noir fait baisser cette faction plus vite pendant l\'état. Les livraisons commerciales, elles, la renforcent : évitez-les.'); out.barres.CONTREBANDE = { ton: 'ok', txt: '▲ BOOM · EFFET ×2' }; }
        }
        if (a('bust') && hausse) { note('inf', 'RÉCESSION : LE COMMERCE PÈSE PEU', 'Pendant l\'état, le commerce fait peu monter l\'influence : préférez les missions et la sécurité.'); out.barres.ECONOMIE = { ton: 'no', txt: '▼ RÉCESSION · EFFET RÉDUIT', att: false }; }
        if (a('civil unrest') && hausse) { note('pos', 'TROUBLES CIVILS : LES PRIMES COMPTENT DOUBLE', 'Les primes remises à cette faction pèsent double pendant l\'état.'); out.barres.SECURITE = { ton: 'ok', txt: '▲ TROUBLES · PRIMES ×2' }; }
        [['famine', 'FAMINE', 'NOURRITURE', 'la nourriture', 'peut raccourcir la famine'], ['outbreak', 'ÉPIDÉMIE', 'MÉDICAMENTS', 'des médicaments', 'peut raccourcir l\'épidémie']].forEach(s => {
            if (!a(s[0])) return;
            if (hausse) {
                note('inf', s[1] + ' : LE COMBAT N\'A PLUS D\'EFFET', 'Pendant l\'état, les actions de combat ne comptent pas pour l\'influence : les primes ne feront pas monter cette faction.');
                note('pos', s[2] + ' : EFFET DOUBLE', 'Livrer ' + s[3] + ' compte double et ' + s[4] + '.');
                out.barres.ECONOMIE = { ton: 'ok', txt: '▲ ' + s[1] + ' · ' + s[2] + ' ×2' };
                out.barres.SECURITE = { ton: 'no', txt: '⊘ ' + s[1] + ' · SANS EFFET', att: true };
            }
            if (baisse) {
                note('inf', s[1] + ' : LES MEURTRES N\'ONT PLUS D\'EFFET', 'Pendant l\'état, les actions de combat ne comptent pas pour l\'influence. Les meurtres de cette directive risquent d\'être sans résultat : privilégiez la contrebande.');
                out.barres.MEURTRES = { ton: 'no', txt: '⊘ ' + s[1] + ' · SANS EFFET', att: true };
            }
        });
        return out;
    }
    const TONS = { pos: ['#00FF66', '▲'], neg: ['#FF3333', '⚠'], inf: ['#00F0FF', '!'] };
    // Bloc « Conseils selon l'etat » (vide s'il n'y a rien a dire)
    function conseilsBloc(typeOrdre, res, classeTitre) {
        const c = conseils(typeOrdre, res);
        if (!c.notes.length) {
            // un état est actif mais aucun conseil connu pour lui : on le dit (sinon on croirait que la fonction ne marche pas)
            const noms = liste(res && res.donnees ? res.actifs : []).map(n => { const i = info(n); return i ? i[0] : null; }).filter(Boolean);
            return noms.length ? '<div style="color:#666;font-size:.72em;line-height:1.5;margin-top:10px;">Conseils selon l\'état : aucun pour ' + E(noms.join(', ')) + ' (pas de règle connue pour cet état).</div>' : '';
        }
        return '<div class="' + (classeTitre || 'bgs-sec') + '" style="margin-top:14px;">CONSEILS SELON L\'ÉTAT</div>'
            + c.notes.map(n => { const t = TONS[n.ton] || TONS.inf; return '<div style="border:1px solid ' + t[0] + '66;border-left:3px solid ' + t[0] + ';background:rgba(0,0,0,.35);padding:8px 11px;margin-bottom:6px;display:flex;gap:10px;align-items:flex-start;">'
                + '<span style="color:' + t[0] + ';line-height:1.3;">' + t[1] + '</span><div style="font-size:.8em;color:#ddd;line-height:1.45;"><b style="color:' + t[0] + ';letter-spacing:1px;">' + E(n.titre) + '</b><br>' + E(n.texte) + '</div></div>'; }).join('')
            + '<div style="color:#666;font-size:.68em;line-height:1.5;">ⓘ D\'après les guides de la communauté, à vérifier : l\'effet réel peut avoir changé. Aucun effet sur vos jauges ni vos points.</div>';
    }
    // Etiquette d'une barre d'effort (a la droite de la 2e ligne) : verte = etat favorable, grise = sans effet ; null s'il n'y a rien
    function etiquetteBarre(cle, barres) {
        const b = barres && barres[cle];
        if (!b) return null;
        return b.ton === 'ok' ? { html: '<span style="font-size:.72em;letter-spacing:1px;padding:2px 9px;border:1px solid #00FF66;color:#00FF66;background:rgba(0,255,102,.1);white-space:nowrap;">' + E(b.txt) + '</span>', recommande: true }
                              : { html: '<span style="font-size:.72em;letter-spacing:1px;padding:2px 9px;border:1px solid #666;color:#999;background:rgba(0,0,0,.35);white-space:nowrap;">' + E(b.txt) + '</span>', attenuee: !!b.att };
    }
    window.edteamEtats = { badges, bloc, etiquette, lecture, enPhase, conseils, conseilsBloc, etiquetteBarre };
})();
