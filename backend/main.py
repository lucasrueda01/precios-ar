from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, case, func
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware

from . import models, schemas
from .database import engine, get_db

app = FastAPI(title="PrecioAR API")

# Configurar CORS para el frontend en Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/productos/search", response_model=List[schemas.ProductoBase])
def search_productos(
    q: str,
    provincia: Optional[str] = None,
    orden: Optional[str] = Query("relevancia"),
    db: Session = Depends(get_db),
    limit: int = Query(50, le=100),
):
    q_clean = q.strip()
    query = db.query(models.VistaProducto).filter(
        or_(
            func.to_tsvector('spanish', models.VistaProducto.descripcion).op('@@')(func.plainto_tsquery('spanish', q_clean)),
            models.VistaProducto.ean == q_clean,
        )
    )

    if provincia:
        query = query.filter(models.VistaProducto.provincia == provincia)

    if orden == "precio_asc":
        query = query.order_by(
            case((models.VistaProducto.precio_lista > 0, 0), else_=1),
            models.VistaProducto.precio_lista.asc()
        )
    elif orden == "precio_desc":
        query = query.order_by(
            case((models.VistaProducto.precio_lista > 0, 0), else_=1),
            models.VistaProducto.precio_lista.desc()
        )
    elif orden in ("alfa_asc", "alfabetico"):
        query = query.order_by(models.VistaProducto.nombre.asc())
    else:
        # Ordenar por relevancia por defecto:
        # 1. Precios válidos mayores a 0
        # 2. Relevancia por prefijo (EAN exacto o producto que empieza con el término buscado / categoría coincidente)
        # 3. Relevancia FTS normalizada por longitud de descripción (ts_rank con flag 2)
        # 4. Precio de lista ascendente
        query = query.order_by(
            case((models.VistaProducto.precio_lista > 0, 0), else_=1),
            case(
                (models.VistaProducto.ean == q_clean, 0),
                (or_(
                    models.VistaProducto.descripcion.ilike(f"{q_clean}%"),
                    models.VistaProducto.nombre.ilike(f"{q_clean}%"),
                    models.VistaProducto.categoria.ilike(f"%{q_clean}%"),
                    models.VistaProducto.subcategoria.ilike(f"%{q_clean}%"),
                ), 1),
                else_=2
            ),
            func.ts_rank(
                func.to_tsvector('spanish', models.VistaProducto.descripcion),
                func.plainto_tsquery('spanish', q_clean),
                2
            ).desc(),
            models.VistaProducto.precio_lista.asc()
        )

    return query.limit(limit).all()


@app.get("/api/productos/{producto_id}", response_model=schemas.ProductoConPrecios)
def get_producto(
    producto_id: int, provincia: Optional[str] = None, db: Session = Depends(get_db)
):
    query = db.query(models.VistaProducto).filter(models.VistaProducto.producto_id == producto_id)
    if provincia:
        producto = query.filter(models.VistaProducto.provincia == provincia).first()
    else:
        producto = None

    if not producto:
        producto = db.query(models.VistaProducto).filter(models.VistaProducto.producto_id == producto_id).first()

    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    precios_raw = (
        db.query(
            models.Precio,
            models.Comercio.bandera_nombre,
            models.Sucursal.nombre.label("sucursal_nombre"),
            models.Sucursal.calle,
            models.Sucursal.numero,
            models.Sucursal.localidad,
            models.Sucursal.provincia,
        )
        .join(
            models.Comercio,
            (models.Precio.id_comercio == models.Comercio.id_comercio)
            & (models.Precio.id_bandera == models.Comercio.id_bandera),
        )
        .join(
            models.Sucursal,
            (models.Precio.id_comercio == models.Sucursal.id_comercio)
            & (models.Precio.id_bandera == models.Sucursal.id_bandera)
            & (models.Precio.id_sucursal == models.Sucursal.id_sucursal),
        )
        .filter(models.Precio.producto_id == producto_id)
        .order_by(models.Precio.fecha.desc())
        .limit(300)
        .all()
    )

    precios_lista = []
    vistos = set()
    for p, bandera_nombre, sucursal_nombre, calle, numero, loc, prov in precios_raw:
        if provincia and prov != provincia:
            continue
        key = (p.id_comercio, p.id_bandera, p.id_sucursal)
        if key in vistos:
            continue
        vistos.add(key)

        direccion_parts = [part for part in [calle, numero] if part]
        direccion = " ".join(direccion_parts) if direccion_parts else None

        precios_lista.append(
            schemas.PrecioBase(
                id_comercio=p.id_comercio,
                id_bandera=p.id_bandera,
                id_sucursal=p.id_sucursal,
                bandera_nombre=bandera_nombre,
                sucursal_nombre=sucursal_nombre,
                direccion=direccion,
                localidad=loc,
                provincia=prov,
                fecha=p.fecha,
                precio_lista=p.precio_lista,
                precio_promo1=p.precio_promo1,
                leyenda_promo1=p.leyenda_promo1,
                precio_promo2=p.precio_promo2,
                leyenda_promo2=p.leyenda_promo2,
                precio_referencia=p.precio_referencia,
            )
        )

    if not precios_lista and provincia:
        vistos.clear()
        for p, bandera_nombre, sucursal_nombre, calle, numero, loc, prov in precios_raw:
            key = (p.id_comercio, p.id_bandera, p.id_sucursal)
            if key in vistos:
                continue
            vistos.add(key)
            direccion_parts = [part for part in [calle, numero] if part]
            direccion = " ".join(direccion_parts) if direccion_parts else None
            precios_lista.append(
                schemas.PrecioBase(
                    id_comercio=p.id_comercio,
                    id_bandera=p.id_bandera,
                    id_sucursal=p.id_sucursal,
                    bandera_nombre=bandera_nombre,
                    sucursal_nombre=sucursal_nombre,
                    direccion=direccion,
                    localidad=loc,
                    provincia=prov,
                    fecha=p.fecha,
                    precio_lista=p.precio_lista,
                    precio_promo1=p.precio_promo1,
                    leyenda_promo1=p.leyenda_promo1,
                    precio_promo2=p.precio_promo2,
                    leyenda_promo2=p.leyenda_promo2,
                    precio_referencia=p.precio_referencia,
                )
            )

    def get_precio_efectivo(item: schemas.PrecioBase):
        pl = float(item.precio_lista or 0)
        pp = float(item.precio_promo1 or 0)
        if pp > 0 and pp < pl:
            return pp
        return pl if pl > 0 else 999999999

    precios_lista.sort(key=get_precio_efectivo)

    data = schemas.ProductoConPrecios.model_validate(producto)
    data.precios = precios_lista
    return data
