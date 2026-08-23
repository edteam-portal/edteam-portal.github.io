/**
 * =================================================================
 * SYS.EDTEAM - COVAS TACTIQUE (Cerveau Central)
 * Module d'analyse holographique au saut hyperspatial
 * =================================================================
 */

let covasAudioCtx = null;
let covasEnCours = false;
let systemeCourant = "";

// 1. MOTEUR AUDIO IMPÉRIAL
function playBipHolographique() {
    if (!covasAudioCtx) covasAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (covasAudioCtx.state === 'suspended') covasAudioCtx.resume();
    
    const osc = covasAudioCtx.createOscillator();
    const gainNode = covasAudioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1500, covasAudioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2500, covasAudioCtx.currentTime + 0.03); 
    
    gainNode.gain.setValueAtTime(0.03, covasAudioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, covasAudioCtx.currentTime + 0.03);
    
    osc.connect(gainNode);
    gainNode.connect(covasAudioCtx.destination);
    
    osc.start();
    osc.stop(covasAudioCtx.currentTime + 0.03);
}

// 2. EFFET MACHINE À ÉCRIRE
async function ecrireLigneCovas(texte, conteneur, classeCouleur = "") {
    const div = document.createElement('div');
    div.className = 'covas-ligne ' + classeCouleur;
    conteneur.appendChild(div);
    
    for (let i = 0; i < texte.length; i++) {
        div.textContent += texte.charAt(i);
        playBipHolographique();
        await new Promise(r => setTimeout(r, 15));
    }
    await new Promise(r => setTimeout(r, 300));
}

// NOUVEAU SON : Acquisition de Cible Tactique (Discret & Espionnage)
function playSonCiblageTactique() {
    if (!covasAudioCtx) covasAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (covasAudioCtx.state === 'suspended') covasAudioCtx.resume();
    
    const t = covasAudioCtx.currentTime;
    const osc = covasAudioCtx.createOscillator();
    const gain = covasAudioCtx.createGain();
    
    osc.type = 'sine';
    
    // Double bip court et furtif (Style transfert de données chiffrées)
    // Bip 1
    osc.frequency.setValueAtTime(1800, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    
    // Bip 2 (Légèrement plus aigu)
    osc.frequency.setValueAtTime(2400, t + 0.08);
    gain.gain.setValueAtTime(0, t + 0.07);
    gain.gain.linearRampToValueAtTime(0.04, t + 0.09);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(covasAudioCtx.destination);
    
    osc.start(t);
    osc.stop(t + 0.2);
}

// 3. LOGIQUE D'ANALYSE (Rapport de l'IA avec acquittement manuel)
async function declencherAnalyseTactique(nomSysteme) {
    if (!nomSysteme || nomSysteme === systemeCourant) return;
    covasEnCours = true;
    systemeCourant = nomSysteme;

    if (!covasAudioCtx) covasAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (covasAudioCtx.state === 'suspended') covasAudioCtx.resume();

    const overlay = document.getElementById('covas-overlay');
    const badge = document.getElementById('covas-badge');
    const contenu = document.getElementById('covas-contenu');
    if (!overlay || !contenu || !badge) return;

    contenu.innerHTML = '';
    badge.style.display = 'none';
    overlay.classList.add('deploye');

    await new Promise(r => setTimeout(r, 500));
    await ecrireLigneCovas(`SYS.EDTEAM // ANALYSE LOCALE : ${nomSysteme.toUpperCase()}`, contenu);

    try {
        let db;
        if (typeof getDb === 'function') db = getDb();
        else if (typeof supabaseApp !== 'undefined') db = supabaseApp;
        else if (typeof window.supabaseApp !== 'undefined') db = window.supabaseApp;

        if (!db) throw new Error("Base de données introuvable.");
        const escadronId = profilCommandant.escadron_id || 'ISS';
        const userId = profilCommandant.user_id;

        let localFactions = [];
        try {
            const edsmRes = await fetch(`https://www.edsm.net/api-system-v1/factions?systemName=${encodeURIComponent(nomSysteme)}`);
            const edsmData = await edsmRes.json();
            if (edsmData && edsmData.factions) {
                localFactions = edsmData.factions.map(f => f.name.toUpperCase());
            }
        } catch(e) {}

        // DIPLOMATIE
        let diploAlerte = false;
        if (localFactions.length > 0) {
            const { data: traites } = await db.from('traites_diplomatiques').select('*').eq('escadron_id', escadronId);
            if (traites && traites.length > 0) {
                for (let traite of traites) {
                    if (localFactions.includes(traite.faction_cible.toUpperCase())) {
                        diploAlerte = true;
                        if (traite.type_relation === 'HOSTILE') {
                            await ecrireLigneCovas(`>_ DIPLOMATIE : ⚠️ MENACE. Faction [${traite.faction_cible.toUpperCase()}] présente (HOSTILE).`, contenu, "covas-alerte");
                        } else if (traite.type_relation === 'ALLIE') {
                            await ecrireLigneCovas(`>_ DIPLOMATIE : Force alliée détectée [${traite.faction_cible.toUpperCase()}].`, contenu, "covas-neutre");
                        } else {
                            await ecrireLigneCovas(`>_ DIPLOMATIE : Territoire P.N.A. [${traite.faction_cible.toUpperCase()}].`, contenu);
                        }
                    }
                }
            }
        }
        if (!diploAlerte) await ecrireLigneCovas(">_ DIPLOMATIE : RAS (Espace Neutre).", contenu, "covas-neutre");

        // BGS
        const { data: params } = await db.from('parametres_app').select('factions_favorites').eq('user_id', userId).single();
        let bgsTrouve = false;
        if (params && params.factions_favorites) {
            const factionsSuivies = params.factions_favorites.filter(f => f.systeme.toUpperCase() === nomSysteme.toUpperCase());
            if (factionsSuivies.length > 0) {
                bgsTrouve = true;
                const nomsFactions = factionsSuivies.map(f => f.faction).join(', ');
                await ecrireLigneCovas(`>_ BGS : Système sous surveillance (${nomsFactions}).`, contenu);
            }
        }
        if (!bgsTrouve) await ecrireLigneCovas(">_ BGS : Aucune faction locale suivie.", contenu);

        // ORDRES
        const { data: ordres } = await db.from('ordres_bgs').select('*')
            .eq('statut', 'ACTIF')
            .eq('escadron_id', escadronId)
            .ilike('systeme_cible', nomSysteme);
            
        if (ordres && ordres.length > 0) {
            for (let ordre of ordres) {
                let textOrdre = ordre.type_ordre === 'HAUSSE' ? 'SOUTIEN' : (ordre.type_ordre === 'BAISSE' ? 'SABOTAGE' : ordre.type_ordre);
                let couleurOrdre = ['BAISSE', 'GUERRE'].includes(ordre.type_ordre) ? 'covas-alerte' : 'covas-neutre';
                await ecrireLigneCovas(`>_ ORDRE ACTIF : ${textOrdre} ciblant [${ordre.faction_cible.toUpperCase()}].`, contenu, couleurOrdre);
            }
        } else {
            await ecrireLigneCovas(">_ ORDRES : Aucune directive de l'Amirauté.", contenu);
        }

        // COMMERCE
        const { data: stations } = await db.from('stations_favorites').select('*')
            .eq('user_id', userId)
            .ilike('system_name', nomSysteme);
            
        if (stations && stations.length > 0) {
            await ecrireLigneCovas(`>_ COMMERCE : ${stations.length} station(s) favorite(s) détectée(s).`, contenu, "covas-neutre");
        } else {
            await ecrireLigneCovas(">_ COMMERCE : RAS.", contenu);
        }

    } catch (error) {
        await ecrireLigneCovas(">_ ⚠️ ERREUR DE LIAISON SATELLITE.", contenu, "covas-alerte");
    }

    await ecrireLigneCovas(">_ FIN DE TRANSMISSION.", contenu);

    // ==========================================
    // MÉCANIQUE DE FERMETURE AU CLIC
    // ==========================================
    const invite = document.createElement('div');
    invite.className = 'covas-ligne';
    invite.style.marginTop = '20px';
    invite.style.textAlign = 'center';
    invite.style.color = '#888';
    invite.style.animation = 'covas-blink 1.5s infinite';
    invite.innerText = "[ CLIQUEZ POUR ACQUITTER ]";
    contenu.appendChild(invite);

    const fermerCovas = () => {
        document.removeEventListener('click', fermerCovas);
        overlay.classList.remove('deploye');
        setTimeout(() => { 
            badge.textContent = `>_ SYS: ${nomSysteme.toUpperCase()}`;
            badge.style.display = 'block'; 
            covasEnCours = false;
        }, 500);
    };

    setTimeout(() => { document.addEventListener('click', fermerCovas); }, 500);
}

// 4. RÉOUVERTURE MANUELLE
window.deployerCovasManuel = function(e) {
    if (e) e.stopPropagation(); 
    if (covasEnCours) return;
    covasEnCours = true;

    document.getElementById('covas-badge').style.display = 'none';
    const overlay = document.getElementById('covas-overlay');
    overlay.classList.add('deploye');
    
    const fermerCovasManuel = () => {
        document.removeEventListener('click', fermerCovasManuel);
        overlay.classList.remove('deploye');
        setTimeout(() => { 
            document.getElementById('covas-badge').style.display = 'block'; 
            covasEnCours = false;
        }, 500);
    };

    setTimeout(() => { document.addEventListener('click', fermerCovasManuel); }, 500);
};

// ==========================================
// 5. ÉCOUTE TEMPS RÉEL SUR SUPABASE
// ==========================================
window.initCovasRealtime = function() {
    let db = typeof supabaseApp !== 'undefined' ? supabaseApp : window.supabaseApp;

    // SÉCURITÉ : On attend l'identification du commandant
    if (!db || typeof profilCommandant === 'undefined' || !profilCommandant) {
        setTimeout(window.initCovasRealtime, 2000);
        return;
    }
    
    db.channel('covas-tactique-channel')
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'radar_commercial',
            filter: `user_id=eq.${profilCommandant.user_id}`
        }, (payload) => {
            const ligne = payload.new;
            
            // SÉCURITÉ 1 : Si la ligne est supprimée (DELETE), on replie l'hologramme
            if (payload.eventType === 'DELETE') {
                const overlayTactique = document.getElementById('tactical-overlay');
                if (overlayTactique) overlayTactique.classList.remove('deploye');
                return;
            }

            if (!ligne) return;

            // --- 1. INTERCEPTION GLOBALE DU CIBLAGE TACTIQUE ---
            if (ligne.target_commodity === 'TARGETED_CMDR') {
                const payloadBrut = ligne.station_name || "";
                
                if (payloadBrut !== window.lastTargetedCmdr) {
                    window.lastTargetedCmdr = payloadBrut;
                    
                    // COUPE-CIRCUIT : On referme de force le COVAS Système bleu s'il était ouvert
                    const covasSysteme = document.getElementById('covas-overlay');
                    if (covasSysteme && covasSysteme.classList.contains('deploye')) {
                        covasSysteme.classList.remove('deploye');
                        covasEnCours = false; // On libère le verrou d'animation
                    }

                    // SÉCURITÉ 2 : Plus permissif (includes) pour capter "LOST" même avec des guillemets
                    if (payloadBrut.includes("LOST")) {
                        const overlayTactique = document.getElementById('tactical-overlay');
                        if (overlayTactique) overlayTactique.classList.remove('deploye');
                    } else {
                        try {
                            const cibleData = JSON.parse(payloadBrut);
                            verifierCibleTactique(cibleData.nom, cibleData.tag);
                        } catch(e) {
                            verifierCibleTactique(payloadBrut, "");
                        }
                    }
                }
                return; // On arrête là pour ne pas lancer l'autre COVAS
            }

            // --- 2. GESTION DU COVAS D'INFORMATION SYSTÈME ---
            if (ligne.target_commodity === 'SYSTEM_STATUS' || ligne.type_operation === 'INFO') {
                const texteStatut = ligne.station_name ? ligne.station_name.toUpperCase() : '';
                
                // COUPE-CIRCUIT : On bloque l'analyse système bleu si le vaisseau scanne une cible
                if (texteStatut.includes('CIBLE') || texteStatut.includes('SCAN') || (window.lastTargetedCmdr && !window.lastTargetedCmdr.includes("LOST"))) {
                    return; 
                }

                const sys = ligne.system_name ? ligne.system_name.trim().toUpperCase() : '';
                const fauxSystemes = ['FINANCE', 'SYS_CORE', 'INCONNU', 'HEARTBEAT', 'STATUS', 'PARAM_UPDATE', 'APP_PARAMS', 'SOL'];
                
                if (sys && !fauxSystemes.includes(sys) && sys.length <= 35) {
                    if (sys !== systemeCourant) {
                        declencherAnalyseTactique(sys);
                    }
                }
            }
        })
        .subscribe();
};

setTimeout(window.initCovasRealtime, 3000);

// ==========================================
// 🔓 DÉVERROUILLAGE CENTRALISÉ & ANTI-VEILLE (UNIVERSEL)
// ==========================================
const activerCovasAudio = () => {
    // 1. On déverrouille le moteur de l'IA
    if (!covasAudioCtx) {
        covasAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (covasAudioCtx.state === 'suspended') {
        covasAudioCtx.resume();
    }
    
    // 2. On lance le bouclier Anti-Veille (Fréquence 1Hz inaudible)
    if (!window.covasKeepAlive) {
        window.covasKeepAlive = true;
        const oscInfrabasse = covasAudioCtx.createOscillator();
        const gainInfrabasse = covasAudioCtx.createGain();
        
        oscInfrabasse.type = 'sine';
        oscInfrabasse.frequency.value = 1; 
        gainInfrabasse.gain.value = 0.001; 
        
        oscInfrabasse.connect(gainInfrabasse);
        gainInfrabasse.connect(covasAudioCtx.destination);
        oscInfrabasse.start(); 
        
        console.log("SYS.EDTEAM : COVAS déverrouillé et Bouclier Anti-Veille activé.");
    }
};

// On attache au "body" pour que ça marche sur TOUTES les pages au premier clic
document.body.addEventListener('click', activerCovasAudio, { once: true });

// ==========================================
// 6. COMPTEUR DE PRÉSENCE EN TEMPS RÉEL (WEB APP)
// ==========================================
window.initialiserCompteurPresence = function() {
    let db;
    if (typeof getDb === 'function') db = getDb();
    else if (typeof supabaseApp !== 'undefined') db = supabaseApp;
    else if (typeof window.supabaseApp !== 'undefined') db = window.supabaseApp;

    if (!db || typeof profilCommandant === 'undefined' || !profilCommandant) {
        setTimeout(window.initialiserCompteurPresence, 2000);
        return;
    }

    // Clé unique basée sur l'utilisateur connecté ou une session anonyme de secours
    const userIdKey = profilCommandant.user_id ? profilCommandant.user_id : 'guest-' + Math.random();

    const presenceChannel = db.channel('pilotes-actifs-webapp', {
        config: { presence: { key: userIdKey } }
    });

    presenceChannel
        .on('presence', { event: 'sync' }, () => {
            try {
                const etat = presenceChannel.presenceState();
                const users = Object.keys(etat);
                const nbConnectes = users.length;

                // --- 1. MISE À JOUR DES BADGES (PC & Mobile) ---
                const pcCountVal = document.getElementById('online-count-val');
                const pcDot = document.getElementById('online-dot');
                if (pcCountVal) { pcCountVal.innerText = nbConnectes; pcCountVal.style.color = '#fff'; }
                if (pcDot) { pcDot.style.background = '#00FF66'; pcDot.style.boxShadow = '0 0 6px #00FF66'; }

                const mobileText = document.getElementById('m-online-text');
                const mobileDot = document.getElementById('m-online-dot');
                if (mobileText) { mobileText.innerText = `${nbConnectes} EN LIGNE`; mobileText.style.color = '#fff'; }
                if (mobileDot) { mobileDot.style.background = '#00FF66'; mobileDot.style.boxShadow = '0 0 6px #00FF66'; }

                // --- 2. MISE À JOUR DE LA MODALE DÉTAILLÉE ---
                let htmlModal = '';
                
                users.forEach(key => {
                    const instances = etat[key];
                    if (!instances || !instances.length) return;
                    
                    const p = instances[0]; // Récupération de la carte de visite du pilote
                    const nomCmdr = p.cmdr ? String(p.cmdr).toUpperCase() : 'COMMANDANT';
                    const nomSquad = p.escadron ? String(p.escadron).toUpperCase() : '';
                    
                    let badges = '';
                    if (p.amiral) badges += '<span style="color: #FF3333; border: 1px solid #FF3333; background: rgba(255,51,51,0.1); font-size: 0.75em; font-weight: bold; padding: 2px 6px; border-radius: 3px;">AMIRAL</span>';
                    if (p.officier) badges += '<span style="color: #00FF66; border: 1px solid #00FF66; background: rgba(0,255,102,0.1); font-size: 0.75em; font-weight: bold; padding: 2px 6px; border-radius: 3px;">OFFICIER</span>';
                    if (p.diplomate) badges += '<span style="color: var(--ed-blue); border: 1px solid var(--ed-blue); background: rgba(0,240,255,0.1); font-size: 0.75em; font-weight: bold; padding: 2px 6px; border-radius: 3px;">DIPLOMATE</span>';
                    
                    const badgeSquad = nomSquad ? `<span style="color: var(--ed-orange); font-weight: bold;">[ ${nomSquad} ]</span>` : `<span style="color: #888;">[ INDÉPENDANT ]</span>`;
                    
                    const indicateurVous = (key === profilCommandant.user_id) ? '<span style="color: var(--ed-blue); font-size: 0.75em; margin-left: 8px; font-weight: bold; letter-spacing: 1px;">[ VOUS ]</span>' : '';

                    htmlModal += `
                    <div style="background: rgba(0, 0, 0, 0.6); border-left: 3px solid #00FF66; padding: 12px 15px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <div>
                                <span style="color: #fff; font-weight: bold; font-size: 1.1em;">CMDR ${nomCmdr}</span>
                                ${indicateurVous}
                            </div>
                            <div style="font-size: 0.85em;">${badgeSquad}</div>
                        </div>
                        <div style="display: flex; gap: 6px;">
                            ${badges}
                        </div>
                    </div>`;
                });

                if (nbConnectes === 0) {
                    htmlModal = '<div style="color: #666; font-style: italic; text-align: center; padding: 20px;">Aucun pilote détecté sur le réseau local.</div>';
                }

                // Injection dans les modales PC et Mobile
                const listePc = document.getElementById('liste-pilotes-online');
                if (listePc) listePc.innerHTML = htmlModal;

                const listeMobile = document.getElementById('m-pilotes-liste');
                if (listeMobile) listeMobile.innerHTML = htmlModal;
                
            } catch (err) {
                console.error("SYS.EDTEAM : Erreur de rendu du radar de présence ->", err);
            }
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                // Diffusion de la carte de visite au réseau
                await presenceChannel.track({
                    cmdr: profilCommandant.cmdr_nom || 'INCONNU',
                    escadron: profilCommandant.escadron_id || '',
                    amiral: profilCommandant.est_amiral === true,
                    officier: profilCommandant.est_officier === true,
                    diplomate: profilCommandant.est_diplomate === true,
                    connecte_a: new Date().toISOString()
                });
            }
        });
};

// Ne lancer le compteur qu'une seule fois !
setTimeout(window.initialiserCompteurPresence, 3000);

// ==========================================
        // MOTEUR D'AFFICHAGE COVAS TACTIQUE AVANCÉ
        // ==========================================

        async function verifierCibleTactique(nomCmdr, tagEscadron) {
            try {
                let db = typeof supabaseApp !== 'undefined' ? supabaseApp : window.supabaseApp;
                
                const requeteProfil = db.from('profils').select('escadron_id').ilike('cmdr_nom', nomCmdr).limit(1);
                const requeteDiplo = (profilCommandant.escadron_id && tagEscadron) 
                    ? db.from('traites_diplomatiques').select('*').eq('escadron_id', profilCommandant.escadron_id).eq('tag', tagEscadron.toUpperCase()).limit(1) 
                    : Promise.resolve({ data: null });
                const requeteTactique = profilCommandant.escadron_id 
                    ? db.from('registre_tactique').select('*').eq('escadron_id', profilCommandant.escadron_id).ilike('cmdr_cible', nomCmdr).eq('est_valide', true).limit(1) 
                    : Promise.resolve({ data: null });

                const [resProfil, resDiplo, resTact] = await Promise.all([requeteProfil, requeteDiplo, requeteTactique]);

                const isRegistered = (resProfil.data && resProfil.data.length > 0);
                let diploStatus = (resDiplo.data && resDiplo.data.length > 0) ? resDiplo.data[0] : null;
                const tacticalFiche = (resTact.data && resTact.data.length > 0) ? resTact.data[0] : null;

                afficherAlerteCovas(nomCmdr, tagEscadron, tacticalFiche, diploStatus, isRegistered);
            } catch(e) { console.error("Erreur scan tactique:", e); }
        }

        function afficherAlerteCovas(nom, tag, tacticalFiche, diploStatus, isRegistered) {
    if (typeof playSonCiblageTactique === 'function') playSonCiblageTactique(); 
    
    const overlay = document.getElementById('tactical-overlay');
    const contenu = document.getElementById('tactical-contenu');
    
    // CORRECTION Z-INDEX : On force l'infobulle à s'afficher tout au-dessus (Couche 110000)
    const tooltipGlobale = document.getElementById('holo-tooltip');
    if (tooltipGlobale) tooltipGlobale.style.zIndex = '110000';

    if (!overlay || !contenu) return;

    let mainColor = 'var(--ed-blue)'; 
    let mainTitle = 'ℹ️ ANALYSE CIBLE';
    let pulseAnim = false;
    let htmlBlocs = "";

    // Ligne stricte : Label à gauche, Résultat à droite
    const rowStyle = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;';

    // --- A. ANALYSE DU REGISTRE TACTIQUE ---
    if (tacticalFiche) {
        let tColor = '#FF3333'; let tLabel = 'K.O.S (HOSTILE)';
        if (tacticalFiche.niveau_menace === 'SUSPECT') { tColor = 'var(--ed-orange)'; tLabel = 'SUSPECT'; }
        if (tacticalFiche.niveau_menace === 'ALLIE') { tColor = '#00FF66'; tLabel = 'ALLIÉ VIP'; }
        
        mainColor = tColor;
        mainTitle = '⚠️ ALERTE TACTIQUE';
        pulseAnim = (tacticalFiche.niveau_menace === 'KOS');
        
        let nomAuteur = tacticalFiche.auteur_nom ? tacticalFiche.auteur_nom.toUpperCase() : 'INCONNU';
        let txtRapport = tacticalFiche.rapport ? tacticalFiche.rapport.replace(/'/g, "\\'").replace(/"/g, "&quot;") : "Aucun rapport";

        // Construction du contenu de l'infobulle holographique
        let tooltipContent = `> RAPPORT TACTIQUE<br><span style=\\'color:#fff; font-weight:normal; font-style:italic;\\'>&quot; ${txtRapport} &quot;</span><br><br><span style=\\'color:${tColor}; font-size:0.85em; font-weight:bold;\\'>SIGNALÉ PAR : CMDR ${nomAuteur}</span>`;

        htmlBlocs += `
        <div class="covas-ligne" style="${rowStyle}">
            <span style="color: #888;">DOSSIER INDIVIDUEL :</span>
            <strong style="color: #000; background: ${tColor}; padding: 2px 8px; border-radius: 2px; cursor: help; box-shadow: 0 0 8px ${tColor};"
                    onclick="event.stopPropagation()"
                    onmouseenter="if(typeof showHoloTooltip === 'function') showHoloTooltip(event, '${tooltipContent}', '${tColor}')" 
                    onmouseleave="if(typeof hideHoloTooltip === 'function') hideHoloTooltip()" 
                    onmousemove="if(typeof moveHoloTooltip === 'function') moveHoloTooltip(event)">
                ${tLabel} ⓘ
            </strong>
        </div>`;
    } else {
        htmlBlocs += `
        <div class="covas-ligne" style="${rowStyle}">
            <span style="color: #888;">DOSSIER INDIVIDUEL :</span>
            <strong style="color: #666; border: 1px solid #444; padding: 2px 8px; border-radius: 2px;">VIERGE</strong>
        </div>`;
    }

    // --- B. ANALYSE DU TRAITÉ DIPLOMATIQUE ---
    if (tag) {
        if (diploStatus) {
            let dColor = 'var(--ed-blue)';
            let dLabel = diploStatus.type_relation ? diploStatus.type_relation.toUpperCase() : 'CONNU DANS LES TRAITÉS';
            let dIcon = '🤝';
            
            if (dLabel.includes('ENNEMI') || dLabel.includes('GUERRE') || dLabel.includes('HOSTILE')) {
                dColor = '#FF3333'; dIcon = '⚔️';
                if (!tacticalFiche) { mainColor = '#FF3333'; mainTitle = '⚠️ ALERTE DIPLOMATIQUE'; pulseAnim = true; }
            } else if (dLabel.includes('ALLI') || dLabel.includes('COALITION')) {
                dColor = '#00FF66'; dIcon = '🛡️';
                if (!tacticalFiche) { mainColor = '#00FF66'; mainTitle = '✅ IDENTIFICATION ALLIÉE'; }
            } else {
                dColor = 'var(--ed-orange)'; dIcon = '⚠️';
                if (!tacticalFiche) { mainColor = 'var(--ed-orange)'; mainTitle = '⚠️ AFFILIATION SOUS SURVEILLANCE'; }
            }

            htmlBlocs += `
            <div class="covas-ligne" style="${rowStyle}">
                <span style="color: #888;">TRAITÉ ESCADRON <span style="color:var(--ed-orange)">[ ${tag} ]</span> :</span> 
                <strong style="color: ${dColor};">${dIcon} ${dLabel}</strong>
            </div>`;
        } else {
            htmlBlocs += `
            <div class="covas-ligne" style="${rowStyle}">
                <span style="color: #888;">TRAITÉ ESCADRON <span style="color:var(--ed-orange)">[ ${tag} ]</span> :</span> 
                <strong style="color: #666; border: 1px solid #444; padding: 2px 8px; border-radius: 2px;">NEUTRE (AUCUN TRAITÉ)</strong>
            </div>`;
        }
    } else {
        htmlBlocs += `
        <div class="covas-ligne" style="${rowStyle}">
            <span style="color: #888;">TRAITE DIPLOMATIQUE :</span>
            <strong style="color: #666; border: 1px solid #444; padding: 2px 8px; border-radius: 2px;">INCONNUE / INDÉPENDANT</strong>
        </div>`;
    }

    // --- C. ANALYSE RÉSEAU EDTEAM ---
    if (isRegistered) {
        if (!tacticalFiche && !diploStatus) {
            mainColor = 'var(--ed-blue)'; mainTitle = '🌐 RÉSEAU EDTEAM';
        }
        htmlBlocs += `
        <div class="covas-ligne" style="${rowStyle} margin-bottom: 0;">
            <span style="color: #888;">EDTEAM :</span>
            <strong style="color: #000; background: var(--ed-blue); padding: 2px 8px; border-radius: 2px; box-shadow: 0 0 8px var(--ed-blue);">✓ RÉPERTORIÉ</strong>
        </div>`;
    } else {
        htmlBlocs += `
        <div class="covas-ligne" style="${rowStyle} margin-bottom: 0;">
            <span style="color: #888;">EDTEAM :</span>
            <strong style="color: #666; border: 1px solid #444; padding: 2px 8px; border-radius: 2px;">NON RÉPERTORIÉ</strong>
        </div>`;
    }

    // --- DÉPLOIEMENT DE L'INTERFACE ---
    overlay.style.borderColor = mainColor;
    overlay.style.boxShadow = pulseAnim ? `0 0 40px ${mainColor}` : `0 0 20px ${mainColor}40`;
    const tagAffichage = tag ? `<span style="color: var(--ed-orange); font-size: 0.85em; margin-left: 10px;">[ ${tag} ]</span>` : '';

    contenu.innerHTML = `
        <div style="color: ${mainColor}; font-size: 1.2em; font-weight: bold; border-bottom: 1px dashed ${mainColor}; padding-bottom: 5px; margin-bottom: 15px; letter-spacing: 2px;">
            ${mainTitle}
        </div>
        <div class="covas-ligne" style="font-size: 1.1em; margin-bottom: 20px;">CIBLE VERROUILLÉE : <strong style="color: #fff; letter-spacing: 1px;">CMDR ${nom}</strong>${tagAffichage}</div>
        
        <div style="padding: 15px; background: rgba(0,0,0,0.5); border: 1px solid #333;">
            ${htmlBlocs}
        </div>
        
        <div class="covas-ligne" style="color: #555; font-size: 0.8em; margin-top: 20px; font-weight: bold; text-align: center;">[ DÉVERROUILLEZ LA CIBLE OU CLIQUEZ ICI POUR FERMER ]</div>
    `;
    
    // --- AUTORISATION DU CLIC MANUEL ---
    overlay.style.pointerEvents = 'auto'; // Rend la modale solide au clic
    overlay.style.cursor = 'pointer';
    
    overlay.onclick = function() {
        if (typeof sonClic === 'function') sonClic();
        overlay.classList.remove('deploye');
        window.lastTargetedCmdr = "LOST"; // On réinitialise la mémoire système
        
        // On referme le tooltip s'il était ouvert et on rend la fenêtre fantôme
        setTimeout(() => {
            overlay.style.pointerEvents = 'none';
            if (typeof hideHoloTooltip === 'function') hideHoloTooltip();
        }, 300);
    };

    overlay.classList.add('deploye');
}

// On attache au "body" pour que ça marche sur TOUTES les pages au premier clic
document.body.addEventListener('click', activerCovasAudio, { once: true });