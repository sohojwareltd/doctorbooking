<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>New Contact Message</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f6fb; font-family:Segoe UI, Arial, sans-serif; color:#0f172a;">
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f6fb; padding:28px 14px;">
		<tr>
			<td align="center">
				<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:680px; background:#ffffff; border:1px solid #e2e8f0; border-radius:18px; overflow:hidden;">
					<tr>
						<td style="padding:22px 26px; background:linear-gradient(135deg, #123c46 0%, #0f766e 100%); color:#ffffff;">
							<div style="font-size:12px; letter-spacing:0.16em; text-transform:uppercase; opacity:0.82; font-weight:600;">Doctor Booking</div>
							<div style="margin-top:8px; font-size:24px; line-height:1.3; font-weight:700;">New Contact Message</div>
							<div style="margin-top:6px; font-size:14px; line-height:1.6; opacity:0.9;">A visitor submitted the public contact form.</div>
						</td>
					</tr>

					<tr>
						<td style="padding:22px 26px;">
							<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
								<tr>
									<td style="padding:0 0 14px 0; border-bottom:1px solid #e2e8f0;">
										<span style="display:inline-block; background:#ecfeff; color:#155e75; border:1px solid #bae6fd; border-radius:999px; padding:6px 12px; font-size:12px; font-weight:600;">Contact Inquiry</span>
									</td>
								</tr>
							</table>

							<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
								<tr>
									<td style="width:180px; padding:11px 14px; background:#f8fafc; border-bottom:1px solid #e2e8f0; font-size:13px; font-weight:700; color:#334155;">Name</td>
									<td style="padding:11px 14px; border-bottom:1px solid #e2e8f0; font-size:14px; color:#0f172a;">{{ $sender_name }}</td>
								</tr>
								<tr>
									<td style="width:180px; padding:11px 14px; background:#f8fafc; border-bottom:1px solid #e2e8f0; font-size:13px; font-weight:700; color:#334155;">Phone</td>
									<td style="padding:11px 14px; border-bottom:1px solid #e2e8f0; font-size:14px; color:#0f172a;">{{ $sender_phone }}</td>
								</tr>
								<tr>
									<td style="width:180px; padding:11px 14px; background:#f8fafc; border-bottom:1px solid #e2e8f0; font-size:13px; font-weight:700; color:#334155;">Email</td>
									<td style="padding:11px 14px; border-bottom:1px solid #e2e8f0; font-size:14px; color:#0f172a;">{{ $sender_email ?: 'Not provided' }}</td>
								</tr>
								<tr>
									<td style="width:180px; padding:11px 14px; background:#f8fafc; font-size:13px; font-weight:700; color:#334155;">Subject</td>
									<td style="padding:11px 14px; font-size:14px; color:#0f172a;">{{ $subject_text }}</td>
								</tr>
							</table>

							<div style="margin-top:18px; font-size:13px; font-weight:700; color:#334155;">Message</div>
							<div style="margin-top:8px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:14px; font-size:14px; line-height:1.7; color:#0f172a; white-space:pre-wrap;">{{ $message_text }}</div>
						</td>
					</tr>

					<tr>
						<td style="padding:14px 26px 20px 26px; border-top:1px solid #e2e8f0; font-size:12px; color:#64748b;">
							This message was sent from the public contact form on your Doctor Booking website.
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
