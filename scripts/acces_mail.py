#!/usr/bin/env python3
"""Envoi des e-mails « votre acces est ouvert » (SQL 213).

Lance toutes les 10 minutes par .github/workflows/acces-mail.yml. Il demande a la base les e-mails en attente (fonction acces_mail_a_envoyer, protegee par un secret partage),
les envoie avec le Gmail du portail (SMTP SSL, port 465), puis marque chaque envoi (acces_mail_marquer).
Secrets GitHub attendus : ACCES_MAIL_SECRET, GMAIL_USER, GMAIL_APP_PASSWORD. S'il en manque un, le script s'arrete sans rien envoyer et SANS echouer.
Aucune dependance : bibliotheque standard de Python uniquement.
"""
import html
import json
import os
import smtplib
import ssl
import sys
import urllib.error
import urllib.request
from email.message import EmailMessage
from email.utils import formataddr, make_msgid

SUPABASE_URL = "https://oailvdigfdoyfcydmabb.supabase.co"
SUPABASE_KEY = "sb_publishable_AASqgRggHdIGttZHPGaWkA_VqrhuYNg"     # cle publique du site (deja dans le plugin et les pages)
SITE = "https://edteam-portal.github.io/"
SMTP_HOTE, SMTP_PORT = "smtp.gmail.com", 465


def rpc(nom, corps):
    req = urllib.request.Request(
        SUPABASE_URL + "/rest/v1/rpc/" + nom,
        data=json.dumps(corps).encode("utf-8"),
        headers={"apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY, "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as rep:
        return json.loads(rep.read().decode("utf-8") or "null")


def message(expediteur, destinataire, cmdr):
    nom = (cmdr or "").strip().upper()
    salut = "Commandant " + nom if nom else "Commandant"
    texte = (
        "Bonjour " + salut + ",\n\n"
        "Le Directeur vient d'ouvrir votre accès à SYS.EDTEAM.\n\n"
        "Reconnectez-vous sur " + SITE + " avec votre adresse e-mail et votre mot de passe.\n"
        "Votre plugin EDMC reprend l'envoi de vos données tout seul, sous cinq minutes au plus.\n\n"
        "Si vous êtes membre d'un escadron, les pages Escadron et BGS s'ouvrent dès que l'Amiral de votre escadron a lui aussi reçu son accès.\n\n"
        "Bons vols, Commandant.\n\n"
        "-- Message automatique de SYS.EDTEAM, application de fan pour Elite Dangerous. Merci de ne pas y répondre."
    )
    page = (
        '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"></head>'
        '<body style="margin:0; padding:0; background-color:#efedea;">'
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#efedea; padding:24px 12px;"><tr><td align="center">'
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; background-color:#ffffff; border-radius:6px; overflow:hidden;">'
        '<tr><td style="background-color:#0a0500; padding:22px 28px; border-bottom:3px solid #ff7100;">'
        '<span style="font-family:Arial, Helvetica, sans-serif; font-size:22px; font-weight:bold; letter-spacing:3px; color:#ff7100;">SYS.EDTEAM</span><br>'
        '<span style="font-family:Arial, Helvetica, sans-serif; font-size:11px; letter-spacing:2px; color:#9a9a9a;">PORTAIL DES COMMANDANTS</span></td></tr>'
        '<tr><td style="padding:30px 28px 8px 28px; font-family:Arial, Helvetica, sans-serif; color:#222222;">'
        '<h1 style="margin:0 0 16px 0; font-size:20px; line-height:1.3; color:#111111;">Votre accès est ouvert, ' + html.escape(salut) + '</h1>'
        '<p style="margin:0 0 22px 0; font-size:15px; line-height:1.6;">Le Directeur vient d\'ouvrir votre accès à SYS.EDTEAM. Reconnectez-vous avec votre adresse e-mail et votre mot de passe.</p></td></tr>'
        '<tr><td align="center" style="padding:4px 28px 22px 28px;">'
        '<a href="' + SITE + '" style="display:inline-block; background-color:#ff7100; color:#1a0f00; font-family:Arial, Helvetica, sans-serif; font-size:15px; font-weight:bold; letter-spacing:1px; text-decoration:none; padding:14px 30px; border-radius:4px;">OUVRIR SYS.EDTEAM</a></td></tr>'
        '<tr><td style="padding:0 28px 8px 28px; font-family:Arial, Helvetica, sans-serif; color:#222222;">'
        '<p style="margin:0 0 14px 0; font-size:14px; line-height:1.6;">Votre plugin EDMC reprend l\'envoi de vos données tout seul, sous cinq minutes au plus.</p>'
        '<p style="margin:0 0 18px 0; font-size:14px; line-height:1.6;">Si vous êtes membre d\'un escadron, les pages Escadron et BGS s\'ouvrent dès que l\'Amiral de votre escadron a lui aussi reçu son accès.</p></td></tr>'
        '<tr><td style="padding:16px 28px 24px 28px; border-top:1px solid #e6e3df; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.6; color:#777777;">'
        'Message automatique de SYS.EDTEAM, application de fan pour Elite Dangerous. Merci de ne pas y répondre.</td></tr>'
        '</table></td></tr></table></body></html>'
    )
    m = EmailMessage()
    m["Subject"] = "SYS.EDTEAM : votre accès est ouvert"
    m["From"] = formataddr(("SYS.EDTEAM", expediteur))
    m["To"] = destinataire
    m["Message-ID"] = make_msgid(domain="edteam-portal.github.io")
    m.set_content(texte)
    m.add_alternative(page, subtype="html")
    return m


def main():
    secret = os.environ.get("ACCES_MAIL_SECRET", "").strip()
    user = os.environ.get("GMAIL_USER", "").strip()
    mdp = os.environ.get("GMAIL_APP_PASSWORD", "").replace(" ", "").strip()
    if not (secret and user and mdp):
        print("Secrets GitHub manquants (ACCES_MAIL_SECRET, GMAIL_USER, GMAIL_APP_PASSWORD) : rien envoye.")
        return 0
    try:
        liste = rpc("acces_mail_a_envoyer", {"p_secret": secret}) or []
    except (urllib.error.URLError, OSError, ValueError) as e:
        print("Lecture impossible (" + str(e)[:120] + ") : nouvel essai au prochain passage.")
        return 0
    if not liste:
        print("Aucun e-mail en attente.")
        return 0
    print(str(len(liste)) + " e-mail(s) a envoyer.")
    try:
        smtp = smtplib.SMTP_SSL(SMTP_HOTE, SMTP_PORT, context=ssl.create_default_context(), timeout=30)
        smtp.login(user, mdp)
    except (smtplib.SMTPException, OSError) as e:
        erreur = "connexion Gmail : " + str(e)[:200]
        print(erreur)
        for n in liste:
            try:
                rpc("acces_mail_marquer", {"p_secret": secret, "p_id": n["id"], "p_ok": False, "p_erreur": erreur})
            except Exception:
                pass
        return 1       # visible dans l'onglet Actions : le mot de passe d'application est probablement a refaire
    envoyes = 0
    try:
        for n in liste:
            try:
                smtp.send_message(message(user, n["email"], n.get("cmdr")))
                rpc("acces_mail_marquer", {"p_secret": secret, "p_id": n["id"], "p_ok": True})
                envoyes += 1
                print("envoye : id " + str(n["id"]))
            except Exception as e:
                try:
                    rpc("acces_mail_marquer", {"p_secret": secret, "p_id": n["id"], "p_ok": False, "p_erreur": str(e)[:250]})
                except Exception:
                    pass
                print("echec : id " + str(n["id"]) + " : " + str(e)[:120])
    finally:
        try:
            smtp.quit()
        except Exception:
            pass
    print(str(envoyes) + "/" + str(len(liste)) + " envoye(s).")
    return 0 if envoyes == len(liste) else 1


if __name__ == "__main__":
    sys.exit(main())
