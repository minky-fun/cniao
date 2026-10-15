
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102abfd3c: f9400568    	ldr	x8, [x11, #0x8]
102abfd40: b4fff888    	cbz	x8, 0x102abfc50 <_CMa03SUie28mjv+0x5a818>
102abfd44: b9400909    	ldr	w9, [x8, #0x8]
102abfd48: 7100053f    	cmp	w9, #0x1
102abfd4c: 54fff82b    	b.lt	0x102abfc50 <_CMa03SUie28mjv+0x5a818>
102abfd50: f9400108    	ldr	x8, [x8]
102abfd54: f9400116    	ldr	x22, [x8]
102abfd58: f001de00    	adrp	x0, 0x106682000 <_OBJC_EHTYPE_$_NSError+0x15ebd0>
102abfd5c: 9124e000    	add	x0, x0, #0x938
102abfd60: 9465c812    	bl	0x104431da8 <dyld_stub_binder+0x104431da8>
102abfd64: b4fff816    	cbz	x22, 0x102abfc64 <_CMa03SUie28mjv+0x5a82c>
102abfd68: f94012c8    	ldr	x8, [x22, #0x20]
102abfd6c: b4fff7c8    	cbz	x8, 0x102abfc64 <_CMa03SUie28mjv+0x5a82c>
102abfd70: 52800029    	mov	w9, #0x1                ; =1
102abfd74: 39000289    	strb	w9, [x20]
102abfd78: a901d7e8    	stp	x8, x21, [sp, #0x18]
102abfd7c: 52800048    	mov	w8, #0x2                ; =2
102abfd80: f90017e8    	str	x8, [sp, #0x28]
102abfd84: b94016c8    	ldr	w8, [x22, #0x14]
102abfd88: f9001be8    	str	x8, [sp, #0x30]
102abfd8c: 528014a8    	mov	w8, #0xa5               ; =165
102abfd90: b90017e8    	str	w8, [sp, #0x14]
102abfd94: 910053e8    	add	x8, sp, #0x14
102abfd98: 10000025    	adr	x5, 0x102abfd9c <_CMa03SUie28mjv+0x5a964>
102abfd9c: 980000cd    	ldrsw	x13, 0x102abfdb4 <_CMa03SUie28mjv+0x5a97c>
102abfda0: b980011b    	ldrsw	x27, [x8]
102abfda4: cb1b01ad    	sub	x13, x13, x27
102abfda8: 8b0d00a5    	add	x5, x5, x13
102abfdac: d28013e8    	mov	x8, #0x9f               ; =159
102abfdb0: d61f00a0    	br	x5
102abfdb4: 000000d1    	udf	#0xd1
102abfdb8: 2be47d30    	<unknown>
102abfdbc: 78a0fc92    	<unknown>
102abfdc0: 079a712b    	<unknown>
102abfdc4: 028972d1    	<unknown>
102abfdc8: d001f1a8    	adrp	x8, 0x1068f5000 <dyld_stub_binder+0x1068f5000>
102abfdcc: f9472108    	ldr	x8, [x8, #0xe40]
102abfdd0: f9400508    	ldr	x8, [x8, #0x8]
102abfdd4: 910063e3    	add	x3, sp, #0x18
102abfdd8: 910043e4    	add	x4, sp, #0x10
102abfddc: 52800020    	mov	w0, #0x1                ; =1
102abfde0: 52800481    	mov	w1, #0x24               ; =36
102abfde4: 52800042    	mov	w2, #0x2                ; =2
102abfde8: d63f0100    	blr	x8
102abfdec: 17ffffa0    	b	0x102abfc6c <_CMa03SUie28mjv+0x5a834>
