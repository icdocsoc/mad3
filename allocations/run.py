from allocator.allocate import allocate

authCookie = input("Please insert your auth cookie:\nThis will only be saved in memory to do the allocations.\n")
allocate(authCookie, url="https://family.docsoc.co.uk")
