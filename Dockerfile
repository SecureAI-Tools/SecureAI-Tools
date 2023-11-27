# Use an official Node.js image as the base image
FROM node:14-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and yarn.lock to the working directory
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy the rest of the application code to the working directory
COPY . .

# Build the Next.js app
RUN yarn build

# Expose the port that the app will run on
EXPOSE 28669