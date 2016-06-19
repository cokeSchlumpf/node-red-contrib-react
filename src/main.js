import _ from 'lodash';
import _Props from 'js-props-validator';

export const Props = _Props;

export const bindEvent = (property, options) => {
  return {
    _bind: (thing, stateKey) => {
      const extend = {};

      _.forEach(options, (option) => {
        extend[option[0]] = (params) => {
          const result = {};

          if (option[2]) {
            result[stateKey] = _.get(params, option[1]);
          } else {
            result[stateKey] = option[1];
          }

          if (_.isFunction(option[3])) {
            result[stateKey] = option[3](result[stateKey]);
          }

          return result;
        };
      });

      return _.assign({}, thing, extend);
    },

    property: property
  };
}

export const Thing = (thing) => {
  let _state = {};

  _.forEach(thing._stateTypes, (type, key) => {
    if (_.isFunction(type._bind)) {
      thing = type._bind(thing, key);
      _state[key] = type.property.valueOrDefault();
    } else {
      _state[key] = type.valueOrDefault();
    }
  });

  const self = _.assign({}, thing, {
    _handle: (msg, payload) => {
      const event = payload.event;
      const eventFunc = thing[event];
      let out = [];

      if (_.isFunction(eventFunc)) {
        const stateDiffFromEvent = eventFunc(payload);
        const newStateBeforeRules = _.assign({}, _state, stateDiffFromEvent);
        const _rules = _.bind(thing._rules, newStateBeforeRules);
        const newStateAfterRules = _.assign({}, _state, _rules(), stateDiffFromEvent);

        out = _.reduce(newStateAfterRules, (messages, value, key) => {
          if (value !== _state[key] && !_.has(stateDiffFromEvent, key)) {
            messages = _.concat(messages, _.assign({}, msg, {
              payload: {
                trigger: key,
                triggerWithValue: key + "_" + value,
                newValue: value,
                oldValue: _state[key]
              }
            }));
          }

          return messages;
        }, []);

        _state = newStateAfterRules;
      }

      return out;
    },

    handle: (msg, event, params) => {
      if (event) {
        return self._handle(msg, _.assign({}, params || {}, {
          event: event
        }));
      } else {
        return self._handle(msg, msg.req ? msg.req.query : msg.payload);
      }
    }
  });

  return self;
};
