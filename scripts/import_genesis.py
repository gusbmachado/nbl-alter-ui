"""Convert the supplied plain-text sample; fail closed on ambiguous numbering.

Default: compare against the committed editorial files. --write explicitly replaces
the three sample chapters and their generated notes. Does not run during builds.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {1: (31, 184), 2: (25, 172), 3: (24, 138)}


def parse_sample(source):
    sections = re.split(r"^Gênesis (\d+)\s*$", source, flags=re.M)
    assert sections[0].strip() == "", "Conteúdo antes do primeiro capítulo"
    chapters, notes, report = [], [], []
    for index in range(1, len(sections), 2):
        number = int(sections[index])
        body = sections[index + 1]
        start = re.search(r"^    \S", body, re.M)
        assert start, f"Bloco de notas ausente no capítulo {number}"
        text, commentary = body[:start.start()], body[start.start():]
        assert not commentary.split("↩")[-1].strip(), "Nota final sem delimitador"
        bodies = [n.strip() for n in commentary.split("↩") if n.strip()]
        verse_number, next_note = 0, 1
        verses, references = [], {}

        def consume(match):
            nonlocal next_note
            digits = match.group()
            while digits:
                token = str(next_note)
                assert digits.startswith(token), (
                    f"Gn {number}:{verse_number}: esperado marcador {next_note}, recebido {digits}"
                )
                references[next_note] = verse_number
                digits = digits[len(token):]
                next_note += 1
            # Restore only the space lost where a footnote fused two words.
            left = match.string[match.start() - 1:match.start()]
            right = match.string[match.end():match.end() + 1]
            return " " if left and right and left.isalpha() and (right.isalpha() or right in "‘’'") else ""

        for raw in text.splitlines():
            if not raw.strip():
                continue
            line = raw
            leading = re.match(r"^(\d+)(.*)$", line)
            if leading:
                digits, tail = leading.groups()
                expected_verse = str(verse_number + 1)
                if digits.startswith(expected_verse):
                    remainder = digits[len(expected_verse):]
                    if not remainder or remainder.startswith(str(next_note)):
                        verse_number += 1
                        line = remainder + tail
                        verses.append({"number": verse_number, "text": "", "style": "poetry"})
            assert verses, f"Verso inicial não identificado: capítulo {number}"
            clean = re.sub(r"\d+", consume, line).strip()
            verses[-1]["text"] += ("\n" if verses[-1]["text"] else "") + clean

        assert (len(verses), len(bodies)) == EXPECTED[number], f"Contagem inesperada no capítulo {number}"
        assert next_note - 1 == len(bodies), f"Notas sem marcador no capítulo {number}"
        chapters.append({
            "id": f"genesis-{number:03}", "book": "genesis", "chapter": number,
            "title": f"Gênesis {number} — amostra fornecida", "status": "published",
            "contentKind": "sample",
            "sourceLabel": "Amostra de tradução de Osvaldo Luiz Ribeiro fornecida em ref-text.txt pelo responsável pelo protótipo.",
            "verses": verses,
        })
        for n, note_body in enumerate(bodies, 1):
            notes.append({
                "id": f"gn-{number}-nota-{n:03}", "book": "genesis", "chapter": number,
                "status": "published", "scope": "verse",
                "verseStart": references[n], "verseEnd": references[n],
                "category": "other", "title": f"Nota {n}", "order": n, "body": note_body,
            })
        report.append({"chapter": number, "verses": len(verses), "notes": len(bodies),
                       "noteVerses": {str(n): v for n, v in references.items()}})
    assert [c["chapter"] for c in chapters] == [1, 2, 3]
    return chapters, notes, {
        "source": "ref-text.txt", "sha256": hashlib.sha256(source.encode()).hexdigest(),
        "chapters": report,
        "normalization": [
            "Separação de números de versículos e marcadores de notas por sequência estrita.",
            "Preservação das quebras entre sentenças em cada verso.",
            "Remoção dos marcadores numéricos do texto e do retorno ↩ nas notas.",
            "Inserção de espaço apenas onde a remoção do marcador juntaria duas palavras.",
            "Categorias não inferidas: todas as notas reais importadas em other.",
            "Links ausentes na cópia não reconstruídos; palavras e pontuação não revisadas.",
        ],
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    chapters, notes, report = parse_sample((ROOT / "ref-text.txt").read_text())
    files = {ROOT / "src/content/chapters" / f"{c['id']}.json": c for c in chapters}
    files.update({ROOT / "src/content/notes" / f"{n['id']}.json": n for n in notes})
    files[ROOT / "docs/tecnico/genesis-import.json"] = report
    for path, value in files.items():
        if args.write:
            path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")
        else:
            assert json.loads(path.read_text()) == value, f"Divergência: {path.relative_to(ROOT)}"
    print("PASS: Gênesis 1–3, 80 versos e 494 notas; todos os marcadores conferidos com ref-text.txt.")


if __name__ == "__main__":
    main()
