// HOLOGRAMME DE VAISSEAU (vue de dessus, teinte cyan / rouge / vert / bleu, contour lumineux, balai) : meme rendu que l'onglet Combat (combat.js), reutilise par la fenetre « Joueurs croises ».
// Depend de SILHOUETTES (silhouettes-data.js). Sans hologramme dedie pour un vaisseau : silhouette generique. A garder identique au rendu de combat.js.
(function () {
    "use strict";
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
    function miniHolo(cle, id, rouge) { const sil = silDe(cle); return sil ? holoVaisseau(sil, id, "", rouge) : holoGenerique(id, rouge); }
    window.HoloVaisseau = { TONS: TONS, silDe: silDe, vaisseau: holoVaisseau, generique: holoGenerique, mini: miniHolo };
})();
