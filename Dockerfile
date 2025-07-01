# .devcontainer/Dockerfile

FROM mcr.microsoft.com/devcontainers/javascript-node:18

# Install Prisma CLI globally
RUN npm install -g prisma

# Optional: install Zsh & tools
RUN apt-get update && \
    apt-get install -y zsh postgresql-client

# Set working directory
# WORKDIR /workspace