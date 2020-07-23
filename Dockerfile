FROM node

# Create a directory where our app will be placed
RUN mkdir -p /app

# Change directory so that our commands run inside this new directory
WORKDIR /app

# Copy dependency definitions
COPY package.json /app

# Install dependecies
RUN npm install

# Get all the code needed to run the app
COPY . /app

# Serve the app
CMD ["node", "index.js"]