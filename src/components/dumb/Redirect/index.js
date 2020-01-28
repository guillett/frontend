import React from 'react';
import PropTypes from 'prop-types';
import { Redirect as RouterRedirect } from 'react-router-dom';
import isSameHost from '@misakey/helpers/isSameHost';
import isSamePage from 'helpers/isSamePage';
import parseUrlFromLocation from '@misakey/helpers/parseUrl/fromLocation';

// COMPONENTS
function Redirect({ forceRefresh, to, ...props }) {
  const { href, search, pathname } = parseUrlFromLocation(to);

  if (forceRefresh && isSamePage(href)) {
    window.location.reload();
    return null;
  }

  if (!isSameHost(href)) {
    window.location.replace(href);
    return null;
  }

  return <RouterRedirect {...props} to={`${pathname}${search}`} />;
}

Redirect.propTypes = {
  forceRefresh: PropTypes.bool,
  to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  ...RouterRedirect.propTypes,
};

Redirect.defaultProps = {
  forceRefresh: false,
};

export default Redirect;
