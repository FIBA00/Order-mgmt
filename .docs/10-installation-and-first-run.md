# Installation and First Run

There are two separate experiences.

## Installer wizard

Handled by the packaging/installer technology:

```text
Welcome
  |
Install location
  |
Shortcuts
  |
Install
  |
Finish
```

## Application setup wizard

Handled by our React application:

```text
Welcome
  |
Restaurant information
  |
Create administrator
  |
Choose currency
  |
Seed example menu? [yes/no]
  |
Finish
```

This distinction is important.

The installer installs software.

The first-run wizard initializes the customer's application.

## First-run state

Store a small setting such as:

```text
setup_completed = true
```

in the local application data/database.

Do not use the executable directory for this state.
