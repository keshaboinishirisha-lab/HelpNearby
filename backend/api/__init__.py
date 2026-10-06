from fastapi import APIRouter
from backend.api.auth import router as auth_router
from backend.api.categories import router as categories_router
from backend.api.donations import router as donations_router
from backend.api.requests import router as requests_router
from backend.api.matches import router as matches_router
from backend.api.handovers import router as handovers_router
from backend.api.ratings import router as ratings_router
from backend.api.reports import router as reports_router
from backend.api.volunteers import router as volunteers_router
from backend.api.organizations import router as organizations_router
from backend.api.impact import router as impact_router
from backend.api.notifications import router as notifications_router
from backend.api.admin import router as admin_router
from backend.api.ai_assist import router as ai_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(categories_router)
api_router.include_router(donations_router)
api_router.include_router(requests_router)
api_router.include_router(matches_router)
api_router.include_router(handovers_router)
api_router.include_router(ratings_router)
api_router.include_router(reports_router)
api_router.include_router(volunteers_router)
api_router.include_router(organizations_router)
api_router.include_router(impact_router)
api_router.include_router(notifications_router)
api_router.include_router(admin_router)
api_router.include_router(ai_router)
