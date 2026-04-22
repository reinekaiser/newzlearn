FROM python:3.10-slim

# Cài ffmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download Whisper models
RUN python - <<EOF
import whisper
for m in ["base", "small"]:
    whisper.load_model(m)
EOF

# Copy application
COPY generate_video_caption.py .

# Run
CMD ["python", "generate_video_caption.py"]
