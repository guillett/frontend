import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

import { BUTTON_BORDER_RADIUS } from 'constants/app/boxes/layout';

import isEmpty from '@misakey/helpers/isEmpty';
import isNil from '@misakey/helpers/isNil';

import usePublicKeysWeCanDecryptFrom from '@misakey/crypto/hooks/usePublicKeysWeCanDecryptFrom';
import decryptFileMsg from '@misakey/crypto/box/decryptFileMsg';

import EventCard from 'components/dumb/Event/Card';
import ButtonDownloadBlob from 'components/smart/Button/Download/Blob';
import EventBoxMessagePreview from 'components/dumb/Event/Box/Message/Preview';

import EventSchema from 'store/schemas/Boxes/Events';
import formatFileSize from 'helpers/formatFileSize';
import makeStyles from '@material-ui/core/styles/makeStyles';

const useStyles = makeStyles(() => ({
  buttonDownloadRoot: {
    borderRadius: BUTTON_BORDER_RADIUS,
  },
}));

// COMPONENTS
const BoxMessageFileEvent = ({ event, boxID, isFromCurrentUser, preview, t, ...rest }) => {
  const classes = useStyles();
  const {
    sender,
    content: { encrypted, encryptedFileId, publicKey },
  } = useMemo(() => event, [event]);
  const { displayName } = useMemo(() => sender || {}, [sender]);

  const publicKeysWeCanDecryptFrom = usePublicKeysWeCanDecryptFrom();

  const {
    canBeDecrypted,
    decryptedContent,
    text,
  } = useMemo(
    () => {
      const secretKey = publicKeysWeCanDecryptFrom.get(publicKey);

      if (isEmpty(secretKey)) {
        return {
          canBeDecrypted: false,
          text: t('common:encrypted'),
        };
      }

      // I don't think we have the choice not to shadow "decryptedContent"
      // eslint-disable-next-line no-shadow
      const decryptedContent = decryptFileMsg(encrypted, secretKey);
      const { fileName, fileSize } = decryptedContent;
      const formattedSize = formatFileSize(fileSize);

      return {
        canBeDecrypted: true,
        decryptedContent,
        text: !isNil(formattedSize) ? `${fileName} (${formattedSize})` : fileName,
      };
    },
    [publicKeysWeCanDecryptFrom, publicKey, encrypted, t],
  );

  if (preview) {
    return (
      <EventBoxMessagePreview
        isFromCurrentUser={isFromCurrentUser}
        displayName={displayName}
        text={text}
      />
    );
  }

  return (
    <EventCard
      author={sender}
      isFromCurrentUser={isFromCurrentUser}
      text={text}
      actions={canBeDecrypted && (
        <ButtonDownloadBlob
          boxID={boxID}
          encryptedFileId={encryptedFileId}
          decryptedContent={decryptedContent}
          classes={{ root: classes.buttonDownloadRoot }}
        />
      )}
      {...rest}
    />
  );
};

BoxMessageFileEvent.propTypes = {
  isFromCurrentUser: PropTypes.bool,
  preview: PropTypes.bool,
  event: PropTypes.shape(EventSchema.propTypes).isRequired,
  boxID: PropTypes.string.isRequired,
  t: PropTypes.func.isRequired,
};

BoxMessageFileEvent.defaultProps = {
  isFromCurrentUser: false,
  preview: false,
};

export default withTranslation('boxes')(BoxMessageFileEvent);
