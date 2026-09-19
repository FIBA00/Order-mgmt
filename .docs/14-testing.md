# Testing

Keep tests focused.

## Backend

Test:

```text
login
role authorization
menu CRUD
order creation
order total
order status
```

## Frontend

Test:

```text
login screen
order creation
total display
empty states
error states
```

## Desktop

Test:

```text
application starts
database initializes
first-run setup appears
data survives restart
data survives application update
update check failure does not prevent startup
```

## Release tests

At least once per release candidate:

```text
install v1.0
create data
install/update v1.1
verify data
uninstall
verify expected data-retention behavior
restore backup
```

The last two behaviors must be intentionally defined; never assume the installer will make the right choice for business data.
