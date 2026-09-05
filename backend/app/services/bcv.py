import urllib.request
import json
import ssl
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.bcv import BCVRateSetting

# Cache en memoria para evitar peticiones redundantes excesivas
_rates_cache: Dict[str, Any] = {
    "usd_bcv": {"rate": 807.39, "fecha": None, "fuente": "Banco Central de Venezuela"},
    "eur_bcv": {"rate": 938.45, "fecha": None, "fuente": "Banco Central de Venezuela"},
    "usdt_p2p": {"rate": 960.17, "min_price": 960.0, "max_price": 960.30, "fuente": "Binance P2P (Compra)"},
    "last_fetch": None
}

CACHE_TTL_SECONDS = 180  # 3 minutos de caché

def fetch_all_rates_from_apis() -> Dict[str, Any]:
    """Consulta en tiempo real el Dólar BCV, Euro BCV y Compra de USDT."""
    global _rates_cache
    now = datetime.now(timezone.utc)

    if _rates_cache["last_fetch"]:
        elapsed = (now - _rates_cache["last_fetch"]).total_seconds()
        if elapsed < CACHE_TTL_SECONDS:
            return _rates_cache

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    # 1. Dólar BCV Oficial
    try:
        req_usd = urllib.request.Request(
            "https://ve.dolarapi.com/v1/dolares/oficial",
            headers={"User-Agent": "ADATOV-App/1.0", "Accept": "application/json"}
        )
        with urllib.request.urlopen(req_usd, context=ctx, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
            rate = float(data.get("promedio", 0))
            if rate > 0:
                _rates_cache["usd_bcv"] = {
                    "rate": round(rate, 2),
                    "fecha": data.get("fechaActualizacion"),
                    "fuente": "Banco Central de Venezuela (Oficial)"
                }
    except Exception as e:
        print(f"[USD BCV ERROR]: {e}")

    # 2. Euro BCV Oficial
    try:
        req_eur = urllib.request.Request(
            "https://ve.dolarapi.com/v1/euros/oficial",
            headers={"User-Agent": "ADATOV-App/1.0", "Accept": "application/json"}
        )
        with urllib.request.urlopen(req_eur, context=ctx, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
            rate = float(data.get("promedio", 0))
            if rate > 0:
                _rates_cache["eur_bcv"] = {
                    "rate": round(rate, 2),
                    "fecha": data.get("fechaActualizacion"),
                    "fuente": "Banco Central de Venezuela (Oficial)"
                }
    except Exception as e:
        print(f"[EUR BCV ERROR]: {e}")

    # 3. Compra de USDT (Binance P2P en VES)
    try:
        binance_url = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"
        payload = json.dumps({
            "asset": "USDT",
            "fiat": "VES",
            "merchantCheck": False,
            "page": 1,
            "rows": 8,
            "payTypes": [],
            "publisherType": None,
            "tradeType": "BUY"
        }).encode("utf-8")

        req_p2p = urllib.request.Request(
            binance_url,
            data=payload,
            headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req_p2p, timeout=5) as response:
            p2p_data = json.loads(response.read().decode("utf-8"))
            advs = p2p_data.get("data", [])
            prices = [float(item["adv"]["price"]) for item in advs if "adv" in item and "price" in item["adv"]]
            if prices:
                avg_price = round(sum(prices) / len(prices), 2)
                _rates_cache["usdt_p2p"] = {
                    "rate": avg_price,
                    "min_price": round(min(prices), 2),
                    "max_price": round(max(prices), 2),
                    "fuente": "Binance P2P Venezuela (Compra USDT)",
                    "fecha": now.isoformat()
                }
    except Exception as e:
        print(f"[USDT P2P ERROR]: {e}")

    _rates_cache["last_fetch"] = now
    return _rates_cache

def get_current_bcv_rate(db: Session, user_id: Optional[str] = None) -> float:
    """Retorna la tasa aplicable de USD BCV para compras/ventas."""
    if user_id:
        user_setting = (
            db.query(BCVRateSetting)
            .filter(BCVRateSetting.user_id == user_id)
            .first()
        )
        if user_setting and user_setting.rate > 0:
            return user_setting.rate

    rates = fetch_all_rates_from_apis()
    return rates["usd_bcv"]["rate"]

def get_all_rates_detailed(db: Session, user_id: Optional[str] = None) -> Dict[str, Any]:
    """Retorna los datos completos de Dólar BCV, Euro BCV y USDT Compra."""
    rates = fetch_all_rates_from_apis()
    is_custom = False
    custom_rate = None

    if user_id:
        user_setting = (
            db.query(BCVRateSetting)
            .filter(BCVRateSetting.user_id == user_id)
            .first()
        )
        if user_setting and user_setting.rate > 0:
            is_custom = True
            custom_rate = user_setting.rate

    usd_rate = custom_rate if is_custom else rates["usd_bcv"]["rate"]
    eur_rate = rates["eur_bcv"]["rate"]
    usdt_rate = rates["usdt_p2p"]["rate"]

    # Cálculo de brecha cambiaria (spread USDT vs BCV USD)
    gap_percentage = 0.0
    if usd_rate > 0:
        gap_percentage = round(((usdt_rate - usd_rate) / usd_rate) * 100, 2)

    return {
        "usd_bcv": {
            "rate": usd_rate,
            "official_rate": rates["usd_bcv"]["rate"],
            "is_custom": is_custom,
            "custom_rate": custom_rate,
            "fuente": rates["usd_bcv"]["fuente"],
            "fecha": rates["usd_bcv"]["fecha"],
            "currency": "VES/USD"
        },
        "eur_bcv": {
            "rate": eur_rate,
            "fuente": rates["eur_bcv"]["fuente"],
            "fecha": rates["eur_bcv"]["fecha"],
            "currency": "VES/EUR"
        },
        "usdt_p2p": {
            "rate": usdt_rate,
            "min_price": rates["usdt_p2p"]["min_price"],
            "max_price": rates["usdt_p2p"]["max_price"],
            "fuente": rates["usdt_p2p"]["fuente"],
            "gap_percentage": gap_percentage,
            "currency": "VES/USDT"
        }
    }

def set_user_bcv_rate(db: Session, user_id: str, rate: float) -> BCVRateSetting:
    setting = db.query(BCVRateSetting).filter(BCVRateSetting.user_id == user_id).first()
    if setting:
        setting.rate = rate
        setting.source = "Personalizada"
        setting.updated_at = datetime.now(timezone.utc)
    else:
        setting = BCVRateSetting(
            user_id=user_id,
            rate=rate,
            source="Personalizada"
        )
        db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting

def reset_user_bcv_rate(db: Session, user_id: str) -> None:
    setting = db.query(BCVRateSetting).filter(BCVRateSetting.user_id == user_id).first()
    if setting:
        db.delete(setting)
        db.commit()
