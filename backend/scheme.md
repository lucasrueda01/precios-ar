# Esquema de Base de Datos — PrecioAR

> Generado desde el dump real de PostgreSQL 18.3
> Base de datos: `precioar`

---

## Tablas

---

### `comercios`

Representa una **marca comercial (bandera)** de un supermercado. Una misma empresa puede operar múltiples banderas con distinto nombre comercial.

```sql
CREATE TABLE public.comercios (
    id_comercio  integer               NOT NULL,
    id_bandera   integer               NOT NULL,
    cuit         character varying(20),
    razon_social character varying(200),
    bandera_nombre character varying(100),
    bandera_url  character varying(200),
    ultima_actualizacion date,
    CONSTRAINT comercios_pkey PRIMARY KEY (id_comercio, id_bandera)
);
```

| Campo | Tipo | Nullable | Descripción |
|---|---|---|---|
| `id_comercio` | integer | NOT NULL | ID único de la empresa, asignado por la Secretaría de Comercio. Parte de la PK |
| `id_bandera` | integer | NOT NULL | ID de la marca comercial dentro de la empresa. Si tiene una sola bandera vale 1, si tiene varias son incrementales. Parte de la PK |
| `cuit` | varchar(20) | NULL | CUIT fiscal de la empresa sin guiones. Ej: "30506730038" |
| `razon_social` | varchar(200) | NULL | Nombre legal ante AFIP. Ej: "S.A. IMP. Y EXP. DE LA PATAGONIA" |
| `bandera_nombre` | varchar(100) | NULL | Nombre comercial visible al consumidor. Ej: "La Anónima", "Carrefour", "DIA" |
| `bandera_url` | varchar(200) | NULL | Sitio web de la cadena |
| `ultima_actualizacion` | date | NULL | Fecha del último envío de datos al SEPA |

**PK:** `(id_comercio, id_bandera)`

**Ejemplo real:** La empresa "S.A. IMP. Y EXP. DE LA PATAGONIA" tiene tres banderas: La Anónima (id_bandera=1), Topsy (id_bandera=2) y Bomba (id_bandera=3). Mismo id_comercio, distinto id_bandera.

---

### `sucursales`

Representa un **local físico** de una cadena de supermercados.

```sql
CREATE TABLE public.sucursales (
    id_comercio  integer               NOT NULL,
    id_bandera   integer               NOT NULL,
    id_sucursal  integer               NOT NULL,
    nombre       character varying(200),
    tipo         character varying(50),
    calle        character varying(200),
    numero       character varying(20),
    latitud      numeric(10,7),
    longitud     numeric(10,7),
    barrio       character varying(100),
    codigo_postal character varying(10),
    localidad    character varying(100),
    provincia    character varying(50),
    horarios     jsonb,
    CONSTRAINT sucursales_pkey PRIMARY KEY (id_comercio, id_bandera, id_sucursal),
    CONSTRAINT sucursales_id_comercio_id_bandera_fkey
        FOREIGN KEY (id_comercio, id_bandera) REFERENCES public.comercios(id_comercio, id_bandera)
);

CREATE INDEX idx_sucursales_provincia ON public.sucursales USING btree (provincia);
```

| Campo | Tipo | Nullable | Descripción |
|---|---|---|---|
| `id_comercio` | integer | NOT NULL | Parte de la PK. Referencia al comercio dueño |
| `id_bandera` | integer | NOT NULL | Parte de la PK. Referencia a la bandera |
| `id_sucursal` | integer | NOT NULL | Parte de la PK. ID interno del comercio para esa sucursal. Único dentro del comercio, no globalmente |
| `nombre` | varchar(200) | NULL | Nombre interno de la sucursal. Ej: "BARILOCHE 3", "Devoto", "San Isidro La Florida" |
| `tipo` | varchar(50) | NULL | Categoría según cajas: "Hipermercado" (>15), "Supermercado" (4-15), "Autoservicio" (1-3), "Mayorista" |
| `calle` | varchar(200) | NULL | Nombre de la calle de la puerta principal |
| `numero` | varchar(20) | NULL | Número de la puerta. Vacío si no tiene numeración |
| `latitud` | numeric(10,7) | NULL | Coordenada GPS latitud en sistema WGS84. Ej: -34.603722. Puede ser NULL |
| `longitud` | numeric(10,7) | NULL | Coordenada GPS longitud en sistema WGS84. Ej: -58.381592. Puede ser NULL |
| `barrio` | varchar(100) | NULL | Barrio donde está ubicada. Muy incompleto en los datos, mayoría NULL |
| `codigo_postal` | varchar(10) | NULL | Código postal sin letras. Ej: "1426" |
| `localidad` | varchar(100) | NULL | Ciudad o localidad. Ej: "San Carlos de Bariloche", "Cipolletti" |
| `provincia` | varchar(50) | NULL | Código ISO 3166-2 de la provincia. Ej: "AR-B"=Buenos Aires, "AR-C"=CABA, "AR-X"=Córdoba |
| `horarios` | jsonb | NULL | Horarios de atención por día de la semana. Ej: `{"lunes": "08:00 a 21:00", "sabado": "09:00 a 20:00", "domingo": null}` |

**PK:** `(id_comercio, id_bandera, id_sucursal)`  
**FK:** `(id_comercio, id_bandera)` → `comercios`  
**Índice:** `idx_sucursales_provincia` en `(provincia)`

**Nota importante:** Según la normativa SEPA, los precios son iguales en todas las sucursales de una misma cadena dentro de la misma provincia. Entonces para comparar precios en Luján (AR-B) alcanza con cualquier sucursal de Carrefour en Buenos Aires provincia.

---

### `productos`

Representa un **producto único** identificado por su código interno del comercio. Puede tener o no un EAN (código de barras universal).

```sql
CREATE TABLE public.productos (
    id                    bigint                NOT NULL DEFAULT nextval('productos_id_seq'),
    ean                   character varying(30),
    id_comercio           integer,
    id_producto           character varying(30),
    descripcion           character varying(300),
    marca                 character varying(100),
    cantidad_presentacion numeric(10,3),
    unidad_medida         character varying(20),
    cantidad_referencia   numeric(10,3),
    unidad_referencia     character varying(20),
    CONSTRAINT productos_pkey PRIMARY KEY (id),
    CONSTRAINT productos_ean_key UNIQUE (ean),
    CONSTRAINT productos_id_comercio_id_producto_key UNIQUE (id_comercio, id_producto)
);

CREATE INDEX idx_productos_fts ON public.productos USING gin (to_tsvector('spanish'::regconfig, descripcion::text));
```

| Campo | Tipo | Nullable | Descripción |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincremental. ID interno de la app |
| `ean` | varchar(30) | NULL | Código de barras EAN real del producto. NULL si el comercio reporta código interno. UNIQUE |
| `id_comercio` | integer | NULL | Comercio al que pertenece este producto |
| `id_producto` | varchar(30) | NULL | Código del producto en el sistema del comercio. Junto con id_comercio forma una clave única |
| `descripcion` | varchar(300) | NULL | Nombre crudo del producto tal como lo reporta el comercio al SEPA. No normalizado. Ej: "LECHE ENTERA LSA 1L" |
| `marca` | varchar(100) | NULL | Marca tal como viene del SEPA. Generalmente en mayúsculas. Ej: "LA SERENISIMA" |
| `cantidad_presentacion` | numeric(10,3) | NULL | Cantidad numérica del contenido del envase. Ej: 1000, 500, 200 |
| `unidad_medida` | varchar(20) | NULL | Unidad de la cantidad anterior. Ej: "ml", "gr", "cm3", "un", "kg" |
| `cantidad_referencia` | numeric(10,3) | NULL | Cantidad en la que se expresa el precio de referencia. Ej: 100 (para precio por 100gr) |
| `unidad_referencia` | varchar(20) | NULL | Unidad del precio de referencia. Ej: "gr", "l", "kg" |

**PK:** `(id)`  
**UNIQUE:** `(ean)` y `(id_comercio, id_producto)`  
**Índices:**
- `idx_productos_fts` en `gin(to_tsvector('spanish', descripcion))` — búsqueda full-text optimizada sobre la descripción del producto en español

**Dato clave del SEPA:** En el CSV original, `productos_ean` no es el código de barras sino un **flag**: vale `1` si `id_producto` contiene un EAN real, o `0` si es un código interno del comercio. El script de ingesta interpreta esto correctamente y guarda el EAN real en el campo `ean` solo cuando el flag es `1`.

---

### `productos_vtex`

Datos de **enriquecimiento** obtenidos de la API pública de VTEX. Complementa `productos` con imagen de alta calidad, nombre legible y categoría jerárquica. Solo existe para productos que tienen EAN válido.

```sql
CREATE TABLE public.productos_vtex (
    ean            character varying(30)  NOT NULL,
    nombre_vtex    character varying(300),
    marca_vtex     character varying(100),
    categoria      character varying(200),
    subcategoria   character varying(200),
    imagen_url     character varying(500),
    fuente         character varying(50),
    enriquecido_en timestamp without time zone DEFAULT now(),
    CONSTRAINT productos_vtex_pkey PRIMARY KEY (ean),
    CONSTRAINT productos_vtex_ean_fkey FOREIGN KEY (ean) REFERENCES public.productos(ean)
);

CREATE INDEX idx_productos_vtex_categoria ON public.productos_vtex USING btree (categoria);
```

| Campo | Tipo | Nullable | Descripción |
|---|---|---|---|
| `ean` | varchar(30) | NOT NULL | PK y FK → `productos.ean`. EAN del producto |
| `nombre_vtex` | varchar(300) | NULL | Nombre limpio y legible. Ej: "Leche Entera La Serenísima 1 L" vs el crudo del SEPA "LECHE ENTERA LSA 1L" |
| `marca_vtex` | varchar(100) | NULL | Marca con capitalización correcta. Ej: "La Serenísima" vs "LA SERENISIMA" |
| `categoria` | varchar(200) | NULL | Jerarquía completa de categoría separada por /. Ej: "Almacén/Lácteos/Leches" |
| `subcategoria` | varchar(200) | NULL | Último nivel de la jerarquía. Ej: "Leches". Usado para filtros en la app |
| `imagen_url` | varchar(500) | NULL | URL de la foto del producto en el CDN de VTEX. NULL si no se encontró |
| `fuente` | varchar(50) | NULL | Dominio VTEX donde se encontró. Ej: "carrefour.com.ar", "jumbo.com.ar". Vale "not_found" si se buscó en todos los dominios sin resultado |
| `enriquecido_en` | timestamp | DEFAULT now() | Fecha y hora en que se obtuvo el dato de VTEX |

**PK:** `(ean)`  
**FK:** `(ean)` → `productos(ean)`  
**Índice:** `idx_productos_vtex_categoria` en `(categoria)`

**Cadenas con VTEX:** carrefour.com.ar, jumbo.com.ar, disco.com.ar, vea.com.ar, diaonline.com.ar, changomas.com.ar  
**Cadenas sin VTEX:** Coto, La Anónima, Cooperativa Obrera, Libertad, Toledo — no usan VTEX o no tienen ecommerce.

---

### `precios`

El **corazón del sistema**. Registra el historial de precios de cada producto en cada sucursal. **Solo se insertan filas cuando el precio cambia** — si el precio no varió respecto al último registro, no se agrega nada.

```sql
CREATE TABLE public.precios (
    id             bigint          NOT NULL DEFAULT nextval('precios_id_seq'),
    producto_id    bigint,
    id_comercio    integer,
    id_bandera     integer,
    id_sucursal    integer,
    fecha          date            NOT NULL,
    precio_lista   numeric(12,2),
    precio_promo1  numeric(12,2),
    leyenda_promo1 character varying(300),
    precio_promo2  numeric(12,2),
    leyenda_promo2 character varying(300),
    precio_referencia numeric(12,2),
    CONSTRAINT precios_pkey PRIMARY KEY (id),
    CONSTRAINT precios_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);

CREATE INDEX idx_precios_producto_fecha ON public.precios USING btree (producto_id, fecha DESC);
CREATE INDEX idx_precios_fecha ON public.precios USING btree (fecha DESC);
```

| Campo | Tipo | Nullable | Descripción |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincremental |
| `producto_id` | bigint | NULL | FK → `productos.id` |
| `id_comercio` | integer | NULL | Comercio al que pertenece este precio |
| `id_bandera` | integer | NULL | Bandera específica |
| `id_sucursal` | integer | NULL | Sucursal específica donde rige este precio |
| `fecha` | date | NOT NULL | Fecha en que se detectó este precio (o cuando cambió respecto al día anterior) |
| `precio_lista` | numeric(12,2) | NULL | Precio en góndola sin ningún descuento, en pesos argentinos. El que paga cualquier consumidor |
| `precio_promo1` | numeric(12,2) | NULL | Precio con primera promoción de alcance general. Cualquier consumidor puede acceder sin tarjeta especial. NULL si no hay promo |
| `leyenda_promo1` | varchar(300) | NULL | Descripción de la promo1: condiciones, vigencia y stock. Ej: "25% off con cualquier medio de pago - Vigencia: 01/04 al 19/04" |
| `precio_promo2` | numeric(12,2) | NULL | Precio con segunda promoción especial: tarjeta de fidelidad, jubilados, banco específico. NULL si no hay |
| `leyenda_promo2` | varchar(300) | NULL | Descripción de la promo2 con sus condiciones particulares |
| `precio_referencia` | numeric(12,2) | NULL | Precio normalizado por unidad de medida para comparar entre distintas presentaciones del mismo producto |

**PK:** `(id)`  
**FK:** `(producto_id)` → `productos(id)`  
**Índices:**
- `idx_precios_producto_fecha` en `(producto_id, fecha DESC)` — queries de historial
- `idx_precios_fecha` en `(fecha DESC)` — queries por fecha

**Nota:** La FK hacia `sucursales` fue eliminada intencionalmente. Algunos comercios reportan `id_sucursal` en productos que no coincide con sus sucursales declaradas — problema de calidad de datos del SEPA.

**Estrategia de almacenamiento:** La tabla solo crece cuando hay cambios reales de precio. Reduce el volumen estimado en un 70-80% respecto a insertar todos los precios diariamente.

---

## Vistas y Vistas Materializadas

---

### `precios_actuales` (MATERIALIZED VIEW)

Foto del **último precio registrado** de cada producto en cada sucursal. Su estructura se define en `setup_db.py` (`WITH NO DATA`) antes de crear `vista_productos`, y los datos se refrescan automáticamente al finalizar cada ingesta diaria en `ingest.py` con `REFRESH MATERIALIZED VIEW`.

```sql
CREATE MATERIALIZED VIEW IF NOT EXISTS public.precios_actuales AS
SELECT DISTINCT ON (producto_id, id_comercio, id_bandera, id_sucursal)
    producto_id, id_comercio, id_bandera, id_sucursal,
    fecha, precio_lista, precio_promo1, leyenda_promo1,
    precio_promo2, leyenda_promo2, precio_referencia
FROM public.precios
ORDER BY producto_id, id_comercio, id_bandera, id_sucursal, fecha DESC
WITH NO DATA;

CREATE INDEX IF NOT EXISTS idx_precios_actuales_producto
    ON public.precios_actuales USING btree (producto_id);
```

Contiene los mismos campos que `precios` pero solo una fila por combinación `(producto_id, id_comercio, id_bandera, id_sucursal)`, correspondiente al registro más reciente.

La API usa esta vista para las búsquedas — es mucho más rápida que recorrer el historial completo. El DDL (`CREATE MATERIALIZED VIEW ... WITH NO DATA` + `CREATE INDEX`) vive en `setup_db.py` y el mantenimiento de datos (`REFRESH MATERIALIZED VIEW`) en `ingest.py`.

---

### `vista_productos` (VIEW)

Vista principal para la API. Une productos, enriquecimiento VTEX, precios actuales, comercios y sucursales. **Agrupa por producto + bandera + provincia** para mostrar una sola fila por producto por cadena por provincia, sin repetir por sucursal individual.

```sql
CREATE OR REPLACE VIEW vista_productos AS
SELECT
    p.id                                        AS producto_id,
    p.ean,
    p.id_comercio,
    p.id_producto,
    p.descripcion,
    COALESCE(v.nombre_vtex, p.descripcion)      AS nombre,
    COALESCE(v.marca_vtex,  p.marca)            AS marca,
    p.cantidad_presentacion,
    p.unidad_medida,
    v.categoria,
    v.subcategoria,
    v.imagen_url,
    c.bandera_nombre,
    su.provincia,
    MIN(pa.precio_lista::decimal)               AS precio_lista,
    MIN(pa.precio_promo1::decimal)              AS precio_promo1,
    MAX(pa.leyenda_promo1)                      AS leyenda_promo1,
    MIN(pa.precio_promo2::decimal)              AS precio_promo2,
    MAX(pa.leyenda_promo2)                      AS leyenda_promo2,
    MAX(pa.fecha)                               AS precio_fecha
FROM productos p
JOIN precios_actuales pa  ON p.id = pa.producto_id
JOIN comercios c          ON pa.id_comercio = c.id_comercio
                         AND pa.id_bandera  = c.id_bandera
JOIN sucursales su        ON pa.id_comercio = su.id_comercio
                         AND pa.id_bandera  = su.id_bandera
                         AND pa.id_sucursal = su.id_sucursal
LEFT JOIN productos_vtex v ON p.ean = v.ean
                           AND v.fuente != 'not_found'
GROUP BY
    p.id, p.ean, p.id_comercio, p.id_producto,
    v.nombre_vtex, p.descripcion,
    v.marca_vtex, p.marca,
    p.cantidad_presentacion, p.unidad_medida,
    v.categoria, v.subcategoria, v.imagen_url,
    c.bandera_nombre, su.provincia;
```

| Columna | Origen | Descripción |
|---|---|---|
| `producto_id` | productos.id | ID interno del producto |
| `ean` | productos | Código de barras si existe, NULL si no |
| `id_comercio` | productos | ID del comercio dueño del producto |
| `id_producto` | productos | Código interno del producto en el comercio |
| `descripcion` | productos | Descripción original en SEPA para búsqueda full-text optimizada |
| `nombre` | VTEX si existe, SEPA si no | Nombre legible para mostrar al usuario |
| `marca` | VTEX si existe, SEPA si no | Marca con capitalización correcta |
| `cantidad_presentacion` | productos (SEPA) | Siempre del SEPA — fuente de verdad |
| `unidad_medida` | productos (SEPA) | Siempre del SEPA — fuente de verdad |
| `categoria` | productos_vtex | NULL si no hay datos VTEX |
| `subcategoria` | productos_vtex | NULL si no hay datos VTEX |
| `imagen_url` | productos_vtex | NULL si no hay datos VTEX |
| `bandera_nombre` | comercios | Nombre de la cadena. Ej: "Carrefour" |
| `provincia` | sucursales | Código ISO de la provincia. Ej: "AR-B" |
| `precio_lista` | precios_actuales | Mínimo entre todas las sucursales de esa cadena en la provincia |
| `precio_promo1` | precios_actuales | Mínimo de promo1 disponible |
| `leyenda_promo1` | precios_actuales | Descripción de la promo1 |
| `precio_promo2` | precios_actuales | Mínimo de promo2 disponible |
| `leyenda_promo2` | precios_actuales | Descripción de la promo2 |
| `precio_fecha` | precios_actuales | Fecha del último cambio de precio detectado |

La API **siempre consulta esta vista**, nunca las tablas directamente.

---

## Relaciones entre objetos

```
comercios
  │  PK: (id_comercio, id_bandera)
  │
  ├──── sucursales
  │       PK: (id_comercio, id_bandera, id_sucursal)
  │       FK: (id_comercio, id_bandera) → comercios
  │       IDX: provincia
  │
  └──── [referencia implícita en precios via id_comercio, id_bandera]

productos
  │  PK: id
  │  UNIQUE: ean
  │  UNIQUE: (id_comercio, id_producto)
  │
  ├──── productos_vtex
  │       PK: ean
  │       FK: ean → productos.ean
  │       IDX: categoria
  │
  └──── precios
          PK: id
          FK: producto_id → productos.id
          IDX: (producto_id, fecha DESC)
          IDX: (fecha DESC)
          [FK a sucursales eliminada por calidad de datos]
                │
                └──── precios_actuales (MATERIALIZED VIEW)
                        IDX: producto_id
                        REFRESH: al finalizar cada ingesta diaria
                              │
                              └──── vista_productos (VIEW)
                                      Une todo para la API
                                      Agrupa por producto+bandera+provincia
```

---

## Secuencias

| Secuencia | Tabla | Campo |
|---|---|---|
| `precios_id_seq` | precios | id (último valor: ~46.3 millones) |
| `productos_id_seq` | productos | id (último valor: ~1.6 millones) |

---

## Consideraciones de diseño

### Calidad de datos del SEPA
- Algunos comercios usan `1` como EAN placeholder — esos productos quedan con `ean = NULL` y no pueden enriquecerse con VTEX.
- Algunos comercios reportan sucursales sin coordenadas GPS o con horarios incompletos.
- La FK entre `precios` y `sucursales` fue eliminada porque algunos comercios reportan `id_sucursal` en productos que no coincide con sus sucursales declaradas.

### Fuentes de datos
| Fuente | Rol | Frecuencia |
|---|---|---|
| SEPA (datos.produccion.gob.ar) | Fuente de verdad para precios, sucursales y comercios | Diaria |
| VTEX API | Enriquecimiento opcional: imagen, nombre legible, categoría | Una vez por EAN |

**Regla fundamental:** SEPA es la fuente de verdad para precios y datos de presentación (cantidad, unidad). VTEX aporta solo enriquecimiento visual. Nunca se reemplaza cantidad/unidad del SEPA con datos de VTEX ya que pueden diferir para el mismo EAN.

### Códigos de provincia ISO 3166-2

| Código | Provincia |
|---|---|
| AR-B | Buenos Aires |
| AR-C | Ciudad Autónoma de Buenos Aires |
| AR-X | Córdoba |
| AR-S | Santa Fe |
| AR-M | Mendoza |
| AR-A | Salta |
| AR-T | Tucumán |
| AR-R | Río Negro |
| AR-Q | Neuquén |
| AR-E | Entre Ríos |
| AR-H | Chaco |
| AR-G | Santiago del Estero |
| AR-K | Catamarca |
| AR-J | San Juan |
| AR-L | La Pampa |
| AR-N | Misiones |
| AR-P | Formosa |
| AR-U | Chubut |
| AR-V | Tierra del Fuego |
| AR-W | Corrientes |
| AR-Y | Jujuy |
| AR-Z | Santa Cruz |
| AR-D | San Luis |
| AR-F | La Rioja |
