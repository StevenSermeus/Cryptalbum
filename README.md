# Turborepo starter

Get hash password for Seqlog `PH=$(echo '<password>' | docker run --rm -i datalust/seq config hash) && echo "$PH"`

## Execute the project in developpment environment

### Start the needed docker

```bash
# workdir : docker/dev
cd docker/dev
docker-compose up -d
```

### Push the database schema

```bash
export DATABASE_URL="postgresql://postgres:password@localhost:5432/database"
npx prisma db push --schema=./apps/web/prisma/schema.prisma
```

### Create API keys minio

```bash
# workdir : ./
# dev env
sh docker/dev/init_minio_keys.sh
```

### Start the project

```bash
# workdir : ./
pnpm install
pnpm run dev
```

## In production environment

For this part, don't forget to create a `.env` file for the docker container in the root directory of production docker regarding the environment file example bellow : [env-file-example](docker/production/.env.example)

For this part, don't forget to create a `.env` file in the root apps directory regarding the environment file example bellow : [env-file-example](apps/web/.env.example.production)

In production envrionment, you should to refer to the [README.md](docker/production/README.md) file in docker/production folder !

If you just want to start the project and begin with the default config working, just run the following command :

```bash
cd docker/production
sh start.sh # ./start.sh works too
```
