## Création et management des utilisateurs

petit diagramme de séquences (avec la gestion des key)

### Authentification

Algo

Next-Auth

Account, Session, USer, Verification toker --> Vient via NextAuth



### Management des devices

§ sur le fonctionnement d'un user avec plusieurs devices

Quand un user ajoute un device, on génère une paire de clé pour ce device
L'utilisateur doit se co à un device déjà trust et dire qu'on trust le device ajouté

On appele la méthode addDevice. L'user doit alz dans un device trust et cliquer sur le bouton pour trust le nouvel device. A ce moment on chiffre toutes les photos et album avec la clé publique de ce device.

Quand on untrust le device, alors le device n'a plus accès aux photo, via le "isTrusted" dans la table Device

Demander à Steven a quel moment on check quand le device est Trust --> C'est la première chose, première requête on check si le device est trust (Dans le fichier trpc.ts, voir protectedProcedure). Donc en gros chaque procédure son des protectedProcedure sauf login et connexion
