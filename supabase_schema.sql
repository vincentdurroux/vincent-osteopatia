-- =========================================================================
-- Vincent Osteopatía - Script d'Initialisation de la Base de Données Supabase
-- =========================================================================
-- Ce script crée toutes les tables requises pour l'Espace Cabinet / Praticien
-- avec les contraintes d'intégrité, les index de performance et les politiques
-- de sécurité Row Level Security (RLS).
-- 
-- DIRECTIVES :
-- 1. Rendez-vous sur votre tableau de bord Supabase (https://supabase.com).
-- 2. Allez dans la section "SQL Editor" dans le menu de gauche.
-- 3. Cliquez sur "New query" (Nouvelle requête).
-- 4. Copiez-collez l'intégralité de ce script et cliquez sur "Run" (Exécuter).
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. TABLE DES PATIENTS (clients)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    "firstName" TEXT,
    "lastName" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "birthDate" TEXT,
    "createdAt" TEXT NOT NULL,
    "lastSessionAt" TEXT,
    "address" TEXT
);

-- Activation de RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- 2. TABLE DES NOTES CLINIQUES / CONSULTATIONS (client_notes)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_notes (
    id TEXT PRIMARY KEY,
    "clientId" TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    "date" TEXT NOT NULL,
    "motif" TEXT,
    "anamnese" TEXT DEFAULT '',
    "treatment" TEXT DEFAULT '',
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL CHECK ("category" IN ('evaluation', 'treatment', 'follow-up', 'general'))
);

-- Activation de RLS
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- 3. TABLE DES FACTURES / HONORAIRES (invoices)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY,
    "invoiceNumber" TEXT UNIQUE NOT NULL,
    "clientId" TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
    "clientName" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "amount" NUMERIC NOT NULL,
    "status" TEXT NOT NULL CHECK ("status" IN ('paid', 'pending')),
    "paymentMethod" TEXT CHECK ("paymentMethod" IN ('cash', 'card', 'transfer')),
    "description" TEXT NOT NULL,
    "language" TEXT DEFAULT 'fr' CHECK ("language" IN ('fr', 'en', 'es'))
);

-- Activation de RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- CRÉATION DES POLITIQUES DE SÉCURITÉ (Row Level Security - RLS)
-- Pour permettre la lecture et l'écriture de données depuis l'application web.
-- Note : Ces politiques sont ouvertes pour faciliter la connexion directe.
-- =========================================================================

-- Politiques pour la table clients
CREATE POLICY "Permettre toutes les actions sur clients" ON public.clients
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Politiques pour la table client_notes
CREATE POLICY "Permettre toutes les actions sur client_notes" ON public.client_notes
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Politiques pour la table invoices
CREATE POLICY "Permettre toutes les actions sur invoices" ON public.invoices
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- =========================================================================
-- INDEX DE PERFORMANCE (Accélère la recherche et le tri des dossiers)
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients("name");
CREATE INDEX IF NOT EXISTS idx_client_notes_clientId ON public.client_notes("clientId");
CREATE INDEX IF NOT EXISTS idx_client_notes_date ON public.client_notes("date" DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_clientId ON public.invoices("clientId");
CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices("date" DESC);

-- =========================================================================
-- DONNÉES DE DÉMONSTRATION (SEED)
-- Vous pouvez optionnellement insérer ces fiches de test pour avoir une 
-- démonstration immédiate dans l'Espace Cabinet.
-- =========================================================================

-- Insertion des patients de test
INSERT INTO public.clients (id, "firstName", "lastName", "name", "email", "phone", "birthDate", "address", "createdAt", "lastSessionAt") VALUES
('c1', 'Marie', 'Laurent', 'Marie Laurent', 'marie.laurent@gmail.com', '+33 6 12 34 56 78', '1988-04-12', 'Calle del Mar 14, L''Eliana', '2026-01-10T10:00:00Z', '2026-08-25T14:30:00Z'),
('c2', 'Jean-Pierre', 'Petit', 'Jean-Pierre Petit', 'jp.petit@yahoo.fr', '+34 612 987 654', '1964-11-03', 'Avenida de las Cortes 45, Valencia', '2026-02-15T09:00:00Z', '2026-08-28T11:00:00Z'),
('c3', 'Lucas', 'Mercier (Bébé)', 'Lucas Mercier (Bébé)', 'sophie.mercier@gmail.com', '+33 6 88 55 44 22', '2025-10-05', 'Calle Mayor 8, L''Eliana', '2026-05-20T16:00:00Z', '2026-08-30T10:00:00Z'),
('c4', 'Sofía', 'Benítez', 'Sofía Benítez', 'sofia.benitez@outlook.com', '+34 654 321 098', '1995-07-22', 'Gran Vía de les Corts 112, Valencia', '2026-03-05T11:00:00Z', '2026-08-20T17:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Insertion des notes cliniques de test
INSERT INTO public.client_notes (id, "clientId", "date", "motif", "anamnese", "treatment", "content", "category") VALUES
('n1', 'c1', '2026-08-25T15:30:00Z', 'Lombalgie aiguë', 'Douleur lombaire basse gauche survenue après port de charge. Douleur irradiant fessier mais sans trajet radiculaire franc. Examen : Bloc de la sacro-iliaque gauche, tension importante du psoas homolatéral.', 'Libération de la charnière thoraco-lombaire, pompage sacré, étirement doux du psoas gauche. Recommandations : Étirements quotidiens, hydratation soutenue.', 'Anamnèse : Douleur lombaire basse gauche survenue après port de charge. Douleur irradiant fessier mais sans trajet radiculaire franc.\n\nExamen : Bloc de la sacro-iliaque gauche, tension importante du psoas homolatéral.\n\nTraitement : Libération de la charnière thoraco-lombaire, pompage sacré, étirement doux du psoas gauche.\n\nRecommandations : Étirements quotidiens, hydratation soutenue.', 'treatment'),
('n2', 'c1', '2026-08-11T10:00:00Z', 'Bilan postural initial', 'Première consultation. Bilan complet postural : légère bascule du bassin à gauche. Chaîne descendante cervicale à investiguer.', 'Observation clinique et conseils de posture.', 'Première consultation. Bilan complet postural : légère bascule du bassin à gauche. Chaîne descendante cervicale à investiguer.', 'evaluation'),
('n3', 'c2', '2026-08-28T12:00:00Z', 'Cervicalgie chronique', 'Suivi cervicalgie chronique. Tension persistante des trapèzes supérieurs.', 'Techniques d''énergie musculaire sur les cervicaux moyens. Mobilisation des côtes hautes (C1-C2). Soulagement immédiat de 70% de la raideur lors des tests dynamiques de fin de séance.', 'Suivi cervicalgie chronique. Tension persistante des trapèzes supérieurs.\n\nTraitement : Techniques d\'énergie musculaire sur les cervicaux moyens. Mobilisation des côtes hautes (C1-C2).\n\nSoulagement immédiat de 70% de la raideur lors des tests dynamiques de fin de séance.', 'treatment'),
('n4', 'c3', '2026-08-30T10:45:00Z', 'Coliques et reflux gastro-œsophagien', 'Coliques du nourrisson et reflux persistant. Examen crânien : Légère asymétrie de la SSB (Synchondrose Sphéno-Basilaire) liée à l''accouchement par ventouse.', 'Relâchement de la base du crâne (occiput-atlas), massage doux de la sphère abdominale (côlon descendant). Bébé s''est endormi détendu pendant les techniques viscérales.', 'Coliques du nourrisson et reflux persistant.\n\nExamen crânien : Légère asymétrie de la SSB (Synchondrose Sphéno-Basilaire) liée à l\'accouchement par ventouse.\n\nTraitement : Relâchement de la base du crâne (occiput-atlas), massage doux de la sphère abdominale (côlon descendant).\n\nBébé s\'est endormi détendu pendant les techniques viscérales.', 'treatment')
ON CONFLICT (id) DO NOTHING;

-- Insertion des factures d'honoraires de test
INSERT INTO public.invoices (id, "invoiceNumber", "clientId", "clientName", "date", "amount", "status", "paymentMethod", "description") VALUES
('i1', 'FAC-2026-101', 'c1', 'Marie Laurent', '2026-08-25', 60, 'paid', 'card', 'Séance d''Ostéopathie (1h)'),
('i2', 'FAC-2026-102', 'c2', 'Jean-Pierre Petit', '2026-08-28', 60, 'paid', 'cash', 'Séance d''Ostéopathie (1h)'),
('i3', 'FAC-2026-103', 'c3', 'Lucas Mercier (Bébé)', '2026-08-30', 60, 'paid', 'transfer', 'Séance d''Ostéopathie pédiatrique'),
('i4', 'FAC-2026-098', 'c4', 'Sofía Benítez', '2026-08-20', 160, 'paid', 'card', 'Forfait Ostéopathie - 3 séances'),
('i5', 'FAC-2026-095', 'c1', 'Marie Laurent', '2026-08-11', 60, 'paid', 'card', 'Séance d''Ostéopathie (1h)'),
('i_h1', 'FAC-2026-021', 'c1', 'Marie Laurent', '2026-02-15', 60, 'paid', 'cash', 'Séance d''Ostéopathie'),
('i_h2', 'FAC-2026-031', 'c2', 'Jean-Pierre Petit', '2026-03-20', 160, 'paid', 'transfer', 'Forfait 3 séances'),
('i_h3', 'FAC-2026-041', 'c4', 'Sofía Benítez', '2026-04-10', 250, 'paid', 'card', 'Forfait 5 séances'),
('i_h4', 'FAC-2026-051', 'c3', 'Lucas Mercier (Bébé)', '2026-05-22', 60, 'paid', 'cash', 'Séance pédiatrique'),
('i_h5', 'FAC-2026-061', 'c2', 'Jean-Pierre Petit', '2026-06-12', 60, 'paid', 'card', 'Séance de suivi'),
('i_h6', 'FAC-2026-071', 'c4', 'Sofía Benítez', '2026-07-05', 160, 'paid', 'card', 'Forfait 3 séances')
ON CONFLICT (id) DO NOTHING;
