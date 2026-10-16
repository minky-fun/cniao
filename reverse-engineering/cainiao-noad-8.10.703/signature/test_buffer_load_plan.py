"""Reject untrusted backend routing packets while keeping legacy integer requests separate."""
import io
import json
from types import SimpleNamespace
import unittest
from unittest.mock import patch

from verify_portable_buffer import BufferWorker

ENTRY = 0x102a631e4
ARGS = (0x1000, 0x2000, 128, 0, 0)


class PlanProtocolTests(unittest.TestCase):
    """Exercise protocol boundaries without any native code, real memory or user credentials."""

    def calculate(self, packet, *, operation='planLoad', entry=ENTRY, arguments=ARGS):
        """Use one public response packet and capture the request without starting a process."""
        worker = BufferWorker.__new__(BufferWorker)
        worker.process = SimpleNamespace(stdout=io.StringIO(json.dumps(packet) + '\n'))
        worker.send = lambda request: None
        probe = SimpleNamespace(cpu=SimpleNamespace(reg_read=lambda register: 0))
        with patch('verify_portable_buffer.select.select', return_value=([worker.process.stdout], [], [])):
            return worker.calculate(probe, entry, arguments, operation=operation)

    def test_valid_error_and_both_backends(self):
        """Accept only typed failure status or exact whitelisted tail calls, including null output."""
        self.assertEqual(self.calculate({'event': 'load-plan', 'plan': {'kind': 'return', 'status': '7'}}), {'kind': 'return', 'status': 7})
        for target in (0x102a5e240, 0x102a626f0):
            plan = {'kind': 'tailCall', 'target': str(target), 'context': '4096', 'source': '8192', 'length': '128', 'output': '0'}
            self.assertEqual(self.calculate({'event': 'load-plan', 'plan': plan})['target'], target)

    def test_legacy_integer_cannot_route_a_backend(self):
        """An ordinary buffer request must never accept a load-plan event."""
        with self.assertRaises(RuntimeError):
            self.calculate({'event': 'load-plan', 'plan': {'kind': 'return', 'status': '7'}}, operation=None)
        self.assertEqual(self.calculate({'event': 'result', 'integer': '17'}, operation=None), 17)

    def test_plan_cannot_claim_scalar_success(self):
        """Planning cannot be represented as an already executed successful loader result."""
        for packet in ({'event': 'result', 'integer': '0'}, {'event': 'load-plan', 'plan': {'kind': 'return', 'status': '0'}}):
            with self.assertRaises(RuntimeError):
                self.calculate(packet)

    def test_rejects_unknown_fields_modes_and_types(self):
        """Reject missing fields, extra fields, unknown kinds and nondecimal register encodings."""
        plans = [None, [], {}, {'kind': 'return'}, {'kind': 'execute', 'status': '7'}, {'kind': 'return', 'status': '7', 'extra': '0'}]
        for value in (-1, 7, True, '-1', str(1 << 64), '0x7', '7.0', '７'):
            plans.append({'kind': 'return', 'status': value})
        for plan in plans:
            with self.subTest(plan_type=type(plan).__name__), self.assertRaises(RuntimeError):
                self.calculate({'event': 'load-plan', 'plan': plan})

    def test_rejects_arbitrary_backend_and_changed_caller_arguments(self):
        """Keep native jump targets and unchanged caller fields within the verified contract."""
        good = {'kind': 'tailCall', 'target': str(0x102a5e240), 'context': '4096', 'source': '8192', 'length': '128', 'output': '0'}
        for field, value in (('target', '1'), ('context', '0'), ('context', '4097'), ('source', '0'), ('length', '112'), ('output', '1')):
            with self.subTest(field=field), self.assertRaises(RuntimeError):
                self.calculate({'event': 'load-plan', 'plan': dict(good, **{field: value})})

    def test_rejects_unknown_operation_and_invalid_header_request(self):
        """Reject an invalid request before sending it to the worker."""
        for options in ({'operation': 'execute'}, {'entry': 1}, {'arguments': ()}, {'arguments': (-1, 0x2000, 128, 0, 0)}):
            with self.assertRaises(ValueError):
                self.calculate({}, **options)


if __name__ == '__main__':
    unittest.main()
