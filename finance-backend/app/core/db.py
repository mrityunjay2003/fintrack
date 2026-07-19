from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings
from typing import AsyncGenerator

# Configure async SQLite engine
engine = create_async_engine(
    settings.DATABASE_URL, 
    echo=False,
    connect_args={"check_same_thread": False} # Needed for SQLite
)

AsyncSessionLocal = async_sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

class Base(DeclarativeBase):
    """Base class for all SQLAlchemy 2.0 models"""
    pass

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to inject DB sessions into routes."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
