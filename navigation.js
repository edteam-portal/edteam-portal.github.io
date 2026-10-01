// ==========================================
// 0. SONDE TÉLÉMÉTRIQUE (GOOGLE ANALYTICS 4)
// ==========================================
(function initAnalytics() {
    const GA_ID = 'G-26FQZ7SDX4'; 

    // 1. Initialisation de la file d'attente télémétrique
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA_ID, {
        page_title: document.title,
        page_location: window.location.href
    });

    // 2. Injection asynchrone du script externe (zéro blocage DOM)
    const scriptGA = document.createElement('script');
    scriptGA.async = true;
    scriptGA.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(scriptGA);

    // 3. Relais pour tracer des événements personnalisés de la flotte
    window.tracerAction = function(nomEvenement, parametres = {}) {
        if (typeof window.gtag === 'function') {
            window.gtag('event', nomEvenement, parametres);
        }
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
        <a href="escadron.html" id="nav-link-escadron" class="nav-link ${page === 'escadron.html' ? 'active' : ''}" style="display: ${localStorage.getItem('edteam_acces_escadron') === 'true' ? 'flex' : 'none'};" onmouseenter="if(typeof sonHover==='function') sonHover()">
            <div class="nav-icon"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
            <span class="nav-text">ESCADRON</span>
        </a>
        <a href="diplomatie.html" id="nav-link-diplo" class="nav-link ${page === 'diplomatie.html' ? 'active' : ''}" style="display: ${localStorage.getItem('edteam_acces_escadron') === 'true' ? 'flex' : 'none'};" onmouseenter="if(typeof sonHover==='function') sonHover()">
            <div class="nav-icon"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="12" x2="16" y2="12"></line><circle cx="12" cy="17" r="2"></circle></svg></div>
            <span class="nav-text">DIPLOMATIE</span>
        </a>
        <a href="bgs.html" id="nav-bgs-factions" class="nav-link ${page === 'bgs.html' ? 'active' : ''}" style="display: ${localStorage.getItem('edteam_acces_bgs') === 'true' ? 'flex' : 'none'};" onmouseenter="if(typeof sonHover==='function') sonHover()">
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
        <a href="https://discord.gg/max5W9FreN" target="_blank" rel="noopener" class="nav-link" style="margin-top: auto; border-top: 1px solid rgba(255, 255, 255, 0.1); color: #5865F2;" onmouseenter="if(typeof sonHover==='function') sonHover(); if(typeof showHoloTooltip==='function') showHoloTooltip(event, 'SUPPORT DISCORD<br><span style=\\'color:#ccc; font-size:0.85em; font-weight:normal;\\'>Aide et discussion avec la communauté</span>', '#5865F2')" onmouseleave="if(typeof hideHoloTooltip==='function') hideHoloTooltip()" onmousemove="if(typeof moveHoloTooltip==='function') moveHoloTooltip(event)">
            <div class="nav-icon"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg></div>
            <span class="nav-text">SUPPORT DISCORD</span>
        </a>
        
        <a href="#" id="nav-aide" class="nav-link" style="border-top: 1px solid rgba(255, 255, 255, 0.1); margin-top: 6px; color: var(--ed-orange);" onclick="event.preventDefault(); if(typeof edteamOuvrirAide==='function') edteamOuvrirAide()" onmouseenter="if(typeof sonHover==='function') sonHover(); if(typeof showHoloTooltip==='function') showHoloTooltip(event, 'AIDE &amp; QUESTIONS FRÉQUENTES<br><span style=\\'color:#ccc; font-size:0.85em; font-weight:normal;\\'>Démarrer, BGS, rangs, Powerplay, mobile</span>', '#FF7100')" onmouseleave="if(typeof hideHoloTooltip==='function') hideHoloTooltip()" onmousemove="if(typeof moveHoloTooltip==='function') moveHoloTooltip(event)">
            <div class="nav-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div>
            <span class="nav-text">AIDE</span>
        </a>
        <a href="#" id="nav-cle-edmc" class="nav-link" style="color: var(--ed-blue);" onclick="event.preventDefault(); ouvrirModal('modal-cle-api', event)" onmouseenter="if(typeof sonHover==='function') sonHover(); if(typeof showHoloTooltip==='function') showHoloTooltip(event, 'SÉCURITÉ &amp; CLÉ EDMC<br><span style=\\'color:#ccc; font-size:0.85em; font-weight:normal;\\'>Votre clé de liaison à copier dans le plugin EDMC</span>', '#00F0FF')" onmouseleave="if(typeof hideHoloTooltip==='function') hideHoloTooltip()" onmousemove="if(typeof moveHoloTooltip==='function') moveHoloTooltip(event)">
            <div class="nav-icon"><svg viewBox="0 0 24 24"><circle cx="8" cy="15" r="4"></circle><line x1="10.85" y1="12.15" x2="19" y2="4"></line><line x1="18" y1="5" x2="20" y2="7"></line><line x1="15" y1="8" x2="17" y2="10"></line></svg></div>
            <span class="nav-text">CLÉ EDMC</span>
        </a>
        <a href="#" id="nav-gestion-compte" class="nav-link" onclick="event.preventDefault(); ouvrirModal('modal-gestion-compte', event)" onmouseenter="if(typeof sonHover==='function') sonHover(); if(typeof showHoloTooltip==='function') showHoloTooltip(event, 'GESTION DU COMPTE<br><span style=\\'color:#ccc; font-size:0.85em; font-weight:normal;\\'>E-mail, mot de passe, suppression du compte</span>', '#FF7100')" onmouseleave="if(typeof hideHoloTooltip==='function') hideHoloTooltip()" onmousemove="if(typeof moveHoloTooltip==='function') moveHoloTooltip(event)">
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
            .comms-btn { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 46px; height: 34px; box-sizing: border-box; color: var(--ed-blue, #00F0FF); border: 1px solid rgba(0,240,255,.55); background: rgba(0,240,255,.08); box-shadow: 0 0 10px rgba(0,240,255,.18); border-radius: 4px; text-decoration: none; transition: .2s; cursor: pointer; }
            .comms-btn .nav-icon { min-width: 0; }
            .comms-btn .nav-icon svg { width: 23px; height: 23px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
            .comms-btn:hover { color: #fff; border-color: #fff; background: rgba(0,240,255,.22); box-shadow: 0 0 14px rgba(0,240,255,.55); }
            .comms-btn.active { color: #fff; border-color: var(--ed-blue, #00F0FF); background: rgba(0,240,255,.22); }
            @keyframes commsAlerte { 0%, 100% { box-shadow: 0 0 6px rgba(0,240,255,.3); background: rgba(0,240,255,.12); } 50% { box-shadow: 0 0 22px rgba(0,240,255,1), 0 0 44px rgba(0,240,255,.55); background: rgba(0,240,255,.55); border-color: #fff; } }
            @keyframes commsPastille { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.4); } }
            .comms-btn.alerte-enveloppe { color: #fff; animation: commsAlerte .8s infinite; }
            .comms-btn.alerte-enveloppe::after { content: ""; position: absolute; top: -5px; right: -5px; width: 11px; height: 11px; border-radius: 50%; background: #FF3333; box-shadow: 0 0 10px #FF3333; animation: commsPastille .8s infinite; }
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

                <div id="header-legal-status" 
                    style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; font-size: 0.8em; letter-spacing: 1px; background: rgba(0, 255, 102, 0.05); border: 1px solid rgba(0, 255, 102, 0.3); border-radius: 4px; padding: 8px 14px; cursor: help; transition: 0.2s; white-space: nowrap; box-sizing: border-box;"
                    onmouseleave="if(typeof hideHoloTooltip === 'function') hideHoloTooltip()"
                    onmousemove="if(typeof moveHoloTooltip === 'function') moveHoloTooltip(event)">
                    <div style="display: flex; align-items: center; justify-content: center;">
                        <span id="legal-text" style="color: #00FF66; font-size: 1.2em; font-weight: bold; line-height: 1;">CASIER VIERGE</span>
                    </div>
                </div>

                <div id="stats-pilotes-box"
                    style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; font-size: 0.8em; letter-spacing: 1px; gap: 2px; background: rgba(0, 255, 102, 0.05); border: 1px solid rgba(0, 255, 102, 0.3); border-radius: 4px; padding: 4px 14px; cursor: help; white-space: nowrap; box-sizing: border-box;"
                    onmouseenter="if(typeof showHoloTooltip === 'function') showHoloTooltip(event, 'EFFECTIFS DE LA FLOTTE<br><span style=\\'color:#ccc; font-size:0.8em; font-weight:normal;\\'>Inscrits : tous les commandants approuves.<br>Actifs : au moins une action enregistree<br>durant les 30 derniers jours,<br>tous escadrons confondus.</span>', '#00FF66')"
                    onmouseleave="if(typeof hideHoloTooltip === 'function') hideHoloTooltip()"
                    onmousemove="if(typeof moveHoloTooltip === 'function') moveHoloTooltip(event)">
                    <div style="color: #888; font-size: 0.75em; font-weight: bold;">FLOTTE</div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span><span id="stats-inscrits-val" style="color: #fff; font-size: 1.15em; font-weight: bold;">--</span> <span style="color:#666; font-size:0.7em;">INSCRITS</span></span>
                        <span style="color:#333;">|</span>
                        <span><span id="stats-actifs-val" style="color: #00FF66; font-size: 1.15em; font-weight: bold;">--</span> <span style="color:#666; font-size:0.7em;">ACTIFS (30J)</span></span>
                    </div>
                </div>

                <div class="finances-box" style="display: flex; flex-direction: column; text-align: right; font-size: 0.85em; letter-spacing: 1px; justify-content: center; gap: 3px; background: rgba(0, 240, 255, 0.05); padding: 4px 15px; border-radius: 4px; border: 1px solid rgba(0, 240, 255, 0.2); cursor: help; transition: 0.2s; white-space: nowrap; box-sizing: border-box;"
                     onmouseenter="if(typeof showHoloTooltip === 'function') showHoloTooltip(event, 'SYNCHRONISATION BANCAIRE<br><span style=\\'color:#00FF66; font-size:0.85em;\\'>> VAISSEAU : AUTOMATIQUE</span><br><span style=\\'color:#ccc; font-size:0.8em; font-weight:normal;\\'>Mise à jour en temps réel.</span><br><br><span style=\\'color:#FF7100; font-size:0.85em;\\'>> CARRIER : MANUELLE</span><br><span style=\\'color:#ccc; font-size:0.8em; font-weight:normal;\\'>Ouvrez la <strong>Gestion du Fleet Carrier</strong><br>en jeu pour rafraîchir ce solde.</span>', 'var(--ed-blue)')" 
                     onmouseleave="if(typeof hideHoloTooltip === 'function') hideHoloTooltip()" 
                     onmousemove="if(typeof moveHoloTooltip === 'function') moveHoloTooltip(event)"
                     onmouseover="this.style.background='rgba(0, 240, 255, 0.15)'; this.style.borderColor='#fff';"
                     onmouseout="this.style.background='rgba(0, 240, 255, 0.05)'; this.style.borderColor='rgba(0, 240, 255, 0.2)';">
                    <div><span style="color: #888;">VAISSEAU :</span> <span id="solde-vaisseau" style="color: #fff; font-weight: bold;">---</span> <span style="color: var(--ed-orange);">CR</span></div>
                    <div><span style="color: #888;">CARRIER :</span> <span id="solde-fc" style="color: #fff; font-weight: bold;">---</span> <span style="color: var(--ed-blue);">CR</span></div>
                </div>

            </div>
            <div style="display: flex; align-items: flex-start; justify-content: flex-end; flex-grow: 1; padding-right: 5px; gap: 8px;">
                <a href="communications.html" id="nav-comms-link" class="comms-btn ${page === 'communications.html' ? 'active' : ''}" title="Communications" aria-label="Communications" onmouseenter="if(typeof sonHover==='function') sonHover()" onclick="retirerAlerteEnveloppe()">
                    <div class="nav-icon"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><line x1="8" y1="10" x2="8.01" y2="10"></line><line x1="12" y1="10" x2="12.01" y2="10"></line><line x1="16" y1="10" x2="16.01" y2="10"></line></svg></div>
                </a>
                <button type="button" class="son-btn" data-son-toggle></button>
            </div>
        </header>
    `;

    // --- C. LES MODALES GLOBALES ---
    const modalesGlobalesHTML = `
        <div class="modal-overlay" id="modal-cle-api" onclick="fermerModal('modal-cle-api', event)" style="z-index: 3500;">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-close" onclick="fermerModal('modal-cle-api')">X</div>
                <div class="modal-title" style="color: var(--ed-blue); border-bottom: 1px solid var(--ed-blue); padding-bottom: 10px; margin-bottom: 25px; font-weight: bold; font-size: 1.2em; letter-spacing: 2px;">SÉCURITÉ // CLÉ DE LIAISON EDMC</div>
                <p style="color: #ccc;">Copiez cette clé dans les paramètres de votre plugin EDMC :</p>
                <div style="background: rgba(0, 240, 255, 0.05); border: 1px solid var(--ed-blue); padding: 15px; text-align: center; margin: 20px 0;">
                    <strong id="api-key-display" style="color:var(--ed-orange); font-size: 1.2em; cursor:pointer; letter-spacing: 2px;" onclick="copierNav(this.innerText, this, event)">[ CHARGEMENT DE LA CLÉ... ]</strong>
                </div>
            </div>
        </div>
        <div class="modal-overlay" id="modal-gestion-compte" onclick="fermerModal('modal-gestion-compte', event)" style="z-index: 3500;">
            <div class="modal-content" style="max-width: 500px; width: 95%; background: rgba(10, 5, 0, 0.95); border: 1px solid var(--ed-orange); box-shadow: 0 0 30px rgba(255, 113, 0, 0.2);" onclick="event.stopPropagation()">
                <div class="modal-close" style="color: var(--ed-orange);" onclick="fermerModal('modal-gestion-compte')">X</div>
                <div style="color: var(--ed-orange); border-bottom: 1px solid var(--ed-orange); padding-bottom: 10px; margin-bottom: 25px; font-weight: bold; font-size: 1.2em; letter-spacing: 2px;">⚙️ GESTION DU COMPTE</div>
                <div style="display: flex; flex-direction: column; gap: 20px;">
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
                    <div style="margin-top: 10px; border-top: 1px solid #FF3333; padding-top: 20px;">
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
            #covas-overlay {
                position: fixed; top: 50%; left: 50%; width: 450px;
                background: rgba(5, 10, 15, 0.95); border: 1px solid var(--ed-blue);
                box-shadow: 0 0 30px rgba(0, 240, 255, 0.2); border-radius: 4px;
                padding: 20px; font-family: 'Share Tech Mono', monospace; color: #00F0FF;
                z-index: 10000; backdrop-filter: blur(5px); pointer-events: none;
                transform: translate(-50%, -50%) scale(0.95); opacity: 0; visibility: hidden;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            #covas-overlay.deploye { transform: translate(-50%, -50%) scale(1); opacity: 1; visibility: visible; }
            .covas-ligne { margin-bottom: 8px; font-size: 0.9em; letter-spacing: 1px; line-height: 1.4; text-shadow: 0 0 5px currentColor; }
            .covas-alerte { color: #FF3333; }
            .covas-neutre { color: #00FF66; }
            .covas-curseur { animation: covas-blink 0.8s infinite; }
            @keyframes covas-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
            #covas-badge {
                position: fixed; bottom: 20px; right: 20px; background: rgba(0, 240, 255, 0.1);
                border: 1px solid var(--ed-blue); color: var(--ed-blue); padding: 8px 15px;
                font-family: 'Share Tech Mono', monospace; font-weight: bold; border-radius: 4px;
                cursor: pointer; z-index: 9999; display: none; transition: 0.2s;
            }
            #covas-badge:hover { background: var(--ed-blue); color: #000; box-shadow: 0 0 15px var(--ed-blue); }
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
        <div id="covas-overlay"><div id="covas-contenu"></div><span class="covas-curseur">_</span></div>
        <div id="covas-badge" onclick="if(typeof deployerCovasManuel === 'function') deployerCovasManuel()">>_ SYS: EN ATTENTE</div>
        <div id="tactical-overlay"><div id="tactical-contenu"></div></div>
        `;
        document.body.insertAdjacentHTML('beforeend', covasHTML);

        // Chargement asynchrone du script d'interception COVAS
        if (!document.querySelector('script[src*="covas.js"]')) {
            const covasScript = document.createElement('script');
            covasScript.src = 'covas.js';
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
    if (profilData.cmdr_nom) {
        const elCmdr = document.getElementById('cmdr-name-display');
        if (elCmdr) elCmdr.innerText = 'CMDR ' + profilData.cmdr_nom.toUpperCase();
    }
    const fmt = new Intl.NumberFormat('fr-FR');
    if (profilData.solde_vaisseau !== undefined && profilData.solde_vaisseau !== null) {
        const elV = document.getElementById('solde-vaisseau');
        if (elV) elV.innerText = fmt.format(profilData.solde_vaisseau);
    }
    if (profilData.solde_fc !== undefined && profilData.solde_fc !== null) {
        const elFc = document.getElementById('solde-fc');
        if (elFc) elFc.innerText = fmt.format(profilData.solde_fc);
    }

    const notoriete = parseInt(profilData.notoriete) || 0;
    const legalBox = document.getElementById("header-legal-status");
    const legalText = document.getElementById("legal-text");

    if (legalBox && legalText) {
        if (notoriete > 0) {
            legalBox.style.background = "rgba(255, 51, 51, 0.05)";
            legalBox.style.borderColor = "rgba(255, 51, 51, 0.3)";
            legalText.style.color = "#FF3333";
            legalText.innerText = "RECHERCHÉ";
        } else {
            legalBox.style.background = "rgba(0, 255, 102, 0.05)";
            legalBox.style.borderColor = "rgba(0, 255, 102, 0.3)";
            legalText.style.color = "#00FF66";
            legalText.innerText = "CASIER VIERGE";
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
                if (Date.now() - parsed.ts < 30000) {
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

window.ouvrirModal = function(id, e) { 
    if (e) e.stopPropagation(); 
    if (typeof hideHoloTooltip === 'function') hideHoloTooltip(); 
    if (typeof sonClic === 'function') sonClic(); 
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex'; 
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

window.retirerAlerteEnveloppe = function() {
    const envIcon = document.getElementById('nav-comms-link');
    if (envIcon) envIcon.classList.remove('alerte-enveloppe');
};

window.deconnexion = async function() { 
    if (typeof supabaseApp !== 'undefined') {
        await supabaseApp.auth.signOut(); 
    }
    window.location.href = 'index.html'; 
};

window.actualiserBadgeAmiraute = async function() {
    if (typeof profilCommandant === 'undefined' || !profilCommandant) return;
    
    const badgeDirecteur = document.getElementById('badge-amiraute'); 
    const badgeEscadron = document.getElementById('badge-escadron'); 
    
    let totalDirecteur = 0;
    let totalEscadron = 0;

    try {
        if (profilCommandant.est_directeur) {
            const { count, error } = await supabaseApp.from('profils').select('*', { count: 'exact', head: true }).neq('est_approuve', true);
            if (!error && count) totalDirecteur = count;
        }
        
        if (profilCommandant.est_amiral && profilCommandant.escadron_id) {
            const { count, error } = await supabaseApp.from('profils').select('*', { count: 'exact', head: true }).eq('demande_escadron', profilCommandant.escadron_id);
            if (!error && count) totalEscadron = count;
        }

        if (badgeDirecteur) {
            badgeDirecteur.innerText = totalDirecteur;
            badgeDirecteur.style.display = totalDirecteur > 0 ? 'inline-block' : 'none';
        }

        if (badgeEscadron) {
            badgeEscadron.innerText = totalEscadron;
            badgeEscadron.style.display = totalEscadron > 0 ? 'inline-block' : 'none';
        }

        const badgeOngletDir = document.getElementById('badge-onglet-directeur');
        if (badgeOngletDir) { badgeOngletDir.innerText = totalDirecteur; badgeOngletDir.style.display = totalDirecteur > 0 ? 'inline-block' : 'none'; }

        const badgeOngletEscadron = document.getElementById('badge-onglet-escadron');
        if (badgeOngletEscadron) { badgeOngletEscadron.innerText = totalEscadron; badgeOngletEscadron.style.display = totalEscadron > 0 ? 'inline-block' : 'none'; }

    } catch (e) { console.error("Erreur calcul des badges", e); }
};

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
    } else if (type === 'success' || type === 'receive') {
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
window.sonType = function() { window.playUI('type'); };

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
        processLatest('SHIP_BALANCE', item => { profilUpdates.solde_vaisseau = item.prix_unitaire; profilModifie = true; });
        processLatest('FC_BALANCE', item => { profilUpdates.solde_fc = item.prix_unitaire; profilModifie = true; });
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
    window.navTimer = setTimeout(window.demarrerSystemLoop, 60000);
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

// ==========================================
// RADAR DE COMMUNICATIONS GLOBAL : alertes de messages sur toutes les pages qui chargent navigation.js
// (urgent = alerte plein ecran ; prive = petite fenetre ; enveloppe du menu si message plus recent que la derniere visite)
// ==========================================
(function radarCommunications() {
    const PAGE = (window.location.pathname.split('/').pop() || 'index.html');
    // La page Communications gere deja ses propres alertes (onglets clignotants, sons)
    if (PAGE === 'communications.html') return;

    let radarActif = false;
    const moi = () => ((typeof profilCommandant !== 'undefined' && profilCommandant) ? profilCommandant : window.profilCommandant) || null;

    function injecterAlertes() {
        if (document.getElementById('comms-alert-massive')) return;
        const style = document.createElement('style');
        style.textContent = '@keyframes commsRadarPulse { 0%, 100% { background: rgba(255,0,0,0.9); } 50% { background: rgba(120,0,0,0.92); } } @keyframes commsRadarBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }';
        document.head.appendChild(style);

        const conteneur = document.createElement('div');
        conteneur.innerHTML = `
        <div id="comms-alert-massive" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255, 0, 0, 0.9); z-index: 100000; display: none; flex-direction: column; justify-content: center; align-items: center; text-align: center; font-family: 'Share Tech Mono', monospace; cursor: pointer; animation: commsRadarPulse 1s infinite;" onclick="this.style.display='none'; if(typeof sonClic==='function') sonClic();">
            <div style="border: 4px solid #fff; padding: 40px 60px; background: rgba(0,0,0,0.8); box-shadow: 0 0 50px #FF0000; max-width: 90%;">
                <h1 style="color: #FF0000; font-size: 3.5em; margin: 0; letter-spacing: 5px; text-shadow: 0 0 20px #FF0000;">⚠️ TRANSMISSION URGENTE ⚠️</h1>
                <p id="comms-massive-sender" style="color: #fff; font-size: 1.5em; letter-spacing: 2px; margin-top: 20px;">> EXPÉDITEUR : CMDR INCONNU</p>
                <p id="comms-massive-text" style="color: var(--ed-orange); font-size: 1.3em; margin-top: 30px; max-width: 800px; line-height: 1.5; border-left: 5px solid #FF0000; padding-left: 20px; text-align: left;">Message text...</p>
                <p style="color: #888; font-size: 0.9em; margin-top: 40px; animation: commsRadarBlink 1.5s infinite;">[ CLIQUEZ N'IMPORTE OÙ POUR ACQUITTER ]</p>
            </div>
        </div>
        <div id="comms-alert-toast" style="position: fixed; bottom: 30px; right: -400px; width: 350px; max-width: 90%; background: rgba(10,5,0,0.95); border: 1px solid var(--ed-blue); border-left: 4px solid var(--ed-blue); padding: 15px; box-shadow: 0 0 20px rgba(0,240,255,0.2); z-index: 99999; font-family: 'Share Tech Mono', monospace; transition: right 0.4s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; box-sizing: border-box;" onclick="this.style.right='-400px'; if(typeof sonClic==='function') sonClic(); window.location.href='communications.html';">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--ed-blue); padding-bottom: 5px; margin-bottom: 10px;">
                <span style="color: var(--ed-blue); font-weight: bold; letter-spacing: 1px;">> MESSAGE PRIVÉ ENTRANT</span>
                <span style="color: #888; font-size: 0.8em;">MAINTENANT</span>
            </div>
            <div style="color: #fff; font-size: 0.95em; margin-bottom: 5px;">
                De : <span id="comms-toast-sender" style="color: var(--ed-orange); font-weight: bold;">CMDR ...</span>
            </div>
            <div style="color: #888; font-size: 0.8em; font-style: italic;">[ Cliquez pour ouvrir le terminal ]</div>
        </div>`;
        while (conteneur.firstChild) document.body.appendChild(conteneur.firstChild);
    }

    function sonAlerteComms(urgent) {
        try {
            let ctx = typeof audioCtx !== 'undefined' && audioCtx ? audioCtx : new (window.AudioContext || window.webkitAudioContext)();
            if (ctx.state === 'suspended') ctx.resume();
            const t = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            if (urgent) {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(800, t);
                osc.frequency.setValueAtTime(1200, t + 0.2);
                osc.frequency.setValueAtTime(800, t + 0.4);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(t); osc.stop(t + 0.6);
            } else {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1500, t);
                osc.frequency.exponentialRampToValueAtTime(800, t + 0.1);
                gain.gain.setValueAtTime(0.05, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(t); osc.stop(t + 0.2);
            }
        } catch (e) {}
    }

    function initialiserEcoute() {
        const profil = moi();
        if (!profil || radarActif) return;
        radarActif = true;

        // Au demarrage : y a-t-il un message plus recent que la derniere visite sur la page Communications ?
        let filtreCanaux = 'canal.eq.GLOBAL,destinataire_id.eq.' + profil.user_id;
        if (profil.escadron_id) filtreCanaux += ',escadron_id.eq.' + profil.escadron_id;
        supabaseApp.from('transmissions')
            .select('created_at')
            .or(filtreCanaux)
            .order('created_at', { ascending: false })
            .limit(1)
            .then(({ data }) => {
                if (data && data.length > 0) {
                    const dateDernierMsgServeur = new Date(data[0].created_at).getTime();
                    const dateDerniereLecture = parseInt(localStorage.getItem('edteam_last_msg_time') || '0');
                    if (dateDernierMsgServeur > dateDerniereLecture) {
                        const envIcon = document.getElementById('nav-comms-link');
                        if (envIcon) envIcon.classList.add('alerte-enveloppe');
                    }
                }
            });

        // En direct
        supabaseApp.channel('radar:transmissions')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transmissions' }, payload => {
                const msg = payload.new;
                const p = moi();
                if (!p || msg.expediteur_id === p.user_id) return;

                const pourMoi = (msg.destinataire_id === p.user_id);
                const escadron = (msg.canal === 'ESCADRON' && msg.escadron_id === p.escadron_id);
                const global = (msg.canal === 'GLOBAL');
                if (!(pourMoi || escadron || global)) return;

                const envIcon = document.getElementById('nav-comms-link');
                if (envIcon) envIcon.classList.add('alerte-enveloppe');

                if (msg.est_urgent) {
                    sonAlerteComms(true);
                    document.getElementById('comms-massive-sender').innerText = '> EXPÉDITEUR : ' + (msg.expediteur_id === '00000000-0000-4000-8000-0000000000ff' ? '' : 'CMDR ') + msg.expediteur_nom + ' [ Canal: ' + msg.canal + ' ]';
                    document.getElementById('comms-massive-text').innerText = msg.message;
                    document.getElementById('comms-alert-massive').style.display = 'flex';
                } else if (pourMoi) {
                    sonAlerteComms(false);
                    document.getElementById('comms-toast-sender').innerText = msg.expediteur_nom;
                    const toast = document.getElementById('comms-alert-toast');
                    toast.style.right = '30px';
                    setTimeout(() => { toast.style.right = '-400px'; }, 8000);
                }
            })
            .subscribe();
    }

    function demarrer() {
        injecterAlertes();
        const attente = setInterval(() => {
            if (moi()) { clearInterval(attente); initialiserEcoute(); }
        }, 1000);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
    else demarrer();
})();
