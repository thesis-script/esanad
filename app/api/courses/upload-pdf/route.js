import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('pdf');

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'يرجى رفع ملف PDF صحيح' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._\u0600-\u06FF-]/g, '');
    const filename = `${Date.now()}-${safeName}`;

    // ── PRODUCTION: Vercel Blob ──────────────────────────────────────
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import('@vercel/blob');
      const blob = await put(`courses/${filename}`, buffer, {
        access: 'public',
        contentType: 'application/pdf',
      });
      return NextResponse.json({ url: blob.url }, { status: 201 });
    }

    // ── DEVELOPMENT: Local folder ────────────────────────────────────
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'pdfs');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);
    return NextResponse.json({ url: `/uploads/pdfs/${filename}` }, { status: 201 });

  } catch (error) {
    console.error('PDF upload error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}