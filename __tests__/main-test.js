jest.dontMock('underscore');
jest.dontMock('underscore-deep-extend');
jest.dontMock('../main.js');

var Props = require('../main.js').default;

describe('Props.any', function() {
  it('checks values by a custom function', function() {
    console.log(Props);
    var validator = Props.any((value) => {
      return value > 10
    });

    expect(validator.validateValue(13)).toEqual(true);
    expect(validator.validateValue(9)).toEqual(false);
  });

  it('checks values against a set of values', function() {
    const validator = Props.any([ Props.number(), Props.string() ]);

    expect(validator.validateValue(12)).toEqual(true);
    expect(validator.validateValue("twelve")).toEqual(true);
    expect(validator.validateValue({
      "twelve": 12
    })).toEqual(false);
  });
});

describe('Props.array', function() {
  it('checks an array value', function() {
    var validator = Props.array();
    expect(validator.validateValue([ 1, 2, 3 ])).toEqual(true);
  });

  it('checks a non valid array', function() {
    var validator = Props.array();
    expect(validator.validateValue('abc')).toEqual(false);
  });

  it('checks an array with a spcific type', function() {
    var validator = Props.array(Props.string());
    expect(validator.validateValue([ 'a', 'b', 'c' ])).toEqual(true);
  });

  it('checks an array with a spcific type (negative test)', function() {
    var validator = Props.array(Props.string());
    expect(validator.validateValue([ 'a', 2, 'c' ])).toEqual(false);
  });
});

describe('Props.bool', function() {
  it('checks a boolean value', function() {
    var validator = Props.bool();
    expect(validator.validateValue(false)).toEqual(true);
  });

  it('checks a boolean value (negative-test)', function() {
    var validator = Props.bool();
    expect(validator.validateValue(1)).toEqual(false);
  });
});

describe('Props.oneOf', function() {
  it('checks an enumeration value', function() {
    var validator = Props.oneOf([ 'a', 'b', 'c' ]);
    expect(validator.validateValue('a')).toEqual(true);
  });

  it('checks an enumeration value (negative test)', function() {
    var validator = Props.oneOf([ 'a', 'b', 'c' ]);
    expect(validator.validateValue('f')).toEqual(false);
  });
});

describe('Props.func', function() {
  it('checks a function value', function() {
    var validator = Props.func();
    expect(validator.validateValue(function() {
      return true;
    })).toEqual(true);
  });

  it('checks a function value (negative test)', function() {
    var validator = Props.func();
    expect(validator.validateValue('f')).toEqual(false);
  });
});

describe('Props.number', function() {
  it('checks a number value', function() {
    var validator = Props.number();
    expect(validator.validateValue(42)).toEqual(true);
  });

  it('checks a number value (negative test)', function() {
    var validator = Props.number();
    expect(validator.validateValue('f')).toEqual(false);
  });
});

describe('Props.string', function() {
  it('checks a string value', function() {
    var validator = Props.string();
    expect(validator.validateValue('42')).toEqual(true);
  });

  it('checks a string value (negative test)', function() {
    var validator = Props.string();
    expect(validator.validateValue(42)).toEqual(false);
  });
});

describe('Props.object', function() {
  var validator = Props.object({
    name: Props.string(),
    age: Props.number(),
    phone: Props.string().isOptional(),
    country: Props.oneOf([ 'Austria', 'Germany', 'Switzerland' ]).withDefault('Germany')
  });

  it('checks simple object validation', function() {
    expect(validator.validate({
      name: 'Egon',
      age: 12
    }, "test-object")).toEqual(true);
  });

  it('checks simple object validation (negative-test with exception)', function() {
    expect(function() {
      validator.validate({
        name: 'Egon'
      })
    }).toThrow();
  });

  it('checks an optional value', function() {
    expect(validator.validateValue({
      name: 'Egon',
      age: 12,
      phone: '123'
    })).toEqual(true);
  });

  it('checks an optional value (negative-test)', function() {
    expect(validator.validateValue({
      name: 'Egon',
      age: 12,
      phone: 123
    })).toEqual(false);
  });

  it('checks simple object validation (negative-test)', function() {
    expect(validator.validateValue({
      name: 'Egon',
      age: 'twelve'
    })).toEqual(false);
  });

  it('checks the default value filling', function() {
    expect(validator.valueOrDefault({
      name: 'Egon',
    })).toEqual({
      name: 'Egon',
      country: 'Germany'
    });
  });

  it('validates the value and returns default if necessary', function() {
    expect(validator.validateAndDefault({
      name: 'Egon',
      age: 12
    })).toEqual({
      name: 'Egon',
      age: 12,
      country: 'Germany'
    });
  });

  it('validates the value and returns default if necessary (negative-test)', function() {
    expect(function() {
      validator.validateAndDefault({
        name: 'Egon',
        age: 'twelve'
      })
    }).toThrow();
  });
});

describe('Props.object with variable property names', function() {
  var validator = Props.object(Props.object({
    label: Props.string(),
    value: Props.any([ Props.number(), Props.string() ])
  }));

  it('is also allowed to check only the type of the values of an object - independent from the key', function() {
    expect(validator.validateValue({
      id: {
        label: "#",
        value: 0
      },
      name: {
        label: "Name",
        value: "Egon"
      }
    })).toEqual(true)
  });

  it('is also allowed to check only the type of the values of an object - independent from the key (negative-test - wrong type)', function() {
    expect(validator.validateValue({
      id: {
        label: 0,
        value: 0
      },
      name: {
        label: "Name",
        value: "Egon"
      }
    })).toEqual(false)
  });

  it('is also allowed to check only the type of the values of an object - independent from the key (negative-test - missing field)', function() {
    expect(validator.validateValue({
      id: {
        value: 0
      },
      name: {
        label: "Name",
        value: "Egon"
      }
    })).toEqual(false)
  });
})
