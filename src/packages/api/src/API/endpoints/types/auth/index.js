export default {
  info: {
    method: 'GET',
    path: '/auth/login/info',
  },
  confirm: {
    method: 'POST',
    path: '/users/confirm',
  },
  askConfirm: {
    method: 'POST',
    path: '/users/confirm/ask',
  },
  loginAuthStep: {
    method: 'POST',
    path: '/auth/login/authn-step',
  },
  renewAuthStep: {
    method: 'POST',
    path: '/authn-steps',
  },
  consent: {
    create: {
      method: 'POST',
      path: '/auth/consent',
    },
    info: {
      method: 'GET',
      path: '/auth/consent/info',
    },
  },
  signOut: {
    method: 'POST',
    path: '/auth/logout',
    auth: true,
  },
  signUp: {
    method: 'POST',
    path: '/users',
  },
  init: {
    method: 'POST',
    path: '/login/method',
  },
  backup: {
    read: {
      method: 'GET',
      path: '/auth/backup',
      auth: true,
    },
  },
  backupKeyShares: {
    create: {
      method: 'POST',
      path: '/auth/backup-key-shares',
      auth: true,
    },
  },
};
