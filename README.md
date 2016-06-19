# js-props-validator [![Build Status](https://travis-ci.org/cokeSchlumpf/js-props-validator.svg?branch=master)](https://travis-ci.org/cokeSchlumpf/js-props-validator) [![dependency status](https://david-dm.org/cokeSchlumpf/js-props-validator.svg)](https://david-dm.org/cokeSchlumpf/js-props-validator)

JavaScript object properties validation. See below or [src/\__tests\__/main-test.js](https://github.com/cokeSchlumpf/js-props-validator/blob/master/src/main/__tests__/main-test.js) for examples.

## Getting Started

Install js-props-validator as NPM dependency.

```
npm install --save js-props-validator
```

## Example

```JavaScript
import Props from 'js-props';

const validator = Props.object({
    name: Props.string(),
    age: Props.number(),
    phone: Props.string().isOptional(),
    country: Props.oneOf([ 'Austria', 'Germany', 'Switzerland' ]).withDefault('Germany')
  });

validator.validate({
    name: 'Egon',
    age: 12
  });
// => true

validator.validate({
    name: 'Egon'
  });
// => Will throw exception due to missing age

validator.validateValue({
    name: 'Egon',
    age: 'twelve'
  });
// => false due to wrong type for age

validator.valueOrDefault({
    name: 'Egon',
  });
// => { name: 'Egon', country: 'Germany' }
```

## Types

### Any

```JavaScript
Props.any([ ofType: Function | Array [, isOptional: boolean = false [, defaultValue: Any ]]])
```

Checks for any type. If `ofType` is a function it will be used to validate the value. E.g.:

```JavaScript
const validator = Props.any((value) => value > 10);
validator.validateValue(13) === true;
validator.validateValue(9) === false;
```

If `ofType` is an array of `Type` the value will be checked if it is one of the given types. E.g.:

```JavaScript
const validator = Props.any([ Props.number(), Props.string() ]);
validator.validateValue(12) === true;
validator.validateValue(twelve) === true;
validator.validateValue([ 12 ]) === false;
```

### Array

```JavaScript
Props.array([ ofType: Type [, isOptional: boolean = false [, defaultValue: Array ]]])
```

Checks for arrays. `ofType` can be defined as Type. E.g.:

```JavaScript
const validator = Props.array(Props.string());
validator.validateValue([ "a", "b", "c" ]) === true;
validator.validateValue([ 1, 2, 3 ]) === false;
```

### Boolean

```JavaScript
Props.bool([ isOptional: boolean = false [, defaultValue: boolean ]])
```

Checks for boolean.

### Enumeration

```JavaScript
Props.oneOf(values: Array [, isOptional: boolean = false [, defaultValue: Any ]])
```

Checks for a set of defined values. E.g.:

```JavaScript
const validator = Props.oneOf([ 1, 'A', 2 ]);
validator.validateValue(1) === true;
validator.validateValue('B') === false;
```

### Function

```JavaScript
Props.func([ isOptional: boolean = false [, defaultValue: Function ]])
```

Checks for functions.

### Number

```JavaScript
Props.number([ isOptional: boolean = false [, defaultValue: Number ]])
```

Checks for numbers.

### Object

```JavaScript
Props.object(ofType: Object | Type [, isOptional: boolean = false [, defaultValue: Number ]])
```

`ofType` can be a predefined object structure. E.g.:

```JavaScript
const validator = Props.object({
    name: Props.string(),
    age: Props.number(),
    phone: Props.string().isOptional(),
    country: Props.oneOf([ 'Austria', 'Germany', 'Switzerland' ]).withDefault('Germany')
  });

validator.validate({
    name: 'Egon',
    age: 12
  }) === true;
```

If `ofType` is a type, the validator checks if every property of the object meets the type's validations. E.g.:

```JavaScript
const validator = Props.object(Props.object({
    label: Props.string(),
    value: Props.any([ Props.number(), Props.string() ])
  }));

validator.validateValue({
    id: {
      label: "#",
      value: 0
    },
    name: {
      label: "Name",
      value: "Egon"
    }
  }) === true;

validator.validateValue({
    id: {
      value: 0
    },
    name: {
      label: "Name",
      value: "Egon"
    }
  }) === false;
```

### String

```JavaScript
Props.string([ isOptional: boolean = false [, defaultValue: String ]])
```

Checks for strings.

## Type methods

Every type supports the following listed methods.

### isOptional()

The validation will return `true` if value is not set.

```JavaScript
const validator = Props.number().isOptional(); // alternative to: Props.number(true);
validator.validateValue(1) === true;
validator.validateValue(undefined) === true;
validator.validateValue("one") === false;
```

### withDefault()

The validation will return a default value when calling `valueOrDefault` on a undefined value. Note: `isOptional` will be automatically set to `true` when calling `withDefault`.

```JavaScript
const validator = Props.number().withDefault(42); // alternative to: Props.number(true);
validator.validateValue(1) === true;
validator.validateValue(undefined) === true;
validator.validateValue("one") === false;

validator.valueOrDefault(1) === 1;
validator.valueOrDefault(undefined) === 42;
```

### validate(value: Any [, valueName: String])

The Method will validate the value, if the validation fails an error will be thrown. `valueName` is used within the error message if set.

```JavaScript
const validator = Props.object({
    name: Props.string(),
    age: Props.number(),
    phone: Props.string().isOptional(),
    country: Props.oneOf([ 'Austria', 'Germany', 'Switzerland' ]).withDefault('Germany')
  });

validator.validate({
    name: 'Egon'
  });
// => Will throw exception due to missing age
```

### validateValue(value: Any [, valueName: String])

Like `validate` but it will log an warning instead of throwing an error. Returns `true` if validation was successful, otherwise `false`.

### valueOrDefault(value: Any)

Returns `value` or the default value when set and `value === undefined`. See example of `withDefault`.
