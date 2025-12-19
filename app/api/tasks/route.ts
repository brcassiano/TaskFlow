import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/tasks?userId=...
export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 },
    );
  }
}

// POST /api/tasks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Compat: aceita { userId } ou { user_id }
    const userId = body.userId ?? body.user_id;
    const title = body.title;
    const description = body.description ?? null;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 },
      );
    }

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { success: false, error: 'title is required' },
        { status: 400 },
      );
    }

    const insertPayload = {
      user_id: userId,
      title,
      description,
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(insertPayload)
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
      { success: false, error: 'Failed to create task' },
      { status: 500 },
    );
  }
}