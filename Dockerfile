# TrueSkill HRMS backend — production image
FROM node:20-alpine

WORKDIR /app

# Install production deps only
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# App source
COPY . .

ENV NODE_ENV=production
EXPOSE 4000

# Run migrations + seed on boot, then start. (Override CMD if you run migrations separately.)
CMD ["sh", "-c", "npx sequelize-cli db:migrate && node src/server.js"]
