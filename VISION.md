# Breezy – Vision Produit & Roadmap Technique

> *Du projet de cours au produit SaaS entreprise.*

---

## 1. L'idée en une phrase

**Breezy Enterprise** = le réseau social interne d'une entreprise. Slack pour la communication structurée, Twitter/X pour la culture et le partage. Moins formel, plus humain, entièrement sous le contrôle de l'entreprise.

---

## 2. Est-ce une bonne idée ?

**Oui, et voici pourquoi.**

- **Le marché existe** : Workplace by Meta a été arrêté en 2026, laissant un vide énorme. Des milliers d'entreprises cherchent une alternative. Slack/Teams sont très bien pour les chats organisés, mais personne ne domine le "social feed" interne.
- **Le timing est bon** : les entreprises post-COVID ont des équipes distribuées et ont besoin de recréer du lien, de la culture, du sentiment d'appartenance — exactement ce que Breezy peut apporter.
- **L'angle "friendly"** est un vrai différenciateur. Slack = boîte mail améliorée. Breezy = endroit où les équipes vivent vraiment.
- **Vous avez déjà la base** : microservices, auth, messaging, media, feed, notifications — ce n'est pas rien. Vous partez avec 70% de l'infrastructure déjà en place.

### Risques à ne pas ignorer

- **Concurrence** : Workplace (Meta), Viva Engage (Microsoft), Yammer, Staffbase. Votre arme = self-hosted + prix agressif + UX supérieure.
- **Adoption** : le plus grand défi d'un réseau social interne c'est le "vide" au démarrage. Prévoir des mécaniques d'onboarding fortes.
- **RGPD / Compliance** : les données RH sont sensibles. Le self-hosted est un argument massif ici.

---

## 3. Le modèle commercial (Business Model)

### Deux modes de déploiement

| Mode | Description | Modèle de prix |
|---|---|---|
| **Cloud (SaaS)** | Hébergé sur vos serveurs, l'entreprise s'abonne | Abonnement mensuel par siège (ex: 3–8€/utilisateur/mois) |
| **Self-hosted** | L'entreprise déploie sur ses propres serveurs | Licence annuelle (ex: 2 000–10 000€/an selon taille) |

### Niveaux (tiers) suggérés

| Tier | Cible | Prix indicatif |
|---|---|---|
| **Starter** | Startups < 50 personnes | Gratuit (limité) ou ~2€/user/mois |
| **Business** | PME 50–500 personnes | ~5€/user/mois ou licence 4 000€/an |
| **Enterprise** | Grandes structures | Sur devis, SSO, support dédié, SLA |

---

## 4. Architecture : on reste en microservices ?

**Oui, absolument.** Et c'est même un argument de vente.

L'architecture microservices que vous avez déjà construite est exactement ce qu'il faut pour un produit multi-tenant SaaS. Elle permet :
- de **scaler indépendamment** chaque service selon la charge
- de déployer en **self-hosted partiel** (ex: certains services on-premise, d'autres cloud)
- d'isoler les données par tenant (entreprise) proprement

### Ce qui change / s'ajoute architecturalement

#### 4.1 Multi-tenancy (priorité absolue)

C'est le changement le plus structurant. Chaque "Breezy" d'entreprise est un **tenant** isolé.

**Stratégie recommandée : Database-per-tenant** (ou schema-per-tenant pour PostgreSQL)
- Isolation totale des données → argument commercial fort (RGPD, confidentialité)
- Plus simple à implémenter qu'un row-level tenant ID partout
- Permet de donner un dump de leurs données aux clients

Toutes les requêtes passent d'abord par une résolution de tenant (via sous-domaine ou header).

```
acme.breezy.app  → tenant: acme
renault.breezy.app → tenant: renault
```

Le gateway Nginx est l'endroit parfait pour extraire le tenant et l'injecter dans un header `X-Tenant-ID`.

#### 4.2 Nouveau service : `workspace-service`

Gère les organisations/tenants eux-mêmes :
- CRUD des workspaces (= entreprises)
- Invitations, domaines email autorisés (`@renault.fr` → auto-join Renault)
- Paramètres du workspace (nom, logo, features activées)
- Gestion des abonnements / licences

#### 4.3 Nouveau service : `group-service` (ou extension de `profile-service`)

Les groupes dans l'entreprise (équipes, départements, projets) :
- Groupes publics (ex: `#annonces`, `#général`) et privés (ex: `#rh-confidentiel`)
- Rôles dans le groupe : member, moderator, owner
- Feed filtré par groupe
- Notifications configurables par groupe

#### 4.4 Extension du `post-service` : scopes de visibilité

Un post peut être visible :
- `workspace` : tout le monde dans l'entreprise (feed global)
- `group:rh` : seulement les membres du groupe RH
- `public` : si l'entreprise active le mode public

#### 4.5 `billing-service` (pour le mode SaaS)

- Intégration Stripe pour les abonnements
- Gestion des quotas (stockage, nombre d'utilisateurs)
- Webhooks Stripe → provisioning/déprovisionning automatique

---

## 5. Fonctionnalités à développer (par priorité)

### 🔴 Priorité 1 – Le socle multi-tenant (bloque tout le reste)

- [ ] Résolution du tenant dans le gateway (sous-domaine → `X-Tenant-ID`)
- [ ] Isolation des données par tenant dans chaque service
- [ ] `workspace-service` : création, paramètres, invitations
- [ ] Onboarding flow : créer son Breezy en 5 minutes
- [ ] SSO d'entreprise (SAML / OIDC) — bloquant pour les grandes boîtes

### 🟠 Priorité 2 – Ce qui différencie Breezy de Slack

- [ ] Groupes / channels avec feed dédié
- [ ] Feed global de l'entreprise (homepage)
- [ ] Réactions étendues (pas juste ❤️, mais des réactions contextuelles)
- [ ] Profil enrichi : poste, département, compétences, "à propos de moi"
- [ ] Sondages / polls dans les posts
- [ ] Mise en avant des posts importants (pinned posts par admin)
- [ ] Annuaire des employés avec recherche

### 🟡 Priorité 3 – Expérience premium

- [ ] Application mobile (React Native — votre stack TS facilite ça)
- [ ] Intégrations (Google Workspace, Outlook, Slack import)
- [ ] Analytics pour admins (engagement, membres actifs, posts viraux)
- [ ] Breezy AI : résumé de feed, suggestions de personnes à suivre
- [ ] Custom branding (logo, couleurs de l'entreprise)
- [ ] Dark mode / thèmes

### 🟢 Priorité 4 – Monetisation & gestion

- [ ] Dashboard admin SaaS (billing, usage, seats)
- [ ] Self-hosted installer (Docker Compose one-click, Helm chart Kubernetes)
- [ ] Documentation déploiement enterprise
- [ ] SLA monitoring, status page

---

## 6. Stack technique : quoi garder, quoi changer ?

### ✅ Garder tel quel

| Technologie | Pourquoi garder |
|---|---|
| **Turborepo monorepo** | Parfait pour gérer la croissance des services |
| **Node.js / Express / TypeScript** | Écosystème cohérent, DX excellente |
| **Next.js (App Router)** | SSR, performance, SEO si besoin |
| **RabbitMQ** | Messaging async entre services, éprouvé |
| **Redis** | Sessions, cache, rate limiting |
| **Nginx gateway** | Léger, rapide, flexible |
| **Pino + Loki + Grafana** | Stack observabilité solide |
| **OpenTelemetry + Jaeger** | Tracing distribué — critique en micro-services |
| **GitHub Actions CI** | Garder et enrichir |

### ⚠️ Adapter / améliorer

| Technologie | Ce qui change |
|---|---|
| **PostgreSQL** | Ajouter le routing multi-tenant (schemas ou bases séparées) |
| **MongoDB** | Même chose pour les données document |
| **gRPC** | Parfait, étendre aux nouveaux services |
| **Nginx** | Ajouter la résolution de tenant, wildcard SSL (Let's Encrypt) |
| **Docker Compose** | Bien pour dev, passer à **Kubernetes** (K8s) pour la prod SaaS |

### 🆕 Ajouter

| Technologie | Pourquoi |
|---|---|
| **Kubernetes + Helm** | Scaling, déploiement self-hosted clé en main |
| **Stripe** | Billing SaaS |
| **SAML / OIDC (Passport.js ou Keycloak)** | SSO entreprise (Active Directory, Google Workspace) |
| **React Native (Expo)** | App mobile — indispensable pour l'adoption |
| **Terraform** | Infrastructure as Code pour le déploiement cloud |
| **S3 / MinIO** | Remplacement de GridFS pour le stockage media en prod (scalabilité) |
| **Vitest / Playwright** | Tests unitaires et e2e plus robustes |

---

## 7. Ce qu'il faut penser dès maintenant (avant de coder)

### Légal & Compliance

- **RGPD** : droit à l'oubli, export des données, DPO, mentions légales. Self-hosted = argument massif.
- **Conditions d'utilisation** et **politique de confidentialité** à rédiger.
- **Contrats B2B** : SLA, responsabilité, propriété des données.

### Sécurité

- **Audit de sécurité** avant toute vente (pen test basique au minimum).
- **Chiffrement at rest** des données sensibles (messages privés notamment).
- **Chiffrement in-transit** : TLS partout (déjà en place via Nginx, à maintenir).
- **Rate limiting** par tenant pour éviter qu'un client plante les autres.
- **Backup automatique** par tenant.

### Business & Go-to-market

- Construire une **landing page** Breezy Enterprise.
- Définir votre **ICP** (Ideal Customer Profile) : PME tech ? Entreprises industrielles ? 
- **Stratégie freemium** : le gratuit doit être viral (les utilisateurs invitent des collègues).
- **Programme early adopters** : quelques entreprises pilotes gratuitement contre du feedback.

### Organisation du projet

- Créer une **roadmap publique** (Notion, Linear, GitHub Projects) — transparence = confiance.
- **Versioning sémantique** et changelog.
- Séparer `dev` / `staging` / `prod` proprement dans le CI/CD.
- Mettre en place des **feature flags** pour déployer progressivement.

---

## 8. Les grandes étapes (Milestones)

```
M1 – Multi-tenant MVP (2–3 mois)
  → workspace-service, tenant isolation, onboarding, sous-domaines
  → Objectif : une vraie entreprise pilote peut créer son Breezy

M2 – Groupes & Feed (1–2 mois)
  → group-service, scopes de visibilité, feed filtré
  → Objectif : l'expérience sociale est complète

M3 – Self-hosted release (1–2 mois)
  → Docker Compose one-click, documentation, Helm chart basique
  → Objectif : une entreprise peut déployer seule en 30 minutes

M4 – SaaS Billing (1 mois)
  → Stripe, quotas, dashboard admin
  → Objectif : première transaction réelle

M5 – Mobile (2–3 mois)
  → React Native app iOS + Android
  → Objectif : adoption quotidienne décuplée

M6 – Enterprise Grade (ongoing)
  → SSO SAML/OIDC, analytics, AI features, custom branding
```

---

## 9. Ce que vous avez déjà (et c'est énorme)

En partant du projet de cours, vous avez gratuitement :

- ✅ Auth complète (JWT, refresh tokens, 2FA, Google OAuth)
- ✅ Profils utilisateurs + follow graph
- ✅ Posts, commentaires, likes, feed personnalisé
- ✅ Messaging temps réel (Socket.io) avec historique
- ✅ Notifications temps réel (SSE + Web Push)
- ✅ Upload media + streaming vidéo
- ✅ Gateway Nginx avec RBAC
- ✅ Observabilité complète (logs, métriques, tracing)
- ✅ CI/CD GitHub Actions
- ✅ OpenAPI documenté

**C'est une base de 6 à 12 mois de travail dans une startup normale.** Le gap jusqu'au produit commercial est principalement : multi-tenancy, groupes, billing, et mobile. Pas un restart from scratch — une évolution.

---

## 10. Résumé exécutif

| Question | Réponse |
|---|---|
| Bonne idée ? | **Oui**, marché réel, timing post-Workplace, angle différenciant |
| Garder les microservices ? | **Oui**, c'est exactement la bonne archi pour ce cas d'usage |
| Garder la stack ? | **Majoritairement oui**, quelques ajouts (K8s, Stripe, RN, MinIO) |
| Prochain step critique | **Multi-tenancy** — tout le reste en dépend |
| Risque principal | Adoption initiale et compliance RGPD |
| Avantage compétitif | Self-hosted + UX friendly + prix accessible |

> **Le projet de cours est devenu un produit. Il manque une direction business claire, le multi-tenant, et un peu de polish UX. Le reste est là.**
