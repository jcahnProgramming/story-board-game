#!/bin/bash

echo "Creating Story Board Game project structure..."

# Create directories
mkdir -p client/src/{components,pixi,store,hooks,services,discord,styles}
mkdir -p server/src/{routes,sockets,services,db,discord}
mkdir -p shared/types

echo "Directories created!"
echo "Now creating package.json files..."

# Root package.json
cat > package.json << 'EOF'
{
  "name": "story-board-game",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "client",
    "server",
    "shared"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "npm run dev --workspace=client",
    "dev:server": "npm run dev --workspace=server",
    "build": "npm run build --workspace=client && npm run build --workspace=server"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
EOF

echo "Root package.json created!"
echo ""
echo "Setup script ready! The full project files are too large for one script."
echo "Would you like me to:"
echo "1. Generate individual scripts for each part (client, server, shared)"
echo "2. Or provide you the file contents to copy/paste manually"
echo ""
echo "Please let me know which you prefer!"

