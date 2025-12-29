# DoctorBooking — API Notes (Flutter/Mobile)

এই ফাইলটা **API routes + usage** এর জন্য। Base URL: `/api/...`

## Auth
- Token auth: **Laravel Sanctum**
- Header:
  - `Authorization: Bearer <token>`
  - `Accept: application/json`

## 1) Auth APIs
### POST `/api/auth/login`
- Purpose: Login and get token

### GET `/api/auth/me`
- Auth: required
- Purpose: Current user

### POST `/api/auth/logout`
- Auth: required

## 2) Public APIs (No Auth)
### GET `/api/public/available-slots/{date}`
- `date` format: `YYYY-MM-DD`
- Returns slots + booked info (today হলে past slots filtered)

### GET `/api/public/doctor-unavailable-ranges`
- Returns doctor unavailable ranges + closed weekdays

### POST `/api/public/book-appointment`
- Creates appointment request (public booking)

## 3) User APIs (role:user)
### GET `/api/user/appointments`
### GET `/api/user/prescriptions`

## 4) Doctor APIs (role:doctor)
### GET `/api/doctor/appointments`
### POST `/api/doctor/appointments/{appointment}/status`
- Body: `{ "status": "..." }`

### GET `/api/doctor/schedule`
### POST `/api/doctor/schedule`
- Updates doctor schedule + unavailable ranges

### GET `/api/doctor/prescriptions`
### GET `/api/doctor/prescriptions/{prescription}`
### POST `/api/doctor/prescriptions`
- Creates prescription (doctor-only)

## 5) Assistant/Admin APIs (role:admin)
### GET `/api/admin/users`
### GET `/api/admin/appointments`
### POST `/api/admin/appointments/{appointment}/status`

## 6) Site Content APIs (Admin Settings Content)
এইটা **Admin Settings** (home JSON content) Flutter/mobile থেকে পড়ার জন্য বানানো হয়েছে।

### Public Read
- GET `/api/public/site-content/home`
- Response:
  - `{ "key": "home", "value": { ... } }`

### Admin Manage (Optional)
- PUT `/api/admin/site-content/home`
  - Body: `{ "home_json": "{...json string...}" }`
- POST `/api/admin/site-content/upload`
  - FormData: `image` file
  - Response: `{ "url": "/site-content/<file>" }`

## Notes
- API role middleware ব্যবহার হয়: `role:user`, `role:doctor`, `role:admin`.
- Mobile side এ সবসময় `Accept: application/json` পাঠানো recommended (so errors JSON থাকে)।

---

## 7) Flutter (Dio) Sample Requests

> Tip: এখানে short samples দিলাম। Project এ বড় guide চাইলে `FLUTTER_API_GUIDE.md` আছে।

### A) Dio setup (Base URL + Token)

```dart
import 'package:dio/dio.dart';

class ApiClient {
  ApiClient(String baseUrl)
      : dio = Dio(
          BaseOptions(
            baseUrl: baseUrl, // example: https://doctorbooking.test/api
            headers: {
              'Accept': 'application/json',
            },
          ),
        );

  final Dio dio;
  String? _token;

  void setToken(String? token) {
    _token = token;
    if (token == null || token.isEmpty) {
      dio.options.headers.remove('Authorization');
    } else {
      dio.options.headers['Authorization'] = 'Bearer $token';
    }
  }
}
```

### B) Login (Token নেওয়া)

Request:
- `POST /api/auth/login`

```dart
Future<void> login(ApiClient api, String email, String password) async {
  final res = await api.dio.post<Map<String, dynamic>>(
    '/auth/login',
    data: {
      'email': email,
      'password': password,
      'device_name': 'flutter',
    },
  );

  final token = res.data?['token'] as String?;
  if (token == null) throw Exception('Missing token');

  api.setToken(token);
}
```

Response shape (example):
```json
{
  "token": "...",
  "token_type": "Bearer",
  "user": {"id": 1, "name": "...", "email": "...", "role": "doctor", "phone": "..."}
}
```

### C) Call protected endpoint (Example)

```dart
Future<List<dynamic>> doctorAppointments(ApiClient api) async {
  final res = await api.dio.get<Map<String, dynamic>>('/doctor/appointments');
  return (res.data?['appointments'] as List<dynamic>?) ?? [];
}
```

### D) Public: Available slots

`GET /api/public/available-slots/{date}` (example: `2025-12-29`)

```dart
Future<Map<String, dynamic>> availableSlots(ApiClient api, String dateYmd) async {
  final res = await api.dio.get<Map<String, dynamic>>('/public/available-slots/$dateYmd');
  return res.data ?? {};
}
```

### E) Public: Book appointment

`POST /api/public/book-appointment`

```dart
Future<void> bookAppointment(ApiClient api) async {
  final res = await api.dio.post<Map<String, dynamic>>(
    '/public/book-appointment',
    data: {
      'name': 'John Doe',
      'phone': '017xxxxxxxx',
      'email': 'john@example.com',
      'date': '2025-12-29',
      'time': '10:30',
      'message': 'Headache for 2 days',
    },
  );

  if ((res.data?['status'] as String?) != 'success') {
    throw Exception(res.data?['message'] ?? 'Booking failed');
  }
}
```

### F) Public: Site content (Home)

`GET /api/public/site-content/home`

```dart
Future<Map<String, dynamic>> getHomeContent(ApiClient api) async {
  final res = await api.dio.get<Map<String, dynamic>>('/public/site-content/home');
  return res.data ?? {};
}
```

### G) Admin: Update home content (Optional)

`PUT /api/admin/site-content/home` (requires admin token)

```dart
import 'dart:convert';

Future<void> adminUpdateHome(ApiClient api, Map<String, dynamic> homeValue) async {
  final res = await api.dio.put<Map<String, dynamic>>(
    '/admin/site-content/home',
    data: {
      // Backend expects JSON string
      'home_json': jsonEncode(homeValue),
    ),
  );

  if ((res.data?['status'] as String?) != 'success') {
    throw Exception(res.data?['message'] ?? 'Update failed');
  }
}
```

> Note: Backend validation currently expects `home_json` as a JSON string.
> If আপনি চান Flutter থেকে direct object পাঠাতে, বললে endpoint টা object-friendly করে দিব।

### H) Admin: Upload image (Optional)

`POST /api/admin/site-content/upload` (multipart/form-data)

```dart
import 'package:dio/dio.dart';

Future<String> adminUploadImage(ApiClient api, String filePath) async {
  final form = FormData.fromMap({
    'image': await MultipartFile.fromFile(filePath),
  });

  final res = await api.dio.post<Map<String, dynamic>>(
    '/admin/site-content/upload',
    data: form,
  );

  final url = res.data?['url'] as String?;
  if (url == null) throw Exception('Missing url');
  return url;
}
```

### I) Postman quick hints
- Base: `http(s)://doctorbooking.test/api`
- Protected routes header:
  - `Authorization: Bearer <token>`
  - `Accept: application/json`
- Upload route: Body → `form-data` → key `image` (type: File)

