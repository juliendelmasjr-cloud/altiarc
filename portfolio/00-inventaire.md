# Phase 0 — Inventaire des réalisations Altiarc

> Date : 19/10/2026 · Statut : **CHECKPOINT, en attente des réponses de Julien**
> Règle appliquée : rien n'est affirmé sans source. Tout ce qui n'est pas vérifié est marqué `[À CONFIRMER]`.

---

## 1. À lire en premier : 4 points bloquants

1. **Le repo `altiarc` ne correspond pas au site en ligne.** Le repo contient un `index.html` unique (HTML/CSS/JS vanilla, dernier commit le 10/04/2026), sans la tagline « L'intelligence artificielle, enfin au service de votre temps » et sans page `/artisans`. La version en ligne a donc été modifiée ailleurs (éditeur Hostinger ? upload direct ?). **Je ne peux pas faire la Phase 2 sans la source réelle du site.**
2. **Accès bloqués dans cet environnement.** La politique réseau refuse `altiarc.fr`, `alexandredelovane.com`, `redactionaugmentee.netlify.app` (et les autres sites projets), donc pas de captures Playwright pour l'instant. Et **aucun connecteur Hostinger n'est disponible dans la session** (Netlify, n8n, Google Drive et GitHub le sont).
3. **Le contenu du repo (s'il reflète encore le site en ligne) enfreint les règles de la mission :**
   - Levallois Sporting Club cité en référence, avec chiffres (« 18 000 adhérents », « –70 % ») et un témoignage → projet **exclu**.
   - « Cabinet RH Toulouse » cité avec « –8 h/semaine », « ROI en 6 semaines » et un témoignage → **projet inconnu de la liste source**.
   - Prix affichés partout (cartes services, JSON-LD `minPrice`, FAQ, maintenance) → **contraire à la politique « aucun prix »**.
   - Chiffres non sourcés : « 85 % des cas », « 5 h/semaine par personne », « ROI < 3 mois », « 90 % de son potentiel », « 4 clients actifs ».
   - LC Auto : « Le bot gère 80 % des demandes », alors que **le chatbot a été retiré du site le 16/03/2026** (voir §3).
   - Sud Radio : « Identification de 8 automatisations », « ROI chiffré présenté en CODIR » + citation → `[À CONFIRMER]`.
4. **Deux alertes sécurité** (détail §5) : le repo public `redaction-augmentee` expose une URL de webhook n8n et le nom d'hôte du VPS ; le repo `lcautoservices` versionne un fichier `.env`.

---

## 2. Sources consultées

| Source | Ce que j'y ai trouvé |
|---|---|
| Repo `altiarc` (branche `master` + branche vidéo HeyGen) | Site v1 (avril 2026). La branche `claude/heygen-hyperframes-skill-ez1p1j` ne contient que 2 films promo Altiarc (pas de changement du site). |
| Repo `Alex-site` (public) | Ancienne version du site Delovane (React/Vite, Calendly + Stripe, Vercel, mai 2026). **Pas la version livrée.** |
| Repo `redaction-augmentee` (public) | Front React/TS + export du workflow n8n + prompts + `SUIVI_PROJET.md` détaillé. |
| Repo `lc-auto-services` (privé) | Site Astro actuel de LC Auto (refonte 03/08/2026), réservation Google Calendar, chatbot supprimé le 16/03/2026. |
| Repo `lcautoservices` (privé) | Ancienne version Lovable (React + Supabase, chatbot « GarageAssistant » + export Sheets), dernier commit 06/03/2026. |
| Repo `ai-consulting-site` | Un seul `index (1).html` (avril 2026), brouillon du site Altiarc. |
| Repo `safevoice` | **Non ouvert** (projet confidentiel exclu). |
| Netlify (8 sites) | `delovanealexandre.com`, `lcautoservices.fr`, `redactionaugmentee`, `moclim-demo`, `assistant-editorial-sudradio`, `livrable-solution`, + 2 sites sans nom explicite. |
| n8n (29 workflows) | Écosystème « AD » (Axel), « ROBIN » (agent Instagram), « Tcheel Chatbot PROD v3 », pipeline Rédaction Augmentée, veille offres, workflows « SV » (SafeVoice, exclus). **Aucun workflow Martinez.** |
| Google Drive | Proposition et plan projet chatbot Delovane, factures, offre de maintenance, contexte « Chatbot éditorial hybride Sud Radio », script d'ingestion d'archives Sud Radio, ancien portfolio (avril 2026), CV réalisateur. **Pas de livrable d'audit Sud Radio trouvé.** |

---

## 3. Tableau des projets

| Projet | Trouvé (vérifié) | Manque / écart avec le brief | Statut vérifié |
|---|---|---|---|
| **Alexandre Delovane** (site + Axel) | Site React/TS/Vite/Tailwind sur Netlify, domaine principal Netlify **`delovanealexandre.com`** ; Cal.com (9 types d'événements), migration du contenu depuis Wix, mini-jeux (factures). Chatbot « Axel » (facture du 15/06/2026) : agent n8n **GPT-4o-mini**, mémoire conversationnelle, base de connaissances, outil de capture de leads, outil d'alerte « SOS », journal des conversations. Workflows annexes actifs : leads & SOS, rapport mensuel, contrôle de santé hebdo, nettoyage mensuel, gestionnaire d'erreurs global. Mémoire et base **migrées de Supabase vers Postgres sur le VPS** (sauvegarde du 02/09/2026). Client = figure média (émission sur Sud Radio). | Domaine : `alexandredelovane.com` (brief, factures) ≠ `delovanealexandre.com` (Netlify). Stripe, Brevo, Resend, GA4 non vérifiés dans la version livrée. La facture mentionne « Claude Haiku » alors que le workflow actif tourne sur GPT-4o-mini. Aucun chiffre d'usage. Aucune capture. | Livré, en maintenance (facture de maintenance juin 2026) |
| **LC Auto Services** | Site vitrine Astro sur Netlify (`lcautoservices.fr`), garage indépendant à **Couiza (Aude)**. Réservation en ligne : créneaux lus et écrits dans **Google Calendar** + e-mails de confirmation. Refonte « premium » le 03/08/2026. | **Le chatbot IA a été supprimé le 16/03/2026** (commit « Suppression complète du chatbot IA »). La prise de RDV passe par Google Calendar, plus par Google Sheets. Le site Altiarc parle de « Carcassonne », c'est **Couiza**. | Livré. Maintenance `[À CONFIRMER]` |
| **Audit IA Sud Radio** | Rien de direct. Indices : script d'ingestion d'archives `sudradio.fr` → embeddings → pgvector ; doc « Chatbot éditorial hybride Sud Radio » (RAG archives + recherche web + routeur IA) ; 2 sites Netlify (`assistant-editorial-sudradio`, `livrable-solution`). | **Le livrable de l'audit** (diagnostic, 4 phases, projection ROI). Lien entre l'audit et le prototype de chatbot éditorial. | Audit livré, **non déployé** (selon le brief) |
| **Rédaction Augmentée** | Hackathon IApreneurs × Hostinger (deadline 04/06/2026). Pipeline n8n de 12 nœuds : ingestion texte/URL → scraping → routeur éditorial GPT-4o-mini (JSON strict) → fact-check Tavily → génération d'un kit multi-formats → score qualité /10 → TTS (côté front). Front React sur Netlify. Workflow toujours actif. | Résultat du hackathon. Si la v4 du front (badges fact-check, jauges) a été poussée (oui d'après le commit du 04/06, à vérifier visuellement). Captures. | Démo en ligne (R&D) |
| **Robin Françoise** (ébéniste) | Agent Instagram **actif en production** : répond aux DM, passe la main à Robin par alerte e-mail, gère STOP/spam, journalise tout, détecte quand Robin reprend la main, filet de sécurité « aucune réponse sans marqueur », relance unique à 24 h (dans la fenêtre Meta), renouvellement automatique du token. Brique de tri des abonnés (bios → classement IA → score 1-5) en test. | Page `altiarc.fr/artisans` (introuvable dans le repo). Accord de Robin. Volet « formation ». | En production (1er client) |
| **Infra n8n self-hosted** | Migration Railway → VPS Hostinger confirmée (`SUIVI_PROJET.md`, 18/05/2026). | Détails Docker/Traefik et montée KVM1 → KVM2 : uniquement dans le brief. | Fait. Contenu « coulisses », pas une étude de cas |
| **MO CLIM FROID SERVICES** | Site Netlify `moclim-demo` (nom = **démo**). | Mise en ligne réelle ? Client ? | `[À CONFIRMER]`, ressemble à une démo de prospection |
| **SARL Martinez Frères** | **Rien** (ni workflow n8n, ni repo, ni document Drive). | Tout. | `[À CONFIRMER]`, probablement non réalisé |
| **Chatbot Tcheel** | Workflow « Tcheel Chatbot PROD v3 » actif depuis le 27/05/2026 (non exposé au MCP, contenu non lu). Tcheel = studio graphique (« Usine Graphique »). | Client payant ? Encore en ligne ? Accord ? | `[À CONFIRMER]` |
| **Audit PSG Amateur Association** | Rien trouvé. | Tout. | `[À CONFIRMER]` |
| **« Cabinet RH Toulouse »** (présent sur le site) | Rien trouvé. | Tout. | `[À CONFIRMER]`, à retirer s'il n'existe pas |
| ~~Chatbot LSC~~ | Exclu. Seule la brique technique (widget embarquable, mémoire) peut être présentée comme R&D, sans nommer le club. | — | Exclu |
| ~~Sud Radio Sport, SafeVoice, Faut que ça change~~ | Workflows « SV » vus dans n8n, **non ouverts**. | — | Exclus |

---

## 4. Écarts entre le brief et ce que j'ai trouvé

| Sujet | Brief | Réalité constatée | Impact |
|---|---|---|---|
| Source du site | Site sur Hostinger, page `/artisans` | Repo daté d'avril, sans `/artisans` ni tagline actuelle | Bloquant pour la Phase 2 |
| Axel : stockage | Supabase | Postgres sur le VPS depuis septembre 2026 | Stack de la fiche |
| Axel : modèle | GPT-4o-mini | GPT-4o-mini dans n8n, « Claude Haiku » dans la facture | Stack de la fiche |
| Delovane : domaine | alexandredelovane.com | delovanealexandre.com sur Netlify | Lien public |
| Delovane : hébergeur | Netlify | Netlify (confirmé). L'ancien repo était sur Vercel | — |
| LC Auto | Site + chatbot + RDV Google Sheets | Site + RDV Google Calendar, **sans chatbot** depuis mars | Angle de la fiche |
| LC Auto : ville | — | Couiza (le site Altiarc dit Carcassonne) | Correction |
| Repo Rédaction Augmentée | Privé (selon `SUIVI_PROJET.md`) | **Public** sur GitHub | Sécurité (§5) |
| Parcours audiovisuel | 8 ans | « 10+ ans » dans l'accroche LinkedIn du brief CV ; « 8 ans » dans le CV réalisateur | Choisir une seule version |

---

## 5. Alertes sécurité et conformité (à traiter, quelle que soit la suite)

Je ne recopie aucune valeur sensible ici.

1. **`redaction-augmentee` est public** et `SUIVI_PROJET.md` contient l'URL complète du webhook de production et le nom d'hôte du VPS. N'importe qui peut déclencher le pipeline et consommer les crédits OpenAI/Tavily. → Passer le repo en privé **ou** purger ces lignes, puis changer le chemin du webhook.
2. **Clé OpenAI côté navigateur** sur la démo Rédaction Augmentée (`VITE_OPENAI_API_KEY` est embarquée dans le bundle public par Vite). → Faire passer le TTS par n8n ou par une fonction serverless.
3. **`lcautoservices` (ancien repo Lovable) versionne un `.env`** avec l'URL et la clé publishable d'un projet Supabase. Risque faible (clé publique), mais à nettoyer.
4. Le `CLAUDE.md` de `lc-auto-services` contient l'URL complète d'un Apps Script. Repo privé, risque faible, à garder hors de tout dérivé public.
5. Les factures et offres dans Drive contiennent prix et IBAN : **jamais utilisés** dans les livrables.

---

## 6. Questions fermées pour Julien

Réponds simplement avec le numéro et oui/non (ou la valeur).

### Transverse
- **T1.** Le site en ligne a-t-il été modifié dans l'éditeur Hostinger (Website Builder / Horizons) ? → oui / non. Si oui, peux-tu exporter les fichiers (Gestionnaire de fichiers → `public_html` → zip) et les déposer dans le repo, ou me donner un autre moyen d'y accéder ?
- **T2.** Peux-tu autoriser ces domaines dans la politique réseau de l'environnement (pour les captures Playwright) : `altiarc.fr`, `delovanealexandre.com`, `alexandredelovane.com`, `lcautoservices.fr`, `redactionaugmentee.netlify.app` ? → oui / non.
- **T3.** Le contenu actuel du repo (LSC, Cabinet RH Toulouse, prix, chiffres) est-il **encore en ligne** ? → oui / non. Si oui, je te propose un correctif prioritaire à part, avant les réalisations.
- **T4.** Ancienneté à afficher : « 8 ans » ou « 10+ ans » de production audiovisuelle ?
- **T5.** Puis-je réutiliser les chiffres de ton CV réalisateur (« 2 000+ heures d'antenne », « 500+ émissions live ») sur LinkedIn et dans le portfolio ? → oui / non / lesquels.
- **T6.** « Cabinet RH Toulouse » : client réel ? → oui (avec accord) / non (je le retire).
- **T7.** Les 2 films promo Altiarc (branche `claude/heygen-…`) : faut-il les intégrer au site ou à LinkedIn ? → oui / non.

### Alexandre Delovane
- **D1.** Domaine canonique : `alexandredelovane.com` ou `delovanealexandre.com` ?
- **D2.** Alexandre accepte-t-il d'être nommé ? → oui / non / pas encore demandé.
- **D3.** Stack livrée à afficher : confirmes-tu **Cal.com, GA4, Stripe, Brevo, Resend** dans la version en ligne ? (barre ceux qui sont faux)
- **D4.** As-tu un chiffre réel : nombre de conversations Axel, leads capturés, RDV pris via le chat ? → valeur / non. (Je peux aussi le compter dans le journal Postgres si tu m'y autorises, sans exposer de données personnelles.)
- **D5.** Puis-je mentionner le lien média du client (son émission sur Sud Radio) ? → oui / non.

### LC Auto Services
- **L1.** Confirmes-tu que le chatbot est retiré et que la fiche doit présenter « site + réservation en ligne » ? → oui / non.
- **L2.** Pourquoi le chatbot a-t-il été retiré ? (C'est une leçon utile pour un post si tu veux en parler.) → raison / ne pas mentionner.
- **L3.** Laurent accepte-t-il d'être nommé ? → oui / non / pas demandé.
- **L4.** En maintenance ? → oui / non.
- **L5.** Un chiffre réel : nombre de RDV pris en ligne depuis la mise en place ? → valeur / non.

### Audit IA Sud Radio
- **S1.** Peux-tu me transmettre le livrable de l'audit (PDF ou Doc) ? → oui / non.
- **S2.** Sud Radio accepte-t-il d'être nommé comme client d'audit ? → oui / non / pas demandé. (Sinon : « un média radio national ».)
- **S3.** Le prototype « chatbot éditorial hybride » (archives + web) fait-il partie de cet audit (preuve de concept livrée avec l'audit) ou d'un autre projet exclu (Sud Radio Sport) ? → audit / exclu / autre.
- **S4.** Les éléments déjà sur le site (« 8 automatisations prioritaires », « présenté en CODIR », la citation) sont-ils exacts ? → oui / non.

### Rédaction Augmentée
- **R1.** Résultat du hackathon ? → classement / non classé / ne pas mentionner.
- **R2.** La démo publique doit-elle rester ouverte (coût OpenAI) pour être liée depuis le site et LinkedIn ? → oui / non.

### Robin Françoise
- **F1.** On en fait une étude de cas maintenant, ou on attend d'avoir du recul ? → maintenant / attendre.
- **F2.** Robin accepte-t-il d'être nommé ? → oui / non / pas demandé.
- **F3.** Y a-t-il eu un volet formation (séances avec Robin) ou uniquement l'agent « done-for-you » ? → formation + agent / agent seul.

### Projets incertains
- **M1.** MO CLIM : client réel ou démo de prospection ? → client (en ligne ? oui/non) / démo.
- **M2.** Martinez Frères : réalisé ? → oui (où sont les workflows ?) / non.
- **M3.** Tcheel : client livré et facturé ? → oui / non. Encore en service ? → oui / non.
- **M4.** Audit PSG Amateur Association : réalisé ? → oui (livrable ?) / non.

---

## 7. Recommandation : 4 études de cas (+1 optionnelle), par force commerciale

| Rang | Étude de cas | Type | Pourquoi | Conditions |
|---|---|---|---|---|
| 1 | **Alexandre Delovane : site + assistant « Axel »** | site + chatbot + automatisation | Le cas le plus complet : site, réservation, chatbot avec capture de leads, alertes, rapport mensuel, supervision. Client lié aux médias. Livré et en maintenance, donc preuve du modèle build + maintenance. | D1–D3, consentement |
| 2 | **Rédaction Augmentée** | R&D / démo médias | Vitrine de l'expertise signature médias : le pipeline parle directement à une rédaction (routage éditorial, fact-check, déclinaison multi-formats). Projet Altiarc, donc pas de consentement client. Démo cliquable. | Correctif sécurité §5 avant de la mettre en avant, R1–R2 |
| 3 | **Audit IA d'un média radio national** | audit | Crédibilité sectorielle forte, preuve du savoir-faire « audit + ROI ». À présenter comme **audit livré, non déployé**. | S1 (sans livrable, la fiche reste trop vague), S2–S4 |
| 4 | **Agent Instagram pour un ébéniste** | automatisation / agent IA | Cas « artisan » concret qui sert la page `/artisans` et prouve l'élargissement multi-secteurs. Garde-fous solides (passage de main à l'humain, STOP, relance unique) : bon argument de confiance. | F1–F3, consentement |
| 5 (option) | **LC Auto Services : site + réservation en ligne** | site | Cas PME locale propre, mais sans IA depuis mars : plus faible pour Altiarc. À garder pour la grille `/realisations` (filtre « site ») plutôt qu'en tête. | L1–L5 |

Hors études de cas, utiles en contenu LinkedIn « coulisses » : infra n8n self-hosted, widget chatbot embarquable (R&D, sans nommer de club), et éventuellement « pourquoi on a retiré un chatbot » (si L2 le permet).

---

## 8. Plan et tâches (mis à jour à chaque phase)

- [x] Phase 0 : inventaire (ce fichier)
- [ ] **Checkpoint : réponses de Julien** ← on en est là
- [ ] Phase 1 : fiches `portfolio/projets/<slug>.md` (source de vérité)
- [ ] Phase 2 : `/realisations` + pages cas + bloc accueil + SEO + captures (dépend de T1, T2)
- [ ] Phase 3 : LinkedIn (profil, 8–10 posts, calendrier, carrousel 1080×1350)
- [ ] Phase 4 : portfolio PDF A4 paysage + variante « médias » + README de génération
- [ ] Phase 5 : relecture croisée, messages de consentement, `RECAP.md`, go avant déploiement

**Ce que je peux avancer sans tes réponses :** les fiches Rédaction Augmentée (projet Altiarc) et Delovane en version anonymisée, le gabarit du portfolio PDF et la structure des posts LinkedIn. Tout restera marqué `[À CONFIRMER]` là où il le faut.
