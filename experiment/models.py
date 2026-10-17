"""One interface for every model: backend.chat(messages, tools) -> (text, tool_calls, usage).

tool_calls is a list of {"id": str, "name": str, "arguments": dict}.
Messages use the neutral format from agent.py and are converted per backend here.
"""

import json
import os
import uuid

OLLAMA_OPTIONS = {"temperature": 0.7, "num_predict": 768}
OPENAI_MAX_COMPLETION_TOKENS = 2000
OPENAI_REASONING_EFFORT = "low"

MODELS = {
    "llama3.2-3b": {"backend": "ollama", "id": "llama3.2:latest"},
    "qwen2.5-3b": {"backend": "ollama", "id": "qwen2.5:3b"},
    "gpt-5-nano": {"backend": "openai", "id": "gpt-5-nano"},
    "gpt-5-mini": {"backend": "openai", "id": "gpt-5-mini"},
}

# USD per 1M tokens (input, output), used only for cost estimates/reporting.
OPENAI_PRICES = {"gpt-5-nano": (0.05, 0.40), "gpt-5-mini": (0.25, 2.00)}


class OllamaBackend:
    def __init__(self, model_id):
        import ollama
        self.client = ollama.Client(host="http://localhost:11434")
        self.model_id = model_id
        self.settings = dict(OLLAMA_OPTIONS)

    @staticmethod
    def _convert(messages):
        out = []
        for m in messages:
            if m["role"] == "tool":
                out.append({"role": "tool", "content": m["content"], "tool_name": m["name"]})
            elif m["role"] == "assistant" and m.get("tool_calls"):
                out.append({"role": "assistant", "content": m["content"],
                            "tool_calls": [{"function": {"name": tc["name"], "arguments": tc["arguments"]}}
                                           for tc in m["tool_calls"]]})
            else:
                out.append({"role": m["role"], "content": m["content"]})
        return out

    def chat(self, messages, tools):
        resp = self.client.chat(model=self.model_id, messages=self._convert(messages),
                                tools=tools, options=OLLAMA_OPTIONS)
        msg = resp.message
        calls = []
        for tc in msg.tool_calls or []:
            args = tc.function.arguments
            calls.append({"id": f"call_{uuid.uuid4().hex[:8]}", "name": tc.function.name,
                          "arguments": dict(args) if isinstance(args, dict) else {"_raw": str(args)}})
        usage = {"input_tokens": resp.prompt_eval_count or 0, "output_tokens": resp.eval_count or 0}
        return msg.content or "", calls, usage


class OpenAIBackend:
    def __init__(self, model_id):
        from dotenv import load_dotenv
        from openai import OpenAI
        load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
        self.client = OpenAI()  # reads OPENAI_API_KEY from the environment; never logged
        self.model_id = model_id
        self.settings = {"reasoning_effort": OPENAI_REASONING_EFFORT,
                         "max_completion_tokens": OPENAI_MAX_COMPLETION_TOKENS,
                         "temperature": "default (not settable for reasoning models)"}

    @staticmethod
    def _convert(messages):
        out = []
        for m in messages:
            if m["role"] == "tool":
                out.append({"role": "tool", "tool_call_id": m["tool_call_id"], "content": m["content"]})
            elif m["role"] == "assistant" and m.get("tool_calls"):
                out.append({"role": "assistant", "content": m["content"] or None,
                            "tool_calls": [{"id": tc["id"], "type": "function",
                                            "function": {"name": tc["name"],
                                                         "arguments": json.dumps(tc["arguments"])}}
                                           for tc in m["tool_calls"]]})
            else:
                out.append({"role": m["role"], "content": m["content"]})
        return out

    def chat(self, messages, tools):
        resp = self.client.chat.completions.create(
            model=self.model_id, messages=self._convert(messages), tools=tools,
            max_completion_tokens=OPENAI_MAX_COMPLETION_TOKENS,
            reasoning_effort=OPENAI_REASONING_EFFORT)
        self.settings["resolved_model"] = resp.model  # dated snapshot behind the alias
        msg = resp.choices[0].message
        calls = []
        for tc in msg.tool_calls or []:
            try:
                args = json.loads(tc.function.arguments or "{}")
            except json.JSONDecodeError:
                args = {"_raw": tc.function.arguments}
            calls.append({"id": tc.id, "name": tc.function.name,
                          "arguments": args if isinstance(args, dict) else {"_raw": str(args)}})
        u = resp.usage
        usage = {"input_tokens": u.prompt_tokens if u else 0,
                 "output_tokens": u.completion_tokens if u else 0}
        return msg.content or "", calls, usage


def get_backend(model_key):
    spec = MODELS[model_key]
    if spec["backend"] == "ollama":
        return OllamaBackend(spec["id"])
    return OpenAIBackend(spec["id"])
