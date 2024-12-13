FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy application
COPY . .

# Build the application
RUN npm run build

# Start the application
CMD ["npm", "run", "dev"]
