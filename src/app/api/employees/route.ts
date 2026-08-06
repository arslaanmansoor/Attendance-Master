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

    // Check if new fields exist in schema
    let hasNewFields = false;
    try {
      await supabase.from('profiles').select('nationality').limit(1).single();
      hasNewFields = true;
    } catch (e) {
      console.log('Using v3 schema compatibility mode for GET');
    }

    let selectQuery = `
      id,
      employee_id,
      email,
      full_name,
      avatar_url,
      role,
      department_id,
      departments(id, name, code),
      company_id,
      companies(id, name),
      position,
      phone,
      joining_date,
      basic_salary,
      hourly_rate,
      employment_status,
      created_at
    `;

    if (hasNewFields) {
      selectQuery = `
        id,
        employee_id,
        email,
        full_name,
        avatar_url,
        role,
        department_id,
        departments(id, name, code),
        company_id,
        companies(id, name),
        position,
        phone,
        nationality,
        passport_id,
        visa_expiry,
        employment_type,
        joining_date,
        basic_salary,
        hourly_rate,
        overtime_rate,
        working_hours_per_day,
        weekly_off_day,
        notes,
        employment_status,
        created_at
      `;
    }

    let query = supabase
      .from('profiles')
      .select(selectQuery)
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
      console.error('GET /api/employees error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ employees });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('GET /api/employees error:', err);
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
      nationality,
      passport_id,
      visa_expiry,
      employment_type,
      joining_date,
      basic_salary,
      hourly_rate,
      overtime_rate,
      working_hours_per_day,
      weekly_off_day,
      notes,
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
      console.error('Auth error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      console.error('No user data returned from auth');
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Get the current user's company_id if not provided
    let finalCompanyId = company_id;
    if (!finalCompanyId) {
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      finalCompanyId = currentUserProfile?.company_id;
    }

    // Build insert object with only fields that exist in v3 schema
    const insertData: any = {
      id: authData.user.id,
      employee_id: newEmployeeId,
      email,
      full_name,
      role: role || 'employee',
      department_id,
      company_id: finalCompanyId,
      position,
      phone,
      joining_date: joining_date || new Date().toISOString().split('T')[0],
      basic_salary: basic_salary || 0,
      hourly_rate: hourly_rate || 0,
      employment_status: employment_status || 'Active',
    };

    // Only add new fields if they exist in the database (try-catch approach)
    try {
      await supabase.from('profiles').select('nationality').limit(1).single();
      insertData.nationality = nationality;
      insertData.passport_id = passport_id;
      insertData.visa_expiry = visa_expiry;
      insertData.employment_type = employment_type || 'Full-time';
      insertData.overtime_rate = overtime_rate || 0;
      insertData.working_hours_per_day = working_hours_per_day || 8;
      insertData.weekly_off_day = weekly_off_day || 'Sunday';
      insertData.notes = notes;
    } catch (e) {
      // Fields don't exist in schema, skip them
      console.log('New employee fields not in schema, using v3 compatibility mode');
    }

    // Try to add audit fields if they exist
    try {
      await supabase.from('profiles').select('created_by').limit(1).single();
      insertData.created_by = user.id;
    } catch (e) {
      // Audit fields don't exist, skip them
    }

    // Create profile
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert(insertData)
      .select()
      .single();

    if (profileError) {
      console.error('Profile insert error:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Employee created successfully',
      employee: newProfile,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('POST /api/employees error:', err);
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
    const { id, employee_id, full_name, email, role, department_id, company_id, position, phone, nationality, passport_id, visa_expiry, employment_type, joining_date, basic_salary, hourly_rate, overtime_rate, working_hours_per_day, weekly_off_day, notes, employment_status } = body;

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

    // Build update object with only fields that exist in v3 schema
    const updateData: any = {
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
    };

    // Only add new fields if they exist in the database
    try {
      await supabase.from('profiles').select('nationality').limit(1).single();
      updateData.nationality = nationality;
      updateData.passport_id = passport_id;
      updateData.visa_expiry = visa_expiry;
      updateData.employment_type = employment_type;
      updateData.overtime_rate = overtime_rate;
      updateData.working_hours_per_day = working_hours_per_day;
      updateData.weekly_off_day = weekly_off_day;
      updateData.notes = notes;
    } catch (e) {
      // Fields don't exist in schema, skip them
      console.log('New employee fields not in schema, using v3 compatibility mode');
    }

    // Try to add audit fields if they exist
    try {
      await supabase.from('profiles').select('updated_by').limit(1).single();
      updateData.updated_by = user.id;
    } catch (e) {
      // Audit fields don't exist, skip them
    }

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully',
      employee: updatedProfile,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('PUT /api/employees error:', err);
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

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('DELETE /api/employees error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('DELETE /api/employees error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
