# Projet Unamur Secu App

## How to start the documentation

```bash
cd docs
pnpm install
pnpm run dev
```

OR

```bash
cd docker/production
docker-compose up -d
# Wait a few seconds for the container to build and start
```

And the docs will be available at [http://localhost:3002](http://localhost:3002) or at [https://projet-unamur-secu-app-stevensermeus-d439b24abae64287ff52dc50eb.gitlab.io/](https://projet-unamur-secu-app-stevensermeus-d439b24abae64287ff52dc50eb.gitlab.io/)

## Pre-commit hooks

You can install the pre-commit hooks by running the following command:

```bash
cd docs # or photo-sharing
pnpm install
pnpm lefthook install
```
