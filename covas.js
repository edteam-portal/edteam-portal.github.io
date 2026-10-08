/**
 * =================================================================
 * SYS.EDTEAM - COVAS TACTIQUE (Cerveau Central)
 * Alerte tactique quand un pilote est cible en jeu (KOS, Suspect, Allie VIP)
 * =================================================================
 */

let covasAudioCtx = null;

// Resolution unique du client Supabase (evite de repeter ce fallback a chaque endroit du fichier ;
// aucun autre fichier ne definit getDb, ce n'etait qu'un garde-fou mort dans le code d'origine)
function getDb() {
    if (typeof supabaseApp !== 'undefined' && supabaseApp) return supabaseApp;
    if (window.supabaseApp) return window.supabaseApp;
    return null;
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
    osc.frequency.setValueAtTime(1800, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    
    osc.frequency.setValueAtTime(2400, t + 0.08);
    gain.gain.setValueAtTime(0, t + 0.07);
    gain.gain.linearRampToValueAtTime(0.04, t + 0.09);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(covasAudioCtx.destination);
    
    osc.start(t);
    osc.stop(t + 0.2);
}

// ==========================================
// GESTIONNAIRE UNIVERSEL DE CIBLAGE TACTIQUE
// ==========================================
window.fermerCibleTactique = function() {
    window.lastTargetedCmdr = "LOST";
    const overlay = document.getElementById('tactical-overlay');
    if (overlay) {
        overlay.classList.remove('deploye');
        overlay.style.pointerEvents = 'none';
    }
    if (typeof hideHoloTooltip === 'function') hideHoloTooltip();
};

window.traiterCiblageTactique = function(payloadBrut) {
    if (!payloadBrut) {
        window.fermerCibleTactique();
        return;
    }

    const str = String(payloadBrut).trim();
    const strUpper = str.toUpperCase();

    // Détection universelle de déverrouillage / perte de cible
    if (
        strUpper === "LOST" || 
        strUpper.includes("LOST") || 
        strUpper === "NONE" || 
        strUpper === "" || 
        strUpper === "{}" ||
        strUpper.includes('"NOM":""') ||
        strUpper.includes('"NOM":"LOST"') ||
        strUpper.includes('"TARGETLOCKED":FALSE')
    ) {
        window.fermerCibleTactique();
        return;
    }

    if (str === window.lastTargetedCmdr) return;
    window.lastTargetedCmdr = str;

    try {
        const cibleData = JSON.parse(str);
        const nom = cibleData.nom ? cibleData.nom.trim() : "";
        const tag = cibleData.tag ? cibleData.tag.trim() : "";
        
        if (!nom || nom.toUpperCase() === "LOST" || nom.toUpperCase() === "NONE") {
            window.fermerCibleTactique();
        } else {
            verifierCibleTactique(nom, tag);
        }
    } catch(e) {
        verifierCibleTactique(str, "");
    }
};

// ==========================================
// 5. ÉCOUTE TEMPS RÉEL SUR SUPABASE
// ==========================================
window.initCovasRealtime = async function() {
    let db = getDb();

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
            
            // SÉCURITÉ 1 : Si la ligne est supprimée (DELETE), on replie l'hologramme tactique
            if (payload.eventType === 'DELETE') {
                const overlayTactique = document.getElementById('tactical-overlay');
                if (overlayTactique) overlayTactique.classList.remove('deploye');
                return;
            }

            if (!ligne) return;

            // --- 1. INTERCEPTION GLOBALE DU CIBLAGE TACTIQUE ---
            if (ligne.target_commodity === 'TARGETED_CMDR') {
                window.traiterCiblageTactique(ligne.station_name);
                return;
            }
            // --- 2. NOUVELLE TRAME DU PLUGIN : on reveille la boucle de la page (elle ne sonde plus la boite aux lettres toutes les minutes) ---
            if (typeof window.edteamReveilBoucle === 'function') window.edteamReveilBoucle();
        })
        .subscribe((status) => {
            // Tant que le temps reel fonctionne, les boucles se contentent d'un tour de securite toutes les 10 minutes ; sinon elles reprennent la cadence d'une minute.
            window.edteamRtOk = (status === 'SUBSCRIBED');
        });
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
    let db = getDb();

    if (!db || typeof profilCommandant === 'undefined' || !profilCommandant) {
        setTimeout(window.initialiserCompteurPresence, 2000);
        return;
    }

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

                const pcCountVal = document.getElementById('online-count-val');
                const pcDot = document.getElementById('online-dot');
                if (pcCountVal) { pcCountVal.innerText = nbConnectes; pcCountVal.style.color = '#fff'; }
                if (pcDot) { pcDot.style.background = '#00FF66'; pcDot.style.boxShadow = '0 0 6px #00FF66'; }

                const mobileText = document.getElementById('m-online-text');
                const mobileDot = document.getElementById('m-online-dot');
                if (mobileText) { mobileText.innerText = `${nbConnectes} EN LIGNE`; mobileText.style.color = '#fff'; }
                if (mobileDot) { mobileDot.style.background = '#00FF66'; mobileDot.style.boxShadow = '0 0 6px #00FF66'; }

                let htmlModal = '';
                
                users.forEach(key => {
                    const instances = etat[key];
                    if (!instances || !instances.length) return;
                    
                    const p = instances[0]; 
                    const nomCmdr = escapeHtml(p.cmdr ? String(p.cmdr).toUpperCase() : 'COMMANDANT');
                    const nomSquad = escapeHtml(p.escadron ? String(p.escadron).toUpperCase() : '');
                    
                    let badges = '';
                    if (p.amiral) badges += '<span style="color: #FF3333; border: 1px solid #FF3333; background: rgba(255,51,51,0.1); font-size: 0.75em; font-weight: bold; padding: 2px 6px; border-radius: 3px;">AMIRAL</span>';
                    if (p.officier) badges += '<span style="color: #00FF66; border: 1px solid #00FF66; background: rgba(0,255,102,0.1); font-size: 0.75em; font-weight: bold; padding: 2px 6px; border-radius: 3px;">OFFICIER</span>';
                    
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
                await presenceChannel.track({
                    cmdr: profilCommandant.cmdr_nom || 'INCONNU',
                    escadron: profilCommandant.escadron_id || '',
                    amiral: profilCommandant.est_amiral === true,
                    officier: profilCommandant.est_officier === true,
                    connecte_a: new Date().toISOString()
                });
            }
        });
};

setTimeout(window.initialiserCompteurPresence, 3000);

// ==========================================
// MOTEUR D'AFFICHAGE COVAS TACTIQUE AVANCÉ
// ==========================================

async function verifierCibleTactique(nomCmdr, tagEscadron) {
    try {
        let db = getDb();

        // Fonction serveur : 'profils' est cloisonne par escadron, on ne demande que "inscrit ou non"
        const requeteProfil = db.rpc('pilote_inscrit', { p_nom: nomCmdr });
        const requeteTactique = profilCommandant.escadron_id 
            ? db.from('registre_tactique').select('*').eq('escadron_id', profilCommandant.escadron_id).ilike('cmdr_cible', nomCmdr).eq('est_valide', true).limit(1) 
            : Promise.resolve({ data: null });

        const [resProfil, resTact] = await Promise.all([requeteProfil, requeteTactique]);

        const isRegistered = (resProfil.data === true);
        const tacticalFiche = (resTact.data && resTact.data.length > 0) ? resTact.data[0] : null;

        afficherAlerteCovas(nomCmdr, tagEscadron, tacticalFiche, isRegistered);
    } catch(e) { console.error("Erreur scan tactique:", e); }
}

function afficherAlerteCovas(nom, tag, tacticalFiche, isRegistered) {
    nom = escapeHtml(nom);
    tag = escapeHtml(tag);
    if (typeof playSonCiblageTactique === 'function') playSonCiblageTactique();
    
    const overlay = document.getElementById('tactical-overlay');
    const contenu = document.getElementById('tactical-contenu');
    
    const tooltipGlobale = document.getElementById('holo-tooltip');
    if (tooltipGlobale) tooltipGlobale.style.zIndex = '110000';

    if (!overlay || !contenu) return;

    let mainColor = 'var(--ed-blue)'; 
    let mainTitle = 'ℹ️ ANALYSE CIBLE';
    let pulseAnim = false;
    let htmlBlocs = "";

    const rowStyle = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;';

    if (tacticalFiche) {
        let tColor = '#FF3333'; let tLabel = 'K.O.S (HOSTILE)';
        if (tacticalFiche.niveau_menace === 'SUSPECT') { tColor = 'var(--ed-orange)'; tLabel = 'SUSPECT'; }
        if (tacticalFiche.niveau_menace === 'ALLIE') { tColor = '#00FF66'; tLabel = 'ALLIÉ VIP'; }
        
        mainColor = tColor;
        mainTitle = '⚠️ ALERTE TACTIQUE';
        pulseAnim = (tacticalFiche.niveau_menace === 'KOS');
        
        let nomAuteur = escapeHtml(tacticalFiche.auteur_nom ? tacticalFiche.auteur_nom.toUpperCase() : 'INCONNU');
        let txtRapport = escapeHtml(tacticalFiche.rapport || 'Aucun rapport').replace(/\r?\n/g, '<br>');

        // Contenu stocke dans un registre JS (evite le piege du double-decodage HTML
        // qu'un simple escapeHtml() ne survivrait pas si le texte etait serialise
        // directement dans l'attribut onmouseenter).
        window.__tacticalTooltip = `> RAPPORT TACTIQUE<br><span style="color:#fff; font-weight:normal; font-style:italic;">" ${txtRapport} "</span><br><br><span style="color:${tColor}; font-size:0.85em; font-weight:bold;">SIGNALÉ PAR : CMDR ${nomAuteur}</span>`;

        htmlBlocs += `
        <div class="covas-ligne" style="${rowStyle}">
            <span style="color: #888;">DOSSIER INDIVIDUEL :</span>
            <strong style="color: #000; background: ${tColor}; padding: 2px 8px; border-radius: 2px; cursor: help; box-shadow: 0 0 8px ${tColor};"
                    onclick="event.stopPropagation()"
                    onmouseenter="if(typeof showHoloTooltip === 'function') showHoloTooltip(event, window.__tacticalTooltip, '${tColor}')"
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

    if (isRegistered) {
        if (!tacticalFiche) {
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
    
    overlay.style.pointerEvents = 'auto'; 
    overlay.style.cursor = 'pointer';
    
    overlay.onclick = function() {
        if (typeof sonClic === 'function') sonClic();
        overlay.classList.remove('deploye');
        window.lastTargetedCmdr = "LOST"; 
        
        setTimeout(() => {
            overlay.style.pointerEvents = 'none';
            if (typeof hideHoloTooltip === 'function') hideHoloTooltip();
        }, 300);
    };

    overlay.classList.add('deploye');
}

// Sécurité finale pour attacher l'activation au premier clic
document.body.addEventListener('click', activerCovasAudio, { once: true });