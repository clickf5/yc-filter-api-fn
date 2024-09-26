import axios, { AxiosRequestConfig } from 'axios';

type HttpMethod = 'OPTIONS' | 'HEAD' | 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

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

interface Event {
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
	body: string;
	isBase64Encoded: boolean;
	url: string;
}

interface Result {
	statusCode: number;
	headers?: Record<string, any>;
	multiValueHeaders?: Record<string, string[]>;
	body?: string;
	isBase64Encoded?: boolean;
}

type HttpHandler = (event: Event) => Promise<Result>;

export const handler: HttpHandler = async (data) => {
	const {
		url,
		body,
		httpMethod,
		requestContext: { apiGateway: { operationContext: { host, auth, include } = {} } = {} } = {},
	} = data;

	const requestCfg: AxiosRequestConfig = {
		url,
		method: httpMethod.toLowerCase(),
		baseURL: host,
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
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

	if (body) {
		requestCfg.data = body;
	}

	if (include) {
		requestCfg.transformResponse = (data) => {
			if (Array.isArray(data)) {
				return data.map((item) =>
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
				return Object.entries(data).reduce(
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

	console.log(JSON.stringify(requestCfg));

	const response = await axios(requestCfg);

	return {
		statusCode: response.status,
		body: JSON.stringify(response.data),
		headers: response.headers,
	};
};
