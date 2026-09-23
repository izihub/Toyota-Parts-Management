"""Run with: python -m api.smoke_test"""

from pathlib import Path

from . import database
from .catalog import add_catalog, CatalogRequest, Fitment
from .logistics import reserve, WarehouseRequest
from .main import (
    FulfillmentLine, FulfillmentRequest, OrderLine, OrderRequest,
    StockEntry, WorkshopRequest, add_stock, add_workshop,
    create_fulfillment, create_order, list_fulfillment, list_orders,
    list_stock, list_workshops, update_fulfillment,
)


def main() -> None:
    original_path = database.DATABASE_PATH
    database.DATABASE_PATH = Path(__file__).with_name(".smoke.db")
    try:
        database.DATABASE_PATH.unlink(missing_ok=True)
        database.init_database()
        add_stock([StockEntry(vehicle_model="Aqua", make_year=2013, part_name="Front bumper", quantity=4)])
        assert list_stock()[0]["quantity"] == 4
        order = create_order(OrderRequest(lines=[OrderLine(supplier="Toyota", vehicle="Aqua 2013", part="Front bumper", quantity=2, unit_price=100)]))
        assert list_orders()[0]["order_number"] == order["order_number"]
        add_workshop(WorkshopRequest(name="Workshop 1", organization="Toyota"))
        assert list_workshops()[0]["name"] == "Workshop 1"
        add_catalog(CatalogRequest(sku="SMOKE", part_name="Front bumper", display_name="Front bumper", fitments=[Fitment(model="Aqua", make_year=2013)]))
        add_stock([StockEntry(sku="SMOKE", vehicle_model="Aqua", make_year=2013, part_name="Front bumper", quantity=4)])
        fulfillment = create_fulfillment(FulfillmentRequest(workshop_name="Workshop 1", parts=[FulfillmentLine(part_name="Front bumper", sku="SMOKE", vehicle_model="Aqua", make_year=2013, quantity=2)]))
        assert list_fulfillment()[0]["id"] == fulfillment["id"]
        reserve(int(fulfillment["id"].split("-")[1]), WarehouseRequest(warehouse_name="Main Warehouse"))
        update_fulfillment(int(fulfillment["id"].split("-")[1]), "IN TRANSIT")
        assert list_fulfillment()[0]["status"] == "IN TRANSIT"
    finally:
        database.DATABASE_PATH.unlink(missing_ok=True)
        database.DATABASE_PATH = original_path
    print("API persistence smoke test passed")


if __name__ == "__main__":
    main()
