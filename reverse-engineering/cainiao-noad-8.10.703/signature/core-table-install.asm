
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102aa9aec: 52800400    	mov	w0, #0x20               ; =32
102aa9af0: 94661e2c    	bl	0x1044313a0 <dyld_stub_binder+0x1044313a0>
102aa9af4: b40005c0    	cbz	x0, 0x102aa9bac <_CMa03SUie28mjv+0x44774>
102aa9af8: aa0003f3    	mov	x19, x0
102aa9afc: 52800400    	mov	w0, #0x20               ; =32
102aa9b00: d2800001    	mov	x1, #0x0                ; =0
102aa9b04: 94008fbb    	bl	0x102acd9f0 <_CMa03SUie28mjv+0x685b8>
102aa9b08: d001f268    	adrp	x8, 0x1068f7000 <dyld_stub_binder+0x1068f7000>
102aa9b0c: f9075100    	str	x0, [x8, #0xea0]
102aa9b10: 52800400    	mov	w0, #0x20               ; =32
102aa9b14: d2800001    	mov	x1, #0x0                ; =0
102aa9b18: 94008fb6    	bl	0x102acd9f0 <_CMa03SUie28mjv+0x685b8>
102aa9b1c: d001f268    	adrp	x8, 0x1068f7000 <dyld_stub_binder+0x1068f7000>
102aa9b20: f9075500    	str	x0, [x8, #0xea8]
102aa9b24: 10ffd9a8    	adr	x8, 0x102aa9658 <_CMa03SUie28mjv+0x44220>
102aa9b28: d503201f    	nop
102aa9b2c: 10ffed49    	adr	x9, 0x102aa98d4 <_CMa03SUie28mjv+0x4449c>
102aa9b30: d503201f    	nop
102aa9b34: a9002668    	stp	x8, x9, [x19]
102aa9b38: 10ffe028    	adr	x8, 0x102aa973c <_CMa03SUie28mjv+0x44304>
102aa9b3c: d503201f    	nop
102aa9b40: 10fff009    	adr	x9, 0x102aa9940 <_CMa03SUie28mjv+0x44508>
102aa9b44: d503201f    	nop
102aa9b48: a9012668    	stp	x8, x9, [x19, #0x10]
102aa9b4c: 52800d08    	mov	w8, #0x68               ; =104
102aa9b50: b9000be8    	str	w8, [sp, #0x8]
102aa9b54: 910033e8    	add	x8, sp, #0xc
102aa9b58: 910023e9    	add	x9, sp, #0x8
102aa9b5c: 10000027    	adr	x7, 0x102aa9b60 <_CMa03SUie28mjv+0x44728>
102aa9b60: 9800015a    	ldrsw	x26, 0x102aa9b88 <_CMa03SUie28mjv+0x44750>
102aa9b64: aa3a03fa    	mvn	x26, x26
102aa9b68: aa3a03fa    	mvn	x26, x26
102aa9b6c: 9102bb5a    	add	x26, x26, #0xae
102aa9b70: b9800125    	ldrsw	x5, [x9]
102aa9b74: 8b05035a    	add	x26, x26, x5
102aa9b78: 8b1a00e7    	add	x7, x7, x26
102aa9b7c: 528000f0    	mov	w16, #0x7               ; =7
102aa9b80: b9000110    	str	w16, [x8]
102aa9b84: d61f00e0    	br	x7
102aa9b88: ffffff2a    	<unknown>
102aa9b8c: ba73439a    	<unknown>
102aa9b90: 219d051f    	<unknown>
102aa9b94: c1560291    	fmls	za.s[w8, 1, vgx2], { z20.s, z21.s }, z6.s[0]
102aa9b98: ff7fbd2c    	<unknown>
102aa9b9c: 2089e8e4    	<unknown>
102aa9ba0: 9001f268    	adrp	x8, 0x1068f5000 <dyld_stub_binder+0x1068f5000>
102aa9ba4: f9072113    	str	x19, [x8, #0xe40]
