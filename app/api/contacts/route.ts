import { NextRequest, NextResponse } from 'next/server';

// PORTAL_API_URL already includes /api/sync
const PORTAL_API_URL = process.env.PORTAL_API_URL || 'https://tcnaux.ca/api/sync';
const PORTAL_API_KEY = process.env.PORTAL_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    // Build query params for the portal API
    const params = new URLSearchParams();
    if (query) params.append('search', query);
    params.append('limit', limit);
    params.append('offset', offset);
    params.append('activated', 'true');
    params.append('fields', 'both'); // Get both phone and email

    const url = `${PORTAL_API_URL}/contacts?${params}`;
    console.log('Fetching contacts from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': PORTAL_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Portal API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Portal API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch contacts from portal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
