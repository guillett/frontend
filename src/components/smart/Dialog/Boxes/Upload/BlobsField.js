
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

import BlobListItem from 'components/dumb/ListItem/Blob';


// COMPONENTS
const FieldBlobs = ({ onRemove, blob, isSent, index }) => {
  const handleRemove = useCallback(
    () => onRemove(index),
    [onRemove, index],
  );

  return (
    <BlobListItem
      blob={blob}
      isEncrypted={isSent}
      onRemove={handleRemove}
    />
  );
};

FieldBlobs.propTypes = {
  onRemove: PropTypes.func.isRequired,
  blob: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  isSent: PropTypes.bool,
};

FieldBlobs.defaultProps = {
  isSent: false,
};

export default FieldBlobs;
