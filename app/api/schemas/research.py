"""Research API request schemas."""

from typing import Literal

from pydantic import BaseModel, Field


class GenerateReportRequest(BaseModel):
    """Request body for generating a research report."""

    companyId: str = Field(min_length=1, description="Company ID to analyze")
    promptKey: str = Field(
        default="research.company_analysis",
        description="Prompt registry key to use for generation",
    )
    sourceType: Literal["manual", "auto", "scheduled"] | None = Field(
        None,
        description="How the report was triggered",
    )
