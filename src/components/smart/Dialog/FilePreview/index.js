import React, { useState, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import clsx from 'clsx';

import downloadFile from '@misakey/helpers/downloadFile';
import isNil from '@misakey/helpers/isNil';
import useFetchEffect from '@misakey/hooks/useFetch/effect';

import SplashScreen from '@misakey/ui/Screen/Splash/WithTranslation';

import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import Toolbar from '@material-ui/core/Toolbar';
import Tooltip from '@material-ui/core/Tooltip';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import ArrowBack from '@material-ui/icons/ArrowBack';
import DownloadIcon from '@material-ui/icons/GetApp';
// import PrintIcon from '@material-ui/icons/Print';
import IconButtonAppBar from 'components/dumb/IconButton/Appbar';
import BoxFile from 'components/dumb/Box/File';

// CONSTANTS
const ALLOWED_TYPE_PREVIEW = [
  'audio/',
  'video/',
  'image/',
  'text/csv',
  'text/plain',
  'application/json',
  'application/pdf',
];

const APPBAR_HEIGHT = 64;
const PADDING = 64;

// HOOKS
const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: APPBAR_HEIGHT,
  },
  transparentBg: {
    backgroundColor: 'transparent',
  },
  appBar: {
    backgroundColor: theme.palette.grey[900],
  },
  content: {
    display: 'flex',
    justifyContent: 'center',
    padding: 0,
  },
  media: {
    maxWidth: '100%',
    maxHeight: `calc(100vh - ${APPBAR_HEIGHT}px - ${PADDING}px)`,
  },
  embed: ({ isLoaded }) => (isLoaded ? {
    width: '100%',
    height: `calc(100vh - ${APPBAR_HEIGHT}px - ${PADDING}px)`,
  } : {
    width: 0,
    height: 0,
  }),
}));

// HELPERS
const createBlobUrl = (file) => {
  try {
    const urlBuilder = window.URL || window.webkitURL;
    return urlBuilder.createObjectURL(file);
  } catch (err) {
    return null;
  }
};

const revokeBlobUrl = (file) => {
  try {
    const urlBuilder = window.URL || window.webkitURL;
    return urlBuilder.revokeObjectURL(file);
  } catch (err) {
    return null;
  }
};

function FilePreviewDialog({ t, open, onClose, onGetDecryptedFile, fileSize, fileName, fileType }) {
  const [file, setFile] = useState();
  const [blobUrl, setBlobUrl] = useState();
  const [hasError, setHasError] = useState(false);

  const isMediaAudioOrVideo = useMemo(
    () => (isNil(fileType) ? false : fileType.startsWith('audio') || fileType.startsWith('video')),
    [fileType],
  );
  // Fallback for video and audio is handled inside tags
  const [isLoaded, setIsLoaded] = useState(isMediaAudioOrVideo);
  const classes = useStyles({ isLoaded });

  const onDownload = useCallback(() => downloadFile(file, file.name), [file]);

  const onSuccess = useCallback((decryptedFile) => {
    setFile(decryptedFile);
  }, []);

  const onError = useCallback(() => {
    setHasError(true);
  }, []);

  const onLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const { isFetching } = useFetchEffect(
    onGetDecryptedFile,
    { shouldFetch: open },
    { onSuccess, onError },
  );

  useEffect(() => {
    if (!isNil(file)) {
      setBlobUrl(createBlobUrl(file));
    }
    return () => {
      revokeBlobUrl(file);
    };
  }, [file]);

  const isTypeAllowedForPreview = useMemo(
    () => !isNil(fileType) && ALLOWED_TYPE_PREVIEW.some((type) => fileType.startsWith(type)),
    [fileType],
  );

  const displayDefault = useMemo(
    () => !isFetching && (isNil(blobUrl) || hasError || !isLoaded),
    [blobUrl, hasError, isFetching, isLoaded],
  );

  const displayPreview = useMemo(
    () => !isFetching && isTypeAllowedForPreview && (!isNil(blobUrl) && !hasError),
    [blobUrl, hasError, isFetching, isTypeAllowedForPreview],
  );

  const preview = useMemo(() => {
    if (isNil(fileType)) {
      return null;
    }
    if (fileType.startsWith('image')) {
      return (
        <img
          src={blobUrl}
          alt={fileName}
          className={classes.media}
          onLoad={onLoad}
          onError={onError}
        />
      );
    }

    if (fileType.startsWith('audio')) {
      return (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio controls>
          <source src={blobUrl} type={fileType} />
          <BoxFile
            fileSize={fileSize}
            fileName={fileName}
            fileType={fileType}
            text={t('components:filePreview.errors.unavailable')}
            isLarge
            typographyProps={{ variant: 'body1' }}
          />
        </audio>
      );
    }

    if (fileType.startsWith('video')) {
      return (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video controls className={classes.media}>
          <source src={blobUrl} type={fileType} />
          <BoxFile
            fileSize={fileSize}
            fileName={fileName}
            fileType={fileType}
            text={t('components:filePreview.errors.unavailable')}
            isLarge
            typographyProps={{ variant: 'body1' }}
          />
        </video>
      );
    }

    return (
      <embed
        title={fileName}
        className={classes.embed}
        src={blobUrl}
        type={fileType}
        onLoad={onLoad}
      />
    );
  }, [blobUrl, classes.embed, classes.media, fileName, fileSize, fileType, onError, onLoad, t]);

  const isMediaDisplayed = useMemo(
    () => (fileType.startsWith('image') && !hasError) || isMediaAudioOrVideo,
    [fileType, hasError, isMediaAudioOrVideo],
  );

  const dialogProps = useMemo(() => {
    if (isFetching || isMediaDisplayed) {
      return {};
    }
    return {
      fullWidth: true,
      maxWidth: 'md',
    };
  }, [isFetching, isMediaDisplayed]);

  const PaperProps = useMemo(() => {
    if (isFetching || displayDefault) {
      return {
        className: clsx(classes.paper, classes.transparentBg),
        elevation: 0,
      };
    }
    return {
      className: classes.paper,
    };
  }, [classes.paper, classes.transparentBg, displayDefault, isFetching]);

  return (
    <Dialog
      maxWidth="md"
      open={open}
      onClose={onClose}
      scroll="body"
      PaperProps={PaperProps}
      {...dialogProps}
    >
      <AppBar className={classes.appBar}>
        <Toolbar>
          <IconButtonAppBar
            color="inherit"
            aria-label={t('common:goBack')}
            edge="start"
            onClick={onClose}
          >
            <Tooltip title={t('common:goBack')}>
              <ArrowBack />
            </Tooltip>
          </IconButtonAppBar>

          <Box flexGrow={1} />
          {!isNil(blobUrl) && (
            <>
              <IconButtonAppBar
                color="inherit"
                aria-label={t('common:download')}
                edge="end"
                onClick={onDownload}
              >
                <Tooltip title={t('common:download')}>
                  <DownloadIcon />
                </Tooltip>

              </IconButtonAppBar>

              {/* <IconButtonAppBar
                color="inherit"
                aria-label={t('common:print')}
                edge="end"
                onClick={() => {
                  printBlobUrl(blobUrl);
                }}
              >
                <Tooltip title={t('common:print')}>
                  <PrintIcon />
                </Tooltip>
              </IconButtonAppBar> */}
            </>
          )}
        </Toolbar>
      </AppBar>
      <DialogContent className={classes.content}>
        {isFetching && <SplashScreen />}
        {displayPreview && preview}
        {displayDefault && (
          <BoxFile
            fileSize={fileSize}
            fileName={fileName}
            fileType={fileType}
            text={isNil(blobUrl)
              ? t('components:filePreview.errors.noFile')
              : t('components:filePreview.errors.unavailable')}
            isLarge
            typographyProps={{ variant: 'body1' }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}


FilePreviewDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  fileSize: PropTypes.number,
  fileType: PropTypes.string,
  fileName: PropTypes.string,
  onGetDecryptedFile: PropTypes.func.isRequired,
};

FilePreviewDialog.defaultProps = {
  fileSize: null,
  fileType: null,
  fileName: 'Untitled',
};

export default withTranslation(['common', 'components'])(FilePreviewDialog);
