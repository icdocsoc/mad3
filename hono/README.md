# DoCSoc MaDs Backend

## API Reference

> Note that where 400 indicates multiple errors, a relevant error message will be returned by the backend.

# **middleware**

## `grantAccessTo`

**403** - No access to route, based on role stored in JWT.

## `requireState`

**403** - Cannot access page in current state.

# **/auth**

## `POST /signIn` - unauthenticated

**302** - Redirects to Microsoft Auth sign in

## `POST /signOut` - authenticated

**200** - Clears JWT cookie from browser (signs out)

## `POST /callback` - unauthenticated

**400** - Microsoft auth error, user has no shortcode, or user has no entry year.

**403** - Not a Computing student.

**500** - State mismatch or Microsoft auth error - was logged internally.

**200** - Succesful log in. Sets JWT cookie and returns JSON.

```ts
type Reponse = {
  user_is: 'parent' | 'fresher';
  done_survey: boolean;
};
```

## `GET /details` - authenticated

**200** - Mainly a testing route. Decodes JWT & returns JSON.

```ts
type Response = {
  shortcode: string;
  user_is: 'parent' | 'fresher';
  doneSurvey: boolean;
};
```

# **/family**

## `POST /survey` - authenticated, parents_open | freshers_open

```ts
{
  name: string,
  jmc: boolean
  gender: 'male' | 'female' | 'other' | 'n/a',
  interests: Interests,
  aboutMe: string | null,
  socials: string[] | null
}
```

**400** - Invalid body, already completed survey, or student.

**200** - Updates these details for the user.

## `POST /propose` - parent, parents_open

```ts
{
  shortcode: string;
}
```

**400** - Invalid body, already married, attempted to propose to self or invalid person, already proposed to max (3) number, already proposed to person.

**200** - Proposes to `shortcode`.

## `DELETE /propose` - parent, parents_open

```ts
{
  shortcode: string;
}
```

**400** - Invalid body or proposal does not exist.

**200** - Revokes proposal to `shortcode`.

## `POST /acceptProposal` - parent, parents_open

```ts
{
  shortcode: string;
}
```

**400** - Invalid body or proposal does not exist.

**200** - Accepts proposal from `shortcode`.

## `GET /proposals` - parent, parents_open

**200** - Returns array of proposals.

```ts
{
  proposal: string;
  proposee: string;
}
[];
```

## `GET /me` - authenticated

**200** - Returns user details.

```ts
{
  shortcode: string;
  jmc: boolean;
  role: "parent" | "fresher";
  completedSurvey: boolean;
  name: string | null;
  gender: "male" | "female" | "other" | "n/a" | null;
  interests: Interests | null;
  socials: string[] | null;
  aboutMe: string | null;
}
```

## `GET /myFamily` - authenticated, closed

**400** - User does not have a family.

**200** - Returns family.

```ts
type Student = {
  shortcode: string;
  jmc: boolean;
  role: "parent" | "fresher";
  completedSurvey: boolean;
  name: string | null;
  gender: "male" | "female" | "other" | "n/a" | null;
  interests: Interests | null;
  socials: string[] | null;
  aboutMe: string | null;
}

{
  parents: [
    parent1: Student
    parent2: Student
  ],
  kids: Student[]
}
```

# **/admin**

## `GET /state`

**200** - returns JSON with current state.

```ts
{
  state: 'parents_open' | 'parents_close' | 'freshers_open' | 'closed';
}
```

## `PUT /state` - admin

```ts
{
  state: 'parents_open' | 'parents_close' | 'freshers_open' | 'closed';
}
```

**400** - Invalid body.

**200** - Updated state.
