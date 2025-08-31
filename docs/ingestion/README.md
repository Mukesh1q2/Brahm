# Data Ingestion

This section outlines the ingestion stack and example endpoints wired into the frontend for demos.

- Web crawler: /api/ingest/crawl?url=...
- RSS: /api/ingest/rss?url=...
- ArXiv: /api/ingest/arxiv?q=...
- Document pipeline (Tika-stub): POST /api/ingest/doc { text }
- OCR: POST /api/files/upload (returns OCR-STUB)
- Embedding service: POST /api/embeddings { texts[] }
- Neo4j KG schema: GET /api/kg/neo4j/schema
- Provenance log: GET/POST /api/provenance/log

UI
- Visit /console/ingestion to exercise these endpoints.
- Visit /console/rag for multi-hop RAG demo.

Production guidance
- Replace stubs with real services (crawler workers, Apache Tika, PaddleOCR, embedding microservice, Neo4j cluster).
- Add an asynchronous job queue and object storage for large file processing.
- Maintain provenance with immutable logs (e.g., append-only DB) and sign artifacts.

