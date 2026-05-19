import asyncio
import io
import sys
from io import BytesIO

# Add backend to path
sys.path.append("/Users/ihemanthm/Documents/Development/pulseCheck/backend")

from app.services.csv_processor import CSVProcessor

csv_content = b"""invoice_number,sku,product_name,customer_name,customer_phone,purchase_date,amount_paid,purchase_mode,brand,purchase_qty
INV-20260501-011,SKU-APL-MACBOOKM5,Apple macbook M5 Air,Hemanth Kumar,+86886414210,01/05/2026,119900,offline,Apple,1
"""

def test():
    file_obj = BytesIO(csv_content)
    result = CSVProcessor.parse(file_obj)
    for row in result['parsed_rows']:
        print("purchase_date type:", type(row['purchase_date']), row['purchase_date'])
        print("amount_paid type:", type(row['amount_paid']), row['amount_paid'])

if __name__ == "__main__":
    test()
