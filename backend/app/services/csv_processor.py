import pandas as pd
from io import BytesIO
from typing import List, Dict, Tuple, Optional
from datetime import datetime
from decimal import Decimal, InvalidOperation
import json
from app.utils.phone import validate_phone, normalize_phone
from app.utils.logger import get_logger
from app.utils.errors import InvalidPhoneError, CSVParseError

logger = get_logger(__name__)

REQUIRED_COLUMNS = {
    'invoice_number', 'sku', 'product_name', 'customer_name',
    'customer_phone', 'purchase_date', 'amount_paid', 'purchase_mode',
    'brand', 'purchase_qty'
}


class CSVProcessor:
    """Service for parsing and validating CSV files"""
    
    @staticmethod
    def parse_date(date_str: str) -> Optional[datetime.date]:
        """
        Parse date string in multiple formats.
        
        Supports:
        - DD/MM/YYYY
        - DD-MM-YYYY
        - YYYY-MM-DD
        - MM/DD/YYYY
        """
        if not date_str or pd.isna(date_str):
            return None
        
        date_str = str(date_str).strip()
        
        # List of date formats to try
        date_formats = [
            '%d/%m/%Y',    # DD/MM/YYYY
            '%d-%m-%Y',    # DD-MM-YYYY
            '%Y-%m-%d',    # YYYY-MM-DD
            '%m/%d/%Y',    # MM/DD/YYYY
            '%Y/%m/%d',    # YYYY/MM/DD
            '%d.%m.%Y',    # DD.MM.YYYY
            '%d/%m/%y',    # DD/MM/YY (two digit year)
        ]
        
        for date_format in date_formats:
            try:
                parsed_date = datetime.strptime(date_str, date_format)
                return parsed_date.date()
            except ValueError:
                continue
        
        # If no format matched, raise error
        raise ValueError(f"Unable to parse date: {date_str}. Supported formats: DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY")
    
    @staticmethod
    def parse_amount(amount_str) -> Optional[Decimal]:
        """
        Parse amount string, handling commas and other formatting.
        
        Examples:
        - "1000.00" → Decimal("1000.00")
        - "1,000.00" → Decimal("1000.00")
        - "1000" → Decimal("1000.00")
        - "1,19,900" → Decimal("119900.00") (Indian numbering)
        """
        if amount_str is None or pd.isna(amount_str):
            return None
        
        amount_str = str(amount_str).strip()
        
        if not amount_str or amount_str.lower() == 'null':
            return None
        
        try:
            # Remove commas
            amount_str = amount_str.replace(',', '')
            
            # Convert to Decimal
            amount = Decimal(amount_str)
            
            # Ensure 2 decimal places
            return amount.quantize(Decimal('0.01'))
        except (InvalidOperation, ValueError) as e:
            raise ValueError(f"Invalid amount format: {amount_str}. Error: {str(e)}")
    
    @staticmethod
    def parse_quantity(qty_str) -> Optional[int]:
        """Parse quantity as integer."""
        if qty_str is None or pd.isna(qty_str):
            return None
        
        qty_str = str(qty_str).strip()
        
        if not qty_str or qty_str.lower() == 'null':
            return None
        
        try:
            # Convert to float first (in case it has decimal), then to int
            qty_float = float(qty_str)
            qty_int = int(qty_float)
            return qty_int
        except (ValueError, TypeError) as e:
            raise ValueError(f"Invalid quantity format: {qty_str}. Error: {str(e)}")
    
    @staticmethod
    def parse(file_obj: BytesIO) -> Dict:
        """
        Parse CSV file and extract data.
        
        Args:
            file_obj: File-like object containing CSV data
        
        Returns:
            Dict with parsed_rows, errors, and field_mapping
        
        Raises:
            CSVParseError: If CSV parsing fails
        """
        try:
            # Read CSV with flexible column naming
            df = pd.read_csv(file_obj, dtype=str)  # Read all as strings first
            
            # Normalize column names (lowercase, strip whitespace)
            df.columns = df.columns.str.strip().str.lower()
            
            parsed_rows = []
            errors = []
            
            for idx, row in df.iterrows():
                try:
                    # Convert row to dict
                    row_data = row.to_dict()
                    
                    # Handle NaN values - replace with None
                    for key in row_data:
                        val = row_data[key]
                        if pd.isna(val) or str(val).strip().lower() in ('', 'null', 'nan', 'none'):
                            row_data[key] = None
                    
                    # Validate required columns exist
                    missing_cols = REQUIRED_COLUMNS - set(row_data.keys())
                    if missing_cols:
                        errors.append({
                            "row": idx + 2,  # +2 for header and 0-based indexing
                            "error": f"Missing columns: {', '.join(missing_cols)}"
                        })
                        continue
                    
                    # Validate invoice number
                    if not row_data.get('invoice_number'):
                        errors.append({
                            "row": idx + 2,
                            "error": "Invoice number is required"
                        })
                        continue
                    
                    row_data['invoice_number'] = str(row_data['invoice_number']).strip()
                    
                    # Validate and normalize phone
                    if not row_data.get('customer_phone'):
                        errors.append({
                            "row": idx + 2,
                            "invoice": row_data.get('invoice_number', 'N/A'),
                            "error": "Phone number is required"
                        })
                        continue
                    
                    try:
                        normalized_phone = normalize_phone(str(row_data['customer_phone']))
                        row_data['customer_phone'] = normalized_phone
                    except InvalidPhoneError as e:
                        errors.append({
                            "row": idx + 2,
                            "invoice": row_data.get('invoice_number', 'N/A'),
                            "error": f"Invalid phone: {str(e)}"
                        })
                        continue
                    
                    # Parse and validate purchase_date
                    try:
                        parsed_date = CSVProcessor.parse_date(row_data['purchase_date'])
                        row_data['purchase_date'] = parsed_date
                    except ValueError as e:
                        errors.append({
                            "row": idx + 2,
                            "invoice": row_data.get('invoice_number', 'N/A'),
                            "error": f"Invalid date: {str(e)}"
                        })
                        continue
                    
                    # Parse and validate amount_paid
                    try:
                        parsed_amount = CSVProcessor.parse_amount(row_data['amount_paid'])
                        row_data['amount_paid'] = parsed_amount
                    except ValueError as e:
                        errors.append({
                            "row": idx + 2,
                            "invoice": row_data.get('invoice_number', 'N/A'),
                            "error": f"Invalid amount: {str(e)}"
                        })
                        continue
                    
                    # Parse and validate purchase_qty
                    try:
                        parsed_qty = CSVProcessor.parse_quantity(row_data['purchase_qty'])
                        row_data['purchase_qty'] = parsed_qty
                    except ValueError as e:
                        errors.append({
                            "row": idx + 2,
                            "invoice": row_data.get('invoice_number', 'N/A'),
                            "error": f"Invalid quantity: {str(e)}"
                        })
                        continue
                    
                    # Clean up string fields
                    row_data['sku'] = str(row_data['sku']).strip() if row_data.get('sku') else None
                    row_data['product_name'] = str(row_data['product_name']).strip() if row_data.get('product_name') else None
                    row_data['customer_name'] = str(row_data['customer_name']).strip() if row_data.get('customer_name') else None
                    row_data['purchase_mode'] = str(row_data['purchase_mode']).strip() if row_data.get('purchase_mode') else None
                    row_data['brand'] = str(row_data['brand']).strip() if row_data.get('brand') else None
                    
                    # Extract known fields and pack extras
                    extracted_row = {}
                    extra_fields = {}
                    
                    for key, value in row_data.items():
                        # Use strictly the parsed values for known columns
                        if key in REQUIRED_COLUMNS:
                            extracted_row[key] = row_data[key]
                        else:
                            # Only include extra fields if they have values
                            if value is not None:
                                extra_fields[key] = value
                    
                    # Store extra fields as JSON (only if not empty)
                    if extra_fields:
                        extracted_row['extra_fields'] = json.dumps(extra_fields)
                    else:
                        extracted_row['extra_fields'] = None
                    
                    parsed_rows.append(extracted_row)
                
                except Exception as e:
                    logger.error(
                        "csv_row_parse_error",
                        row=idx + 2,
                        error=str(e)
                    )
                    errors.append({
                        "row": idx + 2,
                        "invoice": row_data.get('invoice_number', 'N/A') if 'row_data' in locals() else 'N/A',
                        "error": f"Failed to parse row: {str(e)}"
                    })
            
            logger.info(
                "csv_parsed",
                total_rows=len(df),
                valid_rows=len(parsed_rows),
                error_rows=len(errors)
            )
            
            return {
                "parsed_rows": parsed_rows,
                "errors": errors,
                "field_mapping": list(df.columns)
            }
        
        except pd.errors.ParserError as e:
            logger.error("csv_parse_error", error=str(e))
            raise CSVParseError(f"Invalid CSV format: {str(e)}")
        except Exception as e:
            logger.error("csv_parsing_exception", error=str(e))
            raise CSVParseError(f"Error parsing CSV: {str(e)}")
    
    @staticmethod
    async def check_duplicates(
        invoice_numbers: List[str],
        db_session
    ) -> Tuple[List[str], List[str]]:
        """
        Check for duplicate invoice numbers in database.
        
        Args:
            invoice_numbers: List of invoice numbers to check
            db_session: Database session
        
        Returns:
            Tuple of (existing_invoices, new_invoices)
        """
        from sqlalchemy import select
        from app.models import Order
        
        # Query existing invoices
        stmt = select(Order.invoice_number).where(
            Order.invoice_number.in_(invoice_numbers)
        )
        result = await db_session.execute(stmt)
        existing = set(row[0] for row in result)
        
        new_invoices = [inv for inv in invoice_numbers if inv not in existing]
        existing_invoices = list(existing)
        
        if existing_invoices:
            logger.info(
                "duplicate_invoices_found",
                count=len(existing_invoices),
                invoices=existing_invoices[:5]  # Log first 5
            )
        
        return existing_invoices, new_invoices
