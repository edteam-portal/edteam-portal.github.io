// ==========================================
// 0. MESURE D'AUDIENCE : chargee par analytics.js, SEULEMENT apres le consentement du visiteur (banniere « Accepter / Refuser »)
// ==========================================
(function initAnalytics() {
    const s = document.createElement('script');
    s.src = 'analytics.js?v=2';
    s.async = true;
    document.head.appendChild(s);
    // relais pour tracer des evenements personnalises de la flotte (sans effet tant que GA n'est pas charge)
    window.tracerAction = window.tracerAction || function (nomEvenement, parametres = {}) {
        if (typeof window.gtag === 'function') window.gtag('event', nomEvenement, parametres);
    };
})();

// ==========================================
// 0. NOYAU SUPABASE GLOBAL
// ==========================================
window.supabaseUrl = 'https://oailvdigfdoyfcydmabb.supabase.co';
window.supabaseKey = 'sb_publishable_AASqgRggHdIGttZHPGaWkA_VqrhuYNg';
window.supabaseApp = window.supabase.createClient(window.supabaseUrl, window.supabaseKey);

function injecterArchitectureGlobale() {
    const path = window.location.pathname;
    const page = path.split("/").pop() || "index.html";

    // Pilote sans escadron : BGS et Escadron restent visibles (avec un cadenas) et ouvrent une page de presentation (vitrine-module.js)
    let indep = false; try { indep = localStorage.getItem('edteam_independant') === 'true'; } catch (e) {}

    // --- A. LE MENU LATÉRAL ---
    const menuHTML = `
        <div class="nav-link hamburger-btn" onclick="toggleMenu()" onmouseenter="if(typeof sonHover==='function') sonHover()">
            <div class="nav-icon"><svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg></div>
            <span class="nav-text">MENU</span>
        </div>
        <a href="index.html" class="nav-link ${page === 'index.html' ? 'active' : ''}" onmouseenter="if(typeof sonHover==='function') sonHover()">
            <div class="nav-icon" style="position: relative;">
                <svg viewBox="0 0 24 24"><path d="M12 2l8 3v6c0 5-3.5 8.6-8 11-4.5-2.4-8-6-8-11V5z"></path><polygon points="12 7.5 13.4 10.4 16.5 10.8 14.2 13 14.8 16.1 12 14.6 9.2 16.1 9.8 13 7.5 10.8 10.6 10.4"></polygon></svg>
                <span id="badge-amiraute" style="display: none; position: absolute; top: -8px; right: -12px; background: #FF3333; color: #fff; border-radius: 10px; padding: 1px 5px; font-size: 0.75em; font-weight: bold; box-shadow: 0 0 8px #FF3333; z-index: 10; text-align: center;">0</span>
            </div>
            <span class="nav-text">QUARTIER GÉNÉRAL</span>
        </a>
        <a href="budget.html" id="nav-link-budget" class="nav-link ${page === 'budget.html' ? 'active' : ''}" onmouseenter="if(typeof sonHover==='function') sonHover()">
            <div class="nav-icon"><svg viewBox="0 0 24 24"><ellipse cx="12" cy="7" rx="7" ry="3"></ellipse><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7"></path><path d="M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"></path></svg></div>
            <span class="nav-text">BUDGET</span>
        </a>
        <a href="tableau-de-bord.html" id="nav-link-tableau" class="nav-link ${page === 'tableau-de-bord.html' ? 'active' : ''}" onmouseenter="if(typeof sonHover==='function') sonHover()">
            <div class="nav-icon"><svg viewBox="0 0 24 24"><path d="M4 18a8 8 0 1 1 16 0"></path><line x1="12" y1="18" x2="16" y2="10"></line><circle cx="12" cy="18" r="1.2"></circle></svg></div>
            <span class="nav-text">TABLEAU DE BORD</span>
        </a>
        <a href="escadron.html" id="nav-link-escadron" class="nav-link ${page === 'escadron.html' ? 'active' : ''}${indep ? ' verrou' : ''}" ${indep ? 'title="Réservé aux membres d\'un escadron"' : ''} style="display: ${(indep || localStorage.getItem('edteam_acces_escadron') === 'true') ? 'flex' : 'none'};" onmouseenter="if(typeof sonHover==='function') sonHover()">
            <div class="nav-icon"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
            <span class="nav-text">ESCADRON</span>
        </a>
        <a href="bgs.html" id="nav-bgs-factions" class="nav-link ${page === 'bgs.html' ? 'active' : ''}${indep ? ' verrou' : ''}" ${indep ? 'title="Réservé aux membres d\'un escadron"' : ''} style="display: ${(indep || localStorage.getItem('edteam_acces_bgs') === 'true') ? 'flex' : 'none'};" onmouseenter="if(typeof sonHover==='function') sonHover()">
            <div class="nav-icon" style="position: relative;">
                <svg viewBox="0 0 24 24"><polyline points="4.8,9.1 12,3.4 19.2,9.1"></polyline><polyline points="4.8,13.9 12,8.2 19.2,13.9"></polyline><polyline points="4.8,18.7 12,13 19.2,18.7" stroke-dasharray="1.6 1.6"></polyline></svg>
                <span id="badge-escadron" style="display: none; position: absolute; top: -8px; right: -12px; background: #FF3333; color: #fff; border-radius: 10px; padding: 1px 5px; font-size: 0.75em; font-weight: bold; box-shadow: 0 0 8px #FF3333; z-index: 9999 !important; text-align: center;">0</span>
            </div>
            <span class="nav-text">BGS</span>
        </a>
        <a href="colonisation.html" id="nav-link-colonisation" class="nav-link ${page === 'colonisation.html' ? 'active' : ''}" style="display: flex;" onmouseenter="if(typeof sonHover==='function') sonHover()">
            <div class="nav-icon"><svg viewBox="0 0 24 24"><circle cx="11" cy="16" r="5.5"></circle><ellipse cx="11" cy="16" rx="9.5" ry="2.6" transform="rotate(-18 11 16)"></ellipse><line x1="11" y1="10.5" x2="11" y2="3"></line><path d="M11 3l8 2.5-8 2.5"></path></svg></div>
            <span class="nav-text">COLONISATION</span>
        </a>
        <a href="trombinoscope.html" id="nav-link-trombinoscope" class="nav-link ${page === 'trombinoscope.html' ? 'active' : ''}" style="display: none;" onmouseenter="if(typeof sonHover==='function') sonHover()">
            <div class="nav-icon"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="12" cy="10" r="3"></circle><path d="M6.5 18c.8-2.4 2.9-3.5 5.5-3.5s4.7 1.1 5.5 3.5"></path></svg></div>
            <span class="nav-text">PHOTOS DES PILOTES</span>
        </a>
        <a href="#" id="nav-nouveautes" class="nav-link" style="margin-top: auto; border-top: 1px solid rgba(255, 255, 255, 0.1);" onclick="event.preventDefault(); if(typeof edteamOuvrirNouveautes==='function') edteamOuvrirNouveautes()" onmouseenter="if(typeof sonHover==='function') sonHover(); if(typeof showHoloTooltip==='function') showHoloTooltip(event, 'NOUVEAUTÉS<br><span style=\\'color:#ccc; font-size:0.85em; font-weight:normal;\\'>Ce qui vient d\\'être ajouté à EDTEAM</span>', '#FFD700')" onmouseleave="if(typeof hideHoloTooltip==='function') hideHoloTooltip()" onmousemove="if(typeof moveHoloTooltip==='function') moveHoloTooltip(event)">
            <div class="nav-icon" style="position: relative;"><svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg><span class="ft-point" style="display: none; position: absolute; top: -3px; right: -4px; width: 9px; height: 9px; border-radius: 50%; background: #FF7100; box-shadow: 0 0 8px #FF7100;"></span></div>
            <span class="nav-text">NOUVEAUTÉS</span>
        </a>
        <a href="#" id="nav-gestion-compte" class="nav-link" onclick="event.preventDefault(); ouvrirModal('modal-gestion-compte', event)" onmouseenter="if(typeof sonHover==='function') sonHover(); if(typeof showHoloTooltip==='function') showHoloTooltip(event, 'GESTION DU COMPTE<br><span style=\\'color:#ccc; font-size:0.85em; font-weight:normal;\\'>Clé EDMC, e-mail, mot de passe, suppression du compte</span>', '#FF7100')" onmouseleave="if(typeof hideHoloTooltip==='function') hideHoloTooltip()" onmousemove="if(typeof moveHoloTooltip==='function') moveHoloTooltip(event)">
            <div class="nav-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg></div>
            <span class="nav-text">GESTION DU COMPTE</span>
        </a>
        <a href="#" id="nav-deconnexion" class="nav-link" style="margin-bottom: 16px; margin-top: 10px;" onclick="event.preventDefault(); deconnexion()" onmouseenter="if(typeof sonHover==='function') sonHover(); this.style.color='var(--ed-red)'; this.style.borderLeftColor='var(--ed-red)'; this.style.background='rgba(255,51,51,0.1)'; if(typeof showHoloTooltip==='function') showHoloTooltip(event, 'DÉCONNEXION<br><span style=\\'color:#ccc; font-size:0.85em; font-weight:normal;\\'>Quitter votre session</span>', '#FF3333')" onmouseleave="this.style.color=''; this.style.borderLeftColor=''; this.style.background=''; if(typeof hideHoloTooltip==='function') hideHoloTooltip()" onmousemove="if(typeof moveHoloTooltip==='function') moveHoloTooltip(event)">
            <div class="nav-icon"><svg viewBox="0 0 24 24"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg></div>
            <span class="nav-text">DÉCONNEXION</span>
        </a>
    `;

    // --- B. LE HEADER GLOBAL ---
    const headerGlobalHTML = `
        <style>
            @media (max-width: 900px) { #beta-badge { margin-left: 5px !important; padding: 1px 4px !important; letter-spacing: 1px !important; } }
            .info-btn { cursor: pointer; font-weight: bold; transition: 0.2s; display: inline-block; padding: 0 4px; }
            .info-btn:hover { color: #fff !important; text-shadow: 0 0 8px currentColor; transform: scale(1.1); }
            /* pastilles de rang : Powerplay, BGS, Federation (fenetres : carriere.js, ouvrables depuis toutes les pages) */
            .hd-sep { width: 1px; align-self: stretch; margin: 6px 2px; background: linear-gradient(transparent, #333, transparent); flex: none; }
            .hd-rangs { display: flex; align-items: center; gap: 8px; flex: none; }
            .hd-rg { --c: #00F0FF; position: relative; display: flex; align-items: center; gap: 8px; height: 48px; padding: 0 12px 0 8px; border: 1px solid color-mix(in srgb, var(--c) 55%, transparent); border-radius: 5px; cursor: pointer; white-space: nowrap;
                     background: linear-gradient(135deg, color-mix(in srgb, var(--c) 14%, transparent), rgba(0,0,0,.55)); transition: .15s; box-sizing: border-box; }
            .hd-rg:hover { border-color: var(--c); box-shadow: 0 0 16px -2px var(--c), inset 0 0 14px color-mix(in srgb, var(--c) 18%, transparent); transform: translateY(-1px); }
            .hd-rg .hx { width: 30px; height: 33px; flex: none; display: grid; place-items: center; clip-path: polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%); background: linear-gradient(160deg, var(--c), transparent 130%); position: relative; }
            .hd-rg .hx:before { content: ""; position: absolute; inset: 1.5px; clip-path: inherit; background: rgba(6,4,2,.92); }
            .hd-rg .hx svg { position: relative; width: 15px; height: 15px; stroke: var(--c); fill: none; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
            .hd-rg .tx { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
            .hd-rg .l { font-size: .58em; letter-spacing: 2px; color: var(--c); opacity: .9; }
            .hd-rg .v { font-size: .92em; color: #fff; font-weight: bold; letter-spacing: 1px; line-height: 1.1; }
            .hd-rg .v small { color: #9a9a9a; font-weight: normal; font-size: .8em; letter-spacing: .5px; margin-left: 4px; }
            .hd-rg .vc { display: none; }
            .hd-rg .bar { position: absolute; left: 8px; right: 8px; bottom: 3px; height: 2px; background: rgba(255,255,255,.08); }
            .hd-rg .bar b { display: block; height: 100%; background: var(--c); box-shadow: 0 0 5px var(--c); }
            .hd-rg .pil { position: absolute; top: -7px; right: -6px; background: var(--c); color: #000; font-size: .6em; font-weight: bold; padding: 1px 6px; border-radius: 7px; letter-spacing: 1px; }
            .hd-rg.nonaligne { --c: #6b7a80; }
            @media (max-width: 1500px) {
                .hd-rg { height: 44px; padding: 0 10px 0 6px; gap: 6px; } .hd-rg .l { display: none; } .hd-rg .hx { width: 27px; height: 30px; }
                .hd-rg .vl { display: none; } .hd-rg .vc { display: inline; } .hd-rg .v small { display: none; }
                .hd-rangs { gap: 6px; }
                #header-escadron { min-width: 0 !important; padding: 5px 11px !important; }
                #stats-pilotes-box { padding: 4px 10px !important; } #stats-pilotes-box .stats-lib { display: none; }
            }
        </style>
        <header class="hud-header" style="display: flex; flex-direction: row; align-items: stretch; justify-content: space-between; flex-wrap: nowrap; gap: 15px; margin-bottom: 15px; width: 100%; border-bottom: 2px solid var(--ed-orange); padding-bottom: 15px; flex-shrink: 0;">
            <div style="display: flex; align-items: stretch; gap: 15px; flex-shrink: 0;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <svg class="app-logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width: 45px; height: 45px;">
                        <polygon points="48,15 15,35 30,50 10,70 48,85 48,65 30,55 48,40" fill="#00F0FF" />
                        <polygon points="52,15 85,35 70,50 90,70 52,85 52,65 70,55 52,40" fill="#FF7100" />
                        <polygon points="50,45 42,55 50,65 58,55" fill="#FFFFFF" opacity="0.9" />
                    </svg>
                    <div style="display: flex; flex-direction: column; justify-content: center;">
                        <h1 style="margin: 0; font-size: 1.6em; letter-spacing: 2px; font-weight: normal; color: inherit; line-height: 1; white-space: nowrap;">EDTEAM<a id="beta-badge" href="https://discord.gg/max5W9FreN" target="_blank" rel="noopener" onmouseenter="if(typeof showHoloTooltip === 'function') showHoloTooltip(event, 'VERSION BÊTA<br><span style=&quot;color:#ccc; font-size:0.8em; font-weight:normal;&quot;>L’application évolue vite : des bugs peuvent subsister.<br>Un souci ? Signalez-le sur le Discord, ça nous aide à corriger.</span>', '#FF7100')" onmouseleave="if(typeof hideHoloTooltip === 'function') hideHoloTooltip()" onmousemove="if(typeof moveHoloTooltip === 'function') moveHoloTooltip(event)" style="display: inline-block; margin-left: 10px; vertical-align: middle; font-size: 0.4em; letter-spacing: 2px; font-weight: bold; color: #FF7100; border: 1px solid #FF7100; background: rgba(255,113,0,0.1); padding: 2px 7px; border-radius: 3px; text-decoration: none; cursor: pointer; text-shadow: 0 0 6px rgba(255,113,0,0.5);">BÊTA</a></h1>
                        <span id="cmdr-name-display" style="font-size: 0.6em; color: var(--ed-blue); letter-spacing: 3px; font-weight: bold; margin-top: 2px; white-space: nowrap;">CMDR [ EN ATTENTE ]</span>
                    </div>
                </div>

                <div id="header-escadron"
                    style="display: flex; flex-direction: column; justify-content: center; align-items: flex-start; font-size: 0.8em; letter-spacing: 1px; gap: 4px; background: rgba(255, 113, 0, 0.05); border: 1px solid rgba(255, 113, 0, 0.3); border-radius: 4px; padding: 5px 14px; white-space: nowrap; box-sizing: border-box; min-width: 150px;">
                    <div id="header-escadron-nom" style="color: var(--ed-orange); font-size: 1.1em; font-weight: bold; letter-spacing: 2px; line-height: 1.1;">---</div>
                    <div id="header-grades" style="display: flex; gap: 6px; flex-wrap: nowrap;"></div>
                </div>

                <div class="hd-sep"></div>
                <div id="header-rangs" class="hd-rangs"></div>



            </div>
            <div style="display: flex; align-items: center; justify-content: flex-end; flex-grow: 1; padding-right: 5px; gap: 8px;">
                    <div id="header-inscriptions" onclick="ouvrirInscriptionsEnCours()"
                        style="display: none; flex-direction: column; justify-content: center; align-items: center; text-align: center; font-size: 0.8em; letter-spacing: 1px; gap: 2px; background: rgba(255, 113, 0, 0.05); border: 1px solid rgba(255, 113, 0, 0.4); border-radius: 4px; padding: 4px 14px; cursor: pointer; white-space: nowrap; box-sizing: border-box;"
                        title="Comptes créés mais pas encore finalisés au sas (visible du Directeur seulement)">
                        <div class="stats-lib" style="color: #888; font-size: 0.75em; font-weight: bold;">INSCRIPTIONS EN COURS</div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span><span id="insc-nb" style="color: #fff; font-size: 1.15em; font-weight: bold;">--</span> <span style="color:#666; font-size:0.7em;">COMPTES</span></span>
                            <span style="color:#333;">|</span>
                            <span style="color:#666; font-size:0.7em;">PLUS ANCIEN : <span id="insc-ancien" style="color: #FF7100; font-size: 1.15em; font-weight: bold;">--</span></span>
                        </div>
                    </div>
                    <div id="stats-pilotes-box"
                        style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; font-size: 0.8em; letter-spacing: 1px; gap: 2px; background: rgba(0, 255, 102, 0.05); border: 1px solid rgba(0, 255, 102, 0.3); border-radius: 4px; padding: 4px 14px; cursor: help; white-space: nowrap; box-sizing: border-box;"
                        onmouseenter="if(typeof showHoloTooltip === 'function') showHoloTooltip(event, 'EFFECTIFS DE LA FLOTTE<br><span style=\\'color:#ccc; font-size:0.8em; font-weight:normal;\\'>Inscrits : tous les commandants approuves.<br>Actifs : au moins une action enregistree<br>durant les 30 derniers jours,<br>tous escadrons confondus.</span>', '#00FF66')"
                        onmouseleave="if(typeof hideHoloTooltip === 'function') hideHoloTooltip()"
                        onmousemove="if(typeof moveHoloTooltip === 'function') moveHoloTooltip(event)">
                        <div class="stats-lib" style="color: #888; font-size: 0.75em; font-weight: bold;">FLOTTE</div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span><span id="stats-inscrits-val" style="color: #fff; font-size: 1.15em; font-weight: bold;">--</span> <span style="color:#666; font-size:0.7em;">INSCRITS</span></span>
                            <span style="color:#333;">|</span>
                            <span><span id="stats-actifs-val" style="color: #00FF66; font-size: 1.15em; font-weight: bold;">--</span> <span style="color:#666; font-size:0.7em;">ACTIFS (30J)</span></span>
                        </div>
                    </div>
            </div>
        </header>
    `;

    // --- C. LES MODALES GLOBALES ---
    const modalesGlobalesHTML = `
        <div class="modal-overlay" id="modal-gestion-compte" onclick="fermerModal('modal-gestion-compte', event)" style="z-index: 3500;">
            <div class="modal-content" style="max-width: 980px; width: 95%; background: rgba(10, 5, 0, 0.95); border: 1px solid var(--ed-orange); box-shadow: 0 0 30px rgba(255, 113, 0, 0.2);" onclick="event.stopPropagation()">
                <style>#gc-grille { column-width: 380px; column-gap: 20px; } #gc-grille > * { break-inside: avoid; margin-bottom: 20px; } #gc-grille > .gc-danger { column-span: all; margin-bottom: 0; }</style>
                <div class="modal-close" style="color: var(--ed-orange);" onclick="fermerModal('modal-gestion-compte')">X</div>
                <div style="color: var(--ed-orange); border-bottom: 1px solid var(--ed-orange); padding-bottom: 10px; margin-bottom: 25px; font-weight: bold; font-size: 1.2em; letter-spacing: 2px;">⚙️ GESTION DU COMPTE</div>
                <div id="gc-grille">
                    <div id="bloc-photo-compte" style="background: rgba(255, 113, 0, 0.06); padding: 15px; border: 1px solid var(--ed-orange); border-radius: 4px;">
                        <label style="color: var(--ed-orange); font-size: 0.8em; font-weight: bold; letter-spacing: 1px; display: block; margin-bottom: 10px;">MA PHOTO DE COMMANDANT :</label>
                        <div style="display: flex; gap: 16px; align-items: center;">
                            <div id="photo-compte-apercu"></div>
                            <div style="min-width: 0;">
                                <input type="file" id="photo-compte-fichier" accept="image/png,image/jpeg,image/webp" style="display: none;" onchange="envoyerPhotoCompte(this)">
                                <button id="photo-compte-btn" style="background: transparent; border: 1px solid var(--ed-orange); color: var(--ed-orange); padding: 5px 14px; font-family: inherit; font-size: 0.8em; letter-spacing: 1px; cursor: pointer; margin-right: 8px;" onclick="document.getElementById('photo-compte-fichier').click()">+ AJOUTER</button><button id="photo-compte-retirer" style="background: transparent; border: 1px solid #555; color: #999; padding: 5px 14px; font-family: inherit; font-size: 0.8em; letter-spacing: 1px; cursor: pointer; display: none;" onclick="retirerPhotoCompte()">RETIRER</button>
                                <div id="photo-compte-msg" style="color: #777; font-size: 0.72em; margin-top: 8px; line-height: 1.5;">PNG, JPEG ou WebP, recadrée en carré au centre et réduite automatiquement. Remplace la précédente.<br>Astuce : faites une capture d'écran du visage de votre personnage (Holo-Me, écran de création de personnage) et envoyez-la ici.</div>
                            </div>
                        </div>
                        <div style="border-top: 1px dashed #5a3000; margin-top: 12px; padding-top: 9px; color: #888; font-size: 0.72em; line-height: 1.6;"><b style="color: #bbb;">Qui la voit ?</b> Les membres de votre escadron (page Escadron, fiche, mur des spécialistes, classement BGS) et les pilotes EDTEAM de votre Puissance (classement Powerplay). Personne d'autre.</div>
                    </div>
                    <div id="bloc-anecdotes-compte" style="display: none; background: rgba(255, 113, 0, 0.04); padding: 15px; border: 1px dashed var(--ed-orange); border-radius: 4px;">
                        <label style="color: var(--ed-orange); font-size: 0.8em; font-weight: bold; letter-spacing: 1px; display: block; margin-bottom: 8px;">ANECDOTES DE L'ESCADRON :</label>
                        <label style="display: flex; align-items: center; gap: 10px; color: #ccc; font-size: 0.9em; cursor: pointer;"><input type="checkbox" id="anecdotes-option" onchange="changerOptionAnecdotes(this)" style="width: 16px; height: 16px;"> Apparaître dans les anecdotes</label>
                        <div id="anecdotes-msg" style="color: #777; font-size: 0.72em; margin-top: 8px; line-height: 1.5;">Une courte histoire écrite par une IA, 3 à 4 fois par semaine, à partir d'un fait réel de la semaine d'un pilote actif. Décocher vous retire du choix et efface celles déjà écrites sur vous.</div>
                    </div>
                    <div style="background: rgba(0, 240, 255, 0.05); padding: 15px; border: 1px solid var(--ed-blue); border-radius: 4px;">
                        <label style="color: var(--ed-blue); font-size: 0.8em; font-weight: bold; letter-spacing: 1px; display: block; margin-bottom: 8px;">CLÉ DE LIAISON EDMC :</label>
                        <div style="text-align: center; margin: 6px 0 8px; overflow: hidden;"><strong id="api-key-display" style="display: inline-block; max-width: 100%; color: var(--ed-orange); font-size: 1.15em; cursor: pointer; letter-spacing: 1px; white-space: nowrap;" onclick="copierNav(this.innerText, this, event)" title="Cliquer pour copier">[ CHARGEMENT DE LA CLÉ... ]</strong></div>
                        <div style="color: #888; font-size: 0.78em; line-height: 1.5;">Cliquez sur la clé pour la copier, puis collez-la dans les paramètres du plugin EDMC (onglet SYS.EDTEAM, champ « Clé d'Accès »).</div>
                    </div>
                    <div style="background: rgba(0,0,0,0.5); padding: 15px; border: 1px dashed #555; border-radius: 4px;">
                        <label style="color: #888; font-size: 0.8em; font-weight: bold; letter-spacing: 1px; display: block; margin-bottom: 8px;">NOUVELLE ADRESSE E-MAIL :</label>
                        <input type="email" id="input-nouveau-email" style="width: 100%; background: rgba(0, 0, 0, 0.6); border: 1px solid var(--ed-orange); color: #fff; padding: 10px 15px; font-family: 'Share Tech Mono', monospace; font-size: 1em; outline: none; box-sizing: border-box; margin-bottom: 10px;" placeholder="nouvelle@adresse.com">
                        <button style="background: rgba(255, 255, 255, 0.05); border: 1px solid #888; color: #ccc; padding: 8px 15px; cursor: pointer; font-family: inherit; font-weight: bold; font-size: 0.85em; width: 100%; transition: 0.2s;" onmouseover="this.style.background='#333'; this.style.color='#fff';" onmouseout="this.style.background='rgba(255, 255, 255, 0.05)'; this.style.color='#ccc';" onclick="modifierEmailCompte()">METTRE À JOUR L'E-MAIL</button>
                    </div>
                    <div style="background: rgba(0,0,0,0.5); padding: 15px; border: 1px dashed #555; border-radius: 4px;">
                        <label style="color: #888; font-size: 0.8em; font-weight: bold; letter-spacing: 1px; display: block; margin-bottom: 8px;">NOUVEAU MOT DE PASSE :</label>
                        <input type="password" id="input-nouveau-mdp" style="width: 100%; background: rgba(0, 0, 0, 0.6); border: 1px solid var(--ed-orange); color: #fff; padding: 10px 15px; font-family: 'Share Tech Mono', monospace; font-size: 1em; outline: none; box-sizing: border-box; margin-bottom: 10px;" placeholder="********">
                        <button style="background: rgba(255, 255, 255, 0.05); border: 1px solid #888; color: #ccc; padding: 8px 15px; cursor: pointer; font-family: inherit; font-weight: bold; font-size: 0.85em; width: 100%; transition: 0.2s;" onmouseover="this.style.background='#333'; this.style.color='#fff';" onmouseout="this.style.background='rgba(255, 255, 255, 0.05)'; this.style.color='#ccc';" onclick="modifierMdpCompte()">METTRE À JOUR LE MOT DE PASSE</button>
                    </div>
                    <div id="bloc-quitter-escadron" style="display: none; background: rgba(0,0,0,0.5); padding: 15px; border: 1px dashed #555; border-radius: 4px;">
                        <label style="color: #888; font-size: 0.8em; font-weight: bold; letter-spacing: 1px; display: block; margin-bottom: 8px;">MON ESCADRON :</label>
                        <div style="color: #888; font-size: 0.78em; line-height: 1.5; margin-bottom: 10px;">Vous repasserez pilote indépendant, sans rôle. Pour revenir, il faudra le code d'invitation de l'escadron.</div>
                        <button onclick="quitterEscadron()" style="background: rgba(255, 255, 255, 0.05); border: 1px solid #888; color: #ccc; padding: 8px 15px; cursor: pointer; font-family: inherit; font-weight: bold; font-size: 0.85em; width: 100%;">QUITTER L'ESCADRON</button>
                    </div>
                    <div class="gc-danger" style="margin-top: 10px; border-top: 1px solid #FF3333; padding-top: 20px;">
                        <button style="background: rgba(255, 51, 51, 0.1); border: 1px solid #FF3333; color: #FF3333; padding: 12px 15px; cursor: pointer; font-family: inherit; font-weight: bold; font-size: 1em; width: 100%; transition: 0.2s;" onmouseover="this.style.background='#FF3333'; this.style.color='#000'; this.style.boxShadow='0 0 15px #FF3333';" onmouseout="this.style.background='rgba(255, 51, 51, 0.1)'; this.style.color='#FF3333'; this.style.boxShadow='none';" onclick="autoDetruireCompte()">⚠️ SUPPRIMER DÉFINITIVEMENT MON COMPTE</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-overlay" id="modal-confirmation" style="z-index: 10000;">
            <div class="modal-content" style="max-width: 500px; text-align: center; border: 1px solid var(--ed-red); box-shadow: 0 0 30px rgba(255, 51, 51, 0.2);" onclick="event.stopPropagation()">
                <div id="confirm-titre" style="color: var(--ed-red); font-size: 1.4em; font-weight: bold; letter-spacing: 2px; margin-bottom: 15px; border-bottom: 1px solid var(--ed-red); padding-bottom: 10px;">⚠️ ATTENTION</div>
                <p id="confirm-message" style="color: #ccc; font-size: 0.95em; line-height: 1.5; margin-bottom: 30px;">Êtes-vous sûr ?</p>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button id="btn-confirm-cancel" style="background: rgba(255, 255, 255, 0.05); border: 1px solid #666; color: #aaa; padding: 12px 20px; font-family: inherit; font-size: 1em; font-weight: bold; letter-spacing: 1px; cursor: pointer; transition: 0.2s; flex: 1;">[ ANNULER ]</button>
                    <button id="btn-confirm-ok" style="background: rgba(255, 51, 51, 0.1); border: 1px solid var(--ed-red); color: var(--ed-red); padding: 12px 20px; font-family: inherit; font-size: 1em; font-weight: bold; letter-spacing: 1px; cursor: pointer; transition: 0.2s; flex: 1; box-shadow: inset 0 0 10px rgba(255, 51, 51, 0.2);">[ CONFIRMER ]</button>
                </div>
            </div>
        </div>
    `;

    // --- INJECTION DANS LE DOM ---
    const menuNav = document.getElementById('side-menu');
    if (menuNav && menuNav.innerHTML.trim() === '') {
        menuNav.innerHTML = menuHTML;
    }

    const mainUi = document.getElementById('main-ui');
    if (mainUi && !document.querySelector('.hud-header')) {
        mainUi.insertAdjacentHTML('afterbegin', headerGlobalHTML);
        if (window.edteamSon) window.edteamSon.majUI();
    }

    if (!document.getElementById('modal-gestion-compte')) {
        document.body.insertAdjacentHTML('beforeend', modalesGlobalesHTML);
    }

    // --- INJECTION GLOBALE DU SYSTÈME COVAS & CIBLAGE TACTIQUE ---
        const covasHTML = `
        <style>
            #tactical-overlay {
                position: fixed; top: 50%; left: 50%; width: 480px; background: rgba(10, 0, 0, 0.95);
                border: 2px solid #FF3333; box-shadow: 0 0 50px rgba(255, 51, 51, 0.4); border-radius: 4px;
                padding: 25px; font-family: 'Share Tech Mono', monospace; z-index: 10500;
                backdrop-filter: blur(5px); pointer-events: none;
                transform: translate(-50%, -50%) scale(0.9); opacity: 0; visibility: hidden;
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            #tactical-overlay.deploye { transform: translate(-50%, -50%) scale(1); opacity: 1; visibility: visible; }
        </style>
        <div id="tactical-overlay"><div id="tactical-contenu"></div></div>
        `;
        document.body.insertAdjacentHTML('beforeend', covasHTML);

        // Chargement asynchrone du script d'interception COVAS
        if (!document.querySelector('script[src*="covas.js"]')) {
            const covasScript = document.createElement('script');
            covasScript.src = 'covas.js?v=3';
            document.body.appendChild(covasScript);
        }
}

// Sécurité : On injecte au chargement du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injecterArchitectureGlobale);
} else {
    injecterArchitectureGlobale();
}

// ==========================================
// 2. MOTEUR GLOBAL (PROFIL + RADAR)
// ==========================================

// Profil Header
window.actualiserHeader = function(profilData) {
    if (!profilData) return;
    // trombinoscope : entree de menu reservee au Directeur
    const navTrombi = document.getElementById('nav-link-trombinoscope');
    if (navTrombi && profilData.est_directeur !== undefined) navTrombi.style.display = profilData.est_directeur ? 'flex' : 'none';   // certains appels (QG) passent un profil partiel : on ne touche a rien s'il n'a pas ce champ
    if (typeof window.actualiserInscriptionsEnCours === 'function') window.actualiserInscriptionsEnCours();
    if (profilData.cmdr_nom) {
        const elCmdr = document.getElementById('cmdr-name-display');
        if (elCmdr) elCmdr.innerText = 'CMDR ' + profilData.cmdr_nom.toUpperCase();
    }
    // --- ESCADRON ET GRADES (a la place de l'ancien casier et des soldes : tout est deja dans le profil, aucune requete) ---
    if (profilData.escadron_id !== undefined) {
        const elNom = document.getElementById('header-escadron-nom');
        const elGr = document.getElementById('header-grades');
        const esc = String(profilData.escadron_id || '').trim();
        const independant = !esc || esc.toUpperCase() === 'INDEPENDANT';
        // BGS et Escadron : visibles avec un cadenas pour un pilote sans escadron (la page affiche alors sa vitrine)
        try { localStorage.setItem('edteam_independant', independant ? 'true' : 'false'); } catch (e) {}
        ['nav-link-escadron', 'nav-bgs-factions'].forEach(id => {
            const lien = document.getElementById(id); if (!lien) return;
            lien.classList.toggle('verrou', independant);
            if (independant) { lien.style.display = 'flex'; lien.title = 'Réservé aux membres d\'un escadron'; } else lien.removeAttribute('title');
        });
        if (elNom) elNom.innerText = independant ? 'PILOTE INDÉPENDANT' : esc.toUpperCase();
        if (elNom) elNom.style.color = independant ? 'var(--ed-blue)' : 'var(--ed-orange)';
        const boite = document.getElementById('header-escadron');
        if (boite) {
            boite.style.borderColor = independant ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255, 113, 0, 0.3)';
            boite.style.background = independant ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255, 113, 0, 0.05)';
            boite.setAttribute('onmouseenter', independant
                ? "if(typeof showHoloTooltip === 'function') showHoloTooltip(event, 'PILOTE INDÉPENDANT<br><span style=\\'color:#ccc; font-size:0.85em; font-weight:normal;\\'>Les modules BGS et Escadron sont réservés aux membres d\\'un escadron.</span>', '#00F0FF')"
                : "if(typeof showHoloTooltip === 'function') showHoloTooltip(event, 'ESCADRON<br><span style=\\'color:#ccc; font-size:0.85em; font-weight:normal;\\'>Votre escadron et vos accréditations.</span>', '#FF7100')");
            boite.setAttribute('onmouseleave', "if(typeof hideHoloTooltip === 'function') hideHoloTooltip()");
        }
        if (elGr) {
            const pastille = (txt, col, info) => '<span style="color:' + col + '; border:1px solid ' + col + '; background:rgba(255,255,255,0.04); padding:1px 8px; border-radius:3px; font-size:0.78em; font-weight:bold; letter-spacing:1px; cursor:help;"'
                + ' onmouseenter="if(typeof showHoloTooltip === \'function\') showHoloTooltip(event, \'' + info + '\', \'' + col + '\')" onmouseleave="if(typeof hideHoloTooltip === \'function\') hideHoloTooltip()" onmousemove="if(typeof moveHoloTooltip === \'function\') moveHoloTooltip(event)">' + txt + '</span>';
            let g = '';
            if (!independant) {
                let rangJeu = 3; try { rangJeu = parseInt(localStorage.getItem('edteam_rang_jeu') || '3'); } catch (e) {}
                if (profilData.est_amiral) g += pastille('AMIRAL', '#FF3333', 'COMMANDANT SUPRÊME<br>Gère les effectifs, accrédite les officiers et publie les ordres BGS.');
                else if (rangJeu === 4) g += pastille('RECRUE', '#cccccc', 'RECRUE<br>Accès limité : le panneau tactique BGS est verrouillé.');
                else g += pastille('PILOTE', '#FF7100', 'MEMBRE ACTIF<br>Accès aux opérations de l’escadron.');
                if (!profilData.est_amiral && profilData.est_officier) g += pastille('OFFICIER BGS', '#00FF66', 'GESTION TACTIQUE BGS<br>Autorisé à publier les ordres de l’Amiral.');
            }
            elGr.innerHTML = g;
            elGr.style.display = g ? 'flex' : 'none';
        }
    }

    // --- PASTILLES DE RANG (Powerplay, BGS, Federation, Auxiliaires) : tout est dans le profil, aucune requete ---
    {
        const CHAMPS = ['escadron_id', 'est_amiral', 'est_officier', 'rang_combat', 'prog_combat', 'rang_commerce', 'prog_commerce', 'rang_explo', 'prog_explore', 'rang_exobio', 'prog_exobio', 'rang_mercenary', 'prog_mercenary',
                        'rang_fed', 'prog_fed', 'rang_emp', 'prog_emp', 'puissance_nom', 'puissance_rang', 'puissance_merites_cycle', 'puissance_merites_total', 'rang_bgs', 'points_bgs'];
        const memo = window.__profilRangs = window.__profilRangs || {};
        CHAMPS.forEach(k => { if (profilData[k] !== undefined) memo[k] = profilData[k]; });
        // Révélations plein écran (nouveau rang, Pilier, Élan, distinction, anecdote) : revelations.js, chargé une fois, aucune requête pour les rangs
        try {
            const pRev = Object.assign({}, window.profilCommandant || {}, memo, profilData.user_id ? { user_id: profilData.user_id } : {});
            const lancerRev = () => { if (window.edteamRevelations) window.edteamRevelations.verifier(pRev); };
            if (window.edteamRevelations) lancerRev();
            else if (!window.__revelChargement) {
                window.__revelChargement = true;
                const sRev = document.createElement('script');
                sRev.src = 'revelations.js?v=2';
                sRev.onload = lancerRev;
                document.head.appendChild(sRev);
            }
        } catch (e) { /* une révélation ne doit jamais gêner la page */ }
        // Présence de l'Amiral (script SQL 70) : sert à remettre les initiatives en mode LIBRE s'il est absent plus de 7 jours ; au plus un appel par 6 h
        try {
            if (memo.est_amiral) {
                const pAmi = Object.assign({}, memo, profilData.user_id ? { user_id: profilData.user_id } : {});
                const lancerPresence = () => window.edteamIniMode && window.edteamIniMode.presence(pAmi);
                if (window.edteamIniMode) lancerPresence();
                else if (!window.__iniModeChargement) {
                    window.__iniModeChargement = true;
                    const sIni = document.createElement('script');
                    sIni.src = 'initiatives-mode.js?v=1';
                    sIni.onload = lancerPresence;
                    document.head.appendChild(sIni);
                }
            }
        } catch (e) { /* la présence ne doit jamais gêner la page */ }
        const zone = document.getElementById('header-rangs');
        if (zone && (memo.rang_fed !== undefined || memo.puissance_nom !== undefined || memo.rang_bgs !== undefined)) {
            const R = window.EDTEAM_RANGS;
            const up = s => String(s || '').toUpperCase();
            const seuil = r => r <= 1 ? 0 : Math.round(15 * Math.pow(r - 1, 1.6));
            const abr = s => { s = up(s); if (s.length <= 8) return s; const m = s.replace(/\./g, '').split(' '); return m.length > 1 ? m.slice(0, -1).map(w => w[0] + '.').join('') + m[m.length - 1].slice(0, 7) : s.slice(0, 8); };
            const abrNom = s => { const m = up(s).split(' '); return m.length > 1 ? m[0] + ' ' + m[1][0] + '.' : m[0]; };
            const att = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
            const tip = (c, t, d) => ' data-c="' + att(c) + '" data-t="' + att(t) + '" data-d="' + att(d) + '"';
            const chip = (cls, quoi, col, label, vl, vc, extra, info, svg) =>
                '<div class="hd-rg ' + cls + '" style="--c:' + col + ';" onclick="ouvrirCarriere(\'' + quoi + '\')"' + info + '>' + (extra.pil || '') + '<div class="hx"><svg viewBox="0 0 24 24">' + svg + '</svg></div>'
                + '<div class="tx"><div class="l">' + label + '</div><div class="v"><span class="vl">' + vl + '</span><span class="vc">' + vc + '</span></div></div>' + (extra.bar || '') + '</div>';
            let h = '';
            // Powerplay
            const pp = up(memo.puissance_nom);
            h += chip(pp ? '' : 'nonaligne', 'pp', '#00F0FF', 'POWERPLAY', pp || 'NON ALIGNÉ', pp ? abrNom(pp) : 'NON ALIGNÉ',
                { pil: pp ? '<span class="pil">R' + (parseInt(memo.puissance_rang) || 0) + '</span>' : '' },
                tip('#00F0FF', 'POWERPLAY 2.0', pp ? 'Rang ' + (parseInt(memo.puissance_rang) || 0) + ' · ' + pp + '. Allégeance, mérites du cycle et réseau des partisans.' : 'Aucune allégeance. Engagez-vous dans le jeu pour suivre vos mérites.'),
                '<polygon points="12,2.5 20.5,7.2 20.5,16.8 12,21.5 3.5,16.8 3.5,7.2"/><circle cx="12" cy="12" r="2.6"/>');
            // BGS : membres d'escadron ayant acces au BGS (meme regle que le menu)
            let rangJeu = 3; try { rangJeu = parseInt(localStorage.getItem('edteam_rang_jeu') || '3'); } catch (e) {}
            const esc = String(memo.escadron_id || '').trim();
            const accesBgs = !!esc && esc.toUpperCase() !== 'INDEPENDANT' && !(rangJeu === 4 && !memo.est_amiral && !memo.est_officier);
            if (accesBgs && memo.rang_bgs !== undefined) {
                const rg = Math.min(100, Math.max(1, parseInt(memo.rang_bgs) || 1)), pts = Number(memo.points_bgs) || 0;
                const min = seuil(rg), max = rg >= 100 ? null : seuil(rg + 1);
                const pct = max === null ? 100 : Math.max(0, Math.min(100, 100 * (pts - min) / (max - min)));
                // Le rang est en pastille au-dessus du cadre (comme « R42 » du Powerplay) ; le cadre montre la progression en points
                h += chip('', 'bgs', '#FF7100', 'BGS', max === null ? 'RANG MAXIMAL' : Math.floor(pts) + ' / ' + max, max === null ? 'MAX' : String(Math.floor(pts)),
                    { pil: '<span class="pil">R' + rg + '</span>', bar: '<div class="bar"><b style="width:' + pct.toFixed(1) + '%"></b></div>' },
                    tip('#FF7100', 'COMMANDEMENT BGS', 'Rang ' + rg + (max === null ? ' (maximal)' : ' · ' + Math.floor(pts) + ' / ' + max + ' points') + '. Progression et tableau de l’escadron.'),
                    '<polyline points="4.8,9.1 12,3.4 19.2,9.1"/><polyline points="4.8,13.9 12,8.2 19.2,13.9"/><polyline points="4.8,18.7 12,13 19.2,18.7"/>');
            }
            // Federation : meilleur rang parmi les cinq domaines
            const dom = [['COMBAT', memo.rang_combat, memo.prog_combat, R.combat], ['COMMERCE', memo.rang_commerce, memo.prog_commerce, R.trade], ['EXPLORATION', memo.rang_explo, memo.prog_explore, R.explore],
                         ['EXOBIOLOGIE', memo.rang_exobio, memo.prog_exobio, R.exobio], ['MERCENAIRE', memo.rang_mercenary, memo.prog_mercenary, R.mercenary]];
            let meilleur = null;
            dom.forEach(d => { const r = parseInt(d[1]) || 0, p = parseInt(d[2]) || 0, sc = r + p / 100; if (!meilleur || sc > meilleur.sc) meilleur = { sc: sc, nom: d[0], rang: d[3][r] || 'INCONNU' }; });
            h += chip('', 'fed', '#00FF66', 'FÉDÉRATION', meilleur.rang, meilleur.rang, {},
                tip('#00FF66', 'FÉDÉRATION DES PILOTES', 'Meilleur rang : ' + meilleur.rang + ' (' + meilleur.nom.toLowerCase() + '). Détail des cinq carrières.'),
                '<path d="M12 2l8 3v6c0 5-3.5 8.6-8 11-4.5-2.4-8-6-8-11V5z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>');
            zone.innerHTML = h;
            zone.style.display = 'flex';
            if (!zone.__tips) {
                zone.__tips = true;
                const cible = e => e.target.closest ? e.target.closest('.hd-rg') : null;
                zone.addEventListener('mouseover', e => { const c = cible(e); if (c && c.dataset.t && typeof showHoloTooltip === 'function') showHoloTooltip(e, c.dataset.t + '<br><span style="color:#ccc; font-size:0.85em; font-weight:normal;">' + c.dataset.d + '</span>', c.dataset.c); });
                zone.addEventListener('mousemove', e => { if (cible(e) && typeof moveHoloTooltip === 'function') moveHoloTooltip(e); });
                zone.addEventListener('mouseout', e => { const c = cible(e); if (c && !c.contains(e.relatedTarget) && typeof hideHoloTooltip === 'function') hideHoloTooltip(); });
            }
            const sep = zone.previousElementSibling; if (sep && sep.classList.contains('hd-sep')) sep.style.display = 'block';
        }
        // lien « ?bgs=1 » (journal de la page BGS) : ouvre la fenetre du rang BGS
        if (!window.__carriereAuto && /[?&]bgs=1(&|$)/.test(location.search)) {
            window.__carriereAuto = true;
            try { history.replaceState(null, '', location.pathname); } catch (e) {}
            setTimeout(function () { window.ouvrirCarriere('bgs'); }, 400);
        }
    }


};

// Statistiques globales de l'escadron (inscrits + actifs depuis le tick hebdo, tous
// escadrons confondus). Remplace l'ancien compteur "en ligne maintenant" (peu de pilotes
// connectes simultanement rend ce chiffre demoralisant sans raison reelle) par une mesure
// d'engagement plus stable : combien de pilotes ont agi cette semaine, au total.
(function initStatsPilotes() {
    async function chargerStatsPilotes() {
        if (typeof supabaseApp === 'undefined') return;
        const elInscrits = document.getElementById('stats-inscrits-val');
        const elActifs = document.getElementById('stats-actifs-val');
        if (!elInscrits && !elActifs) return;

        const cacheKey = 'edteam_stats_pilotes_cache';
        try {
            const raw = sessionStorage.getItem(cacheKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Date.now() - parsed.ts < 600000) {
                    if (elInscrits) elInscrits.innerText = parsed.data.total_inscrits;
                    if (elActifs) elActifs.innerText = parsed.data.actifs_semaine;
                    return;
                }
            }
        } catch (e) { /* sessionStorage indisponible : on retombe sur le reseau */ }

        try {
            const { data, error } = await supabaseApp.rpc('stats_pilotes_globales');
            if (error) throw error;
            const stats = (data && data[0]) || { total_inscrits: 0, actifs_semaine: 0 };

            if (elInscrits) elInscrits.innerText = stats.total_inscrits;
            if (elActifs) elActifs.innerText = stats.actifs_semaine;

            try { sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: stats })); } catch (e) {}
        } catch (e) { /* silencieux : le bloc reste sur "--" */ }
    }
    setTimeout(chargerStatsPilotes, 2000);
})();

// ==========================================
// 3. UTILITAIRES GLOBAUX D'INTERFACE
// ==========================================

window.toggleMenu = function() {
    if (typeof sonClic === 'function') sonClic();
    const menu = document.getElementById('side-menu');
    const body = document.body;
    if (menu) menu.classList.toggle('open');
    if (body) body.classList.toggle('menu-open');
};

// ---------- CARRIERE : paliers de rang (partages avec carriere.js) et ouverture des fenetres depuis toutes les pages
window.EDTEAM_RANGS = {
    combat: ["HARMLESS", "MOSTLY HARMLESS", "NOVICE", "COMPETENT", "EXPERT", "MASTER", "DANGEROUS", "DEADLY", "ELITE", "ELITE I", "ELITE II", "ELITE III", "ELITE IV", "ELITE V"],
    trade: ["PENNILESS", "MOSTLY PENNILESS", "PEDDLER", "DEALER", "MERCHANT", "BROKER", "ENTREPRENEUR", "TYCOON", "ELITE", "ELITE I", "ELITE II", "ELITE III", "ELITE IV", "ELITE V"],
    explore: ["AIMLESS", "MOSTLY AIMLESS", "SCOUT", "SURVEYOR", "TRAILBLAZER", "PATHFINDER", "RANGER", "PIONEER", "ELITE", "ELITE I", "ELITE II", "ELITE III", "ELITE IV", "ELITE V"],
    exobio: ["DIRECTIONLESS", "MONUMENTAL", "COMPILER", "COLLECTOR", "CATALOGUER", "TAXONOMIST", "ECOLOGIST", "GENETICIST", "ELITE", "ELITE I", "ELITE II", "ELITE III", "ELITE IV", "ELITE V"],
    mercenary: ["DEFENSELESS", "MOSTLY DEFENSELESS", "ROOKIE", "SOLDIER", "GUNSLINGER", "WARRIOR", "GLADIATOR", "STRIKE", "ELITE", "ELITE I", "ELITE II", "ELITE III", "ELITE IV", "ELITE V"],
    fed: ["AUCUN", "RECRUIT", "CADET", "MIDSHIPMAN", "PETTY OFFICER", "CHIEF PETTY OFFICER", "WARRANT OFFICER", "ENSIGN", "LIEUTENANT", "LT. COMMANDER", "POST COMMANDER", "POST CAPTAIN", "REAR ADMIRAL", "VICE ADMIRAL", "ADMIRAL"],
    emp: ["AUCUN", "OUTSIDER", "SERF", "MASTER", "SQUIRE", "KNIGHT", "LORD", "BARON", "VISCOUNT", "COUNT", "EARL", "MARQUIS", "DUKE", "PRINCE", "KING"]
};
// carriere.js (les quatre fenetres : BGS, Powerplay, Federation, Auxiliaires) n'est telecharge qu'au premier clic sur une pastille
window.ouvrirCarriere = function(quoi) {
    if (typeof hideHoloTooltip === 'function') hideHoloTooltip();
    const lancer = () => { if (window.carriere) window.carriere.ouvrir(quoi); };
    if (window.carriere) { lancer(); return; }
    if (!window.__carriereChargement) {
        window.__carriereChargement = new Promise((ok, ko) => {
            const s = document.createElement('script');
            s.src = 'carriere.js?v=2';
            s.onload = ok; s.onerror = () => { window.__carriereChargement = null; ko(); };
            document.head.appendChild(s);
        });
    }
    window.__carriereChargement.then(lancer).catch(() => {});
};
window.ouvrirSalleBgs = function() { window.ouvrirCarriere('bgs'); };
window.ouvrirSallePowerplay = function() { window.ouvrirCarriere('pp'); };

window.ouvrirModal = function(id, e) { 
    if (e) e.stopPropagation(); 
    if (typeof hideHoloTooltip === 'function') hideHoloTooltip(); 
    if (typeof sonClic === 'function') sonClic(); 
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
    if (id === 'modal-gestion-compte' && typeof window.majBlocPhotoCompte === 'function') window.majBlocPhotoCompte();
    if (id === 'modal-gestion-compte' && typeof window.majOptionAnecdotesCompte === 'function') window.majOptionAnecdotesCompte();
    if (id === 'modal-gestion-compte' && typeof window.majQuitterEscadronCompte === 'function') window.majQuitterEscadronCompte();
    if (id === 'modal-gestion-compte' && typeof window.ajusterCleEdmc === 'function') window.ajusterCleEdmc();
};

// ---- Photo de commandant (fenetre Gestion du compte) : apercu, envoi, retrait. Le travail est dans photos.js ----
window.majBlocPhotoCompte = async function() {
    const P = window.EDTEAMPhotos, ap = document.getElementById('photo-compte-apercu');
    const bloc = document.getElementById('bloc-photo-compte');
    if (!ap || !bloc) return;
    if (!P) { bloc.style.display = 'none'; return; }
    await P.charger(false);
    const moi = window.profilCommandant || {}, monUid = await P.monId();
    ap.innerHTML = P.avatar({ uid: monUid, nom: moi.cmdr_nom || 'CMDR', p: moi, taille: 90 });
    const a = !!P.maPhoto();
    const b = document.getElementById('photo-compte-btn'), r = document.getElementById('photo-compte-retirer');
    if (b) b.textContent = a ? '✎ CHANGER' : '+ AJOUTER';
    if (r) r.style.display = a ? '' : 'none';
};
// ---- Option « apparaitre dans les anecdotes » (SQL 60) : le bloc n'est affiche que si la fonction existe cote base ----
// la cle EDMC tient sur UNE seule ligne : la police se reduit pour s'adapter a la largeur disponible (et se reajuste si la fenetre change de taille)
window.ajusterCleEdmc = function() {
    const k = document.getElementById('api-key-display'); if (!k || !k.parentNode) return;
    k.style.fontSize = '1.15em';
    let px = parseFloat(getComputedStyle(k).fontSize);
    const dispo = k.parentNode.clientWidth;
    while (k.scrollWidth > dispo && px > 8) { px -= 0.5; k.style.fontSize = px + 'px'; }
};
window.addEventListener('resize', function() { const m = document.getElementById('modal-gestion-compte'); if (m && m.style.display === 'flex') window.ajusterCleEdmc(); });
window.majQuitterEscadronCompte = function() {
    const bloc = document.getElementById('bloc-quitter-escadron'); if (!bloc) return;
    const p = window.profilCommandant;
    bloc.style.display = (p && p.escadron_id && p.escadron_id !== 'INDEPENDANT') ? 'block' : 'none';
};
window.quitterEscadron = async function() {
    const message = "Vous repasserez pilote indépendant, sans rôle. Pour revenir, il faudra le code d'invitation de l'escadron.";
    let ok = false;
    if (typeof window.demanderConfirmation === 'function') ok = await window.demanderConfirmation("QUITTER L'ESCADRON ?", message, "#FF7100");
    else ok = confirm("Quitter l'escadron ?\n\n" + message);
    if (!ok) return;
    try {
        const { error } = await window.supabaseApp.rpc('quitter_escadron');
        if (error) throw error;
        try { if (window.profilCommandant) sessionStorage.removeItem('edteam_profil_cache_' + window.profilCommandant.user_id); } catch (e) {}
        ['edteam_acces_escadron', 'edteam_acces_bgs'].forEach(k => { try { localStorage.setItem(k, 'false'); } catch (e) {} });
        window.location.href = 'index.html';
    } catch (e) {
        if (typeof window.afficherAlerte === 'function') window.afficherAlerte("ERREUR", "Impossible de quitter l'escadron pour le moment.", "#FF3333");
        else alert("Impossible de quitter l'escadron pour le moment.");
    }
};
window.majOptionAnecdotesCompte = async function() {
    const bloc = document.getElementById('bloc-anecdotes-compte'), c = document.getElementById('anecdotes-option');
    if (!bloc || !c || typeof supabaseApp === 'undefined') return;
    try { const r = await supabaseApp.rpc('mon_option_anecdotes'); if (r.error) throw r.error; c.checked = r.data !== false; bloc.style.display = 'block'; }
    catch (e) { bloc.style.display = 'none'; }
};
window.changerOptionAnecdotes = async function(c) {
    const msg = document.getElementById('anecdotes-msg');
    try {
        const r = await supabaseApp.rpc('definir_option_anecdotes', { p_actif: c.checked });
        if (r.error) throw r.error;
        if (window.EDTEAMAnecdotes) window.EDTEAMAnecdotes.invalider();
        if (msg) { msg.style.color = '#00FF66'; msg.textContent = c.checked ? 'Vous pouvez apparaître dans les anecdotes.' : 'Vous n\'apparaîtrez plus dans les anecdotes.'; }
    } catch (e) {
        console.error('Anecdotes :', e); c.checked = !c.checked;
        if (msg) { msg.style.color = '#FF6a6a'; msg.textContent = 'Le réglage n\'a pas pu être enregistré.'; }
    }
};
window.envoyerPhotoCompte = async function(input) {
    const f = input && input.files && input.files[0];
    if (!f) return;
    const msg = document.getElementById('photo-compte-msg'), b = document.getElementById('photo-compte-btn');
    try {
        if (b) { b.disabled = true; b.textContent = 'ENVOI…'; }
        await window.EDTEAMPhotos.envoyer(f, window.profilCommandant && window.profilCommandant.user_id);
        if (msg) { msg.style.color = '#00FF66'; msg.textContent = 'Photo enregistrée.'; }
    } catch (e) {
        console.error('Photo :', e);
        if (msg) { msg.style.color = '#FF6a6a'; msg.textContent = 'La photo n\'a pas pu être envoyée : ' + (e && e.message ? e.message : e); }
    } finally {
        input.value = '';
        if (b) b.disabled = false;
        window.majBlocPhotoCompte();
    }
};
window.retirerPhotoCompte = async function() {
    const msg = document.getElementById('photo-compte-msg');
    try {
        await window.EDTEAMPhotos.retirer();
        if (msg) { msg.style.color = '#888'; msg.textContent = 'Photo retirée.'; }
    } catch (e) {
        console.error('Photo :', e);
        if (msg) { msg.style.color = '#FF6a6a'; msg.textContent = 'Impossible de retirer la photo : ' + (e && e.message ? e.message : e); }
    } finally { window.majBlocPhotoCompte(); }
};

window.fermerModal = function(id, e) { 
    if (e && e.target !== document.getElementById(id)) return; 
    if (typeof sonClic === 'function') sonClic(); 
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none'; 
};

window.copierNav = function(texte, element, event) { 
    if (event) event.stopPropagation(); 
    navigator.clipboard.writeText(texte).then(() => { 
        if (typeof sonClic === 'function') sonClic(); 
        const texteOriginal = element.innerHTML; 
        element.innerHTML = "[ COPIÉ ]"; 
        element.style.color = "#00FF00"; 
        setTimeout(() => { element.innerHTML = texteOriginal; element.style.color = ""; }, 1500); 
    }); 
};

window.deconnexion = async function() { 
    if (typeof supabaseApp !== 'undefined') {
        await supabaseApp.auth.signOut(); 
    }
    window.location.href = 'index.html'; 
};

// Plus aucun compteur de demandes (l'accreditation est automatique, les conflits se reglent sur le Discord) : on masque les anciennes pastilles.
window.actualiserBadgeAmiraute = async function() {
    ['badge-amiraute', 'badge-escadron', 'badge-onglet-directeur', 'badge-onglet-escadron'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
};

// ==========================================
// INSCRIPTIONS EN COURS (Directeur seulement) : comptes crees mais pas finalises au sas
// Le nettoyage automatique (script SQL 55) supprime chaque nuit ceux de plus de 7 jours sans aucune donnee du plugin.
// ==========================================
(function () {
    const CLE = 'edteam_inscriptions_cache';
    const echapper = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const pad = n => String(n).padStart(2, '0');
    const dateFr = d => pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    const jourFr = d => pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
    function duree(ms) {
        const min = Math.max(0, Math.floor(ms / 60000));
        if (min < 60) return min + ' min';
        const h = Math.floor(min / 60);
        if (h < 48) return h + ' h';
        return Math.floor(h / 24) + ' j ' + (h % 24) + ' h';
    }
    async function lister(force) {
        try {
            const brut = sessionStorage.getItem(CLE);
            if (!force && brut) { const c = JSON.parse(brut); if (Date.now() - c.t < 3 * 60 * 1000) return c.l; }
        } catch (e) { /* stockage indisponible : on interroge la base */ }
        if (typeof supabaseApp === 'undefined') return null;
        const { data, error } = await supabaseApp.from('profils').select('user_id, created_at, cmdr_nom')
            .or('est_approuve.is.null,est_approuve.eq.false').order('created_at', { ascending: true });
        if (error) return null;
        const l = data || [];
        try { sessionStorage.setItem(CLE, JSON.stringify({ t: Date.now(), l: l })); } catch (e) { /* rien */ }
        return l;
    }
    window.actualiserInscriptionsEnCours = async function (force) {
        const boite = document.getElementById('header-inscriptions');
        if (!boite) return;
        if (typeof profilCommandant === 'undefined' || !profilCommandant || !profilCommandant.est_directeur) { boite.style.display = 'none'; return; }
        const l = await lister(force);
        if (!l) return;
        boite.style.display = 'flex';
        document.getElementById('insc-nb').innerText = l.length;
        document.getElementById('insc-ancien').innerText = l.length ? duree(Date.now() - new Date(l[0].created_at).getTime()) : '—';
    };
    window.ouvrirInscriptionsEnCours = async function () {
        if (typeof sonClic === 'function') sonClic();
        let ov = document.getElementById('modal-inscriptions');
        if (!ov) {
            ov = document.createElement('div');
            ov.id = 'modal-inscriptions';
            ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);display:none;justify-content:center;align-items:center;z-index:6000;padding:15px;box-sizing:border-box;';
            ov.addEventListener('click', e => { if (e.target === ov) ov.style.display = 'none'; });
            document.body.appendChild(ov);
        }
        ov.innerHTML = '<div class="bloc" style="width:100%;max-width:680px;max-height:88vh;overflow-y:auto;"><h2>INSCRIPTIONS EN COURS <em>comptes créés, pas encore finalisés au sas</em></h2><div style="color:#888;">Chargement…</div></div>';
        ov.style.display = 'flex';
        const l = await lister(true);
        window.actualiserInscriptionsEnCours();
        let h = '<div style="position:absolute;top:10px;right:16px;color:var(--ed-orange);cursor:pointer;font-weight:bold;font-size:1.2em;" onclick="document.getElementById(\'modal-inscriptions\').style.display=\'none\'">X</div>';
        h += '<h2>INSCRIPTIONS EN COURS <em>comptes créés, pas encore finalisés au sas</em></h2>';
        if (!l) h += '<div style="color:#FF3333;">Impossible de lire la liste pour le moment.</div>';
        else if (!l.length) h += '<div style="color:#666;font-style:italic;text-align:center;padding:18px;">Aucune inscription en cours.</div>';
        else {
            h += '<div style="color:#888;font-size:.85em;margin-bottom:10px;line-height:1.5;">Du plus ancien au plus récent. Un compte jamais finalisé, sans aucune donnée du plugin, est supprimé automatiquement chaque nuit après 7 jours.</div>';
            h += '<table style="width:100%;border-collapse:collapse;font-size:.9em;"><thead><tr style="color:#888;text-align:left;border-bottom:1px solid #444;"><th style="padding:6px 8px;">INSCRIT LE</th><th style="padding:6px 8px;">DEPUIS</th><th style="padding:6px 8px;">NOM DÉTECTÉ</th><th style="padding:6px 8px;">NETTOYAGE</th></tr></thead><tbody>';
            const maintenant = Date.now();
            l.forEach(p => {
                const d = new Date(p.created_at), age = maintenant - d.getTime(), fin = new Date(d.getTime() + 7 * 86400000);
                const reste = fin.getTime() - maintenant;
                h += '<tr style="border-bottom:1px solid rgba(255,255,255,.07);"><td style="padding:7px 8px;color:#ddd;">' + dateFr(d) + '</td>'
                    + '<td style="padding:7px 8px;color:#FF7100;font-weight:bold;">' + duree(age) + '</td>'
                    + '<td style="padding:7px 8px;color:' + (p.cmdr_nom ? '#00FF66' : '#666') + ';">' + (p.cmdr_nom ? 'CMDR ' + echapper(String(p.cmdr_nom).toUpperCase()) : 'pas encore') + '</td>'
                    + '<td style="padding:7px 8px;color:#888;">' + (reste > 0 ? 'le ' + jourFr(fin) + ' (dans ' + duree(reste) + ')' : 'cette nuit (sauf données du plugin)') + '</td></tr>';
            });
            h += '</tbody></table>';
        }
        ov.innerHTML = '<div class="bloc" style="position:relative;width:100%;max-width:680px;max-height:88vh;overflow-y:auto;">' + h + '</div>';
        ov.style.display = 'flex';
    };
})();

// ==========================================
// 4. GESTION DU COMPTE (GLOBAL)
// ==========================================

window.modifierEmailCompte = async function() {
    if(typeof sonClic === 'function') sonClic();
    const nouvelEmail = document.getElementById('input-nouveau-email').value.trim();
    if (!nouvelEmail) return;

    try {
        const { error } = await supabaseApp.auth.updateUser({ email: nouvelEmail });
        if (error) throw error;
        
        if (typeof window.afficherAlerte === 'function') {
            window.afficherAlerte("REQUÊTE ENVOYÉE", "Un lien de confirmation a été expédié. Vérifiez votre boîte mail.<br><br>Le changement ne prendra effet qu'après validation.", "var(--ed-blue)");
        } else {
            alert("Un lien de confirmation a été envoyé. Vérifiez vos emails.");
        }
        
        document.getElementById('input-nouveau-email').value = "";
        window.fermerModal('modal-gestion-compte');
    } catch (e) {
        console.error(e);
        if (typeof window.afficherAlerte === 'function') window.afficherAlerte("ERREUR", "Impossible de modifier l'adresse e-mail.", "#FF3333");
        else alert("Erreur : Impossible de modifier l'e-mail.");
    }
};

window.modifierMdpCompte = async function() {
    if(typeof sonClic === 'function') sonClic();
    const nouveauMdp = document.getElementById('input-nouveau-mdp').value.trim();
    if (!nouveauMdp || nouveauMdp.length < 6) {
        if (typeof window.afficherAlerte === 'function') window.afficherAlerte("ERREUR SÉCURITÉ", "La clé d'accès doit contenir au moins 6 caractères.", "#FF3333");
        else alert("La clé d'accès doit contenir au moins 6 caractères.");
        return;
    }

    try {
        const { error } = await supabaseApp.auth.updateUser({ password: nouveauMdp });
        if (error) throw error;
        
        if (typeof window.afficherAlerte === 'function') {
            window.afficherAlerte("SUCCÈS", "Vos codes d'accès ont été mis à jour avec succès.", "#00FF66");
        } else {
            alert("Mot de passe mis à jour !");
        }
        
        document.getElementById('input-nouveau-mdp').value = "";
        window.fermerModal('modal-gestion-compte');
    } catch (e) {
        console.error(e);
        if (typeof window.afficherAlerte === 'function') window.afficherAlerte("ERREUR", "Impossible de modifier le mot de passe.", "#FF3333");
        else alert("Erreur de modification du mot de passe.");
    }
};

window.autoDetruireCompte = async function() {
    if(typeof sonClic === 'function') sonClic();
    
    const messageAlerte = "⚠️ AVERTISSEMENT CRITIQUE : La destruction de votre compte est IMMÉDIATE et IRRÉVERSIBLE. Toutes vos données seront purgées des serveurs.<br><br>Confirmez-vous l'auto-destruction ?";
    
    let confirmation = false;
    if (typeof window.demanderConfirmation === 'function') {
        confirmation = await window.demanderConfirmation("⚠️ AUTO-DESTRUCTION", messageAlerte, "#FF3333");
    } else {
        confirmation = confirm("⚠️ AUTO-DESTRUCTION IRRÉVERSIBLE. Confirmez-vous ?");
    }

    if (!confirmation) return;

    try {
        window.fermerModal('modal-gestion-compte');

        if (window.EDTEAMPhotos) await window.EDTEAMPhotos.retirerFichierAvantSuppression();
        const { error } = await supabaseApp.rpc('supprimer_mon_compte');
        if (error) throw error;
        
        await supabaseApp.auth.signOut();
        window.location.href = 'index.html';
        
    } catch(e) {
        console.error(e);
        if (typeof window.afficherAlerte === 'function') window.afficherAlerte("ÉCHEC SYSTÈME", "Erreur lors du protocole de destruction.", "#FF3333");
        else alert("ÉCHEC : Erreur lors de la destruction.");
    }
};

window.recupererMotDePasse = async function() {
    if(typeof sonClic === 'function') sonClic();
    const emailField = document.getElementById('auth-email');
    if (!emailField) { alert("ERREUR SYSTÈME : Champ e-mail introuvable."); return; }

    const emailInput = emailField.value.trim(); 
    if (!emailInput) {
        if (typeof window.afficherAlerte === 'function') window.afficherAlerte("REQUÊTE REJETÉE", "Veuillez d'abord saisir votre adresse e-mail dans le champ de connexion.", "#FF3333");
        else alert("Veuillez saisir votre adresse e-mail dans le champ de connexion.");
        return;
    }

    try {
        const { error } = await supabaseApp.auth.resetPasswordForEmail(emailInput, { redirectTo: window.location.href });
        if (error) throw error;

        if (typeof window.afficherAlerte === 'function') {
            window.afficherAlerte("LIAISON SÉCURISÉE ÉTABLIE", "Un lien d'accès temporaire a été transmis à votre adresse e-mail.<br>Cliquez sur ce lien puis allez dans la Gestion de Compte pour modifier votre clé.");
        } else { alert("Lien de réinitialisation envoyé !"); }
        
    } catch (e) {
        console.error(e);
        if (typeof window.afficherAlerte === 'function') window.afficherAlerte("ÉCHEC DE LA TRANSMISSION", "Impossible d'envoyer le lien. Vérifiez l'adresse e-mail saisie.", "#FF3333");
        else alert("Erreur d'envoi de l'e-mail.");
    }
};

window.demanderConfirmation = function(titre, message, couleurHex) {
    return new Promise((resolve) => {
        if (typeof sonClic === 'function') sonClic();
        const modal = document.getElementById('modal-confirmation');
        if (!modal) {
            resolve(confirm(message.replace(/<[^>]*>?/gm, '')));
            return;
        }

        const titreEl = document.getElementById('confirm-titre');
        const messageEl = document.getElementById('confirm-message');
        const btnOk = document.getElementById('btn-confirm-ok');
        const btnCancel = document.getElementById('btn-confirm-cancel');
        const contentEl = modal.querySelector('.modal-content');

        titreEl.innerHTML = titre;
        titreEl.style.color = couleurHex;
        titreEl.style.borderColor = couleurHex;
        messageEl.innerHTML = message;
        
        contentEl.style.borderColor = couleurHex;
        contentEl.style.boxShadow = `0 0 30px ${couleurHex}40`;
        
        btnOk.style.color = couleurHex;
        btnOk.style.borderColor = couleurHex;
        btnOk.style.background = `${couleurHex}15`;
        btnOk.style.boxShadow = `inset 0 0 10px ${couleurHex}30`;
        
        btnOk.onmouseover = () => { btnOk.style.background = couleurHex; btnOk.style.color = '#000'; };
        btnOk.onmouseout = () => { btnOk.style.background = `${couleurHex}15`; btnOk.style.color = couleurHex; };
        btnCancel.onmouseover = () => { btnCancel.style.background = '#333'; btnCancel.style.color = '#fff'; };
        btnCancel.onmouseout = () => { btnCancel.style.background = 'rgba(255, 255, 255, 0.05)'; btnCancel.style.color = '#aaa'; };

        modal.style.display = 'flex';

        const nettoyage = () => {
            modal.style.display = 'none';
            btnOk.onclick = null;
            btnCancel.onclick = null;
        };

        btnOk.onclick = () => { if (typeof sonClic === 'function') sonClic(); nettoyage(); resolve(true); };
        btnCancel.onclick = () => { if (typeof sonClic === 'function') sonClic(); nettoyage(); resolve(false); };
    });
};

// ==========================================
// 5. MOTEUR AUDIO (WEB AUDIO API)
// ==========================================
let audioCtx;

window.initAudio = function() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
};

window.playUI = function(type) {
    // Forçage de l'initialisation et du réveil du contexte audio
    if(!audioCtx && typeof window.initAudio === 'function') window.initAudio();
    if(!audioCtx) return;
    if(audioCtx.state === 'suspended') audioCtx.resume();

    const t = audioCtx.currentTime;
    
    if (type === 'hover') {
        const bufferSize = audioCtx.sampleRate * 0.015;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 6000;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.02, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start();
    } else if (type === 'click') {
        const osc1 = audioCtx.createOscillator();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(3000, t);
        osc1.frequency.exponentialRampToValueAtTime(1500, t + 0.02);
        const gain1 = audioCtx.createGain();
        gain1.gain.setValueAtTime(0.02, t);
        gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start(t);
        osc1.stop(t + 0.02);
    } else if (type === 'type') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800 + Math.random() * 250, t);
        gain.gain.setValueAtTime(0.02, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.015);
    } else if (type === 'success') {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.setValueAtTime(1318.51, t + 0.1); 
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.05, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
    }
};

window.sonClic = function() { window.playUI('click'); };
window.sonHover = function() { window.playUI('hover'); };
window.sonSucces = function() { window.playUI('success'); };

// Déverrouillage audio obligatoire au premier clic (écoute globale)
window.addEventListener('click', window.initAudio, { once: true });
window.addEventListener('touchstart', window.initAudio, { once: true });


// ==========================================
// 6. MOTEUR HOLOGRAPHIQUE (TOOLTIPS)
// ==========================================
window.showHoloTooltip = function(e, text, color = 'var(--ed-orange)', silent = false) {
    if(!silent) window.sonHover(); 
    const tooltip = document.getElementById('holo-tooltip');
    if(tooltip) {
        tooltip.innerHTML = text; 
        tooltip.style.borderColor = color; 
        tooltip.style.color = color; 
        tooltip.style.boxShadow = `0 0 10px ${color}40`; 
        tooltip.style.display = 'block'; 
        window.moveHoloTooltip(e);
    }
};

window.hideHoloTooltip = function() { 
    const tooltip = document.getElementById('holo-tooltip');
    if(tooltip) tooltip.style.display = 'none'; 
};

window.moveHoloTooltip = function(e) { 
    const tooltip = document.getElementById('holo-tooltip');
    if(tooltip && tooltip.style.display === 'block') { 
        let leftPos = e.clientX + 15; 
        let topPos = e.clientY + 15;
        const rect = tooltip.getBoundingClientRect();
        
        // Empêcher le débordement à droite
        if (leftPos + rect.width > window.innerWidth) {
            leftPos = e.clientX - rect.width - 15;
        }
        
        // Empêcher le débordement en bas
        if (topPos + rect.height > window.innerHeight) {
            topPos = window.innerHeight - rect.height - 10;
        }

        tooltip.style.left = leftPos + 'px'; 
        tooltip.style.top = topPos + 'px'; 
    } 
};

// ==========================================
// 7. PASSERELLE TÉLÉMÉTRIQUE & BOUCLE SYSTÈME (EDMC / SUPABASE)
// ==========================================
window.isSystemLoopRunning = false;
window.lastTargetedCmdr = null;

window.demarrerSystemLoop = async function systemLoop() {
    // Vérification de présence du profil commandant
    const cmdr = window.profilCommandant || (typeof profilCommandant !== 'undefined' ? profilCommandant : null);
    if (!cmdr || !cmdr.user_id) {
        // En attente du profil : nouvelle tentative dans 2 secondes
        setTimeout(window.demarrerSystemLoop, 2000);
        return;
    }

    if (window.isSystemLoopRunning) return;
    // Onglet caché : aucune lecture. La boucle reprend d'elle-même, tout de suite, au retour sur l'onglet (écouteur plus bas).
    if (document.hidden) { window.navBouclePause = true; return; }
    window.isSystemLoopRunning = true;

    try {
        // 1. Interrogation ciblée de la boîte aux lettres tampon (Egress minimal)
        const { data: radarDataRaw, error: radarErr } = await supabaseApp
            .from('radar_commercial')
            .select('id, target_commodity, station_name, prix_unitaire')
            .eq('user_id', cmdr.user_id)
            .in('type_operation', ['STATUS', 'INFO', 'FINANCE'])
            .order('id', { ascending: false })
            .limit(10);

        if (radarErr) throw radarErr;

        let profilData = cmdr;
        const radarData = radarDataRaw || [];

        const idsToDelete = [];
        const profilUpdates = {};
        const paramUpdates = {};
        let profilModifie = false;
        let paramModifie = false;

        // 2. Dépilement des trames reçues du plugin Python
        const processLatest = (target, callback) => {
            const items = radarData.filter(d => d.target_commodity === target).sort((a, b) => b.id - a.id);
            if (items.length > 0) {
                callback(items[0]);
                items.forEach(i => idsToDelete.push(i.id));
            }
        };

        // HEARTBEAT : ancien plugin uniquement (retire en v2.3) - on purge sans reecrire parametres_app
        processLatest('HEARTBEAT', () => {});
        // Soldes vaisseau / carrier : le serveur les inscrit deja dans le profil a l'arrivee de la trame (declencheurs SQL). On purge seulement : plus d'ecriture redondante.
        processLatest('SHIP_BALANCE', () => {});
        processLatest('FC_BALANCE', () => {});
        processLatest('CMDR_NAME', item => { profilUpdates.cmdr_nom = item.station_name; profilModifie = true; });

        // Interception du ciblage tactique (COVAS / HUD)
        processLatest('TARGETED_CMDR', item => {
            const payloadBrut = item.station_name;
            if (payloadBrut !== window.lastTargetedCmdr) {
                window.lastTargetedCmdr = payloadBrut;
                if (payloadBrut === "LOST") {
                    const overlay = document.getElementById('tactical-overlay');
                    if (overlay) overlay.classList.remove('deploye');
                } else {
                    try {
                        const cibleData = JSON.parse(payloadBrut);
                        if (typeof verifierCibleTactique === 'function') verifierCibleTactique(cibleData.nom, cibleData.tag);
                    } catch (e) {
                        if (typeof verifierCibleTactique === 'function') verifierCibleTactique(payloadBrut, "");
                    }
                }
            }
        });

        // Purge des étiquettes d'états secondaires
        const junkTags = ['PARAM_UPDATE', 'QG_RANK_COMBAT', 'QG_RANK_TRADE', 'QG_RANK_EXPLOR', 'QG_RANK_FEDERA', 'QG_RANK_EMPIRE', 'QG_RANK_EXOBIO', 'QG_PROG_COMBAT', 'QG_PROG_TRADE', 'QG_PROG_EXPLOR', 'QG_PROG_FEDERA', 'QG_PROG_EMPIRE', 'QG_PROG_EXOBIO', 'QG_WEALTH', 'QG_SHIPS_VALUE', 'QG_REBUY', 'QG_POWERPLAY', 'QG_FLEET', 'QG_CARRIER_STATS', 'QG_ACTIVE_SHIP_ID', 'QG_SQUADRON_FACTION'];
        junkTags.forEach(tag => { processLatest(tag, () => {}); });
        radarData.filter(d => d.target_commodity && d.target_commodity.startsWith('QG_MODULES_')).forEach(i => idsToDelete.push(i.id));

        // 3. Persistance des états et libération de la file d'attente
        if (paramModifie) {
            await supabaseApp.from('parametres_app').update(paramUpdates).eq('user_id', cmdr.user_id);
        }
        if (profilModifie) {
            await supabaseApp.from('profils').update(profilUpdates).eq('user_id', cmdr.user_id);
            Object.assign(profilData, profilUpdates);
            if (typeof profilCommandant !== 'undefined') Object.assign(profilCommandant, profilUpdates);
            window.profilCommandant = profilData;
        }
        if (idsToDelete.length > 0) {
            await supabaseApp.from('radar_commercial').delete().in('id', idsToDelete.slice(0, 80));
        }

        // 4. Synchronisation visuelle du bandeau supérieur
        if (typeof window.actualiserHeader === 'function') {
            window.actualiserHeader(profilData);
        }

    } catch (err) {
        console.error("> SYS.EDTEAM // Erreur télémétrie :", err);
    }

    window.isSystemLoopRunning = false;
    window.navDernier = Date.now();
    // Temps reel actif : un tour de securite toutes les 10 min (les trames du plugin reveillent la boucle, voir edteamReveilBoucle) ; sinon, toutes les minutes.
    window.navTimer = setTimeout(window.demarrerSystemLoop, window.edteamRtOk ? 600000 : 60000);
};

// Reveil par le temps reel (covas.js) : au plus un tour par minute, jamais pendant que l'onglet est cache (la reprise se fait au retour sur l'onglet)
window.edteamReveilBoucle = function() {
    if (document.hidden) { window.navBouclePause = true; return; }
    if (window.isSystemLoopRunning || window.navReveil) return;
    const delai = Math.max(1500, 60000 - (Date.now() - (window.navDernier || 0)));
    window.navReveil = setTimeout(function() {
        window.navReveil = null;
        if (Date.now() - (window.navDernier || 0) < 30000) return;   // un tour vient d'avoir lieu (tour de securite) : rien a faire
        clearTimeout(window.navTimer);
        if (typeof window.demarrerSystemLoop === 'function') window.demarrerSystemLoop();
    }, delai);
};

// Retour sur l'onglet après une pause : on reprend immédiatement (sans attendre la prochaine minute)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && window.navBouclePause) {
        window.navBouclePause = false;
        clearTimeout(window.navTimer);
        if (typeof window.demarrerSystemLoop === 'function') window.demarrerSystemLoop();
    }
});

// Rétrocompatibilité d'appel
window.systemLoop = window.demarrerSystemLoop;

