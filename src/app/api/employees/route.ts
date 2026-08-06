import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlanKeyFromPriceId, getPlanLimits } from '@/lib/subscription';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabase
      .from('profiles')
      .select(`
        id,
        employee_id,
        email,
        full_name,
        avatar_url,
        role,
        department_id,
        departments(name, code),
        company_id,
        companies(name),
        position,
        phone,
        joining_date,
        basic_salary,
        hourly_rate,
        employment_status,
        created_at
      `)
      .in('role', ['employee', 'manager', 'admin']);

    if (department && department !== 'All') {
      query = query.eq('departments.code', department);
    }

    if (status && status !== 'All') {
      query = query.eq('employment_status', status);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,position.ilike.%${search}%`);
    }

    const { data: employees, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ employees });
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
      full_name,
      email,
      role,
      department_id,
      company_id,
      position,
      phone,
      joining_date,
      basic_salary,
      hourly_rate,
      employment_status
    } = body;

    if (!full_name || !email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
    }

    // Check if employee_id already exists
    if (employee_id) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('employee_id', employee_id)
        .single();

      if (existing) {
        return NextResponse.json({ error: 'Employee ID already exists.' }, { status: 400 });
      }
    }

    // Check plan limits
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('plan_key, subscription_price_id, subscription_status')
      .eq('role', 'admin')
      .in('subscription_status', ['active', 'trialing'])
      .limit(1)
      .maybeSingle();

    const planKey =
      (adminProfile?.plan_key as ReturnType<typeof getPlanKeyFromPriceId>) ??
      getPlanKeyFromPriceId(adminProfile?.subscription_price_id);

    const limits = getPlanLimits(planKey);

    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('role', ['employee', 'manager']);

    if (count !== null && count >= limits.maxEmployees) {
      return NextResponse.json(
        {
          error: `Plan limit reached (${limits.maxEmployees} employees). Upgrade your plan to add more.`,
        },
        { status: 403 }
      );
    }

    // Generate employee_id if not provided
    const newEmployeeId = employee_id || `EMP-${String(count || 0 + 1).padStart(3, '0')}`;

    // Create auth user first (simplified - in production use proper invite flow)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: 'TempPassword123!', // In production, send invite email
      options: {
        data: {
          full_name,
          employee_id: newEmployeeId,
        }
      }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Create profile
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        employee_id: newEmployeeId,
        email,
        full_name,
        role: role || 'employee',
        department_id,
        company_id,
        position,
        phone,
        joining_date: joining_date || new Date().toISOString().split('T')[0],
        basic_salary: basic_salary || 0,
        hourly_rate: hourly_rate || 0,
        employment_status: employment_status || 'Active',
      })
      .select()
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Employee created successfully',
      employee: newProfile,
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
    const { id, employee_id, full_name, email, role, department_id, company_id, position, phone, joining_date, basic_salary, hourly_rate, employment_status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    // Check if employee_id conflicts with another record
    if (employee_id) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('employee_id', employee_id)
        .neq('id', id)
        .single();

      if (existing) {
        return NextResponse.json({ error: 'Employee ID already exists.' }, { status: 400 });
      }
    }

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({
        employee_id,
        full_name,
        email,
        role,
        department_id,
        company_id,
        position,
        phone,
        joining_date,
        basic_salary,
        hourly_rate,
        employment_status,
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
      message: 'Employee updated successfully',
      employee: updatedProfile,
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

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
