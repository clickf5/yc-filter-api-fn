import { Handler } from '@yandex-cloud/function-types';
import axios from 'axios';

export const handler: Handler.Http = async (event, context) => {
	return {
		statusCode: 200,
		body: JSON.stringify(context),
	};
};
