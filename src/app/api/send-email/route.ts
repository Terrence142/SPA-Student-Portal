import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key_to_prevent_build_error');

export async function POST(req: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY is not configured in Environment Variables.' },
        { status: 500 }
      );
    }

    const data = await req.json();

    let subject = '';
    let html = '';
    
    // Hardcoded TO address for demonstration. In a real app, 
    // you would query your DB for the student's email address.
    const toEmail = ['delivered@resend.dev']; 

    if (data.type === 'transaction') {
      subject = `Transaction Update: ${data.description}`;
      html = `
        <div style="font-family: sans-serif; padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #16a34a;">Transaction Logged</h2>
          <p>Hello,</p>
          <p>A new transaction has been logged on your account.</p>
          <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #eee;">
            <p><strong>Description:</strong> ${data.description}</p>
            <p><strong>Amount:</strong> ₱${data.amount}</p>
            <p><strong>New Balance:</strong> ₱${data.newBalance}</p>
          </div>
          <p>Please log in to your Student Portal to view full details.</p>
        </div>
      `;
    } else if (data.type === 'announcement') {
      subject = `New Announcement from ${data.author}`;
      html = `
        <div style="font-family: sans-serif; padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #1d4ed8;">New Global Announcement</h2>
          <p>Hello,</p>
          <p>A new announcement was just posted by <strong>${data.author}</strong>:</p>
          <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #eee;">
            <p style="white-space: pre-wrap;">${data.message}</p>
          </div>
          <p>Please log in to your Student Portal to view full details.</p>
        </div>
      `;
    } else {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    const result = await resend.emails.send({
      from: 'Student Portal <onboarding@resend.dev>',
      to: toEmail,
      subject: subject,
      html: html,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
