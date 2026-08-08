import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Payroll calculation utility
function calculatePayroll(
  baseSalary: number,
  hourlyRate: number,
  regularHours: number,
  overtimeHours: number,
  overtimeRate: number = 1.25,
  allowances: number = 0,
  bonuses: number = 0,
  deductions: number = 0,
  advances: number = 0,
  leaveDeductions: number = 0
) {
  const overtimePay = overtimeHours * hourlyRate * overtimeRate;
  const regularPay = regularHours * hourlyRate;
  const grossPay = baseSalary + regularPay + overtimePay + allowances + bonuses;
  const netPay = grossPay - deductions - advances - leaveDeductions;

  return {
    base_salary: baseSalary,
    hourly_rate: hourlyRate,
    normal_hours: regularHours,
    overtime_hours: overtimeHours,
    overtime_rate: overtimeRate,
    overtime_pay: overtimePay,
    allowances,
    bonuses,
    deductions,
    advances,
    leave_deductions: leaveDeductions,
    net_salary: netPay,
  };
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const payrollRunId = searchParams.get('payrollRunId');
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');

    if (payrollRunId) {
      // Get payroll items for a specific run
      let query = supabase
        .from('payroll_items')
        .select(`
          id,
          payroll_run_id,
          employee_id,
          profiles(id, employee_id, full_name, email, position, departments(name)),
          base_salary,
          hourly_rate,
          normal_hours,
          overtime_hours,
          overtime_rate,
          overtime_pay,
          allowances,
          bonuses,
          deductions,
          advances,
          leave_deductions,
          net_salary,
          status,
          created_at
        `)
        .eq('payroll_run_id', payrollRunId);

      if (status && status !== 'All') {
        query = query.eq('status', status);
      }

      const { data: payrollItems, error } = await query.order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ payrollItems });
    } else if (employeeId) {
      // Get payroll history for a specific employee
      const { data: payrollItems, error } = await supabase
        .from('payroll_items')
        .select(`
          id,
          payroll_run_id,
          payroll_runs(title, period_start, period_end, status),
          base_salary,
          overtime_pay,
          allowances,
          deductions,
          advances,
          leave_deductions,
          net_salary,
          status,
          created_at
        `)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ payrollItems });
    } else {
      // Get all payroll runs
      const { data: payrollRuns, error } = await supabase
        .from('payroll_runs')
        .select(`
          id,
          title,
          period_start,
          period_end,
          total_amount,
          total_employees,
          status,
          approved_by,
          profiles(id, full_name),
          approved_at,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ payrollRuns });
    }
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
      .select('role, company_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, period_start, period_end, generateForAll } = body;

    if (!title || !period_start || !period_end) {
      return NextResponse.json({ error: 'Title, period start, and period end are required' }, { status: 400 });
    }

    // Create payroll run
    const { data: payrollRun, error: runError } = await supabase
      .from('payroll_runs')
      .insert({
        title,
        period_start,
        period_end,
        status: 'Draft',
        total_amount: 0,
        total_employees: 0,
      })
      .select()
      .single();

    if (runError) {
      console.error('POST /api/payroll run error:', runError);
      return NextResponse.json({ error: runError.message }, { status: 500 });
    }

    // Get all active employees from the same company (tenant isolation)
    let employeesQuery = supabase
      .from('profiles')
      .select('id, employee_id, full_name, basic_salary, hourly_rate, position, department_id, company_id')
      .eq('employment_status', 'Active')
      .in('role', ['employee', 'manager']);

    // Apply company filter if user has a company
    if (profile.company_id) {
      employeesQuery = employeesQuery.eq('company_id', profile.company_id);
    }

    const { data: employees, error: empError } = await employeesQuery;

    if (empError) {
      console.error('POST /api/payroll employees error:', empError);
      return NextResponse.json({ error: empError.message }, { status: 500 });
    }

    if (!employees || employees.length === 0) {
      return NextResponse.json({ error: 'No active employees found' }, { status: 400 });
    }

    // Generate payroll items for each employee
    const payrollItems = [];
    let totalAmount = 0;

    for (const employee of employees) {
      // Get attendance records for the period
      const { data: attendance } = await supabase
        .from('attendance_logs')
        .select('total_hours, regular_hours, overtime_hours, status')
        .eq('employee_id', employee.id)
        .gte('date', period_start)
        .lte('date', period_end);

      const totalRegularHours = attendance?.reduce((sum: number, a: any) => sum + (a.regular_hours || 0), 0) || 0;
      const totalOvertimeHours = attendance?.reduce((sum: number, a: any) => sum + (a.overtime_hours || 0), 0) || 0;
      const absentDays = attendance?.filter((a: any) => a.status === 'Absent').length || 0;

      // Use actual employee salary data - no hardcoded assumptions
      const baseSalary = employee.basic_salary || 0;
      const hourlyRate = employee.hourly_rate || (baseSalary > 0 ? baseSalary / 208 : 0); // 208 hours/month fallback
      
      // Calculate payroll using centralized utility
      const payrollCalc = calculatePayroll(
        baseSalary,
        hourlyRate,
        totalRegularHours,
        totalOvertimeHours,
        1.25, // Default overtime rate (should be configurable per company/employee)
        0, // Allowances - should be configurable per employee
        0, // Bonuses - should be configurable per employee
        0, // Deductions - should be configurable per employee
        0, // Advances - should be configurable per employee
        absentDays * (baseSalary / 26) // Leave deductions for absent days
      );

      const { data: payrollItem } = await supabase
        .from('payroll_items')
        .insert({
          payroll_run_id: payrollRun.id,
          employee_id: employee.id,
          base_salary: payrollCalc.base_salary,
          hourly_rate: payrollCalc.hourly_rate,
          normal_hours: payrollCalc.normal_hours,
          overtime_hours: payrollCalc.overtime_hours,
          overtime_rate: payrollCalc.overtime_rate,
          overtime_pay: payrollCalc.overtime_pay,
          allowances: payrollCalc.allowances,
          bonuses: payrollCalc.bonuses,
          deductions: payrollCalc.deductions,
          advances: payrollCalc.advances,
          leave_deductions: payrollCalc.leave_deductions,
          net_salary: payrollCalc.net_salary,
          status: 'Pending',
        })
        .select()
        .single();

      if (payrollItem) {
        payrollItems.push(payrollItem);
        totalAmount += payrollCalc.net_salary;
      }
    }

    // Update payroll run with totals
    const { data: updatedRun, error: updateError } = await supabase
      .from('payroll_runs')
      .update({
        total_amount: totalAmount,
        total_employees: payrollItems.length,
      })
      .eq('id', payrollRun.id)
      .select()
      .single();

    if (updateError) {
      console.error('POST /api/payroll update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Payroll generated successfully',
      payrollRun: updatedRun,
      payrollItems,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('POST /api/payroll error:', err);
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
      .maybeSingle();

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { type, id, ...data } = body;

    if (type === 'payroll_run') {
      // Update payroll run status
      const { status, approved_by } = data;

      const updateData: any = { status };
      if (status === 'Approved' || status === 'Disbursed') {
        updateData.approved_by = approved_by || user.id;
        updateData.approved_at = new Date().toISOString();
      }

      const { data: updatedRun, error } = await supabase
        .from('payroll_runs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Payroll run updated successfully',
        payrollRun: updatedRun,
      });
    } else if (type === 'payroll_item') {
      // Update individual payroll item
      const {
        allowances,
        bonuses,
        deductions,
        advances,
        leave_deductions,
        status
      } = data;

      // Get existing item to recalculate net salary
      const { data: existing } = await supabase
        .from('payroll_items')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!existing) {
        return NextResponse.json({ error: 'Payroll item not found' }, { status: 404 });
      }

      const netSalary = existing.base_salary + 
                      (allowances ?? existing.allowances) + 
                      (bonuses ?? existing.bonuses) + 
                      existing.overtime_pay - 
                      (deductions ?? existing.deductions) - 
                      (advances ?? existing.advances) - 
                      (leave_deductions ?? existing.leave_deductions);

      const { data: updatedItem, error } = await supabase
        .from('payroll_items')
        .update({
          allowances: allowances ?? existing.allowances,
          bonuses: bonuses ?? existing.bonuses,
          deductions: deductions ?? existing.deductions,
          advances: advances ?? existing.advances,
          leave_deductions: leave_deductions ?? existing.leave_deductions,
          net_salary: netSalary,
          status: status ?? existing.status,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Payroll item updated successfully',
        payrollItem: updatedItem,
      });
    }

    return NextResponse.json({ error: 'Invalid type specified' }, { status: 400 });
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
      .maybeSingle();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: 'Type and ID are required' }, { status: 400 });
    }

    let error;
    if (type === 'payroll_run') {
      const result = await supabase.from('payroll_runs').delete().eq('id', id);
      error = result.error;
    } else if (type === 'payroll_item') {
      const result = await supabase.from('payroll_items').delete().eq('id', id);
      error = result.error;
    } else {
      return NextResponse.json({ error: 'Invalid type specified' }, { status: 400 });
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${type} deleted successfully`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
