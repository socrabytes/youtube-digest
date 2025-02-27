#!/usr/bin/env python3
"""
Script to test the database connection.
This script is used to verify that the database connection is working correctly.
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import get_db
from app.models import (
    Video, Channel, Transcript, Digest, User, Category, LLM, ProcessingLog
)

def test_connection():
    """Test the database connection."""
    print("Testing database connection...")
    
    try:
        # Get a database session
        db = next(get_db())
        
        # Execute a simple query
        result = db.execute(text("SELECT 1")).scalar()
        
        if result == 1:
            print("✅ Database connection successful!")
            return True
        else:
            print("❌ Database connection failed!")
            return False
    except SQLAlchemyError as e:
        print(f"❌ Database connection error: {e}")
        return False
    finally:
        if 'db' in locals():
            db.close()

def list_tables():
    """List all tables in the database."""
    print("\nListing database tables...")
    
    try:
        # Get a database session
        db = next(get_db())
        
        # Execute a query to list all tables
        result = db.execute(text(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = 'public'"
        ))
        
        tables = [row[0] for row in result]
        
        if tables:
            print("Tables in the database:")
            for table in sorted(tables):
                print(f"  - {table}")
        else:
            print("No tables found in the database!")
        
        return tables
    except SQLAlchemyError as e:
        print(f"❌ Error listing tables: {e}")
        return []
    finally:
        if 'db' in locals():
            db.close()

def count_records():
    """Count records in each table."""
    print("\nCounting records in tables...")
    
    tables = {
        "videos": Video,
        "channels": Channel,
        "transcripts": Transcript,
        "digests": Digest,
        "users": User,
        "categories": Category,
        "llms": LLM,
        "processing_logs": ProcessingLog
    }
    
    try:
        # Get a database session
        db = next(get_db())
        
        for table_name, model in tables.items():
            try:
                count = db.query(model).count()
                print(f"  - {table_name}: {count} records")
            except SQLAlchemyError as e:
                print(f"  - {table_name}: Error counting records: {e}")
    except SQLAlchemyError as e:
        print(f"❌ Database error: {e}")
    finally:
        if 'db' in locals():
            db.close()

def main():
    """Main function."""
    print("Starting database tests...")
    
    # Test connection
    if test_connection():
        # List tables
        list_tables()
        
        # Count records
        count_records()
    
    print("\nDatabase tests completed!")

if __name__ == "__main__":
    main()
