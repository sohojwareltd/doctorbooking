<!doctype html>
<html lang="bn">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="csrf-token" content="{{ csrf_token() }}">
	<title>Doctor Booking + Digital Prescription | ডাক্তারের চেম্বারের জন্য স্মার্ট সিস্টেম</title>
	<meta name="description" content="বাংলাদেশি ডাক্তারদের জন্য বুকিং, চেম্বার শিডিউল, ডিজিটাল প্রেসক্রিপশন, রিপোর্ট ম্যানেজমেন্ট এবং বড় মেডিসিন ডাটাবেজসহ সম্পূর্ণ সিস্টেম।">

	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">

	<style>
		:root {
			--bg: #f5f7f4;
			--surface: #ffffff;
			--ink: #10221b;
			--muted: #4e625a;
			--brand: #0d8a5a;
			--brand-dark: #086642;
			--accent: #f4b63f;
			--line: #d8e1dc;
			--radius: 16px;
			--shadow: 0 14px 32px rgba(16, 34, 27, 0.08);
		}

		* {
			box-sizing: border-box;
		}

		body {
			margin: 0;
			font-family: "Hind Siliguri", sans-serif;
			background:
				radial-gradient(circle at 15% -5%, #e8f4ee 0%, rgba(232, 244, 238, 0) 42%),
				radial-gradient(circle at 100% 0%, #fff1d6 0%, rgba(255, 241, 214, 0) 36%),
				var(--bg);
			color: var(--ink);
			line-height: 1.55;
		}

		.wrap {
			width: min(1060px, calc(100% - 28px));
			margin: 0 auto;
		}

		.hero {
			padding: 22px 0 18px;
		}

		.pill {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			background: #e8f4ee;
			color: #0f6d48;
			border: 1px solid #b8ddcc;
			border-radius: 999px;
			padding: 8px 14px;
			font-weight: 600;
			font-size: 14px;
		}

		.hero-card {
			margin-top: 14px;
			border: 1px solid var(--line);
			background: linear-gradient(150deg, #ffffff 0%, #fbfefc 45%, #fff8ea 100%);
			border-radius: 22px;
			box-shadow: var(--shadow);
			overflow: hidden;
			display: grid;
			grid-template-columns: 1.2fr 0.8fr;
		}

		.hero-main {
			padding: 28px 26px;
		}

		h1 {
			margin: 0;
			font-size: clamp(28px, 6vw, 46px);
			line-height: 1.1;
			letter-spacing: -0.01em;
		}

		.sub {
			margin: 12px 0 0;
			color: var(--muted);
			font-size: clamp(16px, 3.6vw, 20px);
			max-width: 56ch;
		}

		.hero-actions {
			margin-top: 18px;
			display: flex;
			flex-wrap: wrap;
			gap: 10px;
		}

		.btn {
			appearance: none;
			border: 0;
			border-radius: 12px;
			padding: 11px 18px;
			font-family: inherit;
			font-weight: 700;
			font-size: 16px;
			text-decoration: none;
			cursor: pointer;
			display: inline-flex;
			justify-content: center;
			align-items: center;
			min-height: 46px;
			transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
		}

		.btn:hover {
			transform: translateY(-1px);
		}

		.btn:active {
			transform: translateY(0);
		}

		.btn-primary {
			background: var(--brand);
			color: #fff;
			box-shadow: 0 10px 20px rgba(13, 138, 90, 0.25);
		}

		.btn-primary:hover {
			background: var(--brand-dark);
		}

		.btn-secondary {
			background: #fff;
			color: var(--ink);
			border: 1px solid var(--line);
		}

		.hero-side {
			background: linear-gradient(175deg, #103726 0%, #0f5a3a 100%);
			color: #eaf7f1;
			padding: 24px 22px;
			display: flex;
			flex-direction: column;
			justify-content: space-between;
		}

		.stat {
			display: grid;
			gap: 2px;
			margin-bottom: 12px;
		}

		.stat strong {
			font-size: 28px;
			line-height: 1;
			color: #fff;
		}

		.stat span {
			color: #d1e9de;
			font-size: 14px;
		}

		.section {
			padding: 26px 0 4px;
		}

		h2 {
			margin: 0 0 8px;
			font-size: clamp(24px, 4.8vw, 34px);
			line-height: 1.15;
		}

		.lead {
			margin: 0;
			color: var(--muted);
			font-size: 17px;
			max-width: 70ch;
		}

		.grid {
			margin-top: 16px;
			display: grid;
			gap: 12px;
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.card {
			border: 1px solid var(--line);
			border-radius: var(--radius);
			padding: 18px;
			background: var(--surface);
		}

		.card h3 {
			margin: 0 0 8px;
			font-size: 21px;
			line-height: 1.25;
		}

		.card p {
			margin: 0;
			color: var(--muted);
			font-size: 16px;
		}

		.step-list {
			margin-top: 16px;
			display: grid;
			gap: 10px;
		}

		.step {
			border: 1px solid var(--line);
			border-radius: 14px;
			background: #ffffffde;
			padding: 12px 14px;
			display: grid;
			grid-template-columns: auto 1fr;
			gap: 10px;
			align-items: start;
		}

		.step-no {
			width: 34px;
			height: 34px;
			border-radius: 50%;
			display: inline-flex;
			justify-content: center;
			align-items: center;
			background: #e8f4ee;
			color: #0f6d48;
			font-weight: 700;
		}

		.step b {
			display: block;
			margin-bottom: 3px;
			font-size: 17px;
		}

		.step small {
			color: var(--muted);
			font-size: 15px;
		}

		.cta-box {
			margin-top: 20px;
			border: 1px solid #cde3d8;
			background: linear-gradient(160deg, #f7fcf9 0%, #edf7f2 100%);
			border-radius: 20px;
			padding: 20px;
		}

		.cta-box h3 {
			margin: 0;
			font-size: 24px;
		}

		.cta-box p {
			margin: 8px 0 0;
			color: var(--muted);
		}

		.lead-form {
			margin-top: 14px;
			display: grid;
			gap: 10px;
		}

		.lead-form .row {
			display: grid;
			gap: 10px;
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.field {
			display: grid;
			gap: 6px;
		}

		.field label {
			font-size: 14px;
			font-weight: 600;
			color: #163a2c;
		}

		.field input,
		.field textarea {
			width: 100%;
			font-family: inherit;
			font-size: 16px;
			border: 1px solid #bcd7ca;
			border-radius: 11px;
			padding: 10px 12px;
			background: #fff;
			outline: none;
		}

		.field textarea {
			min-height: 86px;
			resize: vertical;
		}

		.field input:focus,
		.field textarea:focus {
			border-color: var(--brand);
			box-shadow: 0 0 0 3px rgba(13, 138, 90, 0.15);
		}

		.note {
			font-size: 14px;
			color: var(--muted);
		}

		.status {
			margin-top: 8px;
			padding: 10px 12px;
			border-radius: 10px;
			font-weight: 600;
			display: none;
		}

		.status.ok {
			display: block;
			background: #e8f6ef;
			color: #0f6d48;
			border: 1px solid #b8ddcc;
		}

		.status.err {
			display: block;
			background: #fff3f1;
			color: #9a2f1d;
			border: 1px solid #f1c1b8;
		}

		.faq {
			margin-top: 18px;
			display: grid;
			gap: 8px;
		}

		details {
			border: 1px solid var(--line);
			border-radius: 12px;
			background: #fff;
			padding: 10px 12px;
		}

		summary {
			cursor: pointer;
			font-weight: 600;
		}

		details p {
			margin: 8px 0 0;
			color: var(--muted);
		}

		footer {
			margin: 26px 0 30px;
			color: #4a5e56;
			text-align: center;
			font-size: 14px;
		}

		@media (max-width: 940px) {
			.hero-card {
				grid-template-columns: 1fr;
			}

			.grid {
				grid-template-columns: repeat(2, minmax(0, 1fr));
			}
		}

		@media (max-width: 640px) {
			.hero {
				padding-top: 14px;
			}

			.hero-main,
			.hero-side {
				padding: 18px 16px;
			}

			.sub {
				font-size: 16px;
			}

			.grid {
				grid-template-columns: 1fr;
			}

			.lead-form .row {
				grid-template-columns: 1fr;
			}

			.btn {
				width: 100%;
			}
		}
	</style>
</head>
<body>
	<header class="hero">
		<div class="wrap">
			<span class="pill">ডাক্তার বুকিং + ডিজিটাল প্রেসক্রিপশন প্ল্যাটফর্ম</span>

			<div class="hero-card">
				<div class="hero-main">
					<h1>প্রেসক্রিপশন হবে আরও সহজ, দ্রুত ও পরিষ্কার</h1>
					<p class="sub">
						একই ধরনের রোগীর জন্য বারবার একই ওষুধ, পরামর্শ বা টেস্ট লিখতে হবে না। আগে থেকে সেট করা প্রেসক্রিপশন এবং ওষুধের তালিকা ব্যবহার করে খুব সহজেই সুন্দর ও পরিষ্কার ডিজিটাল প্রেসক্রিপশন তৈরি করতে পারবেন এবং SMS এর মাধ্যমে সরাসরি রোগীর মোবাইলে পাঠাতে পারবেন।
					</p>

					<div class="hero-actions">
						<a href="#leadForm" class="btn btn-primary" data-track-click="hero_demo_click">ফ্রি ডেমো চাই</a>
						<a href="{{ route('public.book-appointment.view') }}" class="btn btn-secondary" data-track-click="hero_booking_click">বুকিং পেজ দেখুন</a>
					</div>
				</div>
			</div>
            <img src="{{ asset('landing/prescription.png') }}" alt="" style="width:100%">
		</div>
	</header>

	<main>
		<section class="section">
			<div class="wrap">
				<h2>স্মার্ট ফিচারসমূহ</h2>

				<div class="grid">
					<article class="card">
						<h3>অ্যাপয়েন্টমেন্ট অটোমেশন</h3>
						<p>রোগী নিজেই অনলাইনে সহজে অ্যাপয়েন্টমেন্ট বুক করতে পারবেন।</p>
					</article>

					<article class="card">
						<h3>মাল্টি-চেম্বার শিডিউল</h3>
						<p>ডাক্তার একাধিক চেম্বার যোগ করতে পারেন, প্রতিটি চেম্বারের জন্য আলাদা দিন, রেঞ্জ, slot মিনিট সেট করা যায়।</p>
					</article>

					<article class="card">
						<h3>ডিজিটাল প্রেসক্রিপশন</h3>
						<p>আগের প্রেসক্রিপশন টেমপ্লেট ব্যবহার করে দ্রুত নতুন প্রেসক্রিপশন তৈরি করতে পারবেন এবং সরাসরি রোগীর মোবাইলে পাঠাতে পারবেন।</p>
					</article>

					<article class="card">
						<h3>রোগীর রিপোর্ট ম্যানেজমেন্ট</h3>
						<p>রোগী বা কম্পাউন্ডার সহজেই টেস্ট রিপোর্ট আপলোড করতে পারবেন। রিপোর্ট দেখার পর ডাক্তার প্রেসক্রিপশন তৈরি করে সরাসরি রোগীর মোবাইলে পাঠাতে পারবেন—তাই রোগীকে চেম্বারে অপেক্ষা করতে হবে না।</p>
					</article>
                    <article class="card">
                        <h3>কম্পাউন্ডার ড্যাশবোর্ড</h3>
                        <p>
                            অ্যাপয়েন্টমেন্ট ম্যানেজমেন্ট, রোগীর স্ট্যাটাস আপডেট, বুকিং বাতিল, রিপোর্ট আপলোডসহ কম্পাউন্ডারের প্রয়োজনীয় সব কাজ এক ড্যাশবোর্ডে।
                        </p>
                    </article>
                    <article class="card">
                        <h3>মোবাইলে প্রেসক্রিপশন</h3>
                        <p>
                            প্রেসক্রিপশন তৈরি করার পর SMS এর মাধ্যমে সরাসরি রোগীর মোবাইল নম্বরে পাঠাতে পারবেন।
                        </p>
                    </article>
				</div>
			</div>
		</section>



		<section class="section" id="leadForm">
			<div class="wrap">
				<div class="cta-box">
					<h3>ডেমো বা প্রাইসিং জানতে চান?</h3>
					<p>ফর্মটি পূরণ করলে আমরা দ্রুত যোগাযোগ করবো। আপনার বিজ্ঞাপনের সোর্স (Facebook/Google) server-side tracking এ সংরক্ষণ হবে।</p>

					<form class="lead-form" id="purchaseLeadForm" novalidate>
						<div class="row">
							<div class="field">
								<label for="name">নাম</label>
								<input id="name" name="name" type="text" required placeholder="ডা. আপনার নাম">
							</div>
							<div class="field">
								<label for="phone">মোবাইল</label>
								<input id="phone" name="phone" type="tel" required placeholder="01XXXXXXXXX">
							</div>
						</div>

						<div class="row">
							<div class="field">
								<label for="email">ইমেইল (ঐচ্ছিক)</label>
								<input id="email" name="email" type="email" placeholder="doctor@example.com">
							</div>
							<div class="field">
								<label for="subject">বিষয়</label>
								<input id="subject" name="subject" type="text" required value="ডেমো/প্রাইসিং জানতে চাই">
							</div>
						</div>

						<div class="field">
							<label for="message">মেসেজ</label>
							<textarea id="message" name="message" required placeholder="চেম্বারের সংখ্যা, স্পেশালিটি বা আপনার চাহিদা লিখুন"></textarea>
						</div>

						<button class="btn btn-primary" id="leadSubmitBtn" type="submit" data-track-click="lead_submit_click">ডেমো রিকোয়েস্ট পাঠান</button>
						<div class="note">টিপ: আপনি চাইলে একই সাথে বুকিং পেজও দেখতে পারেন।</div>
						<div class="status" id="formStatus"></div>
					</form>
				</div>
			</div>
		</section>
	</main>

	<footer>
		Doctor Booking & Prescription Digital System
	</footer>

	<script>
		(function () {
			const params = new URLSearchParams(window.location.search);
			const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
			const trackingUrl = "{{ route('purchase.track') }}";

			const utm = {
				source: params.get('utm_source'),
				medium: params.get('utm_medium'),
				campaign: params.get('utm_campaign'),
				content: params.get('utm_content'),
				term: params.get('utm_term')
			};

			const adIds = {
				fbclid: params.get('fbclid'),
				gclid: params.get('gclid'),
				wbraid: params.get('wbraid'),
				gbraid: params.get('gbraid')
			};

			function makeEventId() {
				if (window.crypto && typeof window.crypto.randomUUID === 'function') {
					return window.crypto.randomUUID();
				}

				return 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
			}

			function cleanObject(input) {
				const out = {};
				Object.keys(input || {}).forEach(function (key) {
					const value = input[key];
					if (value !== null && value !== undefined && value !== '') {
						out[key] = value;
					}
				});
				return out;
			}

			function trackEvent(eventName, metadata) {
				return fetch(trackingUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json',
						'X-CSRF-TOKEN': csrf
					},
					credentials: 'same-origin',
					keepalive: true,
					body: JSON.stringify({
						event_name: eventName,
						event_id: makeEventId(),
						page_url: window.location.href,
						referrer: document.referrer || null,
						utm: cleanObject(utm),
						ad_ids: cleanObject(adIds),
						metadata: metadata || {}
					})
				}).catch(function () {
					return null;
				});
			}

			trackEvent('page_view', {
				page: 'purchase_landing'
			});

			document.querySelectorAll('[data-track-click]').forEach(function (el) {
				el.addEventListener('click', function () {
					trackEvent('cta_click', {
						label: el.getAttribute('data-track-click') || 'unknown'
					});
				});
			});

			const leadForm = document.getElementById('purchaseLeadForm');
			const submitBtn = document.getElementById('leadSubmitBtn');
			const statusBox = document.getElementById('formStatus');

			function showStatus(type, message) {
				statusBox.className = 'status ' + type;
				statusBox.textContent = message;
			}

			if (leadForm) {
				leadForm.addEventListener('submit', async function (e) {
					e.preventDefault();

					const formData = new FormData(leadForm);
					const payload = {
						name: String(formData.get('name') || '').trim(),
						phone: String(formData.get('phone') || '').trim(),
						email: String(formData.get('email') || '').trim() || null,
						subject: String(formData.get('subject') || '').trim(),
						message: String(formData.get('message') || '').trim()
					};

					if (!payload.name || !payload.phone || !payload.subject || !payload.message) {
						showStatus('err', 'অনুগ্রহ করে প্রয়োজনীয় সব তথ্য পূরণ করুন।');
						return;
					}

					submitBtn.disabled = true;
					submitBtn.textContent = 'পাঠানো হচ্ছে...';
					statusBox.className = 'status';
					statusBox.textContent = '';

					await trackEvent('lead_submit_attempt', {
						has_email: !!payload.email
					});

					try {
						const res = await fetch('/api/public/contact', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								'Accept': 'application/json'
							},
							body: JSON.stringify(payload)
						});

						const data = await res.json().catch(function () {
							return {};
						});

						if (!res.ok) {
							throw new Error(data.message || 'Request failed');
						}

						showStatus('ok', 'ধন্যবাদ। আপনার রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে। আমরা দ্রুত যোগাযোগ করবো।');
						leadForm.reset();
						await trackEvent('lead_submit_success', {
							via: 'api_public_contact'
						});
					} catch (error) {
						showStatus('err', 'রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
						await trackEvent('lead_submit_failed', {
							reason: String(error && error.message ? error.message : 'unknown')
						});
					} finally {
						submitBtn.disabled = false;
						submitBtn.textContent = 'ডেমো রিকোয়েস্ট পাঠান';
					}
				});
			}
		})();
	</script>
</body>
</html>