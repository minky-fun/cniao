"""按红果入口的实际依赖生成固定英文名 Scripting 安装包。"""
from pathlib import Path
import json
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def main():
    """收集嵌套模块，校验元数据和源码后原子替换安装包。"""
    source = (ROOT / 'scripts/红果').resolve()
    metadata = json.loads((source / 'script.json').read_text())
    if metadata['name'] != '红果' or metadata['entry'] != 'index.tsx':
        raise ValueError('必须保留红果脚本名称和入口')
    for field in ('icon', 'color', 'version'):
        if not metadata[field]:
            raise ValueError('脚本元数据缺失: ' + field)
    required = {'script.json', 'index.tsx'}
    pending = ['index.tsx']
    imports = re.compile(
        r'''\bfrom\s+["']([^"']+)["']|\bimport\s*(?:\(\s*)?["']([^"']+)["']'''
    )
    while pending:
        name = pending.pop()
        for match in imports.finditer((source / name).read_text()):
            dependency = match[1] or match[2]
            if dependency == 'scripting':
                continue
            if not dependency.startswith(('./', '../')):
                raise ValueError('未支持的外部依赖: ' + dependency)
            base = source / Path(name).parent / dependency
            candidates = [Path(str(base) + suffix).resolve() for suffix in ('.ts', '.tsx')]
            matches = [path for path in candidates if path.is_file()]
            if len(matches) != 1 or not matches[0].is_relative_to(source):
                raise ValueError(f'{name} 的依赖缺失、不唯一或越界: {dependency}')
            module = matches[0].relative_to(source).as_posix()
            if module not in required:
                required.add(module)
                pending.append(module)
    target = ROOT / 'bao/Hongguo.scripting'
    target.parent.mkdir(exist_ok=True)
    temporary = target.with_suffix('.scripting.tmp')
    try:
        with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED) as archive:
            for name in sorted(required):
                archive.write(source / name, name)
        with zipfile.ZipFile(temporary) as archive:
            if archive.testzip() is not None or set(archive.namelist()) != required:
                raise ValueError('安装包 ZIP 完整性或文件清单校验失败')
            if json.loads(archive.read('script.json')) != metadata:
                raise ValueError('安装包元数据不一致')
            for name in required:
                if archive.read(name) != (source / name).read_bytes():
                    raise ValueError('包内文件与源码不一致: ' + name)
        temporary.replace(target)
    finally:
        temporary.unlink(missing_ok=True)
    print(f'Validated bao/Hongguo.scripting: version {metadata["version"]}, {len(required)} files')


if __name__ == '__main__':
    main()
