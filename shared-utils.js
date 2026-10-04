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
function chargerProfilAvecCache(supabaseApp, userId, ttlMs = 30000) {
    const cacheKey = 'edteam_profil_cache_' + userId;
    try {
        const raw = sessionStorage.getItem(cacheKey);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Date.now() - parsed.ts < ttlMs) {
                return Promise.resolve({ data: parsed.data, error: null });
            }
        }
    } catch (e) { /* sessionStorage indisponible : on retombe sur le reseau */ }

    // 'reputations' exclue : colonne ecrite cote serveur mais jamais lue par aucune page
    // (fonctionnalite de suivi des reputations retiree du produit).
    const COLONNES_PROFIL = 'id, user_id, email, cle_api, est_approuve, created_at, escadron_id, est_amiral, cmdr_nom, solde_vaisseau, solde_fc, rang_combat, prog_combat, rang_commerce, prog_commerce, rang_explo, prog_explore, rang_exobio, prog_exobio, rang_fed, prog_fed, rang_emp, prog_emp, patrimoine_total, valeur_vaisseaux, cout_rachat, est_directeur, est_officier, notoriete, rang_mercenary, prog_mercenary, faction_choisie, puissance_nom, puissance_rang, puissance_merites_cycle, puissance_merites_total, rang_bgs, points_bgs';

    return supabaseApp.from('profils').select(COLONNES_PROFIL).eq('user_id', userId).single().then(res => {
        if (res.data) {
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
