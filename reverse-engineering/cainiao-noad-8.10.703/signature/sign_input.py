"""仅还原已确认的 iOS 签名输入与非 SecurityGuard HMAC 分支，不生成安全因子。"""
import hashlib
import hmac


def build_sign_input(*, utdid, app_key, api, version, data_json, protocol, headers, mode):
    """按 8.10.703 原生指令构建输入；传入原始 JSON，缺失字典项按原生 nil 转空串。"""
    if mode not in ('mtop-sign', 'security-factors'):
        raise ValueError('必须明确指定 mtop-sign 或 security-factors')
    for value in (utdid, app_key, api, version, data_json):
        if not isinstance(value, str) or '\0' in value:
            raise ValueError('核心参数必须为不含 NUL 的字符串')
    for mapping in (protocol, headers):
        if not isinstance(mapping, dict):
            raise TypeError('protocol 和 headers 必须为字典')
        if any(value is not None and not isinstance(value, str) for value in mapping.values()):
            raise TypeError('字典值仅接受字符串或 None，不推测其他类型')
    location = (protocol.get('x-location') or '').split(',')
    first, second = location if len(location) == 2 else ('', '')
    parts = [
        utdid,
        headers.get('x-uid') or '',
        headers.get('x-reqbiz-ext') or '',
        app_key,
        hashlib.md5(data_json.encode('utf8')).hexdigest(),
        protocol.get('x-t') or '',
        api,
        version,
        protocol.get('x-sid') or '',
        protocol.get('x-ttid') or '',
        protocol.get('x-devid') or '',
        second,
        first,
    ]
    # 旧入口仅对两种 open API 类型加入 extdata；Unified 入口固定保留该槽位。
    if mode == 'security-factors' or headers.get('x-exttype') in ('isv_open_api', 'inner_open_api'):
        parts.append(headers.get('x-extdata') or '')
    parts.extend([
        headers.get('x-features') or '',
        headers.get('x-router-id') or '',
        headers.get('x-place-id') or '',
        protocol.get('x-open-biz') or '',
        protocol.get('x-mini-appkey') or '',
        protocol.get('x-req-appkey') or '',
        protocol.get('x-act') or '',
        protocol.get('x-open-biz-data') or '',
    ])
    return '&'.join(parts)


def legacy_hmac_sign(input_string, app_secret):
    """复现 useSecurityGuard=false 时的 UTF-8 HMAC-SHA1 小写 hex 分支，密钥必须由调用方提供。"""
    if not isinstance(input_string, str) or not isinstance(app_secret, str) or not app_secret:
        raise ValueError('必须提供输入字符串和已知 appSecret')
    if '\0' in input_string or '\0' in app_secret:
        raise ValueError('不接受含 NUL 的输入或密钥')
    return hmac.new(app_secret.encode('utf8'), input_string.encode('utf8'), hashlib.sha1).hexdigest()
