# Minio

Minio est un serveur de stockage d'objets compatible avec l'API S3. Il est open source et peut être déployé sur n'importe quel système de stockage compatible avec le protocole HTTP. Nous utilisons Minio pour déléguer le stockage des fichiers à un service tiers prévu à cet effet.

## Création d'une clé d'accès

Il est nécessaire de créer une clé d'accès pour pouvoir utiliser Minio. Pour cela, rendez-vous sur le site de [Minio](http://localhost:9001/login) (Avoir lancer le docker avant) et connectez-vous avec les identifiants présents dans la docker compose. Aller sur l'onglet `Access Key` et cliquez sur `Create Access Key`. Vous obtiendrez alors une clé d'accès et une clé secrète. Donnez un nom à votre clé d'accès et une description + date d'expiration si vous le souhaitez. Copiez les clés d'accès et secrètes dans un fichier `.env` dans `apps/web`.
