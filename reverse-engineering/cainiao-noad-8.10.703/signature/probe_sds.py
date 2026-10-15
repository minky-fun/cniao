"""离线复核 SDS 初始化命令和真实 SDK 上下文，遇到 Foundation 依赖即停止。"""
import argparse
import json
import struct

from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_X6, UC_ARM64_REG_X7, UC_ARM64_REG_X30

from probe_native import read_binary
from probe_vm import load_modules


def inspect(data):
    """执行固定样本构造器和 SDS 导出项 38，不模拟 Objective-C 或读取本机文件。"""
    probe, _, evidence = load_modules(data, with_sds=True)
    # 两项均已由注册指令、处理器和二参数包装 ABI 核对，运行真实原生代码。
    probe.native_routes[(1, 1, 3, 0)] = 0x102aed18c
    probe.native_routes[(1, 37, 1, 1)] = 0x102aa11fc
    probe.cpu.reg_write(UC_ARM64_REG_X6, 0)
    probe.cpu.reg_write(UC_ARM64_REG_X7, 0)
    # 构造器有栈上传参；五个槽均明确设为零，不沿用上一段执行的栈内容。
    probe.cpu.mem_write(probe.stack + 0xff000, bytes(40))
    marker = probe.write_string('synthetic-context-argument2')
    sdk_context = probe.run(0x102a71164, (0, 0, marker, 0, 0, 0))
    if not sdk_context:
        raise RuntimeError('合成 SDK 上下文构造失败')
    callbacks = []
    flag_callbacks = ((0x38, 0x102a714e0), (0x40, 0x102a714f0), (0x48, 0x102a71500), (0x50, 0x102a71510), (0x58, 0x102a71520))
    for offset, expected in flag_callbacks + ((0x60, 0x102a71530), (0x68, 0x102a7154c), (0x70, 0x102a71568), (0x78, 0x102a71584)):
        actual = struct.unpack('<Q', probe.cpu.mem_read(sdk_context + offset, 8))[0]
        if actual != expected:
            raise RuntimeError('SDK 上下文回调表与构造器指令不符')
        callbacks.append({'offset': hex(offset), 'target': hex(actual)})
    # 在独立四字节对象上验证五个回调读取各自位，不修改真实构造出的上下文。
    flag_object = probe.allocate(4)
    flag_cases = []
    for flags in (0, 1, 2, 4, 8, 16, 31):
        probe.cpu.mem_write(flag_object, struct.pack('<I', flags))
        results = [probe.run(target, (flag_object,)) for _, target in flag_callbacks]
        if results != [(flags >> bit) & 1 for bit in range(5)]:
            raise RuntimeError('SDK 标志回调结果与原生指令不符')
        flag_cases.append({'flags': flags, 'callback_results_in_offset_order': results})
    sds_engine = probe.module_routes[(1, 6, 36, 0)][0]
    sds_context = struct.unpack('<Q', probe.cpu.mem_read(sds_engine, 8))[0]
    sds_module = struct.unpack('<Q', probe.cpu.mem_read(sds_context, 8))[0]
    sds_base = struct.unpack('<Q', probe.cpu.mem_read(sds_module + 0x18, 8))[0]
    export_table, export_count = struct.unpack('<QI', probe.cpu.mem_read(sds_module + 0x118, 12))
    if export_count != 51 or struct.unpack('<I', probe.cpu.mem_read(export_table + 38 * 4, 4))[0] != 0x8340:
        raise RuntimeError('SDS 初始化导出地址与元数据不符')
    context_slot = sds_base + 0xabe8
    if struct.unpack('<Q', probe.cpu.mem_read(context_slot, 8))[0] != 0:
        raise RuntimeError('SDS 上下文槽初值与证据不符')
    arguments, error, output = (probe.allocate(size) for size in (16, 8, 8))
    probe.cpu.mem_write(arguments, struct.pack('<QQ', sdk_context, error))
    # 导出项 38 的命令编号由容器元数据核对，调用 ABI 与实际动态执行包装相同。
    selected = evidence['related_modules'][0]
    if selected['initialization_command_binding'] != {'index': 38, 'destIndex': 66010640}:
        raise RuntimeError('SDS 初始化导出索引与元数据不符')
    try:
        probe.run(0x102a518ec, (sds_engine, 38, arguments, 2, output))
    except RuntimeError as error_result:
        if str(error_result) != '不支持的原生导入：_NSClassFromString':
            raise
    else:
        raise RuntimeError('SDK 初始化没有在已知 Objective-C 依赖处停止')
    if probe.observed_commands != [[1, 1, 3, 0], [1, 37, 1, 1]]:
        raise RuntimeError('SDK 初始化的依赖顺序与证据不符')
    if probe.imports.get(probe.cpu.reg_read(UC_ARM64_REG_PC)) != '_NSClassFromString':
        raise RuntimeError('Objective-C 依赖停止地址与导入表不符')
    if probe.cpu.reg_read(UC_ARM64_REG_X30) != 0x102aa1800:
        raise RuntimeError('Objective-C 依赖返回地址与调用点不符')
    # 首次调用会展开整个代码区；核对实际全局槽地址和保存上下文的 store 指令。
    expanded = struct.unpack('<Q', probe.cpu.mem_read(sds_module + 0x30, 8))[0]
    low = struct.unpack('<Q', probe.cpu.mem_read(expanded + (0x846c // 4 - 1) * 16 + 8, 8))[0]
    high = struct.unpack('<Q', probe.cpu.mem_read(expanded + (0x8470 // 4 - 1) * 16 + 8, 8))[0]
    store = bytes(probe.cpu.mem_read(expanded + (0x847c // 4 - 1) * 16, 16))
    if low + high != context_slot or store != struct.pack('<I4sQ', 0x4f, bytes((3, 8, 2, 27)), 0):
        raise RuntimeError('SDS 全局上下文写入指令与证据不符')
    evidence['scope'] = 'offline real SDK context construction and SDS initialization prefix; Objective-C runtime unavailable'
    evidence['synthetic_dependencies'].append('SDK context constructor receives zero flags, one public synthetic string argument, and zero for other arguments; not an iPhone SDK configuration')
    evidence['sdk_context'] = {
        'constructor': '0x102a71164',
        'bytes': 240,
        'constructed': True,
        'constructor_observed_commands': [[1, 1, 3, 0]],
        'native_command_routes': [{'ids': list(ids), 'handler': hex(target)} for ids, target in probe.native_routes.items()],
        'selected_callbacks': callbacks,
        'flag_callback_offsets': [hex(offset) for offset, _ in flag_callbacks],
        'flag_callback_cases': flag_cases,
        'signature_first_context_dependency': {
            'member_offset': '0x48',
            'callback_target': '0x102a71500',
            'reads_context_offset': '0x0',
            'reads_bit': 2,
            'business_meaning_verified': False,
        },
        'configuration_is_synthetic': True,
    }
    evidence['sds_initialization'] = {
        'native_caller': '0x102ab5a28',
        'native_dispatch_call': '0x102ab5c6c',
        'command_ids': [1, 6, 40, 0],
        'lookup_number': 66010640,
        'export_index': 38,
        'export_code_offset': '0x8340',
        'context_store_code_offset': '0x847c',
        'context_slot_module_offset': '0xabe8',
        'context_slot_set_at_stop': struct.unpack('<Q', probe.cpu.mem_read(context_slot, 8))[0] != 0,
        'stop_reason': 'unsupported_objective_c_runtime_import',
        'missing_import': '_NSClassFromString',
        'missing_import_call_site': '0x102aa17fc',
        'missing_import_return_address': '0x102aa1800',
        'observed_commands': probe.observed_commands,
        'vm_status': None,
        'initialization_completed': False,
        'dependency_result_fabricated': False,
    }
    return evidence


def main():
    """从固定 IPA 或主程序重建无凭据 JSON，不启动 App 或访问网络。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample', help='已归档 IPA 或 Cainiao4iPhone 主程序')
    args = parser.parse_args()
    print(json.dumps(inspect(read_binary(args.sample)), indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
