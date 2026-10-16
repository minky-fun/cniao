"""确认签名边界对照仅改变指定的公开 MTOP 字段。"""
import hashlib
import unittest

from probe_signing_boundary import SCENARIOS, SigningBoundaryProbe


class FixtureTests(unittest.TestCase):
    """在不装载 IPA 或执行 VM 的情况下验证对照变量隔离。"""

    def test_one_field_per_scenario(self):
        """时钟变化不改 INPUT；会话、时间戳、data 仅影响各自原生槽位。"""
        fields = {}
        for scenario in SCENARIOS:
            probe = SigningBoundaryProbe.__new__(SigningBoundaryProbe)
            probe.scenario = scenario
            probe.appkey = '1234567'
            fields[scenario] = probe.fixture_input().split('&')
        baseline = fields['baseline']
        self.assertEqual(len(baseline), 21)
        expected = {'repeat': [], 'clock': [], 'session': [8], 'timestamp': [5], 'data': [4]}
        for scenario, positions in expected.items():
            with self.subTest(scenario=scenario):
                actual = [index for index, (left, right) in enumerate(zip(baseline, fields[scenario])) if left != right]
                self.assertEqual(actual, positions)
                self.assertEqual(len(fields[scenario]), 21)
        self.assertEqual(fields['data'][4], hashlib.md5(b'{"page":2}').hexdigest())

    def test_security_factor_empty_slot(self):
        """统一安全因子 INPUT 保留 extdata 空槽；其余顺序与普通入口一致。"""
        probe = SigningBoundaryProbe.__new__(SigningBoundaryProbe)
        probe.scenario = 'baseline'
        probe.appkey = '1234567'
        ordinary = probe.fixture_input().split('&')
        factors = probe.fixture_input('security-factors').split('&')
        self.assertEqual(len(factors), 22)
        self.assertEqual(factors[:13], ordinary[:13])
        self.assertEqual(factors[13], '')
        self.assertEqual(factors[14:], ordinary[13:])

    def test_no_appkey_guess(self):
        """没有实际样本提供的 appKey 时拒绝生成 fixture，不填入默认标识。"""
        probe = SigningBoundaryProbe.__new__(SigningBoundaryProbe)
        probe.scenario = 'baseline'
        probe.appkey = None
        with self.assertRaisesRegex(RuntimeError, 'getAppKey'):
            probe.fixture_input()


if __name__ == '__main__':
    unittest.main()
