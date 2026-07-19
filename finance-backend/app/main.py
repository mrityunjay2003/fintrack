from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

# Import the new routers
from app.api.routers import accounts, budgets, categories, imports, overview, rules, subscriptions, transactions

def create_app() -> FastAPI:
    app = FastAPI(title=settings.PROJECT_NAME)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["Ops"])
    async def health_check():
        return {"status": "ok", "project": settings.PROJECT_NAME}

    # Mount the routers
    app.include_router(accounts.router, prefix="/api/accounts", tags=["Accounts"])
    app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
    app.include_router(rules.router, prefix="/api/rules", tags=["Rules"])
    app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
    app.include_router(imports.router, prefix="/api/import", tags=["Import"])
    app.include_router(overview.router, prefix="/api/overview", tags=["Overview"])
    app.include_router(budgets.router, prefix="/api/budgets", tags=["Budgets"])
    app.include_router(subscriptions.router, prefix="/api/subscriptions", tags=["Subscriptions"])
    return app

app = create_app()