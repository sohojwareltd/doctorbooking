<!doctype html>
<html lang="bn">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>নতুন লিড</title>
</head>
<body style="margin:0; padding:0; background-color:#eef3fb; font-family:'Segoe UI', Arial, sans-serif; color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef3fb; padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:680px;">
                    <tr>
                        <td style="padding:0 0 10px 2px; color:#5b6b84; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; font-weight:700;">
                            Doctor Booking
                        </td>
                    </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:680px; background:#ffffff; border:1px solid #d9e2f2; border-radius:16px; overflow:hidden; box-shadow:0 10px 26px rgba(15, 23, 42, 0.08);">
                    <tr>
                        <td style="padding:20px 24px; background:linear-gradient(135deg, #103a7a 0%, #1a5fc1 100%); color:#ffffff;">
                            <p style="margin:0; font-size:12px; opacity:0.86; letter-spacing:0.08em; text-transform:uppercase; font-weight:600;">Lead Notification</p>
                            <h2 style="margin:6px 0 0; font-size:24px; line-height:1.25; font-weight:700;">নতুন কাস্টমার লিড</h2>
                            <p style="margin:8px 0 0; font-size:14px; line-height:1.5; opacity:0.92;">ল্যান্ডিং পেইজ থেকে একজন কাস্টমার কলব্যাক রিকোয়েস্ট করেছেন।</p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:20px 24px 10px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e4ebf7; border-radius:12px; overflow:hidden;">
                                <tr>
                                    <td style="width:140px; padding:12px 14px; background:#f6f9ff; border-bottom:1px solid #e4ebf7; font-size:13px; color:#334155; font-weight:700;">নাম</td>
                                    <td style="padding:12px 14px; border-bottom:1px solid #e4ebf7; font-size:15px; color:#0f172a; font-weight:600;">{{ $sender_name }}</td>
                                </tr>
                                <tr>
                                    <td style="width:140px; padding:12px 14px; background:#f6f9ff; font-size:13px; color:#334155; font-weight:700;">মোবাইল নম্বর</td>
                                    <td style="padding:12px 14px; font-size:15px; color:#0f172a; font-weight:600;">{{ $sender_phone }}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    @if(!empty($sender_comment))
                    <tr>
                        <td style="padding:0 24px 10px;">
                            <div style="padding:12px 14px; background:#f8fbff; border:1px solid #e3ecfa; border-radius:10px;">
                                <p style="margin:0 0 6px; font-size:13px; color:#334155; font-weight:700;">মন্তব্য</p>
                                <p style="margin:0; font-size:14px; line-height:1.6; color:#0f172a; white-space:pre-wrap;">{{ $sender_comment }}</p>
                            </div>
                        </td>
                    </tr>
                    @endif

                    <tr>
                        <td style="padding:0 24px 22px;">
                            <p style="margin:10px 0 0; padding:12px 14px; background:#f8fbff; border:1px solid #e3ecfa; border-radius:10px; font-size:13px; line-height:1.6; color:#475569;">
                                মন্তব্য: দ্রুত কল করলে কনভার্সন হওয়ার সম্ভাবনা বেশি থাকে।
                            </p>
                        </td>
                    </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:680px;">
                    <tr>
                        <td style="padding:12px 2px 0; font-size:12px; color:#6b7280; text-align:center;">
                            এই ইমেইলটি Doctor Booking এর লিড ফর্ম থেকে স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে।
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
