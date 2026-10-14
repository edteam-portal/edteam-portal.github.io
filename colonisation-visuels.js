// Pictogrammes holographiques des installations de colonisation (dessins propres au site, schematiques : ce ne sont PAS des images du jeu).
// window.EDTEAM_ICONE(famille, nom, options) -> chaine SVG (44 x 44). famille = « Port orbital », « Avant-poste orbital », « Installation orbitale », « Port planétaire », « Colonie de surface », « Hub de surface ».
// options : { eco : economie (teinte), vide : true (chantier : contour pointille), taille : px }
(function () {
  const TEINTES = { Hightech: '#00D2E0', Extraction: '#F0524A', Military: '#D040E0', Industrial: '#FF9A1F', Agricultural: '#66D960', Tourism: '#FFD54A', Colony: '#B8C7CF', Refinery: '#E09A50', Contraband: '#9AA0A6' };
  // pastille de sous-type pour les installations orbitales et les hubs
  const BADGE = { 'Comm Station': '⌇', 'Space Farm': '❦', 'Pirate Base': '☠', 'Mining Outpost': '⛏', 'Relay Station': '⌁', Military: '✦', 'Security Station': '⛨', Government: '▥', Medical: '✚', 'Research Station': '⚗', Tourist: '★', 'Space Bar': '☕', Satellite: '', Extraction: '⛏', Civilian: '☺', Exploration: '◔', Outpost: '▲', Scientific: '⚗', Refinery: '♨', 'High Tech': '⌬', Industrial: '⚙' };
  function dessin(f, n) {
    const taille = /\b(S|M|L)$/.exec(n || ''), t = taille ? taille[1] : '';
    switch (f) {
      case 'Port orbital':
        if (/Coriolis/.test(n)) return '<path d="M22 6L38 14V30L22 38L6 30V14Z"/><path d="M22 6V22M6 14L22 22L38 14"/><rect x="17" y="24" width="10" height="7" rx="1"/>';
        if (/Asteroid/.test(n)) return '<path d="M9 16L17 7L30 9L38 19L34 32L22 38L10 31L6 22Z"/><path d="M15 21L24 19L29 25L24 31L15 28Z"/>';
        if (/Dodeca/.test(n)) return '<path d="M22 5L37 16L31 35H13L7 16Z"/><path d="M22 14L30 20L27 29H17L14 20Z"/><path d="M22 5V14M37 16L30 20M31 35L27 29M13 35L17 29M7 16L14 20"/>';
        return '<circle cx="22" cy="22" r="15"/><ellipse cx="22" cy="22" rx="21" ry="6"/><path d="M19 29H25"/>';      // Ocellus / Orbis
      case 'Avant-poste orbital': return '<rect x="9" y="19" width="26" height="12" rx="2"/><path d="M14 19V13H20V19M26 19V9M26 9L32 12"/><path d="M13 35H31"/>';
      case 'Installation orbitale': return '<rect x="17" y="15" width="10" height="14" rx="2"/><path d="M5 18H15V26H5ZM29 18H39V26H29Z"/><path d="M22 15V9M22 29V35"/>';
      case 'Port planétaire':
        if (/^Port$/.test(n)) return '<path d="M5 34H39"/><path d="M9 34A13 13 0 0 1 35 34"/><path d="M15 34V24M22 34V16M29 34V24"/><path d="M12 38H32"/>';
        return '<path d="M5 34H39"/><path d="M12 34A10 10 0 0 1 32 34"/><path d="M16 38H28"/>';
      case 'Colonie de surface': {
        const b = t === 'L' ? 3 : t === 'M' ? 2 : 1;
        let s = '<path d="M4 35H40"/>';
        for (let i = 0; i < b; i++) { const x = b === 1 ? 17 : b === 2 ? 9 + i * 15 : 5 + i * 12, w = b === 3 ? 9 : 10, h = 8 + (i === 1 ? 6 : 0) + (t === 'L' ? 3 : 0); s += `<path d="M${x} 35V${35 - h}H${x + w}V35"/>`; }
        return s + (t === 'L' ? '<path d="M22 19V9M18 12H26"/>' : '');
      }
      case 'Hub de surface': return '<path d="M4 35H40"/><path d="M12 35V17H24V35M24 35V24H33V35"/><path d="M15 21H21M15 26H21M15 31H21"/><path d="M18 17V10"/>';
      default: return '<rect x="10" y="10" width="24" height="24" rx="3"/>';
    }
  }
  window.EDTEAM_ICONE = function (famille, nom, o) {
    o = o || {}; const c = TEINTES[o.eco] || '#00F0FF', px = o.taille || 44, b = BADGE[nom] || '';
    const idg = 'ico' + Math.random().toString(36).slice(2, 7);
    return `<svg class="ed-ico" width="${px}" height="${px}" viewBox="0 0 44 44" role="img" aria-label="${String(famille).replace(/"/g, '')}" style="flex:none;overflow:visible"><defs><linearGradient id="${idg}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".35"/><stop offset="1" stop-color="${c}" stop-opacity=".06"/></linearGradient></defs>`
      + `<g fill="url(#${idg})" stroke="${c}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" ${o.vide ? 'stroke-dasharray="3 2.5" opacity=".75"' : ''} style="filter:drop-shadow(0 0 3px ${c}99)">${dessin(famille, nom)}</g>`
      + (b ? `<text x="38" y="12" text-anchor="middle" font-size="11" fill="${c}" stroke="#050403" stroke-width="2.4" paint-order="stroke">${b}</text>` : '') + '</svg>';
  };
  window.EDTEAM_TEINTE_ECO = TEINTES;
})();
