# Turborepo starter

Get hash password for Seqlog `PH=$(echo '<password>' | docker run --rm -i datalust/seq config hash) && echo "$PH"`

## Start the project

```bash
pnpm install
pnpm run dev
```

## Start the needed docker

```bash
cd docker/dev
docker-compose up -d
```
