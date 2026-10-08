# Node + Python image for Express API and DeepFace face verification
FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/bin/python3 /usr/bin/python

WORKDIR /app

# Python deps (DeepFace / OpenCV) — large; cached unless requirements change
COPY requirements.txt .
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Node deps
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# App source
COPY . .

ENV NODE_ENV=production
ENV PYTHON_PATH=/usr/bin/python3
ENV PORT=1322

EXPOSE 1322

CMD ["node", "main.js"]
