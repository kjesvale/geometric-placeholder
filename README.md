# Geometric placeholder

A Remix application for generating geometric placeholder images using [Primitive](https://github.com/hashbite/primitive).

Forked from [sndrem/fagdag-stand-bekk-2022](https://github.com/sndrem/fagdag-stand-bekk-2022), created for a conference at [@bekk](https://github.com/bekk).

## Installation

```
npm install
npm run dev
```

## Development

The application assumes a `.env` file in the following format:

```
UNSPLASH_ACCESS_KEY=<secret>
DATABASE_URL=file:./dev.db
```

To reset the database, run `npx prisma migrate reset`.

Run `npx prisma db push` and `npx prisma generate` to apply changes to the database schema.
