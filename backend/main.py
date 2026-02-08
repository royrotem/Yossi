from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date

from models import SessionLocal, init_db, Department, AnnualGoal, Milestone

app = FastAPI(title="Department Graph System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- Schemas ---

class DepartmentCreate(BaseModel):
    name: str
    name_en: str = ""
    parent_id: Optional[int] = None
    head_name: str = ""
    head_title: str = ""
    color: str = "#4A90D9"
    budget: float = 0.0
    headcount: int = 0
    description: str = ""

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    name_en: Optional[str] = None
    parent_id: Optional[int] = None
    head_name: Optional[str] = None
    head_title: Optional[str] = None
    color: Optional[str] = None
    budget: Optional[float] = None
    headcount: Optional[int] = None
    description: Optional[str] = None

class GoalCreate(BaseModel):
    department_id: int
    title: str
    description: str = ""
    category: str = "general"
    priority: str = "medium"
    status: str = "planned"
    progress: float = 0.0
    quarter: int = 0
    year: int
    kpi_target: float = 0.0
    kpi_current: float = 0.0
    kpi_unit: str = ""

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[float] = None
    quarter: Optional[int] = None
    kpi_target: Optional[float] = None
    kpi_current: Optional[float] = None
    kpi_unit: Optional[str] = None

class MilestoneCreate(BaseModel):
    department_id: int
    title: str
    description: str = ""
    due_date: Optional[date] = None
    status: str = "pending"
    year: int
    quarter: int = 1

class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    quarter: Optional[int] = None


# --- Helper ---

def dept_to_dict(d: Department):
    return {
        "id": d.id, "name": d.name, "name_en": d.name_en,
        "parent_id": d.parent_id, "head_name": d.head_name,
        "head_title": d.head_title, "color": d.color,
        "budget": d.budget, "headcount": d.headcount,
        "description": d.description, "level": d.level,
    }

def goal_to_dict(g: AnnualGoal):
    return {
        "id": g.id, "department_id": g.department_id,
        "title": g.title, "description": g.description,
        "category": g.category, "priority": g.priority,
        "status": g.status, "progress": g.progress,
        "quarter": g.quarter, "year": g.year,
        "kpi_target": g.kpi_target, "kpi_current": g.kpi_current,
        "kpi_unit": g.kpi_unit,
    }

def milestone_to_dict(m: Milestone):
    return {
        "id": m.id, "department_id": m.department_id,
        "title": m.title, "description": m.description,
        "due_date": str(m.due_date) if m.due_date else None,
        "status": m.status, "year": m.year, "quarter": m.quarter,
    }


# --- Department Endpoints ---

@app.get("/api/departments")
def list_departments(db: Session = Depends(get_db)):
    depts = db.query(Department).all()
    return [dept_to_dict(d) for d in depts]

@app.get("/api/departments/{dept_id}")
def get_department(dept_id: int, db: Session = Depends(get_db)):
    d = db.query(Department).filter(Department.id == dept_id).first()
    if not d:
        raise HTTPException(404, "Department not found")
    return dept_to_dict(d)

@app.post("/api/departments")
def create_department(data: DepartmentCreate, db: Session = Depends(get_db)):
    level = 0
    if data.parent_id:
        parent = db.query(Department).filter(Department.id == data.parent_id).first()
        if not parent:
            raise HTTPException(400, "Parent department not found")
        level = parent.level + 1
    d = Department(**data.model_dump(), level=level)
    db.add(d)
    db.commit()
    db.refresh(d)
    return dept_to_dict(d)

@app.put("/api/departments/{dept_id}")
def update_department(dept_id: int, data: DepartmentUpdate, db: Session = Depends(get_db)):
    d = db.query(Department).filter(Department.id == dept_id).first()
    if not d:
        raise HTTPException(404, "Department not found")
    updates = data.model_dump(exclude_unset=True)
    for k, v in updates.items():
        setattr(d, k, v)
    db.commit()
    db.refresh(d)
    return dept_to_dict(d)

@app.delete("/api/departments/{dept_id}")
def delete_department(dept_id: int, db: Session = Depends(get_db)):
    d = db.query(Department).filter(Department.id == dept_id).first()
    if not d:
        raise HTTPException(404, "Department not found")
    db.delete(d)
    db.commit()
    return {"ok": True}

@app.get("/api/departments/tree/full")
def get_tree(db: Session = Depends(get_db)):
    depts = db.query(Department).all()
    dept_map = {d.id: {**dept_to_dict(d), "children": []} for d in depts}
    roots = []
    for d in depts:
        node = dept_map[d.id]
        if d.parent_id and d.parent_id in dept_map:
            dept_map[d.parent_id]["children"].append(node)
        else:
            roots.append(node)
    return roots


# --- Goals Endpoints ---

@app.get("/api/goals")
def list_goals(year: Optional[int] = None, department_id: Optional[int] = None,
               db: Session = Depends(get_db)):
    q = db.query(AnnualGoal)
    if year:
        q = q.filter(AnnualGoal.year == year)
    if department_id:
        q = q.filter(AnnualGoal.department_id == department_id)
    return [goal_to_dict(g) for g in q.all()]

@app.post("/api/goals")
def create_goal(data: GoalCreate, db: Session = Depends(get_db)):
    g = AnnualGoal(**data.model_dump())
    db.add(g)
    db.commit()
    db.refresh(g)
    return goal_to_dict(g)

@app.put("/api/goals/{goal_id}")
def update_goal(goal_id: int, data: GoalUpdate, db: Session = Depends(get_db)):
    g = db.query(AnnualGoal).filter(AnnualGoal.id == goal_id).first()
    if not g:
        raise HTTPException(404, "Goal not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(g, k, v)
    db.commit()
    db.refresh(g)
    return goal_to_dict(g)

@app.delete("/api/goals/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    g = db.query(AnnualGoal).filter(AnnualGoal.id == goal_id).first()
    if not g:
        raise HTTPException(404, "Goal not found")
    db.delete(g)
    db.commit()
    return {"ok": True}


# --- Milestones Endpoints ---

@app.get("/api/milestones")
def list_milestones(year: Optional[int] = None, department_id: Optional[int] = None,
                    db: Session = Depends(get_db)):
    q = db.query(Milestone)
    if year:
        q = q.filter(Milestone.year == year)
    if department_id:
        q = q.filter(Milestone.department_id == department_id)
    return [milestone_to_dict(m) for m in q.all()]

@app.post("/api/milestones")
def create_milestone(data: MilestoneCreate, db: Session = Depends(get_db)):
    m = Milestone(**data.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return milestone_to_dict(m)

@app.put("/api/milestones/{ms_id}")
def update_milestone(ms_id: int, data: MilestoneUpdate, db: Session = Depends(get_db)):
    m = db.query(Milestone).filter(Milestone.id == ms_id).first()
    if not m:
        raise HTTPException(404, "Milestone not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(m, k, v)
    db.commit()
    db.refresh(m)
    return milestone_to_dict(m)

@app.delete("/api/milestones/{ms_id}")
def delete_milestone(ms_id: int, db: Session = Depends(get_db)):
    m = db.query(Milestone).filter(Milestone.id == ms_id).first()
    if not m:
        raise HTTPException(404, "Milestone not found")
    db.delete(m)
    db.commit()
    return {"ok": True}


# --- Dashboard Stats ---

@app.get("/api/stats/{year}")
def get_stats(year: int, db: Session = Depends(get_db)):
    goals = db.query(AnnualGoal).filter(AnnualGoal.year == year).all()
    milestones = db.query(Milestone).filter(Milestone.year == year).all()
    depts = db.query(Department).count()

    total_goals = len(goals)
    completed_goals = sum(1 for g in goals if g.status == "completed")
    avg_progress = sum(g.progress for g in goals) / total_goals if total_goals else 0
    total_budget = db.query(Department).with_entities(
        Department.budget
    ).all()
    budget_sum = sum(b[0] for b in total_budget)
    total_headcount = db.query(Department).with_entities(
        Department.headcount
    ).all()
    headcount_sum = sum(h[0] for h in total_headcount)

    by_quarter = {}
    for q in range(1, 5):
        qgoals = [g for g in goals if g.quarter == q or g.quarter == 0]
        qms = [m for m in milestones if m.quarter == q]
        by_quarter[q] = {
            "goals": len(qgoals),
            "milestones": len(qms),
            "completed_milestones": sum(1 for m in qms if m.status == "completed"),
        }

    by_priority = {}
    for p in ["low", "medium", "high", "critical"]:
        by_priority[p] = sum(1 for g in goals if g.priority == p)

    by_status = {}
    for s in ["planned", "in_progress", "completed", "cancelled"]:
        by_status[s] = sum(1 for g in goals if g.status == s)

    return {
        "total_departments": depts,
        "total_goals": total_goals,
        "completed_goals": completed_goals,
        "avg_progress": round(avg_progress, 1),
        "total_budget": budget_sum,
        "total_headcount": headcount_sum,
        "by_quarter": by_quarter,
        "by_priority": by_priority,
        "by_status": by_status,
    }


# --- Seed Data ---

@app.post("/api/seed")
def seed_data(db: Session = Depends(get_db)):
    if db.query(Department).count() > 0:
        return {"message": "Data already exists"}

    ceo = Department(name="משרד המנכ\"ל", name_en="CEO Office",
                     head_name="דוד כהן", head_title="מנכ\"ל",
                     color="#1a1a2e", budget=500000, headcount=5)
    db.add(ceo)
    db.flush()

    divisions = [
        ("אגף טכנולוגיה", "Technology", "יוסי לוי", "סמנכ\"ל טכנולוגיה", "#0f3460", 8000000, 120),
        ("אגף כספים", "Finance", "מיכל אברהם", "סמנכ\"ל כספים", "#533483", 3000000, 45),
        ("אגף משאבי אנוש", "Human Resources", "רונית שמעון", "סמנכ\"ל מש\"א", "#e94560", 2000000, 30),
        ("אגף שיווק", "Marketing", "אורי בן-דוד", "סמנכ\"ל שיווק", "#16213e", 5000000, 60),
        ("אגף תפעול", "Operations", "שירה גולן", "סמנכ\"ל תפעול", "#0a1931", 6000000, 200),
    ]

    div_objs = []
    for name, name_en, head, title, color, budget, hc in divisions:
        d = Department(name=name, name_en=name_en, parent_id=ceo.id,
                       head_name=head, head_title=title, color=color,
                       budget=budget, headcount=hc, level=1)
        db.add(d)
        db.flush()
        div_objs.append(d)

    # Sub-departments for Technology
    tech = div_objs[0]
    tech_subs = [
        ("פיתוח תוכנה", "Software Dev", "#1687a7", 3000000, 50),
        ("תשתיות", "Infrastructure", "#276678", 2500000, 30),
        ("אבטחת מידע", "Security", "#d3e0ea", 1500000, 20),
        ("מחקר ופיתוח", "R&D", "#f6f5f5", 1000000, 20),
    ]
    for name, name_en, color, budget, hc in tech_subs:
        d = Department(name=name, name_en=name_en, parent_id=tech.id,
                       head_name="", head_title="מנהל מחלקה", color=color,
                       budget=budget, headcount=hc, level=2)
        db.add(d)

    # Sub-departments for Operations
    ops = div_objs[4]
    ops_subs = [
        ("לוגיסטיקה", "Logistics", "#1e5f74", 2000000, 80),
        ("שירות לקוחות", "Customer Service", "#289672", 1500000, 60),
        ("בקרת איכות", "Quality", "#fce38a", 500000, 15),
    ]
    for name, name_en, color, budget, hc in ops_subs:
        d = Department(name=name, name_en=name_en, parent_id=ops.id,
                       head_name="", head_title="מנהל מחלקה", color=color,
                       budget=budget, headcount=hc, level=2)
        db.add(d)

    db.flush()

    # Goals
    year = 2026
    goals_data = [
        (tech.id, "השקת פלטפורמה חדשה", "technology", "critical", 35, 1, 100, 35, "%"),
        (tech.id, "מעבר לענן", "technology", "high", 20, 2, 100, 20, "%"),
        (div_objs[1].id, "צמצום עלויות תפעול ב-15%", "finance", "high", 10, 0, 15, 2.3, "%"),
        (div_objs[2].id, "גיוס 50 עובדים חדשים", "hr", "medium", 40, 0, 50, 20, "עובדים"),
        (div_objs[3].id, "הגדלת מודעות מותג ב-30%", "marketing", "high", 25, 0, 30, 7.5, "%"),
        (div_objs[4].id, "שיפור SLA ל-99.9%", "operations", "critical", 60, 0, 99.9, 99.2, "%"),
        (div_objs[3].id, "השקת קמפיין דיגיטלי", "marketing", "medium", 80, 1, 1000000, 800000, "חשיפות"),
        (div_objs[1].id, "הטמעת מערכת ERP חדשה", "finance", "critical", 15, 2, 100, 15, "%"),
    ]
    for dept_id, title, cat, prio, prog, q, kpi_t, kpi_c, kpi_u in goals_data:
        status = "completed" if prog >= 80 else ("in_progress" if prog > 0 else "planned")
        g = AnnualGoal(department_id=dept_id, title=title, category=cat,
                       priority=prio, status=status, progress=prog,
                       quarter=q, year=year, kpi_target=kpi_t,
                       kpi_current=kpi_c, kpi_unit=kpi_u)
        db.add(g)

    # Milestones
    ms_data = [
        (tech.id, "POC פלטפורמה חדשה", "2026-03-31", "completed", 1),
        (tech.id, "השלמת מיגרציה לענן - שלב א", "2026-06-30", "in_progress", 2),
        (tech.id, "השקה לייצור", "2026-09-30", "pending", 3),
        (div_objs[1].id, "בחירת ספק ERP", "2026-02-28", "completed", 1),
        (div_objs[1].id, "סיום הטמעה ERP", "2026-12-31", "pending", 4),
        (div_objs[2].id, "השלמת גיוס Q1", "2026-03-31", "completed", 1),
        (div_objs[2].id, "השלמת גיוס Q2", "2026-06-30", "in_progress", 2),
        (div_objs[4].id, "שדרוג תשתיות שירות", "2026-04-30", "in_progress", 2),
    ]
    for dept_id, title, due, status, q in ms_data:
        m = Milestone(department_id=dept_id, title=title,
                      due_date=date.fromisoformat(due), status=status,
                      year=year, quarter=q)
        db.add(m)

    db.commit()
    return {"message": "Seed data created successfully"}


@app.on_event("startup")
def on_startup():
    init_db()
