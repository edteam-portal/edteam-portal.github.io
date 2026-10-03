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

    // Portraits des Powers (images officielles reduites : images/powers/*.webp ; mention de Frontier dans le pied de page).
    // Jerome Archer, Nakato Kaine et Yuri Grom n'ont pas de portrait dans la source : ils gardent le monogramme.
    const PORTRAITS = { 'Aisling Duval': 'aisling-duval', 'Archon Delaine': 'archon-delaine', 'A. Lavigny-Duval': 'a-lavigny-duval', 'Denton Patreus': 'denton-patreus',
                        'Edmund Mahon': 'edmund-mahon', 'Felicia Winters': 'felicia-winters', 'Li Yong-Rui': 'li-yong-rui', 'Pranav Antal': 'pranav-antal', 'Zemina Torval': 'zemina-torval' };

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
.qs-carte{--c:#00F0FF;--bdc:color-mix(in srgb,var(--c) 60%,transparent);position:relative;flex:1 1 auto;min-width:0;box-sizing:border-box;border:1px solid color-mix(in srgb,var(--c) 60%,transparent);padding:11px 14px 8px;display:flex;flex-direction:column;gap:7px;font-family:'Share Tech Mono',monospace;color:#ccc;
  background:linear-gradient(135deg,color-mix(in srgb,var(--c) 10%,transparent),rgba(5,3,1,.92) 60%);clip-path:polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)}
.qs-carte:after{content:"";position:absolute;inset:0;pointer-events:none;z-index:4;background:linear-gradient(to bottom right,transparent calc(50% - 1px),var(--bdc) calc(50% - 1px),var(--bdc) calc(50% + 1px),transparent calc(50% + 1px)) left top/14px 14px no-repeat,linear-gradient(to bottom right,transparent calc(50% - 1px),var(--bdc) calc(50% - 1px),var(--bdc) calc(50% + 1px),transparent calc(50% + 1px)) right bottom/14px 14px no-repeat}
.qs-carte:before{content:"";position:absolute;top:0;left:14px;width:50px;height:3px;background:var(--c);box-shadow:0 0 10px var(--c)}
.qs-cap{display:flex;align-items:center;gap:12px}
.qs-hx{width:52px;height:57px;flex:none;display:grid;place-items:center;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);background:linear-gradient(160deg,var(--c),transparent 120%);position:relative}
.qs-hx:before{content:"";position:absolute;inset:2px;clip-path:inherit;background:rgba(6,4,2,.94)}
.qs-hx b{position:relative;color:var(--c);font-size:1.2em;letter-spacing:1px;text-shadow:0 0 10px var(--c)}
.qs-hx svg{position:relative;width:26px;height:26px;stroke:var(--c);fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.qs-k{font-size:.62em;letter-spacing:3px;color:var(--c)}
.qs-n{color:#fff;font-size:1.1em;letter-spacing:2px;margin-top:2px;overflow-wrap:anywhere}
.qs-rg{margin-left:auto;text-align:right;flex:none}.qs-rg .g{font-size:1.8em;color:var(--c);line-height:1;text-shadow:0 0 12px color-mix(in srgb,var(--c) 50%,transparent)}.qs-rg .p{font-size:.62em;color:#888;letter-spacing:1px;margin-top:2px}
.qs-gros{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}.qs-gros .v{color:#fff;font-size:1.5em}.qs-gros .l{color:#888;font-size:.7em;letter-spacing:2px}
.qs-pile{display:flex;height:8px;gap:2px;margin-top:5px}.qs-pile i{display:block;height:100%}
.qs-et{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.qs-et .v{color:#fff;font-size:1.12em;line-height:1.1;white-space:nowrap}.qs-et .l{font-size:.6em;letter-spacing:2px;color:#888;margin-top:2px}
.qs-v{font-size:.62em;margin-left:5px;white-space:nowrap}.qs-v.h{color:#00FF66}.qs-v.b{color:#FF5555}.qs-v.z{color:#777}
.qs-src{font-size:.6em;color:#555;letter-spacing:1px;border-top:1px dashed #222;padding-top:5px;margin-top:auto;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}
.qs-note{font-size:.7em;color:#8a8a8a;line-height:1.4}
.qs-vide{color:#8a8a8a;font-size:.82em;line-height:1.6}
.qs-carte.qs-fgrid{display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto 1fr auto;grid-template-areas:"haut" "stats" "src";gap:7px;align-items:stretch}
.qs-fgrid #qg-faction-haut{grid-area:haut;display:flex;align-items:center;gap:10px;min-width:0}.qs-fgrid #qg-faction-cap{flex:1;min-width:0}
.qs-fgrid #qg-faction-stats{grid-area:stats;display:flex;flex-direction:column;justify-content:center;min-width:0}.qs-fgrid #qg-faction-src{grid-area:src}
.qs-tuiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.qs-fgrid #qg-faction-stats{container-type:inline-size}
@container (max-width:455px){.qs-tuiles{grid-template-columns:repeat(2,minmax(0,1fr))}}
.qs-t{border:1px solid color-mix(in srgb,var(--c) 38%,transparent);background:rgba(0,0,0,.35);padding:7px 8px;display:flex;flex-direction:column;justify-content:center;min-width:0}
.qs-t .v{color:#fff;font-size:1.3em;overflow:hidden;text-overflow:ellipsis;line-height:1.1;white-space:nowrap}.qs-t .l{font-size:.58em;letter-spacing:2px;color:#888;margin-top:3px}
#banner-gazette{transition:border-color .2s,background .2s,box-shadow .2s}
#banner-gazette:hover{border-color:#00F0FF!important;background:linear-gradient(135deg,rgba(0,240,255,.34),rgba(0,0,0,.4))!important;box-shadow:0 0 14px rgba(0,240,255,.45)}
#banner-gazette:active{background:linear-gradient(135deg,rgba(0,240,255,.5),rgba(0,0,0,.35))!important}
.qs-ap{font-size:.6em;color:#8a8a8a;margin-right:4px;vertical-align:.25em}
.qs-t.cle .v{color:var(--c)}
.qs-t .qs-v{display:block;margin:3px 0 0}
.qs-carte.qs-pf{flex-direction:row;gap:0;padding:0;align-items:stretch}
.qs-portrait{position:relative;flex:none;width:122px;border-right:1px solid color-mix(in srgb,var(--c) 55%,transparent);overflow:hidden;background:#05080a}
.qs-portrait img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top center}
.qs-portrait:after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,transparent 55%,rgba(5,3,1,.7)),linear-gradient(0deg,rgba(5,3,1,.55),transparent 32%),linear-gradient(180deg,color-mix(in srgb,var(--c) 14%,transparent),transparent 30%)}
.qs-logo{width:60px;height:60px;flex:none;display:grid;place-items:center;border:1px solid color-mix(in srgb,var(--c) 55%,transparent);background:rgba(6,4,2,.94);padding:3px}.qs-logo img{max-width:100%;max-height:100%;object-fit:contain;display:block}
.qs-logoligne{display:flex;align-items:center;gap:8px;margin-top:4px}.qs-amiral{font-size:.58em;letter-spacing:2px;color:#8a8a8a;white-space:nowrap}
.qs-btnlogo{display:block;white-space:nowrap;background:none;border:1px solid color-mix(in srgb,var(--c) 45%,transparent);color:var(--c);font:inherit;font-size:.95em;letter-spacing:1px;padding:1px 7px;cursor:pointer}.qs-btnlogo:hover{background:color-mix(in srgb,var(--c) 18%,transparent)}.qs-btnlogo[disabled]{opacity:.5;cursor:wait}
.qs-carte.qs-flogo{padding:0;grid-template-columns:122px minmax(0,1fr);grid-template-areas:"logo haut" "logo stats" "logo src";column-gap:0}
.qs-flogo #qg-faction-logo{grid-area:logo;position:relative;border-right:1px solid color-mix(in srgb,var(--c) 55%,transparent);background:#05080a;display:grid;place-items:center;padding:12px;overflow:hidden}
.qs-flogo #qg-faction-logo img{max-width:100%;max-height:100%;object-fit:contain;display:block;position:relative}
.qs-flogo #qg-faction-logo:after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,color-mix(in srgb,var(--c) 14%,transparent),transparent 30%)}
.qs-flogo #qg-faction-haut{padding:11px 14px 0 14px}.qs-flogo #qg-faction-stats{padding:0 14px}.qs-flogo #qg-faction-src{margin:0 14px 8px}
.qs-flogo #qg-faction-logo{padding:12px 12px 64px}
.qs-flogo #banner-gazette{position:absolute!important;left:8px;bottom:8px;width:calc(122px - 16px);min-width:0!important;padding:5px 7px!important;gap:6px!important;z-index:5;box-sizing:border-box}.qs-flogo #banner-gazette>span:first-child{font-size:1.05em!important}.qs-flogo #banner-gazette>div{min-width:0}.qs-flogo #banner-gazette>div>div:last-child{white-space:normal;line-height:1.15;font-size:.52em!important;letter-spacing:0}
@media (max-width:1500px){.qs-carte.qs-flogo{grid-template-columns:104px minmax(0,1fr)}.qs-flogo #banner-gazette{width:calc(104px - 16px)}}
@media (max-width:640px){.qs-carte.qs-flogo{grid-template-columns:84px minmax(0,1fr)}}
.qs-mid{flex:1 1 auto;display:flex;flex-direction:column;justify-content:center;gap:7px;min-width:0}
.qs-corps{flex:1;min-width:0;padding:11px 14px 8px;display:flex;flex-direction:column;gap:7px}
@media (max-width:640px){.qs-hx{width:48px;height:53px}.qs-carte{padding:12px}.qs-carte.qs-pf{padding:0}.qs-portrait{width:84px}}
`;
        document.head.appendChild(st);
    }

    function cartePuissance(p) {
        if (!p) return '';
        const emb = EMBLEMES[p.nom_spansh] || [String(p.nom || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(), '#00F0FF'];
        const c = emb[1], tot = Math.max(1, p.total);
        const pc = x => Math.max(1, Math.round(100 * x / tot));
        const v = p.variation;
        const slug = PORTRAITS[p.nom_spansh];
        const hex = slug ? '' : '<div class="qs-hx"><b>' + esc(emb[0]) + '</b></div>';
        const interne = '<div class="qs-cap">' + hex + '<div style="min-width:0;"><div class="qs-k">MA PUISSANCE · POWERPLAY</div><div class="qs-n">' + esc(p.nom) + '</div></div>'
            + '<div class="qs-rg"><div class="g">#' + p.rang + '</div><div class="p">SUR ' + p.sur + '</div></div></div>'
            + '<div class="qs-mid"><div><div class="qs-gros"><span class="v">' + fmt(p.total) + '</span><span class="l">SYSTÈMES</span>' + (v ? vari(v.total) + '<span class="qs-v z">depuis le ' + esc(jj(v.depuis)) + '</span>' : '') + '</div>'
            + '<div class="qs-pile"><i style="width:' + pc(p.stronghold) + '%;background:#FFD700"></i><i style="width:' + pc(p.fortified) + '%;background:#00F0FF"></i><i style="width:' + pc(p.exploited) + '%;background:#2a6f8a"></i></div></div>'
            + '<div class="qs-et"><div><div class="v" style="color:#FFD700">' + fmt(p.stronghold) + (v ? vari(v.stronghold) : '') + '</div><div class="l">STRONGHOLD</div></div>'
            + '<div><div class="v" style="color:#00F0FF">' + fmt(p.fortified) + (v ? vari(v.fortified) : '') + '</div><div class="l">FORTIFIED</div></div>'
            + '<div><div class="v" style="color:#6fb6d0">' + fmt(p.exploited) + (v ? vari(v.exploited) : '') + '</div><div class="l">EXPLOITED</div></div></div>'
            + (p.source === 'escadron' ? '<div class="qs-note">Puissance choisie par la majorité de votre escadron (vous n’êtes pas aligné).</div>' : '')
            + (v && v.rang ? '<div class="qs-note">' + (v.rang > 0 ? '▲ gagne ' + v.rang + ' place' + (v.rang > 1 ? 's' : '') : '▼ perd ' + Math.abs(v.rang) + ' place' + (Math.abs(v.rang) > 1 ? 's' : '')) + ' depuis le ' + esc(jj(v.depuis)) + '</div>' : '')
            + '</div><div class="qs-src"><span>SOURCE : SPANSH (DONNÉES EDDN)</span><span>RELEVÉ DU ' + esc(jj(p.releve_le)) + '</span></div>';
        if (!slug) return '<div class="qs-carte" style="--c:' + c + ';">' + interne + '</div>';
        return '<div class="qs-carte qs-pf" style="--c:' + c + ';"><div class="qs-portrait"><img src="images/powers/' + slug + '.webp" alt="Portrait de ' + esc(p.nom) + '" loading="lazy"></div><div class="qs-corps">' + interne + '</div></div>';
    }

    const ICONE_FACTION = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><ellipse cx="12" cy="12" rx="10.5" ry="4.2" transform="rotate(-28 12 12)"/></svg>';
    // Corps de la carte faction (le cadre, la bande EDNews et les ids de la gazette sont statiques dans index.html)
    function logoUrl(l) {
        try { return supabaseApp.storage.from('logos').getPublicUrl(l.chemin).data.publicUrl + '?v=' + encodeURIComponent(l.version); } catch (e) { return ''; }
    }
    function capFaction(f, logo, peut) {
        const v = f && f.variation;
        const url = logo && logo.chemin ? logoUrl(logo) : '';
        const ico = url ? '' : '<div class="qs-hx">' + ICONE_FACTION + '</div>';
        if (!f) return '<div class="qs-cap"><div class="qs-hx">' + ICONE_FACTION + '</div><div><div class="qs-k">MA FACTION · BGS</div><div class="qs-n">EN ATTENTE DU PREMIER RELEVÉ</div></div></div>';
        return '<div class="qs-cap">' + ico + '<div style="min-width:0;"><div class="qs-k">MA FACTION · BGS</div><div class="qs-n">' + esc(String(f.nom).toUpperCase()) + '</div>'
             + (peut ? '<div class="qs-logoligne"><button type="button" class="qs-btnlogo" id="qs-logo-btn" title="Réservé à l’Amiral : image carrée de préférence, redimensionnée automatiquement">' + (logo && logo.chemin ? '✎ LOGO' : '+ LOGO') + '</button><input type="file" id="qs-logo-file" accept="image/png,image/jpeg,image/webp" style="display:none"><span class="qs-amiral">AMIRAL UNIQUEMENT</span></div>' : '') + '</div></div>';
    }
    function statsFaction(f) {
        const v = f && f.variation;
        if (!f) return '<div class="qs-vide">Le relevé de la faction de votre escadron s’affichera ici dès demain matin.</div>';
        const t = (cls, val, lib, va, unite) => '<div class="qs-t ' + cls + '"><div class="v"><span class="qs-ap">≈</span>' + val + (v ? vari(va, unite) : '') + '</div><div class="l">' + lib + '</div></div>';
        return '<div class="qs-tuiles" title="Chiffres estimés d’après Spansh : cette base ne met un système à jour que lorsqu’un joueur le visite (EDDN). Elle peut donc être en retard sur le jeu, surtout pour les petits systèmes peu visités (la présence et les résidents sont les plus concernés). Le panneau de faction en jeu reste la référence.">' + t('cle', fmt(f.systemes_controles), 'CONTRÔLÉS', v && v.systemes_controles) + t('', fmt(f.presence), 'PRÉSENCE', v && v.presence)
             + t('', pop(f.population), 'RÉSIDENTS', v && v.population, pop) + t('', fmt(f.stations), 'STATIONS', v && v.stations) + '</div>';
    }

    // Ligne de source de la faction + fraicheur : Spansh ne met un systeme a jour que lorsqu’un joueur le visite (EDDN). On compte les systemes a jour depuis 3 jours
    // (la mediane d’age etait trompeuse : de petites colonies jamais visitees tiraient le chiffre vers le haut alors que le flux est vivant).
    function ligneSourceFaction(f) {
        let frais = '';
        if (f.maj_3j != null && !isNaN(Number(f.maj_3j)) && Number(f.systemes_controles) > 0) {
            frais = ' · <span style="color:#d9a066;" title="Spansh ne met un système à jour que lorsqu’un joueur le visite (EDDN). Les autres systèmes gardent leur dernier relevé : le jeu est plus à jour, les chiffres réels peuvent être plus élevés.">'
                  + fmt(f.maj_3j) + '/' + fmt(f.systemes_controles) + ' SYSTÈMES À JOUR (3 J)</span>';
        }
        return '<span style="white-space:nowrap">SOURCE : SPANSH' + frais + '</span><span style="white-space:nowrap">RELEVÉ DU ' + esc(jj(f.releve_le)) + '</span>';
    }

    async function charger() {
        const now = Date.now();
        try { const s = JSON.parse(sessionStorage.getItem('edteam_suivi_cache') || 'null'); if (s && now - s.ts < DUREE && s.d && ('peut_logo' in s.d)) return s.d; } catch (e) {}
        if (typeof supabaseApp === 'undefined') return null;
        const { data, error } = await supabaseApp.rpc('ma_puissance_et_faction');
        if (error) { console.error('ma_puissance_et_faction :', error); return null; }
        try { sessionStorage.setItem('edteam_suivi_cache', JSON.stringify({ ts: now, d: data })); } catch (e) {}
        return data;
    }

    // Monte les deux cartes. La carte faction (statique) s'affiche pour tout membre d'escadron : elle porte aussi la bande EDNews.
    // Le logo est redimensionne ici (256 px maximum, webp) avant l'envoi : quelques Ko, mis en cache par le navigateur (adresse versionnee)
    function redimensionner(fichier) {
        return new Promise((ok, ko) => {
            const u = URL.createObjectURL(fichier), im = new Image();
            im.onload = () => {
                const k = Math.min(1, 256 / Math.max(im.width, im.height)), w = Math.max(1, Math.round(im.width * k)), h = Math.max(1, Math.round(im.height * k));
                const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(im, 0, 0, w, h); URL.revokeObjectURL(u);
                cv.toBlob(b => b ? ok(b) : ko(new Error('conversion impossible')), 'image/webp', 0.9);
            };
            im.onerror = () => { URL.revokeObjectURL(u); ko(new Error('image illisible')); };
            im.src = u;
        });
    }
    function nomLogo(esc_id) { return String(esc_id || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '.webp'; }
    async function envoyerLogo(fichier, moi, rafraichir) {
        const btn = document.getElementById('qs-logo-btn');
        try {
            if (btn) { btn.disabled = true; btn.textContent = 'ENVOI…'; }
            const blob = await redimensionner(fichier);
            const nom = nomLogo(moi.escadron_id);
            const up = await supabaseApp.storage.from('logos').upload(nom, blob, { upsert: true, contentType: 'image/webp', cacheControl: '31536000' });
            if (up.error) throw up.error;
            const r = await supabaseApp.rpc('definir_logo_escadron');
            if (r.error) throw r.error;
            try { sessionStorage.removeItem('edteam_suivi_cache'); } catch (e) {}
            await rafraichir();
        } catch (e) {
            console.error('Logo escadron :', e);
            alert('Le logo n’a pas pu être envoyé : ' + (e && e.message ? e.message : e));
            if (btn) { btn.disabled = false; btn.textContent = '✎ LOGO'; }
        }
    }

    S.monter = async function (idPuissance, idFaction) {
        injecterStyle();
        const elP = document.getElementById(idPuissance), elF = document.getElementById(idFaction);
        try {
            const d = await charger();
            const moi = (typeof profilCommandant !== 'undefined' && profilCommandant) ? profilCommandant : {};
            const membre = !!(d && d.acces && (d.faction || (moi.escadron_id && String(moi.escadron_id).toUpperCase() !== 'INDEPENDANT')));
            if (elP) { const h = d && d.puissance ? cartePuissance(d.puissance) : ''; elP.innerHTML = h; elP.style.display = h ? 'flex' : 'none'; }
            if (elF) {
                const cap = elF.querySelector('#qg-faction-cap'), stats = elF.querySelector('#qg-faction-stats'), src = elF.querySelector('#qg-faction-src');
                if (cap) cap.innerHTML = membre ? capFaction(d && d.faction, d && d.logo, !!(d && d.peut_logo)) : '';
                if (stats) stats.innerHTML = membre ? statsFaction(d && d.faction) : '';
                if (src) src.innerHTML = (membre && d && d.faction) ? ligneSourceFaction(d.faction) : '';
                const bt = cap && cap.querySelector('#qs-logo-btn'), fi = cap && cap.querySelector('#qs-logo-file');
                if (bt && fi) {
                    bt.onclick = () => fi.click();
                    fi.onchange = () => { const f = fi.files && fi.files[0]; if (!f) return; if (f.size > 8 * 1024 * 1024) { alert('Image trop lourde (8 Mo maximum).'); return; } envoyerLogo(f, moi, () => S.monter(idPuissance, idFaction)); };
                }
                // Logo de l'escadron : colonne pleine hauteur a gauche, comme le portrait de « Ma puissance »
                let lg = elF.querySelector('#qg-faction-logo');
                const url = membre && d && d.logo && d.logo.chemin ? logoUrl(d.logo) : '';
                if (url) {
                    if (!lg) { lg = document.createElement('div'); lg.id = 'qg-faction-logo'; elF.insertBefore(lg, elF.firstChild); }
                    lg.innerHTML = '<img src="' + esc(url) + '" alt="Logo de l’escadron">';
                } else if (lg) lg.remove();
                elF.classList.toggle('qs-flogo', !!url);
                elF.style.display = membre ? 'grid' : 'none';
            }
        } catch (e) { console.error('Suivi puissance / faction :', e); }
    };
    injecterStyle();
})();
