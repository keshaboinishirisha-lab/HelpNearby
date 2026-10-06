from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.core.database import get_db
from backend.core.deps import get_current_user, require_role
from backend.models import Report, User
from backend.schemas import ReportCreate, ReportResponse

router = APIRouter(prefix="/reports", tags=["Reports & Moderation"])


@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def submit_report(
    rep_in: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = Report(
        reporter_id=current_user.id,
        reported_user_id=rep_in.reported_user_id,
        entity_type=rep_in.entity_type,
        entity_id=rep_in.entity_id,
        reason=rep_in.reason,
        details=rep_in.details,
        status="pending"
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("", response_model=List[ReportResponse])
def get_reports(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    _admin = Depends(require_role("admin"))
):
    query = db.query(Report)
    if status_filter:
        query = query.filter(Report.status == status_filter)
    return query.order_by(Report.created_at.desc()).all()


@router.post("/{id}/resolve", response_model=ReportResponse)
def resolve_report(
    id: int,
    action: str,  # resolve, dismiss
    admin_notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    _admin = Depends(require_role("admin"))
):
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = "resolved" if action == "resolve" else "dismissed"
    report.admin_notes = admin_notes
    report.resolved_by = current_user.id
    db.commit()
    db.refresh(report)
    return report
