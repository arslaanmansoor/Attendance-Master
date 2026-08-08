import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const employeeId = searchParams.get('employeeId');

    let query = supabase
      .from('attendance_logs')
      .select('*, profiles(full_name, avatar_url, role, position, employee_id)')
      .eq('date', date);

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    const { data: logs, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('GET /api/attendance error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: logs || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('GET /api/attendance error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { employee_id, date, time_in, time_out, break_hours, status, notes, project_id } = body;

    if (!employee_id) {
      return NextResponse.json({ error: 'employee_id is required' }, { status: 400 });
    }

    const attendanceDate = date || new Date().toISOString().split('T')[0];

    // Check if attendance record already exists for this employee and date
    const { data: existing, error: checkError } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('employee_id', employee_id)
      .eq('date', attendanceDate)
      .maybeSingle();

    if (checkError) {
      console.error('POST /api/attendance check error:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (existing) {
      // Update existing record
      const updateData: any = {
        time_in: time_in || existing.time_in,
        time_out: time_out || existing.time_out,
        break_hours: break_hours ?? existing.break_hours,
        status: status || existing.status,
        notes: notes || existing.notes,
        project_id: project_id || existing.project_id,
        updated_at: new Date().toISOString(),
      };

      // Calculate hours if both time_in and time_out are provided
      if (updateData.time_in && updateData.time_out) {
        const totalMinutes = calculateTimeDifference(updateData.time_in, updateData.time_out);
        const breakMinutes = (updateData.break_hours || 1) * 60;
        const netMinutes = Math.max(0, totalMinutes - breakMinutes);
        
        updateData.total_hours = parseFloat((netMinutes / 60).toFixed(2));
        updateData.regular_hours = Math.min(updateData.total_hours, 9); // 9-hour workday
        updateData.overtime_hours = Math.max(0, updateData.total_hours - 9);
      }

      const { data: updated, error: updateError } = await supabase
        .from('attendance_logs')
        .update(updateData)
        .eq('id', existing.id)
        .select('*, profiles(full_name, avatar_url, role, position)')
        .single();

      if (updateError) {
        console.error('POST /api/attendance update error:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: updated, action: 'updated' });
    } else {
      // Create new record
      const insertData: any = {
        employee_id,
        date: attendanceDate,
        time_in: time_in || new Date().toTimeString().slice(0, 5),
        time_out: time_out || null,
        break_hours: break_hours || 1,
        status: status || 'Present',
        notes: notes || null,
        project_id: project_id || null,
        day: new Date(attendanceDate).toLocaleDateString('en-US', { weekday: 'long' }),
      };

      // Calculate hours if both time_in and time_out are provided
      if (insertData.time_in && insertData.time_out) {
        const totalMinutes = calculateTimeDifference(insertData.time_in, insertData.time_out);
        const breakMinutes = (insertData.break_hours || 1) * 60;
        const netMinutes = Math.max(0, totalMinutes - breakMinutes);
        
        insertData.total_hours = parseFloat((netMinutes / 60).toFixed(2));
        insertData.regular_hours = Math.min(insertData.total_hours, 9);
        insertData.overtime_hours = Math.max(0, insertData.total_hours - 9);
      }

      const { data: created, error: insertError } = await supabase
        .from('attendance_logs')
        .insert(insertData)
        .select('*, profiles(full_name, avatar_url, role, position)')
        .single();

      if (insertError) {
        console.error('POST /api/attendance insert error:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: created, action: 'created' });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('POST /api/attendance error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Helper function to calculate time difference in minutes
function calculateTimeDifference(timeIn: string, timeOut: string): number {
  const [inHours, inMinutes] = timeIn.split(':').map(Number);
  const [outHours, outMinutes] = timeOut.split(':').map(Number);
  
  const inDate = new Date();
  inDate.setHours(inHours, inMinutes, 0, 0);
  
  const outDate = new Date();
  outDate.setHours(outHours, outMinutes, 0, 0);
  
  const diffMs = outDate.getTime() - inDate.getTime();
  return Math.floor(diffMs / 60000); // Convert to minutes
}
