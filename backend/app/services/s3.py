import boto3
from io import BytesIO
from datetime import datetime
from typing import Optional
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


class S3Service:
    """Service for uploading and managing files on AWS S3"""
    
    def __init__(self):
        self.bucket_name = settings.s3_bucket_name
        self.region = settings.aws_region
        self.s3_client = boto3.client(
            's3',
            region_name=self.region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
        )
    
    async def upload_csv(
        self,
        file_obj: BytesIO,
        upload_id: str,
        timestamp: datetime
    ) -> dict:
        """
        Upload CSV file to S3.
        
        Args:
            file_obj: File object to upload
            upload_id: Unique upload ID
            timestamp: Upload timestamp for S3 key naming
        
        Returns:
            Dict with s3_key and status
        
        Note:
            Errors are logged but don't raise exceptions (non-blocking).
        """
        s3_key = f"uploads/csv/{upload_id}-{timestamp.isoformat()}.csv"
        
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_obj.getvalue(),
                ContentType="text/csv",
            )
            
            logger.info(
                "csv_uploaded_to_s3",
                s3_key=s3_key,
                upload_id=upload_id
            )
            
            return {
                "s3_key": s3_key,
                "status": "uploaded"
            }
        
        except Exception as e:
            error_msg = str(e)
            logger.error(
                "s3_upload_failed",
                error=error_msg,
                upload_id=upload_id,
                s3_key=s3_key
            )
            
            # Return error but don't raise (non-blocking)
            return {
                "status": "failed",
                "error": error_msg,
                "s3_key": s3_key
            }
    
    def download_csv(self, s3_key: str) -> Optional[bytes]:
        """
        Download CSV file from S3.
        
        Args:
            s3_key: S3 object key
        
        Returns:
            File content as bytes or None if not found
        """
        try:
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            return response['Body'].read()
        
        except self.s3_client.exceptions.NoSuchKey:
            logger.warning("s3_file_not_found", s3_key=s3_key)
            return None
        
        except Exception as e:
            logger.error("s3_download_error", error=str(e), s3_key=s3_key)
            return None
    
    def generate_presigned_url(self, s3_key: str, expiration_seconds: int = 3600) -> Optional[str]:
        """
        Generate a presigned URL for downloading a file from S3.
        
        Args:
            s3_key: S3 object key
            expiration_seconds: URL expiration time in seconds
        
        Returns:
            Presigned URL or None on error
        """
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': s3_key},
                ExpiresIn=expiration_seconds
            )
            return url
        
        except Exception as e:
            logger.error(
                "presigned_url_generation_error",
                error=str(e),
                s3_key=s3_key
            )
            return None
