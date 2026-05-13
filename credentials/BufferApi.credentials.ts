import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class BufferApi implements ICredentialType {
	name = 'bufferApi';
	displayName = 'Buffer API';
	icon: Icon = 'file:buffer.svg';
	documentationUrl = 'https://buffer.com/developers/api';
	properties: INodeProperties[] = [
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{"Bearer " + $credentials.accessToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.buffer.com',
			url: '',
			method: 'POST',
			body: {
				query: `
				query GetOrganizations {
					account {
						organizations {
							id
							name
							ownerEmail
						}
					}
				}
				`,
			},
		},
	};
}
