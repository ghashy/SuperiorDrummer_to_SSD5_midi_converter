# Convert midi dir-format from Superior Drummer to SSD5

> This is a `Node.js` script for turning midi presets folder structure from Superior Drummer format to
> Steven Slate Drums 5.

*   Installed Node.js  is required for script to work.
*   It is pretty safe to use, as it isn't deleting anything, only creates a new directory.
*   If there are many .mid files, process can take time: about 1 min for `200_000` files.

## Using:
```ini
~ % node main.js midifolder=<directory>
```

> It will create a sibling directory near  `<directory>`, with name: Grooves and nested subdirectories.

 It is a `first` version, and it is not showing loading progress at work. So keep in mind that it can take some time to process!