from sqlalchemy import (
    Column, Integer, String, Float, ForeignKey, Text, Date, create_engine
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

DATABASE_URL = "sqlite:///./department_graph.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    name_en = Column(String(200), default="")
    parent_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    head_name = Column(String(200), default="")
    head_title = Column(String(200), default="")
    color = Column(String(7), default="#4A90D9")
    budget = Column(Float, default=0.0)
    headcount = Column(Integer, default=0)
    description = Column(Text, default="")
    level = Column(Integer, default=0)

    children = relationship("Department", backref="parent", remote_side=[id],
                            cascade="all, delete-orphan",
                            single_parent=True,
                            foreign_keys=[parent_id])
    goals = relationship("AnnualGoal", back_populates="department",
                         cascade="all, delete-orphan")
    milestones = relationship("Milestone", back_populates="department",
                              cascade="all, delete-orphan")


class AnnualGoal(Base):
    __tablename__ = "annual_goals"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text, default="")
    category = Column(String(100), default="general")
    priority = Column(String(20), default="medium")  # low, medium, high, critical
    status = Column(String(20), default="planned")    # planned, in_progress, completed, cancelled
    progress = Column(Float, default=0.0)             # 0-100
    quarter = Column(Integer, default=0)              # 0=all year, 1-4
    year = Column(Integer, nullable=False)
    kpi_target = Column(Float, default=0.0)
    kpi_current = Column(Float, default=0.0)
    kpi_unit = Column(String(50), default="")

    department = relationship("Department", back_populates="goals")


class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text, default="")
    due_date = Column(Date, nullable=True)
    status = Column(String(20), default="pending")  # pending, in_progress, completed, overdue
    year = Column(Integer, nullable=False)
    quarter = Column(Integer, default=1)

    department = relationship("Department", back_populates="milestones")


def init_db():
    Base.metadata.create_all(bind=engine)
