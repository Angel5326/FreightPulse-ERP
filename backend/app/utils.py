 
import random
from datetime import datetime

def generate_shipment_number():
    year = datetime.now().year
    seq = str(random.randint(1000, 9999)).zfill(4)
    return f"SHP-{year}-{seq}"