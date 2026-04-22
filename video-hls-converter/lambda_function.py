import json
import boto3
import os

ecs = boto3.client('ecs')

CLUSTER_NAME = os.environ.get('CLUSTER_NAME', 'video-processing-cluster')
TASK_DEFINITION = os.environ.get('TASK_DEFINITION', 'hls-converter:1')
SUBNETS = os.environ.get('SUBNETS', '').split(',')
SECURITY_GROUP = os.environ.get('SECURITY_GROUP', '')
WEBHOOK_URL = os.environ.get('WEBHOOK_URL', '')

def lambda_handler(event, context):
    """
    Expected event format:
    {
        "s3Keys": ["path/video1.mp4", "path/video2.mp4"],
        "bucket": "my-video-bucket",
        "outputPrefix": "hls-output"  # optional
    }
    """
    
    print(f"Received event: {json.dumps(event)}")
    
    try:
        # Parse request body
        if 'body' in event:
            # From API Gateway
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            # Direct invocation
            body = event
        
        s3_keys = body.get('s3Keys', [])
        bucket = body.get('bucket')
        output_prefix = body.get('outputPrefix', 'hls-output')
        
        # Validate input
        if not s3_keys:
            return response_error(400, 's3Keys is required and cannot be empty')
        
        if not bucket:
            return response_error(400, 'bucket is required')
        
        if not isinstance(s3_keys, list):
            return response_error(400, 's3Keys must be an array')
        
        print(f"Processing {len(s3_keys)} videos from bucket: {bucket}")
        
        # Start ECS tasks
        task_arns = []
        failed_videos = []
        
        for s3_key in s3_keys:
            try:
                print(f"Starting ECS task for: {s3_key}")
                
                response = ecs.run_task(
                    cluster=CLUSTER_NAME,
                    taskDefinition=TASK_DEFINITION,
                    launchType='FARGATE',
                    networkConfiguration={
                        'awsvpcConfiguration': {
                            'subnets': SUBNETS,
                            'securityGroups': [SECURITY_GROUP],
                            'assignPublicIp': 'ENABLED'
                        }
                    },
                    overrides={
                        'containerOverrides': [{
                            'name': 'converter',
                            'environment': [
                                {'name': 'S3_KEY', 'value': s3_key},
                                {'name': 'BUCKET', 'value': bucket},
                                {'name': 'OUTPUT_PREFIX', 'value': output_prefix},
                                {'name': 'WEBHOOK_URL', 'value': WEBHOOK_URL}
                            ]
                        }]
                    }
                )
                
                if response['tasks']:
                    task_arn = response['tasks'][0]['taskArn']
                    task_arns.append({
                        's3Key': s3_key,
                        'taskArn': task_arn
                    })
                    print(f"✅ Started task: {task_arn}")
                else:
                    failed_videos.append({
                        's3Key': s3_key,
                        'reason': 'No task created'
                    })
                    print(f"❌ Failed to start task for {s3_key}")
                    
            except Exception as e:
                failed_videos.append({
                    's3Key': s3_key,
                    'reason': str(e)
                })
                print(f"❌ Error starting task for {s3_key}: {str(e)}")
        
        # Prepare response
        result = {
            'message': f'Started {len(task_arns)} conversion tasks',
            'successful': len(task_arns),
            'failed': len(failed_videos),
            'tasks': task_arns,
            'bucket': bucket,
            'outputPrefix': output_prefix
        }
        
        if failed_videos:
            result['failedVideos'] = failed_videos
        
        print(f"Result: {json.dumps(result)}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result)
        }
        
    except Exception as e:
        print(f"Lambda error: {str(e)}")
        import traceback
        traceback.print_exc()
        return response_error(500, str(e))

def response_error(status_code, message):
    """Helper function for error responses"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'error': message
        })
    }