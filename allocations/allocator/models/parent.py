from allocator.models.student import Student

import numpy as np


class Parent:

    def __init__(self, data):
        self.id = data['_id']
        self.student = Student(data['student'])

        self._interests = data['interests']

        self.family = data['family']

    # def to_dict(self):
    #     interests_dict = self.interests.copy()
    #     interests_dict["shortcode"] = self.student.shortcode

    #     return interests_dict

    @property
    def interests(self):
        return np.fromiter(self._interests.values(), dtype=float)

    def __repr__(self):
        return "Parent(" + str(self.student) + ")"
