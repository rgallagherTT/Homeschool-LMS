import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { email, password, first_name, last_name, role } = body;

    if (!email || !password || !first_name || !last_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, first_name, last_name, role' },
        { status: 400 }
      );
    }

    const validRoles = ['PARENT', 'STUDENT'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be PARENT or STUDENT' },
        { status: 400 }
      );
    }

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name,
          role,
        },
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create profile record
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      email,
      first_name,
      last_name,
      role,
    });

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      );
    }

    // If role is PARENT, create a family record
    let family = null;
    if (role === 'PARENT') {
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .insert({
          name: `${last_name} Family`,
          parent_id: authData.user.id,
        })
        .select()
        .single();

      if (familyError) {
        return NextResponse.json(
          { error: familyError.message },
          { status: 400 }
        );
      }

      // Update profile with family_id
      await supabase
        .from('profiles')
        .update({ family_id: familyData.id })
        .eq('id', authData.user.id);

      family = familyData;
    }

    return NextResponse.json(
      {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          first_name,
          last_name,
          role,
        },
        family,
        session: authData.session,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
