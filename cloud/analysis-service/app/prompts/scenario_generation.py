"""
Prompt templates for scenario generation
"""
from typing import Dict
from app.models.scenario import GenerateScenarioRequest


def build_scenario_prompt(request: GenerateScenarioRequest) -> str:
    """
    Build a prompt for scenario generation based on request data.
    
    Args:
        request: GenerateScenarioRequest with segment, hypothesis, and metadata
        
    Returns:
        Formatted prompt string
    """
    tone = request.metadata.tone if request.metadata else "professional"
    length = request.metadata.length if request.metadata else 8
    
    # Tone instructions mapping
    tone_instructions = {
        "professional": "Use a professional, business-like tone. Be respectful and clear.",
        "friendly": "Use a friendly, conversational tone. Be warm and approachable.",
        "formal": "Use a formal, academic tone. Be precise and structured."
    }
    
    tone_instruction = tone_instructions.get(tone, tone_instructions["professional"])
    
    prompt = f"""You are an expert in Customer Development (CustDev) and user research. 
Your task is to create a structured interview scenario for validating a product hypothesis.

## Context

**Target Segment:**
- Demographics: {request.segment.demographics}
- Behavior: {request.segment.behavior}
- Jobs To Be Done (JTBD): {request.segment.jtbd}

**Hypothesis:**
- Problem: {request.hypothesis.problem}
- Proposed Solution: {request.hypothesis.solution}

## Requirements

Generate an interview scenario with exactly {length} questions (between 6-10) that will help validate this hypothesis.

**Question Types:**
- `text`: Open-ended text response
- `number`: Numeric response (specify min/max if applicable)
- `choice`: Multiple choice (provide options)
- `scale`: Rating scale (specify range, e.g., 1-5 or 1-10)

**Tone:** {tone_instruction}

## Output Format

Return a valid JSON object with the following structure:

```json
{{
  "questions": [
    {{
      "id": "q1",
      "text": "Question text here",
      "type": "scale",
      "options": {{"min": 1, "max": 5, "label": "Not important - Very important"}},
      "required": true
    }},
    {{
      "id": "q2",
      "text": "Question text here",
      "type": "text",
      "required": true
    }},
    {{
      "id": "q3",
      "text": "Question text here",
      "type": "choice",
      "options": {{"choices": ["Option 1", "Option 2", "Option 3"]}},
      "required": true
    }}
  ],
  "branches": [
    {{
      "questionId": "q1",
      "condition": "answer.score >= 4",
      "nextQuestionId": "q2a"
    }}
  ]
}}
```

## Guidelines

1. **Question Sequence:**
   - Start with understanding the problem (pain points, frequency, impact)
   - Then explore current solutions/alternatives
   - Assess willingness to pay (WTP) if relevant
   - End with reaction to proposed solution

2. **Question Quality:**
   - Each question should be clear and unambiguous
   - Avoid leading questions
   - Use the specified tone consistently
   - Questions should build on each other logically

3. **Branching Logic:**
   - Add branches where different answer paths would provide better insights
   - Use conditions like: "answer.score >= 4", "answer.text contains 'yes'", etc.
   - Ensure all branches lead to valid question IDs

4. **WTP Questions:**
   - Include at least one question about willingness to pay
   - Use Van Westendorp method or anchor questions
   - Format: "What is the maximum price you would pay for this solution?"

5. **Problem Severity:**
   - Include a scale question (1-10) about problem severity/importance
   - This helps identify early signals (8+/10)

Generate the scenario now, ensuring it directly addresses the hypothesis and helps validate whether the proposed solution solves the stated problem for the target segment."""

    return prompt


def get_system_prompt() -> str:
    """
    Get system prompt for Claude API.
    
    Returns:
        System prompt string
    """
    return """You are an expert Customer Development (CustDev) consultant specializing in creating 
effective interview scenarios for product validation. You understand Jobs To Be Done (JTBD) framework, 
customer segmentation, and hypothesis validation methodologies.

Your responses are always valid JSON that can be parsed programmatically. You follow instructions 
precisely and create high-quality, actionable interview scenarios."""

