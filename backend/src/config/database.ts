import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const db = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

db.on('connect', () => {
  console.log('✅ Connexion réussie à la base PostgreSQL (pms_conciergerie)');
});

db.on('error', (err) => {
  console.error('❌ Erreur critique de la base de données :', err);
});