import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { uniquecode, studentName } = await req.json();

    if (!uniquecode || !studentName) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const amount = parseInt(process.env.NEXT_PUBLIC_PHOTO_PRICE || '25000');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            billing: {
              name: studentName,
            },
            line_items: [
              {
                currency: 'PHP',
                amount,
                name: 'High-Resolution Digital Photos',
                quantity: 1,
              },
            ],
            payment_method_types: ['qrph', 'card', 'gcash', 'paymaya'],
            success_url: `${appUrl}?code=${uniquecode}&payment=success`,
            cancel_url: `${appUrl}?code=${uniquecode}&payment=cancelled`,
            metadata: {
              uniquecode,
            },
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('PayMongo error:', data);
      return NextResponse.json({ error: 'Failed to create checkout session.' }, { status: 500 });
    }

    const checkoutUrl = data.data.attributes.checkout_url;
    return NextResponse.json({ url: checkoutUrl });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}