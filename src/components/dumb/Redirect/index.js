import React from 'react';
import PropTypes from 'prop-types';
import { Redirect as RouterRedirect } from 'react-router-dom';
import isSameHost from '@misakey/helpers/isSameHost';
import isSamePage from '@misakey/helpers/isSamePage';
import parseUrlFromLocation from '@misakey/helpers/parseUrl/fromLocation';


// COMPONENTS
function Redirect({ forceRefresh, to, manualRedirectPlaceholder, ...props }) {
  const { href } = parseUrlFromLocation(to);

  if (forceRefresh && isSamePage(href)) {
    window.location.reload();
    return manualRedirectPlaceholder;
  }

  if (!isSameHost(href) || forceRefresh) {
    window.location.replace(href);
    return manualRedirectPlaceholder;
  }

  return <RouterRedirect {...props} to={to} />;
}

Redirect.propTypes = {
  forceRefresh: PropTypes.bool,
  to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  manualRedirectPlaceholder: PropTypes.object,
  ...RouterRedirect.propTypes,
};

Redirect.defaultProps = {
  forceRefresh: false,
  manualRedirectPlaceholder: null,
};

export default Redirect;
