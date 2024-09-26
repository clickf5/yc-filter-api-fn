import { Handler } from '@yandex-cloud/function-types';

export const handler: Handler.Http = async (event, context) => {
	return {
		statusCode: 200,
		body: JSON.stringify(event),
	};
};
