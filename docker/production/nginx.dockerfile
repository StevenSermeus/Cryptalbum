FROM nginx:latest

# Copier le fichier de configuration Nginx
COPY ./conf/nginx/nginx.conf /etc/nginx/nginx.conf

# Exposer les ports 80
EXPOSE 8080
EXPOSE 8443