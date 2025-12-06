"""
LLM providers integration
"""
import json
import time
from typing import Optional, Dict, Any
from anthropic import Anthropic
from app.config import settings
from app.prompts.scenario_generation import get_system_prompt


class ClaudeProvider:
    """Provider for Anthropic Claude API"""
    
    def __init__(self):
        if not settings.anthropic_api_key:
            raise ValueError("ANTHROPIC_API_KEY is not set")
        
        self.client = Anthropic(api_key=settings.anthropic_api_key)
        self.model = getattr(settings, 'claude_model', 'claude-3-5-sonnet-20241022')
        self.temperature = getattr(settings, 'claude_temperature', 0.7)
        self.max_tokens = getattr(settings, 'claude_max_tokens', 4000)
        
    def generate_scenario(self, prompt: str, correlation_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate scenario using Claude API.
        
        Args:
            prompt: User prompt for scenario generation
            correlation_id: Optional correlation ID for tracing
            
        Returns:
            Dictionary with 'content' and 'usage' keys
            
        Raises:
            Exception: If API call fails
        """
        start_time = time.time()
        
        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                system=get_system_prompt(),
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            latency = time.time() - start_time
            
            # Extract content
            content = ""
            if message.content:
                # Claude returns a list of content blocks
                for block in message.content:
                    if hasattr(block, 'text'):
                        content += block.text
                    elif isinstance(block, dict) and 'text' in block:
                        content += block['text']
            
            usage = {
                "input_tokens": message.usage.input_tokens if hasattr(message, 'usage') else 0,
                "output_tokens": message.usage.output_tokens if hasattr(message, 'usage') else 0,
            }
            
            return {
                "content": content,
                "usage": usage,
                "latency": latency,
                "model": self.model,
                "correlation_id": correlation_id
            }
            
        except Exception as e:
            latency = time.time() - start_time
            raise Exception(f"Claude API error: {str(e)} (latency: {latency:.2f}s)")
    
    def generate_scenario_with_retry(
        self, 
        prompt: str, 
        max_retries: int = 3,
        correlation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate scenario with retry logic.
        
        Args:
            prompt: User prompt for scenario generation
            max_retries: Maximum number of retry attempts
            correlation_id: Optional correlation ID for tracing
            
        Returns:
            Dictionary with 'content' and 'usage' keys
        """
        last_error = None
        
        for attempt in range(max_retries):
            try:
                return self.generate_scenario(prompt, correlation_id)
            except Exception as e:
                last_error = e
                if attempt < max_retries - 1:
                    # Exponential backoff
                    wait_time = 2 ** attempt
                    time.sleep(wait_time)
                    continue
                else:
                    raise last_error
        
        raise last_error


class OpenAIProvider:
    """Provider for OpenAI API (fallback)"""
    
    def __init__(self):
        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is not set")
        
        try:
            from openai import OpenAI
            self.client = OpenAI(api_key=settings.openai_api_key)
            self.model = "gpt-4-turbo-preview"
            self.temperature = 0.7
            self.max_tokens = 4000
        except ImportError:
            raise ImportError("openai package is not installed")
    
    def generate_scenario(self, prompt: str, correlation_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate scenario using OpenAI API (fallback).
        
        Args:
            prompt: User prompt for scenario generation
            correlation_id: Optional correlation ID for tracing
            
        Returns:
            Dictionary with 'content' and 'usage' keys
        """
        start_time = time.time()
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": get_system_prompt()},
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                response_format={"type": "json_object"}  # Force JSON output
            )
            
            latency = time.time() - start_time
            
            content = response.choices[0].message.content or ""
            
            usage = {
                "input_tokens": response.usage.prompt_tokens if response.usage else 0,
                "output_tokens": response.usage.completion_tokens if response.usage else 0,
            }
            
            return {
                "content": content,
                "usage": usage,
                "latency": latency,
                "model": self.model,
                "correlation_id": correlation_id
            }
            
        except Exception as e:
            latency = time.time() - start_time
            raise Exception(f"OpenAI API error: {str(e)} (latency: {latency:.2f}s)")

