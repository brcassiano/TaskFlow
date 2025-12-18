import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// helper para extrair o id da URL /api/tasks/:id
function getIdFromUrl(url: string): string | null {
  const u = new URL(url);
  const parts = u.pathname.split('/');
  // ['', 'api', 'tasks', ':id']
  return parts[3] ?? null;
}

// PATCH /api/tasks/[id]
export async function PATCH(request: NextRequest) {
  try {
    const id = getIdFromUrl(request.url);
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required in URL' },
        { status: 400 },
      );
    }

    const body = await request.json();
    console.log('PATCH /api/tasks/[id] - id, body:', id, body);

    if (!body.userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 },
      );
    }

    const allowedFields = [
      'title',
      'description',
      'is_completed',
      'updated_at',
    ] as const;

    const updateData: Record<string, any> = {};
    Object.keys(body).forEach((key) => {
      if (allowedFields.includes(key as any)) {
        updateData[key] = body[key];
      }
    });

    if (!updateData.updated_at) {
      updateData.updated_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', body.userId)
      .select()
      .single();

    if (error) {
      console.error('PATCH /api/tasks/[id] - error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    if (!data) {
      console.error(
        'PATCH /api/tasks/[id] - Task not found or not authorized',
      );
      return NextResponse.json(
        { success: false, error: 'Task not found or not authorized' },
        { status: 404 },
      );
    }

    console.log('PATCH /api/tasks/[id] - success, updated data:', data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('PATCH /api/tasks/[id] - exception:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 },
    );
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(request: NextRequest) {
  try {
    const id = getIdFromUrl(request.url);
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required in URL' },
        { status: 400 },
      );
    }

    const searchParams = new URL(request.url).searchParams;
    const userId = searchParams.get('userId');

    console.log('DELETE /api/tasks/[id] - id, userId:', id, userId);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('DELETE /api/tasks/[id] - error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    console.log('DELETE /api/tasks/[id] - success, deleted task:', id);
    return NextResponse.json({ success: true, data: id });
  } catch (error) {
    console.error('DELETE /api/tasks/[id] - exception:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete task' },
      { status: 500 },
    );
  }
}

// GET /api/tasks/[id]
export async function GET(request: NextRequest) {
  try {
    const id = getIdFromUrl(request.url);
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required in URL' },
        { status: 400 },
      );
    }

    const searchParams = new URL(request.url).searchParams;
    const userId = searchParams.get('userId');

    console.log('GET /api/tasks/[id] - id, userId:', id, userId);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('GET /api/tasks/[id] - error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    if (!data) {
      console.error(
        'GET /api/tasks/[id] - Task not found or not authorized',
      );
      return NextResponse.json(
        { success: false, error: 'Task not found or not authorized' },
        { status: 404 },
      );
    }

    console.log('GET /api/tasks/[id] - success, data:', data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/tasks/[id] - exception:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch task' },
      { status: 500 },
    );
  }
}