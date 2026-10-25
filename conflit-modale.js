// FENETRE PLEIN ECRAN quand une guerre / une election demarre ou se termine (gagnee, perdue, terminee), sur la page BGS (PC) et le mobile.
// Source : les evenements de conflit deja charges par conflit-evenements.js (SQL 132, directives actives de l'escadron) : aucune requete en plus.
// Regles : une seule fois par evenement, par pilote et par appareil (localStorage edteam_cflt_vu_<uid>) ; seulement les evenements de moins de 24 h ;
// pas de fenetre pour une directive BAISSE (la victoire de la faction visee n'est pas la notre) ; file d'attente avec compteur et « TOUT PASSER » ;
// la fenetre attend qu'une annonce ou une revelation soit fermee. Sans evenement ou en cas d'erreur : rien ne s'affiche.
(function () {
    "use strict";
    if (window.EdteamConflitModale) return;
    var PREFIXE = "edteam_cflt_vu_", MAX_VUS = 80, AGE_MAX = 86400, BLOQUANTS = ["edteam-annonce", "an-voile", "gz-popup", "edteam-revel"];
    var etat = { profil: null, opts: {}, file: [], ids: {}, enCours: false, minuteur: null };

    function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
    function lire(uid) { try { var v = JSON.parse(localStorage.getItem(PREFIXE + uid) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
    function ecrire(uid, l) { try { localStorage.setItem(PREFIXE + uid, JSON.stringify(l.slice(-MAX_VUS))); } catch (e) { /* stockage indisponible : la fenetre pourra se rejouer, sans consequence */ } }
    function marquer(cle) { var uid = etat.profil && etat.profil.user_id; if (!uid) return; var l = lire(uid); if (l.indexOf(cle) < 0) { l.push(cle); ecrire(uid, l); } }
    function aEscadron(p) { var e = String(p && p.escadron_id || "").trim().toUpperCase(); return !!e && e !== "INDEPENDANT"; }
    function rnd(a, b) { return a + Math.random() * (b - a); }

    // ------------------------------------------------------------------------------------------------------------
    // EMBLEMES (SVG en ligne, couleur par variables CSS)
    // ------------------------------------------------------------------------------------------------------------
    var ANN = "<circle cx=\"100\" cy=\"100\" r=\"92\" stroke=\"var(--c)\" stroke-width=\"2\" stroke-dasharray=\"3 9\" opacity=\".6\"/>";
    var EMB = {
        war: "<svg viewBox=\"0 0 200 200\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><g stroke=\"var(--c)\" stroke-width=\"7\"><path d=\"M52 52 L142 142\"/><path d=\"M148 52 L58 142\"/></g><g stroke=\"#fff\" stroke-width=\"3\" opacity=\".9\"><path d=\"M56 56 L138 138\"/><path d=\"M144 56 L62 138\"/></g><g stroke=\"var(--c2)\" stroke-width=\"9\"><path d=\"M138 112 L170 144\"/><path d=\"M62 112 L30 144\"/><path d=\"M120 134 L150 104\"/><path d=\"M80 134 L50 104\"/></g><g stroke=\"var(--c)\" stroke-width=\"5\"><circle cx=\"165\" cy=\"165\" r=\"9\"/><circle cx=\"35\" cy=\"165\" r=\"9\"/></g>" + ANN + "</svg>",
        vote: "<svg viewBox=\"0 0 200 200\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\">" + ANN + "<rect x=\"50\" y=\"94\" width=\"100\" height=\"70\" rx=\"6\" stroke=\"var(--c)\" stroke-width=\"6\"/><path d=\"M78 94 H122\" stroke=\"#fff\" stroke-width=\"4\"/><path d=\"M82 78 L118 78 L118 58 L82 58 Z\" fill=\"#e9fdff\" stroke=\"var(--c2)\" stroke-width=\"3\"/><path d=\"M92 68 l6 6 l12 -14\" stroke=\"#0aa\" stroke-width=\"4\"/><path d=\"M72 130 l16 16 l32 -34\" stroke=\"var(--c2)\" stroke-width=\"8\"/></svg>",
        win: "<svg viewBox=\"0 0 200 200\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\">" + ANN + "<path d=\"M62 48 H138 V86 C138 112 120 128 100 128 C80 128 62 112 62 86 Z\" fill=\"#ffd24a22\" stroke=\"var(--c)\" stroke-width=\"7\"/><path d=\"M62 60 H42 C42 84 52 96 68 100\" stroke=\"var(--c2)\" stroke-width=\"6\"/><path d=\"M138 60 H158 C158 84 148 96 132 100\" stroke=\"var(--c2)\" stroke-width=\"6\"/><path d=\"M100 128 V150\" stroke=\"var(--c)\" stroke-width=\"8\"/><path d=\"M72 160 H128\" stroke=\"var(--c)\" stroke-width=\"9\"/><path d=\"M80 150 H120\" stroke=\"var(--c2)\" stroke-width=\"6\"/><path d=\"M100 64 l7 14 l15 2 l-11 10 l3 15 l-14 -8 l-14 8 l3 -15 l-11 -10 l15 -2 z\" fill=\"#fff\" stroke=\"#fff\" stroke-width=\"2\"/></svg>",
        lose: "<svg viewBox=\"0 0 200 200\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"100\" cy=\"100\" r=\"92\" stroke=\"var(--c)\" stroke-width=\"2\" stroke-dasharray=\"3 9\" opacity=\".5\"/><path d=\"M70 158 V44\" stroke=\"var(--c2)\" stroke-width=\"7\"/><path d=\"M74 48 C98 38 112 62 140 52 L132 74 L144 94 C116 106 100 84 74 96 Z\" fill=\"#7F9BB822\" stroke=\"var(--c)\" stroke-width=\"6\"/><path d=\"M56 162 H92\" stroke=\"var(--c)\" stroke-width=\"8\"/><path d=\"M104 164 q16 -20 34 0\" stroke=\"#FF7100\" stroke-width=\"5\" opacity=\".9\"/><path d=\"M121 150 v-12 M108 154 l-7 -8 M134 154 l7 -8\" stroke=\"#FFB070\" stroke-width=\"4\"/></svg>",
        fin: "<svg viewBox=\"0 0 200 200\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\">" + ANN + "<rect x=\"56\" y=\"44\" width=\"88\" height=\"112\" rx=\"6\" stroke=\"var(--c)\" stroke-width=\"6\"/><path d=\"M76 74 H124 M76 98 H124 M76 122 H104\" stroke=\"var(--c2)\" stroke-width=\"6\"/></svg>"
    };

    // ------------------------------------------------------------------------------------------------------------
    // CSS (tout est prefixe par #edteam-cflt : aucune fuite vers la page)
    // ------------------------------------------------------------------------------------------------------------
    var CSS = ""
        + "#edteam-cflt{--c:#FF7100;--c2:#FFB070;position:fixed;inset:0;z-index:9700;display:flex;overflow:hidden auto;box-sizing:border-box;font-family:'Share Tech Mono',Consolas,monospace;color:#dfe8ee;"
        + "background:radial-gradient(ellipse 80% 70% at 50% 42%,color-mix(in srgb,var(--c) 26%,#05070a) 0%,#05070a 68%),#05070a;animation:ec-in .7s ease both}"
        + "#edteam-cflt *{box-sizing:border-box}@keyframes ec-in{from{opacity:0;filter:blur(8px)}to{opacity:1;filter:none}}"
        + "#edteam-cflt::before{content:'';position:fixed;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.022) 0 1px,transparent 1px 4px);pointer-events:none;z-index:1}"
        + "#edteam-cflt::after{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,.65) 100%);pointer-events:none;z-index:1}"
        + "#edteam-cflt .ec-fx{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0}"
        + "#edteam-cflt .ec-ray{position:absolute;left:50%;top:41%;width:1500px;height:1500px;margin:-750px 0 0 -750px;background:repeating-conic-gradient(from 0deg,color-mix(in srgb,var(--c) 14%,transparent) 0 4deg,transparent 4deg 14deg);-webkit-mask:radial-gradient(circle,#000 0,transparent 62%);mask:radial-gradient(circle,#000 0,transparent 62%);animation:ec-tourne 70s linear infinite;opacity:.8}"
        + "@keyframes ec-tourne{to{transform:rotate(360deg)}}"
        + "#edteam-cflt .ec-corps{position:relative;z-index:3;width:min(920px,100%);margin:auto;text-align:center;padding:64px 18px 72px}"
        + "#edteam-cflt .ec-kick{font-size:13px;letter-spacing:7px;color:var(--c2);text-transform:uppercase;animation:ec-monte .8s .25s ease both}#edteam-cflt .ec-kick b{color:#fff;font-weight:normal}"
        + "#edteam-cflt .ec-kick::before,#edteam-cflt .ec-kick::after{content:'';display:inline-block;width:56px;height:1px;background:linear-gradient(90deg,transparent,var(--c));vertical-align:middle;margin:0 16px}#edteam-cflt .ec-kick::after{transform:scaleX(-1)}"
        + "#edteam-cflt .ec-embl{position:relative;width:190px;height:190px;margin:26px auto 14px;animation:ec-pop .9s .1s cubic-bezier(.2,1.5,.4,1) both}"
        + "#edteam-cflt .ec-embl svg{position:relative;width:100%;height:100%;overflow:visible;filter:drop-shadow(0 0 18px var(--c)) drop-shadow(0 0 46px color-mix(in srgb,var(--c) 60%,transparent))}"
        + "#edteam-cflt .ec-an{position:absolute;inset:-26px;border-radius:50%;border:2px solid var(--c);opacity:0;animation:ec-anneau 3s ease-out infinite}#edteam-cflt .ec-an:nth-child(2){animation-delay:1s}#edteam-cflt .ec-an:nth-child(3){animation-delay:2s}"
        + "@keyframes ec-anneau{0%{transform:scale(.55);opacity:.75}100%{transform:scale(1.9);opacity:0}}@keyframes ec-pop{from{transform:scale(.2) rotate(-14deg);opacity:0}to{transform:none;opacity:1}}@keyframes ec-monte{from{transform:translateY(22px);opacity:0}to{transform:none;opacity:1}}"
        + "#edteam-cflt h1{margin:0;font-family:Orbitron,'Share Tech Mono',monospace;font-weight:900;font-size:clamp(32px,6.2vw,80px);line-height:1.04;letter-spacing:.07em;color:#fff;text-shadow:0 0 22px var(--c),0 0 60px color-mix(in srgb,var(--c) 70%,transparent);animation:ec-monte .9s .45s cubic-bezier(.2,1.2,.4,1) both}"
        + "#edteam-cflt h1 em{font-style:normal;color:var(--c2)}"
        + "#edteam-cflt .ec-lieu{margin-top:16px;font-size:16px;letter-spacing:4px;color:#cdd8df;animation:ec-monte .8s .7s ease both}#edteam-cflt .ec-lieu b{color:var(--c);font-weight:normal;text-shadow:0 0 12px color-mix(in srgb,var(--c) 60%,transparent)}"
        + "#edteam-cflt .ec-score{display:inline-flex;align-items:center;gap:26px;margin:24px 0 2px;padding:10px 34px;border:1px solid color-mix(in srgb,var(--c) 70%,transparent);background:rgba(0,0,0,.45);box-shadow:0 0 34px color-mix(in srgb,var(--c) 30%,transparent) inset;animation:ec-monte .8s .85s ease both}"
        + "#edteam-cflt .ec-score .n{font-family:Orbitron,'Share Tech Mono',monospace;font-weight:900;font-size:58px;color:#fff;text-shadow:0 0 18px var(--c);line-height:1}"
        + "#edteam-cflt .ec-score .t{font-size:11px;letter-spacing:3px;color:var(--c2);line-height:1.5;text-align:center}#edteam-cflt .ec-score .t i{display:block;font-style:normal;color:#8d9aa3}"
        + "#edteam-cflt .ec-msg{max-width:660px;margin:22px auto 0;font-size:16.5px;line-height:1.65;color:#c3cfd6;animation:ec-monte .8s 1s ease both}#edteam-cflt .ec-msg b{color:#fff;font-weight:normal;border-bottom:1px solid color-mix(in srgb,var(--c) 70%,transparent)}"
        + "#edteam-cflt .ec-puces{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:22px 0 0;animation:ec-monte .8s 1.15s ease both}#edteam-cflt .ec-puces span{border:1px solid color-mix(in srgb,var(--c) 55%,transparent);background:color-mix(in srgb,var(--c) 10%,#05070a);padding:7px 14px;font-size:12px;letter-spacing:2px;color:#e8f1f6}"
        + "#edteam-cflt .ec-acts{display:flex;gap:14px;justify-content:center;margin-top:34px;flex-wrap:wrap;animation:ec-monte .8s 1.3s ease both}"
        + "#edteam-cflt .ec-bt{font:inherit;font-size:14px;letter-spacing:4px;padding:15px 34px;cursor:pointer;border:1px solid var(--c);color:#fff;background:linear-gradient(180deg,color-mix(in srgb,var(--c) 38%,#05070a),color-mix(in srgb,var(--c) 18%,#05070a));box-shadow:0 0 28px color-mix(in srgb,var(--c) 42%,transparent);text-transform:uppercase;position:relative;overflow:hidden}"
        + "#edteam-cflt .ec-bt::after{content:'';position:absolute;top:0;bottom:0;width:60px;left:-90px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);animation:ec-balaye 3.4s 1.8s ease-in-out infinite}@keyframes ec-balaye{0%{left:-90px}45%,100%{left:calc(100% + 30px)}}"
        + "#edteam-cflt .ec-bt:hover{filter:brightness(1.25)}#edteam-cflt .ec-bt.s{background:transparent;border-color:#56626c;color:#98a6af;box-shadow:none}#edteam-cflt .ec-bt.s::after{display:none}"
        + "#edteam-cflt .ec-pied{position:fixed;z-index:3;left:0;right:0;bottom:16px;text-align:center;font-size:11px;letter-spacing:3px;color:#5d6a74;pointer-events:none}"
        + "#edteam-cflt .ec-x{position:fixed;z-index:6;right:20px;top:14px;color:#7a8791;font-size:28px;cursor:pointer;line-height:1;background:none;border:0;font-family:inherit;padding:4px 8px}#edteam-cflt .ec-x:hover{color:#fff}"
        + "#edteam-cflt .ec-cpt{position:fixed;z-index:6;left:20px;top:18px;font-size:12px;letter-spacing:3px;color:#7a8791;display:flex;gap:16px;align-items:center}#edteam-cflt .ec-cpt button{background:none;border:1px solid #3b4650;color:#8d9aa3;font:inherit;font-size:10.5px;letter-spacing:2px;padding:3px 8px;cursor:pointer}#edteam-cflt .ec-cpt button:hover{color:#fff;border-color:#8d9aa3}"
        // ambiances
        + "#edteam-cflt .ec-braise{position:absolute;bottom:-12px;width:5px;height:5px;border-radius:50%;background:#ffb060;box-shadow:0 0 10px 3px #ff7100;opacity:0;animation:ec-braise 6s linear infinite}@keyframes ec-braise{0%{transform:translate(0,0) scale(1);opacity:0}12%{opacity:.95}100%{transform:translate(var(--dx),-100vh) scale(.3);opacity:0}}"
        + "#edteam-cflt .ec-ligne{position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,transparent,var(--c),transparent);animation:ec-balay 4.5s linear infinite;opacity:.55}@keyframes ec-balay{from{top:-2px}to{top:100%}}"
        + "#edteam-cflt.war h1{animation:ec-monte .9s .45s cubic-bezier(.2,1.2,.4,1) both,ec-tremble 6s 2s steps(1) infinite}@keyframes ec-tremble{0%,93%,100%{transform:none}94%{transform:translateX(3px)}95%{transform:translateX(-3px)}96%{transform:translateX(1px)}97%{transform:none}}"
        + "#edteam-cflt.vote{--c:#00F0FF;--c2:#9BF6FF}#edteam-cflt .ec-bul{position:absolute;top:-30px;width:20px;height:26px;border:1px solid #9be9f5;background:linear-gradient(#f2feff,#a9ecf6);opacity:0;border-radius:2px;animation:ec-bulletin 7s linear infinite;box-shadow:0 0 12px #00F0FF88}"
        + "#edteam-cflt .ec-bul::after{content:'';position:absolute;left:4px;right:4px;top:8px;height:2px;background:#0aa;box-shadow:0 5px 0 #0aa,0 10px 0 #0aa}@keyframes ec-bulletin{0%{transform:translateY(0) rotate(var(--r0));opacity:0}8%{opacity:.8}100%{transform:translateY(112vh) rotate(var(--r1));opacity:.1}}"
        + "#edteam-cflt.win{--c:#FFD24A;--c2:#FFE9A0}#edteam-cflt .ec-cf{position:absolute;top:-20px;width:9px;height:15px;opacity:0;animation:ec-conf 5.5s linear infinite}@keyframes ec-conf{0%{transform:translateY(0) rotate(0);opacity:0}8%{opacity:1}100%{transform:translateY(112vh) translateX(var(--dx)) rotate(900deg);opacity:.9}}"
        + "#edteam-cflt .ec-fw{position:absolute;width:6px;height:6px}#edteam-cflt .ec-fw i{position:absolute;left:0;top:0;width:4px;height:4px;border-radius:50%;background:var(--k);box-shadow:0 0 8px var(--k);opacity:0;animation:ec-eclat 2.6s ease-out infinite;animation-delay:var(--d)}@keyframes ec-eclat{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--x),var(--y)) scale(.2);opacity:0}}"
        + "#edteam-cflt.win h1{background:linear-gradient(180deg,#fffbe8 10%,#FFD24A 55%,#ff9c1a 100%);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 0 22px #FFB00099)}"
        + "#edteam-cflt.lose{--c:#7F9BB8;--c2:#B8CBDD;background:radial-gradient(ellipse 80% 70% at 50% 42%,#1a2330 0%,#06080c 70%),#05070a}#edteam-cflt.lose .ec-ray{opacity:.35;animation-duration:140s}"
        + "#edteam-cflt .ec-pluie{position:absolute;top:-40px;width:1px;height:60px;background:linear-gradient(transparent,#8aa5c0aa);opacity:0;animation:ec-pluie 2.8s linear infinite}@keyframes ec-pluie{0%{transform:translateY(0);opacity:0}10%{opacity:.55}100%{transform:translateY(112vh);opacity:0}}"
        + "#edteam-cflt .ec-aube{position:absolute;left:-10%;right:-10%;bottom:-18%;height:46%;background:radial-gradient(ellipse at 50% 100%,rgba(255,150,60,.34),rgba(255,113,0,.1) 40%,transparent 70%);animation:ec-aube 6s ease-in-out infinite alternate}@keyframes ec-aube{from{opacity:.55;transform:scaleY(.85)}to{opacity:1;transform:scaleY(1.08)}}"
        + "#edteam-cflt.lose .ec-msg .ec-esp{color:#FFB070;border-bottom-color:#FF7100}#edteam-cflt.lose .ec-bt:not(.s){border-color:#FF7100;background:linear-gradient(180deg,#5a3010,#2b1708);box-shadow:0 0 28px rgba(255,113,0,.35)}"
        + "#edteam-cflt.fin{--c:#C9D1DB;--c2:#E6ECF2}#edteam-cflt .ec-pous{position:absolute;width:3px;height:3px;border-radius:50%;background:#c9d1db;opacity:0;animation:ec-pous 9s ease-in-out infinite}@keyframes ec-pous{0%{transform:translateY(40px);opacity:0}30%{opacity:.5}100%{transform:translateY(-120px);opacity:0}}"
        + "@media(max-width:640px){#edteam-cflt .ec-embl{width:128px;height:128px;margin-top:20px}#edteam-cflt .ec-kick{font-size:10px;letter-spacing:4px}#edteam-cflt .ec-kick::before,#edteam-cflt .ec-kick::after{width:20px;margin:0 8px}#edteam-cflt .ec-score{gap:16px;padding:8px 20px}#edteam-cflt .ec-score .n{font-size:40px}#edteam-cflt .ec-msg{font-size:14.5px}#edteam-cflt .ec-lieu{font-size:13px;letter-spacing:3px}#edteam-cflt .ec-bt{padding:14px 22px;letter-spacing:3px;width:100%}#edteam-cflt .ec-acts{flex-direction:column;gap:10px}#edteam-cflt .ec-corps{padding:56px 16px 64px}}"
        + "@media (prefers-reduced-motion:reduce){#edteam-cflt,#edteam-cflt *{animation-duration:.01s!important;animation-iteration-count:1!important}}";
    function css() { if (document.getElementById("edteam-cflt-css")) return; var st = document.createElement("style"); st.id = "edteam-cflt-css"; st.textContent = CSS; document.head.appendChild(st); }

    // ------------------------------------------------------------------------------------------------------------
    // PARTICULES (moins nombreuses sur mobile)
    // ------------------------------------------------------------------------------------------------------------
    function particules(k) {
        var h = "", m = (window.innerWidth || 1000) < 640 ? .5 : 1, i;
        if (k === "war") { h += "<div class=\"ec-ligne\"></div>"; for (i = 0; i < 34 * m; i++) h += "<span class=\"ec-braise\" style=\"left:" + rnd(0, 100) + "%;--dx:" + rnd(-90, 90) + "px;animation-delay:" + rnd(-6, 0) + "s;animation-duration:" + rnd(4, 8) + "s\"></span>"; }
        if (k === "vote") { for (i = 0; i < 22 * m; i++) h += "<span class=\"ec-bul\" style=\"left:" + rnd(0, 100) + "%;--r0:" + rnd(-40, 40) + "deg;--r1:" + rnd(-300, 300) + "deg;animation-delay:" + rnd(-7, 0) + "s;animation-duration:" + rnd(5, 9) + "s\"></span>"; }
        if (k === "win") {
            var co = ["#FFD24A", "#fff3c4", "#FFB000", "#ff6b9d", "#6ee7ff", "#fff"];
            for (i = 0; i < 80 * m; i++) h += "<span class=\"ec-cf\" style=\"left:" + rnd(0, 100) + "%;background:" + co[i % 6] + ";--dx:" + rnd(-120, 120) + "px;animation-delay:" + rnd(-5.5, 0) + "s;animation-duration:" + rnd(4, 7) + "s\"></span>";
            [[18, 28], [82, 24], [30, 58], [72, 60], [50, 14]].forEach(function (p, j) {
                var s = ""; for (var a = 0; a < 14; a++) { var an = a / 14 * 6.283, r = rnd(70, 120); s += "<i style=\"--x:" + Math.cos(an) * r + "px;--y:" + Math.sin(an) * r + "px;--k:" + co[a % 6] + ";--d:" + j * .5 + "s\"></i>"; }
                h += "<div class=\"ec-fw\" style=\"left:" + p[0] + "%;top:" + p[1] + "%\">" + s + "</div>";
            });
        }
        if (k === "lose") { h += "<div class=\"ec-aube\"></div>"; for (i = 0; i < 46 * m; i++) h += "<span class=\"ec-pluie\" style=\"left:" + rnd(0, 100) + "%;animation-delay:" + rnd(-3, 0) + "s;animation-duration:" + rnd(1.8, 3.4) + "s\"></span>"; }
        if (k === "fin") { for (i = 0; i < 30 * m; i++) h += "<span class=\"ec-pous\" style=\"left:" + rnd(0, 100) + "%;top:" + rnd(30, 100) + "%;animation-delay:" + rnd(-9, 0) + "s\"></span>"; }
        return h;
    }

    // ------------------------------------------------------------------------------------------------------------
    // CONTENU PAR SITUATION
    // ------------------------------------------------------------------------------------------------------------
    function contenu(e) {
        var guerre = e.genre === "GUERRE", nom = guerre ? "GUERRE" : "ÉLECTION", Nom = guerre ? "La guerre" : "L’élection";
        var lieu = "<b>" + esc(String(e.faction || "").toUpperCase()) + "</b> · " + esc(String(e.systeme || "").toUpperCase());
        var d = { k: "fin", kick: nom + " · <b>TERMINÉE</b>", h: "", lieu: lieu, score: null, msg: "", puces: [], b1: "COMPRIS", b2: "", pied: "" };
        if (e.evenement === "DEBUT") {
            d.pied = "DIRECTIVE #" + Number(e.ordre_id) + " · " + (guerre ? "GUERRE" : "ÉLECTION");
            d.b1 = "VOIR LA DIRECTIVE"; d.b2 = "FERMER"; d.ouvre = true;
            if (guerre) {
                d.k = "war"; d.kick = "GUERRE · <b>ALERTE</b>"; d.h = "AUX <em>ARMES</em> !";
                d.msg = "La guerre vient d’éclater. Chaque <b>victoire en zone de conflit</b>, chaque <b>bon de combat</b> et chaque <b>mission militaire</b> fait pencher la balance. L’escadron compte sur toi : <b>embarque, et rejoins le front</b>.";
                d.puces = ["⚔ VICTOIRES EN CZ", "🎯 BONS DE COMBAT", "📜 MISSIONS MILITAIRES"];
            } else {
                d.k = "vote"; d.kick = "ÉLECTION · <b>OUVERTE</b>"; d.h = "LES URNES <em>S’OUVRENT</em>";
                d.msg = "L’élection est lancée. Elle se gagne <b>jour après jour</b> : <b>logistique</b>, <b>commerce</b> et <b>exploration</b> pèsent dans le scrutin. Chaque contrat remis dans le système est <b>un vote pour nous</b>.";
                d.puces = ["📦 LOGISTIQUE", "💱 COMMERCE", "🧭 EXPLORATION"];
            }
            return d;
        }
        var pour = e.pour, contre = e.contre, a = e.adversaire ? "contre " + esc(String(e.adversaire).toUpperCase()) : "";
        if (e.resultat === "GAGNEE") {
            d.k = "win"; d.h = "VICTOIRE !"; d.b1 = "CÉLÉBRER"; d.pied = "D’APRÈS LE DERNIER SCORE RELEVÉ";
            d.score = [Number(pour), Number(contre), a];
            d.msg = guerre ? "La guerre est <b>gagnée</b>. Chaque tir, chaque contrat, chaque saut a compté, et <b>c’est vous qui l’avez fait</b>. Merci à tous les pilotes : <b>cette victoire est la vôtre</b>."
                : "L’élection est <b>gagnée</b>. Chaque contrat remis, chaque vote a compté, et <b>c’est vous qui l’avez fait</b>. Merci à tous les pilotes : <b>le scrutin est à nous</b>.";
        } else if (e.resultat === "PERDUE") {
            d.k = "lose"; d.h = guerre ? "BATAILLE <em>PERDUE</em>" : "ÉLECTION <em>PERDUE</em>"; d.b1 = "VOIR LA DIRECTIVE"; d.b2 = "FERMER"; d.ouvre = true; d.pied = "D’APRÈS LE DERNIER SCORE RELEVÉ";
            d.score = [Number(pour), Number(contre), a];
            d.msg = (guerre ? "Cette fois, la balance a penché de l’autre côté. Ce n’est qu’<b class=\"ec-esp\">une bataille</b> : la galaxie ne s’arrête pas là."
                : "Cette fois, le scrutin a tourné en faveur de l’autre camp. Ce n’est qu’<b class=\"ec-esp\">une élection</b> : la galaxie ne s’arrête pas là.")
                + " <b class=\"ec-esp\">Le prochain tick apporte de nouveaux objectifs</b>, et l’escadron aura besoin de chacun de vous pour se relever.";
        } else {
            d.k = "fin"; d.h = nom + " <em>TERMINÉE</em>"; d.pied = "RÉSULTAT NON CONFIRMÉ";
            d.msg = Nom + " est terminée, mais <b>le résultat n’a pas pu être confirmé</b> : aucun pilote n’a relevé le score à temps. "
                + (pour != null && contre != null ? "Dernier score connu : <b>" + Number(pour) + " – " + Number(contre) + "</b>. " : "Aucun score n’a été relevé. ") + "Merci à tous ceux qui ont joué pour nous.";
        }
        return d;
    }

    // ------------------------------------------------------------------------------------------------------------
    // MUSIQUE (courte, en boucle le temps de lire la fenetre ; fichiers dans sons/, absents = silence)
    // war : appel aux armes · vote : aventure · win : victoire epique · lose : remobilisation · fin : pas de musique
    // ------------------------------------------------------------------------------------------------------------
    var MUSIQUES = { war: "sons/conflit-guerre.mp3", vote: "sons/conflit-election.mp3", win: "sons/conflit-victoire.mp3", lose: "sons/conflit-defaite.mp3" };
    var VOLUME = .65, FONDU_ENTREE = 1800, FONDU_SORTIE = 700;
    var musique = (function () {
        var a = null, pas = null;
        function muet() { try { return !!(window.edteamSon && window.edteamSon.estMuet()); } catch (e) { return false; } }
        function fondu(el, vers, ms, fin) {
            clearInterval(el.__fondu);
            var de = el.volume, t0 = Date.now();
            el.__fondu = setInterval(function () {
                var p = Math.min(1, (Date.now() - t0) / ms);
                try { el.volume = Math.max(0, Math.min(1, de + (vers - de) * p)); } catch (e) { /* volume refuse */ }
                if (p >= 1) { clearInterval(el.__fondu); if (fin) fin(); }
            }, 40);
        }
        function arreter() {
            var el = a; a = null;
            if (pas) { document.removeEventListener("pointerdown", pas, true); document.removeEventListener("keydown", pas, true); pas = null; }
            if (!el) return;
            fondu(el, 0, FONDU_SORTIE, function () { try { el.pause(); el.removeAttribute("src"); el.load(); } catch (e) { /* rien */ } });
        }
        function jouer(k) {
            arreter();
            var src = MUSIQUES[k];
            if (!src || window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches) return;
            try {
                var el = new Audio(src); a = el; el.loop = true; el.volume = 0; el.preload = "auto"; el.muted = muet();
                el.addEventListener("error", function () { if (a === el) a = null; });   // fichier absent : silence
                function lancer() {
                    var r; try { r = el.play(); } catch (e) { return; }
                    if (r && r.then) r.then(function () { if (a === el) fondu(el, VOLUME, FONDU_ENTREE); }, function () {
                        // lecture automatique refusee par le navigateur : on retente au premier geste dans la fenetre
                        if (a !== el || pas) return;
                        pas = function () { document.removeEventListener("pointerdown", pas, true); document.removeEventListener("keydown", pas, true); pas = null; if (a === el) lancer(); };
                        document.addEventListener("pointerdown", pas, true); document.addEventListener("keydown", pas, true);
                    });
                }
                lancer();
            } catch (e) { /* pas de musique, la fenetre reste normale */ }
        }
        window.addEventListener("edteam-son", function () { if (a) a.muted = muet(); });
        return { jouer: jouer, arreter: arreter };
    })();

    // ------------------------------------------------------------------------------------------------------------
    // AFFICHAGE
    // ------------------------------------------------------------------------------------------------------------
    function fermer() { musique.arreter(); var ov = document.getElementById("edteam-cflt"); if (ov) ov.remove(); document.removeEventListener("keydown", surTouche, true); }
    var courant = null;
    function surTouche(ev) { if (ev.key === "Escape" && courant) { ev.stopPropagation(); courant("suivant"); } }

    function chaine(liste) {
        return new Promise(function (fini) {
            var i = 0, n = liste.length;
            function montrer() {
                var it = liste[i], d = contenu(it.e), ov = document.getElementById("edteam-cflt");
                marquer(it.cle);
                if (ov) ov.remove();
                ov = document.createElement("div"); ov.id = "edteam-cflt"; ov.className = d.k;
                ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "Conflit");
                var score = d.score ? "<div><div class=\"ec-score\"><span class=\"n\">" + d.score[0] + "</span><span class=\"t\">JOURS<i>" + d.score[2] + "</i></span><span class=\"n\">" + d.score[1] + "</span></div></div>" : "";
                ov.innerHTML = "<div class=\"ec-fx\"><div class=\"ec-ray\"></div>" + particules(d.k) + "</div>"
                    + (n > 1 ? "<div class=\"ec-cpt\"><span>" + (i + 1) + " / " + n + "</span><button type=\"button\" data-a=\"tout\">TOUT PASSER</button></div>" : "")
                    + "<button type=\"button\" class=\"ec-x\" data-a=\"suivant\" aria-label=\"Fermer\">×</button>"
                    + "<div class=\"ec-corps\"><div class=\"ec-kick\">" + d.kick + "</div><div class=\"ec-embl\"><i class=\"ec-an\"></i><i class=\"ec-an\"></i><i class=\"ec-an\"></i>" + EMB[d.k] + "</div>"
                    + "<h1>" + d.h + "</h1><div class=\"ec-lieu\">" + d.lieu + "</div>" + score + "<div class=\"ec-msg\">" + d.msg + "</div>"
                    + (d.puces.length ? "<div class=\"ec-puces\">" + d.puces.map(function (p) { return "<span>" + p + "</span>"; }).join("") + "</div>" : "")
                    + "<div class=\"ec-acts\"><button type=\"button\" class=\"ec-bt\" data-a=\"" + (d.ouvre ? "ouvrir" : "suivant") + "\">" + d.b1 + "</button>"
                    + (d.b2 ? "<button type=\"button\" class=\"ec-bt s\" data-a=\"suivant\">" + d.b2 + "</button>" : "") + "</div></div>"
                    + "<div class=\"ec-pied\">" + d.pied + "</div>";
                document.body.appendChild(ov);
                musique.jouer(d.k);
                function agir(a) {
                    courant = null;
                    if (a === "tout") { for (var j = i; j < n; j++) marquer(liste[j].cle); fermer(); fini(); return; }
                    if (a === "ouvrir") { fermer(); try { if (typeof etat.opts.ouvrir === "function") etat.opts.ouvrir(it.e.ordre_id); } catch (er) { /* directive indisponible */ } fini(); return; }
                    i++; if (i >= n) { fermer(); fini(); } else montrer();
                }
                courant = agir;
                ov.addEventListener("click", function (ev) { var b = ev.target.closest && ev.target.closest("[data-a]"); if (b) agir(b.getAttribute("data-a")); });
                document.addEventListener("keydown", surTouche, true);
            }
            montrer();
        });
    }

    function bloque() { return BLOQUANTS.some(function (id) { var e = document.getElementById(id); return e && getComputedStyle(e).display !== "none"; }); }
    async function jouer() {
        if (etat.enCours || !etat.file.length) return;
        if (bloque()) { clearTimeout(etat.minuteur); etat.minuteur = setTimeout(jouer, 3000); return; }
        etat.enCours = true;
        try {
            css();
            var liste = etat.file.splice(0);
            await chaine(liste);
        } catch (e) { console.error("Fenêtre de conflit :", e); fermer(); }
        etat.enCours = false;
        if (etat.file.length) jouer();
    }

    var PRIO = { DEBUT: 1, GAGNEE: 2, PERDUE: 3, INCONNU: 4 };
    window.EdteamConflitModale = {
        // profil : ligne du pilote ; evts : { ordre_id : [evenements] } (window.cacheEvtConflits) ; opts.ouvrir(ordre_id) : ouvre la directive
        verifier: function (profil, evts, opts) {
            try {
                if (!profil || !profil.user_id || profil.est_approuve === false || !aEscadron(profil) || !evts) return;
                etat.profil = profil; if (opts) etat.opts = opts;
                var vus = lire(profil.user_id), maintenant = Date.now() / 1000, neufs = [];
                Object.keys(evts).forEach(function (k) {
                    (evts[k] || []).forEach(function (e) {
                        if (!e || e.type_ordre === "BAISSE" || (e.genre !== "GUERRE" && e.genre !== "ELECTION")) return;
                        if (e.evenement !== "DEBUT" && e.evenement !== "FIN") return;
                        if (!(maintenant - Number(e.detecte) < AGE_MAX)) return;
                        var cle = [e.ordre_id, e.genre, e.evenement, e.detecte].join("|");
                        if (vus.indexOf(cle) >= 0 || etat.ids[cle]) return;
                        etat.ids[cle] = true; neufs.push({ e: e, cle: cle });
                    });
                });
                if (!neufs.length) return;
                neufs.sort(function (a, b) { return (PRIO[a.e.evenement === "DEBUT" ? "DEBUT" : a.e.resultat] || 9) - (PRIO[b.e.evenement === "DEBUT" ? "DEBUT" : b.e.resultat] || 9); });
                etat.file = etat.file.concat(neufs);
                clearTimeout(etat.minuteur); etat.minuteur = setTimeout(jouer, 1800);
            } catch (e) { /* une fenetre ne doit jamais gener la page */ }
        },
        // pour les tests : oublie ce que ce pilote a vu
        oublier: function (uid) { try { localStorage.removeItem(PREFIXE + uid); } catch (e) { /* rien */ } etat.ids = {}; }
    };
})();
