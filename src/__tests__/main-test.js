jest.dontMock('underscore');
jest.dontMock('underscore-deep-extend');
jest.dontMock('lodash');
jest.dontMock('js-props-validator');
jest.dontMock('../main');

var ReactRED = require('../main');
var Props = ReactRED.Props;
var Thing = ReactRED.Thing;
var bindEvent = ReactRED.bindEvent;

describe('ReactRED', function() {
  it('emits events if its state is changed by incoming events', function() {
    var nodeMessages = [
      {
        foo: "bar",
        payload: {
          event: "arriveAtHome"
        }
      },
      {
        foo: "bar",
        req: {
          query: {
            event: "sunset"
          }
        }
      },
      {
        foo: "bar"
      }
    ];

    var thing = Thing({
      _stateTypes: {
        currentTime: bindEvent(
          Props.number().withDefault(0), [
            [ "timerEvent", "value", true, (value) => value + 10 ]
          ]),

        sunIsShining: bindEvent(
          Props.bool().withDefault(true), [
            [ "sunrise", true ],
            [ "sunset", false ]
          ]),

        somebodyAtHome: bindEvent(
          Props.bool().withDefault(false), [
            [ "arriveAtHome", true ],
            [ "leaveHome", false ]
          ]),

        lightsWindowOn: Props.bool().withDefault(false),

        lightsKitchenOn: Props.bool().withDefault(false),

        lightsBedroomOn: Props.bool().withDefault(false)
      },

      _rules: function() {
        return {
          lightsWindowOn: !this.sunIsShining && (this.somebodyAtHome || this.currentTime < 2359),
          lightsKitchenOn: !this.sunIsShining && this.somebodyAtHome && this.currentTime < 2000,
          lightsBedroomOn: !this.sunIsShining && this.somebodyAtHome
        };
      }
    });

    let result = thing.handle(nodeMessages[0]);
    expect(result.length).toEqual(0);

    result = thing.handleHttp(nodeMessages[1]);
    expect(result.length).toEqual(3);

    result = thing.handleEvent(nodeMessages[2], "timerEvent", {
      value: 1995
    });

    expect(result.length).toEqual(1);
    expect(result[0].payload.trigger).toEqual("lightsKitchenOn");
    expect(result[0].payload.triggerWithValue).toEqual("lightsKitchenOn_false");
    expect(result[0].payload.oldValue).toEqual(true);
    expect(result[0].payload.newValue).toEqual(false);
  });
});
