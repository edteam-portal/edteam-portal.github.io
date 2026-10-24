// ONGLET COMBAT du tableau de bord (tableau-de-bord.html) : fiche de la cible verrouillee (hologramme rouge), son vaisseau (hologramme cyan, armes), tableau de chasse, session de combat.
//   Quatre contextes (determines par le plugin 2.38) : SECURITE (primes), GUERRE (bons de guerre, directive BGS), PVP (joueurs), plus les MISSIONS de massacre / d'assassinat ;
//   chacun en VOL ou A PIED (a pied : un personnage barre d'une croix par ennemi elimine, qui retrecit pour tenir dans la fenetre).
// Donnees : etat du combat envoye par le plugin dans sa propre ligne (table combat_live, script SQL 103, lecture combat_lire + temps reel), vaisseau / modules / combinaison : S (session en direct).
// Le jeu NE donne PAS : les modules des vaisseaux ennemis, l'avancement d'une mission (estime ici), le pourcentage de bouclier du pilote (seulement actif / tombe), la sante de la combinaison
//   hors Status.json. Les positions des armes sur l'hologramme sont stylisees (comme l'onglet Missions).
// Mise a jour par morceaux (pas de page recreee a chaque envoi : les hologrammes ne repartent pas de zero). Bascule automatique sur l'onglet au DEBUT d'un combat.
// Noms de la page utilises : S, MODE, esc, fmtN, fmtM, duree, heure, lire, ecrire, rendre, supabaseApp, uid, nomVaisseau, SILHOUETTES, SOL_SUITS, tbmNomModule (modules-vaisseau.js).
(function () {
    "use strict";
    const CB = window.__CB = { mem: {}, dirs: { t: 0, l: [] }, etat: null, maj: null, canal: null, rtOk: false, timer: null, cacheVict: "", cacheEchelle: "" };
    const RANGS_COMBAT = ["HARMLESS", "MOSTLY HARMLESS", "NOVICE", "COMPETENT", "EXPERT", "MASTER", "DANGEROUS", "DEADLY", "ELITE", "ELITE I", "ELITE II", "ELITE III", "ELITE IV", "ELITE V"];
    const COMBI_TYPES = { assaultsuitai: "Assaut", lightassaultsuitai: "Assaut léger", closesuitai: "Rapproché", ranged: "À distance" };
    const son = (t, o) => { try { if (typeof window.tbmSonCombat === "function") window.tbmSonCombat(t, o); } catch (e) { /* son indisponible */ } };
    const E = s => (typeof esc === "function" ? esc(s) : String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])));
    const N = n => (typeof fmtN === "function" ? fmtN(n) : String(Math.round(Number(n) || 0)));
    const FR = n => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    const hh = t0 => { const d = new Date(t0 * 1000); return isNaN(d) ? "" : ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); };

    // ---------------------------------------------------------------- hologrammes (memes couches que l'onglet Missions : image teintee, lignes, contour lumineux, balai)
    const T_CYAN = "0 0 0 0 0   0.28 0.55 0.1 0 0   0.36 0.72 0.14 0 0   0 0 0 1 0", T_ROUGE = "0.36 0.72 0.14 0 0   0.09 0.18 0.035 0 0   0.05 0.1 0.02 0 0   0 0 0 1 0", T_VERT = "0.05 0.1 0.02 0 0   0.36 0.72 0.14 0 0   0.05 0.1 0.02 0 0   0 0 0 1 0", T_BLEU = "0.04 0.08 0.015 0 0   0.12 0.25 0.05 0 0   0.36 0.72 0.14 0 0   0 0 0 1 0";
    const TONS = { r: "#FF3B30", c: "#00F0FF", v: "#00FF66", b: "#3D8BFF" };      // r hostile, v allie, b neutre, c cyan (le pilote)
    function silDe(cle) { try { return SILHOUETTES[String(cle || "").toLowerCase()] || null; } catch (e) { return null; } }
    function holoVaisseau(sil, id, extra, rouge) {
        const W = sil.W, H = sil.H, ton = rouge === true ? "r" : rouge || "c", col = TONS[ton], mat = { r: T_ROUGE, c: T_CYAN, v: T_VERT, b: T_BLEU }[ton], f1 = { r: "feFuncR", c: "feFuncG", v: "feFuncG", b: "feFuncB" }[ton], f2 = { r: "feFuncG", c: "feFuncB", v: "feFuncR", b: "feFuncG" }[ton];
        return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet"><defs>
<filter id="h${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${mat}"/><feComponentTransfer><${f1} type="gamma" amplitude="1.35" exponent="1.3" offset="0"/><${f2} type="gamma" amplitude="1.35" exponent="1.45" offset="0"/></feComponentTransfer></filter>
<filter id="l${id}"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<pattern id="g${id}" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1.4" fill="#000" opacity=".28"/></pattern>
<linearGradient id="b${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity="0"/><stop offset="1" stop-color="${col}" stop-opacity=".34"/></linearGradient>
<clipPath id="q${id}"><path transform="rotate(180 ${W / 2} ${H / 2})" d="${sil.formes[0]}"/></clipPath></defs>
<g transform="rotate(180 ${W / 2} ${H / 2})"><image href="${sil.img}" width="${W}" height="${H}" filter="url(#h${id})" opacity=".5"/><rect width="${W}" height="${H}" fill="url(#g${id})"/>
<g filter="url(#l${id})" stroke="${col}" stroke-width="1.6" fill="none" stroke-linejoin="round">${sil.formes.map(d => `<path d="${d}"/>`).join("")}</g></g>
<g clip-path="url(#q${id})"><g class="tbs-balai" style="--h:${H}px"><rect x="0" y="-24" width="${W}" height="24" fill="url(#b${id})"/><rect x="0" y="0" width="${W}" height="1.4" fill="${col}" opacity=".85"/></g></g>${extra || ""}</svg>`;
    }
    // silhouette generique (vaisseau sans hologramme dedie) : meme rendu, forme dessinee
    function holoGenerique(id, rouge) {
        const ton = rouge === true ? "r" : rouge || "c", col = TONS[ton], fill = { r: "rgba(255,59,48,.18)", c: "rgba(0,240,255,.16)", v: "rgba(0,255,102,.16)", b: "rgba(61,139,255,.18)" }[ton];
        const demi = `<path d="M200 6 L208 46 L218 76 L246 100 L330 160 L352 204 L338 216 L296 206 L272 222 L252 246 L228 258 L212 252 L200 256" fill="${fill}" stroke="${col}" stroke-width="1.8"/>
<path d="M200 38 L212 80 L244 118 L296 166 M218 76 L236 150 L262 214 M244 118 L236 150 M296 206 L270 168 M236 150 L214 212 L206 250" fill="none" stroke="${col}" stroke-opacity=".55" stroke-width="1"/>
<path d="M338 216 L346 252 L324 246 L306 226" fill="${fill}" stroke="${col}" stroke-width="1.2"/>`;
        return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet"><defs><filter id="l${id}"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<pattern id="g${id}" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1.4" fill="#000" opacity=".28"/></pattern></defs>
<g filter="url(#l${id})">${demi}<g transform="translate(400 0) scale(-1 1)">${demi}</g></g><rect width="400" height="300" fill="url(#g${id})"/>
<g class="tbs-balai" style="--h:300px"><rect x="0" y="0" width="400" height="1.4" fill="${col}" opacity=".85"/></g></svg>`;
    }
    const TS = "0.25 0.38 0.52 0.66 0.78 0.35 0.08 0.05 0.05 0.05 0.06 0.1 0.2 0.35 0.5 0.65 0.78 0.88 0.95 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1";
    // contours des combinaisons (silhouette detouree sur les images ; coordonnees de SOL_SUITS) : le bouclier neon epouse la silhouette
    const CONTOURS_SOL = {"utilitysuit":{"d":"M439.9 49.7 L443.5 49.7 L450.5 56.8 L450.5 60.3 L423.9 101.1 L422.2 138.4 L431.0 147.3 L447.0 143.7 L454.1 150.8 L448.8 159.7 L450.5 220.0 L447.0 260.8 L455.9 269.7 L468.3 273.2 L498.4 303.4 L505.5 317.6 L514.4 390.3 L530.4 420.5 L542.8 471.9 L557.0 491.4 L565.8 511.0 L585.4 652.9 L594.2 670.6 L594.2 688.4 L606.6 722.1 L606.6 732.7 L597.8 755.8 L590.7 762.9 L558.8 778.9 L555.2 778.9 L544.6 768.2 L567.6 750.5 L567.6 745.1 L560.5 738.0 L557.0 738.0 L546.3 748.7 L532.1 746.9 L525.0 754.0 L525.0 770.0 L528.6 773.5 L528.6 826.8 L521.5 833.9 L491.3 833.9 L482.5 842.7 L480.7 853.4 L477.2 880.0 L477.2 945.6 L473.6 958.0 L473.6 1075.1 L464.7 1121.3 L461.2 1176.3 L464.7 1188.7 L477.2 1201.1 L498.4 1202.9 L512.6 1210.0 L519.7 1217.1 L526.8 1234.8 L528.6 1259.6 L512.6 1273.8 L487.8 1279.2 L475.4 1277.4 L459.4 1293.4 L448.8 1298.7 L418.6 1296.9 L406.2 1289.8 L400.9 1289.8 L390.2 1277.4 L397.3 1178.0 L390.2 1137.2 L383.1 1117.7 L384.9 1108.8 L381.4 1105.3 L372.5 1048.5 L376.0 1014.8 L386.7 984.7 L388.5 954.5 L376.0 922.6 L369.0 848.0 L354.8 807.2 L344.1 745.1 L337.0 738.0 L333.5 738.0 L326.4 745.1 L310.4 794.8 L287.4 842.7 L280.3 865.8 L280.3 887.1 L274.9 906.6 L246.6 966.9 L244.8 1032.6 L232.4 1069.8 L232.4 1080.5 L212.9 1147.9 L212.9 1245.5 L205.8 1252.6 L196.9 1256.1 L170.3 1252.6 L163.2 1249.0 L152.5 1236.6 L152.5 1213.5 L145.5 1202.9 L145.5 1190.5 L152.5 1176.3 L152.5 1167.4 L165.0 1147.9 L165.0 1107.1 L159.6 1062.7 L163.2 1013.0 L161.4 1005.9 L168.5 965.1 L180.9 938.5 L186.3 933.2 L186.3 926.1 L191.6 917.2 L195.1 887.1 L195.1 826.8 L157.9 798.4 L156.1 784.2 L163.2 745.1 L154.3 736.3 L134.8 731.0 L118.8 715.0 L115.3 693.7 L122.4 672.4 L122.4 649.3 L125.9 638.7 L125.9 548.2 L129.5 530.5 L127.7 502.1 L138.4 482.6 L156.1 459.5 L154.3 450.6 L161.4 443.5 L159.6 434.7 L179.2 392.1 L179.2 388.5 L163.2 374.3 L163.2 303.4 L168.5 298.1 L166.7 287.4 L170.3 278.5 L170.3 262.6 L179.2 253.7 L191.6 251.9 L204.0 239.5 L204.0 223.5 L198.7 218.2 L198.7 211.1 L189.8 198.7 L189.8 193.4 L214.6 168.5 L223.5 173.9 L232.4 173.9 L246.6 189.8 L244.8 196.9 L253.7 205.8 L257.2 205.8 L266.1 196.9 L266.1 159.7 L273.2 136.6 L285.6 122.4 L296.2 120.6 L306.9 110.0 L326.4 101.1 L358.3 97.6 L372.5 104.7 L381.4 102.9 L388.5 95.8 L390.2 83.4 L400.9 72.7 L413.3 72.7 L438.1 51.5 Z"},"explorationsuit":{"d":"M497.0 34.4 L500.6 34.4 L507.8 41.6 L480.7 86.8 L477.1 112.1 L477.1 126.6 L482.5 132.0 L498.8 130.2 L506.0 137.4 L506.0 148.3 L502.4 151.9 L500.6 164.5 L502.4 193.5 L495.2 249.5 L504.2 258.6 L524.1 264.0 L534.9 274.8 L547.6 294.7 L556.6 325.5 L558.4 359.8 L565.6 370.7 L567.4 383.3 L583.7 415.9 L589.1 453.9 L603.6 470.1 L614.4 491.8 L618.0 511.7 L628.9 537.0 L645.1 627.4 L659.6 645.5 L666.8 647.3 L674.1 654.6 L665.0 665.4 L665.0 670.8 L672.3 681.7 L670.5 692.5 L677.7 707.0 L677.7 732.3 L674.1 741.4 L661.4 754.0 L654.2 754.0 L641.5 766.7 L636.1 766.7 L627.1 757.6 L641.5 741.4 L639.7 730.5 L630.7 721.5 L627.1 721.5 L612.6 739.5 L605.4 732.3 L600.0 698.0 L594.5 692.5 L592.7 645.5 L589.1 634.7 L542.1 553.3 L529.5 506.3 L520.5 493.6 L520.5 482.8 L507.8 461.1 L500.6 453.9 L497.0 453.9 L489.7 461.1 L487.9 468.3 L484.3 504.5 L493.4 513.5 L500.6 511.7 L507.8 518.9 L516.8 571.4 L515.0 593.1 L520.5 616.6 L506.0 636.5 L513.2 643.7 L515.0 656.4 L524.1 665.4 L534.9 660.0 L547.6 660.0 L554.8 667.2 L563.8 701.6 L560.2 716.0 L563.8 723.3 L560.2 730.5 L563.8 737.7 L563.8 813.7 L556.6 820.9 L527.7 819.1 L516.8 831.8 L515.0 858.9 L511.4 867.9 L511.4 931.2 L507.8 945.7 L509.6 1056.0 L500.6 1103.0 L495.2 1155.4 L498.8 1173.5 L513.2 1188.0 L529.5 1188.0 L545.8 1195.2 L553.0 1202.4 L558.4 1211.5 L562.0 1231.4 L560.2 1249.5 L545.8 1260.3 L533.1 1263.9 L509.6 1263.9 L502.4 1271.2 L495.2 1271.2 L493.4 1273.0 L498.8 1278.4 L493.4 1280.2 L448.2 1280.2 L442.8 1278.4 L448.2 1273.0 L446.4 1271.2 L431.9 1271.2 L424.7 1263.9 L431.9 1164.5 L424.7 1121.1 L415.6 1090.3 L415.6 1072.3 L412.0 1066.8 L408.4 1039.7 L410.2 1009.0 L422.9 967.4 L422.9 936.6 L412.0 909.5 L404.8 835.4 L386.7 777.5 L381.3 734.1 L372.3 723.3 L368.7 723.3 L357.8 737.7 L337.9 801.0 L316.3 846.2 L314.4 877.0 L305.4 907.7 L290.9 931.2 L280.1 958.3 L280.1 1018.0 L276.5 1036.1 L267.5 1054.2 L267.5 1065.0 L247.6 1135.5 L247.6 1231.4 L236.7 1240.4 L206.0 1238.6 L187.9 1224.1 L187.9 1200.6 L180.7 1189.8 L180.7 1184.4 L186.1 1164.5 L184.3 1159.0 L198.8 1141.0 L198.8 1093.9 L195.2 1065.0 L195.2 1032.5 L198.8 1028.9 L195.2 1007.2 L197.0 983.7 L200.6 980.0 L200.6 963.8 L204.2 952.9 L218.7 927.6 L218.7 918.6 L227.7 902.3 L231.3 873.4 L231.3 815.5 L195.2 786.6 L189.8 773.9 L193.4 768.5 L191.6 763.1 L195.2 741.4 L198.8 735.9 L198.8 725.1 L189.8 716.0 L173.5 716.0 L153.6 698.0 L148.2 667.2 L150.0 645.5 L142.8 638.3 L142.8 632.9 L157.2 616.6 L159.0 566.0 L155.4 556.9 L155.4 533.4 L159.0 479.2 L178.9 450.2 L191.6 412.3 L202.4 394.2 L211.4 368.9 L216.9 363.4 L218.7 347.2 L225.9 332.7 L224.1 325.5 L233.1 305.6 L249.4 289.3 L269.3 262.2 L269.3 255.0 L276.5 247.7 L281.9 249.5 L289.1 242.3 L289.1 233.3 L280.1 224.2 L265.6 224.2 L258.4 229.6 L251.2 222.4 L249.4 207.9 L244.0 202.5 L244.0 195.3 L240.3 191.7 L240.3 184.4 L234.9 179.0 L234.9 173.6 L253.0 157.3 L278.3 155.5 L294.6 173.6 L292.8 182.6 L301.8 191.7 L314.4 191.7 L319.9 195.3 L330.7 180.8 L327.1 164.5 L336.1 137.4 L350.6 126.6 L372.3 103.1 L381.3 97.6 L390.3 97.6 L397.6 92.2 L431.9 94.0 L444.6 81.4 L442.8 74.1 L457.2 56.1 L469.9 54.2 L489.7 36.2 L495.2 36.2 Z"},"flightsuit":{"d":"M391.1 86.5 L423.6 88.3 L436.2 93.7 L448.8 104.5 L456.0 129.8 L477.6 147.8 L477.6 155.0 L474.0 158.6 L475.8 165.8 L470.4 171.2 L470.4 185.7 L459.6 198.3 L459.6 201.9 L510.1 250.6 L493.9 266.8 L492.1 275.8 L499.3 283.0 L502.9 283.0 L517.3 268.6 L522.7 270.4 L526.3 266.8 L535.3 277.6 L538.9 292.0 L538.9 322.7 L531.7 335.3 L528.1 349.7 L540.7 369.5 L547.9 409.2 L553.3 423.6 L553.3 434.4 L576.8 475.9 L582.2 497.5 L589.4 510.1 L596.6 549.8 L596.6 584.0 L598.4 598.4 L602.0 602.0 L602.0 612.9 L623.6 645.3 L623.6 648.9 L616.4 656.1 L616.4 663.3 L630.8 706.6 L623.6 715.6 L621.8 730.0 L602.0 746.3 L593.0 749.9 L587.6 749.9 L576.8 740.8 L565.9 751.7 L565.9 798.5 L556.9 809.3 L526.3 807.5 L519.1 803.9 L506.5 814.7 L504.7 858.0 L499.3 881.4 L501.1 892.3 L493.9 915.7 L493.9 1002.2 L490.2 1040.1 L502.9 1052.7 L502.9 1067.1 L497.5 1081.5 L497.5 1094.1 L502.9 1103.2 L501.1 1124.8 L495.7 1132.0 L497.5 1169.8 L501.1 1178.9 L513.7 1191.5 L555.1 1202.3 L575.0 1220.3 L575.0 1251.0 L567.8 1258.2 L555.1 1261.8 L497.5 1261.8 L492.1 1267.2 L416.4 1267.2 L407.3 1256.4 L405.5 1223.9 L414.5 1173.5 L414.5 1151.8 L405.5 1130.2 L401.9 1083.3 L387.5 1036.5 L387.5 1032.9 L400.1 1020.2 L407.3 935.5 L403.7 917.5 L403.7 883.2 L407.3 876.0 L407.3 859.8 L401.9 805.7 L389.3 740.8 L380.3 730.0 L376.7 730.0 L369.5 737.2 L358.7 753.5 L329.8 836.4 L292.0 910.3 L288.4 931.9 L268.6 993.2 L264.9 1022.0 L261.3 1029.2 L264.9 1036.5 L266.8 1058.1 L259.5 1076.1 L257.7 1092.3 L250.5 1103.2 L250.5 1117.6 L268.6 1133.8 L270.4 1164.4 L261.3 1175.3 L248.7 1178.9 L223.5 1205.9 L203.7 1205.9 L192.9 1202.3 L185.6 1195.1 L185.6 1151.8 L191.1 1144.6 L189.3 1133.8 L192.9 1126.6 L194.7 1108.6 L192.9 1083.3 L189.3 1077.9 L189.3 1023.8 L185.6 1004.0 L194.7 987.8 L196.5 953.5 L210.9 912.1 L216.3 883.2 L228.9 870.6 L225.3 856.2 L234.3 834.6 L241.5 776.9 L250.5 748.1 L248.7 742.6 L254.1 721.0 L246.9 712.0 L236.1 715.6 L225.3 704.8 L214.5 703.0 L198.3 686.8 L194.7 674.1 L194.7 657.9 L198.3 647.1 L196.5 620.1 L201.9 612.9 L192.9 539.0 L194.7 475.9 L201.9 459.6 L201.9 450.6 L209.1 434.4 L216.3 403.8 L232.5 369.5 L210.9 344.3 L207.3 337.1 L207.3 324.5 L221.7 292.0 L234.3 274.0 L236.1 259.6 L257.7 241.5 L257.7 237.9 L246.9 227.1 L246.9 210.9 L234.3 198.3 L234.3 191.1 L228.9 185.7 L228.9 180.3 L245.1 164.0 L266.8 160.4 L284.8 167.6 L293.8 176.6 L292.0 201.9 L299.2 209.1 L306.4 209.1 L315.4 200.1 L313.6 187.5 L324.4 173.0 L322.6 165.8 L344.3 115.4 L365.9 95.5 L382.1 88.3 L389.3 88.3 Z"},"tacticalsuit":{"d":"M392.8 36.6 L401.1 43.2 L376.1 81.5 L384.5 89.8 L416.1 104.8 L429.4 116.4 L439.4 133.1 L444.4 153.0 L442.7 169.7 L424.4 187.9 L419.4 207.9 L436.0 221.2 L441.0 219.5 L447.7 222.9 L466.0 239.5 L484.3 232.9 L492.6 232.9 L502.6 241.2 L510.9 239.5 L517.6 246.2 L527.6 267.8 L527.6 276.1 L524.3 279.4 L525.9 304.4 L522.6 319.3 L527.6 324.3 L525.9 341.0 L530.9 357.6 L514.3 384.2 L515.9 412.5 L522.6 430.8 L522.6 445.7 L529.2 455.7 L525.9 462.4 L535.9 474.0 L557.5 475.7 L565.9 484.0 L570.9 504.0 L577.5 515.6 L575.8 520.6 L585.8 543.9 L584.2 572.2 L590.8 598.8 L590.8 633.7 L580.8 647.0 L580.8 660.3 L587.5 683.6 L594.1 695.2 L594.1 711.9 L585.8 731.8 L562.5 750.1 L552.5 755.1 L545.9 755.1 L535.9 745.1 L532.6 745.1 L525.9 751.8 L525.9 796.7 L524.3 808.3 L517.6 815.0 L489.3 815.0 L482.6 821.6 L482.6 831.6 L491.0 851.6 L472.7 873.2 L476.0 923.1 L466.0 946.4 L462.7 978.0 L462.7 1024.6 L457.7 1052.8 L457.7 1064.5 L462.7 1071.1 L459.3 1107.7 L461.0 1147.6 L479.3 1170.9 L512.6 1180.9 L529.2 1197.5 L534.2 1210.8 L534.2 1225.8 L537.6 1234.1 L535.9 1254.1 L529.2 1260.7 L510.9 1270.7 L484.3 1269.1 L472.7 1274.0 L461.0 1284.0 L439.4 1284.0 L437.7 1285.7 L442.7 1290.7 L437.7 1292.3 L407.8 1290.7 L412.7 1285.7 L402.8 1277.4 L399.4 1277.4 L392.8 1284.0 L386.1 1284.0 L374.5 1279.0 L362.8 1267.4 L361.2 1174.2 L366.1 1162.6 L366.1 1106.1 L357.8 1069.5 L357.8 1061.1 L361.2 1056.2 L359.5 1009.6 L372.8 969.7 L377.8 928.1 L376.1 918.1 L371.1 909.8 L366.1 883.2 L362.8 828.3 L346.2 771.7 L341.2 733.5 L332.9 725.2 L329.5 725.2 L322.9 731.8 L317.9 756.8 L284.6 821.6 L282.9 830.0 L289.6 846.6 L276.3 861.6 L264.6 901.5 L244.7 931.4 L238.0 948.0 L236.3 983.0 L226.3 1026.2 L226.3 1044.5 L218.0 1079.4 L214.7 1117.7 L214.7 1126.0 L223.0 1144.3 L219.7 1182.6 L204.7 1204.2 L203.0 1224.1 L191.4 1232.5 L161.4 1232.5 L153.1 1230.8 L138.1 1217.5 L131.5 1219.2 L124.8 1212.5 L126.5 1187.6 L129.8 1182.6 L129.8 1146.0 L133.1 1136.0 L129.8 1131.0 L129.8 1109.4 L136.5 1102.7 L138.1 1096.1 L141.5 1041.2 L144.8 1036.2 L143.1 1022.9 L153.1 1006.3 L153.1 996.3 L149.8 991.3 L151.5 971.3 L154.8 968.0 L153.1 961.4 L166.4 929.8 L174.8 921.4 L176.4 909.8 L189.7 884.8 L189.7 874.9 L194.7 861.6 L193.1 831.6 L196.4 820.0 L196.4 785.0 L184.7 770.1 L186.4 733.5 L164.8 716.9 L148.1 711.9 L136.5 700.2 L129.8 685.3 L129.8 671.9 L134.8 653.7 L134.8 633.7 L138.1 630.4 L134.8 582.1 L136.5 562.2 L134.8 547.2 L131.5 543.9 L131.5 500.6 L134.8 495.6 L131.5 489.0 L134.8 475.7 L148.1 457.4 L149.8 442.4 L153.1 439.1 L151.5 387.5 L146.5 382.5 L139.8 354.3 L139.8 339.3 L151.5 321.0 L149.8 306.0 L153.1 302.7 L153.1 294.4 L136.5 206.2 L143.1 196.3 L158.1 153.0 L158.1 109.8 L166.4 99.8 L173.1 106.4 L176.4 118.1 L188.1 129.7 L184.7 141.4 L193.1 149.7 L194.7 156.3 L203.0 164.7 L211.4 163.0 L218.0 169.7 L216.4 173.0 L228.0 184.6 L236.3 183.0 L244.7 187.9 L264.6 164.7 L272.9 141.4 L286.3 119.8 L299.6 106.4 L321.2 93.1 L329.5 84.8 L331.2 64.9 L337.9 58.2 L357.8 58.2 L362.8 63.2 L367.8 63.2 L382.8 49.9 L391.1 38.3 Z"}};
    function contourSol(cle, etat) {
        const c = CONTOURS_SOL[cle] || CONTOURS_SOL.utilitysuit; if (!c) return "";
        if (etat === "veille") return `<g fill="none" stroke-linejoin="round"><path d="${c.d}" stroke="#00F0FF" stroke-width="3" stroke-opacity=".38"/></g>`;     // hors combat : le jeu ne donne pas l'etat du bouclier, contour calme
        if (etat === "up") return `<defs><filter id="neon" x="-20%" y="-10%" width="140%" height="120%"><feGaussianBlur stdDeviation="9" result="b1"/><feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b2"/><feMerge><feMergeNode in="b1"/><feMergeNode in="b2"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<g filter="url(#neon)" fill="none" stroke-linejoin="round" stroke-linecap="round"><path d="${c.d}" stroke="#00B8FF" stroke-width="22" stroke-opacity=".30"/><path d="${c.d}" stroke="#00F0FF" stroke-width="9" stroke-opacity=".75"><animate attributeName="stroke-opacity" values=".6;1;.6" dur="2.6s" repeatCount="indefinite"/></path><path d="${c.d}" stroke="#D9FDFF" stroke-width="3.2"/>
<path d="${c.d}" pathLength="1000" stroke="#FFFFFF" stroke-width="7" stroke-dasharray="46 954"><animate attributeName="stroke-dashoffset" values="0;-1000" dur="4.2s" repeatCount="indefinite"/></path></g>`;
        return `<g fill="none" stroke-linejoin="round"><path d="${c.d}" stroke="#FF3B30" stroke-width="6" stroke-dasharray="26 20"><animate attributeName="stroke-opacity" values=".8;.1;.6;.05;.7" dur="1.4s" repeatCount="indefinite"/></path></g>`;
    }
    // equipement du personnage (armes, ceinture, sac, combinaison) : numerote, repris en legende sous l'hologramme
    function equipPied() {
        const p = (S && S.pied) || {}, arm = p.armes || {}, out = [], base = String(p.suit || "").replace(/_class\d+$/, ""), grade = (String(p.suit || "").match(/class(\d+)$/) || [])[1];
        const cnt = cat => ((p.sac || {})[cat] || []).reduce((t, x) => t + (Number(x[1]) || 0), 0), nConso = cnt("conso"), nSac = cnt("data") + cnt("comp") + cnt("items");
        if (arm.p1) out.push({ k: "p1", tit: arm.p2 ? "ARME PRINCIPALE 1" : "ARME PRINCIPALE", nom: arm.p1.n, sous: arm.p1.c ? "classe " + arm.p1.c : "", c: "#FF9A1F" });
        if (arm.p2) out.push({ k: "p2", tit: "ARME PRINCIPALE 2", nom: arm.p2.n, sous: arm.p2.c ? "classe " + arm.p2.c : "", c: "#FF9A1F" });
        if (arm.s) out.push({ k: "s", tit: "ARME SECONDAIRE", nom: arm.s.n, sous: arm.s.c ? "classe " + arm.s.c : "", c: "#FF9A1F" });
        out.push({ k: "cei", tit: "CEINTURE", nom: nConso + " consommable" + (nConso > 1 ? "s" : ""), sous: "", c: "#3DDC97" });
        out.push({ k: "sac", tit: "SAC À DOS", nom: nSac + " objet" + (nSac > 1 ? "s" : ""), sous: "", c: "#00F0FF" });
        out.push({ k: "comb", tit: "COMBINAISON", nom: (typeof SOL_NOMS !== "undefined" && SOL_NOMS[base]) || "Combinaison", sous: grade ? "grade " + grade : "", c: "#00F0FF" });
        return out;
    }
    function holoCombi(cle, etat, eq) {
        let su = null; try { su = SOL_SUITS[String(cle || "").toLowerCase()] || SOL_SUITS.utilitysuit; } catch (e) { su = { img: "images/combinaisons/maverick-dos.webp", W: 745, H: 1359, a: {} }; }
        const W = su.W, H = su.H, a = su.a || {};
        const marques = (eq || []).map((x, i) => a[x.k] ? `<g><circle cx="${a[x.k][0]}" cy="${a[x.k][1]}" r="30" fill="rgba(2,6,8,.7)" stroke="${x.c}" stroke-width="5"/><text x="${a[x.k][0]}" y="${a[x.k][1] + 11}" text-anchor="middle" font-size="32" font-weight="bold" fill="#fff" font-family="Consolas,monospace">${i + 1}</text></g>` : "").join("");
        return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet"><defs>
<filter id="hsc" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.25 0.55 0.2 0 0   0.25 0.55 0.2 0 0   0.25 0.55 0.2 0 0   0 0 0 1 0"/><feComponentTransfer><feFuncR type="linear" slope="0" intercept="0"/><feFuncG type="table" tableValues="${TS}"/><feFuncB type="table" tableValues="${TS}"/></feComponentTransfer></filter>
<radialGradient id="fsc" cx=".5" cy=".5" r=".62"><stop offset=".55" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient><mask id="msc"><rect width="${W}" height="${H}" fill="url(#fsc)"/></mask>
<pattern id="lsc" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1.4" fill="#000" opacity=".3"/></pattern>
<linearGradient id="bsc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#00F0FF" stop-opacity="0"/><stop offset="1" stop-color="#00F0FF" stop-opacity=".35"/></linearGradient></defs>
<g mask="url(#msc)"><image href="${su.img}" width="${W}" height="${H}" filter="url(#hsc)"/><rect width="${W}" height="${H}" fill="url(#lsc)"/>
<g class="tbs-balai" style="--h:${H - 60}px"><rect x="0" y="-30" width="${W}" height="30" fill="url(#bsc)"/><rect x="0" y="0" width="${W}" height="3" fill="#00F0FF" opacity=".8"/></g></g>${contourSol(cle, etat)}${marques}</svg>`;
    }

    // ---------------------------------------------------------------- armement du pilote : points d'emport (positions stylisees)
    function armesDuVaisseau() {
        const res = [];
        try {
            (((S || {}).vaisseau || {}).mods || []).forEach(m => {
                const sm = String(m.s || "").match(/^(Small|Medium|Large|Huge)Hardpoint(\d+)$/);
                if (!sm) return;
                const cl = { Small: 1, Medium: 2, Large: 3, Huge: 4 }[sm[1]], nom = typeof tbmNomModule === "function" ? tbmNomModule(m.i) : String(m.i || "");
                res.push({ slot: m.s, cl, nom: nom || String(m.i || ""), on: m.o !== 0 });
            });
        } catch (e) { /* pas d'armement connu */ }
        return res.sort((a, b) => b.cl - a.cl || a.slot.localeCompare(b.slot));
    }
    function armesHolo(sil, armes) {
        if (!sil || !armes.length) return { svg: "" };
        const W = sil.W, H = sil.H, cq = (sil.coque || []).slice().sort((a, b) => a[1] - b[1]);
        const demi = yi => { for (let i = 1; i < cq.length; i++) if (yi <= cq[i][1]) { const a = cq[i - 1], b = cq[i], f = (yi - a[1]) / Math.max(b[1] - a[1], 1); return a[0] + f * (b[0] - a[0]); } return cq.length ? cq[cq.length - 1][0] : 100; };
        const n = armes.length, yh = H - (sil.nez || H * 0.8), yb = H - (sil.arriere || H * 0.2);
        const svg = armes.map((a, i) => {
            const yd = yh + (0.16 + 0.5 * i / Math.max(n - 1, 1)) * (yb - yh), x = (sil.axe || W / 2) + (i % 2 ? 1 : -1) * demi(H - yd) * 0.78;
            return `<g opacity="${a.on ? 1 : 0.4}"><circle cx="${x.toFixed(1)}" cy="${yd.toFixed(1)}" r="${9 + a.cl * 4}" fill="rgba(255,154,31,.16)" stroke="#FF9A1F" stroke-width="2.4"/><text x="${x.toFixed(1)}" y="${(yd + 5).toFixed(1)}" text-anchor="middle" font-size="15" font-weight="bold" fill="#fff" stroke="#04090c" stroke-width="3" paint-order="stroke">${i + 1}</text></g>`;
        }).join("");
        return { svg };
    }

    // ---------------------------------------------------------------- petits utilitaires d'affichage
    const modeDe = e => e && e.mode ? e.mode : "secu";
    const typeCombi = k => { const m = String(k || "").match(/^([a-z]+suitai)_class(\d)/); return m ? (COMBI_TYPES[m[1]] || "Soldat") + " · classe " + m[2] : k === "civil" ? "Civil" : (String(k || "") || "Ennemi"); };
    const intensite = z => z === "H" ? ["FORTE INTENSITÉ", "fo"] : z === "M" ? ["INTENSITÉ MOYENNE", "mo"] : z === "S" ? ["FAIBLE INTENSITÉ", ""] : null;
    const dureeCombat = e => { const fin = e.actif ? Date.now() / 1000 : (e.fin || (e.maj ? new Date(e.maj).getTime() / 1000 : Date.now() / 1000)); return Math.max(0, fin - (e.t0 || fin)); };
    const minutes = s => s < 60 ? Math.round(s) + " s" : Math.round(s / 60) + " min";
    const tierBon = (r, mode) => mode === "guerre" ? (r >= 3500 ? 3 : r >= 2500 ? 2 : 1) : (r >= 1400 ? 3 : r >= 800 ? 2 : 1);
    const COUL_T = { 1: "#8b97a0", 2: "#FF9A1F", 3: "#FFD700" };
    function sousSysteme(nom) {
        const n = String(nom || "").toLowerCase();
        if (/centrale|power/.test(n)) return [0.62];
        if (/propuls|engine|drive/.test(n) && !/frame|fsd/.test(n)) return [0.86];
        if (/fsd|frame|hyper/.test(n)) return [0.72];
        if (/bouclier|shield/.test(n)) return [0.4];
        if (/arme|weapon|hardpoint/.test(n)) return [0.5];
        if (/cargo|soute|cale/.test(n)) return [0.55];
        return [0.6];
    }

    // ---------------------------------------------------------------- blocs
    function bandeau(e) {
        const mode = modeDe(e), pied = !!e.pied, mn = minutes(dureeCombat(e)), etat = e.actif ? mn : "terminé · " + mn;
        const iz = intensite(e.zi);
        if (mode === "pvp") return `<div class="cb-zc pvp"><span class="al">● COMBAT CONTRE UN JOUEUR</span><div class="nom">${pied ? "DUEL À PIED" : "DUEL"} · ${E(String(e.sys || "").toUpperCase())}<small>${E(etat)}</small></div><div class="vs"><span class="cb-puce ph">PVP</span></div></div>`;
        if (mode === "guerre") {
            const lieu = e.lieu || e.sys || "";
            return `<div class="cb-zc"><span class="al">● ${pied ? "COMBAT AU SOL" : "ZONE DE CONFLIT"}</span><div class="nom">${E(String(lieu).toUpperCase())}<small>${E(e.sys || "")} · ${E(etat)}</small></div>
<div class="vs">${e.soutien ? `<span class="a">▲ ${E(e.soutien)}</span>` : ""}${e.soutien && e.ennemi ? "<i>contre</i>" : ""}${e.ennemi ? `<span class="b">▼ ${E(e.ennemi)}</span>` : ""}${iz ? `<span class="cb-puce ${iz[1]}">${iz[0]}</span>` : ""}</div></div>`;
        }
        return `<div class="cb-zc secu"><span class="al">● ${pied ? "COMBAT AU SOL · CHASSE AUX PRIMES" : "CHASSE AUX PRIMES"}</span><div class="nom">${E(String((pied && e.lieu) || e.sys || "").toUpperCase())}<small>${pied && e.lieu ? E(e.sys || "") + " · " : ""}${E(etat)}</small></div>
<div class="vs">${e.ennemi ? `<span class="b">▼ ${E(e.ennemi)}</span>` : ""}</div></div>`;
    }
    function bandesMissions(e) {
        let h = "";
        if (e.dir) h += `<div class="cb-dir"><b>DIRECTIVE BGS</b> GUERRE · ${E(e.dir.sys || "")} contre ${E(e.dir.f || "")} <span>· vos victoires comptées :</span> <b class="n">${e.dir.n}</b> <span>· lancée par votre Amiral</span></div>`;
        (e.miss || []).slice(0, 2).forEach(m => {
            const lieu = [m.st, m.sys].filter(Boolean).join(", ");
            const exp = m.exp ? (() => { const s = (new Date(m.exp).getTime() - Date.now()) / 1000; return s > 0 ? "expire dans " + (typeof duree === "function" ? duree(s) : Math.round(s / 60) + " min") : "expirée"; })() : "";
            if (m.ty === "A") h += `<div class="cb-miss"><b>MISSION · ASSASSINAT</b> Éliminer <b class="n">${E(m.tg)}</b>${lieu ? " · " + E(lieu) : ""} · ${m.k >= 1 ? "<b class=\"n\">cible éliminée ★</b>" : "cible non éliminée"}<span class="d">${m.rec ? FR(m.rec) + " cr" : ""}${exp ? " · " + exp : ""}</span></div>`;
            else h += `<div class="cb-miss"><b>MISSION · MASSACRE</b> ${E(m.tf)} · <b class="n">${Math.min(m.k, m.n || m.k)}${m.n ? " / " + m.n : ""}</b> éliminés <span class="est">(compté par EDTEAM)</span>${lieu ? " · retour à " + E(lieu) : ""}<span class="d">${m.rec ? FR(m.rec) + " cr" : ""}${exp ? " · " + exp : ""}</span></div>`;
        });
        return h;
    }
    function stats(e) {
        const mode = modeDe(e), pied = !!e.pied, mo = e.moi || {}, p = e.pend || [0, 0], d = e.duels || [0, 0];
        const c = (cls, tit, val, sous) => `<div class="${cls || ""}"><small>${tit}</small><b>${val}${sous ? ` <span>${sous}</span>` : ""}</b></div>`;
        const coque = pied ? c("", "MÉDIKITS", e.med || 0) : c("v", "COQUE", mo.co == null ? "—" : mo.co + " %", mo.co == null ? "aucun dégât relevé" : "");
        const bt = c("c", "BOUCLIERS TOMBÉS", e.bt || 0), dc = c("", "DÉCÈS", e.deces || 0);
        let a;
        if (mode === "pvp") a = [c("v", "DUELS GAGNÉS", d[0]), c("r", "DUELS PERDUS", d[1]), c("j", "RATIO", d[1] ? (d[0] / d[1]).toFixed(1).replace(".", ",") : d[0] ? "—" : "0"), bt, coque, dc];
        else if (mode === "guerre") {
            const v = e.vic || [], der = v.length ? v[v.length - 1] : "", it = { H: "forte", M: "moyenne", S: "faible" }[der] || "";
            a = [c("r", "ÉLIMINÉS", e.nb || 0), c("j", "BONS DE GUERRE", FR(e.bons) + " cr"), c("j", "NON ENCAISSÉS", FR(p[1]) + " cr", "à risque"), c("v", "VICTOIRES", v.length, it), bt, pied ? coque : dc];
        } else a = [c("r", "ÉLIMINÉS", e.nb || 0), c("j", "PRIMES GAGNÉES", FR(e.primes) + " cr"), c("j", "NON ENCAISSÉES", FR(p[0]) + " cr", "à risque"), bt, coque, dc];
        return a.join("");
    }

    // ----- ton vaisseau / ta combinaison (gauche)
    function moiHolo(e, pOn) {
        if (pOn) {
            const su = (S && S.pied && S.pied.suit) || "utilitysuit";
            const base = String(su).replace(/_class\d+$/, ""), etat = !(e && e.actif) ? "veille" : (e.moi && e.moi.bo) ? "up" : "down";
            let cle = "pied:" + su + ":" + etat; try { cle += JSON.stringify(S.pied); } catch (x) { /* cle simple */ }
            return { cle, html: holoCombi(base, etat, equipPied()) };
        }
        const modele = (S && S.vaisseau && S.vaisseau.modele) || "", sil = silDe(modele), armes = armesDuVaisseau();
        const mo = e.moi || {}, recent = mo.imp && (Date.now() / 1000 - mo.imp) < 8;
        const ar = armesHolo(sil, armes);
        let imp = "";
        if (recent && sil) imp = `<g><circle cx="${sil.axe}" cy="${sil.H * 0.45}" r="34" fill="none" stroke="#FF3B30" stroke-width="4" opacity=".9"><animate attributeName="r" values="22;60;22" dur="1.6s" repeatCount="indefinite"/></circle><circle cx="${sil.axe}" cy="${sil.H * 0.45}" r="9" fill="#FF3B30" style="filter:drop-shadow(0 0 8px #FF3B30)"/></g>`;
        return { cle: "v:" + modele + ":" + armes.map(a => a.slot + a.on).join(",") + ":" + (recent ? 1 : 0), html: sil ? holoVaisseau(sil, "p", ar.svg + imp, false) : holoGenerique("p", false) };
    }
    function moiBarres(e, pied, veille) {
        const mo = e.moi || {};
        const bar = (nom, pct, coul, txt) => `<div class="cb-barre"><span>${nom}</span><div class="j"><i style="width:${pct}%;background:${coul}"></i></div><b>${txt}</b></div>`;
        let h = "";
        if (pied) {
            h += `<div class="cb-equip">${equipPied().map((x, i) => `<div><b style="--c:${x.c}">${i + 1}</b><span><small>${x.tit}</small>${E(x.nom || "—")}${x.sous ? " · " + E(x.sous) : ""}</span></div>`).join("")}</div>`;
            if (!veille) {
                h += bar("BOUCLIER", mo.bo ? 100 : 0, mo.bo ? "var(--cy)" : "var(--rg)", mo.bo ? "ACTIF" : "TOMBÉ");
                h += bar("SANTÉ", mo.sante == null ? 100 : mo.sante, "var(--vt)", mo.sante == null ? "—" : mo.sante + " %");
            }
        } else {
            if (!veille) {
                h += bar("BOUCLIERS", mo.bo ? 100 : 0, mo.bo ? "var(--cy)" : "var(--rg)", mo.bo ? "ACTIFS" : "TOMBÉS");
                h += bar("COQUE", mo.co == null ? 100 : mo.co, "var(--vt)", mo.co == null ? "—" : mo.co + " %");
            }
            const ar = armesDuVaisseau();
            if (ar.length) h += `<div class="cb-armes"><h3>ARMEMENT <em>positions stylisées</em></h3>${ar.map((a, i) => `<div class="cb-arm"><b>${i + 1}</b><span>${E(a.nom)}</span></div>`).join("")}</div>`;
            if (veille) h += `<div class="cb-note">L’état de vos boucliers, de votre coque et de vos armes s’affiche pendant un combat.</div>`;
            else h += `<div class="cb-etat">${mo.arm ? `<span class="r">ARMES SORTIES</span>` : `<span class="g">ARMES RENTRÉES</span>`}<span class="${mo.bo ? "c" : "r"}">${mo.bo ? "BOUCLIERS ACTIFS" : "BOUCLIERS TOMBÉS"}</span>${mo.fg != null ? `<span class="j">GROUPE DE TIR ${(+mo.fg || 0) + 1}</span>` : ""}</div>`;
        }
        return h;
    }

    // ----- la cible (droite)
    const campCible = (c, e) => (c ? camp(c, e) : "r");
    function cibleHolo(c, e) {
        if (!c) return { cle: "aucune", html: "" };
        const sil = silDe(c.s), ton = campCible(c, e), t = ton === "r" ? true : ton;
        return { cle: "c:" + c.s + ":" + (c.j ? 1 : 0) + ":" + ton, html: sil ? holoVaisseau(sil, "t", "", t) : holoGenerique("t", t) };
    }
    function boite(cote, haut, tit, val, sous, cls, couleurSous) {
        if (String(val || "").replace(/<[^>]*>/g, "").length > 22) cls = (cls || "") + " long";
        return `<div class="cb-bx ${cls || ""}" style="${cote}:12px;top:${haut}px;${cote === "right" ? "text-align:right" : ""}"><small>${tit}</small><b>${val}</b>${sous ? `<small class="s" style="color:${couleurSous || "var(--rg)"}">${sous}</small>` : ""}</div>`;
    }
    function cibleDonnees(e, veille) {
        const c = e.cible;
        if (!c) return veille ? `<div class="cb-aucune">AUCUN COMBAT EN COURS<br><small>la fiche de la cible s’affichera ici dès que vous en verrouillerez une</small></div>` : `<div class="cb-aucune">AUCUNE CIBLE VERROUILLÉE<br><small>verrouillez un vaisseau pour afficher sa fiche</small></div>`;
        const j = !!c.j, st = c.st || 0, att = (v) => v || `<span class="att" title="analyse en cours">analyse</span>`;
        const nomV = c.sl || (typeof nomVaisseau === "function" ? nomVaisseau(c.s) : c.s);
        let h = boite("left", 70, "VAISSEAU", E(String(nomV || c.sl || "?").toUpperCase()));
        h += boite("left", 170, "PILOTE", c.p ? (j ? "CMD " : "") + E(c.p) : att(""), j ? "JOUEUR" : "PNJ", j ? "pvp" : "", j ? "var(--jn)" : "var(--rg)");
        h += boite("left", 290, j ? "ESCADRON" : "RANG", c.rg || c.e ? E(j ? "[" + c.e + "]" : String(c.rg).toUpperCase()) : (j && !c.e ? "—" : att("")));
        h += boite("right", 70, "PRIME", c.pm ? FR(c.pm) + " cr" : "—", "", "jn");
        const wanted = /wanted|recherch/i.test(c.l || "");
        h += boite("right", 170, j ? "STATUT LÉGAL" : "FACTION", st >= 3 || c.f ? E(j ? (c.l || "—") : (c.f || "—")) : att(""), (c.l ? (j ? "" : "STATUT : " + E(String(c.l).toUpperCase())) : "") + (c.mi ? (c.l ? " · " : "") + "★ CIBLE DE MISSION" : ""), "", wanted || c.mi ? "var(--rg)" : "var(--vt)");
        { const cr = campR(c, e), col = { r: "var(--rg)", v: "#00FF66", b: "#6FA8FF" }[cr[0]];
          h += boite("right", 405, "PUISSANCE DÉFENDUE", st >= 3 || c.pw ? E(c.pw || "AUCUNE") : att(""), E(cr[1]), "", col); }
        h += campCible(c, e) === "r" ? menaceHtml(c) + tamponHtml(c) : "";
        return h;
    }
    // niveau de menace ESTIME (rang du pilote, classe du vaisseau, prime) : le jeu ne donne pas de niveau de menace
    const GROS = /^(anaconda|cutter|federation_corvette|type9_military|krait_mkii|panthermkii|typex_2|typex_3|python|python_nx|federation_gunship|empire_trader|type9|type7)$/, MOYEN = /^(ferdelance|mamba|vulture|asp|asp_scout|diamondback|diamondbackxl|empire_courier|federation_dropship|federation_dropship_mkii|krait_light|cobramkiii|cobramkiv|cobramkv|typex|dolphin|independant_trader|smallcombat01_nx)$/;
    function menace(c) {
        if (!c || (c.st || 0) < 3) return null;
        const ri = RANGS_COMBAT.indexOf(String(c.rg || "").toUpperCase()), cle = String(c.s || "").toLowerCase();
        const pts = (ri < 0 ? 3 : ri) / 13 * 55 + (GROS.test(cle) ? 32 : MOYEN.test(cle) ? 20 : 8) + (c.pm > 0 ? (c.pm >= 50000 ? 13 : 6) : 0);
        const niv = pts < 30 ? 1 : pts < 50 ? 2 : pts < 70 ? 3 : 4;
        return { niv, lab: ["FAIBLE", "MOYENNE", "ÉLEVÉE", "EXTRÊME"][niv - 1], col: ["#8b97a0", "#FFD700", "#FF9A1F", "#FF3B30"][niv - 1] };
    }
    function menaceHtml(c) {
        if (!c) return "";
        const m = menace(c);
        if (!m) return `<div class="cb-bx" style="right:12px;top:290px;text-align:right"><small>MENACE ESTIMÉE</small><b><span class="att" title="analyse en cours">analyse</span></b></div>`;
        return `<div class="cb-bx cb-men" title="Estimation EDTEAM d’après le rang du pilote, le vaisseau et la prime : le jeu ne donne pas de niveau de menace" style="right:12px;top:290px;text-align:right;border-color:${m.col}"><small>MENACE ESTIMÉE</small><b style="color:${m.col}">${m.lab}</b><div class="seg">${[1, 2, 3, 4].map(i => `<i style="${i <= m.niv ? "background:" + m.col + ";box-shadow:0 0 8px " + m.col : ""}"></i>`).join("")}</div></div>`;
    }
    function tamponHtml(c) {
        if (!c || c.m) return "";
        const wanted = /wanted|recherch/i.test(c.l || "");
        if (!wanted && !(c.pm > 0)) return "";
        return `<div class="cb-stamp"><b>RECHERCHÉ</b><small>${c.pm > 0 ? "PRIME " + FR(c.pm) + " CR" : "STATUT : " + E(String(c.l || "").toUpperCase())}</small></div>`;
    }
    function radar(e) {
        const V = contacts(e), R = 215, CX = 380, CY = 275, ct = e.cible ? campCible(e.cible, e) : "r", cs = { r: ["rgba(255,59,48,.13)", "rgba(255,110,95,.55)"], v: ["rgba(0,255,102,.12)", "rgba(110,255,170,.55)"], b: ["rgba(61,139,255,.14)", "rgba(130,180,255,.6)"] }[ct];
        const sweep = `<g class="cb-sweep"><path d="M${CX} ${CY} L${CX + R} ${CY} A${R} ${R} 0 0 0 ${(CX + R * Math.cos(Math.PI * 35 / 180)).toFixed(1)} ${(CY - R * Math.sin(Math.PI * 35 / 180)).toFixed(1)} Z" fill="${cs[0]}"/><line x1="${CX}" y1="${CY}" x2="${CX + R}" y2="${CY}" stroke="${cs[1]}" stroke-width="1.5"/></g>`;
        const n = V.length, blips = V.map((v, i) => {
            const th = n === 1 ? 90 : 25 + 130 * i / (n - 1), a = th * Math.PI / 180, x = CX + R * Math.cos(a), y = CY + R * Math.sin(a), col = TONS[v.ton];
            const nom = (typeof nomVaisseau === "function" && nomVaisseau(v.s)) || v.sl || "?";
            return `<g class="cb-blip" style="animation-delay:${(th / 360 * 6).toFixed(2)}s"><title>${E(nom)}${v.p ? " · " + E(v.p) : ""} (position indicative)</title><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="11" fill="none" stroke="${col}" stroke-opacity=".5"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="${col}" style="filter:drop-shadow(0 0 6px ${col})"/><text x="${x.toFixed(1)}" y="${(y + 24).toFixed(1)}" text-anchor="middle" font-family="Consolas,monospace" font-size="10" letter-spacing="1" fill="${col}">${E(String(nom).toUpperCase().slice(0, 12))}</text></g>`;
        }).join("");
        return sweep + blips;
    }
    function cibleScene(e) {
        const c = e.cible, ss = c && c.ss ? sousSysteme(c.ss) : null, ton = c ? campCible(c, e) : "r";
        const TC = ton === "r" ? (c && c.j ? { c: "#FFD700", f: "rgba(255,215,0,.3)", l: "rgba(255,215,0,.6)" } : { c: "#FF3B30", f: "rgba(255,59,48,.28)", l: "rgba(255,59,48,.7)" }) : ton === "v" ? { c: "#00FF66", f: "rgba(0,255,102,.3)", l: "rgba(0,255,102,.6)" } : { c: "#3D8BFF", f: "rgba(61,139,255,.3)", l: "rgba(61,139,255,.65)" };
        const y0 = 130, y1 = 410, y = ss ? y0 + (y1 - y0) * ss[0] : 0;
        const marque = ss ? `<g font-family="Consolas,monospace" font-size="10" letter-spacing="1.5"><rect x="356" y="${(y - 17).toFixed(0)}" width="48" height="34" rx="2" stroke="#FFD700" fill="none" stroke-dasharray="4 3"/><text x="380" y="${(y + 34).toFixed(0)}" text-anchor="middle" fill="#FFD700">${E(String(c.ss).toUpperCase())}</text></g>` : "";
        return `<svg class="fond" viewBox="0 0 760 540"><g fill="none" stroke="${TC.f}"><circle cx="380" cy="275" r="215"/><circle cx="380" cy="275" r="160" stroke-dasharray="3 7"/></g>
<g class="rot" fill="none" stroke="${TC.c}" stroke-width="2"><path d="M380 55 a220 220 0 0 1 36 3"/><path d="M380 495 a220 220 0 0 1 -36 -3"/><path d="M160 275 a220 220 0 0 1 3 -36"/><path d="M600 275 a220 220 0 0 1 -3 36"/></g>
<g class="cb-br" stroke="${TC.c}" stroke-width="2.5" fill="none" style="filter:drop-shadow(0 0 5px ${TC.c})"><path d="M262 140 h-28 v28"/><path d="M498 140 h28 v28"/><path d="M262 410 h-28 v-28"/><path d="M498 410 h28 v-28"/></g>
<g stroke="${TC.l}" fill="none"><polyline points="170,98 232,98 262,140"/><polyline points="170,198 222,198 270,230"/><polyline points="590,98 528,98 498,140"/><polyline points="590,200 520,200 484,230"/></g>${radar(e)}${marque}</svg>`;
    }
    function cibleMort(e) {
        const c = e.cible; if (!c || !c.m) return "";
        const mode = modeDe(e);
        return `<svg viewBox="0 0 760 540"><g stroke="#FF3B30" stroke-width="14" stroke-linecap="round" style="filter:drop-shadow(0 0 14px #FF3B30)"><line x1="250" y1="130" x2="510" y2="420"/><line x1="510" y1="130" x2="250" y2="420"/></g></svg>
<div class="cb-mt"><b>${c.j ? "JOUEUR ÉLIMINÉ" : "CIBLE DÉTRUITE"}</b><span>${c.mr ? "+ " + FR(c.mr) + " cr" : mode === "guerre" ? "bon de guerre encaissé" : ""}</span></div>`;
    }

    // ----- tableau de chasse (vol) / types d'ennemis (pied)
    function vignette(cle, couleur) {
        const sil = silDe(cle);
        return sil ? `<div class="th"><img src="${sil.img}" alt=""></div>` : `<div class="th"><svg viewBox="0 0 34 26"><g transform="translate(17 13) scale(.12) translate(-200 -140)" fill="none" stroke="${couleur || "#00F0FF"}" stroke-width="9"><path d="M200 6 L208 46 L246 100 L330 160 L352 204 L296 206 L252 246 L212 252 L200 256 M200 6 L192 46 L154 100 L70 160 L48 204 L104 206 L148 246 L188 252 L200 256"/></g></svg></div>`;
    }
    const LAB = { guerre: ["BON FAIBLE", "BON MOYEN", "BON ÉLEVÉ"], secu: ["PRIME FAIBLE", "PRIME MOYENNE", "PRIME ÉLEVÉE"] };
    // petit hologramme d'un vaisseau (le vrai quand il est modelise, sinon la silhouette generique) ; id stable par emplacement pour ne pas relancer les animations
    function miniHolo(cle, id, rouge) { const sil = silDe(cle); return sil ? holoVaisseau(sil, id, "", rouge) : holoGenerique(id, rouge); }
    // une fiche par ennemi : hologramme rouge barre d'une croix, nom, faction / pilote, palier et montant en cr ; tout le tableau de chasse est rouge
    const fiche = (cls, holo, nom, sous, mont, palier, etat, cible) => `<div class="cb-k ${cls}"><div class="th">${holo}</div><div class="n">${nom}<small>${sous}</small>${palier ? `<span class="pl">${palier.l}</span>` : cible ? `<span class="pl">${cible}</span>` : ""}</div><div class="v"><b>${mont}</b><small>${etat}</small></div></div>`;
    function resumeChasse(e) {
        const K = e.kills || [], mode = modeDe(e); if (mode === "pvp" || !K.length) return "";
        const tot = mode === "guerre" ? e.bons : e.primes, rec = K.map(x => x[4]), moy = rec.reduce((t, v) => t + v, 0) / K.length;
        return `<div class="cb-res"><div><small>ÉLIMINÉS</small><b>${e.nb || K.length}</b></div><div><small>${mode === "guerre" ? "BONS GAGNÉS" : "PRIMES GAGNÉES"}</small><b class="j">${FR(tot || rec.reduce((t, v) => t + v, 0))} cr</b></div><div><small>MOYENNE</small><b>${FR(moy)} cr</b></div><div><small>PLUS GROS</small><b class="j">${FR(Math.max.apply(null, rec))} cr</b></div></div>`;
    }
    function chasseListe(e, max) {
        const t0 = e.t0 || 0, L = [], c = e.cible, mode = modeDe(e), lab = LAB[mode] || LAB.secu;
        const pal = rec => ({ l: lab[tierBon(rec, mode) - 1] });
        if (c && !c.m) { const tn = campCible(c, e); L.push(fiche("verrou t" + tn, miniHolo(c.s, "kv", tn === "r" ? true : tn), E(c.sl || nomVaisseau(c.s) || "Cible"), E(((c.j ? "CMD " : "") + (c.p || "")) + (c.rg ? " · " + c.rg : "")), c.pm ? FR(c.pm) + " cr" : "—", null, "VERROUILLÉ", c.mi ? "★ CIBLE DE MISSION" : tn === "v" ? "ALLIÉ" : tn === "b" ? ((e.zi || (e.cf || []).length) ? "CAMP ?" : "NEUTRE") : c.j ? "JOUEUR" : "PNJ")); }
        const kills = (e.kills || []).slice().reverse();
        kills.slice(0, (max || 60) - (c && !c.m ? 1 : 0)).forEach((k, i) => {
            const [t, cle, nom, fac, rec, code] = k, heure = hh(t0 + t), r = rec ? FR(rec) + " cr" : "—", id = "k" + i;
            if (code === "P") L.push(fiche("mort", miniHolo("", id, true), "CMD " + E(nom), "joueur", r, null, "✕ " + heure, "DUEL GAGNÉ"));
            else if (code === "M") L.push(fiche("mort", miniHolo("", id, true), E(nom || "Civil"), E(fac || "meurtre"), "—", null, "✕ " + heure, "MEURTRE"));
            else if (code === "B") L.push(fiche("mort", miniHolo(/suitai/.test(cle) ? "" : cle, id, true), E(/suitai/.test(cle) ? typeCombi(cle) : (nomVaisseau(cle) || cle || "Ennemi")), E((nom || "") + (fac ? " · " + fac : "")), r, pal(rec), "✕ " + heure));
            else if (cle) L.push(fiche("mort", miniHolo(cle, id, true), E(nomVaisseau(cle) || cle) + ' <span class="pb" title="Un bon de guerre ne donne que la faction : le vaisseau est le dernier verrouillé de cette faction (probable)">≈</span>', E((nom ? nom + " · " : "") + (fac || "")), r, pal(rec), "✕ " + heure));
            else L.push(fiche("mort", miniHolo("", id, true), "Ennemi", E(fac || "ennemi de la zone"), r, pal(rec), "✕ " + heure));
        });
        return `<div class="liste">${L.length ? L.join("") : `<div class="cb-vide">Aucun ennemi éliminé pour le moment.</div>`}</div>`;
    }
    // camp d'un vaisseau verrouille : allie (equipage, faction qui nous soutient, statut « allie »), hostile (faction ennemie de la zone, statut recherche / hors-la-loi), sinon neutre
    // camp d'une cible : [ton, raison] (v allie, r hostile, b neutre / inconnu) ; la raison explique la couleur
    function campR(v, e) {
        const minus = x => String(x || "").trim().toLowerCase();
        const f = minus(v.f), l = String(v.l || ""), s = minus(e.soutien), en = minus(e.ennemi);
        if (/^(équipage|equipage|crew)\b/i.test(String(v.p || "")) || /allied|alli|friend|\bamie?s?\b/i.test(l)) return ["v", /allied|alli|friend|\bamie?s?\b/i.test(l) ? "Statut légal allié ou ami" : "Votre équipage"];
        const pw = minus(e.pw), P = window.EdteamPuissances;
        if (pw && (minus(v.pw) === pw || f === pw)) return ["v", "Même puissance que vous (" + (v.pw || v.f) + ")"];
        if (pw && v.pw && minus(v.pw) !== pw) {
            // camps : Fédération, Empire, Alliance, Indépendants (puissances.js) : même camp = vert, camp différent = rouge
            const rel = P ? P.relation(e.pw, v.pw) : "rival", cv = P ? P.nomCamp(v.pw) : "", ce = P ? P.nomCamp(e.pw) : "";
            if (rel === "bloc") return ["v", "Même camp que vous : " + ce + " (" + v.pw + ", vous : " + e.pw + ")"];
            if (P && P.independantes(e.pw, v.pw)) return ["r", "Puissance rivale : " + v.pw + " (vous : " + e.pw + "), deux puissances indépendantes ne sont pas alliées"];
            return ["r", "Camp rival : " + (cv ? cv + " (" + v.pw + ")" : v.pw) + " contre " + (ce ? ce + " (vous : " + e.pw + ")" : "vous : " + e.pw)];
        }
        if ((e.ag || []).some(a => minus(a[0]) === minus(v.p) && minus(a[1]) === f)) return ["r", "Cible que vous avez agressée"];
        if (f && s && f === s) return ["v", "Faction que vous soutenez"];
        if (f && en && f === en) return ["r", "Faction ennemie de la zone"];
        const fe = minus(e.fe);
        const paire = (e.cf || []).find(q => q.some(x => minus(x) === f)), autre = paire ? minus(paire.find(x => minus(x) !== f)) : "";
        if ((paire || e.zi) && (!l || /lawless|hors-la-loi/i.test(l))) {      // zone de conflit : les deux camps sont « Lawless », on ne se fie donc pas au statut
            const sys = minus(e.sys), mem = CB.mem[sys] || {};
            const amis = [s, minus(mem.s), fe, ...(CB.dirs.l || []).filter(d => /guerre|war/i.test(d.type_ordre) && minus(d.systeme_cible) === sys).map(d => minus(d.faction_cible))].filter(Boolean);
            const ennemis = [en, minus(mem.e)].filter(Boolean);
            if (f && amis.includes(f)) return ["v", "Faction soutenue dans cette zone de conflit"];
            if (f && ennemis.includes(f)) return ["r", "Faction ennemie dans cette zone de conflit"];
            if (f && amis.length && (!(e.cf || []).length || paire)) return ["r", "Faction adverse (la zone n'oppose que deux camps)"];
            if (autre && ennemis.includes(autre)) return ["v", "Adversaire de la faction ennemie"];
            return ["b", "Camp pas encore connu (ni directive de guerre, ni élimination)"];
        }
        if (/wanted|enemy|warrant|hostile|recherch/i.test(l)) return ["r", "Statut légal : " + (l || "recherché")];
        if (v.po && /wanted|warrant/i.test(String(e.ls || ""))) return ["r", "Police, et vous êtes recherché"];
        const rpk = Object.keys(e.rp || {}).find(k => minus(k) === f);
        if (rpk && Number(e.rp[rpk]) >= 35) return ["v", "Réputation amie avec " + v.f];
        if (/lawless|hors-la-loi/i.test(l)) return ["r", "Hors-la-loi (statut Lawless)"];
        return ["b", "Aucune relation connue" + (l ? " (statut " + l + ")" : "")];
    }
    const camp = (v, e) => campR(v, e)[0];
    const VUS_MAX = 3;      // vaisseaux verrouilles recemment affiches (cartes + contacts du radar) : 3 pour des etiquettes lisibles
    function contacts(e) {
        const c = e.cible;
        return (e.vus || []).filter(v => !(c && v.s === c.s && v.p === c.p)).slice(-VUS_MAX).reverse().map(v => Object.assign({}, v, { ton: camp(v, e), raison: campR(v, e)[1] }));
    }
    // vaisseaux verrouillés récemment (sous la cible) : un hologramme par vaisseau, hors la cible en cours
    function vusHtml(e) {
        const V = CB.liste = contacts(e);
        if (!V.length) return `<div class="cb-vus"><div class="t">VAISSEAUX VERROUILLÉS RÉCEMMENT <em>0</em><span class="lg"><i class="lr"></i>hostile<i class="lv"></i>allié<i class="lb"></i>neutre</span></div><div class="g"><div class="vide">AUCUN VAISSEAU VERROUILLÉ RÉCEMMENT</div></div></div>`;
        return `<div class="cb-vus"><div class="t">VAISSEAUX VERROUILLÉS RÉCEMMENT <em>${V.length}</em><span class="lg"><i class="lr"></i>hostile<i class="lv"></i>allié<i class="lb"></i>neutre</span></div><div class="g">${V.map((v, i) => `<div class="v t${v.ton}" role="button" tabindex="0" onclick="combatVu(${i})" onkeydown="if(event.key==='Enter')combatVu(${i})" title="Cliquer pour le détail"><div class="h">${miniHolo(v.s, "v" + i, v.ton)}</div><div class="x"><b>${E(nomVaisseau(v.s) || v.sl || "Vaisseau")}</b><small>${E((v.j ? "CMD " : "") + (v.p || ""))}</small><small class="rg">${E(v.rg || "")}</small></div></div>`).join("")}</div></div>`;
    }
    function chasse(e, veille) {
        const mode = modeDe(e), titre = (veille ? "DERNIER COMBAT · " : "") + (mode === "pvp" ? "DUELS" : "TABLEAU DE CHASSE"), em = mode === "pvp" ? (e.duels || [0, 0])[0] + " gagnés · " + (e.duels || [0, 0])[1] + " perdu(s)" : (e.nb || 0) + " éliminés";
        return `<h2>${titre} <em>${em}</em></h2>${resumeChasse(e)}${chasseListe(e)}${mode === "guerre" ? `<div class="pied">Un bon de guerre ne donne pas le vaisseau : « ≈ » indique le dernier vaisseau verrouillé de cette faction (probable).</div>` : ""}`;
    }
    const SOLDAT = (c, w) => `<svg viewBox="0 0 40 56" width="${w || 20}" height="${(w || 20) * 1.4}"><g fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="20" cy="9" r="6.5"/><path d="M12 20 h16 l3 16 h-5 l-1 18 h-5 l-1 -12 l-1 12 h-5 l-1 -18 h-5 z"/><path d="M31 24 l8 -6 M28 26 l9 4"/></g></svg>`;
    const mmss = t => ("0" + Math.floor(t / 60)).slice(-2) + ":" + ("0" + Math.round(t % 60)).slice(-2);
    // eliminations par tranche de temps (une minute, ou 5 / 10 minutes pour les longs combats) : histogramme + pic
    function tranches(e) {
        const K = e.kills || []; if (K.length < 1) return null;
        const dep = (e.nb || 0) > K.length ? K[0][0] : 0, D = Math.max(60, K[K.length - 1][0] - dep + 1), pas = D <= 1800 ? 60 : D <= 7200 ? 300 : 600, nb = Math.min(60, Math.ceil(D / pas)), b = new Array(nb).fill(0);
        K.forEach(k => { b[Math.min(nb - 1, Math.floor((k[0] - dep) / pas))]++; });
        const pic = Math.max.apply(null, b);
        return { b, pas, D, dep, pic, iPic: b.indexOf(pic) };
    }
    function rythme(e, tot) {
        const T = tranches(e); if (!T || (e.kills || []).length < 3) return "";
        const W = 600, H = 84, bw = W / T.b.length, h = v => Math.max(2, v / T.pic * (H - 8));
        const barres = T.b.map((v, i) => `<rect x="${(i * bw + 1).toFixed(1)}" y="${(H - h(v)).toFixed(1)}" width="${Math.max(1, bw - 2).toFixed(1)}" height="${v ? h(v).toFixed(1) : 1}" fill="${i === T.iPic ? "url(#cbhp)" : "url(#cbhb)"}" ${v ? "" : 'opacity=".25"'}/>`).join("");
        const unite = T.pas === 60 ? "minute" : (T.pas / 60) + " min", partiel = (e.nb || 0) > (e.kills || []).length;
        return `<div class="cb-rythme">${tot ? `<div class="cb-tot"><small>${tot[0]}</small><b>${tot[1]}</b></div>` : ""}<div class="t">RYTHME DES ÉLIMINATIONS <em>${partiel ? "sur les " + e.kills.length + " derniers · " : ""}par ${unite}</em><b>pic : ${T.pic} par ${unite}</b></div>
<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="cbhb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF5A4D"/><stop offset="1" stop-color="rgba(255,59,48,.25)"/></linearGradient><linearGradient id="cbhp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD700"/><stop offset="1" stop-color="rgba(255,215,0,.3)"/></linearGradient></defs>
<g stroke="rgba(255,255,255,.07)"><line x1="0" y1="${H - 0.5}" x2="${W}" y2="${H - 0.5}"/><line x1="0" y1="${H / 2}" x2="${W}" y2="${H / 2}" stroke-dasharray="3 6"/></g>${barres}</svg><div class="cb-axe"><span>${mmss(T.dep)}</span><span>${mmss(T.dep + T.D)}</span></div></div>`;
    }
    // barre segmentee : une part par categorie (largeur = proportion), compte dans chaque segment
    function segments(parts) {
        return `<div class="cb-seg">${parts.filter(p => p.n > 0).map(p => `<span style="flex:${p.n};background:linear-gradient(180deg,${p.c},${p.c}aa)" title="${E(p.nom)} : ${p.n}"><b>${p.n}</b></span>`).join("")}</div>`;
    }
    function cartesRepartition(parts) {
        const tot = parts.reduce((t, p) => t + p.n, 0) || 1, cr = parts.reduce((t, p) => t + (p.cr || 0), 0) || 1;
        return `<div class="cb-tiers">${parts.map(p => {
            const pc = Math.round(p.n / tot * 100), pcr = Math.round((p.cr || 0) / cr * 100), moy = p.n ? Math.round(p.cr / p.n) : 0;
            return `<div class="cb-tier2 ${p.n ? "" : "vide"}" style="--c:${p.c}"><div class="bu">${busteSvg(p.c, p.t || 2, 78, {})}</div><div class="tx">
<div class="top"><span class="chip">${E(p.nom)}</span><small>${E(p.sous || "")}</small></div>
<div class="big"><b>${p.n}</b><span>ennemi${p.n > 1 ? "s" : ""} · ${pc} %</span></div>
<div class="bar" title="part des ennemis"><i style="width:${pc}%"></i></div>
${p.n ? `<div class="cr"><b>${FR(p.cr)} cr</b></div><div class="mini">${pcr} % des bons · moy. <b>${FR(moy)}</b> · max <b>${FR(p.mx || 0)}</b></div>` : `<div class="mini">aucun ennemi de ce palier</div>`}
</div></div>`;
        }).join("")}</div>`;
    }
    function partsPied(e) {
        const mode = modeDe(e), k = e.kills || []; if (!k.length) return null;
        const tot = k.reduce((t, x) => t + x[4], 0), max = Math.max.apply(null, k.map(x => x[4]));
        if (mode === "guerre") {
            const P = [[1, "Bon faible", "ennemi ordinaire"], [2, "Bon moyen", "ennemi plus important"], [3, "Bon élevé", "ennemi important"]].map(r => ({ nom: r[1], sous: r[2], c: COUL_T[r[0]], t: r[0], n: 0, cr: 0 }));
            k.forEach(x => { const t = tierBon(x[4], "guerre") - 1; P[t].n++; P[t].cr += x[4]; P[t].mx = Math.max(P[t].mx || 0, x[4]); });
            return { titre: "BONS DE GUERRE", sous: "répartition · " + k.length + " ennemis", P, kpi: [["TOTAL", FR(tot) + " cr"], ["MOYENNE", FR(tot / k.length) + " cr"], ["PLUS GROS BON", FR(max) + " cr"]], note: "La couleur du personnage suit le bon du jeu : plus il est élevé, plus l’ennemi est important (hypothèse non vérifiée)." };
        }
        const COUL = ["#00F0FF", "#FF9A1F", "#B28DFF", "#00FF66", "#FF4FD8", "#FFD700"], g = {};
        k.forEach(x => { const nm = typeCombi(x[1]); (g[nm] = g[nm] || { nom: nm, n: 0, cr: 0 }); g[nm].n++; g[nm].cr += x[4]; g[nm].mx = Math.max(g[nm].mx || 0, x[4]); });
        const P = Object.keys(g).sort((a, b) => g[b].n - g[a].n).slice(0, 6).map((nm, i) => Object.assign(g[nm], { c: COUL[i % COUL.length], sous: "" }));
        return { titre: "TYPES D’ENNEMIS", sous: "selon le jeu · " + k.length + " ennemis", P, kpi: [["PRIMES", FR(tot) + " cr"], ["MOYENNE", FR(tot / k.length) + " cr"], ["PLUS GROSSE PRIME", FR(max) + " cr"]], note: "Hors zone de conflit, le jeu donne le nom, le type de combinaison et la faction de chaque ennemi." };
    }
    const kpiHtml = kp => `<div class="cb-kpi">${kp.map(x => `<div><small>${x[0]}</small><b>${x[1]}</b></div>`).join("")}</div>`;
    function typesPied(e, veille) {
        const pre = veille ? "DERNIER COMBAT · " : "", p = partsPied(e);
        if (!p) return `<h2>${pre}${modeDe(e) === "guerre" ? "BONS DE GUERRE" : "TYPES D’ENNEMIS"} <em>répartition</em></h2><div class="cb-vide">Aucun ennemi éliminé pour le moment.</div>`;
        return `<h2>${pre}${p.titre} <em>${p.sous}</em></h2>${segments(p.P)}${cartesRepartition(p.P)}${kpiHtml(p.kpi)}<div class="pied">${p.note}</div>`;
    }

    // ----- session de combat
    function chipsSession(e) {
        const d = dureeCombat(e), nb = e.nb || 0, T = tranches(e);
        return `<div class="cb-chips"><div><small>DURÉE</small><b>${minutes(d)}</b></div><div><small>ÉLIMINÉS</small><b>${nb}</b></div><div><small>RYTHME</small><b>${d >= 60 && nb ? (nb / (d / 60)).toFixed(1).replace(".", ",") + " <span>/ min</span>" : "—"}</b></div><div><small>PIC</small><b>${T && T.pic ? T.pic + " <span>/ " + (T.pas === 60 ? "min" : T.pas / 60 + " min") + "</span>" : "—"}</b></div></div>`;
    }
    // frise du temps : evenements du plugin + temps forts DEDUITS des eliminations (jalons et minute la plus chargee) : le fil n'est jamais vide pendant un long combat
    function frise(e, max) {
        const t0 = e.t0 || 0, nb = e.nb || 0, T = tranches(e), K = e.kills || [];
        const ic = { x: ["✕", "#FF3B30"], b: ["◉", "#00F0FF"], v: ["▲", "#00FF66"], d: ["☠", "#FF3B30"], i: ["⚠", "#FFD700"], j: ["◆", "#FF9A1F"], p: ["★", "#FFD700"] };
        const rel = r => ("0" + Math.floor(r / 60)).slice(-2) + ":" + ("0" + (r % 60)).slice(-2);
        const L = (e.jr || []).filter(r => !(r[1] === "x" && K.some(k => Math.abs(k[0] - r[0]) <= 1))).map(r => ({ t: r[0], c: r[1], x: r[2] }));
        K.forEach(k => { const [t, cle, nom, fac, rec, code] = k; const cr = rec ? " · " + FR(rec) + " cr" : "";
            L.push({ t, c: "x", x: code === "G" && cle ? (nomVaisseau(cle) || cle) + " ≈ éliminé" + (fac ? " · " + fac : "") + cr : code === "P" ? "CMD " + nom + " éliminé" : code === "M" ? (nom || "Civil") + " tué" + (fac ? " · " + fac : "") : code === "B" ? ((nom || (/suitai/.test(cle) ? typeCombi(cle) : (nomVaisseau(cle) || "Ennemi"))) + " éliminé" + (fac ? " · " + fac : "") + cr) : "Ennemi éliminé" + (fac && fac !== e.ennemi ? " · " + fac : "") + cr }); });
        K.forEach((k, i) => { const num = nb - K.length + i + 1; if ([1, 10, 25, 50, 75, 100, 150, 200, 300, 500].indexOf(num) >= 0) L.push({ t: k[0], c: "j", x: num === 1 ? "Premier ennemi éliminé" : num + "e ennemi éliminé" }); });
        if (T && T.pic >= 3 && K.length >= 6) L.push({ t: T.dep + T.iPic * T.pas, c: "p", x: "Pic d’activité : " + T.pic + " éliminations en " + (T.pas === 60 ? "1 minute" : T.pas / 60 + " minutes") });
        L.sort((a, b) => a.t - b.t);
        const items = L.slice(-(max || 16)).reverse().map(r => { const i = ic[r.c] || ["·", "#8b97a0"]; return `<div class="cb-ti" style="--c:${i[1]}"><i>${i[0]}</i><div class="c"><time>${hh(t0 + r.t)}<span>+${rel(r.t)}</span></time><b>${E(r.x)}</b></div></div>`; });
        return `<div class="cb-tl">${items.join("") || `<div class="cb-vide">En attente du premier événement.</div>`}</div>`;
    }
    function session(e, veille) {
        return `<h2>${veille ? "DERNIER COMBAT · " : ""}SESSION DE COMBAT <em>${e.actif ? "en cours" : "terminée"}</em></h2>${chipsSession(e)}${frise(e, 16)}`;
    }
    // recapitulatif du dernier combat (veille) : UNE ligne pleine largeur en trois colonnes (repartition | rythme | frise du temps)
    function dernierCombat(e) {
        const mode = { guerre: "Guerre", pvp: "PvP", secu: "Sécurité" }[modeDe(e)] || "Combat", age = Math.max(0, (Date.now() - ((e.fin || 0) * 1000 || new Date(e.maj || 0).getTime())) / 1000);
        const lieu = e.lieu || e.sys || "", p = e.pied ? partsPied(e) : null;
        let c1;
        if (p) c1 = `<h3 class="cb-sub">${p.titre} <em>${p.sous}</em></h3>${segments(p.P)}${cartesRepartition(p.P)}${kpiHtml(p.kpi)}`;
        else c1 = `<h3 class="cb-sub">${modeDe(e) === "pvp" ? "DUELS" : "TABLEAU DE CHASSE"} <em>${e.nb || 0} éliminés</em></h3>${resumeChasse(e)}${chasseListe(e)}`;
        const K = e.kills || [], tot = K.reduce((t, x) => t + x[4], 0), kp = p ? p.kpi : (tot ? [[modeDe(e) === "guerre" ? "BONS" : "PRIMES", FR(tot) + " cr"], ["MOYENNE", FR(tot / K.length) + " cr"], ["PLUS GROSSE", FR(Math.max.apply(null, K.map(x => x[4]))) + " cr"]] : null);
        const c3 = `<h3 class="cb-sub">FRISE DU TEMPS <em>temps forts</em></h3>${frise(e, 24)}`;
        return `<h2>DERNIER COMBAT <em>${mode}${e.pied ? " à pied" : ""} · ${E(lieu)} · terminé il y a ${typeof duree === "function" ? duree(age) : Math.round(age / 60) + " min"}</em></h2><div class="cb-3"><div>${c1}</div><div>${c3}</div></div>`;
    }

    // ----- victimes a pied : un personnage barre d'une croix par ennemi, qui retrecit pour tenir dans la fenetre
    // BUSTE D'OPERATEUR (proposition A) : medaillon hexagonal holographique ; casquette (faible) / casque + visiere (moyen) / casque integral + epauleres + antenne (lourd), chevrons de rang
    function defsBustes() {
        if (document.getElementById("cmb-defs")) return;
        const g = (id, c) => '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c + '" stop-opacity=".55"/><stop offset="1" stop-color="' + c + '" stop-opacity=".06"/></linearGradient>';
        const d = document.createElement("div"); d.id = "cmb-defs"; d.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
        d.innerHTML = '<svg width="0" height="0"><defs>' + g("cbg1", COUL_T[1]) + g("cbg2", COUL_T[2]) + g("cbg3", COUL_T[3]) + '<pattern id="cbsc" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1.3" fill="#000" opacity=".35"/></pattern><filter id="cbgl"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><clipPath id="cbhx"><polygon points="50,3 93,27 93,81 50,105 7,81 7,27"/></clipPath></defs></svg>';
        document.body.appendChild(d);
    }
    function bustePalier(c, tier, opt) {
        defsBustes(); opt = opt || {};
        const gr = "url(#cbg" + tier + ")";
        const epaules = '<path d="M10 110 L15 86 Q20 74 38 70 L62 70 Q80 74 85 86 L90 110 Z" fill="' + gr + '" stroke="' + c + '" stroke-width="1.4"/><path d="M38 70 L50 82 L62 70" fill="none" stroke="' + c + '" stroke-opacity=".7"/><path d="M50 82 V110" stroke="' + c + '" stroke-opacity=".4"/>';
        const cou = '<path d="M42 70 V60 H58 V70" fill="' + gr + '" stroke="' + c + '" stroke-width="1.2"/>';
        let tete, extra = "";
        if (tier === 1) tete = '<path d="M35 42 Q35 24 50 22 Q65 24 65 42 V54 Q65 63 50 66 Q35 63 35 54 Z" fill="' + gr + '" stroke="' + c + '" stroke-width="1.4"/><path d="M34 36 Q50 20 66 36 L70 40 H30 Z" fill="' + c + '" fill-opacity=".3" stroke="' + c + '" stroke-width="1.2"/><path d="M38 46 H62" stroke="' + c + '" stroke-width="2.4" stroke-linecap="round"/><path d="M50 22 V16" stroke="' + c + '"/>';
        else if (tier === 2) { tete = '<path d="M31 46 Q31 20 50 17 Q69 20 69 46 V56 Q69 66 59 68 H41 Q31 66 31 56 Z" fill="' + gr + '" stroke="' + c + '" stroke-width="1.5"/><path d="M36 40 H64 V50 Q64 55 59 55 H41 Q36 55 36 50 Z" fill="' + c + '" fill-opacity=".85" filter="url(#cbgl)"/><path d="M50 17 V28 M40 24 L44 30 M60 24 L56 30" stroke="' + c + '" stroke-opacity=".8"/>'; extra = '<path d="M20 90 L24 78 L38 74 V92 Z M80 90 L76 78 L62 74 V92 Z" fill="' + c + '" fill-opacity=".35" stroke="' + c + '" stroke-width="1.2"/>'; }
        else { tete = '<path d="M29 48 Q29 18 50 13 Q71 18 71 48 V58 L64 70 H36 L29 58 Z" fill="' + gr + '" stroke="' + c + '" stroke-width="1.7"/><path d="M34 40 H66 L63 54 H37 Z" fill="#fff" fill-opacity=".92" filter="url(#cbgl)"/><path d="M50 13 V26 M33 30 L40 33 M67 30 L60 33" stroke="' + c + '" stroke-width="1.2"/><path d="M71 30 L78 8" stroke="' + c + '" stroke-width="1.6" stroke-linecap="round"/><circle cx="78" cy="8" r="2" fill="' + c + '"/><path d="M36 70 L40 62 H60 L64 70" fill="' + c + '" fill-opacity=".4" stroke="' + c + '" stroke-width="1.2"/>'; extra = '<path d="M6 92 L10 74 L30 66 L36 94 Z M94 92 L90 74 L70 66 L64 94 Z" fill="' + c + '" fill-opacity=".55" stroke="' + c + '" stroke-width="1.5"/><path d="M14 80 L30 74 M86 80 L70 74" stroke="' + c + '"/>'; }
        const chev = Array.from({ length: tier }, (_, i) => '<path d="M40 ' + (100 - i * 5) + ' L50 ' + (95 - i * 5) + ' L60 ' + (100 - i * 5) + '" fill="none" stroke="' + c + '" stroke-width="2.2" stroke-linecap="round"/>').join("");
        const kia = opt.kia ? (opt.texte ? '<g clip-path="url(#cbhx)"><rect x="-10" y="46" width="120" height="14" fill="#FF3B30" fill-opacity=".85" transform="rotate(-28 50 53)"/><text x="50" y="57" text-anchor="middle" font-size="10" font-weight="bold" letter-spacing="3" fill="#fff" transform="rotate(-28 50 53)" font-family="Consolas,monospace">ÉLIMINÉ</text></g>' : '<g clip-path="url(#cbhx)"><rect x="-10" y="44" width="120" height="17" fill="#FF3B30" fill-opacity=".88" transform="rotate(-28 50 53)"/></g>') : "";
        return '<polygon points="50,3 93,27 93,81 50,105 7,81 7,27" fill="rgba(0,0,0,.45)" stroke="' + c + '" stroke-width="1.8" filter="url(#cbgl)"/><g clip-path="url(#cbhx)">' + epaules + extra + cou + tete + '<rect width="100" height="110" fill="url(#cbsc)"/></g>' + chev + kia;
    }
    const busteSvg = (c, tier, w, opt) => '<svg width="' + w + '" height="' + (w * 1.1).toFixed(1) + '" viewBox="0 0 100 110">' + bustePalier(c, tier, opt) + '</svg>';
    // fiche au survol d'un soldat (infobulle propre : plusieurs lignes, couleur du palier)
    function brancherTipSoldats() {
        if (window.__cmbTip) return; window.__cmbTip = 1;
        const tip = document.createElement("div"); tip.id = "cmb-tip"; tip.style.cssText = "position:fixed;z-index:9999;pointer-events:none;display:none;white-space:pre-line;max-width:330px;padding:9px 12px;background:rgba(6,2,2,.96);border:1px solid #FF3B30;color:#e8e8e8;font:12px/1.55 'Share Tech Mono',Consolas,monospace;box-shadow:0 0 18px rgba(255,59,48,.35)"; document.body.appendChild(tip);
        document.addEventListener("mousemove", ev => {
            const t = ev.target && ev.target.closest ? ev.target.closest(".cb-v1[data-tip]") : null;
            if (!t) { tip.style.display = "none"; return; }
            tip.textContent = t.getAttribute("data-tip"); tip.style.borderColor = t.getAttribute("data-c") || "#FF3B30"; tip.style.display = "block";
            const x = Math.min(ev.clientX + 16, window.innerWidth - 340), y = Math.min(ev.clientY + 16, window.innerHeight - tip.offsetHeight - 10); tip.style.left = Math.max(6, x) + "px"; tip.style.top = Math.max(6, y) + "px";
        });
    }
    function victimesPied(e, veille) {
        brancherTipSoldats();
        const box = document.getElementById("cmb-gv"); if (!box) return;
        const W = box.clientWidth, H = box.clientHeight, mode = modeDe(e), L = e.kills || [], nom = (e.miss || []).filter(m => m.ty === "A").map(m => String(m.tg).toLowerCase());
        const cle = (veille ? "v" : "") + L.length + ":" + W + ":" + H + ":" + (L.length ? L[L.length - 1][0] : 0);
        if (CB.cacheVict === cle && box.childElementCount) return;
        CB.cacheVict = cle;
        if (!W || !H) return;
        let s = 150; for (; s > 14; s -= 2) { const lab = s >= 66 ? 30 : 0, cols = Math.floor(W / s), rows = Math.ceil(Math.max(L.length, 1) / Math.max(cols, 1)); if (cols > 0 && rows * (s * 1.35 + lab) <= H) break; }
        const lab = s >= 66, t0 = e.t0 || 0;
        box.innerHTML = L.map((k, i) => {
            const [t, cle2, n, fac, rec] = k, tier = tierBon(rec, mode), c = COUL_T[tier], mi = n && nom.indexOf(String(n).toLowerCase()) >= 0;
            const prec = i ? L[i - 1][0] : null, ecart = prec === null ? null : t - prec;
            let raf = 1; for (let j = i - 1; j >= 0 && L[j + 1][0] - L[j][0] <= 12; j--) raf++;
            const cumul = L.slice(0, i + 1).reduce((a, x) => a + (Number(x[4]) || 0), 0), num = (e.nb || L.length) - L.length + i + 1;
            const PAL = ["", "faible", "moyen", "élevé"], palNom = (mode === "guerre" ? "BON " : "PRIME ") + PAL[tier].toUpperCase();
            const tip = [`ENNEMI N°${num}`, (n ? n + " · " : "") + (cle2 ? typeCombi(cle2) + " · " : "") + (fac || ""), palNom + " · " + FR(rec) + " cr", "éliminé à " + hh(t0 + t) + (ecart === null ? "" : " · " + (ecart < 90 ? "+" + ecart + " s après le précédent" : "+" + Math.round(ecart / 60) + " min après le précédent")), raf > 1 ? "rafale de " + raf + " éliminations en moins de 12 s" : "", "cumul : " + FR(cumul) + " cr"].filter(Boolean).join("\n");
            const txt = lab ? (n ? `<small style="color:#cfd">${E(String(n).length > 18 ? String(n).slice(0, 17) + "…" : n)}</small><small>${E(cle2 ? typeCombi(cle2).replace(" · classe ", " cl.") : "")}</small><b>${FR(rec)} cr</b>` : `<b>${FR(rec)} cr</b><small>${hh(t0 + t)}</small>`) : "";
            return `<div class="cb-v1" style="width:${s}px;padding:${(s * 0.04).toFixed(1)}px 0" data-tip="${E(tip)}" data-c="${c}">${mi ? `<div class="etoile" style="font-size:${Math.max(14, s * 0.22)}px">★</div>` : ""}<div ${mi ? `style="filter:drop-shadow(0 0 9px #B28DFF)"` : ""}>${busteSvg(c, tier, (s * 0.8).toFixed(1), { kia: true, texte: s >= 76 })}</div>${txt}</div>`;
        }).join("") || `<div class="cb-vide" style="width:100%;text-align:center;padding-top:120px">${veille ? "Aucun combat en cours. Chaque ennemi éliminé apparaîtra ici, barré d’une croix." : "Aucun ennemi éliminé pour le moment."}</div>`;
    }

    // ---------------------------------------------------------------- page
    const CSS = `<style id="cb-css">
.cb{--or:#FF9A1F;--cy:#00F0FF;--rg:#FF3B30;--vt:#00FF66;--jn:#FFD700;--gr:#8b97a0;--ln:#2c3338;color:#cfd;font-size:13px;position:relative}
.cb *{box-sizing:border-box}
.cb-zc{display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center;border:1px solid rgba(255,59,48,.55);background:linear-gradient(90deg,rgba(255,59,48,.16),rgba(255,59,48,.03) 60%,rgba(0,0,0,0));padding:9px 14px;margin-bottom:12px;position:relative}
.cb-zc:before,.cb-zc:after{content:"";position:absolute;width:12px;height:12px;border:2px solid var(--rg)}.cb-zc:before{left:-1px;top:-1px;border-right:0;border-bottom:0}.cb-zc:after{right:-1px;bottom:-1px;border-left:0;border-top:0}
.cb-zc .al{color:var(--rg);letter-spacing:4px;font-size:12px;animation:cbcl 1.6s infinite}@keyframes cbcl{50%{opacity:.35}}
.cb-zc .nom{color:#fff;font-size:17px;letter-spacing:3px}.cb-zc .nom small{color:var(--gr);font-size:12px;letter-spacing:1px;margin-left:10px}
.cb-zc .vs{display:flex;align-items:center;gap:12px;font-size:12px;letter-spacing:1px;flex-wrap:wrap;justify-content:flex-end}.cb-zc .vs .a{color:var(--vt)}.cb-zc .vs .b{color:var(--rg)}.cb-zc .vs i{color:var(--gr);font-style:normal}
.cb-puce{border:1px solid var(--ln);padding:3px 9px;font-size:11px;letter-spacing:2px;color:var(--gr)}.cb-puce.fo{border-color:var(--rg);color:var(--rg)}.cb-puce.mo{border-color:var(--or);color:var(--or)}.cb-puce.ph{border-color:var(--jn);color:var(--jn)}
.cb-zc.pvp{border-color:rgba(255,215,0,.6);background:linear-gradient(90deg,rgba(255,215,0,.14),rgba(255,215,0,.02) 60%,rgba(0,0,0,0))}.cb-zc.pvp:before,.cb-zc.pvp:after{border-color:var(--jn)}.cb-zc.pvp .al{color:var(--jn)}
.cb-zc.secu{border-color:rgba(0,240,255,.55);background:linear-gradient(90deg,rgba(0,240,255,.12),rgba(0,240,255,.02) 60%,rgba(0,0,0,0))}.cb-zc.secu:before,.cb-zc.secu:after{border-color:var(--cy)}.cb-zc.secu .al{color:var(--cy)}
.cb-dir,.cb-miss{display:flex;gap:14px;align-items:center;flex-wrap:wrap;padding:7px 12px;margin-bottom:12px;font-size:12px}
.cb-dir{border:1px solid rgba(0,255,102,.4);background:rgba(0,255,102,.05);color:#bfe}.cb-dir b{color:var(--vt);font-weight:normal;letter-spacing:2px}.cb-dir b.n,.cb-miss b.n{color:#fff;letter-spacing:0}.cb-dir span{color:var(--gr)}
.cb-miss{border:1px solid rgba(178,141,255,.55);background:rgba(178,141,255,.07);color:#e3d6ff}.cb-miss b{color:#B28DFF;font-weight:normal;letter-spacing:2px}.cb-miss .est{color:var(--gr)}.cb-miss .d{margin-left:auto;color:var(--gr)}
.cb-stats{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin-bottom:12px}
.cb-stats>div{border:1px solid var(--ln);padding:7px 10px;background:rgba(0,0,0,.35);position:relative}.cb-stats>div:before{content:"";position:absolute;left:0;top:0;width:3px;height:100%;background:var(--ln)}
.cb-stats b{display:block;color:#fff;font-size:21px;font-weight:normal;letter-spacing:1px}.cb-stats b span{display:block;font-size:11px;letter-spacing:1px;color:var(--gr);margin-top:-2px}.cb-stats small{color:var(--gr);font-size:11px;letter-spacing:2px}
.cb-stats .r b{color:var(--rg)}.cb-stats .j b{color:var(--jn)}.cb-stats .v b{color:var(--vt)}.cb-stats .c b{color:var(--cy)}
.cb-stats .r:before{background:var(--rg)}.cb-stats .j:before{background:var(--jn)}.cb-stats .v:before{background:var(--vt)}.cb-stats .c:before{background:var(--cy)}
.cb-rowA{display:grid;grid-template-columns:clamp(300px,34%,520px) minmax(0,1fr);gap:12px;margin-bottom:12px;align-items:stretch}
.cb-rowB{display:grid;grid-template-columns:minmax(0,1.9fr) minmax(0,1fr);gap:12px;align-items:stretch}
.cb-moi{display:flex;flex-direction:column}.cb-moi:not(.pied) .cb-hol svg{display:block;margin:0 auto;width:100%;max-height:clamp(200px,calc(var(--cmb-h, 100vh) - 430px),440px)}      /* hologramme du pilote : proportionnel a la hauteur de la fenetre (tablette, petit portable) */.cb-moi.pied .cb-hol{min-height:clamp(300px,calc(var(--cmb-h, 100vh) - 400px),470px)}.cb-moi.pied .cb-hol svg{max-height:clamp(300px,calc(var(--cmb-h, 100vh) - 400px),560px)}
.cb-equip{display:grid;grid-template-columns:1fr 1fr;gap:7px 14px;margin:10px 0 6px;border-top:1px dashed var(--ln);padding-top:9px}.cb-equip>div{display:grid;grid-template-columns:22px 1fr;gap:8px;align-items:center;font-size:12px;color:#e6f4f0;min-width:0}.cb-equip b{width:20px;height:20px;border-radius:50%;border:1px solid var(--c);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:normal;font-size:11px;box-shadow:0 0 6px color-mix(in srgb,var(--c) 60%,transparent)}.cb-equip small{display:block;color:var(--gr);font-size:10px;letter-spacing:2px}.cb-equip span{min-width:0}.cb-hol{position:relative;flex:1;min-height:clamp(200px,calc(var(--cmb-h, 100vh) - 430px),340px);display:flex;justify-content:center;align-items:center}.cb-hol svg{width:100%;height:100%;max-height:440px}
.cb-barre{display:grid;grid-template-columns:78px 1fr 62px;gap:8px;align-items:center;margin:6px 0;font-size:12px}.cb-barre span{color:var(--gr);letter-spacing:2px;font-size:11px}.cb-barre .j{height:9px;background:rgba(255,255,255,.08);position:relative}.cb-barre .j i{position:absolute;left:0;top:0;bottom:0;transition:width .4s}.cb-barre b{font-weight:normal;color:#fff;text-align:right}
.cb-armes{margin-top:8px;border-top:1px dashed var(--ln);padding-top:6px;display:grid;grid-template-columns:1fr 1fr;gap:1px 12px}.cb-armes h3{grid-column:1/3;margin:0 0 4px;font-size:11px;letter-spacing:2px;color:var(--or);font-weight:normal}.cb-armes h3 em{color:var(--gr);font-style:normal;margin-left:6px;font-size:10px}
.cb-arm{display:grid;grid-template-columns:18px 1fr;gap:6px;font-size:11px;color:#cfd;align-items:center}.cb-arm b{color:var(--or);font-weight:normal;border:1px solid var(--or);border-radius:50%;width:15px;height:15px;display:inline-flex;align-items:center;justify-content:center;font-size:10px}
.cb-etat{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.cb-etat span{border:1px solid;padding:2px 8px;font-size:11px;letter-spacing:2px}.cb-etat .r{color:var(--rg)}.cb-etat .c{color:var(--cy)}.cb-etat .j{color:var(--jn)}.cb-etat .g{color:var(--gr)}
.cb-cible{min-height:min(560px,calc(var(--cmb-h, 100vh) - 220px));flex:1;position:relative;overflow:hidden;background:radial-gradient(circle at 50% 46%,rgba(255,59,48,.13),transparent 55%),repeating-linear-gradient(90deg,rgba(255,59,48,.045) 0 1px,transparent 1px 38px),repeating-linear-gradient(0deg,rgba(255,59,48,.045) 0 1px,transparent 1px 38px)}
.cb-cible.pvp{background:radial-gradient(circle at 50% 46%,rgba(255,215,0,.12),transparent 55%),repeating-linear-gradient(90deg,rgba(255,215,0,.04) 0 1px,transparent 1px 38px),repeating-linear-gradient(0deg,rgba(255,215,0,.04) 0 1px,transparent 1px 38px)}
.cb-scene{position:absolute;width:760px;height:540px;left:50%;top:50%;margin:-270px 0 0 -380px;transform-origin:center center}      /* centree meme quand le cadre est plus etroit que 760 px (tablette) : le centre de la scene reste au centre du cadre */
.cb-scene .fond{position:absolute;inset:0;width:100%;height:100%}.cb-scene .th2{position:absolute;left:210px;top:56px;width:340px;height:420px}.cb-scene .th2 svg{width:100%;height:100%}
.cb-bx{position:absolute;font-size:12px;line-height:1.45;background:rgba(2,6,8,.78);border:1px solid rgba(255,59,48,.55);padding:6px 10px;min-width:170px;max-width:300px}.cb-bx small{display:block;color:var(--gr);font-size:10px;letter-spacing:2px}.cb-bx small.s{letter-spacing:1px;margin-top:3px}
.cb-bx b{font-weight:normal;color:#fff;font-size:15px;letter-spacing:1px;white-space:normal;overflow-wrap:anywhere;line-height:1.25;display:block}.cb-bx.long b{font-size:13px;letter-spacing:.5px}.cb-bx.cy{border-color:rgba(0,240,255,.5)}.cb-bx.jn{border-color:rgba(255,215,0,.55)}.cb-bx.jn b{color:var(--jn)}.cb-bx.pvp{border-color:rgba(255,215,0,.6)}
.cb-bx .att{color:var(--gr);font-size:12px}.cb-bx .att:after{content:" ░▒▓";color:var(--rg);animation:cbcl 1s infinite}
.cb-bb{display:grid;grid-template-columns:1fr 52px;gap:6px;align-items:center;margin-top:4px}.cb-bb span{display:block;height:8px;background:rgba(255,255,255,.1);position:relative}.cb-bb i{position:absolute;left:0;top:0;bottom:0;transition:width .3s}.cb-bb b{font-size:13px;text-align:right}
.cb-aucune{position:absolute;left:0;right:0;top:230px;text-align:center;color:var(--gr);letter-spacing:4px;font-size:13px}.cb-aucune small{letter-spacing:1px;font-size:11px}
.cb-tag{position:absolute;left:14px;top:12px;font-size:11px;letter-spacing:3px;color:var(--rg);z-index:3}.cb-tag2{position:absolute;right:14px;top:12px;font-size:11px;letter-spacing:3px;color:var(--gr);text-align:right;z-index:3}
.cb-pied{position:absolute;left:0;right:0;bottom:10px;text-align:center;font-size:11px;letter-spacing:3px;color:var(--gr)}.cb-pied span{color:var(--jn)}
.cb-scan{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(255,59,48,.8),transparent);box-shadow:0 0 14px rgba(255,59,48,.7);animation:cbbal 4.5s linear infinite;top:60px;z-index:2}@keyframes cbbal{0%{top:50px}100%{top:540px}}
.cb-scene .rot{transform-origin:380px 275px;animation:cbrot 14s linear infinite}@keyframes cbrot{to{transform:rotate(360deg)}}
.cb-mort{display:none;position:absolute;inset:0;background:rgba(0,0,0,.35);z-index:4}.cb-cible.est-mort .cb-mort{display:block}.cb-cible.est-mort .cb-scan,.cb-cible.est-mort .cb-tag{display:none}.cb-cible.est-mort .cb-bx{opacity:.4}
.cb-mort svg{position:absolute;inset:0;width:100%;height:100%}.cb-mt{position:absolute;left:0;right:0;bottom:52px;text-align:center}.cb-mt b{display:block;color:var(--rg);letter-spacing:8px;font-size:22px;font-weight:normal;text-shadow:0 0 12px var(--rg)}.cb-mt span{color:var(--jn);font-size:20px}
.cb-chasse .liste{display:grid;grid-template-columns:1fr 1fr;gap:0 12px}.cb-l{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:9px;align-items:center;padding:7px 8px;border:1px solid var(--ln);margin-bottom:8px;position:relative;background:rgba(0,0,0,.35)}
.cb-l .th{width:44px;height:34px;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid var(--ln)}.cb-l .th img{height:34px;width:auto;transform:rotate(180deg);filter:grayscale(1) sepia(1) hue-rotate(155deg) saturate(3.2) brightness(.95);opacity:.8;mix-blend-mode:screen}.cb-l .th svg{width:34px;height:26px}
.cb-l .th .pt{width:14px;height:14px;border-radius:50%;display:block}.cb-l .th .pt.n{width:auto;height:auto;border-radius:0;color:var(--or);font-size:14px}
.cb-l .n{color:#fff;font-size:13px;line-height:1.25;min-width:0}.cb-l .n small{display:block;color:var(--gr);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cb-l .v{text-align:right;color:var(--jn);font-size:13px}.cb-l .v small{display:block;font-size:10px;letter-spacing:2px;color:var(--gr)}
.cb-l.mort{opacity:.62}.cb-l.mort .n{text-decoration:line-through;text-decoration-color:rgba(255,59,48,.7)}
.cb-l.mort:after{content:"";position:absolute;left:8px;top:8px;width:44px;height:34px;background:linear-gradient(to top right,transparent calc(50% - 1.5px),var(--rg) calc(50% - 1.5px),var(--rg) calc(50% + 1.5px),transparent calc(50% + 1.5px)),linear-gradient(to top left,transparent calc(50% - 1.5px),var(--rg) calc(50% - 1.5px),var(--rg) calc(50% + 1.5px),transparent calc(50% + 1.5px));filter:drop-shadow(0 0 4px var(--rg))}
.cb-l.mort .v small{color:var(--rg)}.cb-l.verrou{border-color:var(--rg);background:linear-gradient(90deg,rgba(255,59,48,.16),rgba(0,0,0,.2));box-shadow:0 0 14px rgba(255,59,48,.25)}.cb-l.verrou .v small{color:var(--rg)}.cb-l.vu{opacity:.85}
.cb-vide{color:var(--gr);font-size:12px;padding:6px 0}
@media (max-height:700px) and (min-width:1001px){.cb-moi:not(.pied) .cb-armes{display:none}}      /* petit ecran en hauteur : la liste de l'armement (visible au survol d'un point d'emport sur l'hologramme) cede la place pour que les 2 hologrammes tiennent */
.cb-vus .v{cursor:pointer;transition:filter .15s}.cb-vus .v:hover{filter:brightness(1.3)}.cb-vus .v:focus{outline:1px solid #fff;outline-offset:1px}
#cmb-modale{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.78);backdrop-filter:blur(3px);font-family:'Share Tech Mono',Consolas,monospace}
#cmb-modale .p{position:relative;width:min(760px,100%);max-height:92vh;overflow:auto;padding:22px 24px 20px;background:linear-gradient(180deg,color-mix(in srgb,var(--m) 12%,#050202),#050202);border:1px solid var(--m);box-shadow:0 0 40px color-mix(in srgb,var(--m) 35%,transparent);clip-path:polygon(0 0,calc(100% - 20px) 0,100% 20px,100% 100%,20px 100%,0 calc(100% - 20px))}
#cmb-modale .x{position:absolute;top:12px;right:14px;background:#000;border:1px solid var(--m);color:var(--m);width:32px;height:32px;cursor:pointer;font-size:15px}#cmb-modale .x:hover{background:var(--m);color:#000}
#cmb-modale .tt{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:14px;padding-right:44px}#cmb-modale .chip{border:1px solid var(--m);color:var(--m);padding:3px 12px;font-size:12px;letter-spacing:3px}#cmb-modale .tt small{color:#8b97a0;font-size:11px;letter-spacing:2px}
#cmb-modale .cr{display:grid;grid-template-columns:minmax(0,300px) minmax(0,1fr);gap:18px;align-items:center}#cmb-modale .h{background:radial-gradient(circle at 50% 50%,color-mix(in srgb,var(--m) 16%,transparent),rgba(0,0,0,.5));border:1px solid color-mix(in srgb,var(--m) 40%,transparent);padding:8px}#cmb-modale .h svg{display:block;width:100%;height:auto;max-height:340px}
#cmb-modale .d{display:grid;gap:9px}#cmb-modale .r small{display:block;color:#8b97a0;font-size:10px;letter-spacing:2px}#cmb-modale .r b{font-weight:normal;color:#fff;font-size:16px;letter-spacing:1px;overflow-wrap:anywhere}
#cmb-modale .rs{margin-top:16px;padding:10px 14px;border-left:3px solid var(--m);background:color-mix(in srgb,var(--m) 9%,transparent)}#cmb-modale .rs small{display:block;color:#8b97a0;font-size:10px;letter-spacing:2px}#cmb-modale .rs b{font-weight:normal;color:var(--m);font-size:15px}
@media (max-width:640px){#cmb-modale .cr{grid-template-columns:1fr}}
.cb-sonsbar{display:flex;justify-content:flex-end;gap:8px;margin:-4px 0 8px}.cb-sonsbar button{background:transparent;border:1px solid #3a4a52;color:#8b97a0;font:inherit;font-size:11px;letter-spacing:2px;padding:4px 12px;cursor:pointer}.cb-sonsbar button.on{border-color:rgba(0,240,255,.5);color:#00F0FF}.cb-sonsbar button:hover{background:rgba(0,240,255,.12);color:#fff}
.cb-tiers{grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}
.cb-tier2{position:relative;display:grid;grid-template-columns:78px minmax(0,1fr);gap:10px;align-items:center;padding:12px 14px 12px 10px;background:linear-gradient(135deg,color-mix(in srgb,var(--c) 15%,transparent),rgba(0,0,0,.42) 62%);border:1px solid color-mix(in srgb,var(--c) 55%,transparent);clip-path:polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,16px 100%,0 calc(100% - 16px));box-shadow:inset 0 0 26px color-mix(in srgb,var(--c) 10%,transparent)}
.cb-tier2:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--c);box-shadow:0 0 12px var(--c)}
.cb-tier2.vide{opacity:.45}.cb-tier2 .bu{filter:drop-shadow(0 0 8px color-mix(in srgb,var(--c) 60%,transparent))}.cb-tier2 .bu svg{display:block}
.cb-tier2 .top{display:flex;flex-wrap:wrap;gap:3px 9px;align-items:center}.cb-tier2 .chip{border:1px solid var(--c);color:var(--c);font-size:10px;letter-spacing:2px;padding:1px 8px;text-transform:uppercase;white-space:nowrap}.cb-tier2 .top small{color:var(--gr);font-size:10.5px}
.cb-tier2 .big{display:flex;align-items:baseline;gap:8px;margin-top:5px}.cb-tier2 .big b{font-weight:normal;color:#fff;font-size:30px;line-height:1;letter-spacing:1px;text-shadow:0 0 14px color-mix(in srgb,var(--c) 70%,transparent)}.cb-tier2 .big span{color:var(--gr);font-size:11px;letter-spacing:1px}
.cb-tier2 .bar{height:5px;background:rgba(255,255,255,.08);margin:6px 0 7px}.cb-tier2 .bar i{display:block;height:100%;background:linear-gradient(90deg,color-mix(in srgb,var(--c) 45%,transparent),var(--c));box-shadow:0 0 8px var(--c)}
.cb-tier2 .cr{display:flex;align-items:baseline;gap:8px}.cb-tier2 .cr b{font-weight:normal;color:var(--jn);font-size:19px;letter-spacing:1px;white-space:nowrap}.cb-tier2 .cr span{color:var(--gr);font-size:10px;letter-spacing:1px;white-space:nowrap}
.cb-tier2 .mini{color:var(--gr);font-size:10.5px;margin-top:3px;line-height:1.35}.cb-tier2 .mini b{font-weight:normal;color:#e6f4f0}
.cb-3 .cb-tier2{grid-template-columns:64px minmax(0,1fr);padding:8px 10px 8px 8px}.cb-3 .cb-tier2 .bu svg{width:64px;height:70px}.cb-3 .cb-tier2 .big b{font-size:24px}.cb-3 .cb-tiers{grid-template-columns:repeat(auto-fit,minmax(210px,1fr))}
#cmb-rowB > #cmb-chasse{min-height:300px;display:flex;flex-direction:column;box-sizing:border-box}
#cmb-rowB > #cmb-session{contain:size;overflow:hidden;display:flex;flex-direction:column;box-sizing:border-box}   /* la session prend la hauteur du tableau de chasse (liste qui defile) au lieu de l'imposer */
#cmb-rowB > #cmb-chasse > .liste{flex:0 1 auto}
#cmb-rowB > #cmb-session > .cb-tl{flex:1 1 0;min-height:0;max-height:none;overflow-y:auto;padding-right:8px;scrollbar-width:thin;scrollbar-color:rgba(0,240,255,.45) rgba(255,255,255,.04)}
#cmb-rowB > #cmb-chasse > .cb-seg,#cmb-rowB > #cmb-chasse > .cb-tiers,#cmb-rowB > #cmb-chasse > .cb-kpi,#cmb-rowB > #cmb-chasse > .cb-res{flex:none}
#cmb-rowB > #cmb-chasse > .pied{flex:none}
@media (max-width:1000px){#cmb-rowB > #cmb-session{contain:none;height:auto}#cmb-rowB > #cmb-session > .cb-tl{max-height:420px}}
.cb-res{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 12px}.cb-res>div{border:1px solid var(--ln);background:rgba(0,0,0,.35);padding:6px 10px}.cb-res small{display:block;color:var(--gr);font-size:10px;letter-spacing:2px}.cb-res b{font-weight:normal;color:#fff;font-size:20px;letter-spacing:1px;white-space:nowrap}.cb-res b.j{color:var(--jn)}
.cb-k{display:grid;grid-template-columns:54px minmax(0,1fr) auto;gap:11px;align-items:center;padding:9px 10px 9px 12px;border:1px solid var(--ln);border-left:4px solid var(--c);margin-bottom:8px;position:relative;background:linear-gradient(90deg,color-mix(in srgb,var(--c) 10%,transparent),rgba(0,0,0,.35) 60%)}
.cb-k .th{width:54px;height:44px;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid var(--ln);background:rgba(0,0,0,.4)}.cb-k .th img{height:44px;width:auto;transform:rotate(180deg);filter:grayscale(1) sepia(1) hue-rotate(155deg) saturate(3.2) brightness(.95);opacity:.8;mix-blend-mode:screen}.cb-k .th svg{width:40px;height:30px}
.cb-k .n{color:#fff;font-size:15px;line-height:1.25;min-width:0}.cb-k .n small{display:block;color:var(--gr);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cb-k .pl{display:inline-block;margin-top:4px;border:1px solid var(--c);color:var(--c);font-size:10px;letter-spacing:2px;padding:1px 7px}
.cb-k .v{text-align:right;white-space:nowrap}.cb-k .v b{display:block;font-weight:normal;color:var(--jn);font-size:19px;letter-spacing:1px}.cb-k .v small{display:block;font-size:10px;letter-spacing:2px;color:var(--gr);margin-top:2px}
.cb-k.mort .n{text-decoration:line-through;text-decoration-color:rgba(255,59,48,.55)}.cb-k.mort .th{opacity:.7}.cb-k.mort .v small{color:var(--rg)}
.cb-k.verrou{border-color:var(--rg);border-left-color:var(--rg);background:linear-gradient(90deg,rgba(255,59,48,.18),rgba(0,0,0,.25));box-shadow:0 0 14px rgba(255,59,48,.25)}.cb-k.verrou .pl{border-color:var(--rg);color:var(--rg)}.cb-k.verrou .v small{color:var(--rg)}
.cb-vus{margin:0;padding:10px 16px 14px;border-top:1px dashed var(--ln)}.cb-vus .t{color:var(--gr);font-size:11px;letter-spacing:2px;margin-bottom:8px}.cb-vus .t em{font-style:normal;color:var(--or);margin-left:6px}
.cb-vus .g{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}.cb-vus .v{display:grid;grid-template-columns:44px minmax(0,1fr);grid-template-rows:auto auto;column-gap:9px;align-items:center;border:1px solid rgba(255,154,31,.35);background:rgba(255,154,31,.05);padding:6px 8px}
.cb-vus .v img,.cb-vus .v svg{grid-row:1/3;width:44px;height:36px;object-fit:contain;transform:rotate(180deg);filter:grayscale(1) sepia(1) hue-rotate(5deg) saturate(3.5) brightness(.95);opacity:.85;mix-blend-mode:screen}.cb-vus .v svg{transform:none;filter:none;mix-blend-mode:normal}
.cb-vus .v b{font-weight:normal;color:#fff;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cb-vus .v small{color:var(--gr);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cb-k{--c:#FF3B30;grid-template-columns:96px minmax(0,1fr) auto;padding:8px 12px 8px 8px;background:linear-gradient(90deg,rgba(255,59,48,.16),rgba(40,0,0,.42) 65%);border-color:rgba(255,59,48,.45);border-left-color:#FF3B30}
.cb-k .th{width:96px;height:78px;position:relative;border-color:rgba(255,59,48,.4);background:radial-gradient(circle at 50% 50%,rgba(255,59,48,.14),rgba(0,0,0,.5))}.cb-k .th svg{width:100%;height:100%;display:block}
.cb-k.mort .th{opacity:1}.cb-k.mort .th svg{opacity:.5}
.cb-k.mort .th:after{content:"";position:absolute;inset:3px;pointer-events:none;background:linear-gradient(to top right,transparent calc(50% - 2.5px),#FF3B30 calc(50% - 2.5px),#FF3B30 calc(50% + 2.5px),transparent calc(50% + 2.5px)),linear-gradient(to top left,transparent calc(50% - 2.5px),#FF3B30 calc(50% - 2.5px),#FF3B30 calc(50% + 2.5px),transparent calc(50% + 2.5px));filter:drop-shadow(0 0 6px #FF3B30)}
.cb-k.mort .n{text-decoration:none}.cb-k{grid-template-columns:70px minmax(0,1fr);grid-template-rows:auto auto;column-gap:10px;row-gap:2px;align-items:center}.cb-k .th{grid-row:1/3;width:70px;height:58px}.cb-k .n{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}.cb-k .n .pl{white-space:nowrap}.cb-k .v{grid-column:2;display:flex;justify-content:space-between;align-items:baseline;gap:8px;text-align:left}.cb-k .v b{display:inline;font-size:16px}.cb-k .v small{display:inline;margin:0;text-align:right;font-size:9px;letter-spacing:1px;white-space:nowrap}.cb-k .v{min-width:0}.cb-k .v b{font-size:15px;white-space:nowrap}.cb-k .pb{color:#FFD54A;font-size:.85em;cursor:help;margin-left:3px}.cb-k .pl{border-color:rgba(255,59,48,.7);color:#FF8A80}
.cb-k .v b{color:#FFD54A}.cb-k.mort .v small{color:#FF5A4D}
.cb-k.verrou .th svg{opacity:1}
.cb-vus .g{grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}
.cb-vus .v{grid-template-columns:130px minmax(0,1fr);column-gap:12px;padding:8px 10px;border-color:rgba(255,59,48,.4);background:linear-gradient(90deg,rgba(255,59,48,.1),rgba(0,0,0,.3))}
.cb-vus .v .h{width:130px;height:104px;background:radial-gradient(circle at 50% 50%,rgba(255,59,48,.14),rgba(0,0,0,.45));border:1px solid rgba(255,59,48,.3)}.cb-vus .v .h svg{width:100%;height:100%;display:block}
.cb-vus .v .x{min-width:0;display:flex;flex-direction:column;gap:3px}.cb-vus .v b{font-size:14px;letter-spacing:1px}.cb-vus .v small{font-size:12px}.cb-vus .v small.rg{color:#FF8A80;letter-spacing:2px;font-size:11px}
.cb .cb-chasse .liste,.cb .cb-3 .liste{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0 10px;max-height:228px;overflow-y:auto;padding-right:6px;align-content:start;scrollbar-width:thin;scrollbar-color:rgba(255,59,48,.55) rgba(255,255,255,.04)}
.cb .cb-chasse .liste::-webkit-scrollbar,.cb .cb-3 .liste::-webkit-scrollbar{width:7px}.cb .cb-chasse .liste::-webkit-scrollbar-track,.cb .cb-3 .liste::-webkit-scrollbar-track{background:rgba(255,255,255,.04)}.cb .cb-chasse .liste::-webkit-scrollbar-thumb,.cb .cb-3 .liste::-webkit-scrollbar-thumb{background:rgba(255,59,48,.55);border-radius:3px}
.cb-k{grid-template-columns:78px minmax(0,1fr) auto;gap:9px;padding:6px 9px 6px 6px;margin-bottom:8px}.cb-k .th{width:78px;height:64px}.cb-k .n{font-size:14px}.cb-k .n small{font-size:11px}.cb-k .v b{font-size:16px}.cb-k .pl{font-size:9px;letter-spacing:1px;padding:0 5px;white-space:nowrap}
.cb-vus .g{display:flex;flex-wrap:nowrap;gap:8px}.cb-vus .v{flex:1 1 0;min-width:0;max-width:430px;grid-template-columns:minmax(0,44%) minmax(0,1fr);column-gap:12px;padding:8px 12px}
.cb-vus .g{height:98px}.cb-vus .v{height:98px;box-sizing:border-box}.cb-vus .v .h{width:100%;height:82px;aspect-ratio:auto}.cb-vus .v .h svg{width:100%;height:100%}.cb-vus .vide{flex:1;display:flex;align-items:center;justify-content:center;border:1px dashed rgba(255,255,255,.18);color:var(--gr);font-size:12px;letter-spacing:1px;height:98px;box-sizing:border-box}.cb-vus .v .x{min-width:0;overflow:hidden}.cb-vus .v b,.cb-vus .v small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}.cb-vus .t .lg{float:right;letter-spacing:1px;text-transform:uppercase;font-size:10px}.cb-vus .t .lg i{display:inline-block;width:9px;height:9px;margin:0 4px 0 12px;border-radius:50%;vertical-align:middle}.cb-vus .lg .lr{background:#FF3B30}.cb-vus .lg .lv{background:#00FF66}.cb-vus .lg .lb{background:#3D8BFF}
.cb-vus .v.tv{border-color:rgba(0,255,102,.45);background:linear-gradient(90deg,rgba(0,255,102,.1),rgba(0,0,0,.3))}.cb-vus .v.tv .h{border-color:rgba(0,255,102,.35);background:radial-gradient(circle at 50% 50%,rgba(0,255,102,.14),rgba(0,0,0,.45))}.cb-vus .v.tv small.rg{color:#7dffb0}
.cb-vus .v.tb{border-color:rgba(61,139,255,.5);background:linear-gradient(90deg,rgba(61,139,255,.1),rgba(0,0,0,.3))}.cb-vus .v.tb .h{border-color:rgba(61,139,255,.4);background:radial-gradient(circle at 50% 50%,rgba(61,139,255,.16),rgba(0,0,0,.45))}.cb-vus .v.tb small.rg{color:#8db8ff}
.cb-vus .v b{font-size:clamp(13px,1.15vw,18px);letter-spacing:1px}.cb-vus .v small{font-size:clamp(11px,.95vw,14px)}.cb-vus .v small.rg{font-size:clamp(11px,.9vw,13px)}
.cb-bx .att{color:var(--rg);font-size:13px;letter-spacing:2px}.cb-bx .att:after{content:none}
.cb-men .seg{display:flex;gap:4px;margin:5px 0 3px;justify-content:flex-end}.cb-men .seg i{display:block;width:34px;height:7px;background:rgba(255,255,255,.1)}
.cb-stamp{position:absolute;left:226px;top:408px;z-index:3;transform:rotate(-13deg);border:3px solid #FF3B30;color:#FF3B30;padding:2px 16px 3px;text-align:center;background:rgba(40,0,0,.5);box-shadow:0 0 18px rgba(255,59,48,.55),inset 0 0 12px rgba(255,59,48,.25);animation:cbStamp .55s cubic-bezier(.2,1.4,.4,1) both;pointer-events:none}
.cb-stamp b{display:block;font-weight:bold;font-size:28px;letter-spacing:8px;line-height:1.15;color:#FF3B30;text-shadow:0 0 10px rgba(255,59,48,.8)}.cb-stamp small{display:block;font-size:11px;letter-spacing:3px;color:#FFB4AC}
@keyframes cbStamp{from{opacity:0;transform:rotate(-13deg) scale(2.6)}to{opacity:1;transform:rotate(-13deg) scale(1)}}
.cb-acq{position:absolute;left:0;right:0;top:44%;text-align:center;opacity:0;pointer-events:none;z-index:5}.cb-acq b{display:inline-block;font-weight:bold;font-size:30px;letter-spacing:10px;color:#FF3B30;padding:6px 22px;border-top:2px solid #FF3B30;border-bottom:2px solid #FF3B30;background:rgba(0,0,0,.55);text-shadow:0 0 14px #FF3B30}
.cb-cible.acq .cb-acq{animation:cbAcqT 1.6s ease-out}
@keyframes cbAcqT{0%{opacity:0;transform:scale(1.7)}15%{opacity:1;transform:scale(1)}72%{opacity:1}100%{opacity:0}}
.cb-cible.acq:before{content:"";position:absolute;inset:0;z-index:3;pointer-events:none;background:radial-gradient(circle at 50% 46%,rgba(255,59,48,.5),transparent 62%);animation:cbFl .9s ease-out both}
@keyframes cbFl{from{opacity:1}to{opacity:0}}
.cb-sweep{transform-origin:380px 275px;animation:cbSw 6s linear infinite}@keyframes cbSw{to{transform:rotate(360deg)}}
.cb-blip{opacity:.4;animation:cbBlip 6s linear infinite}@keyframes cbBlip{0%{opacity:1}35%{opacity:.4}100%{opacity:.4}}
@media (prefers-reduced-motion:reduce){.cb-sweep,.cb-blip{animation:none}}
.cb-cible.acq .cb-br{transform-origin:380px 275px;animation:cbBr .9s cubic-bezier(.2,.8,.2,1)}
@keyframes cbBr{from{transform:scale(2);opacity:0}to{transform:scale(1);opacity:1}}
.cb-bleu{--bdc:rgba(61,139,255,.75);--teinte:rgba(61,139,255,.07);--lueur:rgba(61,139,255,.08);--accent:#3D8BFF}
.cb-cible.tv{background:radial-gradient(circle at 50% 46%,rgba(0,255,102,.13),transparent 55%),repeating-linear-gradient(90deg,rgba(0,255,102,.045) 0 1px,transparent 1px 38px),repeating-linear-gradient(0deg,rgba(0,255,102,.045) 0 1px,transparent 1px 38px)}
.cb-cible.tb{background:radial-gradient(circle at 50% 46%,rgba(61,139,255,.14),transparent 55%),repeating-linear-gradient(90deg,rgba(61,139,255,.05) 0 1px,transparent 1px 38px),repeating-linear-gradient(0deg,rgba(61,139,255,.05) 0 1px,transparent 1px 38px)}
.cb-cible.tv .cb-bx{border-color:rgba(0,255,102,.55)}.cb-cible.tb .cb-bx{border-color:rgba(61,139,255,.6)}
.cb-cible.tv .cb-tag{color:#00FF66;font-weight:bold}.cb-cible.tb .cb-tag{color:#6FA8FF}
.cb-cible.tv .cb-scan{background:linear-gradient(90deg,transparent,rgba(0,255,102,.8),transparent);box-shadow:0 0 14px rgba(0,255,102,.7)}.cb-cible.tb .cb-scan{background:linear-gradient(90deg,transparent,rgba(61,139,255,.85),transparent);box-shadow:0 0 14px rgba(61,139,255,.7)}
.cb-cible.tv .cb-acq b{color:#00FF66;border-color:#00FF66;text-shadow:0 0 14px #00FF66}.cb-cible.tv.acq:before{background:radial-gradient(circle at 50% 46%,rgba(0,255,102,.5),transparent 62%)}
.cb-cible.tb .cb-bx .att{color:#6FA8FF}.cb-cible.tv .cb-bx .att{color:#7dffb0}
.cb-k.verrou.tv{border-color:rgba(0,255,102,.6);border-left-color:#00FF66;background:linear-gradient(90deg,rgba(0,255,102,.16),rgba(0,0,0,.25));box-shadow:0 0 14px rgba(0,255,102,.25)}.cb-k.verrou.tv .pl,.cb-k.verrou.tv .v small{border-color:#00FF66;color:#00FF66}
.cb-k.verrou.tb{border-color:rgba(61,139,255,.6);border-left-color:#3D8BFF;background:linear-gradient(90deg,rgba(61,139,255,.16),rgba(0,0,0,.25));box-shadow:0 0 14px rgba(61,139,255,.25)}.cb-k.verrou.tb .pl,.cb-k.verrou.tb .v small{border-color:#3D8BFF;color:#6FA8FF}
@media (max-width:1400px){.cb .cb-chasse .liste,.cb .cb-3 .liste{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:1000px){.cb .cb-chasse .liste,.cb .cb-3 .liste{grid-template-columns:1fr}.cb-vus .g{flex-wrap:wrap}.cb-vus .v{flex:1 1 150px}}
@media (prefers-reduced-motion:reduce){.cb-stamp,.cb-cible.acq .cb-acq,.cb-cible.acq:before,.cb-cible.acq .cb-br{animation:none}}
@media (max-width:1000px){.cb-res{grid-template-columns:repeat(2,minmax(0,1fr))}}
.cb-3 .liste{display:grid;grid-template-columns:1fr 1fr;gap:0 12px}@media (max-width:1000px){.cb-3 .liste{grid-template-columns:1fr}}
.cb-3{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:22px}.cb-3>div{min-width:0;display:flex;flex-direction:column}.cb-3 .cb-tiers{flex:1;margin-bottom:10px}.cb-3 .cb-tier{align-content:center}.cb-3 .cb-rythme{flex:1;display:flex;flex-direction:column;margin:2px 0 0}.cb-3 .cb-rythme .t{display:none}.cb-3 .cb-rythme svg{flex:1;height:auto;min-height:64px}.cb-3 .cb-chips{grid-template-columns:repeat(2,minmax(0,1fr));margin-bottom:12px}.cb-3>div:last-child{overflow:hidden}.cb-3 .cb-tl{flex:1 1 0;min-height:0;max-height:340px;overflow-y:auto;padding-right:8px;scrollbar-width:thin;scrollbar-color:rgba(0,240,255,.45) rgba(255,255,255,.04)}.cb-3 .cb-tl::-webkit-scrollbar{width:6px}.cb-3 .cb-tl::-webkit-scrollbar-track{background:rgba(255,255,255,.04)}.cb-3 .cb-tl::-webkit-scrollbar-thumb{background:rgba(0,240,255,.45);border-radius:3px}.cb-3 .cb-tl:before{bottom:12px}
.cb-rythme{position:relative}.cb-tot{position:absolute;left:10px;top:6px;z-index:2;pointer-events:none}.cb-tot small{display:block;color:var(--gr);font-size:10px;letter-spacing:2px}.cb-tot b{font-weight:normal;color:var(--jn);font-size:16px;letter-spacing:1px;text-shadow:0 0 6px rgba(0,0,0,.8)}.cb-3 .cb-kpi{margin-bottom:8px}.cb-3 .cb-kpi b{font-size:15px;white-space:nowrap}.cb-3 .liste .cb-l{margin-bottom:6px}.cb-3>div+div{border-left:1px solid rgba(255,255,255,.07);padding-left:22px}.cb-3 .cb-tier{padding:6px 9px}.cb-3 .cb-seg{height:24px;margin:2px 0 8px}.cb-3 .cb-tl .cb-ti{margin-bottom:5px}
.cb-3 .pied{color:var(--gr);font-size:12px;margin-top:auto;padding-top:4px;line-height:1.55}
.cb-sub{margin:0 0 10px;font-size:11px;letter-spacing:3px;color:#888;font-weight:normal;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}.cb-sub em{font-style:normal;color:#666;letter-spacing:1px}
@media (max-width:1000px){.cb-3{grid-template-columns:1fr}.cb-3>div+div{border-left:0;padding-left:0}}
.cb-seg{display:flex;height:30px;border:1px solid rgba(255,255,255,.12);margin:4px 0 12px;box-shadow:inset 0 0 14px rgba(0,0,0,.6)}.cb-seg span{display:flex;align-items:center;justify-content:center;min-width:26px;position:relative;box-shadow:inset -1px 0 0 rgba(0,0,0,.55)}.cb-seg b{font-weight:normal;color:#04090c;font-size:13px;letter-spacing:1px;text-shadow:0 0 2px rgba(255,255,255,.4)}
.cb-tiers{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:12px}.cb-tier{border:1px solid color-mix(in srgb,var(--c) 45%,transparent);background:linear-gradient(180deg,color-mix(in srgb,var(--c) 11%,transparent),rgba(0,0,0,.35));padding:9px 11px;display:grid;grid-template-columns:auto 1fr;gap:2px 10px;align-items:center;position:relative}.cb-tier:before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--c);box-shadow:0 0 8px var(--c)}
.cb-tier.vide{opacity:.45}.cb-tier .ic{grid-row:1/3;filter:drop-shadow(0 0 4px var(--c))}.cb-tier .n{display:flex;align-items:baseline;gap:8px}.cb-tier .n b{font-weight:normal;color:#fff;font-size:24px;line-height:1}.cb-tier .n span{color:var(--gr);font-size:12px}
.cb-tier .l{color:#e6f4f0;font-size:12px;line-height:1.3}.cb-tier .l small{display:block;color:var(--gr);font-size:10px}.cb-tier .cr{grid-column:2;color:var(--jn);font-size:12px}
.cb-kpi{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:12px}.cb-kpi>div{border-top:1px solid var(--ln);padding-top:6px}.cb-kpi small{display:block;color:var(--gr);font-size:10px;letter-spacing:2px}.cb-kpi b{font-weight:normal;color:#fff;font-size:17px;letter-spacing:1px}
.cb-rythme{margin:6px 0 10px}.cb-rythme .t{display:flex;flex-wrap:wrap;gap:4px 12px;align-items:baseline;font-size:11px;letter-spacing:2px;color:var(--gr);margin-bottom:4px}.cb-rythme .t em{font-style:normal;letter-spacing:1px;color:#5d6870}.cb-rythme .t b{margin-left:auto;font-weight:normal;color:var(--jn);letter-spacing:1px}.cb-axe{display:flex;justify-content:space-between;font-size:11px;color:var(--gr);margin-top:3px}.cb-rythme svg{width:100%;height:84px;display:block;background:linear-gradient(180deg,rgba(255,59,48,.05),transparent)}
.cb-chips{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:14px}.cb-chips>div{border:1px solid rgba(0,240,255,.25);background:rgba(0,240,255,.05);padding:6px 9px}.cb-chips small{display:block;color:var(--gr);font-size:10px;letter-spacing:2px}.cb-chips b{font-weight:normal;color:#fff;font-size:17px}.cb-chips b span{color:var(--gr);font-size:11px}
.cb-tl{position:relative;padding-left:6px}.cb-rowB .cb-tl{max-height:420px;overflow-y:auto;padding-right:6px}.cb-tl:before{content:"";position:absolute;left:19px;top:6px;bottom:6px;width:2px;background:linear-gradient(180deg,rgba(0,240,255,.6),rgba(0,240,255,.05))}
.cb-ti{display:grid;grid-template-columns:28px 1fr;gap:10px;align-items:center;margin:0 0 8px;position:relative}.cb-ti i{width:26px;height:26px;border-radius:50%;border:1px solid var(--c);background:#04090c;color:var(--c);display:flex;align-items:center;justify-content:center;font-style:normal;font-size:12px;box-shadow:0 0 10px color-mix(in srgb,var(--c) 55%,transparent);position:relative;z-index:1}
.cb-ti .c time{display:block;color:var(--gr);font-size:11px;letter-spacing:1px}.cb-ti .c time span{margin-left:8px;color:#5d6870}.cb-ti .c b{font-weight:normal;color:#e6f4f0;font-size:13px}.cb-chasse .pied{color:var(--gr);font-size:12px;margin-top:6px;line-height:1.55}
.cb-log{font-size:13px;line-height:1.75}.cb-log div{display:grid;grid-template-columns:56px 20px 1fr;gap:6px;border-top:1px dashed var(--ln);padding:2px 0}.cb-log div:first-child{border-top:0}.cb-log time{color:var(--gr)}
.cb-vict{position:relative;min-height:clamp(380px,calc(var(--cmb-h, 100vh) - 150px),560px);flex:1;overflow:hidden;background:radial-gradient(circle at 50% 50%,rgba(255,59,48,.12),transparent 62%),repeating-linear-gradient(90deg,rgba(255,59,48,.04) 0 1px,transparent 1px 38px),repeating-linear-gradient(0deg,rgba(255,59,48,.04) 0 1px,transparent 1px 38px)}
.cb-vict .gv{position:absolute;left:14px;right:14px;top:46px;bottom:14px;display:flex;flex-wrap:wrap;align-content:flex-start;justify-content:center}
.cb-vict .leg{position:absolute;right:14px;top:12px;font-size:11px;letter-spacing:2px;color:var(--gr);text-align:right}.cb-vict .leg i{display:inline-block;width:9px;height:9px;margin-right:5px;vertical-align:-1px}
.cb-v1{position:relative;text-align:center;line-height:1.1}.cb-v1 svg{display:block;margin:0 auto}.cb-v1 small{display:block;color:var(--gr);font-size:10px;margin-top:2px;white-space:nowrap}.cb-v1 b{display:block;font-weight:normal;color:var(--jn);font-size:11px;white-space:nowrap}.cb-v1 .etoile{position:absolute;right:12%;top:0;color:#B28DFF;text-shadow:0 0 8px #B28DFF}
.cb-zc.veille{border-color:rgba(139,151,160,.5);background:linear-gradient(90deg,rgba(139,151,160,.12),rgba(0,0,0,0) 60%)}.cb-zc.veille:before,.cb-zc.veille:after{border-color:var(--gr)}.cb-zc.veille .al{color:var(--gr);animation:none}.cb-zc.veille .vs{color:var(--gr);letter-spacing:1px}
.cb.veille .cb-rowB{opacity:.9}.cb-note{color:var(--gr);font-size:12px;line-height:1.5;margin-top:10px;border-left:3px solid var(--cy);padding:6px 10px;background:rgba(0,240,255,.05)}
.cb-attente{text-align:center;padding:60px 20px;color:var(--gr);letter-spacing:3px}.cb-attente b{display:block;color:#fff;font-weight:normal;font-size:18px;letter-spacing:6px;margin-bottom:12px}
@media (max-width:1000px){.cb-rowA,.cb-rowB{grid-template-columns:1fr}.cb-stats{grid-template-columns:repeat(3,minmax(0,1fr))}.cb-zc{grid-template-columns:1fr}.cb-chasse .liste{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){.cb-zc .al,.cb-scan,.cb-scene .rot{animation:none}}
</style>`;

    function squelette() {
        return CSS + `<div class="cb" id="cmb">
<div class="cb-sonsbar"><button type="button" id="cmb-croises-btn" style="display:none" onclick="JCroises.ouvrir()" title="Historique des joueurs que l’escadron a verrouillés en jeu"></button><button type="button" id="cmb-sons-btn" onclick="combatSons()" title="Sons du combat : décryptage, acquisition de cible, voix du capitaine à chaque élimination. Le bouton ♪ AMBIANCE du tableau de bord les coupe aussi."></button></div><div id="cmb-bandeau"></div><div id="cmb-bandes"></div><div class="cb-stats" id="cmb-stats"></div>
<div class="cb-rowA" id="cmb-rowA">
  <div class="bloc holo cb-moi" id="cmb-moi"><h2 id="cmb-moi-t">VOTRE VAISSEAU</h2><div class="cb-hol" id="cmb-holo-moi"></div><div id="cmb-moi-b"></div></div>
  <div id="cmb-droite" style="display:flex;flex-direction:column"></div>
</div>
<div class="cb-rowB" id="cmb-rowB"><div class="bloc rouge cb-chasse" id="cmb-chasse"></div><div class="bloc cy" id="cmb-session"></div><div class="bloc rouge" id="cmb-dernier" style="display:none;grid-column:1/-1"></div></div></div>`;
    }
    function droiteSquelette(pied) {
        if (pied) return `<div class="bloc rouge" style="padding:0;display:flex;flex-direction:column;flex:1"><h2 style="padding:14px 16px 0">ENNEMIS ÉLIMINÉS <em>un personnage par ennemi · l’échelle s’adapte au nombre</em></h2><div class="cb-vict"><div class="cb-tag">◉ COMBAT AU SOL</div><div class="leg"><i style="background:#8b97a0"></i>faible &nbsp;<i style="background:#FF9A1F"></i>moyen &nbsp;<i style="background:#FFD700"></i>élevé<br><span style="letter-spacing:1px">survol : détail de l’ennemi</span></div><div class="gv" id="cmb-gv"></div></div></div>`;
        return `<div class="bloc rouge" id="cmb-cible-bloc" style="padding:0;display:flex;flex-direction:column;flex:1"><h2 style="padding:14px 16px 0" id="cmb-cible-t">CIBLE VERROUILLÉE</h2><div class="cb-cible" id="cmb-cible"><div class="cb-tag" id="cmb-tag">◉ VERROUILLAGE ACTIF</div><div class="cb-tag2" id="cmb-tag2"></div><div class="cb-scan"></div><div class="cb-mort" id="cmb-mort"></div><div class="cb-acq" id="cmb-acq"><b>CIBLE ACQUISE</b></div>
<div class="cb-scene" id="cmb-scene"><div class="th2" id="cmb-holo-cible"></div><div id="cmb-fond"></div><div id="cmb-bx"></div></div><div class="cb-pied" id="cmb-pied"></div></div><div id="cmb-vus"></div></div>`;
    }
    function maj(id, html) {
        const el = document.getElementById(id); if (!el) return null;
        if (el.__h !== html) { el.innerHTML = html; el.__h = html; }
        return el;
    }
    // hauteur reellement visible pour les blocs (la zone de defilement, sous l'en-tete du site) : variable CSS --cmb-h
    function hauteurs() { const z = document.getElementById("display-area"), c = document.getElementById("cmb"); if (!c) return window.innerHeight; const h = (z && z.clientHeight) || window.innerHeight; c.style.setProperty("--cmb-h", h + "px"); return h; }
    function echelle() {
        const sc = document.getElementById("cmb-scene"), ci = document.getElementById("cmb-cible"); if (!sc || !ci) return;
        const hz = hauteurs();
        // largeur ET hauteur : la rangee des hologrammes (titre ~50 + scene + pied ~45 + ligne des vaisseaux verrouilles 144) doit tenir dans la fenetre
        const vus = document.getElementById("cmb-vus"), reste = (vus ? vus.offsetHeight : 144) + 50 + 45 + 16, kh = (hz - reste) / 540;
        const k = Math.min(1, (ci.clientWidth || 760) / 760, Math.max(0.42, kh));
        sc.style.transform = k < 1 ? `scale(${k})` : "";
        ci.style.minHeight = k < 1 ? Math.round(540 * k + 24) + "px" : "";
    }

    // un onglet sans combat n'est pas vide : l'hologramme du pilote (vaisseau ou combinaison, selon CE QU'IL FAIT MAINTENANT), « en attente » et le recapitulatif du dernier combat
    const VIDE = { actif: false, vide: true, mode: "secu", kills: [], jr: [], vus: [], miss: [], moi: {}, nb: 0, t0: 0, pend: [0, 0], vic: [], duels: [0, 0] };
    function posture(e) { const actif = !!(e && e.actif), pOn = !!(S && S.pied && S.pied.on); return { actif, pOn, droitePied: actif ? !!e.pied : pOn }; }
    function bandeauVeille(e) {
        const attente = `<span class="al">○ AUCUN COMBAT EN COURS</span><div class="nom">EN ATTENTE<small>cet onglet s’ouvrira tout seul dès qu’un combat commencera</small></div>`;
        if (e.vide) return `<div class="cb-zc veille">${attente}<div class="vs"><span>Primes, zones de conflit, joueurs et combats au sol sont reconnus automatiquement.</span></div></div>`;
        const mode = { guerre: "Guerre", pvp: "PvP", secu: "Sécurité" }[modeDe(e)] || "Combat", age = Math.max(0, (Date.now() - new Date(e.maj || 0).getTime()) / 1000);
        const lieu = e.lieu || e.sys || "";
        return `<div class="cb-zc veille">${attente}<div class="vs"><span>Dernier combat : ${mode}${e.pied ? " à pied" : ""} · ${E(lieu)} · ${e.nb || 0} éliminés · il y a ${typeof duree === "function" ? duree(age) : Math.round(age / 60) + " min"}</span></div></div>`;
    }
    // dernier rapport de chaque posture (navigateur, par pilote) : en vaisseau on revoit le dernier combat en vaisseau, a pied le dernier au sol
    const cleMem = p => "edteam_cmb_der_" + (typeof uid !== "undefined" ? uid : "x") + "_" + (p ? "sol" : "vol");
    function memLire(p) { try { const v = JSON.parse(localStorage.getItem(cleMem(p)) || "null"); return v && typeof v === "object" ? v : null; } catch (x) { return null; } }
    function memEcrire(e) { try { if (e && !e.vide && (e.nb > 0 || (e.kills || []).length || e.cible)) localStorage.setItem(cleMem(!!e.pied), JSON.stringify(e)); } catch (x) { /* stockage indisponible : le rapport ne sera pas garde */ } }
    function effectif() {
        const raw = CB.etat || VIDE, pOn = !!(typeof S !== "undefined" && S && S.pied && S.pied.on);
        if (raw.actif && !!raw.pied === pOn) return raw;                         // combat en cours dans la posture actuelle
        if (!raw.vide && !raw.actif && !!raw.pied === pOn) return raw;           // dernier rapport, meme posture
        const m = memLire(pOn);
        return m ? Object.assign({}, m, { actif: false }) : VIDE;                // dernier rapport de CETTE posture, sinon rien
    }
    // interrupteur « sons du combat » (en plus du bouton ♪ du tableau de bord)
    function sonsEtiquette() { const b = document.getElementById("cmb-sons-btn"); if (!b) return; let on = true; try { on = localStorage.getItem("edteam_cmb_sons") !== "0"; } catch (x) {} b.className = on ? "on" : ""; b.textContent = (on ? "🔊" : "🔇") + " SONS DU COMBAT : " + (on ? "ACTIFS" : "COUPÉS"); }
    window.combatSons = function () { let on = true; try { on = localStorage.getItem("edteam_cmb_sons") !== "0"; localStorage.setItem("edteam_cmb_sons", on ? "0" : "1"); } catch (x) {} if (on) son("decryptage", false); else son("prechauffe"); sonsEtiquette(); if (typeof sonClic === "function") sonClic(); };
    // modale du detail d'un vaisseau verrouille recemment
    window.combatVu = function (i) {
        const v = (CB.liste || [])[i]; if (!v) return;
        const col = { r: "#FF3B30", v: "#00FF66", b: "#3D8BFF" }[v.ton], lib = { r: "HOSTILE", v: "ALLIÉ · NE PAS TIRER", b: "NEUTRE / CAMP INCONNU" }[v.ton];
        const nom = (typeof nomVaisseau === "function" && nomVaisseau(v.s)) || v.sl || "Vaisseau", age = v.t ? Math.max(0, Math.round(Date.now() / 1000 - v.t)) : null;
        const il = age === null ? "" : (age < 90 ? "il y a " + age + " s" : "il y a " + Math.round(age / 60) + " min");
        const ligne = (t, x) => x ? '<div class="r"><small>' + t + '</small><b>' + x + '</b></div>' : "";
        let m = document.getElementById("cmb-modale"); if (m) m.remove();
        m = document.createElement("div"); m.id = "cmb-modale"; m.style.setProperty("--m", col);
        m.innerHTML = '<div class="p" onclick="event.stopPropagation()"><button type="button" class="x" onclick="combatVuFermer()" title="Fermer (Échap)">✕</button>'
            + '<div class="tt"><span class="chip">' + lib + '</span><small>VAISSEAU VERROUILLÉ' + (il ? " · " + il : "") + '</small></div>'
            + '<div class="cr"><div class="h">' + miniHolo(v.s, "mv", v.ton) + '</div><div class="d">'
            + ligne("VAISSEAU", E(String(nom).toUpperCase())) + ligne("PILOTE", (v.j ? "CMD " : "") + E(v.p || "—")) + (v.j ? "" : ligne("TYPE", "PNJ")) + ligne("RANG", E(String(v.rg || "").toUpperCase())) + ligne("FACTION", E(v.f || "—")) + ligne("ESCADRON", E(v.e || ""))
            + ligne("PUISSANCE DÉFENDUE", E(v.pw || "AUCUNE")) + ligne("STATUT LÉGAL", E(v.l || "—")) + ligne("PRIME", v.pm > 0 ? FR(v.pm) + " cr" : "") + '</div></div>'
            + '<div class="rs"><small>POURQUOI CE CAMP ?</small><b>' + E(v.raison || "") + '</b></div></div>';
        m.addEventListener("click", combatVuFermer); document.body.appendChild(m);
        if (!window.__cmbEsc) { window.__cmbEsc = 1; document.addEventListener("keydown", e => { if (e.key === "Escape") combatVuFermer(); }); }
        if (typeof sonClic === "function") sonClic();
    };
    window.combatVuFermer = function () { const m = document.getElementById("cmb-modale"); if (m) m.remove(); };
    window.combatHtml = function () { return squelette(); };
    window.combatApres = function () {
        if (!document.getElementById("cmb")) return;
        const p = posture(effectif()), dr = document.getElementById("cmb-droite"); dr.innerHTML = droiteSquelette(p.droitePied); dr.__pied = p.droitePied;
        majCombat();
        clearInterval(CB.timer);
        CB.timer = setInterval(() => { if (typeof MODE !== "undefined" && MODE === "cmb" && !document.hidden) majCombat(); else if (typeof MODE !== "undefined" && MODE !== "cmb") { clearInterval(CB.timer); CB.timer = null; } }, 1000);
    };
    function masque(id, html) { const el = maj(id, html); if (el) el.style.display = html ? "" : "none"; return el; }
    // historique de la session contre la cible verrouillee (d'apres les eliminations relevees) + sous-systeme vise
    function piedCible(e, c) {
        if (!c) return "";
        const K = e.kills || [], nomV = (typeof nomVaisseau === "function" && nomVaisseau(c.s)) || c.sl || "ce vaisseau";
        let nf = c.f ? K.filter(k => k[3] === c.f).length : 0; if (c.f && c.f === e.ennemi) nf = Math.max(nf, e.nb || 0);
        const nv = K.filter(k => k[1] === c.s).length;
        const hist = c.f && campCible(c, e) === "r" ? (nf ? `<span>${nf}</span> ${E(c.f)} éliminé${nf > 1 ? "s" : ""} cette session${nv ? ` · <span>${nv}</span> ${E(nomV)}` : ""}` : `première rencontre avec ${E(c.f)} cette session`) : "";
        return (c.ss ? `SOUS-SYSTÈME CIBLÉ : <span>${E(String(c.ss).toUpperCase())}</span>` : "") + (c.ss && hist ? "<br>" : "") + (hist ? `HISTORIQUE · ${hist}` : "");
    }
    // scan : les champs inconnus brouillent des caracteres, puis se decodent lettre par lettre quand la valeur arrive
    const GLY = "ABCDEF0123456789#%&?▓▒░";
    const alea = n => Array.from({ length: n }, () => GLY[Math.floor(Math.random() * GLY.length)]).join("");
    function decoder() {
        const reel = (CB.etat && CB.etat.cible) ? CB.etat.cible : null, cle = reel ? String(reel.s) + "|" + String(reel.p || "") : "";
        const bs = Array.from(document.querySelectorAll("#cmb-bx .cb-bx b")), vals = bs.map(b => b.querySelector(".att") ? null : b.textContent);
        if (CB.decCle === cle && CB.decPrec) vals.forEach((v, i) => { if (v && CB.decPrec[i] === null) decode(bs[i], v); });
        CB.decCle = cle; CB.decPrec = vals;
        if (document.querySelector("#cmb-bx .att") && !CB.tick) son("decryptage");        // debut du brouillage : le son de decryptage joue UNE fois
        if (document.querySelector("#cmb-bx .att") && !CB.tick) CB.tick = setInterval(() => { const a = document.querySelectorAll("#cmb-bx .att"); if (!a.length) { clearInterval(CB.tick); CB.tick = null; return; } a.forEach(x => { x.textContent = alea(10); }); }, 110);
    }
    // les vrais mots s'ecrivent : le son « combat-dechiffre » joue (le decryptage du brouillage est coupe en fondu s'il dure encore)
    const DECODE_PAS = 12, DECODE_MS = 55;
    function decode(el, fin) {
        son("decryptage", false); son("dechiffre");
        let k = 0; const id = setInterval(() => { k++; const n = Math.ceil(fin.length * k / DECODE_PAS); el.textContent = fin.slice(0, n) + alea(Math.max(0, fin.length - n)); if (k >= DECODE_PAS) { clearInterval(id); el.textContent = fin; } }, DECODE_MS);
    }
    function majCombat() {
        hauteurs();
        if (!document.getElementById("cmb")) return;
        { const m0 = CB.etat; if (m0 && m0.sys) { const k = String(m0.sys).trim().toLowerCase(), mm = CB.mem[k] = CB.mem[k] || {}; if (m0.soutien) mm.s = m0.soutien; if (m0.ennemi) mm.e = m0.ennemi; } }
        const e = effectif(), p = posture(e), veille = !p.actif, pOn = p.pOn, pied = p.droitePied, ev = veille ? Object.assign({}, e, { cible: null, vus: [] }) : e;
        document.getElementById("cmb").classList.toggle("veille", veille); sonsEtiquette(); if (window.JCroises) JCroises.monterBouton("cmb-croises-btn"); son("prechauffe");
        const el = document.getElementById("cmb-droite"), ra = document.getElementById("cmb-rowA"), mo2 = document.getElementById("cmb-moi"), rb = document.getElementById("cmb-rowB");
        if (ra) ra.classList.toggle("pied", pOn);
        if (mo2) mo2.classList.toggle("pied", pOn);
        if (rb) rb.style.display = e.vide ? "none" : "";
        const recap = veille && !e.vide && (e.nb || 0) > 0, c1 = document.getElementById("cmb-chasse"), c2 = document.getElementById("cmb-session"), c3 = document.getElementById("cmb-dernier");
        if (c1) c1.style.display = recap ? "none" : ""; if (c2) c2.style.display = recap ? "none" : ""; if (c3) c3.style.display = recap ? "" : "none";
        if (el && el.__pied !== pied) { el.innerHTML = droiteSquelette(pied); el.__pied = pied; CB.cacheVict = ""; }
        maj("cmb-bandeau", veille ? bandeauVeille(e) : bandeau(e)); masque("cmb-bandes", veille ? "" : bandesMissions(e)); masque("cmb-stats", veille ? "" : stats(e));
        const mt = document.getElementById("cmb-moi-t"); if (mt) mt.innerHTML = pOn ? `VOTRE COMBINAISON <em>${E(((typeof SOL_NOMS !== "undefined" && S && S.pied && SOL_NOMS[String(S.pied.suit || "").replace(/_class\d+$/, "")]) || "Maverick"))}</em>` : `VOTRE VAISSEAU <em>${E((typeof nomVaisseau === "function" && S && S.vaisseau ? nomVaisseau(S.vaisseau.modele) : "") || "")}</em>`;
        const h = moiHolo(e, pOn), hel = document.getElementById("cmb-holo-moi");
        if (hel && hel.__cle !== h.cle) { hel.innerHTML = h.html; hel.__cle = h.cle; }
        maj("cmb-moi-b", moiBarres(e, pOn, veille));
        if (pied) { victimesPied(veille ? Object.assign({}, ev, { kills: [] }) : ev, veille); }
        else {
            const ci = document.getElementById("cmb-cible");
            if (ci) {
                const c = ev.cible, ton = c ? campCible(c, ev) : "r", ch = cibleHolo(c, ev), hc = document.getElementById("cmb-holo-cible");
                ci.classList.toggle("pvp", !!(c && c.j) && ton === "r");
                ci.classList.toggle("tv", ton === "v"); ci.classList.toggle("tb", ton === "b");
                const bl = document.getElementById("cmb-cible-bloc"); if (bl) { bl.classList.toggle("rouge", ton === "r"); bl.classList.toggle("vert", ton === "v"); bl.classList.toggle("cb-bleu", ton === "b"); }
                ci.classList.toggle("est-mort", !!(c && c.m));
                const cleC = c ? String(c.s) + "|" + String(c.p || "") : "";
                if (cleC && !(c && c.m) && CB.cleC !== undefined && (cleC !== CB.cleC || (ton === "v" && CB.tonC !== "v"))) { const aq = document.getElementById("cmb-acq"); if (aq && aq.firstChild) aq.firstChild.textContent = ton === "v" ? "CIBLE ALLIÉE · NE PAS TIRER" : "CIBLE ACQUISE"; ci.classList.remove("acq"); void ci.offsetWidth; ci.classList.add("acq"); son("acquisition"); clearTimeout(CB.acqT); CB.acqT = setTimeout(() => ci.classList.remove("acq"), 1700); }
                CB.cleC = cleC; CB.tonC = ton;
                if (hc && hc.__cle !== ch.cle) { hc.innerHTML = ch.html; hc.__cle = ch.cle; }
                maj("cmb-fond", cibleScene(ev)); maj("cmb-bx", cibleDonnees(ev, veille)); maj("cmb-mort", cibleMort(ev)); decoder();
                const t2 = document.getElementById("cmb-tag2"); if (t2) t2.innerHTML = c ? `SCAN ${"▮".repeat(Math.min(3, c.st || 0))}${"▯".repeat(3 - Math.min(3, c.st || 0))} ${Math.min(3, c.st || 0)}/3` : "";
                const tg = document.getElementById("cmb-tag"); if (tg) tg.textContent = c ? (ton === "v" ? "◉ CIBLE ALLIÉE · NE PAS TIRER" : ton === "b" ? (!(c.f || c.l) ? "◉ ANALYSE DE LA CIBLE" : (ev.zi || (ev.cf || []).length) ? "◉ CAMP À VÉRIFIER · PRUDENCE" : "◉ CIBLE NEUTRE") : c.j ? "◉ VERROUILLAGE ACTIF · JOUEUR" : "◉ VERROUILLAGE ACTIF") : "○ AUCUNE CIBLE";
                const ti = document.getElementById("cmb-cible-t"); if (ti) ti.innerHTML = (ton === "v" ? "CIBLE ALLIÉE VERROUILLÉE" : ton === "b" && (c.f || c.l) ? ((ev.zi || (ev.cf || []).length) ? "CIBLE À VÉRIFIER VERROUILLÉE" : "CIBLE NEUTRE VERROUILLÉE") : c && c.j ? "JOUEUR VERROUILLÉ" : "CIBLE VERROUILLÉE") + (c ? ` <em>scan ${Math.min(3, c.st || 0)}/3</em>` : "");
                maj("cmb-pied", piedCible(ev, c));
                masque("cmb-vus", vusHtml(ev));
                echelle();
            }
        }
        const ch2 = recap ? null : document.getElementById("cmb-chasse"); if (ch2) { const hh2 = e.pied ? typesPied(ev, veille) : chasse(ev, veille); if (ch2.__h !== hh2) { ch2.innerHTML = hh2; ch2.__h = hh2; } }
        if (recap) maj("cmb-dernier", dernierCombat(e)); else maj("cmb-session", session(e, veille));
    }
    window.addEventListener("resize", () => { if (document.getElementById("cmb")) { echelle(); CB.cacheVict = ""; majCombat(); } });

    // ---------------------------------------------------------------- lecture : combat_lire, temps reel, bascule automatique au debut d'un combat
    function appliquer(r, initial) {
        if (!r || !r.etat || typeof r.etat !== "object") return;
        const avant = CB.etat, e = r.etat;
        if (!initial && avant && e && e.actif && avant.debut === e.debut && (e.nb || 0) > (avant.nb || 0) && (e.nb || 0) - (avant.nb || 0) <= 6 && (Date.now() - new Date(r.maj_le || e.maj || 0).getTime()) < 30000) son("elimination", { premiere: !(avant.nb > 0) });      // capitaine : a chaque elimination (1 sur 2)
        CB.etat = e; CB.maj = r.maj_le || null; memEcrire(e);
        const age = (Date.now() - new Date(r.maj_le || e.maj || 0).getTime()) / 1000;
        const reel = e.cb === undefined || !!e.cb;     // vrai combat (elimination, attaque, bouclier, mort, armes sorties) ; sinon simple verrouillage de cible : on renseigne l'onglet sans y basculer
        const debut = e.actif && age < 90 && reel && (!avant || !avant.actif || avant.debut !== e.debut || (avant.cb !== undefined && !avant.cb));
        // verrouillage d'un JOUEUR (nouveau pilote ou nouveau vaisseau, ou meme joueur reverrouille apres 5 min) : on bascule aussi, meme sans combat, pour afficher la fiche ; jamais a l'ouverture de la page
        const cj = e.cible, aj = avant && avant.cible;
        const joueur = !initial && !!cj && !cj.m && !!cj.j && age < 60 && (!aj || aj.p !== cj.p || aj.s !== cj.s || (cj.t || 0) > (aj.t || 0) + 300);
        const pastille = document.getElementById("tb-cmb-pastille"); if (pastille) pastille.style.display = e.actif && reel ? "inline" : "none";
        if ((debut || joueur) && typeof MODE !== "undefined" && MODE !== "cmb" && typeof S !== "undefined" && S) {
            MODE = "cmb";                     // le combat commence (ou un joueur est verrouille) : on bascule sur l'onglet (sans le memoriser : la page se rouvrira sur l'onglet habituel)
            if (typeof rendre === "function") rendre();
            return;
        }
        if (typeof MODE !== "undefined" && MODE === "cmb") {
            if (!document.getElementById("cmb") || !avant) { if (typeof rendre === "function") rendre(); } else majCombat();
        }
    }
    async function lire() {
        try {
            const { data, error } = await supabaseApp.rpc("combat_lire");
            if (error) throw error;
            if (data && data.etat) appliquer(data, true);
        } catch (e) { /* fonction pas encore creee en base (script 103) ou pas de combat : l'onglet reste en attente */ }
    }
    function ecouter() {
        try {
            if (CB.canal) return;
            CB.canal = supabaseApp.channel("tb-combat-" + uid)
                .on("postgres_changes", { event: "*", schema: "public", table: "combat_live", filter: "user_id=eq." + uid }, p => { if (p && p.new && p.new.etat) appliquer({ etat: p.new.etat, maj_le: p.new.maj_le }, false); })
                .subscribe(st => { CB.rtOk = (st === "SUBSCRIBED"); });
        } catch (e) { /* temps reel indisponible : la relecture a l'ouverture de l'onglet suffit */ }
    }
    function couper() { try { if (CB.canal) { supabaseApp.removeChannel(CB.canal); CB.canal = null; CB.rtOk = false; } } catch (e) {} }
    // directives BGS actives de l'escadron (une petite requete toutes les 10 minutes, onglet visible) : la faction visee par une directive de GUERRE est celle qu'on soutient
    async function chargerDirs() {
        try {
            const p = window.profilCommandant; if (!p || !p.escadron_id || typeof supabaseApp === "undefined" || document.hidden) return;
            if (Date.now() - CB.dirs.t < 570000) return;
            CB.dirs.t = Date.now();
            const { data } = await supabaseApp.from("ordres_bgs").select("systeme_cible, faction_cible, type_ordre").eq("escadron_id", p.escadron_id).eq("statut", "ACTIF");
            CB.dirs.l = data || [];
            if (document.getElementById("cmb")) majCombat();
        } catch (x) { /* sans directives : le camp se deduit des eliminations */ }
    }
    window.combatDemarrer = async function () {
        chargerDirs(); setInterval(chargerDirs, 600000);
        await lire(); ecouter();
        // economie d'egress : onglet cache plus d'une minute = on se desabonne ; au retour, une lecture puis on se reabonne
        let tm = null;
        document.addEventListener("visibilitychange", () => {
            clearTimeout(tm);
            if (document.hidden) tm = setTimeout(couper, 60000);
            else if (!CB.canal) { lire(); ecouter(); }
        });
        window.addEventListener("beforeunload", couper);
    };
    window.combatActif = () => !!(CB.etat && CB.etat.actif);
    window.combatAppliquer = appliquer;     // essai a la main depuis la console : combatAppliquer({ etat: {...}, maj_le: new Date().toISOString() })
})();
