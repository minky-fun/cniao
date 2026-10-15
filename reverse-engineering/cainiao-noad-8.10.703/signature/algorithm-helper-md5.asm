
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102aa3900: d10203ff    	sub	sp, sp, #0x80
102aa3904: a9046ffc    	stp	x28, x27, [sp, #0x40]
102aa3908: a9055ff8    	stp	x24, x23, [sp, #0x50]
102aa390c: a90657f6    	stp	x22, x21, [sp, #0x60]
102aa3910: a9077bfd    	stp	x29, x30, [sp, #0x70]
102aa3914: 9101c3fd    	add	x29, sp, #0x70
102aa3918: aa0103e9    	mov	x9, x1
102aa391c: 52800f28    	mov	w8, #0x79               ; =121
102aa3920: b9000be8    	str	w8, [sp, #0x8]
102aa3924: 910033ea    	add	x10, sp, #0xc
102aa3928: 910023eb    	add	x11, sp, #0x8
102aa392c: 10000024    	adr	x4, 0x102aa3930 <_CMa03SUie28mjv+0x3e4f8>
102aa3930: 98000182    	ldrsw	x2, 0x102aa3960 <_CMa03SUie28mjv+0x3e528>
102aa3934: d28005e3    	mov	x3, #0x2f               ; =47
102aa3938: ca030042    	eor	x2, x2, x3
102aa393c: 91033442    	add	x2, x2, #0xcd
102aa3940: d2801695    	mov	x21, #0xb4              ; =180
102aa3944: ca150042    	eor	x2, x2, x21
102aa3948: b9800168    	ldrsw	x8, [x11]
102aa394c: cb080042    	sub	x2, x2, x8
102aa3950: 8b020084    	add	x4, x4, x2
102aa3954: 52800477    	mov	w23, #0x23              ; =35
102aa3958: b9000157    	str	w23, [x10]
102aa395c: d61f0080    	br	x4
102aa3960: ffffff6f    	<unknown>
102aa3964: 3ef66260    	<unknown>
102aa3968: be48f86e    	<unknown>
102aa396c: 22d35413    	<unknown>
102aa3970: b9400fe8    	ldr	w8, [sp, #0xc]
102aa3974: 7100b91f    	cmp	w8, #0x2e
102aa3978: 5400008c    	b.gt	0x102aa3988 <_CMa03SUie28mjv+0x3e550>
102aa397c: d2800001    	mov	x1, #0x0                ; =0
102aa3980: b4000420    	cbz	x0, 0x102aa3a04 <_CMa03SUie28mjv+0x3e5cc>
102aa3984: b4000409    	cbz	x9, 0x102aa3a04 <_CMa03SUie28mjv+0x3e5cc>
102aa3988: 4f00e400    	movi.16b	v0, #0x0
102aa398c: ad0083e0    	stp	q0, q0, [sp, #0x10]
102aa3990: 528002c8    	mov	w8, #0x16               ; =22
102aa3994: b90017e8    	str	w8, [sp, #0x14]
102aa3998: f9001be0    	str	x0, [sp, #0x30]
102aa399c: 528014a8    	mov	w8, #0xa5               ; =165
102aa39a0: b81cc3a8    	stur	w8, [x29, #-0x34]
102aa39a4: d100d3a8    	sub	x8, x29, #0x34
102aa39a8: 10000025    	adr	x5, 0x102aa39ac <_CMa03SUie28mjv+0x3e574>
102aa39ac: 980000cd    	ldrsw	x13, 0x102aa39c4 <_CMa03SUie28mjv+0x3e58c>
102aa39b0: b980011b    	ldrsw	x27, [x8]
102aa39b4: cb1b01ad    	sub	x13, x13, x27
102aa39b8: 8b0d00a5    	add	x5, x5, x13
102aa39bc: d28013e8    	mov	x8, #0x9f               ; =159
102aa39c0: d61f00a0    	br	x5
102aa39c4: 000000d1    	udf	#0xd1
102aa39c8: 2be47d30    	<unknown>
102aa39cc: 78a0fc92    	<unknown>
102aa39d0: 079a712b    	<unknown>
102aa39d4: 028972d1    	<unknown>
102aa39d8: d001f288    	adrp	x8, 0x1068f5000 <dyld_stub_binder+0x1068f5000>
102aa39dc: f9472108    	ldr	x8, [x8, #0xe40]
102aa39e0: f9400908    	ldr	x8, [x8, #0x10]
102aa39e4: 910043e4    	add	x4, sp, #0x10
102aa39e8: 52800020    	mov	w0, #0x1                ; =1
102aa39ec: 52800041    	mov	w1, #0x2                ; =2
102aa39f0: 52800022    	mov	w2, #0x1                ; =1
102aa39f4: 52800003    	mov	w3, #0x0                ; =0
102aa39f8: aa0903e5    	mov	x5, x9
102aa39fc: d63f0100    	blr	x8
102aa3a00: aa0003e1    	mov	x1, x0
102aa3a04: aa0103e0    	mov	x0, x1
102aa3a08: a9477bfd    	ldp	x29, x30, [sp, #0x70]
102aa3a0c: a94657f6    	ldp	x22, x21, [sp, #0x60]
102aa3a10: a9455ff8    	ldp	x24, x23, [sp, #0x50]
102aa3a14: a9446ffc    	ldp	x28, x27, [sp, #0x40]
102aa3a18: 910203ff    	add	sp, sp, #0x80
102aa3a1c: d65f03c0    	ret
