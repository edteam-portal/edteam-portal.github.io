// MANUEL : sommaire (chapitre en cours surligne, ouverture sur telephone) et filtre par profil. Aucune donnee, aucun appel reseau.
(function () {
    'use strict';
    var liens = [].slice.call(document.querySelectorAll('.sommaire a[href^="#"]'));
    var chaps = [].slice.call(document.querySelectorAll('.chap'));
    var som = document.getElementById('sommaire');

    function marquer(id) { liens.forEach(function (a) { a.classList.toggle('actif', a.getAttribute('href') === '#' + id); }); }
    if ('IntersectionObserver' in window) {
        var obs = new IntersectionObserver(function (es) {
            es.forEach(function (e) { if (e.isIntersecting) marquer(e.target.id); });
        }, { root: document.getElementById('display-area'), rootMargin: '0px 0px -70% 0px', threshold: 0 });
        chaps.forEach(function (c) { obs.observe(c); });
    }
    liens.forEach(function (a) { a.addEventListener('click', function () { if (som) som.classList.remove('ouvert'); }); });

    var bf = document.getElementById('btn-fermer');
    if (bf && som) bf.addEventListener('click', function () { som.classList.remove('ouvert'); });
    var bt = document.getElementById('btn-sommaire');
    if (bt && som) bt.addEventListener('click', function () { som.classList.toggle('ouvert'); });

    // filtre par profil : « tout » montre tout ; sinon seuls les chapitres qui concernent ce profil restent
    var boutons = [].slice.call(document.querySelectorAll('.filtre button'));
    boutons.forEach(function (b) {
        b.addEventListener('click', function () {
            var p = b.getAttribute('data-p');
            boutons.forEach(function (x) { x.classList.toggle('on', x === b); });
            chaps.forEach(function (c) {
                var voulu = p === 'tout' || (c.getAttribute('data-p') || '').split(' ').indexOf(p) >= 0;
                c.hidden = !voulu;
                var li = document.querySelector('.sommaire a[href="#' + c.id + '"]');
                if (li && li.parentNode) li.parentNode.hidden = !voulu;
            });
        });
    });
})();
