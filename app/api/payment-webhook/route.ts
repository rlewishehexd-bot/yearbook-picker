import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';

// Initialize Firebase Admin
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

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const [timestamp, hash] = signature.split(',');
  const ts = timestamp.replace('t=', '');
  const expectedHash = crypto
    .createHmac('sha256', secret)
    .update(`${ts}.${payload}`)
    .digest('hex');
  return hash.replace('li=', '') === expectedHash;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('paymongo-signature') || '';
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET || '';

    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
const eventType = event.data.type;

if (eventType !== 'checkout_session.payment.paid') {
      return NextResponse.json({ received: true });
    }

    const uniquecode = event.data.attributes.metadata?.uniquecode;

    if (!uniquecode) {
      return NextResponse.json({ error: 'Missing uniquecode in metadata.' }, { status: 400 });
    }

    // Find student by uniquecode
    const studentsRef = db.collection('students');
    const q = studentsRef.where('uniquecode', '==', uniquecode);
    const snapshot = await q.get();

    if (snapshot.empty) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    }

    const studentDoc = snapshot.docs[0];
    await studentDoc.ref.update({
      hasPurchased: true,
      purchaseTimestamp: new Date(),
    });

    console.log(`✅ Purchase confirmed for uniquecode: ${uniquecode}`);
    return NextResponse.json({ received: true });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}