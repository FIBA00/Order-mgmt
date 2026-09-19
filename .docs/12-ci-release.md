# CI / Release Pipeline

A real release should look approximately like:

```text
git tag v1.2.0
      |
      v
CI starts
      |
      +--> test backend
      |
      +--> test frontend
      |
      +--> build desktop
      |
      +--> package installer
      |
      +--> sign
      |
      +--> publish GitHub Release / release storage
      |
      v
users can discover v1.2.0
```

## Important distinction

A GitHub Release is a distribution mechanism.

It is not your application's backend.

Your restaurant app can be completely offline while the updater occasionally uses the internet.

## Release checklist

- version bumped
- migrations tested
- tests pass
- installer generated
- artifact signed
- checksums/signatures generated where applicable
- release notes written
- release published
- updater metadata points to the release
- previous version tested for update path
