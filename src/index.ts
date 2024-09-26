import { Handler } from '@yandex-cloud/function-types';
import axios from 'axios';

export const handler = async (data: any, context: any) => {
	return {
		statusCode: 200,
		body: {
			data: JSON.stringify(data),
			context: JSON.stringify(context),
		},
	};
};
