"use client"

import { useState } from "react"
import { Search, MapPin, Loader2, ArrowRight, Package } from "lucide-react"

// Types matching our backend schema
interface ProductoBase {
  id: number;
  ean?: string;
  nombre?: string;
  descripcion?: string;
  marca?: string;
  cantidad_presentacion?: number;
  unidad_medida?: string;
  categoria?: string;
  subcategoria?: string;
  imagen_url?: string;
}

export default function Home() {
  const [query, setQuery] = useState("")
  const [province, setProvince] = useState<string>("AR-C") // CABA por defecto
  const [locating, setLocating] = useState(false)

  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ProductoBase[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setHasSearched(true)

    try {
      // Llamada al backend FastAPI
      let url = `http://localhost:8000/api/productos/search?q=${encodeURIComponent(query)}`
      if (province) {
        url += `&provincia=${province}`
      }
      const res = await fetch(url)
      if (!res.ok) throw new Error("Error en la búsqueda")
      const data = await res.json()
      setResults(data)
    } catch (error) {
      console.error(error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleLocate = () => {
    setLocating(true)
    if (!navigator.geolocation) {
      alert("Geolocalización no soportada.")
      setLocating(false)
      return
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        const state = data.address?.state || "";

        let detected = "AR-C"; // Fallback CABA
        if (state.includes("Buenos Aires") && data.address?.city === "Buenos Aires") detected = "AR-C";
        else if (state.includes("Buenos Aires")) detected = "AR-B";
        else if (state.includes("Córdoba") || state.includes("Cordoba")) detected = "AR-X";
        else if (state.includes("Santa Fe")) detected = "AR-S";
        else if (state.includes("Mendoza")) detected = "AR-M";

        setProvince(detected);
      } catch (e) {
        console.error(e)
      } finally {
        setLocating(false)
      }
    }, () => {
      alert("No se pudo obtener la ubicación.")
      setLocating(false)
    })
  }

  return (
    <main className="flex-1 flex flex-col items-center p-4 py-12 relative overflow-x-hidden min-h-0">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10 mix-blend-multiply dark:mix-blend-lighten" />
      <div className="absolute top-1/4 right-1/4 w-[30rem] h-[30rem] bg-accent/30 rounded-full blur-3xl -z-10 mix-blend-multiply dark:mix-blend-lighten delay-1000" />

      <div className={`w-full max-w-3xl space-y-8 text-center transition-all duration-700 ease-in-out ${hasSearched ? 'mt-0' : 'mt-12 md:mt-24'}`}>
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground">
            Encuentra el <span className="text-primary">mejor precio</span> en tu zona.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Compara precios de supermercados en tiempo real. Deja de pagar de más por los mismos productos.
          </p>
        </div>

        <div className="glass rounded-2xl p-2 max-w-2xl mx-auto shadow-xl shadow-primary/5 dark:shadow-none animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-backwards">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Ej. Leche entera, yerba mate..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-4 rounded-xl bg-transparent border-none outline-none focus:ring-2 focus:ring-primary text-lg transition-all"
              />
            </div>

            <div className="h-14 sm:w-[1px] bg-border/50 hidden sm:block" />

            <div className="relative flex items-center min-w-[150px] bg-secondary/50 hover:bg-secondary rounded-xl transition-colors">
              <MapPin className="absolute left-3 w-4 h-4 text-primary pointer-events-none" />
              {locating ? (
                <div className="flex items-center pl-9 pr-4 h-14 w-full">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              ) : (
                <select
                  value={province}
                  onChange={(e) => {
                    if (e.target.value === "auto") {
                      handleLocate();
                    } else {
                      setProvince(e.target.value);
                    }
                  }}
                  className="w-full h-14 pl-9 pr-8 appearance-none bg-transparent border-none outline-none focus:ring-2 focus:ring-primary text-sm font-medium cursor-pointer"
                >
                  <option value="">Todo el país</option>
                  <option value="auto">📍 Ubicación actual</option>
                  <option value="AR-C">CABA</option>
                  <option value="AR-B">Buenos Aires</option>
                  <option value="AR-K">Catamarca</option>
                  <option value="AR-H">Chaco</option>
                  <option value="AR-U">Chubut</option>
                  <option value="AR-X">Córdoba</option>
                  <option value="AR-W">Corrientes</option>
                  <option value="AR-E">Entre Ríos</option>
                  <option value="AR-P">Formosa</option>
                  <option value="AR-Y">Jujuy</option>
                  <option value="AR-L">La Pampa</option>
                  <option value="AR-F">La Rioja</option>
                  <option value="AR-M">Mendoza</option>
                  <option value="AR-N">Misiones</option>
                  <option value="AR-Q">Neuquén</option>
                  <option value="AR-R">Río Negro</option>
                  <option value="AR-A">Salta</option>
                  <option value="AR-J">San Juan</option>
                  <option value="AR-D">San Luis</option>
                  <option value="AR-Z">Santa Cruz</option>
                  <option value="AR-S">Santa Fe</option>
                  <option value="AR-G">Sgo. del Estero</option>
                  <option value="AR-V">Tierra del Fuego</option>
                  <option value="AR-T">Tucumán</option>
                </select>
              )}
              {!locating && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
            >
              Buscar
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        </div>

        {!hasSearched && (
          <div className="pt-8 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground font-medium animate-in fade-in duration-700 delay-300 fill-mode-backwards">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Datos del SEPA</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> +2M de Precios</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Actualizado hoy</span>
          </div>
        )}
      </div>

      {/* Resultados de búsqueda */}
      {hasSearched && (
        <div className="w-full max-w-4xl mx-auto mt-12 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="font-medium">Buscando en supermercados de tu zona...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {results.map((prod) => (
                <div key={prod.id} className="glass p-5 rounded-2xl flex gap-4 items-start hover:bg-white/10 dark:hover:bg-white/5 transition-all cursor-pointer group shadow-sm hover:shadow-md">
                  <div className="bg-secondary p-2 rounded-xl group-hover:scale-110 transition-transform duration-300 w-16 h-16 flex items-center justify-center shrink-0 overflow-hidden">
                    {prod.imagen_url ? (
                      <img src={prod.imagen_url} alt={prod.nombre || prod.descripcion || "Producto"} className="w-full h-full object-contain" />
                    ) : (
                      <Package className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate" title={prod.nombre || prod.descripcion}>
                      {prod.nombre || prod.descripcion || "Producto sin nombre"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Marca: <span className="font-medium text-foreground">{prod.marca || "-"}</span>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
                        {prod.cantidad_presentacion} {prod.unidad_medida}
                      </span>
                      {prod.subcategoria && (
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          {prod.subcategoria}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 self-center" />
                </div>
              ))}
            </div>
          ) : (
            <div className="glass p-8 rounded-2xl flex flex-col items-center justify-center gap-3 text-muted-foreground text-center">
              <Search className="w-12 h-12 opacity-20" />
              <h3 className="text-xl font-medium text-foreground">No encontramos nada</h3>
              <p>Intenta con palabras más simples, o verifica que la provincia seleccionada sea correcta.</p>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
