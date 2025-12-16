import { Head, useForm } from '@inertiajs/react';
import PublicLayout from '../../layouts/PublicLayout';

export default function Contact() {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '', email: '', message: ''
  });

  const submit = (e) => {
    e.preventDefault();
    post('/contact', {
      onSuccess: () => reset(),
    });
  };

  return (
    <>
      <Head title="Contact" />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-6 text-4xl font-bold text-[#005963]">Contact Us</h1>
        <form onSubmit={submit} className="space-y-4">
          <input className="w-full rounded-xl border p-3" placeholder="Your name" value={data.name} onChange={(e)=>setData('name', e.target.value)} />
          <input className="w-full rounded-xl border p-3" placeholder="Your email" value={data.email} onChange={(e)=>setData('email', e.target.value)} />
          <textarea className="w-full rounded-xl border p-3" rows={5} placeholder="Message" value={data.message} onChange={(e)=>setData('message', e.target.value)} />
          <button disabled={processing} className="rounded-xl bg-[#005963] px-6 py-3 font-semibold text-white disabled:opacity-50">Send</button>
        </form>
        {errors && Object.keys(errors).length > 0 && (
          <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-rose-800">
            {Object.values(errors).join(', ')}
          </div>
        )}
      </div>
    </>
  );
}

Contact.layout = (page) => <PublicLayout>{page}</PublicLayout>;
