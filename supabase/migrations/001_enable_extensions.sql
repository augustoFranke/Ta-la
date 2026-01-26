-- Habilita PostGIS para queries geoespaciais
CREATE EXTENSION IF NOT EXISTS postgis;

-- Habilita pg_trgm para busca fuzzy
CREATE EXTENSION IF NOT EXISTS pg_trgm;
