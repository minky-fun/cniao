"""通过样本自身 getAppKey 导出读取公开标识；不保存标识值或安全资源。"""
import struct
from module_container import parse_container


def read_sample_appkey(probe, engine):
    """核对索引来源与 SDS 元数据，再执行真实导出 41 并返回内存中的标识。"""
    if probe.run(0x1021aeeb0) != 0:
        raise RuntimeError('样本 AppConfiguration.currentAppKeyIndex 不再是 0')
    _, _, bindings = parse_container(bytes(probe.cpu.mem_read(0x1066871e0, 26314)))
    selected = [item for item in bindings if item['destIndex'] == 66010643]
    if selected != [{'index': 41, 'destIndex': 66010643}]:
        raise RuntimeError('getAppKey 的 SDS 导出绑定不符')
    probe.sample_sds_bindings = {item['destIndex']: item['index'] for item in bindings}
    if len(probe.sample_sds_bindings) != len(bindings):
        raise RuntimeError('SDS 元数据包含重复命令')
    # 真实注册点 0x102a729f8；此处理器只更新计数，由原生代码执行其副作用。
    probe.native_routes[(1, 35, 1, 0)] = 0x102a72740
    request, error, arguments, output = (probe.allocate(size) for size in (16, 8, 16, 8))
    # getAppKey:authCode: 在 0x102af0654/0x102af0670 写入 u32 索引与 UTF-8 指针。
    probe.cpu.mem_write(request, struct.pack('<IIQ', 0, 0, probe.write_string('')))
    probe.cpu.mem_write(arguments, struct.pack('<QQ', request, error))
    status = probe.run(0x102a518ec, (engine, 41, arguments, 2, output))
    pointer = struct.unpack('<Q', probe.cpu.mem_read(output, 8))[0]
    if status != 0 or not pointer:
        raise RuntimeError('真实 getAppKey 未返回标识对象')
    data, length = struct.unpack('<QI', probe.cpu.mem_read(pointer, 12))
    if not data or not 1 <= length <= 64:
        raise RuntimeError('getAppKey 标识对象长度超限')
    raw = bytes(probe.cpu.mem_read(data, length))
    if not raw.isdigit():
        raise RuntimeError('getAppKey 返回的不是公开数字标识')
    # 原生包装在 0x102af06c8 按输出指针分支；成功输出时错误槽可保留初始化值 99。
    evidence = {'index_source': 'AppConfiguration.currentAppKeyIndex', 'index_source_implementation': '0x1021aeeb0', 'index': 0, 'public_method': 'SecurityGuardOpenStaticDataStore.getAppKey:authCode:', 'public_method_implementation': '0x102af03e0', 'native_command': 10902, 'native_forwarder': '0x102ae079c', 'module': 'lvm_sds', 'export_index': 41, 'vm_status': status, 'error_slot_at_return': struct.unpack('<I', probe.cpu.mem_read(error, 4))[0], 'output_present': True, 'identifier_numeric': True, 'identifier_bytes': length, 'identifier_value_exported': False}
    return raw.decode('ascii'), evidence
