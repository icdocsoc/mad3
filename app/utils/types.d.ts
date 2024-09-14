declare interface IStudent {
  firstName: string;
  lastName: string;
  shortcode: string;
  preferredName?: string;
  selfDescription?: string;
  socialMedia?: string;
}

declare type SurveyQuestions = Record<string, SurveyQuestionType>;

declare type SurveyQuestionType = (
  | {
      type: 'text';
      placeholder?: string;
    }
  | {
      type: 'matrix';
      columns: Record<string, number>;
      rows: Record<string, string>;
    }
  | {
      type: 'textarea';
    }
  | {
      type: 'array';
      schema: SurveyQuestionType;
    }
  | {
      type: 'select';
      options: Record<string, string>;
    }
) & { required?: boolean; title: string };
