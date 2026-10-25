"""Offline tests for the import of the user-supplied source."""
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from import_genesis import parse_sample


class SampleImportTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = (ROOT / "ref-text.txt").read_text()
        cls.chapters, cls.notes, cls.report = parse_sample(cls.source)

    def test_counts_and_every_reference(self):
        self.assertEqual([len(c["verses"]) for c in self.chapters], [31, 25, 24])
        self.assertEqual(len(self.notes), 494)
        self.assertEqual(len({n["id"] for n in self.notes}), 494)
        for chapter in self.chapters:
            verses = {v["number"] for v in chapter["verses"]}
            self.assertTrue(all(n["verseStart"] in verses for n in self.notes if n["chapter"] == chapter["chapter"]))

    def test_first_verse_separates_fused_numbers(self):
        self.assertEqual(self.chapters[0]["verses"][0]["text"],
                         "Na encabeçadura do cria ‘Elohim.\nOs céus.\nE a terra.")
        self.assertEqual([n["order"] for n in self.notes if n["chapter"] == 1 and n["verseStart"] == 1],
                         list(range(1, 11)))

    def test_word_boundaries_and_internal_section(self):
        self.assertIn("Erva fazedora", self.chapters[0]["verses"][10]["text"])
        self.assertIn("No dia de fazer", self.chapters[1]["verses"][3]["text"])
        self.assertEqual(self.chapters[1]["verses"][9]["number"], 10)
        self.assertTrue(self.chapters[1]["verses"][9]["text"].startswith("E rio."))

    def test_committed_content_and_report_match_source(self):
        for folder, values in [("chapters", self.chapters), ("notes", self.notes)]:
            for value in values:
                stored = json.loads((ROOT / "src/content" / folder / f"{value['id']}.json").read_text())
                self.assertEqual(stored, value)
        self.assertEqual(json.loads((ROOT / "docs/tecnico/genesis-import.json").read_text()), self.report)

    def test_missing_or_reordered_reference_fails_closed(self):
        for broken in [
            self.source.replace("‘Elohim9.", "‘Elohim.", 1),
            self.source.replace("11234 Na", "11243 Na", 1),
            self.source.replace("↩", "", 1),
        ]:
            with self.assertRaises(AssertionError):
                parse_sample(broken)


if __name__ == "__main__":
    unittest.main()
