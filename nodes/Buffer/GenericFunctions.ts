import {
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	JsonObject,
	NodeApiError,
	IHttpRequestOptions,
	IDataObject,
} from 'n8n-workflow';

export async function bufferApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	query: string,
	variables: JsonObject = {},
): Promise<IDataObject> {
	const options: IHttpRequestOptions = {
		method: 'POST',
		url: 'https://api.buffer.com',
		headers: {
			'Content-Type': 'application/json',
		},
		body: {
			query,
			variables,
		},
		json: true,
	};

	try {
		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'bufferApi',
			options,
		);
		if (response.errors) {
			throw new NodeApiError(this.getNode(), response as JsonObject);
		}
		return response.data as IDataObject;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}
