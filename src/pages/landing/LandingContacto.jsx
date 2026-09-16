import { useState } from 'react';
import { MessageCircle, Mail, CheckCircle2 } from 'lucide-react';
import { enviarSolicitud } from '../../lib/leadsStore';

const WHATSAPP_URL = 'https://wa.me/56959930258';
const CONTACT_EMAIL = 'contacto@ofekgroup.cl';

const initialForm = { nombre: '', empresa: '', email: '', telefono: '', mensaje: '' };

export default function LandingContacto() {
  const [form, setForm] = useState(initialForm);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await enviarSolicitud(form);
      setEnviado(true);
      setForm(initialForm);
    } catch (err) {
      setError(err.message || 'No se pudo enviar la solicitud. Intenta nuevamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section id="contacto" className="max-w-6xl mx-auto px-5 sm:px-6 py-20 border-t border-white/10">
      <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white">Hablemos de tu operación</h2>
          <p className="mt-3 text-white/60 max-w-md leading-relaxed">
            Cuéntanos de tu empresa y te contactamos para definir el plan que más te acomoda. Si prefieres escribir
            directo, también puedes hacerlo por estos medios:
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm font-medium text-white bg-[#101E1C] border border-white/10 rounded-lg px-4 py-3 hover:border-[#57B4C0]/40 transition-colors w-fit"
            >
              <MessageCircle className="w-4.5 h-4.5 text-[#6FC79A]" /> Escríbenos por WhatsApp
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="flex items-center gap-3 text-sm font-medium text-white bg-[#101E1C] border border-white/10 rounded-lg px-4 py-3 hover:border-[#57B4C0]/40 transition-colors w-fit"
            >
              <Mail className="w-4.5 h-4.5 text-[#57B4C0]" /> {CONTACT_EMAIL}
            </a>
          </div>
        </div>

        <div className="bg-[#101E1C] border border-white/10 rounded-2xl p-6 sm:p-7">
          {enviado ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-10 gap-3">
              <CheckCircle2 className="w-10 h-10 text-[#6FC79A]" />
              <h3 className="text-lg font-semibold text-white">Solicitud enviada</h3>
              <p className="text-sm text-white/60 max-w-xs">Gracias por tu interés. Te contactaremos a la brevedad para conversar sobre tu plan.</p>
              <button onClick={() => setEnviado(false)} className="text-sm font-medium text-[#57B4C0] hover:text-[#82CBD3] mt-2">
                Enviar otra solicitud
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid sm:grid-cols-2 gap-3.5">
                <label className="block">
                  <span className="block text-xs font-medium text-white/60 mb-1">Nombre</span>
                  <input required value={form.nombre} onChange={(e) => set('nombre', e.target.value)} className="w-full rounded-lg bg-[#0A1413] border border-white/15 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#57B4C0]" placeholder="Tu nombre" />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-white/60 mb-1">Empresa</span>
                  <input required value={form.empresa} onChange={(e) => set('empresa', e.target.value)} className="w-full rounded-lg bg-[#0A1413] border border-white/15 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#57B4C0]" placeholder="Razón social" />
                </label>
              </div>
              <div className="grid sm:grid-cols-2 gap-3.5">
                <label className="block">
                  <span className="block text-xs font-medium text-white/60 mb-1">Correo electrónico</span>
                  <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="w-full rounded-lg bg-[#0A1413] border border-white/15 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#57B4C0]" placeholder="nombre@empresa.com" />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-white/60 mb-1">Teléfono</span>
                  <input required value={form.telefono} onChange={(e) => set('telefono', e.target.value)} className="w-full rounded-lg bg-[#0A1413] border border-white/15 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#57B4C0]" placeholder="+56 9 1234 5678" />
                </label>
              </div>
              <label className="block">
                <span className="block text-xs font-medium text-white/60 mb-1">Mensaje (opcional)</span>
                <textarea rows={3} value={form.mensaje} onChange={(e) => set('mensaje', e.target.value)} className="w-full rounded-lg bg-[#0A1413] border border-white/15 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#57B4C0] resize-none" placeholder="Cuéntanos brevemente qué necesitas" />
              </label>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={enviando}
                className="w-full text-sm font-semibold bg-[#C98A2E] hover:bg-[#B87A22] disabled:opacity-50 text-[#2A1B04] rounded-lg py-3 transition-colors"
              >
                {enviando ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
