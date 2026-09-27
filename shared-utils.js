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

    return supabaseApp.from('profils').select('*').eq('user_id', userId).single().then(res => {
        if (res.data) {
            try { sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: res.data })); } catch (e) {}
        }
        return res;
    });
}
