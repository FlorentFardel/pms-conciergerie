# PMS Conciergerie — Architecture & Normes Techniques

## 1. Stack Technique
* **Front-end :** Angular 18 (Standalone Components, Signals, SCSS, PWA responsive).
* **Back-end :** Node.js LTS, Express.js.
* **Base de données :** PostgreSQL 17.

## 2. Règles de Développement & Scalabilité
* **Taille de fichier :** Max 200 lignes par fichier.
* **Single Responsibility Principle (SRP) :** Un composant = une seule responsabilité visuelle. Un service = une seule responsabilité métier.
* **Don't Repeat Yourself (DRY) :** Factorisation stricte. Interdiction de réécrire du code ou des requêtes existantes.
* **Dossier `shared/` Front-end :** Composants UI réutilisables (`ui-button`, `ui-channel-badge`, etc.) et Pipes purement autonomes.
* **Architecture Back-end :** Séparation stricte `Routes` -> `Controllers` -> `Services` -> `Repositories`.
* **Règles SCSS :** Styles localisés au composant (< 50 lignes). Variables globales centralisées (`tokens`).
* **Design :** Mobile-first, 100 % responsive (adapté format PWA 9:16 et Desktop).

## 3. Identité Visuelle & Origines de Réservation
Chaque canal de réservation dispose d'un badge/logo explicite :
* `AIRBNB` : Logo rose/rouge `[ 🏠 Airbnb ]`
* `BOOKING` : Logo bleu `[ 🅱️ Booking ]`
* `DIRECT` : Logo émeraude `[ 🤝 Direct ]`
* `MANUAL_BLOCK` : Logo gris `[ 🔒 Privé ]`

## 4. Base de Données (`pms_conciergerie`)
* **Accès :** Utilisateur dédié `pms_user`.
* **Gestion des réservations :** Support natif du statut manuel via `is_manual_entry` et `block_reason`.