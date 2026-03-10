import { NextRequest, NextResponse } from 'next/server';
import { isSubdomainAvailable, isValidSubdomain, generateSubdomainSuggestions } from '@/lib/tenant';

export async function POST(request: NextRequest) {
  try {
    const { subdomain } = await request.json();

    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomain is required' }, { status: 400 });
    }

    // Validate subdomain format
    if (!isValidSubdomain(subdomain)) {
      return NextResponse.json({
        available: false,
        valid: false,
        message: 'Subdomain must be 3-63 characters long, contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen.',
        suggestions: []
      });
    }

    // Check availability
    const available = await isSubdomainAvailable(subdomain);

    if (available) {
      return NextResponse.json({
        available: true,
        valid: true,
        message: 'Subdomain is available!',
        suggestions: []
      });
    } else {
      const suggestions = generateSubdomainSuggestions(subdomain);
      
      // Check which suggestions are actually available
      const availableSuggestions = [];
      for (const suggestion of suggestions) {
        if (await isSubdomainAvailable(suggestion)) {
          availableSuggestions.push(suggestion);
          if (availableSuggestions.length >= 3) break; // Limit to 3 suggestions
        }
      }

      return NextResponse.json({
        available: false,
        valid: true,
        message: 'Subdomain is already taken.',
        suggestions: availableSuggestions
      });
    }
  } catch (error) {
    console.error('Error checking subdomain:', error);
    return NextResponse.json({ error: 'Failed to check subdomain availability' }, { status: 500 });
  }
}
