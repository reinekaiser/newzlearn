FROM jrottenberg/ffmpeg:4.4-alpine

RUN apk add --no-cache python3 py3-pip aws-cli

RUN pip3 install boto3 requests

COPY convert_to_hls.py /app/
WORKDIR /app
ENTRYPOINT []
# Chạy script khi container start
CMD ["python3", "convert_to_hls.py"]