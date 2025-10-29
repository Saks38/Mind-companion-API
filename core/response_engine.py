"""
response_engine.py — Combines memory + intents + FAQs + personalization
Psychologist-style tone: calm, empathetic, and friendly.
"""

class ResponseEngine:
    def __init__(self, memory_manager, intent_handler):
        self.memory = memory_manager
        self.intent_handler = intent_handler

    def generate_response(self, user_input):
        user_name = self.memory.recall("user_name")

        # Ask for user's preferred name
        if not user_name:
            if "my name is" in user_input.lower():
                name = user_input.split("my name is")[-1].strip().split()[0].capitalize()
                self.memory.remember("user_name", name)
                return f"Nice to meet you, {name}. I'm Sahaj. How are you feeling today?"
            else:
                return "Hello there, I’m Sahaj. What would you like me to call you?"

        # Allow name update
        if "call me" in user_input.lower():
            name = user_input.split("call me")[-1].strip().split()[0].capitalize()
            self.memory.remember("user_name", name)
            return f"Got it. I’ll call you {name} from now on."

        # Match FAQ
        faq = self.intent_handler.match_faq(user_input)
        if faq:
            return faq["answer"].replace("{name}", user_name)

        # Match Intent
        intent = self.intent_handler.match_intent(user_input)
        if intent:
            return intent["response"].replace("{name}", user_name)

        return f"I see, {user_name}. Would you like to tell me a bit more about that?"
