// Panneau "Nouveautes" de SYS.EDTEAM : fenetre autonome chargee a la demande par footer.js.
// Source des donnees : nouveautes-data.js (window.EDTEAM_NOUVEAUTES). Regroupement par cycle (jeudi 07:00 UTC -> jeudi 07:00 UTC).
(function () {
    'use strict';
    if (window.edteamNouveautes) return;

    var CLE_VU = 'edteam_nouv_vu';
    var TYPES = {
        NOUVEAU:  { txt: 'NOUVEAU',  coul: '#00FF66' },
        AMELIORE: { txt: 'AMÉLIORÉ', coul: '#00F0FF' },
        CORRIGE:  { txt: 'CORRIGÉ',  coul: '#FF7100' }
    };

    function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function jj(d) { return ('0' + d.getUTCDate()).slice(-2) + '/' + ('0' + (d.getUTCMonth() + 1)).slice(-2); }

    // Jeudi 07:00 UTC qui cloture le cycle contenant la date (meme regle que le serveur et que la salle Powerplay)
    function clotureCycle(iso) {
        var decale = new Date(new Date(iso).getTime() - 7 * 3600000);
        var ajout = (4 - decale.getUTCDay() + 7) % 7;
        if (ajout === 0) ajout = 7;
        return Date.UTC(decale.getUTCFullYear(), decale.getUTCMonth(), decale.getUTCDate() + ajout);
    }

    function entrees() {
        var l = Array.isArray(window.EDTEAM_NOUVEAUTES) ? window.EDTEAM_NOUVEAUTES.slice() : [];
        return l.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
    }

    var CSS = ''
        + '#ft-nouv-overlay{position:fixed;inset:0;background:rgba(0,0,0,.86);backdrop-filter:blur(4px);display:none;justify-content:center;align-items:center;z-index:6100;padding:15px;box-sizing:border-box}'
        + '#ft-nouv{position:relative;width:100%;max-width:780px;max-height:90vh;display:flex;flex-direction:column;background:rgba(5,8,12,.98);border:1px solid var(--ed-orange,#FF7100);box-shadow:0 0 40px rgba(255,113,0,.2);border-radius:4px;font-family:"Share Tech Mono",monospace;color:#ccc;box-sizing:border-box}'
        + '#ft-nouv .nv-tete{padding:18px 24px 14px;border-bottom:1px solid rgba(255,113,0,.3);background:rgba(255,113,0,.05)}'
        + '#ft-nouv .nv-titre{color:var(--ed-orange,#FF7100);font-weight:bold;letter-spacing:3px;font-size:1.15rem}'
        + '#ft-nouv .nv-sous{color:#888;font-size:.8rem;margin-top:6px}'
        + '#ft-nouv .nv-corps{padding:14px 24px 20px;overflow-y:auto;flex-grow:1}'
        + '#ft-nouv details{border:1px solid #2a2a2a;background:rgba(0,0,0,.4);border-radius:3px;margin-bottom:10px}'
        + '#ft-nouv details[open]{border-color:rgba(255,113,0,.4)}'
        + '#ft-nouv summary{cursor:pointer;padding:11px 14px;list-style:none;display:flex;justify-content:space-between;gap:10px;align-items:baseline;color:#fff;font-size:.9rem;letter-spacing:1px}'
        + '#ft-nouv summary::-webkit-details-marker{display:none}'
        + '#ft-nouv summary .nv-sem{color:var(--ed-orange,#FF7100);font-weight:bold}'
        + '#ft-nouv summary .nv-nb{color:#888;font-size:.8rem}'
        + '#ft-nouv .nv-liste{padding:2px 14px 10px}'
        + '#ft-nouv .nv-item{padding:10px 0;border-top:1px dashed #2a2a2a}'
        + '#ft-nouv .nv-item:first-child{border-top:none}'
        + '#ft-nouv .nv-ligne{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}'
        + '#ft-nouv .nv-badge{font-size:.68rem;font-weight:bold;letter-spacing:1px;border:1px solid;padding:1px 6px;border-radius:2px;flex-shrink:0}'
        + '#ft-nouv .nv-t{color:#fff;font-weight:bold;font-size:.9rem}'
        + '#ft-nouv .nv-d{color:#666;font-size:.72rem;margin-left:auto}'
        + '#ft-nouv .nv-txt{font-size:.84rem;line-height:1.65;color:#bbb;margin-top:5px}'
        + '#ft-nouv .nv-action{margin-top:6px;color:#FFD700;font-size:.82rem}'
        + '#ft-nouv .nv-x{position:absolute;top:14px;right:18px;color:var(--ed-orange,#FF7100);cursor:pointer;font-weight:bold;font-size:1.2rem}'
        + '#ft-nouv .nv-x:hover{color:#fff}'
        + '#ft-nouv .nv-vide{color:#888;text-align:center;font-style:italic;padding:30px 0}';

    function construire() {
        var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
        var liste = entrees();
        var corps = '';
        if (!liste.length) corps = '<div class="nv-vide">Aucune nouveauté pour le moment.</div>';
        else {
            var groupes = {}, ordre = [];
            liste.forEach(function (e) {
                var c = clotureCycle(e.date);
                if (!groupes[c]) { groupes[c] = []; ordre.push(c); }
                groupes[c].push(e);
            });
            ordre.forEach(function (c, i) {
                var fin = new Date(c), debut = new Date(c - 7 * 86400000);
                var items = groupes[c].map(function (e) {
                    var t = TYPES[e.type] || TYPES.NOUVEAU;
                    var d = new Date(e.date);
                    return '<div class="nv-item"><div class="nv-ligne">'
                        + '<span class="nv-badge" style="color:' + t.coul + ';border-color:' + t.coul + '">' + t.txt + '</span>'
                        + '<span class="nv-t">' + esc(e.titre) + '</span>'
                        + '<span class="nv-d">' + jj(d) + '</span></div>'
                        + '<div class="nv-txt">' + esc(e.texte) + '</div>'
                        + (e.action ? '<div class="nv-action">▶ ACTION REQUISE : ' + esc(e.action) + '</div>' : '')
                        + '</div>';
                }).join('');
                corps += '<details' + (i === 0 ? ' open' : '') + '><summary><span class="nv-sem">SEMAINE DU ' + jj(debut) + ' AU ' + jj(fin) + '</span>'
                    + '<span class="nv-nb">' + groupes[c].length + ' nouveauté' + (groupes[c].length > 1 ? 's' : '') + '</span></summary>'
                    + '<div class="nv-liste">' + items + '</div></details>';
            });
        }
        var ov = document.createElement('div');
        ov.id = 'ft-nouv-overlay'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Nouveautés');
        ov.innerHTML = '<div id="ft-nouv"><div class="nv-x" title="Fermer">X</div>'
            + '<div class="nv-tete"><div class="nv-titre">NOUVEAUTÉS // CE QUI CHANGE SUR LE SITE</div>'
            + '<div class="nv-sous">Regroupées par semaine, du jeudi 07:00 UTC au jeudi suivant.</div></div>'
            + '<div class="nv-corps">' + corps + '</div></div>';
        document.body.appendChild(ov);
        ov.addEventListener('click', function (e) {
            if (e.target === ov) fermer();
        });
        ov.querySelector('.nv-x').addEventListener('click', fermer);
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fermer(); });
        return ov;
    }

    function fermer() {
        var ov = document.getElementById('ft-nouv-overlay');
        if (ov) ov.style.display = 'none';
    }

    // Marque tout comme lu : la date de la derniere entree est memorisee (le point discret disparait)
    function marquerVu() {
        var l = entrees();
        try { if (l.length) localStorage.setItem(CLE_VU, l[0].date); } catch (e) { /* stockage indisponible */ }
        if (typeof window.edteamMajPointNouveautes === 'function') window.edteamMajPointNouveautes();
    }

    function ouvrir() {
        var ov = document.getElementById('ft-nouv-overlay') || construire();
        ov.style.display = 'flex';
        marquerVu();
    }

    window.edteamNouveautes = { ouvrir: ouvrir, fermer: fermer, entrees: entrees };
})();
