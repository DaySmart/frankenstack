import { WinstonLoggerModule } from 'o18k-ts-aws';
import * as nestedProperty from 'nested-property';
import { createLogger, Logger } from 'dsi-aws-boilerplate';
const MaskData = require('maskdata');
const _ = require('deepdash/standalone');

let logger: Logger;

export class LoggerModuleInstance extends WinstonLoggerModule {
	Log(message: any, logObject: any): void {
		if (!logger) {
			logger = createLogger(true, '', {
				gitCommit: process.env.GIT_COMMIT_SHORT
			});
		}
		const maskedLogObject = this.mask(logObject);
		logger.debug(message, maskedLogObject);
	}

	info(message: any, logObject: any): void {
		if (!logger) {
			logger = createLogger(true, '', {
				gitCommit: process.env.GIT_COMMIT_SHORT
			});
		}
		const maskedLogObject = this.mask(logObject);
		logger.info(message, maskedLogObject);
	}

	mask(logObject) {
		const paths = _.paths(logObject);
		let mask = false;
		const providerNamePath = paths.find(path => path.includes('Provider.Name') || path.includes('provider.name'));
		if (providerNamePath) {
			const providerName = nestedProperty.get(logObject, providerNamePath.replace('[', '.').replace(']', ''));
			if (providerName === 'secrets') {
				mask = true;
			}
		}

		if (mask) {
			console.log('ETHANTEST MASKING');
			const maskJSONOptions = {
				maskWith: '*',
				fields: paths.filter(path => (path.includes('Inputs') || path.includes('inputs')) && !(path.includes('key') || path.includes('Key')))
			};

			logObject = MaskData.maskJSONFields(logObject, maskJSONOptions);
		}
		return logObject;
	}
}
