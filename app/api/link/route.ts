import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

function normalizePhone(input: string) {
  const p = String(input || '').trim();
  return p;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();

    const phone = normalizePhone(body?.phone || '');
    const code = String(body?.code || '').trim().toUpperCase();

    if (!phone) {
      return NextResponse.json({ success: false, error: 'phone is required' }, { status: 400 });
    }
    if (!code || code.length < 4) {
      return NextResponse.json({ success: false, error: 'code is required' }, { status: 400 });
    }

    // 1) Procura guest_id que termina com o code
    const { data: found, error: findError } = await supabase
      .from('user_links')
      .select('*')
      .ilike('guest_id', `%${code}`)
      .limit(1);

    if (findError) {
      return NextResponse.json({ success: false, error: findError.message }, { status: 400 });
    }

    let guestId: string;

    // 2) Se não achou, cria uma nova entry com guest_id = guest-{code}
    if (!found || found.length === 0) {
      const newGuestId = `guest-${code}`;
      
      const { data: created, error: createError } = await supabase
        .from('user_links')
        .insert({ guest_id: newGuestId, phone })
        .select()
        .single();

      if (createError) {
        return NextResponse.json({ success: false, error: createError.message }, { status: 400 });
      }

      guestId = newGuestId;
      
      // Migrar tasks do guest para o phone
      await supabase.from('tasks').update({ user_id: phone }).eq('user_id', newGuestId);

      return NextResponse.json({ success: true, data: created, action: 'created' });
    }

    // 3) Se achou, faz o upsert normal (atualiza o phone)
    const existingGuestId = found[0].guest_id as string;
    const now = new Date().toISOString();

    // Limpa qualquer phone antigo conflitante
    await supabase.from('user_links').delete().eq('phone', phone).neq('guest_id', existingGuestId);

    const { data: linked, error: linkError } = await supabase
      .from('user_links')
      .upsert({ guest_id: existingGuestId, phone, updated_at: now }, { onConflict: 'guest_id' })
      .select()
      .single();

    if (linkError) {
      return NextResponse.json({ success: false, error: linkError.message }, { status: 400 });
    }

    // Migrar tasks
    await supabase.from('tasks').update({ user_id: phone }).eq('user_id', existingGuestId);

    return NextResponse.json({ success: true, data: linked, action: 'linked' });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to link account' }, { status: 500 });
  }
}