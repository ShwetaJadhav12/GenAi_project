"""
Demo Data Loader
Loads realistic sample data for grocery and clothing businesses.
"""
import os
import csv
from datetime import date, timedelta
import random
from sqlalchemy.orm import Session
from models import Business, Product, Transaction, Expense

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "..", "data")


def _rand_date(days_back_max: int = 90) -> date:
    return date.today() - timedelta(days=random.randint(0, days_back_max))


def load_grocery_demo(db: Session, business_id: int) -> dict:
    """Insert realistic grocery demo data."""
    random.seed(42)

    products_data = [
        {"name": "Basmati Rice", "category": "Grains", "unit": "kg", "selling_price": 60, "cost_price": 42, "current_stock": 200, "reorder_level": 50},
        {"name": "Whole Wheat Flour", "category": "Grains", "unit": "kg", "selling_price": 45, "cost_price": 30, "current_stock": 150, "reorder_level": 40},
        {"name": "Toor Dal", "category": "Pulses", "unit": "kg", "selling_price": 120, "cost_price": 90, "current_stock": 80, "reorder_level": 30},
        {"name": "Sunflower Oil", "category": "Oils", "unit": "litre", "selling_price": 140, "cost_price": 110, "current_stock": 60, "reorder_level": 20},
        {"name": "Milk", "category": "Dairy", "unit": "litre", "selling_price": 55, "cost_price": 42, "current_stock": 8, "reorder_level": 20},
        {"name": "Maggi Noodles", "category": "Packaged Food", "unit": "packet", "selling_price": 15, "cost_price": 11, "current_stock": 300, "reorder_level": 100},
        {"name": "Amul Butter", "category": "Dairy", "unit": "pack", "selling_price": 55, "cost_price": 44, "current_stock": 25, "reorder_level": 30},
        {"name": "Sugar", "category": "Staples", "unit": "kg", "selling_price": 42, "cost_price": 35, "current_stock": 120, "reorder_level": 30},
        {"name": "Salt", "category": "Staples", "unit": "kg", "selling_price": 20, "cost_price": 14, "current_stock": 90, "reorder_level": 20},
        {"name": "Tea Leaves", "category": "Beverages", "unit": "packet", "selling_price": 180, "cost_price": 130, "current_stock": 50, "reorder_level": 15},
    ]

    product_map = {}
    for pd_data in products_data:
        p = Product(business_id=business_id, **pd_data)
        db.add(p)
        db.flush()
        product_map[pd_data["name"]] = p

    # Generate 90 days of transactions
    transactions = []
    for day_offset in range(90):
        t_date = date.today() - timedelta(days=90 - day_offset)
        daily_sales = random.randint(5, 20)
        for _ in range(daily_sales):
            prod = random.choice(list(product_map.values()))
            qty = round(random.uniform(0.5, 5.0), 1)
            total = round(qty * prod.selling_price, 2)
            transactions.append(Transaction(
                business_id=business_id,
                product_id=prod.id,
                product_name=prod.name,
                category=prod.category,
                date=t_date,
                type="sale",
                quantity=qty,
                unit_price=prod.selling_price,
                total_amount=total,
                source="demo",
            ))

        # Purchase restocking twice a week
        if day_offset % 3 == 0:
            prod = random.choice(list(product_map.values()))
            qty = random.randint(20, 80)
            total = round(qty * prod.cost_price, 2)
            transactions.append(Transaction(
                business_id=business_id,
                product_id=prod.id,
                product_name=prod.name,
                category=prod.category,
                date=t_date,
                type="purchase",
                quantity=qty,
                unit_price=prod.cost_price,
                total_amount=total,
                source="demo",
            ))

    for t in transactions:
        db.add(t)

    # Expenses
    expense_data = [
        ("Rent", "Rent", 15000),
        ("Electricity", "Utilities", 3500),
        ("Staff Salary", "Salaries", 18000),
        ("Packaging", "Supplies", 2000),
        ("Marketing Pamphlets", "Marketing", 1500),
    ]
    for month_offset in range(3):
        exp_date = date.today().replace(day=1) - timedelta(days=30 * month_offset)
        for desc, cat, amt in expense_data:
            db.add(Expense(
                business_id=business_id,
                date=exp_date,
                category=cat,
                description=desc,
                amount=amt + random.randint(-200, 200),
            ))

    db.commit()
    return {"message": "Grocery demo data loaded successfully.", "products": len(products_data)}


def load_clothing_demo(db: Session, business_id: int) -> dict:
    """Insert realistic clothing store demo data."""
    random.seed(99)

    products_data = [
        {"name": "Men's Cotton T-Shirt", "category": "Men", "unit": "piece", "selling_price": 350, "cost_price": 180, "current_stock": 80, "reorder_level": 20, "size": "M", "color": "Blue"},
        {"name": "Women's Kurti", "category": "Women", "unit": "piece", "selling_price": 650, "cost_price": 350, "current_stock": 45, "reorder_level": 10, "size": "S", "color": "Red"},
        {"name": "Denim Jeans", "category": "Men", "unit": "piece", "selling_price": 1200, "cost_price": 700, "current_stock": 30, "reorder_level": 10, "size": "32", "color": "Dark Blue"},
        {"name": "Kids Frock", "category": "Kids", "unit": "piece", "selling_price": 400, "cost_price": 210, "current_stock": 5, "reorder_level": 15, "size": "4Y", "color": "Pink"},
        {"name": "Saree", "category": "Women", "unit": "piece", "selling_price": 1800, "cost_price": 1000, "current_stock": 20, "reorder_level": 5, "color": "Various"},
        {"name": "Men's Formal Shirt", "category": "Men", "unit": "piece", "selling_price": 800, "cost_price": 450, "current_stock": 40, "reorder_level": 10, "size": "L", "color": "White"},
        {"name": "Sports Shorts", "category": "Sports", "unit": "piece", "selling_price": 299, "cost_price": 150, "current_stock": 60, "reorder_level": 20, "color": "Black"},
        {"name": "Winter Jacket", "category": "Seasonal", "unit": "piece", "selling_price": 2500, "cost_price": 1400, "current_stock": 3, "reorder_level": 8, "size": "XL", "color": "Navy"},
    ]

    product_map = {}
    for pd_data in products_data:
        p = Product(business_id=business_id, **pd_data)
        db.add(p)
        db.flush()
        product_map[pd_data["name"]] = p

    for day_offset in range(90):
        t_date = date.today() - timedelta(days=90 - day_offset)
        daily_sales = random.randint(2, 10)
        for _ in range(daily_sales):
            prod = random.choice(list(product_map.values()))
            qty = random.randint(1, 3)
            total = round(qty * prod.selling_price, 2)
            db.add(Transaction(
                business_id=business_id,
                product_id=prod.id,
                product_name=prod.name,
                category=prod.category,
                date=t_date,
                type="sale",
                quantity=qty,
                unit_price=prod.selling_price,
                total_amount=total,
                source="demo",
            ))

        if day_offset % 7 == 0:
            prod = random.choice(list(product_map.values()))
            qty = random.randint(10, 30)
            total = round(qty * prod.cost_price, 2)
            db.add(Transaction(
                business_id=business_id,
                product_id=prod.id,
                product_name=prod.name,
                category=prod.category,
                date=t_date,
                type="purchase",
                quantity=qty,
                unit_price=prod.cost_price,
                total_amount=total,
                source="demo",
            ))

    expense_data = [
        ("Shop Rent", "Rent", 25000),
        ("Electricity & AC", "Utilities", 5000),
        ("Staff Salary", "Salaries", 30000),
        ("Display & Fixtures", "Supplies", 3000),
        ("Instagram Ads", "Marketing", 5000),
    ]
    for month_offset in range(3):
        exp_date = date.today().replace(day=1) - timedelta(days=30 * month_offset)
        for desc, cat, amt in expense_data:
            db.add(Expense(
                business_id=business_id,
                date=exp_date,
                category=cat,
                description=desc,
                amount=amt + random.randint(-500, 500),
            ))

    db.commit()
    return {"message": "Clothing demo data loaded successfully.", "products": len(products_data)}
