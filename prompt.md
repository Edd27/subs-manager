# PROMPT: Sistema de Gestión de Suscripciones Compartidas

## CONTEXTO Y ROL
Actúa como un **Senior Software Engineer** con más de 10 años de experiencia en desarrollo full-stack y arquitectura de sistemas. Debes crear una aplicación web completa siguiendo las mejores prácticas de desarrollo.

## DESCRIPCIÓN DEL PROYECTO

### Problema a Resolver
Necesito una aplicación web para gestionar suscripciones de streaming compartidas entre amigos y familiares, con:
- División automática de costos según perfiles asignados
- Seguimiento de pagos adelantados
- Estados de cuenta automatizados
- Sistema de notificaciones
- RBCA (Control de acceso basado en roles)

### Usuarios del Sistema
- **Administrador**: Gestiona usuarios, suscripciones y registra pagos
- **Usuarios**: Consultan sus suscripciones, pagos y balances

## REQUERIMIENTOS FUNCIONALES

### Core Features
1. **Gestión de Usuarios**
   - Solo el admin puede crear usuarios
   - Envío automático de contraseña temporal por email
   - Cambio obligatorio de contraseña en primer acceso
   - Recuperación de contraseñas

2. **Gestión de Suscripciones**
   - Registro de servicios (Max, Disney+, Spotify, etc.)
   - Configuración de costo mensual y máximo de perfiles
   - Asignación de usuarios a suscripciones
   - División automática de costos entre perfiles activos

3. **Sistema de Pagos**
   - Registro de pagos (incluyendo pagos adelantados)
   - Cálculo automático de balances por usuario
   - Generación de recibos de pago

4. **Estados de Cuenta**
   - Generación mensual automatizada
   - Detalle por suscripción y mensualidades
   - Saldos a favor o adeudos

5. **Notificaciones Automatizadas**
   - Email mensual con estado de cuenta
   - SMS mensual con estado de cuenta
   - Email/SMS de confirmación al registrar pagos

### Dashboard y Reportes
- Vista de suscripciones activas por usuario
- Historial de pagos
- Balance actual detallado
- Próximos vencimientos

## STACK TECNOLÓGICO OBLIGATORIO

### Frontend
- **Next.js 14+** (App Router)
- **Tailwind CSS** (styling)
- **Shadcn/ui** (componentes UI)
- **TypeScript**

### Backend
- **Next.js API Routes** (API handlers)
- **Prisma** (ORM)
- **PostgreSQL** (base de datos)
- **NextAuth.js** (autenticación)

### Servicios Externos
- **Resend** (envío de emails)
- **Redis + BullMQ** (colas y jobs automatizados)

### DevOps
- **Docker + Docker Compose**
- **Deployment**: Dokploy + Traefik
- Configuración para desarrollo y producción

## REQUERIMIENTOS TÉCNICOS

### Arquitectura
- Implementar **Clean Architecture**
- Aplicar principios **SOLID**
- Separación clara de capas (presentation, business, data)

### Seguridad
- Validación exhaustiva de inputs
- Rate limiting en APIs críticas
- Encriptación de contraseñas
- HTTPS en producción
- Sanitización de datos

### Performance
- Server-side rendering donde corresponda
- Optimización de queries a BD
- Caching estratégico con Redis
- Lazy loading en frontend

### Calidad de Código
- TypeScript estricto
- ESLint + Prettier configurados
- Testing unitario e integración
- Manejo consistente de errores

## REQUERIMIENTOS DE UX/UI

### Diseño
- Interfaz moderna y minimalista
- Totalmente responsive (mobile-first)
- Accesibilidad (WCAG 2.1 AA)
- Dark/Light mode opcional

### Usabilidad
- Navegación intuitiva
- Feedback visual claro (loading, success, errors)
- Confirmaciones para acciones destructivas
- Breadcrumbs y navegación clara

## ENTREGABLES ESPERADOS

### Estructura del Proyecto
```
/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # Componentes UI
│   ├── lib/                 # Utilidades y configuraciones
│   ├── types/               # Tipos TypeScript
│   └── ...
├── prisma/                  # Schema y migraciones
├── docker/                  # Configuración Docker
└── docs/                    # Documentación
```

### Documentación
- README.md completo con setup
- Esquema de base de datos
- API documentation
- Guía de deployment

## INSTRUCCIONES DE DESARROLLO

### Metodología
1. **Planificación**: Diseño de BD y arquitectura
2. **MVP**: Funciones core sin automatizaciones
3. **Iteraciones**: Agregar features incrementalmente
4. **Testing**: Pruebas en cada iteración

### Estándares de Código
- **Sin comentarios en el código generado**
- Nombres descriptivos para variables y funciones
- Componentes reutilizables
- Manejo de errores exhaustivo
- Logging apropiado para debugging

### Configuración de Desarrollo
- Hot reload completo
- Docker Compose para servicios locales
- Variables de entorno documentadas
- Scripts npm para tareas comunes

## CRITERIOS DE ACEPTACIÓN

### Funcionalidad
- ✅ Todos los requerimientos funcionales implementados
- ✅ Flujos de usuario completos sin errores
- ✅ Notificaciones automatizadas funcionando
- ✅ Cálculos financieros precisos

### Calidad
- ✅ Zero errores TypeScript
- ✅ Cobertura de testing > 80%
- ✅ Performance: Core Web Vitals en verde
- ✅ Seguridad: Sin vulnerabilidades críticas

### Deployment
- ✅ Docker build exitoso
- ✅ Deployment automatizado funcional
- ✅ Backups de BD configurados
- ✅ Monitoreo básico implementado

---

**NOTA IMPORTANTE**: Genera código production-ready siguiendo todas las especificaciones técnicas mencionadas. Prioriza la robustez, seguridad y mantenibilidad del sistema.

---

Progreso: Se añadió un MVP con autenticación por credenciales (NextAuth), esquema Prisma, rutas API básicas (usuarios, servicios, suscripciones, perfiles, pagos, estados), utilidades Redis/BullMQ/Resend, worker y Docker Compose. Ver README.md para instrucciones.