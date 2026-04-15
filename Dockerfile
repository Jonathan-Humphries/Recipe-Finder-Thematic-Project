FROM node:20

WORKDIR /usr/src/app

# Install dependencies first (better layer caching)
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy backend source
COPY backend/ ./backend/

# Copy frontend (served statically by Express from ../public)
COPY public/ ./public/

EXPOSE 3000

CMD ["node", "backend/server.js"]
