from fastapi import APIRouter, HTTPException, Request

router = APIRouter()


@router.get("/documents")
def list_documents(request: Request):
    docs = request.app.state.data["documents"]
    return [
        {
            "doc_id": d["doc_id"],
            "title": d["title"],
            "type": d["type"],
            "source": d["source"],
            "equipment_tags": d["equipment_tags"],
            "last_updated": d["last_updated"],
            "version": d["version"],
        }
        for d in docs.values()
    ]


@router.get("/documents/{doc_id}")
def get_document(doc_id: str, request: Request):
    doc = request.app.state.data["documents"].get(doc_id)
    if not doc:
        raise HTTPException(404, f"Document {doc_id} not found")
    return doc
