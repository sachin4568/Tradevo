"""Research events.

Lightweight dataclasses emitted after research operations.
"""

from dataclasses import dataclass, field
from datetime import UTC, datetime


@dataclass
class ResearchReportGenerated:
    """Emitted when a research report is generated."""

    event_type: str = "research.report.generated"
    report_id: str = ""
    user_id: str = ""
    company_id: str = ""
    prompt_key: str = ""
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))
