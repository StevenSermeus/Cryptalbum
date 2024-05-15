#! /bin/bash
# generate a self-signed certificate trusted by the browser
echo "Install dependencies"
sudo apt-get update
sudo apt-get install -y libnss3-tools
sudo apt-get install -y mkcert

echo "Generate a self-signed certificate"
mkcert -install
mkcert -key-file conf/nginx/certificates/key.pem -cert-file conf/nginx/certificates/cert.pem vimsnap.local vimsnap.local

# please update the docker compose command to use the correct one regarding the OS
echo "Start the production containers"
docker compose up -d --build

# generate API keys for minio
echo "Generate API keys for minio"
docker exec minio sh /init_minio_keys.sh

# request to add the host in the /etc/hosts file
echo "Please add the following line in your /etc/hosts file : "
echo "127.0.0.1 vimsnap.local"
echo "This line is necassary to access the application at https://vimsnap.local:8443/"
echo "Now, you can access the application at https://vimsnap.local:8443/"