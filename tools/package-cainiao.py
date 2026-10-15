"""按实际入口依赖打包菜鸟随行，验证版本一致后覆盖固定英文包名。"""
from pathlib import Path
import json
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def main():
    """收集当前本地模块、验证版本与 ZIP 内容并原子替换安装包。"""
    source = ROOT / 'scripts/cniao'
    metadata = json.loads((source / 'script.json').read_text())
    version = re.search(r'export const VERSION = "([^"]+)"', (source / 'settings.ts').read_text())
    if version is None or version[1] != metadata['version']:
        raise ValueError('settings.ts 与 script.json 版本不一致')
    if metadata['name'] != 'cniao':
        raise ValueError('必须保留现有脚本标识 cniao')
    required = {'script.json', 'index.tsx', 'widget.tsx', 'app_intents.tsx'}
    pending = list(required - {'script.json'})
    while pending:
        name = pending.pop()
        for dependency in re.findall(r'''from\s+["'](\./[^"']+)["']''', (source / name).read_text()):
            candidates = [source / (dependency + suffix) for suffix in ('.ts', '.tsx')]
            matches = [path for path in candidates if path.is_file()]
            if len(matches) != 1 or matches[0].parent != source:
                raise ValueError('本地模块依赖缺失、不唯一或不在包根目录: ' + dependency)
            module = matches[0].name
            if module not in required:
                required.add(module)
                pending.append(module)
    target = ROOT / 'bao/Cainiao.scripting'
    target.parent.mkdir(exist_ok=True)
    temporary = target.with_suffix('.scripting.tmp')
    try:
        with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED) as archive:
            for name in sorted(required):
                archive.write(source / name, name)
        with zipfile.ZipFile(temporary) as archive:
            if archive.testzip() is not None:
                raise ValueError('安装包 ZIP 校验失败')
            for name in required:
                if archive.read(name) != (source / name).read_bytes():
                    raise ValueError('包内文件与源码不一致: ' + name)
        temporary.replace(target)
    finally:
        temporary.unlink(missing_ok=True)
    print(f'Validated bao/Cainiao.scripting: version {metadata["version"]}, {len(required)} files')


if __name__ == '__main__':
    main()
