-- Insertar datos iniciales
USE gestion_educativa;

-- Insertar usuario administrador por defecto
INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES 
('Administrador', 'admin@inglesindividual.com', '$2b$10$example_hash', 'admin');

-- Insertar planes educativos
INSERT INTO planes (nombre, numero_mensualidades, precio_mensualidad, precio_inscripcion) VALUES 
('Plan Básico', 5, 1500.00, 500.00),
('Plan Intermedio', 8, 1800.00, 600.00),
('Plan Avanzado', 10, 2000.00, 700.00);

-- Insertar configuración inicial
INSERT INTO configuracion (clave, valor, descripcion, tipo) VALUES 
('moratorio_porcentaje', '1.0', 'Porcentaje diario de moratorio', 'number'),
('dias_gracia', '3', 'Días de gracia antes de aplicar moratorio', 'number'),
('empresa_nombre', 'Inglés Individual Tapachula', 'Nombre de la empresa', 'string'),
('empresa_direccion', 'Tapachula, Chiapas, México', 'Dirección de la empresa', 'string'),
('empresa_telefono', '962-000-0000', 'Teléfono de la empresa', 'string'),
('empresa_email', 'contacto@inglesindividual.com', 'Email de la empresa', 'string'),
('notificaciones_email', 'true', 'Activar notificaciones por email', 'boolean'),
('backup_automatico', 'true', 'Activar respaldo automático', 'boolean');
