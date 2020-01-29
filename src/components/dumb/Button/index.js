import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

import withStyles from '@material-ui/core/styles/withStyles';
import MUIButton from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';

export const BUTTON_STANDINGS = {
  MAIN: 'main',
  OUTLINED: 'outlined',
  TEXT: 'text',
  CANCEL: 'cancel',

  MINOR: 'minor',
  MAJOR: 'major',
  ENHANCED: 'enhanced',
};

const BUTTON_PROPS_BY_STANDING = {
  [BUTTON_STANDINGS.MAIN]: {
    variant: 'contained',
    color: 'secondary',
  },
  [BUTTON_STANDINGS.OUTLINED]: {
    variant: 'outlined',
    color: 'secondary',
  },
  [BUTTON_STANDINGS.TEXT]: {
    variant: 'text',
    color: 'secondary',
  },
  [BUTTON_STANDINGS.CANCEL]: {
    variant: 'text',
    color: 'default',
  },
};

// HELPERS
const makeStyles = () => ({
  wrapper: {
    position: 'relative',
  },
  buttonRoot: {
    width: '100%',
  },
  buttonProgress: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },
});

const getDefaultProps = (standing) => {
  const props = BUTTON_PROPS_BY_STANDING[standing];
  return props || {};
};

// COMPONENTS
const Button = forwardRef(
  ({ classes, isLoading, isValid, text, progressProps, standing, ...rest }, ref) => (
    <span className={classes.wrapper}>
      <MUIButton
        ref={ref}
        classes={{ root: classes.buttonRoot }}
        {...getDefaultProps(standing)}
        disabled={isLoading || !isValid}
        {...rest}
      >
        {text}
      </MUIButton>
      {isLoading && (
      <CircularProgress size={24} className={classes.buttonProgress} {...progressProps} />
      )}
    </span>
  ),
);

Button.propTypes = {
  classes: PropTypes.objectOf(PropTypes.string),
  isLoading: PropTypes.bool,
  isValid: PropTypes.bool,
  progressProps: PropTypes.object,
  standing: PropTypes.oneOf(Object.values(BUTTON_STANDINGS)),
  text: PropTypes.string.isRequired,
};

Button.defaultProps = {
  classes: {},
  isLoading: false,
  isValid: true,
  progressProps: {},
  standing: BUTTON_STANDINGS.CANCEL,
};

export default withStyles(makeStyles)(Button);
