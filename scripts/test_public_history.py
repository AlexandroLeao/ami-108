#!/usr/bin/env python3
"""Offline detector regression: no real credential is stored in these fixtures."""
import unittest
from check_public_history import scan_text


class PublicHistoryDetectorTests(unittest.TestCase):
    def test_detects_high_risk_structures_without_printing_secrets(self):
        examples = {
            "groq-key": b"gsk_" + (b"A1" * 18),
            "github-token": b"ghp_" + (b"B2" * 20),
            "aws-access-id": b"AKIA" + (b"AB12" * 4),
            "private-key-block": b"-----BEGIN " + b"PRIVATE KEY-----",
            "database-credential-url": b"postgresql://user:unusual_long_value@hidden.neon.tech/mydb",
        }
        for kind, payload in examples.items():
            with self.subTest(kind=kind):
                self.assertIn(kind, scan_text(payload))

    def test_rejects_documented_dummy_values_and_safe_local_urls(self):
        samples = [
            b'gsk_test_private_api_key_0123456789abcdef',
            b'gsk_dummy_offline_key_0123456789abcdef',
            b'postgresql://ami_test:ami_test@localhost:5432/ami_test',
            b'postgresql://name:$' + b'{DB_PASS}@example.invalid/mydb',
            b'ordinary code, no tokens',
            b'\x00PNG binary blob',
        ]
        for sample in samples:
            with self.subTest(sample=sample[:12]):
                self.assertEqual(scan_text(sample), set())

    def test_never_returns_raw_values(self):
        secret = b"gsk_" + (b"Q7" * 18)
        result = scan_text(secret)
        self.assertEqual(result, {"groq-key"})
        self.assertNotIn(secret.decode(), str(result))


if __name__ == "__main__":
    unittest.main()
