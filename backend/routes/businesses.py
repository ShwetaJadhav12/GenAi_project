"""
Business routes — CRUD for businesses.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Business, User
from schemas import BusinessCreate, BusinessOut
from routes.auth import get_current_user_dep
from services.demo_loader import load_grocery_demo, load_clothing_demo

router = APIRouter(prefix="/businesses", tags=["businesses"])


def _owned_business(business_id: int, user: User, db: Session) -> Business:
    biz = db.query(Business).filter(Business.id == business_id, Business.user_id == user.id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    return biz


@router.post("", response_model=BusinessOut)
def create_business(
    data: BusinessCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    biz = Business(user_id=current_user.id, **data.model_dump())
    db.add(biz)
    db.commit()
    db.refresh(biz)
    return biz


@router.get("", response_model=list[BusinessOut])
def list_businesses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    return db.query(Business).filter(Business.user_id == current_user.id).all()


@router.get("/{business_id}", response_model=BusinessOut)
def get_business(
    business_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    return _owned_business(business_id, current_user, db)


@router.put("/{business_id}", response_model=BusinessOut)
def update_business(
    business_id: int,
    data: BusinessCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    biz = _owned_business(business_id, current_user, db)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(biz, k, v)
    db.commit()
    db.refresh(biz)
    return biz


@router.delete("/{business_id}")
def delete_business(
    business_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    biz = _owned_business(business_id, current_user, db)
    db.delete(biz)
    db.commit()
    return {"message": "Business deleted"}


@router.post("/{business_id}/load-demo")
def load_demo_data(
    business_id: int,
    demo_type: str,   # grocery | clothing  — passed as query param
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    biz = _owned_business(business_id, current_user, db)
    demo_type = demo_type.lower()
    if demo_type == "grocery":
        result = load_grocery_demo(db, business_id)
    elif demo_type == "clothing":
        result = load_clothing_demo(db, business_id)
    else:
        raise HTTPException(status_code=400, detail="demo_type must be 'grocery' or 'clothing'")
    return result
