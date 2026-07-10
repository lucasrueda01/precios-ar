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
    producto = (
        db.query(models.VistaProducto).filter(models.VistaProducto.producto_id == producto_id).first()
    )
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    return producto
