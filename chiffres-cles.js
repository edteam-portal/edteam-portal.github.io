// =====================================================================================================
//  CHIFFRES CLES DE L'ESCADRON (page Escadron) : une carte par module, UN appel (qg_chiffres_cles), memoire de 15 minutes.
//  Zone attendue dans la page : <div id="qg-chiffres"><div id="qg-chiffres-corps"></div></div> ; appel : chargerChiffresQG(profilCommandant).
//  Ecran de 14 pouces : les cinq cartes restent sur une seule ligne.
// =====================================================================================================
(function () {
    const st = document.createElement('style');
    st.textContent = "/* Chiffres clés : une carte par module (cadre standard du site) */\n#qg-chiffres-corps { display: grid; gap: 12px; grid-template-columns: 1fr 1.15fr 1.9fr 1fr 2fr; }\n/* ecrans de 14 pouces : les cinq cartes restent sur UNE seule ligne (chiffres et marges resserres) ; en dessous de 1100 px seulement, elles passent a la ligne */\n@media (max-width: 1400px) { #qg-chiffres-corps { grid-template-columns: minmax(0,.9fr) minmax(0,1.1fr) minmax(0,1.7fr) minmax(0,1fr) minmax(0,2.3fr); gap: 8px; } .qg-ch { padding: 12px 10px; } .qg-st-ligne { gap: 8px 14px; } .qg-st-val { font-size: 1.5em; } .qg-st-grille { grid-template-columns: repeat(4, minmax(0,1fr)); gap: 8px; } .qg-st-grille .qg-st-val { font-size: 1.4em; } .qg-st-lib { font-size: 0.6em; letter-spacing: 0.6px; } .qg-bulles { gap: 4px; } .qg-bulle { width: 48px; height: 48px; font-size: 1.3em; } .qg-ch-titre { letter-spacing: 1.5px; } }\n@media (max-width: 1100px) { #qg-chiffres-corps { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); } .qg-st-ligne { flex-wrap: wrap !important; } .qg-st-grille { grid-template-columns: repeat(auto-fit, minmax(78px, 1fr)); } }\n.qg-ch { cursor: pointer; padding: 14px 16px; transition: filter 0.2s; display: flex; flex-direction: column; }\n.qg-ch > :last-child { margin: auto 0; }   /* centre le contenu en hauteur sans changer son affichage */\n.qg-ch:hover { filter: brightness(1.22); }\n.qg-ch-tete { display: flex; align-items: center; gap: 9px; margin-bottom: 12px; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 9px; }\n.qg-ch-ico { width: 22px; height: 22px; color: var(--accent); filter: drop-shadow(0 0 4px var(--accent)); display: inline-flex; flex: none; }\n.qg-ch-ico svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }\n.qg-ch-titre { color: var(--accent); letter-spacing: 3px; font-size: 0.8em; font-weight: bold; }\n.qg-st-ligne { display: flex; gap: 12px 26px; flex-wrap: nowrap; align-items: flex-end; }\n.qg-st-grille { display: grid; grid-template-columns: repeat(auto-fit, minmax(78px, 1fr)); gap: 12px 14px; }\n.qg-st-grille .qg-st-val { font-size: 1.7em; }\n.qg-st-val { color: #fff; font-size: 1.9em; font-weight: bold; line-height: 1.05; text-shadow: 0 0 14px rgba(255,255,255,0.12); }\n.qg-st-val small { color: var(--accent); font-size: 0.42em; margin-left: 5px; letter-spacing: 1px; }\n.qg-st-lib { color: #888; font-size: 0.66em; letter-spacing: 1.2px; margin-top: 4px; }\n.qg-bulles { display: flex; justify-content: space-around; gap: 10px; }\n.qg-bulle-bloc { text-align: center; }\n.qg-bulle { width: 62px; height: 62px; border-radius: 50%; border: 2px solid var(--b); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.6em; font-weight: bold; box-shadow: 0 0 14px var(--b), inset 0 0 14px rgba(0,0,0,0.6); margin: 0 auto; background: radial-gradient(circle, rgba(255,255,255,0.06), transparent 70%); }\n.qg-bulle.zero { opacity: 0.4; box-shadow: none; }\n.qg-bulle-bloc .qg-st-lib { margin-top: 7px; }\n";
    document.head.appendChild(st);
})();
const SUR_ESCADRON = /escadron\.html/i.test(location.pathname);
async function chargerChiffresQG(profil) {
    const zone = document.getElementById('qg-chiffres');
    const corps = document.getElementById('qg-chiffres-corps');
    if (!zone || !corps) return;
    if (!profil || !profil.escadron_id || profil.escadron_id === 'INDEPENDANT') { zone.style.display = 'none'; return; }
    const cle = 'edteam_qg_chiffres_' + profil.user_id;
    let d = null;
    try { const c = JSON.parse(sessionStorage.getItem(cle) || 'null'); if (c && Date.now() - c.ts < 900000) d = c.d; } catch (e) {}
    if (!d) {
        try {
            const { data, error } = await supabaseApp.rpc('qg_chiffres_cles');
            if (error) throw error;
            d = data;
            try { sessionStorage.setItem(cle, JSON.stringify({ ts: Date.now(), d })); } catch (e) {}
        } catch (e) { console.error('Erreur chiffres clés :', e); }
    }
    if (!d || !d.escadron) { corps.innerHTML = '<div style="color: #777; font-style: italic; text-align: center; padding: 14px; grid-column: 1 / -1;">Chiffres indisponibles pour le moment.</div>'; return; }
    const fmt = new Intl.NumberFormat('fr-FR');
    const compact = n => { n = Number(n) || 0; if (n >= 1e9) return [(n / 1e9).toFixed(2).replace('.', ','), 'Md']; if (n >= 1e6) return [(n / 1e6).toFixed(1).replace('.', ','), 'M']; return [fmt.format(n), '']; };
    const stat = (val, lib, unite) => `<div class="qg-st"><div class="qg-st-val">${val}${unite ? `<small>${unite}</small>` : ''}</div><div class="qg-st-lib">${lib}</div></div>`;
    const bulle = (n, lib, couleur) => `<div class="qg-bulle-bloc"><div class="qg-bulle${Number(n) === 0 ? ' zero' : ''}" style="--b: ${couleur};">${fmt.format(n)}</div><div class="qg-st-lib">${lib}</div></div>`;
    const ico = {
        esc: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="9" r="2.6"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M14.5 14.2c3.2-.7 6.5 1.2 6.5 5.3"/></svg>',
        ren: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3"/><path d="M12 1.5v5M12 17.5v5M1.5 12h5M17.5 12h5"/></svg>',
        bgs: '<svg viewBox="0 0 24 24"><polyline points="5,10 12,4 19,10"/><polyline points="5,15 12,9 19,15"/><polyline points="5,20 12,14 19,20"/></svg>',
        pp: '<svg viewBox="0 0 24 24"><polygon points="12,2.5 20.5,7.2 20.5,16.8 12,21.5 3.5,16.8 3.5,7.2"/><circle cx="12" cy="12" r="2.6"/></svg>',
        col: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><ellipse cx="12" cy="12" rx="10.5" ry="4.2" transform="rotate(-28 12 12)"/></svg>'
    };
    const carte = (variante, titre, icone, contenu, action, aide) => `<div class="bloc ${variante} qg-ch" onclick="${action}" onmouseenter="if(typeof sonHover === 'function') sonHover()" title="${aide}">
        <div class="qg-ch-tete"><span class="qg-ch-ico">${icone}</span><span class="qg-ch-titre">${titre}</span></div>${contenu}</div>`;
    const cr = compact(d.cr_bgs), mp = compact(d.merites_pp), tn = compact(d.tonnes);
    corps.innerHTML = [
        carte('vert', 'ESCADRON', ico.esc,
            `<div class="qg-st-ligne">${stat(fmt.format(d.pilotes), 'PILOTES INSCRITS')}</div>`,
            SUR_ESCADRON ? 'void 0' : "window.location.href='escadron.html'", SUR_ESCADRON ? "Effectif de l'escadron" : "Voir l'escadron"),
        carte('rouge', 'RENSEIGNEMENT', ico.ren,
            `<div class="qg-bulles">${bulle(d.kos, 'KOS', '#FF3333')}${bulle(d.suspects, 'SUSPECTS', '#FF7100')}${bulle(d.allies, 'ALLIÉS VIP', '#00FF66')}</div>`,
            "if (typeof ouvrirBureauRenseignement === 'function') ouvrirBureauRenseignement(); else window.location.href = 'index.html?renseignement'", 'Ouvrir le registre tactique'),
        carte('', 'BGS', ico.bgs,
            `<div class="qg-st-ligne">${stat(fmt.format(d.points_bgs), 'POINTS BGS CUMULÉS')}${stat(cr[0], 'CR GÉNÉRÉS POUR LA BGS', cr[1] + ' CR')}</div>`,
            "window.location.href='bgs.html'", 'Points de carrière cumulés de l\'escadron ; CR : vente, sécurité, science et contrebande réunies'),
        carte('cy', 'POWERPLAY', ico.pp,
            `<div class="qg-st-ligne">${stat(mp[0], 'MÉRITES CUMULÉS DES PILOTES', mp[1])}</div>`,
            "ouvrirCarriere('pp')", 'Ouvrir la salle Powerplay'),
        carte('or', 'COLONISATION', ico.col,
            `<div class="qg-st-grille">${stat(fmt.format(d.systemes), 'SYSTÈMES COLONISÉS')}${stat(fmt.format(d.stations), 'STATIONS CONSTRUITES')}${stat(fmt.format(d.chantiers), 'CHANTIERS EN COURS')}${stat(tn[0], 'LIVRÉES', tn[1] + ' t')}</div>`,
            "window.location.href='colonisation.html'", 'Ouvrir la colonisation')
    ].join('');
}
