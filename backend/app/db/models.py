from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class Espacio(Base):
    __tablename__ = "espacios"

    id = Column(String(50), primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, unique=True)
    tipo = Column(String(50), nullable=False) # auditorio, aula, laboratorio, sala_reuniones, cubículo
    capacidad = Column(Integer, nullable=False)
    ubicacion = Column(String(200), nullable=False)
    estado = Column(String(50), default="disponible") # disponible, ocupado, inhabilitado

    reservas = relationship("Reserva", back_populates="espacio")
    incidencias = relationship("Incidencia", back_populates="espacio")

class Recurso(Base):
    __tablename__ = "recursos"

    id = Column(String(50), primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    categoria = Column(String(50), nullable=False) # audiovisual, audio, computo, redes
    serial = Column(String(100), unique=True, nullable=False)
    estado = Column(String(50), default="disponible") # disponible, en_uso, en_mantenimiento, inhabilitado
    ubicacion_actual = Column(String(100), nullable=False)

    reservas = relationship("Reserva", back_populates="recurso")
    incidencias = relationship("Incidencia", back_populates="recurso")

class Reserva(Base):
    __tablename__ = "reservas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    espacio_id = Column(String(50), ForeignKey("espacios.id"), nullable=False)
    recurso_id = Column(String(50), ForeignKey("recursos.id"), nullable=True)
    solicitante = Column(String(150), nullable=False)
    motivo = Column(String(255), nullable=False)
    fecha_inicio = Column(DateTime, nullable=False, index=True)
    fecha_fin = Column(DateTime, nullable=False, index=True)
    asistentes = Column(Integer, nullable=False)
    estado = Column(String(50), default="activa") # activa, completada, cancelada

    espacio = relationship("Espacio", back_populates="reservas")
    recurso = relationship("Recurso", back_populates="reservas")

class Incidencia(Base):
    __tablename__ = "incidencias"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    descripcion = Column(Text, nullable=False)
    categoria = Column(String(100), nullable=False) # Hardware, Red, Infraestructura, Eléctrico, etc.
    severidad = Column(String(50), nullable=False) # BAJA, MEDIA, ALTA, CRITICA
    espacio_id = Column(String(50), ForeignKey("espacios.id"), nullable=True)
    recurso_id = Column(String(50), ForeignKey("recursos.id"), nullable=True)
    accion_sugerida = Column(Text, nullable=True)
    estado = Column(String(50), default="ABIERTA") # ABIERTA, EN_PROCESO, RESUELTA
    creada_en = Column(DateTime, default=datetime.utcnow)
    resuelta_en = Column(DateTime, nullable=True)

    espacio = relationship("Espacio", back_populates="incidencias")
    recurso = relationship("Recurso", back_populates="incidencias")
