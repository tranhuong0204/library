from typing import Optional, List, Dict
from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    conversationId: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = []


class IngestRequest(BaseModel):
    filePath: Optional[str] = None
    fileUrl: Optional[str] = None
    title: Optional[str] = None
    documentId: Optional[str] = None