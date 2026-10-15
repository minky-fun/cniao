
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102abfdf4: d100c3ff    	sub	sp, sp, #0x30
102abfdf8: a9016ffc    	stp	x28, x27, [sp, #0x10]
102abfdfc: a9027bfd    	stp	x29, x30, [sp, #0x20]
102abfe00: 910083fd    	add	x29, sp, #0x20
102abfe04: 52800d08    	mov	w8, #0x68               ; =104
102abfe08: b9000fe8    	str	w8, [sp, #0xc]
102abfe0c: 910033e8    	add	x8, sp, #0xc
102abfe10: 10000025    	adr	x5, 0x102abfe14 <_CMa03SUie28mjv+0x5a9dc>
102abfe14: 980000cd    	ldrsw	x13, 0x102abfe2c <_CMa03SUie28mjv+0x5a9f4>
102abfe18: b980011b    	ldrsw	x27, [x8]
102abfe1c: cb1b01ad    	sub	x13, x13, x27
102abfe20: 8b0d00a5    	add	x5, x5, x13
102abfe24: d28013e8    	mov	x8, #0x9f               ; =159
102abfe28: d61f00a0    	br	x5
102abfe2c: 00000098    	udf	#0x98
102abfe30: 2be47d30    	<unknown>
102abfe34: 78a0fc92    	<unknown>
102abfe38: 079a712b    	<unknown>
102abfe3c: 028972d1    	<unknown>
102abfe40: df7de61d    	<unknown>
102abfe44: 52800200    	mov	w0, #0x10               ; =16
102abfe48: 9465c556    	bl	0x1044313a0 <dyld_stub_binder+0x1044313a0>
102abfe4c: b40000e0    	cbz	x0, 0x102abfe68 <_CMa03SUie28mjv+0x5aa30>
102abfe50: f001de08    	adrp	x8, 0x106682000 <_OBJC_EHTYPE_$_NSError+0x15ebd0>
102abfe54: 91280108    	add	x8, x8, #0xa00
102abfe58: f9000008    	str	x8, [x0]
102abfe5c: b000eb08    	adrp	x8, 0x104820000 <dyld_stub_binder+0x104820000>
102abfe60: fd473500    	ldr	d0, [x8, #0xe68]
102abfe64: fd000400    	str	d0, [x0, #0x8]
102abfe68: a9427bfd    	ldp	x29, x30, [sp, #0x20]
102abfe6c: a9416ffc    	ldp	x28, x27, [sp, #0x10]
102abfe70: 9100c3ff    	add	sp, sp, #0x30
102abfe74: d65f03c0    	ret
