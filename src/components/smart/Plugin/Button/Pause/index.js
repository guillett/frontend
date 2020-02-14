import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { pluginRefreshWarningShow } from 'store/actions/warning';
import { GET_BLOCKER_STATE, TOGGLE_BLOCKED_STATE } from 'background/messages';

import { sendMessage } from 'background';

import makeStyles from '@material-ui/core/styles/makeStyles';
import useFetchEffect from '@misakey/hooks/useFetch/effect';
import useFetchCallback from '@misakey/hooks/useFetch/callback';

import Button, { BUTTON_STANDINGS } from 'components/dumb/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Tooltip from '@material-ui/core/Tooltip';
import Pause from '@material-ui/icons/Pause';
import PlayArrow from '@material-ui/icons/PlayArrow';


// HOOKS
const useStyles = makeStyles(() => ({
  button: {
    minWidth: 'unset',
  },
}));

const useOptions = (t) => useMemo(() => [
  {
    label: t('plugin:time.minute', { count: 30 }),
    value: 30,
  },
  {
    label: t('plugin:time.hour', { count: 1 }),
    value: 60,
  },
  {
    label: t('plugin:time.hour', { count: 24 }),
    value: 1440,
  },
  {
    label: t('plugin:pause.indeterminate'),
    value: null,
  },
], [t]);

const useAssignCallback = (
  setPaused,
  setPausedTime,
) => useCallback((response) => {
  setPaused(response.paused);
  setPausedTime(response.pausedTime);
}, [setPaused, setPausedTime]);

const usePause = (assignCallback, dispatchShowWarning) => useCallback((time = null) => {
  const deadline = time ? Date.now() + (time * 60 * 1000) : null;
  return sendMessage(TOGGLE_BLOCKED_STATE, { time: deadline }).then((response) => {
    assignCallback(response);
    dispatchShowWarning();
  });
}, [assignCallback, dispatchShowWarning]);

const useHandleChoice = (onPause, setAnchorEl) => useCallback((value) => {
  onPause(value);
  setAnchorEl(null);
}, [onPause, setAnchorEl]);

const useGetData = (assignCallback) => useCallback(
  () => sendMessage(GET_BLOCKER_STATE)
    .then(assignCallback),
  [assignCallback],
);

// HELPERS
const getPlannedDate = (pausedTime) => {
  const date = new Date(pausedTime);
  return `${date.toLocaleDateString()} - ${date.toLocaleTimeString()}`;
};

function PausePluginButton({ t, dispatchShowWarning }) {
  const classes = useStyles();

  const options = useOptions(t);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [paused, setPaused] = React.useState(null);
  const [pausedTime, setPausedTime] = React.useState(null);

  const assignCallback = useAssignCallback(setPaused, setPausedTime);
  const pause = usePause(assignCallback, dispatchShowWarning);
  const { wrappedFetch: onPause, isFetching: isPausing } = useFetchCallback(pause);

  const handleChoice = useHandleChoice(onPause, setAnchorEl);
  const getData = useGetData(assignCallback);
  const onClose = useCallback(() => { setAnchorEl(null); }, []);
  const onClick = useCallback(
    (event) => (paused ? onPause() : setAnchorEl(event.currentTarget)), [onPause, paused],
  );

  const { isFetching } = useFetchEffect(getData, { fetchOnlyOnce: true });

  return (
    <>
      <Tooltip title={paused
        ? `${pausedTime ? t('plugin:resume.plannedResume', { planned: getPlannedDate(pausedTime) }) : t('plugin:resume.description')}`
        : t('plugin:pause.description')}
      >
        <Button
          standing={BUTTON_STANDINGS.OUTLINED}
          size="small"
          className={classes.button}
          aria-owns={anchorEl ? 'menu-list-grow' : undefined}
          aria-haspopup="true"
          onClick={onClick}
          isLoading={isFetching || isPausing}
          text={paused ? <PlayArrow /> : <Pause />}
        />
      </Tooltip>

      <Menu
        id="pause-menu"
        anchorEl={anchorEl}
        keepMounted
        getContentAnchorEl={null}
        open={Boolean(anchorEl)}
        onClose={onClose}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.value} onClick={() => handleChoice(option.value)}>
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

PausePluginButton.propTypes = {
  dispatchShowWarning: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

// CONNECT
const mapDispatchToProps = (dispatch) => ({
  dispatchShowWarning: () => dispatch(pluginRefreshWarningShow()),
});

export default connect(null, mapDispatchToProps)(withTranslation(['plugin'])(PausePluginButton));
