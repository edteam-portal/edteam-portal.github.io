// FENETRE D'EXPLICATION « TRAFIC MINIMUM » (PC : bgs.html ; mobile : mobile.html) : pourquoi le trafic affiche n'est pas le trafic reel du jeu.
// Le trafic vient d'EDSM (commandants dont l'outil envoie le journal de vol) ; la ligne « pilotes de l'escadron » vient de nos propres relevés (SQL 135). Texte sans chiffre propre a un systeme.
(function () {
    "use strict";
    if (window.edteamTraficInfo) return;
    const CSS = `
    #ti-overlay{position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.82);display:none;align-items:flex-start;justify-content:center;padding:18px;overflow-y:auto;font-family:inherit}
    #ti-overlay *{box-sizing:border-box}
    .ti-m{width:100%;max-width:640px;margin:auto 0;border:1px solid #00F0FF;background:linear-gradient(180deg,rgba(0,240,255,.07),rgba(5,8,12,.98) 120px);box-shadow:0 0 30px rgba(0,240,255,.16);color:#c7d3da;line-height:1.6}
    .ti-t{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:16px 20px 12px;border-bottom:1px solid rgba(0,240,255,.3)}
    .ti-t small{color:#778;letter-spacing:3px;font-size:.7em}.ti-t h2{margin:3px 0 0;font-weight:normal;color:#00F0FF;letter-spacing:3px;font-size:1.25em;text-shadow:0 0 12px rgba(0,240,255,.35)}
    .ti-x{color:#00F0FF;font-weight:bold;cursor:pointer;font-size:1.3em;padding:2px 6px}
    .ti-c{padding:14px 20px 8px;font-size:.88em}
    .ti-c h3{margin:14px 0 4px;color:#fff;font-weight:normal;letter-spacing:2px;font-size:.82em}.ti-c h3:first-child{margin-top:0}
    .ti-c p{margin:0 0 6px}.ti-c ul{margin:4px 0 6px;padding-left:18px}.ti-c li{margin-bottom:4px}.ti-c b{color:#fff;font-weight:normal}
    .ti-p{padding:10px 20px 16px;color:#778;font-size:.74em}
    .ti-q{display:inline-grid;place-items:center;width:17px;height:17px;margin-left:6px;border:1px solid currentColor;border-radius:50%;background:rgba(0,0,0,.35);color:inherit;font:inherit;font-size:.82em;line-height:1;letter-spacing:0;cursor:pointer;vertical-align:1px;padding:0}
    .ti-q:hover{background:rgba(0,240,255,.25);color:#fff}
    @media (max-width:760px){#ti-overlay{padding:8px}.ti-t,.ti-c,.ti-p{padding-left:14px;padding-right:14px}}`;
    const TEXTE = `
        <h3>CE QUE VOUS VOYEZ</h3>
        <p>Le nombre de vaisseaux passés dans le système ces 24 dernières heures, <b>tel que le publie EDSM</b>. Le jeu affiche un autre chiffre dans les stations (« rapport détaillé du trafic spatial ») : il est souvent <b>bien plus grand</b>.</p>
        <h3>POURQUOI L'ÉCART</h3>
        <ul>
            <li>EDSM ne compte que les commandants qui lui envoient leur <b>journal de vol</b> : un compte EDSM et un outil allumé (EDMC par exemple).</li>
            <li>Un joueur <b>sans outil</b>, ou dont l'outil est éteint, n'existe pour aucun site (EDSM, Inara…) : le jeu le compte, pas eux.</li>
            <li>Chaque site compte <b>à sa façon et avec ses propres joueurs</b> : leurs chiffres diffèrent entre eux et du jeu.</li>
            <li>EDDN, le flux partagé des outils, transporte bien les arrivées dans les systèmes, mais chaque site décide de ce qu'il en fait : nous ne savons pas lesquels s'en servent pour leur trafic.</li>
        </ul>
        <h3>LA LIGNE « PILOTES DE L'ESCADRON »</h3>
        <p>Elle compte les pilotes de <b>votre escadron</b> arrivés dans le système avec EDMC et le plugin allumés. Aucun nom n'est affiché, seuls les pilotes de votre escadron sont comptés, et le comptage est incomplet pendant ses 24 premières heures.</p>
        <h3>COMMENT LIRE LE CHIFFRE</h3>
        <p>Le repère blanc et le mot « calme », « habituel » ou « animé » comparent ce système <b>à lui-même</b> (médiane des 14 derniers jours, même source). C'est utile pour voir une hausse ou une baisse, pas pour connaître le trafic réel.</p>
        <p>Plus de pilotes envoient leurs données à EDSM et à EDDN, plus les chiffres se rapprochent de la réalité.</p>`;

    function assurerDom() {
        if (!document.getElementById("ti-style")) { const s = document.createElement("style"); s.id = "ti-style"; s.textContent = CSS; document.head.appendChild(s); }
        let o = document.getElementById("ti-overlay");
        if (!o) {
            o = document.createElement("div"); o.id = "ti-overlay";
            o.addEventListener("click", ev => { if (ev.target === o) fermer(); });
            document.body.appendChild(o);
            document.addEventListener("keydown", ev => { if (ev.key === "Escape") fermer(); });
        }
        return o;
    }
    function ouvrir() {
        if (typeof sonClic === "function") { try { sonClic(); } catch (e) { /* sans son */ } }
        const o = assurerDom();
        o.innerHTML = '<div class="ti-m"><div class="ti-t"><div><small>ACTIVITÉ DU SYSTÈME</small><h2>TRAFIC MINIMUM</h2></div><span class="ti-x" onclick="edteamTraficInfo.fermer()">✕</span></div>'
            + '<div class="ti-c">' + TEXTE + '</div><div class="ti-p">Source du chiffre : EDSM, relevé deux fois par jour. La ligne de l\'escadron vient des relevés de vos pilotes.</div></div>';
        o.style.display = "flex";
    }
    function fermer() { const o = document.getElementById("ti-overlay"); if (o) { o.style.display = "none"; o.innerHTML = ""; } }
    // petit bouton « ? » a mettre a cote du titre de la carte (charge le style avant l'affichage)
    function bouton() {
        if (!document.getElementById("ti-style")) { const s = document.createElement("style"); s.id = "ti-style"; s.textContent = CSS; document.head.appendChild(s); }
        return '<button type="button" class="ti-q" title="Pourquoi « minimum » ?" onclick="event.stopPropagation(); edteamTraficInfo.ouvrir()">?</button>';
    }
    window.edteamTraficInfo = { ouvrir, fermer, bouton };
})();
