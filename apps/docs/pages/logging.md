# Gestion des logs

## Logger

Pour le logging de l'application, nous utilisons le package `logcm` qui a été développé par un membre du groupe. Ce package permet de logger les messages avec différents providers (console, fichier, etc.) et de les formatter. Il permet de vérifier si un message a été modifié ou non via un système de hmac. Ce hmac est généré à partir d'une clé secrète qui est passée en paramètre lors de la création du logger. Dans le cas de la majorité des providers le hmac est ajouté au message. Dans le cas du provider distant le hmac n'est pas fourni mais sera calculé puis renvoyé par le serveur distant pour vérifier que le message n'a pas été modifié.

Ce package est disponible sur [npm](https://www.npmjs.com/package/logcm).
