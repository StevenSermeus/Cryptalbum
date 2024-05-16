FROM datalust/seq:latest

# Install Curl
RUN apt update && apt install -y curl

# Expose ports
EXPOSE 5341
EXPOSE 80