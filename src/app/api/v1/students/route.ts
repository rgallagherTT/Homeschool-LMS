import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's family_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (!profile?.family_id) {
      return NextResponse.json(
        { error: 'No family found for this user' },
        { status: 404 }
      );
    }

    const { data: students, error } = await supabase
      .from('students')
      .select('*, profiles(first_name, last_name, email)')
      .eq('family_id', profile.family_id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(students);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify parent role
    const { data: profile } = await supabase
      .from('profiles')
      .select('family_id, role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'PARENT') {
      return NextResponse.json(
        { error: 'Only parents can create students' },
        { status: 403 }
      );
    }

    if (!profile?.family_id) {
      return NextResponse.json(
        { error: 'No family found. Please create a family first.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { email, password, first_name, last_name, grade_level, birth_date } =
      body;

    if (!first_name || !last_name) {
      return NextResponse.json(
        { error: 'Missing required fields: first_name, last_name' },
        { status: 400 }
      );
    }

    // If email/password provided, create auth user for the student
    let studentUserId: string | null = null;

    if (email && password) {
      const { data: authData, error: signUpError } =
        await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            first_name,
            last_name,
            role: 'STUDENT',
          },
        });

      if (signUpError) {
        // Fallback: try signUp if admin API isn't available
        const { data: signUpData, error: fallbackError } =
          await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { first_name, last_name, role: 'STUDENT' },
            },
          });

        if (fallbackError) {
          return NextResponse.json(
            { error: fallbackError.message },
            { status: 400 }
          );
        }
        studentUserId = signUpData.user?.id || null;
      } else {
        studentUserId = authData.user?.id || null;
      }

      // Create profile for the student user
      if (studentUserId) {
        await supabase.from('profiles').insert({
          id: studentUserId,
          email,
          first_name,
          last_name,
          role: 'STUDENT',
          family_id: profile.family_id,
        });
      }
    }

    // Create student record
    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert({
        user_id: studentUserId,
        family_id: profile.family_id,
        first_name,
        last_name,
        grade_level: grade_level || null,
        birth_date: birth_date || null,
        show_gradebook: false,
      })
      .select()
      .single();

    if (studentError) {
      return NextResponse.json(
        { error: studentError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
