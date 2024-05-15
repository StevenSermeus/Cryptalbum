FROM nginx:latest

# Copier le fichier de configuration Nginx
COPY ./conf/nginx/nginx.conf /etc/nginx/nginx.conf

# Exposer les ports 80
EXPOSE 80
EXPOSE 443