# tracking-dashboard/Dockerfile
FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
ENV PORT=9000
EXPOSE 9000
CMD ["node", "src/server.js"]