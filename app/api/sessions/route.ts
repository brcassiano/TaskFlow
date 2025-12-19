import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function normalizePhone(input?: string | null): string | null {
  const p = String(input ?? '').trim();
  if (!p) return null;
  return p.includes('@s.whatsapp.net') ? p : `${p}@s.whatsapp.net`;
}

function assertSecret(_req: NextRequest) {
  // MVP: no auth. In production, enable x-taskflow-secret check here.
  return null;
}


// GET /api/sessions?phone=xxxx@s.whatsapp.net
export async function GET(request: NextRequest) {
  const denied = assertSecret(request);
  if (denied) return denied;

  try {
    const searchParams = new URL(request.url).searchParams;
    const phone = normalizePhone(searchParams.get('phone'));

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'phone is required' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_phone', phone)
      .eq('is_active', true)
      .limit(1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to check session' },
      { status: 500 },
    );
  }
}

// POST /api/sessions
export async function POST(request: NextRequest) {
  const denied = assertSecret(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const phone = normalizePhone(body?.phone);

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'phone is required' },
        { status: 400 },
      );
    }

    const payload: Record<string, unknown> = {
      user_phone: phone,
      is_active: true,
      last_interaction: new Date().toISOString(),
    };

    if (Object.prototype.hasOwnProperty.call(body, 'context')) {
      payload.context = body.context ?? {};
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .upsert(payload, { onConflict: 'user_phone' })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 },
    );
  }
}

// DELETE /api/sessions?phone=...
export async function DELETE(request: NextRequest) {
  const denied = assertSecret(request);
  if (denied) return denied;

  try {
    const searchParams = new URL(request.url).searchParams;
    const phone = normalizePhone(searchParams.get('phone'));

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'phone is required' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .update({
        is_active: false,
        last_interaction: new Date().toISOString(),
      })
      .eq('user_phone', phone)
      .select();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to deactivate session' },
      { status: 500 },
    );
  }
}