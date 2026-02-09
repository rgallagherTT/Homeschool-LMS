import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: student, error } = await supabase
      .from('students')
      .select('*, profiles(first_name, last_name, email)')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Verify student belongs to user's family
    if (student.family_id !== profile?.family_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(student);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
        { error: 'Only parents can update students' },
        { status: 403 }
      );
    }

    // Verify student belongs to family
    const { data: existingStudent } = await supabase
      .from('students')
      .select('family_id')
      .eq('id', id)
      .single();

    if (!existingStudent || existingStudent.family_id !== profile?.family_id) {
      return NextResponse.json(
        { error: 'Student not found in your family' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { grade_level, birth_date, show_gradebook, first_name, last_name } =
      body;

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (grade_level !== undefined) updateData.grade_level = grade_level;
    if (birth_date !== undefined) updateData.birth_date = birth_date;
    if (show_gradebook !== undefined) updateData.show_gradebook = show_gradebook;
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;

    const { data: student, error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(student);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
        { error: 'Only parents can delete students' },
        { status: 403 }
      );
    }

    // Verify student belongs to family
    const { data: existingStudent } = await supabase
      .from('students')
      .select('family_id')
      .eq('id', id)
      .single();

    if (!existingStudent || existingStudent.family_id !== profile?.family_id) {
      return NextResponse.json(
        { error: 'Student not found in your family' },
        { status: 404 }
      );
    }

    const { error } = await supabase.from('students').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Student deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
