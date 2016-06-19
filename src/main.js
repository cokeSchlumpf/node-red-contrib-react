import _ from 'lodash';
import _Props from 'js-props-validator';

export const Props = _Props;

export const Thing = (thing) => {
  let _state = thing._stateTypes.valueOrDefault();

  return {
    handle: function(msg) {
      const event = msg.req.query.event;
      const eventFunc = thing[event];
      let out = [];

      if (_.isFunction(eventFunc)) {
        const stateDiffFromEvent = eventFunc(msg.req.query);
        const newStateBeforeRules = _.assign({}, _state, stateDiffFromEvent);
        const _rules = _.bind(thing._rules, newStateBeforeRules);
        const newStateAfterRules = _.assign({}, _state, _rules(), stateDiffFromEvent);

        out = _.reduce(newStateAfterRules, (messages, value, key) => {
          if (value !== thing._state[key] && !_.has(stateDiffFromEvent)) {
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
    }
  };
};
