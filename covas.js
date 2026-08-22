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
    let db;
    if (typeof getDb === 'function') db = getDb();
    else if (typeof supabaseApp !== 'undefined') db = supabaseApp;
    else if (typeof window.supabaseApp !== 'undefined') db = window.supabaseApp;

    if (!db) {
        console.warn("SYS.EDTEAM : Base de données introuvable pour le COVAS.");
        setTimeout(window.initCovasRealtime, 2000);
        return;
    }
    
    db.channel('covas-tactique-channel')
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'radar_commercial'
        }, (payload) => {
            const ligne = payload.new;
            if (!ligne) return;

            // On cible en priorité le statut système émis par EDMC
            if (ligne.target_commodity === 'SYSTEM_STATUS' || ligne.type_operation === 'INFO') {
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

// ==========================================
// 6. COMPTEUR DE PRÉSENCE EN TEMPS RÉEL
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

    const presenceChannel = db.channel('pilotes-actifs-webapp', {
        config: { presence: { key: profilCommandant.user_id } }
    });

    presenceChannel
        .on('presence', { event: 'sync' }, () => {
            const etat = presenceChannel.presenceState();
            const nbConnectes = Object.keys(etat).length;

            // --- Mise à jour interface PC (index.html, bgs.html...) ---
            const pcCountVal = document.getElementById('online-count-val');
            const pcDot = document.getElementById('online-dot');
            if (pcCountVal) {
                pcCountVal.innerText = nbConnectes;
                pcCountVal.style.color = '#fff';
            }
            if (pcDot) {
                pcDot.style.background = '#00FF66';
                pcDot.style.boxShadow = '0 0 6px #00FF66';
            }

            // --- Mise à jour interface Mobile (mobile.html) ---
            const mobileText = document.getElementById('m-online-text');
            const mobileDot = document.getElementById('m-online-dot');
            if (mobileText) {
                mobileText.innerText = `${nbConnectes} EN LIGNE`;
                mobileText.style.color = '#fff';
            }
            if (mobileDot) {
                mobileDot.style.background = '#00FF66';
                mobileDot.style.boxShadow = '0 0 6px #00FF66';
            }
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await presenceChannel.track({
                    cmdr: profilCommandant.cmdr_nom || 'INCONNU',
                    connecte_a: new Date().toISOString()
                });
            }
        });
};

setTimeout(window.initialiserCompteurPresence, 3000);

// On attache au "body" pour que ça marche sur TOUTES les pages au premier clic
document.body.addEventListener('click', activerCovasAudio, { once: true });