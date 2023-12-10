# Introduction
Bienvenue dans le projet de simulation de véhicules et d'ennemis! Ce projet utilise la bibliothèque p5.js pour créer une simulation interactive où des véhicules suivent un leader, évitent des obstacles et interagissent avec des ennemis.

# 1.Fonctionnalités principales
  # Véhicules
  -Des véhicules sont générés au hasard sur l'écran et suivent un leader.
  -Le leader est le premier véhicule dans le tableau de véhicules.
  -Les véhicules suivent un point derrière le leader, créant un effet de "suivi".
  -Les véhicules peuvent changer de comportement entre "suivre" et "sneak" (furtivité).
  # Obstacles
    -Un obstacle central est créé au démarrage du programme.
    -L'utilisateur peut ajouter des obstacles en cliquant à l'endroit souhaité.
    -Les véhicules évitent automatiquement les obstacles lors de leurs déplacements.
  # Wander
    -Des objets "wander" (errance) sont créés et suivent une trajectoire aléatoire.
    -Ils évitent les obstacles et les bords de l'écran.
  # Tir de balles
    -Appuyez sur la touche "k" pour que chaque véhicule tire une balle.
    -Les balles se déplacent à travers l'écran et éliminent les ennemis en collision.
  # Ennemis
    -Des ennemis fixes sont présents au lancement du programme.
    -Appuyez sur la touche "n" pour ajouter des ennemis supplémentaires.
    -Les ennemis sont représentés par des cercles de couleur bleue.
## Contrôles
    v: Ajouter un nouveau véhicule.
    d: Activer/désactiver le mode de débogage pour les vecteurs des véhicules.
    f: Ajouter 100 véhicules partant du bord gauche de l'écran vers la cible.
    e: Passer au comportement de suivi (follow).
    s: Passer au comportement de furtivité (sneak).
    w: Ajouter un objet "wander" avec une couleur différente.
    k: Faire en sorte que le premier véhicule soit le leader et tire des balles.
    n: Ajouter un nouvel ennemi à la position fixe.
    Structure du Code
    Le code est divisé en classes pour les véhicules, les obstacles, les balles et les ennemis.
    Chaque classe a ses propres méthodes pour la mise à jour et l'affichage.

## 2 les fontions ajouter en plus 
 # Méthode: 'followLeader(leader)'
    Cette méthode permet à un véhicule de suivre un leader. Elle calcule la position désirée derrière le leader, puis projette la position actuelle sur la ligne définie par le leader et la position désirée. Enfin, elle appelle la méthode 'seek' pour suivre la position projetée.
 # Méthode: 'checkBoundaries()'
    Cette méthode vérifie si le véhicule se trouve trop près des bords du canvas et applique une force pour le ramener à l'intérieur, évitant ainsi qu'il ne sorte de l'écran.
 # Méthode: fire()
    Cette méthode crée une nouvelle instance de la classe Bullet à partir de la position et de la direction du véhicule, puis ajoute cette balle au tableau des balles (bullets).
 # Méthode: wander()
    Cette méthode implémente le comportement "wander" du véhicule. Elle génère un point devant le véhicule, sur un cercle, et applique une force pour se diriger vers ce point.