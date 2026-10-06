import math
import hashlib
from typing import Tuple, List, Dict


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance in kilometers between two points
    on the earth (specified in decimal degrees).
    """
    R = 6371.0  # Earth radius in kilometers

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


def fuzz_coordinates(lat: float, lng: float, salt: str = "givenearby_privacy") -> Tuple[float, float, str]:
    """
    Zero-Leak Privacy:
    Obfuscates precise GPS coordinates into an approximate neighborhood centroid (~1.2 km grid).
    Deterministic per location so it doesn't jump around, but completely decouples
    the public marker from the user's private residence.
    """
    # Truncate to ~0.01 degrees (~1.1 km precision)
    grid_lat = round(lat, 2)
    grid_lng = round(lng, 2)

    # Use hash of coordinates + salt to provide consistent slight offset within the grid cell
    key = f"{grid_lat}:{grid_lng}:{salt}".encode("utf-8")
    hash_val = int(hashlib.sha256(key).hexdigest()[:6], 16)
    offset_lat = ((hash_val % 100) - 50) * 0.0001
    offset_lng = (((hash_val >> 8) % 100) - 50) * 0.0001

    approx_lat = round(grid_lat + offset_lat, 4)
    approx_lng = round(grid_lng + offset_lng, 4)
    approx_desc = f"Approx. {round(approx_lat, 2)}°, {round(approx_lng, 2)}° (Neighborhood Area)"

    return approx_lat, approx_lng, approx_desc


def get_safe_pickup_points(approx_lat: float, approx_lng: float) -> List[Dict[str, str]]:
    """
    Recommends safe, public, and monitored community handover points
    near the approximate area to avoid private home meetups.
    """
    return [
        {
            "name": "Community Library Main Entrance",
            "type": "Public Library",
            "note": "Well-lit public entrance, recommended during daylight hours."
        },
        {
            "name": "Civic Center / Municipal Plaza",
            "type": "Civic Building",
            "note": "Public security monitoring, open public plaza."
        },
        {
            "name": "Community Health Center Lobby",
            "type": "Community Center",
            "note": "Accessible public waiting area."
        },
        {
            "name": "Local Transit Hub / Metro Station Plaza",
            "type": "Transit Hub",
            "note": "High pedestrian visibility and clear public meeting points."
        }
    ]
