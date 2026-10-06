from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from backend.core.database import get_db
from backend.core.deps import get_current_user, require_role
from backend.models import VolunteerTask, Handover, User, Match, Notification
from backend.schemas import VolunteerTaskResponse

router = APIRouter(prefix="/volunteers", tags=["Volunteers"])


@router.get("/tasks", response_model=List[VolunteerTaskResponse])
def get_available_tasks(
    status_filter: Optional[str] = "available",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(VolunteerTask)
    if status_filter:
        query = query.filter(VolunteerTask.status == status_filter)
    return query.order_by(VolunteerTask.created_at.desc()).all()


@router.post("/tasks/{task_id}/accept", response_model=VolunteerTaskResponse)
def accept_task(
    task_id: int,
    current_user: User = Depends(require_role("volunteer")),
    db: Session = Depends(get_db)
):
    task = db.query(VolunteerTask).filter(VolunteerTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Volunteer task not found")
    if task.status != "available":
        raise HTTPException(status_code=400, detail="Task is already claimed or completed")

    task.volunteer_id = current_user.id
    task.status = "accepted"

    # Link volunteer to the handover
    handover = task.handover
    if handover:
        handover.volunteer_id = current_user.id
        # Notify donor and recipient
        n_donor = Notification(
            user_id=handover.donor_id,
            title="Volunteer Assigned for Delivery!",
            message=f"Community volunteer {current_user.name} has accepted to deliver your donation.",
            type="delivery_update",
            link=f"/handover/{handover.id}"
        )
        n_rec = Notification(
            user_id=handover.recipient_id,
            title="Volunteer Assigned for Delivery!",
            message=f"Volunteer {current_user.name} will transport your items.",
            type="delivery_update",
            link=f"/handover/{handover.id}"
        )
        db.add_all([n_donor, n_rec])

    db.commit()
    db.refresh(task)
    return task


@router.post("/tasks/{task_id}/status", response_model=VolunteerTaskResponse)
def update_task_status(
    task_id: int,
    status_update: str,  # picked_up, in_transit, delivered
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(VolunteerTask).filter(VolunteerTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Volunteer task not found")
    if task.volunteer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this task")

    if status_update not in ["picked_up", "in_transit", "delivered"]:
        raise HTTPException(status_code=400, detail="Invalid status update")

    task.status = status_update
    db.commit()
    db.refresh(task)
    return task
