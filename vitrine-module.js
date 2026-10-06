// Vitrine d'un module d'escadron (BGS, Escadron) pour un pilote sans escadron.
// bgs.html et escadron.html l'appellent a la place de leur contenu : aucune requete, que des images locales (images/vitrine-*.jpg, captures a donnees fictives).
(function () {
    const MODULES = {
        bgs: {
            kick: "// MODULE D'ESCADRON", titre: 'FRAPPEZ OÙ ÇA FAIT MAL',
            phrase: "Directives de l'Amiral, rang de carrière, titres de spécialiste : tout le BGS de votre escadron sur une seule page.",
            vues: [
                { cle: 'accueil', nom: "L'ACCUEIL BGS", img: 'images/vitrine-bgs-accueil.jpg', fondu: true, legende: 'Votre engagement, votre progression, la semaine de l’escadron et le mur des spécialistes.' },
                { cle: 'directive', nom: 'UNE DIRECTIVE', img: 'images/vitrine-bgs-directive.jpg', contenir: true, legende: 'L’effort de chacun et le résultat constaté dans le jeu pour chaque directive.' },
                { cle: 'journal', nom: 'LE JOURNAL', img: 'images/vitrine-bgs-journal.jpg', legende: 'Chaque action est répertoriée : qui, quand, où, et les points de rang qu’elle rapporte.' }
            ]
        },
        escadron: {
            kick: "// MODULE D'ESCADRON", titre: 'VOTRE ÉQUIPAGE',
            phrase: 'Chaque pilote sur une carte : grade, rang BGS, Powerplay, titres et plaques.',
            vues: [
                { cle: 'effectifs', nom: 'LES EFFECTIFS', img: 'images/vitrine-escadron-effectifs.jpg', fondu: true, legende: 'Recherche, tri et filtres : on voit qui est actif cette semaine.' },
                { cle: 'fiche', nom: 'UNE FICHE PILOTE', img: 'images/vitrine-escadron-fiche.jpg', contenir: true, legende: 'Rangs, titres, plaques de campagne et distinctions de chaque pilote.' }
            ]
        }
    };

    const CSS = `
.vt { display: flex; flex-direction: column; gap: 14px; animation: fadeIn 0.3s ease-out; }
.vt-titre { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; border-bottom: 1px dashed var(--ed-orange-dim, rgba(255,113,0,.2)); padding-bottom: 14px; }
.vt-titre h3 { margin: 0; color: var(--ed-orange, #FF7100); letter-spacing: 2px; font-size: 1.2em; }
.vt-titre span { color: #777; font-size: .75em; letter-spacing: 1px; }
.vt-acc { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 360px); gap: 30px; align-items: center; }
.vt-kick { color: var(--ed-blue, #00F0FF); letter-spacing: 4px; font-size: .78em; font-weight: bold; }
.vt-acc h4 { margin: 6px 0; color: #fff; font-size: 1.55em; letter-spacing: 3px; font-weight: normal; }
.vt-acc p { margin: 0; color: #aaa; font-size: .95em; line-height: 1.5; }
.vt-btn { display: inline-block; margin-top: 16px; text-decoration: none; border: 1px solid var(--ed-blue, #00F0FF); color: var(--ed-blue, #00F0FF); background: rgba(0,240,255,.1); padding: 12px 22px; letter-spacing: 3px; font-size: .85em; font-weight: bold; box-shadow: 0 0 16px rgba(0,240,255,.12); transition: .2s; }
.vt-btn:hover { background: var(--ed-blue, #00F0FF); color: #000; }
.vt-btn small { display: block; color: #777; letter-spacing: 1px; font-size: .78em; font-weight: normal; margin-top: 5px; }
.vt-btn:hover small { color: #123; }
.vt-col { display: flex; flex-direction: column; gap: 8px; }
.vt-e { display: flex; align-items: center; gap: 10px; border: 1px solid rgba(0,240,255,.4); background: rgba(0,240,255,.05); padding: 8px 12px; font-size: .8em; letter-spacing: 1px; color: #ddd; }
.vt-e b { flex: 0 0 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; color: var(--ed-blue, #00F0FF); border: 1px solid var(--ed-blue, #00F0FF); font-size: .9em; }
.vt-cadre { position: relative; border: 2px solid var(--ed-orange, #FF7100); border-radius: 6px; background: #000; box-shadow: 0 0 40px rgba(255,113,0,.25), 0 14px 40px rgba(0,0,0,.8); overflow: hidden; }
.vt-cadre::after { content: ''; position: absolute; inset: 0; background: linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,.2) 50%); background-size: 100% 4px; pointer-events: none; }
.vt-cadre img { display: none; width: 100%; height: auto; }
.vt-cadre img.contenir { height: 520px; object-fit: contain; object-position: center; background: radial-gradient(circle at 50% 40%, #0a1824, #000); }
.vt-cadre img.on { display: block; }
.vt-fondu { position: absolute; left: 0; right: 0; bottom: 0; height: 90px; background: linear-gradient(transparent, #000); pointer-events: none; }
.vt-fondu.off { display: none; }
.vt-pied { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.vt-etiq { color: var(--ed-orange, #FF7100); font-size: .68em; letter-spacing: 2px; margin-top: 8px; white-space: nowrap; }
.vt-legende { color: #888; font-size: .82em; margin-top: 8px; min-height: 1.2em; }
.vt-vign { display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
.vt-vign button { width: 150px; padding: 0; background: none; border: 0; cursor: pointer; font-family: inherit; text-align: left; }
.vt-vign i { display: block; height: 72px; border: 1px solid #444; background-size: cover; background-position: top left; opacity: .7; transition: .2s; }
.vt-vign button:hover i { opacity: 1; }
.vt-vign button.on i { border-color: var(--ed-orange, #FF7100); opacity: 1; box-shadow: 0 0 12px rgba(255,113,0,.4); }
.vt-vign span { display: block; color: #888; font-size: .66em; letter-spacing: 2px; margin-top: 4px; }
.vt-vign button.on span { color: var(--ed-orange, #FF7100); }
@media (max-width: 900px) { .vt-acc { grid-template-columns: 1fr; gap: 16px; } .vt-cadre img.contenir { height: 360px; } }
`;

    function echapper(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

    function construire(m, titrePage, sousTitre) {
        const imgs = m.vues.map((v, i) => '<img class="' + (i === 0 ? 'on ' : '') + (v.contenir ? 'contenir' : '') + '" data-i="' + i + '" src="' + v.img + '" alt="' + echapper(v.nom) + '"' + (i ? ' loading="lazy"' : '') + '>').join('');
        const vign = m.vues.map((v, i) => '<button type="button" class="' + (i === 0 ? 'on' : '') + '" data-i="' + i + '"><i style="background-image:url(\'' + v.img + '\')"></i><span>' + echapper(v.nom) + '</span></button>').join('');
        return '<div class="vt">'
            + '<div class="vt-titre"><h3>&gt; ' + titrePage + '</h3><span>' + sousTitre + '</span></div>'
            + '<div class="bloc cy"><div class="vt-acc"><div>'
            + '<span class="vt-kick">' + m.kick + '</span><h4>' + m.titre + '</h4><p>' + m.phrase + '</p>'
            + '<a class="vt-btn" href="index.html">J’AI UN CODE D’INVITATION<small>Le reste du site reste accessible</small></a></div>'
            + '<div class="vt-col"><span class="vt-e"><b>1</b>Trouvez ou créez un escadron en jeu</span><span class="vt-e"><b>2</b>Demandez son code d’invitation</span><span class="vt-e"><b>3</b>Saisissez-le au Quartier général</span></div></div></div>'
            + '<div><div class="vt-cadre">' + imgs + '<div class="vt-fondu"></div></div>'
            + '<div class="vt-pied"><div class="vt-legende">' + echapper(m.vues[0].legende) + '</div><span class="vt-etiq">APERÇU · DONNÉES D’EXEMPLE</span></div>'
            + '<div class="vt-vign">' + vign + '</div></div></div>';
    }

    // cle : 'bgs' ou 'escadron' ; profil : la ligne profils du pilote (deja chargee par la page)
    window.afficherVitrineModule = function (cle, profil) {
        const m = MODULES[cle]; if (!m) return;
        window.profilCommandant = profil;
        if (typeof window.actualiserHeader === 'function') window.actualiserHeader(profil);
        const cleApi = document.getElementById('api-key-display'); if (cleApi && profil.cle_api) cleApi.innerText = profil.cle_api;
        const zone = document.getElementById('display-area'); if (!zone) return;
        if (!document.getElementById('vt-css')) { const s = document.createElement('style'); s.id = 'vt-css'; s.textContent = CSS; document.head.appendChild(s); }
        zone.innerHTML = construire(m, cle === 'bgs' ? 'BGS' : 'ESCADRON', 'RÉSERVÉ AUX MEMBRES D’UN ESCADRON');
        const cadre = zone.querySelector('.vt-cadre'), leg = zone.querySelector('.vt-legende'), fondu = zone.querySelector('.vt-fondu');
        zone.querySelector('.vt-vign').addEventListener('click', e => {
            const b = e.target.closest('button'); if (!b) return;
            const i = parseInt(b.dataset.i);
            zone.querySelectorAll('.vt-vign button').forEach(x => x.classList.toggle('on', x === b));
            cadre.querySelectorAll('img').forEach(x => x.classList.toggle('on', parseInt(x.dataset.i) === i));
            fondu.classList.toggle('off', !m.vues[i].fondu);
            leg.textContent = m.vues[i].legende;
            if (typeof window.sonHover === 'function') window.sonHover();
        });
        const ui = document.getElementById('main-ui');
        if (ui) { ui.style.display = 'flex'; ui.style.opacity = '1'; }
        if (typeof window.demarrerSystemLoop === 'function') window.demarrerSystemLoop();
    };
})();
