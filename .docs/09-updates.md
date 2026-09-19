# Remote Updates

This project intentionally teaches updates as a separate subsystem.

## Basic flow

```text
App starts
   |
check current version
   |
release endpoint
   |
is newer version available?
   |
  yes
   |
download update
   |
verify
   |
install
   |
restart
```

## Release metadata

A minimal conceptual JSON:

```json
{
  "version": "1.1.0",
  "notes": "Added order export",
  "publishedAt": "2026-09-01T10:00:00Z",
  "windows": {
    "url": "https://example.com/releases/1.1.0/Setup.exe",
    "sha256": "..."
  }
}
```

The actual Electron updater format should follow the updater/distribution tool being used; do not invent a production protocol around this example.

## Offline behavior

If the update endpoint cannot be reached:

```text
do nothing
continue application
```

The restaurant application must not require internet just because update checking exists.

## Release channels

Later:

```text
stable
beta
```

Do not implement both until the basic updater works.
