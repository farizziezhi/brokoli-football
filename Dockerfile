FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN npm install && npm run build

EXPOSE 3333

CMD ["npm", "start"]