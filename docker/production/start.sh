#! /bin/bash
# generate a self-signed certificate
echo "Generate a self-signed certificate"
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./conf/nginx/ssl/nginx.key -out ./conf/nginx/ssl/nginx.crt -subj "/C=be/ST=Namur/L=Namur/O=Unamur/OU=IT departement/CN=unamur.be"

# please update the docker compose command to use the correct one regarding the OS
echo "Start the production containers"
docker compose up -d --build

# generate API keys for minio
echo "Generate API keys for minio"
docker exec minio sh /init_minio_keys.sh

# request to add the host in the /etc/hosts file
echo "Please add the following line in your /etc/hosts file : "
echo "127.0.0.1 t3-app.local"
echo "Now, you can access the application at https://t3app.local:8443/"