import requests
import zipfile
import io
import json
import pandas as pd
import sqlalchemy as sa
from datetime import date

DIAS_ES = {
    "Monday": "lunes",
    "Tuesday": "martes",
    "Wednesday": "miercoles",
    "Thursday": "jueves",
    "Friday": "viernes",
    "Saturday": "sabado",
    "Sunday": "domingo",
}
DIA_ES = DIAS_ES[date.today().strftime("%A")]
URL_ZIP = f"https://datos.produccion.gob.ar/dataset/6f47ec76-d1ce-4e34-a7e1-621fe9b1d0b5/resource/91bc072a-4726-44a1-85ec-4a8467aad27e/download/sepa_{DIA_ES}.zip"
HOY = date.today().isoformat()

engine = sa.create_engine(
    "postgresql+psycopg2://",
    connect_args={
        "host": "localhost",
        "port": 5432,
        "dbname": "precioar",
        "user": "postgres",
        "password": "osopardo",
    },
)


def descargar_zip(url):
    print(f"Descargando {url} ...")
    r = requests.get(url, stream=True, timeout=120)
    r.raise_for_status()
    chunks = []
    descargado = 0
    for chunk in r.iter_content(chunk_size=1024 * 256):
        chunks.append(chunk)
        descargado += len(chunk)
        print(f"  {descargado / 1024 / 1024:.1f} MB", end="\r")
    print(f"\n  Descarga completa")
    return io.BytesIO(b"".join(chunks))


def leer_csv(zip_file, nombre):
    df = pd.read_csv(
        zip_file.open(nombre), sep="|", encoding="utf-8", dtype=str, on_bad_lines="skip"
    )
    primera_col = df.columns[0]
    df = df[df[primera_col].str.match(r"^\d+$", na=False)]
    return df


def procesar_comercios(df, conn):
    df = df.rename(
        columns={
            "comercio_cuit": "cuit",
            "comercio_razon_social": "razon_social",
            "comercio_bandera_nombre": "bandera_nombre",
            "comercio_bandera_url": "bandera_url",
            "comercio_ultima_actualizacion": "ultima_actualizacion",
        }
    )
    df = df[
        [
            "id_comercio",
            "id_bandera",
            "cuit",
            "razon_social",
            "bandera_nombre",
            "bandera_url",
            "ultima_actualizacion",
        ]
    ]
    df = df.drop_duplicates(subset=["id_comercio", "id_bandera"])

    conn.execute(sa.text("""
        CREATE TEMP TABLE IF NOT EXISTS tmp_comercios
        (LIKE comercios INCLUDING ALL) ON COMMIT DROP
    """))
    df.to_sql(
        "tmp_comercios",
        conn,
        if_exists="append",
        index=False,
        method="multi",
        chunksize=500,
    )
    conn.execute(sa.text("""
        INSERT INTO comercios SELECT * FROM tmp_comercios
        ON CONFLICT (id_comercio, id_bandera) DO NOTHING
    """))
    print(f"    comercios: {len(df)} filas procesadas")


def procesar_sucursales(df, conn):
    horario_cols = [c for c in df.columns if "horario" in c]
    df["horarios"] = df.apply(
        lambda row: json.dumps(
            {
                col.replace("sucursales_", "").replace("_horario_atencion", ""): (
                    None if pd.isna(row[col]) else row[col]
                )
                for col in horario_cols
            }
        ),
        axis=1,
    )
    df = df.rename(
        columns={
            "sucursales_nombre": "nombre",
            "sucursales_tipo": "tipo",
            "sucursales_calle": "calle",
            "sucursales_numero": "numero",
            "sucursales_latitud": "latitud",
            "sucursales_longitud": "longitud",
            "sucursales_barrio": "barrio",
            "sucursales_codigo_postal": "codigo_postal",
            "sucursales_localidad": "localidad",
            "sucursales_provincia": "provincia",
        }
    )
    cols = [
        "id_comercio",
        "id_bandera",
        "id_sucursal",
        "nombre",
        "tipo",
        "calle",
        "numero",
        "latitud",
        "longitud",
        "barrio",
        "codigo_postal",
        "localidad",
        "provincia",
        "horarios",
    ]
    df = df[cols].drop_duplicates(subset=["id_comercio", "id_bandera", "id_sucursal"])

    conn.execute(sa.text("""
        CREATE TEMP TABLE IF NOT EXISTS tmp_sucursales
        (LIKE sucursales INCLUDING ALL) ON COMMIT DROP
    """))
    df.to_sql(
        "tmp_sucursales",
        conn,
        if_exists="append",
        index=False,
        method="multi",
        chunksize=500,
    )
    conn.execute(sa.text("""
        INSERT INTO sucursales SELECT * FROM tmp_sucursales
        ON CONFLICT (id_comercio, id_bandera, id_sucursal) DO NOTHING
    """))
    print(f"    sucursales: {len(df)} filas procesadas")


def procesar_productos(df, conn):
    df = df.rename(
        columns={
            "productos_descripcion": "descripcion",
            "productos_marca": "marca",
            "productos_cantidad_presentacion": "cantidad_presentacion",
            "productos_unidad_medida_presentacion": "unidad_medida",
            "productos_cantidad_referencia": "cantidad_referencia",
            "productos_unidad_medida_referencia": "unidad_referencia",
        }
    )

    df["id_producto"] = df["id_producto"].astype(str).str.strip()
    df["id_comercio"] = df["id_comercio"].astype(str).str.strip()

    # ── FIX EAN: productos_ean es un FLAG (1=EAN real, 0=código interno) ──
    # El EAN real está en id_producto cuando el flag vale "1"
    df["ean_flag"] = df["productos_ean"].astype(str).str.strip()
    df["ean"] = df.apply(
        lambda r: r["id_producto"] if r["ean_flag"] == "1" else None, axis=1
    )

    df_uniq = df[
        [
            "ean",
            "id_comercio",
            "id_producto",
            "descripcion",
            "marca",
            "cantidad_presentacion",
            "unidad_medida",
            "cantidad_referencia",
            "unidad_referencia",
        ]
    ]
    df_uniq = df_uniq.drop_duplicates(subset=["id_comercio", "id_producto"])

    if df_uniq.empty:
        print(f"    productos: 0 procesados")
        return {}

    # Debug: mostramos cuántos tienen EAN real
    con_ean = df_uniq["ean"].notna().sum()
    print(
        f"    productos: {len(df_uniq)} únicos, {con_ean} con EAN real ({round(con_ean/len(df_uniq)*100)}%)"
    )

    conn.execute(sa.text("""
        CREATE TEMP TABLE IF NOT EXISTS tmp_productos
        (LIKE productos INCLUDING ALL) ON COMMIT DROP
    """))
    df_uniq.to_sql(
        "tmp_productos",
        conn,
        if_exists="append",
        index=False,
        method="multi",
        chunksize=500,
    )
    conn.execute(sa.text("""
        INSERT INTO productos
            (ean, id_comercio, id_producto, descripcion, marca,
             cantidad_presentacion, unidad_medida,
             cantidad_referencia, unidad_referencia)
        SELECT ean, id_comercio, id_producto, descripcion, marca,
               cantidad_presentacion, unidad_medida,
               cantidad_referencia, unidad_referencia
        FROM tmp_productos
        ON CONFLICT DO NOTHING
    """))

    ids = conn.execute(sa.text("""
        SELECT id, id_comercio::text, id_producto
        FROM productos
        WHERE (id_comercio::text, id_producto::text) IN (
            SELECT id_comercio::text, id_producto::text FROM tmp_productos
        )
    """))
    id_map = {(str(r.id_comercio), str(r.id_producto)): r.id for r in ids}
    return id_map


def procesar_precios(df, conn, id_map):
    df = df.rename(
        columns={
            "productos_precio_lista": "precio_lista",
            "productos_precio_unitario_promo1": "precio_promo1",
            "productos_precio_unitario_promo2": "precio_promo2",
            "productos_precio_referencia": "precio_referencia",
        }
    )

    if "productos_leyenda_promo1" in df.columns:
        df = df.rename(columns={"productos_leyenda_promo1": "leyenda_promo1"})
    else:
        df["leyenda_promo1"] = None
    if "productos_leyenda_promo2" in df.columns:
        df = df.rename(columns={"productos_leyenda_promo2": "leyenda_promo2"})
    else:
        df["leyenda_promo2"] = None
    if "precio_promo1" not in df.columns:
        df["precio_promo1"] = None
    if "precio_promo2" not in df.columns:
        df["precio_promo2"] = None

    df["id_producto"] = df["id_producto"].astype(str).str.strip()
    df["id_comercio"] = df["id_comercio"].astype(str).str.strip()
    df["producto_id"] = df.apply(
        lambda r: id_map.get((r["id_comercio"], r["id_producto"])), axis=1
    )
    df = df.dropna(subset=["producto_id"])
    df["producto_id"] = df["producto_id"].astype(int)
    df["fecha"] = HOY

    cols = [
        "producto_id",
        "id_comercio",
        "id_bandera",
        "id_sucursal",
        "fecha",
        "precio_lista",
        "precio_promo1",
        "leyenda_promo1",
        "precio_promo2",
        "leyenda_promo2",
        "precio_referencia",
    ]
    df = df[cols]

    df["id_comercio"] = df["id_comercio"].astype(str).str.strip()
    df["id_bandera"] = df["id_bandera"].astype(str).str.strip()
    df["id_sucursal"] = df["id_sucursal"].astype(str).str.strip()

    if df.empty:
        print(f"    precios: 0 filas (sin datos)")
        return

    id_comercio = int(df["id_comercio"].iloc[0])

    ultimos = pd.read_sql(
        sa.text("""
        SELECT DISTINCT ON (producto_id, id_bandera, id_sucursal)
            producto_id,
            id_bandera::text,
            id_sucursal::text,
            precio_lista,
            precio_promo1,
            leyenda_promo1,
            precio_promo2,
            leyenda_promo2
        FROM precios
        WHERE id_comercio = :id_comercio
        ORDER BY producto_id, id_bandera, id_sucursal, fecha DESC
    """),
        conn,
        params={"id_comercio": id_comercio},
    )

    if ultimos.empty:
        df_insertar = df
    else:
        df_merged = df.merge(
            ultimos,
            on=["producto_id", "id_bandera", "id_sucursal"],
            how="left",
            suffixes=("_nuevo", "_ultimo"),
        )

        def cambio(row):
            if pd.isna(row["precio_lista_ultimo"]):
                return True
            if str(row["precio_lista_nuevo"]) != str(row["precio_lista_ultimo"]):
                return True
            promo1_cambio = str(row.get("precio_promo1_nuevo")) != str(
                row.get("precio_promo1_ultimo")
            )
            promo2_cambio = str(row.get("precio_promo2_nuevo")) != str(
                row.get("precio_promo2_ultimo")
            )
            if promo1_cambio or promo2_cambio:
                return True
            return False

        mask = df_merged.apply(cambio, axis=1)
        df_insertar = df_merged[mask][cols].copy()

    if df_insertar.empty:
        print(f"    precios: 0 filas insertadas (sin cambios)")
        return

    df_insertar.to_sql(
        "precios", conn, if_exists="append", index=False, method="multi", chunksize=1000
    )
    total = len(df)
    insertados = len(df_insertar)
    pct = round(insertados / total * 100, 1) if total > 0 else 0
    print(f"    precios: {insertados}/{total} filas insertadas ({pct}% cambiaron)")


def crear_o_refrescar_vista(conn):
    conn.execute(sa.text("""
        CREATE MATERIALIZED VIEW IF NOT EXISTS precios_actuales AS
        SELECT DISTINCT ON (producto_id, id_comercio, id_bandera, id_sucursal)
            producto_id, id_comercio, id_bandera, id_sucursal,
            fecha, precio_lista, precio_promo1, leyenda_promo1,
            precio_promo2, leyenda_promo2, precio_referencia
        FROM precios
        ORDER BY producto_id, id_comercio, id_bandera, id_sucursal, fecha DESC
    """))
    conn.execute(sa.text("""
        CREATE INDEX IF NOT EXISTS idx_precios_actuales_producto
        ON precios_actuales(producto_id)
    """))
    conn.execute(sa.text("REFRESH MATERIALIZED VIEW precios_actuales"))
    print("  Vista precios_actuales refrescada.")


def procesar_zip_interno(zip_externo, path_interno):
    print(f"  Procesando {path_interno} ...")
    zip_interno = zipfile.ZipFile(io.BytesIO(zip_externo.read(path_interno)))
    archivos = zip_interno.namelist()

    comercio_f = next((f for f in archivos if "comercio" in f.lower()), None)
    sucursal_f = next((f for f in archivos if "sucursal" in f.lower()), None)
    producto_f = next((f for f in archivos if "producto" in f.lower()), None)

    with engine.begin() as conn:
        if comercio_f:
            procesar_comercios(leer_csv(zip_interno, comercio_f), conn)
        if sucursal_f:
            procesar_sucursales(leer_csv(zip_interno, sucursal_f), conn)
        if producto_f:
            df_prod = leer_csv(zip_interno, producto_f)
            id_map = procesar_productos(df_prod, conn)
            procesar_precios(df_prod, conn, id_map)


if __name__ == "__main__":
    zip_bytes = descargar_zip(URL_ZIP)
    zip_externo = zipfile.ZipFile(zip_bytes)

    zips_internos = [f for f in zip_externo.namelist() if f.endswith(".zip")]
    print(f"\nEncontrados {len(zips_internos)} ZIPs internos\n")

    for i, path in enumerate(zips_internos, 1):
        print(f"[{i}/{len(zips_internos)}]", end=" ")
        try:
            procesar_zip_interno(zip_externo, path)
        except Exception as e:
            print(f"    ERROR: {e}")
            continue

    print("\nRefrescando vista de precios actuales...")
    with engine.begin() as conn:
        crear_o_refrescar_vista(conn)

    print("\nIngesta completada.")
