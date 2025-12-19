import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function normalizePhone(input?: string | null): string | null {
  const p = String(input ?? '').trim();
  if (!p) return null;
  return p.includes('@s.whatsapp.net') ? p : `${p}@s.whatsapp.net`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'phone is required' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);

    // Buscar profile existente
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, data: existing });
    }

    // Criar novo profile guest WhatsApp
    const linkCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        phone: normalizedPhone,
        is_guest: true,
        created_via: 'whatsapp',
        link_code: linkCode,
      })
      .select()
      .single();

    if (createError) {
      console.error('Create WhatsApp profile error:', createError);
      return NextResponse.json(
        { success: false, error: createError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, data: newProfile },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/profiles/whatsapp error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create WhatsApp profile' },
      { status: 500 }
    );
  }
}