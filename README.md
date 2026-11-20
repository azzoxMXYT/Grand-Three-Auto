# Pacific Drive

Prototype de jeu de conduite en monde ouvert, à l’identité originale, développé avec Three.js et Vite. Aucun asset de GTA n’est utilisé.

## Lancer

```sh
npm install
npm run dev
```

Ouvrir l’URL affichée par Vite. `npm run build` génère la version de production.

## Commandes

- ZQSD, WASD ou flèches : conduire / marcher
- E : sortir du véhicule ou y entrer à proximité
- Espace : freiner
- Maj : courir à pied
- C : changer de caméra
- R : replacer le véhicule au départ
- Échap : pause

Des commandes tactiles sont également disponibles sur petit écran.

Rejoignez les balises jaunes pour gagner 2 500 $ et débloquer la destination suivante. Le bouton de mission permet de masquer ou d’afficher l’itinéraire sur la mini-carte.

## Périmètre

Ville procédurale stylisée, collisions avec les bâtiments, circulation simplifiée, trois destinations récurrentes et trois vues caméra. Ce prototype n’est pas un jeu de l’ampleur de GTA V : pas de sauvegarde, de multijoueur, d’intérieurs, de combats ou d’audio. WebGL est nécessaire.

## Télécharger le jeu Windows (.exe)

Dépôt : https://github.com/azzoxMXYT/Grand-Three-Auto

1. Ouvrez l’onglet **Actions**, puis **Version Windows**.
2. Ouvrez la dernière compilation réussie de la branche `arena/e83fd17f-grand-three-auto`.
3. Dans **Artifacts**, téléchargez **Pacific-Drive-Windows-x64** (connexion GitHub requise ; conservé 30 jours).
4. Décompressez le ZIP et lancez `Pacific-Drive-1.0.0-Windows-x64.exe` sur Windows 10/11 64 bits.

L’exécutable portable n’a pas besoin d’installation, de Node.js, de serveur ou de droits administrateur. Tous les assets du jeu sont inclus. La première ouverture peut prendre quelques secondes. La touche F11 permet de passer en plein écran avec Electron.

### Compiler soi-même sur Windows

Avec Node.js 22 et Git installés :

```powershell
git clone --branch arena/e83fd17f-grand-three-auto https://github.com/azzoxMXYT/Grand-Three-Auto.git
cd Grand-Three-Auto
npm ci
npm run dist:win
```

Le fichier `.exe` est placé dans `release/`. `npm run desktop` lance le jeu dans une fenêtre de bureau sans empaquetage.

### Sécurité et avertissements Windows

Cette version de développement **n’est pas signée**. Ni l’absence d’alerte Defender, ni l’absence d’avertissement SmartScreen ne peut être garantie. Ces deux mécanismes sont différents. Aucune protection Windows n’est désactivée ou contournée par ce projet. Le jeu n’utilise ni obfuscateur ni script de téléchargement à l’exécution et la fenêtre n’a pas accès à Node.js. Une somme SHA-256 accompagne chaque compilation pour vérifier l’intégrité du téléchargement (ce n’est pas une signature numérique).

Pour une distribution publique, l’éditeur devra signer les binaires avec un certificat de signature de code reconnu ou un service de signature approuvé, et soumettre à Microsoft les éventuels faux positifs. Ne désactivez pas l’antivirus et n’ajoutez pas d’exclusion pour lancer un fichier signalé.
