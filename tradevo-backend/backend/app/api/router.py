"""Root API router aggregating all domain routers.

This is the single entry point for all API routes, mounted at /api/v1
in main.py. Each domain router is imported and included here.
"""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.auth import users_router
from app.api.v1.companies import router as companies_router
from app.api.v1.infra import router as infra_router
from app.api.v1.intelligence import router as intelligence_router
from app.api.v1.learning import router as learning_router
from app.api.v1.market import router as market_router
from app.api.v1.portfolio import router as portfolio_router
from app.api.v1.research import router as research_router
from app.api.v1.transactions import router as transactions_router
from app.api.v1.watchlist import router as watchlist_router

api_router = APIRouter()

# ─── Authentication (Milestone 1) ───
api_router.include_router(auth_router, prefix="/auth")
api_router.include_router(users_router, prefix="/users")

# ─── Market & Company (Milestone 2) ───
api_router.include_router(companies_router, prefix="/companies")
api_router.include_router(market_router, prefix="/market")

# ─── Infrastructure ───
api_router.include_router(infra_router, prefix="/infra")

# ─── Portfolio & Transactions (Milestone 3) ───
api_router.include_router(portfolio_router, prefix="/portfolio")
api_router.include_router(transactions_router, prefix="/transactions")

# ─── Watchlist (Milestone 5) ───
api_router.include_router(watchlist_router, prefix="/watchlist")

# ─── Learning (Milestone 4) ───
api_router.include_router(learning_router, prefix="/learning")

# ─── Research (Milestone 5) ───
api_router.include_router(research_router, prefix="/research")

# ─── AI Intelligence (Milestone 7) ───
api_router.include_router(intelligence_router, prefix="/intelligence")
