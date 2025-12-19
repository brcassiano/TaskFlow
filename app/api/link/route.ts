import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function normalizePhone(input?: string | null): string | null {
  const p = String(input ?? '').trim();
  if (!p) return null;
  return p.includes('@s.whatsapp.net') ? p : `${p}@s.whatsapp.net`;
}

// POST /api/link - Vincular WhatsApp ao perfil web via código
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'phone and code are required' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);

    console.log('POST /api/link - received:', { phone: normalizedPhone, code });

    // 1. Buscar profile web pelo código
    const { data: webProfile, error: webError } = await supabase
      .from('profiles')
      .select('*')
      .eq('link_code', code.toUpperCase())
      .single();

    if (webError || !webProfile) {
      console.error('POST /api/link - Invalid code:', code, webError);
      return NextResponse.json(
        { error: 'Invalid or expired link code' },
        { status: 404 }
      );
    }

    console.log('POST /api/link - Found web profile:', webProfile.id);

    // 2. Buscar profile do WhatsApp pelo phone
    const { data: whatsappProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    console.log('POST /api/link - WhatsApp profile:', whatsappProfile?.id || 'not found');

    // 3. Se WhatsApp profile existe
    if (whatsappProfile) {
      // 3a. Se já está vinculado a outro profile, erro
      if (!whatsappProfile.is_guest && whatsappProfile.id !== webProfile.id) {
        return NextResponse.json(
          { error: 'This WhatsApp number is already linked to another account' },
          { status: 409 }
        );
      }

      // 3b. Migrar tasks do WhatsApp profile para web profile
      const { error: migrateError } = await supabase
        .from('tasks')
        .update({ user_id: webProfile.id })
        .eq('user_id', whatsappProfile.id);

      if (migrateError) {
        console.error('POST /api/link - Task migration error:', migrateError);
      } else {
        console.log('POST /api/link - Tasks migrated from', whatsappProfile.id, 'to', webProfile.id);
      }

      // 3c. Deletar profile guest do WhatsApp
      await supabase
        .from('profiles')
        .delete()
        .eq('id', whatsappProfile.id);

      console.log('POST /api/link - Deleted WhatsApp guest profile:', whatsappProfile.id);
    }

    // 4. Atualizar web profile com telefone
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        phone: normalizedPhone,
        is_guest: false,
        link_code: null, // invalidar código usado
      })
      .eq('id', webProfile.id);

    if (updateError) {
      console.error('POST /api/link - Update profile error:', updateError);
      return NextResponse.json(
        { error: 'Failed to link account', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('POST /api/link - Successfully linked:', webProfile.id, normalizedPhone);

    return NextResponse.json({
      success: true,
      message: 'Account linked successfully',
      data: {
        profileId: webProfile.id,
        phone: normalizedPhone,
      },
    });
  } catch (error) {
    console.error('POST /api/link - Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/link?phone=WHATSAPP_NUMBER - Checar status de vinculação
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const phone = normalizePhone(searchParams.get('phone'));

    if (!phone) {
      return NextResponse.json(
        { error: 'phone query parameter is required' },
        { status: 400 }
      );
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, phone, is_guest, created_via')
      .eq('phone', phone)
      .maybeSingle();

    if (error) {
      console.error('GET /api/link - Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (profile) {
      return NextResponse.json({
        success: true,
        data: {
          linked: !profile.is_guest,
          profileId: profile.id,
          phone: profile.phone,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        linked: false,
        phone,
        message: 'Phone not registered yet',
      },
    });
  } catch (error) {
    console.error('GET /api/link - Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}