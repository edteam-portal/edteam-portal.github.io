// "QUOI FAIRE" : propose au pilote, sans jamais rien lui imposer, ce qui aiderait le plus son escadron et sa puissance en ce moment.
// Partage par index.html (PC) et mobile.html. Une seule lecture serveur : rpc('quoi_faire_donnees') (script SQL 44), mise en memoire 3 minutes.
//
// CLASSEMENT (decide avec le proprietaire, 03/10/2026) :
//   1. priorite de la directive fixee par l'Amiral ou un officier (1 critique, 2 haute, 3 normale) ;
//   2. a priorite egale : l'activite la plus en retard (jauge la moins remplie, au pourcent pres) ;
//   3. a retard egal : l'activite qui correspond au style de jeu du pilote.
//   Exception (05/10) : un style CHOISI A LA MAIN passe avant le retard de la jauge (la priorite du commandement reste devant).
//   La colonisation vient apres les directives ; le rang et le Powerplay ne sont jamais la recommandation.
// Les plafonds des directives = ceux de bgs.html (calculerPlafonds + plafonds personnalises x pilotes actifs du cycle) : a garder identiques.
(function () {
    'use strict';
    const QF = window.QF = {};
    const DUREE_CACHE = 10 * 60 * 1000;
    let cache = null;          // { ts, d }
    let modele = null;         // dernier modele calcule
    let decalage = 0;          // rotation de « autres idees »
    let styleForce = null;     // style choisi a la main (sinon detecte)
    try { styleForce = localStorage.getItem('edteam_qf_style') || null; } catch (e) {}

    const esc = s => (typeof escapeHtml === 'function') ? escapeHtml(s) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const nf = new Intl.NumberFormat('fr-FR');
    const fmt = n => nf.format(Math.round(n));
    const fmtCr = n => new Intl.NumberFormat('fr-FR', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }).format(n);
    const nomStation = s => (String(s || '').replace(/^(Orbital|Planetary|Surface) Construction Site: /i, '').replace(/^\$EXT_PANEL_ColonisationShip;\s*/, '').trim()) || 'Chantier';
    const maj = s => String(s || '').toUpperCase();

    // ---------------------------------------------------------------------------------------------
    // Styles de jeu : activite BGS -> style
    // ---------------------------------------------------------------------------------------------
    const STYLES = { marchand: 'MARCHAND', combat: 'COMBAT', exploration: 'EXPLORATION', logistique: 'LOGISTIQUE' };
    const STYLE_DE_TYPE = { ECONOMIE: 'marchand', CONTREBANDE: 'marchand', SECURITE: 'combat', CZ_VICTOIRES: 'combat', MEURTRES: 'combat', VOLS: 'combat', PIRATAGE: 'combat', SCIENCE: 'exploration', MISSIONS: 'logistique' };
    const styleDetecte = d => STYLE_DE_TYPE[d && d.style] || null;

    // ---------------------------------------------------------------------------------------------
    // Plafonds d'une directive (identiques a bgs.html)
    // ---------------------------------------------------------------------------------------------
    function calculerPlafonds(population) {
        let m = 1;
        if (population > 0) m = Math.max(0.5, Math.log10(population) / 6);
        return {
            MISSIONS: Math.round(15 * m), ELECTION_MISSIONS: Math.round(25 * m), GUERRE_BONDS: Math.round(20000000 * m), GUERRE_MISSIONS: Math.round(20 * m),
            ECONOMIE: Math.round(25000000 * m), SECURITE: Math.round(10000000 * m), SCIENCE: Math.round(15000000 * m), MEURTRES: Math.round(5 * m),
            VOLS: Math.round(10 * m), CONTREBANDE: Math.round(5000000 * m), ECHECS: Math.round(3 * m), CZ_VICTOIRES: Math.round(5 * m)
        };
    }

    // Activites d'une directive : { cle, libelle, style, ratio (0-100), reste, genre ('n' = comptage, 'cr' = credits), mot }
    function activitesOrdre(o, rs) {
        const nb = Math.max(1, Number(rs && rs.nb_actifs) || Number(rs && rs.nb_participants) || 0);
        const base = Object.assign({}, calculerPlafonds(o.population || 0), o.plafonds_custom || {});
        const cap = {}; Object.keys(base).forEach(k => { cap[k] = base[k] * nb; });
        const T = (rs && rs.types) || {};
        const S = t => Number(T[t] && T[t].s) || 0;
        const N = t => Number(T[t] && T[t].n) || 0;
        const A = (cle, libelle, style, fait, plafond, genre, mot) => {
            if (!(plafond > 0)) return null;
            const ratio = Math.min(100, 100 * fait / plafond);
            return { cle, libelle, style, ratio, reste: Math.max(0, plafond - fait), genre, mot };
        };
        let l = [];
        switch (o.type_ordre) {
            case 'HAUSSE':
                l = [A('MISSIONS', 'Logistique (missions)', 'logistique', S('MISSIONS'), cap.MISSIONS, 'n', 'missions'),
                     A('ECONOMIE', 'Économie (commerce et minage)', 'marchand', S('ECONOMIE'), cap.ECONOMIE, 'cr'),
                     A('SECURITE', 'Sécurité (primes et conflits)', 'combat', S('SECURITE'), cap.SECURITE, 'cr'),
                     A('SCIENCE', 'Science (cartographie et exobiologie)', 'exploration', S('SCIENCE'), cap.SCIENCE, 'cr')]; break;
            case 'BAISSE':
                l = [A('MEURTRES', 'Meurtres (vaisseaux et sol)', 'combat', S('MEURTRES'), cap.MEURTRES, 'n', 'victimes'),
                     A('SABOTAGE', 'Sabotage au sol', 'combat', S('VOLS') + S('PIRATAGE'), cap.VOLS, 'n', 'actions'),
                     A('CONTREBANDE', 'Contrebande (marché noir)', 'marchand', S('CONTREBANDE'), cap.CONTREBANDE, 'cr')]; break;
            case 'GUERRE':
                l = [A('CZ_VICTOIRES', 'Victoires en zone de conflit', 'combat', N('CZ_VICTOIRES'), cap.CZ_VICTOIRES || 5 * nb, 'n', 'victoires'),
                     A('SECURITE', 'Obligations de combat (bons)', 'combat', S('SECURITE'), cap.GUERRE_BONDS || cap.SECURITE, 'cr'),
                     A('MISSIONS', 'Missions militaires', 'logistique', S('MISSIONS'), cap.GUERRE_MISSIONS || cap.MISSIONS, 'n', 'missions')]; break;
            case 'ELECTION':
                l = [A('MISSIONS', 'Logistique électorale', 'logistique', S('MISSIONS'), cap.ELECTION_MISSIONS || cap.MISSIONS, 'n', 'missions')]; break;
        }
        return l.filter(Boolean);
    }
    QF._activitesOrdre = activitesOrdre;   // exposé pour les tests

    // ---------------------------------------------------------------------------------------------
    // Construction du modele : idees classees
    // ---------------------------------------------------------------------------------------------
    const LIB_PRIO = { 1: 'CRITIQUE', 2: 'HAUTE' };
    const MISE_EN_SERVICE = () => (typeof window.EDTEAM_COLO_MISE_EN_SERVICE === 'number' ? window.EDTEAM_COLO_MISE_EN_SERVICE : 0);
    const avantMiseEnService = iso => { const t = Date.parse(iso); return !isNaN(t) && t < MISE_EN_SERVICE(); };
    const NOTE_COLO = 'Module récent : les chantiers ont été reconstitués à partir d\'anciens journaux de jeu. Ceux qui n\'ont pas encore été relevés à quai peuvent afficher des besoins dépassés ; ils seront à jour dès qu\'un pilote y dock. Cette note disparaîtra ensuite.';

    function construire(d, opts) {
        opts = opts || {};
        const accesBgs = opts.accesBgs !== false;
        const styleSouhaite = styleForce || styleDetecte(d);
        const res = { style: styleDetecte(d), styleChoisi: styleForce, hero: null, autres: [], carriere: [], vide: false };
        if (!d || d.acces === false) { res.vide = true; return res; }

        // --- directives : meilleure activite de chaque directive, puis classement
        const cands = [];
        if (d.membre && accesBgs) {
            const resume = {}; (d.resume || []).forEach(r => { resume[r.ordre_id] = r; });
            (d.ordres || []).forEach(o => {
                if (o.veille) return;   // directive en veille (normale, sans effort depuis 7 jours) : jamais recommandee
                const acts = activitesOrdre(o, resume[o.id] || {}).filter(a => a.ratio < 100 && a.reste > 0);
                if (!acts.length) return;
                // style choisi a la main : il passe avant le retard de la jauge (jamais avant la priorite du commandement) ; en automatique il ne depart que les egalites
                const pref = (a, b) => styleForce ? ((b.style === styleForce) - (a.style === styleForce)) : 0;
                acts.sort((a, b) => pref(a, b) || (Math.round(a.ratio) - Math.round(b.ratio)) || ((b.style === styleSouhaite) - (a.style === styleSouhaite)));
                const a = acts[0];
                cands.push({ o, a, prio: o.priorite || 3 });
            });
            cands.sort((x, y) => ((x.o.origine === 'PILOTE') - (y.o.origine === 'PILOTE')) || (x.prio - y.prio) || (styleForce ? ((y.a.style === styleForce) - (x.a.style === styleForce)) : 0) || (Math.round(x.a.ratio) - Math.round(y.a.ratio))
                || ((y.a.style === styleSouhaite) - (x.a.style === styleSouhaite)) || (Date.parse(x.o.date_emission) - Date.parse(y.o.date_emission)));
        }
        const idees = cands.map(c => {
            const reste = c.a.genre === 'cr' ? fmtCr(c.a.reste) + ' cr' : fmt(c.a.reste) + ' ' + (c.a.mot || '');
            return {
                id: 'bgs-' + c.o.id + '-' + c.a.cle, domaine: 'bgs',
                etiquette: (c.o.origine === 'PILOTE' ? 'INITIATIVE ' : 'DIRECTIVE ') + c.o.id + (c.o.origine === 'PILOTE' ? ' · LANCÉE PAR UN PILOTE DE L\'ESCADRON' : '') + (c.prio < 3 ? ' · PRIORITÉ ' + LIB_PRIO[c.prio] + ' FIXÉE PAR LE COMMANDEMENT' : ''),
                titre: c.a.libelle + ' : il manque ' + reste.trim(),
                pourquoi: (c.o.origine === 'PILOTE' ? 'L\'initiative ' : 'La directive ') + c.o.id + ' est à ' + Math.round(c.a.ratio) + ' % de son objectif sur cette activité (cible : ' + (c.o.faction_cible || '?') + ', système ' + (c.o.systeme_cible || '?') + ').'
                    + (c.prio < 3 ? ' Le commandement l\'a classée en priorité ' + LIB_PRIO[c.prio].toLowerCase() + '.' : ''),
                ratio: c.a.ratio, chiffre: c.a.genre === 'cr' ? fmtCr(c.a.reste) : fmt(c.a.reste), unite: c.a.genre === 'cr' ? 'cr' : (c.a.mot || ''),
                lien: 'bgs'
            };
        });

        // --- colonisation
        const colo = d.colo || {};
        const fr = colo.fraicheur || {};
        const noteGlobale = avantMiseEnService(fr.plus_ancienne) ? NOTE_COLO : '';
        const ideesColo = [];
        const ch = (colo.chantiers || [])[0];
        const pr = (colo.priorites || [])[0];
        const faireChantier = () => {
            if (!ch) return null;
            const pct = ch.requis > 0 ? Math.round(100 * ch.livre / ch.requis) : 0;
            return { id: 'colo-chantier', domaine: 'colo', etiquette: d.colo.perso ? 'VOTRE CHANTIER PERSONNEL' : 'COLONISATION · LE CHANTIER LE PLUS AVANCÉ',
                titre: nomStation(ch.station) + ' : il reste ' + fmt(ch.reste) + ' t à livrer',
                pourquoi: 'Chantier à ' + pct + ' % (système ' + (ch.systeme || '?') + '). Un dernier effort peut le terminer.',
                ratio: pct, chiffre: fmt(ch.reste), unite: 't', lien: 'colo', note: avantMiseEnService(ch.maj_le) ? NOTE_COLO : '' };
        };
        const fairePrio = () => {
            if (!pr) return null;
            return { id: 'colo-prio', domaine: 'colo', etiquette: 'COLONISATION',
                titre: pr.nom + ' : ' + fmt(pr.reste) + ' t manquent' + (pr.chantiers > 1 ? ' sur ' + pr.chantiers + ' chantiers' : ''),
                pourquoi: 'C\'est la marchandise la plus demandée par ' + (colo.perso ? 'les chantiers de votre espace personnel' : 'les chantiers de l\'escadron') + ' en ce moment. Les livraisons comptent pour le cycle.',
                ratio: null, chiffre: fmt(pr.reste), unite: 't', lien: 'colo', note: noteGlobale };
        };
        const colos = d.colo && d.colo.perso ? [faireChantier(), fairePrio()] : [fairePrio(), faireChantier()];
        colos.forEach(x => { if (x) ideesColo.push(x); });

        // --- carriere
        const carriere = [];
        if (d.membre && accesBgs && d.rang && d.rang.suivant_a != null && d.rang.restant > 0) {
            const pts = Math.ceil(d.rang.restant);
            carriere.push({ id: 'rang', domaine: 'prog', titre: pts + ' point' + (pts > 1 ? 's' : '') + ' avant le rang BGS ' + (d.rang.rang + 1),
                pourquoi: 'Toute action comptée dans une directive y contribue.', chiffre: String(pts), unite: 'pts', lien: 'rang' });
        }
        if (d.pp && d.pp.nom) {
            carriere.push({ id: 'pp', domaine: 'pp', titre: 'Powerplay : ' + fmt(d.pp.merites_cycle || 0) + ' mérites ce cycle',
                pourquoi: 'Les mérites se gagnent en agissant pour votre puissance (' + d.pp.nom + '), selon l\'action choisie dans le jeu.',
                chiffre: fmtCr(d.pp.merites_cycle || 0), unite: '', lien: 'pp' });
        }
        if (!d.membre) {
            carriere.push({ id: 'budget', domaine: 'prog', titre: 'Votre budget du cycle', pourquoi: 'Revenus et dépenses calculés pour vous. Rien à saisir.', chiffre: '', unite: '', lien: 'budget' });
            carriere.push({ id: 'rejoindre', domaine: 'esc', titre: 'Rejoindre un escadron',
                pourquoi: 'Directives BGS, rang de carrière, page Escadron, Pilier de la semaine. Votre espace personnel de colonisation reste le vôtre. Aucune obligation.', chiffre: '', unite: '', lien: 'rejoindre' });
        }

        // --- assemblage : recommandation = 1re directive ; sinon 1re idee de colonisation ; sinon la carriere
        const reste = idees.concat(ideesColo);
        if (reste.length) { res.hero = reste.shift(); }
        res.autres = reste;
        res.carriere = carriere;
        res.vide = !res.hero && !carriere.length;
        return res;
    }
    QF._construire = construire;   // exposé pour les tests

    // ---------------------------------------------------------------------------------------------
    // Lecture serveur (memoire 3 min + sessionStorage pour les changements de page)
    // ---------------------------------------------------------------------------------------------
    QF.charger = async function (force) {
        const now = Date.now();
        if (!force && cache && now - cache.ts < DUREE_CACHE) return cache.d;
        if (!force) {
            try {
                const s = JSON.parse(sessionStorage.getItem('edteam_qf_cache') || 'null');
                if (s && now - s.ts < DUREE_CACHE) { cache = s; return s.d; }
            } catch (e) {}
        }
        if (typeof supabaseApp === 'undefined') return null;
        const { data, error } = await supabaseApp.rpc('quoi_faire_donnees');
        if (error) { console.error('quoi_faire_donnees :', error); return cache ? cache.d : null; }
        cache = { ts: now, d: data };
        try { sessionStorage.setItem('edteam_qf_cache', JSON.stringify(cache)); } catch (e) {}
        return data;
    };

    const accesBgs = () => {
        if (typeof QF.accesBgsHook === 'function') { try { return !!QF.accesBgsHook(); } catch (e) {} }
        try { return localStorage.getItem('edteam_acces_bgs') !== 'false'; } catch (e) { return true; }
    };
    QF.modele = async function (force) {
        const d = await QF.charger(force);
        modele = construire(d, { accesBgs: accesBgs() });
        return modele;
    };

    // ---------------------------------------------------------------------------------------------
    // Affichage
    // ---------------------------------------------------------------------------------------------
    const ICONES = {
        bgs: '<polyline points="4.8,9.1 12,3.4 19.2,9.1"/><polyline points="4.8,13.9 12,8.2 19.2,13.9"/><polyline points="4.8,18.7 12,13 19.2,18.7"/>',
        colo: '<path d="M3 21h18M5 21V10l7-6 7 6v11M10 21v-6h4v6"/>',
        pp: '<circle cx="12" cy="12" r="9"/><path d="M12 7l1.8 3.7 4 .6-2.9 2.8.7 4L12 16.2 8.4 18.1l.7-4-2.9-2.8 4-.6z"/>',
        prog: '<path d="M4 18l5-6 4 3 7-9M15 6h5v5"/>',
        esc: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6M17 5a3.5 3.5 0 0 1 0 7M22 20c0-3-2-5-5-5.7"/>'
    };
    const COULEUR = { bgs: '#FF7100', colo: '#00F0FF', pp: '#B026FF', prog: '#FFD700', esc: '#00FF66' };
    const svg = k => '<svg viewBox="0 0 24 24">' + (ICONES[k] || ICONES.prog) + '</svg>';

    function injecterStyle() {
        if (document.getElementById('qf-style')) return;
        const st = document.createElement('style');
        st.id = 'qf-style';
        st.textContent = `
.qf{font-family:'Share Tech Mono',monospace;color:#ccc}
.qf-tete{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.qf-ti{letter-spacing:6px;color:#fff;font-size:1.05em}.qf-su{color:#7d7d7d;font-size:.78em;margin-top:4px;letter-spacing:1px}
.qf-re{color:#777;font-size:.78em;letter-spacing:1px;cursor:pointer;user-select:none}.qf-re:hover{color:#00F0FF}
.qf-grp{letter-spacing:4px;font-size:.72em;color:#777;margin:18px 0 8px;display:flex;align-items:center;gap:10px}
.qf-grp:after{content:"";flex:1;height:1px;background:linear-gradient(90deg,#333,transparent)}
.qf-hex{--c:#FF7100;width:58px;height:64px;flex:none;display:grid;place-items:center;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);background:linear-gradient(160deg,var(--c),transparent 130%);position:relative}
.qf-hex:before{content:"";position:absolute;inset:2px;clip-path:inherit;background:rgba(6,4,2,.92)}
.qf-hex svg{position:relative;width:26px;height:26px;stroke:var(--c);fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.qf-hex.p{width:40px;height:44px}.qf-hex.p svg{width:19px;height:19px}
.qf-cap{--c:#FF7100;position:relative;border:1px solid var(--c);padding:16px 18px 14px;display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center;cursor:pointer;
  background:linear-gradient(110deg,color-mix(in srgb,var(--c) 16%,transparent),color-mix(in srgb,var(--c) 3%,transparent) 55%,transparent),rgba(5,3,1,.92);
  clip-path:polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px);box-shadow:inset 0 0 40px color-mix(in srgb,var(--c) 8%,transparent)}
.qf-cap:before{content:"";position:absolute;top:0;left:14px;width:60px;height:3px;background:var(--c);box-shadow:0 0 12px var(--c)}
.qf-cap:hover{filter:brightness(1.15)}
.qf-etiq{font-size:.68em;letter-spacing:3px;color:var(--c);margin-bottom:6px}
.qf-cap .qf-t{color:#fff;font-size:1.2em;line-height:1.3}.qf-cap .qf-po{color:#a9a9a9;margin-top:6px;line-height:1.5;font-size:.88em}
.qf-jauge{margin-top:10px;display:flex;align-items:center;gap:10px;color:#999;font-size:.8em}
.qf-jauge i{display:block;height:5px;width:200px;max-width:50vw;background:#241a10;position:relative}.qf-jauge i b{position:absolute;left:0;top:0;bottom:0;background:var(--c);box-shadow:0 0 8px var(--c)}
.qf-dr{text-align:right;color:#8a8a8a;font-size:.8em;line-height:1.5;min-width:84px}.qf-dr .qf-ch{font-size:1.8em;color:var(--c);line-height:1}
.qf-lig{--c:#00F0FF;display:grid;grid-template-columns:auto 1fr auto 16px;gap:14px;align-items:center;padding:10px 14px;border:1px solid #1c1c1c;border-left:2px solid var(--c);background:linear-gradient(90deg,rgba(255,255,255,.03),transparent);margin-bottom:7px;cursor:pointer;transition:.15s}
.qf-lig:hover{border-color:var(--c);background:linear-gradient(90deg,rgba(255,255,255,.07),transparent);box-shadow:0 0 18px -6px var(--c)}
.qf-lig .qf-t{color:#fff;font-size:.96em}.qf-lig .qf-po{color:#8f8f8f;font-size:.8em;margin-top:3px;line-height:1.45}
.qf-lig .qf-me{text-align:right;color:var(--c);font-size:1.05em;white-space:nowrap;line-height:1.3}.qf-lig .qf-me small{display:block;color:#777;font-size:.7em;letter-spacing:1px}
.qf-lig .qf-fl{color:var(--c);opacity:.7}
.qf-maj{margin-top:8px;border:1px solid rgba(255,113,0,.55);background:rgba(255,113,0,.07);color:#d9a066;font-size:.78em;line-height:1.45;padding:6px 10px}
.qf-maj b{color:#FF7100;letter-spacing:2px;font-weight:normal}
.qf-pied{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:16px;color:#6a6a6a;font-size:.78em;letter-spacing:1px}
.qf-pied b{color:#FF7100;font-weight:normal}.qf-pied a{color:#00F0FF;opacity:.85;cursor:pointer;text-decoration:none}
.qf-styles{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;width:100%}
.qf-chip{border:1px solid #444;color:#aaa;padding:3px 10px;font-size:.8em;letter-spacing:1px;cursor:pointer}.qf-chip.on{border-color:#00F0FF;color:#00F0FF;background:rgba(0,240,255,.08)}
.qf-vide{border:1px dashed #333;padding:22px;text-align:center;color:#888;line-height:1.7}
.qf-bande{--c:#FF7100;--bdc:color-mix(in srgb,var(--c) 75%,transparent);position:relative;display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center;padding:12px 18px;border:1px solid var(--bdc);box-shadow:inset 0 0 26px color-mix(in srgb,var(--c) 9%,transparent);cursor:pointer;
  background:linear-gradient(180deg,color-mix(in srgb,var(--c) 8%,transparent),rgba(10,5,0,.88) 80px);
  clip-path:polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px);font-family:'Share Tech Mono',monospace}
.qf-bande:after{content:"";position:absolute;inset:0;pointer-events:none;z-index:4;box-shadow:inset 0 0 22px color-mix(in srgb,var(--c) 26%,transparent),inset 0 0 0 1px color-mix(in srgb,var(--c) 24%,transparent);background:linear-gradient(var(--c),var(--c)) 12px 0/46px 3px no-repeat,radial-gradient(ellipse at 50% 0,color-mix(in srgb,var(--c) 60%,transparent),transparent 70%) 4px 0/62px 16px no-repeat,linear-gradient(to bottom right,transparent calc(50% - 1px),var(--bdc) calc(50% - 1px),var(--bdc) calc(50% + 1px),transparent calc(50% + 1px)) left top/12px 12px no-repeat,linear-gradient(to bottom right,transparent calc(50% - 1px),var(--bdc) calc(50% - 1px),var(--bdc) calc(50% + 1px),transparent calc(50% + 1px)) right bottom/12px 12px no-repeat}

.qf-bande{transition:filter .2s}.qf-bande:hover{filter:brightness(1.22)}
.qf-bande .qf-k{font-size:.66em;letter-spacing:4px;color:var(--c)}.qf-bande .qf-l{color:#fff;font-size:1em;margin-top:3px;line-height:1.35}.qf-bande .qf-s{color:#8a8a8a;font-size:.76em;margin-top:2px}
.qf-bande .qf-f{color:var(--c);font-size:1.5em;opacity:.85}
.qf-slot .qf-bande{width:100%;height:100%;box-sizing:border-box;align-content:center}
.qf-carte{--c:#FF7100;--bdc:color-mix(in srgb,var(--c) 75%,transparent);transition:filter .2s;position:relative;flex:1 1 auto;min-width:0;box-sizing:border-box;border:1px solid var(--bdc);padding:11px 14px 9px;display:flex;flex-direction:column;gap:7px;cursor:pointer;font-family:'Share Tech Mono',monospace;
  background:linear-gradient(180deg,color-mix(in srgb,var(--c) 8%,transparent),rgba(10,5,0,.88) 80px);clip-path:polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)}
.qf-carte:after{content:"";position:absolute;inset:0;pointer-events:none;z-index:4;box-shadow:inset 0 0 22px color-mix(in srgb,var(--c) 26%,transparent),inset 0 0 0 1px color-mix(in srgb,var(--c) 24%,transparent);background:linear-gradient(to bottom right,transparent calc(50% - 1px),var(--bdc) calc(50% - 1px),var(--bdc) calc(50% + 1px),transparent calc(50% + 1px)) left top/14px 14px no-repeat,linear-gradient(to bottom right,transparent calc(50% - 1px),var(--bdc) calc(50% - 1px),var(--bdc) calc(50% + 1px),transparent calc(50% + 1px)) right bottom/14px 14px no-repeat}
.qf-carte:before{content:"";position:absolute;top:0;left:14px;width:46px;height:3px;background:var(--c);box-shadow:0 0 10px var(--c);z-index:5}
.qf-carte:hover{filter:brightness(1.22)}
.qf-carte .qf-t{color:#fff;font-size:1.02em;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.qf-carte .qf-po{color:#9a9a9a;font-size:.74em;line-height:1.4;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.qf-carte .qf-jauge{margin-top:0}.qf-carte .qf-jauge i{width:auto;flex:1;max-width:none}
.qf-pied2{margin-top:auto;color:var(--c);font-size:.7em;letter-spacing:2px;display:flex;justify-content:space-between;gap:8px}
.qf-slot .qf-bande .qf-l{font-size:1.15em}
@media (max-width:640px){.qf-cap{grid-template-columns:1fr;gap:8px;padding:14px}.qf-cap .qf-hex{display:none}.qf-cap .qf-dr{text-align:left;display:flex;gap:10px;align-items:baseline;min-width:0}
 .qf-lig{grid-template-columns:auto 1fr 12px;padding:9px 10px}.qf-lig .qf-me{display:none}.qf-hex{width:46px;height:50px}.qf-jauge i{width:140px}
 .qf-lig .qf-po{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.qf-lig .qf-maj .qf-po{display:block}
 .qf-bande{padding:10px 12px;gap:10px}.qf-bande .qf-hex{display:none}.qf-bande .qf-s{display:none}.qf-bande{grid-template-columns:1fr auto}}
`;
        document.head.appendChild(st);
    }

    // la note sur la fraicheur des chantiers n'est affichee qu'une seule fois par rendu (sur la premiere idee de colonisation visible)
    let noteMontree = false;
    const noteHtml = i => { if (!i.note || noteMontree) return ''; noteMontree = true; return '<div class="qf-maj"><b>IMPORTANT</b> · ' + esc(i.note) + '</div>'; };
    function carteHero(i, idx) {
        const c = COULEUR[i.domaine] || '#FF7100';
        return `<div class="qf-cap" style="--c:${c}" onclick="QF.ouvrir('${esc(i.id)}')"><div class="qf-hex" style="--c:${c}">${svg(i.domaine)}</div>
            <div><div class="qf-etiq">${esc(i.etiquette || '')}</div><div class="qf-t">${esc(i.titre)}</div><div class="qf-po">${esc(i.pourquoi)}</div>
            ${i.ratio != null ? `<div class="qf-jauge"><i><b style="width:${Math.round(i.ratio)}%"></b></i>${Math.round(i.ratio)} %</div>` : ''}
            ${noteHtml(i)}</div>
            <div class="qf-dr"><div class="qf-ch">${esc(i.chiffre || '')}</div>${esc(i.unite || '')}</div></div>`;
    }
    function ligne(i) {
        const c = COULEUR[i.domaine] || '#00F0FF';
        return `<div class="qf-lig" style="--c:${c}" onclick="QF.ouvrir('${esc(i.id)}')"><div class="qf-hex p" style="--c:${c}">${svg(i.domaine)}</div>
            <div><div class="qf-t">${esc(i.titre)}</div><div class="qf-po">${esc(i.pourquoi)}</div>${noteHtml(i)}</div>
            <div class="qf-me">${i.ratio != null ? Math.round(i.ratio) + ' %' : esc(i.chiffre || '')}${i.unite && i.ratio == null ? '<small>' + esc(i.unite) + '</small>' : ''}</div><div class="qf-fl">›</div></div>`;
    }

    // Bloc complet (fenetre PC ou onglet mobile)
    QF.html = function (m) {
        m = m || modele; if (!m) return '';
        noteMontree = false;
        if (m.vide) return '<div class="qf"><div class="qf-tete"><div><div class="qf-ti">QUOI FAIRE</div></div></div><div class="qf-vide">Rien de particulier à signaler : les directives de votre escadron avancent et aucun chantier n\'attend de livraison. Bonne navigation, Commandant.</div></div>';
        const fen = 3, total = m.autres.length;
        const debut = total ? (decalage * fen) % total : 0;
        const visibles = []; for (let k = 0; k < Math.min(fen, total); k++) visibles.push(m.autres[(debut + k) % total]);
        const styleAff = styleForce || m.style;
        let h = '<div class="qf"><div class="qf-tete"><div><div class="qf-ti">QUOI FAIRE</div><div class="qf-su">LÀ OÙ VOTRE AIDE COMPTE LE PLUS, EN CE MOMENT</div></div>'
            + (total > fen ? '<div class="qf-re" onclick="QF.autres()">↻ AUTRES IDÉES</div>' : '') + '</div>';
        if (m.hero) h += '<div class="qf-grp">RECOMMANDATION</div>' + carteHero(m.hero);
        if (visibles.length) h += '<div class="qf-grp">AUTRES OPPORTUNITÉS</div>' + visibles.map(ligne).join('');
        if (m.carriere.length) h += '<div class="qf-grp">' + (m.hero && m.hero.domaine === 'colo' && !m.carriere.some(x => x.id === 'rang') ? 'POUR VOTRE PARCOURS' : 'POUR VOTRE CARRIÈRE') + '</div>' + m.carriere.map(ligne).join('');
        h += '<div class="qf-pied"><div>' + (styleAff ? 'IDÉES ADAPTÉES À VOTRE STYLE : <b>' + esc(STYLES[styleAff] || '') + '</b> ' + (styleForce ? '' : '<span style="color:#555">(d\'après vos dernières semaines)</span> ') : 'AUCUN STYLE DÉTECTÉ POUR L\'INSTANT ')
            + '· <a onclick="QF.stylesToggle()">changer</a></div><div>RIEN N\'EST OBLIGATOIRE</div>'
            + '<div class="qf-styles" id="qf-styles" style="display:none">' + ['auto'].concat(Object.keys(STYLES)).map(k => `<span class="qf-chip${(k === 'auto' ? !styleForce : styleForce === k) ? ' on' : ''}" onclick="QF.style('${k}')">${k === 'auto' ? 'AUTOMATIQUE' : STYLES[k]}</span>`).join('') + '</div></div></div>';
        return h;
    };

    // Bande d'entree (QG PC, accueil mobile) : montre la recommandation
    QF.htmlBande = function (m) {
        m = m || modele;
        const i = m && !m.vide ? (m.hero || m.carriere[0]) : null;
        if (!i) return `<div class="qf-bande" style="--c:#00F0FF" onclick="QF.ouvrirTableau()" onmouseenter="if(typeof sonHover==='function') sonHover()"><div class="qf-hex p" style="--c:#00F0FF">${svg('esc')}</div><div><div class="qf-k">QUOI FAIRE</div><div class="qf-l">Ce qui aiderait le plus votre escadron et votre puissance</div></div><div class="qf-f">›</div></div>`;
        const c = COULEUR[i.domaine] || '#FF7100';
        return `<div class="qf-bande" style="--c:${c}" onclick="QF.ouvrirTableau()" onmouseenter="if(typeof sonHover==='function') sonHover()"><div class="qf-hex p" style="--c:${c}">${svg(i.domaine)}</div>
            <div><div class="qf-k">QUOI FAIRE · RECOMMANDATION</div><div class="qf-l">${esc(i.titre)}</div><div class="qf-s">D'autres idées vous attendent dans « Quoi faire »</div></div><div class="qf-f">›</div></div>`;
    };

    // Carte de recommandation (QG PC) : meme contenu que la bande, en carte haute pour partager la rangee avec « Ma puissance » et « Ma faction »
    QF.htmlCarte = function (m) {
        m = m || modele;
        const i = m && !m.vide ? (m.hero || m.carriere[0]) : null;
        const c = i ? (COULEUR[i.domaine] || '#FF7100') : '#FF7100';
        if (!i) return '<div class="qf-carte" style="--c:' + c + ';" onclick="QF.ouvrirTableau()" onmouseenter="if(typeof sonHover===\'function\') sonHover()"><div class="qf-etiq">QUOI FAIRE</div><div class="qf-t">Ce qui aiderait le plus votre escadron et votre puissance</div><div class="qf-pied2"><span>VOIR LES IDÉES</span><span>›</span></div></div>';
        return '<div class="qf-carte" style="--c:' + c + ';" onclick="QF.ouvrirTableau()" onmouseenter="if(typeof sonHover===\'function\') sonHover()"><div class="qf-etiq">QUOI FAIRE · RECOMMANDATION</div>'
            + '<div class="qf-t">' + esc(i.titre) + '</div><div class="qf-po">' + esc(i.pourquoi) + '</div>'
            + (i.ratio != null ? '<div class="qf-jauge"><i><b style="width:' + Math.round(i.ratio) + '%"></b></i>' + Math.round(i.ratio) + ' %</div>' : '')
            + '<div class="qf-pied2"><span>D’AUTRES IDÉES DANS « QUOI FAIRE »</span><span>›</span></div></div>';
    };

    QF.monterBande = async function (idConteneur) {
        injecterStyle();
        const el = document.getElementById(idConteneur); if (!el) return;
        try {
            const m = await QF.modele(false);
            const h = el.dataset.style === 'carte' ? QF.htmlCarte(m) : QF.htmlBande(m);
            el.innerHTML = h; el.style.display = h ? (el.dataset.display || 'block') : 'none';
        } catch (e) { console.error('Quoi faire (bande) :', e); }
    };
    QF.monterTableau = async function (idConteneur, force) {
        injecterStyle();
        const el = document.getElementById(idConteneur); if (!el) return;
        if (!force && modele) el.innerHTML = QF.html(modele);
        else el.innerHTML = '<div class="qf"><div class="qf-vide">Recherche des meilleures idées…</div></div>';
        try { const m = await QF.modele(!!force); el.innerHTML = QF.html(m); } catch (e) { console.error('Quoi faire :', e); el.innerHTML = '<div class="qf"><div class="qf-vide">Impossible de charger les idées pour le moment.</div></div>'; }
        QF._conteneur = idConteneur;
    };
    function redessiner() { const el = QF._conteneur && document.getElementById(QF._conteneur); if (el) el.innerHTML = QF.html(modele); }
    QF.autres = function () { decalage++; if (typeof sonClic === 'function') sonClic(); redessiner(); };
    QF.stylesToggle = function () { const e = document.getElementById('qf-styles'); if (e) e.style.display = e.style.display === 'none' ? 'flex' : 'none'; };
    QF.style = function (k) {
        styleForce = (k === 'auto') ? null : k;
        try { if (styleForce) localStorage.setItem('edteam_qf_style', styleForce); else localStorage.removeItem('edteam_qf_style'); } catch (e) {}
        decalage = 0;
        if (cache) modele = construire(cache.d, { accesBgs: accesBgs() });
        redessiner();
        const e = document.getElementById('qf-styles'); if (e) e.style.display = 'flex';
    };

    // Ouvrir une idee : chaque page branche ses propres destinations (PC : navigation ; mobile : onglets et feuilles)
    QF.destinations = { bgs: function () { window.location.href = 'bgs.html'; }, colo: function () { window.location.href = 'colonisation.html'; },
        rang: function () { window.location.href = 'bgs.html'; }, pp: function () {}, budget: function () { window.location.href = 'budget.html'; }, rejoindre: function () {} };
    QF.ouvrir = function (id) {
        if (typeof sonClic === 'function') sonClic();
        if (!modele) return;
        const tout = [modele.hero].concat(modele.autres, modele.carriere).filter(Boolean);
        const i = tout.find(x => x.id === id); if (!i) return;
        const f = QF.destinations[i.lien]; if (typeof f === 'function') f(i);
    };
    QF.ouvrirTableau = function () { if (typeof QF.onOuvrirTableau === 'function') QF.onOuvrirTableau(); };
})();
