import { NextRequest, NextResponse } from 'next/server'
import ts from 'typescript'

function topLevelDecls(sourceText: string) {
  const sf = ts.createSourceFile('a.ts', sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const names: string[] = []
  sf.forEachChild(node => {
    if (ts.isFunctionDeclaration(node) && node.name) names.push(`function ${node.name.text}`)
    else if (ts.isVariableStatement(node)) {
      node.declarationList.declarations.forEach(d => {
        if (ts.isIdentifier(d.name)) names.push(`var ${d.name.text}`)
      })
    } else if (ts.isClassDeclaration(node) && node.name) names.push(`class ${node.name.text}`)
    else if (ts.isInterfaceDeclaration(node)) names.push(`interface ${node.name.text}`)
    else if (ts.isTypeAliasDeclaration(node)) names.push(`type ${node.name.text}`)
    else if (ts.isEnumDeclaration(node)) names.push(`enum ${node.name.text}`)
  })
  return names
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(()=>({}))
    const before = String(body.before || '')
    const after = String(body.after || '')
    const a = new Set(topLevelDecls(before))
    const b = new Set(topLevelDecls(after))
    const added = Array.from(b).filter(x => !a.has(x))
    const removed = Array.from(a).filter(x => !b.has(x))
    const unchanged = Array.from(a).filter(x => b.has(x))
    return NextResponse.json({ added, removed, unchanged })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}

