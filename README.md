# Turborepo starter

Get hash password for Seqlog `PH=$(echo '<password>' | docker run --rm -i datalust/seq config hash) && echo "$PH"`

## Start the needed docker

```bash
cd docker/dev
docker-compose up -d
```

## Push the database schema

```bash
export DATABASE_URL="postgresql://postgres:password@localhost:5432/database"
npx prisma db push --schema=./apps/web/prisma/schema.prisma
```

## Create API keys minio

```bash
# dev env
sh docker/dev/init_minio_keys.sh
```

## Start the project

```bash
pnpm install
pnpm run dev
```

## In production environment

You can use the `start.sh` script in `docker/production` folder to start and setup all project. Refer to the recomandations during the script execution (only working and tested on linux ubuntu 22.04 LTS).
