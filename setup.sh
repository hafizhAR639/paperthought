#!/bin/bash

echo "PaperThought - Setup Script"
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "\n${BLUE}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

# Install dependencies
echo -e "\n${BLUE}Installing dependencies...${NC}"
npm install --workspaces

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo -e "\n${RED}⚠️  Docker is not installed${NC}"
    echo "Please install Docker to run PostgreSQL locally"
    echo "Visit: https://docs.docker.com/get-docker/"
else
    echo -e "${GREEN}✓ Docker is installed${NC}"
    
    # Start PostgreSQL
    echo -e "\n${BLUE}Starting PostgreSQL with Docker...${NC}"
    docker-compose up -d
    sleep 3
fi

# Create .env files from examples
echo -e "\n${BLUE}Creating environment files...${NC}"

if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✓ Created backend/.env${NC}"
else
    echo -e "${BLUE}ℹ backend/.env already exists${NC}"
fi

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    echo -e "${GREEN}✓ Created frontend/.env${NC}"
else
    echo -e "${BLUE}ℹ frontend/.env already exists${NC}"
fi

echo -e "\n${GREEN}✅ Setup complete!${NC}"
echo -e "\n${BLUE}Next steps:${NC}"
echo "1. Update environment variables in .env files"
echo "2. Run migrations: npm run backend -- db:migrate"
echo "3. Start development servers:"
echo "   - Frontend: npm run frontend -- dev"
echo "   - Backend: npm run backend -- dev"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:3001"
