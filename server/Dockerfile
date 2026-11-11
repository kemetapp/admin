FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY tsconfig.json ./
COPY src ./src
RUN npm install -D typescript tsx && npx tsc -p tsconfig.json
CMD ["node", "dist/index.js"]
