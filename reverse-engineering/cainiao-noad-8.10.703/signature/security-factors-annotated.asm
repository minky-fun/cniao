
Cainiao4iPhone: file format mach-o arm64

Disassembly of section __TEXT,__text:

00000001023e5330 <___cxa_throw>:
; TBSDkSignUtility getSecurityFactors:withApiName:withApiVersion:withProtocolParam:withBizParam:withHttpHeader:withUseWua:
10281f024: d10183ff    	sub	sp, sp, #0x60
10281f028: a90167fa    	stp	x26, x25, [sp, #0x10]
10281f02c: a9025ff8    	stp	x24, x23, [sp, #0x20]
10281f030: a90357f6    	stp	x22, x21, [sp, #0x30]
10281f034: a9044ff4    	stp	x20, x19, [sp, #0x40]
10281f038: a9057bfd    	stp	x29, x30, [sp, #0x50]
10281f03c: 910143fd    	add	x29, sp, #0x50
10281f040: aa0703f3    	mov	x19, x7
10281f044: aa0603f4    	mov	x20, x6
10281f048: aa0503f5    	mov	x21, x5
10281f04c: aa0403f6    	mov	x22, x4
10281f050: aa0303f7    	mov	x23, x3
10281f054: aa0203e0    	mov	x0, x2
10281f058: 394043b9    	ldrb	w25, [x29, #0x10]
10281f05c: 94704a1b    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
10281f060: aa0003f8    	mov	x24, x0
10281f064: aa1703e0    	mov	x0, x23
10281f068: 94704a18    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
10281f06c: aa0003f7    	mov	x23, x0
10281f070: aa1603e0    	mov	x0, x22
10281f074: 94704a15    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
10281f078: aa0003f6    	mov	x22, x0
10281f07c: aa1503e0    	mov	x0, x21
10281f080: 94704a12    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
10281f084: aa0003f5    	mov	x21, x0
10281f088: aa1403e0    	mov	x0, x20
10281f08c: 94704a0f    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
10281f090: aa0003f4    	mov	x20, x0
10281f094: 9001d508    	adrp	x8, 0x1062bf000 <dyld_stub_binder+0x1062bf000>
10281f098: f940fd00    	ldr	x0, [x8, #0x1f8]
10281f09c: d001d0a8    	adrp	x8, 0x106235000 <dyld_stub_binder+0x106235000>
10281f0a0: f9406501    	ldr	x1, [x8, #0xc8] ; selector: getSecurityFactors:withApiName:withApiVersion:withProtocolParam:withBizParam:withHttpHeader:withUseWua:withInstanceId:
10281f0a4: f90007ff    	str	xzr, [sp, #0x8]
10281f0a8: 390003f9    	strb	w25, [sp]
10281f0ac: aa1803e2    	mov	x2, x24
10281f0b0: aa1703e3    	mov	x3, x23
10281f0b4: aa1603e4    	mov	x4, x22
10281f0b8: aa1503e5    	mov	x5, x21
10281f0bc: aa1403e6    	mov	x6, x20
10281f0c0: aa1303e7    	mov	x7, x19
10281f0c4: 947049e0    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f0c8: aa1d03fd    	mov	x29, x29
10281f0cc: 94704a08    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f0d0: aa0003f3    	mov	x19, x0
10281f0d4: aa1403e0    	mov	x0, x20
10281f0d8: 947049f6    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f0dc: aa1503e0    	mov	x0, x21
10281f0e0: 947049f4    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f0e4: aa1603e0    	mov	x0, x22
10281f0e8: 947049f2    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f0ec: aa1703e0    	mov	x0, x23
10281f0f0: 947049f0    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f0f4: aa1803e0    	mov	x0, x24
10281f0f8: 947049ee    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f0fc: aa1303e0    	mov	x0, x19
10281f100: a9457bfd    	ldp	x29, x30, [sp, #0x50]
10281f104: a9444ff4    	ldp	x20, x19, [sp, #0x40]
10281f108: a94357f6    	ldp	x22, x21, [sp, #0x30]
10281f10c: a9425ff8    	ldp	x24, x23, [sp, #0x20]
10281f110: a94167fa    	ldp	x26, x25, [sp, #0x10]
10281f114: 910183ff    	add	sp, sp, #0x60
10281f118: 1470498c    	b	0x104431748 <dyld_stub_binder+0x104431748>
; TBSDkSignUtility getSecurityFactors:withApiName:withApiVersion:withProtocolParam:withBizParam:withHttpHeader:withUseWua:withInstanceId:
10281f11c: d10703ff    	sub	sp, sp, #0x1c0
10281f120: a9166ffc    	stp	x28, x27, [sp, #0x160]
10281f124: a91767fa    	stp	x26, x25, [sp, #0x170]
10281f128: a9185ff8    	stp	x24, x23, [sp, #0x180]
10281f12c: a91957f6    	stp	x22, x21, [sp, #0x190]
10281f130: a91a4ff4    	stp	x20, x19, [sp, #0x1a0]
10281f134: a91b7bfd    	stp	x29, x30, [sp, #0x1b0]
10281f138: 9106c3fd    	add	x29, sp, #0x1b0
10281f13c: aa0703f3    	mov	x19, x7
10281f140: aa0603f4    	mov	x20, x6
10281f144: aa0503f5    	mov	x21, x5
10281f148: aa0403f6    	mov	x22, x4
10281f14c: aa0303f7    	mov	x23, x3
10281f150: aa0003fc    	mov	x28, x0
10281f154: f9400fb8    	ldr	x24, [x29, #0x18]
10281f158: 90015ce8    	adrp	x8, 0x1053bb000 <dyld_stub_binder+0x1053bb000>
10281f15c: f9438d08    	ldr	x8, [x8, #0x718]
10281f160: f9400108    	ldr	x8, [x8]
10281f164: f81a03a8    	stur	x8, [x29, #-0x60]
10281f168: aa0203e0    	mov	x0, x2
10281f16c: 947049d7    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
10281f170: f9003fe0    	str	x0, [sp, #0x78]
10281f174: aa1703e0    	mov	x0, x23
10281f178: 947049d4    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
10281f17c: f9005fe0    	str	x0, [sp, #0xb8]
10281f180: aa1603e0    	mov	x0, x22
10281f184: 947049d1    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
10281f188: f90043e0    	str	x0, [sp, #0x80]
10281f18c: aa1503e0    	mov	x0, x21
10281f190: 947049ce    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
10281f194: aa0003f6    	mov	x22, x0
10281f198: aa1403e0    	mov	x0, x20
10281f19c: 947049cb    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
10281f1a0: aa0003f4    	mov	x20, x0
10281f1a4: aa1303e0    	mov	x0, x19
10281f1a8: 947049c8    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
10281f1ac: aa0003f5    	mov	x21, x0
10281f1b0: 9001d508    	adrp	x8, 0x1062bf000 <dyld_stub_binder+0x1062bf000>
10281f1b4: f940dd00    	ldr	x0, [x8, #0x1b8]
10281f1b8: d001d3c8    	adrp	x8, 0x106299000 <dyld_stub_binder+0x106299000>
10281f1bc: f9433901    	ldr	x1, [x8, #0x670] ; selector: shareInstanceWithID:
10281f1c0: aa1803e2    	mov	x2, x24
10281f1c4: 947049a0    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f1c8: aa1d03fd    	mov	x29, x29
10281f1cc: 947049c8    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f1d0: b001d228    	adrp	x8, 0x106264000 <dyld_stub_binder+0x106264000>
10281f1d4: f9455d01    	ldr	x1, [x8, #0xab8] ; selector: readUtdid
10281f1d8: f90063e0    	str	x0, [sp, #0xc0]
10281f1dc: 9470499a    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f1e0: aa1d03fd    	mov	x29, x29
10281f1e4: 947049c2    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f1e8: aa0003f9    	mov	x25, x0
10281f1ec: 9001d517    	adrp	x23, 0x1062bf000 <dyld_stub_binder+0x1062bf000>
10281f1f0: f9412ae0    	ldr	x0, [x23, #0x250]
10281f1f4: d001d428    	adrp	x8, 0x1062a5000 <dyld_stub_binder+0x1062a5000>
10281f1f8: f942fd13    	ldr	x19, [x8, #0x5f8] ; selector: toJsonString:
10281f1fc: aa1303e1    	mov	x1, x19
10281f200: aa1403e2    	mov	x2, x20
10281f204: 94704990    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f208: aa1d03fd    	mov	x29, x29
10281f20c: 947049b8    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f210: aa0003f8    	mov	x24, x0
10281f214: aa1403e0    	mov	x0, x20
10281f218: 947049a6    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f21c: b40000b8    	cbz	x24, 0x10281f230 <___cxa_throw+0x439f00>
10281f220: aa1803e0    	mov	x0, x24
10281f224: 947049a9    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
10281f228: aa0003fb    	mov	x27, x0
10281f22c: 14000012    	b	0x10281f274 <___cxa_throw+0x439f44>
10281f230: f9412af4    	ldr	x20, [x23, #0x250]
10281f234: 9001d4a8    	adrp	x8, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
10281f238: f9429500    	ldr	x0, [x8, #0x528]
10281f23c: 9470492e    	bl	0x1044316f4 <dyld_stub_binder+0x1044316f4>
10281f240: d001d0e8    	adrp	x8, 0x10623d000 <dyld_stub_binder+0x10623d000>
10281f244: f9412901    	ldr	x1, [x8, #0x250] ; selector: init
10281f248: 9470497f    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f24c: aa0003f7    	mov	x23, x0
10281f250: aa1403e0    	mov	x0, x20
10281f254: aa1303e1    	mov	x1, x19
10281f258: aa1703e2    	mov	x2, x23
10281f25c: 9470497a    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f260: aa1d03fd    	mov	x29, x29
10281f264: 947049a2    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f268: aa0003fb    	mov	x27, x0
10281f26c: aa1703e0    	mov	x0, x23
10281f270: 94704990    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f274: f90057f8    	str	x24, [sp, #0xa8]
10281f278: d001d468    	adrp	x8, 0x1062ad000 <dyld_stub_binder+0x1062ad000>
10281f27c: f945c517    	ldr	x23, [x8, #0xb88] ; selector: valueForKey:
10281f280: f0017842    	adrp	x2, 0x10572a000 <dyld_stub_binder+0x10572a000>
10281f284: 910f6042    	add	x2, x2, #0x3d8 ; x-uid
10281f288: aa1503e0    	mov	x0, x21
10281f28c: aa1703e1    	mov	x1, x23
10281f290: 9470496d    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f294: aa1d03fd    	mov	x29, x29
10281f298: 94704995    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f29c: aa0003f4    	mov	x20, x0
10281f2a0: f0017842    	adrp	x2, 0x10572a000 <dyld_stub_binder+0x10572a000>
10281f2a4: 91196042    	add	x2, x2, #0x658 ; x-reqbiz-ext
10281f2a8: aa1503e0    	mov	x0, x21
10281f2ac: aa1703e1    	mov	x1, x23
10281f2b0: 94704965    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f2b4: aa1d03fd    	mov	x29, x29
10281f2b8: 9470498d    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f2bc: aa0003fa    	mov	x26, x0
10281f2c0: f0017842    	adrp	x2, 0x10572a000 <dyld_stub_binder+0x10572a000>
10281f2c4: 9111e042    	add	x2, x2, #0x478 ; x-features
10281f2c8: aa1503e0    	mov	x0, x21
10281f2cc: aa1703e1    	mov	x1, x23
10281f2d0: 9470495d    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f2d4: aa1d03fd    	mov	x29, x29
10281f2d8: 94704985    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f2dc: f81783a0    	stur	x0, [x29, #-0x88]
10281f2e0: b0017862    	adrp	x2, 0x10572c000 <dyld_stub_binder+0x10572c000>
10281f2e4: 91266042    	add	x2, x2, #0x998 ; x-extdata
10281f2e8: aa1503e0    	mov	x0, x21
10281f2ec: aa1703e1    	mov	x1, x23
10281f2f0: 94704955    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f2f4: aa1d03fd    	mov	x29, x29
10281f2f8: 9470497d    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f2fc: f81703a0    	stur	x0, [x29, #-0x90]
10281f300: f0017862    	adrp	x2, 0x10572e000 <dyld_stub_binder+0x10572e000>
10281f304: 9113e042    	add	x2, x2, #0x4f8 ; x-router-id
10281f308: aa1503e0    	mov	x0, x21
10281f30c: aa1703e1    	mov	x1, x23
10281f310: 9470494d    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f314: aa1d03fd    	mov	x29, x29
10281f318: 94704975    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f31c: f81683a0    	stur	x0, [x29, #-0x98]
10281f320: f0017862    	adrp	x2, 0x10572e000 <dyld_stub_binder+0x10572e000>
10281f324: 91146042    	add	x2, x2, #0x518 ; x-place-id
10281f328: aa1503e0    	mov	x0, x21
10281f32c: aa1703e1    	mov	x1, x23
10281f330: 94704945    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f334: aa1d03fd    	mov	x29, x29
10281f338: 9470496d    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f33c: f81603a0    	stur	x0, [x29, #-0xa0]
10281f340: f0017842    	adrp	x2, 0x10572a000 <dyld_stub_binder+0x10572a000>
10281f344: 910de042    	add	x2, x2, #0x378 ; x-t
10281f348: aa1603e0    	mov	x0, x22
10281f34c: aa1703e1    	mov	x1, x23
10281f350: 9470493d    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f354: aa1d03fd    	mov	x29, x29
10281f358: 94704965    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f35c: f81583a0    	stur	x0, [x29, #-0xa8]
10281f360: f0017842    	adrp	x2, 0x10572a000 <dyld_stub_binder+0x10572a000>
10281f364: 910fe042    	add	x2, x2, #0x3f8 ; x-sid
10281f368: aa1603e0    	mov	x0, x22
10281f36c: aa1703e1    	mov	x1, x23
10281f370: 94704935    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f374: aa1d03fd    	mov	x29, x29
10281f378: 9470495d    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f37c: f81503a0    	stur	x0, [x29, #-0xb0]
10281f380: f0017842    	adrp	x2, 0x10572a000 <dyld_stub_binder+0x10572a000>
10281f384: 910c6042    	add	x2, x2, #0x318 ; x-ttid
10281f388: aa1603e0    	mov	x0, x22
10281f38c: aa1703e1    	mov	x1, x23
10281f390: 9470492d    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f394: aa1d03fd    	mov	x29, x29
10281f398: 94704955    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f39c: f81483a0    	stur	x0, [x29, #-0xb8]
10281f3a0: f0017842    	adrp	x2, 0x10572a000 <dyld_stub_binder+0x10572a000>
10281f3a4: 910ce042    	add	x2, x2, #0x338 ; x-devid
10281f3a8: aa1603e0    	mov	x0, x22
10281f3ac: aa1703e1    	mov	x1, x23
10281f3b0: 94704925    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f3b4: aa1d03fd    	mov	x29, x29
10281f3b8: 9470494d    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f3bc: f81403a0    	stur	x0, [x29, #-0xc0]
10281f3c0: f0017862    	adrp	x2, 0x10572e000 <dyld_stub_binder+0x10572e000>
10281f3c4: 9114e042    	add	x2, x2, #0x538 ; x-act
10281f3c8: aa1603e0    	mov	x0, x22
10281f3cc: aa1703e1    	mov	x1, x23
10281f3d0: 9470491d    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f3d4: aa1d03fd    	mov	x29, x29
10281f3d8: 94704945    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f3dc: f81383a0    	stur	x0, [x29, #-0xc8]
10281f3e0: f0017842    	adrp	x2, 0x10572a000 <dyld_stub_binder+0x10572a000>
10281f3e4: 9113e042    	add	x2, x2, #0x4f8 ; x-open-biz
10281f3e8: aa1603e0    	mov	x0, x22
10281f3ec: aa1703e1    	mov	x1, x23
10281f3f0: 94704915    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f3f4: aa1d03fd    	mov	x29, x29
10281f3f8: 9470493d    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f3fc: f81303a0    	stur	x0, [x29, #-0xd0]
10281f400: f0017842    	adrp	x2, 0x10572a000 <dyld_stub_binder+0x10572a000>
10281f404: 91156042    	add	x2, x2, #0x558 ; x-open-biz-data
10281f408: aa1603e0    	mov	x0, x22
10281f40c: aa1703e1    	mov	x1, x23
10281f410: 9470490d    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f414: aa1d03fd    	mov	x29, x29
10281f418: 94704935    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f41c: f9006fe0    	str	x0, [sp, #0xd8]
10281f420: f0017842    	adrp	x2, 0x10572a000 <dyld_stub_binder+0x10572a000>
10281f424: 91146042    	add	x2, x2, #0x518 ; x-mini-appkey
10281f428: aa1603e0    	mov	x0, x22
10281f42c: aa1703e1    	mov	x1, x23
10281f430: 94704905    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f434: aa1d03fd    	mov	x29, x29
10281f438: 9470492d    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f43c: f9006be0    	str	x0, [sp, #0xd0]
10281f440: f0017842    	adrp	x2, 0x10572a000 <dyld_stub_binder+0x10572a000>
10281f444: 9114e042    	add	x2, x2, #0x538 ; x-req-appkey
10281f448: aa1603e0    	mov	x0, x22
10281f44c: aa1703e1    	mov	x1, x23
10281f450: 947048fd    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f454: aa1d03fd    	mov	x29, x29
10281f458: 94704925    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f45c: f90067e0    	str	x0, [sp, #0xc8]
10281f460: f0017842    	adrp	x2, 0x10572a000 <dyld_stub_binder+0x10572a000>
10281f464: 910e6042    	add	x2, x2, #0x398 ; x-location
10281f468: aa1603e0    	mov	x0, x22
10281f46c: aa1703e1    	mov	x1, x23
10281f470: 947048f5    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f474: aa1d03fd    	mov	x29, x29
10281f478: 9470491d    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f47c: aa0003f7    	mov	x23, x0
10281f480: aa1603e0    	mov	x0, x22
10281f484: 9470490b    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f488: b0016dd3    	adrp	x19, 0x1055d8000 <dyld_stub_binder+0x1055d8000>
10281f48c: 9123e273    	add	x19, x19, #0x8f8
10281f490: 9001cff6    	adrp	x22, 0x10621b000 <dyld_stub_binder+0x10621b000>
10281f494: f90047f7    	str	x23, [sp, #0x88]
10281f498: b40003f7    	cbz	x23, 0x10281f514 <___cxa_throw+0x43a1e4>
10281f49c: b001cfc8    	adrp	x8, 0x106218000 <dyld_stub_binder+0x106218000>
10281f4a0: f947ad01    	ldr	x1, [x8, #0xf58] ; selector: componentsSeparatedByString:
10281f4a4: d0016dc2    	adrp	x2, 0x1055d9000 <dyld_stub_binder+0x1055d9000>
10281f4a8: 911ee042    	add	x2, x2, #0x7b8 ; ,
10281f4ac: aa1703e0    	mov	x0, x23
10281f4b0: 947048e5    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f4b4: aa1d03fd    	mov	x29, x29
10281f4b8: 9470490d    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f4bc: aa0003f8    	mov	x24, x0
10281f4c0: f9439ac1    	ldr	x1, [x22, #0x730] ; selector: count
10281f4c4: 947048e0    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f4c8: f100081f    	cmp	x0, #0x2
10281f4cc: 540002a1    	b.ne	0x10281f520 <___cxa_throw+0x43a1f0>
10281f4d0: 9001d1c8    	adrp	x8, 0x106257000 <dyld_stub_binder+0x106257000>
10281f4d4: f9419d16    	ldr	x22, [x8, #0x338] ; selector: objectAtIndex:
10281f4d8: aa1803e0    	mov	x0, x24
10281f4dc: aa1603e1    	mov	x1, x22
10281f4e0: d2800002    	mov	x2, #0x0                ; =0
10281f4e4: 947048d8    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f4e8: aa1d03fd    	mov	x29, x29
10281f4ec: 94704900    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f4f0: aa0003f7    	mov	x23, x0
10281f4f4: aa1803e0    	mov	x0, x24
10281f4f8: aa1603e1    	mov	x1, x22
10281f4fc: 52800022    	mov	w2, #0x1                ; =1
10281f500: 947048d1    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f504: aa1d03fd    	mov	x29, x29
10281f508: 947048f9    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f50c: aa0003f6    	mov	x22, x0
10281f510: 14000007    	b	0x10281f52c <___cxa_throw+0x43a1fc>
10281f514: aa1303f7    	mov	x23, x19
10281f518: aa1303f6    	mov	x22, x19
10281f51c: 14000006    	b	0x10281f534 <___cxa_throw+0x43a204>
10281f520: b0016dd7    	adrp	x23, 0x1055d8000 <dyld_stub_binder+0x1055d8000>
10281f524: 9123e2f7    	add	x23, x23, #0x8f8
10281f528: aa1703f6    	mov	x22, x23
10281f52c: aa1803e0    	mov	x0, x24
10281f530: 947048e0    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f534: 9001d4a8    	adrp	x8, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
10281f538: f942c118    	ldr	x24, [x8, #0x580]
10281f53c: f100033f    	cmp	x25, #0x0
10281f540: f9005bf9    	str	x25, [sp, #0xb0]
10281f544: 9a990279    	csel	x25, x19, x25, eq
10281f548: f100029f    	cmp	x20, #0x0
10281f54c: a90953fa    	stp	x26, x20, [sp, #0x90]
10281f550: 9a940274    	csel	x20, x19, x20, eq
10281f554: f100035f    	cmp	x26, #0x0
10281f558: 9a9a027a    	csel	x26, x19, x26, eq
10281f55c: d001d188    	adrp	x8, 0x106251000 <dyld_stub_binder+0x106251000>
10281f560: f946a901    	ldr	x1, [x8, #0xd50] ; selector: md5:
10281f564: aa1c03e0    	mov	x0, x28
10281f568: f90053fb    	str	x27, [sp, #0xa0]
10281f56c: aa1b03e2    	mov	x2, x27
10281f570: 947048b5    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f574: aa1d03fd    	mov	x29, x29
10281f578: 947048dd    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f57c: aa0003fb    	mov	x27, x0
10281f580: a97523a9    	ldp	x9, x8, [x29, #-0xb0]
10281f584: f100011f    	cmp	x8, #0x0
10281f588: 9a880268    	csel	x8, x19, x8, eq
10281f58c: f100013f    	cmp	x9, #0x0
10281f590: 9a890269    	csel	x9, x19, x9, eq
10281f594: a9742bab    	ldp	x11, x10, [x29, #-0xc0]
10281f598: f100015f    	cmp	x10, #0x0
10281f59c: 9a8a026a    	csel	x10, x19, x10, eq
10281f5a0: f100017f    	cmp	x11, #0x0
10281f5a4: 9a8b026b    	csel	x11, x19, x11, eq
10281f5a8: f10002df    	cmp	x22, #0x0
10281f5ac: a906dff6    	stp	x22, x23, [sp, #0x68]
10281f5b0: 9a96026c    	csel	x12, x19, x22, eq
10281f5b4: f10002ff    	cmp	x23, #0x0
10281f5b8: 9a97026d    	csel	x13, x19, x23, eq
10281f5bc: f001cf4e    	adrp	x14, 0x10620a000 <dyld_stub_binder+0x10620a000>
10281f5c0: f94389c1    	ldr	x1, [x14, #0x710] ; selector: arrayWithObjects:
10281f5c4: a905ffed    	stp	x13, xzr, [sp, #0x58]
10281f5c8: a904b3eb    	stp	x11, x12, [sp, #0x48]
10281f5cc: a903abe9    	stp	x9, x10, [sp, #0x38]
10281f5d0: a947f3f7    	ldp	x23, x28, [sp, #0x78]
10281f5d4: a901a3e0    	stp	x0, x8, [sp, #0x18]
10281f5d8: f9405ff6    	ldr	x22, [sp, #0xb8]
10281f5dc: a902f3f6    	stp	x22, x28, [sp, #0x28]
10281f5e0: a900dffa    	stp	x26, x23, [sp, #0x8]
10281f5e4: f90003f4    	str	x20, [sp]
10281f5e8: aa1803e0    	mov	x0, x24
10281f5ec: aa1903e2    	mov	x2, x25
10281f5f0: 94704895    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f5f4: aa1d03fd    	mov	x29, x29
10281f5f8: 947048bd    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f5fc: aa0003fa    	mov	x26, x0
10281f600: aa1c03e0    	mov	x0, x28
10281f604: 947048ab    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f608: aa1b03e0    	mov	x0, x27
10281f60c: 947048a9    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f610: f85703a8    	ldur	x8, [x29, #-0x90]
10281f614: f100011f    	cmp	x8, #0x0
10281f618: 9a880262    	csel	x2, x19, x8, eq
10281f61c: d001cf28    	adrp	x8, 0x106205000 <dyld_stub_binder+0x106205000>
10281f620: f942d518    	ldr	x24, [x8, #0x5a8] ; selector: addObject:
10281f624: aa1a03e0    	mov	x0, x26
10281f628: aa1803e1    	mov	x1, x24
10281f62c: 94704886    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f630: f85783a8    	ldur	x8, [x29, #-0x88]
10281f634: f100011f    	cmp	x8, #0x0
10281f638: 9a880262    	csel	x2, x19, x8, eq
10281f63c: aa1a03e0    	mov	x0, x26
10281f640: aa1803e1    	mov	x1, x24
10281f644: 94704880    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f648: f85683a8    	ldur	x8, [x29, #-0x98]
10281f64c: f100011f    	cmp	x8, #0x0
10281f650: 9a880262    	csel	x2, x19, x8, eq
10281f654: aa1a03e0    	mov	x0, x26
10281f658: aa1803e1    	mov	x1, x24
10281f65c: 9470487a    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f660: f85603a8    	ldur	x8, [x29, #-0xa0]
10281f664: f100011f    	cmp	x8, #0x0
10281f668: 9a880262    	csel	x2, x19, x8, eq
10281f66c: aa1a03e0    	mov	x0, x26
10281f670: aa1803e1    	mov	x1, x24
10281f674: 94704874    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f678: f85303a8    	ldur	x8, [x29, #-0xd0]
10281f67c: f100011f    	cmp	x8, #0x0
10281f680: 9a880262    	csel	x2, x19, x8, eq
10281f684: aa1a03e0    	mov	x0, x26
10281f688: aa1803e1    	mov	x1, x24
10281f68c: 9470486e    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f690: f9406be8    	ldr	x8, [sp, #0xd0]
10281f694: f100011f    	cmp	x8, #0x0
10281f698: 9a880262    	csel	x2, x19, x8, eq
10281f69c: aa1a03e0    	mov	x0, x26
10281f6a0: aa1803e1    	mov	x1, x24
10281f6a4: 94704868    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f6a8: f94067e8    	ldr	x8, [sp, #0xc8]
10281f6ac: f100011f    	cmp	x8, #0x0
10281f6b0: 9a880262    	csel	x2, x19, x8, eq
10281f6b4: aa1a03e0    	mov	x0, x26
10281f6b8: aa1803e1    	mov	x1, x24
10281f6bc: 94704862    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f6c0: f85383a8    	ldur	x8, [x29, #-0xc8]
10281f6c4: f100011f    	cmp	x8, #0x0
10281f6c8: 9a880262    	csel	x2, x19, x8, eq
10281f6cc: aa1a03e0    	mov	x0, x26
10281f6d0: aa1803e1    	mov	x1, x24
10281f6d4: 9470485c    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f6d8: f9406fe8    	ldr	x8, [sp, #0xd8]
10281f6dc: f100011f    	cmp	x8, #0x0
10281f6e0: 9a880262    	csel	x2, x19, x8, eq
10281f6e4: aa1a03e0    	mov	x0, x26
10281f6e8: aa1803e1    	mov	x1, x24
10281f6ec: 94704856    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f6f0: b001cfc8    	adrp	x8, 0x106218000 <dyld_stub_binder+0x106218000>
10281f6f4: f947a118    	ldr	x24, [x8, #0xf40] ; selector: componentsJoinedByString:
10281f6f8: d0016de2    	adrp	x2, 0x1055dd000 <dyld_stub_binder+0x1055dd000>
10281f6fc: 912fe042    	add	x2, x2, #0xbf8 ; &
10281f700: aa1a03e0    	mov	x0, x26
10281f704: aa1803e1    	mov	x1, x24
10281f708: 9470484f    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f70c: aa1d03fd    	mov	x29, x29
10281f710: 94704877    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f714: aa0003fb    	mov	x27, x0
10281f718: b001d468    	adrp	x8, 0x1062ac000 <dyld_stub_binder+0x1062ac000>
10281f71c: f943fd01    	ldr	x1, [x8, #0x7f8] ; selector: useSecurityGuard
10281f720: f94063f4    	ldr	x20, [sp, #0xc0]
10281f724: aa1403e0    	mov	x0, x20
10281f728: 94704847    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f72c: 340008a0    	cbz	w0, 0x10281f840 <___cxa_throw+0x43a510>
10281f730: 394043b8    	ldrb	w24, [x29, #0x10]
10281f734: d0017088    	adrp	x8, 0x105631000 <dyld_stub_binder+0x105631000>
10281f738: 91166108    	add	x8, x8, #0x598 ; pageId
10281f73c: f81903a8    	stur	x8, [x29, #-0x70]
10281f740: 9001d1c8    	adrp	x8, 0x106257000 <dyld_stub_binder+0x106257000>
10281f744: f941d501    	ldr	x1, [x8, #0x3a8] ; selector: objectForKey:
10281f748: f0017842    	adrp	x2, 0x10572a000 <dyld_stub_binder+0x10572a000>
10281f74c: 9116e042    	add	x2, x2, #0x5b8 ; x-page-url
10281f750: aa1503e0    	mov	x0, x21
10281f754: 9470483c    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f758: aa1d03fd    	mov	x29, x29
10281f75c: 94704864    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f760: aa0003fc    	mov	x28, x0
10281f764: f100001f    	cmp	x0, #0x0
10281f768: 9a800268    	csel	x8, x19, x0, eq
10281f76c: f81983a8    	stur	x8, [x29, #-0x68]
10281f770: 9001d4a8    	adrp	x8, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
10281f774: f9429500    	ldr	x0, [x8, #0x528]
10281f778: f001d008    	adrp	x8, 0x106222000 <dyld_stub_binder+0x106222000>
10281f77c: f946d101    	ldr	x1, [x8, #0xda0] ; selector: dictionaryWithObjects:forKeys:count:
10281f780: d101a3a2    	sub	x2, x29, #0x68
10281f784: d101c3a3    	sub	x3, x29, #0x70
10281f788: 52800024    	mov	w4, #0x1                ; =1
10281f78c: 9470482e    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f790: aa1d03fd    	mov	x29, x29
10281f794: 94704856    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f798: aa0003f9    	mov	x25, x0
10281f79c: aa1c03e0    	mov	x0, x28
10281f7a0: 94704844    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f7a4: 9001d508    	adrp	x8, 0x1062bf000 <dyld_stub_binder+0x1062bf000>
10281f7a8: f940a500    	ldr	x0, [x8, #0x148]
10281f7ac: f001d108    	adrp	x8, 0x106242000 <dyld_stub_binder+0x106242000>
10281f7b0: f9440d01    	ldr	x1, [x8, #0x818] ; selector: instance
10281f7b4: 94704824    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f7b8: aa1d03fd    	mov	x29, x29
10281f7bc: 9470484c    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f7c0: aa0003f3    	mov	x19, x0
10281f7c4: 9001d508    	adrp	x8, 0x1062bf000 <dyld_stub_binder+0x1062bf000>
10281f7c8: f9412500    	ldr	x0, [x8, #0x248]
10281f7cc: d001d168    	adrp	x8, 0x10624d000 <dyld_stub_binder+0x10624d000>
10281f7d0: f947c91c    	ldr	x28, [x8, #0xf90] ; selector: log:file:func:line:module:msg:
10281f7d4: b00117e3    	adrp	x3, 0x104b1c000 <dyld_stub_binder+0x104b1c000>
10281f7d8: 9132b463    	add	x3, x3, #0xcad ; MtopSDK/TBSDkSignUtility.m
10281f7dc: b00117e4    	adrp	x4, 0x104b1c000 <dyld_stub_binder+0x104b1c000>
10281f7e0: 9138f884    	add	x4, x4, #0xe3e ; +[TBSDkSignUtility getSecurityFactors:withApiName:withApiVersion:withProtocolParam:withBizParam:withHttpHeader:withUseWua:withInstanceId:]
10281f7e4: b0017866    	adrp	x6, 0x10572c000 <dyld_stub_binder+0x10572c000>
10281f7e8: 910de0c6    	add	x6, x6, #0x378 ; MtopSDK
10281f7ec: f0017867    	adrp	x7, 0x10572e000 <dyld_stub_binder+0x10572e000>
10281f7f0: 9115e0e7    	add	x7, x7, #0x578 ; use new SecurityGuardOpenMiddleTierGeneric interface to generate 'x-sign'
10281f7f4: aa1c03e1    	mov	x1, x28
10281f7f8: 52800062    	mov	w2, #0x3                ; =3
10281f7fc: 52802b65    	mov	w5, #0x15b              ; =347
10281f800: 94704811    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f804: 9001d068    	adrp	x8, 0x10622b000 <dyld_stub_binder+0x10622b000>
10281f808: f944c101    	ldr	x1, [x8, #0x980] ; selector: factorSign:input:extendParas:isUseWua:api:
10281f80c: aa1303e0    	mov	x0, x19
10281f810: aa1703e2    	mov	x2, x23
10281f814: aa1b03e3    	mov	x3, x27
10281f818: aa1903e4    	mov	x4, x25
10281f81c: aa1803e5    	mov	x5, x24
10281f820: aa1603e6    	mov	x6, x22
10281f824: 94704808    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f828: aa1d03fd    	mov	x29, x29
10281f82c: 94704830    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f830: aa0003f8    	mov	x24, x0
10281f834: aa1303e0    	mov	x0, x19
10281f838: 9470481e    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f83c: 1400003e    	b	0x10281f934 <___cxa_throw+0x43a604>
10281f840: 9001d508    	adrp	x8, 0x1062bf000 <dyld_stub_binder+0x1062bf000>
10281f844: f9412500    	ldr	x0, [x8, #0x248]
10281f848: d001d168    	adrp	x8, 0x10624d000 <dyld_stub_binder+0x10624d000>
10281f84c: f947c91c    	ldr	x28, [x8, #0xf90] ; selector: log:file:func:line:module:msg:
10281f850: b00117e3    	adrp	x3, 0x104b1c000 <dyld_stub_binder+0x104b1c000>
10281f854: 9132b463    	add	x3, x3, #0xcad ; MtopSDK/TBSDkSignUtility.m
10281f858: b00117e4    	adrp	x4, 0x104b1c000 <dyld_stub_binder+0x104b1c000>
10281f85c: 9138f884    	add	x4, x4, #0xe3e ; +[TBSDkSignUtility getSecurityFactors:withApiName:withApiVersion:withProtocolParam:withBizParam:withHttpHeader:withUseWua:withInstanceId:]
10281f860: b0017866    	adrp	x6, 0x10572c000 <dyld_stub_binder+0x10572c000>
10281f864: 910de0c6    	add	x6, x6, #0x378 ; MtopSDK
10281f868: f0017867    	adrp	x7, 0x10572e000 <dyld_stub_binder+0x10572e000>
10281f86c: 9116e0e7    	add	x7, x7, #0x5b8 ; use HAMCSHA-1 to generate 'x-sign'
10281f870: aa1c03e1    	mov	x1, x28
10281f874: 52800062    	mov	w2, #0x3                ; =3
10281f878: 52802bc5    	mov	w5, #0x15e              ; =350
10281f87c: 947047f2    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f880: 9001d508    	adrp	x8, 0x1062bf000 <dyld_stub_binder+0x1062bf000>
10281f884: f940a513    	ldr	x19, [x8, #0x148]
10281f888: d0016de2    	adrp	x2, 0x1055dd000 <dyld_stub_binder+0x1055dd000>
10281f88c: 912fe042    	add	x2, x2, #0xbf8 ; &
10281f890: aa1a03e0    	mov	x0, x26
10281f894: aa1803e1    	mov	x1, x24
10281f898: 947047eb    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f89c: aa1d03fd    	mov	x29, x29
10281f8a0: 94704813    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f8a4: aa0003f8    	mov	x24, x0
10281f8a8: d001cf48    	adrp	x8, 0x106209000 <dyld_stub_binder+0x106209000>
10281f8ac: f940c901    	ldr	x1, [x8, #0x190] ; selector: appSecret
10281f8b0: aa1403e0    	mov	x0, x20
10281f8b4: 947047e4    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f8b8: aa1d03fd    	mov	x29, x29
10281f8bc: 9470480c    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f8c0: aa0003f4    	mov	x20, x0
10281f8c4: f001d0c8    	adrp	x8, 0x10623a000 <dyld_stub_binder+0x10623a000>
10281f8c8: f946cd01    	ldr	x1, [x8, #0xd98] ; selector: hmacsha1:key:
10281f8cc: aa1303e0    	mov	x0, x19
10281f8d0: aa1803e2    	mov	x2, x24
10281f8d4: aa1403e3    	mov	x3, x20
10281f8d8: 947047db    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f8dc: aa1d03fd    	mov	x29, x29
10281f8e0: 94704803    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f8e4: aa0003f9    	mov	x25, x0
10281f8e8: aa1403e0    	mov	x0, x20
10281f8ec: f94063f4    	ldr	x20, [sp, #0xc0]
10281f8f0: 947047f0    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f8f4: aa1803e0    	mov	x0, x24
10281f8f8: 947047ee    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f8fc: f0017848    	adrp	x8, 0x10572a000 <dyld_stub_binder+0x10572a000>
10281f900: 9118e108    	add	x8, x8, #0x638 ; x-sign
10281f904: a93867a8    	stp	x8, x25, [x29, #-0x80]
10281f908: 9001d4a8    	adrp	x8, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
10281f90c: f9429500    	ldr	x0, [x8, #0x528]
10281f910: f001d008    	adrp	x8, 0x106222000 <dyld_stub_binder+0x106222000>
10281f914: f946d101    	ldr	x1, [x8, #0xda0] ; selector: dictionaryWithObjects:forKeys:count:
10281f918: d101e3a2    	sub	x2, x29, #0x78
10281f91c: d10203a3    	sub	x3, x29, #0x80
10281f920: 52800024    	mov	w4, #0x1                ; =1
10281f924: 947047c8    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f928: aa1d03fd    	mov	x29, x29
10281f92c: 947047f0    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281f930: aa0003f8    	mov	x24, x0
10281f934: aa1903e0    	mov	x0, x25
10281f938: 947047de    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f93c: 9001d508    	adrp	x8, 0x1062bf000 <dyld_stub_binder+0x1062bf000>
10281f940: f9412500    	ldr	x0, [x8, #0x248]
10281f944: f90003f8    	str	x24, [sp]
10281f948: b00117e3    	adrp	x3, 0x104b1c000 <dyld_stub_binder+0x104b1c000>
10281f94c: 9132b463    	add	x3, x3, #0xcad ; MtopSDK/TBSDkSignUtility.m
10281f950: b00117e4    	adrp	x4, 0x104b1c000 <dyld_stub_binder+0x104b1c000>
10281f954: 9138f884    	add	x4, x4, #0xe3e ; +[TBSDkSignUtility getSecurityFactors:withApiName:withApiVersion:withProtocolParam:withBizParam:withHttpHeader:withUseWua:withInstanceId:]
10281f958: b0017866    	adrp	x6, 0x10572c000 <dyld_stub_binder+0x10572c000>
10281f95c: 910de0c6    	add	x6, x6, #0x378 ; MtopSDK
10281f960: f0017867    	adrp	x7, 0x10572e000 <dyld_stub_binder+0x10572e000>
10281f964: 9118e0e7    	add	x7, x7, #0x638 ; Generated SecurityFactors: %@
10281f968: aa1c03e1    	mov	x1, x28
10281f96c: 52800062    	mov	w2, #0x3                ; =3
10281f970: 52802c65    	mov	w5, #0x163              ; =355
10281f974: 947047b4    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f978: 9001cfe8    	adrp	x8, 0x10621b000 <dyld_stub_binder+0x10621b000>
10281f97c: f9439901    	ldr	x1, [x8, #0x730] ; selector: count
10281f980: aa1803e0    	mov	x0, x24
10281f984: 947047b0    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281f988: 90015ce8    	adrp	x8, 0x1053bb000 <dyld_stub_binder+0x1053bb000>
10281f98c: f9437508    	ldr	x8, [x8, #0x6e8]
10281f990: f9400108    	ldr	x8, [x8]
10281f994: f100001f    	cmp	x0, #0x0
10281f998: 9a980100    	csel	x0, x8, x24, eq
10281f99c: 947047d1    	bl	0x1044318e0 <dyld_stub_binder+0x1044318e0>
10281f9a0: aa0003fc    	mov	x28, x0
10281f9a4: aa1803e0    	mov	x0, x24
10281f9a8: 947047c2    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f9ac: aa1b03e0    	mov	x0, x27
10281f9b0: 947047c0    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f9b4: aa1a03e0    	mov	x0, x26
10281f9b8: 947047be    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f9bc: f94047e0    	ldr	x0, [sp, #0x88]
10281f9c0: 947047bc    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f9c4: f9403be0    	ldr	x0, [sp, #0x70]
10281f9c8: 947047ba    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f9cc: f94037e0    	ldr	x0, [sp, #0x68]
10281f9d0: 947047b8    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f9d4: f94067e0    	ldr	x0, [sp, #0xc8]
10281f9d8: 947047b6    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f9dc: f9406be0    	ldr	x0, [sp, #0xd0]
10281f9e0: 947047b4    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f9e4: f9406fe0    	ldr	x0, [sp, #0xd8]
10281f9e8: 947047b2    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f9ec: f85303a0    	ldur	x0, [x29, #-0xd0]
10281f9f0: 947047b0    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f9f4: f85383a0    	ldur	x0, [x29, #-0xc8]
10281f9f8: 947047ae    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281f9fc: f85403a0    	ldur	x0, [x29, #-0xc0]
10281fa00: 947047ac    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fa04: f85483a0    	ldur	x0, [x29, #-0xb8]
10281fa08: 947047aa    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fa0c: f85503a0    	ldur	x0, [x29, #-0xb0]
10281fa10: 947047a8    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fa14: f85583a0    	ldur	x0, [x29, #-0xa8]
10281fa18: 947047a6    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fa1c: f85603a0    	ldur	x0, [x29, #-0xa0]
10281fa20: 947047a4    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fa24: f85683a0    	ldur	x0, [x29, #-0x98]
10281fa28: 947047a2    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fa2c: f85703a0    	ldur	x0, [x29, #-0x90]
10281fa30: 947047a0    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fa34: f85783a0    	ldur	x0, [x29, #-0x88]
10281fa38: 9470479e    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fa3c: f9404be0    	ldr	x0, [sp, #0x90]
10281fa40: 9470479c    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fa44: f9404fe0    	ldr	x0, [sp, #0x98]
10281fa48: 9470479a    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fa4c: f94053e0    	ldr	x0, [sp, #0xa0]
10281fa50: 94704798    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fa54: f94057e0    	ldr	x0, [sp, #0xa8]
10281fa58: 94704796    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fa5c: f9405be0    	ldr	x0, [sp, #0xb0]
10281fa60: 94704794    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fa64: aa1403e0    	mov	x0, x20
10281fa68: 94704792    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fa6c: aa1503e0    	mov	x0, x21
10281fa70: 94704790    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fa74: aa1603e0    	mov	x0, x22
10281fa78: 9470478e    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fa7c: aa1703e0    	mov	x0, x23
10281fa80: 9470478c    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fa84: f85a03a8    	ldur	x8, [x29, #-0x60]
10281fa88: 90015ce9    	adrp	x9, 0x1053bb000 <dyld_stub_binder+0x1053bb000>
10281fa8c: f9438d29    	ldr	x9, [x9, #0x718]
10281fa90: f9400129    	ldr	x9, [x9]
10281fa94: eb08013f    	cmp	x9, x8
10281fa98: 54000141    	b.ne	0x10281fac0 <___cxa_throw+0x43a790>
10281fa9c: aa1c03e0    	mov	x0, x28
10281faa0: a95b7bfd    	ldp	x29, x30, [sp, #0x1b0]
10281faa4: a95a4ff4    	ldp	x20, x19, [sp, #0x1a0]
10281faa8: a95957f6    	ldp	x22, x21, [sp, #0x190]
10281faac: a9585ff8    	ldp	x24, x23, [sp, #0x180]
10281fab0: a95767fa    	ldp	x26, x25, [sp, #0x170]
10281fab4: a9566ffc    	ldp	x28, x27, [sp, #0x160]
10281fab8: 910703ff    	add	sp, sp, #0x1c0
10281fabc: d65f03c0    	ret
10281fac0: 97c69956    	bl	0x1019c6018 <__ZN5hmdBU10async_safe11linked_listI22hmdBU_async_dict_entryE4nextEPNS3_4nodeE+0x5168>
; TBSDkSignUtility md5:value:
10281fac4: d10183ff    	sub	sp, sp, #0x60
10281fac8: a90167fa    	stp	x26, x25, [sp, #0x10]
10281facc: a9025ff8    	stp	x24, x23, [sp, #0x20]
10281fad0: a90357f6    	stp	x22, x21, [sp, #0x30]
10281fad4: a9044ff4    	stp	x20, x19, [sp, #0x40]
10281fad8: a9057bfd    	stp	x29, x30, [sp, #0x50]
10281fadc: 910143fd    	add	x29, sp, #0x50
10281fae0: aa0303f3    	mov	x19, x3
10281fae4: aa0203e0    	mov	x0, x2
10281fae8: 94704778    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
10281faec: aa0003f7    	mov	x23, x0
10281faf0: aa1303e0    	mov	x0, x19
10281faf4: 94704775    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
10281faf8: aa0003f8    	mov	x24, x0
10281fafc: d0010960    	adrp	x0, 0x10494d000 <dyld_stub_binder+0x10494d000>
10281fb00: 91333400    	add	x0, x0, #0xccd ; SecurityGuardManager
10281fb04: 94704735    	bl	0x1044317d8 <dyld_stub_binder+0x1044317d8>
10281fb08: aa1d03fd    	mov	x29, x29
10281fb0c: 94704778    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281fb10: aa0003f3    	mov	x19, x0
10281fb14: f001d088    	adrp	x8, 0x106232000 <dyld_stub_binder+0x106232000>
10281fb18: f9470502    	ldr	x2, [x8, #0xe08] ; selector: getInstance
10281fb1c: f001d1e8    	adrp	x8, 0x10625e000 <dyld_stub_binder+0x10625e000>
10281fb20: f9436514    	ldr	x20, [x8, #0x6c8] ; selector: performSelector:
10281fb24: aa1403e1    	mov	x1, x20
10281fb28: 94704747    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281fb2c: d001d0a8    	adrp	x8, 0x106235000 <dyld_stub_binder+0x106235000>
10281fb30: f9403902    	ldr	x2, [x8, #0x70] ; selector: getSecureSignatureComp
10281fb34: aa1403e1    	mov	x1, x20
10281fb38: 94704743    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281fb3c: aa1d03fd    	mov	x29, x29
10281fb40: 9470476b    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281fb44: aa0003f4    	mov	x20, x0
10281fb48: f0017860    	adrp	x0, 0x10572e000 <dyld_stub_binder+0x10572e000>
10281fb4c: 91196000    	add	x0, x0, #0x658 ; SecurityGuardParamContext
10281fb50: 947039ea    	bl	0x10442e2f8 <dyld_stub_binder+0x10442e2f8>
10281fb54: 947046e8    	bl	0x1044316f4 <dyld_stub_binder+0x1044316f4>
10281fb58: d001d0e8    	adrp	x8, 0x10623d000 <dyld_stub_binder+0x10623d000>
10281fb5c: f9412919    	ldr	x25, [x8, #0x250] ; selector: init
10281fb60: aa1903e1    	mov	x1, x25
10281fb64: 94704738    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281fb68: aa0003f5    	mov	x21, x0
10281fb6c: b001d2a8    	adrp	x8, 0x106274000 <dyld_stub_binder+0x106274000>
10281fb70: f943a902    	ldr	x2, [x8, #0x750] ; selector: setAppKey:
10281fb74: f001d1e8    	adrp	x8, 0x10625e000 <dyld_stub_binder+0x10625e000>
10281fb78: f9437116    	ldr	x22, [x8, #0x6e0] ; selector: performSelector:withObject:
10281fb7c: aa1603e1    	mov	x1, x22
10281fb80: aa1703e3    	mov	x3, x23
10281fb84: 94704730    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281fb88: aa1703e0    	mov	x0, x23
10281fb8c: 94704749    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fb90: 9001d4a8    	adrp	x8, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
10281fb94: f942a100    	ldr	x0, [x8, #0x540]
10281fb98: 947046d7    	bl	0x1044316f4 <dyld_stub_binder+0x1044316f4>
10281fb9c: aa1903e1    	mov	x1, x25
10281fba0: 94704729    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281fba4: aa0003f7    	mov	x23, x0
10281fba8: d0016848    	adrp	x8, 0x105529000 <dyld_stub_binder+0x105529000>
10281fbac: d503201f    	nop
10281fbb0: f9421103    	ldr	x3, [x8, #0x420]
10281fbb4: f001d3a8    	adrp	x8, 0x106296000 <dyld_stub_binder+0x106296000>
10281fbb8: f945c901    	ldr	x1, [x8, #0xb90] ; selector: setValue:forKey:
10281fbbc: aa1803e2    	mov	x2, x24
10281fbc0: 94704721    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281fbc4: aa1803e0    	mov	x0, x24
10281fbc8: 9470473a    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fbcc: d001d4a8    	adrp	x8, 0x1062b5000 <dyld_stub_binder+0x1062b5000>
10281fbd0: f9404118    	ldr	x24, [x8, #0x80]
10281fbd4: f001d368    	adrp	x8, 0x10628e000 <dyld_stub_binder+0x10628e000>
10281fbd8: f9428519    	ldr	x25, [x8, #0x508] ; selector: setRequestType:
10281fbdc: f001d188    	adrp	x8, 0x106252000 <dyld_stub_binder+0x106252000>
10281fbe0: f9445501    	ldr	x1, [x8, #0x8a8] ; selector: methodSignatureForSelector:
10281fbe4: aa1503e0    	mov	x0, x21
10281fbe8: aa1903e2    	mov	x2, x25
10281fbec: 94704716    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281fbf0: aa1d03fd    	mov	x29, x29
10281fbf4: 9470473e    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281fbf8: aa0003fa    	mov	x26, x0
10281fbfc: 9001d128    	adrp	x8, 0x106243000 <dyld_stub_binder+0x106243000>
10281fc00: f9415101    	ldr	x1, [x8, #0x2a0] ; selector: invocationWithMethodSignature:
10281fc04: aa1803e0    	mov	x0, x24
10281fc08: aa1a03e2    	mov	x2, x26
10281fc0c: 9470470e    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281fc10: aa1d03fd    	mov	x29, x29
10281fc14: 94704736    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281fc18: aa0003f8    	mov	x24, x0
10281fc1c: aa1a03e0    	mov	x0, x26
10281fc20: 94704724    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fc24: b001d388    	adrp	x8, 0x106290000 <dyld_stub_binder+0x106290000>
10281fc28: f942f501    	ldr	x1, [x8, #0x5e8] ; selector: setSelector:
10281fc2c: aa1803e0    	mov	x0, x24
10281fc30: aa1903e2    	mov	x2, x25
10281fc34: 94704704    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281fc38: 9001d3a8    	adrp	x8, 0x106293000 <dyld_stub_binder+0x106293000>
10281fc3c: f944a101    	ldr	x1, [x8, #0x940] ; selector: setTarget:
10281fc40: aa1803e0    	mov	x0, x24
10281fc44: aa1503e2    	mov	x2, x21
10281fc48: 947046ff    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281fc4c: d000ffe8    	adrp	x8, 0x10481d000 <dyld_stub_binder+0x10481d000>
10281fc50: d503201f    	nop
10281fc54: f9435108    	ldr	x8, [x8, #0x6a0]
10281fc58: f90007e8    	str	x8, [sp, #0x8]
10281fc5c: b001d2a8    	adrp	x8, 0x106274000 <dyld_stub_binder+0x106274000>
10281fc60: f9460101    	ldr	x1, [x8, #0xc00] ; selector: setArgument:atIndex:
10281fc64: 910023e2    	add	x2, sp, #0x8
10281fc68: aa1803e0    	mov	x0, x24
10281fc6c: 52800043    	mov	w3, #0x2                ; =2
10281fc70: 947046f5    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281fc74: 9001d128    	adrp	x8, 0x106243000 <dyld_stub_binder+0x106243000>
10281fc78: f9415501    	ldr	x1, [x8, #0x2a8] ; selector: invoke
10281fc7c: aa1803e0    	mov	x0, x24
10281fc80: 947046f1    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281fc84: 9001d368    	adrp	x8, 0x10628b000 <dyld_stub_binder+0x10628b000>
10281fc88: f9411d02    	ldr	x2, [x8, #0x238] ; selector: setParamDict:
10281fc8c: aa1503e0    	mov	x0, x21
10281fc90: aa1603e1    	mov	x1, x22
10281fc94: aa1703e3    	mov	x3, x23
10281fc98: 947046eb    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281fc9c: b001d3e8    	adrp	x8, 0x10629c000 <dyld_stub_binder+0x10629c000>
10281fca0: f942ed02    	ldr	x2, [x8, #0x5d8] ; selector: signRequest:
10281fca4: aa1403e0    	mov	x0, x20
10281fca8: aa1603e1    	mov	x1, x22
10281fcac: aa1503e3    	mov	x3, x21
10281fcb0: 947046e5    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281fcb4: aa1d03fd    	mov	x29, x29
10281fcb8: 9470470d    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281fcbc: aa0003f6    	mov	x22, x0
10281fcc0: aa1803e0    	mov	x0, x24
10281fcc4: 947046fb    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fcc8: aa1703e0    	mov	x0, x23
10281fccc: 947046f9    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fcd0: aa1503e0    	mov	x0, x21
10281fcd4: 947046f7    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fcd8: aa1403e0    	mov	x0, x20
10281fcdc: 947046f5    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fce0: aa1303e0    	mov	x0, x19
10281fce4: 947046f3    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fce8: aa1603e0    	mov	x0, x22
10281fcec: a9457bfd    	ldp	x29, x30, [sp, #0x50]
10281fcf0: a9444ff4    	ldp	x20, x19, [sp, #0x40]
10281fcf4: a94357f6    	ldp	x22, x21, [sp, #0x30]
10281fcf8: a9425ff8    	ldp	x24, x23, [sp, #0x20]
10281fcfc: a94167fa    	ldp	x26, x25, [sp, #0x10]
10281fd00: 910183ff    	add	sp, sp, #0x60
10281fd04: 14704691    	b	0x104431748 <dyld_stub_binder+0x104431748>
; TBSDkSignUtility md5:
10281fd08: d10303ff    	sub	sp, sp, #0xc0
10281fd0c: a90a4ff4    	stp	x20, x19, [sp, #0xa0]
10281fd10: a90b7bfd    	stp	x29, x30, [sp, #0xb0]
10281fd14: 9102c3fd    	add	x29, sp, #0xb0
10281fd18: aa0203e0    	mov	x0, x2
10281fd1c: 90015ce8    	adrp	x8, 0x1053bb000 <dyld_stub_binder+0x1053bb000>
10281fd20: f9438d08    	ldr	x8, [x8, #0x718]
10281fd24: f9400108    	ldr	x8, [x8]
10281fd28: f81e83a8    	stur	x8, [x29, #-0x18]
10281fd2c: 947046e7    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
10281fd30: 947046e9    	bl	0x1044318d4 <dyld_stub_binder+0x1044318d4>
10281fd34: aa0003f3    	mov	x19, x0
10281fd38: b001cf08    	adrp	x8, 0x106200000 <dyld_stub_binder+0x106200000>
10281fd3c: f944c101    	ldr	x1, [x8, #0x980] ; selector: UTF8String
10281fd40: 947046c1    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281fd44: aa0003f4    	mov	x20, x0
10281fd48: aa1303e0    	mov	x0, x19
10281fd4c: 947046d9    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fd50: aa1403e0    	mov	x0, x20
10281fd54: 9470490e    	bl	0x10443218c <dyld_stub_binder+0x10443218c>
10281fd58: aa0003e1    	mov	x1, x0
10281fd5c: d100a3a2    	sub	x2, x29, #0x28
10281fd60: aa1403e0    	mov	x0, x20
10281fd64: 9470332c    	bl	0x10442ca14 <dyld_stub_binder+0x10442ca14>
10281fd68: 9001d4a8    	adrp	x8, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
10281fd6c: f942a900    	ldr	x0, [x8, #0x550]
10281fd70: 385d83a8    	ldurb	w8, [x29, #-0x28]
10281fd74: 385d93a9    	ldurb	w9, [x29, #-0x27]
10281fd78: 385da3aa    	ldurb	w10, [x29, #-0x26]
10281fd7c: 385db3ab    	ldurb	w11, [x29, #-0x25]
10281fd80: 385dc3ac    	ldurb	w12, [x29, #-0x24]
10281fd84: 385dd3ad    	ldurb	w13, [x29, #-0x23]
10281fd88: 385de3ae    	ldurb	w14, [x29, #-0x22]
10281fd8c: 385df3af    	ldurb	w15, [x29, #-0x21]
10281fd90: 385e03b0    	ldurb	w16, [x29, #-0x20]
10281fd94: 385e13b1    	ldurb	w17, [x29, #-0x1f]
10281fd98: 385e23a2    	ldurb	w2, [x29, #-0x1e]
10281fd9c: 385e33a3    	ldurb	w3, [x29, #-0x1d]
10281fda0: 385e43a4    	ldurb	w4, [x29, #-0x1c]
10281fda4: 385e53a5    	ldurb	w5, [x29, #-0x1b]
10281fda8: 385e63a6    	ldurb	w6, [x29, #-0x1a]
10281fdac: 385e73a7    	ldurb	w7, [x29, #-0x19]
10281fdb0: b001d401    	adrp	x1, 0x1062a0000 <dyld_stub_binder+0x1062a0000>
10281fdb4: f9467021    	ldr	x1, [x1, #0xce0] ; selector: stringWithFormat:
10281fdb8: a9071fe6    	stp	x6, x7, [sp, #0x70]
10281fdbc: a90617e4    	stp	x4, x5, [sp, #0x60]
10281fdc0: a9050fe2    	stp	x2, x3, [sp, #0x50]
10281fdc4: a90447f0    	stp	x16, x17, [sp, #0x40]
10281fdc8: a9033fee    	stp	x14, x15, [sp, #0x30]
10281fdcc: a90237ec    	stp	x12, x13, [sp, #0x20]
10281fdd0: d0016ea2    	adrp	x2, 0x1055f5000 <dyld_stub_binder+0x1055f5000>
10281fdd4: 9108e042    	add	x2, x2, #0x238 ; %02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X
10281fdd8: a9012fea    	stp	x10, x11, [sp, #0x10]
10281fddc: a90027e8    	stp	x8, x9, [sp]
10281fde0: 94704699    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281fde4: aa1d03fd    	mov	x29, x29
10281fde8: 947046c1    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281fdec: aa0003f4    	mov	x20, x0
10281fdf0: 9001d188    	adrp	x8, 0x10624f000 <dyld_stub_binder+0x10624f000>
10281fdf4: f9452501    	ldr	x1, [x8, #0xa48] ; selector: lowercaseString
10281fdf8: 94704693    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281fdfc: aa1d03fd    	mov	x29, x29
10281fe00: 947046bb    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
10281fe04: aa0003f3    	mov	x19, x0
10281fe08: aa1403e0    	mov	x0, x20
10281fe0c: 947046a9    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281fe10: f85e83a8    	ldur	x8, [x29, #-0x18]
10281fe14: 90015ce9    	adrp	x9, 0x1053bb000 <dyld_stub_binder+0x1053bb000>
10281fe18: f9438d29    	ldr	x9, [x9, #0x718]
10281fe1c: f9400129    	ldr	x9, [x9]
10281fe20: eb08013f    	cmp	x9, x8
10281fe24: 540000c1    	b.ne	0x10281fe3c <___cxa_throw+0x43ab0c>
10281fe28: aa1303e0    	mov	x0, x19
10281fe2c: a94b7bfd    	ldp	x29, x30, [sp, #0xb0]
10281fe30: a94a4ff4    	ldp	x20, x19, [sp, #0xa0]
10281fe34: 910303ff    	add	sp, sp, #0xc0
10281fe38: 14704644    	b	0x104431748 <dyld_stub_binder+0x104431748>
10281fe3c: 97c69877    	bl	0x1019c6018 <__ZN5hmdBU10async_safe11linked_listI22hmdBU_async_dict_entryE4nextEPNS3_4nodeE+0x5168>
