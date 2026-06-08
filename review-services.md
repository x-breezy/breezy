# Code Review — Backend Services (points restants)

> Périmètre : `auth-service`, `media-service`, `post-service`, `profile-service` Mis à jour :
> 2026-06-08

---

## 🟡 À traiter plus tard

### 10. `post-service` — `attachReplies` N+1 queries (`comment.service.ts:49-78`)

La récursion charge les enfants niveau par niveau avec une requête DB par niveau de profondeur
(jusqu'à `NEST_DEPTH = 3`). Avec beaucoup de commentaires, cela représente jusqu'à 3 requêtes
séquentielles supplémentaires par appel à `listComments`.

---

### 12. `auth-service` — `TODO` non résolu : création de profil lors du `createUser` (`user.controller.ts:28`)

```ts
// TODO: Create profile inside the profile-service
```

La création d'un utilisateur ne crée pas de profil associé. Gap fonctionnel — à implémenter quand le
workflow inter-service sera défini.
