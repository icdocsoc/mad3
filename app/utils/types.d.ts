
declare interface IStudent {
  shortcode: string;
  name: string | null;
  jmc: boolean;
  role: "fresher" | "parent";
  completedSurvey: boolean;
  gender: "male" | "female" | "other" | "n/a" | null;
  interests: Map<string, 0 | 1 | 2>[] | null;
  socials: string[] | null;
  aboutMe: string | null;
}
