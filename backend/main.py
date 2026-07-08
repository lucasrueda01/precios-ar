from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, case
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
    db: Session = Depends(get_db),
    limit: int = Query(50, le=100),
):
    query = db.query(models.VistaProducto).filter(
        models.VistaProducto.nombre.ilike(f"%{q}%")
    )

    if provincia:
        query = query.filter(models.VistaProducto.provincia == provincia)

    # Ordenar priorizando precios válidos mayores a 0, luego por precio ascendente
    query = query.order_by(
        case((models.VistaProducto.precio_lista > 0, 0), else_=1),
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
