-- Vistas para reportes
USE gestion_educativa;

-- Vista de alumnos con información completa
CREATE VIEW vista_alumnos_completa AS
SELECT 
    a.id,
    a.matricula,
    CONCAT(a.nombre, ' ', a.apellido_paterno, ' ', IFNULL(a.apellido_materno, '')) as nombre_completo,
    a.telefono,
    a.email,
    a.fecha_inscripcion,
    a.fecha_inicio,
    a.fecha_vigencia,
    a.estatus,
    p.nombre as plan_nombre,
    p.numero_mensualidades,
    p.precio_mensualidad,
    (SELECT COUNT(*) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus = 'pagado') as mensualidades_pagadas,
    (SELECT COUNT(*) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus = 'pendiente') as mensualidades_pendientes,
    (SELECT COUNT(*) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus = 'vencido') as mensualidades_vencidas,
    (SELECT SUM(pg.total) FROM pagos pg WHERE pg.alumno_id = a.id AND pg.estatus = 'activo') as total_pagado,
    (SELECT SUM(m.monto) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus IN ('pendiente', 'vencido')) as saldo_pendiente
FROM alumnos a
JOIN planes p ON a.plan_id = p.id;

-- Vista de cobranza mensual
CREATE VIEW vista_cobranza_mensual AS
SELECT 
    DATE_FORMAT(m.fecha_vencimiento, '%Y-%m') as periodo,
    COUNT(DISTINCT m.alumno_id) as total_alumnos,
    SUM(m.monto) as monto_esperado,
    SUM(CASE WHEN m.estatus = 'pagado' THEN m.monto ELSE 0 END) as monto_cobrado,
    COUNT(CASE WHEN m.estatus = 'pagado' THEN 1 END) as pagos_realizados,
    COUNT(CASE WHEN m.estatus = 'pendiente' THEN 1 END) as pagos_pendientes,
    COUNT(CASE WHEN m.estatus = 'vencido' THEN 1 END) as pagos_vencidos,
    ROUND((SUM(CASE WHEN m.estatus = 'pagado' THEN m.monto ELSE 0 END) / SUM(m.monto)) * 100, 2) as porcentaje_cobranza
FROM mensualidades m
GROUP BY DATE_FORMAT(m.fecha_vencimiento, '%Y-%m')
ORDER BY periodo DESC;

-- Vista de moratorios
CREATE VIEW vista_moratorios AS
SELECT 
    a.matricula,
    CONCAT(a.nombre, ' ', a.apellido_paterno) as nombre_alumno,
    m.numero_mensualidad,
    m.fecha_vencimiento,
    m.monto,
    DATEDIFF(CURDATE(), m.fecha_vencimiento) as dias_vencido,
    ROUND(m.monto * (DATEDIFF(CURDATE(), m.fecha_vencimiento) * 0.01), 2) as moratorio_calculado,
    a.telefono,
    a.email
FROM mensualidades m
JOIN alumnos a ON m.alumno_id = a.id
WHERE m.estatus = 'vencido'
AND DATEDIFF(CURDATE(), m.fecha_vencimiento) > 0
ORDER BY dias_vencido DESC;

-- Vista de ingresos por tipo
CREATE VIEW vista_ingresos_tipo AS
SELECT 
    DATE_FORMAT(p.fecha_pago, '%Y-%m') as periodo,
    p.tipo_pago,
    COUNT(*) as cantidad_pagos,
    SUM(p.monto) as total_monto,
    SUM(p.moratorio) as total_moratorios,
    SUM(p.total) as total_ingresos
FROM pagos p
WHERE p.estatus = 'activo'
GROUP BY DATE_FORMAT(p.fecha_pago, '%Y-%m'), p.tipo_pago
ORDER BY periodo DESC, p.tipo_pago;
