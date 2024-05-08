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
sh docker/dev/init_minio_keys.sh
```

## Start the project

```bash
pnpm install
pnpm run dev
```




