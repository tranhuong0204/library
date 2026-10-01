import os
import re
import logging
from typing import List, Optional

from fastapi import HTTPException
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

from config import AI_UPLOAD_DIR, VECTOR_DB_PATH, EMBEDDING_MODEL_NAME
from schemas import IngestRequest

logger = logging.getLogger("ai_service")

embeddings: Optional[HuggingFaceEmbeddings] = None
vector_store: Optional[FAISS] = None


def get_embeddings() -> HuggingFaceEmbeddings:
    """Create the embedding model only when a vector operation needs it.

    Metadata-only chat paths and their unit tests must not download/load a
    transformer model merely because they import this module.
    """
    global embeddings
    if embeddings is None:
        embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)
    return embeddings


def robust_sanitize(text):
    if text is None:
        return ""
    if not isinstance(text, str):
        text = str(text)
    return re.sub(r"[\ud800-\udfff]", "", text)


def load_vector_store():
    global vector_store

    if os.path.exists(VECTOR_DB_PATH):
        try:
            vector_store = FAISS.load_local(
                VECTOR_DB_PATH,
                get_embeddings(),
                allow_dangerous_deserialization=True
            )
            logger.info("Vector store loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load vector store: {e}")
            vector_store = None
    else:
        logger.warning("Vector store not found. Chatbot will still work in normal chat mode.")


def get_vector_store():
    return vector_store


def has_vector_store() -> bool:
    return vector_store is not None


def get_all_vector_docs() -> List:
    if not vector_store:
        return []

    try:
        return list(vector_store.docstore._dict.values())
    except Exception as e:
        logger.error(f"Cannot read FAISS docstore: {e}")
        return []


def save_vector_store():
    if vector_store is not None:
        vector_store.save_local(VECTOR_DB_PATH)


def resolve_ingest_file_path(request: IngestRequest) -> str:
    if request.filePath and request.filePath.strip():
        raise HTTPException(
            status_code=400,
            detail="filePath không được hỗ trợ; hãy sử dụng fileUrl trong thư mục uploads.",
        )

    resolved_path = None

    if request.fileUrl and request.fileUrl.strip():
        normalized_url = request.fileUrl.replace("\\", "/").strip()
        if not normalized_url.startswith("/uploads/"):
            raise HTTPException(
                status_code=400,
                detail="fileUrl phải nằm trong thư mục /uploads/.",
            )

        relative_path = normalized_url.removeprefix("/uploads/")
        resolved_path = os.path.realpath(os.path.join(AI_UPLOAD_DIR, relative_path))

        try:
            inside_upload_dir = os.path.commonpath(
                [AI_UPLOAD_DIR, resolved_path]
            ) == AI_UPLOAD_DIR
        except ValueError:
            inside_upload_dir = False

        if not inside_upload_dir:
            raise HTTPException(
                status_code=400,
                detail="Đường dẫn tệp nằm ngoài thư mục uploads.",
            )

        if os.path.isfile(resolved_path):
            return resolved_path

    err_path = request.filePath if request.filePath else resolved_path

    if not err_path:
        err_path = "Không có đường dẫn file nào được cung cấp."

    raise HTTPException(
        status_code=400,
        detail=f"Tệp không tồn tại. Đường dẫn đã phân giải: {err_path}"
    )


def ingest_document(request: IngestRequest):
    global vector_store

    try:
        resolved_path = resolve_ingest_file_path(request)

        if not resolved_path.lower().endswith(".pdf"):
            return {
                "status": "skipped",
                "message": "Chỉ hỗ trợ nạp tệp PDF.",
                "filePath": resolved_path,
                "fileUrl": request.fileUrl,
                "chunks": 0
            }

        loader = PyMuPDFLoader(resolved_path)
        documents = loader.load()

        request_document_id = str(request.documentId).strip() if request.documentId else None

        for d in documents:
            d.metadata["source"] = resolved_path

            if request_document_id:
                d.metadata["document_id"] = request_document_id

            if request.fileUrl:
                d.metadata["originalFileUrl"] = request.fileUrl

            if request.title:
                d.metadata["title"] = request.title

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=150
        )

        texts = text_splitter.split_documents(documents)

        if vector_store is not None:
            old_docs = list(vector_store.docstore._dict.values())
            remaining_docs = []

            for doc in old_docs:
                source_val = doc.metadata.get("source")
                url_val = doc.metadata.get("originalFileUrl")
                doc_id_val = doc.metadata.get("document_id")

                is_duplicate = False

                if request_document_id and str(doc_id_val) == request_document_id:
                    is_duplicate = True
                elif source_val and source_val == resolved_path:
                    is_duplicate = True
                elif url_val and request.fileUrl and url_val == request.fileUrl:
                    is_duplicate = True

                if not is_duplicate:
                    remaining_docs.append(doc)

            new_docs = remaining_docs + texts

            logger.info(
                f"Rebuilt vector store. old_docs={len(old_docs)}, "
                f"new_docs={len(new_docs)}, documentId={request_document_id}"
            )

            vector_store = FAISS.from_documents(new_docs, get_embeddings())
        else:
            vector_store = FAISS.from_documents(texts, get_embeddings())

        vector_store.save_local(VECTOR_DB_PATH)

        logger.info(
            f"Ingest success: documentId={request_document_id}, "
            f"fileUrl={request.fileUrl}, chunks={len(texts)}"
        )

        return {
            "status": "success",
            "documentId": request_document_id,
            "filePath": resolved_path,
            "fileUrl": request.fileUrl,
            "chunks": len(texts)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("AI service ingest exception", exc_info=True)
        raise HTTPException(status_code=500, detail=robust_sanitize(str(e)))


def delete_document_vectors(document_id: str):
    global vector_store

    if not vector_store:
        return {
            "status": "empty",
            "message": "Vector store chưa có dữ liệu.",
            "document_id": document_id,
            "removed": 0,
            "remaining": 0
        }

    old_docs = list(vector_store.docstore._dict.values())

    remaining_docs = [
        doc for doc in old_docs
        if str(doc.metadata.get("document_id")) != str(document_id)
    ]

    removed_count = len(old_docs) - len(remaining_docs)

    if remaining_docs:
        vector_store = FAISS.from_documents(remaining_docs, get_embeddings())
        vector_store.save_local(VECTOR_DB_PATH)
    else:
        vector_store = None

    logger.info(
        f"Delete vectors for document_id={document_id}: "
        f"removed={removed_count}, remaining={len(remaining_docs)}"
    )

    return {
        "status": "success",
        "document_id": document_id,
        "removed": removed_count,
        "remaining": len(remaining_docs)
    }


def rebuild_vector_store_from_documents(documents: List):
    global vector_store

    if not documents:
        vector_store = None
        return 0

    vector_store = FAISS.from_documents(documents, get_embeddings())
    vector_store.save_local(VECTOR_DB_PATH)

    return len(documents)


def similarity_search_with_score(query: str, k: int):
    if not vector_store:
        return []

    return vector_store.similarity_search_with_score(query, k=k)
