"""Portfolio module public API.

Exports only the service classes. External code imports:
    from app.modules.portfolio import PortfolioService, TradeExecutionService

Internal modules (repository, models, events, trade_service) are NOT
part of the public API per the modular architecture rules.
"""

from app.modules.portfolio.service import PortfolioService
from app.modules.portfolio.trade_service import TradeExecutionService

__all__ = ["PortfolioService", "TradeExecutionService"]
