export const SCREEN_SERVICE_RESET = Symbol('SCREEN_SERVICE_RESET');
export const SCREEN_SERVICE_UPDATE = Symbol('SCREEN_SERVICE_UPDATE');

export const screenServiceReset = () => ({
  type: SCREEN_SERVICE_RESET,
});

export const screenServiceUpdate = (props) => ({
  type: SCREEN_SERVICE_UPDATE,
  ...props,
});
