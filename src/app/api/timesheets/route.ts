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
    const project = searchParams.get('project');
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const employeeId = searchParams.get('employeeId');

    let query = supabase
      .from('attendance_logs')
      .select(`
        id,
        employee_id,
        profiles(id, employee_id, full_name, email),
        project_id,
        projects(name, code),
        date,
        day,
        time_in,
        time_out,
        break_hours,
        total_hours,
        regular_hours,
        overtime_hours,
        status,
        notes,
        created_at
      `);

    if (project && project !== 'All') {
      query = query.eq('projects.name', project);
    }

    if (status && status !== 'All') {
      query = query.eq('status', status);
    }

    if (date) {
      query = query.eq('date', date);
    }

    if (employeeId) {
      query = query.eq('profiles.employee_id', employeeId);
    }

    const { data: timesheets, error } = await query.order('date', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ timesheets });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      employee_id,
      project_id,
      date,
      time_in,
      time_out,
      break_hours,
      status,
      notes
    } = body;

    if (!employee_id || !date) {
      return NextResponse.json({ error: 'Employee ID and date are required' }, { status: 400 });
    }

    // Calculate day name
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[new Date(date).getDay()];

    // Check if it's a holiday
    const { data: holiday } = await supabase
      .from('holidays')
      .select('name')
      .eq('date', date)
      .single();

    // Check if it's Sunday (weekly holiday)
    const isSunday = dayName === 'Sunday';
    const isHoliday = holiday || isSunday;

    // Calculate hours
    let totalHours = 0;
    let regularHours = 0;
    let overtimeHours = 0;

    if (status === 'Present' && time_in && time_out) {
      const [h1, m1] = time_in.split(':').map(Number);
      const [h2, m2] = time_out.split(':').map(Number);
      let startMin = h1 * 60 + m1;
      let endMin = h2 * 60 + m2;
      if (endMin < startMin) endMin += 24 * 60;
      const grossHours = (endMin - startMin) / 60;
      totalHours = Math.max(0, grossHours - (break_hours || 0));
      regularHours = Math.min(8, totalHours);
      overtimeHours = Math.max(0, totalHours - regularHours);
    }

    // Adjust status if holiday
    const effectiveStatus = isHoliday && status === 'Present' ? 'Holiday' : status;
    const effectiveNotes = notes || (isHoliday ? (holiday?.name || 'Weekly Holiday') : '');

    // Check for duplicate entry
    const { data: existing } = await supabase
      .from('attendance_logs')
      .select('id')
      .eq('employee_id', employee_id)
      .eq('date', date)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Attendance record already exists for this date' }, { status: 400 });
    }

    const { data: newTimesheet, error } = await supabase
      .from('attendance_logs')
      .insert({
        employee_id,
        project_id,
        date,
        day: dayName,
        time_in: effectiveStatus === 'Present' ? time_in : null,
        time_out: effectiveStatus === 'Present' ? time_out : null,
        break_hours: effectiveStatus === 'Present' ? (break_hours || 1) : 0,
        total_hours: totalHours,
        regular_hours: regularHours,
        overtime_hours: overtimeHours,
        status: effectiveStatus,
        notes: effectiveNotes,
      })
      .select(`
        id,
        employee_id,
        profiles(id, employee_id, full_name),
        project_id,
        projects(name),
        date,
        day,
        time_in,
        time_out,
        break_hours,
        total_hours,
        regular_hours,
        overtime_hours,
        status,
        notes
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance recorded successfully',
      timesheet: newTimesheet,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      project_id,
      time_in,
      time_out,
      break_hours,
      status,
      notes
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Timesheet ID is required' }, { status: 400 });
    }

    // Get existing record to calculate hours
    const { data: existing } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
    }

    // Recalculate hours if status is Present
    let totalHours = existing.total_hours;
    let regularHours = existing.regular_hours;
    let overtimeHours = existing.overtime_hours;

    if (status === 'Present' && time_in && time_out) {
      const [h1, m1] = time_in.split(':').map(Number);
      const [h2, m2] = time_out.split(':').map(Number);
      let startMin = h1 * 60 + m1;
      let endMin = h2 * 60 + m2;
      if (endMin < startMin) endMin += 24 * 60;
      const grossHours = (endMin - startMin) / 60;
      totalHours = Math.max(0, grossHours - (break_hours || 0));
      regularHours = Math.min(8, totalHours);
      overtimeHours = Math.max(0, totalHours - regularHours);
    } else if (status !== 'Present') {
      totalHours = 0;
      regularHours = 0;
      overtimeHours = 0;
    }

    const { data: updatedTimesheet, error } = await supabase
      .from('attendance_logs')
      .update({
        project_id,
        time_in: status === 'Present' ? time_in : null,
        time_out: status === 'Present' ? time_out : null,
        break_hours: status === 'Present' ? (break_hours || 1) : 0,
        total_hours: totalHours,
        regular_hours: regularHours,
        overtime_hours: overtimeHours,
        status,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Timesheet updated successfully',
      timesheet: updatedTimesheet,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Timesheet ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('attendance_logs')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Timesheet deleted successfully',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
