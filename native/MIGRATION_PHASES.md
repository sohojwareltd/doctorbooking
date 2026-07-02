# Migration Module Tracker

## Controllers to port (33)

### API — Priority 1 (React/mobile depends on these)
- [x] `Api\AuthController` — login, register, me, logout, forgot/reset password
- [ ] `Api\PublicController` — booking, captcha, doctor, chambers, schedule
- [ ] `Api\DoctorController` — stats, appointments, patients, prescriptions, medicines
- [ ] `Api\PatientController` — profile, appointments, prescriptions, reports
- [ ] `Api\PrescriptionController` — store, update, messages, reports
- [ ] `Api\PrescriptionTemplateController`
- [ ] `Api\InvestigationTestController`
- [ ] `Api\CompoundController`
- [ ] `Api\SiteContentApiController`

### Web — Priority 2 (Inertia pages)
- [ ] `Web\PublicController`
- [ ] `Web\DashboardController`
- [ ] `Web\AppointmentController`
- [ ] `Web\PrescriptionController`
- [ ] `Web\ProfileController`
- [ ] `Web\PatientController`
- [ ] `Web\ChamberController`
- [ ] `Web\MedicineController`
- [ ] `Web\CompoundUserController`
- [ ] `DoctorScheduleController`
- [ ] `Settings\*`
- [ ] Fortify auth (login, register, 2FA)

### Services
- [ ] `AppointmentSlotService`
- [ ] `SmsService`

### Models (22)
- [x] User, Role, Patient
- [ ] Doctor, Compounder, Appointment, Chamber, Prescription, Medicine, Generic, Supplier, Category, InvestigationTest, SiteContent, …

## Cutover checklist
1. Port all `/api/*` routes to native
2. Port Fortify + Inertia web routes
3. Port mail, upload, queue CLI
4. Set `LARAVEL_BRIDGE=false`
5. Point vhost to `native/public` only
6. Remove Laravel from production deploy
