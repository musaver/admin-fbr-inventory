#!/bin/bash

echo "🚀 Multi-Tenant Setup Script"
echo "============================="

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📄 Creating .env.local from template..."
    cp env.template .env.local
    echo "✅ .env.local created"
    echo ""
    echo "🚨 IMPORTANT: Please edit .env.local with your database credentials:"
    echo "   - DB_HOST"
    echo "   - DB_USER" 
    echo "   - DB_PASS"
    echo "   - DB_NAME"
    echo ""
    echo "Run: nano .env.local"
    echo ""
else
    echo "✅ .env.local already exists"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Test database connection
echo "🔍 Testing database connection..."
node -e "
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  try {
    if (!process.env.DB_HOST) {
      console.log('❌ Please configure your database credentials in .env.local');
      return;
    }
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });
    console.log('✅ Database connected successfully');
    await connection.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('Please check your database credentials in .env.local');
  }
}
testConnection();
" 2>/dev/null

echo ""
echo "🏢 Next Steps:"
echo "1. Configure your database credentials in .env.local"
echo "2. Run: npm run dev"
echo "3. Run: node scripts/test-api.js (to create test tenants)"
echo "4. Add to /etc/hosts: 127.0.0.1 acme-electronics.localhost"
echo "5. Test: http://acme-electronics.localhost:3000"
echo ""
echo "📖 For detailed troubleshooting, see: TROUBLESHOOTING.md"
