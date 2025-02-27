#!/bin/bash
# Script to run tests in the Docker environment

# Set environment variables for test database
export POSTGRES_SERVER=db
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=postgres
export POSTGRES_DB=youtube_digest

echo "Running API endpoint tests in Docker environment..."

# Make sure we're in the project root directory
cd "$(dirname "$0")/../.."

# Install any missing dependencies
docker-compose exec -T backend pip install -r /app/requirements.txt

# Run the tests with PostgreSQL configuration
docker-compose exec -T backend pytest -v /app/tests/api/test_endpoints.py -v

# Exit with the same status as the test command
exit $?
