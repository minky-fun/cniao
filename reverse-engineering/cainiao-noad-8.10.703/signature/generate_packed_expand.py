"""Generate a bounded TS lifting of verified expander instructions; unknown operations fail closed."""
import argparse
import json
import re
from pathlib import Path

from capstone import Cs, CS_ARCH_ARM64, CS_MODE_ARM
from probe_native import read_binary
from verify_portable_module import ModuleOracle

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('sample')
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parent
probe = ModuleOracle(read_binary(args.sample))
decoder = Cs(CS_ARCH_ARM64, CS_MODE_ARM)
items = []
for line in (root / 'packed-expand-contract.asm').read_text().splitlines():
    if not line or line.startswith('//'):
        continue
    parts = line.split(' ', 2)
    address_value = int(parts[0], 0)
    instruction = next(decoder.disasm(bytes(probe.cpu.mem_read(address_value, 4)), address_value))
    operands = parts[2] if len(parts) > 2 else ''
    if instruction.mnemonic != parts[1] or instruction.op_str != operands:
        raise ValueError('Expander instruction contract differs from verified sample')
    items.append({'address': address_value, 'mnemonic': instruction.mnemonic, 'operands': instruction.op_str})
constants = {}
for item in json.loads((root / 'packed-expand-control.json').read_text()):
    actual = bytes(probe.cpu.mem_read(int(item['address'], 0), item['bytes']))
    if int.from_bytes(actual, 'little') != item['value']:
        raise ValueError('Expander control metadata differs from verified sample')
    constants[str(int(item['address'], 0))] = actual.hex()


def split(text):
    """Split instruction operands while keeping memory addressing intact."""
    return re.split(r',\s*(?![^\[]*\])', text) if text else []


def value(operand):
    """Read an immediate or the native width of one integer register."""
    if operand.startswith('#'): return str(int(operand[1:], 0)) + 'n'
    if operand in ('xzr', 'wzr'): return '0n'
    if operand == 'sp': return 'r[31]'
    assert re.fullmatch('[xw][0-9]+', operand), operand
    raw = f'r[{int(operand[1:])}]'
    return f'BigInt.asUintN(32, {raw})' if operand[0] == 'w' else raw


def width(operand):
    """Return the explicit architectural width used by this instruction."""
    return 32 if operand.startswith('w') else 64


def assign(destination, expression):
    """Apply the architectural zero-extension and modulo write rule."""
    if destination in ('xzr', 'wzr'): return ''
    index = 31 if destination == 'sp' else int(destination[1:])
    return f'r[{index}] = BigInt.asUintN({width(destination)}, {expression});'


def modified(operand, modifier=None):
    """Implement only immediate shifts/extensions present in the checked instruction set."""
    raw = value(operand)
    if modifier is None: return raw
    bits = modifier.split()
    operation = bits[0]
    shift = int(bits[1][1:], 0) if len(bits) > 1 else 0
    if operation in ('uxtb', 'uxtw', 'sxtw'):
        n = 8 if operation == 'uxtb' else 32
        fn = 'asIntN' if operation == 'sxtw' else 'asUintN'
        return f'(BigInt.{fn}({n}, {raw}) << {shift}n)'
    if operation == 'lsl': return f'({raw} << {shift}n)'
    if operation == 'lsr': return f'({raw} >> {shift}n)'
    if operation == 'asr': return f'(BigInt.asIntN({width(operand)}, {raw}) >> {shift}n)'
    raise ValueError('Unsupported shift or extension: ' + modifier)


def condition(name):
    """Use exact comparison flags for signed and unsigned conditions."""
    return {'eq': 'z', 'ne': '!z', 'lo': '!c', 'hs': 'c', 'hi': 'c && !z', 'ls': '!c || z', 'gt': '!less && !z', 'ge': '!less', 'le': 'less || z', 'lt': 'less'}[name]


def address(operand):
    """Calculate only supported base, displacement and scaled register addresses."""
    assert operand.startswith('[') and operand.endswith(']'), operand
    args = split(operand[1:-1])
    return value(args[0]) if len(args) == 1 else f'({value(args[0])} + {modified(args[1], args[2] if len(args)>2 else None)})'


def translate(item):
    """Lift one verified integer instruction; preserve every native width and branch."""
    m = item['mnemonic']; a = split(item['operands']); pc = item['address']
    following = pc + 4
    end = f'pc = 0x{following:x}; break;'
    out = ''
    if m in ('mov', 'adr', 'adrp'): out = assign(a[0], value(a[1]))
    elif m == 'movk':
        shift = int(a[2].split('#')[1], 0) if len(a) > 2 else 0
        out = assign(a[0], f'({value(a[0])} & ~({65535}n << {shift}n)) | ({value(a[1])} << {shift}n)')
    elif m in ('add','sub','and','orr','eor','orn','mul'):
        op = {'add':'+','sub':'-','and':'&','orr':'|','eor':'^','orn':'|','mul':'*'}[m]
        rhs = modified(a[2], a[3] if len(a)>3 else None)
        if m == 'orn': rhs = f'~({rhs})'
        out = assign(a[0], f'{value(a[1])} {op} ({rhs})')
    elif m == 'madd': out = assign(a[0], f'{value(a[1])} * {value(a[2])} + {value(a[3])}')
    elif m == 'mvn': out = assign(a[0], f'~{value(a[1])}')
    elif m in ('lsl','lsr','asr'): out = assign(a[0], modified(a[1], m + ' ' + a[2]))
    elif m == 'sxtw': out = assign(a[0], f'BigInt.asIntN(32, {value(a[1])})')
    elif m in ('ubfx','sbfx','sbfiz'):
        shift = int(a[2][1:],0); bits = int(a[3][1:],0)
        fn = 'asUintN' if m == 'ubfx' else 'asIntN'
        out = assign(a[0], f'BigInt.{fn}({bits}, {value(a[1])} >> {shift}n)' if m != 'sbfiz' else f'BigInt.asIntN({bits}, {value(a[1])}) << {shift}n')
    elif m == 'cmp': out = f'compare({value(a[0])}, BigInt.asUintN({width(a[0])}, {modified(a[1], a[2] if len(a)>2 else None)}), {width(a[0])});'
    elif m == 'tst': out = f'compare({value(a[0])} & {modified(a[1], a[2] if len(a)>2 else None)}, 0n, {width(a[0])}); c = false;'
    elif m == 'csel': out = assign(a[0], f'({condition(a[3])}) ? {value(a[1])} : {value(a[2])}')
    elif m == 'cset': out = assign(a[0], f'({condition(a[1])}) ? 1n : 0n')
    elif m.startswith('b.'):
        out = f'pc = ({condition(m[2:])}) ? {a[0][1:]} : 0x{following:x}; break;'; end = ''
    elif m == 'b': out = f'pc = {a[0][1:]}; break;'; end = ''
    elif m == 'br': out = f'pc = Number({value(a[0])}); break;'; end = ''
    elif m in ('cbz','cbnz'):
        out = f'pc = ({value(a[0])} {"===" if m=="cbz" else "!=="} 0n) ? {a[1][1:]} : 0x{following:x}; break;'; end=''
    elif m == 'tbz':
        out = f'pc = (({value(a[0])} >> {value(a[1])}) & 1n) === 0n ? {a[2][1:]} : 0x{following:x}; break;'; end=''
    elif m == 'ret': out = 'return r[0];'; end=''
    elif m in ('ldr','ldrb','ldrh','ldrsw','str','strb'):
        n = 1 if m in ('ldrb','strb') else 2 if m=='ldrh' else 4 if m=='ldrsw' else width(a[0])//8
        location = value(a[1]) if a[1].startswith('#') else address(a[1])
        raw = f'load({location}, {n})'
        if m == 'ldrsw': raw = f'BigInt.asIntN(32, {raw})'
        out = f'store({location}, {value(a[0])}, {n});' if m.startswith('str') else assign(a[0],raw)
    elif m in ('stp','ldp'):
        pre = a[2].endswith('!'); operand = a[2].rstrip('!'); loc = address(operand); n=width(a[0])//8
        base = split(operand[1:-1])[0]
        out = 'location = ' + loc + '; '
        if pre: out += assign(base,'location') + ' '
        if m=='stp': out += f'store(location, {value(a[0])}, {n}); store(location + {n}n, {value(a[1])}, {n});'
        else: out += assign(a[0], f'load(location, {n})') + ' ' + assign(a[1],f'load(location + {n}n, {n})')
        if len(a)>3: out += ' ' + assign(base,f'{value(base)} + {value(a[3])}')
    else: raise ValueError('Unsupported verified instruction: ' + str(item))
    return out + ' ' + end

header = '''import type {VmMemory} from './portable_vm_memory'

/** Fixed instruction lifting for this sample's packed expander, not a general ARM emulator. */
// Generated by generate_packed_expand.py; edit and verify the generator and instruction contract.
export const packedExpandEntry = 0x102a5a97cn
const control: Readonly<Record<string, readonly [number, bigint]>> = CONTROL

/** Expand verified packed instructions with private scratch and bounded, explicit guest memory. */
export function expandPacked(module: bigint, memory: VmMemory): bigint {
  const stackBase = 0xffff000000000000n
  if (module <= 0n || module + 336n > stackBase) throw new Error('Packed module address exceeds boundary')
  const metadata = memory.read(module, 336).slice()
  if (metadata.length !== 336) throw new Error('Packed module metadata truncated')
  const view = new DataView(metadata.buffer, metadata.byteOffset, metadata.byteLength)
  const count = view.getUint32(0x124, true)
  if (count > 65536) throw new Error('Packed instruction count exceeds boundary')
  if (count < 2) { memory.write(module + 16n, Uint8Array.of(1)); return 0n }
  const source = view.getBigUint64(0x128, true)
  const target = view.getBigUint64(0x30, true)
  const inputEnd = source + BigInt(count * 4)
  const outputEnd = target + BigInt(count * 16)
  if (!source || !target || inputEnd + 4n > stackBase || outputEnd > stackBase || (source < outputEnd && target < inputEnd) || (module < outputEnd && target < module + 336n) || (module < inputEnd && source < module + 336n)) throw new Error('Packed instruction regions alias or are absent')
  const packed = memory.read(source, count * 4).slice()
  const output = memory.read(target, count * 16).slice()
  if (packed.length !== count * 4 || output.length !== count * 16) throw new Error('Packed instruction region truncated')
  const scratch = new Uint8Array(0x210)
  const regions: readonly (readonly [bigint, Uint8Array])[] = [[module, metadata], [source, packed], [target, output], [stackBase, scratch]]
  const r = new Array<bigint>(32).fill(0n)
  r[0] = module; r[31] = stackBase + 0x210n
  let z = false, c = false, less = false
  let location = 0n

  /** Preserve unsigned carry and signed comparison outcomes at the native operand width. */
  function compare(left: bigint, right: bigint, bits: number): void {
    z = left === right; c = left >= right
    less = BigInt.asIntN(bits, left) < BigInt.asIntN(bits, right)
  }

  /** Read mapped public control metadata or exact guest bytes; no native execution fallback exists. */
  function load(address: bigint, bytes: number): bigint {
    const constant = control[address.toString()]
    if (constant) {
      if (constant[0] !== bytes) throw new Error('Packed control metadata width differs')
      return constant[1]
    }
    for (const [base, region] of regions) {
      if (address >= base && address + BigInt(bytes) <= base + BigInt(region.length)) {
        const offset = Number(address - base)
        let result = 0n
        for (let index = bytes - 1; index >= 0; index--) result = (result << 8n) | BigInt(region[offset + index])
        return result
      }
    }
    // Native fusion may read one following word even at the declared end. Require real guest bytes.
    if (bytes === 4 && address === inputEnd) {
      const next = memory.read(address, 4)
      if (next.length !== 4) throw new Error('Packed lookahead truncated')
      return BigInt(new DataView(next.buffer, next.byteOffset, 4).getUint32(0, true))
    }
    throw new Error('Packed expander read outside verified regions')
  }

  /** Write only the private stack, expanded records, or the native expanded flag. */
  function store(address: bigint, value: bigint, bytes: number): void {
    for (const [base, region] of regions) {
      if (address >= base && address + BigInt(bytes) <= base + BigInt(region.length)) {
        if (base === source || (base === module && (address !== module + 16n || bytes !== 1))) throw new Error('Packed expander wrote outside output contract')
        const offset = Number(address - base)
        for (let index = 0; index < bytes; index++) region[offset + index] = Number((value >> BigInt(index * 8)) & 255n)
        return
      }
    }
    throw new Error('Packed expander write outside verified regions')
  }

  /** Execute generated integer operations; unknown paths and excessive work are explicit errors. */
  function execute(): bigint {
    let pc = 0x102a5a97c
    for (let steps = 0; steps < count * 1024 + 1024; steps++) {
      switch (pc) {
'''
metadata = '{\n' + ',\n'.join(f'  "{key}": [{len(bytes.fromhex(raw))}, {int.from_bytes(bytes.fromhex(raw),"little")}n]' for key,raw in sorted(constants.items(),key=lambda x:int(x[0]))) + '\n}'
lines = [header.replace('CONTROL',metadata)]
for item in items:
    lines.append(f"        case 0x{item['address']:x}: {{ {translate(item)} }}")
lines.append('''        default: throw new Error('Unsupported packed expander control path ' + pc.toString(16))
      }
    }
    throw new Error('Packed expander instruction budget exhausted')
  }
  const result = execute()
  memory.write(target, output)
  memory.write(module + 16n, metadata.slice(16, 17))
  return result
}
''')
generated = '\n'.join(lines)
output = root / 'portable_packed_expand.ts'
if args.check:
    if output.read_text() != generated:
        raise ValueError('Checked-in TS expander differs from generated source')
else:
    output.write_text(generated)
print(json.dumps({'lifted_instructions':len(items),'control_metadata_reads':len(constants)}))
