# Flutter API Guide (DoctorBooking)

This project exposes a token-based REST API for a Flutter mobile app.

- Base URL: `https://YOUR_DOMAIN/api`
- Auth: Laravel Sanctum Personal Access Tokens
- Send token as header: `Authorization: Bearer <token>`

## 1) Auth

### Login
`POST /api/auth/login`

Request JSON:
```json
{
  "email": "doctor@example.com",
  "password": "password",
  "device_name": "flutter"
}
```

Response JSON:
```json
{
  "token": "...",
  "token_type": "Bearer",
  "user": {"id": 1, "name": "...", "email": "...", "role": "doctor", "phone": "..."}
}
```

### Me
`GET /api/auth/me` (auth)

### Logout
`POST /api/auth/logout` (auth)

## 2) Public booking (no auth)

### Available slots
`GET /api/public/available-slots/{date}`
- `date` format: `YYYY-MM-DD`

### Doctor unavailable ranges
`GET /api/public/doctor-unavailable-ranges`

### Book appointment
`POST /api/public/book-appointment`

## 3) User APIs (auth + role:user)

- `GET /api/user/appointments`
- `GET /api/user/prescriptions`

## 4) Doctor APIs (auth + role:doctor)

- `GET /api/doctor/appointments`
- `POST /api/doctor/appointments/{appointment}/status` body: `{ "status": "approved" }`
- `GET /api/doctor/schedule`
- `POST /api/doctor/schedule` (same payload as web schedule save)
- `GET /api/doctor/prescriptions`
- `GET /api/doctor/prescriptions/{id}`
- `POST /api/doctor/prescriptions` (creates, returns JSON)

## 5) Admin APIs (auth + role:admin)

- `GET /api/admin/users`
- `GET /api/admin/appointments`
- `POST /api/admin/appointments/{appointment}/status` body: `{ "status": "cancelled" }`

---

# Flutter (Dio) quick start

## Dependencies
Add in `pubspec.yaml`:
- `dio`
- `flutter_secure_storage`

## API client

```dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  ApiClient(this.baseUrl)
      : _dio = Dio(BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 20),
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        ));

  final String baseUrl;
  final Dio _dio;
  final _storage = const FlutterSecureStorage();

  Future<void> setToken(String token) async {
    await _storage.write(key: 'token', value: token);
  }

  Future<String?> getToken() => _storage.read(key: 'token');

  Future<void> clearToken() => _storage.delete(key: 'token');

  Future<Response<T>> request<T>(
    String method,
    String path, {
    Object? data,
    Map<String, dynamic>? query,
  }) async {
    final token = await getToken();

    return _dio.request<T>(
      path,
      data: data,
      queryParameters: query,
      options: Options(
        method: method,
        headers: token == null ? null : {'Authorization': 'Bearer $token'},
      ),
    );
  }
}
```

## Login example

```dart
Future<void> login(ApiClient api, String email, String password) async {
  final res = await api.request<Map<String, dynamic>>(
    'POST',
    '/auth/login',
    data: {
      'email': email,
      'password': password,
      'device_name': 'flutter',
    },
  );

  final token = res.data?['token'] as String?;
  if (token == null) throw Exception('Missing token');
  await api.setToken(token);
}
```

## Calling a protected endpoint

```dart
Future<List<dynamic>> doctorAppointments(ApiClient api) async {
  final res = await api.request<Map<String, dynamic>>('GET', '/doctor/appointments');
  return (res.data?['appointments'] as List<dynamic>?) ?? [];
}
```

## Error handling notes

- `422` = validation error (Laravel). `response.data['errors']` may exist.
- `401/403` = auth/role issue. Clear token and redirect to login.

---

# Local dev notes

If you test on Android emulator, your base URL is usually:
- `http://10.0.2.2` instead of `http://127.0.0.1`

Example:
- `http://10.0.2.2/doctorbooking/public/api`

(Adjust depending on Laragon virtual host / public path.)
