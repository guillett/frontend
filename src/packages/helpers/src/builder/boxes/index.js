import API from '@misakey/api';

import isNil from '@misakey/helpers/isNil';
import objectToCamelCaseDeep from '@misakey/helpers/objectToCamelCaseDeep';
import objectToSnakeCaseDeep from '@misakey/helpers/objectToSnakeCaseDeep';
// @FIXME shouldn't we just use "objectToSnakeCaseDeep" everywhere?
import objectToSnakeCase from '@misakey/helpers/objectToSnakeCase';
import objectToCamelCase from '@misakey/helpers/objectToCamelCase';

export const getBoxBuilder = (id, queryParams = {}) => API
  .use(API.endpoints.boxes.read)
  .build({ id }, undefined, objectToSnakeCase(queryParams))
  .send()
  .then(objectToCamelCaseDeep);

export const getBoxPublicBuilder = ({ id, otherShareHash }) => API
  .use(API.endpoints.boxes.public.read)
  .build({ id }, undefined, objectToSnakeCase({ otherShareHash }))
  .send()
  .then(objectToCamelCase);

export const getBoxEventsBuilder = (id) => API
  .use(API.endpoints.boxes.events.find)
  .build({ id })
  .send()
  .then((events) => events.map(objectToCamelCaseDeep));

export const getBoxWithEventsBuilder = (id) => Promise.all([
  getBoxBuilder(id),
  getBoxEventsBuilder(id),
])
  .then(([box, events]) => ({
    ...box,
    events,
  }));


export const getUserBoxesBuilder = (payload) => API
  .use(API.endpoints.boxes.find)
  .build(null, null, objectToSnakeCase({
    withBlobCount: true,
    orderBy: 'updated_at DESC',
    ...payload,
  }))
  .send()
  .then((response) => response.map(objectToCamelCaseDeep));

export const countUserBoxesBuilder = (payload) => {
  const query = isNil(payload) ? {} : objectToSnakeCase(payload);
  return API
    .use(API.endpoints.boxes.count)
    .build(null, null, query)
    .send()
    .then((response) => parseInt(response.headers.get('X-Total-Count'), 10));
};

export const updateBoxCount = ({ id, identityId }) => API
  .use(API.endpoints.boxes.events.newCount.update)
  .build({ id }, objectToSnakeCase({ identityId }))
  .send();

export const createBoxBuilder = (payload) => API
  .use(API.endpoints.boxes.create)
  .build(null, objectToSnakeCase(payload))
  .send()
  .then(objectToCamelCaseDeep);

export const createBoxEventBuilder = (id, payload) => API
  .use(API.endpoints.boxes.events.create)
  .build({ id }, objectToSnakeCaseDeep(payload))
  .send()
  .then(objectToCamelCaseDeep);

export const createBoxEncryptedFileBuilder = (boxID, formData) => API
  .use(API.endpoints.boxes.encryptedFiles.create)
  .build({ id: boxID }, formData)
  .send({ contentType: null }) // so that browser set content type automatically
  .then(objectToCamelCaseDeep);

export const getBoxEncryptedFileBuilder = (boxID, encryptedFileId) => API
  .use(API.endpoints.boxes.encryptedFiles.read)
  .build({ id: boxID, fileId: encryptedFileId })
  .send();

export const createKeyShareBuilder = (misakeyKeyShare) => API
  .use(API.endpoints.boxes.keyShares.create)
  .build(null, objectToSnakeCaseDeep(misakeyKeyShare))
  .send()
  .then(objectToCamelCaseDeep);

export const getKeyShareBuilder = (otherShareHash) => API
  .use(API.endpoints.boxes.keyShares.read)
  .build({ otherShareHash })
  .send()
  .then(objectToCamelCaseDeep);

export const deleteBoxBuilder = (boxId, userConfirmation) => API
  .use(API.endpoints.boxes.delete)
  .build({ id: boxId }, objectToSnakeCase({ userConfirmation }))
  .send();
