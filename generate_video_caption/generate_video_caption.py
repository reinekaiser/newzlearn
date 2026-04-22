import os
import sys
import json
import boto3
import whisper
import requests
import time
import subprocess
import tempfile
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, List

# AWS Clients
s3_client = boto3.client('s3')

# Load model
MODEL_SIZE = os.environ.get('WHISPER_MODEL', 'small')

model = whisper.load_model(MODEL_SIZE)
print("Model loaded successfully")


def main():
    """
    Main entry point - Xử lý transcription
    """

    s3_key = os.environ.get('S3_KEY')
    bucket = os.environ.get('S3_BUCKET')
    batch_id = os.environ.get('BATCH_ID')
    source_language = os.environ.get('LANGUAGE', "auto")
    if not all([ bucket, s3_key, batch_id]):
        print("ERROR: Missing required environment variables")
        print(f"S3_BUCKET: {bucket}")
        print(f"S3_KEY: {s3_key}")
        print(f"BATCH_ID: {batch_id}")
        sys.exit(1)
    
    print(f"S3 Location: s3://{bucket}/{s3_key}")
    print(f"Language: {source_language}")
    
    try:
        video_path = download_from_s3(bucket, s3_key)
        
        # Step 2: Extract audio
        print("Step 2: Extracting audio...")
        audio_path = extract_audio(video_path)
        
        # Step 3: Transcribe with Whisper
        print("Step 3: Transcribing audio...")
        results = generatel_captions(audio_path, Path(s3_key).stem, source_language)
        
        # Upload captions lên S3
        uploaded_files = {}
        
        for lang, caption_data in results.items():
            vtt_content = convert_to_vtt(caption_data['segments'])
            video_name = Path(s3_key).stem
            original_dir = os.path.dirname(s3_key)
            # Tạo S3 key cho caption
            if lang == source_language:
                caption_key = f"{original_dir}/captions/{lang}/{video_name}.vtt"
            else:
                caption_key = f"{original_dir}/captions/{lang}/{video_name}.vtt"
            
            # Upload
            
            upload_to_s3(bucket, caption_key, vtt_content.encode('utf-8'), 'text/vtt')
            uploaded_files[lang] = {
                's3_key': caption_key,
                'public_url': f"https://{bucket}.s3.ap-southeast-1.amazonaws.com/{caption_key}",
                'is_translation': caption_data.get('is_translation', False)
            }
        
        print(f"✅ Successfully created bilingual captions")
        
        # Step 6: Mark as completed
        result = {
            'status': "success",
            's3_key': s3_key,
            'language': source_language,
            'generated_captions': uploaded_files,
        }

        print(result)
        
        notify_webhook(batch_id=batch_id, data=result)
        
        
        # # Send SNS notification
        # if SNS_TOPIC_ARN:
        #     send_sns_notification({
        #         'event': 'job_completed',
        #         'job_id': JOB_ID,
        #         **job_result
        #     })
        
        
    except Exception as e:
        print(f"ERROR: Job failed - {str(e)}")
        import traceback
        traceback.print_exc()

        result = {
            'status': 'error',
            'error': str(e),
            'original_video': s3_key
        }

        notify_webhook(batch_id=batch_id, data=result)
        
        # Send failure notification
        # if SNS_TOPIC_ARN:
        #     send_sns_notification({
        #         'event': 'job_failed',
        #         'job_id': JOB_ID,
        #         'error': str(e)
        #     })
        
        sys.exit(1)
    finally:
        # Cleanup temporary files
        if video_path and os.path.exists(video_path):
            os.unlink(video_path)
        if audio_path and os.path.exists(audio_path):
            os.unlink(audio_path)


def download_from_s3(bucket: str, key: str) -> str:
    """Download video từ S3"""
    with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as f:
        video_path = f.name
        print(f"Downloading to {video_path}")
        s3_client.download_file(bucket, key, video_path)
        file_size = os.path.getsize(video_path)
        print(f"Downloaded {file_size / 1024 / 1024:.2f} MB")
        return video_path


def upload_to_s3(bucket: str, key: str, data: bytes, content_type: str):
    """Upload file lên S3"""
    print(f"Uploading to s3://{bucket}/{key}")
    s3_client.put_object(
        Bucket=bucket,
        Key=key,
        Body=data,
        ContentType=content_type
    )
    print(f"Uploaded {len(data) / 1024:.2f} KB")


def extract_audio(video_path: str) -> str:
    """Tách audio từ video bằng ffmpeg"""
    audio_path = video_path.rsplit('.', 1)[0] + '.mp3'
    
    command = [
        'ffmpeg',
        '-i', video_path,
        '-vn',
        '-acodec', 'libmp3lame',
        '-ar', '16000',  # 16kHz sample rate (optimal cho Whisper)
        '-ac', '1',      # Mono
        '-b:a', '64k',   # Bitrate
        '-y',
        audio_path
    ]
    
    print(f"Running: {' '.join(command)}")
    result = subprocess.run(
        command,
        check=True,
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print(f"ffmpeg stderr: {result.stderr}")
        raise Exception(f"ffmpeg failed: {result.stderr}")
    
    file_size = os.path.getsize(audio_path)
    print(f"Audio extracted: {file_size / 1024 / 1024:.2f} MB")
    
    return audio_path

def cleanup_files(file_paths):
    """Dọn dẹp temporary files"""
    for file_path in file_paths:
        if os.path.exists(file_path):
            os.unlink(file_path)

def transcribe_audio(audio_path, language, task="transcribe"):

    result = model.transcribe(
        audio_path,
        language=language,
        task=task,
        fp16=False,
        temperature=0.0,
        best_of=5,
        beam_size=5
    )
    
    return result

def generatel_captions(audio_path, base_filename, source_language):
    """Tạo phụ đề 2 ngôn ngữ: gốc + tiếng Anh"""
    
    captions = {}
    
    # 1. Tạo phụ đề ngôn ngữ gốc
    print(f"🎯 Creating {source_language} caption...")
    original_result = transcribe_audio(audio_path, source_language, "transcribe")
    
    captions[source_language] = {
        'segments': original_result['segments'],
        'text': original_result['text'],
        'is_translation': False
    }
    
    # 2. Tạo phụ đề tiếng Anh
    print(f"🌍 Creating English caption...")
    if source_language == 'en':
        # Nếu gốc đã là tiếng Anh, chỉ cần copy
        english_result = original_result
        is_translation = False
    else:
        # Dịch sang tiếng Anh
        english_result = transcribe_audio(audio_path, source_language, "translate")
        is_translation = True
    
    captions['en'] = {
        'segments': english_result['segments'],
        'text': english_result['text'],
        'is_translation': is_translation
    }
    
    return captions

def convert_to_vtt(segments: List[Dict]) -> str:
    """Chuyển đổi segments sang WebVTT format"""
    vtt_lines = ["WEBVTT", ""]
    
    for segment in segments:
        start_time = format_timestamp(segment['start'], srt=False)
        end_time = format_timestamp(segment['end'], srt=False)
        text = segment['text'].strip()
        
        vtt_lines.append(f"{start_time} --> {end_time}")
        vtt_lines.append(text)
        vtt_lines.append("")
    
    return "\n".join(vtt_lines)


def format_timestamp(seconds: float, srt: bool = True) -> str:
    """Format timestamp cho SRT hoặc VTT"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    
    if srt:
        # SRT format: 00:00:00,000
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"
    else:
        # VTT format: 00:00:00.000
        return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


def notify_webhook(batch_id, data, max_retries=3):
    WEBHOOK_URL = os.environ.get('WEBHOOK_URL')
    """Gọi webhook với retry logic"""
    if not WEBHOOK_URL:
        return
    
    payload = {
        'batch_id': batch_id,
        **data
    }
    
    for attempt in range(max_retries):
        try:
            print(f"Calling webhook (attempt {attempt + 1}/{max_retries})...")
            
            response = requests.post(
                WEBHOOK_URL,
                json=payload,
                timeout=60  
            )
            
            if response.status_code == 200:
                print(f"Webhook called successfully")
                return True
            else:
                print(f"Webhook returned {response.status_code}, retrying...")
                return False
                
        except requests.exceptions.Timeout:
            print(f"Webhook timeout, retrying in 10s...")
            if attempt < max_retries - 1:
                time.sleep(10)
            
        except Exception as e:
            print(f"Webhook error: {str(e)}, retrying...")
            if attempt < max_retries - 1:
                time.sleep(10)
    
    print(f"Failed to call webhook after {max_retries} attempts")
    return False


# def send_sns_notification(message: Dict):
#     """Gửi notification qua SNS"""
#     try:
#         sns_client.publish(
#             TopicArn=SNS_TOPIC_ARN,
#             Message=json.dumps(message),
#             Subject=f"Transcription Job {message.get('event', 'update')}"
#         )
#         print(f"SNS notification sent")
#     except Exception as e:
#         print(f"Warning: Failed to send SNS notification: {str(e)}")


if __name__ == '__main__':
    main()