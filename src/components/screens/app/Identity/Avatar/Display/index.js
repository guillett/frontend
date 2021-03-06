import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import { Link, generatePath, useParams } from 'react-router-dom';

import routes from 'routes';

import omit from '@misakey/helpers/omit';

import Card from 'components/dumb/Card';
import ScreenAction from 'components/dumb/Screen/Action';
import Subtitle from '@misakey/ui/Typography/Subtitle';
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import FormImage from './image';

// COMPONENTS
const AccountAvatarDisplay = ({
  t,
  displayName,
  avatarUrl,
  name,
  previewName,
  state,
  dirty,
  ...rest
}) => {
  const { id } = useParams();

  const homePath = useMemo(
    () => generatePath(routes.accounts._, { id }),
    [id],
  );

  const navigationProps = useMemo(
    () => ({
      homePath,
    }),
    [homePath],
  );

  const secondaryTo = useMemo(
    () => generatePath(routes.accounts.avatar.upload, { id }),
    [id],
  );

  return (
    <ScreenAction
      title={t('account:avatar.title')}
      state={state}
      navigationProps={navigationProps}
    >
      <Container maxWidth="md" className="content">
        <Box display="flex" flexDirection="column" flexGrow={1}>
          <Subtitle>
            {t('account:avatar.subtitle')}
          </Subtitle>
          <Card
            primary={dirty ? {
              type: 'submit',
              'aria-label': t('common:submit'),
              text: t('common:submit'),
            } : undefined}
            secondary={{
              to: secondaryTo,
              component: Link,
              'aria-label': t('common:edit'),
              text: t('common:edit'),
            }}
            formik
          >
            <FormImage
              previewName={previewName}
              name={name}
              text={displayName}
              {...omit(rest, ['i18n', 'tReady'])}
            />
          </Card>
        </Box>
      </Container>
    </ScreenAction>
  );
};

AccountAvatarDisplay.propTypes = {
  t: PropTypes.func.isRequired,
  displayName: PropTypes.string,
  avatarUrl: PropTypes.string,
  name: PropTypes.string.isRequired,
  previewName: PropTypes.string.isRequired,
  state: PropTypes.object,
  // formik
  dirty: PropTypes.bool.isRequired,
};

AccountAvatarDisplay.defaultProps = {
  displayName: '',
  avatarUrl: '',
  state: {},
};

export default withTranslation(['common', 'account'])(AccountAvatarDisplay);
