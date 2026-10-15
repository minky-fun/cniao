
Cainiao4iPhone: file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
; SecurityGuardSecureSignature signRequest:
102ab5e10: d10203ff    	sub	sp, sp, #0x80
102ab5e14: a9026ffc    	stp	x28, x27, [sp, #0x20]
102ab5e18: a90367fa    	stp	x26, x25, [sp, #0x30]
102ab5e1c: a9045ff8    	stp	x24, x23, [sp, #0x40]
102ab5e20: a90557f6    	stp	x22, x21, [sp, #0x50]
102ab5e24: a9064ff4    	stp	x20, x19, [sp, #0x60]
102ab5e28: a9077bfd    	stp	x29, x30, [sp, #0x70]
102ab5e2c: 9101c3fd    	add	x29, sp, #0x70
102ab5e30: aa0203f3    	mov	x19, x2
102ab5e34: aa0003f5    	mov	x21, x0
102ab5e38: 52800548    	mov	w8, #0x2a               ; =42
102ab5e3c: b9001fe8    	str	w8, [sp, #0x1c]
102ab5e40: 910073e8    	add	x8, sp, #0x1c
102ab5e44: 10000025    	adr	x5, 0x102ab5e48 <_CMa03SUie28mjv+0x50a10>
102ab5e48: 980000cd    	ldrsw	x13, 0x102ab5e60 <_CMa03SUie28mjv+0x50a28>
102ab5e4c: b980011b    	ldrsw	x27, [x8]
102ab5e50: cb1b01ad    	sub	x13, x13, x27
102ab5e54: 8b0d00a5    	add	x5, x5, x13
102ab5e58: d28013e8    	mov	x8, #0x9f               ; =159
102ab5e5c: d61f00a0    	br	x5
102ab5e60: 0000005a    	udf	#0x5a
102ab5e64: 2be47d30    	<unknown>
102ab5e68: 78a0fc92    	<unknown>
102ab5e6c: 079a712b    	<unknown>
102ab5e70: 028972d1    	<unknown>
102ab5e74: df7de61d    	<unknown>
102ab5e78: f001f214    	adrp	x20, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab5e7c: 3953c689    	ldrb	w9, [x20, #0x4f1]
102ab5e80: 7103f91f    	cmp	w8, #0xfe
102ab5e84: 7a401924    	ccmp	w9, #0x0, #0x4, ne
102ab5e88: 540001e1    	b.ne	0x102ab5ec4 <_CMa03SUie28mjv+0x50a8c>
102ab5e8c: f001f200    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab5e90: 9113c800    	add	x0, x0, #0x4f2
102ab5e94: d000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab5e98: 91333c42    	add	x2, x2, #0xccf
102ab5e9c: 9000eb83    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102ab5ea0: 91267063    	add	x3, x3, #0x99c
102ab5ea4: 52800061    	mov	w1, #0x3                ; =3
102ab5ea8: 52800084    	mov	w4, #0x4                ; =4
102ab5eac: 528006a5    	mov	w5, #0x35               ; =53
102ab5eb0: 9465dfcb    	bl	0x10442dddc <dyld_stub_binder+0x10442dddc>
102ab5eb4: 52800028    	mov	w8, #0x1                ; =1
102ab5eb8: 3913c688    	strb	w8, [x20, #0x4f1]
102ab5ebc: b00153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab5ec0: f9449d1f    	ldr	xzr, [x8, #0x938]
102ab5ec4: f001f214    	adrp	x20, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab5ec8: 3953d688    	ldrb	w8, [x20, #0x4f5]
102ab5ecc: 370001a8    	tbnz	w8, #0x0, 0x102ab5f00 <_CMa03SUie28mjv+0x50ac8>
102ab5ed0: f001f200    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab5ed4: 9113d800    	add	x0, x0, #0x4f6
102ab5ed8: d000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab5edc: 91334842    	add	x2, x2, #0xcd2
102ab5ee0: d000eb63    	adrp	x3, 0x104823000 <dyld_stub_binder+0x104823000>
102ab5ee4: 91336463    	add	x3, x3, #0xcd9
102ab5ee8: 528000e1    	mov	w1, #0x7                ; =7
102ab5eec: 52800064    	mov	w4, #0x3                ; =3
102ab5ef0: 52800fa5    	mov	w5, #0x7d               ; =125
102ab5ef4: 9465dfb7    	bl	0x10442ddd0 <dyld_stub_binder+0x10442ddd0>
102ab5ef8: 52800028    	mov	w8, #0x1                ; =1
102ab5efc: 3913d688    	strb	w8, [x20, #0x4f5]
102ab5f00: f001f214    	adrp	x20, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab5f04: 3953f688    	ldrb	w8, [x20, #0x4fd]
102ab5f08: 370001a8    	tbnz	w8, #0x0, 0x102ab5f3c <_CMa03SUie28mjv+0x50b04>
102ab5f0c: f001f200    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab5f10: 9113f800    	add	x0, x0, #0x4fe
102ab5f14: d000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab5f18: 91337042    	add	x2, x2, #0xcdc
102ab5f1c: 9000eb83    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102ab5f20: 91265063    	add	x3, x3, #0x994
102ab5f24: 52800061    	mov	w1, #0x3                ; =3
102ab5f28: 52800084    	mov	w4, #0x4                ; =4
102ab5f2c: 528012e5    	mov	w5, #0x97               ; =151
102ab5f30: 9465dfab    	bl	0x10442dddc <dyld_stub_binder+0x10442dddc>
102ab5f34: 52800028    	mov	w8, #0x1                ; =1
102ab5f38: 3913f688    	strb	w8, [x20, #0x4fd]
102ab5f3c: f001f214    	adrp	x20, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab5f40: 39540688    	ldrb	w8, [x20, #0x501]
102ab5f44: 370002e8    	tbnz	w8, #0x0, 0x102ab5fa0 <_CMa03SUie28mjv+0x50b68>
102ab5f48: f001f200    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab5f4c: 91140800    	add	x0, x0, #0x502
102ab5f50: d000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab5f54: 91337c42    	add	x2, x2, #0xcdf
102ab5f58: 9000eb83    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102ab5f5c: 91266063    	add	x3, x3, #0x998
102ab5f60: 528001c1    	mov	w1, #0xe                ; =14
102ab5f64: 52800084    	mov	w4, #0x4                ; =4
102ab5f68: 52800f25    	mov	w5, #0x79               ; =121
102ab5f6c: 9465df99    	bl	0x10442ddd0 <dyld_stub_binder+0x10442ddd0>
102ab5f70: f001f208    	adrp	x8, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab5f74: b9454509    	ldr	w9, [x8, #0x544]
102ab5f78: 1100392a    	add	w10, w9, #0xe
102ab5f7c: b905450a    	str	w10, [x8, #0x544]
102ab5f80: 2a290148    	orn	w8, w10, w9
102ab5f84: 0a09014a    	and	w10, w10, w9
102ab5f88: 4b090149    	sub	w9, w10, w9
102ab5f8c: 4b080128    	sub	w8, w9, w8
102ab5f90: 71000d1f    	cmp	w8, #0x3
102ab5f94: 54000060    	b.eq	0x102ab5fa0 <_CMa03SUie28mjv+0x50b68>
102ab5f98: 52800028    	mov	w8, #0x1                ; =1
102ab5f9c: 39140688    	strb	w8, [x20, #0x501]
102ab5fa0: f001ba88    	adrp	x8, 0x106208000 <dyld_stub_binder+0x106208000>
102ab5fa4: f947b914    	ldr	x20, [x8, #0xf70] ; selector: appKey
102ab5fa8: aa1303e0    	mov	x0, x19
102ab5fac: 9465ee47    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102ab5fb0: aa0003f6    	mov	x22, x0
102ab5fb4: aa1403e1    	mov	x1, x20
102ab5fb8: 9465ee23    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab5fbc: aa1d03fd    	mov	x29, x29
102ab5fc0: 9465ee4b    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab5fc4: aa0003f3    	mov	x19, x0
102ab5fc8: f001bd28    	adrp	x8, 0x10625c000 <dyld_stub_binder+0x10625c000>
102ab5fcc: f945e101    	ldr	x1, [x8, #0xbc0] ; selector: paramDict
102ab5fd0: aa1603e0    	mov	x0, x22
102ab5fd4: 9465ee1c    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab5fd8: aa1d03fd    	mov	x29, x29
102ab5fdc: 9465ee44    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab5fe0: aa0003f4    	mov	x20, x0
102ab5fe4: d001bda8    	adrp	x8, 0x10626b000 <dyld_stub_binder+0x10626b000>
102ab5fe8: f9433901    	ldr	x1, [x8, #0x670] ; selector: requestType
102ab5fec: aa1603e0    	mov	x0, x22
102ab5ff0: 9465ee15    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab5ff4: aa0003f7    	mov	x23, x0
102ab5ff8: aa1603e0    	mov	x0, x22
102ab5ffc: 9465ee2d    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab6000: b001bca8    	adrp	x8, 0x10624b000 <dyld_stub_binder+0x10624b000>
102ab6004: f944e916    	ldr	x22, [x8, #0x9d0] ; selector: length
102ab6008: aa1303e0    	mov	x0, x19
102ab600c: aa1603e1    	mov	x1, x22
102ab6010: 9465ee0d    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab6014: b4000a54    	cbz	x20, 0x102ab615c <_CMa03SUie28mjv+0x50d24>
102ab6018: b4000a20    	cbz	x0, 0x102ab615c <_CMa03SUie28mjv+0x50d24>
102ab601c: b001bfe8    	adrp	x8, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
102ab6020: f9429500    	ldr	x0, [x8, #0x528]
102ab6024: f001bae8    	adrp	x8, 0x106215000 <dyld_stub_binder+0x106215000>
102ab6028: f9404101    	ldr	x1, [x8, #0x80] ; selector: class
102ab602c: 9465ee06    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab6030: aa0003e2    	mov	x2, x0
102ab6034: f001bc68    	adrp	x8, 0x106245000 <dyld_stub_binder+0x106245000>
102ab6038: f947a101    	ldr	x1, [x8, #0xf40] ; selector: isKindOfClass:
102ab603c: aa1403e0    	mov	x0, x20
102ab6040: 9465ee01    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab6044: 340008c0    	cbz	w0, 0x102ab615c <_CMa03SUie28mjv+0x50d24>
102ab6048: 90015408    	adrp	x8, 0x105536000 <dyld_stub_binder+0x105536000>
102ab604c: d503201f    	nop
102ab6050: f9424119    	ldr	x25, [x8, #0x480]
102ab6054: b001bd08    	adrp	x8, 0x106257000 <dyld_stub_binder+0x106257000>
102ab6058: f942411a    	ldr	x26, [x8, #0x480] ; selector: objectForKeyedSubscript:
102ab605c: aa1403e0    	mov	x0, x20
102ab6060: aa1a03e1    	mov	x1, x26
102ab6064: aa1903e2    	mov	x2, x25
102ab6068: 9465edf7    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab606c: aa1d03fd    	mov	x29, x29
102ab6070: 9465ee1f    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab6074: b4000260    	cbz	x0, 0x102ab60c0 <_CMa03SUie28mjv+0x50c88>
102ab6078: aa0003f8    	mov	x24, x0
102ab607c: aa1403e0    	mov	x0, x20
102ab6080: aa1a03e1    	mov	x1, x26
102ab6084: aa1903e2    	mov	x2, x25
102ab6088: 9465edef    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab608c: aa1d03fd    	mov	x29, x29
102ab6090: 9465ee17    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab6094: aa0003f9    	mov	x25, x0
102ab6098: aa1603e1    	mov	x1, x22
102ab609c: 9465edea    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab60a0: b4000560    	cbz	x0, 0x102ab614c <_CMa03SUie28mjv+0x50d14>
102ab60a4: aa1903e0    	mov	x0, x25
102ab60a8: 9465ee02    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab60ac: aa1803e0    	mov	x0, x24
102ab60b0: 9465ee00    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab60b4: f1005eff    	cmp	x23, #0x17
102ab60b8: 5400026b    	b.lt	0x102ab6104 <_CMa03SUie28mjv+0x50ccc>
102ab60bc: 14000028    	b	0x102ab615c <_CMa03SUie28mjv+0x50d24>
102ab60c0: d001f208    	adrp	x8, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab60c4: b9454509    	ldr	w9, [x8, #0x544]
102ab60c8: 11003d2a    	add	w10, w9, #0xf
102ab60cc: b905450a    	str	w10, [x8, #0x544]
102ab60d0: 0a290148    	bic	w8, w10, w9
102ab60d4: 128001eb    	mov	w11, #-0x10             ; =-16
102ab60d8: 4b09016b    	sub	w11, w11, w9
102ab60dc: 4a2b012b    	eon	w11, w9, w11
102ab60e0: 2a090149    	orr	w9, w10, w9
102ab60e4: 0b0a016a    	add	w10, w11, w10
102ab60e8: 4b080148    	sub	w8, w10, w8
102ab60ec: 6b09011f    	cmp	w8, w9
102ab60f0: 540000a1    	b.ne	0x102ab6104 <_CMa03SUie28mjv+0x50ccc>
102ab60f4: 900153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab60f8: f944991f    	ldr	xzr, [x8, #0x930]
102ab60fc: f1005aff    	cmp	x23, #0x16
102ab6100: 540002ec    	b.gt	0x102ab615c <_CMa03SUie28mjv+0x50d24>
102ab6104: f001bac8    	adrp	x8, 0x106211000 <dyld_stub_binder+0x106211000>
102ab6108: f941e101    	ldr	x1, [x8, #0x3c0] ; selector: callCoreSignFunctionsWithArray:appKey:signType:mask:
102ab610c: aa1503e0    	mov	x0, x21
102ab6110: aa1403e2    	mov	x2, x20
102ab6114: aa1303e3    	mov	x3, x19
102ab6118: aa1703e4    	mov	x4, x23
102ab611c: d2800005    	mov	x5, #0x0                ; =0
102ab6120: 9465edc9    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab6124: aa1d03fd    	mov	x29, x29
102ab6128: 9465edf1    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab612c: aa0003f5    	mov	x21, x0
102ab6130: f10022ff    	cmp	x23, #0x8
102ab6134: 54000940    	b.eq	0x102ab625c <_CMa03SUie28mjv+0x50e24>
102ab6138: f1000aff    	cmp	x23, #0x2
102ab613c: 54000a81    	b.ne	0x102ab628c <_CMa03SUie28mjv+0x50e54>
102ab6140: 900153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab6144: f944911f    	ldr	xzr, [x8, #0x920]
102ab6148: 14000047    	b	0x102ab6264 <_CMa03SUie28mjv+0x50e2c>
102ab614c: aa1903e0    	mov	x0, x25
102ab6150: 9465edd8    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab6154: aa1803e0    	mov	x0, x24
102ab6158: 9465edd6    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab615c: d001f208    	adrp	x8, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab6160: 91140908    	add	x8, x8, #0x502
102ab6164: b001bffa    	adrp	x26, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
102ab6168: f942ab40    	ldr	x0, [x26, #0x550]
102ab616c: d001bf49    	adrp	x9, 0x1062a0000 <dyld_stub_binder+0x1062a0000>
102ab6170: f9467137    	ldr	x23, [x9, #0xce0] ; selector: stringWithFormat:
102ab6174: f90003e8    	str	x8, [sp]
102ab6178: 900164c2    	adrp	x2, 0x10574e000 <dyld_stub_binder+0x10574e000>
102ab617c: 912de042    	add	x2, x2, #0xb78
102ab6180: aa1703e1    	mov	x1, x23
102ab6184: 9465edb0    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab6188: aa1d03fd    	mov	x29, x29
102ab618c: 9465edd8    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab6190: aa0003f5    	mov	x21, x0
102ab6194: b4000440    	cbz	x0, 0x102ab621c <_CMa03SUie28mjv+0x50de4>
102ab6198: f942ab40    	ldr	x0, [x26, #0x550]
102ab619c: 52804b28    	mov	w8, #0x259              ; =601
102ab61a0: f90003e8    	str	x8, [sp]
102ab61a4: aa1703e1    	mov	x1, x23
102ab61a8: aa1503e2    	mov	x2, x21
102ab61ac: 9465eda6    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab61b0: aa1d03fd    	mov	x29, x29
102ab61b4: 9465edce    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab61b8: aa0003f8    	mov	x24, x0
102ab61bc: d0015919    	adrp	x25, 0x1055d8000 <dyld_stub_binder+0x1055d8000>
102ab61c0: 9123e339    	add	x25, x25, #0x8f8
102ab61c4: aa1903e0    	mov	x0, x25
102ab61c8: aa1603e1    	mov	x1, x22
102ab61cc: 9465ed9e    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab61d0: b40001a0    	cbz	x0, 0x102ab6204 <_CMa03SUie28mjv+0x50dcc>
102ab61d4: f942ab40    	ldr	x0, [x26, #0x550]
102ab61d8: a90067f8    	stp	x24, x25, [sp]
102ab61dc: 900164c2    	adrp	x2, 0x10574e000 <dyld_stub_binder+0x10574e000>
102ab61e0: 912e6042    	add	x2, x2, #0xb98
102ab61e4: aa1703e1    	mov	x1, x23
102ab61e8: 9465ed97    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab61ec: aa1d03fd    	mov	x29, x29
102ab61f0: 9465edbf    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab61f4: aa0003f6    	mov	x22, x0
102ab61f8: aa1803e0    	mov	x0, x24
102ab61fc: 9465edad    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab6200: aa1603f8    	mov	x24, x22
102ab6204: f90003f8    	str	x24, [sp]
102ab6208: 900164c0    	adrp	x0, 0x10574e000 <dyld_stub_binder+0x10574e000>
102ab620c: 912ee000    	add	x0, x0, #0xbb8
102ab6210: 9465e04c    	bl	0x10442e340 <dyld_stub_binder+0x10442e340>
102ab6214: aa1803e0    	mov	x0, x24
102ab6218: 9465eda6    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab621c: aa1503e0    	mov	x0, x21
102ab6220: 9465eda4    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab6224: d2800015    	mov	x21, #0x0               ; =0
102ab6228: aa1403e0    	mov	x0, x20
102ab622c: 9465eda1    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab6230: aa1303e0    	mov	x0, x19
102ab6234: 9465ed9f    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab6238: aa1503e0    	mov	x0, x21
102ab623c: a9477bfd    	ldp	x29, x30, [sp, #0x70]
102ab6240: a9464ff4    	ldp	x20, x19, [sp, #0x60]
102ab6244: a94557f6    	ldp	x22, x21, [sp, #0x50]
102ab6248: a9445ff8    	ldp	x24, x23, [sp, #0x40]
102ab624c: a94367fa    	ldp	x26, x25, [sp, #0x30]
102ab6250: a9426ffc    	ldp	x28, x27, [sp, #0x20]
102ab6254: 910203ff    	add	sp, sp, #0x80
102ab6258: 1465ed3c    	b	0x104431748 <dyld_stub_binder+0x104431748>
102ab625c: 900153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab6260: f944951f    	ldr	xzr, [x8, #0x928]
102ab6264: b001bfa8    	adrp	x8, 0x1062ab000 <dyld_stub_binder+0x1062ab000>
102ab6268: f947c101    	ldr	x1, [x8, #0xf80] ; selector: uppercaseString
102ab626c: aa1503e0    	mov	x0, x21
102ab6270: 9465ed75    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab6274: aa1d03fd    	mov	x29, x29
102ab6278: 9465ed9d    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab627c: aa0003f6    	mov	x22, x0
102ab6280: aa1503e0    	mov	x0, x21
102ab6284: 9465ed8b    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab6288: aa1603f5    	mov	x21, x22
102ab628c: aa1503e0    	mov	x0, x21
102ab6290: 9465ed8e    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102ab6294: aa0003f5    	mov	x21, x0
102ab6298: 9465ed86    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab629c: 17ffffe3    	b	0x102ab6228 <_CMa03SUie28mjv+0x50df0>
; SecurityGuardSecureSignature getMetaClass
102ab62a0: d10083ff    	sub	sp, sp, #0x20
102ab62a4: a90157f6    	stp	x22, x21, [sp, #0x10]
102ab62a8: 528005e8    	mov	w8, #0x2f               ; =47
102ab62ac: b9000fe8    	str	w8, [sp, #0xc]
102ab62b0: 910033e8    	add	x8, sp, #0xc
102ab62b4: 1000002e    	adr	x14, 0x102ab62b8 <_CMa03SUie28mjv+0x50e80>
102ab62b8: 98000116    	ldrsw	x22, 0x102ab62d8 <_CMa03SUie28mjv+0x50ea0>
102ab62bc: 9102bad6    	add	x22, x22, #0xae
102ab62c0: aa3603f6    	mvn	x22, x22
102ab62c4: b9800100    	ldrsw	x0, [x8]
102ab62c8: 8b0002d6    	add	x22, x22, x0
102ab62cc: 8b1601ce    	add	x14, x14, x22
102ab62d0: d2800ac8    	mov	x8, #0x56               ; =86
102ab62d4: d61f01c0    	br	x14
102ab62d8: ffffff4c    	<unknown>
102ab62dc: 1fba7343    	<unknown>
102ab62e0: 91219d05    	add	x5, x8, #0x867
102ab62e4: 2cc15602    	ldp	s2, s21, [x16], #0x8
102ab62e8: e4ff7fbd    	<unknown>
102ab62ec: d001c048    	adrp	x8, 0x1062c0000 <dyld_stub_binder+0x1062c0000>
102ab62f0: f9401900    	ldr	x0, [x8, #0x30]
102ab62f4: f001bae8    	adrp	x8, 0x106215000 <dyld_stub_binder+0x106215000>
102ab62f8: f9404101    	ldr	x1, [x8, #0x80] ; selector: class
102ab62fc: a94157f6    	ldp	x22, x21, [sp, #0x10]
102ab6300: 910083ff    	add	sp, sp, #0x20
102ab6304: 1465ed50    	b	0x104431844 <dyld_stub_binder+0x104431844>
; SecurityGuardSecureSignature NSDictionary2HashMap:
102ab6308: d106c3ff    	sub	sp, sp, #0x1b0
102ab630c: a9156ffc    	stp	x28, x27, [sp, #0x150]
102ab6310: a91667fa    	stp	x26, x25, [sp, #0x160]
102ab6314: a9175ff8    	stp	x24, x23, [sp, #0x170]
102ab6318: a91857f6    	stp	x22, x21, [sp, #0x180]
102ab631c: a9194ff4    	stp	x20, x19, [sp, #0x190]
102ab6320: a91a7bfd    	stp	x29, x30, [sp, #0x1a0]
102ab6324: 910683fd    	add	x29, sp, #0x1a0
102ab6328: aa0203f4    	mov	x20, x2
102ab632c: b0014828    	adrp	x8, 0x1053bb000 <dyld_stub_binder+0x1053bb000>
102ab6330: f9438d08    	ldr	x8, [x8, #0x718]
102ab6334: f9400108    	ldr	x8, [x8]
102ab6338: f81a03a8    	stur	x8, [x29, #-0x60]
102ab633c: 52800d48    	mov	w8, #0x6a               ; =106
102ab6340: b9007be8    	str	w8, [sp, #0x78]
102ab6344: 9101e3e8    	add	x8, sp, #0x78
102ab6348: 10000026    	adr	x6, 0x102ab634c <_CMa03SUie28mjv+0x50f14>
102ab634c: 9800013c    	ldrsw	x28, 0x102ab6370 <_CMa03SUie28mjv+0x50f38>
102ab6350: d280017a    	mov	x26, #0xb               ; =11
102ab6354: ca1a039c    	eor	x28, x28, x26
102ab6358: d100539c    	sub	x28, x28, #0x14
102ab635c: b980010f    	ldrsw	x15, [x8]
102ab6360: cb0f039c    	sub	x28, x28, x15
102ab6364: 8b1c00c6    	add	x6, x6, x28
102ab6368: d2800428    	mov	x8, #0x21               ; =33
102ab636c: d61f00c0    	br	x6
102ab6370: 000000b1    	udf	#0xb1
102ab6374: 6131d721    	<unknown>
102ab6378: 36123639    	tbz	w25, #0x2, 0x102abaa3c <_CMa03SUie28mjv+0x55604>
102ab637c: d648b20d    	<unknown>
102ab6380: 900c711c    	adrp	x28, 0x11b8d6000 <___obfuscator_version+0x14ede000>
102ab6384: 4c53ec7f    	<unknown>
102ab6388: b9007fe8    	str	w8, [sp, #0x7c]
102ab638c: d001f213    	adrp	x19, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab6390: 39544268    	ldrb	w8, [x19, #0x510]
102ab6394: 370001a8    	tbnz	w8, #0x0, 0x102ab63c8 <_CMa03SUie28mjv+0x50f90>
102ab6398: d001f200    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab639c: 91144400    	add	x0, x0, #0x511
102ab63a0: b000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab63a4: 9133b442    	add	x2, x2, #0xced
102ab63a8: f000eb63    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102ab63ac: 91264063    	add	x3, x3, #0x990
102ab63b0: 52800621    	mov	w1, #0x31               ; =49
102ab63b4: 52800084    	mov	w4, #0x4                ; =4
102ab63b8: 52800225    	mov	w5, #0x11               ; =17
102ab63bc: 9465de8b    	bl	0x10442dde8 <dyld_stub_binder+0x10442dde8>
102ab63c0: 52800028    	mov	w8, #0x1                ; =1
102ab63c4: 39144268    	strb	w8, [x19, #0x510]
102ab63c8: d001f213    	adrp	x19, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab63cc: 3953c668    	ldrb	w8, [x19, #0x4f1]
102ab63d0: 370001a8    	tbnz	w8, #0x0, 0x102ab6404 <_CMa03SUie28mjv+0x50fcc>
102ab63d4: d001f200    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab63d8: 9113c800    	add	x0, x0, #0x4f2
102ab63dc: b000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab63e0: 91333c42    	add	x2, x2, #0xccf
102ab63e4: f000eb63    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102ab63e8: 91267063    	add	x3, x3, #0x99c
102ab63ec: 52800061    	mov	w1, #0x3                ; =3
102ab63f0: 52800084    	mov	w4, #0x4                ; =4
102ab63f4: 528006a5    	mov	w5, #0x35               ; =53
102ab63f8: 9465de79    	bl	0x10442dddc <dyld_stub_binder+0x10442dddc>
102ab63fc: 52800028    	mov	w8, #0x1                ; =1
102ab6400: 3913c668    	strb	w8, [x19, #0x4f1]
102ab6404: d001f213    	adrp	x19, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab6408: 3953d668    	ldrb	w8, [x19, #0x4f5]
102ab640c: 370001a8    	tbnz	w8, #0x0, 0x102ab6440 <_CMa03SUie28mjv+0x51008>
102ab6410: d001f200    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab6414: 9113d800    	add	x0, x0, #0x4f6
102ab6418: b000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab641c: 91334842    	add	x2, x2, #0xcd2
102ab6420: b000eb63    	adrp	x3, 0x104823000 <dyld_stub_binder+0x104823000>
102ab6424: 91336463    	add	x3, x3, #0xcd9
102ab6428: 528000e1    	mov	w1, #0x7                ; =7
102ab642c: 52800064    	mov	w4, #0x3                ; =3
102ab6430: 52800fa5    	mov	w5, #0x7d               ; =125
102ab6434: 9465de67    	bl	0x10442ddd0 <dyld_stub_binder+0x10442ddd0>
102ab6438: 52800028    	mov	w8, #0x1                ; =1
102ab643c: 3913d668    	strb	w8, [x19, #0x4f5]
102ab6440: d001f213    	adrp	x19, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab6444: 3953f668    	ldrb	w8, [x19, #0x4fd]
102ab6448: 370001a8    	tbnz	w8, #0x0, 0x102ab647c <_CMa03SUie28mjv+0x51044>
102ab644c: d001f200    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab6450: 9113f800    	add	x0, x0, #0x4fe
102ab6454: b000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab6458: 91337042    	add	x2, x2, #0xcdc
102ab645c: f000eb63    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102ab6460: 91265063    	add	x3, x3, #0x994
102ab6464: 52800061    	mov	w1, #0x3                ; =3
102ab6468: 52800084    	mov	w4, #0x4                ; =4
102ab646c: 528012e5    	mov	w5, #0x97               ; =151
102ab6470: 9465de5b    	bl	0x10442dddc <dyld_stub_binder+0x10442dddc>
102ab6474: 52800028    	mov	w8, #0x1                ; =1
102ab6478: 3913f668    	strb	w8, [x19, #0x4fd]
102ab647c: d001f213    	adrp	x19, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab6480: 39540668    	ldrb	w8, [x19, #0x501]
102ab6484: 370001a8    	tbnz	w8, #0x0, 0x102ab64b8 <_CMa03SUie28mjv+0x51080>
102ab6488: d001f200    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab648c: 91140800    	add	x0, x0, #0x502
102ab6490: b000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab6494: 91337c42    	add	x2, x2, #0xcdf
102ab6498: f000eb63    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102ab649c: 91266063    	add	x3, x3, #0x998
102ab64a0: 528001c1    	mov	w1, #0xe                ; =14
102ab64a4: 52800084    	mov	w4, #0x4                ; =4
102ab64a8: 52800f25    	mov	w5, #0x79               ; =121
102ab64ac: 9465de49    	bl	0x10442ddd0 <dyld_stub_binder+0x10442ddd0>
102ab64b0: 52800028    	mov	w8, #0x1                ; =1
102ab64b4: 39140668    	strb	w8, [x19, #0x501]
102ab64b8: d001f21b    	adrp	x27, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab64bc: b9454768    	ldr	w8, [x27, #0x544]
102ab64c0: 11002509    	add	w9, w8, #0x9
102ab64c4: b9054769    	str	w9, [x27, #0x544]
102ab64c8: 12001d08    	and	w8, w8, #0xff
102ab64cc: 11000509    	add	w9, w8, #0x1
102ab64d0: 1100090a    	add	w10, w8, #0x2
102ab64d4: 1b087d28    	mul	w8, w9, w8
102ab64d8: 1b0a7d08    	mul	w8, w8, w10
102ab64dc: 52955569    	mov	w9, #0xaaab             ; =43691
102ab64e0: 72b55549    	movk	w9, #0xaaaa, lsl #16
102ab64e4: 1b097d08    	mul	w8, w8, w9
102ab64e8: 3200f3e9    	mov	w9, #0x55555555         ; =1431655765
102ab64ec: 6b09011f    	cmp	w8, w9
102ab64f0: 54000088    	b.hi	0x102ab6500 <_CMa03SUie28mjv+0x510c8>
102ab64f4: aa1403e0    	mov	x0, x20
102ab64f8: 9465ecf4    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102ab64fc: b4001dc0    	cbz	x0, 0x102ab68b4 <_CMa03SUie28mjv+0x5147c>
102ab6500: 97ff91ab    	bl	0x102a9abac <_CMa03SUie28mjv+0x35774>
102ab6504: f90013e0    	str	x0, [sp, #0x20]
102ab6508: 4f00e400    	movi.16b	v0, #0x0
102ab650c: ad0403e0    	stp	q0, q0, [sp, #0x80]
102ab6510: ad0503e0    	stp	q0, q0, [sp, #0xa0]
102ab6514: aa1403e0    	mov	x0, x20
102ab6518: 9465ecec    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102ab651c: aa0003f6    	mov	x22, x0
102ab6520: b001bb28    	adrp	x8, 0x10621b000 <dyld_stub_binder+0x10621b000>
102ab6524: f943a901    	ldr	x1, [x8, #0x750] ; selector: countByEnumeratingWithState:objects:count:
102ab6528: 910203e2    	add	x2, sp, #0x80
102ab652c: 910303e3    	add	x3, sp, #0xc0
102ab6530: f9000fe1    	str	x1, [sp, #0x18]
102ab6534: 52800204    	mov	w4, #0x10               ; =16
102ab6538: 9465ecc3    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab653c: b4001960    	cbz	x0, 0x102ab6868 <_CMa03SUie28mjv+0x51430>
102ab6540: aa0003f9    	mov	x25, x0
102ab6544: f9000bf4    	str	x20, [sp, #0x10]
102ab6548: d001f217    	adrp	x23, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab654c: 91140af7    	add	x23, x23, #0x502
102ab6550: f9404be8    	ldr	x8, [sp, #0x90]
102ab6554: 900153e9    	adrp	x9, 0x105532000 <dyld_stub_binder+0x105532000>
102ab6558: f9400108    	ldr	x8, [x8]
102ab655c: f90037e8    	str	x8, [sp, #0x68]
102ab6560: f944a13f    	ldr	xzr, [x9, #0x940]
102ab6564: b001bff8    	adrp	x24, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
102ab6568: f9001ff6    	str	x22, [sp, #0x38]
102ab656c: d280001c    	mov	x28, #0x0               ; =0
102ab6570: b001bd08    	adrp	x8, 0x106257000 <dyld_stub_binder+0x106257000>
102ab6574: f941d508    	ldr	x8, [x8, #0x3a8] ; selector: objectForKey:
102ab6578: f9003be8    	str	x8, [sp, #0x70]
102ab657c: f001bae8    	adrp	x8, 0x106215000 <dyld_stub_binder+0x106215000>
102ab6580: f9404108    	ldr	x8, [x8, #0x80] ; selector: class
102ab6584: f9002fe8    	str	x8, [sp, #0x58]
102ab6588: f001bc68    	adrp	x8, 0x106245000 <dyld_stub_binder+0x106245000>
102ab658c: f947a108    	ldr	x8, [x8, #0xf40] ; selector: isKindOfClass:
102ab6590: f9002be8    	str	x8, [sp, #0x50]
102ab6594: b001bfa8    	adrp	x8, 0x1062ab000 <dyld_stub_binder+0x1062ab000>
102ab6598: f947c108    	ldr	x8, [x8, #0xf80] ; selector: uppercaseString
102ab659c: a902e7e8    	stp	x8, x25, [sp, #0x28]
102ab65a0: d001bac8    	adrp	x8, 0x106210000 <dyld_stub_binder+0x106210000>
102ab65a4: f9421108    	ldr	x8, [x8, #0x420] ; selector: cStringUsingEncoding:
102ab65a8: f90027e8    	str	x8, [sp, #0x48]
102ab65ac: d001bf48    	adrp	x8, 0x1062a0000 <dyld_stub_binder+0x1062a0000>
102ab65b0: f946711a    	ldr	x26, [x8, #0xce0] ; selector: stringWithFormat:
102ab65b4: b001bca8    	adrp	x8, 0x10624b000 <dyld_stub_binder+0x10624b000>
102ab65b8: f944e908    	ldr	x8, [x8, #0x9d0] ; selector: length
102ab65bc: f90023e8    	str	x8, [sp, #0x40]
102ab65c0: f90033fa    	str	x26, [sp, #0x60]
102ab65c4: f9404be8    	ldr	x8, [sp, #0x90]
102ab65c8: f9400108    	ldr	x8, [x8]
102ab65cc: f94037e9    	ldr	x9, [sp, #0x68]
102ab65d0: eb09011f    	cmp	x8, x9
102ab65d4: 54000081    	b.ne	0x102ab65e4 <_CMa03SUie28mjv+0x511ac>
102ab65d8: 900153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab65dc: f944b11f    	ldr	xzr, [x8, #0x960]
102ab65e0: 14000005    	b	0x102ab65f4 <_CMa03SUie28mjv+0x511bc>
102ab65e4: 900153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab65e8: f944b51f    	ldr	xzr, [x8, #0x968]
102ab65ec: aa1603e0    	mov	x0, x22
102ab65f0: 9465ec6e    	bl	0x1044317a8 <dyld_stub_binder+0x1044317a8>
102ab65f4: f94047e8    	ldr	x8, [sp, #0x88]
102ab65f8: f87c7913    	ldr	x19, [x8, x28, lsl #3]
102ab65fc: aa1603e0    	mov	x0, x22
102ab6600: f9403be1    	ldr	x1, [sp, #0x70]
102ab6604: aa1303e2    	mov	x2, x19
102ab6608: 9465ec8f    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab660c: aa1d03fd    	mov	x29, x29
102ab6610: 9465ecb7    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab6614: aa0003f5    	mov	x21, x0
102ab6618: b4000920    	cbz	x0, 0x102ab673c <_CMa03SUie28mjv+0x51304>
102ab661c: f942ab00    	ldr	x0, [x24, #0x550]
102ab6620: f9402fe1    	ldr	x1, [sp, #0x58]
102ab6624: 9465ec88    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab6628: aa0003e2    	mov	x2, x0
102ab662c: aa1503e0    	mov	x0, x21
102ab6630: f9402be1    	ldr	x1, [sp, #0x50]
102ab6634: 9465ec84    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab6638: b9454768    	ldr	w8, [x27, #0x544]
102ab663c: 11001508    	add	w8, w8, #0x5
102ab6640: b9054768    	str	w8, [x27, #0x544]
102ab6644: 52801b88    	mov	w8, #0xdc               ; =220
102ab6648: b9007be8    	str	w8, [sp, #0x78]
102ab664c: 9101f3ea    	add	x10, sp, #0x7c
102ab6650: 9101e3eb    	add	x11, sp, #0x78
102ab6654: 10000038    	adr	x24, 0x102ab6658 <_CMa03SUie28mjv+0x51220>
102ab6658: 98000129    	ldrsw	x9, 0x102ab667c <_CMa03SUie28mjv+0x51244>
102ab665c: d2801682    	mov	x2, #0xb4               ; =180
102ab6660: ca020129    	eor	x9, x9, x2
102ab6664: b9800174    	ldrsw	x20, [x11]
102ab6668: cb140129    	sub	x9, x9, x20
102ab666c: 8b090318    	add	x24, x24, x9
102ab6670: 528006c8    	mov	w8, #0x36               ; =54
102ab6674: b9000148    	str	w8, [x10]
102ab6678: d61f0300    	br	x24
102ab667c: 000001a0    	udf	#0x1a0
102ab6680: f662609e    	<unknown>
102ab6684: 48f86e3e    	<unknown>
102ab6688: d35413be    	ubfiz	x30, x29, #44, #5
102ab668c: ebf7a322    	<unknown>
102ab6690: b001bff8    	adrp	x24, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
102ab6694: 34000540    	cbz	w0, 0x102ab673c <_CMa03SUie28mjv+0x51304>
102ab6698: aa1603fa    	mov	x26, x22
102ab669c: aa1703f6    	mov	x22, x23
102ab66a0: aa1b03f9    	mov	x25, x27
102ab66a4: aa1303e0    	mov	x0, x19
102ab66a8: f94017e1    	ldr	x1, [sp, #0x28]
102ab66ac: 9465ec66    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab66b0: aa1d03fd    	mov	x29, x29
102ab66b4: 9465ec8e    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab66b8: aa0003f3    	mov	x19, x0
102ab66bc: aa1503e0    	mov	x0, x21
102ab66c0: 9465ec85    	bl	0x1044318d4 <dyld_stub_binder+0x1044318d4>
102ab66c4: f94027e1    	ldr	x1, [sp, #0x48]
102ab66c8: 52800082    	mov	w2, #0x4                ; =4
102ab66cc: 9465ec5e    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab66d0: aa0003f4    	mov	x20, x0
102ab66d4: 97feefc2    	bl	0x102a725dc <_CMa03SUie28mjv+0xd1a4>
102ab66d8: aa0003f8    	mov	x24, x0
102ab66dc: b4000080    	cbz	x0, 0x102ab66ec <_CMa03SUie28mjv+0x512b4>
102ab66e0: aa1803e0    	mov	x0, x24
102ab66e4: aa1403e1    	mov	x1, x20
102ab66e8: 97feefa2    	bl	0x102a72570 <_CMa03SUie28mjv+0xd138>
102ab66ec: f94013f7    	ldr	x23, [sp, #0x20]
102ab66f0: f94026fb    	ldr	x27, [x23, #0x48]
102ab66f4: aa1303e0    	mov	x0, x19
102ab66f8: 9465ec77    	bl	0x1044318d4 <dyld_stub_binder+0x1044318d4>
102ab66fc: aa0003f4    	mov	x20, x0
102ab6700: f94027e1    	ldr	x1, [sp, #0x48]
102ab6704: 52800082    	mov	w2, #0x4                ; =4
102ab6708: 9465ec4f    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab670c: aa0003e1    	mov	x1, x0
102ab6710: aa1703e0    	mov	x0, x23
102ab6714: aa1803e2    	mov	x2, x24
102ab6718: 52800003    	mov	w3, #0x0                ; =0
102ab671c: d63f0360    	blr	x27
102ab6720: aa1903fb    	mov	x27, x25
102ab6724: aa1603f7    	mov	x23, x22
102ab6728: aa1a03f6    	mov	x22, x26
102ab672c: f9401bf9    	ldr	x25, [sp, #0x30]
102ab6730: b001bff8    	adrp	x24, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
102ab6734: f94033fa    	ldr	x26, [sp, #0x60]
102ab6738: 14000037    	b	0x102ab6814 <_CMa03SUie28mjv+0x513dc>
102ab673c: f942ab00    	ldr	x0, [x24, #0x550]
102ab6740: f90003f7    	str	x23, [sp]
102ab6744: aa1a03e1    	mov	x1, x26
102ab6748: 900164c2    	adrp	x2, 0x10574e000 <dyld_stub_binder+0x10574e000>
102ab674c: 912de042    	add	x2, x2, #0xb78
102ab6750: 9465ec3d    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab6754: aa1d03fd    	mov	x29, x29
102ab6758: 9465ec65    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab675c: aa0003f4    	mov	x20, x0
102ab6760: b40005a0    	cbz	x0, 0x102ab6814 <_CMa03SUie28mjv+0x513dc>
102ab6764: aa1903f6    	mov	x22, x25
102ab6768: aa1b03f9    	mov	x25, x27
102ab676c: aa1703fb    	mov	x27, x23
102ab6770: f942ab00    	ldr	x0, [x24, #0x550]
102ab6774: 52804b28    	mov	w8, #0x259              ; =601
102ab6778: f90003e8    	str	x8, [sp]
102ab677c: aa1a03e1    	mov	x1, x26
102ab6780: aa1403e2    	mov	x2, x20
102ab6784: 9465ec30    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab6788: aa1d03fd    	mov	x29, x29
102ab678c: 9465ec58    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab6790: aa0003f3    	mov	x19, x0
102ab6794: 900164d7    	adrp	x23, 0x10574e000 <dyld_stub_binder+0x10574e000>
102ab6798: 912f62f7    	add	x23, x23, #0xbd8
102ab679c: aa1703e0    	mov	x0, x23
102ab67a0: f94023e1    	ldr	x1, [sp, #0x40]
102ab67a4: 9465ec28    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab67a8: b40001c0    	cbz	x0, 0x102ab67e0 <_CMa03SUie28mjv+0x513a8>
102ab67ac: f942ab00    	ldr	x0, [x24, #0x550]
102ab67b0: a9005ff3    	stp	x19, x23, [sp]
102ab67b4: aa1a03e1    	mov	x1, x26
102ab67b8: 900164c2    	adrp	x2, 0x10574e000 <dyld_stub_binder+0x10574e000>
102ab67bc: 912e6042    	add	x2, x2, #0xb98
102ab67c0: 9465ec21    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab67c4: aa1d03fd    	mov	x29, x29
102ab67c8: 9465ec49    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab67cc: aa0003f8    	mov	x24, x0
102ab67d0: aa1303e0    	mov	x0, x19
102ab67d4: 9465ec37    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab67d8: aa1803f3    	mov	x19, x24
102ab67dc: b001bff8    	adrp	x24, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
102ab67e0: f90003f3    	str	x19, [sp]
102ab67e4: 900164c0    	adrp	x0, 0x10574e000 <dyld_stub_binder+0x10574e000>
102ab67e8: 912ee000    	add	x0, x0, #0xbb8
102ab67ec: 9465ded5    	bl	0x10442e340 <dyld_stub_binder+0x10442e340>
102ab67f0: aa1303e0    	mov	x0, x19
102ab67f4: 9465ec2f    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab67f8: 900153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab67fc: f944a51f    	ldr	xzr, [x8, #0x948]
102ab6800: aa1b03f7    	mov	x23, x27
102ab6804: aa1903fb    	mov	x27, x25
102ab6808: f94033fa    	ldr	x26, [sp, #0x60]
102ab680c: aa1603f9    	mov	x25, x22
102ab6810: f9401ff6    	ldr	x22, [sp, #0x38]
102ab6814: aa1403e0    	mov	x0, x20
102ab6818: 9465ec26    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab681c: aa1503e0    	mov	x0, x21
102ab6820: 9465ec24    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab6824: 9100079c    	add	x28, x28, #0x1
102ab6828: eb19039f    	cmp	x28, x25
102ab682c: 54ffecc3    	b.lo	0x102ab65c4 <_CMa03SUie28mjv+0x5118c>
102ab6830: 910203e2    	add	x2, sp, #0x80
102ab6834: 910303e3    	add	x3, sp, #0xc0
102ab6838: aa1603e0    	mov	x0, x22
102ab683c: f9400fe1    	ldr	x1, [sp, #0x18]
102ab6840: 52800204    	mov	w4, #0x10               ; =16
102ab6844: 9465ec00    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab6848: b40000a0    	cbz	x0, 0x102ab685c <_CMa03SUie28mjv+0x51424>
102ab684c: aa0003f9    	mov	x25, x0
102ab6850: 900153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab6854: f944ad1f    	ldr	xzr, [x8, #0x958]
102ab6858: 17ffff45    	b	0x102ab656c <_CMa03SUie28mjv+0x51134>
102ab685c: 900153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab6860: f944a91f    	ldr	xzr, [x8, #0x950]
102ab6864: f9400bf4    	ldr	x20, [sp, #0x10]
102ab6868: aa1603e0    	mov	x0, x22
102ab686c: 9465ec11    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab6870: aa1403e0    	mov	x0, x20
102ab6874: 9465ec0f    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab6878: f85a03a8    	ldur	x8, [x29, #-0x60]
102ab687c: b0014829    	adrp	x9, 0x1053bb000 <dyld_stub_binder+0x1053bb000>
102ab6880: f9438d29    	ldr	x9, [x9, #0x718]
102ab6884: f9400129    	ldr	x9, [x9]
102ab6888: eb08013f    	cmp	x9, x8
102ab688c: 54000181    	b.ne	0x102ab68bc <_CMa03SUie28mjv+0x51484>
102ab6890: f94013e0    	ldr	x0, [sp, #0x20]
102ab6894: a95a7bfd    	ldp	x29, x30, [sp, #0x1a0]
102ab6898: a9594ff4    	ldp	x20, x19, [sp, #0x190]
102ab689c: a95857f6    	ldp	x22, x21, [sp, #0x180]
102ab68a0: a9575ff8    	ldp	x24, x23, [sp, #0x170]
102ab68a4: a95667fa    	ldp	x26, x25, [sp, #0x160]
102ab68a8: a9556ffc    	ldp	x28, x27, [sp, #0x150]
102ab68ac: 9106c3ff    	add	sp, sp, #0x1b0
102ab68b0: d65f03c0    	ret
102ab68b4: f90013ff    	str	xzr, [sp, #0x20]
102ab68b8: 17ffffee    	b	0x102ab6870 <_CMa03SUie28mjv+0x51438>
102ab68bc: 97bc3dd7    	bl	0x1019c6018 <__ZN5hmdBU10async_safe11linked_listI22hmdBU_async_dict_entryE4nextEPNS3_4nodeE+0x5168>
; SecurityGuardSecureSignature callCoreSignFunctionsWithArray:appKey:signType:mask:
102ab68c0: d10283ff    	sub	sp, sp, #0xa0
102ab68c4: a90567fa    	stp	x26, x25, [sp, #0x50]
102ab68c8: a9065ff8    	stp	x24, x23, [sp, #0x60]
102ab68cc: a90757f6    	stp	x22, x21, [sp, #0x70]
102ab68d0: a9084ff4    	stp	x20, x19, [sp, #0x80]
102ab68d4: a9097bfd    	stp	x29, x30, [sp, #0x90]
102ab68d8: 910243fd    	add	x29, sp, #0x90
102ab68dc: aa0503f4    	mov	x20, x5
102ab68e0: aa0403f5    	mov	x21, x4
102ab68e4: aa0303f3    	mov	x19, x3
102ab68e8: aa0203f7    	mov	x23, x2
102ab68ec: aa0003f6    	mov	x22, x0
102ab68f0: 528000a8    	mov	w8, #0x5                ; =5
102ab68f4: b9001fe8    	str	w8, [sp, #0x1c]
102ab68f8: 910083e8    	add	x8, sp, #0x20
102ab68fc: 910073e9    	add	x9, sp, #0x1c
102ab6900: 10000027    	adr	x7, 0x102ab6904 <_CMa03SUie28mjv+0x514cc>
102ab6904: 98000121    	ldrsw	x1, 0x102ab6928 <_CMa03SUie28mjv+0x514f0>
102ab6908: d100c821    	sub	x1, x1, #0x32
102ab690c: aa2103e1    	mvn	x1, x1
102ab6910: b980012c    	ldrsw	x12, [x9]
102ab6914: ca0c0021    	eor	x1, x1, x12
102ab6918: 8b0100e7    	add	x7, x7, x1
102ab691c: 5280154b    	mov	w11, #0xaa              ; =170
102ab6920: b900010b    	str	w11, [x8]
102ab6924: d61f00e0    	br	x7
102ab6928: 00000000    	udf	#0x0
102ab692c: ca64c65e    	eon	x30, x18, x4, lsr #49
102ab6930: 7ec4bacd    	<unknown>
102ab6934: 13a7261c    	<unknown>
102ab6938: b94023e8    	ldr	w8, [sp, #0x20]
102ab693c: d001f218    	adrp	x24, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab6940: 3953b309    	ldrb	w9, [x24, #0x4ec]
102ab6944: 7103c11f    	cmp	w8, #0xf0
102ab6948: 7a401924    	ccmp	w9, #0x0, #0x4, ne
102ab694c: 540001a1    	b.ne	0x102ab6980 <_CMa03SUie28mjv+0x51548>
102ab6950: d001f200    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab6954: 9113b400    	add	x0, x0, #0x4ed
102ab6958: f000eb62    	adrp	x2, 0x104825000 <dyld_stub_binder+0x104825000>
102ab695c: 912c0042    	add	x2, x2, #0xb00
102ab6960: b000eb63    	adrp	x3, 0x104823000 <dyld_stub_binder+0x104823000>
102ab6964: 91333063    	add	x3, x3, #0xccc
102ab6968: 52800081    	mov	w1, #0x4                ; =4
102ab696c: 52800064    	mov	w4, #0x3                ; =3
102ab6970: 528005a5    	mov	w5, #0x2d               ; =45
102ab6974: 9465dd1a    	bl	0x10442dddc <dyld_stub_binder+0x10442dddc>
102ab6978: 52800028    	mov	w8, #0x1                ; =1
102ab697c: 3913b308    	strb	w8, [x24, #0x4ec]
102ab6980: d001f218    	adrp	x24, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab6984: 3953c708    	ldrb	w8, [x24, #0x4f1]
102ab6988: 370001a8    	tbnz	w8, #0x0, 0x102ab69bc <_CMa03SUie28mjv+0x51584>
102ab698c: d001f200    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab6990: 9113c800    	add	x0, x0, #0x4f2
102ab6994: b000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab6998: 91333c42    	add	x2, x2, #0xccf
102ab699c: f000eb63    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102ab69a0: 91267063    	add	x3, x3, #0x99c
102ab69a4: 52800061    	mov	w1, #0x3                ; =3
102ab69a8: 52800084    	mov	w4, #0x4                ; =4
102ab69ac: 528006a5    	mov	w5, #0x35               ; =53
102ab69b0: 9465dd0b    	bl	0x10442dddc <dyld_stub_binder+0x10442dddc>
102ab69b4: 52800028    	mov	w8, #0x1                ; =1
102ab69b8: 3913c708    	strb	w8, [x24, #0x4f1]
102ab69bc: d001f218    	adrp	x24, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab69c0: 3953d708    	ldrb	w8, [x24, #0x4f5]
102ab69c4: 370001a8    	tbnz	w8, #0x0, 0x102ab69f8 <_CMa03SUie28mjv+0x515c0>
102ab69c8: d001f200    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab69cc: 9113d800    	add	x0, x0, #0x4f6
102ab69d0: b000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab69d4: 91334842    	add	x2, x2, #0xcd2
102ab69d8: b000eb63    	adrp	x3, 0x104823000 <dyld_stub_binder+0x104823000>
102ab69dc: 91336463    	add	x3, x3, #0xcd9
102ab69e0: 528000e1    	mov	w1, #0x7                ; =7
102ab69e4: 52800064    	mov	w4, #0x3                ; =3
102ab69e8: 52800fa5    	mov	w5, #0x7d               ; =125
102ab69ec: 9465dcf9    	bl	0x10442ddd0 <dyld_stub_binder+0x10442ddd0>
102ab69f0: 52800028    	mov	w8, #0x1                ; =1
102ab69f4: 3913d708    	strb	w8, [x24, #0x4f5]
102ab69f8: d001f218    	adrp	x24, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab69fc: 3953f708    	ldrb	w8, [x24, #0x4fd]
102ab6a00: 370001a8    	tbnz	w8, #0x0, 0x102ab6a34 <_CMa03SUie28mjv+0x515fc>
102ab6a04: d001f200    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab6a08: 9113f800    	add	x0, x0, #0x4fe
102ab6a0c: b000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab6a10: 91337042    	add	x2, x2, #0xcdc
102ab6a14: f000eb63    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102ab6a18: 91265063    	add	x3, x3, #0x994
102ab6a1c: 52800061    	mov	w1, #0x3                ; =3
102ab6a20: 52800084    	mov	w4, #0x4                ; =4
102ab6a24: 528012e5    	mov	w5, #0x97               ; =151
102ab6a28: 9465dced    	bl	0x10442dddc <dyld_stub_binder+0x10442dddc>
102ab6a2c: 52800028    	mov	w8, #0x1                ; =1
102ab6a30: 3913f708    	strb	w8, [x24, #0x4fd]
102ab6a34: d001f218    	adrp	x24, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab6a38: 39540708    	ldrb	w8, [x24, #0x501]
102ab6a3c: 370001a8    	tbnz	w8, #0x0, 0x102ab6a70 <_CMa03SUie28mjv+0x51638>
102ab6a40: d001f200    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab6a44: 91140800    	add	x0, x0, #0x502
102ab6a48: b000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab6a4c: 91337c42    	add	x2, x2, #0xcdf
102ab6a50: f000eb63    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102ab6a54: 91266063    	add	x3, x3, #0x998
102ab6a58: 528001c1    	mov	w1, #0xe                ; =14
102ab6a5c: 52800084    	mov	w4, #0x4                ; =4
102ab6a60: 52800f25    	mov	w5, #0x79               ; =121
102ab6a64: 9465dcdb    	bl	0x10442ddd0 <dyld_stub_binder+0x10442ddd0>
102ab6a68: 52800028    	mov	w8, #0x1                ; =1
102ab6a6c: 39140708    	strb	w8, [x24, #0x501]
102ab6a70: aa1703e0    	mov	x0, x23
102ab6a74: 9465eb95    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102ab6a78: aa0003f7    	mov	x23, x0
102ab6a7c: aa1303e0    	mov	x0, x19
102ab6a80: 9465eb92    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102ab6a84: aa0003f3    	mov	x19, x0
102ab6a88: aa1403e0    	mov	x0, x20
102ab6a8c: 9465eb8f    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102ab6a90: aa0003f4    	mov	x20, x0
102ab6a94: b001ba48    	adrp	x8, 0x1061ff000 <dyld_stub_binder+0x1061ff000>
102ab6a98: f9458901    	ldr	x1, [x8, #0xb10] ; selector: NSDictionary2HashMap:
102ab6a9c: aa1603e0    	mov	x0, x22
102ab6aa0: aa1703e2    	mov	x2, x23
102ab6aa4: 9465eb68    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab6aa8: aa0003f6    	mov	x22, x0
102ab6aac: aa1703e0    	mov	x0, x23
102ab6ab0: 9465eb80    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab6ab4: b4000236    	cbz	x22, 0x102ab6af8 <_CMa03SUie28mjv+0x516c0>
102ab6ab8: b9400ad8    	ldr	w24, [x22, #0x8]
102ab6abc: 340001b8    	cbz	w24, 0x102ab6af0 <_CMa03SUie28mjv+0x516b8>
102ab6ac0: 900153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab6ac4: f944c11f    	ldr	xzr, [x8, #0x980]
102ab6ac8: 710012bf    	cmp	w21, #0x4
102ab6acc: 540001e1    	b.ne	0x102ab6b08 <_CMa03SUie28mjv+0x516d0>
102ab6ad0: 71002f1f    	cmp	w24, #0xb
102ab6ad4: 540001a1    	b.ne	0x102ab6b08 <_CMa03SUie28mjv+0x516d0>
102ab6ad8: f94032c8    	ldr	x8, [x22, #0x60]
102ab6adc: d001f201    	adrp	x1, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab6ae0: 9113b421    	add	x1, x1, #0x4ed
102ab6ae4: aa1603e0    	mov	x0, x22
102ab6ae8: d63f0100    	blr	x8
102ab6aec: 1400001c    	b	0x102ab6b5c <_CMa03SUie28mjv+0x51724>
102ab6af0: 900153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab6af4: f944bd1f    	ldr	xzr, [x8, #0x978]
102ab6af8: aa1603e0    	mov	x0, x22
102ab6afc: 97ff9291    	bl	0x102a9b540 <_CMa03SUie28mjv+0x36108>
102ab6b00: d2800017    	mov	x23, #0x0               ; =0
102ab6b04: 1400009d    	b	0x102ab6d78 <_CMa03SUie28mjv+0x51940>
102ab6b08: 71003ebf    	cmp	w21, #0xf
102ab6b0c: 54000281    	b.ne	0x102ab6b5c <_CMa03SUie28mjv+0x51724>
102ab6b10: f94016c8    	ldr	x8, [x22, #0x28]
102ab6b14: d001f201    	adrp	x1, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab6b18: 9113b421    	add	x1, x1, #0x4ed
102ab6b1c: aa1603e0    	mov	x0, x22
102ab6b20: d63f0100    	blr	x8
102ab6b24: aa0003f7    	mov	x23, x0
102ab6b28: b5000160    	cbnz	x0, 0x102ab6b54 <_CMa03SUie28mjv+0x5171c>
102ab6b2c: f9402ad9    	ldr	x25, [x22, #0x50]
102ab6b30: 9000f380    	adrp	x0, 0x104926000 <dyld_stub_binder+0x104926000>
102ab6b34: 91378000    	add	x0, x0, #0xde0
102ab6b38: 940022c5    	bl	0x102abf64c <_CMa03SUie28mjv+0x5a214>
102ab6b3c: aa0003e2    	mov	x2, x0
102ab6b40: d001f201    	adrp	x1, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab6b44: 9113b421    	add	x1, x1, #0x4ed
102ab6b48: aa1603e0    	mov	x0, x22
102ab6b4c: 52800003    	mov	w3, #0x0                ; =0
102ab6b50: d63f0320    	blr	x25
102ab6b54: aa1703e0    	mov	x0, x23
102ab6b58: 940022ed    	bl	0x102abf70c <_CMa03SUie28mjv+0x5a2d4>
102ab6b5c: f90017f6    	str	x22, [sp, #0x28]
102ab6b60: d0015908    	adrp	x8, 0x1055d8000 <dyld_stub_binder+0x1055d8000>
102ab6b64: 9123e108    	add	x8, x8, #0x8f8
102ab6b68: f100027f    	cmp	x19, #0x0
102ab6b6c: 9a930100    	csel	x0, x8, x19, eq
102ab6b70: 9465eb59    	bl	0x1044318d4 <dyld_stub_binder+0x1044318d4>
102ab6b74: d001bac8    	adrp	x8, 0x106210000 <dyld_stub_binder+0x106210000>
102ab6b78: f9421117    	ldr	x23, [x8, #0x420] ; selector: cStringUsingEncoding:
102ab6b7c: aa1703e1    	mov	x1, x23
102ab6b80: 52800082    	mov	w2, #0x4                ; =4
102ab6b84: 9465eb30    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab6b88: f9001be0    	str	x0, [sp, #0x30]
102ab6b8c: aa1403e0    	mov	x0, x20
102ab6b90: 9465eb51    	bl	0x1044318d4 <dyld_stub_binder+0x1044318d4>
102ab6b94: aa1703e1    	mov	x1, x23
102ab6b98: 52800082    	mov	w2, #0x4                ; =4
102ab6b9c: 9465eb2a    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab6ba0: f9001fe0    	str	x0, [sp, #0x38]
102ab6ba4: 29087ff5    	stp	w21, wzr, [sp, #0x40]
102ab6ba8: 52800c68    	mov	w8, #0x63               ; =99
102ab6bac: b90027e8    	str	w8, [sp, #0x24]
102ab6bb0: 52800fc8    	mov	w8, #0x7e               ; =126
102ab6bb4: b81bc3a8    	stur	w8, [x29, #-0x44]
102ab6bb8: d10113a8    	sub	x8, x29, #0x44
102ab6bbc: 10000035    	adr	x21, 0x102ab6bc0 <_CMa03SUie28mjv+0x51788>
102ab6bc0: 980000d1    	ldrsw	x17, 0x102ab6bd8 <_CMa03SUie28mjv+0x517a0>
102ab6bc4: b9800117    	ldrsw	x23, [x8]
102ab6bc8: 8b170231    	add	x17, x17, x23
102ab6bcc: 8b1102b5    	add	x21, x21, x17
102ab6bd0: d2800e88    	mov	x8, #0x74               ; =116
102ab6bd4: d61f02a0    	br	x21
102ab6bd8: ffffffae    	<unknown>
102ab6bdc: d7219a21    	<unknown>
102ab6be0: 36396131    	tbz	w17, #0x7, 0x102ab9804 <_CMa03SUie28mjv+0x543cc>
102ab6be4: b20d3612    	orr	x18, x16, #0xfff80001fff80001
102ab6be8: 711cd648    	subs	w8, w18, #0x735
102ab6bec: 9001f208    	adrp	x8, 0x1068f6000 <dyld_stub_binder+0x1068f6000>
102ab6bf0: f943c508    	ldr	x8, [x8, #0x788]
102ab6bf4: 9100a3e1    	add	x1, sp, #0x28
102ab6bf8: 910093e2    	add	x2, sp, #0x24
102ab6bfc: 528539a0    	mov	w0, #0x29cd             ; =10701
102ab6c00: d63f0100    	blr	x8
102ab6c04: b4000200    	cbz	x0, 0x102ab6c44 <_CMa03SUie28mjv+0x5180c>
102ab6c08: aa0003f5    	mov	x21, x0
102ab6c0c: f9400008    	ldr	x8, [x0]
102ab6c10: b4000548    	cbz	x8, 0x102ab6cb8 <_CMa03SUie28mjv+0x51880>
102ab6c14: b001bfe8    	adrp	x8, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
102ab6c18: f942a900    	ldr	x0, [x8, #0x550]
102ab6c1c: 9465eab6    	bl	0x1044316f4 <dyld_stub_binder+0x1044316f4>
102ab6c20: f94002a2    	ldr	x2, [x21]
102ab6c24: 9001bc48    	adrp	x8, 0x10623e000 <dyld_stub_binder+0x10623e000>
102ab6c28: f942e501    	ldr	x1, [x8, #0x5c8] ; selector: initWithCString:encoding:
102ab6c2c: 52800083    	mov	w3, #0x4                ; =4
102ab6c30: 9465eb05    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab6c34: aa0003f7    	mov	x23, x0
102ab6c38: f94002a0    	ldr	x0, [x21]
102ab6c3c: 9465e739    	bl	0x104430920 <dyld_stub_binder+0x104430920>
102ab6c40: 1400001f    	b	0x102ab6cbc <_CMa03SUie28mjv+0x51884>
102ab6c44: 900153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab6c48: f944c51f    	ldr	xzr, [x8, #0x988]
102ab6c4c: b98027f9    	ldrsw	x25, [sp, #0x24]
102ab6c50: d001bf48    	adrp	x8, 0x1062a0000 <dyld_stub_binder+0x1062a0000>
102ab6c54: f9467117    	ldr	x23, [x8, #0xce0] ; selector: stringWithFormat:
102ab6c58: 52800308    	mov	w8, #0x18               ; =24
102ab6c5c: 33000308    	bfxil	w8, w24, #0, #1
102ab6c60: 51000508    	sub	w8, w8, #0x1
102ab6c64: 2a480508    	orr	w8, w8, w8, lsr #1
102ab6c68: 2a480908    	orr	w8, w8, w8, lsr #2
102ab6c6c: 2a481108    	orr	w8, w8, w8, lsr #4
102ab6c70: 2a482108    	orr	w8, w8, w8, lsr #8
102ab6c74: 2a884108    	orr	w8, w8, w8, asr #16
102ab6c78: 71007d1f    	cmp	w8, #0x1f
102ab6c7c: 54000261    	b.ne	0x102ab6cc8 <_CMa03SUie28mjv+0x51890>
102ab6c80: b001bfe8    	adrp	x8, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
102ab6c84: f942a900    	ldr	x0, [x8, #0x550]
102ab6c88: d001f208    	adrp	x8, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab6c8c: 91140908    	add	x8, x8, #0x502
102ab6c90: f90003e8    	str	x8, [sp]
102ab6c94: 900164c2    	adrp	x2, 0x10574e000 <dyld_stub_binder+0x10574e000>
102ab6c98: 912de042    	add	x2, x2, #0xb78
102ab6c9c: aa1703e1    	mov	x1, x23
102ab6ca0: 9465eae9    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab6ca4: aa1d03fd    	mov	x29, x29
102ab6ca8: 9465eb11    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab6cac: aa0003f5    	mov	x21, x0
102ab6cb0: b5000100    	cbnz	x0, 0x102ab6cd0 <_CMa03SUie28mjv+0x51898>
102ab6cb4: 1400002a    	b	0x102ab6d5c <_CMa03SUie28mjv+0x51924>
102ab6cb8: d2800017    	mov	x23, #0x0               ; =0
102ab6cbc: aa1503e0    	mov	x0, x21
102ab6cc0: 9465e718    	bl	0x104430920 <dyld_stub_binder+0x104430920>
102ab6cc4: 1400002b    	b	0x102ab6d70 <_CMa03SUie28mjv+0x51938>
102ab6cc8: 900153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab6ccc: f944b91f    	ldr	xzr, [x8, #0x970]
102ab6cd0: b001bffa    	adrp	x26, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
102ab6cd4: f942ab40    	ldr	x0, [x26, #0x550]
102ab6cd8: 91096328    	add	x8, x25, #0x258
102ab6cdc: f90003e8    	str	x8, [sp]
102ab6ce0: aa1703e1    	mov	x1, x23
102ab6ce4: aa1503e2    	mov	x2, x21
102ab6ce8: 9465ead7    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab6cec: aa1d03fd    	mov	x29, x29
102ab6cf0: 9465eaff    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab6cf4: aa0003f8    	mov	x24, x0
102ab6cf8: b001bca8    	adrp	x8, 0x10624b000 <dyld_stub_binder+0x10624b000>
102ab6cfc: f944e901    	ldr	x1, [x8, #0x9d0] ; selector: length
102ab6d00: d0015919    	adrp	x25, 0x1055d8000 <dyld_stub_binder+0x1055d8000>
102ab6d04: 9123e339    	add	x25, x25, #0x8f8
102ab6d08: aa1903e0    	mov	x0, x25
102ab6d0c: 9465eace    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab6d10: b40001a0    	cbz	x0, 0x102ab6d44 <_CMa03SUie28mjv+0x5190c>
102ab6d14: f942ab40    	ldr	x0, [x26, #0x550]
102ab6d18: a90067f8    	stp	x24, x25, [sp]
102ab6d1c: 900164c2    	adrp	x2, 0x10574e000 <dyld_stub_binder+0x10574e000>
102ab6d20: 912e6042    	add	x2, x2, #0xb98
102ab6d24: aa1703e1    	mov	x1, x23
102ab6d28: 9465eac7    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab6d2c: aa1d03fd    	mov	x29, x29
102ab6d30: 9465eaef    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab6d34: aa0003f7    	mov	x23, x0
102ab6d38: aa1803e0    	mov	x0, x24
102ab6d3c: 9465eadd    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab6d40: aa1703f8    	mov	x24, x23
102ab6d44: f90003f8    	str	x24, [sp]
102ab6d48: 900164c0    	adrp	x0, 0x10574e000 <dyld_stub_binder+0x10574e000>
102ab6d4c: 912ee000    	add	x0, x0, #0xbb8
102ab6d50: 9465dd7c    	bl	0x10442e340 <dyld_stub_binder+0x10442e340>
102ab6d54: aa1803e0    	mov	x0, x24
102ab6d58: 9465ead6    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab6d5c: aa1503e0    	mov	x0, x21
102ab6d60: 9465ead4    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab6d64: d2800017    	mov	x23, #0x0               ; =0
102ab6d68: 900153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab6d6c: f944c91f    	ldr	xzr, [x8, #0x990]
102ab6d70: aa1603e0    	mov	x0, x22
102ab6d74: 97ff91f3    	bl	0x102a9b540 <_CMa03SUie28mjv+0x36108>
102ab6d78: aa1403e0    	mov	x0, x20
102ab6d7c: 9465eacd    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab6d80: aa1303e0    	mov	x0, x19
102ab6d84: 9465eacb    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab6d88: aa1703e0    	mov	x0, x23
102ab6d8c: a9497bfd    	ldp	x29, x30, [sp, #0x90]
102ab6d90: a9484ff4    	ldp	x20, x19, [sp, #0x80]
102ab6d94: a94757f6    	ldp	x22, x21, [sp, #0x70]
102ab6d98: a9465ff8    	ldp	x24, x23, [sp, #0x60]
102ab6d9c: a94567fa    	ldp	x26, x25, [sp, #0x50]
102ab6da0: 910283ff    	add	sp, sp, #0xa0
102ab6da4: 1465ea69    	b	0x104431748 <dyld_stub_binder+0x104431748>
102ab6da8: d101c3ff    	sub	sp, sp, #0x70
102ab6dac: a9036ffc    	stp	x28, x27, [sp, #0x30]
102ab6db0: a90457f6    	stp	x22, x21, [sp, #0x40]
102ab6db4: a9054ff4    	stp	x20, x19, [sp, #0x50]
102ab6db8: a9067bfd    	stp	x29, x30, [sp, #0x60]
102ab6dbc: 910183fd    	add	x29, sp, #0x60
102ab6dc0: b0014828    	adrp	x8, 0x1053bb000 <dyld_stub_binder+0x1053bb000>
102ab6dc4: f9438d08    	ldr	x8, [x8, #0x718]
102ab6dc8: f9400108    	ldr	x8, [x8]
102ab6dcc: f90017e8    	str	x8, [sp, #0x28]
102ab6dd0: 52801268    	mov	w8, #0x93               ; =147
102ab6dd4: b90007e8    	str	w8, [sp, #0x4]
102ab6dd8: 910013e8    	add	x8, sp, #0x4
102ab6ddc: 10000025    	adr	x5, 0x102ab6de0 <_CMa03SUie28mjv+0x519a8>
102ab6de0: 980000cd    	ldrsw	x13, 0x102ab6df8 <_CMa03SUie28mjv+0x519c0>
102ab6de4: b980011b    	ldrsw	x27, [x8]
102ab6de8: cb1b01ad    	sub	x13, x13, x27
102ab6dec: 8b0d00a5    	add	x5, x5, x13
102ab6df0: d28013e8    	mov	x8, #0x9f               ; =159
102ab6df4: d61f00a0    	br	x5
102ab6df8: 000000bf    	udf	#0xbf
102ab6dfc: 2be47d30    	<unknown>
102ab6e00: 78a0fc92    	<unknown>
102ab6e04: 079a712b    	<unknown>
102ab6e08: 028972d1    	<unknown>
102ab6e0c: d001f213    	adrp	x19, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab6e10: 39552269    	ldrb	w9, [x19, #0x548]
102ab6e14: 7102a11f    	cmp	w8, #0xa8
102ab6e18: 7a40d924    	ccmp	w9, #0x0, #0x4, le
102ab6e1c: 540001a1    	b.ne	0x102ab6e50 <_CMa03SUie28mjv+0x51a18>
