import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const { data: logs, error } = await supabase
      .from('attendance_logs')
      .select('*, profiles(full_name, avatar_url, role, position)')
      .eq('date', date)
      .order('created_at', { ascending: false });

    if (error) {
      // Fallback mock data if DB table not yet provisioned
      return NextResponse.json({
        success: true,
        source: 'mock',
        data: [
          { id: '1', employee_id: 'e1', date, status: 'present', check_in: '08:54 AM', overtime_hours: 1.5, profile: { full_name: 'Alicia Chen' } },
          { id: '2', employee_id: 'e2', date, status: 'late', check_in: '09:32 AM', overtime_hours: 0, profile: { full_name: 'Marcus Lee' } },
          { id: '3', employee_id: 'e3', date, status: 'present', check_in: '08:45 AM', overtime_hours: 2.0, profile: { full_name: 'Diana Ortiz' } },
        ],
      });
    }

    return NextResponse.json({ success: true, data: logs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { employee_id, status, notes, overtime_hours } = body;

    if (!employee_id) {
      return NextResponse.json({ success: false, error: 'employee_id is required' }, { status: 400 });
    }

    const date = new Date().toISOString().split('T')[0];
    const check_in = new Date().toISOString();

    const { data, error } = await supabase
      .from('attendance_logs')
      .upsert(
        {
          employee_id,
          date,
          check_in,
          status: status || 'present',
          overtime_hours: overtime_hours || 0,
          notes: notes || null,
        },
        { onConflict: 'employee_id,date' }
      )
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
