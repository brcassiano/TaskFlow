import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

function normalizePhone(input: string) {
  const p = String(input || '').trim();
  if (!p) return '';
  return p.includes('@s.whatsapp.net') ? p : `${p}@s.whatsapp.net`;
}

// GET /api/link?phone=...  -> retorna [] ou [..]
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const phone = normalizePhone(searchParams.get('phone') || '');

    if (!phone) {
      return NextResponse.json({ success: false, error: 'phone is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('user_links')
      .select('id, guest_id, phone')
      .eq('phone', phone)
      .limit(1);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }); // [] = não vinculado; [..] = vinculado
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to check link' }, { status: 500 });
  }
}

// POST /api/link  body: { phone: "...", code: "XXXXXXXX" }
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();

    const phone = normalizePhone(body?.phone || '');
    const code = String(body?.code || '').trim().toUpperCase();

    if (!phone) {
      return NextResponse.json({ success: false, error: 'phone is required' }, { status: 400 });
    }
    if (!code) {
      return NextResponse.json({ success: false, error: 'code is required' }, { status: 400 });
    }

    // 1) Achar o guest_id que termina com o code
    const { data: found, error: findError } = await supabase
      .from('user_links')
      .select('*')
      .ilike('guest_id', `%${code}`)
      .limit(1);

    if (findError) {
      return NextResponse.json({ success: false, error: findError.message }, { status: 400 });
    }
    if (!found || found.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid code' }, { status: 404 });
    }

    const guestId = found[0].guest_id as string;
    const now = new Date().toISOString();

    // 2) Evita conflito do UNIQUE(phone): remove qualquer linha antiga desse phone (se existir)
    await supabase.from('user_links').delete().eq('phone', phone).neq('guest_id', guestId);

    // 3) Upsert pelo guest_id (UNIQUE guest_id)
    const { data: linked, error: linkError } = await supabase
      .from('user_links')
      .upsert({ guest_id: guestId, phone, updated_at: now }, { onConflict: 'guest_id' })
      .select()
      .single();

    if (linkError) {
      return NextResponse.json({ success: false, error: linkError.message }, { status: 400 });
    }

    // 4) (Opcional) Migrar tasks guest -> phone (mantenha se tasks.user_id for text e compatível)
    const { error: migrateError } = await supabase
      .from('tasks')
      .update({ user_id: phone })
      .eq('user_id', guestId);

    if (migrateError) {
      return NextResponse.json({ success: true, data: linked, warning: migrateError.message });
    }

    return NextResponse.json({ success: true, data: linked });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to link account' }, { status: 500 });
  }
}