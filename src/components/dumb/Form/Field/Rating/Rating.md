Form Field Rating example:

**NB**: This component relies on a `material-ui/lab` component
> "This package hosts the incubator components that are not yet ready to move to the core"

```js
import React, { useCallback } from 'react';
import { Formik, Form, Field } from 'formik';
import RatingField from 'components/dumb/Form/Field/Rating';
import ButtonSubmit from 'components/dumb/Button/Submit';
import log from '@misakey/helpers/log';

const INITIAL_VALUES = {
  value: null,
};

const RatingFieldExample = () => {
  const onSubmit = useCallback(
    (values, actions) => { log(values); actions.setSubmitting(false); },
    [],
  );

  return (
    <React.Suspense fallback="Loading...">
      <Formik initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ isSubmitting, isValid }) => (
          <Form>
            <Field component={RatingField} name="value" />
            <ButtonSubmit isSubmitting={isSubmitting} isValid={isValid}>
              Submit
            </ButtonSubmit>
          </Form>
        )}
      </Formik>
    </React.Suspense>
  );
};
  <RatingFieldExample />;
```