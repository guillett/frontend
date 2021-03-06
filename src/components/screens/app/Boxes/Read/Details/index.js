import React, { useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import routes from 'routes';
import { Link } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useSnackbar } from 'notistack';
import { makeStyles } from '@material-ui/core/styles';

import useGeneratePathKeepingSearchAndHash from '@misakey/hooks/useGeneratePathKeepingSearchAndHash';

import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import AppBarDrawer from 'components/dumb/AppBar/Drawer';
import IconButtonAppBar from 'components/dumb/IconButton/Appbar';
import Box from '@material-ui/core/Box';
import ArrowBack from '@material-ui/icons/ArrowBack';
import Typography from '@material-ui/core/Typography';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import BoxAvatar from 'components/dumb/Avatar/Box';
import ElevationScroll from 'components/dumb/ElevationScroll';
import ConfirmationDialog from 'components/dumb/Dialog/Confirm';
import AvatarUser from '@misakey/ui/Avatar/User';
import IconButton from '@material-ui/core/IconButton';
import ShareIcon from '@material-ui/icons/Share';
import CopyIcon from '@material-ui/icons/FilterNone';

import { ListItemSecondaryAction } from '@material-ui/core';
import { AVATAR_SIZE } from '@misakey/ui/constants/sizes';
import { CLOSED, OPEN } from 'constants/app/boxes/statuses';
import { LIFECYCLE } from 'constants/app/boxes/events';
import { createBoxEventBuilder } from '@misakey/helpers/builder/boxes';
import { addBoxEvents } from 'store/reducers/box';
import BoxesSchema from 'store/schemas/Boxes';
import errorTypes from '@misakey/ui/constants/errorTypes';
import useHandleHttpErrors from '@misakey/hooks/useHandleHttpErrors';
import { removeEntities } from '@misakey/store/actions/entities';
import useGetShareMethods from 'hooks/useGetShareMethods';

// CONSTANTS
const { conflict } = errorTypes;
const CONTENT_SPACING = 2;
const APPBAR_HEIGHT = 64;

// HOOKS
const useStyles = makeStyles((theme) => ({
  avatar: {
    width: `calc(3 * ${AVATAR_SIZE}px)`,
    height: `calc(3 * ${AVATAR_SIZE}px)`,
    fontSize: theme.typography.h4.fontSize,
    margin: theme.spacing(2, 0),
  },
  content: {
    boxSizing: 'border-box',
    maxHeight: `calc(100vh - ${APPBAR_HEIGHT}px)`,
    overflow: 'auto',
  },
  subheader: {
    backgroundColor: theme.palette.common.white,
  },
}));

function BoxDetails({ drawerWidth, isDrawerOpen, box, belongsToCurrentUser, t }) {
  const classes = useStyles();
  // useRef seems buggy with ElevationScroll
  const [contentRef, setContentRef] = useState();
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const handleHttpErrors = useHandleHttpErrors();

  const {
    id,
    avatarUrl: boxAvatarUrl,
    title,
    publicKey,
    members,
    lifecycle,
  } = useMemo(() => box, [box]);

  const goBack = useGeneratePathKeepingSearchAndHash(routes.boxes.read._, { id });
  // const routeFiles = useGeneratePathKeepingSearchAndHash(routes.boxes.read.files, { id });

  const {
    canShare,
    canInvite,
    onShare,
    onCopyLink,
  } = useGetShareMethods(id, title, publicKey, t);

  const isAllowedToClose = useMemo(
    () => belongsToCurrentUser && lifecycle === OPEN,
    [belongsToCurrentUser, lifecycle],
  );

  const toggleCloseDialog = useCallback(
    () => {
      setIsCloseDialogOpen((current) => !current);
    }, [setIsCloseDialogOpen],
  );

  const onCloseBox = useCallback(
    () => createBoxEventBuilder(id, { type: LIFECYCLE, content: { state: CLOSED } })
      .then((response) => dispatch(addBoxEvents(id, response)))
      .catch((error) => {
        if (error.code === conflict) {
          const { details = {} } = error;
          if (details.lifecycle === conflict) {
            dispatch(removeEntities([{ id }], BoxesSchema));
            enqueueSnackbar(t('boxes:read.events.create.error.lifecycle'), { variant: 'error' });
          }
        } else {
          handleHttpErrors(error);
        }
      }),
    [dispatch, enqueueSnackbar, handleHttpErrors, id, t],
  );

  return (
    <>
      <ElevationScroll target={contentRef}>
        <AppBarDrawer drawerWidth={drawerWidth} isDrawerOpen={isDrawerOpen}>
          <IconButtonAppBar
            color="inherit"
            aria-label={t('common:openAccountDrawer')}
            edge="start"
            component={Link}
            to={goBack}
          >
            <ArrowBack />
          </IconButtonAppBar>
        </AppBarDrawer>
      </ElevationScroll>
      <Box p={CONTENT_SPACING} pt={0} ref={(ref) => setContentRef(ref)} className={classes.content}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <BoxAvatar
            classes={{ root: classes.avatar }}
            src={boxAvatarUrl}
            title={title || ''}
          />
          <Typography variant="h6" align="center">
            {title}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t('boxes:read.details.menu.members.count', { count: members.length })}
          </Typography>
        </Box>
        <List>
          <ListItem
            // button
            divider
            aria-label={t('boxes:read.details.menu.title')}
          >
            <ListItemText
              primary={t('boxes:read.details.menu.title')}
              secondary={title}
              primaryTypographyProps={{ variant: 'overline', color: 'textSecondary' }}
              secondaryTypographyProps={{ color: 'textPrimary' }}
            />
            {/* <ChevronRightIcon /> */}
          </ListItem>
          {canInvite && (
            <>
              {canShare && (
                <ListItem
                  divider
                  aria-label={t('boxes:read.details.menu.share.menuTitle')}
                >
                  <ListItemText
                    primary={t('boxes:read.details.menu.share.menuTitle')}
                    primaryTypographyProps={{ noWrap: true, variant: 'overline', color: 'textSecondary' }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      onClick={onShare}
                      disabled={!canShare}
                      aria-label={t('common:share')}
                    >
                      <ShareIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              )}
              <ListItem
                divider
                aria-label={t('boxes:read.details.menu.copyLink')}
              >
                <ListItemText
                  primary={t('boxes:read.details.menu.copyLink')}
                  primaryTypographyProps={{ noWrap: true, variant: 'overline', color: 'textSecondary' }}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    onClick={onCopyLink}
                    disabled={!canInvite}
                    aria-label={t('common:copy')}
                  >
                    <CopyIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </>
          )}
          {/* <ListItem
            button
            to={routeFiles}
            component={Link}
            divider
            aria-label={t('boxes:read.details.menu.files')}
          >
            <ListItemText
              primary={t('boxes:read.details.menu.files')}
              primaryTypographyProps={{ noWrap: true, variant: 'overline', color: 'textSecondary' }}
              secondaryTypographyProps={{ noWrap: true, color: 'textPrimary' }}
            />
            <ChevronRightIcon />
          </ListItem> */}
          <ListItem
            // button
            // to={}
            // component={Link}
            divider
            aria-label={t('boxes:read.details.menu.encryption.primary')}
          >
            <ListItemText
              primary={t('boxes:read.details.menu.encryption.primary')}
              secondary={t('boxes:read.details.menu.encryption.secondary')}
              primaryTypographyProps={{ noWrap: true, variant: 'overline', color: 'textSecondary' }}
              secondaryTypographyProps={{ color: 'textPrimary' }}
            />
            {/* <ChevronRightIcon /> */}
          </ListItem>
          {isAllowedToClose && (
            <>
              <ListItem
                button
                divider
                onClick={toggleCloseDialog}
                aria-label={t('boxes:read.details.menu.close.primary')}
              >
                <ListItemText
                  primary={t('boxes:read.details.menu.close.primary')}
                  secondary={t('boxes:read.details.menu.close.secondary')}
                  primaryTypographyProps={{ noWrap: true, variant: 'overline', color: 'textSecondary' }}
                  secondaryTypographyProps={{ color: 'textPrimary' }}
                />
                <ChevronRightIcon />
              </ListItem>
              <ConfirmationDialog
                onConfirm={onCloseBox}
                isDialogOpen={isCloseDialogOpen}
                onClose={toggleCloseDialog}
                dialogContent={t('boxes:read.details.menu.close.confirmDialog.text')}
              />
            </>
          )}
          <List subheader={(
            <ListSubheader className={classes.subheader}>
              <Typography noWrap variant="overline" color="textSecondary">
                {t('boxes:read.details.menu.members.title')}
              </Typography>
            </ListSubheader>
          )}
          >
            {members.map(({ displayName, avatarUrl, identifier }) => (
              <ListItem key={identifier.value}>
                <ListItemAvatar>
                  <AvatarUser displayName={displayName} avatarUrl={avatarUrl} />
                </ListItemAvatar>
                <ListItemText
                  primary={displayName}
                  secondary={identifier.value}
                />
              </ListItem>
            ))}
          </List>
        </List>
      </Box>
    </>

  );
}

BoxDetails.propTypes = {
  drawerWidth: PropTypes.string.isRequired,
  isDrawerOpen: PropTypes.bool.isRequired,
  t: PropTypes.func.isRequired,
  box: PropTypes.shape(BoxesSchema.propTypes).isRequired,
  belongsToCurrentUser: PropTypes.bool,
};

BoxDetails.defaultProps = {
  belongsToCurrentUser: false,
};

export default withTranslation(['common', 'boxes'])(BoxDetails);
