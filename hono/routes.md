# **middleware**

## `grantAccessTo`

**403** - No access to route, based on role stored in JWT.

# **/auth**

## `POST /signIn`

**302** - Redirects to Microsoft Auth sign in

## `POST /signOut`

**200** - Clears JWT cookie from browser (signs out)

## `POST /callback`

**400** - Microsoft auth error, user has no shortcode, or user has no entry year.

**403** - Not a Computing student.

**500** - State mismatch or Microsoft auth error - was logged internally.

**200** - Succesful log in. Sets JWT cookie and returns JSON.

```ts
{
    user_is: "parent" || "fresher",
    done_survey: boolean
}
```

## `GET /details`

**200** - Mainly a testing route. Decodes JWT & returns JSON.

```ts
{
    shortcode: string,
    user_is: "parent" || "fresher"
}
```
