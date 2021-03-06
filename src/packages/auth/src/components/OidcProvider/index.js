import React, { useMemo, useEffect, createContext, useCallback, useState, forwardRef } from 'react';
import PropTypes from 'prop-types';

import { loadUserThunk, authReset } from '@misakey/auth/store/actions/auth';

import log from '@misakey/helpers/log';
import isNil from '@misakey/helpers/isNil';
import parseJwt from '@misakey/helpers/parseJwt';
import { parseAcr } from '@misakey/helpers/parseAcr';
import createUserManager from '@misakey/auth/helpers/userManager';

import SplashScreen from '@misakey/ui/Screen/Splash/WithTranslation';


const getUser = ({
  profile: { acr, sco: scope, auth_time: authenticatedAt } = {},
  expires_at: expiryAt,
  access_token: token,
  id_token: id,
}) => ({
  expiryAt,
  token,
  id,
  authenticatedAt,
  scope,
  isAuthenticated: !!token,
  acr: parseAcr(acr),
});

// CONTEXT
export const UserManagerContext = createContext({
  userManager: null,
});

// COMPONENTS
function OidcProvider({ store, children, config }) {
  const userManager = useMemo(
    () => createUserManager(config),
    [config],
  );
  const [isLoading, setIsLoading] = useState(false);

  const dispatchLoadUser = useCallback(
    (user, identityId, accountId) => store.dispatch(loadUserThunk({
      ...getUser(user),
      identityId,
      accountId: accountId || null, // accountId can be an empty string
    })),
    [store],
  );

  const dispatchStoreUpdate = useCallback(
    (user) => {
      if (isNil(store)) {
        return Promise.resolve();
      }

      const { mid: identityId, aid: accountId } = parseJwt(user.id_token);
      return Promise.resolve(dispatchLoadUser(user, identityId, accountId));
    },
    [dispatchLoadUser, store],
  );

  // event callback when the user has been loaded (on silent renew or redirect)
  const onUserLoaded = useCallback((user) => {
    log('User is loaded !');

    // the access_token is still valid so we load the user in the store
    if (!isNil(user) && !user.expired) {
      return dispatchStoreUpdate(user)
        .then(() => setIsLoading(false));
    }
    setIsLoading(false);
    return Promise.resolve();
  }, [dispatchStoreUpdate]);

  // event callback when silent renew errored
  const onSilentRenewError = useCallback(() => {
    log('Fail to renew token silently...');
    if (store) {
      store.dispatch(authReset());
    }
  }, [store]);

  const loadUserAtMount = useCallback(() => {
    setIsLoading(true);

    // Load user on store when the app is opening
    userManager.getUser()
      .then(onUserLoaded);
  }, [onUserLoaded, userManager]);

  useEffect(() => {
    // register the event callbacks
    userManager.events.addUserLoaded(onUserLoaded);
    userManager.events.addSilentRenewError(onSilentRenewError);

    loadUserAtMount();

    // Remove from store eventual dead signIn request key
    // (it happens when an error occurs in the flow and the backend response
    // doesn't send back the state so we can't remove it with the signInRequestCallback )
    userManager.clearStaleState();

    return function cleanup() {
      // unregister the event callbacks
      userManager.events.removeUserLoaded(onUserLoaded);
      userManager.events.removeSilentRenewError(onSilentRenewError);
    };
  }, [
    userManager,
    onUserLoaded,
    onSilentRenewError,
    loadUserAtMount,
  ]);


  return (
    <UserManagerContext.Provider value={{ userManager }}>
      {isLoading ? (
        <SplashScreen />
      ) : children}
    </UserManagerContext.Provider>
  );
}

OidcProvider.propTypes = {
  children: PropTypes.node,
  config: PropTypes.shape({
    authority: PropTypes.string.isRequired,
    automaticSilentRenew: PropTypes.bool,
    client_id: PropTypes.string.isRequired,
    loadUserInfo: PropTypes.bool,
    redirect_uri: PropTypes.string.isRequired,
    response_type: PropTypes.string,
    scope: PropTypes.string,
  }),
  store: PropTypes.object,
};

OidcProvider.defaultProps = {
  children: null,
  config: {
    response_type: 'code',
    scope: 'openid tos privacy_policy',
    automaticSilentRenew: true,
    loadUserInfo: false,
  },
  store: null,
};

export const withUserManager = (Component) => forwardRef((props, ref) => (
  <UserManagerContext.Consumer>
    {(context) => <Component {...props} {...context} ref={ref} />}
  </UserManagerContext.Consumer>
));

export default OidcProvider;
