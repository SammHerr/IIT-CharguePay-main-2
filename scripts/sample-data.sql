-- =====================================================
-- DATOS DE EJEMPLO PARA PRUEBAS
-- =====================================================

USE gestion_educativa;

-- Insertar alumnos de ejemplo
INSERT INTO alumnos (
    matricula, nombre, apellido_paterno, apellido_materno, 
    fecha_nacimiento, genero, telefono, email, direccion,
    contacto_emergencia, telefono_emergencia, relacion_emergencia,
    fecha_inscripcion, fecha_inicio, plan_id, fecha_vigencia
) VALUES 
('IIT-2024-001', 'María', 'González', 'Pérez', '1995-03-15', 'F', 
 '962-123-4567', 'maria.gonzalez@email.com', 'Calle Principal #123, Tapachula',
 'Juan González', '962-123-4568', 'Padre',
 '2024-01-10', '2024-01-15', 2, '2024-09-15'),

('IIT-2024-002', 'Carlos', 'Ruiz', 'Mendoza', '1992-07-22', 'M',
 '962-234-5678', 'carlos.ruiz@email.com', 'Av. Central #456, Tapachula',
 'Ana Mendoza', '962-234-5679', 'Esposa',
 '2024-01-05', '2024-01-10', 1, '2024-06-10'),

('IIT-2024-003', 'Ana', 'López', 'Torres', '1988-11-08', 'F',
 '962-345-6789', 'ana.lopez@email.com', 'Col. Centro #789, Tapachula',
 'Pedro López', '962-345-6790', 'Hermano',
 '2023-08-20', '2023-09-01', 3, '2024-07-01'),

('IIT-2024-004', 'Pedro', 'Martín', 'Silva', '1990-05-12', 'M',
 '962-456-7890', 'pedro.martin@email.com', 'Barrio Norte #321, Tapachula',
 'Carmen Silva', '962-456-7891', 'Madre',
 '2023-06-10', '2023-07-01', 2, '2024-03-01'),

('IIT-2024-005', 'Luis', 'Hernández', 'García', '1993-09-30', 'M',
 '962-567-8901', 'luis.hernandez@email.com', 'Zona Sur #654, Tapachula',
 'Rosa García', '962-567-8902', 'Esposa',
 '2023-05-15', '2023-06-01', 2, '2024-02-01');

-- Insertar algunos pagos de ejemplo
INSERT INTO pagos (
    numero_recibo, alumno_id, mensualidad_id, tipo_pago, concepto,
    monto, moratorio, total, forma_pago, fecha_pago, usuario_id
) VALUES 
('REC-2024-001', 1, 1, 'mensualidad', 'Pago mensualidad #1', 1800.00, 0, 1800.00, 'efectivo', '2024-01-15 10:30:00', 1),
('REC-2024-002', 3, 1, 'mensualidad', 'Pago mensualidad #1', 2000.00, 0, 2000.00, 'transferencia', '2024-01-10 14:20:00', 1),
('REC-2024-003', 1, NULL, 'inscripcion', 'Pago de inscripción', 600.00, 0, 600.00, 'efectivo', '2024-01-10 09:15:00', 1);

-- Actualizar algunas mensualidades como pagadas (esto se hace automáticamente con el trigger)
-- Las mensualidades ya fueron marcadas como pagadas por el trigger after_pago_mensualidad

SELECT 'Datos de ejemplo insertados correctamente' as mensaje;

-- Mostrar resumen de datos insertados
SELECT 
    'RESUMEN DE DATOS DE EJEMPLO' as seccion,
    '' as detalle;

SELECT 
    (SELECT COUNT(*) FROM alumnos) as alumnos_insertados,
    (SELECT COUNT(*) FROM mensualidades) as mensualidades_generadas,
    (SELECT COUNT(*) FROM pagos) as pagos_registrados,
    (SELECT COUNT(*) FROM notificaciones) as notificaciones_creadas;
