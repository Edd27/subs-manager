---
applyTo: "**"
---

Contexto rápido

- Stack: Next.js 15 (App Router) + React 19 + TypeScript estricto + Tailwind CSS v4 (PostCSS) + ESLint Flat Config.
- Entradas clave: `src/app/page.tsx` (ruta `/`) y `src/app/layout.tsx` (layout global, fuentes y metadatos). Estilos en `src/app/globals.css`. Activos en `public/`.

Arquitectura y patrones del proyecto

- App Router: cada ruta vive en `src/app/<segmento>/page.tsx`. El layout raíz está en `src/app/layout.tsx` y aplica variables de fuentes (Geist) vía `next/font`.
- Por defecto, componentes son Server Components. Si necesitas interactividad (estado/efectos/eventos), marca el archivo con `"use client"`. Pero nunca los archivos de layout o páginas deben ser clientes, ya que eso rompe el flujo de renderizado y SEO.
- Estilos: Tailwind v4 sin `tailwind.config.js`. Se usa `@import "tailwindcss"` y `@theme inline` en `globals.css` para tokens (p.ej. `--color-background`). Usa utilitarias en JSX.
- Imágenes: usa `next/image` con activos en `public/` (ver `src/app/page.tsx` con `/next.svg`, `/vercel.svg`).
- Fuentes: `next/font/google` (Geist, Geist_Mono) en `layout.tsx`, expone `--font-geist-sans` y `--font-geist-mono`; se consumen en `globals.css` y como clases en `<body>`.
- Alias TS: `@/*` -> `./src/*` (ver `tsconfig.json`). Prefiere imports con `@/` para rutas internas.

Flujos de desarrollo (scripts y tooling)

- Scripts: `dev` (desarrollo en :3000), `build` (compila), `start` (sirve producción), `lint` (ESLint con `next/core-web-vitals`).
- PostCSS: `postcss.config.mjs` ya incluye `@tailwindcss/postcss`. No agregues config Tailwind adicional; usa `@theme inline` y variables CSS.
- `next.config.ts` está vacío por diseño; agrega opciones solo si las necesitas (imágenes remotas, headers, redirects, experimental, etc.).

Convenciones concretas del repo

- Mantén `export const metadata` en layouts/páginas para SEO y títulos (ver `layout.tsx`).
- Nuevas rutas: crea `src/app/<segmento>/page.tsx`. UI compartida por subrutas: `src/app/<segmento>/layout.tsx`.
- Componentes cliente: añade `"use client"` y evita importar dependencias del cliente desde Server Components.
- Imágenes: `next/image` y rutas `/public/*`. Evita `<img>` salvo excepciones justificadas.
- Tipado: TS estricto; evita `any`. Usa tipos de Next/React (`Metadata`, `React.ReactNode`).

Arquitectura limpia y SOLID (reglas estrictas)

- Capas y límites
  - domain: entidades, value objects, reglas de negocio y puertos (interfaces). Sin dependencias de React/Next ni librerías externas.
  - application: casos de uso y orquestación. Solo depende de domain. Sin efectos de IO directos.
  - infrastructure: adaptadores/implementaciones de puertos (HTTP/DB/FS/APIs) y mapeos. Puede depender de librerías externas y de application/domain.
  - ui (Next App Router): páginas en `src/app/**` y componentes. Consume application/domain. No contiene lógica de negocio; inyecta dependencias por props/factories.
- Direcciones de dependencia (solo hacia adentro)
  - domain ← application ← infrastructure
  - domain ← application ← ui
  - Prohibido: domain → infrastructure/ui, ui → infrastructure directo.
- Puertos y adaptadores
  - Declara interfaces en domain. Implementa en infrastructure. Inyecta implementaciones en UI o en handlers (`app/**/route.ts`) mediante constructor/factory.
- Principios SOLID
  - SRP: cada módulo con una sola razón de cambio.
  - OCP: extiende con nuevas implementaciones/estrategias; evita modificar entidades/contratos estables.
  - LSP: respeta contratos e invariantes definidos en interfaces/abstracciones.
  - ISP: interfaces pequeñas y específicas por caso de uso.
  - DIP: UI y casos de uso dependen de abstracciones (interfaces), no de implementaciones concretas.

Seguridad y mejores prácticas

- Valida y sanea entradas en los bordes (UI e infrastructure). Evita `dangerouslySetInnerHTML`. Usa tipos estrictos y narrowing en TS.
- Enlaces externos con `rel="noopener noreferrer"` y `target="_blank"` (ver `src/app/page.tsx`).
- Nunca expongas secretos al cliente. Lee `process.env` solo en Server Components o route handlers. Evita `NEXT_PUBLIC_*` para secretos.
- Errores: propaga resultados tipados desde casos de uso; no silenciosos. Registra en el servidor cuando aplique.
- Performance: prioriza RSC para data fetching e imágenes con `next/image`.

Ejemplos del repo a replicar

- Página raíz: `src/app/page.tsx` — Tailwind utilitario, `next/image`, assets de `public/` y copy ligero.
- Layout global: `src/app/layout.tsx` — fuentes Geist con `next/font` y clases CSS variables: `` className={`${geistSans.variable} ${geistMono.variable} antialiased`} ``.
- Estilos base: `src/app/globals.css` — tokens en `@theme inline`, soporte de oscuro con `prefers-color-scheme`.

Límites y notas

- No hay tests configurados; no introduzcas frameworks de pruebas sin indicación explícita.
- No crear carpeta `pages/`; el router activo es App Router bajo `src/app/`.
- Regla estricta: no se permiten comentarios en el código; el código debe ser autoexplicativo con nombres claros, funciones pequeñas y separación de responsabilidades.

¿Algo por aclarar?

- Si necesitas políticas de fetching (SSR/SSG/ISR), dominios de imágenes remotas, o estructura de componentes compartidos, indícalo y lo definimos aquí para mantener coherencia.
