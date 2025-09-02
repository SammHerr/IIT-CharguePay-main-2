-- Triggers para automatización
USE gestion_educativa;

-- Trigger para generar mensualidades automáticamente al inscribir alumno
DELIMITER //
CREATE TRIGGER after_alumno_insert 
AFTER INSERT ON alumnos
FOR EACH ROW
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE plan_mensualidades INT;
    DECLARE plan_precio DECIMAL(10,2);
    DECLARE fecha_venc DATE;
    
    -- Obtener datos del plan
    SELECT numero_mensualidades, precio_mensualidad 
    INTO plan_mensualidades, plan_precio
    FROM planes WHERE id = NEW.plan_id;
    
    -- Generar mensualidades
    WHILE i <= plan_mensualidades DO
        SET fecha_venc = DATE_ADD(NEW.fecha_inicio, INTERVAL i MONTH);
        
        INSERT INTO mensualidades (alumno_id, numero_mensualidad, fecha_vencimiento, monto)
        VALUES (NEW.id, i, fecha_venc, plan_precio);
        
        SET i = i + 1;
    END WHILE;
END//

-- Trigger para actualizar estatus de mensualidades vencidas
CREATE EVENT actualizar_mensualidades_vencidas
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 1 DAY
DO
UPDATE mensualidades 
SET estatus = 'vencido' 
WHERE fecha_vencimiento < CURDATE() 
AND estatus = 'pendiente'//

-- Trigger para auditoría en pagos
CREATE TRIGGER audit_pagos_insert
AFTER INSERT ON pagos
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla, registro_id, accion, datos_nuevos, usuario_id)
    VALUES ('pagos', NEW.id, 'INSERT', JSON_OBJECT(
        'numero_recibo', NEW.numero_recibo,
        'alumno_id', NEW.alumno_id,
        'monto', NEW.monto,
        'total', NEW.total
    ), NEW.usuario_id);
END//

-- Trigger para marcar mensualidad como pagada
CREATE TRIGGER after_pago_mensualidad
AFTER INSERT ON pagos
FOR EACH ROW
BEGIN
    IF NEW.mensualidad_id IS NOT NULL THEN
        UPDATE mensualidades 
        SET estatus = 'pagado' 
        WHERE id = NEW.mensualidad_id;
    END IF;
END//

DELIMITER ;
