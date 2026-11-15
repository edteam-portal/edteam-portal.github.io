// CAMPAGNES PUBLIQUES (SQL 220) : visibilite d'une campagne (Escadron / Federation) + fiche publique, liste « Campagnes qui recrutent »,
// demandes de participation et dialogue Amiral / pilote. Module AUTONOME : fonctionne sur toute page qui charge supabaseApp (page BGS, espace de l'independant).
// Donnees : RPC campagne_definir_visibilite, campagnes_publiques, campagne_demander, campagne_demande_ecrire / _decider / _clore / _fil, campagne_demandes_recues, mes_demandes, demandes_pastilles.
// Regles : la liste ne montre que la FICHE (jamais systeme, faction, cible, briefing) ; l'Amiral hote seul decide ; l'Amiral du pilote est seulement informe (ligne de fil, cote base).
(function () {
    'use strict';
    // type REEL de la campagne (celui de la fenetre de creation, memes couleurs que campagnes.js) et natures de missions presentes (calculees par la base)
    var TYPES = { ATTAQUE: ['ATTAQUE', '#FF3333'], DEFENSE: ['DÉFENSE', '#00F0FF'], MAINTIEN: ['MAINTIEN', '#00FF66'], CONQUETE: ['CONQUÊTE', '#EDEDED'] };
    var NATURES = { BGS: 'BGS', POWERPLAY: 'POWERPLAY', COLONISATION: 'COLONISATION' };
    function typeDe(k) { return TYPES[k] || TYPES.ATTAQUE; }
    function chipsNatures(l) { return (l || []).map(function (n) { return '<span style="border-color:#5a4a2a;color:#d8c9a8;">' + esc(NATURES[n] || n) + '</span>'; }).join(''); }
    var LANGUES = { FR: 'FRANÇAIS', EN: 'ENGLISH' };
    var CRENEAUX = { MATIN: 'MATIN', APRES_MIDI: 'APRÈS-MIDI', SOIREE: 'SOIRÉE FR', NUIT: 'NUIT FR' };
    var ETATS = { NOUVELLE: ['NOUVELLE', 'att'], DISCUSSION: ['EN DISCUSSION', 'disc'], ACCEPTEE: ['ACCEPTÉE', 'ok'], REFUSEE: ['REFUSÉE', 'no'], CLOSE: ['CLASSÉE', 'plein'], RETIREE: ['RETIRÉE', 'plein'] };
    var ERR = {
        REFUSE_DROIT: 'Action réservée.', CAMPAGNE_INTROUVABLE: 'Cette campagne n’est plus ouverte.', FICHE_INVALIDE: 'La fiche publique est incomplète ou invalide.',
        MEME_ESCADRON: 'C’est la campagne de votre escadron.', MESSAGE_INVALIDE: 'Écrivez un message (5 caractères au moins, 500 au plus).', DEJA: 'Vous participez déjà à cette campagne.',
        DEJA_DEMANDE: 'Vous avez déjà une demande en attente pour cette campagne.', A_REFUSE: 'Votre demande a déjà été refusée pour cette campagne.',
        REFUS_REPETES: 'Cet escadron a refusé trois de vos demandes : vous ne pouvez plus lui en adresser.', TROP_EN_ATTENTE: 'Trois demandes en attente au plus en même temps.',
        TROP_DE_DEMANDES: 'Trop de demandes aujourd’hui (10 au plus).', COMPLETE: 'Cette campagne est complète.', DEMANDE_INTROUVABLE: 'Demande introuvable.',
        DEMANDE_CLOSE: 'Cette demande est terminée.', ATTENDRE_REPONSE: 'Attendez la réponse avant d’écrire de nouveau.'
    };
    var esc = function (s) { return typeof window.escapeHtml === 'function' ? window.escapeHtml(String(s == null ? '' : s)) : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
    var db = function () { return window.supabaseApp; };
    var moi = function () { return window.profilCommandant || {}; };
    var son = function (n) { try { if (typeof window[n] === 'function') window[n](); } catch (e) { /* rien */ } };
    var sansEscadron = function () { var e = String(moi().escadron_id || '').trim().toUpperCase(); return !e || e === 'INDEPENDANT' || moi().escadron_valide === false; };
    var estAmiral = function () { var m = moi(); return !!(m.est_amiral || m.est_directeur); };
    function il(t) { if (!t) return ''; var s = Math.max(0, Math.round((Date.now() - new Date(t).getTime()) / 1000)); if (s < 90) return 'à l’instant'; var m = Math.round(s / 60); if (m < 90) return 'il y a ' + m + ' min'; var h = Math.round(m / 60); if (h < 36) return 'il y a ' + h + ' h'; return 'il y a ' + Math.round(h / 24) + ' j'; }
    function heure(t) { return t ? new Date(t).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''; }
    function ini(n) { return String(n || '?').replace(/^CMDR\s+/i, '').slice(0, 2).toUpperCase(); }

    // ---------------------------------------------------------------- STYLE
    function css() {
        if (document.getElementById('cpb-css')) return;
        var s = document.createElement('style'); s.id = 'cpb-css';
        s.textContent = [
            '#cpb-plein{position:fixed;inset:0;z-index:9500;display:flex;align-items:center;justify-content:center;padding:clamp(10px,3vh,30px) clamp(10px,3vw,40px);background:rgba(2,3,5,.9);backdrop-filter:blur(3px);font-family:"Share Tech Mono",Consolas,monospace}',
            '.cpb-p{position:relative;width:min(1180px,100%);height:100%;max-height:880px;display:flex;flex-direction:column;background:linear-gradient(180deg,rgba(0,255,102,.07),rgba(4,6,9,.985) 22%);border:1px solid #00FF66;box-shadow:0 0 34px rgba(0,255,102,.2);clip-path:polygon(0 0,calc(100% - 18px) 0,100% 18px,100% 100%,18px 100%,0 calc(100% - 18px))}',
            '.cpb-h{flex:none;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:14px 22px 10px;border-bottom:1px solid rgba(0,255,102,.3)}',
            '.cpb-h small{display:block;color:#888;letter-spacing:3px;font-size:.72em}.cpb-h b{display:block;color:#00FF66;font-size:1.4em;letter-spacing:3px;font-weight:normal;text-shadow:0 0 12px rgba(0,255,102,.35)}',
            '.cpb-x{background:transparent;border:1px solid #6b7680;color:#aab7bd;font:inherit;font-size:.78em;letter-spacing:2px;padding:7px 16px;cursor:pointer}.cpb-x:hover{border-color:#fff;color:#fff}',
            '.cpb-tabs{flex:none;display:flex;gap:6px;flex-wrap:wrap;padding:10px 22px;border-bottom:1px solid rgba(255,255,255,.07)}',
            '.cpb-tab{background:transparent;border:1px solid #2c4a3a;color:#8fbfa3;font:inherit;font-size:.78em;letter-spacing:2px;padding:7px 14px;cursor:pointer;display:inline-flex;gap:8px;align-items:center}.cpb-tab:hover{color:#fff;border-color:#00FF66}.cpb-tab.on{background:rgba(0,255,102,.14);border-color:#00FF66;color:#fff}',
            '.cpb-pas{background:#FFD700;color:#000;font-size:.82em;padding:0 6px;font-weight:bold;box-shadow:0 0 8px rgba(255,215,0,.6)}',
            '.cpb-c{flex:1;min-height:0;overflow-y:auto;padding:12px 22px 18px;scrollbar-width:thin;scrollbar-color:#00FF66 #0b0b0b}',
            '.cpb-fl{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;align-items:center}',
            '.cpb-puce{--c:#FF7100;border:1px solid color-mix(in srgb,var(--c) 38%,#222);color:color-mix(in srgb,var(--c) 65%,#888);background:transparent;padding:5px 11px;font:inherit;font-size:.74em;letter-spacing:1.5px;cursor:pointer}',
            '.cpb-puce:hover{border-color:var(--c);color:#fff}.cpb-puce.on{border-color:var(--c);color:var(--c);background:color-mix(in srgb,var(--c) 15%,#000)}',
            '.cpb-n{margin-left:auto;color:#8b97a0;font-size:.74em;letter-spacing:1px}',
            '.cpb-grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}',
            '.cpb-cc{--c:#FF7100;position:relative;border:1px solid color-mix(in srgb,var(--c) 55%,#222);background:linear-gradient(180deg,color-mix(in srgb,var(--c) 9%,#0a0705),#070503 80%);padding:14px 14px 12px 18px;clip-path:polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px);display:flex;flex-direction:column;gap:9px;min-width:0}',
            '.cpb-cc::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--c);box-shadow:0 0 10px var(--c)}',
            '.cpb-cc.complet{filter:saturate(.35) brightness(.8)}',
            '.cpb-ty{font-size:.72em;letter-spacing:2px;color:var(--c);display:flex;justify-content:space-between;gap:8px}.cpb-ty span:last-child{color:#8d8478;letter-spacing:1px}',
            '.cpb-cc h4{color:#fff;font-size:1.08em;font-weight:normal;letter-spacing:1px;margin:0;overflow-wrap:anywhere}',
            '.cpb-ho{display:flex;align-items:center;gap:8px;font-size:.8em;color:#b9b0a3;flex-wrap:wrap}.cpb-tag{border:1px solid #00F0FF;color:#00F0FF;font-size:.8em;padding:1px 6px;letter-spacing:1px}',
            '.cpb-cc p{font-size:.84em;line-height:1.5;color:#c9c0b2;margin:0;overflow-wrap:anywhere}',
            '.cpb-mt{display:flex;flex-wrap:wrap;gap:6px}.cpb-mt span{border:1px solid #3a2a14;color:#b8ad9c;font-size:.74em;padding:2px 8px}',
            '.cpb-pl{display:flex;align-items:center;gap:8px;font-size:.78em;color:#b8ad9c}.cpb-pl .pt{display:flex;gap:3px;flex-wrap:wrap}.cpb-pl .pt i{width:13px;height:7px;background:#2c2012}.cpb-pl .pt i.p{background:var(--c);box-shadow:0 0 5px var(--c)}',
            '.cpb-pied{display:flex;justify-content:space-between;align-items:center;gap:10px;border-top:1px solid rgba(255,255,255,.11);padding-top:9px}',
            '.cpb-et{font-size:.74em;letter-spacing:1.5px;display:flex;align-items:center;gap:6px}.cpb-et::before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor;box-shadow:0 0 6px currentColor}',
            '.cpb-et.att{color:#FFD700}.cpb-et.disc{color:#00F0FF}.cpb-et.ok{color:#00FF66}.cpb-et.no{color:#FF3333}.cpb-et.plein{color:#8a8176}',
            '.cpb-btn{--c:#FF7100;background:color-mix(in srgb,var(--c) 10%,#000);border:1px solid var(--c);color:var(--c);padding:8px 18px;font:inherit;font-size:.82em;letter-spacing:2px;cursor:pointer;clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)}',
            '.cpb-btn:hover{background:color-mix(in srgb,var(--c) 24%,#000)}.cpb-btn.vt{--c:#00FF66}.cpb-btn.cy{--c:#00F0FF}.cpb-btn.rg{--c:#FF3333}.cpb-btn.gr{--c:#8a8176}.cpb-btn.sm{padding:5px 12px;font-size:.72em}.cpb-btn[disabled]{opacity:.4;cursor:default}',
            '.cpb-vide{color:#9aa;padding:34px 10px;text-align:center;line-height:1.7;border:1px dashed #2c3a34;margin-top:6px}',
            // dialogue
            '.cpb-duo{display:grid;grid-template-columns:320px minmax(0,1fr);gap:14px;height:100%;min-height:0}',
            '.cpb-liste{display:flex;flex-direction:column;gap:8px;overflow-y:auto;min-height:0;padding-right:4px;scrollbar-width:thin}',
            '.cpb-dem{--c:#FFD700;display:grid;grid-template-columns:40px minmax(0,1fr);gap:10px;padding:10px;border:1px solid #3a2a14;background:#0a0705;cursor:pointer;position:relative}',
            '.cpb-dem:hover{border-color:#6b6358}.cpb-dem.on{border-color:#00F0FF;background:rgba(0,240,255,.07);box-shadow:inset 0 0 16px rgba(0,240,255,.1)}',
            '.cpb-av{width:40px;height:40px;border-radius:50%;border:2px solid var(--c,#FF7100);background:radial-gradient(circle at 35% 30%,#3a2a18,#120c06);display:grid;place-items:center;color:var(--c,#FF7100);font-size:.9em}.cpb-av.a{--c:#00F0FF}.cpb-av.s{--c:#FF7100}',
            '.cpb-dem .n{color:#fff;font-size:.86em;overflow-wrap:anywhere;padding-right:78px}.cpb-dem .m{font-size:.72em;color:#8d8478;margin-top:2px}.cpb-dem .ex{grid-column:2;font-size:.74em;color:#c9c0b2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
            '.cpb-dem .cpb-et{position:absolute;top:10px;right:10px;font-size:.62em}.cpb-dem.nl .n::after{content:" ●";color:#FFD700}',
            '.cpb-badge{font-size:.78em;letter-spacing:1px;padding:1px 6px;border:1px solid currentColor}.cpb-badge.s{color:#FF7100}.cpb-badge.a{color:#00F0FF}',
            '.cpb-fiche{display:flex;gap:14px;align-items:center;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.11);margin-bottom:10px;flex-wrap:wrap}.cpb-fiche .cpb-av{width:52px;height:52px;font-size:1.1em}',
            '.cpb-fiche .nom{color:#fff;font-size:1.15em;letter-spacing:1px}.cpb-fiche .st{display:flex;gap:6px;margin-top:5px;flex-wrap:wrap}',
            '.cpb-med{display:inline-flex;align-items:center;gap:6px;border:1px solid #FFD700;color:#FFD700;font-size:.72em;padding:2px 8px}',
            '.cpb-droite{display:flex;flex-direction:column;min-height:0;min-width:0}',
            '.cpb-fil{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:11px;padding:4px 4px 8px;scrollbar-width:thin}',
            '.cpb-msg{max-width:80%;padding:10px 13px;font-size:.88em;line-height:1.55;color:#e6dfd2;overflow-wrap:anywhere;white-space:pre-wrap}.cpb-msg small{display:block;font-size:.76em;color:#8d8478;margin-top:5px;white-space:normal}',
            '.cpb-msg.eux{align-self:flex-start;border:1px solid rgba(0,255,102,.35);background:rgba(0,255,102,.05)}.cpb-msg.moi{align-self:flex-end;border:1px solid rgba(0,240,255,.35);background:rgba(0,240,255,.05)}.cpb-msg.moi small{text-align:right}',
            '.cpb-compose{flex:none;margin-top:8px;display:flex;gap:10px;align-items:flex-end}',
            '.cpb-compose textarea{flex:1;min-height:58px;max-height:140px;resize:vertical;background:rgba(0,0,0,.65);border:1px solid #00F0FF;color:#e8f6f8;font:inherit;font-size:.88em;padding:9px 11px;outline:0;line-height:1.5}',
            '.cpb-decision{flex:none;display:flex;gap:10px;justify-content:space-between;align-items:center;margin-top:12px;flex-wrap:wrap;border-top:1px dashed rgba(255,255,255,.2);padding-top:10px}.cpb-note{color:#8d8478;font-size:.72em;line-height:1.5;flex:1 1 260px}',
            '.cpb-info{color:#8d8478;font-size:.74em;letter-spacing:1px;margin:2px 0 4px}.cpb-err{color:#FF7100;font-size:.82em;min-height:1.2em;margin-top:6px}',
            // fenetre de demande
            '.cpb-voile{position:absolute;inset:0;z-index:5;display:flex;padding:18px;background:rgba(2,3,5,.86);overflow-y:auto}',
            '.cpb-mod{position:relative;margin:auto;width:min(900px,100%);background:linear-gradient(180deg,rgba(0,255,102,.08),rgba(5,8,8,.99) 24%);border:1px solid #00FF66;padding:16px 18px;clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px))}',
            '.cpb-mod h3{margin:0 0 12px;color:#00FF66;font-size:1.05em;letter-spacing:3px;font-weight:normal}',
            '.cpb-dm{display:grid;grid-template-columns:.9fr 1.1fr;gap:20px}',
            '.cpb-regles{list-style:none;margin:8px 0 0;padding:0}.cpb-regles li{display:flex;gap:10px;font-size:.82em;color:#c9c0b2;line-height:1.5;padding:7px 0;border-top:1px solid rgba(255,255,255,.08)}',
            '.cpb-regles li>b{flex:none;width:22px;height:22px;display:grid;place-items:center;border:1px solid #00FF66;color:#00FF66;font-size:.9em;font-weight:normal}.cpb-regles li.i>b{border-color:#00F0FF;color:#00F0FF}',
            '.cpb-zone{width:100%;min-height:150px;resize:vertical;background:rgba(0,0,0,.65);border:1px solid #00FF66;color:#f3ece0;font:inherit;font-size:.88em;line-height:1.55;padding:11px 12px;outline:0;box-shadow:0 0 12px rgba(0,255,102,.1)}',
            '.cpb-cpt{display:flex;justify-content:space-between;font-size:.72em;color:#8d8478;margin-top:5px}',
            '.cpb-sg{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}',
            '.cpb-bt{display:flex;justify-content:flex-end;gap:10px;margin-top:14px}',
            // etape « visibilite » de la fenetre de campagne
            '.cpb-vis{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
            '.cpb-vc{--c:#FF7100;text-align:left;font:inherit;color:#d9d2c8;border:1px solid color-mix(in srgb,var(--c) 45%,#222);background:#0b0805;padding:12px 14px;cursor:pointer;position:relative;transition:.2s;clip-path:polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)}',
            '.cpb-vc.vt{--c:#00FF66}.cpb-vc:hover{border-color:var(--c)}.cpb-vc.on{border-color:var(--c);background:color-mix(in srgb,var(--c) 11%,#080604);box-shadow:inset 0 0 20px color-mix(in srgb,var(--c) 18%,transparent)}',
            '.cpb-vc h5{margin:0 0 5px;color:var(--c);font-size:1em;letter-spacing:3px;font-weight:normal}.cpb-vc p{margin:0;font-size:.78em;line-height:1.5;color:#b9b0a3}',
            '.cpb-vc .co{position:absolute;top:10px;right:12px;width:18px;height:18px;border:1px solid var(--c);display:grid;place-items:center;font-size:.8em;color:#000}.cpb-vc.on .co{background:var(--c)}',
            '.cpb-alerte{margin-top:10px;border:1px solid #FFD700;background:rgba(255,215,0,.06);padding:10px 12px;color:#e8dfae;font-size:.78em;line-height:1.55}.cpb-alerte b{color:#FFD700}.cpb-alerte ul{margin:5px 0 0 16px;padding:0}',
            '.cpb-champ{margin:10px 0 0}.cpb-champ>label{display:flex;justify-content:space-between;color:#8d8478;font-size:.7em;letter-spacing:1.5px;margin-bottom:5px}.cpb-champ>label i{font-style:normal;color:#6b6358}',
            '.cpb-champ .cpb-in{width:100%;box-sizing:border-box}',
            '.cpb-pasn{display:inline-flex;align-items:center;border:1px solid #5a3a14}.cpb-pasn button{width:32px;height:32px;background:transparent;border:0;color:#FF7100;font:inherit;cursor:pointer}.cpb-pasn span{min-width:44px;text-align:center;color:#fff}',
            '.cpb-apercu{margin-top:12px}.cpb-apercu>small{display:flex;align-items:center;gap:8px;color:#00FF66;font-size:.7em;letter-spacing:2px;margin-bottom:8px}.cpb-apercu>small::after{content:"";flex:1;height:1px;background:rgba(0,255,102,.25)}',
            // espace de l'independant (page campagnes-publiques.html)
            '.cpb-esp{display:flex;flex-direction:column;gap:16px;font-family:"Share Tech Mono",Consolas,monospace}',
            '.cpb-esp .deux{display:grid;grid-template-columns:1fr 1fr;gap:16px}',
            '.cpb-ban{display:flex;gap:16px;align-items:center;flex-wrap:wrap}.cpb-ban .id{flex:1;min-width:230px}.cpb-ban .nm{color:#fff;font-size:1.3em;letter-spacing:2px}.cpb-ban .sb{color:#8d8478;font-size:.82em;margin-top:5px;line-height:1.5}',
            '.cpb-medaille{width:58px;height:58px;display:grid;place-items:center;font-size:1.7em;color:#3b2a08;background:radial-gradient(circle at 35% 30%,#ffe9a0,#c9922a 55%,#6a4a10);border-radius:50%;box-shadow:0 0 16px rgba(255,215,0,.35),inset 0 0 8px rgba(255,255,255,.45);border:2px solid #e8c25c}',
            '.cpb-medaille.vide{background:radial-gradient(circle at 35% 30%,#2a2a2a,#0e0e0e);color:#555;border-color:#3a3a3a;box-shadow:none}',
            '.cpb-lc{display:grid;grid-template-columns:4px minmax(0,1fr) auto auto;gap:14px;align-items:center;border:1px solid #3a2a14;background:#0a0705;padding:10px 14px 10px 0;margin-bottom:8px}.cpb-lc>i{align-self:stretch;background:var(--c,#FF7100);box-shadow:0 0 8px var(--c,#FF7100)}',
            '.cpb-lc .t{color:#fff;font-size:.92em;overflow-wrap:anywhere}.cpb-lc .s{color:#8d8478;font-size:.74em;margin-top:3px}',
            '.cpb-mini{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}',
            '@media (max-width:860px){.cpb-esp .deux{grid-template-columns:1fr}.cpb-lc{grid-template-columns:4px minmax(0,1fr)}.cpb-lc>*:nth-child(n+3){grid-column:2}}',
            '@media (max-width:860px){.cpb-duo,.cpb-dm,.cpb-vis{grid-template-columns:1fr}.cpb-duo{overflow-y:auto}.cpb-liste{max-height:220px}.cpb-msg{max-width:92%}}',
            // cadres FERMES : le clip-path coupe les coins en biais et la bordure s'arrete ; on trace la diagonale de chaque coin coupe (haut droit + bas gauche, ou haut gauche + bas droit)
            '.cpb-p::after,.cpb-mod::after,.cpb-ann-c::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:6;--k:18px;--l:#00FF66;background:linear-gradient(to bottom left,transparent calc(50% - .3px),var(--l) calc(50% - .3px),var(--l) calc(50% + 1.1px),transparent calc(50% + 1.1px)) right top/var(--k) var(--k) no-repeat,linear-gradient(to top right,transparent calc(50% - .3px),var(--l) calc(50% - .3px),var(--l) calc(50% + 1.1px),transparent calc(50% + 1.1px)) left bottom/var(--k) var(--k) no-repeat}',
            '.cpb-mod::after{--k:14px}.cpb-ann-c::after{--k:26px;--l:var(--c)}',
            '.cpb-cc::after,.cpb-btn::after,.cpb-vc::after{content:"";position:absolute;inset:0;pointer-events:none;--k:12px;--l:var(--c);background:linear-gradient(to bottom right,transparent calc(50% - .3px),var(--l) calc(50% - .3px),var(--l) calc(50% + 1.1px),transparent calc(50% + 1.1px)) left top/var(--k) var(--k) no-repeat,linear-gradient(to top left,transparent calc(50% - .3px),var(--l) calc(50% - .3px),var(--l) calc(50% + 1.1px),transparent calc(50% + 1.1px)) right bottom/var(--k) var(--k) no-repeat}',
            '.cpb-cc::after{--l:color-mix(in srgb,var(--c) 55%,#222)}.cpb-btn{position:relative}.cpb-btn::after{--k:8px}.cpb-vc::after{--k:10px;--l:color-mix(in srgb,var(--c) 45%,#222)}.cpb-vc:hover::after,.cpb-vc.on::after{--l:var(--c)}',
            // choix de la fiche (langue, creneau) : de vrais boutons, cases a cocher visibles, survol, focus
            '.cpb-puce.chx{display:inline-flex;align-items:center;gap:9px;padding:8px 14px 8px 11px;font-size:.78em;background:rgba(255,255,255,.035);border:1px solid color-mix(in srgb,var(--c) 62%,#333);color:#d9d2c8;box-shadow:inset 0 -2px 0 color-mix(in srgb,var(--c) 35%,transparent);transition:.15s}',
            '.cpb-puce.chx::before{content:"";width:12px;height:12px;border:1px solid var(--c);background:rgba(0,0,0,.5);color:#000;font-size:11px;line-height:11px;text-align:center;font-weight:bold;flex:none}',
            '.cpb-puce.chx:hover{background:color-mix(in srgb,var(--c) 14%,#050505);border-color:var(--c);color:#fff;box-shadow:0 0 12px color-mix(in srgb,var(--c) 38%,transparent),inset 0 -2px 0 var(--c);transform:translateY(-1px)}',
            '.cpb-puce.chx.on{background:color-mix(in srgb,var(--c) 22%,#050505);border-color:var(--c);color:#fff;box-shadow:0 0 12px color-mix(in srgb,var(--c) 30%,transparent),inset 0 -2px 0 var(--c)}.cpb-puce.chx.on::before{content:"✓";background:var(--c)}',
            '.cpb-puce:focus-visible,.cpb-btn:focus-visible,.cpb-vc:focus-visible,.cpb-pasn button:focus-visible{outline:2px solid #fff;outline-offset:2px}',
            '.cpb-pasn button{transition:.15s}.cpb-pasn button:hover{background:rgba(255,113,0,.22);color:#fff}',
            // bouton CAMPAGNES PUBLIQUES / lien CAMPAGNES : clignote tant qu\'un message n\'est pas lu
            '@keyframes cpbClg{0%,100%{box-shadow:0 0 0 rgba(0,255,102,0);background-color:rgba(0,255,102,.1)}50%{box-shadow:0 0 18px #00FF66,inset 0 0 10px rgba(0,255,102,.55);background-color:rgba(0,255,102,.32)}}',
            '.cpb-clg{animation:cpbClg 1.5s infinite}',
            // fiche d\'une campagne : logo de l\'escadron hote + avatar de l\'Amiral ; en large, la carte se met en ligne (aucun vide)
            '.cpb-cc{container-type:inline-size}',
            '.cpb-bd{display:grid;grid-template-columns:auto minmax(0,1fr);gap:14px;align-items:start}',
            '.cpb-id{position:relative;width:70px;height:70px;flex:none}',
            '.cpb-lg{width:70px;height:70px;border-radius:50%;border:2px solid var(--c);background:radial-gradient(circle at 35% 30%,#1b2a33,#080d10);display:grid;place-items:center;overflow:hidden;position:relative;color:var(--c);font-size:1.05em;letter-spacing:1px;box-shadow:0 0 14px color-mix(in srgb,var(--c) 40%,transparent)}',
            '.cpb-lg img,.cpb-avi img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}',
            '.cpb-lg img{object-fit:contain;padding:6px;box-sizing:border-box}',
            '.cpb-avi{position:absolute;right:-8px;bottom:-6px;width:32px;height:32px;border-radius:50%;border:2px solid #FF3333;background:radial-gradient(circle at 35% 30%,#4a1414,#170505);color:#ff7b7b;display:grid;place-items:center;overflow:hidden;font-size:.72em;box-shadow:0 0 8px rgba(255,51,51,.5)}',
            '.cpb-tx{min-width:0;display:flex;flex-direction:column;gap:7px}',
            '.cpb-dt{display:flex;flex-direction:column;gap:9px;grid-column:1/-1;min-width:0}',
            '@container (min-width:620px){.cpb-bd{grid-template-columns:auto minmax(0,1.2fr) minmax(240px,1fr);gap:22px;align-items:center}.cpb-dt{grid-column:auto}}',
            '.cpb-grille{grid-template-columns:repeat(auto-fit,minmax(360px,1fr))}.cpb-mini{grid-template-columns:repeat(auto-fit,minmax(360px,1fr))}',
            // fenetre de creation en deux colonnes (campagnes.js) : fiche publique a droite
            '.cpb-fiche-z{margin-bottom:20px}.cpb-fiche-t{display:flex;align-items:center;gap:10px;color:#00FF66;font-size:.78em;font-weight:bold;letter-spacing:2px;margin-bottom:9px}',
            '.cpb-fiche-t i{font-style:normal;color:#777;font-weight:normal;letter-spacing:1px}',
            '.cpb-2c{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:0 14px}.cpb-2c .cpb-champ{margin-top:10px}',
            // annonce plein ecran (nouvelle campagne publique ouverte)
            '#cpb-annonce{position:fixed;inset:0;z-index:9700;display:flex;padding:clamp(12px,3vh,36px) clamp(12px,3vw,40px);overflow-y:auto;font-family:"Share Tech Mono",Consolas,monospace;background:radial-gradient(ellipse at 50% 28%,color-mix(in srgb,var(--c) 22%,#05080a) 0,rgba(2,3,5,.97) 62%);animation:cpbAnnIn .5s ease both}',
            '#cpb-annonce::before{content:"";position:fixed;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 4px);opacity:.6}',
            '@keyframes cpbAnnIn{from{opacity:0}to{opacity:1}}@keyframes cpbAnnUp{from{opacity:0;transform:translateY(22px) scale(.97)}to{opacity:1;transform:none}}@keyframes cpbOrb{to{transform:rotate(360deg)}}@keyframes cpbBal{0%,100%{opacity:.35}50%{opacity:1}}',
            '.cpb-ann-c{position:relative;margin:auto;width:min(1000px,100%);display:grid;grid-template-columns:minmax(220px,300px) minmax(0,1fr);background:linear-gradient(180deg,color-mix(in srgb,var(--c) 10%,#05080a),#04060a 40%);border:1px solid var(--c);box-shadow:0 0 60px color-mix(in srgb,var(--c) 26%,transparent);clip-path:polygon(0 0,calc(100% - 26px) 0,100% 26px,100% 100%,26px 100%,0 calc(100% - 26px));animation:cpbAnnUp .6s .15s ease both;--l:var(--c)}',
            '.cpb-ann-g{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:34px 22px;background:radial-gradient(circle at 50% 38%,color-mix(in srgb,var(--c) 16%,transparent),transparent 70%);border-right:1px dashed color-mix(in srgb,var(--c) 40%,#222)}',
            '.cpb-ann-lg{position:relative;width:150px;height:150px;display:grid;place-items:center}.cpb-ann-lg .or{position:absolute;inset:-9px;border-radius:50%;border:1px dashed color-mix(in srgb,var(--c) 70%,#222);animation:cpbOrb 20s linear infinite}.cpb-ann-lg .or::after{content:"";position:absolute;top:-4px;left:50%;width:7px;height:7px;margin-left:-3px;background:var(--c);border-radius:50%;box-shadow:0 0 10px var(--c)}',
            '.cpb-ann-lg .lg{position:relative;width:150px;height:150px;border-radius:50%;border:3px solid var(--c);background:radial-gradient(circle at 35% 30%,#1b2a33,#06090c);display:grid;place-items:center;overflow:hidden;color:var(--c);font-size:2em;letter-spacing:2px;box-shadow:0 0 30px color-mix(in srgb,var(--c) 50%,transparent)}.cpb-ann-lg .lg img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;padding:14px;box-sizing:border-box}',
            '.cpb-ann-am{display:flex;align-items:center;gap:12px;text-align:left}.cpb-ann-am .cpb-avi{position:static;width:52px;height:52px;font-size:1em}.cpb-ann-am b{display:block;color:#fff;font-weight:normal;letter-spacing:1px}.cpb-ann-am small{color:#8d8478;letter-spacing:2px;font-size:.7em}',
            '.cpb-ann-d{padding:34px 36px 28px;display:flex;flex-direction:column;gap:14px;min-width:0}',
            '.cpb-ann-e{display:flex;align-items:center;gap:10px;color:var(--c);font-size:.8em;letter-spacing:4px}.cpb-ann-e i{width:9px;height:9px;border-radius:50%;background:var(--c);box-shadow:0 0 12px var(--c);animation:cpbBal 1.4s infinite}',
            '.cpb-ann-d h2{margin:0;color:#fff;font-weight:normal;font-size:clamp(1.5em,3.4vw,2.4em);letter-spacing:2px;line-height:1.15;text-shadow:0 0 22px color-mix(in srgb,var(--c) 45%,transparent);overflow-wrap:anywhere}',
            '.cpb-ann-ty{display:inline-block;align-self:flex-start;border:1px solid var(--c);color:var(--c);padding:3px 12px;font-size:.78em;letter-spacing:3px;background:color-mix(in srgb,var(--c) 12%,transparent)}',
            '.cpb-ann-d q{display:block;quotes:none;color:#d8d0c2;font-size:1.02em;line-height:1.6;border-left:3px solid var(--c);padding:2px 0 2px 14px;overflow-wrap:anywhere}',
            '.cpb-ann-b{display:flex;gap:12px;justify-content:flex-end;flex-wrap:wrap;margin-top:6px;padding-top:16px;border-top:1px dashed rgba(255,255,255,.16)}.cpb-ann-b .cpb-btn{padding:11px 26px;font-size:.9em}',
            '@media (max-width:820px){.cpb-ann-c{grid-template-columns:1fr}.cpb-ann-g{border-right:0;border-bottom:1px dashed color-mix(in srgb,var(--c) 40%,#222);flex-direction:row;flex-wrap:wrap;padding:20px}.cpb-ann-lg,.cpb-ann-lg .lg{width:96px;height:96px}.cpb-ann-d{padding:22px 20px}}',
            '@media (max-width:640px){.cpb-2c{grid-template-columns:1fr}#cpb-plein{padding:0}.cpb-p{max-height:none;clip-path:none;border-width:0}.cpb-p::after{display:none}.cpb-h{padding:12px 14px 8px}.cpb-h b{font-size:1.15em;letter-spacing:2px}.cpb-tabs{padding:8px 14px}.cpb-c{padding:10px 14px 16px}.cpb-grille,.cpb-mini{grid-template-columns:1fr}.cpb-bd{grid-template-columns:auto minmax(0,1fr)}.cpb-voile{padding:10px}.cpb-mod{padding:14px}.cpb-fiche{gap:10px}.cpb-msg{max-width:94%}.cpb-compose{flex-direction:column;align-items:stretch}.cpb-btn{padding:11px 18px}.cpb-puce{padding:9px 12px}}',
            '@media (prefers-reduced-motion:reduce){.cpb-vc,.cpb-puce.chx{transition:none}.cpb-clg,#cpb-annonce,.cpb-ann-c,.cpb-ann-lg .or,.cpb-ann-e i{animation:none!important}}'
        ].join('\n');
        document.head.appendChild(s);
    }

    // ---------------------------------------------------------------- ETAPE « VISIBILITE » (fenetre de campagne, campagnes.js)
    var vis = 'ESCADRON', fiche = { titre: '', resume: '', places: 5, langues: ['FR'], creneaux: [] }, ficheOuverte = false;
    function ficheDe(c) {
        return { titre: c && c.pub_titre || '', resume: c && c.pub_resume || '', places: c && c.pub_places || 5,
                 langues: c && c.pub_langues && c.pub_langues.length ? c.pub_langues.slice() : ['FR'], creneaux: c && c.pub_creneaux ? c.pub_creneaux.slice() : [] };
    }
    // etape 6 (colonne de gauche de la fenetre) : le choix Escadron / Federation ; la fiche publique a remplir est dans ficheHtml() (colonne de droite)
    function etapeHtml(numero) {
        css();
        return '<div class="cmd-etape" id="cpb-etape"><div class="cmd-etape-titre"><span class="cmd-num">' + numero + '</span>VISIBILITÉ</div><div id="cpb-vis"></div></div>';
    }
    function ficheHtml() { css(); return '<div class="cpb-fiche-z" id="cpb-fiche" style="display:none;"></div>'; }
    function pastilleChoix(zone, cle, valeurs, actives, multi) {
        return '<div class="cpb-fl" style="margin:0;">' + Object.keys(valeurs).map(function (k) {
            var c = (Array.isArray(valeurs[k]) && valeurs[k][1]) || '#00F0FF', lib = Array.isArray(valeurs[k]) ? valeurs[k][0] : valeurs[k], on = actives.indexOf(k) >= 0;
            return '<button type="button" class="cpb-puce chx' + (on ? ' on' : '') + '" style="--c:' + c + ';" aria-pressed="' + on + '" onclick="edteamPublic.choisir(\'' + cle + '\',\'' + k + '\')">' + esc(lib) + '</button>';
        }).join('') + '</div>';
    }
    // images publiques (buckets logos / photos) : l'image se pose PAR-DESSUS les initiales ; si elle ne charge pas, elle disparait
    function urlImg(bucket, o) { try { if (o && o.chemin && db()) return db().storage.from(bucket).getPublicUrl(o.chemin).data.publicUrl + '?v=' + (o.version || 0); } catch (e) { /* initiales */ } return ''; }
    function imgTag(u) { return u ? '<img src="' + esc(u) + '" alt="" loading="lazy" decoding="async" onerror="this.remove()">' : ''; }
    function abrev(h) { return esc(String(h || '?').replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map(function (m) { return m[0]; }).join('').toUpperCase() || '?'); }
    function blocId(c, urlLogo, urlPhoto) {
        return '<div class="cpb-id"><div class="cpb-lg" title="' + esc(c.hote || '') + '"><span>' + abrev(c.hote) + '</span>' + imgTag(urlLogo) + '</div>'
            + '<div class="cpb-avi" title="' + esc(c.amiral ? 'Amiral ' + c.amiral : 'Amiral') + '"><span>' + esc(ini(c.amiral)) + '</span>' + imgTag(urlPhoto) + '</div></div>';
    }
    function lesVues() { try { return JSON.parse(localStorage.getItem('edteam_cpb_vues_' + (moi().user_id || '')) || '[]'); } catch (e) { return []; } }
    // la page CAMPAGNES (ou la liste) a ete ouverte : plus de clignotement pour les campagnes deja listees
    function marquerVues(l) {
        try { var ids = (l || []).map(function (c) { return c.id; }); localStorage.setItem('edteam_cpb_vues_' + (moi().user_id || ''), JSON.stringify(ids.slice(0, 200))); } catch (e) { /* stockage plein */ }
        var lien = document.getElementById('nav-link-campagnes-pub'); if (lien && !(P.pastilles.pilote > 0)) lien.classList.remove('cpb-clg');
    }
    // le type de l'apercu est celui que l'Amiral a choisi a l'etape 2 de la meme fenetre
    function typeApercu() {
        var a = document.querySelector('#camp-types .cmd-pill.actif'), k = 'ATTAQUE';
        if (a) Object.keys(TYPES).forEach(function (t) { if (TYPES[t][0] === String(a.textContent).trim().toUpperCase()) k = t; });
        return typeDe(k);
    }
    function carteApercu(f, ma) {
        var th = typeApercu(), places = Math.max(1, Number(f.places) || 1), pris = ma && ma.pris || 0, pts = '';
        for (var i = 0; i < Math.min(places, 20); i++) pts += '<i class="' + (i < pris ? 'p' : '') + '"></i>';
        var apercuC = { hote: moi().escadron_id || '', amiral: moi().cmdr_nom || '' }, up = '';
        try { if (window.EDTEAMPhotos && window.EDTEAMPhotos.url) up = window.EDTEAMPhotos.url(moi().user_id, moi().cmdr_nom) || ''; } catch (e) { /* initiales */ }
        return '<article class="cpb-cc" style="--c:' + th[1] + ';"><div class="cpb-ty"><span>' + esc(th[0]) + '</span><span>PUBLIÉE À L’INSTANT</span></div>'
            + '<div class="cpb-bd">' + blocId(apercuC, '', up)
            + '<div class="cpb-tx"><h4>' + (esc(f.titre) || '<span style="color:#6b6358;">Titre public</span>') + '</h4>'
            + '<div class="cpb-ho"><span class="cpb-tag">' + esc(String(moi().escadron_id || '').slice(0, 8).toUpperCase()) + '</span> ' + esc(moi().escadron_id || '') + ' · Amiral ' + esc(moi().cmdr_nom || '') + '</div>'
            + '<p>' + (esc(f.resume) || '<span style="color:#6b6358;">Une phrase de présentation…</span>') + '</p></div>'
            + '<div class="cpb-dt"><div class="cpb-mt"><span style="border-style:dashed;color:#6b6358;">NATURES AUTO</span>' + f.langues.map(function (l) { return '<span>' + esc(LANGUES[l] || l) + '</span>'; }).join('') + f.creneaux.map(function (x) { return '<span>' + esc(CRENEAUX[x] || x) + '</span>'; }).join('') + '</div>'
            + '<div class="cpb-pl"><span class="pt">' + pts + '</span>' + pris + ' / ' + places + ' places</div></div></div>'
            + '<div class="cpb-pied"><span class="cpb-et ok">OUVERTE</span><span class="cpb-btn vt sm" style="pointer-events:none;">DEMANDER</span></div></article>';
    }
    function dessinerVis() {
        var z = document.getElementById('cpb-vis'); if (!z) return;
        var fed = vis === 'FEDERATION';
        z.innerHTML = '<div class="cpb-vis">'
            + '<button type="button" class="cpb-vc' + (fed ? '' : ' on') + '" onclick="edteamPublic.visibilite(\'ESCADRON\')"><span class="co">' + (fed ? '' : '✓') + '</span><h5>ESCADRON</h5><p>Privée : seuls les membres de l’escadron la voient. Vous pouvez inviter un pilote ou un escadron.</p></button>'
            + '<button type="button" class="cpb-vc vt' + (fed ? ' on' : '') + '" onclick="edteamPublic.visibilite(\'FEDERATION\')"><span class="co">' + (fed ? '✓' : '') + '</span><h5>FÉDÉRATION</h5><p>Publique : la campagne figure dans « Campagnes qui recrutent ». Tout pilote inscrit sur EDTEAM peut demander à la rejoindre ; vous décidez de chaque demande.</p></button></div>'
            + (fed ? '<div class="cpb-info" style="margin-top:8px;">→ Remplissez la fiche publique (colonne de droite).</div>' : '');
        var f = document.getElementById('cpb-fiche'); if (!f) return;
        if (!fed) { f.style.display = 'none'; f.innerHTML = ''; return; }
        f.style.display = 'block';
        f.innerHTML = '<div class="cpb-fiche-t"><span class="cmd-num" style="border-color:#00FF66;">★</span>FICHE PUBLIQUE <i>ce que verront les pilotes</i></div>'
            + '<div class="cpb-alerte" style="margin-top:0;"><b>⚠ Ce que vous rendez public</b> : uniquement cette fiche. Ne figurent <b>jamais</b> : les systèmes, les factions, les cibles, le briefing, le nom de la campagne.<ul><li>Un espion d’une puissance rivale peut s’inscrire avec un compte Fédération : rien de stratégique dans le titre ni la phrase.</li><li>Vous lisez chaque demande et dialoguez avec le pilote avant de l’accepter.</li></ul></div>'
            + '<div class="cpb-champ"><label>TITRE PUBLIC <i id="cpb-n-titre">' + fiche.titre.length + ' / 50</i></label><input type="text" id="cpb-titre" class="search-input cmd-champ cpb-in" maxlength="50" autocomplete="off" data-lpignore="true" value="' + esc(fiche.titre) + '" placeholder="Ex : Opération Brise-Glace — renforts" oninput="edteamPublic.saisir(\'titre\',this.value)"></div>'
            + '<div class="cpb-champ"><label>EN UNE PHRASE <i id="cpb-n-resume">' + fiche.resume.length + ' / 140</i></label><textarea id="cpb-resume" class="search-input cmd-champ cpb-in" maxlength="140" style="height:58px; resize:vertical;" placeholder="Ce que vous cherchez, sans rien de stratégique." oninput="edteamPublic.saisir(\'resume\',this.value)">' + esc(fiche.resume) + '</textarea></div>'
            + '<div class="cpb-2c"><div class="cpb-champ"><label>PLACES</label><span class="cpb-pasn"><button type="button" onclick="edteamPublic.places(-1)">−</button><span id="cpb-places">' + fiche.places + '</span><button type="button" onclick="edteamPublic.places(1)">+</button></span></div>'
            + '<div class="cpb-champ"><label>LANGUE <i>un ou deux choix</i></label>' + pastilleChoix('langues', 'langues', LANGUES, fiche.langues) + '</div></div>'
            + '<div class="cpb-champ"><label>CRÉNEAU HABITUEL <i>facultatif · plusieurs choix possibles</i></label>' + pastilleChoix('creneaux', 'creneaux', CRENEAUX, fiche.creneaux) + '<div class="cpb-info" style="margin-top:6px;">🔒 Sert à se reconnaître, jamais à localiser quelqu’un.</div></div>'
            + '<div class="cpb-apercu"><small>APERÇU : CE QUE VERRONT LES PILOTES</small><div id="cpb-apercu">' + carteApercu(fiche, ficheOuverte) + '</div><div class="cpb-info" style="margin-top:6px;">Le type (étape 2) et les natures de missions (BGS, Powerplay, colonisation) s’affichent automatiquement.</div></div>';
    }
    function majApercu() { var a = document.getElementById('cpb-apercu'); if (a) a.innerHTML = carteApercu(fiche, ficheOuverte); }
    function initVisibilite(c) {
        css();
        vis = c && c.visibilite === 'FEDERATION' ? 'FEDERATION' : 'ESCADRON'; fiche = ficheDe(c);
        ficheOuverte = c && c.visibilite === 'FEDERATION' ? { pris: 0 } : false;
        dessinerVis();
    }
    function validerFiche() {
        if (vis !== 'FEDERATION') return '';
        if (fiche.titre.trim().length < 3) return 'Fiche publique : donnez un titre (3 caractères au moins).';
        if (fiche.resume.trim().length < 5) return 'Fiche publique : écrivez une phrase de présentation (5 caractères au moins).';
        if (!fiche.langues.length) return 'Fiche publique : choisissez au moins une langue.';
        return '';
    }
    async function appliquerVisibilite(id, etaitPublique) {
        if (vis !== 'FEDERATION' && !etaitPublique) return '';
        var r = vis === 'FEDERATION'
            ? await db().rpc('campagne_definir_visibilite', { p_campagne: Number(id), p_visibilite: 'FEDERATION', p_titre: fiche.titre.trim(), p_resume: fiche.resume.trim(), p_places: fiche.places, p_langues: fiche.langues, p_creneaux: fiche.creneaux })
            : await db().rpc('campagne_definir_visibilite', { p_campagne: Number(id), p_visibilite: 'ESCADRON' });
        if (r.error) { console.error(r.error); return 'La visibilité n’a pas pu être enregistrée (le script SQL 220 est-il lancé ?).'; }
        return r.data === 'OK' ? '' : (ERR[r.data] || 'La visibilité n’a pas pu être enregistrée.');
    }
    function basculerListe(cle, k) {
        var l = fiche[cle], i = l.indexOf(k);
        if (i >= 0) { if (cle === 'langues' && l.length === 1) return; l.splice(i, 1); } else l.push(k);
    }

    // ---------------------------------------------------------------- PANNEAU PLEIN ECRAN
    var P = { onglet: 'recrutent', filtre: 'TOUTES', liste: [], recues: [], mes: [], sel: null, fil: null, pastilles: { amiral: 0, pilote: 0 }, chargeur: 0 };
    function panneau() { return document.getElementById('cpb-plein'); }
    function fermer() { var p = panneau(); if (p) p.remove(); document.removeEventListener('keydown', touche, true); if (typeof window.__cpbFermeture === 'function') window.__cpbFermeture(); }
    function touche(e) {
        if (e.key !== 'Escape' || !panneau()) return;
        e.stopPropagation();
        var v = document.getElementById('cpb-voile'); if (v) v.remove(); else fermer();
    }
    function onglets() {
        var n = P.pastilles, h = '<button class="cpb-tab' + (P.onglet === 'recrutent' ? ' on' : '') + '" onclick="edteamPublic.onglet(\'recrutent\')">CAMPAGNES QUI RECRUTENT</button>';
        if (estAmiral() && !sansEscadron()) h += '<button class="cpb-tab' + (P.onglet === 'recues' ? ' on' : '') + '" onclick="edteamPublic.onglet(\'recues\')">DEMANDES REÇUES' + (n.amiral ? ' <span class="cpb-pas">' + n.amiral + '</span>' : '') + '</button>';
        h += '<button class="cpb-tab' + (P.onglet === 'mes' ? ' on' : '') + '" onclick="edteamPublic.onglet(\'mes\')">MES DEMANDES' + (n.pilote ? ' <span class="cpb-pas">' + n.pilote + '</span>' : '') + '</button>';
        return h;
    }
    function coque() {
        css();
        var p = panneau();
        if (!p) {
            p = document.createElement('div'); p.id = 'cpb-plein';
            p.innerHTML = '<div class="cpb-p"><div class="cpb-h"><div><small>OUVERTES À TOUTE LA FÉDÉRATION</small><b>CAMPAGNES PUBLIQUES</b></div><button class="cpb-x" onclick="edteamPublic.fermer()">FERMER ✕</button></div><div class="cpb-tabs" id="cpb-tabs"></div><div class="cpb-c" id="cpb-c"></div></div>';
            p.addEventListener('mousedown', function (e) { if (e.target === p) fermer(); });
            document.body.appendChild(p);
            document.addEventListener('keydown', touche, true);
        }
        document.getElementById('cpb-tabs').innerHTML = onglets();
        return document.getElementById('cpb-c');
    }
    function carte(c) {
        var th = typeDe(c.type), pris = c.pris || 0, places = c.places || 1, pts = '', complet = pris >= places && !c.participe, md = c.ma_demande, attente = md && (md.etat === 'NOUVELLE' || md.etat === 'DISCUSSION');
        for (var i = 0; i < Math.min(places, 20); i++) pts += '<i class="' + (i < pris ? 'p' : '') + '"></i>';
        var etat, bouton;
        if (c.participe) { etat = '<span class="cpb-et ok">VOUS PARTICIPEZ</span>'; bouton = ''; }
        else if (attente) { etat = '<span class="cpb-et ' + (md.etat === 'NOUVELLE' ? 'att' : 'disc') + '">' + (md.etat === 'NOUVELLE' ? 'DEMANDE ENVOYÉE' : 'EN DISCUSSION') + '</span>'; bouton = '<button class="cpb-btn gr sm" onclick="edteamPublic.voirDemande(' + md.id + ')">VOIR</button>'; }
        else if (md && md.etat === 'REFUSEE') { etat = '<span class="cpb-et no">DEMANDE REFUSÉE</span>'; bouton = ''; }
        else if (complet) { etat = '<span class="cpb-et plein">COMPLÈTE</span>'; bouton = ''; }
        else { etat = '<span class="cpb-et ok">OUVERTE</span>'; bouton = '<button class="cpb-btn vt sm" onclick="edteamPublic.demander(' + c.id + ')">DEMANDER</button>'; }
        return '<article class="cpb-cc' + (complet ? ' complet' : '') + '" style="--c:' + th[1] + ';"><div class="cpb-ty"><span>' + esc(th[0]) + '</span><span>' + esc(il(c.publie_le).toUpperCase()) + '</span></div>'
            + '<div class="cpb-bd">' + blocId(c, urlImg('logos', c.logo), urlImg('photos', c.photo))
            + '<div class="cpb-tx"><h4>' + esc(c.titre) + '</h4><div class="cpb-ho"><span class="cpb-tag">' + esc(String(c.hote || '').slice(0, 8).toUpperCase()) + '</span> ' + esc(c.hote) + (c.amiral ? ' · Amiral ' + esc(c.amiral) : '') + '</div>'
            + '<p>' + esc(c.resume) + '</p></div>'
            + '<div class="cpb-dt"><div class="cpb-mt">' + chipsNatures(c.natures) + (c.langues || []).map(function (l) { return '<span>' + esc(LANGUES[l] || l) + '</span>'; }).join('') + (c.creneaux || []).map(function (x) { return '<span>' + esc(CRENEAUX[x] || x) + '</span>'; }).join('') + '</div>'
            + '<div class="cpb-pl"><span class="pt">' + pts + '</span>' + pris + ' / ' + places + ' places</div></div></div>'
            + '<div class="cpb-pied">' + etat + bouton + '</div></article>';
    }
    function vueRecrutent() {
        var z = coque(), l = P.liste, types = Object.keys(TYPES);
        var filtres = '<button class="cpb-puce' + (P.filtre === 'TOUTES' ? ' on' : '') + '" style="--c:#00FF66;" onclick="edteamPublic.filtrer(\'TOUTES\')">TOUTES · ' + l.length + '</button>'
            + types.filter(function (t) { return l.some(function (c) { return c.type === t; }); }).map(function (t) { return '<button class="cpb-puce' + (P.filtre === t ? ' on' : '') + '" style="--c:' + TYPES[t][1] + ';" onclick="edteamPublic.filtrer(\'' + t + '\')">' + TYPES[t][0] + '</button>'; }).join('');
        var vu = l.filter(function (c) { return P.filtre === 'TOUTES' || c.type === P.filtre; });
        z.innerHTML = '<div class="cpb-fl">' + filtres + '<span class="cpb-n">plus récentes d’abord</span></div>'
            + (vu.length ? '<div class="cpb-grille">' + vu.map(carte).join('') + '</div>'
                : '<div class="cpb-vide">' + (l.length ? 'Aucune campagne de ce thème.' : 'Aucune campagne ne recrute pour le moment.' + (estAmiral() && !sansEscadron() ? '<br>Publiez une campagne d’accueil : choisissez <b style="color:#00FF66;">FÉDÉRATION</b> à l’étape « Visibilité » de sa création.' : '<br>Revenez plus tard : les Amiraux publient leurs campagnes ici.')) + '</div>');
    }
    function pastilleOrigine(o) { return o.escadron ? '<span class="cpb-badge a">' + esc(o.escadron) + '</span>' : '<span class="cpb-badge s">INDÉPENDANT</span>'; }
    function lignesDemandes(l, recues) {
        if (!l.length) return '<div class="cpb-vide" style="margin:0;">' + (recues ? 'Aucune demande reçue.' : 'Vous n’avez fait aucune demande.<br>Parcourez « Campagnes qui recrutent ».') + '</div>';
        return l.map(function (d) {
            var e = ETATS[d.etat] || [d.etat, 'plein'], nom = recues ? d.nom : d.titre, sous = recues ? pastilleOrigine(d) + ' · rang BGS ' + (d.rang_bgs || 1) + ' · ' + esc(d.campagne) : esc(d.hote || '') + (d.type ? ' · ' + esc(typeDe(d.type)[0]) : '');
            return '<div class="cpb-dem' + (P.sel === d.id ? ' on' : '') + (d.non_lu ? ' nl' : '') + '" onclick="edteamPublic.ouvrirFil(' + d.id + ')"><div class="cpb-av ' + (recues ? (d.escadron ? 'a' : 's') : '') + '" style="' + (recues ? '' : '--c:#00FF66;') + '">' + esc(ini(nom)) + '</div>'
                + '<div><div class="n">' + esc(recues ? 'CMDR ' + String(nom || '?').replace(/^CMDR\s+/i, '').toUpperCase() : nom) + '</div><div class="m">' + sous + '</div></div><span class="cpb-et ' + e[1] + '">' + e[0] + '</span>'
                + (d.extrait ? '<div class="ex">« ' + esc(d.extrait) + '… »</div>' : '') + '</div>';
        }).join('');
    }
    function vueDemandes(recues) {
        var z = coque(), l = recues ? P.recues : P.mes;
        z.innerHTML = '<div class="cpb-duo"><div class="cpb-liste" id="cpb-liste">' + lignesDemandes(l, recues) + '</div><div class="cpb-droite" id="cpb-droite"><div class="cpb-vide" style="margin:0;">Sélectionnez une demande pour lire l’échange.</div></div></div>';
        if (P.sel && l.some(function (d) { return d.id === P.sel; })) ouvrirFil(P.sel); else if (l.length && window.innerWidth > 860) { P.sel = null; }
    }
    async function ouvrirFil(id) {
        P.sel = id;
        var recues = P.onglet === 'recues', l = document.getElementById('cpb-liste');
        if (l) l.innerHTML = lignesDemandes(recues ? P.recues : P.mes, recues);
        var r = await db().rpc('campagne_demande_fil', { p_demande: Number(id) }), f = r && r.data, z = document.getElementById('cpb-droite'); if (!z) return;
        if (!f || !f.demande || !f.pilote) { z.innerHTML = '<div class="cpb-vide" style="margin:0;">Échange introuvable.</div>'; return; }
        P.fil = f;
        var lst = recues ? P.recues : P.mes, ligne = lst.find(function (d) { return d.id === id; }); if (ligne) ligne.non_lu = false;
        dessinerFil(); majPastilles(true);
    }
    function dessinerFil() {
        var f = P.fil, z = document.getElementById('cpb-droite'); if (!f || !z) return;
        var d = f.demande, p = f.pilote, amiral = f.role === 'AMIRAL', ouvert = d.etat === 'NOUVELLE' || d.etat === 'DISCUSSION', e = ETATS[d.etat] || [d.etat, 'plein'], dernier = '';
        var msgs = (f.messages || []).map(function (m) {
            var moiCote = m.de === f.role, jour = new Date(m.le).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase(), sep = '';
            if (jour !== dernier) { sep = '<div class="cpb-info" style="text-align:center;letter-spacing:2px;">' + esc(jour) + '</div>'; dernier = jour; }
            return sep + '<div class="cpb-msg ' + (moiCote ? 'moi' : 'eux') + '">' + esc(m.texte) + '<small>' + esc(String(m.nom || '').replace(/^CMDR\s+/i, '').toUpperCase()) + ' · ' + esc(heure(m.le)) + '</small></div>';
        }).join('');
        var tete = amiral
            ? '<div class="cpb-fiche"><div class="cpb-av ' + (p.escadron ? 'a' : 's') + '">' + esc(ini(p.nom)) + '</div><div style="flex:1;min-width:0;"><div class="nom">CMDR ' + esc(String(p.nom || '?').replace(/^CMDR\s+/i, '').toUpperCase()) + '</div><div class="st">' + pastilleOrigine(p) + '<span class="cpb-badge" style="color:#8d8478;">RANG BGS ' + (p.rang_bgs || 1) + '</span>' + (p.inscrit_le ? '<span class="cpb-badge" style="color:#8d8478;">INSCRIT ' + esc(il(p.inscrit_le).toUpperCase()) + '</span>' : '') + (p.campagnes_aidees ? '<span class="cpb-med">⬡ ' + p.campagnes_aidees + ' CAMPAGNE' + (p.campagnes_aidees > 1 ? 'S' : '') + ' AIDÉE' + (p.campagnes_aidees > 1 ? 'S' : '') + '</span>' : '') + '</div></div><span class="cpb-et ' + e[1] + '">' + e[0] + '</span></div>'
            : '<div class="cpb-fiche"><div style="flex:1;min-width:0;"><div class="nom">' + esc(d.titre) + '</div><div class="st"><span class="cpb-tag">' + esc(String(d.hote || '').slice(0, 8).toUpperCase()) + '</span><span class="cpb-badge" style="color:#8d8478;">' + esc(d.hote) + '</span></div></div><span class="cpb-et ' + e[1] + '">' + e[0] + '</span></div>';
        var bas = '';
        if (ouvert) {
            bas = '<div class="cpb-compose"><textarea id="cpb-ecrire" maxlength="500" placeholder="' + (amiral ? 'Écrire à ce pilote…' : 'Écrire à l’Amiral…') + '"' + (f.peut_ecrire ? '' : ' disabled') + '></textarea><button class="cpb-btn cy" id="cpb-envoyer" onclick="edteamPublic.ecrire()"' + (f.peut_ecrire ? '' : ' disabled') + '>ENVOYER</button></div>'
                + '<div class="cpb-err" id="cpb-err">' + (f.peut_ecrire ? '' : 'Vous avez écrit deux fois de suite : attendez la réponse.') + '</div>'
                + (amiral
                    ? '<div class="cpb-decision"><div class="cpb-note">Accepter ouvre au pilote le mode invité (missions, journal, discussion de la campagne) ; l’Amiral de son escadron est informé. Refuser ne prévient que lui. Sans message pendant ' + d.jours_restants + ' j, l’échange est classé.</div><div style="display:flex;gap:8px;flex-wrap:wrap;"><button class="cpb-btn rg sm" onclick="edteamPublic.decider(false)">REFUSER</button><button class="cpb-btn gr sm" onclick="edteamPublic.clore()">CLORE</button><button class="cpb-btn vt" onclick="edteamPublic.decider(true)">ACCEPTER</button></div></div>'
                    : '<div class="cpb-decision"><div class="cpb-note">' + (sansEscadron() ? '' : 'Si vous êtes accepté, l’Amiral de votre escadron en est informé. ') + 'Sans message pendant ' + d.jours_restants + ' j, l’échange est classé.</div><button class="cpb-btn gr sm" onclick="edteamPublic.clore()">RETIRER MA DEMANDE</button></div>');
        } else {
            bas = '<div class="cpb-decision"><div class="cpb-note">' + (d.etat === 'ACCEPTEE' ? (amiral ? 'Ce pilote participe à la campagne.' : 'Vous participez à la campagne : retrouvez-la dans votre espace.') : 'Cet échange est terminé.') + '</div></div>';
        }
        z.innerHTML = tete + '<div class="cpb-fil" id="cpb-fil">' + msgs + '</div>' + bas;
        var fl = document.getElementById('cpb-fil'); if (fl) fl.scrollTop = fl.scrollHeight;
    }
    async function rafraichirListes() {
        var r = await Promise.all([db().rpc('campagnes_publiques'), db().rpc('mes_demandes'), (estAmiral() && !sansEscadron()) ? db().rpc('campagne_demandes_recues', { p_campagne: null }) : Promise.resolve({ data: [] })]);
        P.liste = Array.isArray(r[0].data) ? r[0].data : []; P.mes = Array.isArray(r[1].data) ? r[1].data : []; P.recues = Array.isArray(r[2].data) ? r[2].data : [];
        P.erreur = r[0].error || r[1].error;
    }
    function dessiner() {
        if (P.erreur) { var z = coque(); z.innerHTML = '<div class="cpb-vide">Impossible de charger les campagnes pour le moment (le script SQL 220 est-il lancé ?).</div>'; return; }
        if (P.onglet === 'recrutent') vueRecrutent(); else vueDemandes(P.onglet === 'recues');
    }

    // ---------------------------------------------------------------- ACTIONS
    async function ouvrirListe(onglet) {
        son('sonClic'); css(); P.onglet = onglet || 'recrutent'; P.sel = null; P.fil = null;
        var z = coque(); z.innerHTML = '<div class="cpb-vide">&gt; CHARGEMENT DES CAMPAGNES…</div>';
        await rafraichirListes(); await majPastilles(true); marquerVues(P.liste); dessiner();
    }
    async function majPastilles(force) {
        try {
            var r = await db().rpc('demandes_pastilles');
            if (r && r.data) P.pastilles = { amiral: Number(r.data.amiral) || 0, pilote: Number(r.data.pilote) || 0 };
        } catch (e) { /* rien */ }
        var t = document.getElementById('cpb-tabs'); if (t) t.innerHTML = onglets();
        majBoutons();
        return P.pastilles;
    }
    function majBoutons() {
        css();
        var n = (P.pastilles.amiral || 0) + (P.pastilles.pilote || 0);
        document.querySelectorAll('[data-cpb-pastille]').forEach(function (e) {
            e.textContent = n ? String(n) : ''; e.style.display = n ? 'inline-block' : 'none';
            var b = e.closest('button,a'); if (b) b.classList.toggle('cpb-clg', n > 0);   // le bouton clignote tant qu'un message attend
        });
    }
    function changerOnglet(o) {
        son('sonClic'); P.onglet = o; P.sel = null; P.fil = null;
        var t = document.getElementById('cpb-tabs'); if (t) t.innerHTML = onglets();
        dessiner();
    }
    function filtrer(f) { son('sonClic'); P.filtre = f; vueRecrutent(); }
    function demander(id) {
        if (!panneau()) { ouvrirListe('recrutent').then(function () { demander(id); }); return; }
        son('sonClic');
        var c = P.liste.find(function (x) { return x.id === id; }); if (!c) return;
        var th = typeDe(c.type), p = panneau(); if (!p) return;
        var v = document.createElement('div'); v.className = 'cpb-voile'; v.id = 'cpb-voile';
        v.innerHTML = '<div class="cpb-mod"><h3>DEMANDER À PARTICIPER</h3><div class="cpb-dm"><div>'
            + '<div style="border:1px solid rgba(0,255,102,.35);background:rgba(0,255,102,.04);padding:12px 12px 12px 14px;border-left:4px solid ' + th[1] + ';"><div class="cpb-ty" style="--c:' + th[1] + ';"><span>' + esc(th[0]) + '</span></div><h4 style="color:#fff;font-weight:normal;margin:6px 0;letter-spacing:1px;">' + esc(c.titre) + '</h4><div class="cpb-ho"><span class="cpb-tag">' + esc(String(c.hote || '').slice(0, 8).toUpperCase()) + '</span> ' + esc(c.hote) + (c.amiral ? ' · Amiral ' + esc(c.amiral) : '') + '</div></div>'
            + '<ul class="cpb-regles"><li><b>1</b><span>L’Amiral lit votre message, puis vous répondez chacun votre tour : un échange, pas un dossier à remplir.</span></li>'
            + '<li><b>2</b><span>Une demande par campagne (3 en attente au plus). Vous pouvez la retirer à tout moment.</span></li>'
            + '<li class="i"><b>i</b><span>Il voit votre nom de CMDR, votre rang BGS et votre escadron. Pas vos statistiques détaillées.</span></li>'
            + (sansEscadron() ? '' : '<li class="i"><b>i</b><span>Si vous êtes accepté, <b style="color:#00F0FF;">l’Amiral de votre escadron sera informé</b>. Il ne peut pas s’y opposer : à vous d’en parler avec lui.</span></li>') + '</ul></div>'
            + '<div><div class="cpb-champ" style="margin-top:0;"><label>VOTRE MESSAGE À L’AMIRAL <i>un mot suffit</i></label><textarea id="cpb-msg" class="cpb-zone" maxlength="500" placeholder="Dites bonjour et pourquoi cette campagne vous donne envie. Le reste se discute ensuite, ensemble." oninput="edteamPublic.compter(this)"></textarea>'
            + '<div class="cpb-cpt"><span>Quelques mots suffisent : l’Amiral vous répondra.</span><span id="cpb-cpt">0 / 500</span></div></div>'
            + '<div class="cpb-err" id="cpb-merr"></div><div class="cpb-bt"><button class="cpb-btn gr" onclick="document.getElementById(\'cpb-voile\').remove()">ANNULER</button><button class="cpb-btn vt" id="cpb-go" onclick="edteamPublic.envoyer(' + id + ')">ENVOYER LA DEMANDE</button></div></div></div></div>';
        p.querySelector('.cpb-p').appendChild(v);
        var t = document.getElementById('cpb-msg'); if (t) t.focus();
    }
    function compter(t) { var c = document.getElementById('cpb-cpt'); if (c) c.textContent = t.value.length + ' / 500'; }
    async function envoyer(id) {
        var t = document.getElementById('cpb-msg'), e = document.getElementById('cpb-merr'), b = document.getElementById('cpb-go'); if (!t) return;
        var m = t.value.trim(); if (m.length < 5) { e.textContent = ERR.MESSAGE_INVALIDE; return; }
        b.style.pointerEvents = 'none'; var ancien = b.textContent; b.textContent = 'TRANSMISSION…';
        var r = await db().rpc('campagne_demander', { p_campagne: Number(id), p_message: m });
        b.style.pointerEvents = 'auto'; b.textContent = ancien;
        if (r.error || r.data !== 'OK') { e.textContent = r.error ? 'Envoi impossible pour le moment.' : (ERR[r.data] || 'Envoi impossible.'); return; }
        son('sonSucces');
        var v = document.getElementById('cpb-voile'); if (v) v.remove();
        await rafraichirListes(); await majPastilles(true);
        var nouvelle = P.mes.find(function (d) { return d.campagne_id === id && (d.etat === 'NOUVELLE' || d.etat === 'DISCUSSION'); });
        P.onglet = 'mes'; P.sel = nouvelle ? nouvelle.id : null;
        var tb = document.getElementById('cpb-tabs'); if (tb) tb.innerHTML = onglets();
        dessiner();
    }
    function voirDemande(id) {
        if (!panneau()) { ouvrirListe('mes').then(function () { voirDemande(id); }); return; }
        P.onglet = 'mes'; P.sel = id; var tb = document.getElementById('cpb-tabs'); if (tb) tb.innerHTML = onglets(); dessiner(); }
    async function ecrire() {
        var t = document.getElementById('cpb-ecrire'), e = document.getElementById('cpb-err'), b = document.getElementById('cpb-envoyer'); if (!t || !P.fil) return;
        var m = t.value.trim(); if (!m) return;
        b.style.pointerEvents = 'none';
        var r = await db().rpc('campagne_demande_ecrire', { p_demande: P.fil.demande.id, p_texte: m });
        b.style.pointerEvents = 'auto';
        if (r.error || r.data !== 'OK') { if (e) e.textContent = r.error ? 'Envoi impossible pour le moment.' : (ERR[r.data] || 'Envoi impossible.'); return; }
        son('sonClic');
        await ouvrirFil(P.fil.demande.id);
    }
    async function decider(accepte) {
        if (!P.fil) return;
        var nom = P.fil.pilote.nom || 'ce pilote', id = P.fil.demande.id, ok = true;
        if (typeof window.demanderConfirmation === 'function') ok = await window.demanderConfirmation(accepte ? '✅ ACCEPTER CMDR ' + esc(String(nom).toUpperCase()) + ' ?' : '✖ REFUSER CMDR ' + esc(String(nom).toUpperCase()) + ' ?', accepte ? 'Il participera à la campagne (mode invité). L’Amiral de son escadron en sera informé.' : 'Seul ce pilote sera prévenu. Il ne pourra plus redemander cette campagne.', accepte ? '#00FF66' : '#FF3333');
        if (!ok) return;
        var r = await db().rpc('campagne_demande_decider', { p_demande: id, p_accepte: !!accepte });
        var e = document.getElementById('cpb-err');
        if (r.error || r.data !== 'OK') { if (e) e.textContent = r.error ? 'Action impossible pour le moment.' : (ERR[r.data] || 'Action impossible.'); return; }
        son(accepte ? 'sonSucces' : 'sonClic');
        await rafraichirListes(); await majPastilles(true); P.sel = id; dessiner();
    }
    async function clore() {
        if (!P.fil) return;
        var amiral = P.fil.role === 'AMIRAL', id = P.fil.demande.id, ok = true;
        if (typeof window.demanderConfirmation === 'function') ok = await window.demanderConfirmation(amiral ? '📦 CLORE CET ÉCHANGE ?' : '↩ RETIRER VOTRE DEMANDE ?', amiral ? 'La demande est classée sans décision. Le pilote pourra en faire une nouvelle.' : 'Votre demande sera retirée. Vous pourrez en refaire une plus tard.', '#00F0FF');
        if (!ok) return;
        var r = await db().rpc('campagne_demande_clore', { p_demande: id });
        if (r.error || r.data !== 'OK') { var e = document.getElementById('cpb-err'); if (e) e.textContent = ERR[r.data] || 'Action impossible.'; return; }
        son('sonClic'); await rafraichirListes(); await majPastilles(true); P.sel = id; dessiner();
    }

    // ---------------------------------------------------------------- ESPACE DE L'INDEPENDANT (page campagnes-publiques.html) : aucune fonction d'escadron, seulement les campagnes
    var espaceZone = null;
    function donneesFA(uid) {
        var cle = 'edteam_fa_v1_' + uid;
        try { var c = JSON.parse(sessionStorage.getItem(cle) || 'null'); if (c && Date.now() - c.ts < 600000) return Promise.resolve(c.d); } catch (e) { /* memoire illisible */ }
        return db().rpc('mes_freres_armes').then(function (r) { return (r && !r.error && r.data && typeof r.data === 'object') ? r.data : null; }, function () { return null; });
    }
    function bandeauHtml(fa) {
        var n = fa && Number(fa.n) || 0, nom = String(moi().cmdr_nom || '').replace(/^CMDR\s+/i, '').toUpperCase();
        var palier = n >= 100 ? '' : n >= 50 ? ' · prochain palier : diamant à 100' : n >= 30 ? ' · prochain palier : or à 50' : n > 0 ? ' · prochain palier : argent à 30' : '';
        return '<div class="bloc or"><div class="cpb-ban"><div class="cpb-medaille' + (n ? '' : ' vide') + '">' + (n ? '★' : '☆') + '</div><div class="id"><div class="nm">CMDR ' + esc(nom) + '</div>'
            + '<div class="sb">Pilote indépendant · ' + (n ? n + ' campagne' + (n > 1 ? 's' : '') + ' aidée' + (n > 1 ? 's' : '') + palier : 'aucune campagne aidée pour l’instant : la première vous vaut votre médaille de bronze') + '</div></div>'
            + (n ? '<button class="cpb-btn sm" style="--c:#FFD700;" onclick="ouvrirCarriere(\'fa\')">MES DIPLÔMES ▸</button>' : '') + '</div></div>';
    }
    function ligneCamp(c) {
        var t = typeDe(c.type_campagne);
        return '<div class="cpb-lc" style="--c:' + t[1] + ';"><i></i><div><div class="t">' + esc(c.nom) + '</div><div class="s">' + esc(c.escadron_id || '') + ' · ' + esc(t[0]) + '</div></div><span class="cpb-et ok">ACTIVE</span><button class="cpb-btn sm" onclick="location.href=\'bgs.html\'">OUVRIR</button></div>';
    }
    function ligneDem(d) {
        var e = ETATS[d.etat] || [d.etat, 'plein'], att = d.etat === 'NOUVELLE' || d.etat === 'DISCUSSION', t = typeDe(d.type);
        return '<div class="cpb-lc" style="--c:' + t[1] + ';"><i></i><div><div class="t">' + esc(d.titre) + (d.non_lu ? ' <span style="color:#FFD700;">●</span>' : '') + '</div><div class="s">' + esc(d.hote || '') + ' · ' + esc(il(d.maj_le)) + '</div></div><span class="cpb-et ' + e[1] + '">' + e[0] + '</span>'
            + (att || d.etat === 'ACCEPTEE' ? '<button class="cpb-btn cy sm" onclick="edteamPublic.voirDemande(' + d.id + ')">' + (att ? 'DIALOGUER' : 'VOIR') + '</button>' : '<span></span>') + '</div>';
    }
    async function monterEspace(zone) {
        css(); espaceZone = zone;
        window.__cpbFermeture = function () { if (espaceZone && document.body.contains(espaceZone)) monterEspace(espaceZone); };
        if (!zone.firstChild) zone.innerHTML = '<div class="cpb-vide">&gt; CHARGEMENT DES CAMPAGNES…</div>';
        var uid = moi().user_id, d = db();
        var r = await Promise.all([d.rpc('campagnes_publiques'), d.rpc('mes_demandes'), d.rpc('mes_invitations'), donneesFA(uid)]);
        var liste = Array.isArray(r[0].data) ? r[0].data : [], mes = Array.isArray(r[1].data) ? r[1].data : [], inv = r[2].data || {}, fa = r[3];
        var ids = (inv.participe || []).map(function (x) { return x.campagne_id; }), camps = [];
        if (ids.length) { var q = await d.from('campagnes').select('id, nom, type_campagne, escadron_id').in('id', ids); camps = (q && q.data) || []; }
        P.liste = liste; P.mes = mes; P.recues = []; P.erreur = r[0].error || r[1].error; marquerVues(liste);
        var recrutent = liste.filter(function (c) { return !c.participe; });
        zone.innerHTML = '<div class="cpb-esp">' + bandeauHtml(fa)
            + '<div class="deux"><div class="bloc"><h2>MES CAMPAGNES <em>en cours</em></h2>' + (camps.length ? camps.map(ligneCamp).join('') : '<div class="cpb-vide" style="margin:0;padding:18px 8px;">Vous ne participez à aucune campagne pour le moment.<br>Demandez à en rejoindre ci-dessous.</div>') + '</div>'
            + '<div class="bloc cy"><h2>MES DEMANDES</h2>' + (mes.length ? mes.map(ligneDem).join('') : '<div class="cpb-vide" style="margin:0;padding:18px 8px;">Aucune demande pour le moment.</div>') + '</div></div>'
            + '<div class="bloc vert"><h2>CAMPAGNES QUI RECRUTENT <em>' + recrutent.length + ' ouverte' + (recrutent.length > 1 ? 's' : '') + '</em>'
            + (recrutent.length > 6 ? ' <button class="cpb-btn vt sm" style="margin-left:auto;" onclick="edteamPublic.ouvrirListe()">VOIR TOUTES ▸</button>' : '') + '</h2>'
            + (P.erreur ? '<div class="cpb-vide">Impossible de charger les campagnes pour le moment.</div>' : recrutent.length ? '<div class="cpb-mini">' + recrutent.slice(0, 6).map(carte).join('') + '</div>' : '<div class="cpb-vide" style="margin:0;">Aucune campagne ne recrute pour le moment.<br>Revenez plus tard : les Amiraux publient leurs campagnes ici.</div>') + '</div></div>';
    }

    // ---------------------------------------------------------------- ANNONCE PLEIN ECRAN : une nouvelle campagne publique est ouverte (montree UNE fois par campagne et par pilote)
    // Declenchee par le fil de l'escadron (qg.html) : seulement s'il contient une ligne CAMPAGNE OUVERTE recente ; une seule requete (campagnes_publiques) ensuite.
    function cleAnnonce() { return 'edteam_cpb_annonce_vu_' + (moi().user_id || ''); }
    function annoncesVues() { try { return JSON.parse(localStorage.getItem(cleAnnonce()) || '[]'); } catch (e) { return []; } }
    function fermerAnnonce() { var a = document.getElementById('cpb-annonce'); if (a) a.remove(); document.removeEventListener('keydown', toucheAnnonce, true); }
    function toucheAnnonce(e) { if (e.key === 'Escape') { e.stopPropagation(); fermerAnnonce(); } }
    function annoncer(c, autres) {
        css(); fermerAnnonce();
        var th = typeDe(c.type), places = c.places || 1, pris = c.pris || 0, pts = '';
        for (var i = 0; i < Math.min(places, 20); i++) pts += '<i class="' + (i < pris ? 'p' : '') + '"></i>';
        var a = document.createElement('div'); a.id = 'cpb-annonce'; a.setAttribute('role', 'dialog'); a.setAttribute('aria-modal', 'true'); a.style.setProperty('--c', th[1]);
        a.innerHTML = '<div class="cpb-ann-c"><div class="cpb-ann-g"><div class="cpb-ann-lg"><span class="or"></span><div class="lg"><span>' + abrev(c.hote) + '</span>' + imgTag(urlImg('logos', c.logo)) + '</div></div>'
            + '<div class="cpb-ann-am"><div class="cpb-avi"><span>' + esc(ini(c.amiral)) + '</span>' + imgTag(urlImg('photos', c.photo)) + '</div><div><small>AMIRAL</small><b>' + esc(String(c.amiral || '—').replace(/^CMDR\s+/i, '').toUpperCase()) + '</b><small>' + esc(c.hote || '') + '</small></div></div></div>'
            + '<div class="cpb-ann-d"><div class="cpb-ann-e"><i></i>NOUVELLE CAMPAGNE PUBLIQUE</div><span class="cpb-ann-ty">' + esc(th[0]) + '</span>'
            + '<h2>' + esc(c.titre) + '</h2><q>' + esc(c.resume) + '</q>'
            + '<div class="cpb-mt">' + chipsNatures(c.natures) + (c.langues || []).map(function (l) { return '<span>' + esc(LANGUES[l] || l) + '</span>'; }).join('') + (c.creneaux || []).map(function (x) { return '<span>' + esc(CRENEAUX[x] || x) + '</span>'; }).join('') + '</div>'
            + '<div class="cpb-pl"><span class="pt">' + pts + '</span>' + pris + ' / ' + places + ' places</div>'
            + (autres ? '<div class="cpb-info">+ ' + autres + ' autre' + (autres > 1 ? 's' : '') + ' campagne' + (autres > 1 ? 's' : '') + ' ouverte' + (autres > 1 ? 's' : '') + ' en ce moment.</div>' : '')
            + '<div class="cpb-ann-b"><button class="cpb-btn gr" id="cpb-ann-non">PLUS TARD</button><button class="cpb-btn vt" id="cpb-ann-oui" style="--c:' + th[1] + ';">VOIR LA CAMPAGNE ▸</button></div></div></div>';
        document.body.appendChild(a);
        document.addEventListener('keydown', toucheAnnonce, true);
        document.getElementById('cpb-ann-non').onclick = function () { son('sonClic'); fermerAnnonce(); };
        document.getElementById('cpb-ann-oui').onclick = function () {
            fermerAnnonce();
            if (sansEscadron() && !/campagnes-publiques\.html/.test(location.pathname)) { location.href = 'campagnes-publiques.html'; return; }
            if (!sansEscadron() && !/bgs\.html/.test(location.pathname)) { location.href = 'bgs.html'; return; }
            ouvrirListe('recrutent');
        };
        son('sonSucces');
        try { document.getElementById('cpb-ann-oui').focus(); } catch (e) { /* rien */ }
    }
    // lignes = journal deja charge par la page (aucune requete pour le tester)
    async function annoncerDepuis(lignes) {
        try {
            if (document.getElementById('cpb-annonce') || !moi().user_id || !db()) return;
            var limite = Date.now() - 7 * 86400000;
            var recente = (lignes || []).some(function (l) { return l && String(l.type_action || '').indexOf('CAMPAGNE OUVERTE') >= 0 && new Date(l.created_at || l.date_action || 0).getTime() >= limite; });
            if (!recente) return;
            var r = await db().rpc('campagnes_publiques'), l = Array.isArray(r && r.data) ? r.data : [], vues = annoncesVues();
            var nouvelles = l.filter(function (c) { var md = c.ma_demande; return !c.participe && !(md && md.etat) && (c.pris || 0) < (c.places || 1) && vues.indexOf(c.id) < 0; });
            if (!nouvelles.length) return;
            var bloque = ['edteam-annonce', 'an-voile', 'gz-popup'].some(function (id) { var e = document.getElementById(id); return e && getComputedStyle(e).display !== 'none'; });
            if (bloque) return;   // une autre annonce est a l'ecran : on repassera a la prochaine ouverture
            try { localStorage.setItem(cleAnnonce(), JSON.stringify(vues.concat(nouvelles.map(function (c) { return c.id; })).slice(-200))); } catch (e) { /* stockage plein */ }
            P.liste = l;
            annoncer(nouvelles[0], Math.max(0, l.filter(function (c) { return !c.participe; }).length - 1));
        } catch (e) { /* une annonce ne doit jamais gener la page */ }
    }

    window.edteamPublic = {
        annoncerDepuis: annoncerDepuis, annoncer: annoncer, marquerVues: marquerVues,
        monterEspace: monterEspace,
        // etape « Visibilite » de la fenetre de campagne
        etapeHtml: etapeHtml, ficheHtml: ficheHtml, init: initVisibilite, valider: validerFiche, appliquer: appliquerVisibilite,
        estPublique: function () { return vis === 'FEDERATION'; },
        visibilite: function (v) { son('sonClic'); vis = v; dessinerVis(); },
        saisir: function (cle, v) { fiche[cle] = v; var n = document.getElementById('cpb-n-' + cle); if (n) n.textContent = v.length + ' / ' + (cle === 'titre' ? 50 : 140); majApercu(); },
        places: function (d) { son('sonClic'); fiche.places = Math.max(1, Math.min(50, fiche.places + d)); var e = document.getElementById('cpb-places'); if (e) e.textContent = fiche.places; majApercu(); },
        choisir: function (cle, k) { son('sonClic'); basculerListe(cle, k); dessinerVis(); },
        majApercu: majApercu,
        // liste, demandes, dialogue
        ouvrirListe: ouvrirListe, fermer: fermer, onglet: changerOnglet, filtrer: filtrer, demander: demander, compter: compter, envoyer: envoyer,
        voirDemande: voirDemande, ouvrirFil: ouvrirFil, ecrire: ecrire, decider: decider, clore: clore,
        pastilles: majPastilles
    };
})();
