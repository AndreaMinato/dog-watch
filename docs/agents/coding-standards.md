# Coding standards

Judgement calls the reviewer enforces. Mechanical rules live in ESLint (`eslint.config.js`), not here.

## Errors the user sees

An error shown to the user says **what failed** in words they can act on: the network or service is unreachable, the camera or microphone permission was denied, the camera is missing or busy. "Chiave non valida" stays the single message for every bad-key case (it must not reveal which Stanze exist).

A `catch` that maps several causes to one generic message keeps the cause: it logs it (`console.error`) before showing the message, so the next person debugging can see it.
