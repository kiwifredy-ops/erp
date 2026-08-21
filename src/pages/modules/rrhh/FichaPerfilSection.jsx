import { useState } from 'react';
import { AlertTriangle, Pencil } from 'lucide-react';
import {
  editarPerfilEmpleado,
  AFPS,
  ISAPRES,
  ESTADOS_CIVILES,
  GRUPOS_SANGUINEOS,
  CLASES_LICENCIA,
} from '../../../lib/rrhhStore';

const toDateInput = (v) => (v ? new Date(v).toISOString().slice(0, 10) : '');

function formatDireccion(e) {
  const calleNumero = [e.direccionCalle, e.direccionNumero].filter(Boolean).join(' ');
  return [calleNumero, e.direccionComuna, e.direccionCiudad].filter(Boolean).join(', ');
}

function diasHasta(fecha) {
  if (!fecha) return null;
  const ms = new Date(fecha).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

export default function FichaPerfilSection({ empleado, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const diasContrato = diasHasta(empleado.fechaTerminoContrato);
  const diasCedula = diasHasta(empleado.rutVencimiento);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const cambios = {
      fechaTerminoContrato: form.get('fechaTerminoContrato') || null,
      afp: form.get('afp'),
      isapre: form.get('isapre'),
      isapreAdicional: form.get('isapreAdicional'),
      estadoCivil: form.get('estadoCivil'),
      direccionCalle: form.get('direccionCalle'),
      direccionNumero: form.get('direccionNumero'),
      direccionComuna: form.get('direccionComuna'),
      direccionCiudad: form.get('direccionCiudad'),
      contactoEmergenciaNombre: form.get('contactoEmergenciaNombre'),
      contactoEmergenciaTelefono: form.get('contactoEmergenciaTelefono'),
      grupoSanguineo: form.get('grupoSanguineo'),
      alergias: form.get('alergias'),
      tratamientoMedico: form.get('tratamientoMedico'),
      licenciaConducir: form.get('licenciaConducir') === 'on',
      licenciaClase: form.get('licenciaClase'),
      rutSerie: form.get('rutSerie'),
      rutVencimiento: form.get('rutVencimiento') || null,
    };
    setError('');
    setSaving(true);
    try {
      await editarPerfilEmpleado(empleado.id, cambios);
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(err.message || 'No se pudo guardar la ficha.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {diasContrato !== null && diasContrato <= 5 && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 text-xs font-medium rounded-md px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {diasContrato < 0
            ? `El contrato venció hace ${Math.abs(diasContrato)} día(s).`
            : diasContrato === 0
            ? 'El contrato vence hoy.'
            : `El contrato vence en ${diasContrato} día(s).`}
        </div>
      )}
      {diasCedula !== null && diasCedula <= 30 && (
        <div className="flex items-center gap-2 bg-amber-50 text-amber-700 text-xs font-medium rounded-md px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {diasCedula < 0
            ? `La cédula de identidad venció hace ${Math.abs(diasCedula)} día(s).`
            : diasCedula === 0
            ? 'La cédula de identidad vence hoy.'
            : `La cédula de identidad vence en ${diasCedula} día(s).`}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Ficha completa</p>
        {!editing && (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline">
            <Pencil className="w-3 h-3" /> Editar
          </button>
        )}
      </div>

      {!editing ? (
        <div className="bg-slate-50 rounded-lg p-4 space-y-4 text-sm">
          <Grupo titulo="Contrato">
            <Row label="Término de contrato" value={toDateInput(empleado.fechaTerminoContrato) || 'Sin fecha de término'} />
          </Grupo>
          <Grupo titulo="Previsión">
            <Row label="AFP" value={empleado.afp || '—'} />
            <Row label="Isapre" value={empleado.isapre || '—'} />
            <Row label="Plan adicional" value={empleado.isapreAdicional || '—'} />
          </Grupo>
          <Grupo titulo="Datos personales">
            <Row label="Estado civil" value={empleado.estadoCivil || '—'} />
            <Row label="Dirección" value={formatDireccion(empleado) || '—'} />
          </Grupo>
          <Grupo titulo="Contacto de emergencia">
            <Row label="Nombre" value={empleado.contactoEmergenciaNombre || '—'} />
            <Row label="Teléfono" value={empleado.contactoEmergenciaTelefono || '—'} />
          </Grupo>
          <Grupo titulo="Salud">
            <Row label="Grupo sanguíneo" value={empleado.grupoSanguineo || '—'} />
            <Row label="Alergias" value={empleado.alergias || 'Ninguna registrada'} />
            <Row label="Tratamiento médico" value={empleado.tratamientoMedico || 'Ninguno registrado'} />
          </Grupo>
          <Grupo titulo="Licencia de conducir">
            <Row label="Tiene licencia" value={empleado.licenciaConducir ? `Sí — Clase ${empleado.licenciaClase || '—'}` : 'No'} />
          </Grupo>
          <Grupo titulo="Cédula de identidad">
            <Row label="N° de serie" value={empleado.rutSerie || '—'} />
            <Row label="Vencimiento" value={toDateInput(empleado.rutVencimiento) || '—'} />
          </Grupo>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-slate-50 rounded-lg p-4 space-y-4">
          <Grupo titulo="Contrato">
            <Field label="Término de contrato (plazo fijo)">
              <input type="date" name="fechaTerminoContrato" defaultValue={toDateInput(empleado.fechaTerminoContrato)} className="input" />
            </Field>
          </Grupo>

          <Grupo titulo="Previsión">
            <div className="grid grid-cols-2 gap-3">
              <Field label="AFP">
                <select name="afp" defaultValue={empleado.afp || ''} className="input">
                  <option value="">Sin registrar</option>
                  {AFPS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </Field>
              <Field label="Isapre">
                <select name="isapre" defaultValue={empleado.isapre || ''} className="input">
                  <option value="">Sin registrar</option>
                  {ISAPRES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </Field>
              <Field label="Plan adicional Isapre" span2>
                <input name="isapreAdicional" defaultValue={empleado.isapreAdicional || ''} placeholder="Ej. Plan dental complementario" className="input" />
              </Field>
            </div>
          </Grupo>

          <Grupo titulo="Datos personales">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Estado civil">
                <select name="estadoCivil" defaultValue={empleado.estadoCivil || ''} className="input">
                  <option value="">Sin registrar</option>
                  {ESTADOS_CIVILES.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </Field>
              <div />
              <Field label="Calle">
                <input name="direccionCalle" defaultValue={empleado.direccionCalle || ''} className="input" />
              </Field>
              <Field label="Número">
                <input name="direccionNumero" defaultValue={empleado.direccionNumero || ''} className="input" />
              </Field>
              <Field label="Comuna">
                <input name="direccionComuna" defaultValue={empleado.direccionComuna || ''} className="input" />
              </Field>
              <Field label="Ciudad">
                <input name="direccionCiudad" defaultValue={empleado.direccionCiudad || ''} className="input" />
              </Field>
            </div>
          </Grupo>

          <Grupo titulo="Contacto de emergencia">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombre">
                <input name="contactoEmergenciaNombre" defaultValue={empleado.contactoEmergenciaNombre || ''} className="input" />
              </Field>
              <Field label="Teléfono">
                <input name="contactoEmergenciaTelefono" defaultValue={empleado.contactoEmergenciaTelefono || ''} className="input" />
              </Field>
            </div>
          </Grupo>

          <Grupo titulo="Salud">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Grupo sanguíneo">
                <select name="grupoSanguineo" defaultValue={empleado.grupoSanguineo || ''} className="input">
                  <option value="">Sin registrar</option>
                  {GRUPOS_SANGUINEOS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <div />
              <Field label="Alergias" span2>
                <textarea name="alergias" defaultValue={empleado.alergias || ''} rows={2} className="input" placeholder="Ej. Alergia a la penicilina" />
              </Field>
              <Field label="Tratamiento médico en curso" span2>
                <textarea name="tratamientoMedico" defaultValue={empleado.tratamientoMedico || ''} rows={2} className="input" />
              </Field>
            </div>
          </Grupo>

          <Grupo titulo="Licencia de conducir">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="licenciaConducir" defaultChecked={empleado.licenciaConducir} className="rounded border-slate-300" />
              Tiene licencia de conducir
            </label>
            <Field label="Clase">
              <select name="licenciaClase" defaultValue={empleado.licenciaClase || ''} className="input">
                <option value="">Sin registrar</option>
                {CLASES_LICENCIA.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </Grupo>

          <Grupo titulo="Cédula de identidad">
            <div className="grid grid-cols-2 gap-3">
              <Field label="N° de serie">
                <input name="rutSerie" defaultValue={empleado.rutSerie || ''} className="input" />
              </Field>
              <Field label="Fecha de vencimiento">
                <input type="date" name="rutVencimiento" defaultValue={toDateInput(empleado.rutVencimiento)} className="input" />
              </Field>
            </div>
          </Grupo>

          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs rounded-md text-slate-600 hover:bg-slate-200">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="px-3 py-1.5 text-xs rounded-md bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-medium">
              {saving ? 'Guardando...' : 'Guardar ficha'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Grupo({ titulo, children }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{titulo}</p>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800 text-right">{value}</span>
    </div>
  );
}

function Field({ label, children, span2 }) {
  return (
    <label className={`block ${span2 ? 'col-span-2' : ''}`}>
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
