import { Link } from '@inertiajs/react';
import { CalendarCheck2 } from 'lucide-react';
import SectionWrapper, { SectionTitle } from '../SectionWrapper';
import GlassCard from '../GlassCard';
import PrimaryButton from '../PrimaryButton';

export default function BookingSection() {
    return (
        <SectionWrapper id="booking" className="bg-white">
            <div>
                <SectionTitle subtitle="Schedule your consultation and start your transformation journey">
                    Book Your Appointment
                </SectionTitle>

                <div className="mx-auto max-w-3xl">
                    <GlassCard variant="solid" className="p-8 sm:p-10 flex flex-col items-center text-center gap-4">
                        <div className="rounded-2xl border border-[#00acb1]/30 bg-[#00acb1]/10 p-3 mb-2">
                            <CalendarCheck2 className="h-10 w-10 text-[#005963]" />
                        </div>
                        <h3 className="text-2xl font-extrabold text-[#005963]">Online Booking Portal</h3>
                        <p className="text-sm text-gray-700 max-w-xl">
                            Use our dedicated multi-step booking page to choose your date, chamber, time slot, and provide your contact details with captcha protection.
                        </p>
                        <p className="text-xs text-gray-500">
                            You&apos;ll receive a serial number and estimated time after confirming your appointment.
                        </p>
                        <div className="mt-4">
                            <Link href="/book-appointment">
                                <PrimaryButton>
                                    Go to Booking Page
                                </PrimaryButton>
                            </Link>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </SectionWrapper>
    );
}
