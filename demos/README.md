
### Demos

These are small command-line demos that show how to use various parts of the API.

**Note that not everything that is shown in these demos is part of a _public_ API!**

The demos that show the basic usage of the _public_ API are the following:

- [`validationResultDemos.ts`](validationResultDemos.ts) : Shows how to perform filtering operations on a `ValidationResult` that is returned from `Validators.validateTilesetFile`. It creates a "dummy" `ValidationResult` instance and then filters it based on different criteria.
- [`validationOptionsDemo.ts`](validationOptionsDemo.ts) : Shows the effect of the `ValidationOptions` that can be passed to `Validators.validateTilesetFile`. It shows how to include/exclude certain content types in the validation process.

