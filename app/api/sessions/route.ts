import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

function normalizePhone(input: string) {
  const p = String(input || '').trim();
  if (!p) return '';
  return p.includes('@s.whatsapp.net') ? p : `${p}@s.whatsapp.net`;
}

function assertSecret(req: NextRequest) {
  const required = process.env.TASKFLOW_API_SECRET;
  if (!required) return null; // sem secret configurado, não bloqueia
  const got = req.headers.get('x-taskflow-secret');
  if (got !== required) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

// GET /api/sessions?phone=xxxx@s.whatsapp.net  -> retorna [] ou [session]
export async function GET(request: NextRequest) {
  const denied = assertSecret(request);
  if (denied) return denied;

  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const phone = normalizePhone(searchParams.get('phone') || '');

    if (!phone) {
      return NextResponse.json({ success: false, error: 'phone is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_phone', phone)
      .eq('is_active', true)
      .limit(1);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to check session' }, { status: 500 });
  }
}

// POST /api/sessions  body: { phone: "...@s.whatsapp.net", context?: {...} }
export async function POST(request: NextRequest) {
  const denied = assertSecret(request);
  if (denied) return denied;

  try {
    const supabase = createServerClient();
    const body = await request.json();

    const phone = normalizePhone(body?.phone || '');
    if (!phone) {
      return NextResponse.json({ success: false, error: 'phone is required' }, { status: 400 });
    }

    const payload: any = {
      user_phone: phone,
      is_active: true,
      last_interaction: new Date().toISOString(),
    };

    // Se você quiser setar/zerar contexto quando ativa:
    if (body && Object.prototype.hasOwnProperty.call(body, 'context')) {
      payload.context = body.context ?? {};
    }

    // Requer UNIQUE (user_phone) => você tem (chat_sessions_user_phone_key)
    const { data, error } = await supabase
      .from('chat_sessions')
      .upsert(payload, { onConflict: 'user_phone' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to create session' }, { status: 500 });
  }
}

// DELETE /api/sessions?phone=...  (marca is_active=false)
export async function DELETE(request: NextRequest) {
  const denied = assertSecret(request);
  if (denied) return denied;

  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const phone = normalizePhone(searchParams.get('phone') || '');

    if (!phone) {
      return NextResponse.json({ success: false, error: 'phone is required' }, { status: 400 });
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
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to deactivate session' }, { status: 500 });
  }
}