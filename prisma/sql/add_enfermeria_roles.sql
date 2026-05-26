-- =====================================================
-- SCRIPT PARA CONFIGURAR ROL ENFERMERA Y ELIMINAR AUXILIAR_ENFERMERIA
-- =====================================================
-- Base de datos: PostgreSQL con Prisma
-- Autor: Asistente IA
-- Fecha: 2026-05-25
-- Impacto: Tablas roles, permisos, roles_permisos
-- =====================================================

-- Iniciar transacción para seguridad
BEGIN;

-- =====================================================
-- 1. Eliminar rol auxiliar_enfermeria si existe
-- =====================================================
DELETE FROM roles_permisos WHERE id_rol IN (SELECT id_rol FROM roles WHERE nombre = 'auxiliar_enfermeria');
DELETE FROM roles WHERE nombre = 'auxiliar_enfermeria';

-- =====================================================
-- 2. Obtener IDs de roles y permisos
-- =====================================================
DO $$
DECLARE
    enfermera_id INTEGER;
    perm_pacientes_ver INTEGER;
    perm_pacientes_crear INTEGER;
    perm_pacientes_editar INTEGER;
    perm_citas_ver INTEGER;
    perm_historias_ver INTEGER;
    perm_historias_registrar INTEGER;
BEGIN
    SELECT id_rol INTO enfermera_id FROM roles WHERE nombre = 'enfermera';
    
    IF enfermera_id IS NULL THEN
        RAISE NOTICE 'Rol enfermera no encontrado, creando...';
        INSERT INTO roles (nombre, descripcion) VALUES ('enfermera', 'Profesional de enfermería')
        RETURNING id_rol INTO enfermera_id;
    END IF;
    
    SELECT id_permiso INTO perm_pacientes_ver FROM permisos WHERE codigo = 'PACIENTES_VER';
    SELECT id_permiso INTO perm_pacientes_crear FROM permisos WHERE codigo = 'PACIENTES_CREAR';
    SELECT id_permiso INTO perm_pacientes_editar FROM permisos WHERE codigo = 'PACIENTES_EDITAR';
    SELECT id_permiso INTO perm_citas_ver FROM permisos WHERE codigo = 'CITAS_VER';
    SELECT id_permiso INTO perm_historias_ver FROM permisos WHERE codigo = 'HISTORIAS_VER';
    SELECT id_permiso INTO perm_historias_registrar FROM permisos WHERE codigo = 'HISTORIAS_REGISTRAR';
    
    -- =====================================================
    -- 3. Insertar permisos para rol enfermera
    -- =====================================================
    INSERT INTO roles_permisos (id_rol, id_permiso, concedido)
    VALUES (enfermera_id, perm_pacientes_ver, true)
    ON CONFLICT (id_rol, id_permiso) DO UPDATE SET concedido = true;
    
    INSERT INTO roles_permisos (id_rol, id_permiso, concedido)
    VALUES (enfermera_id, perm_pacientes_crear, true)
    ON CONFLICT (id_rol, id_permiso) DO UPDATE SET concedido = true;
    
    INSERT INTO roles_permisos (id_rol, id_permiso, concedido)
    VALUES (enfermera_id, perm_pacientes_editar, true)
    ON CONFLICT (id_rol, id_permiso) DO UPDATE SET concedido = true;
    
    INSERT INTO roles_permisos (id_rol, id_permiso, concedido)
    VALUES (enfermera_id, perm_citas_ver, true)
    ON CONFLICT (id_rol, id_permiso) DO UPDATE SET concedido = true;
    
    INSERT INTO roles_permisos (id_rol, id_permiso, concedido)
    VALUES (enfermera_id, perm_historias_ver, true)
    ON CONFLICT (id_rol, id_permiso) DO UPDATE SET concedido = true;
    
    INSERT INTO roles_permisos (id_rol, id_permiso, concedido)
    VALUES (enfermera_id, perm_historias_registrar, true)
    ON CONFLICT (id_rol, id_permiso) DO UPDATE SET concedido = true;
    
    RAISE NOTICE 'Permisos configurados correctamente para rol enfermera';
END $$;

-- Confirmar transacción
COMMIT;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Verificar que auxiliar_enfermeria no existe
SELECT id_rol, nombre, descripcion FROM roles WHERE nombre = 'auxiliar_enfermeria';

-- Verificar permisos de enfermera
SELECT r.nombre as rol, p.codigo as permiso, p.modulo, rp.concedido
FROM roles_permisos rp
JOIN roles r ON rp.id_rol = r.id_rol
JOIN permisos p ON rp.id_permiso = p.id_permiso
WHERE r.nombre = 'enfermera'
ORDER BY p.modulo, p.codigo;
