-- ==========================================
-- 🚀 SCRIPT DE OPTIMIZACIÓN DE BASE DE DATOS
-- ==========================================
-- Ejecuta este script en tu base de datos Neon para mejorar el performance
-- IMPORTANTE: Ejecutar SOLO UNA VEZ

-- ==========================================
-- ÍNDICES PARA TABLA BOOKINGS
-- ==========================================
-- Acelera búsquedas de reservas por negocio
CREATE INDEX IF NOT EXISTS idx_bookings_business_id ON bookings(business_id);

-- Acelera búsquedas por fecha (muy usado en slots)
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);

-- Acelera filtros por estado
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Índice compuesto para la query más común (buscar reservas por negocio y fecha)
CREATE INDEX IF NOT EXISTS idx_bookings_business_date_status 
ON bookings(business_id, booking_date, status);

-- Acelera búsquedas por email del cliente
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(customer_email);

-- ==========================================
-- ÍNDICES PARA TABLA SERVICES
-- ==========================================
-- Acelera búsquedas de servicios por negocio
CREATE INDEX IF NOT EXISTS idx_services_business_id ON services(business_id);

-- Acelera filtros por servicios activos
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);

-- Índice compuesto para la query más común
CREATE INDEX IF NOT EXISTS idx_services_business_active 
ON services(business_id, is_active);

-- ==========================================
-- ÍNDICES PARA TABLA BUSINESSES
-- ==========================================
-- Acelera búsquedas por slug (página pública del negocio)
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);

-- Acelera búsquedas por usuario dueño
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);

-- Acelera filtros por negocios activos
CREATE INDEX IF NOT EXISTS idx_businesses_is_active ON businesses(is_active);

-- ==========================================
-- ÍNDICES PARA TABLA BUSINESS_HOURS
-- ==========================================
-- Acelera búsquedas de horarios por negocio
CREATE INDEX IF NOT EXISTS idx_business_hours_business_id ON business_hours(business_id);

-- Índice compuesto para la query más común (buscar horario específico)
CREATE INDEX IF NOT EXISTS idx_business_hours_business_day 
ON business_hours(business_id, day_of_week);

-- ==========================================
-- ÍNDICES PARA TABLA USERS
-- ==========================================
-- Acelera búsquedas por email (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ==========================================
-- ANÁLISIS DE LA BASE DE DATOS
-- ==========================================
-- Actualiza las estadísticas de la base de datos para mejor query planning
ANALYZE bookings;
ANALYZE services;
ANALYZE businesses;
ANALYZE business_hours;
ANALYZE users;

-- ==========================================
-- 📊 VERIFICAR ÍNDICES CREADOS
-- ==========================================
-- Ejecuta esta query para ver todos los índices creados:
-- SELECT tablename, indexname, indexdef 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, indexname;

-- ==========================================
-- ✅ OPTIMIZACIÓN COMPLETADA
-- ==========================================
-- Los índices han sido creados exitosamente.
-- Ahora tu base de datos debería ser MUCHO más rápida.
