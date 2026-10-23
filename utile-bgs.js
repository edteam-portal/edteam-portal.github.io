// COULEUR DE RESULTAT DES LIGNES DE DIRECTIVES (PC : campagnes.js ; mobile : campagnes-mobile.js).
// Decision du 22/10 : pas de bande de suggestions ; les couleurs suffisent a orienter les pilotes (ils vont naturellement vers le rouge quand le vert montre que l'objectif est atteint).
// Fond d'une ligne : vert = l'objectif de la directive est atteint (influence dans le sens voulu : hausse pour une hausse, baisse pour une baisse), rouge = pas atteint, bleu = influence inchangee.
//  - NET : mesure EDSM POSTERIEURE au dernier tick (donc de moins de 24 h) -> variation depuis ce tick (courbe EDSM : valeur actuelle moins derniere valeur connue avant le tick) ;
//  - PALE : aucune mesure depuis le dernier tick (la date EDSM d'un systeme est celle de la derniere visite d'un joueur : souvent plus ancienne que le tick) -> variation sur 48 h, teinte plus claire.
//  - Guerres et elections : couleur du score (nette si la mesure a moins de 24 h, sinon pale).
(function () {
    "use strict";
    if (window.EdteamUtile) return;
    const COUL = { up: "#2fe07a", dn: "#ff4d4d", fl: "#4DA3FF" };
    const FRAIS = 24 * 3600;     // secondes

    // instant (ms) du dernier tick connu (reel ou estime, voir tick.js) ; null sans donnee
    function dernierTick() {
        try { if (!window.EdteamTick || !window.EdteamTick.liste) return null; const now = Date.now(), l = window.EdteamTick.liste(now - 3 * 86400000, now); return l.length ? l[l.length - 1].t : null; } catch (e) { return null; }
    }
    // variation d'influence (points) entre la derniere valeur connue AVANT le dernier tick et la valeur actuelle ; null si la mesure n'est pas posterieure au tick
    function deltaTick(res) {
        const lt = dernierTick(); if (!lt || !res || !res.donnees || !res.maj_edsm || Number(res.maj_edsm) * 1000 <= lt || res.influence == null) return null;
        let avant = null; (res.courbe || []).forEach(p => { if (Number(p[0]) * 1000 <= lt) avant = p; });
        return avant ? (Number(res.influence) - Number(avant[1])) * 100 : null;
    }
    // variation sur 48 h (points) : valeur actuelle moins la derniere valeur connue il y a 48 h ou plus (a defaut, la plus ancienne) ; null sans courbe
    function delta48(res) {
        const cb = res && res.courbe || []; if (cb.length < 2 || res.influence == null) return null;
        const lim = Date.now() / 1000 - 48 * 3600; let avant = cb[0]; cb.forEach(p => { if (Number(p[0]) <= lim) avant = p; });
        return (Number(res.influence) - Number(avant[1])) * 100;
    }
    // signal d'une ligne : { sens: 'up' | 'dn' | 'fl', pale } ou null. sensConflit : fonction de la page (score d'une guerre ou d'une election)
    function signalLigne(o, res, sensConflit) {
        if (!res || !res.donnees) return null;
        const voulu = d => Math.abs(d) < 0.05 ? "fl" : ((String(o.type_ordre).toUpperCase() === "BAISSE" ? d < 0 : d > 0) ? "up" : "dn");
        if (res.conflit) { if (!sensConflit) return null; const frais = res.maj_edsm && (Date.now() / 1000 - Number(res.maj_edsm)) < FRAIS; return { sens: sensConflit(o, res), pale: !frais }; }
        const d = deltaTick(res); if (d != null) return { sens: voulu(d), pale: false };
        const d48 = delta48(res); return d48 == null ? null : { sens: voulu(d48), pale: true };
    }
    // fond discret d'une ligne (« » sans signal) ; pale : teinte plus claire
    function fond(sens, pale) {
        if (!sens || !COUL[sens]) return "";
        const c = COUL[sens];
        return pale ? "linear-gradient(90deg," + c + "40 0%," + c + "26 55%," + c + "14 100%)" : "linear-gradient(90deg," + c + "80 0%," + c + "4d 55%," + c + "2b 100%)";
    }
    // variation affichee a cote de l'influence = celle qui fait la couleur : depuis le dernier tick (net) ou sur 48 h (pale) ; { v (points), sens, pale, fen } ou null
    function variation(o, res) {
        if (!res || !res.donnees || res.conflit) return null;
        const x = signalLigne(o, res, null); if (!x) return null;
        const v = x.pale ? delta48(res) : deltaTick(res);
        return v == null ? null : { v: v, sens: x.sens, pale: x.pale, fen: x.pale ? 'sur 48 h (aucune mesure EDSM depuis le dernier tick)' : 'depuis le dernier tick' };
    }
    const fondLigne = (o, res, sensConflit) => { const x = signalLigne(o, res, sensConflit); return x ? fond(x.sens, x.pale) : ""; };

    // petite legende discrete (une ligne)
    function legende() {
        const i = c => "<i style=\"display:inline-block;width:14px;height:7px;margin-right:5px;vertical-align:middle;border:1px solid " + c + ";background:" + c + "33\"></i>";
        return "<div style=\"display:flex;gap:14px;justify-content:flex-end;flex-wrap:wrap;color:#6f7c84;font-size:.6em;margin:0 2px 8px;font-family:'Share Tech Mono',monospace\"><span>" + i(COUL.up) + "objectif atteint</span><span>" + i(COUL.dn) + "pas atteint</span><span>" + i(COUL.fl) + "inchangé</span>"
            + "<span>· fond net : variation depuis le dernier tick · fond pâle : aucune mesure depuis le tick, variation sur 48 h</span><span>· jauge : gris = influence inchangée, plein = gain, rayé = perte, trait blanc = avant le tick</span></div>";
    }

    window.EdteamUtile = { fond, fondLigne, signalLigne, variation, deltaTick, delta48, dernierTick, legende, COUL };
})();
