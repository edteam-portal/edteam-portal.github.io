/**
 * =================================================================
 * SYS.EDTEAM - COVAS (Cerveau Central)
 * Reveil des pages par le temps reel, compteur de presence, deverrouillage du son.
 * (La fenetre d'alerte de ciblage d'un joueur et le registre tactique ont ete retires le 18/10/2026 : plus personne ne les alimentait.)
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
            if (payload.eventType === 'DELETE' || !payload.new) return;
            // NOUVELLE TRAME DU PLUGIN : on reveille la boucle de la page (elle ne sonde plus la boite aux lettres toutes les minutes)
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
