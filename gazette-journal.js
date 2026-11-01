// EDTEAM NEWS : fenetre plein ecran des editions de l'escadron (kiosque de couvertures + lecture d'une edition), PC et mobile.
//   EdteamEdnews.ouvrir({ db, escadron, photoBase, apresLecture(id, estLaDerniere) })
// Les editions recentes (script SQL 183) ont un releve chiffre + un texte : elles sont mises en page par journal-edition.js.
// Les anciennes editions (texte HTML seul) restent lisibles : leur HTML est nettoye avant d'etre affiche.
// Lecture sobre : la liste n'a que quelques champs (jamais le texte) ; une edition n'est telechargee qu'a son ouverture.
(function () {
    'use strict';
    var ST = { opts: null, liste: [], i: -1, vue: 'kiosque' };
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
    function dateFr(iso) { var d = new Date(iso); if (isNaN(d)) return ''; var p = function (n) { return String(n).padStart(2, '0'); }; return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear(); }

    function css() {
        if (document.getElementById('ed-css')) return;
        var s = document.createElement('style'); s.id = 'ed-css';
        s.textContent = [
            ".ed-ov{position:fixed;inset:0;z-index:6000;background:rgba(0,0,0,.9);display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box;font-family:'Share Tech Mono',Consolas,monospace}",
            ".ed-fiche{width:100%;max-width:1240px;height:min(94vh,1100px);display:flex;flex-direction:column;border:1px solid #00F0FF;background:linear-gradient(180deg,#06101a,#04070b);box-shadow:0 0 40px rgba(0,240,255,.15)}",
            ".ed-fh{flex:none;display:flex;align-items:center;gap:12px;padding:12px 18px;border-bottom:1px solid #16303a;color:#00F0FF;letter-spacing:4px;font-size:.95em}.ed-fh h1{margin:0;font-size:1em;font-weight:normal;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
            ".ed-btn{border:1px solid #1f4650;color:#00F0FF;padding:5px 11px;font-size:.74em;letter-spacing:2px;cursor:pointer;user-select:none;white-space:nowrap}.ed-btn:hover{background:rgba(0,240,255,.1)}.ed-btn.off{opacity:.3;pointer-events:none}.ed-x{color:#00F0FF;font-weight:bold;cursor:pointer;padding:0 4px}",
            ".ed-corps{flex:1;min-height:0;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#1f5560 transparent}.ed-corps::-webkit-scrollbar{width:8px}.ed-corps::-webkit-scrollbar-thumb{background:#1f5560;border-radius:4px}",
            ".ed-kio{padding:20px}.ed-kio h2{font-size:.72em;letter-spacing:4px;color:#6f8590;font-weight:normal;margin:4px 0 14px}",
            ".ed-haut{display:flex;flex-wrap:wrap;gap:22px 28px;align-items:flex-start}.ed-edit{flex:0 1 560px;min-width:min(300px,100%)}.ed-anec{flex:1 1 320px;max-width:520px;min-width:min(300px,100%);max-height:340px;display:flex;flex-direction:column;border:1px solid #16303a;background:#070d13;padding:12px 14px 10px}.ed-anec h2{margin:0 0 10px!important;color:#00F0FF!important;flex:none}.ed-anec h2 em{font-style:normal;color:#5f7380;margin-left:6px}",
            ".ed-anl{flex:1;min-height:0;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#1f5560 transparent}.ed-anl .l{display:flex;gap:9px;align-items:center;padding:7px 3px;border-bottom:1px solid #0f1c24;cursor:pointer;color:#c3d3db;font-size:.8em;line-height:1.3}.ed-anl .l:hover{background:rgba(0,240,255,.07);color:#fff}.ed-anl .tg,.ed-an .tg{flex:none;border:1px solid;padding:0 5px;font-size:.62em;letter-spacing:1.5px;line-height:1.7}.ed-anl .tt{flex:1;min-width:0}.ed-anl .l b{flex:none;font-weight:normal;color:#5f7380;font-size:.85em}.ed-anp{flex:none;margin-top:8px;color:#566a75;font-size:.66em;line-height:1.5}",
            ".ed-an{max-width:780px;margin:0 auto;padding:26px 24px 44px;color:#c8d6dd;font-size:.98em;line-height:1.8}.ed-an .k{display:flex;gap:14px;align-items:center;color:#6f8590;font-size:.72em;letter-spacing:3px;margin-bottom:12px}.ed-an .k .n{margin-left:auto}.ed-an h3{margin:0 0 18px;padding-bottom:12px;border-bottom:1px solid #16303a;font:700 1.9em/1.15 'Rajdhani','Arial Narrow',sans-serif;color:#fff;text-transform:uppercase;letter-spacing:1px}.ed-an p{margin:0 0 14px}.ed-an .base{margin-top:24px;border-top:1px dashed #16303a;padding-top:10px;color:#6f8590;font-size:.74em;line-height:1.7}.ed-an .base b{color:#9fb3bd;font-weight:normal}.ed-an .sup{display:inline-block;margin-top:14px;border:1px solid #6b2a2a;color:#ff6b6b;font-size:.68em;letter-spacing:2px;padding:5px 10px;cursor:pointer}.ed-an .sup:hover{background:rgba(255,80,80,.1)}",
            ".ed-grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px}",
            ".ed-couv{border:1px solid #16303a;background:#091018;padding:10px;cursor:pointer;position:relative;transition:.15s}.ed-couv:hover{border-color:#00F0FF;box-shadow:0 0 18px rgba(0,240,255,.2)}.ed-couv.neuve{grid-column:span 2;border-color:#FF7100;box-shadow:0 0 22px rgba(255,113,0,.18)}",
            ".ed-couv .rub{position:absolute;top:-1px;left:-1px;background:#FF7100;color:#000;font-size:.62em;font-weight:bold;letter-spacing:2px;padding:2px 8px;z-index:2}",
            ".ed-mini{aspect-ratio:3/4;border:1px solid #1d3540;background:linear-gradient(180deg,#0b1a24,#060b10);padding:9px;display:flex;flex-direction:column;gap:6px;overflow:hidden}.ed-couv.neuve .ed-mini{aspect-ratio:auto;min-height:250px}",
            ".ed-mt{font:700 1.05em/1 'Rajdhani','Arial Narrow',sans-serif;letter-spacing:5px;color:#fff;text-align:center;border-bottom:2px solid #00F0FF;padding-bottom:4px}.ed-ms{font-size:.5em;letter-spacing:2px;color:#6f8590;text-align:center}",
            ".ed-mh{font:700 1em/1.15 'Rajdhani','Arial Narrow',sans-serif;color:#fff;text-transform:uppercase;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}.ed-couv.neuve .ed-mh{font-size:1.45em}",
            ".ed-mv{flex:1;min-height:40px;border:1px solid #1d3540;background:radial-gradient(circle at 50% 60%,rgba(0,240,255,.25),transparent 65%),repeating-linear-gradient(0deg,rgba(0,240,255,.05) 0 2px,transparent 2px 5px);display:flex;align-items:center;justify-content:center}",
            ".ed-cd{display:flex;justify-content:space-between;gap:8px;color:#6f8590;font-size:.68em;margin-top:8px;letter-spacing:1px}.ed-cd span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
            ".ed-arch{margin-top:26px;border-top:1px dashed #16303a;padding-top:14px}.ed-arch div.l{padding:8px 4px;border-bottom:1px solid #0f1c24;color:#8fa3ad;font-size:.8em;display:flex;gap:12px;cursor:pointer}.ed-arch div.l:hover{color:#fff}.ed-arch b{color:#6f8590;font-weight:normal;min-width:84px}",
            ".ed-vide{color:#667;font-style:italic;text-align:center;padding:50px 10px;line-height:1.8}",
            ".ed-ancien{padding:24px 28px;color:#ccc;line-height:1.8;font-size:1.02em;max-width:900px;margin:0 auto}.ed-ancien h3{color:#FF7100;letter-spacing:2px}",
            "@media(max-width:760px){.ed-ov{padding:0}.ed-fiche{max-width:none;height:100%;border:none}.ed-fh{padding:10px 12px;letter-spacing:2px}.ed-grille{grid-template-columns:1fr 1fr}.ed-couv.neuve{grid-column:span 2}.ed-kio{padding:14px}}"
        ].join('\n');
        document.head.appendChild(s);
    }

    // HTML d'une ancienne edition : sans script ni gestionnaire d'evenement
    function nettoyer(html) {
        try {
            var doc = new DOMParser().parseFromString('<div>' + String(html || '') + '</div>', 'text/html'), racine = doc.body.firstChild;
            [].forEach.call(racine.querySelectorAll('script,style,iframe,object,embed,link,meta,form'), function (e) { e.remove(); });
            [].forEach.call(racine.querySelectorAll('*'), function (e) { [].slice.call(e.attributes).forEach(function (a) { if (/^on/i.test(a.name) || /^\s*javascript:/i.test(a.value)) e.removeAttribute(a.name); }); });
            return racine.innerHTML;
        } catch (e) { return esc(html); }
    }
    var ART = [
        '<svg width="150" height="70" viewBox="0 0 150 70"><polyline points="0,60 20,48 40,52 60,30 80,36 100,16 120,22 150,6 150,70 0,70" fill="rgba(0,240,255,.15)" stroke="none"/><polyline points="0,60 20,48 40,52 60,30 80,36 100,16 120,22 150,6" fill="none" stroke="#00F0FF" stroke-width="2"/></svg>',
        '<svg width="70" height="50" viewBox="0 0 70 50"><rect x="6" y="20" width="10" height="26" fill="#00F0FF" opacity=".6"/><rect x="22" y="10" width="10" height="36" fill="#00F0FF" opacity=".6"/><rect x="38" y="26" width="10" height="20" fill="#00F0FF" opacity=".6"/><rect x="54" y="4" width="10" height="42" fill="#FF7100"/></svg>',
        '<svg width="70" height="50" viewBox="0 0 70 50"><circle cx="35" cy="25" r="18" fill="none" stroke="#00F0FF" stroke-width="3"/><circle cx="35" cy="25" r="9" fill="none" stroke="#FF7100" stroke-width="3"/></svg>',
        '<svg width="70" height="50" viewBox="0 0 70 50"><polygon points="35,4 66,46 4,46" fill="none" stroke="#00F0FF" stroke-width="3"/></svg>'
    ];
    function corps() { return document.getElementById('ed-corps'); }
    function titre(t) { var h = document.querySelector('#ednews-ov .ed-fh h1'); if (h) h.textContent = t; }

    function boutons(visibles, anec) {
        var b = document.getElementById('ed-back'), p = document.getElementById('ed-prev'), n = document.getElementById('ed-next');
        if (b) b.style.display = visibles ? '' : 'none'; if (p) p.style.display = visibles ? '' : 'none'; if (n) n.style.display = visibles ? '' : 'none';
        if (visibles) { var lst = anec ? ST.anec : ST.liste, k = anec ? ST.ia : ST.i; p.classList.toggle('off', k >= lst.length - 1); n.classList.toggle('off', k <= 0); }
    }

    function dessinerKiosque() {
        ST.vue = 'kiosque'; ST.i = -1; titre('▣ EDTEAM NEWS // KIOSQUE DE L\'ESCADRON'); boutons(false);
        var nouv = ST.liste.filter(function (g) { return g.au; }), anciennes = ST.liste.filter(function (g) { return !g.au; });
        var h = '<div class="ed-kio">';
        if (!ST.liste.length) h += '<div class="ed-vide">Aucune édition pour le moment.<br>La première paraît le jeudi, après le relevé hebdomadaire.</div>';
        if (nouv.length) {
            h += '<div class="ed-haut"><div class="ed-edit"><h2>&gt; ÉDITIONS</h2><div class="ed-grille">' + nouv.map(function (g, k) {
                var premiere = k === 0, i = ST.liste.indexOf(g);
                return '<div class="ed-couv' + (premiere ? ' neuve' : '') + '" data-i="' + i + '">' + (premiere ? '<span class="rub">DERNIÈRE ÉDITION</span>' : '')
                    + '<div class="ed-mini"><div class="ed-mt">EDTEAM NEWS</div><div class="ed-ms">BULLETIN OFFICIEL · N° ' + esc(g.numero || '') + '</div><div class="ed-mh">' + esc(g.titre) + '</div><div class="ed-mv">' + ART[(g.id || 0) % 4] + '</div></div>'
                    + '<div class="ed-cd"><span>' + esc(dateFr(g.created_at)) + '</span><span>' + (g.hero ? 'PILIER : ' + esc(String(g.hero).toUpperCase()) : '') + '</span></div></div>';
            }).join('') + '</div></div><aside class="ed-anec" id="ed-anec" style="display:none"></aside></div>';
        } else h += '<div class="ed-haut"><aside class="ed-anec" id="ed-anec" style="display:none"></aside></div>';
        if (!nouv.length && anciennes.length) h += '<div class="ed-vide" style="padding:26px 10px 8px">Les éditions mises en page de EDTEAM News paraîtront à partir du prochain jeudi.<br>Les éditions précédentes restent lisibles ci-dessous.</div>';
        if (anciennes.length) {
            h += '<div class="ed-arch"><h2>&gt; ANCIENNES ÉDITIONS (TEXTE)</h2>' + anciennes.map(function (g) { return '<div class="l" data-i="' + ST.liste.indexOf(g) + '"><b>' + esc(dateFr(g.created_at)) + '</b>' + esc(g.titre) + '</div>'; }).join('') + '</div>';
        }
        corps().innerHTML = h + '</div>'; corps().scrollTop = 0;
        [].forEach.call(corps().querySelectorAll('[data-i]'), function (e) { e.addEventListener('click', function () { lire(Number(e.getAttribute('data-i'))); }); });
        anecdotesKiosque();
    }

    var TON = { humour: ['HUMOUR', '#FFD700'], epique: ['ÉPIQUE', '#FF7100'], emotion: ['ÉMOTION', '#ff8fb0'], serieux: ['SÉRIEUX', '#00F0FF'] };
    function peutAnecdotes() { try { var p = window.profilCommandant; return !!(p && (p.est_amiral || p.est_directeur)); } catch (e) { return false; } }
    // lecture d'une anecdote DANS le kiosque (meme cadre que les editions : retour kiosque, fleches precedente / suivante), sans la liste dessous
    function lireAnecdote(k) {
        var a = ST.anec[k]; if (!a) return;
        ST.ia = k; ST.vue = 'anecdote'; titre('▣ EDTEAM NEWS // ANECDOTE DE L\'ESCADRON'); boutons(true, true);
        var t = TON[a.ton] || ['HISTOIRE', '#9fb3bd'];
        var paras = String(a.texte || '').split(/\n+/).filter(Boolean).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
        corps().innerHTML = '<div class="ed-an"><div class="k"><span class="tg" style="color:' + t[1] + ';border-color:' + t[1] + '">' + t[0] + '</span><span>' + esc(dateFr(a.created_at)) + '</span><span class="n">' + (k + 1) + ' / ' + ST.anec.length + '</span></div>'
            + '<h3>' + esc(a.titre) + '</h3>' + paras
            + '<div class="base"><b>Fait réel :</b> ' + esc(a.fait || '') + ' · CMDR ' + esc(String(a.cmdr_nom || '').toUpperCase()) + '<br>Histoire écrite par une IA à partir de ce fait ; le reste est de la fiction.</div>'
            + (peutAnecdotes() && window.EDTEAMAnecdotes ? '<div class="sup" id="ed-an-sup">SUPPRIMER CETTE ANECDOTE</div>' : '') + '</div>';
        corps().scrollTop = 0;
        var s = document.getElementById('ed-an-sup');
        if (s) s.addEventListener('click', async function () { await window.EDTEAMAnecdotes.supprimer(Number(a.id)); dessinerKiosque(); });
    }

    // ANECDOTES DE L'ESCADRON : la liste (la plus recente en haut) a cote des editions ; un clic ouvre l'anecdote en entier (anecdotes.js). Une lecture legere a l'ouverture du kiosque ; rien si aucune anecdote.
    async function anecdotesKiosque() {
        try {
            if (!window.EDTEAMAnecdotes || !ST.opts || !ST.opts.db) return;
            var r = await ST.opts.db.rpc('anecdotes_escadron', { p_limite: 30 });
            var z = document.getElementById('ed-anec');
            if (!z || ST.vue !== 'kiosque' || !r || r.error || !Array.isArray(r.data) || !r.data.length) return;
            ST.anec = r.data;
            z.innerHTML = '<h2>&gt; ANECDOTES DE L’ESCADRON <em>' + r.data.length + '</em></h2><div class="ed-anl">' + r.data.map(function (a, i) { var t = TON[a.ton] || ['', '#9fb3bd']; return '<div class="l" data-an="' + i + '"><span class="tg" style="color:' + t[1] + ';border-color:' + t[1] + '">' + t[0] + '</span><span class="tt">' + esc(a.titre) + '</span><b>' + esc(dateFr(a.created_at).slice(0, 5)) + '</b></div>'; }).join('') + '</div><div class="ed-anp">Histoires écrites par une IA à partir de faits réels de l’escadron.</div>';
            z.style.display = '';
            [].forEach.call(z.querySelectorAll('[data-an]'), function (e) { e.addEventListener('click', function () { lireAnecdote(Number(e.getAttribute('data-an'))); }); });
        } catch (e) { /* le kiosque reste utilisable sans les anecdotes */ }
    }

    // FRERES D'ARMES : encart « Ils nous ont aides » (SQL 205) = les pilotes d'autres escadrons qui ont agi sur les campagnes de l'escadron pendant la PERIODE DE L'EDITION.
    // Sans les scripts SQL, ou sans aide d'allies cette semaine-la, rien n'est ajoute : l'edition reste identique.
    async function encartAllies(rel, idx) {
        try {
            var r = await ST.opts.db.rpc('gazette_allies', { p_escadron: ST.opts.escadron, p_du: rel.du, p_au: rel.au });
            if (ST.i !== idx || !r || r.error || !Array.isArray(r.data) || !r.data.length) return;
            var par = {}, ordre = [];
            r.data.forEach(function (x) { var k = x.nom; if (!par[k]) { par[k] = { nom: x.nom, escadron: x.escadron, camps: [] }; ordre.push(k); } if (par[k].camps.indexOf(x.campagne) < 0) par[k].camps.push(x.campagne); });
            if (!document.getElementById('ed-fa-css')) { var st = document.createElement('style'); st.id = 'ed-fa-css';
                st.textContent = '.fa-enc { margin:22px 0 4px; border:1px solid rgba(62,201,255,.45); border-left:4px solid #3ec9ff; background:linear-gradient(90deg,rgba(62,201,255,.09),rgba(62,201,255,.02)); padding:14px 18px 10px; font-family:"Share Tech Mono",Consolas,monospace; }'
                    + '.fa-enc .k { color:#3ec9ff; font-size:10px; letter-spacing:4px; } .fa-enc .t { color:#fff; font-size:16px; letter-spacing:1.5px; margin:5px 0 10px; }'
                    + '.fa-enc .l { display:flex; align-items:center; gap:12px; padding:8px 0; border-top:1px solid rgba(255,255,255,.07); font-size:13px; color:#c8d2d9; } .fa-enc .l:first-of-type { border-top:0; }'
                    + '.fa-enc .av { flex:none; width:32px; height:32px; border-radius:50%; background:#16202a; border:2px solid #3ec9ff; display:grid; place-items:center; font-size:10px; color:#9fb3c4; } .fa-enc .av.s { border-color:#ffb347; }'
                    + '.fa-enc .l b { color:#fff; letter-spacing:1px; font-weight:normal; } .fa-enc .l em { margin-left:auto; text-align:right; color:#7d8a95; font-style:normal; font-size:11px; line-height:1.5; }';
                document.head.appendChild(st); }
            var nb = ordre.length;
            var h = '<div class="fa-enc"><div class="k">ILS NOUS ONT AIDÉS</div><div class="t">' + nb + ' allié' + (nb > 1 ? 's' : '') + ' au service de l’escadron cette semaine-là</div>'
                + ordre.map(function (k) { var p = par[k], ini = String(p.nom || '?').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 2) || '?';
                    return '<div class="l"><span class="av' + (p.escadron ? '' : ' s') + '">' + esc(ini) + '</span><b>CMDR ' + esc(String(p.nom || '?').toUpperCase()) + '</b><em>' + esc(p.escadron || 'solitaire') + '<br>' + p.camps.map(function (c) { return '« ' + esc(c) + ' »'; }).join(' · ') + '</em></div>'; }).join('') + '</div>';
            var pied = corps().querySelector('.pied'), racine = corps().querySelector('.jn');
            if (pied) pied.insertAdjacentHTML('beforebegin', h); else if (racine) racine.insertAdjacentHTML('beforeend', h);
        } catch (e) { /* l'encart ne doit jamais gener la lecture de l'edition */ }
    }
    async function lire(i) {
        var g = ST.liste[i]; if (!g) return;
        ST.i = i; ST.vue = 'edition'; titre('▣ EDTEAM NEWS · ' + (g.numero ? 'ÉDITION N° ' + g.numero : dateFr(g.created_at))); boutons(true);
        corps().innerHTML = '<div class="ed-vide">Déchiffrement de l\'édition…</div>';
        var r;
        try { r = await ST.opts.db.from('gazette_hebdo').select(g.au ? 'titre, contenu, created_at, numero, releve, texte' : 'titre, contenu, created_at').eq('id', g.id).maybeSingle(); }
        catch (e) { r = { error: e }; }
        if (ST.i !== i) return;
        if (r.error || !r.data) { corps().innerHTML = '<div class="ed-vide">Erreur de liaison réseau. Réessayez.</div>'; return; }
        var d = r.data;
        if (d.releve && window.EdteamJournal) corps().innerHTML = '<div class="ed-edition">' + window.EdteamJournal.rendre(d.releve, d.texte || {}, { numero: d.numero, photoBase: ST.opts.photoBase }) + '</div>';
        else corps().innerHTML = '<div class="ed-ancien"><h3>' + esc(d.titre) + '</h3><div style="color:#778;font-size:.8em;margin-bottom:14px">ÉDITION DU ' + esc(dateFr(d.created_at)) + '</div>' + nettoyer(d.contenu) + '</div>';
        if (d.releve && d.releve.du && d.releve.au && ST.opts.escadron) encartAllies(d.releve, i);
        corps().scrollTop = 0;
        try { if (ST.opts.apresLecture) ST.opts.apresLecture(g.id, i === 0); } catch (e) { /* rien */ }
    }

    function fermer() {
        var v = document.getElementById('ednews-ov'); if (v) v.remove();
        document.documentElement.style.overflow = ''; document.removeEventListener('keydown', touche); ST.opts = null;
    }
    function touche(e) {
        if (e.key === 'Escape') { if (ST.vue === 'edition' || ST.vue === 'anecdote') dessinerKiosque(); else fermer(); }
        else if (ST.vue === 'anecdote' && e.key === 'ArrowLeft' && ST.ia < ST.anec.length - 1) lireAnecdote(ST.ia + 1);
        else if (ST.vue === 'anecdote' && e.key === 'ArrowRight' && ST.ia > 0) lireAnecdote(ST.ia - 1);
        else if (ST.vue === 'edition' && e.key === 'ArrowLeft' && ST.i < ST.liste.length - 1) lire(ST.i + 1);
        else if (ST.vue === 'edition' && e.key === 'ArrowRight' && ST.i > 0) lire(ST.i - 1);
    }

    async function ouvrir(opts) {
        css(); if (document.getElementById('ednews-ov')) return;
        ST = { opts: opts, liste: [], i: -1, vue: 'kiosque', anec: [], ia: -1 };
        if (typeof window.sonClic === 'function') window.sonClic();
        var v = document.createElement('div'); v.id = 'ednews-ov'; v.className = 'ed-ov';
        v.addEventListener('click', function (e) { if (e.target === v) fermer(); });
        v.innerHTML = '<div class="ed-fiche"><div class="ed-fh"><span class="ed-btn" id="ed-back">◀ KIOSQUE</span><h1></h1><span class="ed-btn" id="ed-prev" title="Édition précédente">◀</span><span class="ed-btn" id="ed-next" title="Édition suivante">▶</span><span class="ed-x" id="ed-x">X</span></div><div class="ed-corps" id="ed-corps"><div class="ed-vide">Chargement…</div></div></div>';
        document.body.appendChild(v); document.documentElement.style.overflow = 'hidden'; document.addEventListener('keydown', touche);
        document.getElementById('ed-x').addEventListener('click', fermer); document.getElementById('ed-back').addEventListener('click', dessinerKiosque);
        document.getElementById('ed-prev').addEventListener('click', function () { if (ST.vue === 'anecdote') { if (ST.ia < ST.anec.length - 1) lireAnecdote(ST.ia + 1); return; } if (ST.i < ST.liste.length - 1) lire(ST.i + 1); });
        document.getElementById('ed-next').addEventListener('click', function () { if (ST.vue === 'anecdote') { if (ST.ia > 0) lireAnecdote(ST.ia - 1); return; } if (ST.i > 0) lire(ST.i - 1); });
        titre('▣ EDTEAM NEWS // KIOSQUE DE L\'ESCADRON'); boutons(false);
        var q = function (cols) { var r = ST.opts.db.from('gazette_hebdo').select(cols).order('created_at', { ascending: false }).limit(60); return ST.opts.escadron ? r.eq('escadron_id', ST.opts.escadron) : r; };
        var res;
        try {
            res = await q('id, semaine_id, titre, created_at, numero, au:releve->>au, hero:releve->honneur->0->>cmdr_nom');
            if (res.error) res = await q('id, semaine_id, titre, created_at');      // colonnes pas encore creees (script SQL 183) : anciennes editions seules
        } catch (e) { res = { error: e }; }
        if (!document.getElementById('ednews-ov')) return;
        if (res.error) { corps().innerHTML = '<div class="ed-vide">Impossible de lire les éditions pour le moment.<br>Réessayez dans quelques instants.</div>'; return; }
        ST.liste = res.data || [];
        dessinerKiosque();
    }
    window.EdteamEdnews = { ouvrir: ouvrir, fermer: fermer };
})();
