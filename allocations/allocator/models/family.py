from itertools import combinations, product

from allocator.models.fresher import Fresher
from allocator.models.parent import Parent

import numpy as np

NO_OF_HOBBIES = 27

AVERAGE_DISTANCE_IN_N_DIMENSIONAL_SPACE = 4.2


class Family:

    def __init__(self, data):

        self.parents = [
            Parent(data['parents']['proposerId']),
            Parent(data['parents']['proposeeId'])
        ]

        self.id = data['_id']

        self.allocated_kids = [Fresher(f) for f in data['kids']]
        self.unallocated_kids = []
        self.hasFemale = data['hasFemale']
        self.hasJmc = data['hasJmc']
        self.children_score = 1000
        self.parent_score = 1000
        self.children_mean = np.zeros(NO_OF_HOBBIES)
        self.parent_mean = np.zeros(NO_OF_HOBBIES)
        self._score = 1000
        self._score_change = True

    def _score_children(self, all_kids, save=True):

        if len(all_kids) <= 1:
            return AVERAGE_DISTANCE_IN_N_DIMENSIONAL_SPACE

        pairs = combinations(all_kids, 2)
        vectors = [list(map(lambda x: x.interests, pair)) for pair in pairs]
        distances = [np.linalg.norm(pair[0] - pair[1])
                     for pair in vectors]

        children_score = \
            sum([distance ** 2 for
                 distance in distances]) / len(distances)

        if save:
            self.children_score = children_score

        return children_score

    def _score_parents(self, all_kids, save=True):
        if not all_kids:
            return 1000
        pairs = product(self.parents, all_kids)
        vectors = [list(map(lambda x: x.interests, pair)) for pair in pairs]
        distances = [np.linalg.norm(pair[0] - pair[1])
                     for pair in vectors]
        parent_score = \
            sum([distance ** 2 for
                 distance in distances]) / len(distances)

        if save:
            self.parent_score = parent_score

        return parent_score

    def score(self, addition=None, removal=None):

        if not self._score_change and addition is None \
                and removal is None:
            return self._score

        unalloc = self.unallocated_kids.copy()
        if removal:
            unalloc.remove(removal)

        all_kids = self.allocated_kids.copy() + unalloc

        if addition:
            all_kids.append(addition)

        if addition is None and removal is None:
            self._score = self._score_children(all_kids) \
                + self._score_parents(all_kids) \
                + self.punish_violations()
            self._score_change = False
            return self._score
        else:
            return self._score_children(all_kids, save=False) \
                + self._score_parents(all_kids, save=False) \
                + self.punish_violations()

    def remove_kid(self, removal):
        self.unallocated_kids.remove(removal)
        self._score_change = True

    def add_kid(self, addition):
        self.unallocated_kids.append(addition)
        self._score_change = True

    def calculate_parent_mean(self):
        self.parent_mean = np.mean(
            self.parents.proposerId.interests_vector(),
            self.parents.proposeeId.interests_vector()
        )
        return self.parent_mean

    def calculate_children_mean(self):
        self.children_mean = np.mean(
            list(map(lambda x: x.interests,
                     self.allocated_kids + self.unallocated_kids)))
        return self.children_mean

    def sort_children(self):
        self.allocated_kids.sort(
            key=lambda x: np.linalg.norm(x.interests - self.children_mean))

    def violates_constraints(self):
        for kid in self.unallocated_kids:
            if kid.female and not self.hasFemale:
                return True
            elif kid.jmc and not self.hasJmc:
                return True
        return False

    def punish_violations(self):
        score = 0
        for kid in self.unallocated_kids:
            if kid.female and not self.hasFemale:
                score += 50
            elif kid.jmc and not self.hasJmc:
                score += 10
        return score

    def violators(self):
        violators = []
        for kid in self.unallocated_kids:
            if kid.female and not self.hasFemale:
                violators.append((kid, "Female"))
            elif kid.jmc and not self.hasJmc:
                violators.append((kid, "JMC"))
        return violators

    @property
    def kids(self):
        return self.unallocated_kids.copy() + self.allocated_kids.copy()

    @property
    def no_of_kids(self):
        return len(self.allocated_kids + self.unallocated_kids)

    def __repr__(self):
        kids_string = ""
        for kid in self.allocated_kids + self.unallocated_kids:
            kids_string += str(kid) + ","
        return "Family(Parents=[{}], Kids=[{}])".format(
            self.parents, kids_string
        )
