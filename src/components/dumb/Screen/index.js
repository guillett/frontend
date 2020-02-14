import React, { useEffect, useMemo } from 'react';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import clsx from 'clsx';

import omit from '@misakey/helpers/omit';
import isEmpty from '@misakey/helpers/isEmpty';

import { makeStyles } from '@material-ui/core/styles';
import { MIN_PX_0_LANDSCAPE, MIN_PX_600 } from '@misakey/ui/constants/medias';

import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import LinearProgress from '@material-ui/core/LinearProgress';

import HourglassEmptyIcon from '@material-ui/icons/HourglassEmpty';
import ErrorIcon from '@material-ui/icons/Error';

import AppBar from 'components/dumb/AppBar';
import { isDesktopDevice } from '@misakey/helpers/devices';
import { IS_PLUGIN } from 'constants/plugin';

const useBoxStyles = makeStyles({
  root: { height: '100%' },
});

const BOX_PROPS = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  textAlign: 'center',
};

function DefaultSplashScreen({ t, text }) {
  const classes = useBoxStyles();

  return (
    <Box className={classes.root} {...BOX_PROPS}>
      <Container maxWidth="md">
        <Box mb={1}>
          <HourglassEmptyIcon fontSize="large" color="secondary" />
        </Box>
        <Typography variant="h5" component="h3" color="textSecondary">
          {text || t('loading')}
        </Typography>
      </Container>
    </Box>
  );
}

DefaultSplashScreen.propTypes = {
  t: PropTypes.func.isRequired,
  text: PropTypes.string,
};

DefaultSplashScreen.defaultProps = {
  text: null,
};

const DefaultSplashScreenWithTranslation = withTranslation()(DefaultSplashScreen);

export { DefaultSplashScreenWithTranslation as DefaultSplashScreen };

// The string representing the message/name is lazily generated
// when the error.message/name property is accessed.
function ScreenError({ error, t }) {
  const classes = useBoxStyles();

  return (
    <Box className={classes.root} {...BOX_PROPS}>
      <Container maxWidth="md">
        <Box mb={1}>
          {!error.status && <ErrorIcon fontSize="large" color="secondary" />}
          {error.status && <Typography variant="h2" color="secondary">{error.status}</Typography>}
        </Box>
        <Typography variant="h5" component="h3" color="textSecondary">
          {t([
            `${error.name}.${error.message}`,
            `httpStatus.error.${error.status}`,
            'httpStatus.error.default',
          ])}
        </Typography>
      </Container>
    </Box>
  );
}

ScreenError.propTypes = {
  error: PropTypes.shape({
    message: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    status: PropTypes.number,
  }).isRequired,
  t: PropTypes.func.isRequired,
};

const ScreenErrorWithTranslation = withTranslation()(ScreenError);

export const SCREEN_STATES = {
  IS_INITIATING: Symbol('IS_INITIATING'),
  HAS_ERROR: Symbol('HAS_ERROR'),
  OK: Symbol('OK'),
};

function StateWrapper({
  children, error, isLoading, splashScreenText, preventSplashScreen, splashScreen,
}) {
  const currentState = useMemo(() => {
    if (isLoading && !preventSplashScreen) { return SCREEN_STATES.IS_INITIATING; }
    if (error instanceof Error) { return SCREEN_STATES.HAS_ERROR; }

    return SCREEN_STATES.OK;
  }, [error, isLoading, preventSplashScreen]);

  switch (currentState) {
    case SCREEN_STATES.IS_INITIATING:
      return splashScreen || <DefaultSplashScreenWithTranslation text={splashScreenText} />;
    case SCREEN_STATES.HAS_ERROR:
      return <ScreenErrorWithTranslation error={error} />;
    default:
      return children;
  }
}

StateWrapper.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.array]).isRequired,
  error: PropTypes.instanceOf(Error),
  isLoading: PropTypes.bool,
  metas: PropTypes.objectOf(PropTypes.any),
  preventSplashScreen: PropTypes.bool,
  splashScreen: PropTypes.node,
  splashScreenText: PropTypes.string,
};

StateWrapper.defaultProps = {
  error: null,
  isLoading: false,
  metas: {},
  preventSplashScreen: false,
  splashScreen: null,
  splashScreenText: null,
};

const GUTTERS_SPACING = 3;

function getRootStyle(theme, options = {}, hideAppBar = false) {
  const { media, gutters = false, fixedHeight = false } = options;

  const spacing = theme.spacing(gutters ? GUTTERS_SPACING : 0);
  const toolbar = theme.mixins.toolbar[media] || theme.mixins.toolbar;

  const isPopupPlugin = IS_PLUGIN && isDesktopDevice();

  const minWidth = '100%';
  const minHeight = `calc(100vh - ${hideAppBar ? 0 : toolbar.minHeight}px - ${2 * spacing}px)`;
  const paddingTop = `calc(${hideAppBar ? 0 : toolbar.minHeight}px + ${spacing}px)`;

  if (isPopupPlugin) {
    return { paddingTop, height: minHeight };
  }

  return {
    minWidth,
    minHeight,
    height: fixedHeight ? minHeight : 'auto',
    width: '100%',
    paddingTop,
    paddingBottom: spacing,
  };
}

function getToolbarHeight(theme, media = null, options = {}) {
  const { gutters = false, hideAppBar = false } = options;
  if (hideAppBar) { return 0; }
  const spacing = theme.spacing(gutters ? GUTTERS_SPACING : 0);

  const toolbarHeight = (theme.mixins.toolbar[media] || theme.mixins.toolbar).minHeight;
  return gutters ? toolbarHeight + spacing : toolbarHeight;
}

export function getStyleForContainerScroll(
  theme,
  extraFixedSize = 0,
  options = {},
  media = [MIN_PX_0_LANDSCAPE, MIN_PX_600, 'main'],
) {
  const style = {
    [MIN_PX_0_LANDSCAPE]: {
      height: `calc(100vh - ${getToolbarHeight(theme, MIN_PX_0_LANDSCAPE, options)}px - ${extraFixedSize}px)`,
    },
    [MIN_PX_600]: {
      height: `calc(100vh - ${getToolbarHeight(theme, MIN_PX_600, options)}px - ${extraFixedSize}px)`,
    },
    main: {
      height: `calc(100vh - ${getToolbarHeight(theme, null, options)}px - ${extraFixedSize}px)`,
      overflowY: 'auto',
    },
  };

  return {
    ...(media.includes(MIN_PX_0_LANDSCAPE) ? style[MIN_PX_0_LANDSCAPE] : {}),
    ...(media.includes(MIN_PX_600) ? style[MIN_PX_600] : {}),
    ...(media.includes('main') ? style.main : {}),
  };
}

const useScreenStyles = makeStyles((theme) => ({
  /* ROOT SCREEN SIZES */
  root: ({ hideAppBar }) => ({
    [MIN_PX_0_LANDSCAPE]: getRootStyle(theme, { media: MIN_PX_0_LANDSCAPE }, hideAppBar),
    [MIN_PX_600]: getRootStyle(theme, { media: MIN_PX_600 }, hideAppBar),
    ...getRootStyle(theme, {}, hideAppBar),
  }),
  gutters: ({ hideAppBar }) => ({
    [MIN_PX_0_LANDSCAPE]: getRootStyle(
      theme,
      { media: MIN_PX_0_LANDSCAPE, gutters: true },
      hideAppBar,
    ),
    [MIN_PX_600]: getRootStyle(theme, { media: MIN_PX_600, gutters: true }, hideAppBar),
    ...getRootStyle(theme, { gutters: true }, hideAppBar),
  }),
  fixedHeight: ({ hideAppBar }) => ({
    [MIN_PX_0_LANDSCAPE]: getRootStyle(
      theme,
      { media: MIN_PX_0_LANDSCAPE, fixedHeight: true },
      hideAppBar,
    ),
    [MIN_PX_600]: getRootStyle(theme, { media: MIN_PX_600, fixedHeight: true }, hideAppBar),
    ...getRootStyle(theme, { fixedHeight: true }, hideAppBar),
    display: 'flex',
    flexDirection: 'column',
  }),
  /* END OF ROOT SCREEN SIZES */

  progress: {
    position: 'fixed',
    width: '100%',
    top: 0,
    zIndex: theme.zIndex.tooltip,
  },
}));

/**
 * This function has no effect on SEO but just improves UX.
 * @param title
 * @param description
 */
function updateHead(title, description) {
  if (!isEmpty(title)) { document.title = title; }
  if (!isEmpty(description)) { document.description = description; }

  return () => {
    document.title = 'Misakey';
    document.description = '';
  };
}

function Screen({
  appBarProps,
  children,
  className,
  description,
  disableGutters,
  fullHeight,
  hideAppBar,
  preventSplashScreen,
  splashScreen,
  state,
  title,
  ...rest
}) {
  const classes = useScreenStyles({ hideAppBar });

  const isLoading = useMemo(
    () => state.isLoading || state.isFetching,
    [state.isLoading, state.isFetching],
  );

  useEffect(() => updateHead(title, description), [description, title]);

  return (
    <>
      {isLoading && (
        <LinearProgress
          className={classes.progress}
          color="secondary"
          variant="query"
        />
      )}
      {!hideAppBar && (
        <AppBar
          {...appBarProps}
        />
      )}
      <Box
        component="div"
        className={clsx(classes.root, className, {
          [classes.gutters]: !disableGutters,
          [classes.fixedHeight]: fullHeight,
        })}
        {...omit(rest, ['staticContext', 'match'])}
      >
        <StateWrapper
          splashScreen={splashScreen}
          preventSplashScreen={preventSplashScreen}
          {...state}
          isLoading={isLoading}
        >
          {children}
        </StateWrapper>
      </Box>
    </>
  );
}

export const SCREEN_STATE_PROPTYPES = PropTypes.shape({
  error: PropTypes.instanceOf(Error),
  isFetching: PropTypes.bool,
  isLoading: PropTypes.bool,
  metas: PropTypes.objectOf(PropTypes.any),
});

Screen.propTypes = {
  appBarProps: PropTypes.objectOf(PropTypes.any),
  children: PropTypes.node,
  className: PropTypes.string,
  description: PropTypes.string,
  disableGutters: PropTypes.bool,
  fullHeight: PropTypes.bool,
  hideAppBar: PropTypes.bool,
  preventSplashScreen: PropTypes.bool,
  splashScreen: PropTypes.node,
  state: SCREEN_STATE_PROPTYPES,
  title: PropTypes.string,
};

Screen.defaultProps = {
  appBarProps: { items: [] },
  children: null,
  className: '',
  description: '',
  disableGutters: false,
  fullHeight: false,
  hideAppBar: false,
  preventSplashScreen: false,
  splashScreen: null,
  state: {},
  title: '',
};

export default Screen;
