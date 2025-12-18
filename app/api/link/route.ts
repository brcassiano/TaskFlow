import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/link
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'phone and code are required' },
        { status: 400 },
      );
    }

    // Step 1: Find task by code (partial UUID match)
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, user_id, title')
      .ilike('id', `%${code}%`)
      .maybeSingle();

    if (taskError) {
      console.error('Task search error:', taskError);
      return NextResponse.json(
        { error: 'Failed to search tasks', details: taskError.message },
        { status: 500 },
      );
    }

    if (!task) {
      return NextResponse.json(
        {
          error: 'Task code not found',
          hint: 'Code must be part of a task UUID',
        },
        { status: 404 },
      );
    }

    // Step 2: Get guestId from task
    const guestId = task.user_id;

    // Step 3: Check if link already exists
    const {
      data: existingLink,
      error: checkError,
    } = await supabase
      .from('userLinks')
      .select('*')
      .eq('guestId', guestId)
      .maybeSingle();

    if (checkError) {
      console.error('Check existing link error:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing links', details: checkError.message },
        { status: 500 },
      );
    }

    // Step 4: Update or insert userLinks
    if (existingLink) {
      const { error: updateError } = await supabase
        .from('userLinks')
        .update({
          phone,
          updatedAt: new Date().toISOString(),
        })
        .eq('guestId', guestId);

      if (updateError) {
        console.error('Update link error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update link', details: updateError.message },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Account link updated successfully',
        data: {
          phone,
          guestId,
          taskId: task.id,
          action: 'updated',
        },
      });
    }

    const { error: insertError } = await supabase
      .from('userLinks')
      .insert({ guestId, phone });

    if (insertError) {
      console.error('Insert link error:', insertError);

      if (insertError.code === '23505') {
        return NextResponse.json(
          {
            error: 'Phone already linked to another account',
            code: insertError.code,
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { error: 'Failed to create link', details: insertError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Account linked successfully',
      data: {
        phone,
        guestId,
        taskId: task.id,
        action: 'created',
      },
    });
  } catch (error) {
    console.error('Link POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 },
    );
  }
}

// GET /api/link?phone=WHATSAPP_NUMBER
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json(
        { error: 'phone query parameter is required' },
        { status: 400 },
      );
    }

    const {
      data: links,
      error,
    } = await supabase
      .from('userLinks')
      .select('guestId, phone, isActive, createdAt, updatedAt')
      .eq('phone', phone);

    if (error) {
      console.error('Link GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (links && links.length > 0) {
      const link = links[0];

      const {
        data: tasks,
        error: tasksError,
      } = await supabase
        .from('tasks')
        .select('id, title, is_completed, created_at')
        .eq('user_id', link.guestId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (tasksError) {
        console.error('Tasks fetch error:', tasksError);
        return NextResponse.json(
          { error: tasksError.message },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          ...link,
          linked: true,
          recentTasks: tasks ?? [],
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        phone,
        linked: false,
        message:
          'Phone not linked yet. Send link CODE to link your account',
      },
    });
  } catch (error) {
    console.error('Link GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 },
    );
  }
}

// DELETE /api/link?phone=... OR ?guestId=...
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const phone = searchParams.get('phone');
    const guestId = searchParams.get('guestId');

    if (!phone && !guestId) {
      return NextResponse.json(
        { error: 'Either phone or guestId query parameter is required' },
        { status: 400 },
      );
    }

    let query = supabase.from('userLinks').delete();

    if (phone) {
      query = query.eq('phone', phone);
    } else if (guestId) {
      query = query.eq('guestId', guestId);
    }

    const { error } = await query;

    if (error) {
      console.error('Link DELETE error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Link removed successfully',
    });
  } catch (error) {
    console.error('Link DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 },
    );
  }
}