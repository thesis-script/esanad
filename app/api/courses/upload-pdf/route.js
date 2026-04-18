import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // Return specific error so we can debug
    if (!cloudName) return NextResponse.json({ error: 'CLOUDINARY_CLOUD_NAME missing' }, { status: 500 });
    if (!apiKey)    return NextResponse.json({ error: 'CLOUDINARY_API_KEY missing' }, { status: 500 });
    if (!apiSecret) return NextResponse.json({ error: 'CLOUDINARY_API_SECRET missing' }, { status: 500 });

    const formData = await request.formData();
    const file = formData.get('pdf');

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'يرجى رفع ملف PDF صحيح' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const dataUri = `data:application/pdf;base64,${base64}`;

    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'courses_pdfs';
    const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha256').update(signatureString).digest('hex');

    const body = new FormData();
    body.append('file', dataUri);
    body.append('api_key', apiKey);
    body.append('timestamp', String(timestamp));
    body.append('signature', signature);
    body.append('folder', folder);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
      { method: 'POST', body }
    );

    const uploadData = await uploadRes.json();

    if (!uploadRes.ok || !uploadData.secure_url) {
      // Return the exact Cloudinary error message
      return NextResponse.json({
        error: uploadData.error?.message || JSON.stringify(uploadData)
      }, { status: 500 });
    }

    return NextResponse.json({ url: uploadData.secure_url }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}