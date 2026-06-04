# Breezy

## Getting started

in the root: `npm install`

make sure you have: `npm install turbo --global`

and then: `npm run dev`

## Micro-services

- `auth`: who you are (credentials) - PostgreSQL
- `users`: how you connect (social graph and profile) - PostgreSQL
- `posts`: what you do (content) - MongoDB + Elasticsearch
- `media`: what you share (files) - S3 + MongoDB
  <!--- `notifications`: what you get (alerts) - MongoDB -->
  <!--- `feed`: what you see (content feed) - MongoDB -->
