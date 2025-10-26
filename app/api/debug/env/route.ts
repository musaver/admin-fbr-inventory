import { NextResponse } from 'next/server';

export async function GET() {
  // Only allow in development or with a secret key for security
  const isDebugAllowed = process.env.NODE_ENV === 'development' || 
                        process.env.DEBUG_SECRET === 'your-debug-secret';
  
  if (!isDebugAllowed) {
    return NextResponse.json({ error: 'Debug endpoint disabled' }, { status: 403 });
  }
  
  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'SET' : 'MISSING',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
    DB_HOST: process.env.DB_HOST ? 'SET' : 'MISSING',
    DB_USER: process.env.DB_USER ? 'SET' : 'MISSING', 
    DB_PASS: process.env.DB_PASS ? 'SET' : 'MISSING',
    DB_NAME: process.env.DB_NAME ? 'SET' : 'MISSING',
    NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    timestamp: new Date().toISOString(),
  });
}
