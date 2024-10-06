class Student:

    def __init__(self, data):

        self.firstName = data['firstName'] if data['firstName'] != None else 'loser'
        self.lastName = data['lastName']
        self.preferredName = data['preferredName']
        self.gender = data['gender']
        self.shortcode = data['shortcode']
        self.course = data['course']
        self.socialMedia = data['socialMedia']

    def __str__(self):
        return self.firstName + " " + self.lastName
