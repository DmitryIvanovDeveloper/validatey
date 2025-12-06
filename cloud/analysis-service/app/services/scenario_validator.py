"""
Scenario validation service
"""
import json
import re
from typing import Dict, List, Optional, Tuple
from app.models.scenario import ScenarioMetadata


class ValidationResult:
    """Result of scenario validation"""
    
    def __init__(self, is_valid: bool, errors: List[str], warnings: List[str]):
        self.is_valid = is_valid
        self.errors = errors
        self.warnings = warnings
    
    def __bool__(self):
        return self.is_valid


class ScenarioValidator:
    """Validator for generated scenarios"""
    
    MIN_QUESTIONS = 6
    MAX_QUESTIONS = 10
    VALID_QUESTION_TYPES = {"text", "number", "choice", "scale"}
    
    def validate_scenario(self, content: str, metadata: Optional[Dict] = None) -> ValidationResult:
        """
        Validate generated scenario.
        
        Args:
            content: Scenario content (JSON string)
            metadata: Optional metadata dictionary
            
        Returns:
            ValidationResult with validation status and errors/warnings
        """
        errors = []
        warnings = []
        
        # Try to parse JSON
        try:
            scenario_data = json.loads(content)
        except json.JSONDecodeError as e:
            return ValidationResult(
                is_valid=False,
                errors=[f"Invalid JSON format: {str(e)}"],
                warnings=[]
            )
        
        # Validate structure
        if not isinstance(scenario_data, dict):
            errors.append("Scenario must be a JSON object")
            return ValidationResult(is_valid=False, errors=errors, warnings=warnings)
        
        # Validate questions
        questions = scenario_data.get("questions", [])
        if not isinstance(questions, list):
            errors.append("'questions' must be an array")
        else:
            question_errors = self._validate_questions(questions)
            errors.extend(question_errors)
        
        # Validate branches
        branches = scenario_data.get("branches", [])
        if not isinstance(branches, list):
            errors.append("'branches' must be an array")
        else:
            branch_errors, branch_warnings = self._validate_branches(branches, questions)
            errors.extend(branch_errors)
            warnings.extend(branch_warnings)
        
        # Check for duplicates
        duplicate_warnings = self._check_duplicates(questions)
        warnings.extend(duplicate_warnings)
        
        # Check for toxicity/PII (basic check)
        toxicity_warnings = self._check_toxicity(content)
        warnings.extend(toxicity_warnings)
        
        is_valid = len(errors) == 0
        
        return ValidationResult(
            is_valid=is_valid,
            errors=errors,
            warnings=warnings
        )
    
    def _validate_questions(self, questions: List[Dict]) -> List[str]:
        """Validate questions array"""
        errors = []
        
        if len(questions) < self.MIN_QUESTIONS:
            errors.append(f"Too few questions: {len(questions)} (minimum: {self.MIN_QUESTIONS})")
        
        if len(questions) > self.MAX_QUESTIONS:
            errors.append(f"Too many questions: {len(questions)} (maximum: {self.MAX_QUESTIONS})")
        
        question_ids = set()
        
        for i, question in enumerate(questions, 1):
            if not isinstance(question, dict):
                errors.append(f"Question {i} must be an object")
                continue
            
            # Check required fields
            if "id" not in question:
                errors.append(f"Question {i} missing 'id' field")
            else:
                qid = question["id"]
                if qid in question_ids:
                    errors.append(f"Duplicate question ID: {qid}")
                question_ids.add(qid)
            
            if "text" not in question:
                errors.append(f"Question {i} missing 'text' field")
            elif not question["text"] or not question["text"].strip():
                errors.append(f"Question {i} has empty 'text' field")
            
            if "type" not in question:
                errors.append(f"Question {i} missing 'type' field")
            else:
                qtype = question["type"]
                if qtype not in self.VALID_QUESTION_TYPES:
                    errors.append(
                        f"Question {i} has invalid type '{qtype}'. "
                        f"Valid types: {', '.join(self.VALID_QUESTION_TYPES)}"
                    )
                else:
                    # Validate type-specific options
                    type_errors = self._validate_question_type(question, i)
                    errors.extend(type_errors)
            
            if "required" not in question:
                errors.append(f"Question {i} missing 'required' field")
        
        return errors
    
    def _validate_question_type(self, question: Dict, index: int) -> List[str]:
        """Validate question type-specific options"""
        errors = []
        qtype = question.get("type")
        options = question.get("options", {})
        
        if qtype == "scale":
            if not isinstance(options, dict):
                errors.append(f"Question {index}: 'options' must be an object for scale type")
            else:
                if "min" not in options or "max" not in options:
                    errors.append(f"Question {index}: scale type requires 'min' and 'max' in options")
                elif options["min"] >= options["max"]:
                    errors.append(f"Question {index}: scale 'min' must be less than 'max'")
        
        elif qtype == "choice":
            if not isinstance(options, dict):
                errors.append(f"Question {index}: 'options' must be an object for choice type")
            else:
                if "choices" not in options:
                    errors.append(f"Question {index}: choice type requires 'choices' array in options")
                elif not isinstance(options["choices"], list) or len(options["choices"]) < 2:
                    errors.append(f"Question {index}: choice type requires at least 2 choices")
        
        elif qtype == "number":
            if isinstance(options, dict):
                if "min" in options and "max" in options:
                    if options["min"] >= options["max"]:
                        errors.append(f"Question {index}: number 'min' must be less than 'max'")
        
        return errors
    
    def _validate_branches(self, branches: List[Dict], questions: List[Dict]) -> Tuple[List[str], List[str]]:
        """Validate branching logic"""
        errors = []
        warnings = []
        
        question_ids = {q.get("id") for q in questions if isinstance(q, dict) and "id" in q}
        
        for i, branch in enumerate(branches, 1):
            if not isinstance(branch, dict):
                errors.append(f"Branch {i} must be an object")
                continue
            
            required_fields = ["questionId", "condition", "nextQuestionId"]
            for field in required_fields:
                if field not in branch:
                    errors.append(f"Branch {i} missing '{field}' field")
            
            question_id = branch.get("questionId")
            next_question_id = branch.get("nextQuestionId")
            
            if question_id and question_id not in question_ids:
                errors.append(f"Branch {i}: questionId '{question_id}' not found in questions")
            
            if next_question_id and next_question_id not in question_ids:
                errors.append(f"Branch {i}: nextQuestionId '{next_question_id}' not found in questions")
            
            # Validate condition syntax (basic check)
            condition = branch.get("condition", "")
            if condition and not self._is_valid_condition(condition):
                warnings.append(
                    f"Branch {i}: condition '{condition}' may have syntax issues. "
                    "Ensure it's a valid expression like 'answer.score >= 4'"
                )
        
        return errors, warnings
    
    def _is_valid_condition(self, condition: str) -> bool:
        """Basic validation of condition syntax"""
        if not condition or not condition.strip():
            return False
        
        # Check for common patterns
        patterns = [
            r"answer\.\w+\s*[><=!]+\s*\w+",  # answer.score >= 4
            r"answer\.\w+\s+contains\s+['\"]",  # answer.text contains 'yes'
            r"answer\.\w+\s+in\s+\[",  # answer.choice in ['a', 'b']
        ]
        
        return any(re.search(pattern, condition) for pattern in patterns)
    
    def _check_duplicates(self, questions: List[Dict]) -> List[str]:
        """Check for duplicate or very similar questions"""
        warnings = []
        
        question_texts = []
        for question in questions:
            if isinstance(question, dict) and "text" in question:
                text = question["text"].strip().lower()
                question_texts.append(text)
        
        # Simple duplicate check (exact match)
        seen = set()
        for i, text in enumerate(question_texts, 1):
            if text in seen:
                warnings.append(f"Question {i} appears to be a duplicate")
            seen.add(text)
        
        return warnings
    
    def _check_toxicity(self, content: str) -> List[str]:
        """Basic toxicity/PII check"""
        warnings = []
        
        # Basic patterns for PII
        pii_patterns = [
            r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b",  # Credit card
            r"\b\d{3}-\d{2}-\d{4}\b",  # SSN
            r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",  # Email
        ]
        
        for pattern in pii_patterns:
            if re.search(pattern, content):
                warnings.append("Potential PII detected in content")
                break
        
        # Basic toxicity keywords (very simple check)
        toxic_keywords = ["hate", "kill", "violence"]  # Minimal list for basic check
        content_lower = content.lower()
        for keyword in toxic_keywords:
            if keyword in content_lower:
                warnings.append(f"Potential toxic content detected: '{keyword}'")
                break
        
        return warnings

