import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    fbrBaseUrl: process.env.FBR_BASE_URL ? 'SET' : 'NOT SET',
    fbrToken: process.env.FBR_SANDBOX_TOKEN ? 'SET' : 'NOT SET',
    fbrSellerNTN: process.env.FBR_SELLER_NTNCNIC ? 'SET' : 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
    // Show first 10 chars of actual values for debugging (safely)
    actualValues: {
      baseUrl: process.env.FBR_BASE_URL?.substring(0, 30) + '...',
      token: process.env.FBR_SANDBOX_TOKEN?.substring(0, 10) + '...',
      ntn: process.env.FBR_SELLER_NTNCNIC
    }
  });
}