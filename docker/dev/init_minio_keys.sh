#! /bin/bash

echo " \
This script is used to initialize the minio keys for the dev environment. \
It will install the minio client (mc) and connect it to the minio server. \
Then it will create a new key pair for the root user. \
"

# variables
MINIO_ADDR="http://localhost:9000"
MINIO_ALIAS="minio_dev"
MINIO_ROOT_USER="root"
MINIO_ROOT_PASSWORD="password"
MINIO_USER="produser"
MINIO_PASSWORD="prodpassword"
MINIO_NAME="devkeys"
# this secret key were generated by python lib : minio-keygen
# production keys
MINIO_ACCESS_KEY="Sxmop8h_O4GD9ptJN2E"
MINIO_SECRET_KEY="BO_JOsSBePhEUjXe0JbImQncyMxK_tMl_Ld6GrGT"
# developpment keys (using)
MINIO_ROOT_ACCESS_KEY="KhYRsb3hLv5UDKWZ5u0"
MINIO_ROOT_SECRET_KEY="dppfPZSXpSduIaC3JqDG2efCjuq9DcrsQE7rqbur"

set -e

# install mc
echo "Installing minio client (mc)"
# check if wget is installed
if ! [ -x "$(command -v wget)" ]; then
    # install wget
    echo "wget is not installed. Installing wget"
fi

# check if mc is installed
if [ -x "$(command -v mc)" ]; then
    echo "mc is already installed"
else
    wget https://dl.min.io/client/mc/release/linux-amd64/mc
    chmod +x mc
    sudo mv mc /usr/local/bin/mc
    # check if the path /usr/local/bin/ is in the PATH
    if [[ ":$PATH:" == *":/usr/local/bin:"* ]]; then
        echo "/usr/local/bin is already in the PATH"
    else
        # add the path to the PATH
        # if $SHELL is bash
        if [[ $SHELL == "/bin/bash" || $SHELL == "/usr/bin/bash" ]]; then
            echo "export PATH=$PATH:/usr/local/bin" >> ~/.bashrc
            source ~/.bashrc
        # if $SHELL is zsh
        elif [[ $SHELL == "/bin/zsh" || $SHELL == "/usr/bin/zsh" ]]; then
            echo "export PATH=$PATH:/usr/local/bin" >> ~/.zshrc
            source ~/.zshrc
        # if $SHELL is fish
        elif [[ $SHELL == "/bin/fish" || $SHELL == "/usr/bin/fish" ]]; then
            echo "set -x PATH $PATH /usr/local/bin" >> ~/.config/fish/config.fish
            source ~/.config/fish/config.fish
        # if SHELL is ksh
        elif [[ $SHELL == "/bin/ksh" || $SHELL == "/usr/bin/ksh" ]]; then
            echo "export PATH=$PATH:/usr/local/bin" >> ~/.kshrc
            source ~/.kshrc
        else
            echo "SHELL is not bash, zsh or fish ?!"
        fi
    fi
fi

# Connect mc (minio client) to minio server
echo "Connecting mc to minio server"
# check if the minio server is already added
if mc config host list | grep -q $MINIO_ALIAS; then
    echo "Minio server is already added"
else
    mc config host add $MINIO_ALIAS $MINIO_ADDR $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD
fi
# create a new key pair for root user
echo "Creating a new key pair for root user"
# check if the key pair is already created
if mc admin user svcacct info $MINIO_ALIAS $MINIO_ROOT_ACCESS_KEY | grep -q "AccessKey"; then
    echo "Key pair for root user is already created"
else
    mc admin user svcacct add --access-key $MINIO_ROOT_ACCESS_KEY --secret-key $MINIO_ROOT_SECRET_KEY --expiry 2024-12-20T10:00 --name $MINIO_NAME $MINIO_ALIAS $MINIO_ROOT_USER
fi