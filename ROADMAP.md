# Roadmap Proyecto HC CORHUILA

Leyenda de estado:

- ✅ Completado
- 🟡 En progreso
- ⬜ Pendiente

---

## Fase 0: Requerimientos, BD y Setup Inicial

- ✅ Definición de requerimientos funcionales y backlog
- ✅ Diseño del modelo de datos (tablas, relaciones, catálogos)
- ✅ Creación de la base de datos PostgreSQL `historias_clinicas`
- ✅ Script SQL de creación de tablas y catálogos
- ✅ Población de catálogos iniciales (tipos doc, géneros, EPS, etc.)
- ✅ Inicialización del proyecto Next.js + TypeScript + Tailwind
- ✅ Configuración de Prisma + conexión a PostgreSQL
- ✅ Configuración básica de NextAuth con CredentialsProvider
- ✅ Pantalla de login funcional
- ✅ Repositorio Git y primer commit en GitHub

---

## Fase 1: Layout principal y navegación

- ✅ Crear `/dashboard` como layout principal tras el login
- ✅ Proteger rutas (acceso solo autenticado)
- ✅ Header con datos del usuario y botón de logout
- ✅ Sidebar con navegación a módulos:
  - Pacientes
  - Citas
  - Historias clínicas
  - Reportes (placeholder)
  - Configuración (placeholder)

---

## Fase 2: Gestión de Pacientes

- ✅ Página `/patients` con listado paginado de pacientes
- ✅ Filtros por documento, nombre, tipo de usuario, programa
- ✅ Formulario de creación de paciente con validaciones (zod)
- ✅ Uso de catálogos (tipos doc, géneros, EPS, programas académicos)
- ✅ Edición de paciente desde el detalle
- ✅ Gestión de acompañantes desde el detalle del paciente

---

## Fase 3: Agenda y Citas

- ✅ Página simple de profesionales (`/professionals`)
- ✅ Configuración básica de disponibilidad de profesionales
- ✅ Página de agenda / listado de citas por profesional y fecha
- ✅ Formulario para crear / editar citas (selección de paciente, profesional, tipo, fecha/hora)
- ✅ Historial de citas por paciente

---

## Fase 4: Historias Clínicas y Atenciones

- ✅ Vista de historias clínicas por paciente (`/patients/[id]/records`)
- ✅ Creación de historia clínica (consulta externa, ingreso)
- ⬜ Formulario de historia clínica (secciones principales FO-BI-SA-07 / 08)
- ✅ Registro de atenciones / evoluciones (`atenciones_salud`) asociadas a historias
- ⬜ Timeline de atenciones por historia

---

## Fase 5: Diagnósticos CIE-10 e Indicaciones

- ✅ Búsqueda de CIE-10 (por código y descripción) integrada a las atenciones
- ✅ Registro de diagnósticos principal/secundarios, presuntivo/definitivo
- ⬜ Generación de fórmulas médicas (medicamentos, dosis, frecuencia)

---

## Fase 6: Administración de Usuarios del Sistema

- ✅ API `/api/users` para gestión básica de usuarios (GET listado, POST creación, PUT actualización)
- ✅ Página `/users` con listado de usuarios del sistema
- ✅ Formulario `/users/new` para crear usuarios (nombre, email, rol, estado)
- ✅ Acción desde `/users` para "Marcar como profesional" que cree o asocie el registro en `profesionales_salud`
- ⬜ Registro de exámenes complementarios (laboratorio, imagen, otros)

---

## Fase 6: Consentimientos, Programas y Desistimientos

- ⬜ CRUD de plantillas de consentimiento (`plantillas_consentimiento`)
- ⬜ Registro de consentimientos por paciente/atención (firma digital/simplificada)
- ⬜ Gestión de programas de salud por paciente
- ⬜ Registro de desistimientos de programas y reactivaciones
- ⬜ Activación de rutas de atención desde la historia / atención

---

## Fase 7: Reportes y Estadísticas Básicas

- ⬜ Reportes de atenciones por rango de fechas, profesional, tipo de cita
- ⬜ Listado de citas pendientes / cumplidas
- ⬜ Exportación básica (CSV/Excel) si el tiempo lo permite

---

Este archivo se irá actualizando a medida que avancemos, cambiando los iconos de estado y, si es necesario, agregando nuevas tareas o fases.
