import React from 'react';
import { SnackbarProvider } from 'notistack';
import { Route, Switch } from 'react-router-dom';

import routes from 'routes';
import SplashScreen from 'components/dumb/SplashScreen';
import RoutePrivate from 'components/smart/Route/Private';

import './App.scss';

import AuthSignInCallback from 'components/screen/Auth/SignIn/Callback';
import Layout from 'components/smart/Layout';

const Home = React.lazy(() => import('components/screen/Home'));
const ServiceClaim = React.lazy(() => import('components/screen/Service/Claim'));
const ServiceCreate = React.lazy(() => import('components/screen/Service/Create'));
const ServiceList = React.lazy(() => import('components/screen/Service/List'));
const Service = React.lazy(() => import('components/screen/Service'));
const NotFound = React.lazy(() => import('components/screen/NotFound'));

function App() {
  return (
    <SnackbarProvider maxSnack={6} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
      <React.Suspense fallback={<SplashScreen />}>
        <Layout>
          <Switch>
            <Route exact path={routes._} component={Home} />
            <Route path={routes.auth.callback} component={AuthSignInCallback} />
            <RoutePrivate path={routes.service.claim._} component={ServiceClaim} />
            <RoutePrivate path={routes.service.create._} component={ServiceCreate} />
            <RoutePrivate path={routes.service.list} component={ServiceList} />
            <Route path={routes.service.home._} component={Service} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </React.Suspense>
    </SnackbarProvider>
  );
}

export default App;
