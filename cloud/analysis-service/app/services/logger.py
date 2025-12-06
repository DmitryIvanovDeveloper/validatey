"""
Structured logging service for LLM calls
"""
import time
import uuid
from typing import Optional, Dict, Any
import structlog


class LLMLogger:
    """Structured logger for LLM operations"""
    
    def __init__(self):
        # Configure structlog
        structlog.configure(
            processors=[
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.processors.add_log_level,
                structlog.processors.JSONRenderer()
            ],
            wrapper_class=structlog.make_filtering_bound_logger(20),  # INFO level
            context_class=dict,
            logger_factory=structlog.PrintLoggerFactory(),
            cache_logger_on_first_use=True,
        )
        self.logger = structlog.get_logger()
    
    def log_llm_call(
        self,
        operation: str,
        prompt: str,
        response: str,
        usage: Dict[str, int],
        latency: float,
        model: str,
        correlation_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Log LLM API call with full context.
        
        Args:
            operation: Operation name (e.g., "generate_scenario")
            prompt: Full prompt sent to LLM (sanitized for PII)
            response: Response from LLM
            usage: Token usage dict with 'input_tokens' and 'output_tokens'
            latency: Request latency in seconds
            model: Model name used
            correlation_id: Optional correlation ID for tracing
            metadata: Optional additional metadata
        """
        # Sanitize prompt (remove potential PII)
        sanitized_prompt = self._sanitize_prompt(prompt)
        
        log_data = {
            "operation": operation,
            "model": model,
            "latency_seconds": round(latency, 3),
            "input_tokens": usage.get("input_tokens", 0),
            "output_tokens": usage.get("output_tokens", 0),
            "total_tokens": usage.get("input_tokens", 0) + usage.get("output_tokens", 0),
            "correlation_id": correlation_id or self._generate_correlation_id(),
        }
        
        # Add prompt and response (truncated if too long)
        if len(sanitized_prompt) > 1000:
            log_data["prompt_preview"] = sanitized_prompt[:1000] + "..."
            log_data["prompt_length"] = len(sanitized_prompt)
        else:
            log_data["prompt"] = sanitized_prompt
        
        if len(response) > 2000:
            log_data["response_preview"] = response[:2000] + "..."
            log_data["response_length"] = len(response)
        else:
            log_data["response"] = response
        
        if metadata:
            log_data["metadata"] = metadata
        
        self.logger.info("llm_call", **log_data)
    
    def log_scenario_generation(
        self,
        request_data: Dict[str, Any],
        response_data: Dict[str, Any],
        validation_result: Any,
        correlation_id: Optional[str] = None
    ):
        """
        Log scenario generation operation.
        
        Args:
            request_data: Request data (projectId, segment, hypothesis)
            response_data: Response data (content, metadata, usage)
            validation_result: ValidationResult object
            correlation_id: Optional correlation ID
        """
        log_data = {
            "operation": "generate_scenario",
            "project_id": request_data.get("projectId"),
            "correlation_id": correlation_id or self._generate_correlation_id(),
            "validation_passed": validation_result.is_valid if validation_result else False,
            "validation_errors": len(validation_result.errors) if validation_result else 0,
            "validation_warnings": len(validation_result.warnings) if validation_result else 0,
        }
        
        if "usage" in response_data:
            log_data.update({
                "input_tokens": response_data["usage"].get("input_tokens", 0),
                "output_tokens": response_data["usage"].get("output_tokens", 0),
                "latency_seconds": response_data.get("latency", 0),
                "model": response_data.get("model", "unknown"),
            })
        
        self.logger.info("scenario_generation", **log_data)
    
    def log_error(
        self,
        operation: str,
        error: Exception,
        correlation_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        """
        Log error during LLM operation.
        
        Args:
            operation: Operation name
            error: Exception object
            correlation_id: Optional correlation ID
            context: Optional context data
        """
        log_data = {
            "operation": operation,
            "error_type": type(error).__name__,
            "error_message": str(error),
            "correlation_id": correlation_id or self._generate_correlation_id(),
        }
        
        if context:
            log_data["context"] = context
        
        self.logger.error("llm_error", **log_data)
    
    def _sanitize_prompt(self, prompt: str) -> str:
        """Remove potential PII from prompt"""
        # Basic PII removal (email patterns)
        import re
        prompt = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', prompt)
        # Phone numbers
        prompt = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[PHONE]', prompt)
        return prompt
    
    def _generate_correlation_id(self) -> str:
        """Generate correlation ID for request tracing"""
        return str(uuid.uuid4())


# Global logger instance
llm_logger = LLMLogger()

