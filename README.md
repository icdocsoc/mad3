# DoCSoc Mums & Dads v3

Nuxt4 + Hono application for the Mums & Dads website. Mums & Dads is a _course_-long scheme where freshers are allocated with parents (2nd, 3rd and 4th year students) and parents advice their children about the course, the college, the societies and much more.

Mad3 is a fork of [mad2](https://github.com/icdocsoc/mad2), re-written for the greater good of the society. Mad2 being 5 years ago, mad3 is written to adapt to newer web technologies and frameworks. This stack also aligns with ICHack '25 so one can see the resemblence in code style and structure.

This project is open-source and free to look at. If you wish to change something about the website, you can open a PR and we shall review it.

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

## Production

Docker images are made available for easy running on prod.

## Allocations

Run `run.py` in the allocations folder.

You can find your auth cookie from the developer tools (CTRL + SHIFT + I) -> Network -> refresh the page and see the Cookie tab of the request.

## Contributors

### 2025 Webmasters

- [@cybercoder-naj](https://github.com/cybercoder-naj)
- [@Dropheart](https://github.com/Dropheart)

### mad2 Allocator Author 
- [@jackpordi](https://github.com/jackpordi)
