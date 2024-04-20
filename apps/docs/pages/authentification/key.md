# Authentification avec clé asymétrique

L'authentification avec clé asymétrique est une méthode d'authentification qui utilise une paire de clés, une clé privée et une clé publique, pour authentifier un utilisateur. La clé privée est utilisée pour déchiffrer les données chiffrées par la clé publique. La clé publique est utilisée pour chiffrer les données qui peuvent être déchiffrées par la clé privée.

On peut trust le fait de discuter avec le bon serveur en vérifiant la signature de la clé publique du serveur avec une autorité de certification (CA). La CA est une entité de confiance qui signe les clés publiques des serveurs pour garantir leur authenticité. Celle-ci n'authentifie pas l'application mais le serveur, plusieurs applications peuvent être hébergées sur un même serveur. Pour authentifier l'application, il faut utiliser une autre pair de clés asymétriques qui sera signée par la clé privée du serveur. Ce qui crée une chaine de confiance.

L'authentification se passe en plusieurs étapes :

```mermaid
sequenceDiagram
    participant Client
    participant Serveur
    Client->>Serveur: Demande de connexion
    Serveur->>Client: Envoi de la clé public du serveur et un challenge chiffré avec la clé publique du client
    Client->>Serveur: Envoi du challenge déchiffré puis re-chiffré avec la clé publique du serveur
    Serveur->>Client: Vérification du challenge
    Serveur->>Client: Envoi le matériel de session
```

Pourquoi avoir re-chiffré le challenge avec la clé publique du serveur ? Cela permet d'éviter un clair chiffré qui pourrait être intercepté et réutilisé par un attaquant en cas de compromission de la connexion ou du protocole de communication.

# Connection depuis un autre client

```mermaid
sequenceDiagram
  participant Client-device-1
  participant Serveur
  participant Client-device-2


  Client-device-2->>Serveur: Demande d'enregistrement de la clé publique
  activate Client-device-2
  activate Serveur
  Serveur->>Client-device-1: Demande de validation de la clé publique
  activate Client-device-1
  Client-device-1->>Serveur: Validation de la clé publique
  deactivate Client-device-1
  Client-device-2->>Serveur: Connexion
  deactivate Client-device-2
  deactivate Serveur
```
