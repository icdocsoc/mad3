import json
import random

from allocator.models import Family, Fresher

import requests


SEED = 12345
LOCAL_URL = "http://localhost:3000/"
MAX_CHILDREN = 4
ITERATIONS = 1000

random.seed(555)


def dummy_allocate(families, freshers, debug=False):

    leftovers = []

    # Try fullfill BOTH female and JMC constraints

    freshers.sort(key=lambda x: x.constraint_type())

    for fresher in freshers:
        if fresher.female and fresher.jmc:
            valid_families = [f for f in families
                              if f.hasJmc and f.hasFemale
                              and f.no_of_kids < MAX_CHILDREN]
        elif fresher.female:
            valid_families = [f for f in families
                              if f.hasFemale
                              and f.no_of_kids < MAX_CHILDREN]
        elif fresher.jmc:
            valid_families = [f for f in families
                              if f.hasJmc
                              and f.no_of_kids < MAX_CHILDREN]
        else:
            valid_families = [f for f in families
                              if f.no_of_kids < MAX_CHILDREN]

        if valid_families == []:
            leftovers.append(fresher)
        else:
            family = random.choice(valid_families)
            family.unallocated_kids.append(fresher)

    # For JMC Females, see if we can fulfill at least ONE constraint

    for fresher in [f for f in leftovers if f.female and f.jmc]:

        # JMC constraint first
        valid_families = [f for f in families
                          if f.hasJmc
                          and f.no_of_kids < MAX_CHILDREN]
        if valid_families:
            family = random.choice(valid_families)
            family.unallocated_kids.append(fresher)
            leftovers.remove(fresher)
            continue

        # Female constraint second
        valid_families = [f for f in families
                          if f.hasFemale
                          and f.no_of_kids < MAX_CHILDREN]
        if valid_families:
            family = random.choice(valid_families)
            family.unallocated_kids.append(fresher)
            leftovers.remove(fresher)
            continue

    families.sort(key=lambda x: x.no_of_kids)
    for fresher, family in zip(leftovers, families):
            family.unallocated_kids.append(fresher)


def transferrable(kid, current_family, potential_family,
                  max_children=MAX_CHILDREN):

    if constraints_violation(kid, potential_family):
        return False

    # Look at swap potential
    for swappable in potential_family.unallocated_kids:
        if constraints_violation(swappable, current_family):
            continue
        if current_family.score(addition=swappable, removal=kid) \
                + potential_family.score(addition=kid, removal=swappable) < \
                current_family.score() + potential_family.score():
            return swappable
        # Perform the swap and break

    if potential_family.no_of_kids < max_children:
        # Possible to transfer only
        if current_family.score(removal=kid) \
                + potential_family.score(addition=kid) \
                < current_family.score() + potential_family.score():
            return True

    return False


def constraints_violation(kid, family):
    if kid.female and not family.hasFemale:
        return True
    elif kid.jmc and not family.hasJmc:
        return True
    else:
        return False


def swaps_and_transfers(families, debug=False):
    iterations = 0
    no_swaps = 0
    while True and iterations < ITERATIONS:
        # Sort families by score, and then start with lowest score family
        swapped = False
        families.sort(key=lambda x: x.score())
        for family_index in range(1, len(families)):
            current_family = families[-family_index]
            if debug:
                print(current_family.score())
            for kid in current_family.unallocated_kids:
                for potential_family in \
                        [x for x in families if x is not current_family]:
                    transfer = transferrable(kid,
                                             current_family,
                                             potential_family)
                    if transfer:  # Do the swap/transfer and then break

                        if debug:
                            print("Swap has been deemed appropriate")

                        if transfer is True:  # One way transfer:
                            if debug:
                                print("Transferring {}".format(kid))
                            potential_family.add_kid(kid)
                            current_family.remove_kid(kid)
                        elif isinstance(transfer, Fresher):  # Swap
                            if debug:
                                print("Swapping {} and {}".format(
                                    kid, transfer))
                                print("Between families {} and {}".format(
                                    current_family.kids,
                                    potential_family.kids))
                            potential_family.add_kid(kid)
                            current_family.remove_kid(kid)
                            potential_family.remove_kid(transfer)
                            current_family.add_kid(transfer)
                        swapped = True
                        no_swaps += 1
                        break

        iterations += 1

        if not swapped:
            break

    print("Finished swaps after " +
          "{} iterations and {} swaps".format(iterations, no_swaps))


def _family_stats(families):

    f_0 = [f for f in families if len(f.kids) == 0]
    f_1 = [f for f in families if len(f.kids) == 1]
    f_2 = [f for f in families if len(f.kids) == 2]
    f_3 = [f for f in families if len(f.kids) == 3]
    f_4 = [f for f in families if len(f.kids) == 4]
    f_5 = [f for f in families if len(f.kids) == 5]

    for f, no in [(f_0, 0),
                  (f_1, 1),
                  (f_2, 2),
                  (f_3, 3),
                  (f_4, 4),
                  (f_5, 5)]:
        if f:
            print("Number of families with {} kids: {}".format(no, len(f)))


def pre_stats(freshers, families):

    total = len(freshers)
    females = len([f for f in freshers if f.female])
    jmc = len([f for f in freshers if f.jmc])
    jmc_and_female = len([f for f in freshers if f.female and f.jmc])

    total_families = len(families)
    female_families = len([f for f in families if f.hasFemale])
    jmc_families = len([f for f in families if f.hasJmc])
    jmc_female_families = len([f for f in families
                               if f.hasFemale and f.hasJmc])

    print("Freshers stats:")
    print("JMC Freshers: {}".format(jmc))
    print("Female Freshers: {}".format(females))
    print("JMC and Female Freshers: {}".format(jmc_and_female))
    print("All Freshers: {}".format(total))
    print()
    print("Family stats:")
    print("JMC Families: {}".format(jmc_families))
    print("Female Families: {}".format(female_families))
    print("JMC and Female Families: {}".format(jmc_female_families))
    print("All Families: {}".format(total_families))

    _family_stats(families)


def post_stats(all_families):

    families = [f for f in all_families if f.unallocated_kids != []]

    scores = [f.score() for f in families]

    print("\nFINAL SCORES:")
    for family, score in zip(families, scores):
        print("{}: {}".format(family, score))

    if families:
        print("\nAVERAGE SCORE: {}".format(sum(scores) / len(scores)))

    violations = [f for f in families if f.violates_constraints()]

    print("\nVIOLATIONS:")
    print("  NUMBER OF VIOLATIONS: {}".format(len(violations)))
    for v in violations:
        print("  {}:  {}".format(v, v.violators()))

    _family_stats(all_families)


def allocations_request(families, url=LOCAL_URL):
    allocations = []
    for family in families:
        for kid in family.unallocated_kids:
            allocations.append({
                "fresher": kid.id,
                "family": family.id
            })

    return allocations


def allocate(auth, dry=True, url=LOCAL_URL, debug=False, max_children=MAX_CHILDREN):
    cookies = {"Authorization": auth}
    families = requests.get(url + "api/admin/allocations/all-families", cookies=cookies)
    freshers = requests.get(url + "api/admin/allocations/all-unallocated-freshers", cookies=cookies)

    if debug:
        print(json.dumps(families.json(), indent=4))
        print(json.dumps(freshers.json(), indent=4))

    families = [Family(family) for family in families.json()]
    freshers = [Fresher(fresher) for fresher in freshers.json()]

    # Pre Allocation Stats
    pre_stats(freshers, families)

    # Blind dummy allocations
    dummy_allocate(families, freshers, debug=debug)

    if debug:
        for family in families:
            print(family)

    # Swaps and transfers need to occur here
    swaps_and_transfers(families, debug=debug)

    # Post Allocation Stats
    post_stats(families)

    # Ask confirmation

    if input("Would you like allocate as per the above? (y/n) ") == 'y':
        # Construct allocations request to backend
        req = allocations_request(families, url=url)
        response = requests.post(url + "api/admin/allocations", json=req, cookies=cookies)
        print(response)
    else:
        print("Allocation cancelled")
