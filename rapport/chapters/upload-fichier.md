## Upload de photos et création d'un album

### Upload de photos

Tout d'abord, il est possible d'upload une photo sans que cette dernière fasse partie d'un album. Lorsqu'une photo est upload par un utilisateur, une entrée est ajoutée pour la table "Picture" et "SharedPicture". Même si la photo n'est pas encore partagée avec quelqu'un, une entrée existe dans "SharedPicture", qui est la table permettant de voir qui a accès à la photo. Cette table va alors permettre de récupérer les photos de l'utilisateur qui ne sont pas présente dans un album.

Lorsqu'une photo est upload, une clé symétrique est générée. Cette clé symétrique va alors être utilisée pour chiffrer la photo. Il n'existe qu'une seule clé symétrique par photo même si la photo se trouve dans différents albums. Il n'y a donc pas de clé symétrique par album mais bien par photo. Le fait d'avoir une clé symétrique par photo permet, en cas de réussite d'un attaquant à récupérer cette clé, d'avoir accès uniquement à la photo en question et non à l'entièreté d'un album.

Il existe un cas particulier, lorsqu'une photo est ajoutée à un album avec un certaine personne et que cette dernière est déjà présente dans un autre album avec la même photo qui est, du coup, déjà partagée avec cette personne. Prenons 3 personnes : A, B et C. A et B ont un album en commun avec une photo x ajoutée par A. Si A, B et C crée un album commun, et que A décide d'y ajouter cette photo x, alors l'accès à la photo n'est donné qu'à C étant donné que B et A possède déjà l'accès à cette photo.

### Création d'un album

Comme expliqué précédement, la clé symétrique permettant de chiffrer les photos n'est pas basée sur un album mais bien par photo. Lorsqu'un utilisateur crée un album, l'application va alors faire une requête au serveur afin de récupérer la clé publique de l'utilisateur afin de chiffrer le nom de l'album. Le nom de l'album, est quat à lui, chiffré avec la clé publique du device de l'utilisateur. L'application envoie alors au serveur le nom de l'album chiffré ainsi que l'id du device sur lequel l'album a été créé. Le nom de l'album est alors déchiffré via la clé privée qui est stockée localement sur le device de l'utilisateur. Il s'agit du scénario classique lorsqu'un utilisateur possède un seul device.

Le choix d'utiliser la clé publique du device de l'utilisateur pour chiffrer le nom de l'album plutôt qu'une clé symétrique est que le chiffrement du nom reste quelque chose d'assez rapide contrairement au chiffrement des photos qui requière le chiffrement symétrique afin d'être performant.

Dans la réalité, quand on un utilisateur crée un album, l'application va faire une requête au serveur afin d'avoir toutes les clés publiques pour chaque device que possède l'utilisateur. Avec ces clés publique, le nom de l'album est chiffré autant de fois qu'il y a de clés publique. Un dictionnaire est alors renvoyée au serveur. Ce dictionnaire est composée d'un device id et d'un chiffrement lié à ce device via la clé publique de ce dernier.

Exemple :
deviceID1 = chiffrementPublicKeyDeviceID1
deviceID2 = chiffrementPublicKeyDeviceID2
...

Selon le device utilisé par l'utilisateur, le nom de l'album est alors déchiffré via la clé privée stockée localement.

### Stockage avec Minio

Pour envoyer la photo chiffrée au serveur, il y a d'abord besoin de la formatter. Etant donné qu'en http il n'est pas possible d'envoyer la photo chiffrée sous forme d'un array buffer, il faut formatter la photo chiffrée en hexadécimal. Une fois les données relatives à la photo stockées dans la base de données, la photo est stockée dans un serveur à part (le serveur de fichier Minio).

Concernant l'intégrité des photos, au moment d'upload le chiffrement de la photo, une transaction SQL est crée. Cette transaction va alors permettre de s'assurer que l'upload de la photo sur le serveur de fichier s'est bien déroulée. Avant de terminer la transaction, on vérifie, via une méthode de Minio, si l'upload s'est bien déroulée et que les données relative à la photo sont bien ajoutées à la base de données. S'il n'y a pas d'erreur, alors la transaction est validée et le chiffrement de la photo se trouve bien sur le serveur de fichiers Minio. En cas de problème, la transaction est annulée et les données relatives à la photo ne sont ni ajoutées à la base de données, ni au serveur de fichiers. Cela permet de s'assurer que la photo soit bien ajoutée au serveur de fichier de manière intègre.
