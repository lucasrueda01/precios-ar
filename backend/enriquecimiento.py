import requests
import time
import sqlalchemy as sa

engine = sa.create_engine(
    "postgresql+psycopg2://",
    connect_args={
        "host": "localhost", "port": 5432,
        "dbname": "precioar", "user": "postgres", "password": "osopardo",
    }
)

# Mapeo exacto bandera_nombre → dominio VTEX
# Solo las cadenas que confirmamos que usan VTEX
VTEX_DOMINIOS = [
    "carrefour.com.ar",
    "jumbo.com.ar",
    "disco.com.ar",
    "vea.com.ar",
    "diaonline.com.ar",
    "changomas.com.ar",
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

def limpiar_ean(ean: str) -> str:
    limpio = str(ean).lstrip("0")
    return limpio if limpio else ean

def consultar_vtex(ean: str, dominio: str) -> dict | None:
    ean_limpio = limpiar_ean(ean)
    url = f"https://www.{dominio}/api/catalog_system/pub/products/search?fq=alternateIds_Ean:{ean_limpio}"
    # Changomas tiene problemas de certificado SSL, deshabilitamos verificación
    verify_ssl = dominio != "changomas.com.ar"
    try:
        r = requests.get(url, headers=HEADERS, timeout=5, verify=verify_ssl)
        if r.status_code != 200:
            return None
        datos = r.json()
        if not datos:
            return None

        producto = datos[0]
        items = producto.get("items", [])
        imagen_url = None
        if items and items[0].get("images"):
            imagen_url = items[0]["images"][0].get("imageUrl")

        categorias = producto.get("categories", [])
        categoria_completa = ""
        subcategoria = ""
        if categorias:
            mas_larga = max(categorias, key=len)
            partes = [p for p in mas_larga.strip("/").split("/") if p]
            categoria_completa = "/".join(partes)
            subcategoria = partes[-1] if partes else ""

        return {
            "nombre_vtex":   producto.get("productName"),
            "marca_vtex":    producto.get("brand"),
            "categoria":     categoria_completa,
            "subcategoria":  subcategoria,
            "imagen_url":    imagen_url,
            "fuente":        dominio,
        }
    except Exception as e:
        print(f"      [Error {dominio}] {e}")
        return None

def enriquecer(batch_size=200):
    with engine.connect() as conn:
        rows = conn.execute(sa.text("""
            SELECT p.ean
            FROM productos p
            LEFT JOIN productos_vtex v ON p.ean = v.ean
            WHERE p.ean IS NOT NULL
              AND v.ean IS NULL
            ORDER BY p.id
            LIMIT :limit
        """), {"limit": batch_size}).fetchall()

        if not rows:
            print("Todos los productos con EAN ya están enriquecidos.")
            return

        print(f"Enriqueciendo {len(rows)} productos...\n")
        ok = 0
        sin_datos = 0

        for i, (ean,) in enumerate(rows, 1):
            print(f"  [{i}/{len(rows)}] EAN {ean}", end=" ... ")

            resultado = None
            for dominio in VTEX_DOMINIOS:
                resultado = consultar_vtex(ean, dominio)
                if resultado:
                    break
                time.sleep(0.2)

            if resultado:
                conn.execute(sa.text("""
                    INSERT INTO productos_vtex
                        (ean, nombre_vtex, marca_vtex, categoria,
                         subcategoria, imagen_url, fuente)
                    VALUES
                        (:ean, :nombre_vtex, :marca_vtex, :categoria,
                         :subcategoria, :imagen_url, :fuente)
                    ON CONFLICT (ean) DO UPDATE SET
                        nombre_vtex    = EXCLUDED.nombre_vtex,
                        marca_vtex     = EXCLUDED.marca_vtex,
                        categoria      = EXCLUDED.categoria,
                        subcategoria   = EXCLUDED.subcategoria,
                        imagen_url     = EXCLUDED.imagen_url,
                        fuente         = EXCLUDED.fuente,
                        enriquecido_en = NOW()
                """), {**resultado, "ean": ean})
                conn.commit()
                print(f"✓ {resultado['subcategoria']} — {resultado['nombre_vtex'][:40]}")
                ok += 1
            else:
                conn.execute(sa.text("""
                    INSERT INTO productos_vtex (ean, fuente)
                    VALUES (:ean, 'not_found')
                    ON CONFLICT DO NOTHING
                """), {"ean": ean})
                conn.commit()
                print("✗ no encontrado")
                sin_datos += 1

            time.sleep(0.3)

        print(f"\nResultado: {ok} enriquecidos, {sin_datos} no encontrados.")

        total_ean = conn.execute(sa.text(
            "SELECT COUNT(*) FROM productos WHERE ean IS NOT NULL"
        )).scalar()
        con_imagen = conn.execute(sa.text(
            "SELECT COUNT(*) FROM productos_vtex WHERE imagen_url IS NOT NULL"
        )).scalar()
        print(f"Cobertura: {con_imagen}/{total_ean} ({round(con_imagen/total_ean*100) if total_ean else 0}%)")

if __name__ == "__main__":
    enriquecer(batch_size=200)