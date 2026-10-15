
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102b2c484 <_CMi03Zt2QbtMER>:
102b3d750: d10183ff    	sub	sp, sp, #0x60
102b3d754: a9016ffc    	stp	x28, x27, [sp, #0x10]
102b3d758: a9025ff8    	stp	x24, x23, [sp, #0x20]
102b3d75c: a90357f6    	stp	x22, x21, [sp, #0x30]
102b3d760: a9044ff4    	stp	x20, x19, [sp, #0x40]
102b3d764: a9057bfd    	stp	x29, x30, [sp, #0x50]
102b3d768: 910143fd    	add	x29, sp, #0x50
102b3d76c: 52800d28    	mov	w8, #0x69               ; =105
102b3d770: b90007e8    	str	w8, [sp, #0x4]
102b3d774: 910013e9    	add	x9, sp, #0x4
102b3d778: 10000028    	adr	x8, 0x102b3d77c <_CMi03Zt2QbtMER+0x112f8>
102b3d77c: 980000d8    	ldrsw	x24, 0x102b3d794 <_CMi03Zt2QbtMER+0x11310>
102b3d780: b9800136    	ldrsw	x22, [x9]
102b3d784: 8b160318    	add	x24, x24, x22
102b3d788: 8b180108    	add	x8, x8, x24
102b3d78c: d2801f69    	mov	x9, #0xfb               ; =251
102b3d790: d61f0100    	br	x8
102b3d794: ffffffbf    	<unknown>
102b3d798: 5acdf12f    	<unknown>
102b3d79c: 50eb96b4    	adr	x20, 0x102b14a72 <_CMa03SUie28mjv+0xaf63a>
102b3d7a0: 9e752336    	<unknown>
102b3d7a4: 7103d93f    	cmp	w9, #0xf6
102b3d7a8: 5400028b    	b.lt	0x102b3d7f8 <_CMi03Zt2QbtMER+0x11374>
102b3d7ac: b9000bff    	str	wzr, [sp, #0x8]
102b3d7b0: 528014a8    	mov	w8, #0xa5               ; =165
102b3d7b4: b9000fe8    	str	w8, [sp, #0xc]
102b3d7b8: 910033e8    	add	x8, sp, #0xc
102b3d7bc: 10000025    	adr	x5, 0x102b3d7c0 <_CMi03Zt2QbtMER+0x1133c>
102b3d7c0: 980000cd    	ldrsw	x13, 0x102b3d7d8 <_CMi03Zt2QbtMER+0x11354>
102b3d7c4: b980011b    	ldrsw	x27, [x8]
102b3d7c8: cb1b01ad    	sub	x13, x13, x27
102b3d7cc: 8b0d00a5    	add	x5, x5, x13
102b3d7d0: d28013e8    	mov	x8, #0x9f               ; =159
102b3d7d4: d61f00a0    	br	x5
102b3d7d8: 000000d1    	udf	#0xd1
102b3d7dc: 2be47d30    	<unknown>
102b3d7e0: 78a0fc92    	<unknown>
102b3d7e4: 079a712b    	<unknown>
102b3d7e8: 028972d1    	<unknown>
102b3d7ec: 9001ee08    	adrp	x8, 0x1068fd000 <dyld_stub_binder+0x1068fd000>
102b3d7f0: f9434913    	ldr	x19, [x8, #0x690]
102b3d7f4: b4000233    	cbz	x19, 0x102b3d838 <_CMi03Zt2QbtMER+0x113b4>
102b3d7f8: f9400268    	ldr	x8, [x19]
102b3d7fc: 10ffcf24    	adr	x4, 0x102b3d1e0 <_CMi03Zt2QbtMER+0x10d5c>
102b3d800: d503201f    	nop
102b3d804: 528000e0    	mov	w0, #0x7                ; =7
102b3d808: 52800441    	mov	w1, #0x22               ; =34
102b3d80c: 52800022    	mov	w2, #0x1                ; =1
102b3d810: 52800023    	mov	w3, #0x1                ; =1
102b3d814: d63f0100    	blr	x8
102b3d818: f9400268    	ldr	x8, [x19]
102b3d81c: 10ffdc04    	adr	x4, 0x102b3d39c <_CMi03Zt2QbtMER+0x10f18>
102b3d820: d503201f    	nop
102b3d824: 528000e0    	mov	w0, #0x7                ; =7
102b3d828: 52800441    	mov	w1, #0x22               ; =34
102b3d82c: 52800042    	mov	w2, #0x2                ; =2
102b3d830: 52800023    	mov	w3, #0x1                ; =1
102b3d834: d63f0100    	blr	x8
