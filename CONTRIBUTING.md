# Contributing

## Branch Model
- `main` — production releases only
- `develop` — integration branch, all PRs target here
- Feature branches: `feat/<scope>`, `fix/<scope>`, `chore/<scope>`

## Conventional Commits
```
feat(x402): add retry backoff
fix(session): handle expired key edge case
chore(deps): bump stellar-sdk to 12.3.0
```

## PR Checklist
- [ ] Tests pass (`npm test`)
- [ ] Lint passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Commits follow Conventional Commits
- [ ] PR targets `develop`
