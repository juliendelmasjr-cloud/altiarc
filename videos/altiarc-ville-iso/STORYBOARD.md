---
format: 1920x1080
duration: 26s
message: "Altiarc branche l'IA sur votre entreprise : moins de tâches, plus d'impact."
arc: Monde → Friction → Le système s'allume → Preuve ×3 (chatbot, workflow, ROI) → Signature
audience: Dirigeants d'entreprises (PME, structures médias)
mode: collaborative
---

# Altiarc — La ville isométrique (v1 — construite)

## Decisions

- **Message** : Altiarc branche l'IA sur votre entreprise — les tâches répétitives entrent, des résultats prêts à l'emploi sortent.
- **Audience & arc** : dirigeants de PME / médias. Monde → friction → le système s'allume → trois preuves (chatbot, workflow, ROI) → signature.
- **Format** : 1920×1080, ~26 s, sans voix off, sans musique (autoplay muet sur altiarc.fr). Texte à l'écran minimal : uniquement à l'intérieur des écrans + carton final.
- **Spine** : **une seule ville, une seule caméra.** Toute la vidéo est un voyage de caméra continu dans le même monde 3D isométrique (Three.js, caméra orthographique). Les « écrans » (chatbot, workflow, ROI) sortent des bâtiments et se redressent face caméra — jamais de coupe vers un autre décor.
- **Hero prop** : le **module de données** — un petit cube lumineux. Rose quand c'est une tâche brute, indigo pendant le traitement, or quand c'est un résultat. On le suit du début à la fin ; il devient le point final du logo.
- **Brand** : voir `frame.md` (tokens altiarc.fr). Indigo = le système, or = la valeur, rose = la friction.
- **Bans** : pas de dégradé de texte, pas de robot à visage, pas de diaporama (chaque plan découle du précédent), pas d'économiseur d'écran (chaque mouvement transporte une tâche).
- **Held frame** : 07 — le carton final tient ~2 s sans mouvement.
- **Build (timing réel, index.html)** : ville `compositions/city.html` 0–23,4 s · chatbot 11,2–14,6 s · workflow 15,0–18,5 s · ROI 18,9–21,9 s · signature 22,6–26,0 s. Durée finale : **26,0 s**.
- **Écart avec la v1** : l'ouverture part du **cœur-module indigo** posé au centre (et non d'un cube sur un ruban : les rubans n'existent qu'une fois le système allumé). Ce module monte avec le cœur, vire à l'or à la fin et devient le point du logo.
- **Truthfulness** : les chiffres du tableau de bord (heures gagnées, ROI ×3) sont illustratifs ; « ×3 » reprend la promesse du site (« elle la rend 3× plus efficace »).

## Frame 1 — La ville (0.0–3.5s)

- scene: Macro sur le module indigo posé au centre, puis grand dézoom qui révèle la ville isométrique : 5 bâtiments sortent du sol sur un îlot sombre
- duration: 3.5s
- poster: 2.8s
- transition_in: cut
- status: animated
- src: compositions/city.html
- blueprint: camera-journey (sub-shape B — cursorless flight)
- rules: multi-phase-camera, coordinate-target-zoom (zoom-out variation), spring-pop-entrance
- voiceover: onscreen

On screen : le module indigo flotte au-dessus de la plateforme centrale (plan très serré). La caméra recule fort
(`power4.out`, 2.2 s) et révèle l'îlot : **Bureau** (tour vitrée), **Atelier** (toit en dents de
scie), **Boutique** (auvent rayé), **Entrepôt** (portes roulantes, palettes), **Centre d'appels**
(antenne + enseigne casque). Les bâtiments émergent du sol en cascade pendant le recul. Au centre,
une plateforme vide (le futur cœur Altiarc). Aucun texte.
Constraint : pas de labels sur les bâtiments — les icônes d'enseigne suffisent.
Seam out : la caméra continue en légère poussée (même plan).
Why : poser le monde du dirigeant — *son* entreprise, avec tous ses métiers.

## Frame 2 — La friction (3.5–7.0s)

- scene: Les tâches répétitives (emails, saisies, factures, demandes clients) jaillissent des bâtiments et s'empilent en files roses ; le cœur Altiarc s'allume au centre
- duration: 3.5s
- poster: 5.5s
- transition_in: continuous camera
- status: animated
- src: compositions/city.html
- blueprint: overwhelm-surround (adapté, dans le monde 3D)
- rules: waterfall-entry, spring-pop-entrance, ambient-glow-bloom
- voiceover: onscreen

On screen : de chaque bâtiment sortent des tuiles roses avec icône (enveloppe, formulaire, facture €,
bulle). Elles s'empilent en piles qui grossissent et vacillent. Caméra : lente poussée (1.0 → 1.15).
À 6.2 s, la plateforme centrale s'élève : le **cœur Altiarc** (bloc hexagonal, verre sombre, anneau
indigo/violet) s'allume avec une onde de choc qui balaie le sol.
Constraint : pas de compteur ni de texte « problème » — la pile suffit.
Seam out : l'onde de choc déclenche les rubans (même plan).
Why : nommer la douleur sans un mot — le temps perdu s'empile.

## Frame 3 — Le système s'allume (7.0–11.0s)

- scene: Rubans lumineux et convoyeurs relient le cœur aux 5 bâtiments ; les tâches roses entrent, sont triées et ressortent en modules or vers les bâtiments
- duration: 4.0s
- poster: 9.5s
- transition_in: continuous camera
- status: animated
- src: compositions/city.html
- blueprint: camera-journey (leg : travelling latéral le long d'un convoyeur)
- rules: svg-path-draw (tracé des rubans, en 3D), multi-phase-camera, motion-blur-streak
- voiceover: onscreen

On screen : 5 rubans indigo se tracent du cœur vers chaque bâtiment ; des convoyeurs s'animent. Les
piles roses se vident : chaque tuile glisse sur un convoyeur, passe un portique de tri (scan
lumineux), entre dans le cœur — et ressort **en cube or** qui file vers un bâtiment. Caméra :
travelling le long d'un convoyeur, puis remonte en vue 3/4 de la ville entière qui « respire ».
Constraint : pas d'éclairs ni de particules décoratives — chaque lumière est une tâche en mouvement.
Seam out : la caméra plonge vers la Boutique / centre d'appels.
Why : montrer le système Altiarc — entrée brute, traitement, sortie prête à l'emploi.

## Frame 4 — Le chatbot (11.0–14.5s)

- scene: Plongée sur le centre d'appels ; un écran sort du toit et se redresse face caméra : conversation client ↔ IA en direct
- duration: 3.5s
- poster: 13.6s
- transition_in: camera dive + tilt-to-flatten
- status: animated
- src: compositions/chat.html
- blueprint: camera-journey (dive → panel → hinge)
- rules: coordinate-target-zoom, 3d-camera-flight (tilt-to-flatten), discrete-text-sequence, spring-pop-entrance
- voiceover: onscreen

On screen : panneau sombre (rayon 28 px), en-tête « Assistant IA » + pastille verte **24/7**.
Bulle client : **« Vous êtes ouverts dimanche ? »** → indicateur de saisie → réponse IA qui
s'écrit : **« Oui, de 10 h à 13 h. Je vous réserve un créneau ? »** → bouton « Réserver » qui
pulse. En arrière-plan, la ville floutée. Horodatage mono « 23:47 ».
Constraint : pas de mascotte robot ; l'IA est une pastille violette sobre.
Seam out : le panneau se replie dans le bâtiment, la caméra recule et pivote vers le Bureau.
Why : preuve n°1 — le client obtient une réponse à 23 h 47, sans personne au téléphone.

## Frame 5 — Le workflow (14.5–18.0s)

- scene: La caméra file vers le Bureau ; un écran se déplie : workflow automatisé (Email → Tri IA → Facture → CRM) et « 4 h » barré → « 4 min »
- duration: 3.5s
- poster: 17.0s
- transition_in: camera swoop + tilt-to-flatten
- status: animated
- src: compositions/workflow.html
- blueprint: agent-progress-theater (adapté) dans camera-journey
- rules: svg-path-draw, waterfall-entry, css-marker-patterns (barré), counting-dynamic-scale
- voiceover: onscreen

On screen : 4 nœuds reliés horizontalement — **Email reçu → Tri IA → Facture générée → CRM à
jour** — chaque nœud s'allume (indigo) au passage d'un module qui voyage sur le lien, puis passe en
coche or. En bas à droite, gros chiffre : **« 4 h »** se fait barrer → **« 4 min »** en or.
Constraint : pas de capture d'un vrai outil (n8n) — schéma maison aux couleurs Altiarc.
Seam out : le panneau se replie, grand recul vers la vue d'ensemble.
Why : preuve n°2 — un workflow remplace des heures de travail manuel.

## Frame 6 — Le ROI (18.0–21.5s)

- scene: Retour à la vue d'ensemble, toute la ville tourne en or ; un tableau de bord holographique s'élève au-dessus : courbe ROI qui monte + compteurs
- duration: 3.5s
- poster: 20.8s
- transition_in: camera pull-back
- status: animated
- src: compositions/roi.html
- blueprint: dataviz-countup
- rules: counting-dynamic-scale, stat-bars-and-fills, svg-path-draw, chart-scrub-readout
- voiceover: onscreen

On screen : la ville entière, flux or partout. Au-dessus, un panneau incliné se redresse : courbe qui
se trace vers le haut (or) + 2 compteurs Space Mono : **« Heures gagnées  +120 h/mois »** (0 → 120)
et **« Productivité  ×3 »**. Petit label « ROI · en direct » avec point qui pulse.
Constraint : chiffres illustratifs — à remplacer si tu as des chiffres réels (LSC, Sud Radio).
Seam out : le panneau se dissout en lignes, la caméra recule encore.
Why : preuve n°3 — c'est mesurable, et ça monte.

## Frame 7 — Signature (21.5–26.0s)

- scene: Grand recul : la ville rétrécit jusqu'à un point lumineux or qui devient le point final du logo ; carton Altiarc + baseline + altiarc.fr, tenu
- duration: 4.5s
- poster: 25.0s
- transition_in: camera pull-back → match on the module
- status: animated
- src: compositions/endcard.html
- blueprint: logo-assemble-lockup (CTA text-clear bloom / settled-lockup)
- rules: multi-phase-camera, spring-pop-entrance, gsap-effects (révélation par masque)
- voiceover: onscreen

On screen : la ville recule et s'éteint jusqu'à un seul cube or (le hero prop). Il glisse à droite
et devient le point après « Altiarc » : **« Altiarc »** (Outfit 800, blanc, ~168 px) se révèle par
masque. Dessous : **« Moins de tâches. Plus d'impact. »** (Outfit 300), puis **« altiarc.fr »**
(Space Mono, or). Halo indigo très doux derrière. 2 s de tenue immobile à la fin.
Constraint : pas de fondu au noir final — la vidéo boucle sur le site, la dernière image doit tenir.
Seam out : fin (boucle).
Why : signer — la marque, la promesse, l'adresse.
