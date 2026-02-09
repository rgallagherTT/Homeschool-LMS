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

    // Get profile with family info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      );
    }

    let family = null;
    let students: any[] = [];

    if (profile.family_id) {
      // Get family info
      const { data: familyData } = await supabase
        .from('families')
        .select('*')
        .eq('id', profile.family_id)
        .single();

      family = familyData;

      // If parent, also get students
      if (profile.role === 'PARENT') {
        const { data: studentData } = await supabase
          .from('students')
          .select('*, profiles(first_name, last_name, email)')
          .eq('family_id', profile.family_id);

        students = studentData || [];
      }
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      ...profile,
      family,
      students,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
