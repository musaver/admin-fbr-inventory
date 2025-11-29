import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current session to ensure only super admins can trigger logout
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = session.user as any;
    
    // Only super admins can trigger tenant user logout
    if (currentUser.type !== 'super-admin') {
      return NextResponse.json({ error: 'Access denied. Super admin required.' }, { status: 403 });
    }

    const tenantId = params.id;
    const { reason = 'tenant_suspended' } = await req.json();

    console.log(`Triggering logout for all users of tenant ${tenantId}, reason: ${reason}`);
    
    // Create a Server-Sent Events response to broadcast logout event
    const headers = new Headers();
    headers.set('Content-Type', 'text/event-stream');
    headers.set('Cache-Control', 'no-cache');
    headers.set('Connection', 'keep-alive');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Headers', 'Cache-Control');

    // Create logout broadcast message
    const logoutEvent = {
      type: 'tenant_logout',
      tenantId: tenantId,
      reason: reason,
      timestamp: new Date().toISOString()
    };

    // For now, just return success - in production you would integrate with a real-time system
    // like WebSockets, Server-Sent Events, or a message queue
    console.log('Logout event created:', logoutEvent);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Logout event triggered for tenant users',
      event: logoutEvent 
    });

  } catch (error) {
    console.error('Error triggering tenant logout:', error);
    return NextResponse.json({ error: 'Failed to trigger logout' }, { status: 500 });
  }
}