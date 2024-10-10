# DoCSoc Mums & Dads v3

Nuxt4 + Hono application for the Mums & Dads website. Mums & Dads is a _course_-long scheme where freshers are allocated with parents (2nd, 3rd and 4th year students) and parents advice their children about the course, the college, the societies and much more.

Mad3 is a fork of [mad2](https://github.com/icdocsoc/mad2), re-written for the greater good of the society. Mad2 being 5 years ago, mad3 is written to adapt to newer web technologies and frameworks. This stack also aligns with ICHack '25 so one can see the resemblence in code style and structure.

This project is open-source and free to look at. If you wish to change something about the website, you can open a PR and we shall review it.

Mad3 is written such that future webmasters (and anyone else) should be able to run it purely with an `.env` file, `docker compose up`, and the allocations script. You should never have to edit the code unless you are bugfixing or modifying features.

## Project structure

Although using Nuxt 3, we have opted to use Nuxt 4 in our build. [`app/`](/app/) contains the frontend while the [`hono/`](/hono/) contains the server.

## Local development

Visit [Microsoft Entra admin center](https://entra.microsoft.com/) -> App registrations -> \[your mums and dads app]. Copy your tenant ID and client ID into `.env`, and generate a client secret from 'Certificates & secrets' to copy into `.env`.

Fill out the rest of the `.env` file - note that webmasters is comma seperated and restricts admin routes. JWT_SECRET should be a randomly generated long string with no dollar signs, or else Docker gets mad.

Next, build the docker images.

```bash
docker compose build
```

Now run the postgres image.

```bash
# If you want to run it in the background
docker compose start postgres
# You will need to then later run
# docker compose stop postgres

# If you want to run it in the foreground to see the logs
docker compose up postgres
```

Finally, run the website.

```bash
# The --bun is required as bunfigs are broken, as of writing this.
bun run --bun dev
```

We run the website this way rather than using the Docker image as we want hot-reload and other development features.

## Production

Docker images are made available for easy running on prod. See the local development section for an explanation of how to fill out the environment variables.

To simulate a production run locally, run

```bash
docker compose build

docker compose up
```

Note that published Docker builds are generated from the branch `release/latest`.

## Allocations & more

Clone the repo locally and run `run.py` in the allocations folder. You can find your auth cookie from the developer tools (CTRL + SHIFT + I) -> Network -> refresh the page and see the Cookie tab of the request.

Once the allocations are done, run `generateCsv.ts` to generate a CSV file that you can import into Excel and print out, for on the day organization. There also exists the admin page to facilitate this, but paper never goes wrong.

There also exists an admin page at `/admin` restricted to webmasters as per the env file, where you can search families, see statistics, and change the state of the website.

Should you intend to use this code outside of an Imperial context, you will need to change the sign in code, callback code, and `isFresherOrParent` function. These are found in [`hono/auth/auth.ts`](/hono/auth/auth.ts) and [`hono/auth/jwt.ts`](/hono/auth/jwt.ts).

Finally, if you wish to send emails to the families (with their allocations), you can use the `mailmerge` folder. Check the README there for more information.

## Contributors

### 2025 Webmasters

- [@cybercoder-naj](https://github.com/cybercoder-naj)
- [@Dropheart](https://github.com/Dropheart)

### mad2 Allocator Author

- [@jackpordi](https://github.com/jackpordi)
