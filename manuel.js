// MANUEL : sommaire (chapitre en cours surligne, ouverture sur telephone), filtre par profil, recherche, mini-sommaire de chaque chapitre. Aucune donnee, aucun appel reseau.
(function () {
    'use strict';
    var chaps = [].slice.call(document.querySelectorAll('.chap'));
    var som = document.getElementById('sommaire');
    var zone = document.getElementById('display-area');

    // ---------- identifiants des titres (ancres des resultats de recherche et du mini-sommaire) ----------
    function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); }
    function slug(s) { return norm(s).replace(/ /g, '-').slice(0, 48); }
    chaps.forEach(function (c) {
        [].slice.call(c.querySelectorAll('h3')).forEach(function (h, i) { if (!h.id) h.id = c.id + '-' + (slug(h.textContent) || ('s' + i)); });
    });

    // ---------- mini-sommaire : « Dans ce chapitre » (a partir des titres du chapitre, sauf les tutos qui ont leur propre liste) ----------
    chaps.forEach(function (c) {
        if (c.id === 'tutos') return;
        var hs = [].slice.call(c.querySelectorAll(':scope > h3'));
        if (hs.length < 3) return;
        var nav = document.createElement('nav'); nav.className = 'mini'; nav.setAttribute('aria-label', 'Dans ce chapitre');
        nav.innerHTML = '<b>DANS CE CHAPITRE</b>' + hs.map(function (h) { return '<a href="#' + h.id + '">' + h.textContent.charAt(0) + h.textContent.slice(1).toLowerCase() + '</a>'; }).join('');
        var ref = c.querySelector(':scope > .retenir') || c.querySelector(':scope > .pourquoi');
        if (ref) ref.insertAdjacentElement('afterend', nav);
    });

    // ---------- sommaire : chapitre en cours ----------
    var liens = [].slice.call(document.querySelectorAll('#parcours a[href^="#"], #chapitres a[href^="#"]'));
    function marquer(id) { liens.forEach(function (a) { a.classList.toggle('actif', a.getAttribute('href') === '#' + id); }); }
    if ('IntersectionObserver' in window) {
        var obs = new IntersectionObserver(function (es) {
            es.forEach(function (e) { if (e.isIntersecting) marquer(e.target.id); });
        }, { root: zone, rootMargin: '0px 0px -70% 0px', threshold: 0 });
        chaps.forEach(function (c) { obs.observe(c); });
    }
    if (som) som.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a[href^="#"]')) som.classList.remove('ouvert'); });
    var bf = document.getElementById('btn-fermer');
    if (bf && som) bf.addEventListener('click', function () { som.classList.remove('ouvert'); });
    var bt = document.getElementById('btn-sommaire');
    if (bt && som) bt.addEventListener('click', function () { som.classList.toggle('ouvert'); });

    // ---------- filtre par profil : chapitres, tutos et raccourcis « Je veux… » ----------
    var boutons = [].slice.call(document.querySelectorAll('.filtre button'));
    function convient(el, p) { return p === 'tout' || (el.getAttribute('data-p') || '').split(' ').indexOf(p) >= 0; }
    boutons.forEach(function (b) {
        b.addEventListener('click', function () {
            var p = b.getAttribute('data-p');
            boutons.forEach(function (x) { x.classList.toggle('on', x === b); });
            chaps.forEach(function (c) {
                var voulu = convient(c, p);
                c.hidden = !voulu;
                var li = document.querySelector('#chapitres a[href="#' + c.id + '"]');
                if (li && li.parentNode) li.parentNode.hidden = !voulu;
            });
            [].slice.call(document.querySelectorAll('.tuto[data-p], .lecon[data-p], .jeveux a[data-p]')).forEach(function (t) { t.hidden = !convient(t, p); });
        });
    });

    // ---------- recherche : titres de sections et tutos, avec un extrait ----------
    var champ = document.getElementById('rech'), res = document.getElementById('rech-res'), liste = document.getElementById('chapitres');
    var index = [];
    // texte lisible d'un element : un espace apres chaque bloc (sinon « jeu2 min » : les mots de deux elements se collent)
    function txt(el) {
        var d = document.createElement('div');
        d.innerHTML = el.innerHTML.replace(/<\/(li|p|div|h3|h4|header|figcaption|summary|ul|ol|span|b)>/g, '</$1> ').replace(/<br\s*\/?>/g, ' ');
        return (d.textContent || '').replace(/\s+/g, ' ').trim();
    }
    function texteDe(debut, arret) {
        var t = '', n = debut.nextElementSibling;
        while (n && !arret(n)) { t += ' ' + txt(n); n = n.nextElementSibling; }
        return t.replace(/\s+/g, ' ').trim();
    }
    chaps.forEach(function (c) {
        var titreChap = (c.querySelector('h2') || {}).textContent || '';
        [].slice.call(c.querySelectorAll(':scope > h3')).forEach(function (h) {
            index.push({ id: h.id, titre: h.textContent, chap: titreChap, texte: texteDe(h, function (n) { return n.tagName === 'H3' || n.classList.contains('suite'); }) });
        });
        [].slice.call(c.querySelectorAll('.tuto, .lecon')).forEach(function (t) {
            var h = t.querySelector('h3'); if (!h) return;
            index.push({ id: t.id, titre: h.textContent, chap: 'Tutos', texte: txt(t) });
        });
        if (c.id !== 'tutos') index.push({ id: c.id, titre: titreChap, chap: 'Chapitre', texte: txt(c.querySelector('.pourquoi') || c) + ' ' + (c.querySelector('.retenir') ? txt(c.querySelector('.retenir')) : '') });
    });
    index.forEach(function (e) { e.nt = norm(e.titre); e.nx = norm(e.texte); });
    function chercher(q) {
        var mots = norm(q).split(' ').filter(function (m) { return m.length > 1; });
        if (!mots.length) return [];
        return index.map(function (e) {
            var s = 0;
            for (var i = 0; i < mots.length; i++) {
                var m = mots[i], dt = e.nt.indexOf(m) >= 0, dx = e.nx.indexOf(m) >= 0;
                if (!dt && !dx) return null;       // tous les mots doivent figurer
                s += dt ? 5 : 1;
            }
            if (e.chap === 'Tutos') s += 2;
            return { e: e, s: s };
        }).filter(Boolean).sort(function (a, b) { return b.s - a.s; }).slice(0, 8).map(function (r) { return r.e; });
    }
    function extrait(e, q) {
        var mots = norm(q).split(' ').filter(function (m) { return m.length > 1; }), t = e.texte, bas = t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        var p = bas.indexOf(mots[0]); if (p < 0) p = 0;
        var a = Math.max(0, p - 40);
        if (a > 0) { var sp = t.lastIndexOf(' ', a); if (sp >= 0 && a - sp < 20) a = sp + 1; }   // commence au debut d'un mot
        return (a > 0 ? '… ' : '') + t.slice(a, a + 120) + (a + 120 < t.length ? ' …' : '');
    }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    if (champ && res && liste) {
        champ.addEventListener('input', function () {
            var q = champ.value.trim();
            if (q.length < 2) { res.hidden = true; res.innerHTML = ''; liste.hidden = false; return; }
            var r = chercher(q);
            liste.hidden = true; res.hidden = false;
            res.innerHTML = r.length ? r.map(function (e) { return '<a href="#' + e.id + '"><b>' + esc(e.titre.charAt(0) + e.titre.slice(1).toLowerCase()) + '</b><small>' + esc(e.chap) + '</small><span>' + esc(extrait(e, q)) + '</span></a>'; }).join('')
                : '<p class="rien">Aucun résultat pour « ' + esc(q) + ' ». Essayez un autre mot, ou regardez le Dépannage.</p>';
        });
        res.addEventListener('click', function (e) {
            if (e.target.closest && e.target.closest('a[href^="#"]')) { if (som) som.classList.remove('ouvert'); }
        });
    }
})();
