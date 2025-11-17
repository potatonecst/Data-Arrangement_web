#syntax=docker/dockerfile:1.4
FROM python:3.13.5-slim-bullseye AS builder
ENV DEBIAN_FRONTEND=nointeractive
WORKDIR /wheels

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential gfortran pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN python -m pip install --upgrade pip setuptools wheel \
    && pip wheel --no-deps --no-cache-dir -r requirements.txt -w /wheels \
    && find /wheels -type f -name "*.so" -exec strip --strip-unneeded {} + || true

# --- runtime ---
FROM python:3.13.5-slim-bullseye AS runtime
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 libopenblas0-pthread \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir /wheels/*.whl \
    && rm -rf /wheels /root/.cache/pip /usr/local/lib/python3.13/site-packages/pip*

RUN find /usr/local/lib/python3.13 -type f -name "*.so" -exec strip --strip-unneeded {} + || true \
    && find /usr/local/lib/python3.13 -type f \( -name "*.a" -o -name "*.pyc" -o -name "*.pyo" \) -delete \
    && find /usr/local/lib/python3.13 -type d \( -name "__pycache__" -o -name "tests" -o -name "test" \) -exec rm -rf {} + \
    && rm -rf /root/.cache /tmp/*

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]