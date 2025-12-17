import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

interface WebhookPayload {
  action: 'create' | 'list' | 'complete' | 'delete';
  user_email: string;
  task_title?: string;
  task_description?: string;
  task_id?: string;
}

// POST /api/webhook
export async function POST(req: NextRequest) {
  try {
    // 1. Verificar secret (segurança básica)
    const secret = req.headers.get('x-webhook-secret');
    if (secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: WebhookPayload = await req.json();
    const { action, user_email, task_title, task_description, task_id } = body;

    console.log('Webhook received:', { action, user_email });

    const supabase = createAdminClient();

    // 2. Buscar usuário por email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', user_email)
      .single();

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = profile.id;
    let result: any;

    // 3. Executar ação
    switch (action) {
      case 'create':
        if (!task_title) {
          return NextResponse.json(
            { success: false, error: 'task_title required' },
            { status: 400 }
          );
        }

        const { data: newTask, error: createError } = await supabase
          .from('tasks')
          .insert({
            user_id: userId,
            title: task_title,
            description: task_description || null,
          })
          .select()
          .single();

        if (createError) throw createError;
        result = { task: newTask, message: `Task created: "${task_title}"` };
        break;

      case 'list':
        const { data: tasks, error: listError } = await supabase
          .from('tasks')
          .select('id, title, is_completed, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (listError) throw listError;

        const pending = tasks?.filter(t => !t.is_completed) || [];
        const completed = tasks?.filter(t => t.is_completed) || [];

        result = {
          total: tasks?.length || 0,
          pending: pending.length,
          completed: completed.length,
          tasks: tasks,
          message: `You have ${pending.length} pending and ${completed.length} completed tasks.`
        };
        break;

      case 'complete':
        if (!task_id) {
          return NextResponse.json(
            { success: false, error: 'task_id required' },
            { status: 400 }
          );
        }

        const { data: completedTask, error: completeError } = await supabase
          .from('tasks')
          .update({ is_completed: true })
          .eq('id', task_id)
          .eq('user_id', userId)
          .select()
          .single();

        if (completeError) throw completeError;
        result = { task: completedTask, message: `Task completed: "${completedTask.title}"` };
        break;

      case 'delete':
        if (!task_id) {
          return NextResponse.json(
            { success: false, error: 'task_id required' },
            { status: 400 }
          );
        }

        // Buscar título antes de deletar
        const { data: taskToDelete } = await supabase
          .from('tasks')
          .select('title')
          .eq('id', task_id)
          .eq('user_id', userId)
          .single();

        const { error: deleteError } = await supabase
          .from('tasks')
          .delete()
          .eq('id', task_id)
          .eq('user_id', userId);

        if (deleteError) throw deleteError;
        result = { 
          deleted: true, 
          message: `Task deleted: "${taskToDelete?.title || 'Unknown'}"` 
        };
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET /api/webhook (para testar se está funcionando)
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Webhook endpoint is ready',
    actions: ['create', 'list', 'complete', 'delete'],
  });
}