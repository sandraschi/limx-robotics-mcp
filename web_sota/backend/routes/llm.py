import sys
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "src"))

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["LLM"], prefix="/api/llm")


OLLAMA_BASE = "http://127.0.0.1:11434"
LMSTUDIO_BASE = "http://127.0.0.1:1234"


@router.get("/providers")
async def get_llm_providers():
    providers = {}

    for provider_name, base_url in [("ollama", OLLAMA_BASE), ("lm_studio", LMSTUDIO_BASE)]:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{base_url}/v1/models")
                if resp.status_code == 200:
                    data = resp.json()
                    models = [m["id"] for m in data.get("data", [])]
                    providers[provider_name] = {
                        "available": True,
                        "base_url": base_url,
                        "models": models,
                    }
                else:
                    providers[provider_name] = {"available": False, "base_url": base_url, "error": f"HTTP {resp.status_code}"}
        except httpx.ConnectError:
            providers[provider_name] = {"available": False, "base_url": base_url, "error": "Connection refused"}
        except Exception as e:
            providers[provider_name] = {"available": False, "base_url": base_url, "error": str(e)}

    return {"success": True, "providers": providers}


class ChatBody(BaseModel):
    provider: str = "ollama"
    model: str = ""
    messages: list[dict] = []


@router.post("/chat")
async def post_llm_chat(body: ChatBody):
    if body.provider == "ollama":
        base = OLLAMA_BASE
    elif body.provider == "lm_studio":
        base = LMSTUDIO_BASE
    else:
        return {"success": False, "message": f"Unknown provider '{body.provider}'. Use 'ollama' or 'lm_studio'."}

    payload = {"model": body.model, "messages": body.messages, "stream": False}

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(f"{base}/v1/chat/completions", json=payload)
            if resp.status_code == 200:
                data = resp.json()
                choice = data["choices"][0]
                return {
                    "success": True,
                    "provider": body.provider,
                    "model": data.get("model", body.model),
                    "response": choice["message"]["content"],
                    "usage": data.get("usage"),
                }
            return {"success": False, "message": f"Provider returned HTTP {resp.status_code}", "detail": resp.text[:500]}
    except httpx.ConnectError:
        return {"success": False, "message": f"Cannot connect to {body.provider} at {base}."}
    except Exception as e:
        return {"success": False, "message": str(e)}
