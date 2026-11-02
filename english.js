// CARTE « READING SYS.EDTEAM IN ENGLISH » : aide en anglais pour les pilotes anglophones (le site est ecrit en francais ; la traduction se fait avec le navigateur).
// Ouverte par le bouton ENGLISH du pied de page (PC) et par la feuille des reglages (mobile) : window.edteamEnglishOuvrir().
// Fenetre autonome (styles en ligne), marquee translate="no" : le navigateur ne la retraduit pas.
(function () {
    "use strict";
    if (window.edteamEnglishOuvrir) return;
    function fermer() { var o = document.getElementById("en-overlay"); if (o) o.remove(); document.removeEventListener("keydown", touche, true); }
    function touche(e) { if (e.key === "Escape") { e.stopPropagation(); fermer(); } }
    var GLOSS = [
        ["HAUSSE", "raise influence (Increase)"], ["BAISSE", "lower influence (Decrease / undermine a rival faction)"], ["GUERRE", "War"], ["ÉLECTION", "Election"],
        ["RENFORCEMENT", "Powerplay Reinforcement"], ["SAPE", "Powerplay Undermining"], ["ACQUISITION", "Powerplay Acquisition (conquest)"],
        ["Inoccupé / Disputé", "Unoccupied / Contested"], ["Exploité", "Exploited"], ["Consolidé", "Fortified"], ["Défendu", "Stronghold"],
        ["Amiral / Officier", "Admiral / Officer (squadron leadership)"], ["Escadron", "Squadron"], ["Mérites", "Merits"]
    ];
    function ouvrir() {
        fermer();
        var o = document.createElement("div"); o.id = "en-overlay"; o.setAttribute("translate", "no"); o.setAttribute("lang", "en"); o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true");
        o.style.cssText = "position:fixed;inset:0;z-index:100000;background:rgba(2,3,5,.88);display:flex;align-items:center;justify-content:center;padding:14px;font-family:'Share Tech Mono',monospace;";
        var li = function (t) { return '<li style="margin:0 0 9px;line-height:1.55;">' + t + "</li>"; };
        o.innerHTML = '<div style="position:relative;width:min(600px,100%);max-height:88vh;overflow-y:auto;box-sizing:border-box;padding:22px 24px;background:#080b0f;border:1px solid #00F0FF;box-shadow:0 0 28px rgba(0,240,255,.25);color:#cfd8dc;font-size:.9rem;">'
            + '<span data-en-x style="position:absolute;top:8px;right:14px;cursor:pointer;color:#00F0FF;font-weight:bold;padding:6px 8px;">X</span>'
            + '<h3 style="margin:0 0 10px;color:#00F0FF;letter-spacing:2px;font-size:1.05rem;">🌐 READING SYS.EDTEAM IN ENGLISH</h3>'
            + '<p style="margin:0 0 12px;line-height:1.55;">The site is written in French. Your browser can translate it for you, and keeps translating what appears later:</p>'
            + '<ul style="margin:0 0 14px;padding-left:20px;">'
            + li("<b style=\"color:#fff;\">PC (Chrome, Edge):</b> right-click anywhere on the page, then <b>“Translate to English”</b> (or click the translate icon at the right of the address bar).")
            + li("<b style=\"color:#fff;\">Android (Chrome):</b> menu ⋮ → <b>“Translate…”</b>. The installed app may not offer it: open the site in Chrome instead.")
            + li("<b style=\"color:#fff;\">iPhone / iPad (Safari):</b> tap the <b>aA</b> icon in the address bar → <b>“Translate to English”</b>. Same limit for the home-screen app.")
            + "</ul>"
            + '<div style="color:#FFB000;letter-spacing:1px;font-size:.8rem;margin:0 0 6px;">GOOD TO KNOW</div>'
            + '<ul style="margin:0 0 14px;padding-left:20px;color:#b7c2c8;">'
            + li("Automatic translation is approximate. Some Elite terms may look odd: see the short list below.")
            + li("System and station names stay as they are, and clicking a system name copies it exactly as the game expects.")
            + li("The Gazette and the squadron anecdotes are written in French: use the browser translation for them too.")
            + "</ul>"
            + '<div style="color:#FFB000;letter-spacing:1px;font-size:.8rem;margin:0 0 6px;">WORDS YOU MAY SEE</div>'
            + '<div style="display:grid;grid-template-columns:auto 1fr;gap:4px 14px;font-size:.82rem;margin:0 0 14px;">' + GLOSS.map(function (g) { return '<b style="color:#fff;">' + g[0] + '</b><span>' + g[1] + "</span>"; }).join("") + "</div>"
            + '<p style="margin:0;color:#8b97a0;font-size:.8rem;line-height:1.5;">Questions? Ask on the squadron Discord (link at the bottom of the page).</p>'
            + "</div>";
        o.addEventListener("click", function (e) { if (e.target === o || e.target.closest("[data-en-x]")) fermer(); });
        document.body.appendChild(o);
        document.addEventListener("keydown", touche, true);
    }
    window.edteamEnglishOuvrir = ouvrir;
})();
