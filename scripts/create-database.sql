-- Crear base de datos
CREATE DATABASE IF NOT EXISTS gestion_educativa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gestion_educativa;

-- Tabla de usuarios del sistema
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'coordinador', 'cajero') DEFAULT 'cajero',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de planes educativos
CREATE TABLE planes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    numero_mensualidades INT NOT NULL,
    precio_mensualidad DECIMAL(10,2) NOT NULL,
    precio_inscripcion DECIMAL(10,2) NOT NULL,
    vigencia_meses INT DEFAULT 12,
    extension_meses INT DEFAULT 4,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de alumnos
CREATE TABLE alumnos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(50) NOT NULL,
    apellido_materno VARCHAR(50),
    fecha_nacimiento DATE,
    telefono VARCHAR(15),
    email VARCHAR(100),
    direccion TEXT,
    contacto_emergencia VARCHAR(100),
    telefono_emergencia VARCHAR(15),
    fecha_inscripcion DATE NOT NULL,
    fecha_inicio DATE NOT NULL,
    plan_id INT NOT NULL,
    fecha_vigencia DATE NOT NULL,
    estatus ENUM('activo', 'graduado', 'baja', 'suspendido') DEFAULT 'activo',
    motivo_baja TEXT,
    foto_url VARCHAR(255),
    documentos_url JSON,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES planes(id)
);

-- Tabla de mensualidades programadas
CREATE TABLE mensualidades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alumno_id INT NOT NULL,
    numero_mensualidad INT NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    estatus ENUM('pendiente', 'pagado', 'vencido', 'cancelado') DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id),
    UNIQUE KEY unique_alumno_mensualidad (alumno_id, numero_mensualidad)
);

-- Tabla de pagos
CREATE TABLE pagos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_recibo VARCHAR(20) UNIQUE NOT NULL,
    alumno_id INT NOT NULL,
    mensualidad_id INT,
    tipo_pago ENUM('mensualidad', 'inscripcion', 'moratorio', 'otro') NOT NULL,
    concepto VARCHAR(100) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    moratorio DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    forma_pago ENUM('efectivo', 'transferencia', 'tarjeta', 'cheque') NOT NULL,
    referencia VARCHAR(50),
    fecha_pago DATETIME NOT NULL,
    fecha_vencimiento DATE,
    dias_retraso INT DEFAULT 0,
    usuario_id INT NOT NULL,
    observaciones TEXT,
    comprobante_url VARCHAR(255),
    estatus ENUM('activo', 'cancelado') DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id),
    FOREIGN KEY (mensualidad_id) REFERENCES mensualidades(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de configuración del sistema
CREATE TABLE configuracion (
    id INT PRIMARY KEY AUTO_INCREMENT,
    clave VARCHAR(50) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion VARCHAR(200),
    tipo ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de notificaciones
CREATE TABLE notificaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alumno_id INT NOT NULL,
    tipo ENUM('pago_vencido', 'pago_proximo', 'graduacion', 'suspension') NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    mensaje TEXT NOT NULL,
    enviado BOOLEAN DEFAULT FALSE,
    fecha_envio DATETIME,
    metodo ENUM('email', 'sms', 'whatsapp') DEFAULT 'email',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id)
);

-- Tabla de auditoría
CREATE TABLE auditoria (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tabla VARCHAR(50) NOT NULL,
    registro_id INT NOT NULL,
    accion ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    datos_anteriores JSON,
    datos_nuevos JSON,
    usuario_id INT,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Índices para optimizar consultas
CREATE INDEX idx_alumnos_estatus ON alumnos(estatus);
CREATE INDEX idx_alumnos_fecha_inscripcion ON alumnos(fecha_inscripcion);
CREATE INDEX idx_mensualidades_fecha_vencimiento ON mensualidades(fecha_vencimiento);
CREATE INDEX idx_mensualidades_estatus ON mensualidades(estatus);
CREATE INDEX idx_pagos_fecha_pago ON pagos(fecha_pago);
CREATE INDEX idx_pagos_alumno_fecha ON pagos(alumno_id, fecha_pago);
CREATE INDEX idx_notificaciones_enviado ON notificaciones(enviado);
