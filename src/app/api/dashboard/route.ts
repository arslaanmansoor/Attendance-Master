import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Get total employees
    const { count: totalEmployees } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('role', ['employee', 'manager', 'admin'])
      .eq('employment_status', 'Active');

    // Get today's attendance
    const { data: todayAttendance } = await supabase
      .from('attendance_logs')
      .select('status')
      .eq('date', today);

    const presentToday = todayAttendance?.filter((a: any) => a.status === 'Present').length || 0;
    const absentToday = todayAttendance?.filter((a: any) => a.status === 'Absent').length || 0;
    const onLeaveToday = todayAttendance?.filter((a: any) => a.status === 'Leave' || a.status === 'Sick Leave').length || 0;

    // Get current month payroll total
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: payrollRuns } = await supabase
      .from('payroll_runs')
      .select('total_amount, period_start')
      .gte('period_start', currentMonth)
      .eq('status', 'Disbursed');

    const totalPayroll = payrollRuns?.reduce((sum: number, run: any) => sum + (run.total_amount || 0), 0) || 0;

    // Get monthly attendance stats
    const { data: monthAttendance } = await supabase
      .from('attendance_logs')
      .select('status, date')
      .gte('date', currentMonth);

    const monthlyPresent = monthAttendance?.filter((a: any) => a.status === 'Present').length || 0;
    const monthlyAbsent = monthAttendance?.filter((a: any) => a.status === 'Absent').length || 0;
    const monthlyLeave = monthAttendance?.filter((a: any) => a.status === 'Leave' || a.status === 'Sick Leave').length || 0;

    // Get recent activities
    const { data: recentActivities } = await supabase
      .from('system_activities')
      .select('action, details, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get recent attendance records
    const { data: recentAttendance } = await supabase
      .from('attendance_logs')
      .select(`
        date,
        profiles(id, full_name, employee_id),
        status,
        time_in,
        time_out
      `)
      .order('date', { ascending: false })
      .limit(5);

    return NextResponse.json({
      totalEmployees: totalEmployees || 0,
      presentToday,
      absentToday,
      onLeaveToday,
      totalPayroll,
      monthlyAttendance: {
        present: monthlyPresent,
        absent: monthlyAbsent,
        leave: monthlyLeave,
      },
      recentActivities: recentActivities || [],
      recentAttendance: recentAttendance || [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
