# Utilisation d'une image Node.js légère
FROM node:20-alpine

# Définition du dossier de travail dans le conteneur
WORKDIR /app

# Copie de tous les fichiers de votre dossier vers le conteneur
COPY . .

# Si vous avez un package.json avec des dépendances, décommentez la ligne suivante :
RUN npm install

# Indique que l'app écoute sur le port 3002 (purement informatif)
EXPOSE 3002

# Commande de démarrage
CMD ["node", "server.mjs"]
