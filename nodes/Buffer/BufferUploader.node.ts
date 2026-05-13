import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	NodeOperationError,
	NodeConnectionTypes,
	IDataObject,
	JsonObject,
	NodeApiError,
} from 'n8n-workflow';
import { bufferApiRequest } from './GenericFunctions';

export class BufferUploader implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Buffer Uploader',
		name: 'bufferUploader',
		icon: 'file:buffer.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["text"]}}',
		description: 'Upload content to Buffer',
		defaults: {
			name: 'Buffer Uploader',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'bufferApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Organization Name or ID',
				name: 'organizationId',
				type: 'options',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: {
					loadOptionsMethod: 'getOrganizations',
				},
				default: '',
				required: true,
			},
			{
				displayName: 'Service',
				name: 'service',
				type: 'options',
				options: [
					{ name: 'Bluesky', value: 'bluesky' },
					{ name: 'Facebook', value: 'facebook' },
					{ name: 'Google Business', value: 'googlebusiness' },
					{ name: 'Instagram', value: 'instagram' },
					{ name: 'LinkedIn', value: 'linkedin' },
					{ name: 'Mastodon', value: 'mastodon' },
					{ name: 'Pinterest', value: 'pinterest' },
					{ name: 'Start Page', value: 'startPage' },
					{ name: 'Threads', value: 'threads' },
					{ name: 'TikTok', value: 'tiktok' },
					{ name: 'Twitter / X', value: 'twitter' },
					{ name: 'YouTube', value: 'youtube' },
				],
				default: 'facebook',
				required: true,
				description: 'Select the social media service',
			},
			{
				displayName: 'Channel Name or ID',
				name: 'channelId',
				type: 'options',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: {
					loadOptionsMethod: 'getChannels',
					loadOptionsDependsOn: ['organizationId', 'service'],
				},
				default: '',
				required: true,
			},
			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				placeholder: 'Hello from n8n!',
				description: 'The text to upload to Buffer',
				required: true,
			},
			{
				displayName: 'Scheduling Type',
				name: 'schedulingType',
				type: 'options',
				options: [
					{
						name: 'Automatic',
						value: 'automatic',
					},
					{
						name: 'Notification',
						value: 'notification',
					},
				],
				default: 'automatic',
				description: 'The scheduling type to be used for the post',
			},
			{
				displayName: 'Share Mode',
				name: 'mode',
				type: 'options',
				options: [
					{
						name: 'Add to Queue',
						value: 'addToQueue',
					},
					{
						name: 'Custom Scheduled',
						value: 'customScheduled',
					},
					{
						name: 'Recommended Time',
						value: 'recommendedTime',
					},
					{
						name: 'Share Next',
						value: 'shareNext',
					},
					{
						name: 'Share Now',
						value: 'shareNow',
					},
				],
				default: 'addToQueue',
				description: 'How the post is being scheduled',
			},
			{
				displayName: 'Save To Draft',
				name: 'saveToDraft',
				type: 'boolean',
				default: false,
				description: 'Whether to save the post as a draft instead of scheduling it',
			},
			{
				displayName: 'Asset Input Mode',
				name: 'assetInputMode',
				type: 'options',
				options: [
					{
						name: 'JSON',
						value: 'json',
					},
					{
						name: 'UI',
						value: 'ui',
					},
				],
				default: 'ui',
				description: 'How to provide assets (images/videos)',
			},
			{
				displayName: 'Assets',
				name: 'assetsUi',
				placeholder: 'Add Asset',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						assetInputMode: ['ui'],
					},
				},
				default: {},
				options: [
					{
						name: 'assetValues',
						displayName: 'Asset',
						values: [
							{
								displayName: 'Type',
								name: 'type',
								type: 'options',
								options: [
									{ name: 'Image', value: 'image' },
									{ name: 'Video', value: 'video' },
									{ name: 'Link', value: 'link' },
									{ name: 'Document', value: 'document' },
								],
								default: 'image',
							},
							{
								displayName: 'URL',
								name: 'url',
								type: 'string',
								default: '',
								required: true,
							},
							{
								displayName: 'Thumbnail URL (Video Only)',
								name: 'thumbnailUrl',
								type: 'string',
								displayOptions: {
									show: {
										type: ['video'],
									},
								},
								default: '',
							},
						],
					},
				],
			},
			{
				displayName: 'Assets (JSON)',
				name: 'assetsJson',
				type: 'json',
				displayOptions: {
					show: {
						assetInputMode: ['json'],
					},
				},
				default: '[]',
				description: 'Provide an array of asset objects, e.g. [{"image": {"URL": "..."}}, {"video": {"URL": "..."}}]',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				options: [
					{
						displayName: 'Metadata (JSON)',
						name: 'metadataJson',
						type: 'json',
						default: '{}',
						description:
							'Service-specific metadata for the post. For example, Facebook requires a type: {"facebook": {"type": "post"}}. <a href="https://developers.buffer.com/reference.html#posts" target="_blank">See Buffer API documentation</a>.',
					},
				],
			},
			{
				displayName: 'Facebook Post Type',
				name: 'facebookPostType',
				type: 'options',
				displayOptions: {
					show: {
						service: ['facebook'],
					},
				},
				options: [
					{ name: 'Post', value: 'post' },
					{ name: 'Story', value: 'story' },
					{ name: 'Reel', value: 'reel' },
				],
				default: 'post',
				description: 'The type of Facebook post',
			},
			{
				displayName: 'Instagram Post Type',
				name: 'instagramPostType',
				type: 'options',
				displayOptions: {
					show: {
						service: ['instagram'],
					},
				},
				options: [
					{ name: 'Post', value: 'post' },
					{ name: 'Story', value: 'story' },
					{ name: 'Reel', value: 'reel' },
				],
				default: 'post',
				description: 'The type of Instagram post',
			},
			{
				displayName: 'Share to Feed (Instagram)',
				name: 'instagramShouldShareToFeed',
				type: 'boolean',
				displayOptions: {
					show: {
						service: ['instagram'],
					},
				},
				default: true,
				description: 'Whether post should be shared to feed',
			},
			{
				displayName: 'Google Business Post Type',
				name: 'googleBusinessPostType',
				type: 'options',
				displayOptions: {
					show: {
						service: ['googlebusiness'],
					},
				},
				options: [
					{ name: 'Event', value: 'event' },
					{ name: 'Offer', value: 'offer' },
					{ name: "What's New", value: 'whats_new' },
				],
				default: 'whats_new',
				description: 'The type of Google Business post',
			},
		],
	};

	methods = {
		loadOptions: {
			async getOrganizations(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const query = `
					query GetOrganizations {
						account {
							organizations {
								id
								name
							}
						}
					}
				`;
				const responseData = await bufferApiRequest.call(this, query);
				const account = responseData.account as IDataObject;
				const organizations = (account?.organizations as IDataObject[]) || [];
				return organizations.map((org) => ({
					name: org.name as string,
					value: org.id as string,
				}));
			},

			async getChannels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const organizationId = this.getCurrentNodeParameter('organizationId') as string;
				const selectedService = this.getCurrentNodeParameter('service') as string;
				if (!organizationId) {
					return [];
				}
				const query = `
					query GetChannels {
						channels(input: { organizationId: "${organizationId}" }) {
							id
							name
							displayName
							service
						}
					}
				`;
				const responseData = await bufferApiRequest.call(this, query);
				let channels = (responseData.channels as IDataObject[]) || [];
				
				if (selectedService) {
					channels = channels.filter((c) => c.service === selectedService);
				}

				return channels.map((channel) => ({
					name: `${channel.displayName as string} (@${channel.name as string})`,
					value: channel.id as string,
				}));
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		let item: INodeExecutionData;

		for (let i = 0; i < items.length; i++) {
			try {
				const service = this.getNodeParameter('service', i) as string;
				const channelId = this.getNodeParameter('channelId', i) as string;
				const text = this.getNodeParameter('text', i) as string;
				const schedulingType = this.getNodeParameter('schedulingType', i) as string;
				const mode = this.getNodeParameter('mode', i) as string;
				const saveToDraft = this.getNodeParameter('saveToDraft', i) as boolean;
				const assetInputMode = this.getNodeParameter('assetInputMode', i) as string;
				const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
				const metadataJsonString = additionalFields.metadataJson as string | undefined;

				let finalAssets: IDataObject[] = [];

				if (assetInputMode === 'ui') {
					const assetsUi = this.getNodeParameter('assetsUi', i, {}) as IDataObject;
					const assetValues = (assetsUi.assetValues as IDataObject[]) || [];
					for (const asset of assetValues) {
						if (asset.type === 'image') {
							finalAssets.push({ image: { url: asset.url } });
						} else if (asset.type === 'video') {
							const videoAsset: IDataObject = { url: asset.url };
							if (asset.thumbnailUrl) {
								videoAsset.thumbnailUrl = asset.thumbnailUrl;
							}
							finalAssets.push({ video: videoAsset });
						} else if (asset.type === 'link') {
							finalAssets.push({ link: { url: asset.url } });
						} else if (asset.type === 'document') {
							finalAssets.push({ document: { url: asset.url } });
						}
					}
				} else {
					const assetsJsonString = this.getNodeParameter('assetsJson', i, '[]') as string;
					try {
						finalAssets = (typeof assetsJsonString === 'string' ? JSON.parse(assetsJsonString) : assetsJsonString) as IDataObject[];
					} catch {
						throw new NodeOperationError(this.getNode(), 'Invalid JSON provided for Assets', { itemIndex: i });
					}
				}

				const inputVariables: JsonObject = {
					channelId,
					text,
					schedulingType,
					mode,
					saveToDraft,
				};

				let metadata: IDataObject = {};

				if (metadataJsonString) {
					try {
						metadata =
							typeof metadataJsonString === 'string'
								? JSON.parse(metadataJsonString)
								: metadataJsonString;
					} catch {
						throw new NodeOperationError(this.getNode(), 'Invalid JSON provided for Metadata', {
							itemIndex: i,
						});
					}
				}

				if (service === 'facebook') {
					const facebookPostType = this.getNodeParameter('facebookPostType', i, 'post') as string;
					if (!metadata.facebook) {
						metadata.facebook = {};
					}
					(metadata.facebook as IDataObject).type = facebookPostType;
				} else if (service === 'instagram') {
					const instagramPostType = this.getNodeParameter('instagramPostType', i, 'post') as string;
					const shouldShareToFeed = this.getNodeParameter('instagramShouldShareToFeed', i, true) as boolean;
					if (!metadata.instagram) {
						metadata.instagram = {};
					}
					(metadata.instagram as IDataObject).type = instagramPostType;
					(metadata.instagram as IDataObject).shouldShareToFeed = shouldShareToFeed;
				} else if (service === 'googlebusiness') {
					const googleBusinessPostType = this.getNodeParameter('googleBusinessPostType', i, 'whats_new') as string;
					if (!metadata.google) {
						metadata.google = {};
					}
					(metadata.google as IDataObject).type = googleBusinessPostType;
				}

				if (Object.keys(metadata).length > 0) {
					inputVariables.metadata = metadata as unknown as JsonObject;
				}

				if (finalAssets.length > 0) {
					inputVariables.assets = finalAssets as unknown as JsonObject[];
				}

				const query = [
					'mutation CreatePost($input: CreatePostInput!) {',
					'  createPost(input: $input) {',
					'    ... on PostActionSuccess {',
					'      post {',
					'        id',
					'        text',
					'        assets {',
					'          id',
					'          mimeType',
					'        }',
					'      }',
					'    }',
					'    ... on MutationError {',
					'      message',
					'    }',
					'  }',
					'}',
				].join('\n');

				const responseData = await bufferApiRequest.call(this, query, { input: inputVariables });
				const createPostResponse = responseData.createPost as IDataObject;

				// Check for MutationError in the response
				if (createPostResponse?.message) {
					throw new NodeOperationError(
						this.getNode(),
						`Buffer API Error: ${createPostResponse.message as string}`,
						{ itemIndex: i },
					);
				}

				item = items[i];
				item.json.bufferResponse = createPostResponse?.post || createPostResponse;
			} catch (error) {
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(i)[0].json, error, pairedItem: i });
				} else {
					if ((error as JsonObject).context) {
						(error as JsonObject).context = { ...((error as JsonObject).context as object), itemIndex: i };
						throw new NodeApiError(this.getNode(), error as JsonObject);
					}
					throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
				}
			}
		}

		return [items];
	}
}
