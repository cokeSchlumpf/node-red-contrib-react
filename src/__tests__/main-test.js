jest.dontMock('underscore');
jest.dontMock('underscore-deep-extend');
jest.dontMock('lodash');
jest.dontMock('js-props-validator');
jest.dontMock('../main.js');

var ReactRED = require('../main.js');

describe('ReactRED', function() {
  it('...', function() {
    console.log(ReactRED);
  /*
  expect(validator.validateValue(13)).toEqual(true);
  expect(validator.validateValue(9)).toEqual(false);
  */
  });
});
