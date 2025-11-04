import { createLogger, Logger } from "dsi-aws-boilerplate";
import * as nestedProperty from 'nested-property'
const MaskData = require('maskdata');
const _ = require('deepdash/standalone');
let logger: Logger;
export default function log(message, logObject, event, _context) {
  if (!logger) {
    logger = createLogger(true, event.requestId, {
      gitCommit: process.env.GIT_COMMIT_SHORT,
    });
  }

  const paths = _.paths(logObject);
  let mask = false;
  const providerNamePath = paths.find(path => path.includes('Provider.Name') || path.includes('provider.name'));
  if(providerNamePath) {
    const providerName = nestedProperty.get(logObject, providerNamePath.replace('[', '.').replace(']', ''))
    if(providerName === 'secrets') {
      mask = true;
    }
  }

  if(mask) {
    const maskJSONOptions = {
      maskWith: '*',
      fields: paths.filter(path => (path.includes('Inputs') || path.includes('inputs')) && !(path.includes('key') || path.includes('Key')))
    }

    logObject = MaskData.maskJSONFields(logObject, maskJSONOptions);
  }

  logger.debug(message, logObject);
}
