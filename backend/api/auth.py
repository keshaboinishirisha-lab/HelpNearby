from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core.security import verify_password, get_password_hash, create_access_token
from backend.core.deps import get_current_user
from backend.models import User
from backend.schemas import UserRegister, UserLogin, Token, UserResponse, UserProfileUpdate
from backend.services.geospatial import fuzz_coordinates

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )
    
    # Compute safe privacy coordinates for user's general neighborhood
    approx_lat = user_in.approx_lat or 37.7749
    approx_lng = user_in.approx_lng or -122.4194
    f_lat, f_lng, f_desc = fuzz_coordinates(approx_lat, approx_lng)

    user = User(
        name=user_in.name,
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        phone=user_in.phone,
        role=user_in.role or "donor_recipient",
        organization_name=user_in.organization_name,
        verification_status="verified" if user_in.role == "donor_recipient" else "pending",
        trust_score=75.0,
        approx_lat=f_lat,
        approx_lng=f_lng,
        approx_address=user_in.approx_address or f_desc,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email.lower()).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended or deactivated"
        )

    token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_profile(
    profile_in: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if profile_in.name is not None:
        current_user.name = profile_in.name
    if profile_in.phone is not None:
        current_user.phone = profile_in.phone
    if profile_in.bio is not None:
        current_user.bio = profile_in.bio
    if profile_in.organization_name is not None:
        current_user.organization_name = profile_in.organization_name
    
    if profile_in.approx_lat is not None and profile_in.approx_lng is not None:
        f_lat, f_lng, f_desc = fuzz_coordinates(profile_in.approx_lat, profile_in.approx_lng)
        current_user.approx_lat = f_lat
        current_user.approx_lng = f_lng
        current_user.approx_address = profile_in.approx_address or f_desc
    
    db.commit()
    db.refresh(current_user)
    return current_user
