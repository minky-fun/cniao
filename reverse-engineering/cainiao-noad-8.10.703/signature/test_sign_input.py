"""用合成字段和公开算法向量验证参考实现，不代表真实服务端签名已验证。"""
import unittest
from sign_input import build_sign_input, legacy_hmac_sign


class SignInputTests(unittest.TestCase):
    """验证原生字段顺序、分支差异及公开 HMAC 向量。"""

    def test_native_field_order(self):
        """用唯一字段标记核对基础数组、位置顺序和追加字段顺序。"""
        result = build_sign_input(
            utdid='u', app_key='k', api='a', version='v', data_json='{}', mode='mtop-sign',
            headers={'x-uid': 'uid', 'x-reqbiz-ext': 'biz', 'x-features': 'f', 'x-router-id': 'r', 'x-place-id': 'p'},
            protocol={'x-t': 't', 'x-sid': 's', 'x-ttid': 'tt', 'x-devid': 'd', 'x-location': 'first,second', 'x-open-biz': 'o', 'x-mini-appkey': 'm', 'x-req-appkey': 'q', 'x-act': 'act', 'x-open-biz-data': 'obd'},
        )
        self.assertEqual(result, 'u&uid&biz&k&99914b932bd37a50b983c5e7c90ae93b&t&a&v&s&tt&d&second&first&f&r&p&o&m&q&act&obd')

    def test_extdata_modes(self):
        """核对旧入口条件槽位与 Unified 固定槽位，包含空串情况。"""
        args = dict(utdid='', app_key='k', api='a', version='1.0', data_json='{}', protocol={}, headers={'x-extdata': 'ext'})
        ordinary = build_sign_input(**args, mode='mtop-sign').split('&')
        unified = build_sign_input(**args, mode='security-factors').split('&')
        self.assertEqual(len(ordinary), 21)
        self.assertEqual(len(unified), 22)
        self.assertEqual(unified[13], 'ext')
        for kind in ('isv_open_api', 'inner_open_api'):
            args['headers']['x-exttype'] = kind
            self.assertEqual(build_sign_input(**args, mode='mtop-sign').split('&'), unified)
        args['headers']['x-extdata'] = ''
        self.assertEqual(len(build_sign_input(**args, mode='mtop-sign').split('&')), 22)

    def test_invalid_location_keeps_two_empty_slots(self):
        """位置字段非两段时按原生分支保留两个空槽位。"""
        for value in ('', 'one', 'one,two,three'):
            result = build_sign_input(utdid='', app_key='k', api='a', version='1.0', data_json='{}', mode='security-factors', protocol={'x-location': value}, headers={})
            self.assertEqual(result.split('&')[11:13], ['', ''])

    def test_public_hmac_vectors(self):
        """使用 RFC 2202 的两组公开测试向量，不使用账号或真实密钥。"""
        self.assertEqual(legacy_hmac_sign('Hi There', '\x0b' * 20), 'b617318655057264e28bc0b6fb378c8ef146be00')
        self.assertEqual(legacy_hmac_sign('what do ya want for nothing?', 'Jefe'), 'effcdf6ae5eb2fa2d27416d5f184df9c259a7c79')

    def test_rejects_unknown_mode_and_missing_secret(self):
        """缺少必要条件时明确失败，不推测模式或密钥。"""
        with self.assertRaises(ValueError):
            build_sign_input(utdid='', app_key='k', api='a', version='1', data_json='{}', protocol={}, headers={}, mode='guess')
        with self.assertRaises(ValueError):
            legacy_hmac_sign('input', '')


if __name__ == '__main__':
    unittest.main()
