// =====================================================================================================
//  CAMPS DES PUISSANCES POWERPLAY : chaque puissance appartient a la Federation, a l'Empire, a l'Alliance ou aux Independants.
//  Regle commune (onglet Combat, fenetre « Joueurs croises », onglet mobile Croises) :
//    meme puissance        -> vert   (« Meme puissance »)
//    meme camp             -> vert   (« Meme camp : Federation »)
//    camp different        -> rouge  (« Camp rival »)
//  Source des camps : les 12 puissances de Powerplay 2.0 (chiffres recoupes : 4 Empire, 2 Federation, 2 Alliance, 4 Independants).
//  Les puissances INDEPENDANTES sont rivales entre elles (choix du proprietaire, 19/10 : elles ne sont pas allies) : deux independants differents = rouge.
//  Un nom de puissance inconnu (nouvelle puissance, variante d'ecriture) retombe sur l'ancienne regle : puissance differente = rival.
// =====================================================================================================
(function () {
    "use strict";
    if (window.EdteamPuissances) return;
    const CAMPS = { F: "Fédération", E: "Empire", A: "Alliance", I: "Indépendants" };
    const PUISSANCES = {
        "aisling duval": "E", "a. lavigny-duval": "E", "arissa lavigny-duval": "E", "denton patreus": "E", "zemina torval": "E",
        "felicia winters": "F", "jerome archer": "F",
        "edmund mahon": "A", "nakato kaine": "A",
        "archon delaine": "I", "li yong-rui": "I", "pranav antal": "I", "yuri grom": "I"
    };
    const ALIAS = { "arissa lavigny-duval": "a. lavigny-duval", "arissa lavigny duval": "a. lavigny-duval" };
    const norm = s => { const n = String(s == null ? "" : s).trim().toLowerCase().replace(/\s+/g, " "); return ALIAS[n] || n; };
    const camp = nom => PUISSANCES[norm(nom)] || "";
    // 'meme' : meme puissance ; 'bloc' : puissances differentes du meme camp ; 'rival' : camps differents (ou nom inconnu) ; '' : une des deux puissances n'est pas connue
    function relation(a, b) {
        const x = norm(a), y = norm(b);
        if (!x || !y) return "";
        if (x === y) return "meme";
        const cx = PUISSANCES[x], cy = PUISSANCES[y];
        if (cx && cy) return cx === cy && cx !== "I" ? "bloc" : "rival";
        return "rival";
    }
    // 'independantes' : les deux puissances sont independantes (et differentes) : le « camp rival » est alors une simple puissance rivale
    const independantes = (a, b) => camp(a) === "I" && camp(b) === "I" && norm(a) !== norm(b);
    window.EdteamPuissances = { relation, camp, independantes, nomCamp: nom => CAMPS[camp(nom)] || "", CAMPS };
})();
