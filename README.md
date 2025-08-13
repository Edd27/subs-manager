## Subs Manager

Stack: Next.js 15 (App Router), Prisma + PostgreSQL, NextAuth (credenciales), Redis + BullMQ, Resend, TailwindCSS.

### Requisitos
- Docker y Docker Compose

### Configuración
1) Variables de entorno
- Copia `.env.example` a `.env` y ajusta valores (NEXTAUTH_URL, NEXTAUTH_SECRET, DATABASE_URL, REDIS_URL).

2) Dependencias (si desarrollas en tu host)

```bash
npm install
```

3) Infraestructura local con Docker (Postgres + Redis)

```bash
npm run dev:infra:up
```

4) Base de datos (Prisma)

```bash
npm run db:migrate
npm run db:seed
```

5) Desarrollo en tu host (recomendado)

```bash
npm run dev
```

6) Desarrollo dentro de Docker con hot reloading (opcional)

```bash
npm run dev:docker
```

7) Desarrollo “prod-like” (contenedor ejecutando next start)

```bash
npm run dev:prodlike
```

8) Worker BullMQ (opcional)

```bash
npm run worker
```

### Infra local (Docker)

```bash
npm run dev:infra:down
```

### Docker (app + worker) en producción
- El Dockerfile está en `docker/Dockerfile` (imagen de producción: build + next start).
- Levantar app y worker en modo producción con Docker Compose (infra separada o previa):

```bash
docker compose -f docker/compose.prod.yml up --build app worker
```

Notas
- El build de producción usa un flag para no conectar a Redis durante el prerender (`REDIS_DISABLE_DURING_BUILD=1`) ya integrado en `npm run build`.
- En desarrollo, puedes:
	- Ejecutar Next en tu host con `npm run dev` y usar DB/Redis en Docker (más rápido).
	- O ejecutar todo en Docker con `npm run dev:docker` (hot reload montando el código en el contenedor).
- Para detener el stack de desarrollo en Docker con hot reload: usa `Ctrl+C` en la terminal de `dev:docker` o `docker compose -f docker/compose.infra.yml -f docker/compose.dev.yml down`.

### Seed de datos
- El seed crea:
	- Admin: admin@example.com / admin123
	- Usuario demo: user@example.com / user123
	- Servicios: Netflix y Spotify

Ejecución en tu host (usando la DB del compose):

```bash
npm run dev:infra:up
npm run db:migrate
npm run db:seed
```

Ejecución en contenedor app-dev (si usas `npm run dev:docker`):

```bash
# con el stack dev levantado
docker compose -f docker/compose.infra.yml -f docker/compose.dev.yml exec app-dev npm run db:seed
```

### Prisma
- Esquema en prisma/schema.prisma
- Prisma Studio:

```bash
npm run db:studio
```

### Rutas API MVP
- POST /api/users (ADMIN): crea usuario y devuelve contraseña temporal
- POST /api/auth/change-password: cambia contraseña del usuario logueado
- CRUD básico: /api/services, /api/subscriptions, /api/profiles, /api/payments
- POST /api/statements: genera estados de cuenta del mes actual

### Notas
- Autenticación por credenciales. Añade NEXTAUTH_SECRET y NEXTAUTH_URL en .env.
- Redis requerido para colas y rate limit básico.
