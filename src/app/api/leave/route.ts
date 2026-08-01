import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: leaveRequests, error } = await supabase
      .from('leave_requests')
      .select('*, profiles(full_name, avatar_url, position)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({
        success: true,
        source: 'mock',
        data: [
          { id: '1', employee_id: 'e1', leave_type: 'Vacation', start_date: '2026-08-14', end_date: '2026-08-18', status: 'Approved', profile: { full_name: 'Alicia Chen' } },
          { id: '2', employee_id: 'e2', leave_type: 'Sick leave', start_date: '2026-08-17', end_date: '2026-08-17', status: 'Pending', profile: { full_name: 'Marcus Lee' } },
          { id: '3', employee_id: 'e3', leave_type: 'Personal', start_date: '2026-08-21', end_date: '2026-08-22', status: 'Review', profile: { full_name: 'Diana Ortiz' } },
        ],
      });
    }

    return NextResponse.json({ success: true, data: leaveRequests });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { employee_id, leave_type, start_date, end_date, reason } = body;

    if (!employee_id || !leave_type || !start_date || !end_date) {
      return NextResponse.json({ success: false, error: 'Missing required leave parameters' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .insert({
        employee_id,
        leave_type,
        start_date,
        end_date,
        reason: reason || null,
        status: 'Pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, status, reviewed_by } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Request id and status required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        status,
        reviewed_by: reviewed_by || null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
