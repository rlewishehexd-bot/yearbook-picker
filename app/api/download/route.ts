import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import B2 from 'backblaze-b2';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uniquecode = searchParams.get('code');
    const photo = searchParams.get('photo');

    if (!uniquecode || !photo) {
      return NextResponse.json({ error: 'Missing code or photo.' }, { status: 400 });
    }

    const studentsRef = db.collection('students');
    const snapshot = await studentsRef.where('uniquecode', '==', uniquecode).get();

    if (snapshot.empty) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    }

    const studentDoc = snapshot.docs[0];
    const studentData = studentDoc.data();

    if (!studentData.hasPurchased) {
      return NextResponse.json({ error: 'Not purchased.' }, { status: 403 });
    }

    const sanitizedName = studentData.sanitizedName;

    const b2 = new B2({
      applicationKeyId: process.env.B2_KEY_ID!,
      applicationKey: process.env.B2_APP_KEY!,
    });

    const authResult = await b2.authorize();
    const downloadUrl = authResult.data.downloadUrl;

    const fileName = `limitless-concert/${sanitizedName}/${photo}`;

    const authResponse = await b2.getDownloadAuthorization({
      bucketId: process.env.B2_HIGHRES_BUCKET_ID!,
      fileNamePrefix: fileName,
      validDurationInSeconds: 3600,
    });

    const signedUrl = `${downloadUrl}/file/${process.env.B2_HIGHRES_BUCKET_NAME}/${fileName}?Authorization=${authResponse.data.authorizationToken}`;

    return NextResponse.json({ url: signedUrl, fileName: photo });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}