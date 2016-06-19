# node-red-react - Declarative IoT library for Node-RED [![Build Status](https://travis-ci.org/cokeSchlumpf/js-props-validator.svg?branch=master)](https://travis-ci.org/cokeSchlumpf/node-red-react) [![dependency status](https://david-dm.org/cokeSchlumpf/js-props-validator.svg)](https://david-dm.org/cokeSchlumpf/node-red-react)

**node-red-react** makes it painless to create interactions for your devices in the Internet of Things. Define simple rules how the state of your "Thing" is changed on events and how your "Thing" should behave based on its state.

With [node-RED](http://nodered.org/) you can simply connect events from other devices or services with your configured `node-red-react` rule engine and design flows to react on emitted events.

## Usage

1. Install `node-red-react` within your Node-RED project:

  ```bash
  npm install --save node-red-react
  ```

2. Import the library within a function node:

  ```javascript
  var
    ReactRED = require('node-red-react'),
    Props = ReactRED.Props,
    Thing = ReactRED.Thing,
    bindEvent = ReactRED.bindEvent;
  ```

3. Initialize a Thing in the global context:

  ```javascript
  context.global.thing = context.global.thing || Thing({ ... });
  ```

4. Return `handle(msg)` as result of your function node.

  ```javascript
  return context.global.thing.handle(msg);
  ```

See example and API below.

## Example

### Abstract

Imagine you want to create a home automation solution for lights in your home. In the example you have three lights e.g. a window light, one in the kitchen and another in your bedroom and you like them to be on if the following conditions are true:

* The light in the window is turned on if it's dark outside and you're at home. The window light is also turned on if it's dark outside, you're not at home and the time is before 23:00.

* The light in the kitchen is turned on if it's dark outside and you're at home, but not if it's already later then 22:00.

* The light in the bedroom should be turned on if it's dark outside and you're at home.

The lights are your output devices. You also have some devices which are sending events:

* A light sensor which measures the light intensity outside. It sends an event at the `sunrise` if it's bright enough outside and another event `sunset` if it's getting dark outside.

* A device which sends an event `arriveAtHome` when you arrive at home and another event `leaveHome` if you're leaving. This could be your smartphone for example.

* A third very cool device called a clock which sends an event `currentTime` every 5 minutes. This could be realized through a Inject-Node with Node-RED.

### Realization with node-red-react

Now it would be very simple to wire all these devices within a Node-RED flow:

![Example flow](https://raw.githubusercontent.com/cokeSchlumpf/node-red-react/master/docs/flow.png)

How would the logic between your devices look like? If you think about it, it can be very complex - At least if you increase the number of possible input events and output devices. With `node-red-react` you don't need to worry about that. That's what you need to enter in the function node:

```javascript
var
  ReactRED = require('node-red-react'),
  Props = ReactRED.Props,
  Thing = ReactRED.Thing,
  bindEvent = ReactRED.bindEvent;

context.global.home = context.global.home || Thing({
  _stateTypes: {
    currentTime: bindEvent(
      Props.number().withDefault(0), [
        [ "timerEvent", "value", true ]
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

return context.global.home.handle(msg);
```

With this snippet the function node will emit messages everytime one of your lights needs to be turned on or off if it receives messages from your input devices like:

```javascript
// event triggered by HTTP input node, e.g. http://{host}:{port}/{url}?event=sunrise
msg = {
  req: {
    query: {
      event: "sunrise"
    }
  }
}

// or
msg = {
  payload: {
    event: "timerEvent",
    value: 2300
  }
}
```

The rules defined in the `_rules` function are executed and if one state changes a message with the following payload will be emitted:

```javascript
{
  trigger: STATE_KEY,
  triggerWithValue: STATE_KEY + "_" + NEW_VALUE,
  newValue: NEW_VALUE,
  oldValue: OLD_VALUE
}

// e.g.
{
  trigger: 'lightsWindowOn',
  triggerWithValue: "lightsWindowOn_true",
  newValue: true,
  oldValue: false
}
```

Those messages can easily be routed to an action to turn the light actually on. Note that there won't be an emitted message for the state value which was changed by the incoming event, e.g. `currentTime`.

## API

### ReactRED.Thing(configuration)

Creates a new thing. `configuration` must have at least the following values:

```javascript
{
  _stateTypes: {

  },

  _rules: function() {

  }
}
```

Where `_stateTypes` defines the fields which describe the state of a Thing. E.g:

```javascript
_stateTypes: {
  currentTime: Props.number().withDefault(0),
  sunIsShining: Props.bool().withDefault(true),
  somebodyAtHome: Props.bool().withDefault(false),
  lightsWindowOn: Props.bool().withDefault(false),
  lightsKitchenOn: Props.bool().withDefault(false),
  lightsBedroomOn: Props.bool().withDefault(false)
}
```

`_rules` define the rules on how the state values are related, the current state is readable via `this`, e.g.

```javascript
_rules: function() {
  return {
    lightsWindowOn: !this.sunIsShining && (this.somebodyAtHome || this.currentTime < 2359),
    lightsKitchenOn: !this.sunIsShining && this.somebodyAtHome && this.currentTime < 2000,
    lightsBedroomOn: !this.sunIsShining && this.somebodyAtHome
  };
}
```

In addition to `_stateTypes` and `_rules` a Thing can contain any number of event handlers, e.g.

```javascript
{
  _stateTypes: {

  },

  _rules: function() {

  },

  sunrise: function() {
    return {
      sunIsShining: true
    }
  },

  timeEvent: function(params) {
    return {
      currentTime: params.value
    }
  }
}
```

Every handler must return an object containing the state key and value it might have changed. Simple event handlers can also be created with `bindEvent` (see below).

### ReactRED.bindEvent

`bindEvent` simplifies the creation of event handlers. Just wrap a state type within `_stateTypes` definition:

```javascript
_stateTypes: {
  somebodyAtHome: bindEvent(
    Props.bool().withDefault(false), [
      [ "arriveAtHome", true ],
      [ "leaveHome", false ]
    ])
}
```

`bindEvent` accepts the following parameters:

```javascript
bindEvent(PROPERTY_DEFINITION, EVENT_HANDLERS);
```

Where `EVENT_HANDLERS` is an array of arrays. Each of this arrays can have up to 4 parameters:

```
[ EVENT, VALUE_TO_BE_ASSIGNED_TO_STATE_PROPERTY, IS_PARAMETER(optional, default: false), TRANSFORM_FUNCTION(optional) ]
```

### ReactRED.Props

See (js-props-validator)[https://github.com/cokeSchlumpf/js-props-validator] for details.
