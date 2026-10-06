import re
import json
import logging
from typing import Dict, Any, Optional
import httpx
from backend.core.config import settings

logger = logging.getLogger(__name__)

# Canonical category mapping
CANONICAL_CATEGORIES = {
    "educational-materials": "Educational Materials & Books",
    "packaged-food": "Packaged Food & Nutrition",
    "clothes": "Clothing & Winter Warmth",
    "electronics": "Electronics & Study Tech",
    "medical-accessibility": "Medical & Mobility Aids",
    "household": "Household & Kitchen Utensils",
    "toys": "Toys & Children Play",
}

VALID_CONDITIONS = ["new", "like_new", "good", "fair"]


def _heuristic_suggest_category_and_condition(title: str, description: str = "") -> Dict[str, Any]:
    """
    Deterministic rule-based semantic classifier (zero-latency, 100% offline fallback).
    """
    text = f"{title} {description}".lower()

    patterns = [
        (
            r"\b(book|textbook|novel|dictionary|guide|encyclopedia|fiction|nonfiction|comic|manga)\b",
            "educational-materials",
            "Educational Materials & Books",
            0.95,
            "Item matches books, textbooks, or educational reading literature."
        ),
        (
            r"\b(laptop|computer|monitor|keyboard|mouse|phone|tablet|charger|headphone|cable|ipad|macbook|pc|screen)\b",
            "electronics",
            "Electronics & Study Tech",
            0.92,
            "Keywords match personal computing or consumer electronics."
        ),
        (
            r"\b(shirt|tshirt|pants|jacket|coat|sweater|shoes|boots|dress|jeans|hoodie|clothing|clothes|scarf|socks)\b",
            "clothes",
            "Clothing & Winter Warmth",
            0.90,
            "Item matches wearable apparel or winter garments."
        ),
        (
            r"\b(food|rice|beans|canned|cereal|pasta|snack|ration|packaged|meal|groceries|flour|oil|biscuit)\b",
            "packaged-food",
            "Packaged Food & Nutrition",
            0.94,
            "Item appears to be edible groceries or non-perishable packaged provisions."
        ),
        (
            r"\b(toy|lego|doll|puzzle|game|boardgame|action figure|teddy|play)\b",
            "toys",
            "Toys & Children Play",
            0.89,
            "Item recognized as recreational toys or games for children."
        ),
        (
            r"\b(wheelchair|crutches|walker|cane|glucometer|nebulizer|blood pressure|hearing aid|medical)\b",
            "medical-accessibility",
            "Medical & Mobility Aids",
            0.96,
            "Item matches essential healthcare or mobility assistance equipment."
        ),
        (
            r"\b(desk|chair|table|sofa|bed|mattress|dresser|wardrobe|bookshelf|furniture)\b",
            "household",
            "Household & Kitchen Utensils",
            0.91,
            "Keywords match domestic furniture or residential home fixtures."
        ),
        (
            r"\b(pot|pan|blender|microwave|kettle|toaster|plate|dishes|cookware|kitchen|vacuum)\b",
            "household",
            "Household & Kitchen Utensils",
            0.88,
            "Keywords indicate domestic kitchenware or household utility appliances."
        ),
        (
            r"\b(notebook|pen|pencil|eraser|backpack|ruler|geometry|calculator|stationery|schoolbag)\b",
            "educational-materials",
            "Educational Materials & Books",
            0.93,
            "Keywords indicate classroom or learning supplies."
        ),
    ]

    for pattern, slug, name, conf, reasoning in patterns:
        if re.search(pattern, text):
            condition = "good"
            if re.search(r"\b(brand new|unopened|sealed|in box|never used|mint)\b", text):
                condition = "new"
            elif re.search(r"\b(like new|barely used|flawless|excellent)\b", text):
                condition = "like_new"
            elif re.search(r"\b(good condition|very good|good|great)\b", text):
                condition = "good"
            elif re.search(r"\b(fair|worn|scratched|has marks|heavily used|parts only)\b", text):
                condition = "fair"

            return {
                "suggested_category_slug": slug,
                "suggested_category_name": name,
                "suggested_condition": condition,
                "confidence": conf,
                "reasoning": reasoning
            }

    # Fallback default
    return {
        "suggested_category_slug": "household",
        "suggested_category_name": "Household & Kitchen Utensils",
        "suggested_condition": "good",
        "confidence": 0.65,
        "reasoning": "General community item detected. You can easily adjust the category."
    }


def _query_nvidia_nim(title: str, description: str = "") -> Optional[Dict[str, Any]]:
    """
    Calls NVIDIA NIM inference endpoint using low-latency LLMs (e.g. meta/llama-3.1-8b-instruct).
    Returns structured categorization dictionary or None on failure.
    """
    raw_key = settings.NVIDIA_API_KEY.strip()
    if not raw_key:
        return None

    # Automatically ensure standard nvapi- prefix
    api_key = raw_key if raw_key.startswith("nvapi-") else f"nvapi-{raw_key}"

    url = f"{settings.NVIDIA_BASE_URL.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    allowed_slugs = list(CANONICAL_CATEGORIES.keys())
    system_prompt = (
        "You are an assistive categorization engine for GiveNearby community donation platform. "
        "Analyze the item title and description and recommend the single best category and item condition. "
        "Allowed category slugs: " + ", ".join(allowed_slugs) + ". "
        "Allowed conditions: new, like_new, good, fair. "
        "Respond ONLY with a valid JSON object formatted as follows:\n"
        "{\n"
        '  "suggested_category_slug": "<slug>",\n'
        '  "suggested_category_name": "<full name>",\n'
        '  "suggested_condition": "<condition>",\n'
        '  "confidence": <float between 0.50 and 1.00>,\n'
        '  "reasoning": "<one concise sentence explaining why>"\n'
        "}"
    )

    user_prompt = f"Item Title: {title}\nItem Description: {description or 'N/A'}"

    payload = {
        "model": settings.NVIDIA_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.1,
        "max_tokens": 150
    }

    try:
        with httpx.Client(timeout=7.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"].strip()
                # Strip markdown fences if present
                if content.startswith("```"):
                    content = re.sub(r"^```(?:json)?\s*", "", content)
                    content = re.sub(r"\s*```$", "", content)
                parsed = json.loads(content)
                slug = parsed.get("suggested_category_slug", "household")
                if slug not in CANONICAL_CATEGORIES:
                    slug = "household"
                condition = parsed.get("suggested_condition", "good")
                if condition not in VALID_CONDITIONS:
                    condition = "good"
                conf = float(parsed.get("confidence", 0.90))
                reasoning = parsed.get("reasoning", "Suggested by NVIDIA NIM AI inference.")

                return {
                    "suggested_category_slug": slug,
                    "suggested_category_name": CANONICAL_CATEGORIES.get(slug, "Household & Kitchen Utensils"),
                    "suggested_condition": condition,
                    "confidence": min(max(conf, 0.5), 1.0),
                    "reasoning": reasoning
                }
            else:
                logger.warning(f"NVIDIA NIM API returned status {resp.status_code}: {resp.text}")
                return None
    except Exception as e:
        logger.warning(f"NVIDIA NIM request failed ({e}); falling back to deterministic heuristic engine.")
        return None


def suggest_category_and_condition(title: str, description: str = "") -> Dict[str, Any]:
    """
    Intelligent Assistive Categorizer (Dual-Engine):
    1. If NVIDIA_API_KEY is configured, attempts low-latency inference via NVIDIA NIM.
    2. If NVIDIA NIM is not configured, times out, or fails, gracefully falls back
       to the local zero-latency deterministic pattern engine.
    """
    if settings.NVIDIA_API_KEY:
        nim_result = _query_nvidia_nim(title, description)
        if nim_result:
            return nim_result

    # Always-available zero-latency heuristic fallback
    return _heuristic_suggest_category_and_condition(title, description)
