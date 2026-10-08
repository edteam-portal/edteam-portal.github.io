// ANECDOTES RP DE L'ESCADRON : module partage (QG sur PC, accueil mobile). Une courte histoire ecrite par l'IA a partir d'un FAIT REEL d'un pilote actif (3 a 4 par semaine).
// Lecture : rpc anecdote_du_jour (la derniere des 5 derniers jours) et anecdotes_escadron (archive, 30 jours), reservees aux membres de l'escadron (SQL 60).
// Le texte vient de l'IA : il est TOUJOURS affiche echappe (aucun HTML). Memoire de session de 10 minutes.
(function () {
    'use strict';
    const CLE = 'edteam_anecdote_v1', DUREE = 1800000;
    const TON = { humour: ['HUMOUR', '#FFD700'], epique: ['ÉPIQUE', '#FF7100'], emotion: ['ÉMOTION', '#ff8fb0'], serieux: ['SÉRIEUX', '#00F0FF'] };
    let client = null;
    const bd = () => client || window.supabaseApp || null;
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const ton = t => TON[t] || ['ANECDOTE', '#FF7100'];
    const dateFr = iso => { const d = new Date(iso); if (isNaN(d)) return ''; const p = n => String(n).padStart(2, '0'); return p(d.getDate()) + '/' + p(d.getMonth() + 1); };
    const paragraphes = t => String(t || '').split(/\n+/).filter(Boolean).map(l => '<p>' + esc(l) + '</p>').join('');

    function css() {
        if (document.getElementById('edteam-anecdotes-css')) return;
        const st = document.createElement('style');
        st.id = 'edteam-anecdotes-css';
        st.textContent = [
            '.an-fil{position:absolute;right:16px;bottom:-34px;font-size:9em;line-height:1;color:#FF7100;opacity:.06;pointer-events:none;z-index:0}',
            '.an-bande>.an-corps{position:relative;z-index:1}',
            '.an-bande:before{z-index:5}',
            '.an-lueur{position:absolute;inset:0;pointer-events:none;z-index:4;box-shadow:inset 0 0 22px rgba(255,113,0,.26),inset 0 0 0 1px rgba(255,113,0,.24)}',
            '.an-bande{display:flex;gap:0;align-items:stretch;padding:0;min-height:128px;cursor:pointer;transition:filter .2s}',
            '.an-bande:hover{filter:brightness(1.22)}',
            '.an-port{flex:none;width:118px;position:relative;overflow:hidden;border-right:1px solid rgba(255,113,0,.55);background:radial-gradient(circle at 50% 30%,#4a2608,#07090b 80%);display:flex;align-items:center;justify-content:center;font-size:2.1em;font-weight:bold;color:#ffab66}',
            '.an-port img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top center;display:block}',
            '.an-port:after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,transparent 55%,rgba(5,3,1,.7)),linear-gradient(0deg,rgba(5,3,1,.55),transparent 32%)}',
            '.an-corps{flex:1;min-width:0;padding:14px 20px;display:flex;flex-direction:column;gap:6px}',
            '.an-k{display:flex;align-items:center;gap:10px;flex-wrap:wrap}',
            '.an-k b{letter-spacing:4px;font-size:.78em;color:var(--ed-orange,#FF7100)}',
            '.an-ton{border:1px solid;padding:1px 8px;font-size:.64em;letter-spacing:1px;font-weight:bold}',
            '.an-titre{color:#fff;font-weight:bold;letter-spacing:1px}',
            '.an-ap{color:#ccc;line-height:1.6;font-size:.88em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
            '.an-pied{display:flex;justify-content:space-between;color:#777;font-size:.7em;gap:14px;flex-wrap:wrap}',
            '.an-pied i{font-style:normal;color:#aaa}',
            '.an-lire{color:var(--ed-orange,#FF7100);letter-spacing:1px}',
            '.an-voile{position:fixed;inset:0;z-index:4200;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box}',
            '.an-fiche{width:100%;max-width:720px;max-height:92vh;overflow-y:auto;border:1px solid var(--ed-orange,#FF7100);background:rgba(8,4,0,.98);box-shadow:0 0 40px rgba(255,113,0,.25);padding:22px 26px;position:relative;box-sizing:border-box;font-family:inherit;color:#ccc}',
            '.an-x{position:absolute;top:12px;right:18px;color:var(--ed-orange,#FF7100);font-weight:bold;cursor:pointer;font-size:1.2em}',
            '.an-fiche h3{margin:8px 0 10px;color:#fff;font-size:1.25em;letter-spacing:1px}',
            '.an-fiche p{margin:0 0 10px;line-height:1.75;font-size:.95em}',
            '.an-base{color:#777;font-size:.72em;border-top:1px dashed #333;padding-top:8px;margin-top:6px;line-height:1.6}',
            '.an-li{display:flex;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.07);cursor:pointer}',
            '.an-li .t{color:#fff;font-weight:bold;font-size:.88em;flex:1;min-width:0;overflow-wrap:anywhere}',
            '.an-li .d{color:#888;font-size:.72em;white-space:nowrap}',
            '.an-btn{background:transparent;border:1px solid #FF6a6a;color:#FF6a6a;padding:4px 10px;font-family:inherit;font-size:.72em;letter-spacing:1px;cursor:pointer}',
            '.an-mc{border:1px solid rgba(255,113,0,.4);background:linear-gradient(160deg,rgba(255,113,0,.07),rgba(0,0,0,.6));border-radius:18px;padding:14px;cursor:pointer}',
            '.an-mc .tete{display:flex;gap:11px;align-items:center;margin-bottom:9px}',
            '.an-mc .av{width:48px;height:48px;border-radius:50%;border:2px solid #FF7100;flex:none;overflow:hidden;position:relative;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 35%,#4a2608,#170b02);color:#ffab66;font-weight:bold}',
            '.an-mc .av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}',
            '@media (max-width:760px){.an-port{width:84px;font-size:1.5em}.an-corps{padding:12px 14px}}'
        ].join('\n');
        document.head.appendChild(st);
    }

    async function charger(force) {
        if (!force) { try { const c = JSON.parse(sessionStorage.getItem(CLE) || 'null'); if (c && Date.now() - c.ts < DUREE) return c.d; } catch (e) {} }
        try {
            const b = bd(); if (!b) return null;
            const r = await b.rpc('anecdote_du_jour');
            if (r.error) throw r.error;
            const d = r.data || null;
            try { sessionStorage.setItem(CLE, JSON.stringify({ ts: Date.now(), d: d })); } catch (e) {}
            return d;
        } catch (e) { return null; }   // SQL 60 pas encore lance, ou hors ligne : la carte reste simplement absente
    }
    function invalider() { try { sessionStorage.removeItem(CLE); } catch (e) {} }

    function portrait(a) {
        const P = window.EDTEAMPhotos, u = P ? P.url(a.user_id, a.cmdr_nom) : '';
        const ini = P ? P.initiales(a.cmdr_nom) : '?';
        return { u: u, ini: ini };
    }

    // ----- bande du QG (PC) -----
    function htmlBande(a) {
        css();
        const t = ton(a.ton), p = portrait(a);
        return '<div class="bloc an-bande" onclick="EDTEAMAnecdotes.ouvrir()" onmouseenter="if(typeof sonHover===\'function\') sonHover()"><div class="an-fil">❝</div><div class="an-lueur"></div>'
            + '<div class="an-port">' + esc(p.ini) + (p.u ? '<img src="' + esc(p.u) + '" alt="" loading="lazy" decoding="async" onerror="this.remove()">' : '') + '</div>'
            + '<div class="an-corps"><div class="an-k"><b>ANECDOTE DE L’ESCADRON</b><span class="an-ton" style="color:' + t[1] + ';border-color:' + t[1] + '">' + t[0] + '</span></div>'
            + '<div class="an-titre">' + esc(a.titre) + '</div><div class="an-ap">' + esc(String(a.texte || '').replace(/\n+/g, ' ')) + '</div>'
            + '<div class="an-pied"><span><i>Fait réel :</i> ' + esc(a.fait || '') + ' · CMDR ' + esc(String(a.cmdr_nom || '').toUpperCase()) + '</span><span class="an-lire">LIRE L’ANECDOTE ›</span></div></div></div>';
    }
    // ----- carte de l'accueil mobile -----
    function htmlCarteMobile(a) {
        css();
        const t = ton(a.ton), p = portrait(a);
        return '<div class="an-mc" onclick="EDTEAMAnecdotes.ouvrir()"><div class="tete"><div class="av">' + esc(p.ini) + (p.u ? '<img src="' + esc(p.u) + '" alt="" loading="lazy" decoding="async" onerror="this.remove()">' : '') + '</div>'
            + '<div style="min-width:0"><div style="font-size:.62em;letter-spacing:3px;color:#FF7100;">ANECDOTE · <span class="an-ton" style="color:' + t[1] + ';border-color:' + t[1] + ';padding:0 5px;">' + t[0] + '</span></div>'
            + '<div style="color:#fff;font-weight:bold;font-size:1em;overflow-wrap:anywhere;">' + esc(a.titre) + '</div></div></div>'
            + '<div style="color:#ccc;line-height:1.6;font-size:.82em;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;">' + esc(String(a.texte || '').replace(/\n+/g, ' ')) + '</div>'
            + '<div style="color:#777;font-size:.62em;border-top:1px dashed #333;padding-top:7px;margin-top:8px;">Fait réel : ' + esc(a.fait || '') + ' · CMDR ' + esc(String(a.cmdr_nom || '').toUpperCase()) + '</div></div>';
    }

    // ----- fenetre : l'anecdote en entier, puis les precedentes -----
    function fermer() { const v = document.getElementById('an-voile'); if (v) v.remove(); }
    function peut() { try { const p = window.profilCommandant; return !!(p && (p.est_amiral || p.est_directeur)); } catch (e) { return false; } }
    function corpsAnecdote(a) {
        const t = ton(a.ton);
        return '<div class="an-k"><b style="letter-spacing:4px;font-size:.78em;color:#FF7100;">ANECDOTE DE L’ESCADRON</b><span class="an-ton" style="color:' + t[1] + ';border-color:' + t[1] + '">' + t[0] + '</span><span style="color:#777;font-size:.72em;">' + esc(dateFr(a.created_at)) + '</span></div>'
            + '<h3>' + esc(a.titre) + '</h3>' + paragraphes(a.texte)
            + '<div class="an-base"><i style="font-style:normal;color:#aaa;">Fait réel :</i> ' + esc(a.fait || '') + ' · CMDR ' + esc(String(a.cmdr_nom || '').toUpperCase())
            + '<br>Histoire écrite par une IA à partir de ce fait ; le reste est de la fiction.</div>';
    }
    async function ouvrir() {
        if (typeof sonClic === 'function') sonClic();
        css(); fermer();
        const v = document.createElement('div');
        v.id = 'an-voile'; v.className = 'an-voile';
        v.addEventListener('click', e => { if (e.target === v) fermer(); });
        v.innerHTML = '<div class="an-fiche"><div class="an-x" onclick="EDTEAMAnecdotes.fermer()">X</div><div id="an-corps" style="color:#777;font-style:italic;">Chargement…</div></div>';
        document.body.appendChild(v);
        let liste = [];
        try { const r = await bd().rpc('anecdotes_escadron', { p_limite: 30 }); if (!r.error) liste = r.data || []; } catch (e) {}
        const corps = document.getElementById('an-corps');
        if (!corps) return;
        if (!liste.length) { corps.innerHTML = 'Aucune anecdote pour le moment.'; return; }
        corps.style.cssText = '';
        const dessiner = (ouverte) => {
            corps.innerHTML = corpsAnecdote(liste[ouverte]) + (peut() ? '<div style="margin-top:10px;"><button class="an-btn" onclick="EDTEAMAnecdotes.supprimer(' + Number(liste[ouverte].id) + ')">SUPPRIMER CETTE ANECDOTE</button></div>' : '')
                + (liste.length > 1 ? '<div style="margin-top:18px;color:#888;font-size:.74em;letter-spacing:2px;border-bottom:1px dashed #333;padding-bottom:6px;">ANECDOTES PRÉCÉDENTES</div>'
                    + liste.map((x, i) => i === ouverte ? '' : '<div class="an-li" onclick="EDTEAMAnecdotes._voir(' + i + ')"><span class="an-ton" style="color:' + ton(x.ton)[1] + ';border-color:' + ton(x.ton)[1] + '">' + ton(x.ton)[0] + '</span><span class="t">' + esc(x.titre) + '</span><span class="d">' + esc(dateFr(x.created_at)) + '</span></div>').join('') : '');
        };
        window.EDTEAMAnecdotes._voir = dessiner;
        window.EDTEAMAnecdotes._liste = liste;
        dessiner(0);
    }
    async function supprimer(id) {
        const texte = 'Supprimer cette anecdote ? Elle disparaîtra pour tout l’escadron.';
        let ok = false;
        if (typeof window.demanderConfirmation === 'function') ok = await window.demanderConfirmation('SUPPRIMER L’ANECDOTE', texte, '#FF3333'); else ok = confirm(texte);
        if (!ok) return;
        try {
            const r = await bd().rpc('supprimer_anecdote', { p_id: id });
            if (r.error) throw r.error;
            invalider(); fermer();
            try { window.dispatchEvent(new CustomEvent('edteam-anecdotes')); } catch (e) {}
        } catch (e) { console.error('Anecdote :', e); alert('L’anecdote n’a pas pu être supprimée.'); }
    }

    window.EDTEAMAnecdotes = { init: function (c) { client = c || client; }, charger: charger, invalider: invalider, htmlBande: htmlBande, htmlCarteMobile: htmlCarteMobile, ouvrir: ouvrir, fermer: fermer, supprimer: supprimer };
})();
