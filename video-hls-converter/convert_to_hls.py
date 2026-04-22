import boto3
import subprocess
import os
import sys
from pathlib import Path
import requests
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from boto3.s3.transfer import TransferConfig

# S3 client với config tối ưu
transfer_config = TransferConfig(
    multipart_threshold=8 * 1024 * 1024,
    max_concurrency=10,
    multipart_chunksize=8 * 1024 * 1024,
    use_threads=True
)

s3 = boto3.client('s3')

def download_from_s3(bucket, key, local_path):
    """Download video từ S3 về local"""
    print(f"📥 Downloading s3://{bucket}/{key}")
    try:
        s3.download_file(bucket, key, local_path, Config=transfer_config)
        file_size = os.path.getsize(local_path) / (1024 * 1024)  # MB
        print(f"Downloaded: {file_size:.2f} MB")
    except Exception as e:
        raise Exception(f"Failed to download from S3: {str(e)}")

def upload_to_s3(local_path, bucket, key):
    """Upload file lên S3"""
    print(f"📤 Uploading {os.path.basename(local_path)} to s3://{bucket}/{key}")
    try:
        s3.upload_file(local_path, bucket, key)
        print(f"Uploaded: {key}")
    except Exception as e:
        raise Exception(f"Failed to upload to S3: {str(e)}")
    
def get_video_resolution(input_file):
    """Lấy độ phân giải gốc của video (width, height)"""
    cmd = [
        "ffprobe",
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height",
        "-of", "csv=s=x:p=0",
        input_file
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    resolution = result.stdout.strip()
    
    if not resolution:
        raise Exception("Không lấy được thông tin độ phân giải video.")
    
    width, height = map(int, resolution.split('x'))
    return width, height


def get_valid_profiles(input_height):
    """Chọn các profile HLS phù hợp với độ phân giải gốc"""
    profiles = [
        {"name": "480p", "width": 854,  "height": 480,  "bitrate": "1400k"},
        {"name": "720p", "width": 1280, "height": 720,  "bitrate": "2500k"},
        {"name": "1080p","width": 1920, "height": 1080, "bitrate": "5000k"},
    ]
    # Chỉ chọn những mức ≤ độ cao gốc
    return [p for p in profiles if p["height"] <= input_height]

def encode_single_profile(args):
    """
    Encode 1 profile - chạy trong process riêng
    Trả về: (profile_name, success, error_message)
    """
    input_file, output_dir, profile = args
    
    profile_name = profile["name"]
    out_dir = os.path.join(output_dir, profile_name)
    os.makedirs(out_dir, exist_ok=True)
    output_playlist = os.path.join(out_dir, "playlist.m3u8")
    
    # Số threads cho mỗi FFmpeg instance
    cpu_count = os.cpu_count() or 4
    threads_per_profile = max(1, cpu_count // 4)  # Chia CPU cho các profiles
    
    cmd = [
        "ffmpeg",
        "-i", input_file,
        "-threads", str(threads_per_profile),
        "-vf", f"scale={profile['width']}:{profile['height']}",
        "-c:v", "libx264",
        "-preset", "veryfast",  # ← TỐI ƯU: Fast preset
        "-crf", "23",            # ← TỐI ƯU: Reasonable quality
        "-b:v", profile["bitrate"],
        "-maxrate", profile["bitrate"],
        "-bufsize", str(int(profile["bitrate"].replace("k", "")) * 2) + "k",
        "-c:a", "aac",
        "-b:a", "128k",
        "-ac", "2",              # Stereo
        "-ar", "48000",          # Sample rate
        "-hls_time", "6",        # ← TỐI ƯU: Segment nhỏ hơn
        "-hls_list_size", "0",
        "-hls_flags", "independent_segments",
        "-f", "hls",
        output_playlist
    ]
    
    print(f"[{profile_name}] Starting encode...")
    
    try:
        result = subprocess.run(
            cmd, 
            capture_output=True, 
            text=True,
            timeout=1800  # 30 phút timeout
        )
        
        if result.returncode != 0:
            error_msg = result.stderr[-500:] if result.stderr else "Unknown error"
            print(f"[{profile_name}] Failed: {error_msg}")
            return (profile_name, False, error_msg)
        
        # Kiểm tra output files
        files = os.listdir(out_dir)
        if not files or 'playlist.m3u8' not in files:
            print(f"[{profile_name}] No output files generated")
            return (profile_name, False, "No output files")
        
        print(f"[{profile_name}] Completed! Generated {len(files)} files")
        return (profile_name, True, None)
        
    except subprocess.TimeoutExpired:
        print(f"[{profile_name}] Timeout after 30 minutes")
        return (profile_name, False, "Timeout")
    except Exception as e:
        print(f"[{profile_name}] Exception: {str(e)}")
        return (profile_name, False, str(e))

def create_master_playlist(output_dir, successful_profiles, bucket, hls_base_path):
    """Tạo master.m3u8 với full S3 URLs"""
    master_path = os.path.join(output_dir, "master.m3u8")
    
    # S3 base URL
    region = os.environ.get('AWS_REGION', 'ap-southeast-1')
    s3_base_url = f"https://{bucket}.s3.{region}.amazonaws.com/{hls_base_path}"
    
    with open(master_path, "w") as f:
        f.write("#EXTM3U\n")
        f.write("#EXT-X-VERSION:3\n")
        
        for p in successful_profiles:
            bandwidth = int(p["bitrate"].replace("k", "000"))
            resolution = f"{p['width']}x{p['height']}"
            
            # ✅ DÙNG FULL URL
            playlist_url = f"{s3_base_url}/{p['name']}/playlist.m3u8"
            
            f.write(f"#EXT-X-STREAM-INF:BANDWIDTH={bandwidth},RESOLUTION={resolution}\n")
            f.write(f"{playlist_url}\n")  # ← Full URL thay vì relative path
    
    print(f"\n✅ Master playlist created: {master_path}")
    return master_path

def convert_to_hls_parallel(input_file, output_dir, bucket, hls_base_path ):
    """
    Tạo nhiều phiên bản HLS SONG SONG
    """
    os.makedirs(output_dir, exist_ok=True)

    width, height = get_video_resolution(input_file)
    print(f"Video gốc: {width}x{height}")
    
    valid_profiles = get_valid_profiles(height)
    print(f"Sẽ tạo {len(valid_profiles)} profiles:")
    for p in valid_profiles:
        print(f"   - {p['name']} ({p['width']}x{p['height']} @ {p['bitrate']})")

    print(f"\nEncoding {len(valid_profiles)} profiles in parallel...")

    encode_args = [(input_file, output_dir, p) for p in valid_profiles]
 
    max_workers = min(len(valid_profiles), 4)
    
    results = {}
    
    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        future_to_profile = {
            executor.submit(encode_single_profile, args): args[2]['name']
            for args in encode_args
        }
        
        for future in as_completed(future_to_profile):
            profile_name, success, error = future.result()
            results[profile_name] = (success, error)
    
    successful_profiles = [p for p in valid_profiles if results.get(p['name'], (False, None))[0]]
    failed_profiles = [p for p in valid_profiles if not results.get(p['name'], (False, None))[0]]
    
    print(f"\n📊 Encoding results:")
    print(f"   ✅ Successful: {len(successful_profiles)}")
    print(f"   ❌ Failed: {len(failed_profiles)}")
    
    if failed_profiles:
        for p in failed_profiles:
            error = results.get(p['name'], (False, "Unknown"))[1]
            print(f"      - {p['name']}: {error}")
    
    if not successful_profiles:
        raise Exception("All profiles failed to encode!")
    
    master_path = create_master_playlist(
        output_dir, 
        successful_profiles,
        bucket,
        hls_base_path
    )
    
    print(f"\n✅ Master playlist created: {master_path}")
    print(f"🎉 Adaptive HLS completed! ({len(successful_profiles)} profiles)")
    
    return successful_profiles

def upload_hls_parallel(output_dir, bucket, hls_base_path):
    """Upload tất cả HLS files song song"""
    from concurrent.futures import ThreadPoolExecutor
    
    print(f"\n📤 Uploading HLS files to s3://{bucket}/{hls_base_path}/")
    
    files_to_upload = []
    
    # Thu thập tất cả files
    for root, dirs, files in os.walk(output_dir):
        for file in files:
            local_path = os.path.join(root, file)
            relative_path = os.path.relpath(local_path, output_dir)
            s3_key = f"{hls_base_path}/{relative_path}"
            files_to_upload.append((local_path, s3_key))
    
    print(f"   Found {len(files_to_upload)} files to upload")
    
    def upload_one(local_file, s3_key):
        try:
            s3.upload_file(local_file, bucket, s3_key, Config=transfer_config)
            return (True, s3_key)
        except Exception as e:
            print(f"Upload failed: {s3_key} - {str(e)}")
            return (False, s3_key)
    
    uploaded_count = 0
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(upload_one, local, s3key) 
                   for local, s3key in files_to_upload]
        
        for future in as_completed(futures):
            success, s3_key = future.result()
            if success:
                uploaded_count += 1
                if uploaded_count % 10 == 0:
                    print(f"   Uploaded {uploaded_count}/{len(files_to_upload)} files...")
    
    print(f"✅ Uploaded {uploaded_count}/{len(files_to_upload)} files")
    return uploaded_count
    
def notify_webhook(s3_key, status, job_id, hls_path=None, error=None, max_retries=3):
    WEBHOOK_URL = os.environ.get('WEBHOOK_URL')
    """Gọi webhook với retry logic"""
    if not WEBHOOK_URL:
        return
    
    payload = {
        's3Key': s3_key,
        'status': status,
        'hlsURL': hls_path,
        'jobId': job_id,
        'error': error
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

def main():
    print("=" * 60)
    print("HLS Converter Started")
    print("=" * 60)
    
    # Lấy thông tin từ environment variables
    s3_key = os.environ.get('S3_KEY')
    bucket = os.environ.get('BUCKET')
    output_prefix = os.environ.get('OUTPUT_PREFIX', 'hls-output')
    job_id = os.environ.get('JOB_ID')
    
    print()
    # Validate
    if not s3_key or not bucket:
        print("ERROR: S3_KEY and BUCKET environment variables are required")
        sys.exit(1)
    
    print(f"📋 Input: s3://{bucket}/{s3_key}")
    print(f"📋 Output prefix: {output_prefix}")
    
    # Tạo working directory
    work_dir = '/tmp/video_processing'
    os.makedirs(work_dir, exist_ok=True)
    
    # Lấy extension từ s3_key
    _, ext = os.path.splitext(s3_key)
    input_file = f'{work_dir}/input_video{ext}'
    output_dir = f'{work_dir}/hls_output'
    
    try:
        print(f"\n📥 Downloading s3://{bucket}/{s3_key}")
        s3.download_file(bucket, s3_key, input_file, Config=transfer_config)
        file_size = os.path.getsize(input_file) / (1024 * 1024)
        print(f"✅ Downloaded: {file_size:.2f} MB")
        
        video_name = Path(s3_key).stem
        original_dir = os.path.dirname(s3_key)
        hls_base_path = f'{original_dir}/{output_prefix}/{video_name}'
        # Convert (parallel)
        successful_profiles = convert_to_hls_parallel(input_file, output_dir, bucket, hls_base_path)
        
        # Upload (parallel)
        uploaded_count = upload_hls_parallel(output_dir, bucket, hls_base_path)
        
        print("\n" + "=" * 70)
        print(f"✅ SUCCESS!")
        print(f"   Profiles: {len(successful_profiles)}")
        print(f"   Files uploaded: {uploaded_count}")
        print(f"   Master playlist: s3://{bucket}/{hls_base_path}/master.m3u8")
        print("=" * 70)


        notify_webhook(
            s3_key=s3_key,
            status='success',
            job_id=job_id,
            hls_path=f"https://{bucket}.s3.ap-southeast-1.amazonaws.com/{hls_base_path}/master.m3u8"
        )
        
    except Exception as e:
        print("=" * 60)
        print(f"ERROR: {str(e)}")
        print("=" * 60)
        notify_webhook(
            s3_key=s3_key,
            status='failed',
            job_id=job_id,
            error=str(e)
        )
        sys.exit(1)
    
    finally:
        # Cleanup
        print("Cleaning up temporary files...")
        if os.path.exists(work_dir):
            import shutil
            shutil.rmtree(work_dir)
        print("Cleanup completed")

if __name__ == '__main__':
    main()