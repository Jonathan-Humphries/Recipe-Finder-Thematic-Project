FROM node:20

WORKDIR /usr/src/app

COPY backend/package*.json ./backend/
RUN cd backend && npm install

COPY backend/ ./backend/

COPY public/ ./public/

EXPOSE 3000

CMD ["node", "backend/server.js"]
