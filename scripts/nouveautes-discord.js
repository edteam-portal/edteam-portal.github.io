// Resume hebdomadaire des nouveautes vers Discord (execute par la tache GitHub .github/workflows/nouveautes-discord.yml).
// Lit nouveautes-data.js, retient les entrees du dernier cycle ECOULE (jeudi 07:00 UTC -> jeudi 07:00 UTC) et envoie UN message.
//   node scripts/nouveautes-discord.js            envoie (secret DISCORD_WEBHOOK_NOUVEAUTES requis ; sinon affiche le message et s'arrete sans erreur)
//   node scripts/nouveautes-discord.js --dry      affiche le message sans rien envoyer
//   NOUVEAUTES_NOW=2026-10-01T08:00:00Z node scripts/nouveautes-discord.js --dry     simule une date d'execution
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const https = require('https');

const SITE = 'https://edteam-portal.github.io/index.html';
const dry = process.argv.includes('--dry');
const maintenant = process.env.NOUVEAUTES_NOW ? new Date(process.env.NOUVEAUTES_NOW) : new Date();

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'nouveautes-data.js'), 'utf8'), ctx);
const toutes = Array.isArray(ctx.window.EDTEAM_NOUVEAUTES) ? ctx.window.EDTEAM_NOUVEAUTES : [];

// Dernier jeudi 07:00 UTC deja passe = fin du cycle ecoule ; debut = 7 jours avant
const fin = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), maintenant.getUTCDate(), 7, 0, 0));
while (fin.getUTCDay() !== 4 || fin > maintenant) fin.setUTCDate(fin.getUTCDate() - 1);
const debut = new Date(fin.getTime() - 7 * 86400000);

const semaine = toutes
    .filter(e => new Date(e.date) >= debut && new Date(e.date) < fin)
    .sort((a, b) => (a.date < b.date ? -1 : 1));

const jj = d => ('0' + d.getUTCDate()).slice(-2) + '/' + ('0' + (d.getUTCMonth() + 1)).slice(-2);
const ICONES = { NOUVEAU: '🟢 **NOUVEAU**', AMELIORE: '🔵 **AMÉLIORÉ**', CORRIGE: '🟠 **CORRIGÉ**' };

if (!semaine.length) {
    console.log(`Aucune nouveauté du ${jj(debut)} au ${jj(fin)} : rien à envoyer.`);
    process.exit(0);
}

function bloc(e, court) {
    let t = e.texte;
    if (court && t.length > 220) t = t.slice(0, 217).replace(/\s+\S*$/, '') + '…';
    return `${ICONES[e.type] || ICONES.NOUVEAU} ${e.titre}\n${t}` + (e.action ? `\n▶ **Action requise :** ${e.action}` : '');
}
let description = semaine.map(e => bloc(e, false)).join('\n\n');
if (description.length > 3800) description = semaine.map(e => bloc(e, true)).join('\n\n');   // trop long : versions courtes
description = description.slice(0, 3900);

const message = {
    username: 'SYS.EDTEAM',
    embeds: [{
        title: `📰 NOUVEAUTÉS DE LA SEMAINE · du ${jj(debut)} au ${jj(fin)}`,
        url: SITE,
        description,
        color: 0xFF7100,
        footer: { text: 'Retrouvez le détail dans le bouton « Nouveautés » en bas de chaque page du site.' }
    }]
};

console.log(`--- Message (${semaine.length} nouveauté(s), cycle du ${jj(debut)} au ${jj(fin)}) ---`);
console.log(message.embeds[0].title + '\n\n' + description + '\n\n' + message.embeds[0].footer.text);
console.log('--- fin ---');

const url = process.env.DISCORD_WEBHOOK_NOUVEAUTES;
if (dry) { console.log('Mode --dry : rien n\'est envoyé.'); process.exit(0); }
if (!url) { console.log('::notice::Secret DISCORD_WEBHOOK_NOUVEAUTES absent : message non envoyé.'); process.exit(0); }

const corps = JSON.stringify(message);
const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(corps) } }, res => {
    let r = ''; res.on('data', d => (r += d));
    res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) console.log('Message envoyé à Discord.');
        else { console.error('Échec Discord :', res.statusCode, r.slice(0, 300)); process.exit(1); }
    });
});
req.on('error', e => { console.error('Erreur réseau :', e.message); process.exit(1); });
req.write(corps); req.end();
