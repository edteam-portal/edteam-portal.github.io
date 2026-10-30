// copier-lieux.js : partout ou un SYSTEME ou une STATION est affiche, un clic le COPIE (pour le coller dans la recherche de la carte de la galaxie du jeu).
// Fonctionnement, sans rien a saisir ni a brancher page par page :
//  1) le module APPREND les noms : il lit en silence les reponses JSON que la page recoit deja (base, EDSM, Spansh...) et garde la valeur des champs « systeme », « station », « sys », « st »... ;
//  2) il SURVEILLE la page : tout texte qui contient un nom appris (n'importe quelle casse) est entoure d'un petit repere cliquable (souligne en pointilles) ;
//  3) un clic copie le nom (avec sa vraie casse) et affiche « Copie : Nom ».
// Les noms appris sont gardes sur l'appareil (edteam_lieux_v1) pour que les ecrans remplis depuis une memoire locale en profitent aussi.
// Prudences : on ne touche ni aux liens, boutons, champs, scripts, ni aux endroits deja copiables ; un mot courant en minuscule n'est jamais pris pour un nom.
(function () {
    'use strict';
    if (window.EdteamCopie || window.EDTEAM_SANS_COPIE_LIEUX) return;

    var STOCK = 'edteam_lieux_v1', MAX = 4000, MIN = 4, LONG = 60;
    var noms = new Map();        // minuscule -> nom d'origine
    var premiers = new Map();    // premier mot (minuscule) -> noms complets (minuscules), du plus long au plus court
    var change = false, occupe = false, tStock = null, tScan = null;
    var file = new Set();        // noeuds ajoutes ou modifies, a examiner
    var BANALS = new Set(['port', 'station', 'systeme', 'système', 'inconnu', 'inconnue', 'aucun', 'aucune', 'unknown', 'none', 'null', 'undefined', 'home', 'nord', 'sud', 'true', 'false', 'oui', 'non', 'faction', 'pilote', 'escadron', 'mission', 'missions']);
    var MOT = /[\p{L}\p{N}][\p{L}\p{N}'’\-]*/gu;
    var CLE_OK = /^(?:sys|st|os|ost|stn)$|syst|station/i, CLE_NON = /type|(?:^|_)id$|^id|etat|state|faction|statut|status|dist|count|^nb|date|_at$|coord|url|lien|label|titre|texte|note/i;
    var SAUTE = /^(?:SCRIPT|STYLE|TEXTAREA|INPUT|SELECT|OPTION|BUTTON|A|SVG|TITLE|NOSCRIPT|CODE|PRE|CANVAS|IFRAME|HEAD|DATALIST|META|LINK)$/;
    var DEJA = '.edteam-lieu,[data-copie],.tb-cp,.ec-cp,.copy-click,[data-nocopie],[contenteditable],[contenteditable=""],[contenteditable="true"]';

    function valide(s) {
        return typeof s === 'string' && s.length >= MIN && s.length <= LONG && /[A-Za-zÀ-ÿ]/.test(s) && !/^\d+$/.test(s) && !/[<>{}\[\]=|@]|https?:/.test(s) && !BANALS.has(s.toLowerCase());
    }
    function premierMot(minuscule) { MOT.lastIndex = 0; var m = MOT.exec(minuscule); return m ? m[0] : ''; }
    function ajouterUn(nom) {
        nom = String(nom == null ? '' : nom).replace(/\s+/g, ' ').trim();
        if (!valide(nom)) return false;
        var k = nom.toLowerCase(); if (noms.has(k)) return false;
        var p = premierMot(k); if (!p) return false;
        noms.set(k, nom);
        var l = premiers.get(p); if (!l) { l = []; premiers.set(p, l); }
        l.push(k); l.sort(function (a, b) { return b.length - a.length; });
        return true;
    }
    function ajouter(liste) {
        var n = 0; (Array.isArray(liste) ? liste : [liste]).forEach(function (x) { if (ajouterUn(x)) n++; });
        if (n) { change = true; planifierStock(); planifierScan(); }
        return n;
    }
    function planifierStock() {
        clearTimeout(tStock);
        tStock = setTimeout(function () {
            try { var tous = Array.from(noms.values()); localStorage.setItem(STOCK, JSON.stringify(tous.slice(-MAX))); } catch (e) { /* stockage indisponible : on garde en memoire */ }
        }, 2500);
    }
    function charger() { try { var v = JSON.parse(localStorage.getItem(STOCK) || '[]'); if (Array.isArray(v)) v.forEach(ajouterUn); } catch (e) { /* rien */ } }

    // ---- 1) apprentissage : lecture silencieuse des reponses JSON deja recues par la page
    function moissonObjet(o, cle, prof, etat) {
        if (etat.n++ > 60000 || prof > 8 || o == null) return;
        if (typeof o === 'string') { if (cle && CLE_OK.test(cle) && !CLE_NON.test(cle)) etat.trouves.push(o); return; }
        if (Array.isArray(o)) { for (var i = 0; i < o.length && i < 3000; i++) moissonObjet(o[i], cle, prof + 1, etat); return; }
        if (typeof o === 'object') { for (var k in o) { if (Object.prototype.hasOwnProperty.call(o, k)) moissonObjet(o[k], k, prof + 1, etat); } }
    }
    function moissonTexte(t) {
        var re = /"([A-Za-z_]{1,40})"\s*:\s*"((?:[^"\\]|\\.){1,80})"/g, m, trouves = [];
        while ((m = re.exec(t))) {
            if (CLE_OK.test(m[1]) && !CLE_NON.test(m[1])) { var v = m[2]; if (v.indexOf('\\') >= 0) { try { v = JSON.parse('"' + v + '"'); } catch (e) { continue; } } trouves.push(v); }
        }
        return trouves;
    }
    function brancherReponses() {
        if (typeof Response === 'undefined' || !Response.prototype) return;
        ['text', 'json'].forEach(function (nom) {
            var orig = Response.prototype[nom]; if (typeof orig !== 'function') return;
            Response.prototype[nom] = function () {
                var p = orig.apply(this, arguments);
                try {
                    var ct = (this.headers && this.headers.get && this.headers.get('content-type')) || '';
                    if (/json/i.test(ct) && p && typeof p.then === 'function') {
                        p.then(function (r) {
                            try {
                                if (typeof r === 'string') { if (r.length < 4e6) ajouter(moissonTexte(r)); }
                                else { var etat = { n: 0, trouves: [] }; moissonObjet(r, '', 0, etat); ajouter(etat.trouves); }
                            } catch (e) { /* jamais bloquant */ }
                        }, function () { });
                    }
                } catch (e) { /* jamais bloquant */ }
                return p;
            };
        });
    }

    // ---- 2) reperage dans un texte
    function trouver(texte) {
        var L = texte.toLowerCase(); if (L.length !== texte.length) return [];
        var res = [], m; MOT.lastIndex = 0;
        while ((m = MOT.exec(L))) {
            var cands = premiers.get(m[0]); if (!cands) continue;
            for (var i = 0; i < cands.length; i++) {
                var nl = cands[i], fin = m.index + nl.length;
                if (L.substr(m.index, nl.length) !== nl) continue;
                var c = L.charAt(fin), c2 = L.charAt(fin + 1);
                if (c && (/[\p{L}\p{N}_]/u.test(c) || (/['’\-]/.test(c) && /[\p{L}\p{N}]/u.test(c2)))) continue;   // le nom continue : ce n'est pas lui
                var a = texte.charAt(m.index);
                if (a.toLowerCase() === a && a.toUpperCase() !== a) continue;                                         // « lave » en minuscule : un mot, pas un systeme
                res.push({ debut: m.index, fin: fin, nom: noms.get(nl) }); MOT.lastIndex = fin; break;
            }
        }
        return res;
    }
    function ignore(el) {
        for (var e = el; e && e.nodeType === 1; e = e.parentNode) { if (SAUTE.test(e.tagName) || (e.matches && e.matches(DEJA))) return true; if (e === document.body) break; }
        return false;
    }
    function envelopper(noeud) {
        var t = noeud.nodeValue; if (!t || t.length < MIN) return;
        var tr = trouver(t); if (!tr.length) return;
        var frag = document.createDocumentFragment(), pos = 0;
        tr.forEach(function (x) {
            if (x.debut > pos) frag.appendChild(document.createTextNode(t.slice(pos, x.debut)));
            var s = document.createElement('span'); s.className = 'edteam-lieu'; s.setAttribute('data-lieu', x.nom); s.title = 'Cliquer pour copier : ' + x.nom; s.textContent = t.slice(x.debut, x.fin);
            frag.appendChild(s); pos = x.fin;
        });
        if (pos < t.length) frag.appendChild(document.createTextNode(t.slice(pos)));
        noeud.parentNode.replaceChild(frag, noeud);
    }
    function scanner(racine) {
        if (!noms.size || !racine || !document.body) return;
        var r = racine.nodeType === 3 ? racine.parentNode : racine; if (!r || r.nodeType !== 1 || !r.isConnected || ignore(r)) return;
        var liste = [], w = document.createTreeWalker(r, NodeFilter.SHOW_TEXT, null, false), n;
        while ((n = w.nextNode())) { if (n.nodeValue.length >= MIN && !ignore(n.parentNode)) liste.push(n); }
        if (!liste.length) return;
        occupe = true;
        try { liste.forEach(function (x) { if (x.parentNode) envelopper(x); }); } finally { occupe = false; }
        try { obs.takeRecords(); } catch (e) { /* rien */ }
    }
    function planifierScan() {
        if (tScan) return;
        tScan = setTimeout(function () {
            tScan = null;
            if (change) { change = false; file.clear(); scanner(document.body); return; }   // nouveaux noms appris : on relit toute la page
            var a = Array.from(file); file.clear(); a.forEach(function (n) { scanner(n); });
        }, 160);
    }

    // ---- 3) copie
    function toast(txt) {
        var t = document.getElementById('edteam-copie-toast');
        if (!t) { t = document.createElement('div'); t.id = 'edteam-copie-toast'; document.body.appendChild(t); }
        t.textContent = 'Copié : ' + txt; t.classList.add('on'); clearTimeout(t._m); t._m = setTimeout(function () { t.classList.remove('on'); }, 1600);
    }
    function copier(txt, el) {
        txt = String(txt == null ? '' : txt); if (!txt) return;
        var fin = function () { toast(txt); try { if (typeof sonClic === 'function') sonClic(); } catch (e) { /* rien */ } if (el && el.classList) { el.classList.add('copie'); setTimeout(function () { el.classList.remove('copie'); }, 900); } };
        var repli = function () { var a = document.createElement('textarea'); a.value = txt; a.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); fin(); } catch (e) { /* copie impossible */ } a.remove(); };
        try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(fin, repli); else repli(); } catch (e) { repli(); }
    }
    function style() {
        if (document.getElementById('edteam-copie-css')) return;
        var s = document.createElement('style'); s.id = 'edteam-copie-css';
        s.textContent = '.edteam-lieu{cursor:copy;text-decoration:underline dotted rgba(170,190,200,.5);text-underline-offset:3px;text-decoration-thickness:1px;transition:.12s}'
            + '.edteam-lieu:hover{background:rgba(255,113,0,.2);color:#fff;text-shadow:0 0 6px rgba(255,113,0,.8)}.edteam-lieu.copie{background:rgba(0,255,102,.2);color:#00FF66}'
            + '#edteam-copie-toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%);background:#000;border:1px solid #00FF66;color:#00FF66;padding:8px 18px;z-index:2147483000;opacity:0;pointer-events:none;transition:opacity .2s;font-family:inherit;font-weight:600;font-size:.9rem;line-height:1.3;letter-spacing:1px;max-width:80vw;overflow-wrap:anywhere;text-align:center}#edteam-copie-toast.on{opacity:1}';
        (document.head || document.documentElement).appendChild(s);
    }

    var obs = new MutationObserver(function (muts) {
        if (occupe) return;
        muts.forEach(function (m) {
            if (m.type === 'characterData') { if (m.target.parentNode) file.add(m.target.parentNode); return; }
            m.addedNodes.forEach(function (n) { if (n.nodeType === 1 || n.nodeType === 3) file.add(n); });
        });
        if (file.size) planifierScan();
    });

    function demarrer() {
        style();
        document.addEventListener('click', function (e) {
            var s = e.target && e.target.closest ? e.target.closest('.edteam-lieu') : null;
            if (s) { e.stopPropagation(); e.preventDefault(); copier(s.getAttribute('data-lieu'), s); }   // comme les copies existantes : le clic ne fait que copier
        }, true);
        obs.observe(document.body, { childList: true, subtree: true, characterData: true });
        scanner(document.body);
    }

    charger(); brancherReponses();
    window.EdteamCopie = {
        ajouter: ajouter, copier: copier, scanner: scanner,
        connus: function () { return noms.size; },
        // pour un affichage fabrique a la main : EdteamCopie.lieu('Veroandi') ou EdteamCopie.lieu('Veroandi', 'VEROANDI')
        lieu: function (nom, aff) { var n = String(nom == null ? '' : nom); if (!n) return ''; var e = function (x) { return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }; return '<span class="edteam-lieu" data-lieu="' + e(n) + '" title="Cliquer pour copier : ' + e(n) + '">' + e(aff == null ? n : aff) + '</span>'; }
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer); else demarrer();
})();
