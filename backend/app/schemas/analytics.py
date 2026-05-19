from pydantic import BaseModel
from typing import Optional, Dict, List


class KPISummary(BaseModel):
    """KPI summary response"""
    total_orders: int
    calls_triggered: int
    calls_completed: int
    calls_pending: int
    calls_failed: int
    connection_rate: float
    pending_manual_reviews: int
    avg_nps_score: Optional[float] = None
    avg_call_duration_seconds: Optional[float] = None
    feedback_collected: int
    escalation_count: int


class NPSDistribution(BaseModel):
    """NPS distribution data"""
    promoters: int
    neutrals: int
    detractors: int


class SentimentDistribution(BaseModel):
    """Sentiment distribution data"""
    positive: int
    neutral: int
    negative: int


class AnalyticsSummary(KPISummary):
    """Complete analytics summary"""
    nps_distribution: NPSDistribution
    sentiment_distribution: SentimentDistribution


class NPSTrendItem(BaseModel):
    """NPS trend item"""
    date: str  # YYYY-MM-DD
    avg_nps: float
    count: int


class CallOutcomeItem(BaseModel):
    """Call outcome item"""
    status: str
    count: int
    percentage: float


class SentimentByProductItem(BaseModel):
    """Sentiment by product item"""
    product_name: str
    positive: int
    neutral: int
    negative: int


class TopIssueItem(BaseModel):
    """Top issue item"""
    keyword: str
    frequency: int
