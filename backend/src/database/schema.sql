-- Extension pour la génération d'UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Types énumérés stricts
CREATE TYPE user_role AS ENUM ('ADMIN', 'CLEANER', 'ARTISAN', 'GUEST');
CREATE TYPE booking_channel AS ENUM ('AIRBNB', 'BOOKING', 'DIRECT', 'MANUAL_BLOCK');
CREATE TYPE booking_status AS ENUM ('CONFIRMED', 'PENDING', 'CANCELLED', 'BLOCKED');
CREATE TYPE task_type AS ENUM ('CLEANING', 'MAINTENANCE', 'INSPECTION');
CREATE TYPE task_status AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED');

-- 1. Table des utilisateurs
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'GUEST',
    phone VARCHAR(50),
    preferred_language VARCHAR(5) DEFAULT 'fr',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table des propriétés / Immeubles
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table des Chambres / Unités louables
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- Ex: "Chambre 1", "Studio A"
    cleaning_fee DECIMAL(10, 2) DEFAULT 0.00,
    base_price_per_night DECIMAL(10, 2) DEFAULT 0.00,
    check_in_time TIME DEFAULT '15:00:00',
    check_out_time TIME DEFAULT '11:00:00',
    ical_import_url TEXT, -- Lien iCal (Airbnb/Booking) pour sync auto
    ical_export_token VARCHAR(100) UNIQUE DEFAULT uuid_generate_v4()::text, -- Token unique pour export iCal
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table des Réservations et Blocages manuels
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    guest_id UUID REFERENCES users(id) ON DELETE SET NULL,
    channel booking_channel NOT NULL,
    status booking_status NOT NULL DEFAULT 'CONFIRMED',
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    nightly_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    channel_commission DECIMAL(10, 2) DEFAULT 0.00, -- Nécessaire pour le calcul du rendement NET
    is_manual_entry BOOLEAN DEFAULT FALSE,
    block_reason VARCHAR(255), -- Ex: 'Travaux', 'Utilisation perso'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_dates CHECK (check_out > check_in)
);

-- 5. Table des Tâches (Ménage, Maintenance, Artisans)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL, -- Cleaner ou Artisan
    type task_type NOT NULL DEFAULT 'CLEANING',
    status task_status NOT NULL DEFAULT 'TODO',
    scheduled_date DATE NOT NULL,
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Table de Logs de Synchronisation (iCal / Actions)
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    channel booking_channel NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'SUCCESS', 'ERROR'
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour accélérer le calendrier, les calculs de taux d'occupation et le suivi des tâches
CREATE INDEX idx_bookings_unit_dates ON bookings (unit_id, check_in, check_out);
CREATE INDEX idx_tasks_unit_status ON tasks (unit_id, status, scheduled_date);