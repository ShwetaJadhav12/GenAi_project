"""
Products routes — CRUD for products/inventory.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Business, Product, User
from schemas import ProductCreate, ProductOut, ProductUpdate
from routes.auth import get_current_user_dep

router = APIRouter(prefix="/businesses/{business_id}/products", tags=["products"])


def _check_biz(business_id: int, user: User, db: Session) -> Business:
    biz = db.query(Business).filter(Business.id == business_id, Business.user_id == user.id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    return biz


@router.get("", response_model=list[ProductOut])
def list_products(
    business_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)
    return db.query(Product).filter(Product.business_id == business_id).all()


@router.post("", response_model=ProductOut)
def create_product(
    business_id: int,
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)
    p = Product(business_id=business_id, **data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.get("/{product_id}", response_model=ProductOut)
def get_product(
    business_id: int,
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)
    p = db.query(Product).filter(Product.id == product_id, Product.business_id == business_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    business_id: int,
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)
    p = db.query(Product).filter(Product.id == product_id, Product.business_id == business_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/{product_id}")
def delete_product(
    business_id: int,
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep),
):
    _check_biz(business_id, current_user, db)
    p = db.query(Product).filter(Product.id == product_id, Product.business_id == business_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(p)
    db.commit()
    return {"message": "Product deleted"}
