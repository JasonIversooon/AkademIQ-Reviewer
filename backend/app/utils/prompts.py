FLASHCARD_PROMPT_TEMPLATE = """You are an educational assistant. Generate exactly {count} high-quality flashcards from the provided source material.
Return ONLY JSON list with objects: id (string short), question, answer.
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