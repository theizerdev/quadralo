"""
Quádralo - Seeder de Datos de Prueba para Usuario 1
Puebla la base de datos con inversiones, ventas y cálculo de ganancias reales
tomando como referencia la tasa oficial del BCV del día de hoy.
"""
import sys
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.models import User, Investment, Sale, BCVRateSetting
from app.services.bcv import fetch_all_rates_from_apis, get_current_bcv_rate

def seed_test_data(db: Session = None, clean_previous: bool = True) -> bool:
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        print("\n" + "="*65)
        print("   QUÁDRALO - SEEDER DE DATOS DE PRUEBA (USUARIO 1)")
        print("="*65)

        # 1. Localizar el Usuario 1 (Empresa principal / SuperAdmin)
        user = db.query(User).filter(User.email == "theizerdev@gmail.com").first()
        if not user:
            user = db.query(User).order_by(User.created_at.asc()).first()

        if not user:
            print("[!] Error: No se encontró el usuario 1 ('theizerdev@gmail.com').")
            print("    Ejecuta primero el seeder base: python seed.py")
            return False

        print(f"[*] Usuario seleccionado: {user.full_name} ({user.email})")
        print(f"    Empresa: {user.business_name} | ID: {user.id}")

        # 2. Consultar y verificar la tasa del dólar oficial del día de hoy
        print("[*] Consultando tasa oficial del BCV para el día de hoy...")
        current_rate = 807.39  # Tasa base oficial de referencia
        try:
            rates_api = fetch_all_rates_from_apis()
            if rates_api and "usd_bcv" in rates_api and rates_api["usd_bcv"].get("rate", 0) > 0:
                current_rate = float(rates_api["usd_bcv"]["rate"])
                print(f"[OK] Tasa BCV obtenida en tiempo real: {current_rate:.2f} VES/USD")
            else:
                db_rate = get_current_bcv_rate(db, user.id)
                if db_rate and db_rate > 0:
                    current_rate = db_rate
                    print(f"[OK] Tasa obtenida de configuración: {current_rate:.2f} VES/USD")
                else:
                    print(f"[i] Usando tasa base de referencia: {current_rate:.2f} VES/USD")
        except Exception as e:
            print(f"[!] No fue posible contactar la API en vivo ({e}), usando tasa: {current_rate:.2f} VES/USD")

        # Asegurar registro en la tabla de configuración BCV
        bcv_setting = db.query(BCVRateSetting).filter(BCVRateSetting.user_id == user.id).first()
        if not bcv_setting:
            bcv_setting = BCVRateSetting(
                user_id=user.id,
                rate=current_rate,
                source="BCV Oficial (Día de hoy)"
            )
            db.add(bcv_setting)
            db.commit()
        else:
            bcv_setting.rate = current_rate
            bcv_setting.source = "BCV Oficial (Día de hoy)"
            db.commit()

        # 3. Limpieza de datos de prueba previos si se solicitó
        if clean_previous:
            print("[*] Limpiando ventas e inversiones previas del usuario 1...")
            db.query(Sale).filter(Sale.user_id == user.id).delete()
            db.query(Investment).filter(Investment.user_id == user.id).delete()
            db.commit()
            print("[OK] Datos anteriores limpiados exitosamente.")

        now = datetime.now()

        # 4. Definición del catálogo de inversiones (Compras de inventario)
        # Productos tecnológicos y accesorios de alta rotación
        investments_catalog = [
            {
                "product_name": "iPhone 15 Pro 128GB Titanium",
                "category": "Smartphones",
                "quantity": 8,
                "amount_usd": 6800.00,  # $850 c/u
                "shipping_cost_usd": 120.00,
                "notes": "Lote importado vía Courier Express. Garantía 1 año Apple.",
                "days_ago": 12
            },
            {
                "product_name": "Xiaomi Redmi Note 13 Pro 256GB",
                "category": "Smartphones",
                "quantity": 15,
                "amount_usd": 3150.00,  # $210 c/u
                "shipping_cost_usd": 75.00,
                "notes": "Distribuidor mayorista oficial. Versión Global.",
                "days_ago": 10
            },
            {
                "product_name": "Audífonos Sony WH-1000XM5 ANC",
                "category": "Audio",
                "quantity": 10,
                "amount_usd": 2600.00,  # $260 c/u
                "shipping_cost_usd": 50.00,
                "notes": "Cancelación de ruido líder en la industria. Empaque sellado.",
                "days_ago": 8
            },
            {
                "product_name": "Smartwatch Samsung Galaxy Watch 6 44mm",
                "category": "Wearables",
                "quantity": 12,
                "amount_usd": 2160.00,  # $180 c/u
                "shipping_cost_usd": 40.00,
                "notes": "Sensores BioActive, pantalla de zafiro.",
                "days_ago": 7
            },
            {
                "product_name": "Monitor Gamer ASUS TUF 24\" IPS 165Hz",
                "category": "Monitores",
                "quantity": 6,
                "amount_usd": 840.00,   # $140 c/u
                "shipping_cost_usd": 90.00,
                "notes": "Tiempo de respuesta 1ms MPRT, FreeSync Premium.",
                "days_ago": 6
            },
            {
                "product_name": "Power Bank Anker 20.000mAh 22.5W",
                "category": "Accesorios",
                "quantity": 25,
                "amount_usd": 600.00,   # $24 c/u
                "shipping_cost_usd": 35.00,
                "notes": "Carga rápida PowerIQ, doble puerto USB-C + USB-A.",
                "days_ago": 5
            },
            {
                "product_name": "Teclado Mecánico RGB Redragon Kumara K552",
                "category": "Periféricos",
                "quantity": 20,
                "amount_usd": 560.00,   # $28 c/u
                "shipping_cost_usd": 40.00,
                "notes": "Switches Outemu Red silenciosos, iluminación RGB personalizable.",
                "days_ago": 4
            },
            {
                "product_name": "Hub USB-C Baseus 8 en 1 HDMI 4K PD 100W",
                "category": "Accesorios",
                "quantity": 30,
                "amount_usd": 540.00,   # $18 c/u
                "shipping_cost_usd": 30.00,
                "notes": "Cuerpo de aleación de aluminio, puertos Gigabit y lector SD.",
                "days_ago": 3
            },
        ]

        created_investments = {}
        total_seeded_investment_usd = 0.0
        total_seeded_investment_ves = 0.0

        print(f"\n[*] Registrando {len(investments_catalog)} inversiones de inventario...")
        for item in investments_catalog:
            total_cost_usd = round(item["amount_usd"] + item["shipping_cost_usd"], 2)
            unit_cost_usd = round(total_cost_usd / item["quantity"], 4)
            unit_cost_ves = round(unit_cost_usd * current_rate, 2)
            amount_ves = round(item["amount_usd"] * current_rate, 2)
            created_dt = now - timedelta(days=item["days_ago"], hours=item["days_ago"] % 5 + 1)

            inv = Investment(
                user_id=user.id,
                product_name=item["product_name"],
                category=item.get("category", "General"),
                amount_ves=amount_ves,
                bcv_rate=current_rate,
                amount_usd=item["amount_usd"],
                quantity=item["quantity"],
                shipping_cost_usd=item["shipping_cost_usd"],
                total_cost_usd=total_cost_usd,
                unit_cost_usd=unit_cost_usd,
                unit_cost_ves=unit_cost_ves,
                notes=item["notes"],
                created_at=created_dt
            )
            db.add(inv)
            db.flush()
            created_investments[item["product_name"]] = inv
            total_seeded_investment_usd += total_cost_usd
            total_seeded_investment_ves += round(total_cost_usd * current_rate, 2)
            print(f"  + Inversión: {item['product_name']} | Cant: {item['quantity']} | Costo Unit: ${unit_cost_usd:.2f} (Bs. {unit_cost_ves:,.2f})")

        db.commit()
        print(f"[OK] Inversiones creadas: {len(created_investments)} | Total: ${total_seeded_investment_usd:,.2f} USD (Bs. {total_seeded_investment_ves:,.2f} VES)")

        # 5. Generación de ventas de prueba vinculadas con ganancias
        # Distribuiremos 26 ventas:
        # - 6 ventas HOY (en distintas horas del día actual)
        # - 11 ventas en los últimos 7 días
        # - 9 ventas en los últimos 8-14 días
        # para que los filtros "today", "7d", "30d" y "this_month" muestren métricas reales.

        sales_catalog = [
            # --- VENTAS DEL DÍA DE HOY (Tasa BCV del día aplicada) ---
            {
                "product": "iPhone 15 Pro 128GB Titanium",
                "quantity": 1,
                "unit_price_usd": 1180.00,
                "payment_method": "Zelle",
                "customer_name": "Carlos Eduardo Mendoza",
                "notes": "Venta tienda principal. Cancelado vía Zelle en una sola cuota.",
                "is_today": True,
                "hour": 9,
                "minute": 30
            },
            {
                "product": "Xiaomi Redmi Note 13 Pro 256GB",
                "quantity": 2,
                "unit_price_usd": 295.00,
                "payment_method": "Pago Móvil",
                "customer_name": "Valeria Rivas",
                "notes": "Cliente regular. Pago en bolívares a tasa oficial BCV del día.",
                "is_today": True,
                "hour": 10,
                "minute": 45
            },
            {
                "product": "Audífonos Sony WH-1000XM5 ANC",
                "quantity": 1,
                "unit_price_usd": 385.00,
                "payment_method": "Binance USDT",
                "customer_name": "Alejandro Pérez",
                "notes": "Transferencia Binance Pay P2P sin comisiones.",
                "is_today": True,
                "hour": 12,
                "minute": 15
            },
            {
                "product": "Power Bank Anker 20.000mAh 22.5W",
                "quantity": 3,
                "unit_price_usd": 42.00,
                "payment_method": "Pago Móvil",
                "customer_name": "María José Castillo",
                "notes": "Facturado para empresa de eventos. Retiro en persona.",
                "is_today": True,
                "hour": 14,
                "minute": 0
            },
            {
                "product": "Hub USB-C Baseus 8 en 1 HDMI 4K PD 100W",
                "quantity": 2,
                "unit_price_usd": 35.00,
                "payment_method": "Efectivo USD",
                "customer_name": "Ricardo Blanco",
                "notes": "Billete de $100 entregado, cambio de $30 en efectivo.",
                "is_today": True,
                "hour": 15,
                "minute": 30
            },
            {
                "product": "Teclado Mecánico RGB Redragon Kumara K552",
                "quantity": 1,
                "unit_price_usd": 52.00,
                "payment_method": "Punto de Venta",
                "customer_name": "Gabriel José Morillo",
                "notes": "Tarjeta de débito nacional en punto bancario.",
                "is_today": True,
                "hour": 17,
                "minute": 10
            },

            # --- VENTAS DE LOS ÚLTIMOS 1 A 6 DÍAS ---
            {
                "product": "Monitor Gamer ASUS TUF 24\" IPS 165Hz",
                "quantity": 1,
                "unit_price_usd": 230.00,
                "payment_method": "Zelle",
                "customer_name": "David Albornoz",
                "notes": "Envío a Valencia por Tealca asegurado.",
                "days_ago": 1,
                "hour": 14
            },
            {
                "product": "Smartwatch Samsung Galaxy Watch 6 44mm",
                "quantity": 1,
                "unit_price_usd": 265.00,
                "payment_method": "Efectivo USD",
                "customer_name": "Patricia Guerrero",
                "notes": "Entregado con protector de pantalla de regalo.",
                "days_ago": 1,
                "hour": 16
            },
            {
                "product": "Xiaomi Redmi Note 13 Pro 256GB",
                "quantity": 1,
                "unit_price_usd": 300.00,
                "payment_method": "Pago Móvil",
                "customer_name": "Luis Fernando Soto",
                "notes": "Tasa BCV del día pagada puntualmente.",
                "days_ago": 2,
                "hour": 11
            },
            {
                "product": "Power Bank Anker 20.000mAh 22.5W",
                "quantity": 2,
                "unit_price_usd": 42.00,
                "payment_method": "Binance USDT",
                "customer_name": "Mariana Vielma",
                "notes": "Carga y accesorios para viaje de trabajo.",
                "days_ago": 2,
                "hour": 15
            },
            {
                "product": "iPhone 15 Pro 128GB Titanium",
                "quantity": 1,
                "unit_price_usd": 1175.00,
                "payment_method": "Efectivo USD",
                "customer_name": "Ing. Gustavo Adolfo Salazar",
                "notes": "Pago cash en tienda. Cliente VIP corporativo.",
                "days_ago": 3,
                "hour": 10
            },
            {
                "product": "Hub USB-C Baseus 8 en 1 HDMI 4K PD 100W",
                "quantity": 4,
                "unit_price_usd": 34.00,
                "payment_method": "Transferencia Bancaria",
                "customer_name": "Soluciones Creativas C.A.",
                "notes": "Transferencia Banesco jurídica a tasa BCV.",
                "days_ago": 3,
                "hour": 17
            },
            {
                "product": "Audífonos Sony WH-1000XM5 ANC",
                "quantity": 1,
                "unit_price_usd": 380.00,
                "payment_method": "Zelle",
                "customer_name": "Andrea Carolina Rojas",
                "notes": "Comprobante confirmado por el banco.",
                "days_ago": 4,
                "hour": 12
            },
            {
                "product": "Teclado Mecánico RGB Redragon Kumara K552",
                "quantity": 2,
                "unit_price_usd": 50.00,
                "payment_method": "Pago Móvil",
                "customer_name": "Enrique Barrientos",
                "notes": "Compra gamer para cyber café local.",
                "days_ago": 4,
                "hour": 18
            },
            {
                "product": "Smartwatch Samsung Galaxy Watch 6 44mm",
                "quantity": 2,
                "unit_price_usd": 260.00,
                "payment_method": "Zelle",
                "customer_name": "Dra. Carmen Teresa Flores",
                "notes": "Relojes para regalo de aniversario.",
                "days_ago": 5,
                "hour": 13
            },
            {
                "product": "Monitor Gamer ASUS TUF 24\" IPS 165Hz",
                "quantity": 1,
                "unit_price_usd": 225.00,
                "payment_method": "Pago Móvil",
                "customer_name": "Nelson Colmenares",
                "notes": "Retirado en tienda física en Caracas.",
                "days_ago": 5,
                "hour": 15
            },
            {
                "product": "Xiaomi Redmi Note 13 Pro 256GB",
                "quantity": 2,
                "unit_price_usd": 290.00,
                "payment_method": "Binance USDT",
                "customer_name": "Jesús Rafael Quintero",
                "notes": "Pago recibido en billetera USDT.",
                "days_ago": 6,
                "hour": 11
            },

            # --- VENTAS DE HACE 7 A 12 DÍAS (Histórico mensual) ---
            {
                "product": "iPhone 15 Pro 128GB Titanium",
                "quantity": 1,
                "unit_price_usd": 1190.00,
                "payment_method": "Zelle",
                "customer_name": "Francisco Javier Gil",
                "notes": "Color Titanio Natural. Activado en tienda.",
                "days_ago": 7,
                "hour": 14
            },
            {
                "product": "Power Bank Anker 20.000mAh 22.5W",
                "quantity": 4,
                "unit_price_usd": 40.00,
                "payment_method": "Pago Móvil",
                "customer_name": "Agencia Digital Caracas",
                "notes": "Baterías portátiles para equipo de filmación.",
                "days_ago": 8,
                "hour": 10
            },
            {
                "product": "Audífonos Sony WH-1000XM5 ANC",
                "quantity": 1,
                "unit_price_usd": 390.00,
                "payment_method": "Efectivo USD",
                "customer_name": "Lucía Mercedes Campos",
                "notes": "Color Silver, garantía sellada.",
                "days_ago": 8,
                "hour": 16
            },
            {
                "product": "Teclado Mecánico RGB Redragon Kumara K552",
                "quantity": 3,
                "unit_price_usd": 48.00,
                "payment_method": "Punto de Venta",
                "customer_name": "Academia Gamer Pro",
                "notes": "Pago con tarjeta Mercantil vía punto.",
                "days_ago": 9,
                "hour": 12
            },
            {
                "product": "Smartwatch Samsung Galaxy Watch 6 44mm",
                "quantity": 1,
                "unit_price_usd": 270.00,
                "payment_method": "Binance USDT",
                "customer_name": "Víctor Manuel Zambrano",
                "notes": "Venta acordada por WhatsApp.",
                "days_ago": 10,
                "hour": 11
            },
            {
                "product": "Hub USB-C Baseus 8 en 1 HDMI 4K PD 100W",
                "quantity": 5,
                "unit_price_usd": 33.00,
                "payment_method": "Pago Móvil",
                "customer_name": "Consultoría y Auditorías V&A",
                "notes": "Equipamiento para oficina administrativa.",
                "days_ago": 10,
                "hour": 17
            },
            {
                "product": "Xiaomi Redmi Note 13 Pro 256GB",
                "quantity": 1,
                "unit_price_usd": 295.00,
                "payment_method": "Efectivo USD",
                "customer_name": "Ana Victoria Medina",
                "notes": "Pago exacto en billetes limpios.",
                "days_ago": 11,
                "hour": 13
            },
            {
                "product": "Monitor Gamer ASUS TUF 24\" IPS 165Hz",
                "quantity": 1,
                "unit_price_usd": 235.00,
                "payment_method": "Zelle",
                "customer_name": "Mauricio José Bastidas",
                "notes": "Incluye cable DisplayPort adicional.",
                "days_ago": 11,
                "hour": 15
            },
            {
                "product": "Power Bank Anker 20.000mAh 22.5W",
                "quantity": 2,
                "unit_price_usd": 42.00,
                "payment_method": "Pago Móvil",
                "customer_name": "Elena Sofía Paredes",
                "notes": "Envío a Lechería por MRW.",
                "days_ago": 12,
                "hour": 9
            },
        ]

        print(f"\n[*] Registrando {len(sales_catalog)} ventas vinculadas con cálculo de ganancias...")
        total_revenue_usd = 0.0
        total_revenue_ves = 0.0
        total_cogs_usd = 0.0
        total_cogs_ves = 0.0
        total_profit_usd = 0.0
        total_profit_ves = 0.0
        total_items_sold = 0

        for s in sales_catalog:
            inv = created_investments.get(s["product"])
            if not inv:
                continue

            qty = s["quantity"]
            unit_cost_usd = inv.unit_cost_usd
            unit_price_usd = s["unit_price_usd"]
            unit_price_ves = round(unit_price_usd * current_rate, 2)

            # Cálculos financieros exactos
            total_income_usd = round(unit_price_usd * qty, 2)
            total_income_ves = round(unit_price_ves * qty, 2)
            total_cost_usd = round(unit_cost_usd * qty, 2)
            total_cost_ves = round(total_cost_usd * current_rate, 2)
            net_profit_usd = round(total_income_usd - total_cost_usd, 2)
            net_profit_ves = round(total_income_ves - total_cost_ves, 2)
            profit_margin_percent = round((net_profit_usd / total_cost_usd) * 100, 2) if total_cost_usd > 0 else 100.0

            # Determinación de fecha y hora
            if s.get("is_today"):
                sale_dt = datetime(
                    now.year, now.month, now.day,
                    s.get("hour", 12),
                    s.get("minute", 0),
                    0
                )
            elif "hours_ago" in s:
                sale_dt = now - timedelta(hours=s["hours_ago"], minutes=15)
            else:
                sale_dt = (now - timedelta(days=s["days_ago"])).replace(
                    hour=s.get("hour", 12),
                    minute=s.get("minute", 20),
                    second=0,
                    microsecond=0
                )

            sale = Sale(
                user_id=user.id,
                investment_id=inv.id,
                product_name=s["product"],
                quantity=qty,
                unit_cost_usd=unit_cost_usd,
                unit_price_usd=unit_price_usd,
                unit_price_ves=unit_price_ves,
                bcv_rate=current_rate,
                total_income_usd=total_income_usd,
                total_income_ves=total_income_ves,
                total_cost_usd=total_cost_usd,
                total_cost_ves=total_cost_ves,
                net_profit_usd=net_profit_usd,
                net_profit_ves=net_profit_ves,
                profit_margin_percent=profit_margin_percent,
                payment_method=s["payment_method"],
                customer_name=s["customer_name"],
                notes=s["notes"],
                created_at=sale_dt
            )
            db.add(sale)

            total_revenue_usd += total_income_usd
            total_revenue_ves += total_income_ves
            total_cogs_usd += total_cost_usd
            total_cogs_ves += total_cost_ves
            total_profit_usd += net_profit_usd
            total_profit_ves += net_profit_ves
            total_items_sold += qty

        db.commit()

        avg_margin = round((total_profit_usd / total_cogs_usd * 100), 2) if total_cogs_usd > 0 else 0.0

        print("\n" + "="*65)
        print("   SEEDER DE DATOS DE PRUEBA EJECUTADO EXITOSAMENTE")
        print("="*65)
        print(f"  * Usuario Destino:        {user.full_name} ({user.email})")
        print(f"  * Tasa BCV Utilizada:     {current_rate:.2f} VES/USD (Referencia Hoy)")
        print(f"  * Inversiones Creadas:    {len(created_investments)} lotes de productos")
        print(f"  * Total Invertido:        ${total_seeded_investment_usd:,.2f} USD (Bs. {total_seeded_investment_ves:,.2f} VES)")
        print(f"  * Ventas Registradas:     {len(sales_catalog)} transacciones ({total_items_sold} unidades)")
        print(f"  * Total Ingresos Ventas:  ${total_revenue_usd:,.2f} USD (Bs. {total_revenue_ves:,.2f} VES)")
        print(f"  * Costo de lo Vendido:    ${total_cogs_usd:,.2f} USD (Bs. {total_cogs_ves:,.2f} VES)")
        print(f"  * Ganancia Neta:          +${total_profit_usd:,.2f} USD (+Bs. {total_profit_ves:,.2f} VES)")
        print(f"  * Margen Medio (Markup):  {avg_margin:.2f}% de rentabilidad")
        print("="*65 + "\n")

        return True

    except Exception as e:
        db.rollback()
        print(f"[!] ERROR al ejecutar el seeder de prueba: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        if close_db:
            db.close()

if __name__ == "__main__":
    success = seed_test_data()
    sys.exit(0 if success else 1)
