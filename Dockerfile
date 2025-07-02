# .devcontainer/Dockerfile

FROM mcr.microsoft.com/devcontainers/javascript-node:18

# Install Drizzle Kit globally
RUN npm install -g drizzle-kit

# Optional: install Zsh & tools
RUN apt-get update && \
    apt-get install -y zsh postgresql-client

# Set working directory
# WORKDIR /workspace