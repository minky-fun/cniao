
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102ae0930: d10103ff    	sub	sp, sp, #0x40
102ae0934: a9016ffc    	stp	x28, x27, [sp, #0x10]
102ae0938: a9024ff4    	stp	x20, x19, [sp, #0x20]
102ae093c: a9037bfd    	stp	x29, x30, [sp, #0x30]
102ae0940: 9100c3fd    	add	x29, sp, #0x30
102ae0944: 528015e8    	mov	w8, #0xaf               ; =175
102ae0948: b90007e8    	str	w8, [sp, #0x4]
102ae094c: 910023e8    	add	x8, sp, #0x8
102ae0950: 910013e9    	add	x9, sp, #0x4
102ae0954: 1000002d    	adr	x13, 0x102ae0958 <_CMa03SUie28mjv+0x7b520>
102ae0958: 9800012c    	ldrsw	x12, 0x102ae097c <_CMa03SUie28mjv+0x7b544>
102ae095c: aa2c03ec    	mvn	x12, x12
102ae0960: aa2c03ec    	mvn	x12, x12
102ae0964: b980013b    	ldrsw	x27, [x9]
102ae0968: cb1b018c    	sub	x12, x12, x27
102ae096c: 8b0c01ad    	add	x13, x13, x12
102ae0970: 52800942    	mov	w2, #0x4a               ; =74
102ae0974: b9000102    	str	w2, [x8]
102ae0978: d61f01a0    	br	x13
102ae097c: 000000e7    	udf	#0xe7
102ae0980: 4db4e7ad    	<unknown>
102ae0984: fa666943    	<unknown>
102ae0988: 5df9ab8c    	<unknown>
102ae098c: 6bf052c7    	<unknown>
102ae0990: 528014a8    	mov	w8, #0xa5               ; =165
102ae0994: b9000fe8    	str	w8, [sp, #0xc]
102ae0998: 910033e8    	add	x8, sp, #0xc
102ae099c: 10000025    	adr	x5, 0x102ae09a0 <_CMa03SUie28mjv+0x7b568>
102ae09a0: 980000cd    	ldrsw	x13, 0x102ae09b8 <_CMa03SUie28mjv+0x7b580>
102ae09a4: b980011b    	ldrsw	x27, [x8]
102ae09a8: cb1b01ad    	sub	x13, x13, x27
102ae09ac: 8b0d00a5    	add	x5, x5, x13
102ae09b0: d28013e8    	mov	x8, #0x9f               ; =159
102ae09b4: d61f00a0    	br	x5
102ae09b8: 000000d1    	udf	#0xd1
102ae09bc: 2be47d30    	<unknown>
102ae09c0: 78a0fc92    	<unknown>
102ae09c4: 079a712b    	<unknown>
102ae09c8: 028972d1    	<unknown>
102ae09cc: b001f0a8    	adrp	x8, 0x1068f5000 <dyld_stub_binder+0x1068f5000>
102ae09d0: f9472113    	ldr	x19, [x8, #0xe40]
102ae09d4: b40013d3    	cbz	x19, 0x102ae0c4c <_CMa03SUie28mjv+0x7b814>
102ae09d8: f9400268    	ldr	x8, [x19]
102ae09dc: 10f7df24    	adr	x4, 0x102ad05c0 <_CMa03SUie28mjv+0x6b188>
102ae09e0: d503201f    	nop
102ae09e4: 52800020    	mov	w0, #0x1                ; =1
102ae09e8: 52800021    	mov	w1, #0x1                ; =1
102ae09ec: 52800022    	mov	w2, #0x1                ; =1
102ae09f0: 52800023    	mov	w3, #0x1                ; =1
102ae09f4: d63f0100    	blr	x8
102ae09f8: f9400268    	ldr	x8, [x19]
102ae09fc: 10d380e4    	adr	x4, 0x102a87a18 <_CMa03SUie28mjv+0x225e0>
102ae0a00: d503201f    	nop
102ae0a04: 52800020    	mov	w0, #0x1                ; =1
102ae0a08: 52800061    	mov	w1, #0x3                ; =3
102ae0a0c: 52800022    	mov	w2, #0x1                ; =1
102ae0a10: 52800023    	mov	w3, #0x1                ; =1
102ae0a14: d63f0100    	blr	x8
102ae0a18: f9400268    	ldr	x8, [x19]
102ae0a1c: 10d399c4    	adr	x4, 0x102a87d54 <_CMa03SUie28mjv+0x2291c>
102ae0a20: d503201f    	nop
102ae0a24: 52800020    	mov	w0, #0x1                ; =1
102ae0a28: 52800081    	mov	w1, #0x4                ; =4
102ae0a2c: 52800022    	mov	w2, #0x1                ; =1
102ae0a30: 52800023    	mov	w3, #0x1                ; =1
102ae0a34: d63f0100    	blr	x8
102ae0a38: f9400268    	ldr	x8, [x19]
102ae0a3c: 10d3b484    	adr	x4, 0x102a880cc <_CMa03SUie28mjv+0x22c94>
102ae0a40: d503201f    	nop
102ae0a44: 52800020    	mov	w0, #0x1                ; =1
102ae0a48: 52800081    	mov	w1, #0x4                ; =4
102ae0a4c: 52800042    	mov	w2, #0x2                ; =2
102ae0a50: 52800023    	mov	w3, #0x1                ; =1
102ae0a54: d63f0100    	blr	x8
102ae0a58: f9400268    	ldr	x8, [x19]
102ae0a5c: 10044a64    	adr	x4, 0x102ae93a8 <_CMa03SUie28mjv+0x83f70>
102ae0a60: d503201f    	nop
102ae0a64: 52800020    	mov	w0, #0x1                ; =1
102ae0a68: 528000a1    	mov	w1, #0x5                ; =5
102ae0a6c: 52800022    	mov	w2, #0x1                ; =1
102ae0a70: 52800023    	mov	w3, #0x1                ; =1
102ae0a74: d63f0100    	blr	x8
102ae0a78: f9400268    	ldr	x8, [x19]
102ae0a7c: 10ffcfe4    	adr	x4, 0x102ae0478 <_CMa03SUie28mjv+0x7b040>
102ae0a80: d503201f    	nop
102ae0a84: 52800020    	mov	w0, #0x1                ; =1
102ae0a88: 528000a1    	mov	w1, #0x5                ; =5
102ae0a8c: 52800042    	mov	w2, #0x2                ; =2
102ae0a90: 52800023    	mov	w3, #0x1                ; =1
102ae0a94: d63f0100    	blr	x8
102ae0a98: f9400268    	ldr	x8, [x19]
102ae0a9c: 10ffd404    	adr	x4, 0x102ae051c <_CMa03SUie28mjv+0x7b0e4>
102ae0aa0: d503201f    	nop
102ae0aa4: 52800020    	mov	w0, #0x1                ; =1
102ae0aa8: 528000e1    	mov	w1, #0x7                ; =7
102ae0aac: 52800022    	mov	w2, #0x1                ; =1
102ae0ab0: 52800023    	mov	w3, #0x1                ; =1
102ae0ab4: d63f0100    	blr	x8
102ae0ab8: f9400268    	ldr	x8, [x19]
102ae0abc: 10ffd964    	adr	x4, 0x102ae05e8 <_CMa03SUie28mjv+0x7b1b0>
102ae0ac0: d503201f    	nop
102ae0ac4: 52800020    	mov	w0, #0x1                ; =1
102ae0ac8: 52800101    	mov	w1, #0x8                ; =8
102ae0acc: 52800022    	mov	w2, #0x1                ; =1
102ae0ad0: 52800023    	mov	w3, #0x1                ; =1
102ae0ad4: d63f0100    	blr	x8
102ae0ad8: f9400268    	ldr	x8, [x19]
102ae0adc: 10ffdf24    	adr	x4, 0x102ae06c0 <_CMa03SUie28mjv+0x7b288>
102ae0ae0: d503201f    	nop
102ae0ae4: 52800020    	mov	w0, #0x1                ; =1
102ae0ae8: 52800121    	mov	w1, #0x9                ; =9
102ae0aec: 52800022    	mov	w2, #0x1                ; =1
102ae0af0: 52800023    	mov	w3, #0x1                ; =1
102ae0af4: d63f0100    	blr	x8
102ae0af8: f9400268    	ldr	x8, [x19]
102ae0afc: 10ffe504    	adr	x4, 0x102ae079c <_CMa03SUie28mjv+0x7b364>
102ae0b00: d503201f    	nop
102ae0b04: 52800020    	mov	w0, #0x1                ; =1
102ae0b08: 52800121    	mov	w1, #0x9                ; =9
102ae0b0c: 52800042    	mov	w2, #0x2                ; =2
102ae0b10: 52800023    	mov	w3, #0x1                ; =1
102ae0b14: d63f0100    	blr	x8
102ae0b18: f9400268    	ldr	x8, [x19]
102ae0b1c: 10ffea24    	adr	x4, 0x102ae0860 <_CMa03SUie28mjv+0x7b428>
102ae0b20: d503201f    	nop
102ae0b24: 52800020    	mov	w0, #0x1                ; =1
102ae0b28: 52800121    	mov	w1, #0x9                ; =9
102ae0b2c: 52800062    	mov	w2, #0x3                ; =3
102ae0b30: 52800023    	mov	w3, #0x1                ; =1
102ae0b34: d63f0100    	blr	x8
102ae0b38: f9400268    	ldr	x8, [x19]
102ae0b3c: 10dbd344    	adr	x4, 0x102a985a4 <_CMa03SUie28mjv+0x3316c>
102ae0b40: d503201f    	nop
102ae0b44: 52800020    	mov	w0, #0x1                ; =1
102ae0b48: 52800201    	mov	w1, #0x10               ; =16
102ae0b4c: 52800022    	mov	w2, #0x1                ; =1
102ae0b50: 52800023    	mov	w3, #0x1                ; =1
102ae0b54: d63f0100    	blr	x8
102ae0b58: f9400268    	ldr	x8, [x19]
102ae0b5c: 10d2a704    	adr	x4, 0x102a8603c <_CMa03SUie28mjv+0x20c04>
102ae0b60: d503201f    	nop
102ae0b64: 52800020    	mov	w0, #0x1                ; =1
102ae0b68: 52800241    	mov	w1, #0x12               ; =18
102ae0b6c: 52800022    	mov	w2, #0x1                ; =1
102ae0b70: 52800023    	mov	w3, #0x1                ; =1
102ae0b74: d63f0100    	blr	x8
102ae0b78: f9400268    	ldr	x8, [x19]
102ae0b7c: 1006cee4    	adr	x4, 0x102aee558 <_CMa03SUie28mjv+0x89120>
102ae0b80: d503201f    	nop
102ae0b84: 52800020    	mov	w0, #0x1                ; =1
102ae0b88: 528000c1    	mov	w1, #0x6                ; =6
102ae0b8c: 52800022    	mov	w2, #0x1                ; =1
102ae0b90: 52800023    	mov	w3, #0x1                ; =1
102ae0b94: d63f0100    	blr	x8
102ae0b98: f9400268    	ldr	x8, [x19]
102ae0b9c: 10eb85c4    	adr	x4, 0x102ab7c54 <_CMa03SUie28mjv+0x5281c>
102ae0ba0: d503201f    	nop
102ae0ba4: 52800020    	mov	w0, #0x1                ; =1
102ae0ba8: 52800341    	mov	w1, #0x1a               ; =26
102ae0bac: 52800022    	mov	w2, #0x1                ; =1
102ae0bb0: 52800023    	mov	w3, #0x1                ; =1
102ae0bb4: d63f0100    	blr	x8
102ae0bb8: f9400268    	ldr	x8, [x19]
102ae0bbc: 10eb9884    	adr	x4, 0x102ab7ecc <_CMa03SUie28mjv+0x52a94>
102ae0bc0: d503201f    	nop
102ae0bc4: 52800020    	mov	w0, #0x1                ; =1
102ae0bc8: 52800341    	mov	w1, #0x1a               ; =26
102ae0bcc: 52800042    	mov	w2, #0x2                ; =2
102ae0bd0: 52800023    	mov	w3, #0x1                ; =1
102ae0bd4: d63f0100    	blr	x8
102ae0bd8: f9400268    	ldr	x8, [x19]
102ae0bdc: 10e03104    	adr	x4, 0x102aa11fc <_CMa03SUie28mjv+0x3bdc4>
102ae0be0: d503201f    	nop
102ae0be4: 52800020    	mov	w0, #0x1                ; =1
102ae0be8: 528004a1    	mov	w1, #0x25               ; =37
102ae0bec: 52800022    	mov	w2, #0x1                ; =1
102ae0bf0: 52800023    	mov	w3, #0x1                ; =1
102ae0bf4: d63f0100    	blr	x8
102ae0bf8: f9400268    	ldr	x8, [x19]
102ae0bfc: 10e01d04    	adr	x4, 0x102aa0f9c <_CMa03SUie28mjv+0x3bb64>
102ae0c00: d503201f    	nop
102ae0c04: 52800020    	mov	w0, #0x1                ; =1
102ae0c08: 528004a1    	mov	w1, #0x25               ; =37
102ae0c0c: 52800042    	mov	w2, #0x2                ; =2
102ae0c10: 52800023    	mov	w3, #0x1                ; =1
102ae0c14: d63f0100    	blr	x8
102ae0c18: f9400268    	ldr	x8, [x19]
102ae0c1c: 10e74984    	adr	x4, 0x102aaf54c <_CMa03SUie28mjv+0x4a114>
102ae0c20: d503201f    	nop
102ae0c24: 52800020    	mov	w0, #0x1                ; =1
102ae0c28: 52800221    	mov	w1, #0x11               ; =17
102ae0c2c: 52800042    	mov	w2, #0x2                ; =2
102ae0c30: 52800023    	mov	w3, #0x1                ; =1
102ae0c34: d63f0100    	blr	x8
102ae0c38: a9437bfd    	ldp	x29, x30, [sp, #0x30]
102ae0c3c: a9424ff4    	ldp	x20, x19, [sp, #0x20]
102ae0c40: a9416ffc    	ldp	x28, x27, [sp, #0x10]
102ae0c44: 910103ff    	add	sp, sp, #0x40
102ae0c48: 17ff23df    	b	0x102aa9bc4 <_CMa03SUie28mjv+0x4478c>
102ae0c4c: a9437bfd    	ldp	x29, x30, [sp, #0x30]
102ae0c50: a9424ff4    	ldp	x20, x19, [sp, #0x20]
102ae0c54: a9416ffc    	ldp	x28, x27, [sp, #0x10]
102ae0c58: 910103ff    	add	sp, sp, #0x40
102ae0c5c: d65f03c0    	ret
