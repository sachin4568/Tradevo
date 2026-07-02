"""AI Engines package — service implementations, typed contracts, and streaming interfaces."""
from app.modules.ai.engines.contracts import (
    DNAEngineRequest,
    LearningGuidanceRequest,
    PortfolioObservationsRequest,
    PostLessonFeedbackRequest,
    PostTradeFeedbackRequest,
    ResearchEngineRequest,
    TradeReflectionRequest,
)
from app.modules.ai.engines.streaming import StreamingProvider, StreamingRequestManager

__all__ = [
    # Service contracts
    "DNAEngineRequest",
    "LearningGuidanceRequest",
    "PortfolioObservationsRequest",
    "PostLessonFeedbackRequest",
    "PostTradeFeedbackRequest",
    "ResearchEngineRequest",
    "TradeReflectionRequest",
    # Streaming interfaces
    "StreamingProvider",
    "StreamingRequestManager",
]