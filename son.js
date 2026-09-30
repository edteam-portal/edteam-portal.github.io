// Interrupteur de son commun a toutes les pages (a charger AVANT navigation.js / tout script qui cree un AudioContext).
// Principe : chaque AudioContext recoit un volume general (GainNode) place devant sa sortie ; couper le son = volume a 0.
// Cela couvre d'un coup tous les sons du site (survol, clics, alertes de messages, COVAS, musique d'ambiance)
// sans modifier chacun d'eux, et sans mettre de son en file d'attente pendant la coupure.
// Le choix est memorise dans le navigateur (localStorage, cle edteam_son = "off").
// Tout element portant l'attribut data-son-toggle devient un bouton haut-parleur automatiquement.
(function () {
    'use strict';
    if (window.edteamSon) return;

    var CLE = 'edteam_son';
    function lireMuet() { try { return localStorage.getItem(CLE) === 'off'; } catch (e) { return false; } }
    var muet = lireMuet();
    var maitres = [];

    // ---- volume general devant la sortie de chaque AudioContext ----
    var Base = window.BaseAudioContext || window.AudioContext || window.webkitAudioContext;
    if (Base && Base.prototype) {
        var desc = Object.getOwnPropertyDescriptor(Base.prototype, 'destination');
        if (desc && desc.get) {
            Object.defineProperty(Base.prototype, 'destination', {
                configurable: true,
                enumerable: desc.enumerable,
                get: function () {
                    if (window.OfflineAudioContext && this instanceof window.OfflineAudioContext) return desc.get.call(this);
                    if (!this.__edteamMaitre) {
                        var g = this.createGain();
                        g.gain.value = muet ? 0 : 1;
                        g.connect(desc.get.call(this));
                        this.__edteamMaitre = g;
                        maitres.push(g);
                    }
                    return this.__edteamMaitre;
                }
            });
        }
    }

    // ---- interface ----
    var SVG_ON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
    var SVG_OFF = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';

    function majUI() {
        var titre = muet ? 'Le son est coupé : cliquer pour l\'activer' : 'Couper le son du site';
        document.querySelectorAll('[data-son-toggle]').forEach(function (b) {
            b.innerHTML = muet ? SVG_OFF : SVG_ON;
            b.title = titre;
            b.setAttribute('aria-label', titre);
            b.setAttribute('aria-pressed', muet ? 'true' : 'false');
            b.setAttribute('data-muet', muet ? '1' : '0');
        });
    }

    function appliquer() {
        maitres.forEach(function (g) {
            try { g.gain.cancelScheduledValues(0); g.gain.value = muet ? 0 : 1; } catch (e) { /* contexte ferme */ }
        });
        majUI();
        try { window.dispatchEvent(new CustomEvent('edteam-son', { detail: { muet: muet } })); } catch (e) { /* ancien navigateur */ }
    }

    function definir(m) {
        muet = !!m;
        try { if (muet) localStorage.setItem(CLE, 'off'); else localStorage.removeItem(CLE); } catch (e) { /* stockage indisponible : valable pour la page seulement */ }
        appliquer();
    }

    window.edteamSon = {
        estMuet: function () { return muet; },
        definir: definir,
        basculer: function () { definir(!muet); },
        majUI: majUI
    };

    // style commun des boutons haut-parleur (les pages peuvent le surcharger)
    var st = document.createElement('style');
    st.textContent = '[data-son-toggle]{cursor:pointer}'
        + '.son-btn{display:inline-flex;align-items:center;justify-content:center;width:34px;height:30px;padding:0;background:transparent;color:#888;border:1px solid rgba(255,255,255,.18);border-radius:4px;transition:.2s}'
        + '.son-btn:hover{color:var(--ed-blue,#00F0FF);border-color:var(--ed-blue,#00F0FF)}'
        + '.son-btn[data-muet="1"],.ft-son[data-muet="1"]{color:#FF3333;border-color:rgba(255,51,51,.6)}';
    (document.head || document.documentElement).appendChild(st);

    document.addEventListener('click', function (e) {
        var b = e.target && e.target.closest ? e.target.closest('[data-son-toggle]') : null;
        if (b) { e.preventDefault(); window.edteamSon.basculer(); }
    });
    // le stockage peut changer depuis un autre onglet
    window.addEventListener('storage', function (e) { if (e.key === CLE) { muet = lireMuet(); appliquer(); } });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', majUI); else majUI();
})();
