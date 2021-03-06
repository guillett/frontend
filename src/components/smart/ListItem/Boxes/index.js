import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { generatePath, Link } from 'react-router-dom';
import { withTranslation } from 'react-i18next';

import { CLOSED } from 'constants/app/boxes/statuses';
import BoxesSchema from 'store/schemas/Boxes';

import isNil from '@misakey/helpers/isNil';
import omitTranslationProps from '@misakey/helpers/omit/translationProps';

import makeStyles from '@material-ui/core/styles/makeStyles';
import useBoxPublicKeysWeCanDecryptFrom from '@misakey/crypto/hooks/useBoxPublicKeysWeCanDecryptFrom';
import useBoxBelongsToCurrentUser from 'hooks/useBoxBelongsToCurrentUser';

import Skeleton from '@material-ui/lab/Skeleton';
import Box from '@material-ui/core/Box';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import Badge from '@material-ui/core/Badge';
import BoxAvatar from 'components/dumb/Avatar/Box';
import BoxAvatarSkeleton from 'components/dumb/Avatar/Box/Skeleton';
import TypographyDateSince from 'components/dumb/Typography/DateSince';
import BoxEventsAccordingToType from 'components/smart/Box/Event';
import IconStack from '@misakey/ui/Icon/Stack';

import VpnKeyIcon from '@material-ui/icons/VpnKey';
import ClearIcon from '@material-ui/icons/Clear';

// HOOKS
const useStyles = makeStyles(() => ({
  listItemText: {
    // Needed for IE11
    width: '100%',
  },
  iconStack: {
    position: 'absolute',
  },
  background: {
    visibility: '0.5',
  },
  boxPosition: {
    top: '40%',
    right: '16px',
    position: 'absolute',
    transform: 'translateY(-50%)',
  },
}));

// COMPONENTS
export const BoxListItemSkeleton = (props) => (
  <ListItem {...props}>
    <ListItemAvatar>
      <BoxAvatarSkeleton />
    </ListItemAvatar>
    <ListItemText
      primary={(
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Skeleton
            component="span"
            variant="text"
            width="50%"
          />
          <Skeleton
            component="span"
            variant="text"
            width="20%"
          />

        </Box>
      )}
      secondary={(
        <Skeleton
          component="span"
          variant="text"
          width="50%"
        />
      )}
    />
  </ListItem>
);

function BoxListItem({ box, toRoute, t, ...rest }) {
  const classes = useStyles();

  const {
    id,
    logoUri,
    title,
    publicKey,
    lastEvent = {},
    lifecycle,
    eventsCount = 0,
  } = useMemo(() => box || {}, [box]);

  const linkProps = useMemo(
    () => (isNil(toRoute) || isNil(id) ? {} : {
      to: generatePath(toRoute, { id }),
      button: true,
      component: Link,
    }),
    [id, toRoute],
  );

  const secondary = useMemo(
    () => (
      <BoxEventsAccordingToType event={lastEvent} preview boxID={id} />
    ), [id, lastEvent],
  );

  const publicKeysWeCanDecryptFrom = useBoxPublicKeysWeCanDecryptFrom();
  const canBeDecrypted = useMemo(
    () => publicKeysWeCanDecryptFrom.has(publicKey),
    [publicKeysWeCanDecryptFrom, publicKey],
  );

  const belongsToCurrentUser = useBoxBelongsToCurrentUser(box);


  const lostKey = useMemo(
    () => !canBeDecrypted && (lifecycle !== CLOSED || belongsToCurrentUser),
    [canBeDecrypted, lifecycle, belongsToCurrentUser],
  );

  if (isNil(id)) {
    return null;
  }

  return (
    <ListItem key={id} {...linkProps} {...omitTranslationProps(rest)}>
      <ListItemAvatar>
        <Badge badgeContent={eventsCount} color="secondary">
          <BoxAvatar
            src={logoUri}
            title={title}
          />
        </Badge>
      </ListItemAvatar>
      <ListItemText
        className={classes.listItemText}
        primary={(
          <Box display="flex" justifyContent="space-between" alignItems="center">
            {title}
            {!lostKey && (
              <TypographyDateSince
                noWrap
                date={lastEvent.serverEventCreatedAt}
              />
            )}
          </Box>
        )}
        secondary={secondary}
        primaryTypographyProps={{ noWrap: true, display: 'block' }}
        secondaryTypographyProps={{ noWrap: true, display: 'block' }}
      />
      {lostKey && (
        <Box
          aria-label={t('common:undecryptable')}
          className={classes.boxPosition}
          width={48}
        >
          <IconStack
            color="secondary"
            ForegroundIcon={VpnKeyIcon}
            BackgroundIcon={ClearIcon}
          />
        </Box>
      )}
    </ListItem>
  );
}

BoxListItem.propTypes = {
  box: PropTypes.shape(BoxesSchema.propTypes),
  toRoute: PropTypes.string,
  // withTranslation
  t: PropTypes.func.isRequired,
};

BoxListItem.defaultProps = {
  box: null,
  toRoute: null,
};

export default withTranslation('common')(BoxListItem);
