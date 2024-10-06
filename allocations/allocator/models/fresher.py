from allocator.models.student import Student

import numpy as np


class Fresher:

    def __init__(self, data):

        self.id = data['_id']
        self.student = Student(data['student'])
        self.jmc = self.student.course == 'JMC'
        self.female = self.student.gender == 'Female'

        self._interests = data['interests']

        self.family = data['family'] if 'family' in data.keys() else None

    def constraint_type(self):
        if self.jmc and self.female:
            return 0
        elif self.female:
            return 1
        elif self.jmc:
            return 2
        else:
            return 3

    @property
    def interests(self):
        return np.fromiter(self._interests.values(), dtype=float)

    def __repr__(self):
        return "Fresher(" + str(self.student) + ")"
