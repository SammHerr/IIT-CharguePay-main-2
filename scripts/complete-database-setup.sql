-- =====================================================
-- SCRIPT COMPLETO PARA CREAR BASE DE DATOS
-- Sistema de Gestión Educativa - Inglés Individual
-- =====================================================

-- Eliminar base de datos si existe (opcional - comentar en producción)
-- DROP DATABASE IF EXISTS gestion_educativa;

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS gestion_educativa 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE gestion_educativa;

-- =====================================================
-- CREACIÓN DE TABLAS
-- =====================================================

-- 1. Tabla de usuarios del sistema
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'coordinador', 'cajero') DEFAULT 'cajero',
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_usuarios_email (email),
    INDEX idx_usuarios_rol (rol),
    INDEX idx_usuarios_activo (activo)
) ENGINE=InnoDB;

-- 2. Tabla de planes educativos
CREATE TABLE planes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    numero_mensualidades INT NOT NULL,
    precio_mensualidad DECIMAL(10,2) NOT NULL,
    precio_inscripcion DECIMAL(10,2) NOT NULL,
    vigencia_meses INT DEFAULT 12,
    extension_meses INT DEFAULT 4,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_planes_activo (activo),
    INDEX idx_planes_nombre (nombre)
) ENGINE=InnoDB;

-- 3. Tabla de alumnos
CREATE TABLE alumnos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(50) NOT NULL,
    apellido_materno VARCHAR(50),
    fecha_nacimiento DATE,
    genero ENUM('M', 'F', 'Otro'),
    telefono VARCHAR(15),
    email VARCHAR(100),
    direccion TEXT,
    ciudad VARCHAR(50),
    estado VARCHAR(50),
    codigo_postal VARCHAR(10),
    contacto_emergencia VARCHAR(100),
    telefono_emergencia VARCHAR(15),
    relacion_emergencia VARCHAR(50),
    fecha_inscripcion DATE NOT NULL,
    fecha_inicio DATE NOT NULL,
    plan_id INT NOT NULL,
    fecha_vigencia DATE NOT NULL,
    fecha_extension DATE NULL,
    estatus ENUM('activo', 'graduado', 'baja', 'suspendido') DEFAULT 'activo',
    motivo_baja TEXT,
    notas TEXT,
    foto_url VARCHAR(500),
    documentos_url JSON,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (plan_id) REFERENCES planes(id) ON DELETE RESTRICT,
    
    INDEX idx_alumnos_matricula (matricula),
    INDEX idx_alumnos_estatus (estatus),
    INDEX idx_alumnos_fecha_inscripcion (fecha_inscripcion),
    INDEX idx_alumnos_fecha_vigencia (fecha_vigencia),
    INDEX idx_alumnos_plan (plan_id),
    INDEX idx_alumnos_nombre (nombre, apellido_paterno),
    INDEX idx_alumnos_telefono (telefono),
    INDEX idx_alumnos_email (email)
) ENGINE=InnoDB;

-- 4. Tabla de mensualidades programadas
CREATE TABLE mensualidades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alumno_id INT NOT NULL,
    numero_mensualidad INT NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    estatus ENUM('pendiente', 'pagado', 'vencido', 'cancelado') DEFAULT 'pendiente',
    fecha_pago DATETIME NULL,
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_alumno_mensualidad (alumno_id, numero_mensualidad),
    INDEX idx_mensualidades_fecha_vencimiento (fecha_vencimiento),
    INDEX idx_mensualidades_estatus (estatus),
    INDEX idx_mensualidades_alumno_estatus (alumno_id, estatus),
    INDEX idx_mensualidades_vencidas (fecha_vencimiento, estatus)
) ENGINE=InnoDB;

-- 5. Tabla de pagos
CREATE TABLE pagos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_recibo VARCHAR(20) UNIQUE NOT NULL,
    alumno_id INT NOT NULL,
    mensualidad_id INT NULL,
    tipo_pago ENUM('mensualidad', 'inscripcion', 'moratorio', 'extension', 'otro') NOT NULL,
    concepto VARCHAR(200) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0,
    moratorio DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    forma_pago ENUM('efectivo', 'transferencia', 'tarjeta_debito', 'tarjeta_credito', 'cheque') NOT NULL,
    referencia VARCHAR(100),
    banco VARCHAR(50),
    fecha_pago DATETIME NOT NULL,
    fecha_vencimiento DATE NULL,
    dias_retraso INT DEFAULT 0,
    usuario_id INT NOT NULL,
    observaciones TEXT,
    comprobante_url VARCHAR(500),
    estatus ENUM('activo', 'cancelado') DEFAULT 'activo',
    fecha_cancelacion DATETIME NULL,
    motivo_cancelacion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE RESTRICT,
    FOREIGN KEY (mensualidad_id) REFERENCES mensualidades(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    
    INDEX idx_pagos_numero_recibo (numero_recibo),
    INDEX idx_pagos_fecha_pago (fecha_pago),
    INDEX idx_pagos_alumno_fecha (alumno_id, fecha_pago),
    INDEX idx_pagos_tipo (tipo_pago),
    INDEX idx_pagos_forma (forma_pago),
    INDEX idx_pagos_estatus (estatus),
    INDEX idx_pagos_usuario (usuario_id),
    INDEX idx_pagos_periodo (DATE(fecha_pago))
) ENGINE=InnoDB;

-- 6. Tabla de configuración del sistema
CREATE TABLE configuracion (
    id INT PRIMARY KEY AUTO_INCREMENT,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion VARCHAR(500),
    tipo ENUM('string', 'number', 'boolean', 'json', 'date') DEFAULT 'string',
    categoria VARCHAR(50) DEFAULT 'general',
    editable BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_configuracion_clave (clave),
    INDEX idx_configuracion_categoria (categoria)
) ENGINE=InnoDB;

-- 7. Tabla de notificaciones
CREATE TABLE notificaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alumno_id INT NOT NULL,
    tipo ENUM('pago_vencido', 'pago_proximo', 'graduacion', 'suspension', 'bienvenida', 'recordatorio') NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    datos_adicionales JSON,
    enviado BOOLEAN DEFAULT FALSE,
    fecha_envio DATETIME NULL,
    metodo ENUM('email', 'sms', 'whatsapp', 'push') DEFAULT 'email',
    destinatario VARCHAR(100),
    intentos_envio INT DEFAULT 0,
    ultimo_error TEXT,
    fecha_programada DATETIME NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE,
    
    INDEX idx_notificaciones_enviado (enviado),
    INDEX idx_notificaciones_tipo (tipo),
    INDEX idx_notificaciones_fecha_programada (fecha_programada),
    INDEX idx_notificaciones_alumno (alumno_id)
) ENGINE=InnoDB;

-- 8. Tabla de auditoría
CREATE TABLE auditoria (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tabla VARCHAR(50) NOT NULL,
    registro_id INT NOT NULL,
    accion ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    datos_anteriores JSON,
    datos_nuevos JSON,
    campos_modificados JSON,
    usuario_id INT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    INDEX idx_auditoria_tabla (tabla),
    INDEX idx_auditoria_registro (tabla, registro_id),
    INDEX idx_auditoria_fecha (fecha_accion),
    INDEX idx_auditoria_usuario (usuario_id),
    INDEX idx_auditoria_accion (accion)
) ENGINE=InnoDB;

-- 9. Tabla de sesiones de usuario
CREATE TABLE sesiones (
    id VARCHAR(128) PRIMARY KEY,
    usuario_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    datos_sesion JSON,
    activa BOOLEAN DEFAULT TRUE,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultimo_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    INDEX idx_sesiones_usuario (usuario_id),
    INDEX idx_sesiones_activa (activa),
    INDEX idx_sesiones_expiracion (fecha_expiracion)
) ENGINE=InnoDB;

-- 10. Tabla de respaldos
CREATE TABLE respaldos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_archivo VARCHAR(200) NOT NULL,
    tipo ENUM('manual', 'automatico', 'programado') NOT NULL,
    tamaño_bytes BIGINT,
    url_storage VARCHAR(500),
    hash_archivo VARCHAR(64),
    usuario_id INT NULL,
    estado ENUM('en_proceso', 'completado', 'error') DEFAULT 'en_proceso',
    mensaje_error TEXT,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_completado TIMESTAMP NULL,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    INDEX idx_respaldos_tipo (tipo),
    INDEX idx_respaldos_estado (estado),
    INDEX idx_respaldos_fecha (fecha_inicio)
) ENGINE=InnoDB;

-- =====================================================
-- INSERCIÓN DE DATOS INICIALES
-- =====================================================

-- Insertar usuario administrador por defecto
INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES 
('Administrador del Sistema', 'admin@inglesindividual.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSn9Vu', 'admin'),
('Coordinador Académico', 'coordinador@inglesindividual.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSn9Vu', 'coordinador'),
('Cajero Principal', 'cajero@inglesindividual.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSn9Vu', 'cajero');

-- Insertar planes educativos
INSERT INTO planes (nombre, descripcion, numero_mensualidades, precio_mensualidad, precio_inscripcion) VALUES 
('Plan Básico', 'Curso básico de inglés - 5 meses', 5, 1500.00, 500.00),
('Plan Intermedio', 'Curso intermedio de inglés - 8 meses', 8, 1800.00, 600.00),
('Plan Avanzado', 'Curso avanzado de inglés - 10 meses', 10, 2000.00, 700.00),
('Plan Intensivo', 'Curso intensivo de inglés - 3 meses', 3, 2500.00, 800.00);

-- Insertar configuración inicial del sistema
INSERT INTO configuracion (clave, valor, descripcion, tipo, categoria) VALUES 
-- Configuración de moratorios
('moratorio_porcentaje', '1.0', 'Porcentaje diario de moratorio por pago vencido', 'number', 'pagos'),
('dias_gracia', '3', 'Días de gracia antes de aplicar moratorio', 'number', 'pagos'),
('moratorio_maximo', '50.0', 'Porcentaje máximo de moratorio sobre el monto original', 'number', 'pagos'),

-- Información de la empresa
('empresa_nombre', 'Inglés Individual Tapachula', 'Nombre oficial de la empresa', 'string', 'empresa'),
('empresa_direccion', 'Tapachula, Chiapas, México', 'Dirección física de la empresa', 'string', 'empresa'),
('empresa_telefono', '962-000-0000', 'Teléfono principal de contacto', 'string', 'empresa'),
('empresa_email', 'contacto@inglesindividual.com', 'Email principal de contacto', 'string', 'empresa'),
('empresa_website', 'www.inglesindividual.com', 'Sitio web de la empresa', 'string', 'empresa'),

-- Configuración de notificaciones
('notificaciones_email', 'true', 'Activar notificaciones por email', 'boolean', 'notificaciones'),
('notificaciones_sms', 'false', 'Activar notificaciones por SMS', 'boolean', 'notificaciones'),
('dias_aviso_vencimiento', '7', 'Días antes del vencimiento para enviar recordatorio', 'number', 'notificaciones'),
('email_remitente', 'noreply@inglesindividual.com', 'Email remitente para notificaciones', 'string', 'notificaciones'),

-- Configuración del sistema
('backup_automatico', 'true', 'Activar respaldo automático diario', 'boolean', 'sistema'),
('backup_hora', '02:00', 'Hora para ejecutar respaldo automático', 'string', 'sistema'),
('sesion_duracion', '480', 'Duración de sesión en minutos', 'number', 'sistema'),
('max_intentos_login', '5', 'Máximo número de intentos de login', 'number', 'sistema'),

-- Configuración de reportes
('moneda_simbolo', '$', 'Símbolo de la moneda local', 'string', 'reportes'),
('moneda_codigo', 'MXN', 'Código de la moneda local', 'string', 'reportes'),
('formato_fecha', 'DD/MM/YYYY', 'Formato de fecha para reportes', 'string', 'reportes'),

-- Configuración de archivos
('max_tamaño_archivo', '5', 'Tamaño máximo de archivo en MB', 'number', 'archivos'),
('tipos_imagen_permitidos', '["image/jpeg", "image/png", "image/webp"]', 'Tipos de imagen permitidos', 'json', 'archivos'),
('tipos_documento_permitidos', '["application/pdf", "image/jpeg", "image/png"]', 'Tipos de documento permitidos', 'json', 'archivos');

-- =====================================================
-- CREACIÓN DE TRIGGERS
-- =====================================================

DELIMITER //

-- Trigger para generar mensualidades automáticamente al inscribir alumno
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
    
    -- Crear notificación de bienvenida
    INSERT INTO notificaciones (alumno_id, tipo, titulo, mensaje, destinatario)
    VALUES (NEW.id, 'bienvenida', 'Bienvenido a Inglés Individual', 
            CONCAT('Bienvenido ', NEW.nombre, '. Tu matrícula es: ', NEW.matricula), 
            COALESCE(NEW.email, NEW.telefono));
END//

-- Trigger para auditoría en alumnos
CREATE TRIGGER audit_alumnos_update
AFTER UPDATE ON alumnos
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla, registro_id, accion, datos_anteriores, datos_nuevos)
    VALUES ('alumnos', NEW.id, 'UPDATE', 
            JSON_OBJECT(
                'matricula', OLD.matricula,
                'nombre', OLD.nombre,
                'estatus', OLD.estatus,
                'plan_id', OLD.plan_id
            ),
            JSON_OBJECT(
                'matricula', NEW.matricula,
                'nombre', NEW.nombre,
                'estatus', NEW.estatus,
                'plan_id', NEW.plan_id
            ));
END//

-- Trigger para marcar mensualidad como pagada
CREATE TRIGGER after_pago_mensualidad
AFTER INSERT ON pagos
FOR EACH ROW
BEGIN
    IF NEW.mensualidad_id IS NOT NULL AND NEW.estatus = 'activo' THEN
        UPDATE mensualidades 
        SET estatus = 'pagado', fecha_pago = NEW.fecha_pago
        WHERE id = NEW.mensualidad_id;
    END IF;
END//

-- Trigger para auditoría en pagos
CREATE TRIGGER audit_pagos_insert
AFTER INSERT ON pagos
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla, registro_id, accion, datos_nuevos, usuario_id)
    VALUES ('pagos', NEW.id, 'INSERT', 
            JSON_OBJECT(
                'numero_recibo', NEW.numero_recibo,
                'alumno_id', NEW.alumno_id,
                'monto', NEW.monto,
                'total', NEW.total,
                'forma_pago', NEW.forma_pago
            ), NEW.usuario_id);
END//

DELIMITER ;

-- =====================================================
-- CREACIÓN DE EVENTOS PROGRAMADOS
-- =====================================================

-- Habilitar el programador de eventos
SET GLOBAL event_scheduler = ON;

DELIMITER //

-- Evento para actualizar mensualidades vencidas diariamente
CREATE EVENT actualizar_mensualidades_vencidas
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 1 DAY
DO
BEGIN
    -- Actualizar mensualidades vencidas
    UPDATE mensualidades 
    SET estatus = 'vencido' 
    WHERE fecha_vencimiento < CURDATE() 
    AND estatus = 'pendiente';
    
    -- Crear notificaciones para pagos vencidos
    INSERT INTO notificaciones (alumno_id, tipo, titulo, mensaje, destinatario)
    SELECT 
        m.alumno_id,
        'pago_vencido',
        'Pago Vencido',
        CONCAT('Su pago de la mensualidad ', m.numero_mensualidad, ' está vencido desde el ', DATE_FORMAT(m.fecha_vencimiento, '%d/%m/%Y')),
        COALESCE(a.email, a.telefono)
    FROM mensualidades m
    JOIN alumnos a ON m.alumno_id = a.id
    WHERE m.estatus = 'vencido'
    AND m.fecha_vencimiento = CURDATE() - INTERVAL 1 DAY
    AND a.estatus = 'activo';
END//

-- Evento para crear notificaciones de recordatorio
CREATE EVENT recordatorios_pago
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 1 DAY
DO
BEGIN
    DECLARE dias_aviso INT DEFAULT 7;
    
    -- Obtener días de aviso de configuración
    SELECT CAST(valor AS SIGNED) INTO dias_aviso
    FROM configuracion 
    WHERE clave = 'dias_aviso_vencimiento';
    
    -- Crear recordatorios de pago próximo a vencer
    INSERT INTO notificaciones (alumno_id, tipo, titulo, mensaje, destinatario, fecha_programada)
    SELECT 
        m.alumno_id,
        'pago_proximo',
        'Recordatorio de Pago',
        CONCAT('Su pago de la mensualidad ', m.numero_mensualidad, ' vence el ', DATE_FORMAT(m.fecha_vencimiento, '%d/%m/%Y'), '. Monto: $', FORMAT(m.monto, 2)),
        COALESCE(a.email, a.telefono),
        CONCAT(CURDATE(), ' 09:00:00')
    FROM mensualidades m
    JOIN alumnos a ON m.alumno_id = a.id
    WHERE m.estatus = 'pendiente'
    AND m.fecha_vencimiento = CURDATE() + INTERVAL dias_aviso DAY
    AND a.estatus = 'activo'
    AND NOT EXISTS (
        SELECT 1 FROM notificaciones n 
        WHERE n.alumno_id = m.alumno_id 
        AND n.tipo = 'pago_proximo' 
        AND DATE(n.fecha_creacion) = CURDATE()
    );
END//

-- Evento para limpiar sesiones expiradas
CREATE EVENT limpiar_sesiones_expiradas
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    DELETE FROM sesiones 
    WHERE fecha_expiracion < NOW();
END//

DELIMITER ;

-- =====================================================
-- CREACIÓN DE VISTAS
-- =====================================================

-- Vista completa de alumnos con información del plan
CREATE VIEW vista_alumnos_completa AS
SELECT 
    a.id,
    a.matricula,
    CONCAT(a.nombre, ' ', a.apellido_paterno, ' ', IFNULL(a.apellido_materno, '')) as nombre_completo,
    a.nombre,
    a.apellido_paterno,
    a.apellido_materno,
    a.fecha_nacimiento,
    a.genero,
    a.telefono,
    a.email,
    a.direccion,
    a.fecha_inscripcion,
    a.fecha_inicio,
    a.fecha_vigencia,
    a.estatus,
    p.nombre as plan_nombre,
    p.numero_mensualidades,
    p.precio_mensualidad,
    p.precio_inscripcion,
    -- Estadísticas de pagos
    (SELECT COUNT(*) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus = 'pagado') as mensualidades_pagadas,
    (SELECT COUNT(*) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus = 'pendiente') as mensualidades_pendientes,
    (SELECT COUNT(*) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus = 'vencido') as mensualidades_vencidas,
    (SELECT SUM(pg.total) FROM pagos pg WHERE pg.alumno_id = a.id AND pg.estatus = 'activo') as total_pagado,
    (SELECT SUM(m.monto) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus IN ('pendiente', 'vencido')) as saldo_pendiente,
    -- Próximo vencimiento
    (SELECT MIN(m.fecha_vencimiento) FROM mensualidades m WHERE m.alumno_id = a.id AND m.estatus = 'pendiente') as proximo_vencimiento,
    a.foto_url,
    a.fecha_creacion,
    a.fecha_actualizacion
FROM alumnos a
JOIN planes p ON a.plan_id = p.id;

-- Vista de cobranza mensual
CREATE VIEW vista_cobranza_mensual AS
SELECT 
    DATE_FORMAT(m.fecha_vencimiento, '%Y-%m') as periodo,
    DATE_FORMAT(m.fecha_vencimiento, '%M %Y') as periodo_nombre,
    COUNT(DISTINCT m.alumno_id) as total_alumnos,
    COUNT(m.id) as total_mensualidades,
    SUM(m.monto) as monto_esperado,
    SUM(CASE WHEN m.estatus = 'pagado' THEN m.monto ELSE 0 END) as monto_cobrado,
    COUNT(CASE WHEN m.estatus = 'pagado' THEN 1 END) as pagos_realizados,
    COUNT(CASE WHEN m.estatus = 'pendiente' THEN 1 END) as pagos_pendientes,
    COUNT(CASE WHEN m.estatus = 'vencido' THEN 1 END) as pagos_vencidos,
    ROUND((SUM(CASE WHEN m.estatus = 'pagado' THEN m.monto ELSE 0 END) / NULLIF(SUM(m.monto), 0)) * 100, 2) as porcentaje_cobranza,
    SUM(CASE WHEN m.estatus = 'vencido' THEN m.monto ELSE 0 END) as monto_vencido
FROM mensualidades m
GROUP BY DATE_FORMAT(m.fecha_vencimiento, '%Y-%m')
ORDER BY periodo DESC;

-- Vista de moratorios detallada
CREATE VIEW vista_moratorios AS
SELECT 
    a.id as alumno_id,
    a.matricula,
    CONCAT(a.nombre, ' ', a.apellido_paterno) as nombre_alumno,
    m.id as mensualidad_id,
    m.numero_mensualidad,
    m.fecha_vencimiento,
    m.monto,
    DATEDIFF(CURDATE(), m.fecha_vencimiento) as dias_vencido,
    ROUND(m.monto * (DATEDIFF(CURDATE(), m.fecha_vencimiento) * 
          (SELECT CAST(valor AS DECIMAL(5,2)) FROM configuracion WHERE clave = 'moratorio_porcentaje') / 100), 2) as moratorio_calculado,
    a.telefono,
    a.email,
    p.nombre as plan_nombre
FROM mensualidades m
JOIN alumnos a ON m.alumno_id = a.id
JOIN planes p ON a.plan_id = p.id
WHERE m.estatus = 'vencido'
AND DATEDIFF(CURDATE(), m.fecha_vencimiento) > 0
AND a.estatus = 'activo'
ORDER BY dias_vencido DESC, a.nombre;

-- Vista de ingresos por tipo y período
CREATE VIEW vista_ingresos_tipo AS
SELECT 
    DATE_FORMAT(p.fecha_pago, '%Y-%m') as periodo,
    DATE_FORMAT(p.fecha_pago, '%M %Y') as periodo_nombre,
    p.tipo_pago,
    COUNT(*) as cantidad_pagos,
    SUM(p.monto) as total_monto,
    SUM(p.descuento) as total_descuentos,
    SUM(p.moratorio) as total_moratorios,
    SUM(p.total) as total_ingresos,
    AVG(p.total) as promedio_pago
FROM pagos p
WHERE p.estatus = 'activo'
GROUP BY DATE_FORMAT(p.fecha_pago, '%Y-%m'), p.tipo_pago
ORDER BY periodo DESC, p.tipo_pago;

-- Vista de estadísticas generales
CREATE VIEW vista_estadisticas_generales AS
SELECT 
    -- Estadísticas de alumnos
    (SELECT COUNT(*) FROM alumnos WHERE estatus = 'activo') as alumnos_activos,
    (SELECT COUNT(*) FROM alumnos WHERE estatus = 'graduado') as alumnos_graduados,
    (SELECT COUNT(*) FROM alumnos WHERE estatus = 'baja') as alumnos_baja,
    (SELECT COUNT(*) FROM alumnos WHERE estatus = 'suspendido') as alumnos_suspendidos,
    (SELECT COUNT(*) FROM alumnos) as total_alumnos,
    
    -- Estadísticas de pagos del mes actual
    (SELECT COUNT(*) FROM pagos WHERE MONTH(fecha_pago) = MONTH(CURDATE()) AND YEAR(fecha_pago) = YEAR(CURDATE()) AND estatus = 'activo') as pagos_mes_actual,
    (SELECT SUM(total) FROM pagos WHERE MONTH(fecha_pago) = MONTH(CURDATE()) AND YEAR(fecha_pago) = YEAR(CURDATE()) AND estatus = 'activo') as ingresos_mes_actual,
    
    -- Estadísticas de mensualidades
    (SELECT COUNT(*) FROM mensualidades WHERE estatus = 'vencido') as mensualidades_vencidas,
    (SELECT COUNT(*) FROM mensualidades WHERE estatus = 'pendiente' AND fecha_vencimiento <= CURDATE() + INTERVAL 7 DAY) as mensualidades_por_vencer,
    (SELECT SUM(monto) FROM mensualidades WHERE estatus = 'vencido') as monto_vencido,
    
    -- Estadísticas de notificaciones
    (SELECT COUNT(*) FROM notificaciones WHERE enviado = FALSE) as notificaciones_pendientes;

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================

SELECT 'Base de datos creada exitosamente' as mensaje,
       'Inglés Individual - Sistema de Gestión Educativa' as sistema,
       NOW() as fecha_creacion;

-- Mostrar estadísticas iniciales
SELECT 
    (SELECT COUNT(*) FROM usuarios) as usuarios_creados,
    (SELECT COUNT(*) FROM planes) as planes_disponibles,
    (SELECT COUNT(*) FROM configuracion) as configuraciones_iniciales;
