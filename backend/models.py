from sqlalchemy import (
    Column, Integer, String, Float, Date, DateTime,
    ForeignKey, Text, Boolean
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    businesses = relationship("Business", back_populates="owner")


class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    business_name = Column(String(200), nullable=False)
    business_type = Column(String(50), nullable=False)  # grocery, clothing, restaurant, retail, other
    currency = Column(String(10), default="INR")
    location = Column(String(200), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    owner = relationship("User", back_populates="businesses")
    products = relationship("Product", back_populates="business", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="business", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="business", cascade="all, delete-orphan")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    name = Column(String(200), nullable=False)
    category = Column(String(100), nullable=True)
    unit = Column(String(50), nullable=True)          # kg, piece, litre, etc.
    selling_price = Column(Float, nullable=True)
    cost_price = Column(Float, nullable=True)
    current_stock = Column(Float, default=0.0)
    reorder_level = Column(Float, default=0.0)
    # Optional extended fields
    size = Column(String(50), nullable=True)           # clothing
    color = Column(String(50), nullable=True)          # clothing
    created_at = Column(DateTime, server_default=func.now())

    business = relationship("Business", back_populates="products")
    transactions = relationship("Transaction", back_populates="product")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    date = Column(Date, nullable=False)
    type = Column(String(20), nullable=False)          # sale | purchase
    quantity = Column(Float, nullable=True)
    unit_price = Column(Float, nullable=True)
    total_amount = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    product_name = Column(String(200), nullable=True)  # denormalised for imports
    category = Column(String(100), nullable=True)
    source = Column(String(50), default="manual")      # manual | csv | ocr | nlp
    created_at = Column(DateTime, server_default=func.now())

    business = relationship("Business", back_populates="transactions")
    product = relationship("Product", back_populates="transactions")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    date = Column(Date, nullable=False)
    category = Column(String(100), nullable=False)     # rent, utilities, salaries, marketing, etc.
    description = Column(Text, nullable=True)
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    business = relationship("Business", back_populates="expenses")
