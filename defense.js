// « OU DEFENDRE ? » (ligne DEFENSE D'INSTALLATION d'une directive de HAUSSE).
// Donnees : installations_hausse() (SQL 165 / 166 / 167) : TOUS les systemes ou la faction de la directive est en BOOM (Spansh, etats actifs), pas seulement le systeme de la directive,
// avec la distance au systeme de la directive (SQL 167) ; ceux ou un pilote a VU une installation (plugin 2.50, FSSSignalDiscovered) en detaillent les installations, les autres sont « a reperer ».
// DEUX CAS : A) systeme de la directive : l'influence de la faction y monte ET les bons gagnes se rendent a la station du systeme (Securite) ;
//            B) autre systeme en Boom : on soutient la faction mais l'influence monte la-bas ; les bons se rendent ensuite dans le systeme de la directive (Securite seulement).
//   (regle du plugin : une action n'est rattachee a une directive que si la faction ET le systeme correspondent.)
// Le PROPRIETAIRE d'une installation n'est connu d'aucune source : un pilote PASSE SUR PLACE le confirme (SQL 166) : OUI = vert, NON = barree ; sans avis : « a confirmer ».
// Texte volontairement COURT : le principe est dans un bloc replie.
(function () {
    'use strict';
    const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const db = () => window.supabaseApp || null;
    const fr = (n, d) => Number(n).toLocaleString('fr-FR', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
    const C = '#FFD23F', B = 'rgba(255,210,63,.07)', LOIN = 500;

    const CSS = `
    #df-overlay{position:fixed;inset:0;z-index:7000;background:rgba(0,0,0,.86);display:none;align-items:flex-start;justify-content:center;padding:18px;overflow-y:auto;font-family:inherit}
    #df-overlay *{box-sizing:border-box}
    .df-m{width:100%;max-width:900px;border:1px solid ${C};background:linear-gradient(180deg,${B},rgba(8,5,2,.98) 140px);box-shadow:0 0 30px ${B};color:#ccc;margin:auto 0}
    .df-tete{padding:14px 22px 12px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;border-bottom:1px solid ${C}}
    .df-tete small{color:#8a8a8a;letter-spacing:3px;font-size:.7em}
    .df-tete h2{margin:4px 0 0;font-weight:normal;color:${C};letter-spacing:3px;font-size:1.5em;text-shadow:0 0 14px ${B};line-height:1.15}
    .df-tete h2 span{display:block;color:#fff;font-size:.55em;letter-spacing:2px;margin-top:4px;text-shadow:none}
    .df-x{color:${C};font-weight:bold;cursor:pointer;font-size:1.3em;padding:2px 6px}
    .df-corps{padding:14px 22px 6px}
    .df-leg{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border:1px solid #2c2c2c;background:rgba(0,0,0,.45);padding:7px 12px;margin-bottom:6px;font-size:.8em;line-height:1.5;color:#bcb79a}
    .df-leg b{color:#fff;font-weight:normal}.df-leg .fin{margin-left:auto;color:#999;white-space:nowrap}
    .df-leg button{background:rgba(0,240,255,.1);border:1px solid #00F0FF;color:#00F0FF;padding:2px 10px;letter-spacing:1px;font-family:inherit;font-size:.9em;cursor:pointer;white-space:nowrap}
    .df-info{margin:8px 0 14px;font-size:.76em;color:#99a;line-height:1.7}.df-info summary{cursor:pointer;color:${C};letter-spacing:1px}.df-info p{margin:6px 0 0;border-left:2px solid #333;padding-left:10px}.df-info b{color:#fff;font-weight:normal}
    .df-avert{border:1px solid #e8a35a;border-left:4px solid #e8a35a;background:rgba(232,163,90,.07);padding:7px 14px;font-size:.76em;line-height:1.6;margin-bottom:12px;color:#e8c9a0}.df-avert b{color:#fff;font-weight:normal}
    .df-sys{border:1px solid #2c2c2c;border-left:4px solid ${C};background:rgba(0,0,0,.5);padding:10px 16px;margin-bottom:10px;display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:4px 16px;align-items:center}
    .df-rang{width:32px;height:32px;border-radius:50%;border:1px solid ${C};color:${C};display:grid;place-items:center;font-size:.95em}
    .df-nm b{color:#fff;font-weight:normal;font-size:1.1em;letter-spacing:2px;cursor:copy;border-bottom:1px dotted #666}
    .df-nm .tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
    .df-tg{border:1px solid #3a4650;color:#9ab;padding:1px 8px;font-size:.66em;letter-spacing:1px}.df-tg.b{border-color:#00FF66;color:#00FF66;background:rgba(0,255,102,.08)}.df-tg.c{border-color:${C};color:${C}}.df-tg.d{border-color:#00F0FF;color:#00F0FF}
    .df-dt{text-align:right;font-size:.78em;line-height:1.5;color:#999}.df-dt b{color:#fff;font-weight:normal;font-size:1.15em}
    .df-inst{grid-column:2/4;margin-top:2px;border-top:1px solid #262626;padding-top:6px;font-size:.78em;line-height:1.9}
    .df-inst .l{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center}
    .df-inst .l b{color:#fff;font-weight:normal;letter-spacing:1px;cursor:copy;border-bottom:1px dotted #666}
    .df-inst .l.no b{text-decoration:line-through;color:#777;border-bottom-color:#444;cursor:default}.df-inst .l.no{opacity:.75}
    .df-av{display:inline-flex;gap:6px;align-items:center;flex-wrap:wrap}
    .df-ok{color:#00FF66;border:1px solid #00FF66;background:rgba(0,255,102,.08);padding:0 7px;font-size:.85em;letter-spacing:1px}
    .df-ko{color:#ff6b6b;border:1px solid #ff6b6b;background:rgba(255,80,80,.07);padding:0 7px;font-size:.85em;letter-spacing:1px}
    .df-q{color:#bfae6a}
    .df-bt{background:transparent;font-family:inherit;font-size:.9em;letter-spacing:1px;padding:1px 9px;cursor:pointer}
    .df-bt.o{border:1px solid #00FF66;color:#00FF66}.df-bt.n{border:1px solid #ff6b6b;color:#ff6b6b}.df-bt.s{border:0;color:#777;text-decoration:underline;padding:0 4px}.df-bt:disabled{opacity:.4;cursor:wait}
    .df-grp{margin:14px 0 8px;color:#aaa;letter-spacing:3px;font-size:.72em;display:flex;gap:10px;align-items:center;flex-wrap:wrap}.df-grp b{color:${C};font-weight:normal}.df-grp span{letter-spacing:.5px;color:#888}
    .df-chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}
    .df-chip{border:1px solid #2c2c2c;border-left:3px solid #00F0FF;background:rgba(0,0,0,.45);padding:4px 10px;font-size:.78em;line-height:1.5}
    .df-chip b{color:#fff;font-weight:normal;letter-spacing:1px;cursor:copy;border-bottom:1px dotted #666}.df-chip span{color:#888;margin-left:8px}.df-chip.c{border-left-color:${C}}
    .df-loin{margin:6px 0 10px;font-size:.76em;color:#888}.df-loin summary{cursor:pointer}.df-loin .df-chips{margin-top:8px}
    .df-msg{padding:26px 18px;text-align:center;color:#aaa;line-height:1.7}.df-msg b{color:${C};letter-spacing:2px;font-weight:normal;display:block;margin-bottom:6px}
    .df-spin{display:inline-block;width:14px;height:14px;border:2px solid ${C};border-top-color:transparent;border-radius:50%;animation:dfTourne .9s linear infinite;vertical-align:-2px;margin-right:8px}
    @keyframes dfTourne{to{transform:rotate(360deg)}}
    .df-pied{padding:4px 22px 14px;color:#666;font-size:.7em;line-height:1.6}
    @media (prefers-reduced-motion:reduce){.df-spin{animation:none}}
    @media (max-width:760px){#df-overlay{padding:8px}.df-corps{padding:10px 12px 4px}.df-tete,.df-pied{padding-left:12px;padding-right:12px}.df-sys{grid-template-columns:1fr}.df-inst{grid-column:1}.df-dt{text-align:left}.df-leg .fin{margin-left:0}.df-tete h2{font-size:1.2em}}`;

    const etat = { ordre: null, systeme: '', faction: '', statut: 'EN_COURS', message: '', donnees: null, jeton: 0, erreurAvis: '', occupe: false };
    let resume = null, resumeTs = 0;      // { ordre_id: nombre de systemes en Boom } ; null = fonction absente ou erreur

    function ageH(maj) { const t = Date.parse(maj || ''); return isNaN(t) ? null : Math.max(0, (Date.now() - t) / 3600000); }
    function ageTxt(h) {
        if (h === null) return 'date inconnue';
        if (h < 1) return 'à l\'instant';
        if (h < 24) return 'il y a ' + Math.round(h) + ' h';
        const j = Math.floor(h / 24);
        return j === 1 ? 'hier' : j < 14 ? 'il y a ' + j + ' j' : 'il y a ' + Math.round(j / 7) + ' semaines';
    }
    const ouvert = () => { const o = document.getElementById('df-overlay'); return !!o && o.style.display !== 'none'; };
    function assurerDom() {
        if (!document.getElementById('df-style')) { const s = document.createElement('style'); s.id = 'df-style'; s.textContent = CSS; document.head.appendChild(s); }
        let o = document.getElementById('df-overlay');
        if (!o) {
            o = document.createElement('div'); o.id = 'df-overlay';
            o.addEventListener('click', ev => { if (ev.target === o) api.fermer(); });
            document.body.appendChild(o);
            document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && ouvert()) api.fermer(); });
        }
        return o;
    }
    const copiable = nom => '<b title="Cliquer pour copier le nom" onclick="edteamDefense.copie(this, ' + E(JSON.stringify(String(nom || ''))).replace(/&quot;/g, '&#34;') + ')">' + E(String(nom || '?').toUpperCase()) + '</b>';
    const argJs = x => E(JSON.stringify(x)).replace(/&quot;/g, '&#34;');
    const dist = s => s.distance != null && !isNaN(Number(s.distance)) ? Number(s.distance) : null;
    const distTxt = s => dist(s) === null ? '' : (dist(s) < 0.05 ? '' : fr(dist(s), dist(s) < 100 ? 1 : 0) + ' al');
    const estCible = x => String(x.systeme || '').trim().toLowerCase() === String(etat.systeme).trim().toLowerCase();
    const confirmees = s => (s.installations || []).filter(i => i.avis === 'OUI').length, ecartees = s => (s.installations || []).filter(i => i.avis === 'NON').length;
    const toutEcartee = s => (s.installations || []).length > 0 && ecartees(s) === (s.installations || []).length;
    const effet = s => estCible(s) ? '<span class="df-tg b">INFLUENCE + BONS</span>' : '<span class="df-tg d">BONS SEULEMENT</span>';

    // une installation : avis du pilote (vert / barree) ou question OUI / NON pour un pilote passe sur place
    function ligneInstallation(s, i) {
        const nom = copiable(i.nom), fac = E(String(etat.faction).toUpperCase());
        const bt = (oui, lib, cl) => '<button type="button" class="df-bt ' + cl + '" onclick="edteamDefense.avis(' + argJs(s.adresse) + ', ' + argJs(String(i.nom)) + ', ' + (oui ? 'true' : 'false') + ')"' + (etat.occupe ? ' disabled' : '') + '>' + lib + '</button>';
        const par = i.avis_par ? ' · CMDR ' + E(String(i.avis_par).toUpperCase()) : '';
        if (i.avis === 'OUI') return '<div class="l">' + nom + '<span class="df-av"><span class="df-ok">✓ CONFIRMÉE' + par + '</span>' + (i.moi_vu ? bt(false, 'plus la sienne', 's') : '') + '</span></div>';
        if (i.avis === 'NON') return '<div class="l no">' + nom + '<span class="df-av"><span class="df-ko">✗ PAS À ' + fac + par + '</span>' + (i.moi_vu ? bt(true, 'corriger', 's') : '') + '</span></div>';
        if (i.moi_vu) return '<div class="l">' + nom + '<span class="df-av"><span class="df-q">À ' + fac + ' ?</span>' + bt(true, '✓ OUI', 'o') + bt(false, '✗ NON', 'n') + '</span></div>';
        return '<div class="l">' + nom + '<span class="df-av" title="Seul un pilote passé dans ce système avec le plugin peut répondre OUI ou NON."><span class="df-q">à confirmer sur place</span></span></div>';
    }
    function fiche(s, k) {
        const inst = s.installations || [], tout = toutEcartee(s), nc = confirmees(s), attente = (s.en_attente || []).filter(x => x !== 'Boom');
        return '<div class="df-sys"' + (tout ? ' style="opacity:.55;border-left-color:#555"' : '') + '><div class="df-rang">' + (k + 1) + '</div>'
            + '<div class="df-nm">' + copiable(s.systeme) + '<div class="tags"><span class="df-tg b">▲ BOOM</span>' + effet(s)
            + (nc ? '<span class="df-tg b">' + nc + ' CONFIRMÉE' + (nc > 1 ? 'S' : '') + '</span>' : '') + (tout ? '<span class="df-tg">TOUTES ÉCARTÉES</span>' : '')
            + attente.map(x => '<span class="df-tg">' + E(String(x).toUpperCase()) + ' À VENIR</span>').join('') + '</div></div>'
            + '<div class="df-dt"><b>' + (s.influence != null ? fr(Number(s.influence) * 100, 1) + ' %' : '?') + '</b><br>' + (distTxt(s) ? E(distTxt(s)) + ' · ' : '') + 'état ' + E(ageTxt(ageH(s.spansh_maj))) + '</div>'
            + '<div class="df-inst">' + inst.map(i => ligneInstallation(s, i)).join('') + '</div></div>';
    }
    const puce = x => '<div class="df-chip' + (estCible(x) ? ' c' : '') + '">' + copiable(x.systeme) + '<span>' + [distTxt(x), x.influence != null ? fr(Number(x.influence) * 100, 1) + ' %' : '', estCible(x) ? 'directive' : ''].filter(Boolean).join(' · ') + '</span></div>';

    function objectifSecurite() {
        const QJ = window.EdteamQuotas, Qd = (window.cacheQuotasBgs || {})[etat.ordre], l = QJ && Qd && QJ.lignes ? (QJ.lignes('HAUSSE', Qd) || []).find(x => x.ty === 'SECURITE') : null;
        return l && l.q ? '<span class="fin">Ton quota Sécurité : <b>' + E(QJ.val('SECURITE', l.s)) + ' / ' + E(QJ.val('SECURITE', l.q)) + '</b></span>' : '';
    }
    function corps() {
        if (etat.statut === 'ERREUR' && !etat.donnees) return '<div class="df-msg"><b>LECTURE IMPOSSIBLE</b>' + E(etat.message || 'Réessayez dans quelques minutes.') + '</div>';
        if (!etat.donnees) return '<div class="df-msg"><span class="df-spin"></span>Lecture des systèmes…</div>';
        const fac = E(String(etat.faction).toUpperCase()), sy = E(String(etat.systeme).toUpperCase());
        const liste = (etat.donnees.systemes || []).slice().sort((a, b) => (toutEcartee(a) ? 1 : 0) - (toutEcartee(b) ? 1 : 0) || (estCible(a) ? 0 : 1) - (estCible(b) ? 0 : 1) || (confirmees(b) > 0 ? 1 : 0) - (confirmees(a) > 0 ? 1 : 0)
            || (dist(a) === null ? 1e9 : dist(a)) - (dist(b) === null ? 1e9 : dist(b)) || String(a.systeme).localeCompare(String(b.systeme), 'fr'));
        const loin = x => dist(x) !== null && dist(x) > LOIN && !estCible(x);
        const proches = liste.filter(x => !loin(x)), lointains = liste.filter(loin);
        const avec = proches.filter(x => (x.installations || []).length), sans = proches.filter(x => !(x.installations || []).length);
        const legende = '<div class="df-leg"><span class="df-tg b">INFLUENCE + BONS</span><span>dans <b>' + sy + '</b> : l\'influence monte, rends les bons à la station.</span></div>'
            + '<div class="df-leg"><span class="df-tg d">BONS SEULEMENT</span><span>ailleurs : rends les bons dans <b>' + sy + '</b> pour ta Sécurité.</span>'
            + (window.edteamRendre ? '<button type="button" onclick="edteamDefense.versBons()">🛡️ OÙ RENDRE LES BONS ?</button>' : '') + objectifSecurite() + '</div>'
            + '<details class="df-info"><summary>ⓘ Comment ça marche ?</summary><p>Quand <b>' + fac + '</b> est en <b>Boom</b> et possède une installation, un scénario de <b>raid</b> peut s\'y lancer : choisis la <b>défense</b> pour la soutenir. '
            + 'Les bons de combat gagnés sont émis par la faction. Aucune source ne liste les installations à l\'avance : elles sont repérées automatiquement à l\'arrivée d\'un pilote dans le système (plugin lancé). Le jeu n\'indique pas non plus à qui elles appartiennent : ce même pilote lit la fiche dans le jeu et répond ✓ OUI (verte) ou ✗ NON (barrée). '
            + 'La fenêtre ne dit pas si un raid est en cours.</p></details>' + (etat.erreurAvis ? '<div class="df-avert"><b>Avis non enregistré :</b> ' + E(etat.erreurAvis) + '</div>' : '');
        if (!liste.length) return legende + '<div class="df-msg"><b>AUCUN SYSTÈME EN BOOM</b>' + fac + ' n\'est en Boom nulle part d\'après Spansh : aucun raid possible. Les bons de la faction rendus dans ' + sy + ' comptent toujours pour ta Sécurité.</div>';
        let h = legende;
        if (avec.length) h += '<div class="df-grp"><b>INSTALLATIONS REPÉRÉES</b><span>' + avec.length + ' système' + (avec.length > 1 ? 's' : '') + (avec.some(x => (x.installations || []).some(i => !i.avis)) ? ' · propriétaire à confirmer sur place : le pilote qui y est passé répond ✓ OUI / ✗ NON' : '') + '</span></div>' + avec.map(fiche).join('');
        if (sans.length) h += '<div class="df-grp"><b>EN BOOM · INSTALLATIONS INCONNUES</b><span>' + sans.length + ' · arrive dans le système : le plugin repère seul les installations (il peut n\'y en avoir aucune)</span></div><div class="df-chips">' + sans.map(puce).join('') + '</div>';
        if (lointains.length) h += '<details class="df-loin"><summary>' + lointains.length + ' système' + (lointains.length > 1 ? 's' : '') + ' en Boom à plus de ' + LOIN + ' al</summary><div class="df-chips">' + lointains.map(puce).join('') + '</div></details>';
        return h;
    }
    function rendre() {
        const o = assurerDom(), d = etat.donnees, n = d && d.systemes ? d.systemes.length : null;
        o.innerHTML = '<div class="df-m"><div class="df-tete"><div><small>DIRECTIVE #' + E(etat.ordre) + ' · HAUSSE · DÉFENSE D\'INSTALLATION</small>'
            + '<h2>&gt; OÙ DÉFENDRE ?<span>' + E(String(etat.faction).toUpperCase()) + (n !== null ? ' · en Boom dans ' + n + ' système' + (n > 1 ? 's' : '') : '') + '</span></h2></div>'
            + '<span class="df-x" onclick="edteamDefense.fermer()">✕</span></div><div class="df-corps">' + corps() + '</div>'
            + '<div class="df-pied">Sources : Spansh' + (d && d.releve_le ? ' (relevé ' + E(ageTxt(ageH(d.releve_le))) + ', toutes les 6 h)' : '') + ' · installations vues par les pilotes de SYS.EDTEAM.</div></div>';
        o.style.display = 'flex';
    }
    async function charger() {
        const jeton = ++etat.jeton, c = db();
        if (!c) { etat.statut = 'ERREUR'; etat.message = 'Connexion indisponible.'; rendre(); return; }
        let r;
        try { r = await c.rpc('installations_hausse', { p_ordre: Number(etat.ordre) }); } catch (e) { r = { error: { message: 'Connexion impossible.' } }; }
        if (jeton !== etat.jeton || !ouvert()) return;
        if (r.error || !r.data) { etat.statut = 'ERREUR'; etat.message = (r.error && r.error.message) || 'Réponse vide.'; etat.donnees = null; rendre(); return; }
        etat.statut = 'PRET'; etat.donnees = r.data; rendre();
    }

    const api = {
        ouvrir(ordreId, systeme, faction) {
            if (typeof sonClic === 'function') sonClic();
            Object.assign(etat, { ordre: ordreId, systeme: systeme || '', faction: faction || '', statut: 'EN_COURS', message: '', donnees: null, erreurAvis: '' });
            rendre(); charger();
        },
        fermer() { etat.jeton++; const o = document.getElementById('df-overlay'); if (o) { o.style.display = 'none'; o.innerHTML = ''; } },
        // avis d'un pilote passe sur place : oui = installation de la faction de la directive, non = elle est barree
        async avis(adresse, nom, oui) {
            const c = db(); if (!c || etat.occupe) return;
            if (typeof sonClic === 'function') sonClic();
            etat.occupe = true; etat.erreurAvis = ''; rendre();
            let r; try { r = await c.rpc('installation_confirmer', { p_ordre: Number(etat.ordre), p_adresse: String(adresse), p_nom: String(nom), p_oui: !!oui }); } catch (e) { r = { error: { message: 'Connexion impossible.' } }; }
            etat.occupe = false; resumeTs = 0;
            if (r.error) { etat.erreurAvis = r.error.message || 'Réessayez dans quelques minutes.'; rendre(); return; }
            charger();
        },
        // une seule lecture pour toutes les directives (memoire 2 minutes) ; a appeler avant d'afficher les lignes du quota
        async precharger(force) {
            const c = db(); if (!c) return null;
            if (!force && resumeTs && Date.now() - resumeTs < 120000) return resume;
            try {
                const r = await c.rpc('installations_hausse_resume');
                if (r && !r.error && Array.isArray(r.data)) { resume = {}; r.data.forEach(x => { resume[x.ordre_id] = Number(x.nb) || 0; }); } else resume = null;
            } catch (e) { resume = null; }
            resumeTs = Date.now(); return resume;
        },
        // ouvre « Ou rendre les bons ? » de la meme directive (les bons gagnes pendant un scenario comptent pour la Securite)
        versBons() { const o = { ordre: etat.ordre, systeme: etat.systeme, faction: etat.faction }; api.fermer(); if (window.edteamRendre) window.edteamRendre.ouvrir('bons', o.ordre, o.systeme, o.faction); },
        // true si le compte par directive a pu etre lu (sinon le texte de la ligne ne chiffre rien)
        connu() { return resume !== null; },
        // nombre de systemes en Boom (hors ceux dont toutes les installations vues sont ecartees) pour cette directive
        nb(ordre) { return resume && ordre ? Number(resume[ordre.id]) || 0 : 0; },
        copie(el, txt) {
            const fait = () => { const old = el.textContent; el.textContent = 'COPIÉ'; setTimeout(() => { el.textContent = old; }, 900); };
            try { navigator.clipboard.writeText(String(txt)).then(fait, () => { }); } catch (e) { /* presse-papiers indisponible */ }
        },
        // bouton de la ligne DEFENSE D'INSTALLATION d'une directive de hausse en cours ; vide pour les autres
        bouton(ordre, classe) {
            if (!ordre || String(ordre.type_ordre || '').toUpperCase() !== 'HAUSSE' || String(ordre.statut || 'ACTIF').toUpperCase() !== 'ACTIF' || !ordre.systeme_cible || !ordre.faction_cible) return '';
            const arg = [ordre.id, ordre.systeme_cible, ordre.faction_cible].map(x => E(JSON.stringify(x)).replace(/&quot;/g, '&#34;')).join(', ');
            const pad = classe === 'compact' ? 'padding: 2px 8px; font-size: 0.85em; letter-spacing: 0;' : 'padding: 7px 14px; font-size: 0.8em; letter-spacing: 2px;';
            return '<button type="button" class="' + (classe || '') + '" onclick="event.stopPropagation(); edteamDefense.ouvrir(' + arg + ')" style="background: rgba(255,210,63,0.1); border: 1px solid ' + C + '; color: ' + C + '; ' + pad + ' font-family: inherit; cursor: pointer; white-space: nowrap; box-shadow: 0 0 10px rgba(255,210,63,0.2);">🛡️ OÙ DÉFENDRE ?</button>';
        }
    };
    window.edteamDefense = api;
})();
