import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email } = body;

    // Se userId foi passado, buscar profile existente
    if (userId) {
      const { data: existing, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && existing) {
        return NextResponse.json({ success: true, data: existing });
      }
    }

    // Criar novo profile guest
    const linkCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        email: email || null,
        is_guest: !email, // se tem email, não é guest
        created_via: 'web',
        link_code: linkCode,
      })
      .select()
      .single();

    if (createError) {
      console.error('Create profile error:', createError);
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
    console.error('POST /api/profiles/current error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to get/create profile' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('GET /api/profiles/current error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}