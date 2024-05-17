# Docker for production

Here, you can obtain more informations for container docker in production environment as build, run and execute all command.

## First, the .env.exemple

This env file show an exemple for creating your `.env` file that you'll use to run container later. So, create a new file named `.env`, copy the content of `.env.exemple` to the new env file and update the content depending on your deploiement.

**Commands** :

```bash
# on linux
# current workdir : docker/production
touch .env
cat .env.exemple >> .env
# update the content (for this project no change needed)
```

## Second, generate key and certificat

You have to generate a certificat and a key for the reverse proxy.
The most easiest way is using `mkcert` tools. Refer to the [documentation](https://github.com/FiloSottile/mkcert) for installing !
After that, execute the following commands:

```bash
# current workdir: docker/production
mkcert -install
mkcert -key-file conf/nginx/certificates/key.pem -cert-file conf/nginx/certificates/cert.pem vimsnap.local vimsnap.local
```

But, you can use another tools if you want. The only rules is respecting the name of file : `cert.pem` and `key.pem`.

## Third, run the container

For deploying the project, you can execute all commands (without using the script) like that :

```bash
# current workdir: docker/production
# run the container
docker compose --env-file ./.env up -d
# create the minio API keys
docker exec minio sh /init_minio_keys.sh
# push the database (if isn't done)
docker compose run push-db
# add the following line in your /etc/hosts
echo "127.0.0.1     vimsnap.local" | tee -a /etc/hosts
echo "127.0.0.1     host.docker.internal" | tee -a /etc/hosts
```

Now you can access to the [app](https://vimsnap:8443) : if you add the specifid line in your `/etc/hosts` file. Or, you can use this instead [alternative_link](https://127.0.0.1:8443) : localhost use.

## Debug, log container

You can debug your app by using the following command :

```bash
docker compose log [TAG]
```

Where [TAG] is a tag used in the `docker-compose.yaml` file in the logging config for each service !

## Fast deploying

It's possible to deploy the application rapidely thanks to the `start.sh` script.
**This script requires some dependencies** :

1. mkcert
2. docker
3. docker-compose
4. `.env` file created regarding the exemple one

Except for the `.env` file, all other dependencies can be installed using this script.

This script is complete and display more usefull informations about the deploying, so execute the script and refer to the information diplayed :

```bash
# current workdir: docker/production
sh start.sh
```

Informations :

The end of the script will generate a rapport for all process :

1. generate certificat and key
2. configure the /etc/hosts file
3. installed docker if is necessary
4. run the container
5. generate the API key

The corresponding color signify something :

- Red : something went wrong (please refer to the information displayed)
- Green : all went well or advice is showing

During the script execution, it will use many environment file (one for the application under `apps/web` directory and one for the docker under `docker/production` folder). If this files are not present, it will generate them from the template one named `example`. It may cause some issues, so please create it by your own before running this script.
