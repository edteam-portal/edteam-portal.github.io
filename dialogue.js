// Fenetres de confirmation et d'information au style du site (remplacent confirm() et alert() du navigateur).
//   await window.edConfirmer({ titre, texte (HTML), detail (HTML, facultatif), ok, annuler, ton : 'or' | 'rouge' })  -> true / false
//   await window.edInfo({ titre, texte (HTML), detail, ok, ton })                                                   -> quand on referme
// Echap = annuler, Entree = valider, clic a cote = annuler. Les textes sont du HTML : echapper (esc) tout ce qui vient de l'exterieur.
(function () {
  if (window.edConfirmer) return;
  const CSS = `
#ed-dlg{position:fixed;inset:0;z-index:100001;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:16px;animation:edDlgF .14s ease-out}
@keyframes edDlgF{from{opacity:0}to{opacity:1}} @keyframes edDlgP{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
.ed-dlg-p{--c:#FF7100;width:min(480px,100%);background:linear-gradient(180deg,rgba(255,113,0,.07),rgba(8,4,0,.985) 38%);border:1px solid var(--c);box-shadow:0 0 34px rgba(255,113,0,.22);
  clip-path:polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,16px 100%,0 calc(100% - 16px));animation:edDlgP .16s ease-out;font-family:inherit}
.ed-dlg-p.rouge{--c:#FF3B30;box-shadow:0 0 34px rgba(255,59,48,.25)}
.ed-dlg-h{padding:15px 22px 4px;color:var(--c);letter-spacing:3px;font-size:.8em;font-weight:bold;display:flex;align-items:center;gap:10px}
.ed-dlg-h:before{content:"";width:9px;height:9px;background:var(--c);box-shadow:0 0 10px var(--c);transform:rotate(45deg)}
.ed-dlg-t{padding:6px 22px 4px;color:#fff;font-size:1.12em;line-height:1.45}.ed-dlg-t b{color:#FFD700;font-weight:bold}
.ed-dlg-d{padding:4px 22px 6px;color:#9fb0b8;font-size:.86em;line-height:1.55}
.ed-dlg-b{display:flex;justify-content:flex-end;gap:10px;padding:14px 22px 20px}
.ed-dlg-b button{font:inherit;font-size:.82em;letter-spacing:2px;padding:8px 18px;cursor:pointer;background:transparent;border:1px solid #5b6a72;color:#aab7bd}
.ed-dlg-b button:hover{border-color:#fff;color:#fff}
.ed-dlg-b button.ok{border-color:var(--c);color:var(--c);background:rgba(255,113,0,.1);font-weight:bold}.ed-dlg-p.rouge .ed-dlg-b button.ok{background:rgba(255,59,48,.12)}
.ed-dlg-b button.ok:hover{background:var(--c);color:#050403}
@media (prefers-reduced-motion:reduce){#ed-dlg,.ed-dlg-p{animation:none}}`;
  function monter(o, avecAnnuler) {
    if (!document.getElementById('ed-dlg-css')) { const st = document.createElement('style'); st.id = 'ed-dlg-css'; st.textContent = CSS; document.head.appendChild(st); }
    return new Promise(resolve => {
      const old = document.getElementById('ed-dlg'); if (old) old.remove();
      const m = document.createElement('div'); m.id = 'ed-dlg';
      m.innerHTML = `<div class="ed-dlg-p ${o.ton === 'rouge' ? 'rouge' : ''}" role="dialog" aria-modal="true"><div class="ed-dlg-h">${o.titre || (avecAnnuler ? 'CONFIRMATION' : 'INFORMATION')}</div>
        <div class="ed-dlg-t">${o.texte || ''}</div>${o.detail ? `<div class="ed-dlg-d">${o.detail}</div>` : ''}
        <div class="ed-dlg-b">${avecAnnuler ? `<button type="button" data-r="0">${o.annuler || 'ANNULER'}</button>` : ''}<button type="button" class="ok" data-r="1">${o.ok || (avecAnnuler ? 'CONFIRMER' : 'COMPRIS')}</button></div></div>`;
      const fin = v => { document.removeEventListener('keydown', cle, true); m.remove(); resolve(v); };
      const cle = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fin(false); } else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); fin(true); } };
      m.addEventListener('click', e => { const b = e.target.closest && e.target.closest('button[data-r]'); if (b) fin(b.dataset.r === '1'); else if (e.target === m) fin(false); });
      document.addEventListener('keydown', cle, true);
      document.body.appendChild(m);
      const ok = m.querySelector('button.ok'); if (ok) ok.focus();
    });
  }
  window.edConfirmer = o => monter(o || {}, true);
  window.edInfo = o => monter(o || {}, false).then(() => undefined);
})();
