// CARRIERE : les quatre fenetres de rang (BGS, Powerplay, Federation, Auxiliaires), ouvrables depuis N'IMPORTE QUELLE page.
// Chargee a la demande par navigation.js (window.ouvrirCarriere) : une seule fois, au premier clic sur une pastille de l'en-tete.
// Code deplace tel quel depuis index.html (le 03/10/2026) ; les pastilles de l'en-tete sont dessinees par navigation.js (actualiserHeader).
(function () {
    'use strict';
    if (window.carriere) return;

    // ---------- styles propres aux fenetres (noms prefixes : aucun conflit avec les styles de la page hote)
    const st = document.createElement('style');
    st.id = 'carriere-style';
    st.textContent = "\n.crm-overlay { --ed-orange: #FF7100; --ed-blue: #00F0FF; --ed-red: #FF3333; --ed-green: #00FF66; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.85); display: none; justify-content: center; align-items: center; z-index: 2000; }\n.crm-content { background: rgba(10, 5, 0, 0.95); border: 1px solid #FF7100; padding: 30px; max-width: 600px; color: #ccc; position: relative; font-family: 'Share Tech Mono', monospace; }\n.crm-close { position: absolute; top: 15px; right: 20px; color: #FF7100; cursor: pointer; font-size: 1.2em; font-weight: bold; }\n.rang-ligne { cursor: default; padding: 11px 14px; background: rgba(0,0,0,0.45); border: 1px solid #2a2a2a; border-left: 3px solid #FF7100; border-radius: 0 4px 4px 0; margin-bottom: 10px; }\n.rang-ligne-tete { display: grid; grid-template-columns: 120px 1fr auto; align-items: baseline; gap: 10px; margin-bottom: 9px; }\n.rang-dom { color: #888; font-size: 0.78em; letter-spacing: 1.5px; }\n.rang-nom { color: #FF7100; font-weight: bold; font-size: 1.15em; letter-spacing: 1px; }\n.rang-pct { color: #fff; font-weight: bold; }\n.rang-barre { height: 7px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; }\n.rang-barre > div { height: 100%; background: #00F0FF; box-shadow: 0 0 6px #00F0FF; transition: width 0.5s; }\n.rang-ligne.elite { border-left-color: #FFD700; }\n.rang-ligne.elite .rang-nom { color: #FFD700; text-shadow: 0 0 10px rgba(255,215,0,0.45); }\n.rang-aux { padding: 14px 16px; background: rgba(0,0,0,0.45); border: 1px solid #2a2a2a; border-left: 3px solid var(--c); border-radius: 0 4px 4px 0; }\n.rang-aux-nom { color: #fff; font-weight: bold; font-size: 1.35em; letter-spacing: 1px; }\n";
    document.head.appendChild(st);

    // ---------- HTML des fenetres
    const html = "    <!-- MODALE COMMANDEMENT BGS : RANG DE CARRIÈRE (même structure que la salle Powerplay) -->\n    <!-- MODAL : FÉDÉRATION DES PILOTES (les cinq rangs de carrière) -->\n    <div class=\"crm-overlay\" id=\"modal-rangs-fed\" onclick=\"fermerModal('modal-rangs-fed', event)\" style=\"z-index: 2900;\">\n        <div class=\"crm-content\" style=\"max-width: 580px; width: 95%; padding: 0; background: rgba(8, 5, 0, 0.98); border: 1px solid #00FF66; box-shadow: 0 0 40px rgba(0, 255, 102, 0.15); position: relative;\" onclick=\"event.stopPropagation()\">\n            <div class=\"crm-close\" style=\"position: absolute; top: 14px; right: 20px; color: #00FF66; z-index: 60;\" onclick=\"fermerModal('modal-rangs-fed')\">X</div>\n            <div style=\"padding: 18px 24px; border-bottom: 1px solid rgba(0, 255, 102, 0.35); background: rgba(0, 255, 102, 0.05);\">\n                <span style=\"color: #888; font-size: 0.8em; letter-spacing: 2px; display: block; margin-bottom: 4px;\">CARRIÈRE DE PILOTE</span>\n                <span style=\"color: #00FF66; font-size: 1.4em; font-weight: bold; letter-spacing: 2px;\">FÉDÉRATION DES PILOTES</span>\n            </div>\n            <div style=\"padding: 18px 24px 8px;\">\n                <div id=\"rang-ligne-combat\" class=\"rang-ligne\">\n                    <div class=\"rang-ligne-tete\"><span class=\"rang-dom\">COMBAT</span><span id=\"qg-combat-rank\" class=\"rang-nom\">INCONNU</span><span id=\"qg-combat-prog\" class=\"rang-pct\">0%</span></div>\n                    <div class=\"rang-barre\"><div id=\"qg-combat-bar\" style=\"width: 0%;\"></div></div>\n                </div>\n                <div id=\"rang-ligne-trade\" class=\"rang-ligne\">\n                    <div class=\"rang-ligne-tete\"><span class=\"rang-dom\">COMMERCE</span><span id=\"qg-trade-rank\" class=\"rang-nom\">INCONNU</span><span id=\"qg-trade-prog\" class=\"rang-pct\">0%</span></div>\n                    <div class=\"rang-barre\"><div id=\"qg-trade-bar\" style=\"width: 0%;\"></div></div>\n                </div>\n                <div id=\"rang-ligne-explore\" class=\"rang-ligne\">\n                    <div class=\"rang-ligne-tete\"><span class=\"rang-dom\">EXPLORATION</span><span id=\"qg-explore-rank\" class=\"rang-nom\">INCONNU</span><span id=\"qg-explore-prog\" class=\"rang-pct\">0%</span></div>\n                    <div class=\"rang-barre\"><div id=\"qg-explore-bar\" style=\"width: 0%;\"></div></div>\n                </div>\n                <div id=\"rang-ligne-exobio\" class=\"rang-ligne\">\n                    <div class=\"rang-ligne-tete\"><span class=\"rang-dom\">EXOBIOLOGIE</span><span id=\"qg-exobio-rank\" class=\"rang-nom\">INCONNU</span><span id=\"qg-exobio-prog\" class=\"rang-pct\">0%</span></div>\n                    <div class=\"rang-barre\"><div id=\"qg-exobio-bar\" style=\"width: 0%;\"></div></div>\n                </div>\n                <div id=\"rang-ligne-mercenary\" class=\"rang-ligne\">\n                    <div class=\"rang-ligne-tete\"><span class=\"rang-dom\">MERCENAIRE</span><span id=\"qg-mercenary-rank\" class=\"rang-nom\">INCONNU</span><span id=\"qg-mercenary-prog\" class=\"rang-pct\">0%</span></div>\n                    <div class=\"rang-barre\"><div id=\"qg-mercenary-bar\" style=\"width: 0%;\"></div></div>\n                </div>\n            </div>\n            <div style=\"height: 6px;\"></div>\n        </div>\n    </div>\n\n    <!-- MODAL : RANGS AUXILIAIRES (Marine fédérale et Empire) -->\n    <div class=\"crm-overlay\" id=\"modal-rangs-aux\" onclick=\"fermerModal('modal-rangs-aux', event)\" style=\"z-index: 2900;\">\n        <div class=\"crm-content\" style=\"max-width: 520px; width: 95%; padding: 0; background: rgba(8, 5, 0, 0.98); border: 1px solid #B026FF; box-shadow: 0 0 40px rgba(176, 38, 255, 0.15); position: relative;\" onclick=\"event.stopPropagation()\">\n            <div class=\"crm-close\" style=\"position: absolute; top: 14px; right: 20px; color: #B026FF; z-index: 60;\" onclick=\"fermerModal('modal-rangs-aux')\">X</div>\n            <div style=\"padding: 18px 24px; border-bottom: 1px solid rgba(176, 38, 255, 0.35); background: rgba(176, 38, 255, 0.05);\">\n                <span style=\"color: #888; font-size: 0.8em; letter-spacing: 2px; display: block; margin-bottom: 4px;\">ALLÉGEANCES</span>\n                <span style=\"color: #B026FF; font-size: 1.4em; font-weight: bold; letter-spacing: 2px;\">RANGS AUXILIAIRES</span>\n            </div>\n            <div style=\"padding: 18px 24px 22px; display: flex; flex-direction: column; gap: 14px;\">\n                <div class=\"rang-aux\" style=\"--c: #4da6ff;\">\n                    <div style=\"color: #888; font-size: 0.8em; letter-spacing: 2px;\">FÉDÉRATION</div>\n                    <div style=\"color: #666; font-size: 0.72em; margin-bottom: 8px;\">Marine fédérale</div>\n                    <div style=\"display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-bottom: 10px;\"><span id=\"qg-fed-rank\" class=\"rang-aux-nom\">INCONNU</span><span id=\"qg-fed-prog\" class=\"rang-pct\" style=\"color: var(--c);\">(0%)</span></div>\n                    <div class=\"rang-barre\"><div id=\"qg-fed-bar\" style=\"width: 0%; background: var(--c); box-shadow: 0 0 6px var(--c);\"></div></div>\n                </div>\n                <div class=\"rang-aux\" style=\"--c: #FF3333;\">\n                    <div style=\"color: #888; font-size: 0.8em; letter-spacing: 2px;\">EMPIRE</div>\n                    <div style=\"color: #666; font-size: 0.72em; margin-bottom: 8px;\">Marine impériale</div>\n                    <div style=\"display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-bottom: 10px;\"><span id=\"qg-emp-rank\" class=\"rang-aux-nom\">INCONNU</span><span id=\"qg-emp-prog\" class=\"rang-pct\" style=\"color: var(--c);\">(0%)</span></div>\n                    <div class=\"rang-barre\"><div id=\"qg-emp-bar\" style=\"width: 0%; background: var(--c); box-shadow: 0 0 6px var(--c);\"></div></div>\n                </div>\n            </div>\n        </div>\n    </div>\n\n    <div class=\"crm-overlay\" id=\"modal-bgs\" onclick=\"fermerModal('modal-bgs', event)\" style=\"z-index: 4550;\">\n        <div class=\"crm-content\" style=\"max-width: 900px; width: 95%; background: rgba(8, 5, 0, 0.98); border: 1px solid var(--ed-orange); box-shadow: 0 0 40px rgba(255, 113, 0, 0.2); display: flex; flex-direction: column; max-height: 85vh; padding: 0; overflow: hidden;\" onclick=\"event.stopPropagation()\">\n            <div class=\"crm-close\" style=\"position: absolute; top: 15px; right: 20px; color: var(--ed-orange); z-index: 60;\" onclick=\"fermerModal('modal-bgs')\">X</div>\n\n            <!-- En-tête -->\n            <div style=\"padding: 20px 25px; border-bottom: 1px solid rgba(255, 113, 0, 0.3); background: rgba(255, 113, 0, 0.05); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;\">\n                <div>\n                    <span style=\"color: #888; font-size: 0.8em; letter-spacing: 2px; display: block; margin-bottom: 4px;\">OPÉRATIONS BGS DE L'ESCADRON</span>\n                    <span id=\"bgs-modal-escadron\" style=\"color: var(--ed-orange); font-size: 1.5em; font-weight: bold; letter-spacing: 2px;\">COMMANDEMENT BGS</span>\n                </div>\n                <div style=\"text-align: right; margin-right: 30px;\">\n                    <span style=\"color: #888; font-size: 0.8em; display: block; margin-bottom: 4px;\">PROCHAIN CYCLE :</span>\n                    <span id=\"bgs-modal-countdown\" style=\"color: #FFD700; font-weight: bold; font-size: 1.1em; letter-spacing: 1px;\">JEUDI 07:00 UTC</span>\n                </div>\n            </div>\n\n            <!-- Contenu dynamique -->\n            <div id=\"bgs-modal-body\" style=\"padding: 25px; overflow-y: auto; flex-grow: 1; display: flex; flex-direction: column; gap: 20px;\">\n                <!-- Injecté par JavaScript -->\n            </div>\n        </div>\n    </div>\n\n    <!-- MODALE SALLE STRATÉGIQUE POWERPLAY 2.0 -->\n    <div class=\"crm-overlay\" id=\"modal-powerplay\" onclick=\"fermerModal('modal-powerplay', event)\" style=\"z-index: 4550;\">\n        <div class=\"crm-content\" style=\"max-width: 900px; width: 95%; background: rgba(5, 8, 12, 0.98); border: 1px solid var(--ed-blue); box-shadow: 0 0 40px rgba(0, 240, 255, 0.2); display: flex; flex-direction: column; max-height: 85vh; padding: 0; overflow: hidden;\" onclick=\"event.stopPropagation()\">\n            <div class=\"crm-close\" style=\"position: absolute; top: 15px; right: 20px; color: var(--ed-blue); z-index: 60;\" onclick=\"fermerModal('modal-powerplay')\">X</div>\n            \n            <!-- En-tête -->\n            <div style=\"padding: 20px 25px; border-bottom: 1px solid rgba(0, 240, 255, 0.3); background: rgba(0, 240, 255, 0.05); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;\">\n                <div>\n                    <span style=\"color: #888; font-size: 0.8em; letter-spacing: 2px; display: block; margin-bottom: 4px;\">OPÉRATIONS STRATÉGIQUES GALACTIQUES</span>\n                    <span id=\"pp-modal-power-name\" style=\"color: var(--ed-blue); font-size: 1.5em; font-weight: bold; letter-spacing: 2px;\">ALLÉGEANCE : INCONNUE</span>\n                </div>\n                <div style=\"text-align: right;\">\n                    <span style=\"color: #888; font-size: 0.8em; display: block; margin-bottom: 4px;\">PROCHAIN CYCLE POWERPLAY :</span>\n                    <span id=\"pp-modal-countdown\" style=\"color: #FFD700; font-weight: bold; font-size: 1.1em; letter-spacing: 1px;\">JEUDI 07:00 UTC</span>\n                </div>\n            </div>\n\n            <!-- Contenu dynamique -->\n            <div id=\"pp-modal-body\" style=\"padding: 25px; overflow-y: auto; flex-grow: 1; display: flex; flex-direction: column; gap: 20px;\">\n                <!-- Injecté par JavaScript -->\n            </div>\n        </div>\n    </div>\n\n";
    document.body.insertAdjacentHTML('beforeend', html);

    // ---------- paliers de rang (noms du jeu) : definis une fois pour toutes dans navigation.js (window.EDTEAM_RANGS)
    const R = window.EDTEAM_RANGS;
    const ranksCombat = R.combat, ranksTrade = R.trade, ranksExplore = R.explore, ranksExobio = R.exobio, ranksMercenary = R.mercenary, ranksFed = R.fed, ranksEmp = R.emp;

    // Profil le plus recent connu : celui que l'en-tete a recu en dernier (actualiserHeader), sinon celui de la page
    const profilRangs = () => Object.assign({}, (typeof profilCommandant !== 'undefined' && profilCommandant) ? profilCommandant : (window.profilCommandant || {}), window.__profilRangs || {});

    // Remplit les barres des fenetres Federation (5 domaines) et Auxiliaires (Marine federale et Empire)
    function remplirRangs() {
        const p = profilRangs();
        const maj = (idPrefix, rankVal, progVal, tab) => {
            const r = parseInt(rankVal) || 0, pr = parseInt(progVal) || 0;
            const elR = document.getElementById('qg-' + idPrefix + '-rank'); if (elR) elR.innerText = tab[r] || 'INCONNU';
            const elP = document.getElementById('qg-' + idPrefix + '-prog'); if (elP) elP.innerText = (idPrefix === 'fed' || idPrefix === 'emp') ? '(' + pr + '%)' : pr + '%';
            const elB = document.getElementById('qg-' + idPrefix + '-bar'); if (elB) elB.style.width = pr + '%';
        };
        maj('combat', p.rang_combat, p.prog_combat, ranksCombat);
        maj('trade', p.rang_commerce, p.prog_commerce, ranksTrade);
        maj('explore', p.rang_explo, p.prog_explore, ranksExplore);
        maj('exobio', p.rang_exobio, p.prog_exobio, ranksExobio);
        maj('mercenary', p.rang_mercenary, p.prog_mercenary, ranksMercenary);
        maj('fed', p.rang_fed, p.prog_fed, ranksFed);
        maj('emp', p.rang_emp, p.prog_emp, ranksEmp);
        const cles = ['combat', 'trade', 'explore', 'exobio', 'mercenary'];
        [p.rang_combat, p.rang_commerce, p.rang_explo, p.rang_exobio, p.rang_mercenary].forEach((r, i) => {
            const ligne = document.getElementById('rang-ligne-' + cles[i]); if (ligne) ligne.classList.toggle('elite', (parseInt(r) || 0) >= 8);
        });
    }

        // ==========================================
        // SALLE DE COMMANDEMENT POWERPLAY 2.0 (OPSEC)
        // ==========================================
        function calculerCompteReboursCycle() {
            const now = new Date();
            const prochainJeudi = new Date(Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate() + ((4 - now.getUTCDay() + 7) % 7 || 7),
                7, 0, 0
            ));
            if (now.getUTCDay() === 4 && now.getUTCHours() < 7) {
                prochainJeudi.setUTCDate(now.getUTCDate());
            }
            const diff = Math.max(0, prochainJeudi - now);
            const j = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diff / (1000 * 60)) % 60);
            return `${j}J ${h}H ${m}M`;
        }

        // ==========================================
        // COMMANDEMENT BGS : RANG DE CARRIÈRE (1 à 100), permanent
        // Seuil du rang n = round(15 * (n-1)^1.6) points cumulés (même formule que le serveur, script SQL 17).
        // ==========================================
        function seuilRangBgs(n) { return n <= 1 ? 0 : Math.round(15 * Math.pow(n - 1, 1.6)); }

        function progressionRangBgs(rang, points) {
            rang = Math.min(100, Math.max(1, rang || 1));
            points = points || 0;
            if (rang >= 100) return { rang, points, min: seuilRangBgs(100), max: null, pct: 100, reste: 0 };
            const min = seuilRangBgs(rang), max = seuilRangBgs(rang + 1);
            return { rang, points, min, max, pct: Math.max(0, Math.min(100, ((points - min) / (max - min)) * 100)), reste: Math.max(0, Math.ceil(max - points)) };
        }


        async function ouvrirSalleBgs() {
            if (typeof sonClic === 'function') sonClic();
            const modal = document.getElementById('modal-bgs');
            const titre = document.getElementById('bgs-modal-escadron');
            const compteur = document.getElementById('bgs-modal-countdown');
            const corps = document.getElementById('bgs-modal-body');
            compteur.innerText = calculerCompteReboursCycle();

            if (!profilCommandant || !profilCommandant.escadron_id) {
                titre.innerText = 'COMMANDEMENT BGS';
                corps.innerHTML = `<div style="background: rgba(0,0,0,0.5); border: 1px dashed #555; padding: 30px; text-align: center; border-radius: 4px; color: #ccc; line-height: 1.6;">Le rang BGS est réservé aux membres d'un escadron.</div>`;
                modal.style.display = 'flex';
                return;
            }

            titre.innerText = profilCommandant.escadron_id.toUpperCase();
            corps.innerHTML = '<div style="color: #888; text-align: center; padding: 40px; font-style: italic;">Consultation de votre dossier de carrière...</div>';
            modal.style.display = 'flex';
            const fmt = n => new Intl.NumberFormat('fr-FR').format(n);

            try {
                const [resMoi, resTab] = await Promise.all([
                    supabaseApp.from('profils').select('rang_bgs, points_bgs').eq('user_id', profilCommandant.user_id).single(),
                    supabaseApp.rpc('tableau_escadron_bgs')
                ]);
                if (resMoi.error) throw resMoi.error;
                const rang = resMoi.data.rang_bgs || 1;
                const points = Number(resMoi.data.points_bgs) || 0;
                const pr = progressionRangBgs(rang, points);
                const tableau = resTab.error ? [] : (resTab.data || []);

                // Bannière de promotion : mémoire du navigateur, aucune écriture en base
                let banniere = '';
                try {
                    const cle = 'edteam_rang_bgs_vu_' + profilCommandant.user_id;
                    const vu = parseInt(localStorage.getItem(cle) || '0');
                    if (vu > 0 && rang > vu) {
                        banniere = `<div style="background: rgba(255, 215, 0, 0.1); border: 1px solid #FFD700; padding: 12px 18px; border-radius: 4px; color: #FFD700; font-weight: bold; letter-spacing: 2px; text-align: center; box-shadow: 0 0 15px rgba(255,215,0,0.25);">NOUVEAU RANG : VOUS ÊTES PASSÉ AU RANG BGS ${rang}</div>`;
                    }
                    localStorage.setItem(cle, String(rang));
                } catch (e) {}

                const suite = pr.max === null
                    ? `<span style="color: #FFD700; font-weight: bold;">RANG MAXIMAL ATTEINT</span>`
                    : `<span style="color: #888;">PROCHAIN : RANG ${rang + 1} À</span> <span style="color: #fff; font-weight: bold;">${fmt(pr.max)}</span> <span style="color: #888;">POINTS · IL VOUS EN MANQUE</span> <span style="color: #FFD700; font-weight: bold;">${fmt(pr.reste)}</span>`;

                let html = `
                ${banniere}
                <!-- CARTE PERSONNELLE DU PILOTE -->
                <div style="background: rgba(255, 113, 0, 0.05); border-left: 3px solid var(--ed-orange); padding: 15px 20px; border-radius: 0 4px 4px 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                        <div>
                            <span style="color: #888; font-size: 0.8em; letter-spacing: 1px;">VOTRE CARRIÈRE BGS :</span>
                            <div style="color: #fff; font-size: 1.2em; font-weight: bold; margin-top: 3px;">
                                CMDR ${(profilCommandant.cmdr_nom || 'INCONNU').toUpperCase()}
                                <span style="color: var(--ed-orange); font-size: 0.85em; margin-left: 10px;">[ RANG ${rang} ]</span>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <span style="color: #888; font-size: 0.8em; display: block;">POINTS DE CARRIÈRE :</span>
                            <span style="color: #FFD700; font-size: 1.3em; font-weight: bold;">${fmt(Math.floor(points))}</span>
                        </div>
                    </div>
                    <div style="margin-top: 14px;">
                        <div style="height: 10px; background: rgba(255,255,255,0.08); border-radius: 5px; overflow: hidden;">
                            <div style="width: ${pr.pct.toFixed(1)}%; height: 100%; background: var(--ed-orange); box-shadow: 0 0 8px var(--ed-orange);"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px; margin-top: 6px; font-size: 0.8em;">
                            <span style="color: var(--ed-orange); font-weight: bold;">RANG ${rang}</span>
                            <span>${suite}</span>
                        </div>
                    </div>
                </div>

                <!-- MA PROGRESSION (chargée après l'affichage) -->
                <div id="bgs-progression"></div>

                <!-- TABLEAU DE L'ESCADRON -->
                <div>
                    <div style="color: var(--ed-orange); font-weight: bold; letter-spacing: 2px; border-bottom: 1px dashed rgba(255, 113, 0, 0.3); padding-bottom: 8px; margin-bottom: 15px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
                        <span>TABLEAU DE L'ESCADRON</span>
                        <span>${tableau.length} PILOTE(S)</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">`;

                tableau.forEach((p, index) => {
                    const estMoi = (p.cmdr_nom && profilCommandant.cmdr_nom && p.cmdr_nom.toUpperCase() === profilCommandant.cmdr_nom.toUpperCase());
                    html += `
                        <div style="background: ${estMoi ? 'rgba(255, 113, 0, 0.12)' : 'rgba(0,0,0,0.5)'}; border: 1px solid ${estMoi ? 'var(--ed-orange)' : '#333'}; padding: 12px 18px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 0.95em;">
                            <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                                <span style="color: ${index < 3 ? '#FFD700' : '#888'}; font-weight: bold; width: 30px;">#${index + 1}</span>
                                <span style="color: #fff; font-weight: bold;">CMDR ${(p.cmdr_nom || 'INCONNU').toUpperCase()}</span>
                                <span style="color: var(--ed-orange); font-size: 0.8em; border: 1px solid rgba(255,113,0,0.5); padding: 1px 6px; border-radius: 2px;">RANG ${p.rang_bgs || 1}</span>
                            </div>
                            <div style="color: #FFD700; font-weight: bold; letter-spacing: 1px;">
                                ${fmt(Math.floor(Number(p.points_bgs) || 0))} <span style="font-size: 0.8em; color: #888;">POINTS</span>
                            </div>
                        </div>`;
                });

                html += `</div></div>

                <!-- COMMENT ÇA MARCHE -->
                <details open style="border: 1px solid rgba(255,113,0,0.25); background: rgba(255,113,0,0.03); padding: 14px 18px; border-radius: 4px;">
                    <summary style="color: var(--ed-orange); font-weight: bold; letter-spacing: 2px; cursor: pointer;">COMMENT ÇA MARCHE</summary>
                    <ul style="margin: 12px 0 0 18px; color: #ccc; font-size: 0.9em; line-height: 1.7;">
                        <li>Chaque effort accompli pour l'escadron, qu'il réponde à une directive ou non, rapporte des <strong style="color:#fff;">points</strong> : 1 point pour 2 millions de crédits (économie, sécurité, science), 1 point pour 400 tonnes de colonisation, et des points selon l'importance de l'action pour les missions et les zones de combat. Les échecs ne rapportent rien.</li>
                        <li>Vos points s'additionnent pour <strong style="color:#fff;">toute votre carrière</strong> et déterminent votre rang BGS, de 1 à 100. <strong style="color:#fff;">Un rang gagné ne se perd jamais</strong>, même si une directive est supprimée.</li>
                        <li>Les premiers rangs se gagnent vite, les suivants demandent de plus en plus d'efforts. Le rang 100 (23 394 points) est réservé aux plus fidèles.</li>
                        <li>Une ligne dorée apparaît dans le journal tactique de l'escadron à chaque dizaine atteinte (10, 20… 100).</li>
                        <li>Ce rang est distinct de votre rôle dans l'escadron (Amiral, Officier…) et de votre rang Powerplay.</li>
                    </ul>
                </details>`;

                corps.innerHTML = html;
                chargerProgressionBgs();
            } catch (err) {
                console.error('Erreur Commandement BGS :', err);
                corps.innerHTML = '<div style="color: #FF3333; text-align: center; padding: 20px;">Échec de la consultation du dossier de carrière.</div>';
            }
        }

        // "Ma progression" BGS : points gagnés par cycle (8 derniers), d'après la fonction serveur progression_bgs_hebdo
        async function chargerProgressionBgs() {
            const zone = document.getElementById('bgs-progression');
            if (!zone) return;
            const fmt = n => new Intl.NumberFormat('fr-FR').format(n);
            const jourMs = 86400000;
            try {
                const { data, error } = await supabaseApp.rpc('progression_bgs_hebdo', { p_cycles: 8 });
                if (error) throw error;
                const parSemaine = {};
                (data || []).forEach(l => { parSemaine[l.semaine] = Number(l.points) || 0; });

                // Jeudi (UTC) qui clôture le cycle en cours (le cycle change le jeudi 07:00 UTC)
                const decale = new Date(Date.now() - 7 * 3600000);
                let ajout = (4 - decale.getUTCDay() + 7) % 7;
                if (ajout === 0) ajout = 7;
                const clotureT = Date.UTC(decale.getUTCFullYear(), decale.getUTCMonth(), decale.getUTCDate()) + ajout * jourMs;
                const clotureCourante = new Date(clotureT).toISOString().slice(0, 10);

                const cycles = [];
                for (let i = 7; i >= 0; i--) {
                    const cle = new Date(clotureT - i * 7 * jourMs).toISOString().slice(0, 10);
                    cycles.push({ semaine: cle, gain: parSemaine[cle] || 0 });
                }
                const gains = cycles.map(c => c.gain);
                const somme = gains.reduce((a, b) => a + b, 0);
                if (somme <= 0) {
                    zone.innerHTML = `
                    <div style="border: 1px dashed rgba(255,113,0,0.3); padding: 14px 18px; border-radius: 4px;">
                        <div style="color: var(--ed-orange); font-weight: bold; letter-spacing: 2px;">MA PROGRESSION</div>
                        <div style="color: #888; font-size: 0.85em; line-height: 1.5; margin-top: 8px;">Aucun effort enregistré sur les 8 derniers cycles. Vos points gagnés chaque semaine s'afficheront ici.</div>
                    </div>`;
                    return;
                }
                const maxGain = Math.max(1, ...gains);
                const meilleur = Math.max(...gains);
                const moyenne = Math.round(somme / cycles.length);

                const barres = cycles.map(c => {
                    const enCours = c.semaine === clotureCourante;
                    const hauteur = c.gain > 0 ? Math.max(3, Math.round(70 * c.gain / maxGain)) : 2;
                    const couleur = enCours ? 'var(--ed-orange)' : (c.gain > 0 && c.gain === meilleur ? '#FFD700' : 'rgba(255,113,0,0.45)');
                    return `
                    <div style="flex: 1; min-width: 54px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 4px;">
                        <span style="color: #ccc; font-size: 0.7em;">${c.gain > 0 ? '+' + fmt(Math.round(c.gain)) : '0'}</span>
                        <div style="width: 100%; max-width: 46px; height: ${hauteur}px; background: ${couleur}; border-radius: 2px 2px 0 0;${enCours ? ' box-shadow: 0 0 8px rgba(255,113,0,0.5);' : ''}"></div>
                        <span style="color: ${enCours ? 'var(--ed-orange)' : '#888'}; font-size: 0.7em; white-space: nowrap;">${enCours ? 'EN COURS' : c.semaine.slice(8, 10) + '/' + c.semaine.slice(5, 7)}</span>
                    </div>`;
                }).join('');

                zone.innerHTML = `
                <div style="border: 1px solid rgba(255,113,0,0.25); background: rgba(255,113,0,0.03); padding: 14px 18px; border-radius: 4px;">
                    <div style="color: var(--ed-orange); font-weight: bold; letter-spacing: 2px; border-bottom: 1px dashed rgba(255,113,0,0.3); padding-bottom: 8px; margin-bottom: 14px;">MA PROGRESSION</div>
                    <div style="display: flex; gap: 6px; align-items: flex-end; min-height: 110px; overflow-x: auto;">${barres}</div>
                    <div style="display: flex; gap: 25px; flex-wrap: wrap; margin-top: 14px; font-size: 0.85em;">
                        <div><span style="color: #888;">MEILLEUR CYCLE :</span> <span style="color: #FFD700; font-weight: bold;">+${fmt(Math.round(meilleur))}</span></div>
                        <div><span style="color: #888;">MOYENNE PAR CYCLE :</span> <span style="color: #fff; font-weight: bold;">+${fmt(moyenne)}</span></div>
                        <div><span style="color: #888;">TOTAL (8 CYCLES) :</span> <span style="color: #fff; font-weight: bold;">+${fmt(Math.round(somme))}</span></div>
                    </div>
                </div>`;
            } catch (err) {
                console.error('Erreur progression BGS :', err);
                zone.innerHTML = '';
            }
        }

        // "Ma progression" : mérites gagnés par cycle, d'après merites_cycles (chaque pilote ne lit que ses propres lignes).
        // Un cycle sans relevé = aucun gain (le total ne bouge que si le plugin a vu des mérites).
        async function chargerProgressionPowerplay() {
            const zone = document.getElementById('pp-progression');
            if (!zone) return;
            const fmt = n => new Intl.NumberFormat('fr-FR').format(n);
            const jourMs = 86400000;
            try {
                const { data, error } = await supabaseApp.from('merites_cycles')
                    .select('semaine, puissance, merites_total, releve_le')
                    .order('semaine', { ascending: false }).limit(10);
                if (error) throw error;
                const lignes = (data || []).slice().reverse(); // du plus ancien au plus récent
                if (!lignes.length) { zone.innerHTML = ''; return; }

                // Jeudi (UTC) qui clôture le cycle en cours (même règle que le serveur : le cycle change le jeudi 07:00 UTC)
                const decale = new Date(Date.now() - 7 * 3600000);
                let ajout = (4 - decale.getUTCDay() + 7) % 7;
                if (ajout === 0) ajout = 7;
                const clotureCourante = new Date(Date.UTC(decale.getUTCFullYear(), decale.getUTCMonth(), decale.getUTCDate()) + ajout * jourMs).toISOString().slice(0, 10);

                const parSemaine = {};
                lignes.forEach(l => { parSemaine[l.semaine] = l; });
                const derniere = lignes[lignes.length - 1];
                const cycles = [];
                let prev = lignes[0];
                const finT = Math.max(Date.parse(derniere.semaine + 'T00:00:00Z'), Date.parse(clotureCourante + 'T00:00:00Z'));
                for (let t = Date.parse(lignes[0].semaine + 'T00:00:00Z') + 7 * jourMs; t <= finT; t += 7 * jourMs) {
                    const cle = new Date(t).toISOString().slice(0, 10);
                    const l = parSemaine[cle];
                    if (l) {
                        // autre puissance = mérites repartis à zéro : gain non comparable
                        cycles.push({ semaine: cle, gain: l.puissance === prev.puissance ? Math.max(0, l.merites_total - prev.merites_total) : null });
                        prev = l;
                    } else {
                        cycles.push({ semaine: cle, gain: 0 });
                    }
                }

                const releveMin = Math.max(0, Math.round((Date.now() - Date.parse(derniere.releve_le)) / 60000));
                const ilYa = releveMin < 60 ? releveMin + ' min' : releveMin < 1440 ? Math.floor(releveMin / 60) + ' h' : Math.floor(releveMin / 1440) + ' j';
                const enteteReleve = `<span style="color: #888; font-size: 0.8em; font-weight: normal; letter-spacing: 0;">Dernier relevé : il y a ${ilYa}</span>`;

                if (!cycles.length) {
                    zone.innerHTML = `
                    <div style="border: 1px dashed rgba(0,240,255,0.3); padding: 14px 18px; border-radius: 4px; margin-bottom: 10px;">
                        <div style="color: var(--ed-blue); font-weight: bold; letter-spacing: 2px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px;"><span>MA PROGRESSION</span>${enteteReleve}</div>
                        <div style="color: #888; font-size: 0.85em; line-height: 1.5; margin-top: 8px;">L'historique se construit cycle après cycle : chaque jeudi 07:00 UTC, vos mérites gagnés dans la semaine s'ajoutent ici.</div>
                    </div>`;
                    return;
                }

                const affiches = cycles.slice(-8);
                const gains = affiches.map(c => c.gain).filter(g => g !== null);
                const maxGain = Math.max(1, ...gains);
                const meilleur = gains.length ? Math.max(...gains) : 0;
                const moyenne = gains.length ? Math.round(gains.reduce((a, b) => a + b, 0) / gains.length) : 0;
                const somme = gains.reduce((a, b) => a + b, 0);

                const barres = affiches.map(c => {
                    const enCours = c.semaine === clotureCourante;
                    const hauteur = c.gain ? Math.max(3, Math.round(70 * c.gain / maxGain)) : 2;
                    const couleur = enCours ? 'var(--ed-blue)' : (c.gain && c.gain === meilleur ? '#FFD700' : 'rgba(0,240,255,0.45)');
                    const valeur = c.gain === null ? '?' : (c.gain > 0 ? '+' + fmt(c.gain) : '0');
                    return `
                    <div style="flex: 1; min-width: 54px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 4px;">
                        <span style="color: #ccc; font-size: 0.7em;">${valeur}</span>
                        <div style="width: 100%; max-width: 46px; height: ${hauteur}px; background: ${couleur}; border-radius: 2px 2px 0 0;${enCours ? ' box-shadow: 0 0 8px rgba(0,240,255,0.5);' : ''}"></div>
                        <span style="color: ${enCours ? 'var(--ed-blue)' : '#888'}; font-size: 0.7em; white-space: nowrap;">${enCours ? 'EN COURS' : c.semaine.slice(8, 10) + '/' + c.semaine.slice(5, 7)}</span>
                    </div>`;
                }).join('');

                zone.innerHTML = `
                <div style="border: 1px solid rgba(0,240,255,0.25); background: rgba(0,240,255,0.03); padding: 14px 18px; border-radius: 4px; margin-bottom: 10px;">
                    <div style="color: var(--ed-blue); font-weight: bold; letter-spacing: 2px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px; border-bottom: 1px dashed rgba(0,240,255,0.3); padding-bottom: 8px; margin-bottom: 14px;">
                        <span>MA PROGRESSION</span>${enteteReleve}
                    </div>
                    <div style="display: flex; gap: 6px; align-items: flex-end; min-height: 110px; overflow-x: auto;">${barres}</div>
                    <div style="display: flex; gap: 25px; flex-wrap: wrap; margin-top: 14px; font-size: 0.85em;">
                        <div><span style="color: #888;">MEILLEUR CYCLE :</span> <span style="color: #FFD700; font-weight: bold;">+${fmt(meilleur)}</span></div>
                        <div><span style="color: #888;">MOYENNE PAR CYCLE :</span> <span style="color: #fff; font-weight: bold;">+${fmt(moyenne)}</span></div>
                        <div><span style="color: #888;">TOTAL GAGNÉ (${gains.length} CYCLE${gains.length > 1 ? 'S' : ''}) :</span> <span style="color: #fff; font-weight: bold;">+${fmt(somme)}</span></div>
                    </div>
                </div>`;
            } catch (err) {
                console.error('Erreur progression Powerplay :', err);
                zone.innerHTML = '';
            }
        }

        async function ouvrirSallePowerplay() {
            if (typeof sonClic === 'function') sonClic();
            const modal = document.getElementById('modal-powerplay');
            const titrePuissance = document.getElementById('pp-modal-power-name');
            const countdownEl = document.getElementById('pp-modal-countdown');
            const bodyEl = document.getElementById('pp-modal-body');

            countdownEl.innerText = calculerCompteReboursCycle();

            if (!profilCommandant || !profilCommandant.puissance_nom) {
                titrePuissance.innerText = "COMMANDEMENT POWERPLAY 2.0";
                titrePuissance.style.color = "var(--ed-blue)";
                bodyEl.innerHTML = `
                    <div style="background: rgba(0,0,0,0.5); border: 1px dashed #555; padding: 30px; text-align: center; border-radius: 4px;">
                        <span style="color: var(--ed-orange); font-size: 1.2em; letter-spacing: 2px; font-weight: bold; display: block; margin-bottom: 10px;">AUCUNE ALLÉGEANCE DÉTECTÉE</span>
                        <p style="color: #ccc; font-size: 0.95em; max-width: 600px; margin: 0 auto 20px auto; line-height: 1.6;">
                            Pour accéder aux classements tactiques et coordonner l'effort du cycle, engagez-vous auprès d'une puissance dans le panneau Powerplay en jeu et relancez votre vol.
                        </p>
                    </div>`;
                modal.style.display = 'flex';
                return;
            }

            const maPuissance = profilCommandant.puissance_nom;
            titrePuissance.innerText = maPuissance.toUpperCase();
            bodyEl.innerHTML = '<div style="color: #888; text-align: center; padding: 40px; font-style: italic;">Accréditation des partisans et chiffrement du tableau...</div>';
            modal.style.display = 'flex';

            try {
                // Cloisonnement OPSEC : lecture stricte sur les partisans de la MÊME puissance
                // (fonction serveur : ne renvoie que les colonnes du tableau, triees par merites)
                const { data, error } = await supabaseApp.rpc('tableau_partisans');

                if (error) throw error;

                const partisans = data || [];
                const monScoreCycle = profilCommandant.puissance_merites_cycle || 0;
                const monRang = profilCommandant.puissance_rang || 0;
                const monTotal = profilCommandant.puissance_merites_total || monScoreCycle;

                let html = `
                <!-- CARTE PERSONNELLE DU PILOTE -->
                <div style="background: rgba(0, 240, 255, 0.05); border-left: 3px solid var(--ed-blue); padding: 15px 20px; border-radius: 0 4px 4px 0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <span style="color: #888; font-size: 0.8em; letter-spacing: 1px;">VOTRE STATUT MILITAIRE :</span>
                        <div style="color: #fff; font-size: 1.2em; font-weight: bold; margin-top: 3px;">
                            CMDR ${(profilCommandant.cmdr_nom || 'INCONNU').toUpperCase()} 
                            <span style="color: var(--ed-blue); font-size: 0.85em; margin-left: 10px;">[ RANG ${monRang} ]</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 20px; text-align: right;">
                        <div>
                            <span style="color: #888; font-size: 0.8em; display: block;">MÉRITES DU CYCLE :</span>
                            <span style="color: #FFD700; font-size: 1.3em; font-weight: bold;">${monScoreCycle > 0 ? '+' + new Intl.NumberFormat('fr-FR').format(monScoreCycle) : '—'}</span>
                        </div>
                        <div>
                            <span style="color: #888; font-size: 0.8em; display: block;">CUMUL GLOBAL :</span>
                            <span style="color: #ccc; font-size: 1.3em; font-weight: bold;">${new Intl.NumberFormat('fr-FR').format(monTotal)}</span>
                        </div>
                    </div>
                </div>

                ${monScoreCycle > 0 ? '' : `
                <div style="color: #888; font-size: 0.85em; line-height: 1.5; padding: 0 5px;">
                    Mesure du cycle en cours : vos mérites de la semaine s'affichent dès votre premier relevé après le début du cycle (jeudi 07:00 UTC). Le cumul global et le rang sont déjà à jour.
                </div>`}

                <!-- MA PROGRESSION (chargee apres l'affichage : historique des cycles) -->
                <div id="pp-progression"></div>

                <!-- TABLEAU D'HONNEUR DES PARTISANS -->
                <div style="margin-top: 10px;">
                    <div style="color: var(--ed-blue); font-weight: bold; letter-spacing: 2px; border-bottom: 1px dashed rgba(0, 240, 255, 0.3); padding-bottom: 8px; margin-bottom: 15px; display: flex; justify-content: space-between;">
                        <span>TABLEAU DES PARTISANS DU RÉSEAU (OPSEC CLOISONNÉ)</span>
                        <span>${partisans.length} PILOTE(S) ALIGNÉ(S)</span>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 8px;">`;

                // Tri : mérites du cycle, puis cumul global (tant que le cycle n'est pas mesuré, le cumul départage)
                [...partisans].sort((a, b) =>
                    ((b.puissance_merites_cycle || 0) - (a.puissance_merites_cycle || 0)) ||
                    ((b.puissance_merites_total || 0) - (a.puissance_merites_total || 0))
                ).forEach((p, index) => {
                    const rangNumero = index + 1;
                    const cumulFormat = new Intl.NumberFormat('fr-FR').format(p.puissance_merites_total || 0);
                    const tagSquad = p.escadron_id ? `[ ${p.escadron_id} ]` : `<span style="color: #888;">[ INDÉPENDANT ]</span>`;
                    const meritesFormat = new Intl.NumberFormat('fr-FR').format(p.puissance_merites_cycle || 0);
                    const estMoi = (p.cmdr_nom && profilCommandant.cmdr_nom && p.cmdr_nom.toUpperCase() === profilCommandant.cmdr_nom.toUpperCase());
                    const fondLigne = estMoi ? 'rgba(0, 240, 255, 0.12)' : 'rgba(0,0,0,0.5)';
                    const bordureLigne = estMoi ? 'var(--ed-blue)' : '#333';

                    html += `
                    <div style="background: ${fondLigne}; border: 1px solid ${bordureLigne}; padding: 12px 18px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; font-size: 0.95em;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <span style="color: ${rangNumero <= 3 ? '#FFD700' : '#888'}; font-weight: bold; width: 30px;">#${rangNumero}</span>
                            <span style="color: #fff; font-weight: bold;">CMDR ${(p.cmdr_nom || 'INCONNU').toUpperCase()}</span>
                            <span style="font-size: 0.85em;">${tagSquad}</span>
                            <span style="color: var(--ed-blue); font-size: 0.8em; border: 1px solid rgba(0,240,255,0.4); padding: 1px 6px; border-radius: 2px;">RANG ${p.puissance_rang || 0}</span>
                        </div>
                        <div style="text-align: right;">
                            <div style="color: #FFD700; font-weight: bold; letter-spacing: 1px;">
                                ${(p.puissance_merites_cycle || 0) > 0 ? '+' + meritesFormat : '—'} <span style="font-size: 0.8em; color: #888;">CYCLE</span>
                            </div>
                            <div style="color: #ccc; font-size: 0.8em; margin-top: 2px;">
                                ${cumulFormat} <span style="font-size: 0.85em; color: #888;">CUMUL</span>
                            </div>
                        </div>
                    </div>`;
                });

                html += `</div></div>`;
                bodyEl.innerHTML = html;
                chargerProgressionPowerplay();

            } catch (err) {
                console.error("Erreur Powerplay :", err);
                bodyEl.innerHTML = '<div style="color: #FF3333; text-align: center; padding: 20px;">Échec de la liaison avec le réseau de la puissance.</div>';
            }
        }


    // ---------- point d'entree
    window.carriere = {
        ouvrir: function (quoi) {
            if (typeof sonClic === 'function') sonClic();
            if (typeof hideHoloTooltip === 'function') hideHoloTooltip();
            if (quoi === 'bgs') return ouvrirSalleBgs();
            if (quoi === 'pp') return ouvrirSallePowerplay();
            if (quoi === 'fed') { remplirRangs(); const m = document.getElementById('modal-rangs-fed'); if (m) m.style.display = 'flex'; return; }
            if (quoi === 'aux') { remplirRangs(); const m = document.getElementById('modal-rangs-aux'); if (m) m.style.display = 'flex'; return; }
        }
    };
})();
