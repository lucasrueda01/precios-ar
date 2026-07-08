from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from decimal import Decimal

class PrecioBase(BaseModel):
    id_comercio: int
    id_bandera: int
    id_sucursal: int
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
    id: int
    ean: Optional[str] = None
    id_comercio: Optional[int] = None
    id_producto: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    descripcion_sepa: Optional[str] = None
    marca: Optional[str] = None
    cantidad_presentacion: Optional[Decimal] = None
    unidad_medida: Optional[str] = None
    cantidad_referencia: Optional[Decimal] = None
    unidad_referencia: Optional[str] = None
    categoria: Optional[str] = None
    subcategoria: Optional[str] = None
    imagen_url: Optional[str] = None

    class Config:
        from_attributes = True

class ProductoConPrecios(ProductoBase):
    precios: List[PrecioBase] = []
