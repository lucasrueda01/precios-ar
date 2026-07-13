from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from decimal import Decimal

class PrecioBase(BaseModel):
    id_comercio: int
    id_bandera: int
    id_sucursal: int
    bandera_nombre: Optional[str] = None
    sucursal_nombre: Optional[str] = None
    direccion: Optional[str] = None
    localidad: Optional[str] = None
    provincia: Optional[str] = None
    fecha: date
    precio_lista: Optional[Decimal] = None
    precio_promo1: Optional[Decimal] = None
    leyenda_promo1: Optional[str] = None
    precio_promo2: Optional[Decimal] = None
    leyenda_promo2: Optional[str] = None
    precio_referencia: Optional[Decimal] = None

    class Config:
        from_attributes = True

class ProductoBase(BaseModel):
    producto_id: int
    id: Optional[int] = None
    ean: Optional[str] = None
    id_comercio: Optional[int] = None
    id_producto: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    marca: Optional[str] = None
    cantidad_presentacion: Optional[Decimal] = None
    unidad_medida: Optional[str] = None
    cantidad_referencia: Optional[Decimal] = None
    unidad_referencia: Optional[str] = None
    categoria: Optional[str] = None
    subcategoria: Optional[str] = None
    imagen_url: Optional[str] = None
    id_bandera: Optional[int] = None
    id_sucursal: Optional[int] = None
    bandera_nombre: Optional[str] = None
    provincia: Optional[str] = None
    localidad: Optional[str] = None
    precio_lista: Optional[Decimal] = None
    precio_promo1: Optional[Decimal] = None
    leyenda_promo1: Optional[str] = None
    precio_promo2: Optional[Decimal] = None
    leyenda_promo2: Optional[str] = None
    precio_fecha: Optional[date] = None

    class Config:
        from_attributes = True

class ProductoConPrecios(ProductoBase):
    precios: List[PrecioBase] = []
