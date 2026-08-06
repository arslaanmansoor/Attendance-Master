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
    const type = searchParams.get('type');

    if (type === 'projects') {
      const { data: projects } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          code,
          department_id,
          departments(name),
          company_id,
          companies(name),
          status,
          progress,
          start_date,
          end_date
        `)
        .order('created_at', { ascending: false });

      return NextResponse.json({ projects });
    }

    if (type === 'companies') {
      const { data: companies } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      return NextResponse.json({ companies });
    }

    if (type === 'expiries') {
      // Get document expiries from profiles (this would need a separate documents table in production)
      const { data: employees } = await supabase
        .from('profiles')
        .select('id, employee_id, full_name, email')
        .eq('employment_status', 'Active')
        .in('role', ['employee', 'manager']);

      return NextResponse.json({ employees });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
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
      .maybeSingle();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { type, ...data } = body;

    if (type === 'project') {
      const { name, code, department_id, company_id, start_date, end_date } = data;

      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          name,
          code,
          department_id,
          company_id,
          start_date,
          end_date,
          status: 'Active',
          progress: 0,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Project created successfully',
        project: newProject,
      });
    }

    if (type === 'company') {
      const { name, trade_license, address, city, country, phone, email } = data;

      const { data: newCompany, error } = await supabase
        .from('companies')
        .insert({
          name,
          trade_license,
          address,
          city,
          country,
          phone,
          email,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Company created successfully',
        company: newCompany,
      });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
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
      .maybeSingle();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { type, id, ...data } = body;

    if (type === 'project') {
      const { error } = await supabase
        .from('projects')
        .update(data)
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Project updated successfully',
      });
    }

    if (type === 'company') {
      const { error } = await supabase
        .from('companies')
        .update(data)
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Company updated successfully',
      });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
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
    if (type === 'project') {
      const result = await supabase.from('projects').delete().eq('id', id);
      error = result.error;
    } else if (type === 'company') {
      const result = await supabase.from('companies').delete().eq('id', id);
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
