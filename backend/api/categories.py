from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.core.database import get_db
from backend.core.deps import require_role
from backend.models import Category
from backend.schemas import CategoryResponse, CategoryCreate

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.name.asc()).all()


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    cat_in: CategoryCreate,
    db: Session = Depends(get_db),
    _admin = Depends(require_role("admin"))
):
    existing = db.query(Category).filter(Category.slug == cat_in.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category slug already exists")
    
    cat = Category(**cat_in.dict())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat
