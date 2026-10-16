import React, { useState, useRef } from 'react';
import { 
  Laptop, 
  X, 
  PlusCircle, 
  Tag, 
  MapPin, 
  Hash, 
  AlertTriangle, 
  Camera, 
  Upload, 
  Link as LinkIcon, 
  Trash2,
  Sparkles
} from 'lucide-react';

interface CreateResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateResource: (resource: { nombre: string; categoria: string; serial: string; ubicacion_actual: string }) => Promise<void>;
  isLoading: boolean;
}

export const CreateResourceModal: React.FC<CreateResourceModalProps> = ({
  isOpen,
  onClose,
  onCreateResource,
  isLoading
}) => {
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('computo');
  const [serial, setSerial] = useState('');
  const [ubicacionActual, setUbicacionActual] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Estados para adjuntar fotografía del recurso
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo de imagen supera los 5MB permitidos.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImagePreview(reader.result);
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (url: string) => {
    setImageUrlInput(url);
    setImagePreview(url.trim());
  };

  const handleClearImage = () => {
    setImagePreview('');
    setImageUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError('El nombre del equipo es obligatorio.');
      return;
    }
    if (!serial.trim()) {
      setError('El serial único del equipo es obligatorio.');
      return;
    }
    if (!ubicacionActual.trim()) {
      setError('La ubicación o sala de custodia es obligatoria.');
      return;
    }

    const cleanSerial = serial.trim().toUpperCase();

    try {
      await onCreateResource({
        nombre: nombre.trim(),
        categoria,
        serial: cleanSerial,
        ubicacion_actual: ubicacionActual.trim()
      });

      // Guardar imagen en localStorage vinculada al serial sin romper el backend
      if (imagePreview) {
        try {
          const stored = localStorage.getItem('campus_resource_images');
          const imagesMap: Record<string, string> = stored ? JSON.parse(stored) : {};
          imagesMap[cleanSerial] = imagePreview;
          localStorage.setItem('campus_resource_images', JSON.stringify(imagesMap));
          // Emitir evento para actualización en tiempo real en la vista
          window.dispatchEvent(new Event('storage'));
        } catch (storageErr) {
          console.error('Error guardando imagen en localStorage:', storageErr);
        }
      }

      // Limpiar formulario y cerrar
      setNombre('');
      setCategoria('computo');
      setSerial('');
      setUbicacionActual('');
      setImagePreview('');
      setImageUrlInput('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al registrar el equipo.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="glass-panel max-w-md w-full rounded-2xl p-4 sm:p-6 relative border border-white/20 shadow-2xl animate-in zoom-in-95 duration-200 my-4 sm:my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-campus-teal/20 text-campus-teal border border-campus-teal/30">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Agregar Equipo Tecnológico</h2>
            <p className="text-[11px] font-mono text-campus-teal uppercase tracking-wider">
              Control de Inventario Campuslands
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-5 leading-relaxed">
          Ingresa un nuevo activo tecnológico al inventario central. Se le asignará seguimiento digital, fotografía y disponibilidad para reservas de campers y trainers.
        </p>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre del Equipo */}
          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1.5">
              Nombre o Modelo del Equipo *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Laptop Dell XPS Dev Lab, Proyector Láser 4K"
              className="w-full bg-[#0c1830] border border-white/20 rounded-xl p-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-campus-teal focus:ring-1 focus:ring-campus-teal/40"
              required
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-campus-cyan" />
              Categoría Tecnológica *
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full bg-[#0c1830] border border-white/20 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-campus-teal focus:ring-1 focus:ring-campus-teal/40 cursor-pointer"
            >
              <option value="computo">Cómputo / Laptops</option>
              <option value="audiovisual">Audiovisual / Proyectores</option>
              <option value="audio">Audio / Microfonía</option>
              <option value="redes">Redes / Telecom</option>
              <option value="otro">Accesorios / Otro</option>
            </select>
          </div>

          {/* Serial Único */}
          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-campus-teal" />
              Serial Único / Placa de Inventario *
            </label>
            <input
              type="text"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              placeholder="Ej. DEV-XPS-009, PRJ-4K-003"
              className="w-full bg-[#0c1830] border border-white/20 rounded-xl p-2.5 text-xs font-mono uppercase text-white placeholder-slate-400 focus:outline-none focus:border-campus-teal focus:ring-1 focus:ring-campus-teal/40"
              required
            />
          </div>

          {/* Ubicación Actual */}
          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              Ubicación Inicial / Sala Asignada *
            </label>
            <input
              type="text"
              value={ubicacionActual}
              onChange={(e) => setUbicacionActual(e.target.value)}
              placeholder="Ej. Skilab, Apolo, Almacén Central"
              className="w-full bg-[#0c1830] border border-white/20 rounded-xl p-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-campus-teal focus:ring-1 focus:ring-campus-teal/40"
              required
            />
          </div>

          {/* Adjuntar Fotografía del Equipo */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-campus-teal" />
                Fotografía del Recurso (Opcional)
              </label>

              {/* Selector de modo: Subir Archivo o URL */}
              <div className="flex items-center gap-1 bg-[#071124] p-0.5 rounded-lg border border-white/10 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`px-2 py-0.5 rounded flex items-center gap-1 transition ${
                    uploadMode === 'file'
                      ? 'bg-campus-teal/20 text-campus-teal font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Upload className="w-3 h-3" /> Archivo
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className={`px-2 py-0.5 rounded flex items-center gap-1 transition ${
                    uploadMode === 'url'
                      ? 'bg-campus-teal/20 text-campus-teal font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <LinkIcon className="w-3 h-3" /> URL
                </button>
              </div>
            </div>

            {uploadMode === 'file' ? (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="resource-image-upload"
                />
                <label
                  htmlFor="resource-image-upload"
                  className="w-full flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border border-dashed border-white/20 hover:border-campus-teal/50 bg-[#0c1830]/50 hover:bg-[#0c1830] cursor-pointer transition text-center group"
                >
                  <Upload className="w-5 h-5 text-slate-400 group-hover:text-campus-teal mb-1 transition" />
                  <span className="text-xs text-slate-300 font-medium group-hover:text-white">
                    Subir foto desde tu equipo
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    PNG, JPG, WebP hasta 5MB (Base64)
                  </span>
                </label>
              </div>
            ) : (
              <div>
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://ejemplo.com/fotos/laptop.jpg"
                  className="w-full bg-[#0c1830] border border-white/20 rounded-xl p-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-campus-teal focus:ring-1 focus:ring-campus-teal/40 font-mono"
                />
              </div>
            )}

            {/* Previsualización en vivo de la imagen */}
            {imagePreview && (
              <div className="mt-3 relative rounded-xl overflow-hidden border border-campus-teal/30 bg-[#030611] p-1.5 flex items-center gap-3">
                <img
                  src={imagePreview}
                  alt="Vista previa"
                  className="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0"
                />
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-1 text-[11px] font-mono text-campus-teal font-semibold">
                    <Sparkles className="w-3 h-3" /> Imagen Vinculada
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    Se asociará permanentemente al serial <span className="text-white font-mono">{serial || 'PENDIENTE'}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition shrink-0"
                  title="Eliminar imagen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-campus-teal to-campus-blue hover:opacity-90 text-white shadow-lg shadow-teal-500/20 transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isLoading ? 'Registrando...' : 'Registrar Equipo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
