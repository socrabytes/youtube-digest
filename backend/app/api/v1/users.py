from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

from app.db.database import get_db
from app.models.user import User as UserModel
from app.models.user_digest import UserDigest as UserDigestModel
from app.models.digest_interaction import DigestInteraction as DigestInteractionModel

router = APIRouter()

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserDigestBase(BaseModel):
    user_id: int
    digest_id: int

class UserDigestCreate(UserDigestBase):
    pass

class UserDigestResponse(UserDigestBase):
    id: int
    added_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DigestInteractionBase(BaseModel):
    user_id: int
    digest_id: int
    video_id: int
    action: str

class DigestInteractionCreate(DigestInteractionBase):
    pass

class DigestInteractionResponse(DigestInteractionBase):
    id: int
    action_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@router.get("/users/", response_model=List[UserResponse])
async def list_users(db: Session = Depends(get_db)):
    """Get all users"""
    try:
        return db.query(UserModel).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get a specific user"""
    try:
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    try:
        # Check if username or email already exists
        existing_user = db.query(UserModel).filter(
            (UserModel.username == user.username) | (UserModel.email == user.email)
        ).first()
        
        if existing_user:
            if existing_user.username == user.username:
                raise HTTPException(status_code=400, detail="Username already registered")
            else:
                raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user
        db_user = UserModel(
            username=user.username,
            email=user.email
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return db_user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{user_id}/saved-digests", response_model=List[UserDigestResponse])
async def get_user_saved_digests(user_id: int, db: Session = Depends(get_db)):
    """Get all digests saved by a specific user"""
    try:
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
            
        saved_digests = db.query(UserDigestModel).filter(
            UserDigestModel.user_id == user_id
        ).all()
        
        return saved_digests
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/{user_id}/saved-digests", response_model=UserDigestResponse)
async def save_digest(
    user_id: int,
    user_digest: UserDigestCreate,
    db: Session = Depends(get_db)
):
    """Save a digest for a user"""
    try:
        # Validate user exists
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Check if already saved
        existing_saved = db.query(UserDigestModel).filter(
            (UserDigestModel.user_id == user_id) & 
            (UserDigestModel.digest_id == user_digest.digest_id)
        ).first()
        
        if existing_saved:
            raise HTTPException(status_code=400, detail="Digest already saved by this user")
            
        # Create new saved digest
        saved_digest = UserDigestModel(
            user_id=user_id,
            digest_id=user_digest.digest_id,
            added_at=datetime.utcnow()
        )
        
        db.add(saved_digest)
        db.commit()
        db.refresh(saved_digest)
        
        return saved_digest
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/users/{user_id}/saved-digests/{digest_id}")
async def unsave_digest(user_id: int, digest_id: int, db: Session = Depends(get_db)):
    """Remove a saved digest for a user"""
    try:
        saved_digest = db.query(UserDigestModel).filter(
            (UserDigestModel.user_id == user_id) & 
            (UserDigestModel.digest_id == digest_id)
        ).first()
        
        if saved_digest is None:
            raise HTTPException(status_code=404, detail="Saved digest not found")
            
        db.delete(saved_digest)
        db.commit()
        
        return {"message": "Digest removed from saved items"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/digest-interactions", response_model=DigestInteractionResponse)
async def create_digest_interaction(
    interaction: DigestInteractionCreate,
    db: Session = Depends(get_db)
):
    """Record a user interaction with a digest"""
    try:
        # Create interaction record
        digest_interaction = DigestInteractionModel(
            user_id=interaction.user_id,
            digest_id=interaction.digest_id,
            video_id=interaction.video_id,
            action=interaction.action,
            action_at=datetime.utcnow()
        )
        
        db.add(digest_interaction)
        db.commit()
        db.refresh(digest_interaction)
        
        return digest_interaction
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
