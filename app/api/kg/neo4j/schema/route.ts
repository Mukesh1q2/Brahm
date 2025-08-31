import { NextResponse } from 'next/server'

export async function GET() {
  const cypher = `// Example Neo4j schema
CREATE CONSTRAINT unique_doc IF NOT EXISTS FOR (d:Document) REQUIRE d.id IS UNIQUE;
CREATE CONSTRAINT unique_entity IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE;`
  return NextResponse.json({ schema: { labels: ['Document','Entity','Relation'], relationships: ['MENTIONS','CITES'] }, cypher })
}

