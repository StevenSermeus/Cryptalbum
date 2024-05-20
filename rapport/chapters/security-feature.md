# Rate limiting

Comme cité plus haut dans le rapport, nous avons utilisé un système de rate limiting pour éviter les attaques de type brute force et DOS(Denial of Service). Son implémentation est assez simple, aucun package n'a été utilisé car aucun ne correspondait à nos besoins. Nous avons donc implémenté notre propre système de rate limiting. Celui-ci est un middleware qui est appelé avant les requêtes. Il incrémente un compteur stocké dans la base de données Valkey pour chaque adresse IP et chaque endpoint. Si le compteur dépasse une certaine valeur, une erreur est renvoyée. Voici le code de ce middleware :

```ts
export const rateLimitedMiddleware = t.middleware(
  async ({ path, ctx, next }) => {
    const res = await ctx.cache.incr(`${path}:${ctx.ip}`);
    if (res === 1) {
      await ctx.cache.expire(`${path}:${ctx.ip}`, env.RATE_LIMIT_WINDOW);
    }
    if (res > env.RATE_LIMIT_MAX) {
      logger.error(`Rate limit exceeded for ${ctx.ip} on ${path}`);
      throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
    }
    return next();
  },
);
```

# Protection contre les injections SQL

Pour nous protéger contre les injections SQL, nous avons utilisé un ORM (Object-Relational Mapping) nommé Prisma. Prisma est un ORM qui permet de manipuler la base de données sans écrire de requêtes SQL. Celui-ci est sécurisé par défaut et empêche les injections SQL.

# Protection contre les attaques XSS

Pour nous protéger contre les attaques XSS, nous utilisons la librairie react-dom qui permet de manipuler le DOM de manière sécurisée. React DOM échappe automatiquement les caractères spéciaux et empêche les attaques XSS.

# Analyse de code Snyk

Pour analyser notre code et détecter les vulnérabilités, nous avons utilisé Snyk. Snyk est un outil qui permet de détecter les vulnérabilités dans les dépendances de notre projet. Il scanne les dépendances et les compare à une base de données de vulnérabilités. Si une vulnérabilité est détectée, Snyk nous avertit et nous propose des solutions pour la corriger. De plus, Snyk peut également être utilisé pour détecter les vulnérabilités dans le code source.

# Signature des commits git

Pour éviter une attaque de type "supply chain attack" ou d'usurpation d'identité, nous avons mis en place une signature des commits git. Cela permet de vérifier l'identité de l'auteur via sa clé GPG. Ainsi, si un attaquant modifie le code source et ne signe pas le commit, il sera facilement détecté.
