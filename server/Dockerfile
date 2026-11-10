FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip curl ca-certificates libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/bin/python3 /usr/bin/python

WORKDIR /app

COPY requirements.txt .
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY . .

# Face models (skipped if you already committed them to face_service/models)
RUN mkdir -p face_service/models && cd face_service/models && \
    ( [ -f face_detection_yunet_2023mar.onnx ] || curl -L --fail -o face_detection_yunet_2023mar.onnx https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx ) && \
    ( [ -f face_recognition_sface_2021dec.onnx ] || curl -L --fail -o face_recognition_sface_2021dec.onnx https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx )

ENV NODE_ENV=production
ENV PYTHON_PATH=/usr/bin/python3
ENV PORT=1322

EXPOSE 1322
CMD ["node", "main.js"]
