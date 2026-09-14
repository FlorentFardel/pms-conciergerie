import { db } from './config/database.js';

async function purgeDatabase() {
  try {
    console.log('🔄 Connexion à la base et suppression en cours...');
    const result = await db.query('TRUNCATE TABLE properties CASCADE;');
    console.log('✅ TABLE PURGÉE AVEC SUCCÈS !');
    console.log('Nombre de lignes affectées :', result.rowCount);
  } catch (error) {
    console.error('❌ Erreur lors de la purge :', error);
  } finally {
    process.exit(0);
  }
}

purgeDatabase();