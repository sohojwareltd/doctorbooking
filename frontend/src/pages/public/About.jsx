import { Head } from '@inertiajs/react';
import PublicLayout from '../../layouts/PublicLayout';

export default function About() {
  return (
    <>
      <Head title="About" />
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="mb-6 text-4xl font-bold text-[#005963]">About the Clinic</h1>
        <p className="text-lg text-gray-700 leading-relaxed">
          We provide advanced dermatology and aesthetic care with a patient-first approach. Our mission is to help you
          feel confident in your skin through evidence-based treatments and compassionate service.
        </p>
      </div>
    </>
  );
}

About.layout = (page) => <PublicLayout>{page}</PublicLayout>;
