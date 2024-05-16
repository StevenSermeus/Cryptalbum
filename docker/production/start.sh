#! /bin/sh

# variables
MKCERT_OK=0
DOCKER_OK=0
HOSTS=0
# colors
NC='\033[0m' # No Color
# Regular Colors
Black='\033[0;30m'        # Black
Red='\033[0;31m'          # Red
Green='\033[0;32m'        # Green
Yellow='\033[0;33m'       # Yellow
Blue='\033[0;34m'         # Blue
Purple='\033[0;35m'       # Purple
Cyan='\033[0;36m'         # Cyan
White='\033[0;37m'        # White

# Bold
BBlack='\033[1;30m'       # Black
BRed='\033[1;31m'         # Red
BGreen='\033[1;32m'       # Green
BYellow='\033[1;33m'      # Yellow
BBlue='\033[1;34m'        # Blue
BPurple='\033[1;35m'      # Purple
BCyan='\033[1;36m'        # Cyan
BWhite='\033[1;37m'       # White

# Underline
UBlack='\033[4;30m'       # Black
URed='\033[4;31m'         # Red
UGreen='\033[4;32m'       # Green
UYellow='\033[4;33m'      # Yellow
UBlue='\033[4;34m'        # Blue
UPurple='\033[4;35m'      # Purple
UCyan='\033[4;36m'        # Cyan
UWhite='\033[4;37m'       # White

# Background
On_Black='\033[40m'       # Black
On_Red='\033[41m'         # Red
On_Green='\033[42m'       # Green
On_Yellow='\033[43m'      # Yellow
On_Blue='\033[44m'        # Blue
On_Purple='\033[45m'      # Purple
On_Cyan='\033[46m'        # Cyan
On_White='\033[47m'       # White

# High Intensity
IBlack='\033[0;90m'       # Black
IRed='\033[0;91m'         # Red
IGreen='\033[0;92m'       # Green
IYellow='\033[0;93m'      # Yellow
IBlue='\033[0;94m'        # Blue
IPurple='\033[0;95m'      # Purple
ICyan='\033[0;96m'        # Cyan
IWhite='\033[0;97m'       # White

# Bold High Intensity
BIBlack='\033[1;90m'      # Black
BIRed='\033[1;91m'        # Red
BIGreen='\033[1;92m'      # Green
BIYellow='\033[1;93m'     # Yellow
BIBlue='\033[1;94m'       # Blue
BIPurple='\033[1;95m'     # Purple
BICyan='\033[1;96m'       # Cyan
BIWhite='\033[1;97m'      # White

# High Intensity backgrounds
On_IBlack='\033[0;100m'   # Black
On_IRed='\033[0;101m'     # Red
On_IGreen='\033[0;102m'   # Green
On_IYellow='\033[0;103m'  # Yellow
On_IBlue='\033[0;104m'    # Blue
On_IPurple='\033[0;105m'  # Purple
On_ICyan='\033[0;106m'    # Cyan
On_IWhite='\033[0;107m'   # White

echo """
    |----------------------------------------------------------------------------------|
    | This script is used to start the production containers.                          |
    | It install all the necessary tools and generate a self-signed certificate        |
    | for the application.It also generate API keys for minio, configure project       |
    | and start the containers. Take care about the inforamtions displayed             |
    | in the terminal, because this script is only designed                            |
    | for debian and Archlinux based distro.                                           |
    |----------------------------------------------------------------------------------|
"""
echo """
    |----------------------------------------------------------------------------------|
    | This script require elevated privillège to update the /etc/hosts file.           |
    | Moreover, it need some dependies, so check it before continuing execution :      |
    | ${Purple}1. mkcert${NC} ${Green}(possible to install it with the script)${NC}                               |
    | ${Purple}3. docker${NC}                                                                        |
    | ${Purple}4. docker-compose${NC}                                                                |
    |----------------------------------------------------------------------------------|
"""

echo """
    Do you want to continue the execution of the script ? (y/n)
"""

read -r response

if [ "$response" = "n" ]; then
    echo """
        ${Green}Please install the dependencies and run the script again.${NC}
    """
    exit 1
fi

# check the current directory (pwd) contains the docker/production folder
if [ ! -d "conf" ]; then
    echo """
        ${Red}The current directory does not contain the docker/production folder${NC}
    """
    echo """
        ${Green}Please start the script from the root of the docker production folder : 
        docker/production !${NC}
    """
    exit 1
fi

# check if user want to install or stop the containers
echo """
    Do you want to start the production containers ? (y/n)
"""

read -r response

if [ "$response" = "n" ]; then
    echo """
        The container will be stopped. Exiting ...
    """
    docker compose down
    echo """
        ${Green}The production containers have been stopped.${NC}
    """
    exit 1
fi

# ask to the user for update its /etc/hosts file
echo """
    |-----------------------------------------------------------------------|
    | This script will run a web application behind a reverse proxy.        |
    | So, you need to update your /etc/hosts file to access the application |
    | by adding the following line :                                        |
    | ${BWhite}127.0.0.1 vimsnap.local${NC}                                 |
    |-----------------------------------------------------------------------|
"""
echo """
    Do you want to update your /etc/hosts file (required elevating privillège) ? (y/n)
"""

read -r response
if [ "$response" = "y" ]; then

    # check if the "127.0.0.1    vimsnap.local" line is already in the /etc/hosts file
    if grep -q "127.0.0.1    vimsnap.local" /etc/hosts;then
        echo """
            ${Green}The /etc/hosts file has already been updated.${NC}
        """
        HOSTS=1
    else
        echo """
            Updating /etc/hosts file ...
        """
        echo '127.0.0.1    vimsnap.local' | sudo tee -a /etc/hosts
        HOSTS=1
    fi
    
else
    echo """
        ${Green}Please update manually your /etc/hosts file to access the application
        by adding the following line :${NC} ${BGreen}127.0.0.1   vimsnap.local${NC}
    """
fi

# generate a self-signed certificate trusted by the browser

# ask to install mkcert
echo """
    This script will generate a self-signed certificate for the application.
    To do that, it will use mkcert. Do you want to install it (recommanded) ? (y/n)
"""

read -r response

if [ "$response" = "y" ]; then
    # check if mkcert is installed
    if ! [ -x "$(command -v mkcert)" ]; then
        # check if the package manager is apt
        if [ -x "$(command -v apt)" ]; then
            echo """
                mkcert is not installed. Installing ...
            """
            sudo apt-get update
            sudo apt-get install -y libnss3-tools
            sudo apt-get install -y mkcert
        # check if the package manager is pacman
        elif [ -x "$(command -v pacman)" ]; then
            echo """
                mkcert is not installed. Installing ...
            """
            sudo pacman -Syu
            sudo pacman -S nss
            sudo pacman -S mkcert
        else
            echo """
                ${Red}mkcert is not installed. 
                This script take charge only debian and Archlinux based distro. 
                Please install it manually.
                Refer to the documentation :${NC} ${BCyan}https://github.com/FiloSottile/mkcert${NC} ${Red}to install it manually !${NC}
            """
            echo """
                You can also use another tool to generate a self-signed certificate.
                ${Green}Generate a self-signed certificate, 
                install it on your browser and then, 
                generate key and certificate for the application 
                under${NC} ${BGreen}docker/production/conf/nginx/certificates/${NC} ${Green}folder named : 
                key.pem
                cert.pem${NC}
            """
        fi
    else # mkcert is installed
        echo """
            Mkcert is already installd. 
            Generate a self-signed certificate. Generating ...
        """
        mkcert -install
        mkcert -key-file conf/nginx/certificates/key.pem -cert-file conf/nginx/certificates/cert.pem vimsnap.local vimsnap.local
        MKCERT_OK=1
    fi
else # mkcert is not installed
    echo """
        ${Red}mkcert is not installed. 
        This script take charge only debian and Archlinux based distro. 
        Please install it manually.
        Refer to the documentation :${NC} ${BCyan}https://github.com/FiloSottile/mkcert${NC} ${Red}to install it manually !${NC}
    """
    echo """
        You can also use another tool to generate a self-signed certificate.
        ${Green}Generate a self-signed certificate, 
        install it on your browser and then, 
        generate key and certificate for the application 
        under${NC} ${BGreen}docker/production/conf/nginx/certificates/${NC} ${Green}folder named : 
        key.pem
        cert.pem${NC}
    """
fi

# check if docker is installed
if [ -x "$(command -v docker)" ]; then
    
    # check if the environment file exists
    if [ ! -f .env ]; then
        echo """
            ${Red}The .env file does not exist. 
            Please create it regarding the exemple one before running this script.${NC}
        """
    else
        # please update the docker compose command to use the correct one regarding the OS
        echo """
            Start the production containers. Starting ...
        """
        docker compose --env-file ./.env up -d --build

        # generate API keys for minio
        echo """
            Generate API keys for minio. Generating ...
        """
        docker exec minio sh /init_minio_keys.sh
        DOCKER_OK=1
    fi
else
    echo """
        ${Red}Docker is not installed. 
        Please install it before running this script.
        """
    echo """    
        ${Green}Refer to the documentation :${NC} ${BGreen}https://docs.docker.com/get-docker/ ${NC}
        ${Green}Be sure to have docker-compose installed too :${NC} ${BGreen}https://docs.docker.com/compose/install/ ${NC}
    """
fi

# display the informations
echo """
    Resume informations of installation :
    -------------------------------------
"""
if [ $MKCERT_OK -eq 1 ]; then
    echo """
        MKCERT Rapport :
        ----------------
        ${Green}A self-signed certificate has been generated and installed on your browser.
        You can find the key and certificate under docker/production/conf/nginx/certificates/ folder.${NC}
    """
else
    echo """
        MKCERT Rapport :
        ----------------
        ${Red}No self-signed certificate has been generated.
        Please generate it manually 
        and install it on your browser or place it 
        under the docker/production/conf/nginx/certificates folder, under the name : 
        key.pem and cert.pem${NC}
    """
fi

if [ $DOCKER_OK -eq 1 ]; then
    echo """
        DOCKER Rapport :
        ----------------
        ${Green}The production containers have been started.
        You can already acces to the application. Click on https://127.0.0.1:8443 ${NC}
    """
else
    echo """
        DOCKER Rapport :
        ----------------
        ${Red}The production containers have not been started.
        Please install docker and docker-compose 
        and start the containers by running this script again.${NC}
    """
fi

if [ $HOSTS -eq 1 ]; then
    echo """
        HOSTS Rapport :
        ---------------
        ${Green}You can access the application at :${NC} ${BGreen}https://vimsnap.local:8443 ${NC}
    """
else
    echo """
        HOSTS Rapport :
        ---------------
        ${Red}The /etc/hosts file has not been updated.
        Please update it manually to access the application correctly.
        Add the following line :${NC} ${BRed}127.0.0.1    vimsnap.local${NC}
    """
fi