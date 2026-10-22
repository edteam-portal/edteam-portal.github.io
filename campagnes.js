// CAMPAGNES (page BGS) : affichage des campagnes de l'escadron (une ligne par mission), fenetre de creation/edition (Amiral), choix d'une campagne.
// Donnees : table `campagnes` (script SQL 95) ; les missions viennent de la page (directives BGS ; plus tard Powerplay et colonisation).
// Regles : l'Amiral (ou le Directeur) cree, modifie et cloture une campagne ; l'Amiral et les officiers y ajoutent des missions. Les initiatives de pilotes restent hors campagne.
(function () {
    'use strict';
    var COUL = { ATTAQUE: '#FF3333', DEFENSE: '#00F0FF', MAINTIEN: '#00FF66', CONQUETE: '#EDEDED' };
    var LIB = { ATTAQUE: 'ATTAQUE', DEFENSE: 'DÉFENSE', MAINTIEN: 'MAINTIEN', CONQUETE: 'CONQUÊTE' };
    var AIDE = { ATTAQUE: 'affaiblir un rival (sape Powerplay, baisse d\'influence)', DEFENSE: 'protéger un système menacé', MAINTIEN: 'conserver ce que nous tenons', CONQUETE: 'prendre ou coloniser un nouveau système' };
    var PRIO = { 1: ['CRITIQUE', '#FF3333'], 2: ['HAUTE', '#FF7100'], 3: ['NORMALE', '#00F0FF'] };
    var COUL_BGS = '#FF7100';
    var esc = function (s) { return typeof window.escapeHtml === 'function' ? window.escapeHtml(String(s == null ? '' : s)) : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
    var db = function () { return window.supabaseApp; };
    var moi = function () { return window.profilCommandant || {}; };
    var estAmiral = function () { var m = moi(); return !!(m.est_amiral || m.est_directeur); };
    var estCommandement = function () { var m = moi(); return !!(m.est_amiral || m.est_officier || m.est_directeur); };

    function css() {
        if (document.getElementById('campagnes-css')) return;
        var s = document.createElement('style'); s.id = 'campagnes-css';
        s.textContent = [
            '.camp-titre { display:flex; align-items:baseline; gap:12px; border-bottom:1px dashed rgba(255,51,51,.4); padding:6px 2px 8px; margin:6px 0 10px; color:#FF3333; font-weight:bold; letter-spacing:2px; flex-wrap:wrap; }',
            '.camp-titre small { color:#777; font-size:.78em; letter-spacing:1px; font-weight:normal; }',
            '.camp-carte { padding:14px 20px 8px; }',
            '.camp-pli { background:transparent; border:0; color:#9aa; font-size:1.1em; cursor:pointer; padding:0 4px 0 0; line-height:1; transition:transform .2s; } .camp-pli:hover { color:#fff; } .camp-carte.repliee .camp-pli { transform:rotate(-90deg); }',
            '.camp-carte.repliee .camp-lignes { display:none; } .camp-carte.repliee .camp-tete { margin-bottom:0; }',
            '.camp-tete:hover { filter:brightness(1.15); }',
            '.camp-nom { min-width:0; overflow:hidden; text-overflow:ellipsis; color:#cfd8dc; font-weight:normal; letter-spacing:2px; font-size:.95em; }',
            '.camp-pastille { background:#0b0b0b !important; border:1px solid; padding:2px 9px; border-radius:3px; font-weight:bold; letter-spacing:2px; font-size:.72em; white-space:nowrap; }',
            '.camp-barre { position:relative; height:12px; background:#111; border:1px solid #333; border-radius:2px; overflow:hidden; }',
            '.camp-barre i { display:block; height:100%; }',
            '.camp-barre span { position:absolute; inset:0; font-size:.62em; color:#fff; text-align:center; line-height:12px; letter-spacing:1px; text-shadow:0 0 3px #000; }',
            '.camp-ic { background:transparent; border:1px solid #444; color:#bbb; width:26px; height:26px; padding:0; font-size:.85em; line-height:1; cursor:pointer; border-radius:3px; display:inline-flex; align-items:center; justify-content:center; }',
            '.camp-ic:hover { border-color:#00F0FF; color:#00F0FF; background:rgba(0,240,255,.08); } .camp-ic.rouge:hover { border-color:#FF3333; color:#FF3333; background:rgba(255,51,51,.08); }',
            '.camp-ics { display:inline-flex; gap:4px; }',
            '#modal-edition-mission .cmd-pills { display:flex; gap:8px; flex-wrap:wrap; }',
            '.camp-ligne { position:relative; overflow:hidden; display:grid; grid-template-columns:max-content minmax(0,1fr) auto 20px auto; gap:12px; align-items:center; padding:8px 6px; border-top:1px solid rgba(255,255,255,.22); cursor:pointer; transition:filter .2s; white-space:nowrap; }',
            '.camp-ligne:hover { filter:brightness(1.3); }',
            '.camp-ligne > *, .camp-tete > * { position:relative; z-index:1; }',
            '.camp-ligne > .camp-neon, .camp-tete > .camp-neon { position:absolute; z-index:0; left:0; top:0; bottom:0; pointer-events:none; background:linear-gradient(90deg, color-mix(in srgb, var(--c) 34%, transparent), color-mix(in srgb, var(--c) 14%, transparent)); border-right:2px solid var(--c); box-shadow:inset 0 0 18px color-mix(in srgb, var(--c) 55%, transparent), 0 0 12px var(--c); }',
            '.camp-ligne.conflit { padding-top:12px; padding-bottom:12px; box-shadow:inset 4px 0 0 var(--k), inset 0 0 26px color-mix(in srgb, var(--k) 38%, transparent); outline:1px solid color-mix(in srgb, var(--k) 70%, transparent); outline-offset:-1px; }',
            '.camp-score { font-size:1.7em; font-weight:bold; letter-spacing:2px; color:var(--k); text-shadow:0 0 12px var(--k); line-height:1; }',
            '.camp-type { font-size:1.5em; font-weight:bold; letter-spacing:4px; text-shadow:0 0 12px currentColor; line-height:1; }',
            '.camp-ligne[draggable=true] { cursor:grab; } .camp-tete[draggable=true] { cursor:grab; }',
            '.camp-grip { color:#666; font-size:1.1em; letter-spacing:-3px; user-select:none; padding:0 2px; } .camp-tete:hover .camp-grip { color:#ddd; }',
            '.camp-carte { position:relative; } .camp-carte.glisse { opacity:.45; } .camp-carte.depot { outline:2px dashed #fff; outline-offset:-3px; background:rgba(255,255,255,.04); }',
            '.camp-trait { position:absolute; left:0; right:0; height:4px; background:#fff; box-shadow:0 0 12px #fff; z-index:20; pointer-events:none; } .camp-ligne.glisse { opacity:.35; }',
            '.camp-sys { border-top:1px solid rgba(255,255,255,.22); } .camp-sys > .camp-ligne:first-of-type { border-top:0; }',
            '.camp-sys-t { padding:7px 8px 4px; font-size:.78em; letter-spacing:3px; color:#cfe; background:rgba(255,255,255,.04); } .camp-sys-t span { color:#778; letter-spacing:1px; }',
            '.camp-ligne.veille { opacity:.55; }',
            '.camp-ligne.gris { opacity:.4; filter:grayscale(1); cursor:not-allowed; }',
            '.camp-ligne .txt { display:flex; align-items:center; gap:12px; min-width:0; }',
            '.camp-ligne .txt .nm { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; flex:0 1 auto; }',
            '.camp-ligne .txt b { color:#fff; } .camp-ligne .txt em { color:#888; font-style:normal; }',
            '.camp-ligne .txt b.pct, .camp-tete b.pct { flex:none; font-size:1.35em; letter-spacing:1px; text-shadow:0 0 10px currentColor; }',
            '.camp-tete { position:relative; overflow:hidden; display:flex; align-items:center; gap:12px; margin:0 -10px 6px; padding:6px 16px 6px 10px; border-radius:3px; white-space:nowrap; }',
            '.camp-tete > .camp-neon { border-radius:3px 0 0 3px; }',
            '.camp-avs .dir-avs { margin-left:0; }',
            '.camp-info { display:flex; align-items:center; gap:10px; justify-content:flex-end; white-space:nowrap; font-size:.85em; }',
            '.camp-info .inf { color:#fff; font-weight:bold; }',
            '.qj-c2 { display:inline-flex; justify-content:flex-end; min-width:178px; margin-left:8px; flex:none; }',
            // lignes « resultat » : fond sombre teinte + barre coloree a gauche (au lieu d'un aplat), jauge d'influence avec le mouvement du tick
            '.camp-carte { --wg:200px; --wi:480px; --wa:116px; }',
            '.camp-ligne.rn { grid-template-columns:max-content minmax(0,1fr) var(--wg) var(--wi) 20px var(--wa); border-top:0; margin-bottom:4px; background:linear-gradient(90deg, color-mix(in srgb, var(--k) 15%, #0a0c10), #0a0c10 72%); box-shadow:inset 4px 0 0 var(--k), inset 0 0 0 1px rgba(255,255,255,.05); }',
            '.camp-ligne.rn.pale { background:linear-gradient(90deg, color-mix(in srgb, var(--k) 8%, #0a0c10), #0a0c10 72%); }',
            '.camp-info .ce { display:inline-flex; align-items:center; justify-content:flex-end; gap:10px; width:120px; flex:none; } .camp-info .ca { display:inline-flex; align-items:center; width:150px; flex:none; overflow:hidden; }',
            '.camp-ligne.rn .camp-info { width:var(--wi); justify-content:flex-end; } .camp-ligne.rn .camp-ics, .camp-ligne.al .camp-ics { min-width:var(--wa); justify-content:flex-end; }',
            '.camp-ligne.al { grid-template-columns:max-content minmax(0,1fr) var(--wg) var(--wi) 20px var(--wa); } .camp-ligne.al .al-i { grid-column:3 / 5; min-width:0; justify-content:flex-end; } .al-t { flex:1; min-width:0; display:flex; align-items:center; justify-content:flex-end; gap:10px; overflow:hidden; }',
            '.camp-h-g { width:var(--wg); flex:none; display:flex; } .camp-h-i { width:var(--wi); flex:none; display:flex; justify-content:space-between; align-items:center; } .camp-h-i span small { display:block; margin-top:3px; font-size:1.15em; letter-spacing:1px; color:#678; } .camp-h-i em { font-style:normal; color:#888; font-size:.78em; white-space:nowrap; padding-left:6px; } .camp-h-i span { width:140px; text-align:center; font-size:.62em; letter-spacing:3px; color:#8aa; } .camp-h-c { width:20px; flex:none; }',
            '.cd-act { display:flex; flex-direction:column; align-items:flex-start; gap:5px; } .cd-act small { font-size:.62em; letter-spacing:2px; color:#8aa; white-space:nowrap; }',
            '@media (max-width:1300px) { .camp-carte { --wg:140px; --wi:420px; } .camp-info .ce { width:100px; } .camp-info .ca { width:110px; } }',
            '.camp-ligne.rn .camp-ics, .camp-ligne.al .camp-ics { opacity:.35; transition:opacity .2s; } .camp-ligne.rn:hover .camp-ics, .camp-ligne.al:hover .camp-ics { opacity:1; }',
            '.camp-jg { position:relative; display:block; height:14px; cursor:help; background:#12151b; align-self:center; } .camp-jg > * { position:absolute; top:3px; bottom:3px; display:block; }',
            '.camp-jg i { left:0; background:#6f8196; } .camp-jg b { min-width:3px; } .camp-jg b.h { background:repeating-linear-gradient(135deg, var(--s) 0 3px, color-mix(in srgb, var(--s) 30%, transparent) 3px 6px); border:1px solid var(--s); box-sizing:border-box; } .camp-jg b.m { background:var(--s); box-shadow:0 0 8px var(--s); }',
            '.camp-jg u { top:1px; bottom:1px; width:4px; background-clip:content-box; padding:0 1px; box-sizing:border-box; background:#fff; opacity:.85; }',
            '.camp-vue { display:flex; justify-content:flex-end; align-items:center; gap:0; margin:0 2px 10px; font-size:.8em; color:#9ab; letter-spacing:3px; } .camp-vue > span { margin-right:12px; } .camp-vue > #reperage-bande { margin:0 0 0 22px; }',
            '.camp-vue .camp-btn { font-size:1em; padding:8px 22px; letter-spacing:2px; border-color:#3a4a55; color:#9ab; } .camp-vue .camp-btn + .camp-btn { margin-left:-1px; }',
            '.camp-vue .camp-btn.actif { border-color:#00F0FF; color:#00F0FF; background:rgba(0,240,255,.16); box-shadow:0 0 14px rgba(0,240,255,.35), inset 0 0 10px rgba(0,240,255,.15); position:relative; z-index:1; }',
            '.camp-grille { display:grid; grid-template-columns:repeat(auto-fill, minmax(250px, 1fr)); gap:14px; padding:4px 0 8px; }',
            '.camp-cd { --k:#6f8196; position:relative; padding:14px 14px 10px; cursor:pointer; white-space:normal; background:linear-gradient(160deg, color-mix(in srgb, var(--k) 13%, #0b0d12), #080a0e 65%); border:1px solid color-mix(in srgb, var(--k) 50%, transparent); box-shadow:0 0 14px color-mix(in srgb, var(--k) 16%, transparent); clip-path:polygon(0 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%); transition:transform .2s, box-shadow .2s; }',
            '.camp-cd:hover { transform:translateY(-3px); box-shadow:0 0 22px color-mix(in srgb, var(--k) 35%, transparent); } .camp-cd.pale { background:linear-gradient(160deg, color-mix(in srgb, var(--k) 7%, #0b0d12), #080a0e 65%); }',
            '.camp-cd[draggable=true] { cursor:grab; } .camp-cd.glisse { opacity:.35; } .camp-cd.veille { opacity:.55; } .camp-cd.gris { opacity:.4; filter:grayscale(1); cursor:not-allowed; }',
            '.camp-cd .cd-nm { margin:8px 0 10px; } .camp-cd .cd-nm b { display:block; color:#fff; font-size:1.2em; letter-spacing:3px; } .camp-cd .cd-nm em { display:block; color:#778; font-style:normal; font-size:.72em; letter-spacing:1px; margin-top:2px; }',
            '.camp-cd .cd-info { justify-content:flex-start; flex-wrap:wrap; margin-bottom:8px; } .camp-cd .cd-info .inf { font-size:1.9em; } .camp-cd .cd-info .camp-score { font-size:2.2em; } .camp-cd .qj-c2 { min-width:0; margin-left:0; }',
            '.camp-cd .cd-pied { display:flex; justify-content:space-between; align-items:center; gap:8px; margin-top:12px; min-height:28px; } .camp-cd .camp-ics { opacity:.5; } .camp-cd:hover .camp-ics { opacity:1; }',
            '@media (max-width:900px) { .camp-ligne.rn, .camp-ligne.al { grid-template-columns:max-content minmax(0,1fr) 14px auto; } .camp-ligne.al .al-i { grid-column:auto; } .camp-ligne.rn .camp-jg, .camp-ligne.rn .pp-zb { display:none; } .camp-cd .cd-info { display:flex !important; } .camp-h-g { width:auto; } .camp-h-i { width:auto; } .camp-h-i span, .camp-h-c { display:none; } }',
            '.camp-vide { padding:10px 6px; border-top:1px dashed #2a2a2a; color:#777; font-size:.85em; font-style:italic; }',
            '.camp-btn { background:transparent; border:1px solid #555; color:#bbb; padding:3px 10px; font-family:inherit; font-size:.72em; letter-spacing:1px; cursor:pointer; }',
            '.camp-btn:hover { border-color:#00F0FF; color:#00F0FF; } .camp-btn.rouge:hover { border-color:#FF3333; color:#FF3333; }',
            '.camp-actions { display:flex; gap:6px; margin-left:4px; margin-left:0; width:var(--wa); flex:none; justify-content:flex-end; }',
            '@media (max-width:900px) { .camp-ligne { grid-template-columns:max-content minmax(0,1fr) 14px auto; gap:8px; } .camp-info { display:none !important; } .camp-carte { padding:12px 12px 6px; } }',
            '#modal-campagne .cmd-pills { display:flex; gap:8px; flex-wrap:wrap; }',
            '#btn-campagne-ok { background:rgba(255,51,51,.1); border:1px solid #FF3333; color:#FF3333; padding:12px; width:100%; font-family:"Share Tech Mono",monospace; font-size:1.05em; letter-spacing:3px; cursor:pointer; transition:.2s; text-transform:uppercase; font-weight:bold; }',
            '#btn-campagne-ok:hover { background:#FF3333; color:#000; box-shadow:0 0 20px #FF3333; }',
            '#btn-edm-ok { background:rgba(0,240,255,.1); border:1px solid #00F0FF; color:#00F0FF; padding:12px; width:100%; font-family:"Share Tech Mono",monospace; font-size:1.05em; letter-spacing:3px; cursor:pointer; transition:.2s; text-transform:uppercase; font-weight:bold; }',
            '#btn-edm-ok:hover { background:#00F0FF; color:#000; box-shadow:0 0 20px #00F0FF; }',
            '#modal-choix-campagne .choix-ligne { display:flex; align-items:center; gap:10px; padding:10px 12px; border:1px solid #333; margin-top:8px; cursor:pointer; }',
            '#modal-choix-campagne .choix-ligne:hover { border-color:#00F0FF; background:rgba(0,240,255,.06); }'
        ].join('\n');
        document.head.appendChild(s);
    }

    function pastille(txt, col) { return '<span class="camp-pastille" style="color:' + col + '; border-color:' + col + '; background:' + col + '1a;">' + txt + '</span>'; }
    function barre(pct, col, txt) { pct = Math.max(0, Math.min(100, Number(pct) || 0)); return '<div class="camp-barre"><i style="width:' + pct + '%; background:linear-gradient(90deg,' + col + '55,' + col + ');"></i><span>' + txt + '</span></div>'; }
    function dateCourte(d) { try { var x = new Date(d + 'T12:00:00'); return String(x.getDate()).padStart(2, '0') + '/' + String(x.getMonth() + 1).padStart(2, '0'); } catch (e) { return ''; } }

    // Une ligne par mission. Chaque mission : { tag, couleur, texte (html), pct, barre (texte), veille, clic (js) }
    // bouton d'action en icone (modifier, cloturer, supprimer, ajouter) : titre au survol
    function ic(titre, glyphe, js, rouge) { return '<button type="button" class="camp-ic' + (rouge ? ' rouge' : '') + '" title="' + esc(titre) + '" onclick="event.stopPropagation(); ' + js + '">' + glyphe + '</button>'; }
    // fond d'une ligne ou d'un entete : rempli = effort de l'escadron ; la part du pilote est une lueur neon (element .camp-neon) de la meme couleur
    function fond(col, pct) {
        pct = Math.max(0, Math.min(100, Number(pct) || 0));
        var c = [];
        c.push('linear-gradient(90deg,' + col + '3a 0,' + col + '3a ' + pct + '%, rgba(0,0,0,0) ' + pct + '%)');
        return c.join(', ');
    }
    function neon(col, pct, vous) {
        pct = Math.max(0, Math.min(100, Number(pct) || 0)); vous = Math.max(0, Math.min(pct, Number(vous) || 0));
        return vous > 0 ? '<i class="camp-neon" style="--c:' + col + '; width:' + vous + '%;"></i>' : '';
    }
    // le pourcentage de l'effort de l'escadron, juste apres le nom
    function pctTxt(col, pct, titre) {
        return pct == null ? '' : '<b class="pct" style="color:' + col + ';" title="' + esc(titre || '') + '">' + Math.round(pct) + ' %</b>';
    }
    // avatars des pilotes qui participent (les plus actifs d'abord, sans compteur : on les compte a l'oeil)
    function avatars(liste) {
        var P = window.EDTEAMPhotos;
        if (!P || !liste || !liste.length) return '';
        return '<span class="camp-avs"><span class="dir-avs">' + liste.slice(0, 7).map(function (x) { return P.avatar({ uid: x.u, nom: x.nom, role: 'pilote', taille: 28 }); }).join('') + '</span></span>';
    }
    // jauge d'influence : gris = influence qui n'a pas bouge depuis le dernier tick (ou sur 48 h), plein = gain, raye = perte ; couleur = resultat de la directive ; trait blanc = valeur avant le tick
    function jauge(o, res) {
        var U = window.EdteamUtile;
        if (!U || !res || !res.donnees || res.conflit || res.influence == null) return '';
        var cur = Math.max(0, Math.min(100, Number(res.influence) * 100));
        var vt = U.variation ? U.variation(o, res) : null;
        if (!vt) return '';
        var d = vt.v, prev = Math.max(0, Math.min(100, cur - d)), bas = Math.min(cur, prev);
        var fm = function (v) { return Math.abs(v).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); };
        var fen = vt.pale ? 'sur 48 h' : 'depuis le dernier tick', col = U.COUL[vt.sens] || '#6f8196';
        var tip = function (t) { return ' data-tip="' + esc(t) + '" data-tc="' + col + '"'; };
        var h = '<span class="camp-jg" style="--s:' + col + ';"' + tip('Influence de la faction dans le système : ' + fm(cur) + ' %. Gris = la part qui n\'a pas bougé ' + fen + ', plein = un gain, rayé = une perte.') + '><i style="width:' + bas + '%;"' + tip('Influence inchangée ' + fen + ' : ' + fm(bas) + ' %') + '></i>';
        if (Math.abs(d) >= 0.05) {
            h += '<b class="' + (d > 0 ? 'm' : 'h') + '" style="left:' + bas + '%; width:' + Math.abs(cur - prev) + '%;"' + tip((d > 0 ? 'Influence en hausse de +' : 'Influence en baisse de −') + fm(d) + ' point' + (Math.abs(d) >= 1.95 ? 's' : '') + ' ' + fen) + '></b>'
                + '<u style="left:' + prev + '%;"' + tip('Influence avant ' + (vt.pale ? 'ces 48 h' : 'le dernier tick') + ' : ' + fm(prev) + ' %') + '></u>';
        }
        return h + '</span>';
    }
    function actionsM(m) {
        var a = function (act) { return 'edteamCampagnes.actionMission(\'' + m.domaine + '\',\'' + act + '\',' + m.id + ')'; };
        return estCommandement() && m.domaine ? '<span class="camp-ics">' + ic('Modifier la mission', '✎', a('edit'))
            + ic('Clôturer la mission', '📦', a('close')) + ic('Supprimer la mission', '🗑', a('delete'), true) + '</span>' : '<span></span>';
    }
    function attrM(m) {
        return m.gris ? ' title="' + esc(m.titre || '') + '"' : ' onclick="' + m.clic + '" onmouseenter="if(typeof sonHover===\'function\') sonHover()"' + (m.legendeTitre && !m.sig ? ' title="' + esc(m.legendeTitre) + '"' : '');
    }
    function glisserM(m) { return estAmiral() && m.domaine && !m.gris ? ' draggable="true" data-mdom="' + m.domaine + '" data-mid="' + m.id + '"' : ''; }
    // couleur de resultat d'une mission (vert / rouge / bleu) ; sinon la couleur de sa categorie
    function coulM(m) { return m.sig && window.EdteamUtile ? (window.EdteamUtile.COUL[m.sig.sens] || m.couleur) : m.couleur; }
    // vue en cartes : meme contenu qu'une ligne, en deck
    function carte(m) {
        return '<div class="camp-cd' + (m.sig && m.sig.pale ? ' pale' : '') + (m.veille ? ' veille' : '') + (m.gris ? ' gris' : '') + '"' + glisserM(m) + attrM(m) + ' style="--k:' + coulM(m) + '; --c:' + m.couleur + ';">'
            + pastille(m.tag, coulM(m)) + '<div class="cd-nm">' + m.texte + '</div>'
            + '<div class="camp-info cd-info">' + (m.infoE != null ? m.infoE : (m.info || '')) + '</div>' + (m.jauge || '') + (m.infoP ? '<div class="cd-act"><small>TES ACTIONS · AUJOURD’HUI</small>' + m.infoP + '</div>' : '')
            + '<div class="cd-pied">' + (m.avatars || '<span></span>') + actionsM(m) + '</div></div>';
    }
    // rang d'une carte : la ou l'aide est utile d'abord (rouge, puis inchange, puis sans mesure, puis vert)
    // resultat d'une mission pour la carte : vert (dans le sens voulu), rouge (a contre-sens), bleu (inchange ou pas encore mesure)
    function resCarte(m) {
        if (m.sig) return m.sig.sens;
        if (m.conflit) { var c = String(m.conflit).toLowerCase(); return c === '#2fe07a' ? 'up' : c === '#4da3ff' ? 'fl' : 'dn'; }
        return 'fl';
    }
    function rangCarte(m) { var s = m.sig && m.sig.sens; return s === 'dn' ? 0 : s === 'fl' ? 1 : s === 'up' ? 3 : 2; }
    function ligne(m) {
        // pas de pourcentage par mission : la barre de fond parle d'elle-meme ; son explication passe en infobulle de la ligne
        var attr = attrM(m), actions = actionsM(m), glisser = glisserM(m);
        if (m.sig) return '<div class="camp-ligne rn' + (m.sig.pale ? ' pale' : '') + (m.veille ? ' veille' : '') + (m.gris ? ' gris' : '') + '"' + glisser + attr + ' style="--k:' + coulM(m) + '; --c:' + m.couleur + ';">'
            + pastille(m.tag, coulM(m)) + '<div class="txt"><span class="nm">' + m.texte + '</span></div>'
            + (m.jauge || '<span></span>') + '<div class="camp-info">' + (m.infoE != null ? '<span class="ce">' + m.infoE + '</span><span class="ca">' + (m.avatars || '') + '</span>' + (m.infoP || m.infoM || '<span class="qj-c2"></span>') : (m.info || '') + (m.avatars || '')) + '</div><span style="color:#666;">›</span>' + actions + '</div>';
        return '<div class="camp-ligne al' + (m.veille ? ' veille' : '') + (m.gris ? ' gris' : '') + '"' + glisser + attr + ' style="background:' + (m.fondRes || fond(m.couleur, m.pct)) + '; --c:' + m.couleur + ';">' + neon(m.couleur, m.pct, m.vous)
            + pastille(m.tag, m.couleur) + '<div class="txt"><span class="nm">' + m.texte + '</span></div>'
            + '<div class="camp-info al-i"><span class="al-t">' + (m.infoE != null ? m.infoE : (m.info || '')) + '</span><span class="ca">' + (m.avatars || '') + '</span>' + (m.infoP || m.infoM || '<span class="qj-c2"></span>') + '</div><span style="color:#666;">' + (m.gris ? '🔒' : '›') + '</span>' + actions + '</div>';
    }

    // lignes triées par système : en-tête « ◈ SYSTÈME · n missions » quand un système en a plusieurs
    function groupes(lignes) {
        var out = '', i = 0;
        while (i < lignes.length) {
            var j = i; while (j < lignes.length && lignes[j].sys === lignes[i].sys) j++;
            var lot = lignes.slice(i, j).map(ligne).join('');
            out += (j - i > 1 && lignes[i].sys) ? '<div class="camp-sys"><div class="camp-sys-t">◈ ' + esc(lignes[i].sys) + ' <span>· ' + (j - i) + ' missions</span></div>' + lot + '</div>' : lot;
            i = j;
        }
        return out;
    }

    // Les missions BGS d'une campagne : directives actives (en veille grisees)
    // influence de la faction en %, evolution depuis la directive (fleche), d'apres les releves EDSM ; les etats actifs (guerre, expansion...) ne sont plus sur cette page : ils sont dans la fenetre de la directive
    function infoFaction(o) {
        var R = window.cacheResultatsBgs, res = R && R.dir && R.dir[o.id];
        if (!res || !res.donnees) return '<span style="color:#666;" title="Résultat du jeu : en attente du prochain relevé">—</span>';
        var fm = function (v, signe) { var n = Math.abs(Number(v)).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); return (signe ? (v > 0 ? '+' : v < 0 ? '−' : '') : '') + n; };
        var sens = typeof bgsSens === 'function' ? bgsSens(o, res) : null;
        var coul = ({ up: '#2fe07a', dn: '#ff4d4d', fl: '#8a8a8a', att: '#8a8a8a' })[sens || 'att'];
        var cK = o.type_ordre === 'GUERRE' || o.type_ordre === 'ELECTION' ? couleurConflit(o) : null;
        if (cK && res.conflit) {
            var fc = String(o.faction_cible || '').trim().toLowerCase(), e1 = String(res.conflit.f1 || '').trim().toLowerCase() === fc;
            return '<span class="camp-score" style="--k:' + cK + ';" title="' + (o.type_ordre === 'GUERRE' ? 'Score de la guerre' : 'Score de l élection') + ' (jours gagnés), votre faction en premier">' + (e1 ? res.conflit.s1 : res.conflit.s2) + ' – ' + (e1 ? res.conflit.s2 : res.conflit.s1) + '</span>';
        }
        var h = '<span class="inf" title="Influence actuelle de la faction (relevé EDSM)">' + fm(Number(res.influence) * 100, false) + ' %</span>';
        var vt = window.EdteamUtile && window.EdteamUtile.variation ? window.EdteamUtile.variation(o, res) : null;
        if (vt) coul = ({ up: '#2fe07a', dn: '#ff4d4d', fl: '#8a8a8a' })[vt.sens] || coul;
        if (vt || (res.variation !== null && res.variation !== undefined)) {
            var v = vt ? vt.v : Number(res.variation), fl = Math.abs(v) < 0.05 ? '=' : (v > 0 ? '▲' : '▼');
            h += '<span style="color:' + coul + ';" title="' + (vt ? 'Évolution de l\'influence ' + vt.fen + ' (points)' : 'Évolution de l\'influence depuis la directive (points)') + '">' + fl + (fl === '=' ? '' : ' ' + fm(v, true)) + '</span>';
        }
        if (res.conflit) {
            var f = String(o.faction_cible || '').trim().toLowerCase(), estF1 = String(res.conflit.f1 || '').trim().toLowerCase() === f;
            h += '<span style="color:#ccc;" title="Score du conflit (jours gagnés)">' + (estF1 ? res.conflit.s1 : res.conflit.s2) + '–' + (estF1 ? res.conflit.s2 : res.conflit.s1) + '</span>';
        }
        return h;
    }
    // couleur d'une guerre ou d'une election selon le score du jeu (votre faction en premier) : vert si elle gagne, rouge si elle perd, bleu a egalite ou sans score releve
    function couleurConflit(o) {
        var R = window.cacheResultatsBgs, res = R && R.dir && R.dir[o.id];
        if (!res || !res.donnees || !res.conflit) return '#4DA3FF';
        var fc = String(o.faction_cible || '').trim().toLowerCase(), e1 = String(res.conflit.f1 || '').trim().toLowerCase() === fc;
        var moi = Number(e1 ? res.conflit.s1 : res.conflit.s2), adv = Number(e1 ? res.conflit.s2 : res.conflit.s1);
        return moi > adv ? '#2fe07a' : moi < adv ? '#FF3B3B' : '#4DA3FF';
    }
    // signal de resultat (vert / rouge / bleu, net ou pale) d'une directive BGS ; null sans mesure ou sans suivi du jour
    function sigM(o, mt) {
        if (!mt.jour || !window.EdteamUtile) return null;
        var res = (window.cacheResultatsBgs && window.cacheResultatsBgs.dir || {})[o.id] || null;
        return window.EdteamUtile.signalLigne(o, res, typeof bgsSens === 'function' ? bgsSens : null);
    }
    function missionsBgs(ordres, veilleIds, resume, meta) {
        return ordres.map(function (o) {
            var rs = resume[o.id] || {}; var mt = meta[o.id] || { global: 0 };
            var veille = veilleIds.has(String(o.id));
            var typeFr = { HAUSSE: 'HAUSSE', BAISSE: 'BAISSE', GUERRE: 'GUERRE', ELECTION: 'ÉLECTION' }[o.type_ordre] || String(o.type_ordre || '').toUpperCase();
            return { sys: String(o.systeme_cible || '').toUpperCase(), tag: 'BGS #' + o.id + ' - ' + typeFr, domaine: 'BGS', id: o.id, couleur: COUL_BGS, conflit: (o.type_ordre === 'GUERRE' || o.type_ordre === 'ELECTION' ? couleurConflit(o) : null), veille: veille, pct: mt.jour ? null : (mt.global || 0), vous: mt.jour ? null : mt.vous, sig: sigM(o, mt), jauge: sigM(o, mt) ? jauge(o, ((window.cacheResultatsBgs && window.cacheResultatsBgs.dir || {})[o.id] || null)) : '', fondRes: mt.jour && window.EdteamUtile ? window.EdteamUtile.fondLigne(o, (window.cacheResultatsBgs && window.cacheResultatsBgs.dir || {})[o.id] || null, typeof bgsSens === 'function' ? bgsSens : null) : '', avatars: avatars(rs.pilotes), legendeTitre: mt.jour ? '' : 'Effort de l\'escadron : ' + (mt.global || 0) + ' %. La lueur néon à gauche : votre participation (' + (mt.part || 0) + ' % de l\'effort).',
                clic: "ouvrirDetailResultat('" + o.id + "')", infoE: infoFaction(o), infoP: (mt.jour && window.EdteamQuotas && window.cacheQuotasBgs && window.cacheQuotasBgs[o.id] ? '<span class="qj-c2">' + window.EdteamQuotas.pips(o, window.cacheQuotasBgs[o.id]) + '</span>' : ''),
                info: infoFaction(o) + (mt.jour && window.EdteamQuotas && window.cacheQuotasBgs && window.cacheQuotasBgs[o.id] ? '<span class="qj-c2">' + window.EdteamQuotas.pips(o, window.cacheQuotasBgs[o.id]) + '</span>' : ''),
                texte: '<b>' + esc(String(o.systeme_cible || '').toUpperCase()) + '</b> <em>· ' + esc(String(o.faction_cible || '').toUpperCase()) + (veille ? ' · EN VEILLE' : '') + '</em>' };
        });
    }

    // campagnes repliees (memorise dans ce navigateur, par pilote) : par defaut, tout est deplie
    function clefPli() { return 'edteam_camp_repliees_' + (moi().user_id || ''); }
    function lirePli() { try { var v = JSON.parse(localStorage.getItem(clefPli()) || '[]'); return Array.isArray(v) ? v.map(String) : []; } catch (e) { return []; } }
    function ecrirePli(l) { try { localStorage.setItem(clefPli(), JSON.stringify(l)); } catch (e) { /* stockage indisponible : le repli ne sera pas memorise */ } }
    // Rendu complet de la zone des campagnes
    var dernier = null;
    function vueCourante() { try { var v = localStorage.getItem('edteam_camp_vue'); return v === 'cartes' || v === 'carte' ? v : 'lignes'; } catch (e) { return 'lignes'; } }
    function rendre(opts) {
        dernier = opts;
        var zone = document.getElementById('bgs-campagnes'); if (!zone) return;
        css();
        var camps = (opts.campagnes || []).slice();
        // filet de securite (avant le script SQL 95, ou donnee anormale) : des directives sans campagne connue s'affichent quand meme, dans une campagne « technique »
        var orphelines = (opts.ordres || []).filter(function (o) { return !camps.some(function (c) { return String(c.id) === String(o.campagne_id); }); });
        if (orphelines.length) camps.push({ id: 'sans', nom: 'DIRECTIVES EN COURS', type_campagne: 'MAINTIEN', priorite: Math.min.apply(null, orphelines.map(function (o) { return o.priorite || 3; })), synthetique: true });
        camps.sort(function (a, b) { return (a.priorite - b.priorite) || ((a.position || 0) - (b.position || 0)) || String(a.nom).localeCompare(String(b.nom)); });
        var amiral = estAmiral(), cmd = estCommandement();
        var titre = '';
        if (!camps.length) {
            zone.innerHTML = titre + '<div class="bloc" style="padding:24px; text-align:center; color:#9aa; line-height:1.7;">Aucune campagne en cours.<br><b style="color:var(--ed-orange);">Continue d\'agir pour ta faction : tout compte pour ton rang BGS.</b>'
                + (amiral ? '<br><span style="font-size:.85em; color:#777;">Lancez une campagne avec le bouton « + NOUVELLE CAMPAGNE » en haut de la page : les missions s\'y rangent.</span>' : '<br><span style="font-size:.85em; color:#777;">Quand l\'Amiral lancera une campagne, ses missions apparaîtront ici.</span>') + '</div>';
            return;
        }
        var repliees = lirePli();
        // bande « Aujourd'hui » : quotas du jour faits et directives a traiter en premier (quotas-jour.js, SQL 110) ; vide si la fonction serveur est absente
        var mapC = {}; camps.forEach(function (c) { mapC[c.id] = c; });
        var bande = window.EdteamUtile && window.cacheQuotasBgs && typeof bgsSens === 'function' ? window.EdteamUtile.legende() : '';
        var vue = vueCourante();
        var bascule = '<div class="camp-vue"><span>AFFICHAGE</span><button type="button" class="camp-btn' + (vue === 'lignes' ? ' actif' : '') + '" onclick="edteamCampagnes.vue(&quot;lignes&quot;)">☰ LIGNES</button><button type="button" class="camp-btn' + (vue === 'cartes' ? ' actif' : '') + '" onclick="edteamCampagnes.vue(&quot;cartes&quot;)">▦ CARTES</button><button type="button" class="camp-btn' + (vue === 'carte' ? ' actif' : '') + '" onclick="edteamCampagnes.vue(&quot;carte&quot;)">◉ CARTE GALACTIQUE</button><span id="reperage-bande"></span></div>';
        var datCarte = [];
        var htmlCamps = camps.map(function (c) {
            var col = COUL[c.type_campagne] || '#aaa', pr = PRIO[c.priorite] || PRIO[3];
            var ordres = c.synthetique ? orphelines : (opts.ordres || []).filter(function (o) { return String(o.campagne_id) === String(c.id); });
            var lignes = missionsBgs(ordres, opts.veilleIds || new Set(), opts.resume || {}, opts.meta || {});
            if (window.edteamCampagnesPP && !c.synthetique) lignes = lignes.concat(window.edteamCampagnesPP.lignes(c.id));
            if (window.edteamCampagnesCOL && !c.synthetique) lignes = lignes.concat(window.edteamCampagnesCOL.lignes(c.id));
            // tri alphabétique par système (puis par type, stable) ; un système qui a plusieurs missions est regroupé sous un en-tête
            lignes = lignes.map(function (l, i) { l.o = i; return l; }).sort(function (a, b) { return String(a.sys || '').localeCompare(String(b.sys || ''), 'fr') || (a.o - b.o); });
            // donnees de la carte galactique (carte-campagnes.js) : missions actives avec un systeme, resultat du dernier tick
            datCarte.push({ id: c.id, nom: c.nom, type: LIB[c.type_campagne] || c.type_campagne, couleur: col, prio: c.priorite, lignes: lignes.filter(function (l) { return !l.gris && l.sys; }).map(function (l) { return { sys: l.sys, domaine: l.domaine, id: l.id, tag: l.tag, res: resCarte(l), clic: l.clic, carte: carte(l) }; }) });
            var mesurees = lignes.filter(function (l) { return l.pct != null; });
            var av = mesurees.length ? Math.round(mesurees.reduce(function (s, l) { return s + (Number(l.pct) || 0); }, 0) / mesurees.length) : 0;
            var avous = lignes.filter(function (l) { return l.vous != null && l.pct != null; });
            var vAv = avous.length ? Math.round(avous.reduce(function (s, l) { return s + (Number(l.vous) || 0); }, 0) / mesurees.length) : 0;
            var sansPct = ordres.some(function (o) { return ((opts.meta || {})[o.id] || {}).jour; });
            var info = c.echeance ? '⏳ jusqu\'au ' + dateCourte(c.echeance) : '';
            var bulle = '';
            if (c.briefing) {
                var sb = String(c.briefing).replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '<br>');
                bulle = ' <span style="cursor:help;" onmouseenter="if(typeof showHoloTooltip===\'function\') showHoloTooltip(event, \'<div style=\\\'white-space: normal; max-width: 400px; line-height: 1.5;\\\'><strong style=\\\'color: ' + col + ';\\\'>&gt; TRANSMISSION SÉCURISÉE</strong><br><br><span style=\\\'color: #ccc; font-style: italic;\\\'>&quot;' + sb + '&quot;</span></div>\', \'' + col + '\')" onmouseleave="if(typeof hideHoloTooltip===\'function\') hideHoloTooltip()" onmousemove="if(typeof moveHoloTooltip===\'function\') moveHoloTooltip(event)">💬</span>';
            }
            var actions = c.synthetique ? '' : '<span class="camp-ics">' + (cmd ? ic('Ajouter une mission à cette campagne', '＋', 'edteamCampagnes.ajouter(' + c.id + ')') : '')
                + (amiral ? ic('Modifier la campagne', '✎', 'edteamCampagnes.ouvrir(' + c.id + ')') + ic('Clôturer la campagne et ses missions', '📦', 'edteamCampagnes.cloturer(' + c.id + ')') + ic('Supprimer la campagne (seulement si elle est vide)', '🗑', 'edteamCampagnes.supprimer(' + c.id + ')', true) : '') + '</span>';
            return '<div class="bloc camp-carte' + (repliees.indexOf(String(c.id)) >= 0 ? ' repliee' : '') + '" id="camp-' + c.id + '" style="--wa:' + (cmd ? '116px' : '0px') + '; --bdc:' + col + 'bf; --accent:' + col + '; --teinte:' + col + '12; --lueur:' + col + '14; border:1px solid ' + col + '99; box-shadow: inset 4px 0 0 ' + col + ', 0 0 18px ' + col + '18;">'
                + '<div class="camp-tete"' + (amiral && !c.synthetique ? ' draggable="true" data-cid="' + c.id + '"' : '') + ' onclick="edteamCampagnes.basculer(\'' + c.id + '\')" style="cursor:pointer; background:' + (sansPct ? 'none' : fond(col, av)) + '; --c:' + col + ';">' + (sansPct ? '' : neon(col, av, vAv)) + (amiral && !c.synthetique ? '<span class="camp-grip" title="Glisser pour réorganiser les campagnes">⋮⋮</span>' : '') + '<button type="button" class="camp-pli" title="Replier / déplier la campagne" >▾</button>' + '<span class="camp-type" style="color:' + col + ';">' + (LIB[c.type_campagne] || esc(c.type_campagne)) + '</span><span class="camp-nom">' + esc(c.nom) + bulle + '</span>' + pctTxt(col, mesurees.length && !sansPct ? av : null, 'Moyenne des missions de la campagne. La lueur néon à gauche : votre participation.') + '<span style="flex:1;"></span>'
                + '<span class="camp-h-g">' + pastille('PRIORITÉ ' + pr[0], pr[1]) + '</span>'
                + '<span class="camp-h-i"><em>' + info + '</em>' + (vue !== 'cartes' && lignes.some(function (l) { return l.infoP; }) ? '<span>TES ACTIONS<small>Aujourd’hui</small></span>' : '') + '</span><span class="camp-h-c"></span>'
                + '<span class="camp-actions">' + actions + '</span></div>'
                + '<div class="camp-lignes">' + (lignes.length ? (vue === 'cartes' ? '<div class="camp-grille">' + lignes.slice().sort(function (a, b) { return rangCarte(a) - rangCarte(b) || a.o - b.o; }).map(carte).join('') + '</div>' : groupes(lignes)) : '<div class="camp-vide">Aucune mission dans cette campagne' + (cmd ? ' : utilisez le bouton ＋ de la campagne.' : ' pour le moment.') + '</div>') + '</div>'
                + '</div>';
        }).join('');
        zone.innerHTML = titre + bascule + bande + (vue === 'carte' ? '<div id="camp-carte"></div>' : '<div style="display:grid; gap:12px; grid-template-columns:minmax(0,1fr);">' + htmlCamps + '</div>');
        // couleur de chaque systeme de directive (meme logique que la carte : rouge a contre-sens, bleu inchange, vert dans le sens voulu), reprise par le bandeau de reperage
        var resDir = {}; datCarte.forEach(function (cp) { cp.lignes.forEach(function (l) { var k = String(l.sys || '').toUpperCase(), r = l.res || 'fl', o = resDir[k]; if (!o || r === 'dn' || (r === 'fl' && o === 'up')) resDir[k] = r; }); }); window.__edtResDirectives = resDir;
        if (vue === 'carte' && window.EdteamCarteCampagnes) window.EdteamCarteCampagnes.monter(document.getElementById('camp-carte'), { campagnes: datCarte });
        brancherGlisser(zone);
        brancherInfobulles(zone);
        reperage();
    }
    // bandeau « Renseignement » (mission de reperage, script SQL 121) : visible de tous les pilotes d'un escadron, charge a la demande (reperage.js)
    function reperage() {
        var el = document.getElementById('reperage-bande'); if (!el) return;
        var esc = String(moi().escadron_id || '').trim().toUpperCase();
        if (!esc || esc === 'INDEPENDANT') { el.remove(); return; }
        if (window.EdteamReperage) { window.EdteamReperage.monter(el); return; }
        if (window.__reperageCharge) return; window.__reperageCharge = true;
        var sc = document.createElement('script'); sc.src = 'reperage.js?v=26';
        sc.onload = function () { var e2 = document.getElementById('reperage-bande'); if (e2 && window.EdteamReperage) window.EdteamReperage.monter(e2); };
        sc.onerror = function () { window.__reperageCharge = false; };
        document.head.appendChild(sc);
    }
    // plusieurs lignes : la premiere sert de titre
    function texteBulle(t, col) {
        var l = String(t).split('\n');
        return '<div style="white-space:normal; max-width:320px; line-height:1.5; color:#ddd;">' + (l.length > 1 ? '<strong style="color:' + col + ';">' + esc(l[0]) + '</strong><br>' + l.slice(1).map(esc).join('<br>') : esc(l[0])) + '</div>';
    }
    function brancherInfobulles(zone) {
        if (zone.dataset.tips) return;
        zone.dataset.tips = '1';
        var vers = function (ev) { var e = ev.target.closest && ev.target.closest('[data-tip]'); return e && zone.contains(e) ? e : null; };
        zone.addEventListener('mouseover', function (ev) { var e = vers(ev); if (e && typeof showHoloTooltip === 'function') showHoloTooltip(ev, texteBulle(e.dataset.tip, e.dataset.tc || '#00F0FF'), e.dataset.tc || '#00F0FF'); });
        zone.addEventListener('mousemove', function (ev) { if (vers(ev)) { if (typeof moveHoloTooltip === 'function') moveHoloTooltip(ev); } else if (!(ev.target.closest && ev.target.closest('.cc-svg')) && typeof hideHoloTooltip === 'function') hideHoloTooltip(); });   // plus de bulle oubliee quand la souris n'est plus sur un element expliqué (la carte galactique gère la sienne)
        zone.addEventListener('mouseout', function (ev) { if (vers(ev) && typeof hideHoloTooltip === 'function') hideHoloTooltip(); });
    }

    // ===== GLISSER-DEPOSER (Amiral) : une mission d'une campagne a l'autre ; une campagne a une autre place =====
    var glisse = null;
    function nettoyerGlisse() {
        glisse = null;
        document.querySelectorAll('.camp-carte.depot, .camp-carte.glisse, .camp-ligne.glisse, .camp-cd.glisse').forEach(function (e) { e.classList.remove('depot', 'glisse'); });
        document.querySelectorAll('.camp-trait').forEach(function (e) { e.remove(); });
    }
    function brancherGlisser(zone) {
        if (zone.dataset.glisser) return;
        zone.dataset.glisser = '1';
        zone.addEventListener('dragstart', function (ev) {
            if (!estAmiral()) return;
            var l = ev.target.closest && ev.target.closest('.camp-ligne[data-mid], .camp-cd[data-mid]');
            var t = ev.target.closest && ev.target.closest('.camp-tete[data-cid]');
            var carte = ev.target.closest && ev.target.closest('.camp-carte');
            if (l) { glisse = { type: 'M', dom: l.dataset.mdom, id: l.dataset.mid, de: carte ? carte.id.replace('camp-', '') : null }; l.classList.add('glisse'); }
            else if (t) { glisse = { type: 'C', id: t.dataset.cid }; if (carte) carte.classList.add('glisse'); }
            else return;
            try { ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', JSON.stringify(glisse)); } catch (e) { /* navigateur sans dataTransfer */ }
        });
        zone.addEventListener('dragover', function (ev) {
            if (!glisse) return;
            var carte = ev.target.closest && ev.target.closest('.camp-carte'); if (!carte) return;
            var cid = carte.id.replace('camp-', '');
            document.querySelectorAll('.camp-carte.depot').forEach(function (e) { if (e !== carte) e.classList.remove('depot'); });
            document.querySelectorAll('.camp-trait').forEach(function (e) { e.remove(); });
            if (glisse.type === 'M') {
                if (cid === 'sans' || String(cid) === String(glisse.de)) return;
                ev.preventDefault(); carte.classList.add('depot');
            } else {
                if (cid === 'sans' || String(cid) === String(glisse.id)) return;
                ev.preventDefault();
                var r = carte.getBoundingClientRect(), avant = ev.clientY < r.top + r.height / 2;
                var tr = document.createElement('div'); tr.className = 'camp-trait'; tr.style[avant ? 'top' : 'bottom'] = '0'; carte.appendChild(tr);
                carte.dataset.pos = avant ? 'avant' : 'apres';
            }
        });
        zone.addEventListener('drop', async function (ev) {
            if (!glisse) return;
            var carte = ev.target.closest && ev.target.closest('.camp-carte'); if (!carte) { nettoyerGlisse(); return; }
            ev.preventDefault();
            var cible = carte.id.replace('camp-', ''), g = glisse, avant = carte.dataset.pos === 'avant';
            nettoyerGlisse();
            if (cible === 'sans') return;
            if (g.type === 'M') {
                if (String(cible) === String(g.de)) return;
                var r1 = await db().rpc('deplacer_mission', { p_domaine: g.dom, p_id: Number(g.id), p_campagne_id: Number(cible) });
                if (r1.error) { console.error(r1.error); alert(r1.error.message || 'Déplacement impossible (le script SQL 102 est-il lancé ?).'); return; }
                if (typeof sonSucces === 'function') sonSucces();
            } else {
                if (String(cible) === String(g.id)) return;
                var cartes = Array.prototype.map.call(document.querySelectorAll('#bgs-campagnes .camp-carte'), function (e) { return e.id.replace('camp-', ''); }).filter(function (x) { return x !== 'sans' && String(x) !== String(g.id); });
                var i = cartes.indexOf(String(cible)); if (i < 0) return;
                var apres = avant ? (i > 0 ? cartes[i - 1] : null) : cartes[i];
                var r2 = await db().rpc('deplacer_campagne', { p_id: Number(g.id), p_apres_id: apres == null ? null : Number(apres) });
                if (r2.error) { console.error(r2.error); alert(r2.error.message || 'Déplacement impossible (le script SQL 102 est-il lancé ?).'); return; }
                if (typeof sonSucces === 'function') sonSucces();
            }
            await window.edteamCampagnes.rafraichir();
        });
        zone.addEventListener('dragend', nettoyerGlisse);
    }

    // ===== FENETRE DE CREATION / EDITION D'UNE CAMPAGNE (Amiral) =====
    var campEdition = null, typeChoisi = 'ATTAQUE', prioChoisie = 3;
    function injecterModales() {
        if (document.getElementById('modal-campagne')) return;
        var d = document.createElement('div');
        d.innerHTML =
            '<div class="modal-overlay" id="modal-campagne" onclick="fermerModal(\'modal-campagne\', event)" style="z-index:5200;">'
            + '<div class="modal-content ini-fenetre" onclick="event.stopPropagation()" style="max-width:640px; width:95%;">'
            + '<div class="modal-close" onclick="fermerModal(\'modal-campagne\')">X</div>'
            + '<div class="cmd-entete"><div class="cmd-titre" id="camp-titre">&gt; NOUVELLE CAMPAGNE</div><div class="cmd-sous">Un objectif d\'ensemble : les directives (et bientôt les missions Powerplay et de colonisation) s\'y rangent.</div></div>'
            + '<div class="cmd-col">'
            + '<div class="cmd-etape"><div class="cmd-etape-titre"><span class="cmd-num">1</span>NOM</div><input type="text" id="camp-nom" class="search-input cmd-champ" maxlength="60" placeholder="Ex : OPÉRATION AMATERASU" autocomplete="off" data-lpignore="true" style="text-transform:uppercase;"></div>'
            + '<div class="cmd-etape"><div class="cmd-etape-titre"><span class="cmd-num">2</span>TYPE</div><div class="cmd-pills" id="camp-types"></div><div class="cmd-aide" id="camp-type-aide"></div></div>'
            + '<div class="cmd-etape"><div class="cmd-etape-titre"><span class="cmd-num">3</span>PRIORITÉ</div><div class="cmd-pills" id="camp-prios"></div></div>'
            + '<div class="cmd-etape"><div class="cmd-etape-titre"><span class="cmd-num">4</span>ÉCHÉANCE <em>facultatif</em></div><input type="date" id="camp-echeance" class="search-input cmd-champ"></div>'
            + '<div class="cmd-etape"><div class="cmd-etape-titre"><span class="cmd-num">5</span>BRIEFING <em>facultatif</em></div><textarea id="camp-briefing" class="search-input cmd-champ" placeholder="Contexte et consignes pour toute la campagne…" autocomplete="off" style="height:74px; resize:vertical;"></textarea></div>'
            + '<div class="cmd-aide" id="camp-erreur" style="color:#FF3333;"></div>'
            + '</div><div class="cmd-pied"><button id="btn-campagne-ok" onclick="edteamCampagnes.enregistrer()" onmouseenter="if(typeof sonHover===\'function\') sonHover()">ENREGISTRER LA CAMPAGNE</button></div></div></div>'
            + '<div class="modal-overlay" id="modal-choix-campagne" onclick="fermerModal(\'modal-choix-campagne\', event)" style="z-index:5300;">'
            + '<div class="modal-content ini-fenetre" onclick="event.stopPropagation()" style="max-width:520px; width:95%;">'
            + '<div class="modal-close" onclick="fermerModal(\'modal-choix-campagne\')">X</div>'
            + '<div class="cmd-entete"><div class="cmd-titre" id="choix-titre">&gt; DANS QUELLE CAMPAGNE ?</div><div class="cmd-sous" id="choix-sous"></div></div>'
            + '<div class="cmd-col" id="choix-liste"></div></div></div>'
            + '<div class="modal-overlay" id="modal-edition-mission" onclick="fermerModal(\'modal-edition-mission\', event)" style="z-index:5200;">'
            + '<div class="modal-content ini-fenetre" onclick="event.stopPropagation()" style="max-width:560px; width:95%;">'
            + '<div class="modal-close" onclick="fermerModal(\'modal-edition-mission\')">X</div>'
            + '<div class="cmd-entete"><div class="cmd-titre" id="edm-titre">&gt; MODIFIER LA MISSION</div><div class="cmd-sous" id="edm-sous"></div></div>'
            + '<div class="cmd-col"><div class="cmd-etape" id="edm-bloc-type"><div class="cmd-etape-titre">TYPE</div><div class="cmd-pills" id="edm-types"></div></div>'
            + '<div class="cmd-etape"><div class="cmd-etape-titre">CONSIGNE <em>facultatif</em></div><textarea id="edm-briefing" class="search-input cmd-champ" maxlength="400" autocomplete="off" style="height:84px; resize:vertical;"></textarea></div>'
            + '<div class="cmd-etape" id="edm-bloc-plafond" style="display:none;"><div class="cmd-etape-titre">PLAFOND DE CP <em>facultatif</em></div><input type="number" id="edm-plafond" class="search-input cmd-champ" min="1" max="10000000" step="1" placeholder="Ex : 2000" autocomplete="off" style="max-width:220px;"><div class="cmd-aide">Objectif en CP estimés (mérites ÷ 4) : la barre de la mission se remplit jusqu\'à ce plafond. Vide : pas de plafond.</div></div>'
            + '<div class="cmd-aide" id="edm-erreur" style="color:#FF3333;"></div></div>'
            + '<div class="cmd-pied"><button id="btn-edm-ok" onclick="edteamCampagnes.enregistrerEdition()">ENREGISTRER</button></div></div></div>';
        while (d.firstChild) document.body.appendChild(d.firstChild);
    }
    var edition = null, editionType = null;
    function dessinerEdition() {
        var z = document.getElementById('edm-types'); if (!z) return;
        var t = edition && edition.types ? edition.types : {};
        z.innerHTML = Object.keys(t).map(function (k) { return '<button type="button" class="cmd-pill' + (k === editionType ? ' actif' : '') + '" style="--pc:' + t[k][1] + ';" onclick="edteamCampagnes.choisirEdition(\'' + k + '\')">' + esc(t[k][0]).toUpperCase() + '</button>'; }).join('');
    }
    function dessinerChoix() {
        var t = document.getElementById('camp-types'), p = document.getElementById('camp-prios'); if (!t || !p) return;
        t.innerHTML = Object.keys(LIB).map(function (k) { return '<button type="button" class="cmd-pill' + (k === typeChoisi ? ' actif' : '') + '" style="--pc:' + COUL[k] + ';" onclick="edteamCampagnes.choisir(\'type\',\'' + k + '\')">' + LIB[k] + '</button>'; }).join('');
        p.innerHTML = [1, 2, 3].map(function (k) { return '<button type="button" class="cmd-pill' + (k === prioChoisie ? ' actif' : '') + '" style="--pc:' + PRIO[k][1] + ';" onclick="edteamCampagnes.choisir(\'prio\',' + k + ')">' + PRIO[k][0] + '</button>'; }).join('');
        var a = document.getElementById('camp-type-aide'); if (a) a.textContent = AIDE[typeChoisi] || '';
    }

    window.edteamCampagnes = {
        rendre: rendre,
        avatars: avatars,
        COUL: COUL, LIB: LIB, PRIO: PRIO,
        lire: async function () {
            var esc0 = moi().escadron_id; if (!esc0) return [];
            var r = await db().from('campagnes').select('*').eq('escadron_id', esc0).eq('statut', 'ACTIVE').order('priorite').order('nom');
            if (r.error) { console.error('Erreur campagnes :', r.error.message); return []; }
            return r.data || [];
        },
        choisir: function (genre, v) { if (typeof sonClic === 'function') sonClic(); if (genre === 'type') typeChoisi = v; else prioChoisie = v; dessinerChoix(); },
        ouvrir: function (id) {
            if (typeof sonClic === 'function') sonClic();
            injecterModales(); css();
            var c = id ? (window.cacheCampagnes || []).find(function (x) { return String(x.id) === String(id); }) : null;
            campEdition = c ? c.id : null;
            typeChoisi = c ? c.type_campagne : 'ATTAQUE'; prioChoisie = c ? c.priorite : 3;
            document.getElementById('camp-titre').innerHTML = c ? '&gt; MODIFIER LA CAMPAGNE' : '&gt; NOUVELLE CAMPAGNE';
            document.getElementById('camp-nom').value = c ? c.nom : '';
            document.getElementById('camp-echeance').value = c && c.echeance ? c.echeance : '';
            document.getElementById('camp-briefing').value = c && c.briefing ? c.briefing : '';
            document.getElementById('camp-erreur').textContent = '';
            document.getElementById('btn-campagne-ok').innerText = c ? 'ENREGISTRER LES MODIFICATIONS' : 'LANCER LA CAMPAGNE';
            dessinerChoix();
            if (typeof ouvrirModal === 'function') ouvrirModal('modal-campagne'); else document.getElementById('modal-campagne').style.display = 'flex';
        },
        enregistrer: async function () {
            if (typeof sonClic === 'function') sonClic();
            var btn = document.getElementById('btn-campagne-ok'), err = document.getElementById('camp-erreur');
            var nom = document.getElementById('camp-nom').value.trim().toUpperCase();
            if (nom.length < 2) { err.textContent = 'Donnez un nom à la campagne (2 caractères au moins).'; return; }
            var ech = document.getElementById('camp-echeance').value || null, brief = document.getElementById('camp-briefing').value.trim() || null;
            btn.style.pointerEvents = 'none'; var ancien = btn.innerText; btn.innerText = 'TRANSMISSION…';
            var r = campEdition
                ? await db().rpc('modifier_campagne', { p_id: Number(campEdition), p_nom: nom, p_type: typeChoisi, p_priorite: prioChoisie, p_briefing: brief, p_echeance: ech })
                : await db().rpc('creer_campagne', { p_nom: nom, p_type: typeChoisi, p_priorite: prioChoisie, p_briefing: brief, p_echeance: ech });
            btn.style.pointerEvents = 'auto';
            if (r.error) { console.error(r.error); err.textContent = r.error.message || 'Échec.'; btn.innerText = ancien; return; }
            if (typeof sonSucces === 'function') sonSucces();
            btn.innerText = ancien;
            fermerModal('modal-campagne');
            await this.rafraichir();
        },
        cloturer: async function (id) {
            var c = (window.cacheCampagnes || []).find(function (x) { return String(x.id) === String(id); }); if (!c) return;
            var n = (window.cacheOrdresBgs || []).filter(function (o) { return String(o.campagne_id) === String(id); }).length;
            var ok = await demanderConfirmation('📦 CLÔTURER LA CAMPAGNE « ' + esc(c.nom) + ' » ?', 'Ses <strong>' + n + ' mission' + (n > 1 ? 's' : '') + '</strong> seront clôturées avec elle (plaques de campagne attribuées). Elles disparaîtront des terminaux des pilotes mais resteront dans le journal.', '#00F0FF');
            if (!ok) return;
            var r = await db().rpc('cloturer_campagne', { p_id: Number(id) });
            if (r.error) { console.error(r.error); alert(r.error.message || 'Échec de la clôture.'); return; }
            if (typeof sonSucces === 'function') sonSucces();
            await this.rafraichir();
        },
        // replier / deplier une campagne
        basculer: function (id) {
            var el = document.getElementById('camp-' + id); if (!el) return;
            if (typeof sonClic === 'function') sonClic();
            var l = lirePli(), i = l.indexOf(String(id));
            if (i >= 0) l.splice(i, 1); else l.push(String(id));
            el.classList.toggle('repliee', i < 0);
            ecrirePli(l);
        },
        // supprimer une campagne VIDE (Amiral) : sinon, la cloturer
        supprimer: async function (id) {
            var c = (window.cacheCampagnes || []).find(function (x) { return String(x.id) === String(id); }); if (!c) return;
            var ok = await demanderConfirmation('🗑 SUPPRIMER LA CAMPAGNE « ' + esc(c.nom) + ' » ?', 'Une campagne ne se supprime que si elle ne contient (et n\'a jamais contenu) aucune mission. Sinon, <strong>clôturez-la</strong> : ses missions seront archivées.', '#FF3333');
            if (!ok) return;
            var r = await db().rpc('supprimer_campagne', { p_id: Number(id) });
            if (r.error) { console.error(r.error); alert(r.error.message || 'Échec de la suppression.'); return; }
            if (typeof sonSucces === 'function') sonSucces();
            await this.rafraichir();
        },
        // actions d'une ligne de mission (icones) : modifier, cloturer, supprimer ; le domaine dit quelle logique appliquer
        actionMission: function (domaine, act, id) {
            if (typeof sonClic === 'function') sonClic();
            var cible = domaine === 'PP' ? window.edteamCampagnesPP : domaine === 'COL' ? window.edteamCampagnesCOL : null;
            if (domaine === 'BGS') {
                if (act === 'edit') return window.ouvrirEditionOrdre(id);
                if (act === 'close') return window.cloturerOrdre(String(id));
                if (act === 'delete') return window.supprimerOrdre(String(id));
            } else if (cible) {
                if (act === 'edit') return cible.editer(id);
                if (act === 'close') return cible.cloturer(id, false);
                if (act === 'delete') return cible.supprimer(id);
            }
        },
        // petite fenetre de modification d'une mission Powerplay (type + consigne) ou de colonisation (consigne) : opts = { titre, sous, types: {CLE: [libelle, couleur]} | null, type, briefing, enregistrer(type, briefing) -> erreur ou null }
        ouvrirEditionMission: function (opts) {
            injecterModales(); css();
            edition = opts; editionType = opts.type || null;
            document.getElementById('edm-titre').innerHTML = '&gt; ' + esc(opts.titre);
            document.getElementById('edm-sous').textContent = opts.sous || '';
            document.getElementById('edm-bloc-type').style.display = opts.types ? '' : 'none';
            document.getElementById('edm-briefing').value = opts.briefing || '';
            document.getElementById('edm-bloc-plafond').style.display = opts.plafondActif ? '' : 'none';
            document.getElementById('edm-plafond').value = opts.plafondActif && opts.plafond ? opts.plafond : '';
            document.getElementById('edm-erreur').textContent = '';
            dessinerEdition();
            if (typeof ouvrirModal === 'function') ouvrirModal('modal-edition-mission'); else document.getElementById('modal-edition-mission').style.display = 'flex';
        },
        choisirEdition: function (k) { if (typeof sonClic === 'function') sonClic(); editionType = k; dessinerEdition(); },
        enregistrerEdition: async function () {
            if (!edition) return;
            var btn = document.getElementById('btn-edm-ok'), err = document.getElementById('edm-erreur');
            btn.style.pointerEvents = 'none';
            var pf = null; if (edition.plafondActif) { var vp = document.getElementById('edm-plafond').value.trim(); pf = vp === '' ? null : Math.round(Number(vp)); if (pf !== null && (!(pf >= 1) || pf > 10000000)) { btn.style.pointerEvents = 'auto'; err.textContent = 'Le plafond doit être compris entre 1 et 10 000 000 (ou vide).'; return; } }
            var msg = await edition.enregistrer(editionType, document.getElementById('edm-briefing').value.trim(), pf);
            btn.style.pointerEvents = 'auto';
            if (msg) { err.textContent = msg; return; }
            if (typeof sonSucces === 'function') sonSucces();
            fermerModal('modal-edition-mission');
            await this.rafraichir();
        },
        // ouvre la salle de commandement sur une campagne (ajout d'une mission)
        ajouter: function (id) {
            if (typeof window.ouvrirSalleCommandement === 'function') window.ouvrirSalleCommandement(null, id);
        },
        // choix d'une campagne dans une liste (adoption d'une initiative) : renvoie l'id ou null
        choisirCampagne: function (titre, sous) {
            injecterModales(); css();
            var liste = window.cacheCampagnes || [];
            document.getElementById('choix-titre').innerHTML = '&gt; ' + esc(titre || 'DANS QUELLE CAMPAGNE ?');
            document.getElementById('choix-sous').textContent = sous || '';
            return new Promise(function (resolve) {
                var m = document.getElementById('modal-choix-campagne'), cont = document.getElementById('choix-liste'), fini = false;
                var fin = function (v) { if (fini) return; fini = true; m.style.display = 'none'; resolve(v); };
                cont.innerHTML = liste.length ? liste.map(function (c) { var pr = PRIO[c.priorite] || PRIO[3]; return '<div class="choix-ligne" data-id="' + c.id + '">' + pastille(LIB[c.type_campagne] || '', COUL[c.type_campagne] || '#aaa') + '<b style="color:#fff;">' + esc(c.nom) + '</b><span style="flex:1;"></span>' + pastille(pr[0], pr[1]) + '</div>'; }).join('')
                    : '<div style="color:#9aa; padding:14px; line-height:1.6;">Aucune campagne active. ' + (estAmiral() ? 'Créez-en une avec « + NOUVELLE CAMPAGNE ».' : 'L\'Amiral doit en créer une.') + '</div>';
                cont.querySelectorAll('.choix-ligne').forEach(function (el) { el.onclick = function () { fin(Number(el.getAttribute('data-id'))); }; });
                m.onclick = function (e) { if (e.target === m) fin(null); };
                m.querySelector('.modal-close').onclick = function () { fin(null); };
                m.style.display = 'flex';
            });
        },
        vue: function (v) { if (typeof sonClic === 'function') sonClic(); try { localStorage.setItem('edteam_camp_vue', v); } catch (e) { /* stockage indisponible : le choix ne sera pas memorise */ } if (dernier) rendre(dernier); },
        rafraichir: async function () {
            if (typeof window.chargerOrdresAmiraute === 'function') window.chargerOrdresAmiraute();
            if (typeof window.afficherOrdresBGS === 'function') await window.afficherOrdresBGS();
        }
    };
})();
