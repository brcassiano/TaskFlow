import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// PATCH - Update task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;
    const body = await request.json();

    console.log('PATCH /api/tasks/[id] - id:', id, 'body:', body);

    // Validar que tem user_id no body
    if (!body.user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Sanitizar body - só permitir certos campos
    const allowedFields = [
      'title',
      'description',
      'is_completed',
      'iscompleted',
      'updated_at',
    ];
    const updateData: Record<string, any> = {};

    Object.keys(body).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateData[key] = body[key];
      }
    });

    // Adicionar updated_at se não tiver
    if (!updateData.updated_at) {
      updateData.updated_at = new Date().toISOString();
    }

    console.log('PATCH /api/tasks/[id] - updateData:', updateData);

    // Atualizar apenas se o user_id bater (validar ownership)
    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', body.user_id)
      .select()
      .single();

    if (error) {
      console.error('PATCH /api/tasks/[id] - error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    if (!data) {
      console.error('PATCH /api/tasks/[id] - Task not found or not authorized');
      return NextResponse.json(
        { success: false, error: 'Task not found or not authorized' },
        { status: 404 }
      );
    }

    console.log('PATCH /api/tasks/[id] - success, updated data:', data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('PATCH /api/tasks/[id] - exception:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    console.log('DELETE /api/tasks/[id] - id:', id, 'user_id:', userId);

    // Validar que tem user_id
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Deletar apenas se o user_id bater (validar ownership)
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('DELETE /api/tasks/[id] - error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    console.log('DELETE /api/tasks/[id] - success, deleted task:', id);
    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error('DELETE /api/tasks/[id] - exception:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}

// GET - Get single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    console.log('GET /api/tasks/[id] - id:', id, 'user_id:', userId);

    // Validar que tem user_id
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Buscar apenas se o user_id bater (validar ownership)
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
        { status: 400 }
      );
    }

    if (!data) {
      console.error('GET /api/tasks/[id] - Task not found or not authorized');
      return NextResponse.json(
        { success: false, error: 'Task not found or not authorized' },
        { status: 404 }
      );
    }

    console.log('GET /api/tasks/[id] - success, data:', data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/tasks/[id] - exception:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}