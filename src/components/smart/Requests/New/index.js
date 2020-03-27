import React, { useCallback, useState, useMemo } from 'react';
import routes from 'routes';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { generatePath } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';

import Redirect from 'components/dumb/Redirect';
import withUserEmails from 'components/smart/withUserEmails';
import { addToUserApplications } from 'store/actions/applications/userApplications';
import UserEmailSchema from 'store/schemas/UserEmail';

import API from '@misakey/api';

import objectToSnakeCase from '@misakey/helpers/objectToSnakeCase';
import objectToCamelCase from '@misakey/helpers/objectToCamelCase';
import prop from '@misakey/helpers/prop';
import head from '@misakey/helpers/head';
import isNil from '@misakey/helpers/isNil';
import isFunction from '@misakey/helpers/isFunction';
import useFetchEffect from '@misakey/hooks/useFetch/effect';
import errorTypes from '@misakey/ui/constants/errorTypes';
import useHandleGenericHttpErrors from '@misakey/hooks/useHandleGenericHttpErrors';

const { conflict } = errorTypes;

// HELPERS
const idProp = prop('id');
const getUserEmailId = (userEmails) => idProp(head(userEmails || []));

const postRequest = (payload) => API.use(API.endpoints.application.box.create)
  .build(null, objectToSnakeCase(payload))
  .send();

// COMPONENTS
const NewRequest = ({
  children,
  userEmails,
  userId,
  producerId,
  type,
  onCreateSuccess,
  onCreateError,
  t,
}) => {
  const { enqueueSnackbar } = useSnackbar();

  const [redirectToRequest, setRedirectToRequest] = useState(null);

  const userEmailId = useMemo(() => getUserEmailId(userEmails), [userEmails]);
  const handleGenericHttpErrors = useHandleGenericHttpErrors();
  const dispatch = useDispatch();

  const createRequest = useCallback(
    () => postRequest({ ownerId: userId, producerId, userEmailId, type }),
    [producerId, type, userEmailId, userId],
  );

  const onSuccess = useCallback((createdRequest) => {
    const { id } = createdRequest;
    return Promise.all([
      dispatch(addToUserApplications(producerId, objectToCamelCase(createdRequest))),
      onCreateSuccess(),
    ]).then(() => {
      setRedirectToRequest(generatePath(routes.citizen.requests.read, { id }));
    });
  }, [dispatch, onCreateSuccess, producerId]);


  const onError = useCallback((e) => {
    const { code } = e;
    if (code === conflict) {
      enqueueSnackbar(t('citizen:requests.read.errors.conflict.open.status'), { variant: 'error' });
    } else {
      handleGenericHttpErrors();
    }
    if (isFunction(onCreateError)) {
      onCreateError(e);
    }
  }, [enqueueSnackbar, handleGenericHttpErrors, onCreateError, t]);

  const shouldFetch = useMemo(
    () => !isNil(userEmailId) && !isNil(type) && !isNil(producerId),
    [producerId, type, userEmailId],
  );

  useFetchEffect(
    createRequest,
    { shouldFetch, fetchOnlyOnce: true },
    { onSuccess, onError },
  );

  if (!isNil(redirectToRequest)) {
    return <Redirect to={redirectToRequest} />;
  }

  return children;
};


NewRequest.propTypes = {
  // withUserEmails
  userEmails: PropTypes.arrayOf(PropTypes.shape(UserEmailSchema.propTypes)),
  userId: PropTypes.string,
  // props
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.node]),
  producerId: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  onCreateSuccess: PropTypes.func,
  onCreateError: PropTypes.func,
  t: PropTypes.func.isRequired,
};

NewRequest.defaultProps = {
  children: null,
  userId: null,
  userEmails: null,
  onCreateSuccess: null,
  onCreateError: null,
};

export default withUserEmails(withTranslation('citizen')(NewRequest));