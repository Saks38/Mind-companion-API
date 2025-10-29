"""
logger.py — Logs important events, emotions, or chat sessions
"""

from datetime import datetime

def log(message, logfile="logs.txt"):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(logfile, "a") as f:
        f.write(f"[{timestamp}] {message}\n")
