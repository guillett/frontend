import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { generatePath, Link } from 'react-router-dom';

import BoxesSchema from 'store/schemas/Boxes';

import isNil from '@misakey/helpers/isNil';
import omitTranslationProps from '@misakey/helpers/omit/translationProps';

import Skeleton from '@material-ui/lab/Skeleton';
import Box from '@material-ui/core/Box';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
// import Chip from '@material-ui/core/Chip';
import Badge from '@material-ui/core/Badge';
import BoxAvatar from 'components/dumb/Avatar/Box';
import BoxAvatarSkeleton from 'components/dumb/Avatar/Box/Skeleton';
import TypographyDateSince from 'components/dumb/Typography/DateSince';
import BoxEventsAccordingToType from 'components/smart/Box/Event';

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

function BoxListItem({ box, toRoute, ...rest }) {
  const {
    id,
    logoUri,
    title,
    lastEvent = {},
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
        primary={(
          <Box display="flex" justifyContent="space-between" alignItems="center">
            {title}
            <TypographyDateSince
              noWrap
              date={lastEvent.serverEventCreatedAt}
            />
          </Box>
        )}
        secondary={secondary}
        primaryTypographyProps={{ noWrap: true, display: 'block' }}
        secondaryTypographyProps={{ noWrap: true, display: 'block' }}
      />
    </ListItem>
  );
}

BoxListItem.propTypes = {
  box: PropTypes.shape(BoxesSchema.propTypes),
  toRoute: PropTypes.string,
};

BoxListItem.defaultProps = {
  box: null,
  toRoute: null,
};

export default BoxListItem;
