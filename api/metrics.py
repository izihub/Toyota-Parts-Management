"""All-time operational counts. Prediction occurrences are not unit forecasts."""
from fastapi import APIRouter
from .database import get_connection

router = APIRouter(prefix='/api')


@router.get('/metrics')
def metrics():
    with get_connection() as connection:
        connection.execute('BEGIN')
        def scalar(sql):
            return connection.execute(sql).fetchone()[0]
        total = scalar('SELECT COUNT(*) FROM fulfillment_orders')
        delivered = scalar("SELECT COUNT(*) FROM fulfillment_orders WHERE status = 'FULFILLED'")
        on_hand = scalar('SELECT COALESCE(SUM(quantity), 0) FROM catalog_inventory')
        reserved = scalar('SELECT COALESCE(SUM(quantity), 0) FROM stock_reservations')
        return {
            'scope': 'All warehouses, all time',
            'as_of': scalar("SELECT strftime('%Y-%m-%dT%H:%M:%SZ', 'now')"),
            'pending_claims': scalar("SELECT COUNT(*) FROM claims WHERE status = 'PENDING'"),
            'unreviewed_predictions': scalar('SELECT COUNT(*) FROM claim_predictions WHERE human_action IS NULL'),
            'approved_predictions': scalar("SELECT COUNT(*) FROM claim_predictions WHERE human_action = 'APPROVED'"),
            'catalog_on_hand': on_hand, 'reserved_units': reserved, 'available_units': on_hand - reserved,
            'legacy_units': scalar('SELECT COALESCE(SUM(quantity), 0) FROM inventory'),
            'pending_orders': scalar("SELECT COUNT(*) FROM fulfillment_orders WHERE status = 'PENDING'"),
            'in_transit_orders': scalar("SELECT COUNT(*) FROM fulfillment_orders WHERE status = 'IN TRANSIT'"),
            'delivered_orders': delivered, 'total_orders': total,
            'delivery_rate': round(delivered * 100 / total, 1) if total else None,
            'workshops': [dict(row) for row in connection.execute("""
                SELECT w.name, COUNT(f.id) AS total,
                  COALESCE(SUM(f.status = 'PENDING'), 0) AS pending,
                  COALESCE(SUM(f.status = 'IN TRANSIT'), 0) AS in_transit,
                  COALESCE(SUM(f.status = 'FULFILLED'), 0) AS delivered
                FROM workshops w LEFT JOIN fulfillment_orders f ON f.workshop_id = w.id
                GROUP BY w.id ORDER BY w.name""")],
        }
