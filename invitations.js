// Invitations a des campagnes (SQL 171) : bouton ENGAGEMENT du menu qui clignote, invitation plein ecran, mode invite de la page BGS (appels serveur limites aux campagnes ou le pilote participe),
// pastilles SOLITAIRE / ALLIE · TAG. Un seul appel serveur (mes_invitations), memoire de 2 minutes ; sans la fonction serveur, rien ne s'affiche.
(function () {
    if (window.edteamInvitations) return;
    var CLE = 'edteam_invitations_v2', TTL = 30000, PLUS_TARD = 'edteam_invitations_plus_tard';
    var etat = null, enCours = null, monUid = null;

    function db() { return window.supabaseApp || (typeof supabaseApp !== 'undefined' ? supabaseApp : null); }
    function lire(k, s) { try { return (s ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } }
    function ecrire(k, v, s) { try { (s ? sessionStorage : localStorage).setItem(k, v); } catch (e) { /* stockage indisponible */ } }
    function e(t) { return typeof escapeHtml === 'function' ? escapeHtml(t) : String(t == null ? '' : t); }
    function sans(p) { var x = String(p && p.escadron_id || '').trim().toUpperCase(); return !x || x === 'INDEPENDANT'; }

    function css() {
        if (document.getElementById('edteam-inv-css')) return;
        var s = document.createElement('style'); s.id = 'edteam-inv-css';
        s.textContent = '@keyframes edteamInvClg { 0%,100% { box-shadow: none; } 50% { box-shadow: 0 0 14px #FF7100, inset 0 0 8px #FF7100; } }'
            + '#nav-bgs-factions.invite-clignote, #nav-btn-bgs.invite-clignote { animation: edteamInvClg 1.6s infinite; }'
            + '.inv-pastille { display:inline-block; font-size:.62em; letter-spacing:2px; padding:1px 6px; border:1px solid; vertical-align:middle; margin-left:8px; white-space:nowrap; }'
            + '.inv-pastille.sol { color:#ffb347; border-color:#ffb347; background:rgba(255,179,71,.08); } .inv-pastille.all { color:#3ec9ff; border-color:#3ec9ff; background:rgba(62,201,255,.08); }'
            // tampon « SOUTIEN ALLIES » (meme style que le tampon REPERE du reperage, mais droit) : cadre net, lettres espacees, lueur
            + '.inv-tampon { display:inline-block; color:#3ec9ff; border:2px solid #3ec9ff; padding:1px 10px; font-weight:bold; letter-spacing:3px; font-size:.72em; opacity:.92; box-shadow:inset 0 0 0 1px rgba(62,201,255,.35); text-shadow:0 0 6px rgba(62,201,255,.35); white-space:nowrap; vertical-align:middle; cursor:help; }'
            + '.inv-mini { display:inline-block; font:bold .62em/1 sans-serif; padding:2px 4px; margin-left:6px; border:1px solid; border-radius:2px; vertical-align:middle; letter-spacing:0; }'
            + '.inv-mini.sol { color:#ffb347; border-color:#ffb347; } .inv-mini.all { color:#3ec9ff; border-color:#3ec9ff; }'
            + '.exploit-row.inv-ligne-all { box-shadow:inset 0 0 0 1px rgba(62,201,255,.4); } .exploit-row.inv-ligne-sol { box-shadow:inset 0 0 0 1px rgba(255,179,71,.4); }'
            + '.inv-av { position:relative; display:inline-flex; } .inv-av > i { position:absolute; right:0; bottom:0; width:14px; height:14px; border-radius:50%; box-shadow:0 0 0 1px #0a0a0a; font:bold 9px/14px sans-serif; text-align:center; font-style:normal; color:#000; z-index:3; }'
            + '.inv-av > i.sol { background:#ffb347; } .inv-av > i.all { background:#3ec9ff; }'
            + '.camp-avs .inv-av > i, .mc-avs .inv-av > i { display:none; } .dir-avs .inv-av > .ph { margin-left:0; } .dir-avs .inv-av { margin-left:-7px; } .dir-avs > .inv-av:first-child { margin-left:0; } .inv-av.all > .ph { outline:2px solid #3ec9ff; outline-offset:-2px; } .inv-av.sol > .ph { outline:2px solid #ffb347; outline-offset:-2px; }'
            + '#edteam-inv-overlay { position:fixed; inset:0; z-index:99999; background:radial-gradient(ellipse at center, rgba(8,14,24,.94), rgba(0,0,0,.97)); display:flex; align-items:center; justify-content:center; }'
            + '#edteam-inv-overlay .inv-carte { width:640px; max-width:92vw; text-align:center; border:1px solid #FF7100; box-shadow:0 0 40px rgba(255,113,0,.35); background:rgba(10,8,6,.95); padding:38px 44px; }'
            + '#edteam-inv-overlay .inv-kick { color:#FF7100; letter-spacing:6px; font-size:.8em; } #edteam-inv-overlay .inv-nom { color:#fff; font-size:1.9em; letter-spacing:5px; margin:16px 0 6px; text-shadow:0 0 14px #FF7100; }'
            + '#edteam-inv-overlay .inv-sous { color:#8aa; letter-spacing:2px; margin-bottom:22px; } #edteam-inv-overlay .inv-txt { color:#cfd8dc; line-height:1.6; margin-bottom:26px; }'
            + '#edteam-inv-overlay button { font-family:inherit; letter-spacing:3px; padding:10px 30px; margin:0 6px; cursor:pointer; background:transparent; }'
            + '#edteam-inv-overlay .ok { border:1px solid #2ecc71; color:#2ecc71; background:rgba(46,204,113,.08); } #edteam-inv-overlay .no { border:1px solid #ff4a4a; color:#ff4a4a; }'
            + '#edteam-inv-overlay .plus { border:0; color:#778; letter-spacing:2px; font-size:.8em; margin-top:18px; display:block; margin-left:auto; margin-right:auto; }'
            + '@media (max-width:600px) { #edteam-inv-overlay .inv-carte { padding:26px 16px; } #edteam-inv-overlay .inv-nom { font-size:1.4em; letter-spacing:3px; } #edteam-inv-overlay button { margin:6px 4px; } }'
            + 'body.mode-invite #btn-journal-bgs, body.mode-invite #btn-nouvelle-campagne, body.mode-invite #btn-rapport-discord, body.mode-invite #btn-initiative, body.mode-invite #bgs-mode-ini, body.mode-invite #bgs-propositions,'
            + 'body.mode-invite #bgs-ini-titre, body.mode-invite #bgs-duo-ordres, body.mode-invite #bgs-veille, body.mode-invite #bgs-accueil-haut, body.mode-invite #bgs-titres-acc, body.mode-invite #bgs-comment,'
            + 'body.mode-invite #bgs-aide-engagement, body.mode-invite .rp-bandeau, body.mode-invite #rp-zone { display:none !important; }';
        document.head.appendChild(s);
    }

    function abreger(nom) {
        var m = String(nom || '').toUpperCase().split(/\s+/).filter(function (x) { return x.length > 1; });
        return m.length >= 2 ? m.map(function (x) { return x[0]; }).join('').slice(0, 4) : String(nom || '').toUpperCase().slice(0, 3);
    }
    function acteur(uid) { return (window.cacheActeurs || {})[uid] || null; }
    // vu PAR LE LECTEUR : null si c'est lui ou un pilote de SON escadron ; sinon { k: 'ALLIE' (avec e = son escadron) | 'SOLITAIRE' }
    function normE(t) { var s = String(t || '').trim().replace(/\s+/g, ' ').toUpperCase(); return s === 'INDEPENDANT' ? '' : s; }
    function acteurVu(uid) {
        var a = acteur(uid); if (!a) return null;
        var moi = null; try { moi = window.profilReelInvite || ((typeof profilCommandant !== 'undefined') ? profilCommandant : null); } catch (x) { moi = null; }
        if (moi && String(moi.user_id) === String(uid)) return null;
        var ee = normE(a.e), mon = normE(moi && moi.escadron_id);
        if (ee && mon && ee === mon) return null;
        return { k: ee ? 'ALLIE' : 'SOLITAIRE', e: a.e, n: a.n };
    }

    // memoire de 30 s PAR PILOTE (un autre compte dans le meme onglet ne reprend pas l'etat du precedent) ; le QG relit toujours (arrivee apres la connexion)
    function charger(force, uid) {
        if (uid) { if (monUid && monUid !== uid) etat = null; monUid = uid; }
        if (!force && etat) return Promise.resolve(etat);
        if (!force) { try { var c = JSON.parse(lire(CLE, true) || 'null'); if (c && Date.now() - c.ts < TTL && (!uid || c.u === uid)) { etat = c.d; return Promise.resolve(etat); } } catch (x) { /* memoire illisible */ } }
        if (enCours && !force) return enCours;
        var d = db(); if (!d) return Promise.resolve(null);
        enCours = d.rpc('mes_invitations').then(function (r) {
            enCours = null;
            if (r.error || !r.data || typeof r.data !== 'object') return null;   // fonction absente : rien
            etat = r.data; ecrire(CLE, JSON.stringify({ ts: Date.now(), u: monUid, d: etat }), true); return etat;
        }, function () { enCours = null; return null; });
        return enCours;
    }
    function invalider() { etat = null; try { sessionStorage.removeItem(CLE); } catch (x) { /* ignore */ } }

    function nbAttente(s) { return s ? (s.pilote || []).length + (s.escadron || []).length : 0; }

    function menu(s, independant) {
        var lien = document.getElementById('nav-bgs-factions') || document.getElementById('nav-btn-bgs'); if (!lien) return;   // PC ou mobile
        var attente = nbAttente(s), actives = s ? Number(s.actives) || 0 : 0;
        ecrire('edteam_invite_actif', actives > 0 ? 'true' : 'false');
        if (independant && (actives > 0 || attente > 0)) lien.style.display = 'flex';
        css(); lien.classList.toggle('invite-clignote', attente > 0);
        // pilote sans escadron dont la seule raison d'entrer sur la page BGS est une invitation PAS ENCORE ACCEPTEE : le bouton rouvre l'invitation (la page BGS lui est fermee tant qu'il n'a rien accepte)
        lien.__invEtat = { s: s, independant: independant };
        if (!lien.__invClic) {
            lien.__invClic = true;
            lien.addEventListener('click', function (ev) {
                var c = lien.__invEtat; if (!c || !c.independant || !c.s) return;
                if (nbAttente(c.s) > 0 && !(Number(c.s.actives) > 0)) { ev.preventDefault(); ecrire(PLUS_TARD, '', true); overlay(c.s, true); }
            });
        }
    }

    function dateCourte(d) { try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }); } catch (x) { return ''; } }
    var TYPES = { ATTAQUE: 'ATTAQUE', DEFENSE: 'DÉFENSE', MAINTIEN: 'MAINTIEN', CONQUETE: 'CONQUÊTE' }, PRIOS = { 1: 'CRITIQUE', 2: 'HAUTE', 3: 'NORMALE' };

    function overlay(s, independant) {
        var vu = (lire(PLUS_TARD, true) || '').split(',');
        var liste = (s.pilote || []).map(function (i) { return { k: 'P', i: i }; }).concat((s.escadron || []).map(function (i) { return { k: 'E', i: i }; }))
            .filter(function (x) { return vu.indexOf(x.k + x.i.campagne_id) < 0; });
        var ancien = document.getElementById('edteam-inv-overlay'); if (ancien) ancien.remove();
        if (!liste.length) return;
        var x = liste[0], i = x.i; css();
        var txt = x.k === 'E'
            ? 'L\'escadron <b style="color:#fff">' + e(i.hote) + '</b> invite ton escadron à cette campagne. Si tu acceptes, tes pilotes pourront y participer.'
            : (i.via === 'ESCADRON'
                ? 'Ton Amiral a accepté cette campagne de <b style="color:#fff">' + e(i.hote) + '</b>. Veux-tu y participer ?'
                : '<b style="color:#fff">' + e(i.de ? 'CMDR ' + String(i.de).toUpperCase() : 'Un Amiral') + '</b> (' + e(i.hote) + ') t\'invite à participer à cette campagne.');
        var d = document.createElement('div'); d.id = 'edteam-inv-overlay';
        d.innerHTML = '<div class="inv-carte"><div class="inv-kick">INVITATION</div><div class="inv-nom">' + e(i.nom) + '</div>'
            + '<div class="inv-sous">CAMPAGNE · ' + e(TYPES[i.type] || i.type) + ' · PRIORITÉ ' + e(PRIOS[i.priorite] || '') + (i.echeance ? ' · JUSQU\'AU ' + e(dateCourte(i.echeance)) : '') + '</div>'
            + '<div class="inv-txt">' + txt + '</div>'
            + '<button type="button" class="ok" data-r="1">ACCEPTER</button><button type="button" class="no" data-r="0">REFUSER</button>'
            + '<button type="button" class="plus" data-r="-1">PLUS TARD</button></div>';
        document.body.appendChild(d);
        d.addEventListener('click', function (ev) {
            var b = ev.target.closest && ev.target.closest('button[data-r]'); if (!b) return;
            var r = b.getAttribute('data-r');
            if (r === '-1') { ecrire(PLUS_TARD, vu.concat([x.k + i.campagne_id]).join(','), true); overlay(s, independant); return; }
            b.disabled = true;
            var fn = x.k === 'E' ? 'repondre_invitation_escadron' : 'repondre_invitation';
            db().rpc(fn, { p_campagne: Number(i.campagne_id), p_accepte: r === '1' }).then(function () {
                if (typeof sonSucces === 'function' && r === '1') sonSucces();
                invalider();
                return charger(true);
            }).then(function (n) {
                if (n) { menu(n, independant); overlay(n, independant); }
                else { var o = document.getElementById('edteam-inv-overlay'); if (o) o.remove(); }
            });
        });
    }

    // appelle par navigation.js (actualiserHeader) a chaque page : etat des invitations, menu, invitation plein ecran
    function verifier(profil) {
        if (!profil || !profil.est_approuve || !db()) return Promise.resolve(null);
        var independant = sans(profil);
        var chemin = location.pathname, accueil = chemin.slice(-1) === "/" || chemin.slice(-7) === "qg.html" || chemin.slice(-10) === "index.html";
        return charger(accueil, profil.user_id).then(function (s) { if (!s) return null; menu(s, independant); if (nbAttente(s)) overlay(s, independant); return s; });
    }

    // MODE INVITE de la page BGS : seuls les appels serveur utiles sont autorises, et ils sont remplaces par leur version « invite » (SQL 171)
    var MAP = { bgs_directives_resume: 'invite_bgs_directives_resume', bgs_resultats: 'invite_bgs_resultats', directives_activite: 'invite_directives_activite',
                pp_missions_vue: 'invite_pp_missions_vue', col_missions_vue: 'invite_col_missions_vue', bgs_quotas_jour: 'invite_bgs_quotas_jour', carte_coords: 'invite_carte_coords', bgs_bilan_directive: 'invite_bgs_bilan_directive',
                bgs_evenements_conflit: 'invite_bgs_evenements_conflit', installations_hausse_resume: 'invite_installations_hausse_resume', installations_hausse: 'invite_installations_hausse',
                installation_confirmer: 'invite_installation_confirmer', routes_commerce: 'invite_routes_commerce', routes_perte: 'invite_routes_perte', routes_contrebande: 'invite_routes_contrebande',
                routes_destabiliser: 'invite_routes_destabiliser', routes_rendre: 'invite_routes_rendre' };
    // appels qui portent sur UNE directive (p_ordre) : version invite si la directive est celle d'une campagne alliee, sinon l'appel d'origine
    var PAR_ORDRE = { bgs_bilan_directive: 1, installations_hausse: 1, installation_confirmer: 1, routes_commerce: 1, routes_perte: 1, routes_contrebande: 1, routes_destabiliser: 1, routes_rendre: 1 };
    function ordreAllie(id) {
        var ids = (window.EDTEAM_ALLIEES || []).map(String), o = (window.cacheOrdresBgs || []).filter(function (x) { return String(x.id) === String(id); })[0];
        return !!o && ids.indexOf(String(o.campagne_id)) >= 0;
    }
    var PASSE = { mes_invitations: 1, repondre_invitation: 1, repondre_invitation_escadron: 1, campagnes_acteurs: 1, campagnes_partenaires: 1, invite_bgs_directives_resume: 1, invite_bgs_resultats: 1, invite_directives_activite: 1,
                  invite_pp_missions_vue: 1, invite_col_missions_vue: 1, invite_bgs_quotas_jour: 1, invite_carte_coords: 1, invite_bgs_bilan_directive: 1,
                  // DISCUSSIONS et journal de la campagne : le serveur verifie l'acces (participant accepte, escadron hote ou Directeur)
                  photos_visibles: 1, pp_journal: 1, tableau_partisans: 1, campagne_discussion_lire: 1, campagne_discussion_ecrire: 1, campagne_discussion_pouce: 1, campagne_discussion_supprimer: 1, campagne_discussions_compteurs: 1, campagne_journal_vu: 1 };
    // MEMBRE d'un escadron avec des campagnes ALLIEES : chaque appel est fait pour son escadron ET pour ses campagnes invitees, puis fusionne
    function tab(x) { return Array.isArray(x) ? x : []; }
    function fusionner(nom, a, b) {
        if (nom === 'bgs_directives_resume' || nom === 'directives_activite') return tab(a).concat(tab(b).filter(function (x) { return !tab(a).some(function (y) { return String(y.ordre_id) === String(x.ordre_id); }); }));
        if (nom === 'bgs_bilan_directive') return a || b;
        if (nom === 'bgs_evenements_conflit' || nom === 'installations_hausse_resume') return tab(a).concat(tab(b));
        if (nom === 'bgs_quotas_jour') return tab(a).concat(tab(b).filter(function (x) { return !tab(a).some(function (y) { return String(y.ordre_id) === String(x.ordre_id); }); }));
        if (nom === 'carte_coords') {
            a = a || { coords: [], inconnus: [] }; b = b || { coords: [], inconnus: [] };
            var trouves = tab(a.coords).concat(tab(b.coords)).map(function (c) { return String(c.n); });
            return { coords: tab(a.coords).concat(tab(b.coords)), inconnus: tab(a.inconnus).concat(tab(b.inconnus)).filter(function (n) { return trouves.indexOf(String(n)) < 0; }) };
        }
        if (nom === 'bgs_resultats') {
            a = a || { acces: true, directives: [], systemes: {}, activite: {}, tick: null }; b = b || {};
            return Object.assign({}, a, { directives: tab(a.directives).concat(tab(b.directives)), systemes: Object.assign({}, b.systemes || {}, a.systemes || {}), activite: Object.assign({}, b.activite || {}, a.activite || {}), tick: a.tick || b.tick || null });
        }
        if (nom === 'pp_missions_vue' || nom === 'col_missions_vue') { if (!a) return b; if (!b) return a; return Object.assign({}, a, { missions: tab(a.missions).concat(tab(b.missions)) }); }
        return a;
    }
    function installerFusion(client) {
        if (!client || client.__shimInvite) return;
        var orig = client.rpc.bind(client);
        client.rpc = function (nom, args, opts) {
            if (!MAP[nom]) return orig(nom, args, opts);
            if (PAR_ORDRE[nom]) return orig(args && ordreAllie(args.p_ordre) ? MAP[nom] : nom, args, opts);
            return Promise.all([orig(nom, args, opts), orig(MAP[nom], args, opts)]).then(function (r) {
                if (r[0] && r[0].error && !r[0].data) return r[0];   // erreur cote escadron : rendue telle quelle
                return { data: fusionner(nom, r[0] && r[0].data, r[1] && r[1].data), error: null };
            });
        };
        client.__shimInvite = true;
    }
    // directives de la page BGS : celles de l'escadron + celles des campagnes ou le pilote participe (la base ne livre que ce qui est permis)
    function filtrerOrdres(q, escadron) {
        var ids = window.EDTEAM_ALLIEES || [];
        if (!ids.length) return q.eq('escadron_id', escadron);
        return q.or((escadron ? 'escadron_id.eq."' + String(escadron).replace(/"/g, '') + '",' : '') + 'campagne_id.in.(' + ids.join(',') + ')');
    }
    function installerShim(client) {
        if (!client || client.__shimInvite) return;
        var orig = client.rpc.bind(client);
        client.rpc = function (nom, args, opts) {
            if (MAP[nom]) return orig(MAP[nom], args, opts);
            if (PASSE[nom]) return orig(nom, args, opts);
            return Promise.resolve({ data: null, error: null });   // tout le reste appartient a l'escadron hote : rien pour l'invite
        };
        client.__shimInvite = true;
    }
    // MOBILE, pilote sans escadron : seuls les appels de la page Engagement sont remplaces par leur version invite, le reste du site garde ses appels normaux
    function installerShimSouple(client) {
        if (!client || client.__shimInvite) return;
        var orig = client.rpc.bind(client);
        client.rpc = function (nom, args, opts) { return orig(MAP[nom] || nom, args, opts); };
        client.__shimInvite = true;
    }
    function modeInvite(profil, s) { return !!(profil && profil.est_approuve && sans(profil) && s && Number(s.actives) > 0 && (s.participe || []).length); }
    function activer(client, s) { css(); document.body.classList.add('mode-invite'); installerShim(client); window.EDTEAM_INVITE = true; }

    // pastille d'un acteur (journal) et badge d'avatar : rien pour un membre de l'escadron hote
    function htmlPastille(k, esc) {
        css();
        return k === 'SOLITAIRE' ? '<span class="inv-pastille sol">SOLITAIRE</span>' : '<span class="inv-pastille all" title="' + e(esc || '') + '">ALLIÉ · ' + e(abreger(esc)) + '</span>';
    }
    function pastille(uid) {
        var a = acteurVu(uid); if (!a) return '';
        return htmlPastille(a.k, a.e);
    }
    // marque DISCRETE d'un acteur dans une ligne de journal : petit A (allie) ou S (solitaire) a cote du nom, et cadre fin autour de la ligne ; rien pour un membre de l'escadron hote
    function marque(uid) {
        var a = acteurVu(uid); if (!a) return '';
        css();
        var sol = a.k === 'SOLITAIRE';
        return '<span class="inv-mini ' + (sol ? 'sol' : 'all') + '" title="' + (sol ? 'SOLITAIRE invité' : 'ALLIÉ · ' + e(a.e || '')) + '">' + (sol ? 'S' : 'A') + '</span>';
    }
    // marque d'une ligne de CLASSEMENT (partisans de la puissance) : A (allie, avec l'escadron en infobulle) ou S (solitaire) pour tout pilote qui n'est ni moi ni de mon escadron
    function marqueEscadron(esc, estMoi) {
        if (estMoi) return '';
        var moi = null; try { moi = window.profilReelInvite || ((typeof profilCommandant !== 'undefined') ? profilCommandant : null); } catch (x) { moi = null; }
        var ee = normE(esc), mon = normE(moi && moi.escadron_id);
        if (ee && mon && ee === mon) return '';
        css();
        return ee ? '<span class="inv-mini all" title="ALLIÉ · ' + e(esc) + '">A</span>' : '<span class="inv-mini sol" title="SOLITAIRE">S</span>';
    }
    // etiquette complete (fenetre d'une mission) : ALLIE · nom de l'escadron, ou SOLITAIRE ; rien pour un membre de l'escadron hote
    function etiquette(uid) {
        var a = acteurVu(uid); if (!a) return '';
        css();
        return a.k === 'SOLITAIRE' ? '<span class="inv-pastille sol">SOLITAIRE</span>' : '<span class="inv-pastille all">ALLIÉ · ' + e(a.e || '') + '</span>';
    }
    // texte d'infobulle (journal) : « · ALLIÉ · nom de l'escadron » ou « · SOLITAIRE »
    function info(uid) {
        var a = acteurVu(uid); if (!a) return '';
        return a.k === 'SOLITAIRE' ? ' · SOLITAIRE' : ' · ALLIÉ · ' + e(a.e || '');
    }
    function classeLigne(uid) { var a = acteurVu(uid); return !a ? '' : (a.k === 'SOLITAIRE' ? ' inv-ligne-sol' : ' inv-ligne-all'); }
    function badgeAvatar(uid, html) {
        var a = acteurVu(uid); if (!a) return html;
        css();
        return '<span class="inv-av ' + (a.k === 'SOLITAIRE' ? 'sol' : 'all') + '">' + html + '<i class="' + (a.k === 'SOLITAIRE' ? 'sol' : 'all') + '" title="' + (a.k === 'SOLITAIRE' ? 'SOLITAIRE' : 'ALLIÉ · ' + e(a.e || '')) + '">' + (a.k === 'SOLITAIRE' ? 'S' : 'A') + '</i></span>';
    }
    function chargerActeurs() {
        var d = db(); if (!d) return Promise.resolve({});
        // escadrons partenaires par campagne (SQL 202) : appel facultatif, sans la fonction serveur la pastille n'apparait simplement pas
        var pPart; try { pPart = Promise.resolve(d.rpc('campagnes_partenaires')).then(function (r) { window.cachePartenaires = (r && r.data && typeof r.data === 'object' && !Array.isArray(r.data)) ? r.data : {}; }, function () { window.cachePartenaires = {}; }); } catch (x) { window.cachePartenaires = {}; pPart = Promise.resolve(); }
        return d.rpc('campagnes_acteurs').then(function (r) { window.cacheActeurs = (r && r.data && typeof r.data === 'object' && !Array.isArray(r.data)) ? r.data : {}; return pPart.then(function () { return window.cacheActeurs; }); }, function () { window.cacheActeurs = {}; return pPart.then(function () { return {}; }); });
    }
    // pastille « ALLIES » d'une campagne : les AUTRES escadrons (pas le mien) qui y participent, plus les solitaires ; rien s'il n'y en a pas (campagne de mon seul escadron)
    // texte court et qualitatif : les escadrons par leur sigle (FRC · TB, au plus 2 puis +N) et les solitaires (« 1 S ») ; l'infobulle donne chaque escadron avec ses pilotes
    // hote = nom de l'escadron hote quand la campagne est celle d'un AUTRE escadron : le tampon s'affiche toujours et la bulle dit de qui elle est
    function pastillePartenaires(idCampagne, mobile, hote) {
        var P = (window.cachePartenaires || {})[String(idCampagne)]; if (!P && !hote) return '';
        P = P || { e: [], s: 0, sj: [] };
        var moi = null; try { moi = window.profilReelInvite || ((typeof profilCommandant !== 'undefined') ? profilCommandant : null); } catch (x) { moi = null; }
        var mon = normE(moi && moi.escadron_id);
        var esc = (P.e || []).filter(function (x) { return normE(x.n) !== mon; }), sol = Number(P.s) || 0;
        if (!esc.length && !sol && !hote) return '';
        css();
        // contenu de la bulle : titre, puis une ligne par escadron (nom, pilotes) et une pour les solitaires
        var mot = hote ? 'ALLIÉ SOUTENU' : 'SOUTIEN ALLIÉS';   // ma campagne : je soutiens des allies ; la campagne d'un autre escadron : je suis l'allie soutenu
        // hote de la campagne : les escadrons soutenus sont les alliés invités ; vu de l'escadron invité : « Escadron soutenu » = le mien, « Autres alliés » = les autres
        // vue de l'escadron invite : « Campagne de … » et seulement les NOMS des escadrons qui participent (le mien compris), sans pilotes
        var lignes = hote
            ? [mot, 'Campagne de ' + hote, 'Participants :'].concat((P.e || []).map(function (x) { return x.n; }))
            : [mot].concat(esc.map(function (x) { return x.n; }));   // vue de l'organisateur : juste la liste des escadrons (sans pilotes)
        var tip = lignes.join('\n');
        // PC : bulle holographique du site (data-tip, branchee par campagnes.js) ; mobile : pas de survol, attribut title
        return '<span class="inv-tampon"' + (mobile ? ' title="' + e(tip) + '"' : ' data-tip="' + e(tip) + '" data-tc="#3ec9ff"') + '>' + mot + '</span>';
    }

    window.edteamInvitations = { enAttente: function () { return nbAttente(etat); }, rappeler: function () { ecrire(PLUS_TARD, '', true); if (etat) overlay(etat, true); }, activerSouple: function (client) { css(); window.EDTEAM_INVITE = true; installerShimSouple(client); }, rouvrir: function () { ecrire(PLUS_TARD, '', true); }, charger: charger, invalider: invalider, verifier: verifier, modeInvite: modeInvite, activer: activer, activerFusion: function (client) { css(); installerFusion(client); }, filtrerOrdres: filtrerOrdres, css: css, pastille: pastille, marque: marque, marqueEscadron: marqueEscadron, etiquette: etiquette, info: info, classeLigne: classeLigne, htmlPastille: htmlPastille, badgeAvatar: badgeAvatar, chargerActeurs: chargerActeurs, pastillePartenaires: pastillePartenaires, abreger: abreger };
})();
