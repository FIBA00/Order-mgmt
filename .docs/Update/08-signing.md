# Signing — Actual Implementation

The project intentionally contains the configuration points but **never contains a real private signing key**.

That is the correct production practice.

## electron-builder variables

The release workflow reserves:

```text
CSC_LINK
CSC_KEY_PASSWORD
```

for Windows signing.

They are supplied as GitHub Actions secrets.

Do not put them into:

```text
.env
package.json
git
source code
```

## What the real flow becomes

```text
Git tag
   |
GitHub Actions
   |
build
   |
electron-builder
   |
Windows signing certificate
   |
signed NSIS installer
   |
GitHub Release
```

Electron's own documentation recommends code signing for distributed applications and documents Windows signing through Electron tooling. Code signing is also important for auto-update workflows. citeturn0search4turn0search5

## Learning exercise

First run unsigned development builds.

Then use a test/self-signed certificate only to understand the mechanics.

Finally configure a real production certificate in CI.

A self-signed certificate is not equivalent to a publicly trusted publisher certificate.
