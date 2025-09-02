-- =====================================================
-- SCRIPT DE VERIFICACIÓN DE INSTALACIÓN
-- =====================================================

USE gestion_educativa;

-- Verificar que todas las tablas fueron creadas
SELECT 
    'VERIFICACIÓN DE TABLAS' as seccion,
    '' as detalle;

SELECT 
    TABLE_NAME as tabla,
    TABLE_ROWS as filas,
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as tamaño_mb,
    ENGINE as motor
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'gestion_educativa'
ORDER BY TABLE_NAME;

-- Verificar triggers
SELECT 
    'VERIFICACIÓN DE TRIGGERS' as seccion,
    '' as detalle;

SELECT 
    TRIGGER_NAME as trigger_name,
    EVENT_MANIPULATION as evento,
    EVENT_OBJECT_TABLE as tabla
FROM information_schema.TRIGGERS 
WHERE TRIGGER_SCHEMA = 'gestion_educativa';

-- Verificar eventos programados
SELECT 
    'VERIFICACIÓN DE EVENTOS' as seccion,
    '' as detalle;

SELECT 
    EVENT_NAME as evento,
    STATUS as estado,
    EVENT_TYPE as tipo,
    INTERVAL_VALUE as intervalo,
    INTERVAL_FIELD as unidad
FROM information_schema.EVENTS 
WHERE EVENT_SCHEMA = 'gestion_educativa';

-- Verificar vistas
SELECT 
    'VERIFICACIÓN DE VISTAS' as seccion,
    '' as detalle;

SELECT 
    TABLE_NAME as vista
FROM information_schema.VIEWS 
WHERE TABLE_SCHEMA = 'gestion_educativa';

-- Verificar datos iniciales
SELECT 
    'VERIFICACIÓN DE DATOS INICIALES' as seccion,
    '' as detalle;

SELECT 'Usuarios' as tabla, COUNT(*) as registros FROM usuarios
UNION ALL
SELECT 'Planes' as tabla, COUNT(*) as registros FROM planes
UNION ALL
SELECT 'Configuración' as tabla, COUNT(*) as registros FROM configuracion;

-- Verificar índices importantes
SELECT 
    'VERIFICACIÓN DE ÍNDICES' as seccion,
    '' as detalle;

SELECT 
    TABLE_NAME as tabla,
    INDEX_NAME as indice,
    COLUMN_NAME as columna,
    SEQ_IN_INDEX as posicion
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'gestion_educativa'
AND INDEX_NAME != 'PRIMARY'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- Verificar relaciones (foreign keys)
SELECT 
    'VERIFICACIÓN DE RELACIONES' as seccion,
    '' as detalle;

SELECT 
    TABLE_NAME as tabla_hijo,
    COLUMN_NAME as columna,
    REFERENCED_TABLE_NAME as tabla_padre,
    REFERENCED_COLUMN_NAME as columna_referenciada
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'gestion_educativa'
AND REFERENCED_TABLE_NAME IS NOT NULL;

SELECT 'INSTALACIÓN COMPLETADA EXITOSAMENTE' as resultado;
