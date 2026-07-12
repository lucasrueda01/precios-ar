import sqlalchemy as sa

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

with engine.connect() as conn:
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS comercios (
            id_comercio     INT,
            id_bandera      INT,
            cuit            VARCHAR(20),
            razon_social    VARCHAR(200),
            bandera_nombre  VARCHAR(100),
            bandera_url     VARCHAR(200),
            ultima_actualizacion DATE,
            PRIMARY KEY (id_comercio, id_bandera)
        );

        CREATE TABLE IF NOT EXISTS sucursales (
            id_comercio     INT,
            id_bandera      INT,
            id_sucursal     INT,
            nombre          VARCHAR(200),
            tipo            VARCHAR(50),
            calle           VARCHAR(200),
            numero          VARCHAR(20),
            latitud         DECIMAL(10,7),
            longitud        DECIMAL(10,7),
            barrio          VARCHAR(100),
            codigo_postal   VARCHAR(10),
            localidad       VARCHAR(100),
            provincia       VARCHAR(50),
            horarios        JSONB,
            PRIMARY KEY (id_comercio, id_bandera, id_sucursal),
            FOREIGN KEY (id_comercio, id_bandera)
                REFERENCES comercios(id_comercio, id_bandera)
        );

        CREATE TABLE IF NOT EXISTS productos (
            id                    BIGSERIAL PRIMARY KEY,
            ean                   VARCHAR(30),
            id_comercio           INT,
            id_producto           VARCHAR(30),
            descripcion           VARCHAR(300),
            marca                 VARCHAR(100),
            cantidad_presentacion DECIMAL(10,3),
            unidad_medida         VARCHAR(20),
            cantidad_referencia   DECIMAL(10,3),
            unidad_referencia     VARCHAR(20),
            UNIQUE (ean),
            UNIQUE (id_comercio, id_producto)
        );

        CREATE TABLE IF NOT EXISTS precios (
            id                BIGSERIAL PRIMARY KEY,
            producto_id       BIGINT REFERENCES productos(id),
            id_comercio       INT,
            id_bandera        INT,
            id_sucursal       INT,
            fecha             DATE NOT NULL,
            precio_lista      DECIMAL(12,2),
            precio_promo1     DECIMAL(12,2),
            leyenda_promo1    VARCHAR(300),
            precio_promo2     DECIMAL(12,2),
            leyenda_promo2    VARCHAR(300),
            precio_referencia DECIMAL(12,2),
            FOREIGN KEY (id_comercio, id_bandera, id_sucursal)
                REFERENCES sucursales(id_comercio, id_bandera, id_sucursal)
        );

        CREATE INDEX IF NOT EXISTS idx_precios_producto_fecha
            ON precios(producto_id, fecha DESC);
        CREATE INDEX IF NOT EXISTS idx_precios_fecha
            ON precios(fecha DESC);
        CREATE INDEX IF NOT EXISTS idx_sucursales_provincia
            ON sucursales(provincia);
        CREATE INDEX IF NOT EXISTS idx_productos_fts
            ON productos USING gin(to_tsvector('spanish', descripcion));

        CREATE TABLE IF NOT EXISTS productos_vtex (
            ean             VARCHAR(30) PRIMARY KEY,
            nombre_vtex     VARCHAR(300),
            marca_vtex      VARCHAR(100),
            categoria       VARCHAR(200),
            subcategoria    VARCHAR(100),
            imagen_url      VARCHAR(500),
            fuente          VARCHAR(100),
            enriquecido_en  TIMESTAMP DEFAULT NOW()
        );

        CREATE MATERIALIZED VIEW IF NOT EXISTS precios_actuales AS
        SELECT DISTINCT ON (producto_id, id_comercio, id_bandera, id_sucursal)
            producto_id, id_comercio, id_bandera, id_sucursal,
            fecha, precio_lista, precio_promo1, leyenda_promo1,
            precio_promo2, leyenda_promo2, precio_referencia
        FROM precios
        ORDER BY producto_id, id_comercio, id_bandera, id_sucursal, fecha DESC
        WITH NO DATA;

        CREATE INDEX IF NOT EXISTS idx_precios_actuales_producto
            ON precios_actuales(producto_id);

        DROP VIEW IF EXISTS vista_productos CASCADE;
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
    """))
    conn.commit()
    print("Tablas y vistas creadas correctamente.")

