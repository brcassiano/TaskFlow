import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

function normalizePhone(input: string) {
  const p = String(input || '').trim();
  return p;
}

// GET - Check link status
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const phone = normalizePhone(searchParams.get('phone') || '');

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'phone is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('user_links')
      .select('*')
      .eq('phone', phone);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    console.log('GET /api/link - phone:', phone, 'data:', data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/link error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check link status' },
      { status: 500 }
    );
  }
}

// POST - Create or update link
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();

    const phone = normalizePhone(body?.phone || '');
    const code = String(body?.code || '').trim().toUpperCase();

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'phone is required' },
        { status: 400 }
      );
    }

    if (!code || code.length < 4) {
      return NextResponse.json(
        { success: false, error: 'code is required' },
        { status: 400 }
      );
    }

    console.log('POST /api/link - phone:', phone, 'code:', code);

    // 1) Procura guest_id que termina com o code na tabela user_links
    const { data: found, error: findError } = await supabase
      .from('user_links')
      .select('*')
      .ilike('guest_id', `%${code}`)
      .limit(1);

    if (findError) {
      return NextResponse.json(
        { success: false, error: findError.message },
        { status: 400 }
      );
    }

    let guestId: string;

    // 2) Se não achou em user_links, procura em tasks (o user_id que contém o code)
    if (!found || found.length === 0) {
      console.log('Not found in user_links, searching in tasks...');
      
      const { data: tasksWithCode, error: taskFindError } = await supabase
        .from('tasks')
        .select('user_id')
        .ilike('user_id', `%${code}%`)
        .limit(1);

      if (taskFindError) {
        return NextResponse.json(
          { success: false, error: taskFindError.message },
          { status: 400 }
        );
      }

      if (!tasksWithCode || tasksWithCode.length === 0) {
        // Se não achou em nenhum lugar, cria novo
        const newGuestId = `guest-${code}`;

        const { data: created, error: createError } = await supabase
          .from('user_links')
          .insert({ guest_id: newGuestId, phone })
          .select()
          .single();

        if (createError) {
          return NextResponse.json(
            { success: false, error: createError.message },
            { status: 400 }
          );
        }

        guestId = newGuestId;
        console.log('Created new guest link:', newGuestId, 'for phone:', phone);
        
        return NextResponse.json(
          { success: true, data: created, action: 'created' },
          { status: 201 }
        );
      }

      // Achou em tasks! Use esse user_id
      guestId = tasksWithCode[0].user_id;
      console.log('Found guest in tasks:', guestId);

      // Criar entry em user_links
      const { data: created, error: createError } = await supabase
        .from('user_links')
        .insert({ guest_id: guestId, phone })
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { success: false, error: createError.message },
          { status: 400 }
        );
      }

      console.log('Created user_link for existing guest:', guestId);
      return NextResponse.json(
        { success: true, data: created, action: 'created' },
        { status: 201 }
      );
    }

    // 3) Se achou em user_links, atualizar o phone
    const existingGuestId = found[0].guest_id as string;
    const now = new Date().toISOString();

    // Deletar antigos links desse phone
    await supabase
      .from('user_links')
      .delete()
      .eq('phone', phone)
      .neq('guest_id', existingGuestId);

    // Atualizar com o novo phone
    const { data: linked, error: linkError } = await supabase
      .from('user_links')
      .update({ 
        phone,
        updated_at: now 
      })
      .eq('guest_id', existingGuestId)
      .select()
      .single();

    if (linkError) {
      return NextResponse.json(
        { success: false, error: linkError.message },
        { status: 400 }
      );
    }

    if (!linked) {
      return NextResponse.json(
        { success: false, error: 'Failed to link account' },
        { status: 400 }
      );
    }

    console.log('Updated user_link:', existingGuestId, 'to phone:', phone);
    return NextResponse.json(
      { success: true, data: linked, action: 'linked' },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/link error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to link account' },
      { status: 500 }
    );
  }
}