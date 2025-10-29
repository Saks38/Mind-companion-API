"""
intent_handler.py — Handles intent classification and FAQ matching
"""

import json
import difflib

class IntentHandler:
    def __init__(self, intents_path, faqs_path):
        with open(intents_path, "r") as f:
            self.intents = json.load(f)
        with open(faqs_path, "r") as f:
            self.faqs = json.load(f)

    def match_intent(self, user_input):
        best_match = None
        highest_ratio = 0.0
        for intent in self.intents:
            for pattern in intent["patterns"]:
                ratio = difflib.SequenceMatcher(None, pattern.lower(), user_input.lower()).ratio()
                if ratio > highest_ratio:
                    highest_ratio = ratio
                    best_match = intent
        return best_match if highest_ratio > 0.6 else None

    def match_faq(self, user_input):
        best_match = None
        highest_ratio = 0.0
        for faq in self.faqs:
            ratio = difflib.SequenceMatcher(None, faq["question"].lower(), user_input.lower()).ratio()
            if ratio > highest_ratio:
                highest_ratio = ratio
                best_match = faq
        return best_match if highest_ratio > 0.7 else None
