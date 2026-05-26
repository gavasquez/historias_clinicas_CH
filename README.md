# hc-corhuila
 
Aplicación web para apoyar la gestión de **historias clínicas** (registro, consulta y administración de información) de forma ordenada y práctica.
 
Este proyecto está construido con **Next.js** y utiliza **Prisma** como capa de acceso a datos.
 
## Instalación (local)
 
### Requisitos
 
- **Node.js** (recomendado: versión LTS)
- Un gestor de paquetes: `npm` (o `yarn` / `pnpm` / `bun`)
 
### Pasos
 
1. Instala dependencias:
 
```bash
npm install
```
 
2. Configura la base de datos (Prisma):
 
```bash
# Genera el cliente de Prisma
npx prisma generate

```
 
3. Inicia el proyecto en modo desarrollo:
 
```bash
npm run dev
```
 
4. Abre la app en el navegador:
 
- `http://localhost:3000`
 
## Scripts útiles
 
- **Desarrollo**
 
```bash
npm run dev
```
 
- **Construir para producción**
 
```bash
npm run build
```
 
- **Ejecutar en producción (después de build)**
 
```bash
npm run start
```
 
- **Lint**
 
```bash
npm run lint
```
 
## Notas
 
- Si tu entorno requiere variables de entorno (por ejemplo, conexión a base de datos o autenticación), crea tu archivo `.env` con los valores correspondientes antes de ejecutar la app.
- Si vas a usar base de datos, asegúrate de tener configurada la cadena `DATABASE_URL` (según tu proveedor) y de ejecutar el seed solo cuando tenga sentido para tu ambiente.
- Se recomienda usar PostgreSQL como base de datos, tambien se deja backup de la base de datos en la carpeta `backup`.

- Comando para cargar Diagnosticos CIE-10: npx prisma db execute --file prisma/sql/load_cie10.sql
