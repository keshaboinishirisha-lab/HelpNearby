from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core.deps import get_current_user_optional
from backend.models import ImpactMetric, User, Handover, Donation
from backend.schemas import ImpactSummary

router = APIRouter(prefix="/impact", tags=["Impact Analytics"])


@router.get("/summary", response_model=ImpactSummary)
def get_global_impact(db: Session = Depends(get_db)):
    metric = db.query(ImpactMetric).filter(ImpactMetric.user_id == None).first()
    if not metric:
        # If no aggregated row, calculate directly from completed handovers
        completed_count = db.query(Handover).filter(Handover.status == "completed").count()
        return ImpactSummary(
            donations_completed=completed_count,
            requests_fulfilled=completed_count,
            people_helped=completed_count * 2,
            items_reused=completed_count,
            kg_food_rescued=0.0,
            kg_waste_diverted=completed_count * 2.5,
            volunteer_deliveries=0,
            volunteer_hours=0.0
        )
    return ImpactSummary(
        donations_completed=metric.donations_completed,
        requests_fulfilled=metric.requests_fulfilled,
        people_helped=metric.people_helped,
        items_reused=metric.items_reused,
        kg_food_rescued=round(metric.kg_food_rescued, 1),
        kg_waste_diverted=round(metric.kg_waste_diverted, 1),
        volunteer_deliveries=metric.volunteer_deliveries,
        volunteer_hours=round(metric.volunteer_hours, 1)
    )
