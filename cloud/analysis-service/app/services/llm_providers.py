"""
LLM providers integration
"""
import json
import time
from typing import Optional, Dict, Any
# TODO: Uncomment for real API calls
# from anthropic import Anthropic
from app.config import settings
from app.prompts.scenario_generation import get_system_prompt


class ClaudeProvider:
    """Provider for Anthropic Claude API"""
    
    def __init__(self):
        # TODO: Uncomment for real API calls
        # if not settings.anthropic_api_key:
        #     raise ValueError("ANTHROPIC_API_KEY is not set")
        # 
        # self.client = Anthropic(api_key=settings.anthropic_api_key)
        self.model = getattr(settings, 'claude_model', 'claude-3-5-sonnet-20241022')
        self.temperature = getattr(settings, 'claude_temperature', 0.7)
        self.max_tokens = getattr(settings, 'claude_max_tokens', 4000)
        # MOCK MODE: client not initialized for testing
        self.client = None
        
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
        
        # TODO: Uncomment for real API calls
        # try:
        #     message = self.client.messages.create(
        #         model=self.model,
        #         max_tokens=self.max_tokens,
        #         temperature=self.temperature,
        #         system=get_system_prompt(),
        #         messages=[
        #             {
        #                 "role": "user",
        #                 "content": prompt
        #             }
        #         ]
        #     )
        #     
        #     latency = time.time() - start_time
        #     
        #     # Extract content
        #     content = ""
        #     if message.content:
        #         # Claude returns a list of content blocks
        #         for block in message.content:
        #             if hasattr(block, 'text'):
        #                 content += block.text
        #             elif isinstance(block, dict) and 'text' in block:
        #                 content += block['text']
        #     
        #     usage = {
        #         "input_tokens": message.usage.input_tokens if hasattr(message, 'usage') else 0,
        #         "output_tokens": message.usage.output_tokens if hasattr(message, 'usage') else 0,
        #     }
        #     
        #     return {
        #         "content": content,
        #         "usage": usage,
        #         "latency": latency,
        #         "model": self.model,
        #         "correlation_id": correlation_id
        #     }
        #     
        # except Exception as e:
        #     latency = time.time() - start_time
        #     raise Exception(f"Claude API error: {str(e)} (latency: {latency:.2f}s)")
        
        # MOCK RESPONSE for testing without API keys
        latency = time.time() - start_time
        
        # Hardcoded response matching expected format
        mock_content = json.dumps({
            "questions": [
                {
                    "id": "q1",
                    "text": "How would you rate the severity of the problem with low funnel conversion?",
                    "type": "scale",
                    "options": {
                        "min": 1,
                        "max": 10,
                        "label": "Not important - Critically important"
                    },
                    "required": True
                },
                {
                    "id": "q2",
                    "text": "What are the main reasons for low conversion that you see?",
                    "type": "text",
                    "required": True
                },
                {
                    "id": "q3",
                    "text": "What tools are you currently using to improve conversion?",
                    "type": "choice",
                    "options": {
                        "choices": [
                            "Email marketing",
                            "A/B testing",
                            "Personalization",
                            "Other tools"
                        ]
                    },
                    "required": True
                },
                {
                    "id": "q4",
                    "text": "How often do you analyze customer behavior in the funnel?",
                    "type": "choice",
                    "options": {
                        "choices": [
                            "Daily",
                            "Weekly",
                            "Monthly",
                            "Rarely or never"
                        ]
                    },
                    "required": True
                },
                {
                    "id": "q5",
                    "text": "How important is it for you to understand specific customer pain points?",
                    "type": "scale",
                    "options": {
                        "min": 1,
                        "max": 5,
                        "label": "Not important - Very important"
                    },
                    "required": True
                },
                {
                    "id": "q6",
                    "text": "Do you think personalized email campaigns based on JTBD would help increase conversion?",
                    "type": "scale",
                    "options": {
                        "min": 1,
                        "max": 5,
                        "label": "Definitely not - Definitely yes"
                    },
                    "required": True
                },
                {
                    "id": "q7",
                    "text": "What is the maximum price you would pay for a solution that increases conversion by 20%?",
                    "type": "number",
                    "options": {
                        "min": 0
                    },
                    "required": True
                },
                {
                    "id": "q8",
                    "text": "What is more important to you: quick implementation of the solution or its deep customization?",
                    "type": "choice",
                    "options": {
                        "choices": [
                            "Quick implementation",
                            "Deep customization",
                            "Both factors are equally important"
                        ]
                    },
                    "required": True
                }
            ],
            "branches": [
                {
                    "questionId": "q1",
                    "condition": "answer.score >= 8",
                    "nextQuestionId": "q3"
                },
                {
                    "questionId": "q6",
                    "condition": "answer.score >= 4",
                    "nextQuestionId": "q7"
                }
            ]
        }, ensure_ascii=False, indent=2)
        
        usage = {
            "input_tokens": 500,
            "output_tokens": 800,
        }
        
        return {
            "content": mock_content,
            "usage": usage,
            "latency": latency,
            "model": self.model,
            "correlation_id": correlation_id
        }
    
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
        # TODO: Uncomment for real API calls
        # if not settings.openai_api_key:
        #     raise ValueError("OPENAI_API_KEY is not set")
        # 
        # try:
        #     from openai import OpenAI
        #     self.client = OpenAI(api_key=settings.openai_api_key)
        #     self.model = "gpt-4-turbo-preview"
        #     self.temperature = 0.7
        #     self.max_tokens = 4000
        # except ImportError:
        #     raise ImportError("openai package is not installed")
        
        # MOCK MODE: client not initialized for testing
        self.client = None
        self.model = "gpt-4-turbo-preview"
        self.temperature = 0.7
        self.max_tokens = 4000
    
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
        
        # TODO: Uncomment for real API calls
        # try:
        #     response = self.client.chat.completions.create(
        #         model=self.model,
        #         messages=[
        #             {"role": "system", "content": get_system_prompt()},
        #             {"role": "user", "content": prompt}
        #         ],
        #         temperature=self.temperature,
        #         max_tokens=self.max_tokens,
        #         response_format={"type": "json_object"}  # Force JSON output
        #     )
        #     
        #     latency = time.time() - start_time
        #     
        #     content = response.choices[0].message.content or ""
        #     
        #     usage = {
        #         "input_tokens": response.usage.prompt_tokens if response.usage else 0,
        #         "output_tokens": response.usage.completion_tokens if response.usage else 0,
        #     }
        #     
        #     return {
        #         "content": content,
        #         "usage": usage,
        #         "latency": latency,
        #         "model": self.model,
        #         "correlation_id": correlation_id
        #     }
        #     
        # except Exception as e:
        #     latency = time.time() - start_time
        #     raise Exception(f"OpenAI API error: {str(e)} (latency: {latency:.2f}s)")
        
        # MOCK RESPONSE for testing without API keys
        latency = time.time() - start_time
        
        # Use same mock content as Claude
        mock_content = json.dumps({
            "questions": [
                {
                    "id": "q1",
                    "text": "How would you rate the severity of the problem with low funnel conversion?",
                    "type": "scale",
                    "options": {
                        "min": 1,
                        "max": 10,
                        "label": "Not important - Critically important"
                    },
                    "required": True
                },
                {
                    "id": "q2",
                    "text": "What are the main reasons for low conversion that you see?",
                    "type": "text",
                    "required": True
                },
                {
                    "id": "q3",
                    "text": "What tools are you currently using to improve conversion?",
                    "type": "choice",
                    "options": {
                        "choices": [
                            "Email marketing",
                            "A/B testing",
                            "Personalization",
                            "Other tools"
                        ]
                    },
                    "required": True
                },
                {
                    "id": "q4",
                    "text": "How often do you analyze customer behavior in the funnel?",
                    "type": "choice",
                    "options": {
                        "choices": [
                            "Daily",
                            "Weekly",
                            "Monthly",
                            "Rarely or never"
                        ]
                    },
                    "required": True
                },
                {
                    "id": "q5",
                    "text": "How important is it for you to understand specific customer pain points?",
                    "type": "scale",
                    "options": {
                        "min": 1,
                        "max": 5,
                        "label": "Not important - Very important"
                    },
                    "required": True
                },
                {
                    "id": "q6",
                    "text": "Do you think personalized email campaigns based on JTBD would help increase conversion?",
                    "type": "scale",
                    "options": {
                        "min": 1,
                        "max": 5,
                        "label": "Definitely not - Definitely yes"
                    },
                    "required": True
                },
                {
                    "id": "q7",
                    "text": "What is the maximum price you would pay for a solution that increases conversion by 20%?",
                    "type": "number",
                    "options": {
                        "min": 0
                    },
                    "required": True
                },
                {
                    "id": "q8",
                    "text": "What is more important to you: quick implementation of the solution or its deep customization?",
                    "type": "choice",
                    "options": {
                        "choices": [
                            "Quick implementation",
                            "Deep customization",
                            "Both factors are equally important"
                        ]
                    },
                    "required": True
                }
            ],
            "branches": [
                {
                    "questionId": "q1",
                    "condition": "answer.score >= 8",
                    "nextQuestionId": "q3"
                },
                {
                    "questionId": "q6",
                    "condition": "answer.score >= 4",
                    "nextQuestionId": "q7"
                }
            ]
        }, ensure_ascii=False, indent=2)
        
        usage = {
            "input_tokens": 500,
            "output_tokens": 800,
        }
        
        return {
            "content": mock_content,
            "usage": usage,
            "latency": latency,
            "model": self.model,
            "correlation_id": correlation_id
        }

