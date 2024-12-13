from setuptools import setup, find_packages

setup(
    name="youtube-digest",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        'fastapi>=0.104.1',
        'uvicorn>=0.24.0',
        'sqlalchemy>=2.0.23',
        'alembic>=1.12.1',
        'psycopg2-binary>=2.9.9',
        'python-dotenv>=1.0.0',
        'yt-dlp>=2023.11.16',
        'openai>=1.3.5'
    ],
)
