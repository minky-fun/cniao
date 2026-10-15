
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102a8f424: a9ba6ffc    	stp	x28, x27, [sp, #-0x60]!
102a8f428: a90167fa    	stp	x26, x25, [sp, #0x10]
102a8f42c: a9025ff8    	stp	x24, x23, [sp, #0x20]
102a8f430: a90357f6    	stp	x22, x21, [sp, #0x30]
102a8f434: a9044ff4    	stp	x20, x19, [sp, #0x40]
102a8f438: a9057bfd    	stp	x29, x30, [sp, #0x50]
102a8f43c: 910143fd    	add	x29, sp, #0x50
102a8f440: d13ec3ff    	sub	sp, sp, #0xfb0
102a8f444: aa0003f3    	mov	x19, x0
102a8f448: 90014968    	adrp	x8, 0x1053bb000 <dyld_stub_binder+0x1053bb000>
102a8f44c: f9438d08    	ldr	x8, [x8, #0x718]
102a8f450: f9400108    	ldr	x8, [x8]
102a8f454: f81a83a8    	stur	x8, [x29, #-0x58]
102a8f458: 528004a8    	mov	w8, #0x25               ; =37
102a8f45c: b9000fe8    	str	w8, [sp, #0xc]
102a8f460: 910043e8    	add	x8, sp, #0x10
102a8f464: 910033e9    	add	x9, sp, #0xc
102a8f468: 10000036    	adr	x22, 0x102a8f46c <_CMa03SUie28mjv+0x2a034>
102a8f46c: 98000107    	ldrsw	x7, 0x102a8f48c <_CMa03SUie28mjv+0x2a054>
102a8f470: 910288e7    	add	x7, x7, #0xa2
102a8f474: b980013a    	ldrsw	x26, [x9]
102a8f478: 8b1a00e7    	add	x7, x7, x26
102a8f47c: 8b0702d6    	add	x22, x22, x7
102a8f480: 52801038    	mov	w24, #0x81              ; =129
102a8f484: b9000118    	str	w24, [x8]
102a8f488: d61f02c0    	br	x22
102a8f48c: ffffff6d    	<unknown>
102a8f490: 9bd7d381    	<unknown>
102a8f494: a53b8a75    	ld3q	{ z21.q - z23.q }, p2/z, [x19, x27, lsl #4]
102a8f498: e2968945    	<unknown>
102a8f49c: db7b97b2    	<unknown>
102a8f4a0: 9001f354    	adrp	x20, 0x1068f7000 <dyld_stub_binder+0x1068f7000>
102a8f4a4: 3953ba88    	ldrb	w8, [x20, #0x4ee]
102a8f4a8: 370001a8    	tbnz	w8, #0x0, 0x102a8f4dc <_CMa03SUie28mjv+0x2a0a4>
102a8f4ac: 9001f340    	adrp	x0, 0x1068f7000 <dyld_stub_binder+0x1068f7000>


Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102a91b4c: f00154e1    	adrp	x1, 0x105530000 <dyld_stub_binder+0x105530000>
102a91b50: 910b6021    	add	x1, x1, #0x2d8
102a91b54: 9100c3f4    	add	x20, sp, #0x30
102a91b58: 9100c3e0    	add	x0, sp, #0x30
102a91b5c: 5281ef02    	mov	w2, #0xf78              ; =3960
102a91b60: 94667e3a    	bl	0x104431448 <dyld_stub_binder+0x104431448>
102a91b64: 528014a8    	mov	w8, #0xa5               ; =165
102a91b68: a901a3f4    	stp	x20, x8, [sp, #0x18]
102a91b6c: f90017ff    	str	xzr, [sp, #0x28]
102a91b70: b90017e8    	str	w8, [sp, #0x14]
102a91b74: 910053e8    	add	x8, sp, #0x14
102a91b78: 10000025    	adr	x5, 0x102a91b7c <_CMa03SUie28mjv+0x2c744>
102a91b7c: 980000cd    	ldrsw	x13, 0x102a91b94 <_CMa03SUie28mjv+0x2c75c>
102a91b80: b980011b    	ldrsw	x27, [x8]
102a91b84: cb1b01ad    	sub	x13, x13, x27
102a91b88: 8b0d00a5    	add	x5, x5, x13
102a91b8c: d28013e8    	mov	x8, #0x9f               ; =159
102a91b90: d61f00a0    	br	x5
102a91b94: 000000d1    	udf	#0xd1
102a91b98: 2be47d30    	<unknown>
102a91b9c: 78a0fc92    	<unknown>
102a91ba0: 079a712b    	<unknown>
102a91ba4: 028972d1    	<unknown>
102a91ba8: 9001f328    	adrp	x8, 0x1068f5000 <dyld_stub_binder+0x1068f5000>
102a91bac: f9472108    	ldr	x8, [x8, #0xe40]
102a91bb0: b98013e9    	ldrsw	x9, [sp, #0x10]
102a91bb4: 5280102a    	mov	w10, #0x81              ; =129
102a91bb8: ca0a0129    	eor	x9, x9, x10
102a91bbc: 8b091508    	add	x8, x8, x9, lsl #5
102a91bc0: f9400508    	ldr	x8, [x8, #0x8]
102a91bc4: 910063e3    	add	x3, sp, #0x18
102a91bc8: 52800020    	mov	w0, #0x1                ; =1
102a91bcc: 52800481    	mov	w1, #0x24               ; =36
102a91bd0: 528000c2    	mov	w2, #0x6                ; =6
102a91bd4: aa1303e4    	mov	x4, x19
102a91bd8: d63f0100    	blr	x8
102a91bdc: f85a83a8    	ldur	x8, [x29, #-0x58]
102a91be0: d0014949    	adrp	x9, 0x1053bb000 <dyld_stub_binder+0x1053bb000>
102a91be4: f9438d29    	ldr	x9, [x9, #0x718]
102a91be8: f9400129    	ldr	x9, [x9]
102a91bec: eb08013f    	cmp	x9, x8
102a91bf0: 54000141    	b.ne	0x102a91c18 <_CMa03SUie28mjv+0x2c7e0>
102a91bf4: 52800000    	mov	w0, #0x0                ; =0
102a91bf8: 913ec3ff    	add	sp, sp, #0xfb0
102a91bfc: a9457bfd    	ldp	x29, x30, [sp, #0x50]
102a91c00: a9444ff4    	ldp	x20, x19, [sp, #0x40]
102a91c04: a94357f6    	ldp	x22, x21, [sp, #0x30]
102a91c08: a9425ff8    	ldp	x24, x23, [sp, #0x20]
102a91c0c: a94167fa    	ldp	x26, x25, [sp, #0x10]
102a91c10: a8c66ffc    	ldp	x28, x27, [sp], #0x60
102a91c14: d65f03c0    	ret
102a91c18: 97bcd100    	bl	0x1019c6018 <__ZN5hmdBU10async_safe11linked_listI22hmdBU_async_dict_entryE4nextEPNS3_4nodeE+0x5168>


Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102a73a88: d10103ff    	sub	sp, sp, #0x40
102a73a8c: a90157f6    	stp	x22, x21, [sp, #0x10]
102a73a90: a9024ff4    	stp	x20, x19, [sp, #0x20]
102a73a94: a9037bfd    	stp	x29, x30, [sp, #0x30]
102a73a98: 9100c3fd    	add	x29, sp, #0x30
102a73a9c: aa0103f3    	mov	x19, x1
102a73aa0: aa0003f4    	mov	x20, x0
102a73aa4: 528007c8    	mov	w8, #0x3e               ; =62
102a73aa8: b9000be8    	str	w8, [sp, #0x8]
102a73aac: 910033e8    	add	x8, sp, #0xc
102a73ab0: 910023e9    	add	x9, sp, #0x8
102a73ab4: 10000024    	adr	x4, 0x102a73ab8 <_CMa03SUie28mjv+0xe680>
102a73ab8: 98000162    	ldrsw	x2, 0x102a73ae4 <_CMa03SUie28mjv+0xe6ac>
102a73abc: d1015042    	sub	x2, x2, #0x54
102a73ac0: d1018c42    	sub	x2, x2, #0x63
102a73ac4: d2800f56    	mov	x22, #0x7a              ; =122
102a73ac8: ca160042    	eor	x2, x2, x22
102a73acc: b9800130    	ldrsw	x16, [x9]
102a73ad0: 8b100042    	add	x2, x2, x16
102a73ad4: 8b020084    	add	x4, x4, x2
102a73ad8: 5280046f    	mov	w15, #0x23              ; =35
102a73adc: b900010f    	str	w15, [x8]
102a73ae0: d61f0080    	br	x4
102a73ae4: 0000012f    	udf	#0x12f
102a73ae8: 92a860e6    	mov	x6, #-0x43070001        ; =-1124532225
102a73aec: a506ab12    	ld1sh	{ z18.d }, p2/z, [x24, #0x6, mul vl]
102a73af0: 1f9c0c34    	<unknown>
102a73af4: 5a44bda6    	<unknown>
102a73af8: d001dfe0    	adrp	x0, 0x106671000 <_OBJC_EHTYPE_$_NSError+0x14dbd0>
102a73afc: 912ea000    	add	x0, x0, #0xba8
102a73b00: 9466f883    	bl	0x104431d0c <dyld_stub_binder+0x104431d0c>
102a73b04: b40000d4    	cbz	x20, 0x102a73b1c <_CMa03SUie28mjv+0xe6e4>
102a73b08: f9400280    	ldr	x0, [x20]
102a73b0c: b9400a81    	ldr	w1, [x20, #0x8]
102a73b10: f100001f    	cmp	x0, #0x0
102a73b14: 7a411828    	ccmp	w1, #0x1, #0x8, ne
102a73b18: 5400008a    	b.ge	0x102a73b28 <_CMa03SUie28mjv+0xe6f0>
102a73b1c: 52800020    	mov	w0, #0x1                ; =1
102a73b20: b5000093    	cbnz	x19, 0x102a73b30 <_CMa03SUie28mjv+0xe6f8>
102a73b24: 14000005    	b	0x102a73b38 <_CMa03SUie28mjv+0xe700>
102a73b28: 97ff830d    	bl	0x102a5475c <_uP0zKbWVU9+0x3304>
102a73b2c: b4000073    	cbz	x19, 0x102a73b38 <_CMa03SUie28mjv+0xe700>
102a73b30: 34000040    	cbz	w0, 0x102a73b38 <_CMa03SUie28mjv+0xe700>
102a73b34: b9000260    	str	w0, [x19]
102a73b38: d001dfe0    	adrp	x0, 0x106671000 <_OBJC_EHTYPE_$_NSError+0x14dbd0>
102a73b3c: 912ea000    	add	x0, x0, #0xba8
102a73b40: a9437bfd    	ldp	x29, x30, [sp, #0x30]
102a73b44: a9424ff4    	ldp	x20, x19, [sp, #0x20]
102a73b48: a94157f6    	ldp	x22, x21, [sp, #0x10]
102a73b4c: 910103ff    	add	sp, sp, #0x40
102a73b50: 1466f875    	b	0x104431d24 <dyld_stub_binder+0x104431d24>


Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a51458 <_uP0zKbWVU9>:
102a5475c: a9be4ff4    	stp	x20, x19, [sp, #-0x20]!
102a54760: a9017bfd    	stp	x29, x30, [sp, #0x10]
102a54764: 910043fd    	add	x29, sp, #0x10
102a54768: aa0103f3    	mov	x19, x1
102a5476c: aa0003f4    	mov	x20, x0
102a54770: 97fff35f    	bl	0x102a514ec <_uP0zKbWVU9+0x94>
102a54774: 340000c0    	cbz	w0, 0x102a5478c <_uP0zKbWVU9+0x3334>
102a54778: aa1403e0    	mov	x0, x20
102a5477c: aa1303e1    	mov	x1, x19
102a54780: a9417bfd    	ldp	x29, x30, [sp, #0x10]
102a54784: a8c24ff4    	ldp	x20, x19, [sp], #0x20
102a54788: 17ffffcf    	b	0x102a546c4 <_uP0zKbWVU9+0x326c>
102a5478c: 528000a0    	mov	w0, #0x5                ; =5
102a54790: a9417bfd    	ldp	x29, x30, [sp, #0x10]
102a54794: a8c24ff4    	ldp	x20, x19, [sp], #0x20
102a54798: d65f03c0    	ret
