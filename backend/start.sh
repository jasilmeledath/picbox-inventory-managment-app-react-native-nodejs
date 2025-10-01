#!/bin/bash

# PICBOX Backend Quick Start Script

echo "🚀 PICBOX Backend Quick Start"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if MongoDB is running (optional check)
if command -v mongo &> /dev/null || command -v mongosh &> /dev/null; then
    echo "✅ MongoDB CLI found"
else
    echo "⚠️  MongoDB CLI not found. Make sure MongoDB is accessible."
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔑 Checking environment configuration..."

if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please configure it before starting the server."
    echo ""
    echo "Required configurations:"
    echo "  - MONGO_URI: Your MongoDB connection string"
    echo "  - JWT_SECRET: A strong secret key"
    echo "  - CLOUDINARY credentials (if using file uploads)"
    echo ""
    read -p "Press Enter to continue after configuring .env..."
fi

echo ""
echo "🌱 Would you like to seed the database with sample data? (y/n)"
read -r seed_choice

if [ "$seed_choice" = "y" ] || [ "$seed_choice" = "Y" ]; then
    echo "Seeding database..."
    npm run seed
    echo ""
    echo "✅ Database seeded successfully!"
    echo ""
    echo "Sample credentials:"
    echo "  Email: admin@picbox.com"
    echo "  Password: admin123"
    echo ""
fi

echo ""
echo "🎯 Starting development server..."
echo ""
echo "Server will be available at:"
echo "  - API: http://localhost:8080"
echo "  - Health Check: http://localhost:8080/health"
echo "  - API Docs: http://localhost:8080/api-docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
