// =====================================================================================================
//  FLEET CARRIERS (SQL 185, plugin 2.52) : la position du carrier personnel de chaque pilote.
//    EdteamCarriers.monterMien(element)      : carte « MON FLEET CARRIER » (page Mon hangar) avec la case « montrer a mon escadron »
//    EdteamCarriers.monterEscadron(element)  : liste des carriers PARTAGES de mon escadron (page Escadron)
//  Une seule lecture serveur par ecran (fc_mien / fc_escadron), a l'ouverture, gardee 3 minutes dans la session. Rien en arriere-plan.
//  Aucun solde, aucune cargaison, aucun carburant : seulement indicatif, nom, acces aux docks, systeme, saut annonce et « vu il y a ».
//  Les noms de systemes sont copiables d'un clic (copier-lieux.js) pour etre colles dans la carte de la galaxie du jeu.
// =====================================================================================================
(function () {
    "use strict";
    if (window.EdteamCarriers) return;

    const E = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const CLE = "edteam_fc_v1_";
    const ACCES = { all: ["TOUS LES PILOTES", "#00FF66"], squadronfriends: ["ESCADRON ET AMIS", "#00F0FF"], squadron: ["ESCADRON", "#00F0FF"], friends: ["AMIS", "#FFB000"], none: ["FERMÉ", "#8b97a0"] };
    const OUVERT = new Set(["all", "squadronfriends", "squadron"]);   // un pilote de l'escadron peut s'y poser

    const CSS = `
.fc{--c:#00F0FF;font-family:'Share Tech Mono',monospace;margin:0 0 14px}
.fc *{box-sizing:border-box}
.fc-h{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin:0 0 10px}
.fc-h h2{margin:0;color:var(--c);font-size:1.05em;letter-spacing:3px;font-weight:normal;text-transform:uppercase}
.fc-h em{color:#8b97a0;font-size:.74em;font-style:normal;letter-spacing:1px}
.fc-n{margin-left:auto;color:#8b97a0;font-size:.78em;letter-spacing:1px}
.fc-corps{display:flex;gap:22px;align-items:center;flex-wrap:wrap}
.fc-id{min-width:200px;flex:1 1 220px}
.fc-id b{display:block;color:#fff;font-size:1.35em;letter-spacing:2px;font-weight:normal;overflow-wrap:anywhere}
.fc-id small{display:block;color:#8b97a0;letter-spacing:3px;font-size:.78em;margin-top:2px}
.fc-info{display:flex;gap:26px;flex-wrap:wrap;flex:2 1 320px}
.fc-info div small{display:block;color:#7d8a92;font-size:.68em;letter-spacing:2px;margin-bottom:3px}
.fc-info div span{color:#e8f6f8;font-size:.98em;letter-spacing:1px}
.fc-sys{color:#fff!important;font-size:1.1em!important}
.fc-acc{display:inline-block;border:1px solid currentColor;padding:1px 8px;font-size:.78em!important;letter-spacing:2px}
.fc-saut{margin-top:12px;padding:8px 12px;border-left:3px solid #FFB000;background:rgba(255,176,0,.08);color:#ffd98a;font-size:.88em;letter-spacing:.5px;line-height:1.5}
.fc-saut b{color:#fff;font-weight:normal}
.fc-part{display:flex;align-items:center;gap:10px;margin-top:12px;color:#aab7bd;font-size:.8em;letter-spacing:.5px;cursor:pointer;width:fit-content}
.fc-part input{accent-color:#00F0FF;width:16px;height:16px;cursor:pointer}
.fc-note{margin-top:10px;color:#6f7d85;font-size:.72em;line-height:1.5;letter-spacing:.3px}
.fc-vide{color:#7d8a92;font-size:.86em;line-height:1.6;letter-spacing:.5px}
.fc-fil{display:flex;gap:8px;margin:0 0 10px;flex-wrap:wrap}
.fc-fil button{background:transparent;border:1px solid #3a474d;color:#aab7bd;font:inherit;font-size:.74em;letter-spacing:2px;padding:5px 12px;cursor:pointer}
.fc-fil button.on{border-color:var(--c);color:#fff;background:rgba(0,240,255,.12)}
.fc-tab{width:100%;border-collapse:collapse;font-size:.9em}
.fc-tab th{text-align:left;color:#7d8a92;font-size:.7em;letter-spacing:2px;font-weight:normal;padding:6px 10px;border-bottom:1px solid rgba(0,240,255,.3)}
.fc-tab td{padding:9px 10px;border-bottom:1px dashed #28343a;vertical-align:middle;color:#dfe9ec}
.fc-tab tr.moi td:first-child{box-shadow:inset 3px 0 0 var(--c)}
.fc-tab td b{color:#fff;font-weight:normal;letter-spacing:1px}
.fc-tab td small{display:block;color:#7d8a92;letter-spacing:2px;font-size:.78em;margin-top:2px}
.fc-tab .att{color:#ffd98a;font-size:.86em;line-height:1.45}
.fc-tab .inv{color:#8b97a0}
.fc-pil{display:flex;align-items:center;gap:10px}.fc-pil .ph{width:var(--t,34px);height:var(--t,34px);font-size:calc(var(--t,34px)*.36)}.fc-pil b{overflow-wrap:anywhere}
.fc-tag{display:inline-block;margin-left:8px;border:1px solid #8b97a0;color:#8b97a0;font-size:.7em;letter-spacing:1px;padding:0 6px}
.fc-sv{display:inline-block;margin:0 4px 3px 0;padding:0 6px;border:1px solid #00F0FF;color:#bff;font-size:.7em;letter-spacing:1px;white-space:nowrap}
/* theme AMBRE de l'onglet FLEET CARRIERS de la page Escadron (la page Hangar garde le cyan) : autre couleur que le tableau des systemes */
.fc.ambre{--c:#FFB000}
.fc.ambre .fc-fil button.on{border-color:#FFB000;color:#fff;background:rgba(255,176,0,.14)}
.fc.ambre .fc-tab th{border-bottom-color:rgba(255,176,0,.4)}
.fc.ambre .fc-tab td{border-bottom-color:#3a2d12}
.fc.ambre .fc-tab tbody tr:hover td{background:rgba(255,176,0,.05)}
.fc.ambre .fc-sv{border-color:#2fe0a8;color:#9ff3d6;background:rgba(47,224,168,.07)}
.fc.ambre .fc-sv.p{border-color:#6b7680;color:#8b97a0;background:none}
.fc.ambre .fc-dirtag{border-color:#FF5A36;color:#ff9a80;background:rgba(255,90,54,.12)}
.fc.ambre .fc-tab tr.dir td:first-child{box-shadow:inset 3px 0 0 #FF5A36}.fc.ambre .fc-tab tr.moi td:first-child{box-shadow:inset 3px 0 0 #FFB000}.fc.ambre .fc-tab tr.moi.dir td:first-child{box-shadow:inset 3px 0 0 #FFB000,inset 6px 0 0 #FF5A36}
.fc.ambre .fc-dirsel select:focus{border-color:#FFB000}
.fc-holo{width:158px;padding:8px 10px!important}
/* hologramme : image du carrier dans sa teinte d'origine, lignes de balayage, halo ambre ; le noir de l'espace se fond dans la page */
.fc-hg{position:relative;width:138px;height:74px;overflow:hidden;border:1px solid rgba(255,176,0,.45);background:#030201;box-shadow:0 0 14px rgba(255,176,0,.18),inset 0 0 18px rgba(0,0,0,.7)}
.fc-hg img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:saturate(1.15) contrast(1.05) brightness(1.05);opacity:.95}
.fc-hg:after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.32) 0 1px,transparent 1px 3px)}
.fc-hg:before{content:"";position:absolute;left:0;right:0;top:-30%;height:30%;pointer-events:none;background:linear-gradient(180deg,transparent,rgba(255,176,0,.16),transparent);animation:fcBalaye 4.5s linear infinite;z-index:2}
@keyframes fcBalaye{0%{top:-30%}100%{top:100%}}
@media (prefers-reduced-motion:reduce){.fc-hg:before{animation:none;display:none}}
.fc-sv.p{border-color:#6b7680;color:#8b97a0;text-decoration:line-through}
/* carte « Mon Fleet Carrier » du hangar : theme ambre, grand hologramme, services en tuiles par famille */
.fcm{display:flex;gap:22px;flex-wrap:wrap;align-items:stretch}
.fcm-holo{flex:0 0 270px;max-width:100%;display:flex;flex-direction:column;gap:6px}
.fcm-hg{position:relative;width:100%;aspect-ratio:4/3;overflow:hidden;border:1px solid rgba(255,176,0,.5);background:#030201;box-shadow:0 0 22px rgba(255,176,0,.2),inset 0 0 26px rgba(0,0,0,.75)}
.fcm-hg img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;filter:saturate(1.15) contrast(1.05) brightness(1.08);opacity:.96}
.fcm-hg:after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.3) 0 1px,transparent 1px 3px)}
.fcm-hg:before{content:"";position:absolute;left:0;right:0;top:-30%;height:30%;pointer-events:none;background:linear-gradient(180deg,transparent,rgba(255,176,0,.17),transparent);animation:fcBalaye 4.5s linear infinite;z-index:2}
.fcm-hg i{position:absolute;width:12px;height:12px;border:0 solid #FFB000;z-index:3}
.fcm-hg i:nth-of-type(1){left:4px;top:4px;border-width:2px 0 0 2px}.fcm-hg i:nth-of-type(2){right:4px;top:4px;border-width:2px 2px 0 0}.fcm-hg i:nth-of-type(3){left:4px;bottom:4px;border-width:0 0 2px 2px}.fcm-hg i:nth-of-type(4){right:4px;bottom:4px;border-width:0 2px 2px 0}
.fcm-hg span{position:absolute;left:0;right:0;bottom:0;z-index:3;padding:14px 10px 5px;background:linear-gradient(0deg,rgba(3,2,1,.92),transparent);color:#ffd98a;font-size:.68em;letter-spacing:2px}
@media (prefers-reduced-motion:reduce){.fcm-hg:before{animation:none;display:none}}
.fcm-main{flex:1 1 420px;min-width:0;display:flex;flex-direction:column;gap:10px}
.fcm-bilan{display:flex;gap:8px;flex-wrap:wrap}
.fcm-bilan span{border:1px solid #3a2d12;padding:3px 10px;font-size:.72em;letter-spacing:2px;color:#8b97a0}
.fcm-bilan span b{font-weight:normal;font-size:1.25em;margin-right:6px}
.fcm-bilan .a{border-color:#2fe0a8;color:#9ff3d6;background:rgba(47,224,168,.07)}.fcm-bilan .a b{color:#2fe0a8}
.fcm-bilan .p{border-color:#FFB000;color:#ffd98a;background:rgba(255,176,0,.08)}.fcm-bilan .p b{color:#FFB000}
.fcm-fam{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px;margin-top:14px}
.fcm-f{border:1px solid #3a2d12;background:rgba(255,176,0,.03);padding:8px 10px}
.fcm-f h4{margin:0 0 6px;display:flex;justify-content:space-between;gap:8px;font-weight:normal;font-size:.72em;letter-spacing:2.5px;color:#FFB000;text-transform:uppercase}
.fcm-f h4 em{font-style:normal;color:#8b97a0;letter-spacing:1px}
.fcm-t{display:flex;gap:9px;align-items:flex-start;padding:5px 0;border-top:1px dashed #2e2410}
.fcm-t:first-of-type{border-top:0}
.fcm-t u{flex:0 0 9px;height:9px;margin-top:4px;border-radius:50%;background:#2fe0a8;box-shadow:0 0 8px #2fe0a8;text-decoration:none}
.fcm-t.p u{background:#FFB000;box-shadow:0 0 8px #FFB000}.fcm-t.o u{background:#3a444a;box-shadow:none}
.fcm-t b{display:block;font-weight:normal;font-size:.8em;letter-spacing:1.5px;color:#e8f6f8}
.fcm-t small{display:block;color:#7d8a92;font-size:.68em;letter-spacing:.5px;line-height:1.4;margin-top:1px}
.fcm-t em{margin-left:auto;font-style:normal;font-size:.62em;letter-spacing:1.5px;padding-top:2px;white-space:nowrap;color:#2fe0a8}
.fcm-t.p em{color:#FFB000}.fcm-t.o em{color:#6b7680}.fcm-t.o b{color:#7d8a92}
@media (max-width:760px){.fcm-holo{flex-basis:100%}}
.fc.ambre .fc-part input{accent-color:#FFB000}
/* message du proprietaire (SQL 191) : zone de saisie dans Mon hangar, pastille + infobulle + fenetre dans l'onglet de l'escadron */
.fcm-msg{margin-top:0}.fcm-msg .top{display:flex;align-items:baseline;gap:12px;margin-bottom:4px;min-width:0}.fcm-msg label{color:#7d8a92;font-size:.68em;letter-spacing:2px;white-space:nowrap}
.fcm-msg .ligne{display:flex;gap:10px;align-items:stretch}.fcm-msg .btns{display:flex;flex-direction:column;gap:6px;flex:0 0 auto}.fcm-msg .btns button{flex:1 1 0;min-width:104px}
.fcm-msg textarea{flex:1 1 auto;min-width:0;width:100%;min-height:58px;resize:vertical;background:#05080c;border:1px solid #3a2d12;color:#e8f6f8;font:inherit;font-size:.86em;padding:7px 9px;letter-spacing:.3px;line-height:1.45}
.fcm-msg textarea:focus{outline:none;border-color:#FFB000}.fcm-msg textarea::placeholder{color:#55606a}
.fcm-msg button{background:rgba(255,176,0,.1);border:1px solid #FFB000;color:#FFD98A;font:inherit;font-size:.72em;letter-spacing:2px;padding:4px 14px;cursor:pointer}
.fcm-msg button.g{background:transparent;border-color:#5a5340;color:#9b9580}.fcm-msg button:disabled{opacity:.5;cursor:default}
.fcm-msg .etat{flex:1 1 auto;min-width:0;font-size:.72em;color:#9ff3d6;letter-spacing:.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fcm-msg .cpt{flex:0 0 auto;color:#6f7d85;font-size:.7em;letter-spacing:1px}
.fcm-bas{display:flex;align-items:center;justify-content:space-between;gap:10px 18px;flex-wrap:wrap}.fcm-bas .fc-part{margin:0}
@media (max-width:560px){.fcm-msg .ligne{flex-direction:column}.fcm-msg .btns{flex-direction:row}}
.fc-msgb{display:inline-block;margin-top:5px;border:1px solid #FFB000;color:#FFD98A;background:rgba(255,176,0,.1);padding:0 8px;font-size:.7em;letter-spacing:1.5px;cursor:pointer;white-space:nowrap}
.fc-msgb:hover{background:rgba(255,176,0,.22);color:#fff}.fc-msgb.old{border-color:#6b6350;color:#9b9580;background:none}
.fc-tip{position:fixed;display:none;z-index:99999;max-width:340px;background:rgba(14,9,0,.97);border:1px solid #FFB000;color:#fff;padding:8px 11px;font:.78rem/1.5 'Share Tech Mono',monospace;letter-spacing:.4px;pointer-events:none;box-shadow:0 0 14px rgba(0,0,0,.7);white-space:pre-wrap;overflow-wrap:anywhere}
.fc-tip small{display:block;margin-top:5px;color:#9b9580;font-size:.9em}
.fc-mo{position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:16px}
.fc-mb{width:min(520px,100%);background:#0c0803;border:1px solid #FFB000;box-shadow:0 0 30px rgba(255,176,0,.25);padding:16px 18px;font-family:'Share Tech Mono',monospace;color:#e8f6f8}
.fc-mb .h{color:#FFB000;font-size:.7em;letter-spacing:3px}.fc-mb .t{color:#fff;font-size:1.25em;letter-spacing:2px;margin:4px 0 2px}.fc-mb .p{color:#9b9580;font-size:.8em;letter-spacing:1px;margin-bottom:10px}
.fc-mb .x{border-left:3px solid #FFB000;background:rgba(255,176,0,.07);padding:10px 12px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere;font-size:.92em}
.fc-mb .f{color:#7d8a92;font-size:.72em;letter-spacing:.5px;margin-top:9px;line-height:1.5}.fc-mb .f b{color:#FFD98A;font-weight:normal}
.fc-mb button{margin-top:12px;background:rgba(255,176,0,.1);border:1px solid #FFB000;color:#FFD98A;font:inherit;font-size:.78em;letter-spacing:2px;padding:6px 20px;cursor:pointer}
.fc-hg img.sc{object-fit:contain}
.fcm-cls{display:flex;align-items:center;justify-content:space-between;gap:8px 18px;flex-wrap:wrap}
.fcm-cls .txt{flex:1 1 240px;min-width:0}.fcm-cls small{display:block;color:#7d8a92;font-size:.68em;letter-spacing:2px}
.fcm-cl{display:flex;gap:6px;flex:0 0 auto}
.fcm-cl button{width:84px;background:#030201;border:1px solid #3a2d12;padding:3px 3px 3px;cursor:pointer;color:#8b97a0;font:inherit;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0}
.fcm-cl button img{width:100%;height:36px;object-fit:contain;opacity:.7}
.fcm-cl button span{font-size:.58em;letter-spacing:1.5px;white-space:nowrap}
.fcm-cl button:hover{border-color:#FFB000}.fcm-cl button:hover img{opacity:1}
.fcm-cl button.on{border-color:#FFB000;background:rgba(255,176,0,.12);color:#FFD98A}.fcm-cl button.on img{opacity:1}
.fcm-cls .aide{display:block;margin-top:3px;color:#6f7d85;font-size:.68em;letter-spacing:.3px;line-height:1.4}
.fc-sctag{display:inline-block;border:1px solid #FFB000;color:#FFB000;background:rgba(255,176,0,.1);padding:1px 8px;font-size:.7em;letter-spacing:2px;white-space:nowrap}
.fc-srvvu{display:block;margin-top:3px;color:#7d8a92;font-size:.7em;letter-spacing:.5px}
.fc-scesc{display:block;color:#8b97a0;font-size:.74em;letter-spacing:1px;margin-top:3px}
.fc.ambre .fc-tab tr.sc td{background:rgba(255,176,0,.07)}
.fc-svc{max-width:300px}.fc-sv-mien{margin-top:12px}.fc-sv-mien small{display:block;color:#7d8a92;font-size:.68em;letter-spacing:2px;margin-bottom:4px}
.fc-dirtag{display:inline-block;margin:4px 0 0;padding:0 7px;border:1px solid #FF7100;color:#FF9A4D;background:rgba(255,113,0,.1);font-size:.72em;letter-spacing:1.5px;white-space:nowrap}
.fc-tab tr.dir td:first-child{box-shadow:inset 3px 0 0 #FF7100}.fc-tab tr.moi.dir td:first-child{box-shadow:inset 3px 0 0 #00F0FF,inset 6px 0 0 #FF7100}
.fc-tab th[data-t]{cursor:pointer;white-space:nowrap}.fc-tab th[data-t]:hover,.fc-tab th.tri{color:#fff}
.fc-dd{white-space:nowrap}.fc-dd small{display:block;color:#7d8a92;letter-spacing:1px;font-size:.78em;margin-top:2px}
.fc-dirsel{display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin:0 0 10px;font-size:.72em;letter-spacing:1.5px;color:#7d8a92}
.fc-dirsel select{background:#05080c;border:1px solid #3a474d;color:#dfe9ec;font:inherit;padding:5px 8px;letter-spacing:1px;max-width:100%}.fc-dirsel select:focus{outline:none;border-color:var(--c)}
.fcm-sep{flex:0 0 14px}
@media (max-width:760px){.fc-holo{width:auto}.fc-tab thead{display:none}.fc-tab,.fc-tab tbody,.fc-tab tr,.fc-tab td{display:block;width:100%}.fc-tab tr{padding:8px 0;border-bottom:1px dashed #28343a}.fc-tab td{border:0;padding:3px 4px}}
`;
    function style() {
        if (document.getElementById("edteam-fc-css")) return;
        const s = document.createElement("style"); s.id = "edteam-fc-css"; s.textContent = CSS; (document.head || document.documentElement).appendChild(s);
    }

    function pilote(c, t) {
        const P = window.EDTEAMPhotos, nom = "CMDR " + String(c.pilote || "?").toUpperCase();
        const av = P ? P.avatar({ nom: c.pilote, taille: t || 34, role: c.amiral ? "amiral" : c.officier ? "officier" : "pilote" }) : "";
        return '<div class="fc-pil">' + av + "<b>" + E(nom) + "</b></div>";
    }
    const lieu = n => n ? (window.EdteamCopie ? window.EdteamCopie.lieu(n) : E(n)) : "";
    function ilYa(s) {
        const d = Math.max(0, Math.floor(Date.now() / 1000 - s));
        if (d < 90) return "à l’instant"; if (d < 5400) return "il y a " + Math.round(d / 60) + " min"; if (d < 129600) return "il y a " + Math.round(d / 3600) + " h"; return "il y a " + Math.round(d / 86400) + " j";
    }
    function heure(s) {
        const d = new Date(s * 1000), auj = new Date(), mm = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
        return d.toDateString() === auj.toDateString() ? mm : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) + " " + mm;
    }
    // saut annonce : jamais « arrive » (seule une position lue ensuite dans le journal le confirme)
    function saut(c) {
        if (!c.destination || !c.depart) return "";
        const reste = c.depart - Date.now() / 1000;
        if (reste > 0) return 'Saut annoncé vers <b>' + lieu(c.destination) + "</b> · départ à " + E(heure(c.depart)) + " (dans " + (reste < 5400 ? Math.max(1, Math.round(reste / 60)) + " min" : Math.round(reste / 3600) + " h") + ")";
        return 'Saut annoncé vers <b>' + lieu(c.destination) + "</b> · départ prévu à " + E(heure(c.depart)) + " · <b>arrivée non confirmée</b> (le carrier a peut-être déjà sauté)";
    }
    const badgeAcces = a => { const x = ACCES[a]; return x ? '<span class="fc-acc" style="color:' + x[1] + '">' + x[0] + "</span>" : '<span class="inv">inconnu</span>'; };

    async function moi() { try { const r = await window.supabaseApp.auth.getSession(); return (r && r.data && r.data.session && r.data.session.user && r.data.session.user.id) || ""; } catch (e) { return ""; } }
    async function rpc(nom, args, cle) {
        const uid = cle ? await moi() : "";   // memoire propre au compte
        if (cle) { try { const c = JSON.parse(sessionStorage.getItem(CLE + cle) || "null"); if (c && c.u === uid && Date.now() - c.ts < 180000) return c.d; } catch (e) { /* pas de cache */ } }
        const r = await window.supabaseApp.rpc(nom, args || {});
        if (r.error) { const e = new Error(r.error.message || "erreur"); e.code = r.error.code; e.status = r.status; throw e; }
        if (cle && r.data != null) { try { sessionStorage.setItem(CLE + cle, JSON.stringify({ ts: Date.now(), u: uid, d: r.data })); } catch (e) { /* tant pis */ } }   // une reponse vide n'est jamais gardee : le carrier apparait des que le plugin l'a envoye
        return r.data;
    }
    const oublier = () => { try { sessionStorage.removeItem(CLE + "mien"); sessionStorage.removeItem(CLE + "esc"); } catch (e) { /* rien */ } };
    const absente = e => e && (e.status === 404 || e.code === "PGRST202" || e.code === "42883");

    // ---- « Mon Fleet Carrier » ----
    // ---- message du proprietaire sur son carrier (SQL 191) ----
    const msgAncien = c => !!(c && c.message_sys && c.systeme && String(c.message_sys).toLowerCase() !== String(c.systeme).toLowerCase());
    const msgMeta = c => "écrit " + ilYa(c.message_vu) + (c.message_sys ? " à " + c.message_sys : "");
    function blocMessage(c) {
        return '<div class="fcm-msg"><div class="top"><label for="fc-msg-t">MESSAGE POUR LES PILOTES DE L’ESCADRON</label><span class="etat">'
            + (c.message ? "Publié, " + E(msgMeta(c)) + (msgAncien(c) ? " · le carrier a bougé depuis" : "") : "") + (!c.partage ? (c.message ? " · " : "") + "invisible tant que votre carrier n’est pas partagé" : "")
            + '</span><span class="cpt"></span></div>'
            + '<div class="ligne"><textarea id="fc-msg-t" maxlength="200" rows="2" placeholder="Ex. : posé là pour la mission. Réparation et marché ouverts, tritium à bord.">' + E(c.message || "") + "</textarea>"
            + '<div class="btns"><button type="button" data-a="pub">PUBLIER</button><button type="button" class="g" data-a="eff">EFFACER</button></div></div></div>';
    }
    function selecteurClasse(c) {
        const cur = holoDe(c);
        return '<div class="fcm-cls"><div class="txt"><small>CLASSE DU CARRIER</small><span class="aide">' + (c.holo ? "Classe affichée à vos camarades." : "Par défaut : coque de base. Choisissez la classe indiquée dans la carte de la galaxie du jeu.") + '</span></div><div class="fcm-cl">'
            + CLASSES.map(x => '<button type="button" data-h="' + x[0] + '"' + (x[0] === cur ? ' class="on"' : "") + ' title="' + E(x[1]) + '"><img src="images/carriers/carrier-' + x[0] + '.webp" alt="" loading="lazy" onerror="this.remove()"><span>' + x[1] + "</span></button>").join("")
            + "</div></div>";
    }
    function brancherClasse(el, c) {
        const z = el.querySelector(".fcm-cls"); if (!z) return;
        z.addEventListener("click", async e => {
            const b = e.target.closest("button[data-h]"); if (!b) return;
            const v = b.dataset.h; z.querySelectorAll("button").forEach(x => { x.disabled = true; });
            try {
                const r = await window.supabaseApp.rpc("fc_holo", { p_holo: v });
                if (r.error) { const er = new Error(r.error.message || "erreur"); er.code = r.error.code; er.status = r.status; throw er; }
                if (r.data === true) {
                    c.holo = v; oublier();
                    const im = el.querySelector(".fcm-hg img"); if (im) { im.src = imgCarrier(c); }
                    z.querySelectorAll("button").forEach(x => x.classList.toggle("on", x.dataset.h === v));
                    z.querySelector(".aide").textContent = "Classe affichée à vos camarades.";
                } else z.querySelector(".aide").textContent = "Impossible pour le moment.";
            } catch (x) { console.error("Carrier : classe", x); z.querySelector(".aide").textContent = absente(x) ? "Pas encore activé sur le serveur." : "Impossible pour le moment."; }
            z.querySelectorAll("button").forEach(x => { x.disabled = false; });
        });
    }
    function brancherMessage(el) {
        const z = el.querySelector(".fcm-msg"); if (!z) return;
        const ta = z.querySelector("textarea"), cpt = z.querySelector(".cpt"), etat = z.querySelector(".etat");
        const maj = () => { cpt.textContent = ta.value.length + " / 200"; }; ta.addEventListener("input", maj); maj();
        z.addEventListener("click", async e => {
            const b = e.target.closest("button[data-a]"); if (!b) return;
            const eff = b.dataset.a === "eff"; if (eff) { ta.value = ""; maj(); }
            z.querySelectorAll("button").forEach(x => { x.disabled = true; });
            try {
                const r = await window.supabaseApp.rpc("fc_message", { p_texte: eff ? "" : ta.value });
                if (r.error) { const er = new Error(r.error.message || "erreur"); er.code = r.error.code; er.status = r.status; throw er; }
                if (r.data === true) { oublier(); etat.textContent = eff ? "Message effacé" : "Publié à l’instant : vos camarades le voient dans la page Escadron"; }
                else etat.textContent = "Réessayez dans un instant";
            } catch (x) { console.error("Carrier : message", x); etat.textContent = absente(x) ? "Pas encore activé sur le serveur" : "Impossible pour le moment"; }
            z.querySelectorAll("button").forEach(x => { x.disabled = false; });
        });
    }
    let infoEl = null;
    const info = () => infoEl || (infoEl = Object.assign(document.body.appendChild(document.createElement("div")), { className: "fc-tip" }));
    function modaleMessage(c) {
        if (!c || !c.message) return;
        const o = document.createElement("div"); o.className = "fc-mo";
        o.innerHTML = '<div class="fc-mb" role="dialog"><div class="h">MESSAGE DU PROPRIÉTAIRE</div><div class="t"></div><div class="p"></div><div class="x"></div><div class="f"></div><button type="button">FERMER</button></div>';
        o.querySelector(".t").textContent = c.nom || c.indicatif || "Carrier";
        o.querySelector(".p").textContent = (c.pilote ? "CMDR " + String(c.pilote).toUpperCase() + " · " : "") + (c.systeme || "position inconnue");
        o.querySelector(".x").textContent = c.message;
        o.querySelector(".f").innerHTML = E(msgMeta(c)) + (msgAncien(c) ? "<br><b>Le carrier a bougé depuis : il est maintenant à " + E(c.systeme) + ".</b>" : "");
        const fermer = () => { o.remove(); document.removeEventListener("keydown", cl); };
        const cl = e => { if (e.key === "Escape") fermer(); };
        o.addEventListener("click", e => { if (e.target === o || e.target.tagName === "BUTTON") fermer(); });
        document.addEventListener("keydown", cl); document.body.appendChild(o); o.querySelector("button").focus();
    }
    function infobulleMessage(el, S) {
        const t = () => info();
        const pos = e => { const b = t(), w = b.offsetWidth, h = b.offsetHeight; let x = e.clientX + 14, y = e.clientY + 18; if (x + w > innerWidth - 8) x = innerWidth - w - 8; if (y + h > innerHeight - 8) y = e.clientY - h - 12; b.style.left = Math.max(8, x) + "px"; b.style.top = Math.max(8, y) + "px"; };
        el.addEventListener("mouseover", e => { const m = e.target.closest("[data-m]"); if (!m) return; const c = S.liste[+m.dataset.m]; if (!c || !c.message) return; const b = t(); b.textContent = c.message; const sm = document.createElement("small"); sm.textContent = msgMeta(c) + (msgAncien(c) ? " · le carrier a bougé depuis" : "") + " · cliquez pour ouvrir"; b.appendChild(sm); b.style.display = "block"; pos(e); });
        el.addEventListener("mousemove", e => { if (infoEl && infoEl.style.display === "block") pos(e); });
        el.addEventListener("mouseout", e => { if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest("[data-m]")) { if (infoEl) infoEl.style.display = "none"; } });
    }

    async function monterMien(el) {
        style(); if (!el) return;
        el.className = "fc ambre bloc or"; el.style.padding = "14px 18px";
        try {
            const c = await rpc("fc_mien", null, "mien");
            if (!c) {
                el.innerHTML = '<div class="fc-h"><h2>Mon Fleet Carrier</h2></div><div class="fc-vide">Aucun Fleet Carrier détecté. Si vous en possédez un, il apparaît tout seul avec le plugin <b>SYS.EDTEAM 2.52</b> : relancez EDMC une fois.</div>';
                return;
            }
            const s = saut(c);
            const srv = c.services && typeof c.services === "object" ? c.services : null;
            const nA = srv ? SERVICES.filter(x => srv[x[0]] === 1).length : 0, nP = srv ? SERVICES.filter(x => srv[x[0]] === 2).length : 0, nO = srv ? SERVICES.length - nA - nP : 0;
            el.innerHTML = '<div class="fc-h"><h2>Mon Fleet Carrier</h2><em>position lue dans votre journal de jeu</em></div>'
                + '<div class="fcm"><div class="fcm-holo"><div class="fcm-hg"><img src="' + imgCarrier(c) + '" alt="" decoding="async" onerror="this.remove()"><i></i><i></i><i></i><i></i><span>HOLOGRAMME · ' + E(c.indicatif) + "</span></div></div>"
                + '<div class="fcm-main"><div class="fc-corps"><div class="fc-id"><b>' + E(c.nom || c.indicatif) + "</b><small>" + E(c.indicatif) + "</small></div>"
                + '<div class="fc-info"><div><small>SYSTÈME</small><span class="fc-sys">' + (c.systeme ? lieu(c.systeme) : "position inconnue") + "</span></div>"
                + "<div><small>ACCÈS AUX DOCKS</small>" + badgeAcces(c.acces) + "</div>"
                + "<div><small>DERNIÈRE INFORMATION</small><span>" + ilYa(c.vu) + "</span></div></div></div>"
                + blocMessage(c)
                + (s ? '<div class="fc-saut">' + s + "</div>" : "")
                + '<div class="fcm-bas">' + (srv ? '<div class="fcm-bilan"><span class="a"><b>' + nA + "</b>ACTIFS</span>" + (nP ? '<span class="p"><b>' + nP + "</b>EN PAUSE</span>" : "") + "<span><b>" + nO + "</b>DÉSACTIVÉS</span></div>" : "")
                + '<label class="fc-part"><input type="checkbox" ' + (c.partage ? "checked" : "") + '> Montrer mon carrier aux pilotes de mon escadron</label></div>'
                + selecteurClasse(c) + "</div></div>"
                + (srv ? famillesServices(srv) : '<div class="fc-sv-mien"><small>SERVICES DU CARRIER</small>' + chipsServices(c.services) + "</div>")
                + '<div class="fc-note">Vos camarades voient l’indicatif, le nom, le système, l’accès aux docks, le saut annoncé et le message que vous écrivez ici. Jamais le solde, la cargaison ni le carburant. La position est celle de votre dernière session de jeu : un saut effectué quand vous n’étiez pas connecté n’apparaît qu’à votre prochaine connexion.</div>';
            brancherMessage(el);
            brancherClasse(el, c);
            const cb = el.querySelector(".fc-part input");
            cb.addEventListener("change", async () => {
                const voulu = cb.checked; cb.disabled = true;
                try { const ok = await window.supabaseApp.rpc("fc_partage", { p_actif: voulu }); if (ok.error || ok.data !== true) throw new Error("refus"); oublier(); }
                catch (e) { cb.checked = !voulu; console.error("Carrier : partage", e); }
                cb.disabled = false;
            });
        } catch (e) {
            console.error("Carrier :", e);
            el.innerHTML = '<div class="fc-h"><h2>Mon Fleet Carrier</h2></div><div class="fc-vide">' + (absente(e) ? "Les Fleet Carriers ne sont pas encore activés sur le serveur." : "Impossible de lire votre carrier pour le moment.") + "</div>";
        }
    }

    // ---- les carriers de l'escadron ----
    // ---- services du carrier (SQL 188, plugin 2.53) : 0 = desactive, 1 = actif, 2 = en pause ----
    const SERVICES = [
        ["Repair", "RÉPARATION", "Répare les vaisseaux"], ["Refuel", "RAVITAILLEMENT", "Carburant des vaisseaux"], ["Rearm", "RÉARMEMENT", "Munitions et armement"],
        ["Shipyard", "CHANTIER NAVAL", "Achat, stockage et transfert de vaisseaux"], ["Outfitting", "ÉQUIPEMENT", "Achat de modules"], ["CarrierFuel", "TRITIUM", "Dépôt de tritium (carburant des carriers)"],
        ["Commodities", "MARCHÉ", "Achat et vente de marchandises"], ["VoucherRedemption", "BONS", "Encaissement des bons"], ["Exploration", "CARTOGRAPHIE", "Universal Cartographics"],
        ["BlackMarket", "MARCHÉ NOIR", "Marché noir"], ["VistaGenomics", "VISTA GENOMICS", "Vista Genomics"], ["PioneerSupplies", "PIONEER", "Pioneer Supplies"], ["Bartender", "BAR", "Bar du carrier"]
    ];
    // CLASSE du carrier (SQL 192) : Drake = coque de base ; Victory, Fortune, Nautilus = habillages de la boutique. Le journal ne la donne pas (le code CarrierDockA/B/C ne la decrit pas) : le PROPRIETAIRE la choisit
    // dans Mon hangar ; sans choix, on montre la coque de base. Le carrier d'ESCADRON a sa propre image.
    const CLASSES = [["drake", "DRAKE"], ["victory", "VICTORY"], ["fortune", "FORTUNE"], ["nautilus", "NAUTILUS"]];
    const holoDe = c => (c && CLASSES.some(x => x[0] === c.holo)) ? c.holo : "drake";
    const imgCarrier = c => "images/carriers/carrier-" + (c && c.sc ? "escadron" : holoDe(c)) + ".webp";
    // familles de la carte du hangar : [titre, [cles]]
    const FAMILLES = [["Logistique", ["Repair", "Refuel", "Rearm", "CarrierFuel"]], ["Commerce et vaisseaux", ["Commodities", "BlackMarket", "VoucherRedemption", "Shipyard", "Outfitting"]], ["Exploration et vie à bord", ["Exploration", "VistaGenomics", "PioneerSupplies", "Bartender"]]];
    function famillesServices(srv) {
        const etat = k => srv[k] === 1 ? 1 : srv[k] === 2 ? 2 : 0, ordre = { 1: 0, 2: 1, 0: 2 }, mot = { 1: "ACTIF", 2: "EN PAUSE", 0: "DÉSACTIVÉ" }, cl = { 1: "", 2: " p", 0: " o" };
        return '<div class="fcm-fam">' + FAMILLES.map(f => {
            const l = f[1].map(k => SERVICES.find(x => x[0] === k)).filter(Boolean).sort((a, b) => ordre[etat(a[0])] - ordre[etat(b[0])]);
            const n = l.filter(x => etat(x[0]) === 1).length;
            return '<div class="fcm-f"><h4>' + f[0] + "<em>" + n + " / " + l.length + " actifs</em></h4>" + l.map(x => '<div class="fcm-t' + cl[etat(x[0])] + '"><u></u><div><b>' + x[1] + "</b><small>" + E(x[2]) + "</small></div><em>" + mot[etat(x[0])] + "</em></div>").join("") + "</div>";
        }).join("") + "</div>";
    }
    const FILTRES_SERVICES = ["Repair", "Refuel", "Rearm", "Shipyard", "Outfitting"];
    function chipsServices(srv) {
        if (!srv || typeof srv !== "object") return '<span class="inv" title="Les services sont transmis par le plugin SYS.EDTEAM 2.53">non transmis</span>';
        const l = SERVICES.filter(x => srv[x[0]] === 1 || srv[x[0]] === 2);
        if (!l.length) return '<span class="inv">aucun service actif</span>';
        return l.map(x => '<span class="fc-sv' + (srv[x[0]] === 2 ? " p" : "") + '" title="' + E(x[2]) + (srv[x[0]] === 2 ? " (en pause)" : "") + '">' + x[1] + "</span>").join("");
    }

    // ---- distances : calculees ICI, dans le navigateur (aucun appel par carrier) ----
    const CLE_COORDS = "edteam_coords_v1";
    const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    const fmtD = d => d < 10 ? d.toFixed(1) : String(Math.round(d)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    function lireCoords() { try { const v = JSON.parse(localStorage.getItem(CLE_COORDS) || "{}"); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; } }
    // positions que le serveur ne connait pas : EDSM, interroge directement par le navigateur (memoire locale partagee avec les autres cartes)
    async function coordonnees(noms) {
        const cache = lireCoords(), inconnus = new Set(), manque = () => noms.filter(n => !cache[n] && !inconnus.has(n));
        let tours = 0;
        while (manque().length && tours < 4) {
            tours++; const lot = manque().slice(0, 15);
            try {
                const r = await fetch("https://www.edsm.net/api-v1/systems?showCoordinates=1&" + lot.map(n => "systemName[]=" + encodeURIComponent(n)).join("&")), arr = await r.json();
                lot.forEach(n => { const f = (Array.isArray(arr) ? arr : []).find(x => x && String(x.name).toLowerCase() === n.toLowerCase()); if (f && f.coords) cache[n] = [Number(f.coords.x), Number(f.coords.y), Number(f.coords.z)]; else inconnus.add(n); });
                try { localStorage.setItem(CLE_COORDS, JSON.stringify(cache)); } catch (e) { /* tant pis */ }
            } catch (e) { break; }
        }
        return cache;
    }
    // ma position (SA ligne privee de session_live : ~80 octets, jamais celle d'un autre pilote) ; false si le jeu n'a jamais envoye de session
    async function lirePosition() {
        try {
            const uid = (window.profilCommandant || {}).user_id; if (!uid || !window.supabaseApp) return false;
            const r = await window.supabaseApp.from("session_live").select("pos:etat->pos,systeme:etat->>systeme,maj_le").eq("user_id", uid).maybeSingle();
            const d = r && r.data; if (!d || !Array.isArray(d.pos) || d.pos.length !== 3) return false;
            return { pos: d.pos.map(Number), nom: d.systeme || "", maj: d.maj_le || null };
        } catch (e) { return false; }
    }

    // ---- le tableau ----
    function dessinerListe(el, S) {
        const E_ = S.etat, liste = S.liste, dirs = S.dirs, moi = S.moi;
        // une ligne enrichie par carrier : distances et directive
        const lignes = liste.map(c => {
            const pc = S.posC(c), dm = moi && pc ? dist3(pc, moi.pos) : null;
            let dd = null, ddNom = "";
            if (pc) {
                const cand = E_.dir === "proche" ? dirs.map((r, i) => [r, S.posD(r)]) : [[dirs[+E_.dir], dirs[+E_.dir] ? S.posD(dirs[+E_.dir]) : null]];
                cand.forEach(([r, p]) => { if (!r || !p) return; const x = dist3(pc, p); if (dd == null || x < dd) { dd = x; ddNom = r[0]; } });
            }
            const dirT = c.dir || (c.systeme && dirs.find(r => String(r[0]).toLowerCase() === String(c.systeme).toLowerCase()) || [])[1] || null;
            return { c, dm, dd, ddNom, dirT };
        });
        let aff = lignes.filter(x => (E_.f !== "ouverts" || OUVERT.has(x.c.acces)) && Array.from(E_.sv).every(k => x.c.services && x.c.services[k] === 1) && (!E_.enDir || x.dirT) && (!E_.msg || x.c.message));
        if (E_.tri) {
            const val = x => E_.tri === "nom" ? String(x.c.nom || x.c.indicatif).toLowerCase() : E_.tri === "dm" ? x.dm : E_.tri === "dd" ? x.dd : x.c.vu;
            aff = aff.slice().sort((a, b) => { const p = val(a), q = val(b); if (p == null && q == null) return 0; if (p == null) return 1; if (q == null) return -1; return (typeof p === "number" ? p - q : String(p).localeCompare(String(q), "fr")) * E_.sens * (E_.tri === "vu" ? -1 : 1); });
        }
        const th = (t, lib) => '<th data-t="' + t + '" class="' + (E_.tri === t ? "tri" : "") + '">' + lib + (E_.tri === t ? ((E_.sens * (t === "vu" ? -1 : 1)) > 0 ? " ▲" : " ▼") : "") + "</th>";
        const avecDm = !!moi, avecDd = dirs.length > 0;
        const cellD = (d, nom) => d == null ? '<span class="inv">—</span>' : "<b>" + fmtD(d) + " al</b>" + (nom ? "<small>" + E(nom) + "</small>" : "");
        const rows = aff.map(({ c, dm, dd, ddNom, dirT }) => {
            const s = saut(c);
            return '<tr class="' + (c.moi ? "moi " : "") + (c.sc ? "sc " : "") + (dirT ? "dir" : "") + '"><td class="fc-holo"><div class="fc-hg" title="' + E(c.nom || c.indicatif) + '"><img class="' + (c.sc ? "sc" : "") + '" src="' + imgCarrier(c) + '" alt="" loading="lazy" decoding="async" onerror="this.remove()"></div></td><td><b>' + E(c.nom || c.indicatif) + "</b><small>" + E(c.indicatif) + "</small></td>"
                + "<td>" + (c.sc ? '<span class="fc-sctag" title="Le carrier commun de l’escadron, vu par n’importe lequel de ses membres">CARRIER D’ESCADRON</span><span class="fc-scesc">' + E(c.escadron || "") + "</span>" : pilote(c)) + (c.moi && !c.partage ? '<span class="fc-tag" title="Visible de vous seul : cochez la case dans Mon hangar pour le montrer à l’escadron">NON PARTAGÉ</span>' : "") + "</td>"
                + "<td>" + (c.systeme ? "<b>" + lieu(c.systeme) + "</b>" : '<span class="inv">position inconnue</span>')
                + (dirT ? '<div><span class="fc-dirtag" title="Une directive active vise ce système">◆ DIRECTIVE · ' + E(String(dirT).toUpperCase()) + "</span></div>" : "") + (c.message ? '<div><span class="fc-msgb' + (msgAncien(c) ? " old" : "") + '" data-m="' + S.liste.indexOf(c) + '">✉ MESSAGE DU PROPRIÉTAIRE</span></div>' : "") + (s ? '<div class="att">' + s + "</div>" : "") + "</td>"
                + '<td class="fc-svc">' + (c.sc ? (c.services ? chipsServices(c.services) + (c.services_vu ? '<small class="fc-srvvu" title="Les services actifs sont lus à l’appontage d’un membre au carrier. Un service absent est désactivé ou en pause : le jeu ne distingue pas les deux.">relevés ' + ilYa(c.services_vu) + " à l’appontage</small>" : "") : '<span class="inv" title="Les services du carrier d’escadron sont lus à l’appontage d’un membre au carrier (plugin 2.55) : personne n’a encore apponté depuis la mise en place.">non relevés</span>') : chipsServices(c.services)) + "</td>"
                + (avecDm ? '<td class="fc-dd">' + cellD(dm) + "</td>" : "") + (avecDd ? '<td class="fc-dd">' + cellD(dd, ddNom) + "</td>" : "")
                + "<td>" + ilYa(c.vu) + "</td></tr>";
        }).join("");
        const zone = el.querySelector(".fc-liste");
        zone.innerHTML = aff.length ? '<table class="fc-tab"><thead><tr><th></th>' + th("nom", "CARRIER") + "<th>PILOTE</th><th>SYSTÈME</th><th>SERVICES</th>" + (avecDm ? th("dm", "DIST. DEPUIS MOI") : "") + (avecDd ? th("dd", "DIST. DIRECTIVE") : "") + th("vu", "VU") + "</tr></thead><tbody>" + rows + "</tbody></table>"
            : '<div class="fc-vide">' + (liste.length ? "Aucun carrier ne correspond à ces filtres." : "Aucun carrier partagé pour l’instant. Les carriers des pilotes apparaissent tout seuls avec le plugin SYS.EDTEAM 2.53 (relancer EDMC une fois).") + "</div>";
        el.querySelector(".fc-n").textContent = aff.length + " carrier" + (aff.length > 1 ? "s" : "");
        el.querySelectorAll("[data-f]").forEach(b => b.classList.toggle("on", b.dataset.f === E_.f));
        el.querySelectorAll("[data-sv]").forEach(b => b.classList.toggle("on", E_.sv.has(b.dataset.sv)));
        const be = el.querySelector("[data-ed]"); if (be) be.classList.toggle("on", E_.enDir);
        const bm = el.querySelector("[data-msg]"); if (bm) bm.classList.toggle("on", !!E_.msg);
        const mo = el.querySelector(".fc-moi"); if (mo) mo.textContent = moi ? "DISTANCE DEPUIS MA POSITION · " + (moi.nom || "position de jeu") + (moi.maj ? " (relevée " + ilYa(new Date(moi.maj).getTime() / 1000) + ")" : "") : "distance depuis moi : position de jeu inconnue (plugin SYS.EDTEAM)";
        if (window.EdteamCopie) window.EdteamCopie.scanner(zone);
    }
    async function monterEscadron(el) {
        style(); if (!el) return;
        el.className = "fc ambre bloc or"; el.style.padding = "14px 18px";
        el.innerHTML = '<div class="fc-vide">Chargement des carriers…</div>';
        try {
            const [d, sc] = await Promise.all([rpc("fc_escadron", null, "esc"), rpc("fc_sc_lire", null, "sc").catch(() => null)]);   // le carrier d'escadron (SQL 189) : sans lui la liste marche comme avant
            if (window.EDTEAMPhotos) { try { await window.EDTEAMPhotos.charger(false); } catch (e) { /* initiales a la place */ } }
            if (!d) { el.style.display = "none"; return; }           // pas d'escadron : rien a montrer
            const liste = Array.isArray(d.liste) ? d.liste.slice() : [], dirs = Array.isArray(d.directives) ? d.directives : [];    // directives : [systeme, type, x, y, z]
            if (sc && sc.systeme) liste.unshift(Object.assign({}, sc, { sc: true, nom: sc.nom || "Carrier d’escadron", indicatif: sc.indicatif || "", services: sc.services && typeof sc.services === "object" ? sc.services : null }));   // le carrier COMMUN de l'escadron, en tete
            // coordonnees inconnues du serveur : EDSM direct (rare : un systeme absent des tables du serveur)
            const manque = []; liste.forEach(c => { if (c.systeme && c.x == null) manque.push(c.systeme); }); dirs.forEach(r => { if (r[2] == null) manque.push(r[0]); });
            const cache = manque.length ? await coordonnees(Array.from(new Set(manque))) : lireCoords();
            const S = { liste, dirs, moi: false, etat: { f: "tous", sv: new Set(), enDir: false, dir: "proche", tri: null, sens: 1 },
                posC: c => c.x != null ? [c.x, c.y, c.z] : (c.systeme && cache[c.systeme]) || null, posD: r => r[2] != null ? [r[2], r[3], r[4]] : cache[r[0]] || null };
            el.innerHTML = '<div class="fc-h"><h2>Fleet Carriers de l’escadron</h2><em>où se poser, chez qui, avec quoi</em><span class="fc-n"></span></div>'
                + '<div class="fc-fil">'
                + FILTRES_SERVICES.map(k => '<button type="button" data-sv="' + k + '">' + SERVICES.find(x => x[0] === k)[1] + "</button>").join("") + (dirs.length ? '<span class="fcm-sep"></span><button type="button" data-ed="1">DANS UN SYSTÈME EN DIRECTIVE</button>' : "") + (liste.some(c => c.message) ? '<button type="button" data-msg="1">AVEC UN MESSAGE</button>' : "") + "</div>"
                + '<div class="fc-dirsel"><span class="fc-moi"></span>' + (dirs.length ? '<span>DIRECTIVE : <select class="fc-dirchoix"><option value="proche">LA PLUS PROCHE DE CHAQUE CARRIER</option>' + dirs.map((r, i) => '<option value="' + i + '">' + E(r[0]) + " · " + E(String(r[1] || "").toLowerCase()) + "</option>").join("") + "</select></span>" : "") + "</div>"
                + '<div class="fc-liste"></div>'
                + '<div class="fc-note">Position et services lus dans le journal de jeu de chaque propriétaire : ils datent de sa dernière session. Les distances sont en années-lumière, calculées sur votre appareil. Chaque pilote peut cacher son carrier depuis la page Mon hangar. Le carrier d’escadron est montré à tous les membres : sa position vient du journal de jeu du dernier membre qui l’a vu, ses services de l’appontage du dernier membre qui s’y est posé.</div>';
            el.addEventListener("click", e => {
                const f = e.target.closest("[data-f]"), sv = e.target.closest("[data-sv]"), ed = e.target.closest("[data-ed]"), t = e.target.closest("th[data-t]"), mg = e.target.closest("[data-m]"), fm = e.target.closest("[data-msg]");
                if (mg) { modaleMessage(S.liste[+mg.dataset.m]); return; }
                if (fm) S.etat.msg = !S.etat.msg;
                else if (f) S.etat.f = f.dataset.f;
                else if (sv) { const k = sv.dataset.sv; if (S.etat.sv.has(k)) S.etat.sv.delete(k); else S.etat.sv.add(k); }
                else if (ed) S.etat.enDir = !S.etat.enDir;
                else if (t) { const c = t.dataset.t; S.etat.sens = S.etat.tri === c ? -S.etat.sens : 1; S.etat.tri = c; }
                else return;
                dessinerListe(el, S);
            });
            infobulleMessage(el, S);
            const sel = el.querySelector(".fc-dirchoix"); if (sel) sel.addEventListener("change", () => { S.etat.dir = sel.value; dessinerListe(el, S); });
            dessinerListe(el, S);
            lirePosition().then(p => { S.moi = p; dessinerListe(el, S); });          // une petite lecture (~80 octets) : la liste s'affiche sans l'attendre
        } catch (e) {
            console.error("Carriers :", e);
            el.innerHTML = '<div class="fc-h"><h2>Fleet Carriers de l’escadron</h2></div><div class="fc-vide">' + (absente(e) ? "Les Fleet Carriers ne sont pas encore activés sur le serveur." : "Impossible de lire les carriers pour le moment.") + "</div>";
        }
    }

    window.EdteamCarriers = { monterMien, monterEscadron, mien: () => rpc("fc_mien", null, "mien") };
})();
