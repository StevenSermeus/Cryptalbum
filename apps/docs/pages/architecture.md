# Architecture

Dans le cadre de ce projet, plusieurs technologies sont utilisées pour répondre aux besoins de l'application.

- [Next.js](https://nextjs.org/): Framework React pour le rendu côté serveur.
- [Redis](https://redis.io/): Base de données en mémoire pour le rate limiting.
- [Postgres](https://www.postgresql.org/): Base de données relationnelle pour stocker les données.
- [Minio](https://min.io/): Stockage d'objets pour les fichiers.
- [Seq](https://datalust.co/seq): Stockage des logs.

```mermaid
---
title: Project Architecture
---
C4Context
  title System Context diagram
    ContainerDb(c4, "Database", "Postgres", "Stores all data")
    ContainerDb(c1, "Cache", "Redis", "Rate limiting")
    Container(c5, "Minio", "Stores files")
    Container(c6, "Logger", "Seq", "Stores logs")
    Container_Boundary(b, "Next.js") {
      Component(c3, "Frontend", "React typescript Shadcn/ui")
      Component(c2, "Backend", "TRPC, Prisma")
    }
    Rel(c3, c2, "TRPC calls", "HTTP")
    Rel(c2, c4, "Prisma calls", "TCP")
    Rel(c2, c1, "Redis calls", "TCP")
    Rel(c2, c5, "Minio calls", "TCP")
    Rel(c2, c6, "Store logs", "TCP")
    UpdateRelStyle(c1, c2, $textColor="red", $offsetY="-40")
    UpdateRelStyle(c2, c3, $textColor="red", $offsetX="-40", $offsetY="60")
    UpdateRelStyle(c3, c4, $textColor="red", $offsetY="-40", $offsetX="10")
```

Dans la phase de développement, nous utilisons Docker pour lancer les services nécessaires. Des créderntials par défaut sont utilisés pour les services. Ceux-ci ne doivent pas être utilisés en production.
