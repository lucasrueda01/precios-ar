from sqlalchemy import Column, Integer, String, Date, Numeric, ForeignKey, JSON, BigInteger, ForeignKeyConstraint
from sqlalchemy.orm import relationship, foreign
from .database import Base

class Comercio(Base):
    __tablename__ = "comercios"

    id_comercio = Column(Integer, primary_key=True)
    id_bandera = Column(Integer, primary_key=True)
    cuit = Column(String(20))
    razon_social = Column(String(200))
    bandera_nombre = Column(String(100))
    bandera_url = Column(String(200))
    ultima_actualizacion = Column(Date)

    sucursales = relationship("Sucursal", back_populates="comercio")

class Sucursal(Base):
    __tablename__ = "sucursales"

    id_comercio = Column(Integer, primary_key=True)
    id_bandera = Column(Integer, primary_key=True)
    id_sucursal = Column(Integer, primary_key=True)
    nombre = Column(String(200))
    tipo = Column(String(50))
    calle = Column(String(200))
    numero = Column(String(20))
    latitud = Column(Numeric(10, 7))
    longitud = Column(Numeric(10, 7))
    barrio = Column(String(100))
    codigo_postal = Column(String(10))
    localidad = Column(String(100))
    provincia = Column(String(50))
    horarios = Column(JSON)

    __table_args__ = (
        ForeignKeyConstraint(
            ['id_comercio', 'id_bandera'],
            ['comercios.id_comercio', 'comercios.id_bandera']
        ),
    )

    comercio = relationship("Comercio", back_populates="sucursales")

class Producto(Base):
    __tablename__ = "productos"

    id = Column(BigInteger, primary_key=True, index=True)
    ean = Column(String(30), unique=True)
    id_comercio = Column(Integer)
    id_producto = Column(String(30))
    descripcion = Column(String(300))
    marca = Column(String(100))
    cantidad_presentacion = Column(Numeric(10, 3))
    unidad_medida = Column(String(20))
    cantidad_referencia = Column(Numeric(10, 3))
    unidad_referencia = Column(String(20))

    precios = relationship("Precio", back_populates="producto")

class VistaProducto(Base):
    __tablename__ = "vista_productos"

    producto_id = Column(BigInteger, primary_key=True, index=True)
    ean = Column(String(30))
    id_comercio = Column(Integer, primary_key=True)
    id_producto = Column(String(30))
    nombre = Column(String(300))
    marca = Column(String(100))
    cantidad_presentacion = Column(Numeric(10, 3))
    unidad_medida = Column(String(20))
    categoria = Column(String(200))
    subcategoria = Column(String(100))
    imagen_url = Column(String(500))
    bandera_nombre = Column(String(100), primary_key=True)
    provincia = Column(String(50), primary_key=True)
    precio_lista = Column(Numeric(12, 2))
    precio_promo1 = Column(Numeric(12, 2))
    leyenda_promo1 = Column(String(300))
    precio_promo2 = Column(Numeric(12, 2))
    leyenda_promo2 = Column(String(300))
    precio_fecha = Column(Date)

    precios = relationship("Precio", primaryjoin="VistaProducto.producto_id == foreign(Precio.producto_id)", viewonly=True)

    @property
    def id(self):
        return self.producto_id

    @property
    def descripcion(self):
        return self.nombre

class Precio(Base):
    __tablename__ = "precios"

    id = Column(BigInteger, primary_key=True, index=True)
    producto_id = Column(BigInteger, ForeignKey("productos.id"))
    id_comercio = Column(Integer)
    id_bandera = Column(Integer)
    id_sucursal = Column(Integer)
    fecha = Column(Date, nullable=False, index=True)
    precio_lista = Column(Numeric(12, 2))
    precio_promo1 = Column(Numeric(12, 2))
    leyenda_promo1 = Column(String(300))
    precio_promo2 = Column(Numeric(12, 2))
    leyenda_promo2 = Column(String(300))
    precio_referencia = Column(Numeric(12, 2))

    __table_args__ = (
        ForeignKeyConstraint(
            ['id_comercio', 'id_bandera', 'id_sucursal'],
            ['sucursales.id_comercio', 'sucursales.id_bandera', 'sucursales.id_sucursal']
        ),
    )

    producto = relationship("Producto", back_populates="precios")
