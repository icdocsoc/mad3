export const surveyQuestions: SurveyQuestions = {
  preferredName: {
    type: 'text',
    title: 'Preferred Name: ',
    required: true
  },
  interests: {
    type: 'matrix',
    title: 'Interests: ',
    columns: {
      'No interest': 0,
      'Mild interest': 1,
      'Strong interest': 2
    },
    rows: {
      alcohol: 'Alcohol - Drinking',
      anime: 'Anime',
      artGraphics: 'Art/Graphics',
      baking: 'Baking',
      tabletopGames: 'Board/Tabletop Games',
      charity: 'Charity',
      clubbing: 'Clubbing',
      cooking: 'Cooking',
      danceBallroom: 'Dance - Salsa, Ballroom, other partnered dances',
      danceContemporary: 'Dance - Hip hop, urban other contemporary dances',
      dramatics: 'Dramatics - Drama or Musical Theatre',
      film: 'Film and Cinematography',
      finance: 'Finance and Entrepreneurship',
      exerciseAndHeath: 'Fitness and Health',
      hiking: 'Hiking',
      kpop: 'K-pop',
      martialArts: 'Martial Arts and Self Defence',
      performingMusicPopRockJazz: 'Performing Music - Pop, Rock, Jazz',
      performingMusicClassical: 'Performing Music - Classical, Chamber',
      photography: 'Photography',
      politics: 'Politics',
      videoGames: 'Video Games',
      football: 'Football (the British one!)',
      rugby: 'Rugby',
      rowing: 'Rowing',
      racketSports: 'Racket Sports - Tennis, Badminton, other racket sports',
      otherSports: 'Other Sports'
    },
    required: true
  },
  selfDescription: {
    type: 'textarea',
    title:
      "If you'd like to write a few words to introduce yourself to the rest of your family, here's your chance. Your family will see this once the families have been assigned."
  },
  socialMedia: {
    type: 'array',
    title:
      'Social Media links so other family members can contact you prior to the first social.',
    schema: {
      type: 'text',
      title: 'Link: '
    }
  },
  gender: {
    type: 'select',
    title: 'Gender: ',
    required: true,
    options: {
      male: 'Male',
      female: 'Female',
      other: 'Other',
      na: 'Prefer not to say'
    }
  },
  course: {
    type: 'select',
    title: 'Gender: ',
    required: true,
    options: {
      computing: 'Computing',
      jmc: 'JMC'
    }
  }
};
