import express from 'express';
import cors from 'cors';
import propertyRoutes from './modules/properties/property.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Force l'encodage UTF-8 sur toutes les réponses HTTP de l'API
app.use((_req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Tes routes
app.use('/api/properties', propertyRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});