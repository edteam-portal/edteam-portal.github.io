// EDTEAM NEWS : mise en page d'une edition hebdomadaire de l'escadron a partir de son RELEVE CHIFFRE (snap) et du TEXTE redige par l'IA (texte).
//   EdteamJournal.rendre(snap, texte, opts) -> html (a mettre dans un conteneur) ; la feuille de style est injectee une fois.
//   snap  : releve calcule par le serveur (chiffres, guerres, honneur, campagnes, jours, nouveaux, titres, pilier, croises, stations, pilotes)
//   texte : { titre, chapo, article: [paragraphes], mot (une phrase sur le heros), note (note de la redaction) } ; tout est facultatif : une rubrique sans texte se passe de texte.
//   opts  : { numero, photoBase (url publique du dossier des photos), titres (nom des titres du mur des specialistes) }
// Les chiffres affiches viennent UNIQUEMENT du releve ; le texte de l'IA est toujours echappe (jamais de HTML venant de l'IA).
(function () {
    'use strict';
    var PORTRAITS = { 'aisling duval': 'aisling-duval', 'archon delaine': 'archon-delaine', 'a. lavigny-duval': 'a-lavigny-duval', 'arissa lavigny-duval': 'a-lavigny-duval', 'denton patreus': 'denton-patreus', 'edmund mahon': 'edmund-mahon', 'felicia winters': 'felicia-winters', 'li yong-rui': 'li-yong-rui', 'pranav antal': 'pranav-antal', 'zemina torval': 'zemina-torval', 'nakato kaine': 'nakato-kaine', 'yuri grom': 'yuri-grom', 'jerome archer': 'jerome-archer' };
    var COL = ['#FF7100', '#00F0FF', '#00FF66', '#B07CFF', '#FFB000', '#FF4a85', '#4DA3FF'];
    var TITRES = { SEC: ['LE FER DE LANCE', 'Sécurité', '#00F0FF'], LOG: ['MAÎTRE LOGISTICIEN', 'Missions', '#FF7100'], ECO: ['LE MAGNAT', 'Économie', '#00FF66'], BAT: ['LE BÂTISSEUR', 'Colonisation', '#FFD700'], SCI: ["L'EXPERT SCIENTIFIQUE", 'Science', '#B026FF'], EXE: ["L'EXÉCUTEUR", 'Opérations noires', '#FF3333'], GUE: ['SEIGNEUR DE GUERRE', 'Conflits', '#FF9A3C'], ESP: ["L'ESPION", 'Renseignement', '#C9D1DB'] };
    var TYPES = { CONQUETE: 'CONQUÊTE', ATTAQUE: 'ATTAQUE', DEFENSE: 'DÉFENSE', MAINTIEN: 'MAINTIEN', COLONISATION: 'COLONISATION' };
    var MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'], JOURS = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
    var nf = new Intl.NumberFormat('fr-FR');
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
    function abrege(n) { n = Number(n) || 0; if (n >= 1e9) return (n / 1e9).toFixed(1).replace('.', ',') + ' Md'; if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',') + ' M'; return nf.format(Math.round(n)); }
    function delta(c, p, inverse) {
        c = Number(c) || 0; p = Number(p) || 0;
        if (!p) return c ? '<span>▲ nouveau</span>' : '<span class="n">—</span>';
        var d = Math.round((c - p) / p * 100); if (d === 0) return '<span class="n">= stable</span>';
        var bon = inverse ? d < 0 : d > 0;
        return '<span class="' + (bon ? '' : 'n') + '">' + (d > 0 ? '▲ +' : '▼ −') + Math.abs(d) + ' % vs semaine dernière</span>';
    }
    function ini(nom) { var m = String(nom || '?').replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/); return ((m[0] || '?')[0] + (m[1] ? m[1][0] : (m[0] || '?')[1] || '')).toUpperCase(); }
    function couleur(uid) { var h = 0, s = String(uid || ''); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return COL[h % COL.length]; }
    function pnom(snap, uid) { var p = (snap.pilotes || {})[uid]; return p ? p.n : '?'; }
    function av(snap, o, uid, taille, nom) {
        var p = (snap.pilotes || {})[uid] || {}, n = nom || p.n || '?', url = p.p && o.photoBase ? o.photoBase + p.p : '';
        return '<span class="av" style="--s:' + (taille || 46) + 'px;--c:' + couleur(uid || n) + '" title="' + esc(n) + '"><span>' + esc(ini(n)) + '</span>' + (url ? '<img src="' + esc(url) + '" alt="" loading="lazy" decoding="async" onerror="this.remove()">' : '') + '</span>';
    }
    function dateCourte(iso) { var d = new Date(iso); return isNaN(d) ? '' : d.getDate() + ' ' + MOIS[d.getMonth()]; }
    function jourLong(iso) { var d = new Date(iso); return isNaN(d) ? '' : ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][d.getDay()]; }

    // ---------- feuille de style (une seule fois) ----------
    function css() {
        if (document.getElementById('jn-css')) return;
        var s = document.createElement('style'); s.id = 'jn-css';
        s.textContent = [
            ".jn{--cy:#00F0FF;--or:#FF7100;--gr:#00FF66;--rd:#FF4a4a;--am:#FFB000;--ln:#16303a;--pn:#091018;--mu:#6f8590;container-type:inline-size;padding:22px 26px 28px;color:#cfd8dc;font-family:'Share Tech Mono',Consolas,monospace;background:radial-gradient(ellipse at 50% -10%,rgba(0,240,255,.10),transparent 55%),repeating-linear-gradient(0deg,rgba(255,255,255,.012) 0 1px,transparent 1px 3px)}",
            ".jn *{box-sizing:border-box}.jn h2,.jn h3,.jn h4,.jn h5{font-weight:700}",
            ".jn .mast{border-top:3px double var(--cy);border-bottom:1px solid var(--cy);padding:10px 0 8px;position:relative;text-align:center}.jn .mast .l,.jn .mast .r{position:absolute;top:12px;font-size:.62em;letter-spacing:2px;color:var(--mu);line-height:1.6;text-align:left}.jn .mast .l{left:0}.jn .mast .r{right:0;text-align:right}",
            ".jn .mast h2{margin:0;font:700 3.1em/1 'Rajdhani','Arial Narrow',sans-serif;letter-spacing:14px;color:#fff;text-shadow:0 0 22px rgba(0,240,255,.5);padding-left:14px}.jn .mast h2 em{font-style:normal;color:var(--cy)}.jn .mast .sub{font-size:.66em;letter-spacing:5px;color:var(--or);margin-top:4px}",
            ".jn .tampon{display:inline-block;border:2px solid var(--gr);color:var(--gr);padding:2px 8px;font-size:.9em;transform:rotate(-4deg);letter-spacing:2px;margin-top:2px}",
            ".jn .tick{display:flex;align-items:center;gap:14px;overflow:hidden;border-bottom:1px solid var(--ln);padding:6px 0;color:var(--cy);font-size:.68em;letter-spacing:2px}.jn .tick>span{color:var(--mu);flex:none}.jn .tkw{flex:1;min-width:0;overflow:hidden}.jn .tkr{display:inline-flex;white-space:nowrap;animation:jnTick 55s linear infinite}.jn .tkr:hover{animation-play-state:paused}.jn .tkr em{font-style:normal;padding-right:60px}@keyframes jnTick{from{transform:translateX(0)}to{transform:translateX(-50%)}}@media (prefers-reduced-motion:reduce){.jn .tkr{animation:none}}",
            ".jn .sec{margin-top:22px}.jn .rub-t{display:flex;align-items:center;gap:10px;margin:0 0 10px;font-size:.7em;letter-spacing:4px;color:var(--or)}.jn .rub-t:after{content:'';flex:1;height:1px;background:linear-gradient(90deg,var(--or),transparent)}.jn .rub-t i{font-style:normal;color:var(--mu);letter-spacing:2px}",
            ".jn .une{display:grid;grid-template-columns:1.55fr 1fr;gap:22px;margin-top:18px}.jn .une h3{margin:0 0 6px;font:700 2.2em/1.03 'Rajdhani','Arial Narrow',sans-serif;color:#fff;text-transform:uppercase;letter-spacing:.5px}",
            ".jn .kick{color:var(--or);letter-spacing:4px;font-size:.68em;margin-bottom:6px}.jn .by{color:var(--mu);font-size:.66em;letter-spacing:2px;border-top:1px solid var(--ln);border-bottom:1px solid var(--ln);padding:5px 0;margin:8px 0 12px}",
            ".jn .chapo{font:italic 1.12em/1.5 Georgia,'Times New Roman',serif;color:#e8eef0;margin:0 0 10px}.jn .corps{columns:2;column-gap:22px;column-rule:1px solid var(--ln);font:.92em/1.62 Georgia,'Times New Roman',serif;color:#b9c7cc;text-align:justify;hyphens:auto}",
            ".jn .corps p{margin:0 0 9px}.jn .corps p:first-child:first-letter{float:left;font:700 3.3em/.8 'Rajdhani',sans-serif;color:var(--cy);padding:4px 7px 0 0}",
            ".jn .visu{border:1px solid var(--ln);background:var(--pn);position:relative;overflow:hidden}.jn .visu .cap{padding:7px 10px;font-size:.64em;color:var(--mu);letter-spacing:1px;border-top:1px solid var(--ln)}",
            ".jn .pw{height:270px;position:relative;overflow:hidden;background:radial-gradient(circle at 50% 70%,rgba(0,240,255,.2),transparent 60%),#050a0f}.jn .pw img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%}.jn .pw:before{content:'';position:absolute;inset:0;z-index:2;pointer-events:none;background:linear-gradient(0deg,rgba(4,7,11,.92) 0,rgba(4,7,11,.15) 46%,transparent 70%),repeating-linear-gradient(0deg,rgba(0,240,255,.07) 0 2px,transparent 2px 5px)}.jn .pw .pn{position:absolute;left:14px;right:14px;bottom:10px;z-index:3}.jn .pw .pn small{display:block;color:var(--cy);font-size:.6em;letter-spacing:3px}.jn .pw .pn b{display:block;color:#fff;font:700 1.55em/1.1 'Rajdhani',sans-serif;letter-spacing:4px;text-shadow:0 0 14px rgba(0,240,255,.5)}.jn .holo{height:220px;background:radial-gradient(circle at 50% 70%,rgba(0,240,255,.28),transparent 60%),repeating-linear-gradient(0deg,rgba(0,240,255,.06) 0 2px,transparent 2px 6px);display:flex;align-items:center;justify-content:center;position:relative}.jn .holo:after{content:'HOLOGRAMME';position:absolute;left:8px;top:6px;font-size:.55em;letter-spacing:2px;color:var(--cy);opacity:.7}",
            ".jn .chif{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.jn .tuile{border:1px solid var(--ln);background:var(--pn);padding:9px 10px;border-left:3px solid var(--k,var(--cy))}.jn .tuile small{display:block;color:var(--mu);font-size:.58em;letter-spacing:2px}.jn .tuile b{display:block;color:#fff;font:700 1.75em/1.1 'Rajdhani',sans-serif;margin-top:3px}.jn .tuile span{font-size:.62em;color:var(--gr)}.jn .tuile span.n{color:var(--rd)}",
            ".jn .g2{display:grid;grid-template-columns:1fr 1fr;gap:20px}.jn .g3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}",
            ".jn .box{border:1px solid var(--ln);background:var(--pn);padding:14px;position:relative;min-width:0}.jn .box:before,.jn .box:after{content:'';position:absolute;width:10px;height:10px;border:2px solid var(--cy)}.jn .box:before{top:-1px;left:-1px;border-right:0;border-bottom:0}.jn .box:after{bottom:-1px;right:-1px;border-left:0;border-top:0}",
            ".jn .av{--s:46px;display:inline-flex;align-items:center;justify-content:center;width:var(--s);height:calc(var(--s)*1.1);clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);background:linear-gradient(135deg,var(--c),#111);color:#fff;font:700 calc(var(--s)*.36) 'Rajdhani',sans-serif;letter-spacing:1px;flex:none;position:relative;overflow:hidden}.jn .av>span{position:relative;z-index:1}.jn .av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:2}",
            ".jn .avs{display:flex;align-items:center}.jn .avs .av{margin-left:-9px;--s:30px;filter:drop-shadow(0 0 1px #000)}.jn .avs .av:first-child{margin-left:0}.jn .plus{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;margin-left:-6px;border:1px solid var(--ln);border-radius:50%;font-size:.62em;color:var(--mu);background:#050a0f}",
            ".jn .pastille{font-size:.58em;border:1px solid;padding:1px 6px;letter-spacing:1.5px;white-space:nowrap}",
            ".jn .hero{display:flex;gap:16px;align-items:flex-start}.jn .hero .gros{--s:96px;filter:drop-shadow(0 0 14px rgba(255,176,0,.45))}.jn .hero h4{margin:0;color:#fff;font:700 1.5em/1 'Rajdhani',sans-serif;letter-spacing:3px}.jn .hero .mot{display:block;font:italic .88em/1.45 Georgia,serif;color:#c9d6da;margin:8px 0}",
            ".jn .st3{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px}.jn .st3 div{border:1px solid var(--ln);padding:6px 8px;min-width:0}.jn .st3 small{display:block;color:var(--mu);font-size:.55em;letter-spacing:1.5px}.jn .st3 b{color:var(--am);font:700 1.2em 'Rajdhani',sans-serif}",
            ".jn .ruban{display:inline-block;background:var(--am);color:#000;font-size:.62em;font-weight:bold;letter-spacing:3px;padding:2px 10px;margin-bottom:8px}",
            ".jn .guerre{border:1px solid var(--ln);padding:10px 12px;margin-bottom:9px;background:rgba(255,255,255,.015);border-left:3px solid var(--k)}.jn .guerre .t{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.jn .guerre .t b{color:#fff;letter-spacing:2px}.jn .guerre .sc{margin-left:auto;font:700 1.5em 'Rajdhani',sans-serif;color:var(--k)}.jn .duel{height:8px;background:#2a1212;display:flex;margin:8px 0 6px}.jn .duel i{display:block;height:100%}.jn .guerre .leg{font-size:.62em;color:var(--mu)}",
            ".jn .camp{display:flex;gap:14px;align-items:center;padding:10px 0;border-bottom:1px dashed var(--ln)}.jn .camp:last-of-type{border:0}.jn .camp .nm{flex:1;min-width:0}.jn .camp .nm b{display:block;color:#fff;letter-spacing:1.5px;font-size:.86em;overflow-wrap:anywhere}.jn .camp .nm small{color:var(--mu);font-size:.62em}",
            ".jn .anneau{width:60px;height:60px;flex:none;position:relative}.jn .anneau svg{width:100%;height:100%;transform:rotate(-90deg)}.jn .anneau b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:700 1.05em 'Rajdhani',sans-serif;color:#fff}",
            ".jn .cl{display:flex;align-items:center;gap:10px;margin:8px 0}.jn .cl .rg{width:18px;color:var(--mu);font:700 1.1em 'Rajdhani'}.jn .cl .nm{width:110px;color:#fff;font-size:.76em;letter-spacing:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.jn .cl .bb{flex:1;height:9px;background:#0f1a22}.jn .cl .bb i{display:block;height:100%;background:linear-gradient(90deg,var(--cy),#0a6);box-shadow:0 0 8px rgba(0,240,255,.5)}.jn .cl .vl{min-width:70px;text-align:right;color:var(--cy);font-size:.76em}",
            ".jn .rec{display:flex;gap:11px;align-items:center;padding:8px 0;border-bottom:1px dashed var(--ln)}.jn .rec:last-child{border:0}.jn .rec b{color:#fff;font-size:.82em;letter-spacing:1px}.jn .rec small{display:block;color:var(--mu);font-size:.62em}.jn .bienv{margin-left:auto;border:1px solid #3a2a00;color:var(--am);font-size:.62em;padding:3px 8px;white-space:nowrap}",
            ".jn .compt{display:flex;gap:14px;margin-bottom:8px}.jn .compt div{flex:1;text-align:center;border:1px solid var(--ln);padding:8px}.jn .compt b{display:block;color:var(--gr);font:700 1.7em 'Rajdhani'}.jn .compt small{color:var(--mu);font-size:.58em;letter-spacing:1.5px}",
            ".jn .dist{display:flex;gap:12px;align-items:center;padding:8px 0;border-bottom:1px dashed var(--ln)}.jn .dist:last-child{border:0}.jn .medaille{width:40px;height:52px;flex:none}.jn .dist b{color:#fff;font-size:.8em;letter-spacing:1.5px}.jn .dist small{display:block;color:var(--mu);font-size:.64em;line-height:1.5}",
            ".jn .brv{padding:8px 0;border-bottom:1px dashed var(--ln);font-size:.76em;color:#aab9be;line-height:1.5}.jn .brv:last-child{border:0}.jn .brv b{color:var(--cy);font-weight:normal}.jn .brv i{font-style:normal;color:var(--or);letter-spacing:2px;font-size:.78em;margin-right:6px}",
            ".jn .jnote{border:2px double #4a3a00;background:linear-gradient(135deg,rgba(255,176,0,.07),transparent 60%);padding:14px 16px;display:flex;gap:16px;align-items:flex-start}.jn .sceau{width:60px;height:60px;flex:none}.jn .jnote h5{margin:0 0 6px;color:var(--am);letter-spacing:4px;font-size:.78em;font-weight:normal}.jn .jnote p{margin:0;font:italic .95em/1.55 Georgia,serif;color:#d7dde0}.jn .jnote .sg{margin-top:8px;color:var(--mu);font-size:.65em;letter-spacing:2px}",
            ".jn .agenda div{display:flex;gap:12px;align-items:center;padding:7px 0;border-bottom:1px dashed var(--ln);font-size:.78em;color:#aab9be}.jn .agenda div:last-child{border:0}.jn .agenda b{color:var(--cy);min-width:50px;letter-spacing:1px}",
            ".jn .vide{color:#667;font-style:italic;font-size:.76em;padding:6px 0}",
            ".jn .pied{margin-top:24px;border-top:3px double var(--cy);padding-top:10px;display:flex;justify-content:space-between;gap:16px;color:var(--mu);font-size:.6em;letter-spacing:1.5px;line-height:1.7;flex-wrap:wrap}.jn svg text{font-family:'Share Tech Mono',monospace}",
            ".jn .box{display:flex;flex-direction:column}.jn .box>.rub-t{flex:none}.jn .bx{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding-right:8px;scrollbar-width:thin;scrollbar-color:#1f5560 transparent}.jn .bx::-webkit-scrollbar{width:6px}.jn .bx::-webkit-scrollbar-thumb{background:#1f5560;border-radius:3px}.jn .bx::-webkit-scrollbar-track{background:transparent}",
            ".jn .fx{align-items:stretch}.jn .fx>.box,.jn .fx>.jnote{max-height:var(--hmax,440px);min-height:var(--hmin,0px)}.jn .fx>.jnote{align-self:stretch}",
            ".jn .hcard{display:flex;gap:14px;align-items:flex-start;padding:10px 12px;border:1px solid var(--ln);border-left:3px solid var(--k);background:rgba(255,255,255,.015);margin-bottom:10px}.jn .hcard .av{--s:78px;filter:drop-shadow(0 0 12px var(--k))}.jn .hcard h4{margin:0;color:#fff;font:700 1.25em/1 'Rajdhani',sans-serif;letter-spacing:3px}.jn .hcard .ty{color:var(--k);font-size:.6em;letter-spacing:3px;margin-bottom:4px}.jn .hcard .gros{font:700 1.9em/1 'Rajdhani',sans-serif;color:var(--k)}.jn .hcard .mot{display:block;font:italic .84em/1.45 Georgia,serif;color:#c9d6da;margin:6px 0}.jn .hcard .st3 b{color:var(--k)}",
            "@container (max-width:760px){.jn .fx>.box{max-height:470px;min-height:0}.jn .fx>.jnote{max-height:none}.jn .hcard{flex-direction:column;align-items:center;text-align:center}}",
            "@container (max-width:760px){.jn{padding:14px 14px 22px}.jn .mast h2{font-size:2.05em;letter-spacing:7px;padding-left:7px}.jn .mast .l,.jn .mast .r{display:none}.jn .tick{font-size:.6em}.jn .une,.jn .g2,.jn .g3{grid-template-columns:1fr}.jn .une h3{font-size:1.6em}.jn .corps{columns:1}.jn .holo{height:170px}.jn .hero{flex-direction:column;align-items:center;text-align:center}.jn .hero .gros{--s:84px}.jn .cl .nm{width:84px}.jn .jnote{flex-direction:column;align-items:center;text-align:center}}"
        ].join('\n');
        document.head.appendChild(s);
    }

    // ---------- petits dessins ----------
    function medaille(c) { return '<svg class="medaille" viewBox="0 0 42 54"><path d="M12 0h18l-4 20H16z" fill="' + c + '" opacity=".55"/><circle cx="21" cy="34" r="16" fill="#0b1118" stroke="' + c + '" stroke-width="2.5"/><circle cx="21" cy="34" r="11" fill="none" stroke="' + c + '" stroke-width="1" stroke-dasharray="2 3"/><polygon points="21,26 24,32 31,33 26,38 27,45 21,41 15,45 16,38 11,33 18,32" fill="' + c + '"/></svg>'; }
    function anneau(p, c) { var r = 26, L = 2 * Math.PI * r; p = Math.max(0, Math.min(100, Math.round(p))); return '<div class="anneau"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="' + r + '" fill="none" stroke="#14232c" stroke-width="7"/><circle cx="32" cy="32" r="' + r + '" fill="none" stroke="' + c + '" stroke-width="7" stroke-dasharray="' + (L * p / 100) + ' ' + L + '"/></svg><b>' + p + '%</b></div>'; }
    var VAISSEAU = '<svg width="250" height="165" viewBox="0 0 260 170"><g fill="none" stroke="#00F0FF" stroke-width="1.6" stroke-linejoin="round"><polygon points="130,10 160,70 215,110 215,128 165,118 150,150 130,140 110,150 95,118 45,128 45,110 100,70"/><polyline points="130,10 130,140"/><polyline points="100,70 160,70"/><polygon points="118,48 142,48 150,70 110,70" fill="rgba(0,240,255,.18)"/><ellipse cx="130" cy="156" rx="50" ry="8" opacity=".4"/></g><g fill="#FF7100"><circle cx="118" cy="145" r="3"/><circle cx="142" cy="145" r="3"/></g></svg>';
    function visuel(snap, o) {
        var nom = snap.puissance || (snap.elan && snap.elan.puissance) || '', slug = PORTRAITS[String(nom).trim().toLowerCase().replace(/\s+/g, ' ')] || '';
        if (!slug) return '<div class="visu"><div class="holo">' + VAISSEAU + '</div><div class="cap">▣ Illustration holographique.</div></div>';
        return '<div class="visu"><div class="pw"><img src="' + esc((o.imgBase || 'images/powers/') + slug + '.webp') + '" alt="Portrait de ' + esc(nom) + '" loading="lazy" onerror="this.remove()"><div class="pn"><small>PUISSANCE SOUTENUE PAR L\'ESCADRON</small><b>' + esc(String(nom).toUpperCase()) + '</b></div></div><div class="cap">▣ ' + esc(nom) + ' · Powerplay</div></div>';
    }
    var SCEAU = '<svg class="sceau" viewBox="0 0 64 64"><circle cx="32" cy="32" r="29" fill="none" stroke="#FFB000" stroke-width="2"/><circle cx="32" cy="32" r="23" fill="none" stroke="#FFB000" stroke-width="1" stroke-dasharray="3 3"/><polygon points="32,12 38,26 53,27 41,37 45,52 32,44 19,52 23,37 11,27 26,26" fill="#FFB000" opacity=".9"/></svg>';

    // ---------- rubriques ----------
    function etatGuerre(g) { if (g.evenement === 'FIN') return g.resultat === 'GAGNEE' ? ['VICTOIRE', '#00FF66'] : ['DÉFAITE', '#FF4a4a']; return ['EN COURS', '#FFB000']; }
    function rubGuerres(snap) {
        var l = (snap.guerres || []).slice().sort(function (a, b) { var ea = a.evenement === 'FIN' ? 1 : 0, eb = b.evenement === 'FIN' ? 1 : 0; return (ea - eb) || (new Date(b.detecte_le) - new Date(a.detecte_le)); }).slice(0, 6);
        if (!l.length) return '<div class="vide">Aucun conflit relevé cette semaine.</div>';
        return l.map(function (g) {
            var e = etatGuerre(g), a = Number(g.score_pour), b = Number(g.score_contre), sc = g.score_pour == null ? '—' : a + ' – ' + b, duel = g.score_pour == null || (a + b) === 0 ? 0 : Math.round(100 * a / (a + b));
            return '<div class="guerre" style="--k:' + e[1] + '"><div class="t"><b>' + esc(g.systeme) + '</b><span class="pastille" style="color:' + e[1] + '">' + e[0] + '</span><span style="color:var(--mu);font-size:.66em">' + (g.genre === 'ELECTION' ? 'élection' : 'guerre') + (g.adversaire ? ' · contre ' + esc(g.adversaire) : '') + '</span><span class="sc">' + sc + '</span></div>'
                + (duel ? '<div class="duel"><i style="width:' + duel + '%;background:' + e[1] + '"></i></div>' : '') + '<div class="leg">' + esc(dateCourte(g.detecte_le)) + '</div></div>';
        }).join('');
    }
    function rubCampagnes(snap, o) {
        var eff = Number((snap.chiffres || {}).effectif) || 1;
        var l = (snap.campagnes || []).filter(function (c) { return c.nb_part > 0 || c.statut === 'ACTIVE'; }).sort(function (a, b) { return (b.nb_part - a.nb_part) || (b.nb_actions - a.nb_actions); }).slice(0, 5);
        if (!l.length) return '<div class="vide">Aucune campagne active cette semaine.</div>';
        return l.map(function (c) {
            var p = Math.round(100 * c.nb_part / eff), col = c.nb_part === 0 ? '#FF4a4a' : p >= 50 ? '#00FF66' : '#FFB000';
            var ids = (c.pilotes || []).slice(0, 4), plus = c.nb_part - ids.length;
            return '<div class="camp">' + anneau(p, col) + '<div class="nm"><b>' + esc(c.nom) + '</b><small>' + esc(TYPES[c.type_campagne] || c.type_campagne) + ' · ' + c.nb_actions + ' action' + (c.nb_actions > 1 ? 's' : '') + (c.echeance ? ' · échéance ' + esc(dateCourte(c.echeance)) : '') + (c.statut !== 'ACTIVE' ? ' · clôturée' : '') + '</small>'
                + '<div class="avs" style="margin-top:6px">' + ids.map(function (u) { return av(snap, o, u, 30); }).join('') + (plus > 0 ? '<span class="plus">+' + plus + '</span>' : '') + '</div></div></div>';
        }).join('') + '<div style="margin-top:8px;font-size:.64em;color:var(--mu)">Anneau : part des pilotes de l\'escadron ayant agi sur la campagne cette semaine.</div>';
    }
    function rubHonneur(snap, o) {
        var l = snap.honneur || [], max = l.length ? Number(l[0].pts) || 1 : 1;
        return l.map(function (t, i) { return '<div class="cl"><span class="rg">' + (i + 1) + '</span>' + av(snap, o, t.user_id, 30) + '<span class="nm">' + esc(t.cmdr_nom) + '</span><span class="bb"><i style="width:' + Math.max(4, Math.round(100 * t.pts / max)) + '%"></i></span><span class="vl">' + nf.format(t.pts) + ' pts</span></div>'; }).join('') || '<div class="vide">Pas assez de données.</div>';
    }
    function rubJours(snap) {
        var j = snap.jours || [], max = Math.max.apply(null, j.map(function (x) { return x.n; }).concat([1])), pic = 0; j.forEach(function (x, i) { if (x.n > j[pic].n) pic = i; });
        var W = 300, step = W / Math.max(j.length, 1), bw = step * .62;
        return '<svg viewBox="0 0 ' + W + ' 92" width="100%" height="92"><g>' + j.map(function (x, i) { var h = Math.round(58 * x.n / max), xx = 6 + i * step; return '<rect x="' + xx + '" y="6" width="' + bw + '" height="62" fill="#0f1a22"/><rect x="' + xx + '" y="' + (68 - h) + '" width="' + bw + '" height="' + h + '" fill="' + (i === pic ? '#FF7100' : '#00F0FF') + '"/><text x="' + (xx + bw / 2) + '" y="82" fill="#6f8590" font-size="9" text-anchor="middle">' + JOURS[new Date(x.j + 'T12:00:00').getDay()] + '</text><text x="' + (xx + bw / 2) + '" y="' + (64 - h) + '" fill="#cfd8dc" font-size="9" text-anchor="middle">' + x.n + '</text>'; }).join('') + '</g></svg>'
            + '<div style="font-size:.64em;color:var(--mu)">Pilotes actifs par jour · pic le ' + esc(jourLong(j[pic] && j[pic].j + 'T12:00:00')) + ' (' + (j[pic] ? j[pic].n : 0) + ')</div>';
    }
    function rubNouveaux(snap, o) {
        var n = snap.nouveaux || [];
        return '<div class="compt"><div><b>+' + n.length + '</b><small>DANS L\'ESCADRON</small></div><div><b>+' + (snap.reseau_nouveaux || 0) + '</b><small>SUR LE RÉSEAU</small></div></div>'
            + (n.map(function (x) { return '<div class="rec">' + av(snap, o, x.user_id, 38, x.nom) + '<div><b>CMDR ' + esc(String(x.nom).toUpperCase()) + '</b><small>a rejoint l\'escadron ' + esc(jourLong(x.le)) + '</small></div><span class="bienv">BIENVENUE</span></div>'; }).join('') || '<div class="vide">Aucune arrivée cette semaine.</div>');
    }
    function rubDistinctions(snap, o) {
        var h = '', p = snap.pilier;
        if (p && p.cmdr_nom) h += '<div class="dist">' + medaille('#FFB000') + '<div><b>PILIER DE LA SEMAINE</b><small>CMDR ' + esc(String(p.cmdr_nom).toUpperCase()) + ' · ' + esc(p.attribut || '') + '</small></div></div>';
        (snap.titres || []).forEach(function (t) { var m = TITRES[t.code] || [t.code, '', '#00F0FF']; h += '<div class="dist">' + medaille(m[2]) + '<div><b>' + esc(m[0]) + '</b><small>CMDR ' + esc(String(t.nom).toUpperCase()) + ' prend le titre' + (t.second ? ', devant ' + esc(t.second) : '') + '.</small></div></div>'; });
        return h || '<div class="vide">Aucun changement de titre.</div>';
    }
    function rubBreves(snap) {
        var h = '', c = snap.croises || {};
        (snap.stations || []).slice(0, 2).forEach(function (s) { h += '<div class="brv"><i>STATION</i><b>' + esc(String(s.station_nom || '').replace(/^(Orbital|Planetary|Surface) Construction Site: /i, '')) + '</b> est opérationnelle (' + esc(s.systeme_nom) + ').</div>'; });
        if (c.nb) h += '<div class="brv"><i>CROISÉS</i><b>' + c.nb + ' joueurs</b> croisés cette semaine' + ((c.exemples || [])[0] ? ', dont le CMDR <b>' + esc(c.exemples[0].cmdr) + '</b> à ' + esc(c.exemples[0].systeme) : '') + '.</div>';
        h += '<div class="brv"><i>TICK</i>Prochaine édition : <b>jeudi</b>, après le relevé hebdomadaire.</div>';
        return h;
    }
    function rubAgenda(snap) {
        var l = (snap.campagnes || []).filter(function (c) { return c.statut === 'ACTIVE' && c.echeance; }).sort(function (a, b) { return String(a.echeance).localeCompare(String(b.echeance)); }).slice(0, 4);
        return '<div class="agenda">' + (l.map(function (c) { return '<div><b>' + esc(dateCourte(c.echeance)) + '</b>Échéance : ' + esc(c.nom) + '</div>'; }).join('') || '<div>Aucune échéance en vue.</div>') + '</div>';
    }

    // ---------- l'edition ----------
    function bloc(titre, num, contenu) { return '<div class="box"><div class="rub-t">' + titre + ' <i>· ' + num + '</i></div><div class="bx">' + contenu + '</div></div>'; }
    function rubHeros(snap, o, texte) {
        var hero = (snap.honneur || [])[0], pilier = snap.pilier && hero && snap.pilier.cmdr_nom === hero.cmdr_nom ? snap.pilier : null, elan = snap.elan, h = '';
        if (hero) {
            h += '<div class="hcard" style="--k:#FFB000"><span>' + av(snap, o, hero.user_id, 78) + '</span><div style="min-width:0"><div class="ty">★ PILIER DE LA SEMAINE · EFFORT BGS</div><h4>CMDR ' + esc(String(hero.cmdr_nom).toUpperCase()) + '</h4>'
                + (pilier ? '<span class="pastille" style="color:#FFB000">' + esc(pilier.attribut) + '</span>' : '') + (texte.mot ? '<span class="mot">' + esc(texte.mot) + '</span>' : '')
                + '<div class="st3"><div><small>POINTS</small><b>' + nf.format(hero.pts) + '</b></div><div><small>LOGISTIQUE</small><b>' + abrege(hero.log) + '</b></div><div><small>INFLUENCE</small><b>' + nf.format(hero.inf) + '</b></div></div></div></div>';
        }
        if (elan && elan.cmdr_nom) {
            h += '<div class="hcard" style="--k:#FF4FD8"><span>' + av(snap, o, elan.user_id, 78) + '</span><div style="min-width:0"><div class="ty">⚡ ÉLAN POWERPLAY · PROGRÈS DES MÉRITES</div><h4>CMDR ' + esc(String(elan.cmdr_nom).toUpperCase()) + '</h4>'
                + '<div class="gros">+' + (Math.round(Number(elan.progres_pct) * 10) / 10).toLocaleString('fr-FR') + ' %</div>'
                + '<span class="mot">de mérites en plus sur le cycle' + (elan.puissance ? ', au service de ' + esc(elan.puissance) : '') + '.</span>'
                + '<div class="st3"><div><small>GAIN</small><b>' + nf.format(elan.gain) + '</b></div><div><small>DÉPART</small><b>' + abrege(elan.base) + '</b></div><div><small>ARRIVÉE</small><b>' + abrege(Number(elan.base) + Number(elan.gain)) + '</b></div></div></div></div>';
        } else h += '<div class="hcard" style="--k:#FF4FD8"><div><div class="ty">⚡ ÉLAN POWERPLAY</div><div class="vide">Pas d\'Élan Powerplay cette semaine.</div></div></div>';
        return h || '<div class="vide">Pas de héros cette semaine.</div>';
    }
    function rendre(snap, texte, opts) {
        css(); opts = opts || {}; texte = texte || {}; snap = snap || {};
        var ch = snap.chiffres || {}, gagnes = (snap.guerres || []).filter(function (g) { return g.evenement === 'FIN' && g.resultat === 'GAGNEE'; }).length, hero = (snap.honneur || [])[0];
        var corps = (texte.article || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
        var nn = (snap.nouveaux || []).length;
        var bande = ['◈ ' + gagnes + ' CONFLIT' + (gagnes > 1 ? 'S' : '') + ' REMPORTÉ' + (gagnes > 1 ? 'S' : ''), '◈ ' + abrege(ch.log_c) + ' CR DE LOGISTIQUE', '◈ ' + nn + ' NOUVEAU' + (nn > 1 ? 'X' : '') + ' PILOTE' + (nn > 1 ? 'S' : '') + ' DANS L\'ESCADRON', hero ? '◈ ' + String(hero.cmdr_nom).toUpperCase() + ', PILIER DE LA SEMAINE' : '', snap.elan && snap.elan.cmdr_nom ? '◈ ' + String(snap.elan.cmdr_nom).toUpperCase() + ', ÉLAN POWERPLAY' : ''].filter(Boolean).join('  ');
        return '<div class="jn">'
            + '<div class="mast"><div class="l">N° ' + esc(opts.numero || '') + '<br>SEMAINE DU ' + esc(dateCourte(snap.du).toUpperCase()) + ' AU ' + esc(dateCourte(snap.au).toUpperCase()) + '</div><div class="r"><span class="tampon">ÉDITION CERTIFIÉE</span><br>SOURCE : RELEVÉS DES PILOTES</div>'
            + '<h2>EDTEAM <em>NEWS</em></h2><div class="sub">BULLETIN OFFICIEL DE L\'ESCADRON ' + esc(String(snap.escadron || '').toUpperCase()) + '</div></div>'
            + '<div class="tick"><span>À LA UNE ▸</span><div class="tkw"><div class="tkr"><em>' + esc(bande) + '</em><em>' + esc(bande) + '</em></div></div></div>'
            + '<div class="une"><div><div class="kick">▌ À LA UNE · OPÉRATIONS</div><h3>' + esc(texte.titre || 'Édition de la semaine') + '</h3><div class="by">PAR LA RÉDACTION EDTEAM · D\'APRÈS LES RELEVÉS OFFICIELS DE L\'ESCADRON</div>'
            + (texte.chapo ? '<p class="chapo">' + esc(texte.chapo) + '</p>' : '') + (corps ? '<div class="corps">' + corps + '</div>' : '') + '</div>'
            + '<div>' + visuel(snap, opts)
            + '<div class="chif"><div class="tuile" style="--k:#00FF66"><small>CONFLITS GAGNÉS</small><b>' + gagnes + '</b><span>sur ' + (snap.guerres || []).filter(function (g) { return g.evenement === 'FIN'; }).length + ' conclus</span></div>'
            + '<div class="tuile" style="--k:#FF7100"><small>INFLUENCE (MISSIONS)</small><b>' + nf.format(ch.inf_c || 0) + '</b>' + delta(ch.inf_c, ch.inf_p) + '</div>'
            + '<div class="tuile" style="--k:#00F0FF"><small>LOGISTIQUE</small><b>' + abrege(ch.log_c) + ' CR</b>' + delta(ch.log_c, ch.log_p) + '</div>'
            + '<div class="tuile" style="--k:#B07CFF"><small>PILOTES ACTIFS</small><b>' + (ch.act_c || 0) + ' / ' + (ch.effectif || 0) + '</b>' + delta(ch.act_c, ch.act_p) + '</div></div></div></div>'
            + '<div class="g2 sec fx" style="--hmax:420px">' + bloc('HÉROS DE LA SEMAINE', '01', rubHeros(snap, opts, texte)) + bloc('RÉSULTATS DES GUERRES', '02', rubGuerres(snap)) + '</div>'
            + '<div class="g2 sec fx" style="--hmax:440px">' + bloc('PARTICIPATION AUX CAMPAGNES', '03', rubCampagnes(snap, opts)) + bloc("TABLEAU D'HONNEUR", '04', rubHonneur(snap, opts) + '<div class="rub-t" style="margin-top:16px">ACTIVITÉ PAR JOUR <i>· 7 j</i></div>' + rubJours(snap)) + '</div>'
            + '<div class="g3 sec fx" style="--hmax:300px">' + bloc('NOUVEAUX SUR EDTEAM', '05', rubNouveaux(snap, opts)) + bloc('DISTINCTIONS', '06', rubDistinctions(snap, opts)) + bloc('BRÈVES DU SECTEUR', '07', rubBreves(snap)) + '</div>'
            + '<div class="g2 sec fx" style="--hmax:220px">' + (texte.note ? '<div class="jnote">' + SCEAU + '<div><h5>NOTE DE LA RÉDACTION</h5><p>' + esc(texte.note) + '</p><div class="sg">— LA RÉDACTION EDTEAM</div></div></div>' : '<div></div>')
            + bloc("À L'AGENDA", '08', rubAgenda(snap)) + '</div>'
            + '<div class="pied"><span>EDTEAM NEWS · ÉDITION N° ' + esc(opts.numero || '') + '<br>Rédigé à partir des relevés officiels de l\'escadron.</span><span>LES CHIFFRES SONT CALCULÉS PAR LE SERVEUR ET FIGÉS À L\'IMPRESSION.<br>SEUL LE TEXTE DES ARTICLES EST RÉDIGÉ PAR L\'IA.</span></div></div>';
    }
    window.EdteamJournal = { rendre: rendre, css: css };
})();
