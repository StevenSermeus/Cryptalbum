# Cryptographie

Dans le cadre de ce projet nous avons utilisé deux types de cryptographie : la cryptographie symétrique et la cryptographie asymétrique.

## Cryptographie asymétrique

Celle-ci est utilisée pour l'authentification des utilisateurs ainsi que le partage de clés de chiffrement symétrique. Nous avons utilisé la librairie standard de Javascript, `crypto`, pour générer des clés RSA et les utiliser pour chiffrer et déchiffrer des données. La librairie standard permet uniquement d'utilisé l'algorithme RSA pour de chiffrement asymétrique. Nous avons utilisé une clé de taille 4096, même si cette taille de clé est suspectée être cassable. Pour le moment elle reste sécurisée en cas de besoin il est toujours possible d'augmenter la taille de la clé.

### Authentification

Lorsqu'un utilisateur s'inscrit sur notre application, un couple de clés RSA est généré. La clé publique de l'utilisateur est stockée dans la base de données et la clé privée est stockée dans le navigateur de l'utilisateur. Si l'utilisateur souhaite se connecter, il doit déchiffrer un challenge qui lui est envoyé par le serveur. Ce challenge est chiffré avec la clé publique de l'utilisateur. Si l'utilisateur parvient à déchiffrer le challenge, il est considéré comme authentifié étant donné que seul l'utilisateur possède la clé privée correspondante à la clé publique stockée dans la base de données peut déchiffrer le challenge.

### Partage de clés de chiffrement symétrique

Un méchanisme similaire est utilisé pour le partage de clé de chiffrement symmétrique, avant leur envoi vers le serveur, elles sont chiffrées avec la clé publique de l'utilisateur destinataire. Ainsi seul l'utilisateur destinataire peut déchiffrer la clé de chiffrement symétrique.

## Cryptographie symétrique

Nous avons choisi d'utilisé AES-GCM, un algorithme de chiffrement symétrique qui permet de chiffrer et d'authentifier les données. Tout comme pour la cryptographie asymétrique, nous avons utilisé la librairie standard de Javascript, `crypto`, pour chiffrer et déchiffrer les données.

# Hmac

Pour assurer que les logs n'ont pas été modifiés, nous avons utilisé un HMAC. Celui-ci est généré à partir du contenu du log et d'une clé secrète stockée sur le serveur. Le HMAC est stocké dans le log. Si le message est modifié, le HMAC ne correspondra plus au contenu du log et nous pourrons détecter la modification.
