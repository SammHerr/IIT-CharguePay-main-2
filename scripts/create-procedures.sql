-- Procedimientos almacenados
USE gestion_educativa;

DELIMITER //

-- Procedimiento para calcular moratorios
CREATE PROCEDURE CalcularMoratorios()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_mensualidad_id INT;
    DECLARE v_alumno_id INT;
    DECLARE v_fecha_vencimiento DATE;
    DECLARE v_monto DECIMAL(10,2);
    DECLARE v_dias_vencido INT;
    DECLARE v_moratorio DECIMAL(10,2);
    DECLARE v_porcentaje_moratorio DECIMAL(5,2);
    
    DECLARE cur CURSOR FOR 
        SELECT id, alumno_id, fecha_vencimiento, monto
        FROM mensualidades 
        WHERE estatus = 'vencido' 
        AND fecha_vencimiento < CURDATE();
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Obtener porcentaje de moratorio de configuración
    SELECT CAST(valor AS DECIMAL(5,2)) INTO v_porcentaje_moratorio
    FROM configuracion WHERE clave = 'moratorio_porcentaje';
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO v_mensualidad_id, v_alumno_id, v_fecha_vencimiento, v_monto;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        SET v_dias_vencido = DATEDIFF(CURDATE(), v_fecha_vencimiento);
        SET v_moratorio = ROUND(v_monto * (v_dias_vencido * v_porcentaje_moratorio / 100), 2);
        
        -- Crear notificación si no existe
        INSERT IGNORE INTO notificaciones (alumno_id, tipo, titulo, mensaje)
        VALUES (v_alumno_id, 'pago_vencido', 
                'Pago Vencido', 
                CONCAT('Su pago está vencido desde hace ', v_dias_vencido, ' días. Moratorio: $', v_moratorio));
        
    END LOOP;
    
    CLOSE cur;
END//

-- Procedimiento para generar reporte de cobranza
CREATE PROCEDURE GenerarReporteCobranza(IN p_periodo VARCHAR(7))
BEGIN
    SELECT 
        a.matricula,
        CONCAT(a.nombre, ' ', a.apellido_paterno) as nombre_alumno,
        p.nombre as plan,
        m.numero_mensualidad,
        m.fecha_vencimiento,
        m.monto,
        m.estatus,
        CASE 
            WHEN m.estatus = 'vencido' THEN DATEDIFF(CURDATE(), m.fecha_vencimiento)
            ELSE 0 
        END as dias_vencido,
        CASE 
            WHEN m.estatus = 'vencido' THEN ROUND(m.monto * (DATEDIFF(CURDATE(), m.fecha_vencimiento) * 0.01), 2)
            ELSE 0 
        END as moratorio,
        a.telefono,
        a.email
    FROM mensualidades m
    JOIN alumnos a ON m.alumno_id = a.id
    JOIN planes p ON a.plan_id = p.id
    WHERE DATE_FORMAT(m.fecha_vencimiento, '%Y-%m') = p_periodo
    ORDER BY m.estatus DESC, dias_vencido DESC;
END//

-- Procedimiento para procesar pago
CREATE PROCEDURE ProcesarPago(
    IN p_alumno_id INT,
    IN p_mensualidad_id INT,
    IN p_monto DECIMAL(10,2),
    IN p_moratorio DECIMAL(10,2),
    IN p_forma_pago VARCHAR(20),
    IN p_referencia VARCHAR(50),
    IN p_usuario_id INT,
    OUT p_numero_recibo VARCHAR(20)
)
BEGIN
    DECLARE v_total DECIMAL(10,2);
    DECLARE v_contador INT;
    
    SET v_total = p_monto + p_moratorio;
    
    -- Generar número de recibo
    SELECT COUNT(*) + 1 INTO v_contador FROM pagos WHERE DATE(fecha_creacion) = CURDATE();
    SET p_numero_recibo = CONCAT('REC-', DATE_FORMAT(CURDATE(), '%Y%m%d'), '-', LPAD(v_contador, 3, '0'));
    
    -- Insertar pago
    INSERT INTO pagos (
        numero_recibo, alumno_id, mensualidad_id, tipo_pago, concepto,
        monto, moratorio, total, forma_pago, referencia, fecha_pago, usuario_id
    ) VALUES (
        p_numero_recibo, p_alumno_id, p_mensualidad_id, 'mensualidad', 'Pago de mensualidad',
        p_monto, p_moratorio, v_total, p_forma_pago, p_referencia, NOW(), p_usuario_id
    );
    
END//

DELIMITER ;
