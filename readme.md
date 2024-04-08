# MySQL Database Migration Tool

This is a tool for managing MySQL database migrations, written in TypeScript.

## Installation

```bash
npm install <your-package-name>
```

**Usage**
First, import the Migration class from our package:

```typescript
import { Migration } from '<your-package-name>';
```

Then, create a new instance of the Migration class:

```typescript
const migration = new Migration(<parameters>);
```

You can then call the log method to log information about the migration:

```typescript
migration.log();
```

Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

License
MIT
