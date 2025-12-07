"""
Scenario generation API endpoints
"""
import uuid
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status
from app.models.scenario import GenerateScenarioRequest, GenerateScenarioResponse
from app.prompts.scenario_generation import build_scenario_prompt
from app.services.llm_providers import ClaudeProvider, OpenAIProvider
from app.services.scenario_validator import ScenarioValidator
from app.services.scenario_processor import ScenarioProcessor
from app.services.logger import llm_logger

router = APIRouter(prefix="/api/v1/scenarios", tags=["scenarios"])

# Initialize services
claude_provider = None
openai_provider = None
validator = ScenarioValidator()
processor = ScenarioProcessor()


def get_claude_provider() -> ClaudeProvider:
    """Get or create Claude provider instance"""
    global claude_provider
    if claude_provider is None:
        try:
            claude_provider = ClaudeProvider()
        except ValueError:
            # In mock mode, provider will still be created but won't make real API calls
            claude_provider = ClaudeProvider()
    return claude_provider


def get_openai_provider() -> OpenAIProvider:
    """Get or create OpenAI provider instance (fallback)"""
    global openai_provider
    if openai_provider is None:
        try:
            openai_provider = OpenAIProvider()
        except (ValueError, ImportError):
            # In mock mode, provider will still be created but won't make real API calls
            try:
                openai_provider = OpenAIProvider()
            except:
                return None
    return openai_provider


@router.post("/generate", response_model=GenerateScenarioResponse)
async def generate_scenario(request: GenerateScenarioRequest) -> GenerateScenarioResponse:
    """
    Generate interview scenario based on segment, JTBD, and hypothesis.
    
    Args:
        request: GenerateScenarioRequest with segment, hypothesis, and metadata
        
    Returns:
        GenerateScenarioResponse with content and metadata
        
    Raises:
        HTTPException: If generation fails or validation errors occur
    """
    correlation_id = str(uuid.uuid4())
    
    try:
        # Build prompt
        prompt = build_scenario_prompt(request)
        
        # Generate scenario using Claude (with fallback to OpenAI)
        generation_result = None
        provider_name = "claude"
        
        try:
            claude = get_claude_provider()
            generation_result = claude.generate_scenario_with_retry(
                prompt=prompt,
                correlation_id=correlation_id
            )
        except Exception as claude_error:
            llm_logger.log_error(
                operation="generate_scenario",
                error=claude_error,
                correlation_id=correlation_id,
                context={"provider": "claude", "fallback": True}
            )
            
            # Fallback to OpenAI
            openai = get_openai_provider()
            if openai:
                try:
                    provider_name = "openai"
                    generation_result = openai.generate_scenario(
                        prompt=prompt,
                        correlation_id=correlation_id
                    )
                except Exception as openai_error:
                    llm_logger.log_error(
                        operation="generate_scenario",
                        error=openai_error,
                        correlation_id=correlation_id,
                        context={"provider": "openai"}
                    )
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="LLM service unavailable. Both Claude and OpenAI failed."
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Claude API error: {str(claude_error)}. OpenAI fallback not configured."
                )
        
        if not generation_result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate scenario"
            )
        
        # Process scenario
        try:
            scenario_data = processor.process_scenario(generation_result["content"])
        except Exception as e:
            llm_logger.log_error(
                operation="process_scenario",
                error=e,
                correlation_id=correlation_id
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process scenario: {str(e)}"
            )
        
        # Extract metadata
        request_metadata = request.metadata.dict() if request.metadata else {}
        metadata = processor.extract_metadata(scenario_data, request_metadata)
        
        # Validate scenario
        content_for_storage = processor.format_content_for_storage(scenario_data)
        validation_result = validator.validate_scenario(content_for_storage, metadata.dict())
        
        # Log generation
        llm_logger.log_llm_call(
            operation="generate_scenario",
            prompt=prompt,
            response=generation_result["content"],
            usage=generation_result["usage"],
            latency=generation_result["latency"],
            model=generation_result["model"],
            correlation_id=correlation_id,
            metadata={
                "provider": provider_name,
                "project_id": request.projectId,
                "tone": metadata.tone,
                "length": metadata.length
            }
        )
        
        llm_logger.log_scenario_generation(
            request_data=request.dict(),
            response_data=generation_result,
            validation_result=validation_result,
            correlation_id=correlation_id
        )
        
        # Check validation errors
        if not validation_result.is_valid:
            error_details = "; ".join(validation_result.errors)
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Generated scenario validation failed: {error_details}"
            )
        
        # Return response
        return GenerateScenarioResponse(
            content=content_for_storage,
            metadata=metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        llm_logger.log_error(
            operation="generate_scenario",
            error=e,
            correlation_id=correlation_id
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/validate")
async def validate_scenario(content: str, metadata: Dict[str, Any] = None):
    """
    Validate a scenario without generating it.
    
    Args:
        content: Scenario content (JSON string)
        metadata: Optional metadata dictionary
        
    Returns:
        Validation result with errors and warnings
    """
    validation_result = validator.validate_scenario(content, metadata)
    
    return {
        "is_valid": validation_result.is_valid,
        "errors": validation_result.errors,
        "warnings": validation_result.warnings
    }


