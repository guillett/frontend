/**
 * We call "concrete" actions
 * actions that either return or dispatch "actual" actions,
 * an actual action being an object with an action type
 * (that is, not a thunk action).
 *
 * CAUTION: *Most* of the concrete actions
 * require the remote secret backup to be updated after they have been dispatched.
 * This is done by wrapping the action builder with "withBackupUpdater".
 */

import get from '@misakey/helpers/get';
import props from '@misakey/helpers/props';
import values from '@misakey/helpers/values';
import difference from '@misakey/helpers/difference';
import isEmpty from '@misakey/helpers/isEmpty';
import filter from '@misakey/helpers/filter';
import path from '@misakey/helpers/path';
import isString from '@misakey/helpers/isString';
import isNil from '@misakey/helpers/isNil';

import { updateSecretsBackup } from '../../secretsBackup';
import {
  encryptSecretsBackup,
} from '../../secretsBackup/encryption';
import {
  generateAsymmetricKeyPair,
  generateNewSaltedSymmetricKey,
} from '../../crypto';
import {
  NoNewSecretKeys,
  BadBackupVersion,
} from '../../Errors/classes';

// HELPERS

// @TODO move to a "helpers" directory?
/**
 * List secret keys in a snapshot of the cryptographic secrets of a user.
 * This function includes some security mechanisms
 * by guaranteeing that it returns a (flat) list of strings
 * (thanks to the use of the "filter" function)
 *
 * @param {object} secrets A snapshot of "store.getState().crypto.secrets"
 */
const listSecretKeys = (secrets) => [
  // picking keys individually
  ...filter(values(props(['secretKey'], secrets)), isString),
  // spreading lists (defaulting to empty list to avoid type errors)
  ...filter(get(secrets, 'passive.secretKeys', []), isString),
];

// ACTION TYPES
export const CRYPTO_LOAD_SECRETS = Symbol('CRYPTO_LOAD_SECRETS');
export const CRYPTO_SET_BACKUP_KEY = Symbol('CRYPTO_SET_BACKUP_KEY');
export const CRYPTO_IMPORT_SECRET_KEYS = Symbol('CRYPTO_IMPORT_SECRET_KEYS');
export const CRYPTO_INITIALIZE = Symbol('CRYPTO_INITIALIZE');
export const CRYPTO_SET_BACKUP_VERSION = Symbol('CRYPTO_SET_BACKUP_VERSION');
export const CRYPTO_ADD_BOX_SECRET_KEY = Symbol('CRYPTO_ADD_BOX_SECRET_KEY');
export const CRYPTO_REMOVE_BOX_SECRET_KEYS = Symbol('CRYPTO_REMOVE_BOX_SECRET_KEYS');
export const CRYPTO_SET_ENCRYPTED_BACKUP_DATA = Symbol('CRYPTO_SET_ENCRYPTED_BACKUP_DATA');
export const CRYPTO_SET_BACKUP_KEY_SHARE = Symbol('CRYPTO_SET_BACKUP_KEY_SHARE');
export const CRYPTO_SET_BOX_KEY_SHARE = Symbol('CRYPTO_SET_BACKUP_KEY_SHARE');
export const CRYPTO_REMOVE_BOX_KEY_SHARES = Symbol('CRYPTO_REMOVE_BOX_KEY_SHARES');

// ACTION BUILDERS
// @FIXME maybe apply "withBackupUpdater" later
// to make it more obvious that it is required?
// I am not sure how I would name the non-exported entities, though

export const setBackupVersion = (version) => ({
  type: CRYPTO_SET_BACKUP_VERSION,
  version,
});

/**
 * Decorates an action builder
 * and returns a thunk that will dispatch the action
 * then update the remote secrets backup.
 *
 * Almost all actions related to crypto should be made using this decorator
 *
 * TODO find a way to add a parameter for action caller to disable backup updater?
 * This would be useful for instance for "setBackupKey".
 * @param {function} actionBuilder
 */
export const withBackupUpdater = (actionBuilder) => (...args) => (
  async (dispatch, getState) => {
    await dispatch(actionBuilder(...args));

    const state = getState();

    // @FIXME declare a "selector" in auth package in charge of retrieving the identity?
    if (isEmpty(path(['auth', 'identity', 'accountId'], state))) {
      // no account => no backup possible
      return null;
    }

    const { accountId } = state.auth.identity;
    const { secrets, backupKey, backupVersion } = state.crypto;
    if (!isNil(backupKey)) {
      const newBackupVersion = backupVersion + 1;
      return updateSecretsBackup(accountId, secrets, backupKey, newBackupVersion)
        .then(() => Promise.resolve(dispatch(setBackupVersion(newBackupVersion))))
        .catch((e) => {
          if (e.details && (e.details.version === 'invalid')) {
            throw new BadBackupVersion();
          }
          throw e;
        });
    }
    return null;
  }
);

/**
 * This action has **no automatic backup update**
 * because right now it is only called by password change
 * where backup is updated through the "PUT password" call.
 * There *shouldn't be* any other parts of the code dispatching this action
 * but if one day there is we must be careful to see if auto backup update is needed or not.
 * See also comment on "withBackupUpdater".
 */
export const setBackupKey = (backupKey) => ({
  type: CRYPTO_SET_BACKUP_KEY,
  backupKey,
});

export const importKeys = withBackupUpdater((secretsToImport) => (
  async (dispatch, getState) => {
    const cryptoState = getState().crypto;
    // (using plural because in the future there may be several)
    const currentActiveSecretKeys = [
      cryptoState.secrets.secretKey,
    ];
    const currentPassiveSecretKeys = [
      ...cryptoState.secrets.passive.secretKeys,
    ];

    const potentiallyNewSecretKeys = listSecretKeys(secretsToImport);

    const actuallyNewSecretKeys = difference(
      potentiallyNewSecretKeys,
      [
        ...currentActiveSecretKeys,
        ...currentPassiveSecretKeys,
      ],
    );

    if (isEmpty(actuallyNewSecretKeys)) {
      throw new NoNewSecretKeys(potentiallyNewSecretKeys);
    }

    dispatch({
      type: CRYPTO_IMPORT_SECRET_KEYS,
      secretKeys: actuallyNewSecretKeys,
    });
  }
));

/**
 * Creates a new set of secrets for a data owner.
 *
 * **No backup update** (backup update is handled by application code
 * using the values returned by this thunk)
 * @param {string} password
 */
export function createNewOwnerSecrets(password) {
  return async (dispatch, getState) => {
    const { secretKey, publicKey } = generateAsymmetricKeyPair();

    const backupKey = await generateNewSaltedSymmetricKey(password);

    dispatch({
      type: CRYPTO_INITIALIZE,
      secretKey,
      backupKey,
    });

    const encryptedSecrets = encryptSecretsBackup(
      getState().crypto.secrets,
      backupKey,
    );

    // return value is more important than what is dispatched in this thunk
    // because application code uses the returned data to send it to the server.
    // We could avoid dispatching and it shouldn't break anything,
    // it would simply require the user to "open her vault"
    // the first time she wants to do an operation requiring crypto.
    // We still use dispatch so that crypto initialization is part of Redux state management.
    // This allows, among other things, to test that the state we create on initialization
    // will be correctly interpreted by functions reading the store.
    return {
      backupKey,
      backupData: encryptedSecrets,
      pubkeyData: publicKey,
    };
  };
}

/**
 * add a new secret key for a data owner.
 *
 * @param {string} secretKey
 */
const addBoxSecretKeyWithoutUpdate = (secretKey) => ({
  type: CRYPTO_ADD_BOX_SECRET_KEY,
  secretKey,
});

export const addBoxSecretKey = withBackupUpdater(addBoxSecretKeyWithoutUpdate);

const removeBoxSecretKeysWithoutUpdate = (secretKeys) => ({
  type: CRYPTO_REMOVE_BOX_SECRET_KEYS,
  secretKeys,
});
export const removeBoxSecretKeys = withBackupUpdater(removeBoxSecretKeysWithoutUpdate);

const removeBoxKeySharesWithoutUpdate = (boxIds) => ({
  type: CRYPTO_REMOVE_BOX_KEY_SHARES,
  boxIds,
});

export const removeBoxSecretKeysAndKeyShares = withBackupUpdater(
  ({ secretKeys, boxIds }) => (dispatch) => {
    if (isEmpty(secretKeys)) {
      return Promise.resolve(dispatch(removeBoxKeySharesWithoutUpdate(boxIds)));
    }

    if (isEmpty(boxIds)) {
      return Promise.resolve(dispatch(removeBoxSecretKeysWithoutUpdate(secretKeys)));
    }

    return Promise.all([
      dispatch(removeBoxKeySharesWithoutUpdate(boxIds)),
      dispatch(removeBoxSecretKeysWithoutUpdate(secretKeys)),
    ]);
  },
);

/**
 * loads secrets and update backup for a data owner.
 *
 * @param {string} secretKey
 */
export const loadSecretsAndUpdateBackup = withBackupUpdater(({
  secrets,
  backupKey,
  backupVersion,
}) => ({
  type: CRYPTO_LOAD_SECRETS,
  secrets,
  backupKey,
  backupVersion,
}));


/**
 * loads secrets for a data owner.
 *
 * @param {string} secretKey
 */
export const loadSecrets = ({
  secrets,
  backupKey,
  backupVersion,
}) => ({
  type: CRYPTO_LOAD_SECRETS,
  secrets,
  backupKey,
  backupVersion,
});

export const storeEncryptedBackupData = ({ data, backupVersion }) => ({
  type: CRYPTO_SET_ENCRYPTED_BACKUP_DATA,
  data,
  backupVersion,
});

export const setBackupKeyShare = ({ backupKeyShare, accountId }) => ({
  type: CRYPTO_SET_BACKUP_KEY_SHARE,
  backupKeyShare,
  accountId,
});

const setBoxKeyShareWithoutUpdate = ({ boxId, keyShare }) => ({
  type: CRYPTO_SET_BOX_KEY_SHARE,
  boxId,
  keyShare,
});

export const setBoxKeyShare = withBackupUpdater(setBoxKeyShareWithoutUpdate);

export const boxAddSecretKeySetKeyShare = withBackupUpdater(
  ({ secretKey, boxId, keyShare }) => (dispatch) => {
    if (isNil(secretKey)) {
      return Promise.resolve(dispatch(setBoxKeyShareWithoutUpdate({ boxId, keyShare })));
    }

    if (isNil(boxId)) {
      return Promise.resolve(dispatch(addBoxSecretKeyWithoutUpdate(secretKey)));
    }

    return Promise.all([
      dispatch(setBoxKeyShareWithoutUpdate({ boxId, keyShare })),
      dispatch(addBoxSecretKeyWithoutUpdate(secretKey)),
    ]);
  },
);
