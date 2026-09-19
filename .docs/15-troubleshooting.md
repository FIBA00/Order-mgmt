# Troubleshooting

## App works in browser but not desktop

Check the desktop runtime and preload/IPC boundary first.

## Database disappears after reinstall

Check where the database is stored. It should be in application data, not inside the installation directory.

## Update destroys data

You probably coupled application files and user data or skipped database migration design.

## Update downloads but will not install

Check signing, updater artifact format, permissions, and platform requirements.

## Windows shows an unknown publisher warning

That is a code-signing/trust issue, not a React issue.

## Renderer has access to Node APIs

Fix the Electron security boundary. Do not solve this by exposing all of Node through preload.

## App cannot start without internet

Update checking must be optional. Startup should not depend on the update server.

## Production signing key leaked

Treat it as compromised. Rotate/revoke according to the certificate/signing provider's procedure and secure the new key.
