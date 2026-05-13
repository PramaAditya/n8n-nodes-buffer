/* eslint-disable @n8n/community-nodes/no-credential-reuse */
import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	NodeConnectionTypes,
} from 'n8n-workflow';
import { spawn } from 'child_process';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { PassThrough } from 'stream';

export class YtDlpS3 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'yt-dlp S3 Downloader',
		name: 'ytDlpS3',
		icon: 'file:yt.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["url"]}}',
		description: 'Download video using yt-dlp and upload directly to S3',
		defaults: {
			name: 'yt-dlp S3',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 's3',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Video URL',
				name: 'url',
				type: 'string',
				default: '',
				required: true,
				description: 'The URL of the video to download (e.g. Instagram Reel URL)',
			},
			{
				displayName: 'S3 Bucket',
				name: 'bucket',
				type: 'string',
				default: '',
				required: true,
				description: 'The S3 bucket to upload the video to',
			},
			{
				displayName: 'Object Key (File Name)',
				name: 'objectKey',
				type: 'string',
				default: 'video.mp4',
				required: true,
				description: 'The file path/name to save as in S3 (e.g. folder/video.mp4)',
			},
			{
				displayName: 'S3 Public Base URL',
				name: 'publicUrl',
				type: 'string',
				default: '',
				description: 'Optional base URL (e.g. https://cdn.example.com) to generate a public link in the output',
			},
			{
				displayName: 'Format (Yt-Dlp)',
				name: 'format',
				type: 'string',
				default: 'best[ext=mp4]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best',
				description: 'The format string to pass to yt-dlp',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const url = this.getNodeParameter('url', i) as string;
				const bucket = this.getNodeParameter('bucket', i) as string;
				const objectKey = this.getNodeParameter('objectKey', i) as string;
				const publicUrl = this.getNodeParameter('publicUrl', i) as string;
				const format = this.getNodeParameter('format', i) as string;

				// Fetch credentials
				const credentials = await this.getCredentials('s3');
				
				const accessKeyId = credentials?.accessKeyId as string;
				const secretAccessKey = credentials?.secretAccessKey as string;
				const region = (credentials?.region as string) || 'us-east-1';
				const endpoint = credentials?.endpoint as string | undefined;
				const forcePathStyle = credentials?.forcePathStyle as boolean | undefined;

				if (!accessKeyId || !secretAccessKey) {
					throw new NodeOperationError(this.getNode(), 'Missing AWS S3 credentials!', { itemIndex: i });
				}

				// Initialize S3 Client
				const s3ClientConfig: Record<string, unknown> = {
					region,
					credentials: {
						accessKeyId,
						secretAccessKey,
					},
				};

				if (endpoint) {
					s3ClientConfig.endpoint = endpoint;
				}
				if (forcePathStyle) {
					s3ClientConfig.forcePathStyle = forcePathStyle;
				}

				const s3Client = new S3Client(s3ClientConfig);

				// Set up PassThrough stream
				const passThrough = new PassThrough();

				// Setup upload promise
				const upload = new Upload({
					client: s3Client,
					params: {
						Bucket: bucket,
						Key: objectKey,
						Body: passThrough,
						ContentType: 'video/mp4', // Assuming mp4 for general yt-dlp output
					},
				});

				const uploadPromise = upload.done();

				// Spawn yt-dlp
				const ytDlpProcess = spawn('yt-dlp', [
					'-f', format,
					'-o', '-', // Output to stdout
					'--quiet', // Less console noise
					'--no-warnings',
					url
				]);

				let errorOutput = '';

				ytDlpProcess.stderr.on('data', (data) => {
					errorOutput += data.toString();
				});

				// Pipe yt-dlp stdout to the S3 PassThrough stream
				ytDlpProcess.stdout.pipe(passThrough);

				// Wait for process to exit
				await new Promise<void>((resolve, reject) => {
					ytDlpProcess.on('close', (code) => {
						if (code !== 0) {
							reject(new Error(`yt-dlp failed with code ${code}: ${errorOutput}`));
						} else {
							resolve();
						}
					});
					ytDlpProcess.on('error', (err) => {
						reject(err);
					});
				});

				// Wait for S3 upload to finish
				const uploadResult = await uploadPromise;

				let finalUrl = uploadResult.Location;
				if (publicUrl) {
					// Clean trailing slash
					const baseUrl = publicUrl.replace(/\/$/, '');
					// Clean leading slash
					const safeKey = objectKey.replace(/^\//, '');
					finalUrl = `${baseUrl}/${safeKey}`;
				}

				returnData.push({
					json: {
						success: true,
						bucket,
						key: objectKey,
						location: uploadResult.Location,
						publicUrl: finalUrl,
						originalUrl: url,
					},
					pairedItem: i,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: i });
				} else {
					throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
				}
			}
		}

		return [returnData];
	}
}
