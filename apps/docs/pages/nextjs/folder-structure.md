# Structure de fichier

```bash
# this was done at the start of the project
.
├── README.md
├── next-env.d.ts
├── next.config.js
├── package.json
├── pnpm-lock.yaml
├── postcss.config.cjs
├── prettier.config.js
├── prisma
│   └── schema.prisma
├── public
│   └── favicon.ico
├── src
│   ├── env.js
│   ├── pages
│   │   ├── _app.tsx
│   │   ├── api
│   │   │   ├── auth
│   │   │   │   └── [...nextauth].ts
│   │   │   └── trpc
│   │   │       └── [trpc].ts
│   │   └── index.tsx
│   ├── server
│   │   ├── api
│   │   │   ├── root.ts
│   │   │   ├── routers
│   │   │   │   └── post.ts
│   │   │   └── trpc.ts
│   │   ├── auth.ts
│   │   └── db.ts
│   ├── styles
│   │   └── globals.css
│   └── utils
│       └── api.ts
├── tailwind.config.ts
└── tsconfig.json

```

## Fichier de configuration important

- `tsconfig.json` - Configuration TypeScript
- `next.config.js` - Configuration Next.js
- `prisma/schema.prisma` - Configuration Prisma et définition du schéma de la base de données

## Dossier important

Le dossier `src` contient tout le code source de l'application. Next.js porpose deux type de dossier le dossier `pages` ou le dossier `app`. Les deux ont des implications différentes mais on un même but, qui est le routage de l'application. Dans le cas de notre application, nous avons choisi d'utiliser le dossier `pages` pour le routage de l'application. Celui-ci est plus stable et plus facile à utiliser. Le nom des fichiers dans le dossier `pages` correspond à l'URL de la page. Par exemple, le fichier `src/pages/index.tsx` correspond à l'URL `/`. Les fichiers avec des crochets `[]` correspondent à des paramètres dynamiques. Par exemple, le fichier `src/pages/api/auth/[trpc].ts` correspond à l'URL `/api/auth/:trpc`. Quant au fichier avec des crochets et des points de suspension `...`, ils pourront matcher n'importe quelle route. Par exemple, le fichier `src/pages/api/auth/[...nextauth].ts` correspond à l'URL `/api/auth/:nextauth` mais aussi à `/api/auth/nextauth/test`.

Le dossier server contient la configuration de `next-auth` et de la base de données. Le sous-dossier `api` contient les routes de l'API et le sous-dossier `routers` contient les remotes procedure de l'API faites avec `trpc`.
