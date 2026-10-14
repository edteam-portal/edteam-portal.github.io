// Effets des installations de colonisation sur un systeme : table par type (indicateurs de systeme et points de construction) + calcul du profil.
// Source des valeurs : feuille communautaire "Colonization Construction v3" de CMDR DaftMav, onglet "Liste" (valeurs observees en jeu). Ce sont des ESTIMATIONS :
// l'auteur precise que Frontier n'a pas explique l'application du bonus/malus et qu'aucune vue du jeu ne permet de verifier les totaux.
// Ce fichier ne contient que des donnees de reference ; aucune lecture de la base.
(function () {
  // [famille, nom, T2, T3, securite, technologie, richesse, niveau de vie, developpement, economie, influence, pop. initiale, pop. max]
  const LIGNES = [["Port orbital","Coriolis",-3,1,-2,1,2,3,2,"Colony","",1,0],
    ["Port orbital","Asteroid Base",-3,1,-1,3,5,-4,7,"Extraction","",1,0],
    ["Port orbital","Ocellus",0,-6,-3,6,7,5,8,"Colony","",5,1],
    ["Port orbital","Orbis",0,-6,-3,6,7,5,8,"Colony","",5,1],
    ["Avant-poste orbital","Commercial",1,0,-1,0,2,5,0,"Colony","",0,0],
    ["Avant-poste orbital","Industrial",1,0,0,3,0,0,2,"Industrial","",0,0],
    ["Avant-poste orbital","Criminal",1,0,-2,0,2,0,0,"Colony","Contraband",0,0],
    ["Avant-poste orbital","Civilian",1,0,-1,0,1,1,1,"Colony","",0,0],
    ["Avant-poste orbital","Scientific",1,0,0,3,0,0,0,"Hightech","",1,0],
    ["Avant-poste orbital","Military",1,0,2,0,0,0,0,"Military","",1,0],
    ["Installation orbitale","Satellite",1,0,0,0,1,1,1,"","",0,0],
    ["Installation orbitale","Comm Station",1,0,1,3,0,0,0,"","",0,0],
    ["Installation orbitale","Space Farm",1,0,0,0,0,5,1,"Agricultural","Agricultural",0,0],
    ["Installation orbitale","Pirate Base",1,0,-4,0,3,0,0,"","Contraband",0,0],
    ["Installation orbitale","Mining Outpost",1,0,0,0,3,-2,0,"Extraction","Extraction",0,0],
    ["Installation orbitale","Relay Station",1,0,1,0,0,0,1,"Hightech","Hightech",0,0],
    ["Installation orbitale","Military",-1,1,6,0,0,0,0,"Military","Military",0,0],
    ["Installation orbitale","Security Station",-1,1,8,0,0,3,2,"Military","Military",0,0],
    ["Installation orbitale","Government",-1,1,2,0,0,6,2,"","",0,0],
    ["Installation orbitale","Medical",-1,1,0,3,0,5,0,"Hightech","Hightech",0,0],
    ["Installation orbitale","Research Station",-1,1,0,8,0,0,2,"Hightech","Hightech",0,0],
    ["Installation orbitale","Tourist",-1,1,-3,0,6,0,2,"Tourism","Tourism",0,0],
    ["Installation orbitale","Space Bar",-1,1,-2,0,2,3,0,"Tourism","Tourism",0,0],
    ["Port planétaire","Outpost Civilian",1,0,-2,0,0,3,0,"Colony","",2,0],
    ["Port planétaire","Outpost Industrial",1,0,-1,0,2,0,0,"Industrial","",1,0],
    ["Port planétaire","Outpost Scientific",1,0,-1,5,0,0,1,"Hightech","",1,0],
    ["Port planétaire","Port",0,-6,-3,5,5,6,10,"Colony","",10,10],
    ["Colonie de surface","Agriculture T1 S",1,0,0,0,0,3,0,"Agricultural","Agricultural",0,0],
    ["Colonie de surface","Agriculture T1 M",1,0,0,0,0,6,0,"Agricultural","Agricultural",0,0],
    ["Colonie de surface","Agriculture T2 L",-1,2,0,0,0,10,0,"Agricultural","Agricultural",0,0],
    ["Colonie de surface","Extraction T1 S",1,0,0,0,2,0,0,"Extraction","Extraction",0,0],
    ["Colonie de surface","Extraction T1 M",1,0,0,0,5,0,0,"Extraction","Extraction",0,0],
    ["Colonie de surface","Extraction T2 L",-1,2,0,1,7,-2,0,"Extraction","Extraction",0,0],
    ["Colonie de surface","Industrial T1 S",1,0,0,0,0,0,2,"Industrial","Industrial",0,0],
    ["Colonie de surface","Industrial T1 M",1,0,0,0,0,0,5,"Industrial","Industrial",0,0],
    ["Colonie de surface","Industrial T2 L",-1,2,0,0,2,0,8,"Industrial","Industrial",0,0],
    ["Colonie de surface","Military T1 S",1,0,2,0,0,0,0,"Military","Military",0,0],
    ["Colonie de surface","Military T1 M",1,0,4,0,0,0,0,"Military","Military",0,0],
    ["Colonie de surface","Military T2 L",-1,2,6,0,0,0,2,"Military","Military",0,0],
    ["Colonie de surface","Research Bio T1 S",-1,1,0,3,0,0,1,"Hightech","Hightech",0,0],
    ["Colonie de surface","Research Bio T1 M",-1,1,0,6,0,0,1,"Hightech","Hightech",0,0],
    ["Colonie de surface","Research Bio T2 L",-1,2,0,10,0,0,2,"Hightech","Hightech",0,0],
    ["Colonie de surface","Tourism T1 S",-1,1,-1,0,1,0,0,"Tourism","Tourism",0,0],
    ["Colonie de surface","Tourism T1 M",-1,1,-1,0,2,0,0,"Tourism","Tourism",0,0],
    ["Colonie de surface","Tourism T2 L",-1,2,-1,0,5,0,0,"Tourism","Tourism",0,0],
    ["Hub de surface","Extraction",-1,1,0,0,10,-4,2,"Extraction","Extraction",0,0],
    ["Hub de surface","Civilian",-1,1,-3,0,0,3,2,"","",0,0],
    ["Hub de surface","Exploration",-1,1,-1,6,0,0,2,"Tourism","Tourism",0,0],
    ["Hub de surface","Outpost",-1,1,-2,0,0,3,2,"","",0,0],
    ["Hub de surface","Scientific",-1,1,0,10,0,0,0,"Hightech","Hightech",0,0],
    ["Hub de surface","Military",-1,1,10,0,0,0,0,"Military","Military",0,0],
    ["Hub de surface","Refinery",-1,1,-1,3,5,-2,7,"","Refinery",0,0],
    ["Hub de surface","High Tech",-1,1,-2,10,-2,0,0,"Hightech","Hightech",0,0],
    ["Hub de surface","Industrial",-1,1,0,3,5,-4,2,"Industrial","Industrial",0,0]];
  // AFFINAGE PAR L'ECONOMIE : DESACTIVE (14/10). L'economie d'une station est un melange influence par les installations voisines (ex. : un port planetaire a 4,2 d'agriculture
  // dans un systeme de 14 colonies agricoles) : elle peut donner un FAUX type. A reactiver (true) quand les seuils auront ete mesures sur des stations dont le vrai type est connu :
  //   SEUIL_PART_MAX = proportion dominante maximale acceptee ; SEUIL_RATIO = rapport minimal entre la 1re et la 2e economie.
  const AFFINER_PAR_ECONOMIE = false, SEUIL_PART_MAX = 1.2, SEUIL_RATIO = 1.25;
  const ECO_JEU = { Industrial: 'Industrial', HighTech: 'Hightech', Military: 'Military', Colony: 'Colony', Agri: 'Agricultural', Extraction: 'Extraction', Refinery: 'Refinery', Tourism: 'Tourism' };
  const CLES = ['t2', 't3', 'sec', 'tec', 'ric', 'niv', 'dev', 'pi', 'pm'];
  const LIBELLES = { dev: 'Développement', tec: 'Technologie', sec: 'Sécurité', ric: 'Richesse', niv: 'Niveau de vie', pi: 'Population initiale', pm: 'Population max', t2: 'Points T2', t3: 'Points T3' };
  const ROWS = LIGNES.map(r => ({ f: r[0], n: r[1], t2: r[2], t3: r[3], sec: r[4], tec: r[5], ric: r[6], niv: r[7], dev: r[8], eco: r[9], inf: r[10], pi: r[11], pm: r[12] }));
  // CORRECTIONS CONSTATEES EN JEU (14/10, captures du proprietaire du panneau « Effets de l'installation ») : la feuille reprend les valeurs de la BETA.
  //   industriel : Vess Platform = dev. 3, pop. 1, pop. max 1, techno 3 (feuille : dev. 2, pop. 0, pop. max 0) ;
  //   civil (Tshang City, Valdes's Inheritance : types DEDUITS par ressemblance, non confirmes) : niveau de vie 2, pop. 1, pop. max 1 (feuille : 1, 0, 0) ;
  //   militaire (Struzan Arsenal : type deduit) : pop. 1, pop. max 1 (feuille : 1, 0). Commercial, criminel, scientifique : non mesures, valeurs de la feuille.
  const OBSERVE = { 'Avant-poste orbital|Industrial': { dev: 3, pi: 1, pm: 1 }, 'Avant-poste orbital|Civilian': { niv: 2, pi: 1, pm: 1 }, 'Avant-poste orbital|Military': { pi: 1, pm: 1 } };
  // HUBS DE SURFACE : le journal des modifications de la feuille indique +1 population initiale et +1 population max (cellules vides dans la table).
  ROWS.forEach(r => { const o = OBSERVE[r.f + '|' + r.n]; if (o) { Object.assign(r, o); r.obs = true; } if (r.f === 'Hub de surface') { r.pi = 1; r.pm = 1; } });
  // POIDS OFFICIELS (notes de mise a jour 4.2.2.0 « Dodec », retroactifs) : l'effet d'une installation sur le SYSTEME est pondere. Le port INITIAL (premier site) pese davantage :
  // developpement +40 %, securite +40 %, niveau de vie +40 %, technologie +20 %, richesse +40 % ; les installations SUIVANTES pesent moins : developpement -10 %, securite -10 %,
  // niveau de vie -20 %, technologie -25 %, richesse -25 %. La population n'est pas ponderee. Les valeurs affichees par installation (panneau du jeu) ne sont PAS ponderees.
  const POIDS = { p: { dev: 1.4, sec: 1.4, niv: 1.4, tec: 1.2, ric: 1.4 }, s: { dev: 0.9, sec: 0.9, niv: 0.8, tec: 0.75, ric: 0.75 } };
  // Bonus du PREMIER site (revendication du systeme) : observe une seule fois (avant-poste industriel : +1 dev., +1 pop., +1 pop. max). A CONFIRMER.
  // (14/10) NEUTRALISE : deux ports principaux releves en jeu donnent des ecarts differents (Vess Platform : +1 dev., +1 pop., +1 pop. max ; Tshang City : +1 pop., +1 pop. max, +1 niveau de vie) ;
  // la regle n'est pas comprise, donc elle n'est pas appliquee. Les effets du port principal sont donc comptes comme ceux d'une installation ordinaire.
  const BONUS_PREMIER = {};
  // installation = { noms : [noms de type possibles], famille, premier } -> lignes candidates de la table (une seule = type sur ; plusieurs = incertain ; aucune = inconnu, ex. Dodecahedron)
  function candidats(inst) {
    const noms = [].concat(inst.noms || []).map(x => String(x).split(' / ')).reduce((a, b) => a.concat(b), []);
    const c = ROWS.filter(r => r.f === inst.famille && noms.indexOf(r.n) >= 0);
    // INDICE : l'economie observee de la station (journal, a l'amarrage) departage des types a recette identique. Ce n'est pas une certitude (les liens de marche
    // du systeme modifient l'economie) : si aucun candidat ne correspond, on garde tous les candidats.
    const eco = ECO_JEU[inst.eco];
    const fiable = AFFINER_PAR_ECONOMIE && (inst.ecoPart || 0) > 0 && inst.ecoPart <= SEUIL_PART_MAX && (!inst.ecoSecond || inst.ecoPart / inst.ecoSecond >= SEUIL_RATIO);
    if (c.length > 1 && eco && fiable) { const f = c.filter(r => r.eco === eco); if (f.length) return f; }
    return c;
  }
  // Profil d'un systeme : pour chaque indicateur, le total sur (min, max) ; max = min quand tous les types sont surs.
  function profilSysteme(installations) {
    const P = {}; CLES.forEach(k => { P[k] = { min: 0, max: 0 }; });
    const lignes = []; let surs = 0, incertains = 0, inconnus = 0, premiers = 0; const eco = {};
    installations.forEach(inst => {
      const c = candidats(inst);
      if (!c.length) { inconnus++; lignes.push({ inst, c, etat: 'inconnu' }); return; }
      // REGLE (14/10) : on ne deduit jamais ce qui n'est pas sur. Une installation de type incertain est signalee mais n'ajoute RIEN aux totaux (pas de fourchette).
      if (c.length > 1) { incertains++; lignes.push({ inst, c, etat: 'incertain' }); return; }
      surs++; if (inst.premier) premiers++;
      CLES.forEach(k => { const v = c[0][k] * ((POIDS[inst.premier ? 'p' : 's'][k]) || 1); P[k].min += v; P[k].max += v; });
      if (c[0].eco) eco[c[0].eco] = (eco[c[0].eco] || 0) + 1;
      lignes.push({ inst, c, etat: 'sur' });
    });
    CLES.forEach(k => { P[k].min = Math.round(P[k].min * 10) / 10; P[k].max = P[k].min; });
    return { indic: P, lignes, surs, incertains, inconnus, eco, premiers };
  }
  window.EDTEAM_EFFETS = { ECO_JEU, CLES, LIBELLES, ROWS, POIDS, candidats, profilSysteme };

})();
