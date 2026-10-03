// QG : cartes « MA PUISSANCE » (Powerplay) et « MA FACTION » (BGS). Une seule lecture serveur : rpc('ma_puissance_et_faction') (script SQL 45),
// mise en memoire 30 minutes (les donnees ne changent qu'une fois par jour : releve quotidien de Spansh, cote serveur).
// Limites assumees : pas de points par puissance (aucune source publique), pas de systemes « contestes » ; variations seulement apres ~7 jours d'historique.
// Les emblemes sont des monogrammes crees pour le site : aucune image de Frontier.
(function () {
    'use strict';
    const S = window.QGSuivi = {};
    const DUREE = 30 * 60 * 1000;
    const nf = new Intl.NumberFormat('fr-FR');
    const fmt = n => nf.format(Math.round(Number(n) || 0));
    const esc = s => (typeof escapeHtml === 'function') ? escapeHtml(s) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const pop = n => { n = Number(n) || 0; return n >= 1e9 ? (n / 1e9).toFixed(1).replace('.', ',') + ' Md' : n >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + ' M' : fmt(n); };
    const jj = iso => { const d = new Date(iso + 'T00:00:00Z'); return isNaN(d) ? '' : ('0' + d.getUTCDate()).slice(-2) + '/' + ('0' + (d.getUTCMonth() + 1)).slice(-2); };

    // Monogramme et couleur propres au site (aucun rapport avec les visuels officiels)
    const EMBLEMES = {
        'Aisling Duval': ['AD', '#4aa3ff'], 'Archon Delaine': ['AR', '#ff5a4a'], 'A. Lavigny-Duval': ['AL', '#ffb347'], 'Denton Patreus': ['DP', '#e0b84a'],
        'Edmund Mahon': ['EM', '#5ad6a2'], 'Felicia Winters': ['FW', '#ff7ab8'], 'Jerome Archer': ['JA', '#8fb4ff'], 'Li Yong-Rui': ['LY', '#7fe0ff'],
        'Nakato Kaine': ['NK', '#c78bff'], 'Pranav Antal': ['PA', '#7be06a'], 'Yuri Grom': ['YG', '#ff8a5a'], 'Zemina Torval': ['ZT', '#e6e65a']
    };

    // variation : ▲ +n (vert), ▼ -n (rouge), = (gris) ; rien si pas encore d'historique
    const vari = (v, unite) => {
        if (v == null || isNaN(Number(v))) return '';
        v = Number(v);
        if (v === 0) return '<span class="qs-v z">=</span>';
        return '<span class="qs-v ' + (v > 0 ? 'h' : 'b') + '">' + (v > 0 ? '▲ +' : '▼ −') + (unite ? unite(Math.abs(v)) : fmt(Math.abs(v))) + '</span>';
    };

    function injecterStyle() {
        if (document.getElementById('qs-style')) return;
        const st = document.createElement('style'); st.id = 'qs-style';
        st.textContent = `
.qs-carte{--c:#00F0FF;position:relative;height:100%;box-sizing:border-box;border:1px solid color-mix(in srgb,var(--c) 60%,transparent);padding:14px 16px 10px;display:flex;flex-direction:column;gap:10px;font-family:'Share Tech Mono',monospace;color:#ccc;
  background:linear-gradient(135deg,color-mix(in srgb,var(--c) 10%,transparent),rgba(5,3,1,.92) 60%);clip-path:polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)}
.qs-carte:before{content:"";position:absolute;top:0;left:14px;width:50px;height:3px;background:var(--c);box-shadow:0 0 10px var(--c)}
.qs-cap{display:flex;align-items:center;gap:14px}
.qs-hx{width:60px;height:66px;flex:none;display:grid;place-items:center;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);background:linear-gradient(160deg,var(--c),transparent 120%);position:relative}
.qs-hx:before{content:"";position:absolute;inset:2px;clip-path:inherit;background:rgba(6,4,2,.94)}
.qs-hx b{position:relative;color:var(--c);font-size:1.2em;letter-spacing:1px;text-shadow:0 0 10px var(--c)}
.qs-hx svg{position:relative;width:26px;height:26px;stroke:var(--c);fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.qs-k{font-size:.62em;letter-spacing:3px;color:var(--c)}
.qs-n{color:#fff;font-size:1.1em;letter-spacing:2px;margin-top:2px;overflow-wrap:anywhere}
.qs-rg{margin-left:auto;text-align:right;flex:none}.qs-rg .g{font-size:1.8em;color:var(--c);line-height:1;text-shadow:0 0 12px color-mix(in srgb,var(--c) 50%,transparent)}.qs-rg .p{font-size:.62em;color:#888;letter-spacing:1px;margin-top:2px}
.qs-gros{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}.qs-gros .v{color:#fff;font-size:1.5em}.qs-gros .l{color:#888;font-size:.7em;letter-spacing:2px}
.qs-pile{display:flex;height:9px;gap:2px;margin-top:7px}.qs-pile i{display:block;height:100%}
.qs-et{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.qs-et .v{color:#fff;font-size:1.12em;line-height:1.1;white-space:nowrap}.qs-et .l{font-size:.6em;letter-spacing:2px;color:#888;margin-top:2px}
.qs-v{font-size:.62em;margin-left:5px;white-space:nowrap}.qs-v.h{color:#00FF66}.qs-v.b{color:#FF5555}.qs-v.z{color:#777}
.qs-src{font-size:.6em;color:#555;letter-spacing:1px;border-top:1px dashed #222;padding-top:7px;margin-top:auto;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}
.qs-note{font-size:.7em;color:#8a8a8a;line-height:1.4}
.qs-vide{color:#8a8a8a;font-size:.82em;line-height:1.6}
.qs-fresh{border-left:2px solid #d9a066;background:rgba(217,160,102,.07);color:#c9a070;font-size:.68em;line-height:1.45;padding:5px 9px}.qs-fresh b{color:#e0a45f;letter-spacing:1px;font-weight:normal}
@media (max-width:640px){.qs-hx{width:48px;height:53px}.qs-carte{padding:12px}}
`;
        document.head.appendChild(st);
    }

    function cartePuissance(p) {
        if (!p) return '';
        const emb = EMBLEMES[p.nom_spansh] || [String(p.nom || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(), '#00F0FF'];
        const c = emb[1], tot = Math.max(1, p.total);
        const pc = x => Math.max(1, Math.round(100 * x / tot));
        const v = p.variation;
        return '<div class="qs-carte" style="--c:' + c + ';">'
            + '<div class="qs-cap"><div class="qs-hx"><b>' + esc(emb[0]) + '</b></div><div style="min-width:0;"><div class="qs-k">MA PUISSANCE · POWERPLAY</div><div class="qs-n">' + esc(p.nom) + '</div></div>'
            + '<div class="qs-rg"><div class="g">#' + p.rang + '</div><div class="p">SUR ' + p.sur + '</div></div></div>'
            + '<div><div class="qs-gros"><span class="v">' + fmt(p.total) + '</span><span class="l">SYSTÈMES</span>' + (v ? vari(v.total) + '<span class="qs-v z">depuis le ' + esc(jj(v.depuis)) + '</span>' : '') + '</div>'
            + '<div class="qs-pile"><i style="width:' + pc(p.stronghold) + '%;background:#FFD700"></i><i style="width:' + pc(p.fortified) + '%;background:#00F0FF"></i><i style="width:' + pc(p.exploited) + '%;background:#2a6f8a"></i></div></div>'
            + '<div class="qs-et"><div><div class="v" style="color:#FFD700">' + fmt(p.stronghold) + (v ? vari(v.stronghold) : '') + '</div><div class="l">STRONGHOLD</div></div>'
            + '<div><div class="v" style="color:#00F0FF">' + fmt(p.fortified) + (v ? vari(v.fortified) : '') + '</div><div class="l">FORTIFIED</div></div>'
            + '<div><div class="v" style="color:#6fb6d0">' + fmt(p.exploited) + (v ? vari(v.exploited) : '') + '</div><div class="l">EXPLOITED</div></div></div>'
            + (p.source === 'escadron' ? '<div class="qs-note">Puissance choisie par la majorité de votre escadron (vous n’êtes pas aligné).</div>' : '')
            + (v && v.rang ? '<div class="qs-note">' + (v.rang > 0 ? '▲ gagne ' + v.rang + ' place' + (v.rang > 1 ? 's' : '') : '▼ perd ' + Math.abs(v.rang) + ' place' + (Math.abs(v.rang) > 1 ? 's' : '')) + ' depuis le ' + esc(jj(v.depuis)) + '</div>' : '')
            + '<div class="qs-src"><span>SOURCE : SPANSH (DONNÉES EDDN)</span><span>RELEVÉ DU ' + esc(jj(p.releve_le)) + '</span></div></div>';
    }

    const ICONE_FACTION = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><ellipse cx="12" cy="12" rx="10.5" ry="4.2" transform="rotate(-28 12 12)"/></svg>';
    // Corps de la carte faction (le cadre, la bande EDNews et les ids de la gazette sont statiques dans index.html)
    function corpsFaction(f) {
        const v = f && f.variation;
        if (!f) {
            return '<div class="qs-cap"><div class="qs-hx">' + ICONE_FACTION + '</div><div><div class="qs-k">MA FACTION · BGS</div><div class="qs-n">EN ATTENTE DU PREMIER RELEVÉ</div></div></div>'
                 + '<div class="qs-vide">Le relevé de la faction de votre escadron s’affichera ici dès demain matin.</div>';
        }
        return '<div class="qs-cap"><div class="qs-hx">' + ICONE_FACTION + '</div><div style="min-width:0;"><div class="qs-k">MA FACTION · BGS</div><div class="qs-n">' + esc(String(f.nom).toUpperCase()) + '</div></div>'
             + '<div class="qs-rg"><div class="g">' + fmt(f.systemes_controles) + '</div><div class="p">SYSTÈMES CONTRÔLÉS' + (v ? vari(v.systemes_controles) : '') + '</div></div></div>'
             + '<div class="qs-et"><div><div class="v">' + fmt(f.presence) + (v ? vari(v.presence) : '') + '</div><div class="l">PRÉSENCE</div></div>'
             + '<div><div class="v">' + pop(f.population) + (v ? vari(v.population, pop) : '') + '</div><div class="l">RÉSIDENTS</div></div>'
             + '<div><div class="v">' + fmt(f.stations) + (v ? vari(v.stations) : '') + '</div><div class="l">STATIONS</div></div></div>'
             + '<div class="qs-note">Résidents : population des systèmes contrôlés. Stations : celles de la faction, sans porte-vaisseaux ni chantiers.</div>'
             + fraicheur(f);
    }

    // Fraicheur des donnees : Spansh ne se met a jour que quand un joueur visite un systeme ; le jeu est plus a jour (les nombres reels peuvent etre plus eleves)
    function fraicheur(f) {
        const a = Number(f.age_median_jours);
        if (f.age_median_jours == null || isNaN(a) || a < 0) return '';
        const t = a < 1 ? 'moins d’un jour' : (a < 1.5 ? '1 jour' : Math.round(a) + ' jours');
        return '<div class="qs-fresh"><b>DONNÉES COMMUNAUTAIRES (SPANSH)</b> · âge médian : ' + t + (f.age_max_jours != null ? ', jusqu’à ' + fmt(f.age_max_jours) + ' j' : '')
             + '. Le jeu est plus à jour : les chiffres réels peuvent être plus élevés.</div>';
    }

    async function charger() {
        const now = Date.now();
        try { const s = JSON.parse(sessionStorage.getItem('edteam_suivi_cache') || 'null'); if (s && now - s.ts < DUREE) return s.d; } catch (e) {}
        if (typeof supabaseApp === 'undefined') return null;
        const { data, error } = await supabaseApp.rpc('ma_puissance_et_faction');
        if (error) { console.error('ma_puissance_et_faction :', error); return null; }
        try { sessionStorage.setItem('edteam_suivi_cache', JSON.stringify({ ts: now, d: data })); } catch (e) {}
        return data;
    }

    // Monte les deux cartes. La carte faction (statique) s'affiche pour tout membre d'escadron : elle porte aussi la bande EDNews.
    S.monter = async function (idPuissance, idFaction) {
        injecterStyle();
        const elP = document.getElementById(idPuissance), elF = document.getElementById(idFaction);
        try {
            const d = await charger();
            const moi = (typeof profilCommandant !== 'undefined' && profilCommandant) ? profilCommandant : {};
            const membre = !!(d && d.acces && (d.faction || (moi.escadron_id && String(moi.escadron_id).toUpperCase() !== 'INDEPENDANT')));
            if (elP) { const h = d && d.puissance ? cartePuissance(d.puissance) : ''; elP.innerHTML = h; elP.style.display = h ? 'block' : 'none'; }
            if (elF) {
                const corps = elF.querySelector('#qg-faction-corps'), src = elF.querySelector('#qg-faction-src');
                if (corps) corps.innerHTML = membre ? corpsFaction(d && d.faction) : '';
                if (src) src.innerHTML = (membre && d && d.faction) ? '<span>SOURCE : SPANSH (DONNÉES EDDN)</span><span>RELEVÉ DU ' + esc(jj(d.faction.releve_le)) + '</span>' : '';
                elF.style.display = membre ? 'flex' : 'none';
            }
        } catch (e) { console.error('Suivi puissance / faction :', e); }
    };
    injecterStyle();
})();
