"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  Store,
  MapPin,
  Calendar,
  Tag,
  Package,
  Loader2,
  Barcode,
  Layers,
  Scale,
  Building2,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Info,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ListFilter
} from "lucide-react"

interface PrecioSucursal {
  id_comercio: number;
  id_bandera: number;
  id_sucursal: number;
  bandera_nombre?: string;
  sucursal_nombre?: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
  fecha?: string;
  precio_lista?: number | string;
  precio_promo1?: number | string;
  leyenda_promo1?: string;
  precio_promo2?: number | string;
  leyenda_promo2?: string;
  precio_referencia?: number | string;
}

interface ProductoDetalle {
  producto_id?: number;
  id?: number;
  ean?: string;
  nombre?: string;
  descripcion?: string;
  marca?: string;
  cantidad_presentacion?: number | string;
  unidad_medida?: string;
  categoria?: string;
  subcategoria?: string;
  imagen_url?: string;
  bandera_nombre?: string;
  provincia?: string;
  localidad?: string;
  precio_lista?: number | string;
  precio_promo1?: number | string;
  leyenda_promo1?: string;
  precio_fecha?: string;
  precios?: PrecioSucursal[];
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

interface ProductoDetailViewProps {
  productoId: number;
  provincia?: string;
  onBack: () => void;
}

export default function ProductoDetailView({
  productoId,
  provincia = "",
  onBack,
}: ProductoDetailViewProps) {
  const [producto, setProducto] = useState<ProductoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedEan, setCopiedEan] = useState(false);
  const [showDetalleSucursales, setShowDetalleSucursales] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [productoId]);

  useEffect(() => {
    const fetchProducto = async () => {
      setLoading(true);
      setError("");
      try {
        let url = `http://localhost:8000/api/productos/${productoId}`;
        if (provincia) {
          url += `?provincia=${encodeURIComponent(provincia)}`;
        }
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("No se pudo cargar la información del producto");
        }
        const data = await res.json();
        setProducto(data);
      } catch (err) {
        console.error(err);
        setError("Ocurrió un error al cargar el producto.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducto();
  }, [productoId, provincia]);

  const copyToClipboard = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedEan(true);
    setTimeout(() => setCopiedEan(false), 2000);
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto py-16 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium text-sm">Cargando datos del producto...</p>
      </div>
    );
  }

  if (error || !producto) {
    return (
      <div className="w-full max-w-5xl mx-auto py-12 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
        <div className="max-w-md bg-card/90 border border-border/80 rounded-3xl p-8 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Producto no encontrado</h2>
          <p className="text-sm text-muted-foreground">
            No pudimos encontrar la información detallada para este producto.
          </p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la búsqueda
          </button>
        </div>
      </div>
    );
  }

  const nombreFormateado = formatNombreProducto(producto.nombre) || "Producto sin nombre";
  const marcaFormateada = formatNombreProducto(producto.marca) || "Sin marca especificada";
  const cantidad = formatCantidad(producto.cantidad_presentacion);
  const unidad = formatUnidad(producto.unidad_medida);

  const preciosList = producto.precios || [];

  let precioMinimo = 999999999;
  let precioMaximo = 0;
  let precioOriginalMinimo = 0;
  let leyendaPromoMinima = "";
  let comercioMinimo = producto.bandera_nombre || "";

  const cadenasMinimasSet = new Set<string>();
  const cadenasMaximasSet = new Set<string>();
  const cadenasUnicasSet = new Set<string>();

  if (preciosList.length > 0) {
    preciosList.forEach((p) => {
      const pl = Number(p.precio_lista || 0);
      const pp = Number(p.precio_promo1 || 0);
      const hasPromo = pp > 0 && pp < pl;
      const actual = hasPromo ? pp : pl;
      const nombreCadena = p.bandera_nombre || `Comercio #${p.id_comercio}`;
      cadenasUnicasSet.add(nombreCadena);

      if (actual > 0) {
        if (actual < precioMinimo) {
          precioMinimo = actual;
          precioOriginalMinimo = hasPromo ? pl : 0;
          leyendaPromoMinima = hasPromo ? p.leyenda_promo1 || "" : "";
          comercioMinimo = nombreCadena;
          cadenasMinimasSet.clear();
          cadenasMinimasSet.add(nombreCadena);
        } else if (Math.abs(actual - precioMinimo) < 0.01) {
          cadenasMinimasSet.add(nombreCadena);
        }

        if (actual > precioMaximo) {
          precioMaximo = actual;
          cadenasMaximasSet.clear();
          cadenasMaximasSet.add(nombreCadena);
        } else if (Math.abs(actual - precioMaximo) < 0.01) {
          cadenasMaximasSet.add(nombreCadena);
        }
      }
    });
  } else {
    const pl = Number(producto.precio_lista || 0);
    const pp = Number(producto.precio_promo1 || 0);
    const hasPromo = pp > 0 && pp < pl;
    const actual = hasPromo ? pp : pl;
    if (actual > 0) {
      precioMinimo = actual;
      precioMaximo = actual;
      precioOriginalMinimo = hasPromo ? pl : 0;
      leyendaPromoMinima = hasPromo ? producto.leyenda_promo1 || "" : "";
      if (producto.bandera_nombre) {
        cadenasUnicasSet.add(producto.bandera_nombre);
        cadenasMinimasSet.add(producto.bandera_nombre);
        cadenasMaximasSet.add(producto.bandera_nombre);
      }
    }
  }

  const hasPrecioMinimo = precioMinimo < 999999999 && precioMinimo > 0;
  const hayDiferencia = hasPrecioMinimo && precioMaximo > precioMinimo && (precioMaximo - precioMinimo) > 0.05;
  const diferenciaPesos = hayDiferencia ? precioMaximo - precioMinimo : 0;
  const porcentajeAhorro = hayDiferencia ? Math.round(((precioMaximo - precioMinimo) / precioMaximo) * 100) : 0;
  const cadenasMinimas = Array.from(cadenasMinimasSet);
  const cadenasMaximas = Array.from(cadenasMaximasSet);
  const cadenasUnicas = Array.from(cadenasUnicasSet);

  return (
    <div className="w-full max-w-5xl mx-auto pb-16 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Barra superior de navegación dentro de la vista */}
      <div className="flex items-center justify-between gap-4 mb-6 pt-2">
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-sm font-semibold transition-all duration-200 shadow-sm border border-border/40 hover:border-primary/50"
        >
          <ArrowLeft className="w-4 h-4 text-primary" />
          <span>Volver a los resultados</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground truncate">
          {producto.categoria && (
            <span className="truncate max-w-[150px]">{producto.categoria}</span>
          )}
          {producto.subcategoria && (
            <>
              <span>/</span>
              <span className="text-foreground font-semibold truncate max-w-[150px]">
                {producto.subcategoria}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {/* Tarjeta principal del producto */}
        <section className="bg-card/90 dark:bg-card/80 rounded-3xl border border-border/60 p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Contenedor de la Foto */}
            <div className="md:col-span-5 bg-secondary/50 dark:bg-secondary/30 rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center border border-border/40 min-h-[280px] sm:min-h-[340px] relative overflow-hidden group">
              {producto.imagen_url ? (
                <img
                  src={producto.imagen_url}
                  alt={nombreFormateado}
                  className="w-full h-64 sm:h-72 object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-md"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Package className="w-20 h-20 text-primary/40" />
                  <span className="text-xs font-medium">Imagen no disponible</span>
                </div>
              )}

              {producto.ean && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-background/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-border/60 text-xs">
                  <span className="flex items-center gap-1.5 font-mono text-muted-foreground truncate">
                    <Barcode className="w-3.5 h-3.5 text-primary shrink-0" />
                    EAN: {producto.ean}
                  </span>
                  <button
                    onClick={() => copyToClipboard(producto.ean)}
                    type="button"
                    className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    title="Copiar código EAN"
                  >
                    {copiedEan ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Datos y Precio */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Badges superiores */}
                <div className="flex flex-wrap items-center gap-2">
                  {marcaFormateada && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold tracking-wide uppercase">
                      Marca: {marcaFormateada}
                    </span>
                  )}
                  {cantidad && unidad && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
                      <Scale className="w-3.5 h-3.5 text-primary" />
                      {cantidad} {unidad}
                    </span>
                  )}
                </div>

                {/* Nombre Principal */}
                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-snug">
                  {nombreFormateado}
                </h1>

                {/* Descripción / Categorías */}
                <div className="space-y-2 text-sm text-muted-foreground">
                  {producto.descripcion &&
                    producto.descripcion.toLowerCase() !== producto.nombre?.toLowerCase() && (
                      <p className="text-foreground/80 leading-relaxed font-medium">
                        {producto.descripcion}
                      </p>
                    )}

                  <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1 text-xs">
                    {producto.categoria && (
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-muted-foreground/80" />
                        Categoría: <strong className="text-foreground">{producto.categoria}</strong>
                      </span>
                    )}
                    {(producto.localidad || getProvinciaNombre(producto.provincia)) && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground/80" />
                        Región:{" "}
                        <strong className="text-foreground">
                          {producto.localidad || getProvinciaNombre(producto.provincia)}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tarjeta del Mejor Precio Disponible */}
              <div className="bg-secondary/40 dark:bg-zinc-900/60 rounded-2xl border border-border/60 p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-emerald-500" />
                    Mejor Precio Relevado
                  </span>
                  {comercioMinimo && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                      <Store className="w-3.5 h-3.5" />
                      {comercioMinimo}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-4 pt-1">
                  <div className="flex items-baseline gap-3">
                    {precioOriginalMinimo > 0 && (
                      <span className="text-base sm:text-lg font-semibold text-muted-foreground line-through decoration-red-500/70">
                        ${precioOriginalMinimo.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                    <span className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                      {hasPrecioMinimo
                        ? `$${precioMinimo.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "-.--"}
                    </span>
                  </div>

                  {leyendaPromoMinima && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <Tag className="w-3.5 h-3.5" />
                      {leyendaPromoMinima}
                    </span>
                  )}
                </div>

                {producto.precio_fecha && (
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 opacity-80" />
                      Última actualización:
                    </span>
                    <span className="font-semibold text-foreground">
                      {new Date(producto.precio_fecha + "T00:00:00").toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Sección de Resumen de Rango y Supermercados Relevados */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Rango de Precios Relevados
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Análisis comparativo entre el mínimo y máximo encontrado en tu zona
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/80 text-xs font-semibold text-foreground">
              <span>Total sucursales:</span>
              <strong className="text-primary font-bold">{preciosList.length}</strong>
            </div>
          </div>

          {/* Tarjetas de Rango Mínimo vs Máximo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tarjeta Precio Mínimo */}
            <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  <TrendingDown className="w-4 h-4" />
                  Precio Mínimo Encontrado
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  Más Económico
                </span>
              </div>

              <div className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
                ${precioMinimo.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>

              <div className="pt-2 border-t border-emerald-500/20 space-y-1.5">
                <span className="text-xs text-muted-foreground font-medium block">
                  Encontrado en {cadenasMinimas.length === 1 ? "la cadena:" : "las cadenas:"}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {cadenasMinimas.map((cadena) => (
                    <span
                      key={cadena}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-xs"
                    >
                      <Store className="w-3.5 h-3.5" />
                      {cadena}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tarjeta Precio Máximo */}
            <div className="bg-card/90 dark:bg-card/80 border border-border/70 rounded-2xl p-5 sm:p-6 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  Precio Máximo Encontrado
                </span>
                {hayDiferencia && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    Diferencia: +${diferenciaPesos.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({porcentajeAhorro}%)
                  </span>
                )}
              </div>

              <div className="text-3xl sm:text-4xl font-black text-foreground">
                ${precioMaximo.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>

              <div className="pt-2 border-t border-border/50 space-y-1.5">
                <span className="text-xs text-muted-foreground font-medium block">
                  Registrado en {cadenasMaximas.length === 1 ? "la cadena:" : "las cadenas:"}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {cadenasMaximas.map((cadena) => (
                    <span
                      key={cadena}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-foreground font-semibold text-xs"
                    >
                      <Store className="w-3.5 h-3.5 text-muted-foreground" />
                      {cadena}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Resumen de Cadenas Disponibles */}
          <div className="bg-secondary/30 dark:bg-zinc-900/40 rounded-2xl border border-border/50 p-5 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Supermercados relevados con este producto en la zona ({cadenasUnicas.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {cadenasUnicas.map((cadena) => (
                <span
                  key={cadena}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/70 text-foreground text-xs font-semibold shadow-2xs"
                >
                  <Store className="w-3.5 h-3.5 text-primary" />
                  {cadena}
                </span>
              ))}
            </div>
          </div>

          {/* Botón para expandir / ocultar detalle por sucursal */}
          {preciosList.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowDetalleSucursales(!showDetalleSucursales)}
                className="w-full py-3.5 px-6 rounded-2xl bg-secondary/80 hover:bg-secondary text-foreground font-semibold text-sm flex items-center justify-between transition-all border border-border/60 shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <ListFilter className="w-4 h-4 text-primary" />
                  {showDetalleSucursales
                    ? "Ocultar detalle por sucursal"
                    : `Ver detalle por sucursal (${preciosList.length} sucursales relevadas)`}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${
                    showDetalleSucursales ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          )}

          {/* Listado de Sucursales (Oculto por defecto) */}
          {showDetalleSucursales && (
            <div className="grid grid-cols-1 gap-3 pt-2 animate-in fade-in slide-in-from-top-3 duration-300">
              {preciosList.map((p, index) => {
                const precioListaNum = Number(p.precio_lista || 0);
                const precioPromoNum = Number(p.precio_promo1 || 0);
                const hasPromo = precioPromoNum > 0 && precioPromoNum < precioListaNum;
                const precioMostrar = hasPromo ? precioPromoNum : precioListaNum;
                const esElMasBarato = hasPrecioMinimo && Math.abs(precioMostrar - precioMinimo) < 0.01;

                return (
                  <div
                    key={`${p.id_comercio}-${p.id_bandera}-${p.id_sucursal}-${index}`}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row gap-4 sm:items-center justify-between ${
                      esElMasBarato
                        ? "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/40 shadow-sm"
                        : "bg-card/80 dark:bg-card/70 border-border/60 hover:border-border"
                    }`}
                  >
                    {/* Información del Comercio y Dirección */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-primary/15 text-primary text-xs font-bold">
                          <Store className="w-3.5 h-3.5" />
                          {p.bandera_nombre || `Comercio #${p.id_comercio}`}
                        </span>

                        {esElMasBarato && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white dark:bg-emerald-600 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mejor Precio
                          </span>
                        )}
                      </div>

                      <div className="font-semibold text-foreground text-sm sm:text-base">
                        {p.sucursal_nombre || "Sucursal"}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {p.direccion && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                            {p.direccion}
                          </span>
                        )}
                        {(p.localidad || p.provincia) && (
                          <span>
                            {p.localidad}
                            {p.localidad && p.provincia ? ", " : ""}
                            {getProvinciaNombre(p.provincia)}
                          </span>
                        )}
                        {p.fecha && (
                          <span className="flex items-center gap-1 opacity-80">
                            <Calendar className="w-3 h-3" />
                            {new Date(p.fecha + "T00:00:00").toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Precios de esta Sucursal */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-border/50 shrink-0 gap-1.5 sm:pl-6 sm:border-l sm:border-border/40">
                      {hasPromo && p.leyenda_promo1 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <Tag className="w-3 h-3" />
                          {p.leyenda_promo1}
                        </span>
                      )}

                      <div className="flex items-baseline gap-2">
                        {hasPromo && precioListaNum > 0 && (
                          <span className="text-xs sm:text-sm font-semibold text-muted-foreground line-through decoration-red-500/70">
                            ${precioListaNum.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        )}
                        <span
                          className={`text-xl sm:text-2xl font-black tracking-tight ${
                            esElMasBarato || hasPromo
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-foreground"
                          }`}
                        >
                          ${precioMostrar > 0 ? precioMostrar.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-.--"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
