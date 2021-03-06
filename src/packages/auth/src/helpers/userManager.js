import { UserManager, WebStorageStateStore } from 'oidc-client';
import uuid4 from 'uuid/v4';
import log from '@misakey/helpers/log';

class MisakeyUserManager extends UserManager {
  // eslint-disable-next-line no-underscore-dangle
  _signinStart(args, navigator, navigatorParams = {}) {
    return navigator.prepare(navigatorParams).then((handle) => {
      log('UserManager._signinStart: got navigator window handle');

      return this.createSigninRequest(args).then((signinRequest) => {
        log('UserManager._signinStart: got signin request');

        const nonce = uuid4().replace(/-/g, ''); // Generates RFC4122 version 4 guid
        const referrer = args.referrer || `${window.location.pathname}${window.location.search || ''}${window.location.hash || ''}`;

        // We need to rework the request generated by the library as we use a backend redirect uri
        // which is a case not handled by oidc-client-js :
        //   - we add the nonce params to the request, as it will be checked by signInCallback
        //     method in case of an auth `token` request
        //   - we remove the code_challenge and the code_challenge method as there is no way for the
        //     backend to handle it for now (https://gitlab.misakey.dev/misakey/js-common/issues/61#note_231261546)
        const [baseUrl, params] = signinRequest.url.split('?');
        const searchParams = new URLSearchParams(params || '');
        searchParams.set('nonce', nonce);
        searchParams.delete('code_challenge');
        searchParams.delete('code_challenge_method');

        const newNavigatorParams = {
          ...navigatorParams,
          id: signinRequest.state.id,
          url: `${baseUrl}?${searchParams.toString()}`,
        };

        // We need to custom the object stored in the localStorage to:
        //  - add the nonce so the lib could validate it when the back will reply
        //  - add the referrer to redirect to the right route on backend response
        //  - remove the code_verifier to prevent the lib to wait for a code in the reply
        //  - remove the client_secret as it is use to processCode and we don't need to do it
        const signInState = signinRequest.state;
        // cannot use object destructuring as signinRequest.state is a Class
        const newSignInRequest = JSON.stringify({
          id: signInState.id,
          data: signInState.data,
          created: signInState.created,
          request_type: signInState.request_type,
          authority: signInState.authority,
          client_id: signInState.client_id,
          scope: signInState.scope,
          extraTokenParams: signInState.extraTokenParams,
          skipUserInfo: signInState.skipUserInfo,
          nonce,
          referrer,
          ...(args.acr_values ? { acr_values: args.acr_values } : {}),
        });

        return this.settings.stateStore.set(signinRequest.state.id, newSignInRequest)
          .then(() => handle.navigate(newNavigatorParams));
      }).catch((err) => {
        if (handle.close) {
          handle.close();
        }
        log('UserManager._signinStart: Error after preparing navigator, closing navigator window');
        throw err;
      });
    });
  }
}

export default function createUserManager(config) {
  const { authority } = config;
  const userManagerConfig = {
    metadata: {
      issuer: `${authority}/`,
      jwks_uri: `${authority}/.well-known/jwks.json`,
      authorization_endpoint: `${authority}/oauth2/auth`,
      token_endpoint: `${authority}/oauth2/token`,
      userinfo_endpoint: `${authority}/userinfo`,
    },
    response_type: 'code',
    scope: 'openid tos privacy_policy',
    automaticSilentRenew: true,
    loadUserInfo: false,
    userStore: new WebStorageStateStore({ store: window.localStorage }),
    ...config,
  };
  return new MisakeyUserManager(userManagerConfig);
}
