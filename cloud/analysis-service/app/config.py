"""
Application Configuration
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    app_name: str = "LLM Analysis Service"
    app_version: str = "1.0.0"
    environment: str = "development"
    debug: bool = True
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8080
    
    # LLM Providers
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    google_api_key: Optional[str] = None
    vertex_ai_project: Optional[str] = None
    vertex_ai_location: Optional[str] = None
    
    # Model Settings
    default_model: str = "gpt-4"
    max_tokens: int = 2000
    temperature: float = 0.7
    
    # Claude Settings
    claude_model: str = "claude-3-5-sonnet-20241022"
    claude_temperature: float = 0.7
    claude_max_tokens: int = 4000
    
    # Validation Settings
    min_questions: int = 6
    max_questions: int = 10
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()

