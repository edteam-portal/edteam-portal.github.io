// Utilitaires partages entre toutes les pages EDTEAM (y compris mobile.html,
// qui ne charge pas navigation.js). Fichier volontairement minimal.

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}
