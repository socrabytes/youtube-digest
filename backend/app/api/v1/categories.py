from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db.database import get_db
from app.models.category import Category as CategoryModel

router = APIRouter()

class CategoryBase(BaseModel):
    youtube_category_id: str
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@router.get("/categories/", response_model=List[CategoryResponse])
async def list_categories(db: Session = Depends(get_db)):
    """Get all categories"""
    try:
        return db.query(CategoryModel).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: int, db: Session = Depends(get_db)):
    """Get a specific category"""
    try:
        category = db.query(CategoryModel).filter(CategoryModel.id == category_id).first()
        if category is None:
            raise HTTPException(status_code=404, detail="Category not found")
        return category
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories/youtube/{youtube_category_id}", response_model=CategoryResponse)
async def get_category_by_youtube_id(youtube_category_id: str, db: Session = Depends(get_db)):
    """Get a specific category by YouTube category ID"""
    try:
        category = db.query(CategoryModel).filter(
            CategoryModel.youtube_category_id == youtube_category_id
        ).first()
        if category is None:
            raise HTTPException(status_code=404, detail="Category not found")
        return category
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/categories/", response_model=CategoryResponse)
async def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    """Create a new category"""
    try:
        # Check if category already exists
        existing_category = db.query(CategoryModel).filter(
            CategoryModel.youtube_category_id == category.youtube_category_id
        ).first()
        
        if existing_category:
            raise HTTPException(
                status_code=400, 
                detail=f"Category with YouTube ID {category.youtube_category_id} already exists"
            )
        
        # Create new category
        db_category = CategoryModel(
            youtube_category_id=category.youtube_category_id,
            name=category.name,
            description=category.description
        )
        
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        
        return db_category
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
