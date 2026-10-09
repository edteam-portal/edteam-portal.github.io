// FORGE À RUBANS MILITAIRES (PLAQUES MÉTALLIQUES DE CAMPAGNE) : dessin vectoriel d'un ruban (aucune image, aucune requête).
// Partagée par bgs.html, escadron.html et revelations.js (fenêtre plein écran d'une nouvelle plaque, sur toutes les pages).
(function () {
    'use strict';
        window.forgerRubanSVG = function(typeOrdre, jours, points, rang, tooltipText, onclickAction = '') {
            let bg1, bg2, accent;
            const t = (typeOrdre || '').toUpperCase();
            
            if (t.includes('GUERRE')) { bg1 = '#800000'; bg2 = '#330000'; accent = '#FF3333'; } 
            else if (t.includes('HAUSSE')) { bg1 = '#004D00'; bg2 = '#001A00'; accent = '#33FF33'; } 
            else if (t.includes('BAISSE')) { bg1 = '#993D00'; bg2 = '#4D1F00'; accent = '#FF9933'; } 
            else if (t.includes('ELECTION')) { bg1 = '#002060'; bg2 = '#000A20'; accent = '#00FFFF'; } 
            else { bg1 = '#404040'; bg2 = '#1A1A1A'; accent = '#CCCCCC'; } 

            const randId = Math.random().toString(36).substring(7);

            let nbStripes = Math.min(jours, 10);
            let stripes = '';
            if (nbStripes > 0) {
                let spacing = 100 / (nbStripes + 1);
                for(let i=1; i<=nbStripes; i++) {
                    stripes += `<rect x="${spacing*i - 2}" y="0" width="4" height="28" fill="${accent}" opacity="0.85"/><line x1="${spacing*i - 2}" y1="0" x2="${spacing*i - 2}" y2="28" stroke="#ffffff" stroke-width="1" opacity="0.4"/><line x1="${spacing*i + 2}" y1="0" x2="${spacing*i + 2}" y2="28" stroke="#000000" stroke-width="1" opacity="0.6"/>`;
                }
            }

            let stars = '';
            const drawStar = (cx, cy, gradId, glow, scale=0.65) => `<g transform="translate(${cx}, ${cy}) scale(${scale})"><polygon points="0,-14 4,-4 15,-4 6,3 9,14 0,7 -9,14 -6,3 -15,-4 -4,-4" fill="url(#${gradId})" stroke="#111" stroke-width="1" filter="drop-shadow(0px 2px 2px ${glow})"/></g>`;

            const renderStars = (count, gradId, glow) => {
                if (count === 1) return drawStar(50, 14, gradId, glow, 0.65);
                if (count === 2) return drawStar(40, 14, gradId, glow, 0.6) + drawStar(68, 14, gradId, glow, 0.6);
                if (count === 3) return drawStar(33, 14, gradId, glow, 0.5) + drawStar(56, 14, gradId, glow, 0.5) + drawStar(79, 14, gradId, glow, 0.5);
                return '';
            };

            let starGrads = '';
            if (points >= 10) {
                if (points >= 100) {
                    starGrads = `<linearGradient id="gradDia_${randId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="50%" stop-color="#00FFFF"/><stop offset="100%" stop-color="#008888"/></linearGradient>`;
                    let count = points >= 200 ? 3 : (points >= 150 ? 2 : 1);
                    stars = renderStars(count, `gradDia_${randId}`, 'rgba(0,255,255,1)');
                } else if (points >= 70) {
                    starGrads = `<linearGradient id="gradGold_${randId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFFFCC"/><stop offset="40%" stop-color="#FFD700"/><stop offset="100%" stop-color="#B8860B"/></linearGradient>`;
                    let count = points >= 90 ? 3 : (points >= 80 ? 2 : 1);
                    stars = renderStars(count, `gradGold_${randId}`, 'rgba(255,215,0,0.9)');
                } else if (points >= 40) {
                    starGrads = `<linearGradient id="gradSilv_${randId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="50%" stop-color="#C0C0C0"/><stop offset="100%" stop-color="#808080"/></linearGradient>`;
                    let count = points >= 60 ? 3 : (points >= 50 ? 2 : 1);
                    stars = renderStars(count, `gradSilv_${randId}`, 'rgba(255,255,255,0.8)');
                } else if (points >= 10) {
                    starGrads = `<linearGradient id="gradBro_${randId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFDAB9"/><stop offset="50%" stop-color="#CD7F32"/><stop offset="100%" stop-color="#8B4513"/></linearGradient>`;
                    let count = points >= 30 ? 3 : (points >= 20 ? 2 : 1);
                    stars = renderStars(count, `gradBro_${randId}`, 'rgba(205,127,50,0.8)');
                }
            }

            let frame = ''; let frameGrads = '';
            if (rang === 1) {
                frameGrads = `<linearGradient id="frameDia_${randId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="50%" stop-color="#00FFFF"/><stop offset="100%" stop-color="#008888"/></linearGradient>`;
                frame = `<rect x="1" y="1" width="98" height="26" fill="none" stroke="url(#frameDia_${randId})" stroke-width="2" filter="drop-shadow(0 0 4px #00FFFF)"/>`;
            } else if (rang === 2) {
                frameGrads = `<linearGradient id="frameGold_${randId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFFFCC"/><stop offset="50%" stop-color="#FFD700"/><stop offset="100%" stop-color="#B8860B"/></linearGradient>`;
                frame = `<rect x="1" y="1" width="98" height="26" fill="none" stroke="url(#frameGold_${randId})" stroke-width="2" filter="drop-shadow(0 0 3px #FFD700)"/>`;
            } else if (rang === 3) {
                frameGrads = `<linearGradient id="frameSilv_${randId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="50%" stop-color="#C0C0C0"/><stop offset="100%" stop-color="#808080"/></linearGradient>`;
                frame = `<rect x="1" y="1" width="98" height="26" fill="none" stroke="url(#frameSilv_${randId})" stroke-width="2" filter="drop-shadow(0 0 2px #FFFFFF)"/>`;
            } else {
                frame = `<rect x="1" y="1" width="98" height="26" fill="none" stroke="#555555" stroke-width="2"/>`;
            }

            // Disque de podium (rang 1, 2, 3) dans le coin : le cadre montre la place, le chiffre la confirme
            let podium = '';
            if (rang >= 1 && rang <= 3) {
                const pc = rang === 1 ? '#00FFFF' : (rang === 2 ? '#FFD700' : '#C0C0C0');
                podium = `<circle cx="8" cy="8.5" r="6.2" fill="#050505" stroke="${pc}" stroke-width="1.3"/><text x="8" y="12" text-anchor="middle" font-family="'Share Tech Mono', monospace" font-size="9.5" font-weight="bold" fill="${pc}">${rang}</text>`;
            }

            let clickHandler = onclickAction ? `onclick="${onclickAction}; if(typeof hideHoloTooltip === 'function') hideHoloTooltip();"` : '';

            return `
            <div style="position: relative; cursor: help; transition: 0.1s;" 
                 ${clickHandler}
                 onmouseenter="if(typeof showHoloTooltip === 'function') showHoloTooltip(event, '${tooltipText}', '#fff')" 
                 onmouseleave="if(typeof hideHoloTooltip === 'function') hideHoloTooltip()" 
                 onmousemove="if(typeof moveHoloTooltip === 'function') moveHoloTooltip(event)"
                 onmouseover="this.style.transform='scale(1.15)'; this.style.zIndex='50';"
                 onmouseout="this.style.transform='scale(1)'; this.style.zIndex='1';">
                
                <svg viewBox="0 0 100 28" style="width: 120px; height: 33px; display: block; filter: drop-shadow(1px 2px 2px rgba(0,0,0,0.8));">
                    <defs>
                        <linearGradient id="gradBg_${randId}" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="${bg1}" />
                            <stop offset="100%" stop-color="${bg2}" />
                        </linearGradient>

                        <linearGradient id="metalGlare_${randId}" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.5"/>
                            <stop offset="45%" stop-color="#ffffff" stop-opacity="0.1"/>
                            <stop offset="49%" stop-color="#ffffff" stop-opacity="0.3"/>
                            <stop offset="50%" stop-color="transparent" />
                            <stop offset="100%" stop-color="#000000" stop-opacity="0.4"/>
                        </linearGradient>

                        ${starGrads}
                        ${frameGrads}
                    </defs>
                    
                    <rect x="0" y="0" width="100" height="28" fill="url(#gradBg_${randId})"/>
                    ${stripes}
                    <rect x="0" y="0" width="100" height="28" fill="url(#metalGlare_${randId})" pointer-events="none"/>
                    ${frame}
                    ${stars}
                    ${podium}
                </svg>
            </div>`;
        };
})();
