// Utilitaires partages entre toutes les pages EDTEAM (y compris mobile.html,
// qui ne charge pas navigation.js). Fichier volontairement minimal.

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}

// Cache de session courte duree (par onglet, pas partage entre pilotes) pour eviter de
// refaire un select('*') sur 'profils' a chaque navigation entre pages de l'app.
// Un membre approuve d'un escadron (recrue comprise) a toujours acces aux pages Escadron et BGS : on remet les drapeaux du menu a jour a chaque lecture du profil
// (ils pouvaient rester a « false » depuis l'epoque ou les recrues etaient bloquees, et cachaient le menu tant qu'on ne repassait pas par l'accueil)
// Un escadron pas encore valide par le Directeur (profils.escadron_valide = false, SQL 170) est traite PARTOUT comme « sans escadron » : le profil est presente avec escadron_id = INDEPENDANT
// et sans role ; le vrai nom reste dans `escadron_attente` (carte « en attente de validation » du QG, colonisation partagee avec les camarades de l'escadron).
function masquerEscadronEnAttente(data) {
    try {
        if (data && data.escadron_valide === false) {
            const esc = String(data.escadron_id || '').trim();
            if (esc && esc.toUpperCase() !== 'INDEPENDANT') {
                data.escadron_attente = esc;
                data.escadron_id = 'INDEPENDANT';
                data.est_amiral = false;
                data.est_officier = false;
            }
        }
    } catch (e) { /* profil laisse tel quel */ }
    return data;
}

function synchroniserAccesEscadron(data) {
    try {
        const esc = data && String(data.escadron_id || '').trim();
        if (!data || !data.est_approuve || !esc || esc.toUpperCase() === 'INDEPENDANT') return;
        localStorage.setItem('edteam_acces_escadron', 'true');
        localStorage.setItem('edteam_acces_bgs', 'true');
        ['nav-link-escadron', 'nav-bgs-factions'].forEach(id => { const e = document.getElementById(id); if (e) e.style.display = 'flex'; });
    } catch (e) { /* stockage indisponible : le menu garde son etat */ }
}

// Plusieurs comptes dans le meme onglet (test, changement de compte) : les memoires propres a UN pilote (photos, anecdote, invitations, decor de la carte) de l'ancien compte ne doivent pas servir au suivant
// (sinon le nouveau compte garde, jusqu'a 30 minutes, les photos et l'anecdote — vides — de l'autre).
function purgerMemoiresAutreCompte(userId) {
    try {
        const prec = sessionStorage.getItem('edteam_uid_session');
        if (prec && prec !== userId) {
            // toutes les memoires de session du site (cartes Ma puissance / Ma faction, chiffres cles, photos, anecdote, invitations, distinctions...), sauf l'origine de la visite
            Object.keys(sessionStorage).filter(k => k.indexOf('edteam_') === 0 && k !== 'edteam_uid_session' && k !== 'edteam_ref' && k.indexOf('edteam_profil_cache_') !== 0).forEach(k => sessionStorage.removeItem(k));
            ['edteam_ctx_v1', 'edteam_enn_v1', 'edteam_acq_v1', 'edteam_exp_v3', 'edteam_rang_jeu'].forEach(k => localStorage.removeItem(k));
        }
        sessionStorage.setItem('edteam_uid_session', userId);
    } catch (e) { /* stockage indisponible : rien a purger */ }
}

function chargerProfilAvecCache(supabaseApp, userId, ttlMs = 30000) {
    purgerMemoiresAutreCompte(userId);
    const cacheKey = 'edteam_profil_cache_' + userId;
    try {
        const raw = sessionStorage.getItem(cacheKey);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Date.now() - parsed.ts < ttlMs) {
                masquerEscadronEnAttente(parsed.data);
                synchroniserAccesEscadron(parsed.data);
                return Promise.resolve({ data: parsed.data, error: null });
            }
        }
    } catch (e) { /* sessionStorage indisponible : on retombe sur le reseau */ }

    // 'reputations' exclue : colonne ecrite cote serveur mais jamais lue par aucune page
    // (fonctionnalite de suivi des reputations retiree du produit).
    const COLONNES_PROFIL = 'id, user_id, email, cle_api, est_approuve, created_at, escadron_id, est_amiral, cmdr_nom, solde_vaisseau, solde_fc, rang_combat, prog_combat, rang_commerce, prog_commerce, rang_explo, prog_explore, rang_exobio, prog_exobio, rang_fed, prog_fed, rang_emp, prog_emp, patrimoine_total, valeur_vaisseaux, cout_rachat, est_directeur, est_officier, notoriete, rang_mercenary, prog_mercenary, faction_choisie, puissance_nom, puissance_rang, puissance_merites_cycle, puissance_merites_total, rang_bgs, points_bgs, escadron_valide';

    return supabaseApp.from('profils').select(COLONNES_PROFIL).eq('user_id', userId).single().then(res => {
        if (res.data) {
            masquerEscadronEnAttente(res.data);
            synchroniserAccesEscadron(res.data);
            try { sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: res.data })); } catch (e) {}
        }
        return res;
    });
}

// COLONISATION : date de mise en service du module (premier releve enregistre le 30/09/2026 a 23:46 UTC).
// Un chantier dont le dernier releve est AVANT cette date a ete reconstitue a partir d'anciens journaux de jeu et n'a pas encore ete revu a quai
// depuis : ses besoins peuvent etre depasses. Des qu'un pilote dock dessus, il est a jour et le reste. Quand plus aucun chantier ouvert n'est dans
// ce cas, la note d'information disparait toute seule (colonisation.html, mobile.html, "Quoi faire").
window.EDTEAM_COLO_MISE_EN_SERVICE = Date.parse('2026-09-30T23:00:00Z');
function coloChantiersNonReleves(systemes) {
    let total = 0, anciens = 0;
    (systemes || []).forEach(s => (s.chantiers || []).forEach(c => {
        total++;
        const t = Date.parse(c && c.maj_le);
        if (!isNaN(t) && t < window.EDTEAM_COLO_MISE_EN_SERVICE) anciens++;
    }));
    return { total: total, anciens: anciens };
}
