---
format: 1920x1080
duration: 27s
message: "Le chatbot Altiarc accueille, répond et transforme chaque visiteur en rendez-vous, contact ou demande — 24h/24."
arc: Aube → Le jour (afflux, réponses en parallèle) → Gros plan RDV → La nuit tombe → La nuit continue → Gros plan nuit → Signature
audience: Dirigeants d'entreprises (commerces, PME, structures médias)
mode: collaborative
---

# Altiarc — La boutique 24/7 (v1)

## Decisions

- **Message** : le chatbot Altiarc ne ferme jamais — chaque question devient un rendez-vous, un contact ou une demande transmise.
- **Audience & arc** : dirigeants qui perdent des demandes hors horaires. Un cycle de 24 h complet : aube → jour → nuit → signature.
- **Format** : 1920×1080, ~27 s, sans voix off, sans musique (autoplay muet sur altiarc.fr). Texte : bulles de questions/réponses, horloge, compteurs, 2 conversations en gros plan, carton final.
- **Spine** : **une seule boutique, une seule caméra, une journée entière.** Le temps qui passe est le moteur : la lumière, le ciel, les ombres et l'horloge tournent en continu pendant que le chatbot, lui, ne s'arrête jamais.
- **Hero prop** : **le chatbot** — une bulle lumineuse indigo/violet avec deux yeux, qui vit dans la vitrine. Il est le premier plan du film et devient le point du logo à la fin (rime avec le cube de « La ville »).
- **Le décor** : boutique isométrique **en coupe** — façade droite = vitrine-site-web géante (nav, « Prendre RDV », le chatbot), côté gauche ouvert sur l'intérieur où arrivent les éléments concrets : **mur agenda** (créneaux qui se remplissent en or), **fichier clients** (fiches qui s'empilent), **bureaux de l'équipe** (demande posée sur le bon bureau).
- **HUD (texte minimal)** : en haut à gauche une horloge mono (☀ 07:00 → ☾ 23:47) ; en haut à droite un compteur « Conversations · Rendez-vous » qui grimpe sans arrêt.
- **Brand** : `frame.md` (même univers que « La ville »). Indigo = le chatbot, or = la valeur, rose = une question en attente.
- **Bans** : pas de robot à bouche/bras, pas de dégradé de texte, pas de diaporama, pas de fondu au noir final.
- **Held frame** : 07 — le carton final tient ~1,5 s immobile (boucle propre sur le site).
- **Boucle** : le film commence et finit dans la nuit → la boucle sur le site est invisible.
- **Truthfulness** : les compteurs (≈ 1 284 conversations, 96 RDV) et les réponses (horaires, prix « dès 49 € ») sont illustratifs.

## Frame 1 — L'aube (0.0–3.5s)

- scene: Macro sur le chatbot qui cligne des yeux dans la vitrine encore dans la nuit ; dézoom : la boutique au petit matin, le soleil se lève, l'enseigne passe sur « Ouvert »
- duration: 3.5s
- poster: 3.0s
- transition_in: cut
- status: outline
- src: compositions/shop.html
- blueprint: camera-journey (sub-shape B)
- rules: multi-phase-camera, coordinate-target-zoom (zoom-out), ambient-glow-bloom
- voiceover: onscreen

On screen : très gros plan sur la bulle indigo qui ouvre les yeux, sur fond de site web (« Prendre
rendez-vous »). Grand recul (`power4.out`) : la boutique en coupe sur son îlot de trottoir, encore
bleutée ; le soleil se lève, la lumière balaie le sol, le ciel passe du nuit au jour pâle. Horloge
**06:58 → 08:59**, enseigne « OUVERT » qui s'allume.
Constraint : pas de logo ni de titre ici — on entre directement dans le monde.
Why : le chatbot était déjà là avant l'ouverture.

## Frame 2 — Le jour (3.5–9.0s)

- scene: Des visiteurs arrivent de partout ; 3 bulles de questions s'ouvrent ; le chatbot répond à tous en même temps ; chaque réponse devient un objet qui file à l'intérieur
- duration: 5.5s
- poster: 7.2s
- transition_in: continuous camera
- status: outline
- src: compositions/shop.html
- blueprint: constellation-hub (adapté : le chatbot au centre, les visiteurs autour)
- rules: spring-pop-entrance, waterfall-entry, counting-dynamic-scale
- voiceover: onscreen

On screen : 5–6 petits personnages arrivent par les trottoirs et s'arrêtent devant la vitrine. Bulles
blanches au-dessus des têtes : **« Vous êtes ouverts samedi ? »**, **« Quel est le prix ? »**, **« Je
peux prendre rendez-vous ? »**. Trois fils lumineux partent du chatbot **en même temps** et ouvrent
trois réponses indigo : **« Oui, 9 h – 19 h »**, **« Dès 49 € »**, **« Mardi 14 h ? »**. Chaque réponse
se replie en objet 3D qui traverse la vitrine : une carte-RDV (or) vers le mur agenda, une fiche
contact vers le fichier, un ticket vers un bureau. Le compteur apparaît et grimpe. Horloge 09:00 → 15:00.
Constraint : les 3 réponses partent dans la même seconde — c'est la preuve du « en parallèle ».
Why : un seul chatbot, tous les visiteurs servis, et rien ne se perd.

## Frame 3 — Gros plan : un rendez-vous (9.0–12.5s)

- scene: Plongée sur la vitrine ; la conversation RDV en gros plan ; la confirmation devient une carte qui file dans l'agenda
- duration: 3.5s
- poster: 11.3s
- transition_in: camera dive + tilt-to-flatten
- status: outline
- src: compositions/chat-day.html
- blueprint: camera-journey (dive → hinge → travel to consequence)
- rules: coordinate-target-zoom, discrete-text-sequence, cursor-click-ripple, card-morph-anchor
- voiceover: onscreen

On screen : panneau de chat (même design que « La ville ») — client : **« Je peux prendre
rendez-vous ? »** → chatbot : **« Bien sûr ! Mardi 14 h ou jeudi 10 h ? »** → le client touche
**« Mardi 14 h »** → **« C'est noté ✓ »**. Le message de confirmation se replie en carte or ; la
caméra la suit à l'intérieur jusqu'au mur agenda où le créneau **Mar · 14:00** s'allume en or.
Constraint : pas de capture d'un vrai outil d'agenda — agenda maison aux couleurs Altiarc.
Why : preuve concrète — une question devient un rendez-vous dans l'agenda, sans personne.

## Frame 4 — La nuit tombe (12.5–16.5s)

- scene: Time-lapse : le soleil descend, ciel or puis rose puis nuit ; les visiteurs repartent, l'équipe quitte les bureaux, l'enseigne passe sur « Fermé », les lumières s'éteignent — sauf la vitrine
- duration: 4.0s
- poster: 15.6s
- transition_in: camera pull-back
- status: outline
- src: compositions/shop.html
- blueprint: camera-journey (pull-back + lente orbite)
- rules: theme-crossfade-morph (ciel/lumière), multi-phase-camera, ambient-glow-bloom
- voiceover: onscreen

On screen : grand plan de la boutique. Les ombres s'allongent et tournent, le ciel glisse du jour à
l'or puis au rose puis à la nuit. Les personnages s'en vont, les bureaux se vident, l'intérieur
s'éteint pièce par pièce, l'enseigne bascule **« FERMÉ »**, les lampadaires s'allument. La vitrine
reste allumée et le chatbot brille plus fort dans le noir. Horloge **18:00 → 22:00**.
Constraint : la transition est continue (lumière, ciel, ombres) — jamais un fondu au noir.
Why : la boutique ferme, l'accueil non.

## Frame 5 — La nuit continue (16.5–19.5s)

- scene: Dans la nuit, des questions arrivent encore — passants avec téléphone et messages venus de loin ; le chatbot répond ; fiches et demandes filent dans la boutique fermée
- duration: 3.0s
- poster: 18.4s
- transition_in: continuous camera
- status: outline
- src: compositions/shop.html
- blueprint: constellation-hub (variante nuit)
- rules: particle-burst (sobre), spring-pop-entrance, counting-dynamic-scale
- voiceover: onscreen

On screen : un passant s'arrête avec son téléphone, des points lumineux (messages en ligne) arrivent
des bords du cadre jusqu'à la vitrine. Bulles sombres : **« Livraison possible ? »**, **« Je voudrais
un devis »**. Réponses indigo, puis une fiche contact file dans le fichier (qui s'illumine), un ticket
se pose sur le bureau vide du commercial. Le compteur continue de grimper.
Constraint : intérieur éteint — seuls les objets qui arrivent s'allument.
Why : la nuit, l'équipe dort, le chatbot travaille.

## Frame 6 — Gros plan : 23:47 (19.5–22.5s)

- scene: Plongée sur la vitrine de nuit ; conversation devis en gros plan ; la demande est transmise au bon interlocuteur
- duration: 3.0s
- poster: 21.6s
- transition_in: camera dive + tilt-to-flatten
- status: outline
- src: compositions/chat-night.html
- blueprint: camera-journey (dive → hinge)
- rules: coordinate-target-zoom, discrete-text-sequence, spring-pop-entrance
- voiceover: onscreen

On screen : panneau de chat, horodatage **23:47** (rime avec « La ville »). Client : **« Je voudrais un
devis pour 20 personnes »** → chatbot : **« Je transmets à notre commercial, il vous rappelle demain à
9 h. »** → pastille or **« Transmis · Service commercial »**.
Constraint : aucun prénom inventé — « notre commercial ».
Why : preuve n°2 — la bonne demande arrive au bon interlocuteur, même à minuit.

## Frame 7 — Signature (22.5–27.0s)

- scene: Recul sur la boutique de nuit, compteurs au maximum ; le chatbot quitte la vitrine, file au centre et devient le point or du logo ; « Votre accueil, 24h/24. » + altiarc.fr
- duration: 4.5s
- poster: 26.0s
- transition_in: camera pull-back → match on the chatbot
- status: outline
- src: compositions/endcard.html
- blueprint: logo-assemble-lockup (même lockup que « La ville »)
- rules: multi-phase-camera, spring-pop-entrance, counting-dynamic-scale
- voiceover: onscreen

On screen : la boutique recule dans la nuit, le compteur se fige sur **1 284 conversations · 96
rendez-vous**. Le chatbot sort de la vitrine, file au centre de l'écran, se contracte en carré or et
balaie le mot **« Altiarc »** pour devenir son point. Dessous : **« Votre accueil, 24h/24. »** puis
**« altiarc.fr »** (or). Tenue immobile ~1,5 s.
Constraint : même lockup exact que « La ville » (série).
Why : signer — la marque, la promesse 24/7, l'adresse.
