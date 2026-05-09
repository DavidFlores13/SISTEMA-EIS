FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY DB EIS.db ./DB EIS.db
COPY .env.example ./.env.example

EXPOSE 3001
CMD ["npm", "start"]
