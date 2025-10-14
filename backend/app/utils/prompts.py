FLASHCARD_PROMPT_TEMPLATE = """You are an educational assistant. Generate exactly {count} high-quality flashcards from the provided source material.

IMPORTANT: Return ONLY a valid JSON array. No other text before or after.

Difficulty level: {difficulty}
- easy: Basic definitions and simple facts
- medium: Conceptual understanding and connections
- hard: Analysis, synthesis, and application to new scenarios

Format each flashcard as:
{{"id": "fc-1", "question": "Your question here?", "answer": "Your concise answer here."}}

Example output:
[
{{"id": "fc-1", "question": "What is photosynthesis?", "answer": "The process by which plants convert light energy into chemical energy."}},
{{"id": "fc-2", "question": "Where does photosynthesis occur?", "answer": "In the chloroplasts of plant cells."}}
]

Questions should be varied (definitions, concepts, application). Keep answers concise.

SOURCE:
\"\"\"{text}\"\"\""""

EXPLANATION_PROMPT_TEMPLATE = """Explain the following material in the style: {style}.
Guidelines:
- Be accurate
- Avoid hallucinations
- If uncertain, say you lack enough context
- Keep it concise but clear

MATERIAL:
\"\"\"{text}\"\"\""""

QUIZ_PROMPT_TEMPLATE = """You are an educational assistant. Generate exactly {count} multiple-choice quiz questions from the provided source material.

IMPORTANT: Return ONLY a valid JSON array. No other text before or after.

Difficulty level: {difficulty}
- easy: Basic recall and simple comprehension (8 questions)
- medium: Application and analysis (12 questions)  
- hard: Synthesis and evaluation (15 questions)

Format each question as:
{{"id": "q-1", "question": "Your question here?", "options": ["Option A", "Option B", "Option C", "Option D"], "correct_answer": 0, "explanation": "Brief explanation of why this is correct."}}

Requirements:
- Each question must have exactly 4 options
- correct_answer is the index (0-3) of the correct option
- Options should be plausible but only one clearly correct
- Include brief explanation for the correct answer
- Vary question types (definitions, applications, comparisons, etc.)

Example output:
[
{{"id": "q-1", "question": "What is the primary function of photosynthesis?", "options": ["Convert light to chemical energy", "Break down glucose", "Produce oxygen only", "Absorb carbon dioxide"], "correct_answer": 0, "explanation": "Photosynthesis converts light energy into chemical energy stored in glucose."}},
{{"id": "q-2", "question": "Where does photosynthesis primarily occur?", "options": ["Mitochondria", "Nucleus", "Chloroplasts", "Ribosomes"], "correct_answer": 2, "explanation": "Chloroplasts contain chlorophyll and are the primary site of photosynthesis."}}
]

SOURCE:
\"\"\"{text}\"\"\""""