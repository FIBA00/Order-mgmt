# Code Signing

Code signing answers:

> Did this executable really come from the publisher, and was it modified?

## Two different concepts

### Developer/update signing

Some frameworks use a cryptographic key pair to sign update artifacts.

### OS code signing

Windows/macOS have their own publisher-trust systems and certificates.

Do not confuse these.

## Private key rule

Never commit:

```text
*.pfx
*.pem
*.key
```

or passwords.

Use:

```text
CI secret store
hardware-backed signing service
or secure local certificate storage
```

## Development learning setup

You may use a self-signed certificate to understand the mechanics.

It will NOT give normal public trust.

Production Windows distribution should use a real code-signing certificate/service.

## Release flow

```text
source
  |
build
  |
package
  |
sign
  |
publish
```

Signing happens after/beside packaging depending on the platform/tooling.
