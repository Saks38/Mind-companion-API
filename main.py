"""
main.py — Core runner for Sahaj bot (Psychologist personality)
"""

from core.intent_handler import IntentHandler
from core.memory_manager import MemoryManager
from core.response_engine import ResponseEngine

print("🧠 Sahaj is initializing...")

memory = MemoryManager("data/memory.json")
intents = IntentHandler("data/intents.json", "data/faqs.json")
response_engine = ResponseEngine(memory, intents)

while True:
    user_input = input("You: ")
    if user_input.lower() in ["exit", "quit"]:
        print("Sahaj: Take care of yourself. Remember, small steps matter. 💫")
        break
    response = response_engine.generate_response(user_input)
    print("Sahaj:", response)
