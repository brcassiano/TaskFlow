import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import type { Task } from '@/types';

// GET /api/tasks?user_id=xxx
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('user_id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data as Task[],
    });
  } catch (error: any) {
    console.error('GET /api/tasks error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/tasks
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, title, description } = body;

    if (!user_id || !title) {
      return NextResponse.json(
        { success: false, error: 'user_id and title are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id,
        title: title.trim(),
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { success: true, data: data as Task },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/tasks error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}