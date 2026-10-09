// MODE DES INITIATIVES (script SQL 70) : logique commune PC et mobile.
//   - presence(profil) : l'Amiral qui ouvre le site s'enregistre comme present (au plus une fois par 6 h et par appareil). Une absence de plus de 7 jours remet les pilotes en mode LIBRE ;
//     son choix revient tout seul des qu'il est present. Si une absence vient de prendre fin, un drapeau local permet d'afficher UNE fois le bandeau « bon retour ».
//   - reglage() : { mode, effectif, absent, amiral, commandement } de MON escadron (une seule lecture par chargement de page).
//   - liste() / traiter(id, action) / definir(mode) / proposer(...) : les appels serveur (les regles et les droits sont cote serveur).
(function () {
    'use strict';
    const db = () => window.supabaseApp || (typeof supabaseApp !== 'undefined' ? supabaseApp : null);   // mobile.html le declare en const (pas sur window)
    const cle = { vu: 'edteam_amiral_present_ts', retour: 'edteam_amiral_retour' };
    let enCours = null;

    const lire = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
    const ecrire = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) { /* sans stockage : le serveur limite deja les ecritures */ } };

    const api = {
        reglage(force) {
            if (enCours && !force) return enCours;
            enCours = db().rpc('initiatives_reglage').then(r => (r && !r.error && r.data && typeof r.data === 'object') ? r.data : null, () => null);
            return enCours;
        },
        async presence(profil) {
            try {
                if (!profil || !profil.est_amiral || !db()) return;
                const dernier = parseInt(lire(cle.vu) || '0', 10) || 0;
                if (Date.now() - dernier < 6 * 3600 * 1000) return;
                // lire AVANT d'enregistrer la presence : « absent » vaut vrai si le mode des pilotes etait remonte en LIBRE a cause de l'absence
                const g = await api.reglage(true);
                if (g && g.absent) ecrire(cle.retour, '1');
                const r = await db().rpc('amiral_present');
                if (!r.error) { ecrire(cle.vu, String(Date.now())); enCours = null; }
            } catch (e) { /* la presence ne doit jamais gener la page */ }
        },
        retourAAfficher() { return lire(cle.retour) === '1'; },
        retourVu() { ecrire(cle.retour, null); },
        async liste() {
            const r = await db().rpc('propositions_initiatives_liste').then(x => x, () => ({ data: null }));
            return Array.isArray(r.data) ? r.data : [];
        },
        async traiter(id, action) { return db().rpc('traiter_proposition', { p_id: Number(id), p_action: action }); },
        async definir(mode) { const r = await db().rpc('definir_mode_initiatives', { p_mode: mode }); enCours = null; return r; },
        async proposer(sys, fac, type, msg, pop) {
            return db().rpc('proposer_initiative', { p_systeme: sys, p_faction: fac, p_type: type, p_message: msg || null, p_population: pop || 0 });
        },
        // temps restant lisible avant l'expiration d'une proposition
        restant(iso) {
            const ms = new Date(iso).getTime() - Date.now();
            if (!(ms > 0)) return 'expire bientôt';
            const h = Math.floor(ms / 3600000);
            return h >= 1 ? 'expire dans ' + h + ' h' : 'expire dans moins d\'une heure';
        }
    };
    window.edteamIniMode = api;
})();
