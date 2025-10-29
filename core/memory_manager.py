"""
memory_manager.py — Handles reading/writing persistent memory for users
"""

import json, os

class MemoryManager:
    def __init__(self, memory_path):
        self.memory_path = memory_path
        if not os.path.exists(memory_path):
            with open(memory_path, "w") as f:
                json.dump({}, f)

    def load_memory(self):
        with open(self.memory_path, "r") as f:
            return json.load(f)

    def save_memory(self, memory):
        with open(self.memory_path, "w") as f:
            json.dump(memory, f, indent=4)

    def remember(self, key, value):
        memory = self.load_memory()
        memory[key] = value
        self.save_memory(memory)

    def recall(self, key, default=None):
        return self.load_memory().get(key, default)

    def forget(self, key):
        memory = self.load_memory()
        if key in memory:
            del memory[key]
            self.save_memory(memory)
