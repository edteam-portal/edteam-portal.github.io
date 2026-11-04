// ESPACE DIRECTEUR sur le MOBILE (reserve au Directeur, la base le verifie aussi) : les trois onglets de la page PC « Trombinoscope » adaptes au telephone.
//   ACCES (SQL 211) : integre a l'onglet PILOTES (valider / retirer l'acces, pilote par pilote)
//   PILOTES   : tous les comptes en cartes (pilotes_directeur, SQL 175-177) : filtres, statut, plugin, diagnostic au toucher, photo et retrait de la photo
//   USAGE     : le reseau est-il utilise ? (calcule sur l'appareil a partir de la MEME liste : aucune requete de plus)
// Charge A LA DEMANDE depuis le bouton « Espace Directeur » des Reglages. Une seule lecture de la liste des pilotes, gardee 2 minutes dans la session.
(function () {
    'use strict';
    if (window.directeurMobile) return;
    const M = window.directeurMobile = {};
    const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const client = () => (typeof supabaseApp !== 'undefined' ? supabaseApp : window.supabaseApp || null);
    const JOUR = 86400e3, TTL = 120000;
    const D = { liste: null, onglet: 'pil', q: '', esc: '', statut: '', nouv: false, sansPhoto: false, ouvert: '' };
    const STATUTS = { ACTIF: ['ACTIF 7 J', '#2fe07a'], DORMANT: ['DORMANT', '#ffb000'], JAMAIS: ['JAMAIS DE DONNÉE', '#ff6a6a'], EMAIL: ['E-MAIL NON CONFIRMÉ', '#8b97a0'], ATTENTE: ['ACCÈS À VALIDER', '#00FF66'], SAS: ['DANS LE SAS', '#00F0FF'] };
    const ROLES = { amiral: 'AMIRAL', officier: 'OFFICIER', pilote: 'PILOTE' };
    const DIAG = [['BGS', 'd_bgs', 1], ['COLONISATION', 'd_colo', 0], ['BUDGET', 'd_budget', 1], ['POWERPLAY', 'd_pp', 1], ['FIL', 'd_journal', 0], ['HANGAR', 'd_hangar', 1], ['COMBAT', 'd_combat', 0]];

    const role = p => p.est_amiral ? 'amiral' : (p.est_officier ? 'officier' : 'pilote');
    const nomEsc = p => String(p.escadron_id || '').trim() && String(p.escadron_id).toUpperCase() !== 'INDEPENDANT' ? String(p.escadron_id).toUpperCase() : 'INDÉPENDANT';
    const initiales = p => String(p.cmdr_nom || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || '?';
    function statut(p) {
        if (!p.email_confirme) return 'EMAIL';
        if (!p.est_approuve) return p.dossier ? 'ATTENTE' : 'SAS';
        if (!p.derniere_activite) return 'JAMAIS';
        return Date.now() - Date.parse(p.derniere_activite) < 7 * JOUR ? 'ACTIF' : 'DORMANT';
    }
    function ilYa(iso) {
        if (!iso) return '—';
        const j = Math.floor((Date.now() - Date.parse(iso)) / JOUR);
        return j <= 0 ? 'aujourd’hui' : j === 1 ? 'hier' : 'il y a ' + j + ' j';
    }
    function dateCourte(iso) { const d = new Date(iso); if (isNaN(d)) return '—'; const p = n => String(n).padStart(2, '0'); return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + String(d.getFullYear()).slice(2); }
    const cmpVer = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d; } return 0; };
    const versionRef = () => (D.liste || []).reduce((m, p) => p.plugin_version && cmpVer(p.plugin_version, m) > 0 ? p.plugin_version : m, '0');
    const etatCase = (p, k) => !p[k] ? 'n' : (Date.now() - Date.parse(p[k]) > 14 * JOUR ? 'o' : 'v');
    const suspect = p => p.est_approuve && p.derniere_activite && Date.now() - Date.parse(p.derniere_activite) < 14 * JOUR && DIAG.some(([, k, c]) => c && etatCase(p, k) === 'n');
    const arrete = p => p.est_approuve && (!p.derniere_activite || Date.now() - Date.parse(p.derniere_activite) >= 14 * JOUR);

    function css() {
        if (document.getElementById('dm-css')) return;
        const s = document.createElement('style'); s.id = 'dm-css';
        s.textContent = '#dm-ov{position:fixed;inset:0;z-index:7500;background:#06080b;display:flex;flex-direction:column;color:#d8dde2;font-size:15px}'
            + '#dm-ov .top{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 8px}#dm-ov .top b{font-family:Orbitron,Rajdhani,sans-serif;letter-spacing:3px;color:#00F0FF;font-size:.95em}'
            + '#dm-ov .x{width:38px;height:38px;border:1px solid #444;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;color:#bbb}'
            + '#dm-ov .tabs{display:flex;gap:6px;padding:0 12px 10px}#dm-ov .tabs button{flex:1;padding:10px 4px;background:#0c1014;border:1px solid #2a323a;color:#8b97a0;font:inherit;font-size:.72em;letter-spacing:2px;border-radius:9px}#dm-ov .tabs button.on{color:#FF7100;border-color:#FF7100;background:rgba(255,113,0,.08)}'
            + '#dm-corps{flex:1;overflow-y:auto;padding:4px 12px 28px;-webkit-overflow-scrolling:touch}'
            + '.dm-c{background:#0b0f13;border:1px solid #1f272e;border-left:4px solid var(--k,#444);border-radius:6px 14px 14px 6px;padding:11px 12px;margin-bottom:9px}'
            + '.dm-l1{display:flex;align-items:center;gap:10px}.dm-av{flex:none;width:34px;height:34px;border-radius:50%;background:#16202a;border:1px solid #2c3a46;display:flex;align-items:center;justify-content:center;font-size:.78em;color:#9fb3c4}'
            + '.dm-nom{flex:1;min-width:0;color:#fff;font-weight:bold;letter-spacing:1px;overflow-wrap:anywhere}.dm-sub{color:#8b97a0;font-size:.74em;margin-top:2px;overflow-wrap:anywhere}'
            + '.dm-tag{display:inline-block;border:1px solid var(--t,#555);color:var(--t,#aaa);font-size:.62em;letter-spacing:1.5px;padding:1px 7px;border-radius:3px;white-space:nowrap}'
            + '.dm-l2{display:flex;flex-wrap:wrap;gap:5px 8px;align-items:center;margin-top:8px;font-size:.74em;color:#9aa6b0}'
            + '.dm-det{display:none;margin-top:10px;padding-top:9px;border-top:1px dashed #26303a;font-size:.76em;line-height:1.7;color:#aab4bc}.dm-c.ouv .dm-det{display:block}'
            + '.dm-g{display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;margin-top:6px}.dm-g span{display:flex;justify-content:space-between;gap:6px;border-bottom:1px solid #161d24}'
            + '.dm-v{color:#2fe07a}.dm-o{color:#ffb000}.dm-r{color:#ff5a5a}.dm-gr{color:#6d7a85}'
            + '.dm-btn{background:transparent;border:1px solid #555;color:#ccc;font:inherit;font-size:.74em;letter-spacing:1.5px;padding:8px 12px;border-radius:8px}.dm-btn.ok{border-color:#00FF66;color:#00FF66;background:rgba(0,255,102,.08);font-weight:bold}.dm-btn.or{border-color:#FF7100;color:#FF7100}.dm-btn.rg{border-color:#FF3333;color:#FF5a5a}'
            + '.dm-f{display:flex;flex-wrap:wrap;gap:6px;margin:2px 0 10px}.dm-f input,.dm-f select{flex:1 1 140px;min-width:0;background:#0c1014;border:1px solid #2a323a;color:#ddd;font:inherit;font-size:.8em;padding:9px 10px;border-radius:8px}'
            + '.dm-p{border:1px solid #2a323a;color:#8b97a0;font-size:.64em;letter-spacing:1.5px;padding:6px 9px;border-radius:14px;background:#0c1014}.dm-p.on{color:#00F0FF;border-color:#00F0FF;background:rgba(0,240,255,.08)}'
            + '.dm-k{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}.dm-kp{background:#0b0f13;border:1px solid #1f272e;border-left:4px solid #00F0FF;border-radius:6px 14px 14px 6px;padding:10px 12px}.dm-kp.h{grid-column:1/-1;border-left-color:#2fe07a}'
            + '.dm-kp small{display:block;color:#8b97a0;font-size:.6em;letter-spacing:2px}.dm-kp b{display:block;font-family:Rajdhani,sans-serif;font-size:1.9em;line-height:1.1;color:#fff}.dm-kp i{display:block;color:#7d8a95;font-size:.68em;font-style:normal}'
            + '.dm-h{color:#00F0FF;font-size:.66em;letter-spacing:3px;margin:16px 2px 7px}'
            + '.dm-b{display:flex;align-items:center;gap:8px;margin:0 0 6px;font-size:.78em}.dm-b em{flex:0 0 42%;font-style:normal;color:#b3bcc4}.dm-b s{flex:1;height:8px;background:#141b21;border-radius:4px;overflow:hidden}.dm-b s i{display:block;height:100%;background:#00F0FF;border-radius:4px}.dm-b b{flex:none;min-width:28px;text-align:right;color:#fff}'
            + '.dm-vide{color:#7d8a95;text-align:center;padding:26px 10px;font-style:italic;font-size:.85em}'
            + '#dm-photo{position:fixed;inset:0;z-index:7600;background:rgba(0,0,0,.92);display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:20px;text-align:center}#dm-photo img{max-width:100%;max-height:60vh;border:1px solid #444;border-radius:10px;background:#111}';
        document.head.appendChild(s);
    }
    function rpc(nom, args) { const c = client(); return c ? c.rpc(nom, args) : Promise.resolve({ error: { message: 'hors ligne' } }); }
    function cle() { const c = client(); const u = (window.profilCommandant && window.profilCommandant.user_id) || (typeof profilCommandant !== 'undefined' && profilCommandant && profilCommandant.user_id) || ''; return 'edteam_dm_pilotes_' + u; }
    async function charger(force) {
        if (!force) { try { const c = JSON.parse(sessionStorage.getItem(cle()) || 'null'); if (c && Date.now() - c.ts < TTL) { D.liste = c.d; return D.liste; } } catch (e) { /* memoire illisible */ } }
        const [r, ac] = await Promise.all([rpc('pilotes_directeur'), rpc('pilotes_acces')]);
        if (r.error) throw r.error;
        D.liste = r.data || [];
        // ACCES (SQL 211) : dossier envoye = le pilote attend l'ouverture de son acces (sinon il est encore dans le SAS)
        const att = {}; ((ac.data && ac.data.attente) || []).forEach(a => { att[a.user_id] = a; });
        const info = {}; ['attente', 'valides', 'sas'].forEach(k => ((ac.data && ac.data[k]) || []).forEach(a => { info[a.user_id] = a; }));      // puissance Powerplay et derogation (SQL 216)
        D.liste.forEach(p => { const a = att[p.user_id], i = info[p.user_id]; p.dossier = !!a; p.amiral_valide = a ? !!a.amiral_valide : false;
            p.puissance = i ? (i.puissance || null) : null; p.federale = (i && typeof i.federale === 'boolean') ? i.federale : null; p.derogation = i ? !!i.derogation : false; });
        try { sessionStorage.setItem(cle(), JSON.stringify({ ts: Date.now(), d: D.liste })); } catch (e) { /* stockage plein */ }
        return D.liste;
    }

    // ---------- ESCADRONS ----------
    // ---------- ACCES (SQL 211) : boutons des cartes PILOTES ----------
    function oublierAcces() { try { Object.keys(sessionStorage).filter(k => k.indexOf('edteam_dm_pilotes_') === 0 || k.indexOf('edteam_effectifs_') === 0).forEach(k => sessionStorage.removeItem(k)); } catch (e) { /* rien */ } }
    async function apresAcces() { oublierAcces(); try { await charger(true); } catch (e) { /* liste gardee */ } dessinerPilotes(); }
    async function ouvrirAcces(uid, b) {
        b.disabled = true;
        const r = await rpc('approuver_utilisateur', { target_user_id: uid });
        if (r.error) alert('Validation refusée par le serveur (dossier incomplet ?).');
        apresAcces();
    }
    async function retirerAcces(uid, nom, b) {
        if (!confirm('Retirer l’accès de CMDR ' + String(nom).toUpperCase() + ' ?\n\nIl repasse en attente : le plugin cesse d’envoyer ses données.')) return;
        b.disabled = true;
        const r = await rpc('retirer_acces', { target_user_id: uid });
        if (r.error || r.data === 'REFUSE') alert(r.data === 'REFUSE' ? 'Ce compte ne peut pas être retiré.' : 'Impossible de retirer l’accès pour le moment.');
        apresAcces();
    }

    // ---------- PILOTES ----------
    function filtre() {
        const q = D.q.trim().toUpperCase();
        return (D.liste || []).filter(p => (!D.esc || nomEsc(p) === D.esc) && (!D.statut || statut(p) === D.statut) && (!D.sansPhoto || !p.chemin)
            && (!D.nouv || Date.now() - Date.parse(p.cree_le) < 7 * JOUR) && (!q || String(p.cmdr_nom || '').toUpperCase().includes(q)));
    }
    function carte(p, ref) {
        const st = statut(p), S = STATUTS[st], sus = suspect(p), arr = arrete(p), ouv = D.ouvert === p.user_id, moi = (window.profilCommandant && window.profilCommandant.user_id) || '';
        const fermeture = p.dossier && p.escadron_id && String(p.escadron_id).toUpperCase() !== 'INDEPENDANT' && !p.amiral_valide && !p.est_amiral ? '<div class="dm-sub" style="color:#FF7100">escadron fermé : Amiral non validé</div>' : '';
        const valider = p.dossier && !p.est_approuve ? '<div style="margin-top:10px;text-align:right">' + fermeture + '<button type="button" class="dm-btn ok" data-ouvrir="' + E(p.user_id) + '">VALIDER L’ACCÈS</button></div>' : '';
        const retirerBtn = p.est_approuve && p.user_id !== moi ? '<button type="button" class="dm-btn or" data-retacc="' + E(p.user_id) + '" data-nom="' + E(String(p.cmdr_nom || '')) + '" style="margin-left:8px">RETIRER L’ACCÈS</button>' : '';
        const puis = p.puissance ? '<span class="' + (p.federale === true ? 'dm-v' : (p.derogation ? 'dm-gr' : 'dm-r')) + '">' + E(p.puissance) + (p.federale === true ? '' : (p.derogation ? ' · dérogation' : ' · HORS FÉDÉRATION')) + '</span><span>·</span>' : '';
        const ver = !p.plugin_version ? '<span class="' + (p.est_approuve ? 'dm-r' : 'dm-gr') + '">plugin —</span>' : (cmpVer(p.plugin_version, ref) >= 0 ? '<span class="dm-v">plugin ' + E(p.plugin_version) + '</span>' : '<span class="dm-o">plugin ' + E(p.plugin_version) + ' (en retard)</span>');
        const diag = DIAG.map(([t, k, c]) => { const e = etatCase(p, k); const cl = e === 'n' ? (c ? 'dm-r' : 'dm-gr') : e === 'o' ? 'dm-o' : 'dm-v'; return '<span><em style="font-style:normal">' + t + '</em><b class="' + cl + '">' + (e === 'n' ? '—' : E(ilYa(p[k]))) + '</b></span>'; }).join('');
        return '<div class="dm-c' + (ouv ? ' ouv' : '') + '" style="--k:' + S[1] + '" data-u="' + E(p.user_id) + '"><div class="dm-l1"><span class="dm-av">' + E(initiales(p)) + '</span><div class="dm-nom">CMDR ' + E(String(p.cmdr_nom || '—').toUpperCase()) + '<div class="dm-sub">' + E(nomEsc(p)) + ' · ' + ROLES[role(p)] + '</div></div><span class="dm-tag" style="--t:' + S[1] + '">' + S[0] + '</span></div>'
            + '<div class="dm-l2"><span>activité ' + E(ilYa(p.derniere_activite)) + '</span><span>·</span>' + puis + ver + (sus ? '<span class="dm-tag" style="--t:#ffb000">SUSPECT</span>' : arr ? '<span class="dm-tag" style="--t:#ff6a6a">ARRÊTÉ</span>' : '') + '</div>'
            + valider + '<div class="dm-det"><div>Inscrit le ' + E(dateCourte(p.cree_le)) + ' · dernière connexion ' + E(ilYa(p.derniere_connexion)) + '</div><div class="dm-g">' + diag + '</div>'
            + '<div style="margin-top:9px"><button type="button" class="dm-btn" data-photo="' + E(p.user_id) + '"' + (p.chemin ? '' : ' disabled') + '>PHOTO' + (p.chemin ? '' : ' (AUCUNE)') + '</button>' + retirerBtn + '</div></div></div>';
    }
    function dessinerPilotes(garder) {
        const z = document.getElementById('dm-corps'); if (!D.liste) return;
        const escs = [...new Set(D.liste.map(nomEsc))].sort();
        const cnt = {}; D.liste.forEach(p => { const s = statut(p); cnt[s] = (cnt[s] || 0) + 1; });
        const nNouv = D.liste.filter(p => Date.now() - Date.parse(p.cree_le) < 7 * JOUR).length, nSans = D.liste.filter(p => !p.chemin).length;
        const att = p => !p.est_approuve && p.dossier, l = filtre().sort((a, b) => (att(b) ? 1 : 0) - (att(a) ? 1 : 0) || (Date.parse(b.derniere_activite) || 0) - (Date.parse(a.derniere_activite) || 0)), ref = versionRef();
        const pu = (on, d, txt) => '<span class="dm-p' + (on ? ' on' : '') + '" data-f="' + d + '">' + txt + '</span>';
        z.innerHTML = '<div class="dm-f"><input type="search" id="dm-q" placeholder="Rechercher un pilote…" value="' + E(D.q) + '"><select id="dm-esc"><option value="">Tous les escadrons</option>' + escs.map(k => '<option value="' + E(k) + '"' + (D.esc === k ? ' selected' : '') + '>' + E(k) + '</option>').join('') + '</select></div>'
            + '<div class="dm-f">' + pu(!D.statut && !D.sansPhoto && !D.nouv, 'tous', 'TOUS (' + D.liste.length + ')') + Object.keys(STATUTS).map(k => pu(D.statut === k, 's:' + k, STATUTS[k][0] + ' (' + (cnt[k] || 0) + ')')).join('') + pu(D.nouv, 'nouv', 'NOUVEAUX 7 J (' + nNouv + ')') + pu(D.sansPhoto, 'sansphoto', 'SANS PHOTO (' + nSans + ')') + '</div>'
            + '<div class="dm-sub" style="margin:0 2px 8px">' + l.length + ' pilote' + (l.length > 1 ? 's' : '') + ' · touchez une carte pour le diagnostic</div>'
            + (l.map(p => carte(p, ref)).join('') || '<div class="dm-vide">Aucun pilote ne correspond à ces filtres.</div>');
        if (garder) { const el = document.getElementById('dm-q'); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }
    }

    // ---------- PHOTO (controle et retrait) ----------
    function urlPhoto(chemin) { try { return client().storage.from('photos').getPublicUrl(chemin).data.publicUrl; } catch (e) { return ''; } }
    function voirPhoto(uid) {
        const p = (D.liste || []).find(x => x.user_id === uid); if (!p || !p.chemin) return;
        let o = document.getElementById('dm-photo'); if (!o) { o = document.createElement('div'); o.id = 'dm-photo'; document.body.appendChild(o); }
        o.style.display = 'flex';
        o.innerHTML = '<div style="color:#fff;letter-spacing:2px">CMDR ' + E(String(p.cmdr_nom || '').toUpperCase()) + '<div class="dm-sub">' + E(nomEsc(p)) + ' · ' + ROLES[role(p)] + '</div></div><img src="' + E(urlPhoto(p.chemin)) + '" alt="">'
            + '<div style="display:flex;gap:10px"><button type="button" class="dm-btn rg" data-retirer="' + E(uid) + '">RETIRER CETTE PHOTO</button><button type="button" class="dm-btn" data-fermer-photo>FERMER</button></div><div id="dm-pmsg" class="dm-sub"></div>';
    }
    async function retirer(uid, b) {
        const p = (D.liste || []).find(x => x.user_id === uid); if (!p) return;
        if (!confirm('Retirer la photo de CMDR ' + String(p.cmdr_nom || '').toUpperCase() + ' (' + nomEsc(p) + ') ?\nLe pilote reviendra à ses initiales et pourra en remettre une.')) return;
        b.disabled = true;
        try {
            if (!window.EDTEAMPhotos) throw new Error('module photos absent');
            await window.EDTEAMPhotos.charger(true);
            await window.EDTEAMPhotos.retirer(uid);
            try { sessionStorage.removeItem(cle()); } catch (e) { /* rien */ }
            p.chemin = null;
            document.getElementById('dm-photo').style.display = 'none';
            dessinerPilotes();
        } catch (e) { b.disabled = false; const m = document.getElementById('dm-pmsg'); if (m) m.textContent = 'La photo n’a pas pu être retirée : ' + (e && e.message ? e.message : e); }
    }

    // ---------- USAGE ----------
    function dessinerUsage() {
        const z = document.getElementById('dm-corps'); const L = D.liste || [], ok = L.filter(p => p.est_approuve), now = Date.now();
        const act = (p, j) => p.derniere_activite && now - Date.parse(p.derniere_activite) < j * JOUR;
        const a7 = ok.filter(p => act(p, 7)).length, a24 = ok.filter(p => act(p, 1)).length, dorm = ok.filter(p => p.derniere_activite && !act(p, 7));
        const nouv = L.filter(p => now - Date.parse(p.cree_le) < 7 * JOUR).length, taux = ok.length ? Math.round(100 * a7 / ok.length) : 0;
        const verdict = !ok.length ? 'Aucun pilote approuvé pour le moment.' : (taux >= 60 ? 'Bon usage' : taux >= 30 ? 'Usage moyen' : 'Usage faible') + ' : ' + a7 + ' pilote' + (a7 > 1 ? 's' : '') + ' sur ' + ok.length + (a7 > 1 ? ' ont' : ' a') + ' envoyé des données cette semaine' + (dorm.length ? ', et ' + dorm.length + (dorm.length > 1 ? ' n’ont' : ' n’a') + ' rien envoyé depuis plus de 7 jours.' : '.');
        const kp = (t, v, s, h) => '<div class="dm-kp' + (h ? ' h' : '') + '"><small>' + t + '</small><b>' + v + '</b><i>' + s + '</i></div>';
        const bar = (lib, n, max) => '<div class="dm-b"><em>' + E(lib) + '</em><s><i style="width:' + Math.round(100 * n / Math.max(max, 1)) + '%"></i></s><b>' + n + '</b></div>';
        const entonnoir = [['Inscrits', L.length], ['E-mail confirmé', L.filter(p => p.email_confirme).length], ['Approuvés', ok.length], ['Première donnée', ok.filter(p => p.derniere_activite).length], ['Actifs 7 jours', a7]];
        const fonc = [['BGS', 'f_bgs'], ['Colonisation', 'f_colo'], ['Budget', 'f_budget'], ['Powerplay', 'f_pp'], ['Fil de l’escadron', 'f_journal'], ['Hangar', 'f_hangar'], ['Combat', 'f_combat']].map(([t, k]) => [t, ok.filter(p => p[k]).length]);
        z.innerHTML = '<div class="dm-k">' + kp('LE RÉSEAU EST-IL UTILISÉ ?', a7 + ' / ' + ok.length, 'actifs 7 j / approuvés · ' + taux + ' %', true) + kp('ACTIFS 24 H', a24, a7 ? Math.round(100 * a24 / a7) + ' % des actifs 7 j' : '') + kp('NOUVEAUX 7 J', nouv, 'inscrits') + kp('DORMANTS', dorm.length, 'sans donnée > 7 j') + '</div>'
            + '<div class="dm-c" style="--k:#2fe07a"><b style="color:#fff">' + E(verdict) + '</b></div>'
            + '<div class="dm-h">ENTONNOIR D’INSCRIPTION</div>' + entonnoir.map(([t, n]) => bar(t, n, L.length)).join('')
            + '<div class="dm-h">PILOTES PAR FONCTION · 30 JOURS</div>' + fonc.map(([t, n]) => bar(t, n, ok.length)).join('')
            + '<div class="dm-h">DORMANTS (' + dorm.length + ')</div>' + (dorm.sort((a, b) => Date.parse(a.derniere_activite) - Date.parse(b.derniere_activite)).map(p => '<div class="dm-c" style="--k:#ffb000;padding:8px 12px"><div class="dm-l1"><div class="dm-nom">CMDR ' + E(String(p.cmdr_nom || '—').toUpperCase()) + '<div class="dm-sub">' + E(nomEsc(p)) + '</div></div><span class="dm-sub">' + E(ilYa(p.derniere_activite)) + '</span></div></div>').join('') || '<div class="dm-vide">Aucun dormant.</div>')
            + '<div class="dm-sub" style="margin-top:10px">Calculé sur l’appareil à partir de la liste des pilotes. Ne mesure que les données envoyées, pas les pages consultées.</div>';
    }

    // ---------- ONGLETS ----------
    async function onglet(nom) {
        D.onglet = nom;
        document.querySelectorAll('#dm-ov .tabs button').forEach(b => b.classList.toggle('on', b.dataset.o === nom));
        const z = document.getElementById('dm-corps'); z.scrollTop = 0;
        z.innerHTML = '<div class="dm-vide">Chargement…</div>';
        try { await charger(false); } catch (e) { z.innerHTML = '<div class="dm-vide">Impossible de lire les pilotes pour le moment (script SQL 175 lancé ?).</div>'; return; }
        if (nom === 'pil') dessinerPilotes(); else dessinerUsage();
    }
    M.fermer = function () { const o = document.getElementById('dm-ov'); if (o) o.remove(); const f = document.getElementById('dm-photo'); if (f) f.style.display = 'none'; };
    M.ouvrir = function () {
        const moi = window.profilCommandant || (typeof profilCommandant !== 'undefined' ? profilCommandant : null);
        if (!moi || !moi.est_directeur) return;     // reserve à l’administrateur (la base le verifie aussi)
        css(); M.fermer();
        const o = document.createElement('div'); o.id = 'dm-ov';
        o.innerHTML = '<div class="top"><b>ESPACE ADMINISTRATEUR</b><span class="x" data-fermer>✕</span></div><div class="tabs"><button data-o="pil">PILOTES</button><button data-o="usage">USAGE</button></div><div id="dm-corps"></div>';
        document.body.appendChild(o);
        o.addEventListener('click', e => {
            const t = e.target;
            if (t.closest('[data-fermer]')) return M.fermer();
            const tab = t.closest('.tabs button'); if (tab) return onglet(tab.dataset.o);
            const bo = t.closest('button[data-ouvrir]'); if (bo) return ouvrirAcces(bo.dataset.ouvrir, bo);
            const br = t.closest('button[data-retacc]'); if (br) return retirerAcces(br.dataset.retacc, br.dataset.nom, br);
            const ph = t.closest('button[data-photo]'); if (ph) return voirPhoto(ph.dataset.photo);
            const pf = t.closest('[data-f]');
            if (pf) { const f = pf.dataset.f; if (f === 'tous') { D.statut = ''; D.sansPhoto = false; D.nouv = false; } else if (f === 'nouv') D.nouv = !D.nouv; else if (f === 'sansphoto') D.sansPhoto = !D.sansPhoto; else if (f.indexOf('s:') === 0) { const s = f.slice(2); D.statut = D.statut === s ? '' : s; } return dessinerPilotes(); }
            if (t.closest('button,input,select')) return;
            const c = t.closest('.dm-c[data-u]'); if (c) { D.ouvert = D.ouvert === c.dataset.u ? '' : c.dataset.u; c.classList.toggle('ouv', D.ouvert === c.dataset.u); }
        });
        o.addEventListener('input', e => { if (e.target.id === 'dm-q') { D.q = e.target.value; dessinerPilotes(true); } });
        o.addEventListener('change', e => { if (e.target.id === 'dm-esc') { D.esc = e.target.value; dessinerPilotes(); } });
        let p = document.getElementById('dm-photo'); if (!p) { p = document.createElement('div'); p.id = 'dm-photo'; document.body.appendChild(p); }
        p.onclick = e => { const r = e.target.closest('[data-retirer]'); if (r) return retirer(r.dataset.retirer, r); if (e.target.closest('[data-fermer-photo]')) p.style.display = 'none'; };
        onglet(D.onglet);
    };
})();
