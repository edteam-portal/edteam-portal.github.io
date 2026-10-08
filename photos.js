// PHOTOS DE COMMANDANT : module partage (pages PC et mobile). Une photo par pilote, la nouvelle remplace l'ancienne.
// - Lecture : UNE requete (rpc photos_visibles, SQL 58) qui ne renvoie que les photos que le pilote a le droit de voir (son escadron, sa Puissance).
//   Resultat garde 5 minutes dans la session. Les images ont un nom aleatoire et un cache navigateur d'un an : egress negligeable.
// - Sans photo (ou image illisible) : initiales sur un disque a la couleur du role (rouge Amiral, vert Officier, orange Pilote).
// - Envoi : image recadree en carre au centre, 256 px, webp (environ 10 a 25 Ko), nom reserve par la base.
(function () {
    'use strict';
    const CLE = 'edteam_photos_v1', DUREE = 900000, BUCKET = 'photos';
    let client = null, carte = null, pending = null, memoUid = null;

    const bd = () => client || window.supabaseApp || null;
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const norm = n => String(n || '').trim().toUpperCase();

    function css() {
        if (document.getElementById('edteam-photos-css')) return;
        const st = document.createElement('style');
        st.id = 'edteam-photos-css';
        st.textContent = [
            '.ph{position:relative;display:inline-flex;align-items:center;justify-content:center;flex:none;box-sizing:border-box;border-radius:50%;overflow:hidden;font-weight:bold;letter-spacing:0;line-height:1;border:1px solid var(--pc,#FF7100);color:var(--pt,#ffab66);background:radial-gradient(circle at 50% 35%,var(--pf1,#4a2608),var(--pf2,#170b02));font-size:calc(var(--t,46px)*.36);width:var(--t,46px);height:var(--t,46px);vertical-align:middle}',
            '.ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}',
            '.ph.ph-amiral{--pc:#FF3333;--pt:#ff7b7b;--pf1:#4a1414;--pf2:#170505}',
            '.ph.ph-officier{--pc:#00FF66;--pt:#66ff9e;--pf1:#0f3a22;--pf2:#04150b}',
            '.ph.ph-pilote{--pc:#FF7100;--pt:#ffab66;--pf1:#4a2608;--pf2:#170b02}',
            '.ph.ph-photo{border-color:rgba(255,255,255,.28)}',
            '.ph.ph-actif{border-color:rgba(0,255,102,.7);box-shadow:0 0 12px rgba(0,255,102,.25)}'
        ].join('\n');
        document.head.appendChild(st);
    }

    function lire() { try { const c = JSON.parse(sessionStorage.getItem(CLE) || 'null'); if (c && Date.now() - c.ts < DUREE && Array.isArray(c.d)) return c.d; } catch (e) {} return null; }
    function ecrire(d) { try { sessionStorage.setItem(CLE, JSON.stringify({ ts: Date.now(), d: d })); } catch (e) {} }
    function indexer(lignes) {
        const m = { uid: {}, nom: {} };
        (lignes || []).forEach(l => { if (!l || !l.chemin) return; m.uid[l.user_id] = l; if (l.cmdr_nom) m.nom[norm(l.cmdr_nom)] = l; });
        carte = m;
    }

    // Charge les photos visibles (cache 5 min). Ne jette jamais : sans reseau ou sans le SQL 58, on affiche simplement les initiales.
    async function charger(force) {
        if (!force && carte) return carte;
        if (!force) { const c = lire(); if (c) { indexer(c); return carte; } }
        if (pending && !force) return pending;
        pending = (async () => {
            try {
                const b = bd();
                if (!b) throw new Error('client indisponible');
                const r = await b.rpc('photos_visibles');
                if (r.error) throw r.error;
                const d = r.data || [];
                ecrire(d); indexer(d);
            } catch (e) { if (!carte) indexer([]); }
            pending = null;
            return carte;
        })();
        return pending;
    }

    function ligne(uid, nom) { if (!carte) return null; return (uid && carte.uid[uid]) || (nom && carte.nom[norm(nom)]) || null; }
    function url(l) {
        if (!l || !l.chemin) return '';
        try { return bd().storage.from(BUCKET).getPublicUrl(l.chemin).data.publicUrl; } catch (e) { return ''; }
    }
    function urlDe(uid, nom) { return url(ligne(uid, nom)); }

    function initiales(nom) {
        const m = String(nom || '').replace(/^CMDR\s+/i, '').trim().split(/[\s\-_]+/).filter(Boolean);
        if (!m.length) return '?';
        if (m.length === 1) return m[0].slice(0, 2).toUpperCase();
        return (m[0][0] + m[1][0]).toUpperCase();
    }
    function roleDe(p) { return p && p.est_amiral ? 'amiral' : (p && p.est_officier ? 'officier' : 'pilote'); }

    // Pastille ronde : la photo si elle existe, sinon les initiales. L'image est posee PAR-DESSUS les initiales : si elle ne charge pas, elle disparait et les initiales restent.
    // o = { uid, nom, role ('amiral'|'officier'|'pilote') ou p (profil), taille (px) }
    function avatar(o) {
        css();
        o = o || {};
        const role = o.role || roleDe(o.p), t = o.taille || 46, u = urlDe(o.uid, o.nom);
        return '<span class="ph ph-' + role + (u ? ' ph-photo' : '') + (o.actif ? ' ph-actif' : '') + '" style="--t:' + t + 'px" title="' + esc(o.nom || '') + '">' + esc(initiales(o.nom))
            + (u ? '<img src="' + esc(u) + '" alt="" loading="lazy" decoding="async" onerror="this.remove();this.parentNode&&this.parentNode.classList.remove(\'ph-photo\')">' : '') + '</span>';
    }

    // ---------- ENVOI ----------
    function recadrer(fichier) {
        return new Promise((ok, ko) => {
            if (!fichier || !/^image\/(png|jpeg|webp)$/.test(fichier.type)) return ko(new Error('Format non pris en charge (PNG, JPEG ou WebP).'));
            const u = URL.createObjectURL(fichier), im = new Image();
            im.onload = () => {
                try {
                    const c = Math.min(im.width, im.height), sx = (im.width - c) / 2, sy = (im.height - c) / 2, cv = document.createElement('canvas');
                    cv.width = cv.height = 256;
                    cv.getContext('2d').drawImage(im, sx, sy, c, c, 0, 0, 256, 256);
                    cv.toBlob(b => b ? ok(b) : ko(new Error('Conversion impossible.')), 'image/webp', 0.85);
                } catch (e) { ko(e); } finally { URL.revokeObjectURL(u); }
            };
            im.onerror = () => { URL.revokeObjectURL(u); ko(new Error('Image illisible.')); };
            im.src = u;
        });
    }
    function moiUid() { try { return (window.profilCommandant && window.profilCommandant.user_id) || memoUid; } catch (e) { return memoUid; } }
    // l'identifiant du pilote connecte : le profil de la page s'il est la, sinon la session
    async function monId() { let u = moiUid(); if (u) return u; try { const r = await bd().auth.getUser(); memoUid = r && r.data && r.data.user ? r.data.user.id : null; } catch (e) {} return memoUid; }
    function maLigne(uid) { return (uid && carte && carte.uid[uid]) || null; }

    // fichier : File choisi par le pilote. Ordre : reserver le nom, envoyer, supprimer l'ancien fichier, enregistrer.
    async function envoyer(fichier, monUid) {
        const b = bd();
        if (!b) throw new Error('Connexion indisponible.');
        await charger(false);
        const blob = await recadrer(fichier);
        const r = await b.rpc('reserver_photo_pilote');
        if (r.error) throw new Error(r.error.message || 'Réservation impossible.');
        const nom = r.data;
        const up = await b.storage.from(BUCKET).upload(nom, blob, { upsert: false, contentType: 'image/webp', cacheControl: '31536000' });
        if (up.error) throw new Error(up.error.message || 'Envoi impossible.');
        const ancien = maLigne(monUid || await monId());
        if (ancien && ancien.chemin) { try { await b.storage.from(BUCKET).remove([ancien.chemin]); } catch (e) { /* ancien fichier orphelin : sans gravite */ } }
        const d = await b.rpc('definir_photo_pilote');
        if (d.error) throw new Error(d.error.message || 'Enregistrement impossible.');
        await charger(true);
        notifier();
    }

    // Retire la photo de uid (la sienne si uid absent ou egal a soi). Reserve a soi, a l'Amiral de son escadron, au Directeur (la base verifie).
    async function retirer(uid) {
        const b = bd();
        if (!b) throw new Error('Connexion indisponible.');
        await charger(false);
        const moi = await monId(), cible = uid || moi;
        const l = maLigne(cible);
        if (l && l.chemin) { const s = await b.storage.from(BUCKET).remove([l.chemin]); if (s.error) throw new Error(s.error.message || 'Suppression impossible.'); }
        const r = await b.rpc('retirer_photo_pilote', { p_cible: (!uid || uid === moi) ? null : uid });
        if (r.error) throw new Error(r.error.message || 'Retrait impossible.');
        await charger(true);
        notifier();
    }

    // Avant la suppression de son compte : on retire le fichier (le compte, lui, est supprime par la base). Sans effet si pas de photo.
    async function retirerFichierAvantSuppression() {
        try {
            await charger(false);
            const l = maLigne(await monId());
            if (l && l.chemin) await bd().storage.from(BUCKET).remove([l.chemin]);
        } catch (e) { /* le compte sera supprime de toute facon */ }
    }

    function notifier() { try { window.dispatchEvent(new CustomEvent('edteam-photos')); } catch (e) {} }

    window.EDTEAMPhotos = {
        init: function (c) { client = c || client; },
        charger: charger, avatar: avatar, url: urlDe, initiales: initiales, roleDe: roleDe,
        envoyer: envoyer, retirer: retirer, retirerFichierAvantSuppression: retirerFichierAvantSuppression,
        maPhoto: function () { return maLigne(moiUid()); }, monId: monId,
        ligne: ligne, css: css
    };
})();
