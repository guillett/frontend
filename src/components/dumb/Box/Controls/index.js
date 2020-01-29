import React, { useMemo, isValidElement } from 'react';
import PropTypes from 'prop-types';

import useTheme from '@material-ui/core/styles/useTheme';
import useMediaQuery from '@material-ui/core/useMediaQuery';

import Box from '@material-ui/core/Box';

import isNil from '@misakey/helpers/isNil';
import isObject from '@misakey/helpers/isObject';
import Button, { BUTTON_STANDINGS } from 'components/dumb/Button';

const BoxControls = ({ primary, secondary, outlined, ...rest }) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));

  const flexDirection = useMemo(
    () => (isXs ? 'column' : 'row'),
    [isXs],
  );

  const justifyContent = useMemo(
    () => (secondary ? 'space-between' : 'flex-end'),
    [secondary],
  );

  const standings = useMemo(
    () => (outlined
      ? { primary: BUTTON_STANDINGS.MAIN, secondary: BUTTON_STANDINGS.OUTLINED }
      : { primary: BUTTON_STANDINGS.TEXT, secondary: BUTTON_STANDINGS.CANCEL }
    ),
    [outlined],
  );

  const primaryNode = useMemo(
    () => {
      if (isValidElement(primary) || isNil(primary)) {
        return primary;
      }
      if (isObject(primary)) {
        return <Button standing={standings.primary} {...primary} />;
      }
      return null;
    },
    [standings, primary],
  );

  const secondaryNode = useMemo(
    () => {
      if (isValidElement(secondary) || isNil(secondary)) {
        return secondary;
      }
      if (isObject(secondary)) {
        return <Button standing={standings.secondary} {...secondary} />;
      }
      return null;
    },
    [standings, secondary],
  );

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection={flexDirection}
      justifyContent={justifyContent}
      {...rest}
    >
      {secondaryNode}
      {primaryNode}
    </Box>
  );
};

BoxControls.propTypes = {
  outlined: PropTypes.bool,
  primary: PropTypes.oneOfType([PropTypes.object, PropTypes.node]),
  secondary: PropTypes.oneOfType([PropTypes.object, PropTypes.node]),
};

BoxControls.defaultProps = {
  outlined: true,
  primary: null,
  secondary: null,
};

export default BoxControls;
