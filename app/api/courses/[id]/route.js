import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const result = await query(`
      SELECT co.*, c.name as category_name, c.slug as category_slug, c.color as category_color
      FROM courses co
      LEFT JOIN categories c ON co.category_id = c.id
      WHERE co.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'الدرس غير موجود' }, { status: 404 });
    }

    const course = result.rows[0];
    const sectionsRes = await query(
      'SELECT * FROM sections WHERE course_id = $1 ORDER BY order_index ASC',
      [course.id]
    );

    return NextResponse.json({ course: { ...course, sections: sectionsRes.rows } });
  } catch (error) {
    console.error('GET course error:', error);
    return NextResponse.json({ error: 'خطأ في جلب الدرس' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  try {
    const { id } = await params;
    const { title, description, category_id, cover_color, level, is_published, pdf_url } = await request.json();

    if (!title || !category_id) {
      return NextResponse.json({ error: 'العنوان والفئة مطلوبان' }, { status: 400 });
    }

    const slug = generateSlug(title);
    const result = await query(
      `UPDATE courses SET title=$1, description=$2, slug=$3, category_id=$4, cover_color=$5, level=$6, is_published=$7, pdf_url=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [title, description || '', slug, category_id, cover_color || '#3b82f6', level || 'بكالوريا', is_published !== false, pdf_url || null, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'الدرس غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ course: result.rows[0] });
  } catch (error) {
    console.error('PUT course error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث الدرس' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  try {
    const { id } = await params;
    const result = await query('DELETE FROM courses WHERE id=$1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'الدرس غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE course error:', error);
    return NextResponse.json({ error: 'خطأ في حذف الدرس' }, { status: 500 });
  }
}