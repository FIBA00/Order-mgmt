# Security

## Electron

Treat the renderer as untrusted web content.

Use:

- context isolation
- preload
- narrow IPC APIs
- no unrestricted Node integration
- validation of IPC inputs

## Backend

Validate:

- authentication
- authorization
- input shape
- quantities
- prices
- order ownership/tenant

## Passwords

Never store:

```text
password = "secret"
```

Store a slow password hash.

## Desktop secrets

Do not put production secrets into:

```text
React source
renderer bundle
package.json
installer
```

Anything shipped to a client machine should be considered observable by that client.

## Signing key

The signing private key is a publisher secret. It must never ship with the application.

## Local data

Desktop local data should be treated as sensitive business data.

Consider:

- OS permissions
- encrypted secrets where necessary
- database backups
- backup file protection
- log redaction
