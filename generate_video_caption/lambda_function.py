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
    Nhận 10 S3 keys, launch 10 tasks, return ngay
    KHÔNG chờ đợi gì cả!
    """
    
    print(f"📨 Received request")
    
    try:
        s3_bucket = event['s3_bucket']
        s3_keys = event['s3_keys']
        language = event.get('language')
        batch_id = event.get('batch_id')  
        
        # Validate
        if len(s3_keys) > 10:
            return error_response("Max 10 videos per batch", 400)
    
        
        # Launch tất cả tasks
        launched = []
        for i, s3_key in enumerate(s3_keys):
            try:
                task_arn = launch_task(
                    s3_bucket=s3_bucket,
                    s3_key=s3_key,
                    language=language,
                    webhook_url=WEBHOOK_URL,
                    batch_id=batch_id
                )
                launched.append(task_arn)
                print(f"✅ [{i+1}/{len(s3_keys)}] Launched: {task_arn[-8:]}")
            except Exception as e:
                print(f"❌ [{i+1}/{len(s3_keys)}] Failed: {str(e)}")
        
        print(f"🎉 Launched {len(launched)}/{len(s3_keys)} tasks")
        
        # Return ngay lập tức
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                 #'batch_id': batch_id,
                'tasks_launched': len(launched)
            })
        }
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return error_response(str(e), 500)


def launch_task(s3_bucket, s3_key, language, webhook_url="", batch_id=""):
    """Launch ECS task"""
    import uuid
    job_id = f"job_{uuid.uuid4().hex[:12]}"
    
    response = ecs.run_task(
        cluster=CLUSTER_NAME,
        taskDefinition=TASK_DEFINITION,
        launchType='FARGATE',
        count=1,
        networkConfiguration={
            'awsvpcConfiguration': {
                'subnets': SUBNETS,
                'securityGroups': [SECURITY_GROUP],
                'assignPublicIp': 'ENABLED'
            }
        },
        overrides={
            'containerOverrides': [{
                'name': 'generator',
                'environment': [
                    {'name': 'S3_BUCKET', 'value': s3_bucket},
                    {'name': 'S3_KEY', 'value': s3_key},
                    {'name': 'LANGUAGE', 'value': language or 'auto'},
                    {'name': 'WEBHOOK_URL', 'value': webhook_url},
                    {'name': 'BATCH_ID', 'value': batch_id}  # Gửi batch_id
                ]
            }]
        }
    )
    
    if not response.get('tasks'):
        raise Exception('Failed to launch task')
    
    return response['tasks'][0]['taskArn']


def error_response(message, status_code):
    return {
        'statusCode': status_code,
        'body': json.dumps({'success': False, 'error': message})
    }
