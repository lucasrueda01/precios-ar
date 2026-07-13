"use client"

import { useState } from "react"
import { Search, MapPin, Loader2, ArrowRight, Package, Store, Calendar, Tag, ArrowUpDown, X, FilterX } from "lucide-react"

// Types matching our backend schema
interface ProductoBase {
  producto_id?: number;
  id?: number;
  ean?: string;
  id_comercio?: number;
  id_producto?: string;
  nombre?: string;
  marca?: string;
  cantidad_presentacion?: number | string;
  unidad_medida?: string;
  categoria?: string;
  subcategoria?: string;
  imagen_url?: string;
  id_bandera?: number;
  id_sucursal?: number;
  bandera_nombre?: string;
  provincia?: string;
  localidad?: string;
  precio_lista?: number | string;
  precio_promo1?: number | string;
  leyenda_promo1?: string;
  precio_promo2?: number | string;
  leyenda_promo2?: string;
  precio_fecha?: string;
}

const PROVINCIAS_MAP: Record<string, string> = {
  "AR-C": "CABA",
  "AR-B": "Buenos Aires",
  "AR-K": "Catamarca",
  "AR-H": "Chaco",
  "AR-U": "Chubut",
  "AR-X": "Córdoba",
  "AR-W": "Corrientes",
  "AR-E": "Entre Ríos",
  "AR-P": "Formosa",
  "AR-Y": "Jujuy",
  "AR-L": "La Pampa",
  "AR-F": "La Rioja",
  "AR-M": "Mendoza",
  "AR-N": "Misiones",
  "AR-Q": "Neuquén",
  "AR-R": "Río Negro",
  "AR-A": "Salta",
  "AR-J": "San Juan",
  "AR-D": "San Luis",
  "AR-Z": "Santa Cruz",
  "AR-S": "Santa Fe",
  "AR-G": "Santiago del Estero",
  "AR-V": "Tierra del Fuego",
  "AR-T": "Tucumán",
};

function getProvinciaNombre(codigo?: string): string {
  if (!codigo) return "";
  return PROVINCIAS_MAP[codigo] || codigo;
}

function formatCantidad(cantidad?: number | string): string {
  if (cantidad === undefined || cantidad === null || cantidad === "") return "";
  const num = typeof cantidad === "string" ? Number(cantidad.replace(",", ".")) : Number(cantidad);
  if (isNaN(num)) return String(cantidad);
  return num.toLocaleString("es-AR", { maximumFractionDigits: 3 });
}

function formatUnidad(unidad?: string): string {
  if (!unidad) return "";
  const u = unidad.trim().toLowerCase();
  const mapa: Record<string, string> = {
    gr: "gr",
    grs: "gr",
    g: "gr",
    lt: "lt",
    lts: "lt",
    l: "lt",
    cc: "cc",
    ml: "ml",
    kg: "kg",
    kgs: "kg",
    un: "un",
    u: "un",
    und: "un",
    unidades: "un",
  };
  return mapa[u] || u;
}

export default function Home() {
  const [query, setQuery] = useState("")
  const [province, setProvince] = useState<string>("AR-C") // CABA por defecto
  const [orden, setOrden] = useState<string>("relevancia")
  const [locating, setLocating] = useState(false)

  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ProductoBase[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const fetchResults = async (searchQuery: string, searchProv: string, searchOrden: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setHasSearched(true);

    try {
      let url = `http://localhost:8000/api/productos/search?q=${encodeURIComponent(searchQuery)}&orden=${searchOrden}`;
      if (searchProv) {
        url += `&provincia=${searchProv}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error en la búsqueda");
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error(error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResults(query, province, orden);
  };

  const handleOrdenChange = (newOrden: string) => {
    setOrden(newOrden);
    if (hasSearched && query.trim()) {
      fetchResults(query, province, newOrden);
    }
  };

  const handleClearFilter = () => {
    setQuery("");
    setOrden("relevancia");
    setHasSearched(false);
    setResults([]);
  };

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
      {/* Decorative background blobs - optimizados para evitar sobrecarga de GPU y RAM */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-2xl -z-10 pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[30rem] h-[30rem] bg-accent/15 rounded-full blur-2xl -z-10 pointer-events-none" />

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
                className="w-full h-14 pl-12 pr-10 rounded-xl bg-transparent border-none outline-none focus:ring-2 focus:ring-primary text-lg transition-all"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3.5 p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  title="Borrar texto"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
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
                  <option value="auto">Ubicación actual</option>
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
        <div className="w-full max-w-4xl mx-auto mt-8 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
          {/* Barra de control de filtros y ordenamiento */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-secondary/40 backdrop-blur-md p-3 px-4 rounded-2xl border border-border/40">
            <div className="text-sm font-medium text-muted-foreground">
              {loading ? (
                <span>Buscando resultados...</span>
              ) : (
                <span>
                  <strong className="text-foreground">{results.length}</strong> resultados para <span className="text-foreground font-semibold">&ldquo;{query}&rdquo;</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Ordenar por */}
              <div className="flex items-center gap-2 bg-background/80 px-3 py-1.5 rounded-xl border border-border/50 text-sm">
                <ArrowUpDown className="w-4 h-4 text-primary shrink-0" />
                <span className="text-muted-foreground hidden sm:inline">Ordenar:</span>
                <select
                  value={orden}
                  onChange={(e) => handleOrdenChange(e.target.value)}
                  disabled={loading}
                  className="bg-transparent font-semibold text-foreground outline-none cursor-pointer text-sm"
                >
                  <option value="relevancia">Relevancia</option>
                  <option value="precio_asc">Menor precio</option>
                  <option value="precio_desc">Mayor precio</option>
                  <option value="alfa_asc">Alfabético (A-Z)</option>
                </select>
              </div>

              {/* Botón limpiar */}
              <button
                type="button"
                onClick={handleClearFilter}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold text-sm transition-colors border border-red-500/20"
                title="Limpiar búsqueda y filtros"
              >
                <FilterX className="w-4 h-4" />
                <span>Limpiar</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="font-medium">Buscando en supermercados de tu zona...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="flex flex-col gap-3 text-left">
              {results.map((prod, idx) => {
                const precioListaNum = Number(prod.precio_lista || 0);
                const precioPromoNum = Number(prod.precio_promo1 || 0);
                const hasPromo = precioPromoNum > 0 && precioPromoNum < precioListaNum;
                const precioMostrar = hasPromo ? precioPromoNum : precioListaNum;
                
                return (
                  <div 
                    key={`${prod.producto_id || prod.id}-${prod.id_comercio}-${prod.id_sucursal}-${idx}`} 
                    className="bg-card/90 dark:bg-card/80 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:bg-secondary/40 transition-colors duration-200 cursor-pointer group shadow-sm hover:shadow-md border border-border/60 hover:border-primary/40"
                  >
                    <div className="flex gap-4 items-start flex-1 min-w-0">
                      <div className="bg-secondary p-2.5 rounded-xl group-hover:scale-105 transition-transform duration-300 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                        {prod.imagen_url ? (
                          <img src={prod.imagen_url} alt={prod.nombre || "Producto"} className="w-full h-full object-contain" />
                        ) : (
                          <Package className="w-7 h-7 text-primary/60" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {prod.bandera_nombre && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
                              <Store className="w-3.5 h-3.5 shrink-0" />
                              {prod.bandera_nombre}
                            </span>
                          )}
                          {(prod.localidad || prod.provincia) && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium truncate max-w-[200px]" title={prod.localidad || getProvinciaNombre(prod.provincia)}>
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              {prod.localidad || getProvinciaNombre(prod.provincia)}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-foreground text-base sm:text-lg truncate group-hover:text-primary transition-colors" title={prod.nombre}>
                          {prod.nombre || "Producto sin nombre"}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Marca: <span className="font-semibold text-foreground/80">{prod.marca || "-"}</span>
                        </p>
                        <div className="pt-1 flex flex-wrap gap-1.5">
                          {prod.cantidad_presentacion !== undefined && prod.cantidad_presentacion !== null && prod.cantidad_presentacion !== "" && (
                            <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                              {formatCantidad(prod.cantidad_presentacion)} {formatUnidad(prod.unidad_medida)}
                            </span>
                          )}
                          {prod.subcategoria && (
                            <span className="inline-flex items-center rounded-md bg-accent/50 px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                              {prod.subcategoria}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sección de Precio */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-border/50 shrink-0 gap-1 sm:pl-4 sm:border-l sm:border-border/30 sm:min-w-[160px]">
                      {hasPromo && prod.leyenda_promo1 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">
                          <Tag className="w-3 h-3" />
                          {prod.leyenda_promo1}
                        </span>
                      )}
                      
                      <div className="flex items-baseline gap-2">
                        {hasPromo && precioListaNum > 0 && (
                          <span className="text-xs sm:text-sm font-semibold text-muted-foreground line-through decoration-red-500/70">
                            ${precioListaNum.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        )}
                        <span className={`text-2xl sm:text-3xl font-black tracking-tight ${hasPromo ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                          ${precioMostrar > 0 ? precioMostrar.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-.--"}
                        </span>
                      </div>

                      {prod.precio_fecha && (
                        <span className="text-[11px] text-muted-foreground/80 flex items-center gap-1 mt-0.5 font-medium">
                          <Calendar className="w-3 h-3 opacity-70" />
                          Act: {new Date(prod.precio_fecha + 'T00:00:00').toLocaleDateString("es-AR", { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
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
