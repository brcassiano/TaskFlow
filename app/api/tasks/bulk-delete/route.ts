import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // mesmo import usado nos outros routes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // aceita tanto userId quanto user_id
    const userId: string | undefined = body.userId ?? body.user_id;
    const ids: string[] | undefined = body.ids;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 },
      );
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ids must be a non-empty array' },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .in('id', ids)
      .eq('user_id', userId);

    if (error) {
      console.error('POST /api/tasks/bulk-delete - error', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    console.log(
      'POST /api/tasks/bulk-delete - success, deleted ids:',
      ids,
      'for user:',
      userId,
    );

    return NextResponse.json(
      { success: true, data: { ids, userId } },
      { status: 200 },
    );
  } catch (err) {
    console.error('POST /api/tasks/bulk-delete - exception', err);
    return NextResponse.json(
      { success: false, error: 'Failed to bulk delete tasks' },
      { status: 500 },
    );
  }
}