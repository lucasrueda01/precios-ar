from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# En producción, esto debería venir de variables de entorno (.env)
SQLALCHEMY_DATABASE_URL = "postgresql+psycopg2://postgres:osopardo@localhost:5432/precioar"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
