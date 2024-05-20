## Partage des photos et albums

### Partage d'une photo

Concernant le partage d'une photo, il faut d'abord récupérer les clés publique de l'utilisateur avec qui on veut partager la photo. Pour cela, il y a une requête faite au serveur afin de récupérer toutes les clés publique de chaque device de l'utilisateur à qui on souhaite partager notre photo. Le serveur va alors nous répondre avec un dictionnaire contenant chaque id de chaque device avec sa clé publique correspondante. Une fois les clés publique récupérée, la clé secrète utilisée pour chiffrer la photo va alors être chiffrée autant de fois qu'il existe de clé publique. Il y a alors un dictionnaire renvoyé au serveur contenant l'id de chaque device avec le chiffrement de la clé secrète par device. --> Revoir formulation. De plus, il est tout à fait possible de partager une photo qui n'est présente dans aucun album.

### Partage d'un album

Concernant le partage d'un album, il s'agit du même mécanisme que celui décris précédemment concernant le partage d'une photo. Il y a cependant le nom de l'album qui lui aussi est chiffré. Pour cela, blablabla

Partage d'une photo :

    A la place de demander les clés publiques de chaque device, on demande au serveur toutes les clés publique des devices de l'utilisateur. Chaque photo a une clé symétrique qui est chiffré. Du coup pour chaque clés publiques du devices, on chiffre la clé symétrique pour une photo et on envoie la liste au serveur:
        deviceID1 = chiffrementKeySymétricDeviceID1
        deviceID2 = chiffrementKeySymétricDeviceID2

    Pour les photos on chiffre avec une clé symétrique et avec le nom des albums non pour une raison de perfermances.

1ère opération, tjs récupérer les clés publique de chaque device de l'user avec qui on veut share. Puis on chiffre le nom de l'album avec chaque clé publique de chaque device du user.

On peut partager une photo qui n'est pas dans un album

Gestion d'accès

Creation d'un album :

Quand un user crée un album, on charge la paire de clé privé/publique et on chiffre avec la clé publique du user qui a créé l'album le NOM de l'album. Et on envoie le nom de l'album chiffré et l'id du device

Avant de créer l'album, on fait une requête au serveur pour avoir toutes les clés publique de tous les devices de l'utilisateur. C'est un liste qui est envoyé au serveur avec devices id et nom de l'album chiffré.

Tous les chiffrements se font avec les clés publique et le déchiffrement avec la clé privées
Chaque devices = paire de clé publique / privées

LA Liste permet d'identifier pour chaque device :
deviceID1 = chiffrementPublicKeyDeviceID1
deviceID2 = chiffrementPublicKeyDeviceID2
...
