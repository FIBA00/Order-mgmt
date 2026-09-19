# Release Runbook

Use this every time we eventually ship a version.

## 1. Development

```text
implement
test
run locally
```

## 2. Database

```text
write migration
test fresh database
test upgrade from previous version
backup/restore test
```

## 3. Version

Update the application version.

## 4. CI

```text
test
build
package
```

## 5. Sign

Use production signing credentials only in the secure release environment.

## 6. Publish

Publish installer and updater metadata.

## 7. Update test

```text
install old version
create restaurant data
run update
verify:
  - app starts
  - data remains
  - migrations ran
  - version changed
```

## 8. Rollback planning

You cannot assume application rollback is the same as database rollback.

Before shipping a destructive migration, have a tested backup/recovery path.
