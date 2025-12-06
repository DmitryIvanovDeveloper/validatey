"""
Scenario post-processing service
"""
import json
import re
from typing import Dict, List, Optional, Any
from app.models.scenario import ScenarioMetadata, ScenarioBranch


class ScenarioProcessor:
    """Post-processor for generated scenarios"""
    
    def process_scenario(self, content: str) -> Dict[str, Any]:
        """
        Process and normalize generated scenario.
        
        Args:
            content: Raw scenario content from LLM
            
        Returns:
            Processed scenario dictionary
        """
        # Try to extract JSON from content (may have markdown code blocks)
        json_content = self._extract_json(content)
        
        if not json_content:
            raise ValueError("Could not extract valid JSON from scenario content")
        
        # Parse JSON
        try:
            scenario_data = json.loads(json_content)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in processed content: {str(e)}")
        
        # Normalize questions
        if "questions" in scenario_data:
            scenario_data["questions"] = self._normalize_questions(scenario_data["questions"])
        
        # Normalize branches
        if "branches" in scenario_data:
            scenario_data["branches"] = self._normalize_branches(scenario_data["branches"])
        
        return scenario_data
    
    def extract_metadata(self, scenario_data: Dict, request_metadata: Optional[Dict] = None) -> ScenarioMetadata:
        """
        Extract metadata from processed scenario.
        
        Args:
            scenario_data: Processed scenario dictionary
            request_metadata: Original request metadata
            
        Returns:
            ScenarioMetadata object
        """
        questions = scenario_data.get("questions", [])
        branches_data = scenario_data.get("branches", [])
        
        # Extract tone from request or default
        tone = "professional"
        if request_metadata and "tone" in request_metadata:
            tone = request_metadata["tone"]
        
        # Extract length
        length = len(questions)
        
        # Convert branches
        branches = []
        for branch_data in branches_data:
            if isinstance(branch_data, dict):
                branch = ScenarioBranch(
                    questionId=str(branch_data.get("questionId", "")),
                    condition=str(branch_data.get("condition", "")),
                    nextQuestionId=str(branch_data.get("nextQuestionId", ""))
                )
                branches.append(branch)
        
        return ScenarioMetadata(
            tone=tone,
            length=length,
            branches=branches
        )
    
    def _extract_json(self, content: str) -> Optional[str]:
        """Extract JSON from content (may be wrapped in markdown code blocks)"""
        # Remove markdown code blocks
        content = re.sub(r'```json\s*\n', '', content)
        content = re.sub(r'```\s*\n', '', content)
        content = content.strip()
        
        # Try to find JSON object
        # Look for { ... } pattern
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            return match.group(0)
        
        # If no match, try parsing the whole content
        try:
            json.loads(content)
            return content
        except json.JSONDecodeError:
            return None
    
    def _normalize_questions(self, questions: List[Dict]) -> List[Dict]:
        """Normalize question formatting"""
        normalized = []
        
        for question in questions:
            if not isinstance(question, dict):
                continue
            
            normalized_q = {
                "id": str(question.get("id", "")).strip(),
                "text": str(question.get("text", "")).strip(),
                "type": str(question.get("type", "text")).lower(),
                "required": bool(question.get("required", True))
            }
            
            # Normalize options based on type
            options = question.get("options", {})
            if isinstance(options, dict):
                normalized_q["options"] = self._normalize_options(normalized_q["type"], options)
            else:
                normalized_q["options"] = {}
            
            normalized.append(normalized_q)
        
        return normalized
    
    def _normalize_options(self, qtype: str, options: Dict) -> Dict:
        """Normalize options based on question type"""
        normalized = {}
        
        if qtype == "scale":
            normalized["min"] = int(options.get("min", 1))
            normalized["max"] = int(options.get("max", 5))
            if "label" in options:
                normalized["label"] = str(options["label"])
        
        elif qtype == "choice":
            choices = options.get("choices", [])
            if isinstance(choices, list):
                normalized["choices"] = [str(c).strip() for c in choices]
            else:
                normalized["choices"] = []
        
        elif qtype == "number":
            if "min" in options:
                normalized["min"] = float(options["min"])
            if "max" in options:
                normalized["max"] = float(options["max"])
        
        return normalized
    
    def _normalize_branches(self, branches: List[Dict]) -> List[Dict]:
        """Normalize branch formatting"""
        normalized = []
        
        for branch in branches:
            if not isinstance(branch, dict):
                continue
            
            normalized_b = {
                "questionId": str(branch.get("questionId", "")).strip(),
                "condition": str(branch.get("condition", "")).strip(),
                "nextQuestionId": str(branch.get("nextQuestionId", "")).strip()
            }
            
            normalized.append(normalized_b)
        
        return normalized
    
    def format_content_for_storage(self, scenario_data: Dict) -> str:
        """
        Format scenario data as JSON string for storage.
        
        Args:
            scenario_data: Processed scenario dictionary
            
        Returns:
            JSON string
        """
        return json.dumps(scenario_data, ensure_ascii=False, indent=2)

