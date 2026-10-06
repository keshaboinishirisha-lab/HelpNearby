from unittest.mock import patch, MagicMock
from backend.services.ai_service import suggest_category_and_condition, _heuristic_suggest_category_and_condition
from backend.core.config import settings


def test_heuristic_fallback_classification():
    """Ensure heuristic engine accurately classifies items without any external API."""
    res = _heuristic_suggest_category_and_condition("High School Chemistry Textbook", "Brand new sealed in plastic wrap")
    assert res["suggested_category_slug"] == "educational-materials"
    assert res["suggested_condition"] == "new"
    assert res["confidence"] >= 0.90
    assert "Item matches books" in res["reasoning"]

    res_food = _heuristic_suggest_category_and_condition("Unopened cans of organic beans and rice", "Pantry dry goods")
    assert res_food["suggested_category_slug"] == "packaged-food"

    res_laptop = _heuristic_suggest_category_and_condition("Refurbished Dell laptop", "Very good condition")
    assert res_laptop["suggested_category_slug"] == "electronics"
    assert res_laptop["suggested_condition"] == "good"


def test_dual_mode_fallback_when_nvidia_key_is_unset():
    """When NVIDIA_API_KEY is unset or empty, system automatically invokes heuristic fallback."""
    with patch.object(settings, "NVIDIA_API_KEY", ""):
        res = suggest_category_and_condition("Men's winter puffer coat", "Barely used like new")
        assert res["suggested_category_slug"] == "clothes"
        assert res["suggested_condition"] == "like_new"
        assert res["confidence"] >= 0.85


def test_dual_mode_nvidia_nim_mock_success():
    """When NVIDIA_API_KEY is configured and NIM returns JSON, system parses it properly."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [
            {
                "message": {
                    "content": (
                        '{"suggested_category_slug": "medical-accessibility", '
                        '"suggested_category_name": "Medical & Mobility Aids", '
                        '"suggested_condition": "like_new", '
                        '"confidence": 0.98, '
                        '"reasoning": "Mobility equipment identified by NVIDIA NIM Llama-3.1."}'
                    )
                }
            }
        ]
    }

    with patch.object(settings, "NVIDIA_API_KEY", "nvapi-test-fake-key-12345"):
        with patch("httpx.Client.post", return_value=mock_response):
            res = suggest_category_and_condition("Standard adult wheelchair with foldable footrests", "Like new")
            assert res["suggested_category_slug"] == "medical-accessibility"
            assert res["suggested_condition"] == "like_new"
            assert res["confidence"] == 0.98
            assert "NVIDIA NIM" in res["reasoning"]


def test_dual_mode_nvidia_nim_error_fallback():
    """When NVIDIA NIM throws an exception or timeout, system seamlessly degrades to heuristic with 0 errors."""
    with patch.object(settings, "NVIDIA_API_KEY", "nvapi-test-fake-key-12345"):
        with patch("httpx.Client.post", side_effect=Exception("Connection timeout to api.nvidia.com")):
            # Should NOT raise an exception; should fall back to heuristic
            res = suggest_category_and_condition("Foldable wheelchair", "Used")
            assert res["suggested_category_slug"] == "medical-accessibility"
            assert "healthcare or mobility" in res["reasoning"]
