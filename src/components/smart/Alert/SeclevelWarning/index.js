import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { authSeclevelWarningHide } from 'store/actions/warning';
import PropTypes from 'prop-types';

import isNil from '@misakey/helpers/isNil';
import Alert from '@misakey/ui/Alert';
import Button, { BUTTON_STANDINGS } from '@misakey/ui/Button';
import ButtonConnect from 'components/dumb/Button/Connect';

const SecLevelWarningAlert = ({
  seclevelWarningShow,
  requiredSeclevel,
  hideSeclevelWarning,
  t,
}) => {
  const authProps = useMemo(
    () => (isNil(requiredSeclevel) ? { acr_values: requiredSeclevel, prompt: 'login' } : { prompt: 'login' }),
    [requiredSeclevel],
  );
  return (
    <Alert
      dialogActions={(
        <>
          <Button onClick={hideSeclevelWarning} text={t('common:cancel')} />
          <Button
            standing={BUTTON_STANDINGS.MAIN}
            authProps={authProps}
            component={ButtonConnect}
            text={t('common:signIn')}
          />
        </>
      )}
      onClose={hideSeclevelWarning}
      open={seclevelWarningShow}
      text={t('components:alert.seclevel.text')}
      title={t('components:alert.seclevel.title')}
    />
  );
};

SecLevelWarningAlert.propTypes = {
  seclevelWarningShow: PropTypes.bool,
  requiredSeclevel: PropTypes.string,
  hideSeclevelWarning: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

SecLevelWarningAlert.defaultProps = {
  seclevelWarningShow: false,
  requiredSeclevel: null,
};


const mapDispatchToProps = (dispatch) => ({
  hideSeclevelWarning: () => dispatch(authSeclevelWarningHide()),
});

const mapStateToProps = (state) => ({ ...state.warning });

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withTranslation(['common', 'components'])(SecLevelWarningAlert));
