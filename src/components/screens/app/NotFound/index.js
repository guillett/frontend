import React from 'react';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

import ScreenError from 'components/smart/Screen/Error';

import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

// CONSTANTS
const NOT_FOUND_ERROR = new Error();
NOT_FOUND_ERROR.status = 404;

// COMPONENTS
function NotFound({ t }) {
  return (
    <ScreenError hideDefaultError hideRefreshAction>
      <Box mb={1}>
        <Typography align="center" variant="h2" color="secondary">{NOT_FOUND_ERROR.status}</Typography>
      </Box>
      <Typography align="center" variant="h5" component="h3" color="textSecondary">
        {t(`common:httpStatus.error.${NOT_FOUND_ERROR.status}`)}
      </Typography>
    </ScreenError>
  );
}

NotFound.propTypes = {
  t: PropTypes.func.isRequired,
};

export default withTranslation('common')(NotFound);
