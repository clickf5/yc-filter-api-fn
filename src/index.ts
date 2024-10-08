import axios, { AxiosRequestConfig } from 'axios';
import * as multipart from 'parse-multipart-data';
import { Readable } from 'node:stream';

export type HttpMethod = 'OPTIONS' | 'HEAD' | 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestContext = {
	identity: {
		sourceIp: string;
		userAgent: string;
	};
	httpMethod: HttpMethod;
	requestId: string;
	requestTime: string;
	requestTimeEpoch: number;
};

export interface Event {
	httpMethod: HttpMethod;
	headers: Record<string, string>;
	multiValueHeaders: Record<string, string[]>;
	queryStringParameters: Record<string, string>;
	multiValueQueryStringParameters: Record<string, string[]>;
	requestContext: RequestContext & {
		apiGateway?: {
			operationContext: {
				host?: string;
				auth?: {
					type: 'Basic' | 'Bearer';
					token?: string;
					user?: string;
					password?: string;
				};
				include?: string[];
			};
		};
	};
	body?: string;
	isBase64Encoded: boolean;
	path: string;
	parameters?: Record<string, string>;
}

interface Result {
	statusCode: number;
	headers?: Record<string, any>;
	multiValueHeaders?: Record<string, string[]>;
	body?: string;
	isBase64Encoded?: boolean;
}

type HttpHandler = (event: Event) => Promise<Result>;

// нужно отрабатывать 400 ошибки
axios.interceptors.response.use(
	(response) => {
		return response;
	},
	function (error) {
		if (error.response.status >= 400 && error.response.status <= 499) {
			return Promise.resolve(error.response);
		} else {
			return Promise.reject(error.response);
		}
	},
);

export const handler: HttpHandler = async (data) => {
	const {
		path,
		body,
		httpMethod,
		parameters,
		headers,
		requestContext: { apiGateway: { operationContext: { host, auth, include } = {} } = {} } = {},
	} = data;

	const requestCfg: AxiosRequestConfig = {
		url: path,
		method: httpMethod.toLowerCase(),
		baseURL: host,
	};

	if (auth && auth.type === 'Basic') {
		requestCfg.auth = {
			username: auth.user || '',
			password: auth.password || '',
		};
	}

	if (auth && auth.type === 'Bearer') {
		requestCfg.headers = {
			...requestCfg.headers,
			Authorization: `Bearer ${auth.token || ''}`,
		};
	}

	if (parameters) {
		requestCfg.params = parameters;
	}

	if (body) {
		requestCfg.data = body;
	}

	if (headers['Content-Type'].includes('multipart/form-data')) {
		const rowBody = Buffer.from(body ?? '', 'base64');
		const boundary = headers['Content-Type'].split('boundary=')[1];

		const parts = multipart.parse(rowBody, boundary);

		const formData = new FormData();

		for (let i = 0; i < parts.length; i++) {
			if (Object.hasOwn(parts[i], 'filename')) {
				formData.append(parts[i].name ?? 'files', Readable.from(parts[i].data));
			} else {
				formData.append(parts[i].name ?? 'field', parts[i].data.toString());
			}
		}

		requestCfg.data = formData;
	}

	if (include) {
		requestCfg.transformResponse = (data): any => {
			let parsedData: any = {};

			if (data !== 'null') {
				parsedData = JSON.parse(data);
			}

			if (Array.isArray(parsedData)) {
				return parsedData.map((item) =>
					Object.entries(item).reduce(
						(acc, [key, value]) => {
							if (include.includes(key)) {
								acc[key] = value;
							}
							return acc;
						},
						{} as Record<string, any>,
					),
				);
			} else {
				return Object.entries(parsedData).reduce(
					(acc, [key, value]) => {
						if (include.includes(key)) {
							acc[key] = value;
						}
						return acc;
					},
					{} as Record<string, any>,
				);
			}
		};
	}

	// console.log(JSON.stringify(data));
	// console.log(JSON.stringify(requestCfg));
	// console.log('body: ', data.body);

	try {
		const response = await axios(requestCfg);
		return {
			statusCode: response.status,
			body: JSON.stringify(response.data),
			headers: response.headers,
		};
	} catch (error) {
		return {
			statusCode: 500,
			body: JSON.stringify(error),
		};
	}
};
