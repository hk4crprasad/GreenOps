FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:0.10.9 /uv /usr/local/bin/uv
WORKDIR /app
COPY services/api/pyproject.toml services/api/uv.lock ./
RUN uv sync --frozen --no-install-project
ENV PATH="/app/.venv/bin:$PATH" PYTHONPATH=/app
COPY services/api/app ./app
COPY services/api/alembic ./alembic
COPY services/api/alembic.ini ./
COPY services/api/tests ./tests
COPY data/public ./data/public
COPY scripts/verify_runtime_bundle.py /tmp/verify-runtime-bundle.py
RUN python /tmp/verify-runtime-bundle.py /app/data/public/starter && useradd -u 10001 -m app
USER app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
