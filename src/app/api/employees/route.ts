import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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
      query = query.or(`employee_id.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%,position.ilike.%${search}%,departments.name.ilike.%${search}%`);
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
  let createdAuthUserId: string | null = null;
  
  try {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, company_id')
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
      employment_status,
      createAuthAccount = false // Optional: whether to create Auth account
    } = body;

    if (!full_name || !email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
    }

    // Get the current user's company_id if not provided
    let finalCompanyId = company_id || profile.company_id;
    if (!finalCompanyId) {
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      finalCompanyId = currentUserProfile?.company_id;
    }

    // Check if employee_id already exists within the same company
    if (employee_id) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('employee_id', employee_id)
        .eq('company_id', finalCompanyId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: `Employee ID ${employee_id} already exists in this company. Please enter a different ID.` }, { status: 400 });
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

    // Create Auth user only if requested (using Admin API)
    let authUserId: string | null = null;
    if (createAuthAccount) {
      // Generate a secure random password
      const password = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase();
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          employee_id: newEmployeeId,
        },
      });

      if (authError) {
        console.error('Admin auth creation error:', authError);
        return NextResponse.json({ error: `Failed to create auth user: ${authError.message}` }, { status: 400 });
      }

      if (!authData.user) {
        console.error('No user data returned from admin auth');
        return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 });
      }

      authUserId = authData.user.id;
      createdAuthUserId = authUserId;
    }

    // Build insert object with only fields that exist in v3 schema
    const insertData: any = {
      id: authUserId,
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
      
      // Clean up Auth user if profile creation failed
      if (createdAuthUserId) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
          console.log('Cleaned up orphaned auth user:', createdAuthUserId);
        } catch (cleanupError) {
          console.error('Failed to cleanup auth user:', cleanupError);
        }
      }
      
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
    
    // Clean up Auth user if error occurred
    if (createdAuthUserId) {
      try {
        const supabaseAdmin = createAdminClient();
        await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
        console.log('Cleaned up orphaned auth user after error:', createdAuthUserId);
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user after error:', cleanupError);
      }
    }
    
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, company_id')
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

    // Verify employee exists and belongs to the same company
    const { data: existingEmployee, error: fetchError } = await supabase
      .from('profiles')
      .select('id, company_id, email')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !existingEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Verify company ownership (tenant isolation)
    if (profile.company_id && existingEmployee.company_id && profile.company_id !== existingEmployee.company_id) {
      return NextResponse.json({ error: 'Cannot edit employee from another company' }, { status: 403 });
    }

    // Check if employee_id conflicts with another record in the same company
    if (employee_id) {
      const { data: conflicting } = await supabase
        .from('profiles')
        .select('id, company_id')
        .eq('employee_id', employee_id)
        .neq('id', id)
        .maybeSingle();

      if (conflicting) {
        // Only reject if the conflicting employee is in the same company
        if (conflicting.company_id === existingEmployee.company_id) {
          return NextResponse.json({ error: `Employee ID ${employee_id} already exists in this company.` }, { status: 400 });
        }
        // If different company, allow it (multi-tenant support)
      }
    }

    // Sync Auth email if it exists and email changed
    if (email && email !== existingEmployee.email) {
      // Check if this profile has an associated Auth user (id references auth.users)
      try {
        await supabaseAdmin.auth.admin.updateUserById(id, { email });
        console.log('Auth email synchronized for user:', id);
      } catch (authError) {
        console.error('Failed to sync auth email:', authError);
        // Don't fail the update if auth sync fails - profile may not have auth user
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
    const supabaseAdmin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, company_id')
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

    // Verify employee exists and belongs to the same company
    const { data: employeeToDelete, error: fetchError } = await supabase
      .from('profiles')
      .select('id, company_id, email')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !employeeToDelete) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Verify company ownership (tenant isolation)
    if (profile.company_id && employeeToDelete.company_id && profile.company_id !== employeeToDelete.company_id) {
      return NextResponse.json({ error: 'Cannot delete employee from another company' }, { status: 403 });
    }

    // Check if employee has related records (attendance, payroll)
    const { count: attendanceCount } = await supabase
      .from('attendance_logs')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', id);

    const { count: payrollCount } = await supabase
      .from('payroll_items')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', id);

    if (attendanceCount && attendanceCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete employee with attendance records. Please archive or deactivate instead.',
        hasRecords: true 
      }, { status: 400 });
    }

    if (payrollCount && payrollCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete employee with payroll records. Please archive or deactivate instead.',
        hasRecords: true 
      }, { status: 400 });
    }

    // Delete the profile (this cascades to auth.users due to FK constraint)
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('DELETE /api/employees error:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
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
