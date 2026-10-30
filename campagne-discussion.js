// Discussions de campagne et pastille « nouvelles lignes » du journal (script SQL 178) : un fil de discussion par campagne, ouvert a tous ses participants (escadron hote, allies, invites solitaires).
// Utilise par la page BGS (PC, bouton de l'en-tete de campagne) et par le mobile (bloc de campagne).
// Sobriete : les compteurs des boutons sont lus en UN appel (au plus toutes les 2 minutes, onglet visible) ; la fenetre ne rafraichit que tant qu'elle est ouverte (45 s, reponse minuscule si rien de neuf).
(function () {
    "use strict";
    var db = function () { return window.supabaseApp || (typeof supabaseApp !== "undefined" ? supabaseApp : null); };
    var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); };
    var SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h12a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 16 15H9l-4 3.5V15H4a1.5 1.5 0 0 1-1.5-1.5v-7A1.5 1.5 0 0 1 4 5z"/><path d="M20 9.5h.5A1.5 1.5 0 0 1 22 11v6a1.5 1.5 0 0 1-1.5 1.5H20V21l-3.5-2.5H11"/></svg>';
    var CPT = {}, tsCpt = 0, absente = false, timerCpt = null;
    var ST = { id: null, nom: "", sig: null, msgs: [], actif: true, rep: null, timer: null, premier: true, envoi: false };

    // ---------- style ----------
    function css() {
        if (document.getElementById("dsc-css")) return;
        var s = document.createElement("style"); s.id = "dsc-css";
        s.textContent = [
            ".camp-disc, .mc-disc { position: relative; } .camp-disc svg, .mc-disc svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }",
            ".dsc-b { position: absolute; top: -7px; right: -7px; min-width: 15px; height: 15px; border-radius: 8px; background: #667; color: #000; font-size: 10px; line-height: 15px; text-align: center; font-weight: bold; padding: 0 3px; display: none; font-family: inherit; }",
            ".dsc-a .dsc-b { display: block; } .dsc-neuf { border-color: #00F0FF !important; color: #00F0FF !important; animation: dscClig 1.6s ease-in-out infinite; } .dsc-neuf .dsc-b { background: #00F0FF; }",
            "@keyframes dscClig { 50% { box-shadow: 0 0 10px rgba(0,240,255,.7); } } @keyframes dscCligA { 50% { box-shadow: 0 0 10px rgba(255,176,0,.7); } }",
            "[data-jrn] { margin-right: 6px; } [data-jrn].dsc-neuf { border-color: #FFB000 !important; color: #FFB000 !important; animation-name: dscCligA; } [data-jrn].dsc-neuf .dsc-b { background: #FFB000; }",
            ".mc-disc { background: rgba(255,255,255,.04); border: 1px solid #555; color: #bbb; width: 32px; height: 32px; border-radius: 8px; padding: 0; display: inline-flex; align-items: center; justify-content: center; flex: none; }",
            ".dsc-voile { position: fixed; inset: 0; z-index: 5600; background: rgba(0,0,0,.88); display: flex; align-items: center; justify-content: center; padding: 14px; box-sizing: border-box; }",
            ".dsc-fiche { width: 100%; max-width: 760px; height: min(86vh, 740px); display: flex; flex-direction: column; border: 1px solid #00F0FF; background: rgba(4,8,10,.98); box-shadow: 0 0 40px rgba(0,240,255,.18); padding: 16px 20px; box-sizing: border-box; position: relative; font-family: 'Share Tech Mono', monospace; }",
            ".dsc-x { position: absolute; top: 10px; right: 16px; color: #00F0FF; cursor: pointer; font-weight: bold; font-size: 1.2em; }",
            ".dsc-t { color: #00F0FF; letter-spacing: 2px; font-size: 1.05em; padding-right: 28px; overflow-wrap: anywhere; } .dsc-s { color: #778; font-size: .72em; margin: 3px 0 10px; letter-spacing: 1px; }",
            ".dsc-fil { flex: 1; min-height: 0; overflow-y: auto; border: 1px solid #14262b; background: #03080a; padding: 12px; }",
            ".dsc-m { display: flex; gap: 10px; margin-bottom: 12px; } .dsc-m.moi .dsc-cb { border-left: 2px solid rgba(0,240,255,.5); padding-left: 8px; }",
            ".dsc-cb { min-width: 0; max-width: 88%; } .dsc-nom { color: #fff; font-size: .82em; letter-spacing: 1px; overflow-wrap: anywhere; } .dsc-h { color: #667; font-size: .78em; margin-left: 6px; }",
            ".dsc-p { font-size: .62em; border: 1px solid; padding: 0 6px; margin-left: 6px; letter-spacing: 1px; white-space: nowrap; } .dsc-p.s { color: #FFD700; } .dsc-p.a { color: #00F0FF; } .dsc-p.m { color: #00FF66; }",
            ".dsc-x2 { color: #ddd; font-size: .9em; line-height: 1.5; margin-top: 2px; overflow-wrap: anywhere; white-space: pre-wrap; }",
            ".dsc-rep { border-left: 2px solid #2a4650; padding-left: 8px; color: #6c8; font-size: .74em; margin-top: 3px; opacity: .8; overflow-wrap: anywhere; }",
            ".dsc-act { margin-top: 4px; font-size: .72em; color: #667; } .dsc-act span { cursor: pointer; margin-right: 14px; padding: 2px 0; } .dsc-act span:hover { color: #00F0FF; } .dsc-act .on { color: #00F0FF; } .dsc-act .del:hover { color: #FF5555; }",
            ".dsc-sys { text-align: center; color: #8a949c; font-size: .75em; margin: 12px 0; padding: 5px; border-top: 1px dashed #14262b; border-bottom: 1px dashed #14262b; } .dsc-sys b { color: #00F0FF; font-weight: normal; }",
            ".dsc-jour { text-align: center; color: #556; font-size: .7em; letter-spacing: 2px; margin: 14px 0 10px; }",
            ".dsc-vide { color: #667; font-style: italic; text-align: center; padding: 40px 10px; font-size: .85em; line-height: 1.7; }",
            ".dsc-cmp { margin-top: 10px; } .dsc-repb { display: flex; justify-content: space-between; gap: 10px; color: #6c8; font-size: .72em; border-left: 2px solid #2a4650; padding: 2px 8px; margin-bottom: 6px; } .dsc-repb span:last-child { cursor: pointer; color: #889; }",
            ".dsc-sai { display: flex; gap: 8px; } .dsc-sai input { flex: 1; min-width: 0; background: #000; border: 1px solid #1f4650; color: #ddd; padding: 10px 12px; font-family: inherit; font-size: 16px; }",
            ".dsc-sai button { background: transparent; border: 1px solid #00F0FF; color: #00F0FF; padding: 8px 16px; font-family: inherit; letter-spacing: 1px; cursor: pointer; } .dsc-sai button:disabled { opacity: .5; cursor: wait; }",
            ".dsc-n { color: #667; font-size: .68em; margin-top: 6px; display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; } .dsc-err { color: #FF6a6a; }",
            "@media (max-width: 760px) { .dsc-voile { padding: 0; } .dsc-fiche { max-width: none; height: 100%; border: none; padding: 12px 12px; } .dsc-cb { max-width: 92%; } }"
        ].join("\n");
        document.head.appendChild(s);
    }

    // ---------- compteurs des boutons ----------
    function appliquer() {
        var b = document.querySelectorAll("[data-disc]");
        for (var i = 0; i < b.length; i++) {
            var id = b[i].getAttribute("data-disc"), c = CPT[id] || {}, n = Number(c.n) || 0, nl = Number(c.nl) || 0, bd = b[i].querySelector(".dsc-b");
            if (bd) bd.textContent = n > 99 ? "99+" : String(n);
            b[i].classList.toggle("dsc-a", n > 0);
            b[i].classList.toggle("dsc-neuf", nl > 0);
            b[i].title = "Discussions de la campagne" + (n ? " · " + n + " message" + (n > 1 ? "s" : "") + (nl ? " · " + nl + " non lu" + (nl > 1 ? "s" : "") : "") : "");
        }
        // journal : pastille = nouvelles lignes depuis la derniere ouverture (rien d'affiche si aucune)
        var jr = document.querySelectorAll("[data-jrn]");
        for (var k = 0; k < jr.length; k++) {
            var jid = jr[k].getAttribute("data-jrn"), j = Number((CPT[jid] || {}).j) || 0, jb = jr[k].querySelector(".dsc-b");
            if (jb) jb.textContent = j > 99 ? "99+" : String(j);
            jr[k].classList.toggle("dsc-a", j > 0); jr[k].classList.toggle("dsc-neuf", j > 0);
            jr[k].title = "Journal de cette campagne" + (j ? " · " + j + " nouvelle" + (j > 1 ? "s" : "") + " ligne" + (j > 1 ? "s" : "") + " depuis votre dernière ouverture" : "");
        }
    }
    async function maj(force) {
        if (absente || !db() || !document.querySelector("[data-disc], [data-jrn]")) return;
        if (document.hidden) return;
        if (!force && Date.now() - tsCpt < 60000) { appliquer(); return; }
        tsCpt = Date.now();
        try {
            var r = await db().rpc("campagne_discussions_compteurs");
            if (r.error) { if (/campagne_discussions_compteurs|does not exist|404/.test(String(r.error.message || r.error.code || ""))) absente = true; return; }
            CPT = r.data || {};
        } catch (e) { return; }
        appliquer();
        if (!timerCpt) timerCpt = setInterval(function () { maj(false); }, 120000);
    }
    document.addEventListener("visibilitychange", function () { if (!document.hidden) maj(false); });

    // ---------- fenetre ----------
    var jour = function (iso) { var d = new Date(iso); return isNaN(d) ? "" : d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate(); };
    function libJour(iso) {
        var d = new Date(iso), a = new Date(), h = new Date(a.getTime() - 864e5), p = function (n) { return String(n).padStart(2, "0"); };
        if (jour(iso) === jour(a)) return "aujourd'hui"; if (jour(iso) === jour(h)) return "hier";
        return p(d.getDate()) + "/" + p(d.getMonth() + 1);
    }
    var heure = function (iso) { var d = new Date(iso), p = function (n) { return String(n).padStart(2, "0"); }; return isNaN(d) ? "" : p(d.getHours()) + ":" + p(d.getMinutes()); };
    function nomCampagne(id) {
        var l = (window.cacheCampagnes || []).concat(window.cacheCampagnesMob || []);
        for (var i = 0; i < l.length; i++) if (String(l[i].id) === String(id)) return l[i].nom || "";
        return "";
    }
    function abreger(e) { try { if (window.edteamInvitations && window.edteamInvitations.abreger) return window.edteamInvitations.abreger(e); } catch (x) { /* repli */ } return String(e || "").slice(0, 3); }
    function avatar(m) {
        var P = window.EDTEAMPhotos;
        if (P && P.avatar) { try { return P.avatar({ uid: m.u, nom: m.n, role: m.am ? "amiral" : "pilote", taille: 30 }); } catch (e) { /* repli */ } }
        return '<span style="flex:none; width:30px; height:30px; border-radius:50%; background:#16262b; color:#fff; text-align:center; line-height:30px; font-size:.72em;">' + esc(String(m.n || "?").replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase()) + "</span>";
    }
    function dessiner() {
        var fil = document.getElementById("dsc-fil"); if (!fil) return;
        var proche = fil.scrollHeight - fil.scrollTop - fil.clientHeight < 70, h = "", dernier = "", moi = (window.profilCommandant || {}).user_id;
        if (!ST.msgs.length) h = '<div class="dsc-vide">Aucun message pour le moment.<br>Soyez le premier à écrire à toute la campagne.</div>';
        ST.msgs.forEach(function (m) {
            var j = jour(m.d);
            if (j !== dernier) { h += '<div class="dsc-jour">— ' + esc(libJour(m.d)) + " —</div>"; dernier = j; }
            if (m.t === "SYS") { h += '<div class="dsc-sys">' + esc(m.x) + "</div>"; return; }
            var past = (m.k === "SOLITAIRE" ? '<span class="dsc-p s">SOLITAIRE</span>' : m.k === "ALLIE" ? '<span class="dsc-p a">ALLIÉ · ' + esc(abreger(m.e)) + "</span>" : "") + (m.am ? '<span class="dsc-p m">AMIRAL</span>' : "");
            var rep = m.r ? (m.rn ? '<div class="dsc-rep">↳ CMDR ' + esc(String(m.rn).toUpperCase()) + " : " + esc(m.rx || "") + "</div>" : '<div class="dsc-rep">↳ message supprimé</div>') : "";
            h += '<div class="dsc-m' + (String(m.u) === String(moi) ? " moi" : "") + '">' + avatar(m) + '<div class="dsc-cb"><div class="dsc-nom">CMDR ' + esc(String(m.n || "?").toUpperCase()) + past + '<span class="dsc-h">' + esc(heure(m.d)) + "</span></div>"
                + rep + '<div class="dsc-x2">' + esc(m.x) + '</div><div class="dsc-act">'
                + (ST.actif ? '<span onclick="edteamDiscussion.repondre(' + m.id + ')">RÉPONDRE</span>' : "")
                + '<span class="' + (m.mp ? "on" : "") + '" onclick="edteamDiscussion.pouce(' + m.id + ')">👍' + (m.p > 0 ? " " + m.p : "") + "</span>"
                + (m.sup ? '<span class="del" onclick="edteamDiscussion.supprimer(' + m.id + ')">SUPPRIMER</span>' : "") + "</div></div></div>";
        });
        fil.innerHTML = h;
        if (ST.premier || proche) { fil.scrollTop = fil.scrollHeight; ST.premier = false; }
        var cmp = document.getElementById("dsc-cmp"); if (cmp) cmp.style.display = ST.actif ? "block" : "none";
        var ro = document.getElementById("dsc-ro"); if (ro) ro.style.display = ST.actif ? "none" : "block";
    }
    function barreReponse() {
        var z = document.getElementById("dsc-repb"); if (!z) return;
        if (!ST.rep) { z.innerHTML = ""; return; }
        z.innerHTML = '<div class="dsc-repb"><span>↳ Réponse à CMDR ' + esc(String(ST.rep.n || "?").toUpperCase()) + " : " + esc(String(ST.rep.x || "").slice(0, 60)) + '</span><span onclick="edteamDiscussion.repondre(null)">✕</span></div>';
    }
    function message(txt, erreur) { var z = document.getElementById("dsc-msg"); if (z) { z.textContent = txt || ""; z.className = erreur ? "dsc-err" : ""; } }
    async function charger(force) {
        if (!ST.id || !db()) return;
        var r;
        try { r = await db().rpc("campagne_discussion_lire", { p_campagne: Number(ST.id), p_sig: force ? null : ST.sig }); }
        catch (e) { message("Discussion indisponible pour le moment.", true); return; }
        if (r.error) { message(/does not exist|404/.test(String(r.error.message || "")) ? "Discussion indisponible (le script SQL 178 n'est pas lancé)." : "Discussion indisponible : " + (r.error.message || "erreur"), true); return; }
        var d = r.data || {}; if (d.same) return;
        ST.sig = d.sig; ST.msgs = d.messages || []; ST.actif = d.actif !== false; message("");
        dessiner();
        if (CPT[ST.id]) { CPT[ST.id].nl = 0; CPT[ST.id].n = ST.msgs.filter(function (m) { return m.t === "MSG"; }).length; appliquer(); }
    }
    function fermer() {
        var v = document.getElementById("dsc-voile"); if (v) v.remove();
        if (ST.timer) { clearInterval(ST.timer); ST.timer = null; }
        document.documentElement.style.overflow = ""; document.removeEventListener("keydown", touche);
        ST.id = null; ST.rep = null; maj(true);
    }
    function touche(e) { if (e.key === "Escape") fermer(); }
    function ouvrir(id) {
        css(); if (!db()) return;
        if (typeof window.sonClic === "function") window.sonClic();
        var ancien = document.getElementById("dsc-voile"); if (ancien) ancien.remove();
        ST = { id: id, nom: nomCampagne(id), sig: null, msgs: [], actif: true, rep: null, timer: null, premier: true, envoi: false };
        var v = document.createElement("div"); v.id = "dsc-voile"; v.className = "dsc-voile";
        v.onclick = function (e) { if (e.target === v) fermer(); };
        v.innerHTML = '<div class="dsc-fiche"><div class="dsc-x" onclick="edteamDiscussion.fermer()">X</div>'
            + '<div class="dsc-t">&gt; DISCUSSION' + (ST.nom ? " · " + esc(String(ST.nom).toUpperCase()) : "") + '</div><div class="dsc-s">VISIBLE UNIQUEMENT PAR LES PARTICIPANTS DE CETTE CAMPAGNE</div>'
            + '<div class="dsc-fil" id="dsc-fil"><div class="dsc-vide">Chargement…</div></div>'
            + '<div class="dsc-cmp" id="dsc-cmp"><div id="dsc-repb"></div><div class="dsc-sai"><input type="text" id="dsc-in" maxlength="280" autocomplete="off" placeholder="Écrire à toute la campagne…" onkeydown="if(event.key===\'Enter\'){edteamDiscussion.envoyer();}" oninput="edteamDiscussion.compter()"><button type="button" id="dsc-ok" onclick="edteamDiscussion.envoyer()">ENVOYER</button></div>'
            + '<div class="dsc-n"><span id="dsc-msg"></span><span id="dsc-cpt">0 / 280</span></div></div>'
            + '<div class="dsc-n" id="dsc-ro" style="display:none;">Campagne terminée : lecture seule. Les messages sont supprimés 30 jours après la fin de la campagne.</div>'
            + '<div class="dsc-n"><span>Messages courts, sans lien. L\'auteur, l\'Amiral de l\'escadron hôte et le Directeur peuvent supprimer un message.</span></div></div>';
        document.body.appendChild(v);
        document.documentElement.style.overflow = "hidden"; document.addEventListener("keydown", touche);
        charger(true);
        ST.timer = setInterval(function () { if (!document.hidden) charger(false); }, 45000);
    }

    // ---------- actions ----------
    function compter() { var i = document.getElementById("dsc-in"), c = document.getElementById("dsc-cpt"); if (i && c) c.textContent = i.value.length + " / 280"; }
    async function envoyer() {
        var i = document.getElementById("dsc-in"), b = document.getElementById("dsc-ok"); if (!i || ST.envoi) return;
        var t = i.value.trim(); if (!t) return;
        ST.envoi = true; if (b) b.disabled = true; message("");
        try {
            var r = await db().rpc("campagne_discussion_ecrire", { p_campagne: Number(ST.id), p_texte: t, p_reponse_a: ST.rep ? Number(ST.rep.id) : null });
            if (r.error) { message(r.error.message || "Envoi impossible.", true); }
            else { i.value = ""; compter(); ST.rep = null; barreReponse(); ST.premier = true; await charger(true); }
        } catch (e) { message("Envoi impossible pour le moment.", true); }
        ST.envoi = false; if (b) b.disabled = false; if (i) i.focus();
    }
    function repondre(id) {
        if (id == null) { ST.rep = null; barreReponse(); return; }
        for (var k = 0; k < ST.msgs.length; k++) if (ST.msgs[k].id === id) { ST.rep = ST.msgs[k]; break; }
        barreReponse(); var i = document.getElementById("dsc-in"); if (i) i.focus();
    }
    async function pouce(id) {
        try { var r = await db().rpc("campagne_discussion_pouce", { p_id: Number(id) }); if (r.error) { message(r.error.message || "Impossible.", true); return; } await charger(true); } catch (e) { /* silencieux */ }
    }
    async function supprimer(id) {
        var ok = false, texte = "Ce message sera supprimé pour tous les participants.";
        if (typeof window.demanderConfirmation === "function") ok = await window.demanderConfirmation("SUPPRIMER LE MESSAGE", texte, "#FF3333"); else ok = confirm(texte);
        if (!ok) return;
        try { var r = await db().rpc("campagne_discussion_supprimer", { p_id: Number(id) }); if (r.error) { message(r.error.message || "Suppression impossible.", true); return; } await charger(true); } catch (e) { message("Suppression impossible pour le moment.", true); }
    }

    // le pilote ouvre le journal d'une campagne : les nouvelles lignes sont « lues »
    function journalVu(id) {
        var c = CPT[String(id)]; if (c) c.j = 0; appliquer();
        try { var r = db() && db().rpc("campagne_journal_vu", { p_campagne: Number(id) }); if (r && r.then) r.then(function () { /* rien */ }, function () { /* silencieux */ }); } catch (e) { /* silencieux */ }
    }

    window.edteamDiscussion = { ouvrir: ouvrir, fermer: fermer, envoyer: envoyer, repondre: repondre, pouce: pouce, supprimer: supprimer, compter: compter, journalVu: journalVu, maj: maj, appliquer: appliquer, icone: SVG };
    css();
})();
