import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import type { Task } from '@/types';

// PATCH /api/tasks/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { title, description, is_completed } = body;

    const supabase = createAdminClient();

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (is_completed !== undefined) updateData.is_completed = is_completed;

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data as Task,
    });
  } catch (error: any) {
    console.error('PATCH /api/tasks error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('DELETE /api/tasks error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}