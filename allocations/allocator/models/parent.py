from allocator.models.student import Student

import numpy as np


class Parent:

    def __init__(self, data):
        self.id = data['_id']
        self.student = Student(data['student'])

        self._interests = data['interests']
        if data['interests'] == None: self._interests = {'alcohol': 1, 'anime': 0, 'artGraphics': 0, 'baking': 0, 'charity': 0, 'clubbing': 0, 'cooking': 0, 'danceBallroom': 1, 'danceContemporary': 0, 'dramatics': 1, 'exerciseAndHealth': 1, 'film': 1, 'finance': 2, 'football': 0, 'hiking': 0, 'kpop': 0, 'martialArts': 0, 'otherSports': 0, 'performingMusicClassical': 1, 'performingMusicPopRockJazz': 2, 'photography': 0, 'politics': 1, 'racketSports': 0, 'rowing': 0, 'rugby': 0, 'tabletopGames': 1, 'videoGames': 0}

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
