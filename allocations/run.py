from allocator.allocate import allocate

authCookie = input("Please insert your auth cookie:\nThis will only be saved in memory to do the allocations.\nSee the README if you're unsure how to get this.\n")
allocate(authCookie, url="https://family.docsoc.co.uk")
