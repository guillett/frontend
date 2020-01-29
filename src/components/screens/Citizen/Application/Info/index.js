import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import { withTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import clsx from 'clsx';

import API from '@misakey/api';
import ApplicationSchema from 'store/schemas/Application';

import routes from 'routes';
import { Route, Switch, Redirect, generatePath } from 'react-router-dom';

import { IS_PLUGIN } from 'constants/plugin';

import compose from '@misakey/helpers/compose';
import prop from '@misakey/helpers/prop';
import head from '@misakey/helpers/head';
import objectToSnakeCase from '@misakey/helpers/objectToSnakeCase';

import useHandleGenericHttpErrors from 'hooks/useHandleGenericHttpErrors';

import isNil from '@misakey/helpers/isNil';
import Container from '@material-ui/core/Container';
import Box from '@material-ui/core/Box';

import Screen, { getStyleForContainerScroll } from 'components/dumb/Screen';
import ApplicationInfoNav from 'components/screens/Citizen/Application/Info/Nav';
import ApplicationVault from 'components/screens/Citizen/Application/Info/Vault';
import UserContributionDialog from 'components/smart/UserContributionDialog';

import Feedback from 'components/screens/Citizen/Application/Info/Feedback';
import Legal from 'components/screens/Citizen/Application/Info/Legal';
import More from 'components/screens/Citizen/Application/Info/More';

import Footer from 'components/dumb/Footer';

const NAV_BAR_HEIGHT = 33;

// STYLES
const useStyles = makeStyles((theme) => ({
  content: {
    padding: theme.spacing(0, 2),
  },
  pluginContent: getStyleForContainerScroll(theme, NAV_BAR_HEIGHT),
  screen: {
    display: 'flex',
    justifyContent: 'center',
  },
  container: {
    marginTop: NAV_BAR_HEIGHT,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  nav: {
    padding: '0 1rem',
  },
}));

// CONSTANTS
const ENDPOINTS = {
  applicationContribution: {
    create: {
      method: 'POST',
      path: '/application-contributions',
      auth: true,
    },
  },
  userApplication: {
    read: {
      method: 'GET',
      path: '/user-applications',
      auth: true,
    },
    create: {
      method: 'POST',
      path: '/user-applications',
      auth: true,
    },
    delete: {
      method: 'DELETE',
      path: '/user-applications/:id',
      auth: true,
    },
  },
};

// HELPERS

const getUserApplicationId = compose(
  prop('id'),
  head,
);

const createUserApplication = (form) => API
  .use(ENDPOINTS.userApplication.create)
  .build(null, objectToSnakeCase(form))
  .send();


// COMPONENTS
function ApplicationInfo({
  userId, entity, isAuthenticated,
  isFetching, match, t, screenProps,
}) {
  const classes = useStyles();
  const [isOpenUserContributionDialog, setOpenUserContributionDialog] = useState(false);
  const [applicationLinkId, setApplicationLinkId] = useState(null);
  const [userContributionType, setUserContributionType] = useState('');
  const [contentRef, setContentRef] = React.useState(undefined);

  const handleGenericHttpErrors = useHandleGenericHttpErrors();

  const mounted = useRef(false);

  const { mainDomain } = match.params;
  const { name, id, unknown } = useMemo(
    () => entity || {},
    [entity],
  );

  const { enqueueSnackbar } = useSnackbar();

  const closeUserContributionDialog = useCallback(() => {
    setOpenUserContributionDialog(false);
  }, [setOpenUserContributionDialog]);

  const openUserContributionDialog = useCallback((type) => {
    setUserContributionType(type);
    setOpenUserContributionDialog(true);
  }, [setOpenUserContributionDialog, setUserContributionType]);

  const onContributionDpoEmailClick = useCallback(
    () => openUserContributionDialog('dpoEmail'),
    [openUserContributionDialog],
  );
  const onContributionLinkClick = useCallback(
    () => openUserContributionDialog('link'),
    [openUserContributionDialog],
  );

  const onUserContribute = useCallback(
    (dpoEmail, link) => API.use(ENDPOINTS.applicationContribution.create)
      .build(null, {
        user_id: userId,
        dpo_email: dpoEmail,
        link,
        application_id: id,
      })
      .send()
      .then(() => {
        const text = t('application.info.userContribution.success');
        enqueueSnackbar(text, { variant: 'success' });
      })
      .catch(handleGenericHttpErrors)
      .finally(closeUserContributionDialog),
    [userId, id, closeUserContributionDialog, t, enqueueSnackbar, handleGenericHttpErrors],
  );

  const onToggleLinked = useCallback(
    () => {
      if (isNil(applicationLinkId)) {
        createUserApplication({ userId, applicationId: id })
          .then((userApplication) => {
            setApplicationLinkId(userApplication.id);
          })
          .catch(handleGenericHttpErrors);
      } else {
        API.use(ENDPOINTS.userApplication.delete)
          .build({ id: applicationLinkId })
          .send()
          .then(() => { setApplicationLinkId(null); })
          .catch(handleGenericHttpErrors);
      }
    },
    [userId, id, applicationLinkId, handleGenericHttpErrors],
  );

  const getCurrentApplicationLink = useCallback(
    () => {
      API.use(ENDPOINTS.userApplication.read)
        .build(null, null, {
          user_id: userId,
          application_id: id,
        })
        .send()
        .then((userApplications) => {
          const userApplicationId = getUserApplicationId(userApplications);
          if (!isNil(userApplicationId)) {
            setApplicationLinkId(userApplicationId);
          }
        })
        .catch(handleGenericHttpErrors);
    },
    [userId, id, handleGenericHttpErrors],
  );

  useEffect(
    () => {
      if (mounted.current === false && !isNil(id) && !isNil(userId)) {
        getCurrentApplicationLink();
        mounted.current = true;
      }
    },
    [mounted, getCurrentApplicationLink, id, userId],
  );

  return (
    <Screen {...screenProps} className={classes.screen}>
      <Container
        maxWidth="md"
        className={classes.container}
      >
        <UserContributionDialog
          open={isOpenUserContributionDialog}
          onClose={closeUserContributionDialog}
          onSuccess={onUserContribute}
          userContributionType={userContributionType}
          appName={name}
        />
        {!unknown && (
          <ApplicationInfoNav
            className={clsx({ [classes.nav]: IS_PLUGIN })}
            elevationScrollTarget={contentRef}
            mainDomain={mainDomain}
            isAuthenticated={isAuthenticated}
          />
        )}

        <Box
          className={clsx(classes.content, { [classes.pluginContent]: IS_PLUGIN })}
          ref={(ref) => IS_PLUGIN && setContentRef(ref)}
        >
          <Switch>
            <Route
              exact
              path={routes.citizen.application.vault}
              render={(routerProps) => (
                <ApplicationVault
                  onContributionDpoEmailClick={onContributionDpoEmailClick}
                  isLoading={isFetching}
                  application={entity}
                  {...routerProps}
                />
              )}
            />
            <Route
              path={routes.citizen.application.feedback}
              render={(routerProps) => (
                <Feedback
                  application={entity}
                  isLoading={isFetching}
                  {...routerProps}
                />
              )}
            />
            <Route
              path={routes.citizen.application.legal}
              render={(routerProps) => (
                <Legal
                  application={entity}
                  isLoading={isFetching}
                  onContributionLinkClick={onContributionLinkClick}
                  {...routerProps}
                />
              )}
            />
            <Route
              path={routes.citizen.application.more}
              render={(routerProps) => (
                <More
                  application={entity}
                  isLoading={isFetching}
                  isLinked={!isNil(applicationLinkId)}
                  toggleLinked={onToggleLinked}
                  isAuthenticated={isAuthenticated}
                  {...routerProps}
                />
              )}
            />
            <Redirect
              from={routes.citizen.application._}
              exact
              to={generatePath(routes.citizen.application.vault, { mainDomain })}
            />
          </Switch>
        </Box>
        {!IS_PLUGIN && <Footer />}
      </Container>
    </Screen>
  );
}

ApplicationInfo.propTypes = {
  userId: PropTypes.string,
  dispatch: PropTypes.func.isRequired,
  entity: PropTypes.shape(ApplicationSchema.propTypes),
  history: PropTypes.shape({ replace: PropTypes.func }).isRequired,
  isAuthenticated: PropTypes.bool.isRequired,
  isFetching: PropTypes.bool.isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({ mainDomain: PropTypes.string }),
    path: PropTypes.string,
  }).isRequired,
  t: PropTypes.func.isRequired,
  screenProps: PropTypes.object.isRequired,
};

ApplicationInfo.defaultProps = {
  userId: null,
  entity: null,
};

export default connect((state) => ({
  userId: state.auth.userId,
  isAuthenticated: !!state.auth.token,
}))(withTranslation(['screens'])(ApplicationInfo));
