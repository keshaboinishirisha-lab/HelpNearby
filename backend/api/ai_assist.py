from fastapi import APIRouter
from backend.schemas import AICategorySuggestRequest, AICategorySuggestResponse
from backend.services.ai_service import suggest_category_and_condition

router = APIRouter(prefix="/ai", tags=["AI Assistance"])


@router.post("/suggest-category", response_model=AICategorySuggestResponse)
def get_category_suggestion(req: AICategorySuggestRequest):
    """
    Intelligent assistive suggestion for item category and condition
    based on the item title and description.
    """
    suggestion = suggest_category_and_condition(req.title, req.description or "")
    return AICategorySuggestResponse(**suggestion)
