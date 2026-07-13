"use client"

import { useState, useEffect, useRef } from "react"
import { Search, MapPin, Loader2, ArrowRight, Package, Store, Calendar, Tag, ArrowUpDown, X, FilterX, ChevronDown, Check, Navigation } from "lucide-react"
import ProductoDetailView from "@/components/ProductoDetailView"

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

function formatNombreProducto(nombre?: string): string {
  if (!nombre) return "";
  const minusculas = new Set([
    "a", "al", "con", "de", "del", "e", "en", "o", "para", "por", "sin", "u", "y"
  ]);
  const unidades = new Set([
    "gr", "grs", "g", "kg", "kgs", "lt", "lts", "l", "ml", "cc", "un", "u", "cm3"
  ]);

  const words = nombre.trim().toLowerCase().split(/\s+/);
  return words
    .map((word, index) => {
      if (!word) return "";
      if (index > 0 && minusculas.has(word)) {
        return word;
      }
      if (index > 0 && unidades.has(word) && /^\d/.test(words[index - 1] || "")) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

const PROVINCES_LIST = [
  { value: "", label: "Todo el país" },
  { value: "auto", label: "Ubicación actual", isSpecial: true },
  { value: "AR-C", label: "CABA" },
  { value: "AR-B", label: "Buenos Aires" },
  { value: "AR-K", label: "Catamarca" },
  { value: "AR-H", label: "Chaco" },
  { value: "AR-U", label: "Chubut" },
  { value: "AR-X", label: "Córdoba" },
  { value: "AR-W", label: "Corrientes" },
  { value: "AR-E", label: "Entre Ríos" },
  { value: "AR-P", label: "Formosa" },
  { value: "AR-Y", label: "Jujuy" },
  { value: "AR-L", label: "La Pampa" },
  { value: "AR-F", label: "La Rioja" },
  { value: "AR-M", label: "Mendoza" },
  { value: "AR-N", label: "Misiones" },
  { value: "AR-Q", label: "Neuquén" },
  { value: "AR-R", label: "Río Negro" },
  { value: "AR-A", label: "Salta" },
  { value: "AR-J", label: "San Juan" },
  { value: "AR-D", label: "San Luis" },
  { value: "AR-Z", label: "Santa Cruz" },
  { value: "AR-S", label: "Santa Fe" },
  { value: "AR-G", label: "Santiago del Estero" },
  { value: "AR-V", label: "Tierra del Fuego" },
  { value: "AR-T", label: "Tucumán" },
];

const ORDEN_LIST = [
  { value: "relevancia", label: "Relevancia" },
  { value: "precio_asc", label: "Menor precio" },
  { value: "precio_desc", label: "Mayor precio" },
  { value: "alfa_asc", label: "Alfabético (A-Z)" },
];

export default function Home() {
  const [query, setQuery] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("precioar_search_state");
      if (saved) {
        try { return JSON.parse(saved).query || ""; } catch (e) {}
      }
    }
    return "";
  });

  const [province, setProvince] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("precioar_search_state");
      if (saved) {
        try { return JSON.parse(saved).province || "AR-C"; } catch (e) {}
      }
    }
    return "AR-C";
  });

  const [orden, setOrden] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("precioar_search_state");
      if (saved) {
        try { return JSON.parse(saved).orden || "relevancia"; } catch (e) {}
      }
    }
    return "relevancia";
  });

  const [locating, setLocating] = useState(false)
  const [openProvince, setOpenProvince] = useState(false)
  const [openOrden, setOpenOrden] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const savedScrollYRef = useRef<number>(0)
  const provinceDropdownRef = useRef<HTMLDivElement>(null)
  const ordenDropdownRef = useRef<HTMLDivElement>(null)

  const handleSelectProduct = (id?: number) => {
    if (!id) return;
    savedScrollYRef.current = window.scrollY;
    setSelectedProductId(id);
  };

  const handleBackFromProduct = () => {
    setSelectedProductId(null);
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.scrollTo({ top: savedScrollYRef.current, behavior: "instant" });
      }, 10);
    });
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (provinceDropdownRef.current && !provinceDropdownRef.current.contains(event.target as Node)) {
        setOpenProvince(false);
      }
      if (ordenDropdownRef.current && !ordenDropdownRef.current.contains(event.target as Node)) {
        setOpenOrden(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ProductoBase[]>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("precioar_search_state");
      if (saved) {
        try { return JSON.parse(saved).results || []; } catch (e) {}
      }
    }
    return [];
  });

  const [hasSearched, setHasSearched] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("precioar_search_state");
      if (saved) {
        try { return Boolean(JSON.parse(saved).hasSearched); } catch (e) {}
      }
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("precioar_search_state");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.scrollY === "number" && parsed.scrollY > 0) {
            requestAnimationFrame(() => {
              setTimeout(() => {
                window.scrollTo({ top: parsed.scrollY, behavior: "instant" });
              }, 50);
            });
          }
        } catch (e) {}
      }
    }
  }, []);

  const saveStateToStorage = (newQuery: string, newProv: string, newOrden: string, newResults: ProductoBase[], newHasSearched: boolean, scrollY = 0) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "precioar_search_state",
        JSON.stringify({
          query: newQuery,
          province: newProv,
          orden: newOrden,
          results: newResults,
          hasSearched: newHasSearched,
          scrollY,
        })
      );
    }
  };

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
      saveStateToStorage(searchQuery, searchProv, searchOrden, data, true, 0);
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
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("precioar_search_state");
    }
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

  if (selectedProductId !== null) {
    return (
      <main className="flex-1 flex flex-col items-center p-4 py-8 relative overflow-x-hidden min-h-0">
        <ProductoDetailView
          productoId={selectedProductId}
          provincia={province}
          onBack={handleBackFromProduct}
        />
      </main>
    );
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

            <div ref={provinceDropdownRef} className="relative min-w-[170px]">
              <button
                type="button"
                onClick={() => setOpenProvince(!openProvince)}
                disabled={locating}
                className="w-full h-14 pl-10 pr-8 bg-secondary/50 hover:bg-secondary text-foreground rounded-xl flex items-center justify-between gap-2 text-sm font-medium transition-all duration-200 border border-transparent focus:border-primary/50 outline-none"
              >
                <MapPin className="absolute left-3.5 w-4 h-4 text-primary pointer-events-none" />
                <span className="truncate">
                  {locating
                    ? "Ubicando..."
                    : province === ""
                    ? "Todo el país"
                    : PROVINCIAS_MAP[province] || "Seleccionar provincia"}
                </span>
                {locating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                ) : (
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 ${openProvince ? "rotate-180" : ""}`} />
                )}
              </button>

              {openProvince && (
                <div className="absolute right-0 sm:left-0 top-[calc(100%+8px)] z-50 w-64 max-h-80 overflow-y-auto rounded-2xl bg-background/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-border/80 shadow-2xl p-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-0.5">
                    {PROVINCES_LIST.map((item) => {
                      const isSelected = province === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            setOpenProvince(false);
                            if (item.value === "auto") {
                              handleLocate();
                            } else {
                              setProvince(item.value);
                            }
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                            isSelected
                              ? "bg-primary/15 text-primary font-semibold"
                              : item.isSpecial
                              ? "text-primary hover:bg-primary/10"
                              : "text-foreground hover:bg-secondary"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {item.isSpecial && <Navigation className="w-3.5 h-3.5 text-primary shrink-0" />}
                            {item.label}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
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
              <div ref={ordenDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setOpenOrden(!openOrden)}
                  disabled={loading}
                  className="flex items-center gap-2 bg-background/90 hover:bg-background dark:bg-zinc-900/90 dark:hover:bg-zinc-900 px-3.5 py-2 rounded-xl border border-border/60 text-sm font-semibold text-foreground transition-all duration-200 shadow-sm"
                >
                  <ArrowUpDown className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-muted-foreground font-normal hidden sm:inline">Ordenar:</span>
                  <span>
                    {ORDEN_LIST.find((o) => o.value === orden)?.label || "Relevancia"}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${openOrden ? "rotate-180" : ""}`} />
                </button>

                {openOrden && (
                  <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-48 rounded-2xl bg-background/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-border/80 shadow-2xl p-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-0.5">
                      {ORDEN_LIST.map((item) => {
                        const isSelected = orden === item.value;
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => {
                              setOpenOrden(false);
                              handleOrdenChange(item.value);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${
                              isSelected
                                ? "bg-primary/15 text-primary font-semibold"
                                : "text-foreground hover:bg-secondary"
                            }`}
                          >
                            <span>{item.label}</span>
                            {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
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
                    onClick={() => handleSelectProduct(prod.producto_id || prod.id)}
                    className="bg-card/90 dark:bg-card/80 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:bg-secondary/40 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md border border-border/60 hover:border-primary/40 text-left"
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
                        <h3 className="font-bold text-foreground text-base sm:text-lg truncate group-hover:text-primary transition-colors" title={formatNombreProducto(prod.nombre)}>
                          {formatNombreProducto(prod.nombre) || "Producto sin nombre"}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Marca: <span className="font-semibold text-foreground/80">{formatNombreProducto(prod.marca) || "-"}</span>
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
