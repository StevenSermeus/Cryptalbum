# How to run

## Via script (highly recommended)

The easiest way to run and launch the app is to run the script in an Ubuntu 22.04 VM with at least 15GB of storage due
to the heavy docker images (2GB of RAM and 2 cores is recommended too)

1. Navigate to compose file

``` shell
$ cd docker/production
```

The script `start.sh` will prompt for sudo privileges because It needs to write to `/etc/hosts` where it will add
the domain name vimsnap.local with some docker configuration, in order to be able to use the app (**it is required**) 

```shell
$ ./start.sh
```

**Make sure to answer yes (y) for every prompt.**

After the script is done you should be able to access the application via [https://vimsnap.local:8443](https://vimsnap.local:8443)
**only available via at this exact link** other ways to connect to it (localhost/127.0.0.1) will not work properly

In order to validate and test encryption and logging we made accessible all of these services:

1. [http://localhost:9000](https://localhost:9000) or using the IP address of your Ubuntu VM with port 9000 (http)
    - user: admin
    - password: M45153CU4PP9R0UPV1M

2. [http://localhost:8081](https://localhost:8081) or using the IP address of your Ubuntu VM with port 8081 (http)
    - user: admin
    - password: M45153CU4PP9R0UPV1M

3. [http://localhost:5050](https://localhost:5050) or using the IP address of your Ubuntu VM with port 5050 (http)
    - user: admin@vimsnap.com
    - password: M45153CU4PP9R0UPV1M

The MINIO server will let you validate that the pictures are in fact encrypted (after clicking the pictures bucket)
The SEQ server will show the logs of the application
The pgadmin server will show the structure of our DB (To see the tables after connecting to the postgres server with
the same password, on the left sidebar click on servers > Local PostgreSQL > Databases > database > schemas > public > tables,
then right click on a table and view the data)
