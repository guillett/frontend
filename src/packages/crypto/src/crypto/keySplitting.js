/**
 * We call "key splitting" the application of
 * cryptographic secret sharing to secret keys
 * because "key sharing" already has another meaning.
 *
 * The Misakey share has **the hash of** the other share attached to it
 * as a practical way for the frontend
 * to tell the backend which share it wants to download.
 */

import { hash } from 'tweetnacl';

import { encodeBase64, decodeBase64 } from '../helpers/base64';

import { share, combine } from './core/secretSharing';

const hashBinaryShare = (theShare) => (
  encodeBase64(hash(theShare), { urlSafe: true })
);

export function splitKey(key) {
  const { shareOne, shareTwo } = share(
    decodeBase64(key, { urlSafe: true }),
  );

  return {
    userShare: encodeBase64(shareOne, { urlSafe: true }),
    misakeyShare: {
      share: encodeBase64(shareTwo, { urlSafe: false }),
      otherShareHash: hashBinaryShare(shareOne),
    },
  };
}

export const hashShare = (theShare) => (
  hashBinaryShare(decodeBase64(theShare, { urlSafe: true }))
);

export function combineShares(userShare, misakeyShare) {
  const key = combine(
    decodeBase64(userShare, { urlSafe: true }),
    decodeBase64(misakeyShare.share, { urlSafe: false }),
  );

  return encodeBase64(key, { urlSafe: true });
}
