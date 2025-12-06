"""
Pydantic models for scenario generation
"""
from typing import Optional, List
from pydantic import BaseModel, Field


class Segment(BaseModel):
    """Segment information"""
    demographics: str = Field(..., description="Demographics of the target segment")
    behavior: str = Field(..., description="Behavioral characteristics")
    jtbd: str = Field(..., description="Jobs To Be Done")


class Hypothesis(BaseModel):
    """Hypothesis about problem and solution"""
    problem: str = Field(..., description="Problem statement")
    solution: str = Field(..., description="Proposed solution")


class RequestMetadata(BaseModel):
    """Metadata for scenario generation request"""
    tone: Optional[str] = Field(default="professional", description="Tone of the interview (professional, friendly, formal)")
    length: Optional[int] = Field(default=8, ge=6, le=10, description="Number of questions (6-10)")


class GenerateScenarioRequest(BaseModel):
    """Request model for scenario generation"""
    projectId: str = Field(..., description="Project ID")
    segment: Segment = Field(..., description="Target segment information")
    hypothesis: Hypothesis = Field(..., description="Problem and solution hypothesis")
    metadata: Optional[RequestMetadata] = Field(default=None, description="Generation metadata")


class ScenarioBranch(BaseModel):
    """Branching logic for scenario"""
    questionId: str = Field(..., description="Source question ID")
    condition: str = Field(..., description="Condition for branching (e.g., 'answer.score >= 4')")
    nextQuestionId: str = Field(..., description="Next question ID if condition is met")


class ScenarioMetadata(BaseModel):
    """Metadata for generated scenario"""
    tone: str = Field(..., description="Tone used in the scenario")
    length: int = Field(..., ge=6, le=10, description="Number of questions")
    branches: List[ScenarioBranch] = Field(default_factory=list, description="Branching logic")


class GenerateScenarioResponse(BaseModel):
    """Response model for scenario generation"""
    content: str = Field(..., description="Generated scenario content (JSON or markdown)")
    metadata: ScenarioMetadata = Field(..., description="Scenario metadata")

