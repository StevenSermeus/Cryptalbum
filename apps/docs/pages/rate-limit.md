# Rate limiting

Dans le but de protéger notre application contre les attaques de type DDoS, nous avons mis en place un système de rate limiting. Ce système permet de limiter le nombre de requêtes par IP et par minute. Si un utilisateur dépasse ce quota, il recevra une erreur 429.

Pour ce faire nous utilisons Redis, une base de données clé-valeur en mémoire. Nous avons choisi Redis pour sa rapidité et sa simplicité d'utilisation.

A chaque requête, nous incrémentons le compteur de l'IP de l'utilisateur concaténé avec l'URL de la requête. Si le compteur dépasse le quota, nous renvoyons une erreur 429. Sinon, nous laissons passer la requête. Le compteur est remis à zéro toutes les x secondes. L'application du rate limiting est faite dans le middleware `rateLimitedMiddleware`.

```typescript
export const rateLimitedMiddleware = t.middleware(
  async ({ path, ctx, next }) => {
    const res = await ctx.cache.incr(`${path}:${ctx.ip}`);
    if (res === 1) {
      await ctx.cache.expire(`${path}:${ctx.ip}`, env.RATE_LIMIT_WINDOW);
    }
    if (res > env.RATE_LIMIT_MAX) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
    }
    return next({ ctx });
  },
);
```

N'importe quel procédure peut être rate limited en ajoutant le middleware `rateLimitedMiddleware` à la liste des middlewares de la procédure.
