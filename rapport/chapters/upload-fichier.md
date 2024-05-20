## Upload de photos et création d'un album

### Upload de photos

    Tout d'abord, il est possible d'upload une photo sans que cette dernière fasse partie d'un album. Lorsqu'une photo est upload par un utilisateur, une entrée est ajoutée pour la table "Picture" et "SharedPicture". Même si la photo n'est pas encore partagée avec quelqu'un, une entrée existe dans "SharedPicture", qui est la table permettant de voir qui a accès à la photo. Cette table va alors permettre de récupréer les photos de l'utilisateur qui ne sont pas présente dans un album.

    Lorsqu'une photo est upload, une clé secrète est générée. Cette clé secrète va alors être utilisée pour chiffrer la photo. Il n'existe qu'une seule clé secrète par photo même si la photo se trouve dans différents albums. Il n'y a donc pas de clé secrète par album mais bien par photo. Le fait d'avoir une clé secrète par photo permet, en cas de réussite d'un attaquant à récupérer une clé secrète, d'avoir accès uniquement à une photo et non à l'entièreté d'un album.

    Il existe un cas particulier, lorsqu'une photo est ajoutée à un album avec un certaine personne et que cette dernière est déjà présente dans un autre album avec la même photo qui est, du coup, déjà partagée avec cette personne. Prenons 3 personnes : A, B et C. A et B ont un album en commun avec une photo x ajoutée par A. Si A, B et C crée un album commun, et que A décide d'y ajouter cette photo x, alors l'accès à la photo n'est donné qu'à C étant donné que B et A possède déjà l'accès à cette photo. 


### Création d'un album

    Comme expliqué précédement, la clé secrète permettant de chiffrer les photos n'est pas basé sur un album mais bien par photo. Lorsqu'un utilisateur crée un album, l'application va alors charger la paire de clés publique-privée de l'utilisateur afin de chiffrer, avec la clé publique, le nom de l'album. L'application envoie alors au serveur le nom de l'album chiffré ainsi que l'id du device sur lequel l'album a été créé. Le nom de l'album est alors déchiffré via la clé privée de l'utilisateur qui est stockée localement sur le device de l'utilisateur. Il s'agit du scénario classique lorsqu'un utilisateur possède un seul device. 

    Dans la réalité, quand on un utilisateur crée un album, l'application va faire une requête au serveur afin d'avoir toutes les clés publiques pour chaque device que possède l'utilisateur. Avec ces clés publique, le nom de l'album est chiffré autant de fois qu'il y a de clés publique. Un dictionnaire est alors renvoyée au serveur. Ce dictionnaire est composée d'un device id et d'un chiffrement lié à ce device via la clé publique de ce dernier. 
    
        Exemple :
            deviceID1 = chiffrementPublicKeyDeviceID1
            deviceID2 = chiffrementPublicKeyDeviceID2
        ... 

    Selon le device utilisé par l'utilisateur, le nom de l'album est alors déchiffré via la clé privée stockée localement.

    Demande uniquement la clé publique ou alors la paire de clé publique-privée
    Quid man in the middle ? qui envoie ses clés publique à l'utilisateur ?

    Avant de créer l'album, on fait une requête au serveur pour avoir toutes les clés publique de tous les devices de l'utilisateur. C'est un liste qui est envoyé au serveur avec devices id et nom de l'album chiffré. 

    Tous les chiffrements se font avec les clés publique et le déchiffrement avec la clé privées
    Chaque devices = paire de clé publique / privées

    LA Liste permet d'identifier pour chaque device :
        deviceID1 = chiffrementPublicKeyDeviceID1
        deviceID2 = chiffrementPublicKeyDeviceID2
        ... 



algo pour les photos

stockage avec Minio --> demander à Steven

Partage des clés


    On peut upload une photo sans qu'elle soit dans un album.

    Album = liste de photos

    Dans la bd, ça crée dans Picture et sharedpicture meme si on l'a partagée avec personnes encore


    Ajout d'une photo à un album à soi:
        association de la photo dans la base de données

    Ajout d'une photo à un album déjà partagé : 
        Le cas tricky c'est si la photo existe déjà dans un autre album. On récupère uniquement les personnes qui n'ont pas déjà accès à cette photo (question de perf)

    Chaque photo possède une seule clé symétrique pour être chiffrée peut importe l'album

    Dans la BDD, la table SharedPicture permet de savoir qui a déjà accès à la photo

    Pour récupérer les photos d'un user, on utilise directement la table SharedPicture

    Pareil pour un album, on utilise directement la table ShareAlbum

