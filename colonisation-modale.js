// FENETRE D'UN SYSTEME COLONISE : onglets (VUE D'ENSEMBLE, PROFIL, INSTALLATIONS, CHANTIERS), carte du systeme, tuiles d'indicateurs, resume des chantiers.
// Le contenu detaille d'un chantier (contributions, marchandises) reste celui de la page (o.chantiersHtml). Le long texte de methode est repliable.
// Depend de : colonisation-profil.js (coloProfilPieces), colonisation-carte-systeme.js (EDTEAM_CARTE_SYS), colonisation-visuels.js. Aucune lecture de la base.
(function () {
  const O = '#FF7100', B = '#00F0FF', G = '#00FF66', GOLD = '#FFD700';
  const CSS = `
.cm-tabs{position:sticky;top:0;z-index:6;display:flex;gap:4px;flex-wrap:wrap;padding:10px 24px 0;background:linear-gradient(180deg,rgba(10,5,0,.995),rgba(10,5,0,.97));border-bottom:1px solid rgba(255,113,0,.3)}
.cm-tab{position:relative;background:none;border:1px solid transparent;border-bottom:0;color:#8fa0a8;font:inherit;letter-spacing:2px;font-size:.78em;padding:10px 18px;cursor:pointer;white-space:nowrap}
.cm-tab:hover{color:#fff}.cm-tab.on{color:#fff;border-color:rgba(255,113,0,.55);background:rgba(255,113,0,.1)}
.cm-tab.on:after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;background:${O};box-shadow:0 0 10px ${O}}
.cm-tab em{font-style:normal;color:#FFB44D;margin-left:7px}.cm-tab i{display:inline-block;width:7px;height:7px;border-radius:50%;background:${GOLD};box-shadow:0 0 8px ${GOLD};margin-left:7px;vertical-align:1px}
.cm-corps{padding:16px 24px 22px;display:flex;flex-direction:column;gap:16px}
.cm-st{color:${B};letter-spacing:2px;font-size:.92em;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}.cm-st small{color:#8b97a0;letter-spacing:0;font-size:.82em}
.cm-carte{border:1px solid rgba(0,240,255,.3);background:linear-gradient(180deg,rgba(0,32,44,.55),rgba(2,6,9,.9));padding:8px 10px;clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px))}
.cm-carte .vide{color:#7fa5ae;text-align:center;padding:26px 10px;font-size:.88em;line-height:1.6}
.cm-spin{display:inline-block;width:11px;height:11px;border:2px solid ${B};border-top-color:transparent;border-radius:50%;animation:cmR .8s linear infinite;vertical-align:-2px;margin-right:8px}@keyframes cmR{to{transform:rotate(360deg)}}
.cm-tuiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(158px,1fr));gap:10px}
.cm-tu{position:relative;overflow:hidden;border:1px solid var(--c);background:linear-gradient(160deg,rgba(0,0,0,.55),rgba(0,0,0,.3));padding:10px 12px 12px}
.cm-tu:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 100% 0,var(--c),transparent 60%);opacity:.13}
.cm-tu small{position:relative;display:flex;align-items:center;gap:7px;color:#9fb0b8;letter-spacing:2px;font-size:.66em}
.cm-tu small span{width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--c);color:var(--c);font-size:11px;letter-spacing:0}
.cm-tu b{position:relative;display:block;font-size:2em;font-weight:bold;font-variant-numeric:tabular-nums;margin:3px 0 7px;color:var(--v);text-shadow:0 0 14px var(--v)}
.cm-tu .bar{position:relative;height:5px;background:rgba(255,255,255,.08)}.cm-tu .bar:before{content:"";position:absolute;left:50%;top:-2px;bottom:-2px;width:1px;background:#6b8a94}.cm-tu .bar i{position:absolute;top:0;bottom:0;background:var(--v);box-shadow:0 0 8px var(--v)}
.cm-alerte{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;border:1px solid ${GOLD};background:rgba(255,215,0,.07);padding:9px 14px;color:#f1dc8c;font-size:.88em}
.cm-alerte button{background:rgba(255,215,0,.12);border:1px solid ${GOLD};color:${GOLD};font:inherit;font-size:.8em;letter-spacing:1.5px;font-weight:bold;padding:6px 14px;cursor:pointer}.cm-alerte button:hover{background:${GOLD};color:#050403}
.cm-chs{display:flex;flex-direction:column;gap:8px}
.cm-ch{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1.5fr) auto;gap:6px 18px;align-items:center;background:rgba(0,0,0,.45);border:1px solid #2c2c2c;border-left:3px solid ${O};padding:9px 14px}
.cm-ch b{color:#fff;font-weight:normal;display:block;overflow-wrap:anywhere}.cm-ch small{color:#8fb7bf;letter-spacing:1px;font-size:.72em}
.cm-ch .barre{height:8px;background:repeating-linear-gradient(90deg,rgba(255,255,255,.09) 0 7px,transparent 7px 9px);position:relative}.cm-ch .barre i{position:absolute;left:0;top:0;bottom:0;background:repeating-linear-gradient(90deg,var(--c) 0 7px,transparent 7px 9px)}
.cm-ch .r{text-align:right;font-size:.82em;color:#9fb0b8;white-space:nowrap}.cm-ch .r b{display:inline;color:#fff}
.cm-ch .p{font-size:1.5em;font-weight:bold;color:var(--c);text-shadow:0 0 10px var(--c);text-align:right}
.cm-det{border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.35)}.cm-det summary{cursor:pointer;color:#9fb0b8;letter-spacing:1px;font-size:.82em;padding:8px 14px;list-style:none}.cm-det summary::-webkit-details-marker{display:none}
.cm-det summary:before{content:"▸";color:${B};margin-right:8px;display:inline-block;transition:transform .15s}.cm-det[open] summary:before{transform:rotate(90deg)}.cm-det summary:hover{color:#fff}
.cm-det .t{padding:2px 16px 12px;color:#8b97a0;font-size:.8em;line-height:1.6}.cm-det .t b{color:#cfe;font-weight:normal;border-bottom:1px dotted #FFB44D}
.cm-i{display:grid;grid-template-columns:42px minmax(150px,1.1fr) minmax(0,2.2fr) auto auto;gap:6px 14px;align-items:center;background:rgba(0,0,0,.45);border:1px solid #2c2c2c;border-left:3px solid ${G};padding:8px 12px}
.cm-i.cha{border-left-color:${O}}.cm-i.dec{border-left-color:${GOLD};background:rgba(255,215,0,.05)}
.cm-i b{display:block;color:#fff;font-weight:normal;overflow-wrap:anywhere}.cm-i small{color:#8fb7bf;letter-spacing:1px;font-size:.7em}
.cm-i .pf-pil{margin:0}.cm-i .pf-poss{margin:0}.cm-i .s{font-size:.7em;letter-spacing:1.5px;white-space:nowrap}
.cm-i .pf-sel,.cm-i .pf-btn{margin:0;white-space:nowrap}
.cm-liste{display:flex;flex-direction:column;gap:7px}
@media (max-width:860px){.cm-ch{grid-template-columns:1fr}.cm-ch .r,.cm-ch .p{text-align:left}.cm-i{grid-template-columns:42px 1fr}.cm-i>div:nth-child(n+3){grid-column:1/-1}.cm-tabs{padding:8px 12px 0}.cm-tab{padding:9px 11px;letter-spacing:1px}.cm-corps{padding:12px}}`;
  const ICO = { dev: ['DÉVELOPPEMENT', '⚙', '#FFB44D'], tec: ['TECHNOLOGIE', '⌬', '#00F0FF'], sec: ['SÉCURITÉ', '⛨', '#7fb0ff'], ric: ['RICHESSE', '◈', '#FFD700'], niv: ['NIVEAU DE VIE', '♥', '#FF8fb0'] };
  const f = v => v > 0 ? '+' + v : String(v);
  function css() { if (!document.getElementById('cm-css')) { const st = document.createElement('style'); st.id = 'cm-css'; st.textContent = CSS; document.head.appendChild(st); } }
  const onglet = () => window.__coloOnglet || 'vue';

  window.coloOnglet = function (n) {
    window.__coloOnglet = n;
    const i = ((window.__colo && window.__colo.systemes) || []).findIndex(x => x.nom === window.__coloOuvert); if (i < 0) return;
        window.ouvrirSysteme(i, true);
    const mc2 = document.querySelector('#modal-colo .modal-content'); if (mc2) mc2.scrollTop = 0;
  };

  // o = { esc, nomStation, pct, mode, onMode, estArchitecte, declarer, barre (html), chantiersHtml (html), resumes : [{nom, lib, pct, reste, req, eta, couleur}], pied (html), fmt }
  window.coloModaleCorps = function (s, o) {
    css();
    const p = window.coloProfilPieces ? window.coloProfilPieces(s, o) : null, esc = o.esc, on = onglet();
    window.__cmCtx = { s, p, o };
    const nOrange = p ? p.P.incertains + p.P.inconnus : 0, nInst = p ? p.tout.length : 0, nCh = (s.chantiers || []).length;
    const tab = (id, lib, extra) => `<button type="button" class="cm-tab ${on === id ? 'on' : ''}" onclick="coloOnglet('${id}')">${lib}${extra || ''}</button>`;
    const tabs = `<div class="cm-tabs">${tab('vue', "VUE D'ENSEMBLE")}${tab('profil', 'PROFIL')}${tab('inst', 'INSTALLATIONS', `<em>${nInst}</em>${nOrange ? '<i title="Des installations sont à déclarer"></i>' : ''}`)}${tab('chant', 'CHANTIERS', `<em>${nCh}</em>`)}</div>`;
    const note = p ? `<details class="cm-det"><summary>ⓘ COMMENT EST CALCULÉ CE PROFIL</summary><div class="t">${p.note}</div></details>` : '';
    let corps = '';
    if (on === 'vue') {
      const alerte = p && nOrange ? `<div class="cm-alerte"><span>⚠ <b style="color:#fff">${nOrange}</b> installation${nOrange > 1 ? 's' : ''} à déclarer : leur effet n'est pas encore compté.</span><button type="button" onclick="coloOnglet('inst')">${o.estArchitecte ? 'DÉCLARER LES TYPES' : 'VOIR LES INSTALLATIONS'}</button></div>` : '';
      const carte = `<div><div class="cm-st"><span>&gt; CARTE DU SYSTÈME</span><small>étoile à gauche, corps par distance · les stations sont sous leur corps</small></div><div class="cm-carte" id="cm-carte"><div class="vide"><span class="cm-spin"></span>Chargement de la carte…</div></div></div>`;
      let tuiles = '';
      if (p) {
        const vals = ['dev', 'tec', 'sec', 'ric', 'niv'].map(k => ({ k, v: p.P.indic[k].min })), ech = Math.ceil(Math.max(10, ...vals.map(x => Math.abs(x.v))) / 5) * 5, vide = !p.P.surs;
        tuiles = `<div><div class="cm-st"><span>&gt; PROFIL EN UN COUP D'ŒIL <small style="margin-left:8px">${p.P.surs} installation${p.P.surs > 1 ? 's' : ''} comptée${p.P.surs > 1 ? 's' : ''}</small></span><a style="color:${B};font-size:.8em;letter-spacing:1px;cursor:pointer;border-bottom:1px dashed ${B}" onclick="coloOnglet('profil')">DÉTAIL</a></div><div class="cm-tuiles">`
          + vals.map(({ k, v }) => { const [lb, ic, c] = ICO[k], col = vide ? '#6b7680' : v > 0 ? '#3DDC97' : v < 0 ? '#FF6B5E' : '#8b97a0', w = Math.min(50, Math.abs(v) / ech * 50); return `<div class="cm-tu" style="--c:${c};--v:${col}"><small><span>${ic}</span>${lb}</small><b>${vide ? '—' : f(v)}</b><div class="bar"><i style="left:${v >= 0 ? 50 : 50 - w}%;width:${vide ? 0 : w}%"></i></div></div>`; }).join('')
          + `<div class="cm-tu" style="--c:#3DDC97;--v:#3DDC97"><small><span>☺</span>POPULATION</small><b>${vide ? '—' : f(p.P.indic.pi.min) + ' / ' + f(p.P.indic.pm.min)}</b><div style="position:relative;color:#8b97a0;font-size:.7em;letter-spacing:1px">initiale / maximale</div></div></div></div>`;
      }
      const res = o.resumes || [];
      const chs = res.length ? `<div><div class="cm-st"><span>&gt; CHANTIERS EN COURS <small style="margin-left:8px">${res.length}</small></span><a style="color:${B};font-size:.8em;letter-spacing:1px;cursor:pointer;border-bottom:1px dashed ${B}" onclick="coloOnglet('chant')">DÉTAIL</a></div><div class="cm-chs">${res.map(r => `<div class="cm-ch" style="--c:${r.couleur || O}"><div><b>${esc(r.nom)}</b><small>${esc(r.lib || '')}</small><small style="display:block;margin-top:3px;letter-spacing:0;color:#9fb0b8">reste <b style="display:inline;color:#fff">${o.fmt(r.reste)} t</b> sur ${o.fmt(r.req)} t · fin estimée <b style="display:inline;color:#fff">${esc(r.eta)}</b></small></div><div><div class="barre"><i style="width:${Math.min(100, r.pct)}%"></i></div></div><div class="r"><div class="p">${r.pct}%</div></div></div>`).join('')}</div></div>` : '';
      corps = alerte + carte + tuiles + chs + note;
    } else if (on === 'profil') {
      corps = p ? `<div><div class="cm-st"><span>&gt; PROFIL DU SYSTÈME <small style="margin-left:8px">d'après ${p.n} installation${p.n > 1 ? 's' : ''} relevée${p.n > 1 ? 's' : ''}</small></span>
          <span class="pf-seg"><button class="${p.mode === 'actuel' ? 'on' : ''}" onclick="${o.onMode}('actuel')">ACTUEL</button><button class="${p.mode === 'prevu' ? 'on' : ''}" onclick="${o.onMode}('prevu')">AVEC LES CHANTIERS</button></span></div>
          <div class="pf-profil" style="grid-template-columns:1fr"><div class="pf-pg" style="border-right:0">${p.nul ? '<div style="color:#8b97a0;font-size:.85em;margin-bottom:8px;">Aucun type d\'installation reconnu pour l\'instant : le profil se remplit quand la liste des marchandises d\'un chantier est relevée.</div>' : ''}${p.groupes}<div class="pf-grp">ÉCONOMIES</div><div class="pf-tags">${p.eco}</div></div></div>
          <div class="pf-fiab">${p.fiab}</div></div>${note}` : `<div style="color:#8b97a0">Aucune installation relevée pour l'instant.</div>`;
    } else if (on === 'inst') {
      corps = p ? `<div><div class="cm-st"><span>&gt; INSTALLATIONS <small style="margin-left:8px">${nInst}</small></span><small>effets = valeurs du panneau du jeu, sans poids</small></div><div class="cm-liste">${p.tout.map(i => {
        const c = p.cand(i), pil = p.pills(i, c), ctl = p.ctlDe(i, c), cha = i.etat === 'cha';
        const poss = c.length > 1 ? `<div class="pf-poss" title="Types possibles : l'architecte du système peut déclarer le bon">≈ ${esc(c.slice(0, 4).map(r => r.n).join(' · '))}${c.length > 4 ? ' · +' + (c.length - 4) : ''}</div>` : '';
        return `<div class="cm-i ${cha ? 'cha' : ''} ${c.length > 1 ? 'dec' : ''}"><div>${p.pic(i, c, 38)}</div><div><b>${esc(i.nom)}</b><small>${esc(i.lib)}${i.premier ? ' · PREMIER SITE' : ''}${i.declare ? ' · DÉCLARÉ PAR L\'ARCHITECTE' : ''}</small></div><div>${poss}<div class="pf-pil">${pil}</div></div><div class="s">${cha ? `<span style="color:${O}">EN CONSTRUCTION · ${i.pct} %</span>` : `<span style="color:${G}">✔ TERMINÉE</span>`}</div><div>${ctl}</div></div>`;
      }).join('')}</div></div>${note}` : `<div style="color:#8b97a0">Aucune installation relevée pour l'instant.</div>`;
    } else {
      corps = nCh ? `<div style="display:flex;flex-direction:column;gap:14px">${o.chantiersHtml}</div>` : `<div style="color:#8b97a0;text-align:center;padding:30px">Aucun chantier en cours dans ce système.</div>`;
    }
    return tabs + `<div class="cm-corps"><div style="${on === 'chant' ? '' : 'display:none'}">${o.barre || ''}</div>${corps}${o.pied || ''}</div>`;
  };

  // apres l'affichage : charge la carte (EDSM) dans l'onglet « vue d'ensemble »
  window.coloModaleApres = async function () {
    const ctx = window.__cmCtx, zone = document.getElementById('cm-carte'); if (!ctx || !zone || !window.EDTEAM_CARTE_SYS) return;
    const { s, p, o } = ctx, nom = s.nom;
    const data = await window.EDTEAM_CARTE_SYS.charger(nom);
    const z = document.getElementById('cm-carte'); if (!z || (window.__cmCtx && window.__cmCtx.s.nom !== nom)) return;
    if (!data) { z.innerHTML = `<div class="vide">Carte indisponible : les corps de ce système ne sont pas encore connus d'EDSM (il faut qu'un pilote ait scanné le système).</div>`; return; }
    const E = window.EDTEAM_EFFETS;
    const items = (p ? p.tout : []).map(i => { const c = p.cand(i); return { nom: i.nom, famille: i.famille, nomType: c.length === 1 ? c[0].n : '', eco: c.length === 1 ? c[0].eco : '', etat: i.etat, pct: i.pct, lib: i.lib }; });
    z.innerHTML = window.EDTEAM_CARTE_SYS.svg({ corps: data.corps, stations: data.stations, total: data.total, items, esc: o.esc });
  };
})();
