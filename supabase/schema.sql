-- ============================================================
-- AGENDALO — Schema Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Servicios que ofrece el negocio
CREATE TABLE servicios (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  descripcion   TEXT,
  duracion      INT NOT NULL DEFAULT 60,   -- minutos
  precio        DECIMAL(10,2),
  activo        BOOLEAN DEFAULT true,
  created_at    TIMESTAMP DEFAULT now()
);

-- Horarios de atención por día de semana
CREATE TABLE horarios_disponibles (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dia_semana    INT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),  -- 0=dom, 1=lun...
  hora_inicio   TIME NOT NULL,
  hora_fin      TIME NOT NULL,
  activo        BOOLEAN DEFAULT true
);

-- Fechas/horarios bloqueados (feriados, vacaciones, etc.)
CREATE TABLE bloqueos (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha         DATE NOT NULL,
  hora_inicio   TIME,           -- null = día completo bloqueado
  hora_fin      TIME,
  motivo        VARCHAR(200),
  created_at    TIMESTAMP DEFAULT now()
);

-- Reservas de clientes
CREATE TABLE reservas (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  servicio_id       UUID NOT NULL REFERENCES servicios(id),
  fecha             DATE NOT NULL,
  hora              TIME NOT NULL,
  cliente_nombre    VARCHAR(100) NOT NULL,
  cliente_email     VARCHAR(200) NOT NULL,
  cliente_telefono  VARCHAR(20),
  estado            VARCHAR(20) DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente','confirmada','cancelada','completada')),
  notas             TEXT,
  created_at        TIMESTAMP DEFAULT now()
);

-- Configuración del negocio (una sola fila)
CREATE TABLE configuracion (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  negocio_nombre        VARCHAR(100) NOT NULL DEFAULT 'Mi Negocio',
  negocio_email         VARCHAR(200) NOT NULL DEFAULT 'contacto@ejemplo.com',
  negocio_telefono      VARCHAR(20),
  negocio_direccion     TEXT,
  intervalo_minutos     INT NOT NULL DEFAULT 30,
  dias_anticipacion     INT NOT NULL DEFAULT 30,
  mensaje_confirmacion  TEXT DEFAULT '¡Tu reserva ha sido confirmada! Te esperamos.'
);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Configuración por defecto
INSERT INTO configuracion (negocio_nombre, negocio_email, intervalo_minutos, dias_anticipacion)
VALUES ('Agendalo', 'contacto@agendalo.com', 30, 30);

-- Servicios de ejemplo
INSERT INTO servicios (nombre, descripcion, duracion, precio) VALUES
  ('Consulta estándar',  'Atención personalizada de 30 minutos', 30, 25.00),
  ('Consulta extendida', 'Atención detallada de 60 minutos',     60, 45.00),
  ('Consulta rápida',    'Atención express de 15 minutos',       15, 15.00);

-- Horarios de lunes a viernes (1–5): 09:00–13:00 y 14:00–18:00
INSERT INTO horarios_disponibles (dia_semana, hora_inicio, hora_fin) VALUES
  (1, '09:00', '13:00'), (1, '14:00', '18:00'),
  (2, '09:00', '13:00'), (2, '14:00', '18:00'),
  (3, '09:00', '13:00'), (3, '14:00', '18:00'),
  (4, '09:00', '13:00'), (4, '14:00', '18:00'),
  (5, '09:00', '13:00'), (5, '14:00', '18:00');

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE servicios             ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_disponibles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloqueos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion         ENABLE ROW LEVEL SECURITY;

-- Público puede leer servicios, horarios y configuración
CREATE POLICY "publico_lee_servicios"    ON servicios            FOR SELECT USING (true);
CREATE POLICY "publico_lee_horarios"     ON horarios_disponibles FOR SELECT USING (true);
CREATE POLICY "publico_lee_config"       ON configuracion        FOR SELECT USING (true);

-- Público puede insertar reservas (para hacer una reserva)
CREATE POLICY "publico_inserta_reservas" ON reservas             FOR INSERT WITH CHECK (true);

-- Solo admin (service role) puede leer y modificar todo
CREATE POLICY "admin_todo_reservas"      ON reservas             FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "admin_todo_bloqueos"      ON bloqueos             FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "admin_todo_servicios"     ON servicios            FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "admin_todo_horarios"      ON horarios_disponibles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "admin_todo_config"        ON configuracion        FOR ALL USING (auth.role() = 'service_role');
