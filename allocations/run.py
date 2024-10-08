import os
from allocator.allocate import allocate
from dotenv import load_dotenv

load_dotenv('../.env');

BASE_URL = os.getenv('BASE_URL')

authCookie = input("Please insert your auth cookie:\nThis will only be saved in memory to do the allocations.\nSee the README if you're unsure how to get this.\n")
allocate(authCookie, url=BASE_URL)
